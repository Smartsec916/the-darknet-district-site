// Time questions through the real chat route, against an in-memory Postgres and a local stand-in for OpenAI (no real
// API calls): a plain time question is answered from the server's clock without the model, the clock is read again for
// every message, and a model reply that contradicts the verified time never reaches the visitor or the stored record.
process.env.IRIS_TEST_DB = "pglite";
import test, { before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import express from "express";

interface Captured { body: any }
let fake: http.Server;
let captured: Captured[] = [];
let script: string[] = [];

// Started before the service code is loaded: the OpenAI client reads its address once, at import
fake = http.createServer((req, res) => {
  let raw = "";
  req.on("data", c => { raw += c; });
  req.on("end", () => {
    const body = JSON.parse(raw || "{}");
    captured.push({ body });
    const isLanguageCheck = body.max_tokens === 10;
    const content = isLanguageCheck ? "english" : (script.shift() ?? "Default reply.");
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({
      id: "x", object: "chat.completion", created: 0, model: "gpt-4o",
      choices: [{ index: 0, message: { role: "assistant", content }, finish_reason: "stop" }],
      usage: { prompt_tokens: 100, completion_tokens: 20, total_tokens: 120 },
    }));
  });
});
await new Promise<void>(resolve => fake.listen(0, "127.0.0.1", resolve));
process.env.OPENAI_API_KEY = "sk-test-not-real";
process.env.OPENAI_BASE_URL = `http://127.0.0.1:${(fake.address() as AddressInfo).port}/v1`;
process.env.CHAT_LIMIT_PER_DAY = "100000";
process.env.CHAT_GLOBAL_DAILY_LIMIT = "100000";

const { dbQuery, closeDatabase } = await import("../server/db");
const { ensureSchema } = await import("../server/migrate");
const { registerRoutes } = await import("../server/routes");
const { clock } = await import("../server/timeService");

let api: http.Server;
let base = "";
let ip = 0;
const realNow = clock.now;
const BUG = Date.parse("2026-10-30T13:50:00Z"); // Beijing 21:50; the reported wrong answer was 14:50

before(async () => {
  const app = express();
  app.set("trust proxy", 1);
  app.use(express.json());
  await registerRoutes(app);
  await new Promise<void>(resolve => { api = app.listen(0, "127.0.0.1", resolve); });
  base = `http://127.0.0.1:${(api.address() as AddressInfo).port}`;
  await ensureSchema();
});
after(async () => { clock.now = realNow; api.close(); fake.closeAllConnections?.(); fake.close(); await closeDatabase(); });
beforeEach(() => { captured = []; script = []; clock.now = () => BUG; });

const post = (path: string, body: unknown) =>
  fetch(base + path, { method: "POST", headers: { "content-type": "application/json", "X-Forwarded-For": `10.8.${Math.floor(ip / 250)}.${(++ip % 250) + 1}` }, body: JSON.stringify(body) });
async function openSession() {
  const res = await post("/api/chat/session", {});
  assert.equal(res.status, 200);
  return (await res.json()) as { sessionId: string };
}
async function say(sessionId: string, message: string) {
  const res = await post("/api/chat/message", { sessionId, message });
  assert.equal(res.status, 200);
  return ((await res.json()) as any).response as string;
}
const mainCalls = () => captured.filter(c => c.body.max_tokens !== 10);
const systemText = (call: Captured) => call.body.messages.filter((m: any) => m.role === "system").map((m: any) => m.content).join("\n");
const storedReplies = async (sessionId: string) =>
  (await dbQuery(`SELECT message FROM chat_messages WHERE session_id = $1 AND sender = 'iris' ORDER BY id`, [sessionId])).rows.map((r: any) => r.message);

test("the reported question gets Beijing's real time, from the server's clock, without asking the model", async () => {
  const { sessionId } = await openSession();
  const reply = await say(sessionId, "现在是北京时间几点?");
  assert.match(reply, /21:50/);
  assert.doesNotMatch(reply, /14:50/);
  assert.match(reply, /UTC\+8/);
  assert.equal(mainCalls().length, 0, "a plain time question needs no model");
  const again = await say(sessionId, "现在在中国是几点?");
  assert.match(again, /中国现在是21:50/);
  assert.deepEqual(await storedReplies(sessionId), [reply, again]);
});

test("the clock is read again for every message", async () => {
  const { sessionId } = await openSession();
  const ticks = [Date.parse("2026-10-30T13:50:00Z"), Date.parse("2026-10-30T15:59:00Z"), Date.parse("2026-10-30T16:00:00Z")];
  let calls = 0;
  clock.now = () => ticks[Math.min(calls++, ticks.length - 1)];
  const replies = [];
  for (let i = 0; i < 3; i++) replies.push(await say(sessionId, "What time is it in Beijing?"));
  assert.match(replies[0], /21:50 \(9:50 PM\) on Friday, 30 October 2026/);
  assert.match(replies[1], /23:59 \(11:59 PM\) on Friday, 30 October 2026/);
  assert.match(replies[2], /00:00 \(12:00 AM\) on Saturday, 31 October 2026/);
  assert.equal(calls, 3);
});

test("a longer message goes to the model with the verified time, and a wrong time she writes is corrected in her own words", async () => {
  const { sessionId } = await openSession();
  script = ["Ha. It's 14:50 in Beijing right now, runner, and the District is buzzing."];
  const reply = await say(sessionId, "Hey Iris, I lost track of time down here. What time is it in Beijing right now? And is the District busy tonight?");
  const call = mainCalls()[0];
  assert.ok(call, "the model was asked");
  assert.match(systemText(call), /it is 2026-10-30 13:50 UTC/);
  assert.match(systemText(call), /VERIFIED CLOCK[\s\S]*Beijing \(Asia\/Shanghai, UTC\+8\): 2026-10-30 21:50/);
  assert.match(call.body.messages.at(-1).content, /TIME RULE/, "the rule is the last thing she reads");
  assert.equal(reply, "Ha. It's 21:50 in Beijing right now, runner, and the District is buzzing.");
  assert.deepEqual(await storedReplies(sessionId), [reply], "the stored record holds what the visitor saw");
  // Her own short-term history holds the corrected reply too, so she does not repeat the wrong time later
  script = ["Anything else?"];
  await say(sessionId, "thanks");
  const history = mainCalls()[1].body.messages.filter((m: any) => m.role === "assistant").map((m: any) => m.content);
  assert.ok(history.includes(reply));
  assert.ok(!history.some((t: string) => t.includes("14:50")));
});

test("a reply that agrees with the verified time is kept as she wrote it", async () => {
  const { sessionId } = await openSession();
  const words = "It's 21:50 in Beijing, runner. The neon's just warming up and the District is loud tonight.";
  script = [words];
  const reply = await say(sessionId, "Hey Iris, quick one: what time is it in Beijing right now? Also, is the District busy tonight?");
  assert.equal(reply, words);
});

test("every ordinary message carries the server's current UTC time, never as the visitor's local time", async () => {
  const { sessionId } = await openSession();
  script = ["Hello there."];
  const reply = await say(sessionId, "Hello Iris, what's new in the store?");
  assert.equal(reply, "Hello there.");
  const text = systemText(mainCalls()[0]);
  assert.match(text, /SERVER CLOCK \(read from the system clock for this message\): it is 2026-10-30 13:50 UTC/);
  assert.match(text, /Never present UTC as their local time/);
  assert.doesNotMatch(text, /VERIFIED CLOCK for the places/);
});

test("her own time: she asks where the visitor is instead of guessing", async () => {
  const { sessionId } = await openSession();
  const reply = await say(sessionId, "现在几点了？");
  assert.match(reply, /UTC/);
  assert.match(reply, /13:50/);
  assert.doesNotMatch(reply, /21:50/, "a Chinese question is not taken to mean Beijing");
  assert.match(reply, /哪个城市或时区/);
});

test("the original bug through the real route: UTC's time presented as Beijing time never reaches the visitor", async () => {
  const { sessionId } = await openSession();
  // 13:50 is the correct UTC time at this instant, which is why a check that only asked "is this a verified time?"
  // would have let it through
  script = ["北京时间现在是13:50，夜猫子，区里正热闹。"];
  const reply = await say(sessionId, "嘿，Iris，我在区里逛了一晚上，完全忘了时间。现在是北京时间几点？今晚区里热闹吗？");
  assert.equal(mainCalls().length, 1, "the longer message went to the model");
  assert.equal(reply, "北京时间现在是21:50，夜猫子，区里正热闹。");
  assert.deepEqual(await storedReplies(sessionId), [reply]);
});

test("several cities through the real route: swapped times are put back, each with its own city", async () => {
  const { sessionId } = await openSession();
  script = ["Tokyo's sitting at 13:50 and London at 22:50, runner. Both cities are wide awake."];
  const reply = await say(sessionId, "Hey Iris, settle a bet for me: what time is it in Tokyo and London right now? And who's awake?");
  assert.equal(reply, "Tokyo's sitting at 22:50 and London at 13:50, runner. Both cities are wide awake.");
});

test("a reply that cannot be pinned to a place is replaced by the verified answer", async () => {
  const { sessionId } = await openSession();
  script = ["北京时间13:50（UTC），别熬夜了。"];
  const reply = await say(sessionId, "嘿，Iris，我在区里逛了一晚上。现在是北京时间几点？今晚区里热闹吗？");
  assert.match(reply, /北京现在是21:50，2026年10月30日星期五（UTC\+8）。$/);
  assert.doesNotMatch(reply, /13:50/);
});
