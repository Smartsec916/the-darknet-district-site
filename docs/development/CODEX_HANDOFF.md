# The Darknet District: handoff to Codex Cloud

**Codex continuation:** The first-test preparation branch now removes Iris from the website Sleeping Pod, shares the hosted 27-song catalog between both players, offers that catalog in the game by default at David's request, and prepares the existing homepage title as the later ENTER link. The older status statements below describe `claude/first-test-readiness` before these changes. See `FIRST_LIVE_TEST_RUNBOOK.md` and `MUSIC_MANAGER_DECISION.md` for the current deployment and music decisions.

**Pod start update:** David subsequently directed that New Campaign begin in a Sleeping Pod. The current development branch wakes a new guest in pod 01 with an explicit Exit Pod control; exiting places the player on open floor in the District pod room. A reload before exiting returns to the pod, while a later save resumes normally inside the District. Older references below to starting in the alley describe the previous build. Character creation, automatic cloud saving, and shared pod allocation remain future work.

Written 2026-11-04 by Claude Code Cloud at David's request. Repository: `Smartsec916/the-darknet-district-site` (live site `https://thedarknetdistrict.com`, GitHub Pages; game API on Render).

**Read first, in this order:** `CLAUDE.md` (the project rules, still correct), `AGENTS.md` (points to `CLAUDE.md`), `VOID_RUNNER_HANDOFF.md` (canon and decision log), then this file, `docs/development/TESANA_ASSET_AUDIT.md`, `docs/void-runner/social-universe-architecture.md` (PR #191) and `docs/SLEEPING-POD-MUSIC.md` (PR #192).

**Standing rules from David that still apply:** do not merge, deploy, delete production data, or buy anything without his explicit approval. Keep every PR open. Do not put the Iris chatbot in the game. Story and world content needs his approval (PROPOSED, APPROVED, REVISE, REJECTED, DEFERRED). He is not reading code: write to him in plain language.

---

## 0. Update: second session (2026-11-04, evening). Read this before the rest

**The starting point has moved.** Start from the tip of branch **`claude/first-test-readiness`** (draft PR #194 against `integration/codex-start`). It is `integration/codex-start` (`71e45fc`) plus the commits below. Nothing was merged to `main`, nothing was deployed, no production data, configuration or secret was touched, no existing PR was closed, and no unverified asset was imported.

| Change | Where | Why |
|---|---|---|
| **Device gate.** Phones, touch-only tablets and browsers without WebGL get a landing page and download **no** game script, stylesheet, model or engine file and register **no** service worker; desktops (including Windows touch machines such as the ROG Ally, Macs, Chromebooks and Linux) start the game exactly as before. A touch-only tablet gets a "try anyway" choice; a phone never does. | `void-runner/device-gate.js`, `void-runner.html` (every game script and stylesheet is inert until the gate releases it), `static/void-runner.html`; tests `tests/device-gate.test.cjs` (9), `tests/device-gate-browser.cjs` (9) | David: the 3D game is desktop-first; phones keep the regular website. |
| **Back to website** button in the main menu; **download an earlier campaign as a backup** button | `void-runner/menu.js` | A way home; a way to keep a file of an old save. |
| **Safer save retirement.** A retired campaign is copied to `...campaign-v1.retired`, then `.retired.2`, `.retired.3` ... , each copy is checked to read back identical, and only then is the active slot freed. If the copy fails the original is left alone and saving is switched off. **This fixes a real data-loss path**: before, a second retired campaign was deleted with no copy kept. | `void-runner/campaign.js` (`retireLegacy`, `retiredKeys`), `game.js`; tests in `tests/legacy-retirement.test.cjs` | David: reversible, non-destructive migration. |
| **Website playlist is OFF by default in the game** (`WEBSITE_PLAYLIST=false`); the pod player then offers **My music** only and works fully. One line turns the 27 songs on. | `void-runner/pod-music.js`; `docs/development/MUSIC_LICENSING.md` | Rights not yet verified (section 9.2). |
| **Homepage unchanged.** The `ENTER THE DARKNET DISTRICT` button (PR #176's homepage change) is now an isolated patch that is **not applied**. `index.html` and `accents.css` are byte-identical to `main`. | `docs/development/homepage-entry/activate-homepage-entry.patch` | David: prepare it, do not publish it. |
| **Unlisting commit** (revert it to list the game): the shop's game equipment card is removed, the game is removed from `sitemap.xml`, and the game page carries `noindex`. The Games page card was already removed by #176. | `store-first-page.html`, `static/store-first-page.html`, `sitemap.xml`, `void-runner.html` | The live site links the old game from three public places today; an unlisted test needs them gone. |
| Small District fixes: the scanner prompt "[E] PRESENT BADGE TO SCANNER" now goes away once the badge is held (it stayed on screen after "Scan accepted"); a quiet "MUSIC" world marker for the pod music screen. | `void-runner/neochinatown.js`, `void-runner/world-markers.js` | Found by looking at the screenshots. |
| Tests retargeted to the new reality: the entrance is checked through the patch, the live homepage is checked unchanged, the smoke test allows only the known decorative teaser downloads, the transition test compares street counts with the largest warm trip. | `tests/*` | See known issue 13 and 14 in section 7. |
| New documents | `docs/development/FIRST_LIVE_TEST_RUNBOOK.md` (what merging triggers, backup, rollback, checklist), `MUSIC_LICENSING.md`, updated `TESANA_ASSET_AUDIT.md` | |

**Commits on the branch (oldest first):**
- `251edd4` First-test readiness: device gate, safer save retirement, back-to-website link, music licensing record
- `6a09407` Keep the homepage exactly as on main; the ENTER THE DARKNET DISTRICT button becomes an isolated, not-applied patch
- `e5f29d9` Unlist the game from public navigation for the first test (one reviewable commit; revert it to list the game again)
- `5be0d4a` Smoke test: the live homepage has no entrance button (it is an isolated patch)
- `c2db80f` Smoke test: allow only the known decorative teaser downloads on the live homepage
- `2ed9789` Docs: first live test runbook; second attempt to verify Tesana terms; AI-output copyright caveat
- `965832a` World marker label for the pod music screen; BUILD for the first-test readiness work
- `6be2799` Hide the scanner prompt once the visitor badge is held; transition test compares with the largest warm trip
- `11144e6` Lighting probe tool; areas browser test counts the pod music screen

**Final GO / NO-GO for the first unlisted live test: CONDITIONAL GO for a desktop-only, unlisted test; NO-GO for publishing the homepage button, and for switching the 27 songs on, until the items below are done.** (details in section 12).

## 1. Executive summary

- **What exists.** A Babylon.js 3D game (VOID//RUNNER) whose first location is now The Darknet District in NeoChinatown: a new campaign starts in the alley outside the District's double doors with no ship and no missions; the player passes a security door into the District interior (hall, bar, VR arcade, vending, sleeping pods, meeting room, stairs), talks to Admin and the in-game Iris, rests in a pod to save, and can walk back out to the street. The street and the interior are separate loaded environments joined by a short transition. Old (pre-reset) campaigns are retired, share links are removed, and the empty landing pad has no invisible collision box. A wall-mounted music player in the sleeping-pod room plays the website playlist or the player's own songs, privately, with a spectrum and music-reactive lights.
- **Where it is.** The work is spread over **17 open pull requests** (a stack of 14, three documentation-only plans, the music player, the handoff, and now PR #194). The whole stack plus the music player is merged into the tested branch `integration/codex-start`, and PR #194 (`claude/first-test-readiness`) adds the second session's work on top. **Start from `claude/first-test-readiness` (section 3).** **Nothing is merged to `main`, nothing is deployed, no production data, configuration or secret was touched, and no PR was closed.**
- **Is it ready for a live test?** For a **desktop-only, unlisted test: conditionally yes** (section 12.5). The phone gate, the way back to the website, the unlisting, safer save retirement and a rollback runbook are done and tested. What remains needs David: back up his save, check the Render setting, run it once on his own PC with a real GPU, and decide the playlist. The homepage button is prepared as an isolated patch and is **not** part of the first test.
- **Not built (documentation only):** multiplayer, the shared-room hub, mobile chat, friends, automatic cloud saves, the session lease, wake-in-a-pod, pod allocation, character customization, shared VR, the Tesana pod re-build. These are in the PR #191 plan.

## 2. Current repository state

### 2.1 `main`
`main` is at `7f2e8b1` ("Merge pull request #175 from Smartsec916/claude/iris-greeting-calibration"). It is the live site. **Merging to `main` deploys to production** (`.github/workflows/pages.yml` runs on every push to `main`).

### 2.2 Open pull requests (verified 2026-11-04)
| PR | Branch | Head commit | Base | Purpose |
|---|---|---|---|---|
| #176 | `claude/enter-the-district` | `e956e3de1` | `main` | Homepage becomes the entrance (ENTER button); game menu changes for the District-first campaign |
| #177 | `claude/mission-reset-new-campaigns` | `75dd65592` | `claude/enter-the-district` | New campaigns have no missions and start outside the District |
| #178 | `claude/hide-kestrel-new-campaign` | `79ae8c329` | `claude/mission-reset-new-campaigns` | No Kestrel on the landing pad in new campaigns |
| #179 | `claude/ship-access-unlock` | `37510d283` | `claude/hide-kestrel-new-campaign` | Dedicated ship-access switch (`shipAccess`) for new campaigns |
| #180 | `claude/environment-separation-plan` | `a577e4202` | `main` | Plan: separate the District interior and NeoChinatown (docs) |
| #181 | `claude/district-entrance-lighting` | `965398694` | `claude/ship-access-unlock` | Light the District entrance (street-only lamps; fixed a high-quality GPU light overflow) |
| #182 | `claude/guest-loading-text` | `0c4272925` | `claude/ship-access-unlock` | District wording on the walking loading screen |
| #183 | `claude/environment-separation-refactor-1` | `b168d20e9` | `claude/ship-access-unlock` | Refactor: separate the interior build from the street build (no behaviour change) |
| #184 | `claude/share-link-guest-policy` | `5cab09c78` | `claude/ship-access-unlock` | Share-link guest policy (**obsolete**: share links removed in #189) |
| #185 | `claude/district-area-builds` | `3450cfec9` | `claude/environment-separation-refactor-1` | Build the street and the interior as separate areas |
| #186 | `claude/multiplayer-chat-plan` | `d3ad12295` | `main` | Plan: shared District server and mobile chat (docs; to be superseded by #191) |
| #187 | `claude/district-transition` | `377e244d1` | `claude/district-area-builds` | Load the interior and the street separately, joined by the security-door transition |
| #188 | `claude/retire-legacy-saves` | `1b9e82d76` | `claude/district-transition` | Retire pre-reset campaigns; the District campaign is the only one |
| #189 | `claude/remove-share-links` | `ddf2266bd` | `claude/retire-legacy-saves` | Remove share links and guest sessions |
| #190 | `claude/pad-hull-collision` | `0087e92d8` | `claude/remove-share-links` | Remove the invisible Kestrel collision box from the empty pad |
| #191 | `claude/social-universe-plan` | `cb90cb871` | `main` | Plan: the social universe (pods, rooms, chat, friends, VR, mobile) (docs) |
| #192 (draft) | `claude/pod-personal-music` | `462ae157d` | `main` | In-game wall-mounted pod music player (draft) |

Notes: the stack uses "base = previous PR's branch", so the PR page for #177 to #190 shows only that PR's own change. `claude/pod-personal-music` (#192) is a **draft** based on `main`. Local-only helper branches `envplan`, `pr176`, `pr177` in the Claude Code container are duplicates and can be ignored.

### 2.3 The integration branches
| Branch | Commit | What it is |
|---|---|---|
| `integration/darknet-district-preview` | `dc986ef` | Everything in #176 to #190 except #184 (obsolete). **Was never pushed before this handoff.** Pushed now so nothing is lost. |
| **`claude/first-test-readiness`** | the tip of the branch (draft PR #194, base `integration/codex-start`) | **Current recommended start.** `integration/codex-start` plus the changes in section 0. |
| `integration/codex-start` | the tip of the branch (code identical to `2d41fae`; later commits are documentation only) | `integration/darknet-district-preview` + PR #192 (pod music), with the wall screen moved into the interior-only build, + the first handoff and the Tesana audit. The base of PR #194. | |

What `integration/codex-start` and `claude/first-test-readiness` do **not** contain: #184 (share-link guest policy; obsolete, see 2.4), #191 (docs only; read it from its branch), and anything newer than the heads above.

### 2.4 PR #184
Share-link guest policy. Share links are retired (`#189`), so the feature is obsolete. The two fixes inside it were kept elsewhere: the invisible Kestrel box (now `#190`) and the boarding-prompt gating on `shipAccess:'none'`, which **the pod-start work (PR 2 in section 12 of #191) must port**. Do not close #184 until David says so.

## 3. Recommended starting branch and commit

**Start from the tip of `claude/first-test-readiness`** (draft PR #194 into `integration/codex-start`; it contains `integration/codex-start` at `71e45fc` and the second session's work). Tested on that tip: see section 6.2. Do **not** start from `main`, and do not re-merge the individual PRs.

```bash
git clone https://github.com/Smartsec916/the-darknet-district-site
cd the-darknet-district-site
git config core.autocrlf false          # many files have mixed or CRLF line endings: never let git rewrite them
git checkout claude/first-test-readiness
git switch -c codex/<topic>             # new work on a new branch from here
```
If David has reviewed and merged PR #194 into `integration/codex-start` first, start from that branch instead (same code).

## 4. PR dependency map and recommended integration order

```
main
 ├─ #176 enter-the-district ── #177 mission-reset ── #178 hide-kestrel ── #179 ship-access-unlock
 │                                                                           ├─ #181 entrance-lighting
 │                                                                           ├─ #182 guest-loading-text
 │                                                                           ├─ #184 share-link-guest-policy (obsolete)
 │                                                                           └─ #183 refactor-1 ── #185 area-builds ── #187 transition
 │                                                                                                                         └─ #188 retire-legacy-saves ── #189 remove-share-links ── #190 pad-hull
 ├─ #180 environment-separation-plan (docs)
 ├─ #186 multiplayer-chat-plan (docs, to be superseded by #191)
 ├─ #191 social-universe-plan (docs)
 └─ #192 pod-personal-music (draft, code)
```

**Overlaps (measured with `git diff --name-only`):** every code PR touches `void-runner.html`, `static/void-runner.html`, `void-runner-sw.js` (the `BUILD` line) and `void_runner_admin_inventory.json`; resolve these mechanically (take one side, re-apply the other's script tag, bump `BUILD`, run `node tools/admin-inventory.cjs`). The real overlaps are in `void-runner/neochinatown.js` (#181, #182, #183, #185, #187, #190, #192), `void-runner/babylon-integration.js`, `world-integration.js`, `vr-core.js` and `campaign.js` (the #187/#188/#190 chain). #176 also changes the homepage and two site pages (see section 10). #191, #186 and #180 touch only docs and conflict with nothing.

**Order if the PRs are merged one at a time** (each needs a fresh `BUILD` and a regenerated inventory): #176, #177, #178, #179, then #180, #186, #183, #185, #187, #188, #189, #190, #181, #182, then #191, then #192 (re-applying the interior-only change described in 2.3). **Recommended instead:** one reviewed PR from `integration/codex-start` to `main` (the work is already combined and tested), leaving the stacked PRs as review history, to be closed only when David says so.

## 5. Completed, unfinished and documentation-only features

| Feature | State | Where |
|---|---|---|
| New campaign starts outside the District, no ship, no missions, empty landing pad | Built, tested | #176 to #179, #190 |
| District entrance lighting (cool lamp over the door, violet trim) | Built, tested | #181 |
| District wording on the walking loading screen | Built | #182 |
| Street and interior built and loaded separately; security-door transitions ("SECURITY CHECKPOINT", "AIRLOCK") | Built, tested low and high | #183, #185, #187 |
| Pre-reset campaigns retired; District campaign is the only campaign; cloud API refuses legacy saves (never deletes) | Built, tested. **Production save reset NOT run** (needs David's final approval) | #188, `tools/reset-void-runner-saves.py`, `docs/void-runner/SAVE-RESET.md` |
| Share links and guest sessions removed | Built | #189 |
| Local preview server for David's PC/ROG Ally | Built (`START-PREVIEW.bat`, `start-preview.sh`, `tools/preview-server.cjs`, `docs/PREVIEW.md`) | integration branch |
| In-game pod music (wall screen, own songs, website playlist, spectrum, reactive lights) | Built; tests in section 6 | #192 |
| Wake in a pod, Exit Pod, ship return, automatic cloud save, session lease | **Documentation only** | #191 sections 5 and 12 |
| Multiplayer hub, rooms, presence, chat, direct messages, friends, directory | **Documentation only** | #191, #186 |
| Mobile social interface | **Documentation only**; see 12.2 | #191 |
| `Guest####` handles and rename | **Documentation only** (a handle system for the site exists: `docs/PUBLIC-HANDLES.md`) | #191 section 3 |
| Character customization, shared avatars, shared VR, shared companions | **Documentation only** | #191 |
| **Device gate:** phones, touch-only tablets and browsers without WebGL get a landing page and download no game file; desktops start as before | Built, tested (unit and emulated browsers); **not tried on a physical phone** | PR #194 |
| **Safe save retirement:** numbered verified copies, a menu download, the slot freed only after the copy checks out | Built, tested | PR #194 |
| **Back to website** button in the main menu | Built, tested | PR #194 |
| **Unlisting** of the game (shop card, sitemap, noindex); homepage **unchanged**; the ENTER THE DARKNET DISTRICT button as an isolated patch | Built, tested; the patch is **not applied** | PR #194 |
| Website playlist **off by default** in the in-game player | Built, tested | PR #194 |
| First live test runbook (what merging triggers, backup, rollback, checklist), music licensing record | Written | PR #194 |
| Pod interior re-build from the Tesana pod | **Audit only** | `TESANA_ASSET_AUDIT.md` |
| Missions, spaceflight, factions, VR arcade, companions, voices | Exist in code from earlier work; missions are intentionally closed for new campaigns (`missionPool:'closed'`); not retested in this handoff | earlier PRs, `VOID_RUNNER_HANDOFF.md` |

## 6. Tests: commands and results

### 6.1 Commands
```bash
npm test                                   # = node --test tests/*.test.cjs  (CI runs the same)
python3 -m unittest tests.test_story_save tests.test_progression_save tests.test_reset_tool    # no extra packages
pip install -r requirements-void-runner.txt && python3 -m unittest tests.test_void_runner_api   # needs stripe
node tests/serve-modern.cjs                # local test host on http://127.0.0.1:5187/void-runner.html (port fixed in the file)
node tests/pod-music-browser.cjs low|high  # in-game pod music (needs the server above; ffmpeg optional)
node tests/district-transition-browser.cjs low|high    # street/interior transitions, leak checks, saved location, legacy retirement
node tests/district-areas-browser.cjs      # area loading
node tests/integration-smoke-browser.cjs   # whole-build smoke (integration branch)
```
Most `tests/*-browser.cjs` launch `channel:'msedge'`, which is not installed in Linux cloud containers: use Chromium with `--use-gl=swiftshader --enable-webgl --ignore-gpu-blocklist --no-sandbox` (Python or Node Playwright; Playwright is at `$(npm root -g)`, set `NODE_PATH`). **All browser results below used software rendering, not a real GPU.**

### 6.2 Results (all on 2026-11-04)
Everything below ran on **`claude/first-test-readiness`** at the commit shown in section 0 (the browser chain ran on `6be2799`; later commits are documentation or test-only and are listed). **All browser results used software rendering (SwiftShader), not a real GPU, and Playwright emulation profiles, not physical devices.**

| Suite | Result |
|---|---|
| `npm test` | **605 tests: 604 pass, 0 fail, 1 skipped** |
| Python save and reset tests (`test_story_save`, `test_progression_save`, `test_reset_tool`) | 25 tests OK |
| `tests.test_void_runner_api` | **15 of 16 pass.** The one failure, `test_actual_stripe_signature_verification`, fails the same way on plain `main` in this sandbox: it has `stripe` 16.1.0 installed while `requirements-void-runner.txt` pins `stripe>=12,<15`. An environment mismatch; CI installs the pinned version. Not run with the pinned version here. |
| Device gate, unit (`tests/device-gate.test.cjs`) | 9 pass |
| **Device gate, browser** (`tests/device-gate-browser.cjs`) | **9/9.** Pixel 7 and iPhone 13 emulation: the landing page, **3 requests in total and none from the game**, no service worker, no sideways scrolling, a working link to the website; a phone asking for the desktop site is still a phone; a phone cannot force its way in; an iPad profile gets the landing page and the "try anyway" choice really starts the game; a desktop (also a 420 px wide window) starts the game and shows the menu; weak hardware starts on Low once and never overrides a player's choice. |
| Pod music, **low** | **21/21** |
| Pod music, **high** | **21/21** on the integrated branch (about 12 minutes of software rendering). On the earlier PR #192 branch: 20/20 at high, the final bug fixes included. |
| Integration smoke, low and high (guest new campaign: no ship, no missions, empty pad; a pre-reset save is retired with a copy kept; old share links open the menu; the mobile homepage) | **Both pass** |
| District transition, **low**, 3 trips | **Pass** (security checkpoint and airlock, no leaks, saved location inside and outside, legacy retirement) |
| District transition, **high**, 6 trips | **Pass** |
| District areas browser | **Pass** at low and high (the interior has 12 interaction points including the pod music screen; the street has 4). |
| **Website navigation** (`tests/site-navigation-browser.cjs`, bundled Chromium): all 12 pages on desktop and phone, keyboard stops and focus, the Sleeping Pod page keeps its music and lighting controls with one Home link, and the real game starts and flies with no website navigation overlay | **Pass: 8 checks, 0 errors** (the only console noise is the shop's existing "ShopifyBuy is not defined") |
| Website Sleeping Pod page (`sleeping_pod.html`, its spectrum script) | Byte-identical to `main`; its own smoke test passed 12/12 earlier on the same page |

**Not run, or not possible here:** the CI "Babylon stabilization smoke" (its script has the port 5187 fixed in it; CI runs it on every PR); `tests/directory-panels-browser.cjs` and the other scripts that launch Microsoft Edge (not installed); anything on a real GPU; a physical phone or tablet; Firefox and Safari; the Render API with a real database; real Firebase login; the live site; a gamepad.

## 7. Known bugs and risks

| # | Issue | Real bug or test artefact | Notes |
|---|---|---|---|
| 1 | High-graphics tier is at the GPU limit on lights (`GL_MAX_VERTEX_UNIFORM_BUFFERS` 14). PR #181's two extra lamps pushed the District interior from 12 to 14 lights and broke shader compilation; fixed in #181 by building them only for the street. **Any new light in the interior can break high.** | Real, fixed; remains a standing constraint | Pod re-build must not add lights (see audit). |
| 2 | ~~The game page did not stop phones~~ | **Fixed** by the device gate (section 0) | Needs a check on a real phone. |
| 3 | ~~The game had no link back to the normal website~~ | **Fixed**: a Back to website button in the main menu | |
| 4 | Homepage: PR #176's entrance button | **Isolated as a not-applied patch** (section 10) | |
| 5 | Licensed city-pack buildings and the neon vending model are not in the repository (private repo `void-runner-licensed-assets`, injected by the Pages build); local preview shows stand-ins | Expected | Real look only on the deployed site or with the private assets. |
| 6 | 404 retries for missing licensed models add about 11 s to local loads | Expected locally | |
| 7 | District transition test counts: see 6.2 | Test artefact | |
| 8 | `static/sleeping_pod.html` is older than `sleeping_pod.html` and `static/` has no spectrum script | Pre-existing; `static/void-runner.html` must stay byte-identical to `void-runner.html` (a test enforces it) but other `static/` pages are not mirrored | Do not "fix" without asking. |
| 9 | Website Sleeping Pod playlist includes titles with strong language and "(Cover)" tracks, publicly served from `attached_assets/` | Licensing and age-policy question, not a code bug | Section 12. |
| 10 | In the Claude container `git push` appeared not to set a local remote-tracking ref (a hook complained); fixed by adding a fetch refspec | Environment | Ignore. |
| 11 | GitHub GraphQL is blocked in Claude sessions (`gh pr create` fails); use `gh api repos/.../pulls` | Environment | |
| 12 | Pod music: very slow software rendering at high needs scaled waits in `tests/pod-music-browser.cjs`; the test scrolls controls to the middle because the game's fixed footer covers the bottom 72 px of any panel | Test and layout notes | Panels need bottom padding (done in #192). |
| 13 | **The live homepage's Void Runner teaser downloads the 3D engine and five game modules for every visitor, phones included** (`void-runner-backdrop.js`), for a decorative backdrop. Not changed (the homepage is untouched by design). Applying the homepage entry patch removes the teaser and this download. A tiny alternative if the homepage must change first: make `void-runner-backdrop.js` return early on touch-only devices. | Real, pre-existing, live | `tests/integration-smoke-browser.cjs` now allows exactly these six downloads and nothing else. |
| 14 | The District transition test's street-count rule (25 percent over the smallest of the first two trips) failed on noise: counts 501, 749, 811 with the interior exactly stable (449) | **Test artefact, fixed**: compared with the largest warm trip; a real leak (40 percent or more a trip) still fails | |
| 15 | Before this session a second retired campaign was **deleted without a copy** | **Real, fixed** (numbered verified copies) | `tests/legacy-retirement.test.cjs` |
| 16 | The "[E] PRESENT BADGE TO SCANNER" prompt stayed on screen after the badge was issued | **Fixed** | `tests/district-areas.test.cjs` |
| 17 | The live site links the old game from three public places (Games page, shop equipment card, `sitemap.xml`) | Handled by the unlisting commit; **reverting that commit lists the game again** | |
| 18 | Interior lighting: see section 12.3 | Investigated, **not changed** | |

## 8. Development setup
- **Static site, no build step.** Game scripts are classic (non-module) scripts loaded in order by `void-runner.html`; order matters. Babylon 8.26 is in `void-runner/vendor/`.
- **Game rules** in `CLAUDE.md`: preserve CRLF where files have it (check with `file <path>`), bump `BUILD` in `void-runner-sw.js` whenever a game file changes, run `node tools/admin-inventory.cjs` after (a test enforces it), keep `static/void-runner.html` identical to `void-runner.html`, update `void-runner/save-manifest.json` when ids are added, never rename internal ids (`earth`=NeoChinatown, `sol`=Tessaly System, `undertow`→`rusthaven`).
- **Local game:** `node tests/serve-modern.cjs` then `http://127.0.0.1:5187/void-runner.html`. Or the no-cost preview: `START-PREVIEW.bat` / `./start-preview.sh` / `node tools/preview-server.cjs` (serves only static files, `/api/*` returns 503, 127.0.0.1 only; see `docs/PREVIEW.md`). Network services show "offline": expected.
- **Python APIs** (`server.py`, `void_runner_api.py`, `void_runner_progression.py`, `identity_api.py`, `blackout_api.py`) run on Render (not in this repo's Pages site). Cloud saves are validated by `clean_save()`. Campaign epoch `CAMPAIGN_EPOCH` is in `campaign.js` and `void_runner_api.py`; raise it only for another deliberate reset.
- **Voices:** never change approved voices (`tools/audio/npc-voice-registry.json`). Do not invent Relay broadcasts.
- **Do not touch** `blackout-protocol/`, `origins/` and other pages while working on the game.

## 9. Tesana audit
`docs/development/TESANA_ASSET_AUDIT.md`. Summary: **inspected, nothing imported.** Textures are CC0 and clear; the 17 AI-generated GLB models carry no licence file; David has verified that his Tesana Max Plan gives full ownership and commercial rights (section 9.1), which covers the 7 models generated in his own projects, while the **10 shared-library models stay pending per-asset verification**; the characters have no animations and cannot use our Mixamo clips; the pod's wear, geometry, bedding, light presets, vending machine and synth music are the valuable parts and must be re-written for Babylon with a re-lit scene (its ~13 lights exceed our budget). PR #192's music player is our own code, not Tesana's.

## 9.1 Tesana licensing status (updated 2026-11-04 after David's verification)

**How this was verified.** David reported that he read Tesana's official pages and that they state the **Max Plan includes all Pro benefits, including full ownership and commercial rights**. The sources he named are:
- https://tesana.com/pricing
- https://docs.tesana.ai/support/faq
- https://docs.tesana.ai/building/exports

**Claude Code could not open any of these three pages**: `tesana.com` and `docs.tesana.ai` are outside the Claude session's allowed network domains (the lookup failed), so their wording was **not** independently re-read and is **not quoted here**. "Verified" below therefore means *verified by David against the official pages*. Whoever picks this up with network access should open the three URLs, copy the exact clauses into this file with the date, and check them against the table. If David wants Claude Code to read them, the two hosts must be allowed in the session's network settings.

Two different questions are kept apart:

| What | Status | Basis |
|---|---|---|
| **The games and what David built on Tesana** (the Sleeping Pod project and the spaceflight project: their source code, the scenes and the assets he generated in his own projects) | **Verified by David: rights covered.** Max Plan includes the Pro benefits, with full ownership and commercial rights. | The three official URLs above. Exact clause text not yet recorded in the repository. |
| **The 7 models generated inside David's own project** (`captain`, `elara`, `flying_taxi`, `freighter`, `pirate_fighter`, `player_ship`, `meridian_station`; their own generation ids in `.tesana/asset-gen-ledger.json`) | **Covered at plan level, per David's verification.** Not yet recorded clause by clause. They remain **unimported**. | Same sources. |
| **The 10 models from Tesana's shared library** (`library:` task ids in `.tesana/asset-gen-ledger.json`): characters `iris`, `kai`, `mara`, `marcus`, `nadia`, `pedestrian_a`, `pedestrian_b`, `rook`, `seren`, and the prop `satellite` | **PENDING VERIFICATION, per asset.** A plan statement that David owns what he builds and may use it commercially does not by itself say what licence a *shared-library* item carries, or whether the library's original creator or Tesana grants the same rights for items taken from it. No per-asset licence has been shown. | Needs one of: the library's own licence terms, a per-asset licence line, or written confirmation from Tesana support, recorded with the URL and date. |
| **Textures** (11 CC0 material sets, ambientCG) | **Verified from the files**: every `material.json` says `"license": "CC0 (AmbientCG)"`. | The ZIP contents themselves. |
| **AI mood images** (`title_bg.jpg`, `holo_ad.jpg`) and store art | Not covered by anything above. Not wanted. | n/a |

**What changes in practice.** The licence is no longer the reason to reject the seven non-library vehicles, captain, elara and the station: they are rejected or held for *other* reasons in `TESANA_ASSET_AUDIT.md` (Kestrel and Meridian are canon, our CC0 ships already fill those roles, NPC identities must not change without approval, no animations). The ten shared-library models, including the two background pedestrians the audit flags as the most useful (`pedestrian_a`, `pedestrian_b`), **stay blocked until each is verified**. Nothing was imported, removed, replaced or modified as part of this verification, and nothing was merged or deployed.

## 9.2 Music: the 27-song playlist (details in `docs/development/MUSIC_LICENSING.md`)
- All 27 songs are David's own, made with Riffusion / Producer.ai; "(Cover)" is Riffusion's label for his own remixes and is treated as such. Nothing suggests third-party compositions, and none was assumed.
- David has a receipt for a paid **Starter** plan for **17 March to 17 April 2026**. **GitHub's history shows every one of the 27 songs was already in the repository between 19 May and 10 August 2025**, seven to ten months before that period. So the receipt **does not cover the period when the songs were made**. What plan David held in 2025 is unknown and needs his account history.
- Riffusion's own terms could not be opened from the Claude session; secondary sources say free-tier output is non-commercial, paid plans give a licence (not ownership), and a later subscription is not retroactive. **Treat commercial rights as unverified.**
- Explicit lyrics are not a reason to remove a song; they belong to the age policy, recorded separately.
- **In the game the website playlist is OFF by default** (`WEBSITE_PLAYLIST=false`, `void-runner/pod-music.js`); "My music" is fully usable without it. One line, or `?sitemusic=1` / a local flag for testing in your own browser, turns the 27 songs on. The website's own player is unchanged, and the files stay public on the site as before.

## 10. Homepage entrance: prepared, NOT published
**David's latest wording:** the future homepage entry button must read **ENTER THE DARKNET DISTRICT**; it replaces the old Void Runner promotional entry **when approved**; it keeps the existing navigation; it works on desktop and mobile; there is **no second game entry or conflicting route**. (This supersedes the earlier idea of making the title graphic itself clickable with a small ENTER tag. One entrance only. Ask David if he also wants the title graphic to link to the same address.)

**State.** PR #176's homepage change is exactly that button (it replaces the "Void Runner / under construction" teaser, adds the line "No account needed. Guest progress stays in this browser." and a Log in link). It is **not on this branch's homepage**: it is saved as `docs/development/homepage-entry/activate-homepage-entry.patch`. `index.html` and `accents.css` are byte-identical to `main`, so merging this branch does not publish the button.

**What the patch touches:** only `index.html` and `accents.css`. It applies cleanly to `main`'s files (checked by `git apply`, and by tests). It also removes the teaser's `void-runner-backdrop.js` (and with it the 3D download on phones, known issue 13).

**Checked visually** (desktop 1440x900 and a Pixel 7 phone, side by side with the live page, patched copy served from a scratch folder): the button uses the site's cut corners and green glow, sits where the teaser was, does not overflow on a phone, and the navigation is unchanged.

**To activate (Codex, after David's approval):** `git apply docs/development/homepage-entry/activate-homepage-entry.patch`. The three tests that read the entrance through the patch (`tests/darknet-entrance.test.cjs`, `tests/share-links-removed.test.cjs`, and the smoke test's mobile-home step) must then read `index.html` directly; each says so. Then run `npm test` and the site-navigation browser test.

**Phones:** the button leads to `void-runner.html`, where the device gate shows the landing page (no 3D, no game download, a link back). If David prefers, the button can also be hidden on phones with a small script that uses the same device test (`void-runner/device-gate.js` exports `classify`).

## 11. First playable website milestone

"**Desktop Darknet District, unlisted.**" On a desktop browser, opened by typing the game's URL (not linked from the homepage): choose New (guest, no account), start in the alley, walk, enter the security door, see the District interior, talk to Admin and Iris, rest in a pod (saves locally), play music at the pod-room wall screen, walk back out, reload and Continue, and return to the normal website from the menu. No missions, spaceflight, multiplayer or mobile.

## 12. Deployment readiness assessment (updated)

### 12.1 Desktop 3D test
| Item | Status | Evidence / gap |
|---|---|---|
| Desktop launch | **Ready** | Smoke, transition, areas and navigation suites at low and high; real-GPU run still needed (12.5). |
| Guest entry | **Ready** | Smoke: a new local campaign with no ship, no missions, an empty landing pad. |
| Account entry and cloud saves | **Unverified live** | Needs Firebase and the Render API, unreachable from the sandbox. The API change is in `FIRST_LIVE_TEST_RUNBOOK.md`; whether Render redeploys on merge is **not in the repository** and David must check. |
| Server and session selection | **Not built** (documentation only, PR #191). The test is single-player. | |
| Arrival at the District security entrance | **Correct as is: kept.** A new campaign starts in the alley at local (0, 17), three metres before the outer security door (door at local z 20), facing it. | Smoke test "new campaign". |
| Double doors, vestibule, transition | **Ready.** Screenshots reviewed: SECURITY CHECKPOINT, the interior hall with its neon and VR / ARCADE sign, the AIRLOCK panel, the alley. | #187; 3 trips at low, 6 at high. |
| Admin, Iris (in-game), NPCs, VR Play, shop, vending, sleeping pods, meeting room | **All present as interaction points** (12 inside); NPC answers are short notices, no missions by design | `tests/district-areas.test.cjs`. |
| Wake in a pod | **Not built** (PR 2 of #191). Resting in a pod saves. | Acceptable for the first test. |
| NeoChinatown street | **Ready**, with stand-ins for licensed buildings locally | |
| Persistence without damaging saves | **Ready**: verified numbered backups; menu download; runbook backup procedure | Section 12.4. |
| Pod music | **Ready**; website playlist off by default | |
| Return to the website | **Ready**: "Back to website" in the main menu | |
| Phones and tablets | **Ready in emulation**; not tried on a physical phone | Device gate. |
| Unlisted | **Done in one commit** (shop card, sitemap, noindex; Games page already unlisted). The homepage still shows the Void Runner teaser, which links nowhere. | Revert the unlisting commit to list the game. |

### 12.2 Desktop versus phones and tablets (David's rule)
The game is **desktop-first**. The device gate (section 0) decides with several signals together (pointer type, screen size, platform, user agent, input hardware, cores and memory, WebGL), never width or user agent alone, and a small desktop window is still a desktop.
- **Desktop and Windows touch machines (the ROG Ally, Surface), Macs, Chromebooks, Linux:** the game, keyboard and mouse, the existing gamepad support, and Low graphics chosen once for weak hardware (never over a player's own choice).
- **Phones:** never the game; a landing page that says so, links back to the website, and **does not claim social features exist**.
- **Tablets:** touch-only tablets get the landing page with a "try anyway" choice; a tablet with a mouse or trackpad, at least 4 cores and 4 GB is let in. (David asked to allow suitable devices where practical: confirm this policy.)
- **Browsers without WebGL:** an explanation and the way back.
- **Mobile social features** (global chat, direct messages, friends, player directory, notifications): **documentation only** (PR #191 section 12, items 3, 4, 6, 7, 8). They depend on the hub skeleton and authentication, `Guest####` identities, chat with baseline safety and the age policy. **No code exists. The desktop test does not wait for them.**

### 12.3 Performance and lighting (software rendering only; no GPU numbers exist)
| Measure (transition test) | Low | High |
|---|---|---|
| Street: meshes / materials / textures / lights / scene nodes (varies with the random pedestrians, so a range over the trips) | 439 to 467 / 213 / 191 to 194 / 3 / 749 to 935 | 540 to 622 / 214 / 205 to 214 / 6 / 1309 to 1867 |
| Interior: meshes / materials / textures / lights / scene nodes (identical on every trip) | 234 / 164 / 56 / 2 / 449 | 234 / 164 / 59 / 12 / 449 |
- **Lighting investigation (the "about 13 lights" question).** The 13-light figure is the **Tesana pod's** lighting, not the game's. The game's District interior has, at high graphics, **10 point lights plus the sun and one ambient light (12 in total)** and **none at low** (just the two scene lights). The pod room has a single pink lamp. Measured with `tools/lighting-probe.cjs` on the real interior at high graphics: the scene has 12 lights; **all 157 rendered surfaces use Babylon's default of 4 lights per material**, and each lists all 12 lights as sources but **compiles only the first four**: the ambient light, the sun, and the two point lights nearest the entrance, at (0, 23) and (-10, 36). **The other eight point lights, including the pod room's pink lamp (the 9th light), the bar, shop and VR lights and the two hall lights, light none of those surfaces.** At low there are no point lights at all. This matches the screenshots: the pod wall is dark apart from its glowing hatch rings, so the mood comes from emissive neon, signs and rings, not from the lamps. Consequences: (1) removing the eight inactive lights would change nothing on the static scenery, and adding lights would light nothing and would raise the GPU risk (known bug 1); (2) the music-reactive pod lighting works through emissive materials (the new wall strip, the ceiling panels, the pod glow), which is why it is visible; the pod lamp's reaction is not; (3) the real improvement is to choose lights **by area**: split the merged static meshes per room and give each room its own lights with `light.includedOnlyMeshes`, or put the mood into emissive and lightmap textures; both are larger changes that need measurement on a real GPU, so **none was made**. The Tesana pod's roughly 13 lights must be reworked the same way. (Why two extra entrance lamps once broke the high tier with a uniform-buffer overflow is not explained by these numbers and was not investigated further.)
- **Lower-resolution desktops:** the music panel and layouts were checked at 1280x720 and the transition tests at 1100x640; the game's fixed footer covers the bottom 72 px of any panel (panels have bottom padding). 1366x768, 1024x600 and display scaling were not checked.

### 12.4 Deployment, safety and rollback
The full account is in **`docs/development/FIRST_LIVE_TEST_RUNBOOK.md`**: what a merge to `main` triggers (GitHub Pages publishes automatically; Iris and Neon are not affected; the game API's Render deploy setting is **unknown and needs David**), the service-worker and storage effects, the backup and restore procedure, rollback of code **and** browser state, and the checklist. Key points: use the existing `/void-runner.html` (no `/district-test/` copy; it would need its own service-worker scope and would still share saves); revert the merge commit to roll back the site; **reverting code does not restore browser storage or caches**, so back up first and use the restore snippet.

### 12.5 GO / NO-GO
**CONDITIONAL GO** for the first unlisted **desktop** test at `/void-runner.html`, on these conditions (all need David, none has been done):
1. **Back up the local save** first (runbook section 3).
2. **Check the Render setting** for the game API (Auto-Deploy on or off, which branch). Merging to `main` publishes the website either way.
3. **Run the game once on his own PC and on the ROG Ally** from a local copy (`START-PREVIEW.bat`) and read the frame rates at Low and High and the look of the licensed buildings. Every number so far is software rendering.
4. **Decide the playlist.** The default (27 songs off in the game, My music on) is safe. Switching them on waits for the Riffusion evidence (section 9.2): every song predates the paid receipt.
5. Confirm the **unlisting commit** and the **tablet policy**.

**Why GO:** every automated suite passes on the final branch (section 6.2); the game starts and plays through the new device gate in a desktop browser at low and high; phones get a landing page with no game download; a second retired campaign can no longer be lost; the game links home; the homepage is unchanged; Iris, Neon and production data are untouched; rollback is documented, including browser state.

**Why not more than conditional:** no real GPU, phone, Firefox or Safari was available; the device gate rewrites how the page loads its scripts (it writes them back in order with `document.write`, which Chromium handles; other browsers are untested); the game API's deploy behaviour is unknown; and music rights are unverified. **This turns to NO-GO if** item 3 shows unplayable frame rates at Low on the target PC, if the browser console shows errors on the live page after deploy, or if the Render API rejects a guest or account save in a way the runbook does not cover.

## 13. Architecture decisions from PR #191 (`docs/void-runner/social-universe-architecture.md`, revision 2)
Confirmed by David on 2026-11-04 (D1 to D10): every player has a display handle, picked or an automatic `Guest####`, never the database identity (an immutable internal id); development is local and free first, no paid hosting, the single Node hub is the accepted direction and the roughly $7 a month figure is **not** approved; automatic account-bound saving is a priority and every full 3D login starts in an available Sleeping Pod with the ship at the landing zone and no restored location; persistent social features need an authenticated identity and a local guest mode stays separate; one active 3D session per account (a newer login replaces the older one) while a mobile chat connection never ends a desktop game; multiplayer is strictly social, no shared combat or mission progress, shared companion state belongs to the session; chat safety from the beginning and public chat stays off until safeguards exist; build the pod allocator before the hallway geometry (the final hallway waits for David's floor plan); reuse existing character assets and no purchases; keep #184 until its fixes are moved.

Open and needing David: **age policy (blocks launch)**; hosting for a public launch; illegal cargo at the landing zone; handle rename cooldown; moderation staffing; privacy defaults; the District floor plan.

Effort: the old 65 working days is a planning range (50 to 85), not a commitment.

## 14. Deferred multiplayer features (do not start)
Hub skeleton, auth and rooms; global, location and direct chat with block, report and rate limits; presence and Players Online directory; friends and invitations; shared avatars and customization; public and private VR sessions; shared companions; more station interiors; modular pod hallway; the **mobile chat page**. First two PRs when David approves: **(1) automatic account-bound saving with a session lease; (2) pod start and ship return** (replaces the location-resume code in #187 and #188 and ports the boarding-prompt gating from #184). Plan: #191 sections 5, 7 and 12.

## 15. Required approvals (none given for these)
1. **Merging anything into `main`** (this deploys the live site; and the game API too if its Render service auto-deploys from `main`; David checks that setting first).
2. Review and merge of draft PR #194 into `integration/codex-start` (not `main`).
3. **The website playlist:** keep it off in the game (default), or switch it on. Rights are unverified (section 9.2): David's 2025 Riffusion / Producer.ai receipts and song library dates are needed.
4. **Applying the homepage patch** (section 10): wording, and whether the title graphic should link too.
5. **The unlisting commit** (removes the shop's equipment card and the sitemap entry; adds noindex): keep for the test or revert.
6. **Tablet policy:** the landing page with a "try anyway" choice, with capable tablets let in.
7. **Production save reset** and any deletion of records (exact list and backup first). Not run.
8. The **age policy**, hosting for a public launch, vending machine content, and per-asset licences for the **10 Tesana shared-library models**.
9. Closing PRs (#184, #186, anything else). None closed.
10. Raising the campaign epoch; any new voice, Relay broadcast, story or mission content.

## 16. First suggested Codex tasks (small, in order)
1. Read this file, `FIRST_LIVE_TEST_RUNBOOK.md` and `MUSIC_LICENSING.md`. Check out `claude/first-test-readiness`, run `npm test` and the browser commands in 6.1 (use a different port for the second checkout).
2. With David: back up his save (runbook section 3); ask him to read the Render setting; decide the playlist; confirm the tablet policy and the unlisting commit.
3. David's own-PC checks (runbook section 7): real frame rates at Low and High, the licensed buildings, Windows scaling, a gamepad.
4. When David says go: open **one** PR from the branch to `main`; read the PR build and the three CI checks; **do not merge**.
5. Afterwards, on separate branches: apply the homepage patch; then PR 1 and PR 2 of #191 (automatic saves with a session lease; wake in a pod); then the lighting work in 12.3.

