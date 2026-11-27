# Vesper road (27 Nov 2026)

The owner asked for "a drivable road from there [the Vesper surface workshop] going off into the distance". A separate agent is building the drivable utility vehicle (branch `claude/vesper-vehicle`); this page is what that vehicle drives on. The road is graphics plus one layout change (the walkable x bound); it adds no vehicle, controls, mission or text.

## Where it is

- Code: `void-runner/vesper.js` (`VoidVesper.road`, pure, runs in Node) and the presentation in the same file (`VoidVesper.dress`, called by `opening-scene.js`). The road kit pieces (reflector post, blank sign, gate, kerb block) are `void-runner/assets/models/vesper/vesper-roadkit.glb`, built by `tools/assets/universe/build_vesper.py`.
- Frame: Vesper's walking frame in metres (`opening-data.js`: the workshop's open front is at z = 1, walls x -13..13; Kestrel pad x 1..23, z 13..37; shooting range x 36..49, z -16..0, firing toward +x).
- Route: leaves the front apron at (14, 5), passes north of the range and its berm, the gate at x ~50 (boom raised, open), then east across the flats between the butte clusters (bearing about 97 degrees from the workshop) to (770, -97) where it climbs into the foothills and narrows into the haze.
- Width 7 m carriageway (`road.WIDTH`), 1.6 m soft shoulders each side (visual only).
- Walkable and drivable: from the start to `road.usableLength()` (about 221 m of road, where the centre line reaches x = 232). The layout's x bound was widened from 72 to 232 for this (`opening-data.js` `bounds:[232,80]`; z is unchanged). Beyond that the road is scenery.
- Parking apron: centre (38, 17.5), 8 m (x) by 5 m (z), flat at `road.SURFACE_Y`, joined to the road's north edge, east of the Kestrel pad. Kept free of props (`road.PARKING`, `road.onParking(x,z)`).

## API (`VoidVesper.road`, also `require('./void-runner/vesper.js').road`)

| Member | What it gives |
|---|---|
| `WIDTH`, `SURFACE_Y` (0.02), `SHOULDER`, `X_LIMIT` (232) | constants |
| `CONTROL` | the control points `[x, z]` (Catmull-Rom) |
| `centreline()` | dense centre line, about every 1.5 m: `{x, z, s, tx, tz}` (`s` metres from the start, `tx, tz` unit tangent) |
| `total()`, `usableLength(xLimit?)` | full length (about 770 m) and the walkable/drivable length |
| `nearest(x, z)` | nearest centre-line point: `{s, x, z, tx, tz, offset, distance}` (`offset` signed, + is left of travel) |
| `onRoad(x, z)`, `onParking(x, z)` | is the point on the carriageway / parking apron |
| `halfWidthAt(s)` | half width (narrows over the last 140 m) |
| `roadY(s, quality?)` | road surface height at `s` |
| `groundAt(x, z, quality?)` | the height a wheel or foot stands on: `SURFACE_Y` on the road or parking, 0 on the flat sand of the yard and walkable flats, the drawn terrain (`VoidVesperVisuals.meshHeight`) further out |

`VoidVesperVisuals.terrainHeight(x, z)` and `meshHeight(x, z, quality)` (in `vesper-visuals.js`) are the terrain's height function and the height of the drawn (triangulated) surface; the mountain mesh now uses the same function (heights unchanged, checked to 1e-12).

## What it guarantees (tests/vesper-road.test.cjs)

- No layout solid and no interaction point lies on the walkable road or the parking apron; the spawn, solids and interaction ids are unchanged.
- The road stays out of the firing lane, the berm, the Kestrel pad and the comms tower.
- The walkable road and parking are flat (`SURFACE_Y`); further out the road never sinks below the drawn terrain and has no steps over 3 m between samples.
- Low quality gets the road too (it is part of the requested feature); the modelled workshop is Medium and above.

## Collision added

None. The walkable area is the layout's rectangle (`bounds`), now 232 x 80 half-extents. Loose scatter stones and scrub that fell on the road or parking are removed at build time (visual, non-solid). Signs, posts, the gate and kerb blocks are not solid (as the other yard props are not).

## Open questions for the owner

- Where the road leads (it runs toward the far ranges and fades; no destination is named or built).
- Sign wording: the two route signs are blank on purpose. Any text is his to choose (PROPOSED only if he asks for a suggestion).
- Whether the walkable area should stay a 232 x 80 m rectangle or later follow a corridor along the road (needs a controller change).
