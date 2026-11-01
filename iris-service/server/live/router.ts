// Decides whether a visitor's message asks for live information, and which kind. Plain pattern matching: no extra
// model call, no network, nothing happens unless the visitor clearly asks (weather, earthquakes, news). Ordinary
// conversation, figures of speech ("under the weather", "brainstorm") and narration never trigger a lookup.
import type { Topic } from "./news";

export type LiveIntent =
  | { kind: "weather"; place: string | null; dayOffset: number; multiDay: boolean; here: boolean }
  | { kind: "quake"; place: string | null; strongest: boolean; days: number; minMag?: number; here: boolean }
  | { kind: "news"; topic: Topic; terms: string[]; days: number };
export interface LastLive { kind: LiveIntent["kind"]; place: string | null; topic?: Topic; at: number }

const fold = (s: string) => s.normalize("NFKC").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const WEATHER = /\b(weather|forecast|temperature|how (?:hot|cold|warm|cool|humid)|is it (?:raining|snowing|sunny|cold|hot|windy|humid|foggy|warm|freezing|cloudy)|(?:will|is|does|did) it (?:rain|snow|storm)|raining|snowing|humidity|heat ?wave|cold snap|hurricane|typhoon|tornado|blizzard|umbrella|degrees (?:in|out))\b|天气|天氣|气温|氣溫|温度|溫度|下雨|下雪|预报|預報|台风|颱風|天気|気温|клима|погод|прогноз погоды|температур|дожд|\b(?:clima|tiempo en|tiempo hace|que tiempo|pronostico|llueve|lluvia|hace (?:frio|calor))\b/u;
const STORM = /\b(?:storms?|thunderstorms?|lightning)\b/;
const FIGURATIVE = /\b(under the weather|weather the storm|weather (?:this|that|it|these)|fair.?weather|brainstorm|perfect storm|firestorm|storm of|storm in a|shit ?storm|snowflake|rain ?check|rainmaker|stormtrooper|heat of the moment|cold (?:war|case|call|shoulder|blooded|hearted)|hot take|degrees? of freedom)\b/;
const QUAKE = /\b(earthquakes?|quakes?|seismic|tremors?|aftershocks?|tsunamis?)\b|地震|海啸|海嘯|津波|\b(?:terremotos?|sismos?|temblor(?:es)?)\b|землетрясени|цунами/u;
const QUAKE_FIGURATIVE = /\b(earthquake of|emotional earthquake|quake in (?:my|your) (?:heart|soul)|shook my world)\b/;
const NEWS = [
  /\b(?:latest|recent|current|today'?s|breaking|top|big|biggest|main)\s+(?:\w+\s+){0,2}(?:news|headlines?|stories|story)\b/,
  /\bnews\s+(?:about|on|from|of|today|tonight|this (?:week|morning))\b|\bany(?:thing| new)?\s+news\b|\bheadlines?\b|\bbreaking\b|\bwhat'?s? the news\b/,
  /\bwhat(?:'s| is| has| was)?\s+(?:happening|going on|new)\s+(?:with|at|in|on|around)\b|\bwhat happened (?:with|to|at|in|today)\b|\bwhat did\s+.{2,40}?\s+(?:announce|release|say|launch|reveal|unveil)\b/,
  /\b(?:announcement|announced|controversy|scandal|lawsuit|data breach|layoffs?|earnings report|privacy (?:issue|controversy|fine))\b/,
  /新闻|新聞|头条|頭條|最新消息|ニュース|\b(?:noticias|ultimas noticias)\b|новост/u,
];
const QUESTIONISH = /[?？]|^(?:what|whats|what's|how|is|are|will|does|do|did|can|could|tell|check|show|give|any|where|when|which|got|hows|how's|please|iris|hey|hi|yo)\b|^(?:请|請|帮|幫|查|告诉|告訴|有没有|有沒有|现在|現在|今天|今日|最近)|天气|天氣|何|教えて|какая|какой|есть|что|как\b|¿|cual|que\b|dime|hay\b|como\b/u;

const TOPICS: Array<[Topic, RegExp]> = [
  ["ai", /\b(ai|a\.i\.|artificial intelligence|openai|chatgpt|gpt-?\d|llms?|anthropic|claude|gemini|deepmind|machine learning|neural net|人工智能|ai新闻)\b|人工智能|人工知能/],
  ["cyber", /\b(cyber|cybersecurity|hack(?:ed|ers?|ing)?|breach|ransomware|malware|vulnerabilit(?:y|ies)|zero.day|phishing|infosec|ddos)\b|网络安全|網絡安全|サイバー/],
  ["space", /\b(space|nasa|spacex|rocket|mars|moon|lunar|satellite|astronaut|orbit|esa|jwst|telescope)\b|太空|航天|宇宙/],
  ["science", /\b(science|scientists?|research|study|physics|biology|climate|medicine|vaccine|discovery)\b|科学|科學|科研/],
  ["business", /\b(business|markets?|stocks?|economy|economic|inflation|earnings|finance|financial|company|companies|corporations?|corporate|merger|acquisition|ipo|layoffs?|trade war|tariffs?)\b|商业|商業|经济|經濟|财经|財經/],
  ["politics", /\b(politics|political|government|election|congress|senate|parliament|policy|regulation|law|legislation|president|minister|white house)\b|政治|选举|選舉|政府/],
  ["tech", /\b(tech|technology|gadgets?|software|chips?|semiconductors?|apps?|smartphones?|iphone|android|silicon valley|big tech|startups?|privacy|surveillance|data|internet|online|platform)\b|科技|技术|技術/],
  ["world", /\b(world|international|global|war|conflict|ceasefire|abroad|overseas)\b|国际|國際|世界/],
];
const STOP_TERMS = new Set(["what", "whats", "what's", "tell", "give", "show", "any", "the", "latest", "recent", "news", "headlines", "headline", "breaking", "today", "tonight", "about", "with", "from", "please", "iris", "hey", "hi", "is", "are", "was", "did", "does", "happening", "going", "announce", "announced", "announcement", "i", "you", "me", "my", "ai", "tech", "big", "that", "this", "those", "these", "there", "here", "controversy", "scandal", "lawsuit", "privacy", "company", "corporation", "corporate"]);

function wordCount(text: string): number {
  const cjk = (text.match(/[぀-ヿ㐀-鿿]/g) ?? []).length;
  return text.replace(/[぀-ヿ㐀-鿿]+/g, " ").trim().split(/\s+/).filter(Boolean).length + Math.ceil(cjk / 2);
}

const PLACE_STOP = /^(?:it|its|it's|the|my|your|our|a|an|this|that|these|those|here|there|general|case|fact|order|terms|time|any|every|some|all|case|particular|short|long|total|detail|real|truth|theory|principle|practice|addition|spite|front|back|touch|love|charge|control|person|public|private|nature|reality)\b/i;
const TRAILING = /\s+(?:today|tomorrow|tonight|now|right|this|next|please|pls|plz|and|or|but|then|currently|at|on|with|because|since|so|is|will|looks?|like|the|a|weekend|week|morning|afternoon|evening|again|too|there|though|anyway|thanks|lol|btw|exactly)$/i;
const CITY_RE = /(?:\b(?:in|at|for|near|around|across|over|from|en)|(?<![\p{L}])в)\s+([\p{L}][\p{L}.'’-]*(?:[ ,]+[\p{L}][\p{L}.'’-]*){0,3})/giu;

export function extractPlace(text: string): string | null {
  const zh = /([一-鿿]{2,6}?)(?:市|县|縣)?(?:今天|明天|后天|後天|现在|現在|的|最近|附近)*(?:天气|天氣|气温|氣溫|温度|溫度|地震|下雨|下雪|台风|颱風)/.exec(text) ?? /(?:在|去|到|关于|關於)([一-鿿]{2,6})(?:的)?(?:天气|天氣|地震|下雨|下雪|新闻|新聞)?/.exec(text);
  if (zh && !/^(?:今天|明天|现在|現在|最近|这里|這裡|那里|那裡|我们|我們)$/.test(zh[1])) return zh[1];
  const ja = /([぀-ヿ一-鿿]{2,8})の(?:天気|気温|地震)/.exec(text);
  if (ja) return ja[1];
  const before = /\b([A-Z\p{Lu}][\p{L}.'’-]+(?:\s[A-Z\p{Lu}][\p{L}.'’-]+){0,2})\s+(?:weather|forecast|temperature|earthquakes?|quakes?)\b/u.exec(text);
  if (before && !/^(?:What|How|Is|Will|The|Today|Tomorrow|Iris|Hey|Any|Tell|Check|Whats|Local|Current|Recent|Latest)$/i.test(before[1])) return before[1];
  const how = /\bhow (?:hot|cold|warm|cool|humid|windy) (?:is|was|will it be|will)\s+(?:it\s+(?:in|at)\s+)?([\p{L}][\p{L}.'’-]+(?:\s[\p{L}][\p{L}.'’-]+){0,2})/iu.exec(text);
  if (how) {
    let candidate = how[1];
    while (TRAILING.test(candidate)) candidate = candidate.replace(TRAILING, "");
    if (candidate && !PLACE_STOP.test(candidate)) return candidate;
  }
  for (const m of text.matchAll(CITY_RE)) {
    let candidate = m[1].trim().replace(/[ ,]+$/, "");
    while (TRAILING.test(candidate)) candidate = candidate.replace(TRAILING, "");
    if (!candidate || PLACE_STOP.test(candidate)) continue;
    // "in Sacramento, California" stays whole; "in love" and "in general" were removed by PLACE_STOP, and the geocoder is the last judge
    if (candidate.split(/\s+/).length <= 4 && candidate.length >= 2) return candidate;
  }
  return null;
}

const here = (t: string) => /\b(?:here|my (?:area|city|town|location|place|neighbou?rhood)|near me|around me|outside|where i am|where i live)\b|我这里|我這裡|我这儿|我附近|我所在/.test(t);

function dayOf(f: string, raw: string): { dayOffset: number; multiDay: boolean } {
  if (/\bday after tomorrow\b|后天|後天|pasado manana|послезавтра/.test(f + raw)) return { dayOffset: 2, multiDay: false };
  if (/\btomorrow\b|明天|明日|\bmanana\b|завтра/.test(f + raw)) return { dayOffset: 1, multiDay: false };
  if (/\b(?:this week|weekend|next few days|few days|5.?day|7.?day|week ahead|forecast for the week|this weekend)\b|这周|這週|一周|一週|本周|今週/.test(f + raw)) return { dayOffset: 0, multiDay: true };
  return { dayOffset: 0, multiDay: false };
}

export function routeLive(text: string, last: LastLive | null = null, now: number = Date.now()): LiveIntent | null {
  if (typeof text !== "string") return null;
  const raw = text.trim();
  if (!raw || raw.length > 500 || raw.startsWith("[user triggered")) return null;
  const f = fold(raw);
  const asking = QUESTIONISH.test(f) || QUESTIONISH.test(raw);
  const recent = last && now - last.at < 10 * 60_000 ? last : null;

  if (QUAKE.test(f) && !QUAKE_FIGURATIVE.test(f) && (asking || wordCount(raw) <= 6)) {
    const mag = /(?:magnitude|mag\.?|m)\s*(?:above|over|at least|>=?|greater than)?\s*(\d(?:\.\d)?)\s*\+?/.exec(f);
    return {
      kind: "quake", place: extractPlace(raw), here: here(f),
      strongest: /\b(?:biggest|largest|strongest|worst|most powerful|deadliest)\b|最大|最强|最強/.test(f),
      days: /\b(?:this month|past month|last month|30 days)\b|这个月|這個月/.test(f) ? 30 : /\b(?:this week|past week|last week|7 days|week)\b|这周|這週|本周|一周/.test(f) ? 7 : 1,
      minMag: mag && Number(mag[1]) >= 1 && Number(mag[1]) <= 9 && /magnitude|mag|\+|above|over|least/.test(mag[0]) ? Number(mag[1]) : undefined,
    };
  }
  if ((WEATHER.test(f) || (STORM.test(f) && (here(f) || extractPlace(raw)))) && !FIGURATIVE.test(f) && (asking || wordCount(raw) <= 6)) {
    return { kind: "weather", place: extractPlace(raw), here: here(f), ...dayOf(f, raw) };
  }
  if (NEWS.some(re => re.test(f) || re.test(raw)) && (asking || wordCount(raw) <= 8)) {
    const topic = TOPICS.find(([, re]) => re.test(f) || re.test(raw))?.[0] ?? "general";
    return { kind: "news", topic, terms: extractTerms(raw), days: /\btoday|tonight|this morning|今天|今日|сегодня\b/.test(f) ? 1 : /\bthis week|past week\b/.test(f) ? 7 : 3 };
  }
  // A short follow-up to the last live answer: "and tomorrow?", "what about Tokyo?", "any bigger ones?", "and tech news?"
  if (recent && wordCount(raw) <= 7 && /^(?:and|what about|how about|ok(?:ay)?,? (?:and|what about)|also|then|and what about)\b|^(?:那|那么|那麼|还有|還有)|^(?:和|と|а |и )/.test(f)) {
    if (recent.kind === "weather") {
      const place = extractPlace(raw) ?? bareName(raw);
      return { kind: "weather", place: place ?? recent.place, here: false, ...dayOf(f, raw) };
    }
    if (recent.kind === "quake") {
      return { kind: "quake", place: extractPlace(raw) ?? bareName(raw) ?? recent.place, here: false, strongest: /\b(?:bigger|biggest|larger|stronger|strongest|worst)\b/.test(f), days: /\bweek\b/.test(f) ? 7 : 1 };
    }
    if (recent.kind === "news") {
      const topic = TOPICS.find(([, re]) => re.test(f))?.[0];
      return { kind: "news", topic: topic ?? recent.topic ?? "general", terms: topic ? [] : extractTerms(raw), days: 3 };
    }
  }
  return null;
}

// "what about Tokyo?" -> "Tokyo"
function bareName(raw: string): string | null {
  const m = /^(?:and |ok(?:ay)?,? )?(?:what|how) about\s+(?:in\s+)?([\p{L}][\p{L}.'’-]*(?:\s[\p{L}][\p{L}.'’-]*){0,2})\s*[?!.]*$/iu.exec(raw.trim());
  return m && !PLACE_STOP.test(m[1]) && !/^(?:tomorrow|today|tonight|the weekend|this week|next week)$/i.test(m[1]) ? m[1] : null;
}

// Named subjects in a news question: "What did Apple announce?", "news about Meta privacy", quoted phrases
export function extractTerms(text: string): string[] {
  const terms: string[] = [];
  for (const m of text.matchAll(/["“”']([^"“”']{2,40})["“”']/g)) terms.push(m[1].trim());
  const about = /\b(?:news|headlines?|stories|happening|going on|happened|updates?)\s+(?:about|on|with|at|regarding|from|of)\s+([\p{L}\p{N}][\p{L}\p{N}.&'’-]*(?:\s[\p{L}\p{N}][\p{L}\p{N}.&'’-]*){0,2})/iu.exec(text);
  if (about) terms.push(about[1]);
  const did = /\bwhat did\s+([\p{Lu}][\p{L}\p{N}.&'’-]*(?:\s[\p{Lu}][\p{L}\p{N}.&'’-]*){0,2})\s+(?:announce|release|say|launch|reveal|unveil)/u.exec(text);
  if (did) terms.push(did[1]);
  for (const m of text.matchAll(/(?<!^|[.!?]\s)\b([\p{Lu}][\p{L}\p{N}&'’-]{1,})(?:\s[\p{Lu}][\p{L}\p{N}&'’-]+){0,2}/gu)) terms.push(m[0]);
  const out: string[] = [];
  for (const t of terms) {
    const clean = t.replace(/[?!.,;:]+$/, "").replace(/['’]s$/i, "").trim();
    const key = clean.toLowerCase();
    if (clean.length < 2 || STOP_TERMS.has(key) || key.split(/\s+/).every(w => STOP_TERMS.has(w)) || out.some(o => o.toLowerCase() === key)) continue;
    out.push(clean);
  }
  return out.slice(0, 3);
}
