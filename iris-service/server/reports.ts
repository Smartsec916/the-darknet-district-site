// Daily conversation report: build a closed UTC day's full transcripts from Neon and email
// them, in numbered emails when long, to the one configured administrator address.
//
// Guarantees:
// - The window is one closed UTC calendar day, read in pages, so a busy day never has to fit
//   in one query and nothing is left out.
// - Every message is included exactly as stored. It is only indented, and invisible control
//   characters are shown as [U+XXXX], so visitor text can never pass for report structure.
// - One row per day in iris_daily_reports plus one per emailed part, so a repeated or retried
//   run sends only the parts not yet sent, and a day already sent is never sent again.
// - A long day is split into numbered emails on message boundaries; nothing is truncated.
//   Sends are spaced and capped per run (Brevo limits); the rest continues at the next run.
// - A missed day is caught up at the next run, oldest first, without re-sending anything.
// - If the stored data for a day changed after some parts were already sent, the report fails
//   closed rather than guess where the parts now split.
// - Transcripts go only to REPORT_RECIPIENT (see email.ts), as plain text (no HTML to inject).
import crypto from "crypto";
import { dbQuery } from "./db";
import { ensureSchema } from "./migrate";
import { emailConfig, sendReportEmail, EmailError } from "./email";
import { log, logError } from "./logger";

// Each email carries about this much transcript (bytes). Overridable; the tests use tiny values.
const partMaxBytes = () => Number(process.env.REPORT_PART_MAX_BYTES) || 200_000;
const pageSize = () => Math.max(1, Number(process.env.REPORT_PAGE_SIZE) || 1000);
// Brevo's free plan allows 300 emails a day: at most this many per run, resumed at the next run
const maxPartsPerRun = () => Number(process.env.REPORT_MAX_PARTS_PER_RUN) || 25;
const runBudgetMs = () => Number(process.env.REPORT_RUN_BUDGET_MS) || 240_000;
const sendSpacingMs = () => (process.env.REPORT_SEND_SPACING_MS ? Number(process.env.REPORT_SEND_SPACING_MS) : 1000);
const catchupDays = () => Math.min(14, Math.max(1, Number(process.env.REPORT_CATCHUP_DAYS) || 7));
const STALE_LOCK_MS = 15 * 60_000;   // a crashed run does not block the day forever
const DAY_MS = 24 * 60 * 60 * 1000;

export interface ReportMessage { sender: string; text: string; at: string; status: string; language: string | null }
export interface Reportable {
  sessionId: string;
  startedAt: string; // first message ever stored for this session, ISO UTC
  messages: ReportMessage[];
}

export interface DaySummary {
  date: string;
  periodStart: string;
  periodEnd: string;
  conversations: number;
  visitorMessages: number;
  irisMessages: number;
  fallbackReplies: number;   // canned replies because OpenAI failed
  unanswered: number;        // visitor messages that got no reply (processing error)
  errors: number;            // everything not "ok"
  apiCalls: number;
  promptTokens: number;
  completionTokens: number;
  estimatedCostUsd: number;
}

export interface ReportPart { number: number; text: string; bytes: number }

export type ReportOutcome =
  | { status: "disabled" | "not_configured" | "invalid_date" | "in_progress" | "already_sent"; date?: string; detail?: string }
  | { status: "dry_run"; date: string; summary: DaySummary; parts: number; bytes: number }
  | { status: "sent" | "failed" | "partial"; date: string; summary: DaySummary; partsTotal: number; partsSent: number; error?: string };

export function utcDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const addDays = (date: string, n: number) => utcDateString(new Date(new Date(date + "T00:00:00Z").getTime() + n * DAY_MS));

export function previousUtcDate(now = new Date()): string {
  return utcDateString(new Date(now.getTime() - DAY_MS));
}

export function validReportDate(date: string, now = new Date()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(date + "T00:00:00Z");
  if (Number.isNaN(parsed.getTime()) || utcDateString(parsed) !== date) return false;
  return date < utcDateString(now); // the current UTC day is still open
}

function bounds(date: string): [string, string] {
  return [`${date} 00:00:00`, `${addDays(date, 1)} 00:00:00`];
}

const TS = `to_char(%s, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`;
const ts = (column: string) => TS.replace("%s", column);

// ---------------------------------------------------------------- untrusted text

// Control characters, line/paragraph separators, BOM and the bidirectional embedding, override and
// isolate controls (which can make text read differently from how it is stored). Ordinary
// text, every language, emoji joiners and the left/right marks used in Arabic and Hebrew are kept.
// Ranges as code points (not written out), so no special character appears in this source file:
// C0/C1 controls except tab and newline, line/paragraph separators (2028-2029), the bidirectional
// embedding/override controls (202A-202E) and isolates (2066-2069), and the BOM (FEFF).
const UNSAFE_RANGES: Array<[number, number]> = [
  [0x00, 0x08], [0x0b, 0x0c], [0x0e, 0x1f], [0x7f, 0x9f],
  [0x2028, 0x2029], [0x202a, 0x202e], [0x2066, 0x2069], [0xfeff, 0xfeff],
];
const UNSAFE = new RegExp(
  "[" + UNSAFE_RANGES.map(([from, to]) => String.fromCharCode(from) + "-" + String.fromCharCode(to)).join("") + "]",
  "g",
);

export function safeText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(UNSAFE, c => `[U+${c.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0")}]`);
}

// A visitor message cannot pass for report structure: every line is indented
const indent = (text: string) => safeText(text).split("\n").map(line => "    " + line).join("\n");
// Session ids come from the visitor's browser too
const oneLine = (text: string) => safeText(text).replace(/\n/g, "[LF]");

// ---------------------------------------------------------------- reading a day, in pages

export async function loadDay(date: string): Promise<{ summary: DaySummary; conversations: Reportable[] }> {
  const [start, end] = bounds(date);
  const order: string[] = [];
  const bySession = new Map<string, Reportable>();

  // Keyset pages over (timestamp, id): stable order, no OFFSET, no matter how big the day is
  let cursorTs: string | null = null;
  let cursorId = 0;
  for (;;) {
    const { rows } = await dbQuery(
      `SELECT m.id, m.session_id, m.sender, m.message, ${ts("m.timestamp")} AS at, m.timestamp::text AS cursor_ts,
              m.language, m.status
       FROM chat_messages m
       WHERE m.timestamp >= $1::timestamp AND m.timestamp < $2::timestamp
         AND ($3::timestamp IS NULL OR (m.timestamp, m.id) > ($3::timestamp, $4::integer))
       ORDER BY m.timestamp, m.id
       LIMIT $5`,
      [start, end, cursorTs, cursorId, pageSize()],
    );
    for (const row of rows) {
      let convo = bySession.get(row.session_id);
      if (!convo) {
        convo = { sessionId: row.session_id, startedAt: "", messages: [] };
        bySession.set(row.session_id, convo);
        order.push(row.session_id);
      }
      convo.messages.push({
        sender: row.sender, text: row.message, at: row.at, status: row.status ?? "ok", language: row.language ?? null,
      });
    }
    if (rows.length < pageSize()) break;
    const last = rows[rows.length - 1];
    cursorTs = last.cursor_ts;
    cursorId = Number(last.id);
  }

  // When each conversation really began (it may have started before this day)
  for (let i = 0; i < order.length; i += 500) {
    const chunk = order.slice(i, i + 500);
    const { rows } = await dbQuery(
      `SELECT session_id, ${ts("MIN(timestamp)")} AS started_at FROM chat_messages
       WHERE session_id = ANY($1::text[]) GROUP BY session_id`,
      [chunk],
    );
    for (const row of rows) bySession.get(row.session_id)!.startedAt = row.started_at;
  }
  const conversations = order.map(id => bySession.get(id)!);

  const usage = (await dbQuery(
    `SELECT COUNT(*) AS calls, COALESCE(SUM(prompt_tokens), 0) AS prompt, COALESCE(SUM(completion_tokens), 0) AS completion
     FROM iris_api_usage WHERE created_at >= $1::timestamp AND created_at < $2::timestamp`,
    [start, end],
  )).rows[0];
  const promptTokens = Number(usage.prompt);
  const completionTokens = Number(usage.completion);
  // gpt-4o list prices in USD per million tokens; override if pricing changes
  const inPrice = Number(process.env.OPENAI_PRICE_INPUT_PER_M) || 2.5;
  const outPrice = Number(process.env.OPENAI_PRICE_OUTPUT_PER_M) || 10;

  const all = conversations.flatMap(c => c.messages);
  const fallbackReplies = all.filter(m => m.status === "fallback").length;
  const unanswered = all.filter(m => m.status === "error").length;
  return {
    conversations,
    summary: {
      date,
      periodStart: start,
      periodEnd: `${date} 23:59:59`,
      conversations: conversations.length,
      visitorMessages: all.filter(m => m.sender === "user").length,
      irisMessages: all.filter(m => m.sender === "iris").length,
      fallbackReplies,
      unanswered,
      errors: all.filter(m => m.status !== "ok").length,
      apiCalls: Number(usage.calls),
      promptTokens,
      completionTokens,
      estimatedCostUsd: (promptTokens / 1e6) * inPrice + (completionTokens / 1e6) * outPrice,
    },
  };
}

// ---------------------------------------------------------------- the text of a report

const bytes = (text: string) => Buffer.byteLength(text, "utf8");
const clock = (iso: string) => iso.slice(11, 19) + " UTC";
const stamp = (iso: string) => iso.slice(0, 10) + " " + clock(iso);

function renderMessage(m: ReportMessage): string {
  let who = m.sender === "user" ? "Visitor" : "Iris";
  if (m.status === "fallback") who += " (canned fallback reply; OpenAI failed)";
  else if (m.status === "error") who += " (no reply was produced; processing error)";
  else if (m.status !== "ok") who += ` (status: ${oneLine(m.status)})`;
  return `${clock(m.at)} — ${who}:\n${indent(m.text)}\n`;
}

// Splits a conversation into pieces no larger than maxBytes, on message boundaries
function conversationSegments(c: Reportable, index: number, total: number, maxBytes: number): string[] {
  const head = (suffix: string) =>
    `==================== Conversation ${index} of ${total}${suffix} ====================\n` +
    `Session: ${oneLine(c.sessionId)}\nStarted: ${stamp(c.startedAt)}\n\n`;
  const segments: string[] = [];
  let current: string[] = [];
  let size = bytes(head(" (continued, part 99)"));
  const flush = () => {
    if (!current.length) return;
    segments.push(head(segments.length ? ` (continued, part ${segments.length + 1})` : "") + current.join("\n") + "\n");
    current = []; size = bytes(head(" (continued, part 99)"));
  };
  for (const m of c.messages) {
    const piece = renderMessage(m);
    if (current.length && size + bytes(piece) + 1 > maxBytes) flush();
    current.push(piece);
    size += bytes(piece) + 1;
  }
  flush();
  return segments;
}

// Numbered emails of about limits.part bytes of transcript each, in order, nothing omitted
export function buildParts(conversations: Reportable[], limits = { part: partMaxBytes() }): ReportPart[] {
  const slack = Math.min(3000, Math.floor(limits.part / 4)); // room for the summary and part notice
  const room = limits.part - slack;
  const segments = conversations.flatMap((c, i) => conversationSegments(c, i + 1, conversations.length, room));
  const groups: string[][] = [];
  let current: string[] = []; let size = 0;
  for (const segment of segments) {
    if (current.length && size + bytes(segment) > room) { groups.push(current); current = []; size = 0; }
    current.push(segment); size += bytes(segment);
  }
  if (current.length) groups.push(current);
  if (!groups.length) groups.push([]);
  return groups.map((group, i) => {
    const text = group.join("\n");
    return { number: i + 1, text, bytes: bytes(text) };
  });
}

export function contentHash(parts: ReportPart[]): string {
  return crypto.createHash("sha256").update(parts.map(p => p.text).join("\u0000")).digest("hex");
}

export function summaryText(s: DaySummary): string {
  return [
    `Darknet District — Iris Daily Conversation Report`,
    `Reporting period (UTC): ${s.periodStart} to ${s.periodEnd}`,
    ``,
    `Conversations:         ${s.conversations}`,
    `Visitor messages:      ${s.visitorMessages}`,
    `Iris responses:        ${s.irisMessages}`,
    `Failed or incomplete:  ${s.errors} (${s.fallbackReplies} canned fallback replies because OpenAI failed, ${s.unanswered} visitor messages with no reply)`,
    `OpenAI usage:          ${s.apiCalls} calls, ${s.promptTokens} prompt + ${s.completionTokens} completion tokens`,
    `Estimated API cost:    $${s.estimatedCostUsd.toFixed(4)} (estimate from token counts at gpt-4o list prices)`,
  ].join("\n");
}

// ---------------------------------------------------------------- delivery state

async function setPart(date: string, part: number, status: string, messageId?: string, error?: string) {
  await dbQuery(
    `INSERT INTO iris_report_parts (report_date, part_no, status, sent_at, provider_message_id, last_error)
     VALUES ($1::date, $2, $3, CASE WHEN $3 = 'sent' THEN $4::timestamp END, $5, $6)
     ON CONFLICT (report_date, part_no) DO UPDATE SET status = EXCLUDED.status,
       sent_at = COALESCE(EXCLUDED.sent_at, iris_report_parts.sent_at),
       provider_message_id = COALESCE(EXCLUDED.provider_message_id, iris_report_parts.provider_message_id),
       last_error = EXCLUDED.last_error`,
    [date, part, status, new Date().toISOString(), messageId ?? null, error ?? null],
  );
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function sendWithRetry(subject: string, text: string, delayMs: number): Promise<string> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await sendReportEmail({ subject, text }, Number(process.env.REPORT_EMAIL_TIMEOUT_MS) || 25_000);
    } catch (err) {
      // Retry only when the provider certainly did not take the message; after a
      // timeout the email may already have been delivered, so it is left for a later run
      const safeToRetry = err instanceof EmailError && err.retryable && !err.ambiguous;
      if (!safeToRetry || attempt >= 3) throw err;
      // Brevo says how long to wait when it is rate limiting; honor that (up to a minute)
      await sleep(err.retryAfterMs !== undefined ? Math.min(err.retryAfterMs, 60_000) : delayMs * attempt);
    }
  }
}

export interface RunBudget { partsLeft: number; deadline: number }
export interface RunOptions { date?: string; dryRun?: boolean; now?: Date; retryDelayMs?: number; budget?: RunBudget }

export function newBudget(): RunBudget {
  return { partsLeft: maxPartsPerRun(), deadline: Date.now() + runBudgetMs() };
}

export async function runDailyReport(options: RunOptions = {}): Promise<ReportOutcome> {
  const now = options.now ?? new Date();
  const date = options.date ?? previousUtcDate(now);
  if (!validReportDate(date, now)) return { status: "invalid_date", detail: "date must be a past UTC day (YYYY-MM-DD)" };
  const started = Date.now();

  if (!options.dryRun) {
    if (process.env.IRIS_REPORTS_ENABLED !== "true") return { status: "disabled", date };
    if (!emailConfig()) return { status: "not_configured", date };
  }
  if (!(await ensureSchema())) throw new Error("database schema is not ready");

  const existing = (await dbQuery(
    `SELECT status, content_hash FROM iris_daily_reports WHERE report_date = $1::date`, [date],
  )).rows[0];
  if (!options.dryRun && existing?.status === "sent") return { status: "already_sent", date };

  const { summary, conversations } = await loadDay(date);
  const parts = buildParts(conversations);
  const hash = contentHash(parts);
  if (options.dryRun) {
    return { status: "dry_run", date, summary, parts: parts.length, bytes: parts.reduce((n, p) => n + p.bytes, 0) };
  }

  const done = new Set<number>(
    (await dbQuery(`SELECT part_no FROM iris_report_parts WHERE report_date = $1::date AND status = 'sent'`, [date]))
      .rows.map((r: any) => Number(r.part_no)),
  );
  // Some parts already went out and the stored data is no longer what they were cut from: resuming
  // would split it differently and could repeat or skip messages, so stop and leave it to a person
  if (done.size > 0 && existing?.content_hash && existing.content_hash !== hash) {
    const error = "stored conversations changed after part of this report was sent; not resumed automatically";
    await dbQuery(`UPDATE iris_daily_reports SET status = 'failed', last_error = $2, updated_at = $3::timestamp WHERE report_date = $1::date`,
      [date, error, new Date().toISOString()]);
    log("error", "report_content_changed", { date, sentParts: done.size });
    return { status: "failed", date, summary, partsTotal: parts.length, partsSent: done.size, error };
  }

  const nowIso = now.toISOString();
  const staleIso = new Date(now.getTime() - STALE_LOCK_MS).toISOString();
  const claim = await dbQuery(
    `INSERT INTO iris_daily_reports (report_date, status, attempts, locked_at, updated_at,
        conversation_count, visitor_messages, iris_messages, error_count, parts_total, content_hash)
     VALUES ($1::date, 'sending', 1, $2::timestamp, $2::timestamp, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (report_date) DO UPDATE SET status = 'sending', attempts = iris_daily_reports.attempts + 1,
        locked_at = $2::timestamp, updated_at = $2::timestamp, last_error = NULL,
        conversation_count = $4, visitor_messages = $5, iris_messages = $6, error_count = $7, parts_total = $8,
        content_hash = $9
     WHERE iris_daily_reports.status IN ('failed', 'partial')
        OR (iris_daily_reports.status = 'sending' AND iris_daily_reports.locked_at < $3::timestamp)
     RETURNING attempts`,
    [date, nowIso, staleIso, summary.conversations, summary.visitorMessages, summary.irisMessages, summary.errors, parts.length, hash],
  );
  if (!claim.rows.length) {
    const row = (await dbQuery(`SELECT status FROM iris_daily_reports WHERE report_date = $1::date`, [date])).rows[0];
    return { status: row?.status === "sent" ? "already_sent" : "in_progress", date };
  }

  const delay = options.retryDelayMs ?? 1500;
  const budget = options.budget ?? newBudget();
  let failure: string | undefined;
  let paused = false;
  let sentThisRun = 0;
  for (const part of parts) {
    if (done.has(part.number)) continue;
    if (budget.partsLeft <= 0 || Date.now() > budget.deadline) { paused = true; break; }
    if (sentThisRun > 0) await sleep(sendSpacingMs()); // stay well inside Brevo's rate limits
    const label = parts.length > 1 ? ` (Part ${part.number} of ${parts.length})` : "";
    const subject = `Darknet District — Iris Daily Conversation Report — ${date}${label}`;
    const notice = parts.length > 1
      ? `This is email ${part.number} of ${parts.length} for this day. Conversations continue across emails in order; nothing is left out.\n\n`
      : "";
    const body = `${summaryText(summary)}\n\n${notice}${part.text || "No conversations on this day."}`;
    try {
      const messageId = await sendWithRetry(subject, body, delay);
      await setPart(date, part.number, "sent", messageId);
      done.add(part.number);
      budget.partsLeft--;
      sentThisRun++;
      log("info", "report_part_sent", { date, part: part.number, of: parts.length, bytes: part.bytes });
    } catch (err) {
      failure = err instanceof Error ? err.message : "send failed";
      await setPart(date, part.number, "failed", undefined, failure).catch(() => undefined);
      logError("report_part_failed", err, { date, part: part.number, of: parts.length });
      break; // later parts wait for the next run so they are not sent out of order
    }
  }

  const sentAll = done.size >= parts.length;
  const status = sentAll ? "sent" : failure ? "failed" : "partial";
  const note = failure ?? (paused ? `paused after ${sentThisRun} emails (send limit); the rest follows at the next run` : undefined);
  await dbQuery(
    `UPDATE iris_daily_reports SET status = $2, last_error = $3, locked_at = NULL, updated_at = $4::timestamp,
        sent_at = CASE WHEN $2 = 'sent' THEN $4::timestamp ELSE sent_at END
     WHERE report_date = $1::date`,
    [date, status, note ?? null, new Date().toISOString()],
  );
  log(status === "sent" ? "info" : status === "partial" ? "warn" : "error", `report_${status}`, {
    date, parts: parts.length, sent: done.size, conversations: summary.conversations,
    messages: summary.visitorMessages + summary.irisMessages, ms: Date.now() - started,
  });
  return status === "sent"
    ? { status, date, summary, partsTotal: parts.length, partsSent: done.size }
    : { status, date, summary, partsTotal: parts.length, partsSent: done.size, error: note };
}

// ---------------------------------------------------------------- the scheduled run

export interface ScheduledOutcome {
  status: ReportOutcome["status"] | "nothing_to_do";
  days: ReportOutcome[];
}

// Which days still need a report: yesterday, anything unfinished in the last week, and any days
// since the last report (so a missed run is caught up, oldest first, without resending anything).
// With no report ever sent it is only yesterday, so switching reports on never floods the inbox.
export async function pendingDates(now: Date): Promise<string[]> {
  const yesterday = previousUtcDate(now);
  const windowStart = addDays(yesterday, -(catchupDays() - 1));
  const recent = (await dbQuery(
    `SELECT report_date::text AS d, status FROM iris_daily_reports WHERE report_date >= $1::date`, [windowStart],
  )).rows as Array<{ d: string; status: string }>;
  const lastRow = (await dbQuery(`SELECT max(report_date)::text AS d FROM iris_daily_reports`)).rows[0]?.d as string | null;

  const wanted = new Set<string>();
  for (const row of recent) if (row.status !== "sent") wanted.add(row.d);
  if (!lastRow) {
    wanted.add(yesterday);
  } else {
    for (let d = addDays(lastRow, 1); d <= yesterday; d = addDays(d, 1)) if (d >= windowStart) wanted.add(d);
  }
  return [...wanted].filter(d => validReportDate(d, now)).sort();
}

export async function runScheduledReports(options: Omit<RunOptions, "date"> = {}): Promise<ScheduledOutcome> {
  const now = options.now ?? new Date();
  if (!options.dryRun) {
    if (process.env.IRIS_REPORTS_ENABLED !== "true") return { status: "disabled", days: [] };
    if (!emailConfig()) return { status: "not_configured", days: [] };
  }
  if (!(await ensureSchema())) throw new Error("database schema is not ready");

  const dates = await pendingDates(now);
  if (!dates.length) return { status: "nothing_to_do", days: [] };
  const budget = options.budget ?? newBudget();
  const days: ReportOutcome[] = [];
  let status: ScheduledOutcome["status"] = options.dryRun ? "dry_run" : "sent";
  for (const date of dates) {
    const outcome = await runDailyReport({ ...options, date, budget });
    days.push(outcome);
    if (outcome.status === "sent" || outcome.status === "already_sent" || outcome.status === "dry_run") continue;
    status = outcome.status; // keep the order: a problem stops the later days
    break;
  }
  return { status, days };
}

export async function listReports(limit = 30) {
  const { rows } = await dbQuery(
    `SELECT report_date::text AS report_date, status, conversation_count, visitor_messages, iris_messages,
            error_count, parts_total, attempts, last_error, ${ts("sent_at")} AS sent_at
     FROM iris_daily_reports ORDER BY report_date DESC LIMIT $1`,
    [limit],
  );
  return rows;
}
