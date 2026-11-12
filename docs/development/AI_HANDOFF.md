# The Darknet District — Current AI Development Handoff

## 2026-11-12: security vestibule checkpoint rebuilt

- The exchange between street and interior now happens in the middle of the vestibule, only after the door sensors report BOTH doors shut, in both directions; the player keeps position and facing; the far door opens afterwards. Full description: `docs/development/VESTIBULE_CHECKPOINT.md`.
- Behaviour change: leaving the District no longer drops the player in the alley; they stay in the vestibule and walk out through the outer door. In the interior the outer door cannot open; in the street the inner door cannot open.
- Master specification Phase 1 (vestibule loading only when both doors are closed) is therefore done.


## 2026-11-12: shared VR sessions (game side live after this PR; hub redeployed separately)

- Full description, rules and message list: `docs/development/VR_SESSIONS.md`. Hub rules in `tools/district-hub/protocol.cjs` (a session is its own room `vr:<id>`), menu in `void-runner/vr-core.js`, connection in `void-runner/remote-players.js`.
- Public sessions are listed and joinable (JOIN, QUICK JOIN); private sessions are never listed, cannot be joined by id and need an 8-character code checked by the hub. Host leaving passes ownership on; empty sessions end. Playing alone is a private session of one.
- Shared: Relax in a Forest, Tropical Escape. Solo only: Play in a Bedroom, Combat Simulator (not synchronised). Only position, facing and walk/idle are shared.
- The game sends session messages only to a hub that announces `features.vr` (the older hub counts unknown messages as faults). Either side can be deployed first.
- Also fixed: the player list is kept while a place loads (returning from VR used to show nobody); a keep-alive timer stops slow loads being taken for dead connections.
- Tests: `tests/district-hub-vr-sessions.test.cjs` (rules), `tests/vr-sessions-browser.cjs` (one browser + two wire-level players, SIMULATED identities; this cloud machine cannot render two simulations at once). Not verified: two real players in one simulation on real hardware.
- The hub on Render follows branch `claude/character-creator`, not `main`: after merging hub changes, add a commit there with the same files and trigger a deploy of `district-hub`.


## 2026-11-12: multiplayer presence repair (live after this PR)

**Report:** two real players in the Sleeping Pod area could not see each other. **Evidence (Render hub logs, 10–12 Nov):** only ONE player id and one address ever joined; no second account reached the hub.
**Causes found in the client (`void-runner/remote-players.js`):** (1) the client was online only in `walking`/`menu` mode, so lying in a pod (`pod-waking`), the pod music screen or the wardrobe silently disconnected the player: two players in their pods were never online together; (2) nothing on screen said whether a session was online or solo, so an unsigned-in player could not tell.
**Fixed:** stays connected in every District-interior screen (`ROOM_MODES`); a player in a pod is reported at the pod door (pods stay private); on-screen indicator `#mp-chip` (ONLINE · N players / PLAYING SOLO · reason / CONNECTING / RECONNECTING); a plain glowing fallback figure if a player's model cannot load; `VoidRemotePlayers.diagnostics`; main menu says solo play when not signed in. The earlier-campaign backup download was removed from the menu (retired copies stay untouched in browser storage; `C.retiredKeys` kept).
**Test:** `tests/multiplayer-presence-browser.cjs` (two to three browser sessions + in-process hub, SIMULATED identities). Not verified: real Firebase sign-in for a second real account, and two real players on the live site.
**Not changed:** the hub (Render `district-hub`, still commit 298533b) and the game API. **Still required of each player:** a registered account, a District handle (Menu › Settings) and a saved character.
**Next:** shared VR sessions (public/private) need hub protocol work and a hub redeploy; then resume graphics from branch `claude/aaa-first-view` (menu city backdrop, unfinished WIP commit).


## 2026-11-12: pod wall displays and vending (live)

- Each sleeping pod now has, built into its walls: a music player face (PR 223), an ambient-light panel (PR 224) and a vending unit (this PR). Code: `void-runner/neochinatown.js` (`drawPodPlayer`, `drawPodLights`, `drawPodVending`, `podScreen.tick`) and the pod menu in `void-runner/world-integration.js` (`podVend`).
- The two displays are status only: they follow `VoidPodMusic`; the controls stay in MUSIC & LIGHTS. They refresh on real time because the game clock stands still in `pod-waking`.
- Vending stock (20 items, names/prices/descriptions) is copied from David's Tesana pod source. It is flavour only: DISPENSE charges no credits and adds nothing to the inventory. Making it a real shop is an economy decision for David.
- Tests rely on `#pod-wake` having exactly one `<button>` (EXIT) and one `<p>`; new pod-menu controls must be `a[role=button]` / `div`.


## UPDATE 2026-11-12 (later, Claude): V1 device, hub and game API are LIVE. Newest; read first

- **V1 holographic device is live** (PR #220, squash `8bb8923`; live `BUILD` `2026-11-12-v1-device-1+8bb8923640`). Verified on the live site: L opens it without pausing the world, nine apps listed, empty Mission Log, Esc goes back without opening the game menu, a portrait is rendered from the real character, no page errors. Files: `void-runner/device-v1.js` (rules, registry, saved state, map exploration, profile view-model, portrait keys), `personal-device.js` (screen), `device-portraits.js` (offscreen portraits), tests `tests/device-v1.test.cjs`, `tests/personal-device-browser.cjs`. Camera and Gallery are placeholders. NPC portraits need `NPC_MODELS` in `device-v1.js` filled with real npc-to-model pairs (empty on purpose: none is defined by the game yet). Private messages, friends and discovery are not built.
- **Render, done with David's approval:** game API deployed from `main` (`eeb6989`), `VOID_APPEARANCE_ENABLED=true`; hub `district-hub` runs `main`'s code with `HUB_ACCESS=registered`, `HUB_ALLOWED_UIDS` empty, `HUB_ALLOW_ANY_SIGNED_IN=false` (hub log: "registered accounts, complete District profile required"). The hub service follows branch `claude/character-creator`, which now carries a commit whose tree equals `main`; to update the hub later, either change the service's branch to `main` in the dashboard or repeat that. Pre-reset cloud saves are reported as retired (David accepted the reset).
- **Handle registry** (`blackout_api.py`) synced to the runtime's version (PR #219).
- **Trading stays off:** only the window and a test-only practice ledger exist; real trading needs server-kept inventory and credits (propose a design first).
- **Never verified by anyone yet:** a real sign-in, two real players meeting, chat, and looks syncing online. The sandbox cannot reach Firebase or onrender.com; ask David what he saw.

**Next:** fix whatever David reports from the first real two-player test; pod exit faces a dark wall; master specification Phase 1 (vestibule loading only with both doors closed); Sleeping Pod visual audit against the Tesana ZIP.

## UPDATE 2026-11-12 (Claude): District runtime update is LIVE. Read this before the 2026-11-11 section below

PR #217 (squash `56a9a7e`) brought the game runtime, hub and tests from `codex/first-player-experience-repair` (`086f7b2`) onto `main` as one unit; website pages, the homepage ENTER entrance and the favicon were kept from `main`. Verified on https://thedarknetdistrict.com in a real browser: phone gate (2 requests, no game files), ENTER, creator first, **ten personal pods** (pod card: EXIT POD / MUSIC & LIGHTS / LOOK INSIDE), walking, no page errors, no missing files. Live `BUILD` = `2026-11-12-district-runtime-1+56a9a7efc4`.

So the 2026-11-11 list below is partly done: the ten pods and entrance fix are live. District chat code (`void-runner/district-chat.js`) is live too, but only shows when connected to the hub, and the hub on Render still runs `4c60781` with a one-account allow-list and no chat support: **chat does not work online until the hub is redeployed from `main` and `HUB_ACCESS=registered` is set** (David's Render action; see `HUB_RENDER_SETTINGS.md`). Share Links are retired on `main` (files removed).

**Server:** `void_runner_api.py` on `main` now contains `/character`, `/character/appearance` (flag `VOID_APPEARANCE_ENABLED`, off) and the campaign-epoch handling of old cloud saves (`is_current_save`: pre-reset cloud saves are reported as retired, not deleted). **The Render game API has NOT been redeployed** and still runs the 2026-11-01 code. A Render deploy from `main` would now switch that behaviour on: review it with David first.

**Not tested live:** sign-in, cloud saves and purchases (the sandbox cannot reach Firebase). Tests adjusted in #217: older assertions that the homepage has no game entrance were removed or updated; the website Sleeping Pod page still has its own song list (`tests/music-catalog.test.cjs` notes this).

**Next:** (1) V1 device (`claude/v1-device`): fix Esc opening the game menu, port its new files onto `main`, publish. (2) Hub redeploy + registered access for chat. (3) Game API deploy decision. (4) Master specification Phase 1 (vestibule).

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
