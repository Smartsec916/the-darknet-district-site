# VOID//RUNNER Stage 1 stabilization

Review date: 2026-10-29. Implementation and full soak measurements: 2026-10-28.
Base: `8e82200498bd5115baa2e985c1ea1b6827c86d97` (includes Claude PR #110 and navigation PR #111).
Branch: `codex/void-runner-stage1-stabilization`.

Stage 1 only. No gameplay content, dialogue, approved voices, artwork, navigation redesign, authentication or payment changes. No merge or deployment. The independent audit was read in full; its preexisting untracked files were preserved separately.

## Root causes and fixes

### Resource ownership and readiness

Babylon model instantiation clones skeletons and animation groups that are not reliably destroyed when only their mesh parent is disposed. Skeleton bone textures therefore survived repeated visits. A maintenance terminal also created an unowned dynamic screen texture/material; relay screens needed an explicit room release.

`VoidAssets.ownInstance` now assigns cloned skeletons and groups to their instance owner. Container materials remain shared. Kitbash measurement clones clean up their skeletons; dressing pieces and VR companions use the same ownership rule. Crowd disposal stops controllers, removes controller references and prevents late one-shot callbacks from restarting disposed actors. Nightlife meshes no longer dispose shared template materials. VR room timers and all procedural audio nodes/timers have explicit lifetimes.

The extended soak also exposed optional model parsing restarting before scene readiness had resolved. Background parsing now begins after the first rendered frame, counts scheduled work as pending, and removes its observer on release. This preserves foreground readiness without adding reloads or extending deadlines.

| Probe | Textures | Skeletons | Result |
|---|---:|---:|---|
| Independent audit, repeated Meridian visits | 168 → 178 → 188 | 119 → 128 → 137 | Accumulation in an already exercised session |
| Fresh baseline probe on this base | 57 → 67 → 77 | 9 → 18 → 27 | Reproduced growth in three visits |
| Fixed, visits 1–10 | 56 every visit | 8 every visit | Plateau with real assets |

All ten fixed visits also held **671 meshes, 271 materials, 74 animation groups and 7 playing groups**. Three Vesper visits held 246 meshes / 70 materials / 33 textures / 0 skeletons / 0 groups. These are scene resource counts, not GPU byte measurements. See `resource-before.json`, `results.json` and `faction-browser.cjs.log`.

### Representative frame timing and crowd adaptation

The engine FPS statistic could report 60 while the application's presentation loop ran near 30. `frame-timing.js` samples the existing game loop, keeps a 90-interval rolling window with exponential smoothing, rejects long inactive gaps and warms up before adaptation. It creates no second render loop.

The crowd governor reduces its budget by four below 45 FPS and restores two above 56 FPS, no more than once every two seconds after warmup. The minimum is 40% of configured population. Decisions are ranked every 0.2 seconds; figures fade over 0.65 seconds, with nearby pedestrians retained. Hidden controllers pause their animation groups and resume when shown. Realistic models and nightlife routines remain intact.

In the full Low-quality city run, adding 55 ms of controlled rendering work produced **73.81 ms / 13.55 FPS**, reduced the budget **21 → 9**, and paused **12 controllers**. After removing the load and facing an inexpensive view, timing recovered to **16.68 ms / 59.94 FPS** and the budget gradually returned to **21**. The early normal sample was still in warmup (24.87 ms smoothed, 16.7 ms RAF median); it is not a steady-state benchmark. The audit's prior 33.4 ms median / 50.3 ms p95 describes a different scene run. No claim is made that this patch guarantees 60 FPS in busy city views.

### VR campaign boundary

Selective restoration omitted tutorial/story flags. VR now receives a detached complete campaign state plus an inert campaign-effect sink; the original campaign object remains outside simulation. Progression stamps are rejected while the boundary is active and normal campaign saves are blocked. Exit restores the original object and transient ground/weapon runtime state. The existing pre-entry save and `vrReturn` reload recovery marker remain in use. No save schema migration or reward rule changes were needed.

Full browser verification entered and exited Forest, Tropical and the suite with Seren, Kai and Nadia. Tests exercised jumping, then changed simulation credits, ammunition, equipment, reputation, mission completion, story flags and event records; original campaign data and browser storage stayed unchanged. Each exit released all tracked procedural audio nodes/timers. A further session was interrupted by reload and Continue recovered the real campaign and cleared its recovery marker. Companion models and greeting presentation were visually checked; every optional companion activity was not exhaustively exercised. Existing experiences do not publish durable VR-specific rewards; session-local settings remain session-local.

### HUD and stale tests

The ground weapon chip had `display:flex` overriding HTML `hidden`. A common `[hidden]` rule is now authoritative; the UI excludes active VR. Ground exploration shows the chip, and flight, taxi, menu, dialogue and VR hide it. The dedicated browser test checks computed display and hidden state across mode fixtures; an additional flow check boards actual flight and taxi sessions and verifies both are hidden.

Browser fixtures now use Rook's physical interaction anchor, current mission titles and partial training progress. Tracking and untracking refresh the open mission log in place, so tests explicitly close it before checking the walking tracker. The compact inventory fixture carries a pistol and expects unified controls to replace legacy buttons. Working gameplay was not changed to satisfy these assumptions. The real Vesper resource-growth regression remains and now counts skeletons and groups too.

## Verification

- **412/412 Node tests passed**, including eight new timing, budget, simulation-boundary and asset-ownership tests.
- **92/92 Python tests passed**; no backend implementation changed.
- **8/8 existing browser suites passed**: tutorial/menu/save, flight skirmish, missile threat, missions, modern world, WarFlying C, faction/resources and unified controls. Mission and faction were rerun individually after final fixture corrections; logs are included.
- Full stabilization browser passed ten Meridian visits, real slowdown/recovery, five VR configurations, interrupted-session recovery and HUD checks, with no captured game/frame/preparation errors.
- Additional flow checks passed new-campaign tutorial skip/save/Continue, L at Meridian, physical Rook dialogue, actual Kepler flight, District door collision, and a complete seeded taxi journey with one fare. Taxi simulation time was accelerated.
- HTML entry files are byte-identical. JavaScript syntax and Git whitespace checks passed.
- Added a Chromium real-asset stabilization smoke job to CI. It uses three visits and Forest VR; local acceptance uses the longer ten-visit/five-configuration test. Hosted CI results must be checked on the pull request; local Edge success does not establish Linux CI success.

Reproduce: install existing dev dependencies, run `node tests/serve-modern.cjs`, then `node tests/stabilization-browser.cjs`. On Chromium set `BROWSER_CHANNEL=chromium`; `STABILIZATION_SMOKE=1` selects the shorter CI run. Standard Node tests: `node --test tests/*.test.cjs`. Browser APIs/account services are mocked offline; no production account or save is modified.

## Screenshots and limitations

After-fix captures: [Meridian](meridian.png), [NeoChinatown](neochinatown.png), [Forest](vr-forest.png), [Tropical](vr-tropical.png), [Seren suite](vr-suite-seren.png), [Kai suite](vr-suite-kai.png), [Nadia suite](vr-suite-nadia.png), [flight](flight.png), [taxi](taxi.png). They document retained presentation; this stage adds no artwork. Before-fix resource evidence is in `resource-before.json` and the original independent audit.

Measured with headless Microsoft Edge on the available Windows integrated-GPU host at 1280×720, Low quality. **No physical ASUS ROG Ally validation** and no Firefox/Safari certification. Resource plateau is demonstrated for these repeated scenes, not a proof against every possible leak. Browser storage recovery was tested offline; cloud, payment and entitlement behavior was not changed or exercised against production. Offline service-worker caching remains a separate audit item. Existing prototype geometry and graphics quality are unchanged.

## Changed files

- `.github/workflows/tests.yml`
- `static/void-runner.html`
- `tests/faction-browser.cjs`
- `tests/mission-browser.cjs`
- `tests/modern-world-browser.cjs`
- `void-runner-sw.js`
- `void-runner.html`
- `void-runner/asset-pipeline.js`
- `void-runner/babylon-renderer.js`
- `void-runner/cache.js`
- `void-runner/crowd.js`
- `void-runner/game.js`
- `void-runner/meridian-interior-kit.js`
- `void-runner/meridian-kitbash.js`
- `void-runner/mouse-control.js`
- `void-runner/ncz-nightlife.js`
- `void-runner/play-ui.css`
- `void-runner/prologue-integration.js`
- `void-runner/relay-screens.js`
- `void-runner/vr-core.js`
- `void-runner/vr-kit.js`
- `void-runner/vr-suite.js`
- `void-runner/vr.css`
- `void-runner/frame-timing.js`
- `void-runner/simulation-effects.js`
- `tests/stabilization.test.cjs`
- `tests/stabilization-browser.cjs`

The evidence and report in this directory are additional documentation files.

## Next stage awaiting approval

Stage 2 will reuse the approved cyan homepage navigation across applicable main pages, centrally omit the current destination while preserving numbering, give Sleeping Pod exactly one styled Home control, and keep navigation out of active VOID//RUNNER gameplay. It will include desktop/mobile screenshots and link/accessibility checks in a separate reviewable change. It has not begun. Stages 3 and 4 remain unimplemented and need architectural review before editing/publishing infrastructure is chosen.
