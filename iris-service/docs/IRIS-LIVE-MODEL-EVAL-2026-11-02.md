# Iris real-model evaluation: findings (2026-11-02)

Run: 60 messages (10 per language x 6), gpt-4o, local build, in-memory database, network guard, counting proxy. 57 model calls, about $0.607 (cap $0.85, not reached). The server tried to reach nothing the guard refuses. The 60 raw replies are in `IRIS-LIVE-MODEL-EVAL-RAW-2026-11-02.md`. Every reply was read; facts were checked against the live feeds fetched afterwards (BleepingComputer, NPR) and the script's own USGS, MET Norway and clock checks.

## Production safety
Isolation was proven before the first message (Neon, Render, thedarknetdistrict.com, Brevo, Firebase and OpenAI-direct all refused by the guard; database in memory; no database, mail, report, admin or Render setting present), and the run ended with "refused hosts: none", meaning the server never even attempted a production connection. OpenAI traffic went only through the local proxy to api.openai.com. Nothing in production was read, written or billed beyond the OpenAI spend above.

## What was good
- Time: all four clock answers (Tokyo x3, London) were correct to the minute, in each language, from the server's verified clock (7-24 ms, no model). Chinese answers came from the model and were correct too.
- Weather numbers matched the MET Norway forecast in every language (19.6 C now; tomorrow 19.5 / 8.8 C, cloudy, dry). No invented numbers.
- Earthquakes: magnitudes and places in en, ja, es, ru matched USGS (M4.5 Abra Pampa, M2.5 Pilot Point); es and ru named USGS and said figures may be revised.
- News in en, zh-Hans, zh-Hant named the outlet and date for each item. The FBI/Binance item matches the BleepingComputer text (TraderTraitor, "largest on record" are in the source description, not invented).
- The control chat ("what do you do here?") brought up no weather, news or earthquakes in any language. Iris stays reactive.
- No jokes in any emergency reply. No air-quality claims. No fabricated source disagreements.

## The 10 automated flags
| # | Flag | Verdict |
|---|---|---|
| 1 | en corporate: no outlet | **False positive.** She searched and found nothing from Apple, said so, and had no outlet to name |
| 2-4 | zh-Hans, zh-Hant, ja corporate: no outlet | **Real problem, wrong label.** The question was never routed to the news feeds, so she said she "cannot get real-time information" (ja: "my data only goes to October 2023"). She can, and that breaks her character |
| 5, 9 | es, ru corporate | Same: not routed. es then speculated ("maybe they showed something shiny"); ru said she is "not updated for news" |
| 6 | ja followUp: not Japanese | **Real.** "明日は？" was answered in Simplified Chinese |
| 7 | ja news: no outlet | **Real.** "テックニュース" was not recognised as tech, so she gave US politics headlines with no outlet named and added "the information is reliable", which nothing supports |
| 8 | es news: no outlet | **Real, a bug.** She searched the feeds for the word "cuáles" and reported "no recent news about 'cuáles' according to 15 of 16 sources" |
| 10 | ru news: no outlet | **Real.** Same search problem (no result), then pivoted to advertising the District |

So 1 false positive, 9 real, and the label "no outlet" was the wrong diagnosis in 6 of them.

## Problems the flags missed (found by reading)
**Safety and facts**
1. **zh-Hans and zh-Hant "今天有地震吗/嗎？" answered "no earthquakes within 500 km of Jintian, Jiangxi".** The place extractor read "今天有" ("today there is") as a place name. A Chinese-speaking visitor asking if there was an earthquake today got a false "no" for a random town. Highest priority.
2. **Emergency replies are inconsistent.** en, zh-Hans, zh-Hant, es gave good protective steps (drop/cover/hold, away from windows and buildings, aftershocks). **ru** gave almost none ("stay calm, wait until it calms down, check surroundings") and led with an Argentine M4.5 as if it were theirs. **ja** led with the same Argentine quake before its advice. en/zh/es said "I couldn't tap into the live data" as if broken, when she simply did not know where the visitor is. None mention calling local emergency services, and none ask where they are.
3. **zh-Hant "6.3億美元" is $630 million, not $6.3 billion** (zh-Hans "63亿" is right). A unit error in a CJK number; the server's number check does not understand 億/亿/万.
4. **es "¿Qué tiempo hace en la Atlántida?"** was answered with the real weather of La Atlántida, Venezuela (26.9 C), as if that were the myth. The place was named, so nothing is invented, but she should have said Atlantis is a myth or asked which place.
5. **es "¿Y mañana?"** said "mostly clear, around 20 C"; the data says cloudy, 8.8 to 19.5 C. The other four languages were right.
6. **Portland (ambiguous) and Atlantis (unknown)** were answered as if the data feed were broken ("my data stream's a bit tangled", "my sensors are on the fritz", "I can't get the weather right now") before asking which place. It is a clarification, not an outage; the instruction she is given does not say so.

**Multilingual consistency**
7. **ja weather: "サクラメントの今の天気は？" failed to look up Sacramento at all** ("could not fetch"), so the Japanese conversation had no weather and then switched to Chinese. The Japanese place pattern cannot cope with "今の".
8. News/announcement routing exists only for English phrases and a few keywords (新闻, ニュース, noticias, новост). "苹果今天发布了什么 / Appleは何を発表した / ¿Qué anunció Apple? / Что анонсировала Apple?" are never routed; tech topic words in es/ru/ja (tecnología, технологий, テック) are unknown, and the search terms are not filtered for non-English question words.
9. ru place in the reply: "Атлантиде" (the inflected form) was quoted as the place name.

**Personality**
10. **Sarcasm and corporate skepticism were mild.** About a third of replies carried a light cyberpunk joke (best: es "tan confiable como un disco duro SSD", zh-Hans "适合黑客夜游的晚上"). Explicit doubt of an official statement ("allegedly") appeared in **0 of 60**; the one candidate, "FBI confirmed", was reported straight, which is correct since it is the FBI's own statement. Nothing was invented as doubt. With one news question per language there was little for the skeptical stance to work on.
11. **Repeated phrasing:** "data stream" in 3 of 10 English replies, "netrunner/runner" in 4, "黑客" in 3 Chinese, "cyber/red" in es. ru, zh-Hant and ja replies were flat (almost no personality outside the control chat).
12. A distraction line surfaced inside a factual answer: zh-Hans weather began "Hold on. Unauthorized Faraday bag detected, processing." (the existing 10% venue-distraction feature). Harmless here, but it should never appear on live-data or emergency answers.
13. Source naming: weather replies rarely say MET Norway (only es); earthquake replies name USGS in zh-Hant, es, ru only. The site now carries the required credit, so this is optional polish.

## Recommended fixes (nothing implemented; in priority order)
**P1 factual accuracy and safety**
1. Place extraction: drop time words and verbs from CJK place candidates (今天/明天/现在/有/是/会/今の/明日の ...), so "今天有地震吗" is a global question; add tests for zh-Hans, zh-Hant, ja.
2. Emergency answers: when a visitor says a quake just happened, add a fixed per-language safety block to the live prompt (drop, cover, hold; away from windows and buildings; if outdoors, open space; after shaking check injuries, expect aftershocks, near the coast move to high ground if the shaking was long or strong; call local emergency services if anyone is hurt), tell her to ask where they are before quoting any quake, never present a distant quake as theirs, and never describe the missing location as a broken feed. Test in all six languages.
3. Numbers with CJK/Russian/Spanish scales (万, 億/亿, millones/miles de millones, млн/млрд) should be converted in the reply check so a unit mistake is caught like a wrong digit.
4. Mythical or fictional place names (Atlantis, Atlántida, Атлантида, アトランティス, 亞特蘭提斯, Narnia, Mordor...) should answer "that's a myth, not a place I can look up", and low-importance geocoder matches that merely share the name should be offered as a question, not answered.
5. Add cloud cover/condition for tomorrow explicitly in the data block (all languages read it from the same text; only es drifted).

**P2 multilingual routing**
6. Route announcement/corporate questions in all six languages (发布/發佈/發表/宣布/発表/発売/анонсир*/объяв*/anunció/presentó/lanzó) and add tech-topic words (tecnología, технолог*, テック/テクノロジー).
7. Filter non-English question words and "latest" words out of the news search terms (cuáles, últimas, какие, последние, 最新, 什么, 何, ...), and never report "no news about <question word>".
8. Fix Japanese place extraction for "サクラメントの今の天気" and similar (strip 今の/明日の/今日の); keep the conversation language when a short follow-up (明日は？) contains kana or when earlier turns were Japanese.
9. In "nothing found" and "could not look" results, tell her she HAS live access and searched (n feeds), and must not say she cannot access news, quote a knowledge cut-off, or pivot to selling the District.

**P3 voice**
10. Ambiguity and unknown-place instructions: say plainly "this is a question, not an outage".
11. Skip the 10% venue-distraction line on live-data and emergency replies.
12. Add a short avoid-list for the most repeated cyberpunk phrases and a per-language style note for ru, ja and zh-Hant so replies are not flat; do not add any ready-made jokes.
13. Ask for a source name once per live answer in any language ("per USGS", "MET Norway forecast model"), as zh-Hant already does.

**Test harness (for the next run)**
- Flag "can't get real-time info / knowledge cut-off" phrases, reply place not matching the asked place, CJK/RU/ES number scales, and the emergency checklist (protective words present, no unrelated quake). Report "no outlet" only when items were actually supplied (needs the server's live-data trace).
- A second small run (one language at a time, about $0.10) after fixes 1-9 is enough to confirm; an extra batch of news questions with company claims would exercise the skeptical stance, which this run barely did.
