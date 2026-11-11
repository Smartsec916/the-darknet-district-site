# Local, non-production API test environment

Written 2026-11-05. Nothing here connects to production Firestore, Firebase Auth, Neon, Render or Stripe, and nothing here costs money.

## What it is

The real Firebase **Auth emulator** and **Firestore emulator** (Google's own local test servers, free, run by `firebase-tools` and Java) plus the **real** `void_runner_api.py` Flask code served over real HTTP on `127.0.0.1`. The test signs people up and in through the emulator, so the API verifies genuine (emulator-issued) ID tokens with the same `firebase_admin` code path it uses in production, and character creation runs in real Firestore transactions, not a fake.

Safety: the project id is `demo-darknet-local` (Firebase reserves the `demo-` prefix for projects that cannot exist online). `tests/test_character_emulator.py` refuses to run unless both emulator addresses are on this machine and no `GOOGLE_APPLICATION_CREDENTIALS` is set, and it is skipped when no emulator is running, so CI and `npm test` are unaffected. No production code was changed to make this work; the test supplies an anonymous credential and a demo project id to `firebase_admin` itself.

## Run it

```bash
mkdir -p ~/emu && cd ~/emu && npm install firebase-tools@13     # once; keep it outside the repository
echo '{"emulators":{"auth":{"host":"127.0.0.1","port":9099},"firestore":{"host":"127.0.0.1","port":8080},"ui":{"enabled":false}}}' > firebase.json
./node_modules/.bin/firebase emulators:start --only auth,firestore --project demo-darknet-local
```

In a second terminal, from the repository (needs Java for the emulators and `pip install -r requirements-void-runner.txt` for the API):

```bash
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 python3 -m unittest tests.test_character_emulator -v
```

The first start downloads the two emulator programs from Google (about 100 MB).

## What the six tests prove (2026-11-05, all passing)

| Requirement | Result |
|---|---|
| One persistent character per registered account | The first create returns 201; any repeat, same or different model, returns 409. A second account is independent. **12 simultaneous creates for one account produce exactly one 201 and eleven 409**, and the stored character never changes afterwards. |
| Guests cannot claim registered identities | An anonymous (guest) Firebase account gets 403 on create; no token or a forged token gets 401. Naming another account's uid in the URL, a header or the body does not read, write or adopt that account's character (403/400, and the guest still has none). |
| Server-authorized, not bypassable from the browser | Wrong model for the gender, `admin` for a non-admin, extra fields (`uid`, `admin`, `createdAt`), wrong types, arrays, injection-style objects, path-style strings, empty and non-object bodies are all rejected with 400. PUT, PATCH and DELETE are 405. A **valid** campaign save that also carries a `character` field cannot create or change a character, and saving never removes one. |
| Only the authorized administrator selects Admin | `VOID_ADMIN_UIDS` is matched by account uid. A non-admin gets 400, a guest 403, an email-address entry in the list does not match, an empty list grants nobody; the admin gets 201 (male + `admin` only) and then the same single slot is full (409). |
| Persistence across logout and login | After a fresh sign-in (a new ID token) `GET /character` and `GET /account` return the identical character and a repeat create is still 409. A guest session in the same browser sees none. |

## Limits (what this does not prove)

- **The deployed Firestore security rules were not inspected.** The repository holds only deny-all merge fragments (`void-runner/firestore.rules`, `blackout-protocol/firestore.rules`, `docs/function/firestore.rules`, `docs/admin-stage3b1/firestore.rules`), no complete ruleset and no `firebase.json`; a broad allow elsewhere in the live rules could override them. Recorded as a pending administrator action (`FIREBASE_MULTIPLAYER_AUDIT.md`); this milestone does not depend on it.
- Emulator tokens are unsigned; the production signature check against Google's keys is the same library call but was not exercised.
- The in-browser account panel (`account.js`) was not driven against the emulator: that needs a Firebase web SDK pointed at the emulator and is part of the next milestone.
- No Stripe, no Render, no Neon.
