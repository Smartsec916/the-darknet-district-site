# Iris operations notes (2026-11-01)

Findings and recommendations from a read-only review. Nothing described here as a recommendation has been changed.

## What is deployed
- Iris service on Render (`darknet-district-iris`, manual deploys): live deploy is the merge of PR #148 (2026-11-01 19:41 UTC). `/api/health` reports version `07b8b36`. So the verified clock (#142, #146), live weather, earthquakes, news and worldwide time (#147), the skeptical-commentary layer (#148) and the desktop chat window (#145) are all live.
- Not yet reviewed with the real model: tone and accuracy of the live-data replies (see `scripts/live-model-eval.mjs`; it needs an OpenAI key and the owner's go-ahead for any run against production).
- Website credits for MET Norway and OpenStreetMap: PR #152 (open).
- Test reliability fixes: PR #153 (open).

## Neon (project `iris-chatbot`), read-only review
| Item | Finding |
|---|---|
| Plan | Free (`free_v3`), 2 of 10 branches used, region aws-us-west-2, Postgres 18 |
| Production branch | `production`, primary and default, **`protected: false`**. Protected branches need the Launch plan or above, so it cannot be turned on on Free |
| Data size | about 31 MB of 1 GB; compute used so far about 1,900 s (well inside the 100 CU-hour monthly allowance) |
| "Six hours" | The **history window** (point-in-time restore): you can rewind the database at most 6 hours. It is not data retention; the data itself stays |
| Snapshots | None exist. The Free plan allows **1 manual snapshot**, and scheduled backups are not available on Free |
| Stale branch | `backup-before-iris-migration`: a child branch cut from production at 2026-10-31 02:21 UTC (about the same size, 32.2 MB vs 32.4 MB), same tables. It is effectively a manual backup of production as it was before the migration. It holds nothing newer than production, but it is the **only restore point older than 6 hours**, so it is not safe to treat as junk |
| Guards already in place | The Claude Code permission rules deny Neon branch deletion, restores and resets, and ask before any write; the AI session cannot delete or restore |

Answers: production is unprotected and cannot be protected on Free; recovery history is 6 hours, not 6 hours of retained data; one snapshot is available on Free; longer recovery needs a paid plan; the old branch is the only older restore point and should be kept until a snapshot exists.

### Recommendation (data safety first, lowest cost)
1. **Now, free:** take the one manual snapshot of `production` (name it with the date). Manual snapshots do not expire. Keep `backup-before-iris-migration` as well until the snapshot exists. Needs your approval (creates a resource).
2. **Refresh habit, free:** the snapshot is a point in time. Before any risky change (migrations, restores, schema edits) replace it with a fresh one (delete the old, create a new), so there is always a copy from just before the change.
3. **If you want real protection, about pennies:** Launch has no monthly minimum (invoices under $0.50 are not collected). Pay-as-you-go rates: history window up to 7 days at $0.20 per GB-month of change history, scheduled backups with 35-day retention (snapshot storage $0.09 per GB-month), 100 manual snapshots, protected branches, spending notifications. With 31 MB of data and about 0.5 CU-hours of compute used so far, the likely bill is in cents to low single dollars a month; compute at $0.106 per CU-hour is the only line that can grow (autoscaling is capped at 2 CU now). It needs a payment method, so it is your decision. I would take it when real visitors' history matters more than the pennies: protected branch plus a 7-day window turns an accidental reset into a 5-minute fix.
4. **Not recommended:** a nightly dump to another place. It copies visitors' private conversations somewhere new; only do it with a plan for where and how it is protected.
5. Do not delete `backup-before-iris-migration` yet; revisit after step 1 (it counts toward the 10-branch limit but costs nothing on Free).

## Air quality (evaluation only, nothing built)
Iris must not state air-quality numbers or say she measured pollution; today she only jokes about smog in a way that is plainly a joke, and the tests check she makes no pollution claim.

| Provider | Key | Free tier | Coverage | Notes |
|---|---|---|---|---|
| OpenAQ v3 | Yes: free account, key in a request header (Render secret `OPENAQ_API_KEY`) | 60 requests/minute, 2,000/hour; 429 beyond that, repeated overage can ban | Reference-grade stations and community sensors worldwide, patchy: many places have no station nearby; values are the latest reading per sensor | Attribution required; commercial use handled by a custom agreement (not stated on the rate-limit page, check Terms of Use before relying on it) |
| Open-Meteo Air Quality | No key for non-commercial use | Per their terms; commercial use needs a paid subscription | Modelled (Copernicus CAMS), global and Europe, hourly forecasts and current values for PM2.5, PM10, NO2, O3, SO2, CO, dust, UV | A model, not a measurement: Iris would have to say "modelled estimate". Whether a shop-backed site counts as commercial needs a decision |
| WAQI (aqicn.org) | Yes, free token | Modest limits | Strong in Asia | Requires attribution; terms restrict some uses |
| AirNow (US EPA) | Yes, free | Generous | US only | Public domain |
Recommendation if you want it later: OpenAQ for measured values (with a "no station nearby" answer path, never a guess) or Open-Meteo for modelled values labelled as such. Either needs a new Render secret or an agreed terms reading first; I did not subscribe to or implement anything.

## Worktrees and branches (inventory, nothing removed)
All were checked for uncommitted changes (none had any), unpushed commits (none) and whether their tip is in `main`.

| Worktree | Branch | State |
|---|---|---|
| the-darknet-district-site (main checkout) | claude/meridian-texture-readiness | in main, clean. **Not on `main` itself** |
| darknet-mobile-chat | claude/iris-mobile-chat-window | in main (#134), safe to remove |
| darknet-worktrees/homepage-panel | claude/homepage-function-panel | in main (#149) |
| darknet-worktrees/iris-commentary | claude/iris-source-commentary | in main (#148) |
| darknet-worktrees/nightclub | claude/neochinatown-nightclub | in main (#151) |
| darknet-worktrees/sleeping-pod | claude/sleeping-pod-enhancements | in main (#150) |
| darknet-worktrees/iris-hardening | claude/site-attribution (this session) | in use: PRs #152, #153, this notes branch |
| tdd-audit-3a, tdd-base, tdd-iris | detached | in main, nothing unique |
| tdd-audit-stack, tdd-chatbox, tdd-handles, tdd-interdiction, tdd-interdiction-companions, tdd-iris-time, tdd-live, the-darknet-district-site-iris | claude/* | in main, clean |
| **tdd-audit-128**, **tdd-audit-base** | detached | **one commit each that is on no branch**: throwaway audit merges ("Merge origin/claude/iris-recall-filter-fix into HEAD", "Merge origin/claude/admin-releases-main-compat into HEAD"). Both parents are merged into main, so nothing of value is lost, but they are the only copies: glance before deleting |
Also: 42 local branches, none unmerged apart from this session's. No stashes.

Proposed cleanup (needs your approval; I have not run any of it): remove the 16 clean worktrees whose branch is in main (`git worktree remove`), after deciding about the two audit commits (`git branch keep/audit-128 5ee86e4` would keep them); then delete the merged local branches (`git branch -d`, which refuses unmerged ones) and the merged remote branches. Keep the main checkout, and move it onto `main`.

## Deferred
- **Void Runner, Una character model licence:** unresolved question about the Una model (CGTrader item not identified; `docs/VOID_RUNNER_ASSET_LICENSES.md` lists it as unknown and local-only). Separate project; not touched here.
- **Weather alerts outside the US:** not available (Iris says she cannot check them).
- **Real-phone test:** `docs/IRIS-MOBILE-CHECKLIST.md` (PR #152).
