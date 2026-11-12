# Shared VR sessions

Players can be in the same VR simulation together. The rules live on the hub (`tools/district-hub/protocol.cjs`, section "Shared VR sessions"); the menu is in `void-runner/vr-core.js`; the connection is in `void-runner/remote-players.js`.

## What a player sees

In the VR arcade menu, when online, a **SHARED SESSIONS** panel shows:

- the open public sessions (simulation, host, head count) with **JOIN**;
- **QUICK JOIN**: enters the first public session with room;
- a **private code** field with **JOIN WITH CODE**;
- a choice for the next launch: **ON MY OWN**, **PUBLIC SESSION** or **PRIVATE SESSION**.

Inside a simulation the chip at the top says `ON YOUR OWN`, `PUBLIC SESSION · 2/8 PLAYERS` or `PRIVATE SESSION · CODE ABCD-EFGH · 2/8 PLAYERS`. The host reads the code to friends.

When not online the panel says the player is solo and every simulation starts alone, as before.

## Rules (enforced by the hub, not by the menu)

| Rule | Detail |
|---|---|
| Who may use sessions | Registered accounts that are in the District hub. Guests are refused. |
| Capacity | 8 players per session, at most 40 sessions. |
| Public | Listed in `vr-sessions`; joinable by id while there is room. |
| Private | Never listed. Joining by id is answered exactly like a session that does not exist. Entry needs the 8-character code (40 bits, no look-alike letters). |
| Code lifetime | 30 minutes from creation. Players already inside stay; anyone let in once may re-enter by id while the session lives (reconnects). |
| Wrong codes | 5 wrong codes in a minute locks that player's code entry for the rest of the minute. |
| Creating | One new session per player every 5 seconds. |
| Host leaves | The session continues; the longest-present member becomes host. |
| Empty | A session with no members is removed at once. |
| Disconnect | Counts as leaving. The game re-enters the same session after reconnecting; if it ended meanwhile, it is opened again with the same settings. |
| Isolation | A session is its own room (`vr:<id>`): positions, joins and chat stay inside it. The District sees a player leave when they enter a session and return when they come back. |
| Solo play | Playing alone is a private session of one, so the player is not left standing in the District. |

## Which simulations are shared

| Simulation | Shared | Note |
|---|---|---|
| Relax in a Forest | Yes | Players see each other's characters and movement. |
| Tropical Escape | Yes | Same. |
| Play in a Bedroom | No (solo only) | Built around a private companion scene; not synchronised. |
| Combat Simulator | No | Not offered in the menu; its targets and shots are not synchronised. |

Only position, facing and walk/idle are synchronised. Sitting, objects in the world and each simulation's own settings (time of day and similar) are per player.

## Messages

Client to hub: `vr-list`, `vr-create {exp, opts, private}`, `vr-join {id}` or `vr-join {code}`, `vr-leave`.
Hub to client: `vr-sessions {list}`, `vr-room {session|null, peers}`, `vr-update {session}`, `vr-refused {reason}`.

## Tests

- `tests/district-hub-vr-sessions.test.cjs`: the hub rules.
- `tests/vr-sessions-browser.cjs`: two browsers and a wire-level third player against an in-process hub, with simulated identities. Slow on a software renderer: set `VR_TEST_WAIT_MS=480000`.

## Deploying

The hub runs on Render (`district-hub`) and does not redeploy when `main` changes. The hub announces the feature in its welcome (`features.vr`). A game page sends session messages only to a hub that announced it: an older hub counts unknown messages as faults and would disconnect the player. So either can be deployed first; with an old hub VR simply stays solo and offline, as before. Old game pages keep working with a new hub.
