// The real built server with its real rate limiters, receiving requests that carry the header
// chain Render and Cloudflare produce ("visitor, cloudflare-edge"). Run `npm run build` first.
// Chat messages here are the built-in "[user triggered resize]" reply, so no OpenAI call is made.
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EDGE_1 = "173.245.48.1";
const EDGE_2 = "162.158.0.9";

let nextPort = 5900 + Math.floor(Math.random() * 400);
async function startServer(env = {}) {
  const port = nextPort++;
  const preload = process.platform === "win32" ? ["--require", path.join(root, "tests", "no-reuseport.cjs")] : [];
  const child = spawn(process.execPath, [...preload, "dist/index.js"], {
    cwd: root,
    env: {
      ...process.env, NODE_ENV: "production", PORT: String(port), IRIS_TEST_DB: "pglite",
      OPENAI_API_KEY: "sk-test-not-a-real-key", OPENAI_BASE_URL: "http://127.0.0.1:9/v1",
      CHAT_LIMIT_PER_DAY: "10000", CHAT_GLOBAL_DAILY_LIMIT: "100000",
      ...env,
    },
  });
  const server = { base: `http://127.0.0.1:${port}`, logs: "", stop: () => child.kill() };
  child.stdout.on("data", c => { server.logs += c; });
  child.stderr.on("data", c => { server.logs += c; });
  for (let i = 0; i < 60; i++) {
    try { await fetch(server.base + "/api/health"); return server; } catch { await new Promise(r => setTimeout(r, 200)); }
  }
  throw new Error("server did not start:\n" + server.logs);
}

// One chat request as it would arrive through Cloudflare: "<visitor>, <edge>", optionally with
// entries the visitor forged to the left
const chain = (visitor, edge = EDGE_1, forged = "") => (forged ? `${forged}, ` : "") + `${visitor}, ${edge}`;
let counter = 0;
const chat = (server, forwarded) => fetch(server.base + "/api/chat/message", {
  method: "POST",
  headers: { "Content-Type": "application/json", ...(forwarded ? { "X-Forwarded-For": forwarded } : {}) },
  body: JSON.stringify({ sessionId: `ip-test-${++counter}`, message: "[user triggered resize]" }),
}).then(r => r.status);
const statuses = async (server, forwardedList) => { const out = []; for (const f of forwardedList) out.push(await chat(server, f)); return out; };

describe("per-visitor daily limit (3 messages each)", () => {
  let server;
  before(async () => { server = await startServer({ CHAT_LIMIT_PER_DAY: "3" }); });
  after(() => server.stop());

  test("separate visitors get separate buckets, even behind the same Cloudflare edge", async () => {
    const a = chain("198.51.100.10"), b = chain("198.51.100.11"), c = chain("198.51.100.12");
    assert.deepEqual(await statuses(server, [a, a, a, a]), [200, 200, 200, 429], "visitor A is stopped after 3");
    assert.deepEqual(await statuses(server, [b, b, b, b]), [200, 200, 200, 429], "visitor B has their own 3");
    assert.deepEqual(await statuses(server, [c]), [200], "visitor C is untouched by A and B");
  });

  test("the same visitor is one bucket, whichever Cloudflare edge carries the request", async () => {
    const v = "198.51.100.20";
    assert.deepEqual(await statuses(server, [chain(v, EDGE_1), chain(v, EDGE_2), chain(v, EDGE_1), chain(v, EDGE_2)]), [200, 200, 200, 429]);
  });

  test("a visitor cannot get a fresh bucket by forging X-Forwarded-For", async () => {
    const v = "198.51.100.30";
    assert.deepEqual(await statuses(server, [chain(v), chain(v), chain(v)]), [200, 200, 200]);
    const forged = ["6.6.6.6", "10.1.2.3", "127.0.0.1", EDGE_2, "203.0.113.5", "1.1.1.1, 2.2.2.2"].map(f => chain(v, EDGE_1, f));
    assert.deepEqual(await statuses(server, forged), forged.map(() => 429), "every forged request still counts against the real visitor");
  });

  test("forging another visitor's address does not spend that visitor's allowance", async () => {
    const attacker = "198.51.100.40", victim = "198.51.100.41";
    assert.deepEqual(await statuses(server, [chain(attacker, EDGE_1, victim), chain(attacker, EDGE_1, victim), chain(attacker, EDGE_1, victim), chain(attacker, EDGE_1, victim)]), [200, 200, 200, 429]);
    assert.deepEqual(await statuses(server, [chain(victim), chain(victim), chain(victim)]), [200, 200, 200], "the named visitor still has all 3");
  });

  test("a direct connection and an IPv6 visitor are their own buckets", async () => {
    assert.deepEqual(await statuses(server, [undefined, undefined, undefined, undefined]), [200, 200, 200, 429]);
    const v6 = chain("2001:db8::77");
    assert.deepEqual(await statuses(server, [v6, v6, v6, v6]), [200, 200, 200, 429]);
    assert.deepEqual(await statuses(server, [chain("198.51.100.50")]), [200], "IPv4 visitors are unaffected");
  });

  test("an IPv4 visitor written two ways is still one bucket", async () => {
    const v = "198.51.100.60";
    assert.deepEqual(await statuses(server, [chain(v), chain(`::ffff:${v}`), chain(v), chain(`::ffff:${v}`)]), [200, 200, 200, 429]);
  });

  test("the logs show the proxy chain is understood without recording any address", async () => {
    assert.match(server.logs, /"event":"client_ip_configured","mode":"ranges"/);
    const diagnostic = /"event":"client_ip_diagnostic"[^\n]*/.exec(server.logs)?.[0] ?? "";
    assert.ok(diagnostic, "a client_ip_diagnostic line is logged");
    assert.match(diagnostic, /"resolvedIsProxy":false/, "visitors do not resolve to proxy addresses");
    assert.match(diagnostic, /"forwardedEntries":\d/);
    assert.ok(!/198\.51\.100|173\.245|162\.158|2001:db8/.test(server.logs), "no visitor or proxy address appears in the logs");
  });
});

describe("per-visitor limit per minute", () => {
  let server;
  before(async () => { server = await startServer(); });
  after(() => server.stop());

  test("one visitor sending too fast does not slow anyone else down", async () => {
    const fast = chain("198.51.100.70"), calm = chain("198.51.100.71");
    const results = await statuses(server, Array(22).fill(fast));
    assert.equal(results.filter(s => s === 200).length, 20, "the per-minute limit is 20 messages");
    assert.deepEqual(results.slice(20), [429, 429]);
    assert.deepEqual(await statuses(server, [calm]), [200]);
  });
});

describe("the general limiter counts each visitor down one request at a time", () => {
  let server;
  before(async () => { server = await startServer(); });
  after(() => server.stop());
  const remaining = async (forwarded) => {
    const r = await fetch(server.base + "/api/anything", { headers: forwarded ? { "X-Forwarded-For": forwarded } : {} });
    await r.arrayBuffer();
    return Number(r.headers.get("ratelimit-remaining"));
  };

  test("a steady countdown for one visitor across edges and forged headers, and a separate one for another", async () => {
    const v = "198.51.100.80", other = "198.51.100.81";
    const seen = [
      await remaining(chain(v, EDGE_1)), await remaining(chain(v, EDGE_2)), await remaining(chain(v, EDGE_1, "6.6.6.6")),
      await remaining(chain(v, EDGE_2, "10.0.0.9")), await remaining(chain(v, EDGE_1, "1.1.1.1, 2.2.2.2")), await remaining(chain(v, EDGE_1)),
    ];
    assert.deepEqual(seen, [59, 58, 57, 56, 55, 54]);
    assert.equal(await remaining(chain(other, EDGE_1)), 59, "another visitor starts with a full bucket");
    assert.equal(await remaining(chain(v, EDGE_2)), 53, "and the first visitor carries on counting down");
  });
});

describe("the global daily limit stays global", () => {
  let server;
  before(async () => { server = await startServer({ CHAT_GLOBAL_DAILY_LIMIT: "4" }); });
  after(() => server.stop());

  test("it counts every visitor together and stops them all", async () => {
    const visitors = [1, 2, 3, 4, 5, 6].map(n => chain(`198.51.100.${90 + n}`));
    const results = await statuses(server, visitors);
    assert.deepEqual(results, [200, 200, 200, 200, 429, 429], "the 5th visitor is refused although they never sent a message before");
    const body = await fetch(server.base + "/api/chat/message", {
      method: "POST", headers: { "Content-Type": "application/json", "X-Forwarded-For": chain("198.51.100.99") },
      body: JSON.stringify({ sessionId: "ip-global", message: "hi" }),
    }).then(r => r.json());
    assert.match(body.response, /maxed out for today/);
  });
});

describe("TRUSTED_PROXY_HOPS fallback", () => {
  test("is honored: one hop reproduces the old shared-bucket behavior, two hops is correct", async () => {
    const one = await startServer({ CHAT_LIMIT_PER_DAY: "2", TRUSTED_PROXY_HOPS: "1" });
    try {
      assert.deepEqual(await statuses(one, [chain("198.51.100.101"), chain("198.51.100.102"), chain("198.51.100.103")]), [200, 200, 429],
        "with one hop unrelated visitors share the Cloudflare edge's bucket");
      assert.match(one.logs, /"event":"client_ip_configured","mode":"hops","hops":1/);
    } finally { one.stop(); }
    const two = await startServer({ CHAT_LIMIT_PER_DAY: "2", TRUSTED_PROXY_HOPS: "2" });
    try {
      assert.deepEqual(await statuses(two, [chain("198.51.100.101"), chain("198.51.100.102"), chain("198.51.100.103")]), [200, 200, 200]);
      assert.deepEqual(await statuses(two, [chain("198.51.100.101", EDGE_1, "6.6.6.6"), chain("198.51.100.101"), chain("198.51.100.101")]), [200, 429, 429], "forged entries are still ignored with two hops");
    } finally { two.stop(); }
  });
});

// An emulation of production: every request passes through something that appends the real
// connecting address (Cloudflare's job) and then a Cloudflare edge address that changes from one
// request to the next (what Render's proxy adds), exactly as seen on the live service.
import http from "node:http";
import { run as runVerification } from "../scripts/verify-client-ip.mjs";

function startChainEmulator(targetBase, visitor) {
  const edges = [EDGE_1, EDGE_2, "104.16.5.5", "172.64.9.9", "108.162.200.3"];
  let n = 0;
  const target = new URL(targetBase);
  const proxy = http.createServer((req, res) => {
    const forwarded = [req.headers["x-forwarded-for"], visitor, edges[n++ % edges.length]].filter(Boolean).join(", ");
    const up = http.request({ host: target.hostname, port: target.port, path: req.url, method: req.method, headers: { ...req.headers, "x-forwarded-for": forwarded } }, r => {
      res.writeHead(r.statusCode, r.headers); r.pipe(res);
    });
    req.pipe(up);
  });
  return new Promise(resolve => proxy.listen(0, "127.0.0.1", () => resolve({ base: `http://127.0.0.1:${proxy.address().port}`, close: () => proxy.close() })));
}

describe("the production verification script, against an emulated Render + Cloudflare chain", () => {
  async function verdictFor(env) {
    const server = await startServer(env);
    const emulator = await startChainEmulator(server.base, "198.51.100.77");
    const originalLog = console.log; console.log = () => {};
    try { return await runVerification(emulator.base); } finally { console.log = originalLog; emulator.close(); server.stop(); }
  }
  test("the fix passes: one steady countdown although the edge changes every request and headers are forged", async () => {
    const result = await verdictFor({});
    assert.equal(result.verdict, "PASS", result.reason);
    assert.deepEqual(result.values, [59, 58, 57, 56, 55, 54, 53, 52, 51]);
  });
  test("two fixed hops also passes", async () => {
    assert.equal((await verdictFor({ TRUSTED_PROXY_HOPS: "2" })).verdict, "PASS");
  });
  test("the old one-hop setting fails, reproducing what the live service showed", async () => {
    const result = await verdictFor({ TRUSTED_PROXY_HOPS: "1" });
    assert.equal(result.verdict, "FAIL", "one visitor must not be split across the rotating edge addresses and still look healthy");
  });
});
