# Clean URLs: audit and deferred plan

Status: **audit only.** This PR changes no page, link, route or sitemap entry. It records what a clean-URL change would touch and why each part is deferred, so it can be scheduled after the open PRs land.

## Why nothing is changed yet

- **GitHub Pages cannot rewrite.** `/about` only works if a file exists at `about` or `about/index.html`. `.html` URLs are the only working addresses today. The custom domain is served by Pages (`CNAME`); `.nojekyll`, `_redirects` and `.htaccess` are not used.
- **Flask does not rewrite either.** `server.py` sets `static_url_path=''`, so `/about.html` serves but `/about` 404s. Any Render-hosted path would need a route change in `server.py`.
- **Every public page is in an open PR.** 296 files are changed across the open PRs (#176 to #199). Of the 35 sitemap URLs, the list below shows which ones are touched.
- **Game, Iris and gated pages carry their own risks.** Game pages load assets by relative path. Moving one into a directory changes its base URL and breaks loading. Several Iris pages are also loaded by the Iris widget and checked by `tests/iris-widget.test.cjs`.

## Proposed pattern (for when it is safe)

For each page `name.html`:

1. Move the real content to `name/index.html`. Fix its relative asset paths to `../`.
2. Keep `name.html` as a stub that redirects to `/name`, with `<link rel="canonical">` pointing at the clean URL and a meta refresh. Old links and bookmarks keep working.
3. Update internal links to the clean URL, the sitemap, and the Iris widget page lists and tests.
4. For Render-served paths, add a directory-index route in `server.py`.

## Before and after

Status key: **Deferred: PR-touched** means at least one open PR changes the file. **Deferred: game/Iris** means a game, Iris or Void Runner page with its own loading rules.

| Current URL | Proposed clean URL | Status |
|---|---|---|
| `/The%20Darknet%20District%20%E2%80%93%20Origins.html` | `/The Darknet District – Origins` | Deferred: game/Iris/orphan |
| `/The-Darknet-District-Book.html` | `/The-Darknet-District-Book` | Deferred: PR-touched |
| `/about.html` | `/about` | Deferred: PR-touched |
| `/anti-osint.html` | `/anti-osint` | Deferred: PR-touched |
| `/biohacking.html` | `/biohacking` | Deferred: PR-touched |
| `/borderless.html` | `/borderless` | Deferred: PR-touched |
| `/chatbot.html` | `/chatbot` | Deferred: game/Iris/orphan |
| `/curious.html` | `/curious` | Deferred: PR-touched |
| `/games-list.html` | `/games-list` | Deferred: PR-touched |
| `/iris-loadout.html` | `/iris-loadout` | Deferred: game/Iris/orphan |
| `/iris-protocols.html` | `/iris-protocols` | Deferred: game/Iris/orphan |
| `/iris-surveillance.html` | `/iris-surveillance` | Deferred: game/Iris/orphan |
| `/iris-terminal.html` | `/iris-terminal` | Deferred: game/Iris/orphan |
| `/iris-thoughts.html` | `/iris-thoughts` | Deferred: game/Iris/orphan |
| `/leaks.html` | `/leaks` | Deferred: PR-touched |
| `/legal_resources.html` | `/legal_resources` | Deferred: PR-touched |
| `/neurodivergent.html` | `/neurodivergent` | Deferred: PR-touched |
| `/opsec.html` | `/opsec` | Deferred: PR-touched |
| `/osint.html` | `/osint` | Deferred: PR-touched |
| `/raven.html` | `/raven` | Deferred: game/Iris/orphan |
| `/resources.html` | `/resources` | Deferred: PR-touched |
| `/sleeping_pod.html` | `/sleeping_pod` | Deferred: PR-touched |
| `/store-apparel.html` | `/store-apparel` | Deferred: PR-touched |
| `/store-apps.html` | `/store-apps` | Deferred: PR-touched |
| `/store-books.html` | `/store-books` | Deferred: PR-touched |
| `/store-electronics.html` | `/store-electronics` | Deferred: PR-touched |
| `/store-first-page.html` | `/store-first-page` | Deferred: PR-touched |
| `/store-neurohackers.html` | `/store-neurohackers` | Deferred: PR-touched |
| `/store-survival.html` | `/store-survival` | Deferred: PR-touched |
| `/void-runner.html` | `/void-runner` | Deferred: PR-touched |

Directory URLs that already work: `/origins/`, `/blackout-protocol/`, `/function/`, `/function/frequencies/`. Only `/` and these four are clean today.

## Security note (not changed here)

`obs.html` is an admin login page that compares a hard-coded token in client-side JavaScript. Anyone who loads the page can read the token. It is not in the sitemap. It should be removed or moved behind real authentication, and that needs a separate decision.

## Deferred work and order

1. After the PRs that touch the pages land, convert them in batches of five or fewer, starting with the store pages.
2. Game pages (`game.html`, `raven.html`, `blackout-protocol/`, `void-runner.html`) last, with a browser test that each game still loads its assets and saves progress.
3. Update `sitemap.xml`, the Iris widget page lists and their tests in the same PR as each batch.
4. Add the `server.py` directory-index route only if Render serves these paths.
