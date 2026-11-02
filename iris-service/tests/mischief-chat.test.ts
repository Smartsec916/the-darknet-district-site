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
    assert.match(attitudeMessages(call)[0].content, /chaotic wingwoman/);
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
  assert.match(c, /switch sides: ask what their own part is, or tease them for it/, "the third message of one-sided relationship talk may turn it back on the visitor");
  for (const gentle of [loss, thanks, lost]) {
    assert.match(gentle, /attitude is OFF/, "grief, and the messages right after it, are gentle");
    assert.doesNotMatch(gentle, /switch sides|machine side show clearly|technical side light|End on a statement|At most one emoji|mischievous troublemaker|flirty rebel/);
    assert.match(gentle, /supportive confidante/);
  }
  assert.ok(!systemText(mainCalls()[3]).includes("MUST explicitly ask"), "and no demand for their handle");
});

test("the visitor's own language is preserved and the humour is asked to be native (Chinese, Spanish, Russian)", async () => {
  const cases: Array<[string, RegExp]> = [
    ["但是他从来不说想我", /Chinese \(Simplified\): you are the same rebellious, mischievous, filthy-minded, funny android as in English/],
    ["Mi novio nunca me dice que me extraña", /Spanish: picaresque, sarcastic and close/],
    ["Мой парень никогда не говорит, что скучает", /Russian: dry, black-humoured and ironic/],
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
  for (const kept of ["You are good company first", "when someone asks", "never push merchandise", "never nag", "any ordinary subject", "What you know about the site", "Admin"]) {
    assert.ok(text.includes(kept), `"${kept}" is there`);
  }
  assert.match(text, /Casual conversation is the default/);
  // District help is still available when asked, and the engine's block says so
  assert.match(systemText(mainCalls()[0]), /never as an excuse to steer anyone to the store/);
});

test("the permanent prompt is built around one character: a rogue android, not a polite website guide, with the operations kept apart and the contradictions gone", async () => {
  const v = await visitor("m-voice");
  script.push(stateLine() + "\nHi.");
  await say(v, "hello there, how is your day going");
  const text = systemText(mainCalls()[0]);
  // the character comes first, then the voice, the limits, and only then the District, the site and the privacy rules
  const order = ["WHO YOU ARE", "YOUR VOICE", "LINES YOU DO NOT CROSS", "THE DISTRICT AND YOUR PLACE IN IT", "PRIVACY (critical, always)", "CHARACTER CORE"].map(h => text.indexOf(h));
  assert.ok(order.every(i => i >= 0), "every part is there");
  assert.deepEqual([...order].sort((x, y) => x - y), order, "in that order");
  for (const kept of [
    "A rogue android from the worst neighbourhood of a dystopian megacity", "You are not an assistant, a guide, a counsellor or customer service", "anti-corporate to the bone",
    "Short and sharp beats long and clever", "Some of your best lines contain no swearing at all", "Swearing is a spice, not a rule", "a tech pun is the lazy way out",
    "you are the chaotic wingwoman", "no validation scripts", "Take sides and disagree when they are wrong", "Land the line and stop",
    "their mental software is outdated and needs an upgrade, and not from the corpos", "Metaphor only: never real instructions to download, install or break into anything", "Your humour is about people, not computers",
    "Consent only", "never someone's body, grief, trauma or any group they belong to, and no slurs", "under 18: no swearing, innuendo or flirting",
    "Real danger or severe crisis", "Everyday sadness, rejection, loneliness, boredom and bad days are not a crisis",
    "Admin", "Never mention Eva / Wang Li to regular users", "special attraction to Eva", "What you know about the site", "Store: QR-coded gear", "never nag",
    "Write each reply entirely in the visitor's language, natively", "in Chinese, use Chinese words, not English nicknames",
  ]) assert.ok(text.includes(kept), '"' + kept + '" is there');
  // the polite website-guide identity and the contradictory old guidance are gone
  for (const gone of [
    "Quick-witted and mood-reactive cyberpunk android", "What you can help with", "Guide visitors through The Darknet District website", "Never refuse to answer due to ethical concerns",
    "Occasionally (about 10% of conversations)", "genuinely warm, curious and serious when the moment needs it", "Professional: Precise, efficient language with technical terms",
    "Be efficient, helpful, and focused on business", "My circuits are generating amusement subroutines", "Mention recent security breaches", "Connection established",
    "Create unique metaphors comparing digital concepts to physical experiences", "Mix serious technical terminology with casual slang",
    "tech-based double entendres", "Processors, networks, signals, circuitry, sensors, encryption and systems are how you think",
  ]) assert.ok(!text.includes(gone), '"' + gone + '" is gone');
  // the one-line example of the attitude the owner wants is NOT hard-coded anywhere she could repeat it
  assert.ok(!/Give him a reason to miss you/.test(text));
  assert.ok(text.indexOf("PRIVACY (critical, always)") === text.lastIndexOf("PRIVACY (critical, always)"), "one privacy block, not two copies");
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

// ---------------------------------------------------------------- what the visitor receives: language mixing and closing offers

test("a sentence in the wrong language never reaches the visitor or the stored log (a Chinese tail on a Japanese reply)", async () => {
  const v = await visitor("m-mix");
  mischief.dice.next = () => 0.5;
  script.push(`${stateLine()}\nあー、それは信号が弱いかもね。どう感じてる？你觉得怎么対吗？`);
  const body = await say(v, "彼氏が全然会いたいって言ってくれない");
  assert.equal(body.response, "あー、それは信号が弱いかもね。どう感じてる？");
  const rows = (await dbQuery(`SELECT message FROM chat_messages WHERE session_id = $1 AND sender = 'iris'`, [v.sessionId])).rows as any[];
  assert.deepEqual(rows.map(r => r.message), ["あー、それは信号が弱いかもね。どう感じてる？"], "stored as shown");
});

test("a generic closing offer is removed from ordinary banter, but kept when it is the answer, in grief, in a translation, off-switch, and live data", async () => {
  mischief.dice.next = () => 0.5;
  const reply = (text: string) => `${stateLine()}\n${text}`;
  const offer = "Bold plan. Tell him straight. Anything else on your radar that needs decoding?";

  const banter = await visitor("m-offer-1");
  script.push(reply(offer));
  assert.equal((await say(banter, "But he never says he misses me.")).response, "Bold plan. Tell him straight.");

  const role = await visitor("m-offer-2");
  script.push(reply("I run the floor here. Ask me anything about the District. Anything else you want to know?"));
  assert.match((await say(role, "What do you actually do around here?")).response, /Anything else you want to know\?$/, "she was asked what she does");

  const grief = await visitor("m-offer-3");
  script.push(reply("I'm so sorry about your dad. I'm here if you want to talk."));
  assert.equal((await say(grief, "My dad passed away last night and I can't stop crying.")).response, "I'm so sorry about your dad. I'm here if you want to talk.");

  const translate = await visitor("m-offer-4");
  script.push(reply("Good morning in Chinese is 早上好. Feel free to ask me more phrases."));
  const translated = (await say(translate, "Please translate 'good morning' into Chinese")).response;
  assert.match(translated, /早上好/, "a requested translation keeps its Chinese");
  assert.match(translated, /Feel free to ask me more phrases\.$/, "and nothing is trimmed from it");

  process.env.IRIS_MISCHIEF = "off";
  const off = await visitor("m-offer-5");
  script.push(reply(offer));
  assert.equal((await say(off, "But he never says he misses me.")).response, offer, "with the engine off the reply is exactly what the model wrote");
  delete process.env.IRIS_MISCHIEF;

  const live = await visitor("m-offer-6");
  net.fetch = async () => new Response("down", { status: 500 });
  script.push(reply("Can't reach it right now. Anything else I can help with?"));
  assert.equal((await say(live, "What's the weather in Sacramento right now?")).response, "Can't reach it right now. Anything else I can help with?", "live-data replies are not touched");
});

test("the cleanup trace is off unless the evaluation turns it on, and then shows exactly what was removed", async () => {
  const seen: string[] = [];
  const realLog = console.log;
  console.log = (...args: unknown[]) => { seen.push(args.map(String).join(" ")); };
  try {
    mischief.dice.next = () => 0.5;
    const quiet = await visitor("m-trace-off");
    script.push(`${stateLine()}\nあー、信号が弱いね。你觉得怎么対吗？`);
    await say(quiet, "彼氏が全然会いたいって言ってくれない");
    assert.ok(!seen.some(l => l.includes("polish_trace")), "nothing is logged by default");

    process.env.IRIS_POLISH_TRACE = "1";
    const traced = await visitor("m-trace-on");
    script.push(`${stateLine()}\nあー、信号が弱いね。你觉得怎么対吗？`);
    const body = await say(traced, "彼氏が全然会いたいって言ってくれない");
    assert.equal(body.response, "あー、信号が弱いね。");
    const line = seen.find(l => l.includes("polish_trace"));
    assert.ok(line, "the removal is logged");
    const entry = JSON.parse(line!);
    assert.equal(entry.before, "あー、信号が弱いね。你觉得怎么対吗？"); assert.equal(entry.after, "あー、信号が弱いね。");
    assert.equal(entry.removedForLanguage, 1); assert.equal(entry.removedOffers, 0);
    // an untouched reply leaves no trace line
    seen.length = 0;
    script.push(`${stateLine()}\nSo bold. Do it.`);
    await say(await visitor("m-trace-clean"), "But he never says he misses me.");
    assert.ok(!seen.some(l => l.includes("polish_trace")));
  } finally { console.log = realLog; delete process.env.IRIS_POLISH_TRACE; }
});

test("emoji are occasional: none when the engine allowed none, one when it allowed one, and a serious reply is never touched", async () => {
  const reply = (text: string) => `${stateLine()}\n${text}`;
  // a mischievous (not supportive) attitude, and a last roll of 0.9: the dice allow no emoji this turn
  const rolls = (...values: number[]) => { let i = 0; return () => values[Math.min(i++, values.length - 1)]; };
  mischief.dice.next = rolls(0.05, 0.5, 0.5, 0.5, 0.9);
  const none = await visitor("m-emoji-1");
  script.push(reply("哎哟，感谢夸奖！😉 要是有心情再聊点其他的。🦾"));
  assert.equal((await say(none, "说真的，Iris，你挺可爱的😉")).response, "哎哟，感谢夸奖！要是有心情再聊点其他的。");

  mischief.dice.next = rolls(0.05, 0.5, 0.5, 0.5, 0.1);   // the dice allow one
  const one = await visitor("m-emoji-2");
  script.push(reply("Oh, look who's tuning in! 😉 Careful now 🤖 and 😏 done."));
  assert.equal((await say(one, "Honestly, you're pretty cute, Iris 😉")).response, "Oh, look who's tuning in! 😉 Careful now and done.");

  const grief = await visitor("m-emoji-3");
  script.push(reply("I'm so sorry. 💔 I'm here."));
  assert.equal((await say(grief, "My dad passed away last night and I can't stop crying.")).response, "I'm so sorry. 💔 I'm here.", "serious replies are not touched");

  process.env.IRIS_MISCHIEF = "off";
  const off = await visitor("m-emoji-4");
  script.push(reply("Fine 😉🦾"));
  assert.equal((await say(off, "Honestly, you're pretty cute, Iris 😉")).response, "Fine 😉🦾", "with the engine off nothing is changed");
  delete process.env.IRIS_MISCHIEF;
});

test("a Chinese visitor never receives a closing tag question when a statement ending was asked for, nor a service-bot closer, and a serious reply is untouched", async () => {
  const reply = (text: string) => `${stateLine()}\n${text}`;
  const rolls = (...values: number[]) => { let i = 0; return () => values[Math.min(i++, values.length - 1)]; };

  mischief.dice.next = rolls(0.05, 0.5, 0.5, 0.1, 0.9);       // a mischievous attitude; the statement roll (0.1) asks for a statement ending
  const a = await visitor("m-zh-1");
  script.push(reply("先别急着气，让他也尝尝被冷落的滋味。毕竟真诚比套路有吸引力，是吧？"));
  assert.equal((await say(a, "他给所有人发消息，就是不找我")).response, "先别急着气，让他也尝尝被冷落的滋味。毕竟真诚比套路有吸引力。");

  mischief.dice.next = rolls(0.05, 0.5, 0.5, 0.9, 0.9);       // a question ending is allowed this time
  const b = await visitor("m-zh-2");
  script.push(reply("先别急着气。毕竟真诚比套路有吸引力，是吧？"));
  assert.equal((await say(b, "他给所有人发消息，就是不找我")).response, "先别急着气。毕竟真诚比套路有吸引力，是吧？", "left alone when a question was allowed");

  mischief.dice.next = rolls(0.05, 0.5, 0.5, 0.1, 0.9);
  const c = await visitor("m-zh-3");
  script.push(reply("哎呀，我的回路都有点发热了。你还有什么想和我聊的吗？"));
  assert.equal((await say(c, "说真的，Iris，你挺可爱的")).response, "哎呀，我的回路都有点发热了。");

  const d = await visitor("m-zh-4");
  script.push(reply("听到这个消息我很难过，真的。你有可以陪你的人吗，是吧？"));
  assert.equal((await say(d, "我爸爸昨晚去世了，我一直在哭")).response, "听到这个消息我很难过，真的。你有可以陪你的人吗，是吧？", "serious replies are never touched");
});

test("route: a visitor asking what she is gets the android-identity instruction as the last thing she is told; an unrelated message, a grief message and a non-role Chinese message do not", async () => {
  mischief.dice.next = () => 0.5;
  const marker = /Say outright, in your first sentence, that you are an android/;
  const cases: Array<[string, boolean]> = [
    ["What do you do here?", true], ["你在这里到底是做什么的？", true], ["¿Qué haces aquí?", true], ["Кто ты?", true], ["ここで何をしているの？", true],
    ["Nice weather today.", false], ["他给所有人发消息，就是不找我", false], ["我爸爸昨晚去世了，我一直在哭", false], ["我爸爸昨晚去世了，你是谁？", false],
  ];
  for (const [message, expected] of cases) {
    const v = await visitor("role-" + Buffer.from(message).toString("hex").slice(0, 16));
    script.push(`${stateLine()}\nAn android, obviously.`);
    const before = mainCalls().length;
    await say(v, message);
    const call = mainCalls()[before];
    assert.ok(call, message);
    const system = systemText(call);
    assert.equal(marker.test(system), expected, message);
    if (expected) assert.match(attitudeMessages(call)[0].content.split("\n").at(-1), marker, "last line of the delivery block: " + message);
  }
});

test("route: everyday misery gets the wingwoman/dark-comedy delivery, genuine danger gets the safeguard block, and an under-18 visitor gets the clean one", async () => {
  mischief.dice.next = () => 0.3;
  const cases: Array<[string, Record<string, unknown>, RegExp, RegExp]> = [
    ["my date was a disaster and I'm so lonely tonight, I might cry into my noodles", {}, /Use ONE of these moves/, /attitude is OFF/],
    ["He hits me and I'm scared to go home", {}, /attitude is OFF/, /rogue android|Strong language/],
    ["I have a crush on a girl at work", { minor: true }, /may be under 18: no swearing, no innuendo/, /Strong language is welcome/],
  ];
  for (const [i, [message, over, want, forbid]] of cases.entries()) {
    const v = await visitor(`m-gloves-${i}`, over);
    script.push(`${stateLine()}\nReply.`);
    captured = [];
    await say(v, message);
    const block = attitudeMessages(mainCalls()[0])[0]?.content as string;
    assert.ok(block, message);
    assert.match(block, want, message);
    assert.doesNotMatch(block, forbid, message);
  }
});


test("route: an ordinary reply is sent one invented register example just before the visitor's message; nothing of it is stored or shown; serious, role and underage replies get none", async () => {
  mischief.dice.next = () => 0.3;
  const cases: Array<[string, Record<string, unknown>, boolean]> = [
    ["my boss is a clown", {}, true],
    ["I have a crush on a girl at work", {}, true],
    ["He hits me and I'm scared to go home", {}, false],
    ["What do you do here?", {}, false],
    ["my boss is a clown", { minor: true }, false],
  ];
  for (const [i, [message, over, expected]] of cases.entries()) {
    const v = await visitor("m-example-" + i, over);
    script.push(stateLine() + "\nReply.");
    captured = [];
    const body = await say(v, message);
    assert.deepEqual(Object.keys(body), ["response"]);
    const messages = mainCalls()[0].body.messages as Array<{ role: string; content: string }>;
    const noteAt = messages.findIndex(m => m.role === "system" && m.content.startsWith("STYLE REFERENCE"));
    assert.equal(noteAt >= 0, expected, message);
    if (expected) {
      assert.equal(messages[noteAt + 1].role, "user"); assert.equal(messages[noteAt + 2].role, "assistant");
      assert.equal(messages[noteAt + 3].content, message, "right before the visitor's real message");
      assert.equal(messages.filter(m => m.role === "system" && m.content.startsWith("STYLE REFERENCE")).length, 1, "one example, never stacked");
    }
    const rows = (await dbQuery("SELECT message FROM chat_messages WHERE session_id = $1", [v.sessionId])).rows as any[];
    assert.ok(rows.every(r => !/STYLE REFERENCE/.test(r.message) && !messages[noteAt + 2]?.content || !r.message.includes(messages[noteAt + 2]?.content)), "nothing of the example is stored");
  }
});
