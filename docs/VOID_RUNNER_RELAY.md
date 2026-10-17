# VOID//RUNNER: The Relay (news, propaganda, commercials, WarFlying coverage)

**As of:** 2026-10-17 · **Brief:** David's "The Relay: news, propaganda, commercials & dynamic broadcasts" · **Status:** built and tested. The content is David's sample scripts only. Decisions in §9 await David.

## 1. What already existed (kept and extended, not replaced)
- **THE RELAY radio station** (PR #60):
  - a scheduler that gives way to combat and dialogue
  - silence inside The Darknet District
  - captions, and the broadcast transmission filter in `voice-clips.js`
- **Broadcaster slots** in `tools/audio/npc-voice-registry.json`, none cast yet.
- **The satellite link and the District location policy** (`comms.js`, WarFlying Stage C).
- **The WarFlying leaderboard** (`warflying-scan.js`).
- **Game events** (`VoidStory.emit`: missionComplete, factionDelivered and others).
- **Static station signs.**

## 2. New architecture
| Piece | File | What it does |
|---|---|---|
| Rules | `void-runner/relay.js` | Event records, report metadata, validation, scheduling, the breaking-news queue, cooldowns, developing stories, saved news state, leaderboard moments, headlines for screens. Pure, tested in Node. |
| Content | `void-runner/relay-content.json` | **Events** (the canonical record) and **reports** (what broadcasters say). Scripts are David's lines only. |
| Radio | `void-runner/relay-radio.js` | Plays reports line by line, hooks game events, watches the leaderboard, and adds the news archive to the Mission Log. |
| Screens | `void-runner/relay-screens.js` | Two screens at Meridian: one hanging in the concourse facing arrivals, one above the Dead Channel bar. |
| Save | `campaign.js`, `void_runner_api.py clean_relay` | The `relay` save block, bounded and validated on both sides. |
| Voice tools | `extract-lines.cjs`, audition `server.py`, registry | Each report line is its own clip. A new **commercial announcer** slot (uncast). |

## 3. Events and editorial versions
- **An event** has:
  - a stable id and a category
  - the systems it concerns
  - a **summary**, the **confirmed** facts and the **unknown** facts
  - the factions involved
  - **visibility**:
    - `public`
    - `private`: never reported
    - `{flag}`: reported only once a story flag says the public could know, for example that evidence was transmitted
  - **occurs**:
    - `at`: minutes of play, for background news
    - `story`: a game event, for mission news
    - `always`: established history, such as the Nexus crisis
  - a priority
- **A report** has:
  - its lines, a kind, a broadcaster and a headline
  - the event it covers
  - a **perspective**: Relay News, Communion, Natural Order, The Function, Advertisement or WarFlying coverage
  - a **standing**: confirmed, unverified, faction claim, propaganda, rumour, opinion or commentary
  - a priority, a cooldown, a trigger and the systems it airs in
  - optionally a **stage** and **after** for developing stories
- **One event can have many reports.** Claims and propaganda are labelled, and they never change the event record. The archive always shows the event's confirmed and unknown facts beside whatever a broadcaster said.

## 4. Scheduling and priorities
- **Priority order** (brief §25):
  1. Combat and safety, mission dialogue and conversations come first. The Relay stops at once and resumes the interrupted report afterwards.
  2. Breaking news.
  3. Important news.
  4. Commentary on a live WarFlying leaderboard moment, so it airs while it's still news.
  5. Routine programming.
  6. Ads and recruitment.
- **Breaking news** joins a saved queue when its event becomes public. It waits through combat, conversations, warp, the District or the radio being off. Then it plays first, cutting into routine programming or an ad, but never into other breaking news.
- **Cooldowns:**
  - A news report airs once.
  - Ads: 30 minutes (the apparel ad 90).
  - Recruitment: 40 minutes.
  - WarFlying filler: 25 minutes.
  - Faction statements: 45–60 minutes.
  - The Function: 60 minutes.
  - Cooldowns use play time and are saved, so reloading doesn't cause repeats.
- **Rotation:** the scheduler avoids the same kind twice in a row and recently heard reports, and favours news two to one over ads.
- **Developing stories:** a report with `stage: 2, after: 30` becomes due 30 minutes after the first report. From then on the earlier report stops airing; the archive keeps it.
- **Outages:** with no satellite link (warp between systems, or a future regional outage), live programming stops and the status reads NO SIGNAL · N REPORTS WAITING. Received reports stay in the archive.

## 5. WarFlying coverage
- Every 20 seconds the radio compares the current leaderboard with the last one it saw (saved), using `leaderboard()` from `warflying-scan.js`. Moments are only real changes:
  - a rival gains **one** point and climbs (David's broadcast A)
  - a rival gains several and climbs (broadcast B)
  - your first point (broadcast D, once ever)
- Names, ranks and numbers come from the board.
- Reading the board never changes points. A test checks this.

## 6. Voice, subtitles and screens
- **Voices:**
  - No broadcaster is cast yet, so every report shows as captions, line by line, at a natural reading pace.
  - Once David casts a broadcaster in the audition tool, `extract-lines` → `generate.py` records each line, and playback uses the recording through the live transmission filter.
  - Lines with leaderboard names filled in at play time can't be pre-recorded, so they stay captions.
  - Audio loads on first play, never at startup.
- **Screens:**
  - Each screen shows the newest received headlines plus anything currently airing, from the same records as the radio.
  - Each card shows the perspective and standing, with the WarFlying top three.
  - They show NO SIGNAL without a link, and none exist in The Darknet District.
  - Each screen is one small texture redrawn every 8 seconds.
- **Archive:** in the Mission Log, under THE RELAY · NEWS ARCHIVE:
  - stories are grouped by event, newest first, each with its confirmed and unknown facts
  - each report is labelled with its perspective, standing and time; tap one for the full text
  - other programming (statements, WarFlying) is listed separately; ads are not archived
  - the archive is saved, up to 80 entries

## 7. What's in the content now
All of these are David's lines from the brief, word for word:
- breaking news about the Tessaly communications disruption
- the Communion and Natural Order statements
- The Function
- WarFlying broadcasts A–D
- thruster, shield, missile, personal-defense and apparel ads
- both police recruitment ads
- three light news items: the missing ship, the coffee maker, the door

**Five event records** carry the facts:
- the Nexus crisis, from established canon (doc 10)
- the Tessaly disruption
- the three minor stories

**Background timing (proposed):**
- missing ship: 15 minutes of play
- disruption: 40 minutes
- coffee maker: 70 minutes
- door: 110 minutes

## 8. Tests
- **`tests/relay.test.cjs`** (16 unit tests):
  - routine play, rotation and no back-to-back repeats
  - combat and dialogue cut and resume
  - the District, the station being off, and offline
  - events by time and by game event
  - private and flag-gated events
  - one event with three perspectives
  - breaking news queued through combat, surviving a reload and cutting into an ad, but never into other breaking news
  - developing stages
  - cooldowns surviving a reload
  - bounded saves
  - leaderboard moments from real changes with points unchanged
  - screens matching the radio
- **`tests/test_warflying_save.py`:** the server save block.
- **`tests/relay-browser.cjs`** (Edge play-test): routine play, breaking news waiting for a conversation then airing, save and reload while queued, breaking news cutting an ad, both Meridian screens, the archive, a real RiftRunner overtake announced with real names, District silence, no signal in warp.
- **Screenshots:** `docs/void-runner/graphics/relay/`.

## 9. Decisions for David (PROPOSED)
1. **More content: who writes it?** The brief asks for a living stream of background news, developing stories, Nexus coverage, faction responses and mission-triggered reports. Today there are only David's samples, roughly 18 reports. Options:
   - **A.** David writes every script; Claude supplies a list of event slots.
   - **B. (Recommended)** Claude drafts a PROPOSED pack in David's style (about 10 background events, a developing Tessaly follow-up, a neutral Nexus report, and news for the Nexus and Natural Order aid deliveries). David approves or edits line by line before anything ships.
   - **C.** Claude drafts only the event facts, and David writes all spoken lines.
   - **D.** Mission-triggered news only, for now.
2. **Where faction statements are heard.** Today they air only in their own territory (decided with the original Relay). The brief wants players to hear competing views:
   - **A. (Recommended)** Keep them in their own territory. The archive lets players compare.
   - **B.** Air them everywhere, labelled.
3. **WarFlying broadcasts A and B** now use the real names, ranks and counts instead of the fixed "GhostVector… third place" and "EchoNine… three". Approve?
4. **Short labels** written by Claude: report headlines, event summaries and the background timings in §7.
5. **Casting:** seven broadcasters, including the new commercial announcer. The Function's voice also needs David's explicit approval.
6. **The apparel ad** mentions no products or links, as the brief requires. Should it ever link to the real store, outside gameplay?

## 10. Not built (deferred or awaiting content)
- Content beyond David's samples (decision 1).
- Recorded broadcast audio (decision 5). Replay in the archive is text until then.
- Screens at other stations: Meridian only.
- Regional outages: the hook exists (`VoidComms.setRegion`), but there are no missions for it, as the brief requires.

## 11. Content and voices added 2026-10-17 (David: “Make more voice and broadcasts”)
- **Decision 1 resolved as option B:** Claude drafted a pack. Every drafted report is marked  in  so it can be reviewed, edited or struck. It contains:
  - **10 new events:** Kepler ore delays, the Meridian water recycler, a Foundry accident and its review, the overdue Rusthaven hauler (found safe), the Garrow harvest, the Vigil diagnostic network, and Meridian's lost-and-found gloves, plus three mission-triggered events: deliveries to the Vigil and Holdfast, and aid reaching The Nexus.
  - **24 new reports:** the Tessaly outage now develops in three stages (David's breaking report, an update, and a resolution, with a cryptic Function line at stage 2); a neutral Nexus report and a Natural Order statement on The Nexus; Communion and Natural Order statements on their own news; four ads (navigation, hull repair, sleep pods), a public warp notice, and a WarFlying filler.
- **Mission news never names the player.** The reports say “an independent courier”.
- **Decision 5 (casting):** six broadcasters are cast as **provisional**, so David can change any of them in the audition tool:
  - news anchor: af_heart
  - WarFlying host: am_adam (1.12x)
  - police recruiter: am_echo (1.08x)
  - Communion spokesperson: af_nova (0.95x)
  - Natural Order spokesperson: bm_george (0.95x)
  - commercial announcer: af_sarah (1.04x)
- **The Function stays uncast** (captions only) until David approves a voice.
- **135 broadcast clips** are recorded. Lines with leaderboard names filled in at play time stay captions.
