# Blackout Protocol Firebase deployment notes

This feature reuses the existing Firebase project `the-darknet-district-71873` and `firebase-auth.js`. It adds a Blackout Protocol blueprint to the existing Flask API. No service-account key belongs in this repository.

## Deployment sequence

1. Review and deploy `blackout_api.py` and the `server.py` blueprint/CORS additions to the existing Render service. That service needs the Firebase Admin application credentials it already uses for VOID//RUNNER. Set `BLACKOUT_ACCOUNTS_ENABLED=true` only after the database rules and indexes below are ready. If a development frontend uses another origin, set `BLACKOUT_EXTRA_ORIGINS` to an explicit comma-separated list; do not use `*`.
2. Merge the six `bp_*` collection matches in `blackout-protocol/firestore.rules` into the project's **current complete** Firestore rules. Do not deploy that snippet as a replacement rules file; doing so could alter unrelated services. It denies all browser SDK reads/writes to Blackout collections. Firebase Admin on the trusted API still has access.
3. Add the two composite indexes from `blackout-protocol/firestore.indexes.json` to the project's **current complete** index configuration. Do not replace other indexes. Wait until both are ready before enabling the API flag.
4. Deploy the Blackout game files in both `blackout-protocol/` and `static/blackout-protocol/` with the existing hosting process. The main website's current Google sign-in authorized domains should already include `thedarknetdistrict.com`; check this in Firebase Authentication before live sign-in testing.
5. Test a staging account in two browsers: Google sign-in/out, handle claim and collision, ranked run start, sequential level recording, death and Level 6 completion submissions, persistent personal best, top-100 order, exact personal rank, guest viewing, and direct Firestore SDK write denial. Test the homepage and VOID//RUNNER authentication after merging rules. Then enable production traffic.

## Collections

| Collection | Purpose | Browser SDK access |
| --- | --- | --- |
| `bp_profiles` | Public handle and its normalized key, keyed by hashed Firebase UID | Denied; exposed selectively by API |
| `bp_handles` | Atomic case-insensitive handle reservation | Denied |
| `bp_stats` | Private UID, best score, highest completed level, completed games, dates, rate limits | Denied |
| `bp_leaderboard` | One public entry per hashed UID; handle, best score, highest level, stable tie key | Denied; top 100 served by API |
| `bp_runs` | Server-issued run state and stage evidence | Denied |
| `bp_submissions` | Accepted submission record keyed by run ID | Denied |

The leaderboard API sends only the handle, rank, best score, and highest level. It never sends email. A signed-in player receives their private statistics and exact rank from the API. Ties use the pseudonymous account key in ascending order.

## Score validation boundary

The server verifies Firebase ID tokens, a server-issued run ID, sequential levels, a minimum 12-second interval per level, score monotonicity, per-level caps, a score-event ledger, a 30-second new-run cooldown, a four-hour maximum run, and duplicate submission IDs. Only the server writes rankings. These checks reject malformed and implausible requests, but a modified browser can fabricate its own event ledger and wait out timers. Truly tamper-resistant scores would require an authoritative server simulation or replay system with deterministic inputs and seeds. Do not describe this implementation as proof of genuine gameplay.

If Firebase or the API is unavailable, guest and local play continue. Failed ranked submissions are not silently promoted later; the game shows the service error and retains the browser-local score. Live account, cross-device, and direct-rule tests cannot be completed until the rules/indexes/backend are deployed to a staging environment.
