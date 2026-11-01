// `npm run db:push` used to run `drizzle-kit push`. It is disabled on purpose.
//
// drizzle-kit push makes the database match shared/schema.ts exactly. This database also holds
// tables and indexes that only server/migrate.ts creates, so a push proposes to DROP them
// (and, on some databases, to TRUNCATE chat_sessions). It exits with success when it cannot
// ask its confirmation question, which makes it look harmless in a build log.
//
// Schema changes are made in server/migrate.ts and applied, additively, when the service
// starts. See docs/SCHEMA-MIGRATIONS.md.
console.error(`
db:push is disabled for this project.

  Why:  drizzle-kit push would try to DROP the report and usage tables and some indexes,
        because they are created by server/migrate.ts and are not in shared/schema.ts.
  Do:   change the schema in server/migrate.ts (additive SQL only). The service applies it
        when it starts. Procedure: docs/SCHEMA-MIGRATIONS.md
  Check a database without changing it:  npm run db:check

The Render Build Command should be:  npm ci --include=dev && npm run build
`);
process.exit(1);
