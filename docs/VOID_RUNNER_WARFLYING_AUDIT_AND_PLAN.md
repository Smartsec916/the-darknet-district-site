# VOID//RUNNER: WarFlying, Relay, Privacy and Piracy — Audit and Plan

**As of:** 2026-10-16 · **Brief:** `docs/void-runner/design-source/11-warflying-relay-privacy-piracy.md` and Admin's scene `12-scene-admin-warflying-intro.md` (both David's, word for word) · **Status:** decisions APPROVED 2026-10-16 (see §2).

## 1. Audit: what the game has today

| Brief area | State | What exists (file) | Gap |
|---|---|---|---|
| Radar and detection | **Working** | Radar range 280, passive range 75, a signature built from radar, engines, weapons and electronics (`sensors.js`); radar on/off; contacts show only if detectable (`sensor-integration.js`) | None. WarFlying should use this signature model, not replace it. |
| Emissions control / stealth | **Working** | **GO DARK** button turns radar off and lowers the signature; enemies detect the player by signature | None |
| Existing scan functionality | **None for signals** | "Recover signals" beacons in salvage missions are flythrough pickups (`cockpit.js`); the Communion Targeting Scanner only speeds missile lock | Whole WarFlying scanner |
| Missions / objectives | **Working** | Mission Log with objectives, tracking, destinations (`mission-log.js`) | Journal entries for WarFlying and the Relay |
| Equipment slots | **Working, but naming conflicts** | Ship modules: power, cooling, weapon, shield, engine, sensor, thrusters (`progression.js`). A slot called **utility** already holds the Ghost Drive, Sentinel Drone, Vector Booster and Scout Drone (`content.js`). | The brief's single **utility slot** for the three WarFlying modules (see decision 2) |
| Hangar / loadout | **Working** | Maintenance terminal, module compare and fit (`prologue-integration.js`) | Add the new slot to the same screen |
| Cargo capacity | **Working** | `progression.cargo` (up to 3 stacks, 1–3 units each); Kestrel holds 2 units; contracts take a unit (`factions.js cargoUsed`) | Cargo needs value and provenance for piracy |
| Ship destruction / cargo drops | **Partial** | `factions.js salvage()` can split a cargo list; no physical cargo pod in space; no cargo ships to attack | Physical pod, pickup, one per ship |
| NPC dialogue | **Working** | Talk/choice system, voiced lines, Admin and Iris in the District (`faction-scenes.js`) | Admin's WarFlying scene (script ready) |
| Factions and hostility | **Working (scaffold)** | Relations table includes `pirate`, `civilian`, `sol-local` ("The Function"), `communion`, `natural-order` (`factions.js`) | Evidence-based crime records |
| Police / security | **Partial** | Tessaly patrol cutters with a scan meter and hail, used **only** on Admin's sealed run (`police-patrol.js`, PR #59) | **Conflicts with brief §23** (decision 1) |
| Pirate ships | **Working** | Hostile raiders, interceptors and gunships with tiered pilots attack on routes (`game.js`, `enemy-pilots.js`) | They are attackers, not cargo prey |
| Ambient traffic | **Working, no identity** | Courier/shuttle/mining contacts are re-rolled at random every area (`traffic.js`) | Stable vessel identities, needed for scoring |
| Save / load | **Working** | Local and cloud saves; `story.flags` for small state; server whitelist in `void_runner_api.py clean_save()` | A compact `warflying` save block, validated on both sides |
| Radio | **Working** | Radio stations, **THE RELAY** channel with priorities and District silence (`relay.js`, `relay-radio.js`, PR #60); scripts file empty | Uploads, leaderboard content, satellite state |
| Audio | **Working** | Buses, music ducking, recorded voices, broadcast filter | None |
| Public screens | **Partial** | Dynamic-texture signs and ad billboards in NeoChinatown and Meridian (`ad-art.js`, `meridian-art.js`) | Relay screens (approved phase 2) |
| Economy / stores | **Partial** | Upgrade shop, credit gear, ships, module purchases; **no selling** of anything | Cargo buyers |
| Documentation | **Working** | Handoff doc, design sources, voice production doc | WarFlying docs as built |

## 2. Decisions (David, 2026-10-16)

**Outcome:**
- **1:** APPROVED.
- **2, 5 and 6:** approved as recommended.
- **3:** REVISED. Admin sells **only the WarFlying Scrambler**, because he sees WarFlying as an invasion of privacy. **WarFlying scanners are sold in every other store.** The Signal Tracker is listed but can't be bought yet.
- **4:** APPROVED, unless David changes it later.

The original recommendations follow for reference.

1. **"Don't Ask Questions" must be trouble-free (§23).**
   - **The conflict:** PR #59 gave Admin's sealed run a patrol line. It forces a drop-out, can hail you, and can confiscate the crate.
   - **Recommended fix:**
     - remove the patrol drop-out, hail and confiscation from this run
     - rename the mission "Don't Ask Questions"
     - keep the patrol code for the deferred police and wanted systems
     - follow the delivery with your WarFlying scene ("After that last delivery? I'd say you got lucky.")
2. **Which slot is "the utility slot"?**
   - **The conflict:** the existing *utility* slot holds boosters and drones. You approved a new slot for the three WarFlying modules, and also said "the utility slot is just that". Admin's line says "One utility slot, though."
   - **Recommended:** rename the booster/drone slot to **"Drive"** and make the new WarFlying slot **"Utility"**. Then Admin's line, the brief and the game all match. Booster/drone saves move over automatically.
3. **Who sells what, and prices.** Admin's line ("Scanner if you want to join the game. Scrambler if you'd rather not…") suggests he sells both.
   - **Recommended:** Admin sells both, at placeholder prices of 600 for the WarFlying Module and 900 for the scrambler.
   - The Signal Tracker is shown as "not yet available".
4. **Satellite coverage by default.**
   - **Recommended:** **connected** in every system, **disconnected while in warp** between systems. That gives the upload queue real use without inventing outages.
   - Regional outages stay a hook for future missions.
5. **Leaderboard announcements on the Relay.** These need words.
   - **Recommended:** short data-driven captions ("GhostVector moves into first place: 412 signals."), shown as text only until you script or approve voiced versions.
6. **Piracy buyers (Stage E).**
   - **Recommended:** reputable markets at Meridian and Kepler refuse stolen cargo; Rusthaven Port (already the smuggling port) buys it at a discount.
   - No new criminal faction. This needs your approval before Stage E.

## 3. Staged plan (one PR per stage, each tested and merged only on David's word)

| Stage | Contents | Notes |
|---|---|---|
| **0. Fix** | Decision 1 (trouble-free "Don't Ask Questions") | Small; first |
| **A. Foundation** ✅ built (PR: WarFlying Stage A) | A **signal registry** with stable identities for stations, beacons, satellites and a named roster of recurring ships per system (traffic draws from it, so respawns are the same vessel); the **discovery database** (one record per source: first and last seen, the last 8 locations, count, category, confidence, upload status); **one point per unique source**, in one function; the utility slot | Pure rules with tests, save block and server validation |
| **B. WarFlying gameplay** ✅ built | The WarFlying Module; passive scanning every 0.5 s, not every frame; detection follows distance and the source's own signature, so dark or distant ships aren't seen and are only "partially identified" at the edge of range; a compact HUD line, discovery notices and a log panel in the Mission Log screen; NPC leaderboard (GhostVector, SignalWraith, EchoNine, VoidWalker, RiftRunner) advancing slowly with game time | No cargo or contents are ever shown |
| **C. Comms and privacy** ✅ built (see §4) | Communications state per region (connected / degraded / disconnected / unavailable) with a hook for future missions; upload queue (auto or manual, no duplicates, survives reloads); scrambler; District policy (no collection or broadcasts on the premises; music, arcade, pods and store still work); Admin's WarFlying scene word for word, plus the store | Scrambler: your own sightings by others become "unconfirmed", which breaks links between sightings. It never hides you from radar, eyes or police. |
| **D. Relay integration** | One shared content model for radio and screens (spoken text plus short headline); leaderboard and upload items; public screens in Meridian and the station bars (phase 2, approved) | Uses your scripts when they arrive |
| **E. Piracy** | Attackable cargo traffic; **one** physical cargo pod per destroyed cargo ship (never duplicated); pickup respects hold space; provenance on cargo; buyers per decision 6; an evidence log (crime → witness → recorded → transmitted → received → identified), with no automatic wanted status | Needs decision 6 |
| **F. Throughout** | Unit tests for every rule, browser play-tests, save migration notes, and a final report as §42 asks | |

**Deferred (§41):**
- multiplayer leaderboards
- the full Signal Tracker gameplay
- wanted levels and police investigations
- satellite destruction and repair missions
- communications warfare
- new criminal factions

The Signal Tracker is defined as equipment but stays non-purchasable and inert.

## 4. Stage C as built (2026-10-16)

- **Relay link** (`comms.js`):
  - The link has four states: connected, weak signal, no signal and offline.
  - It's connected in every system and drops only while in warp between systems.
  - A future mission can change one system's link with `VoidComms.setRegion(state, system, value)`. This is stored as the story flag `comms-<system>`, so no save change was needed. Nothing uses it yet.
  - Radar and scanning never depend on the link.
- **Uploads** (`warflying.js`, `warflying-scanner.js`):
  - Any new sighting or identification puts the record in the upload queue.
  - With auto-upload on, records send in batches whenever the link allows: 10 at a time on a good link, 3 at a time on a weak one.
  - With auto-upload off, they wait for **UPLOAD NOW** in the Mission Log.
  - A dropped link abandons the batch in transit, and its records stay queued. A record that changes while being sent stays queued, so nothing is lost or sent twice.
  - The queue and the auto-upload setting are saved.
  - Points never depend on uploading.
- **The Darknet District:**
  - One location policy covers Relay broadcasts, WarFlying collection and uploads on the premises. The radio now uses the same policy.
  - Music, arcade, pods, private messages and the store aren't touched.
- **Scrambler:**
  - On about half of your routes, another pilot logs your ship on arrival and uploads it. This is "your ship on the Relay" in the Mission Log.
  - Without a scrambler, those sightings are tied to you. With one, they're unidentified.
  - Earlier sightings are never changed. Radar, police, inspections and visual checks are unaffected.
  - The HUD shows SCRAMBLER · ACTIVE.
  - The scanner and the scrambler share the one Utility slot, so fitting one removes the other.
- **Admin:**
  - His WarFlying scene (doc 12) plays word for word the first time you see him after "Don't Ask Questions". All 19 of his lines are voiced with his approved voice.
  - After the scene, and on later visits, he offers his stock: only the WarFlying Scrambler, 900 CR. Nothing is bought or fitted automatically.
- **Claude's wording for David to review** (UI text, not dialogue):
  - the "Admin's briefing" journal note in the Mission Log
  - the scrambler's store description
  - the choice buttons SHOW ME THE SCRAMBLER and NOT RIGHT NOW
- **Tests:**
  - `tests/warflying-comms.test.cjs` (unit tests)
  - `tests/warflying-c-browser.cjs` (play-test: Admin's scene and store, auto and manual uploads, warp outage, District, scrambler)
  - `tests/test_warflying_save.py` (server save check)
