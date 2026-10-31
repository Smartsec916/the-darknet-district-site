// Account-aware endpoints for the website's single sign-in:
//
//   GET  /api/me                   who the server believes you are (admin only ever true for the exact account list)
//   POST /api/me/link-history      join this browser's anonymous Iris history to your account, only when you ask
//   POST /api/me/forget            erase Iris's memory of your account
//   GET  /api/owner/state          administrator panel data
//   POST /api/owner/mode           choose Owner / New Visitor / Returning Visitor
//   POST /api/owner/reset          reset a simulated visitor
//
// Everything is decided from a Firebase ID token verified on the server (server/firebaseAuth.ts).
// The administrator routes need an account whose exact id is in IRIS_ADMIN_UIDS; with no list set they
// do not exist. These are separate from the token-based conversation viewer (/admin, /api/admin/*),
// which is untouched. No route here returns a conversation.
import { Router, type Request, type Response, type NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { dbQuery } from "./db";
import { ensureSchema } from "./migrate";
import { logError, log } from "./logger";
import { flirtLevel, emotionEnabled, retentionDays, type Relationship } from "./emotion";
import {
  adminUids, authenticate, getOwnerState, isAdminUser, isOwnerMode, ownerKey, resetSimulated, returningKey,
  setOwnerMode, userKey, type OwnerMode,
} from "./identity";
import {
  clearEmotionEvents, dropLiveState, forgetVisitor, linkAnonymousHistory, liveStateFor, loadRelationship, recentEmotionEvents,
} from "./relationships";
import { storage } from "./storage";
import type { VerifiedUser } from "./firebaseAuth";

declare module "express-serve-static-core" {
  interface Request { account?: VerifiedUser }
}

const failedLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 30, skipSuccessfulRequests: true, standardHeaders: false, legacyHeaders: false,
  message: { error: "Too many failed attempts" },
});
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, max: 60, standardHeaders: false, legacyHeaders: false,
  message: { error: "Too many requests" },
});

const noStore = (res: Response) => { res.setHeader("Cache-Control", "no-store"); res.setHeader("X-Robots-Tag", "noindex, nofollow"); };

async function requireAccount(req: Request, res: Response, next: NextFunction) {
  noStore(res);
  const user = await authenticate(req);
  if (!user) return res.status(401).json({ error: "Sign in to continue." });
  req.account = user;
  next();
}

async function requireOwner(req: Request, res: Response, next: NextFunction) {
  noStore(res);
  // With no administrator list configured these routes do not exist
  if (!adminUids().size) return res.status(404).json({ error: "Not found" });
  const user = await authenticate(req);
  if (!user) return res.status(401).json({ error: "Sign in to continue." });
  if (!isAdminUser(user)) return res.status(403).json({ error: "Not authorized." });
  req.account = user;
  next();
}

const iso = (ms: number | null) => (ms ? new Date(ms).toISOString() : null);

function snapshot(rel: Relationship | null) {
  if (!rel) return null;
  const round = (n: number) => Math.round(n * 100) / 100;
  return {
    mood: rel.mood, trust: round(rel.trust), familiarity: round(rel.familiarity), affection: round(rel.affection),
    respect: round(rel.respect), playfulness: round(rel.playfulness), visits: rel.visits, messages: rel.messages,
    firstSeen: iso(rel.firstSeen), lastSeen: iso(rel.lastSeen), preferences: rel.preferences, recap: rel.recap,
    flirtCooldown: rel.flirtCooldown > 100_000 ? "off" : rel.flirtCooldown, minor: rel.minor,
  };
}

async function usageLast24h() {
  try {
    if (!(await ensureSchema())) return null;
    const { rows } = await dbQuery(
      `SELECT COUNT(*) AS calls, COALESCE(SUM(prompt_tokens), 0) AS input, COALESCE(SUM(completion_tokens), 0) AS output
       FROM iris_api_usage WHERE created_at > now() - interval '24 hours'`,
    );
    const input = Number(rows[0].input), output = Number(rows[0].output);
    const priceIn = Number(process.env.OPENAI_PRICE_INPUT_PER_M) || 2.5;
    const priceOut = Number(process.env.OPENAI_PRICE_OUTPUT_PER_M) || 10;
    return {
      calls: Number(rows[0].calls), inputTokens: input, outputTokens: output,
      estimatedCostUSD: Math.round(((input * priceIn + output * priceOut) / 1e6) * 10000) / 10000,
    };
  } catch (err) {
    logError("owner_usage_failed", err);
    return null;
  }
}

export function createOwnerRouter(): Router {
  const router = Router();
  router.use(["/api/me", "/api/owner"], generalLimiter);

  router.get("/api/me", async (req, res) => {
    noStore(res);
    const user = await authenticate(req);
    if (!user) return res.json({ authenticated: false, admin: false });
    const admin = isAdminUser(user);
    res.json({
      authenticated: true,
      anonymous: user.anonymous,
      admin,
      displayName: user.name ?? null,
      // Shown only to the signed-in person, so they can copy it into the server's administrator list
      accountId: user.uid,
      ...(admin ? { mode: (await getOwnerState(user.uid)).mode } : {}),
    });
  });

  router.post("/api/me/link-history", failedLimiter, requireAccount, async (req, res) => {
    const parsed = z.object({ clientId: z.string().min(1).max(128), consent: z.literal(true) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Send the browser's id and consent: true." });
    const user = req.account!;
    if (isAdminUser(user)) return res.status(409).json({ error: "The administrator account keeps its own separate memory." });
    if (/^(user|owner|test-new|test-returning):/.test(parsed.data.clientId)) return res.status(400).json({ error: "Not a browser id." });
    const result = await linkAnonymousHistory(parsed.data.clientId, userKey(user.uid));
    if (result === "linked") {
      // The remembered name travels with it, if the account does not have one yet
      try {
        const named = await storage.getUserProfile(parsed.data.clientId);
        if (named && !(await storage.getUserProfile(userKey(user.uid)))) {
          await storage.createOrUpdateUserProfile({ clientId: userKey(user.uid), displayName: named.displayName });
        }
      } catch (err) { logError("link_profile_failed", err); }
      log("info", "iris_history_linked", {});
    }
    res.status(result === "failed" ? 503 : 200).json({ result });
  });

  router.post("/api/me/forget", failedLimiter, requireAccount, async (req, res) => {
    const user = req.account!;
    const key = isAdminUser(user) ? ownerKey(user.uid) : userKey(user.uid);
    dropLiveState(key);
    clearEmotionEvents(key);
    res.json({ erased: await forgetVisitor(key) });
  });

  router.get("/api/owner/state", failedLimiter, requireOwner, async (req, res) => {
    const uid = req.account!.uid;
    const state = await getOwnerState(uid);
    const keys = { owner: ownerKey(uid), returning: returningKey(uid, state.returningNonce) };
    const activeKey = state.mode === "owner" ? keys.owner : state.mode === "returning" ? keys.returning : `test-new:${uid}`;
    const live = activeKey ? liveStateFor(activeKey) : undefined;
    res.json({
      mode: state.mode,
      modes: ["owner", "new", "returning"],
      identities: {
        owner: { persistent: true, relationship: snapshot(await loadRelationship(keys.owner)) },
        returning: { persistent: true, resets: state.returningNonce, relationship: snapshot(await loadRelationship(keys.returning)) },
        new: { persistent: false, resets: state.newNonce, relationship: null },
      },
      active: {
        mode: state.mode,
        live: live ? { mood: live.rel.mood, trust: Math.round(live.rel.trust * 100) / 100, messagesThisChat: live.sessionMessages } : null,
        recentChanges: activeKey ? recentEmotionEvents(activeKey).map(e => ({ ...e, at: new Date(e.at).toISOString() })) : [],
      },
      persistence: {
        emotionSystem: emotionEnabled() ? "on" : "off",
        database: await ensureSchema(),
        retentionDays: retentionDays(),
        flirtLevel: flirtLevel(),
        recentChangesKeptInMemory: true,
      },
      usageLast24h: await usageLast24h(),
    });
  });

  router.post("/api/owner/mode", failedLimiter, requireOwner, async (req, res) => {
    const mode = (req.body as { mode?: unknown } | undefined)?.mode;
    if (!isOwnerMode(mode)) return res.status(400).json({ error: "mode must be owner, new or returning." });
    const state = await setOwnerMode(req.account!.uid, mode as OwnerMode);
    if (!state) return res.status(503).json({ error: "Could not save the mode." });
    res.json({ mode: state.mode });
  });

  router.post("/api/owner/reset", failedLimiter, requireOwner, async (req, res) => {
    const target = (req.body as { target?: unknown } | undefined)?.target;
    if (target !== "new" && target !== "returning") return res.status(400).json({ error: "target must be new or returning." });
    const result = await resetSimulated(req.account!.uid, target);
    if (!result) return res.status(503).json({ error: "Could not reset." });
    if (target === "new") clearEmotionEvents(`test-new:${req.account!.uid}`);
    if (result.erasedKey) {
      dropLiveState(result.erasedKey);
      clearEmotionEvents(result.erasedKey);
      await forgetVisitor(result.erasedKey);
    }
    res.json({ reset: target });
  });

  return router;
}
