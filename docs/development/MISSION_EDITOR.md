# Mission Editor (Developer Tools > Mission Editor)

Built 17 Nov 2026 on branch `claude/mission-editor-1` (build `2026-11-17-mission-editor-1`), merged as #344. Second pass (naming trees, new trees, givers, ships, routes, tree links): branch `claude/mission-editor-2`, build `2026-11-17-mission-editor-3`, pushed, no PR, not merged.

## Twenty-fourth pass (19 Nov 2026): zones (Friendly / Neutral / Hostile), armed people and the "Change zone" block

Branch `claude/pistol-zones`, build `2026-11-19-pistol-zones-1`. The owner: Admin sells a pistol; in NeoChinatown it can be carried but not fired; a green FRIENDLY, orange NEUTRAL, red HOSTILE indicator at the top left; "let me change a room or area from friendly to hostile in the mission timeline". He decides which places are which: **everything starts Friendly**.

### How to use it (plain steps)

1. **Developer Tools > ZONES** (new tab): every NeoChinatown area (Old Town, Main Street, the District, NULL, The Avenue …) and every kind of location (office floor, server room, apartments, hallways …) with a Friendly / Neutral / Hostile list. Change one and it is saved in your draft. Try it with PLAY in the Mission Editor; PUBLISH sends it to players (the server checks it).
2. **A mission's "Zones and armed people"** (under every tree mission, Blocks and Form view):
   - *If the player is taken down*: they try again (outside the location, full health) or the mission fails (it goes back to its giver).
   - *This mission's locations*: the zone of the whole location and of each room (Normal = what the Zones table says).
   - *City areas while this mission runs*: add an area and choose its zone; it goes back to normal when the mission ends.
   - *Armed people*: + ARMED PERSON, then the figure (security guard, mercenary, enforcer), the room, guards the spot / patrols (route: `x,z; x,z` in metres inside the room; the room's size is shown), where they stand and which way they face. In a Hostile room they attack on sight; in a Neutral one only after the player fires; never in a Friendly one.
3. **The Zone block** (Blocks view: + ADD A BLOCK › Zone; Form view: step kind "Change zone"): choose a room or location of this mission or a city area, Friendly / Neutral / Hostile, "until the mission ends" or until a later step, and optionally "Bring in the armed people placed there". It is done the moment the mission reaches it; the chip changes at once if the player is there.
4. **Combat Balance > On foot**: the pistol's price and damage, the safety catch (1 = on), the safety window, how long guards stay angry, how far civilians run, the detection range and cone, the enemies' health, damage, accuracy, reaction time and speed.

What players see: drawing or holstering never provokes anyone and never fails a step. Friendly: the trigger only says "Weapons are locked here." Neutral with the safety catch on: the first press says "NEUTRAL AREA — firing will make people attack you. Press fire again to shoot."; a second press within the safety window fires. No player-versus-player damage anywhere.

### For Claude and Codex

Rules and checks: `void-runner/zones.js` (pure; `tests/zones.test.cjs`); game: `zone-integration.js` (chip, firing gate, enemies with the Skirmish AI, civilians flee through `npc-device.js` spectacle `{flee:true}`, taken down); editor: `zone-editor.js` (tab, mission panel, step fields), `mission-blocks.js` / `mission-blocks-view.js` (Zone block), `mission-editor.js` (Form view). Data: `content.zones` {areas, modules}; `mission.combat` {areas, places, armed, onDeath}; step `{kind:'zone', target ('<loc>', '<loc>/<module>' or 'area:<place>'), zone, until?, spawn?}`; workspace key `zones`. Server: `void_runner_live_content.py` `zone_table_problems`, `combat_problems`, `zone_step_problems`, `zone_shape_problems` (`tests/test_zones.py`). Browser walkthrough: `tests/zones-browser.cjs`.
## Twenty-third pass (19 Nov 2026): places picked by name in "Go into" / "Use" / "Hack" steps; when a denied offer comes back

Branch `claude/deny-retry-place-words`, build `2026-11-19-deny-retry-1`, pushed, no PR, not merged. The owner: a "Go into" step for an office said "Go into the apartment": "I won't remember this. Can it be in a drop-down?"; and of a walked-near offer the player denies: "Maybe set a time for return, or remove after".

### How to use it (plain steps)

1. **Go into / Use something / Hack:** the step has ONE list of this mission's places by their real names: "Office floor (No. 13, The Avenue, offices)", "Server room (…)", "Elevator cab, floor B1 (…)", "Rundown apartment 104 (…)", "Container apartment, regular (…)", and for Go into "Anywhere inside (…)". Pick one; the Mission Log words are written for you ("Go into the office floor", "Use the server rack in the server room", "Hack the access point at the door between the office hallway and the office floor"). Change the place and the words follow, as long as they are still the automatic ones. Type your own words and they are kept; a small **USE THE AUTOMATIC WORDS** button puts the made words back. The same list is in the Form view, the Blocks view and "Make a mission" (an office template: which room).
2. **On DENY** (any offer that asks ACCEPT / DENY, in person, by message, call, banner or walked near): **Offer again after a number of minutes** (1 to 120, default 10; minutes of play: they count only while the player is in the world, not in menus, conversations or a hidden tab; a reload keeps the count; a walked-near offer also needs the player to walk out of its distance and come back), **Offer again after the next pod exit** (for a message / call / banner / walk-near this is what DENY always did; an offer in person also has "the next time they talk to them", what it always did), **Never offer again (remove it)**, or **Start another mission**. Missions made before keep what they did.
3. A giver who **waits at a spot** for that mission goes about her own routine while the offer waits (and for good after "never"), then walks back to her spot when it can be offered again. She is never moved in or out of the player's view: a move she cannot walk is held until she is out of sight (and the new spot is out of sight too).
4. Testing: in PLAY THIS DRAFT the banner shows **SKIP THE WAIT (m:ss)** while a denied offer is waiting; it ends the wait at once.

### For Claude and Codex

- Places: `mission-blocks.js` `placeOptions(m, kind)`, `placeValue`, `placeSet`, `placeWords(o, m)`, `wordsAuto` (empty, the made words, or the older fixed words `LEGACY_WORDS`), `rewordAfter(o, m, fn)`, `hackOptions(m)`, `apName`. Data unchanged: `o.apt`, `o.mod`, `o.object`, `o.ap`. Editor: `mission-editor.js placeRow`, `autoWordsBtn` (in `blocksKit`), the hack list uses `hackOptions`; a kind change re-words automatic words. Wizard: `editor-wizard.js aptRecord`, `aptWords`, `aptChoices`, step `s.mod` built into `o.mod`.
- DENY: `mission-content.js` `DENY=['again','pod','after','never','start']`, `DENY_MIN` {1, 120, 10}, `start.denyMinutes` (only with 'after'), `denyWaits`, `denyTick(s, env, wholeSeconds, skip)`, `denyRearm(s, env, near)`. `story.flags.md_<mission>`: 'never' | 'later' (next pod exit) | a safe integer (seconds of play left) | 'away' (walked-near: waiting for the player to leave its distance). `waitingAt` skips a mission while it is denied. `live-content.js denyClock` (4 times a second, `nearBlocked` + hidden tab stop it, saves every 5 s outside test sessions), `skipButton` (draft banner `[data-deny-skip]`), `nearTick` calls `denyRearm`, a "DECLINED · …" notice says when it comes back. Server: `void_runner_live_content.py` `DENY`, `DENY_MIN_MIN/MAX`, `ask_problems` and `workspace_money_problems`.
- Never popped in or out in view: `ncz-street-pair.js` `held` / `holdCheck` / `inView` (camera frustum + show radius) / `rejoin` (Reverie, Lace, the cat); `npc-made.js` `p.hold` and `p.going` (a made character that should leave stays on its last plan until unseen; its TALK prompt goes meanwhile).
- Tests: `tests/deny-retry.test.cjs`, `tests/test_deny_retry.py`, browser `tests/deny-retry-browser.cjs` (office words from the list; walked-near DENY -> SKIP THE WAIT -> walk away and back -> offered again; a real minute of play -> offered again; "never" -> not offered).
- Browser `tests/giver-hold-browser.cjs`: a plan change that would move Reverie or Lace out of the Avenue while the player looks at her is held, and released once the camera turns away; a walkable spot is never held. This also answers the QA pass's open question (a denied walked-near offer could only come back after a pod exit).
- Not verified: the cat and made givers' hold in a browser (same code shape); the walk back after a real wait with a "Giver waits at" spot; real hardware; VR.

## Twenty-second pass (19 Nov 2026): camera feeds — the Blackrock Cult Room

The owner's queued room: seen only through a hacked security camera, recorded to the V1 Gallery. Details: `docs/development/BLACKROCK_CULT_ROOM.md`.

### How to use it (plain steps)

1. Open the mission. Under **Add a location**, choose the category **Other**, then **Blackrock cult room (camera feed only)**, then **+ ADD**. A **CAMERA FEED “cam1”** card appears. (It is not a place the player walks into and it joins no other module.)
2. Add a step **Hack the access point** (in the Blocks view: + ADD A BLOCK › Action › Hack the access point). Choose the access point where the player hacks the camera (any street door, or a door of one of the mission's apartments or locations), then **Camera feed: shows camera feed “cam1”**. (No feed yet? Press **+ ADD THE BLACKROCK CULT ROOM FEED** right there.) "Opens that door for them" is off for a camera hack; tick it if the hack should also open the door.
3. Open **EDIT THE SCENE** under the step (or use the feed's card under the locations). The scene is already your choreography of 19 Nov 2026. Each beat plays after the one above it, after its own **pause before**:
   - **A line:** choose who speaks (the initiate, robed figure 1 to 6, or all six together), write the words, and press **IMPORT VOICE FILE** for them (as for every other line). An empty line is silence and nothing is shown on the recording. "lasts (s)" can be left on auto. An animation on a line: talk, laugh, read, shock, stand, idle (the initiate cannot play one while he is kneeling).
   - **Timing and movement:** the pause before each beat, the scene's **walking speed** (0.5 m/s, about half a normal walk) and the **circle radius**, a speed on the entry, a walk or the exit, the **gap in the exit line**, how long a turn takes and what they turn to face.
   - **+ ADD A BEAT** (choose the kind first), **↑ ↓** to move one, **×** to remove one, **RESET TO THE OWNER'S CHOREOGRAPHY** to start again (UNDO brings your version back).
   - The card says how long the scene lasts and how many lines are still empty, or what to fix in plain words (for example "the initiate must rise first").
4. **▶ PREVIEW THE SCENE** plays it in the game through the camera, without recording. **PLAY THIS DRAFT** plays the whole mission: hack the camera, watch, the video lands in the V1 Gallery and the step is done.

### For Claude and Codex

`void-runner/cult-room.js` (rules, timeline, choreography maths), `cult-room-build.js` (the 3D room and the seven figures), `camera-feed.js` (the feed, the pause, the recording, the mission hook), `cult-room-editor.js` (this card; loaded with the editor). Wired in `module-editor.js` (Other > the feed room, `create`), `mission-editor.js` (`hackRow` adds the feed choice and the scene editor; `aptPanel` lists the feeds; `treeLineText` reads a feed line for IMPORT VOICE FILE, key `tree:<mission>/feed/<feed>/<beat>`), `mission-content.js` (mission key `feeds`, step key `feed`, the event `feed`), `apartments.js` (`hacksNow` carries the feed; a camera hack opens no door unless `unlock:true`), `live-content.js` (`feedSaved`), `device-gallery.js` (videos). Server: `void_runner_live_content.py feed_problems`, `void_runner_drafts.py`. Tests: `tests/cult-room.test.cjs`, `tests/test_cult_room.py`, `tests/cult-room-browser.cjs`. A voice file is keyed by the beat's place in the list: moving a line with ↑ ↓ after importing its voice shows "text changed" until it is imported again.
## NPC voice summary (19 Nov 2026, branch `claude/npc-voice-summary`, build `2026-11-19-npc-voice-summary-1`)

The owner: "In the NPC editor when you select an NPC show which Elevenlabs voice was selected for them. Maybe link to it".

- **Top of every NPC's page** (Developer tools > NPCs, the About box, Basic and Advanced): `Voice: ElevenLabs — <name> (<model, e.g. Eleven v4>) · LISTEN ON ELEVENLABS ↗ · your draft choice / saved in the voice file`. The link opens `https://elevenlabs.io/voices/<voiceId>` in a new tab (`rel=noopener noreferrer`). Kokoro: `Voice: free local voice <name> (locked)` (plus the recorded lines' Kokoro voice); nothing: `Voice: none yet — choose one in Lines & voice`.
- **NPC list:** an **EL** badge after every name with an ElevenLabs voice (hover: the voice and model).
- **Mission Editor giver card:** its Voice box already named the voice and linked to it; it now names the model too.
- Lace, Reverie and Dax show the voices chosen for them in `tools/audio/revoice-engines.json`. Code: `npc-voices.js summary()` / `modelLabel()` (pure), `mission-editor.js voiceSummary()` (shared), `npc-editor.js` About and list. No API calls, nothing generated or spent.
- Tests: `tests/npc-voice-summary.test.cjs`, browser `tests/npc-voice-summary-browser.cjs` (passes, offline, no request to ElevenLabs); `tests/npc-voices-browser.cjs` updated (Reverie now has a voice in the file).

## Twenty-first pass (19 Nov 2026): locations built from modules (offices, a server room, shops, an elevator)

The owner: "in the mission editor i need to be able to add locations by type: housing, commercial, other, office and commercial style hallways ... an office building interior ... a server room with server racks ... connect these areas together so make sure they fit ... elevator ... like modules". Details: `docs/development/MODULES.md`.

### How to use it (plain steps)

1. Open a mission. Under "Apartments for this mission", find **Add a location**: choose a category (Housing, Commercial, Office, Server room, Hallways, Elevator, Other), then the module, then press **+ ADD**. A new location card opens.
2. Choose its **street door** from the list (office entrances are on The Avenue's west end, shop back entrances in Old Town and Far South; any apartment-building door works too).
3. Add more modules with **Add** on the card. "joins at" picks the free door the new module goes against (or leave it on "the first free door that fits"). Modules always fit: their doors meet.
4. The **plan** shows the floor from above. Click a module to select it: the arrows move it, **TURN** turns it, **REMOVE** takes it out. Green marks are doors between modules, amber the entrance, red a locked door.
5. For more floors: add an **Elevator cab** where the lift should be, then **+ FLOOR BELOW** or **+ FLOOR ABOVE**; the new floor has the same cab; add modules at its door. The floor buttons above the plan switch floors.
6. In the selected module: **Lights start On / Off**, **Screens start On / Off** (where it has screens), **MAKE ENTRANCE** on a free door, **locked until hacked** on a door, **+ ITEM** (placed items, for later).
7. **Connections** join a door to a door that is not next to it (a short fade in the game): a housing hallway's door to an apartment, or an outside door to an apartment.
8. Steps: **Go into an apartment** (choose the location, then "any room" or one room), **Use something** (choose the location, the room, then the thing), **Hack the access point** (every door of the location is in the list, from either side).
9. The card says "Everything fits" or lists what to fix. **JUMP INSIDE** walks in at once (a test, nothing saved); PLAY THIS DRAFT plays the mission.
10. Quicker: "start again from a template" on the card (office; office with a server room downstairs; shop, bar, clinic; storage). In the **Blocks view**: + ADD A BLOCK › Location › Build a location from modules. In **Make a mission**: "An apartment for this mission" › what it is.
11. Older apartments keep working. **CONVERT THESE APARTMENTS TO MODULES** (optional) turns them into locations.

### For Claude and Codex

- `void-runner/module-editor.js` (loaded with the editor scripts, before the Blocks view): `card`, `picker`, `create`, `stepMod`, `objects`, `accessPoints`. The rules are `void-runner/modules.js` (`addModule`, `attach`, `freeSockets`, `problems`, `template`, `migrateMission`).
- `mission-editor.js aptPanel` shows a location card for an entry with `modules`; `jumpApt` enters a location through `VoidModules.enter`. Guide me key `step-mod` (`[data-me-step-mod]`).
- Blocks: `mission-blocks.js` second level `location`; `mission-blocks-view.js aptBlock` shows the card; the step fields add the room picker.
- Make a mission: `a.apt.template` (editor-home.js, editor-wizard.js build: `VoidModules.template`).

## Twentieth pass (19 Nov 2026): the Blocks view, and ACCEPT / DENY anywhere in a mission

The owner: "also to put the Accept/Deny the mission anywhere in the mission timeline. it would also be nice if in the mission editor were in blocks. i create the next block by selecting what kind it is. an action, words, who, an item, a time, etc, adding another npc. color coded based on who and what type. so the player would get a blue block within that block i selected an action, actions get an orange block so within the blue block there would be a orange block, etc". Branch `claude/mission-blocks`, build `2026-11-19-mission-blocks-1`. Pushed, no PR, not merged.

### How to use it (plain steps)

1. Open a mission. Under its name there is a switch: **Blocks | Form**. Both show the SAME mission; a change in one is in the other at once. In Basic mode a mission opens in Blocks; in Advanced, in Form; the switch remembers your last choice in this browser. **Make a mission** opens the new mission in Blocks.
2. The mission reads from top to bottom, in the order it plays: **START** (who gives it, what they say when offering it, and the ACCEPT / DENY question of the offer if it asks), then one block per step, then **END** (the hand-in, if any).
3. **+ ADD A BLOCK** (the big button above END, or a small **+** between any two blocks) asks *What kind of block?*: **Who** (someone does something: the player talks to them, they play an animation, lead the way, follow the player, ride a cab; or *The player …*), **Words** (someone says something: in person, as a Comms call, as a message), **Action** (go to an area, go into or leave a place, take or send a photo, pet the street cat, go into / use something in an apartment, hack an access point, follow, cabs, an animation), **Item** (buy, deliver, the player gets credits / a ship / a contact here, the player pays credits here), **Time** (wait a number of seconds), **Ask ACCEPT / DENY**, **Apartment**, **Add another NPC** (bring someone new in: the player talks to them next). Then choose exactly what, and who. The new block opens and Guide me points at its first empty box.
4. **Colours.** The coloured left edge and the round name chip say **WHO** (the player is always blue; every character has their own colour, the same everywhere, and no two people of one mission share one). The header says **WHAT**, with its colour, its icon and its word: WHO, WORDS (grey-white), ACTION (orange), ITEM (green), TIME (purple), ASK (yellow), APARTMENT (teal), grey *FORM VIEW ONLY*. Blocks sit inside blocks: Lace's block holds her WORDS; a WORDS block holds the orange ACTION she does while saying it ("While saying this, Lace does: Shrug"); the player's reply is a blue block inside hers; the player's "Go to The Port" is a blue block holding an orange ACTION block. "What the colours mean" (under the names) explains them.
5. **Words.** In a block: **+ WORDS FOR <NAME>**, **+ PLAYER REPLY** (blue), **+ another character says…**. Each line has ↑ ↓ ×, its Timing (wait before, show for), IMPORT VOICE FILE and, for a character, the animation while saying it.
6. **Move** a block by dragging its ⠿ handle (the gap or the half of a block under the pointer lights up; Esc cancels), or with ↑ ↓. **FOLD** hides a block's details. **⧉** copies a block (right below it). **×** deletes it; the line that appears has **UNDO** (as does UNDO at the top right and Ctrl+Z).
7. **Where a reward sits matters.** An ITEM block (credits, a ship, a contact, a story flag …) is given when the block ABOVE it is done; below END it is given when the mission is done. An APARTMENT block is open from the block above it (or from the start) until the mission ends. Moving a step leaves the rewards where they are on the timeline. A reward cannot go above the first step (it says why).
8. **Problems** show on the block itself: a red outline and "To fix: …" in plain words (the same check as PLAY and PUBLISH).
9. A step the Blocks view does not show yet (a "needs a code change" kind) is a grey block: kept exactly as it is, movable, and **EDIT IN FORM VIEW** opens it there.

**ACCEPT / DENY anywhere in the mission (new step: "Ask the player: ACCEPT or DENY").** Add it with + ADD A BLOCK › Ask ACCEPT / DENY (or in the Form view, Kind of step). Write **the question** (your words; voice tags allowed), optionally who asks (the giver by default) and the two button words (default ACCEPT / DENY). **On DENY:** *End the mission* (normal: it stops and goes back to its giver, who offers it again), *Skip ahead to a later block* (the blocks in between are skipped and give nothing), *Go back to an earlier block* (the player does those again), or *Start another tree* (this mission ends; that tree's first mission starts). **ACCEPT costs** (optional): credits taken once when the player presses ACCEPT, never below 0 (with too few, ACCEPT is greyed: "YOU NEED N CR"). "After ACCEPT" and "After DENY" hold what is said then. In the game the mission waits at the question: the choice window shows once no conversation or menu is open (the timers of the block apply: a "Wait before this block" delays it). The offer's own ACCEPT / DENY (How this mission starts) and its cost rules are unchanged.

### For Claude and Codex

- `void-runner/mission-blocks.js` (pure, Node-tested): `toBlocks(m)` / `fromBlocks(model, m)` (the timeline: `start`, `step:<id>`, `apt:<id>`, `unlock:<n>`, `end`; an unlock / apartment anchors to the step above it: `when` / `from`, kept as stored unless moved; dangling ones are kept and flagged), `move`, `nudge`, `insert`, `remove`, `duplicate`, `stepAbove`, `orderProblem`, `stepFor` / `autoLabel` (new blocks in the draft shape), `TYPES` (colour + icon + word), `PLAYER` / `PALETTE`, `whoColor`, `castColors`, `stepWho`, `typeOf`, `lineSets`, `lineGroups`, `cast`, `problems(m, treeNeeds)` (per block), `PICK` / `CHOICES` (the picker). No second format: the view edits the draft mission through the Mission Editor's `editTree`.
- `void-runner/mission-blocks-view.js` (browser): `VoidMissionBlocksView.on(mid)` / `set` / `openBlocks` (key `mission-editor-view` in localStorage), `toggle`, `view({t, raw, m, ed, issues, kit})`, `askFields` (shared with the Form view). Controls carry the Form view's `data-me-*` names (`data-me-tstep`, `data-me-step-npc`, `data-me-label`, `data-me-add-step`, `data-me-ending`, `data-me-apt-panel` …), so Guide me works unchanged. Drag uses pointer events (not HTML5 drag and drop). No `<header>` elements: `body.frontend header` is hidden by menu.css. `void-runner/mission-blocks.css` (linked in `void-runner.html`).
- `mission-editor.js` hooks: `blocksKit` (the Form view's pickers: npcSelect, placeSelect, animPick, escortPanel, hackRow, doorSelect, importBox, …; also `shared.blocksKit`), the switch and the Blocks view in `treeMissionCard` (the offer, apartments, steps, ending, branches and unlocks sections are the blocks), the Ask kind in `treeStepRow` (+ "What is said after DENY"), Guide me keys `step-question`, `step-goto`, `step-deny-start`. `editor-home.js`: the wizard calls `openBlocks`. `dev-tools.js editorScripts` loads mission-blocks.js and mission-blocks-view.js before mission-editor.js.
- Data: step kind `ask` {question (300), npc?, yes? / no? (20), deny?: 'end' (default) | 'skip' | 'back' | 'tree', goto (skip: a later step; back: an earlier one), denyStart (tree), price (1..100000), say (after ACCEPT), denySay (after DENY), delay?}. `mission-content.js ASK_STEP`, `checkAskStep` (going back over a step whose unlock gives credits or standing is refused), `treeStrip` (label default "Decide"), `treeNeeds`, `askNow(s, env)`, `treeEvent` events `{type:'ask-yes'|'ask-no', step:'<mission>/<step>'}` (out `answered`, `need`, `charged`, `deny`, `ended`, `refund`, `skipped`, `back`, `started`), flag `story.flags.ma_<mission>_<step>` (the price paid, once). `mission-givers.js STEP_KINDS` lists it. Game: `live-content.js askTick` (every 250 ms; talk-choice.js window; cost card with the price; "MISSION ENDED" / "back to:" notices). Server: `void_runner_live_content.py ask_step_problems` (+ `ASK_STEP_KEYS`), `workspace_money_problems` (the editor's server copy: price, labels, DENY); admin inventory `missionEditor.stepKinds`.
- Tests: `tests/mission-blocks.test.cjs` (round trip of every shipped / wizard / fixture mission, the timeline, moves and rewards, colours, the ask check and runtime), `tests/test_mission_blocks.py`, browser `tests/mission-blocks-browser.cjs` (`PART=editor` for the editor only). The older Form-view browser tests open the Form view (an init script sets `mission-editor-view` to `form` when it is not set).
- Not representable in blocks yet (grey or Form view only): steps of kinds the game cannot run ("needs a code change"), Branches (the design note), how a mission starts and its ACCEPT / DENY settings, the "Giver waits at" map, an apartment's map, lights and screen, its items; a step's "If the player comes too soon" lines are under "More". "Take an item from the player" and "only at a time of the in-game day" are listed in the picker as not in the game yet.
- Not verified: real hardware; VR; touch screens (pointer events, untested); a price on a mid-mission ACCEPT in a browser (unit-tested); DENY skip / back / start another tree in a browser (unit-tested); publishing with the server switched on.

## Nineteenth pass (19 Nov 2026): PLAY FROM THE START OF THIS TREE; the apartments panel always shows; an apartment in "Make a mission"

Branch `claude/play-tree-start`, build `2026-11-19-play-tree-1`. Pushed, no PR, not merged.

The owner: "i also don't see the apartment add in mission editor", and "play draft from the beginning of the tree".

**Play from the start of a tree.** Every tree of yours (and the Main storyline) has **PLAY FROM THE START OF THIS TREE** under its name, and the same button sits beside every mission's **PLAY THIS DRAFT**. It starts a practice game with the whole tree reset: no mission of the tree started, none of its story flags, follow / lead / cab steps, step timers, apartment hacks or switched-off lights and screens left over. It begins with the tree's first mission the way a player meets it: talk to its giver, or wait for its message, banner, walked-near start or EXIT POD. Finish it and the next mission comes as it would for a player. The banner says PLAYING DRAFT TREE FROM THE START; LEAVE DRAFT brings you back; your real save is never touched. (PLAY THIS DRAFT on a later mission still starts with the missions before it done.)

**The apartments panel.** "Apartments for this mission" (with **+ INSTANCE AN APARTMENT**) is on every mission of your own trees and the Main storyline, in Basic and Advanced, from the main menu, the pod or the street. If the door list is not ready it says "Loading the street doors…" and fills in by itself. Missions of the older game data (the archived trees, the beginner campaign) cannot hold apartments: their page says so and offers **COPY THIS MISSION INTO A NEW TREE**.

**Make a mission.** The steps page ("What must the player do?") has **An apartment for this mission (optional)**: **+ INSTANCE AN APARTMENT** adds one (style and street door, grouped by part of town; an Outskirts container door takes only the two container styles, a city door the three city styles) and the step **Go into the mission's apartment**; × removes both. More apartments, a later opening step, a lock behind a hack and items: in the Mission Editor afterwards.

**Cause of the hidden panel (for Claude and Codex).** On current `main` the panel was not hidden in any case tried in a browser (main menu, pod, Basic, Advanced): `apartments.js` is loaded with the page and its doors are pure data (street edges, `ncz-quarters.js`, the generated `npc-areas.js` obstacles), not the built scene. What did hide it: the panel was added only `if(root.VoidApartments?.doors)` (so any page where `apartments.js` was missing or late, e.g. a stale cached page from before #424, showed nothing and no message); the "Make a mission" wizard had no apartment at all (the owner works in Basic mode, where the wizard is the main path); and missions of the older trees have no panel, with no word why. Also fixed: `apartments.js doors()` cached its list even when `VoidQuarters` was not loaded yet, which would have frozen an empty list.

For Claude and Codex:
- `mission-editor.js`: `aptReady` / `aptEnsure` (loads `ncz-quarters.js`, `ncz-containers.js`, `npc-areas.js`, `apartments.js` if missing, then redraws), `aptPanel` always added (`data-me-apt-loading` while waiting); `data-me-apt-other` on non-tree missions. `startOf`, `startBtn(raw)` (`data-me-play-start=<tree>`, greyed by the first mission's blockers; `syncPlay` keeps it live), `playStart(treeId)` = `play('tree:'+first, null, {tree})` (banner / message name the tree); `shared.playStart`, `VoidMissionEditor.playStart`; `HELP.playStart`. `treeState` already builds a brand-new campaign with nothing of the tree done when no step is given.
- Every draft session (`play`) now calls `VoidLiveContent.resetRun()` (animation and step-timer countdowns, started escort steps, offer / need / walked-near memories, the plan cache) and `VoidApartments.resetRun()` (JUMP INSIDE preview, lights / screen switches) in `apply`, so a session started inside another one starts clean.
- Wizard: `editor-wizard.js` STEPS `apt-enter` (needs `apt`), answer `a.apt {style, door}`, `problems('steps')` checks it (door exists, style fits the door's family), `build()` writes `apartments:[{id:'a1', style, door}]` and the step's `apt`; `editor-home.js aptBox`. No new wizard page (PAGES unchanged).
- Tests: `tests/play-tree-start.test.cjs`, browser `tests/play-tree-start-browser.cjs`; `tests/play-stale.test.cjs` updated for `play(key,stepId,opt)`.
## Nineteenth pass (19 Nov 2026): container apartments in The Outskirts

Branch `claude/container-apartments`, build `2026-11-19-container-apartments-1`. Record: [`APARTMENTS.md`](APARTMENTS.md), "Container apartments in The Outskirts".

1. In **Apartments for this mission**, the style list now has **Container — rundown** and **Container — regular** as well as the three city styles.
2. A container style offers only the container doors in The Outskirts (the list and the map, which opens on The Outskirts); a city style offers only city doors. Changing between them clears a door of the other kind.
3. Everything else is the same: the number on its hallway door (the container hallway has four doors), open from the start or a step, locked until hacked, Lights start / Screen starts, JUMP TO THE DOOR / JUMP INSIDE, the steps Go into / Use something in / Hack the access point, Items (coming later).

## Eighteenth pass (19 Nov 2026): instance an apartment, apartment steps, hack an access point

The owner: "in the mission editor add 'instance an apartment' then I will assign it to a specific door along the street. I can add more than one apartment per mission." Branch `claude/apartments`, build `2026-11-19-apartments-1`. Full record: [`APARTMENTS.md`](APARTMENTS.md).

### How to use it (plain steps)

1. Open a mission. Above the steps there is **Apartments for this mission**. Press **+ INSTANCE AN APARTMENT**.
2. Choose its **style** (Rundown, Normal or Luxury apartment), then its **street door**: click a door on the map (the blue marks; the area list above the map picks the part of town) or choose it from the list (grouped by area, "No. 96, Main Street (normal building)"). Any style may go behind any door; the note says when the street is a different kind of neighbourhood.
3. Optional: **Number on its door in the hallway** (empty: the building's own), **open from** the mission's start or from a step (until the mission ends), **its hallway door is locked until the player hacks its access point**, **Lights start: On / Off** and **Screen starts: On / Off** (the ad screen; rundown and normal only). The player can still switch both in the game.
4. **JUMP TO THE DOOR** / **JUMP INSIDE** open a throwaway test session at the door or inside (the door is open for the test; nothing is saved).
5. Steps: **Go into an apartment** (done while the player is inside it), **Use something in an apartment** (the computer, the utility panel, the safe, the vending machine, the closet, the light switch or the ad screen), **Hack the access point** (pick the apartment's hallway door, its entry, its street door or any street door; the seconds it takes, 2 to 30; "fails if they walk away"; "opens that door for them"; **Player needs:** nothing or an item, for example the **Hacking device**, which is reserved and not sold anywhere yet).
6. **Items (coming later)** (Advanced mode): a placed item (loot, mission item, note, other) with a short label. The game shows it as a small marked case on the desk with its label; picking things up comes later.
7. A mission can have up to 4 apartments. **PLAY THIS DRAFT**: the mission's door is open (amber) for you from the moment you choose; walk in.

### For Claude and Codex

- Data: mission `apartments`, steps `apt-enter` / `apt-use` / `hack` (fields `apt`, `object`, `ap`, `hold`, `stay`, `unlock`, `needs`): `apartments.js problems()`; the same rules in `void_runner_live_content.py apartment_problems` (admin inventory `apartments`); the editor's server copy `apartment_shape_problems`.
- Editor: `mission-editor.js aptPanel`, `aptSelect`, `doorSelect`, `hackRow`, `jumpApt`; `HELP_APT`; Guide me keys `step-apt`, `step-object`, `step-ap`, `apt-door`; Basic mode hides `[data-me-apt-adv]` (the apartment's internal name and the items). Not in the wizard yet.
- Tests: `tests/apartments.test.cjs`, `tests/test_apartments.py`, browser `tests/apartments-browser.cjs`.
## Seventeenth pass (19 Nov 2026): the Mission giver creator

The owner: "also in the editor, a mission giver creator. i can select any npc, create their look based on what's available for that model, give them a device model (ie V1), a ship, other items (gun, hacking device, etc), place them in the world for a mission". Then (approved the same day): characters made with the creator may be marked adult (18+) and placed in the adult places. Branch `claude/giver-creator`, build `2026-11-19-giver-creator-1`.

### How to use it (plain steps)

1. Open **Developer tools**. On the **Start** page press **Create a mission giver** (or in **NPCs**, open "What do you want to do?" and press the same card).
2. **Model**: choose who your character is made from (street people first; every person the game has is listed). The 3D preview shows it; drag to turn it. A licensed model can only be recoloured and have accessories hidden, and is never sent to any AI tool.
3. **Name**: type their name (required: this is what players see). The role line is optional and only for you. Tick **This character is an adult (18+)** only for a grown-up (it is off by default; Reverie's and Lace's models can never be ticked).
4. **Look**: press "Show me in 3D to change the look", then hide accessories, pick colours, add creator pieces where the model allows. It changes only this character.
5. **Device**: none, V1, V2 or V3 // SHADOW (the V3's eye glows a little while they use it).
6. **Ship**: none or one of the game's ships (data for your missions; no ship appears in the world).
7. **Items**: tick what they carry. "visible on them" shows a holstered pistol on the right hip, or a hacking device in the left hand (once the game has the hacking device; until then the list says so). Everything else is data for your missions.
8. **Voice** and **Animations**: the usual Voice box (ElevenLabs or none; IMPORT VOICE FILE per line) and Add animation.
9. **Place**: pick the area on the map, then "Keep her at one spot" (click the map, turn her with the round handle) or "Make her walk a route". Then **When are they there?**: always, or only while one of your missions is in progress (optionally from one of its steps).
10. **Done**: if it says "Ready", press **Give them a mission** (the Mission Editor opens with a new mission given by them) or make one with **Make a mission**. **PLAY THIS DRAFT** and walk up to them: **TALK TO <NAME>**.

Everything is part of your DRAFT (UNDO works; Close keeps what you made). Your characters are listed in **NPCs** under **Made by you**, with a box to change device, ship, items and "when", **CHANGE STEP BY STEP** and **DELETE THIS CHARACTER**. **PUBLISH** sends them to every player with your missions.

**Places.** The same map rules as Reverie and Lace: never Milked's studios and staff rooms, the Sleeping Pod room, the Corporate District or the Temple. A character marked **adult (18+)** may also stand in Milked's side street, service alley and reception, inside NULL and at its door, the District bar, the VR area, the arcade room and the smoking terrace. Reverie, Lace and the street cat never.

### For Claude and Codex

- Data: `content.characters[id] = {name, role?, model, adult?, look?, device?, ship?, items?:[{id, show?}], when?:{mission, step?}}` (`void-runner/npc-made.js`); the placement is `content.npcs[id]` (the same plan as Reverie's: stay / path / schedule, added `anims`); the voice `content.voices[id]`. Drafts carry `characters` (local draft and the server workspace).
- `npc-paths.js setMade(chars)` makes them MOVABLE (`made:true`, `adult`, `youthful:!adult`, no ledge sit). `mission-givers.js roster({characters, npcs})` lists them (target `{action:'made-npc', character:id}`, `enter` from the placement's area). `mission-content.js check` checks them first (`madeCtx`), registers them for the rest of the check and puts the registry back; `apply` sets `env.characters` and adds them to `env.givers`; `fromDrafts` sends only finished ones (`madeReady`; `madeNeeds` says why not, also in "not applied"). Cab steps stay Reverie's and Lace's (`npc-escort.js can`); follow / lead work.
- Game: `npc-made.js` wraps `VoidStreetPair.start` (every street quarter and the District interior) and `VoidMilked.build` (reception). A figure loads only while the player is in its area and while it exists (`when`); its own look (`npc-looks.js applyLook`), its device (`npc-device.js enlist` with the tier), props built from boxes on its Hips / LeftHand bones, the plan moved by `ncz-street-pair.js routineStep`. With no mission the TALK prompt shows "…" (no words invented).
- Adult places: `npc-areas.js` rules with `adult:true` and walkable rectangles marked `adult` (NULL's floor keeps clear of its furniture from `ncz-nightclub.js solids`; the District rooms' furniture is not mapped); a new area `milked` (scene `milked`, reception only). `check(p, prefer, m, {adult, made})`, `leg(a, b, opts)`, `nearest(p, id, limit, opts)`.
- Server: `void_runner_live_content.py made_problems` / `with_made` (admin inventory `madeCharacters`: per model the actions, added animations, gestures and escort for a non-adult and an adult character, the items, ships, devices and the ids the game uses), `area_check(..., adult)`, `made_shape_problems`; `void_runner_drafts.py` keeps `characters` and allows adult characters' adult spots.
- Tests: `tests/npc-made.test.cjs`, `tests/test_npc_made.py`, browser `tests/npc-made-browser.cjs`.
- Not verified: real hardware; VR; a licensed model in a browser; publishing with the server on; the reception and the District rooms with a figure in a browser (rules unit-tested).

## Fix (19 Nov 2026): "When walked near" starts by itself

Branch `claude/near-auto-start`, build `2026-11-19-near-auto-1`. Pushed, no PR, not merged. The owner: "I noticed 'When walked near' still needs a click option by the player, even though i want it to start automatically".

**Cause.** The game itself was right: with **Ask the player: ACCEPT or DENY** off, walking near starts the mission at once (checked again in a browser for Messages, Comms call and Notification only). The click came from the question being **on** without the owner choosing it, in two editor paths: (1) changing **Starts** from "In person, asking ACCEPT / DENY" to By Messages / By Comms call / Notification only silently kept the question; (2) **Player pays** turns the question on (paying at ACCEPT needs it) and going back to **Player gets** left it on. The tick box sits above Sender / Header / Body, far from the trigger, so it was easy to miss.

**Now.**
1. Under **When walked near** one plain line says either **Starts automatically — no click** (walking near starts it at once: a notification shows and it goes into the Mission Log; nothing to press) or **Asks ACCEPT / DENY** (the mission starts only when the player presses ACCEPT), with a button **START AUTOMATICALLY INSTEAD** / **ASK ACCEPT / DENY INSTEAD**. When the player pays at ACCEPT it says so and has no button (it must ask).
2. Choosing the trigger **When walked near** makes it automatic unless the question has your own button words / DENY settings, or the player pays at ACCEPT.
3. Changing **Starts** to a device start keeps the question only when you had it on a device start already (or had set button words / DENY settings, or the player pays at ACCEPT). "In person, asking" no longer carries it over.
4. **Player gets** after **Player pays** turns the question off again if paying had turned it on (in this editing session).
5. **Make a mission**: "When the player walks near them" was already automatic unless you answer Yes to ACCEPT / DENY or the player pays; the summary now says "(starts automatically — no click)".
6. In person (with or without ACCEPT / DENY) is unchanged.

**Existing missions.** A mission keeps the question only as `start.accept: true`; nothing records whether it was ticked by you or left over from a default, so existing drafts and published missions are **not** changed. Open the mission: the line under the trigger shows "Asks ACCEPT / DENY"; press **START AUTOMATICALLY INSTEAD** and publish again.

- Code: `mission-editor.js` (`nearMode`, `payAtAccept`, `askCustom`, `forceAsk` / `unforceAsk`, the Starts and Trigger selects), `editor-home.js` (wizard summary / help). No rule or server change.
- Tests: `tests/near-auto-start.test.cjs` (7: automatic for each channel, the question, a cost at ACCEPT, in person, the wizard); browser `tests/near-auto-start-browser.cjs` (the editor paths above, then PLAY THIS DRAFT: walking within 5 m of Admin starts it with no click, no conversation, no offer window; passes).

## Sixteenth pass (19 Nov 2026): player lines, animations in lines and between steps, mission timers

The owner: "after I create a voice line, i can not create the line for the player. i also can't add animations anywhere between the steps", then "mission timers. set the amount of time between actions, lines, etc". Branch `claude/player-lines-anims`, build `2026-11-19-player-lines-1`.

**What was wrong with player lines.** Nothing was broken in the code: a player line already existed, but only as "You (the player)", the first entry of the 50-name "Who says it" list on a line made with a plain "+ LINE" button. Nothing on screen said so, a new line always started as the NPC's, the player's line then showed "no voice yet" and the line's status stayed "empty: a placeholder" after typing (it only updated on a redraw), so it looked like it did not work. Also, in the game a player line went into a separate "You" conversation thread, and an unrecorded player line could be read out by the browser's speech voice.

### How to use it (plain steps)

1. **A back-and-forth.** Under every set of lines (what the giver says when offering it, "What is said when this step is done", "If the player comes too soon", the hand-in, after DENY) there are two buttons: **+ ADD A LINE FOR <NPC>** and **+ ADD A PLAYER LINE**. Add them in the order they are said; ▲ ▼ move a line. The player's line shows as **You** in the conversation window and has no voice (the player character has none). A Comms call, a message and a photo reply come from one character only, so there the player button is greyed with the reason.
2. **An animation on a line.** Under an NPC's line: **While saying this, <NPC> does: [ … ]**. Pick a shrug, a laugh, looking about … She does it while the line is on screen, then goes back to what she was doing. Only animations that character really has are listed (her own model's, compatible animation-library ones, and for Reverie and Lace the ones added in **Developer tools > NPCs > Add animation**). Reverie and Lace: casual street animations only; the street cat has none; characters drawn by their own scene code (Milked's Eva, Zen Zephyr) have none yet and say so.
3. **An animation between steps.** **+ STEP**, kind **Someone plays an animation**: choose who, the animation, and how many seconds the mission waits (0 to 30). It plays as soon as the step before is done and the conversation is closed. Also in the "Make a mission" wizard ("Someone does an animation").
4. **Timers.** Each line has **Timing** (click to open; it says the timing in words): **Wait before this line** (0 to 60 s: the conversation shows "…" and cannot be skipped past it), **show for** (1 to 60 s: the conversation goes on by itself instead of waiting for CONTINUE; never past ACCEPT / DENY), and for a line with an animation **animation lasts** (1 to 30 s; empty: about as long as the line). Each step has **Delay before this step starts** (0 to 600 s): until then that step's person does not react and its lines are not said. New step kind **Wait (a number of seconds)** (1 to 600), optionally "only while the player stays within N m of <someone>" (also in the wizard: "Wait a number of seconds").
5. The clocks stop in the pause menu, in conversations (step delays and waits), the KeyMap, the pod wake-up, the character creator and a hidden browser tab, and a step's delay or wait carries on after a reload.

### For Claude and Codex

- Data: line `{who, text, anim?, wait?, show?, animFor?}` (`anim` never on `who:'You'`; `animFor` only with `anim`); step `delay?` (0..600, any kind); step kind `anim {npc, clip, hold 0..30}`; step kind `wait {hold 1..600, near? 1..50 with npc}`; `clip` / `hold` / `near` refused on other kinds. Ranges: `mission-content.js TIME`, `void_runner_live_content.py TIME`.
- `void-runner/npc-gestures.js` (new, pure + browser): `clipsFor(id,{plan})`, `problem`, `lookOf` (own model only; the District bartender is Nyx's model), `inventory` (admin inventory `missionEditor.gestures`), `perform(id, clip, seconds)` (the nearest crowd controller of her model; library / added clips applied first with `npc-paths.js applyAnims`).
- `crowd.js` controller `perform(name,{seconds,once})`: the scene's own `play` / `playOnce` / `walk` wait (the last one wanted comes back after); `performing`, `busy`.
- `mission-content.js`: `speak()` carries `anim`, `npc` (the speaker's id), `animFor`, `wait`, `show`, `player:true`; `animNow`, `timersNow`, `timerSet`; flags `td_<mission>_<step>` (delay seconds left; 0 = ran) and `tw_<mission>_<step>` (wait seconds left), removed when the step is done; events `{type:'anim', step}`, `{type:'wait', step}`, `{type:'timer'}`; a delayed step is skipped by every event, `auto`, `hearNext`, `animNow`, `escortNow`.
- `live-content.js`: `lineAnim` (in the renderLine wrapper), the line-wait wrapper (a silent "…" line first; `advanceSpeech` / `tickSpeech` held), the 100 ms line timer, `speakLine` silent for `player` lines, `animTick`, `timerTick` (`nearBlocked()`; `giverDistance` for "within N m"). `conversation-ui.js`: a player line is kept in the partner's thread as "You".
- Editor: `mission-editor.js linesEditor` (the two add buttons, ▲ ▼, live status chip, `animPick`, the Timing box), `treeStepRow` (anim / wait heads, delay row); `editor-wizard.js` / `editor-home.js` steps `anim` and `wait`; `mission-givers.js STEP_KINDS`.
- Server: `void_runner_live_content.py gesture_problem`, `line_time_problems`, `gesture_shape_problems` (also the editor's server copy, `void_runner_drafts.py`).
- Tests: `tests/player-lines.test.cjs`, `tests/test_player_lines.py`, browser `tests/player-lines-browser.cjs` (NPC line, player line with a 3-second wait, NPC line with a shrug; an animation step; a 2-second Wait step; passes with the bundled Chromium and software GL).
- Not verified: real hardware; VR; Reverie / Lace and library or added clips in a browser (unit-checked); "only while within N m" and a reload in the middle of a delay in a browser (unit-checked); publishing with the server switched on. Software GL runs page timers only every second or so while a screenshot renders, so the browser test allows 3 to 12 s for the 3-second wait.

## Fifteenth pass (19 Nov 2026): place Reverie, Lace and the street cat anywhere walkable

Branch `claude/pair-anywhere`, build `2026-11-19-pair-anywhere-1`. Pushed, no PR, not merged. The owner: "Let me place REVERIE or LACE anywhere".

### How to use it (plain steps)

1. Open **Developer tools > NPCs**, pick Reverie, Lace or the Street cat, and choose **Keep her at one spot** or **Make her walk a route** (or a time block in the **Daily schedule**, or a mission's **Giver waits at** in the Mission Editor).
2. Above the map, pick the **area**: The Avenue, Old Town, Far South, The Outskirts, The Port, or The Darknet District (inside). The map shows that area's pavements and floors (green where she may stand), roads, buildings and rooms, gates, furniture (orange), taxi posts and shop names.
3. Click the green ground. A click on a road, a kerb or a piece of furniture is moved to the nearest spot she can stand on (the line under the map says so). A click on a place that is never used for her is refused with the reason: **Milked** (the building, its side street, its service alley, the pavement at their mouths), **NULL** (the club and the pavement at its door), the District's **bar**, **VR play area** and **arcade room**, the **Sleeping Pod room** (the players' own pods), the smoking terrace, the Corporate District and the Temple. The District's meeting room, the security vestibule and behind the shop counter are refused too.
4. **A route stays in one area** (she cannot walk through the gates). To have her in Old Town in the morning and in the District in the evening, make a time block for each.
5. **PLAY THIS DRAFT** opens the test session in her spot's area. In the game, when her spot or time block is in another area than the Avenue, she is simply there from the start of her shift or of that block (no walk across town). Her usual routine (no placement) is still on the Avenue.
6. **Follow / lead / cab steps** ("Follow them", "They follow you", the cab rides) happen in the area she is placed in for that mission (where she waits for it, else her placement, else The Avenue): the spot must be in that area, and only cab stops of that area are offered (others greyed with the reason; none inside the District or in the Outskirts).
7. The street cat can be placed anywhere allowed too. Its usual thing still goes to whichever of Reverie and Lace is out, in whatever area she is.
8. **COPY CHATGPT PROMPT** now lists every area with its walkable rectangles, the places never used for her, and named places in every area (for example `oldtown-alley-mouth`, `outskirts-yard`, `district-store`).

### For Claude and Codex

- `void-runner/npc-areas.js` (pure, Node-tested; loaded before `npc-paths.js`): the six areas (`list`, `get`, `IDS`), each with `walk` rectangles (the game's own streets, pavements and rooms: `neochinatown.js` streets / slabs, `ncz-quarters.js` gates and taxi posts, `milked.js`, `ncz-nightclub.js`, the District plan through `toWorld`), `floors`, `roads`, `gates`, `no` (with `rule:true` for the owner's content rule), `labels`, `obstacles` and the ground height. `check(p, prefer)` -> `{ok, area, kind, why}` (kinds: ok, rule, blocked, gate, road, obstacle, post, outside), `leg(a, b)` (sampled every 0.2 m: one area, no road, rule, gate, wall or furniture), `nearest(p, area)` (snap, 8 m at most, never out of a rule zone), `areaOf`, `groundY`, `here(scene, quarter)`, `enter(area)`, `places()` (named spots), `inventory()` (admin inventory `npcPaths.areas`), `describe()` (ChatGPT prompt).
- **GEN** (the obstacle reading) is generated by `tests/npc-obstacles-browser.cjs` from the built scenes: downward rays every 0.25 m and horizontal rays at knee, waist and head height over each walkable rectangle, plus `neochinatown.js layout()` collision solids (walls, counters, benches, crates, container homes); merged into rectangles and written between `/*GEN-BEGIN*/` and `/*GEN-END*/`. Rerun it when a street or a room changes (`node tests/npc-obstacles-browser.cjs [area ...]`).
- `npc-paths.js`: `MOVABLE[*].area = 'city'`; `spotProblems` / `legProblems` use npc-areas; a path with points in two areas is refused; `planNow` returns `area`; `mapData(area)`; `pick(id, p, area)` -> `{spot, why}` (the map's snap); `inventory()` -> `movable[id].areas` and top-level `areas`. Imported models (local test only) still use the Avenue's north pavement (`AVENUE_NORTH`).
- Game: `neochinatown.js` starts the pair in every street quarter and in the District interior (`VoidStreetPair.start({..., where:{scene, quarter}})`). `ncz-street-pair.js`: `HERE` (the areas this scene has), `herArea` / `catArea` (the plan's area, else the Avenue; the cat: its plan, else hers), only those here are loaded and moved; a plan in another area, or a new spot she cannot walk to in a straight line, makes her leave and appear at the new spot; ledges only on the Avenue; ground height per spot (`groundY`); TALK / PET prompts inside the District too; `stats().here / herArea / catArea / her.area`.
- Editor: `npc-map.js` area list (`[data-npc-map-area]`), close-up with east-west and north-south panning, `lock` (a route's area), the reason / snap line (`[data-npc-map-note]`). `mission-editor.js jumpTo` enters the spot's area (street quarter or interior) and stands the player a few steps away; tree draft play of a mission given by a placed giver starts in her area.
- Server: `void_runner_live_content.py` `area_of`, `area_check` (the same decisions as `check`; a parity test runs Node), `spot_problems` / `_leg_problems` from `npcPaths.areas`, a route in one area; `forbidden_spot_problems` refuses rule spots in the editor's server copy of the draft (`void_runner_drafts.py`).
- Tests: `tests/npc-areas.test.cjs`, `tests/test_npc_areas.py`, browser `tests/npc-areas-browser.cjs` (NULL and Milked refused, a road click moved, Reverie played in Old Town and in the Outskirts).

## Fifteenth pass (19 Nov 2026): follow / lead / shared-cab steps

Branch `claude/follow-steps`, build `2026-11-19-follow-steps-1`. Pushed, no PR, not merged. Queue item 3, the "Follow / lead steps" part (the rest of item 3 is still to build).

### How to use it (plain steps)

Four new kinds of step, in a step's "Kind of step" list and in "Make a mission" (step page). They work with anyone who can walk with the player: today **Reverie, Lace and the street cat**. Everyone else is greyed in the list with the reason (their walking is fixed by other code; more people are added as the path system grows).

- **Follow them (they lead the way):** choose who, then click the map to pick the spot (drag the pink marker to move it). They wait until the player comes near, then walk there; if the player falls behind more than **"Waits when the player is more than … metres behind"** (default 8) they stop, turn and wait, and walk on when the player catches up. If the player goes further than **"The player is lost beyond … metres"** (default 40) you choose: **they stop and wait** for the player, or **the mission fails** (the player is told "MISSION FAILED"; the mission goes back to the giver, who offers it again). Done when both are at the spot.
- **They follow you:** choose who and the spot. They follow the player about 2 metres behind, walking or running to keep up (the cat at its own pace: it trots and dashes but lags behind a walking player). If they are far behind and off-screen they are put a few metres behind the player. Done when both are at the spot.
- **They call a cab, you ride together:** choose who and the cab stop. When the player comes near, they walk to the kerb and call a street taxi; when it waits they get in; the player presses BOARD TAXI (the normal fare; your developer account rides free); both get out at the stop. If the cab gives up waiting, they get out and call another.
- **You call a cab, they ride along:** choose who and the stop. They follow the player; when the player calls a taxi to that stop (CALL A TAXI or G) they get in as it waits (or as the player boards, if close by), and both get out there. A taxi to another stop: they stay out (a short notice says so).
- **Cab stops:** the stops in the quarter where she is placed for the mission (The Avenue's three unless she is placed elsewhere: see "Fifteenth pass", place anywhere walkable); stops in other quarters, the Corporate District and the Temple are greyed with the reason (Reverie and Lace stay in the city). The cat does not ride in cabs. (Text updated 19 Nov 2026 with the taxi upgrade: the wizard said "Only The Avenue's stops".)
- JUMP THERE (on a spot) opens a throwaway test session on The Avenue with that person out. PLAY THIS DRAFT works as usual. UNDO works on every change.
- Reverie and Lace: the step starts only while she is out on the street (her shift; a test play simulates a time she is out). If her shift ends during the step she finishes it, then goes.
- Multiplayer: only the player doing the mission is followed or led; other players see the person as usual (each player has their own copy of the street).

### For Claude and Codex

- `void-runner/npc-escort.js` (pure, Node-tested): `KINDS` / `IDS` (`follow-them`, `they-follow`, `their-cab`, `shared-cab`), `can(id, kind)` (npc-paths.js `MOVABLE`; the cat: no cabs), `stops(id)` (ok only for stops in the NPC's quarter; far places greyed), `settings` (wait 3..30 default 8, lost 15..150 default 40, ifLost `pause`|`fail`), `problems` / `needs` (the editor's check and Guide me keys `step-npc`, `step-spot`, `step-stop`), `spots(id)` (named spots for the wizard), the state machines `lead`, `follow` (+ `trailPush`, `behind`: the player's own trail, catch-up only off-screen and 20 m+), `cab` (`kerb`, phases ready / kerb / hail / to-cab / in-cab / out / done; `st.want='hail'`), `encode` / `decode` of `story.flags.npcEsc` (`'<mission>/<step>|<phase>|<x>|<z>'`, removed when the step ends), `inventory()` (admin inventory `npcEscort`).
- Step fields: `to:{x,z}` (follow-them, they-follow), `wait`, `lost`, `ifLost` (follow-them), `stop` (cab kinds). `mission-content.js`: `STEP_KINDS`/`ESCORT`, check, `treeNeeds`, `treeStrip`, events `{type:'escort', step}` (done) and `{type:'escort-fail', step}` (removes the mission record: offered again; `out.failed`), `escortNow(s, env)`. `mission-givers.js` STEP_KINDS (supported). Server: `void_runner_live_content.py escort_problems` (from `npcEscort` + `npcPaths`), `escort_shape_problems` (the workspace copy, `void_runner_drafts.py`). Run `node tools/admin-inventory.cjs` after changing the rules.
- Game: `live-content.js plans()` gives the NPC `{mode:'escort', kind, to, stop, set, resume}` (above "Giver waits at"); `onEscort` takes the street pair's reports (`done`, `failed`, notices) and keeps `npcEsc`. `ncz-street-pair.js escTick` runs the rules for her and the cat (frustum test, `VoidRoadTaxi.hailFor`, `VoidRoadTaxiRules.companionSeat`, out of the cab beside it away from the player); a step starts only while she is out on the street clock (`live-content.js plans()` `escOn`, `mission-givers.js onDuty`); one that has started keeps her out until it ends, even past her shift (`out()`), then she leaves; talking to her during the step stops her as usual; `stats().escort`. `road-taxi.js hailFor(at, dest, who)`.
- Editor: `mission-editor.js escortWho`, `escortPanel` (map, distances, lost choice, stops); `editor-wizard.js STEPS` (needs `escort-spot` / `escort-stop`), `editor-home.js` step page.
- Tests: `tests/npc-escort.test.cjs`, `tests/test_npc_escort.py`, browser `tests/npc-escort-browser.cjs` (`PART=editor`).

**Not verified:** real hardware; VR; Lace and the cat in a browser (same code as Reverie; the cat's rules are unit-tested); a reload in the middle of a step on a real save (the flag is unit-tested); the "mission fails" path in a browser (unit-tested); her seated pose in the cab seen only in software GL stills; walking her through other players' sessions (the street is not shared).
## Fix (19 Nov 2026): PLAY straight after typing

PLAY THIS DRAFT (and PLAY THIS DRAFT FROM HERE, Test my mission > PLAY, JUMP THERE) pressed right after typing in a box now plays exactly what was typed. Before, it could say "step 1 needs what the player must do" because it checked the mission as drawn before the typing. The PLAY button also wakes up on the keystroke that completes the mission (no pause), and typing into a freshly opened editor no longer loses the cursor after the first letter. PUBLISH and ASK THE SERVER TO CHECK re-check first if the draft changed since the check screen was drawn.

For Claude / Codex: `mission-editor.js fresh()` (blur the focused field, `rebuild()`, run a pending `guideNow`) is called first by `play` and `jumpTo`; `shared.playTree` goes through `play`; `syncPlay` keeps the PLAY buttons in step with `MC().treeBlockers` on every input; publish uses `changedSince()`; `setStatus` inserts its line instead of redrawing. Tests: `tests/play-stale.test.cjs`, browser `tests/play-stale-browser.cjs`.
## Fourteenth pass (19 Nov 2026): import a voice file for a line

Branch `claude/voice-import`, build `2026-11-19-voice-import-1`. Pushed, no PR, not merged.

### How to use it (plain steps)

1. In the **Mission Editor**, type the line in the **What they say** box (voice tags like `[whispers]` are fine). The same works for any line in **Developer tools > NPCs > Lines & voice**.
2. Go to ElevenLabs, make that line in the voice you want, and **download it** (MP3 is best).
3. Back in the editor, press **IMPORT VOICE FILE** under the line and pick the file. The editor checks that it plays, then shows **Voice: imported file**, the file name, how long it is and its size. **▶ PLAY** lets you hear it.
4. Limits: **40 seconds** at most. A file bigger than 600 KB (or an M4A / WebM) is made smaller for you automatically; it says "made smaller (Ogg Opus)". If your browser cannot do that, it tells you to download a lower-quality MP3 from ElevenLabs instead.
5. **REPLACE** picks a new file; **REMOVE** takes it off the line (UNDO puts it back).
6. If you change the words after importing, the line says **text changed since the voice was imported**: the game does not use the file for the new words. Import a new recording (REPLACE), or put the words back.
7. **PLAY THIS DRAFT** uses your file straight away (it is kept in this browser). **PUBLISH TO ALL PLAYERS** uploads the file first, then publishes; players hear it with no sign-in. The check screen lists "N imported voice file(s)".
8. The file is used exactly as it is: the character's sound effect still applies in the game (for example Zen Zephyr's monk filter or Iris's android tone).

Good to know: the file stays in the browser you imported it in until you publish. On another computer the line says the file is not in this browser: import it there again, or publish from the first computer.

### For Claude and Codex

- `void-runner/voice-imports.js` (pure + browser): `LIMIT` (40 s, 600 KB, 200 files), `sniff`, `plan`, `caps`, `record`, `recordProblems`, `clipProblems`, `status`, `contentClips`, `keyOf` (speaker normalised like mission-content.js `who`, words with voice tags removed), `sha256` (crypto.subtle, pure fallback), `oggOpus` / `oggInfo` (Ogg muxer and reader). Browser: `prepare(file)` (decode with WebAudio, re-encode with WebCodecs AudioEncoder to Ogg Opus 24 kHz mono when needed), `store` / `getData` (IndexedDB, memory fallback, then the published copy), `use(clips, {draft, givers})` / `find` / `load` (the game; called from live-content.js `use`), `upload(request, clips)` (publish).
- Draft: `local().clips[lineKey]` (tree lines: `tree:<mission>/<offer|ending|step/say|wrong|early>/<n>`; other lines: their `who|text` ref) `{who, text, hash, type, duration, bytes, name, at, reencoded?}`; carried by the server copy (`void_runner_drafts.py` WORKSPACE_KEYS `clips`, `clip_record_problems`). `mission-editor.js`: `importBox`, `clipTextOf`, a `voiceState` wrapper ("Voice: imported file"), `draftContent` passes `clipText` to `fromDrafts`, PUBLISH calls `VoidVoiceImports.upload` first.
- Content: `content.clips` (mission-content.js `check` / `fromDrafts` / `apply` -> `env.clips`; server `clip_problems`; `publish` refuses files not stored). Game: `voice-clips.js` consults `VoidVoiceImports.find` before the manifests (`has`, `speak`; `played[].primary.imported` is `draft` or `live`).
- Server (`void_runner_api.py`, `void_runner_live_content.py`): `POST developer/voice-clips` (which hashes are missing), `POST developer/voice-clips/<sha256>` (store; up to 900 KB body on this route only), `GET voice-clip/<sha256>` (public, year-long cache). Firestore collection `vr_voice_clips`. **The Render API needs a redeploy for these routes.**
- `tools/audio/bake-imported.py`: published files -> `void-runner/assets/audio/voice/extra/` (see `docs/VOID_RUNNER_VOICE_PRODUCTION.md`).
- Tests: `tests/voice-imports.test.cjs`, `tests/test_voice_imports.py`, browser `tests/voice-imports-browser.cjs`.
- Not verified: the real Render server and Firestore (fake storage only); Firefox / Safari (the re-encode needs WebCodecs; Chromium tested); a real ElevenLabs download (generated WAV files in the test).
## Fourteenth pass (19 Nov 2026): tests with Reverie or Lace run at the time she is really out

Branch `claude/draft-shift-time`, build `2026-11-19-draft-shift-1`. Pushed, no PR, not merged. The owner: "If I test with REVERIE or LACE make it the time they are actually there".

**What you see.** When a test involves Reverie or Lace (she gives the mission, a step is about her, she waits at a spot, she walks your route, a step follows her, or the mission starts when you walk near her), the test session runs on a **pretend street clock** set inside her shift: Reverie at **03:00 UTC**, Lace at **15:00 UTC**, or the real time if she is already out (and her shift is not about to end; never in the 90-second handover). So everything agrees, as it would at that real hour: she is on The Avenue and the other one is not, the cat goes to her, Studio 1 at Milked has the other one, her missions are available, the editor's shift notes say she is out. It works for PLAY THIS DRAFT, PLAY IT NOW (the start page), JUMP THERE, SEE IT ON THE STREET and the NPCs tab's test plays.
- **Both in one mission:** the shift of the first one used, with a plain notice, e.g. *"Testing at 03:00 UTC, Reverie's shift. Lace isn't out then."*
- **The draft banner** (top of the screen) shows both clocks, e.g. *Street 03:00 UTC (test) · In-game 21:00 · DAY 1*. The in-game day clock (the one schedules use) is separate and unchanged; **Try a time** on the NPCs tab still sets it.
- **Only in the throwaway test session.** Nothing is saved; it never touches the live game, your real save or other players; it ends when you leave the test (the page reloads).

**For Claude and Codex.** One street clock: `ncz-street-pair.js streetTime(realMs=Date.now())` (the real time, or the simulated one); `simulate(ms)` / `simulate(null)`, `simulated()`, `testClock(ids, realMs)` → `{id, name, ms, kept, time, others, note}` (pure; `TEST.hour` 3 / 15, `TEST.keep` 30 min), `utcLabel`. Readers: the pair's `start()` default clock (who is out, the cat), `milked.js studioOnePerformer()` and `milked-build.js` (Studio 1 swap), `mission-givers.js onDuty` / `shiftText` defaults and its `streetTime(ms)`, `mission-content.js duty()` (maps `ev.at` through it; the `env.draft` exemption is gone). `VoidStreetPair.force` is removed. Editor: `mission-editor.js streetClock(ids)` (called in `treeState`: giver, the near-start person, every step's `npc` and photo `subjects`, the ending's `npc`; and in `jumpTo`'s build with its `npc`) and `clockText()` (the banner, via `clock:` in the session options). `dev-test.js session()` resets the street clock at the start of every session and shows `opts.clock()` in the banner every second; `exit()` resets it before reloading.

**Tests:** `tests/draft-shift-clock.test.cjs` (override and its end, chosen times, handover and end-of-shift avoidance for every minute of a day, both-involved notice, every reader agrees, exemption gone); `tests/editor-givers-near.test.cjs` (draft play no longer exempt; the simulated clock offers her mission); `tests/draft-shift-browser.cjs` (page clock at 06:30 UTC, Reverie's shift: a Lace mission with a Reverie step plays at 15:00 UTC with Lace on The Avenue, Reverie in Studio 1, the notice and both clocks in the banner; LEAVE DRAFT restores the real time); `tests/editor-givers-browser.cjs` updated. Screenshot: `docs/development/draft-shift/`.

**Not verified:** real hardware; VR; the NPCs tab's test plays and JUMP THERE in a browser (same code path, unit-checked only).

## Thirteenth pass (19 Nov 2026): missions that cost credits, and ACCEPT / DENY on every offer

Branch `claude/mission-cost`, build `2026-11-19-mission-cost-1`. Pushed, no PR, not merged. The owner asked: "can i do -100 credit option and add an accept or deny".

### How to use it (plain steps)

**A mission the player pays for.**
1. In a mission, under **Credits**, choose **Player pays** (instead of **Player gets**) and type how much, for example 100.
2. **Charged** says when: **when they press ACCEPT** (normal; the offer shows the cost) or **when step N is done** (that step waits until the player has the credits).
3. **Refund if abandoned** (only for "when they press ACCEPT", off unless you tick it) gives the credits back if the player abandons the mission. The game has no abandon button for these missions yet; the setting is ready for one.
4. The player is charged **once**: a reload, a replay or a second ACCEPT never charges again. Credits never go below 0. With too few credits the ACCEPT button is greyed and says **YOU NEED 100 CR**, DENY becomes the main button, and the mission does not start.

**Ask the player: ACCEPT or DENY** (under *How this mission starts*; works for in person, Messages, Comms call, notification only and "when walked near").
1. Tick **Ask the player: ACCEPT or DENY**. The player sees the mission's name, its short description and the cost or reward, then chooses. Nothing is taken until they accept. (A mission the player pays for at ACCEPT always asks: the box stays ticked.)
2. **Buttons**: your own words for the two buttons (20 letters at most). Empty: ACCEPT and DENY. (Missions 002 and 003 keep their NOT NOW.)
3. **On DENY**: *Nothing: offer it again later* (normal: the next talk for an offer in person; the next time the player leaves the Sleeping Pod for a message, call, banner or walk-near), *Never offer it again* (the missions after it in that tree do not come either), or *Start another mission* (pick the first mission of another of your trees: it starts straight away, or is offered straight away if it asks too).
4. **What is said after DENY** (optional): your own lines. Empty: nothing is said.
5. An offer that arrives on the device shows a banner, then the same ACCEPT / DENY window with the notification's words. It never opens over a conversation or a menu; closed without a choice, it comes back after a minute while its trigger still holds.

**Make a mission** (the wizard): the reward page is now *What does the player get, or pay?* with **Player gets** / **Player pays**, and **Ask the player ACCEPT or DENY first?** Yes / No (always Yes when the player pays). Change the button words and what DENY does in the Mission Editor afterwards.

### For Claude and Codex

- Data (tree missions): `cost {amount 1..100000, when:'accept' (default) | <step id>, refund:true (only at 'accept')}`; `start.accept` for **any** `how`, plus `yes` / `no` (labels, 20 characters, plain), `deny` ('again' default | 'never' | 'start'), `denyStart` (the first mission of another tree), `denySay` (lines). `rewards` stays 0..100000. The editor shows one signed number (`mission-content.js signed` / `setSigned`, -100000..100000).
- Rules: `mission-content.js` MONEY block (`costOf`, `affords`, `charge`, `offerOf`, `abandon`, `costFlag` / `denyFlag`). Charged once via `story.flags.mc_<mission>` (the amount, a safe integer; 0 after a refund). DENY flags `story.flags.md_<mission>`: `'later'` (cleared by the next `pod-exit` event) or `'never'`. Both are ordinary story flags clean_save already accepts; credits never go below 0 (clean_save keeps 0..100,000,000; a refund is clamped to it).
- `treeEvent`: in-person asks return `out.ask` + `out.offer` (as before, the shape of `ask` is unchanged); device asks return `out.prompt {ask, offer, lines, channel, from, tree}` without taking the event or stopping other trees; ACCEPT of a device ask files the notification (`notify`) and completes a first step that is its own trigger; `out.need` when a cost cannot be paid (ACCEPT or a costed step); `out.charged` and a `−N CREDITS` note when paid; DENY returns `declined`, `deny`, the DENY lines, and `started` / `ask` / `prompt` for "start another mission". Default labels: ACCEPT / DENY (`main-story.js` 002 and 003 carry `no:'NOT NOW'`).
- Game: `live-content.js ask` (offer card, greyed ACCEPT when short), `followUp` (DENY lines, a follow-on offer), `offerPrompt` (device offers: banner + choice; 60 s between repeats; never over a conversation), "YOU NEED N CR" at most every 30 s. `talk-choice.js` takes `disabled` choices and `opts.offer` (the card); styles in `play-ui.css`.
- Editor: `mission-editor.js creditsPanel` / `askPanel` (+ Guide me fields `start-ask`, `start-deny`, `cost-when`); `treeNeeds` asks for the question when the player pays at ACCEPT. Wizard: `editor-wizard.js` `pays` / `ask` answers, `asks()`; `editor-home.js pageReward`.
- Server: `void_runner_live_content.py` (`ask_problems`, `cost_problems`, `workspace_money_problems`, `start_problems` takes the new keys for every start); `void_runner_drafts.py validate_workspace` refuses out-of-range credits and over-long labels in the server copy.
- Tests: `tests/mission-cost.test.cjs` (9), `tests/test_mission_cost.py` (3), browser `tests/mission-cost-browser.cjs` (wizard "Player pays 100" + ask, editor, draft play: DENY then ACCEPT, credits 150 -> 50 once; 40 credits: greyed ACCEPT, nothing starts).
- Not verified: a device offer (Messages / Comms / banner / walked near) in a browser (Node-checked only); "start another mission" and the DENY lines in a browser; real hardware; publishing with the server switched on. No abandon button exists for tree missions, so the refund is unit-tested only.
## Twelfth pass (19 Nov 2026): ElevenLabs voice tags in what is said; choose the ElevenLabs model

The owner asked "so i can put elevenlabs voice tags into the what is said section?", then "choose a model?" and "v4?". Build `2026-11-19-voice-tags-1`, branch `claude/voice-tags`.

- **Voice tags:** any line's text ("What is said...", the lines of an NPC in NPCs > Lines & voice, the wizard's offer line, a notification's text) may carry ElevenLabs audio tags in square brackets, e.g. `[whispers] Keep it down.` Rules: lowercase letters, spaces and hyphens, 30 characters at most each, 6 per line. A malformed bracket (`[whispers Keep it down.`, `[Whispers]`, `[]`) is refused in plain words by the editor, the game's check and the server. `[Write ... here]` placeholders are not tags.
- **Players never see them:** removed in one place, where content is adapted for the game (`mission-content.js` `apply` for every tree line, notification text and changed line, and `mapLine`), so the conversation window, V1 messages and notifications and the Mission Log show the line without them. A line without tags is untouched (voice clips are found by their text).
- **Help and warning in the editor:** one help line under the line fields ("You can add ElevenLabs voice tags like [whispers] or [laughs]. Players never see them; only ElevenLabs voices use them.") and a small warning under a line whose tags will not be used: a Kokoro-voiced character, a character with no voice, or an ElevenLabs model that does not read tags.
- **Model choice (Voice box):** for a character with an ElevenLabs voice, a list of models, each with a one-line description and an estimated credit rate: **Eleven v4** (newest; supports voice tags, used for Zen Zephyr; the default for a new choice), Eleven v3 (tags), Multilingual v2, Flash v2.5 and Turbo v2.5 (about half the credits; no tags). Stored with the choice (`content.voices[who].model`), exported to `revoice-engines.json` as `model`, checked against the same allow-list in the browser (`npc-voices.js MODELS`) and on the server. A character in `revoice-engines.json` keeps the model recorded there (Zen Zephyr: `eleven_v4`); changing it makes an editor choice with the same voice. The credit estimate counts the text as it is sent, at that model's rate.
- **Re-voice queue:** see `../VOID_RUNNER_VOICE_PRODUCTION.md`, "Voice tags and models".
- **Tests:** `tests/voice-tags.test.cjs`, `tests/test_voice_tags.py`, browser `tests/voice-tags-browser.cjs` (editor help, warning and model; PLAY THIS DRAFT shows "[whispers] Keep it down, runner." as "Keep it down, runner." in the conversation window).
## Twelfth pass (18 Nov 2026): describe a behaviour to ChatGPT, daily schedules, and the street cat as an NPC and giver

Branch `claude/npc-behaviour`, build `2026-11-18-npc-behaviour-1`. Pushed, no PR, not merged. Queue item 1, plus "add the cat as an npc and giver".

### How to use it (plain steps)

**Describe it to ChatGPT** (Developer tools > NPCs, pick Reverie, Lace or the Street cat; or the start card "Describe it to ChatGPT").
1. Press **COPY CHATGPT PROMPT**. (If your browser will not copy, the prompt appears selected: press Ctrl+C.)
2. Open ChatGPT, paste it, and at the end write what you want in your own words, for example "mornings she walks from the tea house to the laundry and back; at lunch she sits on her ledge; at night she watches the street by the chai shop".
3. Copy ChatGPT's whole answer and paste it into **Paste behaviour**, then press **CHECK IT**. The editor finds the recipe in the answer (the chat around it is fine).
4. If something is wrong you get a list in plain words ("there is no place called ...", "she cannot do ...", "time block 2 overlaps time block 1"). Fix it, or paste the list back to ChatGPT and ask it to fix the recipe.
5. If it is fine you see the **Preview**: what she does in each part of the day in words, and the map (press a time block to see its spot or route). **PLAY IT (DRAFT, NOT SAVED)** tries it on The Avenue in a throwaway session.
6. **USE THIS BEHAVIOUR** puts it into your draft (her placement and daily schedule). UNDO puts the old one back. PLAY THIS DRAFT and PUBLISH work as for any placement.
Nothing you paste is ever run as a program: a recipe is only names, numbers and times, and anything that looks like code is refused.

**Daily schedule** (under "Where they are in the game").
1. **+ ADD A TIME BLOCK** adds the next free hour (from 08:00). Set its **From** and **To** times, **What she does** (her usual thing, stay at one spot, walk a route) and an optional name.
2. **EDIT ON THE MAP** (or click its coloured bar on the timeline): the map and buttons above now change that time block. "All day" changes what she does outside every block.
3. A block may run past midnight (20:00 to 02:00). Blocks cannot overlap; 8 at most; each at least 15 minutes. Problems show in red with what to change.
4. **Try a time**: slide to a time of day to read what she does then; **PLAY THIS DRAFT AT THIS TIME** starts the test session with the game clock at that time (an in-game day passes in 2 hours of play).
5. The times are the **game's own clock** (each player's). Reverie and Lace still keep their real-time street shift (Reverie 00:00–12:00 UTC, Lace 12:00–24:00 UTC): the schedule says what she does while she is out. The cat is out day and night.

**The street cat** is now in the NPCs list ("Street cat"). It can stay at a spot or walk a route (sit, look about, potter about, wait), take a daily schedule and a ChatGPT recipe; it has no animation clips (its pose is made by code), so "Add animation" is not offered. It **gives missions**: pick "Street cat" as the Giver; players see **PET THE CAT** on it. With no mission waiting it only looks up at them ("The cat looks up at you.", text only, no voice). "When walked near" and "Giver waits at" work with it.

### For Claude and Codex

- `void-runner/npc-behaviour.js` (pure, Node-tested; loaded with the editor only): `extract` (fence / first balanced `{...}`, `JSON.parse`; `CODE` regex refuses code-like pastes; 20,000 characters max), `validate(json, id, {anims})` (recipe v1: `recipe`, `version`, `npc`, `allDay`, `schedule`; activities `usual` / `stay {at, face, actions}` / `route {points:[{at, action, seconds}]}`; places from `places(id)` or `{x, z}`), then `npc-paths.js clean` + `planProblems`; `read`, `describe`, `summary`, `examples`, `prompt`.
- `npc-paths.js`: `scheduleProblems`, `blockAt`, `toMin` / `hhmm`, `cleanBlock`, `planNow({minute})` (a waiting mission > the schedule block for the minute > the all-day plan; key `sched:<i>:...`), `LIMIT.blocks` / `blockMin` (admin inventory `npcPaths.limits`). `MOVABLE['street-cat']` (`cat:true`; `CAT_ACTIONS`, `CAT_STAY`; no library clips).
- Server: `void_runner_live_content.py` `npc_problems` -> `_plan_only` + `schedule_problems`; `schedule_shape_problems` for the workspace copy (`void_runner_drafts.py`).
- Game: `live-content.js plans()` passes `VoidClock.now(state).minuteOfDay`; `ncz-street-pair.js` the cat (`CAT_ID`, `CAT_ACTION`, `CAT_REACTION`, `catPlan`, the PET THE CAT item `catItem`, `stats().cat.plan/act/pet`). `mission-givers.js` roster entry `street-cat` (no shift). `mission-editor.js jumpTo(x, z, npc, label, back, {npcs, minute})`.
- Editor: `npc-editor.js` `scheduleBox`, `behaviourBox`, `blockOf` / `curPlan` (the block being edited), `setPlan(id, p, {keep})` keeps the schedule unless told not to; start cards "Give a character a daily schedule" and "Describe it to ChatGPT".
- Tests: `tests/npc-behaviour.test.cjs`, `tests/test_npc_behaviour.py`, browser `tests/npc-behaviour-browser.cjs` (`PART=editor`).

## Eleventh pass (18 Nov 2026): the NPC appearance editor (NPCs > Appearance)

Branch `claude/npc-appearance`, build `2026-11-18-npc-appearance-1`. Pushed, no PR, not merged. Queue item 0c.

### How to use it (plain steps)

1. Open **Developer tools > NPCs** and pick anyone (a named character, a **Street figure**, or a **Figure ... (other places)**: the older multi-part figures are listed there too). Go down to **Appearance** and press **Show me in 3D to change the look**: the editor reads the model file and offers only what that model can do.
2. Press **+ NEW LOOK**. A look starts as the model "as made" (which never changes). Give it a name.
3. **Parts you can take off**: tick off an accessory or hair (hat, sunglasses, visor, face mask, collar, VR headset, hand trackers ...). Clothing that covers the body, the shoes, the body and the face always stay, and a part whose name does not say what it is stays too. Most street figures are made in one piece, so they have nothing to take off.
4. **Colours**: click a colour dot or pick any colour; the clothes take it and keep their own light and dark. A one-piece figure is recoloured as a whole and its skin keeps its own tone; a multi-part figure has one row per piece (suit, shoes, hair, headset ...). **Reset colour** puts one back. In **Advanced** mode you also get hue, saturation and brightness sliders.
5. **Add pieces from the character creator** (visor, tech collar, shoulder plates, chest light, and the creator's hairstyles): only on figures built on the creator's skeleton (the District resident / smuggler bodies and figures made like them). Everywhere else they are greyed with the reason. A long hairstyle needs the hat hidden first.
6. **Which look the game uses**: as made, one of your looks, or **a mix of my looks** (each person keeps one). A look belongs to the model, so everyone the game draws with that model wears it.
7. The 3D preview changes as you go; UNDO / REDO (or Ctrl+Z) work on every change; **RESET TO ORIGINAL** clears a look; **DELETE THIS LOOK** removes it.
8. **SEE IT ON THE STREET** plays your draft on The Avenue (your real save is never touched). PLAY THIS DRAFT carries the looks too, and PUBLISH sends them to every player (the server checks them first), so every player sees the same looks.
9. Rules kept for you: licensed models (the VR companions, the studio dancer, Dax) can only be recoloured and have accessories hidden, nothing is added and their files never go to any AI tool; Reverie and Lace stay in ordinary street clothing (colours only); the model files are never edited.

### For Claude and Codex

- `void-runner/npc-looks.js` (pure + browser): `classify` (mesh / material names -> body, face, garment, shoes, hair, accessory, unknown; only hair and accessory are hideable), `capabilities(asset, meta, data)` (meta from `metaFromContainer` in the editor or `metaFromGlb` in Node), `problems` / `clean` / `pick` / `variant`, `inventory` (the admin inventory's `npcLooks`). Browser: `applyLook(node, asset, look)` / `reset` / `dressIn`; `install()` wraps `VoidCrowd.animate` and `VoidCrowd.dress` so every NPC figure is dressed when it loads; player figures (under `character:`, `remote-player:`, `avatar-preview`) never are.
- Content: `content.looks[asset] = {looks:[{id, name, hide, colour:{material|'*': {tint, hue, sat, bright}}, gear, hair}], use:'original'|id|'mix'}`; draft key `looks`; checked by `mission-content.js check` (name rules) and `void_runner_live_content.py look_problems` (against `void_runner_admin_inventory.json` `npcLooks`, built from the model files by `tools/admin-inventory.cjs`: run it after adding a model). The editor's server copy (`void_runner_drafts.py`) carries and checks `looks`.
- Colour uses the street-variant shader (`npc-variants.js`; `variantMaterial` is exported; a variant with `all` recolours a separate material whole, no skin test): one material per source material and colour, shared by every figure, disposed with its source. Gear and hair are fitted once per model and scene (`gear-fit.json`, `bind-data.json`, `character-fit.js`) and copied with shared geometry.
- Not done: a texture-mask region for partial recolours (no model has a mask yet); figures already on screen keep their look until they are placed again (draft play and publishing start a fresh scene).
- Tests: `tests/npc-looks.test.cjs`, `tests/test_npc_looks.py`, browser `tests/npc-looks-browser.cjs` (`PART=editor` for the editor only).

## Tenth pass (18 Nov 2026): choose an ElevenLabs voice for any NPC or giver

Branch `claude/editor-voices`, build `2026-11-18-editor-voices-1`. Pushed, no PR, not merged. Queue item 0b.

### How to use it (plain steps)

1. Open **Developer tools > NPCs**, pick the character, and go down to **Lines & voice**. (In the Mission Editor, the same **Voice** box sits under each mission's **Giver**.)
2. **Voice** shows what they speak with now: a **Kokoro** voice from the voice registry (free, recorded on your PC; locked, read-only), or an **ElevenLabs** voice (yours from the re-voice file, or one you chose here), or **No voice yet**. **Listen on ElevenLabs** opens that voice's page on elevenlabs.io in a new tab (listening there costs nothing).
3. Under it: how many lines they have, how many characters that is, and **about how many ElevenLabs credits** re-voicing all of them would take. This is an estimate: about 1 credit per character (Multilingual v2 / v3 and newer models); Flash / Turbo use about half. Your plan and model decide the real cost.
4. To choose a voice, open **Choose an ElevenLabs voice**: paste the link of the voice's page (for example `https://elevenlabs.io/voices/...`) or just its 20-character ID, give it a name, and press **USE THIS VOICE**. A wrong link says why straight away. UNDO (or Ctrl+Z) takes it back; **REMOVE MY CHOICE** goes back to the voice they had before.
5. The choice is part of your **draft**: PLAY THIS DRAFT carries it, PUBLISH keeps it (the server checks it). **DOWNLOAD THE VOICES FILE** (NPCs tab) gives the same choices in the format of `tools/audio/revoice-engines.json`, for Claude or Codex to keep in the game files.
6. **Nothing is generated or paid from the editor, and your ElevenLabs key is never asked for.** Lines you RE-VOICE for that character go to the re-voice queue marked "waiting for ElevenLabs re-voice (needs approval)". When you approve the spend, Claude records them with the ElevenLabs connector.

Not offered: the reserved special-character slot, broadcast voices (The Relay) and The Function (no voice). Reverie and Lace can have one: choose an ordinary, neutral street voice (the editor reminds you).

### For Claude and Codex

- `void-runner/npc-voices.js` (pure, Node-tested): `parse` (link or bare id; only elevenlabs.io; ids are `[A-Za-z0-9]{20}`), `refusal`, `make`, `clean`, `problems`, `current` (editor choice > `revoice-engines.json` > registered Kokoro), `estimate`, `exportEngines` (revoice-engines.json format; the file's own entries kept), `listenUrl`.
- Content: `content.voices {who: {engine:'elevenlabs', voiceId, name, chosen:'YYYY-MM-DD by the owner'}}`. Draft `local().voices`, server copy (the workspace now also accepts `npcs`, `animRequests` and `voices`: it refused them before, so the server copy failed once a placement existed), `fromDrafts`, `check` (browser) and `void_runner_live_content.py voice_problems` (server: only admin-inventory givers, refusals, id format). `apply` keeps `env.voices`.
- Re-voice queue: `queue_add` takes an optional `voiceId` + `voiceName` (sent by the editor from the draft) and otherwise uses the published `content.voices`, then `revoice-engines.json`, then the registered Kokoro voice. Characters with an ElevenLabs voice but no registry entry (e.g. Zen Zephyr, Reverie) can now be queued. ElevenLabs items stay queued (never marked done by `revoice/done`).
- `tools/audio/generate.py --from-queue`: reads the published voices (server queue) and `--voices FILE` (the downloaded voices file); a queued Kokoro line of such a character is listed as waiting for ElevenLabs. Waiting lines print their voice, character count and estimated credits. It never calls ElevenLabs.
- The editor reads `tools/audio/revoice-engines.json` (now published by the Pages build: ids and names only). `mission-trees.js build` takes `src.engines` / `src.voices`.
- Tests: `tests/npc-voices.test.cjs`, `tests/test_npc_voices.py`, browser `tests/npc-voices-browser.cjs`.
- Not verified: publishing and the queue with the server switched on (fake storage only); a real ElevenLabs page (the link is only a link).

## Ninth pass (18 Nov 2026): the beginner redesign (Start page, "Make a mission", Basic / Advanced, tour, undo)

Branch `claude/editor-redesign`, build `2026-11-18-editor-redesign-1`. Pushed, no PR, not merged.

### How to use it (plain steps)

**Start.** Developer Tools now opens on **Start**: "What do you want to do?" with four big cards. The other tools are under "More tools" and in the tabs along the top.

**Make a mission.** Press the card and answer one question per page; the bar at the top shows how far you are; **BACK** goes back, **NEXT** goes on. If something is missing, a yellow box says what and how to fix it.
1. *What kind of mission?* Deliver something, Meet someone, Go somewhere, Photograph something with the V1, or Talk to someone.
2. *Who gives the mission?* People players can meet today are listed first.
3. *How does it start?* When the player talks to them; they ask and the player says yes or not now; when the player walks near them (a banner); or a text message on the V1 when the player first leaves the Sleeping Pod (you write the message).
4. *What must the player do?* Each step: what they do and who / where. The Mission Log line is filled in for you ("Talk to Iris"); type your own words if you like. **+ ADD A STEP**, move steps up or down, or remove one.
5. *What does the player get?* Press a button (Nothing, 50, 100, 250, 500 credits) or type a number.
6. *What is it called?* The name, an optional description, optionally what the giver says when offering it (your words), and which tree it goes in ("My missions" unless you pick another).
Then **MAKE MY MISSION**. It is an ordinary DRAFT mission: **PLAY IT NOW** tries it in a practice game (your real save is never touched), **OPEN IT IN THE MISSION EDITOR** shows every setting.

**Test my mission** lists every mission in your draft: **PLAY** if it is ready, or what is still missing with **OPEN TO FIX**. **Publish** opens Mission Editor > Publish & versions. **Place a character** opens the NPCs tab.

**Basic and Advanced.** Basic (the normal view) hides things you rarely need: the mission number, Type / Objective / Location, the mission type, Branches, Follow-ups, "If the player comes too soon", flow charts, internal names (ids) and step kinds the game cannot run yet. Tick **Advanced** at the top to see everything. Your choice is remembered in this browser.

**UNDO and REDO** (top right, or Ctrl+Z / Ctrl+Shift+Z when you are not typing in a box) put back any change you made in the Mission Editor or the NPCs tab since Developer Tools was opened, including removing a mission or a step.

**The tour.** The first time, a short tour (7 stops) shows where things are. **SKIP TOUR** ends it; the round **?** button shows it again.

### For Claude and Codex

- `void-runner/editor-wizard.js` (pure, Node-tested): `TEMPLATES` (only kinds in `mission-givers.js STEP_KINDS` with `supported`), `STEPS`, `STARTS`, `PAGES`, `fresh`, `setTemplate`, `labelFor` / `relabel`, `problems(answers, page, ctx)` (plain words, each with the fix), `build(draft, answers, {T, number})` (mission-trees.js `newTree` / `addMission` / `addStep`; never into a shipped tree), `mode` (`editor-mode`), `createUndo` (merges only saves from the same text box within 1.2 s).
- `void-runner/editor-home.js` (browser): the Start page, wizard, Test my mission, tour (`editor-tour-done`), UNDO / REDO (`record` is called by `mission-editor.js saveLocal` / `saveStudio`; `shared.restoreRaw` puts a stored draft back), Basic marking (`mark()` after every change in the panel adds `adv-only`; `dev-tools.css` hides it under `#dev-balance.dev-basic`). New `mission-editor.js shared`: `goto`, `addWizardMission`, `playTree`, `blockers`, `restoreRaw`.
- `dev-tools.js`: tab `home` first (default), icons (`DEV_ICON_PATHS`, `VoidDevTools.icon`), header UNDO / REDO / Advanced / ?, `setMode`; `editorScripts` end with `editor-wizard.js`, `editor-home.js`.
- Tests: `tests/editor-redesign.test.cjs`, `tests/editor-redesign-browser.cjs` (`PART=editor`).

**Not verified:** real hardware; publishing with the server switched on; the "walked near" and "message" starts made by the wizard in a browser (checked in Node); screen readers.

## Eighth pass (18 Nov 2026): help on every setting, "Guide me", "Giver waits at" on a map, and the new NPCs tab

Branch `claude/editor-npc-tools`, build `2026-11-18-npc-tools-1`. Pushed, no PR, not merged.

### How to use it (plain steps)

**Short help everywhere.** Under every setting in the Mission Editor there is now one or two lines of small grey text saying what it does in the game, with an example. A dropdown also says what the option you chose does, and its round **?** opens the list of every option. *Location* says plainly that it is only a label for the Mission Log: it does not move anyone.

**Guide me.** At the top of the editor (and of the NPCs tab) is a switch, **Guide me**, on unless you turn it off. The next box you still have to fill in has a soft glowing outline and a small **Next: ...** tag (for example "Next: nobody gives it yet"). It uses exactly the same rules as PLAY THIS DRAFT and PUBLISH, so the two never disagree. When everything required is filled in it says **All required fields filled** and points at PLAY THIS DRAFT. Optional boxes are never highlighted.

**Giver waits at (Reverie and Lace).**
1. Open a mission given by Reverie or Lace. Under *Giver* is a box **Giver waits at** with a map of The Avenue (north is up; the green strip is the pavement she can walk on).
2. Click the green strip where you want her. A pink marker appears. Drag it to move it; drag its small round handle (or press *face N / E / S / W*) to choose which way she looks.
3. **JUMP THERE** opens a throwaway test session standing a few steps from the spot. **CLEAR** puts her back on her usual walk.
4. In the game: while that mission is waiting to be offered and she is out on her shift, she walks to the spot and waits there doing her normal things (stands, looks about, checks her V1; if the spot is just in front of a ledge she sometimes sits). Once the player accepts it (or it is done) she walks back to her usual walk.
5. She can only wait on the Avenue's north pavement, between the two gates, away from the taxi poles and the advertising screens' stands at the kerb (orange on the map). A click on the road snaps onto the pavement; anything she cannot reach shows in red with the reason.

**The NPCs tab** (Developer Tools > **NPCs**). It starts with **What do you want to do?** and six big choices: *Move a character to a spot*, *Make a character walk a route*, *Give a character a mission*, *Look at a character in 3D*, *See what a character says*, *Bring in a new 3D model*. Or pick anyone from the list on the left (type part of a name to find them).

- **About:** their model file, where the game puts them, their voice (read only: voices are locked and are never changed here), and whether they can give missions.
- **Show me in 3D:** their model turning slowly; drag to turn it, scroll to zoom; press a clip's button to play it.
- **Give them a mission:** makes a new draft mission given by them (in a tree you pick, or a new tree) and opens it in the Mission Editor ready for your words. Nothing is written for them.
- **Where they are in the game** (Reverie and Lace today): **Let her do her usual thing**, **Keep her at one spot** (drag her on the map, turn her, tick what she does there), or **Make her walk a route** (click the pavement to add numbered points; drag a point to move it; for each point choose what she does and for how many seconds; after the last point she walks back to the first). Everyone else says why they cannot be moved yet (for example "Placed by the District's own room code").
- **Add animation:** every animation in the game, by kind (idle, talk / gesture, dance ...), with a search box. The ones she can use are listed; tick one to add it to the things she can do at a spot or a route point; **Try it** plays it on the 3D preview first. Tick "also show the ones she cannot use" to see the rest and why (her content rule, a different skeleton, a licensed file); **Request it** fills in a request.
- **Request an animation:** describe what you want; **DOWNLOAD REQUESTS** gives a file to send to Claude or Codex, who make it on your PC. Licensed "No AI" models are marked *local retarget only* (never Meshy or any AI tool).
- **Lines & voice:** everything they say (this used to be the Mission Editor's "All lines for an NPC"; that button and the NPC names in a tree now open it here), with a search box, line counts and **OPEN THIS MISSION**. RE-VOICE works as before.
- **Bring in a new 3D model** (+ IMPORT MODEL): pick a .glb (or a self-contained .gltf) from your computer. It stays in this browser only (nothing is uploaded) and is labelled LOCAL TEST ONLY. **Show me in 3D** runs the checklist: triangles (over 50,000 is refused: "This model has N triangles; the limit is 50,000. Reduce it in Blender, or send it to me to reduce"; 20,000 to 50,000 is accepted with an amber note; up to 20,000 green), file size (15 MB at most), textures (amber over 2048 px), skeleton and whether it matches the game's rig, its clips, its height. Put it on the map (one spot or a route, with its own clips) and **PLAY THIS DRAFT (LOCAL TEST)**. **ADD TO THE GAME** downloads the model and a small package file (name, placement, clips, checklist, and your answers: where it is from, its licence, and "No AI licence?" yes or no). Send both to Claude or Codex; a licensed or unknown model never goes into the public files by itself.
- **Advanced** shows the internal names (ids); you never need them. Removing a route point or a model can be undone with **UNDO**.
- Every placement is part of your DRAFT (saved as you work, also on the server copy), tried with **PLAY THIS DRAFT** (a throwaway session on The Avenue at a time she is really out: see the Fourteenth pass) and sent to players with **PUBLISH TO ALL PLAYERS** (Mission Editor > Publish & versions), checked by the server like missions.

### For Claude and Codex

- `void-runner/npc-paths.js` (pure, Node-tested): `MOVABLE` (only `grey-reverie`, `ethereal-lace`, `youthful`), `AREAS` / `AVENUE_NORTH` (x 12.5..141.5, z -7.6..-5.8; taxi posts from `ncz-quarters.js STOPS` kept 0.7 m clear; `OBSTACLES`: the ad screens' stands and taxi poles read from the built city by `tests/npc-obstacles-browser.cjs`, kept 0.3 m clear; rerun it when the street furniture changes), `ACTIONS` (from her own crowd.js clips; device poses; ledge sit; walk-on), `actionsFor`, `spotProblems`, `legProblems`, `waitAtProblems`, `planProblems`, `checkAll`, `clean`, `planNow` (a waiting mission > a placement > her routine), `mapData`, `libraryOffer` (every clip: the ActorCore library and every public crowd file from `npc-clip-index.json`; usable = same 24-joint Mixamo rig, rest pose within `anim-library.js REST_LIMIT`, not BANNED, not an adult-only source `ADULT`, no smoking / drinking / drunk / VR-shooter for youthful NPCs, no walking / seated / transition clips), `animAllowed` (the game's own check without the index), `applyAnims`, `IMPORT` caps and `importCheck`, `importPlanProblems`, `request` / `noAI`, `inventory()` (the server's copy, `void_runner_admin_inventory.json npcPaths`).
- `tools/npc-clip-index.cjs` writes `void-runner/npc-clip-index.json` (65 KB, fetched by the NPCs tab only). Rerun after adding a model; a test checks it is current.
- Content: `content.npcs` and `mission.waitAt` (`mission-content.js check`, `treeStrip`, `fromDrafts`, `apply` -> `env.npcPlans`, `waitingAt`, `treeNeeds`); server `void_runner_live_content.py` (`npc_problems`, `wait_at_problems`, `import_package_problems`). The editor's draft keeps `npcs` and `animRequests` (requests are exported, never published).
- Game: `ncz-street-pair.js` (`ACT`, `planStep`, modes `plan-go` / `plan-do`; `stats().her.plan` / `.act`; `VoidStreetPair.planFor` / `animsFor` set by `live-content.js plans()`; `VoidStreetPair.live()` for the map); `anim-library.js register()` (a crowd file as a clip source; `c.group` / `c.clip`).
- Editor: `void-runner/editor-guide.js`, `npc-map.js` (`canvas.npcMap.toScreen`), `npc-preview.js`, `npc-editor.js`; `mission-editor.js` (`HELP`, `optHelp`, `waitAtPanel`, `jumpTo`, `linesView`, `guideNow`, `shared`). `dev-tools.js` tab `npcs`; return key `npc-editor-return`. `game.css` fixes every canvas full screen: `dev-tools.css` puts the editor's canvases back in the page.
- Tests: `tests/npc-tools.test.cjs`, `tests/test_npc_tools.py`, `tests/npc-tools-browser.cjs` (`PART=editor`).

**Not verified:** real hardware; VR; Lace in a browser (same code as Reverie); an added animation on the street in a browser; the imported-model test session in a browser; publishing with the server switched on.

## Seventh pass (18 Nov 2026): Reverie and Lace as mission givers; the start trigger "When walked near"

Branch `claude/editor-givers-proximity`, build `2026-11-18-editor-givers-1`. Pushed, no PR, not merged. Two separate features (your words: they are separate things).

**1. Reverie and Lace give missions.** They are in the **Giver** list (In the current District game) and in every "who" picker. Under the Giver you see when she can give it: *"Only while Reverie is out on the street: 00:00 to 12:00 UTC every day (the first 1.5 minutes of a shift nobody is out yet) ... She is out now / not out now"*. Lace: 12:00 to 00:00 UTC. That is the street pair's own clock, the same for every player.
- **In the game:** whoever is out has a **TALK TO REVERIE** / **TALK TO LACE** prompt that follows her as she walks or sits. Talking to her offers her mission (in person, or with ACCEPT / NOT NOW), or completes a step that names her. While you talk she stops walking (or stays seated) and turns to you; afterwards she carries on.
- **Only while she is out:** her missions are offered only during her shift (talking to her, or walking near her). In the 90-second handover nobody is out.
- **With no mission for you** she says one neutral placeholder line ("Hey." / "Hi."), text only: no voice, nothing flirtatious; replace it whenever you like.
- **PLAY THIS DRAFT** runs at a time the one your mission needs is really out (19 Nov 2026: a simulated street clock; see the Fourteenth pass; before, it forced her out whatever the hour).
- **How to use it:** + NEW MISSION, Giver: *Reverie* (or *Lace*); write what she says when offering it; add steps (e.g. "Talk to someone: Lace"); PLAY THIS DRAFT.

**2. The start trigger "When walked near"** (any mission, any giver). The mission starts when the player comes within a distance of a person, without talking.
- **How to use it:** Starts: *By Messages*, *By Comms call* or *Notification only* (it arrives the way you choose; *Notification only* is a banner). Trigger: **When walked near**. Then **within [5] metres of [person]**: the person is the giver unless you pick someone else; the distance is 1 to 30 metres (5 if left alone; anything outside is brought back into range).
- It follows people who move (Reverie and Lace are measured where they are). It is checked four times a second while the player walks, never in a conversation, a cutscene, the character creator, the Sleeping Pod or the KeyMap. It fires once, and only when the missions before it in the tree are done.
- The person must have a TALK prompt (that is what is measured); someone without one (Juno Vex) is refused with a plain message.

**For Claude and Codex:** `mission-givers.js` (`FACTS['grey-reverie' | 'ethereal-lace']` with `shift`, `onDuty(g, ms)`, `shiftText`, `NEAR`, `nearMetres`, START_WHEN `near`); `ncz-street-pair.js` (`GREETING`, `TALK_ACTION='street-pair'`, `talkId`; per-woman interaction objects whose `position` is mutated each frame and kept in `walkingLocation.interactions` (4 Hz); `chatting()` holds her while a conversation opened from her prompt is open (District conversations float over walking: `VoidConversationUI.isOpen`; latched at the moment it opens); `VoidStreetPair.force` for draft play, removed 19 Nov 2026: see the Fourteenth pass); `mission-content.js` (WHEN `near` {npc, distance}; `startsNow` gates shift givers with `duty()` (skipped in draft play until 19 Nov 2026; now on the street clock) and `near` with `nearHit`; `nearList`; `treeStrip` keeps `npc`/`distance`, and now also `mission`/`value` of "after in-game time", which it dropped before); `live-content.js nearTick` (250 ms, reused distance object, distance to the person's interaction position; skipped while `VoidConversationUI.isOpen`, since a District conversation keeps `mode` at 'walking'); `mission-editor.js startPanel` (distance and person fields, the shift note, draft play force); server `void_runner_live_content.py start_problems` (same rules). The editor now also moves a mission's offer lines to a new giver when the Giver is changed (a new mission copies the previous mission's giver into its offer line). Save: their ids (`grey-reverie`, `ethereal-lace`) go into `story.met` and pass `clean_save` (tested); no new save fields.

**Tests:** `tests/editor-givers-near.test.cjs` (roster, availability by UTC hour and handover, in-person gating and draft play, trigger list, default 5, clamp 1..30, check and export, fire once, tree order, Reverie's shift), `tests/test_live_content.py` (server), `tests/test_story_save.py` (ids in a cloud save), `tests/editor-givers-browser.cjs` (the editor and a real draft play on The Avenue). Updated: `tests/ncz-street-pair.test.cjs` (they now have one neutral line and a prompt), `tests/mission-trees.test.cjs`.

**Not verified:** real hardware and VR (software renderer only); a published mission with a live player at the shift change (unit-tested only); Lace in the browser (the same code as Reverie; she was not loaded in the browser run); measuring is from the TALK prompt's point, which for people behind a counter (Admin, Iris) is the customer side of the counter, so "5 m" there is about 5 m from where you would stand to talk.

## Sixth pass (18 Nov 2026): every place has a name; photo METADATA; device IDs

Branch `claude/gallery-metadata`, build `2026-11-18-metadata-1`. Pushed, no PR, not merged.

**What you will see.** The place pickers (steps "Enter / leave a place" and the triggers) now list **every** named place, indented by level, each with its level ("· area", "· venue", "· exact location") and **(working name)** where the game had no name and Claude gave a plain descriptive one for you to replace. Hovering an option, or the chosen place, shows its whole chain (Tessaly System › NeoChinatown › NeoChinatown › Old Town › The Darknet District › The Bar).

- **The hierarchy:** System › Planet › City › Area › Venue › Exact location. *Venue* is a building with rooms (The Darknet District, NULL, Milked). An exact location can hold smaller ones (a shopfront or a taxi stop on a stretch of street); the smallest one the player stands in counts.
- **The planet:** the game shows "NeoChinatown" for the planet as well as the city. The planet's own name is not settled, so it is a PROPOSED row on the sheet.
- **168 places:** 147 use a name the game already has (signs, menus, the map, the game's own data), of which 50 are **shopfronts** named by their neon sign; **21 are PROPOSED** working names (stretches of Main Street and the Avenue, the access road, the Outskirts' yards and lanes, Milked's side street, the Temple grounds, the planet).
- **Your review sheet:** [`LOCATION_NAMES.md`](LOCATION_NAMES.md) (one row per place, with an empty "Owner's name" column) and the map [`location-names-map.png`](location-names-map.png) (numbers match the sheet). Changing a name never breaks a mission: missions use the internal id, which never changes.
- **Gallery › METADATA** (your request): with a photo open in the V1 Gallery, **METADATA** shows **TAGGED** (each person the camera identified, and how: "District resident registry", "Camera identification" for people a scene registers such as Juno Vex, or "Their device (another player)"; with "clear shot · 6.2 m" or why not), **LOCATION** (most specific first: "The Bar · The Darknet District · Old Town · NeoChinatown · Servo · Tessaly System"), **DEVICE ID** and **TAKEN** (the in-game time, "21:51 · DAY 1"). Back returns to the photo.
- **Anonymous photographer (your correction):** no handle, account or player id is kept with a photo. The **device ID** is the only link to whoever took it, and it cannot be turned back into an account. **Tracing a device ID back to a person is a future gameplay mechanic** (not built). A row "POSTED ONLINE BY @handle" is ready for when a photo is posted online by a person or NPC; it is empty for now and is not shown while empty.
- **Device ID:** every player's device has one, e.g. **V1-7F3A-91C2** (the model, then eight characters). It is made once per campaign from a one-time random number (with the campaign and, when signed in, the account mixed in, then thrown away), kept in the save (`story.flags.deviceSerial`), the same after a reload or on another computer, and shown in MY V1 as well. A later model keeps the number with its own prefix (V3-...).
- **Fresh start (your instruction):** this update deletes every Gallery photo taken before it, once, for every player. Photos only ever lived in the player's browser (nothing in the cloud save), so this empties the Gallery's photo store in each browser the first time the update loads, and touches nothing else (messages that showed a photo now say "[photo no longer in your gallery]").

**For Claude and Codex:** `void-runner/places.js` (`LEVELS` with `venue`; node fields `proposed`, `src`, `where`, `fallback`, `shop`; `SHOPFRONTS` read from the built city's `shop-sign-N` meshes, words from `neochinatown.js shopSigns`; `at()` sorts deepest, then named before fallback, then smallest; `chain()`); `device-v1.js` (`KEY.serial`, `makeSerial`, `ensureSerial`, `deviceId`, `DEVICE_ID`); `device-camera.js` (`capture()` records `device`; tags carry `via`; `VoidDeviceId.now()`); `device-gallery.js` (`FIELDS`, `metadata()`, `postedBy`, `DB_VERSION` 2 and `upgrade()`); `personal-device.js` (`['gallery', id, 'meta']`; MY V1 DEVICE ID); `mission-editor.js` (`placeText`). Regenerate the sheet and map with `node tools/location-names.cjs --json /tmp/places.json` and `python3 tools/location-names-map.py /tmp/places.json docs/development/location-names-map.png <date>`. When the owner names a place: change `name`, drop `proposed`, never the `id`. Tests: `tests/places-names.test.cjs`, `tests/gallery-metadata-browser.cjs` (screenshots in `gallery-metadata/`), `tests/test_story_save.py` (deviceSerial survives `clean_save`). `tests/guide-route.test.cjs` also walks the arrow from the District hall to every new exact location.

**Not verified:** real hardware (software renderer only); the shopfront positions were read from the city as built on 18 Nov 2026 (they follow the city's fixed random sequence: a change to street furniture can move them, rerun the reading); Vesper, Meridian and the other historical stations have no places (not reachable in a District campaign); another player in a photo (the "their device" path) was not photographed in a browser.

## Fifth pass (17 Nov 2026): Mission 003 — Corporate Connections; the in-game clock; contacts and Social; the V1 translation

Branch `claude/mission-003`, build `2026-11-17-mission-003-1`. Your text is verbatim in `VOID_RUNNER_HANDOFF.md` §11.

**What you will see.** The Awakening tree holds **Mission 003 — Corporate Connections** after Mission 002 (your saved draft gets it in place automatically, unless you removed number 003 there; if one of your own draft missions already uses 003, the editor shows the clash and you can renumber yours). Every field is editable: Admin's four briefing lines, the four steps, Eva's and Fish's lines, the unlocks. Lines Claude drafted (Eva's welcome and the business explanation, the player's lines) carry an orange **PROPOSED** tag: edit or keep them; they are text only (not recorded) until you approve them.

**How it plays.** In person with ACCEPT / NOT NOW (as 002). Step 1 "Travel to Milked" (enter Milked: the arrow leads to the front vestibule in Far South) → step 2 "Speak with Eva at reception" (the arrow points to Eva; her two recorded lines end it; she turns toward the staff door; unlock "story flag milkedStaff" opens the STAFF ONLY door at the studio hallway's far end for that player only) → step 3 "Meet Fish in her office" (the arrow goes through the staff door; Fish answers in Mandarin and the V1 translates; unlocks "Add Fish to the V1 contacts" and "Follow Fish on Social") → step 4 "Await Fish's response" (done at once: the mission ends). No reward.

**The V1 translation.** A line said by **V1 translation** straight after someone's line is not a line of its own: it is shown under theirs, labelled **V1 TRANSLATION**, and its recording starts over theirs (Fish's Mandarin at 70%, the English 0.75 s later at full volume, with a subtle device filter). **Your standard: a translation is spoken in the speaker's own voice, in English** (Fish's English is her own ElevenLabs voice, `fish-m003-en.ogg`). ONE setting per character: `void-runner/assets/audio/voice/extra/manifest.json` → `translations['milked-fish']` (voice, filter, offset, volume); the clip can be swapped for another take without touching anything else.

**New, and reusable:**

- **The in-game clock** (your choice: clock only for now): 1 real minute of walking or flight = 12 in-game minutes, so an in-game day is 2 hours of play. It stops in menus, pause, conversations, the pod card, a hidden tab and while offline (a gap counts 5 s at most). Each player has their own, in the save (`story.flags.gameMin`, in-game minutes since the campaign started; a new campaign starts on Day 1 at 21:00), so a reload or another computer carries on. The V1 shows it in its header ("21:40 · DAY 1"), and photos keep the in-game time they were taken. Day / night lighting, crowds and shop hours are not built; they can follow from the same clock.
- **Trigger "After in-game time"** (How this mission starts → By notification → Trigger): N in-game hours and minutes after a chosen mission is done (the editor says roughly how many minutes of play that is). Stored as in-game minutes (`gc_<mission>` stamps the completion).
- **Step "Wait for their call"**: done by itself right after the step before it.
- **Unlocks "Add to the V1 contacts" and "Follow their Social profile"**: once only (a player who already follows them keeps following).
- **Fish's follow-up (stub):** `main-story.js FOLLOWUPS` (event `fish-followup-due`, after Mission 003, **6 in-game hours**, about 30 minutes of play, your choice so a side mission fits in; one value, `gameMinutes:360`). It fires ONCE (`story.flags.ev_fish-followup-due`) as the window event `void-tree-event`; **nothing reaches the player** until you write the call and the next mission. Mission 003's card shows where your own save stands and the in-game time it is due ("Follow-up (after in-game time)"). To build the call: a new mission "By Comms call", from Fish, trigger "After in-game time", Mission 003, 6 hours.

**For Claude and Codex:** `main-story.js` (CORPORATE, DRAFT/PROPOSED/isProposed, FOLLOWUPS, GESTURES), `game-clock.js` (new, pure: `VoidClock`), `mission-content.js` (step `await-call`, AUTO; WHEN `game-time`; unlocks `contact`/`follow`; completion stamp), `live-content.js` (merge of translator lines, V1 TRANSLATION, gesture, contact banner, the clock ticker `clockTick`, `gameClock()`), `personal-device.js` (the in-game time in the V1's header), `device-camera.js` / `device-gallery.js` (photo `gameMin`, `gameTime`), `voice-clips.js` (`with`, `translations`, `device` effect, `played` start times), `milked.js` (STAFF_DOOR, STAFF_FLAG, staffAccess, the interior-only `staffSolid`), `milked-build.js` (the locked auto door and its collision, `gesture`, `state().staffDoor`), `guide-route.js` (Milked's reception, hallway, staff corridor and office as regions, joined by the side door, the staff door and the office door), `places.js` (Milked's target: the front vestibule), `mission-guide.js` (the arrow to a Milked person from outside), `mission-givers.js` (Eva/Fish `layout`, `v1-translator`, the new kinds), `hud-data.js` (`v1Contacts`), `district-people.js` (Fish's Social profile, PROPOSED bio), `mission-editor.js` (trigger, PROPOSED tag, unlock pickers, follow-up box). Server: `void_runner_live_content.py` (same checks). Saves: plain story flags and the mission record; `clean_save` unchanged (tested). Tests: `tests/mission-003.test.cjs`, `tests/test_live_content.py` (Mission 003 save and publish), `tests/mission-003-browser.cjs` (screenshots in `docs/development/mission-003/`).

## 17 Nov 2026: The guide arrow (smoothing; the same rules for every mission)

The owner: "The mission arrow sometimes switches directions ... if it's pointing at a doorway and you walk slightly past the marker point the arrow points backwards for a bit ... look for other cases when this might happen so it's programming is set optimal for future missions." Branch `claude/arrow-smoothing`, build `2026-11-17-arrow-1`, pushed, no PR, not merged.

**What was wrong (two causes):**
1. Inside the District the arrow aimed at **one point**: the middle of the security vestibule. The checkpoint starts as soon as you are 1.2 m from that point, and you keep walking while the doors close, so you always walked past it: the arrow turned right round and pointed back into the District for the whole scan. After the scan it aimed straight at NULL, through the vestibule's side wall.
2. The arrow aimed at where its point was **on screen**. A point just under eye height and closer than about 2 m shows below the arrow's ring, so the arrow swung down (backwards) just before you reached any doorway marker.

**What it does now (every mission, old and new: nothing to set in the editor):**
- The arrow follows a **route**: out of a room, along the District's hallway, through the inner door, the vestibule and the outer door, along the alley, round street corners, through NULL's entry, Milked's front or back lobby, and the walkers' lane of a quarter gate (A1–A6). It no longer points through walls.
- A doorway is a **gate, not a point**: once you are within 1.6 m of it, or a little past it in the way you are going, the arrow moves on to the next leg. Where the next leg turns sharply (out onto the street, out of a room into the hallway) it first points straight out of the door for a step or two.
- It **never goes back** to a doorway you passed unless you really go back through it (more than 2 m).
- It **turns smoothly** (about a fifth of a second), always the short way round. It jumps (with a quick fade in) only when the goal changes: a new step, tracking a mission again after STOP TRACKING, a teleport, or a new area or quarter.
- A **moving person** is followed as they move, smoothly.
- **Close to the goal** (under 2.6 m) it fades, and under 1.5 m it disappears, so it never spins over a point you stand on, above or below.
- The number under the arrow is the distance **along the route**.

**Tunables (one place, `void-runner/guide-route.js` `TUNE`):** `passRadius` 1.6 m (a doorway counts as passed this close), `planeMargin` 0.15 m (or this far through it), `planeSlack` 0.8 m (beyond the door's half width), `apron` 1.8 m / `apronRadius` 0.9 m / `apronTurn` 0.6 rad (the "straight out of the door" point when the next leg turns), `backtrack` 2 m, `smoothTime` 0.2 s, `snapFade` 0.18 s, `nearHide` 1.5 m, `nearFade` 2.6 m, `hold` 0.35 m (direction held this close to a waypoint), `teleport` 4 m, `moveTime` 0.35 s / `moveSnap` 6 m (moving goals), `preferBonus` 4 m (the route in use wins ties: the North and South Gates' two walkers' lanes never alternate), `bayPenalty` 40 m (walkers use a vehicle bay only when standing in it), `keep` 8 m.

**For Claude and Codex:** `trackedWalkWaypoint` is now always the **goal** (the person or the place's point), never an intermediate door; `world-integration.js` `drawMissionWaypoint` hands it to `VoidGuideRoute.follower()` with the walking scene, area and quarter, and draws `bearing - walker.yaw` with `alpha`. `VoidGuideRoute.live` is the last frame's result (route ids, waypoint, bearing, alpha) for tests. The map of regions and portals is `neochinatown()` (the District's rooms from `neochinatown.js`'s walls, NULL from `ncz-nightclub.js ENTRY`, Milked from `milked.js`, every gate lane from `ncz-quarters.js LANES`, every quarter's streets with junctions where they meet); the older stations use `station()` (doors on the centre line at z 3 and z 19, as the arrow used to choose by hand); other scenes (Corporate, the Temple, VR) point straight at the goal. **A new building with doors**: add its rooms as regions and its doors as portals in `neochinatown()` (or a new graph in `graphFor`), and add a walk to `tests/guide-route.test.cjs`. `missionPlaceRoute` (mission-guide.js) and `districtRoute` (world-integration.js) now return the real goal; the prologue and faction scenes that set `trackedWalkWaypoint` themselves get the same smoothing and fading.

**Tests:** `tests/guide-route.test.cjs` (waypoint advance, hysteresis, angle smoothing with wraparound; walks: Admin to NULL through the vestibule with "0.3 m past each marker", the street to Admin, room to room in the District, the District hall to Juno Vex in NULL, the North, South, Far South (A6) and Port Customs gates, Milked front and back; a moving person; close, above and below; step change, STOP TRACKING, teleport, quarter change, reload mid-route; the older stations; and every route between the named places walked without a flip). `tests/arrow-route-browser.cjs` walks Mission 002's route in the game, frame by frame, through the real checkpoint exchange. Screenshots: `docs/development/arrow-smoothing/`.

**Not covered yet:** within one street the arrow still points straight at the goal (it turns at street corners and doors, not around a parked vehicle or a kiosk); the roof terrace has no route (it points straight); Milked's rooms inside are one region (the arrow is routed through its front and back lobbies only); the V1 map's own waypoint pointer (`district-map.js guidance`) is separate and unchanged.

## 17 Nov 2026: Admin's call gains the zoom line

Mission 002's Comms call on entering NULL is now **six lines** (the owner's text, APPROVED): "Your V1 has a camera. Press L to open your device, then select the Camera app." / "Point it at the target. Your device should identify them automatically." / "Left click will take a picture" / **"You can also zoom with the camera by using the mouse wheel"** / "Once you've taken the photograph, open Messages, select my conversation, attach the photograph, and send it to me." / "Nothing complicated. Just keep your eyes open." The voice clip was re-recorded with the new line.

**Your drafts:** if your saved draft still holds the old five-line call exactly as it shipped, the editor shows the new six lines (the shipped text wins; what is published to players wins over any draft). If you changed those lines yourself, your version is kept as you wrote it. Note: a recorded clip plays only while the call's text matches the recording word for word, so an edited call is text only until it is re-recorded.

## Fourth pass (17 Nov 2026): Mission 002 — Eyes on the Street, places, photos, Messages, reputation

Branch `claude/eyes-on-the-street`, build `2026-11-17-eyes-1`.

**What you will see.** The tree that was called "Main storyline" is now **Awakening** (your name for it; its id `main-storyline` never changes). It holds Mission 001 — Awakening and **Mission 002 — Eyes on the Street**, your text, every field editable: the offer lines, the four steps, Admin's Comms call, the two replies in Messages, the return line, the reward (100 credits and +10 standing with Admin). If your browser draft already had its own copy of the tree, Mission 002 is added to it where it stands in the shipped tree (unless you removed number 002), and the old name becomes "Awakening".

**New, and reusable for any mission:**

- **Starts: In person, with ACCEPT / NOT NOW.** The giver says the offer lines; on the last line the main button is ACCEPT and NOT NOW sits beside it. NOT NOW changes nothing: the next time the player talks to the giver, the offer comes again. Once accepted it is never offered again. (`void-runner/talk-choice.js` is the small reusable choice window.)
- **Steps "Enter a place" and "Leave a place"**, and the triggers **"Entering a place" / "Leaving a place"**, picked from the **place list** by hierarchy: System › Planet / City › Area › Exact location (today Tessaly › NeoChinatown › a quarter › a place). An "enter" step is done while the player is inside, so a player already inside when the step starts counts. The yellow arrow leads to the place (out through the District's security vestibule first when the player is inside the District).
- **Step "Photograph someone"** (tick one or more people the V1 camera identifies: the District's residents, Juno Vex, Halden Reyes; with two or more ticked, ALL of them must be in the same photo, each passing every check). Done by a photo that really shows them: in the frame and roughly centred (generous), within 15 m, nothing in the way (a line to the head or chest is clear), taken during this step. A yellow marker sits over them while the step is in progress and the mission is tracked.
- **Step "Send a photo to someone"** (pick the recipient and tick who must be in the photo: one person or several, all in the same photo). In the V1: Messages › INBOX › the recipient's conversation › ATTACH › pick the photo (preview, optional text) › SEND. "What is said" is the reply to the right photo; a second set of lines is the reply to any other photo (unlimited tries, no fail). Only a photo of that person taken during this mission counts. Photos stay on the player's computer: only what the camera checked when the photo was taken is used, nothing is uploaded. Sending photos to other players is not built (it needs server storage, a separate decision).
- **"How it is said"** on a step: in person (the conversation window), **as a Comms call** or **as a message**. Mission 002's call when the player walks into NULL is step 1's lines said as a Comms call.
- **Reward "Reputation with an NPC or a faction".** An NPC: their standing with the player (`story.relationships`, -100 to 100). A faction: `progression.reputation`. Both are kept by the cloud save as they are. Paid once with the mission.
- **Hints.** Small yellow-orange hints under the tracked-mission line for the photo and send-a-photo steps (open the V1 with the player's own key, open Camera, take the picture, open Messages, open the conversation, ATTACH, SEND), each gone once done. Every hint is tagged `data-help="1"` for your future Help switch (`story.flags.helpOff` already hides them).

**The place list (as of the fourth pass; superseded by the sixth pass: every place now has a name, see `LOCATION_NAMES.md`).**

| Level | Places |
|---|---|
| System | Tessaly System |
| Planet / City | NeoChinatown |
| Area | The Port · Old Town · The Avenue · Far South · The Outskirts · The Corporate District · Zen Zephyr's Temple · Gates and checkpoints |
| Exact location | The Darknet District (security vestibule, hallway, Sleeping Pod room, VR play area, the Arcade, the Store, the Bar, the meeting room) · the District alley · NULL (and NULL entrance) · Milked · Port Customs (A1), North Gate (A2), Function Gate (A3), East Gate (A4), South Gate (A5), Far South Gate (A6) |

**Juno Vex** (`juno-vex`), as built: the character kit's FIXER figure with the BOB hairstyle in SILVER, the outfit tinted BLACK, the gear VISOR raised onto the top of her bob, and a small lit device in her hands; she sits alone at the east end of NULL's bar, turned toward the room, idles, now and then looks round the room, and checks her device. The kit has no long coat: the FIXER outfit is a black jacket and skirt (closest available). She is there for every player at every quality; the camera names her "Juno Vex". FIXER is no longer used for NULL's other people, so nobody else there shares her look.

**Halden Reyes** (`halden-reyes`, your decision of 17 Nov 2026), as built: the kit's TRADER figure (a man in a pinstriped suit jacket and trousers) without its hat, the SHORT NEAT hairstyle in JET BLACK, the suit tinted NAVY and then taken down to a deep midnight blue, nearly black, with a little more sheen than anyone else's clothes in NULL. The kit has no long coat: the suit jacket is the closest available. He stands in front of Juno's stool, 0.85 m from her, the two turned toward each other and a little open to the room, so a photo of Juno from the floor shows him too. They take turns talking (his hands move when he talks), she still glances at her device while he looks round the room, and now and then both look out at the club. No dialogue. Mission 002's photo step and send-a-photo step both require **[Juno Vex, Halden Reyes]**: a photo of Juno alone, or with Halden out of the frame, too far or blocked, does not count ("That's not the person…" if sent). The yellow marker is one diamond over the middle of the pair. The bartender and the bar guests never wear the suited looks (TRADER, SMUGGLER), so nobody near the pair looks like either of them.

**NULL's people:** Low 2 dancers + DJ + bartender + door + Juno + Halden = 7; Medium 3 dancers + the three staff + 2 bar guests + the pair = 10; High / Ultra 4 dancers + staff + 2 bar guests + the pair = 11. The VIP pair and the queue outside are gone; the bar guests stand at the west end of the bar, away from the pair.

**Draft play and publish** carry all of the above. Draft play from a photo step starts on Main Street outside NULL; from a send-a-photo step you need a photo taken during that mission, so play from the photo step.

**For Claude and Codex:** `void-runner/places.js` (VoidPlaces: nodes, `at`, `deepest`, `tracker()` enter / leave events per player, `options()` for the picker, `target()` for the arrow); `mission-content.js` (step kinds `enter`, `leave`, `photo`, `send-photo`; step fields `subject`, `subjects` (several people in one photo: `photoNeed`, first = `npc` / `subject`, at most 6), `wrong`, `via`; start `accept`; trigger `leave`; unlock `reputation`; `photoOk`, `during`; inbox entries for a step's call or message); `live-content.js` (offer choice, the registry in the place tick, `photo()`, `sendPhoto()`, `step()`, `contacts()`); `device-camera.js` (`judge`, `capture`, `VoidPhotoSubjects`); `device-gallery.js` (`cleanMeta`, photo `meta`); `personal-device.js` (conversations, ATTACH, SEND); `mission-guide.js` (arrow to places and people, the marker, the hints); `ncz-nightclub.js` (`CAST_COUNTS`, `JUNO`, `HALDEN`, `BEATS`). Server: `void_runner_live_content.py` (same checks), `void_runner_admin_inventory.json` (`places`, `subjects`, `factions`). Saves: ordinary mission records and story flags (`v1m_<mission>_<step>` for the call), `story.relationships.admin`; nothing new for `clean_save()`. Tests: `tests/eyes-on-the-street.test.cjs`, `tests/test_live_content.py` (Mission 002 save and publish), `tests/eyes-on-the-street-browser.cjs` (screenshots in `docs/development/eyes-on-the-street/`).

## Third pass (17 Nov 2026): Mission 001, mission numbers, starting by notification, every older mission removed

Branch `claude/mission-001`, build `2026-11-17-mission-001-1`. Pushed, no PR, not merged.

**What you will see.** The tree list starts with **Main storyline** (ACTIVE: it is in the game). It holds **Mission 001 — Awakening**, your mission, with every field editable: name, number, type ("Main storyline / Introduction"), location (The Darknet District), objective ("Locate Admin"), giver (Admin), **Starts** (right under Giver: In person / By Messages / By Comms call / Notification only), the four steps, and Admin's lines. **Players never see the number**: the Mission Log, notifications and calls say "Awakening"; "Mission 001" is shown only here, in Developer Tools and in the data.

**How Mission 001 plays (your decision):** "You're awake. Good. When you're ready, come find me. We need to talk." comes through **Comms**: on the first pod exit the V1 shows "V1 · Incoming call from ADMIN · Press L to answer" with the V1 sound; L opens the call (caller, timer, waveform, your two lines appearing as a transcript; no reply; it ends after the lines or with HANG UP; it stays under RECENT CALLS). The mission is in the Mission Log and tracked as soon as the call arrives, answered or not. Then the player must meet Admin **in person**; what he says there is step 3's "What is said when this step is done" (your lines). Step 4 is done when that conversation closes.

**Your own draft tree "Awakening"** (`draft-awakening`, made before this shipped) is never deleted or merged. The editor shows a one-time note: "Mission 001 — Awakening is now in Main storyline. Your draft 'Awakening' is separate; delete it if you no longer need it."  Every older tree sits in one collapsed group at the bottom, **Removed from the game (archived)**: each says NOT IN THE GAME, can still be read, and has **COPY THIS TREE INTO A NEW TREE** (and per mission, **COPY THIS MISSION INTO A NEW TREE**). A copy is a new draft tree of yours; the archived tree never changes.

**Admin's in-person lines are yours to write.** Step 3 ("Find and speak with Admin."), "What is said when this step is done", holds one line marked **PLACEHOLDER for the owner**: "[the owner: write Admin's introduction to The Darknet District here]". It is shown only here and in PLAY THIS DRAFT. **What live players see until you write and publish the lines:** they walk to Admin and press E; no dialogue window opens; the Mission Log ticks steps 3 and 4 and the screen shows "MISSION COMPLETE · Awakening". Admin's usual "Admin has nothing for you right now." notice is not shown then (it would contradict the mission). Once your lines are published, talking to Admin shows them, and the mission completes when the player closes that conversation. No reward (none specified).

### Mission numbers

- Every mission has a number and a name. The editor shows **"Mission 001 — Awakening"** (tree list, mission header, publish check screen, versions); Developer Tools and the data keep the number (`definition.number`, `devLabel`). **Players see only the name** ("Awakening"), everywhere.
- Numbers are unique, three digits (001 to 999), given in order: **+ NEW MISSION** takes the next free number. You can **SET NUMBER** or **RENUMBER** (with a warning).
- **A number is never reused**, even after its mission is removed: the shipped ledger (`void-runner/main-story.js` NUMBERS = `save-manifest.json` missionNumbers), every number the server has published (`numbers` on the publish state), and numbers removed in your draft all stay taken. The server refuses a publish that gives a used number to another mission.
- Internal ids never change and are separate from numbers (Mission 001 is `m001-awakening`). Your existing draft trees got the next free numbers when you first open this version.

### Starting missions by notification ("How this mission starts", on every mission)

- **IN PERSON** (what every mission did before): the giver offers it when the player talks to them.
- **BY NOTIFICATION**: the mission arrives on the player's device. Choose the **channel** (MESSAGES: a text in the V1 Messages app, INBOX tab, no reply needed · COMMS CALL: a call in the Comms app, CALLS list, sender and words as a transcript; the voice plays only if a recorded clip already exists for that exact line, nothing is generated · NOTIFICATION ONLY: a banner, then the Mission Log), the **sender** (any NPC), the **header** (e.g. "ADMIN // INCOMING MESSAGE"), the **body**, and the **trigger**: first exit from the Sleeping Pod (a character who left the pod before the mission existed gets it on their next exit) · after a mission is completed · entering a place or quarter · a story flag is set.
- Either way the mission then goes into the Mission Log and is tracked. A step **"The notification arrives"** completes by itself as it arrives (Mission 001's step 2).
- Mission 001: **By Comms call**, sender Admin, header "ADMIN // INCOMING MESSAGE", your text, trigger first pod exit. Text only: the call plays a voice only when a recorded clip exists for the exact line, and none does (Admin's ElevenLabs spend is not approved).

### The V1 notification and device sounds

- When something arrives while the V1 is closed: a small banner at the right edge in the V1's style, **"V1 · Incoming call from ADMIN · Press L to answer"** (a message says "New message from ... · Press L to open") (the key is read from the player's own binding), with the device's notification sound at the sound-effects volume. It stays until the V1 is opened or fades after about 8 s, leaving "V1 · L · 1 NEW" on the V1 chip until opened. L then opens the V1 straight on Messages > INBOX. Repeats are not stacked. Desktop only: the V1 has no VR presentation.
- **Help hint:** the "Press L to open" part is marked as a help hint (`data-help`) so your future yellow/orange HELP switch can hide it. The help system itself is not designed or built.
- Sounds per device tier (`void-runner/device-v1.js` NOTIFY; three tiers: "V3 is Shadow"): **V1** (`device-v1-notify.ogg`, confirmed), **V2** (`device-v2-notify.ogg`, placeholder until the V2 exists), **V3 // SHADOW** (`device-v3-notify.ogg`, your pick). Files and licences: `void-runner/assets/audio/ui/` and its `LICENSES.md`. A missing file is silent.

### The yellow arrow for your tree missions

You tracked a mission of your own tree (giver Admin, step "Talk to Admin") and saw no arrow. Cause: a tree mission's steps named the NPC but not where they are, so the guidance had nothing to point at. Now every tracked tree mission (and Mission 001) feeds the same guidance the beginner campaign used: the arrow and the distance point at the NPC of the current step (talk to, deliver to, hand in to); from the NeoChinatown street to someone inside The Darknet District it points at the District's vestibule first. STOP TRACKING hides it. Not done yet: an arrow for "go to a place" steps and routes through checkpoint gates between quarters (places have no position in the data yet; the step text still shows). In a District game the Mission Log lists only the Main storyline and your trees: the removed beginner missions are hidden there in normal play and in PLAY THIS DRAFT.

### Your drafts are kept on the server too

On 17 Nov 2026 a tree you made ("Awakening", no missions yet) was gone after you cleared your browser history: the editor kept drafts only in this browser's storage, and clearing site data deletes it. (The code keeps an empty tree: a test makes one, reloads, plays a draft and leaves, and it is still there.) Now:

- About 5 seconds after your last edit, the whole draft (trees, missions, lines, names, numbers, the Studio draft) is saved as your **private server draft "mission-editor-workspace"** (the Stage 3B draft API, owner only, 96 KB and 100 revisions at most; older revisions stay readable). The line under the "How your edits reach the game" box says **"Saved on the server · <time>"**, or **"Server copy not available — drafts are only in this browser"** when it is off or unreachable.
- Opening the editor with an empty browser draft restores the server copy and says **"Restored your drafts from the server"**.
- If the server copy is newer than a browser draft that has content (another computer, another browser), nothing is applied or overwritten: **Two copies of your drafts** offers USE THE SERVER COPY or KEEP THIS BROWSER'S COPY (a save that meets a newer server revision gets the same choice).
- A draft this version cannot read is never thrown away: it is copied to a backup key in the browser and the editor says so. A draft that cannot be written (storage full) is reported at once.
- Drafts are per web address: thedarknetdistrict.com and www.thedarknetdistrict.com keep separate browser copies; the server copy is the same for both.

### Updates without refreshing (the old area music)

After a deploy you heard the old area music until you refreshed. Cause: the page was run by the previous version's service worker, which serves the game's files from that version's cache first; the new worker installs during that visit, but the old files are already running. Now (`void-runner/update-ready.js`, `cache.js`): when a worker with a newer build takes over, the game reloads at once if you are on the loading screen or the main menu; in play a small V1-style notice says "Update ready — it applies next time you return to the main menu" and the reload happens there. Never in a conversation, a flight (even paused behind the menu), a test or draft session. The game also checks for a new build every 15 minutes.

### Developer Tools: EXIT TO MAIN MENU

Beside CLOSE. It closes Developer Tools and goes to the main menu the way the game menu does (saving first when a normal save would). During PLAY THIS DRAFT (or a Test & Jump To session) it works like LEAVE DRAFT: the page reloads with your real save untouched and opens on the main menu instead of the editor.

### For Claude and Codex (third pass)

- `void-runner/main-story.js` (new, pure, every player): the shipped Main storyline tree, the number ledger, `label()` "Mission 001 — Name", `numberProblems`, `nextNumber`, the placeholder test `isPlaceholder` ("[the owner:" lines are shown only when `env.draft`).
- `mission-content.js`: story trees run in the tree engine (`apply` always includes them; a published copy with the same id replaces the shipped one); mission fields `number`, `category`, `location`, `objective`, `start`; step kinds `pod-exit`, `message` (the notification arrives), `hear` (lines after a talk step; done on `heard` when the conversation closes, or at once when nothing can be shown); `treeEvent` events `pod-exit` and `heard`; `inbox`/`markRead` (story flags `v1m_<id>_start` = seconds, `v1r_<id>_start`).
- `live-content.js`: the shipped story is applied at load; `podAct.exit` (world-integration.js) is wrapped (the pod room is untouched); the place tick also runs the after-mission and flag triggers; `deliver()` sends each channel to `VoidV1.notify`.
- `personal-device.js`: `VoidV1.notify({app,sub,key,text,hint:{text:'open',help:true}})`, Messages > INBOX, Comms > CALLS, the device sound. `mission-log.js`: in a District campaign only tree missions are offered, tracked or shown (`live()`), `objective` override, `number`. `beginner.js`: `RETIRED`.
- Saves: removed missions' records are kept; a tracked removed mission is untracked by `campaign.js retireMissions` (restore) and `clean_save`. `save-manifest.json`: `storyTrees`, `storyMissions`, `missionNumbers`, `retiredMissions`. Server: `void_runner_live_content.py` (`start_problems`, `number_problems`, the ledger in the publish transaction).
- Tests: `tests/mission-001.test.cjs`, `tests/update-ready.test.cjs`, `tests/test_live_content.py` (MissionNumberTests, MissionRemovalSaveTests), `tests/test_content_drafts.py` (WorkspaceBackupTests), `tests/mission-001-browser.cjs` (screenshots in `docs/development/mission-001/`), `tests/mission-editor-drafts-browser.cjs`, `tests/mission-editor-browser.cjs` (parts 1-3 now use the Main storyline; EXIT TO MAIN MENU in the editor and during draft play). `tests/beginner-browser.cjs` is retired. The browser tests serve the worktree themselves on a free port (or SITE_TEST_URL) and use the bundled Chromium; they lengthen the banner and the call (`VoidV1.bannerMs`, `VoidV1.callTail`) because the software renderer is slow.
- Server copy: `void_runner_drafts.py` kind `workspace` (`validate_workspace`, fixed id `mission-editor-workspace`, baseRevision 0, not tied to the source inventory); `mission-editor.js` `saveServer`/`loadServer`/`useServer`/`conflictBox`.

## For the owner, in plain words

Sign in with your account, open **DEVELOPER TOOLS**, then the **Mission Editor** tab (after Achievement Manager). The tab only appears for an account the server confirms as a developer. Seeing it is not permission: every save, publish and re-voice is checked again by the server.

- **Mission trees.** On the left: ACTIVE (the Main storyline), DRAFTS (your trees), and every older tree under "Removed from the game (archived)" (third pass, above). Click a tree, then a mission.
- **For each tree:** the NPCs in it (who gives the mission, who speaks, who you deliver to) with their registered voice. Voices are shown, never changed here.
- **For each mission:** the name, the credits paid, the description, then each **step** ("what the player must do"), what each NPC says at that step, where the mission ends (and any branches), and **what becomes available** (store items and which store, ships, places that open, story flags, credits, the next mission). You can add your own unlock notes (only real items, ships, places, stores and factions can be picked).
- **All lines for an NPC:** every line a character says, Admin first: in missions (by tree, mission, step and scene) and outside missions (greetings, idle remarks, "come back later" lines, the District rules such as Admin's "Scanning in here is rude" line, VR companion talk, Milked's Eva and Fish).
- **Your own scripts are protected.** Lines from your design docs 05, 06, 07, 09, 10 and 12 show **"the owner's script — locked"**. Press **UNLOCK TO EDIT MY SCRIPT** on a line to change it yourself. Claude's placeholder lines say so.
- **Drafts.** Every edit is saved as you type, as a draft in this browser. Nobody else sees it. The beginner campaign uses the same draft as the Content Studio, so both tools show the same edits.
- **PLAY THIS DRAFT** (per mission, and per step: "PLAY THIS DRAFT FROM HERE"). Closes Developer Tools and starts a throwaway test game at that step with your draft applied. An orange banner says **PLAYING DRAFT: <mission> — not your real save · LEAVE DRAFT**. Nothing is saved, to this browser or the cloud. **LEAVE DRAFT** reloads the game with your real save exactly as it was and opens the Mission Editor on the same mission and step, draft intact ("last played" is shown).
- **PUBLISH TO ALL PLAYERS** (tab "Publish & versions"). A check screen first: problems that block publishing, what changes for players, warnings for players who are part-way through a mission, voice clips that no longer match, and the edits that cannot reach players yet. Publishing makes a new version; **UNDO** puts the previous version back (also as a new version), and the list shows every version with its time. **It is switched OFF on the server until you decide to switch it on** (see "Switching things on" below).
- **RE-VOICE.** A changed line that had a voice clip shows **"voice clip out of date: text only until re-voiced"**: the game shows it as text until it is recorded again. RE-VOICE (per line, per mission, per NPC) puts it in the re-voice queue. Kokoro characters are recorded on your PC (one command below). Admin's lines are queued for **ElevenLabs, Bill Adams** and stay **"waiting for ElevenLabs re-voice (needs approval)"**: nothing is generated until you approve the spend.

## Naming trees and starting your own (second pass)

You asked: "Can I also name mission trees here? Start new ones? Will it have previous mission givers like Rook?" Yes to all three, with the limits below said plainly.

- **Name any tree.** Every tree has a **Tree name** box. The name is only what you see; the tree's id never changes, so nothing in anyone's save moves. An older tree you rename shows "was ..." with its old name.
- **+ NEW MISSION TREE** (top of the list on the left): a name and a short note. It is your DRAFT (nobody else sees it). Its id is `draft-` plus the first name you gave it and never changes, even if you rename it. Mission ids are `<tree id>-m1`, `-m2` ... and are never reused.
- **In a new tree** you can add, remove and reorder missions (they run in that order: finishing one opens the next, given by its own giver) and, in each mission, add, remove and reorder steps. Each mission has:
  - **Giver** (the picker below), **name**, **credits**, **description**, **type**.
  - **What the giver says when offering it**, and for each step **what is said when it is done** and (for talk steps) **if the player comes too soon**. Every line has a "who says it" picker. Empty lines are placeholders and are never spoken. New lines say **needs voice**; RE-VOICE puts them in the same re-voice queue as before (Admin, Iris and Rook go to ElevenLabs and wait for your approval; the others to Kokoro on your PC).
  - **Steps:** Talk to someone · Go to a place · Fly to / arrive at a place · Deliver to someone · Buy an item. Also listed so you can plan them, marked **needs a code change**: win a fight, scan with WarFlying, escort someone, pick something up in the world, wait / come back later.
  - **Where it ends:** "hand in to" an NPC at a place (optional; without one it ends when the last step is done).
  - **Branches:** kept as your design note, marked **needs a code change** (the game does not offer mission choices yet).
  - **What becomes available:** credits; a story flag (saved as `mf_<name>`, so it can never overwrite one of the game's own flags); **open route / place** (the place and its system become known, so a ship can fly there); **grant ship** (any hull from the ship list that is not a paid purchase: Kestrel or Peregrine. The ship becomes the player's with the same code as buying it. Granting any ship also gives the pad, boarding and free travel the courier hull gives, so the Kestrel comes with it. Spectre is a paid entitlement and is never given); **start tree** (links to another of your trees; see below). Marked **needs a code change**: a store item at a store (no store reads a per-player list yet), a gate opening (gates are open or shut for everyone), reputation (the game has none for the player).
- **Tree links ("start tree").** A mission, or one step of it, can start another of your trees. That tree's first mission then waits until the link fires; after that its giver offers it. Each tree shows **Links to other trees**: "leads to tree X" and "started by tree Y", and a one-line map of every link.
- **What this tree can do today** (a box on every new tree) says how many missions can be played and published now, why the others cannot, and which NPCs players cannot reach.
- **PLAY THIS DRAFT** works for a new tree's mission and from any of its steps. From the start you stand next to the giver and talk to them to get it. From a step, the earlier steps are done (and what they made available is given: a granted ship is there), and you stand next to the person or place of that step; for a flight step you start at The Port by Pad 01 with your ship. A tree that another tree starts is played as if the link had fired.
- **Publish** carries your new trees and your renames. The check screen lists **New missions**, **New givers players cannot reach in the current game**, and **Tree names**. Publishing is still OFF on the server until you switch it on.

### The giver picker (every registered NPC, where they are today)

Grouped as **In the current District game** and **Earlier characters (not in the District today)**. For each it says where they are, whether a draft with them can be played now, and whether players can reach them. Nobody was moved and nothing was written for them: placing an earlier character in the District is your story decision.

| Character | Where today | Can give a mission (TALK prompt) | Draft play | Players can reach today |
|---|---|---|---|---|
| Admin, Iris | District counter | yes | yes | yes |
| District bartender / Nyx (District) | District bar (the same prompt) | yes | yes | yes |
| Eva, Fish (Milked) | Milked, Far South | yes | yes (starts on Far South's street) | yes |
| Zen Zephyr | The Temple, past the East Gate | yes | yes (starts on The Avenue) | yes |
| Landing terminal | The Port, Pad 01 (a machine) | yes | yes | yes |
| Arcade attendant | District VR booths | no: the prompt opens the VR menu | no | no |
| District residents (Rin, Jonah, Sable, Cade, Lumi, Kei, Mags, Tavi, Bishop, Dax, DJ Vanta) | District / NULL as figures | no TALK prompt (needs a code change) | no | no |
| VR companions (Ava, Eva, Una, Yuki, Dex, Seren, Kai, Nadia) | inside VR experiences only | no (needs a code change) | no | no |
| Rook, Nyx (Meridian) | Meridian Station, the Dead Channel | yes | yes (starts at Meridian with a test ship) | only once a mission grants a ship (the beginner campaign was removed 17 Nov 2026) |
| Mara | Vesper workshop (old opening) | yes | yes (not checked with a draft mission) | Vesper is known to every District campaign: yes with a ship; she says her old opening there |
| Elias Ward | Vesper: a recording | no (a recording) | no | no |
| Dr. Elara Voss | The Vigil | yes | yes | no, unless a mission opens The Vigil |
| Marcus Vale | Holdfast | yes | yes | no, unless a mission opens Holdfast |
| Dr. Adrian Kess, Daniel Mercer | the two homeworlds | yes | yes (not checked with a draft mission) | no |
| Iona Vale (Rusthaven), Dr. Sol (Kepler) | their stations | yes | yes | no, unless a mission opens the place |

(Out of date since 17 Nov 2026: the beginner campaign is removed, so no player reaches Meridian until a mission grants a ship.) Correction to the request's example: Rook is not only in the historical opening. A District player reached Meridian at the end of the beginner campaign (FIRST DEPARTURE), and Rook stands there with his TALK prompt (what he says there by himself is his older freight conversation).

### Your first use case: Admin or Iris → a ship → fly to Rook → Rook's own tree

Built and played end to end in a browser (test text only, in `tests/mission-editor-browser.cjs` part 6):

1. Tree A, given by Admin: step "talk to Iris" GRANTS A SHIP (and can open a route); step "fly to Meridian"; step "talk to Rook", which STARTS tree B.
2. Tree B, given by Rook: its first mission waits until you have met Rook in tree A, then Rook offers it.
3. PLAY THIS DRAFT from the start (Admin offers, Iris grants the ship), then PLAY THIS DRAFT FROM HERE at the flight step: you start at The Port with the ship, board at Pad 01, fly the real route and dock at Meridian (the step completes), meet Rook (tree B starts), and Rook offers tree B's mission.

Flying from the District to Meridian needed no new flight code: the beginner campaign already does it (board at Pad 01, line up on the marker, jump, dock). A granted ship uses the same award, so the pad, boarding and Meridian as a destination work the same way. What still needs code: a flight step to a place whose route is not open (open it with "open route / place" first), store items, gates, reputation, branches, fights, scans, escorts, pick-ups, waits.

### What edits can do today, and what they cannot

| Edit | Draft | PLAY THIS DRAFT | Publish |
|---|---|---|---|
| Beginner campaign: names, descriptions, steps (label, order, what completes them), what is said at a step and the "too soon" line, credits, missions added or removed | yes | yes | yes |
| Older (historical) missions: name, description and step text in the V1 Mission Log | yes | yes | yes |
| Any NPC line shown in the conversation window (Admin, Iris, Rook, Mara, Elara, Marcus, Kess, Mercer, Milked's Eva and Fish, ...) | yes | yes | yes (text only until re-voiced) |
| Lines spoken another way (Admin's/Iris's scanning rule in `district-people.js`, VR companion talk, contract briefings) | yes | no | no: labelled **"can be edited after the next update (needs a code change)"**; kept in your draft and in **EXPORT MY EDITS** for Claude or Codex |
| "What becomes available" additions, reputation, ending notes, the Studio's choices, store items and "what is said" when handing a mission over | yes | no | no (listed on the check screen as "will NOT reach players"): the game has no adapter for them yet |
| Credits of historical missions | yes | no | no (their payment is set in campaign code) |
| Contracts (Rook's board, the chapters) | yes | no (flown contracts have no draft adapter) | no |
| Tree names (any tree) | yes | (nothing to play) | yes (shown in the editor; ids never change) |
| Your new trees: missions with talk / go / fly to / deliver / buy steps, hand-in, lines, credits, story flags, open route / place, grant ship, start tree | yes | yes | yes (missions in order up to the first one that cannot run) |
| In new trees: branches, store items, gates, reputation, fights, scans, escorts, pick-ups, waits; givers with no TALK prompt | yes | no | no: **needs a code change**, kept in your draft and in EXPORT MY EDITS |
| Voices, voice assignments, Relay broadcasts, The Function | never | never | never |

### Switching things on (waiting for the owner; nothing was changed)

Everything new on the server is **inert until switched on**. On the Render API service (Environment):

| Setting | Value | What it switches on |
|---|---|---|
| `VOID_CONTENT_EDITOR_UID` | The owner's Firebase UID (it must also be in `VOID_ADMIN_UIDS`) | Who may publish, undo, use private server drafts and the re-voice queue. Already used by the Stage 3B drafts; check whether it is set. |
| `VOID_CONTENT_PUBLISH_ENABLED` | `true` | PUBLISH TO ALL PLAYERS, UNDO, the version list, and the public `GET /api/void-runner/live-content` that every game reads. Off: players keep the shipped missions. |
| `VOID_CONTENT_DRAFTS_ENABLED` | `true` | The re-voice queue (and the existing Stage 3B private server drafts). |

Firestore: the server writes three new collections with the Admin SDK only: `vr_live_content_state`, `vr_live_content_versions` (one create-only document per version) and `vr_revoice_queue`. Recommended rules fragment (not deployed; merge into the deployed ruleset and check for broad overlapping grants first):

```
match /vr_live_content_state/{doc} { allow read, write: if false; }
match /vr_live_content_versions/{doc} { allow read, write: if false; }
match /vr_revoice_queue/{doc} { allow read, write: if false; }
```

Cost: players' reads are cached for one minute per server instance (about two document reads a minute while anyone plays); a publish or undo is one transaction (one read, two writes).

### Re-voicing on your PC (one line)

In the Mission Editor, "All lines for an NPC", press **DOWNLOAD THE RE-VOICE QUEUE**, then from the repository folder, with the voice venv's Python:

```
python tools/audio/generate.py --models <your Kokoro folder> --from-queue --queue-file mission-editor-revoice-queue.json
```

Add `--dry-run` first to see what it would record. More than 100 clips needs `--yes`. It uses each character's registered approved voice through the normal generator, so every lock applies (approval fingerprints, protected clips, the reserved slot, broadcast voices refused). Clips go where clips always go (`void-runner/assets/audio/voice/`) and ship with the next push; the editor marks them done when it sees them. Alternatively, without a file: set `VOID_OWNER_ID_TOKEN` to your sign-in token for that one command (never stored) and leave out `--queue-file`. Admin's ElevenLabs lines are only listed.

## Trees found (game data, 17 Nov 2026; every tree but the Main storyline is ARCHIVED since the third pass)

| Tree | Status | Missions | Source |
|---|---|---|---|
| Main storyline (Mission 001 — Awakening) | ACTIVE | 1 | `main-story.js` |
| Beginner campaign: Sleeping Pod to first ship | ARCHIVED (removed 17 Nov 2026; wording was never approved) | 6 | `beginner.js` |
| Vesper opening and Rook's first jobs | HISTORICAL | 9 | `mission-log.js` |
| Don't Ask Questions (Admin's sealed cargo) | HISTORICAL | 1 | `mission-log.js`, `campaign.js` |
| The Communion arc | HISTORICAL | 4 | `mission-log.js`, `campaign.js` |
| The Natural Order arc | HISTORICAL | 4 | `mission-log.js`, `campaign.js` |
| Rook's contract board (Meridian) | HISTORICAL | 3 | `campaign.js contracts` |
| Chapter: Ghost Belt / Corporate Lockdown / Beyond the Gate | HISTORICAL | 4 each | `content.js` |
| District drafts in the game data (Meet Eva at Milked, inactive) | DRAFT | 1 | `milked.js MISSION` |
| Your Studio draft's new missions; your private server drafts | DRAFT | when present | browser draft; Stage 3B |

Totals: 10 trees, 40 missions, 382 listed lines (296 from the owner's scripts). All 40 of Admin's Kokoro lines and his ElevenLabs line are listed (63 entries: the faction scenes appear under both arcs).

## For Claude and Codex

- `void-runner/mission-trees.js` (pure): extraction. Scene lines come from the `SCENES` anchor table (file, from/to text anchors, mission and slot, design doc); a test fails if an anchor disappears. Only plain quoted lines are extracted; a scene with code-built lines says "partial". `npcView` lists every speaker's lines from both voice manifests (Relay broadcasts excluded). `VOICE_ENGINES` must equal `tools/audio/revoice-engines.json` (tested).
- `void-runner/mission-content.js` (pure, loaded for every player): the one adapter. `check` (closed schema), `apply` (in place over a shipped snapshot, so versions and undo never stack), `mapLine` (edited lines), `fromDrafts`, `notApplied`, `changes`, `warnings`, `migrate` (never deletes from a save: an in-progress mission whose remaining steps are all done is completed and paid once; a tracked removed mission is untracked).
- `void-runner/live-content.js` (every player): fetches `live-content`, checks, applies, wraps `renderLine` for edited lines, migrates the loaded save. Fail safe to the shipped missions.
- `void-runner/mission-editor.js` (developers only, loaded on demand with `admin/studio-model.js`, `admin/studio-flow.js` and `mission-trees.js` by `dev-tools.js`). Drafts: `mission-editor-drafts-v1` (missions, lines keyed `speaker|original text`, played times) and the Studio's `studio-drafts-v1` for the beginner campaign.
- `void-runner/dev-test.js session()`: the throwaway session behind PLAY THIS DRAFT (same save and cloud blocking as Test & Jump To; leaving reloads without clearing the block).
- Server: `void_runner_live_content.py` + routes at the end of `void_runner_api.py`. Save compatibility: published beginner missions use ordinary mission records and `story.flags.br_<id>`, which `clean_save()` already accepts (tested); no manifest change is needed.
- `tools/audio/extract-lines.cjs` keeps manifest entries whose source is `mission-editor-queue`. Note: running it on unchanged `main` still drops about 60 older entries (existing drift); check the diff before committing a manifest.

- New trees (second pass): `void-runner/mission-givers.js` (pure; loaded for every player before `mission-content.js`): the giver facts (where every registered NPC is, their TALK prompt, draft and player reachability), the "go to" places (walking scene id + area + quarter, or the save location), step and unlock kinds. `mission-content.js`: `checkTrees`, `treesContent` (only runnable missions, in order), `treeDefinition`, `treeEvent` (offer at the giver, steps in order, hand-in, pays once with `story.flags.mt_<id>`, link flags `ts_<tree>`), `treeWants`, `unlockNow`. `live-content.js` feeds it NPC interactions (it wraps `VoidInteractions.handlers.get` once, so handlers registered later are covered; the beginner campaign keeps its turn with an NPC it is waiting on), the place twice a second, and `progression.js buy`. `mission-log.js acquire` lets owner-tree missions (`ownerTree`) into a District campaign's closed pool. `campaign.js giveShip` (shared with `buyShip`) gives a hull. The server reads the same lists from `void_runner_admin_inventory.json` (`missionEditor`), regenerated by `node tools/admin-inventory.cjs`.
- Saves: new mission records are ordinary `universe.missions` entries (`draft-...` ids pass `clean_save`); flags `mt_`, `mf_`, `ts_` pass the story-flag rules; a granted Peregrine is an ordinary `ownedShips` entry. Up to 40 new missions in total (each is a record in every player's save; `clean_save` allows 100 records). A tracked new mission that is no longer published is untracked, never deleted.
- Rook's re-voice engine is ElevenLabs `wzVFxVZCBIi6KBxNhQDI` (chosen by the owner 17 Nov 2026), as Admin and Iris. The voice registry is unchanged.

## Tests

- `tests/mission-trees.test.cjs`: every tree, NPCs, locks, unlocks, endings, Admin's lines, the adapter (apply, rollback, registry text, lines), refusals, `notApplied`, warnings and save migration.
- `tests/test_live_content.py`: publish auth (owner allowed, others 403, switched off 404), versions, stale-write 409, undo, validation, cloud-save acceptance; re-voice queue add/list/done and auth.
- `tests/test_revoice_tool.py`: `generate.py --from-queue --dry-run` against a sample queue file.
- `tests/mission-trees.test.cjs` also covers: create/rename/ids, add/remove/reorder, validation with the Studio model and the real registries, the giver roster (every registered NPC, every TALK target exists in the game's code), the adapter running talk/go/fly/deliver/buy/hand-in, refusals, held-back missions, save rules, the server's lists, and the owner's chain (ship grant, route, flight step, Rook link). `tests/test_live_content.py`: trees publish, refusals, and `clean_save` accepting the records, flags and a granted Peregrine.
- `tests/mission-editor-browser.cjs` parts 5 and 6 (`ONLY=trees`, `ONLY=chain`): a new tree made in the UI and played (Admin and Iris); the owner's chain with a real flight to Meridian.
- `tests/mission-editor-browser.cjs` (Chromium, offline, not in CI): opens the tab, screenshots at 1366x768 and 1920x1080, edits Iris's line and a step, PLAY THIS DRAFT from that step, checks the line and objective in the game, the real save and no cloud save, LEAVE DRAFT back to the same step with the draft intact, the publish check screen against a mocked server, a broken draft blocking publish, and published content applied or refused (fail safe) for players.
- Screenshots: `docs/development/mission-editor/` (second pass: `new-tree-*.png` for a tree made in the editor and played, `chain-*.png` for the Admin → ship → Meridian → Rook chain).
- `tests/stabilization-browser.cjs` smoke (`STABILIZATION_SMOKE=1`) was run once on this branch: no errors.

## Not verified

Second pass: draft play of Eva, Fish and Zen Zephyr was checked only up to standing on the right street (their handlers were called directly, not by walking into Milked or the Temple); Mara, Kess and Mercer draft play was not run; a "go to a place" step and a "buy" step were tested in Node, not in a browser; publishing with the real server switched on; real graphics hardware. 
The real server with the switches on (Firestore transactions, deployed rules, the owner's UID), a real Firebase sign-in, the Kokoro render itself (dry run only; no models here), voice clips of edited lines in a real playthrough, draft play of every historical mission (only the beginner campaign was played in the browser test; historical missions start at their place and stage, and the editor says when a mission could not be started directly), and real graphics hardware.
