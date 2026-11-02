// Two problems from the 2026-11-02 multilingual evaluation (docs/IRIS-LIVE-MODEL-EVAL-2026-11-02-MULTILINGUAL-REVIEW.md):
//  1. a Traditional-Chinese visitor was answered in Simplified characters (9 of 10 replies), because the instruction said only "Chinese";
//  2. a Japanese visitor's news reply was replaced by a fallback written in Chinese, because every CJK message was treated as Chinese.
// No network, no model.
import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { net } from "../server/live/http";
import { resetGeocodeForTests, setGeocodeGapForTests } from "../server/live/geocode";
import { resetWeatherForTests } from "../server/live/weather";
import { resetQuakesForTests } from "../server/live/quakes";
import { resetNewsForTests } from "../server/live/news";
import { prepareLive, resetLiveForTests } from "../server/live";
import { fallbackLanguage } from "../server/live/fallbackText";
import { chineseScript, decideLanguage, languageReminder } from "../server/language";

const fixture = (name: string) => fs.readFileSync(new URL(`./fixtures/live/${name}`, import.meta.url), "utf8");
const ok = (body: string, type = "application/json") => new Response(body, { status: 200, headers: { "content-type": type } });
const NOW = Date.parse("2026-11-01T18:00:00Z");
const realFetch = net.fetch;
beforeEach(() => {
  net.fetch = realFetch;
  resetGeocodeForTests(); resetWeatherForTests(); resetQuakesForTests(); resetNewsForTests(); resetLiveForTests(); setGeocodeGapForTests(0);
});
test.after(() => { net.fetch = realFetch; });

// ---- Chinese script -------------------------------------------------------------------------------------------------------------
test("the script is read from the visitor's own characters, and an explicit request wins", () => {
  for (const message of ["沙加緬度現在天氣如何？", "最新的科技新聞是什麼？", "我覺得附近剛發生了大地震，我該怎麼辦？", "嗨 Iris，你在這裡是做什麼的？", "蘋果今天發表了什麼？", "東京現在幾點？今天幾號？"]) {
    assert.equal(chineseScript(message), "traditional", message);
  }
  for (const message of ["萨克拉门托现在天气怎么样？", "最新的科技新闻是什么？", "我觉得附近刚发生了大地震，我该怎么办？", "嗨 Iris，你在这儿是做什么的？", "东京现在几点？今天是几号？"]) {
    assert.equal(chineseScript(message), "simplified", message);
  }
  assert.equal(chineseScript("好"), null, "nothing to go by");
  assert.equal(chineseScript("雨 台 里"), null, "characters shared by both scripts decide nothing");
  assert.equal(chineseScript("请用繁體中文回答"), "traditional", "asked for Traditional");
  assert.equal(chineseScript("請用簡體中文"), "simplified", "asked for Simplified");
});

test("a Traditional-script chat is told to answer in Traditional characters, and keeps that through a short message", () => {
  const first = decideLanguage({ detected: "chinese", text: "沙加緬度現在天氣如何？", preferred: "english" });
  assert.equal(first.script, "traditional");
  const instruction = languageReminder(first, true);
  assert.match(instruction, /Reply in Chinese/); assert.match(instruction, /Traditional characters only, never Simplified/);

  // "好" has no distinguishing character: the earlier script holds
  const short = decideLanguage({ detected: "chinese", text: "好", preferred: "chinese", preferredScript: "traditional" });
  assert.equal(short.script, "traditional");
  assert.match(languageReminder(short, true), /Traditional characters only/);

  // a Simplified-script chat is told the opposite, and a switch of script follows the new message
  const simplified = decideLanguage({ detected: "chinese", text: "东京现在几点？", preferred: "chinese", preferredScript: "traditional" });
  assert.equal(simplified.script, "simplified");
  assert.match(languageReminder(simplified, true), /Simplified characters only, never Traditional/);

  // no script information at all: the instruction is exactly what it was
  const unknown = decideLanguage({ detected: "chinese", text: "好", preferred: "chinese" });
  assert.equal(unknown.script, undefined);
  assert.doesNotMatch(languageReminder(unknown, true), /Traditional|Simplified/);
});

test("the script note belongs to Chinese replies only", () => {
  for (const [detected, text] of [["japanese", "サクラメントの天気は？"], ["spanish", "¿Qué tiempo hace?"], ["russian", "Какая погода?"]] as const) {
    const decision = decideLanguage({ detected, text, preferred: "chinese", preferredScript: "traditional" });
    assert.equal(decision.script, undefined, detected);
    assert.doesNotMatch(languageReminder(decision, true), /Traditional|Simplified/, detected);
  }
  const english = decideLanguage({ detected: "english", text: "What is the weather in Sacramento today?", preferred: "chinese", preferredScript: "traditional" });
  assert.equal(languageReminder(english, true).includes("Traditional"), false);
});

// ---- fallbacks in the visitor's language ---------------------------------------------------------------------------------------
test("the replacement text is chosen by the visitor's language, and Japanese is not treated as Chinese", () => {
  const cases: Array<[string, string]> = [
    ["最新のテックニュースは？", "ja"], ["今日、地震はあった？", "ja"], ["東京の明日の天気は？", "ja"],
    ["最新的科技新闻是什么？", "zh-Hans"], ["最新的科技新聞是什麼？", "zh-Hant"],
    ["¿Cuáles son las últimas noticias de tecnología?", "es"], ["Какие последние новости технологий?", "ru"], ["What's the latest tech news?", "en"],
  ];
  for (const [message, language] of cases) assert.equal(fallbackLanguage(message), language, message);
});

const feedFiles: Record<string, string> = {
  "/news/technology/rss.xml": "rss-bbc-technology.xml", "/news/business/rss.xml": "rss-bbc-business.xml",
  "/world/rss": "rss-guardian-world.xml", "/technology/artificialintelligenceai/rss": "rss-guardian-ai.xml",
};
async function newsPrep(message: string) {
  net.fetch = async (url: string) => {
    const file = feedFiles[new URL(url).pathname];
    return file ? ok(fixture(file), "application/rss+xml") : new Response("not found", { status: 404 });
  };
  return (await prepareLive({ message, sessionId: "fb-" + message.length, nowMs: NOW }))!;
}

test("a wrong number in a news reply is replaced by text in the visitor's own language and script", async () => {
  const heads: Array<[string, RegExp]> = [
    ["最新のテックニュースは？", /^ニュース元の見出しをそのまま/],
    ["最新的科技新聞是什麼？", /^直接來自新聞來源的標題/],
    ["最新的科技新闻是什么？", /^直接来自新闻源的标题/],
    ["¿Cuáles son las últimas noticias de tecnología?", /^Directo de las fuentes/],
    ["Какие последние новости технологий?", /^Прямо из источников/],
    ["What's the latest tech news?", /^Straight from the feeds/],
  ];
  for (const [message, head] of heads) {
    const prep = await newsPrep(message);
    assert.equal(prep.outcome, "ok", message);
    const fixed = prep.check("A $999 billion heist, 12345 arrests."); // numbers that are not in the data
    assert.equal(fixed.replaced, true, message + ": the made-up amount is caught");
    assert.match(fixed.text, head, message);
    if (message.startsWith("最新のテ")) assert.doesNotMatch(fixed.text, /直接来自|新闻源/, "Japanese is not given Chinese text");
  }
});

test("every fallback text exists for all six languages", async () => {
  const { newsFallbackText, quakeFallbackText, weatherFallbackText } = await import("../server/live/fallbackText");
  const messages = ["What's the news?", "最新的科技新闻是什么？", "最新的科技新聞是什麼？", "最新のニュースは？", "¿Qué noticias hay?", "Какие новости?"];
  const seen = new Set<string>();
  for (const message of messages) {
    const news = newsFallbackText(message, "1. x"), quake = quakeFallbackText(message, "worldwide", "M5.1 Somewhere (5 min ago)");
    const weather = weatherFallbackText(message, { place: "Sacramento", now: "16°C", feels: "16°C", condition: "clear", high: "19°C", low: "8°C", updated: "01:00 UTC" });
    for (const text of [news, quake, weather]) assert.ok(text.length > 20 && !/undefined/.test(text), message);
    seen.add(news.split("\n")[0]);
  }
  assert.equal(seen.size, 6, "six different languages, six different openings");
});
