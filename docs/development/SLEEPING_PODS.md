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

## Unchanged

Entering and leaving a pod, the pod menu, private music and lighting per pod, the vending unit, wake-up in your own pod, multiplayer (a player in a pod is shown at their pod door), saves (a save made in a pod resumes in the same pod number at the new place).

## Not done yet (David's Tesana brief, 2026-11-12)

This step is the relocation only. Still to do for the Tesana match: the pod's window view, worn/scratched surfaces, amber accent lights, ceiling fan vent, lighting colour and brightness controls beyond the three presets, and lying-down animation. The reference picture shows a single large capsule with a window; the game has ten compact capsules, so the match will be in materials, lighting and controls rather than room shape.
