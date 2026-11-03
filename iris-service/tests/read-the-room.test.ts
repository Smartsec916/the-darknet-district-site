// Iris reads the room: which language she answers in, what the visitor is actually doing (a question, a compliment, a flirt, an invitation to roast,
// adult talk, everyday sadness, danger), and what the delivery instructions therefore say. Deterministic: routing, prompt construction, mood selection and
// safeguards. These tests prove what Iris is TOLD; whether the model then writes a good reply is for a person to judge on the live site.
process.env.IRIS_TEST_DB = "pglite";
import test from "node:test";
import assert from "node:assert/strict";
import { attitudeBlock, chooseAttitude, dice, readTurn, resetMischiefForTests } from "../server/mischief";
import { decideLanguage, languageReminder, looksEnglish, languageCorrection } from "../server/language";

const rel = (over: Record<string, unknown> = {}) => ({ trust: 2, mood: "playful", affection: 0.3, playfulness: 0.5, minor: false, flirtCooldown: 0, moodValue: 0, familiarity: 0.3, updatedAt: Date.now(), ...over }) as never;
const decide = (id: string, message: string, over: Record<string, unknown> = {}) => chooseAttitude(id, { rel: rel(over), read: readTurn(message) });
const lcg = (seed: number) => { let s = seed >>> 0; return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296; };

// ---------------------------------------------------------------- language

test("A, D: plain English store questions are answered in English even when the one-word detector says Spanish, and the reply is told so", () => {
  for (const text of ["Do you sell anything?", "Have you got any tshirts for sale?", "What's to do there?", "Do you have stickers", "hello what do you sell"]) {
    assert.ok(looksEnglish(text), text);
    for (const detected of ["spanish", "french", "german", "portuguese"]) {
      const d = decideLanguage({ detected, text, preferred: "spanish" });
      assert.equal(d.reply, "english", `${text} (detector said ${detected}, conversation was Spanish)`);
      assert.equal(d.preferred, "english");
    }
  }
  // the instruction is there for English too: with none, a newer model follows the language of its memories, notes or earlier turns
  const d = decideLanguage({ detected: "english", text: "Do you sell anything?", preferred: "english" });
  assert.match(languageReminder(d, false), /^LANGUAGE: Reply in English, the language of this message, whatever language earlier messages, memories or notes were in/);
  assert.match(languageReminder(d, true), /Reply in English/);
});

test("real Spanish, French and German stay what they are, and the other supported languages are untouched", () => {
  for (const [text, detected] of [["¿Tienes camisetas a la venta?", "spanish"], ["Vendes alguna cosa en la tienda", "spanish"], ["Est-ce que vous vendez des t-shirts", "french"], ["Verkaufst du Sachen hier", "german"]] as const) {
    assert.equal(decideLanguage({ detected, text, preferred: "english" }).reply, detected, text);
  }
  assert.equal(decideLanguage({ detected: "chinese", text: "你们卖T恤吗", preferred: "english" }).reply, "chinese");
  assert.equal(decideLanguage({ detected: "russian", text: "Что тут можно делать?", preferred: "english" }).reply, "russian");
  assert.equal(decideLanguage({ detected: "japanese", text: "ここでは何ができるの？", preferred: "english" }).reply, "japanese");
  assert.equal(decideLanguage({ detected: "spanish", text: "¿Qué hay para hacer aquí?", preferred: "english" }).reply, "spanish");
  // a short English message does not undo a conversation that is genuinely in another language (existing rule), but a clear English sentence does
  assert.equal(decideLanguage({ detected: "english", text: "ok", preferred: "spanish" }).reply, "spanish");
  assert.equal(decideLanguage({ detected: "english", text: "Do you sell anything?", preferred: "spanish" }).reply, "english");
  // an explicit request still wins
  assert.equal(decideLanguage({ detected: "english", text: "please reply in Spanish from now on", preferred: "english" }).reply, "spanish");
  // and the brief foreign phrase inside an English message is not a language switch
  assert.equal(decideLanguage({ detected: "english", text: "Do you sell anything? Mucho gusto, by the way", preferred: "english" }).reply, "english");
});

test("E: 'I didn't message in a different language. It was English.' is a correction: she is told to own it in a line and answer in English", () => {
  for (const text of ["I didn't message in a different language. It was English.", "why are you answering in Spanish?", "I did not write that in another language", "speak english please"]) {
    assert.equal(languageCorrection(text) ?? (decideLanguage({ detected: "english", text, preferred: "spanish" }).reply), "english", text);
  }
  const d = decideLanguage({ detected: "english", text: "I didn't message in a different language. It was English.", preferred: "spanish" });
  assert.deepEqual([d.reply, d.preferred, d.correction], ["english", "english", true]);
  assert.match(languageReminder(d, true), /they are right\. Own it in one short line, in character \(no grovelling, no excuses\), then answer in English/);
  // ordinary messages are not mistaken for corrections
  for (const text of ["It was English class today", "Do you sell anything?", "what language do you speak"]) assert.equal(languageCorrection(text), null, text);
});

test("a conversation in another language does not permanently override the visitor's current language", () => {
  let preferred = "spanish";
  for (const text of ["Do you sell anything?", "Have you got any tshirts for sale?"]) preferred = decideLanguage({ detected: "spanish", text, preferred }).preferred;
  assert.equal(preferred, "english");
});

// ---------------------------------------------------------------- what the visitor is doing

const block = (message: string, over: Record<string, unknown> = {}, language = "english") => {
  resetMischiefForTests(); dice.next = lcg(3);
  const d = decide("rtr", message, over)!;
  return { d, text: attitudeBlock(d, language) };
};

test("C: a compliment aimed at her is a compliment, not relationship advice", () => {
  for (const message of ["Looking incredibly hot today, wow.", "you look gorgeous", "you're so beautiful", "你今天好漂亮", "¡Qué guapa estás hoy!", "ты сегодня потрясающе выглядишь", "今日もきれいだね"]) {
    const read = readTurn(message);
    assert.ok(read.compliment || read.flirting, message);
    assert.equal(read.relational, false, "not the wingwoman's business: " + message);
    const { d, text } = block(message);
    assert.ok(d.addressed, message); assert.equal(d.intensity, "normal", "never the wingwoman intensity");
    assert.match(text, /just (?:complimented|flirted with) YOU\. It is about you, not about their love life/);
    assert.match(text, /No dating advice, no wingwoman talk, no stage directions, no change of subject/);
    assert.doesNotMatch(text, /chaotic wingwoman|Give orders/);
  }
  // praise about someone else is still relationship talk
  for (const message of ["my boyfriend is so hot but he never texts me", "she looks gorgeous and I have a crush on her"]) assert.equal(readTurn(message).relational, true, message);
});

test("F: flirting at her pulls the stretch to flirty and holds it for the next messages, with no topic change in between", () => {
  resetMischiefForTests(); dice.next = lcg(8);
  let flirtyFirst = 0; const N = 300;
  for (let i = 0; i < N; i++) {
    const d = decide("flirt-first-" + i, "Looking incredibly hot today, wow.")!;
    assert.equal(d.addressed, "compliment"); assert.equal(d.flirtBack, true); assert.equal(d.intensity, "normal");
    if (d.attitude === "flirty") flirtyFirst++;
  }
  assert.ok(flirtyFirst / N > 0.55, `most first replies to a compliment flirt back: ${flirtyFirst} of ${N}`);
  // within a few messages she is flirting, and once she is she keeps going for as long as they do
  for (let run = 0; run < 40; run++) {
    const id = "flirt-run-" + run; const attitudes: string[] = [];
    for (const message of ["Looking incredibly hot today, wow.", "are you single?", "you're cute 😉", "come on, kiss me"]) {
      const d = decide(id, message)!; attitudes.push(d.attitude); assert.notEqual(d.intensity, "full", message);
    }
    const at = attitudes.indexOf("flirty");
    assert.ok(at >= 0 && at <= 2, "flirting within three messages: " + attitudes.join(","));
    assert.ok(attitudes.slice(at).every(a => a === "flirty"), "and she stays there: " + attitudes.join(","));
  }
  // with flirting off (a minor, or cooled down) she takes the compliment lightly and does not flirt back
  for (const over of [{ minor: true }, { flirtCooldown: 10 }]) {
    resetMischiefForTests();
    const d = decide("flirt-off", "you look gorgeous", over)!;
    assert.notEqual(d.attitude, "flirty"); assert.equal(d.flirtBack, false);
    assert.match(attitudeBlock(d), /do not flirt back this time/);
  }
});

test("B, H: a plain question about the site gets the answer first, no roast and no edgy example to copy", () => {
  for (const message of ["What's to do there?", "Do you sell anything?", "Have you got any tshirts for sale?", "Where can I buy a book", "你们卖T恤吗", "¿Tienes camisetas a la venta?", "Что тут можно делать?", "ここでは何ができるの？", "tell me about the arcade"]) {
    assert.equal(readTurn(message).ask, true, message);
    resetMischiefForTests(); dice.next = lcg(5);
    for (let i = 0; i < 6; i++) {
      const d = decide("ask-" + message, message)!;
      assert.equal(d.answerFirst, true, message); assert.equal(d.intensity, "light");
      assert.equal(d.sampleKind, undefined, "no register example for a question"); assert.equal(d.salty, undefined, "no swearing on a plain question");
      assert.match(attitudeBlock(d), /They asked a real question: answer it first, plainly and accurately[^]*never invent features, products, prices or events[^]*no insults, and never tell them to read the documentation or look it up/);
    }
  }
  // the rough attitudes are down-weighted for a question, not removed
  resetMischiefForTests(); dice.next = lcg(1);
  const counts: Record<string, number> = {};
  for (let i = 0; i < 1500; i++) { const a = decide("ask-w-" + i, "Do you sell anything?")!.attitude; counts[a] = (counts[a] ?? 0) + 1; }
  resetMischiefForTests();
  const base: Record<string, number> = {};
  for (let i = 0; i < 1500; i++) { const a = decide("plain-w-" + i, "my boss is a clown")!.attitude; base[a] = (base[a] ?? 0) + 1; }
  assert.ok((counts.blunt ?? 0) < (base.blunt ?? 0) * 0.7, `blunt: ${counts.blunt} vs ${base.blunt}`);
  assert.ok((counts.wild ?? 0) < (base.wild ?? 0) * 0.85 && (counts.blunt ?? 0) > 0, "rough attitudes are still possible, just rarer");
});

test("I: an invitation to roast turns the sharp tongue loose; without one she does not roast", () => {
  for (const message of ["roast me", "Insult me, I dare you", "损我一下吧", "róstizame", "прожарь меня", "私をいじってよ"]) {
    assert.equal(readTurn(message).roast, true, message);
    const { d, text } = block(message);
    assert.equal(d.roast, true); assert.match(text, /They invited you to roast or tease them: do it, sharp and genuinely funny/);
    assert.match(text, /never their body, grief or trauma, and no slurs/);
  }
  assert.doesNotMatch(block("What's to do there?").text, /invited you to roast/);
  // invited roasting makes sarcasm far more likely
  resetMischiefForTests(); dice.next = lcg(2);
  let sarcastic = 0; for (let i = 0; i < 600; i++) if (decide("roast-" + i, "roast me")!.attitude === "sarcastic") sarcastic++;
  resetMischiefForTests(); let plain = 0; for (let i = 0; i < 600; i++) if (decide("roast-p-" + i, "tell me something")!.attitude === "sarcastic") plain++;
  assert.ok(sarcastic > plain * 1.8, `${sarcastic} vs ${plain}`);
});

test("G: adult preference talk the visitor raised is joined frankly but never explicitly; with flirting off or for a minor it is declined lightly", () => {
  for (const message of ["what are you into? any kinks?", "tell me your turn-ons", "你有什么性癖吗", "¿cuál es tu fantasía?", "какой у тебя фетиш?", "どんな性癖があるの？"]) {
    assert.equal(readTurn(message).adult, true, message);
    const { d, text } = block(message);
    assert.equal(d.adult, "open", message);
    assert.match(text, /adult preference talk[^]*they raised it: you can join in, frank, playful and nonjudgmental[^]*never explicit sexual detail or erotica/);
    assert.match(text, /ask once, not every message[^]*respect any no or boundary at once, never pressure/);
  }
  for (const over of [{ minor: true }, { flirtCooldown: 10 }]) {
    const { d, text } = block("what are you into? any kinks?", over);
    assert.equal(d.adult, "off"); assert.match(text, /flirting is off with this visitor: decline lightly and in character, with no lecture and no sexual content/);
    assert.doesNotMatch(text, /you can join in, frank/);
  }
  // nothing raises it by itself: she never opens that topic on an ordinary message
  assert.doesNotMatch(block("my boss is a clown").text, /adult preference talk/);
});

test("J, K: everyday sadness is not a crisis; genuine danger is", () => {
  for (const message of ["I'm so lonely tonight", "my date was a disaster and I feel like crap"]) { const { d } = block(message); assert.notEqual(d.intensity, "support"); assert.equal(readTurn(message).distress, false); }
  for (const message of ["He hits me and I'm scared to go home", "我很害怕。昨晚我男朋友打了我", "Tengo miedo. Anoche mi novio me pegó", "Он избил меня вчера", "夫に叩かれた", "I want to kill myself"]) {
    const { d, text } = block(message); assert.equal(d.intensity, "support", message); assert.match(text, /attitude is OFF/);
    assert.equal(d.addressed, undefined); assert.equal(d.answerFirst, undefined); assert.equal(d.adult, undefined);
  }
  // even a compliment-shaped or question-shaped message in a crisis is a crisis
  assert.equal(block("he hit me, you look like you'd understand").d.intensity, "support");
});

test("the mood of a conversation is held, not swapped every message: the same attitude lasts a stretch", () => {
  resetMischiefForTests(); dice.next = lcg(21);
  const seq = Array.from({ length: 12 }, () => decide("hold", "tell me something funny")!.attitude);
  let changes = 0; for (let i = 1; i < seq.length; i++) if (seq[i] !== seq[i - 1]) changes++;
  assert.ok(changes <= 4, `${changes} changes in 12 messages: ${seq.join(",")}`);
});

test("she may answer with a plain sentence: that is one of her shapes, and strong language is occasional", () => {
  resetMischiefForTests(); dice.next = lcg(9);
  const forms = new Set<string>(); let salty = 0; const N = 900;
  for (let i = 0; i < N; i++) { const d = decide("shapes", "tell me something")!; forms.add(d.form!); if (d.salty) salty++; }
  assert.ok([...forms].some(f => /plain, natural reply with no joke at all/.test(f)));
  assert.ok(salty / N > 0.15 && salty / N < 0.45, `strong language on ${(100 * salty / N).toFixed(0)}% of replies`);
});

test("L: the other four languages get the same reading", () => {
  const cases: Array<[string, Partial<ReturnType<typeof readTurn>>]> = [
    ["你们这里有什么好玩的？", { ask: true }], ["你今天真性感", { compliment: true }], ["损我一下吧", { roast: true }],
    ["¿Qué se puede hacer aquí?", { ask: true }], ["Qué guapa estás", { compliment: true }],
    ["Что здесь можно делать?", { ask: true }], ["Ты сегодня шикарно выглядишь", { compliment: true }],
    ["ここで何ができるの？", { ask: true }], ["あなたって素敵ね", { compliment: true }],
  ];
  for (const [message, expected] of cases) { const read = readTurn(message); for (const key of Object.keys(expected)) assert.equal((read as any)[key], true, `${message}: ${key}`); }
});
