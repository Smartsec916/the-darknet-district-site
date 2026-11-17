# NeoChinatown building-gap check

Build `2026-11-16-fixes-1` (16 Nov 2026). The owner, after playing the live site: "Much of NeoChinaTown has gaps in the buildings", and then how to find them:

> Please add a repeatable 3D building-gap check to the NeoChinaTown rework. Reuse the setup in tests/ncz-views-browser.cjs so you can inspect VoidBabylon.scene after the street finishes loading. First report which building assets actually appeared and whether the affected block is using the purchased models or the fallback. Start with one visible gap. Identify the two building pieces that should meet and record their names and world coordinates. From the street, cast a closely spaced grid of short rays toward the visible wall around that join. Flag places where rays pass through the expected wall depth. Exclude collision boxes, signs, and intentional openings such as doors and alleys. Save a marked-up screenshot from the player's position so I can recognize the spot. Show that the check detects the gap before changing the placement. Then fix the join, rerun the same check, and show the before-and-after result. Once it works on that spot, apply it to the other reworked storefronts.

## How to run it

Serve the repository root, then:

```
node tests/ncz-gaps-browser.cjs <label> [quarters] [low|medium|high]
```

- `quarters`: `oldtown,avenue` by default; any quarter of `ncz-quarters.js` (so the Port, once it is rebuilt, is `port`).
- Output: `work/ncz-gaps/<label>/report.txt` (what is printed), `report.json` (every flagged ray), and one marked-up picture per face that has a gap. `work/` is not committed.
- It ends with `NO GAPS` (exit code 0) or `GAPS FOUND: n` (exit code 1).
- `SITE_TEST_URL` (default `http://127.0.0.1:5187`); `BROWSER_CHANNEL=msedge` or `chrome` for a real graphics card, otherwise the bundled Chromium with the software renderer (the check does not depend on the renderer: it reads the scene's geometry).
- `GAP_ONLY=<face id>` one face; `GAP_STEP=0.2` metres between rays; `GAP_SHOTS=0` no pictures, `GAP_SHOTS=all` a picture of every face; `GAP_COMPARE=<earlier label>` pictures each face from where the earlier run pictured it, for before and after pairs; `GAP_ASSETS_ONLY=1` stops after the asset report.
- **Against the live site, read-only:** `GAP_LIVE=1 SITE_TEST_URL=https://thedarknetdistrict.com node tests/ncz-gaps-browser.cjs live`. Nothing is blocked or mocked, no account is used, and the game it starts is a local one that is never saved to an account. (`GAP_PROXY=http://host:port` where the machine needs an outbound proxy.)

It uses the way in of `tests/ncz-views-browser.cjs`: start the page, make a local game, `enterWalking('sacramento')`, wait for the street to finish loading, then read `VoidBabylon.scene`.

## What it does

1. **Asset report.** For each quarter: every purchased city model the street knows (`ncz:building5`, `ncz:storefronts`, `ncz:nightclub`), whether its file loaded and how many of its pieces are in the scene; how much of the street is built in code; and one plain line saying whether the quarter's blocks are on the PURCHASED models or the FALLBACK.
2. **Expected walls.** A quarter's streets are rectangles. Every stretch of a street's edge that is not another street of the quarter, a gate, or a declared opening must have a building on it. Each such stretch is a "face" with an id like `oldtown-0e--55_-26` (quarter, street number, side, from and to).
3. **Rays.** From inside the street, 3 m in front of the wall line (less in a narrow street), level rays are cast straight at the wall every 0.2 m along it at six heights (0.6, 1.4, 2.2, 3.6, 5.0 and 6.4 m). Each ray is just long enough to pass the wall line and go 1 m beyond it. A ray that meets a building piece in that distance is fine. A ray that does not is a gap.
4. **Pieces that should meet.** For each face with a gap the report lists the building plots that stand behind it (from the layout, cut the way the builder cuts them), with their world coordinates and how many of each plot's rays went through, and the names of the pieces the other rays did meet.
5. **The picture.** The player is put in the street facing the worst stretch; a red cross is drawn where each flagged ray crossed the wall line; the caption gives the quarter, whether its blocks are the PURCHASED models or the FALLBACK built in code, the face, the player's position and the count.

## What is excluded

`EXCLUDE` in `tools/ncz/gap-check.cjs` (a ray looks through these and carries on to whatever is behind):

| Excluded | How it is recognised |
|---|---|
| collision boxes, invisible and disabled meshes | not visible, not enabled, or visibility under 0.5 (the game's collision is data, not meshes, but anything hidden is skipped) |
| see-through things | material alpha under 0.5 |
| signs, advertisements, decals | name or material contains sign, neon, billboard, ad, poster, kiosk, banner, decal, graffiti, plate, logo, screen, campaign |
| lights, glow, weather | glow, pool, puddle, haze, fog, steam, smoke, rain, beam, shaft, flare, halo, lamp, lantern, light, lane-mark, sky, star |
| people, vehicles, drones | crowd, npc, guard, player, avatar, walker, runner, street-gear, ironeye, drone, cab, taxi, ship, figure, skeleton |
| loose street furniture | awning, cable, wire, bin, crate, cone, barrier, bollard, kerb, sidewalk, pipe-run |

Intentional openings (no wall is expected there; given to `wallFaces` as rectangles): every gate of the quarter, NULL's entry passage, Milked's front door and rear door, The Darknet District's door. Where one street of the quarter opens into another (the alley's mouth, Milked's side street and service alley, the access road), no wall is expected either.

**A limit to know about.** The street merges pieces that share a material into one mesh, and the merged mesh carries the name of the first piece. Exclusion by name therefore works on the material's name for merged pieces. A kiosk frame or a canopy shares its dark steel material with real structure and counts as a building piece where a ray meets it; it can hide a gap directly behind it.

## The pure parts and their tests

`tools/ncz/gap-check.cjs`: `wallFaces` (the expected walls), `rayGrid`, `classify` and `excluded` (what a ray found), `runs` (neighbouring flagged columns as one gap with a width), `plotsBehind` (the plots that should stand behind a face). `tests/ncz-gap-check.test.cjs` (part of `npm test`) covers each.

**For the Port's own builder** (or any rebuilt quarter): pass its quarter id. If its streets or openings are not the ones `ncz-quarters.js` gives, call `wallFaces(streets, openings)` with its own rectangles; `rayGrid` and `classify` need nothing else. Exclusion rules can be passed to `classify(ray, hits, rules)`.

## Results

### Asset report (16 Nov 2026)

| Where | `ncz:building5` | `ncz:storefronts` | `ncz:nightclub` | Blocks are on |
|---|---|---|---|---|
| The live site, build `2026-11-16-quarters-1` (read-only run), Old Town and the Avenue | file loaded, 0 pieces placed | file loaded, 0 pieces placed | file not on the site (404) | **the fallback built in code** |
| This machine, Old Town and the Avenue | file absent | file absent | file absent | **the fallback built in code** |

- **Every block in Old Town and on the Avenue is built in code, on the live site as well as here.** The purchased Cyberpunk City pack is used in one place only, "Block A" on Main Street's west side, and that block was replaced by NULL's front: the street's code only places the two purchased files when there is no club (`both=!club&&...` in `neochinatown.js`), and there is always a club now. The live site still downloads both files and places nothing from them.
- **So the gaps the owner saw are not a purchased-model problem,** and this machine, which does not have the purchased files, sees exactly what the live site shows: the first face checked gave 143 of 348 rays on the live site and 143 of 348 here.
- The purchased files cannot be had here by an approved route (the private repository `Smartsec916/void-runner-licensed-assets` is not attached to this session, and nothing in `tools/assets` fetches them). The check does not need them; where a purchased model is ever placed, run it on a build that has it, or against the live site as above.
- NULL's purchased interior is not on the live site either (its `.vrpak` answers 404 there), so NULL is its built stand-in on live.

### The first gap: Main Street's east side, north of the alley (face `oldtown-0e--55_-26`)

- **The pieces that should meet:** the row of shopfront panels (`storefront`, material `ncz-shopfront`; each 5.5 m long and 3 m high, at x 71.05, with 1.5 m between one and the next) and the bodies of the three plots behind and above them (`old-building`): x 71 to 82.93 with z -55.5 to -43.67, z -43.67 to -31.83, and z -31.83 to -20 (all `city-block-25`).
- **Before** (live site and this machine, the same): **143 of 348 rays pass through.** Widest runs 10 m (z -40.35 to -30.35) and 6.5 m. By plot: 27 of 138, 84 of 144, 32 of 66. The rays that did meet something met the shopfront panels, the alley's brick corner, a canopy and a few pipes; none met a plot body.
- **Cause:** the body of every plot that faces a street was being thrown away. When the city was cut into quarters, each piece is asked whether it belongs to the quarter: street detail within 2.6 m of the quarter, buildings within 45 m. The plot bodies were not on the list of building pieces, so they were judged as street detail by their centres (5 to 6 m back from the street) and dropped. Their roofs, windows, signs and shopfront panels were kept. So the street's walls were 3 m of shopfront with a 1.5 m opening every 7 m, and above that, windows and signs hanging in the air with the far city showing through.
- **Fix:** `old-building` added to the building pieces (`roofPiece` in `neochinatown.js`). One word.
- **After:** **0 of 348.** The same rays now meet `old-building` (143 of them, the same number that used to pass through) and the shopfront panels.
- Pictures (from x 62, looking east): before `oldtown-0e--55_-26.png` in the `first-gap-before` and `live-before` runs; after in `first-gap-after`.

### All of Old Town and the Avenue

| Run | Rays every | Old Town | The Avenue |
|---|---|---|---|
| Before (live site, read-only) | 0.5 m | **1,819 of 5,880** pass through, on 18 of 25 faces | **1,763 of 2,958**, on 3 of 3 faces |
| After the plot bodies | 0.5 m | 14 of 5,880, on 2 faces | 0 of 2,958 |
| The same build, finer grid | 0.2 m | 49 of 14,568, on 3 faces | 0 of 7,386 |
| After the slits | 0.2 m | **0 of 14,568** | **0 of 7,386** |

Face by face, before and after the plot bodies (0.5 m grid; the widest single gap on the face):

| Face | Before | Widest gap | After |
|---|---|---|---|
| `oldtown-0w--116_-60` (x 51, z -116 to -59.7) | 280 of 672 | 15.5 m | 0 of 672 |
| `oldtown-0w--57_-26` (x 51, z -57.3 to -26) | 145 of 372 | 6.5 m | 0 of 372 |
| `oldtown-0e--122_-93` (x 71, z -122.4 to -93.5) | 136 of 342 | 5 m | 8 of 342 |
| `oldtown-0e--90_-74` (x 71, z -90 to -74) | 118 of 186 | 12.5 m | 0 of 186 |
| `oldtown-0e--68_-62` (x 71, z -68.5 to -61.6) | 42 of 78 | 3.5 m | 0 of 78 |
| `oldtown-0e--55_-26` (x 71, z -55.5 to -26) | 143 of 348 | 10 m | 0 of 348 |
| `oldtown-2w--121_-116` (x 13, z -121 to -116) | 52 of 54 | 4.5 m | 0 of 54 |
| `oldtown-2s-13_51` (z -121, x 13 to 51) | 14 of 450 | 2 m | 0 of 450 |
| `oldtown-2n-13_38` (z -116, x 13 to 37.5) | 171 of 288 | 4 m | 0 of 288 |
| `oldtown-2n-44_51` (z -116, x 44 to 51) | 69 of 78 | 6.5 m | 0 of 78 |
| `oldtown-3w--116_-113` (x 37.5, z -116 to -113) | 16 of 30 | 1.5 m | 0 of 30 |
| `oldtown-3e--116_-113` (x 44, z -116 to -113) | 18 of 30 | 2.5 m | 0 of 30 |
| `oldtown-4e--74_-68` (x 101, z -74 to -68.5) | 55 of 60 | 4.5 m | 0 of 60 |
| `oldtown-4s-71_80` (z -74, x 71 to 80.45) | 76 of 108 | 6.5 m | 0 of 108 |
| `oldtown-4s-83_101` (z -74, x 83.05 to 101) | 30 of 210 | 2.5 m | 0 of 210 |
| `oldtown-4n-71_101` (z -68.5, x 71 to 101) | 340 of 354 | 29.5 m | 6 of 354 |
| `oldtown-5e--93_-90` (x 98.5, z -93.5 to -90) | 36 of 36 | 3 m | 0 of 36 |
| `oldtown-5n-71_94` (z -90, x 71 to 93.75) | 78 of 264 | 6.5 m | 0 of 264 |
| `avenue-0s-10_51` (z -20, x 10 to 51) | 280 of 486 | 10 m | 0 of 486 |
| `avenue-0s-71_144` (z -20, x 71 to 144) | 525 of 870 | 44 m | 0 of 870 |
| `avenue-0n-10_144` (z -5, x 10 to 144) | 958 of 1602 | 49.5 m | 0 of 1602 |

**The slits.** What was left were openings 0.12 to 0.24 m wide between two neighbouring buildings, open from the street to whatever was behind: on Main Street's east side at z -95.5 and z -116.6, on the north side of Milked's side street at x 80.6, 90.2 and 99.8, and on the south side of Milked's service alley at x 80.6 and 90.2. A 0.5 m grid only finds one when a ray happens to line up, which is why the grid is 0.2 m now.

- **Cause:** a plot is pulled back 0.12 m from a street so that the shopfront panels stand in front of it. The test for "is there open ground on this side" also answered yes when a street or yard only touched the side's corner, so two neighbours were each pulled back from each other.
- **Fix** (`neochinatown.js`, the plot loop): a side is pulled back only where open ground really runs along it; and where it runs along only part of a side, the pulled-back strip is filled over the rest. Which sides count as faces is unchanged, and no random number is drawn, so every sign, window and height in the city is where it was.
- **Before:** 49 rays on 3 faces. **After:** 0.

### What this does not cover

- **The Port** (being rebuilt by its own builder): not run. `node tests/ncz-gaps-browser.cjs <label> port` runs it.
- **Above 6.4 m.** The rays stop there. A building lower than its neighbours is not a gap by this check.
- **Roofs and backdrops.** Sightlines over a roof to the far city are not walls and are not tested.
- **Medium, High, Ultra.** Run on Low. The buildings' geometry is the same on every setting (the settings add detail to it), but the higher settings were not run.
- **The street-sight rule** (`street-sight.js`) hides street people behind blocks on the assumption that every block is solid up to 30 m. With the plot bodies missing that was untrue: people were hidden behind walls that were not there. With the bodies back it holds again; no sight rectangle needed changing.

