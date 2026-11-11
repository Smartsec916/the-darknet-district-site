# The District community: one server for desktop 3D players and mobile chat

Status: PLAN ONLY (David, 2026-11-04). Nothing here is built. No multiplayer, no mobile chat, no new services, no database changes.
Finish the environment-separation work first (PRs #183, #185 and the transition PR).
Free-tier figures marked **(verify)** could not be checked from the build session (render.com and firebase.google.com are not on its network allow-list); confirm them before any decision.

## 1. The short version

- **One community server.** Desktop 3D players and phone visitors connect to the same small realtime "hub". Phones get a light chat page that never loads the 3D engine; desktops get the same chat inside the game. Both see the same online list and the same channels.
- **Same accounts.** The site already has one login system for everything: a Firebase account (a handle with no email, an email link, or Google) plus a public handle shared by the website and every game. The hub uses exactly that. A "guest" in the community is a handle-only account (one tap on the existing flow), because chat needs a name. Visitors with no account at all can look but not talk (decision 2 below).
- **Recommended hosting for a first version: a new small Node service on Render**, modelled on the existing Iris service (which already verifies Firebase logins without any secret, has rate limiting, a Neon database and the `ws` library installed). Free to start; it goes to sleep when nobody is connected, so the first visitor waits about a minute. An always-on instance is about $7 a month **(verify)**; that needs your approval. A free Cloudflare alternative is described in section 7.
- **Built for sharding from day one.** Every connection is assigned to a shard (a numbered room with a cap). There is one shard at first; adding more later changes the assignment step, not the clients.
- **Safety first.** Server-side rate limits and flood handling, handle-only identity, no links or images or private messages at launch, mute and ban lists, a report button, and strict separation between chat and gameplay.

Estimated engineering: about 15 to 20 working days across five small PRs (section 9). Estimated running cost: $0 to start, about $7 a month if you want it always on.

## 2. What exists today (found in the repository)

| Area | What is there | Why it matters |
|---|---|---|
| Accounts | One Firebase project for the whole site (`firebase-auth.js`). Sign-in is a handle (an anonymous Firebase account), an email link or Google (`district-identity.js`). | Mobile and desktop can use the same login with no new system. |
| Public handles | Registry in Firestore (`bp_handles`), written by `identity_api.py` (`/api/identity/me`, `/handle`), 3 to 20 characters, impersonation names (admin, iris, system, moderator...) refused after look-alike folding, one change per 30 days. The Firebase display name (which can be a real name) is never shown. | The chat name is the handle. Reserved-name protection is already done. |
| Python API | Flask on Render (`server.py`, gunicorn), Firebase Admin, Firestore; saves, shop, identity. Request-based only. | Not a good place for long-lived connections. Keep it for accounts and saves. |
| Iris service | Separate Node/Express service on Render (`iris-service/`, free plan in its Blueprint). Verifies Firebase ID tokens itself with Google's public keys, so it needs no secret (`firebaseAuth.ts`). `express-rate-limit`, a Neon Postgres database, additive table creation at start, an admin-only viewer, and the `ws` package (used only by the database driver). | A tested pattern to copy for the hub's login check, rate limits, moderation tables and admin tools. Iris itself stays off the game pages and separate from this. |
| The game | Static files on GitHub Pages. HTTP only (`network.js` talks to the Render API). The "guest" mode today is local-only and has no identity. Nothing realtime exists anywhere. | Multiplayer is entirely new infrastructure. Guest identity for multiplayer has to be the handle-only account. |
| Moderation precedent | Reserved-name folding (handles), control-character handling and fail-closed design (daily report), per-IP and daily limits (Iris). | Reuse the ideas and, where practical, the code. |
| Hosting | GitHub Pages (site), two Render services (Python API, Iris), Neon (free Postgres), Firebase (Auth, Firestore). Merging to `main` publishes the site. | A chat page is just another static page; the hub is the only new running thing. |

## 3. Your requirements, and how each is met

1. **Same login or guest identity as desktop.** The hub accepts the same Firebase ID token the website already holds. Guest = handle-only account.
2. **Same server and channels.** Everyone is assigned a shard; a shard has the same channels for every client.
3. **Online usernames and count.** The hub keeps a presence list per shard and sends `presence` events (join, leave, full list on connect). The mobile page shows "N online" and the names.
4. **Live text chat between mobile and desktop.** One message type for both; the hub fans out to every client in the channel.
5. **No 3D engine, assets or simulation on mobile chat-only.** The chat page is a separate static page with its own small script and CSS (budget: under 60 KB gzipped, no Babylon, none of `void-runner/*.js`). The hub never sends world data to chat sessions.
6. **Normal mobile website preserved.** Nothing about the homepage, navigation, arcade or store changes. The only change is what ENTER does on a phone (section 5). There is no automatic redirect, ever.
7. **Existing infrastructure, no new paid services.** Firebase Auth for identity, Neon (already in use) for moderation records, Render for the hub (a free service, same vendor as today). Nothing paid without your approval.
8. **Automatic server assignment and future sharding.** Section 6.
9. **Moderation, rate limiting, abuse protection.** Section 8.
10. **Chat separate from gameplay permissions.** Section 4.
11. **Cyberpunk style.** The chat page reuses the site's existing look (`accents.css`, `hud.css`, `home-navigation.css`, the District plaque and neon colours: cyan `#5ff2ff`, magenta `#ff2d96`, violet `#c9b4ff`). Real-time log with accessible live regions.

## 4. Permissions: chat is not gameplay

- Every connection has a **mode** fixed at connect time: `chat` (phones, the website chat page) or `world` (the 3D game, later).
- The hub's message schema is a whitelist per mode. A `chat` session can send only `say`, `report`, `ping` and `typing`. Anything else (`move`, `interact`, `mission`, `emote`...) is rejected and counted as abuse. A `world` session gets the world messages in addition to chat, and only once multiplayer exists.
- Chat sessions are never sent world state: only the player list (handles) and, optionally, a label such as "in the District" or "on the street".
- The hub has no access to saves, missions or purchases. The game and shop APIs (`void_runner_api.py`) never accept hub sessions; they keep requiring the Firebase token, as now. Joining chat cannot change a campaign.
- A phone could claim `world` mode, but then it is simply a 3D client and gets no more than any other: all gameplay authority stays server-side and account-bound when multiplayer is built. The guarantee is that a **chat** session can do nothing but chat.

## 5. The mobile experience

**Clicking ENTER THE DARKNET DISTRICT on a phone** opens a cyberpunk notice (not a block):

> THE FULL DISTRICT NEEDS A DESKTOP OR GAMING DEVICE
> The 3D world runs on desktop and gaming handhelds. You can still join the community from here.
> [ JOIN THE DISTRICT CHAT ]   [ I HAVE A COMPATIBLE DEVICE, CONTINUE ]

(Wording is a draft for your review.) Choosing the second button remembers the choice on that device and goes on to the game. It never redirects on its own.

**Detection is by capability, not by guessing the brand.** Show the notice only when the device is touch-first (`pointer: coarse` and no `hover`) **and** small (viewport under about 900 px) or reports a mobile user agent. The ROG Ally, Steam Deck, laptops and desktop browsers report a fine pointer and hover and are never shown it. Tablets can use the override button.

**The chat page** (a new static page, working title `district-chat.html`):
- Sign-in using the site's existing component (handle, email link or Google); first-time visitors pick a handle through the existing handle API.
- Header: server name, "N online", and a collapsible list of names.
- Channels as tabs: `#district` (the shard-wide default) and `#street` (people on the NeoChinatown street) at launch; both visible to everyone, desktop and phone. More channels later.
- Message log (newest at the bottom, accessible live region), composer with a visible character counter (limit 240), a "slow down" notice when rate limited, a report action on every message, and automatic reconnect with backoff and message catch-up (phones drop connections when the screen locks).
- A clear link back to the normal site navigation.

## 6. Server assignment and sharding

- **Shard** = one numbered room (`district-1`, `district-2`...) with its own channels, presence list and message history. Soft cap 40 and hard cap 60 users per shard at first (tunable).
- **Assignment.** A tiny HTTP call before the socket opens: `POST /assign` with the Firebase token returns `{shard, wsUrl, ticket}`. The rules: reconnecting users return to their previous shard (sticky by account) if it has room; otherwise the fullest shard under the soft cap (so rooms feel alive) or a new one. Desktop and phone get the same answer.
- **Phase 1** runs every shard inside one process, which is enough for hundreds of users. The assignment step and the shard id in every message exist from the start, so nothing changes for clients later.
- **Phase 2** (only if needed) runs shards as separate processes. A small directory table in Neon (`district_shards`: id, url, load, updated) lets each process register and report load; the assignment call reads it. Cross-shard features (global announcements, friend lists) would then need a message bus; none are planned for launch.
- The 3D game will join the same shard for its environment (street or interior) as a `world` session, so desktop players and phone chatters share one roster.

## 7. Hosting options and what they cost

| Option | How it works | Cost | Strengths | Weaknesses |
|---|---|---|---|---|
| **A. New Node service on Render (recommended to start)** | A new small web service (`district-hub`) holding WebSockets. Copy the login check, limiter and migration patterns from the Iris service. | Free plan to start. Always-on starter instance about $7 a month **(verify)**. | Same vendor and tooling you already use; Firebase login check already written; Neon already connected; simple to test. | Free services sleep after about 15 minutes without traffic (about a one-minute wake-up for the first visitor). Render's free allowance is shared across free services (about 750 instance-hours a month **(verify)**), and a hub with open sockets is awake all day when busy, so free is realistic only while the community is small. One process, so sharding means more services later. |
| **B. Firebase only (no server)** | Clients read and write chat directly in Firestore or Realtime Database. | Free tier **(verify)**; real server-side moderation needs paid Cloud Functions. | No new service. | Weak rate limiting and moderation (rules only); Firestore charges reads per listener per message, so quotas run out fast; free Realtime Database limits simultaneous connections **(verify)**; hard to extend to world state. **Not recommended beyond a prototype.** |
| **C. Cloudflare Workers + Durable Objects** | One Durable Object per shard holds the sockets; sleeps for free when empty. | Free tier exists **(verify)**; paid plan if it grows. | Wakes instantly, scales to zero, natural fit for shards, WebSocket hibernation. | A new vendor and account (needs your approval even if free); the Firebase token check must be reimplemented (straightforward, public keys); a second platform to maintain. |

**Recommendation:** start with A (free), measure real use, and move to a paid always-on instance or to C if the community grows. Keep the protocol and the pure logic (rate limits, moderation rules, shard assignment) in plain TypeScript modules so they run on either platform.

### Estimated load (rough, for planning)

Assumptions: a message is about 250 bytes on the wire including its envelope; each user sends one message every 20 seconds while active; users stay about 20 minutes; presence events are small.

| Concurrent users | Messages per second (in) | Deliveries per second (out) | Outbound bandwidth while busy | Memory for sockets | Shards at cap 40 |
|---|---|---|---|---|---|
| 25 | about 1.3 | about 31 | about 8 KB/s (about 0.7 GB per day if busy all day) | about 2 MB | 1 |
| 100 | 5 | 500 | about 125 KB/s | about 6 MB | 3 |
| 500 | 25 | 12,500 | about 3 MB/s | about 30 MB | 13 |

- One small instance handles the first two rows comfortably; CPU is trivial. The 500-user row needs several shards (processes) and an always-on plan.
- Realistic daily traffic is a fraction of "busy all day"; the community will be quiet for most hours.
- **Firebase Auth:** no per-sign-in cost for handle-only accounts. **Firestore:** one handle lookup per connection (about one read per join), far inside any free quota. **Neon:** only mutes, bans and reports; a few kilobytes a day. **GitHub Pages:** the chat page and script are tens of kilobytes.
- **Cold start:** on the free plan the first connection after idle waits for the service to wake. The page should say so ("Waking the District...") and retry automatically.

## 7a. Data and privacy

- Messages are kept in memory (a ring of the last 100 per channel per shard) so people joining see recent context. They are not written to the database by default.
- Stored in Neon (new tables, created additively like Iris's, only after your approval): mutes and bans (by account id), and reports (the reported message plus the 20 messages before it, kept 30 days).
- Chat contains public handles only. Account ids are hashed in logs.
- The hub never stores or shows real names or emails. Because chat puts strangers together, including possibly under-18 visitors, **a short chat policy and a decision on minors are needed before launch** (no private messages, links or images at launch is the main protection).

## 8. Moderation, rate limiting and abuse protection

Enforced on the hub, never trusted to the client.

- **Identity:** handle required; reserved and look-alike names refused (already built). Brand-new anonymous accounts get a stricter tier for their first 24 hours (slower rate, no links) because they are cheap to create.
- **Rate limits:** per account a token bucket of 1 message per 1.2 s, burst 4, and 20 per minute; per IP at most 5 connections and 10 new connections a minute; at most 3 sessions per account; the whole shard limited to a global message rate so one burst cannot hurt everyone. Messages over 240 characters are refused.
- **Message hygiene:** Unicode normalised; control and bidirectional-override characters removed; repeated and near-duplicate messages dropped; runs of capitals, symbols and emoji collapsed; links removed or refused at launch; no markup is ever interpreted (plain text only, so nothing can inject into the page).
- **Filter:** a configurable word list with look-alike folding (reusing the handle logic), a "hold" action rather than silently altering words, and a short list of always-blocked terms. The list lives in configuration so you can change it without code.
- **Escalation:** flooding or repeated blocked messages cause an automatic mute (1 minute, then 10, then 1 hour), then disconnect. Admins can mute, unmute, ban and unban an account, and put a channel in slow mode.
- **Reports:** every message has a report button (rate limited); reports go to Neon with context and appear in an admin view built like the existing Iris admin viewer, restricted to a list of admin account ids (as `IRIS_ADMIN_UIDS` does now).
- **Impersonation:** system and admin messages use a visual style that normal text cannot reproduce, and the handles Admin, Iris and The Function stay reserved.
- **Safe failure:** if the hub or the login check is unavailable, nobody can chat; it never falls back to anonymous, unlimited posting.
- **No private messages, no images, no voice at launch.** Proximity voice is a later, separate project.

## 9. Delivery plan (small, separately reviewable PRs)

Decisions first (section 10). Estimates are working days and include tests.

1. **Hub core (4 to 5 days).** New service folder with the login check, sessions, modes and permissions, presence, channels, chat fan-out, shard assignment (one shard), rate limiting and abuse rules. Unit tests with fake sockets and a load-test script. Health endpoint. Nothing public yet.
2. **Mobile chat page and ENTER notice (3 days).** The static page, the capability detection and the cyberpunk notice on the homepage button, mobile and desktop regression tests (Playwright, phone and desktop viewports), no 3D scripts loaded (asserted by a test that lists the page's requests).
3. **Moderation (3 days).** Reports, mutes, bans, slow mode, admin view, word-list configuration, new Neon tables (additive, after approval).
4. **Sharding and assignment (2 to 3 days).** Directory table, load reporting, sticky assignment, tests for balancing and failover; cold-start handling in the client.
5. **Desktop in-game chat (3 days).** The same hub inside the 3D game as a chat panel for `world` sessions, joining the shard that matches the environment. Avatars and movement are a separate, later project and are not part of this plan.
6. **Soak and launch checklist (1 to 2 days).** Load tests with simulated clients, cold-start timing, reconnect after phone sleep, an abuse test script, and a dry run of the admin tools.

Nothing goes live without your approval, and the existing website, shop, saves and Iris keep working throughout.

## 10. Decisions needed from you

1. **Hosting:** A (new Render service, free to start), C (Cloudflare), or A with the paid always-on instance from day one?
2. **Who can talk:** handle-only accounts only (recommended), with no-account visitors able to read but not post, or no reading either?
3. **Channels at launch:** `#district` and `#street` (recommended), or one channel only?
4. **Links:** blocked at launch (recommended).
5. **Minors and policy:** how do you want to handle visitors under 18 and the wording of the chat rules?
6. **Moderators:** only you at first, or named helpers?
7. **Mobile notice wording:** the draft above is unreviewed.
8. **History:** only the last 100 messages in memory (recommended), or stored for a few days?

## 11. Risks and open points

- Free-plan sleep and shared instance hours (Option A). The estimate and the plan assume you accept a wake-up delay, or approve about $7 a month.
- Phones close sockets when the screen locks; the client must reconnect quietly and catch up.
- You are the only moderator today; the defaults are deliberately strict (no links, auto-mute, report queue) to keep that manageable.
- Real-world traffic is unknown; the load table is a planning aid, not a measurement. The load-test script in PR 1 gives measured numbers on the actual service.
- Verify before committing: Render free-plan hours and sleep rules, the current price of the always-on instance, outbound bandwidth allowances, and Firebase and Cloudflare free-tier limits.
- Legal and policy review for a public chat (minors, retention, takedown requests) is outside what the code can solve.
