# Iris: current time, dates and time zones

Iris answers "what time is it in Beijing?", "today's date in China", "is it tomorrow in Japan?" and "the time
difference between Sacramento and Tokyo" from the server's own clock, converted with the time-zone database. The model
never calculates a time. Code: `server/timeService.ts`; tests: `tests/time-service.test.ts`, `tests/time-chat.test.ts`.

## Why it was wrong before

Nothing in her prompt said what time it was. Render's clock was correct (UTC), but the model had no clock at all, so
asked "现在是北京时间几点?" at 21:50 Beijing time she made up 14:50. The only times she ever saw were the UTC stamps on
stored messages, which made a UTC-looking guess labelled as local time likely.

## How it works now

1. **The clock.** For every message the server reads the system clock (`clock.now()`, which is `Date.now()`). Nothing
   is captured at startup. Everything is UTC internally.
2. **Conversion.** Local times come from `Intl.DateTimeFormat` with IANA zone ids (`Asia/Shanghai`,
   `America/Los_Angeles`, ...). Daylight saving, midnight date changes, half-hour and 45-minute offsets (India, Iran,
   Newfoundland, Adelaide, Nepal, Chatham Islands) and the date line (Kiritimati UTC+14, American Samoa UTC-11) all
   come from Node's built-in time-zone data. There is no hand-written offset anywhere.
3. **Plain time questions** (short, one question) are answered word for word by the server in the visitor's language,
   with one short in-character line ("Synced to the District's master clock."). The model is not asked.
4. **Longer messages** that also ask the time go to the model with a `VERIFIED CLOCK` block (the exact local times and
   dates) and a rule, read last, to copy those values and not calculate.
5. **The safeguard.** Before her reply is sent or saved, every clock time and calendar date in it is tied to the place
   written next to it and checked against **that place's** clock:
   - "北京时间13:50" is wrong even though 13:50 is the correct UTC time (the original bug);
   - with several cities, each time must be its own city's (swapped times are caught);
   - UTC counts only when labelled "UTC", "GMT" or "协调世界时" (an offset like "UTC+8" is not a UTC label);
   - a time with no place named is taken as the one place asked about, never as UTC;
   - a time given for the visitor's own place ("你那边"), an ambiguous place, or two places at once is rejected;
   - a stated time difference must be the verified one, and an answer must actually contain each place's time.

   When every wrong value can be pinned to a place, only that value is corrected and the rest of her reply, her
   personality included, is kept ("Mmm, Beijing's glowing at 13:50 tonight, runner." becomes "...at 21:50 tonight,
   runner."). A missing time is added after what she said. Otherwise the whole reply is replaced by the verified answer.
   The result is checked again before it goes out, and her short-term chat history gets the corrected reply as well.
6. **Every message** carries the current UTC time and a rule: she does not know the visitor's own time zone, never
   presents UTC as their local time, and never guesses it from their language.

## What she does when she cannot be sure

| Situation | What she says |
| --- | --- |
| "What time is it?" with no place | She can't see their clock and won't guess; gives the UTC time and asks for their city or time zone |
| An ambiguous name (Portland, Washington, Georgia, San Jose, Birmingham, or a country with several zones: the US, Russia, Australia, Canada, Brazil, Mexico, Indonesia) | Lists the options and asks which one; gives no time until they say |
| A place she doesn't know, or an invalid zone id | Says she has no verified clock for it, gives UTC, asks for the nearest major city or a zone id such as `Asia/Tokyo` |
| A valid zone id typed directly (`Asia/Ulaanbaatar`) or a whole-hour offset (`UTC+8`) | Answers it |

A city settles its country ("美国加州", "Russia, Moscow"), and "Sacramento, California" counts as one place.

## Languages and places

- Questions are recognized in English, Simplified and Traditional Chinese, Japanese, Spanish and Russian (including
  Russian case endings such as "в Москве"). Answers are written in the same language and script.
- About 110 places: major cities, common single-zone countries (China, Japan, the UK, India, Nepal, ...), and the regions people ask about (California,
  Hawaii, Alaska, Arizona, Newfoundland). Add one with a `P(...)` line in `timeService.ts`; a test checks that every zone
  id is valid.

## Limits

- "If it's 9am in London, what time is it in Tokyo?" (a time the visitor gives) goes to the model with the verified
  offsets and is not checked, because the answer is not the current time.
- The check reads times written with digits (21:50, 9:50 PM, 9 pm) and Chinese or Japanese clock words (晚上9点50分,
  九点五十分, 21時50分). A time spelled out in Spanish or Russian words ("las nueve") is not checked; the rule tells her to
  write HH:MM.
- Offsets like `UTC+5:30` typed by the visitor are not resolved (use a city or zone id); whole hours are.
- A city not in the list gets a clarifying question, not an answer.

No environment variables, database changes or new packages. A Render redeploy is needed for the change to take effect.
