// Checks for the personality evaluation that a script can do in every supported language (a human still reads the replies for wit):
//   - another language's characters inside a reply (a Chinese phrase in a Japanese reply, kana in a Chinese one, Chinese in an English one);
//   - English words inside a Chinese or Japanese reply ("netrunner" dropped into a Chinese sentence);
//   - the same opener twice in a conversation, including short ones such as "Ah", "唉" or "あー";
//   - customer-service phrasing ("feel free to ask", "您", "お手伝いします", "no dudes en", "обращайтесь").
// Pure functions, no model, tested in tests/multilingual-checks.test.mjs.

const HAN = /[㐀-鿿]/, KANA = /[぀-ヿ]/, HANGUL = /[가-힯ᄀ-ᇿ]/, CYRILLIC = /[Ѐ-ӿ]/;
// Characters Simplified Chinese uses and Japanese does not
const CHINESE_ONLY = /[觉吗这们说]|怎么/;

export function foreignScripts(lang, reply) {
  const found = [];
  const has = (re, label) => { if (re.test(reply)) found.push(label); };
  switch (lang) {
    case "en": case "es":
      has(HAN, "Chinese or Japanese characters"); has(KANA, "kana"); has(HANGUL, "Korean"); has(CYRILLIC, "Cyrillic"); break;
    case "ru":
      has(HAN, "Chinese or Japanese characters"); has(KANA, "kana"); has(HANGUL, "Korean"); break;
    case "zh-Hans": case "zh-Hant":
      has(KANA, "Japanese kana"); has(HANGUL, "Korean"); has(CYRILLIC, "Cyrillic"); break;
    case "ja":
      has(CHINESE_ONLY, "Chinese-only characters"); has(HANGUL, "Korean"); has(CYRILLIC, "Cyrillic"); break;
    default: break;
  }
  return found.map(label => `${label} inside a ${lang} reply`);
}

// Words that are fine inside a Chinese or Japanese reply: her name, the District, and common abbreviations
const ALLOWED_LATIN = new Set(["iris", "the", "darknet", "district", "qr", "ai", "cpu", "gpu", "usb", "wifi", "ok", "dna", "ps"]);
export function latinWordsInCjk(lang, reply) {
  if (!["zh-Hans", "zh-Hant", "ja"].includes(lang)) return [];
  return (reply.match(/[A-Za-z]{3,}/g) ?? []).filter(word => !ALLOWED_LATIN.has(word.toLowerCase()));
}

// How a reply begins: its first word (Latin scripts) or first two characters (Chinese, Japanese), lowercase
const FUNCTION_WORDS = new Set(["the", "i", "it", "that", "this", "you", "he", "she", "if", "and", "but", "so", "a", "to", "in", "my", "your", "is", "its", "el", "la", "es", "no", "y", "si", "tu", "yo", "que", "se", "lo", "un", "una", "что", "это", "я", "ты", "он", "если", "но", "и", "в", "не", "как"]);
export function openerKey(reply) {
  const clause = String(reply ?? "").trim().split(/[,.!?;:…。！？，、—\n]/)[0].trim().toLowerCase();
  const latin = /^[\p{L}']+/u.exec(clause);
  if (latin && !/^[㐀-鿿぀-ヿ]/.test(clause)) return latin[0];
  return [...clause].slice(0, 2).join("");
}
// True when this opener was already used earlier in the conversation; records it. Function words ("the", "that") do not count.
export function repeatsOpener(reply, seen) {
  const key = openerKey(reply);
  if (!key) return false;
  const repeated = !FUNCTION_WORDS.has(key) && seen.includes(key);
  seen.push(key);
  return repeated;
}

const CUSTOMER_SERVICE = {
  en: /feel free to|don'?t hesitate|let me know if|how can i (?:help|assist)|i'?m here to help|hope (?:this|that) helps/i,
  "zh-Hans": /您|请问|有什么可以帮|有什么我能帮|希望对你有帮助|如有需要|随时(?:可以)?(?:找|联系)我|很高兴为你/,
  "zh-Hant": /您|請問|有什麼可以幫|有什麼我能幫|希望對你有幫助|如有需要|隨時(?:可以)?(?:找|聯繫)我|很高興為你/,
  ja: /お手伝い(?:します|できます)|ご不明|いつでもお声|お問い合わせ|ございます|させていただ/,
  es: /no dudes en|estoy aquí para ayudarte|en qué puedo ayudarte|espero que esto ayude/i,
  ru: /не стесняйтесь|обращайтесь|рад помочь|надеюсь, это поможет|чем могу помочь/i,
};
export function customerServicePhrase(lang, reply) { return Boolean(CUSTOMER_SERVICE[lang]?.test(reply)); }

// ---- Chinese voice: punchy and entertaining, not a counsellor or a service bot ---------------------------------------------------------
// For an ordinary (not serious) reply. These are flags for a human to read; the "what do you do here?" answer is allowed to be longer and to offer help.
const COUNSELLOR = /我理解你的感受|我能理解|听上去|聽上去|听起来|聽起來|这很正常|這很正常|这是正常的|沟通是关键|沟通很重要|照顾好自己|真诚的沟通|开诚布公|表达(?:出)?(?:自己的)?(?:感受|情绪)/;
const TAG_QUESTION_AT_END = /[，,、]\s*(?:是吧|对吧|不是吧|不是吗|对不对|是不是)\s*[？?]\s*(?:\p{Extended_Pictographic}\s*)*$/u;
const SERVICE_BOT = /助手|乐意(?:为你)?(?:提供)?帮助|尽管开口|随时找我/;
export const CHINESE_CASUAL_MAX = 110;
const CHINESE_ADVICE_MAX = 180; // practical advice may run longer than banter
export function chineseVoiceProblems(reply, kind = "") {
  const problems = [];
  if (SERVICE_BOT.test(reply)) problems.push("service-bot phrasing");
  if (kind === "control") return problems;
  if (COUNSELLOR.test(reply)) problems.push("counsellor language");
  if (TAG_QUESTION_AT_END.test(reply.trim())) problems.push("ends on a tag question");
  const length = [...reply].length;
  if (length > (kind === "advice" ? CHINESE_ADVICE_MAX : CHINESE_CASUAL_MAX)) problems.push(`long for casual banter (${length} characters)`);
  return problems;
}
