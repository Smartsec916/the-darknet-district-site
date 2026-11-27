# Vesper road (27–28 Nov 2026)

The owner asked first for "a drivable road from there [the Vesper surface workshop] going off into the distance", then (27 Nov 2026):

> "Make the road go between two of the highpoints. Change the terrain so it looks like a natural pass. If it needs a loading screen find ways to cheat it and have the loading screen look like the drive, go many miles like this around mountains. Add a small village with small houses, a bar, store. Past that is a mine dug into the side of a mountain. Add a loading screen when you enter it. Try to do the same thing at all loading screens. Try to hide them so they aren't noticeable by the player. My plan is to make the mine go far down. Make the depth a placeholder for now. Continue making the road to farther. It will end at a tech facility made to look like a warehouse with a small shared housing unit next to it. Make a guard shack that you get to first. Big warehouse doors on one side."

This is built in phases, one PR each. This page says what exists now.

| Phase | What | Status |
|---|---|---|
| 1 | The pass: the road climbs between the first range's two high points through a carved saddle; the land is streamed chunks; walking and driving along the whole road | PR #635 (`2026-11-28-vesper-pass-1`) |
| 2 | Many miles: the road continues 8 km beyond the pass along the valleys around the mountains (9.6 km, about 6 miles, in all) | PR #636 (`2026-11-28-vesper-road-2`) |
| 3 | The village: nine small houses, an enterable bar and an enterable store, street lamps, water tower | PR #637 (`2026-11-28-vesper-village-3`) |
| 4 | The mine: portal in a cut, the adit inside the mountain, a cage down a shaft of placeholder depth to the bottom level | PR #638 (`2026-11-28-vesper-mine-4`) |
| 5 | The far end: the guard shack and barrier you reach first, the facility made to look like a warehouse (big doors on one side), the shared housing unit | `2026-11-28-vesper-facility-5` |
| 6 | Loading screens everywhere made as unnoticeable as practical | later |

## Where it is

- **`void-runner/vesper-world.js`** (`VoidVesperWorld`, pure, runs in Node): the route (`CONTROL`), the road's height (`roadY`), the carved land (`height`), the walking corridor (`walkable`), a fast `nearest()` and the named stretches' rectangles and approach points (`corridorRects`, `approach`).
- **`void-runner/vesper-terrain.js`** (`VoidVesperTerrain`, browser): draws the land as streamed chunks and scatters talus rock along the road's cuttings.
- **`void-runner/vesper.js`** (`VoidVesper.road`): the road API the vehicle and tests use, and the road surface, shoulders, posts, signs and gate.
- `vesper-visuals.js`: `baseHeight` is the old natural horizon terrain (unchanged); `terrainHeight` now returns the carved land (`VoidVesperWorld.height`). `mountainRing` is kept only as the fallback if `vesper-terrain.js` is missing.
- Frame: Vesper's walking frame in metres (x east, z north; the workshop's open front is at z = 1).

## The route and the pass

- The yard stretch is unchanged: it leaves the front apron at (14, 5), passes north of the range, through the open gate at x ~50, flat at `SURFACE_Y` (0.02) to the yard's edge at x 232 (`yardLength()` ≈ 221 m).
- It continues east across the flats on the old line to x ~560, then turns east-south-east into the first range.
- **The two high points** (`PEAKS`): the north peak at (1025, 55) and the south peak at (1165, -495) were already the two highest summits of the old terrain either side of the road's bearing (~212 m and ~217 m). Each is raised by a smooth 42 m dome so they read clearly as the peaks framing the pass (now ~248 m and ~257 m).
- **The saddle** (`PASS`, about (995, -208)): the thin ridge between them (natural crest ~85–100 m there) is lowered toward 38 m over a broad, smooth area (300 m across the ridge, 150 m along it), so the land itself forms a col rather than the road cutting a slot. The road crosses it at about 34 m.
- **Grades**: the road's height is the natural ground under it, smoothed (σ 45 m) and held to a 9 % grade both ways, then lightly smoothed (max measured 9.5 %; the test holds it to 10 %). The climb from the flats to the col is about 1.3 km at 9 %; no switchbacks were needed.
- **Banks**: under the road a flat bench (carriageway + shoulders + 1 m, 3 cm below the road surface); then a cut or fill bank that blends into the natural slope with a smooth S profile. The bank's width grows with its height (16 m + 1.25 × height), and near the pass much wider and gentler (34 m + 1.9 × height). Deepest cut on the way up: ~23 m (a foothill spur at s ≈ 800 m); at the col ~17 m.
- **Talus**: rock at the foot of the cuttings and scattered on their faces (thin instances, one host per 400 m of road; never on the carriageway or the walking margin). Cut faces are coloured as paler broken rock and scree, fill banks as loose spoil, the bench as compacted gravel.
- Beyond the pass (phase 2) the road runs about 8 km more, east then north-east along the valleys between the ranges, to about (7311, 2700): **9.6 km (≈ 6 miles) from the workshop**, about 11 minutes at the truck's cruising 54 km/h. The line was found by `tools/assets/vesper/plan_route.cjs` (A* on a 20 m grid over the natural land: steepness and height above the valley floor cost extra, so it keeps to valleys and winds around the mountains), smoothed, sampled every ~160 m, and edited by hand where the village stands so its street runs due east for ~120 m (x 1770–1880, z 664).
- Along it: the grade stays within 9.4 %; the tightest bend has a ~49 m radius; the deepest cutting is ~72 m (short) and the highest fill ~45 m; no two parts of the road come within 300 m of each other (more than the carve's reach, so the land between two legs is never pulled two ways).
- Reserved sites (later phases): the village on the flat valley floor at s ≈ 2.4–2.6 km; the mine at s ≈ 4.0 km, where a mountain face rises on the north-west side of the road; the facility at the road's end.

## The land as streamed chunks (no loading pause)

- The old single ring mesh (245–1350 m) could not carry a road through it at road detail, and stops at 1.35 km. It is replaced by a quadtree of square chunks over a 16 km square: every chunk is a 65 × 65 grid (33 × 33 on Low) with a skirt; the finest chunks are 256 m (4 m between vertices; 8 m on Low) and each level up doubles. A chunk splits while the camera is within 1.15 × its size; chunks wholly beyond 3.7 km (the camera's far plane is 3.5 km) are neither built nor drawn.
- Chunks are generated a few rows at a time inside a per-frame budget (4.5 ms Medium/High, 3 ms Low), nearest first; a parent stays on screen until all four of its children are ready, so there are never holes and the frame never waits. The set around the camera at arrival is built inside the existing workshop loading card.
- Measured (software GL in the test container, so CPU-bound and slower than a real GPU): about 120 chunks shown, 77 drawn after frustum culling in the yard, 20 at the pass; the terrain adds ~1.5 ms to `scene.render()`; the largest single generation step is ~6 ms. Unused chunks are dropped after 25 s (never the top two levels).
- The yard keeps its own sand: the old 1600 m sand plane is now a 252 m-radius disc (same 20 m texture tiling) and the chunks sink under it inside r 243 m. Without `vesper-terrain.js` the old plane and ring come back.

## Why there is no loading screen on the road

Nothing on the road is a separate scene: the whole 9.6 km is one Babylon scene, and the land streams in around the camera as chunks (above), generated a few rows per frame within a fixed time budget, so there is no load to hide. The road surface, shoulders, posts and talus for the whole length are built once with the scene (inside the existing workshop loading card); the far ones are culled by the camera. Float precision: 7.3 km from the origin a 32-bit float resolves about 0.5 mm, so the world is not re-centred. The two moons follow the camera so they stay in the sky kilometres down the road. Later sites (village, mine, facility) load their models while the player is still far away and appear before they can be seen (phases 3–5).

## The village (phase 3)

- **Where**: on the flat valley floor 2.4 km from the workshop (s ≈ 2.43–2.55 km), where the road was straightened into a due-east street (x 1765–1885, z 632–698; origin (1825, 664) on the road, street height ≈ 19.8 m). Its yard is levelled to the street (`vesper-world.js` pads, 24 m blend).
- **What**: `void-runner/assets/models/vesper/vesper-village.glb` (2.6 MB, 6 k faces), built by `tools/assets/vesper/build_vesper_village.py` (Blender, by Claude; textures from seeded noise). Nine small one-room houses of two kinds (corrugated with a gable roof and porch; rendered with a flat roof, water tank and a solar panel), varied in size, colour and yard clutter, doors shut. A **bar** (north side, 16 × 12 m: porch with awning, blank sign board, an L-shaped counter and back bar with bottles and a cooler, stools, five tables with chairs, a booth, four pendant lamps). A **store** (south side, 12 × 10 m: striped awning, blank sign board, bench; two shelving aisles of goods, a wall shelf, a fridge wall, a counter with a till, strip lamps). Five street lamps, six power poles, a water tower, a generator shed, fences, barrels, crates and a hand cart.
- **Enterable**: the bar's and the store's front doors are real openings; walls, counters, shelves, tables and the booth are collision boxes. The houses, the generator shed and the water tower are solid. The back and side doors are shut.
- **Light**: every light has a physical source (lamp heads, pendant shades, strip diffusers). Up to six real point lights (the three interior ones first) exist only while the camera is within 170 m; interior lights light only the interiors. The interiors (objects `v_int_*`) are excluded from the sun and the sky light, which have no shadows out here and would otherwise light a room through its roof.
- **No pop-in or pause**: the model starts loading while the camera is still 3 km away (at the workshop already: the village is 2.4 km out, behind the first range), is instanced hidden, its materials are compiled off-screen and only then shown; beyond 3.6 km it is released. Its collision is layout data and exists whether or not the model has loaded.
- **Data**: the builder also writes `void-runner/vesper-sites-data.js` (collision boxes, lamps, places, the walking area and the pad, in the village's own metres), so the model and its collision can never drift apart. `void-runner/vesper-sites.js` turns them into world metres, streams the model and adds the lights. The solids are appended after the yard's 16 in `opening-data.js`; they use ground-relative heights (the vehicle's low/high solid test).
- **No people, no shop, no text**: the bar has no staff and serves nothing; the store sells nothing; the sign boards are blank. These are reversible defaults, the owner's decisions.

## The mine (phase 4)

- **Where**: 4.7 km from the workshop (s ≈ 4.66 km), on a bench north of the road where the mountain rises: the portal at (3504, 704), its yard (32 × 24 m, levelled flat) between it and the road. Floor height ≈ 46.5 m.
- **Outside** (`vesper-mine.glb`, by `tools/assets/vesper/build_vesper_mine.py`): a concrete headwall with the adit's mouth and two steel portal sets, stepped wing walls and an apron in a cut in the mountainside; a lamp over the mouth; rails out onto the yard to a buffer stop, two ore carts (one loaded); a timber headframe with a sheave over a capped raise and a corrugated hoist house; two spoil heaps; a timber stack, drums, a tool shed, two lamp poles.
- **The land around the portal** (`vesper-world.js` cut, `vesper-terrain.js` hole): from the portal line into the mountain the land is held at least 9.5 m above the adit floor (rising inward, falling away beyond the portal's sides), so the adit always has rock over it (tested every metre). The one row of terrain cells in front of the headwall is left out of the mesh; the apron and wing walls fill it. The yard is a flat pad (7 m blend). The road wins where its banks meet the yard.
- **Inside, the adit level (level 0)**: modelled where it is, inside the mountain, in the same scene. The adit runs 34 m north with timber sets every 1.6 m, rails and caged lamps; a right-angle bend east (the daylight is out of sight after it) along a 22 m drift to the **collar chamber** (12 × 12 m): the shaft (3 × 3 m, fenced on three sides, open on the cage side), its headgear and sheave, the winder, a bench. Rough rock walls and roof (generated rock texture).
- **THE DEPTH IS A PLACEHOLDER**: `MINE_DEPTH_M = 120` in `void-runner/vesper-sites.js` (one constant; any multiple of 10). `LEVELS` there is data (level 0 the adit at 0 m, level 1 the bottom at -MINE_DEPTH_M). The shaft is stacked at runtime from one 10 m section, and the bottom level is placed at the depth, so deepening the mine is a one-line change, no rebuild. Not exposed in Dev Tools (not trivial: it moves floors and collision live).
- **The bottom level (level 1)** (`vesper-mine-deep.glb`): the shaft station (12 × 10 m), a 40 m drift east with timber sets and rails to the working face (a drill rig, a loaded cart), a short cross-cut north with a pump.
- **The cage: the mine's loading screen, hidden**. "RIDE THE CAGE DOWN" in the cage (the prompt is the game's ordinary interaction). The walker stands in the cage; it accelerates to 8 m/s down the shaft (the shaft's lamps stream past; a pool of four real lights follows the nearest lamps) and slows to stop at the bottom (about 20 s for 120 m). The bottom level's model is fetched as soon as the player is within 70 m of the portal (long before the cage can reach it) and compiled hidden; **if it is still not ready, the cage slows and waits 15 m above the bottom, lamps passing above, until it is, then arrives** (browser-checked by unloading it on purpose before a ride). Deep down (more than 20 m below the adit) the land above is hidden (it cannot be seen and costs frame time) and shown again on the way up before the cage reaches the adit. "RIDE THE CAGE UP" at the bottom is the way back out.
- **Levels in the rules**: floors (flat walking surfaces) and collision boxes carry their level; only the player's current level counts (`setLevel`): other levels' boxes are open, their prompts hidden. `vesper.js groundAt` returns a tunnel's floor before the land above it. Walking areas are tested per point round the walker's circle (`vesper-sites.js walkable`), so people and the truck pass from the road onto a yard and round a tunnel corner without needing one rectangle to hold them.
- **Saves**: nothing new is saved. The player's level resets to the adit on every load of Vesper (Vesper always starts at the workshop). No save-manifest or server change.

## The far end (phase 5)

- **Where**: the road now runs on past the old end, down into a flat basin under a cliff, and ends **9.76 km from the workshop** inside the facility's gateway (origin (7470, 2700); road and yard level at ≈ 22 m). The last 60 m of road run level (`END_FLAT`), so the guard shack and the barrier stand on the level; the descent before it keeps the 9 % limit. The compound is a flat pad (14 m blend).
- **What** (`vesper-facility.glb`, 2.6 MB, 8 k faces, by `tools/assets/vesper/build_vesper_facility.py`):
  - **The guard shack you reach first** (north of the road, 60 m before the end, outside the gateway): 4.2 × 3.6 m, door on its west side, windows to the road and the gate, a desk with two dark monitors and a keyboard, a chair, a cabinet, a ceiling lamp, a camera on a bracket watching the gate, a new air conditioner on the old roof. **Enterable** (nobody on duty). **The barrier**: a pivot post on the road's north edge and the boom **raised** (open; no gate logic), a rest post on the south edge, a red lamp.
  - **The compound**: a chain-link fence with barbed outriggers (see-through panels: the fence material is made translucent at load), open across the road at the gateway.
  - **The warehouse** (28 × 48 m, eaves 10 m): weathered corrugated cladding on a steel frame and a low gable roof, **three big roller doors on its west side** facing the yard (shut, in steel frames with hoods, bollards and a lamp over each), a personnel door with a canopy and a blank keypad box with a green LED. **The tells** (clean new fittings on old cladding): a 13 m lattice antenna mast with panel antennas, a whip and a red beacon; a dish; four rooftop chillers with fans; sensor domes and cameras on brackets at the four corners; louvred vents high on the walls; a cable tray down the south wall to a fenced transformer.
  - **The shared housing unit** (north of the warehouse): two storeys of three modular units each, an outside stair and an upper walkway with a railing, doors (shut), windows, new air conditioners, a water tank and a small dish.
  - **The yard**: two 12 m light masts, two shipping containers, a parked flatbed trailer, drums.
- **Shut by default (owner decisions)**: the warehouse's doors (the inside was not asked for; nothing is invented), the housing unit's doors. Collision: the warehouse, the housing unit, the fences, the shack's walls and furniture, the barrier posts, the masts, the containers and the trailer.
- **Loading**: like the village (streams in 3 km out, compiled hidden). 9.8 km from the workshop it is far beyond the load distance at the start, so it loads during the drive, behind the last ridges.

## Walking and driving

- **Walking**: `opening-data.js` keeps the yard's rectangle (`bounds: [232, 80]`, unchanged) and adds `walkable`, the road corridor (`vesper-world.js`): carriageway + shoulders + 4 m each side, from 30 m inside the yard's edge to the end of the road. `exploration-controller.js` `blocked()` and `depth()` accept an optional `location.walkable(x, z, r)`: a point outside the rectangle is allowed when it is inside that area. Every location without `walkable` behaves exactly as before; the yard behaves exactly as before (tested point by point).
- The walker's eye follows the ground (`vesper.js` wraps `VoidExplorer.step` for the walker in Vesper only, like the tunnels' floor in `ncz-underground-integration.js`).
- **Driving**: `VoidVehicle.configure('vesper', {groundHeight, inBounds})`: the truck's wheels follow `road.groundAt`; it may drive the yard's rectangle (as before) or the corridor (its three body circles must fit inside). Unit test: the truck, at full throttle with a simple steering controller, drives from s = 60 m over the pass to the end of the road without ever being blocked, at full speed, wheels on the ground. Browser check: see the PR.

## API (`VoidVesper.road`, also `require('./void-runner/vesper.js').road`)

| Member | What it gives |
|---|---|
| `WIDTH`, `SURFACE_Y` (0.02), `SHOULDER`, `X_LIMIT` (232) | constants |
| `CONTROL` | the control points `[x, z]` (Catmull-Rom) |
| `centreline()` | dense centre line, about every 1.5 m: `{x, z, s, tx, tz}` |
| `total()`, `usableLength()`, `yardLength()` | full length (the whole road is walkable and drivable), and the flat stretch inside the yard |
| `nearest(x, z)` | nearest centre-line point: `{s, x, z, tx, tz, offset, distance}` |
| `onRoad(x, z)`, `onParking(x, z)`, `walkable(x, z, r)` | on the carriageway / parking apron / inside the walking corridor |
| `halfWidthAt(s)`, `roadY(s)` | half width (narrows over the last 60 m) and surface height |
| `groundAt(x, z)` | the height a wheel or foot stands on: `SURFACE_Y` on the yard road and parking, 0 on the yard's sand, the road surface or carved land beyond |

## Places (places.js, PROPOSED names)

Erebus System › Vesper › Ward Repair yard (Ward Repair workshop, The yard) and › The Vesper road (The road across the flats, The pass, Beyond the pass, The long valley, The far road). Each road stretch has a target (an approach point on the road at ground + 1.7 m); draft play enters Vesper at the workshop. Names marked PROPOSED are working names for the owner to change; ids stay.

## Places added by the village

The village (`vesper-village`, under The long valley), the bar (`vesper-bar`) and the store (`vesper-store`), all PROPOSED names. Approach points: the village on the street at its middle; the bar and the store outside their doors (ground + 1.7 m). Browser-checked: standing there is free, at the right height, and walking forward from the bar's and the store's approach points goes in through the door.

## Places added by the mine

The mine (`vesper-mine`: the yard and portal, under The long valley), the adit (`vesper-mine-adit`, level 0, with a height range so it is not confused with the bottom level), the bottom level (`vesper-mine-bottom`, at the placeholder depth). PROPOSED names. Approach points: the yard 24 m in front of the portal; inside the adit 3 m past the mouth; the bottom station beside the cage.

## Places added by the far end

The facility (`vesper-facility`, under The far road): the guard shack (`vesper-guard-shack`), the warehouse (`vesper-warehouse`, in front of its doors), the housing unit (`vesper-housing`). PROPOSED names. Approach points on the ground: the road 28 m before the gateway; outside the shack's door; on the apron in front of the middle door; in front of the housing unit.

## Restrictions (owner's standing rule: each with its source)

| Restriction | Added / widened / removed | Source | What it blocks | Test |
|---|---|---|---|---|
| Walking beyond the yard rectangle is limited to the road corridor (carriageway + shoulders + 4 m) | widened (was: the yard rectangle only) | technical: the mountains off the road have no collision of their own and are not built to be walked (steep slopes, no props); the corridor keeps people on ground made for them | walking off into the open mountains | `tests/vesper-road.test.cjs` "walking: ..." (the corridor is open all the way; off-corridor is blocked; the yard is unchanged point by point) |
| The truck may drive the yard rectangle or the road corridor | widened (was: the yard rectangle) | same technical reason | driving into the mountains | "the utility vehicle ... drives from the yard over the pass to the end" |
| Max road grade 9 % | new design default | the owner's brief for this work ("max grade ~10–12 % for the truck"); a reversible default in `vesper-world.js` `MAX_GRADE` | nothing (shapes the road) | "ground height ... grade <= 10 %" |

| Walking and driving off the corridor is allowed inside a site's walking area (the village: x 1765–1885, z 632–698) | **widened** (phase 3) | the owner's request (a village to walk around); its buildings' walls and furniture are collision boxes | nothing new (it opens an area) | `tests/vesper-sites.test.cjs` |
| The houses, the generator shed and the bar's back door / the store's side door are shut (solid) | new reversible default | the brief: "houses" with no interiors asked for; only the bar and store were made enterable | entering them | `vesper-sites.test.cjs` "walls and houses block" |
| In the mine only the tunnels and chambers of the player's current level are walkable; other levels' collision and prompts are off | new | technical: the tunnels are inside rock (no collision of their own); levels share x and z | walking into rock; walking on a level you are not on | `tests/vesper-mine.test.cjs` |
| The truck may drive onto the mine yard and into the adit (it fits); not onto the cage | widened | the corridor rule extended to sites | nothing new | `vesper-mine.test.cjs` "the truck can drive onto the yard" |
| Mine depth 120 m | new placeholder | the owner: "Make the depth a placeholder for now" | nothing | `vesper-mine.test.cjs` "the depth is one placeholder constant" |
| The warehouse's big doors and personnel door, and the housing unit's doors, are shut (solid) | new reversible default | the brief: "the warehouse interior wasn't requested: leave the doors closed" (coordinator's brief for this phase) | entering them | `tests/vesper-facility.test.cjs` |
| The compound fence is solid except the gateway | new | a fence; the gateway (the road) is open | walking through the fence | `vesper-facility.test.cjs` |
| The barrier is open (boom raised) | none (open default) | no gate logic asked for | nothing | `vesper-facility.test.cjs` "the barrier is open" |

Nothing else was added. The signs stay blank (the owner's call), there is no gate logic, no NPC, no mission.

## Open questions for the owner

- The facility: what it really is and what is inside the warehouse (doors shut, nothing invented); whether the housing unit opens; whether the barrier should ever be lowered or the shack staffed (both are open defaults now); names (PROPOSED: "The facility", "The guard shack", "The warehouse", "The housing unit").

- The mine's depth (placeholder 120 m), its names (PROPOSED: "The mine", "The adit", "The bottom level"), and what the deeper levels hold.

- The village, bar and store names (PROPOSED: "The village", "The bar", "The store"); the blank sign boards' wording.
- Whether the bar and store get people, a menu or a shop (they are empty rooms now), and whether any house should open.

- The names of the road stretches and the pass (PROPOSED working names).
- Whether people should be able to walk off the road into the hills somewhere (a wider walkable area needs terrain collision; the corridor can be widened per stretch).
- Sign wording (still blank on purpose).
