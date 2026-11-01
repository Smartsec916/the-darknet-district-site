// Language continuity: the conversation keeps its language through short replies and restarts, and an explicit request to
// translate, answer in two languages or switch is always honored. Synthetic data, in-memory database, stand-in OpenAI.
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

// What the model reads after the conversation: the language note, then (for a question about the past) the recall rule
const afterHistory = (req: any): string[] => {
  const messages = req?.messages ?? [];
  let i = messages.length;
  while (i > 0 && messages[i - 1].role === "system") i--;
  return messages.slice(i).map((m: any) => m.content as string);
};
const languageNote = (req: any) => afterHistory(req).find(t => t.startsWith("LANGUAGE:")) ?? "";

test("a Chinese conversation stays Chinese through short English replies, and moves only for a clear English sentence", async () => {
  const first = await say("zh-1", "你好，你是谁？", { token: ownerToken() });
  assert.match(languageNote(first.request), /Reply in Chinese/);
  for (const short of ["ok", "thanks", "hello"]) {
    const r = await say("zh-1", short, { token: ownerToken() });
    assert.match(languageNote(r.request), /Reply in Chinese/, `still Chinese after "${short}"`);
  }
  const english = await say("zh-1", "Please tell me about the district store today", { token: ownerToken() });
  assert.match(languageNote(english.request), /Reply in English/, "a clear English sentence moves the conversation back");
});

test("single Chinese characters, with or without full-width punctuation, are Chinese, not English or Japanese", async () => {
  for (const [i, text] of ["好", "嗯！", "是，", "好？"].entries()) {
    const r = await say("zh-single-" + i, text, { token: ownerToken() });
    assert.match(languageNote(r.request), /Reply in Chinese/, text);
  }
});

test("the old absolute instruction is gone and English-only conversations carry no language note", async () => {
  const zh = await say("zh-abs", "你好，我想了解一下商店", { token: ownerToken() });
  assert.doesNotMatch(wholeRequest(zh.request), /DO NOT USE ENGLISH AT ALL/);
  const en = await say("en-only", "hello there, how are you today", { token: ownerToken() });
  assert.equal(languageNote(en.request), "");
});

test("explicit requests are honored: translate, answer in both languages, and switch (which becomes the new default)", async () => {
  await say("req", "你好，你是谁？", { token: ownerToken() });
  const translate = await say("req", "Please translate that into English", { token: ownerToken() });
  assert.match(languageNote(translate.request), /translation/i);
  const after = await say("req", "好", { token: ownerToken() });
  assert.match(languageNote(after.request), /Reply in Chinese/, "a one-time translation does not change the default");

  const both = await say("req", "Can you answer in both Chinese and English?", { token: ownerToken() });
  assert.match(languageNote(both.request), /bilingual/i);

  const sw = await say("req", "Reply in English from now on please", { token: ownerToken() });
  assert.match(languageNote(sw.request), /Reply in English/);
  const stays = await say("req", "ok", { token: ownerToken() });
  assert.equal(languageNote(stays.request).includes("Reply in Chinese"), false, "the switch is the new default");
  await say("req2", "你好，你是谁？", { token: ownerToken() });
  const zhSwitch = await say("req2", "用英文回答我", { token: ownerToken() });
  assert.match(languageNote(zhSwitch.request), /Reply in English/);
});

test("the conversation's language survives a server restart, rebuilt from the stored messages", async () => {
  await say("persist", "你好，你是谁？", { token: ownerToken() });
  await say("persist", "ok", { token: ownerToken() });
  routes.resetChatStateForTests(); // a Render sleep, restart or deploy: the in-memory default is gone
  const after = await say("persist", "thanks", { token: ownerToken() });
  assert.match(languageNote(after.request), /Reply in Chinese/);
  routes.resetChatStateForTests();
  await say("persist-en", "hello there, how are you today", { token: ownerToken() });
  routes.resetChatStateForTests();
  const english = await say("persist-en", "ok", { token: ownerToken() });
  assert.equal(languageNote(english.request), "", "an English conversation stays plain English");
});

test("the language note sits before the recall rule, which stays the very last thing read", async () => {
  await say("zh-recall", "你好，你是谁？", { token: ownerToken() });
  const r = await say("zh-recall", "你还记得我的测试短语吗?", { token: ownerToken() });
  const tail = afterHistory(r.request);
  assert.ok(tail.length >= 2, "both notes present");
  assert.match(tail.at(-2) ?? "", /^LANGUAGE:/);
  assert.doesNotMatch(tail.at(-1) ?? "", /^LANGUAGE:/);
});
