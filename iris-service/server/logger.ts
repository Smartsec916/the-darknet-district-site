// Technical logging for Render's log stream. One JSON object per line.
//
// Rules:
// - Conversations never go through here. Callers pass event names and small
//   fields (status codes, durations, counts), not visitor or Iris text.
// - Anything that could carry a secret is redacted before it is written, because
//   error messages from OpenAI, Postgres and the email provider can echo
//   credentials or connection strings.
// - Database errors are reduced to their code and a short message: Drizzle errors
//   embed the full SQL and its parameters, and the parameters are conversation text.

type Level = "debug" | "info" | "warn" | "error";

const REDACTIONS: Array<[RegExp, string]> = [
  [/postgres(?:ql)?:\/\/[^\s"'<>]+/gi, "postgres://[redacted]"],
  [/\bsk-[A-Za-z0-9_*\-]{6,}/g, "sk-[redacted]"],
  [/\b(?:xkeysib|xsmtpsib|re|key)-[A-Za-z0-9_*\-]{16,}/g, "[redacted-key]"],
  [/\bBearer\s+[A-Za-z0-9._~+\/=\-]{8,}/gi, "Bearer [redacted]"],
  [/\b(api[-_ ]?key|token|secret|password|passphrase|authorization)\b(\s*[:=]\s*)\S+/gi, "$1$2[redacted]"],
  [/\b[A-Fa-f0-9]{40,}\b/g, "[redacted-hex]"],
];

export function redact(text: string): string {
  let out = text;
  for (const [pattern, replacement] of REDACTIONS) out = out.replace(pattern, replacement);
  return out;
}

const MAX_FIELD_CHARS = 300;

function clean(value: string): string {
  const redacted = redact(value);
  return redacted.length > MAX_FIELD_CHARS ? redacted.slice(0, MAX_FIELD_CHARS) + "…" : redacted;
}

// Safe summary of an error: type, codes and a short redacted message. Never the
// SQL text, query parameters, request bodies or Postgres `detail` (which echoes values).
export function describeError(err: unknown): Record<string, unknown> {
  if (!(err instanceof Error)) return { message: clean(String(err)) };
  const e = err as Error & Record<string, any>;
  const cause = e.cause && typeof e.cause === "object" ? (e.cause as Record<string, any>) : undefined;
  let message = e.message || "";
  // Drizzle: "Failed query: <sql>\nparams: <values>"
  if (/^Failed query:/i.test(message)) message = "Failed query (SQL and parameters omitted)";
  message = message.split("\n")[0];
  const info: Record<string, unknown> = { name: e.name, message: clean(message) };
  const code = e.code ?? cause?.code;
  if (code !== undefined) info.code = code;
  if (e.status !== undefined) info.status = e.status; // OpenAI / HTTP status
  if (e.type !== undefined) info.type = e.type;
  const table = e.table ?? cause?.table;
  const constraint = e.constraint ?? cause?.constraint;
  if (table) info.table = table;
  if (constraint) info.constraint = constraint;
  if (cause?.message && cause.message !== e.message) info.causeMessage = clean(String(cause.message).split("\n")[0]);
  return info;
}

export function log(level: Level, event: string, fields: Record<string, unknown> = {}): void {
  if (level === "debug" && process.env.IRIS_DEBUG !== "1") return;
  const safeFields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    safeFields[key] = typeof value === "string" ? clean(value) : value;
  }
  const line = JSON.stringify({ ts: new Date().toISOString(), level, event, ...safeFields });
  (level === "error" || level === "warn" ? console.error : console.log)(line);
}

export function logError(event: string, err: unknown, fields: Record<string, unknown> = {}): void {
  log("error", event, { ...fields, error: describeError(err) });
}

// For events that can repeat many times in a row when a dependency is down
// (for example every chat message hitting the same database outage).
const lastLogged = new Map<string, number>();
export function logThrottled(level: Level, event: string, fields: Record<string, unknown> = {}, everyMs = 60_000): void {
  const now = Date.now();
  if (now - (lastLogged.get(event) ?? 0) < everyMs) return;
  lastLogged.set(event, now);
  log(level, event, fields);
}

// Verbose per-message detail, off unless IRIS_DEBUG=1. It can include visitor names,
// so never turn it on in production.
export function debugLog(...args: unknown[]): void {
  if (process.env.IRIS_DEBUG === "1") console.log(...args);
}
