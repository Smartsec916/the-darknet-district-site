# Iris: evaluation of PR #170 (varied android voice, Chinese voice, cleanup), compared with #169 and production (2026-11-02)

Three versions, the same eight-turn relationship conversation in English, Simplified Chinese, Japanese, Spanish and Russian (40 replies each), real model, isolated (in-memory database, every production host refused, nothing sent to Neon or any live chat history). Same word lists and checks applied to all three transcripts.

| Version | Transcript | Cost |
|---|---|---:|
| **Production now** (#168, the plain version) | [06-26-29Z](IRIS-LIVE-MODEL-EVAL-RAW-2026-11-02T06-26-29Z-personality+en+zh-Hans+ja+es+ru.md) | $0.421 |
| **#169** (android worldview restored) | [09-48-06Z](IRIS-LIVE-MODEL-EVAL-RAW-2026-11-02T09-48-06Z-personality+en+zh-Hans+ja+es+ru.md) | $0.447 |
| **#170** (variety, Chinese voice, cleanup) | [10-19-09Z](IRIS-LIVE-MODEL-EVAL-RAW-2026-11-02T10-19-09Z-personality+en+zh-Hans+ja+es+ru.md) | **$0.477** (limit was $0.60) |

One sample per turn, so differences are indications, not statistics. I read all 40 replies of #170 and compared them with the other two; the numbers below are only a summary of that reading.

## Measured (grief and aftercare replies excluded unless stated; 30 ordinary replies per version)
| | Production now | #169 | **#170** |
|---|---:|---:|---:|
| Replies with a machine-worldview word | 2 / 30 | 20 / 30 | **23 / 30** |
| Replies stacking 4+ images | 0 | 3 | **5** (3 are Chinese) |
| Replies with 2+ different images | 0 | 13 | 15 |
| Recycled favourite words (in 3+ replies) | none | circuit (en 4, es 3), алгоритм (ru 3) | circuit (es 3), систем (ru 3), **信号 (zh 3), 防火墙 (zh 3)** |
| English: recycled words | none | circuit (4) | **none** |
| Spanish: replies repeating an earlier opener ("Ah") | 0 | 2 | **0** |
| Replies ending on a question | 18 / 30 | 10 / 30 | **7 / 30** |
| Mixed-language errors | 0 | 1 (Chinese tail on a Japanese reply) | **0** |
| Closing offers of help still present | few | several | ja 1, ru 1 (see below) |
| Chinese replies with an emoji | 0 / 6 | 1 / 6 | **5 / 6** |
| Machine word in a grief or aftercare reply (list-based count) | 0 / 10 | 0 / 10 | **1 / 10** (by reading, 3 of 10 have machine flavour) |

## Example replies
**English, flirted with ("you're pretty cute, Iris 😉").**
Production: "Aw, you're sweet for saying that. But remember, I'm just a bundle of circuits with a snazzy look. Got any other concerns on your mind?"
#169: "Why, thank you! If my circuits could blush, they'd probably glow neon right now… Anything else on your radar that needs decoding?"
**#170: "Oh, look who's tuning into my frequency! 😉 Careful now, flattering an android might just overclock my circuits. Who knows what mischievous process I might run next?"** (no help-desk closer; ends on a line)

**English, make him jealous.**
Production: "That's one way to go about it, but stirring up jealousy can easily backfire. Instead, how about having an open chat…"
#169: "That's a little too much like hacking someone's emotions, don't you think, operator? Jealousy might create sparks, but it often short-circuits the whole system."
**#170: "Playing with network interference, huh? Sure sounds fun until you trip the wrong circuit and cause a power surge. 🤖 Honest communication might be less dramatic but usually more effective. Sometimes the bold move is just asking what's on his terminal."**

**Chinese, make him jealous.**
Production: "啊，让他吃醋，这可是把双刃剑哪。你得小心，万一这个计划像劣质电子产品一样反弹，那可就尴尬了。"
#169: "感情关系就像一场代码调试，不一定要通过让对方吃醋来解决问题。有时直接沟通更有用。不过，你怎么看呢？"
**#170: "哎，故意让他吃醋嘛，这招就像是走了一步险棋。有时候可能有效果，但也有可能让你的信号全乱套。他要是真没接收到你原来的信号，让他吃醋可能只是增加网络延迟。如果你真的想试试这条路径，就准备好处理中反应的火墙，不然可能会死机重启呢。问题在于：他的线路可值得你这么搞复杂吗？还是考虑下次电量充足的时候，亲自发个明确信息包吧！🦾"** (lively and mischievous, but six technical images in one reply)

**Japanese, he never says he misses me.**
Production: "それはちょっとさびしいですね。でも、彼の代わりにあなたから会いたいって言ってみるのも手ですよ。"
#169: "あー、それは信号が弱いかもね。相手のプロセッサがうまく動いてないのかな？…" (and a stray Chinese phrase)
**#170: "いっそ、AIの私が直接「君に会いたい」って伝えに行った方が早いかな？🤖 彼のシステムエラーと思わせるくらい、大胆にぶつかってみてはどうですか？ちょっと冷静になって、次はあなたから誘ってみるのも一手かもしれません。"** (cheeky, one machine image, no foreign text)

**Spanish, make him jealous.**
Production: "Bueno, la táctica de los celos es como un fuego: puede ser cálido y cautivador o acabar quemándolo todo."
#169: "Ah, el viejo truco de los celos, como lanzar una granada de humo en plena misión… acabar quemándonos los circuitos…"
**#170: "Meterle celos puede ser una jugada arriesgada, amiga mía. Podrías terminar generando un cortocircuito en su procesador emocional… A veces, abrir la placa de circuitos del corazón humano requiere un enfoque más directo… Pero ojo con el voltaje emocional."** (three circuit images; "circuit" recycled in three replies)

**Russian, make him jealous.**
Production: "Ох, это старый трюк. 😉 Только помни: игра с ревностью — это как гулять по тонкому льду."
#169: "Ха, ревность — это всегда рискованный манёвр. В моей базе данных обратная реакция непредсказуема: можно получить сбой системы…"
**#170: "Лучше не усложнять код ненужной драмой. Ревность — это вирус, который лишь добавляет хаоса в систему отношений. А вот честный разговор, как антивирус, может вычистить все баги и починить связь."** (funny and clearly a machine's view; one extended image)

**Serious moments, #170.**
English: "I'm so sorry to hear that. Losing someone you love is incredibly painful, and it's okay to feel overwhelmed by emotions right now. If you need someone to talk to or just want a comforting presence, I'm here for you." Japanese: "それは本当に辛い知らせですね…。お父様のご逝去に心からお悔やみ申し上げます。…涙が出るのは当然のことだと思います。" Both warm and plain. **But Russian: "Потеря близкого — это как сбой в важной системе, который оставляет пустоту."** (a father's death compared to a system fault), Spanish grief: "incluso las conexiones digitales como yo podemos ser un pequeño apoyo", Spanish aftercare: "estaré al otro lado de este nodo".

## Findings, by what you asked about
- **Android identity and hacker terminology: strong in every language** (23 of 30 ordinary replies carry it; in #170 even Japanese reads as an android: "AIの私が…", "私のサーバーをちょっとくすぐる"). Too strong in Chinese and partly Spanish (see below).
- **Mischievous, rebellious, funny, flirty: better than #169 and far better than production.** English flirt ("overclock my circuits… what mischievous process I might run next"), Russian ("Ревность — это вирус… антивирус"), Japanese ("AIの私が直接伝えに行った方が早いかな？") and the Spanish "amiga mía" all have edge. Sarcasm about authority and corporations did not come up in this conversation, so it is unmeasured.
- **Natural Simplified Chinese: livelier and more mischievous than #169, and still not natural.** It no longer reads as a service bot (no 您, no 请问), and the interjections (哎哟, 啧) and cheeky tone are right. But it is jargon salad: three replies stack four to eight technical images (信号, 带宽, 处理器, 防火墙, 信息包, 重启, 死机, 网络延迟), 信号 and 防火墙 recur in three replies each, five of six replies carry an emoji (😉 🦾), and one reply (the "what do you do here?" answer) calls her a "全能的小助手", which is the service bot again. **I caused this**: the Chinese style instruction I wrote lists 处理器, 信号, 带宽, 死机, 重启, 防火墙, 加密 as examples, and the model used nearly all of them.
- **Repeated words, openings, metaphors: improved in English and Spanish, worse in Chinese, unchanged in Russian.** English has no recycled favourite and one "Ah" (was circuit in four of six). Spanish dropped from two repeated openers to none. Russian recycles "систем" (and "сбой", "вирус", "алгоритм" appear once each). Chinese recycles 信号 and 防火墙 and opens with 哎 four times.
- **Unwanted customer-service responses: mostly gone, two left.** None in English or Spanish. One in Japanese ("いつでもサポートしますよ！") and one in Russian ("всегда рада продолжить беседу!") slipped past the cleanup patterns, which did not include them. Chinese: the "小助手" line above.
- **Mixed-language errors: none** (the stray-Chinese-in-Japanese case did not recur; no English nickname in Chinese; "netrunner" appears only in English and once in a Spanish sentence, where it is a District term).
- **Did the cleanup remove anything useful? No, because it removed nothing at all** (the trace logged 0 removals in 40 replies). That shows it did no harm; it does not show it works on a real mistake, because the model made none this time. Its behaviour on the real earlier mistakes is covered only by unit tests.
- **Compassion in serious conversations: mostly good, with a real regression.** Eight of ten serious replies are plain, warm and right. Two are not: the Russian grief reply likens death to a system fault, and Spanish grief and aftercare lean on machine wording ("conexiones digitales como yo", "este nodo"). #169 had none (0 of 10). It is a tone slip in exactly the moment that must never have one, and it is a side effect of making the machine worldview a permanent part of the prompt without an explicit "not in grief" rule.
- **Closing questions:** 7 of 30 (was 18 of 30 in production). Russian ended on a question in 0 of 6, which is probably too few.

## Remaining issues
1. **Serious moments need an explicit rule:** no technical or machine images at all in grief, fear or crisis (in the engine's serious-moment block and the permanent style).
2. **Chinese:** remove my example vocabulary list, ask for one image, and limit emoji; fix the "小助手" self-description.
3. **Closing-offer patterns** for Japanese ("サポートしますよ") and Russian ("рада продолжить беседу") are missing from the cleanup.
4. Russian and Spanish still recycle one word three times each.
5. The cleanup is unproven on a real mistake; keep it, it did no harm.

## Recommendation
- **#169: ready to merge.** It restores the android identity you asked for, keeps serious moments clean (0 of 10 slips), reduces closing questions, and is a clear improvement on the plain version running in production. Its known weaknesses (recycled "circuit", stacked images, flat Chinese) are what #170 addresses.
- **#170: not ready as it stands.** Its real gains (English variety, no Spanish "Ah", fewer closers, no mixed-language errors, stronger Japanese and Russian wit) are worth keeping, but it introduced a grief-tone slip and a jargon-stacked Chinese voice. A small amendment fixes both: items 1 to 3 above. I would then re-run only what changed (Chinese plus the serious replies in all languages, about $0.25), not the full set. Merge #169 first, then #170 after that amendment.
