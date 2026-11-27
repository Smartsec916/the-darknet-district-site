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
| Tessaly | Tessaly Belt Anchorage | station exterior and interior code, kit identity | exterior: hollowed asteroid with cargo deck, 3 gantry cranes, 3 ore hoppers, container yard, floodlight masts, 4 mooring tethers, service gantry, 26 drifting belt rocks (one GLB, 25k faces, parented to the station so it follows docking) | interior hangar dressing for the Anchorage, hull identity, tugs and traffic, asteroid detail/LOD, 9 MB file | software renderer: about +25k triangles in space views | batch 2 live, BUILD `2026-11-26-universe-2` | `docs/development/universe-graphics/anchorage-before.jpg`, `anchorage-after.jpg` | Live (exterior only; interior hangar still the shared kit) |
| Tessaly | Vantor / Underground City (batch 4 added animation and shop/residential detail: GLB now 40k faces, 12 MB) | prototype room code, `exploration-data.js`, landing sequence | arrival cavern, pressure bulkhead and gate, two pads, floodlight towers, gantries, buildings cut into the rock, concourse shops/industry blocks and a lit city wall (one GLB, 31k faces, baked vertex light, fog) | commercial/residential detail, terminal model, wall animation (fans, steam, drips, dust), planet surface, landing view, split into visibility-zone files and compress the 10 MB file | software renderer only: about 105-200k triangles in view, 100-165 draw calls, frame time roughly +1 ms over the old boxes (relative figure, not the ROG Ally) | batch 1 live, BUILD `2026-11-26-universe-1` (lattice towers added in batch 2) | `docs/development/universe-graphics/vantor-before.jpg`, `vantor-after-1.jpg` | Live (cavern and concourse; rest pending) |
| Tessaly | Vantor Relay | placeholder hangar of boxes | rock-cut hangar shell (vantor-relay.glb, 3.8k faces): steel ribs, ducts, pendant lamps, pad ring, front and rear walls with a sealed rear door, lockers, crates and drums along the walls; the plain boxes are hidden, layout and collision untouched | exterior (still the placeholder hull), interactions are unchanged | not measured | batch 4 | `docs/development/universe-graphics/relay-*.jpg` | Testing |
| Tessaly | Landing pads / Vantor descent view | `planet-landing.js` (descent sequence) | none | Vantor planet look from orbit | | | | Pending |
| Erebus | Meridian Station | station kit docs, hull design | exterior scenery set (meridian-surroundings.glb, 3.2k faces): partial orbital ring with lit window bands and spokes to the hull, two docking spars with berths, ten traffic beacon pylons | interior is the existing kit; hull detail; more traffic | not measured | batch 5 | `docs/development/universe-graphics/erebus-*.jpg` | Testing |
| Erebus | Rusthaven Port | same | exterior salvage yard (rusthaven-surroundings.glb, 5k faces): 34 torn hull sections and scrap slabs, three scrap crane gantries with magnet plates, cable webs | interior wear; yard detail | not measured | batch 5 | same | Testing |
| Erebus | The Foundry | same | exterior heavy industry (foundry-surroundings.glb, 2.3k faces): twin smelter stacks with glowing mouths, reactor sphere, radiator bank, conveyor trusses | interior; glow animation | not measured | batch 5 | same | Testing |
| Erebus | Kepler Exchange, Vesper surface, Vesper Relay, Survey Landing | not yet inspected in detail | none | Kepler: ask for canon first; Vesper has its own authored scene; relays and Survey Landing are placeholders | | | | Pending |
| Cantor | The Vigil | `station-layouts.js`, kit identity | exterior (vigil-surroundings.glb, 1.1k faces): slim lit halo ring on edge with spokes, cyan-banded spire, nine floating monolith slabs on tethers | interior identity; The Nexus landing area (code boxes) | not measured | batch 6 | `docs/development/universe-graphics/cantor-garrow-stations.jpg` | Testing |
| Cantor | The Nexus | `planets.js` | none yet | landing area is code-built boxes; needs owner direction on look | | | | Pending |
| Garrow | Holdfast | station-layouts, kit identity | exterior (holdfast-surroundings.glb, 2.2k faces): layered timber-and-plate shield wall behind the hull with buttresses, four green greenhouse domes on arms, scaffolds with lamp posts | interior identity | not measured | batch 6 | same | Testing |
| Garrow | Natural Order homeworld | `planets.js` | none yet | vegetation, fields, terrain (largest remaining job) | | | | Pending |

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
| 2 | Tessaly Belt Anchorage: hollowed asteroid, cargo deck, cranes, hoppers, mooring cables, belt rock (Medium and above); lattice floodlight towers at Vantor | `2026-11-26-universe-2` | yes (live BUILD `2026-11-26-universe-2+6f85061f77`, anchorage-belt.glb 200 on the live site) |

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

## 7. Not yet verified / known gaps (27 Nov 2026)

- All frame-time figures are software-renderer numbers from a cloud container: relative only, not the ROG Ally. Real-hardware performance is **unverified**.
- Vantor GLB 10.8 MB and Anchorage GLB 9.6 MB (embedded 1K JPEG sets): first-visit download is heavy; splitting into visibility-zone files and KTX2/meshopt compression are still to do.
- Vantor: only the arrival cavern, bulkhead and concourse shell are done. Commercial/residential facades, the terminal model, the surface and landing view, animation (fans, steam, drips, dust) and a final lighting audit are open (owner's development order steps 3 to 8).
- Not started: Vantor Relay, Phase 2 (Erebus), Phase 3 (Cantor), Phase 4 (Garrow).
- Seen only by screenshot at Medium; High and Ultra were not separately captured, and the Anchorage was not seen during a live docking approach (the model is parented to the station so it follows it; checked as a static view only).

### Batch log addendum

| 6 | Cantor and Garrow station exteriors: The Vigil (halo ring, spire, monoliths), Holdfast (shield wall, greenhouse domes) | `2026-11-26-universe-6` | pending |
| 4 | Vantor Relay hangar shell plus Vantor animation and commercial/residential detail: rotating fans, steam, drips, dust motes, two lifts, a gantry hoist, flickering lamps; blade signs, noodle bar, air units and laundry on the stacked housing, elevator shafts, transit board gantry | `2026-11-26-universe-4` | pending |

## Low Quay, Stale System (new location, 27 Nov 2026)

| Star system | Location | Assets inspected | Assets built | Remaining improvements | Performance | Commit / deployment | Screenshots | Status |
|---|---|---|---|---|---|---|---|---|
| Stale (`stale`) | Low Quay (`low-quay`, walk id `planet-low-quay`) | the owner's concept image `universe-graphics/lowquay-reference.png`; `planets.js` landing-area wiring (as The Nexus) | code-built and instanced: raised pad on piers over water, six berths, berth terminal (Blender GLB `assets/models/low-quay/quay-terminal.glb`), station, viaduct and rail, two trains and the rail ride, vestibule, tunnel, subway hall, stairs, pedestrian quay city with canal; night sky, skyline, water | city facades and clutter (still box buildings with window textures), ambience and sound, NPCs, train doors/animation, sea-wall texture, a zone switch-off of the pad when under the quay | software renderer, Medium: about 100 to 600 draw calls depending on view (the busiest views look back over the whole line); real GPU unverified | batch 1, `2026-11-27-lowquay-1` | `universe-graphics/lowquay-*.jpg` | Batch 1 |
