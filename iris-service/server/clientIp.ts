// Who is the visitor? Rate limits are per visitor, so this decides who shares a bucket.
//
// On Render a request reaches the app as   visitor -> Cloudflare -> Render's proxy -> app,
// and every proxy appends to X-Forwarded-For. Two things go wrong if this is guessed:
//
//  - Trusting too few hops makes a proxy's address "the visitor". With one hop that is the
//    Cloudflare edge address, which changes from request to request, so one visitor got many
//    buckets and unrelated visitors shared one.
//  - Trusting too many hops, or the left of the header, lets a visitor type their own address
//    into X-Forwarded-For and get a fresh bucket for every request.
//
// So no count is trusted. Express walks the header from the right and stops at the first
// address that is not a trusted proxy; that address is the visitor. The trusted proxies are the
// immediate peer (Render's proxy) plus Cloudflare's published edge ranges and private
// addresses. Entries a visitor adds on the left are never reached, because their real address
// stops the walk first. Whatever the chain length, the result is the same.
//
// If this ever proves wrong on Render, set TRUSTED_PROXY_HOPS (for example 2) to fall back to a
// fixed count without a code change. See docs/RATE-LIMITS.md for how to verify.
import net from "node:net";
import type { Express, NextFunction, Request, Response } from "express";
import { log, logThrottled } from "./logger";

// https://www.cloudflare.com/ips/  (fetched 2026-10-31). Add newer ranges with TRUSTED_PROXY_RANGES.
export const CLOUDFLARE_RANGES = [
  "173.245.48.0/20", "103.21.244.0/22", "103.22.200.0/22", "103.31.4.0/22", "141.101.64.0/18",
  "108.162.192.0/18", "190.93.240.0/20", "188.114.96.0/20", "197.234.240.0/22", "198.41.128.0/17",
  "162.158.0.0/15", "104.16.0.0/13", "104.24.0.0/14", "172.64.0.0/13", "131.0.72.0/22",
  "2400:cb00::/32", "2606:4700::/32", "2803:f800::/32", "2405:b500::/32", "2405:8100::/32",
  "2a06:98c0::/29", "2c0f:f248::/32",
];

// Internal addresses between Render's proxies (never a real visitor on the public internet)
export const PRIVATE_RANGES = [
  "10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16", "100.64.0.0/10", "169.254.0.0/16", "127.0.0.0/8",
  "::1/128", "fc00::/7", "fe80::/10",
];

function normalize(address: string): string {
  // Dual-stack sockets report IPv4 as ::ffff:a.b.c.d
  return address.startsWith("::ffff:") && net.isIPv4(address.slice(7)) ? address.slice(7) : address;
}

function buildList(ranges: string[], onInvalid?: (range: string) => void): net.BlockList {
  const list = new net.BlockList();
  for (const range of ranges) {
    const [address, prefix] = range.trim().split("/");
    const family = net.isIPv4(address) ? "ipv4" : net.isIPv6(address) ? "ipv6" : null;
    const bits = Number(prefix);
    if (!family || !Number.isInteger(bits) || bits < 0 || bits > (family === "ipv4" ? 32 : 128)) {
      onInvalid?.(range);
      continue;
    }
    list.addSubnet(address, bits, family);
  }
  return list;
}

export function isInRanges(list: net.BlockList, address: string): boolean {
  const clean = normalize(address);
  const family = net.isIPv4(clean) ? "ipv4" : net.isIPv6(clean) ? "ipv6" : null;
  return family ? list.check(clean, family) : false;
}

export interface ProxyTrust {
  mode: "ranges" | "hops";
  setting: number | ((address: string, hop: number) => boolean);
  rangeCount: number;
  hops?: number;
  // True if this address is a proxy we trust (used to spot a mis-resolved visitor)
  isTrustedProxy: (address: string) => boolean;
}

export function resolveProxyTrust(env: NodeJS.ProcessEnv = process.env): ProxyTrust {
  const hopsRaw = env.TRUSTED_PROXY_HOPS;
  const extra = (env.TRUSTED_PROXY_RANGES || "").split(",").map(s => s.trim()).filter(Boolean);
  const list = buildList([...CLOUDFLARE_RANGES, ...PRIVATE_RANGES, ...extra], range =>
    log("warn", "trusted_proxy_range_ignored", { range }));
  const rangeCount = CLOUDFLARE_RANGES.length + PRIVATE_RANGES.length + extra.length;
  const isTrustedProxy = (address: string) => isInRanges(list, address);

  if (hopsRaw !== undefined && hopsRaw !== "") {
    const hops = Number(hopsRaw);
    if (Number.isInteger(hops) && hops >= 0 && hops <= 5) {
      return { mode: "hops", setting: hops, hops, rangeCount, isTrustedProxy };
    }
    log("warn", "trusted_proxy_hops_ignored", { value: hopsRaw });
  }
  return {
    mode: "ranges",
    // hop 0 is the connection straight to this app (Render's proxy): always a proxy
    setting: (address, hop) => hop === 0 || isTrustedProxy(address),
    rangeCount,
    isTrustedProxy,
  };
}

// The same visitor must always get the same limit key. Express returns an address exactly as it
// appeared, so an IPv4 visitor can show up as "198.51.100.10" or "::ffff:198.51.100.10"
// depending on which proxy wrote it. Every limiter reads req.ip, so settle it here, once.
function normalizeClientIp(req: Request, _res: Response, next: NextFunction): void {
  const ip = req.ip;
  if (ip && normalize(ip) !== ip) Object.defineProperty(req, "ip", { value: normalize(ip), configurable: true, writable: true });
  next();
}

export function configureClientIp(app: Express, env: NodeJS.ProcessEnv = process.env): ProxyTrust {
  const trust = resolveProxyTrust(env);
  app.set("trust proxy", trust.setting);
  app.use(normalizeClientIp);
  log("info", "client_ip_configured", { mode: trust.mode, hops: trust.hops, trustedRanges: trust.rangeCount });
  return trust;
}

// Logged at most every 6 hours, and never an address. It shows whether the proxy chain looks as
// configured: a visitor that resolves to a proxy range means the chain is not what we assumed.
export function logClientIpDiagnostic(req: Request, trust: ProxyTrust): void {
  const forwarded = String(req.headers["x-forwarded-for"] ?? "");
  const resolved = req.ip ?? "";
  logThrottled("info", "client_ip_diagnostic", {
    mode: trust.mode,
    forwardedEntries: forwarded ? forwarded.split(",").length : 0,
    hasCfConnectingIp: Boolean(req.headers["cf-connecting-ip"]),
    resolvedFamily: net.isIPv6(normalize(resolved)) ? "ipv6" : net.isIPv4(normalize(resolved)) ? "ipv4" : "unknown",
    // true means the "visitor" is really a proxy: every such visitor would share one limit
    resolvedIsProxy: resolved ? trust.isTrustedProxy(resolved) : false,
  }, 6 * 60 * 60 * 1000);
}
