# Characters and assets made with Meshy

The owner upgraded his Meshy account on 15 Nov 2026 (1,100 credits a month) and authorised its use for the graphics modernization, without asking per asset. He must not be charged for more: no credit purchases, no plan changes.

## How a character is made (all of it runs without the owner clicking anything)

Everything on the owner's PC is run through the Blender bridge, as separate background processes; his open Blender scene is never touched.

1. **Concept** (9 credits): `meshy image-to-image create --ai-model nano-banana-pro` with the owner's reference picture and a prompt asking for the same person full body, A-pose, front view, plain grey background. Half-length portraits cannot go straight to 3D: the model would stop at the waist.
2. **3D** (30): `meshy image-to-3d create --input-task-id <concept> --pose-mode a-pose --should-texture true --enable-pbr true --texture-resolution 4k`. The result is about 930,000 triangles.
3. **Remesh** (5): `meshy remesh create --input-task-id <3d> --topology triangle --target-polycount 45000`. Rigging refuses more than 300,000 faces, and the game wants about 45,000.
4. **Rig** (5): `meshy rigging create --input-task-id <remesh> --height-meters 1.8`. One skinned mesh on a 24-joint skeleton (no fingers), 4096 maps.
5. **Game clips:** `tools/animation-pipeline/prepare_meshy.py` (smaller maps, drops Meshy's clip), then `build_imported_character.py` with a spec in `characters/` (`optionalBones: true`; Meshy's `Spine02 / Spine01 / Spine / neck` are the game's `Spine / Spine1 / Spine2 / Neck`). The walk comes from a shipped character (`--crowd`).
6. **Into the repository:** the GLB comes back to the cloud session as base64 in tool results, textures are re-encoded (`tools/assets/optimize-textures.cjs`, 2048), and the file goes in `void-runner/assets/models/crowd/npc-<name>.glb` with its clips listed in `crowd.js`.

The CLI on the owner's PC is 0.8.6: `--async` on create, then `meshy <resource> get <id>` to poll and `-o <dir>` to download. The plugin's skill text describes 0.4.0 and some of its flags (`--output-schema`) do not exist in 0.8.6.

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
| 15 Nov | Seven residents' concepts (Rin, Jonah, Sable, Kei, Mags, Tavi, Bishop), text-to-image, 9 each | task ids in `Documents/DarknetDistrict_Assets/Meshy/residents/concepts_status.json` on the owner's PC | 63 |
| 15 Nov | The same seven: 3D (30), remesh (5), rig (5) each | `.../residents/build_status.json` | 280 |
| | **Total to 15 Nov** | | **441** |
| 16 Nov | Nyx (bartender) concept, image-to-image from the owner's picture of her behind the oxygen bar | `01a1e4a9-18a9…` | 9 |
| 16 Nov | Nyx 3D | image-to-3d `01a1e4aa-e074…` | 30 |
| 16 Nov | Nyx remesh 30k | remesh `01a1e4ac-b1d4…` | 5 |
| 16 Nov | Nyx rig | rigging (id in `Documents/DarknetDistrict_Assets/Meshy/nyx/build_status.json`) | 5 |
| 16 Nov | Seven District props (oxygen tank, bar stool, oxygen station, VR headset, pistol, radio, flashlight): text-to-image 9, image-to-3d 30, remesh 5 each; the flashlight's picture was made twice | `Documents/DarknetDistrict_Assets/Meshy/district_props/status.json`; table in `DISTRICT_UPGRADE.md` | 317 |
| | **16 Nov, District second pass** | | **366** (the owner's limit for it was 400; the account showed 1,767 before and 1,401 after) |
| 18 Nov | Monk concepts, image-to-image (nano-banana-pro) from the owner's picture of three monks: elder `01a1eddb-c7df…`, tech `01a1eddb-ca08…`, grey `01a1eddb-c8bc…` | 9 each | 27 |
| 18 Nov | Zen Zephyr concepts from his picture in the owner's book: standing A-pose `01a1eddb-c72d…` (not used) and seated `01a1eddb-c9ec…` (used) | 9 each | 18 |
| 18 Nov | The three monks: 3D (30), remesh 30k (5), rig (5) each | ids in `Documents/DarknetDistrict_Assets/Meshy/monks/build_status.json` | 120 |
| 18 Nov | Zen Zephyr seated: 3D (30), remesh 40k (5); not rigged (a static seated figure) | same file | 35 |
| | **18 Nov, the monks** | | **200** (budget for this job 200 to 300; the account showed 620 afterwards; no retries were needed) |
| 18 Nov | NPC upgrade concepts: 26 text-to-image pictures (nano-banana-pro, a-pose; #15 and #16 made twice), approved by the owner; #25 (Zane) done separately | ids in `Documents/DarknetDistrict_Assets/Meshy/npc_upgrade/concepts_status.json` | 252 (before this job: balance 620 to 368) |
| 18 Nov | #1 `npc-office-f`: 3D `01a1ef59-f40e…` (30), remesh 30k `01a1ef60-1e4a…` (5), rig `01a1ef62-69f9…` (5); no retry | `.../npc_upgrade/build3d_status.json`, `status/npc-office-f.json` | 40 |
| 18 Nov | #2 `npc-office-m`: 3D `01a1ef59-f1a1…` (30), remesh 30k `01a1ef60-1c9a…` (5), rig `01a1ef62-3d2a…` (5); no retry | `.../npc_upgrade/build3d_status.json`, `status/npc-office-m.json` | 40 |
| 18 Nov | #3 `npc-security`: 3D `01a1ef59-f4d3…` (30), remesh 30k `01a1ef60-1d60…` (5), rig `01a1ef62-3353…` (5); no retry | `.../npc_upgrade/build3d_status.json`, `status/npc-security.json` | 40 |
| 18 Nov | #4 `npc-executive`: 3D `01a1ef59-f32a…` (30), remesh 30k `01a1ef60-2001…` (5), rig `01a1ef61-f823…` (5); no retry | `.../npc_upgrade/build3d_status.json`, `status/npc-executive.json` | 40 |
| 18 Nov | #5 `npc-cook-old`: 3D `01a1ef59-f263…` (30), remesh 30k `01a1ef63-3db6…` (5), rig `01a1ef65-5f83…` (5); no retry | `.../npc_upgrade/build3d_status.json`, `status/npc-cook-old.json` | 40 |
| 18 Nov | #6 `npc-courier`: 3D `01a1ef5b-326a…` (30), remesh 30k `01a1ef64-20f9…` (5), rig `01a1ef66-7cc0…` (5); no retry | `.../npc_upgrade/build3d_status.json`, `status/npc-courier.json` | 40 |
| 18 Nov | #7 `npc-cook-f`: 3D `01a1ef5b-335a…` (30), remesh 30k `01a1ef64-21e2…` (5), rig `01a1ef66-5094…` (5); no retry | `.../npc_upgrade/build3d_status.json`, `status/npc-cook-f.json` | 40 |
| 18 Nov | #8 `npc-club-f`: 3D `01a1ef5b-4128…` (30), remesh 30k `01a1ef64-547a…` (5), rig `01a1ef66-88f3…` (5); no retry | `.../npc_upgrade/build3d_status.json`, `status/npc-club-f.json` | 40 |
| 18 Nov | #9 `npc-club-m`: 3D `01a1ef5b-74f6…` (30), remesh 30k `01a1ef66-ee99…` (5), rig `01a1ef69-da43…` (5); no retry | `.../npc_upgrade/build3d_status.json`, `status/npc-club-m.json` | 40 |
| 18 Nov | #10 `npc-hacker`: 3D `01a1ef5b-e056…` (30), remesh 30k `01a1ef6b-373e…` (5), rig `01a1ef6d-a8e8…` (5); no retry | `.../npc_upgrade/build3d_status.json`, `status/npc-hacker.json` | 40 |
| 18 Nov | #11 `npc-merc`: 3D `01a1ef5c-8574…` (30), remesh 30k `01a1ef6b-3e63…` (5), rig `01a1ef6d-bbb1…` (5); no retry | `.../npc_upgrade/build3d_status.json`, `status/npc-merc.json` | 40 |
| 18 Nov | #12 `npc-veteran`: 3D `01a1ef63-1e0d…` (30), remesh 30k `01a1ef6b-3367…` (5), rig `01a1ef6d-7753…` (5); no retry | `.../npc_upgrade/build3d_status.json`, `status/npc-veteran.json` | 40 |
| 18 Nov | #13 `npc-fixer`: 3D `01a1ef63-1cf3…` (30), remesh 30k `01a1ef6b-3459…` (5), rig `01a1ef6d-32bd…` (5); no retry | `.../npc_upgrade/build3d_status.json`, `status/npc-fixer.json` | 40 |
| 18 Nov | #14 `npc-vendor`: 3D `01a1ef63-1eed…` (30), remesh 30k `01a1ef6b-3568…` (5), rig `01a1ef6e-382c…` (5); no retry | `.../npc_upgrade/build3d_status.json`, `status/npc-vendor.json` | 40 |
| 18 Nov | #15 `npc-student`: 3D `01a1ef5e-79b1…` (30), remesh 30k `01a1ef63-938e…` (5), rig `01a1ef65-f53e…` (5); no retry | `.../npc_upgrade/build3d_status.json`, `status/npc-student.json` | 40 |
| 18 Nov | #16 `npc-tourist`: 3D `01a1ef5e-785f…` (30), remesh 30k `01a1ef63-95f5…` (5), rig `01a1ef65-ea78…` (5); no retry | `.../npc_upgrade/build3d_status.json`, `status/npc-tourist.json` | 40 |
| 18 Nov | #17 `npc-medic`: 3D `01a1ef5e-7aba…` (30), remesh 30k `01a1ef63-94b9…` (5), rig `01a1ef65-ec14…` (5); no retry | `.../npc_upgrade/build3d_status.json`, `status/npc-medic.json` | 40 |
| 18 Nov | #19 `npc-enforcer`: 3D `01a1ef5e-7f97…` (30), remesh 30k `01a1ef63-926f…` (5), rig `01a1ef65-e983…` (5); no retry | `.../npc_upgrade/build3d_status.json`, `status/npc-enforcer.json` | 40 |
| 18 Nov | #20 `npc-lookout`: 3D `01a1ef5e-7e27…` (30), remesh 30k `01a1ef6a-0f12…` (5), rig `01a1ef6c-4626…` (5); no retry | `.../npc_upgrade/build3d_status.json`, `status/npc-lookout.json` | 40 |
| 18 Nov | #21 `npc-outskirts-f`: 3D `01a1ef60-0010…` (30), remesh 30k `01a1ef6d-e959…` (5), rig `01a1ef71-086b…` (5); no retry | `.../npc_upgrade/build3d_status.json`, `status/npc-outskirts-f.json` | 40 |
| 18 Nov | #22 `npc-outskirts-m`: 3D `01a1ef5f-ff2e…` (30), remesh 30k `01a1ef6d-ea30…` (5), rig `01a1ef70-9709…` (5); no retry | `.../npc_upgrade/build3d_status.json`, `status/npc-outskirts-m.json` | 40 |
| 18 Nov | #23 `npc-elder-f`: 3D `01a1ef60-00e8…` (30), remesh 30k `01a1ef6a-0d48…` (5), rig `01a1ef6c-1be8…` (5); no retry | `.../npc_upgrade/build3d_status.json`, `status/npc-elder-f.json` | 40 |
| 18 Nov | #24 `npc-busker`: 3D `01a1ef60-027c…` (30), remesh 30k `01a1ef6a-10c6…` (5), rig `01a1ef6c-4567…` (5); no retry | `.../npc_upgrade/build3d_status.json`, `status/npc-busker.json` | 40 |
| 18 Nov | #26 `npc-casual-f`: 3D `01a1ef60-1f21…` (30), remesh 30k `01a1ef6b-157d…` (5), rig `01a1ef6d-7cab…` (5); no retry | `.../npc_upgrade/build3d_status.json`, `status/npc-casual-f.json` | 40 |
| 18 Nov | #27 `npc-casual-m`: 3D `01a1ef61-2825…` (30), remesh 30k `01a1ef6d-d136…` (5), rig `01a1ef70-52b5…` (5); no retry | `.../npc_upgrade/build3d_status.json`, `status/npc-casual-m.json` | 40 |
| | **18 Nov, the NPC upgrade: 25 figures** | | **1,000** (hard cap for the job 1,400; no retries were needed. The account showed 1,328 before and 314 after: 14 more than this job's tasks, spent by another session on the same account at the same time) |

A full character costs about 49 credits, so the month's 1,100 is roughly 22 characters, or fewer characters plus props (a prop from a picture is about 30).

## Rights

Generated on the owner's paid Meshy plan from his own reference pictures (which he made with Midjourney). Recorded in `docs/VOID_RUNNER_ASSET_LICENSES.md`. The owner to confirm his plan's terms give him private ownership of the outputs; on that basis they are stored in this public repository like the game's other own assets.

## Doing several at once (15 Nov)

`Documents/DarknetDistrict_Assets/Meshy/residents/` on the owner's PC holds two small runners started with Blender's own Python as detached processes: `concepts.py` (all concept images in parallel from `prompts.json`) and `build_all.py` (3D, remesh, rig, prepare and convert for each, four at a time, writing `build_status.json`). `%TEMP%/meshy_build/shrink_glb.py` then re-encodes the PNG maps inside each GLB as JPEG so a character is about 4 to 5 MB, small enough to bring back in two pieces.

Lessons: never `time.sleep` inside a `bl_execute` call (it blocks Blender and the bridge times out): start a detached process and poll with instant calls. Never return more than about 3.5 million characters in one call: a whole 12 MB file dropped the bridge connection. Wait between polls with a shell `until` loop on the clock.

## Residents (15 Nov)

`district-people.js` `own` names a resident's own model; `lookFor(crew)` returns it, `crowd.js` loads it with the District interior and `pick()` gives it to their spot. If a file fails to load, a look of the place stands in. Residents done: Rin Takeda, Jonah Pike, Sable Quon, Kei Navarro, Mags Oduya, Tavi Rourke, Bishop Hale. Nyx (bartender) was done on 16 Nov from the owner's own picture: `model:'npc-nyx'` in `district-people.js`, 30,942 triangles, clips idle, talk, walk, look, watch, laugh, shrug, wipe; she is placed by `neochinatown.js` (not by a crew spot), and the figure she had before is the only stand-in. Not done: Cade and Lumi (the VR players need clips from the UAL library: take them from `vr-player-a/b.glb` with `--crowd`), DJ Vanta (in NULL), the street crowd, player characters, companions, mission-givers. The residents' looks (faces, clothes) are Claude's designs from their jobs and the owner's style references: the owner may want any of them changed.

## The monks and Zen Zephyr (18 Nov 2026)

From the owner's reference picture of three monks (`docs/development/monks/reference-monks.jpg`) and his book picture of Zen Zephyr (`reference-zen-zephyr.jpg`). Concepts for the owner to look at: `docs/development/monks/concept-*.jpg`. Working folder on the owner's PC: `Documents/DarknetDistrict_Assets/Meshy/monks/` (`prompts.json`, `concepts.py`, `build_all.py`, `build_cfg.json`, `zen_build.py`, statuses).

- **Monks** `npc-monk-elder` (saffron robes, mala, grey goatee), `npc-monk-tech` (dark brown robe, amber visor and light panels, belt and pouches), `npc-monk-grey` (grey patterned robe, wrapped scarf, face seams): concept in A-pose with the robe hem at mid-calf so the legs rig cleanly, then 3D, remesh 30k, rig 1.70 / 1.76 / 1.74 m, `prepare_meshy.py` + `build_imported_character.py` (specs `tools/animation-pipeline/characters/npc-monk-*.json`), clips idle, talk, walk (the game's street walk), look, watch, sit. About 30,600 triangles and 3.7 to 3.9 MB each (maps re-encoded as JPEG with `shrink_glb.py`).
- **Zen Zephyr** `npc-zen-zephyr`: the A-pose concept lost too much of the reference (the sash became a collar), so the seated concept was used instead and made a static figure (no rig: a robe pooled on the floor cannot be posed seated from an A-pose rig without tearing). `zen_build.py` (Blender, background) cuts the head off at the neck (z 0.405 m, within 0.13 m of the middle) into `zz:HeadMesh` under `zz:Head` under `zz:Neck` (pivot at the neck), so the speaker's gaze (`npc-look.js`) turns his head; maps 2048 JPEG; 41,000 triangles, 3.8 MB.
- **In the game:** `crowd.js` (`monks`, clips), `ncz-nightlife.js` (`monkShare`: rare in Old Town, more along the Avenue toward the East Gate, up to 70% at the gate), `temple.js` (`MODEL.asset`, `MONKS`), `temple-build.js`. Details and screenshots: `docs/development/TEMPLE.md` ("Monks") and `docs/development/monks/`.

## The NPC upgrade: 25 street people and the creator's bases (18 Nov 2026)

From the owner's approved concepts (`docs/development/npc-upgrade/concepts-contact-sheet.jpg`; prompts in `.../Meshy/npc_upgrade/prompts.json` on his PC). Working folder `Documents/DarknetDistrict_Assets/Meshy/npc_upgrade/`: `build_cfg.json` (names, rig heights, concept ids), `build3d.py` (image to 3D only, five at a time, and the front thumbnail of each result, so every figure was looked at before its remesh and rig were paid for), `build2.py` (remesh 30k, rig, `prepare_meshy.py`, `build_imported_character.py`, `shrink_npcup.py`: a copy of `shrink_glb.py` with temp names per figure, so several can run at once), `status/<name>.json`.

- **Clips:** the residents' set (idle, talk, walk, look, watch, sit, smoke, drink, laugh, shrug) plus sit-enter, sit-exit, sit-talk, interact, drunk-walk, drunk-idle, drunk-sway and dance, taken from the game's own crowd files with `--crowd` (new `clips.json` entries `hk-*`, `nz-*`, `dr-dance`, `va-*` and `vb-*`: no UAL or Mixamo folder is needed). `npc-security` also has the VR booth shooter's clips (Cade), `npc-club-f` the social booth's (Lumi). Blender's `walk.001` is renamed `walk` when the file goes into the repository.
- **Sizes:** 30,400 to 31,100 triangles, one mesh and one material each, 3.1 to 4.7 MB (2048 JPEG maps).
- **Moving files without a 12 MB call:** to the PC, from this public repository's raw GitHub URLs of a pushed commit (specs, `clips.json`, the old crowd files the clips are grafted from); from the PC, in 2.4 MB pieces as base64 (each tool result is saved to a file in the cloud session, reassembled and checked by MD5).
- **Rights:** as the monks (`docs/VOID_RUNNER_ASSET_LICENSES.md`).
