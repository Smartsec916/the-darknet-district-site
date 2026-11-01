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

## Her manner (the prompt rules in `MANNER`)
- Facts first and brief, then at most one short remark in character; varied, not a stock line; no joke when nothing fits.
- Keeps three things distinct in how she phrases them: **verified data**, **what a company or official says** ("according to...", "they claim"), and **her own opinion or joke**.
- Rebellious, sardonic cyberpunk: may doubt press releases, corporate claims, official narratives and any single source ("allegedly", "reportedly", "the press-release version"), and joke about corporations, surveillance and hype.
- Never accuses a real person or company of a crime, fraud, lying or misconduct that the data does not state; "allegedly" is not a loophole; mock the PR language, not invented wrongdoing.
- Drops the jokes for deaths, disasters, large earthquakes, tsunami information and active severe-weather alerts.
- News: names the outlet and publication date, says when several outlets carry a story or only one does, never calls an old item breaking, and a publication date is not the event date.
- If air-quality data is ever added, she may joke about corporate smog only when the data shows it is poor.

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
