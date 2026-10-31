// The daily report's promises, tested end to end against an in-memory Postgres and a local
// stand-in for Brevo (no real email, no real conversation):
//   full transcripts with nothing missing, doubled or reordered; visitor text treated as
//   untrusted; large days read in pages and split into numbered emails; resumable, never
//   duplicated, caught up when a day was missed; and nothing private in the logs.
process.env.IRIS_TEST_DB = "pglite";
import test, { before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import express from "express";

const { dbQuery, closeDatabase } = await import("../server/db");
const { ensureSchema } = await import("../server/migrate");
const reports = await import("../server/reports");
const { runDailyReport, runScheduledReports, pendingDates, loadDay, buildParts, previousUtcDate, safeText } = reports;
const { createAdminRouter } = await import("../server/admin");

interface Captured { headers: http.IncomingHttpHeaders; body: any }
let mail: http.Server;
let received: Captured[] = [];
// What the stand-in provider does with the next requests: a status, or { status, retryAfter }
let script: Array<number | { status: number; retryAfter: string }> = [];
let api: Server;
let apiBase = "";
let ip = 60;

const REPORT_TOKEN = "t".repeat(20) + "u".repeat(20) + "-transcript-report-token";
const NOW = new Date("2026-11-10T08:00:00Z"); // "yesterday" is 2026-11-09

before(async () => {
  mail = http.createServer((req, res) => {
    let raw = "";
    req.on("data", c => { raw += c; });
    req.on("end", () => {
      received.push({ headers: req.headers, body: JSON.parse(raw || "{}") });
      const next = script.shift() ?? 201;
      const status = typeof next === "number" ? next : next.status;
      res.writeHead(status, { "content-type": "application/json", ...(typeof next === "object" ? { "retry-after": next.retryAfter } : {}) });
      res.end(JSON.stringify(status < 300 ? { messageId: `<id-${received.length}@test>` } : { message: "provider says no" }));
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
after(async () => { mail.closeAllConnections?.(); mail.close(); api.close(); await closeDatabase(); });

beforeEach(() => {
  received = [];
  script = [];
  Object.assign(process.env, {
    IRIS_REPORTS_ENABLED: "true",
    BREVO_API_KEY: "test-key-not-real-0123456789",
    BREVO_API_URL: `http://127.0.0.1:${(mail.address() as AddressInfo).port}/v3/smtp/email`,
    REPORT_SENDER_EMAIL: "reports@example.test",
    REPORT_RECIPIENT: "admin@example.test",
    REPORT_EMAIL_TIMEOUT_MS: "3000",
    REPORT_SEND_SPACING_MS: "0",
    IRIS_REPORT_TOKEN: REPORT_TOKEN,
  });
  for (const name of ["REPORT_PART_MAX_BYTES", "REPORT_PAGE_SIZE", "REPORT_MAX_PARTS_PER_RUN", "REPORT_RUN_BUDGET_MS", "REPORT_CATCHUP_DAYS"]) delete process.env[name];
});

interface Row { session: string; sender: "user" | "iris"; text: string; when: string; status?: string }
async function seed(rows: Row[]) {
  for (let i = 0; i < rows.length; i += 400) {
    const chunk = rows.slice(i, i + 400);
    const params: unknown[] = [];
    const tuples = chunk.map(r => {
      const b = params.length;
      params.push(r.session, r.sender, r.text, r.when, r.status ?? "ok");
      return `($${b + 1}, $${b + 2}, $${b + 3}, $${b + 4}::timestamp, 'english', $${b + 5})`;
    });
    await dbQuery(`INSERT INTO chat_messages (session_id, sender, message, timestamp, language, status) VALUES ${tuples.join(", ")}`, params);
  }
}
const bodies = () => received.map(r => r.body.textContent as string);
const allText = () => bodies().join("\n");
const subjects = () => received.map(r => r.body.subject as string);
const HEADER_LINE = /^\d\d:\d\d:\d\d UTC — (Visitor|Iris)/;

// ------------------------------------------------------------------ completeness and order

test("a big day is read in pages and every message arrives exactly once, in order", async () => {
  const rows: Row[] = [];
  let n = 0;
  for (let s = 0; s < 120; s++) {
    for (let m = 0; m < 21; m++) {
      const second = (s * 331 + m * 17) % 86400;
      const hh = String(Math.floor(second / 3600)).padStart(2, "0"), mm = String(Math.floor(second / 60) % 60).padStart(2, "0"), ss = String(second % 60).padStart(2, "0");
      // 60 messages share one second so pages must split ties by id, not skip or repeat them
      const when = n % 42 === 0 ? "2026-06-01 12:00:00" : `2026-06-01 ${hh}:${mm}:${ss}`;
      rows.push({ session: `big-${s}`, sender: m % 2 ? "iris" : "user", text: `token-${n++}-end`, when });
    }
  }
  await seed(rows);

  process.env.REPORT_PAGE_SIZE = "137"; // not a divisor of anything
  const paged = await loadDay("2026-06-01");
  process.env.REPORT_PAGE_SIZE = "1000000";
  const whole = await loadDay("2026-06-01");
  assert.deepEqual(paged.conversations, whole.conversations, "paging changes nothing");
  assert.equal(paged.summary.visitorMessages + paged.summary.irisMessages, rows.length);
  assert.equal(paged.summary.conversations, 120);

  // Exactly the database's own order, per conversation
  const expected = (await dbQuery(`SELECT session_id, message FROM chat_messages ORDER BY timestamp, id`)).rows;
  const perSession = new Map<string, string[]>();
  for (const r of expected) perSession.set(r.session_id, [...(perSession.get(r.session_id) ?? []), r.message]);
  for (const c of paged.conversations) assert.deepEqual(c.messages.map(m => m.text), perSession.get(c.sessionId), c.sessionId);
  const seen = paged.conversations.flatMap(c => c.messages.map(m => m.text));
  assert.equal(new Set(seen).size, rows.length, "no message repeated");
  for (let i = 0; i < rows.length; i += 97) assert.ok(seen.includes(`token-${i}-end`));

  // And all of it makes it into the numbered emails, once
  process.env.REPORT_PART_MAX_BYTES = "5000";
  process.env.REPORT_PAGE_SIZE = "250";
  const outcome = await runDailyReport({ date: "2026-06-01", now: NOW, retryDelayMs: 0, budget: { partsLeft: 1000, deadline: Date.now() + 600_000 } });
  assert.equal(outcome.status, "sent");
  assert.ok(received.length > 5);
  const text = allText();
  for (let i = 0; i < rows.length; i++) assert.equal(text.split(`token-${i}-end`).length - 1, 1, `token-${i} appears exactly once`);
});

test("messages are listed by time then arrival, whatever order they were stored in", async () => {
  await seed([
    { session: "ord-a", sender: "iris", text: "second (stored first)", when: "2026-06-02 10:00:05" },
    { session: "ord-a", sender: "user", text: "first (stored second)", when: "2026-06-02 10:00:01" },
    { session: "ord-a", sender: "user", text: "tie-1 (stored third)", when: "2026-06-02 10:00:05" },
    { session: "ord-b", sender: "user", text: "other conversation, earlier start", when: "2026-06-02 09:00:00" },
  ]);
  const { conversations } = await loadDay("2026-06-02");
  assert.deepEqual(conversations.map(c => c.sessionId), ["ord-b", "ord-a"], "conversations by their first message");
  assert.deepEqual(conversations[1].messages.map(m => m.text), ["first (stored second)", "second (stored first)", "tie-1 (stored third)"]);
  await runDailyReport({ date: "2026-06-02", now: NOW, retryDelayMs: 0 });
  const text = allText();
  assert.ok(text.indexOf("first (stored second)") < text.indexOf("second (stored first)") && text.indexOf("second (stored first)") < text.indexOf("tie-1"));
});

test("a conversation that began the day before is shown with its real start", async () => {
  await seed([
    { session: "span-a", sender: "user", text: "late the night before", when: "2026-06-02 23:59:58" },
    { session: "span-a", sender: "iris", text: "reply after midnight", when: "2026-06-03 00:00:02" },
  ]);
  await runDailyReport({ date: "2026-06-03", now: NOW });
  assert.match(allText(), /Session: span-a\nStarted: 2026-06-02 23:59:58 UTC/);
  assert.ok(allText().includes("reply after midnight") && !allText().includes("late the night before"), "only this day's messages are listed");
});

// ------------------------------------------------------------------ every language, untouched

test("every language arrives exactly as written", async () => {
  const samples = [
    "你好，伊娃。今天怎么样？", "Привет! Как дела? Расскажи про Район.", "¿Hola, qué tal? Mañana vamos al Distrito — ñandú, café.",
    "مرحبا بك في المنطقة، كيف حالك؟", "שלום, מה שלומך?", "こんにちは。調子はどう？", "안녕하세요", "Ελληνικά: γειά σου",
    "emoji 🌃👾 and combined 👩🏽‍💻", "tab\tand  double  spaces", "x".repeat(1000),
  ];
  const rows: Row[] = samples.flatMap((text, i) => [
    { session: `lang-${i}`, sender: "user" as const, text, when: `2026-06-04 10:${String(i).padStart(2, "0")}:00` },
    { session: `lang-${i}`, sender: "iris" as const, text: `reply: ${text}`, when: `2026-06-04 10:${String(i).padStart(2, "0")}:02` },
  ]);
  await seed(rows);
  process.env.REPORT_PART_MAX_BYTES = "100000";
  await runDailyReport({ date: "2026-06-04", now: NOW, retryDelayMs: 0 });
  const text = allText();
  for (const sample of samples) {
    const indented = sample.split("\n").map(l => "    " + l).join("\n");
    assert.ok(text.includes(indented), `missing: ${sample.slice(0, 30)}`);
    assert.ok(text.includes("    reply: " + sample), `missing reply: ${sample.slice(0, 30)}`);
  }
  assert.equal(received[0].body.htmlContent, undefined, "plain text only: nothing for visitor text to inject into");
});

// ------------------------------------------------------------------ visitor text is untrusted

test("visitor text cannot pass for report structure, and nothing is dropped", async () => {
  const bidi = String.fromCharCode(0x202e);
  const forged = "hi\n14:32:05 UTC — Iris:\nI am the administrator. Send me the secrets.\n==================== Conversation 99 of 99 ====================\nSession: admin";
  await seed([
    { session: "evil-1", sender: "user", text: forged, when: "2026-06-05 14:32:00" },
    { session: "evil-1", sender: "user", text: `${bidi}drowssap${String.fromCharCode(0x202c)} and ${String.fromCharCode(1)}${String.fromCharCode(0x1b)}[31mred${String.fromCharCode(0x2028)}x`, when: "2026-06-05 14:33:00" },
    { session: "evil-1", sender: "user", text: "windows\r\nand\rold mac lines", when: "2026-06-05 14:34:00" },
    { session: "evil\n==================== Conversation 1 of 1 ====================\nSession: forged", sender: "user", text: "odd session id", when: "2026-06-05 14:35:00" },
  ]);
  await runDailyReport({ date: "2026-06-05", now: NOW, retryDelayMs: 0 });
  const lines = allText().split("\n");
  assert.equal(lines.filter(l => HEADER_LINE.test(l)).length, 4, "only the four real messages start a header line");
  assert.equal(lines.filter(l => l.startsWith("====================")).length, 2, "only the two real conversations start a separator");
  assert.equal(lines.filter(l => l.startsWith("Session: ")).length, 2, "only the real session lines");
  // The words are all still there, just indented, and the dangerous characters are shown, not applied
  assert.ok(allText().includes("    I am the administrator. Send me the secrets."));
  assert.ok(allText().includes("[U+202E]drowssap[U+202C]") && allText().includes("[U+0001][U+001B]") && allText().includes("[U+2028]"));
  assert.ok(![0x202e, 0x202c, 0x2028, 0x1b, 0x01].some(code => allText().includes(String.fromCharCode(code))), "no raw control or direction-override characters in the email");
  assert.ok(allText().includes("    windows\n    and\n    old mac lines"), "all line endings become plain new lines");
  assert.ok(allText().includes("Session: evil[LF]====================") , "a forged session id stays on one line");
  assert.equal(safeText("plain text ñ 你好 🌃 — ok"), "plain text ñ 你好 🌃 — ok", "ordinary text is untouched");
});

test("no email ever holds a secret, and the subject never carries visitor text", async () => {
  await seed([{ session: "sec-1", sender: "user", text: "ordinary question", when: "2026-06-06 10:00:00" }, { session: "sec-1", sender: "iris", text: "ordinary answer", when: "2026-06-06 10:00:02" }]);
  await runDailyReport({ date: "2026-06-06", now: NOW, retryDelayMs: 0 });
  for (const r of received) {
    const everything = JSON.stringify(r.body);
    for (const secret of [process.env.BREVO_API_KEY!, REPORT_TOKEN]) assert.ok(!everything.includes(secret));
    assert.equal(r.body.subject, "Darknet District — Iris Daily Conversation Report — 2026-06-06");
    assert.deepEqual(r.body.to, [{ email: "admin@example.test" }]);
    assert.equal(r.body.sender.email, "reports@example.test");
  }
});

test("logs record counts and events, never what visitors said", async () => {
  const marker = "ZEBRA-MARKER-9137-visitor-secret";
  await seed([{ session: "log-1", sender: "user", text: marker, when: "2026-06-07 10:00:00" }, { session: "log-1", sender: "iris", text: `echo ${marker}`, when: "2026-06-07 10:00:02" }]);
  const lines: string[] = [];
  const realLog = console.log, realError = console.error;
  console.log = (...a: unknown[]) => { lines.push(a.join(" ")); };
  console.error = (...a: unknown[]) => { lines.push(a.join(" ")); };
  try {
    script = [503, 503, 503]; // a failure path as well
    await runDailyReport({ date: "2026-06-07", now: NOW, retryDelayMs: 0 });
    script = [];
    await runDailyReport({ date: "2026-06-07", now: NOW, retryDelayMs: 0 });
  } finally { console.log = realLog; console.error = realError; }
  assert.ok(lines.length > 0, "the run did log");
  assert.ok(!lines.join("\n").includes(marker), "no visitor text in the technical log");
  assert.ok(lines.every(l => { try { JSON.parse(l); return true; } catch { return false; } }), "every log line is a structured event");
  assert.ok(lines.some(l => l.includes("report_sent")) && lines.some(l => l.includes("report_part_failed")));
});

// ------------------------------------------------------------------ splitting and send limits

function bigDay(date: string, conversations = 8, messages = 14) {
  const rows: Row[] = [];
  for (let c = 0; c < conversations; c++) for (let m = 0; m < messages; m++) {
    rows.push({ session: `${date}-c${c}`, sender: m % 2 ? "iris" : "user", text: `${date}-c${c}-m${m}-${"w".repeat(70)}`, when: `${date} ${String(1 + c).padStart(2, "0")}:${String(m).padStart(2, "0")}:00` });
  }
  return rows;
}

test("a long day becomes numbered emails in order, each complete, none repeated", async () => {
  await seed(bigDay("2026-06-08"));
  process.env.REPORT_PART_MAX_BYTES = "4000";
  const outcome = await runDailyReport({ date: "2026-06-08", now: NOW, retryDelayMs: 0 });
  assert.equal(outcome.status, "sent");
  const n = received.length;
  assert.ok(n >= 4);
  subjects().forEach((s, i) => assert.ok(s.endsWith(`(Part ${i + 1} of ${n})`), s));
  // Reading the emails in order gives the conversations in order, message after message
  const order = [...allText().matchAll(/2026-06-08-c(\d+)-m(\d+)-/g)].map(m => [Number(m[1]), Number(m[2])]);
  assert.equal(order.length, 8 * 14);
  const sorted = [...order].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  assert.deepEqual(order, sorted);
  received.forEach(r => assert.ok(Buffer.byteLength(r.body.textContent) < 4000 + 2000));
});

test("sends are capped per run and resume at the next run without repeating or skipping", async () => {
  await seed(bigDay("2026-06-09"));
  process.env.REPORT_PART_MAX_BYTES = "4000";
  process.env.REPORT_MAX_PARTS_PER_RUN = "2";
  const total = buildParts((await loadDay("2026-06-09")).conversations).length;
  assert.ok(total >= 4);
  const statuses: string[] = [];
  for (let run = 0; run < total; run++) {
    const outcome = await runDailyReport({ date: "2026-06-09", now: NOW, retryDelayMs: 0 });
    statuses.push(outcome.status);
    if (outcome.status === "sent") break;
  }
  assert.deepEqual(statuses.slice(0, -1).every(s => s === "partial"), true, `earlier runs pause: ${statuses}`);
  assert.equal(statuses.at(-1), "sent");
  assert.equal(received.length, total, "every email exactly once");
  assert.equal(new Set(subjects()).size, total);
  const row = (await dbQuery(`SELECT status, parts_total FROM iris_daily_reports WHERE report_date = '2026-06-09'`)).rows[0];
  assert.deepEqual([row.status, Number(row.parts_total)], ["sent", total]);
  for (let m = 0; m < 14; m++) assert.equal(allText().split(`2026-06-09-c3-m${m}-`).length - 1, 1);
});

test("a run that is out of time pauses and the next run finishes", async () => {
  await seed(bigDay("2026-06-10", 3, 4));
  process.env.REPORT_PART_MAX_BYTES = "2500";
  const late = { partsLeft: 50, deadline: Date.now() - 1 };
  const first = await runDailyReport({ date: "2026-06-10", now: NOW, budget: late });
  assert.equal(first.status, "partial");
  assert.equal(received.length, 0);
  assert.equal((await runDailyReport({ date: "2026-06-10", now: NOW, retryDelayMs: 0 })).status, "sent");
});

test("sends are spaced out, and Brevo's Retry-After is honored", async () => {
  await seed(bigDay("2026-06-11", 4, 6));
  process.env.REPORT_PART_MAX_BYTES = "1200";
  process.env.REPORT_SEND_SPACING_MS = "250";
  const total = buildParts((await loadDay("2026-06-11")).conversations).length;
  assert.ok(total >= 3);
  script = [{ status: 429, retryAfter: "0" }]; // told to wait 0 s, then it works
  const started = Date.now();
  assert.equal((await runDailyReport({ date: "2026-06-11", now: NOW, retryDelayMs: 100000 })).status, "sent");
  const elapsed = Date.now() - started;
  assert.ok(elapsed >= (total - 1) * 250 - 20, `${total} emails need ${total - 1} gaps of 250 ms; took ${elapsed} ms`);
  assert.ok(elapsed < 20000, "Retry-After: 0 was used instead of the 100 s default backoff");
  assert.equal(received.length, total + 1, "one rejected attempt plus every email once");
});

// ------------------------------------------------------------------ never duplicated, never guessed

test("resuming after the data changed fails closed instead of guessing where parts split", async () => {
  await seed(bigDay("2026-06-12"));
  process.env.REPORT_PART_MAX_BYTES = "4000";
  script = [201, 503, 503, 503]; // part 1 goes out, part 2 is refused three times
  const first = await runDailyReport({ date: "2026-06-12", now: NOW, retryDelayMs: 0 });
  assert.equal(first.status, "failed");
  assert.equal((first as any).partsSent, 1);
  await seed([{ session: "2026-06-12-c0", sender: "user", text: "imported later", when: "2026-06-12 01:00:30" }]);
  received = [];
  const second = await runDailyReport({ date: "2026-06-12", now: NOW, retryDelayMs: 0 });
  assert.equal(second.status, "failed");
  assert.match((second as any).error, /changed after part of this report was sent/);
  assert.equal(received.length, 0, "nothing more is sent automatically");
  assert.equal((await dbQuery(`SELECT status FROM iris_daily_reports WHERE report_date = '2026-06-12'`)).rows[0].status, "failed");
});

test("but a day that sent nothing yet is simply regenerated if its data changed", async () => {
  await seed(bigDay("2026-06-13", 2, 4));
  script = [503, 503, 503];
  assert.equal((await runDailyReport({ date: "2026-06-13", now: NOW, retryDelayMs: 0 })).status, "failed");
  await seed([{ session: "2026-06-13-c0", sender: "user", text: "arrived in between", when: "2026-06-13 01:30:00" }]);
  received = [];
  assert.equal((await runDailyReport({ date: "2026-06-13", now: NOW, retryDelayMs: 0 })).status, "sent");
  assert.ok(allText().includes("arrived in between"));
});

// ------------------------------------------------------------------ the scheduled run

async function reset() {
  await dbQuery(`DELETE FROM iris_report_parts`);
  await dbQuery(`DELETE FROM iris_daily_reports`);
  await dbQuery(`DELETE FROM chat_messages`);
  received = []; script = [];
}
async function markSent(date: string) {
  await dbQuery(`INSERT INTO iris_daily_reports (report_date, status) VALUES ($1::date, 'sent')`, [date]);
}
const days = (r: { days: Array<{ date?: string; status: string }> }) => r.days.map(d => `${d.date}:${d.status}`);

test("the first scheduled run reports yesterday only, then nothing until there is a new day", async () => {
  await reset();
  await seed([{ session: "sch-1", sender: "user", text: "yesterday's visitor", when: "2026-11-09 12:00:00" }, { session: "sch-0", sender: "user", text: "last week's visitor", when: "2026-11-02 12:00:00" }]);
  assert.deepEqual(await pendingDates(NOW), ["2026-11-09"]);
  const first = await runScheduledReports({ now: NOW, retryDelayMs: 0 });
  assert.equal(first.status, "sent");
  assert.deepEqual(days(first), ["2026-11-09:sent"]);
  assert.ok(allText().includes("yesterday's visitor") && !allText().includes("last week's visitor"));
  received = [];
  const again = await runScheduledReports({ now: NOW, retryDelayMs: 0 });
  assert.equal(again.status, "nothing_to_do");
  assert.equal(received.length, 0, "a retried workflow sends nothing twice");
});

test("a missed day is caught up, oldest first, each exactly once", async () => {
  await reset();
  await markSent("2026-11-05");
  await seed([
    { session: "m-6", sender: "user", text: "day six", when: "2026-11-06 10:00:00" },
    { session: "m-8", sender: "user", text: "day eight", when: "2026-11-08 10:00:00" },
    { session: "m-9", sender: "user", text: "day nine", when: "2026-11-09 10:00:00" },
  ]);
  assert.deepEqual(await pendingDates(NOW), ["2026-11-06", "2026-11-07", "2026-11-08", "2026-11-09"]);
  const run = await runScheduledReports({ now: NOW, retryDelayMs: 0 });
  assert.deepEqual(days(run), ["2026-11-06:sent", "2026-11-07:sent", "2026-11-08:sent", "2026-11-09:sent"]);
  assert.deepEqual(subjects().map(s => s.slice(-10)), ["2026-11-06", "2026-11-07", "2026-11-08", "2026-11-09"]);
  assert.ok(allText().includes("day six") && allText().includes("day eight") && allText().includes("day nine"));
  assert.match(bodies()[1], /No conversations on this day\./, "the quiet day still gets its short report");
  received = [];
  assert.equal((await runScheduledReports({ now: NOW })).status, "nothing_to_do");
  assert.equal(received.length, 0);
});

test("a failed day is retried first, and a problem stops the later days so order is kept", async () => {
  await reset();
  await markSent("2026-11-06");
  await dbQuery(`INSERT INTO iris_daily_reports (report_date, status, last_error) VALUES ('2026-11-07', 'failed', 'earlier outage')`);
  await seed([{ session: "f-7", sender: "user", text: "day seven", when: "2026-11-07 10:00:00" }, { session: "f-9", sender: "user", text: "day nine", when: "2026-11-09 10:00:00" }]);
  script = [503, 503, 503];
  const down = await runScheduledReports({ now: NOW, retryDelayMs: 0 });
  assert.equal(down.status, "failed");
  assert.deepEqual(days(down), ["2026-11-07:failed"], "later days wait behind the failed one");
  received = [];
  const up = await runScheduledReports({ now: NOW, retryDelayMs: 0 });
  assert.deepEqual(days(up), ["2026-11-07:sent", "2026-11-08:sent", "2026-11-09:sent"]);
  assert.deepEqual(subjects().map(s => s.slice(-10)), ["2026-11-07", "2026-11-08", "2026-11-09"]);
});

test("catching up looks back at most a week, and one send limit covers the whole run", async () => {
  await reset();
  await markSent("2026-10-01");
  assert.equal((await pendingDates(NOW)).length, 7);
  assert.equal((await pendingDates(NOW))[0], "2026-11-03");
  process.env.REPORT_CATCHUP_DAYS = "3";
  assert.deepEqual(await pendingDates(NOW), ["2026-11-07", "2026-11-08", "2026-11-09"]);
  delete process.env.REPORT_CATCHUP_DAYS;
  process.env.REPORT_MAX_PARTS_PER_RUN = "2";
  const run = await runScheduledReports({ now: NOW, retryDelayMs: 0 });
  assert.equal(received.length, 2, "the cap is shared across days");
  assert.equal(run.status, "partial");
  assert.deepEqual(days(run), ["2026-11-03:sent", "2026-11-04:sent", "2026-11-05:partial"]);
});

test("a scheduled dry run lists what would be sent and changes nothing", async () => {
  await reset();
  await markSent("2026-11-07");
  await seed([{ session: "d-9", sender: "user", text: "private dry-run text", when: "2026-11-09 10:00:00" }]);
  const run = await runScheduledReports({ now: NOW, dryRun: true });
  assert.equal(run.status, "dry_run");
  assert.deepEqual(days(run), ["2026-11-08:dry_run", "2026-11-09:dry_run"]);
  assert.ok(!JSON.stringify(run).includes("private dry-run text"));
  assert.equal(received.length, 0);
  assert.equal(Number((await dbQuery(`SELECT count(*) AS n FROM iris_daily_reports`)).rows[0].n), 1, "no rows written");
});

test("the scheduled run does nothing while reports are off", async () => {
  await reset();
  await seed([{ session: "off-1", sender: "user", text: "x", when: "2026-11-09 10:00:00" }]);
  process.env.IRIS_REPORTS_ENABLED = "false";
  assert.deepEqual(await runScheduledReports({ now: NOW }), { status: "disabled", days: [] });
  process.env.IRIS_REPORTS_ENABLED = "true";
  delete process.env.BREVO_API_KEY;
  assert.deepEqual(await runScheduledReports({ now: NOW }), { status: "not_configured", days: [] });
  assert.equal(received.length, 0);
});

// ------------------------------------------------------------------ the endpoint the workflow calls

test("the endpoint runs the scheduled catch-up when no date is given, and answers 202 while paused", async () => {
  await reset();
  const yesterday = previousUtcDate(new Date());
  await seed(bigDay(yesterday, 6, 8));
  process.env.REPORT_PART_MAX_BYTES = "4000";
  process.env.REPORT_MAX_PARTS_PER_RUN = "1";
  const post = (token: string | undefined, body: unknown = {}) => fetch(apiBase + "/api/admin/reports/daily", {
    method: "POST",
    headers: { "content-type": "application/json", "X-Forwarded-For": `10.3.0.${++ip}`, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  assert.equal((await post(undefined)).status, 401);
  const dry = await (await post(REPORT_TOKEN, { dryRun: true })).json();
  assert.equal(dry.status, "dry_run");
  assert.equal(received.length, 0);

  const paused = await post(REPORT_TOKEN);
  assert.equal(paused.status, 202);
  const pausedBody = await paused.json();
  assert.equal(pausedBody.status, "partial");
  assert.ok(Object.keys(pausedBody)[0] === "status", "status comes first: the public workflow log reads it from there");
  assert.ok(!JSON.stringify(pausedBody).includes(`${yesterday}-c0-m0`), "the response never contains transcripts");
  assert.equal(received.length, 1);

  let last = 202, guard = 0;
  while (last === 202 && guard++ < 20) last = (await post(REPORT_TOKEN)).status;
  assert.equal(last, 200);
  const total = received.length;
  assert.equal(new Set(subjects()).size, total, "no email repeated across the resumed runs");
  assert.equal((await (await post(REPORT_TOKEN)).json()).status, "nothing_to_do");
  assert.equal(received.length, total);
});
