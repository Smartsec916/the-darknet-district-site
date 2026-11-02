// A Japanese visitor message once showed up in the administrator viewer as "??????????" while Iris answered in Japanese. This test sends real
// UTF-8 through the whole server path (HTTP body, language detection, the model call, storage, the administrator API and viewer page)
// and checks every code point comes back, in every language Iris supports plus Korean, mixed text and emoji. It also records what the
// server does with a message that ARRIVES as question marks (a client that already lost the characters): it keeps what it received.
// In-memory Postgres and a local stand-in for OpenAI; no network.
process.env.IRIS_TEST_DB = "pglite";
import test, { before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import express from "express";

let fake: http.Server;
let script: string[] = [];
const seenByModel: string[] = []; // the last visitor message in each model call, as the model received it
fake = http.createServer((req, res) => {
  let raw = "";
  req.setEncoding("utf8");
  req.on("data", c => { raw += c; });
  req.on("end", () => {
    const body = JSON.parse(raw || "{}");
    const lastUser = [...(body.messages ?? [])].reverse().find((m: any) => m.role === "user")?.content ?? "";
    if (body.max_tokens !== 10) seenByModel.push(String(lastUser));
    // the language detector call: answer by script, as the real one would
    const detected = /[぀-ヿ]/.test(lastUser) ? "japanese" : /[가-힯]/.test(lastUser) ? "korean" : /[Ѐ-ӿ]/.test(lastUser) ? "russian"
      : /[一-鿿]/.test(lastUser) ? "chinese" : /[¿¡ñáéíóúü]/i.test(lastUser) ? "spanish" : "english";
    const content = body.max_tokens === 10 ? detected : (script.shift() ?? "Default reply.");
    res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ id: "x", object: "chat.completion", created: 0, model: "gpt-4o", choices: [{ index: 0, message: { role: "assistant", content }, finish_reason: "stop" }], usage: { prompt_tokens: 100, completion_tokens: 20, total_tokens: 120 } }));
  });
});
await new Promise<void>(resolve => fake.listen(0, "127.0.0.1", resolve));
process.env.OPENAI_API_KEY = "sk-test-not-real";
process.env.OPENAI_BASE_URL = `http://127.0.0.1:${(fake.address() as AddressInfo).port}/v1`;
process.env.CHAT_LIMIT_PER_DAY = "100000";
process.env.CHAT_GLOBAL_DAILY_LIMIT = "100000";
const ADMIN_TOKEN = "u".repeat(20) + "v".repeat(20) + "-unicode-admin-token";
process.env.IRIS_ADMIN_TOKEN = ADMIN_TOKEN;
process.env.IRIS_ADMIN_VIEWER = "on";

const { dbQuery, closeDatabase } = await import("../server/db");
const { ensureSchema } = await import("../server/migrate");
const { registerRoutes } = await import("../server/routes");
const { createAdminRouter } = await import("../server/admin");
const { clock } = await import("../server/timeService");

let api: http.Server;
let base = "";
let ip = 0;
const realNow = clock.now;
const AT = Date.parse("2026-11-01T18:00:00Z"); // 02:00 on 2 November in Beijing, 03:00 in Tokyo, 18:00 in London

before(async () => {
  const app = express();
  app.set("trust proxy", 1);
  app.use(express.json());
  await registerRoutes(app);
  app.use(createAdminRouter());
  await new Promise<void>(resolve => { api = app.listen(0, "127.0.0.1", resolve); });
  base = `http://127.0.0.1:${(api.address() as AddressInfo).port}`;
  await ensureSchema();
});
after(async () => { clock.now = realNow; api.close(); fake.closeAllConnections?.(); fake.close(); await closeDatabase(); });
beforeEach(() => { script = []; seenByModel.length = 0; clock.now = () => AT; });

const nextIp = () => `10.8.${Math.floor(ip / 250)}.${(++ip % 250) + 1}`;
// The body goes out as explicit UTF-8 bytes, so what the server receives does not depend on this test process's own encoding
const postBytes = (path: string, json: unknown, contentType = "application/json") =>
  fetch(base + path, { method: "POST", headers: { "content-type": contentType, "X-Forwarded-For": nextIp() }, body: Buffer.from(JSON.stringify(json), "utf8") });
async function openSession() { const res = await postBytes("/api/chat/session", {}); assert.equal(res.status, 200); return ((await res.json()) as { sessionId: string }).sessionId; }
async function say(sessionId: string, message: string, contentType?: string) {
  const res = await postBytes("/api/chat/message", { sessionId, message }, contentType);
  assert.equal(res.status, 200);
  return ((await res.json()) as any).response as string;
}
const adminGet = (path: string) => fetch(base + path, { headers: { authorization: `Bearer ${ADMIN_TOKEN}`, "X-Forwarded-For": nextIp() } });
const points = (s: string) => [...s].map(c => c.codePointAt(0)!.toString(16)).join(" ");

const CASES: Array<[string, string, string]> = [
  ["japanese (hiragana, katakana, kanji)", "北京は今何時ですか？ひらがな、カタカナ、漢字。サクラメントの天気は！", "ありがとう。北京の時間ですね。"],
  ["simplified chinese", "北京现在几点？请告诉我今天的天气怎么样！", "现在是北京时间。"],
  ["traditional chinese", "東京現在幾點？請告訴我今天的天氣如何！", "現在是東京時間。"],
  ["korean", "도쿄는 지금 몇 시예요? 안녕하세요, 날씨는 어때요!", "안녕하세요. 도쿄 시간이에요."],
  ["russian", "Сколько сейчас времени в Токио? Привет, как дела!", "Сейчас в Токио утро."],
  ["spanish with accents", "¿Qué hora es en Madrid? Canción, niño, acción, ¡qué día! Ñandú.", "¡Hola! Son las tres de la tarde, señor."],
  ["english", "What time is it in London? It's 5 o'clock, isn't it?", "Right on schedule, runner."],
  ["mixed languages, punctuation and emoji", "Hello こんにちは 你好 안녕 Привет ¡Hola! 👋😀🇯🇵 — “quotes”, 『括弧』, ½ & <b>tag</b> … ok?!", "👍 了解です — понял! ¡Claro! 🇯🇵"],
];

let reachedModel = 0;
test("every language survives the browser-to-database-to-administrator round trip, with and without a charset in the request", async () => {
  for (const [name, visitor, reply] of CASES) {
    for (const contentType of ["application/json", "application/json; charset=utf-8"]) {
      const sessionId = await openSession();
      script = [reply];
      seenByModel.length = 0; // per case, so an earlier case cannot satisfy this one
      const answer = await say(sessionId, visitor, contentType);
      assert.equal(typeof answer, "string");

      // when the model is called (a time question is answered by the time service instead), it receives exactly what was sent
      if (seenByModel.length) { reachedModel++; assert.ok(seenByModel.some(m => m.includes(visitor)), `${name}: the model received the visitor text intact; it got: ${JSON.stringify(seenByModel)}`); }

      // stored in the database, character for character
      const rows = (await dbQuery(`SELECT sender, message FROM chat_messages WHERE session_id = $1 ORDER BY id`, [sessionId])).rows as Array<{ sender: string; message: string }>;
      const stored = rows.find(r => r.sender === "user")!;
      assert.equal(points(stored.message), points(visitor), `${name} (${contentType}): stored message`);
      assert.ok(!/^\?+$/.test(stored.message.replace(/\s/g, "")), `${name}: not question marks`);

      // and read back by the administrator API as the same code points
      const res = await adminGet(`/api/admin/conversations/${sessionId}`);
      assert.equal(res.status, 200);
      assert.match(res.headers.get("content-type") ?? "", /application\/json/);
      const detail = (await res.json()) as { messages: Array<{ sender: string; message: string }> };
      assert.equal(points(detail.messages.find(m => m.sender === "user")!.message), points(visitor), `${name}: administrator API`);
      const irisRow = detail.messages.find(m => m.sender === "iris")!;
      assert.equal(typeof irisRow.message, "string");
    }
  }
  assert.ok(reachedModel >= 2, `some of these messages must reach the model, or the check above proves nothing (${reachedModel})`);
});

test("Iris's own replies in each language are stored and shown intact too", async () => {
  const sessionId = await openSession();
  const reply = "👍 了解です — понял! ¡Claro! 🇯🇵 안녕하세요.";
  script = [reply];
  await say(sessionId, "Say hello in many languages please, friend of mine.");
  const detail = (await (await adminGet(`/api/admin/conversations/${sessionId}`)).json()) as { messages: Array<{ sender: string; message: string }> };
  const irisRow = detail.messages.find(m => m.sender === "iris")!;
  assert.equal(points(irisRow.message), points(reply));
});

test("the administrator page itself declares UTF-8", async () => {
  const res = await fetch(base + "/admin", { headers: { "X-Forwarded-For": nextIp() } });
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.match(html, /<meta charset="utf-8">/i);
  assert.match(res.headers.get("content-type") ?? "", /text\/html/);
});

test("time questions are still answered correctly in English, Chinese and Japanese", async () => {
  const sessionId = await openSession();
  const english = await say(sessionId, "What time is it in Beijing?");
  assert.match(english, /02:00/);
  const chinese = await say(sessionId, "北京现在几点？");
  assert.match(chinese, /02:00/);
  assert.match(chinese, /[一-鿿]/);
  const japanese = await say(sessionId, "北京は今何時ですか？");
  assert.match(japanese, /02:00/);
  assert.match(japanese, /[぀-ヿ]/, "answered in Japanese");
  // and each one is stored as sent
  const stored = (await dbQuery(`SELECT message FROM chat_messages WHERE session_id = $1 AND sender = 'user' ORDER BY id`, [sessionId])).rows.map((r: any) => r.message);
  assert.deepEqual(stored, ["What time is it in Beijing?", "北京现在几点？", "北京は今何時ですか？"]);
});

test("a message that ARRIVES as question marks is stored as received: the server cannot restore what the client already lost", async () => {
  const sessionId = await openSession();
  await say(sessionId, "What time is it in Beijing?");
  await say(sessionId, "??????????"); // what Windows PowerShell 5.1 sends for a Japanese string body with no charset
  const rows = (await dbQuery(`SELECT message, octet_length(message) AS bytes FROM chat_messages WHERE session_id = $1 AND sender = 'user' ORDER BY id`, [sessionId])).rows as any[];
  assert.equal(rows[1].message, "??????????");
  assert.equal(Number(rows[1].bytes), 10, "ten ASCII bytes: nothing was added or converted on the server");
});
