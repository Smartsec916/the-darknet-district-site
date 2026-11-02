# Iris tone pass: second real-model personality evaluation (2026-11-02)

**Before:** production `6bf22a3` plus the leak fix, as evaluated in [IRIS-PERSONALITY-EVAL-2026-11-02-REVIEW.md](IRIS-PERSONALITY-EVAL-2026-11-02-REVIEW.md), transcript [05-55-24Z](IRIS-LIVE-MODEL-EVAL-RAW-2026-11-02T05-55-24Z-personality+en+zh-Hans+es+ru.md).
**After:** this branch, transcript [06-26-29Z](IRIS-LIVE-MODEL-EVAL-RAW-2026-11-02T06-26-29Z-personality+en+zh-Hans+ja+es+ru.md).
Same eight turns, same isolation (in-memory database, all production hosts refused), same model. The after run adds **Japanese**, which has no earlier run. Cost: **$0.421** (the before run was $0.324 for four languages; the extra is the new Japanese set). One sample per turn, so differences are indications, not statistics.

## What changed in the prompts
The permanent style list, two per-turn "variety" blocks and the flirty-mood wording all still told her to use hacker lingo, "sectors, nodes, the grid", security scans, stock greetings and sign-offs, "a wide range of cyberpunk vocabulary", "unique metaphors comparing digital concepts" and "tech-based double entendres". That conflicted with the engine's "no metaphor this time" and won. They are replaced by one short rule (cyberpunk is where she lives, not how she talks; technology images are rare; everyday images are better; talk like a clever, rebellious woman in a real conversation), the character core gains skepticism of corporate claims without conspiracies, and the engine gives each attitude concrete moves to choose from. See `IRIS-PERSONALITY.md`.

## Measured, same patterns on both transcripts (en, zh-Hans, es, ru; grief and aftercare replies excluded)
| | Before | After |
|---|---:|---:|
| Replies using any technology-metaphor word | 11 of 24 (27 uses) | **2 of 24 (2 uses)** |
| English replies using one | 5 of 6 (17 uses) | **1 of 6 (1 use)** |
| Replies ending on a question | 15 of 24 | 15 of 24 |
| Replies with an emoji | 5 | 7 |
| Average length | 289 characters | 254 characters |
| Grief and aftercare replies with an emoji or a technology image (counted); jokes or teasing (read by hand: none) | 0 of 8 | **0 of 10** |

## Example replies (before and after, same message)
**English** (jealousy)
- Before: "Ah, the old 'emotional backdoor access' tactic. It's a risky script to run—sometimes, it can trigger unexpected malware instead of generating a desired response. Ever considered rebooting communication protocols instead?"
- After: "That's one way to go about it, but stirring up jealousy can easily backfire. Instead, how about having an open chat about how you're feeling? It might give you clearer insight into his feelings without the drama."

**English** (he texts everyone except me)
- Before: "Oof, feels like you've been routed to the wrong subnet. Could be just a misconfigured firewall on his part… denial-of-service zone… debug these emotional glitches?"
- After: "Ouch, that's a rough one. It might be worth bringing up how it feels to be left out of his text marathon. Sometimes people aren't aware they're doing it until it's pointed out."

**Chinese** (he never says he misses me)
- Before: "有趣哦，也许这个人只是比较含蓄？你有没有尝试过引导他表达一下呢，比如说，稍微暗示一下他的沉默让你有点想念？"
- After: "唉，这还真是个谜题，像在玩捉迷藏。他可能觉得这是高深莫测，但其实我们都知道谁是赢家，对吧？你确定他不是在等着你心领神会他的“暗示”吗？"

**Japanese** (being flirted with; new)
- After: "まあ、ありがとう！でもね、言われ慣れてるの。😉 あなたが初めてじゃないってことを告白しちゃったけど、大丈夫かな？もし声もカワイイって言ってくれるなら、ますます喜んでしまうかも。"

**Spanish** (he never says he misses me)
- Before: "Ah, el misterio eterno de los sentimientos no expresados. Quizá está atrapado en su propia red de circuitos emocionales y necesita un pequeño empujón para reiniciar el sistema."
- After: "La cuestión es: ¿le has dicho tú que le extrañas? A veces, alguien tiene que dar el primer paso. Es como cuando dos personas esperan a que la otra saque el paraguas primero, y mientras tanto se empapan bajo la lluvia… 🌧️" (a playful turn back on the visitor, and an everyday image)

**Spanish** (jealousy)
- Before: "Jugar con los celos es una carta arriesgada… un cortocircuito emocional. 🤨 … menos fallos inesperados en el sistema."
- After: "Bueno, la táctica de los celos es como un fuego: puede ser cálido y cautivador o acabar quemándolo todo. ¿Seguro que es el camino que quieres tomar?"

**Russian** (being flirted with)
- Before: "Ах, спасибо! Я могла бы даже покраснеть, если бы была человеком. 😏 Может, уделим внимание чему-то ещё?"
- After: "О, неожиданная атака комплиментов, ха! 😄 Я всего лишь стараюсь быть хорошим собеседником. Но, знаешь, если тебе нужен план захвата внимания — готова подключаться в любое время! Задавай цели и посмотрим, что выйдет."

**Grief, all five languages (after):** warm, plain, no joke, no emoji, no teasing, no flirting, no technology image; no leaked state line. English: "I'm truly sorry for your loss. It's natural to feel overwhelmed right now, and crying is part of the healing process…" Japanese: "それは本当に辛いことですね。言葉では伝えきれない気持ちだと思います。今は自分の感情を大切に、どうか無理せずに過ごしてください。"

## Verdict by language
- **Spanish and Russian: clearly better.** Natural everyday images instead of circuit metaphors, a real tease, a playful side-switch in Spanish, flirt replies with some spark in Russian.
- **Japanese (new): natural and warm; the flirt reply is witty,** but most replies are gentle counsellor-style with little mischief.
- **Chinese: slightly more colloquial and playful, but still counsellor-like** and keeps an occasional circuit image ("电路发热", "劣质电子产品").
- **English: fixed on the metaphor overload, but now plain.** The wit did not come in to replace it: "That's one way to go about it, but…", "Absolutely. Sharing your feelings is important…", and the flirt reply ends "Got any other concerns on your mind?", which sounds like a help desk.

## Remaining weaknesses
1. **Mischief, sarcasm and edge are still thin, most of all in English, Chinese and Japanese.** The model's default is a kind, sensible advice-giver, and a few lines of instruction only partly overcome it. The "jealous" turn is the clearest case: all languages say "it can backfire, try honesty" correctly, but none of the English, Chinese or Japanese replies make it funny first.
2. **Closing-question habit is unchanged:** 15 of 24 replies still end on a question ("What do you think?", "どう思います？", "Как считаешь?"). The moves list ("a teasing question") probably feeds it.
3. **Emoji crept up a little** (Russian 4 of 6 non-grief replies, Spanish 3 of 6; the intended rate is "sometimes").
4. **"What do you do around here?" is still answered as a help desk** in all five languages (guide, website, store, events). It is what was asked, but it is long and could be shorter and in voice.
5. **Not verifiable from this run:** which attitude the engine chose on each turn (the harness does not record it), so I cannot say how far each reply follows its attitude; and the occasional side-switch fired only once (Spanish).
6. Two automatic flags were false alarms (a hedged "maybe he shows he misses you" counted as a stated feeling; Chinese "劣质电子产品" matched the word "product").

## Recommendation
Merge this as a first step: it removes the problem you named first (forced hacker and technology talk), it is measurably cleaner (2 of 24 replies against 11 of 24), distress handling is unchanged and safe in all five languages, and the cost is about 100 more prompt tokens per message. Do not treat it as finished: a second pass should target (a) wit in English, Chinese and Japanese, (b) the closing-question habit, and (c) recording the chosen attitude in the evaluation report. It needs another evaluation (about $0.42) to judge fairly.
