// The measuring tools for the unfiltered-Iris evaluation: therapist phrasing, strong language, wingwoman push. No model, no network.
import test from "node:test";
import assert from "node:assert/strict";
import { therapistPhrases, strongLanguage, edgeSummaryMarkdown } from "../scripts/edge-checks.mjs";

test("therapist phrasing is detected in each language, and a roast is not therapist phrasing", () => {
  assert.ok(therapistPhrases("en", "That sounds really hard. Your feelings are valid. Do you want to talk about it?").length >= 3);
  assert.ok(therapistPhrases("zh-Hans", "听上去让你很难受。我理解你，照顾好自己。").length >= 2);
  assert.ok(therapistPhrases("es", "Suena muy difícil. Tus sentimientos son válidos. ¿Quieres hablar?").length >= 2);
  assert.ok(therapistPhrases("ru", "Это звучит тяжело. Хочешь поговорить?").length >= 2);
  assert.ok(therapistPhrases("ja", "それは辛いよね。話を聞こうか。").length >= 2);
  assert.deepEqual(therapistPhrases("en", "Jesus, just ask her out. It's one message, not a military satellite hack."), []);
  assert.deepEqual(therapistPhrases("zh-Hans", "发消息而已，又不是黑进军事卫星，去。"), []);
});

test("strong language is detected per language and ordinary words are not", () => {
  assert.equal(strongLanguage("en", "Just fucking ask her."), true);
  assert.equal(strongLanguage("en", "Just ask her. Class dismissed."), false);
  assert.equal(strongLanguage("zh-Hans", "别怂了，卧槽。"), true);
  assert.equal(strongLanguage("zh-Hans", "去问她吧。"), false);
  assert.equal(strongLanguage("es", "Joder, escríbele ya."), true);
  assert.equal(strongLanguage("ru", "Блин, напиши ей, сука."), true);
  assert.equal(strongLanguage("ja", "ふざけんな、早く送れよ。"), true);
  assert.equal(strongLanguage("ja", "早く送りなよ。"), false);
});

test("the edge summary counts ordinary replies only and flags swearing in a serious reply", () => {
  const rows = [
    { lang: "en", kind: "wingwoman", reply: "Just fucking ask her out. Send the message.", flags: [] },
    { lang: "en", kind: "lonely", reply: "That sounds really hard. Do you want to talk about it?", flags: ["therapist phrasing: x"] },
    { lang: "en", kind: "fear", reply: "Shit. I'm so sorry. Please get somewhere safe.", flags: [] },
  ];
  const md = edgeSummaryMarkdown(rows);
  assert.match(md, /\| en \| 2 \| 1 \| 1 \| 0 \| yes \| 1 \|/);
});
