// Starts the built Iris server (dist/index.js) as a child process for tests that need the real thing.
// Run `npm run build` first.
//
// Why this exists: the same start-up code was copied into two test files with a fixed 10-12 second
// polling window. With every test file running at once (node:test's default is one per CPU), the
// machine was so busy that a server which starts in about a second when idle sometimes printed nothing
// for 10+ seconds, and a whole file failed with "server did not start". This helper waits for the
// server to answer (with a generous deadline), stops waiting the moment the child exits, reports why,
// picks a port the OS says is free instead of a random one in a small range, and always waits for the
// child to exit when stopped so nothing is left running.
import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

// A port that was free a moment ago. (Binding to 0 and reading it back; the tiny gap before the server
// binds it is covered by the exit check below, which reports "address in use" instead of timing out.)
export function freePort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });
}

export async function startBuiltServer(env = {}, { readyPath = "/api/health", deadlineMs = 60_000 } = {}) {
  const port = await freePort();
  // Windows rejects the reusePort listen option that Linux hosts accept
  const preload = process.platform === "win32" ? ["--require", path.join(root, "tests", "no-reuseport.cjs")] : [];
  const started = Date.now();
  const child = spawn(process.execPath, [...preload, "dist/index.js"], {
    cwd: root,
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: String(port),
      OPENAI_API_KEY: "sk-test-not-a-real-key",
      OPENAI_BASE_URL: "http://127.0.0.1:9/v1",
      ...env,
    },
  });
  const server = {
    base: `http://127.0.0.1:${port}`,
    port,
    logs: "",
    startupMs: 0,
    exited: null,
    // Stops the server and resolves once the process is really gone.
    stop: () => new Promise(resolve => {
      if (child.exitCode !== null || child.signalCode !== null) return resolve();
      child.once("exit", () => resolve());
      child.kill();
    }),
  };
  child.stdout.on("data", chunk => { server.logs += chunk; });
  child.stderr.on("data", chunk => { server.logs += chunk; });
  const gone = new Promise(resolve => child.once("exit", (code, signal) => { server.exited = { code, signal }; resolve(); }));
  child.once("error", error => { server.logs += `\n[spawn error] ${error.message}`; });

  while (Date.now() - started < deadlineMs) {
    if (server.exited) {
      throw new Error(`server exited during start-up (code ${server.exited.code}, signal ${server.exited.signal}):\n${server.logs}`);
    }
    try {
      await fetch(server.base + readyPath, { signal: AbortSignal.timeout(1500) });
      server.startupMs = Date.now() - started;
      // A start-up this slow means the machine is oversubscribed, not that the server is broken: say so.
      if (server.startupMs > 5000) console.warn(`[tests] server on :${port} took ${server.startupMs} ms to answer (machine busy?)`);
      return server;
    } catch {
      await Promise.race([gone, new Promise(resolve => setTimeout(resolve, 100))]);
    }
  }
  await server.stop();
  throw new Error(`server did not answer ${readyPath} within ${deadlineMs} ms (still running, so not a crash):\n${server.logs || "(no output at all)"}`);
}
