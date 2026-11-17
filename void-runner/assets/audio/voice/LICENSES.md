# NPC voice clips: sources and licences

| Item | Source | Licence | Commercial use |
|---|---|---|---|
| `*.ogg` dialogue clips | Rendered offline on David's PC with `tools/voice/generate.py` from the game's own approved dialogue | Output of an Apache-2.0 model; no third-party audio included | Yes |
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
| `extra/*.ogg` (listed in `extra/manifest.json` with the voice used) | Generated once with ElevenLabs (model `eleven_v4`, library voices) on David's ElevenLabs account, Starter plan, 15 Nov 2026, and stored here so the game never generates audio at play time | ElevenLabs terms for paid plans | David to confirm the plan's commercial terms cover this use; the plan and date are recorded here as the evidence available |

- These are NEW lines only. No existing approved Kokoro recording was replaced, and the approved voices in `tools/audio/npc-voice-registry.json` are unchanged.
- Admin's ElevenLabs voice is an older, natural American male (David asked for him to sound older, 15 Nov 2026); Iris's is a calm British female, and her synthetic colour is still added live by `voice-clips.js`, as for her Kokoro lines.
- The same character now has lines in two different voices (Kokoro and ElevenLabs). Re-voicing the older lines for consistency is David's decision.

- 17 Nov 2026: Admin's lines for 001 Awakening (the Comms call) and 002 Eyes on the Street (offer, Comms call in NULL, replies, return), plus a re-voice of his scanning-rule line, were recorded in the ElevenLabs voice the owner chose for Admin (Donovan, DMyrgzQFny3JI1Y1paM5), one take each, about 1,034 credits, with the owner's approval.
