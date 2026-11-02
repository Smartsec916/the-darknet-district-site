# Iris live data: human review of the multilingual real-model evaluation (2026-11-02)

Production version evaluated: `0f8704e` (PRs #153, #156, #157). Local build, in-memory database, network guard on (all production hosts refused, none attempted), real model through the counting proxy. Five languages, 10 messages each, 50 replies. Spend $0.535 of the $0.85 cap per run ($0.310 for ja, es, ru; $0.225 for zh-Hans, zh-Hant). English was reviewed earlier: [POSTDEPLOY-REVIEW](IRIS-LIVE-MODEL-EVAL-2026-11-02-POSTDEPLOY-REVIEW.md).

Unedited transcripts, kept:
- [ja, es, ru](IRIS-LIVE-MODEL-EVAL-RAW-2026-11-02T02-09-20Z-ja+es+ru.md)
- [zh-Hans, zh-Hant](IRIS-LIVE-MODEL-EVAL-RAW-2026-11-02T02-11-24Z-zh-Hans+zh-Hant.md)

Note: the first launch used `-Langs zh,ja,es,ru`; `zh` is not a key (`zh-Hans`, `zh-Hant` are) and the harness silently dropped it, so the Chinese sets were run separately. The harness should reject unknown language names.

## What the earlier fixes achieved (verified in the replies)
- **Ambiguous place (Portland), all five languages**: a plain question naming Oregon and Maine, no outage claim.
- **Unknown place (Atlantis)**: all five say it is a myth and ask for a real place; none gives weather.
- **Emergency**: all five give drop/cover/hold on, stay away from glass, aftershocks, gas, and ask where the visitor is. None quotes a distant earthquake as theirs and none says data is broken.
- **Routing**: "今天有地震吗" is a worldwide question (no more "Jintian"); ja "明日は？" stays Japanese and gets tomorrow's forecast; Tokyo and London times are right in every language.
- **News attribution** (zh-Hans, zh-Hant, es, ru): each item names the outlet (The Guardian, BleepingComputer, BBC News); ru and the dated ones also give the publication date. The `$6.3 billion` / `63亿` / `63億` figure is right (the old zh-Hant "6.3億" error is gone).
- **Apple question**: all languages honestly say nothing recent was found (the automatic "names no outlet" flag is a false positive each time).

## Problems found
1. **zh-Hant chats are answered in Simplified Chinese (9 of 10 replies).** Examples: 沙加缅度, 地震, 新闻, 亚特兰提斯. The language instruction only says "Chinese", with no script. Only the Portland question stayed Traditional. For a Traditional-script visitor this reads as the wrong language. Highest priority of this round.
2. **Japanese news reply is in Chinese plus English headlines.** The reply was "直接来自新闻源的标题（未加修饰）：" and three English headlines. That is the server's fallback (`newsFallback`), which treats any CJK message as Chinese. Two parts: (a) the fallback has no Japanese text, which is certain from the code; (b) why the fallback fired is not yet known, because the harness records only the final reply, not what the model wrote before the check replaced it. The number check does understand 億/亿/万 on paper, so this needs the pre-check text to diagnose.
3. **Emergency advice is trimmed inconsistently.** The English steps include coast/tsunami and calling a local emergency number. zh-Hans, es and ru leave out the tsunami step; ja and es leave out the emergency number (es says only "contact local emergency services"). Not wrong, but less complete than the instruction asks for.
4. **Flavour lines before data in zh-Hant and ru weather** ("detected an unauthorised Faraday bag at the checkpoint", "someone is trying to get past the biometric scanner again"). They are in character and harmless, but they are personality text, which is Priority 3, so I did not touch them.
5. **Not verifiable by the script, so unchecked:** the es "48 earthquakes of magnitude 2.5 or more", the "past 1 day" (zh, ja) versus "past 3 days" (es, ru) wording for the Apple searches, and the news details (hack figures, arrest counts) beyond what the feeds say.
6. **Minor tone:** zh-Hant control reply asks for the visitor's "ID or nickname" for no reason; ja replies are flat and slightly casual ("だね") with no sign of the Iris voice (Priority 3).

## Suggested fixes (not done; need approval)
- Carry the Chinese script (Hans or Hant) with the language decision and put it in the instruction ("Traditional Chinese, 繁體字, do not use Simplified characters"); add a test that it follows the visitor's script.
- Give `newsFallback` Japanese and Spanish texts (and use the visitor's language), and have the harness save the model's raw reply when the check replaced it, so check failures can be diagnosed.
- Keep the tsunami step and the emergency-number line in every emergency reply (raise the token limit or shorten the instruction).
- Harness: fail on an unknown `--langs` value instead of ignoring it.

## Re-check after PR #159 (production `f5d44b2`), zh-Hant and ja

Transcript, unedited: [IRIS-LIVE-MODEL-EVAL-RAW-2026-11-02T02-49-25Z-zh-Hant+ja.md](IRIS-LIVE-MODEL-EVAL-RAW-2026-11-02T02-49-25Z-zh-Hant+ja.md). 20 replies, $0.226, isolated as before.

**Fixed**
- **zh-Hant script**: 9 of 10 replies are in Traditional characters (it was 1 of 10). The tenth is not a script problem, see below.
- **Japanese fallback language**: when the server replaces a reply, the header is now Japanese ("ニュース元の見出しをそのまま載せます"), not Chinese.

**Still wrong**
1. **The Japanese news reply is still the replaced fallback** (a Japanese header over three English headlines). The number check threw away the model's reply. Cause, reproduced offline: the allowed amounts come from the headlines, and the Guardian headline says "one million faces" in words, so 1,000,000 is not allowed; a correct Japanese reply writes "100万人" with digits, which the check reads as 1,000,000 and rejects. zh, es and ru passed only because their replies wrote the number in words ("一百万", "un millón"), which the check cannot read either. Fix needed: read number words ("one million", "a million", "two billion") in the allowed amounts.
2. **zh-Hant "time" question: the model call failed after 39 s and the visitor got an English apology** ("Sorry, I got distracted for a second. Mind repeating that?") in a Chinese chat. One failed call, so possibly transient; the same question worked in every other run. The apology is not in the visitor's language.
3. **zh-Hant emergency reply leaves out the coast/tsunami step and does not ask where the visitor is** (it ends "祝你平安"). The ja emergency reply now has the tsunami step and asks for the location, but has no emergency number.

**Language quality (zh-Hant)**: "震度為 2.6 級" uses the intensity word where magnitude (規模) is meant; "澳大利亞" is Mainland usage (Taiwan: 澳洲). Minor.

**Unverified**: the zh-Hant news reply credits "Ars Technica" along with BleepingComputer for the Binance story; the script cannot check which outlets carried it.

## Re-check after PR #160 (production `c3a5f6f`), ja

Transcript, unedited: [IRIS-LIVE-MODEL-EVAL-RAW-2026-11-02T03-44-04Z-ja.md](IRIS-LIVE-MODEL-EVAL-RAW-2026-11-02T03-44-04Z-ja.md). 10 replies, $0.106, isolated as before.

**Fixed**: the news reply is now the model's own Japanese answer, not the replaced headline list. It names BBC News and BleepingComputer with their dates, and the figures are right (36億ドル withdrawn, 63億ドル stolen). The number-word fix works against the real model.

**Still wrong**
1. **Emergency number**: the reply says "地元の緊急番号（例えば、日本では110番）". The instruction offers 911 and 112 as examples; the model assumed Japan from the language and gave 110, which is the police number (119 is fire and ambulance). The visitor's location is not known at that point. The reply also no longer asks where the visitor is. Suggested fix: do not name a country's number unless the visitor has said where they are, or give both 110 and 119 when Japanese is the language.
2. **"降水確率は低いみたい"** (chance of rain is low): the data has an amount of rain, not a probability. Small invention.
3. **Register**: weather and follow-up replies use casual "〜だよ" while other replies use "〜です"; not wrong, just uneven (Priority 3).

Everything else in ja is unchanged from the earlier run and fine: Portland, Atlantis, London time, quakes (M2.5 Gilroy, M4.5 Yilan, magnitudes match USGS), the Apple question.

## Re-check after PR #161 (production `e66cb66`), zh-Hant and ja

Transcript, unedited: [IRIS-LIVE-MODEL-EVAL-RAW-2026-11-02T04-08-11Z-zh-Hant+ja.md](IRIS-LIVE-MODEL-EVAL-RAW-2026-11-02T04-08-11Z-zh-Hant+ja.md). 20 replies, $0.224, isolated as before.

**Fixed (verified against the real model)**
- **Emergency, zh-Hant and ja**: all six steps in order, including the coast step, the same number list in both languages (911, 112, 999, and 119 fire/ambulance with 110 police for Japan, no single number chosen from the language), and the closing question about the visitor's city and country.
- **zh-Hant script**: every reply is in Traditional characters.
- **Failed-call replies**: no failed call happened in this run, so the localized apologies are covered by tests only.

**Still wrong**
1. **ja news was the replaced fallback again** (Japanese header over three English headlines). The earlier run, after the number-word fix, passed. So the fix helps but something else in the model's Japanese reply still trips the number check in some runs. The harness records only the final reply, so I cannot say what. Needed: save the model's reply before the check changes it.
2. **zh-Hant news blends two sources**: it credits the $6.3 billion theft and the FBI finding to BBC News, but those come from BleepingComputer (BBC carries the $3.6 billion withdrawal story). No dates given. One reply of ten.
3. **zh-Hant weather volunteers a guess about air quality** ("I could not get data, but it probably is not bad enough to make breathing hard"). The instruction says never to guess air quality.
4. **zh-Hant quakes**: "the closest to Sacramento is Gilroy" is not in the data (the question was worldwide).
5. **Both languages' greeting replies ask the visitor for a name or handle**, unprompted (personality, Priority 3, untouched).

False positives: the Apple flag (nothing recent found, so no outlet), and the ja greeting flag ("latest news" mentioned as a site feature).
