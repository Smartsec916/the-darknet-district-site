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

## Meridian Station consistency (David's requirement, 2026-10-16)

**Where Meridian is drawn, all from one shared definition:**
- **Exterior:** `VoidMeridian` in `void-runner/meridian-station.js` holds the station's design (hangars H01–H03, solar arrays, docking collar, comms, windows, tanks), builder and model slot. It's used by:
  - the **main menu** (`VoidMeridian.menu`)
  - the **campaign exterior**: departures, arrivals, docked and arrival screens (`stationModel` in `babylon-renderer.js`, which only hides pieces overlapping the walkable interior)
  - **skirmish**, whose flight arena ends at Meridian
- **Interior:** one layout, `meridian-interior.js`, plus the approved props from `model-registry.js`. Skirmish's on-foot mode uses the derelict station, not Meridian.
- **Loading and transitions:** the 3D renderer draws every non-menu mode, including docked and arrival screens.
- **Retired:** the old painted ring-station image (`art/station.png`). It looked nothing like the 3D station and was only used by the old 2D renderer, which never runs, yet it was downloaded (2.7 MB) on every visit. Verified: no longer requested.
- **Screenshots:** `docs/void-runner/graphics/meridian-consistency/` (menu, arrival exterior, interior).

**Exterior cladding (approved by David 2026-10-16, with plainer roofs):** `meridian-kitbash.js` covers the shared design's hangars and modules with about 1,440 MegaKit pieces. It's applied wherever Meridian is built: the menu, the campaign exterior (arrivals and docked screens), and the station scene seen from the hangar.
- **Pieces:** panels, structural ribs, one plain deck plate, pipe racks, vents and light strips.
- **One definition:** the module sizes now live in `VoidMeridian.design.modules`, so the builder and the cladding can't drift apart.
- **Never half-clad:** if any piece fails to load, the plain hull stays.
- **Cost:** pieces are drawn as thin instances, about 20 draw objects. Measured flight rendering was 0.4 ms per frame without cladding and 0.9 ms with it; a first version using separate instances cost 13.5 ms and was rewritten. The menu loads its own copies, freed with its scene.
- **Screenshots:** `docs/void-runner/graphics/meridian-kitbash/`.

**Still outdated or open:**
- **Layout versus David's reference art:** the reference (`D:/Pictures/Game/Start/Meridan Station/`) shows H01–H03 side by side under the "MERIDIAN STATION / FUEL · REPAIRS · SUPPLIES" block, with tall solar wings above and below, stacked orange-banded tanks aft, the docking ring lower right and a hanging module underneath. The game's layout spreads H02 and H03 to the sides. Matching the reference is an architecture change and needs approval. H01, the walkable interior, would not need to move.
- **Mirrored sign:** "SUPPLIES / OUTFITTER" reads mirrored from inside the concourse. It predates this work.

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
