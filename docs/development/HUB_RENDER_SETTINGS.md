# District multiplayer hub: intended Render settings

> **2026-11-06 status update:** The owner reports a `district-hub` service at `https://district-hub-mbo7.onrender.com`, deployed from `claude/character-creator` commit `4c60781`, and a prior 200 JSON response from `/health`. Current settings have not been independently inspected; see `CODEX_TO_CLAUDE_HANDOFF_2026-11-06.md`.

This page records the intended settings. It does not prove which values are applied to the current service. Any further deployment or configuration change needs the owner's approval.

## Which service is which (so the wrong app is never deployed)

| Service | Blueprint / folder | Render name | Start |
|---|---|---|---|
| **Multiplayer hub (this page)** | `tools/district-hub/render.yaml`, rootDir `tools/district-hub` | `district-hub` | `node server.cjs` |
| Game API | repo root (`server.py`, `void_runner_api.py`), already live | `the-darknet-district-site` | its own settings, do not touch |
| Iris chat | `iris-service/render.yaml`, rootDir `iris-service` | `iris-chat` | `npm run start` |
| The website | GitHub Pages (not Render) | n/a | merging to `main` publishes it |

There is no `render.yaml` at the repository root, so a Blueprint pointed at the root would find nothing. Always set the Blueprint file path to `tools/district-hub/render.yaml`, or create the web service by hand with the values below.

## Settings

| Setting | Value |
|---|---|
| Service type | Web Service |
| Service name | `district-hub` |
| GitHub repository | `Smartsec916/the-darknet-district-site` |
| Deployment branch | See "Which branch" below. Never `main` until the hub work is merged there. |
| Root directory | `tools/district-hub` |
| Runtime | Node (`NODE_VERSION=22`; the package needs `>=20`) |
| Build command | `npm ci --omit=dev` (one dependency, `ws`; a lock file is committed) |
| Start command | `node server.cjs` |
| Health-check path | `/health` |
| Auto-deploy | **Off** (`autoDeploy: false`): deploy only by hand |
| Plan | Free (a free service sleeps when idle and takes about a minute to wake on the first connection; the game shows "Waking the test server") |

## Environment variable names

Set in the Render dashboard. Names only here; **no secret is needed**: the hub verifies sign-ins with Google's public keys and holds no Firebase credential, database or service account.

| Name | Value | Note |
|---|---|---|
| `HUB_MODE` | `production` | in the blueprint |
| `HUB_API_BASE` | `https://the-darknet-district-site.onrender.com` | the existing game API |
| `HUB_ALLOWED_ORIGINS` | `https://thedarknetdistrict.com,https://www.thedarknetdistrict.com` | exact origins |
| `FIREBASE_PROJECT_ID` | `the-darknet-district-71873` | |
| `HUB_ALLOWED_UIDS` | the Firebase account ids of the two testers, comma separated | **required**: empty = the hub refuses to start. Copy ids from the homepage account menu (COPY ACCOUNT ID). Not emails. |
| `HUB_DENY_UIDS` | optional | always refused |
| `HUB_MAX_PER_IP`, `HUB_MAX_NEW_PER_MINUTE`, `HUB_MAX_CONNECTIONS` | `4`, `20`, `60` | defaults |
| `NODE_VERSION` | `22` | |

Do **not** set `HUB_ALLOW_ANY_SIGNED_IN`, `HUB_TRADING`, or any `FIREBASE_*_EMULATOR_HOST` (production refuses trading and emulator settings).

## Which branch

- **Hub as reviewed in PR #196** (secure hub, no creator looks): `codex/conversations-character-foundation`.
- **Hub with creator looks** (appearance in player views, `refresh` message): `claude/character-creator` (PR #197), only after you review it. It contains everything in #196.
- Both are dashboard choices (Render keeps the branch in the service settings, the blueprint does not name one). If the service is later switched to the other branch, redeploy by hand.

## To see other players' creator looks online

All of these are separate approvals: (1) deploy the hub from `claude/character-creator`; (2) set `VOID_APPEARANCE_ENABLED=true` on the **game API** service `the-darknet-district-site`; (3) a reviewed code change setting `LIVE_HUB` in `void-runner/remote-players.js` to the hub's `wss://district-hub.onrender.com` address plus publishing the site (merge to `main`). Without (2) the hub still works and shows each player with their original character.

## Manual deploy and rollback

1. Dashboard > `district-hub` > **Manual Deploy** > Deploy latest commit (or pick a commit). Check **Logs** for `listening` and the allow-list size, then open `https://<service>.onrender.com/health`.
2. Rollback: **Events/Deploys** tab > a previous successful deploy > **Rollback**. Or switch the branch back and redeploy.
3. Emergency stop: **Suspend** the service. The game then shows "Cannot reach the test server" and everyone plays solo; saves are never touched.
4. Removing a tester: delete their id from `HUB_ALLOWED_UIDS` (or add to `HUB_DENY_UIDS`) and redeploy.

## Pre-flight checks (local, already automated)

`tests/district-hub-render.test.cjs` pins: free plan, manual deploy, `rootDir`, no secrets, no open test by default, one dependency, and that the hub's files only use files inside its own folder (the appearance rules are byte-identical copies in `tools/district-hub/appearance/`, kept in sync by `node tools/assets/sync-hub-appearance.cjs`).
