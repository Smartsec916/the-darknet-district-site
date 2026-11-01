// Conversation persistence and the administrator API, against an in-memory Postgres.
process.env.IRIS_TEST_DB = "pglite";
import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import express from "express";

const { dbQuery, closeDatabase } = await import("../server/db");
const { ensureSchema, REQUIRED_TABLES } = await import("../server/migrate");
const { saveExchange, findStoredReply, requestKey } = await import("../server/persistence");
const { createAdminRouter } = await import("../server/admin");

const ADMIN_TOKEN = "a".repeat(20) + "b".repeat(20) + "-admin-test-token";
const REPORT_TOKEN = "r".repeat(20) + "s".repeat(20) + "-report-test-token";
let server: Server;
let base = "";
let ipCounter = 10;

// Every request comes from its own fake client address, so one test's failed
// logins never count against another's rate limit
const get = (path: string, token?: string, ip = `10.0.0.${++ipCounter}`) =>
  fetch(base + path, { headers: { "X-Forwarded-For": ip, ...(token ? { Authorization: `Bearer ${token}` } : {}) } });

const at = (iso: string) => new Date(iso);

async function exchange(sessionId: string, visitor: string, iris: string, when: string, extra: Record<string, unknown> = {}) {
  return saveExchange({
    sessionId, requestId: requestKey(sessionId, visitor), visitorText: visitor, visitorAt: at(when),
    visitorStatus: "ok", language: "english",
    iris: { text: iris, status: "ok", at: new Date(at(when).getTime() + 1500) },
    ...extra,
  });
}

before(async () => {
  const app = express();
  app.set("trust proxy", 1);
  app.use(express.json());
  app.use(createAdminRouter());
  await new Promise<void>(resolve => { server = app.listen(0, "127.0.0.1", resolve); });
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(async () => {
  server.close();
  await closeDatabase();
});

test("schema setup keeps existing conversations and is safe to repeat", async () => {
  // A legacy database: the original tables, with a stored conversation, before any new columns
  await dbQuery(`CREATE TABLE chat_messages (id serial PRIMARY KEY, session_id text NOT NULL, sender text NOT NULL,
                 message text NOT NULL, timestamp timestamp NOT NULL DEFAULT now())`);
  await dbQuery(`INSERT INTO chat_messages (session_id, sender, message, timestamp)
                 VALUES ('legacy-1', 'user', 'old question', '2026-01-02 03:04:05'), ('legacy-1', 'iris', 'old answer', '2026-01-02 03:04:09')`);
  assert.equal(await ensureSchema(), true);
  const tables = (await dbQuery(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`)).rows.map((r: any) => r.table_name);
  for (const table of REQUIRED_TABLES) assert.ok(tables.includes(table), `missing ${table}`);
  const legacy = (await dbQuery(`SELECT message, status, request_id FROM chat_messages WHERE session_id = 'legacy-1' ORDER BY id`)).rows;
  assert.deepEqual(legacy.map((r: any) => r.message), ["old question", "old answer"]);
  assert.deepEqual(legacy.map((r: any) => r.status), ["ok", "ok"]);
  assert.equal(await ensureSchema(), true); // running again changes nothing
  assert.equal(Number((await dbQuery(`SELECT COUNT(*) AS n FROM chat_messages`)).rows[0].n), 2);
});

test("an exchange is stored in order, as distinct visitor and Iris rows, in UTC", async () => {
  assert.equal(await exchange("s-order", "What is Darknet District?", "Welcome to the District.", "2026-10-29T14:32:05.000Z"), true);
  const rows = (await dbQuery(
    `SELECT sender, message, to_char(timestamp, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS ts, language, status
     FROM chat_messages WHERE session_id = 's-order' ORDER BY timestamp, id`)).rows;
  assert.deepEqual(rows.map((r: any) => r.sender), ["user", "iris"]);
  assert.equal(rows[0].message, "What is Darknet District?");
  assert.equal(rows[1].message, "Welcome to the District.");
  assert.equal(rows[0].ts, "2026-10-29T14:32:05Z");
  assert.equal(rows[1].ts, "2026-10-29T14:32:06Z");
  assert.equal(rows[0].language, "english");
  assert.equal((await dbQuery(`SELECT COUNT(*) AS n FROM chat_sessions WHERE session_id = 's-order'`)).rows[0].n, 1);
});

test("the same request is never stored twice and is answered from storage", async () => {
  const key = requestKey("s-dupe", "hello", 3);
  assert.equal(key, requestKey("s-dupe", "hello", 3));
  assert.notEqual(key, requestKey("s-dupe", "hello", 4));
  const input = {
    sessionId: "s-dupe", requestId: key, visitorText: "hello", visitorAt: at("2026-10-29T10:00:00Z"),
    visitorStatus: "ok" as const, iris: { text: "hi there", status: "ok" as const, at: at("2026-10-29T10:00:02Z") },
  };
  assert.equal(await saveExchange(input), true);
  assert.equal(await saveExchange(input), true);
  assert.equal(Number((await dbQuery(`SELECT COUNT(*) AS n FROM chat_messages WHERE session_id = 's-dupe'`)).rows[0].n), 2);
  assert.deepEqual(await findStoredReply(key), { text: "hi there", status: "ok" });
  assert.equal(await findStoredReply("no-such-request"), null);
});

test("failed replies are recorded honestly without inventing a message", async () => {
  await saveExchange({
    sessionId: "s-fail", requestId: "fail-1", visitorText: "does this work?", visitorAt: at("2026-10-29T11:00:00Z"),
    visitorStatus: "error",
  });
  await saveExchange({
    sessionId: "s-fail", requestId: "fail-2", visitorText: "and now?", visitorAt: at("2026-10-29T11:01:00Z"), visitorStatus: "ok",
    iris: { text: "Sorry, I got distracted for a second. Mind repeating that?", status: "fallback", at: at("2026-10-29T11:01:03Z") },
  });
  const rows = (await dbQuery(`SELECT sender, status FROM chat_messages WHERE session_id = 's-fail' ORDER BY timestamp, id`)).rows;
  assert.deepEqual(rows.map((r: any) => `${r.sender}:${r.status}`), ["user:error", "user:ok", "iris:fallback"]);
});

test("multilingual text round-trips exactly", async () => {
  const samples = ["你好，伊娃。今天怎么样？", "مرحبا بك في المنطقة", "Привет, как дела?", "こんにちは 🌃 ñandú café"];
  for (const [i, text] of samples.entries()) {
    await exchange(`s-lang-${i}`, text, text + " ✔", `2026-10-29T12:0${i}:00Z`);
    const row = (await dbQuery(`SELECT message FROM chat_messages WHERE session_id = $1 AND sender = 'user'`, [`s-lang-${i}`])).rows[0];
    assert.equal(row.message, text);
  }
});

test("the admin API does not exist unless it is enabled with a strong token", async () => {
  delete process.env.IRIS_ADMIN_VIEWER;
  delete process.env.IRIS_ADMIN_TOKEN;
  assert.equal((await get("/admin")).status, 404);
  assert.equal((await get("/api/admin/stats", ADMIN_TOKEN)).status, 404);
  process.env.IRIS_ADMIN_VIEWER = "on";
  assert.equal((await get("/api/admin/stats", "short")).status, 404); // no token configured yet
  process.env.IRIS_ADMIN_TOKEN = "too-short"; // below 32 characters: ignored, never a weak default
  assert.equal((await get("/api/admin/stats", "too-short")).status, 404);
});

test("administrator requests need the exact token", async () => {
  process.env.IRIS_ADMIN_VIEWER = "on";
  process.env.IRIS_ADMIN_TOKEN = ADMIN_TOKEN;
  for (const path of ["/api/admin/stats", "/api/admin/conversations", "/api/admin/conversations/s-order", "/api/admin/reports"]) {
    assert.equal((await get(path)).status, 401, `${path} without a token`);
    assert.equal((await get(path, "x".repeat(40))).status, 401, `${path} with a wrong token`);
    assert.equal((await get(path, ADMIN_TOKEN + "x")).status, 401, `${path} with a near-miss token`);
  }
  assert.equal((await get("/api/admin/stats", ADMIN_TOKEN)).status, 200);
  // Claiming to be Admin in a query string or header grants nothing
  assert.equal((await fetch(base + "/api/admin/stats?admin=true&name=Admin", { headers: { "X-Admin": "true", "X-Forwarded-For": "10.9.9.9" } })).status, 401);
});

test("the report-only token cannot read conversations", async () => {
  process.env.IRIS_ADMIN_VIEWER = "on";
  process.env.IRIS_ADMIN_TOKEN = ADMIN_TOKEN;
  process.env.IRIS_REPORT_TOKEN = REPORT_TOKEN;
  assert.equal((await get("/api/admin/conversations", REPORT_TOKEN)).status, 401);
  assert.equal((await get("/api/admin/conversations/s-order", REPORT_TOKEN)).status, 401);
});

test("the viewer page carries no data and is locked down", async () => {
  process.env.IRIS_ADMIN_VIEWER = "on";
  process.env.IRIS_ADMIN_TOKEN = ADMIN_TOKEN;
  const res = await get("/admin");
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.ok(!html.includes("s-order") && !html.includes("Darknet District?"));
  assert.ok(!html.includes(ADMIN_TOKEN));
  assert.ok(!html.includes("innerHTML"), "conversation text must only be inserted as text");
  assert.match(res.headers.get("content-security-policy") ?? "", /frame-ancestors 'none'/);
  assert.equal(res.headers.get("cache-control"), "no-store");
});

test("conversations list newest first with search, filters and pagination", async () => {
  process.env.IRIS_ADMIN_VIEWER = "on";
  process.env.IRIS_ADMIN_TOKEN = ADMIN_TOKEN;
  for (let i = 1; i <= 7; i++) {
    await exchange(`page-${i}`, `pagination question ${i} 100% sure`, `pagination answer ${i}`, `2026-11-0${i}T09:00:00Z`);
  }
  const list = await (await get("/api/admin/conversations?q=pagination&pageSize=3&page=1", ADMIN_TOKEN)).json();
  assert.equal(list.total, 7);
  assert.deepEqual(list.conversations.map((c: any) => c.sessionId), ["page-7", "page-6", "page-5"]);
  const page3 = await (await get("/api/admin/conversations?q=pagination&pageSize=3&page=3", ADMIN_TOKEN)).json();
  assert.deepEqual(page3.conversations.map((c: any) => c.sessionId), ["page-1"]);
  assert.equal(list.conversations[0].messageCount, 2);
  assert.equal(list.conversations[0].firstVisitorMessage, "pagination question 7 100% sure");

  const byDate = await (await get("/api/admin/conversations?from=2026-11-02&to=2026-11-03", ADMIN_TOKEN)).json();
  assert.deepEqual(byDate.conversations.map((c: any) => c.sessionId), ["page-3", "page-2"]);
  const bySession = await (await get("/api/admin/conversations?session=page-4", ADMIN_TOKEN)).json();
  assert.deepEqual(bySession.conversations.map((c: any) => c.sessionId), ["page-4"]);
  const iris = await (await get("/api/admin/conversations?q=answer%205&type=iris", ADMIN_TOKEN)).json();
  assert.deepEqual(iris.conversations.map((c: any) => c.sessionId), ["page-5"]);
  const visitorOnly = await (await get("/api/admin/conversations?q=answer%205&type=visitor", ADMIN_TOKEN)).json();
  assert.equal(visitorOnly.total, 0);
  // A wildcard typed by the admin is a literal character, not "match everything"
  assert.equal((await (await get("/api/admin/conversations?q=%25", ADMIN_TOKEN)).json()).total, 7);
  assert.equal((await (await get("/api/admin/conversations?q=_", ADMIN_TOKEN)).json()).total, 0); // no stored text has an underscore
  const failed = await (await get("/api/admin/conversations?status=fallback", ADMIN_TOKEN)).json();
  assert.deepEqual(failed.conversations.map((c: any) => c.sessionId), ["s-fail"]);
  assert.equal(failed.conversations[0].errorCount, 2);
  const stats = await (await get("/api/admin/stats", ADMIN_TOKEN)).json();
  assert.ok(stats.conversations >= 12 && stats.messages > stats.conversations);
});

test("a conversation shows only its own messages, in order, with UTC times", async () => {
  process.env.IRIS_ADMIN_VIEWER = "on";
  process.env.IRIS_ADMIN_TOKEN = ADMIN_TOKEN;
  await exchange("iso-a", "message from visitor A", "reply to visitor A", "2026-12-01T08:00:00Z");
  await exchange("iso-b", "message from visitor B", "reply to visitor B", "2026-12-01T08:00:00Z");
  const a = await (await get("/api/admin/conversations/iso-a", ADMIN_TOKEN)).json();
  assert.deepEqual(a.messages.map((m: any) => m.message), ["message from visitor A", "reply to visitor A"]);
  assert.deepEqual(a.messages.map((m: any) => m.timestamp), ["2026-12-01T08:00:00Z", "2026-12-01T08:00:01Z"]);
  assert.equal(a.startedAt, "2026-12-01T08:00:00Z");
  assert.ok(!JSON.stringify(a).includes("visitor B"));
  assert.equal((await get("/api/admin/conversations/does-not-exist", ADMIN_TOKEN)).status, 404);
});

test("the viewer marks automatic browser-trigger exchanges and leaves ordinary chat unmarked", async () => {
  process.env.IRIS_ADMIN_VIEWER = "on";
  process.env.IRIS_ADMIN_TOKEN = ADMIN_TOKEN;
  await exchange("auto-a", "你好", "你好，我是 Iris。", "2026-12-02T08:00:00Z");
  await exchange("auto-a", "[user triggered inspect]", "Oh, peeking under the hood?", "2026-12-02T08:01:00Z");
  await exchange("auto-a", "还有别的吗", "当然。", "2026-12-02T08:02:00Z");
  const d = await (await get("/api/admin/conversations/auto-a", ADMIN_TOKEN)).json();
  assert.deepEqual(d.messages.map((m: any) => m.automated), [false, false, true, true, false, false]);
  assert.equal(d.messages.length, 6, "nothing is hidden or removed, only labelled");
  const html = await (await get("/admin")).text();
  assert.match(html, /automatic browser trigger/);
  assert.match(html, /never appear here/, "the viewer says what it cannot show");
});

test("repeated wrong tokens are rate limited", async () => {
  process.env.IRIS_ADMIN_VIEWER = "on";
  process.env.IRIS_ADMIN_TOKEN = ADMIN_TOKEN;
  const statuses: number[] = [];
  for (let i = 0; i < 13; i++) statuses.push((await get("/api/admin/stats", "nope", "10.77.0.1")).status);
  assert.equal(statuses[0], 401);
  assert.equal(statuses.at(-1), 429);
  // Another client is unaffected, and so is the right token
  assert.equal((await get("/api/admin/stats", ADMIN_TOKEN, "10.77.0.2")).status, 200);
});
