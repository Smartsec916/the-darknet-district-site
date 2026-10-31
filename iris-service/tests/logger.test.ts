// The technical log must never carry credentials or conversation text.
import test from "node:test";
import assert from "node:assert/strict";
import { redact, describeError, log, logError, logThrottled } from "../server/logger";

function capture(fn: () => void): string {
  const out: string[] = [];
  const realLog = console.log, realError = console.error;
  console.log = (...a: unknown[]) => { out.push(a.join(" ")); };
  console.error = (...a: unknown[]) => { out.push(a.join(" ")); };
  try { fn(); } finally { console.log = realLog; console.error = realError; }
  return out.join("\n");
}

test("credentials are redacted wherever they appear", () => {
  const text = redact([
    "connect postgresql://neondb_owner:npg_SuperSecret123@ep-cool-db.us-east-2.aws.neon.tech/neondb?sslmode=require failed",
    "Incorrect API key provided: sk-proj-abcdEFGH1234****wxyz",
    "header was Authorization: Bearer abc123.def456-ghi789_jkl",
    "api-key: xkeysib-0123456789abcdef0123456789abcdef-AbCdEf",
    "token=supersecretvalue password: hunter22",
    "hash 0123456789abcdef0123456789abcdef01234567",
  ].join("\n"));
  for (const secret of ["npg_SuperSecret123", "neondb_owner", "ep-cool-db", "abcdEFGH1234", "abc123.def456", "xkeysib-0123", "supersecretvalue", "hunter22", "0123456789abcdef0123456789abcdef01234567"]) {
    assert.ok(!text.includes(secret), `${secret} leaked: ${text}`);
  }
});

test("database errors drop the SQL and its parameters, which hold conversation text", () => {
  const driverError = Object.assign(new Error('relation "chat_user_profiles" does not exist'), {
    code: "42P01", table: "chat_user_profiles", detail: "Key (message)=(my private question) already exists",
  });
  const drizzle = Object.assign(
    new Error('Failed query: insert into "chat_messages" ("message") values ($1)\nparams: my private question'),
    { cause: driverError },
  );
  const info = describeError(drizzle);
  const text = JSON.stringify(info);
  assert.ok(!text.includes("private question"));
  assert.ok(!text.includes("insert into"));
  assert.equal(info.code, "42P01");
  assert.equal(info.table, "chat_user_profiles");
  assert.match(String(info.causeMessage), /chat_user_profiles" does not exist/); // the useful part is kept
});

test("OpenAI-style errors keep status and code but not the key", () => {
  const err = Object.assign(new Error("401 Incorrect API key provided: sk-live-ZZZZZZZZZZZZ1234. Find your key at https://platform.openai.com"), {
    status: 401, code: "invalid_api_key", type: "invalid_request_error",
  });
  const out = capture(() => logError("openai_request_failed", err, { ms: 120 }));
  assert.ok(!out.includes("sk-live-ZZZZZZZZZZZZ1234"));
  const entry = JSON.parse(out);
  assert.equal(entry.event, "openai_request_failed");
  assert.equal(entry.error.status, 401);
  assert.equal(entry.error.code, "invalid_api_key");
  assert.equal(entry.level, "error");
  assert.match(entry.ts, /^\d{4}-\d{2}-\d{2}T.*Z$/);
});

test("every field passed to log() is redacted and long values are cut", () => {
  const out = capture(() => log("warn", "email_failed", { note: "Bearer abcdefghijklmnop", big: "x".repeat(2000) }));
  const entry = JSON.parse(out);
  assert.ok(!out.includes("abcdefghijklmnop"));
  assert.ok(entry.big.length < 400);
});

test("debug output is silent unless IRIS_DEBUG=1", () => {
  delete process.env.IRIS_DEBUG;
  assert.equal(capture(() => log("debug", "chatter")), "");
  process.env.IRIS_DEBUG = "1";
  assert.match(capture(() => log("debug", "chatter")), /chatter/);
  delete process.env.IRIS_DEBUG;
});

test("a repeating failure is logged once per window", () => {
  const out = capture(() => { for (let i = 0; i < 50; i++) logThrottled("error", "db_down_test", { n: i }, 60_000); });
  assert.equal(out.split("\n").filter(Boolean).length, 1);
});
