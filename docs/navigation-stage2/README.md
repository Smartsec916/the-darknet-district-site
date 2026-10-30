# Stage 2 — shared District navigation correction

Date: 2026-10-29. Branch: `codex/site-navigation-stage2`.
Base: `8e82200498bd5115baa2e985c1ea1b6827c86d97` (`main`, including approved homepage PR #111).
Status: completed for review; no merge or deployment. Stages 3 and 4 remain queued, not implemented.

## Problem and implementation

The approved cyan/SVG header was scoped to `body.site-home`; other pages retained several copies of green navigation with different routes and labels. Some omitted Resources or Sleeping Pod, and some linked to themselves. The OSINT pages used two-link headers nested inside their content. Sleeping Pod still had Home, Play a Game and Store.

`tools/site-navigation.cjs` is now the source for destination numbering, labels, URLs, page inventory and header markup. It identifies the current page from its file name and emits the other five destinations on each main page. Secondary resource/store pages have six destinations because none is their own page. Sleeping Pod is an explicit one-link Home exception without directory metadata.

This is a static GitHub Pages site without a build system. The generator writes ordinary semantic HTML, so navigation works immediately and with JavaScript disabled. It runs only when maintaining the headers; no browser dependency, fetch, layout shift or additional animation loop is introduced. Existing files keep their page-specific content, commerce, HUD and scripts. Existing `static/` copies receive the same component. Route maintenance: edit the generator, run `node tools/site-navigation.cjs`, then run tests. `node tools/site-navigation.cjs --check` detects drift; the Node regression suite performs this check automatically in existing CI.

`home-navigation.css` keeps the approved frame paths, cyan palette, magenta accents, typography, restrained hover, focus outline, reduced-motion and forced-color support. Its opt-in scope now covers shared headers. The desktop grid accommodates five or six destinations. Mobile uses three columns (two below 360px), with 48px controls and visible original numbers. Current-page links are omitted, so there is no false active link. Sleeping Pod uses a compact single framed exit.

The Sleeping Pod lighting handler needed its old `.top-nav` reference updated to `.district-nav`. Testing both directions also exposed an existing stray `se;` token when restoring light; this was removed so the existing control completes normally. Its music player and atmospheric artwork remain intact.

## Pages covered

45 HTML headers: 23 root pages and 22 existing static counterparts (404 has no static counterpart).

- Main: Home, Arcade, Store, Resources, About, Sleeping Pod.
- Store categories: apparel, apps, books, electronics, neurohackers, survival.
- Resource collections: legal resources, curious, OSINT, anti-OSINT, leaks, OPSEC, borderless, neurodivergent, biohacking.
- Existing normal site navigation on the District book and 404 page.

Standalone game experiences and The Function's separate site are excluded. **Neither VOID//RUNNER entry file nor any gameplay source changed.** Website navigation is not injected into game menus, active flight or fullscreen play. Other unrelated special-purpose experiences were not given new headers.

## Tests and screenshots

- **409/409 Node tests passed**, including five new shared-navigation regressions. The Function archive test was updated to expect the approved Home self-link exclusion while retaining all its existing content/link checks.
- Browser verification passed all six main pages at 1440×900 and touch 390×844: exact labels, numbers, counts, readable labels, 44px+ hit areas, and no horizontal page overflow.
- Additional header widths: 320, 360, 540, 680, 768, 900, 1024, 1280 and 1920px.
- All 45 root/static headers loaded with correct counts and no old header variants. All six main destination URLs returned 200.
- Keyboard Tab order and visible focus, Enter navigation, mobile tap, approved hover color, reduced motion, forced colors, and computed WCAG AA text contrast were checked.
- All six headers work without JavaScript, including following Home from About.
- Sleeping Pod music visibility, dimming and restoring light passed; top navigation has exactly one Home link.
- VOID//RUNNER fullscreen toggle and an actual launched flight passed with no website navigation overlay.
- Generator drift check, JavaScript syntax and Git whitespace checks passed.

External HTTPS services were deliberately blocked during static browser checks. Two existing Shopify SDK errors from that offline setup are recorded separately in `results.json`; there were no other captured page errors. Live checkout, authentication and external chat responses were not certified. Tests used headless Windows Edge; no physical mobile device or handheld claim is made. A browser run covers the new navigation and selected preserved controls, not every product or resource interaction.

| Page | Desktop | Mobile |
|---|---|---|
| Home | [Screenshot](index-desktop.png) | [Screenshot](index-mobile.png) |
| Arcade | [Screenshot](games-list-desktop.png) | [Screenshot](games-list-mobile.png) |
| Store | [Screenshot](store-first-page-desktop.png) | [Screenshot](store-first-page-mobile.png) |
| Resources | [Screenshot](resources-desktop.png) | [Screenshot](resources-mobile.png) |
| About | [Screenshot](about-desktop.png) | [Screenshot](about-mobile.png) |
| Sleeping Pod | [Screenshot](sleeping_pod-desktop.png) | [Screenshot](sleeping_pod-mobile.png) |

Additional evidence: [keyboard focus](keyboard-focus.png), [hover](hover.png), [browser results](results.json), [unit log](unit-tests.log).

## Stage 1 separation and dependencies

Stage 2 was branched directly from `main`, not from Stage 1. PR #112 remains an independent draft. Comparing modified path sets found **zero overlapping files**; this branch does not include, revert or duplicate its stabilization commits. There is no ordering dependency on #112 and no current file conflict. Existing shared CI runs both sets of tests when the branches eventually meet.

At review time #112's hosted Node and Python checks succeeded; its Babylon smoke job failed `slowdown reduces density budget` on the Linux CI runner. Its three station visits did hold 56 textures / 8 skeletons. That failure needs separate Stage 1 investigation and is not resolved or hidden by this navigation change. No game or stabilization-test files were edited here.

## Changed files and review workflow

- `tools/site-navigation.cjs`: shared definitions and static generator.
- `home-navigation.css`, `static/home-navigation.css`: approved shared styling and quiet Home variant.
- The 45 HTML files listed by `pages` in the generator, plus their existing static copies: generated headers and stylesheet opt-in only; Sleeping Pod also updates its lighting selector and fixes the restore-light typo.
- `tests/site-navigation.test.cjs`, `tests/site-navigation-browser.cjs`: drift, route, exception and browser regression coverage.
- `tests/home-navigation-browser.cjs`: compatibility entry point now runs the shared suite instead of obsolete prototype-only expectations.
- `tests/function-archive.test.cjs`: current homepage link expectation.
- This report, twelve page screenshots, focus/hover captures and test evidence.

No recurring infrastructure, new dependencies or runtime framework. No merge or deployment. Stage 3 mission/dialogue administration and Stage 4 store/economy administration remain queued for subsequent development; their architecture and authorization requirements still apply.
