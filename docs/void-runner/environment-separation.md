# Separating The Darknet District interior from NeoChinatown

Status: PLAN ONLY. No behaviour changes. The interior layout is unchanged until David supplies the revised map.
Internal ids (`earth`, `sol`, `neochinatown`) are kept for save compatibility; players only ever see NeoChinatown and the Tessaly System.

## Where things are today
- One location, one build. `VoidNeoChinatown.build()` (`void-runner/neochinatown.js`) makes the streets, landing pad, nightclub **and** the District interior in one scene. The interior hangs off a `district-root` node placed at the security door and turned 180 degrees (`toWorld(x,z) = [DOOR.x-x, DOOR.z+20-z]`).
- One loader. `enterWalking('sacramento')` (the exploration id for NeoChinatown) calls `VoidBabylon.prepareRoom(def)`, which calls `release()` first. Every other room (Vesper, homeworlds, VR, derelict) already loads that way, one at a time. NeoChinatown is the only room that holds two environments.
- One collision list and one interaction list (`layout()`): 73 solids and 14 interactions. `zone({x,z})` already classifies any point as `street`, `district` or `terrace`:
  - district: 41 solids, 10 interactions (`district-scan`, `admin`, `district-iris`, `district-shop`, `district-bar`, `district-vr`, `district-vending`, `district-pod`, `district-meeting`, `district-stairs`)
  - terrace (the smoking area, reached by the stairs): 3 solids, 1 interaction (`district-stairs-down`)
  - street: 29 solids, 3 interactions (`board`, `terminal`, `tdd`)
- The boundary already exists physically: the outer door `district-door` (local z 20), a vestibule, then `district-inner-door` (z 26), opened by the `district-scan` interaction (flags `districtDoor`, `districtBadge`).
- `tests/environment-seam.test.cjs` pins these numbers, so the plan below can be checked against the real layout.

## Who depends on the combined space
`babylon-renderer.js` (builds it), `world-integration.js` and `prologue-integration.js` (start position, door scan), `city-taxi.js` and `taxi-rules.js` (street zones), `crowd.js` (street cast vs District cast), `music-director.js` and `music-integration.js` (zones, bar speaker, nightclub), `vr-core.js` (VR arcade is inside the District and requires `walkingLocation.id==='neochinatown'`), `guest-mode.js`, `share-registry.js` and `share-panel.js` (share links such as `?visit=darknet-district` use District-plan coordinates).

## Recommended approach
Add a second location to the existing loader. Do not build a second engine, a second page, or anything that keeps both environments alive.

1. **Pure refactor (no visible change).** Split `build()` into `buildStreet()` and `buildInterior()` inside `neochinatown.js` along the `district-root` seam, still called together. Split `layout()` into `streetLayout()` and `interiorLayout()` and keep `layout()` returning the union. The seam test must still pass unchanged.
2. **Second location.** Register `darknet-district` as its own exploration location (`kind:'city'`, `district:true`), with its own bounds, spawn, music and crowd cast. `prepareRoom` builds `buildInterior()` for it and `buildStreet()` for NeoChinatown. Nothing else is loaded.
3. **The vestibule is the loading boundary.** Entering the outer door while the street is loaded plays a short scan animation, calls `release()`, and prepares the interior. Leaving reverses it. Preloading the other side's textures and models while the player stands in the vestibule is allowed; building its scene is not.
4. **Saves.** Keep `location: 'earth'`. Add the sub-area as a tolerant story flag (for example `area: 'street' | 'district'`), never a new location id, so the cloud validator and old saves keep working. A save with no flag resumes on the street, as today.
5. **Fix dependents one at a time**, each with its own test: taxi (street only), crowd casts, music zones, VR arcade (interior only, drop the `neochinatown` id check in favour of an area check), share links (`darknet-district` opens the interior directly), guest mode.
6. **Only then** replace the interior with David's revised map. Interior, store, sleeping pods, meeting area and the VR play area live in the interior build, which can now be changed without touching the street.

## Why this is the safest option
- Reuses the loader that already isolates every other room, so memory is released between environments.
- Step 1 is verifiable by the existing tests plus the seam test, with no player-visible change.
- Old saves and the cloud validator are untouched (internal ids unchanged).
- It leaves a clean place to host a shared multiplayer interior later, since the interior is its own room with its own spawn.

## Risks and open points
- The terrace and its stairs belong to the interior, even though the terrace sits at a different world position. The interior build must own it.
- The street shows the District only as a door and facade. If the revised map wants windows onto the street, they should be baked textures, not live geometry.
- First-load time for the interior is unmeasured. Measure it before and after step 2 on the target handheld.
- The scan animation wording and visuals are for David to approve.
