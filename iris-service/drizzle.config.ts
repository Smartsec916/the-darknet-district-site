import { defineConfig } from "drizzle-kit";

// drizzle-kit is NOT used to change this database. `drizzle-kit push` makes the database
// match shared/schema.ts exactly, so it proposes to DROP tables and indexes that only
// server/migrate.ts creates (the report and usage tables). Schema changes go in
// server/migrate.ts; see docs/SCHEMA-MIGRATIONS.md.
//
// The tool stays installed only for read-only uses such as `drizzle-kit generate` against a
// throwaway local database. Running it needs this explicit acknowledgement.
if (process.env.ALLOW_DRIZZLE_KIT !== "i-know-this-can-drop-tables") {
  throw new Error(
    "drizzle-kit is disabled for this project because it can drop tables. " +
      "Make schema changes in server/migrate.ts (see docs/SCHEMA-MIGRATIONS.md).",
  );
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
