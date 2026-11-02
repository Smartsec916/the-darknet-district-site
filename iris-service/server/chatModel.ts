// Which model answers, and with what sampling.
//
// The model experiment (docs/IRIS-UNFILTERED-EVAL-RESULTS.md) found that `gpt-4o` was the ceiling on Iris's humour: the same prompts on `gpt-5.4-mini`
// were sharper, shorter and funnier in all five languages, at a third of the cost and about half the latency. So the ORDINARY conversation turns the Mischief
// Engine drives use `gpt-5.4-mini`. Two things deliberately stay on `gpt-4o`, the model they were evaluated and verified on:
//   - a genuinely serious moment (danger, abuse, a death): the newer model followed her rogue persona over the serious-moment instructions once in five
//     evaluated scenarios (it swore at an abuser in a reply to a victim), `gpt-4o` at calm sampling did not;
//   - everything that is not an engine turn (live data, the clock, memory recall, welcome messages, language detection): facts, not banter.
// Each is one request per message, as before. Both can be set from the environment, which is also the rollback: IRIS_CHAT_MODEL=gpt-4o restores the old model.
export const DEFAULT_CHAT_MODEL = "gpt-5.4-mini";
export const DEFAULT_FALLBACK_MODEL = "gpt-4o";

// gpt-5 and o-series models take max_completion_tokens, no penalties, and (for the 5.6 family) only the default temperature
export const isModernModel = (model: string): boolean => /^(gpt-5|o\d)/.test(model);

export function pickChatModel(env: Record<string, string | undefined>, turn: { engine: boolean; serious: boolean }): string {
  const fallback = (env.IRIS_SERIOUS_MODEL ?? "").trim() || DEFAULT_FALLBACK_MODEL;
  if (!turn.engine) return DEFAULT_FALLBACK_MODEL;
  if (turn.serious) return fallback;
  return (env.IRIS_CHAT_MODEL ?? "").trim() || DEFAULT_CHAT_MODEL;
}

// Room for a newer model's hidden reasoning (billed only if used; the models evaluated used none)
const MODERN_EXTRA_TOKENS = 400;

export interface Sampling { maxTokens: number; temperature: number; presencePenalty: number; frequencyPenalty: number }

// The request parameters for this model: classic models get the sampling as given, newer ones their own token limit and their default sampling
export function samplingParams(model: string, s: Sampling): Record<string, number> {
  if (isModernModel(model)) return { max_completion_tokens: s.maxTokens + MODERN_EXTRA_TOKENS };
  return { max_tokens: s.maxTokens, temperature: s.temperature, presence_penalty: s.presencePenalty, frequency_penalty: s.frequencyPenalty };
}
