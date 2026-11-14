# MILKED

An **adult livestreaming service and sperm bank**, at the east end of The Avenue in NeoChinatown. **It is not a nightclub.** It is a believable futuristic business with two connected services behind one front door.

Code: `void-runner/milked.js` (data, collision, interactions and the 3D build), `void-runner/milked-integration.js` (interaction handlers), plus small hooks in `neochinatown.js`, `taxi-rules.js`, `city-taxi.js` and `district-map.js`.

Status: **built, provisional.** All dialogue is placeholder text, not approved canon.

## Content rules (enforced in the build)

Everyone is clothed and an adult. No nudity or sexual activity, no visible specimen collection or procedures, no player sexual interaction. Performer screens show a clothed silhouette swaying to a beat. Clinical areas are sealed equipment, closed containers and fictional interface displays. This is environmental storytelling, not a working medical service.

## Where it is

- Building footprint `FOOTPRINT = [212, 248, -46, 16]` (x east, z north, metres). The street face is the west wall at x = 212; the door is at z -12.5.
- The plaza in front is `[200, 212, -30, 5]` (`streets.milked`). Taxi stop: `(206, -23)`, id `milked`.
- It sits entirely inside the old placeholder plaza and the walled city. Landing pad (x 13 to 37.5, z -106 to -86), the avenue and every road are untouched. A test enforces that.
- It streams in at about 90 m and is disposed beyond about 140 m, through the existing `streamDistricts` in `neochinatown.js`. The state `city.live.get('milked')` is the live controller.

## Rooms (`ROOMS` in milked.js)

| Wing | Rooms |
|---|---|
| Public | **Reception** (lobby with Eva's desk, check-in screens, kiosk, sofas, lit floor lines, signs) |
| Streaming | **Streaming wing** hall, **Studio 1, 2, 3**, **Streaming operations** |
| Biobank | **Biobank appointments**, **Consultation (private)**, **Biobank laboratory** |
| Office | **Back office** (Fish) |

Each studio is a creator's room: ring light, camera on a tripod, microphones, a console desk with monitors, a live-feed display with a fictional viewer count and chat overlay, an ON AIR plate, a dressing/preparation corner behind a solid screen, and a clothed performer placeholder on a small stage. The feeds are tiny canvases redrawn about once a second (no video).

The biobank wing is pale and clinical: appointment kiosk, frosted privacy-screened consultation booth, a laboratory with benches, a centrifuge, sealed vial rows, five cryogenic storage units and an inventory / chain-of-custody display. A **STAFF ONLY** door is solid.

Operations room: server racks, a network-status monitor wall, camera control and privacy/security indicators.

## Characters (provisional)

| Id | Display name | Where | Placeholder model |
|---|---|---|---|
| `milked-eva` | Eva (`CONFIG.EVA_NAME`) | Behind the reception desk | crowd look `ncz-neon` |
| `milked-fish` | Fish (`CONFIG.FISH_NAME`) | Beside his desk in the back office | crowd look `fixer-01` |

Both are clothed. Eva is **not** the VR bedroom companion Eva. Her lines keep her Origins background (livestream performer, neural-network engineer) without replaying Origins. Fish has no invented backstory.

Four ambient people also use crowd looks: two studio performers (three on Medium and above), an operations technician and a laboratory technician; two lobby guests on Medium and above.

### Replacement points (for the owner's future models)

Open `void-runner/milked.js` and find the block `==== WHERE TO CHANGE THINGS ====` at the top.

- **Fish's name:** `CONFIG.FISH_NAME`. This is the only place the literal is written; the dialogue label, the map place and the editor entry follow it (a test proves this).
- **Eva's model:** `MODELS.eva` (`id: 'milked-eva'`). Package the real model with the usual private asset process, then set `asset` to its id. `create()` uses it when `VoidAssets` has it and otherwise falls back to `look`.
- **Fish's model:** `MODELS.fish`, same way.
- **Dialogue:** `DIALOGUE` in the same file.

### Editor registries

- `tools/audio/npc-voice-registry.json` lists both as **provisional** (the editor's NPC view reads it). The voices are blends of existing Kokoro voices because every single female voice is taken; they are placeholders to audition, nothing is generated, and nothing is approved.
- `void-runner/milked-integration.js` registers both in `VoidStoryContent.characters` at runtime so the dialogue window shows their names.
- `void_runner_admin_inventory.json` was regenerated (`node tools/admin-inventory.cjs`).

## Mission 3 (inactive data)

`MISSION` in milked.js: id `meet-eva-milked`, title MEET EVA AT MILKED, NPC `milked-eva`, location `milked`, `active: false`, status `inactive`. Nothing registers it with `VoidMissions`, nothing starts it, and the six beginner missions are unchanged. A test enforces all three.

## Taxi and map

- Sky cab: Milked is a destination with the normal fare formula (capped at 60 CR). `taxi-rules.js` marks it built (`placeholder:false`) and keeps `streams:true` so the cab holds over the plaza until the building has loaded (`city-taxi.js districtReady`).
- Road taxis: not added. The street taxi registry skips district zones, and the road network does not drive the plaza. Noted as a follow-up.
- V1 Map: the building outline, its walls, a taxi stop, and named places (entrance, reception, streaming wing, biobank wing, Fish's office). The old "not built" developer marker is gone for Milked.

## Save compatibility

No new save fields, location ids, mission ids or flags. A conversation records the usual `story.met` entry (`milked-eva`, `milked-fish`), which the server already accepts.

## Tests

- `tests/milked.test.cjs`: identity, ids, configurable name, replacement points, taxi, map, inactive mission, rooms, clear of the pad and roads, reachability of every room and interaction, no save fields.
- `tests/milked-browser.cjs`: a real-browser walkthrough with screenshots (stream in, doorway, Eva, studios, ops, biobank, consultation, lab, staff door, Fish, map, a real sky-cab trip, unload). Screenshots are in `docs/development/milked/`.
- Updated for the new geometry: `district-areas`, `environment-seam`, `district-map`, `road-taxi`, `city-taxi` tests.

## Known limits

- Lighting is emissive and ambient only (no new real lights, so the 8-lights-per-material rule is not at risk). Interiors are moody; the office and lobby are dim.
- Performers and staff are ordinary crowd models; they animate with the crowd system's clips.
- No multiplayer presence inside Milked (the street is not a shared place).
- Road taxis do not stop here.
