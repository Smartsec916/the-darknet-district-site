# VOID//RUNNER recovery audit — 2026-10-05

## Recovered baseline

The initial local checkout was clean at `46ff89e` on `codex/void-runner-startup-and-traffic`. It was substantially older than GitHub. GitHub main was `ee59c37c4f6acfa3703dba63dc2b9a6995a6c851`, including merged PR #26 (mission/flight-skirmish), PR #25 (animation), and PR #24 (reliability). All current remote branches were fetched into `recovery/*` references. A new local branch, `codex/void-runner-recovery-audit`, starts at that main commit. The old branch remains intact. Nothing has been pushed or deployed.

No uncommitted work or attached worktree was present at the start. The configured `origin` points to an older local checkout, so recovery used the explicit GitHub URL. This package must be applied to the current merged repository, not the September build.

## Audit classifications at recovered main

| Area | Initial classification | Evidence / action |
| --- | --- | --- |
| Mission Log, acquired vs tracked missions | COMPLETE for existing missions | Existing `mission-log.js` and `world-integration.js`; preserved, browser verified. |
| Tutorial progress and untracking | COMPLETE | Explicit maneuver flags and saved tracking state; preserved. |
| Mission metadata/availability foundations | PARTIALLY COMPLETE | Added source/giver/start/end/completion metadata and prerequisite, location, story and reputation conditions. No new campaign chain. |
| Tracked navigation / offscreen guidance | COMPLETE | Existing route highlight and walking guidance retained. |
| Flight Skirmish | PRESENT BUT BROKEN | Full setup/module existed, but FPS selector still showed unavailable. Repaired selector and repeat-entry flow. |
| Shared Skirmish combat / isolation | PARTIALLY COMPLETE | Disabled Campaign enemy-hit consequences in Skirmish; connected asteroid avoidance, line of sight and shot cover. Prevented Campaign rock recycling in the arena. |
| Missile acquisition HUD | COMPLETE | Existing search/available/acquiring/lock states, dwell time, separate reticle and lock audio retained. |
| Enemy lock / missile warnings | COMPLETE | Existing separate stages retained; added offscreen lock-source direction. |
| Radar | PARTIALLY COMPLETE | Existing tactical display showed contacts without a detection model. Added range/sensitivity filtering and passive mode. |
| Signatures / Go Dark | NOT STARTED | Added shared per-flight radar, engine, weapon and electronics signature model plus a flight footer toggle. |
| Bounty/EW progression foundations | NOT STARTED | Sensor profile and contact signature interfaces now support future equipment; no bounty campaign, jammers or decoy inventory was invented. |
| Meridian exterior/menu | COMPLETE as existing procedural implementation | Preserved shared exterior and menu scene; prevented exterior service modules intersecting the expanded interior. |
| Meridian interior | PARTIALLY COMPLETE | Existing short corridor/commerce room expanded into a longer concourse with functional pressure/room doors, lounge, supplies, windows, restrooms and crew quarters. |
| Meridian NPC activity | PARTIALLY COMPLETE | Previously small sinusoidal idle movement. Added reusable activity points, reservations, paths, seats/drinks/terminals/windows and paired conversations. |
| Cockpit / warp | COMPLETE core implementation; PRESENT BUT BROKEN Sol access | Preserved shared flight runtime. Fixed walking-area gate rejecting already-unlocked free travel with incomplete training. |
| Static deployment entry page | PRESENT BUT BROKEN | Static HTML lagged behind root HTML and omitted newer runtime, Skirmish and input scripts. Synchronized both and added a consistency test. |

## Behavior in this update

- **Skirmish:** Main Menu → Skirmish → Flight → location, difficulty, enemy count, owned ship, owned compatible loadout, review/start. Existing FPS mode remains available. Campaign state and saves remain isolated from match outcomes.
- **Go Dark:** Click **GO DARK** in the flight footer. Active radar is disabled, passive range falls from 280 to 75 units, target acquisition/active missile lock is unavailable, and electronic emissions fall. Engines and weapons still produce signatures; nearby enemies can still detect and attack. Click **RADAR ON** to restore active sensors. Each new flight starts with a fresh sensor state.
- **Missions:** Track/untrack remains independent from acquisition and completion. Skipped training maneuvers stay incomplete. Free-travel permission now also permits Sol surface entry.
- **Meridian:** Use E/Interact at pressure and room doors. The doors visibly open and change collision state. Closing is refused while the player is standing in the opening. Existing Rook, outfitter, mission-terminal and boarding interactions remain.
- **Ambient crew:** Six reusable actors reserve tagged activity points, navigate around walls/counters, sit, get drinks, drink, use terminals, observe windows and converse in pairs. Partners approach separate positions, face one another, converse for a limited time and resume activities. Generic conversations have no fabricated voice lines. Probability/dwell/speed settings live in `station-activities.js`.
- **Rendering:** Static interior fittings are batched by material. Dynamic actors and doors remain separate. Existing station-space traffic, stars, asteroids and planet presentation are reused. No second rendering or simulation loop was added.

## Verification

- Initial baseline: **187/188 unit tests passed**. The failure hard-coded an obsolete pistol magazine size; its assertion now reads the actual weapon definition.
- Final: **194/194 unit tests passed**, including entrypoint consistency, sensor isolation/signatures, door collision, a 500-second deterministic NPC activity simulation, mission prerequisites and Sol access with unfinished training.
- **Seven focused browser tests passed:** Flight Skirmish, Mission Log, missile threats, Meridian menu, Campaign world/travel, recovery station/sensors, and unified input.
- Flight Skirmish regression covers 1/3/5 enemies, easy/hard, guns/missiles, asteroid cover/collision, boundary grace, victory/defeat, retries and unchanged Campaign state/save.
- Campaign regression covers opening, Rook/job, departure/docking and Meridian → Sol Belt → Earth → Sol Belt → Meridian. Older fixture assumptions were updated to supply valid tutorial progress and use current jump duration.
- Browser tests use headless Microsoft Edge on Windows with account endpoints deliberately offline. They do not certify Firefox, mobile hardware performance or production account connectivity.
- Screenshots include concourse, lounge, quarters and Go Dark. The station/sensor browser check confirms stable mesh count during a visit.

## Limits and remaining art work

The reference images guided layout, warm operational lighting, modular fittings and window placement. The new interior and crew are procedural game geometry, **not finished reference-quality models**. The visual target remains only partially met; higher-fidelity furniture, character rigs/materials and environmental art still need a dedicated art pass. No replacement of the supplied reference images or claim of photorealistic matching is made.

The supplied request file ends mid-sentence at “Do not make NPC” in section 28. This audit covers the complete requirements before that point; any missing ending has not been assumed.

This is a review build. No GitHub push, merge or deployment was performed.

## Meridian material pass
Added an authored industrial panel texture, upholstered seats, bar fittings, bedding, sanitary fixtures and contact shading. Material resources are disposed on room cleanup. All 194 unit tests passed again; recovery and Meridian menu browser suites passed after this pass. The other five browser suites passed on the preceding recovery commit. Visual inspection confirms the texture loads. Window views, detailed character assets and overall reference-level realism remain unfinished; this is a review build, not a claim of finished artwork. Texture provenance and full generation prompt are in void-runner/assets/textures/README.md.
