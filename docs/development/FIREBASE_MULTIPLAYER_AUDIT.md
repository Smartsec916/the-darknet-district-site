# Firebase, Render and Neon audit for multiplayer

Written 2026-11-05. **Read-only.** Everything here comes from the repository and public documentation. No production Firestore data, security rule, authentication setting, deployment setting, credential or billing setting was read, changed or created; nothing was deployed. The Firebase Console, the Render dashboard and the Neon console were not (and could not be) inspected, so every statement about their live settings is marked **unverified**.

## 1. Verdict

**Yes: the existing Firebase project `the-darknet-district-71873` is suitable for the *identity and durable data* half of multiplayer, and not suitable for the *real-time* half.** Keep Firebase Auth for who people are, and Firestore (through the existing Render API) for things that must last (characters, handles, ledgers). Put movement, presence and chat on a small WebSocket server. A prototype of that server already exists on this branch (`tools/district-hub/`); it runs only against local emulators today.

The smallest safe path to two real players in the District needs **one new free Render web service, no new database, no new credentials for the hub, and no change to the Firebase project's rules or settings** (section 8).

## 2. What exists today (verified in the repository)

| Area | Finding | Evidence |
|---|---|---|
| Firebase project | One project for the whole site: `the-darknet-district-71873`. The web config is public by design. | `firebase-auth.js` |
| Sign-in methods in use | Anonymous ("a handle"), email link, Google. Anonymous accounts upgrade by linking (`linkWithCredential`, `linkWithPopup`), keeping the same uid. | `firebase-auth.js`, `district-identity.js` |
| Guests in the game today | "Guest" is local-only play with no account. A *signed-in anonymous* account exists and can claim a public handle. | `docs/void-runner/multiplayer-and-mobile-chat-plan.md` section 2; `identity_api.py` |
| Server-side token checks | Flask API (`void_runner_api.py`, `identity_api.py`): Firebase Admin `verify_id_token(..., check_revoked=True)`. Iris service: verifies the same tokens with Google's public keys and **no secret** (`iris-service/server/firebaseAuth.ts`), without revocation checks. | code |
| Firestore collections | `vr_players` (saves, character; document id = SHA-256 of uid), `vr_orders`, `vr_checkouts`, `vr_payment_blocks`, `vr_config`, `vr_content_*` (admin drafts), `bp_handles`, `bp_profiles`, `bp_stats`, `bp_leaderboard`, `bp_runs`, `bp_submissions`, `fn_*`. All written only by the Admin SDK on the Render API. | `grep` of `collection(...)` |
| Security rules in the repository | **Merge fragments only**, each deny-all for browsers: `void-runner/firestore.rules` (`vr_config`, `vr_players`, `vr_orders`, `vr_checkouts`, `vr_payment_blocks`), `blackout-protocol/firestore.rules` (`bp_*`), `docs/function/firestore.rules` (`fn_*`), `docs/admin-stage3b1/firestore.rules` and `docs/admin-stage3c/firestore.rules` (`vr_content_*`). Every one says "merge into the existing rules; do not replace". There is **no** `firebase.json`, `.firebaserc` or complete ruleset, and no workflow deploys rules. | files; `.github/workflows` |
| Is the deployed ruleset safe? | **Unverified.** Several documents assert that browser access is denied (`VOID_RUNNER_SAVE_SYSTEM_AUDIT.md`), and `docs/admin-stage3b/README.md` records that the deployed ruleset could not be read from that workspace. The fragments deny the listed collections, but a broad rule elsewhere (for example `match /{document=**} { allow read: if request.auth != null; }`) would override them. The project's other collections (anything not in the fragments) are also unknown. | docs |
| Render | Two services are described: the Flask API (`server.py`, `PORT`, gunicorn in `requirements-void-runner.txt`) and Iris (`iris-service/render.yaml`: `plan: free`, `autoDeploy: false`). **The Flask API's Render settings (plan, auto-deploy, environment variables) are not in the repository.** | `server.py`, `render.yaml`, `FIRST_LIVE_TEST_RUNBOOK.md` |
| Neon | Used only by Iris (`@neondatabase/serverless`, Drizzle; tables `users`, `chat_*`, `iris_*`). The game never touches it. | `iris-service/shared/schema.ts` |
| Real-time code | **None anywhere.** `iris-service/package.json` lists `ws`, but no WebSocket server is created in `iris-service/server` (searched for `WebSocketServer` and `upgrade`). Iris's `live/` folder is weather/news lookups, not real-time. The earlier plan's phrase "has the `ws` library installed" means the dependency is listed, not that any socket code exists. | grep |
| Backend CORS / limits | Site origins allowlisted per blueprint; request-size caps; `no-store`. No rate limiter in the Flask API; Iris has `express-rate-limit`. | `server.py`, `void_runner_api.py` |
| Firebase App Check | Not used (no references). | grep |
| Local test tooling (this branch) | Auth and Firestore emulators, 6 API tests, the dev hub and two-browser tests. | `LOCAL_API_TEST.md`, `MULTIPLAYER_PROTOTYPE.md` |

**Correction to earlier handoff notes.** Earlier text in this branch said the Firestore security rules "are not in the repository". That was too broad. The repository contains deny-all **fragments** for every private collection, but not the **deployed, complete** ruleset, and nothing proves the fragments are live. The pending administrator action below is the same item, stated correctly.

## 3. What is missing

1. A real-time transport (nothing exists).
2. Server-side proof of the live Firestore rules, App Check, authorized domains, Auth provider settings, billing plan (Spark or Blaze) and Render service settings (all **unverified**).
3. A server-owned inventory. **Credits, upgrades and equipment in the cloud save are reported by the browser** and only range-checked (`clean_save`: credits 0 to 100,000,000, gear lists from fixed sets). Two players cannot safely trade anything the browser can edit. Paid equipment (`vr_orders`) is already server-owned, but credit-bought items are not.
4. Chat, moderation, mutes and bans, reports (no code, no collections).
5. A guest policy for a shared space (what an anonymous account may do), and a policy on minors.
6. Mobile "social without 3D": the static chat page is planned (`multiplayer-and-mobile-chat-plan.md`), not built.
7. Handles in the 3D world: the registry (`bp_handles`, `bp_profiles`) exists with reserved-name and look-alike folding, but the hub prototype shows `Pilot-xxxx` and `Guest-xxxx` instead.

## 4. What belongs where

| Need | Put it in | Why |
|---|---|---|
| Who someone is (login, guest, linking to email or Google) | **Firebase Auth** | Already working; free for these methods (verify current terms). |
| Characters, handles, purchases, long-lived inventory and trade records | **Firestore via the existing Render API** (Admin SDK, deny-all rules) | Already the pattern; transactional; the API already verifies every token. |
| Position, facing, animation, who is in which room, join and leave | **Real-time server (WebSocket)**, memory only | A 10 Hz stream would exhaust Firestore's free writes in hours (section 7). |
| Disconnect detection | **Real-time server** (heartbeat and stale sweep, already in the prototype) | Firestore has no presence feature. (Firebase Realtime Database has `onDisconnect`, but it is another product to enable and its rules cannot check speed or room rules.) |
| Chat (live) | **Real-time server**, memory ring buffer | No storage cost; reports can store a copy. |
| Moderation records (mutes, bans, reports) | **Neon** (already free and already used by Iris; new tables, additive) or Firestore | Small, relational, queryable; optional for the first test. |
| Trading | **Server-authoritative service** (section 6): the real-time server only relays "a trade window is open"; the **Render API settles it in one Firestore transaction** | The browser must never decide who owns what. |
| Mobile social | Static page plus the same server in a `chat` mode (no world data, no 3D files) | Keeps the normal mobile website intact. |

## 5. Secure guest authentication

- A guest in multiplayer should be a **Firebase anonymous account**: a real uid, a short-lived signed token, no email. The hub verifies the token itself (Google public keys, as Iris does) and reads `firebase.sign_in_provider === "anonymous"`.
- **Never accept an identity from a message.** The prototype already enforces this: the client can send only `hello {token, room}`, `state {x, z, yaw}` and `bye`; any extra field (`uid`, `model`, `name`) is invalid.
- Guests: default character look, `Guest-` name, movement and presence (and later chat with a stricter rate limit). **No trading, no purchases, no handle-less chat**, matching how the API already refuses character creation for anonymous accounts.
- Registered or linked accounts get their stored character and their public handle.
- Abuse limits that need no new service: per-socket rate limits, speed and bounds limits, one session per account, a room cap, a uid deny-list and an allow-list (all in `protocol.cjs` or one environment variable away). **App Check** (free with reCAPTCHA; verify) would stop scripted sign-ups later but needs Console changes, so it is a later option, not part of the first test.
- Token revocation: Google's public-key check does not see revoked accounts for up to an hour. The Admin-SDK check does. For bans, keep a small uid deny-list in the hub.

## 6. Server-authoritative trading (design, not for the first test)

1. Today's save cannot support it (finding 3 above). Decide which items are **tradable** and move only those into a server-owned ledger, for example `vr_vault/{hashed uid}` holding `{items: [{id, kind, serial}]}`, written **only** by the Render API. Credits and non-tradable gear stay in the save.
2. Items enter the vault from server events only (a purchase webhook, or a server-validated reward), never from a browser claim.
3. A trade is a small state machine held by the server: `offer` (A lists items) then `accept` (B) then `confirm` (both). The **API** settles it in a single Firestore transaction: re-read both vaults, verify each item is still owned and tradable, check revision counters, swap, write an append-only `vr_trades/{id}` record with both uids, items and time, and make settlement **idempotent** (trade id as document id, as `vr_orders` is for payments).
4. The real-time server only carries messages ("trade window open", "A accepted") and asks the API to settle; it never writes items.
5. Registered accounts only, a value cap per day, a cool-down, and a kill switch environment variable, all server-side.

## 7. Expected free-tier usage (figures from public pages found 2026-11-05; **verify before relying**)

| Service | Free allowance | This design's use |
|---|---|---|
| **Firestore (Spark)** | 50,000 reads, 20,000 writes, 20,000 deletes per day, 1 GiB stored ([sources](https://www.activepieces.com/blog/firebase-pricing-2026-plans-costs-and-free-limits.md), [costbench](https://costbench.com/software/database-as-service/firestore/free-plan/)); overage prices conflicting across sites, official page not opened | **Do not** put positions here: 1 write per second per player is 3,600 writes per player-hour, so about 5.5 player-hours exhaust the day; listeners multiply reads by the number of watchers. With the hub: about 1 read per join (the character), a few writes per trade. 100 joins and 500 trades a day is about 100 reads and 1,500 writes. Existing saves are the largest user (one write per cloud save). |
| **Firebase Auth** | Anonymous, email link and Google sign-in carry no per-use charge (phone/SMS is the paid part) | Unchanged. |
| **Render free web service** | 750 instance-hours per month per workspace; spins down after 15 minutes without an incoming HTTP request **or WebSocket message** (changed 2026-02-24); wakes in about a minute on the next request or connection; filesystem is not kept ([Render docs](https://render.com/docs/free), [changelog](https://render.com/changelog/free-web-services-now-remain-active-while-receiving-websocket-messages)) | A hub awake only while players are connected, about 8 hours a day, is about 240 of the 750 hours, shared with the API and Iris (spun-down time is free). Clients must show "Waking the District..." for up to a minute. Render may restart a free service at any time: all room state is rebuilt by clients reconnecting (already built and tested). |
| **Hub bandwidth and CPU (estimate)** | Render includes a monthly outbound allowance (**unverified**) | Each state message is about 60 bytes at 10 Hz, so 600 B/s per player up. A room of 12 sends each player about 11 x 720 B/s = 8 KB/s, 29 MB per player-hour; about 95 KB/s total out. CPU for tens of sockets is trivial. |
| **Neon (free)** | 100 projects, 100 compute-hours per project per month, 0.5 GB per project, 5 GB transfer ([Neon FAQ](https://neon.com/faqs/free-plan-limits-and-quotas)) | Not used by the first test. Moderation tables would be kilobytes. Neon scales to zero, so a cold query costs a short delay. |

Billing plan of the Firebase project (Spark or Blaze) is **unverified**; if it is already on Blaze, the free allowances above still apply but overage would be billed, so keep the hard caps in the hub.

## 8. Smallest safe implementation: two real players meet in the District

**Goal:** David and one invited player, on their own computers, see each other in the District interior.

1. **Hub service**: deploy `tools/district-hub/` (renamed `district-hub`) as **one new free Render web service**, modelled on `iris-service/render.yaml` (`plan: free`, **`autoDeploy: false`**, secrets not in the repository). Needs no database and no Firebase credential.
2. **Replace `emulator-providers.cjs`** with: (a) token verification using Google's public keys (copy the logic of `iris-service/server/firebaseAuth.ts`; project id `the-darknet-district-71873`), and (b) the **character lookup by forwarding the player's own token to the existing `GET /api/void-runner/character`** on the Flask API. The hub then holds no Firestore access at all and every read goes through the API's existing checks. A handle can be read the same way (`GET /api/identity/me`).
3. **Access control for the test**: an environment variable `HUB_ALLOWED_UIDS` (like `IRIS_ADMIN_UIDS`): only listed accounts may join; everyone else is refused at `hello`. Origin allow-list: the site's two origins. Room cap and limits stay as built.
4. **Client**: `void-runner/remote-players.js` already reads the player's own token from `VoidAccount.user.getIdToken()`; change the gate so an allowed tester on the real site can switch it on (for example a local flag on the unlisted game page) and point the hub address at the Render service (`wss://`). It ships inert for everyone else.
5. **Nothing else changes**: no new collections, no rules, no Auth settings, no Neon, no save changes, no VR or NPC changes.
6. **Rollback**: stop or delete the Render service; clients simply find no hub and play single-player.

### What this needs from David (not requested now)
Creating the Render service (free plan, but a new running service), setting its environment variables, and merging the client change (merging to `main` publishes the site). Test with the allow-list first. Everything in steps 1 to 4 is already prototyped except the two production providers.

## 8b. Status 2026-11-05: the hub is now built to this plan (not deployed)

Steps 1 to 4 and the client switch of section 8 are implemented and tested; steps 1 (creating the Render service) and the merge remain with the owner. Details, the exact configuration and the rollback are in `HUB_DEPLOYMENT.md`. Two refinements to the plan above: the production hub **requires** an account allow-list (it refuses to start without one), and on the live site the client reads the hub address only from the tester's own stored flag (never from the address bar), so a crafted link cannot send a player's sign-in to another server.

### Hub security review

| Threat | Control | Tested by |
|---|---|---|
| Forged, edited, expired or wrong-project token; `alg: none`; key-confusion | RS256 only, Google's public keys, audience, issuer, expiry and issue-time checks, key rotation handled | `district-hub-production.test.cjs` (every case) |
| A client claiming another identity, model or name in a message | Only `hello {token, room}`, `state {x, z, yaw}`, `bye` parse; any extra field is invalid; the client code is pinned not to send identity fields | protocol, client and ws tests |
| An unlisted or banned account joining | Allow-list and deny-list on the **verified** account id; empty allow-list means no start | `district-hub-prod-ws.cjs`, config tests |
| Sign-in token sent to a hostile server via a crafted link | Live-site hub address only from the tester's own storage, `wss://*.onrender.com` only; the address bar is ignored; local pages accept local hubs only | `remote-players.test.cjs` |
| Cross-site use of the hub from another web page | Exact origin allow-list (production); missing origin refused | prod ws test |
| Flooding, huge messages, teleporting | 512-byte limit (4.4 KB for the login message), 40 messages per second, speed, bounds and one jump per 5 s, repeat offenders disconnected | protocol and prod ws tests |
| Connection exhaustion | 4 per address, 20 new per minute per address, 60 overall, hello deadline 45 s, 12 per room | limits tests, prod ws test |
| Forged `X-Forwarded-For` to dodge limits | Only the right-most entry that our own proxy added is trusted | `limits` tests |
| Duplicate avatars, ghosts, reconnect storms | One session per account (replace), heartbeat and stale sweep, `leave` exactly once, client clears and rebuilds on reconnect, backoff, restart code 1012 | protocol, ws and both browser tests |
| Script injection through names | Handle re-validated on the hub (3 to 20 letters, digits, underscore) and on the client; names drawn as canvas text, never markup | production and client tests |
| Information leakage | `/health` returns only a count; logs hold public ids, never tokens or account ids | prod ws test |
| API or Firebase outage | A failed lookup yields the default look and a guest name, never a refusal; a failed key fetch means "not signed in" | production tests |

Accepted limits: a revoked account keeps working for up to an hour unless on the deny-list; a stolen valid token can be replayed until it expires (an hour) by someone who also passes the allow-list and origin checks (the allow-list makes this a short list of people); position cheating within the speed and bounds rules; free-tier sleep and restarts.

## 9. Later phases
Chat and moderation (hub plus Neon tables); mobile chat page and the "ENTER on a phone" notice; shared landing locations (more rooms, loading district looks in the street, per-tier avatar caps); vault and trading (section 6); optional App Check; sharding only if a room cap is reached.

## 10. Pending administrator action (recorded, not requested now)

1. **Firestore security rules review**: read the deployed complete ruleset and confirm no broad allow overrides the deny-all fragments; consider adding a reviewed `firestore.rules` and `firebase.json` to the repository.
2. Confirm the Firebase plan (Spark or Blaze), Auth providers and authorized domains, whether App Check is enabled, and the Render API's plan and auto-deploy setting.
3. Decide guest policy, chat policy and minors policy before any public test.
