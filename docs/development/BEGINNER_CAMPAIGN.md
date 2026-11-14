# Beginner campaign: Sleeping Pod to first ship and first departure

**Status: PROPOSED (David has not approved the story content).** The mechanics (ship award, arrival, travel) are fixes and are in force. The mission and dialogue wording in `void-runner/beginner.js` is UNREVIEWED placeholder text in the established voices of Admin and Iris, shown as text with no new voice clips, and uses no new character, place, mechanic or lore. Record David's decision in `VOID_RUNNER_HANDOFF.md` §11 before treating any of it as canon.

## What stopped a new player from getting a ship (found by playing the real game, 14 Nov 2026)
A new District campaign has `story.flags.shipAccess='none'`, `missionPool='closed'`, `quest='inheritance'` and `universe.freeTravel=false`. Nothing ever changed those, and four separate gates sat behind them:
1. **No ship**: `shipAccess 'none'` hides the pad ship and the BOARD interaction (`Campaign.grantShip` existed but nothing called it).
2. **Old Vesper opening gate**: boarding (`prologue-integration.js` `leaveWalking`) demanded finished ground training on Vesper and, while `quest==='inheritance'`, Mara's handoff. Neither exists in a District campaign.
3. **No travel**: destinations are chosen only when `universe.freeTravel` is true (`Campaign.chooseDestination`, `world-integration.js` leaveWalking).
4. **No arrival**: `Campaign.complete` returned `null` for every flight while the mission pool was closed, so a launched ship flew to the destination and stayed there forever ("arrived", no docking). Verified in the real game with a granted ship: align, jump and approach all worked and the ship never docked.

5. **BOARD moved into a building**: `world-integration.js` `enterWalking` rewrote the BOARD interaction of every non-station place to the hangar default `[-2,1.7,-25]`. On the NeoChinatown street that is inside a city block, so the pad's BOARD prompt could never be reached after any normal street entry (found by the reload leg of the playthrough test). The street keeps its own pad position now.

## Fixes (Milestone A)
- `Campaign.awardStarterShip(state)`: grants the starter ship, sets `quest='open'`, `universe.freeTravel=true` (places discovered), idempotent via `story.flags.starterShipAwarded`. The mission pool stays closed, so no archived mission returns.
- `progression.groundDone`: true in a closed-pool campaign (no Vesper lessons exist there).
- `Campaign.complete`: a free transit may be completed (arrival, docking) by a ship owner in a closed-pool campaign.
- `world-integration.js`: the street's BOARD interaction stays at Pad 01.
- Admin shortcut: Developer Tools > Test & Jump To > "NeoChinatown · new District campaign with a TEST SHIP". Server-confirmed developers only (re-checked before each test), a throwaway session that is never saved (not to the browser, not to the cloud), flagged `testShip` so the beginner missions do not start, removable by deleting one stage entry in `dev-test.js`. It changes no server state.

## The six missions (Milestone B)
Records and dialogue are data in `beginner.js` (the Developer Studio edits the same structure). Progress is ordinary mission records plus `story.flags.br_<mission>` (reward paid once); the cloud save validator accepts them unchanged (ids are lowercase-hyphen; `trackedMission` is length-checked only). No API or manifest change.
1. **FIRST CONTACT** (Admin): open the V1 (L), check the KeyMap (K), speak with Admin.
2. **DISTRICT ERRAND** (Iris): visit the bar and the shop, report to Iris. 100 credits.
3. **A JOB WORTH TAKING** (Iris): collect a sealed parcel, deliver it to the Landing Terminal on the street, bring the receipt back. 250 credits.
4. **THE SHIP OPPORTUNITY** (Admin): ask Admin about transport, get pad clearance from Iris. Free.
5. **YOUR FIRST SHIP** (Admin): register the courier hull at the Landing Terminal (the ship is awarded here and appears on Pad 01), board it at Pad 01.
6. **FIRST DEPARTURE** (Admin): clear the pad, line up on the MERIDIAN marker and jump, dock at Meridian Station. 200 credits. The first trip to Meridian is interstellar and has no raiders (`Universe.route`); the local Tessaly routes (Sol Belt, Mars) are interdicted.

All of it works through the V1 Mission Log (objective, steps, progress, reward, location, waypoint, completion; the next mission starts and is tracked automatically). The V1 card now shows the current objective, a step checklist and the reward.

## Tests
`tests/beginner.test.cjs` (rules: order, gating, rewards once, reload, ship award), `tests/beginner-browser.cjs` (the whole campaign from a fresh save in the real game: E-key interactions, the V1, reload persistence, boarding, real flight and docking at Meridian; very slow under a software renderer), `tests/studio-model.test.cjs`, `tests/studio-browser.cjs`.
