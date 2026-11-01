// The schema is created only by server/migrate.ts, at start-up. These tests keep that safe:
// the code's table definitions must be fully covered by it, and it must only ever add.
process.env.IRIS_TEST_DB = "pglite";
import test, { after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const { dbQuery, closeDatabase } = await import("../server/db");
const { ensureSchema, resetSchemaStateForTests, REQUIRED_TABLES } = await import("../server/migrate");
const schema = await import("../shared/schema");
const { getTableConfig } = await import("drizzle-orm/pg-core");

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
after(() => closeDatabase());

function drizzleTables() {
  const tables = [];
  for (const value of Object.values(schema)) {
    try { tables.push(getTableConfig(value as any)); } catch { /* not a table */ }
  }
  return tables;
}

test("from an empty database, start-up creates every table and column the code uses", async () => {
  assert.equal((await dbQuery("SELECT count(*) AS n FROM information_schema.tables WHERE table_schema = 'public'")).rows[0].n, 0);
  assert.equal(await ensureSchema(), true);

  const rows = (await dbQuery("SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public'")).rows;
  const have = new Map<string, Set<string>>();
  for (const r of rows) {
    if (!have.has(r.table_name)) have.set(r.table_name, new Set());
    have.get(r.table_name)!.add(r.column_name);
  }
  const tables = drizzleTables();
  assert.ok(tables.length >= 4, "the schema should define the chat tables");
  for (const t of tables) {
    const columns = have.get(t.name);
    assert.ok(columns, `table ${t.name} is defined in shared/schema.ts but not created by server/migrate.ts`);
    for (const column of t.columns) {
      assert.ok(columns.has(column.name), `${t.name}.${column.name} is in shared/schema.ts but not created by server/migrate.ts`);
    }
    assert.ok(REQUIRED_TABLES.includes(t.name), `${t.name} is missing from REQUIRED_TABLES`);
  }
  for (const name of REQUIRED_TABLES) assert.ok(have.has(name), `${name} is required but was not created`);
});

test("running the migration again keeps every stored row", async () => {
  await dbQuery(`INSERT INTO chat_sessions (session_id) VALUES ('keep-me')`);
  await dbQuery(`INSERT INTO chat_messages (session_id, sender, message, timestamp, status) VALUES
                 ('keep-me', 'user', 'a question worth keeping', '2026-10-01 10:00:00', 'ok')`);
  const count = async () => Number((await dbQuery("SELECT count(*) AS n FROM chat_messages")).rows[0].n);
  const before = await count();
  for (let i = 0; i < 3; i++) {
    resetSchemaStateForTests();
    assert.equal(await ensureSchema(), true);
  }
  assert.equal(await count(), before);
  assert.equal((await dbQuery("SELECT message FROM chat_messages WHERE session_id = 'keep-me'")).rows[0].message, "a question worth keeping");
  assert.equal(Number((await dbQuery("SELECT count(*) AS n FROM chat_sessions WHERE session_id = 'keep-me'")).rows[0].n), 1);
});

test("every migration statement is additive and idempotent", () => {
  const source = fs.readFileSync(path.join(root, "server/migrate.ts"), "utf8");
  const start = source.indexOf("const STATEMENTS = [");
  const end = source.indexOf("\n];", start);
  assert.ok(start > 0 && end > start, "could not find the STATEMENTS list");
  const block = source.slice(start, end).split("\n").filter(line => !line.trim().startsWith("//")).join("\n");
  const statements = [...block.matchAll(/`([^`]+)`/g)].map(m => m[1].replace(/\s+/g, " ").trim());
  assert.ok(statements.length >= 10);

  const allowed = [
    /^CREATE TABLE IF NOT EXISTS \w+ \(/i,
    /^ALTER TABLE \w+ ADD COLUMN IF NOT EXISTS \w+ /i,
    /^CREATE (UNIQUE )?INDEX IF NOT EXISTS \w+ ON \w+ /i,
  ];
  for (const statement of statements) {
    assert.ok(allowed.some(pattern => pattern.test(statement)), `not an additive, idempotent statement: ${statement.slice(0, 90)}`);
    assert.ok(
      !/\b(DROP|TRUNCATE|DELETE|RENAME|UPDATE|INSERT|ALTER\s+COLUMN|SET\s+NOT\s+NULL|CASCADE)\b/i.test(statement),
      `statement can remove or rewrite data: ${statement.slice(0, 90)}`,
    );
    if (/ADD COLUMN/i.test(statement) && /NOT NULL/i.test(statement)) {
      assert.match(statement, /DEFAULT/i, `a new NOT NULL column needs a DEFAULT so existing rows stay valid: ${statement.slice(0, 90)}`);
    }
  }
});
