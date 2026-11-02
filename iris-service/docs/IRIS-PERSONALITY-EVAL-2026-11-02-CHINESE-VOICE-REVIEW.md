# Iris: Chinese-only evaluation of PR #171 (2026-11-02)

The same eight-turn conversation in Simplified Chinese, real model, isolated (in-memory database, every production host refused, nothing sent to Neon or any live chat history). Cost **$0.103** of a $0.14 cap. Transcript, unedited: [10-54-41Z](IRIS-LIVE-MODEL-EVAL-RAW-2026-11-02T10-54-41Z-personality+zh-Hans.md). I read all eight replies.

## Measured, Chinese ordinary replies (six per version; grief and aftercare excluded)
| | Production (#168, plain) | #169 | #170 first | #170 amended | **#171** |
|---|---:|---:|---:|---:|---:|
| Average length (characters) | 95 | 84 | 135 | 159 | **132** |
| Ending on a question | 2 of 6 | 4 of 6 | 2 of 6 | 5 of 6 | **3 of 6** |
| Replies stacking 4+ technical images | 0 | 0 | 3 | 0 | **2** |
| Replies carrying a technical word | 1 | 2 | 6 | 4 | **5** |
| Most repeated word | none | none | 信号, 防火墙 (3 each) | 系统 (2) | **信号 in 5 of 6, 处理器 in 3** |
| Emoji | 0 | 1 | 5 | 1 | 0 (one removed by the cleanup) |

## What worked
- **More edge and a clearer android.** Dares and challenges ("来个大胆挑战？试着反过来说看看他咋反应！", "敢来试一试吗？"), self-reference as a machine ("作为一个拥有高级处理器的我，可以告诉你…"), and the best flirt reply so far: "嘿，频率接通得正好，我的处理器有点过热哦～ 你知道的，电子心也是会跳动的！"
- **Shorter than the amended version** (132 against 159 characters) and **fewer closing questions** (3 of 6 against 5 of 6). No counsellor phrases in the banter replies, no 您 or 助手, no English nickname inside Chinese.
- **The cleanup did no harm.** It removed exactly one thing in the eight replies: the 😉 from the flirt reply, which the engine had not allowed that turn. No sentence was cut.
- **Serious moments stay compassionate and plain.** Grief: "我很抱歉听到这个消息。失去父亲对你来说一定非常艰难…我在这儿陪着你…" Aftercare: "任何时候你需要，我都会在这里。请你对自己好一点…" No joke, no emoji, no machine word (0 of 2). Minor: the grief reply opens with a breezy "哎呀", slightly light for the moment.

## What did not work (regressions and misses)
1. **Technical stacking and recycling are back.** The "jealous" reply strings together 处理器, 高风险测试程序, 系统崩溃, 数据损坏 and 系统警报; the "texts everyone" reply runs 信号, 断链, 操作系统, 重置, 感应雷达, 虚拟线路, 频率 and 交流节点; 信号 is in five of six replies and 处理器 in three. The amended version had no stacked reply, so this is a step back on something already fixed.
2. **Still too long for banter:** four of six ordinary replies run 111 to 154 characters; the target was short and punchy.
3. **Unnatural Chinese phrasing.** "这就像一台机器不开关键指令就正常运转一样荒唐嘛" (meaningless), "感应雷达" (odd), "出其不意的小建议" and "更了解你这个“神秘信号”的发出者呢" (awkward, translated-sounding).
4. **One service-bot offer survives:** "不然我这边还能提供些出其不意的小建议来打破僵局，你要听吗？" offers a service and asks "want to hear it?" The cleanup patterns do not cover that wording.
5. **The advice reply is a counsellor again** ("分享自己的感受是建立信任和理解的重要部分… 听从自己的内心感受哦"): 111 characters of earnest advice with no wit. It is the turn where the engine asks her to give practical advice first, and the Chinese banter guidance does not seem to carry over.
6. The "what do you do here?" answer says "全能的节点管理者…流浪黑客" (three technical images) and does not call her an android.

## Likely cause of the stacking
Two lists of example machine words are still in the Chinese prompt: the shared "machine side" line (which every language gets) names "processors, signals, circuitry, sensors, encryption, systems", and my Chinese guidance names "processor, battery, sensors or firewall". The model reads 信号 and 处理器 straight out of them. This is the same mistake I made before with the long vocabulary list: any list of examples is used as a menu.

## Recommendation
Do not merge or deploy #171 as it stands: its jargon stacking and recycling is a regression on a problem already fixed, and its main goal (short, punchy) is only partly met. A small revision would:
- drop both example lists for Chinese (say "one image, from her own body or workings, a different one each time") and make the Chinese "plenty of replies with none" explicit;
- give a concrete length target (a casual reply is usually under about 70 characters) and apply the same punchy rules to the advice turn;
- extend the cleanup for "…还能提供…你要听吗？" style offers;
- keep the serious-moment guidance exactly as it is (it is pinned by the fingerprint test).
A second Chinese-only run would cost about $0.105.
