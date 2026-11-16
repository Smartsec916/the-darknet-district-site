# Playthrough fixes 1 (16 Nov 2026)

Build `2026-11-16-fixes-1`, branch `claude/playthrough-fixes-1`. David played the live site (build `2026-11-16-quarters-1`) and sent five pictures and these notes, word for word:

> Remove these button from the Sleeping Pod now that there's an Exit the Pod button above the door. Move the music and lighting controls to the right side of the sleeping pod, not the back. update the keymap with any keys that have been added, like the camera. add a mouse controls map to this. remove the top two radios because they stick out the top. the east gate checkpoint doesn't have a pedestrian vestibule. Much of NeoChinaTown has gaps in the buildings.

and later: "I couldn't get to Milked. Couldn't figure out how to call a taxi."

David authorised changing the Sleeping Pod for the first two. The music player's function, its playlist and its songs were not touched.

## 1. Sleeping Pod: the strip's buttons are gone

- EXIT POD, MUSIC & LIGHTS, LOOK INSIDE and VENDING are removed from the strip along the bottom. It keeps the pod's number, "You wake in a Sleeping Pod." and one line of help ending with the keys.
- Everything is still reachable: click EXIT THE POD on the glass, the music player, the light panel or the vending unit; or press **E** exit, **M** music and lights, **V** vending, **Q** look at the controls (again for the hatch), arrow keys to look.
- **Q is a new key.** It replaces LOOK INSIDE.
- First-time character creation before leaving the pod is unchanged.
- **Found on the way: a click did not land where the picture is.** The pod's click test took the pointer's place in the window, but the game's picture is drawn smaller than the window and stretched (on Low: 911 wide in a 1366 window). A click registered about a third of the way off, for every pod control including EXIT THE POD on the glass. `podPick` in `neochinatown.js` now converts first.
- Every browser script that clicked the EXIT POD button (38 files) now waits for the pod and presses E.

## 2. Music player and light panel on the right-hand wall

- Both are on the occupant's right (facing the hatch), side by side, the player nearer the hatch. The vending unit stays on the left wall.
- The back wall keeps its lamp panel, now in a thin frame, with two vents.
- Their clicks are found by picking the screen itself and reading where on its picture the pointer is, so the click regions moved with the screens. Checked in the running game by scanning the view and by real clicks: READING on the light panel, both ends of the volume bar, the title (opens the playlist).

## 3. KeyMap: complete keys, four tabs, a mouse map

Tabs: ON FOOT, CAMERA, SLEEPING POD, FLIGHT. The KeyMap opens on the tab for what the player is doing (CAMERA while the camera is raised). It can now be opened with the camera raised. It still does not open inside the pod (the pod's keys are on the strip, and on the SLEEPING POD tab once out).

| Where | Keys |
|---|---|
| On foot | W A S D move · Shift run · C or Ctrl crouch · Space jump · E use · I inventory · **B camera** · **G taxi (new)** · L V1 device · P terminal · K KeyMap · Esc pause |
| On foot, with a weapon | 1 or H draw / holster · R reload · 2 rifle (only with the rifle) |
| On foot, with other players | Enter messages · T trade, Y accept, N decline · the talk key chosen in the V1 (default V), held |
| Camera raised | everything on foot, and **F follow person** · B camera away |
| Sleeping Pod | E exit pod · M music & lights · V vending · **Q look at controls (new)** · arrow keys look |
| Flight | unchanged: the rebindable actions of `input.js`, with the arrow keys and right Shift while an action is on its default key |

Mouse map (a drawn mouse: left button, right button, wheel, movement; a part that does nothing in that tab is dim and has no label):

| | Move | Left button | Right button | Wheel |
|---|---|---|---|---|
| On foot | look around | first click holds the mouse (Esc frees it); with a weapon drawn, fire | aim (with a weapon) | change weapon (with a weapon) |
| Camera raised | look around | take a photo | nothing | zoom in / out |
| Sleeping Pod | look around | use the screen or sign under the pointer; anywhere else holds the mouse | nothing | nothing |
| Flight | aim | fire (hold) | nothing | nothing |

- **Keys that only work in a situation are drawn only then** (the KeyMap's rule is "only keys that do something"). A line under the keys names the ones not shown and when they work. So a new, unarmed player no longer sees R, 1 and H.
- Checked against the code that handles each key (`tests/keymap.test.cjs` reads the source files named for each entry).
- Fits 1366 by 768 without scrolling on every tab; on a narrower window the mouse goes under the keys.

## 4. Store counter: nothing stands through the glass

- The two radios on the top shelf are gone. Every kind of item now has a height (the taller of its built and modelled forms) and is laid only on tiers where it clears the top pane by 15 mm. That also takes magazines and fire starters off the top shelf: the modelled radio stood 8 cm through the pane, a magazine touched it, a fire starter was 1 cm short of it.
- A test checks every item, on Medium and on Low, against the top pane, the side panes and its own tier.

## 5. East Gate: a walkers' lane

- One more lane in the gate's entry (`ncz-quarters.js`). The lane, its two doors, the scan, the PEDESTRIANS sign and the collision come from the entry as at every gate. It is on the north pavement; the vehicle bay is where it was.
- Walked to the Zen Zephyr Temple and back exactly as the Function Gate is walked to the Corporate District. At the Temple a sign on a post beside the taxi stop (EAST GATE / ON FOOT · E) with the prompt EAST GATE · WALK TO NEOCHINATOWN walks back. A walker arrives where a taxi passenger does. Nothing else at the Temple changed.
- The scan is a picture only and always passes. No wording about loading.

## 7. "I couldn't get to Milked"

- **Nothing blocked the way.** A new test walks the game's own collision from The Darknet District's street door to Milked's front door and rear door, NULL, the alley, Main Street end to end, every Old Town gate lane and every taxi stop; and in the Port and on the Avenue from the arrival point to every gate, stop and prompt. In the running game the walk from the District's door down the alley, along Main Street, into the side street and through Milked's front vestibule put the player inside Milked.
- **What was wrong: nothing on Main Street said where it is.** Milked is on a side street, and its sign faces that side street. There is now a blade sign at the side street's corner, read from both directions along Main Street, and a wall sign on the corner building facing across the road: the existing MILKED logo and an arrow. No new wording.
- **And a taxi could not be called to get there** (below).

## 8. "Couldn't figure out how to call a taxi"

Three causes, all fixed:

1. **The terminal's TAXI / TRANSPORT section refused everyone.** With the terminal open the game is not in its "walking" state, and the list answered "Taxis pick up on foot, in the city." and offered nothing. It now counts a player reading the terminal on foot as on foot.
2. **From The Darknet District's door no taxi could be called at all**, by any route: the nearest road is 57 m away and the limit was 50 ("No road close enough for a pickup."). The limit is 80 m, which covers the whole alley. The message says how far away the cab will wait.
3. **Nothing in the street said how.** The only working way was the V1, Map, scroll down to STREET TAXIS.

What there is now:

- **CALL A TAXI** at the post of each of the seven stops, and at one more post by The Darknet District's door. E opens the list of destinations with fares.
- **G** opens the same list anywhere on foot. It is on the KeyMap.
- The posts have the lit TAXI plate both ways, an amber lamp on top and a lit call panel at hand height. The painted bay on the road is unchanged.
- The stops were already on the V1 map and still are.
- The cab itself was not restyled; its nodes and its API are as they were (`VoidRoadTaxi` gained `callList`).
- Not done: a cab standing at each stop. The cabs of a quarter drive a circuit; one comes when called.

## 6. "Much of NeoChinaTown has gaps in the buildings"

Done the way David set out: a repeatable check, one gap first, shown to fail before and pass after, then everywhere. Full record: [`NCZ_GAP_CHECK.md`](NCZ_GAP_CHECK.md).

- **What it was.** When the city was cut into quarters, the body of every building that faces a street was thrown away by mistake (it was judged by the rule for street furniture, not the rule for buildings). Roofs, windows, signs and the 3 m shopfront panels were kept. So above the shopfronts, and through a 1.5 m opening every 7 m, the far city showed through. It was the same on the live site and here: none of these blocks uses a purchased model.
- **The check** (`tests/ncz-gaps-browser.cjs`): before, 1,819 of 5,880 rays went through an expected wall in Old Town and 1,763 of 2,958 on the Avenue. After: 0 of 14,568 and 0 of 7,386 (on a finer grid).
- **Also found by it:** seven slits 12 to 24 cm wide between neighbouring buildings. Closed.
- The Port was not run (it is being rebuilt).

## Files

| File | What changed |
|---|---|
| `void-runner/world-integration.js`, `pod-start.css` | the strip without buttons; `podAct`; Q |
| `void-runner/district-area.js` | `POD_VIEW.controls` |
| `void-runner/neochinatown.js` | the pod's screens on the right wall, the back wall, `podPick`; CALL A TAXI prompts in a quarter's layout; the plot bodies and the slits between plots |
| `void-runner/keymap.js`, `keymap.css` | tabs, situational keys, the mouse map |
| `void-runner/district-rooms.js` | `TALL`, `fitsTier` |
| `void-runner/ncz-quarters.js` | the East Gate's foot lane; each stop's post; `CALL_POINTS`, `callPrompts` |
| `void-runner/ncz-gates.js` | posts from `CALL_POINTS`, with lamp and call panel |
| `void-runner/road-taxi.js`, `road-taxi-rules.js`, `personal-hud.js` | `road-taxi-call`, G, on foot while reading the terminal, 80 m pickup reach |
| `void-runner/temple.js`, `temple-build.js`, `temple-integration.js` | the walk-back prompt and its sign |
| `void-runner/milked-build.js` | the two signs on Main Street |
| `tests/playthrough-fixes.test.cjs` (new) | reachability, CALL A TAXI, the taxi list, the plot bodies |
| `tools/ncz/gap-check.cjs`, `tests/ncz-gap-check.test.cjs`, `tests/ncz-gaps-browser.cjs` (new) | the building-gap check |

## Also fixed on the way

- Inside the District or Milked, the taxi list now says "Street taxis stay on the roads. Step outside first." instead of "No street taxi service operates here."
- The terminal redrew its TAXI / TRANSPORT and INVENTORY sections once a second, replacing every button. A click whose press and release fell either side of a redraw was lost. It no longer redraws while a button is held.

## Checked

- `npm test`: all pass (new: `tests/playthrough-fixes.test.cjs`; changed: `keymap`, `district-rooms`, `district-transition`, `ncz-quarters`, `ncz-gate-transit`, `temple`).
- In the running game (bundled Chromium, software renderer, Low unless said):
  - Pod: no buttons on the strip; E, M, V and Q; READING clicked on the light panel, both ends of the volume bar, the title (opens the playlist); the click regions scanned against the picture; the first-time character creator before the pod. Pictures on Low and Medium.
  - KeyMap: all four tabs at 1366 by 768 and at 1024 by 600, 1280 by 720 and 1920 by 1080 (`tests/keymap-browser.cjs`); in the game after the first pod exit; with the camera raised; K still does nothing inside the pod.
  - Store counter: all four cases looked at on Medium (modelled radios) and Low (built radios).
  - East Gate: walked through the walkers' lane to the Temple; walked back with the prompt; walked out onto the Avenue.
  - Milked: walked from the District's door to the alley's mouth, along Main Street, into the side street and through the front vestibule into Milked; from the taxi at Milked corner to Milked's door.
  - Taxi: CALL A TAXI at the alley-mouth post opened the list with fares; G opened it; from the District-door post a cab was called to Milked corner (15 CR, it waited 60 m away at the alley's mouth), boarded with BOARD TAXI, rode, stepped out; then G, Corporate District (60 CR), the ride back.
- CI's two browser scripts, run to the end: `STABILIZATION_SMOKE=1 BROWSER_CHANNEL=chromium node tests/stabilization-browser.cjs` passes; `tests/blackout-tesana-browser.cjs` passes. Also `tests/keymap-game-browser.cjs` (passes) and `tests/pod-free-look-browser.cjs` (Q, V, M and E pass; its 0.7 s arrow-key step fails here because the software renderer draws about one frame in that time, and passes with a longer hold; the arrow code was not changed).
- **Not run:** `tests/ncz-quarters-browser.cjs` with its new East Gate and taxi steps (the machine was shared and each start took ten minutes; the same steps were done by hand as above); the other browser scripts whose only change is pressing E instead of clicking EXIT POD; High and Ultra; real hardware.
- **Not checked with a second player:** the keys drawn for trading (T, Y, N), voice (the talk key) and messages (Enter) are read from the code that handles them.
