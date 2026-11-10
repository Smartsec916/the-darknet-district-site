# District entry rollout — integration gate (2026-11-10)

Status: **planning only; no game files copied and no deployment authorized**.

## Source and target
- Target: current `main` (GitHub Pages live site).
- Source to reconcile selectively: `claude/character-creator` (diverged; 131 commits ahead and 24 behind at initial comparison).
- **Preserve `index.html` from main**: approved clickable logo, subdued green border, cursive ENTER label. Do not apply the older `docs/development/homepage-entry/activate-homepage-entry.patch`.
- Do not merge the source branch wholesale or merge old stacked PR #176.

## Dependency finding
The newer `void-runner.html` is not a standalone drop-in replacement. It adds `void-runner/device-gate.js`, `district-area.js`, `district-transition.js`, `pod-*.js`, `character-*.js`, `remote-players.js`, new CSS, and a gated `text/tdd-game` script bootstrap. Copying only the HTML would break entry. Port the minimal coherent dependency set and inspect runtime integration and assets before changing production.

## Required acceptance checks before marking this PR ready
- Homepage logo remains pixel-equivalent in appearance and its link still opens `void-runner.html`.
- Desktop/ROG Ally enters the District; mobile gets the device gate and does not download the full 3D scene.
- Existing Firebase login works; guest access works without accidental public share links.
- Everyone spawns in their own Sleeping Pod on login/reconnect; no active missions; saves and inventory persist.
- Security vestibule transition works and street/interior loading does not leave invisible collision blockers.
- No old campaign reset or cloud-save rejection is deployed without a separate explicit review.
- Validate referenced assets, service worker caching, tests and live API compatibility.
- Keep multiplayer and server-side character appearance enablement off until separately verified.

## Rollout
1. Inventory exact dependencies and move only the cohesive District-entry changes into this integration branch.
2. Run tests and review browser entry flow on desktop and mobile.
3. Confirm Render game API auto-deploy settings and legacy save behavior.
4. Request approval to merge only after checks pass. A merge to `main` publishes GitHub Pages.

This PR is intentionally a draft until implementation and verification are complete.
