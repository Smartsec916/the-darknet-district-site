# Website sign-in, visitor identity and the owner's Iris controls

## One sign-in for the whole site

The homepage, Iris and every game already share one Firebase project (`the-darknet-district-71873`) through
`firebase-auth.js`. A browser keeps its Firebase session (IndexedDB) for the site's address, so signing in on
the homepage signs the visitor in on every page that loads that file, until they log out. No second project,
no second configuration, no accounts created or merged. The games' own account code, handle accounts and saves
are untouched.

The homepage header has a teal **LOG IN** button at the far right (`iris-account.js`): Google, or an emailed
sign-in link (the same two methods the games use). Signed in it shows the visitor's name with a menu:
link Iris history, forget what Iris remembers, copy account ID, log out, and, for the administrator only,
IRIS CONTROLS. Nothing about this appears in Iris's chat, and chatting never needs an account.

## How Iris decides who she is talking to (server-side)

| Who | How she is recognized | Memory kept under |
| --- | --- | --- |
| Anonymous visitor | a random id the browser makes once (`irisClientId`); not the IP, not fingerprinting | the id itself |
| Signed-in visitor | a Firebase sign-in token the server verifies on every message | `user:<account id>` |
| Owner (administrator, Owner mode) | the verified account is on `IRIS_ADMIN_UIDS` | `owner:<account id>` |
| Owner testing as Returning Visitor | same, mode chosen in the panel | `test-returning:<account id>:<n>` |
| Owner testing as New Visitor | same | nothing stored |

An anonymous history joins an account only when the visitor chooses **Link my Iris history** and confirms: the
memory is copied (the anonymous record stays), never automatically and never by IP.

## Administrator recognition

Server-side only. `server/firebaseAuth.ts` verifies the Firebase ID token the way the Admin SDK does (Google's
public keys, RS256, audience, issuer, expiry), with no secret needed. `IRIS_ADMIN_UIDS` is a list of exact
account ids; an email, a name, a claim in the token or anything the browser sends cannot grant it, and an
anonymous Firebase account never qualifies. Limitation: tokens last up to an hour and the server does not ask
Google about revocation, so a revoked account keeps working until its token expires; the id list is the control.
The conversation viewer (`/admin`, `IRIS_ADMIN_TOKEN`) is separate and unchanged.

## The three modes (`/iris-controls.html`, administrator only)

- **Owner**: the verified Admin character with the owner's own relationship and emotional memory (starts warm).
  Opening developer tools is treated as development: the page shows no warning and Iris does not turn hostile.
- **New Visitor**: a first-time stranger; nothing is remembered; ordinary developer-tools reaction.
- **Returning Visitor**: a separate persistent test visitor; reset any time.

Switching never merges or erases anything: each identity has its own key, and a running chat restarts clean when
the mode changes. The real administrator sign-in stays active behind the scenes; a simulated visitor has no
administrator rights.

## Developer tools

The site's detector (`devtoolsDetector.js`) is front-end only. It stays quiet for the verified owner in Owner mode.
Everyone else sees the same in-character reaction as before. On the server, the `[user triggered inspect]` chat
trigger no longer drops an ordinary visitor's trust to the floor and turns Iris cold: it makes her a little
guarded. Real security enforcement (rate limits, authentication, validation) does not depend on any of this.

## Settings

| Setting | Where | Value |
| --- | --- | --- |
| `IRIS_ADMIN_UIDS` | Render, Iris service | your Firebase account id; several separated by commas |
| `FIREBASE_PROJECT_ID` | Render, Iris service | optional; defaults to `the-darknet-district-71873` |

Firebase: the site's address (for example `thedarknetdistrict.com`) must be in Authentication → Settings →
Authorized domains for Google and email-link sign-in. The games already depend on this, so it is normally done.

## Database

Additive objects are created at start-up: tables `iris_relationships`, `iris_owner_state` and `iris_memory_links`, a nullable
column `chat_messages.memory_key`, and indexes. Nothing existing is changed or removed. Long-term conversation memory is
described in `IRIS-MEMORY.md`.
