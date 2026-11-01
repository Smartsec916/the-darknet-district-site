// Daily report generation, delivery, retries and the scheduler endpoint, against an
// in-memory Postgres and a local stand-in for the email provider. No real email is sent.
process.env.IRIS_TEST_DB = "pglite";
import test, { before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import express from "express";

const { dbQuery, closeDatabase } = await import("../server/db");
const { ensureSchema } = await import("../server/migrate");
const { runDailyReport, buildParts, loadDay, validReportDate, previousUtcDate } = await import("../server/reports");
const { createAdminRouter } = await import("../server/admin");

interface Captured { headers: http.IncomingHttpHeaders; body: any }
let mail: http.Server;
let received: Captured[] = [];
// What the stand-in provider does with the next requests: an HTTP status, or "hang"
let script: Array<number | "hang"> = [];
let api: Server;
let apiBase = "";
let ip = 40;

const REPORT_TOKEN = "r".repeat(20) + "s".repeat(20) + "-report-test-token";
const NOW = new Date("2026-10-30T08:00:00Z");

before(async () => {
  mail = http.createServer((req, res) => {
    let raw = "";
    req.on("data", chunk => { raw += chunk; });
    req.on("end", () => {
      received.push({ headers: req.headers, body: JSON.parse(raw || "{}") });
      const next = script.shift() ?? 201;
      if (next === "hang") return; // never answers: the client times out
      res.writeHead(next, { "content-type": "application/json" });
      res.end(JSON.stringify(next < 300 ? { messageId: `<id-${received.length}@test>` } : { message: "provider says no" }));
    });
  });
  await new Promise<void>(resolve => mail.listen(0, "127.0.0.1", resolve));
  const app = express();
  app.set("trust proxy", 1);
  app.use(express.json());
  app.use(createAdminRouter());
  await new Promise<void>(resolve => { api = app.listen(0, "127.0.0.1", resolve); });
  apiBase = `http://127.0.0.1:${(api.address() as AddressInfo).port}`;
  await ensureSchema();
});
after(async () => {
  mail.closeAllConnections?.();
  mail.close();
  api.close();
  await closeDatabase();
});

beforeEach(() => {
  received = [];
  script = [];
  Object.assign(process.env, {
    IRIS_REPORTS_ENABLED: "true",
    BREVO_API_KEY: "test-key-not-real",
    BREVO_API_URL: `http://127.0.0.1:${(mail.address() as AddressInfo).port}/v3/smtp/email`,
    REPORT_SENDER_EMAIL: "iris@example.test",
    REPORT_RECIPIENT: "admin@example.test",
    REPORT_EMAIL_TIMEOUT_MS: "30000", // generous: a busy machine once pushed a local mail round trip past 3 s; the one test that needs a timeout sets its own
    REPORT_SEND_SPACING_MS: "0", // production waits a second between emails; the tests do not
  });
  for (const name of ["REPORT_PART_MAX_BYTES", "REPORT_PAGE_SIZE", "REPORT_MAX_PARTS_PER_RUN", "REPORT_RUN_BUDGET_MS", "REPORT_CATCHUP_DAYS"]) {
    delete process.env[name];
  }
});

async function seed(sessionId: string, rows: Array<[string, string, string, string?]>) {
  for (const [sender, text, when, status] of rows) {
    await dbQuery(
      `INSERT INTO chat_messages (session_id, sender, message, timestamp, language, status) VALUES ($1, $2, $3, $4::timestamp, 'english', $5)`,
      [sessionId, sender, text, when, status ?? "ok"]);
  }
}
const sentText = () => received.map(r => r.body.textContent as string).join("\n");

test("report dates are previous closed UTC days", () => {
  assert.equal(previousUtcDate(new Date("2026-10-30T08:00:00Z")), "2026-10-29");
  assert.equal(previousUtcDate(new Date("2026-03-01T00:00:00Z")), "2026-02-28");
  assert.equal(validReportDate("2026-10-29", NOW), true);
  assert.equal(validReportDate("2026-10-30", NOW), false); // still open
  assert.equal(validReportDate("2026-11-02", NOW), false);
  assert.equal(validReportDate("2026-02-30", NOW), false);
  assert.equal(validReportDate("yesterday", NOW), false);
});

test("nothing is sent while reports are disabled or email is not configured", async () => {
  delete process.env.IRIS_REPORTS_ENABLED;
  assert.equal((await runDailyReport({ date: "2026-10-29", now: NOW })).status, "disabled");
  process.env.IRIS_REPORTS_ENABLED = "true";
  delete process.env.BREVO_API_KEY;
  assert.equal((await runDailyReport({ date: "2026-10-29", now: NOW })).status, "not_configured");
  process.env.BREVO_API_KEY = "test-key-not-real";
  process.env.BREVO_API_URL = "http://evil.example/steal"; // keys are only ever sent over HTTPS
  assert.equal((await runDailyReport({ date: "2026-10-29", now: NOW })).status, "not_configured");
  assert.equal(received.length, 0);
});

test("only the previous UTC calendar day is reported, split exactly at midnight", async () => {
  await seed("edge-1", [
    ["user", "before the day", "2026-10-28 23:59:59"],
    ["iris", "reply before the day", "2026-10-28 23:59:59"],
    ["user", "first second of the day", "2026-10-29 00:00:00"],
    ["iris", "last second reply", "2026-10-29 23:59:59"],
    ["user", "next day starts", "2026-10-30 00:00:00"],
  ]);
  const { summary, conversations } = await loadDay("2026-10-29");
  assert.equal(summary.conversations, 1);
  assert.equal(summary.visitorMessages, 1);
  assert.equal(summary.irisMessages, 1);
  assert.deepEqual(conversations[0].messages.map(m => m.text), ["first second of the day", "last second reply"]);
  assert.equal(conversations[0].startedAt, "2026-10-28T23:59:59Z"); // the conversation began the day before
});

test("a report with several conversations is emailed once, to the configured address only", async () => {
  await seed("rep-a", [
    ["user", "What is Darknet District?", "2026-09-10 14:32:05"],
    ["iris", "Welcome to the District...", "2026-09-10 14:32:07"],
    ["user", "Do you have a game?", "2026-09-10 14:34:00"],
    ["iris", "VOID//RUNNER is part of our world...", "2026-09-10 14:34:02"],
  ]);
  await seed("rep-b", [
    ["user", "你好，伊娃", "2026-09-10 20:00:00"],
    ["iris", "Sorry, I got distracted for a second. Mind repeating that?", "2026-09-10 20:00:03", "fallback"],
  ]);
  await seed("rep-c", [["user", "unanswered message", "2026-09-10 21:00:00", "error"]]);
  await dbQuery(`INSERT INTO iris_api_usage (created_at, model, prompt_tokens, completion_tokens, duration_ms)
                 VALUES ('2026-09-10 14:32:06', 'gpt-4o', 2000000, 500000, 900), ('2026-09-11 00:00:00', 'gpt-4o', 999, 999, 10)`);

  const outcome = await runDailyReport({ date: "2026-09-10", now: NOW, retryDelayMs: 0 });
  assert.equal(outcome.status, "sent");
  assert.equal(received.length, 1);
  const mailBody = received[0].body;
  assert.equal(mailBody.subject, "Darknet District — Iris Daily Conversation Report — 2026-09-10");
  assert.deepEqual(mailBody.to, [{ email: "admin@example.test" }]);
  assert.equal(mailBody.sender.email, "iris@example.test");
  assert.equal(received[0].headers["api-key"], "test-key-not-real");
  const text: string = mailBody.textContent;
  assert.match(text, /Conversations:\s+3/);
  assert.match(text, /Visitor messages:\s+4/);
  assert.match(text, /Iris responses:\s+3/);
  assert.match(text, /Reporting period \(UTC\): 2026-09-10 00:00:00 to 2026-09-10 23:59:59/);
  assert.match(text, /Failed or incomplete:\s+2 \(1 canned fallback replies because OpenAI failed, 1 visitor messages with no reply\)/);
  assert.match(text, /2000000 prompt \+ 500000 completion tokens/);
  assert.match(text, /\$10\.0000/); // 2M * $2.50/M + 0.5M * $10/M
  assert.match(text, /Conversation 1 of 3[\s\S]*Session: rep-a/);
  assert.match(text, /14:32:05 UTC — Visitor:\n    What is Darknet District\?/);
  assert.match(text, /14:32:07 UTC — Iris:\n    Welcome to the District\.\.\./);
  assert.match(text, /你好，伊娃/);
  assert.match(text, /Iris \(canned fallback reply; OpenAI failed\)/);
  assert.match(text, /Visitor \(no reply was produced; processing error\)/);
  assert.ok(text.indexOf("Session: rep-a") < text.indexOf("Session: rep-b") && text.indexOf("Session: rep-b") < text.indexOf("Session: rep-c"));
  assert.equal(mailBody.attachment, undefined); // small days are readable in the body itself
});

test("a day that was already sent is never sent again", async () => {
  await seed("dupe-a", [["user", "one message", "2026-09-12 10:00:00"], ["iris", "one reply", "2026-09-12 10:00:02"]]);
  assert.equal((await runDailyReport({ date: "2026-09-12", now: NOW })).status, "sent");
  assert.equal(received.length, 1);
  assert.equal((await runDailyReport({ date: "2026-09-12", now: NOW })).status, "already_sent");
  assert.equal((await runDailyReport({ date: "2026-09-12", now: NOW })).status, "already_sent");
  assert.equal(received.length, 1);
  const row = (await dbQuery(`SELECT status, attempts FROM iris_daily_reports WHERE report_date = '2026-09-12'`)).rows[0];
  assert.equal(row.status, "sent");
});

test("a day with no conversations still sends a short zero-activity report", async () => {
  const outcome = await runDailyReport({ date: "2026-08-01", now: NOW });
  assert.equal(outcome.status, "sent");
  assert.equal(received.length, 1);
  assert.match(sentText(), /Conversations:\s+0/);
  assert.match(sentText(), /No conversations on this day\./);
});

test("a long day is split into numbered parts with every message exactly once", async () => {
  process.env.REPORT_PART_MAX_BYTES = "3500";
  const ids: string[] = [];
  for (let c = 0; c < 6; c++) {
    const rows: Array<[string, string, string]> = [];
    for (let m = 0; m < 12; m++) {
      const id = `msg-${c}-${m}-${"x".repeat(60)}`;
      ids.push(id);
      rows.push([m % 2 ? "iris" : "user", id, `2026-07-05 ${String(8 + c).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`]);
    }
    await seed(`big-${c}`, rows);
  }
  const outcome = await runDailyReport({ date: "2026-07-05", now: NOW, retryDelayMs: 0 });
  assert.equal(outcome.status, "sent");
  assert.ok(received.length > 2, `expected several parts, got ${received.length}`);
  // Numbered emails with the transcripts in the body itself: no attachments, no HTML
  assert.ok(received.every(r => r.body.attachment === undefined && r.body.htmlContent === undefined));
  received.forEach((r, i) => assert.match(r.body.subject, new RegExp(`\\(Part ${i + 1} of ${received.length}\\)$`)));
  received.forEach((r, i) => assert.match(r.body.textContent, new RegExp(`This is email ${i + 1} of ${received.length} for this day`)));
  const all = sentText();
  for (const id of ids) assert.equal(all.split(id).length - 1, 1, `${id.slice(0, 12)} must appear exactly once`);
  received.forEach(r => assert.ok(Buffer.byteLength(r.body.textContent) <= 3500 + 1500, "each email stays near the size limit"));
});

test("one huge conversation is split across parts without losing a message", async () => {
  const conversations = [{
    sessionId: "huge", startedAt: "2026-07-06T00:00:00Z",
    messages: Array.from({ length: 200 }, (_, i) => ({
      sender: i % 2 ? "iris" : "user", text: `line ${i} ` + "y".repeat(80), at: "2026-07-06T00:00:00Z", status: "ok", language: null,
    })),
  }];
  const parts = buildParts(conversations, { part: 4000 });
  assert.ok(parts.length > 3);
  assert.ok(parts.every(p => p.bytes <= 4000));
  const joined = parts.map(p => p.text).join("\n");
  for (let i = 0; i < 200; i++) assert.equal(joined.split(`line ${i} y`).length - 1, 1);
  assert.match(parts[1].text, /\(continued, part 2\)/);
});

test("temporary provider errors are retried without sending a copy", async () => {
  await seed("retry-a", [["user", "retry me", "2026-06-02 10:00:00"], ["iris", "ok", "2026-06-02 10:00:01"]]);
  script = [500, 429, 201];
  const outcome = await runDailyReport({ date: "2026-06-02", now: NOW, retryDelayMs: 0 });
  assert.equal(outcome.status, "sent");
  assert.equal(received.length, 3); // two rejected attempts, one accepted
  const parts = (await dbQuery(`SELECT status FROM iris_report_parts WHERE report_date = '2026-06-02'`)).rows;
  assert.deepEqual(parts.map((r: any) => r.status), ["sent"]);
});

test("a failed delivery resumes later and sends only the parts that were not sent", async () => {
  process.env.REPORT_PART_MAX_BYTES = "2500";
  for (let c = 0; c < 4; c++) {
    await seed(`resume-${c}`, Array.from({ length: 8 }, (_, m) => [m % 2 ? "iris" : "user", `resume-${c}-${m}-${"z".repeat(70)}`, `2026-05-03 1${c}:0${m}:00`] as [string, string, string]));
  }
  const total = buildParts((await loadDay("2026-05-03")).conversations).length;
  assert.ok(total >= 3);
  // Part 1 is accepted; part 2 is refused three times in a row
  script = [201, 503, 503, 503];
  const first = await runDailyReport({ date: "2026-05-03", now: NOW, retryDelayMs: 0 });
  assert.equal(first.status, "failed");
  assert.equal((first as any).partsSent, 1);
  assert.equal(received.length, 4); // 1 accepted + 3 refused attempts at part 2
  assert.equal((await dbQuery(`SELECT status FROM iris_daily_reports WHERE report_date = '2026-05-03'`)).rows[0].status, "failed");

  received = [];
  const second = await runDailyReport({ date: "2026-05-03", now: NOW, retryDelayMs: 0 });
  assert.equal(second.status, "sent");
  assert.equal(received.length, total - 1); // part 1 is not sent again
  assert.ok(received.every(r => !/Part 1 of/.test(r.body.subject)));
  received = [];
  assert.equal((await runDailyReport({ date: "2026-05-03", now: NOW })).status, "already_sent");
  assert.equal(received.length, 0);
});

test("a timeout is not retried automatically because the email may have been delivered", async () => {
  process.env.REPORT_EMAIL_TIMEOUT_MS = "300";
  await seed("hang-a", [["user", "slow mail", "2026-04-04 10:00:00"], ["iris", "ok", "2026-04-04 10:00:01"]]);
  script = ["hang"];
  const outcome = await runDailyReport({ date: "2026-04-04", now: NOW, retryDelayMs: 0 });
  assert.equal(outcome.status, "failed");
  assert.match((outcome as any).error, /delivery unknown/);
  assert.equal(received.length, 1);
});

test("two simultaneous runs for the same day send one report", async () => {
  await seed("race-a", [["user", "race", "2026-03-03 10:00:00"], ["iris", "ok", "2026-03-03 10:00:01"]]);
  const [a, b] = await Promise.all([
    runDailyReport({ date: "2026-03-03", now: NOW }),
    runDailyReport({ date: "2026-03-03", now: NOW }),
  ]);
  assert.deepEqual([a.status, b.status].sort(), ["in_progress", "sent"]);
  assert.equal(received.length, 1);
});

test("a dry run reports counts without sending or returning any transcript", async () => {
  await seed("dry-a", [["user", "secret dry run text", "2026-02-02 10:00:00"], ["iris", "private reply", "2026-02-02 10:00:01"]]);
  const outcome = await runDailyReport({ date: "2026-02-02", now: NOW, dryRun: true });
  assert.equal(outcome.status, "dry_run");
  assert.equal((outcome as any).summary.visitorMessages, 1);
  assert.ok(!JSON.stringify(outcome).includes("secret dry run text"));
  assert.equal(received.length, 0);
  assert.equal((await dbQuery(`SELECT COUNT(*) AS n FROM iris_daily_reports WHERE report_date = '2026-02-02'`)).rows[0].n, 0);
});

test("the scheduler endpoint needs its own token and never takes a recipient", async () => {
  const post = (token: string | undefined, body: unknown = {}) => fetch(apiBase + "/api/admin/reports/daily", {
    method: "POST",
    headers: { "content-type": "application/json", "X-Forwarded-For": `10.2.0.${++ip}`, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  delete process.env.IRIS_REPORT_TOKEN;
  delete process.env.IRIS_ADMIN_TOKEN;
  assert.equal((await post(REPORT_TOKEN)).status, 404); // no token configured: the endpoint does not exist
  process.env.IRIS_REPORT_TOKEN = REPORT_TOKEN;
  assert.equal((await post(undefined)).status, 401);
  assert.equal((await post("wrong".repeat(10))).status, 401);
  assert.equal(received.length, 0);

  await seed("http-a", [["user", "via endpoint", "2026-01-05 10:00:00"], ["iris", "ok", "2026-01-05 10:00:01"]]);
  const res = await post(REPORT_TOKEN, { date: "2026-01-05", recipient: "attacker@example.com", to: "attacker@example.com" });
  assert.equal(res.status, 200);
  const outcome = await res.json();
  assert.equal(outcome.status, "sent");
  assert.ok(!JSON.stringify(outcome).includes("via endpoint"), "the response never contains transcripts");
  assert.deepEqual(received[0].body.to, [{ email: "admin@example.test" }]);
  assert.equal((await post(REPORT_TOKEN, { date: "2026-01-05" })).status, 200); // already sent: harmless
  assert.equal(received.length, 1);
  assert.equal((await post(REPORT_TOKEN, { date: "not-a-date" })).status, 400);
  process.env.IRIS_REPORTS_ENABLED = "false";
  assert.equal((await post(REPORT_TOKEN, { date: "2025-12-01" })).status, 503);
});
