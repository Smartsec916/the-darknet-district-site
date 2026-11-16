# MILKED

> **Redesigned and moved on 16 Nov 2026** (David's brief "NeoChinatown Rework, Milked Redesign & V1 Taxi Integration", phase 2). Everything below describes the new building. The first version (15 Nov, PR #265: a 36 m by 62 m building on its own plaza at the east end of The Avenue, with a biobank wing) is gone; "What was removed" lists it.

A **small adult livestreaming production studio** on a quiet side street off Main Street in NeoChinatown. It makes live broadcasts and nothing else. Members watch from home; whatever else the service involves happens privately at the member's own address. **Nothing is collected and no procedure of any kind happens in this building.** It is not a nightclub, hospital, laboratory or public venue: no bar, no dance floor, no audience.

Code: `void-runner/milked.js` (data, collision, interactions and the 3D build), `void-runner/milked-integration.js` (interaction handlers), plus small hooks in `neochinatown.js`, `district-map.js`, `music-director.js` and `ncz-nightlife.js`.

Status: **built, provisional.** All dialogue is placeholder text, not approved canon. Branch `claude/milked-redesign`, build `2026-11-16-milked-1`.

## Content rules (enforced in the build)

Every performer is an adult. Everyone is clothed and nothing shown is explicit. Each studio has exactly one dancer and nobody else; the cameras are on stands and are run remotely from Fish's office, so there are no camera operators. The player watches through soundproof windows from the hallway and never enters a studio. Screens that show a "stream" draw a clothed silhouette, not a camera picture.

## Where it is (world metres, x east, z north)

| Piece | Rectangle `[x0, x1, z0, z1]` | Notes |
|---|---|---|
| Building `FOOTPRINT` | `[78, 98, -90, -74]` | 20 m wide, 16 m deep (320 square metres; the old one was 2,232). Front wall z -74, back wall z -90. |
| Side street `LANE` (`streets.milkedLane`) | `[71, 101, -74, -68.5]` | 5.5 m wide, 30 m long, a dead end. Opens off the east side of Main Street. |
| Service alley `ALLEY` (`streets.milkedAlley`) | `[71, 98.5, -93.5, -90]` | 3.5 m wide, along the back wall, and back out to Main Street. |
| Front doors `DOOR` | x 81.75, z -74, 2 m wide | On the side street. |
| Rear door `REAR` | x 94.75, z -90, 1.4 m wide | On the service alley. |
| Sky-cab stop `TAXI` | `(61, -82)` on Main Street | The side street is too narrow for a cab. |

Why here: it is the block east of Main Street between the alley to the District (z -61.6) and the roof terrace (z -95.4). The building is not on Main Street itself: a corner building 7 m wide stands between. A 6.9 m strip of buildings stays between the side street and the alley to the District, 1.9 m between the service alley and the terrace, and 11.4 m between Milked and The Darknet District's west wall, so none of those walls is cut. It is clear of the nightclub (west side of Main Street) and the landing pad. The two mouths line up with the 7 m shopfront bays on Main Street, so no shopfront crosses them. Tests enforce all of this.

Gone from the map: the plaza street `streets.milked` `[200, 212, -30, 5]` and the old footprint `[212, 248, -46, 16]`. `avenueEast` is unchanged and now simply ends at x 200 in city blocks.

The surrounding buildings are made by the city itself (`blocks()` in `neochinatown.js` fills everything that is not a street or footprint), so the new street and alley get ground, facades and roofs with no extra code. The building streams in at about 90 m and is disposed beyond about 140 m, through `streamDistricts`. `city.live.get('milked')` is the live controller.

## Layout

```
                 side street (z -68.5 .. -74)
   78        81.75          85.5        89.5        93.5          98
-74 +----------[==]-----------+-----------+-----------+------------+
    |      | vestibule |      |           |           |            |
    | plant+----[==]---+bench |  STUDIO 1 |  STUDIO 2 |   FISH'S   |
    |                         |   (pink)  |  (green)  |   OFFICE   |
    |        RECEPTION        |           |           |            |
    |      [ desk / Eva ]     +--window-d-+--window-d-+---[door]---+ -79.6
    |   MILKED sign    CCTV  door     STUDIO HALLWAY (2 m)   door  |  restroom
-82.8 +-----------+-----------+-d-window--+-d-window--+  staff     +--- -81
    | DRESSING A  | DRESSING B|  STUDIO 3 |  STUDIO 4 |  corridor  |  restroom
    |  (open)     | (closed)  |  (mixed)  |  (mixed)  |  lockers   |
-88 +---[door]----+--[door]---+--[door]---+--[door]---+            +--- -88
    |  cases          REAR CORRIDOR (2 m)                          |
-90 +-----------------------------------------------------[rear]---+
                 service alley (z -90 .. -93.5)      94.75
```

- **Front**: dark weathered concrete, dark metal double doors, the pink neon MILKED sign with three white droplets over them, a thin green neon line above the sign, thin pink vertical strips beside the doors, a slim canopy with three small downlights, a steel plaque, an intercom, and a small blade sign (droplets only) that can be seen from Main Street. The long studio wall has no windows, only four louvred slits with pink and green light behind them. Upper floor: dark windows, a ledge, an old AC unit.
- **Security vestibule** `[79.75, 83.75, -76.6, -74]`: Milked's own design. Ribbed dark metal walls, a green ceiling panel, pink floor edges, a green scan frame round the glass inner doors, an ID screen (18+, VERIFIED), a dome camera, the droplets on the floor. Both pairs of doors slide open as the player comes up. It shares nothing with The Darknet District's vestibule, and there is no loading transition: Milked is part of the street scene.
- **Reception** `[78, 85.5, -82.8, -74]`: Eva in a compact desk booth, the MILKED logo on a slatted wall behind her, a computer on the desk, security monitors (vestibule, hallway, rear door, side street), one bench and a plant. The door beside the desk leads to the studio hallway.
- **Studio hallway** `[85.5, 93.5, -82.8, -80.8]`: 2 m wide, studios 1 and 2 on the north side, 3 and 4 on the south. Each studio has a 2.4 m observation window, a closed studio door and a pulsing ON AIR sign.
- **Studios** (4 m wide; `STUDIOS` in `milked.js`): each has one dancer on a lit podium, two fixed cameras on tripods aimed at the podium, a softbox and a ring light on stands, an LED bar under the back wall, a wall monitor showing the outgoing stream, and its own set:

  | Studio | Light | Set | Dancer (crowd figure) | Own clip | Library clip |
  |---|---|---|---|---|---|
  | 1 | pink | velvet curtain, neon tubes, chaise, lamp table, round rug | `district-resident` | `dance` | `ac-sensual-dance-3` |
  | 2 | green | slatted green wall, neon ring, four plants, stool, moss rug | `vr-companion-f` | `slow-dance` | `ac-sensual-movement-1` |
  | 3 | pink and green | stack of old monitors, speakers, chequered floor, slanted neon bars, stool | `vr-companion-m` | `dance-samba` | `ac-stand-curve-2` |
  | 4 | pink and green | mirror panels, a barre, drapes, ottoman, LED square | `vr-player-b` | `dance` | `ac-stand-curve-3` |

  The library clip is used when the shared animation library (`anim-library.js`, the licensed ActorCore file) is installed; otherwise the figure's own dance plays. Both paths were checked. If a dancer's model is missing after 25 seconds, a spare clothed figure (`district-resident`, `runner-02`) takes the spot, so a studio is never empty. Eva and Fish are never substituted.
- **Staff area** at the end of the hallway: a staff corridor with lockers and a notice board; **Fish's office** `[93.5, 98, -79.6, -74]` with a four-feed broadcast monitor wall, the remote camera control desk (two joysticks, a camera selector panel), a status screen, a couch and a shelf of drives; **two staff restrooms** (closed doors); the **rear corridor** along the back with the stage doors of studios 3 and 4 (closed), **dressing room A** (open: mirror with bulbs, counter, stools, clothes rail, bench) and **dressing room B** (closed, "occupied"); and the **rear door** to the service alley (slides open).
- **Service alley**: the steel staff door with a green caged lamp, a small MILKED staff and deliveries plate, a dumpster and crates (both solid), AC units, pipes and a wall lamp.

## Characters (provisional)

| Id | Display name | Where | Placeholder model |
|---|---|---|---|
| `milked-eva` | Eva (`CONFIG.EVA_NAME`) | Behind the reception desk | crowd look `ncz-neon` |
| `milked-fish` | Fish (`CONFIG.FISH_NAME`) | At the camera desk in his office | crowd look `fixer-01` |
| `milked-dancer-1` to `-4` | (no names) | One in each studio | see the table above |

Eva is **not** the VR companion Eva. Her lines keep her Origins background (livestream performer, neural-network engineer). Fish has no invented backstory. The dancers have no names, lines or story.

Two of the dancer figures (`vr-companion-f`, `vr-companion-m`) are the free MakeHuman figures that the VR arcade's generic companions also use, because they are the only clothed figures in the repository with more than one dance. A player who chose that companion will recognise the figure. Change `STUDIOS[n].dancer.look` if David wants different people.

### Replacement points

Open `void-runner/milked.js` and find `==== WHERE TO CHANGE THINGS ====` at the top: Fish's name (`CONFIG.FISH_NAME`, written once), Eva's and Fish's models (`MODELS.eva`, `MODELS.fish`: set `asset` to a packaged model id), the dancers (`STUDIOS`), the dialogue (`DIALOGUE`).

`tools/audio/npc-voice-registry.json` still lists Eva and Fish as provisional, unapproved voice blends. Nothing is generated.

## Dialogue (provisional, short)

Eva: welcomes the visitor, says the studio only broadcasts and that members watch from home, keeps her two Origins lines (performer, neural networks), and points to the studios and to Fish. Fish: three lines about running the cameras from his desk. Notes for the intercom, the security monitors, each studio window, the camera controls, dressing room B and the restrooms. Nothing is canon until David approves it.

## Mission 3 (inactive data)

`MISSION` in `milked.js` is unchanged except that its two location sentences now say "the side street off Main Street" instead of "the east end of The Avenue". It is still `active: false`; nothing registers or starts it.

## Taxi, map, music

- **Sky cab:** Milked is still a destination; the cab sets down on Main Street at `(61, -82)`, about 15 m from the mouth of the side street. It is within 20 m of the two existing Main Street stops, so from either of those the cab says "you're already there".
- **Road taxis:** unchanged. They never turn into the side street or the service alley (`DRIVE` lists only the roads they already drive). The nearest road-taxi stops are the existing "Main Street by the alley" `(61, -66)` and "Main Street" `(61, -100)`, each under 20 m from the Milked stop. No separate road-taxi stop was added.
- **V1 Map:** the building outline at its new place, the side street and the service alley as named streets, the taxi stop, and five places (entrance, reception, studio hallway, Fish's office, rear door).
- **Music:** the `milked` zone in `music-director.js` is now the new footprint. The side street and the alley play the city's music.
- **Street crowd:** nobody leans in the two new mouths on Main Street (`ncz-nightlife.js`).

## What was removed

The biobank appointment area, the consultation room, the laboratory, cryogenic storage, the centrifuge and vials, all clinical signage and displays, the check-in and appointment kiosks, every "sperm bank" and "biobank" word, the operations room, the three large studios with their consoles, the lobby sofas, the plaza, the bollards, the taxi sign, the big advertising screens, the 15 m glass front, and the extra people (studio technician, laboratory technician, lobby guests). The 18 old screenshots were deleted. A test fails if clinical wording comes back into `milked.js` or `milked-integration.js`.

## Save compatibility

No new save fields, location ids, mission ids or flags. A conversation records the usual `story.met` entry (`milked-eva`, `milked-fish`).

## Tests

- `tests/milked.test.cjs` (16 tests): the concept, nothing clinical left, ids, configurable name, the small footprint on a side street with an alley behind and nothing else cut, the vestibule, taxi stop on Main Street and road taxis kept out, map, inactive mission, rooms, one dancer per studio with real clips, the logo, reachability (open rooms reachable, closed rooms and studios not), no save fields, a handler for every interaction.
- `tests/milked-browser.cjs`: the real-browser walk-through (rewritten for the new building).
- Updated for the new geometry: `district-areas`, `environment-seam`, `city-taxi`, `music`, `ncz-views-browser`.

## What was checked (16 Nov 2026, Chromium with the software renderer)

- `npm test`: 977 tests, 976 pass. The one failure is the known local-only `tests/vr-companion-models.test.cjs` ("ava: preview missing"), caused by untracked licensed files on the build machine.
- `tests/milked-browser.cjs low` passes with no page errors: the building streams in on the side street, nothing of Milked is left at the east end of the avenue, the whole route is walkable in the real game (side street, front doors, vestibule, inner doors, reception, the door beside the desk, hallway, staff door, staff corridor, Fish's office, dressing room A, rear door, service alley, Main Street), the walls, desk, studio windows, studio doors, dressing room B, a restroom door and the old plaza are solid, the front doors slide open, Eva and Fish talk under their own names, exactly six people exist (Eva, Fish, four dancers), each studio holds exactly one dancer whose loop is playing, the map shows the building, the two new streets, five places and the taxi stop, the sky cab lists it with a fare under the cap, and the building unloads when the player walks away.
- Looked at, on Low and on Medium (pictures in `docs/development/milked/`, Medium, brightened for print because the game outside VR is drawn dim): the side street from Main Street and the front with its sign (the sign reads the right way round), the vestibule, reception with Eva, the hallway with its windows and ON AIR signs, each studio through its window, Fish's office and the camera desk, the staff corridor, the rear corridor, dressing room A, the rear door from the alley and the service alley in both directions.
- Both animation paths were run: with the shared library installed the dancers play `ac-sensual-dance-3`, `ac-sensual-movement-1`, `ac-stand-curve-2`, `ac-stand-curve-3`; with the library switched off they play `dance`, `slow-dance`, `dance-samba`, `dance`.
- Problems found and fixed while looking: the concrete was black (a drawn texture does not repeat unless told to), the street scene never finished loading (a cloned drawn texture is never "ready"), the window frames were too heavy, the interior walls were too dark to read, the camera panel on Fish's desk read sideways, and the dancers were silhouettes on Medium (each studio now has one small lamp that lights only its dancer).

## What is not done or not verified

- **Not pushed, no PR, not merged.** The work is one local commit on `claude/milked-redesign`.
- Dialogue is provisional and needs David's approval. Eva's and Fish's voices are still the provisional blends; nothing was generated.
- No real-GPU, Firefox, VR-headset or multiplayer check. High quality was not run (Low and Medium were).
- A real sky-cab flight to the new stop was not flown in the browser (the fare rules and the stop are tested; the old test flew it to the old plaza).
- No separate road-taxi stop for Milked (see "Taxi, map, music").
- With the shared library, studio 2's clip (`ac-sensual-movement-1`) includes floor work: the dancer is clothed, but David may prefer a standing loop there. It is one word in `STUDIOS`.
- Two dancers use the generic VR-companion figures (see "Characters").
- The look is still built from simple shapes with glowing trim; it is tidier and smaller than before but is not at the Blender/PBR standard of `docs/VOID_RUNNER_ART_DIRECTION.md`. Lighting is emissive and ambient, plus the four dancer lamps on Medium and above (Low has none).
- The corner building's wall on the south side of the alley mouth is very dark at night.
- Changing Main Street's shopfront gaps and the city blocks shifts the pseudo-random street dressing (which shop signs, billboards and kiosks appear where) elsewhere in NeoChinatown. Nothing was removed on purpose; the alley to the District, the District front and the landing pad are built separately and are unchanged.
- Older documents that describe the first version (`docs/void-runner/ncz-upgrade/README.md`, the dated diary in `AI_HANDOFF.md`) were left as history.
