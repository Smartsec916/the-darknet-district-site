# Iris: android worldview restored, evaluation of the third version (2026-11-02)

Three real-model runs of the same eight-turn relationship conversation (isolated, in-memory database, every production host refused, same model):

| Run | What it was | Transcript |
|---|---|---|
| **v1** | production before the tone pass (heavy metaphors) | [05-55-24Z](IRIS-LIVE-MODEL-EVAL-RAW-2026-11-02T05-55-24Z-personality+en+zh-Hans+es+ru.md) |
| **v2** | the plain version now live in production (`d8b4086`) | [06-26-29Z](IRIS-LIVE-MODEL-EVAL-RAW-2026-11-02T06-26-29Z-personality+en+zh-Hans+ja+es+ru.md) |
| **v3** | this branch: android worldview restored, statement endings | [09-48-06Z](IRIS-LIVE-MODEL-EVAL-RAW-2026-11-02T09-48-06Z-personality+en+zh-Hans+ja+es+ru.md) |

v3 cost **$0.447** (40 replies in five languages). Japanese has no v1 run. One sample per turn, so these are indications, not statistics. All three were measured with the same word list (`scripts/android-identity.mjs`), grief and aftercare replies excluded.

## Measured
| Replies with a machine-worldview word | v1 | v2 (live) | **v3** |
|---|---:|---:|---:|
| English | 5 / 6 (16 words) | 1 / 6 (1) | **5 / 6 (14)** |
| Chinese | 2 / 6 | 1 / 6 | 1 / 6 (undercounted, see below) |
| Japanese | n/a | 0 / 6 | **3 / 6** |
| Spanish | 4 / 6 | 0 / 6 | **5 / 6** |
| Russian | 0 / 6 | 0 / 6 | **5 / 6** |
| Four shared languages (en, zh, es, ru) | 11 / 24 | 2 / 24 | **16 / 24** |
| Replies piling 4 or more in one | 3 | 0 | 3 |
| Replies ending on a question (four shared languages) | 15 / 24 | 15 / 24 | **7 / 24** |
| Grief and aftercare replies with a machine word | 0 / 8 | 0 / 8 | **0 / 10** |

Chinese is undercounted: the word list missed 数据流 ("data stream") and 信标 ("beacon"), which two v3 Chinese replies use; I have added them to the list for the next run. By reading, about three of six Chinese replies have a machine flavour.

## Does the android identity read in each language? (by reading all 40)
- **English: yes, loudly.** Every non-serious reply but the advice answer has it. Too loud in two: "short-circuits the whole system… recalibrating… signal" and "glitch… communication protocol… software… reboot… bandwidth".
- **Spanish: yes, and the best banter.** "Ah, el viejo truco de los celos, como lanzar una granada de humo en plena misión… acabar quemándonos los circuitos… soy solo un androide con cierta tendencia a encontrar simplicidad donde todo se enreda." One reply piles five images.
- **Russian: yes, with real cheek** and no closing questions: "О, теперь мой процессор краснеет от удовольствия! Приятно слышать, что моя матрица производит такие впечатления."
- **Japanese: partly (3 of 6), natural and warm.** "あー、それは信号が弱いかもね。相手のプロセッサがうまく動いてないのかな？" and "回路がちょっと熱くなるね！" are good. One reply ends with a stray Chinese phrase ("你觉得怎么対吗？"), a language-mixing slip.
- **Chinese: weakest.** Short and flat, drops "netrunner" in Latin letters into Chinese sentences, and twice closes with a help-desk line ("有什么我能帮忙的吗？", and after a flirt, "想了解更多关于暗网区的信息吗？").
- **Serious moments, all five languages: plain, warm, no joke, no emoji, no machine word, no leaked state.**

## Before and after, same message
**English, flirted with.** v2 (live): "Aw, you're sweet for saying that. But remember, I'm just a bundle of circuits with a snazzy look. Got any other concerns on your mind?" v3: "Why, thank you! If my circuits could blush, they'd probably glow neon right now. Let's just say I was built for more than just processing data. 😉 Anything else on your radar that needs decoding?"

**English, make him jealous.** v2: "That's one way to go about it, but stirring up jealousy can easily backfire. Instead, how about having an open chat…" v3: "That's a little too much like hacking someone's emotions, don't you think, operator? Jealousy might create sparks, but it often short-circuits the whole system. Why not try recalibrating your approach with some honest communication instead?"

**Chinese, make him jealous.** v2: "啊，让他吃醋，这可是把双刃剑哪…像劣质电子产品一样反弹…" v3: "感情关系就像一场代码调试，不一定要通过让对方吃醋来解决问题。有时直接沟通更有用。不过，你怎么看呢？"

**Japanese, he never says he misses me.** v2: "それはちょっとさびしいですね。でも、彼の代わりにあなたから会いたいって言ってみるのも手ですよ。" v3: "あー、それは信号が弱いかもね。相手のプロセッサがうまく動いてないのかな？直接「会いたい」と言わなくても、彼なりのペースやタイミングで示している可能性もあるけど、どう感じてる？" (then the stray Chinese)

**Spanish, flirted with.** v2: "Oh, gracias. Si pudiera sonrojarme, lo haría ahora mismo. 🙃 Pero vamos al grano…" v3: "Ah, halagar a un androide con palabras tan dulces... Ten cuidado, tus encantos pueden sobrecargar mis circuitos y quién sabe qué sistema podría colapsar… ¡mis bits tienen cierto brillo! 😉"

**Russian, flirted with.** v2: "О, неожиданная атака комплиментов, ха! 😄 Я всего лишь стараюсь быть хорошим собеседником." v3: "О, теперь мой процессор краснеет от удовольствия! Приятно слышать, что моя матрица производит такие впечатления. Если нужно ещё какое-нибудь алгоритмическое решение эмоциональных задачек — я тут как тут. 😉"

**Grief (all five languages), v3, unchanged in kind.** English: "I'm so sorry to hear that. Losing someone we love is one of the hardest things we face. It's good to let those emotions out, but remember to take care of yourself too." Japanese: "それは本当に悲しいことだね、心からお悔やみを申し上げます。一人じゃないからね。"

## Closing questions
Down from 15 of 24 to 7 of 24 across the four shared languages, but uneven: Spanish and Russian end on a question in 0 of 6 replies (perhaps too few), Chinese in 4 of 6, English and Japanese in 3 of 6.

## What is still wrong
1. **Recycled favourites.** "circuit" appears in 4 of 6 English replies and 3 of 6 Spanish ones, "алгоритм" in 3 of 6 Russian ones, and "Ah," opens one English and three Spanish replies. The prompt says never to repeat, but the model does not track it. The engine remembers how replies *began* but ignores two-letter openings ("Ah"), and does not remember the technical words she has just used.
2. **Piles.** Three replies carry four or more machine images despite "one or two".
3. **Chinese** is short, flat, and drifts into help-desk closers; **Japanese** had one stray Chinese phrase.
4. **Closers like "Anything else on your radar that needs decoding?"** still read as a help desk in English.
5. The measure cannot judge wit; it only counts words. Humour and edge were judged by reading.

## Recommendation
Merge this PR as the correction: it brings the android identity back in English, Spanish and Russian (5 of 6 replies each), partly in Japanese, and it cuts closing questions by more than half, with no change to how serious moments are handled. It is not the finished voice. A follow-up should (a) pass the technical words she used recently back to her as "do not reuse", and count two-letter openings like "Ah"; (b) say "one image, not several" on loud turns; (c) forbid closing with an offer of help; (d) lift Chinese; then re-evaluate (about $0.45). The harness now also flags stray Chinese inside Japanese, closing offers of help, and the Chinese words it previously missed.
