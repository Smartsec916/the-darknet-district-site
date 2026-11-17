# Corporate District and the reusable sky-cab transition

> **Update, build `2026-11-16-quarters-1`:** the sky cab is gone. The Corporate District is reached by ROAD taxi through the Function Gate at the west end of the Avenue (60 CR, ride back included), or on foot through the same gate. Only the arrival stop changed here: the landing ring is removed, the parked cab is a road cab, the sign and prompts read TAXI, and a second prompt walks back through the gate. Nothing else in the district was touched. See [`NEOCHINATOWN_QUARTERS.md`](NEOCHINATOWN_QUARTERS.md). Text below about the sky-cab ride is older.

A separate area about **1.8 km** from central NeoChinatown, reached only by **sky cab for 60 CR** (the existing maximum fare, flat). Built from Babylon.js geometry; no proprietary assets. Status: **built, provisional** (names, signage and the guard's one line are placeholders; no corporation, brand or story has been decided).

Part 2 of the three-location expansion ([`THREE_LOCATION_EXPANSION.md`](THREE_LOCATION_EXPANSION.md)). Screenshots: `docs/development/corporate/`.

## Files

| File | What it is |
|---|---|
| `void-runner/sky-cab.js` | **Reusable transition.** (1) `create(deps)` the orchestration, pure and unit-tested; (2) `build()` the 3D cab interior; (3) the game wiring. The Zen Zephyr Temple reuses it: add a row to `DESTINATIONS`. |
| `void-runner/area-map.js` | **Reusable map spaces and exploration fog** for separate areas. Fog is packed to base64 text in `story.flags` (about 105 characters for Corporate). |
| `void-runner/corporate.js` | Pure data: blocks, collision, cover, lighting zones, doors, guards, cameras, drones, entrances, map model. |
| `void-runner/corporate-security.js` | Pure rules: camera sweeps, drone patrols, line of sight, detection, stealth modifiers, passive guard challenges, hooks. |
| `void-runner/corporate-actors.js` | Reusable security robot, drone and camera built from primitives. |
| `void-runner/corporate-build.js` | The 3D scene (browser only). |
| `void-runner/corporate-integration.js` | Registers the location, door messages, the return cab, the security notices. |
| Hooks | `babylon-renderer.js` (a `zoneHandle` for separate areas), `preparation.js` (an `area` limit), `city-taxi.js` + `taxi-rules.js` (scene destination), `district-map.js` + `personal-device.js` (map spaces), `neochinatown.js` (`corporate` district marked built), `ncz-nightclub.js` (see "A bug fixed on the way"). |
| Tests | `tests/sky-cab.test.cjs`, `corporate.test.cjs`, `corporate-security.test.cjs`, `area-map.test.cjs`, `tests/corporate-browser.cjs` (real browser). |

## The trip

1. The Personal HUD taxi list shows **Corporate District · 60 CR, return included**. A player with less than 60 CR cannot call it.
2. The street sky cab comes, as for any destination. On boarding, the fare is charged once (`taxi-rules.js charge`).
3. `city-taxi.js` hands the trip to `VoidSkyCab.ride`. The street cab's own record is cleared and the cab-room record `story.flags.skyCabTrip` ("corporate:60") takes over, so a reload refunds it exactly once.
4. **The cab room** (`skycab`) replaces NeoChinatown, which the loader releases, so only one real place is loaded at a time. It is built from geometry in well under a second: rear bench, two front seats, a dashboard with teal and magenta glow strips, a fare readout and progress bar, glass with rain streaks that run down, neon bars streaking past, distant towers, a city glow far below, and a subtle sway. The player sits and can look around.
5. The ride lasts at least 4.5 s (6 s for 1.8 km; 3.5 s with reduced motion) **and** the destination must be ready; only then does Corporate replace the cab. If the loader needs longer it simply waits.
6. Arrival on the cab pad. `cabReturn` (text in the save) keeps where the player boarded.
7. **Return:** "CALL RETURN SKY CAB" at the pad, **no second fare** (the owner's brief asked for a return cab and one fare; this also means nobody is stranded without credits). It lands the player exactly where they boarded.
8. **Failure handling** (unit-tested and played in the browser test): if the cab or the destination fails to load, the fare is refunded once, the player is put back where they left, and a notice says so. If even that fails, the record stays and the next load refunds it. A failed return leaves the player safely in Corporate.

## The area

200 x 200 m inside a perimeter embankment. Main boulevard with north and south plazas, three cross streets (one with a **security checkpoint** and a gate arm), a north service road, **three narrow alleys**, and a **back alley** with loading bays and a maintenance door (the future break-in point; locked, covered by a camera, in shadow, with a lamp pool a short way off and dumpsters and crates for cover). Nine towers with podiums, belt courses, setbacks and rooftop plant; four elevated walkways; vertical neon signs and three billboards; lamp posts with light pools; wet asphalt, puddles, rain; a distant skyline ring and horizon glow; a parked cab on the pad. The towers' window textures are generated; nothing is downloaded.

Art direction: dark, layered, wet, accent neon rather than outlines (`docs/VOID_RUNNER_ART_DIRECTION.md`). **Honest status:** it is a real step from the old look, but it is still MeshBuilder geometry with generated textures, not Blender-made PBR architecture. It is a candidate for the Blender upgrade path.

When Corporate is active NeoChinatown's detailed geometry is not in the scene (tested). Game state and V1 stay available. No real lights are added (the scene keeps its two); accents are emissive and additive spill pools.

## Security (passive in this release)

- **Robots** (3 / 4 / 5 / 6 on low / medium / high / ultra): bulky humanoid, matte black segmented armour, rounded faceless helmet, red-pink eyes, small orange chest light, side hoses, back antenna, black rifle held low. They stand at the HQ door (two), the checkpoint, the service entrance, and patrol the plaza and the back alley. Near a protected entrance a guard says **"State your business."** (a line over the robot and a notice). They never attack; the rules never touch player health (tested).
- **Drones** (1 / 2 / 3 / 4): closed patrol loops at steady speeds, smooth turns, blinking navigation lights, a soft sensor pool on the ground.
- **Cameras** (4 / 6 / 8 / 8): a head that sweeps on a fixed sine (predictable timing), a red indicator, and a visible floor footprint of the detection cone. Gaps between sweeps and blind spots are real.
- **Stealth:** detection 0 to 1 rises while at least one observer sees the player and falls when none does. Seen = inside the cone and range with a clear line (buildings, dumpsters, crates and walls block it). Visibility = zone light x stance (crouch 0.55) x motion (still 0.7, walk 1, run 1.25). Crouch with **C** or **Ctrl**. Dark lanes, doorways, cover and passing **under a walkway** (cameras cannot see there) all help. States: clear, **suspicious** (yellow, at 0.35), **detected** (red, at 0.85, with hysteresis). A detected player gets a warning ("Restricted area. Return to the plaza.") and detection drops so it is not repeated every frame.
- **Hooks for later missions:** `VoidBabylon.zone.security.on('suspicious'|'detected'|'cleared'|'challenge'|'warning', fn)` and a `corporate-security` window event. Combat would attach here.

## V1 map

The Map app shows the area you are in. Corporate has its own view: streets, plazas, alleys, buildings, **guarded** (red) and **service** entrances, the sky cab stop, your position, waypoints, and **fog of war** (unexplored places and their markers are hidden; "EXPLORED n%"). Exploration is saved in `story.flags.corpFog` (a base64 string) every few seconds and when you leave, and survives a reload (tested). NeoChinatown's own map is unchanged and the old saves have no such flag (they start unexplored).

## Save compatibility

No new location id, mission id or server change. New `story.flags` (tolerant strings): `corpFog`, `skyCabTrip`, `cabReturn`. A reload while inside Corporate resumes on the NeoChinatown street (as for any scene without a resume path); the fare is not lost (it was spent on a completed trip) and the map progress is kept.

## A bug fixed on the way

The NULL nightclub made two dynamic textures that only become "ready" after a redraw that runs only near the player. If the club began building while the street was still preparing, the scene never reported ready and loading hung. This had not shown because camera positions usually avoided it; the cab's timing exposed it. Fixed in `ncz-nightclub.js` (draw them once at creation).

## Known limits and next

- Round trip tested in a software-rendered browser; the long street legs of the street cab were shortened in the test. No real-GPU, Firefox or multiplayer testing.
- Only one return point (the cab pad). Interiors are not built; every door is locked.
- Names and signage are placeholders. The break-in mission is not designed.
- Visuals are an upgrade candidate for Blender-made architecture and PBR materials.
- Next: the Zen Zephyr Temple, reusing `sky-cab.js` and `area-map.js`.
