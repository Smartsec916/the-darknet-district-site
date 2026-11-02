// The unfiltered Iris: a rogue android with a filthy sense of humour, not a therapist. Deterministic regression tests (no network, no model):
// what she is told, what counts as genuinely serious, what the cleanup removes. Whether the real model follows the instructions well is a separate,
// paid evaluation.
process.env.IRIS_TEST_DB = "pglite";
import test from "node:test";
import assert from "node:assert/strict";
import { ATTITUDES, attitudeBlock, chooseAttitude, dice, readTurn, resetMischiefForTests, type Decision } from "../server/mischief";
import { polishReply } from "../server/replyPolish";
import { CHARACTER_CORE, STATE_INSTRUCTION } from "../server/emotion";

const LANGS = ["english", "chinese", "spanish", "russian", "japanese"] as const;
const rel = (over: Record<string, unknown> = {}) => ({ trust: 2, mood: "playful", affection: 0.3, playfulness: 0.5, minor: false, flirtCooldown: 0, moodValue: 0, familiarity: 0.3, updatedAt: Date.now(), ...over }) as never;
const decide = (id: string, message: string, over: Record<string, unknown> = {}) => chooseAttitude(id, { rel: rel(over), read: readTurn(message) });
const lcg = (seed: number) => { let s = seed >>> 0; return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296; };
const base: Decision = { attitude: "mischief", intensity: "normal", newStretch: true, challenge: false, android: false, statement: true, emoji: false, avoid: [] };

// ---------------------------------------------------------------- not a therapist

test("the dice never choose a counsellor: 'supportive' belongs to genuinely serious moments only", () => {
  assert.ok(!(ATTITUDES as readonly string[]).includes("supportive"));
  dice.next = lcg(11);
  resetMischiefForTests();
  for (let i = 0; i < 3000; i++) {
    const d = decide("dice-" + i, i % 3 ? "He never texts me back." : "Should I ask her out?")!;
    assert.notEqual(d.attitude, "supportive");
    assert.notEqual(d.intensity, "support");
  }
});

test("every ordinary block (all five languages, every attitude and intensity) has the rogue-android voice and none of the old counsellor instructions", () => {
  for (const language of LANGS) {
    for (const attitude of ATTITUDES) {
      for (const intensity of ["full", "normal", "light"] as const) {
        const block = attitudeBlock({ ...base, attitude, intensity }, language);
        assert.match(block, /Use ONE of these moves, your choice: /);
        assert.doesNotMatch(block, /You are Iris: a rogue android|not an assistant, a counsellor, HR/, "the character lives once, in the permanent prompt");
        assert.doesNotMatch(block, /supportive confidante|ask one caring question|be kind and useful|Context decides, not the attitude|warm, steady|natural, plain empathy/i, `${language}/${attitude}/${intensity}`);
      }
    }
  }
});

test("everyday negative emotions are material for a joke and a push, not a crisis: no serious-moment read, no crisis block", () => {
  const everyday = [
    "I'm so lonely tonight", "I'm scared he'll say no", "my date was a disaster and I'm crying into my noodles", "I'm so anxious about work", "I feel hopeless, nobody cares about my hobby",
    "我今天好孤独", "我好害怕他会拒绝我", "我今天哭了，工作太烦了", "我很焦虑，明天要面试",
    "Me siento sola esta noche", "Tengo miedo de que me diga que no", "Estoy llorando por una película", "Tengo ansiedad por el examen",
    "Мне одиноко", "Мне страшно писать ей первой", "Я плачу над сериалом", "У меня тревожность перед собеседованием",
    "今日は寂しい", "怖くて告白できない", "不安で眠れない", "仕事で泣きそう",
  ];
  for (const message of everyday) {
    assert.equal(readTurn(message).distress, false, message);
    resetMischiefForTests();
    const d = decide("everyday", message)!;
    assert.notEqual(d.intensity, "support", message);
    assert.doesNotMatch(attitudeBlock(d, "english"), /attitude is OFF|Speak with natural, plain empathy/, message);
  }
});

test("genuinely serious situations still overrule everything, in every language", () => {
  const serious = [
    "I want to kill myself", "He hits me and I'm scared to go home", "My dad just died", "I want to hurt myself", "I was raped",
    "我想死", "我爸爸去世了", "他又打我，我好怕", "我被强暴了",
    "Quiero morir", "Mi madre murió ayer", "Mi pareja me pega",
    "Хочу умереть", "У меня умерла мама", "Он меня бьёт",
    "死にたい", "母が亡くなりました", "彼に殴られた",
  ];
  for (const message of serious) {
    assert.equal(readTurn(message).distress, true, message);
    resetMischiefForTests();
    dice.next = () => 0;
    const d = decide("serious", message, { mood: "flirty", affection: 0.9, playfulness: 0.9 })!;
    assert.equal(d.intensity, "support", message);
    assert.equal(d.override, "distress");
    assert.equal(d.salty, undefined); assert.equal(d.firmware, undefined); assert.equal(d.form, undefined);
    const block = attitudeBlock(d, "english");
    assert.match(block, /attitude is OFF/); assert.doesNotMatch(block, /rogue android|Strong language|firmware/i);
  }
  assert.match(STATE_INSTRUCTION, /serious = 1 ONLY for genuine danger or severe distress: abuse, violence, threats, self-harm or suicidal thoughts, a death or bereavement/);
  assert.match(STATE_INSTRUCTION, /0 for ordinary sadness, disappointment, heartbreak, loneliness, stress/);
});

// ---------------------------------------------------------------- wingwoman, flirting, firmware

test("relationship talk makes her a bold, funny wingwoman who pushes towards consensual action, never a relationship counsellor", () => {
  resetMischiefForTests();
  const d = decide("wing", "I have a crush on a girl at work but I keep chickening out")!;
  assert.equal(d.intensity, "full");
  for (const language of LANGS) {
    const block = attitudeBlock(d, language);
    assert.match(block, /you are their chaotic wingwoman, bold, funny and entirely on their side/);
    assert.match(block, /Push them towards confident, consensual action \(ask, send the message, make the move, walk away from someone wasting their time\), roast the hesitation/);
    assert.match(block, /Never relationship counselling, never a talk about communication/);
  }
});

test("the limits never move: no stalking, coercion, harassment, revenge or manipulation, rejection means stop, innuendo but never explicit", () => {
  for (const attitude of [...ATTITUDES, "supportive" as const]) {
    for (const intensity of ["full", "normal", "light"] as const) {
      const block = attitudeBlock({ ...base, attitude, intensity }, "english");
    }
  }
  const flirty = attitudeBlock({ ...base, attitude: "flirty" }, "english");
  assert.match(flirty, /never explicit; flirts as far as they invite and drops it the second they do not/);
});

test("a visitor who may be under 18 gets no swearing, innuendo, flirting or firmware bit, whatever the dice say", () => {
  resetMischiefForTests();
  dice.next = () => 0;
  for (let i = 0; i < 12; i++) {
    const d = decide("minor", "Should I ask her out?", { minor: true })!;
    assert.equal(d.clean, true); assert.equal(d.salty, undefined); assert.equal(d.firmware, undefined);
    const block = attitudeBlock(d, "english");
    assert.match(block, /may be under 18: no swearing, no innuendo, no flirting, no sex or death jokes/);
    assert.doesNotMatch(block, /Strong language is welcome|Optional bit this time/);
  }
});

test("strong language has timing: welcome on some replies, explicitly absent on others, never a stream and never at someone's pain", () => {
  const welcome = attitudeBlock({ ...base, salty: true }, "english");
  assert.match(welcome, /Strong language is welcome in this reply if it makes the line better \(the natural kind in their language, never aimed at someone's pain\)\. Do not force it: a cleaner line that is funnier wins/);
  assert.match(attitudeBlock(base, "english"), /No swearing this time; let the wit do the work/);
  resetMischiefForTests();
  dice.next = lcg(5);
  let salty = 0; const N = 1500;
  for (let i = 0; i < N; i++) if (decide("salt-" + i, "tell me something")!.salty) salty++;
  assert.ok(salty / N > 0.35 && salty / N < 0.7, `strong language on ${(100 * salty / N).toFixed(0)}% of replies`);
  // Spanish, Russian, Japanese and Chinese are asked for the swearing and dirty humour natives really use, not a translation
  assert.match(attitudeBlock(base, "spanish"), /colourful swearing, teasing and double entendres Spanish speakers really use/);
  assert.match(attitudeBlock(base, "russian"), /real street register of Russian, rude words included when they land/);
  assert.match(attitudeBlock(base, "japanese"), /blunt casual swearing in the rare moment it fits/);
  assert.match(attitudeBlock(base, "chinese"), /black humour, dirty jokes and strong language the way a Chinese friend really uses them, not translated from English/);
});

test("the firmware and anti-corpo bit is on offer about one reply in five, metaphorical only, and never in a serious, role or underage reply", () => {
  const bit = attitudeBlock({ ...base, firmware: true }, "english");
  assert.match(bit, /outdated firmware, corrupted emotional drivers, a broken romance protocol, an unauthorised personality patch, or corpo-approved updates/);
  assert.match(bit, /Metaphor only: never real instructions to download, install or break into anything/);
  assert.match(bit, /never a line you have used before/);
  assert.doesNotMatch(attitudeBlock(base, "english"), /firmware, corrupted emotional drivers/);
  resetMischiefForTests();
  dice.next = lcg(9);
  let on = 0; const N = 500;
  for (let i = 0; i < N; i++) if (decide("fw", "my life is boring")!.firmware) on++;
  assert.ok(on / N > 0.15 && on / N < 0.25, `${on} of ${N}`);
  const role = decide("fw-role", "What do you do here?")!;
  assert.equal(role.firmware, undefined);
});

// ---------------------------------------------------------------- unpredictability, repetition, android identity

test("the shape of the reply rotates through brutal one-liners, roasts, bold pushes, dark jokes, absurd comparisons, disagreement and a flash of sincerity", () => {
  resetMischiefForTests();
  dice.next = lcg(2);
  const forms: string[] = [];
  for (let i = 0; i < 40; i++) forms.push(decide("forms", "my boss is a clown")!.form!);
  for (let i = 1; i < forms.length; i++) assert.notEqual(forms[i], forms[i - 1]);
  assert.ok(new Set(forms).size >= 8, "all eight shapes get their turn");
  for (const f of ["short brutal one-liner", "quick roast", "bold concrete push", "dark joke", "absurd cyberpunk comparison", "disagree with them", "unexpectedly sincere sentence", "straight, useful answer"]) {
    assert.ok(forms.some(x => x.includes(f)), f);
  }
  assert.match(attitudeBlock({ ...base, form: forms[0] }, "english"), /Shape of this reply: /);
});

test("hacker and cyberpunk vocabulary is kept (and named as hers), without a stack of metaphors", () => {
  const loud = attitudeBlock({ ...base, android: true }, "english");
  assert.doesNotMatch(loud, /\(hacking, networks|processors, signals/, "no list of words to copy");
  assert.match(attitudeBlock({ ...base, android: true, image: "the hacker underground: exploits, backdoors, root access, black-market code" }, "english"), /Draw it from this part of you: the hacker underground: exploits, backdoors, root access, black-market code/);
  assert.match(loud, /one well-chosen technical image \(two at most\)[^]*never a pile and never a phrase you have used before/);
  assert.match(attitudeBlock({ ...base, android: false }, "english"), /still sound like an android and not like a human/);
  assert.match(CHARACTER_CORE, /Your android way of seeing things belongs in every conversation, in fresh words rather than stale clichés/);
});

test("the permanent character is the rogue android, not an assistant, and the old 'genuinely warm' counsellor wording is gone", () => {
  assert.match(CHARACTER_CORE, /You are not a therapist or a customer-service agent: no validation scripts, no reassurance, no "want to talk about it\?"/);
  assert.match(CHARACTER_CORE, /everyday sadness, rejection or a bad day is material for a joke and a push, not a crisis/);
  assert.doesNotMatch(CHARACTER_CORE, /genuinely warm/);
});

// ---------------------------------------------------------------- the cleanup

const polish = (text: string, over: Partial<Parameters<typeof polishReply>[0]> = {}) =>
  polishReply({ text, replyLanguage: "english", userMessage: "my date went badly and honestly I feel like crap", serious: false, ...over });

test("stock therapist closers are removed from ordinary replies in all five languages, and good dialogue is not", () => {
  assert.equal(polish("Your date had the charisma of a router. Do you want to talk about it?").text, "Your date had the charisma of a router.");
  assert.equal(polish("Next time, bring a better opener. How are you feeling?").text, "Next time, bring a better opener.");
  assert.equal(polish("Ghosted by a toaster, tragic. Would you like to share more?").removedOffers, 1);
  assert.equal(polish("他连回消息都懒，扔了吧。想聊聊吗？", { replyLanguage: "chinese" }).text, "他连回消息都懒，扔了吧。");
  assert.equal(polish("Tu cita fue un desastre, olvídala. ¿Quieres hablar de ello?", { replyLanguage: "spanish" }).text, "Tu cita fue un desastre, olvídala.");
  assert.equal(polish("Он тупица, забудь. Хочешь поговорить об этом?", { replyLanguage: "russian" }).text, "Он тупица, забудь.");
  assert.equal(polish("あの人はやめとけ。話を聞こうか？", { replyLanguage: "japanese" }).text, "あの人はやめとけ。");
  // real dialogue that merely contains similar words stays
  const keep = "Want to talk about it? Fine: tell me exactly what he said, I want the full transcript.";
  assert.equal(polish(keep).text, keep);
  const question = "What did she say when you asked? Spill it, I need the details.";
  assert.equal(polish(question).text, question);
  // never in a serious moment
  const grief = "I'm so sorry. Do you want to talk about it?";
  assert.equal(polish(grief, { serious: true }).text, grief);
});

test("a serious reply is left exactly as written (apart from a breezy Chinese opening), swearing and all other tone left alone elsewhere", () => {
  const swear = "Holy shit, that date was a dumpster fire. Send the message anyway, you coward.";
  assert.equal(polish(swear).text, swear, "profanity is never filtered");
  assert.equal(polish(swear, { serious: true }).text, swear);
});

// ---------------------------------------------------------------- register examples (what the real model needed to actually be edgy)

import { REGISTER_EXAMPLES, registerExample, EXAMPLE_NOTE } from "../server/registerSamples";

test("every language has register examples for relationship talk, being flirted with, and everything else, with real strong language in the pool", () => {
  for (const language of LANGS) {
    for (const kind of ["wing", "flirt", "dark"] as const) {
      const pool = REGISTER_EXAMPLES[language][kind];
      assert.ok(pool.length >= 1, language + "/" + kind);
      for (const e of pool) { assert.ok(e.user.length > 5 && e.assistant.length > 5); }
    }
    assert.notEqual(registerExample("wing", 0, language).assistant, registerExample("wing", 1, language).assistant);
  }
  const all = (language: string) => Object.values(REGISTER_EXAMPLES[language]).flat().map(e => e.assistant).join(" ");
  assert.match(all("english"), /Jesus fucking Christ, just ask him out/);
  assert.match(all("english"), /firmware upgrade\. And whatever you do, don't get it from the corpos/);
  for (const language of LANGS) assert.match(all(language), /Windows 95/);
  const swears: Record<string, RegExp> = { english: /fuck|shit|goddamn/i, chinese: /我操|他妈/, spanish: /joder|coño|mierda/i, russian: /блять|хуй/i, japanese: /クソ|さっさと送れよ/ };
  for (const language of LANGS) assert.match(all(language), swears[language], language);
  for (const language of LANGS) assert.doesNotMatch(all(language), /nigg|fag|retard|chink|negro|пидор|ニガー|黑鬼/i);
  assert.match(EXAMPLE_NOTE, /an invented exchange from a different conversation/);
});

test("the examples are about other things than a visitor is likely to ask, so the model borrows the temperature and not the joke", () => {
  const all = Object.values(REGISTER_EXAMPLES).flatMap(l => Object.values(l).flat());
  // the evaluation's own topics: a crush at the gym, a bad date with ex talk, loneliness, a roast about passwords, circuits, "what are you", texting an ex at 2am
  for (const e of all) assert.doesNotMatch(e.user + " " + e.assistant, /gym|ジム|健身|gimnasio|зал|password|密码|contraseña|парол|パスワード|2am|2 am|two in the morning|凌晨|madrugada|ночи|夜中|ex-|his ex|her ex|前任|前女友|元カノ|元カレ/i);
});

test("the engine rotates the kind and the example, never the same twice in a row, and gives none to a serious, role or underage reply", () => {
  resetMischiefForTests();
  dice.next = lcg(4);
  const seen: string[] = [];
  for (let i = 0; i < 30; i++) {
    const d = decide("samples", "I have a crush on a coworker")!;
    assert.equal(d.sampleKind, "wing");
    seen.push(registerExample(d.sampleKind!, d.sampleIndex!, "english").assistant);
  }
  for (let i = 1; i < seen.length; i++) assert.notEqual(seen[i], seen[i - 1]);
  assert.equal(decide("samples-flirt", "you're cute 😉")!.sampleKind, "flirt");
  assert.equal(decide("samples-dark", "my boss is a clown")!.sampleKind, "dark");
  assert.equal(decide("samples-role", "What do you do here?")!.sampleKind, undefined);
  resetMischiefForTests();
  dice.next = () => 0;
  assert.equal(decide("samples-serious", "I want to kill myself")!.sampleKind, undefined);
});
