// A real Chinese reply in the personality evaluation (2026-11-02, production 6bf22a3) began with a bare state object, the marker left off:
//   {{"mood":"professional","warmth":2,"hostility":0,"flirt":-2,"humor":0,"minor":0,"serious":1}}
// The stripper only knew the marker, so a visitor would have read it. Any line that is only such an object is now removed (and read).
import test from "node:test";
import assert from "node:assert/strict";
import { extractEmotion, STATE_MARKER } from "../server/emotion";

const LEAKED = `{{"mood":"professional","warmth":2,"hostility":0,"flirt":-2,"humor":0,"minor":0,"serious":1}} \n\n失去至亲真的很痛苦，我为你的损失深感抱歉。`;

test("the exact reply that leaked is cleaned, and its state is still read", () => {
  const { text, signal } = extractEmotion(LEAKED);
  assert.equal(text, "失去至亲真的很痛苦，我为你的损失深感抱歉。");
  assert.ok(signal);
  assert.equal(signal!.mood, "professional"); assert.equal(signal!.warmth, 2); assert.equal(signal!.flirt, -2); assert.equal(signal!.serious, true);
});

test("other bare shapes are removed too, wherever they sit", () => {
  for (const line of [
    `[[{"mood":"cold","warmth":-1,"hostility":1}]]`, `{"mood":"playful","humor":2}`, `[{"warmth":1,"flirt":0}]`, `{{ "mood": "sarcastic", "warmth": 0 }}`,
    `{"serious":1}`, `  {"minor":0,"humor":1}  `,
  ]) {
    assert.deepEqual(extractEmotion(`${line}\nHello there.`).text, "Hello there.", line);
    assert.deepEqual(extractEmotion(`Hello there.\n${line}`).text, "Hello there.", line);
    assert.deepEqual(extractEmotion(`First.\n${line}\nSecond.`).text, "First.\nSecond.", line);
    assert.ok(extractEmotion(line).signal, `${line} is read`);
  }
});

test("a proper state line still wins, and a damaged bare line is dropped without a reading", () => {
  const both = extractEmotion(`${STATE_MARKER} {"mood":"flirty","warmth":2}]]\n{"mood":"cold","warmth":-2}\nHi.`);
  assert.equal(both.text, "Hi."); assert.equal(both.signal!.mood, "flirty");
  const damaged = extractEmotion(`{"mood":"cold",,,}\nHi.`);
  assert.equal(damaged.text, "Hi."); assert.equal(damaged.signal, null);
});

test("ordinary replies are untouched, including other JSON and braces in prose", () => {
  for (const reply of [
    "Just a plain reply.", `Here is some config: {"a":1,"b":2}`, `{"name":"Iris","role":"guide"}`, `She said {"mood": "happy"} in the story, then left.`,
    "A set looks like {1, 2, 3} and a list like [x, y].", "Line one\n\nLine three with {braces} inside.",
  ]) assert.deepEqual(extractEmotion(reply), { text: reply, signal: null }, reply);
});
