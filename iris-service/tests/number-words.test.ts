// A headline that says "one million faces" in words allowed no amount, so a correct Japanese reply saying "100万人" was judged
// wrong and replaced by the plain headline list (found in the 2026-11-02 re-check of production f5d44b2). The data's own
// amounts are now read in digits and in words. The reply is still checked on its digits only. No network, no model.
import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { net } from "../server/live/http";
import { resetGeocodeForTests, setGeocodeGapForTests } from "../server/live/geocode";
import { resetWeatherForTests } from "../server/live/weather";
import { resetQuakesForTests } from "../server/live/quakes";
import { resetNewsForTests } from "../server/live/news";
import { amountsIn, prepareLive, resetLiveForTests, sourceAmountsIn } from "../server/live";

const NOW = Date.parse("2026-11-01T18:00:00Z");
const realFetch = net.fetch;
beforeEach(() => {
  net.fetch = realFetch;
  resetGeocodeForTests(); resetWeatherForTests(); resetQuakesForTests(); resetNewsForTests(); resetLiveForTests(); setGeocodeGapForTests(0);
});
test.after(() => { net.fetch = realFetch; });

test("amounts written in words are read on the data side", () => {
  const cases: Array<[string, number[]]> = [
    ["scan one million faces in WA trial", [1e6]], ["a million thanks", [1e6]], ["an estimated two hundred million users", [2e8]],
    ["twenty-five thousand jobs", [25000]], ["thirty five billion dollars", [35e9]], ["ten thousand", [1e4]],
    ["dos millones de personas", [2e6]], ["más de un millón de caras", [1e6]],
    ["$6.3 billion and $3.6bn", [6.3e9, 3.6e9]], ["122 arrests", []], ["one hundred people", []], ["bone million", []],
  ];
  for (const [text, expected] of cases) assert.deepEqual(sourceAmountsIn(text), expected, text);
});

test("a reply is still checked on its digits only, so ordinary phrases are not mistaken for amounts", () => {
  for (const reply of ["a million thanks for asking", "one million reasons to smile", "un millón de gracias"]) assert.deepEqual(amountsIn(reply), [], reply);
  assert.deepEqual(amountsIn("100万人の顔"), [1e6]);
});

// The three headlines the real model was given in the evaluation, in the feed format the news reader parses
const item = (title: string, link: string, published: string, description: string) =>
  `<item><title>${title}</title><link>${link}</link><pubDate>${published}</pubDate><description>${description}</description></item>`;
const FEED = `<?xml version="1.0"?><rss version="2.0"><channel><title>Technology</title>${[
  item("Police use facial recognition to scan one million faces in WA trial leading to 122 arrests", "https://example.org/a", "Sun, 01 Nov 2026 17:10:00 GMT", "Western Australia police scanned faces in a five-month technology trial."),
  item("FBI links $6.3 billion Binance crypto heist to North Korean hackers", "https://example.org/b", "Sun, 01 Nov 2026 12:00:00 GMT", "The FBI says TraderTraitor hackers stole crypto in the largest theft on record."),
  item("Binance users withdraw $3.6bn after record crypto hack", "https://example.org/c", "Sun, 01 Nov 2026 14:00:00 GMT", "Users pulled funds from the technology exchange after the hack."),
].join("")}</channel></rss>`;
async function newsPrep(message: string) {
  net.fetch = async () => new Response(FEED, { status: 200, headers: { "content-type": "application/rss+xml" } });
  return (await prepareLive({ message, sessionId: "nw-" + message.length, nowMs: NOW }))!;
}

test("the real Japanese reply that was thrown away is now accepted, and a wrong amount still is not", async () => {
  const prep = await newsPrep("最新のテックニュースは？");
  assert.equal(prep.outcome, "ok");
  assert.match(prep.prompt, /one million faces/, "the headline really says it in words");
  const good = "ガーディアンによると、西オーストラリア警察が顔認識の試験で100万人の顔をスキャンし、122人を逮捕しました。BleepingComputerは、FBIが63億ドルの暗号資産盗難を北朝鮮のハッカーと結び付けたと報じています。";
  assert.deepEqual(prep.check(good), { text: good, replaced: false }, "100万人 is the headline's one million");
  for (const wrong of ["警察が1000万人の顔をスキャンしました。", "盗まれたのは630億ドルです。", "A 999 billion heist."]) {
    const result = prep.check(wrong);
    assert.equal(result.replaced, true, wrong);
    assert.match(result.text, /^ニュース元の見出しをそのまま/, "and the replacement is Japanese");
  }
});
