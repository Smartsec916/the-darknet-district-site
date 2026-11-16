# Characters and assets made with Meshy

David upgraded his Meshy account on 15 Nov 2026 (1,100 credits a month) and authorised its use for the graphics modernization, without asking per asset. He must not be charged for more: no credit purchases, no plan changes.

## How a character is made (all of it runs without David clicking anything)

Everything on David's PC is run through the Blender bridge, as separate background processes; his open Blender scene is never touched.

1. **Concept** (9 credits): `meshy image-to-image create --ai-model nano-banana-pro` with David's reference picture and a prompt asking for the same person full body, A-pose, front view, plain grey background. Half-length portraits cannot go straight to 3D: the model would stop at the waist.
2. **3D** (30): `meshy image-to-3d create --input-task-id <concept> --pose-mode a-pose --should-texture true --enable-pbr true --texture-resolution 4k`. The result is about 930,000 triangles.
3. **Remesh** (5): `meshy remesh create --input-task-id <3d> --topology triangle --target-polycount 45000`. Rigging refuses more than 300,000 faces, and the game wants about 45,000.
4. **Rig** (5): `meshy rigging create --input-task-id <remesh> --height-meters 1.8`. One skinned mesh on a 24-joint skeleton (no fingers), 4096 maps.
5. **Game clips:** `tools/animation-pipeline/prepare_meshy.py` (smaller maps, drops Meshy's clip), then `build_imported_character.py` with a spec in `characters/` (`optionalBones: true`; Meshy's `Spine02 / Spine01 / Spine / neck` are the game's `Spine / Spine1 / Spine2 / Neck`). The walk comes from a shipped character (`--crowd`).
6. **Into the repository:** the GLB comes back to the cloud session as base64 in tool results, textures are re-encoded (`tools/assets/optimize-textures.cjs`, 2048), and the file goes in `void-runner/assets/models/crowd/npc-<name>.glb` with its clips listed in `crowd.js`.

The CLI on David's PC is 0.8.6: `--async` on create, then `meshy <resource> get <id>` to poll and `-o <dir>` to download. The plugin's skill text describes 0.4.0 and some of its flags (`--output-schema`) do not exist in 0.8.6.

## In the game

- `district-people.js`: a resident with `model:'npc-<name>'` is drawn from that file in the scene (`neochinatown.js` staff) and in the profile picture; the old creator look in `appearance` is the fallback if the file fails to load.
- `npc-*.glb` files are not part of the 22 MakeHuman characters: the tests that pin those skip them, and they get no street gear (they come dressed).

## Ledger

| Date | What | Task | Credits |
|---|---|---|---|
| 15 Nov | Admin concept | image-to-image `01a1e019-37f5…` | 9 |
| 15 Nov | Admin 3D | image-to-3d `01a1e01a-1f58…` | 30 |
| 15 Nov | Admin remesh 45k | remesh `01a1e021-97c3…` | 5 |
| 15 Nov | Admin rig | rigging `01a1e024-914a…` | 5 |
| 15 Nov | Iris concept | image-to-image `01a1e023-ed62…` | 9 |
| 15 Nov | Iris 3D | image-to-3d `01a1e025-5be1…` | 30 |
| 15 Nov | Iris remesh 45k | remesh `01a1e029-51c6…` | 5 |
| 15 Nov | Iris rig | rigging `01a1e032-0b3f…` | 5 |
| 15 Nov | Seven residents' concepts (Rin, Jonah, Sable, Kei, Mags, Tavi, Bishop), text-to-image, 9 each | task ids in `Documents/DarknetDistrict_Assets/Meshy/residents/concepts_status.json` on David's PC | 63 |
| 15 Nov | The same seven: 3D (30), remesh (5), rig (5) each | `.../residents/build_status.json` | 280 |
| | **Total to 15 Nov** | | **441** |
| 16 Nov | Nyx (bartender) concept, image-to-image from David's picture of her behind the oxygen bar | `01a1e4a9-18a9…` | 9 |
| 16 Nov | Nyx 3D | image-to-3d `01a1e4aa-e074…` | 30 |
| 16 Nov | Nyx remesh 30k | remesh `01a1e4ac-b1d4…` | 5 |
| 16 Nov | Nyx rig | rigging (id in `Documents/DarknetDistrict_Assets/Meshy/nyx/build_status.json`) | 5 |
| 16 Nov | Seven District props (oxygen tank, bar stool, oxygen station, VR headset, pistol, radio, flashlight): text-to-image 9, image-to-3d 30, remesh 5 each; the flashlight's picture was made twice | `Documents/DarknetDistrict_Assets/Meshy/district_props/status.json`; table in `DISTRICT_UPGRADE.md` | 317 |
| | **16 Nov, District second pass** | | **366** (David's limit for it was 400; the account showed 1,767 before and 1,401 after) |
| 16 Nov | Twelve city-kit props for the NeoChinatown remake (AC cluster, balcony, shutter front, water tank, roof plant, fuel bowser, cargo loader, crate stack, dumpster, vending machine, scooter, customs booth): text-to-image 9, image-to-3d 30, remesh 5 each | `Documents/DarknetDistrict_Assets/Meshy/ncz_port/status.json`; `NEOCHINATOWN_REMAKE.md` | 528 |
| 16 Nov | A food-stall concept picture (not taken to 3D; generation was stopped) | same file | 9 |
| 16 Nov | Road taxi: text-to-image 9, image-to-3d 30, remesh 20k 5 | `Documents/DarknetDistrict_Assets/Meshy/ncz_taxi/status.json` | 44 |
| | **16 Nov, NeoChinatown remake (stopped by David before it was finished; the models are parked)** | | **581** (limit 600; the account showed 1,401 before) |

A full character costs about 49 credits, so the month's 1,100 is roughly 22 characters, or fewer characters plus props (a prop from a picture is about 30).

## Rights

Generated on David's paid Meshy plan from his own reference pictures (which he made with Midjourney). Recorded in `docs/VOID_RUNNER_ASSET_LICENSES.md`. David to confirm his plan's terms give him private ownership of the outputs; on that basis they are stored in this public repository like the game's other own assets.

## Doing several at once (15 Nov)

`Documents/DarknetDistrict_Assets/Meshy/residents/` on David's PC holds two small runners started with Blender's own Python as detached processes: `concepts.py` (all concept images in parallel from `prompts.json`) and `build_all.py` (3D, remesh, rig, prepare and convert for each, four at a time, writing `build_status.json`). `%TEMP%/meshy_build/shrink_glb.py` then re-encodes the PNG maps inside each GLB as JPEG so a character is about 4 to 5 MB, small enough to bring back in two pieces.

Lessons: never `time.sleep` inside a `bl_execute` call (it blocks Blender and the bridge times out): start a detached process and poll with instant calls. Never return more than about 3.5 million characters in one call: a whole 12 MB file dropped the bridge connection. Wait between polls with a shell `until` loop on the clock.

## Residents (15 Nov)

`district-people.js` `own` names a resident's own model; `lookFor(crew)` returns it, `crowd.js` loads it with the District interior and `pick()` gives it to their spot. If a file fails to load, a look of the place stands in. Residents done: Rin Takeda, Jonah Pike, Sable Quon, Kei Navarro, Mags Oduya, Tavi Rourke, Bishop Hale. Nyx (bartender) was done on 16 Nov from David's own picture: `model:'npc-nyx'` in `district-people.js`, 30,942 triangles, clips idle, talk, walk, look, watch, laugh, shrug, wipe; she is placed by `neochinatown.js` (not by a crew spot), and the figure she had before is the only stand-in. Not done: Cade and Lumi (the VR players need clips from the UAL library: take them from `vr-player-a/b.glb` with `--crowd`), DJ Vanta (in NULL), the street crowd, player characters, companions, mission-givers. The residents' looks (faces, clothes) are Claude's designs from their jobs and David's style references: David may want any of them changed.
