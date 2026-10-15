# VOID//RUNNER: Audio Audit (Phase 1)

**As of:** 2026-10-15 · `main` after PR #49 · Status: **audit only, nothing changed.** Decisions marked ⚑ need David's approval before Phase 2.

## 1. What exists today

| Area | Current system | Files |
|---|---|---|
| **Audio manager** | One Web Audio manager (`VoidAudio`) with master, music, effects and voice channels. Settings (on/off, master, music, effects, voice, voice on/off) persist in the browser. Unlocks on first input, as browsers require. | `ship-audio.js` |
| **Music** | Two parts. (1) **Procedural drones:** sustained oscillator chords per "profile" (flight, bar, menu…), plus a tension tone in combat or at low health. (2) **Radio player:** plays local files by region (flight, combat, district, bar, station, sleeping pod…), but **every track list is empty, so the game ships no music files.** | `ship-audio.js`, `radio.js`, `exploration-data.js` |
| **NPC voices** | **Browser speech synthesis** with a pitch/rate profile per character (Mara, Elias, Rook, Iona, Dr. Sol, Nyx). Admin, Iris, Elara, Marcus and the player have **no profile** and fall back to Rook's voice settings. Quality and voice depend on the player's operating system. | `ship-audio.js`, `story-content.js` |
| **Generated voice hook** | A ready but unused path that plays pre-generated clips from a same-origin endpoint, with caching, cancel and 3D positioning. No keys in the client. | `voice-provider.js` |
| **Sound effects** | All synthesized live (no sample files): lasers, enemy fire, explosions, warp charge/exit, per-ship engine hum (each ship has a frequency, wave and roughness), footsteps, pistol, doors. | `ship-audio.js` |
| **Spatial audio** | Voice clips and explosions can be positioned; most other sounds are flat. | `voice-provider.js`, `ship-audio.js` |
| **Volume controls** | Master, music, effects, voice. **No separate ambient slider.** | Settings menu |

**Bottom line:** the plumbing is sound (central manager, channels, persistence, a voice-clip hook), so a full rewrite isn't needed. What's missing is content (no music files, no recorded voices, no sound samples) and the logic for music zones, states and crossfades.

## 2. Location-by-location music direction (from inspecting each environment)

| Location (id) | What it is in game | Musical direction | Track |
|---|---|---|---|
| Main menu | Meridian Station exterior | The VOID//RUNNER theme: slow pads, a four-note motif reused across the game | Dedicated |
| Vesper (`vesper`) | Ward Freight Workshop; buttes, dust, a handful of habitats | Sparse warm pads, plucked motif, light mechanical clinks; melancholic but hopeful; no heroics in the tutorial | Dedicated |
| Meridian Station (`meridian`) | Hangar → outfitter → corridor; busy crossroads | Warm electronic ambience, soft mechanical percussion, relaxed tempo | Dedicated |
| The Dead Channel (Meridian bar) | Bar at the end of the corridor | Downtempo lounge, gritty bass; **in-world speaker** that fades as you walk away | Dedicated, spatial |
| Kepler, Rusthaven Port, The Foundry, Tessaly Belt Anchorage | Working stations sharing one interior plan | Share the station theme with different mixes: Kepler cleaner, Rusthaven grimier (magenta), Foundry heavier industrial percussion, Belt Anchorage brighter commercial | Shared theme, 4 mixes |
| NeoChinatown street (`earth`) | Skyscrapers, corporate ads, The Function | Dark synthwave, deep bass, ad-saturated city texture | Dedicated |
| The Darknet District | Door, scan, hallway, store, bar, VR, vending, pods, meeting room, smoking area | Strongest cyberpunk identity. One District theme with zone layers: tense at entrance and scan; full theme in the hallway; quiet controlled mix at the store; stronger lounge beat at the bar; bright arcade layer by VR and arcade; near-silence at pods and in the meeting room; distant muffled mix on the smoking terrace | 1 theme + zone layers |
| Vantor (`mars`) | Underground city, transit canteen | Low subterranean drones, distant machinery, restrained | Dedicated (short) |
| The Vigil (`vigil`) | Communion; pale, cyan-lit, panel wall | Ethereal pads, clean bell-like synth, choral-like textures, elegant rhythm; reverent, not sinister | Dedicated |
| Holdfast (`holdfast`) | Natural Order; steel, pipework, amber | Hand percussion, low string-like synths, analog tones, steady work rhythm; resilient | Dedicated |
| Open space and warp | Flight between stations and systems | Very sparse, long harmonic changes, silences between phrases; warp gets a rising swell | Dedicated, sparse |
| Asteroid / danger | Belt and hazard routes | Low drones, sparse pulses, metallic hits; no combat drums until combat starts | Layer over space |
| Derelict station | Gangs, pirates, catwalks | Dark ambient, long near-silence, odd mechanical sounds | Dedicated, sparse |
| Combat | Space and FPS | Intensity layer over the current location's theme (Communion combat stays bell-like; Natural Order stays percussive); short cooldown, then a fade back without restarting | Layers |
| Faction battles (PR #50) | Background fights | Subtle tension layer only; never player-combat music | Layer |

**Music states:** menu, safe location, exploration (flight), danger, combat, post-combat, dialogue (music ducks about 30%), warp, docking. Transitions crossfade over 2–4 s, with a few seconds of hysteresis so zone edges don't flicker.

## 3. ⚑ Decision: where the music comes from

I can't access any music-generation tool from here, and I won't claim a track exists unless a playable file does.

| Option | Cost | Quality and fit | Notes |
|---|---|---|---|
| **A. Procedural, in-code** (Web Audio synths, sequenced patterns, built per location) | Free | Original and adaptive. Very good for ambient, drones and pulses. Cyberpunk beats are possible but sound synthetic. | I can build and test it entirely here. Tiny download. Real playable output. |
| **B. CC0 / royalty-free libraries** (OpenGameArt CC0, Pixabay license, etc.) | Free | Variable quality; not unique to VOID//RUNNER | Needs curation and per-file licence records. I'd need your OK to download. |
| **C. AI music you generate** (e.g. a paid Suno or Udio plan, which grants commercial rights) | About $10–30/month while producing | Strong cyberpunk and lounge tracks quickly | You generate from my written briefs; I integrate and log licences. |
| **D. Commissioned composer** | One-time fee | Best and most cohesive | Slowest |

**Recommendation:** build the adaptive music system with **A** now (states, zones, crossfades, combat layers, all locations covered), so every location has original music immediately. Make the system swap in **C or D files** per location whenever you supply them, keeping A as the fallback.

## 4. ⚑ Decision: NPC voices

| Option | Cost | Naturalness | Consistency | Notes |
|---|---|---|---|---|
| 1. Browser speech (current) | Free | Robotic; varies by OS | Poor (different voices per machine) | Fallback only |
| **2. Offline neural TTS, pre-rendered** (Kokoro-82M, Apache-2.0) | Free | Good, natural pacing; moderate emotion | Exact same voice for every player | Needs Python plus a model of about 350 MB on this PC (your OK to install). Files ship with the game, about 30–60 KB per line. No runtime service or keys. |
| 3. Paid neural TTS, pre-rendered (e.g. ElevenLabs) | About $5–22/month while producing | Best, expressive | Same | Commercial use on paid plans; generated offline, no keys in the game. |

**Recommendation:** **2** for every approved line, with stable dialogue IDs mapped to files, subtitles kept in sync, and skip/replay. Keep browser speech as the fallback. Iris gets her "95% natural" treatment applied live in Web Audio: a very light high-shelf sheen, a faint short comb resonance and a tiny chorus. No vocoder or pitch wobble. No voice will imitate a real person.

Proposed voices: Mara (mature, weary female), Elias (warm older male, hologram band-pass and flicker), Rook (gravelly mid male), Admin (relaxed, dry mature male), Iris (smooth articulate female, plus the treatment above), Elara (composed educated female), Marcus (rough practical male, distinct from Rook and Admin), Nyx, Iona and Dr. Sol given distinct voices.

## 5. Weapons, ship and environment (Phases 4–7)

- **Starter handgun:** the Ward pistol is built from Babylon geometry. An import hook for `assets/models/weapons/ward-pistol.glb` exists, but no model is supplied (`opening-data.js`), so a Blender model from you could replace it later. Phase 4 will detail the model (slide, grip texture, bore, trigger guard), add a synchronized muzzle flash, slide cycle and recoil, and a ballistic sound set (shot, slide, magazine out/in, dry click), all with stats unchanged.
- **Ships:** engine and warp sounds already follow throttle and ship profile. Planned additions: startup and shutdown, thruster puffs, strain, cockpit hum and rattle, a layered warp charge and exit, shield vs hull impacts, faction weapon timbres (Communion clean and precise, Natural Order heavy).
- **Environment:** footsteps by surface, machinery and vent loops per station, door, terminal and purchase sounds, and positioned sources for the bar speakers and machines.
- **Mixing:** add an **ambient** volume slider; dialogue ducks music; a limiter on the master channel prevents clipping.

## 6. ⚑ Other approvals needed

1. Installing Python and downloading the free Kokoro model (option 2 above).
2. If you choose music option C: which service, and you generate the files.
3. Sound effects: keep them synthesized (free, original) or add CC0 samples (download approval).
