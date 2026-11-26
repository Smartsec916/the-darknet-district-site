# Space-station graphics overhaul (26 Nov 2026)

Branch `claude/station-graphics-overhaul`, build `2026-11-26-station-kit-1`. Presentation only: no mission, NPC, service, collision, door,
interaction, travel or save change. **Pushed; not merged, not deployed** (see "State" at the end).

## What a station is in this game (the audit)

Every station is one shared design (the owner, 23 Oct 2026): `meridian-station.js` builds the hull (three hangars H01–H03, the service spine,
habitation, bar module, communications tower, tanks, solar wings, the large-ship collar) and `meridian-interior.js` gives the walkable plan
(hangar, pressure door, narrow corridor, living area with sleeping pods and washroom, store, the bar and seating hall with its windows).
`station-layouts.js` gives each station its name, palette, bar name and contacts.

| Station (id) | Exterior | Interior | Upgraded |
|---|---|---|---|
| Meridian Station (`meridian`) | shared hull, lettering MERIDIAN | shared plan, Rook and Nyx | yes |
| Kepler Exchange (`kepler`) | shared hull | shared plan, Dr. Sol | yes |
| Rusthaven Port (`rusthaven`) | shared hull | shared plan, Iona | yes |
| The Foundry (`foundry`) | shared hull | shared plan | yes |
| Tessaly Belt Anchorage (`sol-belt`) | shared hull | shared plan | yes |
| The Vigil (`vigil`, Communion) | shared hull | shared plan, Dr. Elara Voss | yes |
| Holdfast (`holdfast`, Natural Order) | shared hull | shared plan, Marcus Vale | yes |
| Derelict Space Station (`derelict-station`, Skirmish) | none (interior only) | its own authored layout | wall plating, crates, service gear |

No station was added. Planets, NeoChinatown, the District and Vesper were not touched.

**Before:** hull = plain boxes with flat colours under a skin of stretched free-kit panels (Quaternius MegaKit); interior = the same free kit scaled
to fit, flat box ceilings, emissive strips for lamps, box furniture; eight real lights for the whole station.

## What was built

### The kit (Blender, by code)
`tools/assets/station-kit/build_station_kit.py` (run with the `bpy` package, Blender 5.3) builds **63 pieces, 32,806 triangles**, into ONE file,
`void-runner/assets/models/station-kit/station-kit.glb` (2.3 MB, no pictures inside). Pieces are metric, bevelled, and name shared materials.

- **Walls:** `wall_low` (kick plate, framed panels, rail), `wall_mid_a..e` (plate, vent and pipe, service hatch, wall console, ribbed with a paint band),
  `wall_mid_port` (the bay round a corridor porthole), `wall_top` (cable tray, pipes, a light cove), `wall_clere`, `pilaster_36/50`,
  `hangar_panel_a/b` (cross-braced plates; pipes, cabinet and ladder), `hangar_rib`.
- **Ceilings:** `ceil_corridor` (ducts, cable trays, a hung light trough), `ceil_room_a/b` (coffers, hung lights, a round duct), `hangar_truss`
  (36 m lattice with floods), `hangar_ceil`, `hangar_crane`.
- **Decks and markings:** `floor_grate`, `floor_hazard`, `floor_chevron`, `floor_line`, `pad_ring` (landing circle with deck lights).
- **Doors and windows:** `door_frame` (pressure door surround with actuators, status panels, hazard bands), `portal_3m/5m`, `window_bay`, `porthole`.
- **Furniture:** `bar_counter`, `backbar` (shelves and bottles), `booth`, `table`, `chair`, `pod_shell`, `shop_shelf`, `terminal`, `crate_a/b`, `drum`.
- **Hull:** `hull_a..e` (plates, pipework, radiator bay, two window rows), `hull_coping`, `roof_plate`, `roof_unit_a/b/c`, `truss`, `solar`, `tank`,
  `collar`, `mast`, `dish`, `mouth_frame`, `thruster`, `radiator`, `greeble_a/b/c`.

Triangle counts per piece: `station-kit-manifest.json` (largest: backbar 2,332, tank 1,812, collar 1,792, hangar_truss 1,480, mast 1,392; the hull plate `hull_a`, the most numerous piece, is 112).

### Textures (generated, nothing downloaded)
`tools/assets/station-kit/station_textures.py` writes `void-runner/assets/textures/station/` (6.5 MB): `st_hull` 2K (tiles every 8 m), `st_wall` and
`st_deck` 1K (every 4 m), and the `st_trim` 2K atlas (hazard stripes, vents, gratings, screens, light diffusers, lit windows, placards, cables, solar
cells, deck markings). Each has colour, normal and occlusion/roughness/metal; the atlas also has an emissive picture. The existing District sets
`kit_gunmetal` and `kit_steel` are reused for frames and bright steel.

### Meshy props
18 models generated (text to 3D preview 20 credits + PBR refine 10 credits each = **540 credits**; the account showed 4,863 before and 4,323 after).
`tools/assets/station-kit/prepare_props.py` (Blender) welds, decimates, scales to metres, shrinks the maps (1K colour and normal, JPEG) and writes
`station-props-interior.glb` (4.4 MB, 9 props) and `station-props-exterior.glb` (2.2 MB, 4 props). Medium quality and above.

| Prop (file name in the game) | Meshy preview / refine task | Raw faces | In game | Used |
|---|---|---|---|---|
| bar stool (`prop_stool`) | 01a215db-d24a / 01a215dd-85b5 | 29,383 | 2,495 | the bar's six stools |
| lounge armchair (`prop_armchair`) | 01a215db-dad3 / 01a215dd-f424 | 29,570 | 3,999 | hall and living area |
| tool cart (`prop_toolcart`) | 01a215db-a48a / 01a215dc-ae06 | 29,078 | 4,950 | hangar |
| power generator (`prop_generator`) | 01a215db-9b7b / 01a215dc-ac7e | 27,249 | 6,985 | hangar |
| fuel pump (`prop_fuelpump`) | 01a215db-ae23 / 01a215dc-af77 | 30,626 | 5,000 | hangar |
| gas cylinder rack (`prop_cylinders`) | 01a215dc-0058 / 01a215dc-b68a | 29,882 | 4,996 | hangar |
| cargo tug (`prop_loader`) | 01a215db-b7da / 01a215dc-b0f2 | 29,830 | 7,995 | hangar |
| vending machine (`prop_vending`) | 01a215db-ca52 / 01a215dd-f1ea | 27,950 | 7,215 | hall |
| cargo container (`prop_container`) | 01a215ca-34ec / 01a215ce-3674 | 25,114 | 3,494 | hangar |
| communications dish (`prop_dish`) | 01a215dc-122d / 01a215dd-8fdf | 30,036 | 6,974 | hull |
| antenna array (`prop_antenna`) | 01a215dc-1ab1 / 01a215dd-13d4 | 29,388 | 7,985 | hull |
| thruster pod (`prop_thruster`) | 01a215dc-2364 / 01a215dd-156a | 30,301 | 5,990 | hull |
| docking arm (`prop_arm`) | 01a215dc-2b7a / 01a215dd-16ef | 30,448 | 7,992 | by the collar |

**Rejected after inspection (generated, not in the game; 150 credits):** `ceiling-unit` (its fan hub came out as a three-pointed star that reads as
a car maker's badge), `pallet-crates` (garbled lettering on every case), `console` (a 1990s desktop computer, wrong period), `sleeping-pod` (a good
model but egg-shaped: it cannot stack in the two-tier pod banks the plan uses), `medical-station` (a red cross emblem). The raw downloads are not in
the repository; they stay in the owner's Meshy account under the task ids above (the refine ids of the rejected five: 01a215dd-1193, 01a215dd-87e4,
01a215dc-b25c, 01a215dd-196a, 01a215dd-a23c).

Rights: generated on the owner's paid Meshy plan from text prompts written for this game; no reference picture, licensed model or photograph was sent.

### In the game: `void-runner/station-kit.js` (`VoidStationKit`)
- Reads the piece file itself (a 40-line GLB reader) and **bakes** every copy of every piece in a room, or a hull section, into one mesh per
  material: an interior is about 60 meshes, however many pieces it holds.
- `interiorPlan(def)` lays pieces along `def.walls`, `def.rooms` and `def.furniture` from `meridian-interior.js`: wall rows per 2 m bay (4 m in the
  hangar), ceilings, deck plates, door frames, window bays, portholes, the bar, back bar, booths, tables, chairs, shelves, pod surrounds, the
  mission terminal, cargo and props. It only reads the layout (a test checks it is unchanged). The shell boxes it replaces are hidden, never their
  collision solids (`HIDDEN`).
- **Baked light.** `interiorLamps(def)` lists where the fittings shine from (about 190 lamps a station); their light is worked out once per vertex
  when the room is built and added in the shader by a small material plugin (`VoidStationBaked`). No extra real lights, no shadow maps, no
  per-frame cost. The eight real lights (bar amber, crew lights, hangar and concourse) are unchanged and still light people and the ship.
- **Dark walls, lit by lamps** (the owner, 26 Nov 2026: "Make the walls dark then use lights to light it up"): wall, deck and hull tints are dark
  gunmetal; the picture comes from the fittings.
- **Identity** (`identity` in the file): each station has its hull tint, wall tint, paint accent, lamp colour and wear. Meridian graphite with
  orange paint and warm lamps; Kepler cooler and blue; Rusthaven oxide brown with violet paint, worn; the Foundry warm and sooty; the Anchorage
  teal; the Vigil pale with cyan and cold light; Holdfast dark steel and amber, worn; the derelict rusted with emergency red.
- `exteriorPlan(design)` clads the hull from `VoidMeridian.design` (same positions and sizes) and stands the modelled tanks, solar arrays, trusses,
  collar, mast, dishes, thrusters, radiators and hangar-mouth frames where the plain ones stood (`VoidMeridian.build(...,{kit:true})` leaves those
  out). H02 and H03, seen from space, get decks, trusses, ribs, cargo and baked flood light. Small fittings drop out beyond 900 m. Seen from inside
  a station, roofs, undersides and the other hangars' insides are left out.
- `dressDerelict` plates the derelict's solid walls and swaps its plain freight and cover boxes for crates of the same footprint.
- **Fallback:** if the piece file or a picture cannot be loaded, nothing is added and the earlier dressing (`meridian-interior-kit.js`,
  `meridian-kitbash.js`) is used, as before. Low quality leaves out props, loose cargo, gratings, pilasters and hull fittings.

### Other files touched (only to fit the kit in)
`babylon-renderer.js` (fetch the kit before a station or its space scene; skip the old ceiling lamps, ribs, strips and terminal when the kit is up),
`meridian-art.js` (skip its box chairs, bottles, shelves, window seals and sofa cushions when the kit is up; the bar's neon, glow pools, pods and
lights stay), `meridian-station.js` (`kit` option), `derelict-station.js` (hands its walls, lamps and crate footprints to the kit),
`void-runner.html` (one script tag), `void-runner-sw.js` (BUILD), and one line in `vr-core.js` (next section).

## One decision the owner should know about: brightness on Medium and High

Medium and High multiply the finished picture by 0.3 everywhere outside the VR simulations (the open decision in `VR_SESSIONS.md`). Measured here,
that made every station nearly black on Medium, before and after this work. Raising the exposure to compensate (what Milked does) leaves white
capped at 30% and the picture flat. So, **only while the player is aboard a station dressed by the kit**, `vr-core.js`'s keeper now asks for the
full range, exactly as it already does for the VR simulations (`const want=session||globalThis.VoidStationKit?.aboard?1:.3`). The District,
NeoChinatown and everything else are untouched. To undo it: remove `||globalThis.VoidStationKit?.aboard` from that line.

## Measurements (Meridian, Medium, software renderer in a cloud container: relative numbers only)

| | Before | After |
|---|---|---|
| Triangles in view, hangar | 1,646,154 | 2,118,578 |
| Triangles in view, corridor | 1,521,700 | 1,831,886 |
| Triangles in view, hall | 853,784 | 772,504 |
| Meshes in view (hangar / corridor / hall) | 439 / 355 / 217 | 440 / 336 / 188 |
| Station load, dock to walking | 12.0 s | 13.0 s |
| New download, first visit | (old kits: 5.1 MB interior + 2.1 MB hull + 2.6 MB panel picture) | 2.3 MB pieces + 6.5 MB pictures + 6.6 MB props (Medium and above) |
| Hull in space: triangles / meshes | 330,000 / about 70 | 570,000 / 130 |

No frame-rate figure is given: this container has no graphics card, and software rendering does not predict the ROG Ally. **Not verified on real
hardware.**

## Pictures

`docs/development/station-graphics/`: before and after pairs for Meridian (hangar, corridor, living area, store, hall, bar; Medium), Kepler, the Vigil and
Holdfast (hangar, hall), the hull (six views), the derelict (three views), `seven-stations.jpg` (every station's hangar and corridor) and
`hull-identities.jpg`. Taken with software rendering in the build session: they show layout, materials and light, not final image quality. The
"before" station pictures are nearly black because of the 0.3 pass described above.

## Rebuilding

    python -m venv .venv && .venv/bin/pip install bpy pillow numpy
    .venv/bin/python tools/assets/station-kit/build_station_kit.py --textures      # pieces and pictures
    .venv/bin/python tools/assets/station-kit/prepare_props.py <folder of raw Meshy .glb files>

Tests: `tests/station-kit.test.cjs`. Bump `BUILD` in `void-runner-sw.js` after any change.

## Known limits

- Not seen on a real graphics card or the ROG Ally; frame rate in the hangar and in flight near a station is the first thing to check. If it is
  too heavy: lower the hull plan (`exteriorPlan`: drop `hull_b`, undersides) or the wall bay counts.
- Baked light has no shadows; props and people do not occlude it.
- Loose cargo and props have no collision (as the earlier cargo had none): they stand against walls, off the routes.
- The sleeping pods, lockers, washroom fittings, pressure-door leaves, maintenance terminal, signs and the bartender are unchanged.
- The seven stations still share one plan and one hull; they differ by finish, paint, lamp colour and wear only.
- The derelict keeps its own older floor and ceiling textures; only its solid walls, crates and some gear are new.
- The hull cladding repeats five plate types; from very close the repetition is visible.

## State

Pushed as branch `claude/station-graphics-overhaul` (26 Nov 2026). **Not merged to `main` and not deployed**: it has not been seen on a real
graphics card, and the brightness decision above is the owner's. `npm test` passes (2,066 pass, 0 fail, 3 skipped). The Python save tests could
not be run in the build session (no `flask`); no Python file changed.
