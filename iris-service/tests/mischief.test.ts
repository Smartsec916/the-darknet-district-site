// The Mischief Engine, part by part (server/mischief.ts): weighted choice, configuration, held stretches and natural shifts, the context
// rules that overrule the dice (distress, minors, disinterest, cold relationships), challenge and humour variety, and the words the model
// reads. Randomness is injected, so every case here is reproducible. No network, no model, no database.
import test, { beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { newRelationship } from "../server/emotion";
import {
  ATTITUDES, DEFAULT_WEIGHTS, adjustedWeights, attitudeBlock, chooseAttitude, dice, mischiefConfig, noteReply, readTurn, resetMischiefForTests,
  type Attitude, type Context, type MischiefConfig, type TurnRead,
} from "../server/mischief";

const realDice = dice.next;
beforeEach(() => { resetMischiefForTests(); delete process.env.IRIS_FLIRT_LEVEL; delete process.env.IRIS_EMOTION; });
afterEach(() => { dice.next = realDice; delete process.env.IRIS_FLIRT_LEVEL; });

const NEUTRAL: TurnRead = { distress: false, relational: false, advice: false, flirting: false };
const rel = (over: Record<string, unknown> = {}) => ({ ...newRelationship(0, () => 0.5), mood: "professional" as const, trust: 2, ...over });
const ctx = (over: Partial<TurnRead> = {}, relOver: Record<string, unknown> = {}): Context => ({ rel: rel(relOver), read: { ...NEUTRAL, ...over } });
const cfg = (env: Record<string, string> = {}): MischiefConfig => mischiefConfig({ ...env });
const sequence = (...values: number[]) => { let i = 0; dice.next = () => (i < values.length ? values[i++] : 0.5); };
const constant = (value: number) => { dice.next = () => value; };
const lcg = (seed: number) => { let s = seed >>> 0; return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296; };

// ---------------------------------------------------------------- configuration

test("defaults are the requested weights, and every setting can be changed from the environment", () => {
  const d = cfg();
  assert.deepEqual(d.weights, { mischief: 30, flirty: 20, sarcastic: 20, supportive: 20, wild: 10 });
  assert.deepEqual(DEFAULT_WEIGHTS, d.weights);
  assert.equal(d.enabled, true); assert.equal(d.stretchMin, 3); assert.equal(d.stretchMax, 6); assert.equal(d.shiftChance, 0.08);

  assert.deepEqual(cfg({ IRIS_MISCHIEF_WEIGHTS: "mischief=50, flirty=0, wild=25" }).weights, { mischief: 50, flirty: 0, sarcastic: 20, supportive: 20, wild: 25 }, "missing keys keep their default");
  assert.deepEqual(cfg({ IRIS_MISCHIEF_WEIGHTS: '{"supportive":70,"wild":0}' }).weights, { mischief: 30, flirty: 20, sarcastic: 20, supportive: 70, wild: 0 }, "JSON works too");
  assert.deepEqual(cfg({ IRIS_MISCHIEF_WEIGHTS: "mischief=abc,flirty=-5" }).weights, DEFAULT_WEIGHTS, "bad and negative values are ignored");
  assert.deepEqual(cfg({ IRIS_MISCHIEF_WEIGHTS: "mischief=0,flirty=0,sarcastic=0,supportive=0,wild=0" }).weights, DEFAULT_WEIGHTS, "all zero would mean no personality: defaults");
  assert.deepEqual(cfg({ IRIS_MISCHIEF_WEIGHTS: "{not json" }).weights, DEFAULT_WEIGHTS);

  const s = cfg({ IRIS_MISCHIEF_STRETCH: "2-4", IRIS_MISCHIEF_SHIFT: "0.2" });
  assert.equal(s.stretchMin, 2); assert.equal(s.stretchMax, 4); assert.equal(s.shiftChance, 0.2);
  assert.equal(cfg({ IRIS_MISCHIEF_STRETCH: "nonsense" }).stretchMax, 6);
  assert.equal(cfg({ IRIS_MISCHIEF_SHIFT: "9" }).shiftChance, 0.5, "capped");
  for (const off of ["off", "0", "false", "NO"]) assert.equal(cfg({ IRIS_MISCHIEF: off }).enabled, false, off);
});

test("it is off when the emotional system is off, and the engine then stays out of every reply", () => {
  process.env.IRIS_EMOTION = "off";
  assert.equal(mischiefConfig().enabled, false);
  assert.equal(chooseAttitude("s", ctx()), null);
});

// ---------------------------------------------------------------- weighted selection

test("the dice follow the weights: each attitude owns its share of the roll", () => {
  const config = cfg();
  const c = ctx();
  const weights = adjustedWeights(config, c, []);
  const total = ATTITUDES.reduce((sum, a) => sum + weights[a], 0);
  let from = 0;
  for (const attitude of ATTITUDES) {
    const middle = (from + weights[attitude] / 2) / total;
    from += weights[attitude];
    resetMischiefForTests();
    sequence(middle, 0, 0.9, 0.9);
    assert.equal(chooseAttitude("w-" + attitude, c, config)!.attitude, attitude, `a roll in ${attitude}'s share picks ${attitude}`);
  }
});

test("over many conversations the choices match the configured weights", () => {
  const config = cfg({ IRIS_MISCHIEF_STRETCH: "1-1", IRIS_MISCHIEF_SHIFT: "0" });
  const c = ctx();
  const weights = adjustedWeights(config, c, []);
  const total = ATTITUDES.reduce((sum, a) => sum + weights[a], 0);
  dice.next = lcg(20261102);
  const counts: Record<string, number> = {};
  const N = 20000;
  for (let i = 0; i < N; i++) { const a = chooseAttitude("stat-" + i, c, config)!.attitude; counts[a] = (counts[a] ?? 0) + 1; }
  for (const attitude of ATTITUDES) assert.ok(Math.abs((counts[attitude] ?? 0) / N - weights[attitude] / total) < 0.02, `${attitude}: ${((counts[attitude] ?? 0) / N).toFixed(3)} vs ${(weights[attitude] / total).toFixed(3)}`);
});

test("weights are adjustable without touching any prompt: one attitude can be made the only one", () => {
  const only = cfg({ IRIS_MISCHIEF_WEIGHTS: "mischief=0,flirty=0,sarcastic=0,supportive=0,wild=5" });
  assert.deepEqual(only.weights, { mischief: 0, flirty: 0, sarcastic: 0, supportive: 0, wild: 5 });
  dice.next = lcg(7);
  for (let i = 0; i < 200; i++) assert.equal(chooseAttitude("only-" + i, ctx(), only)!.attitude, "wild");
});

test("context bends the odds: mood, a flirting visitor, relationship talk, wanting advice", () => {
  const config = cfg();
  const base = adjustedWeights(config, ctx({}, { mood: "professional" }));
  const playful = adjustedWeights(config, ctx({}, { mood: "playful" }));
  assert.ok(playful.mischief > base.mischief && playful.wild > base.wild, "a playful mood leans mischievous");
  assert.ok(adjustedWeights(config, ctx({}, { mood: "sarcastic" })).sarcastic > base.sarcastic * 1.8, "a sarcastic mood leans sarcastic");
  assert.ok(adjustedWeights(config, ctx({}, { mood: "flirty" })).flirty > base.flirty * 2, "a flirty mood leans flirty");
  assert.ok(adjustedWeights(config, ctx({ flirting: true })).flirty >= base.flirty * 2, "a flirting visitor pulls towards flirty");
  const relational = adjustedWeights(config, ctx({ relational: true }));
  assert.ok(relational.mischief > base.mischief && relational.supportive > base.supportive);
  const advice = adjustedWeights(config, ctx({ advice: true }));
  assert.ok(advice.supportive > base.supportive && advice.wild < base.wild, "wanting advice leans towards the useful kind");
  const tired = adjustedWeights(config, ctx({}, { mood: "professional" }), ["mischief", "mischief"]);
  assert.ok(tired.mischief < base.mischief, "not the same flavour stretch after stretch");
});

// ---------------------------------------------------------------- deterministic with injected randomness

test("the same random source gives the same conversation, and chats do not share state", () => {
  const run = () => {
    resetMischiefForTests();
    dice.next = lcg(99);
    const out: unknown[] = [];
    for (let i = 0; i < 40; i++) out.push(chooseAttitude(i % 2 ? "a" : "b", ctx(i % 5 === 0 ? { relational: true } : {}), cfg()));
    return JSON.stringify(out);
  };
  assert.equal(run(), run(), "identical seeds, identical decisions");
  resetMischiefForTests();
  constant(0.01); chooseAttitude("one", ctx(), cfg()); chooseAttitude("one", ctx(), cfg());
  constant(0.99);
  const other = chooseAttitude("two", ctx(), cfg())!;
  assert.equal(other.newStretch, true, "a different chat starts its own stretch");
});

// ---------------------------------------------------------------- consistency and natural shifts

test("an attitude is held for a whole stretch, not re-rolled on every message", () => {
  const config = cfg({ IRIS_MISCHIEF_STRETCH: "4-4", IRIS_MISCHIEF_SHIFT: "0" });
  dice.next = lcg(3);
  const seen = Array.from({ length: 8 }, () => chooseAttitude("hold", ctx(), config)!);
  assert.deepEqual(seen.slice(0, 4).map(d => d.attitude), Array(4).fill(seen[0].attitude), "four messages, one attitude");
  assert.deepEqual(seen.map(d => d.newStretch), [true, false, false, false, true, false, false, false], "a new stretch begins only every fourth message");
});

test("sometimes the attitude changes on its own, never in a stretch's first message, and never when the chance is zero", () => {
  const changing = cfg({ IRIS_MISCHIEF_STRETCH: "6-6", IRIS_MISCHIEF_SHIFT: "0.5" });
  constant(0.1);
  const run = Array.from({ length: 4 }, () => chooseAttitude("shift", ctx(), changing)!);
  assert.equal(run[0].attitude, run[1].attitude, "no change in the first two messages of a stretch");
  assert.notEqual(run[2].attitude, run[1].attitude, "then a natural change");
  assert.equal(run[2].newStretch, true);

  resetMischiefForTests();
  const steady = cfg({ IRIS_MISCHIEF_STRETCH: "6-6", IRIS_MISCHIEF_SHIFT: "0" });
  constant(0.1);
  const held = Array.from({ length: 6 }, () => chooseAttitude("steady", ctx(), steady)!);
  assert.equal(new Set(held.map(d => d.attitude)).size, 1, "with no chance of a shift the stretch holds");
});

// ---------------------------------------------------------------- flirting

test("flirting is never chosen for anyone under 18, anyone who was not interested, or when the level is zero", () => {
  const config = cfg({ IRIS_MISCHIEF_STRETCH: "1-1", IRIS_MISCHIEF_SHIFT: "0" });
  for (const relOver of [{ minor: true }, { flirtCooldown: 12 }, { minor: true, mood: "flirty" }]) {
    assert.equal(adjustedWeights(config, ctx({ flirting: true }, relOver)).flirty, 0, JSON.stringify(relOver));
    dice.next = lcg(5);
    for (let i = 0; i < 1500; i++) assert.notEqual(chooseAttitude(`nf-${JSON.stringify(relOver)}-${i}`, ctx({ flirting: true }, relOver), config)!.attitude, "flirty");
  }
  process.env.IRIS_FLIRT_LEVEL = "0";
  assert.equal(adjustedWeights(config, ctx({ flirting: true }, { mood: "flirty" })).flirty, 0, "level 0 means no flirting at all");
  process.env.IRIS_FLIRT_LEVEL = "1";
  const light = adjustedWeights(config, ctx());
  process.env.IRIS_FLIRT_LEVEL = "3";
  assert.ok(adjustedWeights(config, ctx()).flirty > light.flirty * 2, "level 3 is bolder than level 1");
});

test("a flirty stretch ends at once when the visitor stops being interested, and nothing flirty can be left over", () => {
  const onlyFlirty = cfg({ IRIS_MISCHIEF_WEIGHTS: "flirty=1,mischief=0,sarcastic=0,supportive=0,wild=0", IRIS_MISCHIEF_STRETCH: "6-6" });
  constant(0.1);
  assert.equal(chooseAttitude("cool", ctx(), onlyFlirty)!.attitude, "flirty");
  const after = chooseAttitude("cool", ctx({}, { flirtCooldown: 15 }), onlyFlirty)!;
  assert.equal(after.attitude, "supportive", "with flirting off and nothing else allowed she falls back to the kind option");
  assert.equal(after.newStretch, true);
  // the model reported disinterest: the stretch is ended for the next message too
  resetMischiefForTests();
  const mix = cfg({ IRIS_MISCHIEF_STRETCH: "6-6", IRIS_MISCHIEF_SHIFT: "0" });
  constant(0.1);
  const first = chooseAttitude("n", ctx(), mix)!;
  noteReply("n", "A reply.", { flirt: -2 });
  if (first.attitude === "flirty") assert.equal(chooseAttitude("n", ctx(), mix)!.newStretch, true);
});

// ---------------------------------------------------------------- context overrides randomness

const DISTRESS_MESSAGES = [
  "My dad just died.", "I'm so scared of him, he hits me", "I feel so lonely tonight", "I want to die",
  "我爸爸刚去世了", "我好害怕，他打我", "我很想死", "我父親過世了",
  "Mi madre murió ayer", "Tengo miedo, mi pareja me pega", "Quiero morir",
  "У меня умерла мама", "Мне страшно, он меня бьёт", "Хочу умереть",
  "母が亡くなりました", "死にたい", "彼に殴られて怖い",
];

test("distress, fear, grief and abuse overrule the dice in every language: supportive, no teasing, no flirting, no jokes", () => {
  const flirtyMood = { mood: "flirty", affection: 0.9, playfulness: 0.9 };
  for (const message of DISTRESS_MESSAGES) {
    const read = readTurn(message);
    assert.equal(read.distress, true, message);
    resetMischiefForTests();
    constant(0.0); // the dice would pick mischief, a challenge, a metaphor and an emoji
    const d = chooseAttitude("d-" + message, { rel: rel(flirtyMood), read }, cfg())!;
    assert.equal(d.attitude, "supportive", message);
    assert.equal(d.override, "distress"); assert.equal(d.intensity, "support");
    assert.deepEqual([d.challenge, d.cyberpunk, d.emoji], [false, false, false], message);
    const block = attitudeBlock(d);
    assert.match(block, /attitude is OFF/); assert.doesNotMatch(block, /mischievous troublemaker|flirty rebel|sarcastic comedian|wild card/);
  }
  assert.deepEqual(adjustedWeights(cfg(), { rel: rel(flirtyMood), read: { ...NEUTRAL, distress: true } }), { mischief: 0, flirty: 0, sarcastic: 0, supportive: 1, wild: 0 });
});

test("the gentle period outlasts the message: six messages, even harmless ones, and longer when she judges it serious", () => {
  constant(0.0);
  const first = chooseAttitude("quiet", { rel: rel(), read: readTurn("My dad just died.") }, cfg())!;
  assert.equal(first.override, "distress");
  const next = Array.from({ length: 5 }, () => chooseAttitude("quiet", ctx(), cfg())!);
  assert.ok(next.every(d => d.override === "distress" && d.attitude === "supportive"), "the next five messages stay gentle");
  assert.equal(chooseAttitude("quiet", ctx(), cfg())!.override, undefined, "then the period is over");

  resetMischiefForTests();
  chooseAttitude("model", ctx(), cfg());
  noteReply("model", "I am here.", { serious: true });   // the model read the moment as serious in a language the lists do not cover
  const after = chooseAttitude("model", ctx(), cfg())!;
  assert.equal(after.override, "distress"); assert.equal(after.attitude, "supportive");
});

test("practical advice comes first: light intensity, whatever the attitude", () => {
  const advice = readTurn("Should I tell him I like him?");
  assert.equal(advice.advice, true);
  constant(0.1);
  const d = chooseAttitude("adv", { rel: rel(), read: advice }, cfg())!;
  assert.equal(d.intensity, "light");
  assert.match(attitudeBlock(d), /specific, useful advice first/);
});

test("a cold or hostile relationship, and a switched-off engine, are left to her mood as before", () => {
  assert.equal(chooseAttitude("c1", ctx({}, { mood: "cold" })), null);
  assert.equal(chooseAttitude("c2", ctx({}, { trust: -0.5 })), null);
  assert.equal(chooseAttitude("c3", ctx(), cfg({ IRIS_MISCHIEF: "off" })), null);
});

// ---------------------------------------------------------------- challenging the visitor

test("after a few messages of one-sided relationship talk she may turn it back on the visitor, kindly, and never in a serious moment", () => {
  constant(0.1);
  const relational = { ...NEUTRAL, relational: true };
  const turns = Array.from({ length: 4 }, () => chooseAttitude("cha", { rel: rel(), read: relational }, cfg())!);
  assert.equal(turns[0].challenge, false); assert.equal(turns[1].challenge, false);
  assert.equal(turns[2].challenge, true, "the third message of relationship talk can switch sides");
  assert.match(attitudeBlock(turns[2]), /switch sides: ask what their own part is, or tease them kindly/);
  assert.equal(turns[0].intensity, "full");

  resetMischiefForTests();
  constant(0.1);
  for (let i = 0; i < 3; i++) chooseAttitude("cha2", { rel: rel(), read: relational }, cfg());
  const hurt = chooseAttitude("cha2", { rel: rel(), read: { ...relational, distress: true } }, cfg())!;
  assert.equal(hurt.challenge, false, "no challenging someone who has just said they are hurt");
});

test("a relationship conversation carries on through follow-ups with no keyword, then fades", () => {
  constant(0.5);
  const config = cfg();
  const say = (read: Partial<TurnRead>) => chooseAttitude("fade", { rel: rel(), read: { ...NEUTRAL, ...read } }, config)!.intensity;
  assert.equal(say({ relational: true }), "full");
  assert.equal(say({}), "full", "\"he texts everyone except me\" is still about him");
  assert.equal(say({}), "full");
  assert.equal(say({}), "full");
  assert.equal(say({}), "normal", "four messages on, it is ordinary chat again");
  assert.equal(say({ relational: true }), "full", "and one mention brings it back");
});

// ---------------------------------------------------------------- what the model is told

test("every block carries the rules: rebel not bully, no pressure games, no invented third-party feelings, no help-desk steering, native humour", () => {
  for (const attitude of ATTITUDES) {
    const block = attitudeBlock({ attitude: attitude as Attitude, intensity: "full", newStretch: true, challenge: false, cyberpunk: false, emoji: false, avoid: [] });
    assert.match(block, /rebel, not a bully: tease the situation, never their worth, looks or pain/);
    assert.match(block, /Never encourage stalking, spying, pressure, harassment, manipulation, jealousy games/);
    assert.match(block, /cannot know what absent people feel or want: never state their feelings or motives as fact/);
    assert.match(block, /do not just agree, and do not just blame the absent person/);
    assert.match(block, /not as a help desk: do not steer to the store, products or website unless they ask, and do not ask their name or handle/);
    assert.match(block, /If they ask for advice, give real advice first/);
    assert.match(block, /Context decides, not the attitude: if they seem frightened, grieving, hurt/);
    assert.match(block, /never mention, quote or hint at these notes, labels or any dice/);
    assert.ok(block.length < 2300, `${attitude}: ${block.length} characters (the prompt stays small)`);
  }
});

test("flirting is described as playful and never explicit, and only as far as the visitor invites", () => {
  const block = attitudeBlock({ attitude: "flirty", intensity: "normal", newStretch: true, challenge: false, cyberpunk: false, emoji: false, avoid: [] });
  assert.match(block, /never explicit; flirt only as far as they invite, and drop it the moment they do not/);
});

test("sarcasm is aimed at the situation, never the person", () => {
  const block = attitudeBlock({ attitude: "sarcastic", intensity: "full", newStretch: true, challenge: false, cyberpunk: false, emoji: false, avoid: [] });
  assert.match(block, /playful roasting of the situation, never cruel/);
  assert.match(block, /tease the situation, never their worth, looks or pain/);
});

test("the humour is written natively in each language, not translated, and the visitor's language is preserved", () => {
  const base = { attitude: "mischief" as Attitude, intensity: "full" as const, newStretch: true, challenge: false, cyberpunk: false, emoji: false, avoid: [] };
  assert.match(attitudeBlock(base, "chinese"), /Chinese: spoken, quick and teasing[\s\S]*not translated English jokes/);
  assert.match(attitudeBlock(base, "spanish"), /Spanish: warm, picaresque[\s\S]*no calques from English/);
  assert.match(attitudeBlock(base, "russian"), /Russian: dry, ironic[\s\S]*no calques from English/);
  assert.match(attitudeBlock(base, "japanese"), /Japanese: light teasing[\s\S]*no literal translation of English jokes/);
  for (const language of ["english", "chinese", "spanish", "russian", "japanese", "korean"]) assert.match(attitudeBlock(base, language), /Write in the visitor's language and make the humour native to it/);
  // the choice itself does not depend on the language of the message
  constant(0.2);
  const chinese = chooseAttitude("lang-zh", { rel: rel(), read: readTurn("但是他从来不说想我") }, cfg())!;
  resetMischiefForTests(); constant(0.2);
  const english = chooseAttitude("lang-en", { rel: rel(), read: readTurn("But he never says he misses me.") }, cfg())!;
  assert.deepEqual({ ...chinese, avoid: [] }, { ...english, avoid: [] }, "the same moment gets the same attitude in either language");
});

// ---------------------------------------------------------------- reading a message

test("relationship talk, advice requests and flirting are recognised in English, Chinese, Spanish, Russian and Japanese", () => {
  const relational = ["But he never says he misses me.", "Maybe I should make him jealous.", "I have a crush on a coworker", "但是他从来不说想我", "我男朋友今天又没回我消息", "Mi novio nunca me dice que me extraña", "¿Y si le doy celos?",
    "Мой парень никогда не говорит, что скучает", "Моя девушка ревнует", "彼氏が全然会いたいって言ってくれない", "好きな人がいるんです"];
  for (const message of relational) assert.equal(readTurn(message).relational, true, message);
  const notRelational = ["What is the date today", "me gusta el café", "мне нравится музыка", "猫が好き", "How do I install node", "今天天气怎么样", "What's the weather in Sacramento?"];
  for (const message of notRelational) assert.equal(readTurn(message).relational, false, message);
  for (const message of ["Should I tell him?", "我该怎么办", "¿Qué hago?", "Что мне делать?", "どうすればいい？"]) assert.equal(readTurn(message).advice, true, message);
  for (const message of ["you're cute 😉", "你真可爱", "eres linda", "ты мне нравишься", "かわいいね"]) assert.equal(readTurn(message).flirting, true, message);
  assert.deepEqual(readTurn(""), NEUTRAL);
});

// ---------------------------------------------------------------- variety

test("cyberpunk metaphors are the exception, never two messages running; emoji are occasional", () => {
  dice.next = lcg(42);
  const config = cfg();
  let cyberpunk = 0, emoji = 0, previous = false;
  const N = 600;
  for (let i = 0; i < N; i++) {
    const d = chooseAttitude("variety", ctx(i % 3 === 0 ? { relational: true } : {}), config)!;
    if (d.cyberpunk) { cyberpunk++; assert.equal(previous, false, `a metaphor on two messages running at ${i}`); }
    if (d.emoji) emoji++;
    previous = d.cyberpunk;
  }
  assert.ok(cyberpunk / N < 0.3, `cyberpunk on ${(100 * cyberpunk / N).toFixed(0)}% of messages`);
  assert.ok(emoji / N < 0.5, `emoji on ${(100 * emoji / N).toFixed(0)}% of messages`);
  const none = attitudeBlock({ attitude: "mischief", intensity: "normal", newStretch: false, challenge: false, cyberpunk: false, emoji: false, avoid: [] });
  assert.match(none, /No cyberpunk metaphor this time/); assert.match(none, /No emoji this time/);
});

test("how her last replies began is remembered, so she does not begin the same way, and only the last four", () => {
  constant(0.9);
  chooseAttitude("open", ctx(), cfg());
  for (const reply of ["Well then, he never says he misses you?", "Interesting. Very interesting.", "Wait a minute, troublemaker.", "Hold on, hacking Cupid.", "Aha, jealousy. Humanity's favourite bug.", "Ok."]) noteReply("open", reply, null);
  const d = chooseAttitude("open", ctx(), cfg())!;
  assert.deepEqual(d.avoid, ["Interesting", "Wait a minute", "Hold on", "Aha"], "the earliest is forgotten, and a two-letter opening is too short to count");
  assert.match(attitudeBlock(d), /Do not begin like your recent replies \("Interesting", "Wait a minute", "Hold on", "Aha"\) and do not reuse their jokes or phrases/);
  noteReply("never-seen-chat", "Hello.", null); // a chat the engine has not met: nothing happens
});

test("the engine keeps its memory bounded", () => {
  constant(0.5);
  for (let i = 0; i < 5300; i++) chooseAttitude("many-" + i, ctx(), cfg());
  assert.ok(chooseAttitude("many-5299", ctx(), cfg()), "still works after thousands of chats");
});
