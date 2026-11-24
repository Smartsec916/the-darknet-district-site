# Advanced NPC workshop handoff

Development branch `codex/advanced-npc-library`, based on public main `971c9e3f`. All measurements below are local. The asset files and identifiable source previews live in the ignored `.npc-workshop/` directory in the ncz-food-stands worktree.

## Nomi

Recovered the named Studio package in Downloads/New Downloads and the unrigged Meshy girl_pigtails_remeshe files (1122044657 and 1123000340). The private shipped model is npc-nomi.vrpak. The unrigged and Studio position arrays match exactly across 19,414 vertices. The shipped GLB passes the same position hash guard. Compression changed the image payloads. The geometry evidence points to the approximate Studio weights as a cause of facial deformation. Above y = 0.73, within 0.083 m of the centerline, neck influence averaged 50.2%, head 41.6%, chest 6.5%, and each upper arm about 0.8%.

`tools/animation-pipeline/refine_nomi.py ORIGINAL.glb OUTPUT.glb` widens the cheek contour, transforms normals and blends the skull weights into the nape. The shipped and refined GLBs each occupy 15,062,748 bytes and contain the original 26 clips. Blender sampled each clip at nine frames. Worst sampled 95th-percentile absolute facial edge strain in walk dropped from 17.4% to 0.2%, in head-tilt from 19.8% to 1.2%, and in recline from 16.4% to 3.3%. Sources, improved GLB, portraits and pose reports are in the workshop. The Blender samples measure mesh-local coordinates. Actual bed contact still needs an in-room visual check.

Private asset branch `Smartsec916/void-runner-licensed-assets:codex/advanced-npc-library`, commit `535b80a`, holds the packed replacement at the existing model path and the new motion library. Original remains in private main. Location, dialogue and voice data use the existing Tea Room integration.

## Pinky

Owner confirmed the original Meshy Blonde_Character_Ring_1122032423 mesh by its portrait. The Android screenshot identifies a separate 36.32 MB Pinky_Ringed_Model_20261121_animated_mixamo_All_animation (1).glb. That binary is absent from the Windows inventory. Its bind matrices and bone scales remain undiagnosed.

`prepare_ring_character.py` built a separate rig from the 257,544-triangle source using barycentric weight transfer, side-specific lower-leg weights, seam welding, continuous knee and ankle weights, surface-area and silhouette verification, real-time mesh reduction and 2K texture limits. Pinky.glb in candidates has 37,500 exported triangles, 19 joints, four influences maximum, 26 clips and 4,323,276 bytes. All clips imported in Blender and yielded finite skinned vertices at nine frames per clip. The worst sampled 99th-percentile leg edge stretch ratios were 1.149 for walk, 1.264 for run and 1.298 for recline, relative to rest length. The first reduction lost most of the surface and was rejected on visual inspection. The retained topology reproduces the source rest surface area within 0.1%. Continuous hinge weighting reduced the corresponding walk/run ratios from 1.316/1.592 on the same topology. Inspect the knee and hip folds and furniture interactions before release. Pinky is staged locally.

## Library and imports

Developer Tools → NPCs → NPC Library reads the same IndexedDB records as NPC Importer. Use Import a prepared folder and select `.npc-workshop/candidates` on the owner's signed-in browser. The importer verifies hashes, preserves record IDs, skips previously imported entries, and reports per-file failures. The UI has staging and archive categories, duplicate evidence, technical details and two interactive Babylon previews. Edit / preview opens the existing editor. A validated rig with embedded clips can pass its existing technical checklist. That status is distinct from visual approval. World publishing of a brand-new private model still requires registration in the asset pipeline. Full assignment of arbitrary library models to all world roles is unfinished.

Run Python 3.11+ `inventory_npc_assets.py FOLDER ... --output inventory.json`; then `prepare_library_candidates.py inventory.json Nomi-shipped.glb OUTPUT --source-contains ARCHIVE_NAME`. Run Blender in background with `--disable-autoexec --python-exit-code 1 -P preview_library_candidates.py -- OUTPUT`. The candidate adapter supports the downloaded archive's VRM-style names and records other rigs for individual review. Always use a separate output folder. `sample_nomi_poses.py` is for single-mesh figures with the Nomi coordinate convention.

Downloads inventory: 621 entries (388 require Blender inspection, 153 unclassified meshes, 78 rigged humanoid candidates and 2 Studio packages); 175 identical-hash groups. Nine oversized ZIP members were skipped and recorded. Project model/animation folders added 251 entries. No downloaded originals were removed. Twenty-three characters from game-20261102-02234611-code.zip received nine clips. Blender rendered 22 previews. Vex R measures 0.40 m and remains under review. Some archive names coincide with world NPCs. The importer resolves display-name collisions without substituting these candidates for the live characters. Local source and QA manifests list each file. Additional unrigged downloads, FBX and Blend assets still need individual inspection.

The installed Meshy Blender bridge accepts downloads initiated from its web app. No Meshy account API credential was configured in the session environment. Higgsfield project discovery returned zero accessible 3D Jutsu projects and zero media projects. No generation requests were issued.

## Animation and performance

The owner's downloaded Meshy Running FBX was retargeted in Blender onto the shared Mixamo-named skeleton at 24 fps. The separately packed 53,212-byte skeleton-only GLB has one run clip with 16 samples and 19 mapped source joints. The catalog exposes it as meshy-run. Selecting the clip routes to its library. Autonomous action pools were not expanded.

An Edge/SwiftShader benchmark at 800 × 600 used four independent animated instances, a shared container and idle-f, walk, sit and recline. Two runs per version in shipped/refined/refined/shipped order, 25 warm-up frames and 75 measured frame intervals per run. Shipped median frame intervals 33.4/41.6 ms, p95 41.7/41.7 ms, load 480/580 ms, median animation evaluation 0.2/0.2 ms. Refined medians 41.6/41.6 ms, p95 41.8/41.7 ms, load 562/574 ms, median animation evaluation 0.3/0.3 ms. Both variants used four draw calls. Heap samples are in benchmark.json. No speedup was established. ROG Ally, actual crowds, room transitions, Tier 1 comparison and full Tier 2/3 rig audit remain open.

## Verification and release

Local focused Node tests: 56 passed. Python story, progression and API checks: 44 passed. Actual Dev Tools workflow passed in a fresh Edge profile with offline developer identity: import, stable rename, duplicate warning, archive/restore, world draft unchanged and refusal to delete a referenced asset. Remaining gates include a production-compatible publishing rehearsal, representative gameplay/hardware measurements, and in-world seated/reclining QA. The website and game ship via GitHub Pages; Render hosts the APIs. Production has not been modified.
