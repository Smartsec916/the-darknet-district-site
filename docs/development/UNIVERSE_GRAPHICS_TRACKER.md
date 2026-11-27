# Universe graphics tracker (outside Servo)

Started 26 Nov 2026 from the owner's "Universe Graphics Upgrade" brief. **Graphics only.** Servo (internal id `earth`, planet id `servo`: NeoChinatown, The Darknet District, the Corporate District, Zen Zephyr Temple and everything on it) is **off limits**: other agents work there. Servo Orbital Exchange (`servo-orbital`) belongs to Servo and is also left alone.

Status values: Pending / In Progress / Testing / Live / Complete. Honest stages used in the notes: identified, modelled, integrated, verified, live.

## 1. Audit: what exists and how far it is from Servo

The game has **no spatial coordinates**. A location has only a `bearing` (universe.js) and a route type: every place in the same system is a **local** jump (14 s, `progression.tuning.jump.local`); every other system is **interstellar** (28 s). So the "distance from Servo" within Tessaly is the same 14 s for every destination, and all three other systems are the same 28 s. The order below therefore follows the brief's phases (it says to keep them unless the data differs, and it does not). Bearing from Servo (-64 deg) is given for information.

| System | Location (id) | Type | Hop from Servo | Bearing | Walkable environment today |
|---|---|---|---|---|---|
| Tessaly | Tessaly Belt Anchorage (`sol-belt`) | station | local 14 s | -20 | Meridian-class station: shared hull and interior built from the station kit (`station-kit.js`, `station-kit.glb`) with a teal tint. Exterior in space = Meridian hull, label ANCHORAGE, generic rocks. No belt-specific structures. |
| Tessaly | Vantor / Underground City (`mars`, walk id `mars-terminal`) | landing pad + underground | local 14 s | 35 | **Generic prototype room** from `babylon-renderer.js prepareRoom` (flat boxes, ribs, strips; data in `exploration-data.js`). Weakest environment outside Servo. |
| Tessaly | Vantor Relay (`vantor-relay`) | placeholder station | local | 70 | Placeholder hangar of boxes (`station-layouts.js`). Flagged "Functional placeholder". |
| Tessaly | Servo Orbital Exchange (`servo-orbital`) | placeholder station | n/a | 6 | Belongs to Servo: **not touched**. |
| Erebus | Meridian Station (`meridian`) | station | interstellar 28 s | -64 | Station kit (done by the earlier station overhaul). |
| Erebus | Vesper surface workshop (`vesper`) | planet surface | 28 s | -105 | `opening-scene.js` + `vesper-visuals.js` (authored scene). |
| Erebus | Kepler Exchange, Rusthaven Port, The Foundry (`kepler`, `rusthaven`, `foundry`) | stations | 28 s | 35, -20, 70 | Station kit with a tint each. |
| Erebus | Vesper Relay (`vesper-relay`), Survey Landing (`cinder-landing`) | placeholders | 28 s | 6, 100 | Placeholder boxes. |
| Cantor | The Vigil (`vigil`) | station | 28 s | -64 | Station kit, pale/cyan identity; extra `factionDressing`. |
| Cantor | The Nexus (`nexus`) | planet landing | 28 s | 35 | `planets.js` code-built landing area (bounds 38 x 40). |
| Garrow | Holdfast (`holdfast`) | station | 28 s | -64 | Station kit, steel/amber identity. |
| Garrow | Natural Order homeworld "Eden Prime" (`order-homeworld`) | planet landing | 28 s | 35 | `planets.js` code-built landing area. |

Already done by others, preserved: the station kit overhaul (docs/development/STATION_GRAPHICS.md) gives every Meridian-class station real modelled walls, ceilings, props and a modelled hull. What it does **not** give is a distinct silhouette or surroundings per location; that is the gap this work targets (the brief's section 4 identities).

## 2. Per-location tracker

| Star system | Location | Assets inspected | Assets upgraded | Remaining improvements | Performance | Commit / deployment | Before / after screenshots | Status |
|---|---|---|---|---|---|---|---|---|
| Tessaly | Tessaly Belt Anchorage | station exterior and interior code, kit identity | exterior: hollowed asteroid with cargo deck, 3 gantry cranes, 3 ore hoppers, container yard, floodlight masts, 4 mooring tethers, service gantry, 26 drifting belt rocks (one GLB, 25k faces, parented to the station so it follows docking) | interior hangar dressing for the Anchorage, hull identity, tugs and traffic, asteroid detail/LOD, 9 MB file | software renderer: about +25k triangles in space views | batch 2 | `docs/development/universe-graphics/anchorage-*.jpg` | Testing |
| Tessaly | Vantor / Underground City | prototype room code, `exploration-data.js`, landing sequence | arrival cavern, pressure bulkhead and gate, two pads, floodlight towers, gantries, buildings cut into the rock, concourse shops/industry blocks and a lit city wall (one GLB, 31k faces, baked vertex light, fog) | commercial/residential detail, terminal model, wall animation (fans, steam, drips, dust), planet surface, landing view, split into visibility-zone files and compress the 10 MB file | software renderer only: about 105-200k triangles in view, 100-165 draw calls, frame time roughly +1 ms over the old boxes (relative figure, not the ROG Ally) | batch 1 live, BUILD `2026-11-26-universe-1` (towers upgraded in batch 2) | `docs/development/universe-graphics/vantor-before.jpg`, `vantor-after-1.jpg` | Live (cavern and concourse; rest pending) |
| Tessaly | Vantor Relay | placeholder code | none | station hull identity, hangar dressing (placeholder, no gameplay) | | | | Pending |
| Tessaly | Landing pads / Vantor descent view | `planet-landing.js` (descent sequence) | none | Vantor planet look from orbit | | | | Pending |
| Erebus | Meridian, Kepler, Rusthaven, Foundry, Vesper, Vesper Relay, Survey Landing | station kit docs | none yet | per-location exterior identity; relays and Survey Landing are placeholders | | | | Pending |
| Cantor | The Vigil, The Nexus | `station-layouts.js`, `planets.js` | none yet | Nexus landing area is code boxes; Vigil exterior | | | | Pending |
| Garrow | Holdfast, Natural Order homeworld | same | none yet | homeworld landscape (vegetation, fields), Holdfast exterior | | | | Pending |

Not implemented as destinations (recorded, not invented): Cantor "Communion Recovery Plaza", any named "agricultural settlement" beyond the `order-homeworld` landing area (settlement id `order-homeworld-settlement`, provisional name Haven's Reach), and The Nexus city. No ids exist for them in `universe.js`.

## 3. Rules followed in every batch

Visual only: colliders, interaction ids, doors, spawns, landing coordinates and waypoints unchanged; invisible proxies where a visible primitive is replaced; Low quality keeps the original visuals; GLBs load through the existing paths (`VoidAssets` model registry, `VoidStationKit`); `void-runner-sw.js` line 4 `BUILD` bumped to `2026-11-26-universe-N`; `static/void-runner.html` byte-identical; new assets recorded in `docs/VOID_RUNNER_ASSET_LICENSES.md` ("modelled in Blender by Claude for this project; no third-party assets"). Builds are scripted in `tools/assets/universe/` (headless Blender 5.3 `bpy`).

## 4. Open questions sent to the owner

Vantor mood/scale and Anchorage shape/feel (sent 27 Nov 2026). Defaults if unanswered: Vantor dark excavated rock with steel ribs and orange work lamps in a vaulted cavern; Anchorage keeps its hull and gains a hollowed asteroid with mooring gantries and ore rigs, busy and worn.

## 5. Batch log

| Batch | Contents | PR / BUILD | Live |
|---|---|---|---|
| 0 | This tracker | docs only, no BUILD bump | yes |
| 1 | Vantor arrival cavern and concourse (Medium and above; Low keeps the prototype room) | `2026-11-26-universe-1` | yes (live BUILD `2026-11-26-universe-1+8eacbcb6e1`, GLB 200 on the live site) |
| 2 | Tessaly Belt Anchorage: hollowed asteroid, cargo deck, cranes, hoppers, mooring cables, belt rock (Medium and above); lattice floodlight towers at Vantor | `2026-11-26-universe-2` | pending |

## 6. Blender vs Meshy (27 Nov 2026, real test on a real prop)

The prop: the industrial **floodlight tower** used around the Vantor landing pads and the Anchorage cargo deck (previously plain boxes). Built two ways, judged under the same lights.

| | Blender (code, `tools/assets/universe/build_floodlight.py`) | Meshy text-to-3D, preview stage |
|---|---|---|
| Source | Made by Claude for this project; no third-party assets | The owner's Meshy generation on his paid account, task `01a21a85-a8fa-7253-aa0c-c6a0d63d0848`, prompt: "industrial floodlight tower for a mining colony landing pad ... eight round floodlights ..." |
| Time | about 10 minutes to write, 1 s to build | 26 s to generate |
| Credits | 0 | 20 (balance 4,323 before, 4,303 after; no refine/texture/remesh bought) |
| Triangles | 3.4k (1,714 quads) | 2,098,150, 50 MB GLB; a 20k decimation held the shape (345 KB) |
| Design fidelity | exactly what was asked: lamp bank at the top, ladder, three railed platforms, cabinet with hazard band, red aviation lamp | read as an oil derrick: the eight lamps ended up in a ring at mid-height, not a bank at the top; cabinet and ladder good |
| Surface / UV / textures | PBR from the shared Vantor steel, floor and hazard sets, box-mapped, ready | none at preview stage (white); texturing is another 10+ credits, and a lattice unwraps poorly |
| Scale | exact metres | arbitrary (1.9 units tall), needs scaling |
| Fits location identity | yes, uses the location's own materials | would need retexturing to match |

Result: **Blender won for this asset**, and the Blender tower is what shipped (four around the Vantor pads, four masts at the Anchorage bay). Meshy's geometry is detailed and fast, but it ignored placement instructions, is two orders of magnitude over a game budget before decimation, and arrives untextured.
Recommendation by asset type (a judgement from this one test, not a general law): **architecture and shells** Blender (exact dimensions, modular, shared materials); **machinery with a specific layout** (lattices, gantries, cranes) Blender; **hero organic or irregular props** (rocks, wrecks, strange alien tech) Meshy is worth trying with the 10 credit refine and a decimate-and-bake step in Blender; **repeated props** (containers, crates) Blender, so they instance and share textures; **rocks and terrain** Blender (noise-displaced meshes with the rock texture sets) because they need tiling materials and many variants.
