// Grounded recall, identity handling and Adopt Chat: the owner's exact phrase is found and used, earlier wrong answers and recall
// questions never outrank it, unsupported recall gets an honest answer, verification answers never appear in a prompt, and a
// signed-in person is never silently filed as a stranger. All data is synthetic.
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
const verification = await import("../server/verification");
const SECRET = "Purple neon pineapple 7392";
const lastTail = (req: any) => (req?.messages ?? []).filter((m: any) => m.role === "system").at(-1)?.content as string | undefined;

// ================================================================ the owner's exact phrase

test("the recovered conversation: the exact phrase is in the request, the strict rule comes last, and earlier wrong answers and recall questions stay out", async () => {
  await put(`owner:${OWNER}`, "user", `Remember this test phrase: ${SECRET}`, "2026-10-30 10:00:00", { session: "recovered" });
  await put(`owner:${OWNER}`, "iris", "Got it, I will remember that.", "2026-10-30 10:00:05", { session: "recovered" });
  // the failure that started this: she was asked, answered from the wrong place, and that answer was stored
  await put(`owner:${OWNER}`, "user", "What was the test phrase I asked you to remember?", "2026-10-30 10:05:00", { session: "recovered" });
  await put(`owner:${OWNER}`, "iris", "Your administrator verification phrase is Reboot.", "2026-10-30 10:05:04", { session: "recovered" });
  const r = await say("fresh-page", "Can you recall the test phrase I asked you to remember earlier?", { token: ownerToken() });
  assert.equal(r.status, 200);
  const all = wholeRequest(r.request);
  assert.ok(all.includes(SECRET), "the phrase reaches the model");
  assert.equal(count(block(r.request), SECRET), 1, "once, not repeated");
  assert.ok(!all.includes("verification phrase is Reboot"), "her earlier wrong answer is not offered as a memory");
  assert.ok(!all.includes("What was the test phrase I asked you to remember?"), "earlier recall questions are not treated as memories");
  assert.equal((r.request.messages as any[]).at(-1).role, "system", "the strict rule is the last thing she reads");
  assert.match(lastTail(r.request) ?? "", /stored|memory|exact/i);
  assert.ok(r.request.temperature <= 0.3, "calm sampling on recall turns");
  assert.equal(r.request.presence_penalty ?? 0, 0);
});

test("a request that only asks to remember something is not a recall question", async () => {
  const r = await say("rem", "Please remember that my test phrase is " + PHRASE, { token: ownerToken() });
  assert.equal(r.status, 200);
  assert.ok(r.request, "it goes to the model as ordinary conversation");
  assert.ok(r.request.temperature === undefined || r.request.temperature > 0.3, "no recall sampling");
});

test("recall without support: an honest answer, no model call, no invented memory", async () => {
  const r = await say("none", "What was the secret code word I told you last week?", { token: ownerToken() });
  assert.equal(r.status, 200);
  assert.equal(r.request, undefined, "the model is never asked to improvise");
  assert.doesNotMatch(r.body.response, /reboot|protocol|verification/i);
  const again = await say("none2", "Dime, recuerdas la palabra secreta?", { token: ownerToken() });
  assert.match(lastTail(again.request) ?? "", /stored|memory|exact|record/i, "other languages get the strict rule at the end");
  assert.ok(again.request.temperature <= 0.3);
});

test("a chat that holds the phrase answers from the chat itself; the model is still asked", async () => {
  await say("same", `Remember my test phrase: ${SECRET}`, { token: ownerToken() });
  const r = await say("same", "What was my test phrase?", { token: ownerToken() });
  assert.ok(r.request, "the phrase is in this very conversation, so no canned reply");
  assert.ok(turns(r.request).some(t => t.includes(SECRET)));
});

// ================================================================ verification answers

test("administrator verification answers never appear in any prompt, for Admin or anyone else", async () => {
  const owner = await say("v1", "hello there", { token: ownerToken() });
  const owner2 = await say("v2", "what was my test phrase?", { token: ownerToken() });
  const stranger = await say("v3", "who are you really?", { clientId: "someone" });
  for (const req of [owner.request, owner2.request, stranger.request].filter(Boolean)) {
    const text = wholeRequest(req);
    assert.doesNotMatch(text, /\bReboot\b/, "no administrator answer in the prompt");
    assert.doesNotMatch(text, /\bProtocol\b/, "no Eva answer in the prompt");
  }
});

test("verification is checked by the server, only after she asked, once, and within time", () => {
  verification.clearVerificationForTests();
  const now = Date.now();
  assert.equal(verification.verificationResultLine("s", "Admin", "reboot", now), "", "nothing was asked: nothing is checked");
  assert.equal(verification.noteReply("s", "Admin", "Hmm, what is your last name?", now), true);
  assert.match(verification.verificationResultLine("s", "Admin", "Reboot.", now + 1000), /CORRECT/);
  assert.equal(verification.verificationResultLine("s", "Admin", "Reboot", now + 2000), "", "one answer per question");
  verification.noteReply("s", "Admin", "What is your last name?", now);
  assert.match(verification.verificationResultLine("s", "Admin", "Smith", now + 1000), /INCORRECT/);
  verification.noteReply("s", "Admin", "What is your last name?", now);
  assert.equal(verification.verificationResultLine("s", "Admin", "Reboot", now + 11 * 60_000), "", "expired");
  assert.equal(verification.noteReply("s", "Eva", "Nice weather", now), false);
  verification.noteReply("s", "Eva", "What is the reboot... what is your last name?", now);
  assert.match(verification.verificationResultLine("s", "Eva", "协议", now + 1000), /CORRECT/, "any language");
  assert.doesNotMatch(verification.verificationResultLine("s", "Eva", "x", now), /Protocol|Reboot/);
});

// ================================================================ identity

test("a browser that says it is signed in but sends no valid token is refused, never filed as a stranger", async () => {
  const withHeader = (token?: string) => fetch(base + "/api/chat/message", {
    method: "POST",
    headers: { "content-type": "application/json", "X-Iris-Signed-In": "1", "X-Forwarded-For": `10.9.0.${++ip % 250 + 1}`, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ sessionId: "guard", message: "hello", clientId: "guard-browser" }),
  });
  for (const attempt of [await withHeader(), await withHeader("not-a-token")]) {
    assert.equal(attempt.status, 401);
    assert.equal(((await attempt.json()) as any).code, "signin_required");
  }
  assert.equal(await stored("guard-browser"), 0, "nothing was saved under anyone");
  assert.equal(Number((await dbQuery(`SELECT count(*) AS n FROM chat_messages WHERE session_id = 'guard'`)).rows[0].n), 0);
  const ok = await withHeader(ownerToken());
  assert.equal(ok.status, 200);
  assert.equal(await stored(`owner:${OWNER}`), 2, "a valid sign-in is filed under the owner");
  const anonymous = await say("guard-anon", "hello", { clientId: "guard-browser" });
  assert.equal(anonymous.status, 200, "the header is advisory: no header, an ordinary anonymous visitor");
});

// ================================================================ Adopt Chat

test("Adopt Chat tells the truth: preview first, 404 for an unknown session, 409 when nothing can be adopted, and copied hidden characters are ignored", async () => {
  await put(null, "user", `earlier chat ${SECRET}`, "2026-10-30 09:00:00", { session: "old-chat-1" });
  await put(null, "iris", "noted", "2026-10-30 09:00:04", { session: "old-chat-1" });
  const summary = async (id: string) => (await call("GET", "/api/owner/session-summary?sessionId=" + encodeURIComponent(id), ownerToken())).json() as Promise<any>;
  assert.equal((await call("GET", "/api/owner/session-summary?sessionId=old-chat-1", tokenFor("uid-nobody"))).status, 403);
  const preview = await summary(String.fromCharCode(0x200b) + " old-chat-1 " + String.fromCharCode(0xa0));
  assert.equal(preview.found, true);
  assert.equal(preview.messages, 2);
  assert.equal(preview.unkeyed, 2);
  assert.ok(!JSON.stringify(preview).includes(SECRET), "counts and times only, never message text");
  assert.equal((await summary("missing")).found, false);

  assert.equal((await call("POST", "/api/owner/adopt-session", ownerToken(), { sessionId: "missing" })).status, 404);
  const adopted = await call("POST", "/api/owner/adopt-session", ownerToken(), { sessionId: "old-chat-1" + String.fromCharCode(0x200b) + " " });
  assert.equal(adopted.status, 200);
  assert.equal(((await adopted.json()) as any).adopted, 2);
  assert.equal(await stored(`owner:${OWNER}`), 2);
  const again = await call("POST", "/api/owner/adopt-session", ownerToken(), { sessionId: "old-chat-1" });
  assert.equal(again.status, 409, "adopting twice is not reported as a success");
  const recalled = await say("after-adopt", "Do you remember the earlier chat and its phrase?", { token: ownerToken() });
  assert.ok(wholeRequest(recalled.request).includes(SECRET));
});

test("an unassigned visitor conversation is never adopted automatically", async () => {
  await put(null, "user", "an unfiled visitor message", "2026-10-30 09:00:00", { session: "stranger-chat" });
  await say("owner-chat", "what did that stranger say?", { token: ownerToken() });
  const row = (await dbQuery(`SELECT memory_key FROM chat_messages WHERE session_id = 'stranger-chat'`)).rows[0] as any;
  assert.equal(row.memory_key, null);
});

// ================================================================ Iris Controls data

test("Iris Controls reports what was searched, what was left out and why, who messages were filed under, and the version", async () => {
  await put(`owner:${OWNER}`, "user", `Remember this test phrase: ${SECRET}`, "2026-10-30 10:00:00", { session: "old" });
  await say("later", "Can you recall the test phrase I asked you to remember earlier?", { token: ownerToken() });
  await say("anon", "hello", { clientId: "someone-else" });
  const state = await (await call("GET", "/api/owner/state", ownerToken())).json() as any;
  const m = state.memory;
  assert.ok(["grounded", "partial", "absent", "failed", "unrecognized", "none"].includes(m.latestRequest.mode));
  const search = m.lastLookups.find((l: any) => l.kind !== "recent");
  assert.ok(search, "a recall search was recorded");
  for (const field of ["candidates", "excludedAsInChat", "droppedAsRecallQuestions", "found"]) assert.ok(field in search, field);
  assert.ok(m.identityMix && ["owner", "account", "browser", "none"].every(k => typeof m.identityMix[k] === "number"));
  assert.ok(m.server && typeof m.server.startedAt === "string");
  assert.ok(!JSON.stringify(m).includes(SECRET), "counts and categories only");
});
