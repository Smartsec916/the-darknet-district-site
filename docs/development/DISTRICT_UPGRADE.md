# The Darknet District interior: rooms made to look real (16 Nov 2026)

> **Second pass, 16 Nov 2026 (build `2026-11-16-district-2`, branch `claude/district-upgrade-2`, one local commit, not pushed, no PR):** Nyx the bartender has her own model, and seven of the simplest built props are modelled. See "Second pass" at the end. The rest of this page describes the first pass (build `2026-11-16-district-1`, merged as PR #331).

David's request: "the bar, vr play area, anywhere that has old legacy graphic, the dispensary vending machine just has a flat graphic over it. Lets make them look real... The counter in the Store need higher density items." He supplied four reference pictures (oxygen bar, bartender, store, VR play area). They are kept outside the repository and were used as visual direction only. Later the same day he asked for **every poster in the hallway to be taken down** until he supplies new ones, for **anti-WarFlying campaign screens** showing his own lines (two in the hallway, one in the bar, and in the arcade in place of the posters for games that do not exist yet).

This pass changes looks only. No solid, interaction, person, voice, line of dialogue, price, shop item or save field was changed. The Sleeping Pod room, the music player, Milked, the Corporate District, the temple and the other games were not touched. The bartender (Nyx) is unchanged: her look is a later task.

## Where the code is

| File | What it holds |
|---|---|
| `void-runner/district-rooms.js` (new) | `VoidDistrictRooms`. The top is plain data that runs in Node (which goods each machine stocks, the store counter's cases and where every item lies, the bar's measurements and allowed wording). `build(kit)` is the 3D build: `machine()`, `alcove()`, `bar()`, `store()`, `vr()`. It is handed `neochinatown.js`'s own kit (`box`, `cyl`, `mat`, `texture`, `lightPool`...), so everything it makes is merged by material, owned and released with the rest of the interior. |
| `void-runner/neochinatown.js` | The old bar, vending, VR-dressing and counter-glow lines were removed and replaced by calls to the new file. The hallway posters are switched off (below). Nothing else. |
| `void-runner.html`, `static/void-runner.html` | Load `district-rooms.js` just before `neochinatown.js`. |
| `tests/district-rooms.test.cjs` (new, 7 tests) | Goods on the counter are real store products; every item lies inside a case, on the counter, clear of Admin and Iris; the machines are stocked from the pod vending list; the bar keeps to its counter and its allowed wording; the posters are down with their spots kept; the campaign screens carry David's lines word for word, each whole on solid wall with at least half a metre to any doorway or corner; the arcade keeps a poster for every playable game and none for the others. |

**Quality tiers.** Low keeps plain coloured materials, fewer bottles and no wall lining. Medium and above use the District interior kit's physically based metals and concrete (`assets/textures/district-interior/kit_*`: colour, normal map, roughness/metal map) on the walls, counters, cabinets and machine bodies, and add the drawn light pools, light shafts and wall glows the rest of the interior uses. No real lamp was added (the scene's limit of lights is already used).

## What each place is now

### Vending alcove
- **The dispensary machine is a real machine** (it was a flat picture laid over a box): a painted steel body with a kick plate and feet, a glazed product bay with depth, four lit shelves with dividers, **two rows of goods on each** (tubs and jars of flower with lids on black dispenser feet with a lit button, zip pouches), a price strip on every shelf lip, a payment panel (a small display, a keypad, a card reader with a green lamp, a coin slot, a note slot, a coin return, a lock), a delivery hatch with a smoked flap and a tray, a vented top unit and a conduit up the wall.
- **It is always the built machine.** The other two (DRINKS, NEUROHACKERS) are still the licensed Neon Urban Utility machine where that file is present (the live site). Where it is not (a local build), they are now the same built machine with their own stock, not the old box with coloured blocks.
- The goods are the pods' own vending list (`POD_VENDING` in `neochinatown.js`): names, shapes, label colours and prices come from it. Nothing new was named.
- The alcove got a lined back and side walls (Medium and above), a beam, a conduit and a caged lamp.
- Pressing E still does exactly what it did (the same line; nothing is sold).

### The bar is an oxygen bar
- **Counter:** a dark plate front with steel straps and rivets, a worn steel top with an overhang, a brass foot rail on brackets, rubber bar mats, and the pink line now tucked under the lip of the top (it was a glowing bar along the top edge, with an amber one beside it).
- **Oxygen at every seat:** a small regulator post with a gauge, a coiled hose and a clear mask on a hook, at the four stools and on both lounge tables.
- **Behind the bar:** four tall glass tanks of lit, slowly bubbling fluid on steel bases, each with steel hoops, an "O2" mark, a domed cap, a red valve wheel and a brass pipe up to a manifold that runs along the wall with two gauges; two floor racks of spare oxygen cylinders; a brass rail of masks hanging by their hoses.
- **Back bar:** a steel-topped cabinet with doors and handles, three shelves on uprights lit warm from underneath, about 120 bottles in four shapes and six colours of glass with plain labels (shapes only, no names), rows of tumblers and shakers, stem glasses hanging under the first shelf, a brass tap tower with a drip tray.
- **Stools:** a floor plate, a column, a foot ring, a dark leather seat in a chrome band (they were black cylinders).
- **Lounge:** two leather booths with tufted backs, steel tables on pedestals, a lantern, a glass and an oxygen post on each, a pink dome lamp over each.
- **Lamps:** three enamel dome pendants over the counter (pink, as before), two caged brass work lamps over the back bar (warm). The amber strip that ran across the ceiling is gone.
- **Room (Medium and above):** gunmetal and concrete wall lining with pilasters and a dado rail, conduit and junction boxes, three ceiling beams, a round ventilation duct with ring joints, straps and grilles, two pipes.
- **Signs:** see "Wording" below.
- People still stand where `district-life.js` and `dax.js` send them; the bartender prompt is where it was.

### Store counter
- **Four glass display cases stand along the customers' edge of the counter**, with gaps where Admin and Iris face a customer. Each has a steel base and cap, corner posts, clear panes, a cold light strip, a felt floor, a raised middle step and a glass shelf at the back: three tiers of goods and a row of boxed stock under the shelf.
- **143 items and 20 blank price tags** lie in them, in bays of one kind each. They are small versions of goods the store already shows: 16 kinds from the survival range on the wall cases (knives, multi-tools, red-dot sights, flashlights, weapon lights, two-way radios, compasses, power banks, fire starters, lighters, water filters, paracord, tent stakes, filter canisters, fishing-kit tins, tool cards, headlamps) and three from the gun wall (pistols, magazines, ammunition boxes). `ITEMS` in `district-rooms.js` names the store product each one stands for; a test checks the names against `store-atlas.json`. **No new product, no prices.**
- More stock stands on the counter behind the cases (boxes in stacks, steel bottles, radios, ration packs), with a card reader and a tray at each member of staff.
- The model's flat coloured trays were taken off the counter top, and the glowing violet bar along its front edge is now a thin pink line under each case.

### VR play area
The room, both booths, the glass, the players, the terminal and the bench are where they were.
- The **grid of red and cyan tubes across the ceiling is gone**. In its place: beams, a cable tray and conduits.
- Each booth: steel posts, a base channel and a header with clamps and bolts holding the pane; faint coloured light on the glass edges; a dotted rubber play floor with a **thin** boundary and corner brackets (it was a thick glowing rectangle); the booth lamp in a real housing on hangers; **tracking cameras on arms** at the four corners with a lit ring round each lens; slung cables.
- On each booth's back wall: a **wire grid with a headset and two controllers on hooks**, a short lamp above and below, and a floor unit with a lit slot cabled to the wall.
- In the viewing strip: a **rack of three spare headsets** with their controllers and charging docks under a white strip light, and a worn yellow painted line on the floor where the glowing violet line was.
- The two session signs keep their wording.

### Hallway: posters taken down
David asked for all hallway posters to be removed until he supplies new ones (one, by the bar's doorway, hung half off the end of the wall). The four posters were the only ones in the hallway. They are switched off, not deleted:

```js
// void-runner/neochinatown.js
const HALL_POSTER_SPOTS=[[30.5,1],[46,-1],[58,1],[66,-1]],HALL_POSTERS_SHOWN=false;
```

Each entry is `[metres along the hallway, side (1 east, -1 west)]`. To hang posters again set `HALL_POSTERS_SHOWN` to `true`, or give each spot its own picture. Each spot still takes its turn in the advertisement order, so every other screen in the game keeps the advertisement it had. A poster was a single flat panel with no lamp, glow or shadow of its own, so nothing is left behind. The spot by the bar (`30.5`) is centred on the very end of that wall, which is why it overhung the doorway: move it to about `29` before using it again. The arcade's own game posters and the advertisement screens elsewhere were not touched.

### Anti-WarFlying campaign screens (David's own lines)
Five lit panels, 1.2 m wide and 1.8 m high, each in a steel housing 10 cm deep with a bezel, corner bolts, a hood, a status lamp and a conduit up the wall. Each shows the header **ANTI-WARFLYING CAMPAIGN** and one of David's 25 lines at a time, with a struck-through scanner sweep drawn under it (a picture, no words). A line stays five seconds and gives way to the next in a 0.9 second cross-fade. **No voice, no sound.**

| Screen | Wall | Where (District metres) | Clear of the nearest opening or corner |
|---|---|---|---|
| Hallway, south | east wall between the vestibule and the bar's doorway | z 28.2 | 1.5 m from the bar's doorway, 1.5 m from the vestibule |
| Hallway, middle | west wall between the VR room's doorway and the vending alcove | z 44.3 | 1.5 m from the alcove, 2 m from the two residents who stand nearer the entrance |
| Arcade, north wall | where the LASER MOTH poster hung | x -4.4 | 0.5 m from the corner, 0.4 m from the Blackout Protocol poster |
| Arcade, south wall | where the TURBO KELP poster hung (0.5 m further west, clear of the neon triangle) | x -6.5 | 0.9 m from the Corporate Zombies poster, 0.17 m from the neon triangle |
| Bar | north wall, between two pilasters, above the dado rail | x 10 | more than 6 m from the doorway |

None is in the Sleeping Pod room. A test checks that each is whole on its wall with at least half a metre to the wall's end, clear of the solid props, and that no hallway resident stands in front of one.

- **The lines** are `CAMPAIGN.lines` in `district-rooms.js`, in David's order. To add one, add it to the list. `seconds`, `fade` and `screens` are beside it. A test holds a fingerprint of the 25 lines so a later edit cannot reword one unnoticed (update the fingerprint when David adds lines).
- **Cost:** one drawn picture (512 x 768; 256 x 384 on Low) and one material for all five, so they always show the same line; the five screens are one merged mesh. The picture is redrawn only during a cross-fade (about twelve times a second for under a second, once every five seconds) and only while the player is within 16 m of a screen. **Low shows the first line and never redraws.**

**Arcade posters: which stayed and which went.** The arcade had five game posters. A poster stays only if its game can be played (`playable` in the cabinet list):

| Poster | Game playable? | Result |
|---|---|---|
| BLACKOUT PROTOCOL | yes | kept, untouched |
| CORPORATE ZOMBIES | yes | kept, untouched |
| UNDERGROUND//OVERDRIVE | yes | kept, untouched |
| LASER MOTH | no (cabinet not switched on) | removed; a campaign screen hangs there |
| TURBO KELP | no (cabinet not switched on) | removed; a campaign screen hangs there |

All five cabinets, their screens, their name plates and every prompt are unchanged; only the two wall posters went. To put one back when its game exists, see the note beside the posters in `neochinatown.js`.

## Wording on signs

Nothing was invented. Everything shown is either wording the game already had or one of the allowed plain labels.

| Where | Wording | Source |
|---|---|---|
| Bar, name plate (new) | THE DARKNET DISTRICT / OXYGEN LOUNGE | The District's name and the allowed "OXYGEN LOUNGE" |
| Bar, neon over the bottles | O₂ OXYGEN BAR | Already in the game |
| Bar, the two hanging menu screens | OXYGEN MENU and DRINK MENU with their five lines each | Already in the game, unchanged |
| Bar, east wall menu | BAR · LOUNGE and its lines | Already in the game, unchanged (now in a frame) |
| Tanks, gauges | O2 / O₂ | Allowed |
| Vending machines | DRINKS, DISPENSARY, NEUROHACKERS; product names, shelf codes and prices | Already in the game (`POD_VENDING`) |
| Vending display | ENTER CODE; keypad 0-9, A, B | Plain functional label |
| VR session signs | NEON STRIKE..., SKYLINE SOCIAL... | Already in the game, unchanged |
| Campaign screens | ANTI-WARFLYING CAMPAIGN and 25 lines | David's own, word for word |
| Store price tags, bottle labels | blank / shapes only | No wording |

## Performance

Chromium with the software renderer, so these are counts, not frame rates. Before is `main` at build `2026-11-16-outdoor-1`; after is this branch. Each figure is one frame at a fixed viewpoint. People walk about and load at different moments, so the same view differs by several per cent from run to run (the arcade and meeting-room rows, where nothing in view changed, show how much).

| Viewpoint | Low draw calls | Low triangles | Medium draw calls | Medium triangles |
|---|---|---|---|---|
| Bar, from the doorway | 326 → 365 | 630 k → 578 k | 758 → 876 | 1160 k → 1201 k |
| Bar, at the counter | 394 → 444 | 472 k → 589 k | 912 → 1050 | 1125 k → 1224 k |
| Bar, at the tanks | 357 → 408 | 512 k → 606 k | 822 → 958 | 1019 k → 1074 k |
| Bar, the lounge | 42 → 48 | 282 k → 196 k | 118 → 158 | 468 k → 641 k |
| Store, from the doorway | 111 → 152 | 352 k → 347 k | 277 → 377 | 698 k → 738 k |
| Store, at the counter | 158 → 193 | 373 k → 362 k | 366 → 454 | 747 k → 755 k |
| Store, the wall cases | 87 → 111 | 252 k → 280 k | 212 → 280 | 504 k → 588 k |
| VR, from the doorway | 188 → 212 | 224 k → 398 k | 416 → 468 | 540 k → 612 k |
| VR, at a booth | 41 → 52 | 148 k → 165 k | 106 → 134 | 295 k → 348 k |
| VR, from the south end | 71 → 82 | 194 k → 204 k | 170 → 198 | 388 k → 430 k |
| Vending, from the hallway | 73 → 86 | 165 k → 190 k | 180 → 224 | 330 k → 401 k |
| Vending, at the dispensary machine | 48 → 57 | 132 k → 145 k | 118 → 158 | 264 k → 312 k |
| Vending, from the side | 143 → 150 | 159 k → 228 k | 322 → 356 | 504 k → 477 k |
| Hallway, looking down it | 427 → 481 | 640 k → 688 k | 982 → 1110 | 1366 k → 1305 k |
| Arcade, the cabinets (the changed posters are out of this view) | 94 → 101 | 132 k → 239 k | 220 → 236 | 449 k → 403 k |
| Meeting room door (not changed) | 95 → 110 | 251 k → 277 k | 236 → 276 | 502 k → 575 k |

What this pass adds in total, counted in the page (every mesh that uses one of this file's materials):

| | Low | Medium |
|---|---|---|
| Triangles | 50,376 | 76,048 |
| Merged meshes (draw calls when all are in view, before the glow pass) | 84 | 87 |
| Materials | 82 | 82 |
| Drawn textures | 14 | 14 |
| Scene meshes, before → after | 773 → 823 | 841 → 916 |

- The interior merges its fixed pieces by material across the whole building, so these pieces are drawn whenever any of them is in view, which is why views that did not change gained a little too.
- On a local build all three vending machines are the built one. On the live site only the dispensary is, so the live cost is lower by two machines.
- Medium counts every lit piece again for the glow pass, as it does for the rest of the game.
- Leaving and coming back was checked: after leaving the interior no material or texture of this file was left, and the second build made the same number of them.

## What was checked

- `npm test`: 1,005 tests, 1,004 pass. The one failure is the known local-only `tests/vr-companion-models.test.cjs` ("ava: preview missing").
- **Before and after pictures at the same viewpoints, Low and Medium**, looked at one by one against the references: the bar from four places, the store from three, the VR area from three, the vending alcove from three, the hallway from five, the campaign screens from fifteen, plus close views of the tanks, the back bar, the counter, the cases, the headset rack, the wall grid and the keypad.
- **Interactions, by standing where a player can stand, facing the thing and pressing E (all six on Low; the first four on Medium, where the run was stopped to make room for later changes):** the vending machines (same line as before), the bartender (her conversation opens), BROWSE THE SHOP (the outfitter opens), Admin, Iris, the VR terminal (the VR menu opens). The player can still walk to the stools, round the lounge, along the store front, along the VR viewing strip and up to the machines. The solids of the bar, store, VR area and alcove are byte for byte the ones on `main`.
- **The campaign screens:** each of the five was looked at from in front, at an angle and from the nearest doorway on Low, and again on Medium, where the lines were seen changing and one picture caught a cross-fade half way. Nothing reaches into a doorway. The arcade's north and south walls were compared with `main`: the two posters for unbuilt games are gone, the three for playable games are where they were.
- No page errors and no new console errors.
- Found and fixed while looking: the first Medium build broke the hallway's merge (700 extra meshes: the hallway's modules carry vertex colours and the new boxes do not, so the new file uses its own copies of the kit materials); glass made with the engine's older material burned white under the rooms' lamps (all glass here is physically based); the name plate was hidden behind the manifold pipe (moved); the east-wall menu was behind the new wall lining (brought forward); a post stood in the middle of each booth's view (removed); headsets were dark on a dark board (now light grey).

Pictures in `docs/development/district-upgrade/` (about 960 px wide): Low as shown (`bar-wide`, `bar-front`, `bar-o2`, `store-counter`, `vend-disp`, `vr-wide`, and the campaign screens `camp-hall-south-angle`, `camp-arcade-north-front`, `camp-arcade-south-front`, `camp-bar-front`) and Medium **brightened 2.6 times, which is not what a Medium player sees** (`bar-front`, `store-counter`, `vr-wide`, `vend-disp`, `camp-hall-mid-front`).

## Meshy and the Blender bridge

**0 credits spent.** The Blender bridge on David's PC was connected, but nothing was generated: every prop here is built in code, which kept the pass inside one session and added no model files. The pieces that would gain most from a modelled prop are listed below.

## What still looks legacy, or is short of the references

- **Medium is drawn dim.** Outside VR the game multiplies the finished Medium and High picture by 0.3 (an open decision for David, `docs/development/VR_SESSIONS.md`). The rooms were not given their own exposure, so a Medium picture of the bar is much darker than the reference. The sheets include a brightened copy to judge detail; it is not what a Medium player sees.
- **The props are built from boxes and cylinders.** Close up, the store items, the headsets, the masks and the taps are simple shapes. The best candidates for modelled props (Meshy or Blender): the oxygen tank, the bar stool, the VR headset and controller, a pistol and three or four of the store goods. *(Second pass: the tank, stool, oxygen post, headset, pistol, radio and flashlight are modelled on Medium and above.)*
- **The bartender** is the unchanged figure; on Medium she is drawn as a pale stand-in block. Not part of this pass. *(Second pass: she has her own model now. She had never had one; no file was missing.)*
- **Bar:** no window, no wall art, no reflections in the floor; the floor is the building's shared tile. People at the bar do not sit.
- **Store:** the counter itself is the earlier kit model; the staff workstation behind it (a black box and a screen), the storage cage and the wall cases were not touched. The cases on the wall still show goods as lit cards.
- **VR:** the glass has no smears or reflections (David asked earlier for it to be clear); the floor has no reflections.
- **Vending:** on Low the alcove walls are still the plain dark panels.
- **Not touched and still simple:** the arcade's coloured ceiling tubes and cabinets (a deliberate 1980s look; the two cabinets for games not built yet still stand, with their name plates), the meeting room, the room signs over the doorways, the terrace, the Sleeping Pod room (protected).
- **Low** keeps plain walls in the bar and the alcove by design.

## Not verified

- **No real graphics card.** Everything was seen through the software renderer. Glass, the bottle colours under the glow pass and the light pools should be looked at on real hardware. High and Ultra were not run.
- The live site's licensed vending machine was not available here, so the dispensary machine standing between two licensed ones was not seen (same footprint and height as the built ones).
- Multiplayer, a VR headset and a quality change made while standing in a room were not tried.
- The campaign screens' cross-fade was seen in still pictures only, not in motion. The arcade cabinets were not played in the browser in this pass (their code was not touched; their unit tests pass).
- `python3 -m unittest` was not run (nothing in Python changed).

## Second pass (16 Nov 2026): Nyx, and modelled props

David: "The bartender NPC needs upgrading", with his picture of her behind the oxygen bar; and the first pass's own list said the props were simple shapes close up. Looks only, again: no solid, interaction, line, voice, price, shop item or save field changed. The Sleeping Pod room, the music player, the other characters, Milked, the Corporate District and the temple were not touched.

### Nyx

- **Why she was "a pale stand-in block": she never had a model.** Nothing was missing from this machine and no licensed file is involved. `neochinatown.js` asked for a character model called `nyx-district`; no such model was ever made, so the renderer drew its plain box figure (a blank head, facing the bottles). That was true on every machine and on the live site.
- **Now:** her own model, `void-runner/assets/models/crowd/npc-nyx.glb` (4.3 MB), made the way Admin, Iris and the seven residents were made (`MESHY_CHARACTERS.md`): a full-body concept drawn from David's picture, then 3D, remesh, auto-rig, and the game's own clips retargeted. 30,942 triangles, one mesh, one material, 2048 colour map with 1024 normal and roughness maps, 24 joints. Clips: `idle`, `talk`, `walk`, `look`, `watch`, `laugh`, `shrug`, `wipe` (spec: `tools/animation-pipeline/characters/npc-nyx.json`).
- **What she looks like:** a smiling woman with wavy dark hair to the chin and a teal streak on one side, small chrome implants at the temple, a small hoop earring and a pendant, a black work shirt with the sleeves rolled, a worn brown leather bib apron with brass buckles, pens in the chest pocket and a grey bar towel at the belt, dark trousers and black boots, a watch on her left wrist. Adult, fully clothed.
- **Unchanged:** her id (`nyx-district`), name, job, spot (10, 40 behind the counter), the prompt `TALK TO THE BARTENDER`, her one line and its speaker name, her voice entry. `district-people.js` gained `model:'npc-nyx'` on her line and nothing else, which also gives her a profile picture in the V1.
- **Behaviour:** she stands facing the customers and plays `idle`; every quarter to half a minute she looks about or wipes down once; while her line is on screen she plays `talk`, then goes back to `idle`.
- **If her file cannot be loaded** the box figure she had before is shown (never another character), the console says so, and the file is tried again eight times, as for Admin and Iris.

### Modelled props (Medium and above)

Seven models in `void-runner/assets/models/district-props/`, made with Meshy the way the Milked props were (text to image, image to 3D, remesh, textures shrunk to JPEG in headless Blender). `PROPS` at the top of `district-rooms.js` lists each with its size; `prop()` in `build()` loads a file once after the room is up and draws every copy as an instance of the one mesh. **Low never loads them and shows the built props as before. If a file cannot be loaded on Medium, the built prop is built in its place** and the console names the file.

| File | Size | Triangles | Textures | Where | Copies |
|---|---|---|---|---|---|
| `district-o2-tank.glb` | 1.1 MB | 11,471 | 1024 | the four oxygen tanks behind the bar | 4 |
| `district-bar-stool.glb` | 0.7 MB | 6,056 | 1024 | the four stools at the counter | 4 |
| `district-o2-station.glb` | 1.0 MB | 7,165 | 1024 | the oxygen post with gauge, hose and mask at each seat and on both lounge tables | 6 |
| `district-vr-headset.glb` | 0.8 MB | 5,900 | 1024 | the rack of spare headsets and each booth's wall grid | 5 |
| `district-pistol.glb` | 0.4 MB | 3,401 | 512 | the store counter's cases | 6 |
| `district-radio.glb` | 0.4 MB | 3,001 | 512 | the store counter's cases (the store's Two-Way Radios) | 6 |
| `district-flashlight.glb` | 0.3 MB | 2,613 | 512 | the store counter's cases (the store's EDC flashlight) | 3 |

- **The tanks** are shorter than the built ones (1.3 m; the model is a stout cylinder like the tanks in David's picture), so each stands on a steel plinth with a vent and two small lamps; a thin sleeve of rising bubbles moves over the glass, and the fluid glows. The brass pipe up to the manifold is the same. If the model fails, the plinths are removed and the built tank stands on the floor as it did.
- **The goods** keep their places, counts and the store products they stand for (`ITEMS`); the pistols lie on the same felt pads. Nothing was added to the store.
- Still built in code: the VR controllers, the masks on the wall rail, the spare cylinders, the taps and bottles, and the other 17 kinds of goods in the cases.

Prompts (each ended with: single object, centred, plain grey studio background, soft even lighting, photorealistic product render, slightly worn, no text, no lettering, no logos). Batch folder on David's PC: `Documents\DarknetDistrict_Assets\Meshy\district_props\` (`props.json`, `status.json` with every task id, `run.py`, `shrink.py`); Nyx: `...\Meshy\nyx\`.

| Prop | Prompt in short | Meshy task ids (image, 3D, remesh: first 13 characters) |
|---|---|---|
| Oxygen tank | a tall glass cylinder of glowing teal bubbling liquid on a steel pedestal with a small control panel, steel hoops and stay rods, a domed lid, a red valve wheel on a brass stem | `01a1e4ab-b9a5` (the 3D and remesh ids of these six are in `status.json`) |
| Bar stool | a round padded seat in dark oxblood leather with a chrome band, a chrome column with a foot ring, a round floor plate | `01a1e4ab-b97d` |
| Oxygen station | a chrome base, a brass post, a regulator with a dial gauge and a knob, a hook with a clear breathing mask, a coiled hose | `01a1e4ab-b9ff` |
| VR headset | a light grey shell, a glossy black visor with tracking lenses, a foam face cushion, a head strap with a rear cradle | `01a1e4ab-b9ef` |
| Pistol | a full-size service pistol, black polymer frame, dark steel slide, accessory rail, no markings | `01a1e4ab-b9c8` |
| Radio | a rugged handheld two-way radio, black with orange grips, a short antenna, a small display, a speaker grille | `01a1e4ab-b988` |
| Flashlight | a compact black knurled aluminium flashlight with a crenellated bezel, a clip and a tail switch | `01a1e4ae-a01c` (second picture; the first, `01a1e4ab-b979`, came with a room behind it and was not used), 3D `01a1e4b2-1dea`, remesh `01a1e4b3-890a` |

### Meshy credits

**366 spent of the 400 allowed** (the account showed 1,767 before and 1,401 after; nothing was bought and no plan was changed).

| What | Credits |
|---|---|
| Nyx: concept 9, 3D 30, remesh 5, rig 5 | 49 |
| Six props at 44 (picture 9, 3D 30, remesh 5) | 264 |
| Flashlight (two pictures) | 53 |
| **Total** | **366** |

David's picture of Nyx was the only reference sent to Meshy. No licensed or purchased model, and no photograph of a real person, was sent to any AI tool.

### Cost in the game (software renderer: counts, one frame each, people move between runs)

| Viewpoint | Low draw calls | Low triangles | Medium draw calls | Medium triangles |
|---|---|---|---|---|
| Nyx, from the stools | 421 → 411 | 437 k → 513 k | 990 → 982 | 916 k → 863 k |
| Nyx, close | 404 → 399 | 389 k → 419 k | 936 → 936 | 1008 k → 1025 k |
| Bar, at the counter | 438 → 428 | 533 k → 609 k | 1036 → 1058 | 1203 k → 1295 k |
| Bar, from the doorway | 361 → 351 | 615 k → 691 k | 854 → 888 | 1177 k → 1511 k |
| Bar, at the tanks | 328 → 329 | 336 k → 382 k | 762 → 808 | 704 k → 936 k |
| Bar, along the stools | 143 → 126 | 433 k → 323 k | 378 → 382 | 916 k → 949 k |
| Bar, an oxygen post | 136 → 125 | 340 k → 370 k | 360 → 368 | 637 k → 894 k |
| VR, the headset rack | 94 → 94 | 142 k → 142 k | 234 → 232 | 303 k → 323 k |
| VR, a booth wall grid | 27 → 27 | 132 k → 132 k | 80 → 78 | 316 k → 313 k |
| Store, at the counter | 193 → 193 | 362 k → 362 k | 462 → 478 | 816 k → 994 k |
| Store, a case close up | 260 → 260 | 432 k → 432 k | 612 → 622 | 699 k → 735 k |
| Store, the pistol case | 273 → 266 | 450 k → 439 k | 635 → 651 | 524 k → 723 k |

- Low is the same or a little lighter: the props are the built ones, and Nyx is one mesh where the box figure was about twenty.
- Medium: about the same number of draw calls (within 50 of before at every viewpoint) (each model is one mesh and one material however many copies there are; the built pieces they replace were already merged), and more triangles where the models are in view: the 34 copies come to about 189,000 triangles when all are on screen, and Nyx is 31,000. The scene's mesh count rises by about 82 because every instance is counted as a mesh.
- Download on Medium and above: 4.7 MB of props, loaded after the room is up; Nyx 4.3 MB on every quality.
- Leaving and coming back: checked on Medium. On the street afterwards nothing of the props or of Nyx was left (0 prop nodes, 0 prop meshes, 0 of her nodes, 0 of this file's materials and textures). Back inside they were built again (the count was taken 25 seconds after re-entering, on the software renderer, with 30 of the 34 copies in so far).

### What was checked (Chromium, software renderer)

- `npm test`: 1,007 tests, 1,006 pass. The one failure is the known local-only `tests/vr-companion-models.test.cjs` ("ava: preview missing"). Two tests were added to `tests/district-rooms.test.cjs` (the props' files, sizes and fallbacks; Nyx's model, clips, place and unchanged line).
- **Nyx, Low and Medium:** looked at from the front, three-quarter, close on the face, from the side and from behind the bar, and in each of her clips (idle, talk, look, wipe, laugh, shrug, watch). She stands on the floor (her lowest point is at floor height, her head at 1.68 m), between the counter and the back bar without touching either, arms down, never in the A-pose. The box figure is switched off while she is shown.
- **Talking to her, Low and Medium:** standing where a player can stand, the prompt reads `[E] TALK TO THE BARTENDER`; E opens her line under the name `Bartender` as before; she plays `talk` while it is up and `idle` after it closes.
- **Name tag:** the V1 camera tags her `Nyx` / `Bartender` and offers to follow her.
- **Each prop in place** on Medium (brightened copies) and the built props on Low, before and after at the same viewpoints.
- **Missing files (Medium, the files for Nyx, the tank and the pistol made to return "not found"):** Nyx's box figure stood in her place, the built tanks stood on the floor with the plinths gone, the built pistols lay in the cases, the other five models loaded, and there were no page errors.
- No page errors. The console's "failed to load" lines are the same kinds the build before this pass prints here (the blocked network and files this machine does not have), plus the deliberate ones in the missing-file run.
- Found and fixed while looking: the oxygen post was too large and too bright; the tanks glowed teal all over; the radios were washed out.

Pictures in `docs/development/district-upgrade/`: `nyx-front-low`, `nyx-face-low`, `nyx-three-quarter-medium-brightened`, and `props-*-medium-brightened` (tanks, oxygen station and stools, store pistols, store radios and flashlights, VR headsets). Sheets (outside the repository, in the session's scratch folder, so they will not last): Nyx `/tmp/claude-0/-home-user/f1e045d6-9633-5130-9900-d479eb4e0111/scratchpad/district-up2/SHEET-NYX.jpg`; props `/tmp/claude-0/-home-user/f1e045d6-9633-5130-9900-d479eb4e0111/scratchpad/district-up2/SHEET-PROPS.jpg`. Medium pictures on the sheets are brightened 2.6 times and say so.

### Still legacy after the second pass

- **Nyx stands; she does not serve.** She has no pouring or serving routine and does not walk the bar. Her face is lit like the other residents' (the edge light every character gets), so on Medium, which is drawn dim, she is dark against the lit bottles.
- **Her hands have no finger joints** (Meshy's skeleton has none), like the other Meshy residents. Her implants and the emblem on the apron are painted on, not modelled.
- The tank's glass and the mask are solid painted surfaces, not see-through; the moving bubbles are a sleeve over the glass.
- Everything in "What still looks legacy" above that is not a tank, stool, oxygen post, headset, pistol, radio or flashlight is as it was: the bottles, taps, controllers, the other goods, the staff workstation, the wall cases, the floors, the Medium dimming.
