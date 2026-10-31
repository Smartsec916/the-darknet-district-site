# Changing the Iris database schema

The conversations in Neon are the one thing here that cannot be rebuilt, so schema changes
are slow and boring on purpose.

## How the schema works

- `server/migrate.ts` is the **only** place tables and columns are created. It runs every time
  the service starts (and before the first save if the database was unreachable at start).
- Every statement is **additive and idempotent**: `CREATE TABLE IF NOT EXISTS`,
  `ADD COLUMN IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`. Running it twice, or from two
  instances at once, changes nothing the second time.
- `shared/schema.ts` describes the same tables to the code (Drizzle). It does not create
  anything. A test (`tests/schema-coverage.test.ts`) fails if the two drift apart.
- The Render build step does **not** touch the database. The build command is
  `npm ci --include=dev && npm run build`.

## Why `db:push` / `drizzle-kit push` is disabled

`drizzle-kit push` makes the database match `shared/schema.ts` exactly. The report and usage
tables and several indexes exist only in `migrate.ts`, so a push proposes to **drop** them, and
on some databases to **truncate** `chat_sessions`. In a build log (no terminal) it cannot ask its
question, stops, and still reports success, so it looks harmless until someone confirms it.
`npm run db:push` now prints this explanation and fails; `drizzle.config.ts` refuses to load
without an explicit override. Do not add either back to the build.

## Adding something (the normal case)

1. Add the column or table to `shared/schema.ts`.
2. Add the matching statement to `STATEMENTS` in `server/migrate.ts`, in the same style:
   - a new column: `ALTER TABLE t ADD COLUMN IF NOT EXISTS c <type>` that is **nullable or has a
     default** (so old code and existing rows keep working);
   - a new table: `CREATE TABLE IF NOT EXISTS ...`, and add its name to `REQUIRED_TABLES`;
   - an index: `CREATE INDEX IF NOT EXISTS ...`. On a large table an index build blocks writes
     for its duration; if the table has grown large, create it by hand with
     `CREATE INDEX CONCURRENTLY` in Neon's SQL editor instead.
3. Run `npm test`. The schema-coverage test starts from an empty database and checks every
   Drizzle table and column exists, and the migration test checks no statement can destroy data.
4. Open a pull request. Deploy with the checklist below.

## Never in `migrate.ts` (anything that can lose or rewrite data)

`DROP`, `TRUNCATE`, `DELETE`, `RENAME`, `ALTER COLUMN ... TYPE`, `SET NOT NULL` on an existing
column, or an `UPDATE` of stored conversations. The tests reject these. They need the manual
procedure below.

## Removing or changing something (rare, manual)

Use expand, then contract, across two deployments:

1. **Expand:** ship code that no longer reads or writes the old column/table, and (if needed)
   the new one next to it. Deploy and run for a few days.
2. **Back up:** create a Neon branch of the production database (free, instant, copy-on-write).
3. **Rehearse:** write the SQL, run it on the Neon branch, then run `npm run db:check` against
   the branch and compare row counts with production.
4. **Apply by hand:** run the reviewed SQL in Neon's SQL editor on production, inside a
   transaction (`BEGIN; ... COMMIT;`), at a quiet time. Never from the build or the service.
5. **Verify:** `npm run db:check`, then send a test chat and confirm it saves.
6. **Contract:** only then remove the leftover code.

## Deploy checklist for any schema change

- [ ] `npm test` and `npm run build` pass.
- [ ] Neon branch created (a restore point).
- [ ] `DATABASE_URL=<production> npm run db:check` before: note the row counts and the time zone.
- [ ] Manual Deploy in Render (Auto-Deploy stays off).
- [ ] Logs show `server_started` then `schema_ready`. Anything else (`schema_setup_failed`,
      `schema_incomplete`): stop. Chat keeps answering but nothing is saved until it is fixed.
- [ ] `db:check` after: the same row counts (or higher), no table missing.
- [ ] Send a test message and confirm `saved:true` in the log.

## Rolling back

Because changes are additive, rolling back the code is safe: the previous version ignores the
new columns and tables. Use Render's *Rollback* (or deploy the previous commit). The extra
columns and tables stay in the database, unused.

## If start-up cannot change the schema

The database user must be allowed to create tables in the `public` schema. If the log shows
`schema_setup_failed`, read its error code: `42501` means a permissions problem (use the
database owner role in `DATABASE_URL`); a connection error means Neon was unreachable and the
service will retry on its own within 30 seconds.

## `drizzle-kit`

Left installed only for read-only uses such as `drizzle-kit generate` against a throwaway local
database (set `ALLOW_DRIZZLE_KIT=i-know-this-can-drop-tables` for that one command). Never point
it at the production database, and never run `push` or `migrate` against it.
