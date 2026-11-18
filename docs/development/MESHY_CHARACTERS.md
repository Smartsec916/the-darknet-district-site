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
| 18 Nov | Zane (second male VR companion) 3D, image-to-3d from the concept `01a1ee4a-e1aa…` (text-to-image, 9 credits, counted in the NPC concept batch) | `01a1ef1d-a7bd-7391-b0ff-a4f716afcca6` | 30 |
| 18 Nov | Zane remesh 45k | remesh `01a1ef20-c8b0-73d6-9e9f-cc06be77c3ae` | 5 |
| 18 Nov | Zane rig, 1.82 m | rigging `01a1ef22-d719-762e-8252-756458b85b59` | 5 |
| | **18 Nov, Zane** | | **40** (budget 40 to 60, stop at 120; the account showed 368 before and 328 after; no retry. Runner `Documents/DarknetDistrict_Assets/Meshy/companions/companion-m2/build_all.py`) |
| 18 Nov | Auburn (Milked studio 4's dancer; an adult woman of 21, the owner's statement of 18 Nov 2026) concept: image-to-image (nano-banana-pro, 9:16) from renders of the owner's own Meshy model `Meshy_AI_Auburn_Morning_in_the_1118031722_texture.glb` (his Downloads; bent over, unrigged, 1.38 M triangles), asking for the same woman standing in an A-pose with adult features, the dress over black shorts | `01a1ef75-071c-7298-a5c9-46539b6d6d2f` | 9 |
| 18 Nov | Auburn 3D | image-to-3d `01a1ef76-c15c-7659-8428-11355fb07fbb` | 30 |
| 18 Nov | Auburn remesh 40k | remesh `01a1ef7b-82b8-7734-b9dc-5fbba9a9200f` | 5 |
| 18 Nov | Auburn rig, 1.72 m | rigging `01a1ef7d-f1ee-71cb-b295-8626faed4f05` | 5 |
| | **18 Nov, Auburn** | | **49** (cap 70; the account showed 323 before and 269 after: 54, five more than the four tasks report, not traced to this job; no retry. Working folder `Documents/DarknetDistrict_Assets/Meshy/studio4/` (`build_all.py`, `build_cfg.json`, renders)) |
| 18 Nov | Lace ("Ethereal Lace", the owner's own Meshy generation from his Downloads): first rig, of a plain decimation whose textures came out shattered (not used) | rigging `01a1ef5c-5d99…` | 5 |
| 18 Nov | Lace: rigged again from the welded, decimated and re-baked mesh (`--model-url` local file; used) | rigging `01a1ef88-49b4…` | 5 |
| 18 Nov | Reverie ("Grey Reverie") and the street cat: decimated and re-encoded locally; Reverie static (sculpted seated), the cat rigged in Blender | none | 0 |
| | **18 Nov, the street pair** | | **10** (cap 20; the account showed 1,328 before and 269 after: other jobs (image-to-3d, remesh and rigging tasks from other work) ran on the account at the same time; this job's two rigging tasks are the ones above) |

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

## Auburn, Milked studio 4 (18 Nov 2026)

The owner's own Meshy generation ("Auburn Morning in the Kitchen") was bent over with her hands on her knees and could not be rigged, so a standing A-pose concept of the same woman was made from renders of it (above), then 3D, remesh 40k and rig. The owner: "Go ahead and add her into Studio 4. I think she looks about 21": she is an adult woman of 21 (his statement, 18 Nov 2026). Green long-sleeved high-neck bodycon dress over black shorts, black knee-high stiletto boots, long auburn hair; covered in every view. `npc-milked-auburn.glb`: one skinned mesh, 41,285 triangles, 24 joints, three JPEG maps, 4.58 MB; spec `tools/animation-pipeline/characters/npc-milked-auburn.json`, clips `pb-idle` / `pb-dance` (studio 4's idle and dance as `vr-player-b.glb` ships them; its dance is a 1 s loop). In `milked.js` she is the studio 4 dancer `milked-auburn`, name `Auburn`; no voice, no lines.
## The Avenue's street pair and the cat (18 Nov 2026)

The owner's own Meshy generations (he downloaded them from meshy.ai; GLB and .blend in his Downloads), not concepts made here. Working folder on the owner's PC: `Documents/DarknetDistrict_Assets/Meshy/studio1/` (`render.py` content renders, `prep.py` / `prep_cat.py` decimate, scale to metres and (the cat) rig, `shrink.py` re-encodes the maps, `lace_build.py` rigs Lace and runs the two pipeline steps, `lace_status.json`).

- **Decimating a Meshy download (lesson):** a plain Decimate of the 0.7 to 1.2 million-triangle Meshy mesh with its own UVs gives a shattered look in the game (the UV islands collapse into each other: light and dark shards over the skin and clothes). What works (`bake2.py`, 25 to 40 s each on the owner's GPU): weld (merge by distance 0.05 mm), make normals consistent, Decimate (collapse) to 45,000, shade smooth, a fresh Smart UV Project, then bake from the full mesh onto it with Cycles (selected to active, cage 12 mm, ray 40 mm): colour 2048 (diffuse colour only), normal 1024, roughness 1024; metallic 0.
- **Lace** `npc-ethereal-lace` (white tiered lace mini dress, frilled ankle socks, white platform shoes, a ribbon in her hair): baked as above, then `meshy rigging create --model-url <local glb> --height-meters 1.65` (the CLI uploads a local file; no remesh task was needed) and `prepare_meshy.py` + `build_imported_character.py` (spec `characters/npc-ethereal-lace.json`): clips idle, walk (the street walk, exported as `walk.001`), sit, look. 45,000 triangles, 4.56 MB. The rigged mesh is named `lace-mesh`, not Meshy's `output_unwrapped`, so the spec's mesh entry did not match; the converter kept it whole anyway. The sit clip is a chair sit: hips 0.65 m up and 0.35 m behind the feet, so her ledges are 0.6 m high and she stands 0.3 m in front of their middle.
- **Reverie** `npc-grey-reverie` (oversized grey hoodie, dark ankle socks, chunky buckled platform loafers; sculpted sitting on the ground hugging her knees, head on her arms): baked as above, scaled to 0.88 m seated height, static (no rig: the pose is the sculpt). 45,000 triangles, 2.59 MB.
- **Content check** (renders in the session scratchpad, not in the repo): both women clothed, nothing explicit. Both have soft, youthful faces and styling, so they were kept out of Milked entirely (the owner then asked for them only on the street).

