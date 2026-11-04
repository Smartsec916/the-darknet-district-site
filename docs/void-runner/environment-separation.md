# Separating The Darknet District interior from NeoChinatown

Status: steps 1, 2a and 2b are implemented. The game now loads the street and the District interior as separate environments and switches between them at the security vestibule (step 2b). The combined 'all' environment remains for tests and tools. The interior layout is unchanged until David supplies the revised map.
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
4. **Saves.** Keep `location: 'earth'`. Add the sub-area as a tolerant story flag (for example `area: 'street' | 'district'`), never a new location id, so the cloud validator keeps working. A save with no flag resumes on the street.
5. **Fix dependents one at a time**, each with its own test: taxi (street only), crowd casts, music zones, VR arcade (interior only, drop the `neochinatown` id check in favour of an area check), share links (`darknet-district` opens the interior directly), guest mode.
6. **Only then** replace the interior with David's revised map. Interior, store, sleeping pods, meeting area and the VR play area live in the interior build, which can now be changed without touching the street.

## Why this is the safest option
- Reuses the loader that already isolates every other room, so memory is released between environments.
- Step 1 is verifiable by the existing tests plus the seam test, with no player-visible change.
- The cloud validator is untouched (internal ids unchanged).
- It leaves a clean place to host a shared multiplayer interior later, since the interior is its own room with its own spawn.

## Risks and open points
- The terrace and its stairs belong to the interior, even though the terrace sits at a different world position. The interior build must own it.
- The street shows the District only as a door and facade. If the revised map wants windows onto the street, they should be baked textures, not live geometry.
- First-load time for the interior is unmeasured. Measure it before and after step 2 on the target handheld.
- The scan animation wording and visuals are for David to approve.

## Step 2a: how the area builds work (implemented)
- `VoidNeoChinatown.layout(area)` and `build({area})` take `'all'` (default, the original combined environment), `'street'` or `'interior'`. A location definition carries `area`, and `prepareRoom` passes it to the build and to the asset lists (`modelsFor(area)`, `VoidCrowd.models(location, quality, area)`).
- **Street:** the city, landing pad, club, taxi zones, streaming districts and weather, plus the entrance and vestibule. 35 solids, 4 interactions. The inner door never opens here.
- **Interior:** the vestibule, hallway, rooms and terrace. 44 solids and 11 interactions, exactly the District part of the original layout. The spawn is inside the vestibule facing the inner door.
- **The entrance** (outer door, front wall, vestibule, inner door, scanner) is built in both, so the player sees no change when one environment replaces the other.
- **Same random sequence.** The street and the interior used one shared random stream. Each separate build resumes it at the right point (`SEAMS`, one pair per quality tier), so every texture and placement matches the combined build. In the combined build a console warning appears if the street ever changes how many random numbers it uses; update `SEAMS` if so.
- **Measured** (software-rendered Chromium): high tier combined 693 meshes / 14 lights / 277 materials; street 523 / 4 / 224; interior 240 / 12 / 107. Low tier: combined about 757 meshes, street 451, interior 216.

## Step 2b: the transition (implemented)
- **Two locations, one loader.** `VoidExplorationData.locations.sacramento` is the street and `.['darknet-district']` the interior (both `id:'neochinatown'`, with `area:'street'|'interior'`, so every consumer keyed on that id keeps working). `enterWalking(key, {silent, spawn, yaw})` loads one; `prepareRoom` releases the previous environment first, so only one is ever loaded.
- **Rules in `district-area.js`** (pure, tested in Node): which environment a save is in (`areaOf`, `keyFor`), where a player appears (`resume`, `exitSpawn`), and the vestibule trigger zones (`enterTrigger`, `exitTrigger`).
- **Orchestration in `district-transition.js`**: the checkpoint (in) and airlock (out) sequence. It freezes input, shows the overlay, loads the other environment silently at the player's own position, sets the flags, saves, opens the inner door, and on failure puts the player back and says so. Walking into the vestibule with a badge, or using the scanner, goes in; walking out through the open outer door goes out.
- **Saves.** `location` stays `earth`. `story.flags.area='district'` marks a player inside, and counts only with `districtBadge` (so a save without one resumes outside). Campaigns from before the 2026-11-04 reset are retired (`docs/void-runner/SAVE-RESET.md`), so there is no old-save path to support. Resuming inside puts the player just past the inner door. New campaigns still start outside the doors.
- **Guest links.** Entries that name a spot inside the District, and the VR arcade experiences, open the interior directly (`VoidDistrictArea.guestArea`); the rest open outside.
- **Left alone:** the District layout, NPC placement, interactions, VR experiences, taxi and music (all keyed on world coordinates, which are unchanged).
- **Multiplayer later.** The interior is now its own location with its own spawn, solids, interactions and build, so a shared room can host other players and NPC interactions without touching the street. Nothing multiplayer is implemented.

## Platform targets (David, 2026-11-04)
The 3D game is for desktop and capable devices such as the ROG Ally; high and low graphics settings both matter. Phones keep using the regular website. Do not redirect phones into the game, and do not spend time optimising 3D gameplay on phones. Basic mobile checks cover the regular site only: homepage, navigation, login and the link to the game.
