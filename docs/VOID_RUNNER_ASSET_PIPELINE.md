# VOID//RUNNER: 3D Asset Pipeline

How a third-party model gets from a download into the game.

1. **Get it legally.** Only commercially usable licences (see `VOID_RUNNER_ASSET_LICENSES.md`). Keep downloads **outside the repo**, for example `%LOCALAPPDATA%/void-runner-assets/downloads/<pack>/`. Archives are treated as data; nothing inside them is ever run.
2. **Import:** `node tools/assets/import-models.cjs <extracted folder> <library folder> --pack <name>`
   - **Converts:** every glTF becomes one self-contained GLB (buffers and textures embedded; shared texture folders are found by unique file name), which is what the game's loader (`void-runner/asset-pipeline.js`) accepts.
   - **Writes `import-report.json/.md`:** triangles, size in metres, materials, textures (and missing ones), animations, skins, duplicates, suspicious scales and compression.
   - **Assigns nothing:** importing only adds to the library.
3. **Review:** `node tools/assets/gallery-server.cjs [library folder]`, then open http://127.0.0.1:5191/ (this computer only).
   - Renders every model with game-like lighting and a reflection environment, with sizes and triangle counts.
   - Shortlist and Reject buttons write `<library>/decisions.json`.
   - The 3D view can be orbited.
4. **Try it in the game (optional):** copy a GLB into `void-runner/assets/models/_staging/` (git-ignored) and point a slot at it from the browser console. For example, `VoidAssets.models.ships.raider={src:'assets/models/_staging/striker.glb',scale:.45,yaw:0}` before launching.
5. **Approve and register:** only after David's approval, the GLB is committed under `void-runner/assets/models/<category>/`, listed in `VOID_RUNNER_ASSET_LICENSES.md`, and mapped to a game object.
   - The registry file (planned: `void-runner/assets/models/registry.json`) replaces the empty in-code `VoidAssets.models` object.
   - Gameplay keeps using stable ids such as `ship:raider`, so swapping a model never touches flight, combat or collision code.
   - If a model fails to load, the procedural model is used automatically.
6. **Before/after:** `node tests/graphics-snapshots-browser.cjs <folder>` captures the main scenes for comparison.
