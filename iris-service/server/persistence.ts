// Saving and looking up conversation history. Reads and writes the existing
// chat_sessions / chat_messages tables; nothing here updates or deletes a stored message.
import crypto from "crypto";
import { dbQuery } from "./db";
import { ensureSchema } from "./migrate";
import { log, logError, logThrottled } from "./logger";

export type ReplyStatus = "ok" | "fallback";

export interface ExchangeInput {
  sessionId: string;
  requestId: string;
  visitorText: string;
  visitorAt: Date;
  // "error": the visitor wrote but no reply was produced. No Iris row is invented.
  visitorStatus: "ok" | "error";
  language?: string | null;
  iris?: { text: string; status: ReplyStatus; at: Date };
  // Whose conversation this is (see identity.ts); absent for a simulated New Visitor, which is never remembered
  memoryKey?: string;
}

// Stored timestamps are UTC. They are written explicitly from the app instead of
// relying on the database's default, so they do not depend on its time zone.
const utc = (d: Date) => d.toISOString();

// Same visitor message with the same count in the same session is the same request,
// so a client retry after a timeout cannot be saved or answered twice. Without a
// count (the Replit page does not send one) every request is distinct.
export function requestKey(sessionId: string, message: string, messageCount?: number): string {
  if (!Number.isInteger(messageCount) || (messageCount as number) < 1) return crypto.randomUUID();
  return crypto.createHash("sha256").update(`${sessionId}\n${messageCount}\n${message}`).digest("hex").slice(0, 40);
}

async function attempt(input: ExchangeInput): Promise<void> {
  await dbQuery(
    `INSERT INTO chat_sessions (session_id, created_at) VALUES ($1, $2::timestamp)
     ON CONFLICT (session_id) DO NOTHING`,
    [input.sessionId, utc(input.visitorAt)],
  );
  const rows: unknown[][] = [[
    input.sessionId, "user", input.visitorText, utc(input.visitorAt),
    input.language ?? null, input.visitorStatus, input.requestId, input.memoryKey ?? null,
  ]];
  if (input.iris) {
    rows.push([
      input.sessionId, "iris", input.iris.text, utc(input.iris.at),
      input.language ?? null, input.iris.status, input.requestId, input.memoryKey ?? null,
    ]);
  }
  const params: unknown[] = [];
  const tuples = rows.map(row => {
    const base = params.length;
    params.push(...row);
    return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}::timestamp, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8})`;
  });
  await dbQuery(
    `INSERT INTO chat_messages (session_id, sender, message, timestamp, language, status, request_id, memory_key)
     VALUES ${tuples.join(", ")}
     ON CONFLICT (request_id, sender) WHERE request_id IS NOT NULL DO NOTHING`,
    params,
  );
}

// Never throws: a database problem must not turn a chat reply into an error.
// The visitor message and Iris's reply are written together, in order, before the
// response is sent, so a Render sleep or restart cannot drop them. Returns whether
// the exchange is stored.
export async function saveExchange(input: ExchangeInput): Promise<boolean> {
  const started = Date.now();
  for (let tries = 1; tries <= 2; tries++) {
    try {
      if (!(await ensureSchema())) throw new Error("database schema is not ready");
      await attempt(input);
      const ms = Date.now() - started;
      if (ms > 2000) log("warn", "db_save_slow", { ms });
      return true;
    } catch (err) {
      if (tries === 2) {
        logError("conversation_save_failed", err, { ms: Date.now() - started });
        return false;
      }
      await new Promise(resolve => setTimeout(resolve, 400));
    }
  }
  return false;
}

// A request that already has a stored reply is answered from storage instead of
// calling OpenAI again. Returns null when there is nothing stored (or no database).
export async function findStoredReply(requestId: string): Promise<{ text: string; status: ReplyStatus } | null> {
  try {
    const { rows } = await dbQuery(
      `SELECT message, status FROM chat_messages WHERE request_id = $1 AND sender = 'iris' LIMIT 1`,
      [requestId],
    );
    return rows[0] ? { text: rows[0].message, status: rows[0].status === "fallback" ? "fallback" : "ok" } : null;
  } catch (err) {
    logThrottled("error", "stored_reply_lookup_failed", { error: (err as Error)?.name ?? "error" });
    return null;
  }
}

// Token usage from OpenAI responses, for the daily report. Fire-and-forget.
export function recordApiUsage(model: string | undefined, usage: any, durationMs: number): void {
  if (!usage) return;
  ensureSchema()
    .then(ready => {
      if (!ready) throw new Error("database schema is not ready");
      return dbQuery(
        `INSERT INTO iris_api_usage (created_at, model, prompt_tokens, completion_tokens, duration_ms)
         VALUES ($1::timestamp, $2, $3, $4, $5)`,
        [utc(new Date()), model ?? null, usage.prompt_tokens ?? 0, usage.completion_tokens ?? 0, durationMs],
      );
    })
    .catch(err => logThrottled("error", "usage_record_failed", { error: (err as Error)?.name ?? "error" }));
}
