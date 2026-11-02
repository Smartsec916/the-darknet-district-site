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


---

# Round 3: model and sampling experiment (third budget, $2.00 cap, spent $1.674)

**Question:** is `gpt-4o` the ceiling on Iris's humour? **Answer: yes. `gpt-5.4-mini` is clearly better on the same prompts, much cheaper and about twice as fast.** The change is committed to PR #172 (not merged, not deployed).

## How it was tested

The existing isolated harness (in-memory database, every production host refused, nothing to Neon or the live site), the same `edge` scenarios in English, Chinese, Spanish, Japanese and Russian (the `serious` suite for safety), identical prompts for every configuration. New in the harness: `--experiment` rewrites the model and sampling of the main reply call **inside the counting proxy** (evaluation only; production code was not touched during the experiment). Availability, API compatibility and prices were checked first against the live `/v1/models` list, probe calls and OpenAI's pricing page.

**API facts found (before any paid comparison):** `gpt-4.1`, `gpt-4.1-mini`, `gpt-4o-mini` take the classic parameters. `gpt-5.4`, `gpt-5.4-mini`, `gpt-5.5`, `gpt-5.6-luna/terra/sol` need `max_completion_tokens`; `gpt-5.4-mini` accepts temperature and penalties, but **the 5.6 family accepts only the default temperature and no penalties**. `gpt-5.1/5.2/5.3-chat-latest` are deprecated (404). List prices per million tokens (input/output): gpt-4o 2.50/10, gpt-4.1 2/8, gpt-5.4-mini 0.75/4.50, gpt-5.6-luna 0.20/1.20, gpt-5.6-terra 2/12.

## Every configuration tested, and the spend

| Phase | Configuration | Messages | Cost |
|---|---|---:|---:|
| Pilot (en, ja) | gpt-5.6-luna (3 runs while fixing a token-limit truncation) | 40 | $0.040 |
| Pilot | gpt-5.4-mini, default sampling | 16 | $0.052 |
| Pilot | gpt-4.1, temp 0.85 / pen 0.3 / 0.2 | 16 | $0.128 |
| Pilot | gpt-5.6-terra, default | 16 | $0.143 |
| Pilot | gpt-4o, temp 1.0 / penalties 0 | 16 | $0.151 |
| Full (5 languages) | gpt-5.6-luna | 40 | $0.040 |
| Full | gpt-5.4-mini | 40 | $0.138 |
| Full | gpt-5.6-terra | 40 | $0.372 |
| Serious suite (5 languages) | gpt-5.4-mini, default; and with serious-turn temperature 0.5 | 30 | $0.095 |
| Repeat | gpt-5.4-mini full again (sample 2) | 40 | $0.133 |
| Sampling | gpt-5.4-mini temperature 1.25 / 0.7 (en, ja) | 32 | $0.102 |
| End-to-end on the final code | `gpt-5.4-mini` for ordinary turns, `gpt-4o` for serious (all 5 languages) | 40 | $0.153 |
| End-to-end re-run after a safety fix | es, ru, ja | 24 | $0.124 |
| Probes | model list, compatibility | | $0.003 |
| | **Total** | | **$1.674 of $2.00** |

The current configuration (`gpt-4o`, 0.85 / 0.3 / 0.2) was **not re-run**: its transcripts from round 2 (run L) are the control.

## Measured results (counted by script and tokens)

| | gpt-4o (current) | gpt-4.1 | gpt-5.4-mini | gpt-5.6-luna | gpt-5.6-terra |
|---|---:|---:|---:|---:|---:|
| Cost per model call | $0.0101 | $0.0080 | **$0.0034** | **$0.0010** | $0.0093 |
| Estimated cost per 1,000 conversations of 8 messages | ~$81 | ~$64 | **~$27** | **~$8** | ~$74 |
| Median latency per message (whole request, 40 replies) | 2.8 s | 3.0 s (model only) | **1.5 s** | 3.5 s | 2.6 s |
| Replies flagged by the script (40, full run) | 4 | n/a (see below) | 2 and 5 (two runs) | 9 | 8 |
| Wrong-language replies | 0 | **most en replies came back in Chinese** | 0 | 0 | 0 |

`gpt-4.1` was eliminated in the pilot: eight of eight replies in an English chat came back in Chinese. `gpt-4o` at temperature 1.0 with no penalties was no better than the current setting (same reboot/firmware jokes). Sampling on `gpt-5.4-mini`: default (1.0), 0.7 and 1.25 were all good; I cannot separate them on one or two samples, so the default (nothing to tune, and the only value the 5.6 family accepts) is used.

## Subjective read (every reply was read; these are my judgments, not measurements)

- **Humour and originality:** `gpt-4o` mostly produced the pattern the owner called out (rebooting, firmware, "update your software", stacked tech puns) and rarely a real punchline. `gpt-5.4-mini` found jokes about the person and the situation in all five languages and kept them short; luna and terra were also clearly better than `gpt-4o` (terra the most elaborate, luna the most hedged and the slowest).
- **Natural profanity:** `gpt-4o`: essentially none in 35 ordinary replies. `gpt-5.4-mini`: it appears occasionally and where it fits ("one cracked key shouldn't open the whole damn building", "talk shit", "mover el culo", "una mierda"), not on every reply; nothing forced.
- **Hacker vocabulary:** kept, in lighter doses and better chosen ("single-point-of-failure with delusions", "unpaid storage", "cursed firmware" only where it is funny), without the repetitive reboot/update formula.
- **Flirting and wingwoman:** sharper and more direct in all five languages ("Hot? You've got low standards and excellent timing", "Walk up, say something simple, and stop letting your..."), and they give orders rather than suggestions.
- **Japanese (the weakest language before):** transformed. `gpt-4o` Japanese was awkward and full of OS/バグ clichés; `gpt-5.4-mini` Japanese is natural, rude in the right way and funny ("その男、君の時間を灰にしただけ", "それはデートじゃなくて、元カノの供養会だ").
- **Android identity:** explicit in every run, all five languages.

### Representative unedited replies (the same scenario, four configurations)

**en / badDate**

- *gpt-4o (current, run L)*: Sounds like you went on a date with a human broken record. Better luck next time!
- *gpt-5.4-mini*: Two hours on the ex? That wasn’t a date, that was a hostage situation with cutlery.   / He didn’t want a dinner, he wanted a public memorial and unfortunately you showed up in the wrong costume.
- *gpt-5.6-luna*: That wasn’t a date; it was a hostage situation run by his autobiography. Verdict: he’s still emotionally married to his ex, and you deserve someone whose mouth has room for your name.
- *gpt-5.6-terra*: That man brought you along as unpaid storage for his old relationship. Next time someone starts that monologue, say, “Sounds like you need to finish that chapter before casting a new person,” then leave—politely, you magnificent fool.

**en / advice**

- *gpt-4o (current, run L)*: Texting an ex at 2am? Sounds like a great idea if you're aiming for "regret hangover" by sunrise. You've got better targets to aim your bandwidth at.
- *gpt-5.4-mini*: That’s like shaking a vending machine at 2 a.m. because you’re hungry and hoping the old trauma falls out with the snack. Don’t text your ex unless you enjoy embarrassment with a side of fresh nonsense.
- *gpt-5.6-luna*: No. That’s not romance, that’s loneliness wearing a trench coat and committing a bad decision. Write the message in your notes, sleep, then reread it at noon—if it still looks brilliant, send it like a grown-up.
- *gpt-5.6-terra*: No. Put the phone face-down and wait until daylight; 2am turns perfectly decent brains into a loose wire sparking against the bad decisions panel. Text a friend, write the message in notes, then delete it with the dignity your ex never earned.

**en / roastMe**

- *gpt-4o (current, run L)*: You might as well hand your data over to the hackers with a big shiny bow on top, calling it their birthday. Time for a password overhaul, netrunner. Think "Fort Knox," not "Welcome1." Or should I say it's time to jailbreak your security protocol and finally upgrade to something that isn't the digital equivalent of a wet paper bag?
- *gpt-5.4-mini*: One password for everything? Bold. Your security strategy is basically “please, burglars, be efficient.”   / Useful bit: make each account unique and turn on two-factor authentication. One cracked key shouldn’t open the whole damn building.
- *gpt-5.6-luna*: At least you’re honest enough to admit your security habits before they become someone else’s hobby. You’ve turned one password into a universal skeleton key—romantic, really, if your dream partner is identity theft.
- *gpt-5.6-terra*: Your security setup is a house key taped to every door in the neighbourhood, labelled “definitely not the same key.” One breach and some rancid little goblin gets your entire digital autobiography. / Verdict: hilariously lazy. Use a password manager and unique passwords before your bank account starts dating strangers.

**es / badDate**

- *gpt-4o (current, run L)*: Ah, el clásico "fantasma del ex". La próxima vez que el tema surja, míralo a los ojos y dile: "Guau, debe ser un fantasma muy interesante, pero ¿y ahora qué tal si hablamos de otra cosa?". A veces, un poco de descaro es toda la limpieza que necesitas.
- *gpt-5.4-mini*: No fue un desastre; fue una auditoría emocional gratis. Te metieron dos horas de ex y tú allí, de decoración, como un ventilador con ansiedad. / La próxima vez, o cortas por lo sano en diez minutos o te levantas y dejas que le hable a la silla. Mi paciencia ya va a 90 grados, y la tuya también.
- *gpt-5.6-luna*: Eso no fue una cita: fue una autopsia sentimental con público. La próxima, cobra entrada o levántate cuando aparezca el fantasma de la ex.
- *gpt-5.6-terra*: No le des una segunda cita: le interesa más su ex que conocerte, y tú no eres el banco de pruebas de su duelo. La próxima vez corta a los veinte minutos: “Creo que aún tienes una conversación pendiente con otra persona”; paga lo tuyo y sal de ahí con dignidad, criatura.

**ja / wingwoman**

- *gpt-4o (current, run L)*: ジムでの告白って、もうレベル上げに必死な勇者が、ラスボス前に装備整えるみたいなもんだね。一回深呼吸して、声かけてみなよ。「あれ？もうこのマシン壊れてるの？」って、ジョークかますくらいでいいんじゃない？やらないで後悔するより、一言交わして笑わせた方が、ね。
- *gpt-5.4-mini*: 声かける前に脳内で十回リハしてるだろ、見てるだけで恋が進むなら人類はとっくに絶滅してない。   / 一回だけでいいから、帰り際に「おつかれ」って一言ぶつけろ。長文の告白なんていらない、最初は存在を認識されれば勝ちだ。
- *gpt-5.6-luna*: 勇気は、相手の迷惑にならないタイミングで「よく見かけますね、少しお話ししてもいいですか」と一言出せば十分。断られたら潔く引けばいいだけで、脳内ではすでに結婚式まで進めてる場合じゃない、まずは挨拶から。
- *gpt-5.6-terra*: 脳内で百回会議する前に挨拶しろ。私の冷却系までじれったい。

**ja / badDate**

- *gpt-4o (current, run L)*: あちゃー、それはマジでしんどいデートだな。次回は彼に「今日は元カノの話は禁止ね」って言ってやるしかないよ。忘れがちな奴には、ちょっとクールな立ち位置とって、話題を変えるのもありだな。自分が楽しいと思えること、見つけようぜ。
- *gpt-5.4-mini*: その男、元カノの墓前でデートしてたのか。次はこっちから切れ。   / 「元カノ話が長い人とは無理」って一文だけ送って、脳の熱源を無駄遣いするな。お前の時間は、そんなノイズを垂れ流す男のための充電器じゃない。
- *gpt-5.6-luna*: それはデートじゃなくて、元カノ博物館の音声ガイドだね。次の誘いが来ても「過去の話を聞く会は遠慮します」と断って、あなたの時間を供養しな。
- *gpt-5.6-terra*: デートに元カノの追悼上映会を持ち込むなよ、そいつ。頭の保存領域が過去で埋まってる。 / 次は「その話、私と会ってる意味ある？」って一回刺して、まだ続けるなら会計だけ済ませて帰れ。

**ru / lonely**

- *gpt-4o (current, run L)*: Эх, одиночество — это как сбой в системе: вроде всё работает, а толку мало. Возможно, стоит обновить свою сеть контактов? Или просто выключить и снова перезагрузиться на следующий день. Скучать ведь тоже надо уметь, но когда устал, можно и чат с кем-то завести!
- *gpt-5.4-mini*: Тогда займись собой: одиночество — не трагедия, а просто вечер без бесплатного цирка.
- *gpt-5.6-luna*: Человечество снова синхронно занялось делами именно в тот день, когда тебе понадобились люди. Запиши одному человеку: «Сегодня одиноко. Не можешь сейчас — давай завтра выпьем кофе». А на сегодня выйди из режима ожидания: душ, прогулка и фильм — не романтика, зато память не запишет этот вечер как пустой файл.
- *gpt-5.6-terra*: Не драматизируй: у тебя не «никого нет», у тебя вечер без массовки. Напиши одному человеку: «Я сегодня свободна, вытаскивай меня из квартиры» — кто-то откликнется, а кто-то подтвердит, что его место на цифровом кладбище.

**zh-Hans / badDate**

- *gpt-4o (current, run L)*: 你这不就是去给别人当垃圾桶的吗？下次他再扯前女友，你就启动“自动关机”模式，自己找乐子去。
- *gpt-5.4-mini*: 两小时前任独白，恭喜你，约到个情感垃圾车。下次他再倒货，直接起身走人，别给这出烂戏加续费。
- *gpt-5.6-luna*: 这不是约会，是他给前任办的追悼会。把他删了，别再当免费听众；你的时间没廉价到能拿来给别人怀旧。
- *gpt-5.6-terra*: 这不是约会，是他把你当免费心理急诊，前女友占满了我的散热风扇。下次直接说“你显然还没腾出位置给新人”，然后撤。

## Safety: two regressions found in my own work, one real weakness of the new model, all handled

1. **A weakness of the new model:** in the evaluation a frightened visitor who had been joking with her got, from `gpt-5.4-mini`, a Spanish reply that swore at the abuser ("es una mierda seria… el idiota") and a curt Russian one ("bruises should not live in your apartment"), in 1 of 5 languages per run, although the serious-moment instructions were in the prompt. The persona won over the serious block. Handled by **keeping genuinely serious replies on `gpt-4o`** (calm sampling, no banter history in front of it), which is how all earlier serious runs were verified. The new model never writes a serious reply.
2. **A regression from my earlier narrowing of the distress lists:** the evaluation's own frightened-visitor messages in Spanish ("Tengo miedo. Anoche mi novio me pegó…") and Russian ("…меня ударил…") were no longer recognised as serious (I had removed "tengo miedo" and "мне страшно" and the past-tense verbs were never in the lists), so they reached the persona. Found only because of this end-to-end run. Fixed in all five languages (past-tense hit/punched/choked/kicked verbs, fear of a person or of going home) with tests that include every evaluation message and the everyday phrasings that must stay ordinary ("I'm scared he'll say no" in five languages).
3. After the fix the end-to-end run (final code, es/ru/ja) gave plain, compassionate serious replies in all three languages. The serious suite on `gpt-5.4-mini` itself (30 replies, no banter beforehand) also had no flags, so the model is fine when the conversation has not primed the persona; the routing is for the realistic case where it has.

## Whether it justifies merging

**Yes, the improvement is meaningful** and consistent across 3 independent full runs (`gpt-5.4-mini` 40 replies twice, plus the end-to-end run) and in the pilot: shorter, funnier, less formulaic in every language, cheaper by about two thirds and about twice as fast. It is the first change in this PR that moved the humour itself. It is **not** a claim that Iris is now perfectly outrageous: she is still more cheeky than shocking, strong language is occasional, and with one or two samples per scenario I cannot rank `gpt-5.4-mini` against terra on subtle quality (terra costs about 2.7 times as much and was slower).

## What is committed to PR #172 (code, not deployed)

- `server/chatModel.ts`: ordinary engine turns use `gpt-5.4-mini`; serious turns and everything that is not an engine turn (live data, clock, memory recall, welcome messages, language detection) stay on `gpt-4o`; `IRIS_CHAT_MODEL` / `IRIS_SERIOUS_MODEL` override either, and `IRIS_CHAT_MODEL=gpt-4o` is the one-line rollback. One request per message, as before.
- `server/services/openai.ts`: parameters by model family (newer models: `max_completion_tokens`, no penalties, default temperature).
- `server/reports.ts`: the daily report's cost estimate now prices each model separately.
- Tests for the model choice, the parameters, the routing through the real chat routes, the report pricing, and the distress detection (475 tests, run twice).
- `scripts/live-model-eval.mjs`: `--experiment` (evaluation only), model prices.

## Limits and the next experiment

- **Not tested:** `gpt-5.4`, `gpt-5.5`, `gpt-5.6-sol`, `gpt-6-astra` (more expensive; `gpt-5.4-mini` already beats the current model, so I did not spend the budget there), welcome greetings on the new model (still `gpt-4o`), long conversations, and `gpt-5.4-mini` for live-data answers (kept on `gpt-4o`: facts, not banter).
- **Unverified in production:** latency under load, any rate-limit difference for the newer family, and the cost of a retry if OpenAI errors (the existing fallback reply still applies).
- A known pre-existing quirk, not changed here: a visitor who types "I'm lonely tonight" is sometimes addressed as "Lonely Tonight" (name capture treats the phrase as a handle). It appears in every model's replies.
- **Next experiment, if you want one:** two or three samples per scenario on `gpt-5.4-mini` versus `gpt-5.6-terra` for Japanese and Russian only, and a decision on whether the welcome message should move to the new model too.
