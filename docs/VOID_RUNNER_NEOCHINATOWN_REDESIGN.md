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
