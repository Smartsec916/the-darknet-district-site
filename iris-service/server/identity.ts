// Who is talking to Iris, decided on the server.
//
//   anonymous       no sign-in. Remembered by the random id the browser keeps (clientId), exactly as before.
//   user            signed in with a Firebase account (never the administrator list). Remembered under the
//                   account, in a memory of its own; an anonymous history joins it only when the person asks.
//   owner           the administrator, signed in, in Owner mode: the verified Admin character with the
//                   owner's own relationship memory.
//   test-returning  the administrator in Returning Visitor mode: a separate, persistent test visitor.
//   test-new        the administrator in New Visitor mode: a first-time visitor who is not remembered.
//
// The administrator list is IRIS_ADMIN_UIDS: exact Firebase account ids set on the server. An email
// address, a name, or anything the browser sends can never grant it, and a simulated visitor never
// holds administrator rights (the chat path only ever reads the identity, and the control panel
// checks the real account on every call). Every identity has its own memory key, so switching modes
// never merges or erases anything.
import type { Request } from "express";
import { dbQuery } from "./db";
import { ensureSchema } from "./migrate";
import { logError } from "./logger";
import { verifyFirebaseToken, type VerifiedUser } from "./firebaseAuth";

export type OwnerMode = "owner" | "new" | "returning";
export type IdentityKind = "anonymous" | "user" | "owner" | "test-new" | "test-returning";

export interface VisitorIdentity {
  kind: IdentityKind;
  // Where this identity's relationship memory is kept; undefined means nothing is remembered
  key: string | undefined;
  uid?: string;
  // Changes when the administrator resets a simulated visitor, so a running chat starts over
  tag: string;
}

export const OWNER_MODES: readonly OwnerMode[] = ["owner", "new", "returning"];
export const isOwnerMode = (value: unknown): value is OwnerMode => typeof value === "string" && (OWNER_MODES as readonly string[]).includes(value);

export function adminUids(): Set<string> {
  return new Set((process.env.IRIS_ADMIN_UIDS ?? "").split(/[\s,]+/).map(s => s.trim()).filter(Boolean));
}

// A signed-in, non-anonymous account whose exact id is on the list
export function isAdminUser(user: VerifiedUser | null): boolean {
  return Boolean(user && !user.anonymous && adminUids().has(user.uid));
}

export function bearerToken(req: Request): string {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : "";
}

// null when there is no valid sign-in; never throws
export async function authenticate(req: Request): Promise<VerifiedUser | null> {
  const token = bearerToken(req);
  if (!token) return null;
  try { return await verifyFirebaseToken(token); } catch { return null; }
}

// -------------------------------------------------------------- the administrator's saved mode

export interface OwnerState { uid: string; mode: OwnerMode; newNonce: number; returningNonce: number }

const stateCache = new Map<string, { state: OwnerState; at: number }>();
const STATE_TTL_MS = 5_000;

export const resetOwnerStateCacheForTests = () => stateCache.clear();

export async function getOwnerState(uid: string): Promise<OwnerState> {
  const cached = stateCache.get(uid);
  if (cached && Date.now() - cached.at < STATE_TTL_MS) return cached.state;
  let state: OwnerState = { uid, mode: "owner", newNonce: 0, returningNonce: 0 };
  try {
    if (await ensureSchema()) {
      const { rows } = await dbQuery(`SELECT mode, new_nonce, returning_nonce FROM iris_owner_state WHERE uid = $1`, [uid]);
      if (rows.length) {
        state = {
          uid, mode: isOwnerMode(rows[0].mode) ? rows[0].mode : "owner",
          newNonce: Number(rows[0].new_nonce) || 0, returningNonce: Number(rows[0].returning_nonce) || 0,
        };
      }
    }
  } catch (err) {
    logError("owner_state_load_failed", err);
  }
  stateCache.set(uid, { state, at: Date.now() });
  return state;
}

async function saveOwnerState(state: OwnerState): Promise<boolean> {
  try {
    if (!(await ensureSchema())) return false;
    await dbQuery(
      `INSERT INTO iris_owner_state (uid, mode, new_nonce, returning_nonce, updated_at) VALUES ($1, $2, $3, $4, now())
       ON CONFLICT (uid) DO UPDATE SET mode = EXCLUDED.mode, new_nonce = EXCLUDED.new_nonce,
         returning_nonce = EXCLUDED.returning_nonce, updated_at = now()`,
      [state.uid, state.mode, state.newNonce, state.returningNonce],
    );
    stateCache.set(state.uid, { state, at: Date.now() });
    return true;
  } catch (err) {
    logError("owner_state_save_failed", err);
    return false;
  }
}

export async function setOwnerMode(uid: string, mode: OwnerMode): Promise<OwnerState | null> {
  const state = { ...(await getOwnerState(uid)), mode };
  return (await saveOwnerState(state)) ? state : null;
}

// The key a simulated returning visitor's memory is kept under (a reset moves to a new key; the old row is erased by the caller)
export const returningKey = (uid: string, nonce: number) => `test-returning:${uid}:${nonce}`;
export const ownerKey = (uid: string) => `owner:${uid}`;
export const userKey = (uid: string) => `user:${uid}`;

export async function resetSimulated(uid: string, which: "new" | "returning"): Promise<{ state: OwnerState; erasedKey?: string } | null> {
  const before = await getOwnerState(uid);
  const state = { ...before };
  let erasedKey: string | undefined;
  if (which === "new") state.newNonce += 1;
  else { erasedKey = returningKey(uid, before.returningNonce); state.returningNonce += 1; }
  return (await saveOwnerState(state)) ? { state, erasedKey } : null;
}

// -------------------------------------------------------------- the decision

const cleanClientId = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const id = value.trim().slice(0, 128);
  // Reserved prefixes belong to server-made identities; a browser cannot claim one
  return id && !/^(user|owner|test-new|test-returning):/.test(id) ? id : undefined;
};

export async function resolveIdentity(req: Request, clientIdFromBody?: unknown): Promise<VisitorIdentity> {
  const user = await authenticate(req);
  const clientId = cleanClientId(clientIdFromBody) ?? cleanClientId(req.headers["x-client-id"]);

  if (!user) return { kind: "anonymous", key: clientId, tag: "anonymous" };

  if (isAdminUser(user)) {
    const state = await getOwnerState(user.uid);
    if (state.mode === "new") return { kind: "test-new", key: undefined, uid: user.uid, tag: `test-new:${state.newNonce}` };
    if (state.mode === "returning") {
      return { kind: "test-returning", key: returningKey(user.uid, state.returningNonce), uid: user.uid, tag: `test-returning:${state.returningNonce}` };
    }
    return { kind: "owner", key: ownerKey(user.uid), uid: user.uid, tag: "owner" };
  }

  // A Firebase anonymous account (the games' handle accounts) is a signed-in visitor like any other
  return { kind: "user", key: userKey(user.uid), uid: user.uid, tag: "user" };
}
