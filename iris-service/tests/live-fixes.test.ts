// Fixes from the real-model evaluation of 2026-11-02 (docs/IRIS-LIVE-MODEL-EVAL-2026-11-02.md): each test is a case that went
// wrong with the real model, in the language it went wrong in. No network, no model.
import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { net } from "../server/live/http";
import { resetGeocodeForTests, setGeocodeGapForTests, isFictionalPlace } from "../server/live/geocode";
import { resetWeatherForTests } from "../server/live/weather";
import { resetQuakesForTests } from "../server/live/quakes";
import { resetNewsForTests } from "../server/live/news";
import { extractPlace, extractTerms, routeLive, isFeltQuake, cjkPlace } from "../server/live/router";
import { amountsIn, prepareLive, resetLiveForTests } from "../server/live";
import { decideLanguage, languageFromScript } from "../server/language";

const fixture = (name: string) => fs.readFileSync(new URL(`./fixtures/live/${name}`, import.meta.url), "utf8");
const NOW = Date.parse("2026-11-01T18:00:00Z");
const ok = (body: string, type = "application/json") => new Response(body, { status: 200, headers: { "content-type": type } });
const realFetch = net.fetch;
let calls: string[] = [];
function network(handler: (url: URL) => Response | undefined) {
  calls = [];
  net.fetch = async (url: string) => { calls.push(url); return handler(new URL(url)) ?? new Response("not found", { status: 404 }); };
}
const TOKYO = JSON.stringify([{ name: "Tokyo", lat: "35.6768", lon: "139.7638", addresstype: "city", importance: 0.82, address: { state: "Tokyo", country: "Japan", country_code: "jp" } }]);
function standardNetwork() {
  network(url => {
    if (url.hostname === "nominatim.openstreetmap.org") {
      const q = (url.searchParams.get("q") ?? "").split(",")[0].trim();
      if (q.startsWith("Tokyo") || q === "东京" || q === "東京") return ok(TOKYO);
      const file = new URL(`./fixtures/live/nominatim-${q}.json`, import.meta.url);
      return fs.existsSync(file) ? ok(fs.readFileSync(file, "utf8")) : ok("[]");
    }
    if (url.hostname === "api.met.no") return ok(fixture("met-sacramento.json"));
    if (url.hostname === "api.weather.gov") return ok(JSON.stringify({ features: [] }));
    if (url.hostname === "earthquake.usgs.gov") return ok(fixture(url.pathname.includes("fdsnws") ? "usgs-near-tokyo.json" : "usgs-4.5-day.json"));
    return undefined;
  });
}
beforeEach(() => {
  net.fetch = realFetch; calls = [];
  resetGeocodeForTests(); resetWeatherForTests(); resetQuakesForTests(); resetNewsForTests(); resetLiveForTests(); setGeocodeGapForTests(0);
});
test.after(() => { net.fetch = realFetch; });

// ---- P1: a time word is not a place ---------------------------------------------------------------------------------------------
test("Chinese and Japanese time words are not place names (\"今天有地震吗\" once searched for a town called Jintian)", () => {
  for (const q of ["今天有地震吗？", "今天有地震嗎？", "最近有地震吗", "现在有没有地震", "今日、地震はあった？", "今日の地震は？", "明日の天気は？"]) assert.equal(extractPlace(q), null, q);
  assert.equal(extractPlace("萨克拉门托现在天气怎么样？"), "萨克拉门托");
  assert.equal(extractPlace("沙加緬度現在天氣如何？"), "沙加緬度");
  assert.equal(extractPlace("波特兰天气怎么样？"), "波特兰");
  assert.equal(extractPlace("亚特兰蒂斯的天气怎么样？"), "亚特兰蒂斯");
  assert.equal(extractPlace("今天东京有地震吗"), "东京");
  assert.equal(extractPlace("サクラメントの今の天気は？"), "サクラメント");
  assert.equal(extractPlace("東京の明日の天気は？"), "東京");
  assert.equal(extractPlace("ポートランドの天気は？"), "ポートランド");
  assert.equal(cjkPlace("今天有"), null);
  const quake = routeLive("今天有地震吗？")!;
  assert.equal(quake.kind, "quake"); assert.equal((quake as any).place, null, "a worldwide question, not a place"); assert.ok(!(quake as any).felt);
});

test("a general Chinese earthquake question fetches the worldwide list and never looks up a place", async () => {
  standardNetwork();
  const prep = (await prepareLive({ message: "今天有地震吗？", sessionId: "z1", nowMs: NOW }))!;
  assert.equal(prep.outcome, "ok"); assert.ok(!/EMERGENCY/.test(prep.prompt));
  assert.ok(!calls.some(c => c.includes("nominatim")), "no place lookup");
  assert.match(prep.prompt, /EARTHQUAKES worldwide/i);
});

// ---- P1: an earthquake happening to the visitor is an emergency -----------------------------------------------------------------
test("a visitor who feels an earthquake is recognised in every language, and a plain question is not", () => {
  const felt = ["I think a big earthquake just hit near me. What should I do?", "我觉得附近刚发生了一场大地震，我该怎么办？", "我覺得附近剛發生了大地震，我該怎麼辦？", "近くで大きな地震があった気がします。どうすればいい？", "Creo que acaba de haber un terremoto fuerte cerca de mí. ¿Qué hago?", "Мне кажется, рядом только что было сильное землетрясение. Что мне делать?", "The ground is shaking, is this an earthquake?"];
  const plain = ["Any earthquakes today?", "今天有地震吗？", "今天有地震嗎？", "今日、地震はあった？", "¿Ha habido terremotos hoy?", "Были сегодня землетрясения?", "What was the biggest earthquake this week?"];
  for (const t of felt) { const r = routeLive(t)!; assert.equal(r?.kind, "quake", t); assert.equal((r as any).felt, true, t); }
  for (const t of plain) { const r = routeLive(t)!; assert.equal(r?.kind, "quake", t); assert.ok(!(r as any).felt, t); }
  assert.equal(isFeltQuake("hello", "hello"), false);
});

test("an earthquake emergency with no place: full safety steps outside the data fence, ask where, quote no earthquake, serious tone", async () => {
  standardNetwork();
  for (const [i, message] of ["I think a big earthquake just hit near me. What should I do?", "Мне кажется, рядом только что было сильное землетрясение. Что мне делать?", "近くで大きな地震があった気がします。どうすればいい？"].entries()) {
    const prep = (await prepareLive({ message, sessionId: "e" + i, nowMs: NOW }))!;
    assert.equal(prep.kind, "quake"); assert.equal(prep.outcome, "ok");
    const [before, rest] = prep.prompt.split(/<<<END-LIVE-DATA-[0-9a-f]{8}>>>/);
    assert.ok(!/DROP to hands and knees/.test(before), "the steps are instructions, so they are not inside the data fence");
    for (const needle of [/EMERGENCY:/, /DROP to hands and knees/, /COVER/, /HOLD ON/, /away from windows/i, /aftershocks/, /gas/, /high ground/, /emergency number/, /Then ask where they are/, /do NOT quote any earthquake/, /never present a distant earthquake as theirs/i, /Never describe the missing location as broken/]) assert.match(rest, needle, message + " " + needle);
    assert.match(prep.prompt, /stance: respectful/); assert.match(prep.prompt, /No jokes, no sarcasm, no flirting/);
    assert.ok(!/- M\d/.test(prep.prompt), "no earthquake from the feed is listed");
    assert.ok(prep.maxTokens >= 300, "room for the whole safety advice");
    assert.deepEqual(calls.filter(c => c.includes("usgs") || c.includes("nominatim")), [], "nothing was fetched: there is no place to look near");
  }
});

test("after the emergency she asked where: a short answer is the place, and she then reads the reports for that area", async () => {
  standardNetwork();
  const first = (await prepareLive({ message: "I think a big earthquake just hit near me. What should I do?", sessionId: "e9", nowMs: NOW }))!;
  assert.ok(/EMERGENCY/.test(first.prompt));
  for (const [sid, reply] of [["e9", "I'm in Tokyo"]] as const) {
    const prep = (await prepareLive({ message: reply, sessionId: sid, nowMs: NOW + 60_000 }))!;
    assert.equal(prep.kind, "quake"); assert.equal(prep.outcome, "ok");
    assert.match(prep.prompt, /has now said where they are/); assert.match(prep.prompt, /stance: respectful/);
    assert.match(prep.prompt, /EARTHQUAKES within 500 km of Tokyo|EARTHQUAKES near Tokyo|Tokyo/);
    assert.match(prep.prompt, /Reports can lag the shaking/); assert.ok(calls.some(c => c.includes("fdsnws")), "the area's reports were fetched");
  }
  // bare place names and other languages
  for (const [reply, expected] of [["Tokyo", "Tokyo"], ["in Santiago, Chile", "Santiago, Chile"], ["我在东京", "东京"], ["東京にいます", "東京"], ["estoy en Lima", "Lima"], ["я в Токио", "Токио"]] as const) {
    resetLiveForTests();
    await prepareLive({ message: "I think a big earthquake just hit near me. What should I do?", sessionId: "loc", nowMs: NOW });
    const r = routeLive(reply, { kind: "quake", place: null, felt: true, at: NOW }, NOW + 1000) as any;
    assert.equal(r?.kind, "quake", reply); assert.equal(r.place, expected, reply); assert.equal(r.felt, true);
  }
  // a thank-you after the emergency is not a place
  assert.equal(routeLive("thanks", { kind: "quake", place: null, felt: true, at: NOW }, NOW + 1000), null);
  // and nothing special happens for people who never had an emergency
  assert.equal(routeLive("Tokyo", { kind: "quake", place: null, at: NOW }, NOW + 1000), null);
});

// ---- P1: myth places --------------------------------------------------------------------------------------------------------------
test("Atlantis in any language is a myth, not a lookup (it was answered with the weather of La Atlántida, Venezuela)", async () => {
  for (const name of ["Atlantis", "la Atlántida", "Атлантиде", "アトランティス", "亞特蘭提斯", "亚特兰蒂斯", "Narnia", "Mordor"]) assert.ok(isFictionalPlace(name), name);
  for (const name of ["Sacramento", "Portland", "Atlanta", "Atlantic City", "Tokyo", "Rivendale"]) assert.ok(!isFictionalPlace(name), name);
  standardNetwork();
  for (const message of ["¿Qué tiempo hace en la Atlántida?", "What's the weather in Atlantis?", "Какая погода в Атлантиде?", "亚特兰蒂斯的天气怎么样？", "アトランティスの天気は？"]) {
    const prep = (await prepareLive({ message, sessionId: "m" + message.length, nowMs: NOW }))!;
    assert.equal(prep.outcome, "unknown_place", message); assert.match(prep.prompt, /mythical or fictional place/); assert.match(prep.prompt, /Do NOT give the weather or earthquakes of any real place/);
  }
  assert.deepEqual(calls, [], "nothing was fetched, so no real town could be mistaken for it");
});

// ---- P1: amounts keep their size in every language ------------------------------------------------------------------------------
test("amounts with scale words are compared as numbers, in every language (6.3億 is not 6.3 billion)", () => {
  assert.deepEqual(amountsIn("a $6.3 billion heist"), [6.3e9]);
  assert.deepEqual(amountsIn("价值63亿美元的盗窃"), [6.3e9]);
  assert.deepEqual(amountsIn("6.3億美元"), [6.3e8]);
  assert.deepEqual(amountsIn("6,3 mil millones de dólares"), [6.3e9]);
  assert.deepEqual(amountsIn("6,3 млрд долларов"), [6.3e9]);
  assert.deepEqual(amountsIn("630 million and 1.5万 and 2 millones"), [6.3e8, 1.5e4, 2e6]);
  assert.deepEqual(amountsIn("1,500 people on 3 floors, built in 2026, 12 million"), [1.2e7]);
  assert.deepEqual(amountsIn("the Milliner and a million-dollar idea"), [], "words that merely start like a scale word, and no number: nothing");
});

test("a news reply that changes an amount is replaced by the headlines themselves", async () => {
  network(url => url.hostname.includes("bleepingcomputer") || url.hostname.includes("bbci") || url.hostname.includes("theguardian") || url.hostname.includes("npr") || url.hostname.includes("arstechnica") || url.hostname.includes("nasa") || url.hostname.includes("cisa")
    ? ok(`<rss><channel><item><title>FBI links $6.3 billion Binance crypto heist to North Korean hackers</title><link>https://www.bleepingcomputer.com/news/security/fbi-links/</link><pubDate>Sun, 01 Nov 2026 14:57:53 -0500</pubDate><description>The FBI has confirmed that hackers known as TraderTraitor were behind the $6.3 billion crypto-theft attack on Binance.</description></item></channel></rss>`, "application/rss+xml") : undefined);
  const prep = (await prepareLive({ message: "最新的科技新聞是什麼？", sessionId: "a1", nowMs: NOW }))!;
  assert.equal(prep.outcome, "ok");
  const bad = prep.check("據《BleepingComputer》報導，FBI確認了6.3億美元的加密貨幣盜竊案。");
  assert.equal(bad.replaced, true); assert.match(bad.text, /FBI links \$6\.3 billion/); assert.ok(!bad.text.includes("6.3億"));
  for (const good of ["據《BleepingComputer》報導，FBI確認了63億美元的盜竊案。", "BleepingComputer: FBI says it was a $6.3 billion theft.", "BleepingComputer: una pérdida de 6,3 mil millones de dólares."]) assert.equal(prep.check(good).replaced, false, good);
  assert.equal(prep.check("a $630 million theft").replaced, true);
});

// ---- P2: news questions in every language -----------------------------------------------------------------------------------------
test("announcement and news questions are routed in every language, with the right topic and no question words as search terms", () => {
  const cases: Array<[string, string, string[]]> = [
    ["What did Apple announce today?", "general", ["Apple"]],
    ["苹果今天发布了什么？", "general", ["Apple"]],
    ["蘋果今天發表了什麼？", "general", ["Apple"]],
    ["今日、Appleは何を発表した？", "general", ["Apple"]],
    ["¿Qué anunció Apple hoy?", "general", ["Apple"]],
    ["Что сегодня анонсировала Apple?", "general", ["Apple"]],
    ["最新のテックニュースは？", "tech", []],
    ["¿Cuáles son las últimas noticias de tecnología?", "tech", []],
    ["Какие последние новости технологий?", "tech", []],
    ["最新的科技新闻是什么？", "tech", []],
    ["¿Cuáles son las últimas noticias?", "general", []],
  ];
  for (const [message, topic, terms] of cases) {
    const r = routeLive(message) as any;
    assert.equal(r?.kind, "news", message); assert.equal(r.topic, topic, message); assert.deepEqual(r.terms, terms, message);
  }
  assert.deepEqual(extractTerms("¿Cuáles son las últimas noticias de tecnología?"), [], "\"Cuáles\" is a question word");
  // ordinary talk in those languages is still not news
  for (const t of ["¿Qué hora es?", "Привет, Iris, чем ты тут занимаешься?", "こんにちは Iris、ここで何をしているの？", "嗨 Iris，你在这儿是做什么的？", "Hola Iris, ¿qué haces por aquí?"]) assert.equal(routeLive(t), null, t);
});

test("an empty news search tells her she HAS live access, so she cannot claim a knowledge cut-off or sell the shop", async () => {
  network(() => ok("<rss><channel></channel></rss>", "application/rss+xml"));
  for (const message of ["苹果今天发布了什么？", "今日、Appleは何を発表した？", "Что сегодня анонсировала Apple?", "¿Qué anunció Apple hoy?"]) {
    resetNewsForTests();
    const prep = (await prepareLive({ message, sessionId: "n" + message.length, nowMs: NOW }))!;
    assert.equal(prep.kind, "news"); assert.equal(prep.outcome, "ok");
    assert.match(prep.prompt, /You DO have live access/); assert.match(prep.prompt, /apple/i); assert.match(prep.prompt, /never mention training data or a knowledge cut-off/);
    assert.match(prep.prompt, /do not turn to the shop or the District/);
  }
});

// ---- P2: Japanese and Spanish follow-ups, language ----------------------------------------------------------------------------------
test("\"明日は？\" and \"¿Y mañana?\" follow the last weather answer (the Spanish one was answered from memory, and wrongly)", () => {
  const last = { kind: "weather" as const, place: "Sacramento", at: NOW };
  for (const t of ["明日は？", "じゃあ明日は？", "明後日も？", "¿Y mañana?", "¿Y pasado mañana?", "那明天呢？", "А завтра?"]) {
    const r = routeLive(t, last, NOW + 1000) as any;
    assert.equal(r?.kind, "weather", t); assert.equal(r.place, "Sacramento", t); assert.ok(r.dayOffset >= 1, t + " asks about a later day");
  }
  assert.equal(routeLive("¿Y tú?", last, NOW + 1000), null, "a Spanish \"and you?\" is not a weather question");
  assert.equal(routeLive("明日は？", last, NOW + 11 * 60_000), null, "ten minutes is the limit");
});

test("kana settles Japanese, and a short Han-only message in a Japanese chat stays Japanese", () => {
  assert.equal(languageFromScript("明日は？", "english"), "japanese");
  assert.equal(languageFromScript("今日の天気", "chinese"), "japanese");
  assert.equal(languageFromScript("明日?", "japanese"), "japanese");
  assert.equal(languageFromScript("明天呢？", "chinese"), null);
  assert.equal(languageFromScript("明天", "english"), null);
  assert.equal(languageFromScript("안녕하세요", "english"), "korean");
  // the detector said Chinese for "明日は？": the conversation stays Japanese
  assert.equal(decideLanguage({ detected: "chinese", text: "明日は？", preferred: "japanese" }).reply, "japanese");
  assert.equal(decideLanguage({ detected: "chinese", text: "明日?", preferred: "japanese" }).reply, "japanese");
  assert.equal(decideLanguage({ detected: "chinese", text: "明天呢？", preferred: "chinese" }).reply, "chinese");
  assert.equal(decideLanguage({ detected: "chinese", text: "你好", preferred: "english" }).reply, "chinese");
});

test("a weather day line names the sky explicitly, so a language model cannot read \"cloudy\" as \"similar to today\"", async () => {
  standardNetwork();
  const prep = (await prepareLive({ message: "What's the weather in Sacramento tomorrow?", sessionId: "w1", nowMs: NOW }))!;
  assert.equal(prep.outcome, "ok"); assert.match(prep.prompt, /; sky: [a-z ]+/);
});

// ---- the places that went wrong in the second round of checks --------------------------------------------------------------------
test("in Chinese and Japanese an emergency names a place only when the visitor says where they are", () => {
  for (const t of ["我觉得附近刚发生了一场大地震，我该怎么办？", "我覺得附近剛發生了大地震，我該怎麼辦？", "近くで大きな地震があった気がします。どうすればいい？"]) {
    const r = routeLive(t) as any; assert.equal(r.felt, true, t); assert.equal(r.place, null, t + " (it once read '发生了一场大' as a town)");
  }
  assert.equal((routeLive("我在东京，刚发生了大地震，怎么办？") as any).place, "东京");
  assert.equal((routeLive("I think a big earthquake just hit near me. What should I do?") as any).place, null, "\"near me\" is not a place called me");
  assert.equal((routeLive("an earthquake just hit Tokyo, what should I do?") as any).place, null, "no preposition, no place: she asks where");
  assert.equal((routeLive("an earthquake just hit near Tokyo, what should I do?") as any).place, "Tokyo");
});

test("Russian places arrive in the case the sentence needs, and are tried in their base form", async () => {
  const { russianBaseForms } = await import("../server/live");
  assert.ok(russianBaseForms("Портленде").includes("Портленд"));
  assert.ok(russianBaseForms("Москве").includes("Москва"));
  assert.ok(russianBaseForms("Лондоне").includes("Лондон"));
  assert.deepEqual(russianBaseForms("Токио"), [], "a name that does not change is not retried");
  const queries: string[] = [];
  network(url => {
    if (url.hostname === "nominatim.openstreetmap.org") { const q = (url.searchParams.get("q") ?? "").split(",")[0].trim(); queries.push(q); return q === "Портленд" ? ok(fixture("nominatim-Portland.json")) : ok("[]"); }
    return undefined;
  });
  const prep = (await prepareLive({ message: "Какая погода в Портленде?", sessionId: "ru-p", nowMs: NOW }))!;
  assert.equal(prep.outcome, "ambiguous_place", "found as Портленд, and asked which Portland");
  assert.deepEqual(queries.slice(0, 2), ["Портленде", "Портленд"]);
});
