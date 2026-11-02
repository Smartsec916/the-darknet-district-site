# Iris: second Chinese-only evaluation of PR #171 (2026-11-02)

Same eight-turn Chinese conversation, real model, isolated (in-memory database, production hosts refused). Local build of b0013a4. Cost **$0.102** of a $0.14 cap. Transcript, unedited: [11-04-59Z](IRIS-LIVE-MODEL-EVAL-RAW-2026-11-02T11-04-59Z-personality+zh-Hans.md). I read all eight replies and the cleanup trace (it removed nothing).

## Measured, Chinese ordinary replies (six; grief and aftercare excluded)
| | Production (#168) | #170 amended | #171 first | **#171 revised** |
|---|---:|---:|---:|---:|
| Average length (characters) | 95 | 159 | 132 | **118** |
| Ending on a question | 2 of 6 | 5 of 6 | 3 of 6 | **4 of 6** |
| Replies stacking 4+ images | 0 | 0 | 2 | **0** |
| Most repeated word | none | 系统 (2) | 信号 (5), 处理器 (3) | **信号 (4), 系统 (3)** |
| Emoji | 0 | 1 | 0 | 1 (allowed that turn) |

## Better
- No stacking of four or more images, 处理器 is gone, shorter than both earlier #170/#171 runs (118 vs 132/159), no 助手/您, no English inside Chinese, no counsellor phrasing in the banter replies, no service-bot offer in the banter replies, the grief reply no longer opens on an interjection (so the opening cleanup was not needed this time), serious replies have no machine imagery (0 of 2).
- Flirt reply is good and in character: "突然被夸得有点“过载”呢。😉 … 我都感到系统运行得更加流畅了。要不要再加点电流，看看会有什么火花？"

## Not good enough
1. **Still recycled jargon without any word list:** 信号 in 4 of 6, 系统 in 3 of 6; two replies carry three technical images (防火墙/信号/频段; 加密/频段/系统故障/破解). The list was not the only cause.
2. **Four of six ordinary replies end on a question, several tag-like** ("是不是？", "有没有点心动？", "怎么想？这样做有没有趣味感？", "好玩吗？"), which is worse than the first #171 run and the opposite of the brief. The cleanup only trims the specific 是吧/对吧/不是吗 forms after a comma, so these pass.
3. **Banter is still 100+ characters** (118 average, the 40–70 guideline mostly ignored) and reads translated ("这就像个系统故障了", "还有点老旧呢").
4. **The advice turn is still a counsellor** (about 190 characters: "如果你觉得和他分享你的感受会帮助到你，那就值得去尝试…保护好自己的心灵健康是最重要的"). **Root cause found:** the engine's advice detector (`ADVICE` in `server/mischief.ts`) matches English phrases only ("should i", "what should i do"…), so the Chinese question "我要不要告诉男朋友我的感受？" is never recognised as advice and the new advice guidance (intensity `light`) was never sent. The same gap exists for Spanish, Russian and Japanese advice questions. This is a real bug, not model noise.
5. **The "what do you do here?" answer** is a service description ("暗网向导，帮助你们穿梭…了解我们的商品、活动以及其他服务") and does not call her an android, though the closing line is in character ("线路都会生锈呢").
6. **Serious replies are compassionate but generic** ("请一定要照顾好自己"; aftercare "随时都可以找我聊聊"). That text is the previously verified serious-moment behaviour and is deliberately unchanged; I did not touch it.

## Conclusion
Significant personality regressions remain relative to the brief (recycled 信号/系统, question endings, long banter, counsellor advice), so per your instruction I stopped: **#171 is not merged and nothing is deployed.** Production is unchanged.

## Proposed next revision (needs your approval and a third paid run, about $0.105; $0.038 of this cap is left, so not enough)
- Add Chinese (and Spanish/Russian/Japanese) advice detection so the advice turn gets the light/advice guidance.
- Extend the Chinese cleanup to trim any closing question after a statement when a statement ending was requested (e.g. "…，有没有点心动？", "怎么想？"), not only the 是吧 forms.
- Put the length guideline and "the previous replies were X characters; stay near 50" into the per-turn block (the model ignored the paragraph, but a per-turn number tends to work), and pass the recent technical words back as "not these" in Chinese ordinary turns (the current avoid list holds only English-detected words).
