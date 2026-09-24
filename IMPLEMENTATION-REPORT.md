# VOID//RUNNER implementation report

Implemented in the existing game's scripts and Flask save API. This is a tested modernization foundation, with procedural art placeholders; it is not a claim that final production artwork, voice generation, or live deployment is complete.

## Source and delivery

- Authoritative source: [Smartsec916/the-darknet-district-site](https://github.com/Smartsec916/the-darknet-district-site), snapshot `8722cb01d87941cee932945200e8d9d39885f4e1`.
- The available Git installation lacked its HTTPS transport. Source was retrieved through GitHub's tree/raw interfaces. Local import commits are not upstream history. Every existing file in this update was verified against its upstream Git blob before generating the patch.
- The live entry HTML and sampled `bootstrap.js`, `babylon-integration.js`, `babylon-renderer.js`, `warp.js`, and `traffic.js` matched this snapshot byte for byte. No deployment discrepancy was found in these samples. This does not establish parity of every asset or backend service.
- The live browser reached the existing menu and displayed **LOCAL PLAY READY / NETWORK SERVICES OFFLINE**. Live gameplay and authenticated backend transactions were not exercised.
- The update ZIP contains 34 changed/new files at their existing repository paths. It is an overlay for the existing repository, not a standalone game or a complete website archive. No unrelated site files are included. Nothing was pushed or deployed.

## Root causes and fixes

| Finding | Implemented response |
| --- | --- |
| Stored settings and URL flags could select the legacy renderer; modern failure paths could call legacy drawing. | Babylon is authoritative. Failed preparation produces explicit recovery instead of silently changing renderers. |
| The starter cockpit painted a legacy bitmap even during modern flight. Startup and departure required legacy imagery. | Removed that cockpit draw branch and mandatory image waits. Procedural modern cockpit remains available without those assets. |
| Destination preparation combined critical scene work with decorative assets, while simulation paused. | Added bounded preparation, per-asset failure handling, cancellation cleanup, serialized transitions, retry/return controls, and late-result disposal. |
| Neutral traffic could be empty and was suppressed by future encounter state. | Populated traffic pools, closer independent routes, and peaceful-flight replenishment. Actual combat still suppresses ambient traffic. |
| Sol travel used a separate prototype menu/transit flow. | Unified route/location state and in-world markers. Local warp is 12 seconds; interstellar warp is 24 seconds and cannot enable interdiction, including after restore. |
| A generic station room did not correspond to the station exterior. | Shared shell/collider layout for hangar, corridor, windows and concourse, with physical boarding and doors. |

## Systems and major files

- `universe.js`, `mission-log.js`, `world-integration.js`: extensible systems/locations, visited/discovered state, Rook progression unlock, F1 tracking, hierarchical guidance, Erebus–Sol travel, Earth/Admin objective, station interaction and save resume.
- `station-layouts.js`, `babylon-renderer.js`: shared compact station geometry, ISS-inspired trusses, solar arrays, radiators, tanks, antennas, window traffic, NPC placement, physical player ship, ambient crew and service areas.
- `campaign.js`, `hangar.js`, `story-content.js`: preserve opening missions, character dialogue, rewards and unlocks while connecting the larger world. Detours retain cargo contracts and only pay at the actual delivery destination.
- `preparation.js`, `asset-pipeline.js`, `bootstrap.js`, `babylon-integration.js`, `game.js`: startup/transition ownership, asset failure isolation, explicit recovery and continued frame scheduling after recoverable errors.
- `traffic.js`, `warp.js`, `flight-presentation.js`, `cockpit.js`: visible independent traffic, route rules, departure and modern flight presentation.
- `voice-provider.js`, `ship-audio.js`: optional bounded same-origin generated-clip provider, stable character keys, cache, cancellation, positional playback and watchdog. Existing browser voices remain the default.
- `void_runner_api.py`, `save-manifest.json`: validate and preserve universe/tracking fields. Existing ownership and premium entitlement checks remain enforced.
- Both `void-runner.html` and `static/void-runner.html` load the same integration. New stylesheet: `modern.css`.

## Legacy and assets

Active renderer selection, automatic legacy fallback, required legacy departure/startup imagery, and disconnected Sol menu/transit paths were disabled or removed. Legacy source/art remains in the repository where inactive code or archived screens still reference it; those files were not indiscriminately deleted. The main simulation retains its existing animation-loop owner.

New visual assets are code-generated geometry/materials: station structure and interiors, ship variants, named character silhouettes, ambient crew, props and signs. Mara, Elias, Rook, Iona, Sol and Nyx use distinguishing colors/hair/accessories based on the existing character reference. Existing dialogue and roles remain connected to those identities.

**Remaining placeholders:** characters are primitive articulated figures, not finished rigged likenesses; ships and stations are procedural models; Earth/Mars use compact blockouts; ambient animation and shop presentation are basic. This update does not deliver production-quality character animation, detailed city environments, final PBR art, or a complete cinematic asset pass. The GLB pipeline supports optional ship/character replacements; imported station art needs additional integration with the shared shell/door/collision contract.

No external asset service or paid API is required for current local gameplay. Final art still requires authored/licensed self-contained GLBs and quality review. Existing Babylon 8.26.0 vendor files and their license stay in the host repository and are not duplicated in this overlay.

Generated natural voices require a separately implemented same-origin server endpoint returning audio for `{character,text,voice,version}` and server-held credentials. `VoidVoiceProvider.create({endpoint})` supplies the client provider; register it with the existing audio provider hook. No generated-voice backend, credentials or billing configuration was added. Browser voices vary by device and are not represented as equivalent to finished voice acting.

## Validation

- **57/57 JavaScript unit tests passed**, including campaign, combat, equipment/ownership, migration, route rules, mission guidance, corridor traversal, traffic and preparation deadlines.
- **20/20 Python tests passed**: 15 API tests and five story/save tests, using the repository-compatible Stripe dependency range.
- **Three new browser suites passed**: opening UI/Mara dialogue and four original opening legs; Rook interaction/job acceptance, boarding/departure/docking, F1 and Erebus–Sol–Earth–Erebus; local interdiction, interstellar exclusion, missing optional GLB, forced scene timeout, retry, cancellation and repeated visits.
- Browser opening tests use deterministic arrival checkpoints rather than manually piloting every combat encounter. Real time-stepped warp/departure behavior is covered separately. Backend outage and failed-art responses are deliberately injected in the browser tests.
- Four repeated station visits each measured **807 meshes / 7 textures / 4 lights**, with no accumulating scene resources in that sample. This is not an FPS benchmark or proof against all leaks; the mesh count still warrants instancing/merging and a low-end-device performance pass.
- JavaScript parsing checked, entrypoint copies matched, and patch checked against verified source. Older browser suites that assume removed UI/renderer paths were not all rerun or rewritten.

## Applying and remaining manual work

Use the patch on a checkout matching the source snapshot, or copy the overlay files into that checkout. With Git, run `git apply --check VOID-RUNNER.patch` before `git apply VOID-RUNNER.patch`. Review conflicts if upstream has moved. Keep existing vendor, art, server configuration and unrelated website files.

The project retains its existing static/Flask deployment structure and has no new bundling step. Deploy the root/static entrypoints, affected game files and save API together through the site's existing process. Deployment was not performed here.

Before a production rollout: review the visible procedural art, exercise the full campaign manually, validate keyboard/mouse/touch and low-end GPU behavior, verify real account/cloud-save/checkout integrations in the site's configured environment, finish asset/voice production as desired, and smoke-test CDN/cache behavior after deployment. Those checks and production-art work remain outstanding.

Tests added: `tests/modern-world.test.cjs`, `tests/modern-world-browser.cjs`, `tests/modern-recovery-browser.cjs`, and `tests/modern-opening-browser.cjs`. Browser tests default to the local static test server on port 5187 and require Playwright with Edge. Existing API tests require the project's Python dependencies.
