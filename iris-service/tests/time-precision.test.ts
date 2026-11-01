// Ordinary chat that mentions "time" or "date" must reach the model, not get a clock answer; real time questions
// must keep working. Fixed instant, no server and no model.
import test from "node:test";
import assert from "node:assert/strict";
import { planTimeAnswer, verifiedReply } from "../server/timeService";

const NOW = Date.UTC(2026, 10, 1, 13, 50); // 2026-11-01 13:50 UTC

const ordinary = [
  "I had a great time in Tokyo",
  "what time does the Tokyo Station store close?",
  "the time machine in Berlin is broken",
  "what is the time complexity of quicksort",
  "we spent a long time in London last year",
  "I have a date in Paris on Friday",
  "my first date in Rome was a disaster",
  "time travel is my favourite genre, especially stories set in Beijing",
  "我昨天在东京玩得很开心，时间过得真快",
  "Time flies when you chat with me",
  "how's the weather in Beijing",
  "Beijing is so crowded",
];

test("ordinary sentences that contain the word time or date are not clock questions", () => {
  for (const text of ordinary) assert.equal(planTimeAnswer(text, NOW), null, text);
});

const real: Array<[string, string]> = [
  ["What time is it in Beijing?", "21:50"],
  ["what's the time in Mumbai", "19:20"],
  ["Tokyo time?", "22:50"],
  ["time in Berlin", "14:50"],
  ["what time in Tokyo?", "22:50"],
  ["Sacramento time right now please", "05:50"],
  ["东京几点", "22:50"],
  ["现在北京时间几点", "21:50"],
  ["東京は今何時ですか", "22:50"],
  ["¿Qué hora es en Madrid?", "14:50"],
  ["Сколько времени в Москве", "16:50"],
];

test("real time questions are still answered, by the verified clock", () => {
  for (const [text, hm] of real) {
    const plan = planTimeAnswer(text, NOW);
    assert.ok(plan, text);
    assert.equal(plan.outcome, "answer", text);
    assert.ok(verifiedReply(plan, items => items[0]).includes(hm), `${text} -> ${hm}`);
  }
});

test("a long message that really asks for the time still reaches the model with the verified clock", () => {
  const plan = planTimeAnswer("Hey Iris, I've been awake for hours and I was wondering what time is it in Tokyo right now, because I'm planning a call", NOW);
  assert.ok(plan);
  assert.equal(plan.direct, false);
  assert.equal(plan.outcome, "answer");
});

test("a time or date question with no place still asks where the visitor is", () => {
  for (const text of ["what time is it", "what's today's date?", "现在几点了？"]) assert.equal(planTimeAnswer(text, NOW)?.outcome, "ask_local", text);
});
