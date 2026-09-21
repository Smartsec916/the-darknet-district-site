# VOID//RUNNER — network, premium ship and travel update

Branch: `codex/void-runner-network-premium-travel`.
Built on the previous overhaul commit `8e9c0674672427b9e2dd0b16abb101cce40e016e`.
The package manifest records the final commit SHA. No production deployment, push, payment, or main merge was performed.

## 1. Startup NetworkError: evidence and cause

Read-only production probes on 2026-09-21 returned HTTP **503**, an HTML page titled **Service Suspended**, and **`x-render-routing: suspend`** from the Render backend. GET requests to account, catalog and balance, plus authenticated-endpoint OPTIONS probes, were affected. Responses had no `Access-Control-Allow-Origin`. Captured headers and bodies accompany the delivery as `production-probes.json` and `production-preflight.json`.

This confirms a suspended/unavailable Render service at the routing layer, before Flask. It is stronger evidence than a cold-start hypothesis. The reason Render suspended it is not visible from public HTTP responses; check the service dashboard and events. A frontend change cannot unsuspend it.

The source pathway that exposed the raw fetch exception was account initialization: restored Firebase identity invokes account refresh (and checkout confirmation when a return session is present). `run(..., true)` still announced errors when `state.completed >= 1`. Catalog, public balance and developer reads had separate catches and did not directly announce this raw startup text. This attribution comes from code inspection; the user's original browser session/HAR was not available. Failed backend access is confirmed independently by live probes. There is no evidence those probes indicate broken Firebase configuration.

## 2. Was application CORS broken?

The existing Flask allowlist already included both `https://thedarknetdistrict.com` and `https://www.thedarknetdistrict.com`. The observed missing header belonged to Render's suspension response, which bypasses Flask. OPTIONS was blocked at that same layer.

Both origins remain explicitly allowed. Empty additional-origin entries are filtered, and preflight responses can be cached for 600 seconds. GET, POST and OPTIONS and the existing Authorization/Content-Type headers remain supported. No wildcard was introduced for VOID APIs, and cookie credentials were not enabled. Tests exercise the actual `server.py` CORS configuration, including 503 and denied-origin responses.

## 3. Backend changes

- Added `spectre` to the existing product/inventory allowlist.
- `VOID_PRICE_SPECTRE` must resolve to an active, one-time, exactly **100-cent USD** Stripe price in the configured payment mode. Misconfigured prices fail closed.
- Account responses expose an authenticated developer boolean, allowing the client to avoid private balance probes for ordinary accounts. Private endpoints still independently verify UID authorization.
- Cloud-save migration strips Spectre and its tier-three gear from campaign ownership claims. Loadout preferences cannot grant inventory.
- Existing Firebase token verification, checkout reservation/idempotency, signed webhook, receipt checks, refund/dispute revocation, and test/live separation are retained.

## 4. Loading, degraded service and actual errors

The minimal initialization overlay tracks real stages: core script, game data, restored campaign, account attempt, essential decoded artwork, and ready. Required scripts and essential artwork failures show a retry state. Slow optional services show **CONNECTING TO VOID NETWORK…**; exhausted transient requests show **LOCAL PLAY READY · NETWORK SERVICES OFFLINE**. Endpoint, failure kind and readable status remain in diagnostic console messages.

Local campaign, flight, training, credit purchases and navigation do not await accounts, catalog or remote balance. Bundled balance values remain usable. Account/cloud/payment actions require their services and show a friendly error when invoked. Premium ownership is never manufactured as an offline fallback.

The shared service client deduplicates concurrent GETs by endpoint and identity generation. GETs get at most three attempts, with 20-second per-attempt timeouts and 1-/2-second backoff (4-second cap). Only transport/timeouts and 408/429/500/502/503/504 are retried. Permanent client errors are not retried; frontend POST actions get one attempt. Existing Stripe server-side idempotent request handling remains separate.

## 5. Performance changes

- Catalog is requested when a purchase is attempted instead of at startup.
- Ordinary accounts no longer probe developer balance; auth initialization and subscription have a single owner.
- Shared texture objects prevent duplicate loads; image decoding is asynchronous.
- GPU sky textures and uniform locations are cached. Destination sky cross-fades without re-uploading both large images every frame.
- Warp/shield/utility HUD values update only when their displayed values change. The encounter loop no longer writes route UI that the warp HUD immediately overwrites.
- Existing artwork dimensions, cockpit quality, star count, game effects, and gesture-gated audio are retained.

## 6. Lazy assets

Startup requires the Kestrel cockpit and opening Vesper artwork. All four location sky textures, the Meridian/Kepler/Rusthaven exteriors and ship sprite sheet are deferred until travel needs them. Launch loads the origin and selected destination in parallel. Foundry retains its existing procedural exterior. Location interiors remain selected by the existing scene CSS. Missing/slow travel images use distinct station geometry and fade to the correct artwork once loaded; they do not stop a route.

## 7–8. Spectre purchase and ownership

Spectre is labeled **PREMIUM SHIP — $1.00 USD**. Its purchase button enters the existing authenticated checkout flow. Owned pilots get **SELECT IN HANGAR**. Starter remains free; Peregrine remains 1000 campaign credits. Spectre cannot be bought with credits and never deducts them.

Only the API's verified `spectre` inventory grants the hull and its equipment. Inventory is derived from paid, account-bound, mode-matched server orders; fulfillment checks the reserved item/price, account, quantity, amount, currency, payment status and refund/dispute status. A checkout URL, cancellation return, equipped item or localStorage flag is not proof.

Client inventory is memory-only and cleared on identity change, sign-out or failed revalidation. Successful reads renew a five-minute lease, with one bounded revalidation attempt at four minutes and focus-based refresh when stale. Failed revalidation does not schedule an endless retry loop. Expiry falls back to the starter ship; hull/shields/missile capacity clamp to authorized limits. A reload restores purchases from the account service, not a campaign save. Selecting the premium hull again after verification is explicit. Previously credit-unlocked Spectre entries are migrated out; saved credits are otherwise unchanged.

This is the existing server inventory security boundary in a client-rendered single-player game: modifying browser code cannot create a paid server order. No claim is made that client rendering itself is tamper-proof.

## 9–10. Warp and station transitions

Timing lives in `void-runner/warp.js`:

| Setting | Default |
| --- | --- |
| Departure | 2.2 seconds |
| Alignment hold | 0.65 seconds within 8 degrees |
| Total active warp | 12 seconds |
| Destination reveal | 8 seconds of accumulated active warp |
| Deceleration | Final 3 seconds |
| Normal-space approach | 3 seconds |
| Encounter interruption | 42% of warp |

Encounter time does not count toward the reveal clock. Existing checkpoints preserve progress and destination; clearing an encounter returns to alignment and resumes the remaining transit.

Near asteroids expand through perspective and pass outside the canopy. Distant celestial bodies use slower parallax and larger apparent scale; star streaks soften during deceleration. The correct destination exterior begins small at eight seconds, grows continuously into approach, and uses the same identity at docking. Background sky fades into the destination environment.

Departure uses the origin's artwork and hardware: Meridian rings, Kepler freight gantries, Rusthaven's incomplete crescent and magenta salvage structure, and Foundry refinery towers/gantries. It is short, with flight controls returning after the dock is cleared. Foundry remains procedural because the established implementation has no separate exterior bitmap. All currently selectable destinations are stations; no new planet destination was invented.

Exact hostile counts were removed from station summaries, flight HUD/canvas and related briefing text. Internal encounter numbers remain for gameplay, with vague player-facing warnings.

## 11. Verification

**30 Node tests, 19 Python backend tests, and 10 browser scripts passed.**

- Network: deduplication, retry limits, timeouts, permanent errors and no POST retries.
- Economy: forged local saves/gear, credit rejection, owned selection, sign-out, cancellation/unpaid sessions, wrong amount/price/mode, verified fulfillment, persistent account inventory and refund revocation.
- Actual Flask CORS for apex/www, preflight, 503 responses and denied foreign origins.
- Real browser cross-origin HTTPS with production hostnames mapped to a local fixture: working authenticated preflights, 403 reads, slow backend, absent gateway CORS, fail-closed purchases, and 300-ms/400-KiB-per-second browser throttling. This uses isolated fake authentication/payments, not production credentials or purchases.
- Original campaign/browser, cloud-save, combat, missile, audio settings, pause, keyboard/touch and mobile regressions.
- A piloted browser simulation completed all four opening flights without artificially killing enemies or replenishing hull: the last run finished with 80 hull.
- Four travel routes: Meridian→Kepler, Kepler→Meridian, Rusthaven→Foundry and Foundry→Rusthaven. Assertions cover station identity, absence before eight seconds, growth, arrival and delayed-image fallback. Desktop/mobile captures were inspected.
- Interactive local QA reviewed all four departure styles and encounter-clear/resume/arrival behavior. Its visible fixture uses scripted alignment and encounter clearance to inspect transitions; it is not a manual combat balance test. It does not write campaign saves.

The live failure was verified read-only. A repaired live deployment and real Stripe test Checkout cannot be verified until the suspended service is restored and the new configuration is applied. No real payment was made.

Reproduce with Node, Python requirements and Playwright/Edge installed:

```text
node --test tests/*.test.cjs
python -m unittest discover -s tests -p "test_*.py"
python -m http.server 5000 --bind 127.0.0.1
# In another terminal: PORT=5002 python server.py (use shell-appropriate env syntax)
# Set BROWSER_CHANNEL=msedge for browser-smoke.cjs on systems without bundled Chromium.
node tests/browser-smoke.cjs
node tests/cockpit-browser.cjs
node tests/combat-browser.cjs
node tests/followup-browser.cjs
node tests/overhaul-browser.cjs
node tests/piloted-browser.cjs
node tests/startup-speed.cjs
node tests/station-approach.cjs
node tests/travel-browser.cjs
# HTTPS fixture uses cryptography; generated local test certificate stays outside the repo.
python tests/production_fixture.py --cert-dir ../test-cert
node tests/production-browser.cjs
```

`tests/travel-preview.html` is an optional localhost-only visual QA fixture. It is not linked from the game.

## 12. Required manual Render/payment steps

1. Inspect and restore the suspended Render service `the-darknet-district-site`. Check its Events/Logs and account/service status for the actual suspension reason. Changing CORS or extending frontend waits will not restore it.
2. When you choose to deploy, deploy backend and frontend changes together after review. Keep `VOID_ACCOUNTS_ENABLED=true` and the existing Firebase Admin credentials/project access configured for account features. No credentials are included here.
3. Create/configure a Stripe one-time **$1.00 USD** Spectre price. Set `VOID_PRICE_SPECTRE=price_...` on the backend. Start with test mode; `STRIPE_SECRET_KEY` and the price must belong to the same mode. Existing live-payment guard requires `VOID_ALLOW_LIVE_PAYMENTS=true` before using a live secret. Do not expose secrets in frontend files.
4. Preserve `VOID_SITE_URL=https://thedarknetdistrict.com` (or the chosen allowed canonical site origin) and the existing `STRIPE_WEBHOOK_SECRET`. The existing webhook URL is `/api/void-runner/webhook`; its handled events are `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `charge.refunded` and `charge.dispute.created`.
5. Both production origins are already allowlisted. `VOID_EXTRA_ORIGINS` is only for explicitly trusted additional origins; do not set it to `*`.
6. After restoration/deployment, repeat apex/www GET/OPTIONS checks, sign-in/account restoration, Stripe test-mode $1 checkout, cancellation and refund/revocation checks. Production repair is not claimed by this local package.

## 13–14. Branch and commit

Use `codex/void-runner-network-premium-travel`; see `PACKAGE.txt` for the final SHA, exact bases and import commands. The update patch applies after the prior overhaul. The combined package applies to upstream commit `97191403d90603204479578736680c63828914ae`, if the previous overhaul has not yet been imported. Use one integration method, not both.
