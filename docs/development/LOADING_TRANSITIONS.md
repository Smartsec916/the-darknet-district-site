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

## Low Quay (follow-ups; PR #627 is open on its files, so they were not touched)

- The Low Quay arrival and its scenes (`low-quay.js`, `low-quay-city.js`, `low-quay-club.js`): any non-silent `enterWalking` into them already benefits from the shared veil without touching their files. Transitions they present themselves (their own fades, the club entrance) are follow-ups to review after #627 merges.
