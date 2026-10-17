# VOID//RUNNER: Development Handoff

**As of:** 2026-10-15 · **`main` at:** PR #47 merged (`24a7071`) plus this handoff PR · **Owner and creative authority:** David (GitHub `Smartsec916`)

This document moves VOID//RUNNER development from a long Claude conversation to Claude Code. Read it together with `CLAUDE.md`, which covers how to work in the repo. David's original design documents are in `docs/void-runner/design-source/`. That folder's README says which parts later decisions have superseded.

## 0. Status labels used in this document

| Label | Meaning |
|---|---|
| **IMPLEMENTED** | In `main` and playable. |
| **APPROVED** | David agreed to it. Not necessarily built. |
| **DAVID'S SCRIPT** | Dialogue or scene text David wrote himself. Treat it as approved content. Anything it leaves open still needs a proposal. |
| **PROPOSED** | Suggested and waiting on David. Not canon. Do not build. |
| **CLAUDE-WRITTEN, UNREVIEWED** | Built as functional placeholder text. David has not reviewed the wording. |
| **REJECTED / REMOVED** | Do not reintroduce. |
| **DEFERRED** | Saved for later. Do not build now. |

---

## 1. Vision and design (APPROVED; source: `design-source/01-master-plan-oct-2026.md`)

VOID//RUNNER is a browser-based industrial sci-fi action/adventure game built with Babylon.js. It is set in The Darknet District universe. It combines:

- first-person exploration and combat
- spaceflight and ship combat
- cargo hauling and smuggling
- bounty hunting
- station and derelict exploration
- ship buying and customization
- character dialogue
- political factions with player choice
- an evolving campaign with optional side missions

**Principles:**
- Player freedom; believable, inhabited places; meaningful progression.
- No survival grind. Short sessions must not lose progress.
- Preserve working systems, avoid rewrites, and keep saves compatible.
- Centralize mission logic and balance data.
- Optimize for browsers. Target hardware includes the ASUS ROG Ally Extreme.
- Keep Iris integrations isolated from core game systems and from the website chatbot.

**Art direction:**
- Grounded, worn, industrial sci-fi, with cyberpunk commercial environments in Tessaly.
- David's concept art for the Kestrel, Mara, Meridian Station, Vesper and the derelict station is on his PC under `D:\Pictures\Game\Start\…`. It is not in the repo, so ask him for images when needed.
- David plans to make new 3D assets in **Blender** (GLB/glTF). The asset hook system (`asset-pipeline.js`, `VoidAssets.instance('opening:<id>', …)`) lets imported models replace the built-in geometry.

**Process (binding; `design-source/02-world-expansion-design-brief.md`):**
- Story and world are designed collaboratively.
- Give options (3–5) using the mission proposal format in §13 of that brief.
- Use the approval stages, and do not implement unapproved story.
- Challenge weak ideas honestly.

---

## 2. What the game does today (IMPLEMENTED)

- **Menu:**
  - Login (Google or a District "handle"), New Campaign, Load, Settings/Keybindings, Logout.
  - **Skirmish** is separate from the campaign: flight skirmish and FPS skirmish in station and derelict environments.
- **Opening on Vesper (starting planet, Erebus system):**
  - **Mara asks whether you want the tutorial.** "Yes" runs Ground Training then Flight Training. "No" skips straight to the cargo campaign: you get Elias's pistol, the Kestrel, and Meet Rook tracked.
  - Elias Ward's hologram recording, the pistol (10-round magazine), shooting cans at the range, and the flight practice circuit over Vesper.
  - The Vesper settlement:
    - workshop/garage, habitats, store, bar, roads, poles, tanks
    - sparse NPC ship traffic
    - Monument Valley-style 3D buttes and spires, ranges built from layered noise, and sandstone boulders (PR #47)
- **Flight:**
  - Throttle, braking, yaw/pitch/roll, heat and power, damage, repair.
  - Ace Combat-style missile lock with lock-on warnings, lasers, and enemy AI.
  - Warp travel with a cinematic fly-by. Local jumps take about 14 s and interstellar jumps about 28 s.
  - A painted Kestrel **cockpit overlay** (`cockpit-overlay.js`), framed with wide windows. David approved it as "perfect".
  - Head-on docking into hangars.
- **Stations:** all walkable in first person.
  - Meridian Station (Rook, Nyx, outfitter, the Dead Channel bar, mission terminal, textured pressure door).
  - Kepler (Dr. Sol), Rusthaven Port (Iona Vale), the Foundry, Tessaly Belt Anchorage.
  - The derelict station, with a walkable, fightable upper catwalk level.
- **Tessaly:**
  - **NeoChinatown** city landing: skyscrapers, corporate ads everywhere.
  - **The Darknet District** in an alley near the landing: security door, vestibule badge scan, hallway, VR/arcade, bar, Admin and Iris's shop, vending, sleep pods (which save), meeting room, and stairs to the smoking area.
  - Vantor (the underground city formerly called Mars).
- **Mission Log:**
  - Opened with the **L** key (rebindable) or the on-screen "MISSION LOG · L" button.
  - Shows active and completed missions, objectives, destinations and rewards.
  - Track/untrack. Untracking never abandons a mission.
  - Auto-tracks the next mission unless the player explicitly untracks.
  - **One yellow 3D direction arrow** points at the tracked goal in the current area, or at the warp marker or ship when the goal is elsewhere.
- **Economy and ships:**
  - Credits; upgrades for guns, armor, engines and shields; credit gear (vector drive, scout drone, missile launcher).
  - Ships: Kestrel/01 (starter, **cargo 2 units**), Peregrine/02 (1,000 cr, cargo 2), Spectre/03 (premium, real-money concept).
- **Saves:**
  - Local save, plus a cloud save validated by the server.
  - Autosave on docking, landing and purchases, and at checkpoints.
  - Death returns you to the last checkpoint.

---

## 3. Completed development work (merged PRs)

Earlier work, PRs #1–#31, was largely delivered by Codex and uploaded in packages. It covered the foundation:

- Babylon renderer, flight overhaul, network/premium travel
- hangars and flight HUD, menu/story/audio
- progression, opening, Meridian menu, Vesper
- derelict and skirmish, reliability, tutorial/menu/save

The reports for that work are the `VOID-RUNNER-*.md` files in the repo root.

This conversation (Claude), 2026-10-14 to 2026-10-15:

| PR | What it delivered |
|---|---|
| #32–#36 | Site-wide work, not game work: Iris chat hardening, security headers, CI, SEO, faster loads, homepage tech accents, District handles (sign-in without Google). |
| #38 | Tutorial split from the cargo campaign; Mission Log on **L**; auto-tracking; post-processing pass. |
| #39 | Painted Kestrel cockpit, later widened so more window shows. |
| #40 | Clearer mission waypoint arrow, linked to the tracked mission. The floating marker over the goal was removed. |
| #41, #42 | Art pass: Vesper, Kestrel, Meridian Station, derelict hangar; NPC ships around Vesper. |
| #43 | Kestrel hold raised to 2 units; derelict catwalks became a walkable, fightable upper level. |
| #44 | NeoChinatown and The Darknet District, built from David's facility layout; Sol renamed to Tessaly in the UI; Vesper outdoor art; Meridian door texture; lower arrow; less Vesper traffic. |
| #45 | Optional tutorial (Mara asks); Mission Log key hint; Tessaly's own ad style (12 brands, `ad-art.js`); Mars renamed to Vantor in the UI. |
| #47 | Natural Vesper terrain (replaced #46); internal id `undertow`→`rusthaven` with save migration; repeating Rook freight runs. |
| (this PR) | Faction deliveries: Cantor System / The Vigil and Garrow System / Holdfast; Admin (doc 05), Elara Voss and Marcus Vale (doc 07), Iris's payment and second offer (doc 06). |

---

## 4. Mission tree and progression

`docs/void-runner/mission-tree.html` is the visual version, though slightly stale.

### 4.1 Tutorial: optional (IMPLEMENTED)

| ID | Mission | Starts | Ends | Giver |
|---|---|---|---|---|
| `ground-training` | Ground Training | Vesper | Vesper (range) | Mara |
| `flight-training` | Flight Training | Vesper | Vesper (practice circuit) | Mara |
| `first-station` | First Station / Outfitting | any hangar | any hangar | Rook |
| `combat-qualification` | Combat Qualification (2 combat runs, launcher voucher, lock and fire a missile) | Erebus | Erebus | Rook |

If the player declines the tutorial, `story.flags.tutorialSkipped=true` and `progression.groundDone()` returns true.

### 4.2 Main cargo campaign (IMPLEMENTED; quest state machine in `campaign.js`)

| Quest / ID | Mission | Starts | Ends | Giver | Pay |
|---|---|---|---|---|---|
| `meet-rook` (`arrival`) | Cargo Delivery / Meet Rook | Vesper | Meridian | Mara | 200 bonus |
| `legal-run` | An Honest Living: water filters | Meridian | Kepler | Rook | 350 |
| `return` | Back to the Dead Channel | Kepler | Meridian | Rook | — |
| `illegal-run` | No Questions Asked: memory wafers | Meridian | Rusthaven | Rook | 800; Iona fits MK2 guns |
| `open` | Free play; contracts unlock | — | — | — | — |
| `meet-admin` | Meet Admin | Meridian | NeoChinatown → The Darknet District | Rook | — |

Free travel and Tessaly unlock when the prologue completes, meaning the missile qualification is done. At that point `meet-admin` is acquired and tracked. **Meet Admin is currently the end of the main story.**

### 4.3 Repeating Rook freight runs (IMPLEMENTED in PR #47; CLAUDE-WRITTEN, UNREVIEWED dialogue)

David's instruction: *"Let the Rook cargo missions keep going. If a new System opens up have it be to that System."*

- After the prologue (`quest==='open'` and `progression.completed`), talking to **Rook at Meridian** offers "Rook freight run #N". The player chooses ACCEPT RUN or NOT NOW.
- **Destination:** the first run after a system is newly discovered goes to **that system's hub**; today that is Tessaly → `sol-belt`. Otherwise runs rotate through discovered locations, excluding Vesper and the current location.
- **Pay and danger rise with each run:**
  - reward = 500 + 150 per step, capped at 2,000
  - enemies = 4 + step
  - tier = 1 + 0.3 per step
  - steps cap at 8
  - legality alternates: odd-numbered runs are legal, even-numbered runs illegal
- **State:**
  - `state.contract='rook-run'`
  - `story.flags.rookRuns` (int, completed count)
  - `story.flags.rookRunTo` (destination of the active run)
  - `story.flags.rookSystems` (comma list of systems already served, default `erebus`)
- **Mission Log:** each run is its own entry (`rook-run-1`, `rook-run-2`, …) and is tracked on accept.
- **Code:**
  - `campaign.js`: `rookRun`, `rookRunTarget`, the `missionFlight` branch, and `accept`/`complete`
  - `world-integration.js`: `rookFreightOffer`
  - `mission-log.js`: titles
  - `save-manifest.json`: `rook-run`
  - Tests: `tests/rook-runs.test.cjs` and `tests/test_story_save.py`
- **Fix in the same PR:** a run whose destination is another system's hub flies as one interstellar leg. Before, it ended as a transit stop and the run never completed.
- Delivery is paid on arrival and docking. A return to Rook is not required.

### 4.4 Side contracts (IMPLEMENTED; cargo board after the prologue)

| ID | Contract | Giver | Ends | Pay |
|---|---|---|---|---|
| `medicine` | Cold Chain | Dr. Sol | Kepler | 650 |
| `ghost` | Ghost Hardware | Iona Vale | Rusthaven | 1,000 |
| `foundry` | A Debt in Steel | Rook | Foundry | 1,500 |

### 4.5 Legacy chapters (IMPLEMENTED in code; their future is **UNDECIDED**)

Twelve missions from an earlier version, all given by Rook and unlocked in order:

- **Ghost Belt:**
  - `belt-1` Dead Reckoning → Kepler
  - `belt-2` Shattered Lane → Foundry
  - `belt-3` Last Light → Meridian
  - `belt-4` The Iron Mouth → Foundry
- **Corporate Lockdown:**
  - `lockdown-1` Unlisted Passengers → Rusthaven
  - `lockdown-2` Cut the Power → Kepler
  - `lockdown-3` Evidence Locker → Meridian
  - `lockdown-4` Hostile Takeover → Rusthaven
- **Beyond the Gate:**
  - `gate-1` Event Horizon → Rusthaven
  - `gate-2` Voices in the Static → Kepler
  - `gate-3` The Other Side → Foundry
  - `gate-4` Void Sentinel → Meridian

Claude's suggestions, all PROPOSED:
- Keep Ghost Belt as side-job material.
- Rework Lockdown as a Tessaly / The Function chapter.
- Defer Beyond the Gate to the alien expansion.

David has not decided. Several of these, plus Rook's runs and the contracts, overlap with each other.

### 4.6 Faction deliveries (IMPLEMENTED; DAVID'S SCRIPTS, docs 05, 06 and 07)

| ID | Mission | Starts | Ends | Giver | Pay |
|---|---|---|---|---|---|
| `communion-delivery` | Communion delivery: advanced electronics and research equipment | The Darknet District | The Vigil, Cantor System → back to the District | Admin (or Iris, if taken second) | 1,200, paid by Iris |
| `order-delivery` | Natural Order delivery: mechanical components and industrial supplies | The Darknet District | Holdfast, Garrow System → back to the District | Admin (or Iris, if taken second) | 1,200, paid by Iris |

- Admin offers both after Meet Admin. The player can ask about either, take one, or think about it.
- Arriving pays nothing. Handing the cargo to Dr. Elara Voss or Marcus Vale counts as delivered, and the goal becomes "Return to The Darknet District and collect payment".
- On the visit where the first payment waits, Admin is "occupied" (not shown) and Iris runs the counter. She pays, then offers the remaining delivery, which the player can take or leave for later. On every other visit Admin and Iris are both behind the counter (doc 09).
- The second delivery is paid the same way, and Iris closes with her last line.
- After both deliveries, Claude must **propose several next-chapter directions**. Doc 06 §7 lists them: Rook, Admin/Iris, Communion, Natural Order, independent cargo, exploration/bounty. Nothing may be finalized without approval.
- **Faction battles (IMPLEMENTED; doc 08):** each delivery's outbound jump drops out once, halfway, beside a small Communion vs Natural Order fight. See §9.2.1.
- **Iris follow-up contracts (IMPLEMENTED; doc 09):** once both introductory deliveries are paid, Iris offers a Communion and a Natural Order supply contract (`communion-supply`, `order-supply`; placeholder pay 1,500 each, David will balance later). Each is delivered to Elara or Marcus and paid by Iris. Delivering one makes that recipient offer a homeworld mission ("I'm interested" / "Not right now"); the offer stays with them until taken. Accepted homeworld missions (`communion-origin-mission-01`, `natural-order-origin-mission-01`) are placeholders: no destination, objectives or rewards, never completable, never auto-tracked; the game says they are not yet available.

---

## 5. Approved storylines and dialogue

- **Opening (APPROVED; IMPLEMENTED):**
  - The player is a mechanic on Vesper who worked for **Elias Ward**: older, fair-minded, now dead, appears by hologram.
  - **Mara** gives the pistol and the Kestrel and sends the player to **Rook** at Meridian.
- **Tutorial offer (APPROVED; IMPLEMENTED):**
  - Mara asks before starting the tutorial. If the player declines, she sends them to Rook and starts the first cargo mission.
  - The player is told L opens the Mission Log.
  - The exact wording of her offer is Claude's.
- **Rook's opening lines** (filters to Kepler, wafers to Rusthaven, missile line): existing game text from before this conversation.
- **Rook freight-run lines** (PR #47): CLAUDE-WRITTEN, UNREVIEWED. Example: "Lanes into Tessaly System just opened up. Get in before everyone else does…"
- **Admin/Iris at the District** (`faction-scenes.js` replaces the old placeholder `admin` interaction):
  - Admin plays doc 05, completes `meet-admin`, and sets `story.flags.metAdmin` and `story.flags.metIris`.
  - Iris plays doc 06. Elara and Marcus play doc 07.
  - **CLAUDE-WRITTEN, UNREVIEWED** functional lines, shown only in edge cases:
    - Admin, while a delivery is under way: "You've got a delivery to make. Come back when it's done."
    - Admin, once introductions are done and nothing is under way: "Iris has the contracts. I just make the introductions."
    - Admin, if the player is carrying another contract: "Finish the job you're carrying first. Then we'll talk."
    - Iris, same case: "You're already carrying someone else's cargo. Come back when your hold is free."
  - When the player returns to Admin after "I'll think about it", Admin reopens with his own line from doc 05 ("So, what do you think?…"), as approved. If the player declines Iris's offer, she repeats her offer lines from doc 06 on the next visit.
  - The script's stage directions (glances, pauses) are not shown; there is no animation for them yet.
- **David's scripts** (verbatim in `docs/void-runner/design-source/05-*.md` and `06-*.md`):
  - **Doc 05 (Admin):**
    - The player can ask about either delivery before deciding. Asking never accepts.
    - Three final choices: Communion delivery, Natural Order delivery, or "I'll think about it".
    - The chosen delivery auto-tracks and shows in navigation. The other contract stays available.
    - No faction allegiance, and no major faction secrets revealed.
  - **Doc 06 (Iris):**
    - After the first delivery the objective becomes "Return to The Darknet District and collect payment". **No payment on delivery.**
    - Iris (Chief Security Officer) is at the counter; Admin is "occupied". Do not explain his absence unless approved.
    - Iris pays, then offers the remaining delivery. The player can take it or leave it for later.
    - The second delivery is paid the same way, and Iris has a closing line.
    - Record which faction was first. Both factions stay accessible.
    - Unlock "the next approved campaign chapter when available".

---

## 6. The Communion and the Natural Order (lore APPROVED; first locations and recipients APPROVED)

From the master plan and doc 05:

- **The Communion:**
  - A religious civilization that embraces AI and cybernetic augmentation.
  - It once worshipped a powerful planetary AI that was destroyed. Since then it has regressed technologically and socially, and many believers await the AI's return.
  - Technology: advanced targeting, augmentation, electronics. Admin: *"practically worship the stuff."*
  - Admin's delivery to them: advanced electronics and research equipment.
- **The Natural Order:**
  - Opposes AI and augmentation, and prefers older, less AI-dependent technology. Its ships and equipment should look it.
  - Sometimes raids through the neutral commercial system, which was "Sol" in the plan and is now Tessaly.
  - Admin's delivery to them: mechanical components and industrial supplies.
- The two have argued for generations and occasionally shoot at each other. Admin: *"Trouble's good for business. Long as it stays somewhere else."*
- **Player choice later in the campaign:** support the Communion, support the Natural Order, or stay neutral. Neutral must remain viable. Faction choices affect missions, relationships, equipment and opportunities.
- A fourth, alien faction is DEFERRED to a future expansion.
- **Iris is an android.** Her relationship to either faction is a rich opportunity, but it **must not be assumed or established without approval**. The District is not aligned with either faction.
- **Territory (APPROVED, Option 1 + Set A names, 2026-10-15):** two new systems, one outpost each, both one interstellar jump from Tessaly.
  - Communion: **Cantor System** (`communion`), station **The Vigil** (`vigil`): pale, smooth, cyan-lit, with a halo ring and a wall of small lit panels.
  - Natural Order: **Garrow System** (`natural-order`), outpost **Holdfast** (`holdfast`): riveted steel, pipework, amber lamps, cargo crates.
  - A system opens on the map only when the player **accepts** that delivery.
  - The Communion's dead-AI world is deliberately left unnamed.
- **Recipients (DAVID'S SCRIPT, doc 07):** Dr. Elara Voss, Research Logistics Coordinator (The Vigil); Marcus Vale, Industrial Supply Supervisor (Holdfast). Neither is a leader. Their views are personal opinion and rumor.
  - Elara Voss is unrelated to Mara (Mara's in-game surname "Voss" was dropped). Marcus Vale and Iona Vale are unrelated.
- **Still not decided:** follow-up chains, faction reputation rules, and anything beyond these first visits.
- `factions.js` exists, with relay and reputation scaffolding. Check what it already supports before adding faction state.

---

## 7. Established NPCs

| NPC | Where | Role | Status |
|---|---|---|---|
| **Elias Ward** | Vesper (hologram) | The player's late employer; fair-minded. | Canon. A proposal to make his past the thread linking the opening to the faction story is PROPOSED, not approved. |
| **Mara** (no surname; "Voss" removed from game text 2026-10-15) | Vesper workshop | Older, subdued mechanic; tutorial; gives pistol and ship; sends the player to Rook. | Canon. David said he'll work on characters later. |
| **Rook** | Meridian, the Dead Channel booth | Cargo contact. Jobs grow in value, risk, distance and illegality (smuggling, pirates, interdiction). Sends the player to Admin. | Canon. |
| **Nyx** | Meridian bar | Bartender; points the player to Rook and the shop. | Existing game character. |
| **Dr. Sol** | Kepler | Clinic contact; gives Cold Chain. | Existing game character. Its name is unrelated to the old Sol system. |
| **Iona Vale** | Rusthaven | Keeps Rusthaven running; gives Ghost Hardware. | Existing game character. |
| **Admin** | The Darknet District shop, NeoChinatown | Central District figure: knowledgeable, resourceful, hard to intimidate, casual and pragmatic. Indifferent to faction ideology. Has a shop, missions and story connections. | Canon (doc 03). David said "I'll work on characters later, Admin and Iris". Do not invent his backstory. |
| **Iris** | The Darknet District | Female android, **Chief Security Officer**, associated with Admin. Intelligent, observant, dry and sarcastic but competent. Runs the counter while Admin is away. | Canon (doc 03 and doc 06). Keep her separate from the website's Iris chatbot. |
| **Dr. Elara Voss** | The Vigil, Cantor System | Communion research logistics coordinator; receives the Communion delivery. Pale coat, glasses, cyan implant. | Canon (doc 07). Available for future missions. |
| **Marcus Vale** | Holdfast, Garrow System | Natural Order industrial supply supervisor; receives the Natural Order delivery. Brown work coat, beard, no implants. | Canon (doc 07). Available for future missions. |

---

## 8. Systems and locations

| System (id) | Location (id) | Display name | Notes |
|---|---|---|---|
| Erebus (`erebus`) | `vesper` | Vesper | Starting barren planet: Ward Freight Workshop, monument-valley desert. Returning never restarts the tutorial. |
| | `meridian` | Meridian Station | Erebus hub. Layout: hangar → shop/outfitter → corridor → Dead Channel bar at the far end. |
| | `kepler` | Kepler | Working station, freight crews. |
| | `rusthaven` | **Rusthaven Port** | Salvage port, magenta beacons. Internal id was `undertow` before PR #47. |
| | `foundry` | The Foundry | Industrial. |
| | (derelict) | Derelict space station | Gangs and pirates; FPS combat; catwalk level. |
| **Tessaly** (`sol`) | `sol-belt` | Tessaly Belt Anchorage | Tessaly hub and interstellar arrival point. |
| | `earth` | **NeoChinatown** | City landing with tall skyscrapers. David will add POIs. **The Darknet District is in an alley near the landing.** |
| | `mars` | **Vantor** / Underground City | Renamed from Mars. "Vantor" is a working name awaiting David's confirmation. |
| **Cantor** (`communion`) | `vigil` | **The Vigil** | Communion station and system hub. Opens when the Communion delivery is accepted. |
| **Garrow** (`natural-order`) | `holdfast` | **Holdfast** | Natural Order outpost and system hub. Opens when the Natural Order delivery is accepted. |

**Tessaly canon (APPROVED):**
- Heavily corporatized and profit-first. It sells to every system, which keeps it neutral.
- **Advertising everywhere.** It is inspired by David's Blackout Protocol game but has **its own style**: better graphics, dark, adult and corporate, selling ship parts, weapons and services, and less jokey.
- **The Function** is the corporate government of all of Tessaly and runs NeoChinatown. Admin's placeholder line: "The Function charges for parking…".
- Tessaly **replaces Sol everywhere**, so there are no real-world landmark comparisons.

---

## 9. Current state of ongoing work

### 9.1 Mission tracking (IMPLEMENTED)

- **Code:** `mission-log.js` is the centralized manager:
  - `definitions`, `acquire`, `complete`, `sync`, `track`/`untrack`, `nextMission`, `guidance`
  - The priority order for auto-tracking is in `priority`.
  - Missions without a definition (contracts, chapters, Rook runs) are described from `campaign.missionFlight`.
- **Arrow:** `world-integration.js` and `prologue-integration.js` set `trackedWalkWaypoint` for the 3D arrow.
  - David wants **only the arrow**, not a floating marker over the goal.
  - In the same area the arrow points at the object. Elsewhere it points at the warp marker or ship.
  - It was lowered so it points at the goal better.
- **Adding a new story mission:**
  1. Add a definition (with `objectives`, `destination`, `interaction`).
  2. Acquire it where the story grants it.
  3. Complete objectives from the relevant interaction.
  4. Add tests in `tests/mission-system.test.cjs`.

### 9.2 Faction deliveries (IMPLEMENTED; see §4.6)

- **Rules (`campaign.js`, unit-tested in `tests/faction-deliveries.test.cjs`):** `factionDeliveries`, `factionOffers`, `acceptFaction`, `deliverFaction`, `collectFactionPayment`, `heldForAdmin`. The generic `accept()` routes these contracts through `acceptFaction`, so the cargo board cannot bypass the offer rules.
- **Scenes (`faction-scenes.js`):** Admin, Iris, Elara and Marcus; a small choice-menu helper (`ask`), styled by `.choice-menu` in `game.css`. It also leads the arrow through the District door to Iris when payment is due.
- **Save state (all in `story.flags`, so old saves and the server need no new fields):**
  - `factionFirst`: `communion` or `natural-order`
  - `communionDelivery`, `orderDelivery`: `accepted` → `delivered` → `paid`
  - `adminOccupied`: true only while the first faction payment waits (hides Admin; `notFlags` condition in `story.js`). The older `adminAway` flag is removed on load.
  - `communionSupply`, `orderSupply`: `accepted` → `delivered` → `paid`
  - `communionOrigin`, `orderOrigin`: `offered` → `accepted` (homeworld placeholders)
  - `factionIntro`: Admin's full introduction has played
  - `factionsVisited`: both deliveries paid
- **Mission Log:** definitions in `mission-log.js` with objectives arrive → deliver → payment. A new `after` field moves the goal back to the District once the cargo is delivered.
- **Universe:** known systems are now derived from known locations on load, so a newly opened faction system survives a reload. `U.discover()` opens a location without visiting it.
- **Rook:** runs into a faction system are held until the player has made Admin's delivery there (approved). After that, Rook's new-system rule sends the next run there.
- **Server:** `save-manifest.json` lists the new locations, systems and contract ids; `clean_save()` reads allowed systems from the manifest.

### 9.2.1 Faction battles (IMPLEMENTED; design doc 08)

- **When:** on the outbound jump of each District delivery, while that cargo is aboard. The warp drops out once at the halfway point ("WARP DROP · Weapons fire near the Cantor/Garrow System border"). The drive recharges for 8 seconds (`route.recharge` in `warp.js`), then the player re-aligns and jumps on whenever they like. The trip is no longer overall, and the warp resumes from where it stopped.
- **Placement choice (Claude's, flagged for David):** interstellar jumps had no mid-route stop before. The drop reuses the existing re-align-to-resume step. The alternative would be to show the fight only in passing during arrival, with no control.
- **The fights:** 2 Communion vs 2 Natural Order ships, opening about 15° off the nose and 135–140 m out, never straight ahead. They last 30–60 seconds; then the survivors break off and jump out.
  - **Cantor route:** Natural Order raiders (brawler + hauler) hit a Communion lancer picket.
  - **Garrow route:** a Communion patrol (warden + lancer) presses two Natural Order brawlers, with a Natural Order wreck already drifting.
  - Outcomes vary run to run. Usually one or two ships are destroyed (small explosion and a slowly tumbling wreck). Damaged ships trail smoke.
- **Ship designs (`factionShipModel` in `babylon-renderer.js`; imported models named `ship:communion-lancer` etc. replace them):**
  - **Communion lancer / warden:** smooth elongated white hull, silver blade wings, sensor visor instead of a cockpit, cyan spine light, cyan halo-ring drive. Precise single cyan bolts, smooth turns, wingman holds formation, controlled jinks when hit.
  - **Natural Order brawler / hauler:** boxy gunmetal hull, bolted side armour with seams, orange service band, crew canopy, stub-wing cannons, exposed pipes, twin (hauler: triple) amber burners, turret on the hauler. Heavy 4-round amber bursts, direct attack runs, abrupt jinks.
- **Neutral player, enforced in code:**
  - Battle ships are never in the game's enemy list, so they can't be targeted, locked or fired upon by combat code, and they never fire at the player.
  - They target only the opposing faction.
  - Their bolts are deleted before they get within 14 m of the player.
  - They steer away from the player and never ram.
  - No reputation, hails or scans.
  - Player shots pass through them; no retaliation was added, as the brief asked.
- **Saved:** `story.flags.communionBattle` / `orderBattle` are set when the fight starts, so it never repeats (including after death or reload). Skipping or leaving it never blocks the delivery.
- **Cleanup:** resuming the warp, docking, dying or leaving flight removes every battle ship, bolt and wreck.
- **Limitations:** drawn only by the Babylon renderer, not the old 2D fallback. A pilot who stays aligned and does nothing sees about 8 seconds before the jump resumes.

### 9.2.2 Adaptive music (IMPLEMENTED; David approved procedural music now, his own files later)

- **Files:** `music-director.js` (what plays: location, District zone, combat cooldown, warp, dialogue ducking, bar speakers; unit-tested), `music-score.js` (each location's key, tempo, harmony, instruments and description, as data), `music-engine.js` (performs the score live in Web Audio with crossfades), `music-integration.js` (game-loop hook). Tests: `tests/music.test.cjs`, `tests/music-engine.test.cjs`.
- **Original, generated live:** no music files ship. A shared four-note VOID//RUNNER motif links the styles. Every location has its own style; the four working stations share one theme with different mixes; space takes on Communion or Natural Order colour in their systems.
- **District zones:** street, entry and scan, hallway, store (quiet), arcade, pods and meeting room (near silence), smoking terrace (muffled), with 1.4 s hysteresis. Bar music in the Dead Channel and the District bar comes from in-world speakers and fades with distance; it does not reach Admin and Iris's store.
- **States:** combat raises intensity with a 7 s cool-down; watching a faction battle adds only a tension layer; dialogue ducks music by 30%.
- **Your own tracks:** add `{styleId: 'path/to/file.ogg'}` to `files` in `music-score.js` and that style plays the file instead, with the same crossfades and volume.
- **New Ambient volume slider** (Settings). The old drone bed in `ship-audio.js` is silenced while the engine runs.
- **Not yet:** on-foot combat music (the derelict has its own tense score instead). Arcade, sleeping-pod playlist and recorded NPC voices come later.

### 9.2.3 Recorded NPC voices (IMPLEMENTED; Kokoro engine approved; all 14 NPC voices approved 2026-10-16)

- 136 fixed NPC lines are pre-recorded with Kokoro-82M (Apache-2.0), rendered offline: about 2.8 MB of Ogg/Opus in `void-runner/assets/audio/voice/`, loaded only when spoken. Licences: `assets/audio/voice/LICENSES.md`.
- **Voices live in the permanent registry `tools/audio/npc-voice-registry.json`** (voice, speed, accent, live processing, status). David approved all 14 NPC voices on 2026-10-16 (changing Mara to af_bella, Elias to am_santa, Rook to bm_fable); they are now locked. An approved voice is **locked**: changing it needs an explicit confirmation there, and the generator and tests refuse a changed approved voice. One slot is reserved for a future special character (no voice, no dialogue). Broadcast voices (Relay, WarFlying, The Function) are listed but unassigned. Full workflow: `docs/VOID_RUNNER_VOICE_PRODUCTION.md`.
- `voice-clips.js` plays the clip on the voice channel; subtitles pace to the clip; a REPLAY button replays the line; skipping stops it. Lines built at runtime (prices, destinations) and any failed clip use the browser voice. The player is never voiced.
- After any dialogue or voice change: `node tools/audio/extract-lines.cjs` then `python tools/audio/generate.py --models <folder>`; only new lines and lines whose voice changed are recorded, and protected clips are never overwritten. `npm test` fails if a line has no clip or an out-of-date one.

### 9.2.4 Faction homeworlds (IMPLEMENTED; doc 10)

- **Places:** **The Nexus** (`nexus`, Cantor System) and the **Natural Order Homeworld** (`order-homeworld`, Garrow System; name pending). Both are focused walkable landing areas (`planets.js`); each opens when Elara's or Marcus's homeworld offer is accepted. Rook never sends freight there.
- **Flow:** accepting the offer loads a shipment (`communion-origin-mission-01` / `natural-order-origin-mission-01`; no pay; flown without combat). If the hold is busy, it waits with Elara or Marcus. Dr. Adrian Kess or Daniel Mercer receives it (doc 10 dialogue word for word) and offers optional work: **Helping Hands** (`communion-restoration-01`: supplies to the aid station, relay repair, power terminal) or **Keeping Things Running** (`natural-order-agriculture-01`: farm equipment, food, solar repair). Task points appear only when relevant and the arrow follows each step.
- **Rewards (ship modules, own slots, fitted at any hangar, never sold):** Communion Targeting Scanner (sensor slot): missile lock time ×0.7 (Kestrel 1.5 s → 1.05 s). Natural Order Maneuvering Thrusters (thruster slot): turn rates ×1.12, turn response ×1.4, settling ×1.25; no top-speed change. `C.factionEquipment()` reports earned and installed status for future dialogue. No hostility or reputation effects.
- **Flags:** `communionOrigin`/`orderOrigin` offered→accepted→loaded→delivered; `communionWork`/`orderWork` offered→accepted→complete; task flags `nexusSupplies`, `nexusRepair`, `nexusPower`, `orderEquipment`, `orderFood`, `orderSolar`; `communionScanner`/`orderThrusters` earned.
- **UNREVIEWED placeholder lines:** Kess and Mercer's reward hand-over lines. "Tell me more" shows the module's real numbers as a notice rather than invented dialogue.
- **Lighting:** each homeworld lowers the global exposure while you are there (as Vesper does). Music: `nexus` (ethereal, melancholic) and `order-homeworld` (warm, percussive). Kess (bm_daniel) and Mercer (am_onyx) are voiced.

### 9.2.5 "Don't Ask Questions": Admin's sealed cargo (IMPLEMENTED; trouble-free per doc 11 §23)

- **Offer:** once the first District delivery is paid and Admin isn't "occupied", Admin offers a sealed crate for Rook (`admin-sealed-cargo-01`; `story.flags.sealedCargo`: accepted → delivered). The contents are never revealed.
- **The run is trouble-free.** NeoChinatown → Meridian with:
  - no patrols, inspection, confiscation, interdiction or combat
  - no wanted status
- **Pay:** Rook pays **1,800** (placeholder) in person at Meridian. The crate keeps the hold busy until it's handed over.
- **Lines:** Admin's and Rook's are UNREVIEWED placeholders.
- **Next (Stage C):** David's WarFlying scene (`design-source/12-…`) follows this delivery.
- **History:** PR #59 first added a Tessaly patrol line with a hail and confiscation (Option A). Doc 11 §23 forbids that for this run, so it was removed.
  - The rules (`police-patrol.js`, `police-patrols.js`, the police cutter model) stay, unused, for the deferred police and wanted systems (doc 11 §35).
  - Saves where a patrol took the crate (`sealedCargo: 'seized'`) simply get the offer again.

### 9.2.6 The Relay, phase 1: radio channel (IMPLEMENTED; no content yet)

- **Where to hear it:** **THE RELAY** is a station on the radio (Settings > Radio). It plays short broadcast segments with a caption: "THE RELAY · NEWS" and so on.
- **Scripts:** they live in `void-runner/relay-content.json`, which is **empty until David re-sends the broadcast scripts**. Until then the station reads "AWAITING TRANSMISSIONS" and plays nothing. Segment kinds:
  - news, breaking, public information and station notices
  - ads and police recruitment
  - WarFlying
  - Communion and Natural Order propaganda
  - The Function
- **What plays where:** Communion lines play only in Cantor, Natural Order lines only in Garrow, and Function lines only in Tessaly; everything else plays everywhere. A segment can narrow this with `systems` or story conditions (`when`).
- **Rules (from David's voice brief):**
  - Mission dialogue, combat, the police hail or chase, pause and menus cut a broadcast at once, and the interrupted segment comes back after.
  - It is **silent on foot in The Darknet District** (NeoChinatown).
  - Music ducks under a broadcast.
  - No back-to-back repeats, and gaps of 5–11 s between segments.
- **Voices:**
  - Broadcasters are cast in the audition tool's new "Relay broadcasters" section and then lock like NPCs.
  - Their lines are recorded by the normal pipeline once cast.
  - A transmission filter is added live in the game, separate from the voice.
  - An uncast broadcaster is shown as a caption only, never a browser voice.
  - The Function stays uncast until David decides its voice treatment.
- **Next phase (approved, later):** station screens and PA announcements reusing the same content.
- **Code:** rules are in `relay.js` (tested in `tests/relay.test.cjs`), playback in `relay-radio.js`, and the transmission filter in `voice-clips.js`.

### 9.2.7 WarFlying, Stage A: foundation (IMPLEMENTED; nothing playable yet)

Doc 11; plan in `docs/VOID_RUNNER_WARFLYING_AUDIT_AND_PLAN.md`.
- **Utility slot:** a new ship slot shown as **UTILITY** (internal id `signal`). It holds exactly one of:
  - the **WarFlying Module** (600, outfitters; hidden from the shop until Stage B makes it work)
  - the **WarFlying Scrambler** (900, Admin only; his store comes in Stage C)
  - the **Signal Tracker** (defined, but it can't be bought, fitted or loaded from a save)
  The old booster/drone slot (internal id `utility`) is now *shown* as **DRIVE**. No save migration was needed.
- **Signal identities** (`signals.js`): 132 stable sources:
  - every station and settlement
  - 3 navigation beacons and 2 comms satellites per system
  - fixed rosters of civilian, cargo, passenger and pirate vessels per system, plus 4 Tessaly patrol cutters
  - the faction battle crews
  Ships carry neutral registration codes (e.g. FRT-E214); pirates broadcast no name. Respawns reuse the roster, so points can't be farmed.
- **Discovery database** (`warflying.js`, saved as `warflying` and checked by `clean_warflying()` on the server):
  - one record per source: first and last seen, count, the last 6 places, confidence, upload status
  - **one point per source, awarded once on its first confident identification**; partial contacts are recorded without a point
  - no cargo or contents are ever stored
- **Tests:** `tests/warflying.test.cjs` and `tests/test_warflying_save.py`.

### 9.2.8 WarFlying, Stage B: scanning, log and leaderboard (IMPLEMENTED)

- **Buying and fitting:** the WarFlying Module is sold at **station outfitters** (600; never in the District) and fitted in the Utility slot at a hangar.
- **Scanning:** when fitted, the ship **listens twice a second while flying** (`warflying-scanner.js`, rules in `warflying-scan.js`).
  - **Fixed emitters:** the origin station on departure, the destination on arrival, and about a third of each system's beacons and satellites along each route. Different routes pass different ones.
  - **Moving ships:** traffic, pirates and faction battle crews, heard by their own emissions (a ship running dark is only heard up close). Near the edge of hearing a ship is "partial" (no point) until identified. Respawns reuse roster identities, so nothing can be farmed.
- **Limits:** nothing is collected on foot, so nothing inside The Darknet District. It works without any Relay connection.
- **Notices and HUD:** "WARFLYING +1 · CIV-E709 · Civilian craft · 5 PTS", and a small "WARFLYING · LISTENING" line in flight.
- **Sightings:** continuous listening counts as one sighting per place per minute.
- **The log** is a WARFLYING section in the Mission Log (L): scanner status, points, partial contacts, the leaderboard, recent discoveries and last known observations.
- **Leaderboard:** the rivals (GhostVector, SignalWraith, EchoNine, VoidWalker, RiftRunner) start at 6–48 points and gain about one point per 40–90 minutes of play, each with a ceiling below the 132 real signals, so a thorough player can reach first place. Play time is saved as `warflying.clock`.
- **Not yet (Stage C):** Relay uploads, the connection state and the scrambler's effect.

### 9.3 Rook cargo runs

Done; see §4.3. Possible follow-ups:
- David reviewing the dialogue.
- Rook currently gives runs only at Meridian.
- The cargo-loss-on-death rule from the master plan has not been verified for runs.

### 9.4 Save system

- **Local:** `localStorage` via `C.restore()`. Restore validates and migrates (`migrate()`).
- **Cloud:** `void_runner_api.py clean_save()` whitelists fields against `save-manifest.json`.
- **Migrations in place:**
  - v1 → v2
  - pre-story saves
  - `undertow` → `rusthaven` (string replace of the quoted id, on both client and server)
  - The tutorial-skip flag.
- Untracking never resets missions. Completed tutorials never re-activate.
- **Test after any state change:** `tests/campaign.test.cjs`, `tests/tutorial-recovery.test.cjs`, `tests/test_story_save.py`, `tests/test_progression_save.py`.

---

## 10. Outstanding bugs and incomplete features

**Known issues and gaps in what is built:**
- A few edge-case Admin/Iris lines are Claude-written and unreviewed (§5).
- The Vigil and Holdfast reuse the generic station interior plan with their own dressing; their flight-approach exterior is the generic station. David's Blender models can replace both later.
- At window shapes taller than 16:9 the game's dialogue box sits partly below the screen (existing behavior). Choice menus are pinned to the visible window to avoid this.
- Butte walls can show faint vertical banding up close.
- The view of the terrain from the air has not been checked: headless tests can't fly the ship.
- `docs/void-runner/mission-tree.html` and the published artifact are slightly out of date.
- **Browser tests:**
  - Most `tests/*-browser.cjs` scripts use Playwright's `msedge` channel, so they don't run in Linux containers.
  - The Node unit tests are the reliable gate.
  - `tests/test_void_runner_api.py` needs `stripe` installed.
- **Overlapping content:** Rook runs, the side contracts and the legacy chapters all hand out similar Erebus deliveries. David needs to decide on the legacy chapters (§4.5).
- **Scene text:**
  - The cinematic 2D `scenes.js` arrival line picks a speaker by destination. For a Rook run to Rusthaven it says "Iona".
  - The 2D cinematic path is mostly a fallback for the walkable stations.

**From the master plan, not done or not verified:**
- A fully 3D, Babylon-geometry cockpit. A painted overlay is used now; `cockpit-3d.js` exists.
- Bounty missions with stealth targets.
- War-flying, scanning, emissions control and jammers. `sensors.js` has a basic version.
- Escort and data-retrieval variety.
- NPC animation states.
- Cargo loss on destruction (verify).
- The Visual Balance Lab as a separate tool (`dev-tools.js` has some).
- A high-speed rail link: this was tied to Sacramento, which is removed.
- Iris API costs.
- Spectre/03 real-money payment feasibility.
- Faction reputation rules and the final star map.

---

## 11. Decision log

### Approved

- Tutorial separate from the cargo campaign; Mission Log with tracking.
- Mission Log key is **L**, because the game runs in a browser and F1 conflicts.
- Mara **asks** whether to do the tutorial. Declining sends the player to Rook and the first cargo mission.
- Tell the player that L opens the Mission Log.
- Kestrel cargo is 2 units. Derelict catwalks are a real, fightable upper level.
- Painted cockpit with closer, larger windows ("perfect").
- **Tessaly** replaces **Sol** everywhere.
  - **NeoChinatown** is its city, with tall skyscrapers.
  - **The Darknet District** is in an alley near the NeoChinatown landing.
  - **The Function** is the corporate government of Tessaly.
  - Tessaly sells to everyone and stays neutral.
- Tessaly ads: everywhere, in their own dark, adult, corporate style selling ship parts and weapons. Similar in spirit to Blackout Protocol but **not** copies, and less funny.
- The Darknet District facility layout (doc 04): built.
- Mars renamed. "Vantor" is in the UI as a working name pending confirmation.
- Vesper: fewer NPC ships ("not super busy … not entirely dead"); Meridian's door is textured and less bright; the mission arrow is lower.
- Vesper mountains should be natural, monument-valley-like and full 3D, with **all** of them redone, not just the cliffs.
- Internal id `undertow` renamed to `rusthaven`.
- Rook cargo runs keep going; a newly opened system gets the next run.
- **Faction territory, Option 1:** two new systems, one outpost each. A system opens when its delivery is accepted.
- **Names, Set A:** Cantor System / The Vigil (Communion); Garrow System / Holdfast (Natural Order).
- **Recipients:** Dr. Elara Voss and Marcus Vale (David's doc 07). Mara's in-game surname "Voss" is dropped; Iona Vale and Marcus Vale are unrelated.
- Rook holds freight runs into a faction system until the player has made Admin's delivery there.
- Each faction delivery pays 1,200 credits and takes 2 cargo units, paid by Iris in the District.
- The delivery flights carry normal light risk; the only scripted event is the faction battle from doc 08.
- Returning to Admin after "I'll think about it" reopens with his "So, what do you think?…" line.
- Docs 05/06 replace the earlier "First District mission" options A–D (Membership, Breach, Rogue AI, Raven's Plan).
- **Admin and Iris are both always in the store**, except Admin is "occupied" (not shown) on the first-payment visit (David, 2026-10-15).
- Iris's follow-up contracts and the homeworld offers (doc 09). Homeworld buttons "I'm interested" / "Not right now" approved for now; pay to be balanced by David later.
- Faction ship battles on the way to each delivery (doc 08): requested feature, built (§9.2.1). The border drop-out placement is Claude's choice and awaits David's review.

- **Admin's sealed cargo is "Don't Ask Questions" and must be trouble-free** (doc 11 §23, 2026-10-16). This replaced the patrol line from Option A (PR #59).
- **WarFlying decisions** (doc 11; `docs/VOID_RUNNER_WARFLYING_AUDIT_AND_PLAN.md` §2, 2026-10-16):
  - The booster/drone slot is renamed "Drive", and the WarFlying slot is "Utility".
  - **Admin sells only the WarFlying Scrambler** (he sees WarFlying as an invasion of privacy). **Scanners are sold in every other store.**
  - Satellite coverage: connected in every system, disconnected in warp (until David changes it).
  - Leaderboard news is text captions.
  - Stolen cargo sells at Rusthaven; Meridian and Kepler refuse it.

- **The Relay (step 4): Option D**, phased: the radio channel now, station screens later (2026-10-16). The broadcast scripts must come from David; nothing is invented.

- **Meridian interior layout** (David, 2026-10-17): through the hangar’s pressure door, a door on the left of the corridor opens into minimal crew quarters (bunks and toilet stalls). Further down the concourse, the store is on the left and the Dead Channel bar is at the far end on the left, each a recessed room with its own entrance (“they should have their own separate areas”), with seating across from the bar along windows looking out to space. The old crew rooms at the far end are removed. The hangar, the corridor and the pressure door are unchanged.
- **Meridian interior dressing** from David’s reference sheet, using the approved CC0 Quaternius packs: PROPOSED, renders in the PR.
- **Crowd looks** (David, 2026-10-16, his NPC customization brief, with artistic licence): background crew-* NPCs wear CC0 MakeHuman figures dressed per place (recolours, glow trims, simple visors, scarves, masks and collars) and play the Rokoko mocap clips; walking crew use the Quaternius Universal Animation Library walk (CC0, David 2026-10-16: "do whatever you recommend"). Named characters keep their existing looks. Low quality keeps the procedural crew. Details: tools/animation-pipeline/README.md. In review (PR).
- **Vesper villagers** (David, 2026-10-16: "populate Vesper's village area a little"): six background villagers at the Dust Bar patio, Frontier Supply and a comms pole. No dialogue; the workshop stays Mara's.

### Rejected or removed (do not reintroduce)

- F1 as the Mission Log key.
- A floating marker over the mission goal. Keep **only** the arrow.
- Forcing the player into the tutorial.
- Copying Blackout Protocol's ads or its jokey tone in Tessaly.
- Sol / Earth / **Sacramento / J Street / Old Sacramento** as game locations. The District is no longer on Earth.
- Treating The Darknet District book as a game guide. It is reference only.
- The old 2D mountain card around Vesper ("looked bad when flying away").
- **Site-wide:** a full 2049-style site redesign ("worse and cheesy"); Iris on game pages.

### Pending David's decision (PROPOSED)

- Confirm **Vantor**, or pick another name.
- **CARGO-001 expansion options:** A, Dr. Sol's water plant on Kepler; B, the sealed crate and a customs hail; C, a missing courier (Elias thread); D, Rook's debt at the Foundry. Claude recommended A, then C.
- Whether **Elias's past** becomes the thread linking the opening to the faction story.
- Keep, rework or cut each **legacy chapter** (§4.5).
- **Homeworld missions:** David will design the planets and missions; nothing beyond placeholders may be built (doc 09 §7–8).
- **Faction follow-up chains** and reputation rules (§6).
- The middle game ("Dead Channels") and late game ("The Silent God") arcs from the mission tree are only proposed.
- Cleaning up stale merged `claude/*` branches was offered, not requested.

---

## 12. Planned improvements and roadmap

These are the master plan phases, with a status note for each.

- **A, Stabilization:** largely done (tutorial split, softlocks, save migrations).
- **B, Mission interface:** done (Mission Log, tracking, arrow, history).
- **C, Meridian Station:** largely done. Could still improve NPC navigation and station life.
- **D, Cockpit and flight:** painted cockpit done; a real 3D cockpit is optional and future.
- **E, Core gameplay:**
  - Rook cargo loop done (repeating runs).
  - Next: bounty hunting, more derelict missions, FPS combat depth.
- **F, World expansion:**
  - Tessaly, NeoChinatown, the District and Vantor exist.
  - Next: **Communion and Natural Order territories**, after approval; more ships; David's NeoChinatown POIs.
- **G, Advanced systems:** radar, scanning, stealth and jamming; NPC behavior; balance; skirmish options.
- **Art:** David will replace procedural art with his Blender models over time through the asset hooks. Keep hooks intact and procedural fallbacks working.

---

## 13. GitHub status (2026-10-15)

- **`main`** is at `24a7071` (PR #47 merged), plus the handoff PR that adds this file and `CLAUDE.md`.
- **Open PRs:** none other than the handoff PR.
- **Remote branches:** `claude/cargo-catwalks`, `cockpit-art`, `district-and-fixes`, `mission-arrow`, `rusthaven-rook-runs`, `tutorial-choice-ads`, `tutorial-split-mission-log`, `vesper-buttes` and `vesper-workshop`.
  - All are merged or superseded. `vesper-buttes` (PR #46) was closed and folded into #47.
  - Safe to delete **only if David asks**.
- **CI:** Node unit tests on PRs and on `main`.
- **Service worker build:** `2026-10-15-faction-battles-1` (faction battles PR, stacked on the deliveries PR).
- **Tests at handoff:** 206/206 Node; Python story and progression save tests OK. After the faction deliveries PR: 217/217 Node. After the battles PR: 226/226 Node.

---

## 14. Practical notes for Claude Code

- **Screenshots in a Linux container:**
  - Run `node tests/serve-modern.cjs &`.
  - Then use Python Playwright: `chromium.launch(args=['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist'])`.
  - Route `**/api/**` to a 503 so the game runs offline.
  - Wait for `window.VoidStartup?.started`.
  - Click `[data-action=menu-campaign]`, then `[data-action=menu-new]`, then `[data-action=tutorial-yes]` to reach Vesper.
  - Position the camera with `walker.x/z/yaw/pitch`.
- **Jump straight into states:** set `state=C.fresh()` and adjust fields, then `VoidMissions.sync(state,C);save();dock();` to stand in a station, or `await launch()` to fly.
- **Dialogue:** the speech UI types out text. Advance it with `document.querySelector('[data-action=speech-next]').click()` after a short wait.
- **Before telling David something is done:** tests pass, screenshots have been checked, `BUILD` is bumped, and `static/void-runner.html` is synced.
