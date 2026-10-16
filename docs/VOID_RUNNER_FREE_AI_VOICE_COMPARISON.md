# VOID//RUNNER: Free AI Voice Comparison

**As of:** 2026-10-15 · Hardware tested: ASUS ROG Ally Extreme (AMD Ryzen Z1 Extreme, 11.7 GB RAM, AMD Radeon graphics, so **no NVIDIA CUDA**), Windows 11, Python 3.12.

## 1. What already exists in the game (inspected before choosing anything)

| System | Status | Where |
|---|---|---|
| Audio manager with master, music, effects, ambient and voice channels; saved settings | **Working** | `void-runner/ship-audio.js` |
| Adaptive procedural music (location styles, zones, combat, ducking) | **Working** (PR #53) | `music-director.js`, `music-score.js`, `music-engine.js` |
| **Pre-recorded NPC dialogue: 136 lines**, Kokoro-82M, rendered offline, Ogg/Opus, about 3.5 MB | **Working** (PR #54, #55) | `void-runner/assets/audio/voice/` |
| Stable line ids (`speaker-hash`) plus a per-NPC cast in `manifest.json` | **Working**, but the cast lives inside the manifest and has **no approval or lock** | `tools/voice/extract-lines.cjs` |
| Generator (renders only missing clips; `--force` re-renders) | **Working** | `tools/voice/generate.py` |
| Playback: lazy clip loading, subtitles paced to the clip, replay, skip stops the line, browser-voice fallback for runtime-built lines | **Working** | `void-runner/voice-clips.js` |
| Iris "95% natural" treatment and Elias hologram tone, applied live | **Working** | `voice-clips.js` |
| Test that fails if dialogue changes without its clip | **Working** | `tests/voice-clips.test.cjs` |
| Voice audition and approval tool | **Missing** | — |
| Central NPC voice registry with approval status, checksums and protection | **Missing** (partial: the `cast` block) | — |
| The Relay broadcasts and announcer voices | **Planned only** (brief received; nothing built) | — |
| WarFlying announcements | **Planned only** | — |
| Recorded sound effects | **Missing**: all SFX are synthesized live | `ship-audio.js` |

Every voice in the game today is **provisional**. David hasn't approved any of them yet.

## 2. Candidates

| | **Kokoro-82M v1.0** | **Piper** (LibriTTS-R voice) | **F5-TTS** | **Chatterbox** (Resemble AI) | **MeloTTS** |
|---|---|---|---|---|---|
| Naturalness | High for its size; natural pacing | Medium; clear but flatter | Very high | Very high, expressive | Medium–high |
| Voice selection | 54 stock voices (about 28 English: US and UK, male and female) | One model with 900+ LibriTTS-R speakers; other Piper voices vary in licence | Zero-shot cloning from a reference clip | Cloning from a reference clip | About 5 English accents, one voice each |
| Consistency | Exact: same voice id and settings give the same voice | Exact (speaker id) | Depends on the reference clip | Depends on the reference clip | Exact |
| CPU/GPU | CPU fine; ONNX build | CPU, very light | GPU strongly preferred | GPU preferred; Nano model CPU-capable | CPU real-time |
| Windows | Yes (tested) | Yes (official Windows build) | Possible; heavy | Possible; PyTorch | Possible; PyTorch |
| Speed here | **~0.4× real time** (1.4 s for a 3 s line); 2 s load | **~0.04× real time** (0.1 s per line); 2 s load | Not tested | Not tested | Not tested |
| Storage | 325 MB model + 28 MB voices + ~120 MB environment | ~80 MB voice + ~60 MB environment | Several GB | Several GB (PyTorch) | ~1–2 GB |
| Automation | Python script (in place) | Python or CLI | Python | Python | Python |
| Licence | **Apache-2.0** model and voices; trained only on permissive or public-domain data ([model card](https://huggingface.co/hexgrad/Kokoro-82M)) | Software **GPL-3.0** (moved to [OHF-Voice/piper1-gpl](https://github.com/OHF-Voice/piper1-gpl), Oct 2025; a dev tool only, not shipped). **Per-voice:** LibriTTS-R **CC BY 4.0** (commercial OK with attribution); Lessac is **research only**; Ryan is **CC BY-NC-SA** (non-commercial) | Code MIT; **pretrained weights CC-BY-NC** ([repo](https://github.com/SWivid/F5-TTS)) | MIT; **every file carries the Perth watermark** ([repo](https://github.com/resemble-ai/chatterbox)) | MIT ([repo](https://github.com/myshell-ai/MeloTTS)) |
| Commercial suitability | **Yes** | **Only for vetted voices** (e.g. LibriTTS-R, with attribution) | **No** (excluded) | Yes, but cloning needs reference voices we own; watermark | Yes, but too few voices |
| Ongoing cost | Free | Free | Free | Free | Free |
| Verdict | **Recommended** | Viable backup; lower quality | **Rejected** (non-commercial weights) | Promising for a later expressive pass; heavy; needs approval to download | Rejected (too little variety) |

Players never run any of these. All audio is pre-rendered and shipped as small Ogg/Opus files.

## 3. Identical-line test (Kokoro vs Piper, same three game lines)

| Line | Kokoro (cast voice) | Piper LibriTTS-R |
|---|---|---|
| Mara: "Elias passed away last night…Kestrel." (3 sentences) | af_nicole: 9.3 s audio, made in 6.3 s (first line includes warm-up) | speaker 92: 3.8 s audio, made in 1.7 s; **sentences run together with almost no pauses** |
| Admin: "Eh. Trouble's good for business…" | am_michael: 3.8 s, made in 1.4 s | speaker 20: 3.4 s, made in 0.1 s |
| Iris: "Of course. I'll keep the contract available. For now." | bf_emma: 2.8 s, made in 1.4 s | speaker 205: 2.9 s, made in 0.1 s |

The six sample recordings were sent to David for listening; they are not committed. Speed favours Piper, but both are fast enough for offline rendering, where even Kokoro renders all 136 lines in a few minutes. Naturalness and pacing must be judged by ear, and that is David's call.

## 4. Recommendation

**Keep Kokoro-82M as the production voice engine.** It's the only candidate that is simultaneously free, Apache-2.0 for both model and voices, natural-sounding, CPU-fast on the Ally with no NVIDIA dependency, and able to give a dozen-plus consistent, distinct stock voices without cloning anyone. It's already installed and wired into the game, so nothing needs replacing.

- **Piper** stays a documented fallback, using only voices whose model card names a commercial-use licence.
- **F5-TTS** is excluded for production.
- **Chatterbox** could be revisited for an expressive Iris or Relay pass. It would need David's approval for the large PyTorch download, plus reference voices we own the rights to.

## 5. Sources checked
- Kokoro: https://huggingface.co/hexgrad/Kokoro-82M (Apache-2.0; data sources listed)
- Piper: https://github.com/rhasspy/piper (archived Oct 2025, MIT) · https://github.com/OHF-Voice/piper1-gpl (GPL-3.0) · voice cards: lessac (Blizzard 2013 licence, research only), ryan (CC BY-NC-SA 4.0), libritts_r (CC BY 4.0)
- F5-TTS: https://github.com/SWivid/F5-TTS (weights CC-BY-NC)
- Chatterbox: https://github.com/resemble-ai/chatterbox (MIT; Perth watermark)
- MeloTTS: https://github.com/myshell-ai/MeloTTS (MIT)
