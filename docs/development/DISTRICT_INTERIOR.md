# The Darknet District interior rebuild

> **Permanent art direction (Nov 2026):** the interior rebuild follows `docs/VOID_RUNNER_ART_DIRECTION.md` ("PERMANENT DIRECTION"): dark, layered, PBR, lived-in, accent lighting, real coordinates, Babylon-compatible GLB. Remaining Tron-like rooms are upgrade candidates, not finished work.

David's order (12 Nov 2026): rebuild the whole interior area by area with Blender-made assets, starting at the security vestibule and working outward, publishing each
finished area. Layout, doors, routes, interactions, multiplayer and missions stay as they are; this is a rebuild of how it looks. Mission characters and companions are not changed.

## How the pieces are made and used

- Source: `tools/assets/kit/build_kit.py --interior` (pieces built by code with Blender's `bpy`; the same builder and materials as the street building kit, plus `kit_tile`).
  `--assemble out.png` renders the vestibule put together.
- Output: `void-runner/assets/models/district-interior/*.glb` and `interior-manifest.json`. The files are **bare**: materials by name, no pictures inside, because the
  game's model loader (`asset-pipeline.js`) accepts only self-contained files.
- Textures: `void-runner/assets/textures/district-interior/` (1K JPEGs, about 1 MB in all, so the scene's readiness wait stays short).
- In the game: `neochinatown.js` `buildEntrance()` places them with `kitPiece()` and gives every mesh one shared material per name (`kitMat()`).
  The models are registered as `entry:<name>` and load in BOTH areas (street and interior), because the vestibule is built in both: the room is identical on each side
  of the checkpoint, which the direction-aware loading depends on.
- The hallway pieces are registered as `district:hall_*` (interior only) and placed by the `hallLined` block in `buildInterior()`: each wall run is filled automatically
  from the collision walls (`hall-west-*`, `hall-east-*`), and every piece joins the per-material mesh merge, so the whole hallway costs a few draw calls.
- Shop fittings are `district:shop_*` and `district:tube_light_2m`, placed with `kitAt()` (a piece against a wall, by the wall's face and a start point).
  Merchandise colours come from one small swatch sheet (`kit_goods`); packs and vests are `kit_canvas`.
- If a model is missing the old plain vestibule is still there underneath (and the old scanner post is built instead of the kiosk).
- The room has no lamps of its own (the scene's light limit is 12): surfaces carry a faint self-light and the glow comes from `kit_emissive`.

## Phases

| Phase | Area | State |
|---|---|---|
| A | Security vestibule and entrance: wall lining, ceiling services, floor with scanner pad, door portals, scanner arch, badge kiosk | first version live; lighting and density to be pushed further |
| B | Main hallway: wall modules, columns with light slots, ceiling modules, tiled floor (west magenta, east cyan); every doorway has a lintel with a light under it, a fascia carrying the room's sign and a tread plate; two crate stacks and two benches against the walls (they block movement: `prop-hall-*` solids); four ambient residents (`crew-hall-*`) | live |
| C | VR Play area: walls lined with the hallway modules (cyan displays in the north booth, magenta in the south), an equipment rack with charging headsets in each booth. Layout, both booths, the kiosk, VR activities and companions unchanged | first version live; ceiling services and furnishings still to do |
| D | Arcade: a profiled cabinet body round each of the five cabinets (live screens, marquees, controls and the Blackout Protocol launch unchanged), stools at the four cabinets not yet switched on, a change machine | first version live; ambient sound and people still to do (`ARCADE.md`) |
| E | Store and Admin / Iris counter: counter with goods laid out and a till, two packed bookshelves, two gear walls of hanging packs and vests, wall linings, four bare tube lights. Admin, Iris, their positions, dialogue and interactions are unchanged | first version live; display cases, workstation and Admin/Iris looks (reference pictures) still to do |
| F | Sleeping Pod room: a moulded capsule surround on each of the ten hatches (wearing the pods' Tesana paint), tiled room floor. The pods' ring, glass, lights, numbers, music and every interaction are unchanged **Dark since 13 Nov 2026 (David: the pods were almost white; things should be dark with coloured light as the accent):** shells, ribs, bedding and mattress are near-black violet, the lit rings and LEDs carry the colour. | first version live; room walls, ceiling, vending wall and pod interiors still to do |

## Reference pictures

Supplied by David in the session of 12 Nov 2026 (not stored in the repository): neon VR corridor; glass-front vending machine; gear shop; book and media shop;
capsule-hotel corridor; two round, lit pod entrances; Admin (three pictures); Iris (two pictures). The character pictures are look references only.

## 13 Nov 2026

- Hallway and every lined room: the surfaces' faint self-light was lowered (David: the hallway read too grey; it should be dark, industrial, with coloured lighting as the highlight). Colour now comes from the lights and the glowing parts.
- Arcade: the fourth cabinet is Corporate Zombies (playable).
