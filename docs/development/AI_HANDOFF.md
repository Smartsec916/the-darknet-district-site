# The Darknet District — current AI handoff

**Start here.** This file is the one current handoff. Read the checklist and the sections through "Open questions" before any other handoff document. The dated diary under [Historical log](#historical-log) is kept so older notes are not lost. Entries in that log contradict each other. They are snapshots, not instructions. The owner's reference pictures from 12 Nov 2026 are written out in [`VISUAL_REFERENCES.md`](VISUAL_REFERENCES.md) so later work can use them without the files. The images are not in the repo yet ([`references/README.md`](references/README.md)).

**Checked against:** `origin/main` `4fc1a70` (12 Nov 2026). That commit is the merge of #240 (Tropical Escape dolphins) on top of `7939256` (NULL nightclub, #238). Re-fetch GitHub before trusting pull-request numbers or deploy claims below.

## CURRENT DEVELOPMENT STATE — RESUME HERE

### 18 Nov 2026 (newest): PLAYERS SEE EACH OTHER'S DEVICE IN MULTIPLAYER (branch `claude/mp-device-visible`, build `2026-11-18-mp-device-1`, pushed, NO PR, not merged)

The owner: in multiplayer, players see each other using their device, styled by the device they carry. Built on `npc-device.js` (the NPC hologram, no duplicate code).

- **Looks:** V1 = the NPCs' cuff and teal hologram panel; V2 = the same in the placeholder violet (`V2_PLACEHOLDER_COLOR`); V3 // Shadow = no cuff or panel, only the faint green eye glow. Reading shows the panel; the camera shows the viewfinder frame. Never readable.
- **Privacy:** the only thing sent is open/closed, the model (v1/v2/v3) and read/cam. No screen content, app, message or photo. The hub refuses any other key or value.
- **Hub (`tools/district-hub/protocol.cjs`, `hub-server.cjs`):** new `dev` message, relayed only on change, at most every 250 ms (faster changes wait for the next position), kept for latecomers; `welcome.features.dev:true`. Old clients ignore it; new clients send nothing to an old hub. **The Render service `district-hub` needs a redeploy** before live players see devices (the game side alone shows nothing against the current hub, and breaks nothing).
- **Client (`remote-players.js`):** sends its own state (from `story.flags.deviceModel`, `VoidPersonalDevice.isOpen`, `VoidDeviceCamera.active`) twice a second when it changes; marks each remote avatar for `npc-device.js` (`metadata.remoteDevice`), which now draws that one kind of player (kind `player-remote`, never in a crowd spectacle). The older V3 `eye` message is still sent for older clients.
- **Tests:** hub protocol, client mapping and pose units in `npm test`; `tests/mp-device-browser.cjs` (real local hub, the game page and a scripted second player). Screenshots: `docs/development/mp-device/`. Details: `MULTIPLAYER_PROTOTYPE.md` (update 2026-11-18).
- **Not verified:** two real browsers against each other (the second player was scripted), the deployed hub, real GPU, VR.

### 18 Nov 2026: PEOPLE USE THEIR V1 — WRIST BRACER HOLOGRAMS, PHOTOS, SELFIES, THE SHADOW'S EYE, DISTRACTED READERS, CROWDS FILMING A SPECTACLE (branch `claude/npc-v1-use`, build `2026-11-18-npc-v1-1`, pushed, NO PR, not merged)
### 18 Nov 2026 (newest): MONKS WALK SLOWLY AND SEE YOU COMING (branch `claude/monk-walk`, build `2026-11-18-monk-walk-1`, pushed, NO PR, not merged)

The owner: "Monk move slowly, they are never in a hurry, they walk steady and intentful. They can almost tell the future so instead of someone using their V1 while walking might bump into them, the Monk senses it a mile away and steps to one side of the sidewalk".

- **`void-runner/ncz-nightlife.js`** `config.monk` `{speed:.65, anim:.65, sense:9, clear:1.05, margin:.1, sidestep:.42, urgent:1.4, hold:1.4, turn:1.8, check:.5}`. A street walker is a monk when tagged `VoidNPCDevice.tag(node,{monk:true})`, marked `monk` (or `npcDevice.monk`) in its or a parent's metadata, or planned with `monk:true` (`isMonk`, checked every 0.5 s so a later tag works). Monks: one steady pace (`monkSpeed` = 0.65 x the average walker, ~0.81 m/s; no spectacle/reader pace changes, no loitering stops, never drunk, walk alone), walk clip `speedRatio` 0.65 so feet do not slide, slower turns, never use a device, never react to drunks.
- **Foresight** (`foresee`/`monkStep`, pure): anyone closing on the monk within 9 m (normal walkers notice at 1.7 m, readers at 0.55 m) whose line is within 1.05 m is seen; the monk eases (max 0.42 m/s; quicker only if someone appears close, e.g. from a doorway, `urgent` 1.4 m/s) to the side of the sidewalk that leaves the nearest person the most room (kept once chosen, no wavering), inside the lane edges, holds it 1.4 s after they pass, then drifts back. Covers oncoming readers, faster walkers from behind, people standing, the street crew and the player. Readers never target a monk for a bump (`bumpable`) and never get a near-miss startle from one.
- Tests: `tests/monk-walk.test.cjs` (pace, early sense, side choice inside lane, a full meeting: the reader never reacts, never a bump). Browser: `tests/monk-walk-browser.cjs` tags a Main Street walker as monk and sends a bump-set reader at it; frame strip `docs/development/monk-walk/monk-sidestep-strip.png` (camera across the street: the monk drifts toward the kerb, nearer the camera, from ~8.9 m; the reader passes 1 m away, no near miss, no bump). Passed 18 Nov (low quality, software GL, ~1 fps).
- Not changed: `npc-device.js` (monk exclusions there already). Known limit: far figures under street-sight LOD (`crowd.js lod`) step their held clip at the clip's own speed, so a distant monk's legs run at normal speed until it is near. On the 0.6 m-wide pavements (avenue-south inside a quarter) the edges leave only ~0.8 m, so a reader there may still sidestep slightly (never a startle or bump).

### 18 Nov 2026 (newest): PEOPLE USE THEIR V1 — WRIST BRACER HOLOGRAMS, PHOTOS, SELFIES, THE SHADOW'S EYE, DISTRACTED READERS, CROWDS FILMING A SPECTACLE (branch `claude/npc-v1-use`, build `2026-11-18-npc-v1-1`, pushed, NO PR, not merged)

The owner: people using their V1, looking at it, taking pictures (food, selfies at the club, with a friend); a fight or an argument in the street and "they'll all want a picture of it, with the exception of the monks, or tier 3 npcs". Then: it is a hologram (unreadable from outside, in the device's UI colour); his reference picture (a wrist bracer with an emitter, the panel projected up from it); "V3 // Shadow get it streamed into their eye. So just their eye glows"; "V2 will look similar to V1, just different color"; readers "might run into things or each other".

- **`void-runner/npc-device.js`** (`VoidNPCDevice`, `VoidCrowdReact`). Code and procedural animation only, no new models. A dark metal **cuff on the left forearm** with an emitter strip; a **translucent panel** rises from it toward the face with a faint light cone (V1 teal `#61eee9`; V2 the same in a **placeholder** violet, one constant `V2_PLACEHOLDER_COLOR`, pending the owner's V2 design). From outside it is blurred blocks and scanlines (a smear inside viewfinder corners for the camera), never text. **V3 // Shadow:** no cuff, no panel, no raised arm: one eye glows faintly in the Shadow green, with a slight flicker and a head tilt or stare.
- **Poses** (bone overrides after the clip each frame, put back after the frame is drawn; eased in and out; a two-bone reach on the Mixamo-named rigs): reading (forearm across the chest, head down, the right hand swipes now and then; walkers slow to 62% and keep walking), photo / food photo (arm out to the subject, the viewfinder upright above the wrist, a small flash on capture in about half of photos), selfie (arm out front-left, panel turned back, the right hand up by the face), pair selfie (a friend leans in; the pair turn to face the same way), filming (held on the action). Story people: Admin, Iris and Dax read now and then, never while a conversation is open; Juno Vex's "device" beat now shows this panel (her old lit slab is put away).
- **Rates:** the street keeps 10–20% of its people using one at a time, 5–15 s each; food / bar spots 15–30% (no food stalls exist on main: NULL's bar guests and the District's bar regulars photograph their drinks); NULL 15–30% (selfies, filming, pair selfies between the bar guests and between dancers); V3 carriers only read or take an eye photo. Caps on people drawn using it at once: Low 4, Medium 10, High 16 (the nearest in view, within 22 m).
- **Distracted readers** (`ncz-nightlife.js` `config.distracted`): readers notice people late (0.55 m instead of 1.7 m) and sidestep fast (near misses); 8% of looks end in a bump: into someone coming the other way (both stop, turn, a word or a shrug, 2.2 s) or, with nobody met, the shopfront at their shoulder (an eased half-step back, a jolt, a startled look). The hologram flickers and closes. Never the player, V3 carriers, monks or story people. Deterministic from the walker and the look.
- **Spectacle:** `VoidCrowdReact.spectacle({x,z,radius,kind,duration})`: everyone within the radius (not story people) stops and turns to it; 78% film, the rest watch; 25% step closer, 20% back; monks (`metadata.monk`; Zen Zephyr is tagged) ignore it; V3 carriers ignore it or turn away (walkers walk the other way). Ends after `duration` plus 2–5 s. **Developer Tools > Test & Jump To > STAGE A STREET ARGUMENT HERE** puts two street people arguing 5 m in front of the player and fires it.
- **Measured** (software renderer, Medium, Main Street, the feature forced on for everyone in view): draw calls about the same (1,043 off, 1,020 on: the crowd moved between samples; the pieces are instances, a handful of draw calls); the module's own cost 0.8 ms a frame idle and 3.1 ms with 7 people posed on this CPU-only machine (about 0.35 ms per posed person, all JavaScript bone work).
- **Tests:** `tests/npc-device.test.cjs` (tiers, the share band, durations, poses, pair selfies, caps, spectacle exclusions / radius / end, who takes part, bump rates); `tests/npc-device-browser.cjs` (street, the Shadow close-up, a near miss and a bump frame by frame, the staged argument with a V3 carrier and a monk, performance, NULL selfie, pair selfie, a drink photo). Screenshots: `docs/development/npc-v1-use/`.
- **Not verified:** real GPU hardware and its frame cost; VR; High / Ultra in the browser; Admin, Iris, Dax and Juno in the browser (generic code paths); the District bar regulars' drink photo in the browser (only NULL's bar was shot); the purchased NULL model variant. The streets are dark at night, so the screenshots are dark too.

### 18 Nov 2026: GALLERY METADATA; DEVICE IDS; EVERY LOCATION NAMED (branch `claude/gallery-metadata`, build `2026-11-18-metadata-1`, pushed, NO PR, not merged)

The owner: "In the Gallery App players can click MetaData on selected pictures, in MetaData it shows who was tagged, the location, the device ID on the person who took it, and maybe more later. This means every location needs a name". Corrections: the photographer stays anonymous ("Not the handle, unless the person or npc posted it online ... Although there will be ways to track it later"); clear out old photos and start fresh. Full record: [`MISSION_EDITOR.md`](MISSION_EDITOR.md), "Sixth pass".

- **METADATA** in the V1 Gallery: TAGGED (and how identified), LOCATION (places.js chain, most specific first), DEVICE ID, TAKEN (in-game time). No handle or player id stored; a `postedBy` hook is empty. Tracing a device ID to a person is a future gameplay mechanic.
- **Device ID** `V1-XXXX-XXXX`: `story.flags.deviceSerial`, made once per campaign from a hash with a thrown-away random number (irreversible), survives reloads and `clean_save`; recorded at capture; shown in MY V1.
- **Fresh start:** the Gallery's IndexedDB goes to version 2 and its photo store is emptied once (photos were never in the cloud save). Nothing else is touched.
- **Naming pass:** `places.js` now has 168 places (System › Planet › City › Area › Venue › Exact location): 147 existing names (50 of them shopfronts named by their neon signs), 21 PROPOSED working names. Review sheet [`LOCATION_NAMES.md`](LOCATION_NAMES.md) with an "Owner's name" column; map [`location-names-map.png`](location-names-map.png). The planet's name is not settled (PROPOSED, uses "NeoChinatown"). Mission Editor pickers show level, working-name marks and the whole chain.
- **Tests:** `tests/places-names.test.cjs` (grid-sampled walkable points all resolve to a named exact location; hierarchy; device ID; metadata; fresh start), `tests/gallery-metadata-browser.cjs`, updated `eyes-on-the-street` and `guide-route` tests, `test_story_save.py`.
- **Not verified:** real hardware; VR; another player in a photo; shopfront positions are a reading of the city as built today.

### 17 Nov 2026: COMPANIONS STAY WHOLE UP CLOSE; STEADIER HEAD TRACKING; SMOOTHER, MORE NATURAL MOVEMENT (branch `claude/companion-fixes`, build `2026-11-17-companions-1`, pushed, NO PR, not merged; companion graphics need the owner's approval before going live)

The owner: "The Companion NPCs when interacting with them sometimes their head, eyes, arms disappear. Sometimes their in odd positions, probably because of head tracking. Try to fix these things, also aim to make them more natural."

- **Cause 1 (parts vanishing): stale culling boxes.** Each companion part is a skinned mesh whose culling box is its bind pose. Once a clip (dance, talk, sit, lie back, gestures) moved an eye, the teeth, jewellery or an arm out of that box, the part was dropped whenever the box fell outside the view, typically up close with the part near the screen edge. Measured with 250 random close views per pose (0.3 to 1.2 m), the number of views where a part on screen was not drawn, before and after the fix: Nadia dance 1→0, talk 1→0, sit 8→0; Ava 17/18/21→0; Eva 17/14/17→0; Yuki 2/2/12→0; Dex 2/2/10→0; Kai (one mesh) 0→0. An earlier run had lying back and dancing at 21–58 of 250. **Fix:** every part's box covers the whole space the body can reach (`VoidVRCompanions.reach`, set in `vr-suite.js fitReach`). The boxes move with the companion, so culling still works when the companion is out of view.
- **Cause 2 (camera inside the head):** companions are not solid, so the player could walk into them and the near clipping plane cut the face away. **Fix:** the player is kept 0.5 m from a standing companion.
- **Cause 3 (odd head positions):** (a) the head's forward axis was measured once from whatever pose the first frame had, so a turned or bowed head picked the wrong axis; it now waits for a clear pose (else uses the Mixamo +Z). (b) The head turn was one shortest-arc rotation, which tipped the head sideways when the companion looked up from well round to one side; it is now yaw about the vertical, then pitch about a level axis. (c) Nothing limited what the turn added on top of a clip that already turns the head (glance back, tilt); this is now capped (80° sideways, 35° up/down), and those moves keep most of their own head motion (`headWeight`). (d) With the player straight behind, the head whipped from one shoulder to the other; it now keeps its side (`look(..., side)`). `npc-look.js` (walking-conversation head turn) now explicitly never touches companions. `street-sight.js` was checked: it only touches the street's ambient people, never companions.
- **More natural (code only):** clips cross-fade over about half a second; standing companions shift weight between their two idle clips every 9–17 s; when spoken to they turn to face the player with an eased body turn (from 20° off), and do not glance away mid-conversation; on-the-spot turns ease in and out at no more than about 110°/s (no spinning on the heels); arriving at a spot, the window, home, the sofa or the bed, they turn and settle over a moment instead of snapping (the sofa used to teleport them 0.7 m and the bed 1.1 m).
- **Tests:** `tests/vr-companion-motion.test.cjs` (pure maths); `tests/vr-companion-close-browser.cjs` (in a real conversation, up close from ten angles for 10 s: every on-screen part drawn, nothing hidden by another system, camera outside the near plane, head angles within limits, no added roll, no T-pose frame).
- **Evidence:** the same frozen pose and camera, old code against new, 1366x768. Before, Ava lost her head and her red top and skirt; Eva lost her head, dress, necklace and bracelet; Dex lost his briefs (the bare body underneath showed); after, every part is drawn. Those pictures show licensed models, so they are kept out of this public repository (local `work/companion-fixes/`). Head tip measured on Nadia seated with the player standing well round to one side: 3.1–9.6 degrees before, 0.4–3 after (what the attention pass itself adds: under 0.1 degree). The close-up browser test passed for Nadia, Kai and Ava (software rendering); the culling counts above cover all six.
- **Not verified:** real GPU hardware and VR headsets; Una (her file is not on this machine); two companions together in the room (the code is per companion, but not run as a pair); how the weight shifts and eased turns feel in play over minutes.
- **Needs model work (proposals only, not done):** eye bones or eye-look shapes so the eyes, not only the head, follow the player; turn-on-the-spot and step clips so feet do not slide during body turns; a proper seated-to-standing transition for lying back on the bed.

### 17 Nov 2026: MISSION 003 — CORPORATE CONNECTIONS (branch `claude/mission-003`, build `2026-11-17-mission-003-1`, pushed, NO PR, not merged)

The owner's mission (APPROVED, verbatim in `VOID_RUNNER_HANDOFF.md` §11). Full record: [`MISSION_EDITOR.md`](MISSION_EDITOR.md), "Fifth pass".

- **Live game:** after Eyes on the Street, talking to Admin gives his four-line briefing (recorded) with ACCEPT / NOT NOW → "Corporate Connections", tracked, the arrow to Milked's front vestibule (Far South) → walking into Milked completes "Travel to Milked" and the arrow points to Eva → Eva (PROPOSED drafts, text only; then her two recorded lines); she turns toward the staff door and the STAFF ONLY door at the studio hallway's far end opens for that player (`story.flags.mf_milkedStaff`; locked before) → the arrow leads through it to Fish → Fish: the player's line (PROPOSED), her Mandarin line at 70% with the V1's English translation starting 0.75 s later over it, shown under it as "V1 TRANSLATION" → Fish added to the V1 contacts and followed on Social (banner) → mission complete, no reward.
- **The in-game clock (the owner: CLOCK ONLY for now):** `void-runner/game-clock.js` (`VoidClock`): 1 real minute of walking or flight (tab visible; never menus, pause, conversations, the pod card or offline) = 12 in-game minutes, so an in-game day is 2 hours of play. Per player in the save: `story.flags.gameMin` (in-game minutes since the campaign started; a new campaign is Day 1, 21:00). Shown on the V1's header ("21:40 · DAY 1") and kept in photo metadata (`gameMin`, `gameTime`). No day / night lighting, crowds or shop hours yet (they can read `VoidClock.now()` later).
- **Fish's follow-up call:** becomes DUE **6 in-game hours** (about 30 minutes of play: the owner, so a side mission fits in) after Mission 003 (one value in the mission data: `main-story.js FOLLOWUPS gameMinutes:360`; stamped `gc_<mission>` at completion, fired once `ev_fish-followup-due`). **Stub:** only the event `void-tree-event` {id:'fish-followup-due'} fires; no call or content until the owner writes it. Due state and the in-game time it is due: Mission Editor, Mission 003's card. New reusable editor pieces: trigger "After in-game time" (hours and minutes), step "Wait for their call", unlocks "Add to the V1 contacts" and "Follow their Social profile" (server check the same).
- **Translations (the owner's standard from now on): spoken in the speaker's OWN voice, in English** (Fish: `fish-m003-en.ogg`, her ElevenLabs voice). One setting per character: `void-runner/assets/audio/voice/extra/manifest.json translations['milked-fish']` (voice, a subtle device filter, offset 0.75 s, the original at 70%); the clip file can be swapped.
- **Not verified:** real hardware (software renderer only); hearing the overlap by ear (start times checked in the browser); VR; the rear staff entrance from the service alley still reaches the staff area without Eva (unchanged; the owner's call); Eva's gesture is a turn plus her talk clip (her look has no pointing clip).

### 17 Nov 2026: THE GUIDE ARROW NO LONGER TURNS ROUND AT DOORWAYS; ONE ROUTE MODULE FOR EVERY MISSION (branch `claude/arrow-smoothing`, build `2026-11-17-arrow-1`, pushed, NO PR, not merged)

The owner: "if it's pointing at a doorway and you walk slightly past the marker point the arrow points backwards for a bit ... look for other cases". Full record and tunables: [`MISSION_EDITOR.md`](MISSION_EDITOR.md), "The guide arrow".

- **Root cause:** inside the District the arrow aimed at one point, the vestibule's middle, until the scan swapped the street in; the checkpoint starts 1.2 m before that point and the player keeps walking while the doors seal, so the arrow pointed back for the whole scan, then straight at NULL through the vestibule wall. Also the arrow aimed at the point's screen position, which drops below the arrow's ring within about 2 m, so it swung down (backwards) just before any marker.
- **Fix:** `void-runner/guide-route.js` (new, pure, `TUNE` in one place): regions and portals (District rooms, vestibule, NULL, Milked, gate lanes A1–A6, every quarter's streets and their junctions); doorways passed by radius or by crossing their plane; hysteresis; damped shortest-arc smoothing; snap with a fade only on a new goal, a teleport or a scene / area / quarter change; fades near the goal. `trackedWalkWaypoint` is now always the goal; `world-integration.js drawMissionWaypoint` draws the follower's bearing. `mission-guide.js missionPlaceRoute` and `districtRoute` return the real goal.
- **Tests:** `tests/guide-route.test.cjs`; `tests/arrow-route-browser.cjs` (Mission 002's route walked frame by frame through the real checkpoint); `tests/eyes-on-the-street-browser.cjs` updated (the goal is NULL's door; the route leads out through the vestibule). Screenshots: `docs/development/arrow-smoothing/`.
- **Not verified:** real hardware; VR (the arrow is off in VR, as before); the older stations in the browser (unit-tested only).

### 17 Nov 2026: TALK FLOW — WALKING CONVERSATIONS FLOW BY THEMSELVES, A BIGGER "TALK TO" AREA, THE SPEAKER LOOKS AT YOU, ADMIN'S ZOOM LINE (branch `claude/talk-flow-1`, build `2026-11-17-talk-flow-1`, pushed, NO PR, not merged)

The owner: Admin's lines "came one at a time ... it kind of stopped the natural flow" (an empty text area, TRANSMITTING, and SHOW FULL LINE to click between every line); "make the area that makes 'Talk to . . .' show up for all characters a little bigger"; "if a mission giver is speaking their mission lines to the player engage head tracking on the mission giver NPC"; and a new line in Admin's 002 call (APPROVED, `VOID_RUNNER_HANDOFF.md` §11).

- **Root cause:** in walking mode the 3D update (`babylon-integration.js`, the `mode==='walking'` branch) returns before the older update chain, and `scenes.js` typed each line from inside that chain (`updateSpeech`). So in the District a line never typed and never finished: the text area stayed empty until SHOW FULL LINE was clicked, then NEXT. Flight and dock scenes (the chain runs there) were not affected.
- **Fix:** `scenes.js tickSpeech()` types in real time and is also called from an outer update wrapper (`conversation-ui.js`), so it runs in every mode; safe to call twice a frame. In a walking conversation (`speech.auto`): the text types at once; the line's clip plays (`voice-clips.js` reports start and end on `speech.voice`); the next line comes 0.5 s after the clip ends, or, with no clip (or a clip that fails or has not started within 1.5 s), 0.5 s after the typing plus a reading pause of 1.2 s + 35 ms a character. The **last line never advances**: CONTINUE / ACCEPT / NOT NOW wait for the player. While typing the button says **SKIP ›** (to the next line; on the last line it shows the whole line, so a choice is never taken by accident). REPLAY restarts the line's wait. A minimized conversation or a choice menu holds. A clip still loading when the next line comes is dropped (it used to be able to play over the next line). The status reads SPEAKING (in person), not TRANSMITTING. Constants: `SPEECH_TIMING` in `scenes.js`.
- **Talk area:** `exploration-controller.js select()`: an interaction whose label starts SPEAK WITH / TALK TO / TALK / / TALK — (or `talk:true`) reaches 1.5x its range (Admin and Iris 4.5 m) and a wider look (cos 0.35, about 69 degrees off centre; was 0.55, 57). Among people the one nearest the view centre wins; against an object a person counts at two thirds of the distance; objects are unchanged. Line of sight as before (never through a wall or counter; Admin's point is on the customer side of his counter). Straight back from Admin's point a solid stands at about 3 m, so "further back" works diagonally (3.5 m to either side, checked in the browser).
- **Head tracking:** `void-runner/npc-look.js` (new): the current line's speaker (by `who`, else the character nearest the interaction used, e.g. the bartender) turns head 65% and neck 35% toward the player's eyes, eased in (about 1 s) and out, within ±70 degrees yaw and ±30 pitch; past 60 degrees the body turns up to 25 degrees. Applied after the animation each frame and taken off before the next, so idle clips play on. Only nodes with `metadata.character` (Admin, Iris, assembler and crowd figures), never a player avatar. The face axis of a Mixamo rig is the head bone's +Z (measuring it from the pose picked an ear when Admin's idle clip had his head turned: he showed his profile). Checked on Admin (Meshy model, Mixamo bones): from the front and from either side his face turns to the player's eyes (screenshots).
- **Admin's zoom line:** six lines in the 002 call; the owner's re-recorded clip; manifest text equals what `mission-content.js stepMessage` builds, byte for byte (tested). Editor drafts: an untouched copy of the old five-line call takes the shipped six (`main-story.js refreshShipped`); his own edits are kept.
- **Tests:** `tests/talk-flow.test.cjs` (clip texts for 001 / 002, the call, drafts, the talk area, head-turn limits); `tests/talk-flow-browser.cjs` (Admin's four-line offer from line 1 to the last line with no clicks, then waits for ACCEPT / NOT NOW; REPLAY; release; the prompt from the side and further back; Admin's head toward the player). Screenshots: `docs/development/talk-flow/`.
- **Not verified:** real hardware (software renderer only; at about one frame a second there, typing is slower than real); hearing the clips by ear; VR; head tracking on Iris, the bartender, Eva, Fish, Zen and crowd figures in the browser (the code is generic; only Admin was checked); body turn by eye.

### 17 Nov 2026: HALDEN REYES IN MISSION 002 (branch `claude/halden-reyes`, build `2026-11-17-halden-1`, pushed, NO PR, not merged)

The owner's decision (APPROVED, `VOID_RUNNER_HANDOFF.md` §11): at NULL Juno Vex is talking closely with **Halden Reyes**, a well-dressed corporate man; the Mission 002 photo counts only with both. Record: [`MISSION_EDITOR.md`](MISSION_EDITOR.md), "Fourth pass" (Halden Reyes).

- **Built:** `halden-reyes` from the character kit (TRADER look, no hat, short neat jet hair, suit tinted deep midnight blue), standing 0.85 m from Juno's stool, the two angled toward each other; a conversation loop (talk, listen, her device, glances at the room). The camera names him "Halden Reyes". Photo and send-a-photo steps take `subjects` (one or more, all in the same photo; editor tick boxes; same check on the server `void_runner_live_content.py`); 002 requires `[juno-vex, halden-reyes]`. One marker over the middle of the pair. NULL: Low 7 / Medium 10 / High-Ultra 11. No dialogue for Halden; what Admin learns about him is the owner's to write.
- **Not verified:** real hardware (software renderer only); High / Ultra in the browser test (Low only); the purchased NULL model variant; VR. The kit has no long coat (his is the suit jacket).

### 17 Nov 2026: MISSION 002 — EYES ON THE STREET; THE AWAKENING TREE; PLACES, PHOTOS, MESSAGES, REPUTATION (branch `claude/eyes-on-the-street`, build `2026-11-17-eyes-1`, pushed, NO PR, not merged)

The owner's agreed Awakening Tree script (APPROVED, verbatim in `VOID_RUNNER_HANDOFF.md` §11). Full record: [`MISSION_EDITOR.md`](MISSION_EDITOR.md), "Fourth pass".

- **Live game:** after Awakening, talking to Admin gives his in-person offer of **Eyes on the Street** (backend 002, `m002-eyes-on-the-street`) with ACCEPT / NOT NOW (NOT NOW: offered again next time) → Mission Log, tracked, the yellow arrow out through the vestibule to NULL's door → walking into NULL completes step 1 and brings Admin's Comms call (the owner's five lines; six since the zoom line, 17 Nov 2026 talk flow) → **Juno Vex** at NULL's bar with a yellow marker (only while that step is in progress and tracked) → a photo that really shows her (camera checks at capture: frame, centred, ≤15 m, line of sight) → Messages › INBOX › Admin › ATTACH › SEND (wrong photo: "That's not the person…", unlimited tries; right photo: "Received…") → back to Admin: "Not bad…", 100 credits, `story.relationships.admin` +10, paid once.
- **Reusable:** `void-runner/places.js` (named places by hierarchy, enter / leave events per player), step kinds enter / leave / photo / send-photo, lines `via` Comms call or message, start `accept`, trigger `leave`, unlock `reputation` (NPC → `story.relationships`, faction → `progression.reputation`), `talk-choice.js`, `mission-guide.js` (arrow to places and people, marker, help hints `data-help`). The Mission Editor edits and plays all of them; the server check (`void_runner_live_content.py`) is the same. The tree "Main storyline" is shown as **Awakening** (id unchanged).
- **NULL:** Low 6 / Medium 9 / High-Ultra 10 people with Juno; VIP pair and outside queue removed; FIXER no longer in NULL's crowd (Juno is built on it).
- **Not verified:** real hardware (software renderer only); High / Ultra in the browser test (Low only); the purchased NULL model variant (Juno sits at the built bar's stool position; that model has no stools); VR; the server with publishing on. Juno's "long black coat" is the kit's black FIXER jacket and skirt (no coat in the kit); the raised visor is the gear visor moved up onto her bob.

### 17 Nov 2026 (latest): MISSION 001 — AWAKENING; MISSION NUMBERS; MISSIONS START IN PERSON OR BY NOTIFICATION; EVERY OLDER MISSION REMOVED (branch `claude/mission-001`, build `2026-11-17-mission-001-1`, pushed, NO PR, not merged)

The owner: "I also need a backend Mission numbering system, as well as names", "Go ahead and remove all missions in the game", his Mission 001 text (APPROVED, verbatim in `VOID_RUNNER_HANDOFF.md` §11), "either have Missions start by notification or in person", a V1 notification when it is closed, notification sounds per device ("V3 is Shadow"), and EXIT TO MAIN MENU in Developer Tools. Full record: [`MISSION_EDITOR.md`](MISSION_EDITOR.md), "Third pass".

- **Live District game:** the only mission is **Awakening** (backend Mission 001, `m001-awakening`, `void-runner/main-story.js`; players never see numbers). First pod exit (or the next one for a character who left the pod before it existed) → a Comms call from Admin: "V1 · Incoming call from ADMIN · Press L to answer" with the V1 sound → L answers (transcript of the owner's two lines, no reply, RECENT CALLS keeps it) → Mission Log "Awakening", objective "Locate Admin", tracked (from the moment the call arrives), waypoint to Admin → talk to Admin in person → complete. **Admin's in-person lines (step 3) are unwritten**: a placeholder shown only in the editor and draft play; live players get no dialogue there, only "MISSION COMPLETE · Awakening".
- **Also:** editor drafts copied to the owner's private server draft `mission-editor-workspace` and restored when the browser is empty (the owner lost a tree by clearing his browser data); updates apply at the loading screen or main menu without a manual refresh (`update-ready.js`; cause of the old music: the previous service worker served the previous build's cached files on the first load after a deploy); Developer Tools EXIT TO MAIN MENU.
- **Removed:** the beginner campaign (`beginner.js RETIRED`) and every older mission in a District campaign (`mission-log.js live()`); nothing gives a ship now. Code and ids kept; the Mission Editor shows them archived (copyable). Saves: records, credits, items and ships kept; a tracked removed mission is untracked (`campaign.js retireMissions`, `clean_save`).
- **Numbers:** unique, never reused (shipped ledger + the server's published ledger). **Start modes:** in person, or by notification (Messages / Comms call / banner) on first pod exit, after a mission, a place, or a story flag.
- **Not verified:** real hardware; the server with publishing on; VR (the V1 and its notification are desktop only); the notification sound by ear (the browser test only sees it requested).

### 17 Nov 2026 (later): MISSION EDITOR, SECOND PASS: name trees, new trees, givers, ships, routes, tree links (branch `claude/mission-editor-2`, build `2026-11-17-mission-editor-3`, pushed, NO PR, not merged; origin/main with #345 merged in)

The owner asked: "Can I also name mission trees here? Start new ones? Will it have previous Mission givers like Rook?", then his first use case (Admin or Iris → a ship → fly to Rook → a new tree given by Rook). Full record: [`MISSION_EDITOR.md`](MISSION_EDITOR.md), "Naming trees and starting your own".

- **Built:** a name for every tree (display only; ids never change); **+ NEW MISSION TREE** (`draft-` ids, stable); missions and steps added, removed, reordered; giver picker of every registered NPC grouped "in the current District game" / "earlier characters", each with where they are today and whether a draft can be played and players can reach them (`void-runner/mission-givers.js`, facts from the game's code; nobody moved, nothing written for anyone). Steps: talk, go to a place, fly to / arrive at, deliver, buy. Unlocks: credits, story flag (`mf_`), open route / place, grant ship (any non-paid hull, `campaign.js giveShip` shared with `buyShip`), start tree (link; the started tree waits for it). Branches, store items, gates, reputation, fights, scans, escorts, pick-ups, waits: kept as "needs a code change".
- **Runs in the game** through the one adapter (`mission-content.js` `treeEvent`, fed by `live-content.js`); draft play and publish carry only the missions that can run, in order. Publishing is still OFF on the server. Saves: ordinary mission records plus `mt_`/`mf_`/`ts_` flags and `ownedShips`, all accepted by `clean_save` as it is (tested).
- **Rook's re-voice engine:** ElevenLabs `wzVFxVZCBIi6KBxNhQDI` (the owner, 17 Nov 2026), as Admin and Iris. Registry unchanged; nothing generated.
- **Correction:** Rook is reachable in a District game: Meridian is the beginner campaign's FIRST DEPARTURE, and Rook stands there.
- **Not verified:** Eva/Fish/Zen Zephyr draft play beyond entering the street (handlers called directly, not by walking into Milked or the Temple); Mara, Kess, Mercer draft play; real hardware; the server with publishing on.

### 17 Nov 2026: MISSION EDITOR in Developer Tools (branch `claude/mission-editor-1`, build `2026-11-17-mission-editor-1`, pushed, NO PR, not merged)

The owner asked for a mission editor next to Achievement Manager. Full record and how to use it: [`MISSION_EDITOR.md`](MISSION_EDITOR.md).

- **Built:** Developer Tools > **Mission Editor**: all 10 mission trees in the game data (1 active, 8 historical, 1 inactive District draft at Milked; 40 missions), the NPCs in each with their registered voice (read-only), every step, what each NPC says, where it ends, what becomes available; **All lines for an NPC** (Admin first: all 40 Kokoro lines and the ElevenLabs line). The owner's scripts (docs 05, 06, 07, 09, 10, 12) are locked until he unlocks a line himself.
- **Drafts** save as he types (the beginner campaign shares the Content Studio's draft; the Studio's flow chart is now shared code, `admin/studio-flow.js`, and the Studio page loads again: it was missing two District scripts on `main`).
- **PLAY THIS DRAFT** (per mission and per step) runs the draft in a throwaway session: nothing saved, banner, LEAVE DRAFT back to the editor on the same step with the draft intact.
- **PUBLISH TO ALL PLAYERS** with a check screen, versions and UNDO, and an owner-only **RE-VOICE** queue (`python tools/audio/generate.py --from-queue`; Admin's lines wait for ElevenLabs approval). **Both are OFF on the server** until the owner sets `VOID_CONTENT_PUBLISH_ENABLED` / `VOID_CONTENT_DRAFTS_ENABLED` and `VOID_CONTENT_EDITOR_UID` on Render. Nothing was deployed, no secret, rule or IAM changed; players keep the shipped missions while it is off.
- **Cannot apply live yet** (kept as drafts, listed in plain words): lines spoken outside the conversation window (needs a code change), unlock and reputation additions, historical credits, contracts.
### 17 Nov 2026: SMOOTHNESS AUDIT (branch `claude/perf-audit-1`, builds `2026-11-17-smooth-1` to `-smooth-3`, pushed, NO PR)

The owner: lag walking from the District's vestibule toward the street, and when Milked's inner doors open. Measured in the real game (software WebGL; frame trace, shader-compile log, CPU profile), full record and ranked proposals in [`SMOOTHNESS_AUDIT.md`](SMOOTHNESS_AUDIT.md).
- **District to street:** NULL was built at 70 m, then the glTF loader's light-slot step (every material raised to one slot per scene light when any model loads) rebuilt every shader in view because NULL had added lights. Now done behind the vestibule scan (`neochinatown.js prepare`, `ncz-nightclub.js prepare/warm`, hidden until 70 m as before; `asset-pipeline.js settleLights/keepLights`; street people pre-made). Walk: 2 shader programs instead of 32-40.
- **Milked:** people's looks were fetched only after walking in; now (when on the computer) loaded, placed and compiled behind the card, with the first reflection picture and the floor mirror (`milked-build.js prepare`, `state().prepared` has step times). 0 programs after the card instead of 37. The card is longer in software rendering (38 s here); check on a real card.
- Steady state: `renderRoom` no longer gathers every room mesh every frame to find station doors. Tests: `tests/smoothness.test.cjs`, `tests/smoothness-browser.cjs [low|medium]`.
- **Not verified:** The owner's GPU (software renderer only); everything that changes the look is a proposal only (audit, ranked list).

> **16 Nov 2026, later (branch `claude/milked-far-south-1`, builds `2026-11-16-far-south-1` then `2026-11-16-outskirts-1`, pushed, no PR, not merged):** Milked moved by one rigid translation (100 m south) into the new **Far South** quarter past the **South Gate (A5, now live)**; **A6 Far South Gate** is a pedestrian-only checkpoint to the new **Outskirts** quarter (code-built container homes on gravel; `ncz-containers.js`; Kai Kryptos' home reserved as data `kai-kryptos-home`, nothing else). See `NEOCHINATOWN_QUARTERS.md` (end), `CHECKPOINTS.md`, `MILKED.md` (position note). Next: the owner reviews the look of The Outskirts against his reference pictures; the Outskirts' art is a first slice.
### 16 Nov 2026 (late): Sleeping Pod exit fixed, wall music player does everything. Branch `claude/pod-exit-1`, build `2026-11-17-pod-2`, pushed, NO PR yet (merged with main after #339)

The owner played the live build and said: look over with the mouse and click the wall music and light controls (no Q needed); the pop-up music player should go and the Winamp-style player on the wall should be it; clicking EXIT THE POD took him to the main menu and he came back outside the pod.

- **EXIT THE POD opened the menu. Root cause:** after a click on the pod view the mouse is held by the pod's own screen (`#pod-wake`), not the canvas. `mouse-control.js` only counted the game's own release of a hold on the canvas as the game's, so leaving the pod (click on the glass sign, or E) looked like the player pressing Esc and opened the pause menu (Continue then put him outside the pod). Fixed: any release the game asks for counts as the game's. Reproduced in Chromium with a real pointer hold before the fix (mode `menu`), and gone after (mode `walking`). Tests: `tests/pod-exit.test.cjs`, `tests/pod-exit-browser.cjs` (held click, free click, E; 1366x768 and 1920x1080; Low and Medium).
- **The wall player (`void-runner/pod-player-ui.js`, new, pure plus painter) now does everything the pop-up did, drawn and clicked on its own face:** title or PL opens the song list (6 rows, current song highlighted, wheel and arrow buttons scroll it, click a song to play it); previous / play / pause / stop / next; shuffle; repeat (off / all / one); volume bar; WEBSITE PLAYLIST / MY MUSIC; for My music ADD SONGS (the browser's own file dialog), CLEAR PLAYLIST, x per song, KEEP MY SONGS. The light panel already had Rest / Reading / Music sync and is unchanged. Face texture is 768x384 (was 384x192); click regions come from the same rectangles the painter uses (`tests/pod-player-ui.test.cjs`).
- **Pop-up removed:** the DOM panel, `open()`, the `district-pod-music` interaction and the M key are gone. `pod-music.js` playback, `pod-playlist.js` and the 27 songs are untouched; `pod-music.js` only gained wall helpers (`playIndex`, `toggleShuffle`, `cycleRepeat`, `removeAt`, `chooseFiles`, more fields in `state()`), and kept songs are restored when a pod is entered.
- **No Q needed:** the mouse looks over; a pointer resting on a working control no longer turns the view, so the control can be reached and clicked. Q stays as an optional shortcut ("not needed" on the KeyMap). Pod hint line and KeyMap Sleeping Pod tab updated (M removed, wheel scrolls the song list).
- Tests: `tests/pod-music-browser.cjs [low|high] [width height]` drives the whole player by mouse from the waking view.

### 16 Nov 2026 (END OF DAY SUMMARY — read this first; it corrects the entries below)

**The entries below that say "local commits, NOT pushed, no PR" are out of date: all of them were pushed, passed CI and were merged the same day.** Live on `main` after PR #337: build `2026-11-16-fixes-1`.

**Merged and live today, in order:** #327/#329 Milked interior and surfaces · #328 vestibules without loading wording · #330 street people hidden behind buildings (`street-sight.js`) · #331 District rooms (oxygen bar, real vending machines, store cases, VR booths, hallway posters down, anti-WarFlying screens) · #332 those screens at 10 s per line · #335 Nyx the bartender's own model and seven modelled props · #334 NeoChinatown in three quarters with checkpoints, sky cabs removed, road taxis (`ncz-quarters.js`, `ncz-gates.js`) · #336 advertisement screens and the weekly WarFlying Leadership Board (`ad-screens.js`, `ad-screens-data.js`) · #337 playthrough fixes (pod strip buttons removed, music and light controls on the pod's right wall, KeyMap with mouse map, taxi calling with G and `[E] CALL A TAXI`, East Gate walkers' lane, Milked signs, front-row building bodies restored, plot slits closed, the gap check).

**Known mistake, fixed:** the quarters build (#334) dropped the body of every street-facing building (`old-building` judged as street detail). Restored in #337. The repeatable check is `tests/ncz-gaps-browser.cjs` with `tools/ncz/gap-check.cjs` (`docs/development/NCZ_GAP_CHECK.md`). All NeoChinatown blocks are the code-built FALLBACK, on the live site too: the purchased pack (`ncz:building5`, `ncz:storefronts`) loads but is placed nowhere while NULL's front exists.

**WAITING FOR THE OWNER TO JUDGE (do not apply further until he does): the Old Town art-direction block.** Branch `claude/port-remake-1`, commit `926bce07` (screenshots and gap check were run on this commit; pictures in `6264d2e3`, `docs/development/neochinatown-remake/`, cameras in `cameras.json` there). One continuous block on Main Street's east side (`void-runner/ncz-oldtown-block.js`, existing assets only, 0 credits), the Lantern Bridge landmark over the alley mouth, a six-colour palette. Ray check on that block: 10,012 of 16,800 before, 0 after. NOT merged. His process, in his words: "Treat the landing-pad-to-alley walk as the art-direction pass ... Use the existing assets first ... Let's judge that block before applying the style district-wide." Merging it needs: combine with `main` (same `roofPiece` fix as #337, take either; keep both edits on the `layout()` return line; choose one gap script, `tests/ncz-raygrid-browser.cjs` or `tests/ncz-gaps-browser.cjs`).

**UNFINISHED ASSETS — HANDOFF TO CODEX (the owner asked for this list)**

| What | Where | State | Left to do | Credits spent |
|---|---|---|---|---|
| Port quarter remake (builder, city kit, food stall, housing doors, restroom shell) | branch `claude/port-remake-1`, commit `dc4b227c`; switched off by `VoidPort.enabled=false` | Parked, unfinished. First pictures on Low and Medium only | Port gap check, customs walk, save and reload, landing by ship; the owner must approve the Old Town block first | 528 (12 kit props) + 9 (stall picture) |
| Road taxi model | same branch; `void-runner/road-taxi-model.js`, off by `VoidRoadTaxiModel.enabled=false` | Model made, never checked in the running game | Check scale, wheels, lights, boarding; switch on | 44 |
| Kit models, shrunk GLBs | repo `void-runner/assets/models/ncz-kit/` on that branch (12 MB) | Made | Use in the Port once approved | (above) |
| Source files for the kit props | The owner's PC: `C:\Users\smart\Documents\DarknetDistrict_Assets\Meshy\ncz_port\` (`props.json`, `status.json`, a folder per prop, `out\`, `run.py`, `shrink.py`) | Complete sources. No `.blend` files exist: nothing was made in Blender | none | |
| Source files for the taxi | The owner's PC: `C:\Users\smart\Documents\DarknetDistrict_Assets\Meshy\ncz_taxi\` | Complete sources, no `.blend` | none | |
| Nyx and District props sources | The owner's PC: `C:\Users\smart\Documents\DarknetDistrict_Assets\Meshy\nyx\` and `...\district_props\` | Finished and live | none | 366 |
| Meridian Station screens: voice | `void-runner/relay-screens.js`; street screens' positional voice is in `void-runner/ad-screens.js` | Station screens have the new look and are silent | **The owner assigned this to Codex**: make them speak like the street screens | 0 |

Meshy balance reported after this work: 820 (the owner's page showed 3,107 earlier; which figure applies to generation through Blender is not established). Never buy credits. Licensed and purchased models stay out of this public repository.

**The owner's standing decisions from today (his words are in the files named):**
- Advertisements, WarFlying Leadership Board rules, handles, anti-WarFlying lines: `docs/void-runner/design-source/12-street-advertisements-owner.md`. Only five names are ever shown; the voice names only #1; "a new number one" when a real player leads; top five change weekly.
- Voices: he wants cheesy, over-dramatic news-broadcaster voices, more than one, including a female one. He picks by ear. Nothing is cast: `docs/development/AD_SCREENS_VOICE_AUDITION.md`. Keep the street news in the provisional voice for now.
- Checkpoints are gameplay, not loading screens; more may be added (data in `ncz-quarters.js`). Contraband, bribes and shielding wait for him. `docs/development/CHECKPOINTS.md`.
- NeoChinatown needs, in every quarter: food stalls, housing doors (no interiors), entertainment venues, gross public restrooms with sometimes a passed-out NPC. `docs/development/NEOCHINATOWN_REMAKE.md` on the remake branch.
- Sky taxis are gone for good; rail is "later".
- Camera zoom must bring back full detail (`zoom-detail.js`).
- Location table for ads and the 20 generated handles: he will look himself.

**Next, in order:** (1) the owner judges the Old Town block; (2) then the style district-wide, the Port, NULL exterior and interior (reference pictures are outside the repo); (3) voice auditions; (4) outdoor character upgrade and proper guards (he approved 300–500 credits); (5) Eva's model when he sends a reference; (6) the open brightness decision (Medium and High are dimmed by the sharpen pass outside VR).

**Not verified by anyone yet:** real graphics-card frame rates and checkpoint swap times, High and Ultra, a VR headset, two players in different quarters, any of today's audio by ear.

### 16 Nov 2026 (latest): PLAYTHROUGH FIXES 1 (build `2026-11-16-fixes-1`, branch `claude/playthrough-fixes-1`, local commits, NOT pushed, no PR)

The owner played the live site and sent five pictures and nine notes. Full record, with the complete key list: [`PLAYTHROUGH_FIXES_1.md`](PLAYTHROUGH_FIXES_1.md).

- **Sleeping Pod (the owner authorised the change):** the strip's four buttons are gone; the sign on the glass, the wall screens and the keys do everything. **Q is a new key** (look at the controls). The music player and the light panel are on the right-hand wall. The player's function, playlist and songs are untouched. A click in the pod used to land about a third of the way off on Low (the picture is stretched over the window); fixed in `podPick`.
- **KeyMap:** four tabs (ON FOOT, CAMERA, SLEEPING POD, FLIGHT), every key the game binds, a drawn mouse map per tab. Keys that only work in a situation are drawn only then. **G is a new key** (taxi).
- **Store counter:** nothing stands through the glass; items are only laid on tiers they clear (`TALL`, `fitsTier` in `district-rooms.js`).
- **East Gate:** has a walkers' lane; walked to the Temple and back as the Function Gate is to the Corporate District. At the Temple only a walk-back sign and prompt were added.
- **"I couldn't get to Milked":** nothing blocked the way (a test walks the collision now); nothing on Main Street said where it is. Two signs with the existing logo and an arrow.
- **"Couldn't figure out how to call a taxi":** three causes. The terminal's TAXI / TRANSPORT section refused everyone ("Taxis pick up on foot") because the terminal being open is not the walking state; no taxi could be called from the District's door at all (57 m from a road, limit 50, now 80); nothing in the street said how. Now: CALL A TAXI at every stop's post and at a post by the District's door, and the G key.
- **"Much of NeoChinaTown has gaps in the buildings" (second commit):** when the city was cut into quarters the body of every street-facing building was dropped by mistake (`roofPiece` in `neochinatown.js` did not list `old-building`), on the live site too; none of these blocks uses a purchased model. Fixed, with a repeatable check the owner specified: `node tests/ncz-gaps-browser.cjs <label> [quarters]`, record in [`NCZ_GAP_CHECK.md`](NCZ_GAP_CHECK.md). Old Town 1,819 of 5,880 rays through a wall before, 0 of 14,568 after; the Avenue 1,763 of 2,958 before, 0 of 7,386 after. **The Port was not run** (another session is rebuilding it; it can run the same check with `port`).
- **Every browser script that clicked the pod's EXIT POD button now presses E** (38 files, changed mechanically; only the ones named in `PLAYTHROUGH_FIXES_1.md` were run).
- **Not verified:** real hardware (software renderer only); High and Ultra; the purchased NULL interior; a second player (trade keys, voice key and Enter are drawn from the code, not from a live session).
### 16 Nov 2026 (latest): NEOCHINATOWN IS THREE QUARTERS WITH CHECKPOINTS; SKY CABS REMOVED (build `2026-11-16-quarters-1`, branch `claude/neochinatown-quarters-1`, local commits, NOT pushed, no PR)
### 16 Nov 2026 (latest): STREET ADVERTISEMENT SCREENS AND THE WEEKLY WARFLYING LEADERSHIP BOARD (build `2026-11-16-adscreens-1`, branch `claude/ad-screens-1`, local commits, NOT pushed, no PR)

Built from the owner's own ad lines and direction (`docs/void-runner/design-source/12-street-advertisements-owner.md`). Full record and how to change things: [`AD_SCREENS.md`](AD_SCREENS.md). Voices: [`AD_SCREENS_VOICE_AUDITION.md`](AD_SCREENS_VOICE_AUDITION.md).

- **Built.** The street posters in the Port, Old Town and the Avenue are animated screens in modelled housings, one visual template per ad category, words appearing in step with the voice, news or the WarFlying Leadership Board every fifth slot, sound from where the screen stands (one voice at a time, quiet in checkpoints and indoors). Meridian's station screens have the same look; their content is unchanged and they stay silent.
- **The board is weekly now** (`void-runner/warflying-board.js`): five handles worked out from the real-world ISO week, the same for every player, no server and no save field. #1 is always one of the owner's 57 handles; #2 to #5 mostly come from a handle generator. Only the top five are ever shown; the voice names only #1, or says "a new number one" for a real player. The old five rivals that climbed with play time are gone. The device's WarFlying app and the Mission Log show the same five; the app's button is now SUBMIT SCANS.
- **The owner's words are data and are tested against his document** (`void-runner/ad-screens-data.js`, `tests/ad-screens.test.cjs`). Do not reword or add ads, news, slogans or announcer lines.
- **The location table is PROPOSED, not confirmed by the owner** (which category plays where; no Darknet District ads at the Function Gate end; no screens toward the East Gate, in checkpoints, at the Temple or in the Corporate District). It is one block of data.
- **Voices: nothing new is cast or recorded.** The four broadcast voices are still the provisional stand-ins. The street plays the recordings that already exist (the owner's seven space-station ads, his three news reports); all other lines are silent captions until the owner picks by ear. `RECORD` in `ad-screens-data.js` switches recording on afterwards.
- **Left alone:** The Function's civic-notice poster (silent, unchanged; The Function has no screen content, voice or look), the Sleeping Pod, the music player, the District interior and its anti-WarFlying screens, Milked, the skyline's far posters.
- **Eras:** each ad can carry an `era` tag and the data has a current-era value, but no eras exist and none was invented.
- **Watch out:** `node tools/audio/extract-lines.cjs` on unchanged `main` rewrites the voice manifest and drops about 60 older entries (it has drifted from the dialogue files). Not caused by this work and not committed; check the diff before committing a manifest.

### 16 Nov 2026: NEOCHINATOWN IS THREE QUARTERS WITH CHECKPOINTS; SKY CABS REMOVED (build `2026-11-16-quarters-1`, branch `claude/neochinatown-quarters-1`, local commits, NOT pushed, no PR)

The owner approved map A of the rework plan and this builds it. Full record: [`NEOCHINATOWN_QUARTERS.md`](NEOCHINATOWN_QUARTERS.md); decisions: [`CHECKPOINTS.md`](CHECKPOINTS.md).

- **Built.** The Port, Old Town and The Avenue, one built at a time. Checkpoints as buildings you walk or ride through: A1 Port Customs, A2 North Gate (under a block bridging Main Street), A3 Function Gate (walkers and taxis, to the Corporate District), A4 East Gate (taxis only, to the Temple), A5 South Gate (shut). The everyday loop (Pod, District, alley, NULL, Milked) is all Old Town and meets no checkpoint.
- **A checkpoint is one entry of data** (`void-runner/ncz-quarters.js` `GATES`): position, direction, operator, lanes, what it joins. The owner may add more later as gameplay, including checkpoints inside a quarter that change nothing but run the scan; both kinds are tested. The scan is a picture only and always passes.
- **Sky cabs are gone** (`taxi-rules.js`, `city-taxi.js`, `sky-cab.js` and their tests deleted). Road taxis are the only taxis: seven stops, trips through the gates' vehicle bays, Corporate District and Temple at 60 CR with the ride back included. In the Corporate District and at the Temple ONLY the arrival stop changed (ring removed, road cab, TAXI wording, and at Corporate a prompt to walk back through the gate).
- **NULL:** an open entry passage with an empty door frame at each end (a vestibule by adding two doors).
- **Zoom renders detail:** `void-runner/zoom-detail.js`; used by the nightlife, the alley, NULL, Milked's shell, Milked's streaming and other players' tags and faces.
- **Saves:** no id renamed, nothing new required; `story.flags.quarter` remembers the quarter; old sky-cab records are refunded once and dropped. **Multiplayer:** one hub room for the whole street as before (chat reaches every quarter; nothing deployed); players in another quarter are not drawn.
- **NOT built because NOT decided:** contraband, being caught, bribes, shielding, The Function's own guards, rail.
- **Placeholders:** private guards are street figures in a uniform tint; the Function Gate's guards are the Corporate District's silent robots; the gatehouses are box-built architecture with the existing textures.
- **Honest result on performance:** the Port and the Avenue are much smaller scenes than the old city; Old Town is nearly as heavy as the old city was, because Main Street was always the heavy part. The numbers are in `NEOCHINATOWN_QUARTERS.md`. The plan's further savings (one-piece far figures, a sign sheet, the Medium glow pass) are still to do and are what Old Town needs.
- **Not verified:** real frame rates and real exchange times (software renderer only); High and Ultra; a VR headset; two real players in different quarters (the rule is unit-tested, the hub was not run); the purchased city pack and NULL's purchased interior (not on this machine).
- **Stale scripts:** `tests/corporate-browser.cjs` and `tests/temple-browser.cjs` still ride the sky cab (marked at the top). `tests/ncz-quarters-browser.cjs` is the new end-to-end script.
- **Not mine, left alone:** `docs/void-runner/design-source/12-street-advertisements-owner.md` appeared in this worktree during the session (the owner's advertisement lines); it is untracked and uncommitted here.
### 16 Nov 2026 (latest): DISTRICT INTERIOR ROOMS MADE TO LOOK REAL; HALLWAY POSTERS DOWN; ANTI-WARFLYING SCREENS (build `2026-11-16-district-1`, branch `claude/district-upgrade-1`, one local commit, NOT pushed, no PR)
### 16 Nov 2026 (latest): NYX THE BARTENDER HAS HER OWN MODEL; SEVEN DISTRICT PROPS ARE MODELLED (build `2026-11-16-district-2`, branch `claude/district-upgrade-2`, one local commit, NOT pushed, no PR)

The owner: "The bartender NPC needs upgrading", with his picture of her. Looks only: her id, name, job, spot, prompt, line and voice are unchanged. Full record: [`DISTRICT_UPGRADE.md`](DISTRICT_UPGRADE.md), "Second pass".

- **Nyx never had a model.** The "pale stand-in block" was the renderer's box figure, drawn because nothing called `nyx-district` existed; no licensed file was missing. She is now `assets/models/crowd/npc-nyx.glb` (Meshy, from the owner's picture; 30,942 triangles; clips idle, talk, walk, look, watch, laugh, shrug, wipe), named by `model:'npc-nyx'` in `district-people.js` and placed by a short block in `neochinatown.js` beside the bar's other people. She idles, looks about or wipes down now and then, and talks while her line is on screen. If the file fails, her old box figure shows (never another character) and the file is retried.
- **Seven modelled props on Medium and above** (`assets/models/district-props/`, Meshy): oxygen tank, bar stool, oxygen post with mask, VR headset, pistol, two-way radio, flashlight; 34 copies, each kind drawn as instances of one mesh. `PROPS` and `prop()` in `district-rooms.js`. Low keeps the built props; a file that fails to load is replaced by the built prop. The tanks now stand on plinths.
- **Meshy: 366 credits of the 400 allowed** (1,767 before, 1,401 after). Ledger: `MESHY_CHARACTERS.md`. Licence rows: `docs/VOID_RUNNER_ASSET_LICENSES.md` (the owner still to confirm his plan's wording, as for the earlier Meshy models).
- **Cost:** Low the same or lighter; Medium about the same draw calls (within 50 of before at every viewpoint) and more triangles where the models and Nyx are in view (the widest bar view went from 1,177 k to 1,511 k, part of which is people moving between runs).
- **Checked:** `npm test` 1,006 of 1,007 (the known local-only companion-preview failure); Nyx from five sides and in every clip on Low and Medium; E at the bar on both; the V1 name tag; each prop in place; the missing-file fallbacks; nothing left behind on leaving.
- **Not done / not verified:** not pushed; no real graphics card (software renderer only); High and Ultra not run; multiplayer and a VR headset not tried. Nyx does not serve or walk the bar. Her profile picture in the V1 was not looked at. The bottles, taps, VR controllers and the other goods are still built shapes.

### 16 Nov 2026 (earlier): DISTRICT INTERIOR ROOMS MADE TO LOOK REAL; HALLWAY POSTERS DOWN; ANTI-WARFLYING SCREENS (build `2026-11-16-district-1`, branch `claude/district-upgrade-1`, one local commit, NOT pushed, no PR)

The owner's request with four reference pictures: the bar, the VR play area, the dispensary vending machine ("just has a flat graphic over it"), denser items on the store counter, and any other legacy graphic. Looks only: no solid, interaction, person, voice, line, price or save field changed. Full record, wording table and the performance table: [`DISTRICT_UPGRADE.md`](DISTRICT_UPGRADE.md).

- **New file `void-runner/district-rooms.js`** (`VoidDistrictRooms`, loaded before `neochinatown.js`): data on top (tested in Node), `build(kit)` below with `machine()`, `alcove()`, `bar()`, `store()`, `vr()`. It builds with `neochinatown.js`'s own kit, so its pieces merge and are released with the interior. Low: plain materials. Medium and above: its own copies of the interior kit's metals and concrete (own copies because the hallway modules carry vertex colours and would otherwise stop merging).
- **Vending:** the dispensary machine is always a built 3D machine (body, glazed bay, four lit shelves with two rows of goods, price strips, keypad, display, card reader, coin and note slots, delivery hatch). The other two stay the licensed model where present and are the same built machine where it is not. Stock, names and prices come from `POD_VENDING`.
- **Bar = oxygen bar:** plate counter with a steel top and brass foot rail, oxygen post with mask at every seat and lounge table, four bubbling glass tanks piped to a wall manifold, spare cylinders, a mask rail, an underlit back bar with about 120 bottles, real stools, leather booths, dome and caged lamps, lined walls and a ventilation duct. New sign wording: only `THE DARKNET DISTRICT / OXYGEN LOUNGE`; all menus keep the game's own text.
- **Store counter:** four glass display cases with three tiers, 143 small items and 20 blank tags, all standing for goods the store already shows (`ITEMS` names the product; a test checks it). The counter model's flat coloured trays were removed.
- **VR play area:** the ceiling grid of coloured tubes is gone; steel-framed glass with clamps, a dotted floor with a thin boundary, tracking cameras on arms, a wall grid with a headset and controllers in each booth, floor units, a rack of spare headsets. Layout, glass, players and terminal unchanged.
- **Hallway posters removed at the owner's request** (he will supply new ones): `HALL_POSTER_SPOTS` and `HALL_POSTERS_SHOWN=false` in `neochinatown.js`; set it to `true` to hang them again. The spot by the bar (30.5) overhangs the doorway: move it to about 29 first.
- **Anti-WarFlying campaign screens (the owner's own 25 lines, word for word, silent):** five lit panels sharing one picture: two in the hallway (east wall z 28.2, west wall z 44.3), one on the bar's north wall, and two in the arcade where the posters for the two games not built yet (LASER MOTH, TURBO KELP) hung; the three posters for playable games stay. Lines, timing and places are `CAMPAIGN` in `district-rooms.js`; each screen is whole on solid wall, at least 0.5 m from any doorway or corner (tested). One line every 5 s with a cross-fade, redrawn only while fading and only within 16 m; Low shows the first line.
- **Cost (software renderer, counts):** this pass adds 50 k triangles and 84 merged meshes on Low, 76 k and 87 on Medium, drawn whenever the interior is in view. Typical views: Low +5 to +40 draw calls, Medium +20 to +130.
- **Checked:** `npm test` 1,004 of 1,005 (the known local-only companion-preview failure); new `tests/district-rooms.test.cjs` (7 tests); before and after pictures at the same viewpoints on Low and Medium; E pressed at the vending machines, the bartender, the shop, Admin, Iris and the VR terminal on Low (the first four also on Medium); no page errors; nothing of the new file left after leaving the interior.
- **Not done / not verified:** not pushed; no real graphics card; High and Ultra not run; the licensed vending model is not on this machine. **Meshy: 0 credits** (the Blender bridge was connected but everything was built in code). Medium is still drawn at 30% (the owner's open decision), so the rooms are dark there. The props are simple shapes close up: the tank, stool, headset, pistol and a few store goods are the first candidates for modelled props. Still legacy: the staff workstation and cage in the store, the arcade's ceiling tubes, the meeting room, the doorway signs, Low's plain walls. The bartender is unchanged (a later task).


### 16 Nov 2026 (later): OUTDOOR STREET PEOPLE: HIDDEN BEHIND BUILDINGS, SIMPLER FAR AWAY (build `2026-11-16-outdoor-1`, branch `claude/outdoor-crowd-culling`, one local commit, NOT pushed, no PR)

First step of the NeoChinatown rework plan's "savings that change nothing you can see". Optimisation only: no layout, look or gameplay change. Full record and the table: [`OUTDOOR_PERFORMANCE.md`](OUTDOOR_PERFORMANCE.md).

- **What it does (outdoor street only):** street people who are behind a city block are not drawn and not animated; people outside the camera's view are not animated; people far away have their animation worked out every 2nd (beyond 24 m) or 3rd (beyond 48 m) frame and lose their eyebrows, eyelashes and eyes beyond 34 m. Where everyone is keeps running, so they are in the right place when they come into view.
- **How:** new `void-runner/street-sight.js` (`VoidStreetSight`). A person is in sight when the line from the camera to them stays inside the street rectangles (`neochinatown.js` `streets`, plus NULL), each widened 1.5 m so people appear before a corner uncovers them. Always shown within 8 m, when the camera is above 3.4 m (a cab in the air), or when the camera or the person is not in a street. Shown at once, hidden after 0.75 s. `crowd.js` controllers gained `setCulled`, `lod`, `node`; `VoidCrowd.figures()` lists them.
- **Who:** only the street's ambient people (walkers and standers, the alley, the five standing crew, NULL's people). Other players, companions and Dax are never touched. Figures are never switched off (`setEnabled` stays with their owners), so the camera app's name tags, footsteps and the photo are unaffected.
- **Not touched:** the District interior, Milked's interior, VR, other games, the Medium glow pass, the sharpen setting, the quality tiers, any model file.
- **Measured (software renderer, counts only, off then on in the same session):** the District's street door looking down the alley (view E): Medium 1,980 → 1,240 draw calls, 2.28 M → 0.79 M triangles, 49 → 10 people drawn; Low 666 → 491, 1.11 M → 0.41 M, 24 → 7. The pad: 11 → 0 people (Medium). **Views straight down Main Street gain least** (B, Medium: 2,280 → 1,776 draw calls, 2.35 M → 1.69 M, 52 → 33 people; C: 36 → 36) because those people really are in sight; cutting them further needs simpler far-away models (new files, the plan's section 5.1). Animation clips worked out every frame across the street at Medium: 41 to 71 before, 0 to 17 after.
- **Checked:** `npm test` 997 of 998 (the known local-only companion-preview failure); new `tests/street-sight.test.cjs` (10 tests). Against the real scene: from 60 random street points on Low and 150 on Medium, every person the rule called out of sight (871 and 3,851 cases) was ray-tested against the scene's meshes and none could be reached. Six corner walks on Low (371 steps of 1.2 m, with a turn at each corner) and one on Medium, ray-testing every hidden person inside the view at every step: none wrongly hidden. Pictures every fourth step looked at: the street fills as it opens, nobody missing. In the engine, a held clip lands on the expected frame and carries on from it when handed back.
- **Not done / not verified:** not pushed or merged; **no real graphics card** (counts, not frame rates: the ROG Ally test is still needed); High and Ultra not run; no VR headset; no second player online (other players are excluded by design, not by test); the purchased street buildings and NULL's purchased interior are not on this machine, and the sight test assumes every block is solid, so if a purchased block has a see-through gap people behind it would be missing (`VoidStreetSight.config.enabled=false` in the console shows everyone, for a quick comparison). `python3 -m unittest tests.test_story_save` could not run here (Flask is not installed in this container); nothing in Python was changed.
- **Next in the plan's step 1:** far-away versions of people, signs combined, the doubled glow pass (the owner's decision), NULL's inside drawn only from its doorway.

### 16 Nov 2026 (night): MILKED SURFACES, LIGHT AND REFLECTIONS (build `2026-11-16-milked-4`, branch `claude/milked-surfaces`, one local commit, NOT pushed, no PR)

The owner on the build below: layout, props and the loading transition right, surfaces flat. This pass is surfaces and light only, all in `void-runner/milked-build.js`. Full record: [`MILKED.md`](MILKED.md) section "Surfaces and light (fourth pass)". Pictures: `docs/development/milked/`.

- **Materials (Medium and above):** walls, floors, ceilings, doors, the desks, the quilted walls, the wood floors, the hallway's deck plate and the glass are physically based, using the District interior kit's own roughness / metalness maps where they exist and maps drawn in code elsewhere (damp patches on the floors, relief on the quilt, the deck plate and the rubber mat, scratches on dark metal). Low keeps its plain materials.
- **Reflections (Medium and above):** the floors mirror the rooms (one half-size mirror shared by all floors); metal and glass reflect a small picture of the room group the player is in; the pavement in front of the shopfront has puddles with a real reflection of the sign.
- **Light:** five lamps that move to the five neon signs or tubes nearest the player, one key light with a shadow map in the nearest occupied room, four face lamps for the nearest people. Twelve lights in the scene, eight on any material. Contact shadows under people and furniture on every quality. Low's sky light was raised (its rooms were black).
- **The 0.3 dimming outside VR was NOT changed** (still the owner's open decision, `VR_SESSIONS.md`). Inside Milked the exposure is raised 2.6 times while the player is there and put back on leaving. Medium is still capped at 30% white by that pass, so it is a dark picture; the docs' pictures are labelled when brightened.
- **Mismatches fixed:** the reception side door reads STAFF ONLY 仅限员工 with a small logo; the street doors seen from inside show a painted rainy street; the dancers' clothes are recoloured toward black and pink (their own CC0 clothes, tinted copies; the mask and the VR headset that hid two faces are hidden in here). **Eva was not touched.**
- **Measured (software renderer, relative only):** Low is not heavier (draw calls inside 198 → 187 vestibule, 113 → 108 reception, 147 → 132 hallway, 46 → 46 office). **Medium is clearly heavier** (reception 262 → 441, hallway 348 → 522, office 106 → 244; software frames about 40 to 50% longer) because of the floor mirror and the shadow map. Needs a look on a real graphics card; the mirror can move to High only if it is too much. Table in MILKED.md.
- **Checked:** `npm test` 987 of 988 (the known local-only companion-preview failure); `tests/milked-browser.cjs low` passes; every space looked at on Medium and Low, before and after from the same viewpoints; going in and out twice leaves nothing behind.
- **Not done / not verified:** not pushed or merged; no real graphics card, no Firefox, no VR headset, High not run; shadows and the mirror were only seen through the software renderer; a quality change made while inside was not tried; the dancers' outfit is a recolour, not the reference outfit (needs new clothing models); the street got no new lamp (it is at ten of twelve lights); the rooms are still boxes built in code, so it is still short of the AAA direction (next step: a Blender-built kit for walls, doors and trims).

### 16 Nov 2026 (evening): MILKED HAS ITS OWN INTERIOR BEHIND A LOADING CARD (build `2026-11-16-milked-3`, branch `claude/milked-aaa`, one local commit, NOT pushed, no PR)

The owner's request with two reference sheets: "Since Milked is going to have a security vestibule it can have a loading screen that functions like the one at The Darknet District with Milked styling and be more detail inside. Make it AAA standard". Full record: [`MILKED.md`](MILKED.md). Pictures: `docs/development/milked/` (Medium, brightened copies).

- **The transition was built, not the fallback.** The inside of Milked is its own environment (place key `milked`, built by `void-runner/milked-build.js` `build()`), reached through the **front security vestibule** or the **rear lobby**, in both directions, exactly as the District's vestibule works: walk to the middle, every door closes, the door sensors confirm, the loading card covers the view, the other environment loads, the far door opens. The card is Milked's own (pink logo with the white droplets, a green line, four real steps). Controller: `void-runner/milked-transition.js` (`VoidMilkedGate`).
- **Saves:** the interior is not a save location and writes nothing. A game saved inside resumes outside (every login wakes in the Sleeping Pod anyway). No new save field, id or flag.
- **Kept working:** the V1 Map, the music zone, the camera's place label and multiplayer presence, because the interior keeps NeoChinatown's id and coordinates (`area: 'milked'`). No cab can be called indoors.
- **Detail:** the shopfront, vestibule, reception, hallway, four studios, Fish's office, staff corridor, rear corridor and rear lobby were rebuilt after the references with the repository's texture sets, signage (with simple Chinese lines), ceiling services, photo walls and posters.
- **Meshy props:** ten models in `void-runner/assets/models/milked/` (camera on tripod, ring light, softbox, office chair, bamboo, pothos, lucky cat, shark plush, laundry cart, flight case), **440 credits** (all of the budget). Batch on the owner's PC: `Documents\DarknetDistrict_Assets\Meshy\milked_props\`. Low quality uses stand-ins built in code.
- **Checked:** `npm test` 987 of 988 (the known local-only companion-preview failure); `tests/milked-browser.cjs low` passes with no page errors, walking the whole route in small steps both ways through both checkpoints and watching the door rules on every frame; looked at on Low and Medium.
- **Not done / not verified:** not pushed or merged; wording and dialogue provisional; software renderer only (no real GPU, Firefox, VR or High); multiplayer not tried with two players; the full walk-through was not completed on Medium (the photo tour was); Eva still stands and is still the placeholder figure; it is richer but still not at the art direction's AAA standard (textured, not PBR; no shadows or reflections inside). `MILKED.md` lists every difference from the references.
- **Found on the way, not fixed at the source:** `character-assembler.js` `ensureLook` remembers a download dropped by a scene change as done, so a figure can fail to appear after re-entering a place. Milked's interior loads its own six figures to avoid it.

### 16 Nov 2026 (early morning): MILKED REDESIGNED AND MOVED (build `2026-11-16-milked-1`, branch `claude/milked-redesign`, one local commit, NOT pushed, no PR)

Phase 2 of the owner's brief "NeoChinatown Rework, Milked Redesign & V1 Taxi Integration". Full record: [`MILKED.md`](MILKED.md). Pictures: `docs/development/milked/` (seven, Medium quality, brightened).

- **What it is now:** a small adult livestreaming production studio. Members watch from home; nothing is collected and no procedure happens in the building. Everyone is an adult and clothed.
- **Where:** footprint `[78, 98, -90, -74]` (20 m by 16 m) in the block east of Main Street; a new dead-end side street `streets.milkedLane` `[71, 101, -74, -68.5]` in front and a service alley `streets.milkedAlley` `[71, 98.5, -93.5, -90]` behind, both opening onto Main Street. Sky-cab stop on Main Street at `(61, -82)`. The old plaza and footprint at the east end of the avenue are gone; `avenueEast` now ends in city blocks.
- **Inside:** its own pink and green double-door vestibule, reception (Eva), a narrow hallway with windows onto four studios (one clothed dancer each, fixed cameras on stands, ON AIR signs, four different sets), Fish's office (monitor wall, remote camera desk), two dressing rooms, two restrooms, a rear door to the alley.
- **Removed:** the biobank, consultation room, laboratory, cryogenic storage, kiosks, operations room, plaza and all the wording. A test fails if clinical words return.
- **Checked:** `npm test` 976 of 977 (the known local-only companion-preview failure); `tests/milked-browser.cjs low` passes with no page errors; looked at on Low and Medium.
- **Not done:** not pushed or merged; dialogue and voices still provisional; no real GPU, Firefox, VR or multiplayer check; no sky-cab flight flown to the new stop; no separate road-taxi stop. The NeoChinatown rework (phase 1) and the taxi in the V1 Map (phase 3) are separate work.
- Cloud-container note: the repository's own Playwright cannot find its browser; run browser tests with `CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`.
### 16 Nov 2026: ActorCore library PUBLISHED and first used by the companions (build `2026-11-16-actorcore-1`)

The owner: "Publish with the existing protection." The library is in the private asset repository; see `docs/development/ACTORCORE_ANIMATIONS.md` (status, what uses it, the owner's idea for the group clips). Companions offer Dance for me / Strike a pose / Relax on the floor when their figure has the clips. Fish (Milked's owner) is getting her own model from photos of a real person who, the owner says, gave permission: concept in progress on the owner's PC (`...\Meshy\fish`), she asked for an anime style, sexier and more cyberpunk; clothed and non-explicit; do not commit the concept or her photos to this public repository before the owner approves.

### 16 Nov 2026: Kai has his own model (build `2026-11-16-kai-1`)

The owner approved the concept and then the in-room picture ("push Kai"). `npc-kai.glb` (Meshy: concept, image-to-3d, remesh, rig; 49 credits) replaces the MakeHuman stand-in for the companion Kai. His clips are the old figure's (`vr-companion-m.glb`), retargeted (`cm-*` entries in `tools/animation-pipeline/clips.json`, spec `characters/npc-kai.json`). No fingers, no blink or smile shapes on this rig. The cyan trim on his jacket came out white. Source files: `C:\Users\smart\Documents\DarknetDistrict_Assets\Meshy\companions\kai\`.

### 16 Nov 2026 (after midnight): TWO BIG BRIEFS RECEIVED; what is done and what is next (build `2026-11-16-companions-2`)

The owner sent (1) "ActorCore Motion Capture Integration" and (2) "NeoChinatown Rework, Milked Redesign & V1 Taxi Integration" (three phases, in order). Both are large. State:

- **ActorCore:** inventory, licence position, retarget tool and the shared library module exist; see `docs/development/ACTORCORE_ANIMATIONS.md`. **The licensed clips are NOT published; the owner must answer the licence question there first.** Nothing uses the clips yet.
- **NeoChinatown rework, Milked redesign, taxi in the V1 Map: NOT STARTED.** Do them in that order. Milked's new concept (from the brief): a small adult livestreaming studio on a quiet side street with a service alley; pink and green branding, logo MILKED plus white droplets; its own double-door vestibule; reception with Eva; a hallway with windows onto small studios, exactly one clothed adult dancer each, ON AIR lights; Fish's office, dressing rooms, restrooms and a rear door; remove every medical, biobank, laboratory and collection feature, the plaza and the big footprint; no bar or dance floor; do not activate or rewrite the Milked mission. All performers adults, clothed, non-explicit.
- **Companions:** the material and face-light pass is approved by the owner and shipped. **Seren is removed** at the owner's request (he will supply a better model); anything that asks for `seren` gets Nadia (`vr-companions.js` `legacy`). Kai: the owner wants his clothing sexier and somewhat cyberpunk or flashy without adding much; a new concept was generated on the owner's PC (`...\Meshy\companions\kai\concept`), not yet shown to him or built. An earlier Kai model (plain outfit) was built and rigged there but is superseded. The owner asked for a naked option earlier; Claude declined, do not add it.
- The owner also asked: ElevenLabs voices for companions and a better companion interaction UI. Not started.
- Local-only test failure: `tests/vr-companion-models.test.cjs` fails here with "ava: preview missing" because the licensed models were copied in for pictures without their preview images. It passes in CI.
- Meshy credits: about 235 left this month (estimate).

### 16 Nov 2026 (night): companion room upgrade (build `2026-11-16-suite-room-1`); companions wait for approval

- Room: five Meshy props, lighting, balcony furniture, airship and searchlights. See the last section of `docs/development/VR_SESSIONS.md`.
- The owner asked for a naked option for VR companions. Claude declined (no nude or sexually explicit character content). Do not add it.
- **Companion graphics: the owner must approve before anything is pushed.** Nothing has been made yet. Some companion models are licensed "No AI" (see `docs/VOID_RUNNER_ASSET_LICENSES.md`): those files must not go through Meshy or any AI tool, so improvements to them are limited to materials, lighting and code.
- Meshy: about 440 credits left this month.

### 16 Nov 2026 (later): VR upgrade (build `2026-11-16-vr-upgrade-1`) and AN OPEN DECISION ON BRIGHTNESS

- Read the last section of `docs/development/VR_SESSIONS.md`. In short: VR music (5 recordings), WoW-style fishing with saved counters, better beach water, and full brightness inside simulations.
- **OPEN DECISION for the owner (do not change without him):** on Medium and High the whole game outside VR is drawn at 0.3 of its lit brightness because of `sharpen.colorAmount = .3` in `babylon-renderer.js` (since 12 Nov); Low is unaffected and so is much brighter. Details and options are in VR_SESSIONS.md.
- ElevenLabs: 18,569 of 40,000 credits used this period after the VR music.

### 16 Nov 2026: one music for the District, Admin/Iris model retry, the "Return to Ship" dead end (build `2026-11-16-entry-fix-1`)

- **Music:** the hallway recording now plays in every District room at the hallway's level; only the arcade keeps its own (`music-score.js` `files` and style gains). The rooms are still separate areas for ambience, footsteps and the door lock. The bar, store, entry and VR recordings stay on disk, unused.
- **Admin and Iris showed their old looks for the owner.** The live site does serve and use the new models (checked with a browser against the live site). The cause found: if the first download of a model was dropped by a change of scene, it was remembered as done and the creator look stood in for the rest of the visit. `character-assembler.js` `ensureLook` now fails properly, and `neochinatown.js` `staff` keeps trying and swaps the real model in when it arrives. NOT CONFIRMED that this is what the owner hit; ask him to look again after a reload.
- **Friend sent to "Return to Ship" on entering the campaign.** That page is shown only when entering a place fails. The limits for building a scene (10 s) and loading its assets (15 s) were too short for a slower computer (`preparation.js`); they are now 60 s. The failure page now offers TRY AGAIN and MAIN MENU, and RETURN TO SHIP only to a player who has a ship. Skirmish then Main Menu then Campaign was run in a browser and worked; the slow-computer cause is a deduction, not something reproduced on her machine.
- Also: leaving to the main menu from inside a pod no longer leaves the pod's strip over the menu.
- Seen and NOT fixed: the FPS skirmish logs "[SKIRMISH] Campaign state changed during isolated match" when it ends. Nothing is saved from it, but something touches the campaign state during a skirmish; worth a look.

### 15 Nov 2026 (late night): District life, photos and Gallery, News filters, dispensary vending (build `2026-11-16-district-life-1`)

The owner's six requests of this evening, all done in one change:
- **Character creator:** extras (hat, eyewear, mask) start OFF for a new character, a new body or a new outfit (`character-creator.js` `plain`).
- **Dax glided:** her walk clip was exported as `walk.001`; `crowd.js` now finds it. Not re-checked in a browser here because her licensed model is not on this machine: CHECK ON THE LIVE SITE.
- **Camera:** left mouse button takes a photo; Gallery (1% of storage each, delete, post to News); residents' pictures in News; News filters. See the end of `docs/development/V1_DEVICE.md`. Other players cannot see a player's posts yet (needs server storage and moderation: the owner's decision).
- **Residents do things:** `docs/development/DISTRICT_LIFE.md`.
- **VR glass glare and hallway haze:** the booth glass no longer shines or glows; the white haze under each hallway lamp is a third of what it was and the lamp panels are dimmer (`neochinatown.js`). Checked at medium quality: the view down the hallway is clear.
- **Vending:** the middle hallway machine is DISPENSARY (a drawn front of tubs and pouches of flower on dispenser feet, laid over the machine's glass); every pod machine has a fifth row, E1 to E5, of the same goods, and its two jars are now tubs. The product names in row E are Claude's placeholders. On the live site the hallway machines are the licensed model: CHECK that the dispensary front sits right on it.
- PR #318 (pod wall controls) is merged and live. The owner asked for a pause in pushing during this work, then lifted it.

### 15 Nov 2026 (night): Sleeping Pod wall controls and EXIT THE POD sign (build `2026-11-16-pod-controls-1`)

- PR #317 (seven named residents as Meshy models) is merged and live.
- The owner sent four pictures of his Tesana pod and asked: look around inside, music and light controls on the walls, an Exit the Pod sign that lights under the mouse, and no District music in the pod. Done as clickable wall screens plus a sign lettered on the hatch glass; details and what was checked are at the end of `docs/development/SLEEPING_PODS.md`. Pure rule: `VoidDistrictArea.podControl`; test `tests/pod-controls.test.cjs`.
- NOT done: making the pod interior LOOK like the Tesana pictures (pale moulded plastic walls, square window, 3D goods in the vending cabinet, a bigger light panel with eight colours and a brightness slider). That is the next sleeping-pod step of the modernization brief. The owner earlier (13 Nov) asked for dark pods in the hallway; the Tesana pictures are light inside under pink light, so ask or keep the outside dark and brighten only the inside.
- Meshy: about 660 credits left this month; none spent on the pods yet.

### 15 Nov 2026 (evening): THE GRAPHICS MODERNIZATION HAS BEGUN (the owner's brief: characters, then District interior, NeoChinatown, NULL, starter ship; NOT Milked, Corporate District or the temple)
**Read `docs/development/MESHY_CHARACTERS.md` first: it has the working recipe, the credit ledger and the rights note.** The owner's reference pictures are on his PC in `Documents/DarknetDistrict_Assets/ArtReferences/Darknet-District-Art-References/` (Admin, Iris, NPC, The Darknet District, NeoChinaTown, Kestrel, Mara, Vesper, Meridan Station, derelict station; also the temple, which is excluded).
- **Done and in build `2026-11-16-meshy-1`:** Admin and Iris are drawn from their own Meshy models (`npc-admin.glb`, `npc-iris.glb`, 46k triangles each, 4 MB) made from the owner's pictures, with the game's idle, talk, walk, look and shrug. The old creator look is the fallback. Seen in the browser in the store. **Not checked:** their profile pictures in the device, and the scanning-etiquette walk with the new models.
- **B key (the owner):** on foot, B raises and puts away the camera on every device (`device-camera.js`); in flight B is still target lock.
- **Dax's licence is confirmed** by the owner's screenshots: Royalty Free (no AI). Her model must never be given to Meshy or any AI tool.
- **Meshy credits:** 1,100 a month; 98 used (two characters at 49 each). Plan for the rest: the named District residents (about 11 x 49), then props for the interior (about 30 each).
- **Also done 15 Nov (build `2026-11-16-arcade-2`):** arcade cabinets show their own game's attract screens and posters, light guns on Corporate Zombies, clearer return buttons (`ARCADE.md`, last section); achievements on profiles with "Make Highest Score in [game]", three shown, VIEW ALL and an order menu, residents' achievements, Dax's list (`ACHIEVEMENTS.md`). Players' own achievements still need the server-verified events that do not exist. Admin's and Iris's profile pictures were seen drawn from their new models; Dax's is still a silhouette.
- **Rebellion Edition tee (the owner, 15 Nov; build `2026-11-16-tee-1`):** about 1% of crowd NPCs outside NULL wear it (the owner first said 5%, then 1 in 100) (`street-gear.js` `tee`, `TEE_SHARE`): a black tee body and sleeves built on their measurements, the shirt's print (`void-runner/art/apparel/rebellion-tee-print.jpg`, cut from the store's product picture) on the chest. Seen in the browser on four residents with the share forced to 100%; it is a shell over their own top, not a tailored garment, and sits less well on the smallest bodies. Achievement difficulty shows as stars; Admin is Merchant and Mercenary. Inside NULL exactly one NPC always wears it (`CLUB_TEE`, the first dancer), and nobody else in the club does (the owner, 15 Nov); not yet looked at inside the club in a browser.
- **Seven named residents are new Meshy models (build `2026-11-16-residents-1`):** Rin, Jonah, Sable, Kei, Mags, Tavi, Bishop (`npc-*.glb`, `district-people.js` `own`). Seen in the browser in their places. Meshy credits: 441 used, about 660 left this month. Still to do among characters: Nyx, Cade, Lumi, DJ Vanta, the street crowd, players, companions, mission-givers (see `MESHY_CHARACTERS.md`, last sections).
- **Next, in the owner's order:** (1) the remaining characters: named residents, then player characters (hard: the creator swaps hair and outfits on the 22 MakeHuman bodies, so new player bodies need a design first), mission-givers (Mara, Kestrel have reference pictures). Residents use clips that come from the UAL library, which is not on the owner's PC: take them from shipped characters with `--crowd` (`clips.json` `walk-game` shows how). (2) Interior: sleeping pods, store weapons and displays, bar and oxygen lounge, VR area, then the rest.


### 15 Nov 2026 (afternoon): NPC street gear, Admin's and Iris's kits, the V3 eye, and Dax stage 1 (build `2026-11-16-dax-1`)
- **Street gear** (`void-runner/street-gear.js`, measurements `assets/models/gear/street-fit.json` from `tools/assets/gear/street_fit.py`): every crowd NPC gets its own mix of belt and pouches, chest harness, leg rigs, knee pads, a bracer with a lit screen and goggles, one accent colour each. Built in code from each body's measurements, skinned to its skeleton, one mesh and one shared material per person. Players are NOT dressed (they choose their own). **Honest state:** it fits and reads as kit, but it is blocky boxes on the same plain models and is far from the owner's reference pictures; only District residents were looked at in a browser, the street crowd was not. Real progress toward the references needs new character models.
- **Admin** (the owner's three pictures; he prefers him without eyewear): amber accent, amber yoke panels, a raised collar lit amber inside, chest rig with a radio, belt, never goggles. **His beard is not done** (needs a change to the skin texture). **Iris** (two pictures; an android who looks very human): closed dark collar on a pale ring, pale chest and back plates, a black device over each ear, small amber lights; no belts or pouches. The lights under her eyes are not done.
- **V3 // Shadow eye** (the owner): while someone uses a V3 their left eye glows slightly in the V3's green (#46ff7a). `street-gear.js` `eye()`, a new hub message `eye` (`tools/district-hub/protocol.cjs`, `hub-server.cjs`), sent by `remote-players.js` when the owner's V3 is open or its camera is on. **The hub must be redeployed for other players to see it** (see below). A player cannot see their own eye (first person).
- **Dax, stage 1:** read `docs/development/DAX.md`. Her converted model is in the private repository (`npc-dax.vrpak`); `void-runner/dax.js` gives her a clock-driven life in the District interior and a profile. Talking, memory, the street, posts, outfits and the editor are NOT done and each needs the owner. **Her CGTrader licence line has not been read** (`VOID_RUNNER_ASSET_LICENSES.md`, "Dax"): the owner to confirm.
- **How Blender was used:** as separate background Blender processes started through the bridge (`subprocess` from `bl_execute`), never in the owner's open scene. Files came back to the cloud as base64 in tool results (large results are saved to a file, which can then be decoded). This also works for renders.
- **Meshy** (checked 15 Nov, no credits spent): the Meshy CLI 0.8.6 on the owner's PC is signed in (100 credits; a text-to-model run estimates 30). It can be run through the bridge and the result imported with no clicks. Not yet tried for real; the free plan may refuse generation.


### 15 Nov 2026 (morning): the area soundtrack and environmental sound (build `2026-11-16-soundtrack-1`); NOBODY HAS LISTENED TO IT YET
**Read `docs/development/AREA_SOUNDTRACK.md` first.** The owner asked for the code-generated music to be replaced by ElevenLabs recordings, one 60-second loop per existing area, plus environmental sound.
- **14 recorded loops** in `void-runner/assets/audio/score/` (menu, NeoChinatown streets, alley, vestibule, District hall, store, bar, VR area, arcade, NULL, Milked, Corporate District, temple, flight). `music-score.js` `files` maps area to file; the generated score is now only the fallback and the music of the older-campaign stations, warp and hazards.
- **New areas for the music director:** alley, Milked, Corporate District, temple, VR play area, bar (the bar used to be a "speaker" heard from the hall; it is a room now). The old `district-arcade` zone pointed at the VR area; it now points at the cabinets.
- **Environmental sound** in `void-runner/area-ambience.js` (new, loaded after `music-integration.js`): beds per area, six placed emitters, a lock clunk in the vestibule, recorded footsteps for wet / metal / concrete floors (also used by `footsteps.js`). Files in `void-runner/assets/audio/ambience/`.
- **Rules kept:** nothing plays in a sleeping pod, in VR or over the player's own pod playlist; the 27 Riffusion songs were not touched; music ducks 30% while anyone talks on voice chat; Music / Effects / Ambient / Voice sliders already existed and the new sound sits on those channels.
- **No "black market" area exists**, so no track was made for it and no location was created.
- **ElevenLabs credits:** 13,210 used for this (12,600 music + 610 effects; the owner's cap was 15,000). Account now at about 14,070 of 40,000 for the month. The estimate tool quotes 1,500 for a 60-second track but the real charge is 900. One take each; nothing was regenerated.
- **Open for the owner:** listen and say which tracks to redo (900 credits each); whether the older-campaign places should get recordings too (about 12 more tracks, over the cap, so it needs his yes); confirm the Starter plan's commercial terms for music and sound effects (recorded in the two `LICENSES.md` files).
- **Not verified:** how any of it sounds (no speakers in the cloud). Checked in a real browser: each District room resolves to its track and ambience, files load, the pod is silent. The street, alley, club, Milked, Corporate and temple mappings are covered by unit tests only.


### 15 Nov 2026 (after midnight): voice stage 1 is LIVE and UNTESTED WITH REAL AUDIO; open audio work in order
**Live (build `2026-11-16-voice-1`; hub redeployed, its log says "voice on", so the owner's three LiveKit variables are set and well-formed):**
- **Comms app + proximity voice** (PR #308; `HUB_DEPLOYMENT.md` last section, `void-runner/district-voice.js`). Nobody has yet confirmed sound passing between two sessions: the cloud session cannot reach LiveKit. First thing to do next: have the owner test with two accounts, then fix what he finds.
- **Multiplayer everywhere** is deployed on the hub (the first deploy hung at cloning for 26 minutes and was replaced by a second, which went live in 90 seconds).
- **Footsteps by ear, distance in player lists, Admin's line in an older ElevenLabs voice** (PR #307).

**The owner's audio requests still open, in his order:**
1. **Finish LiveKit voice:** private calls from profiles, incoming-call accept/decline, private group calls, voice in shared VR sessions (the separate voice room already follows the hub room; the VR menus need checking), device-styled ringing and connect/disconnect sounds (ElevenLabs sound effects, a few credits each), reports that can reference voice, participant-minute awareness and a graceful quota message, speaking indicators in the world.
2. **Admin voice transformation** (developers only, server-authorised): ElevenLabs speech-to-speech into Admin's voice id, routed through LiveKit; never send the natural microphone while it is on; on failure mute and tell him; push-to-talk first; usage limits; a developer section in Comms (Admin Voice / Natural Microphone / Microphone Disabled, preview, status, estimated credits); lip movement; designed so Iris and Dax can follow. **Needs an ElevenLabs API key stored on the backend** (ask the owner for it through the secure credential form, never in chat) and uses his credits continuously while he talks. Admin's ElevenLabs voice id in use: `V2bPluzT7MuirpucVAKH` (Bill Adams; the owner asked for an older Admin).
3. **A dark cyberpunk soundtrack for every area, replacing the old music, plus sound effects.** Today's area music is made by `music-engine.js` in code (styles per place in `music-director.js`); the 27 Riffusion songs are the Sleeping Pod playlist and are a separate thing. A 30-second District sample is in `tools/audio/elevenlabs-test/10-district-score-sample.mp3` (not committed) and was sent to the owner. **Do not generate the rest until he approves the sample and a budget:** music costs 15 credits a second (a 60-second loop is 900), the plan gives 40,000 a month, about 860 are used, and voice transformation will draw on the same pool. About 14 area styles exist.


### 15 Nov 2026 (late night): multiplayer everywhere, voiced lines, play as Admin are LIVE; Dax model located and inspected
**Live (build `2026-11-16-everywhere-1`):**
- **Multiplayer everywhere** (PR #305; hub redeployed from deploy branch `claude/character-creator`): one hub room per place (`HUB_DEPLOYMENT.md`, last section). Not checked with two real browsers. No hosting plan was changed (the owner said not to).
- **ElevenLabs** is connected to Claude (Starter plan, 40,000 credits a month; about 300 used). The two scanning-rule lines for Admin and Iris are voiced and stored in `void-runner/assets/audio/voice/extra/` (PR #304; `LICENSES.md` there). Test samples (door, V1 chime, rain loop, two greetings) are in `tools/audio/elevenlabs-test/`, which is deliberately NOT committed. Sound effects and looping ambience work; music is priced at about 1,500 credits for 30 s and was not generated; custom voice design needs a 100-character line from the owner and was not run. Downloads need `elevenlabsusercontent.com` (added to the environment's allowed hosts with the owner's approval).
- **Play as Admin** (PR #303): developers only, a test session, nothing saved (`V1_DEVICE.md`). The owner's developer account is smartsec916@gmail.com; the button appears only if that account's id is in `VOID_ADMIN_UIDS` on the game API.
- **V3 // SHADOW**: profile pictures stay in colour (the owner).

**Dax (Tier 3 NPC): where it stands**
- The owner gave permission (15 Nov) to open the black-outfit model in Blender, prepare it and integrate it through the private licensed-assets repository.
- The purchase is extracted on his PC at `C:\Users\smart\Documents\DarknetDistrict_Assets\Dax\source` (`Blend/cyberpunk-girl.blend`, 78 MB, and `Textures/`). Nothing else on his PC was changed; his open Blender scene was not touched (the file was only listed with `bpy.data.libraries.load`).
- Contents: a Rigify rig (`rig`, `metarig`, widget collection `WGTS_rig`), collection `Cyberbunk-Girl`, **no animations**, materials `Sci-fi - Body` (the BLACK outfit, textures `Sci-fi-Bod_89F362_*`), `Armor Torso`, `Head`, `Eyes`, `Eyes_Moisture`, `Mouth`, `Eyelashes`, `Eyebrows`; a white outfit variant exists only as textures (`Textures/Sci-fi_white/`). 2K to 4K PNG textures.
- **Next steps, in order:** (1) in a NEW Blender scene (do not overwrite the owner's open file) append the `Cyberbunk-Girl` collection and the rig, measure triangles and bones; (2) follow the purchased-companion pipeline (`tools/animation-pipeline/`, the `vr-companion-*.json` specs and prepare scripts) to bind her to the game's 52-joint `mixamorig:` skeleton and bake the standard clips; (3) reduce textures (1K to 2K, JPEG where no alpha) and export one GLB; (4) record the CGTrader licence terms in `VOID_RUNNER_ASSET_LICENSES.md` (check for a No-AI clause before any AI processing; Meshy must NOT be given this model if the licence forbids it); (5) get the file from his PC into `Smartsec916/void-runner-licensed-assets` (the cloud session cannot read his disk: either he shares the folder through Remote Control, or he uploads the exported file to the private repository himself); (6) register her in `crowd.js` clips and `district-people.js` (jobs Bounty Hunter and Mercenary; device V3 // SHADOW), then the Tier 3 behaviour.
- **Meshy:** the Meshy skills are now installed in this session (`meshy-3d-agent:*`); Blender has no Meshy add-on. No credits were spent. The owner wants connectivity verified before any spend.


### 15 Nov 2026 (end of session): what is live, and the owner's open requests IN ORDER
**Live (build `2026-11-16-warflying-1`):** handle accounts (API and hub redeployed on Render with the owner's go-ahead; the hub deploys from branch `claude/character-creator`, which is kept as "same hub files as main"), camera aim-and-follow (F), FOLLOWING in Social, one look record per character, games page card "The Darknet District - Game", `site-return.js` on every game, EXIT GAME in the arcade, WarFlying as an installable app (15%), mission flow chart, character surface pass.

**Already existed, tell the owner where:** calling a street taxi from the V1 Map app (STREET TAXIS list, only on the NeoChinatown street): the cab drives to you, opens its door, takes you to the chosen stop (`ROAD_TAXIS.md`).

**Not started (the owner asked 15 Nov), in the order to do them:**
1. **Dax, Tier 3 AI NPC** (his full brief is in the session transcript; key facts below). Blocked on the model reaching the build: the purchased CGTrader model ("Realistic Cyberpunk Girl, fully rigged, game ready"; use the BLACK outfit) is in `C:\Users\smart\Downloads\New Downloads` (FBX, OBJ, Textures, Blend zips) on the owner's PC. The cloud session cannot read that folder (no Remote Control folder was shared, and Blender did not answer the bridge at the time). It must go through the private licensed-assets repository and the `.vrpak` pipeline (`VOID_RUNNER_ASSET_LICENSES.md`), never into this public repo; record the licence terms there (check for a No-AI clause).
   - Only ONE Dax exists in the game. The VR-booth resident that Claude had named "Dax Moreno" is now "Cade Moreno".
   - Jobs: Bounty Hunter and Mercenary. Device: **V3 // Shadow** bought from Admin: faster than the V1, same UI drawn like an old monochrome green monitor, camera embedded in her eye, engaged with **B**; in flight B still acquires target lock.
   - Architecture asked for: reuse existing NPC, Studio, V1, social and Iris API systems; deterministic routine with a schedule and goals; AI calls only for complex conversation, validated against a fixed action list, with limits and a fallback; one authoritative Dax shared by all players (needs the hub); memory of players limited to game-related facts; Studio editor support. Build it so later Tier 3 NPCs reuse it.
2. **Devices V2 and V3 // Shadow** in `DEVICES` (`device-v1.js`): the camera, My V# app and zoom limits already follow the model.
3. **NPCs riding street taxis** sometimes (`road-taxi.js` traffic cabs, `ncz-nightlife.js` walkers).
4. **Tagging players and NPCs in Messages and Mission Logs; bounties on NPCs and players.** Needs hub and API support (shared, validated state), and moderation rules for anything aimed at a real player. Propose the design before building.
5. **More characters and upgrades made in Blender** (the owner: "just make more and upgrade current models using blender"). His Blender has MPFB but no clothing, hair or skin packs; the existing pipeline is `tools/animation-pipeline/` and `tools/assets/gear/`. Start by installing the CC0 MakeHuman asset packs in his Blender (ask first: it downloads files to his PC) or by modelling gear in code.
6. **Open questions:** remove the old WarFlying ship module from sale; chat for handle-only accounts; draft names, jobs and advert wording awaiting the owner's edits.


### 15 Nov 2026 (latest): V1 camera, residents, My V1, News feed, mission flow chart and a character surface pass are LIVE
- **V1 (PR #295, live):** residents listed with players, profiles and jobs (two dropdowns), MY V1 app, empty App Store, sponsored News feed (boxed posts), Camera viewfinder with name tags and wheel zoom. Details: `V1_DEVICE.md` (last three sections). Names, extra jobs and store advert sentences are drafts for the owner.
- **Developer Studio (PR #297, live):** mission flow chart in the Missions tab; choices and store-item unlocks are draft design fields the game does not act on yet. `DEVELOPER_STUDIO.md`.
- **Characters:** a surface quality pass only (`CHARACTER_MODEL_AUDIT.md`, last section). The real upgrade (new outfits, bodies, faces) still needs the owner's choice of route: modelled by code, purchased, or generated.
- **Waiting on the owner:** "deploy" for the two Render services so handle accounts work (hub is set to branch `claude/character-creator` on Render, not `main`).


### 15 Nov 2026: handle-only accounts may keep a character and join multiplayer (code merged; RENDER REDEPLOY NEEDED)
The owner: "Let the Save Server use Handles as well." A Firebase anonymous account that has claimed a District handle is now treated as a District account:
- **Game API** (`void_runner_api.py` `require_handle_if_guest`): character creation and saved looks are accepted when the identity registry (`bp_profiles`) holds a handle for that account; a guest with no handle is still refused (403).
- **Hub** (`tools/district-hub`): a handle account with a handle and a stored character is admitted and shown under its handle with its saved look. With neither it is told what is missing (4410/4411/4414) instead of 4407. Chat, reports and shared VR sessions still need a secured (email or Google) account: `features.chat` is false for handle accounts.
- **Client** (`account.js` `guestOnly`, `remote-players.js`, `character-creator.js`): a handle account can claim its handle, save its character and connect.
- **Not live until both Render services are redeployed from `main`** (game API and `district-hub`; the hub has `autoDeploy: false`). Until then the live hub still closes handle accounts with 4407 and the API still answers 403. Moderation note: a handle account can be removed with `HUB_DENY_UIDS`, but a new anonymous account is free to make, which is why chat stays for secured accounts.
### 15 Nov 2026 (later): name tags removed (live, PR #294); District residents and profile jobs WAIT FOR THE OWNER'S APPROVAL
- **Live:** no name floats over other players (`remote-players.js` `makeTag` draws nothing).
- **Built, not merged (the owner asked to approve all V1 work):** branch `claude/district-people`: the V1 lists named District residents beside players, profiles show jobs, players choose up to three jobs and one line about themselves, portraits are face on. Details: [`V1_DEVICE.md`](V1_DEVICE.md), last section. Names and the extra jobs are drafts for the owner.
- **Character models (the owner, 15 Nov):** he wants a big upgrade of NPC and player characters after two reference pictures (recorded in `VISUAL_REFERENCES.md`) and allows saved looks to be reset. Not started; see the note in `CHARACTER_MODEL_AUDIT.md` before choosing a route.


### UNDERGROUND//OVERDRIVE is the third playable arcade game (16 Nov 2026 build `2026-11-16-overdrive-1`)
The owner's Tesana fighting game is built into `underground-overdrive/`, takes the fifth arcade cabinet (was the COBALT STAIRS placeholder) and is on `games-list.html`. Details and how to rebuild: [`ARCADE.md`](ARCADE.md). Playable cabinet screens now flash PRESS E TO PLAY.

### OPEN DECISION for the owner: handle-only (anonymous) accounts cannot use multiplayer
The owner reported (15 Nov 2026) that a friend who joined with a handle only (a Firebase anonymous account) was invisible to him, while his own second Google account was visible. This is the designed rule, not a fault, and it is enforced in three places: the client (`remote-players.js` shows "Multiplayer and chat need a registered account" and never connects), the hub (`hub-server.cjs` closes with 4407; live setting `HUB_ACCESS=registered`), and the game API (`void_runner_api.py` refuses to store a permanent character for an anonymous account, and the hub requires a stored character and handle). Reason recorded in `MODERATION.md`: a throwaway account cannot be removed for good, so chat abuse and ban evasion have no cost. **Nothing was changed.** Letting handle-only accounts in needs changes to the client, the hub and the API, a redeploy of both Render services, and the owner's decision on the moderation trade-off (for example: visible but chat stays registered-only). The friend's present options: sign in with Google or an email link, which keeps the handle.


### Newest: THE THREE-LOCATION EXPANSION IS COMPLETE. Zen Zephyr Temple (location 3 of 3) is DEPLOYED (PR #283, `ca6eed7`, 16 Nov 2026)
Milked (#265), Corporate District (#275) and the Zen Zephyr Temple (#283) are all merged, deployed and live-verified in a real browser. Details: the dated section "16 Nov 2026: Zen Zephyr Temple" below and [`TEMPLE.md`](TEMPLE.md). Nothing in the expansion is left to build; what remains is polish and the owner's approvals (below). The District-interior modernization continues in another session. **Shared hot files:** `void-runner-sw.js` BUILD and `void_runner_admin_inventory.json` conflict on every merge while two sessions work; merge `main` in, take `main`'s inventory, run `node tools/admin-inventory.cjs`, set a fresh BUILD. A force-push to an existing branch can be denied in the cloud session: push a new branch instead.

### Corporate District (location 2 of 3) is DEPLOYED (PR #275, `83e8941`, 16 Nov 2026)
Built in the cloud session that continued the three-location expansion, in parallel with the District-standard work below (another session). **Next for the expansion: Zen Zephyr Temple**, reusing the transition and map work. Full details: the dated section "16 Nov 2026: Corporate District" lower down and [`CORPORATE.md`](CORPORATE.md). The District-interior modernization below continues separately; the two do not touch the same files except the shared hot files (`void-runner-sw.js` BUILD and `void_runner_admin_inventory.json`, which conflict on every merge: merge `main` in, take `main`'s inventory, run `node tools/admin-inventory.cjs`, set a fresh BUILD).

### Newest: hall wall session (after 15 Nov 2026) — AAA graphics modernization started
The owner authorised continuous graphics modernization with routine commits, merges and deployments (no per-step approval; never bypass checks). This entry is newer than the "Verified 15 Nov 2026" text below and wins where they differ.
- **Blender through Higgsfield works** (`BLENDER_HIGGSFIELD.md`): the fault was an account mismatch. Files cannot cross between the owner's PC and the cloud session, so pieces are written as code in `tools/assets/kit/build_kit.py` and built in the cloud with `bpy`.
- **Done in this session:** the 4 x 3 x 0.2 m hallway wall module and its services band are built, checked in a Babylon viewer (`tools/assets/kit/piece-viewer.html`) and placed in the main hallway (10 modules). Three shared wall-metal texture sets; wear in vertex colours. Details, the lighting finding and evidence: `DISTRICT_INTERIOR.md` (last section), `docs/development/hall-wall/`.
- **Interior lights:** materials take only the first 8 of the interior's 12 lights. The hallway lamps were last and lit nothing; they are now first in the list and light the whole corridor. Four lamps remain outside the first 8 (bar and shop second accents, pod room, `[38,4,68]`): the interior needs a per-room lighting plan.
- **The owner's direction during the session:** the hallway wall should look like a **shipping container** (dark navy corrugated steel, container frame, cold white and red practical lamps, wet floor: his reference picture) and be a little darker. The wall module was rebuilt that way; carry the same language into the remaining hallway pieces, floor and vestibule. He also asked for the **neon strip lighting to go**, replaced by lighting like the reference: done in the hallway (cold white ceiling panels, red door lamps); the vestibule and the rooms still have neon strips.
- **More direction from the owner in the same session** (reference pictures written out in `VISUAL_REFERENCES.md`, last section): coloured accent light along the hallway (done: red and amber pools on the wet floor); upgrade the Sleeping Pod room and pod interior (first pass done; he then asked for **darker pod panels with lighting**, done); vending machines should show jars and tubs of dried buds as well as snacks (pod vending face done; the VENDING room's machines not yet); an **oxygen bar** reference for the bar and five **store** references for the Admin and Iris shop, plus **a storage area with a mesh divider behind Admin and Iris** (the storage cage is built; the oxygen bar and the rest of the store are not). He also sent a **VR play area** reference (two glass booths, pink and cyan): not rebuilt yet. Later in the session: half the cage became a **repair bench** (done); the hallway got **more coloured light, drawn bounce light, light shafts and haze** (done; there is no ray tracing in this engine); the **floating name tags** over objects were removed (done); and he sent **vestibule door references** for both sides (not built yet: the next area).
- **Late corrections from the owner (read `DISTRICT_INTERIOR.md`, "Corrections after the owner played it"):** no indoor fog (it blacked out the VR Companion area); far fewer coloured lights in the hallway; the shop has the store's shirts as 3D hanging garments, the survival goods as cards in the far-wall cases, and a gun wall where the bookshelves were. The electronics page is not to be recreated. **Asked for and NOT started: the character creator and better-looking player characters (two reference pictures of cyberpunk street characters).**
- **The owner's newest queue (written out in `VISUAL_REFERENCES.md`, last section):** Admin and Iris looks; NPC and player model upgrade; V1 hologram polish and third-person projection (**he approves everything there before it goes live**); alley (done: four people, a permanent drunk, dressed after his reference); NeoChinatown streets; pod interior and free look at first wake-up.
- **Not done / not verified:** real-GPU look and frame rate; Firefox; multiplayer; the owner's reference archives (not readable from the cloud).
- **STANDING DIRECTION (the owner, end of the session): the hallway is the standard for everything inside The Darknet District.** Every room still on the older look is to be brought up to it. The standard and the list of rooms still to do are in `DISTRICT_INTERIOR.md`, section "THE HALLWAY IS THE STANDARD". This supersedes the order in the next bullet.
- **Next, in order:** (1) a per-room lighting plan for the interior (every room's lamps should reach its own surfaces; the pod room has none that work); (2) replace the remaining 2 m hallway modules, ceiling and floor with pieces in the new metals; (3) vestibule and entrance in the same language (keep the direction-aware loading: the room must look identical on both sides of the checkpoint); (4) shop, arcade, VR, pods; (5) NeoChinatown street with the building kit. Corporate District and the Temple (below) remain planned, behind this.


**Verified 15 Nov 2026** against GitHub, the repository and the live site (not copied from older notes). Where this section disagrees with the older dated sections below, this section wins. Those older sections stay as history.

### Verified repository and deployment state
- `main` = `8f9c2cb` ("Docs: permanent AAA dark-cyberpunk PC-only art direction, Milked handoff", PR [#266](https://github.com/Smartsec916/the-darknet-district-site/pull/266)). Before it: `3129a09` Milked ([#265](https://github.com/Smartsec916/the-darknet-district-site/pull/265)), `e0c59e6` handoff ([#264](https://github.com/Smartsec916/the-darknet-district-site/pull/264)), `cce7fef` beginner campaign + Developer Studio + crowd performance ([#263](https://github.com/Smartsec916/the-darknet-district-site/pull/263)), `8860ef6`, `d422f3d` V1 Phase 1-2 / KeyMap / Medium graphics ([#261](https://github.com/Smartsec916/the-darknet-district-site/pull/261)), `835982f` character gear ([#260](https://github.com/Smartsec916/the-darknet-district-site/pull/260)).
- **Live website:** the service worker reports BUILD `2026-11-15-milked-1+8f9c2cb9db` and the "Deploy site" and "Tests" workflows succeeded on `8f9c2cb`. The live game therefore contains everything above. This was a **website-only** series: the Game API, multiplayer hub, Firebase, Neon and Render were not changed by #263 to #266.
- Working tree clean, nothing unpushed that matters. Old local feature branches and worktrees in the cloud scratch folder are merged or throwaway and will not survive a new session; the truth is on GitHub.
- **Open pull requests** are all old (#176 to #208): [#208], [#207], [#199], [#198], [#197], [#196], [#195], [#191], [#190], [#189], [#188], [#187], [#185], [#182], [#181], [#179], [#176]. Do not merge, close or build on them; the owner has not decided (open question 11 below). Do not branch from them.
- **CI behaviour to know:** the suite passes on `main`. Intermittent failures seen on unchanged code, not yet fixed: (1) `tests/blackout-tesana-browser.cjs:171` ("original guest progress returns", once, passed on re-run); (2) the Python test `test_export_excludes_secrets_account_ids_and_player_data` fails at random: it asserts the substring `'999'` is absent from the export, but the export contains epoch timestamps and random hashes that can contain "999" (seen on two consecutive docs-only PRs, #266 in a timestamp and #267 in a hash; each passed or should pass on re-run). A fix task was suggested but is not done; the fix is to assert on a distinctive id, not a short digit string; (3) the sleeping-pod-exit smoke timeouts on 13-14 Nov were reported earlier as a runner issue. Investigate recurring failures; do not just re-run until green.

### What was being worked on when this handoff was written
The **three-location expansion** (Milked, then Corporate District, then Zen Zephyr Temple), plus a permanent art-direction update, plus an attempt to connect Blender through Higgsfield. Full scope: [`THREE_LOCATION_EXPANSION.md`](THREE_LOCATION_EXPANSION.md).

| Item | Status | Evidence / notes |
|---|---|---|
| **Milked** | **Completed and deployed.** Live-verified in a real browser. | PR #265, `3129a09`. `MILKED.md`, `milked.js`, `milked-integration.js`, `tests/milked.test.cjs` (12), `tests/milked-browser.cjs` (run locally and against the live site, no console errors), 18 screenshots in `docs/development/milked/`. Unit suite: 820 pass at the time. |
| Milked follow-ups | Planned, not started | Real-GPU, Firefox, multiplayer untested. Road taxis do not stop at Milked (street-taxi registry skips district zones). Eva and Fish voices are **provisional blends, unapproved, nothing generated**; dialogue is **provisional**; mission 3 (MEET EVA AT MILKED) is **inactive data** and needs the owner's approval to activate. Visuals predate the art direction (flat boxes, emissive signs): upgrade candidate. Lighting is dim. |
| **Corporate District** | **Completed and deployed; live-verified.** | PR #275, `83e8941`. `CORPORATE.md`, `sky-cab.js`, `area-map.js`, `corporate*.js`, `tests/corporate*.test.cjs`, `sky-cab.test.cjs`, `area-map.test.cjs`, `corporate-browser.cjs` (run locally and against the live site), screenshots in `docs/development/corporate/`. Follow-ups: real-GPU/Firefox/multiplayer untested; visuals are MeshBuilder (upgrade candidate); no interiors; placeholder names; return point is only the cab pad; reload inside Corporate resumes on the street. |
| **Zen Zephyr Temple** | **Completed and deployed; live-verified.** | PR #283, `ca6eed7`. `TEMPLE.md`, `temple*.js`, `zen-chat.js`, `tests/temple.test.cjs`, `zen-chat.test.cjs`, `temple-browser.cjs` (run locally and against the live site), screenshots in `docs/development/temple/`. Follow-ups: real-GPU/Firefox/multiplayer untested; the quotes beyond the two exact lines are provisional placeholders; monk is a primitive placeholder (one replacement point: `temple.js` `MODEL`); reload inside the Temple resumes on the street; Origins puts the Sanctum elsewhere (not decided canon). |
| **Permanent art direction** | **Documented and merged; no graphics rebuild started** | PR #266; `../VOID_RUNNER_ART_DIRECTION.md`. AAA is a goal, not a current claim. |
| **Blender / Higgsfield MCP** | **BLOCKED, not functional** | `BLENDER_HIGGSFIELD.md`. Cloud session reports `get_host_status` all false; Blender never inspected; the hallway-wall asset is **not started and not exported**. |
| Beginner campaign (six missions, starter ship, Meridian flight) | Completed and deployed; **dialogue is PROVISIONAL, not canon** | `BEGINNER_CAMPAIGN.md`. Only the first trip to Meridian was played end to end; return travel and other destinations untested. |
| Developer Studio foundation | Deployed, partial | `DEVELOPER_STUDIO.md`: Missions and Dialogue tabs work with local drafts; NPCs and Locations read-only; other tabs planned; **publishing disabled**; Asset Library not built. |
| V1 Phases 1-2 (teal V1, Messages, KeyMap), Medium graphics default | Deployed | Two-player chat through the real hub, Firefox and ROG Ally/real-GPU numbers **not verified**. |
| Character gear (visor, collar, shoulders, chest) | Merged (#260) | Whether the API and hub were redeployed for the gear catalog was **not re-checked** in this session; check Render's deploy list (read-only) before claiming it works for other players. The four outfits (#258) were deployed on 13 Nov. |
| Performance work | Partial | One small measured optimisation (crowd animation throttle). Cloud numbers are software-rendered. `PERFORMANCE_2026-11.md`, `GRAPHICS_TEST_ROG_ALLY.md`. |

### Other unfinished work with evidence in this repository
(Do not reopen finished items. Statuses are from the dated sections below and have **not** all been re-verified.) Open questions 1-12 under "Open questions for the owner" below are still the list of the owner decisions (companion top-10, part-assembler plan, Yuki and Dex looks, noodle stand, voices, forest sky patch, age policy, Tesana per-asset confirmations, old PRs, bigger visuals). Queued by the owner on 12 Nov and listed there as large: Blackout Protocol level 3 NPC changes, levels 4+ graphics, leaderboard and profile achievements. Multiplayer: the hub, shared VR sessions and presence are live per the 12 Nov entries; **two-account verification is still the owner's test.** Phase H graphics (shadows, Ultra, ambient occlusion, a better HDRI) needs the owner's OK for an HDRI download. The District interior rebuild is in progress ([`DISTRICT_INTERIOR.md`](DISTRICT_INTERIOR.md)); under the art direction, the remaining Tron-like rooms are upgrade candidates, not finished.

### What is blocked
Blender work (connection above). Anything needing the owner: story and canon approvals (mission dialogue, Milked dialogue and mission 3, Corporate and Temple story decisions), voice casting, the open questions, closing old PRs.

### What should happen next (in order)
1. **Corporate District: DONE** (PR #275).
2. **Zen Zephyr Temple: DONE** (PR #283).
3. In parallel, only when a **fresh** Claude session reports `blr: true`: the Blender read-only inspection, then the modular hallway wall test.
4. Small follow-ups when convenient: Milked road-taxi stop; real-GPU, Firefox and multiplayer checks of all three locations; the owner's approvals (below); upgrading the three locations' visuals to the Blender/PBR standard (`VOID_RUNNER_ART_DIRECTION.md`). The flaky `'999'` Python test is **fixed** (PR #283).

### Open these files first
`docs/development/AI_HANDOFF.md` (this section), `THREE_LOCATION_EXPANSION.md`, `../VOID_RUNNER_ART_DIRECTION.md`, `BLENDER_HIGGSFIELD.md`, `MILKED.md`, then `CLAUDE.md`. For Corporate: `void-runner/neochinatown.js` (`districts`, `taxiZones`, `streamDistricts`), `city-taxi.js`, `taxi-rules.js`, `road-taxi-rules.js`, `district-transition.js`, `district-area.js`, `district-map.js`, `milked.js` (a worked example of a streamed building with data, collision, interactions, map places and tests).

### Tests to run before any PR
- `npm ci` then `npm test` (820 pass on `main`). `python3 -m unittest tests.test_story_save tests.test_progression_save`. The full Python API suite needs `pip install -r requirements-void-runner.txt` (CI runs it).
- Browser tests: `node tests/serve-modern.cjs`, then e.g. `node tests/milked-browser.cjs low`, `district-map-browser.cjs`, `road-taxi-browser.cjs`, `beginner-browser.cjs`. **In the cloud container**, `npm ci` installs a Playwright whose browser build is missing: set `CHROMIUM_PATH=/opt/pw-browsers/chromium` (`tests/milked-browser.cjs` honours it) or preload a small script that passes `executablePath:'/opt/pw-browsers/chromium'` to `chromium.launch`. Software rendering is slow: shorten long flights in tests (see how `milked-browser.cjs` moves the cab). Always look at screenshots of visual work.
- CI also runs the Babylon stabilization smoke (`tests/stabilization-browser.cjs`, `tests/blackout-tesana-browser.cjs`).
- After changing game files: bump `BUILD` in `void-runner-sw.js`, keep `static/void-runner.html` identical, run `node tools/admin-inventory.cjs` (the inventory test fails otherwise), and update `save-manifest.json` if you add a location or mission id.

### What must not be changed (without the owner)
Sleeping Pod room, bedroom music player, VR play-area layout, licensed companion assets and the private asset pipeline, approved NPC voices and the reserved voice slot, the landing-pad area (x 13 to 37.5, z -106 to -86), internal location ids, the device gate (phones stay off the 3D game; the website stays mobile-friendly), the website chatbot (Iris) separation, the live Game API, hub, Firebase, Neon and Render. Do not activate mission 3 or any story content, and do not mark story content canon. Merge only when the owner says "push"/"pull it", except where he has pre-authorised a release (he did for the three-location PRs once checks pass).

## PERMANENT ART DIRECTION (set 15 Nov 2026): AAA dark cyberpunk, PC only

Applies to every future graphics task. Full text: [`../VOID_RUNNER_ART_DIRECTION.md`](../VOID_RUNNER_ART_DIRECTION.md) ("PERMANENT DIRECTION"). In short: the 3D game is PC-only; the target is a dark, detailed, cinematic cyberpunk world (Blade Runner 2049, Altered Carbon, The Expanse as references, no copying); phase out Tron-style grids, neon outlines on everything, clean flat materials, empty rooms and bright uniform lighting; new work needs layered believable architecture, PBR materials with wear, controlled dark lighting with practical light sources and accent neon, and visible human habitation. Keep budgets, instancing, LOD and streaming sensible; do not break gameplay. Blender assets use metric scale, modular parts, PBR, clean names, correct transforms and Babylon-compatible GLB, and must be fitted to the game's real coordinates. Existing assets are upgraded progressively, player-visible areas first; nothing is deleted indiscriminately. Only the 3D game is PC-only: the website, store and accounts keep mobile support. This is a documentation decision: **no game-wide graphics rebuild has started**, and AAA quality is a goal, not a current claim. Older graphics notes in this file and in `VOID_RUNNER_GRAPHICS_ROADMAP.md` are superseded where they conflict.

## 16 Nov 2026: Zen Zephyr Temple (location 3 of 3) is DEPLOYED: PR #283, squash commit `ca6eed7`

Design and details: [`TEMPLE.md`](TEMPLE.md). Screenshots: `docs/development/temple/`.
- **What:** a separate, taxi-only hilltop reached by the **same reusable 3D sky-cab transition** (flat 60 CR, return included; `sky-cab.js` got a `temple` row). A hilltop with the city far below, a courtyard with blue-flame incense, a chamber with layered printed walls, eight tall server pillars, hanging cables, mist, four glowing data altars, a dais under an oculus, a long window onto the skyline, and a seated placeholder monk. A typed **local conversation** (22 quotes including the two exact lines; topic matching; fallback; selectable teachings; labelled "LOCAL RECITATION · NOT AN AI"; no network; an inactive provider hook for a future API). A V1 map space with saved fog.
- **New files:** `void-runner/temple.js`, `temple-build.js`, `temple-integration.js`, `zen-chat.js`; tests `temple`, `zen-chat` (unit), `temple-browser.cjs`; `docs/development/TEMPLE.md`; screenshots. Hooks: `sky-cab.js`, `taxi-rules.js`, `city-taxi.js`, `babylon-renderer.js`, `district-map.js`, `personal-device.js` (map spaces now read `walkingLocation.mapSpace`), `corporate.js` (adds `mapSpace`).
- **Ids and saves:** walking location `temple` (no new location or mission id, no server change); `story.flags.templeFog` (about 68 characters), plus the shared `skyCabTrip` and `cabReturn`. Reload inside the Temple resumes on the street.
- **Replacement points:** Zen Zephyr's model: `temple.js` `MODEL` (`asset: null`); his lines: `zen-chat.js` `QUOTES`; a future API dialogue: `VoidTemple.chat.registerProvider(...)` then `enableProvider(true)` (off by default). No voice was cast or invented.
- **Verified:** `npm test` 885 pass; CI green; real-browser walkthrough `tests/temple-browser.cjs` locally and **against the live site** (build `2026-11-16-temple-2315+ca6eed73ef`): fare charged once, the cab room, arrival on the hill (NeoChinatown not loaded), courtyard, chamber, typing into the panel (typing moves nothing, the exact lines come back for "serenity" and "mind", fallback, a chosen teaching, Escape closes without opening the pause menu), the map with fog, return exactly where boarded, failed-load recovery with refund, fog kept after a reload; at most 2 real lights. The Corporate walkthrough was re-run against the live site afterwards and still passes (shared code changed).
- **CI:** the Python drafts-export test that failed at random (it asserted the text '999' is absent, but exports hold timestamps and hashes) is **fixed** with a unique marker (`tests/test_content_drafts_reliability.py`).
- **Corporate fog note:** the one live run with 98 against 102 explored cells was not reproduced in nine later runs (local and live, all exact). Cause unidentified; diagnostics stay in `tests/corporate-browser.cjs`.
- **Not verified / known:** real-GPU, Firefox, multiplayer. Quotes beyond the two specified (and two from Origins) are placeholders for the owner. Visuals are MeshBuilder with generated textures (upgrade candidate).

## 16 Nov 2026: Corporate District (location 2 of 3) is DEPLOYED: PR #275, squash commit `83e8941`

Design and details: [`CORPORATE.md`](CORPORATE.md). Screenshots: `docs/development/corporate/`. (First opened as #273, which conflicted when other work landed on `main`; the same work was rebased and re-opened as #275, then `main` was merged in twice. A force-push to the original branch was blocked, so a new branch was used.)
- **What:** a separate Corporate District scene about 1.8 km away, reached by sky cab at a flat 60 CR with the return included; a **reusable 3D sky-cab transition** (`sky-cab.js`); reusable map spaces with saved exploration fog (`area-map.js`); passive security robots, patrol drones and sweeping cameras; stealth and detection (yellow suspicious, red detected; crouch, shadow, cover and walkway modifiers); a guard that says "State your business."; a V1 map view of the area with fog; the sky cab is a taxi destination.
- **New files:** `void-runner/sky-cab.js`, `area-map.js`, `corporate.js`, `corporate-security.js`, `corporate-actors.js`, `corporate-build.js`, `corporate-integration.js`; tests `sky-cab`, `area-map`, `corporate`, `corporate-security` (unit) and `corporate-browser.cjs`; `docs/development/CORPORATE.md`; screenshots. Hooks in `babylon-renderer.js` (`zoneHandle`), `preparation.js` (`area` limit), `city-taxi.js`, `taxi-rules.js`, `district-map.js`, `personal-device.js`, `neochinatown.js`, `ncz-nightclub.js`.
- **Ids and saves:** walking locations `corporate` and `skycab` (no new location or mission id, no server change); `story.flags` `corpFog`, `skyCabTrip`, `cabReturn` (tolerant strings). Reload inside Corporate resumes on the street.
- **Bug fixed on the way:** NULL nightclub dynamic textures were never "ready" until redrawn near the player, which could hang the street's load; they are now drawn at creation.
- **Verified:** `npm test` 862 pass; CI green (Node, Python, build, Babylon smoke); real-browser walkthrough `tests/corporate-browser.cjs` locally (several runs) and **against the live site** (build `2026-11-16-corporate-2128+83e8941a11`): fare charged once, 3D cab, separate scene (NeoChinatown not loaded), robots, camera, drone, challenge, detection and hiding, map with fog, return exactly where boarded, failed-load recovery with refund, fog kept after a reload. Milked walkthrough and the existing map and road-taxi browser tests still pass. At most 2 real lights in the scene.
- **Not verified / known:** real-GPU, Firefox, multiplayer. **One unexplained live run:** after the reload the explored-cell count was 98 against 102 before; nine later runs (local and live) matched exactly (diagnostics are in the test). If it recurs, look at the save at the moment the Corporate area is disposed. `tests/personal-device-browser.cjs` ("a fresh key press moves again") fails on unchanged `main` in the software renderer; unrelated.
- **Visuals:** an honest step toward the new art direction, but still MeshBuilder with generated textures; upgrade candidate for Blender-made PBR architecture.

## 15 Nov 2026: Milked (location 1 of 3) is DEPLOYED: PR #265, squash commit `3129a09`

Three-location expansion, in order: **Milked, then Corporate District, then Zen Zephyr Temple**, one PR each. Milked is done; Corporate and the Temple are not started. Design and details: [`MILKED.md`](MILKED.md). Screenshots: `docs/development/milked/`.
- **What:** an adult livestreaming service and sperm bank (not a nightclub) on the Avenue's east plaza. Reception with Eva; streaming wing (three studios, operations room); biobank wing (appointments, private consultation, lab, staff-only door); Fish's back office. Everyone clothed, non-explicit.
- **New files:** `void-runner/milked.js` (data, collision, 3D build), `void-runner/milked-integration.js` (handlers), `tests/milked.test.cjs`, `tests/milked-browser.cjs`, `docs/development/MILKED.md`, screenshots. Hooks in `neochinatown.js`, `taxi-rules.js`, `city-taxi.js`, `district-map.js`; two provisional NPC entries in `tools/audio/npc-voice-registry.json` (blend voices, not approved, nothing generated); inventory regenerated.
- **Ids:** district `milked` (taxi zone `milked`), NPCs `milked-eva` and `milked-fish`, mission `meet-eva-milked` (data only, inactive). No new location id, save field or backend change.
- **Replacement points** (top of `milked.js`): Fish's name `CONFIG.FISH_NAME`; Eva's model `MODELS.eva`; Fish's model `MODELS.fish`; dialogue `DIALOGUE`. Placeholders are clothed crowd looks (`ncz-neon`, `fixer-01`).
- **Verified:** `npm test` 820 pass; CI green (Node, Python, build, Babylon smoke); real-browser walkthrough locally and **against the live site** (stream in, doorway, Eva, studios, ops, biobank, lab, Fish, map, real sky-cab trip with the long flight legs shortened because the software renderer is slow, unload) with no console errors. Existing map and road-taxi browser tests pass. Live BUILD `2026-11-15-milked-1+3129a09122`.
- **Known limits:** no real-GPU, Firefox or multiplayer testing; road taxis do not stop at Milked; lighting is emissive/ambient only and the interiors are dim; the look predates the permanent art direction above and is an upgrade candidate; dialogue is provisional and needs the owner's approval before the mission is activated.
- **Older tests changed** for the new geometry: `district-areas`, `environment-seam`, `district-map`, `road-taxi`, `city-taxi`.

## 14 Nov 2026 (later): beginner campaign, Developer Studio foundation and a performance profile built locally (DEPLOYED to the live website, squash commit `cce7fef`, PR #263)

**Deployed 14 Nov 2026.** PR #263 squash-merged to `main` as `cce7fef` on top of `8860ef6`; "Tests" and "Deploy site" both succeeded; live `void-runner-sw.js` reports BUILD `2026-11-14-beginner-campaign-2+cce7fefb0f`. Website only: no Game API, multiplayer hub, Firebase, Neon, database or Render change.
- **CI note:** the first PR run failed once in `tests/blackout-tesana-browser.cjs:171` ('original guest progress returns', 1 !== 4). Re-running the same commit passed, and main's own run also passed, so it is an intermittent timing flake in that Blackout test, not caused by this release. Watch for it.
- **Live checks done:** new files served, game boots with no page errors, `Beginner` module loaded, Studio shows only the sign-in screen to an anonymous visitor (CSP and noindex present). Studio publishing is disabled; the TEST SHIP stage only appears for server-confirmed developers.
- **Mission dialogue is PROVISIONAL placeholder text, not approved canon** (`VOID_RUNNER_HANDOFF.md` §11 'Proposed').
- **Known travel limits:** only the first trip (NeoChinatown to Meridian Station) was played end to end. Return travel and other destinations are untested; local Tessaly routes have raiders. Internal ids `earth`/`mars`/`sol-belt`/`sol` are not player-facing; no migration needed.
- **Not yet tested:** real-GPU / ROG Ally performance, Firefox, live two-player chat, a full live-site playthrough of the six missions.
- **Rollback:** revert squash commit `cce7fef` on `main` and push; Pages redeploys. Players' saves stay compatible (new state lives in tolerant `story.flags`).

- **Ship and travel were blocked by five things** (found by playing the real game): no ship (`shipAccess 'none'`), the old Vesper boarding gate, `freeTravel` false, `Campaign.complete` returning null for every flight in a closed-pool campaign (a launched ship could never dock), and the street's BOARD interaction being moved into a building by `world-integration.js`. All fixed; details in `docs/development/BEGINNER_CAMPAIGN.md`.
- **Beginner campaign** (six missions, existing Admin/Iris/bar/shop/Landing Terminal/Pad 01/Meridian only) in `void-runner/beginner.js` + `beginner-integration.js`, shown in the V1 Mission Log. **Story content is PROPOSED, not canon**: all wording is UNREVIEWED placeholder text. `Campaign.awardStarterShip` is the one real award (ship, quest open, free travel, once). Admin test ship: Developer Tools > Test & Jump To > "NeoChinatown ... TEST SHIP" (throwaway, never saved).
- **Developer Studio** foundation: `admin/studio.html` (12 tabs, WORKING/PARTIAL/PLANNED labels; Missions and Dialogue editors with validation, flowcharts, simulate, diff, export; NPCs and Locations read-only; local drafts only; publishing disabled). Docs: `docs/development/DEVELOPER_STUDIO.md`.
- **Performance:** profile and one measured, small optimization (crowd animation throttle); the JavaScript is not the bottleneck on this software-rendered machine and real-GPU numbers are still needed. Docs: `docs/development/PERFORMANCE_2026-11.md`.
- Verified: the whole campaign from a fresh save in a real browser (`tests/beginner-browser.cjs`, software GL): pod, six missions, ship on the pad, reload, boarding, real flight and docking at Meridian. NOT verified: return travel, other destinations, Firefox, real-GPU performance, live two-player behavior, the Asset Library (not built; the Windows asset folder was not visible from the cloud session).

## 14 Nov 2026: V1 Phase 1 + Phase 2 (Messages, KeyMap) and the Medium graphics default are LIVE
The owner approved publishing. PR #261 squash-merged as `d422f3d` (CI: unit, Python, build and the stabilization smoke all passed, also on main afterwards); the site deployed (live service worker build `2026-11-14-v1-phase2-2+d422f3d25e`). **Frontend only: no API, hub, Firebase, Neon or Render change, no save-schema change.** The API stays `5b0449b`-era code and the hub `b22d01e` (gear catalog); neither needs a redeploy for this.

What is live: homepage-style teal V1 (`void-runner/device-v1.css`), configurable transition delays (`DEVICES.v1.ui`), App Store storage panel (75% used / 25% available, 9 system apps, 0 optional). V1 Messages is the chat interface (the left-side box is gone; `district-chat.js` is a screenless session store; unread badges on the chip, tile and tab; Players tab = mute/block/report; Private is an honest stub). KeyMap on K (`keymap.js`; new rebindable `keymap` action in `input.js`; shown once after the first Sleeping Pod exit, `story.flags.keymapSeen`; a player who already uses K keeps it and the KeyMap takes J/N/M...). Graphics: new players start on **Medium** (High had become the default on 12 Nov via `c3c9213` with 4K caps); `graphics-prefs.js` decides what a saved value means: chosen presets are kept (saved with `v:2, chosen:true`), the old unchosen High and the old automatic Low are moved to Medium once, a High chosen again afterwards persists, Settings has "Reset graphics to Medium", nothing changes quality automatically. Details: `docs/development/V1_DEVICE.md`, `docs/development/GRAPHICS_TEST_ROG_ALLY.md`.

Verified after deployment (Chromium, against the live site): the new files are served and listed in the page; the service worker caches the V1 and KeyMap stylesheets and scripts (186 files); graphics-preference compatibility (9 saved-value cases, Reset, chosen High persisting); V1 timing, Messages (mocked multiplayer service) and KeyMap harness tests with the live assets; the real game new-campaign flow: no KeyMap in the creator or the pod, KeyMap after the first pod exit with the exact hint, K toggles, V1 and pause menu hide it, not shown again after a reload.

**Still NOT verified (do not claim them):** (1) live two-player chat through the real hub with the new Messages screen (needs two signed-in accounts; `tests/district-chat-browser.cjs` is adapted to it but times out loading two software-rendered pages, also on unchanged main); (2) Firefox (not installed here; `tests/device-messages-browser.cjs`, `device-v1-timing-browser.cjs` and `keymap-browser.cjs` accept `firefox`); (3) real-GPU frame rates and how Medium looks next to High on the ROG Ally (`docs/development/GRAPHICS_TEST_ROG_ALLY.md`); the cloud numbers are software-renderer only; (4) the CI sleeping-pod-exit smoke timeout seen on 13-14 Nov also failed on unchanged main (CI runner issue); it passed on this PR and on main afterwards. Not started: V1 Phases 3-6 (News source, follow system, camera/gallery, tagging) and the Developer Studio; all need the owner's approval.

## 13 Nov 2026 (late): cyberpunk character gear built locally (NOT pushed, NOT live)
Branch `claude/character-gear`: four optional creator accessories (`gear-visor`, `gear-collar`, `gear-shoulders`, `gear-chest`), male and female, all 11 outfits and 9 hairstyles. No schema change: they are ordinary `accessories` ids, so the API and hub only need the new catalog. Design, measurements and the live-release steps are in `docs/development/CHARACTER_GEAR.md`. Live release needs the owner's approval for: merge to main, API redeploy, hub catalog sync plus manual hub redeploy. Old clients show the plain model.

## 13 Nov 2026: Render updated for the four new outfits (the owner approved; live)

- **Game API** (`srv-d15h6nm3jp1c73ftalcg`, branch `main`, manual deploy): now `5b0449b` (was `eeb6989`). Deploy `dep-dbrl8q1srm7s73edskd0`, live 18:20 UTC. Only runtime change: `void-runner/character-catalog.json` (+4 looks, nothing removed).
- **Hub** `district-hub` (`srv-dbn1q3sipgvc73bbb1s0`, branch `claude/character-creator`, manual deploy): now `b4989eb` (was `85fe1f7`; fast-forward, same files as main `5b0449b`). Deploy `dep-dbrlatkipgvc739eho10`, live 18:24 UTC. Only change in `tools/district-hub`: `appearance/character-catalog.json` (+111 lines).
- No environment variables, Firebase settings, databases or secrets were touched. Neither service logged an error or warning after the deploys.
- Checked offline against the exact deployed code: all 11 looks are accepted by both services and the hub resolves each to itself; 14,256 combinations of the 7 older looks (every hairstyle, hair colour, clothing colour, accessory) give identical results before and after; old `{gender, model}` characters resolve identically; a wardrobe change to each new look is broadcast to a second player. The only refusals are the existing rule that SMUGGLER and TRADER hats do not fit some hairstyles.
- **Not yet verified:** two real signed-in accounts seeing each other's new outfits in the District. That needs the owner's test. The sandbox cannot call `onrender.com` (network policy), so health was checked from Render's own deploy status and logs.

## 12–13 Nov 2026: District interior rebuild under way

- The owner ordered the whole interior rebuilt with Blender-made assets. Plan, method and state per area: `docs/development/DISTRICT_INTERIOR.md`. First versions are live for the security vestibule, main hallway, Sleeping Pod hatches, the Admin & Iris shop, the arcade and the VR area (PRs #249 to #254).
- Pieces are built by `tools/assets/kit/build_kit.py --interior` into `void-runner/assets/models/district-interior/` (bare GLBs) and placed in `neochinatown.js` with `kitPiece()` / `kitAt()`, sharing one material per name (`kitMat()`); most join the per-material mesh merge. Old plain geometry stays as the fallback.
- Not judged on real hardware: brightness. The interior is at the 12-light limit, so the new surfaces rely on glow and a faint self-light.
- Still to do: hallway shop-front dressing and clutter, pod room walls/ceiling/interiors, shop display cases, bar and meeting room, ambient people, Admin and Iris looks (reference pictures supplied; needs the owner's go).

## 12 Nov 2026 (late): building kit finished; haze and dimness fixed

- **Modular building kit** for NeoChinatown: 47 pieces in `void-runner/assets/models/kit/` with `kit-manifest.json`, built by code (`tools/assets/kit/`). Not used by the game yet. Next step and all rules: `docs/development/BUILDING_KIT_HANDOVER.md`. Shop-sign wording is a placeholder awaiting the owner.
- **Graphics:** #241 (sharpness / Ultra) had also doubled bloom and glow and lowered exposure; #246 and #247 put bloom, glow, exposure and the street's faint self-light back. Sharpness and Ultra are kept. High is still the default quality on every device.
- **CI:** the browser smoke job is green again (#244). Its Blackout account-save section reports 'not run': the client half of that feature is only on `codex/blackout-district-production-integration` and needs the owner's decision before merging.
- **Next (the owner's order):** rebuild the District interior area by area with Blender-made assets, starting at the security vestibule; references are described in `VISUAL_REFERENCES.md`.

## How the handoff works

There is no generator script. The next model follows this reading order:

1. **This file, Start here** — what is true now, what is in flight, and what is waiting on the owner.
2. [`AI_ROADMAP.md`](AI_ROADMAP.md) — the current work sequence. October campaign milestones in other files are history.
3. [`CLAUDE.md`](../../CLAUDE.md) and [`AGENTS.md`](../../AGENTS.md) — how to work in the repo, saves, voices, tests, and line endings.
4. [`VOID_RUNNER_HANDOFF.md`](../../VOID_RUNNER_HANDOFF.md) — decision log and older canon. Its October 2026 "what the game does today" (start on Vesper, tutorial, starter ship) is **not** the live game. Do not restore that opening.
5. [`VISUAL_REFERENCES.md`](VISUAL_REFERENCES.md) — the owner's 12 Nov 2026 reference pictures, as written descriptions. The image files are still pending. Follow the entry when that character, place, or lighting job is in scope. The file does not authorise a Sleeping Pod room change, or a change to the VR play area's two divided areas.

The documents in this table are snapshots. Do not treat them as the place to start:

| Document | Why it is not the start |
|---|---|
| Historical log in this file | Dated snapshots. Headings that used to say "newest; read first" are renamed. |
| [`CODEX_HANDOFF.md`](CODEX_HANDOFF.md) | 4 Nov 2026. Told Codex to start on `claude/first-test-readiness` and said nothing was on `main`. That work has since shipped. |
| [`CODEX_TO_CLAUDE_HANDOFF_2026-11-06.md`](CODEX_TO_CLAUDE_HANDOFF_2026-11-06.md) | 6 Nov 2026 hub notes. `main` was still `7f2e8b1`. |
| [`FIRST_LIVE_TEST_RUNBOOK.md`](FIRST_LIVE_TEST_RUNBOOK.md) | Written before the first live test. The District game is on the public site now. |
| `docs/VOID_RUNNER_FREE_AI_VOICE_COMPARISON.md` | 15 Oct 2026. Still useful on engine choice (Kokoro). Line count "136" is stale. |
| `tools/animation-pipeline/README.md` opening | Says the game ships no rigged humanoid. Companions and the crowd do. |

## Start-here checklist

> Updated 15 Nov 2026: item 8's build stamp is stale (current stamp is in "CURRENT DEVELOPMENT STATE — RESUME HERE"). Items about the "four visual wins", street taxis (#243, merged) and dolphins (#240, merged) below are 12 Nov history. The Medium default shipped in #261.

1. `git fetch origin main` and branch from current `main`. Do not branch from the old Codex or #196–#199 stack.
2. Read this Start here section, then `AI_ROADMAP.md`, then `CLAUDE.md`.
3. **Merge only when the owner says "push", "pull it", or "go ahead and pull."** That means merge the finished pull request into `main`. Opening a pull request is not merging. Silence is not approval.
4. **Desktop and VR headsets only.** Phones stay on the normal site and must not download the 3D game (`void-runner/device-gate.js`). Do not lift that block. The four VR areas are in-engine first-person scenes, not WebXR. No `WebXR` / `createDefaultXR` usage is in `void-runner/*.js`.
5. **Leave the Sleeping Pod room and the music player alone** unless the owner asks, or a change cannot be made without them. If a game-wide graphics change would alter the pod, leave the pod meshes out and say so. Pod code is in `void-runner/neochinatown.js` (pod interior, `drawPodPlayer`, `drawPodLights`, `drawPodVending`) and `void-runner/pod-music.js` / `void-runner/world-integration.js`.
6. **Licensed models stay private.** Repo: `Smartsec916/void-runner-licensed-assets`. `tools/assets/pack-model.cjs` scrambles a GLB into `.vrpak` (magic `VRPK`). That scramble is not encryption. `tools/assets/build-pages.cjs` seals `.vrpak` / `.vrtex` as **VRPE** (AES-256-GCM) at the GitHub Pages build. Never commit source models, pack keys, or `VOID_ASSET_KEY` material to this public repo. Some marketplace licences are **No AI**: do not use those files for AI training. Ordinary rendering and the authorized convert/seal path are separate.
7. Story, canon, factions, and mission arcs: propose 3–5 options and wait. Graphics, bug fixes, and features the owner already asked for: implement on a branch. Plain language when writing to the owner. He is not reading code.
8. `void-runner.html` and `static/void-runner.html` stay byte-identical. Bump `BUILD` in `void-runner-sw.js` when any game file changes. Current stamp on this commit: `2026-11-12-null-club-1`.
9. `npm test` before a pull request. Do not put secrets, tokens, or device codes in docs, commits, or chat.
10. Do not start a second copy of the four visual wins. Dolphins already merged as #240. Check GitHub before starting a visuals branch; if that agent has since opened a pull request, use it.
11. When a job named in [`VISUAL_REFERENCES.md`](VISUAL_REFERENCES.md) is in scope, follow that entry. Each image is still pending. That file does not allow a Sleeping Pod room change, or a change to the VR play area's layout.

## What is on main (code, 12 Nov 2026)

The live game is **The Darknet District** in NeoChinatown, Tessaly System. A new campaign has **no active missions and no starting ship**. Every login should wake in that player's own Sleeping Pod. First-time appearance customization happens **before EXIT POD**. The homepage ENTER control is the way in. It is not the spawn point.

Shipped on `main` by 12 Nov 2026 (newest first):

| PR | What landed |
|---|---|
| #240 | Tropical Escape dolphins. Quaternius Animated Fish Pack dolphin (CC0), swim clip, surface leaps and splashes offshore of the beach and pier. Model `void-runner/assets/vr/models/dolphin.glb`. No crabs. Credit in `docs/VOID_RUNNER_ASSET_LICENSES.md`. Merge `4fc1a70`. |
| #238 | **NULL** nightclub is on for everyone. Interior is code-built in `void-runner/ncz-nightclub.js` (`buildOwn()`): dance floor, DJ, bar, VIP, people. A purchased `nightclub.vrpak` is used automatically if it is published later. See `NIGHTCLUB_NULL.md`. Street players are still not shared, so the club is solo. |
| #237 | Small arcade, five cabinets, off the hallway. The middle cabinet opens the real Blackout Protocol page. `district-arcade.js`, `ARCADE.md`. Four other titles are working names waiting on the owner. |
| #236 | Sleeping Pod free look and E/M/V shortcuts. `SLEEPING_PODS.md`. |
| #235 | Pods moved to the rear (hallway ends in the pod room). Stairs to the terrace moved to the east end. Wardrobe on the entrance wall. Old west room is the arcade. Use `VoidDistrictArea.podBed` / `podExit` / `POD_VIEW`. |
| #234 | Alley life: people, props, steam. No new alley sound. `ncz-alley.js`, `ALLEY_LIFE.md`. |
| #233 | Fishing from the Tropical Escape pier. "Catch 100 Fish" is progress on the player's own profile until server-verified unlocks exist. `ACHIEVEMENTS.md`. |
| #232 | VR-exit checkpoint fix (appearing in the vestibule no longer throws the player outside). Bedroom simulation is back and shareable. Companions are simulated per player, not synchronised. |
| #231 | V1 map is a real city map with zoom, pan, and a direction waypoint. No pathfinding. `district-map.js`. |
| #230 | Vestibule exchange only after both doors report shut. `VESTIBULE_CHECKPOINT.md`. |
| #229–#228 | Character-creator stage lighting; menu city backdrop. |
| #227 | Shared VR sessions (public list, or private 8-character code). `VR_SESSIONS.md`. |
| #226 | Multiplayer presence: stay online in pod screens; on-screen ONLINE / SOLO chip. |
| #225–#223 | Pod wall: vending (flavour only, no credits), light panel, music-player face. |
| #222 | Pod surfaces follow the Tesana design. |
| #220 | V1 holographic device (L). Mission Log empty. Camera and Gallery are placeholders. |
| #217 | District runtime, ten personal pods, creator first. |
| #214, #212 | Favicon, then the District entry integration. **#212 merged 11 Nov 2026.** It is not an open draft to hold. |

`WEBSITE_PLAYLIST` in `void-runner/pod-music.js` is **`true`** on this `main`. The 4 Nov note that the 27 songs are off in the game is stale. The website Sleeping Pod page has its own player either way.

Render (hub and game API) was last described in the 11–12 Nov diary as deployed from `main` with registered-account hub access. This checkout cannot see Render. Re-check the live services before changing them. Do not deploy, buy, or change secrets without the owner.

**Still open on GitHub, and not a base to branch from.** Drafts #196, #197, #198, #199, #195, #207, #208, and the older unmerged stack #176–#191. Much of that work already arrived on `main` by later pull requests. Do not merge those stacks wholesale. Closing them is the owner's decision.

A local packet (not on `origin`) also named branches `up196`–`up199` and `docs/cyberpunk-kit-reference` (`0f0dd7d`). They were not on `origin` at this check. Do not recreate them from memory.

## In flight — do not duplicate

> **Stale (12 Nov 2026).** Street taxis (#243) and dolphins (#240) have merged, and the Medium graphics default shipped in #261. For what is in flight now, see "CURRENT DEVELOPMENT STATE — RESUME HERE" at the top.

**Street taxis** are on branch `cursor/neochinatown-road-taxis-5abd` (pull request #243). Cabs drive the existing NeoChinatown roads and are hailed from the V1 map. Stops are only the four built taxi zones. Add another later by appending its zone id to `REGISTRY` in `void-runner/road-taxi-rules.js`. See `docs/development/ROAD_TAXIS.md`. Do not start a second taxi branch.

Checked again 12 Nov 2026 after this note was first written. **Dolphins merged** as [#240](https://github.com/Smartsec916/the-darknet-district-site/pull/240) (`cursor/tropical-leaping-dolphins-0365`, agent [bc-14ad5818-751b-5273-b62f-879dd9560365](https://cursor.com/agents/bc-14ad5818-751b-5273-b62f-879dd9560365)). Do not open a second dolphin change. **Do not add crabs.**

**No visuals / Ultra / bloom branch or pull request existed yet.**

### Four visual wins — own branch, not authorized to merge

- Cloud agent: [bc-8ae0a04a-9e48-58cf-9465-9f4d838cd39f](https://cursor.com/agents/bc-8ae0a04a-9e48-58cf-9465-9f4d838cd39f).
- The owner asked for these four only, game-wide, on their own branch. **Do not merge until he says so.** Do not start the medium or larger jobs (real night reflections, shadows, new buildings, NPC models, WebXR).
- Verified on `7939256`. #240 only added Tropical Escape dolphins, so these renderer facts still apply:
  1. **Sharpness.** `babylon-renderer.js` builds the engine without `adaptToDeviceRatio`. `resize()` caps at 2560×1600 CSS pixels (`width / scale`), so device pixel ratio is unused.
  2. **Quality.** Presets are only `low` / `medium` / `high` (scale 1.5 / 1 / 0.8). No Ultra. Default in `babylon-integration.js` is `low` when the pointer is coarse or cores ≤ 4, otherwise `medium`. `device-gate.js` `recommendQuality` can also store `low`. **Remove those quality auto-low checks for this task. Leave the phone block in place.** Settings `<select>` is built from `Object.keys(VoidBabylon.presets)`.
  3. **Glow.** Look pipeline exposure is `1.55`. Bloom and FXAA run on medium and high (`bloomWeight .32`). `GlowLayer` runs only on `high` (intensity `.45`). No sharpening pass. Engine antialias is the boolean `true`, not MSAA/SMAA.
  4. **Fake glow to remove:** shopfront emissive in `neochinatown.js` (road texture plus a small emissive color), puddle emissive, graffiti decal emissive. Facade `facade-*-glow` textures were not in the four-win list; leave them unless the branch must touch them. **Do not strip pod emissive** (`pod-inner`, `tesana-pod-led`, pod paint/fabric/rib) as fake glow.

Other facts from the same review, for later, not for this branch: the environment probe is a 128 px code-built grey room (`ReflectionProbe` in `babylon-renderer.js`). NeoChinatown has two street `PointLight`s, and only when quality is not low. The only `ShadowGenerator` in `void-runner/*.js` is the Vesper workshop. `docs/VOID_RUNNER_GRAPHICS_ROADMAP.md` Phase H (shadows outside the opening, Ultra, ambient occlusion, a better HDRI) was not started. A Poly Haven HDRI needs the owner's OK before download.

## Companions (metadata only)

Selection is a full-screen menu inside **Play in a Bedroom** at the VR arcade terminal, not the spawn. New players still wake in a Sleeping Pod. Eight companions: Seren, Kai, Nadia, Ava, Eva, Yuki (`base-f`), Dex (`base-m`), and Una (`listed:'dev'`, local server only until her product page and licence are identified). Dialogue is scripted. There is no live language model. They do not leave the simulation.

Public code can show Seren, Kai, and Nadia. Ava, Eva, Yuki, and Dex come from the private repo at Pages build time. A local build can list them and then report a missing model. Do not delete a companion or swap in a different model to hide that.

| Name | Game id | Pack | Notes recorded on main |
|---|---|---|---|
| Ava | `ava` | `vr-companion-ava` | Default: red top and skirt, bob, no glasses. Looks: outfit `red` (parts `top_red`, `skirt_red`, `bikini_bottom`) and `bikini` (`bikini_top`, `bikini_bottom`, `skin_under`); hair bob/long/pixie; glasses; make-up swaps `head`/`lips` to `face-makeup`. |
| Eva | `eva` | `vr-companion-pg` | Pretty Girl 01. Default: white slip, natural hair. Looks: cloth white/blue/pink/grey, hair colours, eye colours, face looks `1`–`6` (default `5`). |
| Yuki | `base-f` | `vr-companion-bf` | CGTrader base rig with Dex. **No `looks` array.** Underwear material is part of the prepared mesh. |
| Dex | `base-m` | `vr-companion-bm` | CGTrader Male Female Base Rig **#4027823**, Royalty Free, no AI. **No `looks` array.** Source comment: briefs only until the owner adds clothing. |
| Una | `una` | `vr-companion-una` | Style A/B/C looks. Not on the live site. |

The 12 Nov review's size notes (pack bytes from the private repo listing, not from decrypting models): Ava about 60 MB, Eva about 29 MB, Yuki about 24 MB, Dex about 17 MB, against a few MB for the public companions. `docs/VOID_RUNNER_VR_ARCADE.md` already records Ava at about 150 MB of graphics memory. Those numbers were not re-measured for this doc.

**Top 10 from the 12 Nov companion review** (not started; do not build until the owner asks). Smallest first:

1. Unprompted lines only subtitle. `remark()` in `vr-suite.js` calls `showLine` and does not play the clip. Recordings already exist.
2. Dex has no `confident` clip list. `clipFor` falls through to the shared fallback `hips` / `head-tilt` (the same hip-sway name Seren's confident gesture uses).
3. Affection starts at zero each visit, only rises, and is not saved. Three compliments unlock a kiss.
4. Short line pools. Every companion's kiss line is "Come here." Nothing reacts to music, light, outfit, or a return visit.
5. Ava's pack is heavy for headsets. A lighter private-repo variant was suggested. Not made.
6. Bedroom lighting: companions take many lights and a floor reflection. Pod room and music player were out of scope.
7. No lip sync. Seren, Kai, and Una do not blink or smile from this review's reading.
8. "Lie back" is a held pose, the dance loop is about a second, the kiss is a fade, holding hands is a generic reach, turning slides the feet, and there is no hug.
9. The same clips are baked into each model. One shared animation file would make new mocap cheaper. The player-creator plan already calls this a spike, not a promise.
10. Companion behaviour has no tests. The game is Babylon 8.26. An upgrade to a newer Babylon is a separate branch if the owner wants it.

A looks menu already exists in the bedroom Esc menu for Ava, Eva, and Una. A later idea (each option asked as a spoken yes/no, applied while she asks) was **not coded**.

**Player creator** (separate from companions): a creator is already live (before EXIT POD; hair and outfit presets). `docs/development/CHARACTER_CUSTOMIZATION_PLAN.md` (5 Nov 2026) is the unfinished part-assembler design. Its "nothing is built" line is stale. The six owner decisions before its Stage 1 are still unanswered: base heights, CC0-only versus waiting on Suits 02, where clothes change, how many colours, whether to buy anything, and whether looks can change freely later. Tesana, CGTrader companion models, and DAZ files stay off the player creator.

**Noodle stand:** not built. Street signs already say `DRAGON NOODLES` / `NOODLES`. A 8 Nov research note recommended YANGGA's Japanese Ramen Stall (Sketchfab, CC-BY, about 35k triangles) or a CC0 Quaternius stall plus a ramen prop. A placement east of the District door was sketched and then **not implemented**. The exact choice the owner was asked to make was not saved. Ask again. Do not invent a menu of options.

## Animation clips (what a new mocap file must satisfy)

- Skeleton: **52-bone Mixamo**, names `mixamorig:…`, contract `VR_Humanoid_v1`, `rig:'mixamo-52'`. Same contract for companions and crowd. `tools/animation-pipeline/characters/vr-companion-bf.json` has 52 bones.
- Build: `tools/animation-pipeline/build_imported_character.py` (character FBX or prepared `.blend`) and `build_mpfb_character.py`.
- Library rate is **15 fps** (`clips.json`). The game interpolates. Rest reference: `Laughs_mixamo.fbx`. The character rest pose is bent to the clips' T-pose for mapping only.
- Horizontal hip travel is stripped (in-place). Finger bones are in the 52. Review finger deformation before production use.
- Clip import accepts `.glb` / `.gltf` / `.fbx`. There is **no `.bvh` importer**. `mathutils.bvhtree` in that file is a spatial tree, not a motion-capture format.
- Retarget names that are recognised: Mixamo, HumanIK `Character1_`, and Unreal / Universal Animation Library names.
- `clips.json` "about": Rokoko free mocap in `VOID_RUNNER_KEEP` ("never modified"); Quaternius Universal Animation Library, CC0; Mixamo FBX the owner downloaded, baked onto characters, **never redistributed as raw files**. `CHARACTER_CUSTOMIZATION_PLAN.md` still holds Rokoko and Mixamo redistribution in a public web game until verified. Keep both: the pipeline's recorded licence, and the plan's verification gate.
- Production blending: `void-runner/crowd.js` sets `enableBlending = true` and `blendingSpeed = .06` ("clips cross-fade instead of snapping"). The weighted **300 ms** blend is only in `void-runner/animation-library.js`, loaded by the dev lab `tests/animation-poc.html`, not by the game.

**Mocap sources reviewed 12 Nov (nothing downloaded).** Closest ready fit: two CGTrader "Tomasi" packs on a Mixamo skeleton (flirting set, and a suggestive dance set). Also noted: Truebones Romance Pak (not Mixamo; credit required), MocapDancer couple dances (Unreal skeleton; Sketchfab licence has extra use limits worth reading before a cyberpunk game), Unity Asset Store couple packs (standard Unity licence allows a non-Unity game if players cannot extract the files; AI training banned), DeepMotion video-to-FBX/GLB (needs rights to the source video), and Cascadeur / Plask / Move.ai as cleanup tools (confirm Plask commercial terms before relying on them). Ruled out for commercial use: Smutbase-style non-commercial libraries, and the Bandai Namco / AMASS research sets. Paid clips would go through the private repo and the VRPE seal, same as the companion models. A few live prices could not be re-checked. Confirm before buying.

**Blender batch pass:** not a complete fix, and not started. Most of what the player sees in the District and on the street is still Babylon `MeshBuilder` geometry. NeoChinatown was described in that review as on the order of 1,100 pieces, mostly code-built. There is no Blender connection for Claude in the repo. Blender steps are one-model scripts on the owner's PC (Blender 5.2 or newer). Source `.blend` / `.fbx` files are not in either git repo. Rounding edges would break skinned companions and crowd. Higher-impact work that Blender cannot do: lighting and post (the four wins above), and replacing more code-built blocks with the city pack through the existing `pack_to_glb.py` path.

## Voices

- Engine on `main`: **Kokoro-82M** (`manifest.json`: `kokoro-v1.0.onnx`, Apache-2.0). Format: ogg/opus, 24 kHz mono.
- **736** lines in `void-runner/assets/audio/voice/manifest.json`. **439** are companions: `vr-ava`, `vr-eva`, `vr-una`, `vr-base-f`, `vr-base-m`, `vr-nadia`, `vr-seren` at 55 each, `vr-kai` at 54. Folder: **738** `.ogg` files and **741** files total (oggs, manifest, a second JSON, `LICENSES.md`). Use these counts. "741 lines" was loose.
- Playback: `void-runner/voice-clips.js`. A line with no clip falls back to browser speech synthesis. If the console shows the browser-voice path, fix missing clips before paying for a new recording.
- Companion cast entries in the manifest are `provisional`. Many story NPCs are `approved`. **Do not change an approved voice** without the owner. Registry: `tools/audio/npc-voice-registry.json`. Iris's android colour and Elias's hologram tone are applied at playback so the files stay clean.
- Regenerate with `node tools/audio/extract-lines.cjs`, then `python tools/audio/generate.py --models <folder>` (`--dry-run` first). Ask before bulk-generating. `LICENSES.md` still mentions `tools/voice/generate.py`; that folder is not on `main`. Use `tools/audio/`.

**Re-record research (12 Nov, nothing purchased).** The synthetic sound is Kokoro, not live browser speech. A one-off re-record of the 439 companion lines (about 17,000 characters) was priced roughly as:

| Provider | What the review reported |
|---|---|
| ElevenLabs | Most natural. Usage about $1.30. Commercial use needs the starter plan, listed as $6 a month and $1 the first month. |
| Google Chirp 3 HD, Amazon Polly, or Azure | A job this size fits the free monthly allowance, so likely $0. |
| OpenAI | Well under a dollar. The review said to skip it because those speech models shut down on 6 January. |
| Retune Kokoro | Free, with the existing audition tool. Modest change. |
| All 736 lines | Still free on Google or Amazon, or about $3 on ElevenLabs. |

Players must not call a TTS API. GitHub Pages cannot hold a provider key. Keep stable line ids, replace the ogg files, update `engine` / cast metadata, and run `extract-lines.cjs --check` and `npm test`. Suggestion recorded for the owner: try a few lines on ElevenLabs and on Google Chirp, then re-record with whichever he prefers, and leave Iris's android voice as it is. Unprompted remarks could be voiced by playing the existing clip inside `remark()` (top 10 item 1). Not done.

## VR areas and the Forest sky

`tests/vr-arcade.test.cjs` expects exactly `combat`, `forest`, `suite`, `tropical`.

| id | Title | File | Notes |
|---|---|---|---|
| `forest` | Relax in a Forest | `vr-forest.js` | `shared:true`, station 1 |
| `tropical` | Tropical Escape | `vr-tropical.js` | `shared:true`. Fishing (#233) and surface dolphins (#240) are on `main`. Gulls toggle. No crabs. |
| `suite` | Play in a Bedroom | `vr-suite.js` | `shared:true` again after #232. The 12 Nov map note that removed it from the menu is superseded by #232. |
| `combat` | Combat Simulator | `vr-combat.js` | `listed:false`. Code kept. |

New area: `VoidVR.register` in `vr-<id>.js`, script tags in **both** HTML files, and an update to `tests/vr-arcade.test.cjs`. Kit: `vr-kit.js`. Sessions: `VR_SESSIONS.md` (#227).

**Forest sky (nothing changed; cause unconfirmed).** `vr-forest.js` uses `k.sky('forest', 1.2)` → `void-runner/assets/vr/sky/forest.jpg`. The file inspected that day was a 2048×1024 RGB JPEG, 656,513 bytes, exact 2:1, with no obvious seam in a 1600×800 preview. `vr-kit.js` `sky()` builds a `PhotoDome` at **resolution 48**, size 1800. More likely than a bad texture, and not proven in a headset:

1. Horizontal leaf cards on oak/birch crowns (`vr-forest.js`, top card with `rotation.x = Math.PI/2`).
2. Seven sunbeam planes (settings key `beams`, default on).
3. Less likely: the coarse dome, fog, or waterfall mist. The dome has fog off.

Do not "fix" this on a docs branch. A later debug pass can hide the top cards and the beams and look again.

`docs/VOID_RUNNER_VR_ARCADE.md` still has an older "needs the owner's review" note about three companion lines that mention the sea. Those lines were left as written.

## Music rights and the Tesana audit (from the unpushed notes)

Folded in from local commits `bb7c045` and `3df6adb` (they were not on `origin/claude/codex-handoff`, which stops at `d6cfc67`):

- **Music (the owner, 8 Nov 2026):** the 27 songs were made during a **paid Riffusion subscription in 2025**, which is also why they are higher quality than the free plan. The free tier's non-commercial limit does not apply. The March–April 2026 Starter receipt is a later paid period. Rights are treated as **settled for use in the game**. That does not by itself grant redistribution, sublicensing, or AI-training rights. Explicit titles are an age-policy question, not a reason this note removes the files. `MUSIC_LICENSING.md` carries the update. `CLAUDE.md` already said to keep paid-plan Riffusion music available.
- **Tesana shared library:** the 10 `library:` models (`iris`, `kai`, `mara`, `marcus`, `nadia`, `pedestrian_a`, `pedestrian_b`, `rook`, `seren`, `satellite`) are still **to confirm, per asset**, before import. The 7 models generated in the owner's own Tesana project are covered at plan level by his Max Plan statement and remain unimported. Wording in the audit now says "not recommended" / "to confirm" instead of "reject" / "blocked". See `TESANA_ASSET_AUDIT.md`.

## Standing rules (short)

- The owner (`Smartsec916`) is the creative authority. Record story decisions in `VOID_RUNNER_HANDOFF.md` §11 only after he approves them.
- Desktop and VR headsets only. Not phones.
- Do not modify the Sleeping Pod room or the music player as part of unrelated visual work.
- Do not merge, deploy, buy services, or change production data or secrets unless he asks.
- Licensed companions and other paid models: private repo, VRPK scramble, VRPE seal at Pages build. Never in this public repo.
- In-game Iris stays separate from the website chatbot (`chatbot.html`, `iris-*.html`, `identity_api.py`).
- Unfinished **in-game** shop items may be removed if a task needs that. Real storefront, Shopify, and purchased entitlements stay.
- `git config core.autocrlf false` in this repo. Many files are CRLF. Do not reformat a file to fix line endings.

## Open questions for the owner

1. **Companion review:** start any of the top 10, or leave them? The suggestion on the day was silent lines, the Dex clip, and saved affection. Not started.
2. **Player creator plan:** the six Stage-1 decisions in `CHARACTER_CUSTOMIZATION_PLAN.md` §11 are still open. The live creator is the preset one, not that part assembler.
3. **Companion looks for Yuki and Dex,** and whether the bedroom Esc looks should be asked out loud. Not decided in a saved list.
4. **Noodle stand:** which stall, if any (YANGGA CC-BY, Quaternius CC0, or none). Nothing was built.
5. **Voices:** try ElevenLabs and Google Chirp on a few lines, or keep Kokoro? Iris's approved android voice stays either way.
6. **Forest sky:** where the odd patch sits (overhead, horizon, or over the clearing), and whether it vanishes with Sunbeams off.
7. **Crabs** stay out unless he asks again. Dolphins are already on `main` (#240).
8. **Four visual wins:** review that pull request when it exists. Merge is not authorized yet. Pod room and music player stay visually as they are.
9. **Age policy** for strong-language songs and any vending flavour. Still open. Playlist files are already public on the site.
10. **Tesana:** per-asset confirmation for the 10 shared-library models before any import.
11. **Old pull requests** #176–#199, #207, #208: leave open, or close as superseded? Do not close them without him.
12. **Blender / bigger visuals** (reflections, shadows, more city-pack buildings, NPC models): not started. Phase H in the October graphics roadmap still needs his OK for an HDRI download.

## handoff-soft.patch — what was folded in

Eight documentation commits existed only as a local branch `handoff-soft` (merge-base `7f2e8b1`, tip `3df6adb`). `origin/main` is 147 commits later. Do not diff that branch against `main`; the diff looks like it deletes later game work.

| Commit | Subject | This update |
|---|---|---|
| `301c2f8` | Codex handoff and Tesana audit | **Skipped.** Already on `main` (via `origin/claude/codex-handoff`). |
| `30135e6` | Tesana Max Plan verification; 10 shared-library models pending | **Skipped.** Already on `main`. |
| `ca0fc16` | Final test results and starting commit | **Skipped.** Already on `main`. |
| `122b2aa` | Second-session handoff, music licensing, runbook, homepage patch | **Skipped.** Already on `main`. The runbook's "nothing has been done" line is now marked historical. |
| `c53ac7e` | District floor plan PNG/SVG/`make_map.py` | **Skipped.** Already on `main`. |
| `d6cfc67` | Map: 10 pods, 2×5, terrace by the stairs; walkthrough photo | **Skipped.** Already on `main`. Pods have since moved to the rear (#235); the picture is a map of an older layout. |
| `bb7c045` | Neutral wording (licensing, approvals, readiness) | **Folded** into `CODEX_HANDOFF.md` and `TESANA_ASSET_AUDIT.md`. |
| `3df6adb` | Music rights settled (paid 2025 Riffusion subscription) | **Folded** into `CODEX_HANDOFF.md` and `MUSIC_LICENSING.md`, and corrected for `WEBSITE_PLAYLIST=true` on current `main`. |

Also skipped, because they were a different local branch and not in those two commits: `docs/CYBERPUNK_GAME_KIT_REFERENCE.md` on `docs/cyberpunk-kit-reference`. The verdict is recorded above (the kit would not improve this game's look). The file was not on `origin`.

---

## Historical log

Snapshots from 10–12 Nov 2026, newest first, then the 10 Nov integration note. **Do not follow "read first", "next task", or deploy instructions in this log.** Later snapshots corrected earlier ones (the game API deploy, the Bedroom VR listing, the nightclub being off, draft PR #212). Start here wins.

A correction that is easy to miss: the alley note below says the nightclub module is switched off until its licence is cleared. That was true only until #238. NULL is open.

## 2026-11-12: street taxis in NeoChinatown

- Self-driving cabs drive the avenue and Main Street. Rules: `void-runner/road-taxi-rules.js`. The cab is drawn in code (`void-runner/road-taxi.js`); no model file. The older sky cabs are unchanged.
- Hail one from the V1 map (STREET TAXIS). Stops are the four taxi zones that are already built: Main Street, the avenue, Main Street by the alley, and the passage by the landing pad. Add another later by appending its existing zone id to `REGISTRY` in `road-taxi-rules.js`. See `docs/development/ROAD_TAXIS.md`.
- A person in front of a cab stops it. The fare is the same formula as the sky cabs, stored separately as `story.flags.roadTaxiTrip`.


## 2026-11-12: NULL, the nightclub, is open

- `docs/development/NIGHTCLUB_NULL.md`. The existing club module is now ON for everyone in the game; because the purchased interior model is not published anywhere I can reach, the interior is built in code (`buildOwn()` in `void-runner/ncz-nightclub.js`) with a dance floor, DJ, bar, VIP corner and people. If `nightclub.vrpak` is later published the purchased model is used automatically.
- Street players are still not shared in multiplayer, so the club is solo for now.


## 2026-11-12: the arcade (small, five cabinets) with a playable Blackout Protocol cabinet; free look in the pod

- `docs/development/ARCADE.md`. Five cabinets in a small room off the hallway; the middle one opens the real Blackout Protocol page in a frame (`void-runner/district-arcade.js`). Four placeholder titles are Claude's working names for the owner to approve.
- Sleeping Pod: free look (mouse capture, drag, arrows) and E/M/V shortcuts (`SLEEPING_PODS.md`).
- The owner (2026-11-12): for the NULL nightclub, 'use all available assets' (so the purchased club model in `ncz-nightclub.js` and existing nightlife are to be used).
- Gotcha seen three times now: the game page has global styles for `canvas`, `iframe`, `header` and `main`. New overlays must set position/size explicitly and avoid those tag names.


## 2026-11-12: Sleeping Pods moved to the rear of the District

- See `docs/development/SLEEPING_PODS.md`. The hallway now ends in the pod room (z 70.5..78.3, full width); stairs to the terrace moved to its east end; the wardrobe is on its entrance wall; the character creator's stage is in the hallway with the pods behind. The old west room is empty (`arc-*` walls) for the arcade.
- Use `VoidDistrictArea.podBed/podExit/POD_VIEW` for pod positions and view directions; several tests had the old numbers hard-coded and were updated.
- Next for this brief: Tesana fidelity pass on the pod interior, then the 1980s arcade in the old room.


## 2026-11-12: the alley is inhabited

- `void-runner/ncz-alley.js` + alley props and steam in `neochinatown.js`; see `docs/development/ALLEY_LIFE.md`. No sound added.
- NOTE for the nightclub task: a nightclub module ALREADY EXISTS (`void-runner/ncz-nightclub.js`): a purchased 'Cyberpunk Cyber Club' model set into the west side of Main Street where the owner's map marks 'Nightclub', switched off until its licence is cleared (`?nightclub=1` on a local server with the pack). **Superseded the same day by #238: NULL is open. See Start here.** The owner has since named the club **NULL** and asked for it across the street and to the right of the alley. Reconcile with him before building a second one.


## 2026-11-12: fishing in Tropical Escape; achievements (browser-kept for now)

- Fishing from the pier in `void-runner/vr-tropical.js`. 'Catch 100 Fish' was added to the EXISTING achievement catalogue (`void-runner/achievements.js`, which unlocks only on server-verified events). Progress is counted in the browser by the new `void-runner/local-progress.js` and shown on the player's own V1 profile as progress, not as an unlock. See `docs/development/ACHIEVEMENTS.md`. (Note for future sessions: `void-runner/achievements.js` and `tests/achievements.test.cjs` already exist; do not create files with those names.)
- Server-side verified events (which actually unlock achievements) are approved and should be built together with the Blackout Protocol leaderboard.


## 2026-11-12: checkpoint fix after VR; Bedroom simulation back and shareable; the owner's decisions

- BUG FIXED (was live for a few hours): returning from a VR simulation placed the player for a moment at the interior's default spot, the middle of the vestibule, and the new checkpoint sent them out to the street. The checkpoint now ignores a player who APPEARS in the vestibule (any frame not spent walking in that environment disarms it until they step out). `tests/vr-sessions-browser.cjs` caught it.
- 'Play in a Bedroom' is back in the VR arcade and can be a public or private shared session (`shared:true`, `shareOpts`/`fromShare` in `void-runner/vr-suite.js`). Companions are simulated per player, not synchronised.
- The owner's decisions (2026-11-12): leaderboard/achievement records in the production database are APPROVED (new records only); the nightclub is named **NULL**; the rear stairs are to be RELOCATED (terrace stays reachable) when the Sleeping Pods move there; add a fishing mechanic to Tropical Escape and an achievement 'catch 100 fish in Tropical Escape'.


## 2026-11-12: city map with waypoints; Bedroom simulation removed from the VR menu

- V1 Map app is now a real city map generated from the layout (`void-runner/district-map.js`, `docs/development/DISTRICT_MAP.md`): zoom, pan, places, layers, waypoint with a HUD pointer. Direction only: there is no pathfinding data.
- 'Play in a Bedroom' is no longer offered in the VR arcade (`listed:false` in `void-runner/vr-suite.js`). Its code and companion models are KEPT pending the owner's decision on deleting them.
- Vestibule scan: the picture behind the scan is the player's own view captured when the doors sealed (so it always matches the direction they face); it is now only lightly dimmed and the status panel sits in a corner.
- QUEUED from the owner (2026-11-12, large; not started): alley NPCs and atmosphere; Sleeping Pod relocation to the rear stairs + Tesana rebuild (new ZIP supplied); 1980s arcade in the old pod room with a playable Blackout Protocol cabinet; Blackout Protocol level 3 NPC changes, levels 4+ graphics, leaderboard and profile achievements; a nightclub across from the alley; Blender-assisted asset work. See the chat report for the proposed order and the open questions.


## 2026-11-12: security vestibule checkpoint rebuilt

- The exchange between street and interior now happens in the middle of the vestibule, only after the door sensors report BOTH doors shut, in both directions; the player keeps position and facing; the far door opens afterwards. Full description: `docs/development/VESTIBULE_CHECKPOINT.md`.
- Behaviour change: leaving the District no longer drops the player in the alley; they stay in the vestibule and walk out through the outer door. In the interior the outer door cannot open; in the street the inner door cannot open.
- Master specification Phase 1 (vestibule loading only when both doors are closed) is therefore done.


## 2026-11-12: shared VR sessions (game side live after this PR; hub redeployed separately)

- Full description, rules and message list: `docs/development/VR_SESSIONS.md`. Hub rules in `tools/district-hub/protocol.cjs` (a session is its own room `vr:<id>`), menu in `void-runner/vr-core.js`, connection in `void-runner/remote-players.js`.
- Public sessions are listed and joinable (JOIN, QUICK JOIN); private sessions are never listed, cannot be joined by id and need an 8-character code checked by the hub. Host leaving passes ownership on; empty sessions end. Playing alone is a private session of one.
- Shared: Relax in a Forest, Tropical Escape. Solo only: Play in a Bedroom, Combat Simulator (not synchronised). Only position, facing and walk/idle are shared.
- The game sends session messages only to a hub that announces `features.vr` (the older hub counts unknown messages as faults). Either side can be deployed first.
- Also fixed: the player list is kept while a place loads (returning from VR used to show nobody); a keep-alive timer stops slow loads being taken for dead connections.
- Tests: `tests/district-hub-vr-sessions.test.cjs` (rules), `tests/vr-sessions-browser.cjs` (one browser + two wire-level players, SIMULATED identities; this cloud machine cannot render two simulations at once). Not verified: two real players in one simulation on real hardware.
- The hub on Render follows branch `claude/character-creator`, not `main`: after merging hub changes, add a commit there with the same files and trigger a deploy of `district-hub`.


## 2026-11-12: multiplayer presence repair (live after this PR)

**Report:** two real players in the Sleeping Pod area could not see each other. **Evidence (Render hub logs, 10–12 Nov):** only ONE player id and one address ever joined; no second account reached the hub.
**Causes found in the client (`void-runner/remote-players.js`):** (1) the client was online only in `walking`/`menu` mode, so lying in a pod (`pod-waking`), the pod music screen or the wardrobe silently disconnected the player: two players in their pods were never online together; (2) nothing on screen said whether a session was online or solo, so an unsigned-in player could not tell.
**Fixed:** stays connected in every District-interior screen (`ROOM_MODES`); a player in a pod is reported at the pod door (pods stay private); on-screen indicator `#mp-chip` (ONLINE · N players / PLAYING SOLO · reason / CONNECTING / RECONNECTING); a plain glowing fallback figure if a player's model cannot load; `VoidRemotePlayers.diagnostics`; main menu says solo play when not signed in. The earlier-campaign backup download was removed from the menu (retired copies stay untouched in browser storage; `C.retiredKeys` kept).
**Test:** `tests/multiplayer-presence-browser.cjs` (two to three browser sessions + in-process hub, SIMULATED identities). Not verified: real Firebase sign-in for a second real account, and two real players on the live site.
**Not changed:** the hub (Render `district-hub`, still commit 298533b) and the game API. **Still required of each player:** a registered account, a District handle (Menu › Settings) and a saved character.
**Next:** shared VR sessions (public/private) need hub protocol work and a hub redeploy; then resume graphics from branch `claude/aaa-first-view` (menu city backdrop, unfinished WIP commit).


## 2026-11-12: pod wall displays and vending (live)

- Each sleeping pod now has, built into its walls: a music player face (PR 223), an ambient-light panel (PR 224) and a vending unit (this PR). Code: `void-runner/neochinatown.js` (`drawPodPlayer`, `drawPodLights`, `drawPodVending`, `podScreen.tick`) and the pod menu in `void-runner/world-integration.js` (`podVend`).
- The two displays are status only: they follow `VoidPodMusic`; the controls stay in MUSIC & LIGHTS. They refresh on real time because the game clock stands still in `pod-waking`.
- Vending stock (20 items, names/prices/descriptions) is copied from the owner's Tesana pod source. It is flavour only: DISPENSE charges no credits and adds nothing to the inventory. Making it a real shop is an economy decision for the owner.
- Tests rely on `#pod-wake` having exactly one `<button>` (EXIT) and one `<p>`; new pod-menu controls must be `a[role=button]` / `div`.


## Snapshot 2026-11-12 (later): V1 device, hub and game API reported live

- **V1 holographic device is live** (PR #220, squash `8bb8923`; live `BUILD` `2026-11-12-v1-device-1+8bb8923640`). Verified on the live site: L opens it without pausing the world, nine apps listed, empty Mission Log, Esc goes back without opening the game menu, a portrait is rendered from the real character, no page errors. Files: `void-runner/device-v1.js` (rules, registry, saved state, map exploration, profile view-model, portrait keys), `personal-device.js` (screen), `device-portraits.js` (offscreen portraits), tests `tests/device-v1.test.cjs`, `tests/personal-device-browser.cjs`. Camera and Gallery are placeholders. NPC portraits need `NPC_MODELS` in `device-v1.js` filled with real npc-to-model pairs (empty on purpose: none is defined by the game yet). Private messages, friends and discovery are not built.
- **Render, done with the owner's approval:** game API deployed from `main` (`eeb6989`), `VOID_APPEARANCE_ENABLED=true`; hub `district-hub` runs `main`'s code with `HUB_ACCESS=registered`, `HUB_ALLOWED_UIDS` empty, `HUB_ALLOW_ANY_SIGNED_IN=false` (hub log: "registered accounts, complete District profile required"). The hub service follows branch `claude/character-creator`, which now carries a commit whose tree equals `main`; to update the hub later, either change the service's branch to `main` in the dashboard or repeat that. Pre-reset cloud saves are reported as retired (the owner accepted the reset).
- **Handle registry** (`blackout_api.py`) synced to the runtime's version (PR #219).
- **Trading stays off:** only the window and a test-only practice ledger exist; real trading needs server-kept inventory and credits (propose a design first).
- **Never verified by anyone yet:** a real sign-in, two real players meeting, chat, and looks syncing online. The sandbox cannot reach Firebase or onrender.com; ask the owner what he saw.

**Next:** fix whatever the owner reports from the first real two-player test; pod exit faces a dark wall; master specification Phase 1 (vestibule loading only with both doors closed); Sleeping Pod visual audit against the Tesana ZIP.

## Snapshot 2026-11-12: District runtime update (historical)

PR #217 (squash `56a9a7e`) brought the game runtime, hub and tests from `codex/first-player-experience-repair` (`086f7b2`) onto `main` as one unit; website pages, the homepage ENTER entrance and the favicon were kept from `main`. Verified on https://thedarknetdistrict.com in a real browser: phone gate (2 requests, no game files), ENTER, creator first, **ten personal pods** (pod card: EXIT POD / MUSIC & LIGHTS / LOOK INSIDE), walking, no page errors, no missing files. Live `BUILD` = `2026-11-12-district-runtime-1+56a9a7efc4`.

So the 2026-11-11 list below is partly done: the ten pods and entrance fix are live. District chat code (`void-runner/district-chat.js`) is live too, but only shows when connected to the hub, and the hub on Render still runs `4c60781` with a one-account allow-list and no chat support: **chat does not work online until the hub is redeployed from `main` and `HUB_ACCESS=registered` is set** (the owner's Render action; see `HUB_RENDER_SETTINGS.md`). Share Links are retired on `main` (files removed).

**Server:** `void_runner_api.py` on `main` now contains `/character`, `/character/appearance` (flag `VOID_APPEARANCE_ENABLED`, off) and the campaign-epoch handling of old cloud saves (`is_current_save`: pre-reset cloud saves are reported as retired, not deleted). **The Render game API has NOT been redeployed** and still runs the 2026-11-01 code. A Render deploy from `main` would now switch that behaviour on: review it with the owner first.

**Not tested live:** sign-in, cloud saves and purchases (the sandbox cannot reach Firebase). Tests adjusted in #217: older assertions that the homepage has no game entrance were removed or updated; the website Sleeping Pod page still has its own song list (`tests/music-catalog.test.cjs` notes this).

**Next:** (1) V1 device (`claude/v1-device`): fix Esc opening the game menu, port its new files onto `main`, publish. (2) Hub redeploy + registered access for chat. (3) Game API deploy decision. (4) Master specification Phase 1 (vestibule).

## Snapshot 2026-11-11: live state that day (historical)

**Policy from the owner (2026-11-11):** the live site is the test environment; there is no staging site. Verified, production-compatible work may be merged and deployed. Do not blindly merge large PRs, overwrite newer work with older, break sign-in/saves/purchases, change production databases or secrets, or buy services.

**Live now (verified in a real browser against https://thedarknetdistrict.com):** `main` = the squash of PR #214 on top of #215 and #212. Homepage ENTER logo opens `void-runner.html`; phones get the "desktop experience" page and download no game files (2 requests); desktop: menu, New Campaign, character creator first (hairstyle re-fit confirmed), Sleeping Pod 01, walking in the District interior, no missions, no ship, no page errors. Favicon files and links are live (PR #214). The two missing pod textures are live (PR #215).

**Deploy facts:** merging to `main` triggers "Deploy site" (GitHub Pages). The deploy of `fd626f7` had timed out on GitHub's side and the site was one commit behind until it was re-run; **always confirm the live `BUILD` stamp** (`void-runner-sw.js` shows `...+<commit>`), never assume. The CI job "Babylon stabilization smoke" can fail at `playwright install` (apt exit 100): that is infrastructure, not a test failure. Render: game API `the-darknet-district-site` deploys from `main` with auto-deploy OFF (so it is still the older API: no `/character`, no `/character/appearance`); hub `district-hub` runs commit `4c60781` from `claude/character-creator` with a one-account allow-list.

**What PR #212 did NOT include (still on branches, newer than what is live):**
- `codex/first-player-experience-repair` (`086f7b2`): ten personal Sleeping Pods with their own music and lighting controls, the entrance collision fix. Live has ONE pod and the music screen on the public wall. This is the highest-value port.
- `claude/public-multiplayer` (PR #199): hub `HUB_ACCESS=registered`, District text chat, mute/block/report. Live has the multiplayer client with `LIVE_HUB` set but it is opt-in from Settings and the hub admits one account; no chat.
- `claude/v1-device` (work in progress, pushed): V1 holographic device (`void-runner/device-v1.js`, `personal-device.js`, `device-portraits.js`, tests). Known open bug: Esc inside the device also opens the game menu (mode becomes `menu`); the browser test `tests/personal-device-browser.cjs` passes up to that step. It is based on the first-player-repair branch, not on `main`: port the new files onto `main` rather than merging the branch.
- Server: appearance persistence and the `/character` endpoints exist only on branches; needs a Render API deploy decision (ask the owner: it changes the production API).

**Known live issues:** the player leaves the pod facing a dark wall (first view is nearly black); `tests.test_void_runner_api` Stripe webhook test fails with the installed Stripe version (pre-existing); characters exceed polygon targets; outfits and shoes are presets.

**Not started (planning only):** The owner's master specification of 2026-11-10 (living NPC tiers, Dax, shared social network, photography, bounties, device manufacturers, neural interface, Android companion app, vestibule door-locked loading sequence). It is a long-term specification, not authorisation to build everything; start with its Phase 1 (vestibule sequence audit) after the pod port.

**Recommended order:** (1) port the ten-pod and entrance repairs onto `main`, test, publish; (2) finish and publish the V1 device; (3) chat and registered-account hub (needs the hub redeploy and the owner's Render change); (4) spec Phase 1.


**Updated:** November 10, 2026  
**Repository:** `Smartsec916/the-darknet-district-site`  
**Current integration PR:** [#212](https://github.com/Smartsec916/the-darknet-district-site/pull/212) — draft; branch `integration/district-entry-safe-rollout-20261110`.  
**Authoritative workflow:** Read `CLAUDE.md`, `AGENTS.md`, `VOID_RUNNER_HANDOFF.md`, and `docs/development/AI_ROADMAP.md`. This document supersedes the October-era campaign *status* sections of the legacy handoff, not its historical canon records.

## Verified status at handoff

- PR #212 head checked: `e3e0ba1db9b9ff73e3929e4e65f4898ed5815ae8`.
- GitHub Actions **Tests** run [42893600023](https://github.com/Smartsec916/the-darknet-district-site/actions/runs/42893600023) completed **success**: Node unit tests, Python API tests, and Babylon stabilization smoke all passed.
- GitHub Actions **Deploy site** run [42893600016](https://github.com/Smartsec916/the-darknet-district-site/actions/runs/42893600016) completed **success for build**; the **deploy job was skipped** because this was a PR run.
- **Passing CI is not a production release or proof of all manual gameplay flows.** PR #212 remained **draft and unmerged** at this check. No claim that its contents are live.
- The new District game source, gated desktop entry, nine binary hairstyle GLBs, appearance registry/fit metadata, guest-mode guards, social/share protection code, and associated tests have been integrated on the draft branch.
- The read-only admin inventory was regenerated from the source and validated. Do not confuse that **game content registry** with real Shopify/store merchandise.
- The first-time character prompt was moved before EXIT POD; verify in a real browser after login. The browser stabilization smoke passed, but it does not independently prove every player-facing path.

## Current approved design / non-negotiables

1. The game is **The Darknet District**, set in **NeoChinatown, Tessaly System**. No Earth/Sacramento/Sol setting. Keep stable historical internal IDs only where save compatibility depends on them.
2. Desktop/capable Windows handheld users enter from the current homepage's subtle green logo / **ENTER** control. Keep the top navigation. **Phones remain on the normal mobile site and must not download the full 3D game**; preserve the device gate.
3. New/returning players enter **their own Sleeping Pod** on login/reconnect. New players create/customize their appearance **before exiting the pod**, not after. Validate clothing color, hairstyle, saved appearance, music controls, pod reentry, and collision/doors.
4. **No active new-campaign missions** and **no starting ship**; preserve mission NPCs for future local NeoChinatown missions. Existing legacy save backups are retained, but pre-reset saves are intentionally rejected by the new campaign epoch; do not silently undo this reset. Independently review cloud save/API compatibility before rollout.
5. Admin-only jump/teleport features remain restricted. No public share-link privilege or guest-account save bypass.
6. Indoor District and exterior street are separate load/scene areas via vestibule. Iris and Admin remain in-game NPCs; do **not** inject the separate website Iris chatbot into the 3D game. Sleeping Pod music belongs inside individual pods, not room-wall public players.
7. Multiplayer is designed for automatic instance joining and compatible Firebase identity; do not enable server-side character synchronization, trade or public messaging before validating backend authorization/security.
8. User permits **removing unfinished in-game store items** if necessary. This does **not** authorize removing actual website store products, Shopify workflows, paid entitlements, licensing or payment systems. No inventory deletion was required for the CI fixes.

## What was completed on draft PR #212

- Reconciled the updated game entrypoint and many runtime scripts selectively (do not wholesale merge `claude/character-creator`).
- Imported nine 3D hair GLBs **as binary Git blobs**. Keep private licensed models out of public Git and respect licensing.
- Restored guest guards and developer-only Share Links controls; synchronized `void-runner.html` and `static/void-runner.html`.
- Updated Arcade to remove the retired Void Runner listing; preserved the live-approved homepage look.
- Restored standalone Sleeping Pod website Iris widget and adjusted regression tests so homepage styling is not mistaken for a chat UI change.
- Reconciled tests with the November campaign reset and refreshed the read-only `void_runner_admin_inventory.json` projection, without removing website merchandise.
- First-time creator now opens before leaving the Sleeping Pod; stabilization browser test was updated to recognize the creator/pod-wake stages.

## Remaining before any production merge

- Perform human/browser acceptance on actual Windows desktop / ROG Ally and phone: entry device gate, sign-in/guest/new account, server permissions, creator selection/preview, changing hair/clothing colors, first pod wake, saved appearance, reconnect to own pod, transitions, inventory preservation, kiosk/VR/media behavior, and regressions.
- Confirm that server-side saves, Firebase rules, multiplayer endpoint and Render service configuration are release compatible. Avoid running write tests against production.
- Check service-worker `BUILD` and cache-busting; ensure `static/void-runner.html` remains byte-identical to root page, and validate asset manifests / licensed assets.
- Review exact PR diff vs current `main` for changes arriving after this handoff; old PRs (#176, #177, #178, #180 and others) may be superseded. No blind merges.
- User has said **"push anything ready to live"**; this grants interest in a vetted partial release, **not** a mandate to merge unfinished PR #212 wholesale. Isolate independently tested changes if possible. Do not declare deployment without checking the actual live deployment result; otherwise report the blocker and keep draft.
- Do not modify production databases, buy services, expose secrets, or replace commercial asset files without explicit authorization.

## Next agent: recommended sequence

1. Fetch latest `main`, PR #212 and current GitHub Actions results; do not assume the above commit is still the head.
2. Check `docs/development/AI_ROADMAP.md` and the outstanding acceptance cases.
3. Test priority journeys against a **nonproduction** origin or local server. Fix verified issues in the integration branch and run the same CI.
4. Identify small independently releasable work. Only merge/deploy a specifically verified, safe scope when authorized; keep the larger PR draft until acceptance.
5. Update this handoff with commit SHA, run IDs, outcomes, new blockers and release status after each meaningful milestone.

**For historical story decisions and older implementation notes:** `VOID_RUNNER_HANDOFF.md` remains reference material, but its October 15 `main` SHA, tutorial-first start and old mission roadmap are **not current**.
