# NPC voice clips: sources and licences

| Item | Source | Licence | Commercial use |
|---|---|---|---|
| `*.ogg` dialogue clips | Rendered offline on the owner's PC with `tools/voice/generate.py` from the game's own approved dialogue | Output of an Apache-2.0 model; no third-party audio included | Yes |
| Kokoro-82M v1.0 model and voice packs | hexgrad/Kokoro-82M, via the `kokoro-onnx` release `model-files-v1.0` | Apache-2.0 | Yes |
| `kokoro-onnx` runtime | github.com/thewh1teagle/kokoro-onnx | MIT | Yes (build-time tool only, not shipped) |

- No voice imitates a real, identifiable person. Each NPC uses one of Kokoro's stock voices (see `cast` in `manifest.json`).
- The model files are **not** in the repository. They are only needed to render new clips.
- Iris's synthetic colour and Elias's hologram tone are applied live in the game (`voice-clips.js`), so the clips themselves are clean.

## Re-rendering after dialogue changes

```
node tools/voice/extract-lines.cjs
python tools/voice/generate.py --models <folder with kokoro-v1.0.onnx and voices-v1.0.bin>
```

`npm test` fails if dialogue changes without its clip being re-rendered (`extract-lines.cjs --check`).

## Lines voiced with ElevenLabs (`extra/`)

| Item | Source | Licence | Commercial use |
|---|---|---|---|
| `extra/*.ogg` (listed in `extra/manifest.json` with the voice used) | Generated once with ElevenLabs (model `eleven_v4`, library voices) on the owner's ElevenLabs account, Starter plan, 15 Nov 2026, and stored here so the game never generates audio at play time | ElevenLabs terms for paid plans | The owner to confirm the plan's commercial terms cover this use; the plan and date are recorded here as the evidence available |

- These are NEW lines only. No existing approved Kokoro recording was replaced, and the approved voices in `tools/audio/npc-voice-registry.json` are unchanged.
- Admin's ElevenLabs voice is an older, natural American male (the owner asked for him to sound older, 15 Nov 2026); Iris's is a calm British female, and her synthetic colour is still added live by `voice-clips.js`, as for her Kokoro lines.
- The same character now has lines in two different voices (Kokoro and ElevenLabs). Re-voicing the older lines for consistency is the owner's decision.

- 17 Nov 2026: Admin's lines for 001 Awakening (the Comms call) and 002 Eyes on the Street (offer, Comms call in NULL, replies, return), plus a re-voice of his scanning-rule line, were recorded in the ElevenLabs voice the owner chose for Admin (Donovan, DMyrgzQFny3JI1Y1paM5), one take each, about 1,034 credits, with the owner's approval.
- 17 Nov 2026: Mission 003 Corporate Connections, eight clips, eleven_v4, approved by the owner: Admin's four briefing lines (Donovan, DMyrgzQFny3JI1Y1paM5); Eva's two lines at reception (gJx1vCzNCD1EQHT212Ls, the voice the owner named for Eva); Fish's Mandarin line and its English translation, both in her own voice (ggacvEjbmpoSuEinfFWs, the voice the owner named for Fish; the English take about 68 credits, the rest about 517). The owner's standard: a V1 translation is spoken in the speaker's own voice, in English (`translations` in `extra/manifest.json`). The English plays 0.75 s after the Mandarin line, over it (`voice-clips.js`). A first English take in a library voice was replaced at the owner's choice and is not in the repository. The registered Kokoro voices of Eva and Fish (`milked-eva`, `milked-fish`, provisional) are unchanged in the registry. The drafted (PROPOSED) lines of Mission 003 are not recorded.
