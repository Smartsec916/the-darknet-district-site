import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import type { NeonDatabase } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { log, logError } from "./logger";

neonConfig.webSocketConstructor = ws;

export interface QueryResult { rows: any[] }

let pool: Pool | null = null;
let db: NeonDatabase<typeof schema>;
let rawQuery: (text: string, params?: unknown[]) => Promise<QueryResult>;
let closeDb: () => Promise<void>;

if (process.env.IRIS_TEST_DB === "pglite") {
  // Automated tests run against an in-memory Postgres (PGlite) instead of Neon.
  // It is a dev dependency and is never loaded in production.
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle: drizzlePglite } = await import("drizzle-orm/pglite");
  const client = new PGlite();
  db = drizzlePglite(client, { schema }) as unknown as NeonDatabase<typeof schema>;
  rawQuery = (text, params) => client.query(text, params as any[]);
  closeDb = () => client.close();
} else {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  // Neon closes idle connections when the database autosuspends. Without this
  // handler that surfaces as an unhandled 'error' event and kills the process.
  pool.on("error", err => logError("db_pool_error", err));
  db = drizzle({ client: pool, schema });
  rawQuery = (text, params) => pool!.query(text, params as any[]);
  closeDb = () => pool!.end();
}

export { pool, db };

// Parameterized SQL for the logging, reporting and admin code
export const dbQuery = rawQuery;

export async function closeDatabase(): Promise<void> {
  try {
    await closeDb();
    log("info", "db_closed");
  } catch (err) {
    logError("db_close_failed", err);
  }
}
