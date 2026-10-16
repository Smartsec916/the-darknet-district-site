# VOID//RUNNER: Graphics Roadmap

**As of 2026-10-16.** "Done" means it's in the game and was checked on screen; everything else is planned.

## Done
- **Phase A (audit) and Phase B (art direction):** `VOID_RUNNER_GRAPHICS_AUDIT.md` and `VOID_RUNNER_ART_DIRECTION.md`.
- **Phase C (infrastructure):**
  - model registry (`void-runner/model-registry.js`) on top of the existing GLB loader with automatic fallbacks
  - bulk importer (`tools/assets/import-models.cjs`)
  - texture optimizer (`tools/assets/optimize-textures.cjs`)
  - developer gallery (`tools/assets/gallery-server.cjs`)
  - before/after captures (`tests/graphics-snapshots-browser.cjs`)
  - see `VOID_RUNNER_ASSET_PIPELINE.md`
- **Phase D (discovery):** three CC0 packs downloaded with David's permission, 237 models imported and reviewed (`VOID_RUNNER_ASSET_CANDIDATES.md`).
- **Phase E (first replacements), approved by David:**
  - **Ships:** raider (Striker), interceptor (Challenger), gunship (Insurgent), courier (Dispatcher), shuttle (Imperial), station security (Omen). These are 3D models in flight, station exteriors and skirmish, scaled to the old gameplay sizes. Hit sizes and AI are unchanged.
  - **Meridian:**
    - the hangar cargo corner: 4 crates and 2 barrels replace 5 boxes
    - supply shelving: 4 units replace boxes; the collision boxes are unchanged
    - crew-quarters lockers: 2
    - the outfitter counter: 2 desks
    - all visual only; collision is unchanged
  - **Reflection environment** for PBR materials, built in code with no downloads. Vesper was checked and looks unchanged.
- **Total model download size for players:** about 6 MB (models load only in scenes that use them).

## Not done / known limits
- **Kestrel and faction ships:** still procedural (by decision).
- **Named NPCs:** still box figures. No free set of realistic clothed humans has been found; this needs David's choice (a Sketchfab CC-BY set or a paid pack).
- **Meridian props have no collision.** The old boxes in the hangar corner had none either; adding collision would change navigation and needs approval. The supply shelves sit on their existing collision boxes.
- **Supply shelves look empty:** the old box "cases" were hidden with the shelves. Small crates or cases could be added on them.
- **Not visually re-checked** after the new environment: the derelict station, the Darknet District, the homeworlds. The capture script's District view also needs fixing.
- **The MegaKit (free) is on hold:** near-black materials.
- **Phase H (rendering):** not started.
  - shadows outside the opening scene
  - an Ultra preset
  - ambient occlusion
  - a better HDR environment (a Poly Haven HDRI would need David's OK to download)

## Next suggested steps
1. Fill the empty shelves and add a few more Essentials props to the bar and hangar.
2. Decide on NPC models.
3. Phase H rendering pass.
4. Extend the props to other stations (Kepler, Rusthaven, Foundry share `station-layouts.js`).
