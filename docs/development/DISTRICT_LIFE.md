# District life: what the residents do (15 Nov 2026)

David: "Many the NPCs in The Darknet District aren't doing anything, just standing there. Make them go over to the Arcade Games, play the Games with no games in them for a while, walk into the Store to look around, go to the bar and order a drink or oxygen. Give about half of the NPCs at the Bar oxygen masks while they're there."

## What happens

The seven people the District already stands in the hallway, by the VR glass and at the bar (`crew-hall-talk1/2/3`, `crew-hall-watch1`, `crew-vr-watch`, `crew-bar1`, `crew-bar2`; several are named residents with their own models) now each run an eight-minute round: a minute or two at their own spot, a walk to one place, a stay there, a walk to a second place, a stay, and the walk home.

- Places: in front of each of the five arcade cabinets (playable or not), four spots in the store, four spots at the bar counter.
- In one round no two residents are sent to the same first place or the same second place.
- It runs on the clock, like Dax, so every player sees the same person in the same place. Residents are offset from each other so they do not all leave together.
- At the bar about half of the visitors wear a clear oxygen mask with a tube (decided per visit); of the two people whose own spot is the bar, one (`crew-bar1`) wears one there.
- While a resident is at their own spot the game animates them exactly as before (talking, looking, the small variety clips).

## Code

- `void-runner/district-life.js`: pure rules (`HOMES`, `PLACES`, `round`, `at`) and the browser part that moves the figures and builds the mask. Test: `tests/district-life.test.cjs`.
- `void-runner/crowd.js`: `VoidCrowd.controller(node)` gives the animation controller of a figure the scene placed. Also fixed here: a clip Blender exported as `walk.001` is now found as `walk` (this is why Dax glided instead of walking).
- `void-runner/babylon-renderer.js`: an ambient figure with `metadata.life` set is left alone by the scene's own idle variety.
- Walks go out to the hallway's centre line, along it, and in. Every place and path was checked against the District's collision boxes in a browser (none blocked).

## Limits

- Residents walk through each other and through the player; there is no avoidance.
- The mask is placed on the standing figure's face and tied to the head bone; it was checked on the District looks at medium quality (see the handoff for the pictures taken).
- The terrace smokers, the staff (Admin, Iris, Nyx), the VR players and Dax are not part of this.
- No lines are spoken at the bar; "ordering" is standing at the counter with a drink or talk clip.
