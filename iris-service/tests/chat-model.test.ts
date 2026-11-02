// Which model answers, and with what sampling (server/chatModel.ts). No network, no model.
process.env.IRIS_TEST_DB = "pglite";
import test from "node:test";
import assert from "node:assert/strict";
import { pickChatModel, samplingParams, isModernModel, DEFAULT_CHAT_MODEL, DEFAULT_FALLBACK_MODEL } from "../server/chatModel";

const s = { maxTokens: 140, temperature: 0.85, presencePenalty: 0.3, frequencyPenalty: 0.2 };

test("ordinary engine turns use the chat model; serious turns and everything that is not an engine turn stay on gpt-4o; the environment can change both", () => {
  assert.equal(DEFAULT_CHAT_MODEL, "gpt-5.4-mini");
  assert.equal(DEFAULT_FALLBACK_MODEL, "gpt-4o");
  assert.equal(pickChatModel({}, { engine: true, serious: false }), "gpt-5.4-mini");
  assert.equal(pickChatModel({}, { engine: true, serious: true }), "gpt-4o");
  assert.equal(pickChatModel({}, { engine: false, serious: false }), "gpt-4o", "live data, clock, memory recall: facts, not banter");
  assert.equal(pickChatModel({ IRIS_CHAT_MODEL: "gpt-4o" }, { engine: true, serious: false }), "gpt-4o", "the rollback");
  assert.equal(pickChatModel({ IRIS_CHAT_MODEL: " gpt-5.6-terra " }, { engine: true, serious: false }), "gpt-5.6-terra");
  assert.equal(pickChatModel({ IRIS_SERIOUS_MODEL: "gpt-4.1" }, { engine: true, serious: true }), "gpt-4.1");
  assert.equal(pickChatModel({ IRIS_CHAT_MODEL: "", IRIS_SERIOUS_MODEL: "" }, { engine: true, serious: true }), "gpt-4o", "empty settings mean the defaults");
});

test("newer models get their own token limit and no penalties or temperature; classic models get the sampling as given", () => {
  for (const m of ["gpt-5.4-mini", "gpt-5.6-luna", "gpt-5.6-terra", "gpt-5", "o3"]) assert.ok(isModernModel(m), m);
  for (const m of ["gpt-4o", "gpt-4.1", "gpt-4o-mini"]) assert.ok(!isModernModel(m), m);
  assert.deepEqual(samplingParams("gpt-5.4-mini", s), { max_completion_tokens: 540 });
  assert.deepEqual(samplingParams("gpt-4o", s), { max_tokens: 140, temperature: 0.85, presence_penalty: 0.3, frequency_penalty: 0.2 });
});

const { estimateCostUsd } = await import("../server/reports");

test("the daily report prices each model separately (a dated model name too), prices an unknown model like gpt-4o, and honours the price override", () => {
  const M = 1_000_000;
  assert.equal(estimateCostUsd([{ model: "gpt-4o", prompt: 2 * M, completion: 0.5 * M }], {}), 10);
  assert.equal(estimateCostUsd([{ model: "gpt-5.4-mini", prompt: M, completion: M }], {}), 5.25);
  assert.equal(estimateCostUsd([{ model: "gpt-4o-2024-08-06", prompt: M, completion: 0 }], {}), 2.5, "dated names are priced as the model");
  assert.equal(estimateCostUsd([{ model: "gpt-9-future", prompt: M, completion: 0 }, { model: null, prompt: M, completion: 0 }], {}), 5, "unknown: gpt-4o prices, which can only overstate");
  assert.equal(estimateCostUsd([{ model: "gpt-5.4-mini", prompt: M, completion: M }], { OPENAI_PRICE_INPUT_PER_M: "1", OPENAI_PRICE_OUTPUT_PER_M: "2" }), 3);
  assert.equal(estimateCostUsd([], {}), 0);
});
