// Current news from a short, fixed list of reputable public RSS/Atom feeds. Nothing here searches the open web, so
// every headline, date and link Iris can mention came from one of these feeds; she cannot be handed a page written to
// manipulate her. Items are cleaned, dated, de-duplicated across outlets, and marked when several outlets carry them.
import { LiveError, clean, getText } from "./http";
import { TtlCache } from "./cache";

export type Topic = "general" | "world" | "tech" | "ai" | "cyber" | "business" | "science" | "space" | "politics";
export type SourceKind = "primary" | "newsroom" | "trade";
export interface Feed { id: string; source: string; kind: SourceKind; url: string; topics: Topic[] }

export const FEEDS: Feed[] = [
  { id: "bbc-top", source: "BBC News", kind: "newsroom", url: "https://feeds.bbci.co.uk/news/rss.xml", topics: ["general", "world"] },
  { id: "bbc-world", source: "BBC News", kind: "newsroom", url: "https://feeds.bbci.co.uk/news/world/rss.xml", topics: ["world"] },
  { id: "bbc-tech", source: "BBC News", kind: "newsroom", url: "https://feeds.bbci.co.uk/news/technology/rss.xml", topics: ["tech", "ai", "cyber"] },
  { id: "bbc-business", source: "BBC News", kind: "newsroom", url: "https://feeds.bbci.co.uk/news/business/rss.xml", topics: ["business"] },
  { id: "bbc-science", source: "BBC News", kind: "newsroom", url: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml", topics: ["science", "space"] },
  { id: "guardian-world", source: "The Guardian", kind: "newsroom", url: "https://www.theguardian.com/world/rss", topics: ["world", "general", "politics"] },
  { id: "guardian-ai", source: "The Guardian", kind: "newsroom", url: "https://www.theguardian.com/technology/artificialintelligenceai/rss", topics: ["ai", "tech"] },
  { id: "guardian-tech", source: "The Guardian", kind: "newsroom", url: "https://www.theguardian.com/us/technology/rss", topics: ["tech", "cyber"] },
  { id: "guardian-business", source: "The Guardian", kind: "newsroom", url: "https://www.theguardian.com/us/business/rss", topics: ["business"] },
  { id: "guardian-science", source: "The Guardian", kind: "newsroom", url: "https://www.theguardian.com/science/rss", topics: ["science", "space"] },
  { id: "guardian-politics", source: "The Guardian", kind: "newsroom", url: "https://www.theguardian.com/us-news/us-politics/rss", topics: ["politics"] },
  { id: "npr", source: "NPR", kind: "newsroom", url: "https://feeds.npr.org/1001/rss.xml", topics: ["general", "politics", "world"] },
  { id: "nasa", source: "NASA", kind: "primary", url: "https://www.nasa.gov/news-release/feed/", topics: ["space", "science"] },
  { id: "cisa", source: "CISA (US government advisories)", kind: "primary", url: "https://www.cisa.gov/cybersecurity-advisories/all.xml", topics: ["cyber"] },
  { id: "bleeping", source: "BleepingComputer", kind: "trade", url: "https://www.bleepingcomputer.com/feed/", topics: ["cyber", "tech"] },
  { id: "ars", source: "Ars Technica", kind: "trade", url: "https://feeds.arstechnica.com/arstechnica/index", topics: ["tech", "ai"] },
];

export interface FeedItem { title: string; summary: string; link: string | null; publishedAt: number; feed: Feed }
// claim: the story is someone's statement or announcement (a company, an official, a government), reported rather than
// independently established. serious: it concerns deaths, violence, disaster or war. disputed: other outlets' headlines
// for the same story give different figures (they may measure different things). All three are worked out from the
// feed text, so any doubt Iris voices about a story rests on something that is actually there.
export interface NewsItem { title: string; summary: string; link: string | null; publishedAt: number; source: string; kind: SourceKind; alsoReportedBy: string[]; claim: boolean; serious: boolean; disputed: string | null }
export interface NewsReport { items: NewsItem[]; topic: Topic; terms: string[]; feedsAnswered: number; feedsAsked: number; failed: string[]; maxAgeDays: number; matching: number }

const feeds = new TtlCache<string>(40);

// ---- parsing ---------------------------------------------------------------------------------------------------
function entities(s: string): string {
  return s.replace(/&#x([0-9a-f]{1,6});/gi, (_, h) => safeChar(parseInt(h, 16))).replace(/&#(\d{1,7});/g, (_, d) => safeChar(+d))
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
}
const safeChar = (n: number) => (n > 0 && n < 0x110000 && !(n >= 0xD800 && n <= 0xDFFF) ? String.fromCodePoint(n) : " ");
function textOf(inner: string, max: number): string {
  const cdata = /^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/.exec(inner);
  const raw = cdata ? cdata[1] : entities(inner);          // escaped HTML becomes tags first, then every tag is dropped
  return clean(entities(raw.replace(/<[^>]*>/g, " ")), max);
}
const field = (block: string, name: string): string | null => {
  const m = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i").exec(block);
  return m ? m[1] : null;
};
const TRACKING = /^(utm_[a-z]+|at_[a-z_]+|cmp|ocid|source|ref|fbclid|gclid)$/i;
export function cleanLink(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const url = new URL(entities(raw).trim());
    if (url.protocol !== "https:" || url.username || url.password || url.href.length > 300) return null;
    for (const key of [...url.searchParams.keys()]) if (TRACKING.test(key)) url.searchParams.delete(key);
    url.hash = "";
    return url.toString();
  } catch { return null; }
}

export function parseFeed(xml: string, feed: Feed, now: number): FeedItem[] {
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>|<entry[\s>][\s\S]*?<\/entry>/gi) ?? [];
  const out: FeedItem[] = [];
  for (const block of blocks.slice(0, 60)) {
    const title = textOf(field(block, "title") ?? "", 220);
    const when = field(block, "pubDate") ?? field(block, "dc:date") ?? field(block, "published") ?? field(block, "updated");
    const publishedAt = Date.parse(textOf(when ?? "", 60));
    if (!title || !Number.isFinite(publishedAt) || publishedAt > now + 2 * 3600_000) continue;
    const linkTag = field(block, "link");
    const atom = /<link[^>]*?href="([^"]+)"[^>]*?>/i.exec(block);
    const link = cleanLink(linkTag && !linkTag.includes("<") ? textOf(linkTag, 400) : atom ? atom[1] : null);
    out.push({ title, summary: textOf(field(block, "description") ?? field(block, "summary") ?? "", 260), link, publishedAt, feed });
  }
  return out;
}

// ---- grouping the same story across outlets ------------------------------------------------------------------------
const STOP = new Set("the a an and or of to in on for at by with from as is are was were be been it its this that after over into new says say said will would could than more less about amid not no have has had how why what who when where".split(" "));
const words = (title: string): Set<string> => new Set(title.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(w => w.length > 2 && !STOP.has(w)));
function similar(a: Set<string>, b: Set<string>): boolean {
  let shared = 0;
  for (const w of a) if (b.has(w)) shared++;
  return shared >= 3 && shared / (a.size + b.size - shared) >= 0.45;
}
const PRIORITY: Record<SourceKind, number> = { primary: 3, newsroom: 2, trade: 1 };

const CLAIM = /\b(announces?|announced|unveils?|unveiled|launch(?:es|ed)?|says|said|claims?|claimed|statement|press release|plans?|promises?|pledges?|vows?|insists?|denies|denied|reveals?|revealed|forecasts?|expects?|targets?|reports? (?:record|strong|rising)|earnings|results)\b/i;
const SERIOUS = /\b(kill(?:s|ed|ing)?|dead|death|deaths|dies|died|dying|murder(?:ed|s)?|shoot(?:ing|ings)|shot dead|massacre|attack(?:ed|s)?|bomb(?:ing|ed|s)?|terror\w*|victims?|tragedy|tragic|disaster|crash(?:ed|es)?|explosion|hostages?|wounded|injur(?:ed|ies|y)|casualt\w+|war|airstrikes?|invasion|famine|earthquake|tsunami|hurricane|typhoon|wildfire|floods?|flooding|missing|abuse|suicide|cancer|evacuat\w+)\b/i;
// A headline figure: 5,000 / 4.5 / 12 percent / 3bn. Years and single digits are not figures worth comparing.
function figures(title: string): Set<string> {
  const out = new Set<string>();
  for (const m of title.matchAll(/(?<![\w.])(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)(\s?(?:%|percent|million|billion|trillion|bn|m|k)\b)?/gi)) {
    const raw = m[1], unit = (m[2] ?? "").trim().toLowerCase().replace("percent", "%");
    const value = Number(raw.replace(/,/g, ""));
    if (!unit && (value < 10 || (value >= 1900 && value <= 2100 && !raw.includes(",") && !raw.includes(".")))) continue;
    out.add(`${raw}${unit ? (unit === "%" ? "%" : " " + unit) : ""}`);
  }
  return out;
}
function dispute(members: FeedItem[]): string | null {
  const bySource = new Map<string, Set<string>>();
  for (const m of members) if (!bySource.has(m.feed.source)) bySource.set(m.feed.source, figures(m.title));
  const entries = [...bySource.entries()].filter(([, f]) => f.size > 0);
  for (let i = 0; i < entries.length; i++) for (let j = i + 1; j < entries.length; j++) {
    const [a, fa] = entries[i], [b, fb] = entries[j];
    if (![...fa].some(x => fb.has(x))) return `${a}'s headline gives ${[...fa].join(", ")}; ${b}'s gives ${[...fb].join(", ")}`;
  }
  return null;
}

export function group(items: FeedItem[]): NewsItem[] {
  const clusters: Array<{ words: Set<string>; members: FeedItem[] }> = [];
  for (const item of [...items].sort((a, b) => b.publishedAt - a.publishedAt)) {
    const w = words(item.title);
    const home = clusters.find(c => similar(c.words, w) || c.members.some(m => m.title.toLowerCase() === item.title.toLowerCase()));
    if (home) home.members.push(item); else clusters.push({ words: w, members: [item] });
  }
  return clusters.map(c => {
    const lead = [...c.members].sort((a, b) => PRIORITY[b.feed.kind] - PRIORITY[a.feed.kind] || b.publishedAt - a.publishedAt)[0];
    const others = [...new Set(c.members.map(m => m.feed.source).filter(s => s !== lead.feed.source))];
    return {
      title: lead.title, summary: lead.summary, link: lead.link, publishedAt: Math.max(...c.members.map(m => m.publishedAt)), source: lead.feed.source, kind: lead.feed.kind, alsoReportedBy: others,
      claim: c.members.some(m => CLAIM.test(m.title)), serious: c.members.some(m => SERIOUS.test(m.title + " " + m.summary)), disputed: dispute(c.members),
    };
  });
}

// ---- fetching and choosing -----------------------------------------------------------------------------------------
export interface NewsRequest { topic?: Topic; terms?: string[]; maxAgeDays?: number; limit?: number }

export async function getNews(request: NewsRequest = {}, now: number = Date.now()): Promise<{ report: NewsReport; cache: "hit" | "miss" | "stale" | "mixed" }> {
  const topic = request.topic ?? "general";
  const terms = (request.terms ?? []).map(t => t.toLowerCase().trim()).filter(t => t.length > 1).slice(0, 4);
  const maxAgeDays = Math.min(Math.max(request.maxAgeDays ?? 3, 1), 14);
  const limit = Math.min(Math.max(request.limit ?? 4, 1), 6);
  // A named company or subject can be in any outlet, so those searches read every feed; a plain topic reads its own
  const chosen = terms.length ? FEEDS : FEEDS.filter(f => f.topics.includes(topic));
  const seen = new Set<string>();
  const results = await Promise.all(chosen.map(async feed => {
    try {
      const { value, source } = await feeds.get(feed.id, 10 * 60_000, 2 * 3600_000, () => getText(feed.url, { accept: "application/rss+xml, application/xml, text/xml", timeoutMs: 6000, maxBytes: 1_500_000 }));
      seen.add(source);
      return { feed, items: parseFeed(value, feed, now), ok: true };
    } catch { return { feed, items: [] as FeedItem[], ok: false }; }
  }));
  const answered = results.filter(r => r.ok).length;
  if (!answered) throw new LiveError("network", "no news feed answered");
  const cutoff = now - maxAgeDays * 86400_000;
  let pool = results.flatMap(r => r.items).filter(i => i.publishedAt >= cutoff);
  if (terms.length) pool = pool.filter(i => terms.some(t => new RegExp(`(^|[^\\p{L}\\p{N}])${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "iu").test(i.title + " " + i.summary)));
  const items = group(pool).sort((a, b) => b.alsoReportedBy.length - a.alsoReportedBy.length || b.publishedAt - a.publishedAt);
  // Newest first among the stories the most outlets carry, but a single fresh story is not buried under an old shared one
  const ranked = items.sort((a, b) => (b.publishedAt - a.publishedAt) + (b.alsoReportedBy.length - a.alsoReportedBy.length) * 6 * 3600_000);
  const cache = seen.size > 1 ? "mixed" : ((seen.values().next().value as "hit" | "miss" | "stale") ?? "miss");
  return { report: { items: ranked.slice(0, limit), topic, terms, feedsAnswered: answered, feedsAsked: chosen.length, failed: results.filter(r => !r.ok).map(r => r.feed.id), maxAgeDays, matching: items.length }, cache };
}

export function resetNewsForTests(): void { feeds.clear(); }
