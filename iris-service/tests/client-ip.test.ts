// How the service decides who the visitor is behind Render's proxy and Cloudflare.
// Every request here arrives from 127.0.0.1, standing in for Render's proxy: the one connection
// straight to the app, which is always trusted. The X-Forwarded-For header is what the chain
// "visitor -> Cloudflare -> Render's proxy" would have built.
import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import express from "express";

const { configureClientIp, resolveProxyTrust, CLOUDFLARE_RANGES, PRIVATE_RANGES } = await import("../server/clientIp");
const verify = await import("../scripts/verify-client-ip.mjs");

const VISITOR = "198.51.100.10";
const OTHER_VISITOR = "198.51.100.11";
const EDGE_1 = "173.245.48.1";
const EDGE_2 = "162.158.0.9";

function appWith(env: Record<string, string | undefined>) {
  const app = express();
  configureClientIp(app, env as NodeJS.ProcessEnv);
  app.get("/ip", (req, res) => res.json({ ip: req.ip }));
  return app;
}

function servers() {
  const running: Server[] = [];
  return {
    async start(env: Record<string, string | undefined> = {}) {
      const server = await new Promise<Server>(resolve => { const s = appWith(env).listen(0, "127.0.0.1", () => resolve(s)); });
      running.push(server);
      const port = (server.address() as AddressInfo).port;
      return (forwarded?: string): Promise<string> => new Promise((resolve, reject) => {
        http.get({ host: "127.0.0.1", port, path: "/ip", headers: forwarded === undefined ? {} : { "x-forwarded-for": forwarded } }, res => {
          let body = ""; res.on("data", c => { body += c; }); res.on("end", () => resolve(JSON.parse(body).ip));
        }).on("error", reject);
      });
    },
    stopAll() { running.forEach(s => s.close()); },
  };
}

const fleet = servers();
let whoIs: (forwarded?: string) => Promise<string>;
before(async () => { whoIs = await fleet.start(); });
after(() => fleet.stopAll());

test("the visitor is the first address that is not a trusted proxy, counting from the right", async () => {
  assert.equal(await whoIs(`${VISITOR}, ${EDGE_1}`), VISITOR);
  assert.equal(await whoIs(`${VISITOR}, ${EDGE_2}`), VISITOR, "a different Cloudflare edge is still the same visitor");
});

test("the chain length does not matter", async () => {
  assert.equal(await whoIs(VISITOR), VISITOR, "Cloudflare entry missing");
  assert.equal(await whoIs(`${VISITOR}, ${EDGE_1}, 10.1.2.3`), VISITOR, "an extra internal proxy");
  assert.equal(await whoIs(`${VISITOR}, ${EDGE_1}, ${EDGE_2}, 10.9.9.9, 10.8.8.8`), VISITOR, "a long chain of proxies");
});

test("entries a visitor adds to X-Forwarded-For are never trusted", async () => {
  const fakes = ["6.6.6.6", "203.0.113.99", "10.1.2.3", "127.0.0.1", EDGE_2, "172.64.5.5", "::1", "2001:db8::bad"];
  for (const fake of fakes) {
    assert.equal(await whoIs(`${fake}, ${VISITOR}, ${EDGE_1}`), VISITOR, `fake leading entry ${fake}`);
  }
  assert.equal(await whoIs(`1.1.1.1, 2.2.2.2, 3.3.3.3, ${VISITOR}, ${EDGE_1}`), VISITOR, "several fake entries");
  assert.equal(await whoIs(`${OTHER_VISITOR}, ${VISITOR}, ${EDGE_1}`), VISITOR, "naming another real visitor does not become that visitor");
});

test("different visitors resolve differently, even behind the same Cloudflare edge", async () => {
  assert.notEqual(await whoIs(`${VISITOR}, ${EDGE_1}`), await whoIs(`${OTHER_VISITOR}, ${EDGE_1}`));
});

test("a connection with no forwarding header is its own visitor", async () => {
  assert.match(await whoIs(), /^(::ffff:)?127\.0\.0\.1$/);
});

test("IPv6 visitors and IPv4-mapped addresses are handled", async () => {
  assert.equal(await whoIs(`2001:db8::7, ${EDGE_1}`), "2001:db8::7");
  assert.equal(await whoIs(`2606:4700::1, 2001:db8::7, 2400:cb00::1`), "2001:db8::7", "IPv6 Cloudflare edges are trusted");
  assert.equal(await whoIs(`::ffff:${VISITOR}, ::ffff:${EDGE_1}`), VISITOR, "mapped addresses are unwrapped");
});

test("a Cloudflare range we do not know yet fails safe, and can be added without a code change", async () => {
  const newEdge = "203.0.113.77"; // pretend this is a brand-new Cloudflare range
  assert.equal(await whoIs(`${VISITOR}, ${newEdge}`), newEdge, "unknown proxy is treated as the visitor: limits merge, never open up");
  const patched = await fleet.start({ TRUSTED_PROXY_RANGES: "203.0.113.0/24" });
  assert.equal(await patched(`${VISITOR}, ${newEdge}`), VISITOR);
  const junk = await fleet.start({ TRUSTED_PROXY_RANGES: "not-a-range, 203.0.113.0/99, 203.0.113.0/24" });
  assert.equal(await junk(`${VISITOR}, ${newEdge}`), VISITOR, "invalid entries are ignored, valid ones still apply");
});

test("TRUSTED_PROXY_HOPS is an explicit fallback to a fixed count", async () => {
  const two = await fleet.start({ TRUSTED_PROXY_HOPS: "2" });
  assert.equal(await two(`${VISITOR}, ${EDGE_1}`), VISITOR);
  assert.equal(await two(`6.6.6.6, ${VISITOR}, ${EDGE_1}`), VISITOR, "forged entries still ignored with the right count");
  const one = await fleet.start({ TRUSTED_PROXY_HOPS: "1" });
  assert.equal(await one(`${VISITOR}, ${EDGE_1}`), EDGE_1, "one hop is the original bug: the Cloudflare edge becomes the visitor");
  for (const bad of ["abc", "-1", "9", "1.5"]) {
    const ignored = await fleet.start({ TRUSTED_PROXY_HOPS: bad });
    assert.equal(await ignored(`${VISITOR}, ${EDGE_1}`), VISITOR, `invalid TRUSTED_PROXY_HOPS=${bad} falls back to the safe default`);
  }
});

test("the trusted ranges are what we think they are", () => {
  const trust = resolveProxyTrust({} as NodeJS.ProcessEnv);
  assert.equal(trust.mode, "ranges");
  for (const ok of [EDGE_1, EDGE_2, "104.16.0.1", "172.64.1.1", "2606:4700::6810:1", "10.0.0.1", "172.20.1.1", "192.168.1.1", "127.0.0.1", "::1"]) {
    assert.equal(trust.isTrustedProxy(ok), true, `${ok} should be a trusted proxy`);
  }
  for (const no of [VISITOR, "8.8.8.8", "1.1.1.1", "172.15.0.1", "172.32.0.1", "104.15.255.255", "2001:db8::1", "not-an-ip"]) {
    assert.equal(trust.isTrustedProxy(no), false, `${no} must not be a trusted proxy`);
  }
  assert.ok(CLOUDFLARE_RANGES.length >= 22 && PRIVATE_RANGES.length >= 9);
});

test("the production verification script judges bucket behavior correctly", () => {
  const { judge } = verify;
  assert.equal(judge([59, 58, 57, 56, 55, 54, 53, 52]).verdict, "PASS", "a steady countdown");
  assert.equal(judge([59, 59, 58, 57, 59, 56]).verdict, "FAIL", "buckets that change between requests (the old bug)");
  assert.equal(judge([59, 58, 57, 59, 58, 57]).verdict, "FAIL", "a forged header gives a fresh bucket");
  assert.equal(judge([59, 56, 52, 51, 50, 49]).verdict, "WARN", "the bucket is shared with other visitors");
  assert.equal(judge([]).verdict, "FAIL", "no rate-limit headers at all");
});
