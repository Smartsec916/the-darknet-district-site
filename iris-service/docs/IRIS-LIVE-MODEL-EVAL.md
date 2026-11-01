# Real-model evaluation of Iris's live-data replies

`scripts/live-model-eval.mjs` runs 10 messages in each of 6 languages (English, 简体中文, 繁體中文, 日本語, Español, Русский) against the real OpenAI model **on your own machine**: weather and a follow-up ("and tomorrow?"), earthquakes, tech news, a time-zone question, an ambiguous place (Portland), an unknown place (Atlantis), an earthquake emergency, a corporate announcement ("what did Apple announce today?") and an ordinary chat message (to check she does not volunteer weather or news).

## What it cannot touch
It has no option to point at a running service. Three layers, checked before the first message of every run (it stops if any fails):
1. The server it starts uses an in-memory database; `DATABASE_URL`, the mail, report, admin and Render settings are blanked.
2. A network guard (`tests/helpers/network-guard.cjs`) refuses every outbound connection except this machine and the public data providers (MET Norway, weather.gov, USGS, OpenStreetMap, the news feeds). Neon, Render, thedarknetdistrict.com, Brevo and Firebase are refused, and the run first proves it by trying them. The report lists any host the server tried that was refused (should be none).
3. OpenAI traffic goes through a counting proxy inside the script that only forwards to api.openai.com, prices the tokens (gpt-4o: $2.50 / $10 per million, unknown models priced high) and stops the run at the cap (default $0.85). It also stops on a rejected key, three failed replies in a row, or repeated OpenAI errors.

`node scripts/live-model-eval.mjs --selftest` exercises all of this with a fake OpenAI and no key.

## Running it with your key (Windows PowerShell)
The key never goes in chat, on a command line or in a repository file. From `iris-service`:
```
powershell -ExecutionPolicy Bypass -File scripts\run-live-model-eval.ps1 -SetupKey     # once; hidden prompt
powershell -ExecutionPolicy Bypass -File scripts\run-live-model-eval.ps1               # the run
powershell -ExecutionPolicy Bypass -File scripts\run-live-model-eval.ps1 -ClearKey     # afterwards
```
`-SetupKey` stores the key encrypted with Windows DPAPI (only your Windows account on this PC can decrypt it) in `%USERPROFILE%\.darknet-iris-eval\`. Prefer an OpenAI project key with its own small monthly budget, and revoke it when finished. Build first: `npm run build`.

## What the automated flags check, and what they do not
Flags: no reply or a fallback; wrong script for the language; simplified/traditional mix-ups; air-quality figures; jokes in the emergency reply; a reply that brings up weather, news or earthquakes unasked; a temperature outside the real Sacramento forecast range, a magnitude not in the USGS week feed, a time that differs from the real Tokyo/London clock (all three fetched independently by the script); a news answer that names no outlet. Informational: replies that hedge ("allegedly", "reportedly", "according to", and their equivalents). Tone, humour, whether a doubt is justified by the data and anything else invented need a person reading the replies.
