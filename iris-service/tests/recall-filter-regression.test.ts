// Regression: the recovered phrase must be found. Uses the production conversation structure (phrase said in one chat, wrong
// recall attempts after it, the phrase chat adopted later), not isolated messages. All data is synthetic.
// (Header shared with the other memory tests.)
process.env.IRIS_TEST_DB = "pglite";
import test, { before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import http from "node:http";
import type { AddressInfo } from "node:net";
import express from "express";

// ---------------------------------------------------------------- stand-ins for Google's keys and OpenAI
const PROJECT = "memory-test-project";
const pair = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
const KID = "mem-key";
const jwk = { ...pair.publicKey.export({ format: "jwk" }), kid: KID, alg: "RS256" };
const keyServer = http.createServer((_q, r) => { r.writeHead(200, { "content-type": "application/json", "cache-control": "max-age=3600" }); r.end(JSON.stringify({ keys: [jwk] })); });
await new Promise<void>(r => keyServer.listen(0, "127.0.0.1", r));
process.env.IRIS_FIREBASE_JWKS_URL = `http://127.0.0.1:${(keyServer.address() as AddressInfo).port}/keys`;
process.env.FIREBASE_PROJECT_ID = PROJECT;
const OWNER = "uid-owner-memory";
const b64 = (v: unknown) => Buffer.from(JSON.stringify(v)).toString("base64url");
const tokenFor = (uid: string, name = "Tester") => {
  const n = Math.floor(Date.now() / 1000);
  const data = `${b64({ alg: "RS256", kid: KID })}.${b64({ iss: `https://securetoken.google.com/${PROJECT}`, aud: PROJECT, sub: uid, iat: n - 5, auth_time: n - 5, exp: n + 3600, name, firebase: { sign_in_provider: "google.com" } })}`;
  return `${data}.${crypto.sign("RSA-SHA256", Buffer.from(data), pair.privateKey).toString("base64url")}`;
};

let seen: any[] = [];
let failing: { count: number; status: number; message: string } | null = null;
const fakeOpenAI = http.createServer((req, res) => {
  let raw = ""; req.on("data", c => { raw += c; });
  req.on("end", () => {
    const body = JSON.parse(raw || "{}");
    seen.push(body);
    if (failing && failing.count > 0 && body.max_tokens !== 10) {
      failing.count--;
      res.writeHead(failing.status, { "content-type": "application/json" });
      return res.end(JSON.stringify({ error: { message: failing.message } }));
    }
    const content = body.max_tokens === 10 ? "english" : `[[IRIS_STATE {"warmth":1}]]\nStand-in reply.`;
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ id: "x", object: "chat.completion", created: 0, model: "gpt-4o", choices: [{ index: 0, message: { role: "assistant", content }, finish_reason: "stop" }], usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 } }));
  });
});
await new Promise<void>(r => fakeOpenAI.listen(0, "127.0.0.1", r));
process.env.OPENAI_API_KEY = "sk-test-not-real";
process.env.OPENAI_BASE_URL = `http://127.0.0.1:${(fakeOpenAI.address() as AddressInfo).port}/v1`;
process.env.CHAT_LIMIT_PER_DAY = "100000";
process.env.CHAT_GLOBAL_DAILY_LIMIT = "100000";
process.env.IRIS_ADMIN_UIDS = OWNER;

const { dbQuery, closeDatabase } = await import("../server/db");
const { ensureSchema } = await import("../server/migrate");
const routes = await import("../server/routes");
const relationships = await import("../server/relationships");
const memory = await import("../server/memory");
const identity = await import("../server/identity");
const { DELETE_CONFIRMATION } = memory;

let api: http.Server;
let base = "";
let ip = 0;
before(async () => {
  const app = express(); app.set("trust proxy", 1); app.use(express.json());
  await routes.registerRoutes(app);
  await new Promise<void>(r => { api = app.listen(0, "127.0.0.1", r); });
  base = `http://127.0.0.1:${(api.address() as AddressInfo).port}`;
  await ensureSchema();
});
after(async () => { api.close(); keyServer.close(); fakeOpenAI.closeAllConnections?.(); fakeOpenAI.close(); await closeDatabase(); });
beforeEach(async () => {
  seen = []; failing = null;
  for (const t of ["chat_messages", "chat_sessions", "iris_relationships", "iris_owner_state", "iris_memory_links", "chat_user_profiles"]) await dbQuery(`DELETE FROM ${t}`);
  routes.resetChatStateForTests();
  identity.resetOwnerStateCacheForTests();
  for (const name of ["IRIS_PERSISTENT_MEMORY", "IRIS_MEMORY_RETENTION_DAYS", "IRIS_MEMORY_BUDGET_CHARS", "IRIS_ADMIN_VIEWER", "IRIS_ADMIN_TOKEN"]) delete process.env[name];
});

// ---------------------------------------------------------------- helpers
const call = (method: string, path: string, token?: string, body?: unknown) => fetch(base + path, {
  method,
  headers: { "content-type": "application/json", "X-Forwarded-For": `10.4.${Math.floor(ip / 250)}.${(++ip % 250) + 1}`, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  body: body === undefined ? undefined : JSON.stringify(body),
});
async function say(sessionId: string, message: string, who: { token?: string; clientId?: string } = {}) {
  seen = [];
  const res = await call("POST", "/api/chat/message", who.token, { sessionId, message, ...(who.clientId ? { clientId: who.clientId } : {}) });
  const request = seen.filter(b => b.max_tokens !== 10).at(-1);
  return { status: res.status, body: (await res.json()) as any, request };
}
const systemOf = (req: any) => (req?.messages ?? []).filter((m: any) => m.role === "system").map((m: any) => m.content as string);
const block = (req: any) => systemOf(req).find((s: string) => s.startsWith("VERIFIED CONVERSATION MEMORY")) ?? "";
const turns = (req: any) => (req?.messages ?? []).filter((m: any) => m.role !== "system").map((m: any) => `${m.role}:${m.content}`);
const count = (text: string, part: string) => text.split(part).length - 1;
const wholeRequest = (req: any) => JSON.stringify(req?.messages ?? []);
const settle = (ms = 100) => new Promise(r => setTimeout(r, ms));
const PHRASE = "PURPLE-ELEPHANT-42";
const ownerToken = () => tokenFor(OWNER, "Owner");
const setMode = async (mode: string) => { const r = await call("POST", "/api/owner/mode", ownerToken(), { mode }); assert.equal(r.status, 200); };

let rowId = 0;
async function put(key: string | null, sender: "user" | "iris", text: string, at: string, opts: { session?: string; status?: string } = {}) {
  await dbQuery(
    `INSERT INTO chat_messages (session_id, sender, message, timestamp, status, memory_key, request_id) VALUES ($1, $2, $3, $4::timestamp, $5, $6, $7)`,
    [opts.session ?? "seeded-" + (key ?? "none"), sender, text, at, opts.status ?? "ok", key, "seed-" + ++rowId],
  );
}
const stored = async (key: string) => Number((await dbQuery(`SELECT count(*) AS n FROM chat_messages WHERE memory_key = $1`, [key])).rows[0].n);
const SECRET = "Purple neon pineapple 7392";

// The production shape: the phrase was said in one chat, three wrong recall attempts followed (two of them answered
// with an administrator word, one with the canned "no record"), the phrase chat was adopted afterwards, then a new chat asks.
async function productionSequence(phraseText: string, opts: { phraseStatus?: string; irisReply?: string | null } = {}) {
  await put(null, "user", phraseText, "2026-10-30 10:00:00", { session: "phrase-session", status: opts.phraseStatus });
  if (opts.irisReply !== null) await put(null, "iris", opts.irisReply ?? "Got it. I'll keep that locked away.", "2026-10-30 10:00:05", { session: "phrase-session" });
  await put(`owner:${OWNER}`, "user", "Iris, what was my test phrase?", "2026-10-31 09:00:00", { session: "s2" });
  await put(`owner:${OWNER}`, "iris", "Your administrator verification phrase is Reboot.", "2026-10-31 09:00:04", { session: "s2" });
  await put(`owner:${OWNER}`, "user", "Do you remember the phrase I told you to remember?", "2026-10-31 09:05:00", { session: "s2" });
  await put(`owner:${OWNER}`, "iris", "Protocol.", "2026-10-31 09:05:04", { session: "s2" });
  await put(`owner:${OWNER}`, "user", "Iris, what was my test phrase?", "2026-10-31 09:10:00", { session: "s3" });
  await put(`owner:${OWNER}`, "iris", "I have no record of that.", "2026-10-31 09:10:04", { session: "s3" });
  const adopt = await call("POST", "/api/owner/adopt-session", ownerToken(), { sessionId: "phrase-session" });
  assert.equal(adopt.status, 200);
  return say("fresh-chat", "Iris, what was my test phrase?", { token: ownerToken() });
}

const assertRecalled = async (r: Awaited<ReturnType<typeof say>>) => {
  assert.ok(r.request, "the model is asked: the no-record shortcut did not fire");
  assert.ok(block(r.request).includes(SECRET), "the original phrase is in the request");
  assert.ok(!wholeRequest(r.request).includes("verification phrase is Reboot"), "her earlier wrong answers are still not facts");
  assert.ok(!wholeRequest(r.request).includes("Protocol."));
  const search = ((await (await call("GET", "/api/owner/state", ownerToken())).json()) as any).memory.lastLookups.find((l: any) => l.kind !== "recent");
  assert.ok(search.candidates >= 1 && search.found >= 1, "rows searched and given to Iris are not zero");
};

test("production sequence, the wording that was tested: the phrase is retrieved", async () => {
  await assertRecalled(await productionSequence("Iris, remember this exact phrase: " + SECRET));
});

test("a request to remember phrased as a question is still a statement of the phrase", async () => {
  for (const text of [
    "Iris, can you remember this exact phrase: " + SECRET + "?",
    "Iris, can you remember this phrase for me: " + SECRET,
    "My test phrase is " + SECRET + ". Can you remember it?",
    "Iris, remember this exact phrase: " + SECRET + ". Can you repeat it back?",
  ]) {
    await dbQuery(`DELETE FROM chat_messages`);
    routes.resetChatStateForTests();
    await assertRecalled(await productionSequence(text));
  }
});

test("the visitor's statement is evidence even when its exchange was marked as having no reply", async () => {
  await assertRecalled(await productionSequence("Iris, remember this exact phrase: " + SECRET, { phraseStatus: "error", irisReply: null }));
});

test("the no-record answer only appears when nothing supports it after the full search", async () => {
  await put(`owner:${OWNER}`, "user", "Iris, what was my test phrase?", "2026-10-31 09:00:00", { session: "s2" });
  await put(`owner:${OWNER}`, "iris", "Your administrator verification phrase is Reboot.", "2026-10-31 09:00:04", { session: "s2" });
  await put(`owner:${OWNER}`, "user", "Do you remember the phrase I told you to remember?", "2026-10-31 09:05:00", { session: "s2" });
  const none = await say("fresh-chat", "Iris, what was my test phrase?", { token: ownerToken() });
  assert.equal(none.request, undefined, "only earlier questions and wrong answers exist: honest no-record, no model call");
  assert.doesNotMatch(none.body.response, /reboot|protocol/i);
});

test("plain recall questions are still set aside, and statements are never classed as questions", () => {
  for (const q of ["Iris, what was my test phrase?", "What was the phrase?", "Recall the test phrase", "Do you remember the phrase I told you to remember?"]) {
    assert.equal(memory.carriesContent(q), false, q);
  }
  for (const s of [
    "Iris, remember this exact phrase: " + SECRET, "Remember this exact phrase: " + SECRET, "My test phrase is " + SECRET + ". Can you remember it?",
    "Iris, can you remember this phrase: " + SECRET, "Please remember \"" + SECRET + "\"",
  ]) assert.equal(memory.carriesContent(s), true, s);
});

// ================================================================ recall questions in Chinese (full-width marks, no spaces)

test("Chinese recall questions are recognised with full-width marks or a question particle, and statements are not", () => {
  for (const q of ["你还记得我的测试短语吗？", "你还记得我的测试短语吗", "我的测试短语是什么？", "我刚才告诉你的短语是什么", "我上次说过的话你记得吗"]) {
    assert.equal(memory.isRecallQuestion(q), true, q);
  }
  for (const s of ["请记住这个短语：紫色霓虹菠萝7392", "我的测试短语是紫色霓虹菠萝7392。你记得吗？", "今天天气很好"]) {
    assert.equal(memory.carriesContent(s) || !memory.isRecallQuestion(s), true, s);
  }
  assert.equal(memory.isRecallQuestion("请记住这个短语：紫色霓虹菠萝7392"), false, "an instruction to remember is not a question");
  assert.equal(memory.carriesContent("你还记得我的测试短语吗？"), false);
  assert.equal(memory.carriesContent("你好。你还记得我的测试短语吗？"), false, "a greeting does not make it a statement");
  assert.equal(memory.carriesContent("你还记得吗？我的短语是：紫色霓虹菠萝7392"), true, "a full-width colon hands over the phrase");
  // English is unchanged
  assert.equal(memory.isRecallQuestion("what was my test phrase"), true);
  assert.equal(memory.carriesContent("Iris, what was my test phrase?"), false);
});

test("production sequence in Chinese: the phrase is retrieved, wrong earlier answers stay out", async () => {
  const phrase = "紫色霓虹菠萝7392";
  await put(null, "user", "Iris，请记住这个短语：" + phrase, "2026-10-30 10:00:00", { session: "zh-phrase" });
  await put(null, "iris", "好的，我记住了。", "2026-10-30 10:00:05", { session: "zh-phrase" });
  await put(`owner:${OWNER}`, "user", "你还记得我的测试短语吗？", "2026-10-31 09:00:00", { session: "zh2" });
  await put(`owner:${OWNER}`, "iris", "你的管理员验证短语是 Reboot。", "2026-10-31 09:00:04", { session: "zh2" });
  await put(`owner:${OWNER}`, "user", "我的测试短语是什么？", "2026-10-31 09:05:00", { session: "zh2" });
  await put(`owner:${OWNER}`, "iris", "Protocol。", "2026-10-31 09:05:04", { session: "zh2" });
  assert.equal((await call("POST", "/api/owner/adopt-session", ownerToken(), { sessionId: "zh-phrase" })).status, 200);
  const r = await say("zh-fresh", "你还记得我的测试短语吗？", { token: ownerToken() });
  assert.ok(r.request, "the model is asked");
  assert.ok(block(r.request).includes(phrase), "the Chinese phrase is in the request");
  assert.ok(!wholeRequest(r.request).includes("Reboot") && !wholeRequest(r.request).includes("Protocol"));
  const state = ((await (await call("GET", "/api/owner/state", ownerToken())).json()) as any).memory;
  assert.equal(state.latestRequest.mode, "grounded", "a Chinese recall question is now answered from the stored messages");
  assert.ok(r.request.temperature <= 0.3, "calm sampling, like an English recall question");
});
