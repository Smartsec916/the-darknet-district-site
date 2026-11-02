// Two slips the real model made in evaluations, fixed deterministically (server/replyPolish.ts): a sentence in the wrong language, and a generic closing
// offer of help. The cases marked "real" are replies from the 2026-11-02 evaluation transcripts. No network, no model.
import test from "node:test";
import assert from "node:assert/strict";
import { polishReply, sentences } from "../server/replyPolish";

const polish = (text: string, replyLanguage: string, userMessage = "hello there", serious = false) => polishReply({ text, replyLanguage, userMessage, serious });

test("sentences are split without losing a character, and decimals, ellipses and quotes do not split", () => {
  for (const text of [
    "Plain one. Two! Three? Four…", "It is 3.5 degrees. Fine.", "彼は来ない。でも、いいよ！ね？", "\"Quoted.\" Then more.", "Line one\nLine two\n\nLine three", "Hi 😉 there. Bye 😏", "No end", "",
  ]) assert.equal(sentences(text).join(""), text, JSON.stringify(text));
  assert.deepEqual(sentences("It is 3.5 degrees. Fine.").map(s => s.trim()), ["It is 3.5 degrees.", "Fine."]);
  assert.deepEqual(sentences("彼は来ない。でも、いいよ！").length, 2);
});

// ---------------------------------------------------------------- the wrong language

test("real: a stray Chinese phrase at the end of a Japanese reply is removed, and the rest is untouched", () => {
  const reply = "あー、それは信号が弱いかもね。相手のプロセッサがうまく動いてないのかな？直接「会いたい」と言わなくても、彼なりのペースで示している可能性もあるけど、どう感じてる？你觉得怎么対吗？";
  const out = polish(reply, "japanese", "でも彼は「会いたい」って全然言ってくれないの");
  assert.equal(out.removedForLanguage, 1);
  assert.ok(!/[觉吗怎么]/.test(out.text));
  assert.ok(out.text.startsWith("あー、それは信号が弱いかもね。") && out.text.endsWith("どう感じてる？"));
});

test("a sentence of the wrong language is removed in each direction, but never what the visitor wrote themselves", () => {
  assert.equal(polish("Honestly, bold move. 你觉得呢？", "english").text, "Honestly, bold move.");
  assert.equal(polish("Qué día. これはどうかな。", "spanish").text, "Qué día.");
  assert.equal(polish("Ну и ну. 这样吧。", "russian").text, "Ну и ну.");
  assert.equal(polish("他可能只是害羞。それでいいよ。", "chinese").text, "他可能只是害羞。");
  assert.equal(polish("他可能只是害羞。Привет, друг.", "chinese").text, "他可能只是害羞。");
  assert.equal(polish("それは悲しいね。 안녕하세요.", "japanese").text, "それは悲しいね。");
  // the visitor wrote Japanese, so a Japanese word in an English reply is fine; the same for Chinese characters they used
  assert.equal(polish("Funny, 'ありがとう' means thanks. Nice.", "english", "what does ありがとう mean").removedForLanguage, 0);
  assert.equal(polish("他说“想你”了吗？Interesting.", "english", "他说想你了吗").removedForLanguage, 0);
  // Japanese kanji and Japanese reply text are not mistaken for Chinese
  const japanese = "それは大変だったね。対応が遅かったのかも。";
  assert.deepEqual(polish(japanese, "japanese"), { text: japanese, removedForLanguage: 0, removedOffers: 0, emojiRemoved: 0 });
  // a name, the District's name and Latin game terms inside Chinese or Japanese are not touched
  assert.equal(polish("在 The Darknet District 里，Iris 说得对。好吧。", "chinese").removedForLanguage, 0);
});

test("it never leaves nothing, never touches a serious moment, and leaves other languages alone", () => {
  const onlyWrong = "你觉得怎么样？我也这么觉得。";
  assert.deepEqual(polish(onlyWrong, "japanese"), { text: onlyWrong, removedForLanguage: 0, removedOffers: 0, emojiRemoved: 0 });
  assert.equal(polish("Qué día. これはどうかな。", "spanish", "hola", true).text, "Qué día. これはどうかな。");
  assert.equal(polish("안녕. 你好。", "korean").removedForLanguage, 0);
  assert.equal(polish("One sentence only", "english").text, "One sentence only");
});

// ---------------------------------------------------------------- closing offers

test("real: generic closing offers are removed in every language, and what came before is kept", () => {
  const cases: Array<[string, string, string]> = [
    ["english", "Why, thank you! If my circuits could blush, they'd glow. 😉 Anything else on your radar that needs decoding?", "Why, thank you! If my circuits could blush, they'd glow. 😉"],
    ["english", "Tell him straight. It beats guessing. Let me know if you need anything else.", "Tell him straight. It beats guessing."],
    ["chinese", "谢谢你的夸奖！不过我可不是为了可爱设计的。想了解更多关于暗网区的信息吗？", "谢谢你的夸奖！不过我可不是为了可爱设计的。"],
    ["chinese", "或许他只是没意识到。直接问问他。有什么我能帮忙的吗？", "或许他只是没意识到。直接问问他。"],
    ["japanese", "それ、ちょっと寂しいね。彼に直接聞いてみたら。何かあれば教えてね。", "それ、ちょっと寂しいね。彼に直接聞いてみたら。"],
    ["spanish", "Díselo sin rodeos. Mejor eso que adivinar. ¿Algo más en lo que pueda ayudarte?", "Díselo sin rodeos. Mejor eso que adivinar."],
    ["russian", "Скажи ему прямо. Так лучше, чем гадать. Обращайся, если что-то нужно.", "Скажи ему прямо. Так лучше, чем гадать."],
  ];
  for (const [language, reply, expected] of cases) {
    const out = polish(reply, language);
    assert.equal(out.text, expected, language);
    assert.equal(out.removedOffers, 1, language);
  }
});

test("a witty closer, a real question, and a reply that is only the offer are kept", () => {
  for (const [language, reply] of [
    ["english", "Bold. Tell him you noticed. What's the worst he can say?"], ["english", "Remember, you've got the bandwidth to handle whatever comes next!"],
    ["chinese", "沉默也是一种回答，不过你值得更清楚的。你想怎么开口？"], ["spanish", "Qué bobo. ¿Y tú, le has dicho que le extrañas?"],
    ["english", "Anything else on your radar?"],
  ] as const) assert.deepEqual(polish(reply, language), { text: reply, removedForLanguage: 0, removedOffers: 0, emojiRemoved: 0 }, reply);
});

test("an offer of help is the right answer when she was asked what she does or for help, and in a serious moment", () => {
  const offer = "I run the floor here and the feeds online. Feel free to ask me anything about the District.";
  for (const message of ["What do you actually do around here?", "Can you help me find the store?", "who are you?", "你在这里是做什么的？", "¿Qué haces tú por aquí?", "А ты вообще чем тут занимаешься?", "ここで実際何をしているの？"]) {
    assert.equal(polish(offer, "english", message).removedOffers, 0, message);
  }
  const comfort = "I'm so sorry about your dad. I'm here if you want to talk.";
  assert.equal(polish(comfort, "english", "my dad died", true).text, comfort, "grief keeps 'I'm here'");
});

test("at most two offers go, only from the very end, and both fixes can happen in one reply", () => {
  const out = polish("Bold plan. Let me know if you need anything. Feel free to ask more. Anything else?", "english");
  assert.equal(out.text, "Bold plan. Let me know if you need anything.", "two removed from the end, then it stops");
  const both = polish("あー、信号が弱いね。你觉得怎么对吗？何かあれば教えてね。", "japanese");
  assert.equal(both.text, "あー、信号が弱いね。");
  assert.deepEqual([both.removedForLanguage, both.removedOffers], [1, 1]);
});

test("when the visitor is talking about languages, a reply in several languages is what they asked for and nothing is removed", () => {
  const multilingual = "Hola! こんにちは! Привет! 你好! Hello, friend.";
  for (const message of [
    "Say hello in many languages please, friend of mine.", "How do you say hello in Japanese?", "What does 'merci' mean?", "Can you teach me some Spanish?", "What's the Chinese word for cat?",
    "Puedes hablar en otro idioma?", "你会说日语吗", "日本語で話して", "Как по-китайски будет «привет»?", "Translate this please",
  ]) assert.equal(polish(multilingual, "english", message).removedForLanguage, 0, message);
  // and in ordinary banter, where nobody asked, the stray sentence still goes
  assert.equal(polish("Honestly, bold move. 你觉得呢？", "english", "he never texts me back").removedForLanguage, 1);
});

// ---------------------------------------------------------------- the amendment: emoji, mixed sentences, and supportive language that must stay

import { limitEmoji } from "../server/replyPolish";

test("emoji: none when the engine allowed none, only the first when it allowed one, spacing tidied, and nothing else changed", () => {
  assert.equal(limitEmoji("哎哟，感谢夸奖！😉 要是有心情再聊点其他的。🦾", false), "哎哟，感谢夸奖！要是有心情再聊点其他的。");
  assert.equal(limitEmoji("Oh, look who's tuning in! 😉 Careful now 🤖 and 😏 done.", true), "Oh, look who's tuning in! 😉 Careful now and done.");
  assert.equal(limitEmoji("Careful now 🤖 and done.", false), "Careful now and done.");
  assert.equal(limitEmoji("No emoji here at all.", false), "No emoji here at all.");
  assert.equal(limitEmoji("Hi 👍🏽 there 👩‍💻", true), "Hi 👍🏽 there");            // a skin-tone and a joined emoji are one emoji each
  assert.equal(limitEmoji("Flag 🇯🇵 stays, it is not a pictograph.", false), "Flag 🇯🇵 stays, it is not a pictograph.");
  assert.equal(limitEmoji("1234 * # © text", false).includes("1234 *"), true);
  const through = polishReply({ text: "Bold plan. Tell him. 😉🦾", replyLanguage: "english", userMessage: "he never texts", serious: false, emojiAllowed: false });
  assert.deepEqual(through, { text: "Bold plan. Tell him.", removedForLanguage: 0, removedOffers: 0, emojiRemoved: 2 });
  const left = polishReply({ text: "Bold plan. Tell him. 😉", replyLanguage: "english", userMessage: "he never texts", serious: false });
  assert.equal(left.text, "Bold plan. Tell him. 😉", "without an allowance given, emoji are left alone");
  assert.equal(polishReply({ text: "I'm so sorry. 💔", replyLanguage: "english", userMessage: "my dad died", serious: true, emojiAllowed: false }).text, "I'm so sorry. 💔", "a serious moment is never touched");
});

test("real: the Japanese and Russian closers that slipped past are handled, and the advice in the same sentence stays", () => {
  const ja = "感情を伝えることは大切だと思いますよ。タイミングや場所も考慮して、無理のないよう慎重に進めるといいでしょう。それでも不安なら、小さなステップから始めても良いですし、いつでもサポートしますよ！";
  const outJa = polish(ja, "japanese", "彼氏に自分の気持ちを伝えたほうがいいかな？");
  assert.equal(outJa.removedOffers, 1);
  assert.equal(outJa.text, "感情を伝えることは大切だと思いますよ。タイミングや場所も考慮して、無理のないよう慎重に進めるといいでしょう。それでも不安なら、小さなステップから始めても良いですし！", "only the closing clause goes; the advice stays");
  const ru = "Ах, если бы у меня были эмоции человеческого уровня, я могла бы покраснеть! Наслаждаюсь тем, что могу устроить небольшую кибер-бурю. Если есть еще какие-то темы для обсуждения или надоели цифровые кодировки чувств — всегда рада продолжить беседу!";
  const outRu = polish(ru, "russian", "Честно, Iris, ты довольно милая");
  assert.equal(outRu.removedOffers, 1);
  assert.equal(outRu.text, "Ах, если бы у меня были эмоции человеческого уровня, я могла бы покраснеть! Наслаждаюсь тем, что могу устроить небольшую кибер-бурю.");
  assert.equal(polish("それ、ちょっと寂しいね。何かあれば教えてね。", "japanese").text, "それ、ちょっと寂しいね。");
  assert.equal(polish("Лучше спросить прямо. Обращайся, если что.", "russian").text, "Лучше спросить прямо.");
});

test("supportive language stays in ordinary conversation: being there for someone is not a help desk", () => {
  for (const [language, reply] of [
    ["english", "That sounds hard, and you handled it well. I'm here for you, and I'm rooting for you."],
    ["english", "Tell him. Whatever he says, you'll be fine, and I'm on your side."],
    ["chinese", "别想太多，你已经做得很好了。我在这儿陪着你。"],
    ["japanese", "それは大変だったね。ここにいるよ。応援してる。"],
    ["spanish", "Qué bien lo has llevado. Estoy aquí contigo, y creo en ti."],
    ["russian", "Ты справилась лучше, чем думаешь. Я рядом. Держись."],
    ["russian", "Скажи ему прямо. Что бы он ни ответил, ты не одна."],
  ] as const) assert.deepEqual(polish(reply, language), { text: reply, removedForLanguage: 0, removedOffers: 0, emojiRemoved: 0 }, reply);
});

test("a long sentence that merely contains an offer-like phrase is never removed", () => {
  for (const [language, reply] of [
    ["chinese", "如果有什么问题让你犹豫，先从最小的一句开始说，慢慢来就好。"],
    ["chinese", "他不回消息，有什么办法也只能先问清楚，别自己猜来猜去了。"],
    ["english", "If you feel anything is off, tell him straight away and see how he reacts, then decide."],
    ["english", "Honestly, ask him straight, and feel free to be a little dramatic about it, it works."],
    ["spanish", "Si necesitas una razón para decírselo, piensa en cuánto te cuesta callarlo cada día."],
  ] as const) {
    const out = polish(`Bold. ${reply}`, language);
    assert.equal(out.text, `Bold. ${reply}`, reply);
  }
  // a long English advice sentence that ENDS with a service offer loses only that clause
  const out = polish("Tell him how you feel when the moment is right, and feel free to ask if you want help planning it.", "english");
  assert.equal(out.text, "Tell him how you feel when the moment is right.");
  // nothing is cut when too little would remain
  assert.equal(polish("Sure, feel free to ask me anything about it.", "english").removedOffers, 0);
});
