# VOID//RUNNER: visual editor, guidance and controls

**Brief:** David's "Comprehensive Visual Editor & Gameplay Improvements" (2026-10-23). It has 17 parts.
**Status:** built in stages, one PR per stage. This file records:
- what exists today
- the plan for each stage
- what each finished stage delivered

Nothing is live until David merges a stage.

## 1. Audit: what the game has today

| Area | Where it lives | Notes |
|---|---|---|
| Missions | `mission-log.js` (`VoidMissions`): `definitions`, `priority`, `sync`, `tracked`, `track`, `guidance` | 18 mission definitions. The definitions are data, but the rules that start and finish missions are spread through the code. |
| Campaign states | `campaign.js`: `quests` (inheritance → arrival → legal-offer → legal-run → return → illegal-offer → illegal-run → open), `contracts`, `rookRun`, `factionDeliveries`, `supplyDeliveries`, `originMissions`, `homeworlds`, `sealedCargo` | The order of the opening jobs is fixed in code. |
| Dialogue | `faction-scenes.js` (Admin, Iris, Elara, Marcus), `homeworld-scenes.js` (Kess, Mercer), `prologue-integration.js` (Mara, District), `world-integration.js` and `scenes.js` (Rook, Nyx, Sol, Iona), `story-content.js` (Mara's intro scene) | Lines are written inline as `{who,text}`. Each NPC is reached through a `VoidInteractions` handler registered under a name. |
| Voices | `tools/audio/extract-lines.cjs` builds `assets/audio/voice/manifest.json` from those inline lines | Any editor must keep this extractor working. Another way: the extractor reads the new data files. |
| Stores | `progression.js` `P.modules` (price, slot, vendor, `listed`, `available`), `content.js` `creditGear` (launcher), `ships.js`; UI in `prologue-integration.js` `equipmentShop` / `maintenance`, `faction-scenes.js` `adminStore` | Items already have stable string ids. |
| Places | `universe.js` `locations` and `systems`; `campaign.js` `stations` | Ids are permanent and listed in `save-manifest.json`. |
| Saves | `localStorage` under `SAVE_KEY` (`game.js`); cloud saves through `void_runner_api.py` `clean_save()` | |
| Developer access | `dev-tools.js` asks the API for `developer/balance`. The server allows only uids in `VOID_ADMIN_UIDS` after verifying the Firebase token. | A real server check already exists: reuse it, don't replace it. |
| Mouse | `babylon-integration.js` (click → pointer lock, look), `prologue-integration.js` (mousedown → fire), `skirmish.js` (its own lock and fire) | The click that captured the mouse also fired. Esc left the game half-paused. |
| Dialogue layout | `game.css` `.dialogue-window` | Under 800 px wide the box sat in the page flow, so Next could fall below the window. |
| Hangar terminal | `prologue-integration.js` adds the `maintenance` interaction at [-2,1.7,-7] | Stations drew nothing there. It was an invisible spot. |

**Mission-flow PDF and the repository:** the PDF (build 2026-10-23) was generated from this repository the same day, so it matches. The differences to review are listed in its notes:
- Admin's older greeting is unused.
- Mara's "Keep her flying" only plays for old saves.
- The removed missile line is still in the voice manifest until the extractor is run again.

## 2. Stable IDs

Every editable thing gets a permanent developer ID: `M` mission, `S` store, `N` NPC, `L` location, `W` weapon, `I` item, `D` dialogue line, `T` guidance topic, `C` cargo contract.
- Mission steps are `M002-01`. Mission dialogue is `M002-D01`.
- IDs are stored in a registry file. A number is never reused, even after something is deleted.
- The game's existing string ids (`meridian`, `meet-rook`, `launcher` …) stay as the internal ids that saves use. The registry maps each developer ID to its internal id, so saves are never touched.

## 3. Data and publishing

- **Data files:** `void-runner/data/*.json` (missions, dialogue, stores, guidance, ID registry), each with a schema and a validator that runs in Node and the browser.
- **Runtime:** the game reads the data files at startup. Existing modules keep their current behaviour wherever no data overrides it, so each part can move over safely.
- **Editor:** `void-runner-editor.html`. It is a private page that opens only after the server confirms the signed-in account is a developer, using the same check as the balance tools.
- **Publishing:** GitHub Pages serves static files, so browser edits can't change the site directly. The editor:
  1. validates the data
  2. downloads a backup of the current data
  3. exports the changed JSON
  4. You commit that JSON through a pull request; it goes live when it is merged.

  An authenticated "open a PR" button is a later option. It needs a GitHub token kept on the server, never in the browser.
- **Test sessions:** they run with a separate save key and cloud saves switched off, so a real campaign is never overwritten.

## 4. Stages

| Stage | Contents | Status |
|---|---|---|
| 1. Audit and plan | This document | Done (PR 87) |
| 2. Gameplay fixes | Pointer lock that never fires on capture; Esc pauses; the mouse comes back after dialogue and menus; dialogue always fits the window; mouse-wheel weapon select (unarmed / pistol, rifle-ready); a visible hangar maintenance terminal; clearer buy-then-install | Done (PR 87) |
| 3. Missions and guidance | Universal objective markers; an optional Guidance menu (separate from missions); Rook as a cargo network with payment rules; in-person versus remote dialogue rules | Done. Markers and Guidance (PR 99); Rook cargo network, payment rules and in-person rules (§8) |
| 4. Data foundation | ID registry, JSON schemas, validator, import/export, the game reading missions, dialogue and stores from data | Planned |
| 5. Visual editor | Node canvas (drag, connect, branch), dialogue graph, property panels, search and Jump To, undo/redo, store editor | Planned |
| 6. Developer testing | Isolated test sessions, jump to a location, mission stage or dialogue, inventory states, server-checked access | Started early: Test & Jump To (place + story stage + test kit) is built. Mission-by-ID, dialogue and inventory tests come with the data in stage 4. |
| 7. Integration | The full edit → export → PR → deploy → play loop, and the required test list | Planned |

## 5. Developer Tools window (2026-10-24)

David asked to know which developer tools really exist and to have one Developer Tools window.

**Access, verified:**
- The window opens only after the server confirms the signed-in Firebase account is on the developer list. That list is the `VOID_ADMIN_UIDS` setting on Render: Firebase account ids, never email addresses.
- David's account already passes this check; that is why he sees the balance panel.
- Ordinary accounts never see the button or the menu entry. Every save of balance values, and the start of every test session, is checked again by the server.

**Where to find it:**
- the DEVELOPER TOOLS button at the top right
- DEVELOPER TOOLS in the game menu, for developers only

**Sections in the window:**

| Section | State |
|---|---|
| Combat Balance | Works: every setting has a plain name, a description, its internal key, its range and its default, grouped as the game uses them. Presets, Preview, Save (server) and Missile training are unchanged. |
| Test & Jump To | Works: pick any place and any story stage, optionally with a test kit (10,000 credits, Ward pistol, launcher, every place discovered). Nothing is saved while testing; EXIT TEST reloads the real save untouched (checked in the browser). |
| Missions & Dialogue, NPCs, Locations, Stores & Items, Tutorials & Guidance, Ships & Equipment, Import / Export, ID search | **Not built yet.** They need the data foundation (stage 4): today missions, dialogue and stores live inside the game code, so an editor would have nothing real to save into. They are not shown as empty tabs. |

## 6. Stage 2 details (PR 87)

- **`mouse-control.js` (new):**
  - One owner for pointer lock in first-person modes.
  - The click that captures the mouse is swallowed, so it never fires.
  - Esc (the browser releasing the lock) opens the pause menu.
  - Clicking or pressing a key to close a dialogue or menu takes the mouse back right away.
  - No on-screen hint while the mouse is free (David asked for the CLICK TO CONTROL box to be removed, 2026-10-23).
  - If the browser refuses pointer lock, clicks go back to normal, so the game never gets stuck.
- **Weapon wheel:**
  - The mouse wheel cycles the weapons you own: Unarmed, Ward pistol, then a Rifle slot. The rifle is skipped until a rifle exists and is owned.
  - The selection wraps around and shows in a HUD chip.
  - Keys: 1 (pistol), 2 (rifle), H (holster).
  - The page never scrolls during play.
  - Firing is impossible while unarmed. Ammo and reload are unchanged.
  - Weapons are registered in a small list, so adding a rifle later means adding one entry.
- **Weapon model:** stations and planets now show the same first-person Ward pistol as Vesper. It goes away when holstered.
- **Dialogue:** the box is pinned to the bottom of the visible window at every size. Long text scrolls inside the box, and the Next and choice buttons always stay visible.
- **Hangar terminal:** every station hangar now has a physical HANGAR / MAINTENANCE console at the interaction spot, with a lit screen, a floor ring and a sign.
  - The outfitter is labelled SHIP OUTFITTER · BUY.
  - The terminal is labelled HANGAR / MAINTENANCE · INSTALL.
- **Buy then install:** after a purchase the outfitter says where to install the item. Maintenance opens with a READY TO INSTALL list of owned items that aren't fitted, each with a one-click install, including the missile launcher.

## 7. Stage 3, part 1: markers and Guidance (2026-10-27)

- **Markers (`world-markers.js`), with Guidance on or off:**
  - The tracked objective gets a diamond with its distance, coloured by mission type: main gold, cargo cyan, side violet, tutorial blue.
  - A yellow **!** marks anyone with work, a delivery or payment for you: Rook, Admin, Iris, Dr. Elara Voss, Marcus Vale, Dr. Adrian Kess, Daniel Mercer, Dr. Sol and Iona.
  - Quiet labels (OUTFITTER, HANGAR, JOBS, PODS, SHOP …) appear on services within 14 m.
  - The off-screen arrow is unchanged.
- **Guidance:** opened from **GUIDANCE** in the game menu, with an on/off switch and 10 topics:
  - movement
  - weapons
  - the Mission Log
  - finding people
  - buying equipment
  - installing modules
  - the missile launcher
  - targeting and missiles
  - flying
  - travelling between systems
- **How it works:** a small card shows the next step for where you actually are, and the place to go gets a pulsing **GUIDE** ring.
  - The launcher topic skips the purchase once you own it and skips installing once it is fitted.
  - Away from a station, it says to go to any station.
- **No rewards:** Guidance never grants anything. The choice is saved in `story.flags` (`guideTopic`, `guidanceOff`), which cloud saves already accept.

## 8. Stage 3, part 2: Rook's cargo network and in-person rules (2026-10-27)

### Rook's cargo board (`campaign.js`, shown in `world-integration.js`)

- **Built on what was there:** Rook's numbered freight runs, the single-contract hold (`state.contract='rook-run'`), the ship's cargo capacity, the Mission Log and `story.flags`. No new save fields; cloud saves already accept everything used.
- **The board:** Rook shows one routine job at first, two from the second run, and three from the fourth. Each line says the job type, cargo, destination (and if it is interstellar), hold space, whether it is legal, the pay, and who pays.
- **Job types:**

  | Type | Legal | Hold | Pay | Paid by |
  |---|---|---|---|---|
  | Routine freight | yes | 1 | base | the receiver, on delivery |
  | Long-haul freight | yes | 1 | base + 300 | the receiver, on delivery |
  | High-value freight | yes | 2 | base + 500 | Rook, in person at Meridian, after delivery |
  | Dangerous lane | yes | 1 | base + 600 | the receiver, on delivery |
  | Restricted cargo | **no** | 1 | base + 500 | Rook, in person at Meridian, after delivery |

  Base pay is unchanged from the old runs (500, +150 per run, up to 2,000).
- **Legal stays legal:** only the restricted job is illegal, and it says so before you take it. The old runs turned every second job illegal automatically; that is gone.
- **New jobs over time:** the board changes after each finished run, and a newly opened system still gets the next routine job ("Lanes into … just opened up"). The board depends only on the save, so reloading cannot reroll it.
- **Pickup:** taking a job at Rook's booth loads the cargo; the Mission Log ticks "Collect the cargo from Rook".
- **Hold space:** a job that needs more room than the hold has free (salvage counts) shows NO HOLD SPACE and cannot be taken.
- **Handing the cargo back:** while carrying a board job, Rook offers HAND THE CARGO BACK. The job ends with no pay and no penalty, and the same run can be taken again.
- **History:** the last five runs are kept in `story.flags.rookLog`. Older finished run entries leave the Mission Log, which keeps saves inside the cloud's 100-entry limit. Rook's runs no longer go into `completedObjectives`, which used to grow by one per run toward its 200 limit.
- **Older saves:** a run accepted before this update keeps its original terms and is paid on delivery.
- **Admin's sealed cargo ("Don't Ask Questions"):** unchanged. Trouble-free, contents unknown, paid by Rook on handover.

### Payment rules

- **One job, one payment.** A pay-on-delivery job pays when the cargo is unloaded. The contract is cleared in the same step, so docking again pays nothing.
- **Pay at Rook:** delivery records what Rook owes (`story.flags.rookOwed`). Rook pays only in person, at Meridian, and clears the debt in the same step. A second talk, or reloading the paid save, pays nothing. Reloading a save from before payment still shows the debt, because that save also has the lower credit total.
- **No new job while Rook owes you:** talking to him pays first, then shows the board.
- **Failed or abandoned jobs never pay.** A lost fight retries the route; handing the cargo back pays nothing.
- **Mission Log:** pay-at-Rook runs stay open after delivery with "Collect N credits from Rook at Meridian", and the tracked marker moves to Rook. The description always says who pays.
- **Markers:** Rook's **!** shows only when he owes you pay, or when a job on the board fits your hold and you carry nothing else. It goes away once you take a job or are paid.

### In-person and remote dialogue

- **In person:** a conversation inside a station or the District now names the place in its heading (for example MERIDIAN STATION). Before this, every in-person conversation with a heading (Rook's booth, Admin and Iris in the District) was labelled INCOMING TRANSMISSION.
- **Remote:** calls and messages keep INCOMING TRANSMISSION:
  - Rook's missile message ("A message from Rook")
  - Mara on the comm after the practice circuit
  - the mission terminal's cargo contacts when that person is not in the station. The button says CALL / name instead of TALK / name, and the heading says "Comms channel · cargo job".
- **Deliveries:** the person who speaks on arrival is someone actually at that dock:
  - **Kepler:** Dr. Sol, still handed over at the bar.
  - **Rusthaven:** Iona.
  - **Everywhere else:** the dock's cargo receiver.

  Before this, Dr. Sol "spoke" on arrival at every station, and Rook at the Foundry, where neither is.
- **Checked and already correct:**
  - Rook and Nyx: Meridian.
  - Admin and Iris: the District.
  - Dr. Elara Voss: The Vigil.
  - Marcus Vale: Holdfast.
  - Dr. Adrian Kess: The Nexus.
  - Daniel Mercer: the Natural Order homeworld.
  - Mara: Vesper, or on the comm.

  Each talks only through an interaction where they stand. No NPC was moved or duplicated.

### Voice

- **New voiced line:** one, Rook's "Client confirmed the drop. Here's your pay." It is UNREVIEWED and awaits David's approval. It is rendered in Rook's existing voice (`rook-c5d856b671.ogg`); `extract-lines.cjs --check` passes.
- **Not voiced:**
  - job details on the board (data, not dialogue)
  - the receiver's arrival lines (not a cast voice)

### Not in this stage

- Destination NPCs offering their own jobs.
- Other givers using the cargo board.
- Paying at a third contact.
- Faction, WarFlying, Relay, piracy and wanted-level work.

The payment rules support a third contact, but no job uses one yet. Any new giver or contact is a story decision for David.
