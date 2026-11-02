// Live information through the real chat route, against an in-memory Postgres, a local stand-in for OpenAI and a stand-in
// network (no real API or internet calls). Proves the parts work together: asked-for data reaches the model fenced and
// for one reply only, ordinary chat fetches nothing, a reply that invents a figure never reaches the visitor or the stored
// record, visitors do not share follow-ups, and her existing prompt layers are untouched.
process.env.IRIS_TEST_DB = "pglite";
import test, { before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import type { AddressInfo } from "node:net";
import express from "express";

interface Captured { body: any }
let fake: http.Server;
let captured: Captured[] = [];
let script: string[] = [];
fake = http.createServer((req, res) => {
  let raw = "";
  req.on("data", c => { raw += c; });
  req.on("end", () => {
    const body = JSON.parse(raw || "{}");
    captured.push({ body });
    const content = body.max_tokens === 10 ? "english" : (script.shift() ?? "Default reply.");
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ id: "x", object: "chat.completion", created: 0, model: "gpt-4o", choices: [{ index: 0, message: { role: "assistant", content }, finish_reason: "stop" }], usage: { prompt_tokens: 100, completion_tokens: 20, total_tokens: 120 } }));
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
const { net } = await import("../server/live/http");
const { resetGeocodeForTests, setGeocodeGapForTests } = await import("../server/live/geocode");
const { resetWeatherForTests } = await import("../server/live/weather");
const { resetQuakesForTests } = await import("../server/live/quakes");
const { resetNewsForTests } = await import("../server/live/news");
const { resetLiveForTests } = await import("../server/live");
const { dice, resetCommentaryForTests } = await import("../server/live/commentary");
const realDice = dice.next;

const fixture = (name: string) => fs.readFileSync(new URL(`./fixtures/live/${name}`, import.meta.url), "utf8");
const ok = (body: string) => new Response(body, { status: 200, headers: { "content-type": "application/json" } });
const realFetch = net.fetch;
let calls: string[] = [];
let providersDown = false;
function standardNetwork() {
  net.fetch = async (url: string) => {
    calls.push(url);
    const u = new URL(url);
    if (providersDown && u.hostname !== "nominatim.openstreetmap.org") return new Response("down", { status: 500 });
    if (u.hostname === "nominatim.openstreetmap.org") {
      const q = (u.searchParams.get("q") ?? "").split(",")[0].trim();
      return fs.existsSync(new URL(`./fixtures/live/nominatim-${q}.json`, import.meta.url)) ? ok(fixture(`nominatim-${q}.json`)) : ok("[]");
    }
    if (u.hostname === "api.met.no") return ok(fixture("met-sacramento.json"));
    if (u.hostname === "api.weather.gov") return ok(JSON.stringify({ features: [] }));
    return new Response("not found", { status: 404 });
  };
}

let api: http.Server;
let base = "";
let ip = 0;
const realNow = clock.now;
const AT = Date.parse("2026-11-01T18:00:00Z");

before(async () => {
  const app = express();
  app.set("trust proxy", 1);
  app.use(express.json());
  await registerRoutes(app);
  await new Promise<void>(resolve => { api = app.listen(0, "127.0.0.1", resolve); });
  base = `http://127.0.0.1:${(api.address() as AddressInfo).port}`;
  await ensureSchema();
  setGeocodeGapForTests(0);
});
after(async () => { clock.now = realNow; net.fetch = realFetch; api.close(); fake.closeAllConnections?.(); fake.close(); await closeDatabase(); });
beforeEach(() => {
  captured = []; script = []; calls = []; providersDown = false; clock.now = () => AT;
  resetGeocodeForTests(); resetWeatherForTests(); resetQuakesForTests(); resetNewsForTests(); resetLiveForTests(); setGeocodeGapForTests(0);
  resetCommentaryForTests(); dice.next = realDice;
  standardNetwork();
});

const post = (path: string, body: unknown) =>
  fetch(base + path, { method: "POST", headers: { "content-type": "application/json", "X-Forwarded-For": `10.9.${Math.floor(ip / 250)}.${(++ip % 250) + 1}` }, body: JSON.stringify(body) });
async function openSession() { const res = await post("/api/chat/session", {}); assert.equal(res.status, 200); return (await res.json()) as { sessionId: string }; }
async function say(sessionId: string, message: string) {
  const res = await post("/api/chat/message", { sessionId, message });
  assert.equal(res.status, 200);
  return ((await res.json()) as any).response as string;
}
const mainCalls = () => captured.filter(c => c.body.max_tokens !== 10);
const systemText = (call: Captured) => call.body.messages.filter((m: any) => m.role === "system").map((m: any) => m.content).join("\n");
const stored = async (sessionId: string) => (await dbQuery("SELECT sender, message FROM chat_messages WHERE session_id = $1 ORDER BY id", [sessionId])).rows as Array<{ sender: string; message: string }>;

test("asked-for weather reaches the model fenced, for that reply only, and her existing layers are still there", async () => {
  const { sessionId } = await openSession();
  script = ["Sacramento is 11°C (52°F) and clear. My cooling fans are almost disappointed."];
  const reply = await say(sessionId, "What's the weather in Sacramento?");
  assert.equal(reply, "Sacramento is 11°C (52°F) and clear. My cooling fans are almost disappointed.");
  const call = mainCalls()[0];
  const sys = systemText(call);
  assert.match(sys, /<<<LIVE-DATA-[0-9a-f]{8}>>>[\s\S]*WEATHER for Sacramento, California, United States/);
  assert.match(sys, /Mood context:/, "her mood layer is still there");
  assert.match(sys, /SERVER CLOCK/, "the verified clock is still there");
  assert.match(sys, /Live data rule: use only the LIVE DATA facts/);
  assert.ok(call.body.max_tokens >= 250, "room for a real answer (190 + the mood state line): " + call.body.max_tokens);
  assert.equal(call.body.temperature, 0.8);
  // next ordinary message: no live data, nothing fetched, nothing carried over
  calls = []; captured = [];
  await say(sessionId, "you're funny");
  assert.equal(calls.length, 0, "ordinary chat makes no provider request");
  assert.ok(!/LIVE DATA/.test(mainCalls().map(systemText).join("\n")), "the live block is not carried into the next reply");
  assert.ok(mainCalls()[0].body.max_tokens <= 230, "ordinary replies stay short: " + mainCalls()[0].body.max_tokens);
});

test("a reply that invents a temperature never reaches the visitor or the stored conversation", async () => {
  const { sessionId } = await openSession();
  script = ["It's a scorching 99°F in Sacramento. Blame corporate smog."];
  const reply = await say(sessionId, "how hot is Sacramento right now?");
  assert.ok(!reply.includes("99"), reply);
  assert.match(reply, /Sacramento right now: 11°C \(51\.8°F\)/);
  const rows = await stored(sessionId);
  assert.ok(rows.every(r => !r.message.includes("99°F")), "the stored reply is the corrected one");
  assert.equal(rows.find(r => r.sender === "iris")!.message, reply);
  // and the model's own short-term history holds the corrected text, not the invented one
  captured = []; script = ["Anything else?"];
  await say(sessionId, "ok");
  const history = JSON.stringify(mainCalls()[0].body.messages);
  assert.ok(!history.includes("99°F"));
});

test("provider failure: she is told she could not look, and no weather is made up", async () => {
  providersDown = true;
  const { sessionId } = await openSession();
  script = ["The weather feeds are not answering, runner. Ask me again in a minute."];
  const reply = await say(sessionId, "What's the weather in Sacramento?");
  assert.equal(reply, "The weather feeds are not answering, runner. Ask me again in a minute.");
  const sys = systemText(mainCalls()[0]);
  assert.match(sys, /could NOT retrieve the live information/);
  assert.match(sys, /Do not state, guess or invent/);
  assert.ok(!/Now: \d/.test(sys), "no conditions were given to the model");
});

test("a missing place is asked for, an ambiguous one is clarified, and neither fetches a forecast", async () => {
  const { sessionId } = await openSession();
  script = ["Which city, runner?"];
  await say(sessionId, "what's the weather like outside?");
  assert.match(systemText(mainCalls()[0]), /did not say where they are/);
  assert.equal(calls.filter(u => u.includes("api.met.no")).length, 0);
  captured = []; script = ["Portland, Oregon or Maine?"];
  await say(sessionId, "weather in Portland");
  assert.match(systemText(mainCalls()[0]), /could be several places: Portland, Oregon/);
  assert.equal(calls.filter(u => u.includes("api.met.no")).length, 0);
});

test("an ambiguous place never reaches the visitor with an outage excuse, even if the model writes one", async () => {
  const { sessionId } = await openSession();
  script = ["Seems like the data streams are a bit clogged up, and I can't retrieve Portland's weather. Which Portland, Oregon or Maine?"];
  const reply = await say(sessionId, "What's the weather in Portland?");
  assert.doesNotMatch(reply, /clogged|retrieve|streams/i);
  assert.match(reply, /^Which Portland do you mean: Portland, Oregon/);
  assert.equal(calls.filter(u => u.includes("api.met.no")).length, 0, "and still no forecast is fetched");
});

test("visitors do not share follow-ups, and automatic browser messages never fetch anything", async () => {
  const a = await openSession(), b = await openSession();
  script = ["Clear and mild."];
  await say(a.sessionId, "What's the weather in Sacramento?");
  captured = []; calls = []; script = ["Tomorrow looks similar."];
  await say(a.sessionId, "and tomorrow?");
  assert.match(systemText(mainCalls()[0]), /WEATHER for Sacramento/, "the same visitor's follow-up works");
  captured = []; calls = []; script = ["Tomorrow what?"];
  await say(b.sessionId, "and tomorrow?");
  assert.ok(!/LIVE DATA/.test(systemText(mainCalls()[0])), "another visitor's 'and tomorrow?' is just chat");
  assert.equal(calls.length, 0);
  captured = []; calls = []; script = ["Hm."];
  await say(a.sessionId, "[user triggered devtools] what's the weather in Tokyo?");
  assert.equal(calls.length, 0, "an automatic trigger never reaches a provider");
});

test("worldwide time: a place the built-in list lacks is looked up and answered from the server clock, without the model", async () => {
  const { sessionId } = await openSession();
  const reply = await say(sessionId, "What time is it in Reykjavik?");
  assert.match(reply, /Reykjavik/);
  assert.match(reply, /\b18:00\b/, "Iceland is on UTC all year: 18:00 at this instant");
  assert.equal(mainCalls().length, 0, "answered word for word from the clock; the model is not asked");
  const unknown = await say(sessionId, "What time is it in Qwertyland?");
  assert.match(unknown, /don't have a verified clock for Qwertyland/);
  const portland = await say(sessionId, "what time is it in Portland?");
  assert.match(portland, /could mean more than one place/);
});

test("the earthquake and news answers work through the route too, and a link she was not given is removed", async () => {
  net.fetch = async (url: string) => {
    calls.push(url);
    const u = new URL(url);
    if (u.hostname === "earthquake.usgs.gov") return ok(fixture("usgs-4.5-day.json"));
    if (u.hostname === "feeds.bbci.co.uk" && u.pathname.includes("technology")) return new Response(fixture("rss-bbc-technology.xml"), { status: 200 });
    return new Response("no", { status: 404 });
  };
  const { sessionId } = await openSession();
  clock.now = () => 1793553753000;
  script = ["A M6.0 off Vanuatu leads the list. The planet is restless."];
  const quake = await say(sessionId, "any earthquakes today?");
  assert.match(systemText(mainCalls()[0]), /EARTHQUAKES worldwide/);
  assert.equal(quake, "A M6.0 off Vanuatu leads the list. The planet is restless.");
  captured = []; script = ["A magnitude 8.9 just flattened a city!"];
  const wrong = await say(sessionId, "any earthquakes today?");
  assert.ok(!wrong.includes("8.9"), wrong);
  assert.match(wrong, /Latest from the US Geological Survey/);
  captured = []; clock.now = () => AT; script = ["Read it at https://fake-news.example/story if you dare."];
  const news = await say(sessionId, "What's the latest tech news?");
  assert.match(systemText(mainCalls()[0]), /NEWS on tech/);
  assert.ok(!news.includes("fake-news.example"), news);
});

test("her ordinary conversation is unchanged: no live block, no extra requests, normal reply length", async () => {
  const { sessionId } = await openSession();
  for (const text of ["hello Iris", "tell me about the District", "I'm feeling under the weather", "do you read the news?", "I had a great time in Tokyo"]) {
    captured = []; calls = []; script = ["Noted."];
    const reply = await say(sessionId, text);
    assert.equal(reply, "Noted.", text);
    assert.equal(calls.length, 0, `${text}: no provider request`);
    assert.ok(!/LIVE DATA/.test(systemText(mainCalls()[0])), `${text}: no live block`);
    assert.ok(mainCalls()[0].body.max_tokens <= 230, `${text}: normal length (${mainCalls()[0].body.max_tokens})`);
  }
});

test("commentary through the route: the stance sits beside her mood layer, serious subjects are respectful, other languages get native guidance", async () => {
  const { sessionId } = await openSession();
  dice.next = () => 0.999; // always past "straight" (the first weight, whatever her mood), so she makes a remark
  script = ["Sacramento is 11°C and clear. Even the sky looks overpaid."];
  const reply = await say(sessionId, "What's the weather in Sacramento?");
  assert.equal(reply, "Sacramento is 11°C and clear. Even the sky looks overpaid.", "her remark passes through untouched when the facts are right");
  const sys = systemText(mainCalls()[0]);
  assert.match(sys, /COMMENTARY FOR THIS REPLY \(stance: (wry|skeptical|curious|warm|defend)\)/);
  assert.match(sys, /SOURCE NOTES[\s\S]*One forecast model is the only source/);
  assert.match(sys, /Mood context:/, "her mood layer is still there, and the stance does not replace it");
  assert.match(sys, /CHARACTER CORE/, "so is her persona");
  // a joke cannot carry a wrong number
  captured = []; resetCommentaryForTests(); script = ["It is 99°F, which is hilarious."];
  const wrong = await say(sessionId, "what's the weather in Sacramento again?");
  assert.ok(!wrong.includes("99"));
  // serious: the day's earthquake list contains a magnitude 6
  net.fetch = async (url: string) => (new URL(url).hostname === "earthquake.usgs.gov" ? ok(fixture("usgs-4.5-day.json")) : new Response("no", { status: 404 }));
  clock.now = () => 1793553753000; captured = []; script = ["A magnitude 6 off Vanuatu leads the list. I hope everyone there is safe."];
  await say(sessionId, "any earthquakes today?");
  assert.match(systemText(mainCalls()[0]), /stance: respectful/);
  assert.match(systemText(mainCalls()[0]), /No jokes, no sarcasm, no flirting/);
  // Spanish: native guidance, whatever the stance gave her a remark
  standardNetwork(); clock.now = () => AT; resetCommentaryForTests(); dice.next = () => 0.999; captured = []; script = ["Sacramento tiene 11°C y cielo despejado."];
  await say(sessionId, "¿Qué tiempo hace en Sacramento?");
  assert.match(systemText(mainCalls()[0]), /colloquial Spanish/);
});
