# NeoChinatown visual upgrade with the Cyberpunk City pack (2026-10-31)

Stage A (inspection) and Stage B (one prototype block). Stage C, David's review, comes next; nothing beyond block A is
changed. Pack: "ULTRA Detailled Cyberpunk City - Small Version" (CGTrader,
https://www.cgtrader.com/3d-models/exterior/cityscape/ultra-detailled-cyberpunk-city-blend-files-small-version).
The pack and everything converted from it are licensed content: they live in
`%LOCALAPPDATA%/void-runner-assets/work/ncz-city-2026-10-31` and `void-runner/assets/models/ncz/` (git-ignored), never
in the repository. Screenshots that show them stay in the git-ignored `work/` folder.

## Baseline: the city as built (`void-runner/neochinatown.js`, world metres, x east, z north)

| Place | Rectangle [x0, x1, z0, z1] or point | Notes |
|---|---|---|
| Avenue | [2, 152, -20, -5] | Wide street across the north; opens west (avenueWest [-60, 2]) and east (avenueEast [152, 200]) |
| Main Street | [51, 71, -124, -20] | Runs south from the avenue; continues as mainSouth [56, 66, -190, -124] |
| Alley | [71, 136, -61.6, -55.5] | East off Main Street; The Darknet District's door on its south side at (126.9, -61.9) |
| Access road | [13, 51, -121, -116] | Joins the pad passage to Main Street |
| Passage | [37.5, 44, -116, -92] | From the road to the landing pad |
| Landing pad | [13, 37.5, -106, -86] | Ship at (22, -96), box 3.6 x 4 x 10.5; BOARD YOUR SHIP (27, -98); LANDING TERMINAL (34.5, -103); spawn (31, -96), yaw 2.44 |
| District | footprint [109.4, 144.4, -120.4, -61.6] | Its own plan (VR arcade terminal, bar, Admin and Iris, vending, pods, meeting room, stairs), turned a half turn; unchanged |
| Roof terrace | [78.4, 99.4, -116.4, -95.4] | Smoking area reached from the District stairs |
| Corporate District | [-120, -60, -40, 15], centre (-90, -12.5) | Placeholder plaza, streams in within 90 m |
| Milked | [200, 240, -30, 5], centre (220, -12.5) | Placeholder |
| Container Settlement | [30, 100, -250, -190], centre (65, -220) | Placeholder |
| Taxi zones | main (61, -100); avenue (40, -12.5); alley-mouth (61, -66); passage (40.75, -101); corporate (-90, -12.5); milked (220, -12.5); containers (65, -215) | Painted boxes on the road |
| Pedestrian lanes (ncz-nightlife.js) | main-west x 52.6 (+-1), main-east x 69.4, alley z -59.3, avenue | Sidewalks are 3 m wide on the avenue and Main Street |

Collision: every area between the streets is a solid 30 m city block (27 boxes from a half-metre grid); the District and
the terrace have their own walls. Buildings are presentation only: each city block is cut into plots of up to 12 m with
procedural boxes (ambientCG textures, lit windows, AC units, balconies, roof clutter), grey shopfront panels ("plain dark
grey ... for now", 2026-10-26), neon blade and shop signs, billboards, kiosks, cables, rain, haze and light pools. The
city's detail comes from one seeded random sequence. Lighting: teal-black sky, exp2 fog, dim sky light; neon and windows
do the lighting.

Baseline measurement (Edge, AMD Radeon integrated GPU, medium quality, `tests/ncz-views-browser.cjs fallback`):
median frame 25 ms (40 fps) at street level in the old neighbourhood, 33 ms looking down the passage; render 6.5-12 ms;
380-770 draw calls; 1,119 meshes, 283 textures; GPU process about 890 MB. The district placeholders run at 60 fps.

## The pack

2.3 GB unpacked: three whole-city Blender files (Ultra, Low, and an "Optimized" one with half the polygons), 30
individual model files (Blender; most also as FBX) and 167 textures (306 MB, up to 4000 px). Scale: about 3.3 units to
the metre (a car is 16 units long); converted at 0.3. Textures are packed into the individual files.

| Asset | Category | Triangles (modifiers applied) | Materials | Textures | Real size (m, x x y x z) | Real-time? | Recommended place |

|---|---|---|---|---|---|---|---|

| Antenna | Street furniture | 61,878 | 5 | 5 | — | With conversion | Rooftops / skyline |

| Barriere | Street furniture | 1,432 | 1 | 2 | — | Yes | Container Settlement gate |

| Building1_Classic | Building | 124,618 | 9 | 11 | 30.1 x 30.4 x 36.3 | With conversion | Avenue / Corporate District (planar-decimate, LOD) |

| Building2_1980 | Building | 42,822 | 5 | 7 | 34.1 x 38.5 x 57.0 | With conversion | Corporate District |

| Building3_1960 | Building | 187,928 | 5 | 6 | 73.0 x 42.4 x 45.0 | Decimate / LOD first | Outer ring (decimate) |

| Building4_1930 | Building | 332,964 | 3 | 4 | 32.3 x 32.2 x 69.6 | Decimate / LOD first | Skyline only (heavy) |

| Building5_1980 | Building | 152,548 | 4 | 5 | 11.9 x 27.2 x 25.0 | With conversion | Main Street plots (used in block A) |

| Building6_Sci-Fi | Building | 73,560 | 4 | 4 | 16.4 x 20.5 x 18.0 | With conversion | Corporate District / Milkéd |

| Building7_1890 | Building | 711,464 | 4 | 6 | 32.6 x 32.8 x 41.0 | No | Not for real time (0.7M tris) |

| Building8_1910 | Building | 1,327,746 | 3 | 5 | 29.4 x 20.5 x 24.6 | No | Not for real time (1.3M tris) |

| Building9_Sci-Fi | Building | 79,956 | 4 | 4 | 8.7 x 14.3 x 10.4 | With conversion | Milkéd |

| BusStop | Street furniture | 664 | 4 | 6 | — | Yes | Avenue |

| Car1 | Vehicle | 37,032 | 5 | 4 | — | With conversion | Parked (decor) or traffic |

| Car2 | Vehicle | 1,620 | 4 | 4 | — | Yes | Parked |

| Car3 | Vehicle | 41,750 | 10 | 7 | — | With conversion | Parked |

| Car4 | Vehicle | 37,468 | 6 | 5 | — | With conversion | Parked |

| Car5 | Vehicle | 2,054 | 5 | 5 | — | Yes | Parked |

| Chair2 | Street furniture | 2,164 | 2 | 3 | — | Yes | Stall interiors |

| FireBarrel | Street furniture | 5,752 | 2 | 4 | — | Yes | Container Settlement |

| Lampion | Lighting | 4,700 | 2 | 3 | — | Yes | Alley / Main St |

| Neons_Ads_Signs | Signage | 828 | 5 | 4 | — | Yes | Blade signs on Main St / Milkéd |

| ParkMeters | Street furniture | 2,430 | 3 | 4 | — | Yes | Avenue kerb |

| Public TV Phone | Street furniture | 4,926 | 6 | 5 | — | Yes | Avenue |

| Shelves Crates and Others | Street furniture | 28,982 | 11 | 15 | — | With conversion | Container Settlement, alley |

| Stores and TVs | Storefront | 189,080 | 47 | 43 | — | Decimate / LOD first | Ground-floor shopfronts citywide (used in block A) |

| StreetLights | Lighting | 15,576 | 4 | 5 | — | Yes | Avenue kerbs |

| Table | Street furniture | 6,750 | 2 | 3 | — | Yes | Stall interiors |

| TrashBin | Street furniture | 5,756 | 2 | 4 | — | Yes | Alley |

| VendingMachine | Street furniture | 30,704 | 11 | 13 | — | With conversion | Alley, District front |

| VerticalVent | Street furniture | 10,572 | 2 | 3 | — | Yes | Rooftops, alley |

Real-time notes: storefronts, signs and street furniture are light. Buildings are heavy once their modifiers are applied
(arrays, bevels); planar decimation (merging coplanar faces) cut Building5 from 152,548 to 101,806 triangles with no
visible change. Building7 (0.7M) and Building8 (1.3M) are not usable in real time. The whole-city files are not used.

Licensing to check before any release (`docs/VOID_RUNNER_ASSET_LICENSES.md`): about 50 textures carry Textures.com file
names (their licence lets them be used in products but not redistributed as textures); one advertising image is named
like a Midjourney generation ("Nerdaali_sci-fi_futuristic_advertising..."); a car texture is called "Ford1965" (trademark).
No licence or readme file is inside the pack.

## Pipeline

- `tools/animation-pipeline/pack_to_glb.py` (Blender): objects from a pack file to GLB at real scale, modifiers applied,
  origin at the middle of the base, front turned to +Y; `--kit` keeps several models in one file sharing their
  textures; `--planar` merges coplanar faces; `--lit-windows MATERIAL` splits a building's glass into panes and lights
  about a third of them warm or cool at night (fixed seed).
- `tools/assets/optimize-textures.cjs` caps textures at 1024 px; `tools/assets/ktx2-glb.mjs --etc1s-color` makes them
  KTX2 (ETC1S colour, UASTC normal maps), resampled to powers of two; `tools/assets/pack-model.cjs` scrambles to .vrpak.
- Game: `neochinatown.js` places pack models through the existing optional-model table, only on a local development
  server (`localDev()`); `VoidAssets.instance(id, parent, only)` takes one model from a kit. An upgraded block runs its
  procedural code with its output discarded, so the seeded sequence, and every sign, window and height elsewhere,
  stays the same. Without the files the city is exactly as before (tested).

## Stage B: block A

Main Street's west side across from the alley mouth, z -76.6 to -49.4 (two procedural plots): Building5 (1980 apartment
block, 27.2 x 11.9 x 25 m, 101,806 triangles, 1,134 window panes, about a third lit) on a row of six pack stalls
(noodle bar, TV repair, shuttered shop x2, tea stall, green-painted shop; 87,620 triangles together) with a fascia between
them. Its front is the street edge (x 51), as before. Collision, interactions, taxi zones, signs, kiosks and the
pedestrian lanes are unchanged; no street props were added (the 3 m sidewalk is taken by the walking lane and the
kiosks). Files: building5.vrpak 5.7 MB, storefronts.vrpak 8.4 MB.

Cost (same viewpoints, with and without the block): frame time unchanged (25 ms median); draw calls +100 to +170 where
the block is in view (main-mid 384 -> 500, pad passage 765 -> 934); render time within +-1.5 ms; GPU process +70 MB.

## Plan for the rest of the city (after David's review)

Street level first, where players are: replace the grey shopfront panels along the avenue and Main Street with stall
rows; pack neon blade signs and lampions on Main Street; vending machines, crates, bins and vents in the alley.
Buildings by district: Main Street and avenue plots with Building5 and Building6/9 variants (planar-decimated, lit
windows, a cheaper far version); Corporate District with Building2 and Building6; Milked with the sci-fi buildings and
the big signs; Container Settlement with crates, barrels and barriers; heavy buildings only as distant skyline.
Draw calls are the budget: merge each upgraded block's static parts by material, use one kit per district and instance
repeated pieces, and stream far blocks in and out as the district placeholders already do.
