# Plan: two independent players in the same District instance

Written 2026-11-05. **Plan only. Nothing here is built, deployed or connected to a paid or production service.**

## 1. What exists today (verified in the repository)

| Piece | State |
|---|---|
| Accounts and identity | Firebase Auth (guest = anonymous account, registered = email link, Google or password). `void_runner_api.py` verifies ID tokens server-side. Character slot: one per account, server-authorized (`docs/development/LOCAL_API_TEST.md`). Public handles: `identity_api.py`. |
| Realtime transport | **None.** The game is static files plus HTTP calls. There is no WebSocket, WebRTC or polling code in the game (a search of `void-runner/*.js` finds none). `docs/void-runner/multiplayer-and-mobile-chat-plan.md` (2026-11-04, plan only) recommends a small "hub" on Render, modelled on the Iris service, which already uses the `ws` library, verifies Firebase tokens without a secret and has rate limiting. |
| Local conversation history | Browser-local only (`conversation-history.js`). Not shared. |
| Remote-player rendering | None in the game. This milestone added a **local-only dev preview** (`void-runner/avatar-preview.js`, needs a localhost address and `?avatar-preview=1`) that places the account's chosen District look in front of you with an idle clip, proving the model can be shown as a "second player" without touching any NPC. |
| World determinism | The District is a fixed scene; NPC placement is seeded locally and not synchronized, so two clients will see different crowd positions. Only players need to be shared. |

## 2. What the first two-client test should prove (and nothing more)

1. Two browsers, two different accounts (or two emulator accounts), join one named room (`district-street-1`).
2. Each sees the other as that account's chosen character (smuggler or resident look) at the other's position, walking and idle, with a handle label.
3. Position updates are validated by the server (bounds of the location, maximum speed, rate limit); a tampered client cannot teleport or flood.
4. Leaving (tab close, network drop) removes the avatar for the other player within a few seconds.
5. No gameplay, saves, purchases or missions are shared or writable through the room. Chat stays out of this first test.

## 3. Proposed minimum design

- **A tiny dev hub** (Node + `ws`, about 200 lines, under `tools/district-hub/`, **not** `iris-service/`): `hello` carries a Firebase ID token; the hub verifies it (against the **Auth emulator** locally, against Google's public keys only after approval), looks up the character (from the Firestore emulator through the existing `/character` API), then assigns the room.
- **Messages** (whitelist, JSON, bounded size): `hello`, `state {x,z,yaw,clip,t}` at 10 Hz, `bye`. Server broadcasts `peers` (handle, model, last state). The client smooths with interpolation (`avatar-preview.js` supplies the model/animation code to reuse).
- **Server checks:** token valid and not anonymous-impersonating (guests get a guest handle and the default look); one session per account; max speed (about 6 m/s) and bounds per location; 12 messages/s per socket then disconnect; no client-chosen identity fields.
- **Client:** a `remote-players.js` behind the same localhost-only gate as the preview; one avatar per peer via `VoidAssets.instance('crowd:'+model)` and `VoidCrowd.animate`; walk/idle chosen from measured speed; dispose on `bye`.

## 4. What can be tested locally, at no cost, without approval

- Everything above on one machine: Auth + Firestore emulators (done), the dev hub on `127.0.0.1`, two Playwright browser contexts (two independent localStorage/IndexedDB profiles) signed in as two emulator accounts, asserting each sees the other's model and position, tamper attempts rejected, disconnect cleanup, and Low/High graphics.
- Limits: software rendering gives low frame rates; this proves correctness and rejection logic, not real latency, bandwidth or GPU cost.

## 5. What needs David's approval

| Item | Why |
|---|---|
| Hosting the hub anywhere other than this machine (Render free service, or alternatives A/B/C in the 2026-11-04 plan) | New running service; free tiers sleep and need verifying; any paid always-on plan costs money. |
| Using real Firebase Auth (production project) for hub tokens | Production system; also decide guest policy. |
| Publishing the game route that loads `remote-players.js` for real players | Merging to `main` publishes the site automatically. |
| Any stored data (reports, bans, presence history) in Neon or Firestore | Production databases and a retention/privacy decision (minors, chat policy). |
| Deploying Firestore rules (none are in the repo; see `LOCAL_API_TEST.md`) | Production change. |
| Real-device or real-GPU testing | Needs David's PC, or a second person for a true two-person session. |

## 6. Proposed order

1. Dev hub with emulator tokens and a protocol unit test (pure logic: validation, speed/bounds, rate limit) in `npm test`.
2. `remote-players.js` (dev-only) and a two-context Playwright test at Low and High.
3. A two-person session on David's PC against a hub on his machine (LAN), still no cloud.
4. Only then: decide hosting and approvals above.
