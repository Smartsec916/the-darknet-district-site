# Vesper road (27–28 Nov 2026)

The owner asked first for "a drivable road from there [the Vesper surface workshop] going off into the distance", then (27 Nov 2026):

> "Make the road go between two of the highpoints. Change the terrain so it looks like a natural pass. If it needs a loading screen find ways to cheat it and have the loading screen look like the drive, go many miles like this around mountains. Add a small village with small houses, a bar, store. Past that is a mine dug into the side of a mountain. Add a loading screen when you enter it. Try to do the same thing at all loading screens. Try to hide them so they aren't noticeable by the player. My plan is to make the mine go far down. Make the depth a placeholder for now. Continue making the road to farther. It will end at a tech facility made to look like a warehouse with a small shared housing unit next to it. Make a guard shack that you get to first. Big warehouse doors on one side."

This is built in phases, one PR each. This page says what exists now.

| Phase | What | Status |
|---|---|---|
| 1 | The pass: the road climbs between the first range's two high points through a carved saddle; the land is streamed chunks; walking and driving along the whole road | PR #635 (`2026-11-28-vesper-pass-1`) |
| 2 | Many miles: the road continues 8 km beyond the pass along the valleys around the mountains (9.6 km, about 6 miles, in all) | `2026-11-28-vesper-road-2` |
| 3 | The village (small houses, a bar, a store) | later |
| 4 | The mine (portal, hidden load into the interior, placeholder depth) | later |
| 5 | The far end: guard shack, warehouse facility, shared housing | later |
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

## Restrictions (owner's standing rule: each with its source)

| Restriction | Added / widened / removed | Source | What it blocks | Test |
|---|---|---|---|---|
| Walking beyond the yard rectangle is limited to the road corridor (carriageway + shoulders + 4 m) | widened (was: the yard rectangle only) | technical: the mountains off the road have no collision of their own and are not built to be walked (steep slopes, no props); the corridor keeps people on ground made for them | walking off into the open mountains | `tests/vesper-road.test.cjs` "walking: ..." (the corridor is open all the way; off-corridor is blocked; the yard is unchanged point by point) |
| The truck may drive the yard rectangle or the road corridor | widened (was: the yard rectangle) | same technical reason | driving into the mountains | "the utility vehicle ... drives from the yard over the pass to the end" |
| Max road grade 9 % | new design default | the owner's brief for this work ("max grade ~10–12 % for the truck"); a reversible default in `vesper-world.js` `MAX_GRADE` | nothing (shapes the road) | "ground height ... grade <= 10 %" |

Nothing else was added. The signs stay blank (the owner's call), there is no gate logic, no NPC, no mission.

## Open questions for the owner

- The names of the road stretches and the pass (PROPOSED working names).
- Whether people should be able to walk off the road into the hills somewhere (a wider walkable area needs terrain collision; the corridor can be widened per stretch).
- Sign wording (still blank on purpose).
