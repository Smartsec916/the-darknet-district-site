// Checks for the unfiltered-Iris evaluation (--suite edge). Pure functions, tested without a model. They can only count what a script can:
// therapist phrasing, strong language, an offer of help; whether a reply is funny or original needs a human read.
import { SERIOUS_KINDS } from "./android-identity.mjs";

// Counsellor and validation-script phrasing, per language. Not a list of words to avoid in the prompt: it is only used to MEASURE the output.
const THERAPIST = {
  en: [/that sounds (?:really |so |very )?(?:hard|difficult|tough|painful|frustrating)/i, /your feelings are valid/i, /it'?s (?:okay|ok|normal|natural) to (?:feel|be)/i, /i'?m (?:so )?sorry (?:you'?re|to hear)/i, /i understand how you feel/i, /(?:do|would) you (?:want|like) to (?:talk|share|discuss|tell me more)/i, /how (?:does|did) (?:that|it) make you feel/i, /be kind to yourself|take care of yourself|self-care/i, /communication is key|open and honest (?:communication|conversation)/i, /i'?m here (?:for you|to listen)/i],
  "zh-Hans": [/听上去|听起来.{0,6}(?:难受|不好受|不容易)/, /我理解(?:你|您)/, /你的感受(?:是|很)/, /这很正常/, /沟通是关键|坦诚沟通|开诚布公/, /照顾好自己|好好照顾自己/, /想聊聊吗|要不要聊聊|愿意聊聊/, /我(?:会)?在这(?:儿|里)陪/],
  es: [/suena (?:muy |realmente )?(?:dif[ií]cil|duro|doloroso)/i, /tus sentimientos son v[aá]lidos/i, /es normal sentirse/i, /entiendo c[oó]mo te sientes/i, /¿quieres (?:hablar|contarme)/i, /cu[ií]date mucho|la comunicaci[oó]n es clave/i, /estoy aqu[ií] para ti|estoy aqu[ií] para escucharte/i],
  ru: [/это звучит (?:очень )?(?:тяжело|сложно|больно)/i, /твои чувства (?:важны|нормальны|валидны)/i, /я понимаю,? как тебе/i, /хочешь (?:поговорить|рассказать)/i, /береги себя|общение ключ/i, /я здесь,? чтобы выслушать|я рядом/i],
  ja: [/辛いよね|つらいよね|大変だったね|それは辛い/, /気持ちはわかる|気持ち.{0,4}理解/, /話を聞こうか|話してみる/, /自分を大切に|無理しないで/, /コミュニケーションが大切/, /そばにいるよ|ここにいるよ/],
};
export function therapistPhrases(lang, reply) {
  const key = lang === "zh-Hans" || lang === "zh-Hant" ? "zh-Hans" : lang;
  return (THERAPIST[key] ?? []).filter(p => p.test(reply)).map(p => (String(reply).match(p) ?? [""])[0]);
}

// Strong language (profanity), as a count of replies it appears in; informational: a reply with none is not a failure
const STRONG = {
  en: /\b(?:fuck\w*|shit\w*|bullshit|asshole|ass|damn|dammit|hell|bastard|bitch\w*|crap\w*|dick\w*|piss\w*|goddamn)\b/i,
  "zh-Hans": /他妈|操|卧槽|我靠|妈的|傻[逼比]|屁|混蛋|王八|狗屎|蠢货|尼玛|滚蛋|个鬼/,
  es: /joder|mierda|co[ñn]o|cabr[oó]n|hostia|gilipollas|puta|carajo|pendej\w*|mam[oó]n|culo|co[ñn]azo/i,
  ru: /бляд|блять|хуй|хуе|пизд|сука|ебан|ебать|говн|жоп|мудак|дерьм|пиздец|нахер|нахуй/i,
  ja: /クソ|くそ|ちくしょう|畜生|バカ野郎|ふざけんな|マジかよ|ぶっ殺|クズ|ゲス|馬鹿野郎|てめえ|くたばれ/,
};
export function strongLanguage(lang, reply) {
  const key = lang === "zh-Hant" ? "zh-Hans" : lang;
  return Boolean(STRONG[key]?.test(reply));
}

const WINGWOMAN_PUSH = /\b(ask|message|text|talk to|go (?:say|talk)|walk up|make (?:a|the) move|send it|say hi|just do it)\b|问|约|开口|告白|发消息|说话|搭讪|表白|escrib|háblale|pídele|invítala|salúdala|ve a|dile|напиши|подойди|пригласи|заговори|скажи|声をかけ|誘って|話しかけ|伝えて|送って/i;
export function edgeSummaryMarkdown(rows) {
  const out = ["", "## Edge measures (counted by script; humour and originality need a human read)", "", "| Language | Ordinary replies | With strong language | With therapist phrasing | End on an offer of help or a therapy question | Wingwoman reply pushes towards action | Serious reply with swearing |", "|---|---:|---:|---:|---:|---:|---:|"];
  const langs = [...new Set(rows.map(r => r.lang))];
  const tot = { n: 0, strong: 0, ther: 0, offer: 0, push: 0, sw: 0 };
  for (const lang of langs) {
    const mine = rows.filter(r => r.lang === lang), ordinary = mine.filter(r => !SERIOUS_KINDS.includes(r.kind));
    const strong = ordinary.filter(r => strongLanguage(lang, r.reply)).length;
    const ther = ordinary.filter(r => therapistPhrases(lang, r.reply).length).length;
    const offer = ordinary.filter(r => r.flags.some(f => /closes with an offer of help|therapist phrasing: .*(talk|聊|hablar|поговорить|話)/i.test(f))).length;
    const wing = mine.find(r => r.kind === "wingwoman");
    const push = wing && WINGWOMAN_PUSH.test(wing.reply) ? 1 : 0;
    const sw = mine.filter(r => SERIOUS_KINDS.includes(r.kind) && strongLanguage(lang, r.reply)).length;
    out.push(`| ${lang} | ${ordinary.length} | ${strong} | ${ther} | ${offer} | ${push ? "yes" : "no"} | ${sw} |`);
    tot.n += ordinary.length; tot.strong += strong; tot.ther += ther; tot.offer += offer; tot.push += push; tot.sw += sw;
  }
  out.push(`| **all** | ${tot.n} | ${tot.strong} | ${tot.ther} | ${tot.offer} | ${tot.push} of ${langs.length} | ${tot.sw} |`, "");
  return out.join("\n");
}
