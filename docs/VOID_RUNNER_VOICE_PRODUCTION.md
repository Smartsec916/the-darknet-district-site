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

## Imported voice files (19 Nov 2026)

Since build `2026-11-19-voice-import-1` the owner can make a line's audio himself (for example in ElevenLabs, with his own account) and **import the file** next to the line in Developer Tools (Mission Editor lines and NPCs > Lines & voice). Rules and code: `void-runner/voice-imports.js` (browser and Node), `void_runner_live_content.py` (server), playback through `void-runner/voice-clips.js`.

- **Files:** MP3, WAV or Ogg are kept as they are when 600 KB or smaller; anything bigger (or M4A / WebM / FLAC, when the browser can play them) is re-encoded in the browser to Ogg Opus, mono, 24 kHz, 48 kbps (WebCodecs `AudioEncoder`; a tiny Ogg muxer in voice-imports.js). 40 seconds at most. A browser without `AudioEncoder` refuses a too-big file and tells him to download a lower-quality MP3 from ElevenLabs.
- **Precedence:** an imported file overrides any generated or recorded clip for that exact line text (speaker + words, voice tags removed). The speaker's live effect still applies (Iris android, Zen Zephyr's monk filter). If the words change afterwards, the line says "text changed since the voice was imported" and the file is not sent or used for the new words.
- **Storage:** the draft keeps a small record per line (`local().clips`, also in the server copy of the draft; never the audio). The audio stays in the browser (IndexedDB `void-runner-voice-imports`) until PUBLISH, which first uploads each file the server lacks: `POST developer/voice-clips {hashes}` lists what is missing, `POST developer/voice-clips/<sha-256> {type, data}` stores it (content editor only, publishing switched on; the server re-checks the address, the type from the bytes, 600 KB, and the length read from the WAV / Ogg / MP3 headers). One Firestore document per file in `vr_voice_clips` (base64, under the 1 MiB document limit), created once. Published content lists the files as `content.clips` `[{who, text, hash, type, duration, bytes}]`; publishing refuses a file that is not stored. Firebase Storage is not used.
- **Players:** `GET /api/void-runner/voice-clip/<sha-256>` (public, no sign-in, `Cache-Control: public, max-age=31536000, immutable`; 404 when publishing is off); the game keeps a copy in the Cache Storage (`void-runner-voice-imports-v1`). The server keeps up to about 12 MB of files in memory to save Firestore reads.
- **Moving files into the repository:** `python tools/audio/bake-imported.py --dry-run`, then without `--dry-run`. It reads the published content and files from the public API (or `--content-file` + `--clips-dir`, or `--firestore` with your own local service-account key in `GOOGLE_APPLICATION_CREDENTIALS`, never committed), checks each file's SHA-256, and writes `void-runner/assets/audio/voice/extra/<speaker>-imp-<hash10>.ogg` (Ogg Opus 24 kHz mono via ffmpeg + libopus) plus a manifest entry (`importedHash`, and `importedText` when the line had voice tags). `--repo DIR` writes into another checkout. Then `npm test`, bump `BUILD`, commit. Once baked, the import can be removed from the published content.
## Voice tags and models (19 Nov 2026)

The owner can type ElevenLabs audio tags in square brackets into any line, e.g. `[whispers] Keep it down.`, and choose each ElevenLabs voice's model in the Voice box (build `2026-11-19-voice-tags-1`). Rules and models live in `void-runner/npc-voices.js` (`tagProblems`, `strip`, `speakText`, `MODELS`); the server repeats them (`void_runner_drafts.py` `voice_tag_problems` / `strip_voice_tags`, `void_runner_live_content.py` `speak_text` / `voice_model`).

- **Tags:** lowercase letters, spaces and hyphens, 30 characters at most each, 6 per line. Players never see them (removed where content is adapted for the game).
- **Models** (credits per character are estimates on the self-serve plans): `eleven_v4` Eleven v4 (newest; reads tags; Zen Zephyr's model; the default), `eleven_v3` Eleven v3 (reads tags), `eleven_multilingual_v2` (about 1 credit, no tags), `eleven_flash_v2_5` and `eleven_turbo_v2_5` (about 0.5 credit, no tags). A `revoice-engines.json` entry may carry `model`; without one the model in "(model ...)" of `chosen`, else Eleven v4.
- **Queue:** each queued line stores `text` (what players see; the clip id is `who + sha1(who|text)` as before) and, when it differs, `speak` (what the voice is sent) plus `model` for ElevenLabs lines. Tags are kept only for Eleven v4 / v3; Kokoro and the other models get the line without them (Kokoro would read them aloud). Changing only a tag re-queues an ElevenLabs line; for a Kokoro voice it is not a change (the editor does not mark the clip out of date).
- `generate.py --from-queue` strips tags from Kokoro lines and lists waiting ElevenLabs lines with the text as sent, the model, and credits at each model's rate. Nothing is sent to ElevenLabs from here.

## The Awakening continuation's lines: NEEDS APPROVAL BEFORE RECORDING (20 Nov 2026; partly recorded 21 Nov 2026)

Missions 004–012 (`void-runner/main-story.js`, branch `claude/awakening-tree`) add about 102 lines, text only on 20 Nov. **21 Nov 2026 (branch `claude/awakening-voices`):** at the owner's request ("Voices for five characters: just make generic voices for now"; for Fish: "can you make them? you have Fish's voice") the associates', Juno Vex's, the Blackrock associate's, Halden's and Fish's Mission 004 lines are recorded with ElevenLabs eleven_v4 (`void-runner/assets/audio/voice/extra/`, entries in its `manifest.json`; the five new voices are **generic placeholders the owner may replace**, recorded in `tools/audio/revoice-engines.json`). No approved voice was changed. Admin, Iris, Rook and the robed chorus are still text only. Before any recording the owner approves the spend (the re-voice queue, as for every editor line) or imports his own files in the Mission Editor.

| Speaker | Lines | Characters (about) | Voice today |
|---|---|---|---|
| Iris | 33 | 2,550 | her approved ElevenLabs voice (revoice-engines.json) |
| Admin | 35 | 2,450 | his approved ElevenLabs voice |
| Fish | 10 | 830 | **RECORDED 21 Nov 2026** in her approved voice (`ggacvEjbmpoSuEinfFWs`): each line in Mandarin (`fish-m004-zh-1`..`10`) with the owner's English in her own voice (`fish-m004-en-1`..`10`) linked as its V1 translation (offset and volume: `translations['milked-fish']`). Lines 1–7 are her Comms call that starts Mission 004, 8–10 her reply call after the report. The calls show the Mandarin with the owner's English under it as V1 TRANSLATION, and each line waits until it has been heard (personal-device.js) |
| Associate 1 / Associate 2 | 3 / 3 | 215 / 120 | **RECORDED 21 Nov 2026**, generic placeholders: Associate 1 "Douglas" (`9dOAtmZTvILoncEvsUKb`), Associate 2 "Harper Lawson" (`c1uwEpPUcC16tq1udqxk`); played as the lines are overheard (mission-mechanics-game.js) |
| Juno Vex | 3 | 170 | **RECORDED 21 Nov 2026**, generic placeholder "Everley Rhodes" (`Xm5W2LBUW4LWizr18Fbd`); her figure is now a woman's model (`npc-cyber-exec`) |
| Blackrock associate | 2 | 165 | **RECORDED 21 Nov 2026**, generic placeholder "Jim" (`JjqNMa6BEYmyQYRCdHCa`); his figure (arena and the Far South follow) is now a man's model (`npc-fixer`) |
| The six (in unison) / Halden (the initiate) | 7 / 4 | 635 / 33 | the six: **voices APPROVED by the owner 20 Nov 2026** (revoice-engines.json `robed-1`..`robed-6`: Blackrock Member 1 (Jacob L.), 2 (Edward Sterling), 3 (Cole), 4 (Alex), 5 (Dean), 6 (Gareth); eleven_v4, tag [slow, solemn, ceremonial]); every `robed-all` line and the laugh follow the owner's "half in sync" chorus recipe stored as data in `cult-room.js CHORUS` (1-3 together at 0 / 20 / 10 ms, 4 about 230 ms late, 6 about 160 ms late, 5 about 6% faster, the drifting three at 80-85%, light room echo). The six's lines themselves are NOT recorded. Halden (speaker `initiate`): his 4 lines **RECORDED 21 Nov 2026**, generic placeholder "Darren" (`74s0ZNaUEOKhDHSxgJZq`), played in the camera feed (camera-feed.js now speaks through the game's voice channel). Each line also has an IMPORT VOICE FILE slot |
| Rook (PROPOSED placeholders) | 2 | 117 | his approved voice; the lines themselves are not approved |
| Iris, First Cargo Delivery tutorial (Mission 012) | 6 approved + 11 new | about 1,200 | her established ElevenLabs voice (`CvD6hF1BJzAFN428j1cO`, revoice-engines.json); the 11 new lines (`main-story.js IRIS_NEW`) need owner approval before recording |

The First Cargo Delivery's Admin / Iris / Rook lines are PROPOSED placeholders (`PROPOSED_CARGO`): never record them before the owner approves the words.

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
