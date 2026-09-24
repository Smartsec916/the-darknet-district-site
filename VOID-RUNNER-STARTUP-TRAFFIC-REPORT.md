# VOID//RUNNER — startup, station flow and ambient traffic

Built from the current working build, commit `76aeaa1`, preserving the earlier Babylon foundation and loading/menu/voice fixes. Working branch: `codex/void-runner-startup-and-traffic`. No push, merge or deployment was performed.

1. **Confirmed startup cause in this build:** the old `boundedPrepare` imposed one 30-second timeout on the engine download, exterior/model/scene preparation and departure artwork combined. `Promise.race` rejected without cancelling the underlying work. A clean browser with a deliberately delayed 32-second engine download displayed `Environment preparation timed out.` at 30 seconds, with Babylon still selected and the engine not yet ready. Four seconds later, retry launched successfully. This reproduces the reported failure-then-success sequence. The earlier screenshots contain no captured exception/timing trace, so the exact historical browser session cannot be proved retroactively.

2. **Readiness fix:** `preparation.js` now applies separate bounded waits: module download 90 seconds, asset batches 60 seconds, scene readiness 30 seconds, and departure artwork 45 seconds, within an overall 180-second ceiling. The loading screen identifies the active phase. Real load errors fail promptly; unresolved operations time out. Aborted initialization cannot subsequently create an engine; late model results are disposed rather than attached. Partial engine construction is disposed/reset on exception. Failure diagnostics include the reason/error, selected and active renderer, engine/scene readiness, phase, asset and elapsed milliseconds. Preparation failure is described as such rather than calling every artwork failure a broken graphics engine.

3. **Classification:** the reproduced failure is timing plus cold module loading and uncancelled asynchronous work. No evidence implicated localStorage or settings order: renderer preferences are read synchronously. The existing single game loop remains authoritative; no second Babylon render loop was added. An unnecessary eager legacy WebGL context is now initialized only when legacy flight is drawn. This cleanup is not claimed as the cause of the reproduced timeout.

4. **Modified files:** see the exact repository-relative manifest below. The two HTML entry points remain identical. No canonical artwork, vendor engine version, weapons balance or mission content was replaced.

5. **Fallback and preferences:** Babylon is the default when no valid saved selection exists. Saved Babylon and legacy choices are respected. Genuine/simulated module failure or timeout still offers Retry and Use Original Renderer. Displaying the prompt does not write a legacy preference; only choosing the fallback does. Both directions of renderer switching and subsequent reloads were tested.

6. **Station labels:** the arrival action is now **EXIT TO SPACE STATION →**; the delivery-dialogue action is **GO BACK TO YOUR SHIP →**. Their existing navigation, artwork and layout are retained.

7. **Obsolete promotion removed:** deleted `firstDeliveryOffer`, its docking interception, and `loginOfferSeen` serialization in the client and server. Old saves containing the extra field remain accepted and normalize without it. Delivery now returns directly to the existing ship/station flow. Main Menu account controls, guest play, local/cloud saving and the upgrade shop remain.

8. **Station location correction:** the origin station starts behind the ship and its relative position subtracts player displacement, so it remains at its location as the player moves or turns. Destination station visibility requires the destination scene plus the existing late-warp reveal threshold. It is hidden during early warp and interdiction. The previous unconditional positive-Z placement ahead of the cockpit is removed.

9. **Departure and waypoint timing:** the exterior, asteroids and departure artwork are ready before flight begins. The existing two-active-second marker delay and fade are retained, including reset after combat and pause behavior. No new arrival shortcut was introduced.

10. **Ambient traffic:** a separate lightweight `VoidTraffic` collection replaces the two unconditional example ships. Half of eligible peaceful areas are empty; populated areas contain at most three neutral contacts. Role definitions configure the current courier/transport models, speed, lifetime, distance, altitude and marker policy. No new mission types or random friendly ships were added.

11. **Independent movement and departure:** contacts enter at varied times and distances, cross in either direction with vertical/diagonal variation, and keep inertial velocities independent of the player. Player displacement is subtracted for rendering; contacts do not steer toward or follow the player. At the end of their visit they accelerate, stretch, show a Babylon warp wake and fade before removal. They are actual Babylon ship transforms/meshes, with per-contact nodes disposed and shared materials reused. No HTML ship objects or extra animation timers are used.

12. **Relationships:** current contacts use explicit `relationship: hostile | neutral | friendly`. `VoidStory.relationship` reads that state and accepts old scripted `allegiance` as a compatibility fallback. Enemy spawning, mission escort state, story contacts, targeting and missiles agree on relationship semantics. Ambient contacts are separate from enemy targeting/collision/reward lists.

13. **Markers:** centralized relationship colors map hostile to red, neutral to grey, friendly to green. Civilians have restrained contact brackets, no objective arrows or health bars, and no marker in the central aiming box. Existing mission escorts retain their single green escort marker.

14. **Combat separation:** routes with enemies, training, or pending hostile story encounters do not generate ambient traffic. Area changes through warp clear civilians before enemy encounters; active combat suppresses them. Deliberately scripted friendly contacts and existing escorts remain distinct from random traffic.

15. **Cleanup:** removed the fixed courier/security spawn, old traffic movement loop, obsolete promotion screen/state, unconditional forward station placement and eager legacy WebGL initialization. Existing mission/renderer code still needed for compatibility remains. Docking/arrival releases space objects and traffic; timeout/cancel paths release abandoned preparations. No new periodic traffic timers or event listeners survive transitions.

16. **Verification:** 52 JavaScript unit tests, 23 Python tests, and 22 browser suites passed. Coverage includes clean 32-second cold start; real Mara dialogue and initial flight; arrival/delivery labels; absence of promotion; returning save credits/hull/upgrades; renderer preference reloads and switching; HTTP failure and hung-download fallback; no late activation after timeout; both static and Flask entry points; four piloted opening routes; missiles/combat; account/login/cloud-save fixtures; production-origin HTTPS/CORS fixtures; legacy flight; walking/Sol; and traffic lifecycle/rendering. Repeated traffic cycles returned to **439 meshes / 5 textures**, with zero contacts left; docking cleared space meshes. Startup with an unrelated image blocked was about **333 ms** locally. The existing original-renderer suites now select legacy explicitly; tests of primary Babylon await its asynchronous readiness and use the requested new button labels. Two initial parallel fixture startup failures passed when rerun independently; no production behavior was removed to satisfy them. Screenshots were inspected.

17. **Remaining limits:** automated browsers here use Edge/Chromium; the exact prior Firefox/device session and physical-phone performance were not reproduced. Deadlines are bounded policy, not proof of device incompatibility—a sufficiently stalled connection can still offer manual fallback. Ambient routes are intentionally simple crossings, not a full navigation/economy simulation. Current model blockouts, cockpit composition, voice-device limitations and external account-host availability are unchanged. No live payment or user-account operation was performed.

## Applying this update

Use the update ZIP **or** binary patch on a branch based on the latest loading/Launch fixes (`76aeaa1`) or its deployed equivalent. The ZIP contains changed/new files only, with repository paths; extract and copy those files without flattening folders. The local branch already contains the complete working repository. Include both HTML entry points and the new `preparation.js` and `traffic.js` modules. The server normalization change is backward compatible; no database migration is needed.

## File manifest

- `VOID-RUNNER-BABYLON.md`
- `VOID-RUNNER-STARTUP-TRAFFIC-REPORT.md`
- `static/void-runner.html`
- `tests/babylon-browser.cjs`
- `tests/browser-smoke.cjs`
- `tests/cockpit-browser.cjs`
- `tests/combat-browser.cjs`
- `tests/entrypoints-browser.cjs`
- `tests/followup-browser.cjs`
- `tests/hangar-hud-browser.cjs`
- `tests/menu-browser.cjs`
- `tests/overhaul-browser.cjs`
- `tests/piloted-browser.cjs`
- `tests/production-browser.cjs`
- `tests/startup-traffic-browser.cjs`
- `tests/station-approach.cjs`
- `tests/test_void_runner_api.py`
- `tests/traffic-render-browser.cjs`
- `tests/traffic-startup.test.cjs`
- `tests/travel-browser.cjs`
- `void-runner.html`
- `void-runner/asset-pipeline.js`
- `void-runner/babylon-integration.js`
- `void-runner/babylon-renderer.js`
- `void-runner/campaign.js`
- `void-runner/cockpit.js`
- `void-runner/escort.js`
- `void-runner/expansion.js`
- `void-runner/game.js`
- `void-runner/missiles.js`
- `void-runner/preparation.js`
- `void-runner/scenes.js`
- `void-runner/story-scenes.js`
- `void-runner/story.js`
- `void-runner/targeting.js`
- `void-runner/traffic.js`
- `void_runner_api.py`
