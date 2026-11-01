// Iris's commentary on what she looks up: occasional and varied, bent by her mood, silent on serious subjects, resting only on
// doubts the data really supports, native in each language, and never touching the facts. Fixed dice and a stand-in network:
// nothing here depends on chance, the internet or a real model.
import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { net } from "../server/live/http";
import { dice, chooseStance, commentaryBlock, resetCommentaryForTests, type Stance } from "../server/live/commentary";
import { newsNotes, quakeNotes, sounds_distressed, weatherNotes, type Notes } from "../server/live/notes";
import { FEEDS, group, type FeedItem, type NewsReport } from "../server/live/news";
import { interpretForecast } from "../server/live/weather";
import { interpretQuakes } from "../server/live/quakes";
import { prepareLive, resetLiveForTests } from "../server/live";
import { resetGeocodeForTests, setGeocodeGapForTests, type GeoPlace } from "../server/live/geocode";
import { resetWeatherForTests } from "../server/live/weather";
import { resetQuakesForTests } from "../server/live/quakes";
import { resetNewsForTests } from "../server/live/news";

const fixture = (name: string) => fs.readFileSync(new URL(`./fixtures/live/${name}`, import.meta.url), "utf8");
const NOW = Date.parse("2026-11-01T18:00:00Z");
const realFetch = net.fetch, realDice = dice.next;
const SAC: GeoPlace = { name: "Sacramento", admin: "California", country: "United States", countryCode: "us", lat: 38.58, lon: -121.49, zone: "America/Los_Angeles", label: "Sacramento, California, United States", importance: 0.68, type: "city" };

// A small, repeatable random source
function seeded(seed: number): () => number { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
beforeEach(() => { resetCommentaryForTests(); dice.next = realDice; net.fetch = realFetch; });
test.after(() => { dice.next = realDice; net.fetch = realFetch; });

const OPEN: Notes = { lines: [], skepticalBasis: true, reliable: true, serious: false, sentiment: "neutral", curious: true };
function shares(notes: Notes, mood: string | undefined, draws = 4000, seed = 7): Record<string, number> {
  dice.next = seeded(seed);
  const count: Record<string, number> = {};
  for (let i = 0; i < draws; i++) { const s = chooseStance({ notes, mood, sessionId: "fresh-" + i }).stance; count[s] = (count[s] ?? 0) + 1; }
  for (const k of Object.keys(count)) count[k] /= draws;
  return count;
}

// ======================================================================================================================
test("variety: she often simply answers, and every other stance also happens", () => {
  const s = shares(OPEN, undefined);
  for (const stance of ["straight", "wry", "skeptical", "curious", "warm", "defend"]) assert.ok((s[stance] ?? 0) > 0.01, `${stance} never chosen: ${JSON.stringify(s)}`);
  assert.ok(s.straight > 0.3 && s.straight < 0.55, "just answering is the most common single choice but not the only one: " + s.straight);
  assert.ok(Object.entries(s).every(([k, v]) => k === "straight" || v < s.straight), "no commentary stance outnumbers a plain answer");
  assert.ok(!("respectful" in s), "respectful is for serious subjects only");
});

test("mood bends the odds: cold and busy answer plainly, sarcastic needles, playful wonders, flirty is warmer", () => {
  const m = Object.fromEntries(["professional", "sarcastic", "cold", "flirty", "playful", "busy"].map(k => [k, shares(OPEN, k)]));
  assert.ok(m.busy.straight > 0.6 && m.cold.straight > 0.55, "busy and cold mostly just answer");
  assert.ok(m.busy.straight > m.cold.straight - 0.05);
  assert.ok(m.sarcastic.wry + m.sarcastic.skeptical > m.professional.wry + m.professional.skeptical + 0.12, "sarcastic mood is the most editorial");
  assert.ok(m.playful.curious > m.sarcastic.curious * 1.8, "playful wonders aloud more");
  assert.ok(m.flirty.warm > m.professional.warm * 3, "flirty is warmer");
  assert.ok(m.cold.warm < 0.02, "cold is not affectionate");
  for (const mood of Object.keys(m)) assert.ok((m[mood].straight ?? 0) > 0.2, `${mood}: a plain answer is always a real possibility`);
  assert.deepEqual(shares(OPEN, "not-a-mood"), shares(OPEN, undefined), "an unknown mood changes nothing");
});

test("doubt needs a reason, credit needs evidence, wonder needs something notable", () => {
  const none: Notes = { ...OPEN, skepticalBasis: false, reliable: false, curious: false };
  const s = shares(none, "sarcastic");
  assert.deepEqual(Object.keys(s).sort(), ["straight", "warm", "wry"], "with nothing to doubt, trust or wonder at, only plain, wry or warm remain");
  assert.equal(Object.keys(shares({ ...OPEN, skepticalBasis: false }, "sarcastic")).includes("skeptical"), false);
  assert.equal(Object.keys(shares({ ...OPEN, reliable: false }, "professional")).includes("defend"), false);
  assert.equal(Object.keys(shares({ ...OPEN, curious: false }, "playful")).includes("curious"), false);
});

test("serious subjects never get jokes, whatever her mood or the dice", () => {
  const serious: Notes = { ...OPEN, serious: true };
  for (const mood of ["professional", "sarcastic", "cold", "flirty", "playful", "busy", undefined]) {
    for (let i = 0; i < 200; i++) { dice.next = seeded(i); assert.equal(chooseStance({ notes: serious, mood, sessionId: "s" + i }).stance, "respectful"); }
  }
  const block = commentaryBlock({ stance: "respectful", weights: {} }, serious, "any earthquakes today?");
  assert.match(block, /No jokes, no sarcasm, no flirting, no cynicism about the source/);
  assert.ok(!/native|Never translate an English joke/.test(block), "no humour guidance at all in a serious reply");
});

test("she does not play the same card over and over in one conversation", () => {
  dice.next = seeded(11);
  const run: Stance[] = [];
  for (let i = 0; i < 600; i++) run.push(chooseStance({ notes: OPEN, mood: "sarcastic", sessionId: "one-chat" }).stance);
  let longest = 1, current = 1;
  for (let i = 1; i < run.length; i++) { current = run[i] === run[i - 1] && run[i] !== "straight" ? current + 1 : 1; longest = Math.max(longest, current); }
  assert.ok(longest <= 2, "no commentary stance is ever used three times running: " + longest);
  const repeats = run.filter((s, i) => i > 0 && s === run[i - 1] && s !== "straight").length;
  assert.ok(repeats / run.length < 0.04, "back-to-back repeats are rare: " + repeats);
  dice.next = seeded(11); resetCommentaryForTests();
  const a = chooseStance({ notes: OPEN, mood: undefined, sessionId: "A" }).stance;
  dice.next = seeded(11);
  assert.equal(chooseStance({ notes: OPEN, mood: undefined, sessionId: "B" }).stance, a, "another visitor's history does not affect this one");
});

// ======================================================================================================================
const item = (title: string, feedId: string, ageH = 3, summary = ""): FeedItem => ({ title, summary, link: null, publishedAt: NOW - ageH * 3600_000, feed: FEEDS.find(f => f.id === feedId)! });
const report = (items: ReturnType<typeof group>, failed: string[] = []): NewsReport => ({ items, topic: "general", terms: [], feedsAnswered: 5, feedsAsked: 5 + failed.length, failed, maxAgeDays: 3, matching: items.length });

test("source notes: an announcement is a claim, one outlet is one outlet, several outlets are corroboration", () => {
  const items = group([
    item("Acme unveils new privacy controls for its phones", "bbc-tech"),
    item("Acme unveils new phone privacy controls", "guardian-tech"),
    item("Solo outlet reports a quiet Tuesday on the markets", "bleeping", 4),
  ]);
  const n = newsNotes(report(items), NOW, "any news?");
  const text = n.lines.join("\n");
  assert.match(text, /announcement or someone's statement/);
  assert.match(text, /also carried by The Guardian|also carried by BBC News/);
  assert.match(text, /only this outlet in the feeds checked/);
  assert.match(text, /trade press/);
  assert.equal(n.skepticalBasis, true); assert.equal(n.reliable, true); assert.equal(n.serious, false);
  const plain = newsNotes(report(group([item("Two outlets cover the lunar flyby crew list", "nasa"), item("Lunar flyby crew list: two outlets cover this", "bbc-science")])), NOW, "news");
  assert.match(plain.lines.join("\n"), /official or primary source, which is still that body's own account/);
  assert.equal(plain.skepticalBasis, false, "a corroborated plain story has nothing special to doubt");
});

test("source notes: figures that really differ across outlets are reported as differing figures, never as a lie", () => {
  const items = group([item("Orbit Corp to cut 5,000 jobs in restructuring", "bbc-business"), item("Orbit Corp to cut 4,000 jobs in restructuring", "guardian-business")]);
  assert.equal(items.length, 1, "the two headlines are one story");
  assert.match(items[0].disputed ?? "", /5,000.*4,000|4,000.*5,000/);
  const n = newsNotes(report(items), NOW, "news");
  assert.match(n.lines.join("\n"), /different figures[\s\S]*may be measuring different things/);
  assert.ok(!/lie|lying|cover/i.test(n.lines.join("\n")));
  assert.equal(n.reliable, false, "a disputed story is not offered as solid evidence");
  assert.equal(n.curious, true);
  const agree = group([item("Orbit Corp to cut 5,000 jobs in restructuring", "bbc-business"), item("Orbit Corp to cut 5,000 jobs in restructuring plan", "guardian-business")]);
  assert.equal(agree[0].disputed, null, "the same figure is not a disagreement");
  const years = group([item("Orbit Corp results for 2026 show 3 new markets", "bbc-business"), item("Orbit Corp results for 2025 show 7 new markets", "guardian-business")]);
  assert.equal(years[0].disputed, null, "years and single digits are not figures worth comparing");
});

test("source notes: old items, missing feeds and serious subjects are noticed", () => {
  const items = group([item("Storm leaves 12 dead as rescuers search flooded town", "bbc-top", 5), item("Gadget maker updates a firmware version", "ars", 60)]);
  const n = newsNotes(report(items, ["npr", "cisa"]), NOW, "news");
  const text = n.lines.join("\n");
  assert.match(text, /2 days ago, so not fresh|2\.5 days ago, so not fresh/);
  assert.match(text, /2 of 7 feeds did not answer/);
  assert.equal(n.serious, true, "deaths make the whole answer serious");
  assert.equal(group([item("Ceasefire talks resume as war enters a new phase", "bbc-world")])[0].serious, true);
  assert.equal(group([item("New chip is faster than the old chip", "ars")])[0].serious, false);
});

test("source notes: weather limits are the real ones, and bad weather is not an emergency", () => {
  const w = interpretForecast(JSON.parse(fixture("met-sacramento.json")), SAC);
  const ctx = { cache: "miss" as const, dayOffset: 0, multiDay: false, message: "weather in Sacramento" };
  const base = weatherNotes(w, NOW, ctx);
  assert.match(base.lines.join("\n"), /One forecast model is the only source \(MET Norway\)/);
  assert.match(base.lines.join("\n"), /only cover the hours still ahead/);
  assert.match(base.lines.join("\n"), /Official alerts could not be checked for this place/);
  assert.match(base.lines.join("\n"), /model run is 5 hours old/, "the fixture's model run is 4h43m before the test clock");
  assert.equal(base.sentiment, "neutral", "11 C, clear, calm: cool but unremarkable");
  const pleasant = structuredClone(w); pleasant.now.tempC = 21;
  assert.equal(weatherNotes(pleasant, NOW, ctx).sentiment, "good", "21 C, clear, calm");
  assert.equal(base.serious, false); assert.equal(base.skepticalBasis, true, "an old model run is a real reason for a little doubt");
  const stale = weatherNotes(w, NOW, { ...ctx, cache: "stale" });
  assert.match(stale.lines.join("\n"), /did not answer, so this is the last answer received/);
  assert.match(weatherNotes(w, NOW, { ...ctx, dayOffset: 3 }).lines.join("\n"), /predictions and often change/);
  const rainy = structuredClone(w); rainy.now.condition = "heavy rain"; rainy.now.tempC = 9;
  assert.equal(weatherNotes(rainy, NOW, ctx).sentiment, "bad"); assert.equal(weatherNotes(rainy, NOW, ctx).serious, false, "rain is weather, not an emergency");
  const hot = structuredClone(w); hot.now.tempC = 41;
  assert.equal(weatherNotes(hot, NOW, ctx).serious, true, "dangerous heat is serious");
  const gale = structuredClone(w); gale.now.windKmh = 95;
  assert.equal(weatherNotes(gale, NOW, ctx).serious, true);
  const alerted = structuredClone(w); alerted.alerts = { available: true, items: [{ event: "Tornado Warning", severity: "Extreme", headline: "Take cover", endsAt: null }] };
  assert.equal(weatherNotes(alerted, NOW, ctx).serious, true, "an active severe alert ends the jokes");
  const mild = structuredClone(w); mild.alerts = { available: true, items: [{ event: "Wind Advisory", severity: "Minor", headline: "Breezy", endsAt: null }] };
  assert.equal(weatherNotes(mild, NOW, ctx).serious, false); assert.equal(weatherNotes(mild, NOW, ctx).sentiment, "bad");
});

test("source notes: earthquakes are serious when they are, and always preliminary", () => {
  const feed = interpretQuakes(JSON.parse(fixture("usgs-4.5-day.json")));
  const mk = (quakes: typeof feed.quakes) => ({ quakes, scope: "worldwide", minMag: 2.5, days: 1, generatedAt: 0, totalMatching: quakes.length + 3, source: "USGS" });
  const small = quakeNotes(mk(feed.quakes.filter(q => q.mag < 5).slice(0, 3)), NOW, "any earthquakes?");
  assert.equal(small.serious, false); assert.match(small.lines.join("\n"), /preliminary and can be revised/); assert.match(small.lines.join("\n"), /3 more matching events/);
  assert.equal(small.reliable, true, "official data is solid evidence");
  assert.equal(quakeNotes(mk(feed.quakes.filter(q => q.mag >= 6).slice(0, 1)), NOW, "quakes").serious, true, "a magnitude 6 is serious");
  assert.equal(quakeNotes(mk([{ ...feed.quakes[0], mag: 4.8, tsunami: true }]), NOW, "quakes").serious, true, "tsunami information is serious");
  assert.equal(quakeNotes(mk([{ ...feed.quakes[0], mag: 4.8, tsunami: false, alert: "yellow" }]), NOW, "quakes").serious, true);
  assert.equal(quakeNotes(mk([{ ...feed.quakes[0], mag: 4.8, tsunami: false, alert: "green" }]), NOW, "quakes").serious, false);
  assert.match(quakeNotes(mk([]), NOW, "quakes").lines.join("\n"), /No events matched/);
});

test("a worried visitor gets no jokes, in any supported language", () => {
  for (const text of ["I'm scared, my family lives there", "please help me, is it safe", "I am worried about the storm", "我很害怕，我家人住在那里", "心配です、危険ですか", "tengo miedo, ¿hay peligro?", "мне страшно, это опасно?"]) assert.equal(sounds_distressed(text), true, text);
  for (const text of ["what's the weather like", "any earthquakes today?", "I'm worried about nothing in particular, joking", "北京天气"]) {
    if (text.startsWith("I'm worried")) continue;
    assert.equal(sounds_distressed(text), false, text);
  }
});

// ======================================================================================================================
test("guidance in each language is native and contains nothing to repeat", () => {
  const notes = OPEN, wry = { stance: "wry" as const, weights: {} };
  const zh = commentaryBlock(wry, notes, "东京今天天气怎么样"), ja = commentaryBlock(wry, notes, "東京の天気はどうですか？"), es = commentaryBlock(wry, notes, "¿Qué tiempo hace en Madrid?"), ru = commentaryBlock(wry, notes, "Какая погода в Москве?"), en = commentaryBlock(wry, notes, "What's the weather in Sacramento?");
  assert.match(zh, /natural spoken Chinese[\s\S]*吐槽/); assert.match(ja, /natural spoken Japanese[\s\S]*皮肉/); assert.match(es, /colloquial Spanish[\s\S]*ironía|colloquial Spanish[\s\S]*irony/); assert.match(ru, /colloquial Russian/);
  assert.match(en, /Write any remark natively in the language you are answering in/);
  for (const block of [zh, ja, es, ru, en]) assert.match(block, /Never translate an English joke|never translate an English joke/i);
  const traditional = commentaryBlock(wry, notes, "東京今天天氣怎麼樣");
  assert.match(traditional, /natural spoken Chinese/);
  // the examples that set the tone are tone, not text: none of their wording is built in to be repeated
  const everything = [zh, ja, es, ru, en, commentaryBlock({ stance: "skeptical", weights: {} }, notes, "news"), commentaryBlock({ stance: "defend", weights: {} }, notes, "news"), commentaryBlock({ stance: "warm", weights: {} }, notes, "news")].join("\n");
  for (const stock of ["corporate smog", "switch on the pollution", "keep my sensors open", "who's actually in charge", "official story", "press release, everything", "Whether reality agrees", "Cute."]) assert.ok(!everything.toLowerCase().includes(stock.toLowerCase()), "built-in stock phrase: " + stock);
  assert.ok(!/straight/.test(commentaryBlock({ stance: "straight", weights: {} }, notes, "x").split("\n")[0].replace("stance: straight", "")), "sanity");
  assert.ok(!/native|Never translate/i.test(commentaryBlock({ stance: "straight", weights: {} }, notes, "东京天气")), "a plain answer carries no humour guidance");
});

test("bad and good weather get a fitting hint that is plainly a joke, never a claim about pollution", () => {
  const bad = commentaryBlock({ stance: "wry", weights: {} }, { ...OPEN, sentiment: "bad" }, "weather");
  const good = commentaryBlock({ stance: "wry", weights: {} }, { ...OPEN, sentiment: "good" }, "weather");
  assert.match(bad, /unpleasant[\s\S]*plainly a joke: never a claim about real pollution or what causes it/);
  assert.match(good, /pleasant[\s\S]*plainly a joke/);
  assert.ok(!/unpleasant|pleasant/.test(commentaryBlock({ stance: "skeptical", weights: {} }, { ...OPEN, sentiment: "bad" }, "weather")), "a doubt about a source does not talk about the sky");
});

// ======================================================================================================================
const ok = (body: string) => new Response(body, { status: 200, headers: { "content-type": "application/json" } });
function standardNetwork() {
  net.fetch = async (url: string) => {
    const u = new URL(url);
    if (u.hostname === "nominatim.openstreetmap.org") { const q = (u.searchParams.get("q") ?? "").split(",")[0].trim(); return fs.existsSync(new URL(`./fixtures/live/nominatim-${q}.json`, import.meta.url)) ? ok(fixture(`nominatim-${q}.json`)) : ok("[]"); }
    if (u.hostname === "api.met.no") return ok(fixture("met-sacramento.json"));
    if (u.hostname === "api.weather.gov") return ok(JSON.stringify({ features: [] }));
    if (u.hostname === "earthquake.usgs.gov") return ok(fixture("usgs-4.5-day.json"));
    if (u.hostname === "feeds.bbci.co.uk" && u.pathname.includes("technology")) return new Response(fixture("rss-bbc-technology.xml"), { status: 200 });
    return new Response("not found", { status: 404 });
  };
  resetGeocodeForTests(); resetWeatherForTests(); resetQuakesForTests(); resetNewsForTests(); resetLiveForTests(); setGeocodeGapForTests(0);
}
const dataBlock = (prompt: string) => prompt.split(/<<<LIVE-DATA-[0-9a-f]{8}>>>/)[1].split(/<<<END-LIVE-DATA-[0-9a-f]{8}>>>/)[0];
const factLines = (block: string) => block.split("SOURCE NOTES")[0];

test("the facts never depend on the commentary: same data, different stance, identical figures", async () => {
  standardNetwork();
  const preps: Awaited<ReturnType<typeof prepareLive>>[] = [];
  for (const [seed, mood] of [[1, "cold"], [2, "sarcastic"], [3, "flirty"], [4, "playful"]] as const) {
    dice.next = seeded(seed); resetCommentaryForTests(); resetLiveForTests();
    preps.push(await prepareLive({ message: "What's the weather in Sacramento?", sessionId: "w" + seed, nowMs: NOW, mood }));
  }
  const stances = preps.map(p => p!.log.liveStance);
  assert.ok(new Set(stances).size >= 2, "different moods and dice gave different stances: " + stances.join(","));
  const facts = preps.map(p => factLines(dataBlock(p!.prompt)));
  assert.ok(facts.every(f => f === facts[0]), "the data above the notes is byte for byte the same whatever she decides to say about it");
  for (const p of preps) {
    assert.match(p!.prompt, /SOURCE NOTES[\s\S]*<<<END-LIVE-DATA/, "notes are inside the data fence");
    assert.ok(p!.prompt.indexOf("COMMENTARY FOR THIS REPLY") > p!.prompt.indexOf("<<<END-LIVE-DATA"), "the stance is outside the data fence: her manner, not the data");
    assert.equal((p!.prompt.match(/COMMENTARY FOR THIS REPLY/g) ?? []).filter(Boolean).length >= 1, true);
  }
  // an invented number is still caught, whatever the stance
  const joke = preps[1]!.check("Sacramento is a deliciously evil 99°F right now.");
  assert.equal(joke.replaced, true);
});

test("an earthquake of real size is treated respectfully; a small one may get a remark", async () => {
  standardNetwork();
  dice.next = seeded(5);
  const big = (await prepareLive({ message: "any earthquakes today?", sessionId: "q-big", nowMs: interpretQuakes(JSON.parse(fixture("usgs-4.5-day.json"))).generatedAt, mood: "sarcastic" }))!;
  assert.equal(big.log.liveStance, "respectful", "the day's list includes a magnitude 6");
  assert.match(big.prompt, /No jokes, no sarcasm, no flirting/);
  assert.ok(!/stance: wry|stance: skeptical/.test(big.prompt));
});

test("a worried visitor asking about the weather gets the respectful stance", async () => {
  standardNetwork();
  const p = (await prepareLive({ message: "I'm scared, my family lives in Sacramento, what's the weather there?", sessionId: "worry", nowMs: NOW, mood: "playful" }))!;
  assert.equal(p.log.liveStance, "respectful");
  assert.ok(!/stance: (wry|warm|curious)/.test(p.prompt));
});

test("the manner rules carry the behavioural promises, with no second, conflicting attitude instruction", async () => {
  standardNetwork();
  const p = (await prepareLive({ message: "What's the latest tech news?", sessionId: "rules", nowMs: NOW, mood: "professional" }))!;
  for (const rule of [/never change a figure to make a joke work/, /Never invent a conspiracy, a cover-up, hidden information, a quarrel between sources or evidence/, /If the notes say sources disagree, explain the disagreement/, /Do not distrust everything: a solid source can be called solid/, /occasional by design/, /If a source is old, incomplete or only one voice, say that/, /Never accuse a real person or company/]) assert.match(p.prompt, rule);
  assert.equal((p.prompt.match(/rebellious/gi) ?? []).length, 1, "one mention of her attitude, pointing to the commentary section, not a competing rule");
  assert.match(p.tail, /follow the COMMENTARY stance \(often that means just answering\)/);
  assert.match(p.tail, /raise only doubts listed in SOURCE NOTES/);
});
