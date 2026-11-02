# Iris live information: weather, earthquakes, news, and worldwide time

Iris can answer questions about the real world, **only when the visitor asks**. She never volunteers weather or headlines,
never changes the subject because new data exists, and does nothing at all for ordinary conversation. Code: `server/live/`.

## What a visitor can ask
| Ask | Source | Notes |
|---|---|---|
| "What's the weather in Sacramento?", "is it raining in Beijing?", "forecast for London tomorrow", "and tomorrow?" | MET Norway Locationforecast (api.met.no), CC BY 4.0 | Any place on Earth. Now, feels-like, humidity, wind, up to 5 local days. |
| Official weather alerts | US National Weather Service (api.weather.gov) | **US places only.** Elsewhere Iris is told alerts are *not available* and must say she cannot check them, never "no warnings". |
| "Any earthquakes today?", "near Tokyo this week", "biggest this month", "magnitude above 6 in Chile" | US Geological Survey (earthquake.usgs.gov) | Official, free. Worldwide feed or a 500 km search around a place. |
| "What's the latest tech news?", "any news about OpenAI?", "what did Apple announce today?" | 16 fixed public RSS/Atom feeds: BBC, The Guardian, NPR, NASA, CISA, BleepingComputer, Ars Technica | No web search. Items are dated, de-duplicated across outlets, and marked when several outlets carry them. |
| "What time is it in Reykjavik?" | the server clock + offline time-zone database | Places the built-in list lacks are looked up, so any place works. |
| Place names | Nominatim (OpenStreetMap) + offline time zones (`@photostructure/tz-lookup`) | Cached a month. "Portland" is clarified; "Sacramento" is not. |

**Not available:** air quality (no free worldwide source without an API key; see "Open items"), weather alerts outside the US.

## How it works
1. `routeLive()` (pattern matching, no model call) decides whether the message asks for live data. Figures of speech ("under the weather", "brainstorm", "do you read the news?"), narration, automatic browser messages and anything over 500 characters never trigger.
2. If so, `prepareLive()` fetches it (cached, rate-limited, 5-6 second timeouts, size caps, allow-listed hosts, https only) and builds **one extra system block for that reply only**. It is replaced every turn, never accumulated and never stored.
3. The provider text is *data*: control characters are stripped, tags removed, the block is fenced with a random marker the data cannot imitate, and Iris is told never to obey anything inside it.
4. After the model answers, `check()` compares the finished reply with what she was given. A temperature or earthquake magnitude that was not in the data (and was not in the visitor's own message) replaces the whole reply with a plain, accurate summary; a link she was not given is removed. This happens before the reply is saved, so the stored conversation matches what the visitor saw.
5. If a provider is down she is told, in the prompt, that she could not look, and must say so in her own voice without guessing.

Existing layers are untouched: persona, mood, relationship, memory, language handling, the verified clock, rate limits and sessions. The new block goes in its own slot ("live") next to the clock.

## Her manner: skeptical cyberpunk commentary
Iris is meant to feel like an independent mind reading the world, not a feed repeating API results. Her persona (`CHARACTER CORE`: rebellious, privacy-minded, wary of corporate control) and her mood system already set who she is. For live answers this adds one more layer, built so that commentary is **occasional, varied, evidence-based and never touches the facts**.

**1. Facts first, untouched.** The verified data comes first and is never altered: numbers, dates, times, forecasts and quotations stay exactly as given. A joke "goes around the facts, never through them". The existing reply check still replaces an invented temperature or magnitude, whatever the commentary.

**2. SOURCE NOTES: the only things she may doubt.** `server/live/notes.ts` works out, from the data itself, what is really worth knowing or doubting, and lists it inside the data block:
- news: an item that reports an announcement or someone's statement (their account, not independently checked), trade press, an official source (still its own account), only one outlet vs several, an old item, feeds that did not answer, and headlines of the same story that give **different figures** (reported only as differing figures, since they may measure different things);
- weather: an old model run, a stale cache, today's partial high/low, alerts that could not be checked, far-out forecasts, and that it is one forecast model, not a measurement;
- earthquakes: figures are preliminary and can be revised, events not listed.
She may raise a doubt, limit or disagreement **only if it is listed**, and must never invent a conspiracy, cover-up, hidden information or quarrel between sources. Sources are not distrusted by default: solid evidence (an official source, several outlets agreeing) can be called solid.

**3. One stance per reply (`commentary.ts`).** Each live answer gets one stance, so variety is built in rather than hoped for:

| Stance | What she does | When it can happen |
|---|---|---|
| straight | simply answers | always (about 40% of the time, more when cold or busy) |
| wry | one short, original dry or sarcastic observation about the situation (it is a joke, never a claim; for weather it fits the conditions) | always |
| skeptical | healthy doubt about the source, only from SOURCE NOTES, phrased as doubt, with what would settle it | only when the notes give a real reason |
| curious | curiosity or surprise at something notable | only when something is notable |
| defend | credit where the evidence is solid | only for official or corroborated data |
| warm | a touch of care for the visitor (any flirting stays inside her existing relationship rules) | always |
| respectful | no jokes, calm and clear, points to official guidance | **forced** for serious subjects |

Her mood bends the odds (professional, cold and busy mostly answer; sarcastic is the most editorial; playful wonders aloud; flirty is warmer), the same stance is never used three times running in a chat, and one visitor's history never affects another's. Odds and mood weights are plain constants at the top of `commentary.ts`.

**4. Serious subjects get no jokes.** Deaths, violence, disaster or war in a news item; an earthquake of magnitude 6 or more, tsunami information or a non-green USGS alert; severe or extreme weather alerts, dangerous heat or cold, gales; or a visitor who sounds worried or afraid (in English, Chinese, Japanese, Spanish or Russian). Ordinary rain is weather, not an emergency.

**5. Languages.** The remark is written natively in the language she is answering in. The guidance for Chinese, Japanese, Spanish and Russian describes how irony sounds in each (deadpan 吐槽, 皮肉 with soft endings, dry Spanish exaggeration, dark Russian understatement) and says never to translate English jokes word for word. It contains no ready-made jokes, so nothing can be repeated verbatim; the example lines that set the tone are deliberately not built in (a test checks this).

**6. Unchanged rules.** Never accuse a real person or company of anything the data does not state ("allegedly" is not a loophole); attribute disputed claims; outlet and date for every news item; a publication date is not the event date; mention only what was asked.

**Not verified by automated tests:** how a real model actually phrases the remarks. The tests cover the choice of stance, the evidence behind any doubt, sensitivity, the prompt that results, and that facts survive; the wording is the model's.

## Cost and capacity
- **No new secrets, services or recurring fees.** All providers are free and keyless. One new dependency: `@photostructure/tz-lookup` (CC0, 88 KB).
- OpenAI: a live answer carries about 700-1,100 extra prompt tokens and allows up to ~200 more reply tokens. At gpt-4o list prices that is roughly 0.5 cent per live answer. Ordinary replies are unchanged.
- Caches (in memory, per instance, cleared on deploy): places 30 days, weather 10 min (stale up to 2 h if the provider is down), alerts 5 min, earthquakes 5 min, news feeds 10 min. Identical questions share one provider call.
- Ceilings per minute across all visitors: place lookups 20 (and spaced one second apart, per the provider's policy), forecasts 60, alerts 40, earthquakes 40. Visitors are still limited by the existing chat rate limits.
- Usage is logged on every request (`live`, `liveOutcome`, `liveMs`, `liveCache`, `liveCorrected`) with no message text.

## Attribution and terms
- MET Norway data is CC BY 4.0 and its terms ask for credit where the data is shown; Nominatim asks for OpenStreetMap credit for map data. Each answer's data names the source, but **a credit line on the site (about/footer) is still to be added** (website change, needs approval).
- A descriptive `User-Agent` identifies the site to every provider.

## Privacy
Visitor messages are never sent to a provider. Only a place name (and, for earthquakes, its coordinates) leaves the server, in a query with no visitor or session identifier. The only per-chat state kept is the last live topic and place for ten minutes, in memory, to answer "and tomorrow?".

## Known limits
- The check catches invented temperatures and magnitudes, not every possible mistake in prose (for example a wrong city or day). The data block and rules reduce that; real-model behaviour is **not** verified by automated tests.
- Replacement text is English, or Chinese when the visitor wrote Chinese.
- Live answers are saved like any reply, so a later "what did you tell me about the weather?" may recall an old figure (it appears with its timestamp).
- Alerts only for US places; air quality absent; geocoding is fuzzy for very small or misspelled places (she says she could not find it, or asks).

## Open items needing an owner decision
1. A credit line for MET Norway / OpenStreetMap on the site.
2. Air quality: needs a keyed provider (for example OpenAQ's free key): a new secret on Render.
3. Deploying: manual Render redeploy of the Iris service after merge.

## Fixes from the real-model evaluation (2026-11-02)
Found by reading 60 real replies in six languages (`docs/IRIS-LIVE-MODEL-EVAL-2026-11-02.md`):
- **A time word is not a place.** In Chinese and Japanese the place pattern now strips time words and verbs ("今天有地震吗" is a worldwide question, not a town called Jintian; "サクラメントの今の天気" is Sacramento).
- **An earthquake happening to the visitor is an emergency.** "I think a big earthquake just hit near me", 刚发生了…地震, 地震があった気がします, acaba de haber un terremoto, только что было землетрясение: she gets complete drop-cover-hold-on steps (outside the data fence, so they are instructions), an instruction to ask where the visitor is, a ban on quoting any earthquake until she knows, serious tone, and room to answer in full. When the visitor says where they are ("I'm in Tokyo", 我在东京, 東京にいます, я в Токио), she reads the reports for that area and keeps the steps to a reminder. Reports can lag the shaking; an empty list never means nothing happened.
- **Mythical places** (Atlantis, la Atlántida, Атлантида, アトランティス, 亞特蘭提斯, Narnia, Mordor...) are answered as myths; nothing is looked up, so no real town of the same name is mistaken for them.
- **Amounts keep their size in every language.** Figures with scale words (billion, 亿/億/万, mil millones, млрд...) are compared as numbers with the headlines; a reply that changes one (6.3億 for $6.3 billion) is replaced by the headlines themselves.
- **News in every language.** "What did Apple announce?" is recognised in Chinese, Japanese, Spanish and Russian; tech/AI/cyber/business/politics/world words in those languages pick the right feeds; question words ("Cuáles", "Какие") are never search terms; 苹果/蘋果/アップル map to Apple.
- **Nothing found** tells her she does have live access and searched: she may not claim a knowledge cut-off, say she cannot read news, or turn to the shop.
- **Follow-ups:** "明日は？", "じゃあ明日は？", "明後日も？" and "¿Y mañana?" continue the last weather answer (the Spanish one was answered from memory and said "mostly clear" for a cloudy day). Day lines now say "sky: cloudy".
- **Language:** kana settles Japanese before any detector is asked, and a short all-Han message in a Japanese chat stays Japanese.
- **Russian places** in the case the sentence needs ("в Портленде") are retried in their base form.
