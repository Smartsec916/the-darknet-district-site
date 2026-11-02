// From the 2026-11-02 multilingual re-checks (docs/IRIS-LIVE-MODEL-EVAL-2026-11-02-MULTILINGUAL-REVIEW.md):
//  - a Japanese emergency reply named 110 (the police number) as "the emergency number", chosen from the language alone;
//  - zh-Hant, es and ru emergency replies left out the coast step, and some left out the emergency number or the question about where
//    the visitor is;
//  - a failed model call told a Chinese visitor, in English, "Sorry, I got distracted for a second".
// No network, no model.
import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { net } from "../server/live/http";
import { resetGeocodeForTests, setGeocodeGapForTests } from "../server/live/geocode";
import { resetWeatherForTests } from "../server/live/weather";
import { resetQuakesForTests } from "../server/live/quakes";
import { resetNewsForTests } from "../server/live/news";
import { prepareLive, resetLiveForTests } from "../server/live";
import { failureReply, fallbackLanguage, type FailureKind } from "../server/live/fallbackText";
import { chineseScript } from "../server/language";

const NOW = Date.parse("2026-11-01T18:00:00Z");
const realFetch = net.fetch;
beforeEach(() => {
  net.fetch = realFetch;
  resetGeocodeForTests(); resetWeatherForTests(); resetQuakesForTests(); resetNewsForTests(); resetLiveForTests(); setGeocodeGapForTests(0);
});
test.after(() => { net.fetch = realFetch; });

test("the emergency instruction asks for every step and does not pick a country's number from the language", async () => {
  const messages = ["I think a big earthquake just hit near me. What should I do?", "近くで大きな地震があった気がします。どうすればいい？", "我覺得附近剛發生了大地震，我該怎麼辦？", "Creo que acaba de haber un terremoto fuerte cerca de mí. ¿Qué hago?"];
  for (const message of messages) {
    const prep = (await prepareLive({ message, sessionId: "em-" + message.length, nowMs: NOW }))!;
    assert.equal(prep.kind, "quake", message);
    assert.match(prep.prompt, /EMERGENCY:/, message);
    assert.match(prep.prompt, /Give ALL six steps, in this order, in every reply/, message);
    assert.match(prep.prompt, /never drop step 5 \(the coast\) or step 6 \(the emergency number\), and never drop the question at the end/, message);
    assert.match(prep.prompt, /never pick one number for them/, message);
    assert.match(prep.prompt, /911 in the US and Canada, 112 in the EU, 999 in the UK, 119 for fire and ambulance and 110 for police in Japan/, "Japan's two numbers always come together");
    assert.match(prep.prompt, /Then ask where they are \(city and country\)/, "and the question about where they are stays");
    assert.ok(prep.maxTokens >= 480, `room for all six steps in a longer language (${prep.maxTokens})`);
  }
});

test("a failed model call is answered in the visitor's language and script", () => {
  const messages: Array<[string, string]> = [
    ["東京現在幾點？今天幾號？", "zh-Hant"], ["东京现在几点？今天是几号？", "zh-Hans"], ["ロンドンは今何時？", "ja"],
    ["¿Qué hora es en Tokio y qué fecha es allí?", "es"], ["Сколько сейчас времени в Токио?", "ru"], ["What time is it in Tokyo?", "en"],
  ];
  const kinds: FailureKind[] = ["distracted", "quota", "busy"];
  for (const kind of kinds) {
    const seen = new Set<string>();
    for (const [message, language] of messages) {
      assert.equal(fallbackLanguage(message), language, message);
      const text = failureReply(kind, message);
      assert.ok(text.length > 10 && !/undefined/.test(text), `${kind} ${language}`);
      seen.add(text);
    }
    assert.equal(seen.size, 6, `${kind}: six languages, six texts`);
  }
  // English is exactly what it always was (stored histories and tests recognise it)
  assert.equal(failureReply("distracted", "What time is it in Tokyo?"), "Sorry, I got distracted for a second. Mind repeating that?");
  assert.equal(failureReply("busy", "hello there my friend"), "So many requests flowing through the District right now. Can we try again in a moment?");
  // the Traditional-Chinese texts are Traditional, the Simplified ones Simplified, and Japanese has kana
  for (const kind of kinds) {
    assert.notEqual(chineseScript(failureReply(kind, "東京現在幾點？")), "simplified", kind);
    assert.notEqual(chineseScript(failureReply(kind, "东京现在几点？")), "traditional", kind);
    assert.match(failureReply(kind, "ロンドンは今何時？"), /[ぁ-ん]/, kind);
  }
});
