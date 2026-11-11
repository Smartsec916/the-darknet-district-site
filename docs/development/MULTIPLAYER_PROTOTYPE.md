# Local two-player multiplayer prototype

Written 2026-11-05. **Local development only.** Nothing here is deployed, published, connected to a paid service, or connected to production Firebase, Firestore, Neon, Render or any live user record. For players the game contains none of this behaviour (see "Gates").

> **Update 2026-11-05:** the hub now has a **production mode** (Google public-key token verification, character and handle from the existing game API with the player's own token, account allow-list, name tags, connection limits, Render Blueprint draft). It is prepared, tested locally, **not deployed**. See `HUB_DEPLOYMENT.md`. The emulator mode described below remains the way to develop and test locally.

## What it does

Two browser sessions, each signed in as a different **local emulator account**, join the same District interior. Each sees the other as that account's chosen character (the existing animated `district-smuggler` or `district-resident` crowd model), at the other's real position and facing, walking or standing.

```
 browser A ──ws──┐                       ┌── Auth emulator (who is this token?)
                 ├─ tools/district-hub ┤
 browser B ──ws──┘   (127.0.0.1:8787)     └── Firestore emulator (which character is stored for that account?)
```

## Files

| File | Role | Replaceable by production? |
|---|---|---|
| `tools/district-hub/protocol.cjs` | **Pure rules**: message whitelist, rooms, speed/bounds/snap/flood limits, the join / replace / leave / sweep logic. No network, no clock, no storage (a clock is injected). | **Kept as is.** |
| `tools/district-hub/hub-server.cjs` | WebSocket transport (`ws`), heartbeat, hello timeout, local-origin check. Takes the two providers below as arguments. | Kept; add TLS, real limits and logging. |
| `tools/district-hub/emulator-providers.cjs` | The only code that talks to anything: `verifyToken` (Auth emulator) and `characterModel` (Firestore emulator). Refuses non-local addresses and real credentials. | **Replace** with Google public-key token verification (as `iris-service/src/firebaseAuth.ts` does) and a server-side Firestore read. |
| `tools/district-hub/server.cjs` | `npm run hub:dev`, default port 8787. | Replace with the production entry point. |
| `void-runner/remote-players.js` | Game-side client: sends this player's x, z, facing at 10 Hz; draws the others. Gated, never saves. | Kept; swap the gate and the token source. |
| `void-runner/avatar-preview.js` | Earlier single-avatar preview (unchanged). | Dev only. |
| Tests | `tests/district-hub-protocol.test.cjs` (9, in `npm test`), `tests/remote-players.test.cjs` (3, in `npm test`), `tests/district-hub-ws.cjs` (4, real sockets and emulators), `tests/multiplayer-browser.cjs` (two real browsers, Low or High). | |

## Run it

1. Start the emulators (`docs/development/LOCAL_API_TEST.md`).
2. Hub: `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 npm run hub:dev`
3. Serve the game (`node tests/serve-modern.cjs`, port 5187) and open `http://127.0.0.1:5187/void-runner.html?multiplayer=1` in two separate browser profiles. For each, put a **local emulator** ID token in `localStorage['tdd-dev-mp-token']` (the browser test shows how; the game's normal sign-in cannot reach the emulator yet). Start a new campaign in each; they wake in Sleeping Pod 01 and join when the District interior is active.
4. Automated: `FIRESTORE_EMULATOR_HOST=… FIREBASE_AUTH_EMULATOR_HOST=… SITE_TEST_URL=http://127.0.0.1:5187 node tests/multiplayer-browser.cjs low` (or `high`); `node --test tests/district-hub-ws.cjs`. Needs `npm install` (adds `ws`, the library the Iris service already uses) and Playwright with a browser.

## Authorization and identity

- The client sends exactly three messages: `hello {token, room}`, `state {x, z, yaw}`, `bye`. **Any other field, including `uid`, `model`, `name`, `admin`, is an invalid message** (refused, counted, and repeat offenders disconnected). A unit test pins that the client code cannot send them.
- The server verifies the token itself, takes the account id from it, looks up the stored character itself and chooses the animation itself (from measured speed). The public id other players see is a salted hash of the account id; the account id is never sent to anyone.
- **Guests** (anonymous accounts) and registered accounts without a character get the default look and a `Guest-` name; a guest cannot claim a registered character. **Admin** has no animated model, so it renders as the default look.
- One session per account: a second connection **replaces** the first (close code 4001, no auto-reconnect on the replaced one, so two tabs cannot fight). The one-character-per-account rule is unchanged: the hub only reads what the API stored (`tests/test_character_emulator.py`).
- Origin: only `localhost` / `127.0.0.1` web origins may connect; the server binds to `127.0.0.1`.

## Joining, leaving, disconnecting, reconnecting

- A player appears to others only after reporting a position. `leave` is sent exactly once for a clean `bye`, a closed socket, an abrupt drop, a kick, or a silent client (heartbeat plus a 12 s stale sweep). Replacing a session does not remove the new session when the old socket finally closes.
- The client clears all remote avatars whenever its socket closes or the room changes, then rebuilds from the hub's welcome snapshot, so a reconnect never duplicates an avatar. It reconnects with backoff (1, 2, 4, 8, 15 s). Tested: hub stopped and restarted, both browsers reconnect and redraw exactly one avatar each.

## Synchronization, performance, limits (measured on software rendering, not a real GPU)

- Rate: 10 Hz uplink per player, relayed at up to ~12 Hz. A state message is about 60 bytes: two players is a few KB/s. Interpolation (exponential smoothing) hides the 100 ms step.
- Measured in the two-browser test on software GL (Low): the other player's position was exact (0.00 m) and facing within 0.006 rad about 0.7 s after the walker stopped. This is frame-rate-bound, not network-bound (everything is on localhost).
- Animation: the server picks `walk` or `idle` from measured speed and holds `walk` for 450 ms after the last movement so a slow frame rate cannot flicker the clip. Other existing clips (`talk`, `sit`, `smoke`) are not synchronized.
- Server rules (prototype values): speed 9 m/s with slack; one "snap" jump per 5 s (a door, leaving the pod); coarse ±400 m bounds that are **not** the floor plan; 40 messages per second then disconnect; 12 players per room. **A cheating client can still choose any reachable position** that obeys these rules. That is acceptable for presence, not for gameplay.
- Not synchronized: NPCs (each client has its own crowd), doors, music, the pod interior state, items, conversations, saves, missions, vertical position (remote players are drawn at the local floor height), headings of NPCs.
- The remote players are drawn only in the District **interior**. The street loads a different set of crowd models, so street multiplayer needs those models loaded on demand first.
- No name tags, chat, or emotes yet.
- Not run: real GPU, real network latency, a physical second computer, more than two human sessions (a third was simulated with a plain socket), 12-player rooms.

## What stays untouched

The VR rooms and companions, NPC crowds, Sleeping Pod 01, the pod music player, saves, the conversation panel and protected locations. The client only runs in the interior in walking mode, never touches `state`, never calls `save()`, and never writes browser storage. The browser test asserts an unchanged NPC count, story state, credits and location after the other player has come and gone, and the existing conversation, pod-music and VR browser suites were re-run (see `AI_HANDOFF.md`).

## Gates

`remote-players.js` is inert unless a tester has switched it on, and then it works only in the District interior (walking mode):

- **Local page** (`localhost` or `127.0.0.1`): `?multiplayer=1` (or the local flag `tdd-multiplayer=1`), hub on a local `ws://` address (address bar `?hub=` or flag `tdd-hub`).
- **Live site** (`thedarknetdistrict.com`, https only): **both** local flags `tdd-multiplayer=1` and `tdd-hub=wss://<name>.onrender.com` set by the tester in their own browser. The address bar is ignored there, so a crafted link cannot switch it on or point a sign-in at another server.

It is one of the game scripts the device gate keeps inert, so phones never download it. Merging to `main` still publishes the file, so it ships as inert code; **do not remove the gates**. The tester's token is the player's own Firebase sign-in (`VoidAccount.user.getIdToken()`); a locally stored test token is honoured only on a local page.

## Infrastructure needed for a future public multiplayer test (all need David's approval)

1. A hosted hub (Node, `ws`): a Render free web service (sleeps when idle, cold start) or a small always-on plan (cost), per `docs/void-runner/multiplayer-and-mobile-chat-plan.md` option A.
2. Real token verification (Google public keys, no secret) and a server-side read of the character (Firestore service access, or the character API) to replace `emulator-providers.cjs`.
3. TLS (`wss://`), a production origin allow-list and a CORS-style origin check for `thedarknetdistrict.com`.
4. Rooms beyond one: sharding, capacity, assignment (the 2026-11-04 plan, sections 6 and 8), plus abuse controls, mute/ban, and a policy on guests and minors.
5. Loading the district looks in the street (or restricting rooms to the interior), and a rendering budget per quality tier for many avatars (instancing, a cap per tier).
6. Firestore security rules in the repository and reviewed (see below).
7. Publishing the client (a merge to `main` deploys the site) with the gate changed deliberately.

## Pending administrator action (recorded, not requested now)

**Production Firestore security rules review: pending.** The repository holds only deny-all merge fragments (`void-runner/firestore.rules` and others), not the deployed complete ruleset, and nothing was inspected live (see `FIREBASE_MULTIPLAYER_AUDIT.md`); whether a signed-in browser can write `vr_players/*` directly to production Firestore is unknown. Nothing in this prototype depends on it, because all work used the emulators.
