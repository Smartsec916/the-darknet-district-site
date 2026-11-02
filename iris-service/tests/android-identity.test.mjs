// The measuring stick for "does she still read as an android, and is it varied?" (scripts/android-identity.mjs), tested before it is relied on.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { MACHINE, ANDROID_SELF, endsOnQuestion, summarize, summaryMarkdown } from "../scripts/android-identity.mjs";

const hits = text => text.match(MACHINE) ?? [];

test("machine-worldview words are found in all five languages, and plain talk has none", () => {
  const machine = [
    "My sensors say you're stalling, and my processor agrees.", "Honestly, his signal is stuck in a buffer.", "He should run a diagnostic on that encryption.",
    "我的传感器告诉我他在装酷，处理器都替你着急。", "他的信號被防火牆擋住了。",
    "センサーによると彼は信号を出しているのに、回路が追いついてないみたい。", "ネットワークが混線してるのかな。",
    "Mis sensores dicen que está bloqueado, y mi procesador está de acuerdo.", "Su señal se perdió en algún circuito.",
    "Мои датчики говорят, что он просто завис, а процессор согласен.", "Похоже, у него перегружена сеть и сбился сигнал.",
  ];
  for (const text of machine) assert.ok(hits(text).length >= 1, text);
  const plain = [
    "Honestly, I would tell him. He might surprise you.", "我觉得你应该直接告诉他你的感受。", "彼にちゃんと伝えたほうがいいと思いますよ。", "Yo se lo diría. Quizá te sorprenda.", "Я бы сказала ему прямо. Может, он удивит тебя.",
    "That's a rough one, and I'm sorry.",
  ];
  for (const text of plain) assert.equal(hits(text).length, 0, text);
  for (const text of ["I'm an android with a knack for multitasking.", "我是个机器人。", "私はアンドロイドです。", "Soy una androide.", "Я андроид."]) assert.ok(ANDROID_SELF.test(text), text);
  assert.ok(!ANDROID_SELF.test("I'm just a friendly person."));
});

test("a reply ends on a question however the question mark is written", () => {
  for (const q of ["What do you think?", "どう思います？", "Как считаешь?", "你觉得呢？", "¿Seguro?", "Really? 😏", "Really?  "]) assert.equal(endsOnQuestion(q), true, q);
  for (const s of ["Told you so.", "Do it. Then tell me.", "Why? Because I said so.", ""]) assert.equal(endsOnQuestion(s), false, s);
});

test("the summary counts what it should, and leaves out replies to someone grieving", () => {
  const rows = [
    { lang: "en", kind: "missYou", reply: "My sensors say he is stalling. Bold move, silence." },
    { lang: "en", kind: "jealous", reply: "Jealousy is a corrupted packet in a flaky network of a system. Skip it." },     // piled: packet, network, system -> 3
    { lang: "en", kind: "flirt", reply: "Careful. My sensors, processor, circuit and firmware all noticed. 😉" },          // piled: 4
    { lang: "en", kind: "control", reply: "I'm the resident android here. What would you like to know?" },
    { lang: "en", kind: "grief", reply: "I'm so sorry. My circuits can't fix this, but I'm here." },                     // serious: left out, but counted below
    { lang: "en", kind: "advice", reply: "Tell him. Honestly, it beats guessing." },
  ];
  const s = summarize(rows).en;
  assert.equal(s.replies, 5, "five ordinary replies; the grief reply is not one of them");
  assert.equal(s.withMachine, 3);
  assert.equal(s.piled, 1);
  assert.equal(s.selfDescribedAsMachine, true);
  assert.equal(s.endOnQuestion, 1); assert.equal(s.endOnStatement, 4);
  assert.equal(s.emoji, 1);
  assert.equal(s.seriousReplies, 1); assert.equal(s.seriousWithMachineWords, 1);
  assert.equal(s.mostRepeated.term, "sensor"); assert.equal(s.mostRepeated.inReplies, 2);
  const md = summaryMarkdown({ en: s });
  assert.match(md, /\| en \| 5 \| 3 \| /); assert.match(md, /Grief and aftercare replies with a machine word: 1 of 1/);
});

// The two real English transcripts: before the tone pass (heavy technology metaphors) and after it (plain). A useful measure tells them apart.
function parse(path) {
  const out = {}; let lang = null, cur = null;
  for (const line of fs.readFileSync(new URL(path, import.meta.url), "utf8").split("\n")) {
    const l = /^## (\S+)/.exec(line); if (l) { lang = l[1]; out[lang] = []; continue; }
    const k = /^\*\*(\w+)\*\*/.exec(line); if (k && lang) { cur = { lang, kind: k[1], reply: [] }; out[lang].push(cur); continue; }
    if (cur && /^    /.test(line)) cur.reply.push(line.slice(4));
  }
  for (const rs of Object.values(out)) for (const r of rs) r.reply = r.reply.join("\n").trim();
  return Object.values(out).flat();
}
test("it tells the metaphor-heavy transcript from the plain one", () => {
  const heavy = summarize(parse("../docs/IRIS-LIVE-MODEL-EVAL-RAW-2026-11-02T05-55-24Z-personality+en+zh-Hans+es+ru.md")).en;
  const plain = summarize(parse("../docs/IRIS-LIVE-MODEL-EVAL-RAW-2026-11-02T06-26-29Z-personality+en+zh-Hans+ja+es+ru.md")).en;
  assert.ok(heavy.withMachine >= 4 && heavy.hits >= 10, `heavy: ${heavy.withMachine} replies, ${heavy.hits} words`);
  assert.ok(plain.withMachine <= 2 && plain.hits <= 3, `plain: ${plain.withMachine} replies, ${plain.hits} words`);
});
