// Small, deterministic clean-ups of an ordinary chat reply, for slips the model makes even when told not to (all seen in real evaluations):
//   1. a sentence in the wrong language, for example a Chinese phrase tacked on to a Japanese reply ("...どう感じてる？你觉得怎么対吗？");
//   2. a generic closing offer of service ("Anything else on your radar?", "有什么我能帮忙的吗？", "いつでもサポートしますよ！") that makes her sound like a help desk;
//   3. more emoji than the engine allowed on this turn (the engine allows one on about a third of replies; Chinese replies had one on five in six).
// It only ever removes, never rewrites, and leaves the reply alone whenever it is unsure:
//   - never a serious moment (grief, fear, a supportive stretch): there "I'm here if you want to talk" is exactly right;
//   - emotional presence is NOT a closing offer ("I'm here for you", "я рядом", "estoy aquí contigo", "ここにいるよ" stay): only offers of service go;
//   - never when the visitor asked what she can do or asked for help, where an offer is the answer;
//   - never when the visitor is talking about languages (a reply in several languages is then what they asked for), nor a script they used;
//   - a whole sentence goes only when it STARTS with the offer or is short; a long sentence that merely ends with an offer loses only that last clause,
//     so useful advice in the same sentence stays; and nothing is cut if too little would remain;
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

// Generic offers of SERVICE. Emotional presence ("I'm here for you", "я рядом", "estoy aquí contigo", "ここにいるよ") is deliberately not here.
const OFFER_SOURCES: string[] = [
  // English: offers of service and "anything else (on your mind)?"; not "anything else he said?" or "let me know if he answers"
  "anything else[?!.\s]*$|anything else (?:i can|you(?:'d| would)? (?:like|want|need)|on your (?:mind|radar|plate)|that|to (?:ask|add|know|talk))|is there anything (?:else|i can|you)|any other (?:concerns|questions)|what else can i|how else can i|how can i (?:help|assist)|can i help|let me know if you (?:need|want|have)|feel free to (?:ask|reach|contact|message|let me know|come back|talk to me)|don'?t hesitate (?:to )?(?:ask|reach|contact|message)|i'?m (?:always )?here to help|if you need anything|if there'?s anything|(?:do you )?want to (?:talk|chat|vent|share|unpack)(?: about (?:it|that|this)| more)?[?]|would you like to (?:talk|share|discuss|unpack)|how (?:does|do) (?:that|this) make you feel|how are you feeling|i'?m here to listen",
  // Chinese: 有什么...帮忙 / 还有什么想聊的 / 随时找我 / 想了解更多 / 尽管说; not "如果有什么问题让你犹豫" (advice)
  "有什么.{0,16}(?:帮忙|帮助|幫忙|幫助|可以帮|能帮|可以幫|能幫)|(?:还有|還有)什么.{0,8}(?:想聊|想和我|想跟我|想知道|需要|问题|問題)|(?:非常|很)?乐意(?:为你|為你)?(?:提供)?(?:帮助|幫助|帮忙|幫忙)|有任何.{0,6}(?:问题|問題|需要).{0,8}(?:随时|隨時|尽管|盡管|告诉我|告訴我|找我)|随时(?:可以)?(?:找我|告诉我|联系我|来找我)|隨時(?:可以)?(?:找我|告訴我|聯繫我|來找我)|想了解更多|尽管(?:开口|说|问)|盡管(?:開口|說|問)|需要的话.{0,8}(?:随时|隨時|尽管|盡管|找我|告诉我|告訴我)|想(?:聊聊|说说|說說|谈谈|談談)(?:吗|嗎)|要不要(?:聊聊|说说|說說|谈谈|談談)|愿意(?:聊聊|说说|說說|分享)|你(?:现在)?感觉(?:怎么样|如何)|(?:还|還)?(?:能|可以)(?:为你|為你|给你|給你)?提供(?:些|一些|点|點)?.{0,12}(?:建议|建議|帮助|幫助|服务|服務|点子|主意)",
  // Japanese: 何かあれば / 他に何か / いつでもサポート...; not "もし彼がそう言ったら教えて" (a curious invitation)
  "何かあれば|他に(?:も)?何か|何か(?:困った|あったら|手伝)|いつでも(?:声|頼|相談|言って|サポート|お手伝い|力に)|サポートしますよ|お手伝いしますよ|相談に乗る|何でも(?:言って|聞いて|相談)|話してみ(?:る|ない)|話を聞こうか|どんな気持ち",
  // Spanish: ¿Algo más? / ¿en qué puedo...? / no dudes en preguntar / si necesitas algo; not "Si necesitas una razón..." (advice)
  "¿?(?:algo|alguna|hay algo) (?:más|otra)|en qué (?:más )?puedo|no dudes (?:en )?(?:preguntar|escribir|contactar|decirme|pedir)|si necesitas (?:algo|cualquier cosa|ayuda)|(?:para )?cualquier cosa que necesites|¿?(?:quieres|te gustar[ií]a) (?:hablar|contarme|platicar)(?: de ello| sobre eso| m[aá]s)?|c[oó]mo te sientes",
  // Russian: обращайся / пиши если что / рада продолжить беседу / если есть ещё вопросы или темы; not "Если что-то не получится..." (advice)
  "что-нибудь ещё|что-нибудь еще|чем (?:ещё |еще )?(?:могу|помочь)|обращайся|обращайтесь|если (?:что|нужно|понадобится)[,\s—-]*(?:пиши|пишите|обращайся|обращайтесь|спрашивай|звони)|не стесняйся|(?:всегда |буду )?рад[а]? (?:продолжить|помочь|поболтать|пообщаться)|если есть (?:ещё |еще )?(?:какие-то )?(?:вопросы|темы)|хочешь (?:поговорить|рассказать|обсудить)(?: об этом)?|как ты себя чувствуешь|я готов[а]? выслушать",
];
const OFFER_ANYWHERE = OFFER_SOURCES.map(source => new RegExp(source, "iu"));
const OFFER_AT_START = OFFER_SOURCES.map(source => new RegExp(`^[\\s\\p{P}¿¡]*(?:${source})`, "iu"));

// The visitor is asking what she can do, who she is, or for help: an offer to help is then a real answer, not a habit
const ASKS_ABOUT_HER_ROLE =
  /\bhelp\b|assist|what (?:do|can) you|who are you|what are you|how do you work|what'?s your (?:job|role)|帮|幫|你(?:是|能|可以|在这|在這)|ayud|qu[eé] (?:haces|puedes)|qui[eé]n eres|помо|чем.{0,12}занимаешь|что ты|кто ты|何ができ|何をして|助けて|手伝/i;

// The visitor is talking about languages (asking how to say something, what a word means, to teach or switch language): a reply in several
// languages is then exactly what they asked for, so nothing is removed for language
const LANGUAGE_CUE =
  /language|translat|how do you say|what does .{1,40} mean|word for|\bspeak\b|english|chinese|japanese|spanish|russian|korean|french|german|italian|portuguese|idioma|traduc|espa[ñn]ol|ingl[eé]s|chino|japon[eé]s|ruso|coreano|язык|перев|английск|китайск|японск|испанск|русск|корейск|言語|翻訳|英語|中国語|日本語|スペイン語|ロシア語|韓国語|语言|語言|翻译|翻譯|英文|中文|日文|日语|西班牙语|俄语|韩语|汉语|漢語|普通话|普通話/i;

const cjkHeavy = (s: string) => ((s.match(/[㐀-鿿぀-ヿ]/g) ?? []).length) > s.trim().length / 3;
const isShort = (s: string) => (cjkHeavy(s) ? [...s.trim()].length <= 36 : s.trim().split(/\s+/).length <= 14);
const minRemainder = (s: string) => (cjkHeavy(s) ? 6 : 18);

// A sentence that is (or, for a long sentence, ends with) a generic offer of service. Returns what to do with it.
function offerAction(sentence: string): { kind: "none" } | { kind: "drop" } | { kind: "trim"; kept: string } {
  const text = sentence.trim();
  if (!text) return { kind: "none" };
  if (OFFER_AT_START.some(p => p.test(text))) return { kind: "drop" };                  // starts with the offer: the whole sentence is the offer
  if (isShort(text) && OFFER_ANYWHERE.some(p => p.test(text))) return { kind: "drop" };   // a short sentence that is the offer
  // a long sentence: only a final clause may go, and only if enough remains
  const body = text.replace(/[\s。！？.!?…]+$/u, "");
  const cut = Math.max(...[",", "，", "、", ";", "；", " — ", " – "].map(separator => body.lastIndexOf(separator)));
  if (cut > 0) {
    const finalClause = body.slice(cut).replace(/^[\s,，、;；—–-]+/u, "");
    const remainder = body.slice(0, cut).trim();
    if (OFFER_ANYWHERE.some(p => p.test(finalClause)) && remainder.length >= minRemainder(body)) {
      const end = /[。！？.!?…]+$/u.exec(text)?.[0] ?? (cjkHeavy(text) ? "。" : ".");
      return { kind: "trim", kept: remainder + (cjkHeavy(text) && !/[。！？]/.test(end) ? "。" : end) };
    }
  }
  return { kind: "none" };
}

// A tag question closing a Chinese reply, after a comma: "，是吧？" "，不是吗？" "，对吧？" (an emoji after it is kept)
const TAG_QUESTION_END = /[，,、]\s*(?:是吧|对吧|不是吧|不是吗|对不对|是不是|好不好|行不行|好吗|行吗)\s*[？?]\s*((?:\p{Extended_Pictographic}\s*)*)$/u;

// A closing question that is only a hook: short, and one of the stock forms. Anything with a question word, or longer than a few words, is a real question.
const HOOK_QUESTION = /^(?:你)?(?:觉得)?(?:怎么想|怎么看|怎么样|如何|呢|好玩吗|有趣吗|有意思吗|有没有.{0,8}|敢不敢.{0,6}|敢吗|是不是|对不对|对吧|是吧|不是吗|不是吧|好不好|行不行|好吗|行吗|要不要试试|想不想试试|心动吗|怎么想呢|这样做有没有.{0,8}|是不是很.{0,6})[？?]*$/u;
const WH_WORD = /什么|谁|哪|为什么|为啥|多少|几|怎么做|怎样|何时|什么时候/;
function trimHookQuestion(text: string): string | null {
  const trailing = /(\s*(?:\p{Extended_Pictographic}\s*)*)$/u.exec(text)?.[1] ?? "";
  const bare = text.replace(/(?:\p{Extended_Pictographic}|\s)+$/u, "");
  if (!/[？?]$/u.test(bare)) return null;
  const withoutMark = bare.replace(/[？?]+$/u, "");
  const cut = Math.max(withoutMark.lastIndexOf("。"), withoutMark.lastIndexOf("！"), withoutMark.lastIndexOf("？"), withoutMark.lastIndexOf("!"), withoutMark.lastIndexOf("，"), withoutMark.lastIndexOf(","));
  const clause = withoutMark.slice(cut + 1).trim();
  const head = withoutMark.slice(0, cut + 1).trim();
  if (!clause || WH_WORD.test(clause) || !HOOK_QUESTION.test(clause + "？")) return null;
  const kept = head.replace(/[，,、\s]+$/u, "");
  if (kept.replace(/[。！？!?\s]|\p{Extended_Pictographic}/gu, "").length < 6) return null;   // too little would remain
  return (/[。！？!?]$/u.test(kept) ? kept : kept + "。") + trailing.trimEnd();
}

// More emoji than the engine allowed this turn: none when it said none, only the first when it allowed one
const EMOJI_SEQUENCE = /\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic}|[\u{1F3FB}-\u{1F3FF}])*/gu;
export function limitEmoji(text: string, allowed: boolean): string {
  let kept = 0;
  const out = text.replace(EMOJI_SEQUENCE, match => (allowed && kept++ === 0 ? match : ""));
  if (out === text) return text;
  return out.replace(/([。！？，、])[ \t]+(?=[㐀-鿿぀-ヿ])/gu, "$1").replace(/[ \t]{2,}/g, " ").replace(/ +([,.!?;:。！？，、])/g, "$1").replace(/[ \t]+$/gm, "").trim();
}

// Light interjections that sit badly at the start of a reply to grief or fear (a sigh like 唉 is fine and is kept)
const BREEZY_OPENING = /^\s*(?:哎呀|哎哟|哎呦|哎|嘿嘿|嘿|哈哈|嘻嘻|哇|哟|喔唷|嗨)[，,！!~～。.\s]*/u;

export interface PolishInput {
  text: string; replyLanguage: string; userMessage: string; serious: boolean;
  emojiAllowed?: boolean; // what the engine allowed this turn; leave out to leave emoji alone
  statementWanted?: boolean; // the engine asked for a statement ending: a trailing Chinese tag question ("…，是吧？") is then trimmed
}
export interface PolishResult { text: string; removedForLanguage: number; removedOffers: number; emojiRemoved: number; tagQuestionsTrimmed?: number; openingTrimmed?: number }

export function polishReply(input: PolishInput): PolishResult {
  const { text, replyLanguage, userMessage, serious } = input;
  const unchanged: PolishResult = { text, removedForLanguage: 0, removedOffers: 0, emojiRemoved: 0 };
  if (serious) {
    // a grave moment is left exactly as written, except that a Chinese reply does not open on a breezy interjection (哎呀, 嘿, 哈哈…) over someone's loss
    if (replyLanguage !== "chinese" || !text) return unchanged;
    const stripped = text.replace(BREEZY_OPENING, "").trim();
    if (stripped === text.trim() || stripped.length < 6) return unchanged;
    return { ...unchanged, text: stripped, openingTrimmed: 1 };
  }
  if (!text) return unchanged;
  let parts = sentences(text);

  // 1. sentences in the wrong language (not when the visitor is talking about languages)
  let removedForLanguage = 0;
  if (parts.length >= 2 && !LANGUAGE_CUE.test(userMessage)) {
    const wrong = parts.filter(s => wrongScript(s, replyLanguage, userMessage));
    if (wrong.length && wrong.length < parts.filter(s => s.trim()).length) {
      parts = parts.filter(s => !wrongScript(s, replyLanguage, userMessage));
      removedForLanguage = wrong.length;
    }
  }

  // 2. a generic closing offer of service, at most two, only at the very end, and only when it is not the answer to what was asked
  let removedOffers = 0;
  if (!ASKS_ABOUT_HER_ROLE.test(userMessage)) {
    for (let pass = 0; pass < 2; pass++) {
      const real = parts.filter(s => s.trim());
      if (real.length < 1) break;
      const last = real[real.length - 1];
      const action = offerAction(last);
      const index = parts.lastIndexOf(last);
      if (action.kind === "drop") {
        if (real.length < 2) break;                         // never leave nothing
        parts = parts.slice(0, index);
        removedOffers++;
      } else if (action.kind === "trim") {
        parts = [...parts.slice(0, index), action.kept];
        removedOffers++;
        break;
      } else break;
    }
  }

  let result = parts.join("").trim();
  if (!result) return unchanged;

  // 3. a Chinese tag question as the last words ("…，是吧？", "…，不是吗？") when the engine asked for a statement ending: the line stands without it
  let tagQuestionsTrimmed = 0;
  if (replyLanguage === "chinese" && input.statementWanted) {
    const trimmed = result.replace(TAG_QUESTION_END, (_m, emoji: string) => `。${emoji ?? ""}`);
    if (trimmed !== result && trimmed.replace(/[。\s]|\p{Extended_Pictographic}/gu, "").length >= 6) { result = trimmed; tagQuestionsTrimmed = 1; }
  }

  // 3b. when a statement ending was asked for, a closing Chinese question that is only a conversational hook ("有没有点心动？", "怎么想？", "好玩吗？") goes;
  // a question that asks for something specific (who, what, why, how many) or says something of its own stays
  if (replyLanguage === "chinese" && input.statementWanted) {
    for (let pass = 0; pass < 2; pass++) {
      const trimmed = trimHookQuestion(result);
      if (!trimmed) break;
      result = trimmed;
      tagQuestionsTrimmed++;
    }
  }

  // 4. emoji beyond what the engine allowed
  let emojiRemoved = 0;
  if (input.emojiAllowed !== undefined) {
    const before = (result.match(EMOJI_SEQUENCE) ?? []).length;
    result = limitEmoji(result, input.emojiAllowed);
    emojiRemoved = before - (result.match(EMOJI_SEQUENCE) ?? []).length;
  }
  if (!removedForLanguage && !removedOffers && !emojiRemoved && !tagQuestionsTrimmed) return unchanged;
  return { text: result, removedForLanguage, removedOffers, emojiRemoved, ...(tagQuestionsTrimmed ? { tagQuestionsTrimmed } : {}) };
}
