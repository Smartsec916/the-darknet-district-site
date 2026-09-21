# VOID//RUNNER flight overhaul

The follow-up implementation is documented in [VOID-RUNNER-NEXT-UPDATE.md](VOID-RUNNER-NEXT-UPDATE.md). Its network, ownership and travel rules supersede the original overhaul behavior below. Spectre now requires a verified $1.00 USD account purchase.

Base: `97191403d90603204479578736680c63828914ae` (GitHub main inspected September 21, 2026).
Branch: `codex/void-runner-flight-overhaul`. Local implementation; no production deployment or remote push.

## Ships and tuning

`void-runner/ships.js` is the single source for hulls, prices, base equipment, flight, missile multipliers, cockpit selection and audio profiles. Standard equipment derives its numeric values from these definitions. Existing global developer balance values and earned upgrades still apply; verified premium equipment retains its separate stat checks.

| Base specification | Kestrel / 01 | Peregrine / 02 | Spectre / 03 |
|---|---:|---:|---:|
| Purchase price | Starter | 1,000 CR | $1.00 USD, verified purchase |
| Hull | 100 | 135 | 170 |
| Shields | 0 | 30 | 55 |
| Shield recharge / second | 6* | 8 | 10 |
| Recharge delay / seconds | 6 | 5 | 4.5 |
| Maximum speed | 24 | 29 | 35 |
| Forward acceleration | 10 | 15 | 21 |
| Braking strength | 15 | 22 | 30 |
| Pitch / yaw rate | 0.9 / 1.1 | 1.15 / 1.4 | 1.4 / 1.7 |
| Laser damage multiplier | 1 | 1.35 | 1.7 |
| Laser fire-rate multiplier | 1 | 1.12 | 1.25 |
| Missile capacity, after installation | 6 | 10 | 14 |
| Missile damage multiplier | 1 | 1.2 | 1.45 |
| Missile lock-time multiplier | 1 | 0.82 | 0.65 |

*The starter preserves the existing unshielded opening; shield upgrades enable its recharge. Prices, names and all numeric values are provisional. Weapon and shield swaps can intentionally change these base specifications.

## Active flight and controls

The actual first-person `cockpit.js` update loop calls `pilot-flight.js`. It integrates angular acceleration, angular damping, bounded pitch/roll, forward acceleration/braking and a persistent 3D velocity. Lateral velocity decays gradually as the nose turns. Internal steps are at most 1/120 second; 30 Hz and 144 Hz results are compared in tests. Engine upgrades continue to affect handling.

WASD/arrows, mouse steering, Space/click firing, Q/R roll, Shift/X throttle, E/Drive, pause, touch steering/fire and throttle buttons remain. The existing throttle range is 30–140%; maximum configured speed is reached at 140%. There is no new strafe/reverse control. Drive and shield timers continue during alignment and warp as well as encounters.

## Enemy pilots

`enemy-pilots.js` owns rookie, trained and elite tuning: reaction delay, aim accuracy, lead prediction, turn rate, throttle, engagement range, evasion, missile avoidance, firing cone and lock time. Opening deliveries use rookies; open-campaign tiers select trained/elite pilots. Existing enemy class hull/damage values remain separate.

States are attack, pass, reposition, evade and retreat. Stable pilot variants flank or approach directly. Threatened pilots break missile locks, evade incoming fire, and reposition; critically damaged pilots disengage then return. Heading changes have a turn limit. Distant pilots turn back toward engagement. Heavy ships can acquire and launch missiles using the existing missile steering/collision code. Small HUD warnings and rate-limited tones distinguish acquisition from an incoming missile.

## Hangar, store and ownership

The full Hangar is accessible from station docks, the common navigation menu and the Vesper opening. All four existing station hubs are covered; no unrelated locations were invented. It displays owned/locked hulls, base stats, active ship and weapon/shield/utility/missile slots. Ship purchases never switch automatically and never discard another hull.

Campaign fields: `ownedShips`, `activeShip`, `standardGear`, `shipLoadouts`, plus the original `loadout` and `creditGear`. Switching saves the outgoing loadout and restores the selected hull's loadout. Ownership never comes from loadout contents. Standard equipment uses compatible slot types on all three ships. Launcher ownership is separate from ammo and equip state. The inherited pulse/deflector systems are the fallback when optional equipment is unequipped.

Existing `ownedGear` from the account service is still required for Wraith/Aegis/Ghost/Sentinel effects. Neither campaign ship ownership nor new cloud fields grants premium ownership. Existing store/account flows remain. The previously empty standard catalog now exposes ships, existing credit upgrades/utilities and the earned launcher; the future exclusive catalog placeholder remains.

## Missile progression and HUD

`C.complete` counts successful routes containing enemies, not peaceful returns, failed attempts, or training. The second successful combat route unlocks Rook's installation voucher. Rook's dialogue is appended to the delivery dialogue and marked seen before saving; older eligible campaigns receive it at the next dock. Installation is free, explicit, and performed at any station outfitter. Ammo refills on departure only if the launcher is owned and equipped.

The existing `VoidTargeting` lock remains authoritative. A tracked enemy box shows detection, acquisition percentage and `MISSILE LOCK`; the central ring still shows the lock area and progress. Right-click and the existing mobile missile button fire. Ship tuning scales the existing missile damage, lock time, cooldown and capacity.

## Warp and saves

`warp.js` models `align → warp → encounter → align → warp → arrived`. Flight controls must bring the nose within eight degrees of the destination for 0.65 seconds. Six seconds of normalized warp travel is split by an encounter at 42% for hostile/mission routes. Cyan/violet streaks, a destination marker and short audio cues accompany the phases. Reduced-motion mode softens the effect.

The route records origin, destination, mission identity, normalized progress and an encounter `{type,state}`. Future encounter handlers can use new types without replacing the route state machine. Current encounters use the existing enemies and mission objectives, including salvage, escort, generators and hazards. Arrival cannot finish until required objectives clear. Free station travel is available after the opening campaign when no contract is loaded.

Save checkpoints occur on phase transitions. Reloading mid-warp returns to alignment at the last checkpoint; reloading an active encounter restarts that encounter with a repaired ship. Cleared encounters stay cleared. Arrival clears the route and pays through the original completion function. This is checkpoint persistence, not serialization of every projectile/enemy/physics frame.

The existing save key and version 2 remain compatible, with additive fields. Version 1 and pre-overhaul version 2 saves receive the starter, base standard gear, empty per-ship history and validated route defaults. Old completed-delivery counts approximate historical combat progression (maximum two) because older saves lack a combat counter. Saved loadouts never imply ownership. Malformed route checkpoints are discarded safely. `void_runner_api.py` explicitly validates the new campaign fields; payment, authentication, balance authorization and inventory verification paths are unchanged. Deploy client and validator together when ready.

## Audio and voices

`ship-audio.js` uses two reusable engine oscillators plus short disposable effect nodes. Ship profiles vary waveform, frequency and mechanical roughness; firing, impacts, locks, warnings and warp have procedural sounds. No external audio assets or paid services are used. Engine/effect volume ducks during NPC speech and engines fade when not flying. Web Audio waits for a user gesture, and unavailable APIs fail gracefully.

Central NPC profiles set stable pitch, rate, volume and voice selection variants. Available English/local voices are selected by traits rather than hardcoded OS voice names. Every new line cancels prior speech; leaving dialogue cancels it too. Errors/timeouts release audio ducking, never block dialogue or gameplay. Voices default off. Master, effects, voice volume, voice enable and overall audio enable persist under `void-runner-audio-v1`, independently of campaign/account saves.

## Files

New runtime modules: `ships.js`, `pilot-flight.js`, `enemy-pilots.js`, `warp.js`, `ship-audio.js`, `hangar.js`, `hangar.css`, `flight-presentation.js` under `void-runner/`.

Modified runtime: `void-runner/campaign.js`, `cockpit.js`, `combat.js`, `content.js`, `expansion.js`, `game.js`, `scenes.js`; root and static `void-runner.html`; `void_runner_api.py` for cloud validation only.

New tests: `tests/overhaul.test.cjs`, `tests/overhaul-browser.cjs`, `tests/piloted-browser.cjs`. Updated existing `browser-smoke.cjs`, `cockpit-browser.cjs`, `combat-browser.cjs`, `followup-browser.cjs`, `test_void_runner_api.py` for explicit encounter fixtures, the populated store and additive save fields. This document is new. No unrelated District pages are changed.

## Validation and remaining review

- 27 Node unit tests pass (`node --test tests/*.test.cjs`).
- 15 Python API tests pass (`python -m unittest discover -s tests -p 'test_*.py'`), including payment trust boundaries, save conflicts and new ship/route sanitization.
- All eight browser scripts pass on Chromium/Edge: startup-speed, cockpit-browser, combat-browser, browser-smoke, station-approach, followup-browser, overhaul-browser, piloted-browser.
- Browser integration covers the requested opening progression, one-time Rook offer, installation, tracked lock/fire/impact, enemy warning/launch, warp interruption/resume/arrival, both ship purchases, per-hull switching, reload, audio settings and desktop/390px touch layouts. These suites report no page JavaScript exceptions. Offline account/network responses are intentional fixtures.
- The long progression integration uses explicit encounter-clear fixtures for speed. A separate input-driven pilot completes all four opening flights, including both actual dogfights, using normal steering and laser damage with no health, kill or route-progress shortcuts. It is a regression pilot, not a human difficulty assessment. Real held-key input and touch events are also tested.
- Manual in-app browser spot-checks covered the opening, starter cockpit, sound toggle and visual alignment UI. Desktop/mobile screenshots were visually reviewed. The full 32-step sequence was automated rather than manually flown end-to-end; audible sound/voice quality and subjective handling still need human playtesting.
- Kestrel retains existing artwork. Peregrine and Spectre use deliberately distinct procedural canvas canopies/instrumentation; replace these in `flight-presentation.js` when final art is ready. Audio is procedural by design. Device speech voices vary; no specific actor/voice is guaranteed.
- All prices, pilot difficulty, engine response and missile multipliers remain provisional. No real sign-in, purchase, account write or production deployment was performed during testing.

For browser tests, serve the repository at `127.0.0.1:5000`; followup-browser also expects the Flask app at port 5002. Install the repository Python requirements and provide Playwright/Chromium or set `BROWSER_CHANNEL=msedge`. The packaged patch applies to the stated upstream commit; run the same suites after integrating with newer upstream changes.
