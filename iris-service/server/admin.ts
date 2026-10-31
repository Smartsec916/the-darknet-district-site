// Private, read-only administrator access to stored conversations, and the endpoint
// the external scheduler calls to send the daily report.
//
// Authorization is checked on the server for every request, from a secret in the
// server's environment. A name typed into the chat, anything Iris says, or any
// frontend check never grants access. Nothing here is public:
//   - the viewer and /api/admin/* answer 404 unless IRIS_ADMIN_VIEWER=on AND
//     IRIS_ADMIN_TOKEN (32+ characters) is set, so by default they do not exist;
//   - the report endpoint answers 404 unless a report or admin token is set;
//   - there are no default credentials.
import crypto from "crypto";
import { Router, type Request, type Response, type NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { dbQuery } from "./db";
import { ensureSchema } from "./migrate";
import { logError, logThrottled } from "./logger";
import { runDailyReport, runScheduledReports, listReports } from "./reports";
import { ADMIN_VIEWER_HTML } from "./adminViewer";

const MIN_TOKEN_LENGTH = 32;

function configured(name: string): string | null {
  const value = process.env[name] || "";
  return value.length >= MIN_TOKEN_LENGTH ? value : null;
}

function sameToken(provided: string, expected: string): boolean {
  const a = crypto.createHash("sha256").update(provided).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

function bearer(req: Request): string {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : "";
}

const viewerEnabled = () => process.env.IRIS_ADMIN_VIEWER === "on" && configured("IRIS_ADMIN_TOKEN") !== null;

// Only failed attempts count, so legitimate use is never throttled
const failedAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: false,
  legacyHeaders: false,
  message: { error: "Too many failed attempts" },
});

function noStore(res: Response) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  noStore(res);
  const expected = viewerEnabled() ? configured("IRIS_ADMIN_TOKEN") : null;
  if (!expected) return res.status(404).json({ error: "Not found" });
  if (!sameToken(bearer(req), expected)) {
    logThrottled("warn", "admin_auth_failed", { path: req.path }, 10_000);
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// The scheduler holds a token that can only trigger the report, never read conversations
function requireReportAuth(req: Request, res: Response, next: NextFunction) {
  noStore(res);
  const tokens = [configured("IRIS_REPORT_TOKEN"), configured("IRIS_ADMIN_TOKEN")].filter(Boolean) as string[];
  if (!tokens.length) return res.status(404).json({ error: "Not found" });
  const given = bearer(req);
  if (!given || !tokens.some(token => sameToken(given, token))) {
    logThrottled("warn", "report_auth_failed", {}, 10_000);
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

const TS = (column: string) => `to_char(${column}, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`;
const escapeLike = (text: string) => text.replace(/[\\%_]/g, ch => "\\" + ch);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function oneString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function messageFilter(query: Request["query"], params: unknown[]): string {
  const clauses: string[] = ["TRUE"];
  const q = oneString(query.q).slice(0, 200);
  if (q) { params.push("%" + escapeLike(q) + "%"); clauses.push(`message ILIKE $${params.length} ESCAPE '\\'`); }
  const session = oneString(query.session).slice(0, 128);
  if (session) { params.push("%" + escapeLike(session) + "%"); clauses.push(`session_id ILIKE $${params.length} ESCAPE '\\'`); }
  const from = oneString(query.from), to = oneString(query.to);
  if (DATE_RE.test(from)) { params.push(from + " 00:00:00"); clauses.push(`timestamp >= $${params.length}::timestamp`); }
  if (DATE_RE.test(to)) { params.push(to + " 00:00:00"); clauses.push(`timestamp < ($${params.length}::timestamp + interval '1 day')`); }
  const type = oneString(query.type);
  if (type === "visitor") clauses.push(`sender = 'user'`);
  if (type === "iris") clauses.push(`sender = 'iris'`);
  const status = oneString(query.status);
  if (["ok", "fallback", "error"].includes(status)) { params.push(status); clauses.push(`status = $${params.length}`); }
  return clauses.join(" AND ");
}

function intParam(value: unknown, fallback: number, min: number, max: number): number {
  const n = Number.parseInt(oneString(value), 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

type Handler = (req: Request, res: Response) => Promise<unknown>;
const guarded = (name: string, handler: Handler) => async (req: Request, res: Response) => {
  try {
    if (!(await ensureSchema())) return res.status(503).json({ error: "Database unavailable" });
    await handler(req, res);
  } catch (err) {
    logError("admin_request_failed", err, { route: name });
    if (!res.headersSent) res.status(500).json({ error: "Request failed" });
  }
};

export function createAdminRouter(): Router {
  const router = Router();

  // The page only; it contains no conversation data
  router.get("/admin", (req, res) => {
    if (!viewerEnabled()) return res.status(404).type("text").send("Not found");
    noStore(res);
    res.setHeader("Content-Security-Policy",
      "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'");
    res.setHeader("X-Frame-Options", "DENY");
    res.type("html").send(ADMIN_VIEWER_HTML);
  });

  router.get("/api/admin/stats", failedAuthLimiter, requireAdmin, guarded("stats", async (_req, res) => {
    const { rows } = await dbQuery(
      `SELECT COUNT(DISTINCT session_id) AS conversations, COUNT(*) AS messages,
              COUNT(*) FILTER (WHERE sender = 'user') AS visitor,
              COUNT(*) FILTER (WHERE sender = 'iris') AS iris,
              COUNT(*) FILTER (WHERE status <> 'ok') AS errors,
              ${TS("MIN(timestamp)")} AS first_at, ${TS("MAX(timestamp)")} AS last_at
       FROM chat_messages`,
    );
    const r = rows[0];
    res.json({
      conversations: Number(r.conversations), messages: Number(r.messages), visitorMessages: Number(r.visitor),
      irisMessages: Number(r.iris), errors: Number(r.errors), firstAt: r.first_at, lastAt: r.last_at,
    });
  }));

  router.get("/api/admin/conversations", failedAuthLimiter, requireAdmin, guarded("conversations", async (req, res) => {
    const params: unknown[] = [];
    const where = messageFilter(req.query, params);
    const pageSize = intParam(req.query.pageSize, 25, 1, 100);
    const page = intParam(req.query.page, 1, 1, 100000);
    const total = Number((await dbQuery(
      `SELECT COUNT(*) AS n FROM (SELECT session_id FROM chat_messages WHERE ${where} GROUP BY session_id) s`, params,
    )).rows[0].n);
    const { rows } = await dbQuery(
      `SELECT m.session_id, ${TS("MIN(m.timestamp)")} AS first_at, ${TS("MAX(m.timestamp)")} AS last_at,
              COUNT(*) AS message_count, COUNT(*) FILTER (WHERE m.status <> 'ok') AS error_count,
              (SELECT f.message FROM chat_messages f WHERE f.session_id = m.session_id AND f.sender = 'user'
                 ORDER BY f.timestamp, f.id LIMIT 1) AS first_visitor_message
       FROM chat_messages m
       WHERE m.session_id IN (SELECT session_id FROM chat_messages WHERE ${where} GROUP BY session_id)
       GROUP BY m.session_id
       ORDER BY MAX(m.timestamp) DESC, m.session_id
       LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`,
      params,
    );
    res.json({
      total, page, pageSize,
      conversations: rows.map((r: any) => ({
        sessionId: r.session_id, firstAt: r.first_at, lastAt: r.last_at,
        messageCount: Number(r.message_count), errorCount: Number(r.error_count),
        firstVisitorMessage: r.first_visitor_message ? String(r.first_visitor_message).slice(0, 140) : null,
      })),
    });
  }));

  router.get("/api/admin/conversations/:sessionId", failedAuthLimiter, requireAdmin, guarded("conversation", async (req, res) => {
    const sessionId = String(req.params.sessionId).slice(0, 128);
    const type = oneString(req.query.type);
    const { rows } = await dbQuery(
      `SELECT id, sender, message, ${TS("timestamp")} AS ts, language, status FROM chat_messages
       WHERE session_id = $1 ${type === "visitor" ? "AND sender = 'user'" : type === "iris" ? "AND sender = 'iris'" : ""}
       ORDER BY timestamp, id`,
      [sessionId],
    );
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    const started = (await dbQuery(`SELECT ${TS("MIN(timestamp)")} AS ts FROM chat_messages WHERE session_id = $1`, [sessionId])).rows[0].ts;
    res.json({
      sessionId, startedAt: started,
      messages: rows.map((r: any) => ({
        id: r.id, sender: r.sender, message: r.message, timestamp: r.ts, language: r.language, status: r.status,
      })),
    });
  }));

  router.get("/api/admin/reports", failedAuthLimiter, requireAdmin, guarded("reports", async (_req, res) => {
    res.json({ reports: await listReports() });
  }));

  // Called by the external scheduler (see docs). The recipient is never read from the request.
  router.post("/api/admin/reports/daily", failedAuthLimiter, requireReportAuth, async (req, res) => {
    try {
      const body = (req.body ?? {}) as { date?: unknown; dryRun?: unknown };
      const dryRun = body.dryRun === true;
      // A date reports exactly that day. With no date this is the scheduled run: yesterday, plus
      // any earlier day that is unfinished or was missed (oldest first, nothing sent twice).
      const outcome = typeof body.date === "string"
        ? await runDailyReport({ date: body.date, dryRun })
        : await runScheduledReports({ dryRun });
      const code = outcome.status === "failed" ? 502
        : outcome.status === "partial" ? 202 // more emails follow at the next scheduled run
        : outcome.status === "invalid_date" ? 400
        : outcome.status === "disabled" || outcome.status === "not_configured" ? 503
        : 200;
      res.status(code).json(outcome);
    } catch (err) {
      logError("report_run_failed", err);
      res.status(500).json({ status: "error" });
    }
  });

  return router;
}
