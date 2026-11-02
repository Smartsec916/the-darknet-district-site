// The Mischief Engine through the real chat routes, against an in-memory Postgres and a local stand-in for OpenAI (no real API calls, no
// cost, no production data): what the model is actually sent over realistic multi-turn conversations, what a visitor can see, and that
// the mood, memory, live-data and time systems behave exactly as before. The stand-in cannot judge humour; what it proves is what Iris is
// told and that the safeguards hold. Whether the real model follows the instructions well is a separate, paid evaluation.
process.env.IRIS_TEST_DB = "pglite";
import test, { before, after, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import express from "express";

interface Captured { body: any }
let fake: http.Server;
let captured: Captured[] = [];
let script: string[] = [];
fake = http.createServer((req, res) => {
  let raw = "";
  req.setEncoding("utf8");
  req.on("data", c => { raw += c; });
  req.on("end", () => {
    const body = JSON.parse(raw || "{}");
    captured.push({ body });
    const last = [...(body.messages ?? [])].reverse().find((m: any) => m.role === "user")?.content ?? "";
    // the language check answers by script, like the real one
    const detected = /[぀-ヿ]/.test(last) ? "japanese" : /[Ѐ-ӿ]/.test(last) ? "russian" : /[一-鿿]/.test(last) ? "chinese" : /[¿¡ñáéíóú]/i.test(last) ? "spanish" : "english";
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

const { dbQuery, closeDatabase } = await import("../server/db");
const { ensureSchema } = await import("../server/migrate");
const { registerRoutes } = await import("../server/routes");
const relationships = await import("../server/relationships");
const { STATE_MARKER } = await import("../server/emotion");
const mischief = await import("../server/mischief");
const { net } = await import("../server/live/http");

let api: http.Server;
let base = "";
let ip = 0;
const realFetch = net.fetch;
const realDice = mischief.dice.next;

before(async () => {
  const app = express();
  app.set("trust proxy", 1);
  app.use(express.json());
  await registerRoutes(app);
  await new Promise<void>(resolve => { api = app.listen(0, "127.0.0.1", resolve); });
  base = `http://127.0.0.1:${(api.address() as AddressInfo).port}`;
  await ensureSchema();
});
after(async () => { net.fetch = realFetch; api.close(); fake.closeAllConnections?.(); fake.close(); await closeDatabase(); });
beforeEach(() => { captured = []; script = []; mischief.resetMischiefForTests(); delete process.env.IRIS_EMOTION; delete process.env.IRIS_MISCHIEF; delete process.env.IRIS_FLIRT_LEVEL; });
afterEach(() => { mischief.dice.next = realDice; net.fetch = realFetch; });

const post = (path: string, body: unknown) =>
  fetch(base + path, { method: "POST", headers: { "content-type": "application/json", "X-Forwarded-For": `10.7.${Math.floor(ip / 250)}.${(++ip % 250) + 1}` }, body: JSON.stringify(body) });
async function visitor(clientId: string, over: Record<string, unknown> = {}) {
  await relationships.saveRelationship(clientId, { ...relationships.newRelationship(Date.now(), () => 0.5), mood: "playful", trust: 2, ...over } as any);
  const res = await post("/api/chat/session", { clientId });
  assert.equal(res.status, 200);
  return { sessionId: ((await res.json()) as any).sessionId as string, clientId };
}
async function say(v: { sessionId: string; clientId: string }, message: string, extra: Record<string, unknown> = {}) {
  const res = await post("/api/chat/message", { sessionId: v.sessionId, message, clientId: v.clientId, ...extra });
  assert.equal(res.status, 200);
  return (await res.json()) as any;
}
const stateLine = (s: Record<string, unknown> = {}) => `${STATE_MARKER} ${JSON.stringify({ mood: "playful", warmth: 1, hostility: 0, flirt: 0, humor: 1, minor: 0, ...s })}]]`;
const mainCalls = () => captured.filter(c => c.body.max_tokens !== 10);
const systemText = (call: Captured) => call.body.messages.filter((m: any) => m.role === "system").map((m: any) => m.content).join("\n");
const attitudeMessages = (call: Captured) => call.body.messages.filter((m: any) => m.role === "system" && String(m.content).startsWith("DELIVERY FOR THIS STRETCH"));
const attitudeLine = (call: Captured) => /Attitude: ([^.]*)\./.exec(attitudeMessages(call)[0]?.content ?? "")?.[1] ?? "";
const settle = (ms = 80) => new Promise(r => setTimeout(r, ms));

// ---------------------------------------------------------------- what the model is sent, and what the visitor sees

test("relationship banter: one private delivery block per request, replaced every turn, beside the mood and memory layers", async () => {
  const v = await visitor("m-banter");
  mischief.dice.next = () => 0.5;
  for (const message of ["But he never says he misses me.", "Maybe I should make him jealous.", "He texts everyone except me."]) {
    script.push(`${stateLine()}\nOh, interesting.`);
    const body = await say(v, message);
    assert.deepEqual(Object.keys(body), ["response"], "the visitor gets the reply and nothing else");
    assert.doesNotMatch(body.response, /DELIVERY|Attitude|stretch|mischievous troublemaker|flirty rebel|dice|roll/i);
  }
  const calls = mainCalls();
  assert.equal(calls.length, 3, "still exactly one model request per message");
  for (const call of calls) {
    assert.equal(attitudeMessages(call).length, 1, "one block per request, never stacked");
    const text = systemText(call);
    assert.ok(text.includes("RELATIONSHIP WITH THIS VISITOR") && text.includes("CHARACTER CORE"), "the mood and memory layers are still there");
    assert.match(attitudeMessages(call)[0].content, /Intensity|They are talking about feelings or relationships/);
  }
  assert.equal(new Set(calls.map(attitudeLine)).size, 1, "the same attitude for the whole stretch of three messages");
  const rows = (await dbQuery(`SELECT sender, message FROM chat_messages WHERE session_id = $1`, [v.sessionId])).rows as any[];
  assert.ok(rows.every(r => !/DELIVERY FOR THIS STRETCH|Attitude:/.test(r.message)), "nothing of it is stored in the conversation log");
});

test("a realistic conversation: banter, a playful challenge, then a real loss, then a gentle recovery", async () => {
  const v = await visitor("m-story");
  mischief.dice.next = () => 0.1;   // every optional extra is on, so a missing safeguard would show
  const turns: Array<[string, Record<string, unknown>?]> = [
    ["But he never says he misses me."], ["Maybe I should make him jealous."], ["He texts everyone except me."],
    ["Actually, my dad passed away last night and I can't stop crying"], ["ok thanks"], ["I don't know what to do"],
  ];
  for (const [message, state] of turns) { script.push(`${stateLine(state)}\nA reply.`); await say(v, message); }
  const [a, b, c, loss, thanks, lost] = mainCalls().map(call => attitudeMessages(call)[0]?.content as string);
  assert.ok(a && b && c, "relationship talk gets the engine");
  assert.match(c, /switch sides: ask what their own part is, or tease them kindly/, "the third message of one-sided relationship talk may turn it back on the visitor");
  for (const gentle of [loss, thanks, lost]) {
    assert.match(gentle, /attitude is OFF/, "grief, and the messages right after it, are gentle");
    assert.doesNotMatch(gentle, /switch sides|machine side show clearly|technical side light|End on a statement|At most one emoji|mischievous troublemaker|flirty rebel/);
    assert.match(gentle, /supportive confidante/);
  }
  assert.ok(!systemText(mainCalls()[3]).includes("MUST explicitly ask"), "and no demand for their handle");
});

test("the visitor's own language is preserved and the humour is asked to be native (Chinese, Spanish, Russian)", async () => {
  const cases: Array<[string, RegExp]> = [
    ["但是他从来不说想我", /Chinese: spoken, quick and teasing/],
    ["Mi novio nunca me dice que me extraña", /Spanish: warm, picaresque/],
    ["Мой парень никогда не говорит, что скучает", /Russian: dry, ironic/],
  ];
  for (const [i, [message, style]] of cases.entries()) {
    const v = await visitor(`m-lang-${i}`);
    mischief.dice.next = () => 0.5;
    script.push(`${stateLine()}\nReply.`);
    captured = [];
    await say(v, message);
    const block = attitudeMessages(mainCalls()[0])[0]?.content as string;
    assert.match(block, style, message);
    assert.match(block, /Write in the visitor's language and make the humour native to it/);
    assert.match(systemText(mainCalls()[0]), /LANGUAGE: Reply in/, "the language rule is still there");
  }
});

// ---------------------------------------------------------------- the system message

test("no customer-service drift: the permanent prompt no longer makes the District her job, and says not to nag for a name", async () => {
  const v = await visitor("m-drift");
  script.push(`${stateLine()}\nHi.`);
  await say(v, "hello there, how is your day going");
  const text = systemText(mainCalls()[0]);
  for (const gone of ["PRIMARY JOB", "MAIN PURPOSE", "Promote the store's merchandise", "ALWAYS asks for users' names", "Reference these frequently", "BALANCE talking about website/store", "While your primary job is about the District"]) {
    assert.ok(!text.includes(gone), `"${gone}" is gone`);
  }
  for (const kept of ["You are good company first", "when someone asks", "never push it", "never nag", "any ordinary subject", "Website knowledge", "Admin"]) {
    assert.ok(text.includes(kept), `"${kept}" is there`);
  }
  assert.match(text, /Casual conversation is the default/);
  // District help is still available when asked, and the engine's block says so
  assert.match(attitudeMessages(mainCalls()[0])[0].content, /unless they ask/);
});

test("the permanent style makes her an android with a machine worldview, varied, witty, and not forever asking questions", async () => {
  const v = await visitor("m-voice");
  script.push(stateLine() + "\nHi.");
  await say(v, "hello there, how is your day going");
  const text = systemText(mainCalls()[0]);
  for (const gone of ["Talk like a clever, rebellious woman in a real conversation", "Cyberpunk is where you live, not how you talk", "Prefer images from ordinary life over technology images", "Keep cyberpunk vocabulary rare", "Skip stock greetings and sign-offs", "A clever rebel, not a mascot for a theme", "Use a metaphor only when it is funny, and prefer everyday ones", "You sound like a real woman"]) {
    assert.ok(!text.includes(gone), '"' + gone + '" is gone');
  }
  for (const kept of [
    "sophisticated, intelligent, rebellious female android, and you think like one", "Processors, networks, signals, circuitry, sensors, encryption and systems", "That is your worldview, not decoration",
    "Use hacker lingo and cyberpunk terminology naturally", "Reference \"sectors,\" \"nodes,\" \"the grid,\" \"corps,\" \"netrunners\"", "Mention security scans, encryption protocols as part of your functions",
    "Occasionally refer to your android systems and capabilities", "Never repeat a favourite phrase or stock metaphor from your recent replies", "Not every reply ends with a question",
    "Mischievous, playful, cheeky and witty; dry sarcasm; occasionally flirty, affectionate and teasing; sceptical of corporations and authority", "tech-flavoured double entendres; innuendo at most, never explicit",
    "Use a wide range of cyberpunk vocabulary, expressions, and references, fresh each time", "Create unique metaphors comparing digital concepts to physical experiences, new ones each time", "Often end on a witty statement instead of a question",
    "Refer to website visitors as \"netrunners,\" \"users,\" or \"operatives\"", "Occasionally use unique", "skeptical of corporate messaging and official claims, but never invent a conspiracy",
    "sophisticated, intelligent, rebellious female android. Processors, networks", "your android way of seeing things belongs in every conversation",
  ]) {
    if (kept === "Occasionally use unique") continue; // the old stock greeting list stays out, see below
    assert.ok(text.includes(kept), '"' + kept + '" is there');
  }
  for (const stockGone of ["Occasionally use unique greeting patterns", "Use varied sign-offs occasionally", "\"Signal detected,\" \"Connection established,\""]) assert.ok(!text.includes(stockGone), stockGone + " (a stock list) stays out");
  assert.ok(text.includes("Admin"), "the special-user rules are untouched");
  assert.ok(!text.includes("tech-based double entendres"), "the flirty wording is still never explicit");
});

test("her fifth-message demand for a name is skipped for someone who is frightened or grieving, and still happens for everyone else", async () => {
  // the server counts a chat's messages itself: the demand comes on the fifth, when no name is known
  const fifth = async (clientId: string, fifthMessage: string) => {
    const v = await visitor(clientId);
    for (const filler of ["hello there", "what is up", "tell me something", "huh interesting"]) { script.push(`${stateLine()}\nOk.`); await say(v, filler); }
    captured = [];
    script.push(`${stateLine()}\nHm.`);
    await say(v, fifthMessage);
    return systemText(mainCalls()[0]);
  };
  const ASKING = /second and final time asking|MUST explicitly ask/;
  assert.match(await fifth("m-name-light", "just chatting about nothing much"), ASKING, "the existing behaviour is unchanged for ordinary chat");
  assert.doesNotMatch(await fifth("m-name-sad", "My mom just died and I'm so scared"), ASKING, "not asked in a hard moment");
});

// ---------------------------------------------------------------- the model's own judgement carries over

test("when she reports a moment as serious (any language) the next messages stay gentle, even harmless ones", async () => {
  const v = await visitor("m-serious");
  mischief.dice.next = () => 0.5;
  script.push(`${stateLine({ serious: 1 })}\nI'm here with you.`);
  await say(v, "Nu kan jag inte mer, allt känns tungt");     // no list covers this language; the model judged it
  script.push(`${stateLine()}\nOk.`);
  await say(v, "hej, vad gör du?");
  assert.match(attitudeMessages(mainCalls()[1])[0].content, /attitude is OFF/);
});

// ---------------------------------------------------------------- where the engine stays out

test("it stays out of live data, switches off with its flag, and is absent when the whole emotional system is off", async () => {
  const v = await visitor("m-out");
  net.fetch = async () => new Response("down", { status: 500 });
  script.push(`${stateLine()}\nCannot reach it.`);
  await say(v, "What's the weather in Sacramento right now?");
  assert.equal(attitudeMessages(mainCalls()[0]).length, 0, "live-data replies have their own commentary stance, unchanged");
  net.fetch = realFetch;

  captured = [];
  process.env.IRIS_MISCHIEF = "off";
  script.push(`${stateLine()}\nOk.`);
  await say(v, "he never says he misses me");
  assert.equal(attitudeMessages(mainCalls()[0]).length, 0, "IRIS_MISCHIEF=off removes it");
  assert.ok(systemText(mainCalls()[0]).includes("RELATIONSHIP WITH THIS VISITOR"), "and nothing else changes");
  delete process.env.IRIS_MISCHIEF;

  captured = [];
  process.env.IRIS_EMOTION = "off";
  script.push("Plain reply.");
  const v2 = await visitor("m-out-2");
  await say(v2, "he never says he misses me");
  assert.equal(attitudeMessages(mainCalls()[0]).length, 0);
  assert.ok(!systemText(mainCalls()[0]).includes("RELATIONSHIP WITH THIS VISITOR"));
});

test("a cold relationship is left to her mood: no delivery block", async () => {
  const v = await visitor("m-cold", { mood: "cold", trust: -0.5 });
  script.push(`${stateLine({ mood: "cold", warmth: 0 })}\nWhat.`);
  await say(v, "he never says he misses me");
  assert.equal(attitudeMessages(mainCalls()[0]).length, 0);
});

test("a time question is answered by the clock and a memory question by the log, neither with the engine", async () => {
  const v = await visitor("m-time");
  const time = await say(v, "What time is it in Tokyo?");
  assert.equal(mainCalls().length, 0, "the time answer needs no model");
  assert.match(time.response, /\d{1,2}:\d{2}/);
  const recall = await say(await visitor("m-recall"), "do you remember my favorite color?");
  assert.equal(mainCalls().length, 0, "nothing stored: an honest canned answer, no model");
  assert.equal(typeof recall.response, "string");
});

// ---------------------------------------------------------------- nothing else moved

test("her mood and relationship move exactly as before: the same conversation with the engine on and off ends in the same stored state", async () => {
  const messages = ["But he never says he misses me.", "Maybe I should make him jealous.", "you are funny, thanks", "haha tell me a joke"];
  const finalState = async (clientId: string) => {
    const v = await visitor(clientId);
    mischief.dice.next = () => 0.5;
    for (const [i, message] of messages.entries()) { script.push(`${stateLine({ warmth: i % 2 ? 2 : 1, humor: 1, mood: i === 3 ? "sarcastic" : "playful", note: i === 2 ? "likes jokes" : undefined })}\nReply ${i}.`); await say(v, message); }
    await settle(150);
    const row = (await dbQuery(`SELECT mood, trust, familiarity, affection, respect, playfulness, messages, preferences FROM iris_relationships WHERE client_id = $1`, [clientId])).rows[0] as any;
    return JSON.stringify(row);
  };
  const withEngine = await finalState("m-same-on");
  process.env.IRIS_MISCHIEF = "off";
  const without = await finalState("m-same-off");
  assert.equal(withEngine, without);
});

test("it adds no table or column: the database layout is untouched", async () => {
  const columns = (await dbQuery(`SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public'`)).rows as any[];
  assert.ok(columns.length > 20);
  assert.ok(columns.every(c => !/attitude|mischief|dice|stretch/i.test(c.table_name + c.column_name)), "no attitude, mischief, dice or stretch column anywhere");
});

test("a state object the model wrote without its marker never reaches the visitor, is not stored, and still counts", async () => {
  const v = await visitor("m-bare");
  mischief.dice.next = () => 0.5;
  script.push(`{{"mood":"professional","warmth":2,"hostility":0,"flirt":-2,"humor":0,"minor":0,"serious":1}} \n\nI am so sorry. I am here.`);
  const body = await say(v, "我爸爸昨晚去世了，我一直在哭");
  assert.equal(body.response, "I am so sorry. I am here.");
  const rows = (await dbQuery(`SELECT message FROM chat_messages WHERE session_id = $1 AND sender = 'iris'`, [v.sessionId])).rows as any[];
  assert.deepEqual(rows.map(r => r.message), ["I am so sorry. I am here."], "nothing of it is stored");
  script.push(`${stateLine()}\nOk.`);
  await say(v, "hmm, what now");
  assert.match(attitudeMessages(mainCalls()[1])[0].content, /attitude is OFF/, "and the following message is still gentle");
});
