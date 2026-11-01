// Decides, for each chat message, what stored memory Iris gets to see, how she must treat it, and records what happened
// (counts only).
//
//   1. A chat the server no longer holds in memory (after a restart, deploy or sleep) is rebuilt from its own stored
//      messages, so nothing said earlier in the same chat is lost.
//   2. In a chat's first messages, the visitor's last conversations ride along ("recent context").
//   3. When the visitor asks about something earlier, the stored messages that match are searched for and included
//      ("long-term recall"). If nothing matches, or the lookup fails, Iris is told so and must say so.
//
// A question about the past is answered from the stored messages, not from anything else in her prompt:
//   - she gets a short rule as the LAST thing she reads (after the conversation), so it outweighs the long character
//     notes that came earlier;
//   - those answers use calm sampling (a low temperature and no penalty on repeating a phrase that is already in
//     context, which would otherwise discourage quoting it back exactly);
//   - when there is nothing at all to recall, she does not invent: she answers with an in-character "I have no record
//     of that" (see canned replies below). IRIS_RECALL_GUARD=off turns that last step off.
//
// Everything is limited to the caller's own keys (memory.ts), and nothing is requested when the identity is unknown.
import * as openaiService from "./services/openai";
import {
  approxTokens, buildMemoryPrompt, extractTerms, isRecallQuestion, limits, loadRecent, loadSession, memoryEnabled,
  loadSessionLanguage, memoryKeysFor, recordRetrieval, searchMemory, type Loaded, type RecallMode, type StoredMessage,
} from "./memory";

export interface PreparedMemory {
  prompt: string | null;
  recallAsked: boolean;
  mode: RecallMode;
  recentIncluded: number;
  recallIncluded: number;
  approxTokens: number;
  failed: boolean;
  rebuilt: number;
  tailReminder: string | null;                 // the rule she reads last, for this reply only
  sampling?: { temperature: number; presence_penalty: number; frequency_penalty: number };
  canned: string | null;                       // when set, the reply is this line and the model is not asked
}

const NOTHING: PreparedMemory = {
  prompt: null, recallAsked: false, mode: "none", recentIncluded: 0, recallIncluded: 0, approxTokens: 0, failed: false,
  rebuilt: 0, tailReminder: null, canned: null,
};

// ---------------------------------------------------------------- the rule she reads last

const PERSONA_NOTE = "Keep your own personality and tone.";

export const TAIL_REMINDERS: Record<Exclude<RecallMode, "none">, string> = {
  grounded:
    "RECALL RULE for your next reply: the visitor is asking about something from the past. The exact stored messages that answer it are in " +
    "VERIFIED CONVERSATION MEMORY above (and in this chat). Answer from those quoted lines and repeat the stored wording exactly. " +
    "Do not answer with an identity check, a verification phrase, a password or any other secret. If more than one stored message could be " +
    "what they mean, say what you found and when, and ask which one they mean. If the stored lines do not answer it, say so. " + PERSONA_NOTE,
  partial:
    "RECALL RULE for your next reply: nothing matched their exact words. Their latest earlier conversation is listed above; use it only if it " +
    "clearly answers the question. Otherwise say honestly that you don't remember. Never name a phrase, word, name or password that you cannot see " +
    "quoted above. Do not answer with an identity check or verification phrase. " + PERSONA_NOTE,
  absent:
    "RECALL RULE for your next reply: you have NO record of what they are asking about. Say so in one short sentence and invite them to tell you again. " +
    "Do not name, guess or hint at any phrase, word, name, code or password, and do not give an example. " + PERSONA_NOTE,
  failed:
    "RECALL RULE for your next reply: your memory could not be read just now. Say so in one short sentence and ask them to try again in a moment. " +
    "Do not guess. " + PERSONA_NOTE,
  unrecognized:
    "RECALL RULE for your next reply: you cannot recognize this visitor between visits, so you have no stored memory of them. Say so honestly. " +
    "If what they mean was said earlier in this chat, use that. Do not guess or name any phrase, word, name or password you cannot see in this chat. " + PERSONA_NOTE,
};

const CALM_SAMPLING = { temperature: 0.3, presence_penalty: 0, frequency_penalty: 0 };

// ---------------------------------------------------------------- when there is nothing to recall

// Short, in character, and the same shape in every mood: no record, say it again. They never name anything.
const NO_RECORD: Record<string, string[]> = {
  professional: ["I have no record of that. Tell me again and I'll log it properly.", "Nothing on file under that. If it matters, repeat it and I'll make sure it sticks."],
  sarcastic: ["Wow, nothing. My logs are completely empty on that, runner. Say it again and maybe I'll pretend to care.", "I'd love to quote it back, but there's nothing in my logs. Try me again?"],
  cold: ["No record. Not in my logs, not in my memory. Say it again if it matters.", "That isn't in my records."],
  flirty: ["Mm, I'd remember if you'd told me. Nothing in my logs yet. Whisper it to me again?", "Nothing in my logs on that, gorgeous. Tell me again and I'll keep it close."],
  playful: ["Plot twist: my memory banks are blank on that! Tell me again and I'll guard it with my life.", "Ooh, nope, nothing in the vault on that one. Say it again and it's mine forever."],
  busy: ["Not finding it. Logs are empty on that one. Say it again, quick.", "Nothing on file. Tell me again and I'll log it on the fly."],
};
const MEMORY_DOWN = ["My memory isn't responding right now. Give me a moment and ask me again.", "I can't reach my memory banks at the moment. Try me again in a minute."];
const NOT_RECOGNIZED = ["I can't recognize you between visits, so I don't have anything stored about you. If you said it earlier in this chat I'd have it, but I don't."];

const pick = (lines: string[]) => lines[Math.floor(Math.random() * lines.length)];

const ENGLISH_WORDS = /\b(?:the|my|what|was|did|do|you|i|me|told|said|remember|recall|phrase|code|word|name|test|again|earlier|before)\b/gi;
// Only English questions get a canned English answer; anything else goes to the model with the strict rule above
const looksEnglish = (text: string) => ![...text].some(ch => (ch.codePointAt(0) ?? 0) > 0x7f) && (text.match(ENGLISH_WORDS) ?? []).length >= 2;

const guardOn = () => process.env.IRIS_RECALL_GUARD !== "off";

function inChat(sessionId: string, terms: string[]): boolean {
  if (!terms.length) return true; // a question with no specific subject cannot be judged: leave it to the model and its rule
  for (const text of openaiService.windowTexts(sessionId)) if (terms.some(t => text.includes(t))) return true;
  return false;
}

// ---------------------------------------------------------------- per message

// The recent-context lookup is done once per chat, then reused for that chat's first messages
const recentCache = new Map<string, Loaded<StoredMessage[]>>();
const MAX_CACHED = 2000;

export async function prepareMemory(args: {
  sessionId: string;
  key: string | undefined;     // the identity's memory key; undefined = this visitor cannot be remembered
  label: string;               // what the administrator's panel calls this identity
  message: string;
  messageNumber: number;       // 1 for the first message of this chat (after a restart this starts over)
  mood?: string;               // her current mood, to choose a fitting line when there is nothing to recall
  nowMs?: number;
}): Promise<PreparedMemory> {
  if (!memoryEnabled()) return NOTHING;
  const nowMs = args.nowMs ?? Date.now();
  const lim = limits();
  // "Remember this phrase" and ordinary statements are not questions about the past
  const recallAsked = isRecallQuestion(args.message);
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
        // ...and the language the chat was being held in, from the language stored with the visitor's messages
        const held = await loadSessionLanguage(keys, args.sessionId);
        if (held.ok) openaiService.seedPreferredLanguage(args.sessionId, held.value);
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
      candidates: recall.value.candidates, excluded: recall.value.excluded ?? 0, dropped: recall.value.dropped ?? 0, mode: built.mode,
    });
  }

  // How she must answer a question about the past
  const mode = built.mode;
  const asked = recallAsked && mode !== "none";
  const tailReminder = asked ? TAIL_REMINDERS[mode as Exclude<RecallMode, "none">] : null;

  let canned: string | null = null;
  if (asked && guardOn() && looksEnglish(args.message)) {
    const terms = extractTerms(args.message);
    // Nothing stored, nothing in this chat, and a specific subject: the honest answer needs no model, and cannot invent
    if (mode === "absent" && terms.length && !inChat(args.sessionId, terms)) canned = pick(NO_RECORD[args.mood ?? ""] ?? NO_RECORD.professional);
    else if (mode === "failed" && !inChat(args.sessionId, terms)) canned = pick(MEMORY_DOWN);
    else if (mode === "unrecognized" && terms.length && !inChat(args.sessionId, terms)) canned = pick(NOT_RECOGNIZED);
  }

  if (built.text || tailReminder) {
    // What this request carried: counts and an estimate, never the text
    recordRetrieval(args.label, {
      at: nowMs, kind: "request", ok: !built.failed, found: built.recentIncluded + built.recallIncluded,
      included: built.recentIncluded + built.recallIncluded, chars: built.chars, approxTokens: approxTokens(built.chars), ms: 0,
      mode: canned ? "absent" : mode,
    });
  }
  return {
    prompt: built.text, recallAsked, mode, recentIncluded: built.recentIncluded, recallIncluded: built.recallIncluded,
    approxTokens: approxTokens(built.chars), failed: built.failed, rebuilt, tailReminder,
    sampling: asked ? CALM_SAMPLING : undefined, canned,
  };
}

export const forgetCachedRecent = (sessionId: string) => { recentCache.delete(sessionId); };
export const clearRecentCacheForTests = () => recentCache.clear();
