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
