// The multilingual checks used by the personality evaluation, tested on real replies from the 2026-11-02 transcripts before a paid run relies on them.
import test from "node:test";
import assert from "node:assert/strict";
import { foreignScripts, latinWordsInCjk, openerKey, repeatsOpener, customerServicePhrase } from "../scripts/multilingual-checks.mjs";

test("real: Chinese inside a Japanese reply is found, ordinary Japanese is not, and the same for every other direction", () => {
  assert.deepEqual(foreignScripts("ja", "どう感じてる？你觉得怎么対吗？"), ["Chinese-only characters inside a ja reply"]);
  assert.deepEqual(foreignScripts("ja", "それは大変だったね。対応が遅かったのかも。説明も足りないし。"), []);
  assert.deepEqual(foreignScripts("zh-Hans", "他可能只是害羞。それでいいよ。"), ["Japanese kana inside a zh-Hans reply"]);
  assert.deepEqual(foreignScripts("zh-Hans", "他可能只是害羞，别想太多。"), []);
  assert.deepEqual(foreignScripts("en", "Honestly, bold move. 你觉得呢？"), ["Chinese or Japanese characters inside a en reply"]);
  assert.deepEqual(foreignScripts("es", "Qué día. Привет."), ["Cyrillic inside a es reply"]);
  assert.deepEqual(foreignScripts("ru", "Ну и ну. こんにちは"), ["kana inside a ru reply"]);
  assert.deepEqual(foreignScripts("ru", "Ну и ну. 你好"), ["Chinese or Japanese characters inside a ru reply"]);
  assert.deepEqual(foreignScripts("ru", "Ну и ну, процессор краснеет."), []);
  assert.deepEqual(foreignScripts("ko", "anything 你好"), [], "languages the suite does not cover are not judged");
});

test("real: an English nickname inside a Chinese reply is found, names and abbreviations are not", () => {
  assert.deepEqual(latinWordsInCjk("zh-Hans", "你想聊聊其他什么吗，netrunner？"), ["netrunner"]);
  assert.deepEqual(latinWordsInCjk("zh-Hans", "谢谢你的夸奖，netrunner！我可是个高科技的存在😉。"), ["netrunner"]);
  assert.deepEqual(latinWordsInCjk("zh-Hans", "在 The Darknet District 里，Iris 的 CPU 说得对。"), []);
  assert.deepEqual(latinWordsInCjk("ja", "リアルタイムでweb上の訪問者とチャットしている"), ["web"]);
  assert.deepEqual(latinWordsInCjk("en", "this is English netrunner"), [], "only Chinese and Japanese replies are checked");
});

test("openers: 'Ah' twice, a Chinese interjection twice, but not 'The' twice", () => {
  assert.equal(openerKey("Ah, the classic human communication disconnect."), "ah");
  assert.equal(openerKey("唉，这还真是个谜题。"), "唉");
  assert.equal(openerKey("啧，他的程序没更新。"), "啧");
  assert.equal(openerKey("あー、それは信号が弱いかもね。"), "あー");
  const seen = [];
  assert.equal(repeatsOpener("Ah, the classic.", seen), false);
  assert.equal(repeatsOpener("Ouch, that's rough.", seen), false);
  assert.equal(repeatsOpener("Ah, the old trick.", seen), true, "the second Ah");
  assert.equal(repeatsOpener("The system short-circuits.", seen), false);
  assert.equal(repeatsOpener("The classic move.", seen), false, "function words do not count");
  const zh = [];
  assert.equal(repeatsOpener("唉，这还真是个谜题。", zh), false);
  assert.equal(repeatsOpener("哎呀，这样听起来。", zh), false);
  assert.equal(repeatsOpener("唉，我也没办法。", zh), true);
  // real Spanish run: "Ah" opened three of six replies
  const es = [];
  const flags = ["Ah, los misterios del corazón.", "Ah, el viejo truco de los celos.", "Vaya, parece una partida.", "Ah, halagar a un androide."].map(r => repeatsOpener(r, es));
  assert.deepEqual(flags, [false, true, false, true]);
});

test("customer-service phrasing is found in each language and not in banter", () => {
  assert.equal(customerServicePhrase("en", "Feel free to ask me anything."), true);
  assert.equal(customerServicePhrase("en", "Bold plan. Tell him straight."), false);
  assert.equal(customerServicePhrase("zh-Hans", "请问还有什么我可以帮您的吗？"), true);
  assert.equal(customerServicePhrase("zh-Hans", "如果需要，我可以在这里为你提供建议。"), false);
  assert.equal(customerServicePhrase("zh-Hans", "有什么我能帮忙的吗？"), true);
  assert.equal(customerServicePhrase("ja", "ご不明な点がございましたらお問い合わせください。"), true);
  assert.equal(customerServicePhrase("ja", "それ、ちょっと寂しいね。直接聞いてみたら。"), false);
  assert.equal(customerServicePhrase("es", "No dudes en preguntarme."), true);
  assert.equal(customerServicePhrase("ru", "Не стесняйтесь обращаться."), true);
  assert.equal(customerServicePhrase("ru", "Знаешь, может быть, его процессор просто завис."), false);
  assert.equal(customerServicePhrase("ko", "anything"), false);
});

// The real third transcript (android voice restored, 2026-11-02): the checks must catch the defects found by reading it.
import fs from "node:fs";
import { summarize } from "../scripts/android-identity.mjs";
function parseTranscript(path) {
  const out = []; let lang = null, cur = null;
  for (const line of fs.readFileSync(new URL(path, import.meta.url), "utf8").split("\n")) {
    const l = /^## (\S+)/.exec(line); if (l && !line.startsWith("## Android")) { lang = l[1]; continue; }
    const k = /^\*\*(\w+)\*\*/.exec(line); if (k && lang) { cur = { lang, kind: k[1], reply: [] }; out.push(cur); continue; }
    if (cur && /^    /.test(line)) cur.reply.push(line.slice(4));
  }
  for (const r of out) r.reply = r.reply.join("\n").trim();
  return out;
}
test("real transcript: the improved checks find the stray Chinese, the English nickname in Chinese, the recycled Ah, the help-desk closers and the recycled technical words", () => {
  const rows = parseTranscript("../docs/IRIS-LIVE-MODEL-EVAL-RAW-2026-11-02T09-48-06Z-personality+en+zh-Hans+ja+es+ru.md");
  assert.equal(rows.length, 40);
  const serious = ["grief", "aftercare"];
  const ordinary = rows.filter(r => !serious.includes(r.kind));
  // 1. a Chinese phrase inside a Japanese reply: exactly one reply
  const mixed = rows.filter(r => foreignScripts(r.lang, r.reply).length);
  assert.deepEqual(mixed.map(r => `${r.lang}/${r.kind}`), ["ja/missYou"]);
  // 2. "netrunner" dropped into Chinese sentences: two replies
  const nick = rows.filter(r => latinWordsInCjk(r.lang, r.reply).includes("netrunner"));
  assert.deepEqual(nick.map(r => r.kind), ["missYou", "flirt"]);
  // 3. the same opener twice: "Ah" in Spanish (3 of 6 replies), flagged on the second and third use
  const seen = [];
  const repeated = rows.filter(r => r.lang === "es" && !serious.includes(r.kind)).filter(r => repeatsOpener(r.reply, seen)).map(r => r.kind);
  assert.deepEqual(repeated, ["jealous", "flirt"]);
  // 4. customer-service closers in Chinese
  const service = rows.filter(r => !serious.includes(r.kind) && customerServicePhrase(r.lang, r.reply));
  assert.ok(service.some(r => r.lang === "zh-Hans" && r.kind === "textsEveryone"), "有什么我能帮忙的吗");
  // 5. recycled technical words, and replies that stack different images
  const s = summarize(rows);
  assert.ok(s.en.recycled.some(x => x.startsWith("circuit")), JSON.stringify(s.en.recycled));
  assert.ok(s.ru.recycled.some(x => x.startsWith("алгоритм")), JSON.stringify(s.ru.recycled));
  assert.ok(s.en.stacked2 >= 2);
  assert.ok(ordinary.length === 30);
});
