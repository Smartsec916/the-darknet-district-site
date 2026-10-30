# October 29, 2026 — integration and deployment report

## Live deployment
User authorized deploying safe completed work separately, excluding all new models and disabled private draft storage. Release PR #117 merged as 462db78e0077fcbb5d33f35918d69a09f5eb1571. It includes stabilization #112, navigation #113 and storefront #116. The later requested Arcade/Resources/About framing, equal Resources cards and centered Sleeping Pod Home merged through #118 as 60b459b62b4f1ab3a8f54af857a306aa76e9a500. GitHub Pages reports that exact commit built successfully from main/root.

Stage 3A #114 and Stage 3B #115 remain unmerged and absent from production. No private draft configuration, publisher grant, cloud rule, billing service, new model or dialogue was activated. The storefront source PR #116 is included through release #117; its feature branch is retained for review.

## Verified live
- All six navigation destinations and generated root/static headers; desktop/mobile widths, keyboard focus, touch, reduced motion, no-JavaScript links, Sleeping Pod controls and fullscreen game/actual flight.
- Seven store pages, actual Shopify product frames and unchanged displayed prices, Apparel filters, native category links, no document overflow and no JavaScript page errors. No purchase/payment/cart submission was made.
- Latest four page updates at 1440, 390 and 320px: nine equal-width/equal-height Resources cards without clipped text, centered single Sleeping Pod Home, native playable Arcade links, About content and no page errors.
- Live game startup and real NeoChinatown scene. Seren, Kai and Nadia each selectable and loaded; simulation changes leave campaign/local save unchanged; exiting disconnects audio nodes/timers. These production checks used fresh anonymous browser state and blocked non-read API requests.
- Production /api/health returns 200; unauthenticated /api/void-runner/account returns 401.

The controlled local release regression passed ten repeated real-asset scene visits, density slowdown/recovery, all five existing VR options, interruption/reload and HUD checks. Release #117 Linux CI passed Node/Python/Babylon jobs (run 40966581101); #118 passed all jobs (run 40975240200). The release subset had 422 Node and 92 API/save Python tests; directory changes add three Node tests (425). Integration including editor foundations passed 431 Node and 112 API/save tests before the later directory increment; Stage 3C foundation now passes 434 Node/123 API/save plus six Blackout tests.

## Limits and diagnostic record
An additional full-regression script run against cold production assets did not satisfy the controlled test's exact resource-count equality: Meridian visit 4 had 616 meshes/217 materials versus 536/203 earlier, with unchanged textures/skeletons/animation groups and no game error. The asset pipeline explicitly permits timed-out optional props to finish caching for subsequent visits and background crowd replacement. Different cold download/cache states therefore need a different live sampling protocol; this is an explanation to investigate, not proof of a production memory plateau. The strict local/Linux regression was retained unchanged and passed. Production companion/isolation checks were then run separately and passed. Some earlier live probes also encountered network-change/disconnection errors; final navigation/storefront/companion probes completed without page errors.

No physical ROG Ally or authenticated real-owner cloud save was exercised. Firebase rules/IAM/billing and the exact deployed Render backend revision cannot be certified from this workspace; health/auth boundaries were checked, not a backend release marker. No authentication was weakened and no migration is included.

## Rollback
Previous live baseline: 8e82200498bd5115baa2e985c1ea1b6827c86d97. For only the directory correction, create a revert PR for merge 60b459b using its first parent; this restores release 462db78. For the whole website/game release, revert 60b459b first and then merge 462db78 using first-parent merge reverts. Do not reset main or discard subsequent work. Inspect the combined revert and rerun tests before approval/deployment. GitHub Pages rebuilds main/root; verify the resulting build and live pages/game after rollback. No database rollback is required because no content activation, entitlement change or data migration occurred. Backend environment settings were unchanged.

## Other work and review locations
- Stage 3B implementation: docs/admin-stage3b, draft PR #115, all branch CI green (40923890822). Secure owner-only schema-validated drafts and previews are implemented; production persistence stays disabled pending actual infrastructure verification.
- Storefront before/after screenshots and file scope: docs/storefront-upgrade; directory screenshots and tests: docs/directory-panels.
- New models: compatibility report in draft PR #119. Secretary creator permission with credit is confirmed; conversion/material/animation checks remain. Mégane editorial rights, other unresolved rights and dense/unrigged assets prevent deployment. No new companion is integrated and no integrated-new-model screenshot is claimed.
- Stage 3C begins in a separate draft PR on top of unchanged #115 plus deployed main. Initial private candidate/history/comparison/rollback foundation is implemented, not live publishing. Runtime activation, native adapters and live rollback remain further Stage 3C work and must not be deployed without separate review/approval.
- Stage 4 store/economy administration remains queued.