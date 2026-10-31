// Decides, for each chat message, what stored memory Iris gets to see, and records what happened (counts only).
//
//   1. A chat the server no longer holds in memory (after a restart, deploy or sleep) is rebuilt from its own stored
//      messages, so nothing said earlier in the same chat is lost.
//   2. In a chat's first messages, the visitor's last conversations ride along ("recent context").
//   3. When the visitor asks about something earlier, the stored messages that match are searched for and included
//      ("long-term recall"). If nothing matches, or the lookup fails, Iris is told so and must say so.
//
// Everything is limited to the caller's own keys (memory.ts), and nothing is requested when the identity is unknown.
import * as openaiService from "./services/openai";
import {
  approxTokens, buildMemoryPrompt, limits, looksLikeRecall, loadRecent, loadSession, memoryEnabled, memoryKeysFor,
  recordRetrieval, searchMemory, type Loaded, type StoredMessage,
} from "./memory";

export interface PreparedMemory {
  prompt: string | null;
  recallAsked: boolean;
  recentIncluded: number;
  recallIncluded: number;
  approxTokens: number;
  failed: boolean;
  rebuilt: number;
}

const NOTHING: PreparedMemory = { prompt: null, recallAsked: false, recentIncluded: 0, recallIncluded: 0, approxTokens: 0, failed: false, rebuilt: 0 };

// The recent-context lookup is done once per chat, then reused for that chat's first messages
const recentCache = new Map<string, Loaded<StoredMessage[]>>();
const MAX_CACHED = 2000;

export async function prepareMemory(args: {
  sessionId: string;
  key: string | undefined;     // the identity's memory key; undefined = this visitor cannot be remembered
  label: string;               // what the administrator's panel calls this identity
  message: string;
  messageNumber: number;       // 1 for the first message of this chat (after a restart this starts over)
  nowMs?: number;
}): Promise<PreparedMemory> {
  if (!memoryEnabled()) return NOTHING;
  const nowMs = args.nowMs ?? Date.now();
  const lim = limits();
  const recallAsked = looksLikeRecall(args.message);
  let keys: string[] = [];
  let rebuilt = 0;

  if (args.key) {
    keys = await memoryKeysFor(args.key);

    // 1. rebuild this chat's short-term window if the server has forgotten it
    if (!openaiService.hasSession(args.sessionId)) {
      const stored = await loadSession(keys, args.sessionId);
      if (stored.ok && stored.value.length) {
        openaiService.seedSession(args.sessionId, stored.value.map(m => ({ role: m.sender === "iris" ? "assistant" : "user", content: m.text })));
        rebuilt = stored.value.length;
      }
    }
  }

  // 2. recent context for a chat's first messages
  let recent: Loaded<StoredMessage[]> | undefined;
  if (args.key && args.messageNumber <= lim.recentWindowSessionsOnlyFirst) {
    recent = recentCache.get(args.sessionId);
    if (!recent) {
      recent = await loadRecent(keys, args.sessionId);
      if (recentCache.size >= MAX_CACHED) recentCache.delete(recentCache.keys().next().value as string);
      recentCache.set(args.sessionId, recent);
      recordRetrieval(args.label, {
        at: nowMs, kind: "recent", ok: recent.ok, failure: recent.failure, found: recent.value.length,
        included: 0, chars: 0, approxTokens: 0, ms: recent.ms,
      });
    }
  } else if (args.messageNumber > lim.recentWindowSessionsOnlyFirst) {
    recentCache.delete(args.sessionId);
  }

  // 3. long-term recall when they ask about something earlier
  let recall: Awaited<ReturnType<typeof searchMemory>> | undefined;
  if (args.key && recallAsked) {
    recall = await searchMemory(keys, args.message, nowMs, openaiService.windowTexts(args.sessionId));
  }

  const built = buildMemoryPrompt({ nowMs, hasIdentity: Boolean(args.key), recent, recall, recallAsked });
  if (recall) {
    recordRetrieval(args.label, {
      at: nowMs, kind: "recall", ok: recall.ok, failure: recall.failure, found: recall.value.hits.length,
      included: built.recallIncluded, chars: built.chars, approxTokens: approxTokens(built.chars), ms: recall.ms,
    });
  }
  if (built.text) {
    // What this request carried: counts and an estimate, never the text
    recordRetrieval(args.label, {
      at: nowMs, kind: "request", ok: !built.failed, found: built.recentIncluded + built.recallIncluded,
      included: built.recentIncluded + built.recallIncluded, chars: built.chars, approxTokens: approxTokens(built.chars), ms: 0,
    });
  }
  return {
    prompt: built.text, recallAsked, recentIncluded: built.recentIncluded, recallIncluded: built.recallIncluded,
    approxTokens: approxTokens(built.chars), failed: built.failed, rebuilt,
  };
}

export const forgetCachedRecent = (sessionId: string) => { recentCache.delete(sessionId); };
export const clearRecentCacheForTests = () => recentCache.clear();
