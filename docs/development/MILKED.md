# MILKED

> **Studio 1 rotation, 18 Nov 2026:** Same UTC 12-hour shift as the Avenue, opposite location. 00:00–11:59 UTC: Reverie on the street, Lace in Studio 1. 12:00–23:59 UTC: Lace on the street, Reverie in Studio 1. Studio 1 switches its single model at the shift boundary; the street's 90-second arrival gap does not apply indoors. Reverie is a static seated mesh pending rigging; Lace has neutral clips, not a dance. Studio 1 never substitutes another NPC. Studios 2–4 retain existing dance animations. No save changes.


> **Moved, build `2026-11-16-far-south-1` (16 Nov 2026):** The owner: "I want Milked moved to the next area. Nothing changed on the exterior or interior of Milked, just moved." The whole building (street shell, side street, service alley, vestibule, rear lobby and the interior environment) was carried by ONE rigid translation, `OFFSET=[0,-100]` in `milked.js`: same side of Main Street, same offsets, same doors, no mirror or turn. It now stands in the **Far South** quarter, past the South Gate. Every number in the tables below is in the building's own frame; add 100 m south (z minus 100) for where it stands. `milked.js` exports world metres and `LOCAL` (the building's own frame, used by `milked-build.js`, which draws under a node moved by `OFFSET` so no number inside the build changed). The taxi stop "Milked corner" is now at (61, -182) in Far South. A pointer blade sign (existing logo, an arrow, the words SOUTH GATE) hangs on Main Street's east wall in Old Town at z -68 and z -118.3.

> **Update, build `2026-11-16-quarters-1`:** Milked is in the Old Town quarter; nothing inside it changed. The sky cab that set down on Main Street is gone; the road-taxi stop there is "Milked corner". See [`NEOCHINATOWN_QUARTERS.md`](NEOCHINATOWN_QUARTERS.md).

> **Surfaces and light, 16 Nov 2026 (fourth pass, build `2026-11-16-milked-4`, branch `claude/milked-surfaces`, one local commit, not pushed):** the layout, the props and the loading transition are those of the third pass; this pass changed how the surfaces are made and lit. See "Surfaces and light (fourth pass)" below.
>
> **Rebuilt on 16 Nov 2026 (third pass, build `2026-11-16-milked-3`, branch `claude/milked-aaa`)** after the owner's two reference sheets (one exterior picture, one six-panel interior sheet) and his request: "Since Milked is going to have a security vestibule it can have a loading screen that functions like the one at The Darknet District with Milked styling and be more detail inside. Make it AAA standard". The inside of Milked is now **its own environment behind a loading card**, like The Darknet District. The building's place, size and rooms are those of the second pass earlier the same day (PR #326); "What changed in this pass" lists the differences.

A **small livestreaming production studio** on a quiet side street off Main Street in NeoChinatown. It makes live broadcasts and nothing else. Members watch from home; whatever else the service involves happens privately at the member's own address. **Nothing is collected and no procedure of any kind happens in this building.** It is not a nightclub, hospital, laboratory or public venue: no bar, no dance floor, no audience.

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

Each studio has exactly one dancer and nobody else; the cameras are on stands and are run remotely from Fish's office, so there are no camera operators. The player watches through soundproof windows from the hallway and never enters a studio. Screens that show a "stream" draw a clothed silhouette, not a camera picture. Posters and pinned photographs are abstract shapes and text: no people, no real brands.

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

> **16 Nov 2026 (build `2026-11-16-fixes-1`): finding it.** The owner: "I couldn't get to Milked." Nothing blocked the way (a test now walks the collision from the District's door to both of Milked's doors), but nothing on Main Street said what was down the side street. There is now a blade sign at the side street's corner, read from both directions along Main Street, and a wall sign on the corner building facing across the road: the existing MILKED logo and an arrow, no new wording (`milked-build.js`, after the lanterns). A taxi can be called to the "Milked corner" stop from any TAXI post or with G.

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
- **Security vestibule:** **two sets of double doors (the inner pair glass in dark metal frames, each leaf with a small pink MILKED logo and a hazard-striped band at waist height)**, the **wall sign on the left (MILKED, VISITOR CHECK-IN 访客登记, STAFF ONLY BEYOND 仅限员工)**, the **card reader on the right with a green glow**, a **dome camera in the ceiling corner**, a **pink light bar overhead**, a **ribbed rubber mat**, **thin pink strips at the floor edges**. The street doors are brushed metal outside with a narrow vision panel in each. **From inside, each is a tall pane of rain-streaked glass showing the side street at night** (the buildings opposite, their signs and lanterns, the wet road): one painting across the two leaves, because the street is not loaded while the player is inside (fourth pass).
- **Reception:** the **dark desk with MILKED and the droplets in pink neon on its front and a pink glow under it**, the **larger pink logo on the dark wall behind**, Eva behind the desk, **a monitor, the acrylic stand reading OFFICIAL CREATORS CHECK-IN with a code, a desk bell, the lucky cat, an orchid, pens**, **shelves with ring binders and trailing pothos**, security monitors, a bench, bamboo, pinned photographs, posters, a duct, pipes and a cable tray on the ceiling. The side door beside the desk reads **STAFF ONLY 仅限员工** over it and has a small MILKED logo on the leaf (fourth pass; it said STUDIOS before). It leads to the studio hallway.
- **Studio hallway:** **long and narrow, large windows in dark metal frames each with a pink logo, green tube lights in a row, a duct, pipes and a cable tray, pink and green strips along the floor edges and under the sills, a grated metal floor, posters**, ON AIR signs over the studio doors, and at the far end **STAFF ONLY 仅限员工 with a lit EXIT 出口 sign**.
- **Four studios** (seen through the windows): each has a **quilted feature wall with MILKED in pink neon, pink and green tube lights, a wooden floor with a pink glow at the wall base, one dancer, a camera on a tripod in the foreground with a small live-view screen, two ring lights, a softbox, bamboo, a paper floor lantern, a shelf of plush toys (with a shark), a grey curtain down one side**, a wall monitor, and its own extra (a chaise, more plants, old monitors and a chequered floor, mirror panels and a barre).
- **Fish's office:** the **plate by her door (MILKED, FISH 小鱼, OPERATIONS, BROADCAST, SCHEDULING)**, a **four-screen monitor wall showing the studio feeds, a side panel listing LIVE / SCHEDULE / CREATORS / REMOTE / ARCHIVE, a wide monitor with the schedule timeline, a second screen**, the remote camera controls, a **mesh chair with a pink-trimmed jacket over its back, a desk lamp, a mug, a keyboard, pens, pinned photographs and notes, shelves of archive boxes with a shark plush, plants, a flight case**, a couch.
- **Staff corridor:** lockers, a notice board, two restroom doors with a pink **RESTROOM 洗手间 sign and the usual figures**.
- **Rear corridor:** **dark doors with pink logos, DRESSING ROOM signs with a hanger, pinned photographs and posters, a laundry cart, floor drains, green tube lights and pipes, a lit EXIT 出口 sign** over the door to the rear lobby, flight cases. Dressing room A is open (mirror with bulbs, counter, stools, clothes rail, bench); B is closed.
- **Rear lobby:** concrete, a green tube, a floor drain, a fire point, a mop bucket, the steel alley door with a hazard band and EXIT 出口 over it.
- **Service alley:** the staff door with a caged green lamp, the staff and deliveries plate, a dumpster and crates (solid), AC units, pipes.

### How the look is made

See "Surfaces and light (fourth pass)" for the materials, the lamps, the shadows and the reflections. In short: Low keeps plain materials, a sky light, light pools and contact shadows; Medium and above use physically based materials with normal maps, five moving lamps, one shadow-casting key light, a mirror in the floors and a small picture of the room for everything else to reflect. Static pieces are merged by material. Signs and screens are one small drawn texture each. Low has no Meshy models (simple stand-ins built in code).

## Props made with Meshy (16 Nov 2026)

Ten props, made on the owner's PC through the Blender bridge with his Meshy account, the same way as the companion suite's furniture: text to image (nano-banana-pro), image to 3D, remesh to about 14,000 triangles, then textures shrunk to 1024 px JPEG in headless Blender. **44 credits each, 440 credits in total** (the whole budget the owner gave). Batch folder on his PC: `C:\Users\smart\Documents\DarknetDistrict_Assets\Meshy\milked_props\` (`props.json` has the prompts, `status.json` the task ids, `run.py`, `shrink.py`).

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

Nobody else is in the building. Eva is **not** the VR companion Eva, and her figure and look were not touched in the fourth pass (the owner will supply a reference).

**The dancers' clothes lean to black and pink (fourth pass).** The original four figures were the repository's own MakeHuman people (CC0), whose clothes and shoes are separate materials. Each dancer gets its own tinted copy of those two materials: studio 1 black with pink shoes, studio 2 a pink suit with dark shoes, studio 3 a black suit with pink shoes, studio 4 pink with dark shoes. The model files, and anyone else in the game who wears the same look, are unchanged. A face covering that came with a look (the street mask on `district-resident`, the VR headset and trackers on `vr-player-b`) is hidden in here so each dancer's face shows. It is a recolour, not the reference outfit (cropped jacket, pleated skirt, tights, platform boots): that needs new clothing models. No licensed "No AI" model was used and no AI tool was used on any model. Studios 2–4 play a loop from the shared animation library when it is installed (`ac-sensual-dance-3`, `ac-sensual-movement-1`, `ac-stand-curve-2`, `ac-stand-curve-3`); without it each plays its own dance (`dance`, `slow-dance`, `dance-samba`, `dance`). If a dancer's model is missing after 25 seconds a spare clothed figure takes the spot. The interior loads these six figures itself (the shared look loader was not reliable after a change of scene).

Replacement points are at the top of `void-runner/milked.js` (`==== WHERE TO CHANGE THINGS ====`): Fish's name, Eva's and Fish's models, the dancers, the dialogue. Voices are still the provisional blends in `tools/audio/npc-voice-registry.json`; nothing was generated.

## Mission 3 (inactive data)

`MISSION` in `milked.js` is untouched: `active: false`, nothing registers or starts it.

## Surfaces and light (fourth pass, 16 Nov 2026, build `2026-11-16-milked-4`)

The owner's note on the third pass: layout, props and the loading transition were right, the surfaces were flat. This pass is about surfaces and light only. Nothing about the rooms, the doors, the checkpoints, the people's places, the interactions or the saves changed. All of it is in `void-runner/milked-build.js`.

### 1. Materials

Low keeps the plain materials it had. On Medium and above every main surface is physically based (colour, normal map, roughness, metalness), so it answers the lamps and shows reflections:

| Surface | What it is now |
|---|---|
| Walls, the reception desk, the office desk and cabinet | The District interior kit's gunmetal (`assets/textures/district-interior/kit_gunmetal_*`) with its own roughness / metalness / occlusion map: dark weathered metal, scratches, streaks, rust blooms. |
| Outer walls inside, the rear lobby, the shopfront piers | The kit's concrete with its own map: stained and streaked. |
| Doors, ducts, lockers, door leaves | The kit's brushed steel with its own map. |
| Ceilings, pipes, the wall behind the desk | The kit's oxidised metal with its own map. |
| Floors (reception, office, corridors, vestibule, lobby) | The street set's mouldy concrete with a **roughness map drawn in code**: smooth wet patches on a duller floor, drag marks. It repeats about every 7 m, not with the tiles. |
| Hallway floor and the drains | Drawn in code: a slotted steel deck plate with rust blooms, with a **normal map made from a drawn height picture** (the slots are sunk, the studs stand up). |
| Quilted studio walls | Drawn in code, with a normal map from a height picture: the diamonds are padded and the buttons sunk. |
| Studio and dressing-room floors | The suite's wood boards, lacquered (they mirror a little). |
| Rubber matting | Drawn in code, with ribs in a normal map. |
| Glass (inner doors, the studio windows), the mirrors | Smooth and reflective: they show the room picture described below. |
| Frames, trims, small dark metal parts | Metallic, with a fine scratch map drawn in code. Everything else that is plain-coloured is a matt non-metal. |

### 2. Reflections

- **The floors mirror the rooms (Medium and above).** One half-size mirror picture (three-quarter size on High) is shared by every damp floor, the hallway's deck plate and the wooden floors, in the way the companion suite's floor does it. Where the floor is rough the picture is soft; in the wet patches it is sharp. It shows the rooms, the signs, the tubes, the screens and the people (on High also the props); never the floors themselves, the light pools or the contact shadows.
- **Everything else reflects a small all-round picture of the room group the player is in** (128 px a side; 256 on High). It is taken when the player comes into a group of rooms (front, hallway and studios, office, staff, rear) and twice more as the people and props arrive; otherwise it costs nothing. There are two, so one is drawn while the other is in use.
- **The pavement in front of the shopfront (Medium and above)** has shallow puddles made the way the street's own are (dark and glossy), with a real mirror picture in them of the sign, the strips, the lit windows and the lanterns. The pink, green and warm pools of light on the pavement are kept. The mirror is only drawn while the player is within about 36 m.

### 3. Light and shadow

The scene's limit is twelve lights, and eight for any one material. Inside, on Medium and above:

- the sun and the sky light (2);
- **five lamps that are always at the five neon signs, tube lights or screens nearest the player.** About thirty-five places are listed as the rooms are built (the big logo, the desk's under-glow, the vestibule's light bar, each green tube, each studio's neon and tubes, the monitor wall, the desk lamp, the dressing-room bulbs and so on). As the player walks, a lamp fades out, moves and fades in, so nothing is recompiled and nothing pops;
- **one key light with a shadow map** (512 px; 1024 on High) in the occupied room nearest the player: Eva's desk, Fish's desk or a studio. The person, the furniture and the walls cast shadows on everything in that room;
- four small lamps for the four nearest people's faces (each lights only that person).

Every quality has **contact shadows**: a soft dark patch under each person and each piece of furniture (one merged mesh). Low has no lamps: its sky light was raised so the rooms are no longer black, and it keeps the light pools.

**About the dimming outside VR.** Medium and High multiply the finished picture by 0.3 (`babylon-renderer.js`; an open decision for the owner in `docs/development/VR_SESSIONS.md`). That was not changed. It means nothing on a Medium screen can be brighter than 30% white. While the player is inside Milked the exposure is raised (2.6 times) so the walls, floors and faces sit higher under that ceiling; the number is read from the live setting every frame and everything is put back on leaving. Medium is still a dark picture, like the rest of the game on Medium, and Low is not dimmed at all, so the two do not look the same.

### 4. Mismatches with the pictures that were fixed

- The reception side door now reads **STAFF ONLY 仅限员工** with a small MILKED logo on the leaf.
- From inside the vestibule the street doors are **rain-streaked glass showing the side street** (a painting).
- The dancers' clothes lean to **black and pink** (a recolour of their own clothes; see Characters), and the mask and the headset that hid two of their faces are hidden.

### 5. Performance (Chromium with the software renderer: a relative measure only)

Draw calls per frame at the same seven viewpoints, before (build milked-3) and after, each run alone on the machine:

| Viewpoint | Low draw calls (before → after) | Low frame, ms | Medium draw calls (before → after) | Medium frame, ms |
|---|---|---|---|---|
| Shopfront from the street | 349 → 344 | 900 → 700 | 834 → 1000 | 2233 → 2583 |
| Vestibule | 198 → 187 | 317 → 317 | 462 → 615 | 1450 → 2083 |
| Reception | 113 → 108 | 233 → 250 | 262 → 441 | 1017 → 1500 |
| Studio hallway | 147 → 132 | 300 → 300 | 348 → 522 | 1783 → 2433 |
| At a studio window | 116 → 114 | 250 → 283 | 276 → 497 | 1617 → 2250 |
| Fish's office | 46 → 46 | 133 → 167 | 106 → 244 | 783 → 1100 |
| Rear corridor | 136 → 129 | 250 → 250 | 322 → 444 | 1367 → 1933 |

The street row moves by itself from run to run (passers-by and traffic: the unchanged build gave 313 and 349 on Low, 834 and 940 on Medium), so it only shows that nothing large was added out there. Frame times are medians of 24 frames on a software renderer in steps of about 17 ms.

- **Low is not heavier.** The light pools became one merged mesh per colour and a few near-identical dark materials were combined, which pays for the contact shadows. Its draw calls are equal or lower at every viewpoint. Its software frame time is the same at three indoor viewpoints and one or two 17 ms steps higher at three (reception, a studio window, the office); that was measured once and may be noise or the cost of the soft shadow patches on a renderer with no graphics card.
- **Medium costs clearly more: about a third to two thirds more draw calls inside (more than double in the office) and about 40 to 50% longer frames on the software renderer.** The floor mirror draws the nearby rooms a second time at half size and the key light draws its room into the shadow map every second frame. Whether that is acceptable has to be judged on a real graphics card; if it is not, the mirror is the first thing to move to High only (one line: `mir` in `build()`). Frame times on the software renderer say little about a real graphics card (it has no hardware at all): they are listed only as before against after on the same machine.
- **Everything is released on leaving:** checked by going in and out twice and counting. After leaving there were no Milked lights, room pictures or render targets left; the exposure, the sky light and the environment strength were back to the street's values; going in again gave exactly the same counts (370 meshes, 266 materials, 12 lights).


## What changed in the third pass

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

## What was checked in the fourth pass (16 Nov 2026, Chromium with the software renderer)

- `npm test`: 988 tests, 987 pass. The one failure is the known local-only `tests/vr-companion-models.test.cjs` ("ava: preview missing").
- `tests/milked-browser.cjs low` passes with no page errors (767 frames watched): the same walk through both checkpoints in both directions, the door rules on every frame, six people, one dancer in each studio.
- **Before and after, same viewpoints, Medium and Low:** the shopfront, the pavement, the rear door, the vestibule both ways, reception from six angles (the desk, Eva, the side door), the hallway both ways and its floor, each studio through its window, the office, Fish, the staff corridor, the rear corridor both ways, dressing room A, the rear lobby. Medium was looked at as shown and as brightened copies.
- **Seen:** rust blooms, streaks and scratches on the walls; the logo and the desk mirrored in the reception floor; the pink and green strips and the tubes in the hallway's deck plate; the quilted walls with relief; lacquer on the wooden floors; the rainy street in the street doors; STAFF ONLY on the side door; the dancers in black and pink with their faces showing; Eva's and Fish's faces lit; puddles on the pavement with the pink strips in them.
- **Found and fixed while looking:** the first Medium pictures were almost as dark as before (the 0.3 pass caps the picture; the exposure and the lamps were raised until the walls read); the room picture was never drawn until a surface used it, and then drew itself into itself (it is now drawn through the scene's own list before it is used); neon signs turned into white blurs when their glow was boosted (put back); studio 2's dancer was a black figure, because her look was made for four lights and never saw her own lamp (people in here now take eight); the street puddles showed the sky as a pale sheet (the mirror's background is now black); the vestibule was over-lit by its own lamp (turned down); Low's rooms were black (its sky light was raised).
- **Leaving releases everything** (counted on Medium, in and out twice): see Performance above.

## What was checked in the third pass (16 Nov 2026, Chromium with the software renderer)

- `npm test`: 988 tests, 987 pass. The one failure is the known local-only `tests/vr-companion-models.test.cjs` ("ava: preview missing").
- `tests/milked-browser.cjs low` passes with no page errors. The player is **walked in small steps that stop at anything solid**: side street, street doors (they open as the player comes up), vestibule, the inner doors refuse from the street, the exchange behind the card, the same spot afterwards, the street doors refuse from inside, reception, Eva (talks under her own name), the desk is solid, the door beside the desk, the hallway, a studio window and a studio door are solid, six people and exactly one dancing in each studio, the staff door, Fish (talks under her own name), the camera controls, a restroom door is solid, the staff corridor, the map, no cab indoors, the rear lobby, the exchange out, the lobby's north door refuses from the street side, the alley door, the service alley to Main Street, in again by the front, out again by the front, in by the rear, the lobby's west door, round the laundry cart (solid), the rear corridor, dressing room A, dressing room B is solid. **On every frame watched (770 in the last run)** the card was only up with every door shut, and an outer and an inner door were never open together. Nothing but the map's explored bits changed in the save.
- Looked at on Medium (brightened copies, because the game outside VR is drawn dim on Medium: `docs/development/VR_SESSIONS.md`) and on Low: the shopfront from both ends of the street, the entrance, the neighbours, the alley back, the loading card, the vestibule in both directions with the doors shut, the sign and the reader, reception from four angles, the hallway both ways, each studio through its window, the office from four angles, the staff corridor, the rear corridor both ways, dressing room A, the rear lobby. All ten Meshy models loaded (38 placements); each one that has a front was photographed from two sides to confirm which way it faces.
- Problems found and fixed while looking: the rear corridor's north wall was not being built (the studios' back walls showed through); the explored-street map was being replaced by a smaller one while inside; the dancers never arrived on Low after a change of scene (the shared look loader remembers a dropped download as done); a mullion stood in front of each dancer; the mirrors were light grey slabs; the office flight case blocked the doorway; the Low stand-in plants looked like fir trees; Eva stood too far behind her desk.

Pictures in `docs/development/milked/` (Medium quality, about 900 px wide). **"brightened" in a name means the picture's levels were stretched three times, which undoes the 0.3 dimming: it is not what a Medium player sees.** Two are also given "as-shown". `01-shopfront-on-the-side-street`, `02-entrance-and-wet-pavement`, `03-loading-card` (as shown, from the third pass: this branch did not touch the transition overlay; `main` has since hidden its wording, logo and bars, so that picture is out of date once the two are merged), `04-vestibule-inner-doors`, `05-vestibule-street-doors`, `06-reception` (brightened and as shown), `06b-reception-staff-only-door`, `07-studio-hallway` (brightened and as shown), `08-four-studios`, `09-fish-office`, `10-rear-corridor`, `11-hallway-floor-reflections`.

## What still differs from the reference sheets

- **Eva** stands; in the picture she sits, leaning on one hand, with dark hair and a black jacket with pink trim. She is still the placeholder figure (green hair) and that figure has no seated clip.
- **The dancers** are the repository's clothed figures recoloured toward black and pink, not the picture's outfit (cropped black and pink jacket, pleated skirt, tights, platform boots). The character system has no outfit choice for these figures: a recolour of the clothes they already wear is all that is possible without new models.
- **Outer doors:** the exterior picture shows metal doors and the vestibule picture shows glass ones with the street visible. They are metal outside and, from inside, tall panes of glass showing the rainy street. That view is a painting, not the real street (the street is not loaded while the player is inside), so it does not move and the people and cabs outside are not in it. For the same reason the reception seen through the inner glass from the street side is a blurred painting until the exchange.
- **Reception is mirrored:** the shelves are on the right and the door on the left as you come in (the picture has them the other way round), because the studios are east of reception. The door leads to the studio hallway and now says STAFF ONLY, as in the picture; so does the door at the hallway's far end. The desk front is upright, not angled.
- **The hallway** has windows on both sides (two studios each side); the picture has one row on the left and posters on the right. Only two posters fit between the doors and windows.
- **The rear exit** is a small lobby with a second door, so that the exchange can happen with every door shut; the picture shows one door standing open onto the alley. The restroom doors are round the corner in the staff corridor, not in the rear corridor.
- **The "narrow alley on the right"** of the shopfront is painted on the corner building's wall (green neon, lanterns); the lanterns over the street are real. No alley was cut: the tests forbid cutting that block.
- **No rain** falls in the side street beyond the city's own weather. The pavement now has real reflections in its puddles (Medium and above), but they are small and show only Milked's own front, not the whole street; no lamp was added out there, because the street already carries ten lights on Medium and the limit is twelve. On Low the pavement is still pools of coloured light.
- **Still short of the art direction's AAA standard.** The surfaces are now physically based with reflections and one shadow-casting light, but the rooms are still boxes built in code: no bevelled edges, no modelled wall panels, trims or door hardware. Only one room at a time has real shadows (the others have contact shadows only), the lamps do not cast shadows and their light passes through thin walls, and the room picture that metal and glass reflect is small. It remains an upgrade candidate for a Blender-built kit.
- **Studio 2's dancer** plays a floor routine from the shared animation library and has her back to the window for part of it; the clip was not changed.
- The orchid, the lantern, the desk bell and most plush toys are simple shapes.

## What is not done or not verified

- **Not pushed, no PR, not merged.** The fourth pass is one local commit on `claude/milked-surfaces` (the third pass merged as build milked-3).
- **The fourth pass was only ever seen through the software renderer.** The shadows (their softness, any striping on walls), the floor mirror, the glass and the lamps' fading were not seen on a real graphics card, and the frame times above say nothing about one. High was not run at all.
- A quality change made while standing inside was not tried in the fourth pass either (the materials are chosen when the place is built).
- The lamps' light is not blocked by walls (only the key light casts shadows), so a pink or green tint can show on a floor on the far side of a thin wall.
- The room picture changes about a third of a second after the player walks into another group of rooms; the change was not judged in motion.
- Dialogue, the card's wording and the signs' wording are provisional and need the owner's approval. Voices are not generated.
- **No real-GPU check.** Everything was run with the software renderer; door timing and loading are faster on real hardware. No Firefox, no VR headset. **High quality was not run** (its larger mirror, shadow map and room picture are untested).
- **Multiplayer was not tested with two players.** The interior shares the street's room on purpose; a player on the street and a player inside are at the same coordinates on opposite sides of a wall and should not see each other, but name tags through walls were not checked.
- The full Medium run of `tests/milked-browser.cjs` was not completed (it takes very long on the software renderer); Medium was checked with the photo tour instead, which uses the real front checkpoint.
- A quality change made while standing inside, and a real sky-cab flight to the stop, were not exercised.
- The shared look loader's fault (`character-assembler.js` `ensureLook` remembers a download dropped by a scene change as done) was worked round here, not fixed there; other places that use it may show the same thing.
- The Meshy models' licence wording is for the owner to confirm (same question as the earlier Meshy models).
- Older documents that describe the first two versions were left as history.
