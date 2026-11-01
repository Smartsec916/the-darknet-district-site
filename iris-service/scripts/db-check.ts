// Read-only health check of the database Iris is connected to.
//
//   DATABASE_URL="postgresql://..." npm run db:check
//
// Prints which tables exist, how many rows they hold, the columns the conversation
// history needs, and the database's time zone. It never writes, creates or deletes
// anything, and it never prints a conversation: only table names and counts.
import { dbQuery, closeDatabase } from "../server/db";
import { REQUIRED_TABLES } from "../server/migrate";

async function main() {
  const tables = (await dbQuery(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema()",
  )).rows.map((r: any) => r.table_name as string);

  console.log("Tables the service needs:");
  let missing = 0;
  for (const table of REQUIRED_TABLES) {
    if (!tables.includes(table)) {
      missing++;
      console.log(`  MISSING  ${table}`);
      continue;
    }
    const count = (await dbQuery(`SELECT COUNT(*) AS n FROM ${table}`)).rows[0].n;
    console.log(`  ok       ${table.padEnd(20)} ${count} rows`);
  }

  if (tables.includes("chat_messages")) {
    const columns = (await dbQuery(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'chat_messages'",
    )).rows.map((r: any) => r.column_name as string);
    for (const column of ["language", "status", "request_id"]) {
      console.log(`  chat_messages.${column.padEnd(11)} ${columns.includes(column) ? "ok" : "MISSING (added automatically when the service starts)"}`);
    }
    const stats = (await dbQuery(
      `SELECT COUNT(DISTINCT session_id) AS conversations, COUNT(*) FILTER (WHERE sender = 'user') AS visitor,
              COUNT(*) FILTER (WHERE sender = 'iris') AS iris,
              to_char(MIN(timestamp), 'YYYY-MM-DD HH24:MI:SS') AS first, to_char(MAX(timestamp), 'YYYY-MM-DD HH24:MI:SS') AS last
       FROM chat_messages`,
    )).rows[0];
    console.log(`\nStored conversations: ${stats.conversations} (${stats.visitor} visitor messages, ${stats.iris} Iris replies)`);
    console.log(`Oldest message: ${stats.first ?? "none"}   Newest: ${stats.last ?? "none"}   (stored as UTC)`);
  }

  const zone = (await dbQuery("SHOW timezone")).rows[0].TimeZone ?? (await dbQuery("SHOW timezone")).rows[0].timezone;
  console.log(`\nDatabase time zone: ${zone}${/^(UTC|Etc\/UTC|GMT)$/i.test(zone) ? "" : "  <- not UTC: rows saved before this update used it"}`);
  console.log(missing ? `\n${missing} table(s) missing. They are created automatically when the service starts.` : "\nAll required tables exist.");
  console.log("Read-only: nothing was changed.");
}

main()
  .catch(err => {
    // Connection errors can include the connection string, so only the code and a short message are shown
    console.error("Check failed:", (err as any)?.code ?? (err as Error)?.name, String((err as Error)?.message).replace(/postgres(ql)?:\/\/\S+/gi, "postgres://[redacted]").split("\n")[0]);
    process.exitCode = 1;
  })
  .finally(() => closeDatabase());
