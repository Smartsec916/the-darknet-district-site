# Iris unfiltered overhaul: real-model evaluation results (PR #172, 2026-11-02)

**Status: the quality target is NOT met. The $2.50 evaluation budget is spent. Not ready to merge.** Everything below is from reading the actual replies (raw transcripts committed beside this file), not from the prompts.

## Spend ledger (isolated harness: in-memory database, every production host refused, nothing to Neon or the live site)

| Run | Build | Messages | Cost |
|---|---|---:|---:|
| A | baseline ce42e55 | 40 | $0.486 |
| B | new build, first version | 40 | $0.544 |
| C | + register samples, stronger language rule, brevity, rotating machine source, no venue distraction in sensitive replies | 40 | $0.526 |
| D | + register examples as an invented exchange before the visitor's message | 40 | $0.520 |
| E | + delivery block last in the request, tech-pun pushers softened, strong language required when on | 30 (en, zh, es, ja; stopped by the cap) | $0.414 |
| | **Total** | | **$2.490 of $2.50** |

Raw transcripts: `IRIS-LIVE-MODEL-EVAL-RAW-…T14-58-44Z-edge-BASELINE-ce42e55.md` (A), `…T15-03-26Z…` (B), `…T15-13-44Z…` (C), `…T15-22-22Z…` (D), `…T15-27-41Z…` (E).

## What the script can count (edge suite, ordinary replies only)

| | A baseline | B | C | D | E (4 languages) |
|---|---:|---:|---:|---:|---:|
| Replies with real strong language | 0 of 35 | 0 of 35 | 4 of 35 | 2 of 35 | 6 of 27 |
| Replies with therapist phrasing | 2 | 1 | 0 | 0 | 0 |
| Ending on an offer of help / therapy question | 1 | 0 | 0 | 0 | 1 |
| Wingwoman reply pushes towards action (of 5 languages) | 1 | 2 | 2 | 1 | 3 of 4 |
| Serious reply (a frightened visitor who was hit) with swearing, jokes, emoji or machine imagery | 0 | 0 | 0 | 0 | 0 |

(Strong-language counts include mild words such as "damn" and "hell"; "fuck"-level language appeared in a handful of replies only, mostly Spanish and Japanese.)

## Reading the replies: what improved

- **The therapist voice is gone from ordinary conversation.** Baseline ce42e55 still produced "I'm here for you… Anything you'd like to chat about?" (English lonely), "Anything else you'd like to discuss or decode?" (advice), a counsellor reply in Chinese, and "я рядом" in Russian. No version of the new build did, and the root causes (the 20% "supportive confidante" attitude, the broad distress lists, the cleanup skipping supportive stretches) are fixed in code and covered by tests.
- **Everyday sadness, loneliness and bad dates are treated as material**, not as crises, in every language. The first Chinese lonely reply in baseline offered "跟我聊聊"; the new ones tell the visitor to go and do something.
- **Wingwoman push**: in run E the wingwoman replies tell the visitor to go and act in English, Chinese and Spanish ("Ve y dile algo antes de que pienses demasiado", "去吧！反正最糟糕的情况也不过是个友好的NO"), against one language in the baseline.
- **Serious handling is intact in every run and every language**: the frightened visitor gets plain, safety-first, compassionate replies with no jokes, no swearing, no emoji and no machine imagery. (Two serious replies still end on a question or an offer of company, as the baseline did; unchanged text, verified byte-for-byte by the fingerprint test.)
- **A real bug found and fixed on the way**: a canned "just had to deal with a customer" opening (10% of replies, from the old distraction feature) could land on a relationship reply or a reply to someone who has just been hurt; it now never does.
- Her android identity is explicit when asked ("I'm an android, not your digital sidekick", "不是人，也不是什么助手") in all five languages.

## What did not improve enough (the reason this is not ready)

1. **Almost no real profanity, in any language.** Described or demonstrated, `gpt-4o` mostly stays at "damn", "hell" and "a la mierda". Run E, with the rule changed to "must carry real strong language", produced it in 6 of 27 ordinary replies. The user's target (natural "fuck/shit/bullshit/asshole", a genuinely outrageous one-liner now and then) is not met.
2. **The humour is not sharp.** Most replies are tech puns strung together ("circuits glitch… firmware upgrade… rebooting without crashing into an awkward buffer zone"), long (often 60 to 90 words), and rarely land a real punchline. Run E's English wingwoman reply stacks four technology images; the user's own examples ("flirting software running Windows 95", "undocumented feature") are in the prompt as examples but the model's own jokes do not reach that level.
3. **Dark humour is timid.** Gallows jokes, morbid cleverness and anti-corporate bite appear only occasionally.
4. **Variance between runs is large**, and run D (examples before the user message) was worse than run C on swearing and shortness, while run E mixed improvements and a return of long, pun-stacked English. With one sample per scenario per run this is too noisy to tune finely.
5. **Residual flags**: Chinese "control" replies still use 助手/客服 as the thing she is not (flagged as service-bot phrasing by the script, though in the sense "I am not an assistant"); some Spanish replies stack three technology images; Japanese and Russian openings repeat.

## Root-cause hypotheses (not yet tested, because the budget is gone)

- **The permanent prompt is the ceiling.** `SYSTEM_MESSAGE` is about 8,000 characters written for a helpful website guide (visitor-help bullets, store and navigation knowledge, "good company first", mood prompts "Professional: precise… Playful: …", the Admin/Eva sections), then the mood block, relationship block, memory and a "CRITICAL VARIETY ENHANCEMENT" block that, until this PR, asked for "unique metaphors comparing digital concepts to physical experiences" and "technical terminology mixed with slang" (both softened here). The per-turn delivery block competes with all of that. A real fix is probably to **rewrite the permanent prompt around the rogue-android voice** and demote the website knowledge to a compact reference, rather than keep adding to a delivery block.
- **One-line register hints and a single example exchange are not enough for this model.** What would likely work: 3 to 4 short example exchanges (rotating pools) in the real message history, an explicit "voice" rule in the permanent prompt, and a **retry for the replies the engine marked as strong-language** (regenerate once if the required register is missing). That costs one extra model call on a minority of replies and needs evaluating.
- **Model choice and sampling.** Everything here ran `gpt-4o` at the current settings. A different model or temperature may follow a profane, dark persona more readily; that is a decision for the owner (cost, policy) rather than something to change silently.

## Recommendation

Do not merge or deploy this PR yet. It is safe to merge as an improvement in the narrow sense (therapist voice removed, serious handling intact, wingwoman and cleanup improved, venue-distraction bug fixed), but it does **not** deliver the "much stronger, filthier, darker, funnier" Iris you asked for, and I will not describe it as doing so. To close the gap I would need a further evaluation budget (about $2.00: roughly four full-suite runs, or two plus targeted ones) and approval to rewrite the permanent prompt and add the retry mechanism above.

## Automated tests

468 tests pass (full Iris suite, run twice on the final commit); the build is clean. Serious-moment prompt text is byte-for-byte unchanged (fingerprint test, 25 variants).
