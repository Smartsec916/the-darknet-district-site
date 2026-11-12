# The Darknet District interior rebuild

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
- If a model is missing the old plain vestibule is still there underneath (and the old scanner post is built instead of the kiosk).
- The room has no lamps of its own (the scene's light limit is 12): surfaces carry a faint self-light and the glow comes from `kit_emissive`.

## Phases

| Phase | Area | State |
|---|---|---|
| A | Security vestibule and entrance: wall lining, ceiling services, floor with scanner pad, door portals, scanner arch, badge kiosk | first version live; lighting and density to be pushed further |
| B | Main interior corridor (reference: the neon VR corridor picture) | next |
| C | VR Play area | planned |
| D | Arcade | planned (room exists: `ARCADE.md`) |
| E | Store and Admin / Iris counter (references: the two shop pictures) | planned |
| F | Sleeping Pod room (references: the capsule corridor and the two lit-ring pod pictures; environment only) | planned |

## Reference pictures

Supplied by David in the session of 12 Nov 2026 (not stored in the repository): neon VR corridor; glass-front vending machine; gear shop; book and media shop;
capsule-hotel corridor; two round, lit pod entrances; Admin (three pictures); Iris (two pictures). The character pictures are look references only.
