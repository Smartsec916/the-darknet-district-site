# VOID//RUNNER follow-up review

Prepared against current GitHub main `d28d4f03f9a717c4fa984ed0ade3e13f15b39dd9` (merged PR #6). Local game files and assets were checked against GitHub blob hashes before edits. Nothing merged or deployed.

## Root cause of double load

There was one animation loop, but it started too early: fleet.js called title() and requestAnimationFrame(loop) before cockpit and combat scripts had registered. Separately, the idle canvas drew an exterior station beneath cinematic interiors; the exterior remained visible until the CSS background loaded. That produces a change of scene without a second game instance. bootstrap.js now owns startup after registration and required image readiness. Interior drawing clears the canvas and returns instead of rendering another scene behind it. No loading overlay was added. Initial #market navigation also belongs to bootstrap now.

## Root cause of missing cockpit

The cockpit code and existing transparent artwork were intact. A persistent missing cockpit could not be reproduced with the verified current repository: the original local cockpit test passed, and production returned HTTP 200 image/png for the artwork. Confirmed failure paths were early flight before cockpit registration/image readiness and silent image failure, which previously drew only a plain bottom strip. Startup now waits for the cockpit image to load and decode. If it fails, a visible error with Retry and a console warning identifying the URL replace silent fallback. Asset URLs resolve from world.js, independent of the HTML page directory. The updated flight was visually inspected with the full frame present. The precise cause on the user's earlier local copy remains unverified.

## Meridian assets found

- void-runner/art/station.png: dedicated detailed ring-station exterior (retained, no new artwork).
- void-runner/art/sky-meridian.png: space environment.
- void-runner/art/bar-people.png: Dead Channel interior.
- void-runner/art/dock-people.png: cargo-contact interior.
- void-runner/art/cockpit-kestrel.png: existing cockpit overlay.

The station ID mapping was correct. Missing/pending station.png invoked the obsolete simple ring renderer. That fallback has been removed. Required Meridian art loads before startup; missing assets report their resolved URL. Production cockpit.js and both required image URLs returned HTTP 200; filenames match repository case. Tests cover Flask's mirrored HTML and root static hosting using the same relative URLs as GitHub Pages.

## Files changed

Game and entry points:
- void-runner.html
- static/void-runner.html
- void-runner/balance-data.js
- void-runner/bootstrap.js (new)
- void-runner/campaign.js
- void-runner/cockpit.js
- void-runner/content.js
- void-runner/expansion.js
- void-runner/fleet.js
- void-runner/game.js
- void-runner/scenes.js
- void-runner/world.js
- void_runner_api.py

Tests:
- tests/browser-smoke.cjs
- tests/campaign.test.cjs
- tests/cockpit-browser.cjs
- tests/combat-browser.cjs
- tests/followup-browser.cjs (new)
- tests/station-approach.cjs
- tests/test_void_runner_api.py

## Files removed

None. Existing art and ownership definitions remain in place.

## Legacy code removed

Removed the superseded base title/dock/bar/shop implementations, unused planar flight update and combat drawing branches, unused expansion mission update/drawing wrappers, early fleet startup, simple Meridian ring fallback, and obsolete Kepler/Rusthaven vector fallback branches. Retained the exterior renderer used by menus, Foundry's current artwork implementation, shared state/input helpers, and the active first-person cockpit/combat renderer.

## Reputation code removed

Removed the header, rewards, contract gates, dialogue, campaign data, fresh-save field, local restore requirement, and cloud-save validation/storage field. Old v1/v2 local saves tolerate and discard any legacy reputation field without losing credits, quest, missions, upgrades, loadout or ownership-related data. The cloud validator accepts saves with or without the legacy field and strips it. Mission prerequisites and opening-story progression remain. Searches found no reputation/whole-word rep matches in active game JavaScript, game HTML or backend API; remaining test mentions deliberately exercise legacy migration. Purchase ownership remains independently verified by the server.

## Dialogue changes

Rook's first offer says "Look out for raiders." His later offer says "This run might be more dangerous." Removed reputation reward text. Removed only the bar's DOCK arrow; NYX and ROOK interaction buttons and flight docking remain.

## Raider timing change

firstRaiderDelay defaults to 10 seconds in balance-data.js, with a 0–60 second developer range. Launch initializes the encounter countdown from that setting. Active simulation time decrements it; pause freezes it. Subsequent spawn cadence remains unchanged. Existing shared configurations missing this new key receive the default through balance validation.

## Shop changes

The public catalog contains exactly one Standard placeholder and one Exclusive placeholder, with no prices, stats, buy buttons or purchase actions. Existing owners can still equip/unequip restored items in a separate existing-equipment section. Equipment definitions, stat application, account authentication, payment/refund handling, and purchase restoration remain intact for later catalog work. The #market entry opens this same placeholder shop.

## Tests performed

- 17 Node unit tests passed: campaign progression, legacy saves, ownership gating, equipment effects, cockpit math, missiles, lock and balance validation.
- 14 Python API tests passed: cloud saves with/without reputation, inventory boundaries, payment/refund safeguards, developer authorization and configuration validation.
- Five browser suites passed: browser-smoke, cockpit-browser, combat-browser, station-approach and followup-browser.
- New browser checks cover delayed cockpit script/image loading, one startup, no station drawn behind opening, physical cockpit image rendering, correct Meridian texture, failed-image warning/error/retry, ten-second first spawn, pause, bar controls, both Rook lines, two non-purchasable placeholders and mobile width.
- Existing browser checks cover New Journey signed in/out, reload, cloud load, lasers, hostile projectiles, shield/hull damage feedback, missile ownership/lock/fire/impact, developer save/sign-out, directional views, all station destinations, mission mechanics and account restoration.
- Tested both local Flask service (5000) and static hosting (5002). Game scripts/assets returned successfully under static hosting. API absence on the static-only test server is expected and handled by the game.
- Checked production entry HTML and required artwork URLs via HTTP. Full remote browser navigation timed out in the test environment; new changes have not been deployed for live testing.
- JavaScript syntax and whitespace checks passed. Reviewed screenshots of the cockpit/Meridian approach and placeholder shop.

## Known issues

- Persistent missing artwork on the user's earlier local copy was not reproduced; partial extracted update packages, stale files or local hosting differences cannot be confirmed from the available evidence.
- Render is still awaiting restoration. Real Firebase/cloud/developer access requires a deployment and live verification afterward; account/API browser tests use mocks.
- Deploy the updated backend validator with this frontend before relying on cloud saves: the old validator requires reputation, whereas new saves omit it.
- The new ZIP is an update package, not a standalone game. Extract its contents into the existing repository root, preserving directories. Keep all existing art and other source files. Review before merging/deploying.

## Art assets still needed

None for these fixes. The existing earlier limitation remains: real eight-direction enemy artwork is not supplied (24 images across raider, interceptor and gunship). The retained directional renderer uses the existing atlas until those assets exist. Foundry's existing procedural exterior remains unchanged.
