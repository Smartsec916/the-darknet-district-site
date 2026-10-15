# CLAUDE.md: The Darknet District site / VOID//RUNNER

This repository is David's website, The Darknet District (https://thedarknetdistrict.com). Most active work is on the browser game **VOID//RUNNER** (`void-runner.html` plus `void-runner/`).

**Read `VOID_RUNNER_HANDOFF.md` before changing the game.** It holds the current canon, the decision log, mission state, and what is approved and what is not.

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
