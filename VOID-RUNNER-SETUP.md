# VOID//RUNNER expansion

This change adds 12 free missions in Ghost Belt, Corporate Lockdown and Beyond the Gate; Wraith Cannon, Aegis Shield, Ghost Drive and Sentinel Drone; free equipment trials; Firebase Google sign-in; explicit cloud save/restore; and server-verified Stripe Checkout. It does not activate sales by itself.

The original Mara/Elias opening and Rook's first delivery remain intact. After that delivery's dialogue, players see a one-time optional sign-in/cloud-save offer and can keep playing without an account. Earned credits buy weapons, armor, engines, standard shields, a Vector Booster and a Scout Drone. The exclusive real-money tier is stronger and is unlocked only through verified purchases (or temporary free training trials). Credit equipment belongs to the current journey; purchased equipment belongs to the account.

Stations have distinct interiors and exterior silhouettes: utilitarian freight hub Kepler, weathered Rusthaven Port and industrial Foundry. Meridian retains its original appearance. Image-generation prompts and asset details are in `void-runner/art/STATION-ART.md`.

## Existing hosting

The public static frontend uses the repository root. Flask (`server.py`) serves the `static/` mirror and the existing Iris APIs. The game calls `https://the-darknet-district-site.onrender.com/api/void-runner` in production and the same origin on localhost. If your API host changes, update `apiBase` in `void-runner/account.js` and the backend origin allowlist.

`node scripts/sync-void-runner.cjs` keeps the homepage, shared login, game entry and store entry mirrored. Flask serves the root `void-runner/` assets through an explicit route, so art is not duplicated. Deploy the frontend and backend from the same commit.

## Local preview and checks

Flight now uses a first-person Kestrel cockpit with an assisted 3D camera and movement, billboard enemy ships, and swept projectile collisions. WASD/arrows turn, Q/R bank, Shift/X adjust throttle, Space fires, E activates an equipped drive, and P pauses. Mouse movement steers; click fires. Touch drag steers and fires, with separate fire and throttle buttons. Red edge arrows identify off-screen/behind enemies; cyan arrows identify missed salvage. Docking guidance aligns the ship automatically once the route is clear.

The surrounding sky uses WebGL direction sampling with a canvas starfield fallback. Planets have cached procedural terrain, clouds and directional lighting; asteroids use rotating faceted meshes and crater detail. No external renderer dependencies or changes to the story/save format are required.

```sh
python -m venv .venv
# Activate .venv for your shell, then:
pip install -r requirements-void-runner.txt
python server.py
```

Open `http://127.0.0.1:5000/void-runner.html`. Local campaign play and equipment training work without service credentials. Real Google sign-in needs localhost in the Firebase authorized-domain list. Cloud/purchase buttons report that the service is not open while configuration is absent.

```sh
node --test tests/campaign.test.cjs
node --test tests/cockpit.test.cjs
python -m unittest discover -s tests -p 'test_*.py' -v
# Install Playwright in your development environment, then:
node tests/browser-smoke.cjs
node tests/cockpit-browser.cjs
```

The browser test uses mocked Firebase and payment responses, never real charges. It defaults to Playwright Chromium; set `BROWSER_CHANNEL=msedge` to use an installed Edge. Set `VOID_SCREENSHOT_DIR` to save screenshots. Backend tests exercise real Stripe webhook signature verification with test fixtures and use fake Firestore storage. They do not prove connectivity to your actual Firebase or Stripe accounts.

## Firebase setup

1. Reuse project `the-darknet-district-71873`. Confirm Google sign-in is enabled and `thedarknetdistrict.com` is authorized under Authentication settings. The public Firebase web configuration is in `firebase-auth.js`; the homepage and game import the same module.
2. Enable a Cloud Firestore database in this project if one does not exist.
3. Give the backend a Firebase service account through the host's secret-file facility (for example, Render Secret Files). Set `GOOGLE_APPLICATION_CREDENTIALS` to its mounted path. Never commit the JSON or put it in any static folder. Use a service identity with only the Firebase Auth verification/revocation-check and Firestore permissions it needs.
4. Review the existing Firestore rules and merge the collection matches in `void-runner/firestore.rules`. These collections are backend-only: `vr_players`, `vr_checkouts`, `vr_orders`, and `vr_payment_blocks`. **An existing broad allow rule overrides these denies** because Firestore permits a request if any matching allow succeeds. Narrow any broad allows that include these collections. Do not replace unrelated app rules blindly.
5. Set `VOID_ACCOUNTS_ENABLED=true` on the backend after configuring credentials and rules. The Admin SDK uses the fixed project ID above. Do not point it at another Firebase project.

Progress stays in the existing browser save key and is migrated from version 1 to version 2. Cloud copies use revisions: two devices cannot silently overwrite each other. On a conflict, refresh the account, then explicitly choose which journey to keep. Purchases are separate from campaign progress, and New Journey does not remove them. Progress is client-authored and is not suitable for competitive leaderboards.

## Stripe test setup

1. In Stripe test mode/sandbox, create four one-time USD prices. Suggested starting prices for owner review: Wraith $4.99, Aegis $3.99, Ghost $2.99, Sentinel $3.99. These suggestions are not embedded in checkout; the server reads the actual configured Stripe prices.
2. Set these backend environment variables:

| Variable | Value |
| --- | --- |
| `STRIPE_SECRET_KEY` | Stripe test secret key (`sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for the endpoint below |
| `VOID_PRICE_WRAITH` | Wraith one-time USD `price_...` ID |
| `VOID_PRICE_AEGIS` | Aegis one-time USD `price_...` ID |
| `VOID_PRICE_GHOST` | Ghost one-time USD `price_...` ID |
| `VOID_PRICE_SENTINEL` | Sentinel one-time USD `price_...` ID |
| `VOID_SITE_URL` | `https://thedarknetdistrict.com` (localhost URL for local Stripe testing) |
| `VOID_ALLOW_LIVE_PAYMENTS` | Leave unset or `false` during testing |
| `VOID_EXTRA_ORIGINS` | Optional comma-separated preview origins; no wildcard |

3. Register `https://the-darknet-district-site.onrender.com/api/void-runner/webhook` for `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `charge.refunded`, and `charge.dispute.created`. For local testing use Stripe CLI forwarding and its signing secret.
4. Backend build command: `pip install -r requirements-void-runner.txt`. A typical Render start command is `gunicorn server:app --bind 0.0.0.0:$PORT`. Keep existing Iris environment variables. The repository's Replit configuration can still run `python server.py` locally.
5. Exercise a complete test purchase using Stripe's documented test card. Check account matching, receipt, return to the game, equip, refresh, another device, double-clicking Buy, cancelled checkout and retrying a webhook. Verify that a different Firebase account cannot claim a checkout URL.
6. Refund a test purchase and deliver the refund event before and after replaying its completion event. It must stay revoked. Test partial refunds and disputes too.

Payment is verified against a server-created checkout record, line item, quantity, price, amount, currency, account and test/live mode. Repeated completion callbacks update one order record. Pending checkout sessions are reused for the same player/item. Redirects alone never grant equipment. No card information is sent to the game server. The first release uses cards and direct item purchases, with no virtual currency, subscription or consumable replenishment.

Any refund, including a partial refund, revokes that order's item. Disputes suspend access. Reinstating a won dispute requires an owner review and clearing the relevant block/order status in the backend database; there is no automatic reinstatement in this release. Another separately valid purchase can still grant the item. Inventory is refreshed on sign-in and through Account → Refresh / Restore Purchases, rather than pushed continuously into an already-running session.

## Before enabling real sales

Complete the test-mode checks against the real services, approve final item prices and refund/support wording, and configure any required tax handling for the business. The code currently uses fixed USD prices without automated tax calculation. Then configure matching live prices, a live secret key and live webhook secret, and deliberately set `VOID_ALLOW_LIVE_PAYMENTS=true`. Order ownership and pending checkout sessions are separated by test/live mode, so test purchases never become live equipment. Cloud campaign saves are shared across modes. No live credentials are included in this change.

All chapters are intended to be completable with earned upgrades. Trial equipment is deliberately powerful but temporary and never awards campaign currency. Balance tuning still benefits from human playtesting; the automated checks verify mechanics and progression rather than player enjoyment.
