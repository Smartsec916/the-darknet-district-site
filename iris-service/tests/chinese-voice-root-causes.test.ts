// Third revision of the Chinese voice: root causes, not more instructions. Advice and role detection in five languages, hook-question cleanup that keeps
// real questions, and a rotating "part of you to draw from" instead of a growing list of banned words. No network, no model.
process.env.IRIS_TEST_DB = "pglite";
import test from "node:test";
import assert from "node:assert/strict";
import { ATTITUDES, attitudeBlock, chooseAttitude, noteReply, readTurn, resetMischiefForTests, type Decision } from "../server/mischief";
import { polishReply } from "../server/replyPolish";

const zh = (text: string, over: Partial<Parameters<typeof polishReply>[0]> = {}) =>
  polishReply({ text, replyLanguage: "chinese", userMessage: "他给所有人发消息，就是不找我", serious: false, statementWanted: true, ...over });

test("advice is recognised in Chinese, Spanish, Russian and Japanese, including the question that failed in the last evaluation", () => {
  const advice = [
    "我要不要告诉男朋友我的感受？", "要不要故意让他吃醋？", "我应该先联系他吗", "这件事怎么做比较好", "能给我一点建议吗，求建议",
    "¿Debo decirle lo que siento?", "Tengo que decirle la verdad, ¿qué opinas que haga?", "¿Me recomiendas esperar?",
    "Мне стоит рассказать ему о своих чувствах?", "Надо ли писать ему первой?", "Что бы ты сделала на моём месте?",
    "彼に気持ちを伝えたほうがいいかな", "言うべきでしょうか", "どうしよう、彼に連絡したほうがいい？",
    "Should I tell him?", "What should I do?",
  ];
  for (const message of advice) assert.equal(readTurn(message).advice, true, message);
  const notAdvice = ["他今天又没回我", "今天天气不错", "Ayer vi una película", "Сегодня хорошая погода", "今日は暑いですね", "He never says he misses me."];
  for (const message of notAdvice) assert.equal(readTurn(message).advice, false, message);
});

test("English advice detection is exactly what it was", () => {
  for (const message of ["Should I tell him?", "any advice?", "is it normal", "How do I say this", "help me"]) assert.equal(readTurn(message).advice, true, message);
  for (const message of ["I told him yesterday", "He is nice"]) assert.equal(readTurn(message).advice, false, message);
});

test("asking what she is or does is recognised in five languages, and only then", () => {
  for (const message of ["你在这里到底是做什么的？", "你是谁？", "What do you do here?", "Who are you", "¿Qué haces aquí?", "Кто ты?", "ここで何をしているの？"]) assert.equal(readTurn(message).role, true, message);
  for (const message of ["我爸爸昨晚去世了", "他给所有人发消息", "Hello there", "好的，谢谢"]) assert.equal(readTurn(message).role, undefined, message);
});

const decide = (id: string, message: string) => chooseAttitude(id, { rel: { trust: 0.5, mood: "neutral", moodValue: 0, affection: 0.3, familiarity: 0.3, updatedAt: Date.now() } as never, read: readTurn(message) });

test("the advice turn in Chinese gets the practical-advice voice line, and the role question gets the android line", () => {
  resetMischiefForTests();
  const d = decide("advice-zh", "我要不要告诉男朋友我的感受？")!;
  assert.equal(d.intensity, "light");
  assert.match(attitudeBlock(d, "chinese"), /This is practical advice: it may run longer than banter, but it is still you/);
  const r = decide("role-zh", "你在这里到底是做什么的？")!;
  assert.equal(r.role, true);
  assert.match(attitudeBlock(r, "chinese"), /Say outright, in your first sentence, that you are an android/);
  assert.doesNotMatch(attitudeBlock(r, "chinese"), /Keep this reply short/, "a role answer may take a line or two more");
  const grief = decide("grief-zh", "我爸爸昨晚去世了，你是谁？")!;
  assert.equal(grief.role, undefined, "never in a serious moment");
  assert.doesNotMatch(attitudeBlock(grief, "chinese"), /Say outright, in your first sentence, that you are an android/);
});

test("the part of her nature to draw from rotates: never the same twice in a row, deterministic, Chinese only, never in a serious moment", () => {
  resetMischiefForTests();
  const seen: string[] = [];
  for (let i = 0; i < 40; i++) {
    const d = decide("rot", "但是他从来不说想我")!;
    if (d.image) seen.push(d.image);
  }
  assert.ok(seen.length >= 10);
  for (let i = 1; i < seen.length; i++) assert.notEqual(seen[i], seen[i - 1]);
  assert.ok(new Set(seen).size >= 5, "all parts get their turn");
  const block = attitudeBlock({ attitude: "mischief", intensity: "full", newStretch: true, challenge: false, android: true, statement: true, emoji: false, avoid: [], avoidTech: ["信号"], image: "your memory: what you store, lose or overwrite" }, "chinese");
  assert.match(block, /Draw it from this part of you: your memory: what you store, lose or overwrite\./);
  const english = attitudeBlock({ attitude: "mischief", intensity: "full", newStretch: true, challenge: false, android: true, statement: true, emoji: false, avoid: [], avoidTech: [], image: "your memory" }, "english");
  assert.match(english, /Draw it from this part of you: your memory\./);
  const support = attitudeBlock({ attitude: "supportive", intensity: "support", newStretch: true, challenge: false, android: false, statement: false, emoji: false, avoid: [], image: "your memory" }, "chinese");
  assert.doesNotMatch(support, /Draw it from|Keep this reply short/);
  const none = decide("serious-rot", "我爸爸昨晚去世了")!;
  assert.equal(none.image, undefined);
});

test("recent technical words are remembered over her last two replies, and the ordinary Chinese banter line asks for about 40 to 70 characters", () => {
  resetMischiefForTests();
  decide("tech", "你好呀"); noteReply("tech", "这招可能会失去信号呢。", null);
  decide("tech", "然后呢"); noteReply("tech", "系统故障了吧。", null);
  decide("tech", "哈哈"); noteReply("tech", "我今天心情不错。", null);
  const d = decide("tech", "再说一次")!;
  assert.deepEqual([...d.avoidTech!].sort(), ["系统"].sort());
  assert.match(attitudeBlock({ ...d, intensity: "normal" }, "chinese"), /Keep this reply short: about two quick sentences, roughly 40 to 70 Chinese characters, unless they asked for an explanation/);
});

test("the prompt text for every other language and for Chinese in a serious moment is unchanged by the new fields", () => {
  const base = { newStretch: true, challenge: false, avoid: [] as string[], avoidTech: ["circuit"] };
  for (const attitude of ATTITUDES) {
    const d: Decision = { ...base, attitude, intensity: "support", android: false, statement: true, emoji: false };
    for (const language of ["english", "spanish", "russian", "japanese", "chinese"]) assert.equal(attitudeBlock({ ...d, image: "x", sampleKind: "dark", sampleIndex: 1, salty: true, form: "f" }, language), attitudeBlock(d, language), language);
  }
});

// ---------------------------------------------------------------- hook questions

test("a closing hook question is trimmed when a statement ending was asked for; real questions stay", () => {
  assert.equal(zh("信号全开却不对你，也太浪费了。不如看看他接不接得住！怎么想？这样做有没有趣味感？").text, "信号全开却不对你，也太浪费了。不如看看他接不接得住！");
  assert.equal(zh("先晾他一晚，让他自己琢磨。你觉得呢？").text, "先晾他一晚，让他自己琢磨。");
  assert.equal(zh("这招够狠，也够幼稚，有没有点心动？").text, "这招够狠，也够幼稚。");
  assert.equal(zh("这招够狠，也够幼稚。试试？").text, "这招够狠，也够幼稚。试试？", "not a stock hook");
  // real questions are kept
  const real = "先别急着回他。他上次是为什么突然消失的？";
  assert.equal(zh(real).text, real);
  const who = "先晾他一晚，让他自己琢磨。你到底想让谁先低头？";
  assert.equal(zh(who).text, who);
  // only when a statement was asked for, only in Chinese, never in a serious moment
  const hook = "先晾他一晚，让他自己琢磨。怎么想？";
  assert.equal(zh(hook, { statementWanted: false }).text, hook);
  assert.equal(zh(hook, { serious: true }).text, hook);
  assert.equal(polishReply({ text: "Leave him on read tonight. Thoughts?", replyLanguage: "english", userMessage: "x y z", serious: false, statementWanted: true }).text, "Leave him on read tonight. Thoughts?");
  // an emoji after it is kept
  assert.equal(zh("先晾他一晚，让他自己琢磨。怎么想？😉", { emojiAllowed: true }).text, "先晾他一晚，让他自己琢磨。😉");
  // never leave too little
  assert.equal(zh("好玩吗？").text, "好玩吗？");
});

test("real: 'anything you need my network node to help with?' (last evaluation's flirt reply) is a closing offer, and the compliment stays", () => {
  const r = zh("哈哈，谢谢你的夸奖！虽然我是个机器，但心里还是会有小波动的，像是电流过载的感觉。有什么需要我这个网络节点帮忙的吗？", { statementWanted: false, userMessage: "说真的，Iris，你挺可爱的" });
  assert.equal(r.removedOffers, 1);
  assert.equal(r.text, "哈哈，谢谢你的夸奖！虽然我是个机器，但心里还是会有小波动的，像是电流过载的感觉。");
});
