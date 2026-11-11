# The Darknet District — Current AI Development Handoff

## LIVE STATE AND NEXT WORK (Claude, 2026-11-11). Newest; read first. Always re-fetch GitHub before trusting any of this

**Policy from David (2026-11-11):** the live site is the test environment; there is no staging site. Verified, production-compatible work may be merged and deployed. Do not blindly merge large PRs, overwrite newer work with older, break sign-in/saves/purchases, change production databases or secrets, or buy services.

**Live now (verified in a real browser against https://thedarknetdistrict.com):** `main` = the squash of PR #214 on top of #215 and #212. Homepage ENTER logo opens `void-runner.html`; phones get the "desktop experience" page and download no game files (2 requests); desktop: menu, New Campaign, character creator first (hairstyle re-fit confirmed), Sleeping Pod 01, walking in the District interior, no missions, no ship, no page errors. Favicon files and links are live (PR #214). The two missing pod textures are live (PR #215).

**Deploy facts:** merging to `main` triggers "Deploy site" (GitHub Pages). The deploy of `fd626f7` had timed out on GitHub's side and the site was one commit behind until it was re-run; **always confirm the live `BUILD` stamp** (`void-runner-sw.js` shows `...+<commit>`), never assume. The CI job "Babylon stabilization smoke" can fail at `playwright install` (apt exit 100): that is infrastructure, not a test failure. Render: game API `the-darknet-district-site` deploys from `main` with auto-deploy OFF (so it is still the older API: no `/character`, no `/character/appearance`); hub `district-hub` runs commit `4c60781` from `claude/character-creator` with a one-account allow-list.

**What PR #212 did NOT include (still on branches, newer than what is live):**
- `codex/first-player-experience-repair` (`086f7b2`): ten personal Sleeping Pods with their own music and lighting controls, the entrance collision fix. Live has ONE pod and the music screen on the public wall. This is the highest-value port.
- `claude/public-multiplayer` (PR #199): hub `HUB_ACCESS=registered`, District text chat, mute/block/report. Live has the multiplayer client with `LIVE_HUB` set but it is opt-in from Settings and the hub admits one account; no chat.
- `claude/v1-device` (work in progress, pushed): V1 holographic device (`void-runner/device-v1.js`, `personal-device.js`, `device-portraits.js`, tests). Known open bug: Esc inside the device also opens the game menu (mode becomes `menu`); the browser test `tests/personal-device-browser.cjs` passes up to that step. It is based on the first-player-repair branch, not on `main`: port the new files onto `main` rather than merging the branch.
- Server: appearance persistence and the `/character` endpoints exist only on branches; needs a Render API deploy decision (ask David: it changes the production API).

**Known live issues:** the player leaves the pod facing a dark wall (first view is nearly black); `tests.test_void_runner_api` Stripe webhook test fails with the installed Stripe version (pre-existing); characters exceed polygon targets; outfits and shoes are presets.

**Not started (planning only):** David's master specification of 2026-11-10 (living NPC tiers, Dax, shared social network, photography, bounties, device manufacturers, neural interface, Android companion app, vestibule door-locked loading sequence). It is a long-term specification, not authorisation to build everything; start with its Phase 1 (vestibule sequence audit) after the pod port.

**Recommended order:** (1) port the ten-pod and entrance repairs onto `main`, test, publish; (2) finish and publish the V1 device; (3) chat and registered-account hub (needs the hub redeploy and David's Render change); (4) spec Phase 1.


**Updated:** November 10, 2026  
**Repository:** `Smartsec916/the-darknet-district-site`  
**Current integration PR:** [#212](https://github.com/Smartsec916/the-darknet-district-site/pull/212) — draft; branch `integration/district-entry-safe-rollout-20261110`.  
**Authoritative workflow:** Read `CLAUDE.md`, `AGENTS.md`, `VOID_RUNNER_HANDOFF.md`, and `docs/development/AI_ROADMAP.md`. This document supersedes the October-era campaign *status* sections of the legacy handoff, not its historical canon records.

## Verified status at handoff

- PR #212 head checked: `e3e0ba1db9b9ff73e3929e4e65f4898ed5815ae8`.
- GitHub Actions **Tests** run [42893600023](https://github.com/Smartsec916/the-darknet-district-site/actions/runs/42893600023) completed **success**: Node unit tests, Python API tests, and Babylon stabilization smoke all passed.
- GitHub Actions **Deploy site** run [42893600016](https://github.com/Smartsec916/the-darknet-district-site/actions/runs/42893600016) completed **success for build**; the **deploy job was skipped** because this was a PR run.
- **Passing CI is not a production release or proof of all manual gameplay flows.** PR #212 remained **draft and unmerged** at this check. No claim that its contents are live.
- The new District game source, gated desktop entry, nine binary hairstyle GLBs, appearance registry/fit metadata, guest-mode guards, social/share protection code, and associated tests have been integrated on the draft branch.
- The read-only admin inventory was regenerated from the source and validated. Do not confuse that **game content registry** with real Shopify/store merchandise.
- The first-time character prompt was moved before EXIT POD; verify in a real browser after login. The browser stabilization smoke passed, but it does not independently prove every player-facing path.

## Current approved design / non-negotiables

1. The game is **The Darknet District**, set in **NeoChinatown, Tessaly System**. No Earth/Sacramento/Sol setting. Keep stable historical internal IDs only where save compatibility depends on them.
2. Desktop/capable Windows handheld users enter from the current homepage's subtle green logo / **ENTER** control. Keep the top navigation. **Phones remain on the normal mobile site and must not download the full 3D game**; preserve the device gate.
3. New/returning players enter **their own Sleeping Pod** on login/reconnect. New players create/customize their appearance **before exiting the pod**, not after. Validate clothing color, hairstyle, saved appearance, music controls, pod reentry, and collision/doors.
4. **No active new-campaign missions** and **no starting ship**; preserve mission NPCs for future local NeoChinatown missions. Existing legacy save backups are retained, but pre-reset saves are intentionally rejected by the new campaign epoch; do not silently undo this reset. Independently review cloud save/API compatibility before rollout.
5. Admin-only jump/teleport features remain restricted. No public share-link privilege or guest-account save bypass.
6. Indoor District and exterior street are separate load/scene areas via vestibule. Iris and Admin remain in-game NPCs; do **not** inject the separate website Iris chatbot into the 3D game. Sleeping Pod music belongs inside individual pods, not room-wall public players.
7. Multiplayer is designed for automatic instance joining and compatible Firebase identity; do not enable server-side character synchronization, trade or public messaging before validating backend authorization/security.
8. User permits **removing unfinished in-game store items** if necessary. This does **not** authorize removing actual website store products, Shopify workflows, paid entitlements, licensing or payment systems. No inventory deletion was required for the CI fixes.

## What was completed on draft PR #212

- Reconciled the updated game entrypoint and many runtime scripts selectively (do not wholesale merge `claude/character-creator`).
- Imported nine 3D hair GLBs **as binary Git blobs**. Keep private licensed models out of public Git and respect licensing.
- Restored guest guards and developer-only Share Links controls; synchronized `void-runner.html` and `static/void-runner.html`.
- Updated Arcade to remove the retired Void Runner listing; preserved the live-approved homepage look.
- Restored standalone Sleeping Pod website Iris widget and adjusted regression tests so homepage styling is not mistaken for a chat UI change.
- Reconciled tests with the November campaign reset and refreshed the read-only `void_runner_admin_inventory.json` projection, without removing website merchandise.
- First-time creator now opens before leaving the Sleeping Pod; stabilization browser test was updated to recognize the creator/pod-wake stages.

## Remaining before any production merge

- Perform human/browser acceptance on actual Windows desktop / ROG Ally and phone: entry device gate, sign-in/guest/new account, server permissions, creator selection/preview, changing hair/clothing colors, first pod wake, saved appearance, reconnect to own pod, transitions, inventory preservation, kiosk/VR/media behavior, and regressions.
- Confirm that server-side saves, Firebase rules, multiplayer endpoint and Render service configuration are release compatible. Avoid running write tests against production.
- Check service-worker `BUILD` and cache-busting; ensure `static/void-runner.html` remains byte-identical to root page, and validate asset manifests / licensed assets.
- Review exact PR diff vs current `main` for changes arriving after this handoff; old PRs (#176, #177, #178, #180 and others) may be superseded. No blind merges.
- User has said **"push anything ready to live"**; this grants interest in a vetted partial release, **not** a mandate to merge unfinished PR #212 wholesale. Isolate independently tested changes if possible. Do not declare deployment without checking the actual live deployment result; otherwise report the blocker and keep draft.
- Do not modify production databases, buy services, expose secrets, or replace commercial asset files without explicit authorization.

## Next agent: recommended sequence

1. Fetch latest `main`, PR #212 and current GitHub Actions results; do not assume the above commit is still the head.
2. Check `docs/development/AI_ROADMAP.md` and the outstanding acceptance cases.
3. Test priority journeys against a **nonproduction** origin or local server. Fix verified issues in the integration branch and run the same CI.
4. Identify small independently releasable work. Only merge/deploy a specifically verified, safe scope when authorized; keep the larger PR draft until acceptance.
5. Update this handoff with commit SHA, run IDs, outcomes, new blockers and release status after each meaningful milestone.

**For historical story decisions and older implementation notes:** `VOID_RUNNER_HANDOFF.md` remains reference material, but its October 15 `main` SHA, tutorial-first start and old mission roadmap are **not current**.
