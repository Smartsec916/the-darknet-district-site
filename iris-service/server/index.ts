import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { createServer } from "http"; // <-- Required to support server.listen

const app = express();
// Chat bodies are capped at 1,000 characters, so anything near this size is abuse
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: false, limit: "16kb" }));

// The chat spends OpenAI credits, so only The Darknet District's own sites may call
// the API from a browser. Add more origins with ALLOWED_ORIGINS (comma-separated).
const allowedOrigins = new Set(
  (process.env.ALLOWED_ORIGINS || "https://thedarknetdistrict.com,https://www.thedarknetdistrict.com")
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean)
);

// CORS for the allowed origins, plus headers that allow iframe embedding
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.has(origin)) {
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

// Trust proxy for X-Forwarded-For headers (fixes express-rate-limit warning)
app.set('trust proxy', 1);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      // Response bodies hold visitors' conversations, so log only whether it was a fallback
      if (capturedJsonResponse?.fallback) {
        logLine += " [fallback]";
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
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
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    }
  );
})();