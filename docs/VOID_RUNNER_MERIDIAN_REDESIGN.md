# VOID//RUNNER: Meridian Station redesign and NPC animation

**As of:** 2026-10-22 · **Brief:** David's "Meridian Station redesign & NPC animation improvements", with his top-down reference sheet · **Status:** built and tested locally, in review (PR). Nothing here is live until David merges it.

## 1. Files

**Changed:**
- `void-runner/meridian-interior.js`: the new plan, rooms, walls, furniture, activity points, the bartender's spots.
- `void-runner/meridian-art.js`: the detailed pods (covers that slide), window seals, plants, the bar's neon.
- `void-runner/meridian-interior-kit.js`: wall and ceiling dressing that follows the new rooms.
- `void-runner/babylon-renderer.js`: the fit-out (lights, pipes, ribs, terminal), sliding doors, crew clips, turning.
- `void-runner/station-activities.js`: routines (sit down and stand up, give way, window limit, the bartender).
- `void-runner/crowd.js`: clip choice, cross-fades, one-shot moves, the bartender look.
- `void-runner/relay-screens.js`: animated news screens and ad panels.
- `void-runner/prologue-integration.js`: REST IN A SLEEP POD.
- `void-runner-sw.js`: BUILD.
- `tests/mission-system.test.cjs`, `tests/relay-browser.cjs`.

**Added:**
- `tests/meridian-bartender.test.cjs`.
- This document.
- The `meridian-bartender` look, plus new moves for six Meridian looks (`void-runner/assets/models/crowd/`, built from `tools/animation-pipeline/characters/` and `clips.json`).

## 2. Layout (follows the reference sheet)
- **Order:** HANGAR → HANGAR DOOR → NARROW CORRIDOR → BAR / SEATING.
- **Hangar:** unchanged, with its ship, boarding and docking. The living area is no longer in it.
- **Hangar door:** a pressure door (3.2 m wide) that slides open.
- **Corridor:** 4.4 m wide (only a little wider than the door) and 36 m long. It is solid on the right, with portholes and lit ribs, and has two animated ad panels.
- **Off the corridor's left side:**
  - **Living area:** stacked sleeping pods in two L-shaped banks of 18 capsules, lockers and a washroom corner. Its door slides open as people approach.
  - **Store:** the outfitter. Shelves and counter are unchanged in function.
- **The social hall at the far end:**
  - **The Dead Channel bar:** along the left wall, with violet neon, a back bar of bottles and six stools.
  - **Seating:** directly across, with three tables, chairs and two sofas under the starboard windows.
  - **Windows:** observation windows along the seating side and across the hall's end.
  - **News screens:** one hangs at the hall entrance and one sits behind the bar.
- **Named characters:** Rook, Nyx, the mission terminal, the outfitter and boarding keep working. Tests check every interaction is reachable.

## 3. Sleeping pods
- **Capsules:** compact, two-tier, with ladders. Each has:
  - a padded berth, pillow and blanket
  - its own warm light and a drawer
  - a tinted privacy cover and an occupancy light
- **Covers:** they slide. Every 20–45 seconds someone "turns in" or "gets up": one cover slides shut or open and its light changes from green (free) to amber (taken).
- **REST IN A SLEEP POD** in the living area saves progress, like the District's pods.
- **Not built:** a first-person climb-in sequence. The rest prompt is unchanged.

## 4. Walking animation: the cause and the fix
- **Cause:** NPCs slid with frozen legs. Moving crew called `play('walk')` every frame. The check for "already playing" compared the clip's bare name with the copied animation's prefixed name (`crowd:look-walk`), so it never matched. The walk restarted every frame and stayed on its first pose.
- **Fix:** `crowd.js` now compares the animation itself, so a playing clip is left alone. Tested in Edge: frames advance and the leg bones move.
- **Speed:** the walk loop's stride (about 1 m/s) matches the crew's walking speed (1.05 m/s), so feet don't slide.
- **Turning:** figures turn smoothly toward their heading instead of snapping.
- **Transitions:** clips cross-fade.

## 5. NPC moves and routines

**Moves now on Meridian's six crew looks:**
- idle, walk and talk
- sit down → seated → stand up
- seated conversation
- reach/interact (shelves, terminal, drinks)
- watch and look around at the windows

**The bartender** has: idle, walk, serve (talk), pour (pickup), polish (hands busy at the counter) and reach for the back shelf.

**Routines (station-activities.js):**
- Each crew member picks a free spot and walks there along a collision-free path. Spots include:
  - the bar stools, chairs and sofas
  - the windows (at most two people at once)
  - the terminal, the shelves, the lockers and the drinks end
  - a chat pair
- They sit down on arrival, stay 15–36 seconds, and stand up before leaving.
- Walkers give way to each other for a moment rather than walk through.
- Doors slide open for them and close behind them, unless you opened them.
- Every NPC runs on its own random timing, so they never move in sync.

**The bartender:**
- Stays behind the counter.
- Walks over to serve anyone who sits at the bar, talks with them, then pours.
- Otherwise polishes glasses and reaches to the back shelf.
- Keeps clear of Nyx's spot (an obstacle in the plan, so routes go round her).

**Named NPCs** (Rook, Nyx) keep their looks, places and dialogue.

## 6. Animated broadcasts and ads (relay-screens.js)
- **Update (2026-10-22, David: "these screens are supposed to scroll through the different ads and news"):**
  - Every news screen is now a channel. It cycles 8-second slides: each news story the player has received with an ad after it, the WarFlying standings (bars grow in), and a station notice. Slides have animated entries and exits.
  - The backgrounds move visibly: a travelling light band, drifting stripes and particles, and a turning orbit ring.
  - The bar screen now hangs over the bar, clear of the wall pipe, lamps and canopy.
  - The corridor ad panels were hidden behind the wall dressing; they now stand in front of it.
- **News screens:**
  - moving backgrounds and scanlines, a blinking LIVE dot
  - a breaking-news red header
  - headline cards that change every few seconds with transitions
  - a scrolling ticker with the WarFlying standings
  - occasional signal glitches
- **Ad panels:** two, with different animation styles and timing, showing the existing ads' own scripted lines.
- **Content:** unchanged; screens read the same Relay records as the radio.
- **Sound:** screens are silent; sound stays with the radio, so audio never overlaps.
- **Performance:** each screen is one small canvas texture, redrawn about 12 times a second only while on camera and within 26 m.

## 7. Animation sources and licences (new in this work)

| Moves | Source | Licence |
|---|---|---|
| walk, sit-enter, sit-exit, sit-talk, interact, pickup | Quaternius Universal Animation Library, Standard (`UAL1_Standard.glb`) | **CC0** (licence file checked) |
| look (`Idle_LookingAround`), polish (`Clipboard_Lever_Computer`) and the earlier idle, talk, sit, watch, smoke and work | David's Rokoko free mocap set (`VOID_RUNNER_KEEP`) | Rokoko: free for commercial use in games. David approved the clips being public (2026-10-16). |
| Bartender body, clothes, hair | MakeHuman / MPFB system assets | **CC0** |

Nothing was downloaded for this stage. The full record is in `void-runner/assets/models/crowd/README.md`.

## 8. Tests actually run
- **`npm test`:** 338 pass, including the layout, interaction-reach and new bartender tests.
- **Browser (Edge):**
  - `tests/meridian-menu-browser.cjs` passes: menu, new campaign, saved load, walking scene, GLB fallback, resource ownership.
  - `tests/relay-browser.cjs` passes twice in a row. It now expects two news screens plus two ad panels.
- **Play checks (Edge, local):**
  - A walk-through of every room.
  - 11 different crew moves seen playing.
  - The bartender serving, pouring and polishing, staying at least 1 m from Nyx.
  - Pod covers changing over a minute.
  - No page errors.
- **Not run locally:** the Python save tests (this PC lacks a server package). This work changes no Python or save code; GitHub runs those checks.

## 9. Limits and follow-ups
- **No dedicated clips for:** drinking, a seated device check, or a turn-in-place. Seated drinkers and device users use the seated idle, and turning is a smooth rotation.
- **No climb-in animation** for the player's pod rest.
- **Lighting:** the hall is moodier and darker than the reference art. A lighting pass is the obvious next visual step.
- **Download size:** first visits download about 3 MB per crew figure. Shrinking textures further would speed that up.
- **Other modes:** the main menu shows Meridian's exterior only, which is unchanged. Skirmish doesn't use the interior.
