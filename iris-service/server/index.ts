import express, { type Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { closeDatabase } from "./db";
import { ensureSchema } from "./migrate";
import { log, logError } from "./logger";
import { allowedOrigins } from "./origins";
import { configureClientIp, logClientIpDiagnostic } from "./clientIp";

const startedAt = Date.now();
const app = express();
// Chat bodies are capped at 1,000 characters, so anything near this size is abuse
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: false, limit: "16kb" }));

// The chat spends OpenAI credits, so only The Darknet District's own sites may call
// the API from a browser (see origins.ts; add more with ALLOWED_ORIGINS).

// CORS for the allowed origins, plus headers that allow iframe embedding
app.use((req, res, next) => {
  // The administrator viewer and its API are same-origin only: no CORS for them
  const adminPath = req.path === "/admin" || req.path.startsWith("/api/admin");
  const origin = req.headers.origin;
  if (!adminPath && origin && allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    // Allow credentials (cookies, authorization headers, etc)
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('Vary', 'Origin');

  // Allow common HTTP methods
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Allow common headers
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Authorization');

  // Remove X-Frame-Options to allow embedding in iframes
  res.removeHeader('X-Frame-Options');

  // Set Content-Security-Policy to allow embedding
  res.setHeader('Content-Security-Policy', "frame-ancestors *");

  // Preflight OPTIONS request handling
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
});

// Who is the visitor behind Render's proxies and Cloudflare? Every per-visitor rate limit
// uses req.ip, so this must resolve the real visitor and ignore forged X-Forwarded-For
// entries (see clientIp.ts).
const proxyTrust = configureClientIp(app);

// One line per API request: route pattern, status and time. Never the path's ids, the
// request body, the response body or any header, so no conversation or token is logged.
const SLOW_REQUEST_MS = 5000;
app.use((req, res, next) => {
  if (req.path.startsWith("/api") && req.path !== "/api/health") logClientIpDiagnostic(req, proxyTrust);
  const start = Date.now();
  res.on("finish", () => {
    if (!req.path.startsWith("/api")) return;
    const ms = Date.now() - start;
    const route = req.route?.path ?? "unmatched";
    if (route === "/api/health" && res.statusCode < 400) return; // warm-up pings are noise
    const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 || ms > SLOW_REQUEST_MS ? "warn" : "info";
    log(level, "http_request", {
      method: req.method, route, status: res.statusCode, ms, slow: ms > SLOW_REQUEST_MS || undefined,
      ...(res.locals.logFields ?? {}),
    });
  });
  next();
});

// Cheap liveness check with no database or OpenAI call. The website pings it when a
// visitor opens the chat, so Render's free tier wakes before the first message.
app.get("/api/health", (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.json({ ok: true, uptimeSeconds: Math.round((Date.now() - startedAt) / 1000) });
});

let httpServer: Server | undefined;
let stopping = false;

function shutdown(signal: string) {
  if (stopping) return;
  stopping = true;
  log("info", "server_stopping", { signal });
  const force = setTimeout(() => {
    log("warn", "server_stop_forced");
    process.exit(1);
  }, 10_000);
  force.unref();
  const finish = async () => {
    await closeDatabase();
    log("info", "server_stopped");
    process.exit(0);
  };
  if (httpServer) httpServer.close(() => void finish());
  else void finish();
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", reason => logError("unhandled_rejection", reason));
process.on("uncaughtException", err => {
  logError("uncaught_exception", err);
  process.exit(1);
});

(async () => {
  const server = await registerRoutes(app);

  // Anything under /api that no route handled is a 404, not the chat page
  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    // Parser errors (413 too large, 400 bad JSON) carry text from the request body,
    // so only the status and type are logged
    log(status >= 500 ? "error" : "warn", "request_error", { status, type: err.type ?? err.name });
    if (res.headersSent) return;
    res.status(status).json({ message: status >= 500 ? "Internal Server Error" : err.message || "Bad request" });
  });

  // Importantly, only setup Vite in development and after
  // setting up all other routes to avoid catch-all conflicts
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Render (and most hosts) assign the port through PORT; 5000 stays the Replit default
  const port = Number(process.env.PORT) || 5000;
  httpServer = server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log("info", "server_started", {
        port,
        node: process.version,
        // Only whether each setting is present, never its value
        openaiKeySet: Boolean(process.env.OPENAI_API_KEY),
        databaseUrlSet: Boolean(process.env.DATABASE_URL) || process.env.IRIS_TEST_DB === "pglite",
        adminViewerOn: process.env.IRIS_ADMIN_VIEWER === "on",
        reportsEnabled: process.env.IRIS_REPORTS_ENABLED === "true",
      });
      // Create any missing tables now rather than on the first visitor's message
      void ensureSchema();
    }
  );
})();
