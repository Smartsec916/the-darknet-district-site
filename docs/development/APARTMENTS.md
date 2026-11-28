# Mission apartments (19 Nov 2026)

Branch `claude/apartments`, build `2026-11-19-apartments-1`. Pushed, no PR, not merged.

The owner: "create me 3 apartment interiors using mostly existing assets. 1. a rundown apartment. 2 a normal apartment. 3 a luxury apartment ... create a hallway interior for each 3 of these with doors along it to other apartment, but only one will go to the made apartment ... along all streets where there isn't already something there or behind it make a door NPCs can go in and out of representing their apartments, but players can't enter unless the apartment instance is placed there for the mission ... in the mission editor add 'instance an apartment' then I will assign it to a specific door along the street. I can add more than one apartment per mission. later i also want to be able to place items like loot, mission items, and other things specific to that mission or apartment inside."

Later the same day: every door is an automatic sliding door; an access point beside every apartment door and a "Hack the access point" step (with a reserved, unsold hacking device); a couch in each apartment; **no kitchen and no refrigerator** (a vending machine instead); an advertisement screen across from the couch in the rundown and normal apartments, switchable in the game, with "Screen starts On / Off" and "Lights start On / Off" in the editor.

## Editing a vacant apartment

Open **Dev Tools → Apartment Editor**. Pick a neighborhood, an available street entrance, and an apartment number. **Go to street door** starts a private editor session facing that door. Enter the building as usual and walk to the selected apartment. The editor opens inside.

To edit an assigned residence, choose **NPC homes** under **Apartment type**, then select the resident by name. The editor fills in their street entrance and apartment number. The same private session opens the NPC’s layout, including its resident positions. These designs save in this browser.

- Use **Finishes and lighting** to recolor the walls, floor, bedding, furniture finishes, and trim. The **VR bedroom-inspired palette** starts with muted finishes and warm lighting. Adjust the light color and brightness from there.
- Use **Asset Finder** to search by name, category, or source. Select an asset and choose **Place selected asset**. Move the marker over the floor plan and click to place it. The placed asset controls let you fine-tune its position, height, rotation, scale, and tint.
- Red areas reserve existing furniture, door clearance, interaction approaches, and routes to the standard resident positions. A red asset marker shows a placement conflict. A teal marker shows a clear placement. Use **Walk room** to check how it feels in first person.
- To add your own asset, make it in Blender with the Higgsfield panel or make it in Meshy. Export a self-contained GLB with embedded textures. In **Import a Blender or Meshy asset**, choose its source and category, pick the GLB, and select **Add to Asset Finder**. Imported models can be reused across apartments in the same browser.
- **Private library** lists the shared models that Pages seals from the licensed-asset repository. Local previews use matching IDs so a design keeps its placed models when the catalog is published.
- In **Apartment music**, choose an audio file exported from Riffusion, set its volume, and preview it. The track loops in that apartment and stops when you leave.
- **Save apartment** stores the design, placed assets, and track in this browser for the current developer account. To reopen it, select the same street entrance and apartment number. Editor sessions use a temporary campaign, and designs are stored locally.

## What the player sees

- **Street doors.** About 64 apartment-building doors along The Avenue, Main Street (Old Town and Far South), the access road and the Port passage, each in the gap between two shopfronts, with its house number, a frame light and an access point (card reader, small screen, status LED). Never in a street join, at a gate, at NULL, at Milked's frontage, in front of the District or its terrace, by a taxi post or by street furniture. Odd numbers on the east and north sides.
- **Locked unless it is yours.** A door is red and "LOCKED" for everyone, except a player one of whose missions has an apartment there now (amber light; ENTER). Walking into the open door, or E, goes into the hallway. On Medium and High a few street people come out of one door and go into another now and then; their door opens for them.
- **Hallway** (one per style, 22 m): ten numbered doors; the mission's door is amber (or red and "LOCKED (ACCESS POINT)" when the mission keeps it locked until hacked), every other one is locked. The street door at the end goes back out to the same street door.
- **Apartment** (one per style, all 8 m x 10 m with a bathroom; identical footprint and collision): entry door, bed, couch with a low table, bathroom (toilet, sink with mirror, shower), vending machine, computer, utility panel (opens), closet with clothes and boxes (opens), safe (locked), light switch, storage shelving, the ad screen (rundown and normal), a window onto the skyline (luxury: the whole wall), style decoration. Leaving goes back to the hallway in front of the same door.
- **Doors slide** into the wall (0.5 s, eased) when someone allowed comes near and close about 1.5 s after; a light on the frame shows green (open), amber (yours) or red (locked). The bathroom door slides too (no frame light, no access point).
- **Everything usable** says what it is (stubs for later gameplay): COMPUTER, UTILITY PANEL (the hatch opens), SAFE (locked), VENDING (lists a few of the pod vending unit's products; buying comes later), CLOSET (the doors open), LIGHTS (on / off: the fixtures dim and the real lights go out; the window and small LEDs keep it readable), TURN SCREEN OFF / ON (off = black glass; the feed stops being drawn). Each use is a mission event.
- **Private.** Other players never see someone inside (`remote-players.js`: a private location has no shared room) and their street door stays locked.

## Rundown / normal / luxury

- **Rundown:** mould-stained concrete walls with leaking-metal wainscot, worn plank floor, a flickering tube, a pink LUCKY neon in a barred window, a mattress on pallets, a patched and stained couch with a crate for a table, trash bags, cans, peeling paint, a tag over the bed, an old scuffed vending unit, cardboard boxes; hallway with pipes, a flickering tube, graffiti, a MISSING poster.
- **Normal:** painted walls with a steel dado, plank vinyl floor, a warm ceiling panel, blinds, a compact couch with a throw on a rug, a holo-frame, plants, books, a lucky cat, a small dining table; hallway with panel lights, a notice board, a plant.
- **Luxury:** dark marble walls and floor, wood slats, a window wall over the skyline, cove strips and pendants, a leather couch, a black marble table, a bar island with stools and bottles, a sculpture, art; hallway with sconces, a runner, a console table, art.

## Data and rules (for Claude and Codex)

- `void-runner/apartments.js` (pure, Node-tested): `STYLES`, `OBJECTS` (`computer`, `panel`, `safe`, `vending`, `closet`, `lights`, `screen` — screen only rundown / normal), `ITEM_TYPES`, `EDGES` (a copy of `neochinatown.js` street edges; the test compares them), `KEEP_OUT`, `doors()` / `door(id)` / `doorsIn(q)` / `nearestDoor`, `layout(part, style, {items})` (the walking locations `apt-hall-<style>` and `apt-<style>`; `id: 'neochinatown'`, `private: true`, placed at `ORIGIN` 600, 600 far outside the city), `FURN` (common furniture boxes: the same in all three), `SEATS` (couch seats, for NPCs later), `AD_SCREEN` (slot ids `apt-rundown-adscreen`, `apt-normal-adscreen`), `HALL`, `slotsFor`, `problems(m)`, `openNow`, `hackedDoors`, `hacksNow`, `strip`, `inventory()`.
- Door ids: `apt-<street>-<side>-<metres along>` (e.g. `apt-main-w-96`). They stay put as long as the street edges do.
- Mission data: `apartments: [{id, style, door, number?, from?, locked?, screenOff?, lightsOff?, items?: [{type, label, x, z, y?}]}]` (4 per mission at most; items 20, inside the room). Steps: `apt-enter {apt}`, `apt-use {apt, object}`, `hack {ap, hold 2..30 (default 5), stay (default true), unlock (default true), needs?}`. Access point ids: a street door id, `<apartment>/hall`, `<apartment>/entry`.
- Open rule: a taken, unfinished tree mission; from its start or from the moment the `from` step is the one in progress; until the mission ends. A `locked` apartment's hallway door opens once a hack step on `<apartment>/hall` (with unlock) is done. A hacked street door opens for the rest of that mission.
- Mission engine (`mission-content.js`): `STEP_KINDS` + `APT_KINDS`; the place event carries `apt` ('<mission>/<id>' while inside: `apt-enter`); events `{type:'apt-use', mission, apt, object}` and `{type:'hack', ap, mission}`; `apartmentsNow`, `hackedNow`, `hacksNow`; `treeStrip` keeps the fields; `treeNeeds` names what is missing (Guide me keys `step-apt`, `step-object`, `step-ap`, `apt-door`).
- `live-content.js`: `apartments()`, `hackedDoors()`, `hacks()`, `aptUse()`, `hack()`; the place event's `apt`.
- `progression.js personalItems`: `ward-kit` and the reserved `hacking-device` ("Hacking device", `sold:false`: no price, no shop listing; the owner decides the sale with Admin). Restored saves keep both (`void_runner_progression.py` too).
- Server: `void_runner_live_content.py apartment_problems` (the same rules against the admin inventory `apartments`), `apartment_shape_problems` (the editor's server copy, `void_runner_drafts.py`). `tools/admin-inventory.cjs` writes `apartments` (styles, objects, item types, limits, hack range, items, every door).
- Build: `void-runner/apartment-build.js` (one TransformNode; static geometry merged per material; CC0 texture sets from `assets/textures/ncz` and `assets/textures/district-interior`; repository models `milked-pothos`, `milked-bamboo`, `milked-office-chair`, `milked-lucky-cat`, `district-bar-stool`, `district-radio`, `props/crate` on Medium / High, stand-ins on Low; 1 real light on Low, 2 otherwise; the scene's mood is put back on dispose). The ad screen borrows `ad-screens.js street()` for one wall feed of the door's quarter (the same programme as the city's screens) and repaints it 5 times a second only while it is on.
- Wiring: `void-runner/apartment-integration.js` (street doors as thin instances: about a dozen draw calls a quarter; their prompts are added by wrapping `VoidNeoChinatown.layout`; `VoidNeoChinatown.build` is wrapped to add the doors and residents; prompts, transitions, hack HUD, uses). `babylon-renderer.js` builds `def.apartment` like Milked / the Temple.
- Saves: nothing new. An apartment is not a save location (like Milked): every login wakes in the Sleeping Pod. `save-manifest.json` is unchanged. The ad screen / lights state is kept per apartment instance for the session only.

## Container apartments in The Outskirts (19 Nov 2026, second set)

Branch `claude/container-apartments`, build `2026-11-19-container-apartments-1`. The owner: "one more set of apartments, a smaller hallway for it maybe 4 doors, with 2 styles for the actual apartments. Rundown and regular. These will be using shipping containers for The Outskirts ... they could be along the outline. But evenly spaced".

- **Styles:** `container-rundown` ("Container — rundown": bare rusty corrugated steel, torn insulation patches, a tarp, a mattress on pallets, a caged bulb, scavenged clutter, an OPEN 24 sign in a cut window) and `container-regular` ("Container — regular": white-lined insulated panels over a painted blue dado, an LED strip, a compact platform bed, plants). Both are two joined 40-foot containers, 12.2 m x 4.7 m inside (identical footprint and collision), with the same things as the city apartments: sliding entry door with its access point, a wet room (toilet, sink, shower) behind a sliding door, bed, couch with a low table, the ad screen on the south wall across from the couch (Screen starts On / Off; TURN SCREEN OFF / ON), computer, utility panel, closet, safe, vending machine, storage, light switch (Lights start On / Off). No kitchen, no refrigerator.
- **Hallway:** three joined containers, 13 m, four numbered doors (1 to 4, or the mission's number), welded-shut cargo doors at the far end, the yard door at the near end ("EXIT TO THE YARD").
- **Doors in the yard:** one in the yard-facing front of each container on the edge of the yard (the west and east rows, the south row, the two lane ends): 15 doors, ids `apt-yard-<side>-<container number>` (e.g. `apt-yard-s-10`), numbered by container, styles alternating rundown / regular. Never Kai Kryptos' home, never a container with a deck and stairs on that front, never on the container's own side door, and only where the ground in front is clear (other containers' collision, crates read from the built scene). Stacked containers' doors are reached from 0.6 m further out (their collision includes the upper levels). Residents walk in and out on Medium and High.
- **Rules:** a container style only behind a container door, a city style only behind a city door (game and server). In the editor the door list and the map follow the style (the map opens on The Outskirts).
- **Code:** `apartments.js` `CONTAINER_STYLES`, `isContainer`, `geo(style)` (the city or container geometry: `CAPT`, `CFURN`, `CHALL`, interactions, ad screen, panel, switch, access point), `containerDoors()`, `doors()[i].family`; inventory `boundsByStyle`, `containerStyles`, `screenStyles`, `doors[id].family`. `apartment-build.js buildCFlat`, `buildCHall`, `adScreenS` (a screen on a south wall). `apartment-integration.js` (container doors without the shopfront filler; `reach`). `void_runner_live_content.py apartment_problems` (family, per-style bounds).
- **Tests:** `tests/apartments.test.cjs` (Outskirts test), `tests/test_apartments.py` (`test_container_styles`), `STYLE=container-regular node tests/apartments-browser.cjs`.

## Performance (software GL in a Linux container, 1280x720; real GPUs are faster, the counts are what matters)

Draw calls for one rendered frame (everything the scene draws, including the glow pass on Medium), measured with `engine._drawCalls` after `scene.render()`:

| | Medium | Low |
|---|---|---|
| Rundown apartment | 104 (47 active meshes, 2 real lights) | — |
| Normal apartment | ~100 | 42 (1 real light, no props) |
| Luxury apartment | 94 (42 active meshes) | — |
| Hallways | 102–108 | 45 |
| A street quarter (all of it, doors included) | 118–126 | — |

The street doors of a quarter add about 12 draw calls in all (thin instances: frames, slabs, lights, plates, access points).

## Not done / weak

- No real hacking minigame (a progress bar stands in: replace `run()` in `apartment-integration.js`). No buying at the vending machine, nothing inside the safe, the computer or the panel yet; items are shown and described, not picked up.
- Not added to the "Make a mission" wizard (it needs a door-picker page); the Mission Editor has it.
- The player cannot sit on the couch (the game has no player sit); `SEATS` are there for NPCs later.
- NPCs entering their own apartments are ambient walkers only (no schedules); only on the main streets with doors on the same side within 40 m.
- Procedural furniture is still simple boxes in places (bed, couch, vending body): upgrade candidates under the art direction. No Meshy credits were spent.
- Not verified: real hardware, VR, multiplayer with two real players.

## Now also modules (19 Nov 2026, `claude/modular-interiors`)

The five apartments and their hallways are also **modules** of the modular interior system (`docs/development/MODULES.md`): Housing (`apt-<style>`) and Hallways (`hall-<style>`) are portal modules, joined to other modules by a connection (a door that leads elsewhere). Everything on this page still works as written: an older `apartments` entry `{id, style, door, ...}` is valid as it is, and the Mission Editor's CONVERT THESE APARTMENTS TO MODULES button (optional) turns it into a location (`modules.js migrateMission`: `<id>/hall` becomes `<id>/hall.d<slot>`, `<id>/entry` becomes `<id>/flat.entry`). Office and shop entrances (`biz-...` doors, families `office` and `commercial`) now stand in plain shopfronts; an apartment of the older shape never goes behind one.
