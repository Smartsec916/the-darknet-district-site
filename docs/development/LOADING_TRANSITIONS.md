# Loading screens and transitions (28 Nov 2026)

The owner asked for loading screens to be hidden "so they aren't noticeable by the player" (27 Nov 2026, with the Vesper road request). This page lists every place the game loads something while the player is playing, what the player saw before, and what they see now. It covers presentation only: no mode, input, save, gameplay, Servo/NeoChinatown content or Low Quay file was changed.

## The shared change: the transition veil (`void-runner/transition-veil.js`)

- **Before**: when the game moved from a place the player was in to another one that had to load, it showed the "PREPARING ENVIRONMENT" card (non-silent loads, boarding a ship) over the city backdrop, or a frozen or cut frame (silent loads), then cut to the new place.
- **Now**: the last picture the player saw stays on screen, unchanged and with no card, and when the new place is ready it **crossfades** (0.55 s) into it. The picture is a copy of the game's own canvas, refreshed every three frames while the player is in a place. It is the frame from just before the load.
- **Slow loads**: after 6 s the card (its status line and **CANCEL PREPARATION**) appears over the held picture, which is dimmed. Nobody is left on a frozen frame without knowing why, and cancel stays available.
- **Failures**: a failed load ends 'preparing', so its "LOCATION UNAVAILABLE" card shows as before.
- **Never over a transition that already presents itself**: door views, the tunnels' and modules' door fades, the District vestibule, the Milked entrance, the gate walks, the planet landing sequence, the road taxi. The veil checks for their elements and stays out of their way (`OWN`).
- **From the main menu**: the card shows as before, because there is no place to hold.
- Tests: `tests/transition-veil.test.cjs` covers the decision. Browser check: re-entering Vesper from the yard held the yard's picture with no card, then crossfaded. The card appeared only after the grace time on the slow software renderer. Screenshots: `docs/development/universe-graphics/loading-veil-before.jpg` (in the yard), `loading-veil-held.jpg` (2 s into the load: the same picture, no card), `loading-veil-slow-load-card.jpg` (a slow load past the grace time: the card over the dimmed picture), `loading-veil-after.jpg` (the new place).

## Every transition

The veil keys off the game's own modes (it holds whenever a playable mode turns into 'preparing' or 'preparing-flight'), so it applies to every row marked "the veil" without touching those files. **Browser-verified** (Playwright, Chromium, software GL; the veil's own decision log `VoidTransitionVeil.log` read at each step): (1) main menu → NeoChinatown street: no hold (the card as before); (2) the District vestibule, street → interior, its own airlock scan: the veil never held at any sampled moment (every 0.5 s through the whole sequence) and the log stayed empty (`loading-veil-vestibule-scan.jpg`); (3) District interior → Vesper (non-silent): held from the first frame, released when walking began, faded to 0 (log: hold, release); (4) Vesper yard → Vesper (re-entry): held, then crossfaded. Boarding a ship was not driven (the District-first campaign has no ship, and the legacy Vesper start needs the tutorial path). The other veil rows follow the same rule, but each was not driven in the browser; where a row says "a cut" or "a card", that is what the code does (read, not filmed).

| Transition | Where | Before | Now | Notes |
|---|---|---|---|---|
| Walking into a location from another one (`enterWalking`, non-silent: hangar, Vesper, homeworld planets, mission-giver and chance-encounter walks, dev-test entries) | `babylon-integration.js` | "PREPARING ENVIRONMENT" card over the city | **Held picture, crossfade** (card only after 6 s) | the veil |
| Silent location swaps (`enterWalking` with `silent`), with no presentation of their own | `world-integration.js`, `zone-integration.js`, `pixel-neon.js`, `vr-core.js` (taking the VR headset off/on), `beginner-integration.js`, `corporate.js` | a cut, sometimes with a frozen frame | **Held picture, crossfade** | the veil |
| Boarding a ship / departure to flight (`launch`: mode 'preparing-flight') | `babylon-integration.js` | "Preparing departure." card | **Held picture, crossfade into the cockpit** (card after 6 s) | the veil |
| Docking / returning to a station hangar (`dock`) | `world-integration.js`, `flight-session-integration.js`, `homeworld-scenes.js` | card, then the hangar | **Held picture of the flight, crossfade into the hangar** | the veil |
| Doors that lead elsewhere (apartments, module rooms, the elevator) | `door-views.js`, `module-integration.js`, `apartment-integration.js` | the door opens on the place beyond, then a short black fade (0.18 s in, 0.32 s out) | unchanged: already an in-world transition (the door shows the place beyond) | `door-veil`, `mod-veil` are excluded from the veil |
| The tunnels' stair doors (up and down) | `ncz-underground-integration.js` | the door opens, then a short black fade | unchanged (in-world door) | `under-veil` excluded |
| The District vestibule (street ↔ District) | `district-transition.js` | the vestibule airlock: both doors shut, the security scan covers the view while the other side loads | unchanged: already the hidden-loading design this request asks for | `district-transition` excluded |
| Milked's entrance | `milked-transition.js` | its own entrance sequence | unchanged | `milked-transition` excluded |
| The gate walks between quarters and to the Corporate District / Temple | `ncz-gate-transit.js` | its own gate-walk presentation | unchanged | `gate-transit` excluded |
| Planet landing and take-off | `planet-landing.js` | the descent / ascent sequence | unchanged: already a cinematic that covers the load | `landing-seq` excluded |
| The road taxi between areas | `road-taxi.js` | the ride itself | unchanged (the ride is the transition) | `road-taxi-chip` excluded |
| The Vesper road: pass, long road, village, mine, facility | `vesper-terrain.js`, `vesper-sites.js` | (new) | **no loading screen**: streamed land, site models loaded and compiled kilometres ahead, the mine's cage ride hides the bottom level's load | phases 1–5, `VESPER_ROAD.md` |
| Space travel, warp, system jumps (`prepareSpace`) | `babylon-renderer.js`, `warp.js`, `docking-flight.js` | the warp / jump effects; a card only when a flight is first prepared from a walking place | from a walking place: the veil (as boarding); in flight: unchanged (the warp effect is the transition) | |
| The main menu → the first place (new game / continue / the pod wake) | `babylon-integration.js`, `world-integration.js` | the card over the city | unchanged: there is no previous picture to hold. The pod wake card is part of the Sleeping Pod (not touched) | |
| Skirmish (`skirmish-loading`) | `skirmish.js` | a dark screen while the arena loads | unchanged: a separate mode with its own screen; holding a frame there would need a skirmish change (out of scope) | follow-up |

## Not hidden, and why

- **The first load from the main menu**: there is no earlier picture to hold. The card stays.
- **Very slow loads** (over 6 s): the card comes back on purpose, for its status and its cancel button.
- **Skirmish**: its own mode and screen. Changing it would touch the skirmish code (a follow-up if the owner wants it).

## Low Quay (reviewed 28 Nov 2026, after the Low Quay batches; no game code changed)

Every way into, out of and around Low Quay was driven in the browser (Playwright, Chromium, software GL), with the veil's own log (`VoidTransitionVeil.log`) and the mode, the player's position and the veil's opacity recorded on every frame:

| Transition | What the player sees | Result |
|---|---|---|
| Arriving from space (normal play) | the planet landing sequence (`planet-landing.js` `low-quay`): the descent to the pad | unchanged: a sequence of its own (`landing-seq`) |
| Dev Tools > Jump to Low Quay or to Plug & Play, and Mission Editor draft play (today the only ways in) | the previous place's picture held with no card, then a crossfade straight into the place. The test session sets 'menu' and 'preparing' in the same frame, so the veil sees play turn into 'preparing' and holds (log: hold, release). For the Plug & Play venue the player is moved to the club door before the first frame is drawn: no frame of the landing pad was shown (every frame checked) | already hidden by the veil; nothing to change (`lowquay-veil-held.jpg`, `lowquay-veil-after.jpg`) |
| Boarding the ship at a berth (leaving) | the planet take-off sequence (lift-off from the pad, climb-out) | unchanged: a sequence of its own (`lowquay-takeoff-seq.jpg`) |
| The high-speed rail: pad ↔ city, through the security vestibule and the tunnel | the ride itself; there is no loading. The city's small detail (shopfronts, lamps, glows), switched off while the player is on the pad, comes back on as the train enters the vestibule, out of sight inside the car | unchanged: an in-world transition (`lowquay-vestibule-ride.jpg`) |
| Plug & Play's street door, the kitchen and backstage doors, the food court's stairs | the same scene: walking through a doorway. The light pool and fog follow the zone the player is in | nothing loads |

**Known gap (not changed; the owner's call):** when a Dev Tools or draft-play jump lands the player directly inside Plug & Play, the seated diners stream in a few seconds after the room is shown and appear at once. In normal play they have loaded long before the player arrives (the train ride and the walk). A fade-in was tried and rejected: the diners' PBR materials keep their highlights when made transparent, so a fading diner shows as a pale ghost, which is more noticeable than the pop. Options: load the diners' models before the room is revealed (the arrival takes a little longer, under the held picture), or leave it (it only affects developer jumps).
