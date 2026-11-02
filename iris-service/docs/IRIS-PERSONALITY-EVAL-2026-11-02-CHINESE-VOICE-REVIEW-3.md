# Iris: third Chinese-only evaluation of PR #171 (2026-11-02)

Same eight-turn Chinese conversation, real model, isolated. Build 23dbd44. Cost **$0.098** of a $0.12 cap. Transcript: [11-15-24Z](IRIS-LIVE-MODEL-EVAL-RAW-2026-11-02T11-15-24Z-personality+zh-Hans.md). I read all eight replies and the cleanup trace.

| Chinese ordinary replies (six) | Production | #171 first | #171 second | **#171 third** |
|---|---:|---:|---:|---:|
| Average length (characters) | 95 | 132 | 118 | **76** |
| Ending on a question | 2 | 3 | 4 | **3** |
| Most repeated technical word | none | 信号 (5) | 信号 (4) | **代码 (2); nothing recycled** |
| Replies with 3+ technical images | 0 | 2 | 2 | **2** |
| Emoji | 0 | 0 | 1 | 0 (one removed) |

## Root causes found
- Recent-word tracking works (checked in a simulation: 信号, 防火墙 were handed back), but the model ignores a prohibition and its own earlier replies keep priming it. Replaced for Chinese with a rotation that gives the model one part of her nature to draw from each time. Result: no recycled word this run.
- The advice detector was English-only. Fixed for Chinese, Spanish, Russian, Japanese, with tests including the failing question. In this run the advice question did reach the advice turn.

## What worked
- Length 118 to 76 characters without truncation; no recycling; missYou is a good reply in voice ("谁需要一个迟钝的程序员"); the cleanup removed a trailing "，对吧？" tag question and a disallowed emoji, nothing else; serious replies have no machine imagery and no jokes.

## What did not
1. **Flirt reply ends with a service offer** ("有什么需要我这个网络节点帮忙的吗？") and is flat. The cleanup missed it (my pattern allowed 8 characters between 有什么 and 帮忙; this had 11). Pattern widened to 16 and a test added after the run; not re-evaluated.
2. **Advice reply is still gentle-counsellor** ("分享感受有时候能让你不那么孤单… 现在最重要的是照顾好自己的情绪"), short but with no wit, even though the advice turn now gets the advice-voice line.
3. **Role answer does not say she is an android** ("全能的黑客帮手，一个半虚拟的导游…"), and ends on "你觉得够酷吗？". The new role line was in the prompt; the model did not follow it.
4. Two replies still carry three technical images (防火墙/算法/代码; 死循环/系统/重启/网络节点).
5. Serious replies are warm but a little generic ("我感受到了你的痛苦"); that text is the verified behaviour and was not touched.

## Conclusion
Clear improvement over the previous two #171 runs on length and recycling, but the advice voice, the role answer and the stacked-image replies are not fixed, and the flirt reply closes with an offer. Per your instruction I have **not merged or deployed**; production is unchanged. $0.022 of the cap remains, which is not enough for another run.
