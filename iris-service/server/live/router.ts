// Decides whether a visitor's message asks for live information, and which kind. Plain pattern matching: no extra
// model call, no network, nothing happens unless the visitor clearly asks (weather, earthquakes, news). Ordinary
// conversation, figures of speech ("under the weather", "brainstorm") and narration never trigger a lookup.
import type { Topic } from "./news";

export type LiveIntent =
  | { kind: "weather"; place: string | null; dayOffset: number; multiDay: boolean; here: boolean }
  | { kind: "quake"; place: string | null; strongest: boolean; days: number; minMag?: number; here: boolean; felt?: boolean }
  | { kind: "news"; topic: Topic; terms: string[]; days: number };
export interface LastLive { kind: LiveIntent["kind"]; place: string | null; topic?: Topic; at: number; felt?: boolean }

const fold = (s: string) => s.normalize("NFKC").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const WEATHER = /\b(weather|forecast|temperature|how (?:hot|cold|warm|cool|humid)|is it (?:raining|snowing|sunny|cold|hot|windy|humid|foggy|warm|freezing|cloudy)|(?:will|is|does|did) it (?:rain|snow|storm)|raining|snowing|humidity|heat ?wave|cold snap|hurricane|typhoon|tornado|blizzard|umbrella|degrees (?:in|out))\b|天气|天氣|气温|氣溫|温度|溫度|下雨|下雪|预报|預報|台风|颱風|天気|気温|клима|погод|прогноз погоды|температур|дожд|\b(?:clima|tiempo en|tiempo hace|que tiempo|pronostico|llueve|lluvia|hace (?:frio|calor))\b/u;
const STORM = /\b(?:storms?|thunderstorms?|lightning)\b/;
const FIGURATIVE = /\b(under the weather|weather the storm|weather (?:this|that|it|these)|fair.?weather|brainstorm|perfect storm|firestorm|storm of|storm in a|shit ?storm|snowflake|rain ?check|rainmaker|stormtrooper|heat of the moment|cold (?:war|case|call|shoulder|blooded|hearted)|hot take|degrees? of freedom)\b/;
const QUAKE = /\b(earthquakes?|quakes?|seismic|tremors?|aftershocks?|tsunamis?)\b|地震|海啸|海嘯|津波|\b(?:terremotos?|sismos?|temblor(?:es)?)\b|землетрясени|цунами/u;
// A visitor who says an earthquake is happening or just happened to THEM ("I think a big earthquake just hit near me",
// "我觉得附近刚发生了一场大地震", "近くで大きな地震があった気がします", "creo que acaba de haber un terremoto", "рядом только что было землетрясение").
// That is an emergency, not a request for a list of quakes: see prepareLive().
const FELT_EN = /\b(?:earthquake|quake|tremor)s?\s+(?:just\s+)?(?:hit|struck|happened|shook)\b|\bjust\s+(?:felt|had|got)\s+(?:an?\s+)?(?:\w+\s+)?(?:earthquake|quake|tremor)\b|\bfelt\s+(?:an?|the)\s+(?:\w+\s+)?(?:earthquake|quake|tremor|shaking)\b|\b(?:ground|building|house|room|floor)\s+(?:is|was|started)\s+shaking\b|\bi\s+(?:think|feel|felt|believe)\b.*\b(?:earthquake|quake|tremor)\b|\bwhat\s+(?:should|do|can)\s+i\s+do\b|\b(?:there'?s|there\s+is)\s+(?:an?\s+)?(?:earthquake|quake)\b/;
const FELT_ZH = /(?:刚刚|剛剛|刚才|剛才|刚|剛).{0,8}地震|地震了|(?:感觉|感覺|感到|觉得|覺得|好像|似乎).{0,10}地震|(?:发生|發生)了.{0,4}地震|正在地震|(?:怎么办|怎麼辦|该怎么|該怎麼|怎么做|怎麼做|怎么应对|怎麼應對)/u;
const FELT_JA = /(?:さっき|ついさっき|先ほど|たった今|今(?![日週月年天])).{0,8}地震|地震.{0,10}(?:あった気|あったかも|あったよう|起き|来た|きた|発生した|揺れて)|揺れ.{0,6}(?:感じ|きた|来た)|(?:どうすれば|どうしたら|どうしよう|何をすれば|どうすべき)/u;
const FELT_ES = /\bacaba de (?:haber|ocurrir|pasar|temblar)\b|\b(?:creo|siento|senti|sentimos|parece)\s+que\b.{0,40}\b(?:terremoto|sismo|temblor)\b|\bque hago\b|\bque debo hacer\b|\besta temblando\b|\bha temblado\b/;
const FELT_RU = /только что|прямо сейчас|почувствовал|ощутил|что (?:мне )?делать|трясет|трясёт|качает/u;
const feltQuake = (f: string, raw: string): boolean => FELT_EN.test(f) || FELT_ZH.test(raw) || (/[぀-ヿ]/.test(raw) && FELT_JA.test(raw)) || FELT_ES.test(f) || FELT_RU.test(raw.toLowerCase());
export const isFeltQuake = feltQuake;
const QUAKE_FIGURATIVE =/\b(earthquake of|emotional earthquake|quake in (?:my|your) (?:heart|soul)|shook my world)\b/;
const NEWS = [
  /\b(?:latest|recent|current|today'?s|breaking|top|big|biggest|main)\s+(?:\w+\s+){0,2}(?:news|headlines?|stories|story)\b/,
  /\bnews\s+(?:about|on|from|of|today|tonight|this (?:week|morning))\b|\bany(?:thing| new)?\s+news\b|\bheadlines?\b|\bbreaking\b|\bwhat'?s? the news\b/,
  /\bwhat(?:'s| is| has| was)?\s+(?:happening|going on|new)\s+(?:with|at|in|on|around)\b|\bwhat happened (?:with|to|at|in|today)\b|\bwhat did\s+.{2,40}?\s+(?:announce|release|say|launch|reveal|unveil)\b/,
  /\b(?:announcement|announced|controversy|scandal|lawsuit|data breach|layoffs?|earnings report|privacy (?:issue|controversy|fine))\b/,
  /新闻|新聞|头条|頭條|最新消息|ニュース|\b(?:noticias|ultimas noticias)\b|новост/u,
  // Announcements and company news in the other languages ("what did Apple announce today?"). They ask what someone SAID or
  // RELEASED, so they are news questions even without the word "news".
  /(?:发布|發布|發佈|發表|发表|宣布|宣佈|公布|推出|披露)(?:了|過|过)?(?:什么|什麼|啥|哪些)|(?:什么|什麼).{0,6}(?:发布|發布|發佈|發表|宣布|宣佈|推出)/u,
  /(?:何|なに|なん)(?:を|か)?(?:発表|発売|公開|リリース|公表)|(?:発表|発売|公開|リリース)(?:した|された|は|って)?(?:何|なに)/u,
  /\bque\s+(?:anuncio|presento|lanzo|revelo|publico|dijo|saco)\b|\b(?:anuncio|presento|lanzo|revelo)\s+\w+\s+hoy\b/,
  /(?:что|чего)\s+(?:\S+\s+){0,3}(?:анонсировал\S*|объявил\S*|представил\S*|выпустил\S*|заявил\S*|показал\S*)|анонс\S*\s+\S+\s+(?:сегодня|вчера)/u,
];
const QUESTIONISH = /[?？]|^(?:what|whats|what's|how|is|are|will|does|do|did|can|could|tell|check|show|give|any|where|when|which|got|hows|how's|please|iris|hey|hi|yo)\b|^(?:请|請|帮|幫|查|告诉|告訴|有没有|有沒有|现在|現在|今天|今日|最近)|天气|天氣|何|教えて|какая|какой|есть|что|как\b|¿|cual|que\b|dime|hay\b|como\b/u;

const TOPICS: Array<[Topic, RegExp]> = [
  ["ai", /\b(ai|a\.i\.|artificial intelligence|openai|chatgpt|gpt-?\d|llms?|anthropic|claude|gemini|deepmind|machine learning|neural net|inteligencia artificial|人工智能|ai新闻)\b|人工智能|人工知能|искусственн\S* интеллект|нейросет/u],
  ["cyber", /\b(cyber|cybersecurity|hack(?:ed|ers?|ing)?|breach|ransomware|malware|vulnerabilit(?:y|ies)|zero.day|phishing|infosec|ddos|ciberseguridad|hackeo)\b|网络安全|網絡安全|サイバー|кибербезопасн|хакер|взлом/u],
  ["space", /\b(space|nasa|spacex|rocket|mars|moon|lunar|satellite|astronaut|orbit|esa|jwst|telescope|espacio|cohete)\b|太空|航天|宇宙|космос|ракет/u],
  ["science", /\b(science|scientists?|research|study|physics|biology|climate|medicine|vaccine|discovery|ciencia|cientificos?)\b|科学|科學|科研|наук|учёны|ученые/u],
  ["business", /\b(business|markets?|stocks?|economy|economic|inflation|earnings|finance|financial|company|companies|corporations?|corporate|merger|acquisition|ipo|layoffs?|trade war|tariffs?|economia|empresas?|bolsa)\b|商业|商業|经济|經濟|财经|財經|ビジネス|企業|経済|экономик|бизнес|компани/u],
  ["politics", /\b(politics|political|government|election|congress|senate|parliament|policy|regulation|law|legislation|president|minister|white house|politica|gobierno|elecciones)\b|政治|选举|選舉|政府|選挙|политик|выбор/u],
  ["tech", /\b(tech|technology|gadgets?|software|chips?|semiconductors?|apps?|smartphones?|iphone|android|silicon valley|big tech|startups?|privacy|surveillance|data|internet|online|platform|tecnologia|tecnologica|informatica|ordenadores?|moviles?)\b|科技|技术|技術|テック|テクノロジー|ガジェット|スマホ|スマートフォン|технолог|гаджет|смартфон|компьютер/u],
  ["world", /\b(world|international|global|war|conflict|ceasefire|abroad|overseas|mundo|internacional|guerra)\b|国际|國際|世界|国際|международн|войн/u],
];
const STOP_TERMS = new Set(["what", "whats", "what's", "tell", "give", "show", "any", "the", "latest", "recent", "news", "headlines", "headline", "breaking", "today", "tonight", "about", "with", "from", "please", "iris", "hey", "hi", "is", "are", "was", "did", "does", "happening", "going", "announce", "announced", "announcement", "i", "you", "me", "my", "ai", "tech", "big", "that", "this", "those", "these", "there", "here", "controversy", "scandal", "lawsuit", "privacy", "company", "corporation", "corporate"]);
// The same kind of words in the other languages: question words, "latest", "news", "today", "technology". Compared folded
// (no accents, lower case), so "Cuáles" is "cuales". Without them "¿Cuáles son las últimas noticias?" searched the feeds for "Cuáles".
const STOP_FOLDED = new Set(["que", "cual", "cuales", "como", "quien", "cuando", "donde", "hay", "hoy", "ayer", "ultimas", "ultimos", "ultima", "ultimo", "noticias", "noticia", "tecnologia", "tecnologias", "sobre", "dime", "dame", "muestrame", "hola", "iris", "anuncio", "presento", "lanzo", "algo", "nuevo", "nueva", "las", "los", "una", "uno", "son", "esta", "este",
  "какие", "какая", "какой", "какое", "что", "чего", "кто", "где", "когда", "последние", "последняя", "последний", "новости", "новость", "технологий", "технологии", "сегодня", "вчера", "привет", "расскажи", "покажи", "про", "новое", "анонсировала", "анонсировал", "объявила", "объявил"]
  .map(w => w.normalize("NFKC").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()));
// Company names written in other scripts, mapped to the English name the feeds use ("苹果" is Apple)
const BRAND_ALIASES: Array<[RegExp, string]> = [
  [/苹果|蘋果|アップル|эппл/u, "Apple"], [/谷歌|グーグル|гугл/u, "Google"], [/微软|微軟|マイクロソフト|майкрософт/u, "Microsoft"],
  [/亚马逊|亞馬遜|アマゾン|амазон/u, "Amazon"], [/脸书|臉書|フェイスブック|фейсбук/u, "Meta"], [/特斯拉|テスラ|тесла/u, "Tesla"],
  [/英伟达|英偉達|輝達|エヌビディア|нвидиа|энвидиа/u, "Nvidia"], [/三星|サムスン|самсунг/u, "Samsung"], [/英特尔|英特爾|インテル|интел/u, "Intel"],
  [/华为|華為|ファーウェイ|хуавэй|хуавей/u, "Huawei"], [/索尼|ソニー/u, "Sony"], [/任天堂|ニンテンドー|нинтендо/u, "Nintendo"],
];

function wordCount(text: string): number {
  const cjk = (text.match(/[぀-ヿ㐀-鿿]/g) ?? []).length;
  return text.replace(/[぀-ヿ㐀-鿿]+/g, " ").trim().split(/\s+/).filter(Boolean).length + Math.ceil(cjk / 2);
}

const PLACE_STOP = /^(?:me|us|you|him|her|them|myself|ourselves|it|its|it's|the|my|your|our|a|an|this|that|these|those|here|there|general|case|fact|order|terms|time|any|every|some|all|case|particular|short|long|total|detail|real|truth|theory|principle|practice|addition|spite|front|back|touch|love|charge|control|person|public|private|nature|reality)\b/i;
const TRAILING = /\s+(?:today|tomorrow|tonight|now|right|this|next|please|pls|plz|and|or|but|then|currently|at|on|with|because|since|so|is|will|looks?|like|the|a|weekend|week|morning|afternoon|evening|again|too|there|though|anyway|thanks|lol|btw|exactly)$/i;
const CITY_RE = /(?:\b(?:in|at|for|near|around|across|over|from|en)|(?<![\p{L}])в)\s+([\p{L}][\p{L}.'’-]*(?:[ ,]+[\p{L}][\p{L}.'’-]*){0,3})/giu;

// A Chinese place candidate is whatever stood before "天气"/"地震" and may have swallowed time words and verbs
// ("今天有" in "今天有地震吗？" is "today there is", not a town, which once answered "no earthquakes near Jintian, Jiangxi").
// Take those off both ends; if fewer than two characters of name are left, there was no place.
const ZH_LEADING = /^(?:今天|明天|后天|後天|昨天|现在|現在|最近|这几天|這幾天|目前|这里|這裡|那里|那裡|我们|我們|我|你|请问|請問|请|請|帮我|幫我|查一下|查查|查|看看|想知道|知道)+/;
const ZH_TRAILING = /(?:今天|明天|后天|後天|现在|現在|最近|有没有|有沒有|有|是|会|會|还|還|下|吗|嗎|呢|吧|了|的|在|市|县|縣|怎么样|怎麼樣|如何|怎样|怎樣)+$/;
export function cjkPlace(candidate: string): string | null {
  const name = candidate.replace(ZH_LEADING, "").replace(ZH_TRAILING, "");
  return name.length >= 2 && !/^(?:这里|這裡|那里|那裡|附近|周围|周圍)$/.test(name) ? name : null;
}
const JA_TIME = /^(?:今|今日|昨日|明日|明後日|現在|最近|今週|来週|週末|今夜|今朝|これ|ここ|その|あの|私)$/;
function jaPlace(candidate: string): string | null {
  const name = candidate.replace(/^(?:今日|昨日|明日|明後日|現在|最近|今週|今)の?/, "");
  return name.length >= 2 && !JA_TIME.test(name) ? name : null;
}

export function extractPlace(text: string): string | null {
  const zh = /([一-鿿]{2,6}?)(?:市|县|縣)?(?:今天|明天|后天|後天|现在|現在|的|最近|附近)*(?:天气|天氣|气温|氣溫|温度|溫度|地震|下雨|下雪|台风|颱風)/.exec(text) ?? /(?:在|去|到|关于|關於)([一-鿿]{2,6})(?:的)?(?:天气|天氣|地震|下雨|下雪|新闻|新聞)?/.exec(text);
  if (zh) { const place = cjkPlace(zh[1]); if (place) return place; }
  // Japanese: "サクラメントの今の天気", "東京の明日の天気". The name ends at the first の; time words are not places ("今日の地震は？")
  const ja = /([぀-ヿ一-鿿ー]{2,8}?)の(?:今の|今日の|明日の|明後日の|現在の|最近の|今週の|週末の)?(?:天気|気温|地震)/.exec(text);
  if (ja) { const place = jaPlace(ja[1]); if (place) return place; }
  const before = /\b([A-Z\p{Lu}][\p{L}.'’-]+(?:\s[A-Z\p{Lu}][\p{L}.'’-]+){0,2})\s+(?:weather|forecast|temperature|earthquakes?|quakes?)\b/u.exec(text);
  if (before && !/^(?:What|How|Is|Will|The|Today|Tomorrow|Iris|Hey|Any|Tell|Check|Whats|Local|Current|Recent|Latest)$/i.test(before[1])) return before[1];
  const how = /\bhow (?:hot|cold|warm|cool|humid|windy) (?:is|was|will it be|will)\s+(?:it\s+(?:in|at)\s+)?([\p{L}][\p{L}.'’-]+(?:\s[\p{L}][\p{L}.'’-]+){0,2})/iu.exec(text);
  if (how) {
    let candidate = how[1];
    while (TRAILING.test(candidate)) candidate = candidate.replace(TRAILING, "");
    if (candidate && !PLACE_STOP.test(candidate)) return candidate;
  }
  for (const m of text.matchAll(CITY_RE)) {
    // "near Tokyo, what should I do" is Tokyo; "in Sacramento, California" keeps its capitalised second part
    let candidate = m[1].trim().replace(/[ ,]+$/, "").split(/\s*,\s*/).filter((part, i) => i === 0 || /^\p{Lu}/u.test(part)).join(", ");
    while (TRAILING.test(candidate)) candidate = candidate.replace(TRAILING, "");
    if (!candidate || PLACE_STOP.test(candidate)) continue;
    // "in Sacramento, California" stays whole; "in love" and "in general" were removed by PLACE_STOP, and the geocoder is the last judge
    if (candidate.split(/\s+/).length <= 4 && candidate.length >= 2) return candidate;
  }
  return null;
}

const here = (t: string) => /\b(?:here|my (?:area|city|town|location|place|neighbou?rhood)|near me|around me|outside|where i am|where i live)\b|我这里|我這裡|我这儿|我附近|我所在/.test(t);

function dayOf(f: string, raw: string): { dayOffset: number; multiDay: boolean } {
  if (/\bday after tomorrow\b|后天|後天|明後日|あさって|pasado manana|послезавтра/.test(f + raw)) return { dayOffset: 2, multiDay: false };
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
    const felt = feltQuake(f, raw);
    const mag = /(?:magnitude|mag\.?|m)\s*(?:above|over|at least|>=?|greater than)?\s*(\d(?:\.\d)?)\s*\+?/.exec(f);
    return {
      kind: "quake", place: felt ? feltPlace(raw) : extractPlace(raw), here: here(f), felt,
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
  // After an earthquake emergency she asked where the visitor is; a short answer ("I'm in Tokyo", "东京", "en Santiago") is that place
  if (recent?.felt && !QUAKE.test(f) && wordCount(raw) <= 6) {
    const place = locationReply(raw);
    if (place) return { kind: "quake", place, here: false, strongest: false, days: 1, felt: true };
  }
  // A short follow-up to the last live answer: "and tomorrow?", "what about Tokyo?", "any bigger ones?", "and tech news?"
  const followUp = /^(?:and|what about|how about|ok(?:ay)?,? (?:and|what about)|also|then|and what about)\b|^(?:那|那么|那麼|还有|還有)|^(?:和|と|а |и )|^(?:じゃあ|では|それで)?(?:明日|明後日|今日|今週|週末|来週)(?:は|も)?[？?]*$|^[¿¡]?\s*y\s+(?:manana|pasado manana|hoy|esta semana|el fin de semana|en\s+\S+|que tal)\b/;
  if (recent && wordCount(raw) <= 7 && (followUp.test(f) || followUp.test(raw))) {
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

// The answer to "where are you?": "I'm in Tokyo", "in Santiago, Chile", "我在东京", "東京にいます", "estoy en Lima", "я в Токио", or just "Tokyo"
function locationReply(raw: string): string | null { return statedLocation(raw, true); }
// Where a visitor in an earthquake says they are. In Chinese and Japanese only an explicit statement counts ("我在东京", "東京にいます"):
// the general place pattern would take "发生了一场大" ("a big one happened") for a town.
function feltPlace(raw: string): string | null {
  if (/[㐀-鿿぀-ヿ]/.test(raw)) return statedLocation(raw);
  return extractPlace(raw);
}
function statedLocation(raw: string, allowBare = false): string | null {
  const text = raw.trim().replace(/[?!.。！？]+$/u, "");
  if (!text || (allowBare && /[?？]/.test(raw))) return null; // a bare reply that is itself a question is not an answer
  const patterns: RegExp[] = [
    /^(?:i['’]?m|i am|we['’]?re|we are|im|currently|right now i['’]?m)\s+(?:in|at|near|around)\s+(.+)$/i,
    /^(?:in|near|around)\s+(.+)$/i,
    /^(?:我在|我們在|我们在|在|我在的是|我人在)\s*([一-鿿]{2,8})/u,
    /^(?:私は|僕は|俺は|うちは)?\s*([぀-ヿ一-鿿ー]{2,8}?)(?:にいます|にいる|です|だよ|の近く|にいるよ)$/u,
    /^(?:estoy|estamos|vivo|vivimos)\s+en\s+(.+)$/i,
    /^en\s+(.+)$/i,
    /^(?:я|мы)\s+(?:в|во|около|рядом с)\s+(.+)$/iu,
    /^(?:в|во)\s+(.+)$/iu,
  ];
  for (const re of patterns) { const m = re.exec(text); if (m) { const name = m[1].trim(); return name.length >= 2 && name.length <= 60 ? name : null; } }
  // A bare place name: one to three words, no verbs of ours to recognise
  return allowBare && wordCount(text) <= 3 && text.length >= 2 && text.length <= 40 && !/^(?:yes|no|ok|okay|thanks|thank you|yeah|nope|si|sí|да|нет|好的|谢谢|謝謝|はい|いいえ|ありがとう)$/i.test(text) ? text : null;
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
  for (const [re, name] of BRAND_ALIASES) if (re.test(text)) terms.push(name);
  // Capitalised words in Latin or Cyrillic script only: CJK text has no capitals, and a Japanese particle after "Apple" is a letter too
  for (const m of text.matchAll(/(?<![\p{L}\p{N}])(?=[\p{Script=Latin}\p{Script=Cyrillic}])\p{Lu}[\p{Script=Latin}\p{Script=Cyrillic}\p{N}&'’-]{1,}(?:\s(?=[\p{Script=Latin}\p{Script=Cyrillic}])\p{Lu}[\p{Script=Latin}\p{Script=Cyrillic}\p{N}&'’-]+){0,2}/gu)) terms.push(m[0]);
  const out: string[] = [];
  for (const t of terms) {
    const clean = t.replace(/[?!.,;:]+$/, "").replace(/['’]s$/i, "").trim();
    const key = clean.toLowerCase();
    if (clean.length < 2 || STOP_TERMS.has(key) || key.split(/\s+/).every(w => STOP_TERMS.has(w) || STOP_FOLDED.has(fold(w))) || STOP_FOLDED.has(fold(clean)) || out.some(o => o.toLowerCase() === key)) continue;
    out.push(clean);
  }
  return out.slice(0, 3);
}
