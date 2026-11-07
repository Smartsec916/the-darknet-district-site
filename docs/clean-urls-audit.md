# Clean URLs: corrected audit and plan

Status: **planning only.** This PR changes no page, link, canonical, sitemap entry or route. The first version of this audit was wrong about GitHub Pages and has been corrected below.

## Correction

The first version said GitHub Pages cannot serve clean paths, and that each page would need a directory with its own `index.html`. That is wrong. GitHub Pages already serves extensionless paths for `.html` files. Checked against the live site (read-only GET requests, no credentials sent):

| Request | Result |
|---|---|
| `/about` | 200, `text/html`, no redirect |
| `/games-list` | 200, no redirect |
| `/store-apps` | 200, no redirect |
| `/resources`, `/sleeping_pod`, `/iris-protocols`, `/raven`, `/void-runner` | 200, no redirect |
| `/store-apps.html`, `/about.html` | 200 (the old addresses still work) |
| `/store-apps/` | 404 (no directory exists) |
| `/origins` | 301 to `/origins/` (a real directory, redirected by Pages) |
| `/no-such-page-xyz` | 404 |

Consequences:

- No directories and no duplicate `index.html` files are needed.
- No redirects are needed for `.html` pages. The `.html` addresses keep working.
- The work is not URL creation. It is canonical links, internal links, social metadata, the sitemap, and regression tests.

## Revised plan

1. **Canonical URLs.** No page has a canonical link today. Add one per page, pointing at the clean URL, only after that clean URL is confirmed on the live site. `store-apps` is the first (see its own PR).
2. **Social metadata.** Set `og:url` and `og:image` to the clean URL and an absolute image path on each page as it is touched.
3. **Internal links.** Change `href="x.html"` to the clean form in batches, on files no open PR touches. This is optional for function: the `.html` links keep working.
4. **Sitemap.** Switch `sitemap.xml` to clean URLs only after the canonicals are live.
5. **Regression tests.** For each batch: every internal link resolves on disk; every clean URL returns 200 on the live site after deploy; the relative assets still load; the Iris widget is still on the pages that should have it; game pages still load their assets and progress.

Not in scope: changing every website URL at once. Existing `.html` links and bookmarks stay working.

## Relative paths

A clean URL such as `/game` has no trailing slash, so relative asset paths resolve against the site root, exactly as they do for `/game.html`. No asset path needs to change for an extensionless URL.

## Before and after

Status key: **Deferred: PR-touched** means at least one open PR changes the file. **Deferred: game/Iris/orphan** means a game, Iris or Void Runner page, or a page with no inbound links.

| Current URL | Clean URL (already works) | Status |
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
| `/iris-loadout.html` | `/iris-loadout` | Deferred: PR-touched |
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

Directory URLs that already work: `/origins/`, `/blackout-protocol/`, `/function/`, `/function/frequencies/`. Their bare forms (without the trailing slash) are redirected by Pages with a 301.

## Security note

The `obs.html` admin page was removed by PR #205 (still open). Its token was in public source and history. The logger service should also be rotated or retired outside the repo.

## Deferred work and order

1. Canonical and social metadata for each page, in batches of five or fewer, on files no open PR touches. The `store-apps` page is handled by its own PR.
2. Internal link rewrites in the same batches.
3. Sitemap switch to clean URLs after the canonicals are live.
4. Game pages (`game.html`, `raven.html`, `blackout-protocol/`, `void-runner.html`) last, with a browser test that each game loads its assets and keeps its progress.
