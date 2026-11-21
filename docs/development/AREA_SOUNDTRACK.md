# Area soundtrack and environmental sound (15 Nov 2026)

The owner asked for the code-generated background music to be replaced by recorded music made with ElevenLabs, one loop per existing area, plus environmental sound. This is what was built, where it lives and how to change it.

## What plays where

| Area | Music file (`void-runner/assets/audio/score/`) | Ambience |
|---|---|---|
| Main menu | `theme.ogg` | none |
| NeoChinatown streets | `neochinatown.ogg` | rain, distant city; wet footsteps |
| Alley behind the District | `alley.ogg` | dripping, lighter rain; neon buzz at the District door |
| Security vestibule | `district-entry.ogg` | ventilation; scanner hum; lock clunk on passing through; metal footsteps |
| District hall | `district-hall.ogg` | ventilation |
| Store | `district-store.ogg` (quiet) | terminal hum at the counter |
| Bar and oxygen lounge | `district-bar.ogg` | neon buzz at the bar |
| VR play area | `district-vr.ogg` | rig hum |
| Arcade | `district-arcade.ogg` | arcade machines, from where the cabinets stand |
| Sleeping pods end of the hall | the hall's music, much quieter | ventilation |
| Smoking terrace | the hall's music, muffled through the wall | rain, distant city |
| NULL nightclub | `nightclub.ogg` (heard from the street by distance and through the walls, as before) | none inside |
| Milked | `milked.ogg` | ventilation |
| Corporate District | `corporate.ogg` | plaza hum; metal footsteps |
| Zen Zephyr Temple | `temple-chant.ogg` (18 Nov 2026: the owner's commissioned 288 s chant, looped seamlessly in Web Audio, ducked to about 38% while Zen Zephyr's conversation is open; see `TEMPLE.md`) | wind and chimes |
| Flight (all three systems) | `space.ogg` | none |

**There is no "black market" area in the game** (the owner's list named one). No location was created for it; when one exists it needs one more track.

**Still generated in code (no recording yet):** the older-campaign places that the District-first game does not currently send players to (Vesper, Meridian, Kepler, Rusthaven, Foundry, the Belt Anchorage, Vantor, The Vigil, Holdfast, the Nexus, the Order homeworld, the derelict station) and the warp and hazard cues in flight. Each would be one more 900-credit track.

## How it works

- `void-runner/music-score.js`: `files` maps an area to its recording. An area with a file plays the file; one without falls back to the generated score. A file that fails to load also falls back.
- `void-runner/music-director.js`: decides the area from where the player stands (`districtZones` for the inside of the District in plan metres, `streetZones` for the alley and Milked in street metres, `place` for the Corporate District and the temple). Changes between neighbouring areas wait 1.4 seconds so a doorway never flickers. `neighbours` lists the areas next to each one; their recordings are fetched ahead.
- `void-runner/music-engine.js`: plays the file through the Music channel, crossfades over about three seconds, and keeps every recording on one clock, so walking out of a room and back never restarts its track. During flight combat the generated combat drums still play over the recording.
- `void-runner/music-integration.js`: no area music in a sleeping pod (waking or making a character), in VR, or while the player's own pod playlist plays. The music steps back a little (30%) while anyone talks on voice chat, as it already did for spoken lines.
- `void-runner/area-ambience.js`: the environmental sound. Beds per area, emitters heard by distance and side, the lock, and recorded footsteps per floor (used by `footsteps.js` for other people and by the player's own step). Ambience is on the Ambient channel; steps and the lock on Effects.
- Volume: the Settings screen already had separate sliders for Music, Sound effects, Ambient and Voice; the new sound uses those channels, so each can be turned down on its own.
- The Sleeping Pod playlist (27 Riffusion songs, `pod-music.js`) was not changed.

## Loading

Nothing is downloaded up front. A track is fetched when its area is entered, and its neighbours' tracks just after. Ambience files are fetched when an area that uses them is entered. Sizes: music about 0.5 to 0.9 MB per loop (9.5 MB for all 14), ambience 1.5 MB for everything. The service worker keeps what has been fetched.

## Changing a track

Replace the `.ogg` in `void-runner/assets/audio/score/` (same name), bump `BUILD` in `void-runner-sw.js`. To make a loop from a new recording: level it, cut any quiet intro and ending, and blend the last 3 seconds into the first 3. To add an area: add a style and a file in `music-score.js`, a zone in `music-director.js`, a bed in `area-ambience.js`, and a row here and in the two `LICENSES.md` files. `tests/music.test.cjs` and `tests/area-ambience.test.cjs` check that every named file exists.

## Not verified

The cloud test machine has no speakers. What was checked: every room resolves to the right track and ambience in a real browser run, every file loads, the pod is silent, levels are even across tracks, and each loop's seam was matched by analysis. **Nobody has listened to it yet.** The owner should listen for: any track whose mood is wrong, a loop seam that can be heard, and the balance of ambience against music.

## Cost

14 music tracks at 900 credits = 12,600; sound effects 610; **total 13,210 ElevenLabs credits** (cap was 15,000). One take each, nothing regenerated.
