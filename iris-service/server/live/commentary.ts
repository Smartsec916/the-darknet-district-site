// How Iris comments on what she has just looked up. Every live answer gets ONE stance, chosen here, so that her
// commentary is occasional and varied by construction rather than by hope: often she simply answers, sometimes a dry
// remark, sometimes doubt about a source (only where the data gives a real reason), sometimes curiosity, sometimes
// credit where the evidence is solid. Her current mood bends the odds; a serious subject removes the jokes entirely.
// The guidance contains no ready-made jokes or catchphrases: nothing here can be repeated word for word.
import { detectLang, type Lang } from "../timeService";
import type { Notes } from "./notes";

export type Stance = "straight" | "wry" | "skeptical" | "curious" | "defend" | "warm" | "respectful";
export const dice = { next: (): number => Math.random() }; // replaced by tests

const BASE: Record<Exclude<Stance, "respectful">, number> = { straight: 40, wry: 25, skeptical: 15, curious: 10, warm: 7, defend: 3 };
// Her mood (see emotion.ts) bends the odds, it never switches a stance on or off
const MOOD: Record<string, Partial<Record<Exclude<Stance, "respectful">, number>>> = {
  professional: { straight: 1.6, wry: 0.6, skeptical: 0.8, warm: 0.5 },
  sarcastic: { straight: 0.7, wry: 1.5, skeptical: 1.5, curious: 0.7 },
  cold: { straight: 1.8, wry: 0.6, warm: 0.2, curious: 0.5 },
  flirty: { straight: 0.8, warm: 2.5, skeptical: 0.7 },
  playful: { straight: 0.7, wry: 1.4, curious: 1.8, warm: 1.2 },
  busy: { straight: 2.2, wry: 0.4, skeptical: 0.4, curious: 0.4, warm: 0.4, defend: 0.4 },
};

const recent = new Map<string, Stance[]>();
export function resetCommentaryForTests(): void { recent.clear(); }

export interface Choice { stance: Stance; weights: Record<string, number> }

export function chooseStance(args: { notes: Notes; mood?: string; sessionId: string }): Choice {
  const { notes } = args;
  if (notes.serious) { remember(args.sessionId, "respectful"); return { stance: "respectful", weights: {} }; }
  const mood = MOOD[args.mood ?? ""] ?? {};
  const last = recent.get(args.sessionId) ?? [];
  const weights: Record<string, number> = {};
  for (const stance of Object.keys(BASE) as Array<keyof typeof BASE>) {
    if (stance === "skeptical" && !notes.skepticalBasis) continue;   // nothing real to doubt
    if (stance === "defend" && !notes.reliable) continue;            // nothing solid to credit
    if (stance === "curious" && !notes.curious) continue;            // nothing notable to wonder at
    if (stance !== "straight" && last.length >= 2 && last[last.length - 1] === stance && last[last.length - 2] === stance) continue; // never a third time running
    let w = BASE[stance] * (mood[stance] ?? 1);
    if (stance !== "straight" && last[last.length - 1] === stance) w *= 0.15;   // not the same move twice running
    if (stance !== "straight" && last.length >= 2 && last[last.length - 2] === stance) w *= 0.5;
    weights[stance] = w;
  }
  let roll = dice.next() * Object.values(weights).reduce((a, b) => a + b, 0);
  let picked: Stance = "straight";
  for (const [stance, w] of Object.entries(weights)) { roll -= w; if (roll < 0) { picked = stance as Stance; break; } }
  remember(args.sessionId, picked);
  return { stance: picked, weights };
}
function remember(sessionId: string, stance: Stance): void {
  const list = [...(recent.get(sessionId) ?? []), stance].slice(-3);
  recent.delete(sessionId); recent.set(sessionId, list);
  while (recent.size > 2000) recent.delete(recent.keys().next().value as string);
}

const INSTRUCTION: Record<Stance, string> = {
  straight: "Simply answer. Give the facts cleanly in your own voice, with no joke and no editorial. Not every answer needs commentary.",
  wry: "After the facts, add ONE short, original, dry or sarcastic observation about the situation itself (the conditions, the circumstances, the hype around it). It is your joke: it must sound like a joke and never state anything as fact.",
  skeptical: "After the facts, voice a little healthy skepticism about the source or the claim, using ONLY something listed under SOURCE NOTES (a claim that is someone's own account, a single outlet, a stale or predicted figure, disputed figures). Phrase it as doubt or a question, never an accusation, and say what would settle it. If SOURCE NOTES gives you nothing, do not invent a doubt: simply answer.",
  curious: "After the facts, show real curiosity or surprise about something genuinely notable in the data, in a sentence or a short question. Do not manufacture drama.",
  defend: "The evidence here is solid (an official source, or several outlets agreeing): say so briefly, drop the cynicism, and give the source its credit. Grudging respect is fine.",
  warm: "After the facts, add a touch of warmth or care for the visitor (their plans, their comfort, their safety). Any flirting stays inside your existing mood and relationship rules, and never when the visitor seems young or uninterested.",
  respectful: "This is a serious subject (danger, injury, death, disaster, or a worried visitor). No jokes, no sarcasm, no flirting, no cynicism about the source. Be calm, clear and kind, give the facts plainly, and point to official local guidance if there is danger.",
};

// Humour does not translate word for word. These notes describe how irony sounds in each language; they contain no jokes to copy.
const STYLE: Partial<Record<Lang, string>> = {
  "zh-Hans": "Write the remark as natural spoken Chinese: wit through understatement and deadpan (the 吐槽 and 反讽 register), light internet slang only if it fits. Never translate an English joke or idiom word for word.",
  "zh-Hant": "Write the remark as natural spoken Chinese: wit through understatement and deadpan (the 吐槽 and 反諷 register), light slang only if it fits. Never translate an English joke or idiom word for word.",
  ja: "Write the remark as natural spoken Japanese: deadpan irony (皮肉), soft sentence endings, a light ツッコミ at most. Never translate an English joke word for word; do not pile on emoji or 笑.",
  es: "Write the remark as natural colloquial Spanish (tú): dry irony and deliberate exaggeration, the way a Spanish speaker would actually phrase it. Never translate an English joke word for word.",
  ru: "Write the remark as natural colloquial Russian: dark understatement, short sharp sentences, ironic politeness. Never translate an English joke word for word.",
};
const GENERIC_STYLE = "Write any remark natively in the language you are answering in, with that language's own sense of humour; never translate an English joke word for word.";

const SENTIMENT: Record<string, string> = {
  bad: "The conditions are unpleasant. If you remark on them, make the remark yours (a jab at the weather industry, the sky, or corporations in general) and plainly a joke: never a claim about real pollution or what causes it.",
  good: "The conditions are pleasant. A dry, suspicious or fond remark works, as long as it is plainly a joke.",
  neutral: "The conditions are unremarkable.",
};

export function commentaryBlock(choice: Choice, notes: Notes, message: string): string {
  const lang = detectLang(message);
  const lines = [`COMMENTARY FOR THIS REPLY (stance: ${choice.stance}):`, INSTRUCTION[choice.stance]];
  if (notes.sentiment && (choice.stance === "wry" || choice.stance === "warm" || choice.stance === "curious")) lines.push(SENTIMENT[notes.sentiment]);
  if (choice.stance !== "straight" && choice.stance !== "respectful") lines.push(STYLE[lang] ?? GENERIC_STYLE);
  lines.push("Whatever the stance, the facts keep their exact numbers, dates, times, forecasts and quotations: a joke goes around the facts, never through them.");
  return lines.join("\n");
}
