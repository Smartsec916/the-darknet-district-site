# VOID//RUNNER: NeoChinatown redesign, brick alley and VR arcade

- **As of:** 2026-10-26
- **Brief:** David's "NeoChinatown Redesign, Cyberpunk Environment & Interactive VR Arcade", with his redesigned map
- **Status:** built and tested locally, in review (PR). Nothing is live until David merges it.

## 1. Layout (follows David's redesigned map)

World metres: x runs east, z runs north. All of it is in `void-runner/neochinatown.js`.

| Place | Where | Notes |
|---|---|---|
| Avenue | x 2–152, z −20 to −5 | A wide street along the north edge. Its ends are closed barriers ("封路 · ROAD CLOSED"), with lit towers beyond, so it reads as part of a larger city. |
| Main street | x 51–71, z −124 to −20 | Runs south from the avenue. Sidewalks, storefronts, shop neon, kiosks, billboards and towers line both sides. |
| Landing pad | x 13–37.5, z −106 to −86 | The Kestrel, with its boarding stairs and ring, pad lights and the landing terminal. You arrive here. |
| Passage and access road | x 37.5–44 / z −121 to −116 | Joins the pad to the main street. |
| Alley | x 71–136, z −61.6 to −55.5 | Turns east off the main street. The District door opens off its south side at x 126.9. |
| The Darknet District | south of the alley | Its plan is unchanged, but **turned 180°** with the door on the alley and the hallway running south. Every room, NPC, interaction, light and collision box moves with it (`toWorld`). |
| Smoking terrace | west of the District | Still reached by the stairs at the hallway's end. |

- **Collision:** the city blocks between the streets are solid, built automatically as boxes from the street rectangles.
- **Tests:** `tests/neochinatown-layout.test.cjs` walks the map from the landing pad. It checks that:
  - the board point, terminal and District door can be reached
  - nothing inside the District can be reached while its door is shut
  - with the doors open, every room, NPC and the stairs can be reached
  - the stairs land on the terrace
  - the plan is turned, not mirrored
- **Music and in-world speakers:** these use the District's own plan through `zone()`, so the zones work unchanged.

**Left out, to be decided:** the map shows a narrow strip running south from the alley's east end, beside the District. It would be a dead end, so the alley stops at a brick wall at x 136 instead.

## 2. Brick alley and graffiti

- **Brick:** a procedural texture of dark red and charcoal bricks, uneven mortar, soot from above and damp from below, rain streaks, patched repairs and cracks. A normal map, generated from the same layout, gives the mortar depth. The texture repeats every 3 m along a wall and every 1.2 m up it. Old brick buildings line the north side, and brick runs along the south side to the District's front.
- **Details:**
  - pipes, AC units, junction boxes and cables
  - a dumpster, crates and drain grates
  - dim amber lamps with warm light pools on the floor and wall
  - a camera over the door
- **Graffiti:** the 12 supplied slogans, painted onto transparent decals a few centimetres off the walls. Each decal faces the alley, so none is mirrored.
  - **Styles:** spray (outlined letters with highlights), stencil (cut bridges) and hand-painted (brush script).
  - **Ageing:** each has drips, overspray and a faded older tag underneath.
  - **Sizes and heights:** they vary.
  - **Posters:** three torn "PRIVACY IS RESISTANCE" posters.
- **The District entrance:** a plain steel door with a small "DD" mark. It stays tucked away; there is no advertising.

## 3. VR arcade (in the District, west side of the hallway)

- **Booths:** two standing VR booths behind clear glass, divided by a glass partition. Each has:
  - a dark floor pad with a lit play boundary
  - an overhead tracking rig with corner sensors
  - a small session sign above the glass: "NEON STRIKE · VR SHOOTER" and "SKYLINE SOCIAL · DANCE · DINE · PLAY"
- **Viewing strip:** a rail and a bench by the hallway. The old seated rigs, arcade cabinets and monitor desks are gone.
- **Collision:** the glass is solid, so nobody walks into the booths.
- **Players:** two new crowd figures, each wearing a slim VR headset with a lit lens and wrist tracking pucks. Neither holds anything.
  - **Player one, the VR shooter:** raise to aim, fire, track a second target, aim high and fire, take a hit, duck, come back up, aim low and fire, then lower and breathe. Small body turns follow the virtual targets.
  - **Player two:** dances; then has a virtual meal (reaches, picks up, brings it up); then works floating menus (open, tap, swipe) and talks with someone only they can see; then rests.
  - **Timing:** each move is a whole clip with a start and an end, and pauses vary, so the two never move in sync.
- **Animation sources (all CC0):** Quaternius Universal Animation Library: Pistol_Aim_*, Pistol_Shoot, Hit_Chest, Crouch_Idle_Loop, Dance_Loop, PickUp_Table, Interact, Spell_Simple_*. The figures are MakeHuman (MPFB). Records are in `void-runner/assets/models/crowd/README.md`.

## 4. A rendering fix found on the way (affects every scene)

- **The bug:** whenever a model finished loading, Babylon's glTF loader raised every material in the scene to one light slot per light. In NeoChinatown that is 14 lights. That exceeds the 12 uniform buffers allowed by ANGLE/Direct3D 11 (Edge and Chrome on Windows), so shaders failed to compile and things silently stopped drawing. Crowd figures that loaded in the background were affected; main showed 436 such errors.
- **The fix:** `asset-pipeline.js` now caps materials at 8 lights after each load (Meridian's own figure). Errors went to 0.

## 5. What was not done (needs David's go-ahead)

- **Imported building models:** nothing was downloaded, because downloads need approval. The streets use the game's procedural towers, signage and materials, rebuilt for the new layout.
  - Free, commercially usable packs could add detailed facades, rooftop machinery and street clutter.
  - The next step is to propose specific packs for David to approve (alongside `docs/VOID_RUNNER_ASSET_CANDIDATES.md`); each needs its licence checked before download.
- **The east strip on the map:** see §1.
- **Eating:** there is no dedicated eating animation in the free library. The "meal" is a reach, a pickup and an interact move.

## 6. Tests run

- `npm test`: 364 pass, including the new NeoChinatown layout tests and the updated music-zone tests.
- **Browser (Edge, local):**
  - Screenshots of the landing pad, main street, avenue, alley entry, north and south alley walls, alley end, District door, hallway and VR arcade.
  - Both VR players were seen animating: the shooter ran shoot, aim up, duck, aim down; the second player ran dance, interact, menu.
  - There are 0 shader errors after the light cap.
- **Browser suites:** `meridian-menu-browser`, `relay-browser`, `unified-controls-browser` and `flight-skirmish-browser` pass. `tutorial-menu-save-browser` fails on `main` too; PR 86 fixes it.

## Visual overhaul (2026-10-27)

David's brief: make NeoChinatown look like his four references (an old, crowded neighbourhood under a vast megacity) without changing the layout. `VoidNeoChinatown.layout()` (walls, doors, interactions, spawn) is byte-identical to before; only what is drawn changed.

- **Lighting (NeoChinatown only, restored on leaving):**
  - teal-black sky; blue-green EXP2 haze (0.0028)
  - exposure 1.3, contrast 1.18, environment light 0.3
  - a dim teal sky light outdoors (0.5)
  - inside the District, the original level comes back as you walk in
  - exposure is re-applied every frame, so a quality change can't reset it
- **Old neighbourhood:**
  - **Buildings:** the tall modern towers along the streets are gone. Every city block is built up in 12 m plots of weathered corrugated steel, old concrete and leaking plate (ambientCG, CC0). Each plot is set 0.35 m back from the street, so storefronts stay in front.
  - **Heights:** 18–30 m on the avenue and main street, 9–17 m elsewhere; an outer ring 26–46 m.
  - **Facades:** each texture glows faintly (as if lit by the haze), so the weathering reads in the dark.
  - **Windows and walls:** lit and dark windows, wall AC units, balconies, drainpipes, conduits.
  - **Roofs:** parapets, AC units, water tanks, antennas with red lights, satellite dishes, small rooftop shacks.
- **Megacity:**
  - two rings of night towers (radius 160–250 m, 110–320 m tall; and 280–460 m, 220–620 m tall)
  - set-back crowns, spires, beacons, corner light strips
  - giant vertical ad screens; five nearer ones change every ~10 s
  - a haze dome that glows at the horizon
  - no collision; one thinner ring on low quality
- **Neon and light:**
  - **Blade signs:** sixteen vertical signs sticking out from the walls (拉麵, 旅館, 當鋪, 診所, 電器, 網吧, 麻將, HOTEL, PHO, KEBAB, CYBERWARE, TATTOO, PAWN, BAR, NOODLES, CLINIC), readable from both directions. A few flicker briefly now and then.
  - **Wall lamps:** amber and white.
  - **Light spill:** every sign, lamp and the new pad floodlights spill light onto the wall and wet ground as additive glow. These are not real lights: the scene already has more lights than its shaders use.
- **Infrastructure:**
  - **Cables:** sagging overhead cables across the main street, avenue, access road, passage and alley, 7–11 m up, ending on junction boxes.
  - **Graffiti:** eight new pieces on the access road, passage and pad walls (brief's slogans), all readable the right way round.
- **Wet streets and rain:**
  - Puddles: glossy, haze-tinted water rather than black discs; 26 more on medium and high.
  - Rain: particle streaks that follow the camera outdoors and stop inside the District. Off on low quality; 1,800 or 3,400 per second.
- **The District's front, kept discreet:**
  - a small backlit plaque, THE DARKNET DISTRICT
  - thin dim violet trim round the door
  - a second camera
  - a violet pool on the alley floor
- **Performance:**
  - Windows, AC units, parapets and roof parts are written straight into one mesh per material (batches) instead of about 6,500 separate meshes.
  - Building NeoChinatown takes about 1.0 s, against 4.4 s before batching. Entering takes about 1.7 s here.
  - A render at the main street takes 16.9 ms, against 16.5 ms on `main` (medium quality, this PC).
- **Not done:**
  - no imported 3D models: no suitable CC0 building or prop packs in this style were found, so props are simple geometry
  - no rain splashes and no rain sound
  - no real-time reflections; puddles and light pools approximate them
  - the grey storefront panels are unchanged (David's earlier choice)

## Purple gaps and invisible walls (2026-10-27)

- **Root cause:**
  - There was no ground outside the streets. Every gap between buildings, the land past the outer ring and between the distant blocks showed straight through to the sky and haze colour, which looked like open space.
  - Buildings stood 0.35 m behind the collision line, with no ground in that strip. This left a sky-coloured seam at the foot of the walls, and the solid edge stopped you short of the visible wall.
- **Fix:**
  - **Ground:** one ground plane (cracked asphalt) under the whole city, out to the horizon, just below the streets.
  - **Walls:** they now stand 0.12 m behind the collision line, just behind the storefront panels. Blade signs, lamps, light pools, graffiti, pad floodlights and cable anchors moved with them.
  - **Roofs:** every building gets a dark tar roof. Plots inside the blocks get parapets and roof equipment, so the city reads as dense from a taxi or a rooftop instead of a checkerboard of plain boxes. All of it is batched.
- **Collision:** unchanged. `layout()` is byte-identical; the visuals were brought to the existing collision.
- **Check:** a scan with the sky made pure magenta, run from every street (8 directions, every 8 m) and from 25 m and 70 m over the whole city.

  | View | Before | After |
  |---|---|---|
  | From the air | 193 views showed void | 0 |
  | Street level, below the horizon | up to 4.1% of the view | 0 |

  What remains is sky above the roofline.

## Sky, crowd, District doors (2026-10-28)

- **Sky:**
  - **Why there was a circle:** the old haze was an open-topped cylinder, and looking up showed its rim against the plain background colour.
  - **What replaced it:** a closed sphere whose colour depends only on height:
    - the fog colour at the horizon, so distant towers fade straight into it
    - a band of city light pollution just above that
    - polluted haze higher up
    - dark overhead
  - **Smog:** a flattened cloud deck of drifting blotches, mapped flat from above so nothing pinches overhead and tiled so no seam shows. It's lit warmer toward the horizon and kept out of the glow layer.
  - **Cost:** two meshes and one 512 px texture; no smog on Low.
- **Why pedestrians looked blocky:**
  - **Every visit re-downloads them:** the offline cache (service worker) has been a stub for a while, so each visit downloads every crowd model again (11 looks, about 35 MB).
  - **Stand-ins until then:** until a model arrived, its person showed as a blocky procedural stand-in. On a slow connection a download could time out after 2 minutes and leave the stand-in for the whole visit.
  - **Low quality:** it never loaded the models at all.
- **What changed for loading:**
  - **No stand-ins:** ambient people now wait hidden and appear when their model arrives.
  - **Failures:** a failed model is logged, listed in `VoidAssets.failed`, and its people switch to another look that did load.
  - **Speed and quality:** downloads run four at a time instead of two, and every quality loads the real figures.
- **Crowd density (`ncz-nightlife.js` config):**
  - **Walkers:** 44 (High), 28 (Medium) or 12 (Low).
  - **People standing about:** about 40 / 23 / 8 — groups of 2–3 talking, couples, window-shoppers facing storefronts, people leaning or smoking on walls. They're on clear sidewalk only, never at doors, taxi stands or the static crew, and walkers step round them.
  - **Coming and going:** walkers may leave at a street's end and reappear later on another street.
  - **Variety:** all eight NeoChinatown and District looks walk the streets.
  - **Adaptive:** figures more than 90 m from the camera are switched off. A frame-rate governor hides the furthest people below 45 fps and brings them back above 56.
  - **Measured (Edge, desktop GPU):** 64–81 people visible around you on High, 15–21 on Low, at 60 fps.
- **District doors:**
  - **Frame:** the entrance frame was one solid slab across the doorway, so the door never looked open. It's now two jambs and a header.
  - **Doors:** both the entrance and the inner door are now two panels that slide into the walls.
  - **Locked:** until the story opens a door (`districtDoor` / `districtBadge`, unchanged), it stays shut and blocks you.
  - **Unlocking:** pressing E slides it open, and its status light turns green.
  - **After that:** the door opens as you approach from either side and closes behind you.
  - **Collision:** follows the door (the solid's `open` flag at 80% open), and a door never closes while you stand in it.
