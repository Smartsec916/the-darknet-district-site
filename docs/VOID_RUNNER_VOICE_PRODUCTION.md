# VOID//RUNNER: NPC Voice Production

How the game's recorded NPC dialogue is cast, approved, recorded and protected. The engine is **Kokoro-82M v1.0** (Apache-2.0), approved by the owner on 2026-10-15 (see `VOID_RUNNER_FREE_AI_VOICE_COMPARISON.md`). Everything runs offline on this computer and costs nothing. Players only download the finished Ogg clips.

## The pieces

| Piece | What it does |
|---|---|
| `tools/audio/npc-voice-registry.json` | **The permanent voice identity of every character**: voice, speed, accent, live processing (Iris android, Elias hologram), status, approval fingerprint, notes. Also lists broadcast voices (unassigned) and the reserved special-character slot. |
| `tools/audio/voice-registry.cjs` | The rules: valid voices and ranges, no two characters share a voice, the reserved slot stays empty, and the **approval lock**. |
| `tools/audio/audition/` | A local web page for auditioning, comparing and approving voices. |
| `tools/audio/extract-lines.cjs` | Finds every fixed NPC line in the game and writes `void-runner/assets/audio/voice/manifest.json`. `--check` reports missing or out-of-date clips. |
| `tools/audio/generate.py` | Records only what is missing or out of date. |
| `void-runner/assets/audio/voice/renders.json` | What each clip was recorded with, when, and whether it is **protected**. |

## ElevenLabs voices chosen in the editor (18 Nov 2026)

`tools/audio/revoice-engines.json` lists the characters whose **new or changed** lines are re-voiced with ElevenLabs (Admin, Iris, Rook, Eva, Fish, Zen Zephyr). Since build `2026-11-18-editor-voices-1` the owner can also choose one himself in **Developer tools > NPCs > Lines & voice** (or a Mission Editor giver card): he pastes the voice's elevenlabs.io link or ID plus a name. The choice is editor content (`content.voices`, draft / publish, checked by the server) and downloads as a `revoice-engines.json`-format file.

- Nothing is generated from the editor or the server, and no ElevenLabs key is ever in the browser. Queued lines wait until the owner approves the spend; Claude then records them with the ElevenLabs connector into `void-runner/assets/audio/voice/extra/`.
- `python tools/audio/generate.py --from-queue [--voices revoice-engines.json]` lists those lines as waiting (voice, characters, estimated credits: about 1 credit per character on Multilingual v2 / v3, about half on Flash / Turbo) and records only the Kokoro ones.
- The registry is never changed by a choice: recorded Kokoro clips keep their voice. The reserved slot, broadcast voices and The Function are refused; Reverie and Lace get ordinary, neutral street voices only.

## Voice tags and models (19 Nov 2026)

The owner can type ElevenLabs audio tags in square brackets into any line, e.g. `[whispers] Keep it down.`, and choose each ElevenLabs voice's model in the Voice box (build `2026-11-19-voice-tags-1`). Rules and models live in `void-runner/npc-voices.js` (`tagProblems`, `strip`, `speakText`, `MODELS`); the server repeats them (`void_runner_drafts.py` `voice_tag_problems` / `strip_voice_tags`, `void_runner_live_content.py` `speak_text` / `voice_model`).

- **Tags:** lowercase letters, spaces and hyphens, 30 characters at most each, 6 per line. Players never see them (removed where content is adapted for the game).
- **Models** (credits per character are estimates on the self-serve plans): `eleven_v4` Eleven v4 (newest; reads tags; Zen Zephyr's model; the default), `eleven_v3` Eleven v3 (reads tags), `eleven_multilingual_v2` (about 1 credit, no tags), `eleven_flash_v2_5` and `eleven_turbo_v2_5` (about 0.5 credit, no tags). A `revoice-engines.json` entry may carry `model`; without one the model in "(model ...)" of `chosen`, else Eleven v4.
- **Queue:** each queued line stores `text` (what players see; the clip id is `who + sha1(who|text)` as before) and, when it differs, `speak` (what the voice is sent) plus `model` for ElevenLabs lines. Tags are kept only for Eleven v4 / v3; Kokoro and the other models get the line without them (Kokoro would read them aloud). Changing only a tag re-queues an ElevenLabs line; for a Kokoro voice it is not a change (the editor does not mark the clip out of date).
- `generate.py --from-queue` strips tags from Kokoro lines and lists waiting ElevenLabs lines with the text as sent, the model, and credits at each model's rate. Nothing is sent to ElevenLabs from here.

## Status and the lock

- **Provisional:** the voice can be changed freely. Every voice starts here.
- **Approved:** the voice is locked. The registry stores a fingerprint of the settings that decide how it sounds: model file, voice, speed and accent. Notes and live processing are not part of the fingerprint.
  - If anything in the fingerprint changes without re-approval, the generator refuses to run and `npm test` fails.
  - The audition tool changes an approved voice only after the owner confirms the replacement. **Unlock** returns a voice to provisional, also only after confirmation.
  - A different model file breaks every approval at once on purpose: the voices may sound different and need re-auditioning.
- **Protected clip:** a single recording the owner has signed off is never re-recorded automatically, even if its character's voice changes. Use `--protect <line id>` and `--unprotect <line id>`.

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
- Ask the owner before a run that would record hundreds of clips.

## Relay broadcasters

The Relay's scripts are in `void-runner/relay-content.json`. Each segment has an id, a kind, the text and optionally a speaker.
- **Casting:** cast a broadcaster in the audition tool's **Relay broadcasters** section. Tick "Preview with the Relay transmission filter" to hear it as players will. Casting and approving locks the voice exactly like an NPC's.
- **Recording:** run the usual two commands. Only lines whose broadcaster has a voice are recorded; the rest show as captions in the game.
- **The filter** is applied live and is never baked into the recording.

## Not built yet

- **Broadcast voices:** the Relay's scripts are in (the owner's lines from his Relay brief; see `docs/VOID_RUNNER_RELAY.md`), and four broadcasters are cast **provisionally** (`news-anchor`, `warflying-host`, `police-recruiter`, `commercial-announcer`: stand-ins from 17 Oct 2026, not the owner's picks), so every fixed report line has a recording and plays on the radio. Each report line is its own clip; lines with leaderboard names filled in at play time stay captions. The Function is not cast.
- **Street advertisement screens (16 Nov 2026):** they play the existing recordings of the owner's seven space-station ads and his three news reports from where the screens stand; every other ad line, the government announcements and the WarFlying board's "#1" callout have **no recording and are silent** until the owner picks voices by ear. The audition lines, the pick sheet and the full clip list are in [`development/AD_SCREENS_VOICE_AUDITION.md`](development/AD_SCREENS_VOICE_AUDITION.md). Recording is switched on by `RECORD` in `void-runner/ad-screens-data.js`.
- The special-character slot stays reserved until the owner introduces that character.

## Companion voices and blends (2026-11-01)

- **Rule:** every VR companion has their own Kokoro voice, a woman's voice for the women and a man's voice for the men (the owner). `tests/vr-companion-voices.test.cjs` checks this, along with a description and recorded lines for every companion.
- **Cast:** Seren af_nicole, Nadia af_aoede, Ava af_alloy, Eva af_sky, Una bf_lily, Yuki bf_alice; Kai am_fenrir, Dex `am_adam:0.5+am_michael:0.5`, Zane `am_onyx:0.6+am_echo:0.4` (18 Nov 2026, generic for now at the owner's request). All are provisional, and every line is a DRAFT.
- **Blends:** Kokoro has only 13 English men's voices, and all of them were already cast. A registry voice can therefore be a weighted blend of 2–3 voices of the same sex, written `am_adam:0.5+am_michael:0.5` (weights add up to 1). A blend counts as its own voice; `voice-registry.cjs` checks it, and `generate.py` mixes the voice styles. The audition page still auditions single voices only.
