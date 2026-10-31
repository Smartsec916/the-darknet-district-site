// Creates whatever the chat needs if it is missing, and nothing else.
//
// Every statement is additive and idempotent (CREATE ... IF NOT EXISTS, ADD COLUMN
// IF NOT EXISTS). Nothing here drops, truncates, renames, rewrites or updates an
// existing row or column, so it is safe to run against the production database on
// every start. It is the ONLY place the schema is created or changed: a fresh Neon
// database has no tables, and the service used to fail every save with
// `relation "chat_user_profiles" does not exist` until they existed. (drizzle-kit
// push is disabled; it would drop the tables that only this file creates.)
// To change the schema, follow docs/SCHEMA-MIGRATIONS.md.
import { dbQuery } from "./db";
import { log, logError } from "./logger";

export const REQUIRED_TABLES = [
  "users",
  "chat_user_profiles",
  "chat_sessions",
  "chat_messages",
  "iris_api_usage",
  "iris_daily_reports",
  "iris_report_parts",
  "iris_relationships",
];

const STATEMENTS = [
  // Existing tables, as shared/schema.ts defines them
  `CREATE TABLE IF NOT EXISTS users (
     id serial PRIMARY KEY, username text NOT NULL UNIQUE, password text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS chat_user_profiles (
     id serial PRIMARY KEY, client_id text NOT NULL UNIQUE, display_name text NOT NULL,
     last_seen timestamp NOT NULL DEFAULT now(), trust_level integer DEFAULT 0,
     preferred_mood text, created_at timestamp NOT NULL DEFAULT now())`,
  `CREATE TABLE IF NOT EXISTS chat_sessions (
     id serial PRIMARY KEY, session_id text NOT NULL UNIQUE, client_id text,
     created_at timestamp NOT NULL DEFAULT now())`,
  `CREATE TABLE IF NOT EXISTS chat_messages (
     id serial PRIMARY KEY, session_id text NOT NULL, sender text NOT NULL,
     message text NOT NULL, timestamp timestamp NOT NULL DEFAULT now())`,

  // Conversation history additions
  `ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS language text`,
  `ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ok'`,
  `ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS request_id text`,
  `CREATE UNIQUE INDEX IF NOT EXISTS chat_messages_request_sender_uniq
     ON chat_messages (request_id, sender) WHERE request_id IS NOT NULL`,
  `CREATE INDEX IF NOT EXISTS chat_messages_session_ts_idx ON chat_messages (session_id, timestamp)`,
  `CREATE INDEX IF NOT EXISTS chat_messages_ts_idx ON chat_messages (timestamp)`,

  // OpenAI usage, for the daily report's token and cost summary
  `CREATE TABLE IF NOT EXISTS iris_api_usage (
     id serial PRIMARY KEY, created_at timestamp NOT NULL DEFAULT now(), model text,
     prompt_tokens integer NOT NULL DEFAULT 0, completion_tokens integer NOT NULL DEFAULT 0,
     duration_ms integer)`,
  `CREATE INDEX IF NOT EXISTS iris_api_usage_ts_idx ON iris_api_usage (created_at)`,

  // Daily report delivery state
  `CREATE TABLE IF NOT EXISTS iris_daily_reports (
     report_date date PRIMARY KEY, status text NOT NULL,
     conversation_count integer NOT NULL DEFAULT 0, visitor_messages integer NOT NULL DEFAULT 0,
     iris_messages integer NOT NULL DEFAULT 0, error_count integer NOT NULL DEFAULT 0,
     parts_total integer NOT NULL DEFAULT 0, attempts integer NOT NULL DEFAULT 0,
     locked_at timestamp, last_error text,
     created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now(),
     sent_at timestamp)`,
  // Fingerprint of the transcript a report was cut from, so a resumed run can tell if the data changed
  `ALTER TABLE iris_daily_reports ADD COLUMN IF NOT EXISTS content_hash text`,
  `CREATE TABLE IF NOT EXISTS iris_report_parts (
     report_date date NOT NULL, part_no integer NOT NULL, status text NOT NULL,
     sent_at timestamp, provider_message_id text, last_error text,
     PRIMARY KEY (report_date, part_no))`,

  // Iris's memory of each visitor (trust, mood, a few stated likes); erasable per visitor, expires unused
  `CREATE TABLE IF NOT EXISTS iris_relationships (
     client_id text PRIMARY KEY, trust real NOT NULL DEFAULT 1, familiarity real NOT NULL DEFAULT 0,
     affection real NOT NULL DEFAULT 0, respect real NOT NULL DEFAULT 0.5, playfulness real NOT NULL DEFAULT 0.3,
     mood text NOT NULL DEFAULT 'professional', visits integer NOT NULL DEFAULT 0, messages integer NOT NULL DEFAULT 0,
     first_seen timestamp NOT NULL DEFAULT now(), last_seen timestamp NOT NULL DEFAULT now(),
     preferences text NOT NULL DEFAULT '[]', recap text NOT NULL DEFAULT '',
     flirt_cooldown integer NOT NULL DEFAULT 0, minor boolean NOT NULL DEFAULT false,
     updated_at timestamp NOT NULL DEFAULT now())`,
  `CREATE INDEX IF NOT EXISTS iris_relationships_last_seen_idx ON iris_relationships (last_seen)`,
];

let schemaReady = false;
let lastAttempt = 0;
let inFlight: Promise<boolean> | null = null;
const RETRY_COOLDOWN_MS = 30_000;

async function run(): Promise<boolean> {
  try {
    for (const statement of STATEMENTS) {
      try {
        await dbQuery(statement);
      } catch (err: any) {
        // Two instances starting together can race on CREATE; the other one won
        if (err?.code === "42P07" || err?.code === "23505") continue;
        throw err;
      }
    }
    const { rows } = await dbQuery(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema()",
    );
    const present = new Set(rows.map((row: any) => row.table_name));
    const missing = REQUIRED_TABLES.filter(table => !present.has(table));
    if (missing.length) {
      log("error", "schema_incomplete", { missing: missing.join(",") });
      return false;
    }
    log("info", "schema_ready", { tables: REQUIRED_TABLES.length });
    return true;
  } catch (err) {
    logError("schema_setup_failed", err);
    return false;
  }
}

// Safe to call before every database write: it does the work once and, if the
// database was unreachable, retries at most every 30 seconds.
export function ensureSchema(): Promise<boolean> {
  if (schemaReady) return Promise.resolve(true);
  if (inFlight) return inFlight;
  if (Date.now() - lastAttempt < RETRY_COOLDOWN_MS) return Promise.resolve(false);
  lastAttempt = Date.now();
  inFlight = run().then(ok => {
    schemaReady = ok;
    inFlight = null;
    return ok;
  });
  return inFlight;
}

export function resetSchemaStateForTests(): void {
  schemaReady = false;
  lastAttempt = 0;
  inFlight = null;
}
