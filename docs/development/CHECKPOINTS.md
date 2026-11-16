# Vestibules and checkpoints: David's decisions (16 Nov 2026)

Status (build `2026-11-16-quarters-1`): the checkpoints of map A are BUILT as buildings you walk or ride through, with the scan as a picture only.
Contraband, bribes and shielding are NOT built (not decided). What is built and how to add a checkpoint: see "Built" below and
[`NEOCHINATOWN_QUARTERS.md`](NEOCHINATOWN_QUARTERS.md).

## Decided by David
- **No loading-screen look.** Vestibules must not read as loading screens. Wording such as "PREPARING NEOCHINATOWN" is removed from view.
  Built in BUILD `2026-11-16-vestibule-1`: the District's checkpoint panel and corner frame, and Milked's card, logo and bars, are hidden
  (the wording remains for screen readers only). The still picture of the vestibule and the scan light remain.
- **Two tiers.** Vestibules into private businesses (Milked, The Darknet District, later ones) stay BASIC but must not look like a loading
  screen. CHECKPOINTS can be more elaborate. In both, hide the loading as far as possible.
- **Checkpoints** are security vestibules that double as loading screens, where the player is scanned for contraband.
  - Around NeoChinatown: cheap private security guards. They can potentially be bribed.
  - Near the Corporate District: checkpoints run by The Function.
  - The Darknet District can sell shielding from the scans.
- **Standardise character quality** across the game: NPCs inside The Darknet District look much better than those outside. When doing this,
  also look for other ways to optimise the outdoors.

- **Final wording of the rule (David):** vestibules match their surroundings; no wording that implies loading; no loading bar. He likes the
  scan effects, and the options listed below may be experimented with.
- **NeoChinatown rework:** take the checkpoints into account from the start: place them where they allow better graphics in each area while
  making sense for security and looking right. Bring David a map of the areas and checkpoint positions before building.
- **Two kinds:** pedestrian vestibules and car vestibules (for road taxis).
- **Air cars / sky taxis are scrapped**, specifically because the game has ships: David wants players to leave the planet and experience the
  lore through other places. Remove the sky-cab stops during the NeoChinatown rework (they also exist in the Corporate District and Zen Zephyr
  Temple code: remove only the stops there). The V1 taxi map work becomes road taxis only.
- **High-speed rail:** a "maybe". Not to be built without approval; show it as an option on the area map, as a short hop within the city.

- **Map A approved (16 Nov 2026).** NeoChinatown is three quarters: The Port, Old Town, The Avenue. Checkpoints: A1 Port Customs (cheap private
  guards; walkers and taxis), A2 North Gate (cheap private guards; walkers and taxis; under a building bridging the road), A3 Function Gate
  (walkers AND taxis; to the Corporate District), A4 East Gate (cheap private guards; taxis only; to the Zen Zephyr Temple), A5 South Gate shut.
  The everyday loop (Sleeping Pod, District, alley, NULL, Milked) never crosses a checkpoint.
- **The Corporate District and the Temple are reached by ROAD taxi through the gates, 60 credits.** The Function Gate can also be walked.
- **NULL:** no vestibule yet; an open doorway built as a short passage that becomes a vestibule by adding two doors.
- **The bare placeholder far streets are closed behind shut gates** for now.
- **Rail: not now.**
- **Players in different quarters do not see each other;** messages between players still work across quarters.
- **The Function's gate guards, for now:** the Corporate District's existing silent robots, with no voice, no dialogue and no new look.
- **Checkpoints are GAMEPLAY, not loading screens, and more may be added later (David, 16 Nov 2026).** So a checkpoint is a reusable, data-driven
  thing: one definition per checkpoint (position, facing, operator [private guards / robots], lanes [pedestrian, vehicle], what it connects). A new
  one, including one INSIDE a quarter that does not change areas, is added by adding an entry. Contraband stays undecided: the scan is visual
  only and always passes.
- **Zoom renders detail (David, 16 Nov 2026):** "if a player is zooming with the camera I want detail to render". Every outdoor distance test for
  people and props now judges the distance as the zoomed picture shows it (`void-runner/zoom-detail.js`).

## Changed in build `2026-11-16-fixes-1`
- **A4 East Gate has a walkers' lane** (David, 16 Nov 2026: "the east gate checkpoint doesn't have a pedestrian vestibule"). One more entry in the gate's `lanes` (`ncz-quarters.js`); the lane, its doors, scan, PEDESTRIANS sign and collision come from it as at every other gate. It is walked to the Zen Zephyr Temple and back exactly as the Function Gate is walked to the Corporate District. The scan is still a picture only and always passes.

## Built (build `2026-11-16-quarters-1`)
- **One entry per checkpoint.** `void-runner/ncz-quarters.js` `GATES` (or `define(entry)` at run time). An entry: `id`, `code`, `name`, `sign` (the
  word on the building), `guard` (`'private'` | `'function'` | none), `rect` (the ground it stands on), `axis` (which way people travel through it),
  `ends` (what is beyond each end: a quarter, another scene, or the SAME quarter at both ends for a checkpoint inside a quarter), `lanes`
  (`foot` and/or `bay`, each with its width), and optionally `shut`, `bridge`, `fortified`, `height`. From that one entry come: the building and
  its signs (`ncz-gates.js`), a room and two doors per lane, the scanner and its beams, the guards, the collision (`solids()`), the map pin, the
  walk-through and the taxi drive-through (`ncz-gate-transit.js`, `road-taxi.js`). Tests add a checkpoint inside Old Town from one entry.
- **What a pass looks like.** You walk into the lane; in the middle the doors close; green scan lines travel the room (floor, walls, ceiling) and
  a level line rises and falls; the picture is held for a moment with the lines still crossing it while the next quarter replaces this one;
  the far door opens. No words on screen, no bar. A cab does the same in a vehicle bay behind roll shutters.
- **The scan always passes.** Nothing is searched, taken or charged.
- **Guards.** Private security: street figures in a plain dark uniform tint (PLACEHOLDER; a proper character pass comes later). They stand and
  watch; nobody speaks. The Function Gate: two of the Corporate District's existing security robots, standing still, silent.
- **Signs used:** CUSTOMS, NORTH GATE, FUNCTION GATE, EAST GATE, SOUTH GATE, CHECKPOINT, CLOSED, PEDESTRIANS, VEHICLES, SCAN, TAXI.

## Proposed by Claude, NOT approved
- Keep the player in the live vestibule while the next area loads behind closed doors (no still picture); a lamp turning red to green for
  businesses; a scan sweep tied to real progress, a guard behind glass and wall screens for checkpoints.
- Bribes as a gamble (price rises with what is carried; a chance the guard reports the player anyway); The Function's guards not bribable.
- Shielding in grades; weaker scanners at NeoChinatown, stricter at The Function's checkpoints.

## Needs David before building
- What counts as contraband, and what happens when caught.
- How The Function's guards look and sound (The Function gets no voice or treatment without his approval).
