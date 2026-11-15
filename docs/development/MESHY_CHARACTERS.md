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
| | **Total so far** | | **98** |

A full character costs about 49 credits, so the month's 1,100 is roughly 22 characters, or fewer characters plus props (a prop from a picture is about 30).

## Rights

Generated on David's paid Meshy plan from his own reference pictures (which he made with Midjourney). Recorded in `docs/VOID_RUNNER_ASSET_LICENSES.md`. David to confirm his plan's terms give him private ownership of the outputs; on that basis they are stored in this public repository like the game's other own assets.
