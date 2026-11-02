// Which language Iris answers in.
//
// Detection looks at one message at a time, so a Chinese-speaking visitor who types "ok" or "thanks" used to flip the
// chat back to English and drop the language instruction, and the model then mixed the two languages. Here the
// conversation has a PREFERRED language that is only a default:
//   - a message clearly in another language moves it;
//   - a short or ambiguous English message ("ok", "thanks", "hello") does not;
//   - a clear English sentence moves it back to English;
//   - an explicit request (translate this, answer in both, switch to X) is always honored for that reply, and a request
//     to switch also changes the default.
// Pure functions with no I/O, so the rules are easy to test.

export interface Explicit {
  kind: "switch" | "translate" | "bilingual";
  language?: string; // the language asked for, when one was named
}

export interface Decision {
  reply: string;       // the language of this reply's default
  preferred: string;   // the conversation's default from now on
  explicit?: Explicit; // what the visitor asked for, if anything
}

const LANGUAGE_NAMES: Record<string, string> = {
  english: "english", chinese: "chinese", mandarin: "chinese", cantonese: "chinese", zh: "chinese",
  "simplified chinese": "chinese", "traditional chinese": "chinese", "chinese simplified": "chinese", "chinese traditional": "chinese",
  spanish: "spanish", french: "french", german: "german", japanese: "japanese", korean: "korean", russian: "russian",
  arabic: "arabic", italian: "italian", portuguese: "portuguese", hindi: "hindi", thai: "thai", vietnamese: "vietnamese",
};

// A detector's answer, in the names this code uses ("mandarin" and "simplified chinese" are Chinese)
export function normalizeLanguage(label: string | undefined | null): string {
  const cleaned = (label ?? "").toLowerCase().replace(/[^a-z一-鿿 ]/g, "").trim();
  if (!cleaned) return "english";
  return LANGUAGE_NAMES[cleaned] ?? (cleaned.split(" ").map(w => LANGUAGE_NAMES[w]).find(Boolean) ?? cleaned);
}

const NAMED = "english|chinese|mandarin|cantonese|spanish|french|german|japanese|korean|russian|arabic|italian|portuguese|hindi|thai|vietnamese";
const NAMED_CJK: Array<[RegExp, string]> = [
  [/(?:用|以|讲|說|说|请用|請用|改用|换成|換成)\s*(?:英文|英语|英語)/, "english"],
  [/(?:用|以|讲|說|说|请用|請用|改用|换成|換成)\s*(?:中文|汉语|漢語|普通话|普通話|国语|國語)/, "chinese"],
  [/(?:用|以|讲|說|说|请用|請用|改用|换成|換成)\s*(?:日文|日语|日語)/, "japanese"],
  [/(?:用|以|讲|說|说|请用|請用|改用|换成|換成)\s*(?:韩文|韩语|韓文|韓語)/, "korean"],
  [/(?:用|以|讲|說|说|请用|請用|改用|换成|換成)\s*(?:西班牙语|西班牙語)/, "spanish"],
];

// An explicit request about language: translate something, answer in two languages, or switch.
export function explicitLanguageRequest(text: string): Explicit | null {
  const t = text.toLowerCase();

  if (/\b(?:bilingual|both languages|in two languages)\b/.test(t) || /(?:双语|雙語|两种语言|兩種語言|中英(?:文)?(?:对照|對照|双语|雙語)?)/.test(text)
      || new RegExp(`\\b(?:in|using) (?:both )?(?:${NAMED}) and (?:${NAMED})\\b`).test(t)) {
    return { kind: "bilingual" };
  }
  if (/\b(?:translate|translation|how (?:do|would) you say)\b/.test(t) || /(?:翻译|翻譯|怎么说|怎麼說|是什么意思|是什麼意思)/.test(text)) {
    const named = new RegExp(`\\b(?:to|into|in) (${NAMED})\\b`).exec(t);
    return { kind: "translate", language: named ? normalizeLanguage(named[1]) : undefined };
  }
  const switchTo = new RegExp(
    `\\b(?:(?:switch|change|go|speak|talk|reply|respond|answer|write|say(?: that)?|continue|chat)\\b[^.?!\\n]{0,24}?\\b(?:in|to|into)\\s+(${NAMED})|(?:in|using)\\s+(${NAMED}),? (?:please|from now on|only)|(?:${NAMED})(?: only)?,? please|do you speak (${NAMED}))\\b`,
  ).exec(t);
  if (switchTo) {
    const named = switchTo.slice(1).find(Boolean) ?? new RegExp(`(${NAMED})`).exec(switchTo[0])?.[1];
    if (named) return { kind: "switch", language: normalizeLanguage(named) };
  }
  for (const [pattern, language] of NAMED_CJK) if (pattern.test(text)) return { kind: "switch", language };
  return null;
}

// A message that is plainly a sentence in English, as opposed to "ok" or "thanks"
export function isClearEnglish(text: string): boolean {
  const words = text.match(/[A-Za-z']+/g) ?? [];
  const nonLatin = (text.match(/[^\x00-\x7f]/g) ?? []).length;
  return words.length >= 4 && nonLatin === 0;
}

// The script itself settles some cases before any detector is asked: kana can only be Japanese, hangul only Korean, and a short
// all-Han message ("明日は？" has kana, but "明日?" does not) in a conversation that is already Japanese stays Japanese (a
// model detector once called "明日は？" Chinese, and the visitor's Japanese chat switched to Chinese mid-conversation).
export function languageFromScript(text: string, preferred: string): string | null {
  if (/[぀-ゟ゠-ヿ]/.test(text)) return "japanese";
  if (/[가-힯ᄀ-ᇿ]/.test(text)) return "korean";
  if (preferred === "japanese" && /[㐀-鿿]/.test(text) && !/[A-Za-z぀-ヿ]{3,}/.test(text) && text.length <= 12) return "japanese";
  return null;
}

export function decideLanguage(args: { detected: string; text: string; preferred: string }): Decision {
  const preferred = normalizeLanguage(args.preferred);
  const detected = languageFromScript(args.text, preferred) ?? normalizeLanguage(args.detected);
  const explicit = explicitLanguageRequest(args.text) ?? undefined;

  if (explicit?.kind === "switch" && explicit.language) return { reply: explicit.language, preferred: explicit.language, explicit };
  if (explicit) return { reply: preferred, preferred, explicit }; // translate / bilingual: the default does not change

  if (detected !== "english") return { reply: detected, preferred: detected };
  // English detected: only a clear sentence moves a non-English conversation back
  if (preferred !== "english" && !isClearEnglish(args.text)) return { reply: preferred, preferred };
  return { reply: "english", preferred: "english" };
}

// Rebuilds the default after a restart from the language stored with the visitor's recent messages (oldest first)
export function preferredFromStored(rows: Array<{ text: string; language: string | null }>): string {
  let preferred = "english";
  for (const row of rows) preferred = decideLanguage({ detected: row.language ?? "english", text: row.text, preferred }).preferred;
  return preferred;
}

const label = (language: string) => language.charAt(0).toUpperCase() + language.slice(1);

// The last thing the model reads about language. Empty when nothing needs saying.
export function languageReminder(decision: Decision, seenOther: boolean): string {
  const { reply, preferred, explicit } = decision;
  if (explicit?.kind === "bilingual") {
    return `LANGUAGE: The visitor asked for a bilingual reply. Answer in ${label(preferred)} and ${preferred === "english" ? "the other language they named or used" : "English"}, each part complete, staying in character.`;
  }
  if (explicit?.kind === "translate") {
    return `LANGUAGE: The visitor asked for a translation${explicit.language ? ` into ${label(explicit.language)}` : ""}. Give the translation as asked, then continue in ${label(preferred)}. This is a one-time request; ${label(preferred)} stays the default.`;
  }
  if (reply === "english" && !seenOther) return "";
  return `LANGUAGE: Reply in ${label(reply)}${explicit ? ` (the visitor asked for it; keep using it until they ask otherwise)` : ", the language of this conversation"}. `
    + `Do not mix in words of another language, except names, District and game terms. If they ask for a translation, a bilingual answer or another language, do that instead.`;
}
