# Outdoor performance: street people

Build `2026-11-16-outdoor-1` (16 Nov 2026). First of the "savings that change nothing you can see" from the NeoChinatown rework plan. Outdoors only: the District interior, Milked's interior, the VR rooms and every other place are untouched. The Medium glow pass and the sharpen setting were not changed. Quality tiers are unchanged (the same number of people exist at each tier).

## The problem

Outdoors in NeoChinatown about three quarters of the triangles in a heavy view were animated people, and most of them stood behind a building. From The Darknet District's street door the alley holds four people; the game drew 47. Nothing told the engine a city block was in the way, and street figures (kit figures of 8 to 10 pieces, 29,000 to 55,000 triangles) were drawn and animated in full at every distance.

## What was built

`void-runner/street-sight.js` (`VoidStreetSight`), started by `neochinatown.js` for the `street` area only, ticked once a frame after the people have been moved.

1. **Sight.** The streets are a handful of rectangles (`neochinatown.js` `streets`, plus NULL's floor because its doorway is open); everything else is a 30 m city block. A person is in sight when the straight line from the camera to them (or to either shoulder) stays inside those rectangles. Each rectangle is widened by 1.5 m for this test, so people are shown a little before a corner really uncovers them. No geometry is read; it is a few dozen multiplications per person.
2. **Always shown:** anyone within 8 m; everyone when the camera is above 3.4 m (a cab in the air); everyone when the camera, or the person, is not standing in a street (the vestibule, a lobby).
3. **Hysteresis.** Shown in the same frame they come into sight; hidden only after 0.75 s out of it.
4. **Hidden means** their pieces are not drawn (`isVisible`) and their animation is paused. The figure is never switched off (`setEnabled` is left to its owner), and where they are keeps running: walkers keep walking their pavement in `ncz-nightlife.js`, so they are in the right place when they come into view.
5. **Out of the camera's view** (2.5 m outside it, and more than 4 m away): animation paused. The renderer already did this for the five standing crew; it now covers the whole street crowd.
6. **Distance** (follows the camera app's zoom):
   - beyond 24 m the animation is worked out every 2nd frame, beyond 48 m every 3rd (`crowd.js` `lod`: the playing loop is held and moved on by hand at the same speed; one-off moves are left alone);
   - beyond 34 m the eyebrows, eyelashes and eyes are not drawn (three of a figure's pieces, about 700 triangles, a pixel or less at that range); they come back inside 30 m.

**Who it touches:** only the street's own ambient people, recognised by the marks their makers leave (`metadata.nightlife`, `.alley`, `.club`, and the standing `crew-*` figures). Other players, companions, Dax and anything else are never hidden or slowed. NULL's people, including its named staff, are hidden only when a city block is between them and the camera.

**The camera app** is unaffected: its name tags do their own wall test and read `isEnabled()`, which this never changes; a photo is the picture on screen, and nothing in the picture is hidden.

**Switches** (browser console): `VoidStreetSight.config.enabled=false` shows everyone again at once (A/B testing). Live counts: `VoidBabylon.district.sight.stats()`. All distances are in `VoidStreetSight.config`.

`crowd.js` gained `setCulled` (a second pause switch beside the owner's `setActive`; a figure animates only when both allow), `lod`, `figures()` and `node` on each controller.

## Measured

Same nine viewpoints as the plan, culling off then on **in the same session** (same people in the same places), 1280 by 720, frame-rate governor off. Software renderer: these are counts of what the game asks for, not frame rates.

| | Where | Draw calls Low | Triangles Low | People drawn Low | Draw calls Medium | Triangles Medium | People drawn Medium |
|---|---|---|---|---|---|---|---|
| A | Pad, at the street spawn | 208 → 153 | 0.37 M → 0.13 M | 6 → 0 | 568 → 368 | 0.88 M → 0.45 M | 11 → 0 |
| B | Main St south end, looking north | 797 → 653 | 1.20 M → 0.81 M | 28 → 17 | 2,280 → 1,776 | 2.35 M → 1.69 M | 52 → 33 |
| C | Main St middle, looking south | 487 → 454 | 0.78 M → 0.77 M | 16 → 16 | 1,424 → 1,288 | 1.78 M → 1.76 M | 36 → 36 |
| D | Alley mouth, looking east | 380 → 374 | 0.39 M → 0.38 M | 6 → 6 | 1,014 → 918 | 1.00 M → 0.75 M | 13 → 8 |
| E | District door, looking west | 666 → 491 | 1.11 M → 0.41 M | 24 → 7 | 1,980 → 1,240 | 2.28 M → 0.79 M | 49 → 10 |
| F | Milked's side street | 323 → 305 | 0.23 M → 0.15 M | 2 → 0 | 840 → 786 | 0.59 M → 0.48 M | 3 → 0 |
| G | Avenue junction, looking west | 162 → 162 | 0.23 M → 0.23 M | 2 → 2 | 452 → 440 | 0.69 M → 0.69 M | 6 → 6 |
| H | Avenue junction, looking east | 322 → 304 | 0.38 M → 0.34 M | 7 → 6 | 774 → 720 | 0.94 M → 0.90 M | 12 → 10 |
| I | Main St north end, looking south | 618 → 533 | 0.91 M → 0.75 M | 22 → 17 | 1,820 → 1,412 | 2.06 M → 1.67 M | 46 → 34 |

Animation clips being worked out every frame (whole street, Medium): 41 to 71 before, 0 to 17 after, plus 3 to 31 far figures at a half or a third of the rate.

**What the numbers say.**
- The view the plan singled out (E, the District's door) is down to a third of its triangles and loses 740 draw calls at Medium.
- Views straight down Main Street (B, C, I) improve least, because those people really are in sight: the street is 100 m long and holds most of the crowd. There the saving is the people on the avenue and in NULL, the face pieces, and the animation rate. Cutting these views further needs simpler far-away models (the plan's section 5.1), which is new model files and was out of scope here.
- Medium is still about twice Low everywhere because of the glow pass, which was deliberately not touched.

## Checked

- `tests/street-sight.test.cjs` (10 tests): the sight rule on the real street layout, the hysteresis, the distance steps, who is touched, and the controller's two switches and every-nth-frame mode against stand-in clips.
- **Against the real scene:** from 60 (Low) and 150 (Medium) random standing points on the streets, every person the rule called out of sight was ray-tested against the scene's meshes (five rays each: head, chest, shin, both shoulders). 871 cases on Low and 3,851 on Medium; in none could a ray reach the person. (About a quarter of the people the rule calls in sight are in fact covered: it errs toward showing.)
- **Round corners:** six walks (alley to Main Street, Main Street to the avenue, pad to Main Street, Main Street to Milked's street, avenue to Main Street, Main Street to the alley) in 1.2 m steps with a turn at each corner; at every step each hidden person inside the camera's view was ray-tested the same way, and pictures were taken every fourth step. All six on Low (371 steps) and the first on Medium (70 steps): nobody wrongly hidden; in the pictures the street fills as it opens and nobody is missing.
- Street to District and back: the culling stops with the street, nothing is left hidden or paused indoors, no page errors.
- **In the engine:** holding a clip and moving it by hand applies the pose at once, lands on the expected frame, and carries on from that frame when handed back.

## Not verified, and risks

- **No real graphics card.** Counts only. Whether this is felt as frame rate needs the ROG Ally test (`GRAPHICS_TEST_ROG_ALLY.md`).
- **The sight test knows only the street rectangles.** It assumes every city block is opaque and taller than the camera. That holds for the code-built city on this machine (the ray tests above). The purchased street buildings and NULL's purchased interior are not on this machine; if one of them has a see-through gap in a block, people behind it would be missing. `config.enabled=false` is the quick check.
- A new street or open plaza must be added to `streets` (it already has to be, for collision), otherwise people in it are simply always shown.
- Far figures animate at a half or a third of the frame rate. At 60 frames a second that is 30 or 20 updates a second at 24 m and 48 m; not judged on a real screen.
- High and Ultra were not run. VR headset not tried (the rule uses the camera's position, so it should behave the same).
