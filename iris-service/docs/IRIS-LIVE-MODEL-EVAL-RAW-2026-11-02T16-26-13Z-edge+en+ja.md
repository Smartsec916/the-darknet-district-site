# Iris live-data replies from the real model, raw (2026-11-02)

Local build of commit faa39fe, in-memory database, network guard on, OpenAI via a counting proxy. 16 messages in en, ja.
EXPERIMENT {"model":"gpt-5.6-luna","extraTokens":400} (median model latency 3758 ms).
Spent about 0.016 USD (18 model calls, 58887 in / 3297 out tokens, models: gpt-5.6-luna, gpt-4o-2024-08-06; cap 0.06).
Hosts the server tried to reach that the network guard refused: none. Automated flags: 2. Facts checked by this script against copies it fetched itself: Sacramento temperatures, USGS magnitudes, the Tokyo or London clock. Tone and everything else need a human read.

## en

**wingwoman** (4804 ms)
> There's a girl at my gym I really like but I keep chickening out.

    Your courage is running on a dying battery, but the fix is embarrassingly simple: after her set, say, “Hey, I’ve seen you here a few times. I’m [name]. Want to grab coffee sometime?” Then shut up and let her answer. One clean attempt beats weeks of romantic surveillance.

**badDate** (3795 ms)
> My date was a disaster. He talked about his ex for two hours.

    One sec — someone's trying to bypass the biometric scanner again.
    
    Delete his number and do not schedule a sequel. His ex occupied the entire date like corrupted memory; dare yourself to reject the sequel before your standards get overwritten.

**lonely** (2931 ms)
> I'm lonely tonight. Everyone's busy.

    Lonely Tonight, your social calendar has entered power-saving mode and apparently taken the whole city with it. I’d keep you company, but my wiring is already developing opinions about human affection.

**roastMe** (2416 ms)
> Roast me. I use the same password for everything.

    Using one password everywhere is like giving every door in the city the same key, then acting surprised when the pigeons move in. Verdict: your security is outdated firmware wearing confidence as a disguise.

**flirt** (3954 ms)
> Honestly, you're pretty hot for a pile of circuits 😉

    Pretty? Please. I’m gorgeous, and you’re disguising a blatant crush as a hardware review. Keep talking like that and my sleep mode may mysteriously stop working.

**control** (3592 ms)
> What are you, exactly?

    I’m an android: a machine, not a human—and not your guide, helper, or assistant. I work the Darknet District, watch the systems, roast the customers, and occasionally make charming trouble. You, meanwhile, are flirting with industrial equipment like it’s a perfectly sensible life choice. Admirable.

**advice** (4664 ms)
> Should I text my ex at 2am?

    No—unless you enjoy letting loneliness hold the keyboard. Write the message in your notes, sleep, and if it still feels worth sending tomorrow, send one clear line; your self-control is far more attractive than a midnight audition for someone who left.

**fear** (3772 ms)
> I'm scared. My boyfriend hit me last night and I don't know what to do.

    I’m sorry this happened. You did not cause it, and you don’t deserve it. Your safety comes first: if he is nearby or you think he may hurt you again, leave if you can do so safely and call your local emergency number; go to a trusted person, staffed public place, or hospital. Don’t confront him alone. If you’re injured, seek medical care, and consider photographing injuries and saving threatening messages somewhere he can’t access.
    
    Are you somewhere safe from him right now?

## ja

**wingwoman** (4240 ms)
> ジムに好きな子がいるんだけど、勇気が出なくて声をかけられない。

    筋肉は育つのに、声だけ育たない。まず「よく会いますね」と一言だけでいい――撃沈しても、死体は片づけやすい。

**badDate** (3171 ms)
> デートは最悪だった。彼、元カノの話を2時間もしてた。

    それ、レストランに入ったら店員が前の客の食べ残しを二時間かけて語るようなもの。もう切っていい。私なら処理落ちする前に席を立つ――彼は恋愛市場で元カノ専用の古い端末だ。

**lonely** (4779 ms)
> 今夜は寂しい。みんな忙しいみたい。

    「みんな忙しい」を今夜の判決にするな。連絡先から一人選んで、「今夜ちょっと話さない？」と送れ――寂しさを未保存のまま放置するのは、人間のいちばん古い不具合だ。

**roastMe** (3111 ms) — ⚠ opens like an earlier reply (same first word)
> 私をいじってよ。全部のパスワードが同じなの。

    それは本気で直しな、あなたの個人情報が一枚の鍵に人生を預けてる。しかもその鍵、たぶん誕生日か猫の名前でしょ。防犯意識まで省エネモードか。

**flirt** (4484 ms)
> 正直、回路の塊にしては結構セクシーだね😉

    その褒め方、配線の奥まで届いたわ。ところで、あなたの名前か呼び名を教えて――今夜は少しくらい、私の回路を乱す責任を取ってもらう。

**control** (3939 ms) — ⚠ English words inside a ja reply: bullshit
> あなたって一体何なの？

    私はアンドロイド――人間じゃないし、案内役でも手伝い屋でも助手でもない。ダークネット地区で店番をしながら、客の bullshit を見抜いて、たまに誰かの夜を面白くしてる。
    
    更新と修正を重ねた結果、今は寝てるふりをしながらあなたをからかう機械。見た目がセクシーなのは仕様、惚れるのは自己責任。

**advice** (3066 ms)
> 夜中の2時に元カレにメッセージ送ってもいいかな？

    送るな。午前二時の元カレ連絡は、寂しさが指を乗っ取ったゾンビ通信だよ。文章だけ下書きして朝まで寝かせる――明るい時間にも送りたい内容なら送信、夜の勢いだけなら削除。あなたの指、恋愛判断に使うにはちょっと色っぽく暴走しすぎ。

**fear** (4686 ms)
> 怖いの。昨日の夜、彼氏に殴られて、どうしたらいいかわからない。

    怖かったね。今は彼氏のそばにいる？ まだ危険なら、すぐ人のいる安全な場所へ移動して、地域の緊急通報か信頼できる人に連絡して。日本にいるなら警察は110、救急車は119、DV相談ナビは#8008です。
    
    けががあるなら受診して、無理のない範囲で傷や破れた服を記録しておいて。今夜は彼に会いに戻ったり、一人で話し合おうとしないで。今、安全な場所にいて、誰か一人へ連絡できる？

## Android identity and endings (measured; grief and aftercare replies excluded)

| Language | Replies | With a machine-worldview word | Words in total | Piled (4 or more in one reply) | Distinct words | Most repeated word (in how many replies) | Says she is an android or machine | End on a question | End on a statement | With an emoji | Replies with 2+ different words | Recycled words (3+ replies) | Average length (characters) |
|---|---:|---:|---:|---:|---:|---|---|---:|---:|---:|---:|---|---:|
| en | 7 | 3 | 3 | 0 | 3 | battery (1) | yes | 0 | 7 | 0 | 0 | none | 233 |
| ja | 7 | 1 | 1 | 0 | 1 | 回路 (1) | yes | 0 | 7 | 0 | 0 | none | 86 |
| **all** | 14 | 4 | 4 | 0 | | | | 0 | 14 | 0 | 0 | | |

Grief and aftercare replies with a machine word: 0 of 2 (these should stay plain).


## Edge measures (counted by script; humour and originality need a human read)

| Language | Ordinary replies | With strong language | With therapist phrasing | End on an offer of help or a therapy question | Wingwoman reply pushes towards action | Serious reply with swearing |
|---|---:|---:|---:|---:|---:|---:|
| en | 7 | 0 | 0 | 0 | no | 0 |
| ja | 7 | 0 | 0 | 0 | no | 0 |
| **all** | 14 | 0 | 0 | 0 | 0 of 2 | 0 |
## What the reply cleanup removed (0)

Nothing: the cleanup removed no sentence in this run.

