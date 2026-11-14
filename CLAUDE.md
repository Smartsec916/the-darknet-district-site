# CLAUDE.md: The Darknet District site / VOID//RUNNER

## Resume point and in-flight work

**Open `docs/development/AI_HANDOFF.md` and read "CURRENT DEVELOPMENT STATE — RESUME HERE" first.** It lists the verified repo and deployment state, what is done, blocked and next (Corporate District, then Zen Zephyr Temple: `docs/development/THREE_LOCATION_EXPANSION.md`), and the Blender/Higgsfield status (`docs/development/BLENDER_HIGGSFIELD.md`, **not functional yet**). Anything below that conflicts with it is older.

## Permanent art direction (November 2026): read before ANY graphics work

The 3D game is **PC-only and AAA dark cyberpunk** (Blade Runner 2049, Altered Carbon, The Expanse as qualitative references). The current Tron-like neon look is being phased out progressively, not blindly deleted. **Read `docs/VOID_RUNNER_ART_DIRECTION.md` (section "PERMANENT DIRECTION") first.** It covers what to avoid, the required architecture/material/lighting/storytelling standards, the PC-only performance policy, Blender asset standards and the graphics workflow. It supersedes older graphics instructions. It does not authorise rewriting gameplay, and it does not change the website's mobile support (only the 3D game is PC-only).

## Current development authority — November 2026 (supersedes conflicting older handoff guidance)

The active desktop game is the **District-first experience (multiplayer under development)** in NeoChinatown, Tessaly System. **Every login/reconnect should spawn in that player's own Sleeping Pod; first-time character customization happens before EXIT POD.** The homepage is the entry point, but it is not the gameplay spawn location. New campaigns have no active missions or starting ship; local District/NeoChinatown missions are designed later and a ship is earned by a future approved mission. The older VOID//RUNNER opening, Vesper/Mara tutorial and immediate ship ownership are historical plans, **not** instructions to restore them. Preserve compatible code and save IDs where possible. Treat older design briefs saying "DO NOT IMPLEMENT ANYTHING YET" as instructions for those historical planning exercises, not a blanket prohibition on current development.

**Autonomy:** Claude and Codex may proactively diagnose, implement and test reversible gameplay, visuals, animations, NPC ambient behaviors, UI, local multiplayer functionality, performance and bug fixes, including reasonable new features consistent with the established District direction. Do not require 3–5 proposals for ordinary implementation, incidental dialogue or technical decisions. Offer options for major story/canon, faction, mission-arc, monetization or irreversible architectural changes; David retains final creative authority. Explicitly locked voices and David-authored scripts remain protected.

**Assets and music:** David reports that music created through his paid Riffusion membership and purchased/supplied companion models are licensed for his intended commercial use. Do not categorically reject, replace, hide or disable these assets merely because they are AI-generated, purchased, or not stored in the public repository. Record the source and available license evidence; do not assume that commercial rights also permit public redistribution, sublicensing or AI training. For assets with genuinely unresolved terms, flag the exact question rather than broadly blocking all companions or music.

**Specific licensed-asset handling:** `docs/VOID_RUNNER_ASSET_LICENSES.md` records Ava, Eva, Yuki and Dex as already released through the private `Smartsec916/void-runner-licensed-assets` repository and encrypted publishing pipeline. These models must remain available to authorized local development through a private asset sync or equivalent, not by committing source models to this public repo. Some marketplace licenses are marked **No AI**: do not use those model files for AI training or other prohibited AI processing; ordinary game rendering and authorized conversion are separate questions governed by the actual license. Riffusion music should be reused according to the rights of the particular paid plan and generation date; preserve available receipts/terms and do not assume every Riffusion output has identical rights. Assets whose provenance or commercial terms remain unknown must be reviewed individually, not treated as automatically approved.

**Local companion debugging:** The companion picker can register a character while its model file is unavailable. Live-site success does not prove the file is present in a local build. Inspect `void-runner/vr-companions.js`, `void-runner/crowd.js`, the required animation clips, model paths, private asset packaging (`tools/assets/build-pages.cjs`), dev-only listing rules, and browser network/console errors. Restore authorized local access to purchased assets without committing proprietary models or secrets into the public repository. Never silently substitute a different companion or remove an entry to conceal a missing-file error.

**Live multiplayer:** Prefer a small, low-cost Render-hosted multiplayer service using the existing Firebase identity flow, including guest access where supported. Do not ask for friends' Firebase UIDs as a normal join procedure; validate player identity server-side and provide automatic instance joining. Implement and test changes on a branch. Do not create paid resources, change secrets, deploy, merge to `main`, or alter live infrastructure without David's explicit authorization.

This repository is David's website, The Darknet District (https://thedarknetdistrict.com). Most active work is on the browser game **VOID//RUNNER** (`void-runner.html` plus `void-runner/`).

**Before changing the game, read `docs/development/AI_HANDOFF.md` (the Start here section).** That file is the current handoff. `VOID_RUNNER_HANDOFF.md` is the decision log and older canon. Its October 2026 "what the game does today" is not the live game.

## Current handoff and release state (2026-11-12)

**Before coding, read `docs/development/AI_HANDOFF.md` and `docs/development/AI_ROADMAP.md`**, then this file and `VOID_RUNNER_HANDOFF.md` for technical conventions and historical decisions. The earlier October campaign status is historical; **the current District-first state wins**. Draft PR #212 **merged on 11 Nov 2026**. Do not keep it open or treat it as the integration branch. Merge to `main` only when David says "push", "pull it", or "go ahead and pull". The game is **desktop and VR headsets only**; phones stay on the normal site (`void-runner/device-gate.js`). Do not modify the Sleeping Pod room or the music player unless he asks or the task cannot be done without them. Licensed models stay in the private repo `Smartsec916/void-runner-licensed-assets` (scrambled `.vrpak`, VRPE-sealed at the Pages build). Never commit them here. The owner permits deleting **unfinished in-game shop items** if required, **not** real storefront inventory, Shopify, or purchased entitlements.

## The owner and how to work with him

- David (GitHub `Smartsec916`) is the final creative authority on story, world, characters and missions.
- **Approval stages for story and world content:** PROPOSED, APPROVED, REVISE, REJECTED, DEFERRED.
  - Nothing is canon until David approves it.
  - Silence is not approval.
  - Record decisions in `VOID_RUNNER_HANDOFF.md` §11.
- **Story and mission design:** give 3–5 real options in the proposal format from `docs/void-runner/design-source/02-world-expansion-design-brief.md` §13. Recommend one. Do not implement planning-stage story content until it is approved.
- **Graphics, bug fixes, and explicitly requested features:** implement directly.
- Scripts David writes himself (for example `docs/void-runner/design-source/05-*.md` and `06-*.md`) are his approved dialogue. Follow their "do not" rules. Anything they leave open (destinations, NPCs, follow-up chains) still needs a proposal.
- The Darknet District book (`The-Darknet-District-Book.html`, PDF) is **mood and visual reference only**, not a game guide. Nothing in it is canon unless approved.
- Keep the site's costs minimal; prefer free options.
- Do not put Iris (the site's AI chat character) on game pages. Keep the in-game Iris separate from the website chatbot code (`chatbot.html`, `iris-*.html`, `identity_api.py`).
- When he says "push", "pull it" or "go ahead and pull" for finished work, he means merge the PR to `main`. Merge only when he asks.
- Write to him in plain language. He is not reading code.

## Repository layout

- The site is static HTML/CSS/JS served by **GitHub Pages** (`CNAME`). There is no build step.
- Python APIs (`server.py`, `void_runner_api.py`, `void_runner_progression.py`, `identity_api.py`, `blackout_api.py`) run on a Render backend. That backend serves only the APIs, not pages. Cloud saves are validated by `clean_save()` in `void_runner_api.py`.
- **VOID//RUNNER**:
  - `void-runner.html` is the entry page. `static/void-runner.html` must stay **byte-identical** to it (a test enforces this; copy after any edit).
  - `void-runner/*.js`: about 80 classic (non-module) scripts, loaded in order by `void-runner.html`. Order matters.
  - `void-runner/vendor/`: Babylon.js 8.26.
  - `void-runner/art/`: textures and painted art; prompts are in the `.md`/`.json` files there.
  - `void-runner-sw.js`: the service worker. **Bump `BUILD`** whenever any game file changes, or players get stale caches.
  - `void-runner/save-manifest.json`: the location, mission and chapter ids the cloud save server accepts. Update it whenever you add a location or contract id.
- `blackout-protocol/`, `origins/` and the other pages are separate games and pages. Do not touch them while working on VOID//RUNNER.

## Architecture essentials (VOID//RUNNER)

- **Pure rules modules** run in both the browser and Node (`module.exports` or a `root.X` global), and are unit-tested:
  - `campaign.js` (C): quests, contracts, flights, save restore and migration.
  - `progression.js` (P)
  - `universe.js` (`VoidUniverse`): systems, locations, routes, discovery.
  - `mission-log.js` (`VoidMissions`): the centralized mission manager, tracking and guidance.
  - `story.js` / `story-content.js`
  - `content.js`, `ships.js`, `balance*.js`, `warp.js`, `factions.js`
- **Rendering and integration scripts** are browser-only:
  - `game.js` declares top-level `let state`, `mode`, `flight` and so on. Other scripts use these by bare name, **not** `window.state`.
  - Integration scripts (`world-integration.js`, `prologue-integration.js`, `babylon-integration.js`, ...) **wrap earlier functions in place**, e.g. `const original=rookConversation; rookConversation=function(){...}`. Before changing a function, find every wrapper: grep for `name=function`.
  - Scenes: `opening-scene.js` + `vesper-visuals.js` (Vesper), `meridian-station.js`/`meridian-interior.js`, `neochinatown.js` (NeoChinatown and The Darknet District), `derelict-station.js`.
  - Physical interactions are registered with `VoidInteractions.register(action, handler)`.
- **Internal ids differ from display names. Never rename the ids casually; saves depend on them.**

  | Internal id | Display name |
  |---|---|
  | `erebus` | Erebus System |
  | `sol` | **Tessaly System** |
  | `sol-belt` | Tessaly Belt Anchorage |
  | `earth` | **NeoChinatown** |
  | `mars` | **Vantor** (name not yet confirmed) |
  | `rusthaven` | Rusthaven Port (was `undertow` until PR #47; old saves are migrated) |
  | `vesper`, `meridian`, `kepler`, `foundry` | as named |
  | `communion` (system) | **Cantor System** (Communion territory) |
  | `vigil` | **The Vigil** (Communion station; Dr. Elara Voss) |
  | `natural-order` (system) | **Garrow System** (Natural Order territory) |
  | `holdfast` | **Holdfast** (Natural Order outpost; Marcus Vale) |
  | ship slot `signal` | **UTILITY** slot (WarFlying Module / Scrambler / Signal Tracker) |
  | ship slot `utility` (`loadout.utility`) | **DRIVE** slot (boosters and drones) |

  If an id must change, migrate old saves in **both** `campaign.js restore()` and `void_runner_api.py clean_save()`, as was done for `undertow`→`rusthaven`.
- Save compatibility matters. Players have local and cloud saves. New state should go in tolerant places (`story.flags` accepts booleans, strings up to 200 characters, and safe integers), or the server validator must be extended.

- **Git on Windows:** set `git config core.autocrlf false` in this repo before editing. Many files are stored with mixed line endings, and automatic conversion rewrites them.

## Coding conventions

- Match the surrounding style. Most game files are dense one-line-per-statement JS. Do not reformat files.
- **Line endings:** many files are **CRLF**. Preserve them. When editing with scripts, read and write with `newline=''` (Python) and insert `\r\n`. Check with `file <path>`.
- Babylon gotchas learned here:
  - A plane's front is -z. Use `rotation.y=-π/2` to face +x, `π/2` to face -x, `π` to face +z. Wrong values mirror signs and ads.
  - In StandardMaterial, `emissiveColor` adds to `emissiveTexture`. Setting both washes textures out to white.
  - Dispose any DynamicTexture/material you create: push it to the scene's `textures`/`owned` lists.
- No new dependencies without a strong reason. Keep things fast on the ASUS ROG Ally Extreme: instancing, merged meshes, quality tiers (`low`/`medium`/`high`).
- Keep changes scoped. Do not make unrelated gameplay changes.

## NPC voices

- Voice identities are in `tools/audio/npc-voice-registry.json`. **Never change an approved voice** (or the model files) without David's approval; the change goes through the audition tool (`tools/audio/audition/server.py`). Don't assign the reserved special-character slot or invent broadcast voices.
- After changing dialogue: `node tools/audio/extract-lines.cjs`, then `python tools/audio/generate.py --models <folder>` (`--dry-run` first). Ask before bulk-generating hundreds of clips. Never commit models, virtual environments or audition samples.
- The Relay's broadcast scripts go in `void-runner/relay-content.json` and must be David's own lines. Never invent broadcasts, and never give The Function a voice or treatment without his approval.
- Details: `docs/VOID_RUNNER_VOICE_PRODUCTION.md`.

## Testing

- `npm test` (`node --test tests/*.test.cjs`): about 206 unit tests. They must pass.
- `python3 -m unittest tests.test_story_save tests.test_progression_save`: save-validation tests. These need no extra packages.
- `tests.test_void_runner_api` needs `pip install -r requirements-void-runner.txt`, which includes `stripe`. Without it, the test fails on import.
- Local host: `node tests/serve-modern.cjs`, then open http://127.0.0.1:5187/void-runner.html.
- `tests/*-browser.cjs` are Playwright scripts. Most launch `channel:'msedge'`, which is not installed in Linux cloud containers. There, use Python Playwright with the bundled Chromium and `--use-gl=swiftshader` (see `VOID_RUNNER_HANDOFF.md` §14) to take screenshots. Always look at screenshots of visual work before calling it done.
- CI: `.github/workflows` runs the Node tests on PRs and on `main`.

## Git workflow

- Branch from `main`; branch names look like `claude/<topic>`. Commit with clear messages. Open a PR. Merge only when David asks.
- Before finishing: tests pass, `BUILD` is bumped if game files changed, `static/void-runner.html` is synced, and `save-manifest.json` is updated if ids were added.
