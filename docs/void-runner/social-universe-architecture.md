# The Darknet District as a social universe: architecture and development plan

Status: PLAN ONLY, revision 2 (David's decisions of 2026-11-04 folded in). Nothing here is built. No merges, deploys, production changes, deletions or paid services.
This revises the earlier plan in place and carries over what is still useful from PR #186 (section 11.2).
Notation: **[confirmed]** is a decision David has made; **[recommended]** is my recommendation awaiting approval; **[open]** is unresolved. Prices and limits marked **[checked]** were looked up by web search on 2026-11-04 (links in the Sources section); **(verify)** means I could not confirm it from official pages (render.com and firebase.google.com cannot be fetched from the build session).

## 0. Decisions and open questions

### 0.1 Confirmed requirements (from David, 2026-11-04)
| # | Decision |
|---|---|
| D1 | Every player has a display handle. During onboarding they pick one or skip and automatically receive a unique `Guest####`. Handles can be changed later. The database identity is an immutable internal id, never the handle. A registered player may keep a `Guest####` handle indefinitely. Guest naming and anonymous authentication are separate concepts. |
| D2 | Development is local and no-cost first. No paid hosting is purchased, upgraded or activated. The single Node hub is the accepted direction, subject to verifying the existing services. The earlier $7 a month figure is **not** approved spending. |
| D3 | Automatic, account-bound saving is a priority. Every full 3D login starts in an available Sleeping Pod; the previous physical location is never restored. Mission progress, cargo, credits, inventory, ship ownership and upgrades, story decisions and reputation survive. The ship is at the District landing zone. No ship is duplicated, and a player who has not earned a ship stays shipless. Nothing is silently reset. |
| D4 | Persistent social features (global and location chat, direct messages, friends, VR sessions, presence, social records) need an authenticated identity. A local guest/testing mode is kept for single-player and demonstrations and is not a multiplayer account. A `Guest####` handle is enough to play; a custom handle is never required. |
| D5 | One authoritative active 3D session per account; a newer login may replace the older one with a clear notice. A mobile chat connection is a different kind of connection and never ends a desktop game. |
| D6 | Multiplayer is strictly social: no cooperative combat, shared space combat or shared mission progress. Shared VR companion state belongs to the session; individual relationship records stay separate. Existing scripted and recorded companion systems only; no paid AI without approval. |
| D7 | Safety from the beginning: block, report, rate limits, size validation, private-access protection, moderation and retention controls. Public chat is not activated until the safeguards are ready. |
| D8 | Build the pod allocator before the hallway geometry. The final hallway waits for David's revised floor plan. |
| D9 | Reuse existing character assets; no purchases. Blender is not available in the sandbox; the plan documents an asset pipeline instead. |
| D10 | PR #184 is not closed automatically; its useful fixes are retained or moved. PR #186 may be superseded once its useful content is preserved. Integration tests are not interfered with. |

### 0.2 Open decisions (need David)
1. **Age policy [open, blocks launch].** Is the game adults-only, open to minors, or split by feature? I do not assume either. It gates: public chat, direct messages between strangers, shared and private companion content, private VR sessions and friend requests. Section 9.4 lays out the options.
2. **Hosting for a public launch [open].** Local development needs nothing. A live hub needs an always-on host; section 4 compares the options and the verified costs. Nothing is chosen.
3. **Illegal cargo at the landing zone [open].** A player who logs out with illegal cargo wakes with it aboard at a pad that police patrols watch. Section 5.4 proposes no inspection at login arrival; confirm.
4. **Handle rename cooldown [open].** Section 3 proposes a free first rename away from a `Guest####` and 7 days between renames afterwards (the site's existing rule is 30 days).
5. **Chat and moderation staffing [open].** You are the only moderator today.
6. **Player-controlled privacy defaults [open].** Section 8.4.
7. **Revised floor plan [open, blocks only the final hallway].**

## 1. The short version

- **One new Node hub, built and tested locally first.** It runs rooms, presence, chat, direct messages, pods and shared VR state. Campaign progress stays in Firestore through the existing API. Social data uses a storage adapter: in-memory for tests, SQLite for local development, Neon Postgres for deployment.
- **Multiplayer is only the social places** (District interior, station interiors, VR rooms). Spaceflight, combat, missions and NPC encounters are never networked. Chat, direct messages and the Players Online directory stay live in single-player play.
- **Persistence comes first.** Cloud saves are manual today. "Wake in a pod with your progress and ship" needs automatic saves, a session lease (one active 3D session per account) and safe conflict handling.
- **Hosting:** the existing Flask API and the Iris service are not good homes for the hub. A free Render service is fine for short supervised tests but shares a 750-hour monthly allowance with every free service in the workspace, and connected players keep it awake, so it can exhaust that allowance and suspend the site's other free services. A public launch needs an always-on instance (Render Starter is about $7 per service per month, **[checked]**, workspace fees to confirm) or Cloudflare, and needs your approval. Section 4.
- **First two PRs:** (1) automatic account-bound saving with a session lease; (2) pod start and ship return, which replaces the location-resume logic in #187 and #188. Section 12.
- **Effort is a planning range, not a commitment** (section 12.4).

## 2. Assessment of the current game (verified in the repository)

| Area | State |
|---|---|
| Hosting | GitHub Pages (site); a Flask API on Render started with `gunicorn server:app` (plan not recorded in the repo); a separate Node Iris service on Render (its Blueprint says free plan, manual deploys); Neon Postgres (Iris only); Firebase Auth and Firestore. |
| Accounts | One Firebase project. Sign-in by handle (a Firebase anonymous account), email link or Google. Anonymous accounts can be upgraded by linking an email link or Google credential (`linkWithCredential`, `linkWithPopup` in `district-identity.js` and `iris-account.js`). Purchases already require a secured account. |
| Handles | One public handle per account in the Firestore registry `bp_handles/{lowercase handle}`, claimed in a transaction (`claim_public_handle`), 3 to 20 characters of letters, numbers and underscores, reserved and look-alike names refused. The profile key is `sha256(uid)`, already an immutable internal id. Changing a handle deletes the old reservation and enforces a 30-day cooldown. Firebase's display name is synced best-effort. |
| Campaign state | One object (about 1.6 KB new): credits, quest, `location`, `ownedShips`, `activeShip`, loadout, `universe`, `story`, `progression`, `warflying`, `relay`. Local slot `void-runner-campaign-v1`; cloud copy Firestore `vr_players/{sha256(uid)}` fields `save`, `revision`, `savedAt`, written only by `POST /api/void-runner/save` with a revision-checked transaction. **Cloud saving is manual** (account page). |
| Save funnel | `save()` in `game.js` is called from about 110 places and already skips the write when nothing changed. That is a ready-made "dirty" signal for automatic saving. |
| Restore | `Campaign.restore` already clears in-flight travel, the destination and any scene cursor, and moves the player to the last docked station. |
| Ships | Ownership is a list plus an active id; there is no ship object to duplicate. `grantShip` and `shipAccess` gate new players. Premium ships are verified from `vr_orders`. |
| Pods | 10 decorative capsule pods (2 stacked rows of 5) in the District's west room, plus one "rest in a pod and save" interaction. The website's Sleeping Pod page (dim lights, music player, smoke) is a separate page. |
| Environments | The street and the District interior are separate loaded environments joined by a vestibule (#185, #187). |
| VR | `VoidVR.register` experiences (forest, tropical, the companion bedroom, a hidden combat simulator). Companions run entirely in the browser: a pure "brain", scripted dialogue pools, recorded voices, random picks. No AI call. Their looks are modular mesh-part and texture variants kept per browser. |
| Characters | NPC bodies are baked GLBs (about 3 MB each) from a CC0 MakeHuman/MPFB pipeline (`tools/animation-pipeline`) with a shared 52-bone skeleton and clips. The player has no body in first person. |
| Realtime | None. |
| Mobile | The regular site works; there is no chat page. |

## 3. Identity: handles, `Guest####`, anonymous accounts [confirmed D1, D4]

### 3.1 Concepts kept separate
| Concept | Meaning | Where it lives |
|---|---|---|
| **Internal player id** | Immutable. `sha256(Firebase uid)` today, used as the database key everywhere (saves, friends, messages, reports). | Never shown. |
| **Authentication state** | Firebase anonymous, or secured by email link or Google. | Firebase Auth. |
| **Handle** | The unique display name. Can be changed. | `bp_handles` registry, mirrored by the hub. |
| **`Guest####`** | A handle pattern the server assigns when someone skips choosing. Belongs to the player for as long as they like, including after the account is secured. | A normal handle. |
| **Local guest mode** | No sign-in, no hub, local campaign only. | Browser storage only. |

### 3.2 Onboarding
1. Sign in (any method, including the existing one-tap anonymous account).
2. Choose a handle, **or** press Skip: the server assigns `Guest` plus four random digits and claims it atomically in the registry transaction (retry on collision up to 8 times; after about 60 percent of the four-digit space is used, issue five digits so uniqueness never degrades).
3. Customize the character (section 10), then wake in a pod.
- The pattern `Guest` followed by digits is reserved for server assignment: nobody can type it as a custom handle, so a custom name can never collide with or imitate an assigned one. Look-alike folding (already in the registry rules) covers `Guest 4827`, `gu3st4827` and similar.
- A custom handle is never required to play.

### 3.3 Renaming
- Available from the profile and the customization interface. The same transaction releases the old handle and claims the new one; the internal id and every record keyed by it are untouched, so progress, credits, inventory, ships, friendships and messages are unaffected.
- **Cooldown [recommended]:** the first rename away from a `Guest####` is free; after that, one rename every 7 days (the existing rule is 30 days; this is a parameter).
- **Impersonation guard [recommended]:** hold a released handle for 30 days so only its previous owner can reclaim it; otherwise someone could take a friend's old name.
- **Propagation:** the hub subscribes to a rename event (API to hub notification, or the hub re-reads on next heartbeat) and broadcasts `profile:renamed {playerId, handle}` to the directory, room members, VR sessions and open chats. Stored messages hold the sender's internal id and are rendered with the current handle; reports additionally keep the name as it was at the time.
- Validation: length, allowed characters, the existing reserved and fragment lists, impersonation folding, and a profanity check with the same folding.

### 3.4 Anonymous accounts, recovery and the safe upgrade path
- **What the existing system gives us:** upgrading an anonymous account by linking an email link or Google credential **keeps the same uid**, so the handle, cloud save, friends and messages all carry over. This is the safe upgrade path and it is already built.
- **What it does not give us:** an anonymous account lives in one browser's storage. Clearing storage, a new browser or a new device creates a different anonymous uid, and the old one cannot be recovered. I will not claim otherwise.
- **Recommended handling:**
  - Show "Account not secured" in the profile and a gentle prompt at moments of value (after the first mission reward, before closing the first session, before a purchase, which is already enforced).
  - A prominent "Secure with email or Google" button that links to the current account.
  - If linking fails because that email already belongs to another account (`credential-already-in-use`), **never merge automatically.** Offer to sign in to the existing account and leave the anonymous one untouched (not deleted) so nothing is lost. The player chooses which progress to continue.
  - Do not enable automatic deletion of unused anonymous accounts (an Identity Platform option, **(verify)**), because it would delete handles and saves.
- Local guest mode never touches any of this and cannot be upgraded; it is clearly labelled "Local, not saved to an account".

### 3.5 Local guest and testing mode [confirmed D4]
Entering without signing in starts a local campaign (browser storage only). The hub refuses unauthenticated connections. The District works in local mode as a solo space: no room join, no chat, no directory, and the pod rule uses pod 1 locally. For development and demonstrations the hub accepts a fixed test identity **only** when started with `HUB_ENV=development` and bound to loopback; with any other settings the override is refused and the hub fails closed. No privileged endpoint is reachable anonymously.

## 4. Hosting and costs: compare before spending [confirmed D2]

### 4.1 Rule: no paid service during development
Everything is built and tested locally. Deployment is a later, separate, approved step. The hub is written so the same code runs locally, on Render or on Cloudflare.

### 4.2 Local development (no cost)
- `hub/` runs with `node hub/server.js` on a loopback port. Rooms, pods, chat and VR state are pure modules, tested with fake sockets.
- **Storage adapter** with the same interface: `memory` (unit tests), `sqlite` (local persistence; Node 22 ships `node:sqlite`, so no dependency), `neon` (deployment). Migrations use portable SQL.
- **Authentication:** the Iris service already verifies Firebase ID tokens with Google's public keys, no secret, and has a documented override for tests (`IRIS_FIREBASE_JWKS_URL`). The hub reuses the pattern with a local key server that signs test tokens, accepted only in development.
- **Save API:** the Python API runs locally with the fake Firestore the existing tests already use (or the free Firebase emulator).
- The game is served by the existing local server; nothing is deployed and nothing publishes.

### 4.3 Hosting options compared
| Option | Persistent connections | Auth and rooms | Cost | Operational limits |
|---|---|---|---|---|
| **A. Existing Flask API service** | Poor. Started with gunicorn's default synchronous workers; sockets would need a different worker class or library and could destabilise accounts, saves and purchases. | Would need Firebase Admin tokens and room code inside the production API. | Plan unknown (not in the repo). | **Not recommended:** a hub bug could take down accounts and saves. |
| **B. Existing Iris service** | Fine technically (Node, `ws` present). | Reuses token verification. | Free plan per its Blueprint. | Iris is an OpenAI-credit service with its own concerns and the project keeps Iris separate from the game; a shared process couples their outages and deploys. **Not recommended.** |
| **C. New free Render service** | Works. **[checked]** A free service spins down after 15 minutes without inbound traffic, and WebSocket messages from existing connections now count as traffic, so connected players keep it awake. | Same code as A or B. | $0. | **[checked]** 750 free instance hours per workspace per month; once used up, **all** free web services in the workspace are suspended until next month. A hub with players connected overnight can use the whole allowance and suspend the site's other free services. Spin-up takes about a minute, the filesystem is ephemeral, and Render may restart free services at any time. **Use only for short, supervised tests, started and stopped by hand.** |
| **D. New always-on Render instance** | Reliable. | Same code. | **[checked, third-party summaries of Render's pricing page]** Starter is about $7 per month per service (512 MB, 0.5 CPU); some summaries mention separate workspace plan fees, so confirm the total on render.com/pricing before any approval. | Deploys and restarts still drop sockets; clients reconnect. **Not approved.** |
| **E. Cloudflare Workers with Durable Objects** | Good: one object per room holds the sockets, and idle objects hibernate. **[checked]** Durable Objects are on the Workers Free plan (SQLite-backed only, 1 GB per object, 5 GB total, daily limits reset at 00:00 UTC); idle hibernation-eligible objects are not billed for duration. | Token check must be reimplemented in Workers (public keys, straightforward). | Free plan exists. | A new vendor and account (needs approval even if free). The free plan has a daily request limit (100,000 requests a day for Workers **[checked]**); how WebSocket messages count toward it is **not verified**, so high-rate avatar movement may exceed the free quota while chat and presence would not. A second platform to maintain. |

### 4.4 Recommendation
1. **Now:** local development only (A to E are not needed yet).
2. **Early testing with real browsers and accounts:** a short-lived free Render service (option C) started by hand for a test session and stopped after, or stay local. Never leave connected clients on it, because it can use up the workspace's free hours.
3. **Public launch:** decide between D and E after a local prototype shows the real message volume. Either needs approval, and the code does not change between them.
4. Keep Firestore for saves and Neon for social data, with the limits below.

### 4.5 Data-store limits to design for
- **Firestore (Spark) [checked, third-party]:** 1 GiB, 50,000 reads and 20,000 writes per day; when a daily quota is exhausted the product stops responding until reset (not billed on Spark). **Autosave budget:** at most one cloud write per 3 minutes while dirty, plus key events spaced at least 20 seconds apart: a 3-hour session is at most about 60 writes, so about 100 players a day use roughly 6,000 writes (30 percent of the daily quota). Beyond roughly 150 players a day, raise the interval or move saves to Neon.
- **Neon free [checked, sources conflict]:** about 100 compute-hours and 0.5 GB per project, compute auto-suspends after 5 minutes. Persist only what must survive (direct messages, friends, blocks, reports, appearance, profile mirror), batch writes every 10 to 30 seconds, and keep global and location chat in memory, so the database can sleep between bursts.
- **Retention:** direct messages kept for a configurable period (suggest 90 days after both parties' last read), reports with 20 messages of context kept 30 days, deleted on account removal.

## 5. Persistence and the login lifecycle [confirmed D3, D5]

### 5.1 Automatic account-bound saving
- **Trigger:** the existing `save()` funnel marks the state dirty whenever the payload changed. A cloud sync runs (a) at most every 3 minutes while dirty, (b) immediately, spaced at least 20 seconds, on: docking, objective or mission completion, a purchase, exiting a pod, and leaving the game, and (c) on tab close via `sendBeacon`.
- **Local first:** every change still writes the local slot, so a network failure never loses progress.
- **Interrupted saves:** the client keeps `dirty` and the `baseRevision` it started from. A failed upload retries with backoff. The server only commits a save whose `baseRevision` equals the stored revision (the existing check) and whose session id matches the lease (5.3).
- **Which copy wins at login:** after claiming the session, if the local copy is dirty and its base revision equals the cloud revision, it is newer and is uploaded; if the cloud revision is higher (another device saved), the cloud wins and the local copy is kept as `void-runner-campaign-v1.conflict` for inspection, never deleted.
- **Server validation:** the existing structural validation (`clean_save`), a size cap, a minimum interval between saves, and ownership claims never accepted from the client (premium ships come from `vr_orders`). Credits and mission state remain client-simulated; that is acceptable while multiplayer is purely social and nothing is traded or ranked, and must be revisited before any shared economy.
- **Old saves:** retired as already decided (#188). Nothing in production is deleted without the exact records being listed and approved (`docs/void-runner/SAVE-RESET.md`).

### 5.2 Login lifecycle
1. Sign in. 2. Claim the session lease. 3. Load the cloud campaign (or start a new one). 4. If first time: handle (or `Guest####`), then customization. 5. **Wake in a pod** (server allocation once the hub exists; local pod 1 before that).
- The saved physical location is ignored. `location` is set to NeoChinatown (the District landing zone), travel and destination are cleared (the restore code already does this), and the **owned active ship is docked at the pad**: nothing is created or copied, because ownership is a list. A premium ship is re-verified against `vr_orders` first. A player with no ship gets none.
- The player walks out through the vestibule to the street and the pad: that is the single-player boundary.

### 5.3 One active 3D game session per account
- **Lease:** a field on the player's cloud record, `session = {id, device, startedAt, seenAt}`, replaced in one transaction by the newest login (`POST /api/void-runner/session`). Every cloud save carries the session id and is rejected (409 "session moved") if it no longer matches. With the hub running, it pushes a `replaced` event immediately; before then, the old session finds out on its next save or a 2 to 5 minute check.
- **Older session:** shows "Your game is now running on another device or tab", stops saving, releases its pod, and closes its avatar. It tries one final flush first; the server accepts a single final save from a just-superseded session if its base revision still equals the cloud revision, so the usual case loses nothing.
- **Bounded loss:** only changes since the last sync can be lost, which is at most minutes of transient state. Mission and objective progress syncs at once, so progress, cargo, credits and ownership are not what is at risk.
- **Companion connections:** a mobile chat connection has kind `companion`, holds no lease, no pod and no avatar, and never replaces a game session.
- **Tabs:** a second tab of the same browser is a new game session and replaces the first (a `BroadcastChannel` message makes this instant). A reconnect after a network blip presents the same session id and resumes; an expired or unknown session id is refused and the client signs in again.
- **No duplication:** the lease serialises saves, the hub allows one avatar and one pod reservation per player id (a replacing session inherits the reservation), and ships are a list in the campaign, so a swap cannot duplicate a ship or inventory.

### 5.4 Missions when the player wakes at the District
I reviewed the contract, delivery and mission code. Findings: **the campaign, mission-log, story, universe and progression rules contain no wall-clock deadline or timer** (the only `Date.now()` in the game's save path is the save timestamp), so nothing there expires while a player is offline (the relay and WarFlying modules keep their own counters, which I did not audit for offline behavior); and a test run confirmed that **all 23 contracts resolve a flight from the District pad and all 12 stations are routable from it**. Explicit handling instead of silent resets:

| Case | Rule |
|---|---|
| Cargo contract accepted, flight pending or under way | Contract, cargo and reward kept. The leg is recomputed from the pad (verified) and restarts. It does not fail. |
| Mid-flight state (warp, enemies, hull) | Discarded at login (already how restore works). The mission stays accepted; a notice says where the ship is. |
| Cargo already loaded (faction deliveries, supply, origin missions, Rook runs, sealed cargo) | Persisted in story flags and the cargo record; stays aboard; no need to return to the pickup. |
| Objectives tied to a place or person | Unchanged. Guidance recomputes the route from the pad ("travel back"). |
| Time-based expiry | None exist today. **Rule:** any future timed objective must be marked offline-safe or pause while the player is offline. |
| Scene in progress (`story.cursor`) | Restore drops the cursor today, which can lose a half-played scene. **Rule:** keep the scene's pending event so it replays at its trigger. Needs a test in PR 2. |
| Illegal cargo aboard at the pad | **[open]** Proposed: arrival at login is not a docking event, so no inspection; patrols act as normal afterwards. |
| Premium or granted ship | Re-verified, never duplicated. A shipless player stays shipless. |
| Rook owes payment, Admin store state, faction states | Persisted flags; unaffected by location. |
PR 2 includes a test that enumerates every contract, delivery and mission state, moves the player to the pad, and asserts a resolvable route or an explicit travel instruction.

## 6. Rooms, channels, presence (hub design) [confirmed D6]

(Unchanged in substance from revision 1; summarized.)
- `Room { id, kind, capacity, members, state }`: `district#n`, `station:<id>`, `vr:<sessionId>`, plus the implicit lobby holding every connection. A client joins a room when a listed social environment finishes loading and leaves when it is released. One process, many rooms; a full district opens `district#2`.
- **Channels:** Global (everyone connected, including mobile, flight and pods); Location (current room, **not delivered to a player inside a pod**); VR session (that session only); Direct (two accounts, stored, offline delivery).
- **Presence:** coarse labels only (*The Darknet District, NeoChinatown, Meridian Station, In Space, Exploring <system>, VR Lounge, Private VR Session, Mobile*), 30-second heartbeat, removed after 90 seconds unseen. Never exact positions.
- **Connection kinds:** `game` (holds the session lease, may hold a pod and avatar) and `companion` (chat only). The hub's message whitelist per kind enforces that a companion connection can never move, interact or hold a pod.

## 7. Sleeping Pods and the hallway [confirmed D8]

**Allocator first, geometry later.**
- Server-authoritative in memory in each `district` instance; the single-threaded event loop makes reservation atomic. Login: take the first free pod, mark it occupied for the session, spawn the avatar inside. Stay until **Exit Pod**. Exit: release the reservation, place the player at a free hallway slot (no avatar within about a metre).
- Disconnect in a pod: reservation moves to `grace` for `POD_GRACE_MS` (default 90 s, configurable); reconnecting with the same session restores the pod; a replacing session inherits it; stale grace entries are released by a timer. A hub restart loses reservations and everyone is reassigned (acceptable at this scale).
- **Isolation:** the client's pod mixer silences the hallway and plays pod ambience plus the player's music; the server withholds Location chat from players in pods while Global chat and direct messages still arrive. The existing website pod controls (dim lights, music player) are the model for the in-pod interface.
- **Expansion:** modular hallway sections (default 6 pods per wall, 12 per section) behind one door each, one continuous corridor, reusing one capsule builder (the 10 existing capsules are the starting point). The server owns `activeSections`; when free pods fall below a buffer (default max of 3 or 20 percent) it opens the next section and tells clients to load it. A section closes only when every pod in it is free, no avatar is inside it, and it has been empty for a delay; the first section never closes. Beyond a configured limit a second district instance opens.
- **Independent of the floor plan:** the allocator, its rules and tests, and a temporary self-contained section prototype. **Waits for the floor plan:** the final hallway position and geometry.

## 8. Safety, moderation and privacy [confirmed D7]

### 8.1 Baseline that must exist before any public chat
Server-enforced, never trusted to the client:
- Per-account rate limits (suggest 1 message per 1.2 s, burst 4, 20 a minute), per-IP connection limits, size validation (240 characters for chat, tighter for invitations), control and bidirectional-override characters stripped, duplicate and flood suppression, plain text only, no links at launch, no images, no voice.
- **Block:** blocks apply to direct messages, friend requests, **invitations** and VR joins, checked on the server so there is no workaround through another channel.
- **Report:** every message and every player; stored with 20 messages of context and the name at the time; admin view restricted to an admin id list.
- **Escalation:** automatic mute (1 minute, then 10, then 1 hour), disconnect, admin mute and ban, slow mode, and an instant kill switch for each public channel.
- **Retention controls:** configurable retention and deletion jobs; privacy text.
- **Gate:** public channels stay behind a flag (`CHAT_PUBLIC_ENABLED`, default off) until this list passes tests and David approves. Development chat runs on localhost only.

### 8.2 Membership and privacy per channel
Global, location, VR session and direct messages each check their own membership on every send and every delivery. Private VR sessions are never listed anywhere, and a session id alone grants nothing: joining needs a server-checked invitation or friend authorization. A direct message is stored against the two internal player ids; only those two accounts (and an admin handling a report) can read it, and a blocked sender's message is never delivered or stored for the recipient.

### 8.3 Directory
General location only. A private VR session appears only as *Private VR Session*, with no id, activity, participants or content.

### 8.4 Player-controlled visibility [recommended]
Settings, per player: **status** (everyone, friends only, appear offline), **show general location** (on or off, off shows only "Online"), **who can send direct messages** (everyone, friends only, no one), **friend requests** (everyone, no one), **who can invite me** (friends only by default), **mature content** (off by default; exists only if the age policy allows it). Defaults depend on the age policy (9.4): with minors possible, direct messages default to friends only. New accounts have a stricter tier for their first day.

## 9. Shared VR and companions [confirmed D6]

### 9.1 Sessions
Registered on the hub: id, type, visibility, capacity, members, creator, state. Public sessions appear in the terminal's browser with type and count. Private sessions are hidden and admit only server-validated invitees. A session continues while anyone remains; the creator leaving closes nothing; it closes after its last member leaves plus a short grace. VR sessions never touch anyone's mission state. Existing VR combat stays single-player.

### 9.2 Shared companion state
The companions' decision logic is already a pure module that runs in Node. The hub runs it headless per session: activity, goal position, current line and options, recent shared context, participants. Clients render the snapshots, play the recorded voice for the line the server chose, and send intents (greet, choose an option). Intents are queued and applied in order, so simultaneous clicks cannot diverge; a late joiner receives a full snapshot first; the companion addresses the party when more than one player is present. **No AI call is involved**, so there is no token cost, and I will not add one without approval. Refactor needed: extract a pure `companion-session` module from the browser code that currently mixes brain and bone work.

### 9.3 Personal records stay personal
I found no persistent per-player companion relationship in the VR code (only per-session memory and per-browser look choices); I did not audit every story system. If one is added later it is keyed by internal player id and written only by that player's own private interactions, never by a shared session, and never displayed to other players.

### 9.4 Content, consent and the age policy [open, launch-blocking]
The bedroom companions have romantic and intimate options. I am not assuming the game is adults-only or open to minors; that decision is yours. Until it is made, the following stay **disabled for any shared or private multiplayer session**, and the plan only prepares the classification:

| Interaction (from the companion dialogue sets) | Proposed class |
|---|---|
| greet, chat, compliment, sit, dance, relax, bye, approach, window | Shared-safe |
| flirt, hands, kiss, recline, slow dance, similar | Private only, and only if the age policy allows |

Options for the age policy, each with consequences: (A) adults-only, which needs a verification approach and makes intimate content possible in invitation-only sessions with mutual opt-in; (B) all ages, with intimate options removed from multiplayer entirely (they can remain in the single-player bedroom); (C) mixed, with age-gated features. Whatever is chosen: intimate content needs explicit mutual consent in private sessions, is never visible to other players or the directory, and relationship history is never exposed. Direct messages with strangers, friend requests, private sessions and public chat also depend on this decision.

## 10. Characters and the asset pipeline [confirmed D9]

- **Data:** appearance is a small JSON of catalog ids (body, preset, face preset, hair style and colour, skin tone, outfit), account data separate from the campaign, validated server-side against the catalog. Preview is local; **Confirm** saves once and broadcasts the final appearance to the room; a body change needs no re-login. Clients cache parts in the service-worker asset cache.
- **Runtime:** the same part-toggle and texture-swap approach as the companion looks (`wears`/`parts`), generalized; hair and skin colours as material parameters; two base bodies plus variants within a budget of about 8 MB for the first download.
- **Pipeline for later:** (1) the existing `tools/animation-pipeline/build_mpfb_character.py` and character specs produce GLBs with the shared 52-bone skeleton from CC0 MakeHuman/MPFB assets; (2) a new `player-catalog.json` lists bodies, hairstyles, colours, skin tones and outfits with their part and texture names; (3) a validator script checks any new GLB (skeleton names, triangle and texture budgets, part naming, licence entry) and runs in the tests; (4) every imported asset needs an entry in `docs/VOID_RUNNER_ASSET_LICENSES.md` first. No assets or services are purchased.
- **Blender-free work I can do now:** the catalog schema and validator, the appearance model and validation, the customization scene and rotating preview using existing models as stand-in bodies (the NPC and companion GLBs), and the synchronization protocol. **Needs Blender elsewhere:** producing the real male and female bodies, hairstyles and outfits.
- **Constraints:** the licensed companion model (`vr-companion-fc1`) must not be offered to players. The crowd README notes the motion clips' redistribution terms should be confirmed before a public release.

## 11. Existing PRs and integration

### 11.1 What #187 and #188 must change [confirmed D3]
The new rule replaces "resume where you were". Exactly:
- `district-area.js`: `areaOf`, `keyFor` and `resume` read `story.flags.area`, and `resume` places a saved-inside player in the hall. Session start must instead assign a pod. `area` becomes session-only runtime state, not a saved flag. `enterTrigger`, `exitTrigger`, `exitSpawn`, the entry points and the vestibule geometry stay.
- `district-transition.js` (line 25): stops writing and deleting `f.area` and stops calling `save()` for location; keeps setting `districtDoor` and `districtBadge` (progression, not location).
- `world-integration.js`: `dock()` stops passing `resume(...)`; `districtStart()`'s interior guard goes.
- Saves: stop persisting `area`; the cloud validator test `test_district_area_flag_survives_cloud_validation` is replaced (an old `area` value in a save is simply ignored).
- Tests to change: the saved-location tests in `district-transition.test.cjs`, step 5 ("resumed inside/outside") of `district-transition-browser.cjs`, and the Python test above; the docs (`environment-separation.md` Saves bullet).
- **Unchanged:** the area builds (#185), the transition and its overlay, the checkpoint and airlock sequences, the epoch retirement of old saves (#188), `SAVE-RESET.md` and the reset tool.

### 11.2 #186 content carried over
Superseded by this document, with these items preserved from it: capability-based mobile detection with an override (the ROG Ally and laptops never see the notice); the draft ENTER notice wording; the connection-kind model (chat versus world); the moderation numbers (rate limits, connection caps, escalation, report context, retention); the per-channel membership rules; the delivery ordering rationale; the load table method; the decision list. **Recommendation:** close #186 after this plan is approved; not closed now.

### 11.3 #184: what to keep
Inspected the diff (12 files). Contents and verdicts:
| Part of #184 | Verdict |
|---|---|
| Share-link guest policy (`share-registry` `applyPolicy`, `access`, guest-mode hook, share-link tests and browser test) | Obsolete: share links are retired (#189). Drop. |
| Invisible pad collision box (`shipHull`, loader opens it with no ship) | Already extracted to **#190**. |
| Boarding prompt hidden when `shipAccess` is `none`, added to the board interactions in `exploration-data.js` (3 hangars), `planets.js`, `station-layouts.js`, `meridian-interior.js` | **Keep, small.** Defensive hardening: a shipless state should never see a "BOARD YOUR SHIP" prompt. It becomes relevant again with social station interiors. Move into PR 2 (ship-return rules) or a tiny standalone PR; the four edits are one line each. |
| Reworded `station-arrival` description | Obsolete with the share links. |
Recommendation: after the prompt gating is ported, #184 can be closed (with your approval). Nothing valuable is lost.

### 11.4 Other branches
#185, #187 (transition), #188 (epoch retirement, minus the resume parts above), #189, #190, #178, #179 (ship lock), #181, #182: no conflict beyond 11.1. The integration branch continues unaffected; this plan changes no code.

## 12. Implementation order and pull requests [confirmed priority list, adjusted where dependencies require]

### 12.1 Order
1. Automatic, account-bound saving and the session lease.
2. Pod start and ship return, replacing the location-resume logic.
3. Hub skeleton, authentication and room membership. *(A small `Guest####` and rename PR comes just before or beside it, because the hub needs identities.)*
4. Global chat and direct messages with the lightweight mobile page. **Adjustment:** block, report, rate limits, size validation and retention controls are part of this step, not step 6, because public chat cannot go live without them (D7). Step 6 expands them.
5. Presence, the Players Online directory and general-location reporting.
6. Friends, social invitations and the fuller moderation tools.
7. Shared avatars and basic customization (needs art for the final models).
8. Public and private VR sessions.
9. Shared companion state (after the age-policy decision).
10. Additional station interiors.
11. Modular hallway expansion and optimization (after the floor plan).

### 12.2 Pull requests and dependencies
| # | PR | Depends on | Notes |
|---|---|---|---|
| 1 | Automatic cloud saves and the session lease | #190 | Python API changes plus client sync; local fake DB tests. |
| 2 | Pod start, Exit Pod, ship at the landing zone, no restored location; port the boarding-prompt gating from #184 | 1 | Replaces #187/#188 resume code (11.1). |
| 3 | `Guest####` assignment, rename API and propagation event | none | Python identity API; independent. |
| 4 | Hub skeleton: auth, sessions, kinds, presence, rooms, protocol, storage adapters | none | Runs locally; no deployment. |
| 5 | Chat (global, location, direct) with baseline safety; Neon schema (additive) | 3, 4 | Public channels stay off by flag. |
| 6 | Mobile chat page and the ENTER notice | 5 | No game scripts loaded. |
| 7 | Presence, directory, general location reporting | 4 | |
| 8 | Friends, invitations, expanded moderation, privacy settings | 5, 7 | |
| 9 | Appearance model, catalog, validator (no art) | none | Can start any time. |
| 10 | Customization scene and rotating preview (stand-in bodies) | 9 | |
| 11 | District room client: avatars, pose sync, interpolation | 4, 10 | |
| 12 | Pod allocator on the hub, pod audio isolation | 4, 11, 2 | Allocator and tests can start earlier. |
| 13 | VR session registry and terminal browser | 4, 11 | |
| 14 | Companion session extraction and shared companion | 13, age policy | |
| 15 | Station room (Meridian) | 11 | |
| 16 | Pod hallway module and expansion | 12, floor plan | |
| 17 | Load test, reconnect and deploy drills, runbooks | 4 and later | |

### 12.3 The first two PRs
**PR 1: Automatic account-bound saving and the session lease.** The foundation everything else assumes, with no hub and no 3D changes. Adds: dirty tracking on the existing `save()` funnel; a cloud sync with the revision check, backoff and `sendBeacon`; the `session` lease and `POST /session` claim; save rejection on a mismatched session id; the "session moved" notice and `BroadcastChannel` for tabs; the local-versus-cloud rule at login and the `.conflict` backup; tests for interrupted saves, two simultaneous logins, a stale tab and quota-safe write spacing. It changes only save behavior and is fully testable with the existing fake database.
**PR 2: Pod start and ship return.** Changes the single-player lifecycle on top of PR 1: session start places the player in a pod (the existing room and its 10 capsules, local allocation), Exit Pod, the owned ship docked at the pad with the no-duplication and no-free-ship tests, the cleared in-flight state, the scene-cursor fix, the mission-case tests from 5.4, and the removal of `area` persistence and resume (11.1), with the #184 boarding-prompt gating ported. It makes the new lifecycle real before any networking exists.

### 12.4 Effort
The earlier 65-working-day figure is a planning range, not a commitment. Reuse found since then lowers some items (the `save()` funnel, the token-verification pattern, the pure companion brain, the existing handle transaction) and adds others (the session lease, the storage adapters, the mission-case tests). **Revised planning range: about 50 to 85 working days for PRs 1 to 17**, with PRs 1 to 8 (a safe, saving, chatting community on desktop and phone) at roughly 28 to 40. I will re-baseline after PRs 1 to 3.

## 13. Cost and risk assessment

### 13.1 Costs
| Item | Development | Public launch |
|---|---|---|
| Hub hosting | $0 (local) | Free Render is unsuitable for an always-connected hub; always-on is about $7 per service per month **[checked, confirm workspace fees]**, or Cloudflare (free tier, new vendor, message-quota unknown). **Not approved.** |
| Neon | $0 | Free tier (about 100 compute-hours, 0.5 GB **[checked, sources conflict]**); stay inside it by persisting only direct messages, friends, blocks, reports and profiles, with batched writes. |
| Firebase Auth and Firestore | $0 | Spark quotas **[checked, third-party]**; autosave spacing keeps about 100 players a day near 30 percent of the write quota. |
| AI usage | $0 | None in this plan. |
| Art | Time | Needs someone with Blender. |
Most likely recurring cost at launch: **$0 to about $7 a month**, depending on your approval of an always-on host.

### 13.2 Risks
- **Free-tier exhaustion can take down the main site (Render):** a hub left running on the same free workspace can use the 750 shared hours and suspend the site's free services. Mitigation: never leave a free hub running; separate always-on service before launch.
- **Firestore quota exhaustion** stops saves for the day (not billed): spaced autosaves, a quota alarm, and a plan to move saves to Neon if daily players grow.
- **Autosave overwrite or loss:** revisions, the lease, local-first writes, the `.conflict` backup, and no destructive migration.
- **Age policy and content** are launch blockers (9.4).
- **Public chat abuse:** the section 8 baseline and the off-by-default flag.
- **Neon compute hours** if the hub keeps the database awake: batching and memory-only global chat.
- **Art and licensing:** no Blender here; licensed companion model off limits; clip redistribution to confirm.
- **Hub restarts drop sockets:** reconnect and snapshot design, pod grace, and deploy drills in PR 17.
- **Existing data:** nothing in production is touched; old-save cleanup stays an approved, listed, reversible step.

## 14. Needed from you before building
1. **The age policy** (section 9.4), because it blocks launch of chat, messaging, private sessions and companion content.
2. Approval to start PRs 1 and 2, and confirmation of the illegal-cargo rule (5.4).
3. Rename cooldown preference (3.3).
4. Whether to port the boarding-prompt gating from #184 into PR 2 (recommended).
5. Your floor plan when ready, for the final hallway only.
Everything else follows from the confirmed decisions in 0.1.

## Sources
- Render, free services: [Deploy for Free](https://render.com/docs/free) and the changelog [free web services now remain active while receiving WebSocket messages](https://render-www.onrender.com/changelog/free-web-services-now-remain-active-while-receiving-websocket-messages).
- Render pricing: [render.com/pricing](https://render.com/pricing) and third-party summaries ([Render pricing in 2026](https://deploycloud-shopify.devcloudsoftware.com/blog/render-pricing), [livemy.app](https://livemy.app/blog/render-pricing)).
- Cloudflare Durable Objects: [limits](https://developers.cloudflare.com/durable-objects/platform/limits), [pricing](https://developers.cloudflare.com/durable-objects/platform/pricing), [free tier changelog, 2025-04-07](https://developers.cloudflare.com/changelog/post/2025-04-07-durable-objects-free-tier/).
- Neon: [pricing](https://neon.com/pricing) (free-plan figures conflict between Neon's own pages; confirm live).
- Firebase Spark quotas (third-party): [Firebase pricing guide](https://supertokens.com/blog/firebase-pricing), [Spark vs Blaze](https://dev.to/androve2k/spark-vs-blaze-the-firebase-pricing-guide-i-wish-id-read-sooner-onb); official page: [Firebase pricing plans](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans).
