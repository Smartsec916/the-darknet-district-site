# The Darknet District — current AI handoff

**Start here.** This file is the one current handoff. Read the checklist and the sections through "Open questions" before any other handoff document. The dated diary under [Historical log](#historical-log) is kept so older notes are not lost. Entries in that log contradict each other. They are snapshots, not instructions. David's reference pictures from 12 Nov 2026 are written out in [`VISUAL_REFERENCES.md`](VISUAL_REFERENCES.md) so later work can use them without the files. The images are not in the repo yet ([`references/README.md`](references/README.md)).

**Checked against:** `origin/main` `4fc1a70` (12 Nov 2026). That commit is the merge of #240 (Tropical Escape dolphins) on top of `7939256` (NULL nightclub, #238). Re-fetch GitHub before trusting pull-request numbers or deploy claims below.

## CURRENT DEVELOPMENT STATE — RESUME HERE

### Newest: hall wall session (after 15 Nov 2026) — AAA graphics modernization started
David authorised continuous graphics modernization with routine commits, merges and deployments (no per-step approval; never bypass checks). This entry is newer than the "Verified 15 Nov 2026" text below and wins where they differ.
- **Blender through Higgsfield works** (`BLENDER_HIGGSFIELD.md`): the fault was an account mismatch. Files cannot cross between David's PC and the cloud session, so pieces are written as code in `tools/assets/kit/build_kit.py` and built in the cloud with `bpy`.
- **Done in this session:** the 4 x 3 x 0.2 m hallway wall module and its services band are built, checked in a Babylon viewer (`tools/assets/kit/piece-viewer.html`) and placed in the main hallway (10 modules). Three shared wall-metal texture sets; wear in vertex colours. Details, the lighting finding and evidence: `DISTRICT_INTERIOR.md` (last section), `docs/development/hall-wall/`.
- **Found, only partly fixed:** the interior's last four point lights (both hallway lamps, the pod-room lamp, one more) light nothing, because materials take the first 8 of 12 lights. Fixed for the new wall metals only.
- **Not done / not verified:** real-GPU look and frame rate; Firefox; multiplayer; David's reference archives (not readable from the cloud); the wall's first Blender file on David's PC was not updated to the refined version.
- **Next, in order:** (1) interior lighting so floor, ceiling and older modules receive the hallway lamps (light order or per-room light lists); (2) replace the remaining 2 m hallway modules, ceiling and floor with pieces in the new metals; (3) vestibule and entrance in the same language (keep the direction-aware loading: the room must look identical on both sides of the checkpoint); (4) shop, arcade, VR, pods; (5) NeoChinatown street with the building kit. Corporate District and the Temple (below) remain planned, behind this.


**Verified 15 Nov 2026** against GitHub, the repository and the live site (not copied from older notes). Where this section disagrees with the older dated sections below, this section wins. Those older sections stay as history.

### Verified repository and deployment state
- `main` = `8f9c2cb` ("Docs: permanent AAA dark-cyberpunk PC-only art direction, Milked handoff", PR [#266](https://github.com/Smartsec916/the-darknet-district-site/pull/266)). Before it: `3129a09` Milked ([#265](https://github.com/Smartsec916/the-darknet-district-site/pull/265)), `e0c59e6` handoff ([#264](https://github.com/Smartsec916/the-darknet-district-site/pull/264)), `cce7fef` beginner campaign + Developer Studio + crowd performance ([#263](https://github.com/Smartsec916/the-darknet-district-site/pull/263)), `8860ef6`, `d422f3d` V1 Phase 1-2 / KeyMap / Medium graphics ([#261](https://github.com/Smartsec916/the-darknet-district-site/pull/261)), `835982f` character gear ([#260](https://github.com/Smartsec916/the-darknet-district-site/pull/260)).
- **Live website:** the service worker reports BUILD `2026-11-15-milked-1+8f9c2cb9db` and the "Deploy site" and "Tests" workflows succeeded on `8f9c2cb`. The live game therefore contains everything above. This was a **website-only** series: the Game API, multiplayer hub, Firebase, Neon and Render were not changed by #263 to #266.
- Working tree clean, nothing unpushed that matters. Old local feature branches and worktrees in the cloud scratch folder are merged or throwaway and will not survive a new session; the truth is on GitHub.
- **Open pull requests** are all old (#176 to #208): [#208], [#207], [#199], [#198], [#197], [#196], [#195], [#191], [#190], [#189], [#188], [#187], [#185], [#182], [#181], [#179], [#176]. Do not merge, close or build on them; David has not decided (open question 11 below). Do not branch from them.
- **CI behaviour to know:** the suite passes on `main`. Intermittent failures seen on unchanged code, not yet fixed: (1) `tests/blackout-tesana-browser.cjs:171` ("original guest progress returns", once, passed on re-run); (2) the Python test `test_export_excludes_secrets_account_ids_and_player_data` fails at random: it asserts the substring `'999'` is absent from the export, but the export contains epoch timestamps and random hashes that can contain "999" (seen on two consecutive docs-only PRs, #266 in a timestamp and #267 in a hash; each passed or should pass on re-run). A fix task was suggested but is not done; the fix is to assert on a distinctive id, not a short digit string; (3) the sleeping-pod-exit smoke timeouts on 13-14 Nov were reported earlier as a runner issue. Investigate recurring failures; do not just re-run until green.

### What was being worked on when this handoff was written
The **three-location expansion** (Milked, then Corporate District, then Zen Zephyr Temple), plus a permanent art-direction update, plus an attempt to connect Blender through Higgsfield. Full scope: [`THREE_LOCATION_EXPANSION.md`](THREE_LOCATION_EXPANSION.md).

| Item | Status | Evidence / notes |
|---|---|---|
| **Milked** | **Completed and deployed.** Live-verified in a real browser. | PR #265, `3129a09`. `MILKED.md`, `milked.js`, `milked-integration.js`, `tests/milked.test.cjs` (12), `tests/milked-browser.cjs` (run locally and against the live site, no console errors), 18 screenshots in `docs/development/milked/`. Unit suite: 820 pass at the time. |
| Milked follow-ups | Planned, not started | Real-GPU, Firefox, multiplayer untested. Road taxis do not stop at Milked (street-taxi registry skips district zones). Eva and Fish voices are **provisional blends, unapproved, nothing generated**; dialogue is **provisional**; mission 3 (MEET EVA AT MILKED) is **inactive data** and needs David's approval to activate. Visuals predate the art direction (flat boxes, emissive signs): upgrade candidate. Lighting is dim. |
| **Corporate District** | **Planned, NOT started** | No branch or code. Only the placeholder plaza/sign/taxi zone exist. Needs: reusable 3D sky-cab scene transition, a second scene lifecycle, robots/drones/cameras, stealth, a second map space. Many design decisions are missing (listed in `THREE_LOCATION_EXPANSION.md`). **Next: Corporate.** |
| **Zen Zephyr Temple** | **Planned, NOT started** | No code. Depends on Corporate's transition and map work. Missing decisions listed in the same file. |
| **Permanent art direction** | **Documented and merged; no graphics rebuild started** | PR #266; `../VOID_RUNNER_ART_DIRECTION.md`. AAA is a goal, not a current claim. |
| **Blender / Higgsfield MCP** | **BLOCKED, not functional** | `BLENDER_HIGGSFIELD.md`. Cloud session reports `get_host_status` all false; Blender never inspected; the hallway-wall asset is **not started and not exported**. |
| Beginner campaign (six missions, starter ship, Meridian flight) | Completed and deployed; **dialogue is PROVISIONAL, not canon** | `BEGINNER_CAMPAIGN.md`. Only the first trip to Meridian was played end to end; return travel and other destinations untested. |
| Developer Studio foundation | Deployed, partial | `DEVELOPER_STUDIO.md`: Missions and Dialogue tabs work with local drafts; NPCs and Locations read-only; other tabs planned; **publishing disabled**; Asset Library not built. |
| V1 Phases 1-2 (teal V1, Messages, KeyMap), Medium graphics default | Deployed | Two-player chat through the real hub, Firefox and ROG Ally/real-GPU numbers **not verified**. |
| Character gear (visor, collar, shoulders, chest) | Merged (#260) | Whether the API and hub were redeployed for the gear catalog was **not re-checked** in this session; check Render's deploy list (read-only) before claiming it works for other players. The four outfits (#258) were deployed on 13 Nov. |
| Performance work | Partial | One small measured optimisation (crowd animation throttle). Cloud numbers are software-rendered. `PERFORMANCE_2026-11.md`, `GRAPHICS_TEST_ROG_ALLY.md`. |

### Other unfinished work with evidence in this repository
(Do not reopen finished items. Statuses are from the dated sections below and have **not** all been re-verified.) Open questions 1-12 under "Open questions for David" below are still the list of David decisions (companion top-10, part-assembler plan, Yuki and Dex looks, noodle stand, voices, forest sky patch, age policy, Tesana per-asset confirmations, old PRs, bigger visuals). Queued by David on 12 Nov and listed there as large: Blackout Protocol level 3 NPC changes, levels 4+ graphics, leaderboard and profile achievements. Multiplayer: the hub, shared VR sessions and presence are live per the 12 Nov entries; **two-account verification is still David's test.** Phase H graphics (shadows, Ultra, ambient occlusion, a better HDRI) needs David's OK for an HDRI download. The District interior rebuild is in progress ([`DISTRICT_INTERIOR.md`](DISTRICT_INTERIOR.md)); under the art direction, the remaining Tron-like rooms are upgrade candidates, not finished.

### What is blocked
Blender work (connection above). Anything needing David: story and canon approvals (mission dialogue, Milked dialogue and mission 3, Corporate and Temple story decisions), voice casting, the open questions, closing old PRs.

### What should happen next (in order)
1. **Corporate District**, as its own branch and PR, per `THREE_LOCATION_EXPANSION.md`. Start with the reusable sky-cab transition and the second-scene lifecycle plus unit tests; then the area. Then merge and verify live.
2. **Zen Zephyr Temple**, same way, reusing Corporate's transition and map work.
3. In parallel, only when a **fresh** Claude session reports `blr: true`: the Blender read-only inspection, then the modular hallway wall test.
4. Small follow-ups when convenient: the epoch-timestamp Python test fix; Milked road-taxi stop.

### Open these files first
`docs/development/AI_HANDOFF.md` (this section), `THREE_LOCATION_EXPANSION.md`, `../VOID_RUNNER_ART_DIRECTION.md`, `BLENDER_HIGGSFIELD.md`, `MILKED.md`, then `CLAUDE.md`. For Corporate: `void-runner/neochinatown.js` (`districts`, `taxiZones`, `streamDistricts`), `city-taxi.js`, `taxi-rules.js`, `road-taxi-rules.js`, `district-transition.js`, `district-area.js`, `district-map.js`, `milked.js` (a worked example of a streamed building with data, collision, interactions, map places and tests).

### Tests to run before any PR
- `npm ci` then `npm test` (820 pass on `main`). `python3 -m unittest tests.test_story_save tests.test_progression_save`. The full Python API suite needs `pip install -r requirements-void-runner.txt` (CI runs it).
- Browser tests: `node tests/serve-modern.cjs`, then e.g. `node tests/milked-browser.cjs low`, `district-map-browser.cjs`, `road-taxi-browser.cjs`, `beginner-browser.cjs`. **In the cloud container**, `npm ci` installs a Playwright whose browser build is missing: set `CHROMIUM_PATH=/opt/pw-browsers/chromium` (`tests/milked-browser.cjs` honours it) or preload a small script that passes `executablePath:'/opt/pw-browsers/chromium'` to `chromium.launch`. Software rendering is slow: shorten long flights in tests (see how `milked-browser.cjs` moves the cab). Always look at screenshots of visual work.
- CI also runs the Babylon stabilization smoke (`tests/stabilization-browser.cjs`, `tests/blackout-tesana-browser.cjs`).
- After changing game files: bump `BUILD` in `void-runner-sw.js`, keep `static/void-runner.html` identical, run `node tools/admin-inventory.cjs` (the inventory test fails otherwise), and update `save-manifest.json` if you add a location or mission id.

### What must not be changed (without David)
Sleeping Pod room, bedroom music player, VR play-area layout, licensed companion assets and the private asset pipeline, approved NPC voices and the reserved voice slot, the landing-pad area (x 13 to 37.5, z -106 to -86), internal location ids, the device gate (phones stay off the 3D game; the website stays mobile-friendly), the website chatbot (Iris) separation, the live Game API, hub, Firebase, Neon and Render. Do not activate mission 3 or any story content, and do not mark story content canon. Merge only when David says "push"/"pull it", except where he has pre-authorised a release (he did for the three-location PRs once checks pass).

## PERMANENT ART DIRECTION (set 15 Nov 2026): AAA dark cyberpunk, PC only

Applies to every future graphics task. Full text: [`../VOID_RUNNER_ART_DIRECTION.md`](../VOID_RUNNER_ART_DIRECTION.md) ("PERMANENT DIRECTION"). In short: the 3D game is PC-only; the target is a dark, detailed, cinematic cyberpunk world (Blade Runner 2049, Altered Carbon, The Expanse as references, no copying); phase out Tron-style grids, neon outlines on everything, clean flat materials, empty rooms and bright uniform lighting; new work needs layered believable architecture, PBR materials with wear, controlled dark lighting with practical light sources and accent neon, and visible human habitation. Keep budgets, instancing, LOD and streaming sensible; do not break gameplay. Blender assets use metric scale, modular parts, PBR, clean names, correct transforms and Babylon-compatible GLB, and must be fitted to the game's real coordinates. Existing assets are upgraded progressively, player-visible areas first; nothing is deleted indiscriminately. Only the 3D game is PC-only: the website, store and accounts keep mobile support. This is a documentation decision: **no game-wide graphics rebuild has started**, and AAA quality is a goal, not a current claim. Older graphics notes in this file and in `VOID_RUNNER_GRAPHICS_ROADMAP.md` are superseded where they conflict.

## 15 Nov 2026: Milked (location 1 of 3) is DEPLOYED: PR #265, squash commit `3129a09`

Three-location expansion, in order: **Milked, then Corporate District, then Zen Zephyr Temple**, one PR each. Milked is done; Corporate and the Temple are not started. Design and details: [`MILKED.md`](MILKED.md). Screenshots: `docs/development/milked/`.
- **What:** an adult livestreaming service and sperm bank (not a nightclub) on the Avenue's east plaza. Reception with Eva; streaming wing (three studios, operations room); biobank wing (appointments, private consultation, lab, staff-only door); Fish's back office. Everyone clothed, non-explicit.
- **New files:** `void-runner/milked.js` (data, collision, 3D build), `void-runner/milked-integration.js` (handlers), `tests/milked.test.cjs`, `tests/milked-browser.cjs`, `docs/development/MILKED.md`, screenshots. Hooks in `neochinatown.js`, `taxi-rules.js`, `city-taxi.js`, `district-map.js`; two provisional NPC entries in `tools/audio/npc-voice-registry.json` (blend voices, not approved, nothing generated); inventory regenerated.
- **Ids:** district `milked` (taxi zone `milked`), NPCs `milked-eva` and `milked-fish`, mission `meet-eva-milked` (data only, inactive). No new location id, save field or backend change.
- **Replacement points** (top of `milked.js`): Fish's name `CONFIG.FISH_NAME`; Eva's model `MODELS.eva`; Fish's model `MODELS.fish`; dialogue `DIALOGUE`. Placeholders are clothed crowd looks (`ncz-neon`, `fixer-01`).
- **Verified:** `npm test` 820 pass; CI green (Node, Python, build, Babylon smoke); real-browser walkthrough locally and **against the live site** (stream in, doorway, Eva, studios, ops, biobank, lab, Fish, map, real sky-cab trip with the long flight legs shortened because the software renderer is slow, unload) with no console errors. Existing map and road-taxi browser tests pass. Live BUILD `2026-11-15-milked-1+3129a09122`.
- **Known limits:** no real-GPU, Firefox or multiplayer testing; road taxis do not stop at Milked; lighting is emissive/ambient only and the interiors are dim; the look predates the permanent art direction above and is an upgrade candidate; dialogue is provisional and needs David's approval before the mission is activated.
- **Older tests changed** for the new geometry: `district-areas`, `environment-seam`, `district-map`, `road-taxi`, `city-taxi`.

## 14 Nov 2026 (later): beginner campaign, Developer Studio foundation and a performance profile built locally (DEPLOYED to the live website, squash commit `cce7fef`, PR #263)

**Deployed 14 Nov 2026.** PR #263 squash-merged to `main` as `cce7fef` on top of `8860ef6`; "Tests" and "Deploy site" both succeeded; live `void-runner-sw.js` reports BUILD `2026-11-14-beginner-campaign-2+cce7fefb0f`. Website only: no Game API, multiplayer hub, Firebase, Neon, database or Render change.
- **CI note:** the first PR run failed once in `tests/blackout-tesana-browser.cjs:171` ('original guest progress returns', 1 !== 4). Re-running the same commit passed, and main's own run also passed, so it is an intermittent timing flake in that Blackout test, not caused by this release. Watch for it.
- **Live checks done:** new files served, game boots with no page errors, `Beginner` module loaded, Studio shows only the sign-in screen to an anonymous visitor (CSP and noindex present). Studio publishing is disabled; the TEST SHIP stage only appears for server-confirmed developers.
- **Mission dialogue is PROVISIONAL placeholder text, not approved canon** (`VOID_RUNNER_HANDOFF.md` §11 'Proposed').
- **Known travel limits:** only the first trip (NeoChinatown to Meridian Station) was played end to end. Return travel and other destinations are untested; local Tessaly routes have raiders. Internal ids `earth`/`mars`/`sol-belt`/`sol` are not player-facing; no migration needed.
- **Not yet tested:** real-GPU / ROG Ally performance, Firefox, live two-player chat, a full live-site playthrough of the six missions.
- **Rollback:** revert squash commit `cce7fef` on `main` and push; Pages redeploys. Players' saves stay compatible (new state lives in tolerant `story.flags`).

- **Ship and travel were blocked by five things** (found by playing the real game): no ship (`shipAccess 'none'`), the old Vesper boarding gate, `freeTravel` false, `Campaign.complete` returning null for every flight in a closed-pool campaign (a launched ship could never dock), and the street's BOARD interaction being moved into a building by `world-integration.js`. All fixed; details in `docs/development/BEGINNER_CAMPAIGN.md`.
- **Beginner campaign** (six missions, existing Admin/Iris/bar/shop/Landing Terminal/Pad 01/Meridian only) in `void-runner/beginner.js` + `beginner-integration.js`, shown in the V1 Mission Log. **Story content is PROPOSED, not canon**: all wording is UNREVIEWED placeholder text. `Campaign.awardStarterShip` is the one real award (ship, quest open, free travel, once). Admin test ship: Developer Tools > Test & Jump To > "NeoChinatown ... TEST SHIP" (throwaway, never saved).
- **Developer Studio** foundation: `admin/studio.html` (12 tabs, WORKING/PARTIAL/PLANNED labels; Missions and Dialogue editors with validation, flowcharts, simulate, diff, export; NPCs and Locations read-only; local drafts only; publishing disabled). Docs: `docs/development/DEVELOPER_STUDIO.md`.
- **Performance:** profile and one measured, small optimization (crowd animation throttle); the JavaScript is not the bottleneck on this software-rendered machine and real-GPU numbers are still needed. Docs: `docs/development/PERFORMANCE_2026-11.md`.
- Verified: the whole campaign from a fresh save in a real browser (`tests/beginner-browser.cjs`, software GL): pod, six missions, ship on the pad, reload, boarding, real flight and docking at Meridian. NOT verified: return travel, other destinations, Firefox, real-GPU performance, live two-player behavior, the Asset Library (not built; the Windows asset folder was not visible from the cloud session).

## 14 Nov 2026: V1 Phase 1 + Phase 2 (Messages, KeyMap) and the Medium graphics default are LIVE
David approved publishing. PR #261 squash-merged as `d422f3d` (CI: unit, Python, build and the stabilization smoke all passed, also on main afterwards); the site deployed (live service worker build `2026-11-14-v1-phase2-2+d422f3d25e`). **Frontend only: no API, hub, Firebase, Neon or Render change, no save-schema change.** The API stays `5b0449b`-era code and the hub `b22d01e` (gear catalog); neither needs a redeploy for this.

What is live: homepage-style teal V1 (`void-runner/device-v1.css`), configurable transition delays (`DEVICES.v1.ui`), App Store storage panel (75% used / 25% available, 9 system apps, 0 optional). V1 Messages is the chat interface (the left-side box is gone; `district-chat.js` is a screenless session store; unread badges on the chip, tile and tab; Players tab = mute/block/report; Private is an honest stub). KeyMap on K (`keymap.js`; new rebindable `keymap` action in `input.js`; shown once after the first Sleeping Pod exit, `story.flags.keymapSeen`; a player who already uses K keeps it and the KeyMap takes J/N/M...). Graphics: new players start on **Medium** (High had become the default on 12 Nov via `c3c9213` with 4K caps); `graphics-prefs.js` decides what a saved value means: chosen presets are kept (saved with `v:2, chosen:true`), the old unchosen High and the old automatic Low are moved to Medium once, a High chosen again afterwards persists, Settings has "Reset graphics to Medium", nothing changes quality automatically. Details: `docs/development/V1_DEVICE.md`, `docs/development/GRAPHICS_TEST_ROG_ALLY.md`.

Verified after deployment (Chromium, against the live site): the new files are served and listed in the page; the service worker caches the V1 and KeyMap stylesheets and scripts (186 files); graphics-preference compatibility (9 saved-value cases, Reset, chosen High persisting); V1 timing, Messages (mocked multiplayer service) and KeyMap harness tests with the live assets; the real game new-campaign flow: no KeyMap in the creator or the pod, KeyMap after the first pod exit with the exact hint, K toggles, V1 and pause menu hide it, not shown again after a reload.

**Still NOT verified (do not claim them):** (1) live two-player chat through the real hub with the new Messages screen (needs two signed-in accounts; `tests/district-chat-browser.cjs` is adapted to it but times out loading two software-rendered pages, also on unchanged main); (2) Firefox (not installed here; `tests/device-messages-browser.cjs`, `device-v1-timing-browser.cjs` and `keymap-browser.cjs` accept `firefox`); (3) real-GPU frame rates and how Medium looks next to High on the ROG Ally (`docs/development/GRAPHICS_TEST_ROG_ALLY.md`); the cloud numbers are software-renderer only; (4) the CI sleeping-pod-exit smoke timeout seen on 13-14 Nov also failed on unchanged main (CI runner issue); it passed on this PR and on main afterwards. Not started: V1 Phases 3-6 (News source, follow system, camera/gallery, tagging) and the Developer Studio; all need David's approval.

## 13 Nov 2026 (late): cyberpunk character gear built locally (NOT pushed, NOT live)
Branch `claude/character-gear`: four optional creator accessories (`gear-visor`, `gear-collar`, `gear-shoulders`, `gear-chest`), male and female, all 11 outfits and 9 hairstyles. No schema change: they are ordinary `accessories` ids, so the API and hub only need the new catalog. Design, measurements and the live-release steps are in `docs/development/CHARACTER_GEAR.md`. Live release needs David's approval for: merge to main, API redeploy, hub catalog sync plus manual hub redeploy. Old clients show the plain model.

## 13 Nov 2026: Render updated for the four new outfits (David approved; live)

- **Game API** (`srv-d15h6nm3jp1c73ftalcg`, branch `main`, manual deploy): now `5b0449b` (was `eeb6989`). Deploy `dep-dbrl8q1srm7s73edskd0`, live 18:20 UTC. Only runtime change: `void-runner/character-catalog.json` (+4 looks, nothing removed).
- **Hub** `district-hub` (`srv-dbn1q3sipgvc73bbb1s0`, branch `claude/character-creator`, manual deploy): now `b4989eb` (was `85fe1f7`; fast-forward, same files as main `5b0449b`). Deploy `dep-dbrlatkipgvc739eho10`, live 18:24 UTC. Only change in `tools/district-hub`: `appearance/character-catalog.json` (+111 lines).
- No environment variables, Firebase settings, databases or secrets were touched. Neither service logged an error or warning after the deploys.
- Checked offline against the exact deployed code: all 11 looks are accepted by both services and the hub resolves each to itself; 14,256 combinations of the 7 older looks (every hairstyle, hair colour, clothing colour, accessory) give identical results before and after; old `{gender, model}` characters resolve identically; a wardrobe change to each new look is broadcast to a second player. The only refusals are the existing rule that SMUGGLER and TRADER hats do not fit some hairstyles.
- **Not yet verified:** two real signed-in accounts seeing each other's new outfits in the District. That needs David's test. The sandbox cannot call `onrender.com` (network policy), so health was checked from Render's own deploy status and logs.

## 12–13 Nov 2026: District interior rebuild under way

- David ordered the whole interior rebuilt with Blender-made assets. Plan, method and state per area: `docs/development/DISTRICT_INTERIOR.md`. First versions are live for the security vestibule, main hallway, Sleeping Pod hatches, the Admin & Iris shop, the arcade and the VR area (PRs #249 to #254).
- Pieces are built by `tools/assets/kit/build_kit.py --interior` into `void-runner/assets/models/district-interior/` (bare GLBs) and placed in `neochinatown.js` with `kitPiece()` / `kitAt()`, sharing one material per name (`kitMat()`); most join the per-material mesh merge. Old plain geometry stays as the fallback.
- Not judged on real hardware: brightness. The interior is at the 12-light limit, so the new surfaces rely on glow and a faint self-light.
- Still to do: hallway shop-front dressing and clutter, pod room walls/ceiling/interiors, shop display cases, bar and meeting room, ambient people, Admin and Iris looks (reference pictures supplied; needs David's go).

## 12 Nov 2026 (late): building kit finished; haze and dimness fixed

- **Modular building kit** for NeoChinatown: 47 pieces in `void-runner/assets/models/kit/` with `kit-manifest.json`, built by code (`tools/assets/kit/`). Not used by the game yet. Next step and all rules: `docs/development/BUILDING_KIT_HANDOVER.md`. Shop-sign wording is a placeholder awaiting David.
- **Graphics:** #241 (sharpness / Ultra) had also doubled bloom and glow and lowered exposure; #246 and #247 put bloom, glow, exposure and the street's faint self-light back. Sharpness and Ultra are kept. High is still the default quality on every device.
- **CI:** the browser smoke job is green again (#244). Its Blackout account-save section reports 'not run': the client half of that feature is only on `codex/blackout-district-production-integration` and needs David's decision before merging.
- **Next (David's order):** rebuild the District interior area by area with Blender-made assets, starting at the security vestibule; references are described in `VISUAL_REFERENCES.md`.

## How the handoff works

There is no generator script. The next model follows this reading order:

1. **This file, Start here** — what is true now, what is in flight, and what is waiting on David.
2. [`AI_ROADMAP.md`](AI_ROADMAP.md) — the current work sequence. October campaign milestones in other files are history.
3. [`CLAUDE.md`](../../CLAUDE.md) and [`AGENTS.md`](../../AGENTS.md) — how to work in the repo, saves, voices, tests, and line endings.
4. [`VOID_RUNNER_HANDOFF.md`](../../VOID_RUNNER_HANDOFF.md) — decision log and older canon. Its October 2026 "what the game does today" (start on Vesper, tutorial, starter ship) is **not** the live game. Do not restore that opening.
5. [`VISUAL_REFERENCES.md`](VISUAL_REFERENCES.md) — David's 12 Nov 2026 reference pictures, as written descriptions. The image files are still pending. Follow the entry when that character, place, or lighting job is in scope. The file does not authorise a Sleeping Pod room change, or a change to the VR play area's two divided areas.

The documents in this table are snapshots. Do not treat them as the place to start:

| Document | Why it is not the start |
|---|---|
| Historical log in this file | Dated snapshots. Headings that used to say "newest; read first" are renamed. |
| [`CODEX_HANDOFF.md`](CODEX_HANDOFF.md) | 4 Nov 2026. Told Codex to start on `claude/first-test-readiness` and said nothing was on `main`. That work has since shipped. |
| [`CODEX_TO_CLAUDE_HANDOFF_2026-11-06.md`](CODEX_TO_CLAUDE_HANDOFF_2026-11-06.md) | 6 Nov 2026 hub notes. `main` was still `7f2e8b1`. |
| [`FIRST_LIVE_TEST_RUNBOOK.md`](FIRST_LIVE_TEST_RUNBOOK.md) | Written before the first live test. The District game is on the public site now. |
| `docs/VOID_RUNNER_FREE_AI_VOICE_COMPARISON.md` | 15 Oct 2026. Still useful on engine choice (Kokoro). Line count "136" is stale. |
| `tools/animation-pipeline/README.md` opening | Says the game ships no rigged humanoid. Companions and the crowd do. |

## Start-here checklist

> Updated 15 Nov 2026: item 8's build stamp is stale (current stamp is in "CURRENT DEVELOPMENT STATE — RESUME HERE"). Items about the "four visual wins", street taxis (#243, merged) and dolphins (#240, merged) below are 12 Nov history. The Medium default shipped in #261.

1. `git fetch origin main` and branch from current `main`. Do not branch from the old Codex or #196–#199 stack.
2. Read this Start here section, then `AI_ROADMAP.md`, then `CLAUDE.md`.
3. **Merge only when David says "push", "pull it", or "go ahead and pull."** That means merge the finished pull request into `main`. Opening a pull request is not merging. Silence is not approval.
4. **Desktop and VR headsets only.** Phones stay on the normal site and must not download the 3D game (`void-runner/device-gate.js`). Do not lift that block. The four VR areas are in-engine first-person scenes, not WebXR. No `WebXR` / `createDefaultXR` usage is in `void-runner/*.js`.
5. **Leave the Sleeping Pod room and the music player alone** unless David asks, or a change cannot be made without them. If a game-wide graphics change would alter the pod, leave the pod meshes out and say so. Pod code is in `void-runner/neochinatown.js` (pod interior, `drawPodPlayer`, `drawPodLights`, `drawPodVending`) and `void-runner/pod-music.js` / `void-runner/world-integration.js`.
6. **Licensed models stay private.** Repo: `Smartsec916/void-runner-licensed-assets`. `tools/assets/pack-model.cjs` scrambles a GLB into `.vrpak` (magic `VRPK`). That scramble is not encryption. `tools/assets/build-pages.cjs` seals `.vrpak` / `.vrtex` as **VRPE** (AES-256-GCM) at the GitHub Pages build. Never commit source models, pack keys, or `VOID_ASSET_KEY` material to this public repo. Some marketplace licences are **No AI**: do not use those files for AI training. Ordinary rendering and the authorized convert/seal path are separate.
7. Story, canon, factions, and mission arcs: propose 3–5 options and wait. Graphics, bug fixes, and features David already asked for: implement on a branch. Plain language when writing to David. He is not reading code.
8. `void-runner.html` and `static/void-runner.html` stay byte-identical. Bump `BUILD` in `void-runner-sw.js` when any game file changes. Current stamp on this commit: `2026-11-12-null-club-1`.
9. `npm test` before a pull request. Do not put secrets, tokens, or device codes in docs, commits, or chat.
10. Do not start a second copy of the four visual wins. Dolphins already merged as #240. Check GitHub before starting a visuals branch; if that agent has since opened a pull request, use it.
11. When a job named in [`VISUAL_REFERENCES.md`](VISUAL_REFERENCES.md) is in scope, follow that entry. Each image is still pending. That file does not allow a Sleeping Pod room change, or a change to the VR play area's layout.

## What is on main (code, 12 Nov 2026)

The live game is **The Darknet District** in NeoChinatown, Tessaly System. A new campaign has **no active missions and no starting ship**. Every login should wake in that player's own Sleeping Pod. First-time appearance customization happens **before EXIT POD**. The homepage ENTER control is the way in. It is not the spawn point.

Shipped on `main` by 12 Nov 2026 (newest first):

| PR | What landed |
|---|---|
| #240 | Tropical Escape dolphins. Quaternius Animated Fish Pack dolphin (CC0), swim clip, surface leaps and splashes offshore of the beach and pier. Model `void-runner/assets/vr/models/dolphin.glb`. No crabs. Credit in `docs/VOID_RUNNER_ASSET_LICENSES.md`. Merge `4fc1a70`. |
| #238 | **NULL** nightclub is on for everyone. Interior is code-built in `void-runner/ncz-nightclub.js` (`buildOwn()`): dance floor, DJ, bar, VIP, people. A purchased `nightclub.vrpak` is used automatically if it is published later. See `NIGHTCLUB_NULL.md`. Street players are still not shared, so the club is solo. |
| #237 | Small arcade, five cabinets, off the hallway. The middle cabinet opens the real Blackout Protocol page. `district-arcade.js`, `ARCADE.md`. Four other titles are working names waiting on David. |
| #236 | Sleeping Pod free look and E/M/V shortcuts. `SLEEPING_PODS.md`. |
| #235 | Pods moved to the rear (hallway ends in the pod room). Stairs to the terrace moved to the east end. Wardrobe on the entrance wall. Old west room is the arcade. Use `VoidDistrictArea.podBed` / `podExit` / `POD_VIEW`. |
| #234 | Alley life: people, props, steam. No new alley sound. `ncz-alley.js`, `ALLEY_LIFE.md`. |
| #233 | Fishing from the Tropical Escape pier. "Catch 100 Fish" is progress on the player's own profile until server-verified unlocks exist. `ACHIEVEMENTS.md`. |
| #232 | VR-exit checkpoint fix (appearing in the vestibule no longer throws the player outside). Bedroom simulation is back and shareable. Companions are simulated per player, not synchronised. |
| #231 | V1 map is a real city map with zoom, pan, and a direction waypoint. No pathfinding. `district-map.js`. |
| #230 | Vestibule exchange only after both doors report shut. `VESTIBULE_CHECKPOINT.md`. |
| #229–#228 | Character-creator stage lighting; menu city backdrop. |
| #227 | Shared VR sessions (public list, or private 8-character code). `VR_SESSIONS.md`. |
| #226 | Multiplayer presence: stay online in pod screens; on-screen ONLINE / SOLO chip. |
| #225–#223 | Pod wall: vending (flavour only, no credits), light panel, music-player face. |
| #222 | Pod surfaces follow the Tesana design. |
| #220 | V1 holographic device (L). Mission Log empty. Camera and Gallery are placeholders. |
| #217 | District runtime, ten personal pods, creator first. |
| #214, #212 | Favicon, then the District entry integration. **#212 merged 11 Nov 2026.** It is not an open draft to hold. |

`WEBSITE_PLAYLIST` in `void-runner/pod-music.js` is **`true`** on this `main`. The 4 Nov note that the 27 songs are off in the game is stale. The website Sleeping Pod page has its own player either way.

Render (hub and game API) was last described in the 11–12 Nov diary as deployed from `main` with registered-account hub access. This checkout cannot see Render. Re-check the live services before changing them. Do not deploy, buy, or change secrets without David.

**Still open on GitHub, and not a base to branch from.** Drafts #196, #197, #198, #199, #195, #207, #208, and the older unmerged stack #176–#191. Much of that work already arrived on `main` by later pull requests. Do not merge those stacks wholesale. Closing them is David's decision.

A local packet (not on `origin`) also named branches `up196`–`up199` and `docs/cyberpunk-kit-reference` (`0f0dd7d`). They were not on `origin` at this check. Do not recreate them from memory.

## In flight — do not duplicate

> **Stale (12 Nov 2026).** Street taxis (#243) and dolphins (#240) have merged, and the Medium graphics default shipped in #261. For what is in flight now, see "CURRENT DEVELOPMENT STATE — RESUME HERE" at the top.

**Street taxis** are on branch `cursor/neochinatown-road-taxis-5abd` (pull request #243). Cabs drive the existing NeoChinatown roads and are hailed from the V1 map. Stops are only the four built taxi zones. Add another later by appending its zone id to `REGISTRY` in `void-runner/road-taxi-rules.js`. See `docs/development/ROAD_TAXIS.md`. Do not start a second taxi branch.

Checked again 12 Nov 2026 after this note was first written. **Dolphins merged** as [#240](https://github.com/Smartsec916/the-darknet-district-site/pull/240) (`cursor/tropical-leaping-dolphins-0365`, agent [bc-14ad5818-751b-5273-b62f-879dd9560365](https://cursor.com/agents/bc-14ad5818-751b-5273-b62f-879dd9560365)). Do not open a second dolphin change. **Do not add crabs.**

**No visuals / Ultra / bloom branch or pull request existed yet.**

### Four visual wins — own branch, not authorized to merge

- Cloud agent: [bc-8ae0a04a-9e48-58cf-9465-9f4d838cd39f](https://cursor.com/agents/bc-8ae0a04a-9e48-58cf-9465-9f4d838cd39f).
- David asked for these four only, game-wide, on their own branch. **Do not merge until he says so.** Do not start the medium or larger jobs (real night reflections, shadows, new buildings, NPC models, WebXR).
- Verified on `7939256`. #240 only added Tropical Escape dolphins, so these renderer facts still apply:
  1. **Sharpness.** `babylon-renderer.js` builds the engine without `adaptToDeviceRatio`. `resize()` caps at 2560×1600 CSS pixels (`width / scale`), so device pixel ratio is unused.
  2. **Quality.** Presets are only `low` / `medium` / `high` (scale 1.5 / 1 / 0.8). No Ultra. Default in `babylon-integration.js` is `low` when the pointer is coarse or cores ≤ 4, otherwise `medium`. `device-gate.js` `recommendQuality` can also store `low`. **Remove those quality auto-low checks for this task. Leave the phone block in place.** Settings `<select>` is built from `Object.keys(VoidBabylon.presets)`.
  3. **Glow.** Look pipeline exposure is `1.55`. Bloom and FXAA run on medium and high (`bloomWeight .32`). `GlowLayer` runs only on `high` (intensity `.45`). No sharpening pass. Engine antialias is the boolean `true`, not MSAA/SMAA.
  4. **Fake glow to remove:** shopfront emissive in `neochinatown.js` (road texture plus a small emissive color), puddle emissive, graffiti decal emissive. Facade `facade-*-glow` textures were not in the four-win list; leave them unless the branch must touch them. **Do not strip pod emissive** (`pod-inner`, `tesana-pod-led`, pod paint/fabric/rib) as fake glow.

Other facts from the same review, for later, not for this branch: the environment probe is a 128 px code-built grey room (`ReflectionProbe` in `babylon-renderer.js`). NeoChinatown has two street `PointLight`s, and only when quality is not low. The only `ShadowGenerator` in `void-runner/*.js` is the Vesper workshop. `docs/VOID_RUNNER_GRAPHICS_ROADMAP.md` Phase H (shadows outside the opening, Ultra, ambient occlusion, a better HDRI) was not started. A Poly Haven HDRI needs David's OK before download.

## Companions (metadata only)

Selection is a full-screen menu inside **Play in a Bedroom** at the VR arcade terminal, not the spawn. New players still wake in a Sleeping Pod. Eight companions: Seren, Kai, Nadia, Ava, Eva, Yuki (`base-f`), Dex (`base-m`), and Una (`listed:'dev'`, local server only until her product page and licence are identified). Dialogue is scripted. There is no live language model. They do not leave the simulation.

Public code can show Seren, Kai, and Nadia. Ava, Eva, Yuki, and Dex come from the private repo at Pages build time. A local build can list them and then report a missing model. Do not delete a companion or swap in a different model to hide that.

| Name | Game id | Pack | Notes recorded on main |
|---|---|---|---|
| Ava | `ava` | `vr-companion-ava` | Default: red top and skirt, bob, no glasses. Looks: outfit `red` (parts `top_red`, `skirt_red`, `bikini_bottom`) and `bikini` (`bikini_top`, `bikini_bottom`, `skin_under`); hair bob/long/pixie; glasses; make-up swaps `head`/`lips` to `face-makeup`. |
| Eva | `eva` | `vr-companion-pg` | Pretty Girl 01. Default: white slip, natural hair. Looks: cloth white/blue/pink/grey, hair colours, eye colours, face looks `1`–`6` (default `5`). |
| Yuki | `base-f` | `vr-companion-bf` | CGTrader base rig with Dex. **No `looks` array.** Underwear material is part of the prepared mesh. |
| Dex | `base-m` | `vr-companion-bm` | CGTrader Male Female Base Rig **#4027823**, Royalty Free, no AI. **No `looks` array.** Source comment: briefs only until David adds clothing. |
| Una | `una` | `vr-companion-una` | Style A/B/C looks. Not on the live site. |

The 12 Nov review's size notes (pack bytes from the private repo listing, not from decrypting models): Ava about 60 MB, Eva about 29 MB, Yuki about 24 MB, Dex about 17 MB, against a few MB for the public companions. `docs/VOID_RUNNER_VR_ARCADE.md` already records Ava at about 150 MB of graphics memory. Those numbers were not re-measured for this doc.

**Top 10 from the 12 Nov companion review** (not started; do not build until David asks). Smallest first:

1. Unprompted lines only subtitle. `remark()` in `vr-suite.js` calls `showLine` and does not play the clip. Recordings already exist.
2. Dex has no `confident` clip list. `clipFor` falls through to the shared fallback `hips` / `head-tilt` (the same hip-sway name Seren's confident gesture uses).
3. Affection starts at zero each visit, only rises, and is not saved. Three compliments unlock a kiss.
4. Short line pools. Every companion's kiss line is "Come here." Nothing reacts to music, light, outfit, or a return visit.
5. Ava's pack is heavy for headsets. A lighter private-repo variant was suggested. Not made.
6. Bedroom lighting: companions take many lights and a floor reflection. Pod room and music player were out of scope.
7. No lip sync. Seren, Kai, and Una do not blink or smile from this review's reading.
8. "Lie back" is a held pose, the dance loop is about a second, the kiss is a fade, holding hands is a generic reach, turning slides the feet, and there is no hug.
9. The same clips are baked into each model. One shared animation file would make new mocap cheaper. The player-creator plan already calls this a spike, not a promise.
10. Companion behaviour has no tests. The game is Babylon 8.26. An upgrade to a newer Babylon is a separate branch if David wants it.

A looks menu already exists in the bedroom Esc menu for Ava, Eva, and Una. A later idea (each option asked as a spoken yes/no, applied while she asks) was **not coded**.

**Player creator** (separate from companions): a creator is already live (before EXIT POD; hair and outfit presets). `docs/development/CHARACTER_CUSTOMIZATION_PLAN.md` (5 Nov 2026) is the unfinished part-assembler design. Its "nothing is built" line is stale. The six owner decisions before its Stage 1 are still unanswered: base heights, CC0-only versus waiting on Suits 02, where clothes change, how many colours, whether to buy anything, and whether looks can change freely later. Tesana, CGTrader companion models, and DAZ files stay off the player creator.

**Noodle stand:** not built. Street signs already say `DRAGON NOODLES` / `NOODLES`. A 8 Nov research note recommended YANGGA's Japanese Ramen Stall (Sketchfab, CC-BY, about 35k triangles) or a CC0 Quaternius stall plus a ramen prop. A placement east of the District door was sketched and then **not implemented**. The exact choice David was asked to make was not saved. Ask again. Do not invent a menu of options.

## Animation clips (what a new mocap file must satisfy)

- Skeleton: **52-bone Mixamo**, names `mixamorig:…`, contract `VR_Humanoid_v1`, `rig:'mixamo-52'`. Same contract for companions and crowd. `tools/animation-pipeline/characters/vr-companion-bf.json` has 52 bones.
- Build: `tools/animation-pipeline/build_imported_character.py` (character FBX or prepared `.blend`) and `build_mpfb_character.py`.
- Library rate is **15 fps** (`clips.json`). The game interpolates. Rest reference: `Laughs_mixamo.fbx`. The character rest pose is bent to the clips' T-pose for mapping only.
- Horizontal hip travel is stripped (in-place). Finger bones are in the 52. Review finger deformation before production use.
- Clip import accepts `.glb` / `.gltf` / `.fbx`. There is **no `.bvh` importer**. `mathutils.bvhtree` in that file is a spatial tree, not a motion-capture format.
- Retarget names that are recognised: Mixamo, HumanIK `Character1_`, and Unreal / Universal Animation Library names.
- `clips.json` "about": Rokoko free mocap in `VOID_RUNNER_KEEP` ("never modified"); Quaternius Universal Animation Library, CC0; Mixamo FBX David downloaded, baked onto characters, **never redistributed as raw files**. `CHARACTER_CUSTOMIZATION_PLAN.md` still holds Rokoko and Mixamo redistribution in a public web game until verified. Keep both: the pipeline's recorded licence, and the plan's verification gate.
- Production blending: `void-runner/crowd.js` sets `enableBlending = true` and `blendingSpeed = .06` ("clips cross-fade instead of snapping"). The weighted **300 ms** blend is only in `void-runner/animation-library.js`, loaded by the dev lab `tests/animation-poc.html`, not by the game.

**Mocap sources reviewed 12 Nov (nothing downloaded).** Closest ready fit: two CGTrader "Tomasi" packs on a Mixamo skeleton (flirting set, and a suggestive dance set). Also noted: Truebones Romance Pak (not Mixamo; credit required), MocapDancer couple dances (Unreal skeleton; Sketchfab licence has extra use limits worth reading before a cyberpunk game), Unity Asset Store couple packs (standard Unity licence allows a non-Unity game if players cannot extract the files; AI training banned), DeepMotion video-to-FBX/GLB (needs rights to the source video), and Cascadeur / Plask / Move.ai as cleanup tools (confirm Plask commercial terms before relying on them). Ruled out for commercial use: Smutbase-style non-commercial libraries, and the Bandai Namco / AMASS research sets. Paid clips would go through the private repo and the VRPE seal, same as the companion models. A few live prices could not be re-checked. Confirm before buying.

**Blender batch pass:** not a complete fix, and not started. Most of what the player sees in the District and on the street is still Babylon `MeshBuilder` geometry. NeoChinatown was described in that review as on the order of 1,100 pieces, mostly code-built. There is no Blender connection for Claude in the repo. Blender steps are one-model scripts on David's PC (Blender 5.2 or newer). Source `.blend` / `.fbx` files are not in either git repo. Rounding edges would break skinned companions and crowd. Higher-impact work that Blender cannot do: lighting and post (the four wins above), and replacing more code-built blocks with the city pack through the existing `pack_to_glb.py` path.

## Voices

- Engine on `main`: **Kokoro-82M** (`manifest.json`: `kokoro-v1.0.onnx`, Apache-2.0). Format: ogg/opus, 24 kHz mono.
- **736** lines in `void-runner/assets/audio/voice/manifest.json`. **439** are companions: `vr-ava`, `vr-eva`, `vr-una`, `vr-base-f`, `vr-base-m`, `vr-nadia`, `vr-seren` at 55 each, `vr-kai` at 54. Folder: **738** `.ogg` files and **741** files total (oggs, manifest, a second JSON, `LICENSES.md`). Use these counts. "741 lines" was loose.
- Playback: `void-runner/voice-clips.js`. A line with no clip falls back to browser speech synthesis. If the console shows the browser-voice path, fix missing clips before paying for a new recording.
- Companion cast entries in the manifest are `provisional`. Many story NPCs are `approved`. **Do not change an approved voice** without David. Registry: `tools/audio/npc-voice-registry.json`. Iris's android colour and Elias's hologram tone are applied at playback so the files stay clean.
- Regenerate with `node tools/audio/extract-lines.cjs`, then `python tools/audio/generate.py --models <folder>` (`--dry-run` first). Ask before bulk-generating. `LICENSES.md` still mentions `tools/voice/generate.py`; that folder is not on `main`. Use `tools/audio/`.

**Re-record research (12 Nov, nothing purchased).** The synthetic sound is Kokoro, not live browser speech. A one-off re-record of the 439 companion lines (about 17,000 characters) was priced roughly as:

| Provider | What the review reported |
|---|---|
| ElevenLabs | Most natural. Usage about $1.30. Commercial use needs the starter plan, listed as $6 a month and $1 the first month. |
| Google Chirp 3 HD, Amazon Polly, or Azure | A job this size fits the free monthly allowance, so likely $0. |
| OpenAI | Well under a dollar. The review said to skip it because those speech models shut down on 6 January. |
| Retune Kokoro | Free, with the existing audition tool. Modest change. |
| All 736 lines | Still free on Google or Amazon, or about $3 on ElevenLabs. |

Players must not call a TTS API. GitHub Pages cannot hold a provider key. Keep stable line ids, replace the ogg files, update `engine` / cast metadata, and run `extract-lines.cjs --check` and `npm test`. Suggestion recorded for David: try a few lines on ElevenLabs and on Google Chirp, then re-record with whichever he prefers, and leave Iris's android voice as it is. Unprompted remarks could be voiced by playing the existing clip inside `remark()` (top 10 item 1). Not done.

## VR areas and the Forest sky

`tests/vr-arcade.test.cjs` expects exactly `combat`, `forest`, `suite`, `tropical`.

| id | Title | File | Notes |
|---|---|---|---|
| `forest` | Relax in a Forest | `vr-forest.js` | `shared:true`, station 1 |
| `tropical` | Tropical Escape | `vr-tropical.js` | `shared:true`. Fishing (#233) and surface dolphins (#240) are on `main`. Gulls toggle. No crabs. |
| `suite` | Play in a Bedroom | `vr-suite.js` | `shared:true` again after #232. The 12 Nov map note that removed it from the menu is superseded by #232. |
| `combat` | Combat Simulator | `vr-combat.js` | `listed:false`. Code kept. |

New area: `VoidVR.register` in `vr-<id>.js`, script tags in **both** HTML files, and an update to `tests/vr-arcade.test.cjs`. Kit: `vr-kit.js`. Sessions: `VR_SESSIONS.md` (#227).

**Forest sky (nothing changed; cause unconfirmed).** `vr-forest.js` uses `k.sky('forest', 1.2)` → `void-runner/assets/vr/sky/forest.jpg`. The file inspected that day was a 2048×1024 RGB JPEG, 656,513 bytes, exact 2:1, with no obvious seam in a 1600×800 preview. `vr-kit.js` `sky()` builds a `PhotoDome` at **resolution 48**, size 1800. More likely than a bad texture, and not proven in a headset:

1. Horizontal leaf cards on oak/birch crowns (`vr-forest.js`, top card with `rotation.x = Math.PI/2`).
2. Seven sunbeam planes (settings key `beams`, default on).
3. Less likely: the coarse dome, fog, or waterfall mist. The dome has fog off.

Do not "fix" this on a docs branch. A later debug pass can hide the top cards and the beams and look again.

`docs/VOID_RUNNER_VR_ARCADE.md` still has an older "needs David's review" note about three companion lines that mention the sea. Those lines were left as written.

## Music rights and the Tesana audit (from the unpushed notes)

Folded in from local commits `bb7c045` and `3df6adb` (they were not on `origin/claude/codex-handoff`, which stops at `d6cfc67`):

- **Music (David, 8 Nov 2026):** the 27 songs were made during a **paid Riffusion subscription in 2025**, which is also why they are higher quality than the free plan. The free tier's non-commercial limit does not apply. The March–April 2026 Starter receipt is a later paid period. Rights are treated as **settled for use in the game**. That does not by itself grant redistribution, sublicensing, or AI-training rights. Explicit titles are an age-policy question, not a reason this note removes the files. `MUSIC_LICENSING.md` carries the update. `CLAUDE.md` already said to keep paid-plan Riffusion music available.
- **Tesana shared library:** the 10 `library:` models (`iris`, `kai`, `mara`, `marcus`, `nadia`, `pedestrian_a`, `pedestrian_b`, `rook`, `seren`, `satellite`) are still **to confirm, per asset**, before import. The 7 models generated in David's own Tesana project are covered at plan level by his Max Plan statement and remain unimported. Wording in the audit now says "not recommended" / "to confirm" instead of "reject" / "blocked". See `TESANA_ASSET_AUDIT.md`.

## Standing rules (short)

- David (`Smartsec916`) is the creative authority. Record story decisions in `VOID_RUNNER_HANDOFF.md` §11 only after he approves them.
- Desktop and VR headsets only. Not phones.
- Do not modify the Sleeping Pod room or the music player as part of unrelated visual work.
- Do not merge, deploy, buy services, or change production data or secrets unless he asks.
- Licensed companions and other paid models: private repo, VRPK scramble, VRPE seal at Pages build. Never in this public repo.
- In-game Iris stays separate from the website chatbot (`chatbot.html`, `iris-*.html`, `identity_api.py`).
- Unfinished **in-game** shop items may be removed if a task needs that. Real storefront, Shopify, and purchased entitlements stay.
- `git config core.autocrlf false` in this repo. Many files are CRLF. Do not reformat a file to fix line endings.

## Open questions for David

1. **Companion review:** start any of the top 10, or leave them? The suggestion on the day was silent lines, the Dex clip, and saved affection. Not started.
2. **Player creator plan:** the six Stage-1 decisions in `CHARACTER_CUSTOMIZATION_PLAN.md` §11 are still open. The live creator is the preset one, not that part assembler.
3. **Companion looks for Yuki and Dex,** and whether the bedroom Esc looks should be asked out loud. Not decided in a saved list.
4. **Noodle stand:** which stall, if any (YANGGA CC-BY, Quaternius CC0, or none). Nothing was built.
5. **Voices:** try ElevenLabs and Google Chirp on a few lines, or keep Kokoro? Iris's approved android voice stays either way.
6. **Forest sky:** where the odd patch sits (overhead, horizon, or over the clearing), and whether it vanishes with Sunbeams off.
7. **Crabs** stay out unless he asks again. Dolphins are already on `main` (#240).
8. **Four visual wins:** review that pull request when it exists. Merge is not authorized yet. Pod room and music player stay visually as they are.
9. **Age policy** for strong-language songs and any vending flavour. Still open. Playlist files are already public on the site.
10. **Tesana:** per-asset confirmation for the 10 shared-library models before any import.
11. **Old pull requests** #176–#199, #207, #208: leave open, or close as superseded? Do not close them without him.
12. **Blender / bigger visuals** (reflections, shadows, more city-pack buildings, NPC models): not started. Phase H in the October graphics roadmap still needs his OK for an HDRI download.

## handoff-soft.patch — what was folded in

Eight documentation commits existed only as a local branch `handoff-soft` (merge-base `7f2e8b1`, tip `3df6adb`). `origin/main` is 147 commits later. Do not diff that branch against `main`; the diff looks like it deletes later game work.

| Commit | Subject | This update |
|---|---|---|
| `301c2f8` | Codex handoff and Tesana audit | **Skipped.** Already on `main` (via `origin/claude/codex-handoff`). |
| `30135e6` | Tesana Max Plan verification; 10 shared-library models pending | **Skipped.** Already on `main`. |
| `ca0fc16` | Final test results and starting commit | **Skipped.** Already on `main`. |
| `122b2aa` | Second-session handoff, music licensing, runbook, homepage patch | **Skipped.** Already on `main`. The runbook's "nothing has been done" line is now marked historical. |
| `c53ac7e` | District floor plan PNG/SVG/`make_map.py` | **Skipped.** Already on `main`. |
| `d6cfc67` | Map: 10 pods, 2×5, terrace by the stairs; walkthrough photo | **Skipped.** Already on `main`. Pods have since moved to the rear (#235); the picture is a map of an older layout. |
| `bb7c045` | Neutral wording (licensing, approvals, readiness) | **Folded** into `CODEX_HANDOFF.md` and `TESANA_ASSET_AUDIT.md`. |
| `3df6adb` | Music rights settled (paid 2025 Riffusion subscription) | **Folded** into `CODEX_HANDOFF.md` and `MUSIC_LICENSING.md`, and corrected for `WEBSITE_PLAYLIST=true` on current `main`. |

Also skipped, because they were a different local branch and not in those two commits: `docs/CYBERPUNK_GAME_KIT_REFERENCE.md` on `docs/cyberpunk-kit-reference`. The verdict is recorded above (the kit would not improve this game's look). The file was not on `origin`.

---

## Historical log

Snapshots from 10–12 Nov 2026, newest first, then the 10 Nov integration note. **Do not follow "read first", "next task", or deploy instructions in this log.** Later snapshots corrected earlier ones (the game API deploy, the Bedroom VR listing, the nightclub being off, draft PR #212). Start here wins.

A correction that is easy to miss: the alley note below says the nightclub module is switched off until its licence is cleared. That was true only until #238. NULL is open.

## 2026-11-12: street taxis in NeoChinatown

- Self-driving cabs drive the avenue and Main Street. Rules: `void-runner/road-taxi-rules.js`. The cab is drawn in code (`void-runner/road-taxi.js`); no model file. The older sky cabs are unchanged.
- Hail one from the V1 map (STREET TAXIS). Stops are the four taxi zones that are already built: Main Street, the avenue, Main Street by the alley, and the passage by the landing pad. Add another later by appending its existing zone id to `REGISTRY` in `road-taxi-rules.js`. See `docs/development/ROAD_TAXIS.md`.
- A person in front of a cab stops it. The fare is the same formula as the sky cabs, stored separately as `story.flags.roadTaxiTrip`.


## 2026-11-12: NULL, the nightclub, is open

- `docs/development/NIGHTCLUB_NULL.md`. The existing club module is now ON for everyone in the game; because the purchased interior model is not published anywhere I can reach, the interior is built in code (`buildOwn()` in `void-runner/ncz-nightclub.js`) with a dance floor, DJ, bar, VIP corner and people. If `nightclub.vrpak` is later published the purchased model is used automatically.
- Street players are still not shared in multiplayer, so the club is solo for now.


## 2026-11-12: the arcade (small, five cabinets) with a playable Blackout Protocol cabinet; free look in the pod

- `docs/development/ARCADE.md`. Five cabinets in a small room off the hallway; the middle one opens the real Blackout Protocol page in a frame (`void-runner/district-arcade.js`). Four placeholder titles are Claude's working names for David to approve.
- Sleeping Pod: free look (mouse capture, drag, arrows) and E/M/V shortcuts (`SLEEPING_PODS.md`).
- David (2026-11-12): for the NULL nightclub, 'use all available assets' (so the purchased club model in `ncz-nightclub.js` and existing nightlife are to be used).
- Gotcha seen three times now: the game page has global styles for `canvas`, `iframe`, `header` and `main`. New overlays must set position/size explicitly and avoid those tag names.


## 2026-11-12: Sleeping Pods moved to the rear of the District

- See `docs/development/SLEEPING_PODS.md`. The hallway now ends in the pod room (z 70.5..78.3, full width); stairs to the terrace moved to its east end; the wardrobe is on its entrance wall; the character creator's stage is in the hallway with the pods behind. The old west room is empty (`arc-*` walls) for the arcade.
- Use `VoidDistrictArea.podBed/podExit/POD_VIEW` for pod positions and view directions; several tests had the old numbers hard-coded and were updated.
- Next for this brief: Tesana fidelity pass on the pod interior, then the 1980s arcade in the old room.


## 2026-11-12: the alley is inhabited

- `void-runner/ncz-alley.js` + alley props and steam in `neochinatown.js`; see `docs/development/ALLEY_LIFE.md`. No sound added.
- NOTE for the nightclub task: a nightclub module ALREADY EXISTS (`void-runner/ncz-nightclub.js`): a purchased 'Cyberpunk Cyber Club' model set into the west side of Main Street where David's map marks 'Nightclub', switched off until its licence is cleared (`?nightclub=1` on a local server with the pack). **Superseded the same day by #238: NULL is open. See Start here.** David has since named the club **NULL** and asked for it across the street and to the right of the alley. Reconcile with him before building a second one.


## 2026-11-12: fishing in Tropical Escape; achievements (browser-kept for now)

- Fishing from the pier in `void-runner/vr-tropical.js`. 'Catch 100 Fish' was added to the EXISTING achievement catalogue (`void-runner/achievements.js`, which unlocks only on server-verified events). Progress is counted in the browser by the new `void-runner/local-progress.js` and shown on the player's own V1 profile as progress, not as an unlock. See `docs/development/ACHIEVEMENTS.md`. (Note for future sessions: `void-runner/achievements.js` and `tests/achievements.test.cjs` already exist; do not create files with those names.)
- Server-side verified events (which actually unlock achievements) are approved and should be built together with the Blackout Protocol leaderboard.


## 2026-11-12: checkpoint fix after VR; Bedroom simulation back and shareable; David's decisions

- BUG FIXED (was live for a few hours): returning from a VR simulation placed the player for a moment at the interior's default spot, the middle of the vestibule, and the new checkpoint sent them out to the street. The checkpoint now ignores a player who APPEARS in the vestibule (any frame not spent walking in that environment disarms it until they step out). `tests/vr-sessions-browser.cjs` caught it.
- 'Play in a Bedroom' is back in the VR arcade and can be a public or private shared session (`shared:true`, `shareOpts`/`fromShare` in `void-runner/vr-suite.js`). Companions are simulated per player, not synchronised.
- David's decisions (2026-11-12): leaderboard/achievement records in the production database are APPROVED (new records only); the nightclub is named **NULL**; the rear stairs are to be RELOCATED (terrace stays reachable) when the Sleeping Pods move there; add a fishing mechanic to Tropical Escape and an achievement 'catch 100 fish in Tropical Escape'.


## 2026-11-12: city map with waypoints; Bedroom simulation removed from the VR menu

- V1 Map app is now a real city map generated from the layout (`void-runner/district-map.js`, `docs/development/DISTRICT_MAP.md`): zoom, pan, places, layers, waypoint with a HUD pointer. Direction only: there is no pathfinding data.
- 'Play in a Bedroom' is no longer offered in the VR arcade (`listed:false` in `void-runner/vr-suite.js`). Its code and companion models are KEPT pending David's decision on deleting them.
- Vestibule scan: the picture behind the scan is the player's own view captured when the doors sealed (so it always matches the direction they face); it is now only lightly dimmed and the status panel sits in a corner.
- QUEUED from David (2026-11-12, large; not started): alley NPCs and atmosphere; Sleeping Pod relocation to the rear stairs + Tesana rebuild (new ZIP supplied); 1980s arcade in the old pod room with a playable Blackout Protocol cabinet; Blackout Protocol level 3 NPC changes, levels 4+ graphics, leaderboard and profile achievements; a nightclub across from the alley; Blender-assisted asset work. See the chat report for the proposed order and the open questions.


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


## Snapshot 2026-11-12 (later): V1 device, hub and game API reported live

- **V1 holographic device is live** (PR #220, squash `8bb8923`; live `BUILD` `2026-11-12-v1-device-1+8bb8923640`). Verified on the live site: L opens it without pausing the world, nine apps listed, empty Mission Log, Esc goes back without opening the game menu, a portrait is rendered from the real character, no page errors. Files: `void-runner/device-v1.js` (rules, registry, saved state, map exploration, profile view-model, portrait keys), `personal-device.js` (screen), `device-portraits.js` (offscreen portraits), tests `tests/device-v1.test.cjs`, `tests/personal-device-browser.cjs`. Camera and Gallery are placeholders. NPC portraits need `NPC_MODELS` in `device-v1.js` filled with real npc-to-model pairs (empty on purpose: none is defined by the game yet). Private messages, friends and discovery are not built.
- **Render, done with David's approval:** game API deployed from `main` (`eeb6989`), `VOID_APPEARANCE_ENABLED=true`; hub `district-hub` runs `main`'s code with `HUB_ACCESS=registered`, `HUB_ALLOWED_UIDS` empty, `HUB_ALLOW_ANY_SIGNED_IN=false` (hub log: "registered accounts, complete District profile required"). The hub service follows branch `claude/character-creator`, which now carries a commit whose tree equals `main`; to update the hub later, either change the service's branch to `main` in the dashboard or repeat that. Pre-reset cloud saves are reported as retired (David accepted the reset).
- **Handle registry** (`blackout_api.py`) synced to the runtime's version (PR #219).
- **Trading stays off:** only the window and a test-only practice ledger exist; real trading needs server-kept inventory and credits (propose a design first).
- **Never verified by anyone yet:** a real sign-in, two real players meeting, chat, and looks syncing online. The sandbox cannot reach Firebase or onrender.com; ask David what he saw.

**Next:** fix whatever David reports from the first real two-player test; pod exit faces a dark wall; master specification Phase 1 (vestibule loading only with both doors closed); Sleeping Pod visual audit against the Tesana ZIP.

## Snapshot 2026-11-12: District runtime update (historical)

PR #217 (squash `56a9a7e`) brought the game runtime, hub and tests from `codex/first-player-experience-repair` (`086f7b2`) onto `main` as one unit; website pages, the homepage ENTER entrance and the favicon were kept from `main`. Verified on https://thedarknetdistrict.com in a real browser: phone gate (2 requests, no game files), ENTER, creator first, **ten personal pods** (pod card: EXIT POD / MUSIC & LIGHTS / LOOK INSIDE), walking, no page errors, no missing files. Live `BUILD` = `2026-11-12-district-runtime-1+56a9a7efc4`.

So the 2026-11-11 list below is partly done: the ten pods and entrance fix are live. District chat code (`void-runner/district-chat.js`) is live too, but only shows when connected to the hub, and the hub on Render still runs `4c60781` with a one-account allow-list and no chat support: **chat does not work online until the hub is redeployed from `main` and `HUB_ACCESS=registered` is set** (David's Render action; see `HUB_RENDER_SETTINGS.md`). Share Links are retired on `main` (files removed).

**Server:** `void_runner_api.py` on `main` now contains `/character`, `/character/appearance` (flag `VOID_APPEARANCE_ENABLED`, off) and the campaign-epoch handling of old cloud saves (`is_current_save`: pre-reset cloud saves are reported as retired, not deleted). **The Render game API has NOT been redeployed** and still runs the 2026-11-01 code. A Render deploy from `main` would now switch that behaviour on: review it with David first.

**Not tested live:** sign-in, cloud saves and purchases (the sandbox cannot reach Firebase). Tests adjusted in #217: older assertions that the homepage has no game entrance were removed or updated; the website Sleeping Pod page still has its own song list (`tests/music-catalog.test.cjs` notes this).

**Next:** (1) V1 device (`claude/v1-device`): fix Esc opening the game menu, port its new files onto `main`, publish. (2) Hub redeploy + registered access for chat. (3) Game API deploy decision. (4) Master specification Phase 1 (vestibule).

## Snapshot 2026-11-11: live state that day (historical)

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
