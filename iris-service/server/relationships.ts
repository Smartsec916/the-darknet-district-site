// Iris's memory of each visitor, kept in Neon so it survives restarts and sleeps.
//
// One small row per visitor, keyed by the id the site already sends (clientId). There is no IP address,
// no browser fingerprint and no merging of different ids. What is kept is deliberately thin: five
// numbers, a mood, counters, times, up to five short likes the visitor stated, and a short recap.
// Rows are deleted after IRIS_MEMORY_RETENTION_DAYS without a visit (default 180), and a visitor or
// the administrator can erase one at any time. Every function here fails soft: Iris keeps chatting
// from the session's own state if the database cannot be reached.
import { dbQuery } from "./db";
import { ensureSchema } from "./migrate";
import { logError, logThrottled } from "./logger";
import {
  applyAbsence, cleanMemoryText, flirtAllowed, newRelationship, retentionDays, MOODS,
  type Mood, type Relationship, type SessionEmotion,
} from "./emotion";

const toMs = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  const ms = new Date(value as string).getTime();
  return Number.isFinite(ms) ? ms : null;
};

function fromRow(row: any): Relationship {
  let preferences: string[] = [];
  try {
    const parsed = JSON.parse(row.preferences || "[]");
    if (Array.isArray(parsed)) preferences = parsed.map(p => cleanMemoryText(p, 60)).filter(Boolean).slice(-5);
  } catch { /* unreadable: start empty */ }
  const mood = (MOODS as readonly string[]).includes(row.mood) ? (row.mood as Mood) : "professional";
  const num = (value: unknown, fallback: number) => (Number.isFinite(Number(value)) ? Number(value) : fallback);
  return {
    trust: num(row.trust, 1), familiarity: num(row.familiarity, 0), affection: num(row.affection, 0),
    respect: num(row.respect, 0.5), playfulness: num(row.playfulness, 0.3), mood,
    visits: num(row.visits, 0), messages: num(row.messages, 0),
    firstSeen: toMs(row.first_seen) ?? Date.now(), lastSeen: toMs(row.last_seen),
    preferences, recap: cleanMemoryText(row.recap, 240),
    flirtCooldown: num(row.flirt_cooldown, 0), minor: row.minor === true,
  };
}

// null when this visitor has no memory yet (or the database is unavailable)
export async function loadRelationship(clientId: string): Promise<Relationship | null> {
  try {
    if (!(await ensureSchema())) return null;
    const { rows } = await dbQuery(`SELECT * FROM iris_relationships WHERE client_id = $1`, [clientId]);
    return rows.length ? fromRow(rows[0]) : null;
  } catch (err) {
    logThrottled("error", "relationship_load_failed", { error: (err as Error).message?.slice(0, 120) }, 30_000);
    return null;
  }
}

let lastPurge = 0;

export async function saveRelationship(clientId: string, rel: Relationship): Promise<boolean> {
  try {
    if (!(await ensureSchema())) return false;
    await dbQuery(
      `INSERT INTO iris_relationships
         (client_id, trust, familiarity, affection, respect, playfulness, mood, visits, messages,
          first_seen, last_seen, preferences, recap, flirt_cooldown, minor, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::timestamp, $11::timestamp, $12, $13, $14, $15, now())
       ON CONFLICT (client_id) DO UPDATE SET
         trust = EXCLUDED.trust, familiarity = EXCLUDED.familiarity, affection = EXCLUDED.affection,
         respect = EXCLUDED.respect, playfulness = EXCLUDED.playfulness, mood = EXCLUDED.mood,
         visits = EXCLUDED.visits, messages = EXCLUDED.messages, last_seen = EXCLUDED.last_seen,
         preferences = EXCLUDED.preferences, recap = EXCLUDED.recap, flirt_cooldown = EXCLUDED.flirt_cooldown,
         minor = EXCLUDED.minor OR iris_relationships.minor, updated_at = now()`,
      [
        clientId, rel.trust, rel.familiarity, rel.affection, rel.respect, rel.playfulness, rel.mood, rel.visits, rel.messages,
        new Date(rel.firstSeen).toISOString(), new Date(rel.lastSeen ?? Date.now()).toISOString(),
        JSON.stringify(rel.preferences), rel.recap, Math.min(rel.flirtCooldown, 1_000_000), rel.minor,
      ],
    );
    void purgeExpired();
    return true;
  } catch (err) {
    logError("relationship_save_failed", err);
    return false;
  }
}

// Old memories are removed, at most once an hour and only as a side effect of a save
export async function purgeExpired(force = false): Promise<number> {
  if (!force && Date.now() - lastPurge < 3_600_000) return 0;
  lastPurge = Date.now();
  try {
    const { rows } = await dbQuery(
      `DELETE FROM iris_relationships WHERE last_seen < now() - ($1 || ' days')::interval RETURNING client_id`,
      [String(retentionDays())],
    );
    return rows.length;
  } catch (err) {
    logError("relationship_purge_failed", err);
    return 0;
  }
}

// Erases Iris's emotional memory of one visitor. Stored conversations are separate and untouched.
export async function forgetVisitor(clientId: string): Promise<boolean> {
  try {
    if (!(await ensureSchema())) return false;
    const { rows } = await dbQuery(`DELETE FROM iris_relationships WHERE client_id = $1 RETURNING client_id`, [clientId]);
    return rows.length > 0;
  } catch (err) {
    logError("relationship_forget_failed", err);
    return false;
  }
}

export { newRelationship };

// ---------------------------------------------------------------- per-session state

// Live state for each open chat session. Bounded (oldest dropped first) so it cannot grow without limit.
const MAX_LIVE_SESSIONS = 5000;
export const sessionEmotionMap = new Map<string, SessionEmotion>();

// Begins (or restores after a restart) a session's emotional state: the visitor's saved relationship if they
// have one, aged by the time since they were last seen, otherwise a fresh one. Never throws.
export async function startEmotionSession(sessionId: string, clientId?: string, now = Date.now()): Promise<SessionEmotion> {
  const saved = clientId ? await loadRelationship(clientId) : null;
  let gapMs: number | null = null;
  const rel = saved ?? newRelationship(now);
  if (saved) gapMs = applyAbsence(rel, now);
  if (rel.mood === "flirty" && !flirtAllowed(rel)) rel.mood = "playful";
  const state: SessionEmotion = {
    rel, clientId: clientId || undefined, gapMs, counted: false, sessionMessages: 0, heldFor: 0, pendingCount: 0,
  };
  sessionEmotionMap.delete(sessionId);
  sessionEmotionMap.set(sessionId, state);
  while (sessionEmotionMap.size > MAX_LIVE_SESSIONS) {
    const oldest = sessionEmotionMap.keys().next().value;
    if (oldest === undefined) break;
    sessionEmotionMap.delete(oldest);
  }
  return state;
}

// After a visitor's memory is erased, their open sessions start over and stop saving
export function dropLiveState(clientId: string, now = Date.now()): void {
  for (const state of Array.from(sessionEmotionMap.values())) {
    if (state.clientId === clientId) {
      state.rel = newRelationship(now);
      state.clientId = undefined;
      state.gapMs = null;
    }
  }
}
