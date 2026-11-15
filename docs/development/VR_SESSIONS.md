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
| Play in a Bedroom | Yes | Players see each other. The companions are run by each player's own game, so their moment-to-moment behaviour is not identical between players. |
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

## 16 Nov 2026: VR upgrade (music, brightness, Tropical Escape water and fishing)

David asked for graphical upgrades to all the VR areas with new music to match, sensual electronic music in the companion rooms, better water, beach and dolphins, a casting animation, fishing like World of Warcraft's, a counter for every fish that survives playthroughs, and 100 fish as a VR achievement (a rare fish may come later).

### Brightness (the biggest change, and a finding for the whole game)

On Medium and High the renderer's sharpen pass (`babylon-renderer.js`, `pipeline.sharpen.colorAmount = .3`) has multiplied the finished picture by 0.3 since 12 Nov 2026 (commit c3c9213d); Babylon's default is 1. Measured in a browser: sand 42 with it, 129 without. The simulations were built bright before that and looked like night. `vr-core.js` now sets the amount to 1 while a simulation runs and puts 0.3 back on leaving.

**OPEN DECISION for David:** the District, NeoChinatown and everything else are still drawn at 0.3 on Medium and High, and at full brightness on Low (Low has no sharpen pass), so Low players see a much brighter game than Medium players. David has judged and tuned the District's look since 12 Nov in the dimmed state, so it was not changed. Options: leave it; fix it to 1 everywhere and re-tune the District's lights down to the look he approved; or make the dimming an explicit setting. Do not change it without him.

### Music

`vr-core.js` `setMusic(id, level)` plays one looped recording under the generated ambience (`void-runner/assets/audio/vr/`, sources in `LICENSES.md` there): Tropical Escape, the forest, the combat simulator, and the companion suite. The suite's Music setting is now Off / Velvet (sensual electronic recording, the default) / Lounge (recording) / Midnight (the old generated pad). 4,500 ElevenLabs credits, one take each. NOBODY HAS LISTENED TO THEM; the prompts asked for no vocals.

### Tropical Escape

- Water and beach: deeper blue sea, turquoise shallows near the shore, a wet-sand band, a second foam line, sun glitter far out (not on Low).
- Dolphins: larger, shinier skin, and they porpoise (rise and tip under) while swimming, with a small splash; a leap rolls slightly. Same model (Quaternius, CC0); the swimming rules and tests are unchanged.
- Fishing (`vr-tropical.js`): E on the pier casts (the rod swings back and forward, the float flies out to a new spot each time). After 5 to 18 seconds the float splashes; LOOK AT THE FLOAT AND CLICK (left mouse, or E) within 2.6 seconds to land the fish. A click before the bite reels in with nothing. The fish jumps to you.
- Counter: a panel on the pier shows fish caught (of 100), this visit's count and how many of each kind. Kept in the browser per account by `local-progress.js` (now also per kind), outside the campaign save, so it survives a new campaign. It does not follow the player to another browser.
- Rare fish: `RARE` in `vr-tropical.js` has chance 0. Give it a name and a chance when David decides.
- Browser test: `tests/tropical-fishing-browser.cjs` (passes).

### NOT done

- The forest, the combat simulator and the companion suite got the brightness fix and music only; no new models, textures or lighting work. Only the brightness was looked at (forest picture); the suite and the combat simulator were not looked at after the change.
- The dolphin is the same low-poly model. A better one needs a new model.
- The 100-fish achievement itself still needs the server-side record (see ACHIEVEMENTS.md); the goal is counted and shown as reached.

## 16 Nov 2026 (later): companion room upgrade

David asked for Meshy-made room improvements, better lighting and a better view from the balcony, and for companion graphics improvements to be shown to him before anything is pushed. He also asked for a naked option for the companions; Claude declined to build nude or sexually explicit character content, and nothing of that kind was added.

- **Meshy furniture and art** (`void-runner/assets/vr/models/suite-*.glb`, about 1 MB each, 10 to 14 thousand triangles, 1024 px textures): a brass bar cart by the desk, an arc floor lamp over the lounge chair, a dressing table with a lit round mirror on the west wall, a bronze sculpture in the north-west corner, a rattan loveseat on the balcony. Made on David's PC with the Meshy CLI (text to image, image to 3D, remesh; 44 credits each, 220 in all; about 440 left this month), shrunk in Blender. Prompts and sources: `C:\Users\smart\Documents\DarknetDistrict_Assets\Meshy\suite_props\`. `vr-suite-room.js` `prop()` sizes each by height and stands it on the floor; a missing file is skipped.
- **Lighting:** a warm light from the new lamp, a picture light on the sculpture and vanity, a glow behind the mirror, lanterns and amber rail lights on the balcony.
- **Balcony and view:** a low table, three lanterns and a planter on the balcony; outside, an advertising airship drifting between the towers and two searchlights sweeping the cloud (not on Low).
- Collision boxes were added for the new furniture (`vr-suite.js` layout).
- Looked at in a browser at medium quality. The sculpture reads dark; the airship's hull is hard to see against the night sky, its lit sign carries it.
- **Companions: NOT changed.** Their graphics improvements wait for David's approval of a proposal.
