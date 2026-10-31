// Daily conversation report: build the previous UTC day's transcripts from Neon and
// email them to the configured administrator address.
//
// Guarantees:
// - The report window is one closed UTC calendar day, so it never changes after the fact.
// - One row per day in iris_daily_reports plus one row per emailed part, so a repeat
//   or retried run sends only the parts that have not been sent. A day already sent
//   is never sent again.
// - Nothing is truncated: a long day is split into numbered parts.
// - Transcripts only ever go to REPORT_RECIPIENT (see email.ts).
import { dbQuery } from "./db";
import { ensureSchema } from "./migrate";
import { emailConfig, sendReportEmail, EmailError } from "./email";
import { log, logError } from "./logger";

// A day this small goes in the email body; a larger one becomes numbered .txt attachments.
// Overridable through the environment (the tests use tiny limits).
const inlineMaxBytes = () => Number(process.env.REPORT_INLINE_MAX_BYTES) || 60_000;
const partMaxBytes = () => Number(process.env.REPORT_PART_MAX_BYTES) || 1_000_000;
const STALE_LOCK_MS = 15 * 60_000;   // a crashed run does not block the day forever

export interface Reportable {
  sessionId: string;
  startedAt: string; // first message ever stored for this session, ISO UTC
  messages: { sender: string; text: string; at: string; status: string; language: string | null }[];
}

export interface DaySummary {
  date: string;
  conversations: number;
  visitorMessages: number;
  irisMessages: number;
  errors: number;
  apiCalls: number;
  promptTokens: number;
  completionTokens: number;
  estimatedCostUsd: number;
}

export interface ReportPart { number: number; text: string; bytes: number }

export type ReportOutcome =
  | { status: "disabled" | "not_configured" | "invalid_date" | "in_progress" | "already_sent"; date?: string; detail?: string }
  | { status: "dry_run"; date: string; summary: DaySummary; parts: number; bytes: number }
  | { status: "sent" | "failed"; date: string; summary: DaySummary; partsTotal: number; partsSent: number; error?: string };

export function utcDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function previousUtcDate(now = new Date()): string {
  return utcDateString(new Date(now.getTime() - 24 * 60 * 60 * 1000));
}

export function validReportDate(date: string, now = new Date()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(date + "T00:00:00Z");
  if (Number.isNaN(parsed.getTime()) || utcDateString(parsed) !== date) return false;
  return date < utcDateString(now); // the current UTC day is still open
}

function bounds(date: string): [string, string] {
  const next = new Date(new Date(date + "T00:00:00Z").getTime() + 24 * 60 * 60 * 1000);
  return [`${date} 00:00:00`, `${utcDateString(next)} 00:00:00`];
}

const TS = `to_char(%s, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`;
const ts = (column: string) => TS.replace("%s", column);

export async function loadDay(date: string): Promise<{ summary: DaySummary; conversations: Reportable[] }> {
  const [start, end] = bounds(date);
  const { rows } = await dbQuery(
    `SELECT m.id, m.session_id, m.sender, m.message, ${ts("m.timestamp")} AS at, m.language, m.status,
            (SELECT ${ts("MIN(x.timestamp)")} FROM chat_messages x WHERE x.session_id = m.session_id) AS started_at
     FROM chat_messages m
     WHERE m.timestamp >= $1::timestamp AND m.timestamp < $2::timestamp
     ORDER BY m.timestamp, m.id`,
    [start, end],
  );
  const order: string[] = [];
  const bySession = new Map<string, Reportable>();
  for (const row of rows) {
    let convo = bySession.get(row.session_id);
    if (!convo) {
      convo = { sessionId: row.session_id, startedAt: row.started_at, messages: [] };
      bySession.set(row.session_id, convo);
      order.push(row.session_id);
    }
    convo.messages.push({
      sender: row.sender, text: row.message, at: row.at, status: row.status ?? "ok", language: row.language ?? null,
    });
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
  return {
    conversations,
    summary: {
      date,
      conversations: conversations.length,
      visitorMessages: all.filter(m => m.sender === "user").length,
      irisMessages: all.filter(m => m.sender === "iris").length,
      errors: all.filter(m => m.status !== "ok").length,
      apiCalls: Number(usage.calls),
      promptTokens,
      completionTokens,
      estimatedCostUsd: (promptTokens / 1e6) * inPrice + (completionTokens / 1e6) * outPrice,
    },
  };
}

const bytes = (text: string) => Buffer.byteLength(text, "utf8");
const clock = (iso: string) => iso.slice(11, 19) + " UTC";
const stamp = (iso: string) => iso.slice(0, 10) + " " + clock(iso);

function renderMessage(m: Reportable["messages"][number]): string {
  let who = m.sender === "user" ? "Visitor" : "Iris";
  if (m.status === "fallback") who += " (canned fallback reply; OpenAI failed)";
  if (m.status === "error") who += " (no reply was produced; processing error)";
  return `${clock(m.at)} — ${who}:\n${m.text}\n`;
}

// Splits a conversation into pieces no larger than maxBytes, on message boundaries
function conversationSegments(c: Reportable, index: number, total: number, maxBytes: number): string[] {
  const head = (suffix: string) =>
    `==================== Conversation ${index} of ${total}${suffix} ====================\n` +
    `Session: ${c.sessionId}\nStarted: ${stamp(c.startedAt)}\n\n`;
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

function conversationSegments_all(conversations: Reportable[], maxBytes: number): string[] {
  return conversations.flatMap((c, i) => conversationSegments(c, i + 1, conversations.length, maxBytes));
}

export function buildParts(conversations: Reportable[], limits = { inline: inlineMaxBytes(), part: partMaxBytes() }): ReportPart[] {
  const slack = Math.min(2000, Math.floor(limits.part / 4)); // room for the email wrapper text
  const segments = conversationSegments_all(conversations, limits.part - slack);
  const total = segments.reduce((n, s) => n + bytes(s), 0);
  const groups: string[][] = [];
  if (total <= limits.inline) {
    groups.push(segments);
  } else {
    let current: string[] = []; let size = 0;
    for (const seg of segments) {
      if (current.length && size + bytes(seg) > limits.part - slack) { groups.push(current); current = []; size = 0; }
      current.push(seg); size += bytes(seg);
    }
    if (current.length) groups.push(current);
  }
  if (!groups.length) groups.push([]);
  return groups.map((g, i) => {
    const text = g.join("\n");
    return { number: i + 1, text, bytes: bytes(text) };
  });
}

export function summaryText(s: DaySummary): string {
  return [
    `Darknet District — Iris Daily Conversation Report`,
    `Reporting day: ${s.date} (00:00:00 to 23:59:59 UTC)`,
    ``,
    `Conversations:        ${s.conversations}`,
    `Visitor messages:     ${s.visitorMessages}`,
    `Iris responses:       ${s.irisMessages}`,
    `Errors:               ${s.errors} (canned fallback replies, or visitor messages that got no reply)`,
    `OpenAI usage:         ${s.apiCalls} calls, ${s.promptTokens} prompt + ${s.completionTokens} completion tokens`,
    `Estimated API cost:   $${s.estimatedCostUsd.toFixed(4)} (estimate from token counts at gpt-4o list prices)`,
  ].join("\n");
}

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

async function sendWithRetry(subject: string, text: string, attachments: { name: string; content: string }[] | undefined, delayMs: number): Promise<string> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await sendReportEmail({ subject, text, attachments }, Number(process.env.REPORT_EMAIL_TIMEOUT_MS) || 25_000);
    } catch (err) {
      // Retry only when the provider certainly did not take the message; after a
      // timeout the email may already have been delivered, so it is left for a later run
      const safeToRetry = err instanceof EmailError && err.retryable && !err.ambiguous;
      if (!safeToRetry || attempt >= 3) throw err;
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
    }
  }
}

export interface RunOptions { date?: string; dryRun?: boolean; now?: Date; retryDelayMs?: number }

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

  const { summary, conversations } = await loadDay(date);
  const parts = buildParts(conversations);
  if (options.dryRun) {
    return { status: "dry_run", date, summary, parts: parts.length, bytes: parts.reduce((n, p) => n + p.bytes, 0) };
  }

  const nowIso = now.toISOString();
  const staleIso = new Date(now.getTime() - STALE_LOCK_MS).toISOString();
  const claim = await dbQuery(
    `INSERT INTO iris_daily_reports (report_date, status, attempts, locked_at, updated_at,
        conversation_count, visitor_messages, iris_messages, error_count, parts_total)
     VALUES ($1::date, 'sending', 1, $2::timestamp, $2::timestamp, $4, $5, $6, $7, $8)
     ON CONFLICT (report_date) DO UPDATE SET status = 'sending', attempts = iris_daily_reports.attempts + 1,
        locked_at = $2::timestamp, updated_at = $2::timestamp, last_error = NULL,
        conversation_count = $4, visitor_messages = $5, iris_messages = $6, error_count = $7, parts_total = $8
     WHERE iris_daily_reports.status = 'failed'
        OR (iris_daily_reports.status = 'sending' AND iris_daily_reports.locked_at < $3::timestamp)
     RETURNING attempts`,
    [date, nowIso, staleIso, summary.conversations, summary.visitorMessages, summary.irisMessages, summary.errors, parts.length],
  );
  if (!claim.rows.length) {
    const existing = (await dbQuery(`SELECT status FROM iris_daily_reports WHERE report_date = $1::date`, [date])).rows[0];
    return { status: existing?.status === "sent" ? "already_sent" : "in_progress", date };
  }

  const done = new Set<number>(
    (await dbQuery(`SELECT part_no FROM iris_report_parts WHERE report_date = $1::date AND status = 'sent'`, [date]))
      .rows.map((r: any) => Number(r.part_no)),
  );
  const delay = options.retryDelayMs ?? 1500;
  let failure: string | undefined;
  for (const part of parts) {
    if (done.has(part.number)) continue;
    const label = parts.length > 1 ? ` (Part ${part.number} of ${parts.length})` : "";
    const subject = `Darknet District — Iris Daily Conversation Report — ${date}${label}`;
    const inline = parts.length === 1 && part.bytes <= inlineMaxBytes();
    const body = summaryText(summary) +
      (inline
        ? (part.text ? `\n\n${part.text}` : `\n\nNo conversations on this day.`)
        : `\n\nThis is part ${part.number} of ${parts.length}. The transcripts are in the attached text file.`);
    const attachments = inline ? undefined : [{
      name: `iris-conversations-${date}-part-${part.number}-of-${parts.length}.txt`,
      content: part.text,
    }];
    try {
      const messageId = await sendWithRetry(subject, body, attachments, delay);
      await setPart(date, part.number, "sent", messageId);
      done.add(part.number);
      log("info", "report_part_sent", { date, part: part.number, of: parts.length, bytes: part.bytes });
    } catch (err) {
      failure = err instanceof Error ? err.message : "send failed";
      await setPart(date, part.number, "failed", undefined, failure).catch(() => undefined);
      logError("report_part_failed", err, { date, part: part.number, of: parts.length });
      break; // later parts wait for the next run so they are not sent out of order
    }
  }

  const sentAll = done.size >= parts.length;
  await dbQuery(
    `UPDATE iris_daily_reports SET status = $2, last_error = $3, locked_at = NULL, updated_at = $4::timestamp,
        sent_at = CASE WHEN $2 = 'sent' THEN $4::timestamp ELSE sent_at END
     WHERE report_date = $1::date`,
    [date, sentAll ? "sent" : "failed", failure ?? null, new Date().toISOString()],
  );
  log(sentAll ? "info" : "error", sentAll ? "report_sent" : "report_failed", {
    date, parts: parts.length, sent: done.size, conversations: summary.conversations,
    messages: summary.visitorMessages + summary.irisMessages, ms: Date.now() - started,
  });
  return sentAll
    ? { status: "sent", date, summary, partsTotal: parts.length, partsSent: done.size }
    : { status: "failed", date, summary, partsTotal: parts.length, partsSent: done.size, error: failure };
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
