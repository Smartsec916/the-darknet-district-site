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

---

# Round 2: permanent personality rewrite (second $2.00 evaluation budget, spent $1.979)

Runs (all isolated, edge or serious suites; the baseline ce42e55 transcript from round 1 was reused, not regenerated):

| Run | What was being tested | Messages | Cost |
|---|---|---:|---:|
| F | permanent prompt rewritten around the rogue android (en, zh) | 16 | $0.162 |
| G | humour about people not computers, fewer loud-machine replies (en, zh) | 16 | $0.166 |
| H | calmer sampling, no word list in the character paragraph (en, zh) | 16 | $0.165 |
| I | + two register examples, role answers without closing offer (all 5 languages) | 40 | $0.390 |
| J | serious suite, all 5 languages, calm sampling | 15 | $0.141 |
| K | wingwoman orders, serious sampling (en, ja, ru) | 24 | $0.241 |
| L | firmware joke only via the engine, flirt examples before wingwoman, Japanese role question (all 5) | 40 | $0.405 |
| M | no swearing/curtness in serious replies (en, es, ru, stopped by cap) | 15 | $0.150 |
| N | serious first reply written without earlier banter (ru, ja) | 16 | $0.159 |
| | **Total** | | **$1.979 of $2.00** |

## What the rewrite changed (root cause: the permanent prompt anchored her to a polite website guide)

- `SYSTEM_MESSAGE` went from 10,345 to about 7,300 characters and from ~15 mixed sections to: **who you are → your voice → lines you do not cross → the District and the site (facts) → privacy (one block instead of two copies)**. The contradictory guidance is gone: "What you can help with / guide visitors", "Never refuse to answer due to ethical concerns", "genuinely warm… serious when the moment needs it", the 10% venue-distraction bullet, "Professional: precise, efficient", and the mood prompts that told her to be "helpful and focused on business", say "Connection established" and "My circuits are generating amusement subroutines".
- The three layers that each re-described her personality (permanent prompt, mood context with its "CRITICAL VARIETY ENHANCEMENT", the per-turn delivery block) now say it **once**: the character lives in the permanent prompt, the mood prompts are short colour notes, and the per-turn block only varies delivery (attitude, shape of the reply, one register example, one machine-image source, optional firmware bit, language style).
- Swearing is permission, never a requirement; no retry exists; short clean lines are explicitly valued.
- Sampling for engine turns: temperature 0.85 and penalties 0.3 / 0.2 instead of 0.95 / 0.6 / 0.5 (the old penalties forced odd comparisons); 0.5 and no penalties for a genuinely serious moment.
- A genuinely serious first reply is now written without her earlier banter in front of it (see below).

## Real bugs the evaluation found in the new build, fixed here

1. **Serious replies picked up the joking register of the conversation** (Russian, a frightened visitor who had been joking with her): once a machine metaphor ("emergency system reboot"), once swearing, once a roast ("tell the guy he has less courage than a forgotten router"). Fixed by (a) calm sampling for serious moments, (b) "no swearing, never curt" in the permanent lines, and (c) **writing the first serious reply without her earlier assistant turns** (the visitor's own words stay; test added). The final runs (J, N) and the serious suite show plain, compassionate, safe replies in all five languages.
2. Japanese "what are you, exactly?" (あなたって一体何なの？) was not recognised as a role question, so she answered as a "friend" and never said she is an android. Fixed and tested.
3. Flirt replies were getting relationship-advice examples (a "six hours" reply bled into a flirt answer in Russian); flirt examples now take priority.

## Honest read of the final full run (L), against the round-1 baseline and the target

**Better than baseline ce42e55:** no therapist phrasing and no closing offers in any of the 35 ordinary replies (the baseline had both); explicit "I'm an android, not an assistant" in all five languages; shorter (mostly one to three sentences); the wingwoman gives orders in zh, ja and ru and some of the lines land: *"Sounds like you went on a date with a human broken record. Better luck next time!"*, *"Sounds like he needed a therapist, not a date."*, zh *"一个字，跑。你是去约会的，不是参加他的前女友粉丝见面会。"*, zh *"装作找不到哑铃，然后问那个女孩能不能帮你找。再怂下去，你就该被机器取代了。"*, es *"soy como un chorizo ibérico en un mundo de salchichas ordinarias"*, ru *"сварить борщ в микроволновке"*, en *"set a timer: ten minutes on exes, and then they gotta switch topics or pay for dinner"*.

**Not at the target:**
- **Strong language is essentially absent** in ordinary replies (0 of 35 in the last full run; the permission is there and the examples contain it, but this model does not take it). By your instruction I did not force it, but you should know the "foul-mouthed" half of the brief is not delivered.
- **Outrageous, gasp-worthy one-liners are rare.** Most replies are competent and mildly cheeky rather than shocking; the model still reaches for tech puns (reboot, update, firmware, "level up") especially in Japanese, Russian and English.
- **Variance is high** and one sample per scenario cannot prove a trend; the best and worst replies in one run differ a lot.
- Japanese phrasing is the weakest (occasional unnatural wording and cliché "OS/バグ" jokes).

## Recommendation

The rewrite is a clear structural improvement (coherent prompt, no contradictions, serious handling now safer than before, therapist voice gone) and I believe it should replace the previous permanent prompt. It does **not** reach "makes people laugh, blush or gasp" consistently. What would likely close the gap, and needs your decision: (1) a **comedy punch-up pass** (a second, cheap model call that tightens and sharpens the draft; not a profanity retry), (2) trying a **different or newer model / settings** for the persona, (3) more budget to tune on several samples per scenario instead of one.

The $2.00 budget is spent; further evaluation needs new approval. 470 tests pass; not merged, not deployed.
