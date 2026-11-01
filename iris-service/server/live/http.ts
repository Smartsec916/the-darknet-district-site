// Server-side requests to the public data providers. Nothing here is ever sent to the browser or the model raw.
//   - only https, only the hosts listed below, redirects followed only to another listed host (at most 2 hops)
//   - a timeout and a size cap on every response
//   - no cookies and no credentials: none of these providers needs a key
// `net.fetch` is the one seam the tests replace; no automated test reaches the internet.

export const USER_AGENT = "TheDarknetDistrict-Iris/1.0 (+https://thedarknetdistrict.com)";

export const ALLOWED_HOSTS = new Set([
  "nominatim.openstreetmap.org",
  "api.met.no",
  "api.weather.gov",
  "earthquake.usgs.gov",
  "feeds.bbci.co.uk",
  "www.theguardian.com",
  "feeds.npr.org",
  "www.nasa.gov",
  "www.cisa.gov",
  "www.bleepingcomputer.com",
  "feeds.arstechnica.com",
]);

export type FailureKind = "blocked" | "timeout" | "http" | "too_large" | "network" | "invalid";

export class LiveError extends Error {
  constructor(public kind: FailureKind, message: string, public status?: number) { super(message); this.name = "LiveError"; }
}

export const net: { fetch: (url: string, init: RequestInit) => Promise<Response> } = {
  fetch: (url, init) => fetch(url, init),
};

export interface GetOptions { accept?: string; timeoutMs?: number; maxBytes?: number }

function checkUrl(raw: string): URL {
  let url: URL;
  try { url = new URL(raw); } catch { throw new LiveError("blocked", "not a URL"); }
  if (url.protocol !== "https:" || url.username || url.password || !ALLOWED_HOSTS.has(url.hostname)) throw new LiveError("blocked", `host not allowed: ${url.hostname}`);
  return url;
}

async function readCapped(response: Response, maxBytes: number): Promise<string> {
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) throw new LiveError("too_large", "response too large");
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) { try { await reader.cancel(); } catch { /* already closed */ } throw new LiveError("too_large", "response too large"); }
    chunks.push(value);
  }
  return new TextDecoder("utf-8").decode(Buffer.concat(chunks));
}

export async function getText(rawUrl: string, options: GetOptions = {}): Promise<string> {
  const timeoutMs = options.timeoutMs ?? 5000, maxBytes = options.maxBytes ?? 1_500_000;
  let url = checkUrl(rawUrl);
  const deadline = Date.now() + timeoutMs;
  for (let hop = 0; hop <= 2; hop++) {
    const left = deadline - Date.now();
    if (left <= 0) throw new LiveError("timeout", "timed out");
    let response: Response;
    try {
      response = await net.fetch(url.toString(), {
        method: "GET", redirect: "manual", credentials: "omit", signal: AbortSignal.timeout(left),
        headers: { "User-Agent": USER_AGENT, Accept: options.accept ?? "*/*" },
      });
    } catch (error: any) {
      if (error?.name === "TimeoutError" || error?.name === "AbortError") throw new LiveError("timeout", "timed out");
      throw new LiveError("network", "network error");
    }
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) throw new LiveError("http", "redirect without a location", response.status);
      url = checkUrl(new URL(location, url).toString());
      continue;
    }
    if (!response.ok) throw new LiveError("http", `provider answered ${response.status}`, response.status);
    try { return await readCapped(response, maxBytes); }
    catch (error) { if (error instanceof LiveError) throw error; throw new LiveError("network", "read failed"); }
  }
  throw new LiveError("http", "too many redirects");
}

export async function getJson<T = unknown>(rawUrl: string, options: GetOptions = {}): Promise<T> {
  const text = await getText(rawUrl, { accept: "application/json", ...options });
  try { return JSON.parse(text) as T; } catch { throw new LiveError("invalid", "not JSON"); }
}

// Text from a provider is data. It is cleaned before it can reach the model: control characters removed, whitespace
// collapsed, length bounded.
// C0/C1 control characters, line and paragraph separators and bidirectional overrides
const CONTROL = new RegExp("[\u0000-\u0008\u000B-\u001F\u007F\u2028\u2029\u202A-\u202E\u2066-\u2069]", "g");
export function clean(value: unknown, max = 300): string {
  if (typeof value !== "string") return "";
  return value.replace(CONTROL, " ").replace(/\s+/g, " ").trim().slice(0, max);
}
