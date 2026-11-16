# MILKED

> **Rebuilt on 16 Nov 2026 (third pass, build `2026-11-16-milked-3`, branch `claude/milked-aaa`)** after David's two reference sheets (one exterior picture, one six-panel interior sheet) and his request: "Since Milked is going to have a security vestibule it can have a loading screen that functions like the one at The Darknet District with Milked styling and be more detail inside. Make it AAA standard". The inside of Milked is now **its own environment behind a loading card**, like The Darknet District. The building's place, size and rooms are those of the second pass earlier the same day (PR #326); "What changed in this pass" lists the differences.

A **small adult livestreaming production studio** on a quiet side street off Main Street in NeoChinatown. It makes live broadcasts and nothing else. Members watch from home; whatever else the service involves happens privately at the member's own address. **Nothing is collected and no procedure of any kind happens in this building.** It is not a nightclub, hospital, laboratory or public venue: no bar, no dance floor, no audience.

Code:

| File | What it holds |
|---|---|
| `void-runner/milked.js` | Data only (runs in Node, unit-tested): names, rooms, walls, furniture, the five doors, the two checkpoints, interactions, map places, the inactive mission, `layout()` for the interior. |
| `void-runner/milked-build.js` | The 3D build. `VoidMilked.create()` is the street side (shopfront, alley back, vestibule, rear lobby). `VoidMilked.build()` is the interior. Both use one shared kit, and the vestibule and rear lobby are made by the same code in both. |
| `void-runner/milked-transition.js` | The two checkpoints and the loading card (`VoidMilkedGate`). |
| `void-runner/milked-integration.js` | Registers the interior as a place and the interaction handlers. |
| Small hooks | `babylon-renderer.js` (builds the interior when the place is `milked`), `neochinatown.js` (street keeps only the check-in reader), `taxi-rules.js`, `city-taxi.js`, `road-taxi.js` (no cab indoors), `personal-device.js` (explored-map grid). |

Status: **built, provisional.** All dialogue and on-screen wording is placeholder text, not approved canon.

## Content rules (enforced in the build)

Every performer is an adult. Everyone is clothed and nothing shown is explicit. Each studio has exactly one dancer and nobody else; the cameras are on stands and are run remotely from Fish's office, so there are no camera operators. The player watches through soundproof windows from the hallway and never enters a studio. Screens that show a "stream" draw a clothed silhouette, not a camera picture. Posters and pinned photographs are abstract shapes and text: no people, no real brands.

## The loading transition (new)

It works the way The Darknet District's security vestibule does (`docs/development/VESTIBULE_CHECKPOINT.md`), in both directions, at **two** places:

| Checkpoint | Room | Outer door | Inner doors |
|---|---|---|---|
| Front | Security vestibule `[79.75, 83.75, -77, -74]` on the side street | `milked-door` (double, brushed metal) | `milked-inner-door` (double, glass) |
| Rear | Rear lobby `[93.5, 96, -90, -87.4]` on the service alley | `milked-rear-door` (steel) | `milked-lobby-north` (to the staff corridor), `milked-lobby-west` (to the rear corridor) |

What the player experiences:

1. Walk up to the door. It slides open by itself.
2. Walk in. Nothing happens until the middle of the room is reached.
3. In the middle, every door closes. The player can still move; stepping back out calls it off.
4. When the door sensors report **every door shut and solid**, the loading card covers the view. Only now is the other environment loaded (the old one is released first, so only one is ever loaded).
5. The card clears with the player in the same spot, facing the same way.
6. The far door opens. The door behind stays shut.

Rules and how they are enforced:

| Rule | How |
|---|---|
| Loading only in the middle | `GATES.front.centre`, `GATES.rear.centre` in `milked.js`: clear of every doorway by at least 0.72 m, so the player never holds a door open. |
| Loading only with the doors shut | `doors.closed()`: every leaf fully shut and its collision box in place. The sequence waits on this, not on a timer. |
| An outer and an inner door are never open together | On the street only the two outer doors can open; in the interior only the three inner ones (`VoidMilked.openable`). Doors built during a transfer start sealed. |
| Nobody is trapped | Doors that stop moving for 9 seconds, a failed load or any error end in RECOVERY: the player is put back and the door they came through is released. |
| No immediate return trip | After a transfer the player must leave the room before the checkpoint arms again. A player who appears in the room (a place that has just loaded) has not walked in. |
| No fake progress | The card's four lines change when the real steps happen. No percentage, no timed bar. |

**The loading card** is Milked's own, not the District's scan: a still of the vestibule (or lobby) in the direction the player faces, dimmed, under the pink MILKED logo with its three white droplets, a pink light bar top and bottom, a slow green line, and a small card with four steps (for example STREET DOORS SEALED, CHECKING YOU IN, WARMING UP THE STUDIOS, INNER DOORS OPENING). If the still cannot be taken, a painted pink and green backdrop shows instead. The wording differs for the front and the rear and for in and out (`TEXT` in `milked-transition.js`).

**Doors** (`VoidBabylon.zone.doors` inside, `VoidNeoChinatown.city.live.get('milked').doors` on the street): `secure(on)`, `closed()`, `openness()`, `release(id)`, `state()`. A door never closes on someone standing in the doorway. Each door has a collision box whenever it is less than 80% open, so closed doors are solid.

**States** (`VoidMilkedGate.state`, `.history`, `.sealed`, `.gate`): `IDLE`, `ENTRY_DOOR_OPEN`, `ENTRY_DOOR_CLOSING`, `SECURED`, `CHECK_IN`, `DESTINATION_LOADING`, `DESTINATION_READY`, `EXIT_DOOR_OPEN`, `COMPLETE`, `RECOVERY`.

### Saves: a game saved inside Milked resumes outside it (the safer choice)

The interior is **not a save location** and writes nothing to the save: no flag, no location id, nothing in `save-manifest.json`. Every login already wakes in the player's Sleeping Pod, and anything else that re-enters NeoChinatown (back from a VR simulation, a sky cab, a retry) uses the street. This was chosen over "resume inside" because it needs no new save field, no server validator change and no migration, and a player can never be restored into a room whose doors are sealed. A test checks that no Milked file touches the save.

### What keeps working, and why

The interior keeps **NeoChinatown's id and the same world coordinates** (its place record has `id: 'neochinatown'`, `area: 'milked'`), so:

- **V1 Map:** unchanged. The player's marker, the building, the two streets, the five places and the taxi stop are where they were. The older "explored areas" picture charts the inside on the street's own grid (a small fix in `personal-device.js`: without it the explored-street map would have been replaced by a smaller one).
- **Music and ambience:** the `milked` zone is the same footprint; it plays inside as before.
- **Camera place label:** `device-camera.js` `areaNow()` and `device-gallery.js` still say "Milked".
- **Multiplayer presence:** the interior stays in the street's room (`neochinatown-street`), as it was when Milked was part of the street scene, so friends inside see each other. Not tested with two players (see "Not verified").
- **Taxis:** the sky-cab stop on Main Street and the road taxis are unchanged. Inside, a cab cannot be called ("Taxis can't land inside Milked. Step out to the street first.").
- **The District's own checkpoint, street life, traffic:** they run only in their own environments and ignore this one.

## Where it is (world metres, x east, z north)

| Piece | Rectangle `[x0, x1, z0, z1]` | Notes |
|---|---|---|
| Building `FOOTPRINT` | `[78, 98, -90, -74]` | 20 m wide, 16 m deep. Front wall z -74, back wall z -90. Unchanged. |
| Side street `LANE` | `[71, 101, -74, -68.5]` | A dead end off the east side of Main Street. The shopfront stands 0.4 m proud of the old wall (two solid strips), so the doors sit in a recess. |
| Service alley `ALLEY` | `[71, 98.5, -93.5, -90]` | Along the back wall, and back out to Main Street. |
| Front doors `DOOR` | x 81.75, z -74, 2 m wide | |
| Inner doors `INNER` | x 81.75, z -77, 2 m wide | The vestibule is now 3 m deep (it was 2.6). |
| Rear door `REAR` | x 94.75, z -90, 1.4 m wide | |
| Sky-cab stop `TAXI` | `(61, -82)` on Main Street | Unchanged. |

## Layout

```
                 side street (z -68.5 .. -74)
   78        81.75          85.5        89.5        93.5          98
-74 +--pier----[==]---pier----+-----------+-----------+------------+
    |      | vestibule |      |           |           |            |
    |bamboo+----[==]---+bench |  STUDIO 1 |  STUDIO 2 |   FISH'S   |
    |s                        |   (pink)  |  (green)  |   OFFICE   |
    |h       RECEPTION        |           |           |            |
    |e     [ desk / Eva ]     +--window-d-+--window-d-+---[door]---+ -79.6
    |l  MILKED sign    CCTV  door     STUDIO HALLWAY (2 m)   door  |  restroom
-82.8 +-----------+-----------+-d-window--+-d-window--+  staff     +--- -81
    | DRESSING A  | DRESSING B|  STUDIO 3 |  STUDIO 4 |  corridor  |  restroom
    |  (open)     | (closed)  |  (mixed)  |  (mixed)  |  lockers   |
-88 +---[door]----+--[door]---+--[door]---+--[door]---+----[==]----+--- -87.4
    | cases   cart    REAR CORRIDOR (2 m)            [=]  REAR     |
-90 +------------------------------------------------+--LOBBY-[==]-+
                 service alley (z -90 .. -93.5)             94.75
```

What each space has (the parts in **bold** follow the reference sheets):

- **Street front:** stained concrete piers (the District interior kit's concrete texture), a **wide dark fascia with MILKED in pink neon and the three white droplets, a thin green line along its top edge**, a **recess with tall brushed-metal double doors (arrow marks at the seam), a green-lit sensor bar, two warm downlights in the soffit, a thin pink strip up each side and a steel tread grate**, a **card reader with a green light on the right-hand pier**, **vent grilles low and mid-height**, **pipes, conduit and an air-conditioning unit above**, a **potted bamboo**, pink, green and warm pools of light on the pavement. Beside it the old building in brick with a **roast-duck restaurant window under a red awning**, a shutter and a service door; above, **apartment windows (two warm-lit, with curtains and plants) and planters**. On the corner building to the west: **red lanterns over the street and green neon** around a dark passage, which is a painting on the wall, not a real alley.
- **Security vestibule:** **two sets of double doors (the inner pair glass in dark metal frames, each leaf with a small pink MILKED logo and a hazard-striped band at waist height)**, the **wall sign on the left (MILKED, VISITOR CHECK-IN 访客登记, STAFF ONLY BEYOND 仅限员工)**, the **card reader on the right with a green glow**, a **dome camera in the ceiling corner**, a **pink light bar overhead**, a **ribbed rubber mat**, **thin pink strips at the floor edges**. The street doors are metal with a narrow vision panel in each; the rainy street in those panels is painted.
- **Reception:** the **dark desk with MILKED and the droplets in pink neon on its front and a pink glow under it**, the **larger pink logo on the dark wall behind**, Eva behind the desk, **a monitor, the acrylic stand reading OFFICIAL CREATORS CHECK-IN with a code, a desk bell, the lucky cat, an orchid, pens**, **shelves with ring binders and trailing pothos**, security monitors, a bench, bamboo, pinned photographs, posters, a duct, pipes and a cable tray on the ceiling. The door beside the desk (small logo, STUDIOS 直播间) leads to the hallway.
- **Studio hallway:** **long and narrow, large windows in dark metal frames each with a pink logo, green tube lights in a row, a duct, pipes and a cable tray, pink and green strips along the floor edges and under the sills, a grated metal floor, posters**, ON AIR signs over the studio doors, and at the far end **STAFF ONLY 仅限员工 with a lit EXIT 出口 sign**.
- **Four studios** (seen through the windows): each has a **quilted feature wall with MILKED in pink neon, pink and green tube lights, a wooden floor with a pink glow at the wall base, one dancer, a camera on a tripod in the foreground with a small live-view screen, two ring lights, a softbox, bamboo, a paper floor lantern, a shelf of plush toys (with a shark), a grey curtain down one side**, a wall monitor, and its own extra (a chaise, more plants, old monitors and a chequered floor, mirror panels and a barre).
- **Fish's office:** the **plate by her door (MILKED, FISH 小鱼, OPERATIONS, BROADCAST, SCHEDULING)**, a **four-screen monitor wall showing the studio feeds, a side panel listing LIVE / SCHEDULE / CREATORS / REMOTE / ARCHIVE, a wide monitor with the schedule timeline, a second screen**, the remote camera controls, a **mesh chair with a pink-trimmed jacket over its back, a desk lamp, a mug, a keyboard, pens, pinned photographs and notes, shelves of archive boxes with a shark plush, plants, a flight case**, a couch.
- **Staff corridor:** lockers, a notice board, two restroom doors with a pink **RESTROOM 洗手间 sign and the usual figures**.
- **Rear corridor:** **dark doors with pink logos, DRESSING ROOM signs with a hanger, pinned photographs and posters, a laundry cart, floor drains, green tube lights and pipes, a lit EXIT 出口 sign** over the door to the rear lobby, flight cases. Dressing room A is open (mirror with bulbs, counter, stools, clothes rail, bench); B is closed.
- **Rear lobby:** concrete, a green tube, a floor drain, a fire point, a mop bucket, the steel alley door with a hazard band and EXIT 出口 over it.
- **Service alley:** the staff door with a caged green lamp, the staff and deliveries plate, a dumpster and crates (solid), AC units, pipes.

### How the look is made

- **Surfaces** are the repository's own texture sets with normal maps: the District interior kit (`assets/textures/district-interior/`: gunmetal with scratches and rust blooms for the walls, concrete, steel, oxidised metal), the street set (`assets/textures/ncz/`: mouldy concrete for the wet floor, brick, corrugated sheet) and the companion suite's wood and fabric. Three surfaces are painted in code (rubber matting, the floor grating, the quilted wall).
- **Light:** inside, a low sky light, a little haze, four room lamps (reception, hallway, office, rear corridor), one small lamp on each of the six people, and everything else emissive (neon, tubes, screens, soft pools on the floor). That is twelve lights in the scene, the project's limit. Low quality has no lamps and no normal maps.
- **Draw calls:** static pieces are merged by material, as before. Signs and screens are one small drawn texture each.
- **Low quality:** no Meshy models (simple stand-ins built in code), no lamps, no normal maps, fewer glow pools.

## Props made with Meshy (16 Nov 2026)

Ten props, made on David's PC through the Blender bridge with his Meshy account, the same way as the companion suite's furniture: text to image (nano-banana-pro), image to 3D, remesh to about 14,000 triangles, then textures shrunk to 1024 px JPEG in headless Blender. **44 credits each, 440 credits in total** (the whole budget David gave). Batch folder on his PC: `C:\Users\smart\Documents\DarknetDistrict_Assets\Meshy\milked_props\` (`props.json` has the prompts, `status.json` the task ids, `run.py`, `shrink.py`).

| File in `void-runner/assets/models/milked/` | Size | Used | Meshy task ids (image, 3D, remesh: last 12 characters) |
|---|---|---|---|
| `milked-camera-tripod.glb` | 1.5 MB | one in each studio | `55c677b43042`, `687a3270be5f`, `f4d0fe08f2a5` |
| `milked-ring-light.glb` | 1.2 MB | two in each studio | `2e0fe66a8887`, `306bb4f93818`, `e62c0243cec2` |
| `milked-softbox.glb` | 1.4 MB | one in each studio | `dcf894a0e98b`, `654326b97fab`, `d3a85bad21b8` |
| `milked-office-chair.glb` | 1.3 MB | Fish's office | `bd1d0b6b1b1c`, `66ec862af279`, `c692733bf40b` |
| `milked-bamboo.glb` | 1.4 MB | the shopfront, reception, every studio, the office | `52aa65be1429`, `c8d8df89081f`, `41fc04ae92a3` |
| `milked-pothos.glb` | 1.6 MB | reception shelves, studio 2, the office | `9c5b1d5dab2f`, `e291a47c9826`, `449f3e164d0a` |
| `milked-lucky-cat.glb` | 1.3 MB | the reception desk | `07b67c2221d2`, `c70682df3984`, `21bc069dcbd6` |
| `milked-shark-plush.glb` | 1.1 MB | each studio's shelf, the office shelf | `5c70070490e9`, `2838491826eb`, `07c6086e2a7d` |
| `milked-laundry-cart.glb` | 1.5 MB | the rear corridor | `89c368cc09be`, `17af8c06e646`, `5d565099fe6b` |
| `milked-flight-case.glb` | 1.3 MB | the office, the rear corridor | `3e1e8bfed06e`, `3af832a4b278`, `fa3590fb7576` |

They are optional files, loaded after the room is up (`prop()` in `milked-build.js`), sized by height and stood on the floor, so a regenerated model drops in without new numbers. If one is missing, a simple stand-in built in code takes its place. All four that need to face something (camera, ring light, softbox, chair) come in facing the right way. Built in code, not Meshy: the paper lantern, the desk bell, the acrylic stand, the orchid, the plush toys other than the shark. Licence row: `docs/VOID_RUNNER_ASSET_LICENSES.md`.

## Characters (provisional)

| Id | Display name | Where | Model |
|---|---|---|---|
| `milked-eva` | Eva (`CONFIG.EVA_NAME`) | Standing behind the reception desk | placeholder crowd look `ncz-neon` |
| `milked-fish` | Fish (`CONFIG.FISH_NAME`) | At the desk in her office | her own model `npc-fish` |
| `milked-dancer-1` to `-4` | (no names) | One in each studio | `district-resident`, `vr-companion-f`, `vr-companion-m`, `vr-player-b` |

Nobody else is in the building. Eva is **not** the VR companion Eva. The dancers play a loop from the shared animation library when it is installed (`ac-sensual-dance-3`, `ac-sensual-movement-1`, `ac-stand-curve-2`, `ac-stand-curve-3`); without it each plays its own dance (`dance`, `slow-dance`, `dance-samba`, `dance`). If a dancer's model is missing after 25 seconds a spare clothed figure takes the spot. The interior loads these six figures itself (the shared look loader was not reliable after a change of scene).

Replacement points are at the top of `void-runner/milked.js` (`==== WHERE TO CHANGE THINGS ====`): Fish's name, Eva's and Fish's models, the dancers, the dialogue. Voices are still the provisional blends in `tools/audio/npc-voice-registry.json`; nothing was generated.

## Mission 3 (inactive data)

`MISSION` in `milked.js` is untouched: `active: false`, nothing registers or starts it.

## What changed in this pass

- The inside moved out of the street scene into its own environment; the street builds the shell, the vestibule and the rear lobby only.
- New: the rear lobby (three doors), door collision for all five doors, the two checkpoints, the loading card.
- The vestibule is 3 m deep (was 2.6); the staff corridor ends at the lobby's north door (z -87.4); the lockers moved 0.6 m north; a flight case stands in the office; a laundry cart in the rear corridor; shelves along reception's west wall; the shopfront piers and the bamboo are solid.
- The street keeps one interaction (the check-in reader, in the vestibule); the other ten are inside.
- Everything visible was rebuilt with textured surfaces, signage, ceiling services, props and people's lamps. The neon outlines around the hallway windows, the floor inlay lines and the glowing pads under Eva and Fish are gone.

## Tests

- `tests/milked.test.cjs` (17 tests): the concept, nothing clinical, ids, the configurable name, the footprint and streets, the vestibule built by one function on both sides, taxi, map, the inactive mission, rooms, one dancer per studio with real clips and the library fallback, the logo, reachability inside (inner doors open, outer shut, nobody gets out through a wall) and outside (the street reaches the two checkpoints and nothing further), no save fields, a handler for every interaction.
- `tests/milked-transition.test.cjs` (10 tests): the two checkpoints and their middles, which environment opens which door, the interior as a place that is never a save location, and the sequence with fake doors (order of sealing, card, load and release; both gates; re-arming; refusals; turning back; stuck doors; a failed load; the card being Milked's own).
- `tests/milked-browser.cjs`: the real-browser walk-through, rewritten for the transition (below).
- Updated: `district-areas`, `environment-seam`, `neochinatown-layout`, `city-taxi` (counts and where Milked is reached on the street).

## What was checked (16 Nov 2026, Chromium with the software renderer)

- `npm test`: 988 tests, 987 pass. The one failure is the known local-only `tests/vr-companion-models.test.cjs` ("ava: preview missing").
- `tests/milked-browser.cjs low` passes with no page errors. The player is **walked in small steps that stop at anything solid**: side street, street doors (they open as the player comes up), vestibule, the inner doors refuse from the street, the exchange behind the card, the same spot afterwards, the street doors refuse from inside, reception, Eva (talks under her own name), the desk is solid, the door beside the desk, the hallway, a studio window and a studio door are solid, six people and exactly one dancing in each studio, the staff door, Fish (talks under her own name), the camera controls, a restroom door is solid, the staff corridor, the map, no cab indoors, the rear lobby, the exchange out, the lobby's north door refuses from the street side, the alley door, the service alley to Main Street, in again by the front, out again by the front, in by the rear, the lobby's west door, round the laundry cart (solid), the rear corridor, dressing room A, dressing room B is solid. **On every frame watched (770 in the last run)** the card was only up with every door shut, and an outer and an inner door were never open together. Nothing but the map's explored bits changed in the save.
- Looked at on Medium (brightened copies, because the game outside VR is drawn dim on Medium: `docs/development/VR_SESSIONS.md`) and on Low: the shopfront from both ends of the street, the entrance, the neighbours, the alley back, the loading card, the vestibule in both directions with the doors shut, the sign and the reader, reception from four angles, the hallway both ways, each studio through its window, the office from four angles, the staff corridor, the rear corridor both ways, dressing room A, the rear lobby. All ten Meshy models loaded (38 placements); each one that has a front was photographed from two sides to confirm which way it faces.
- Problems found and fixed while looking: the rear corridor's north wall was not being built (the studios' back walls showed through); the explored-street map was being replaced by a smaller one while inside; the dancers never arrived on Low after a change of scene (the shared look loader remembers a dropped download as done); a mullion stood in front of each dancer; the mirrors were light grey slabs; the office flight case blocked the doorway; the Low stand-in plants looked like fir trees; Eva stood too far behind her desk.

Pictures in `docs/development/milked/` (ten, Medium quality, about 900 px wide; "brightened" in the name means a brightened copy, because Medium is drawn dim outside VR): `01-shopfront-on-the-side-street`, `02-entrance-and-neighbours`, `03-loading-card` (as shown), `04-vestibule-inner-doors`, `05-vestibule-street-doors`, `06-reception`, `07-studio-hallway`, `08-four-studios`, `09-fish-office`, `10-rear-corridor`.

## What still differs from the reference sheets

- **Eva** stands; in the picture she sits, leaning on one hand, with dark hair and a black jacket with pink trim. She is still the placeholder figure (green hair) and that figure has no seated clip.
- **The dancers** are the repository's clothed figures, not the picture's outfit (cropped black and pink jacket, pleated skirt, tights, platform boots).
- **Outer doors:** the exterior picture shows metal doors and the vestibule picture shows glass ones with the street visible. They are metal with a narrow vision panel each; the street seen in the panels is a painting, because the street is not loaded while the player is inside. For the same reason the reception seen through the inner glass from the street side is a blurred painting until the exchange.
- **Reception is mirrored:** the shelves are on the right and the door on the left as you come in (the picture has them the other way round), because the studios are east of reception. The door leads to the studio hallway and says STUDIOS; STAFF ONLY is on the door at the hallway's far end. The desk front is upright, not angled.
- **The hallway** has windows on both sides (two studios each side); the picture has one row on the left and posters on the right. Only two posters fit between the doors and windows.
- **The rear exit** is a small lobby with a second door, so that the exchange can happen with every door shut; the picture shows one door standing open onto the alley. The restroom doors are round the corner in the staff corridor, not in the rear corridor.
- **The "narrow alley on the right"** of the shopfront is painted on the corner building's wall (green neon, lanterns); the lanterns over the street are real. No alley was cut: the tests forbid cutting that block.
- **No rain** falls in the side street beyond the city's own weather, and the pavement's "wet" look is pools of coloured light, not reflections.
- **Materials are textured and normal-mapped but not PBR**, and there are no real-time shadows or reflections inside. It is much richer than before and it is still short of the art direction's AAA standard; it remains an upgrade candidate for a Blender-built kit.
- The orchid, the lantern, the desk bell and most plush toys are simple shapes.

## What is not done or not verified

- **Not pushed, no PR, not merged.** One local commit on `claude/milked-aaa`.
- Dialogue, the card's wording and the signs' wording are provisional and need David's approval. Voices are not generated.
- **No real-GPU check.** Everything was run with the software renderer; door timing and loading are faster on real hardware. No Firefox, no VR headset. High quality was not run.
- **Multiplayer was not tested with two players.** The interior shares the street's room on purpose; a player on the street and a player inside are at the same coordinates on opposite sides of a wall and should not see each other, but name tags through walls were not checked.
- The full Medium run of `tests/milked-browser.cjs` was not completed (it takes very long on the software renderer); Medium was checked with the photo tour instead, which uses the real front checkpoint.
- A quality change made while standing inside, and a real sky-cab flight to the stop, were not exercised.
- The shared look loader's fault (`character-assembler.js` `ensureLook` remembers a download dropped by a scene change as done) was worked round here, not fixed there; other places that use it may show the same thing.
- The Meshy models' licence wording is for David to confirm (same question as the earlier Meshy models).
- Older documents that describe the first two versions were left as history.
