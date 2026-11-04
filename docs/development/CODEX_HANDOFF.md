# The Darknet District: handoff to Codex Cloud

Written 2026-11-04 by Claude Code Cloud at David's request. Repository: `Smartsec916/the-darknet-district-site` (live site `https://thedarknetdistrict.com`, GitHub Pages; game API on Render).

**Read first, in this order:** `CLAUDE.md` (the project rules, still correct), `AGENTS.md` (points to `CLAUDE.md`), `VOID_RUNNER_HANDOFF.md` (canon and decision log), then this file, `docs/development/TESANA_ASSET_AUDIT.md`, `docs/void-runner/social-universe-architecture.md` (PR #191) and `docs/SLEEPING-POD-MUSIC.md` (PR #192).

**Standing rules from David that still apply:** do not merge, deploy, delete production data, or buy anything without his explicit approval. Keep every PR open. Do not put the Iris chatbot in the game. Story and world content needs his approval (PROPOSED, APPROVED, REVISE, REJECTED, DEFERRED). He is not reading code: write to him in plain language.

---

## 1. Executive summary

- **What exists.** A Babylon.js 3D game (VOID//RUNNER) whose first location is now The Darknet District in NeoChinatown: a new campaign starts in the alley outside the District's double doors with no ship and no missions; the player passes a security door into the District interior (hall, bar, VR arcade, vending, sleeping pods, meeting room, stairs), talks to Admin and the in-game Iris, rests in a pod to save, and can walk back out to the street. The street and the interior are separate loaded environments joined by a short transition. Old (pre-reset) campaigns are retired, share links are removed, and the empty landing pad has no invisible collision box. A wall-mounted music player in the sleeping-pod room plays the website playlist or the player's own songs, privately, with a spectrum and music-reactive lights.
- **Where it is.** All of this is spread over **16 open pull requests** (a stack of 14, plus 3 docs-only plans, plus the music player). I merged the whole stack, plus the music player, into **one tested integration branch: `integration/codex-start`**. That is your starting point. **Nothing is merged to `main`, nothing is deployed, no production data was touched.**
- **Is it ready for a live test?** For a **desktop-only unlisted test: nearly.** Three small things must happen first (a phone gate in the game page, a link back to the normal website, and a decision on the website playlist's music). See section 12. The homepage graphic ENTER change is the next task (section 10) and is **not** part of the first test.
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
| **`integration/codex-start`** | **`{{START_COMMIT}}`** | `integration/darknet-district-preview` + PR #192 (pod music), with the wall screen moved into the interior-only build, + this handoff and the Tesana audit. **Recommended start.** |

What `integration/codex-start` does **not** contain: #184 (share-link guest policy; obsolete, see 2.4), #191 (docs only; read it from its branch), and anything newer than the heads above.

### 2.4 PR #184
Share-link guest policy. Share links are retired (`#189`), so the feature is obsolete. The two fixes inside it were kept elsewhere: the invisible Kestrel box (now `#190`) and the boarding-prompt gating on `shipAccess:'none'`, which **the pod-start work (PR 2 in section 12 of #191) must port**. Do not close #184 until David says so.

## 3. Recommended starting branch and commit

**Start from `integration/codex-start` at `{{START_COMMIT}}`.** Reasons: it already contains the 14-PR stack and #192, merge conflicts are resolved, the Node suite passes there, and the in-game browser checks listed in section 6 were run on it.

```bash
git clone https://github.com/Smartsec916/the-darknet-district-site
cd the-darknet-district-site
git config core.autocrlf false          # many files have mixed or CRLF line endings: never let git rewrite them
git checkout integration/codex-start
git switch -c codex/<topic>             # new work on a new branch from here
```

Do **not** start from `main` (it lacks all of this), and do not re-merge the individual PRs: the integration branch already did, and re-merging reintroduces the conflicts that were resolved.

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
| Mobile social interface | **Documentation only**; see 13 | #191 |
| `Guest####` handles and rename | **Documentation only** (a handle system for the site exists: `docs/PUBLIC-HANDLES.md`) | #191 section 3 |
| Character customization, shared avatars, shared VR, shared companions | **Documentation only** | #191 |
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
| Suite | Branch | Result |
|---|---|---|
| `npm test` | `integration/codex-start` | **{{NODE_RESULT}}** |
| `npm test` | PR #192 branch | 531 pass, 0 fail, 1 skipped |
| Python save and reset tests | `integration/codex-start` | 25 tests OK |
| `tests.test_void_runner_api::test_actual_stripe_signature_verification` | plain `main` | Fails in the Claude sandbox on plain `main` too (environment); CI passes it. Not run elsewhere. |
| Integration smoke, low and high | `integration/darknet-district-preview` | Pass |
| CI stabilization smoke | same | Pass (one run flaked on timing; rerun passed) |
| District areas browser | same | Pass |
| District transition, low | same | Pass |
| District transition, high | same | Passed a 6-trip run. A 3-trip run failed the test's own 25 percent allowance on the street's node count (1495, 1495, 1991); the count swings about plus or minus 20 percent with random pedestrians and returned to earlier values: **test noise, not a leak**. Suggested: loosen to about 40 percent (it is #187's test). |
| In-game pod music, low | PR #192 branch | **20/20** |
| In-game pod music, high | PR #192 branch, final commit `462ae157` | **{{HIGH_RESULT}}** |
| In-game pod music, low | `integration/codex-start` | **{{POD_INTEG_LOW}}** |
| Website Sleeping Pod smoke test | PR #192 branch vs `main` | 12/12 on both (page unchanged) |

**Not run:** the full set of other browser scripts on the integration branch; anything with a real GPU; Firefox or Safari; any phone; the Render API with a real database; real Firebase login; the live site.

## 7. Known bugs and risks

| # | Issue | Real bug or test artefact | Notes |
|---|---|---|---|
| 1 | High-graphics tier is at the GPU limit on lights (`GL_MAX_VERTEX_UNIFORM_BUFFERS` 14). PR #181's two extra lamps pushed the District interior from 12 to 14 lights and broke shader compilation; fixed in #181 by building them only for the street. **Any new light in the interior can break high.** | Real, fixed; remains a standing constraint | Pod re-build must not add lights (see audit). |
| 2 | The game page does not stop phones: `unified-controls.js` gives touch devices on-screen controls and the game starts | Real; **blocker for the live test** | Section 12. |
| 3 | The game has no link back to the normal website | Real; **blocker** | Section 12. |
| 4 | Homepage: PR #176 replaces the Void Runner teaser with a separate ENTER button; David now wants the title graphic itself to be the entrance | Design conflict | Section 10. |
| 5 | Licensed city-pack buildings and the neon vending model are not in the repository (private repo `void-runner-licensed-assets`, injected by the Pages build); local preview shows stand-ins | Expected | Real look only on the deployed site or with the private assets. |
| 6 | 404 retries for missing licensed models add about 11 s to local loads | Expected locally | |
| 7 | District transition test counts: see 6.2 | Test artefact | |
| 8 | `static/sleeping_pod.html` is older than `sleeping_pod.html` and `static/` has no spectrum script | Pre-existing; `static/void-runner.html` must stay byte-identical to `void-runner.html` (a test enforces it) but other `static/` pages are not mirrored | Do not "fix" without asking. |
| 9 | Website Sleeping Pod playlist includes titles with strong language and "(Cover)" tracks, publicly served from `attached_assets/` | Licensing and age-policy question, not a code bug | Section 12. |
| 10 | In the Claude container `git push` appeared not to set a local remote-tracking ref (a hook complained); fixed by adding a fetch refspec | Environment | Ignore. |
| 11 | GitHub GraphQL is blocked in Claude sessions (`gh pr create` fails); use `gh api repos/.../pulls` | Environment | |
| 12 | Pod music: very slow software rendering at high needs scaled waits in `tests/pod-music-browser.cjs`; the test scrolls controls to the middle because the game's fixed footer covers the bottom 72 px of any panel | Test and layout notes | Panels need bottom padding (done in #192). |

## 8. Development setup
- **Static site, no build step.** Game scripts are classic (non-module) scripts loaded in order by `void-runner.html`; order matters. Babylon 8.26 is in `void-runner/vendor/`.
- **Game rules** in `CLAUDE.md`: preserve CRLF where files have it (check with `file <path>`), bump `BUILD` in `void-runner-sw.js` whenever a game file changes, run `node tools/admin-inventory.cjs` after (a test enforces it), keep `static/void-runner.html` identical to `void-runner.html`, update `void-runner/save-manifest.json` when ids are added, never rename internal ids (`earth`=NeoChinatown, `sol`=Tessaly System, `undertow`→`rusthaven`).
- **Local game:** `node tests/serve-modern.cjs` then `http://127.0.0.1:5187/void-runner.html`. Or the no-cost preview: `START-PREVIEW.bat` / `./start-preview.sh` / `node tools/preview-server.cjs` (serves only static files, `/api/*` returns 503, 127.0.0.1 only; see `docs/PREVIEW.md`). Network services show "offline": expected.
- **Python APIs** (`server.py`, `void_runner_api.py`, `void_runner_progression.py`, `identity_api.py`, `blackout_api.py`) run on Render (not in this repo's Pages site). Cloud saves are validated by `clean_save()`. Campaign epoch `CAMPAIGN_EPOCH` is in `campaign.js` and `void_runner_api.py`; raise it only for another deliberate reset.
- **Voices:** never change approved voices (`tools/audio/npc-voice-registry.json`). Do not invent Relay broadcasts.
- **Do not touch** `blackout-protocol/`, `origins/` and other pages while working on the game.

## 9. Tesana audit
`docs/development/TESANA_ASSET_AUDIT.md`. Summary: **inspected, nothing imported.** Textures are CC0 and clear; the 17 AI-generated GLB models carry no licence file and fail our policy until David's Tesana Max Plan terms are read and recorded; the characters have no animations and cannot use our Mixamo clips; the pod's wear, geometry, bedding, light presets, vending machine and synth music are the valuable parts and must be re-written for Babylon with a re-lit scene (its ~13 lights exceed our budget). PR #192's music player is our own code, not Tesana's.

## 10. Homepage ENTER: implementation requirements (next Codex task, not done)

**David's request.** The large "THE DARKNET DISTRICT" graphic on the homepage becomes the entrance to the 3D game. Keep its look, size, placement, typography and effects exactly. The whole graphic area is clickable. A small label reading **ENTER** sits at the graphic's upper-left edge, slightly overlapping or just above it, in a restrained cyberpunk/terminal style (no cursive, handwritten or orange script), clearly visible but not overpowering the title. Clicking either launches the game's entry flow. Keyboard accessible with visible focus. The mobile layout and the existing mobile website are preserved, site navigation is preserved, and **phones must not launch the 3D game.**

**What the page is today (read from source on `main`, no screenshot used).**
- `index.html`: the graphic is `<h1 class="cyberpunk-title" data-text="The Darknet District">The Darknet District</h1>` (about line 370, inside `<section class="first-section">`). Below it a "Void Runner under construction" teaser (`.tdd-vr`, `void-runner-backdrop.js`) and a "Beyond the District" link to `function/`.
- Look comes from `style.css` (`.cyberpunk-title` at about line 394, with a `::before` glow, and a rule at about line 1028), and `accents.css` (`body.site-home .cyberpunk-title`: frosted panel, chromatic text shadow, `.tdd-edge` lines, `.tdd-ghost` slice glitch). `accents.js` (about lines 68 to 80) **inserts child spans into the h1** for the edge lines and ghosts. The page also has `window.enterTheDistrict` (a Firebase Google sign-in popup) in an inline module script, `iris-account.js` and `.district-account__button`, and the navigation (`home-navigation.css`, `district-nav`).
- **PR #176** already changes this page: it removes the teaser and `void-runner-backdrop.js` and adds a **separate** button `ENTER THE DARKNET DISTRICT` plus "No account needed" text and a Log in link, and edits `accents.css`, `games-list.html`, `store-first-page.html` and their `static/` copies. **That conflicts with David's new wording** (the graphic itself is the entrance). Decide with David whether to keep #176's access text and Log in link; build the new entrance on top of the integration branch's `index.html`.

**Recommended approach (smallest change that keeps every effect).**
1. Wrap the existing heading, do not change it: `<div class="tdd-title-wrap"><a class="tdd-title-link" href="void-runner.html" data-enter-game aria-label="Enter The Darknet District, the 3D game"><h1 class="cyberpunk-title" ...>…</h1></a><span class="tdd-enter-tag">ENTER</span></div>`. An `<a>` may contain an `h1` in HTML5. Leaving the h1, its classes and its generated children alone preserves `accents.css` and `accents.js`.
2. The wrapper is `position:relative; display:block` with the h1's own `max-width`/margins untouched. The label is `position:absolute; top:-0.6em; left:6%` (just above or slightly overlapping the upper-left edge), small monospaced uppercase, thin cyan/green border, dark translucent background, letter-spacing about 0.25em, in the site's green (`#00ff9d`) so it matches the existing glow; no animation beyond a subtle focus/hover brighten, and none under `prefers-reduced-motion`. It is `aria-hidden` (the link already has a name) and `pointer-events:none` (the anchor is the click target).
3. **Keyboard and focus:** one tab stop (the anchor). Add `.tdd-title-link:focus-visible{outline:2px solid #00ff9d;outline-offset:4px}` and a matching hover state.
4. **Entry flow:** the link goes to `void-runner.html`, the game's own menu (guest or account entry already works there: "Campaign, New or Continue"; account via Firebase). Keep the existing `window.enterTheDistrict` sign-in popup for the account button only.
5. **Phones:** do not link on phones. Add a small script that runs the same device test the game uses (`unified-controls.js`: touch-first unless Windows) before enabling the link: treat `(pointer:coarse)` without a fine pointer, or a phone user agent, or a short screen side under about 820 px as "phone". On a phone, remove the `href`, hide the ENTER label, and leave the heading exactly as it is today. Tablets: David has not decided (ask). The ROG Ally (Windows, touch plus gamepad) must count as desktop.
6. **Game-side guard (required with this change):** `void-runner.html` must also stop phones that open the URL directly (see section 12 blockers).
7. **Do not** remove or alter the navigation, the Iris widget, the account button, or the mobile CSS (`@media` rules in `style.css` and `accents.css`). Add the new CSS to `accents.css` (where the title effects live), not inline.
8. **Tests to add:** a browser test at 1440x900 and 390x844 (Playwright): the anchor contains the h1; the ENTER label is within a few pixels of the h1's upper-left edge; Tab reaches the link and shows an outline; on the 390 px phone profile there is no link and no label; the h1's computed styles are unchanged from `main`; the page makes no new network requests. Update `tests/site-navigation*.cjs` and `home-navigation-browser.cjs` if they pin the old markup, and keep the `static/` copy of any changed page in sync only if that page is mirrored.
9. Ship it **after** the unlisted desktop test works and only with David's approval (it exposes the game to every visitor).

## 11. First playable website milestone

"**Desktop Darknet District, unlisted.**" On a desktop browser, opened by typing the game's URL (not linked from the homepage): choose New (guest, no account), start in the alley, walk, enter the security door, see the District interior, talk to Admin and Iris, rest in a pod (saves locally), play music at the pod-room wall screen, walk back out, reload and Continue, and return to the normal website from the menu. No missions, spaceflight, multiplayer or mobile.

## 12. Deployment readiness assessment

### 12.1 Desktop 3D test
| Item | Status | Evidence / gap |
|---|---|---|
| Desktop game launch | Ready | All browser suites; main menu loads. Not yet checked in David's real Edge/Chrome with a real GPU. |
| Guest entry | Ready | New campaign without an account; saves local. |
| Account entry and cloud save | **Unverified live** | Needs Firebase auth and the Render API, which were never reachable from the sandbox. The Render side must accept the new campaign epoch (`void_runner_api.py` in #188) **before** the new client is used with an account, or cloud saves will be refused with a clear message. How Render deploys (auto from `main` or manual) is not in this repository: ask David. |
| Sleeping Pod starting experience | **Not built.** A new campaign starts in the alley, not in a pod (wake-in-a-pod is PR 2 of #191). "Rest in a pod" only saves. | Acceptable for the first test. |
| Movement and camera | Ready | |
| District interior exploration | Ready | Interior builds in about 230 meshes. |
| NPC interactions | Ready but minimal | Admin and the in-game Iris answer with short notices; no missions offered (by design). |
| Security-door transitions | Ready | #187; tested low and high, 3 trips, leak checks, saved location. |
| NeoChinatown street | Ready | Without licensed building models the stand-ins show locally; real models only on the deployed site. |
| Persistence without damaging saves | Ready with a precaution | #188 copies a legacy local campaign to `void-runner-campaign-v1.retired`, removes the active slot, and shows a notice. It never deletes cloud records. **Because the test is on the same origin as the live game, David's existing local save would be retired on first load: have him back it up first (copy of `localStorage` key `void-runner-campaign-v1`).** |
| Pod music | Ready | #192. |
| Return to the normal website | **Missing** | The game page has no link home. Add a "Back to website" link (to `/`) in the main menu and pause menu. |
| Phones | **Missing guard** | See 12.2. |

**Minimum blockers (smallest changes):** (1) phone gate in `void-runner.html`; (2) "Back to website" link; (3) David's decision on whether the website playlist (27 songs, some titled "(Cover)" or with strong language, publicly served from `attached_assets/`) ships in the test, or only "My music" does (a one-line change: leave the website list empty); (4) David backs up his local save; (5) a run in his real browser on his GPU. **Can wait:** multiplayer, missions, spaceflight, mobile social, customization, finished art, wake-in-a-pod, the pod re-build, the ENTER homepage graphic.

### 12.2 Desktop versus phones (David's rule)
The game is **desktop-first**. Phones keep the existing mobile website and navigation, **never load or run the 3D game**, and later get a lightweight mobile social interface (global text chat, direct messages, friends, player directory, notifications) that talks to desktop players inside the game, without entering a pod or starting a 3D session.
- **Today:** phones that open `void-runner.html` do start the game with on-screen touch controls. The gate must go **before any Babylon, asset or save code loads**: show a short message ("The Darknet District 3D game is for desktop computers. Use the website on your phone.") with a link home; do not touch saves. Test with Playwright's Pixel 7 profile and with a desktop profile (the ROG Ally must pass).
- **Mobile social status:** **documentation only** (PR #191 section 12, items 3, 4, 6, 7, 8; PR #186 earlier). Depends on: the hub skeleton and authentication (PR 4), `Guest####` identities (PR 3), chat with baseline safety (PR 5), and the age-policy decision. No code exists. **Do not delay the desktop test for it.** The homepage ENTER must not launch the game on phones (section 10, item 5).

### 12.3 Performance (software rendering only; no GPU numbers exist)
| Measure (from the transition test) | Low | High |
|---|---|---|
| Street, meshes / lights / textures / nodes | about 430 / 3 / 190 / 690 | about 570 / 6 / 208 / 1495 |
| Interior, meshes / lights / materials / nodes | 230 / 2 / 161 / 449 | 230 / 12 / 167 / 449 |
- The interior is the same size at both tiers; high adds lights and the high tier is already at the GPU light limit (known bug 1).
- Lower-resolution desktops: the pod music panel and layouts were checked at 1280x720 (the game's footer covers the bottom 72 px; panels need bottom padding). Not checked at 1366x768, 1024x600 or high-DPI scaling. **Measure real frame rates on David's PC and the ROG Ally before and during the test** and report low versus high.

### 12.4 Safe deployment plan (nothing deployed)
**How the site is published.** `.github/workflows/pages.yml` builds `_site` with `tools/assets/build-pages.cjs` (every tracked file except paths starting with `.` or `_` and `exports/`; adds the encrypted licensed models from the private repo using secrets `LICENSED_ASSETS_TOKEN` and `VOID_ASSET_KEY`; stamps the service-worker `BUILD` with the commit). It runs on every pull request (build and checks only) and **deploys on a push to `main`** (also by manual run). There is no separate staging site.

**Unlisted route.** The game already lives at `https://thedarknetdistrict.com/void-runner.html`, and the homepage does not link to it ("Under construction"), so it is *already unlisted*. A second copy under `/district-test/` is **not recommended**: the game uses relative paths, a root service worker (`/void-runner-sw.js`) and shares browser storage with the same origin; a copy would need a `<base>` tag and its own scope, and would still share saves. Use the existing URL, keep the homepage as is (do **not** take #176's `index.html`, `accents.css`, `games-list.html`, `store-first-page.html`), and do not link it anywhere.

**Steps (each needs David's approval; none has been done).**
1. On a branch from `integration/codex-start`, restore the homepage and the two site pages from `main` (`git checkout main -- index.html accents.css games-list.html store-first-page.html static/games-list.html static/store-first-page.html`), add the phone gate and the "Back to website" link, decide the playlist, bump `BUILD`, regenerate the inventory, run all tests.
2. Confirm with David how the Render API deploys and that the API in #188 is deployed **before** (or with) the client. Do not run the production save reset (`tools/reset-void-runner-saves.py`); it needs his typed approval and a backup file.
3. David backs up his local save. Open the PR to `main`; the PR build proves the Pages build works (including the encrypted models).
4. Merge (David's decision) → Pages deploys. Then test, in order: homepage and normal pages unchanged (spot check); `/void-runner.html` loads with no console errors; guest New works; District, door, pod, music; WebGL compatibility in Edge and Chrome; a phone opens the normal site and shows the gate on the game URL; Iris widget absent on the game page (a test asserts it); reload and Continue.
5. **Authentication and guest entry:** guest works offline; account login needs the live API.
6. **Iris isolation:** `void-runner.html` and its scripts load no Iris chat; keep it that way (`chatbot.html`, `iris-*.html`, `identity_api.py` are the website's).
7. **Production data safety:** the client moves only the browser's own legacy campaign to a `.retired` key; the API refuses legacy saves with a 409 and never deletes; nothing is written to Neon or Firestore by this build except normal saves.
8. **Music licensing:** the website playlist is already public on the site, but streaming it in the game extends its reach. Safest first test: ship **My music only** (leave the website list empty) and add the copyright-free generative synth tracks later (audit H6). David decides.
9. **Rollback:** a revert of the merge commit on `main` (`git revert -m 1 <merge>`) and a push redeploys the previous site within minutes (the workflow stamps a new `BUILD`, so browsers drop the new cache). Players' campaigns survive a rollback: the `.retired` copy stays and the old client still reads the active slot only if it was never removed; to restore a retired save, copy `void-runner-campaign-v1.retired` back to `void-runner-campaign-v1`. If the API was changed, revert it the same way and note that Render may need a manual redeploy.
10. No paid service is needed to test the single-player game.

## 13. Architecture decisions from PR #191 (`docs/void-runner/social-universe-architecture.md`, revision 2)
Confirmed by David on 2026-11-04 (D1 to D10): every player has a display handle, picked or an automatic `Guest####`, never the database identity (an immutable internal id); development is local and free first, no paid hosting, the single Node hub is the accepted direction and the roughly $7 a month figure is **not** approved; automatic account-bound saving is a priority and every full 3D login starts in an available Sleeping Pod with the ship at the landing zone and no restored location; persistent social features need an authenticated identity and a local guest mode stays separate; one active 3D session per account (a newer login replaces the older one) while a mobile chat connection never ends a desktop game; multiplayer is strictly social, no shared combat or mission progress, shared companion state belongs to the session; chat safety from the beginning and public chat stays off until safeguards exist; build the pod allocator before the hallway geometry (the final hallway waits for David's floor plan); reuse existing character assets and no purchases; keep #184 until its fixes are moved.

Open and needing David: **age policy (blocks launch)**; hosting for a public launch; illegal cargo at the landing zone; handle rename cooldown; moderation staffing; privacy defaults; the District floor plan.

Effort: the old 65 working days is a planning range (50 to 85), not a commitment.

## 14. Deferred multiplayer features (do not start)
Hub skeleton, auth and rooms; global, location and direct chat with block, report and rate limits; presence and Players Online directory; friends and invitations; shared avatars and customization; public and private VR sessions; shared companions; more station interiors; modular pod hallway; the **mobile chat page**. First two PRs when David approves: **(1) automatic account-bound saving with a session lease; (2) pod start and ship return** (replaces the location-resume code in #187 and #188 and ports the boarding-prompt gating from #184). Plan: #191 sections 5, 7 and 12.

## 15. Required approvals (none given for these)
1. Merging anything to `main` (this deploys the live site).
2. Whether the website playlist ships in the first test.
3. Production save reset and any deletion of records (exact list and backup first).
4. The age policy; hosting spend (none approved); the licence of the Tesana AI models (David has the Tesana Max Plan, so this may be quick: someone needs to read its terms and record the five points listed in the audit); vending machine content.
5. Closing #184, #186, or any PR.
6. Exposing the game on the homepage (the ENTER change); tablets policy.
7. Raising the campaign epoch.
8. Any new voice, Relay broadcast, story or mission content.

## 16. First suggested Codex tasks (small, in order)
1. Verify this branch builds the Pages artifact (`node tools/assets/build-pages.cjs` needs the private repo; otherwise open a PR and read the PR build) and run the tests in 6.1.
2. Phone gate and "Back to website" link in the game page; tests.
3. Playlist decision applied (empty list or kept).
4. Homepage ENTER (section 10) on a separate branch, not merged until David approves.
5. Then PR 1 and PR 2 of #191, on David's go-ahead.
