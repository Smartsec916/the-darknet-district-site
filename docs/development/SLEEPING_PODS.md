# The Sleeping Pods room (rear of the District)

Moved on 2026-11-12 from the west room (local z 55..70) to the back of the building. Code: the layout and build in `void-runner/neochinatown.js`, positions in `void-runner/district-area.js`, the pod menu in `void-runner/world-integration.js`.

## Floor plan (District-plan metres: x across, z from the street door inward)

- The hallway (x -3..3) now runs straight into the room; there is no door and no key press.
- The room spans the full width of the building, z 70.5..78.3.
- Ten pods stand along the back wall, five across and two high, hatches facing the hallway: pod 01 at x -5.2, then every 2.6 m; 06..10 are the upper row.
- The wardrobe mirror is on the entrance wall west of the doorway (x -9). The stairs to the smoking terrace are at the east end (x 13..17), with the SMOKING AREA sign above them.
- The old west room is empty (walls `arc-*`), waiting for the arcade.

## How the move was made

The pods are still BUILT in the old room's coordinates and then set down as one rigid piece: every mesh added between `framed=[]` and the loop that follows is moved by old (x, z) -> (z - 62.2, 61.3 - x) and turned a quarter turn. So the pod interior (walls, bedding, music player, light panel, vending unit, hatch) is untouched code. Anything added inside that block moves with the pods.

## Positions other code relies on (`VoidDistrictArea`)

`POINT.pod`, `POINT.podExit`, `podBed(N, index)`, `podExit(N, index)` (faces the doorway to the hallway), `resume(state, N)`, and `POD_VIEW` = the three directions used from inside a pod: `hatch`, `inside`, `vending`. Do not hard-code pod coordinates or view angles elsewhere.

## Looking around from the pod (2026-11-12)

Lying in a pod the player is not held to the buttons: click the view to take the mouse (as when walking; Esc gives it back), or drag, or use the arrow keys. E gets up, M opens music and lights, V opens the vending list. The LOOK INSIDE / LOOK THROUGH HATCH button still snaps the view. Code: `podLook` in `void-runner/world-integration.js`; test `tests/pod-free-look-browser.cjs`.

## Unchanged

Entering and leaving a pod, the pod menu, private music and lighting per pod, the vending unit, wake-up in your own pod, multiplayer (a player in a pod is shown at their pod door), saves (a save made in a pod resumes in the same pod number at the new place).

## Not done yet (David's Tesana brief, 2026-11-12)

This step is the relocation only. Still to do for the Tesana match: the pod's window view, worn/scratched surfaces, amber accent lights, ceiling fan vent, lighting colour and brightness controls beyond the three presets, and lying-down animation. The reference picture shows a single large capsule with a window; the game has ten compact capsules, so the match will be in materials, lighting and controls rather than room shape.

## 13 Nov 2026: dark pods

David: the pods read almost white; the District should be dark with coloured light as the accent. The pod shell, ribs, bedding and mattress materials in `neochinatown.js` are now near-black violet (the earlier off-white Tesana plastic is superseded); the lit rings, LED strips, screens and the moulded surrounds' status lights carry the colour. Nothing about the pods' behaviour changed.

## Nov 2026 (David): look around at once on waking

David: after creating a character the player should be able to look around inside the pod, not be held to the buttons. Moving the mouse over the view (not over the buttons) now turns the view immediately, with no click first (`world-integration.js`, the `mousemove` handler by `podLook`); a click still holds the mouse for full turns, and drag and arrow keys work as before. The wake-up card is a low strip along the bottom edge (`pod-start.css`, last block) so the pod is visible. Buttons, keys (E, M, V), vending and music are unchanged. Picture: `docs/development/hall-wall/pod-wake-look.jpg`. Not done: the pod's window view and a lighter panel look from his newest pod pictures (he earlier asked for darker panels; ask which he wants).

## 15 Nov 2026 (David): the wall controls work, EXIT THE POD on the glass

David: inside the pod the player looks around and uses the controls on the walls; an Exit the Pod sign (above the door or lettered on the glass, a little see-through) lights up under the mouse; the District's music is never heard in the pod, only the pod's own player.

- **Pointing and clicking.** `neochinatown.js` marks each pod's music screen, light panel, vending face and exit sign as clickable (`podTouch`) and offers `VoidNeoChinatown.podPick(x, y)` / `podHover(kind)`. `world-integration.js` (`podAim`, `podUse`) asks what is under the mouse (or under the middle of the screen while the mouse is held) and acts on a click. Only the player's own pod answers.
- **What each click does** is decided by the pure `VoidDistrictArea.podControl(kind, u, v)` (tested in `tests/district-area.test.cjs`): on the music player the five transport buttons (previous, play, pause, stop, next) and the volume bar work directly, and anywhere else on it opens the playlist panel; on the light panel the three presets; the vending face opens the vending list; the sign gets up.
- **The sign** is lettered on the inside of the hatch glass, one-sided (not seen from the hallway), part see-through, and turns bright green under the pointer. One texture is shared by the ten pods.
- **Music.** `music-integration.js` now keeps the District's score and ambience off for as long as the player is in a pod, including while the playlist panel is open (before, the panel counted as "walking" and the hallway music could return).
- The bottom strip with the buttons and the E / M / V keys stay as they were.
- Checked in a browser at low quality: the sign lights under the mouse, READING switches the light, play starts a song with the pod view still up, the sign click gets the player out.
- Not done: the pod interior's look is still far from David's Tesana pictures (pale moulded plastic, 3D goods in the vending cabinet, the bigger light panel with colours and a brightness slider, a square window). That is a separate modelling job.
