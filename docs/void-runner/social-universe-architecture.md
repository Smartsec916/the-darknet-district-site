# The Darknet District as a social universe: architecture and development plan

Status: PLAN ONLY (David, 2026-11-04). Nothing here is built. No merges, deploys, production changes or paid services.
Supersedes the architecture parts of `multiplayer-and-mobile-chat-plan.md` (PR #186), which this builds on; the chat design, moderation rules and hosting comparison there still apply.
Free-tier and price figures marked **(verify)** could not be checked from the build session (render.com and firebase.google.com are not reachable from it).

## 0. The short version

- **One new service, one existing data store per job.** A single small realtime hub (Node, WebSockets) runs rooms, presence, chat, pods and shared VR state. Campaign progress stays where it already is (Firestore, through the existing API). Social data (appearance, friends, messages) goes in Neon Postgres, which the Iris service already uses.
- **Multiplayer is only the social places.** The District interior, station interiors and VR rooms are rooms. Spaceflight, combat, missions and NPC encounters stay single-player and are never networked. Chat and the Players Online directory stay live while a player is flying.
- **The biggest hidden piece is persistence, not networking.** Today a campaign is saved locally and copied to the cloud by hand. "Wake up in a pod with your progress and ship" needs automatic, account-bound cloud saves with one active session per account. That has to come first.
- **Two things cannot be built from this sandbox:** new character art (no Blender here) and any live service (no deployment). The plan separates them so code can proceed.
- **First to build:** the single-player lifecycle foundation (pod start, automatic saves, ship at the landing pad) in parallel with the hub skeleton. Both are small, testable offline, and independent of your revised floor plan.
- **Recurring cost:** about $0 to start. The realistic floor for a hub that stays up is about **$7 a month** (an always-on Render instance **(verify)**), which needs your approval. Section 8.
- **Questions that need your answer before building:** 8 (section 12).

## 1. Assessment of the current game

**What exists, verified in the repository and the open PRs**

| Area | State |
|---|---|
| Hosting | Static site on GitHub Pages; Python Flask API on Render (gunicorn, plan not recorded in the repo); a separate Node service for Iris on Render (Blueprint says free plan, manual deploys); Neon Postgres (Iris only); Firebase Auth and Firestore. |
| Accounts | One Firebase project. Sign-in by handle (anonymous account), email link or Google. One public handle per account, shared by the site and every game (`identity_api.py`, Firestore `bp_handles`). Handles never show real names. Reserved and look-alike names are refused. |
| Campaign state | One object (about 1.6 KB new, growing): credits, `quest`, `location`, `ownedShips`, `activeShip`, `loadout`, `universe` (visited places, tracked missions), `story` (flags, relationships), `progression` (checkpoint, reputation, cargo), `warflying`, `relay`. Local slot `void-runner-campaign-v1`; cloud copy is Firestore `vr_players/{sha256(uid)}` fields `save`, `revision`, `savedAt`. **Cloud saving is manual** (account page buttons). Purchases are separate (`vr_orders`). |
| Ships | Ownership is a list plus an active id, not objects: there is no ship instance to duplicate. A ship is "wherever the player docks". `grantShip` and `shipAccess` already gate new players. |
| Pods | The District has 10 decorative capsule pods (2 stacked rows of 5) in the west room (`neochinatown.js`), and one "rest in a pod" interaction that saves. The website's Sleeping Pod page (`sleeping_pod.html`) is a separate page (dim lights, music player, smoke effect). |
| Environments | The street (NeoChinatown) and the District interior are separate loaded environments joined by a vestibule (PRs #185, #187). |
| VR | Experiences register with `VoidVR.register` (forest, tropical, "Play in a Bedroom" with companions, a hidden combat simulator). Companions run entirely in the browser: a "brain" for initiative, scripted dialogue pools with pre-recorded voices, random choices. **No AI or token cost.** Their looks are modular (outfit, hair, glasses, make-up as mesh toggles and texture swaps, kept per browser). |
| Characters | NPCs are baked GLBs (about 3 MB each) from a CC0 MakeHuman/MPFB pipeline (`tools/animation-pipeline`) with a shared 52-bone skeleton and clip set (idle, walk, sit, talk, dance...). The player has no body in first person. |
| NPCs | Client-side, per environment. Admin, Iris, the bartender and others speak personally to whoever talks to them. |
| Realtime | **None.** The game only makes request-style API calls. |
| Mobile | Regular site works; the game page is desktop-first with touch controls. No chat page exists. |

**Not assumed:** there is no multiplayer, chat, friends, directory, avatar customization or server-side pod logic today.

## 2. Existing systems that can be reused

- Firebase accounts and the public handle (identity for every connection, display names, reserved-name protection).
- The Node Iris service's pattern: Firebase token verification with Google's public keys and no secret (`firebaseAuth.ts`), `express-rate-limit`, additive Neon migrations (`migrate.ts`), the admin viewer pattern, and the `ws` package.
- Neon Postgres (free tier) for relational social data.
- Firestore `vr_players` and its revision-checked transaction for campaign saves.
- The campaign, ship (`grantShip`, `shipAccess`) and mission systems untouched.
- The area/transition work: the District interior is already its own loadable environment, which is exactly the room boundary.
- The 10 existing pod capsules (as a reusable builder), the vestibule, `district-area.js`.
- The CC0 character pipeline, the crowd clip set and skeleton, the companion look system (mesh-part and texture variants) as the model for player appearance.
- The VR registry and the companions' pure "brain" and pre-recorded voice lines (shared companions at no AI cost).
- The website pod page's controls (dim lights, music) as the model for the in-pod interface.
- The planned moderation and rate-limit rules in PR #186's plan.

## 3. What must be created or changed

**New**
- `hub/` service: sessions, presence, rooms, chat channels, direct messages, friends and invitations, pod allocator, VR session registry, companion session.
- Neon tables (additive): `players`, `friends`, `blocks`, `dm_messages`, `reports`, `mutes`, `invites`.
- Automatic cloud saving and a single-active-session rule.
- Session-start flow: login, handle, customization, pod.
- Character appearance model, catalog, validation and the customization scene.
- Remote-player avatars (third-person bodies, interpolation, animation).
- Pod hallway module and expansion.
- Mobile chat page and the ENTER notice.
- Shared companion session (server-run brain), VR session browser.
- Station rooms (Meridian first).

**Changed**
- `district-area.js` and the transition: no more "resume inside"; session start is always a pod.
- Cloud save API: automatic saves, session ownership, conflict handling.
- `crowd.js` / renderer: a player-avatar path alongside NPC crowd.
- VR terminal UI: session browser.
- Pod interaction: from "rest and save" to the pod interface (exit, dim, music, chat).
- Companion code: split the pure brain and conversation state from the 3D rendering.

## 4. Conflicts with the unmerged PRs

| PR | Effect |
|---|---|
| #186 (multiplayer/mobile-chat plan) | Superseded in architecture by this document; its chat, moderation and hosting sections stay valid. Recommend closing it once this plan is approved. |
| #187 and #188 (transition, retire old saves) | **Partial conflict by design.** They persist `story.flags.area` and resume a player inside the District. New rule: never restore location; always start in a pod. That code and its tests (`resumed inside`) must change, and `area` should stop being saved. The transition itself, the area builds and the epoch retirement stay. |
| #185, #187 (area builds, transition) | Foundation. Room join and leave hooks attach where an environment finishes loading and where it is released. |
| #189 (share links removed) | Aligned: no guest sessions, so every connection is a real account. |
| #190, #178, #179 (ship hull, hidden Kestrel, ship lock) | Aligned: new players own nothing; a granted ship returns to the pad. |
| #181, #182 | No conflict. |
| #184 | Obsolete (share links retired); close rather than merge. |
| Integration branch | Fine. The social work stacks on #190. |

## 5. Proposed architecture

### 5.1 Services and data
```
Browser (desktop game, Babylon)  --WebSocket-->  hub (Node, one process at first)  --SQL-->  Neon (social data)
Browser (mobile chat page)       --WebSocket-->     |  rooms, presence, chat, pods, VR sessions
                                                    +-- verifies Firebase ID token itself (public keys, no secret)
Browser --HTTPS--> Python API --> Firestore  (campaign saves, purchases, handles: unchanged, plus automatic saves)
```
- The hub never renders anything, never stores campaign progress, and never calls an AI service.
- Account identity is the Firebase UID; the hub stores a hash. The public handle is read once per connection from the existing identity API and cached.
- **Why Node, not the Flask API:** the documented start command for the Flask service (`gunicorn server:app`) uses gunicorn's default synchronous workers, which are not made to hold many idle sockets; a Node service holds them cheaply and the login check is already written for it. (I could not see the service's actual Render plan or settings.)

### 5.2 Rooms
One concept covers everything: `Room { id, kind, capacity, members, state }`.

| Room | Examples | Members | State |
|---|---|---|---|
| `district` (instance `district#1`, `#2`...) | The District interior | Players physically inside | Positions, appearance, pods, hallway sections |
| `station:<id>` | Meridian, later others | Players inside that station interior | Positions, appearance |
| `vr:<sessionId>` | A Companion Lounge, a dance session | Session participants | Session membership, shared companion state |
| `lobby` (implicit) | Everyone connected | All connections, including mobile and spaceflight | Presence only |

- A client joins a room when its game environment finishes loading (and the environment is on a short list of social places in a data file), and leaves when it is released. Leaving returns the client to the lobby only.
- Rooms are objects in one process. No separate server per room. A room instance caps at about 40 players; a full `district#1` opens `district#2` (its own pods and hallway), which keeps the plan honest about scaling without building it yet.

### 5.3 Channels (who receives what)
| Channel | Members | Notes |
|---|---|---|
| Global | Every connection (desktop, mobile, in flight, in a pod, in VR) | |
| Location | Members of the player's current room, **except players inside a pod** | Updates as rooms change |
| VR session | That session only | Private sessions never appear anywhere else |
| Direct | Two accounts | Stored; delivered live if online, otherwise on next login; respects blocks |

### 5.4 Presence
`lobby` keeps `uid -> {name, device, general location, since}`. Locations are coarse labels sent by the game when they change: *The Darknet District*, *NeoChinatown*, *Meridian Station*, *In Space*, *Exploring <system>*, *VR Lounge*, *Private VR Session*, *Mobile*. No exact positions. Heartbeat every 30 seconds; a record unseen for 90 seconds is removed. A private VR session shows only as *Private VR Session*, with no id, activity or participants.

### 5.5 Pods
Server-authoritative inside a `district` instance, in memory, in the single-threaded event loop, so reservation is atomic without database locks.
- Login: pick the first free pod, mark it `occupied` for that session, send the assignment, spawn the avatar inside it. The pod stays occupied until **Exit Pod**.
- Exit Pod: release the reservation and place the player at a free hallway slot outside (a slot is free if no avatar is within about a metre).
- Disconnect while in a pod: keep the reservation in `grace` for `POD_GRACE_MS` (default 90 s, configurable). Reconnect in time restores the same pod; a stale second session for the same account is closed ("replaced") and takes over the reservation. After the grace period the pod is released.
- One session per account at a time; a new login elsewhere replaces the old one.
- Hub restart loses reservations (everyone reconnects and is reassigned). That is acceptable at this scale and noted as a limit.
- Pod audio isolation is client-side (the pod mixer mutes hallway sound and plays pod ambience and the player's music), and the server enforces the social half: location chat is not delivered to a player inside a pod, while global chat and direct messages still are.

### 5.6 Hallway expansion
- The hallway is modular: a section holds N pods per wall (default 6 per wall, 12 per section) and reuses the same capsule builder. Sections connect end to end behind one door each, so it is one continuous corridor.
- The server owns `activeSections`. When free pods fall below a buffer (default max of 3 or 20 percent), it activates the next section and tells clients to load and open it. A section may close only when every pod in it is free, no avatar is inside its bounds, and it has been empty for a delay. The first section never closes.
- Clients load a section's geometry on `section:open` and release it on `section:close`; closed sections cost nothing to render.
- After a configured maximum number of sections (default 8, so 96 pods) the district opens a second instance instead.
- **Dependency:** where the hallway sits depends on your revised floor plan. Until it arrives, build it as a self-contained module that can be positioned anywhere, plus the allocator, which does not depend on geometry at all.

### 5.7 Avatars and appearance
- Appearance is a small JSON of catalog ids: body (male or female base), preset, face preset, hair style and colour, skin tone, outfit (about 150 to 300 bytes). It is **account data, separate from the campaign**, so a campaign reset never touches it and customization can never change progress.
- The hub validates every id against the catalog; the client cannot invent parts.
- Customization preview is entirely local. **Confirm** sends one `appearance:set`; the hub stores it and broadcasts the final appearance to the room. Changing models later needs no re-login.
- Clients cache body and part files in the service-worker asset cache (about 6 to 10 MB for two bodies and a starter wardrobe, once).
- Remote players use the same skeleton and clips as the crowd (idle, walk, sit, a few emotes). Positions come at 8 to 10 Hz, quantized, and are interpolated; only players in the same room are sent. Far players can drop to 2 to 4 Hz.
- **Art constraint:** new bodies and clothing must be built with the CC0 MakeHuman/MPFB pipeline, which needs Blender. Blender is not installed in the build sandbox, so someone with Blender (you, or a machine we set up) has to run the existing scripts. The licensed companion model (`vr-companion-fc1`) must not be offered to players. The crowd README also notes the motion clips' redistribution terms should be confirmed before public release.

### 5.8 Persistence and the login lifecycle
- **Automatic cloud saves:** save on meaningful events (docking, mission step, purchase, pod exit, logout), at most every few minutes, plus on tab close (`sendBeacon`). Each save carries the revision; a stale tab gets a conflict and reloads the account's save. One active session per account makes conflicts rare.
- **Login:** account, handle, appearance (first time), then the campaign loads from the cloud and the session starts in a pod. The saved physical location is ignored: `location` is set to NeoChinatown (the landing zone), travel and in-flight state are cleared, and the owned ship is the active ship docked there. No ship is created or copied: ownership is only a list. A player with no ship gets none.
- **Mid-mission logout:** progress, cargo and credits persist; the flight leg restarts from the pad (routes are computed from the current location, so a saved contract still resolves). See question 2.
- Credits, reputation and mission state are client-simulated today and only validated for shape by `clean_save`. That is fine while multiplayer is purely social and nothing about them is shown to or traded with others. It must be revisited before any shared economy.

### 5.9 VR sessions and the shared companion
- **Sessions** are registered on the hub: id, type, visibility, capacity, members, creator, state. Public sessions appear in the terminal's browser with type and count. Private sessions are never listed; joining needs an invitation record or friend authorization that the server checks, so knowing an id is not enough. A session lives until its last member leaves (plus a short grace), regardless of who created it.
- **Shared companion state is server-authoritative.** The companions' decision logic is already a pure module that runs in Node. The hub runs it headless per session (position goal, activity, current line and options, recent context, participants). Clients render the snapshots, play the pre-recorded voice for the line the server chose, and send intents (choose option, greet). Intents are queued and applied in order by the server, so two players clicking at once cannot diverge; a late joiner receives a full snapshot first. The companion addresses the party when more than one player is present.
- **Personal history stays personal.** I found no persistent per-player companion relationship record in the VR code today (only per-session memory and per-browser look choices); I did not audit every story system. If one is added later it is keyed by account and written only by that player's own interactions.
- **Cost:** none. Everything is scripted and pre-recorded; no AI call is involved. The existing AI infrastructure (Iris) is not touched.
- **Refactor needed:** the browser companion code mixes the brain with bone and animation work. A pure `companion-session` module has to be extracted first (about a week).
- **Content question:** the bedroom companions have romantic and intimate options. Shared sessions with strangers need a policy (question 5).

### 5.10 Mobile
A separate static page and small script (no Babylon, no game scripts, no 3D assets), the same accounts and the same hub. The ENTER button shows the notice, then offers the chat page; capable devices (including the ROG Ally) are never shown it. A mobile session has mode `chat`: it appears in the directory as *Mobile*, can use global chat, direct messages, friends, the directory and invitations, and can never hold a pod or an avatar.

### 5.11 Friends, blocks, invitations
- Friend requests, accept and decline, online friends first. Blocks are checked on the server for direct messages, friend requests, invitations and VR joins, so a blocked player cannot route around them.
- A **location invitation** is a message-like record with a destination label (for example "Meet me at Meridian Station"), an expiry and a status. Accepting only marks it accepted and shows the destination. It never moves the player. The same record shape can later carry other invitation kinds without touching direct messages.

## 6. Recommended order (changed from your suggestion, with reasons)

1. **Foundation without networking:** pod start, ship at the landing zone, no restored location, automatic account saves. It changes the single-player game's lifecycle and is needed whatever the hub looks like.
2. **Hub core and chat, with the mobile chat page:** identity, presence, global chat, direct messages, moderation. It gives the community value early (phones can join) and proves the hosting before avatars exist.
3. **Appearance data and customization** (needs art).
4. **The District as a room:** avatars, position sync, server-side pods, pod audio isolation.
5. **Friends, directory, invitations.**
6. **VR sessions, then the shared companion.**
7. **Station rooms.**
8. **Hallway expansion and scaling,** once the floor plan exists.

Reasons: pods, avatars and VR all need rooms; rooms need the hub; chat needs no avatars; the hallway needs your map; appearance needs art that is not producible here; persistence is a precondition for the lifecycle.

## 7. Performance and scalability

- **Bandwidth.** Assume 8 Hz pose updates of about 24 bytes (quantized), relayed only within the room, so each player receives (players minus one) x 192 bytes per second. 5 players: about 0.8 KB/s each. 20 players: about 3.6 KB/s each. 40 players: about 7.5 KB/s each before distance throttling, which is about 300 KB/s leaving the server in total (around 11 GB over a 10-hour day if the room were always full, which it will not be). These are planning figures, not measurements; the load-test PR measures the real ones.
- **Server load.** At this scale CPU is trivial; memory is tens of megabytes for sockets, rooms and pods.
- **Database writes.** Pose and presence never touch the database. Neon is written for messages, friend changes, blocks, reports and appearance. Firestore is written by automatic saves, at most one per few minutes per player.
- **Browser.** Remote avatars share the skeleton and clip set, so animation cost scales gently; limit to the nearest N animated avatars and use idle-only for the rest. Inactive hallway sections cost nothing. Chat runs in a light overlay during single-player play.
- **Reconnect.** Every deploy or restart drops all sockets. Clients reconnect with backoff and resume from a state snapshot; pod reservations are restored from the grace record or reassigned.
- **Stale state.** Heartbeats and server-side timers expire presence, pod grace and session membership, so crashed tabs do not linger.

## 8. Recurring costs (foreseeable)

| Item | Cost | Notes |
|---|---|---|
| Hub on Render | Free to start; about $7 a month for an always-on instance **(verify)** | Free instances sleep when idle and drop their sockets; a hub that holds pods and presence needs to stay up. Approval needed. |
| Neon Postgres | Free tier (about 0.5 GB) **(verify)** | Messages and social tables are tiny; set a retention period (for example 90 days) and a deletion path for account removal. |
| Firebase Auth and Firestore | Free quotas **(verify)** | Automatic saves are limited to event-based, a few per session, to stay within daily write quotas. |
| GitHub Pages | Free | Chat page and scripts are static. |
| AI usage | None | No part of this plan calls an AI service. |
| Character art | Time, not money | Needs Blender and the CC0 pipeline. |

## 9. Risks

- **Account and save data:** automatic saving raises the chance of overwriting. Mitigate with revisions, one session per account, and no destructive migration. Nothing in production is touched by this plan.
- **Existing content:** missions, NPCs, ships, companions, voices and locations are not changed. The retired old-campaign saves stay retired; the optional production reset remains separate and unapproved.
- **Restoring location removed:** #187 and #188's resume logic and tests are replaced, not stacked.
- **Hosting:** Render free instances sleep, restarts drop sockets, and I could not verify current limits.
- **Moderation and safety:** open chat among strangers, possible minors, and the companion content question need a written policy before launch. You are the only moderator.
- **Art and licensing:** no Blender here; the licensed companion model must not be reused for players; the crowd animation clips' redistribution terms need confirming.
- **Complexity:** the shared companion is the largest single piece; it can ship last without blocking anything else.

## 10. What to implement first

Two small pieces in parallel, both testable without any live service:
1. **Lifecycle foundation (single-player):** session start in a pod (using the current pod room and its 10 capsules), Exit Pod, ship at the landing zone rule, no restored location, `area` no longer saved.
2. **Hub skeleton in a new `hub/` folder:** token verification, sessions, presence, rooms, rate limits, protocol and unit tests with fake sockets. Not deployed.

## 11. Proposed pull requests (small and focused)

| # | PR | Depends on | Rough effort |
|---|---|---|---|
| 1 | Session start in a pod (single-player), no location restore, ship at pad | #190 | 3 days |
| 2 | Automatic account saves and one active session | 1 | 4 days |
| 3 | Appearance model, catalog and validation (no art) | none | 2 days |
| 4 | Hub skeleton: auth, sessions, presence, rooms, protocol, tests | none | 4 days |
| 5 | Chat: global, location, direct (Neon, additive), moderation basics | 4 | 5 days |
| 6 | Mobile chat page and the ENTER notice | 5 | 3 days |
| 7 | Friends, blocks, invitations, Players Online directory | 5 | 5 days |
| 8 | Customization scene with rotating preview (reusing the look system) | 3, art | 5 days |
| 9 | District room client: avatars, pose sync, interpolation | 4, 8 | 6 days |
| 10 | Server pod allocator, reservations, grace, pod audio isolation | 4, 9 | 4 days |
| 11 | Pod hallway module and automatic expansion | 10, floor plan | 5 days |
| 12 | VR session registry and terminal browser (public and private) | 4, 9 | 5 days |
| 13 | Companion session extraction and shared Companion Lounge | 12 | 8 days |
| 14 | Meridian station room | 9 | 3 days |
| 15 | Load test, reconnect and deploy drills, runbooks | 4 and later | 3 days |

Roughly 65 days of focused work in total; PRs 1 to 7 (a working community with chat on desktop and phone and a proper login lifecycle) are about 26 days.

## 12. Questions I need answered

1. **Hosting.** Approve an always-on hub (about $7 a month on Render, **(verify)**) from the start, accept a free hub that sleeps and drops connections, or evaluate Cloudflare? Pods and presence are unreliable on a sleeping service.
2. **Mid-mission logout.** Is it acceptable that a player who logs out mid-flight wakes in a pod with the contract, cargo and progress kept, and the flight leg restarts from the landing pad?
3. **Accounts and local play.** Must everyone have an account (a handle-only account is one tap), or may a visitor still play single-player locally with no account and no multiplayer? My recommendation: handle account required to enter the District's shared space; local single-player stays available.
4. **One session per account.** Is a newer login replacing the older one (with a notice) acceptable?
5. **Shared companion content.** Which companion interactions are allowed in shared sessions with other people (the bedroom companions have romantic and intimate options), and what is the age policy? My recommendation: shared sessions offer only conversation, sitting and dancing; the intimate options stay in private, invitation-only sessions and need your rule for who may be invited.
6. **Chat and minors policy.** The rules, the age approach and the reporting process (also from PR #186).
7. **Floor plan and pods.** May the pod allocator and a self-contained hallway module be built now and moved when your revised floor plan arrives?
8. **Art.** Who runs Blender for the male and female bodies, hairstyles and outfits (I can write the scripts and the catalog, not produce the files here), and are you comfortable with MakeHuman/MPFB CC0 bodies for players?

Everything else in your brief is treated as settled, including a hybrid structure (multiplayer only in social places), pod-only spawning, appearance as account data, text chat only, no cooperative combat, and desktop-first with mobile chat.
