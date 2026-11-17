# NeoChinatown in three quarters

Build `2026-11-16-quarters-1` (16 Nov 2026). The owner's map A, approved 16 Nov 2026. The plan this follows, its maps and its measurements were written the same day (the "NeoChinatown rework" plan); the decisions are in [`CHECKPOINTS.md`](CHECKPOINTS.md).

## What changed for the player

- **The outdoor city is three quarters, and only one exists at a time.**
  - **The Port:** the landing pad and the north half of the passage. Arriving by ship, you land here.
  - **Old Town:** Main Street, the alley, NULL, Milked's two streets, The Darknet District's door, the access road.
  - **The Avenue:** the wide road across the top, between two gates.
- **The everyday loop never meets a checkpoint:** Sleeping Pod, District, alley, NULL, Milked are all Old Town.
- **Checkpoints are buildings you pass through.**

  | | Where | Run by | Lanes | What you see |
  |---|---|---|---|---|
  | A1 Port Customs | in the passage between the pad and the access road | private guards (placeholder figures) | one for walkers, one vehicle bay | a gatehouse filling the passage, with an upper storey |
  | A2 North Gate | top of Main Street | private guards (placeholder figures) | a walkers' lane on each pavement, two vehicle bays | a gatehouse under a block of flats bridged across the street |
  | A3 Function Gate | west end of the Avenue | the Corporate District's silent robots, as a stand-in | one for walkers, one vehicle bay | a tall fortified portal; beyond it is the Corporate District |
  | A4 East Gate | east end of the Avenue | private guards (placeholder figures) | one for walkers (added in build `2026-11-16-fixes-1`), one vehicle bay | the same portal; beyond it is the road to the Zen Zephyr Temple |
  | A5 South Gate | bottom of Main Street | nobody | none | shut: a roll shutter in a concrete wall, barriers, red lamps |

- **Passing one:** walk into the lane; in the middle the doors close; green scan lines travel the room and a level line rises and falls on the walls; the picture holds for a moment with the lines still crossing it; the far door opens and you walk out into the next quarter. Nothing on screen mentions loading and there is no bar. **The scan always lets you through:** contraband, being caught, bribes and shielding are not decided and not built.
- **Sky cabs are gone.** Road taxis are the only taxis. Stops: The Port, Main Street, Milked corner, NULL / the alley, The Avenue, Function Gate, East Gate. Call one from the V1 map or the terminal's TAXI / TRANSPORT tab. A trip to another quarter drives into a gate's vehicle bay, the shutters close, the cab is scanned, and it drives on.
- **Corporate District and Zen Zephyr Temple:** by road taxi, 60 credits, the ride back included. The cab drives into the Function Gate (or the East Gate); you step out at the taxi stop there. To come back, use the taxi at the stop: you ride out of the gate and are set down at the stop just inside it. The Function Gate can also be walked both ways (a prompt at the Corporate District's taxi stop walks back). **Since build `2026-11-16-fixes-1` the East Gate can be walked both ways too** (the owner: "the east gate checkpoint doesn't have a pedestrian vestibule"): its walkers' lane is on the north pavement, and at the Temple a sign and prompt beside the taxi stop, EAST GATE · WALK TO NEOCHINATOWN, walks back.
- **Calling a taxi (build `2026-11-16-fixes-1`):** every stop's post has a lit TAXI plate, an amber lamp and a call panel, and a prompt, CALL A TAXI, that opens the list of destinations with fares. There is one more post by The Darknet District's door (no road runs there: the cab waits at the alley's mouth). The G key opens the same list anywhere on foot. See [`PLAYTHROUGH_FIXES_1.md`](PLAYTHROUGH_FIXES_1.md).
- **NULL** has an open doorway built as a five-metre passage with an empty door frame at each end. It is a vestibule in everything but doors.
- **The far placeholder streets** (the Avenue's two ends, the bare "Corporate" plaza, Main Street South, the Container lot) are behind the Function Gate, the East Gate and the South Gate. Nothing of theirs is built any more.
- **Zooming with the camera app renders detail:** people and props that are hidden, simplified or frozen by distance are now judged by the distance the zoomed picture shows.

## Old saves and multiplayer

- **No new save field is required and no id was renamed.** `story.flags.quarter` (`'oldtown'` or `'avenue'`; absent means the Port) remembers which quarter an outdoor player was last in. It is an ordinary short string in `story.flags`, which the save server already accepts (a test covers it).
- **Every login still wakes in the Sleeping Pod,** so a save made in any quarter resumes in the District; walking out of it is Old Town. Anything that puts a player on the street with no position uses the remembered quarter, and the Port when there is none (where the street has always put them). Landing by ship is always the Port.
- **A save made at a sky-cab stop or mid-flight:** the fare of an interrupted flight is refunded once, the three sky-cab records (`taxiTrip`, `skyCabTrip`, `cabReturn`) are dropped, and a map waypoint on a removed landing zone (the plaza, the Container lot) is cleared. The player is told once.
- **A road-taxi trip interrupted by a reload** (including between two gates) is refunded once, as before.
- **Multiplayer:** every quarter stays in the hub's one `neochinatown-street` room, so **chat reaches everyone in the city** and nothing on the server changed (no deploy). The game simply does not draw a player who is standing in another quarter. The Players list does not yet say which quarter someone is in.

## How it is built

| File | What it is |
|---|---|
| `void-runner/ncz-quarters.js` | PURE RULES. The quarters, the gates (`GATES`: one entry per checkpoint), each lane's room, doors and middle, what a quarter's build keeps, the gates' collision, the taxi stops and far places, routes between quarters, the save flag and the old-save clean-up. Tested: `tests/ncz-quarters.test.cjs`. |
| `void-runner/ncz-gates.js` | The checkpoints as buildings: gatehouse, lanes, doors and shutters, scanner and beams, signs, guards, the taxi stops' paint and posts. Built from the entries; nothing is hand-placed per gate except the look that goes with `bridge`, `fortified` and `shut`. |
| `void-runner/ncz-gate-transit.js` | What happens in a lane: seal, scan, exchange, open (walkers), the same for a cab (`ride`), and arriving back from a far place (`arrive`). Also which quarter an entry to the street lands in, and the old-save clean-up. Tested with fakes: `tests/ncz-gate-transit.test.cjs`. |
| `void-runner/neochinatown.js` | `layout('street', quarter)` adds that quarter's gates to the collision; `build({quarter})` runs the same city code as before and keeps only what belongs to the quarter (so every sign, window and cable is where it always was). |
| `void-runner/road-taxi-rules.js`, `road-taxi.js` | One road network and its own cabs per quarter; trips through bays; the two far places; the ride back. |
| `void-runner/zoom-detail.js` | The zoom rule (pure) and its users. Tested: `tests/zoom-detail.test.cjs`. |

**Adding a checkpoint** is one entry in `GATES` (see the comment above `define()` in `ncz-quarters.js` and "Built" in `CHECKPOINTS.md`). An entry whose two ends are the same quarter is a checkpoint inside that quarter: both of its doors work and passing it changes nothing but runs the scan. Both kinds are covered by tests.

**How a quarter is cut out of the city.** The street's build still runs from top to bottom with its one seeded random sequence, so nothing moves. Each piece is asked "does this belong to the quarter being built?" before it is made: street furniture, signs, lamps and cables only if they stand in the quarter or on its walls (2.6 m); city blocks if they are within 45 m of it; everything outside the old neighbourhood (the outer ring, the megacity, the sky) always. People, drones, street lamps, NULL, Milked's shell, the alley's steam and fire, and the District's entrance are made only in their own quarter.

**Correction, build `2026-11-16-fixes-1`.** The rule above did not do what it says for one piece: the BODY of each plot that faces a street was judged as street furniture (2.6 m) and thrown away, leaving roofs, windows and 3 m shopfront panels with the far city showing through (the owner: "Much of NeoChinaTown has gaps in the buildings"). Fixed, and there is now a check that finds such gaps: [`NCZ_GAP_CHECK.md`](NCZ_GAP_CHECK.md). The scene counts in "Measured" below were taken without those bodies; each quarter now has a few dozen more boxes, merged by material.

**One location record.** The street is still the location key `sacramento` with `area: 'street'`; it now also carries `quarter`. Entering the street re-lays that one record for the quarter being entered, so everything that reads the street's location (map, music zones, taxis, the District's and Milked's checkpoints) is unchanged.

**The same gate on both sides.** A gate is built whole in both quarters it joins, in the same place, so the room you stand in does not change. In any one quarter only the door on that quarter's side can open, so a lane's two doors are never open together. The exchange happens only after the door sensors report every door shut.

## Not decided, so not built

Contraband; what happens when caught; bribes; shielding sold by the District; how The Function's own guards look and sound; rail; the Players list naming a quarter; separate hub rooms per quarter (a server deploy).

## Placeholders, listed as upgrade candidates

- **Private guards:** street figures (the existing kit models) with their clothing tinted one dark blue-grey. A proper security character is needed.
- **The Function Gate's guards:** the Corporate District's robots, standing still. Stand-in until the owner decides The Function's look.
- **Gatehouses:** built from boxes with the game's existing concrete and steel textures, practical lamps, hazard paint and signs. They are architecture, not final art: no modelled machinery, no decals of wear on the doors, no interior booths.
- **The held picture during an exchange** is a still of the room with the scan lines animated over it. A fully live vestibule (the old quarter staying on screen while the new one is made) was not possible: making a quarter stops the picture for as long as it takes.
- **Arriving at the Corporate District or the Temple** is a cut from the gate to the taxi stop there: those places were not to be changed beyond their stops, so no matching gatehouse stands at their end.
- **Taxi stops:** a painted bay and a post with a TAXI plate.

## Measured

Same nine viewpoints as the plan and as [`OUTDOOR_PERFORMANCE.md`](OUTDOOR_PERFORMANCE.md), 1280 by 720, frame-rate governor off, each viewpoint now measured in the quarter it belongs to. "Before" is build `2026-11-16-outdoor-1` (the whole city, with the street-people culling already on). **Software renderer: these are counts of what the game asks for, not frame rates.** People stand in different places on every visit, so a difference of a few people between two runs is chance.

| | Where | Quarter | Draw calls Low | Triangles Low | People drawn Low | Draw calls Medium | Triangles Medium | People drawn Medium |
|---|---|---|---|---|---|---|---|---|
| A | Pad, at the street spawn | Port | 153 → 114 | 0.13 M → 0.13 M | 0 → 1 | 368 → 239 | 0.45 M → 0.42 M | 0 → 1 |
| B | Main St south end, looking north | Old Town | 653 → 571 | 0.81 M → 0.69 M | 17 → 14 | 1,776 → 1,574 | 1.69 M → 1.62 M | 33 → 31 |
| C | Main St middle, looking south | Old Town | 454 → 490 | 0.77 M → 0.73 M | 16 → 16 | 1,288 → 1,304 | 1.76 M → 1.52 M | 36 → 30 |
| D | Alley mouth, looking east | Old Town | 374 → 306 | 0.38 M → 0.28 M | 6 → 4 | 918 → 784 | 0.75 M → 0.64 M | 8 → 5 |
| E | District door, looking west | Old Town | 491 → 490 | 0.41 M → 0.45 M | 7 → 8 | 1,240 → 1,206 | 0.79 M → 0.81 M | 10 → 9 |
| F | Milked's side street | Old Town | 305 → 309 | 0.15 M → 0.15 M | 0 → 0 | 786 → 758 | 0.48 M → 0.47 M | 0 → 0 |
| G | Avenue junction, looking west | Avenue | 162 → 208 | 0.23 M → 0.31 M | 2 → 5 | 440 → 605 | 0.69 M → 0.94 M | 6 → 13 |
| H | Avenue junction, looking east | Avenue | 304 → 229 | 0.34 M → 0.33 M | 6 → 6 | 720 → 605 | 0.90 M → 0.84 M | 10 → 12 |
| I | Main St north end, looking south (moved 7 m south: the old spot is inside the North Gate) | Old Town | 533 → 537 | 0.75 M → 0.76 M | 17 → 17 | 1,412 → 1,526 | 1.67 M → 1.87 M | 34 → 39 |

What exists at once (the whole scene, whichever way you look):

| | Objects Low | Materials Low | Pictures Low | Objects Medium | Materials Medium | Pictures Medium | Animated figures Medium |
|---|---|---|---|---|---|---|---|
| Before: the one city | 1,070 | 417 | 316 | 1,581 | 458 | 393 | 76 |
| The Port | 245 | 243 | 183 | 262 | 266 | 208 | 1 |
| Old Town | 993 | 435 | 320 | 1,389 | 480 | 408 | 55 |
| The Avenue | 597 | 320 | 241 | 839 | 354 | 310 | 28 |

**What the numbers say, plainly.**
- **The Port and the Avenue are far smaller places than the old city:** a quarter to a half of its objects, and the Port's heaviest view is a third fewer draw calls. This is the budget the plan wanted for rebuilding them in detail.
- **Old Town is hardly lighter than the old city.** Main Street, NULL, Milked and the alley were always the heavy part, and they are all still together (that is what keeps the everyday loop free of checkpoints). Its views are within a few percent of before; what it lost is the avenue's and the pad's people and signs behind its buildings, which the street-people culling had already stopped drawing.
- **View G got heavier** because there is now something to look at: the Function Gate, its robots and more of the avenue's own crowd stand where there was bare road. View C and view I differ by chance in who was standing there.
- **So the split alone does not fix Main Street.** What does is in the plan's section 5 and is not done: far people as one piece each, the signs on shared sheets, and the Medium glow pass that still draws everything twice.
- **Time to make a quarter** (the wait a checkpoint hides), software renderer, Low: the Port 5 to 9 s, the Avenue 4 to 12 s, Old Town 7 to 12 s over three runs of walking through the gates (the machine was shared, which is most of the spread); the Corporate District or the Temple 1.4 to 3.3 s. At Medium: the Port 23 s, the Avenue 14 s, Old Town 31 s. The plan measured the old whole city at 10 to 36 s on the same machine. A real graphics card will be many times faster; nobody has timed one. On foot, a pass takes about 3 s of doors and scan plus that wait.

## Checked

- `npm test`: all pass (new: `ncz-quarters`, `ncz-gate-transit`, `zoom-detail`; rewritten: `road-taxi`; updated: `corporate`, `temple`, `milked`, `milked-transition`, `district-map`, `district-areas`, `mission-reset`; removed with their subjects: `sky-cab`, `city-taxi`). `python3 -m unittest tests.test_story_save tests.test_progression_save`: pass, with a new test that `story.flags.quarter` survives the save server's validation.
- **In the running game** (bundled Chromium, software renderer, Low): walked Port Customs both ways, the North Gate west lane north and east lane south, the Function Gate to the Corporate District and back; rode a taxi Old Town to Corporate District (North Gate, then Function Gate) and back, Avenue to Temple (East Gate) and back, East Gate stop to the Port (North Gate, then Customs), the Port to the Avenue (Customs, then the other North Gate bay); fares 60, 60, 19 and 16 CR charged once each, rides back free. Left and entered The Darknet District through its own vestibule (lands in Old Town), walked into Milked and out by its front vestibule; walked in and out of NULL through the new passage; an entry to the street with no position resumed in the saved quarter for all three; no page errors.
- Pictures of every gate from outside and inside, the scan, the shut South Gate, NULL's doorway, the taxi stops and both far arrivals were looked at on Low and Medium and the buildings reworked until they read as gatehouses.
- **Zoom, live:** from the access road the three alley people (78 to 103 m away) are switched off; with the camera app's zoom at 3x they are switched on; back at 1x they are off again.
- **Found and fixed on the way:** NULL's doorway could stay solid (though it looked open) when the club finished loading while the street was still being entered. Its collision now always follows the club's state (`ncz-nightclub.js`).
- `tests/ncz-quarters-browser.cjs` repeats the walking and riding checks.

## Far South and The Outskirts (16 Nov 2026, builds `2026-11-16-far-south-1` and `2026-11-16-outskirts-1`)

Five quarters now. Route: The Darknet District, the alley, Main Street, **South Gate (A5, live)**, **Far South** (Main Street's second stretch, z -224 to -130, with Milked moved there), **Far South Gate (A6, pedestrians only)**, **The Outskirts** (z -260 to -224).

- **Milked** was carried 100 m south by one rigid translation (`OFFSET=[0,-100]` in `milked.js`); nothing of its look changed. Old Town got proper closed frontage where its block stood; two blade signs on Main Street's east wall (the existing logo, an arrow, the words SOUTH GATE) point the way. Taxi stop "Milked corner" is now in Far South at (61,-182); the fare comes from the same stop table.
- **Saves:** no save stores a street position (every login wakes in the Sleeping Pod); `story.flags.quarter` may now be `'far-south'` or `'outskirts'` (ordinary short strings; a test covers the server). Anything that hands a position from before the move to `enterWalking` goes through `settle()` in `ncz-quarters.js`: a point in Milked's old block follows it into Far South (a player who was inside is put outside its front door), any other point that is no longer open ground goes to the nearest street of the saved quarter. No id was renamed.
- **The Outskirts** (`ncz-containers.js`, code-built, no model, no generated picture): packed gravel hub 56 by 36 m with two lanes that end at containers and fences, about 25 containers in stacks, offsets, decks with stairs, lean-tos, rooftop clutter, cables, lamps, oil drums, abstract spray marks (no letters). Backdrop massing is the city's own buildings. **Kai Kryptos' home** is one reserved teal container (`KAI_HOME`, id `kai-kryptos-home`): a closed door, a lit window, a step; no character, text or interaction. Not the companion `npc-kai`.
- No ad screens, no taxi network, no nightlife walkers in The Outskirts; music is the city's.
- Streets added to `neochinatown.js`: `southGate`, `farSouth`, `outskirts`, `outskirtsWest`, `outskirtsEast` (the retired `mainSouth` and `containers` placeholders are gone). The city blocks are cut differently, so Old Town's random windows and signs are not the same as before.
- Map: [`neochinatown-map.png`](neochinatown-map.png).
