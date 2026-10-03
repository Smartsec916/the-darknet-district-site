# VOID//RUNNER humanoid animation proof of concept

This is a controlled, local proof of concept. The production game does not load the animation lab, the prototype GLB, or `animation-library.js`. Existing NPC interactions, saves, combat, and navigation are unchanged.

## Existing game and source audit

Current Mara, Rook, Iris, Admin, crew, and other NPCs are procedural Babylon meshes (`babylon-renderer.js` and `opening-scene.js`). Optional character GLB hooks exist, but their `src` values are unset; the game ships no rigged humanoid character model. The existing player is a first-person controller without a rendered body. This means no current production skeleton can receive the FBX clips directly.

The supplied ZIP contains 113 FBX files (427,331,296 uncompressed bytes). Blender opened 112. Measured rig families: 74 Mixamo, 36 HumanIK, two Unreal. `FacePalms_mixamo.fbx` has an intact ZIP CRC and its extracted bytes match the archive, but Blender reports a truncated internal FBX compressed stream; it is marked `DISABLED`. The TXT list is not an exact filename inventory: seven generic names in it correspond to fourteen distinct files in the ZIP. The ZIP entries, including separate `Gun_`, `Idle_`, and `Combat_` variants, are authoritative.

`catalog.json` inventories all 113 actual filenames. Its bone counts, clip durations, and hip travel are from Blender imports. Categories, loop flags, roles, props, and location tags are **candidates** derived from names and require visual review. Endpoint travel is not a complete root-motion analysis. Nothing is marked safe for production yet.

## Canonical target and prototype

`VR_Humanoid_v1` uses the 52-joint Mixamo hierarchy as the initial canonical target. It is a skeleton contract, not a mocap actor mesh. A character-specific skinned mesh can use the same joint names and hierarchy while retaining different materials, clothing, and proportions. Changing bind poses or bone lengths requires offline retargeting and visual QA; matching names alone is insufficient.

The first two processed clips are `Idle_FightingIdle_mixamo.fbx` and `Clap_SlowClap_mixamo.fbx`. Both have the same 52-bone hierarchy. `build_poc.py` imports copies, removes the original actor meshes, holds horizontal hip translation in place, limits each clip to its first 145 source frames, attaches a small Mara-colored skinned proxy, and exports one GLB with named `idle_fighting` and `clap_slow` tracks. The idle is a combat-leaning idle because the curated Mixamo set has no clearly neutral unarmed idle; a neutral Mara idle still needs selection or retargeting. The prototype body is **not** a replacement for the current production Mara model. No source FBX was modified.

The game-ready prototype is `void-runner/assets/animations/mara-poc.glb` (about 544 KB). The local Babylon GLB loader, previously referenced but absent from this checkout, is restored at `void-runner/vendor/babylonjs-loaders-8.26.0.min.js` from the repository source snapshot. `animation-library.js` loads the asset on demand, reuses one container per Babylon scene, spawns separate skeleton/animation instances, and blends between clips. It is loaded only by `tests/animation-poc.html`.

## Reproduce and test

1. Keep `VOID_RUNNER_KEEP.zip` unchanged. Extract only approved FBX copies to a local work directory outside the live website tree.
2. Run Blender 5.2 or newer:

   ```text
   blender -b --factory-startup --python tools/animation-pipeline/build_poc.py -- <Idle_FightingIdle_mixamo.fbx> <Clap_SlowClap_mixamo.fbx> <output/mara-poc.glb>
   ```

3. Serve the repository root over HTTP. On this machine the existing local server uses `http://127.0.0.1:5189/`.
4. Open `http://127.0.0.1:5189/tests/animation-poc.html`. Play each clip, switch while playing to observe the 300 ms blend, toggle looping, adjust speed, and inspect the floor and feet from multiple angles.
5. Run `node tests/animation-poc-browser.cjs` with Playwright available through the Codex bundled Node packages. It verifies load, 52 bones, two clips, independent instances, blend, stop, and no page errors.

To add another Mixamo clip, confirm that Blender reports the same bone hierarchy and compatible bind pose, extend the action import/track list in `build_poc.py`, keep its original FBX outside the website, add a catalog record, export a processed GLB, and inspect the result in the lab before enabling it for an NPC. The prototype script is deliberately limited to two clips; do not batch-convert the entire library with it.

For HumanIK, map `Character1_*` bones to the canonical hierarchy in Blender, check the source and target rest poses and units, bake the retargeted action onto a copy of `VR_Humanoid_v1`, then apply the same clip trimming, root-motion policy, export, and visual checks. For the two Unreal files, map `pelvis`, spine, limbs, and extra twist bones onto the same target, bake and inspect shoulders, wrists, and feet. Neither family needs a separate runtime animation system.

## Promotion criteria and performance

Before production use, review each selected clip's actual action boundaries, loop seam, root travel, feet, pelvis, scale, orientation, shoulders, wrists, finger deformation, props, and weapon sockets. The current low-poly proxy is only a rig/playback test. A production Mara mesh must be rigged to the canonical skeleton or replaced by an approved character model. Future motions should ship as location/role-specific GLBs or animation-only glTF assets, loaded on demand and shared on disk; do not ship all 113 FBX files or load every clip for every NPC.

The 113 source FBX files total about 427 MB before ZIP compression. The two-clip processed GLB is about 544 KB; the local Babylon loader is about 307 KB. These are development measurements, not a 113-clip size forecast. `NEEDS_REVIEW`, `NEEDS_RETARGET`, `NEEDS_PROP`, and `DISABLED` in `catalog.json` prevent automatic assignment. The next pass should approve a production character mesh and a neutral idle, then retarget a small role-specific set and test it in a real scene without changing gameplay anchors.
