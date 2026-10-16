# VOID//RUNNER: Graphics Audit

**As of:** 2026-10-16 · **Brief:** David's "Comprehensive Game-Wide 3D Graphics Modernization" (Phase A) · **Baseline screenshots:** `docs/void-runner/graphics/baseline/` (captured with `tests/graphics-snapshots-browser.cjs`, Edge, 1280×720, High quality).

## 1. How the game draws things today

| Question (brief §4) | Finding |
|---|---|
| Main code | `void-runner.html` + about 90 classic scripts in `void-runner/`; Babylon.js 8.26 vendored locally (`void-runner/vendor/`, plus the official glTF loader plugin). |
| Babylon initialisation and scenes | One renderer module, `babylon-renderer.js` (about 1,100 lines), builds every space, station, workshop and room scene from code. Location scenes come from `meridian-station.js`, `meridian-interior.js`, `station-layouts.js`, `neochinatown.js`, `derelict-station.js`, `opening-scene.js`, `vesper-visuals.js` and `planets.js`. |
| Spacecraft | `shipModel()` in `babylon-renderer.js`: a hand-built Kestrel mesh (rings, plates, cylinders); procedural Communion and Natural Order hulls; a police cutter made of boxes. **Every other ship (raider, interceptor, gunship, courier, shuttle, security, ship2, ship3) shares one generic box-and-wedge shape.** ship2 and ship3 are the Kestrel stretched by 20–30%. |
| Station exteriors | Procedural (`meridianStation`, `stationModel`). |
| Station interiors | Boxes with painted or tiled textures on a fixed grid; doors, counters and stools are boxes and cylinders. |
| NPCs | `characterModel()`: **stacked boxes** (torso, coat tail, head, arms, legs) with per-character colours from `station-layouts.js`. No skeleton or animation in the game; one rigged test model (`assets/animations/mara-poc.glb`) is loaded only by a developer animation lab. |
| Weapons | The pistol and ship guns are procedural primitives. Lasers and missiles are pooled glowing meshes. |
| **Imported model support** | **Already exists:** `asset-pipeline.js` (`VoidAssets`) loads local GLB files, validates them (glTF 2.0, self-contained, no compression), caches each as an asset container, instances it, and **falls back to the procedural model** if loading fails. It is already wired into ships (`ship:<id>`), Meridian's exterior (`station:meridian`), NPCs (`character:<id>`), the opening workshop (`opening:<id>`, including the pistol) and rooms. **The registry is empty: no production model has ever been added.** |
| Collision | Separate from visuals: walk bounds and solids are boxes in the layout data; flight collisions are distance checks. Replacing a mesh does not change either. |
| Physics and movement | Custom flight model (`flight-physics.js`, `pilot-flight.js`) and walking controller. No physics engine. |
| Animation | Code-driven bobbing and turning for NPCs; flight effects in `combat-effects.js`. Skeletal animation only in the developer lab. |
| Asset loading | Per scene: `VoidAssets.prepare()` loads that scene's optional models before it opens, then releases them on exit. |
| Quality settings | Three presets: low, medium, high (render scale, rock and star counts). ACES tone mapping and vignette on all levels; FXAA plus bloom on medium and high; glow layer on high. **No image-based lighting, so PBR materials look flat; shadows exist only in the opening workshop; no ambient occlusion; no Ultra preset.** |
| Scene transitions | `VoidPreparation` tasks with loading screens; each scene's resources are disposed on exit (tested for leaks in `faction-browser.cjs`). |
| Saves | Unaffected by visuals; no model ids are saved. |
| Campaign vs skirmish | Same renderer and `shipModel()`, so a replaced model appears in both. |

## 2. Inventory and priorities

Visual quality: 1 is primitive, 5 is modern. Priority: 1 is first.

| # | Object | Category | Implementation (file) | Quality | Gameplay dependencies | Difficulty | Recommended asset | Priority | Risk |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Enemy raider / interceptor / gunship | Enemy ships | Generic box ship, `shipModel()` | 1 | Hit radius by `size`, not mesh | Low (hook exists) | 3 matching light/medium/heavy fighters from one pack | 1 | Low |
| 2 | Courier / shuttle / security traffic | Civilian ships | Same generic ship | 1 | None (visual only) | Low | Civilian hauler and shuttle from the same pack | 1 | Low |
| 3 | Named and generic NPCs | Characters | Stacked boxes, `characterModel()` | 1 | Interaction points are separate | Medium (scale, idle animation) | Rigged realistic or semi-realistic humans; **named characters need David's approval** | 2 | Medium |
| 4 | Kestrel (starter) | Player ship | Custom procedural mesh | 3 | Cockpit view is a painted overlay; exterior seen in hangars | Low (hook exists) | Only a model that keeps the Kestrel's identity; **needs approval** | 3 | High (iconic) |
| 5 | ship2 / ship3 | Player ships | Stretched Kestrel | 2 | Shop and hangar | Low | Distinct hulls from the same pack | 2 | Medium |
| 6 | Meridian hangar and bar props (stools, counters, crates, consoles) | Station furniture | Boxes and cylinders | 2 | Walk solids are separate | Low to medium | Coordinated modular sci-fi props | 2 | Low |
| 7 | Station interior walls, floors, doors | Modular environment | Textured boxes on a grid | 2 | Bounds and solids are separate data | High (layout must not change) | Modular kit pieces placed on the existing grid | 4 | Medium |
| 8 | Asteroids | Environment | Faceted icospheres | 2 | Hazard distance checks | Low | Scanned or sculpted rock models (few, instanced) | 3 | Low |
| 9 | Pistol | Weapon | Procedural, hook `opening:pistol` | 2 | Muzzle origin is a separate node | Low | Sci-fi sidearm | 3 | Low |
| 10 | Station exteriors | Stations | Procedural, hook `station:meridian` | 2–3 | Docking approach | Medium | Modular station exterior | 4 | Medium |
| 11 | Faction ships and police cutter | Faction ships | Procedural shapes | 2–3 | None | Medium | Must keep the approved faction looks (white/cyan; steel/orange) | 5 | Medium |
| 12 | The Darknet District, NeoChinatown | Environment | Boxes plus painted signage | 2–3 | Interactions, privacy rules | High | Later, after a modular kit is chosen | 5 | Medium |
| 13 | Vesper workshop and desert | Environment | Procedural plus painted textures | 3 | Opening tutorial | High | Later | 6 | Medium |
| 14 | Derelict station | Environment | PBR textures with normal maps | 3 | Fight layout | High | Damaged variants of the station kit | 6 | Medium |
| 15 | Cockpit | UI and environment | Painted image overlay plus 3D frame | **4** | All HUD | — | **Keep** | — | — |
| 16 | Planets and sky | Environment | Spheres with painted textures, sky images | 3 | None | Low | Keep; consider an HDR environment for lighting | 5 | Low |

**Keep procedural:**
- collision boxes, walk bounds and interaction triggers
- laser, missile and explosion effects
- navigation markers and the warp effect
- skyboxes
- the cockpit overlay

## 3. Highest-impact opportunities

1. **Ships in flight** (items 1, 2 and 5) are the biggest visual problem the player sees most. The hook already exists, so a coordinated ship pack can replace every generic ship without touching flight or combat code.
2. **NPCs** (item 3) are the most dated-looking element. Rigged models need a small idle-animation step, and named characters need David's sign-off.
3. **Lighting:** add an environment (IBL) texture so PBR materials render properly, plus Ultra and shadow options. This is only worth doing after real models arrive (brief §2: lighting can't fix boxes).
4. **Props** in Meridian's hangar and bar (item 6): cheap and visible.

## 4. Gaps in the existing asset system (for Phase C)

- **No registry file.** `VoidAssets.models` is an empty object in code. The plan is a JSON registry (`void-runner/assets/models/registry.json`) with stable ids, scale, rotation, category, environment variants, licence reference and approval status.
- No import tool, candidate gallery or licence inventory.
- The validator rejects Draco, meshopt and Basis compression. Most packs ship uncompressed GLB, so this is fine at first.
- Instancing: each `instance()` call clones the container (`instantiateModelsToScene`). That's fine for a handful of ships; for many props, thin instances may be needed later.

## 5. Baseline capture notes
- Captured: main menu, Meridian hangar with the Kestrel, Meridian bar with Rook, Vesper workshop with Mara, and flight with a raider. Files are in `docs/void-runner/graphics/baseline/`.
- The NeoChinatown capture showed open space instead of the District. The script needs to enter that location by its landing path, and will be fixed before any "after" comparison.
