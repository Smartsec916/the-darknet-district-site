# Mission Editor (Developer Tools > Mission Editor)

Built 17 Nov 2026 on branch `claude/mission-editor-1` (build `2026-11-17-mission-editor-1`), merged as #344. Second pass (naming trees, new trees, givers, ships, routes, tree links): branch `claude/mission-editor-2`, build `2026-11-17-mission-editor-3`, pushed, no PR, not merged.

## Third pass (17 Nov 2026): Mission 001, mission numbers, starting by notification, every older mission removed

Branch `claude/mission-001`, build `2026-11-17-mission-001-1`. Pushed, no PR, not merged.

**What you will see.** The tree list starts with **Main storyline** (ACTIVE: it is in the game). It holds **Mission 001 — Awakening**, your mission, with every field editable: name, number, type ("Main storyline / Introduction"), location (The Darknet District), objective ("Locate Admin"), giver (Admin), **Starts** (right under Giver: In person / By Messages / By Comms call / Notification only), the four steps, and Admin's lines. **Players never see the number**: the Mission Log, notifications and calls say "Awakening"; "Mission 001" is shown only here, in Developer Tools and in the data.

**How Mission 001 plays (your decision):** "You're awake. Good. When you're ready, come find me. We need to talk." comes through **Comms**: on the first pod exit the V1 shows "V1 · Incoming call from ADMIN · Press L to answer" with the V1 sound; L opens the call (caller, timer, waveform, your two lines appearing as a transcript; no reply; it ends after the lines or with HANG UP; it stays under RECENT CALLS). The mission is in the Mission Log and tracked as soon as the call arrives, answered or not. Then the player must meet Admin **in person**; what he says there is step 3's "What is said when this step is done" (your lines). Step 4 is done when that conversation closes.

**Your own draft tree "Awakening"** (`draft-awakening`, made before this shipped) is never deleted or merged. The editor shows a one-time note: "Mission 001 — Awakening is now in Main storyline. Your draft 'Awakening' is separate; delete it if you no longer need it."  Every older tree sits in one collapsed group at the bottom, **Removed from the game (archived)**: each says NOT IN THE GAME, can still be read, and has **COPY THIS TREE INTO A NEW TREE** (and per mission, **COPY THIS MISSION INTO A NEW TREE**). A copy is a new draft tree of yours; the archived tree never changes.

**Admin's in-person lines are yours to write.** Step 3 ("Find and speak with Admin."), "What is said when this step is done", holds one line marked **PLACEHOLDER for David**: "[David: write Admin's introduction to The Darknet District here]". It is shown only here and in PLAY THIS DRAFT. **What live players see until you write and publish the lines:** they walk to Admin and press E; no dialogue window opens; the Mission Log ticks steps 3 and 4 and the screen shows "MISSION COMPLETE · Awakening". Admin's usual "Admin has nothing for you right now." notice is not shown then (it would contradict the mission). Once your lines are published, talking to Admin shows them, and the mission completes when the player closes that conversation. No reward (none specified).

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

- `void-runner/main-story.js` (new, pure, every player): the shipped Main storyline tree, the number ledger, `label()` "Mission 001 — Name", `numberProblems`, `nextNumber`, the placeholder test `isPlaceholder` ("[David:" lines are shown only when `env.draft`).
- `mission-content.js`: story trees run in the tree engine (`apply` always includes them; a published copy with the same id replaces the shipped one); mission fields `number`, `category`, `location`, `objective`, `start`; step kinds `pod-exit`, `message` (the notification arrives), `hear` (lines after a talk step; done on `heard` when the conversation closes, or at once when nothing can be shown); `treeEvent` events `pod-exit` and `heard`; `inbox`/`markRead` (story flags `v1m_<id>_start` = seconds, `v1r_<id>_start`).
- `live-content.js`: the shipped story is applied at load; `podAct.exit` (world-integration.js) is wrapped (the pod room is untouched); the place tick also runs the after-mission and flag triggers; `deliver()` sends each channel to `VoidV1.notify`.
- `personal-device.js`: `VoidV1.notify({app,sub,key,text,hint:{text:'open',help:true}})`, Messages > INBOX, Comms > CALLS, the device sound. `mission-log.js`: in a District campaign only tree missions are offered, tracked or shown (`live()`), `objective` override, `number`. `beginner.js`: `RETIRED`.
- Saves: removed missions' records are kept; a tracked removed mission is untracked by `campaign.js retireMissions` (restore) and `clean_save`. `save-manifest.json`: `storyTrees`, `storyMissions`, `missionNumbers`, `retiredMissions`. Server: `void_runner_live_content.py` (`start_problems`, `number_problems`, the ledger in the publish transaction).
- Tests: `tests/mission-001.test.cjs`, `tests/test_live_content.py` (MissionNumberTests, MissionRemovalSaveTests), `tests/mission-001-browser.cjs` (screenshots in `docs/development/mission-001/`), `tests/mission-editor-browser.cjs` parts 1-3 now use the Main storyline. `tests/beginner-browser.cjs` is retired.

## For David, in plain words

Sign in with your account, open **DEVELOPER TOOLS**, then the **Mission Editor** tab (after Achievement Manager). The tab only appears for an account the server confirms as a developer. Seeing it is not permission: every save, publish and re-voice is checked again by the server.

- **Mission trees.** On the left: ACTIVE (the Main storyline), DRAFTS (your trees), and every older tree under "Removed from the game (archived)" (third pass, above). Click a tree, then a mission.
- **For each tree:** the NPCs in it (who gives the mission, who speaks, who you deliver to) with their registered voice. Voices are shown, never changed here.
- **For each mission:** the name, the credits paid, the description, then each **step** ("what the player must do"), what each NPC says at that step, where the mission ends (and any branches), and **what becomes available** (store items and which store, ships, places that open, story flags, credits, the next mission). You can add your own unlock notes (only real items, ships, places, stores and factions can be picked).
- **All lines for an NPC:** every line a character says, Admin first: in missions (by tree, mission, step and scene) and outside missions (greetings, idle remarks, "come back later" lines, the District rules such as Admin's "Scanning in here is rude" line, VR companion talk, Milked's Eva and Fish).
- **Your own scripts are protected.** Lines from your design docs 05, 06, 07, 09, 10 and 12 show **"David's script — locked"**. Press **UNLOCK TO EDIT MY SCRIPT** on a line to change it yourself. Claude's placeholder lines say so.
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

### Switching things on (waiting for David; nothing was changed)

Everything new on the server is **inert until switched on**. On the Render API service (Environment):

| Setting | Value | What it switches on |
|---|---|---|
| `VOID_CONTENT_EDITOR_UID` | David's Firebase UID (it must also be in `VOID_ADMIN_UIDS`) | Who may publish, undo, use private server drafts and the re-voice queue. Already used by the Stage 3B drafts; check whether it is set. |
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

Totals: 10 trees, 40 missions, 382 listed lines (296 from David's scripts). All 40 of Admin's Kokoro lines and his ElevenLabs line are listed (63 entries: the faction scenes appear under both arcs).

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
- Rook's re-voice engine is ElevenLabs `wzVFxVZCBIi6KBxNhQDI` (chosen by David 17 Nov 2026), as Admin and Iris. The voice registry is unchanged.

## Tests

- `tests/mission-trees.test.cjs`: every tree, NPCs, locks, unlocks, endings, Admin's lines, the adapter (apply, rollback, registry text, lines), refusals, `notApplied`, warnings and save migration.
- `tests/test_live_content.py`: publish auth (owner allowed, others 403, switched off 404), versions, stale-write 409, undo, validation, cloud-save acceptance; re-voice queue add/list/done and auth.
- `tests/test_revoice_tool.py`: `generate.py --from-queue --dry-run` against a sample queue file.
- `tests/mission-trees.test.cjs` also covers: create/rename/ids, add/remove/reorder, validation with the Studio model and the real registries, the giver roster (every registered NPC, every TALK target exists in the game's code), the adapter running talk/go/fly/deliver/buy/hand-in, refusals, held-back missions, save rules, the server's lists, and David's chain (ship grant, route, flight step, Rook link). `tests/test_live_content.py`: trees publish, refusals, and `clean_save` accepting the records, flags and a granted Peregrine.
- `tests/mission-editor-browser.cjs` parts 5 and 6 (`ONLY=trees`, `ONLY=chain`): a new tree made in the UI and played (Admin and Iris); David's chain with a real flight to Meridian.
- `tests/mission-editor-browser.cjs` (Chromium, offline, not in CI): opens the tab, screenshots at 1366x768 and 1920x1080, edits Iris's line and a step, PLAY THIS DRAFT from that step, checks the line and objective in the game, the real save and no cloud save, LEAVE DRAFT back to the same step with the draft intact, the publish check screen against a mocked server, a broken draft blocking publish, and published content applied or refused (fail safe) for players.
- Screenshots: `docs/development/mission-editor/` (second pass: `new-tree-*.png` for a tree made in the editor and played, `chain-*.png` for the Admin → ship → Meridian → Rook chain).
- `tests/stabilization-browser.cjs` smoke (`STABILIZATION_SMOKE=1`) was run once on this branch: no errors.

## Not verified

Second pass: draft play of Eva, Fish and Zen Zephyr was checked only up to standing on the right street (their handlers were called directly, not by walking into Milked or the Temple); Mara, Kess and Mercer draft play was not run; a "go to a place" step and a "buy" step were tested in Node, not in a browser; publishing with the real server switched on; real graphics hardware. 
The real server with the switches on (Firestore transactions, deployed rules, David's UID), a real Firebase sign-in, the Kokoro render itself (dry run only; no models here), voice clips of edited lines in a real playthrough, draft play of every historical mission (only the beginner campaign was played in the browser test; historical missions start at their place and stage, and the editor says when a mission could not be started directly), and real graphics hardware.
