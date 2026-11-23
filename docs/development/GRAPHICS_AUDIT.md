# Graphics audit: placeholder and legacy graphics (Blender modernization)

The owner's brief (23 Nov 2026): **only change how VOID//RUNNER looks, never how it plays.** Replace primitive placeholder geometry and outdated objects with
Blender-made, optimised GLB assets in the style of `docs/VOID_RUNNER_ART_DIRECTION.md` ("PERMANENT DIRECTION"), keeping every interaction id, trigger, collision
solid, NPC obstacle, footprint and the walkable space.

**Scope change (the owner, same day): "work outside The Darknet District".** Nothing inside the District interior is replaced. The District rows below are kept for
the record and marked *out of scope*.

Status words: **identified** (listed here), **modeled** (built in Blender and exported), **integrated** (drawn in the game), **verified** (looked at in the game,
interactions, collisions and console checked, frame time compared). Priority follows the brief: P1 boxes as furniture or equipment, P2 cylinders or spheres as
machinery, P3 flat-colour placeholders, P4 older procedural meshes, P5 low-detail architecture, P6 unfinished objects, P7 repeated primitives worth instancing.

How these were found: the build code of each area was read (every `box(`/`cyl(`/`MeshBuilder.Create*` call and what it stands for), and where the collision
comes from was checked. In NeoChinatown and the District, **collision never comes from the drawn meshes**: it is data (`solids` in `neochinatown.js`,
`VoidBackAlleys.solids()/obstacles()`, the gates' and containers' own lists), so a visual can be swapped without touching it. Walls, floors, kerbs, the
building shells and the collision boxes themselves are architecture, not placeholders, and are not counted unless they are also visibly crude.

---

## 1. NeoChinatown streets (in scope: batch 1 is here)

### 1a. Back alleys, bays and yards (`void-runner/ncz-backalleys.js`, `build()`): batch 1

The furniture is placed by fixed, seeded rules (`furniture(q)`), solid for the player (`solids()`) and an obstacle for NPCs (`obstacles()`). Avenue 36, Old Town 51,
Far South 33 pieces. Every one was a group of plain boxes and 8-sided cylinders with a tinted tiling texture.

| Original object (function / mesh) | Size and place | Purpose, dependencies | Shortcomings | Replacement | Pri. | Status |
|---|---|---|---|---|---|---|
| Dumpster: `furniture` kind `dumpster`, `back-part` boxes (body, rim, lid), 4 `back-cyl` wheels, a bar | 2.0 x 1.1 x 1.3 m against the alley walls; 50 in the three quarters | Scenery; solid and NPC obstacle by data (`KINDS.dumpster`) | A flat painted box with a black slab lid | `dumpster_green` / `dumpster_blue`: tapered welded body, ribs, rim channel, fork pockets, lifting bars, castors, two moulded plastic lids (one ajar), push bar, sanitation and no-dumping stencils; 1,704 tris | P1, P7 | verified |
| Crate / crate stack: kind `crate`, `crates` (1 to 3 boxes) | 1.05, 0.97, 0.89 m cubes, stacked | Scenery; solid by data | Plain wood-textured cubes | `crate`: plank box in a batten frame, corner posts, diagonal braces, steel corner caps, stencil; scaled to each old cube; 840 tris | P1, P7 | verified |
| Pallet stack: kind `pallets`, 5 boxes | 1.2 x 1.0 m, 0.12 m slabs, 0.7 m stack | Scenery; solid by data | Five solid slabs | `pallet`: five deck boards, three stringers on nine blocks, three bottom boards; five per stack with the old jitter; 880 tris | P1, P7 | verified |
| Oil drums: kind `drums`, two `back-cyl` (8 sides) | r 0.29, 0.9 m, a pair | Scenery; solid by data | Bare 8-sided cylinders | `drum_rust` / `drum_blue`: 24-sided drum, rolling hoops, rolled chimes, lid and bungs, a FLAMMABLE band on the rusty ones; 1,164-1,180 tris | P2, P7 | verified |
| Generator: kind `generator`, body box, skid box, vent box, LED box, exhaust cylinder | 1.8 x 1.0 x 1.25 m (+ exhaust to 2 m); 8 in the yards | Scenery; solid by data | A green box | `generator`: enclosure on a skid with fork channels, corner pillars, louvred door, side louvres, control panel with gauges and a data plate, switches, lifting eyes, fuel cap, exhaust with flange and rain cap; status LED kept as the alley's own red glow; 1,958 tris | P1 | verified |
| Wall utility box: `wbox(... .9,.6,.3, steel)` in the wall loop | 0.9 x 0.6 x 0.3 m on alley walls, 1.4 to 3.4 m up | Scenery only (no solid) | A steel box on the wall | `utility_box`: cabinet with rain hood, two-leaf door, hinges, lock handles, HIGH VOLTAGE and grid plates, vent slots, mounting rails, two conduits down the wall with saddle clips; 796 tris | P1, P7 | verified |
| Wall lamp housing: three `wbox` (arm, housing, lens) | arm 0.36 m, housing 0.42 x 0.16 x 0.3 m | Scenery (the light is a drawn pool, not a lamp) | Two black boxes | `wall_lamp`: wall plate with bolts, arm with gusset, finned hood, bezel, wire guard; the lens stays the alley's own sodium / teal / magenta glow box; 436 tris | P1, P7 | verified |
| Trash bags: `back-bag` spheres (6 segments) | 0.6 to 0.85 m by dumpsters | Scenery | Faceted black blobs | Tied bin bags (soft body, knot) | P2 | identified |
| Loading dock: kind `dock` (concrete box, hazard strip, bumpers, shutter, flood, bollards) | 6 x 1.8 x 0.95 m in bays | Scenery; solid by data | Boxes, but reads as architecture | Dock kit: chamfered concrete with steel edge, rubber bumpers, roller shutter with guides and motor box, bollards | P5 | identified |
| Wall conduits and pipes: `wbox` rails, `cyl(.07,9,...)` downpipes | along every wall | Scenery | 8-sided pipes, plain rails | Kit `pipe_vertical_1m` / `cable_bundle_4m` already exist in `assets/models/kit/` (unused) | P4 | identified |
| Fire escapes (`escapesIn`): gratings, rails, ladders, braces as boxes | on back facades | **Gameplay** (climbing: `CLIMB`, `grab`, `perch`) | Thin plain boxes | Visual skin only over the same frame (the kit has `fireescape_landing_3m`, `fireescape_ladder_1m`), climbing points unchanged | P4 | identified (careful: gameplay links) |
| Stairwells to the tunnels (`UNDER`) | 3 entrances | **Gameplay** (`groundAt`, solids) | Boxes | Concrete stair kit, visual only | P5 | identified |

### 1b. The District alley and the street (`neochinatown.js`, street part of `build()`)

| Original object | Where | Purpose | Shortcomings | Replacement | Pri. | Status |
|---|---|---|---|---|---|---|
| `alley-crates`, `alley-pallet`, `alley-seat` (boxes) | District entrance alley, x 93..133, z -56..-61 | Scenery; NPC seats are separate data | Plain boxes | Batch-1 `crate` / `pallet`; a seat made of crates and a board | P1, P7 | identified (models exist) |
| `alley-ac` (1.1 x 0.9 x 0.6 box), `wall-ac`, `roof-ac` + `roof-ac-grille` | alley walls, facades, roofs | Scenery | Boxes | Kit `clutter_ac_unit_1m` + `clutter_ac_bracket_1m` (exist, unused) | P1, P7 | identified |
| `junction-box`, `conduit`, `downpipe` | alley walls | Scenery | Boxes | Batch-1 `utility_box`; kit pipes | P1 | identified (model exists) |
| `dumpster` + `dumpster-lid`, `-rib`, `-wheel`, `-sticker` | District alley | Scenery | Boxes | Batch-1 `dumpster_green` | P1 | identified (model exists) |
| `alley-drum`, `alley-firedrum` (+ band, fire core), `alley-can` | District alley | Scenery; the fire drum has a fire effect | Cylinders | Batch-1 `drum_rust` (keep the fire effect) | P2 | identified |
| `water-tank` + `tank-leg`, `dish-post`, `tower-mast`, `skyline-spire` | roofs and skyline | Scenery, distant | Cylinders and boxes | Kit `roof_watertank_2m`, `roof_antenna_1m`; far ones can stay simple | P2 | identified |
| `parapet`, `district-roofline`, `old-building` | building tops, background blocks | Architecture | Flat boxes | The building kit (`BUILDING_KIT.md`), a larger job | P5 | identified |
| Street buildings (plot loop) | every street | Architecture; collision by data | Box buildings with painted facades (the purchased `ncz:building5` / `storefronts` replace some on the live site) | The building kit, block by block | P5 | identified |
| Lamp posts, taxi poles, bins (`instance('bin')`), benches | pavements | Scenery; taxi stops are gameplay data | Mixed: some models, some boxes | Street furniture set (post, bench, bin, bollard) | P1 | identified |

### 1c. Other street systems (first pass)

| File | What is placeholder | Shortcomings | Replacement idea | Pri. | Status |
|---|---|---|---|---|---|
| `ncz-street-glow.js` | vending machine fronts, strip lights, tube signs (`ncz-glow-part` boxes, merged per colour) | Boxes with emissive faces | A vending machine model (a purchased one exists for the District only), strip-light fixture | P3 | identified |
| `ncz-gates.js` | gate pylons, scanner posts, shutters, beacons, bollards (87 primitives) | Boxes and cylinders; gates are **gameplay** (transit) | Visual skin over the same gate frame | P4 | identified |
| `ncz-food-stands.js` | stall chassis, wheels, pots, stools (27) | Already detailed with boxes; reads acceptably | Later: stall model | P4 | identified |
| `ncz-containers.js` (The Outskirts) | `o-box` scrap, drums, tyres (torus), pallets, the code-built containers when the purchased pack is absent | Boxes | Batch-1 drums / pallets / crates; licensed packs already cover containers on the live site | P1, P7 | identified |
| `ncz-rooftop-signs.js`, `ad-screens.js` | sign trusses, screen frames | Recent, acceptable | none now | - | identified |

---

## 2. Other accessible areas (first pass)

| Area (file) | Most obvious placeholders | Pri. | Status |
|---|---|---|---|
| NULL nightclub (`ncz-nightclub.js` `buildOwn()`, 38 primitives) | bar counter, DJ booth, VIP booths, speakers as boxes (a purchased `nightclub.vrpak` replaces it when published) | P1 | identified |
| Milked (`milked-build.js`, about 300 primitives) | flat boxes for counters, shelves, tables, signs (the art direction already lists it as an upgrade candidate) | P1 | identified |
| Corporate District (`corporate-build.js`, 91) | desks, planters, barriers, kiosks as boxes | P1 | identified |
| Zen Zephyr Temple (`temple-build.js`, 89) | lanterns, benches, offering tables, pillars | P1, P2 | identified |
| Modules and apartments (`module-build.js` 247, `apartment-build.js` 60) | room furniture (tables, beds, shelves, crates, racks) as boxes; the underground modules | P1, P7 | identified |
| Meridian Station (`meridian-station.js` 29; the interior uses its own kit `meridian-kit`) | exterior details, docking props | P4 | identified |
| Ship interior / cockpit (`cockpit-3d.js`, 16) | console blocks, seat | P1 | identified |

---

## 3. The Darknet District interior (OUT OF SCOPE: the owner, 23 Nov 2026, "work outside The Darknet District")

Recorded only; nothing here is changed. The hallway, vestibule, shop counter, guns, arcade cabinets and pod facades are already Blender kit pieces
(`DISTRICT_INTERIOR.md`).

| Original object (`neochinatown.js` `buildInterior`) | Size and place | Shortcomings | Status |
|---|---|---|---|
| `meeting-table` (box) and six `meeting-chair` boxes | 4 x 2.4 m table at (9, 62.5); chairs 0.6 x 0.9 x 0.6 m | Plain boxes; the table is also a collision solid (`meeting-table`, data) | identified, out of scope |
| `server-rack` boxes with a painted front | eight, 0.9 x 2.4 x 0.8 m, meeting room | Boxes with a texture | identified, out of scope |
| `terrace-bench`, `ash-bin`, `terrace-vent` | smoking terrace | Boxes, a cylinder | identified, out of scope |
| `vend-bin` | vending alcove | A box | identified, out of scope |
| `pod-terminal` | Sleeping Pod room (protected room) | A box | identified, out of scope (and protected) |
| Bar, VIP, VR rig details (`district-rooms.js`) | various | Partly upgraded already | identified, out of scope |

---

## 4. Batch log

### Batch 1 (23 Nov 2026, branch `claude/graphics-modernization`): NeoChinatown back-alley props

- **Source:** `tools/assets/kit/build_street_props.py` (Blender `bpy` by code; no third-party assets). Output `void-runner/assets/models/ncz-props/ncz_street_props.glb`
  and `ncz-props-manifest.json`.
- **Budgets:** 9 models, 10,662 triangles in all (436 to 1,958 each). One material `ncz_props` with one 2048 px atlas (colour, normal, metal/roughness; JPEG,
  embedded), so the whole set is one download (about 4.3 MB) and one material; every copy is a hardware instance of its model. Wear: atlas (chips, rust,
  drips, scratches, grime towards the ground) plus vertex colours (worn chamfers, contact shadow).
- **Integration:** `ncz-backalleys.js` `build()` gets `instance` from `neochinatown.js`; the model is registered as `ncz:street_props` (street area only). On
  Medium, High and Ultra the props are drawn; **Low keeps the box-built props** (the ROG Ally budget), and so does a missing model. The old parts are still worked out
  in the same order (so every random number, and with it everything placed after them, stays where it was) but not drawn. Solids, NPC obstacles, places and
  counts are unchanged (`VoidBackAlleys.solids()` / `obstacles()` are pure data and were not touched).
- **Evidence and numbers:** see the pull request and the session report.
