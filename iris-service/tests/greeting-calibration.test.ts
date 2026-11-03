// A bare "hello" is met warm, never roasted ("You sound like a doorbell with abandonment issues"). Her edge is held back until someone invites it
// (a roast request), plays along (established teasing) or flirts; then it comes out fully. Deterministic: reads, weights, the delivery block.
process.env.IRIS_TEST_DB = "pglite";
import test from "node:test";
import assert from "node:assert/strict";
import { attitudeBlock, chooseAttitude, dice, readTurn, resetMischiefForTests, adjustedWeights, mischiefConfig } from "../server/mischief";

const rel = (over: Record<string, unknown> = {}) => ({ trust: 2, mood: "playful", affection: 0.3, playfulness: 0.5, minor: false, flirtCooldown: 0, moodValue: 0, familiarity: 0.3, updatedAt: Date.now(), ...over }) as any;
const decide = (id: string, message: string, over: Record<string, unknown> = {}) => chooseAttitude(id, { rel: rel(over), read: readTurn(message) })!;
const lcg = (seed: number) => { let s = seed >>> 0; return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296; };
const ROUGH = ["sarcastic", "blunt", "wild"];
const INSULT_WORDS = /dark comedian|affectionate roasting|brutal|quick roast|savage|insult them|call out the excuse/i;

test("greetings are recognised in five languages, and only when the message is nothing but a greeting", () => {
  for (const g of ["hello", "Hello.", "hi", "Hey!", "hey iris", "good morning", "Good evening, Iris", "yo", "how are you", "hola", "buenos días", "привет", "你好", "こんにちは", "hello there", "Hi again!"]) assert.equal(readTurn(g).greeting, true, g);
  for (const m of ["hello what do you sell", "hi, roast me", "hello gorgeous, you look amazing", "hey I'm so scared right now", "tell me about the arcade", "hello? is anyone there? my boyfriend ignores me"]) assert.ok(!readTurn(m).greeting, m);
});

test("the exact failing case: 'hello' is never answered from a rough attitude, never salty, no edgy example, a friendly shape, and the block says so", () => {
  resetMischiefForTests(); dice.next = lcg(7);
  for (const playfulness of [0.1, 0.3, 0.5]) for (const mood of ["playful", "sarcastic", "neutral", "professional"]) for (let i = 0; i < 150; i++) {
    const d = decide(`hello-${playfulness}-${mood}-${i}`, "hello", { playfulness, mood });
    assert.ok(!ROUGH.includes(d.attitude), `${d.attitude} (${mood}, playfulness ${playfulness})`);
    assert.equal(d.gentle, true); assert.ok(!d.salty); assert.equal(d.sampleKind, undefined);
    assert.ok(!/brutal|roast|dark joke|call out/.test(d.form ?? ""), d.form);
    const block = attitudeBlock(d);
    assert.match(block, /just arriving or saying hello: welcome them warmly/);
    assert.match(block, /No insult, no roast, no sarcasm aimed at them/);
    assert.doesNotMatch(block, INSULT_WORDS);
    assert.match(block, /charming, mischievous android/);
  }
});

test("any first message nobody has teased her in is gentle too; the same message later in a chat, or with an invitation, is not", () => {
  resetMischiefForTests(); dice.next = lcg(11);
  const first = decide("first-1", "I'm new here");
  assert.equal(first.gentle, true);
  assert.ok(!decide("first-1", "I'm new here again").gentle, "the second message is ordinary chat");
  // established playful rapport lifts the restraint (a returning regular is allowed to be teased)
  assert.ok(!decide("first-2", "hello", { playfulness: 0.8 }).gentle);
  // advice, relationship talk and real questions have their own rules
  for (const m of ["what should i do about my job?", "my boyfriend ignores me", "Do you sell anything?"]) assert.ok(!decide("first-x-" + m, m).gentle, m);
  // a minor never gets a jab either, and stays clean
  assert.equal(decide("first-minor", "hello", { minor: true }).clean, true);
});

test("a roast request unlocks everything, at once, even as the very first message", () => {
  resetMischiefForTests(); dice.next = lcg(3);
  let sarcastic = 0, salty = 0; const N = 300;
  for (let i = 0; i < N; i++) {
    const d = decide("roast-" + i, "Roast me");
    assert.ok(!d.gentle); assert.equal(d.roast, true);
    assert.match(attitudeBlock(d), /They invited you to roast or tease them: do it, sharp and genuinely funny/);
    if (d.attitude === "sarcastic") sarcastic++;
    if (d.salty) salty++;
  }
  assert.ok(sarcastic / N > 0.3, `roast requests mostly get the sarcastic edge: ${sarcastic}/${N}`);
  assert.ok(salty / N > 0.25, `and strong language is welcome: ${salty}/${N}`);
  // "hello, roast me" is a roast, not a greeting
  assert.equal(readTurn("hello, roast me").greeting, undefined);
  assert.equal(decide("roast-hello", "hi! roast me please").roast, true);
});

test("a visitor who greets and then flirts gets flirted with: the restraint ends the moment it is invited", () => {
  resetMischiefForTests(); dice.next = lcg(21);
  let flirty = 0; const N = 300;
  for (let i = 0; i < N; i++) {
    const id = "hello-flirt-" + i;
    assert.equal(decide(id, "hello").gentle, true);
    const d = decide(id, "you look gorgeous today 😉");
    assert.ok(!d.gentle); assert.equal(d.flirtBack, true);
    if (d.attitude === "flirty") flirty++;
  }
  assert.ok(flirty / N > 0.6, `flirting back: ${flirty}/${N}`);
});

test("mood continuity: after a friendly hello the tone holds for a stretch instead of changing every message; the rough attitudes cannot be the very first one", () => {
  resetMischiefForTests(); dice.next = lcg(5);
  let changes = 0, runs = 0; const rough = new Set<string>();
  for (let i = 0; i < 300; i++) {
    const id = "cont-" + i; let last: string | undefined; const seq: string[] = [];
    for (const m of ["hello", "how is your day going", "I like your style", "so what is this place"]) {
      const d = decide(id, m); seq.push(d.attitude);
      if (last && last !== d.attitude) changes++; last = d.attitude;
    }
    runs++; if (ROUGH.includes(seq[0])) rough.add(seq[0]);
  }
  assert.equal(rough.size, 0, "never opens rough");
  assert.ok(changes / runs < 1.6, `fewer than two changes of attitude in four messages: ${(changes / runs).toFixed(2)}`);
});

test("the weights: a greeting zeroes the rough attitudes (a regular keeps a sliver), a first message halves them, a roast request multiplies them", () => {
  const cfg = mischiefConfig();
  const w = (message: string, over = {}, recent: any[] = []) => adjustedWeights(cfg, { rel: rel(over), read: readTurn(message) }, recent);
  const g = w("hello", { playfulness: 0.2 });
  assert.equal(g.sarcastic + g.blunt + g.wild, 0);
  const regular = w("hello", { playfulness: 0.8 });
  assert.ok(regular.sarcastic > 0 && regular.sarcastic < w("tell me something", { playfulness: 0.8 }, ["mischief"]).sarcastic);
  const later = w("hello", { playfulness: 0.2 }, ["mischief"]);
  assert.equal(later.sarcastic, 0, "a hello in the middle of a chat is still just a hello");
  assert.ok(w("Roast me", { playfulness: 0.2 }).sarcastic > 3 * w("tell me something", { playfulness: 0.2 }, ["mischief"]).sarcastic * 0.9);
});
