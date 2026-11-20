# Modular interiors (19 Nov 2026)

Branch `claude/modular-interiors`, build `2026-11-19-modular-interiors-1`. Pushed, no PR, not merged.

The owner: "so in the mission editor i need to be able to add locations by type: housing, commercial, other, office and commercial style hallways. i need an office building interior. the area can be fairly small. it needs cubicles, desks, chairs, computers. a server room with server racks. the ability to connect these areas together so make sure they fit" … "elevator" … "like modules".

## What the owner gets (plain words)

- **Mission Editor → a mission → "Add a location".** Pick a category (Housing, Various, Office, Server room, Hallways, Elevator, Other; a category with nothing in it is not offered; underground pieces are listed under an **Underground** heading), then the module, then press **+ ADD**. Every next module joins at a free door of the ones already there, so it always fits. A small top-down plan shows the floor: click a module to move it (arrows), turn it (TURN) or remove it; green marks are doors between modules, amber the entrance, red a door locked until hacked.
- **Floors and the elevator.** Add an elevator cab where you want the lift, then **+ FLOOR BELOW / + FLOOR ABOVE**: the new floor starts with the same cab; add modules there at its door. Inside the cab there is a button for every other floor; the doors close, a short fade, the doors open on that floor.
- **The street door.** Choose it from the list: any apartment-building door, an Outskirts container, and the new **office entrances** (The Avenue's west end, toward the Function Gate: 7) and **shop back entrances** (Old Town and Far South: 12). Each is a door in the middle of a plain shopfront, half way between two apartment doors.
- **Steps:** "Go into a place" (any room of it, or one chosen room), "Use something" (choose the room, then the thing: a desk computer, the manager's computer, a server rack, the core rack, the terminal, a cooling unit, a safe, the copier …), "Hack the access point" (any door of the location, from either side; tick "locked until hacked" on that door).
- **Lights and screens** start on or off per module; the player can switch them in the game (light switch by a door; the screen itself).
- **Items** (data for later): each module can carry placed items; the game shows a small marked case ("LOOK: …").
- **Blocks view:** + ADD A BLOCK › Location › "Build a location from modules" shows the same card. **Make a mission:** "An apartment for this mission" now also offers ready-made locations (office; office with a server room downstairs; shop back room; bar back room; street clinic; storage room).
- **Templates** in the card ("start again from a template") give the same ready-made locations.
- **The older apartments** keep working exactly as before. They are also modules (Housing: the five apartments; Hallways: their hallways), joined through a "connection" (a door that leads elsewhere). CONVERT THESE APARTMENTS TO MODULES (optional) turns a mission's older apartments into locations; its steps keep working.

## The modules

| Category | Module | Size (grid cells of 2 m) | Doors (sockets) | Can be used |
|---|---|---|---|---|
| Office | Office floor | 6 x 5 (12 m x 10 m) | s1 n1 w2 e2 | 10 desk computers, manager's computer, safe, copier, meeting screen, lights |
| Server room | Server room | 4 x 4, 3 m high | s1 n1 e1 | server racks, the core rack, terminal, cooling unit, lights |
| Elevator | Elevator cab | 1 x 1 | s0 | floor buttons |
| Elevator | Elevator lobby | 3 x 2 | n1 s1 w0 e0 | building directory, lights |
| Hallways | Office hallway / Commercial hallway | 1 x 4 | s0 n0 w1 e1 w2 e2 | lights (commercial: electrical panel) |
| Various (was Commercial; same type ids) | Shop back room / Bar back room / Street clinic | 3 x 3 | s1 n1 w1 e1 | stock terminal, safe, shelves / office computer, safe, kegs, CCTV / med terminal, medicine cabinet, med fridge, vitals monitor |
| Other | Storage room | 2 x 2 | s0 n1 w0 e1 | lockers, breaker panel |
| Other | Maintenance corridor | 1 x 3 | s0 n0 w1 e1 | junction panel, valve |
| Housing / Hallways | the five apartments and their hallways (apartments.js) | their own rooms | `entry` / `street`, `d0`.. | the apartment set's own |

**Looks** (art direction "PERMANENT DIRECTION"): corporate (carpet tiles, painted plaster with panel reveals, a wood veneer dado, a suspended ceiling with light panels, glass with a frosted band, the city behind half-down blinds), technical (raised floor with perforated tiles, gunmetal panels, rack fronts with blinking status LEDs, ladder cable trays, sprinkler mains), back of house (sealed concrete, painted block, pipes, caged tubes), clinical (vinyl, wall tiles). Props: the repository's own office chair (re-toned charcoal), plants, crates, as instances on Medium / High; stand-ins on Low.

## The standard (for Claude and Codex)

- **Grid 2 m.** A module is `w x d` cells; its walls stand inside its own footprint (0.1 m; two modules side by side make one 0.2 m wall). The floor is at 0 m everywhere.
- **A socket** is one cell on one edge (`s1`: south edge, second cell from the west). Every door is the same: 1.2 m wide (1.04 m clear between the jambs), 2.2 m high, an automatic sliding door in a steel frame (`VoidApartments.slider`), a status light, an access point on each side.
- **Snaps:** two grid modules on the same floor whose sockets meet face to face are joined (one shared door). A socket that meets another module's plain wall is refused, so are overlaps. Unused sockets are plain wall.
- **Portal modules** (the older housing set) have no grid place; `links` join their sockets to other sockets (a short fade).
- **Elevator:** one cab per floor, all cabs of a location are one lift; each cab must open onto something.
- **The entrance** (`entry`) is a free outside socket; the street door leads there. An older hallway or apartment as the entrance keeps its own kind of street door.
- **Checks** (`modules.js problems`, the server's `module_location_problems`): fields and limits (12 modules, 20 items, 12 links, 12 locks, grid 24 x 24, floors -3..9), overlaps, doors into walls, connections, one cab per floor and a second floor, the entrance, every module reachable from the street (doors, connections, the elevator), locks only on doors.
- **Tests** check that nothing stands in front of any door (1.2 m deep, the door's width) and that every module attaches to every free door it can meet.

## Data

A mission's `apartments` list holds both shapes; an entry with `modules` is a location:

```
{id, door, from?, entry:'<module>.<socket>', modules:[{id, type, x?, z?, rot?, floor?, lightsOff?, screenOff?, number?, items?}],
 links?:[{a:'<module>.<socket>', b:'<module>.<socket>'}], locks?:['<module>.<socket>']}
```

Steps: `apt-enter {apt, mod?}`, `apt-use {apt, mod, object}`, `hack {ap:'<location>/<module>.<socket>'}` (older `<apartment>/hall|entry` and street door ids stay valid). Events: the place event carries `apt` and `mod`; `apt-use` carries `mod`. `apartmentsNow()` gives a location as `{key, mission, id, door, modular:true, loc, hacked}`.

## Code

- `void-runner/modules.js` (pure, Node-tested): `TYPES`, `CATS`, `TEMPLATES`, `analyse` (placement, snaps, links, clusters, doors, problems), `problems`, `attach` / `addModule` / `removeModule` / `freeSockets` (the editor), `fromApartment` / `migrateMission`, `layout(inst, cluster)` (the walking area: walls with door gaps, furniture, closed-door collision, exits, access points, elevator buttons, items), `inventory()`.
- `void-runner/module-build.js`: wraps `VoidApartments.build` for `def.modular` (older rooms still go to apartment-build.js). Everything static merged per material (shared by the cluster's modules); per-module lamp and screen materials (lights / screens on and off per module).
- `void-runner/module-integration.js`: in from the street (apartment-integration.js `enterDoor` hands a location over), doors that lead elsewhere, the elevator, the uses, the module the player is in (`VoidApartments.insideMod`), doors a hack opened.
- `void-runner/module-editor.js` (editor, loaded with the Mission Editor): the Location card, the module picker, the step room picker, the location's access points.
- Server: `void_runner_live_content.py` (`module_location_problems`, `_module_analyse`, step checks with `mod`), `void_runner_drafts.py` (the editor's copy through `apartment_shape_problems`). `tools/admin-inventory.cjs` writes `modules` (types, sockets, categories, objects, bounds, limits).
- Only the current cluster (the modules joined by doors on that floor) is built; leaving it disposes everything. Private like the apartments; nothing is saved (every login wakes in the Sleeping Pod; `save-manifest.json` unchanged).

## Tests

`tests/modules.test.cjs` (7), `tests/test_modules.py` (6), `tests/modules-browser.cjs` (builds "street → office hallway → office floor → elevator → server room" with the Location card's own buttons, plays it as a draft: locked street door, ENTER, the hallway, a hack opens the office door, a desk computer, the lights, the elevator to B1, a server rack, back up and out; real save untouched). Screenshots: `SHOTS=dir`.

## Performance (software GL in a Linux container, 960 x 540; the counts are what matters)

Draw calls for one rendered frame (everything the scene draws, the glow pass included), `SceneInstrumentation.drawCallsCounter`, each module built on its own (a hallway with the module it serves), two or three views; the larger number is the view that looks back at the entrance:

| | Medium | Low |
|---|---|---|
| Office floor | 78–148 (2 real lights, 19 chair / plant instances) | 33–61 (1 light, no props) |
| Server room | 62–102 | 25–45 |
| Office hallway (with the office floor) | 98–120 | 38–52 |
| Elevator cab (office floor + hallway + cab) | 42–118 | 15–51 |
| Elevator lobby | 64–66 | — |
| Commercial hallway | 98–100 | — |
| Shop back room / bar back room / clinic | 52–150 | — |
| Storage room / maintenance corridor | 46–122 | — |
| The walk: hallway + office + cab (floor 0) | 130 | — |
| The walk: cab + server room (B1) | 94 | — |

The apartments measured 94–108 on Medium. Every static piece is merged per material and the materials are shared by all the modules of a cluster, so adding a module adds only its own new materials (its lamps and screens).

## Not done / weak

- No real hacking minigame (the apartments' progress bar stands in). Using things only describes them (stubs for later: rack and terminal hacking, the safe, the cabinet).
- No drag-and-drop on the plan (arrows, TURN and "joins at" instead). No stairs (the elevator links floors).
- No NPCs inside the modules yet (office workers, a doctor): candidates for later.
- Procedural furniture is still simple in places (desks, racks' bodies, kegs): upgrade candidates under the art direction. No Meshy credits were spent.
- Not verified: real hardware, VR, multiplayer with two real players.

## Various rooms and the underground (20 Nov 2026, branch `claude/various-rooms`, build `2026-11-20-various-rooms-1`)

The owner: "can you make me more and place all of them in Various filter?"; then the underground: "eventually I want underground locations", "underground will have a security vestibule, but guarded by gangs, not guards", "the underground tunnels will be linked together", "just make them repeatable so the tunnel [is] placed in the correct format", "an underground tea room would be cool too", "lantern tunnel. mahjong. a small sleeping room with bed divided by curtains. underground food stall."

- **Category.** `commercial` is gone from `CATS`; `various` (Various) took its place. `shop-back`, `bar-back`, `clinic` moved there with **unchanged type ids**, so saved missions load as before. The picker hides an empty category and groups `underground:true` types under an "Underground" heading.
- **Street rooms (Various, 3 x 3 unless noted, doors s1 n1 w1 e1, each with a ready-made template: commercial hallway + the room):** Pawn shop back room (`pawn-back`: storage cage, the buying counter behind a grille with an item scanner, appraisal terminal, safe; **SELL ITEMS** opens the pawn panel), Noodle kitchen (`noodle-kitchen`), Electronics repair workshop (`repair-shop`), Cyberware workshop (`implant-shop`), Laundromat back room (`laundry-back`), Tea house private room (`tea-room`), Card room (`card-room`), Tattoo parlour (`tattoo`), Pirate radio booth (`radio-booth`), Scooter garage (`scooter-bay`), Shrine room (`shrine-room`, 2 x 2, s0 w0 e1).
- **Underground (all `underground:true`):** Stairwell (`stairwell`, Hallways, 2 x 3, a "cab" like the elevator: one per floor at the same place; STAIRS · DOWN / UP), Gang checkpoint (`gang-vestibule`, Hallways, heavy doors with eye slots, chain-link pass-through, table with cash box and wand, CCTV on a crate, three doorman `spots`), tunnel tubes (`tunnel-short` 2 m, `tunnel-mid` 4 m, `tunnel` 6 m, `tunnel-junction` for corner / T / cross, `tunnel-lantern`, `tunnel-lantern-junction`), Tunnel chamber (`tunnel-chamber`), Fight pit (`fight-pit`, Various, 4 x 4, a room off a tunnel), Underground tea room (`tea-under`: front door s1, back door n1 hidden in a service nook behind a partition and a folding screen), Mahjong parlour (`mahjong`), Underground sleeping room (`flophouse`), Underground food stall (`food-stall`, 2 x 2, a cook spot).
- **Tunnel tubes tile seamlessly.** Every tube piece (`tube:true`) is 2 m wide, 2.6 m high, and symmetric left to right; module-build.js draws them from one cross-section (`XS`: low pipe, high pipe, small pipe, ceiling tray, centre-line drainage channel) and hangs a lamp at the middle of every 2 m cell. Two tubes joined end to end form a **seam** (`modules.js seamless`): no wall on either end, no door, no door solid, no access point (`hackable` is false there). A tube meeting a room keeps an ordinary door. Junctions run the high pipes and the tray round all four sides and put risers in the corners, so the pipes of any arm continue.
- **Spots** (`spots:[[name, x, z, yaw]]`, local metres) mark standing places for people the owner will place later (fight pit host and corners, gang doormen, card dealer, tea room host and doors, mahjong cashier, food-stall cook). They are data only (exported in the admin inventory); no placement tool uses them yet.
- **Templates (previews):** "Underground: fight pit off a tunnel" (starts on floor -1), "Underground: stairs down, gang checkpoint, tunnel, fight pit" (the owner's order: stairs, then the door at the bottom, then the checkpoint), "tunnel run with a tea room off a T-junction", "lantern tunnel, mahjong parlour, food stall, sleeping room", "a long tunnel run with a T and a corner". A location may start underground (its street door leads straight to a floor -1 module).
- **Adults-only rooms** for youthful characters (npc-escort.js `ADULT_ROOMS`): only the fight pit (the owner, 20 Nov 2026; the bar back room, card room and gang checkpoint are open).
- **Pawn shop selling:** `void-runner/pawn-shop.js` `BUYS` (empty on purpose; one line per item: `{item:'<progression.js personalItems id>', price}`). Selling removes the carried item and adds the credits, then saves; the cloud save already accepts any whole credits (0..100 000 000) and validated carried items, so no server change was needed.
- **Not done:** linking tunnels of different locations into one network across street doors (see AI_HANDOFF.md); a placement tool for the `spots`; how the player reaches the underground (the owner's choice).
