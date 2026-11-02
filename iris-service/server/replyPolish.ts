// Small, deterministic clean-ups of an ordinary chat reply, for two slips the model makes even when told not to (seen in real evaluations):
//   1. a sentence in the wrong language, for example a Chinese phrase tacked on to a Japanese reply ("...どう感じてる？你觉得怎么対吗？");
//   2. a generic closing offer ("Anything else on your radar?", "有什么我能帮忙的吗？", "何かあれば教えてね") that makes her sound like a help desk.
// It works on whole sentences, only ever removes, never rewrites, and leaves the reply alone whenever it is unsure:
//   - never a serious moment (grief, fear, a supportive stretch): there "I'm here if you want to talk" is the right thing to say;
//   - never when the visitor asked what she can do or asked for help, where an offer is the answer;
//   - never a script the visitor used themselves (they wrote Japanese, so Japanese in the reply is fine);
//   - never when it would leave nothing.
// The caller applies it only to ordinary engine turns, never to live data (English headlines inside another language are legitimate there)
// and never when the visitor asked for a translation or a bilingual answer.

const HAN = /[㐀-鿿]/;
const KANA = /[぀-ヿ]/;
const HANGUL = /[가-힯ᄀ-ᇿ]/;
const CYRILLIC = /[Ѐ-ӿ]/;
// Characters Simplified Chinese uses and Japanese does not (Japanese writes 覚, 説, 対; it has no 吗, 这, 们)
const CHINESE_ONLY = /[觉吗这们说]|怎么/;

// Splits into sentences, keeping every character, so joining the pieces gives back the original text exactly
export function sentences(text: string): string[] {
  const out: string[] = [];
  const chars = [...text];
  let current = "";
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    current += c;
    const next = chars[i + 1];
    const cjkEnd = /[。！？]/.test(c);
    const latinEnd = /[.!?…]/.test(c) && (next === undefined || /\s/.test(next) || /["'”’)\]»」』）]/.test(next));
    if (cjkEnd || latinEnd || c === "\n") {
      while (chars[i + 1] !== undefined && chars[i + 1] !== "\n" && /["'”’)\]»」』）\s]|[\u{1F300}-\u{1FAFF}☀-➿]/u.test(chars[i + 1])) current += chars[++i];
      out.push(current);
      current = "";
    }
  }
  if (current) out.push(current);
  return out;
}

const wrongScript = (sentence: string, replyLanguage: string, user: string): boolean => {
  const userHas = { han: HAN.test(user), kana: KANA.test(user), hangul: HANGUL.test(user), cyr: CYRILLIC.test(user) };
  const foreignCjk = (HAN.test(sentence) && !userHas.han) || (KANA.test(sentence) && !userHas.kana) || (HANGUL.test(sentence) && !userHas.hangul);
  switch (replyLanguage) {
    case "english": case "spanish": return foreignCjk || (CYRILLIC.test(sentence) && !userHas.cyr);
    case "russian": return foreignCjk;
    case "chinese": return (KANA.test(sentence) && !userHas.kana) || (HANGUL.test(sentence) && !userHas.hangul) || (CYRILLIC.test(sentence) && !userHas.cyr);
    case "japanese": return (CHINESE_ONLY.test(sentence) && !CHINESE_ONLY.test(user)) || (HANGUL.test(sentence) && !userHas.hangul) || (CYRILLIC.test(sentence) && !userHas.cyr);
    default: return false; // other languages: left alone
  }
};

// A sentence that is only an offer to help or an "anything else?"
const CLOSING_OFFER: RegExp[] = [
  /^\W*(?:anything else|is there anything|any other (?:concerns|questions)|what else can i|how else can i|how can i (?:help|assist)|can i help|let me know if|feel free to|don'?t hesitate|i'?m (?:always )?here (?:if|whenever|to help|for you)|if you (?:need|want) (?:anything|to talk|someone)|if there'?s anything)/i,
  /(?:有什么|还有什么|還有什麼|有任何|如果有).{0,10}(?:帮忙|帮助|幫忙|幫助|需要|问题|問題|想聊|想知道)|随时(?:可以)?(?:找我|告诉我|联系我|来找我)|隨時(?:可以)?(?:找我|告訴我|聯繫我|來找我)|想了解更多|尽管(?:开口|说|问)|盡管(?:開口|說|問)|需要的话|需要的話/,
  /(?:何か|他に|もし).{0,12}(?:あれば|ありますか|手伝|教えて|相談)|いつでも(?:声|頼|相談|言って)|相談に乗る/,
  /^\W*(?:¿?(?:algo|alguna|hay algo) (?:más|otra)|en qué (?:más )?puedo|no dudes|estoy aquí (?:si|para|por)|si necesitas|cualquier cosa)/i,
  /^\W*(?:что-нибудь ещё|чем (?:ещё )?(?:могу|помочь)|обращайся|если (?:что|нужно|понадобится)|не стесняйся|я (?:тут|здесь) (?:если|для))/i,
];

// The visitor is asking what she can do, who she is, or for help: an offer to help is then a real answer, not a habit
const ASKS_ABOUT_HER_ROLE =
  /\bhelp\b|assist|what (?:do|can) you|who are you|what are you|how do you work|what'?s your (?:job|role)|帮|幫|你(?:是|能|可以|在这|在這)|ayud|qu[eé] (?:haces|puedes)|qui[eé]n eres|помо|чем.{0,12}занимаешь|что ты|кто ты|何ができ|何をして|助けて|手伝/i;

// The visitor is talking about languages (asking how to say something, what a word means, to teach or switch language): a reply in several
// languages is then exactly what they asked for, so nothing is removed for language
const LANGUAGE_CUE =
  /language|translat|how do you say|what does .{1,40} mean|word for|\bspeak\b|english|chinese|japanese|spanish|russian|korean|french|german|italian|portuguese|idioma|traduc|espa[ñn]ol|ingl[eé]s|chino|japon[eé]s|ruso|coreano|язык|перев|английск|китайск|японск|испанск|русск|корейск|言語|翻訳|英語|中国語|日本語|スペイン語|ロシア語|韓国語|语言|語言|翻译|翻譯|英文|中文|日文|日语|西班牙语|俄语|韩语|汉语|漢語|普通话|普通話/i;

export interface PolishInput { text: string; replyLanguage: string; userMessage: string; serious: boolean }
export interface PolishResult { text: string; removedForLanguage: number; removedOffers: number }

export function polishReply(input: PolishInput): PolishResult {
  const { text, replyLanguage, userMessage, serious } = input;
  const unchanged: PolishResult = { text, removedForLanguage: 0, removedOffers: 0 };
  if (!text || serious) return unchanged;
  let parts = sentences(text);
  if (parts.length < 2) return unchanged;

  // 1. sentences in the wrong language
  const language = LANGUAGE_CUE.test(userMessage) ? [] : parts.filter(s => wrongScript(s, replyLanguage, userMessage));
  let removedForLanguage = 0;
  if (language.length && language.length < parts.filter(s => s.trim()).length) {
    parts = parts.filter(s => !wrongScript(s, replyLanguage, userMessage));
    removedForLanguage = language.length;
  }

  // 2. a generic closing offer, at most two, only at the very end, and only when it is not the answer to what was asked
  let removedOffers = 0;
  if (!ASKS_ABOUT_HER_ROLE.test(userMessage)) {
    for (let pass = 0; pass < 2; pass++) {
      const real = parts.filter(s => s.trim());
      if (real.length < 2) break;
      const last = real[real.length - 1];
      if (!CLOSING_OFFER.some(pattern => pattern.test(last.trim()))) break;
      parts = parts.slice(0, parts.lastIndexOf(last));
      removedOffers++;
    }
  }

  if (!removedForLanguage && !removedOffers) return unchanged;
  const cleaned = parts.join("").trim();
  return cleaned ? { text: cleaned, removedForLanguage, removedOffers } : unchanged;
}
