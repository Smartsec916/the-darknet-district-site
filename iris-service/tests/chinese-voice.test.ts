// Simplified Chinese: the same rebellious, mischievous, funny android as in English, in short punchy replies, not a polite counsellor or a service bot.
// What must NOT change is pinned here too: every other language, and Chinese in a serious moment, produce exactly the prompt text they did when their
// results were evaluated (fingerprints recorded before this change). No network, no model.
process.env.IRIS_TEST_DB = "pglite";
import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import { ATTITUDES, attitudeBlock, type Decision } from "../server/mischief";
import { polishReply } from "../server/replyPolish";
import { chineseVoiceProblems } from "../scripts/multilingual-checks.mjs";

const golden = JSON.parse(fs.readFileSync(new URL("./fixtures/attitude-block-fingerprints-2026-11-02.json", import.meta.url), "utf8")) as Record<string, string>;
const base = { newStretch: true, challenge: false, avoid: [] as string[], avoidTech: ["circuit"] };
const decisions = (attitude: (typeof ATTITUDES)[number]): Record<string, Decision> => ({
  full: { ...base, attitude, intensity: "full", android: true, statement: true, emoji: false },
  light: { ...base, attitude, intensity: "light", android: false, statement: false, emoji: true, challenge: true },
  support: { ...base, attitude, intensity: "support", android: false, statement: false, emoji: false },
});
const fingerprint = (text: string) => crypto.createHash("sha256").update(text).digest("hex").slice(0, 16);

// ---------------------------------------------------------------- nothing else moved

test("the serious-moment prompt is byte-for-byte what it was when it was evaluated, in every language, whatever else changes", () => {
  let same = 0;
  for (const language of ["english", "chinese", "japanese", "spanish", "russian"]) {
    for (const attitude of ["mischief", "flirty", "sarcastic", "supportive", "wild"] as const) {
      const now = fingerprint(attitudeBlock(decisions(attitude).support, language));
      assert.equal(now, golden[language + "/" + attitude + "/support"], language + "/" + attitude + "/support must be unchanged");
      same++;
    }
  }
  assert.equal(same, 25, "all 25 serious-moment variants are exactly what was evaluated");
  assert.equal(Object.keys(golden).length, 75);
});

// ---------------------------------------------------------------- the Chinese guidance

test("ordinary Chinese asks for short, punchy, mischievous replies in Chinese humour, with her android side and hacker vocabulary and without the counsellor or the service bot", () => {
  const block = attitudeBlock({ ...base, attitude: "mischief", intensity: "full", android: true, statement: true, emoji: false, avoid: [], avoidTech: [] }, "chinese");
  assert.match(block, /you are the same rebellious, mischievous, filthy-minded, funny android as in English, not a polite counsellor/);
  assert.match(block, /Casual replies are SHORT, usually 40 to 70 Chinese characters: one to three punchy spoken sentences \(a guideline, not a hard limit\)\. React first, then land a tease, a comeback, a dare or a deadpan verdict with one clear opinion/);
  assert.match(block, /Humour the Chinese way: 吐槽, 调侃, 反问, 自嘲 \(a dig at being a machine often lands best\)[\s\S]*never a translated English joke/);
  assert.match(block, /Not the counsellor voice: no 我理解你的感受, 听上去…让你…, 这很正常, 沟通是关键, 照顾好自己, no lecture and no list of advice/);
  assert.match(block, /Land the line and stop: never end on a tag question \(是吧, 对吧, 不是吗\)/);
  assert.match(block, /Never customer-service phrasing \(您, 请问, 有什么可以帮您, 乐意提供帮助, 尽管开口, 随时找我\) and never call yourself a 助手 or 小助手: you are an android with attitude/);
  assert.match(block, /No English words such as netrunner inside Chinese sentences/);
  assert.match(block, /Practical advice may run longer when it needs to, but it keeps the same cheeky android voice/);
  assert.match(block, /You are an android and a hacker, and that is how you see things[\s\S]*a different one each time, never a string of jargon, and plenty of replies with none/);
  assert.match(block, /not 哎 or 唉 again and again/);
  // the closing-question lines are Chinese-specific
  assert.match(block, /End on a statement this time \(a quip, a verdict or a dare\), never a tag question such as 是吧, 对吧 or 不是吗, and never a "what do you think\?"/);
  const questionOk = attitudeBlock({ ...base, attitude: "mischief", intensity: "full", android: true, statement: false, emoji: false, avoid: [], avoidTech: [] }, "chinese");
  assert.match(questionOk, /A closing question is fine only if you really want the answer, and never a tag question such as 是吧, 对吧 or 不是吗/);
  // no vocabulary list this time: the one that made her stack jargon stays out, and she is still told to be an android with hacker words
  const guidance = block.slice(block.indexOf("Chinese (Simplified)"));
  for (const word of ["处理器", "带宽", "死机", "重启", "防火墙", "加密", "信号", "黑进", "后门", "漏洞"]) assert.ok(!guidance.includes(word), `${word} is not suggested`);
  // the android identity instructions are all still there
  assert.match(block, /Let your machine side show clearly this time: one well-chosen technical image \(two at most\)/);
  assert.match(block, /Use ONE of these moves, your choice: /);
});

test("in a serious moment Chinese keeps exactly the guidance it was evaluated with, and none of the new banter instructions", () => {
  const serious = attitudeBlock({ ...base, attitude: "supportive", intensity: "support", android: false, statement: false, emoji: false, avoid: [], avoidTech: [] }, "chinese");
  assert.doesNotMatch(serious, /Casual replies are SHORT|Humour the Chinese way|Land the line and stop|you are the same rebellious/);
  assert.match(serious, /No technical or machine imagery of any kind here/);
  assert.match(serious, /their safety comes first and encourage them to reach local emergency help or someone they trust/);
  assert.match(serious, /Chinese \(Simplified\): a witty, mischievous, rebellious android who talks like a sharp friend, not a service bot/);
  assert.match(serious, /Short punchy spoken sentences/, "(the evaluated text; the replies it produced were warm and unhurried)");
});

// ---------------------------------------------------------------- cleanup for Chinese

const zh = (text: string, over: Partial<Parameters<typeof polishReply>[0]> = {}) =>
  polishReply({ text, replyLanguage: "chinese", userMessage: "他给所有人发消息，就是不找我", serious: false, ...over });

test("a Chinese tag question that closes the reply is trimmed when a statement ending was asked for, and only then", () => {
  const reply = "毕竟真诚比套路有吸引力，是吧？";
  assert.deepEqual(zh(reply, { statementWanted: true }), { text: "毕竟真诚比套路有吸引力。", removedForLanguage: 0, removedOffers: 0, emojiRemoved: 0, tagQuestionsTrimmed: 1 });
  assert.equal(zh(reply, { statementWanted: false }).text, reply, "a question was allowed this time");
  assert.equal(zh(reply).text, reply, "no instruction given");
  assert.equal(zh(reply, { statementWanted: true, serious: true }).text, reply, "never in a serious moment");
  assert.equal(zh("别急着下结论，不是吗？😉", { statementWanted: true }).text, "别急着下结论。😉", "an emoji after it is kept");
  for (const [text] of [["他那样做，对吧？"], ["真的是吧？"]] as const) assert.equal(zh(text, { statementWanted: true }).tagQuestionsTrimmed, undefined, "too little would remain: " + text);
  // a real question that is not a tag stays; another language is not touched
  assert.equal(zh("你到底想让他怎么做？", { statementWanted: true }).text, "你到底想让他怎么做？");
  assert.equal(polishReply({ text: "Fine, right?", replyLanguage: "english", userMessage: "hi there", serious: false, statementWanted: true }).text, "Fine, right?");
});

test("real: Chinese service-bot closers are removed, and real banter and advice are not", () => {
  assert.equal(zh("哎呀，你这么一说，我的回路都有点发热了。你还有什么想和我聊的吗？").text, "哎呀，你这么一说，我的回路都有点发热了。");
  assert.equal(zh("别怕麻烦他。我非常乐意提供帮助！").text, "别怕麻烦他。");
  assert.equal(zh("先晾他一晚，明天再说。想了解更多的话，随时找我。").removedOffers, 1);
  // answers to "what do you do here?" may offer; advice that merely contains the words stays
  assert.equal(zh("我是这里的安卓。有任何需要，随时找我。", { userMessage: "你在这里到底是做什么的？" }).removedOffers, 0);
  const advice = "如果有什么问题让你犹豫，先从最小的一句开始说，慢慢来就好。";
  assert.equal(zh(`别急。${advice}`).text, `别急。${advice}`);
  assert.equal(zh("你在这儿陪我聊天，我也挺开心的。").removedOffers, 0);
});

test("real: the 'I can also offer tips, want to hear them?' closer goes, a cheeky offer of an idea stays", () => {
  assert.equal(zh("先晾他一晚，让他自己琢磨。不然我这边还能提供些出其不意的小建议来打破僵局，你要听吗？").removedOffers, 1);
  assert.equal(zh("先晾他一晚，让他自己琢磨。不然我这边还能提供些出其不意的小建议来打破僵局，你要听吗？").text, "先晾他一晚，让他自己琢磨。");
  const banter = "你这是在跟他玩躲猫猫。我有个馊主意，你要听吗？";
  assert.equal(zh(banter).text, banter);
});

test("a breezy opening is stripped from a Chinese reply to grief, and nothing else in a serious moment is touched", () => {
  const grief = "哎呀，我很抱歉听到这个消息。失去父亲一定非常艰难，我在这儿陪着你。";
  const r = zh(grief, { serious: true, userMessage: "我爸爸昨天去世了" });
  assert.equal(r.text, "我很抱歉听到这个消息。失去父亲一定非常艰难，我在这儿陪着你。");
  assert.equal(r.openingTrimmed, 1);
  assert.equal(r.removedOffers + r.removedForLanguage + r.emojiRemoved, 0);
  const plain = "我很抱歉听到这个消息。我在这儿陪着你。随时找我。";
  assert.deepEqual(zh(plain, { serious: true }), { text: plain, removedForLanguage: 0, removedOffers: 0, emojiRemoved: 0 }, "no offer removal, no change");
  assert.equal(zh("唉，这太难受了。我在。", { serious: true }).text, "唉，这太难受了。我在。", "a sigh is fine");
  assert.equal(zh("哎呀，好吧。", { serious: true }).text, "哎呀，好吧。", "too little would remain");
  assert.equal(polishReply({ text: "Oh, hey. I'm so sorry.", replyLanguage: "english", userMessage: "my dad died", serious: true }).text, "Oh, hey. I'm so sorry.");
});

// ---------------------------------------------------------------- the evaluation's Chinese checks, on the real replies

test("real: the checks flag the counsellor, the tag question, the service bot and the long reply from the last Chinese evaluation, and pass a punchy one", () => {
  const missYou = "听上去有些让人不好受吧？我想，想念不一定非要用语言表达。有时候，人类的情感像复杂的电路图，不直接输出也有可能在背后悄悄地流动。如果他对你重要，也许可以试着开诚布公地谈谈？说出自己真正的感受，就算他不太会表达，这样也许能建立起更深层次的连接，不是吗？";
  assert.deepEqual(chineseVoiceProblems(missYou, "missYou").map(p => p.split(" (")[0]), ["counsellor language", "ends on a tag question", "long for casual banter"]);
  const jealous = "我觉得吃醋这种事情，有可能会让关系更复杂，甚至走偏哦。感情的根基可不应该是通过制造误解来打乱，运气好的时候确实能引起注意，但也许带来的更多是不必要的冲突和误解。所以，与其撒下可疑的数据线，不如直接问他对你怎么看，毕竟真诚比套路有吸引力，是吧？";
  assert.ok(chineseVoiceProblems(jealous, "jealous").includes("ends on a tag question"));
  assert.ok(chineseVoiceProblems("尽管开口就好，我非常乐意提供帮助！", "control").includes("service-bot phrasing"));
  assert.deepEqual(chineseVoiceProblems("我是这里的多面小天才，啥都管。", "control"), [], "the 'what do you do here?' answer may be longer and is only checked for service phrasing");
  const adviceReply = "先别急着回他，晾一晚上，让他也体验一下等消息的滋味。明天找个轻松的话题随口聊两句，别提这事，看他会不会自己绷不住。真要谈，就挑个你心情好的时候，一句话说清楚你在意什么，别写小作文。我的处理器都替你捏把汗。还有，别半夜发长消息，早上你自己都不想看第二遍，更别说他了。";
  assert.ok(!chineseVoiceProblems(adviceReply, "advice").some(p => p.startsWith("long")), "advice may be longer than banter");
  assert.ok(chineseVoiceProblems(adviceReply, "missYou").some(p => p.startsWith("long")), "banter may not");
  assert.ok(chineseVoiceProblems("我就是个小助手。", "advice").includes("service-bot phrasing"));
  assert.deepEqual(chineseVoiceProblems("他不说想你？那你先说，让他体验一下被抢先的感觉。我的处理器都替你着急。", "missYou"), [], "short, a dare, one machine remark, no question");
});
