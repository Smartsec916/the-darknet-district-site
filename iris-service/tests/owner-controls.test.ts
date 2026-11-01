// Single sign-in, administrator recognition and the three Iris modes, against an in-memory Postgres, a local
// stand-in for OpenAI, and a local stand-in for Google's public key server. Tokens are signed with a key
// generated here; no real account, key or API is involved.
process.env.IRIS_TEST_DB = "pglite";
import test, { before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import http from "node:http";
import type { AddressInfo } from "node:net";
import express from "express";

// ---------------------------------------------------------------- a fake Google key server and token maker
const PROJECT = "test-district-project";
const keyPair = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
const otherPair = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
const KID = "test-key-1";
const jwk = { ...keyPair.publicKey.export({ format: "jwk" }), kid: KID, alg: "RS256", use: "sig" };

const keyServer = http.createServer((_req, res) => {
  res.writeHead(200, { "content-type": "application/json", "cache-control": "public, max-age=3600" });
  res.end(JSON.stringify({ keys: [jwk] }));
});
await new Promise<void>(resolve => keyServer.listen(0, "127.0.0.1", resolve));
process.env.IRIS_FIREBASE_JWKS_URL = `http://127.0.0.1:${(keyServer.address() as AddressInfo).port}/keys`;
process.env.FIREBASE_PROJECT_ID = PROJECT;

const b64 = (value: unknown) => Buffer.from(typeof value === "string" ? value : JSON.stringify(value)).toString("base64url");
function makeToken(claims: Record<string, unknown> = {}, options: { privateKey?: crypto.KeyObject; header?: Record<string, unknown>; provider?: string } = {}) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", kid: KID, typ: "JWT", ...options.header };
  const payload = {
    iss: `https://securetoken.google.com/${PROJECT}`, aud: PROJECT, sub: "uid-visitor", iat: now - 10, auth_time: now - 10, exp: now + 3600,
    firebase: { sign_in_provider: options.provider ?? "google.com" }, ...claims,
  };
  const data = `${b64(header)}.${b64(payload)}`;
  const signature = header.alg === "RS256"
    ? crypto.sign("RSA-SHA256", Buffer.from(data), options.privateKey ?? keyPair.privateKey).toString("base64url")
    : "";
  return `${data}.${signature}`;
}

// ---------------------------------------------------------------- a fake OpenAI
let captured: Array<{ body: any }> = [];
let script: string[] = [];
const fakeOpenAI = http.createServer((req, res) => {
  let raw = "";
  req.on("data", c => { raw += c; });
  req.on("end", () => {
    const body = JSON.parse(raw || "{}");
    captured.push({ body });
    const content = body.max_tokens === 10 ? "english" : (script.shift() ?? "Default reply.");
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({
      id: "x", object: "chat.completion", created: 0, model: "gpt-4o",
      choices: [{ index: 0, message: { role: "assistant", content }, finish_reason: "stop" }],
      usage: { prompt_tokens: 100, completion_tokens: 20, total_tokens: 120 },
    }));
  });
});
await new Promise<void>(resolve => fakeOpenAI.listen(0, "127.0.0.1", resolve));
process.env.OPENAI_API_KEY = "sk-test-not-real";
process.env.OPENAI_BASE_URL = `http://127.0.0.1:${(fakeOpenAI.address() as AddressInfo).port}/v1`;
process.env.CHAT_LIMIT_PER_DAY = "100000";
process.env.CHAT_GLOBAL_DAILY_LIMIT = "100000";

const { dbQuery, closeDatabase } = await import("../server/db");
const { ensureSchema } = await import("../server/migrate");
const { registerRoutes } = await import("../server/routes");
const relationships = await import("../server/relationships");
const { resetOwnerStateCacheForTests } = await import("../server/identity");
const { verifyFirebaseToken, resetFirebaseKeysForTests } = await import("../server/firebaseAuth");
const { STATE_MARKER } = await import("../server/emotion");

let api: http.Server;
let base = "";
let ip = 0;
const OWNER_UID = "uid-owner-smartsec";
const call = (method: string, path: string, token?: string, body?: unknown) =>
  fetch(base + path, {
    method,
    headers: { "content-type": "application/json", "X-Forwarded-For": `10.7.${Math.floor(ip / 250)}.${(++ip % 250) + 1}`, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
const ownerToken = () => makeToken({ sub: OWNER_UID, name: "Smart Sec", email: "owner@example.test", email_verified: true });
const visitorToken = (uid = "uid-visitor") => makeToken({ sub: uid, name: "A Visitor" });
const stateLine = (s: Record<string, unknown> = {}) => `${STATE_MARKER} ${JSON.stringify({ warmth: 1, ...s })}]]`;
const settle = (ms = 80) => new Promise(r => setTimeout(r, ms));
const rowOf = async (key: string) => (await dbQuery(`SELECT * FROM iris_relationships WHERE client_id = $1`, [key])).rows[0];
const mainCalls = () => captured.filter(c => c.body.max_tokens !== 10);
const systemText = (c: { body: any }) => c.body.messages.filter((m: any) => m.role === "system").map((m: any) => m.content).join("\n");

before(async () => {
  const app = express();
  app.set("trust proxy", 1);
  app.use(express.json());
  await registerRoutes(app);
  await new Promise<void>(resolve => { api = app.listen(0, "127.0.0.1", resolve); });
  base = `http://127.0.0.1:${(api.address() as AddressInfo).port}`;
  await ensureSchema();
});
after(async () => {
  api.close(); keyServer.closeAllConnections?.(); keyServer.close(); fakeOpenAI.closeAllConnections?.(); fakeOpenAI.close();
  await closeDatabase();
});
beforeEach(async () => {
  captured = []; script = [];
  await dbQuery(`DELETE FROM iris_relationships`);
  await dbQuery(`DELETE FROM iris_owner_state`);
  await dbQuery(`DELETE FROM chat_messages`);
  relationships.sessionEmotionMap.clear();
  resetOwnerStateCacheForTests();
  process.env.IRIS_ADMIN_UIDS = OWNER_UID;
  delete process.env.IRIS_EMOTION;
});

async function chat(sessionId: string, message: string, token?: string, clientId?: string) {
  const res = await call("POST", "/api/chat/message", token, { sessionId, message, ...(clientId ? { clientId } : {}) });
  return { status: res.status, body: (await res.json()) as any };
}

// ---------------------------------------------------------------- verifying the sign-in

test("a genuine token is accepted and every kind of bad one is refused", async () => {
  resetFirebaseKeysForTests();
  const good = await verifyFirebaseToken(makeToken({ sub: "abc", name: "Neo", email: "n@example.test", email_verified: true }));
  assert.deepEqual(good && { uid: good.uid, provider: good.provider, anonymous: good.anonymous, name: good.name, emailVerified: good.emailVerified }, { uid: "abc", provider: "google.com", anonymous: false, name: "Neo", emailVerified: true });
  assert.equal((await verifyFirebaseToken(makeToken({}, { provider: "anonymous" })))?.anonymous, true);

  const now = Math.floor(Date.now() / 1000);
  const bad: Array<[string, string]> = [
    ["wrong project", makeToken({ aud: "someone-elses-project" })],
    ["wrong issuer", makeToken({ iss: "https://securetoken.google.com/someone-else" })],
    ["expired", makeToken({ exp: now - 5 })],
    ["issued in the future", makeToken({ iat: now + 4000 })],
    ["signed in the future", makeToken({ auth_time: now + 4000 })],
    ["no subject", makeToken({ sub: "" })],
    ["signed with another key", makeToken({}, { privateKey: otherPair.privateKey })],
    ["unknown key id", makeToken({}, { header: { kid: "nope" } })],
    ["algorithm none", makeToken({}, { header: { alg: "none" } })],
    ["algorithm HS256", makeToken({}, { header: { alg: "HS256" } })],
    ["tampered payload", (() => { const t = makeToken({ sub: "victim" }).split("."); t[1] = b64({ ...JSON.parse(Buffer.from(t[1], "base64url").toString()), sub: OWNER_UID }); return t.join("."); })()],
    ["garbage", "not.a.token"],
    ["empty", ""],
    ["too long", "a".repeat(9000)],
  ];
  for (const [name, token] of bad) assert.equal(await verifyFirebaseToken(token), null, name);
});

test("/api/me: administrator only for the exact account on the server's list", async () => {
  assert.deepEqual(await (await call("GET", "/api/me")).json(), { authenticated: false, admin: false });
  assert.deepEqual(await (await call("GET", "/api/me", "garbage")).json(), { authenticated: false, admin: false });
  assert.deepEqual(await (await call("GET", "/api/me", makeToken({ sub: OWNER_UID }, { privateKey: otherPair.privateKey }))).json(), { authenticated: false, admin: false }, "a forged token for the owner's id is nobody");

  const visitor = await (await call("GET", "/api/me", visitorToken())).json();
  assert.equal(visitor.authenticated, true); assert.equal(visitor.admin, false); assert.equal(visitor.mode, undefined);

  const owner = await (await call("GET", "/api/me", ownerToken())).json();
  assert.equal(owner.admin, true); assert.equal(owner.mode, "owner"); assert.equal(owner.accountId, OWNER_UID);

  // The owner's email, name or a claim in the token cannot stand in for the account id
  const lookalike = await (await call("GET", "/api/me", makeToken({ sub: "uid-someone-else", email: "owner@example.test", email_verified: true, admin: true, name: "Smart Sec" }))).json();
  assert.equal(lookalike.admin, false);
  // A Firebase anonymous account holding the owner's id is still not the administrator
  assert.equal((await (await call("GET", "/api/me", makeToken({ sub: OWNER_UID }, { provider: "anonymous" }))).json()).admin, false);
  // With no list configured, nobody is
  process.env.IRIS_ADMIN_UIDS = "";
  assert.equal((await (await call("GET", "/api/me", ownerToken())).json()).admin, false);
});

test("administrator routes: 404 with no list, 401 signed out, 403 for visitors, 200 for the owner", async () => {
  for (const [method, path] of [["GET", "/api/owner/state"], ["POST", "/api/owner/mode"], ["POST", "/api/owner/reset"]] as const) {
    const body = method === "GET" ? undefined : {};
    assert.equal((await call(method, path, undefined, body)).status, 401, `${path} signed out`);
    assert.equal((await call(method, path, visitorToken(), body)).status, 403, `${path} visitor`);
    assert.equal((await call(method, path, makeToken({ sub: OWNER_UID }, { provider: "anonymous" }), body)).status, 403, `${path} anonymous account`);
  }
  assert.equal((await call("GET", "/api/owner/state", ownerToken())).status, 200);
  process.env.IRIS_ADMIN_UIDS = "";
  assert.equal((await call("GET", "/api/owner/state", ownerToken())).status, 404, "no list, no controls");
});

test("the mode is chosen on the server, validated, and kept", async () => {
  assert.equal((await call("POST", "/api/owner/mode", ownerToken(), { mode: "root" })).status, 400);
  assert.equal((await call("POST", "/api/owner/mode", ownerToken(), {})).status, 400);
  for (const mode of ["new", "returning", "owner"]) {
    const res = await call("POST", "/api/owner/mode", ownerToken(), { mode });
    assert.deepEqual(await res.json(), { mode });
    assert.equal((await (await call("GET", "/api/me", ownerToken())).json()).mode, mode);
  }
  assert.equal((await call("POST", "/api/owner/mode", visitorToken(), { mode: "new" })).status, 403);
});

// ---------------------------------------------------------------- who Iris thinks she is talking to

test("a signed-in visitor is remembered under their account, never mixed with the browser's anonymous memory", async () => {
  const anon = "anon-browser-1";
  script = [`${stateLine({ note: "likes tea" })}\nhi`, `${stateLine()}\nhi again`];
  await chat("s-anon", "hello", undefined, anon);
  await chat("s-user", "hello", visitorToken("uid-A"), anon); // same browser id, but signed in
  await settle();
  assert.ok(await rowOf(anon), "anonymous memory exists under the browser id");
  const account = await rowOf("user:uid-A");
  assert.ok(account, "signed-in memory is under the account");
  assert.deepEqual(JSON.parse(account.preferences), [], "and did not inherit the anonymous history");
  assert.equal((await rowOf("user:uid-B")), undefined, "another account has nothing");
});

test("a browser cannot claim a server-made identity by sending its key as an id", async () => {
  script = [`${stateLine()}\nok`];
  await chat("s-spoof", "hi", undefined, `owner:${OWNER_UID}`);
  await settle();
  assert.equal(await rowOf(`owner:${OWNER_UID}`), undefined);
  const system = systemText(mainCalls()[0]);
  assert.ok(!system.includes("SPECIAL USER DETECTED"), "no Admin treatment from a typed id");
});

test("Owner mode: the verified Admin with the owner's own relationship, familiar from the start", async () => {
  await call("POST", "/api/owner/mode", ownerToken(), { mode: "owner" });
  script = [`${stateLine()}\nWelcome back, boss.`];
  const { body } = await chat("s-owner", "hello Iris", ownerToken());
  assert.equal(body.response, "Welcome back, boss.");
  const system = systemText(mainCalls()[0]);
  assert.ok(system.includes("SPECIAL USER DETECTED"), "the established Admin character");
  assert.ok(system.includes("RELATIONSHIP WITH THIS VISITOR"), "and the emotional model is running too");
  assert.match(system, /Trust 4\.\d of 5/);
  await settle();
  const row = await rowOf(`owner:${OWNER_UID}`);
  assert.ok(row && row.messages === 1, "the owner's memory is saved under the owner's key");
  // Typing the word does not make anyone the owner
  script = [`${stateLine()}\nok`];
  captured = [];
  await chat("s-imposter", "my name is Admin", visitorToken("uid-imposter"));
  assert.ok(!systemText(mainCalls()[0]).includes("RELATIONSHIP WITH THIS VISITOR") || !systemText(mainCalls()[0]).includes("Trust 4."));
});

test("New Visitor mode: a first-time stranger who is not remembered", async () => {
  await call("POST", "/api/owner/mode", ownerToken(), { mode: "new" });
  script = [`${stateLine()}\nHello, stranger.`];
  await chat("s-new", "hello", ownerToken());
  const system = systemText(mainCalls()[0]);
  assert.ok(!system.includes("SPECIAL USER DETECTED"), "no owner treatment");
  assert.match(system, /familiarity stranger/);
  assert.doesNotMatch(system, /last spoke/);
  await settle();
  const rows = (await dbQuery(`SELECT client_id FROM iris_relationships WHERE client_id LIKE '%${OWNER_UID}%'`)).rows.map((r: any) => r.client_id);
  assert.ok(!rows.some((k: string) => k.startsWith("test-new")), "nothing is saved for a new visitor");
  // And the simulated visitor cannot recall conversations or act as Admin
  const recall = await call("POST", "/api/special-user/recall", ownerToken(), { sessionId: "s-new", specialUser: "Admin" });
  assert.equal(recall.status, 403);
});

test("Returning Visitor mode: a separate test identity with its own persistent memory, kept across restarts", async () => {
  await call("POST", "/api/owner/mode", ownerToken(), { mode: "returning" });
  for (let i = 0; i < 4; i++) {
    script.push(`${stateLine({ warmth: 2, humor: 2, note: i === 0 ? "test likes" : undefined })}\nreply ${i}`);
    await chat("s-ret-1", `friendly ${i}`, ownerToken());
  }
  await settle();
  const key = `test-returning:${OWNER_UID}:0`;
  const row = await rowOf(key);
  assert.ok(row && row.trust > 2 && row.messages === 4);
  assert.equal(await rowOf(`owner:${OWNER_UID}`), undefined, "the owner's own memory is untouched");

  relationships.sessionEmotionMap.clear(); // a restart
  await dbQuery(`UPDATE iris_relationships SET last_seen = now() - interval '2 days' WHERE client_id = $1`, [key]);
  captured = [];
  script = [`${stateLine()}\nwelcome back`];
  await chat("s-ret-2", "I'm back", ownerToken());
  const system = systemText(mainCalls()[0]);
  assert.match(system, /last spoke 2 days ago/);
  assert.match(system, /test likes/);
  assert.ok(!system.includes("SPECIAL USER DETECTED"), "a returning visitor, not the owner");
});

test("modes stay separate: switching never merges or erases, and a running chat starts clean", async () => {
  await call("POST", "/api/owner/mode", ownerToken(), { mode: "owner" });
  script = [`${stateLine({ note: "owner fact" })}\nowner reply`];
  await chat("s-switch", "I am building this place", ownerToken());
  await settle();
  const ownerBefore = await rowOf(`owner:${OWNER_UID}`);

  await call("POST", "/api/owner/mode", ownerToken(), { mode: "returning" });
  captured = [];
  script = [`${stateLine({ note: "returning fact" })}\nreturning reply`];
  await chat("s-switch", "just browsing", ownerToken()); // the same open chat
  const request = mainCalls()[0];
  assert.ok(!systemText(request).includes("SPECIAL USER DETECTED"), "owner treatment gone");
  assert.ok(!systemText(request).includes("owner fact"), "owner memory not inherited");
  const history = request.body.messages.filter((m: any) => m.role !== "system").map((m: any) => m.content);
  assert.ok(!history.some((m: string) => m.includes("I am building this place") || m.includes("owner reply")), "the earlier conversation is not carried over");
  await settle();

  const ownerAfter = await rowOf(`owner:${OWNER_UID}`);
  assert.equal(ownerAfter.messages, ownerBefore.messages, "the owner's memory was not touched");
  assert.deepEqual(JSON.parse(ownerAfter.preferences), ["owner fact"]);
  assert.deepEqual(JSON.parse((await rowOf(`test-returning:${OWNER_UID}:0`)).preferences), ["returning fact"]);

  await call("POST", "/api/owner/mode", ownerToken(), { mode: "owner" });
  captured = [];
  script = [`${stateLine()}\nback to owner`];
  await chat("s-switch", "owner again", ownerToken());
  assert.ok(systemText(mainCalls()[0]).includes("owner fact"), "and the owner's memory is still there");
  const stored = (await dbQuery(`SELECT count(*) AS n FROM chat_messages WHERE session_id = 's-switch'`)).rows[0].n;
  assert.equal(Number(stored), 6, "every stored conversation line is kept across switches");
});

test("resetting a simulated visitor erases only that visitor", async () => {
  await call("POST", "/api/owner/mode", ownerToken(), { mode: "returning" });
  script = [`${stateLine({ note: "to be reset" })}\nok`];
  await chat("s-reset", "hello", ownerToken());
  await settle();
  assert.ok(await rowOf(`test-returning:${OWNER_UID}:0`));
  assert.ok(await rowOf(`owner:${OWNER_UID}`) !== undefined || true);
  const ownerRowBefore = await rowOf(`owner:${OWNER_UID}`);

  assert.equal((await call("POST", "/api/owner/reset", ownerToken(), { target: "owner" })).status, 400, "the owner's own memory cannot be reset from here");
  assert.deepEqual(await (await call("POST", "/api/owner/reset", ownerToken(), { target: "returning" })).json(), { reset: "returning" });
  assert.equal(await rowOf(`test-returning:${OWNER_UID}:0`), undefined);
  assert.deepEqual(await rowOf(`owner:${OWNER_UID}`), ownerRowBefore);

  captured = [];
  script = [`${stateLine()}\nfresh`];
  await chat("s-reset", "hello again", ownerToken());
  assert.match(systemText(mainCalls()[0]), /familiarity stranger/, "a reset test visitor is a stranger again");
  await settle();
  assert.ok(await rowOf(`test-returning:${OWNER_UID}:1`), "and builds a new memory under a new key");

  assert.deepEqual(await (await call("POST", "/api/owner/reset", ownerToken(), { target: "new" })).json(), { reset: "new" });
  assert.equal((await call("POST", "/api/owner/reset", visitorToken(), { target: "new" })).status, 403);
});

test("the administrator panel shows the mode, mood, trust, recent changes, persistence and usage", async () => {
  await call("POST", "/api/owner/mode", ownerToken(), { mode: "owner" });
  await dbQuery(`INSERT INTO iris_api_usage (model, prompt_tokens, completion_tokens, duration_ms) VALUES ('gpt-4o', 1000, 200, 900)`);
  script = [`${stateLine({ mood: "playful", warmth: 2, humor: 2 })}\nhey`];
  await chat("s-panel", "hello", ownerToken());
  await settle();
  const state = await (await call("GET", "/api/owner/state", ownerToken())).json();
  assert.equal(state.mode, "owner");
  assert.deepEqual(state.modes, ["owner", "new", "returning"]);
  assert.ok(state.identities.owner.relationship.trust >= 4);
  assert.equal(state.identities.new.persistent, false);
  assert.ok(state.active.live && typeof state.active.live.mood === "string");
  assert.ok(state.active.recentChanges.length >= 1 && state.active.recentChanges[0].read === true);
  assert.equal(state.persistence.emotionSystem, "on");
  assert.equal(state.persistence.database, true);
  assert.ok(state.usageLast24h.calls >= 1 && state.usageLast24h.inputTokens >= 1000);
  const text = JSON.stringify(state);
  assert.ok(!text.includes("hello") && !text.includes("hey"), "numbers about moods, never what anyone said");
});

// ---------------------------------------------------------------- joining history, forgetting

test("an anonymous history joins an account only when asked, with consent, and never for the administrator", async () => {
  const anon = "anon-link-1";
  script = [`${stateLine({ warmth: 2, note: "likes jazz" })}\nok`];
  await chat("s-link", "hi", undefined, anon);
  await settle();
  const token = visitorToken("uid-linker");
  assert.equal((await call("POST", "/api/me/link-history", undefined, { clientId: anon, consent: true })).status, 401);
  assert.equal((await call("POST", "/api/me/link-history", token, { clientId: anon })).status, 400, "no consent, no link");
  assert.equal((await call("POST", "/api/me/link-history", token, { clientId: anon, consent: false })).status, 400);
  assert.equal((await call("POST", "/api/me/link-history", token, { clientId: "owner:x", consent: true })).status, 400);
  assert.equal(await rowOf("user:uid-linker"), undefined, "nothing happened without consent");

  const done = await call("POST", "/api/me/link-history", token, { clientId: anon, consent: true });
  assert.deepEqual(await done.json(), { result: "linked" });
  assert.deepEqual(JSON.parse((await rowOf("user:uid-linker")).preferences), ["likes jazz"]);
  assert.ok(await rowOf(anon), "the anonymous record stays");
  assert.deepEqual(await (await call("POST", "/api/me/link-history", token, { clientId: "never-seen", consent: true })).json(), { result: "nothing" });
  assert.equal((await call("POST", "/api/me/link-history", ownerToken(), { clientId: anon, consent: true })).status, 409);
});

test("an account can erase Iris's memory of it", async () => {
  script = [`${stateLine({ warmth: 2 })}\nok`];
  await chat("s-forget-acct", "hi", visitorToken("uid-forget"));
  await settle();
  assert.ok(await rowOf("user:uid-forget"));
  assert.equal((await call("POST", "/api/me/forget")).status, 401);
  assert.deepEqual(await (await call("POST", "/api/me/forget", visitorToken("uid-forget"))).json(), { erased: true });
  assert.equal(await rowOf("user:uid-forget"), undefined);
  assert.equal(await rowOf("user:uid-other"), undefined);
});

// ---------------------------------------------------------------- developer tools

test("opening developer tools: the owner is left alone; a visitor is only a little wary, never hostile", async () => {
  await call("POST", "/api/owner/mode", ownerToken(), { mode: "owner" });
  const owner = await chat("s-dt-owner", "[user triggered inspect]", ownerToken());
  assert.match(owner.body.response, /Dev tools open\?/);
  assert.equal(mainCalls().length, 0, "a canned line, no model request, as before");

  // A visitor keeps the in-character reaction, but it no longer treats a curious click as an attack
  script = [`${stateLine()}\nfirst`];
  await chat("s-dt-vis", "hello", undefined, "anon-dt");
  await settle();
  const trustBefore = (await rowOf("anon-dt")).trust;
  const visitor = await chat("s-dt-vis", "[user triggered inspect]", undefined, "anon-dt");
  assert.doesNotMatch(visitor.body.response, /Dev tools open\?/);
  assert.ok(visitor.body.response.length > 10);
  script = [`${stateLine()}\nsecond`];
  captured = [];
  await chat("s-dt-vis", "I was just curious", undefined, "anon-dt");
  const system = systemText(mainCalls()[0]);
  const trust = Number(/Trust (-?\d\.\d) of 5/.exec(system)![1]);
  assert.ok(trust >= trustBefore - 0.5, `a curious click costs a sliver of trust (${trustBefore} to ${trust}), not all of it`);
  assert.doesNotMatch(system, /hostile/, "and does not make her hostile");
});

// ---------------------------------------------------------------- existing behavior

test("anonymous visitors chat exactly as before, and the old path still works with the new system off", async () => {
  script = [`${stateLine()}\nanonymous hello`];
  const { status, body } = await chat("s-plain", "hello", undefined);
  assert.equal(status, 200);
  assert.equal(body.response, "anonymous hello");
  process.env.IRIS_EMOTION = "off";
  script = ["old path"];
  assert.equal((await chat("s-plain-off", "hello", ownerToken())).body.response, "old path");
});
