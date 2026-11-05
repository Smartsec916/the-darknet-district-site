# District hub: deployment instructions, security notes and rollback

Written 2026-11-05. **Nothing here has been done.** No Render service exists for the hub, nothing was deployed, no Firebase or Firestore setting, rule or data was touched, no paid service is involved. This document is the checklist for when the owner decides to run a real two-person online test.

## 1. What is ready

| Piece | Where | State |
|---|---|---|
| Token verification with Google's public keys (no secret) | `tools/district-hub/google-auth.cjs` | Built and tested: signature (RS256 only), audience, issuer, expiry, issue time, key rotation, outage. Port of the Iris service's `firebaseAuth.ts`. |
| Character and handle from the **existing** game API, using the player's own token | `tools/district-hub/api-providers.cjs` | Built and tested with an in-process fake of the API. The hub holds no Firebase credential and no database access. |
| Account allow-list and deny-list | `config.cjs`, `hub-server.cjs` | Built. An empty allow-list makes the production hub **refuse to start**. |
| Name tags from registered handles, guest fallback | `protocol.cjs`, `void-runner/remote-players.js` | Built and tested; handle accounts show the handle, everyone else `Guest-xxxx` or `Pilot-xxxx`. |
| Limits: message size, movement, flood, per-address and total connections, room cap, origin check | `protocol.cjs`, `limits.cjs`, `hub-server.cjs` | Built and tested. |
| Reconnect, duplicate-session, drop and restart handling | hub and client | Built and tested at Low and High (restart: clients told 1012, back in about 5 s locally). |
| Render Blueprint draft | `tools/district-hub/render.yaml` | `plan: free`, `autoDeploy: false`, no secrets. Not applied anywhere. |
| Client switch | `void-runner/remote-players.js` | Off for everyone. On the live site it needs two flags the **tester** sets in their own browser (section 4). |

## 2. What still requires configuration (all need the owner)

1. **Create the Render service** from `tools/district-hub/render.yaml` (a new free web service named `district-hub`; a Blueprint or a manual service with the same settings).
2. **Set `HUB_ALLOWED_UIDS`** in the Render dashboard: the Firebase account ids of the people in the test (see section 3). Optional `HUB_DENY_UIDS`.
3. **Merge the client to `main`** (this publishes the site; `remote-players.js` ships inert) or test from a local copy of the branch against the live hub.
4. Confirm the **game API's CORS and sign-in checks** need no change: the hub calls the API server-to-server with the player's token, and `/api/void-runner/character` and `/api/identity/me` already accept it. (No change is expected; the API's own settings are unverified, see `FIREBASE_MULTIPLAYER_AUDIT.md`.)

Not needed: any Firebase Console change, any Firestore rule or index, a new database, a service account, billing.

## 3. Minimum steps for a real two-person online test

1. Each tester signs in on `https://thedarknetdistrict.com/void-runner.html` (the unlisted route) and finds their **account id** in the account menu (COPY ACCOUNT ID, as for `IRIS_ADMIN_UIDS`). A tester who wants a name tag should have claimed a handle; a handle-only (anonymous) account works too, and a guest without a handle shows as `Guest-xxxx`.
2. Owner creates the Render service (section 2.1) and sets `HUB_ALLOWED_UIDS=<id1>,<id2>`. Deploy it by hand (Manual Deploy). Wait for the health check (`https://<service>.onrender.com/health` returns `{"ok":true,"players":0}`); the first request after sleep takes up to about a minute.
3. The client change reaches the site (section 2.3).
4. Each tester opens the browser console on the game page once and runs (with the real service name):
   ```js
   localStorage.setItem('tdd-multiplayer','1'); localStorage.setItem('tdd-hub','wss://district-hub.onrender.com');
   ```
   then reloads. (Two local flags; the address bar cannot do this. They live only in that browser; remove them with `localStorage.removeItem(...)`.)
5. Both start or continue a campaign: they wake in Sleeping Pod 01 and walk into the District interior. When both are inside, each sees the other with a name tag. The status line `VoidRemotePlayers.status` in the console says `in`, `waking the server`, `not on the test list`, and so on.
6. Check the list in section 7, then stop the test (section 6).

## 4. Safety properties (what the design guarantees)

- **Identity is never taken from a message.** The client sends only `hello {token, room}`, `state {x, z, yaw}` and `bye`; any other field is invalid, and unit tests pin that the client code cannot send an identity, model or name. The hub verifies the token itself, takes the account id from it, and learns the character and handle from the API with that same token.
- **A crafted link cannot send a player's sign-in elsewhere.** On the live site the client reads the hub address only from the tester's own stored flag, accepts only `wss://<name>.onrender.com`, and ignores the address bar. The hub, in turn, accepts connections only from the site's exact origins.
- **Fail closed.** No allow-list means no start; a bad token, an unlisted or denied account, a wrong origin, an invalid message or too many connections is refused with a distinct close code. The health page reveals only a player count.
- **One session per account**; a second connection replaces the first. Silent clients are removed by a heartbeat and a stale sweep, so no ghost avatar stays.
- **Limits**: 512-byte messages (4.4 KB for the one login message), 40 messages per second per player, a speed and bounds check, one position jump per 5 s, 12 players per room, 4 connections and 20 new connections a minute per address, 60 connections overall.
- **Optional and interior-only**: the client connects only in the District interior in walking mode and disconnects everywhere else (street, VR, flight, combat). Nothing about multiplayer touches saves, NPCs, the pod, music or conversations.
- **Phones and mobile visitors**: `remote-players.js` is one of the game scripts that the device gate keeps inert, so a phone never downloads it, and the normal website is unchanged.

## 5. Known limits (security and behaviour)

- Google's public-key check cannot see a revoked account for up to an hour; use `HUB_DENY_UIDS` to remove someone at once.
- A cheating client can still choose any position that obeys the speed and bounds rules (the bounds are a coarse box, not the floor plan). Fine for presence, not for anything with consequences.
- Free Render hosting sleeps after 15 minutes without HTTP or WebSocket traffic and may restart at any time; clients reconnect on their own. Memory-only state means nothing is lost that matters.
- No chat, trading, name-tag moderation, mute or block yet; the allow-list is the only moderation for the first test.
- Tokens travel inside the WebSocket message over `wss://` (TLS provided by Render).
- The hub code and `render.yaml` sit under `tools/`, which the site build publishes as ordinary files. They contain no secret.

## 6. Rollback and stopping

| Situation | Action |
|---|---|
| Stop the test now | In the Render dashboard **Suspend** the `district-hub` service (or delete it). Clients show `offline`, retry quietly with a growing delay, and everyone keeps playing single-player. |
| Remove one person | Add their account id to `HUB_DENY_UIDS` (or remove it from `HUB_ALLOWED_UIDS`) and restart the service. |
| Hub misbehaves after a deploy | Render keeps previous deploys: use **Rollback** to the last good one. Because `autoDeploy` is off, nothing changes until the owner deploys. |
| The client change is the problem | Revert the merge commit on `main` (a new revert pull request; no force-push). Testers can also clear their two flags to turn it off for themselves at once. |
| Nothing else to undo | No Firebase setting, rule, collection, document, database or secret was created, so there is nothing to clean up. |

## 7. Test checklist for the real session

- [ ] Both testers see each other with the right character and name (or `Guest-xxxx`).
- [ ] Walking and turning look right; closing a tab removes the avatar within about 12 s.
- [ ] Reloading a tab leaves exactly one avatar of that tester.
- [ ] An account not on the list sees `not on the test list` and plays single-player.
- [ ] Leaving the District interior (street, VR room, flight) disconnects; single-player still works everywhere.
- [ ] Frame rate on the real PC (Low and High) with the other player in view.
- [ ] The phone still shows the normal website.
