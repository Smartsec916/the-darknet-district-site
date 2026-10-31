// Verifies a Firebase ID token on the server, so "who is this?" is never taken from the browser's word.
//
// The Darknet District's sites and games all sign in with ONE Firebase project. A signed-in browser holds
// a short-lived ID token (a JWT signed by Google). This checks that token the way Firebase's Admin SDK
// does, using only Google's published public keys, so the Iris service needs no secret or service
// account for it:
//   - the signature is RS256 and matches one of Google's current keys,
//   - the token was issued for this Firebase project (audience and issuer),
//   - it has not expired and was not issued in the future.
// Anything that fails any check is simply "not signed in": the visitor is treated as anonymous.
//
// One thing the Admin SDK can additionally do that this cannot: ask Google whether the account's tokens
// were revoked. A token is valid for up to an hour, so a revoked or deleted account keeps working until
// its current token expires. For the administrator controls, access is also limited to an exact list of
// account ids (IRIS_ADMIN_UIDS), which is the control that matters.
import crypto from "crypto";
import { logThrottled } from "./logger";

const DEFAULT_PROJECT_ID = "the-darknet-district-71873";
const DEFAULT_JWKS_URL = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
const MAX_TOKEN_LENGTH = 8192;
const CLOCK_SKEW_SECONDS = 300;

export const firebaseProjectId = () => process.env.FIREBASE_PROJECT_ID || DEFAULT_PROJECT_ID;
// Overridable only so tests can run against a local key server
const jwksUrl = () => process.env.IRIS_FIREBASE_JWKS_URL || DEFAULT_JWKS_URL;

export interface VerifiedUser {
  uid: string;
  provider: string;       // google.com, password, anonymous, ...
  anonymous: boolean;
  name?: string;
  email?: string;
  emailVerified: boolean;
  expiresAt: number;      // epoch seconds
}

interface KeyCache { keys: Map<string, crypto.KeyObject>; expires: number; fetchedAt: number }
let cache: KeyCache | null = null;
let inflight: Promise<KeyCache | null> | null = null;

async function fetchKeys(): Promise<KeyCache | null> {
  try {
    const response = await fetch(jwksUrl(), { signal: AbortSignal.timeout(5000), headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`key server answered ${response.status}`);
    const body = (await response.json()) as { keys?: Array<Record<string, string>> };
    const keys = new Map<string, crypto.KeyObject>();
    for (const jwk of body.keys ?? []) {
      if (jwk.kty !== "RSA" || !jwk.kid) continue;
      try { keys.set(jwk.kid, crypto.createPublicKey({ key: jwk as any, format: "jwk" })); } catch { /* skip a bad key */ }
    }
    if (!keys.size) throw new Error("no usable keys");
    const maxAge = /max-age=(\d+)/.exec(response.headers.get("cache-control") ?? "");
    const ttl = Math.min(Math.max(maxAge ? Number(maxAge[1]) : 3600, 300), 86_400) * 1000;
    return { keys, fetchedAt: Date.now(), expires: Date.now() + ttl };
  } catch (err) {
    logThrottled("warn", "firebase_keys_unavailable", { error: (err as Error).message?.slice(0, 100) }, 60_000);
    return null;
  }
}

async function keyFor(kid: string, forceRefresh = false): Promise<crypto.KeyObject | null> {
  const stale = !cache || cache.expires < Date.now();
  // An unknown key id can mean Google rotated keys: refresh, but never more than once a minute
  const unknownKid = cache && !cache.keys.has(kid) && Date.now() - cache.fetchedAt > 60_000;
  if (stale || unknownKid || forceRefresh) {
    inflight ??= fetchKeys().finally(() => { inflight = null; });
    const fresh = await inflight;
    if (fresh) cache = fresh;
  }
  return cache?.keys.get(kid) ?? null;
}

export function resetFirebaseKeysForTests(): void { cache = null; inflight = null; }

function decodeJson(part: string): Record<string, any> | null {
  try {
    const value = JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
    return value && typeof value === "object" ? value : null;
  } catch { return null; }
}

export async function verifyFirebaseToken(token: string, nowMs = Date.now()): Promise<VerifiedUser | null> {
  if (typeof token !== "string" || !token || token.length > MAX_TOKEN_LENGTH) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const header = decodeJson(parts[0]);
  const payload = decodeJson(parts[1]);
  if (!header || !payload) return null;
  // Only RS256: refuses "none" and algorithm-confusion tricks
  if (header.alg !== "RS256" || typeof header.kid !== "string") return null;

  const key = await keyFor(header.kid);
  if (!key) return null;
  let signatureOk = false;
  try {
    signatureOk = crypto.verify("RSA-SHA256", Buffer.from(`${parts[0]}.${parts[1]}`), key, Buffer.from(parts[2], "base64url"));
  } catch { return null; }
  if (!signatureOk) return null;

  const project = firebaseProjectId();
  const now = Math.floor(nowMs / 1000);
  if (payload.aud !== project) return null;
  if (payload.iss !== `https://securetoken.google.com/${project}`) return null;
  if (typeof payload.sub !== "string" || !payload.sub || payload.sub.length > 128) return null;
  if (typeof payload.exp !== "number" || payload.exp <= now) return null;
  if (typeof payload.iat !== "number" || payload.iat > now + CLOCK_SKEW_SECONDS) return null;
  if (typeof payload.auth_time !== "number" || payload.auth_time > now + CLOCK_SKEW_SECONDS) return null;

  const provider = typeof payload.firebase?.sign_in_provider === "string" ? payload.firebase.sign_in_provider : "unknown";
  return {
    uid: payload.sub,
    provider,
    anonymous: provider === "anonymous",
    name: typeof payload.name === "string" ? payload.name.slice(0, 60) : undefined,
    email: typeof payload.email === "string" ? payload.email.slice(0, 120) : undefined,
    emailVerified: payload.email_verified === true,
    expiresAt: payload.exp,
  };
}
