# VOID//RUNNER: NPC Voice Production

How the game's recorded NPC dialogue is cast, approved, recorded and protected. The engine is **Kokoro-82M v1.0** (Apache-2.0), approved by David on 2026-10-15 (see `VOID_RUNNER_FREE_AI_VOICE_COMPARISON.md`). Everything runs offline on this computer and costs nothing. Players only download the finished Ogg clips.

## The pieces

| Piece | What it does |
|---|---|
| `tools/audio/npc-voice-registry.json` | **The permanent voice identity of every character**: voice, speed, accent, live processing (Iris android, Elias hologram), status, approval fingerprint, notes. Also lists broadcast voices (unassigned) and the reserved special-character slot. |
| `tools/audio/voice-registry.cjs` | The rules: valid voices and ranges, no two characters share a voice, the reserved slot stays empty, and the **approval lock**. |
| `tools/audio/audition/` | A local web page for auditioning, comparing and approving voices. |
| `tools/audio/extract-lines.cjs` | Finds every fixed NPC line in the game and writes `void-runner/assets/audio/voice/manifest.json`. `--check` reports missing or out-of-date clips. |
| `tools/audio/generate.py` | Records only what is missing or out of date. |
| `void-runner/assets/audio/voice/renders.json` | What each clip was recorded with, when, and whether it is **protected**. |

## Status and the lock

- **Provisional:** the voice can be changed freely. Every voice starts here.
- **Approved:** the voice is locked. The registry stores a fingerprint of the settings that decide how it sounds: model file, voice, speed and accent. Notes and live processing are not part of the fingerprint.
  - If anything in the fingerprint changes without re-approval, the generator refuses to run and `npm test` fails.
  - The audition tool changes an approved voice only after David confirms the replacement. **Unlock** returns a voice to provisional, also only after confirmation.
  - A different model file breaks every approval at once on purpose: the voices may sound different and need re-auditioning.
- **Protected clip:** a single recording David has signed off is never re-recorded automatically, even if its character's voice changes. Use `--protect <line id>` and `--unprotect <line id>`.

## One-time setup (already done on the Ally)

1. Python 3.12, then a virtual environment *outside the repo*, for example `%LOCALAPPDATA%\void-runner-tts\venv`, with `pip install kokoro-onnx soundfile`.
2. From https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0, download `kokoro-v1.0.onnx` (325 MB) and `voices-v1.0.bin` (28 MB) into the same folder. The registry holds their checksums, and both tools refuse files that don't match.

Never commit the model, the environment or audition samples; `.gitignore` covers them.

## Auditioning and approving a voice

```
python tools/audio/audition/server.py --models <model folder>
```

Open http://127.0.0.1:5190/. Each character has a card. To use it:
1. Pick a voice, speed and accent.
2. Choose one of their real lines, or type your own.
3. Press **Make sample**. The last two samples stay in slots A and B for comparison, and **In game now** plays the current recording.
4. Press **Approve** to lock the voice.

Iris's and Elias's effects are added in the game, not in samples. The page only listens on this computer, refuses requests from other websites, and edits nothing but the registry.

## After dialogue or voice changes

```
node tools/audio/extract-lines.cjs
python tools/audio/generate.py --models <model folder> --dry-run
python tools/audio/generate.py --models <model folder>
```

Then run `npm test`.
- Only new lines and lines whose voice changed are recorded.
- `--speaker rook` or `--line <id>` narrows the run.
- Failures are listed at the end; the game shows subtitles (and the browser voice) for any line without a clip.
- Ask David before a run that would record hundreds of clips.

## Relay broadcasters

The Relay's scripts are in `void-runner/relay-content.json`. Each segment has an id, a kind, the text and optionally a speaker.
- **Casting:** cast a broadcaster in the audition tool's **Relay broadcasters** section. Tick "Preview with the Relay transmission filter" to hear it as players will. Casting and approving locks the voice exactly like an NPC's.
- **Recording:** run the usual two commands. Only lines whose broadcaster has a voice are recorded; the rest show as captions in the game.
- **The filter** is applied live and is never baked into the recording.

## Not built yet

- **Broadcast voices:** the Relay's scripts are in (David's lines from his Relay brief; see `docs/VOID_RUNNER_RELAY.md`), but no broadcaster is cast yet, so they show as captions. Each report line is recorded as its own clip; lines with leaderboard names filled in at play time stay captions.
- The special-character slot stays reserved until David introduces that character.
