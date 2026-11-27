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
| Tessaly | Tessaly Belt Anchorage | station exterior and interior code, kit identity | none yet | belt-industrial exterior: hollowed asteroid, mooring gantries, ore hoppers, tethers, floodlights; anchorage-specific hangar dressing | not measured | not started | pending | Pending |
| Tessaly | Vantor / Underground City | prototype room code, `exploration-data.js`, landing sequence | none yet | excavated-rock cavern shell, ribs, ducts, lamps, pressure airlock, signage; arrival view first | not measured | not started | pending | Pending |
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
| 0 | This tracker | `2026-11-26-universe-0` not bumped (docs only) | pending |
