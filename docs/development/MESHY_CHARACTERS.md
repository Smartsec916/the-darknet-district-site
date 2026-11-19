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
| 18 Nov | Zane (second male VR companion) 3D, image-to-3d from the concept `01a1ee4a-e1aa…` (text-to-image, 9 credits, counted in the NPC concept batch) | `01a1ef1d-a7bd-7391-b0ff-a4f716afcca6` | 30 |
| 18 Nov | Zane remesh 45k | remesh `01a1ef20-c8b0-73d6-9e9f-cc06be77c3ae` | 5 |
| 18 Nov | Zane rig, 1.82 m | rigging `01a1ef22-d719-762e-8252-756458b85b59` | 5 |
| | **18 Nov, Zane** | | **40** (budget 40 to 60, stop at 120; the account showed 368 before and 328 after; no retry. Runner `Documents/DarknetDistrict_Assets/Meshy/companions/companion-m2/build_all.py`) |
| 18 Nov | Auburn (Milked studio 4's dancer; an adult woman of 21, the owner's statement of 18 Nov 2026) concept: image-to-image (nano-banana-pro, 9:16) from renders of the owner's own Meshy model `Meshy_AI_Auburn_Morning_in_the_1118031722_texture.glb` (his Downloads; bent over, unrigged, 1.38 M triangles), asking for the same woman standing in an A-pose with adult features, the dress over black shorts | `01a1ef75-071c-7298-a5c9-46539b6d6d2f` | 9 |
| 18 Nov | Auburn 3D | image-to-3d `01a1ef76-c15c-7659-8428-11355fb07fbb` | 30 |
| 18 Nov | Auburn remesh 40k | remesh `01a1ef7b-82b8-7734-b9dc-5fbba9a9200f` | 5 |
| 18 Nov | Auburn rig, 1.72 m | rigging `01a1ef7d-f1ee-71cb-b295-8626faed4f05` | 5 |
| | **18 Nov, Auburn** | | **49** (cap 70; the account showed 323 before and 269 after: 54, five more than the four tasks report, not traced to this job; no retry. Working folder `Documents/DarknetDistrict_Assets/Meshy/studio4/` (`build_all.py`, `build_cfg.json`, renders)) |
| 18 Nov | Milked dances (the owner: studio 4 "needs more dance animations", "she just swaying a little"): Meshy library animate on Auburn's rig, ten actions in one request (All Night Dance, Shake It Off Dance, Love You Pop Dance, Denim Pop Dance, OMG Groove for Auburn; Hip Hop Dance, Hip Hop Dance 2, Hip Hop Dance 3, You Groove, Bass Beats retargeted locally onto Dex afterwards; Dex never sent to Meshy) | animate `01a1f03c-38d4-751a-ae09-d87d83428918` | 30 (3 per action; balance 171 -> 141; floor 50) |
| 18 Nov | Lace ("Ethereal Lace", the owner's own Meshy generation from his Downloads): first rig, of a plain decimation whose textures came out shattered (not used) | rigging `01a1ef5c-5d99…` | 5 |
| 18 Nov | Lace: rigged again from the welded, decimated and re-baked mesh (`--model-url` local file; used) | rigging `01a1ef88-49b4…` | 5 |
| 18 Nov | Reverie ("Grey Reverie") and the street cat: decimated and re-encoded locally; Reverie static (sculpted seated), the cat rigged in Blender | none | 0 |
| | **18 Nov, the street pair** | | **10** (cap 20; the account showed 1,328 before and 269 after: other jobs (image-to-3d, remesh and rigging tasks from other work) ran on the account at the same time; this job's two rigging tasks are the ones above) |

| 18 Nov | Reverie standing A-pose concept, image-to-image (nano-banana-pro) from front, face and back renders of the original seated figure | `01a1efbf-2e8e-77a3-a7c5-3bb474f4a379` | 9 |
| 18 Nov | Reverie 3D (a-pose, 4k PBR) | image-to-3d `01a1efc0-11bb-72da-8111-cbb54a9e03cc` | 30 |
| 18 Nov | Reverie remesh 45k | remesh `01a1efc5-2cd5-748a-9a1b-a24ad4183675` | 5 |
| 18 Nov | Reverie rig, 1.58 m (`--all-assets`: its running clip is used) | rigging `01a1efca-bcb2-7300-b4b5-2b4575894f2f` | 5 |
| 18 Nov | Lace standing A-pose concept, image-to-image from renders of the original (her first rig, of the hands-at-chest sculpt, tore her arms and hair in any arm movement) | `01a1efd1-4e0e-71f4-a5e0-dce19efbe497` | 9 |
| 18 Nov | Lace 3D | image-to-3d `01a1efd2-0699-7445-8404-36642d46f008` | 30 |
| 18 Nov | Lace remesh 45k | remesh `01a1efd5-483e-70ef-b2b9-2a84757528c0` | 5 |
| 18 Nov | Lace rig, 1.65 m | rigging `01a1efd8-5b8f-778f-8fce-cccb4a51b8d3` | 5 |
| | **18 Nov, the street pair remade and animated** | | **98** (cap 70, raised to about 100 by the owner for Lace's remake; the account showed 269 before and 171 after; no retries. Folder `Documents/DarknetDistrict_Assets/Meshy/studio1/pairanim/` on the owner's PC) |
| 19 Nov | Street taxi concept: image-to-image (nano-banana-pro) from the owner's reference picture cropped to the cab, the background sign naming a real company blurred out (`docs/development/taxi/reference-taxi.jpg`), asking for the same van on a plain grey background | `01a1f2c9-d203-720d-8f3f-c4a5d274bcf9` | 9 |
| 19 Nov | Street taxi 3D | image-to-3d `01a1f2cd-078f-73a8-8994-a26161a3af53` | 30 |
| 19 Nov | Street taxi remesh 20k | remesh (id in `Documents/DarknetDistrict_Assets/Meshy/ncz_taxi_van/status.json` on the owner's PC) | 5 |
| | **19 Nov, the street taxi** | | **44** (budget 40 to 60, floor 50; the account showed 496 before and 452 after; no retry. Earlier the same day the bridge was not connected and the cab was built in code; that van stays as the stand-in) |
| 19 Nov | Cyberpunk figures: two concepts made and not used, text-to-image (nano-banana-pro): the netrunner `01a1f498-71b0…` (the owner left that character out after it had been sent) and the first heavy bodyguard `01a1f498-7101…` (bulky gauntlet forearms, against the owner's note that cybernetic arms be slim and human-shaped; remade as the bouncer) | `Documents/DarknetDistrict_Assets/Meshy/cyber_chars/concepts_status.json` | 18 |
| 19 Nov | `npc-cyber-exec`: concept (text-to-image, nano-banana-pro) `01a1f498-7442…` (9), 3D `01a1f49e-7e5d…` (30), remesh 30k `01a1f4a1-6975…` (5), rig `01a1f4a3-cfd3…` (5); no retry | `.../cyber_chars/build3d_status.json`, `build3d_b_status.json`, `status/npc-cyber-exec.json` | 49 |
| 19 Nov | `npc-cyber-pvc`: concept (text-to-image, nano-banana-pro) `01a1f498-736c…` (9), 3D `01a1f49e-7d59…` (30), remesh 30k `01a1f4a1-6caa…` (5), rig `01a1f4a3-be7f…` (5); no retry | `.../cyber_chars/build3d_status.json`, `build3d_b_status.json`, `status/npc-cyber-pvc.json` | 49 |
| 19 Nov | `npc-cyber-courier`: concept (text-to-image, nano-banana-pro) `01a1f49e-4e6f…` (9), 3D `01a1f49f-fec7…` (30), remesh 30k `01a1f4a3-0faa…` (5), rig `01a1f4a5-337c…` (5); no retry | `.../cyber_chars/build3d_status.json`, `build3d_b_status.json`, `status/npc-cyber-courier.json` | 49 |
| 19 Nov | `npc-cyber-samurai`: concept (text-to-image, nano-banana-pro) `01a1f498-751b…` (9), 3D `01a1f49e-7c9a…` (30), remesh 30k `01a1f4a1-6bc2…` (5), rig `01a1f4a3-b6ae…` (5); no retry | `.../cyber_chars/build3d_status.json`, `build3d_b_status.json`, `status/npc-cyber-samurai.json` | 49 |
| 19 Nov | `npc-cyber-respirator`: concept (text-to-image, nano-banana-pro) `01a1f498-729d…` (9), 3D `01a1f49e-7f4e…` (30), remesh 30k `01a1f4a1-6a9e…` (5), rig `01a1f4a3-b5ef…` (5); no retry | `.../cyber_chars/build3d_status.json`, `build3d_b_status.json`, `status/npc-cyber-respirator.json` | 49 |
| 19 Nov | `npc-cyber-bouncer`: concept (text-to-image, nano-banana-pro) `01a1f49e-4da2…` (9), 3D `01a1f49f-ffa9…` (30), remesh 30k `01a1f4a3-0ed3…` (5), rig `01a1f4a5-4d95…` (5); no retry | `.../cyber_chars/build3d_status.json`, `build3d_b_status.json`, `status/npc-cyber-bouncer.json` | 49 |
| | **19 Nov, the six cyberpunk figures** | | **312** (budget about 300, floor 50; 12 over the estimate for the two concepts the owner's changes made unusable; the account showed 452 before and 140 after, exactly this job's tasks; no retries) |

A full character costs about 49 credits, so the month's 1,100 is roughly 22 characters, or fewer characters plus props (a prop from a picture is about 30).

## The cyberpunk figures (19 Nov 2026)

The owner: the NPCs and player characters "look very normal for a cyberpunk game"; he wanted more options, not blocky. Six figures, made as the 25 street people were (text-to-image concept, image to 3D, remesh 30k, rig, the street clips retargeted), working folder `Documents/DarknetDistrict_Assets/Meshy/cyber_chars/` on the owner's PC (`prompts.json`, `concepts.py`, `build3d.py` / `build3d_b.py`, `build2.py`, `shrink_cyber.py`, statuses; the pipeline in `%TEMP%/meshy_build/pipe_cyber`, fetched from this branch's raw files). The concept prompt's style asks for strongly cyberpunk but grounded techwear and visible cybernetics, every arm empty and clear of the body, coat hems above the knee; the owner's note of the same day, that cybernetic arms be slim and human-shaped (elbow and wrist joints, segmented plating, actuators at the joints, never bulky gauntlets), is written into the prompts of the samurai and the bouncer. Each concept and each 3D thumbnail was looked at before the next step was paid for. Details, placement and the creator: `NPC_UPGRADE.md`, "The cyberpunk figures".

## The street taxi (19 Nov 2026)

Working folder `Documents/DarknetDistrict_Assets/Meshy/ncz_taxi_van/` on the owner's PC: `run.py` (concept, 3D, remesh), `build1.py` (Blender, background: the model turned to face -Y, scaled to 4.4 m, on the ground; the cabin's inside cut out; the side windows replaced by a tinted glass band and the windscreen and tailgate window made glass; the wheels cut into `axle_front` / `axle_rear` with the node at each axle's centre; the lit parts (roof box, light bar, lamps, sensors) flagged), `build2.py` (the flagged faces baked to an emission map with Cycles; maps 2048 base colour, 1024 others; GLB export), `measure3.py` (where the windscreen, numbers and tail lights sit, for the game's overlays). In the cloud session the GLB was compressed with gltf-transform (lossless `EXT_meshopt_compression`, `reorder`, no quantisation) and a Low copy made with 1024 maps: `void-runner/assets/models/vehicles/taxi-van.glb` (1.59 MB) and `taxi-van-low.glb` (1.54 MB); 15,163 triangles (body and glass about 9,300, wheels 5,864).

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
## Auburn, Milked studio 4 (18 Nov 2026)

The owner's own Meshy generation ("Auburn Morning in the Kitchen") was bent over with her hands on her knees and could not be rigged, so a standing A-pose concept of the same woman was made from renders of it (above), then 3D, remesh 40k and rig. The owner: "Go ahead and add her into Studio 4. I think she looks about 21": she is an adult woman of 21 (his statement, 18 Nov 2026). Green long-sleeved high-neck bodycon dress over black shorts, black knee-high stiletto boots, long auburn hair; covered in every view. `npc-milked-auburn.glb`: one skinned mesh, 41,285 triangles, 24 joints, three JPEG maps, 4.58 MB; spec `tools/animation-pipeline/characters/npc-milked-auburn.json`, clips `pb-idle` / `pb-dance` (studio 4's idle and dance as `vr-player-b.glb` ships them; its dance is a 1 s loop). In `milked.js` she is the studio 4 dancer `milked-auburn`, name `Auburn`; no voice, no lines.
## The Avenue's street pair and the cat (18 Nov 2026)

The owner's own Meshy generations (he downloaded them from meshy.ai; GLB and .blend in his Downloads), not concepts made here. Working folder on the owner's PC: `Documents/DarknetDistrict_Assets/Meshy/studio1/` (`render.py` content renders, `prep.py` / `prep_cat.py` decimate, scale to metres and (the cat) rig, `shrink.py` re-encodes the maps, `lace_build.py` rigs Lace and runs the two pipeline steps, `lace_status.json`).

- **Decimating a Meshy download (lesson):** a plain Decimate of the 0.7 to 1.2 million-triangle Meshy mesh with its own UVs gives a shattered look in the game (the UV islands collapse into each other: light and dark shards over the skin and clothes). What works (`bake2.py`, 25 to 40 s each on the owner's GPU): weld (merge by distance 0.05 mm), make normals consistent, Decimate (collapse) to 45,000, shade smooth, a fresh Smart UV Project, then bake from the full mesh onto it with Cycles (selected to active, cage 12 mm, ray 40 mm): colour 2048 (diffuse colour only), normal 1024, roughness 1024; metallic 0.
- **Lace** `npc-ethereal-lace` (white tiered lace mini dress, frilled ankle socks, white platform shoes, a ribbon in her hair): baked as above, then `meshy rigging create --model-url <local glb> --height-meters 1.65` (the CLI uploads a local file; no remesh task was needed) and `prepare_meshy.py` + `build_imported_character.py` (spec `characters/npc-ethereal-lace.json`): clips idle, walk (the street walk, exported as `walk.001`), sit, look. 45,000 triangles, 4.56 MB (**replaced the same day by a remake: this rig tore her arms and hair; below**). The rigged mesh is named `lace-mesh`, not Meshy's `output_unwrapped`, so the spec's mesh entry did not match; the converter kept it whole anyway. The sit clip is a chair sit: hips 0.65 m up and 0.35 m behind the feet, so her ledges are 0.6 m high and she stands 0.3 m in front of their middle.
- **Reverie** `npc-grey-reverie` (oversized grey hoodie, dark ankle socks, chunky buckled platform loafers; sculpted sitting on the ground hugging her knees, head on her arms): baked as above, scaled to 0.88 m seated height, static (no rig: the pose is the sculpt). 45,000 triangles, 2.59 MB. **Replaced the same day by a standing, rigged remake (below).**
- **Content check** (renders in the session scratchpad, not in the repo): both women clothed, nothing explicit. Both have soft, youthful faces and styling, so they were kept out of Milked entirely (the owner then asked for them only on the street).


### Remade standing, rigged and animated (18 Nov 2026, build `2026-11-18-pair-anims-1`)

The owner: "Upgrade Reverie and Lace to support a wider range of animations". Both were remade the way new characters are made (concept, 3D, remesh, rig) from clean renders of the originals, so they now sit on the same 24-joint Meshy rig as Kai and Zane (bones renamed to the Mixamo names) and take any clip the pipeline retargets.

- **Why Lace was remade too:** her shipped rig was Meshy's auto-rig of the original sculpt, whose hands are clasped at her chest with her hair over her shoulders. Every clip that moved her arms (her own idle and walk included) tore the arms, hands and hair into dark spikes; her forearm bones were also about 170 degrees off Kai's rest. Seen in a Babylon viewer beside Kai (clean) before any credits were spent on her; the owner approved the extra 49 credits.
- **Concepts:** prompts ask for the same young woman standing in an A-pose, same face, hair and clothes, nothing added; Lace's asks for her hair behind her shoulders, clear of the arms (it falls over the shoulders in the result, as in the original). Reverie: long dark hair with light streaks and white bangs, oversized grey hoodie to mid-thigh with the sleeve print, dark ankle socks, chunky black buckled loafers. Lace: long wavy brown hair, white ribbon bow, white tiered lace strap dress, frilled ankle socks, white shoes (a little flatter than the original's platforms). Faces match closely; Meshy's 3D faces are a little smoother than the originals'.
- **Files:** `npc-grey-reverie.glb` 4.83 MB, 45,999 triangles (55,397 vertices); `npc-ethereal-lace.glb` 6.00 MB, 45,999 triangles (72,058 vertices: her lace has many more UV seams, which is the extra megabyte). Maps from the Meshy rig re-encoded as JPEG: colour 2048, normal and roughness 1024 (`shrink.py`). The remesh kept clean textures, so no re-bake was needed. Rest pose against Kai: Reverie at most 22 degrees (right hand), within `anim-library.js`'s 25.
- **Clips (both, 16):** `characters/npc-grey-reverie.json` / `npc-ethereal-lace.json`, entries `sp-*` in `clips.json`: idle, idle-shift (female idle), idle-stretch (Rokoko Idle_03), look, watch, walk (Female Walk), run (the running clip Meshy's rig returns, mapped one to one with the new `--own DIR` / `"sameRig": true` option of `build_imported_character.py`), sit-enter, sit, sit-exit, sit-wave, dance-groove (UAL Dance_Loop), dance-bop (Rokoko HappyDance 2-10 s), talk, gesture (Rokoko Idle_Conversation 20-28 s), shrug. Clips "from the crowd" come from `vr-companion-f.glb` as the game ships it (downloaded from GitHub to the PC). Picked from about 36 candidates by looking at each one on the new rigs; left out: party dances, jogging in place, pointing, the character-loading idles. Nothing sensual: `ncz-street-pair.js BANNED` and the test keep it so.
- **How to rebuild:** `pairanim/final_build.py <name> <prepared.blend> <rig>/running_armature_glb.glb` (fetches the pipeline from this branch, builds with `--mocap VOID_RUNNER_KEEP --crowd pairanim/crowd --own`, then `shrink.py 2048 86`). Sheets for picking clips were rendered in Babylon with a small viewer in the session scratchpad (Blender's own renders of glTF actions were not reliable).
- **Eyes:** neither remake has eye bones or separate eye meshes (24 joints, one mesh; the eyes are in the face texture), so only the head and neck turn toward a player (`ncz-street-pair.js lookAt`). Real eye tracking would need small eye meshes added in Blender.
