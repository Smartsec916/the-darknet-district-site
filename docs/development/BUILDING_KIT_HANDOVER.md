# Building kit: handover for whoever replaces the box buildings

The kit is finished: 47 pieces in `void-runner/assets/models/kit/`, described by `kit-manifest.json`. Nothing in the game loads it yet.
The job is to replace the box buildings that `void-runner/neochinatown.js` builds for the street with these pieces.

## What you need to know

1. **Read `kit-manifest.json` first.** For every piece it gives the file, size in metres, triangle count, child nodes and snap points.
2. **Axes.** Y is up. A piece's origin is the bottom-left-front corner of its bounding box and its front faces **+Z**. Width runs along +X. Turn a piece about Y to face it another way.
3. **Grid.** 1 m module; widths 2 / 4 / 6 m. The street floor is 4.5 m (`kit_shopfront_*`, `kit_corner_*_tall_1m`); every floor above is 3.5 m (`kit_wall_*`, `kit_corner_*_1m`).
   Facade pieces are 0.5 m deep and their wall plane is 0.1 m behind their front (`wallPlaneBehindFront`).
4. **A building, bottom to top:** shopfronts, then wall floors, then `kit_cornice_*` (overhangs 0.2 m: place it 0.2 m forward, snap `on_wall`), then `kit_roof_parapet_*`.
   Corners: `kit_corner_outer_*` (1 × 1 m, the next wall starts at snap `around`, turned 90°), with `kit_cornice_corner_1m` and `kit_roof_parapet_corner_1m` above it.
5. **Hanging pieces** (awnings, canopy, balconies, fire escape, pipes, duct, cables, AC bracket, signs, neon trim, window units) have a `mount` snap: put the back of the piece on the wall plane.
6. **Street edge:** `kit_sidewalk_slab_4m` is 3 m deep (the shopfront strip); `kit_kerb_straight_4m` goes on its street side; tops are level at 0.15 m.
7. **Materials: make each ONE time and share it.** The `.glb` files hold no pictures; they point at `kit/textures/`. Babylon creates a new material per import, so after loading, replace
   each mesh's material with one shared material per name: `kit_concrete`, `kit_metal`, `kit_glass`, `kit_asphalt`, `kit_fabric`, `kit_emissive`, `kit_ticker`. Then instance the meshes.
   Checked in Babylon 8.26: all 47 pieces load, textures resolve, orientation is right.
8. **Light.** Only `kit_emissive` and `kit_ticker` glow. There are no lamps in the kit (the scene's light limit is 12): let the glow layer and the existing street lights do the work.
9. **Switchable child nodes** (names in the manifest under `nodes`):
   - `<piece>__glass_<n>`: a window pane. Dark = `kit_glass`. Lit = a material using the emissive atlas with the pane's UVs (0..1) scaled and offset into one of the
     `emissiveRegions` `window_magenta`, `window_cyan`, `window_violet`, `window_green` (one shared material per colour: four in all). Light roughly a third of the windows.
   - `<piece>__neon_<n>`: a neon tube. Disable the node to switch it off. Keep neon as an accent: not every tube on every building.
   - `<piece>__sign_0`: a sign face. On shopfronts it uses `kit_ticker`; on `kit_sign_*` a coloured light box you can replace with a shop's own picture.
10. **Scrolling shop signs.** `kit_ticker` is one LED text strip repeating every 20 m. Scroll it by adding to its texture's `uOffset` each frame (about 0.03 per second).
    For shops to show different words, give each a cloned material with a different starting `uOffset` (a handful of clones, not one per shop).
    **The wording is a placeholder** (`TICKER_TEXT` in `tools/assets/kit/kit_textures.py`) until David approves it.
11. **Performance.** No piece is over 1404 triangles. Use instances for repeats, freeze world matrices, and merge a finished building where it helps.
    Keep the existing quality tiers: on `low`, drop the hanging pieces and roof clutter.
12. **Do not** edit the `.glb` files by hand. Change `tools/assets/kit/build_kit.py` / `kit_textures.py` and rebuild (`docs/development/BUILDING_KIT.md`). Bump `BUILD` in `void-runner-sw.js` when the game starts using the kit.

## The pieces

**Batch 1**

| Piece | Size m (w × h × d) | Triangles |
|---|---|---|
| `kit_wall_plain_2m` | 2.0 × 3.5 × 0.5 | 510 |
| `kit_wall_plain_4m` | 4.0 × 3.5 × 0.5 | 738 |
| `kit_wall_plain_6m` | 6.0 × 3.5 × 0.5 | 990 |
| `kit_wall_windows_4m` | 4.0 × 3.5 × 0.5 | 1018 |
| `kit_wall_windows_6m` | 6.0 × 3.5 × 0.5 | 1404 |

**Batch 2**

| Piece | Size m (w × h × d) | Triangles |
|---|---|---|
| `kit_corner_inner_1m` | 1.0 × 3.5 × 1.0 | 524 |
| `kit_corner_outer_1m` | 1.0 × 3.5 × 1.0 | 548 |
| `kit_cornice_2m` | 2.0 × 0.5 × 0.7 | 388 |
| `kit_cornice_4m` | 4.0 × 0.5 × 0.7 | 576 |
| `kit_cornice_6m` | 6.0 × 0.5 × 0.7 | 764 |
| `kit_cornice_corner_1m` | 1.2 × 0.5 × 1.2 | 356 |
| `kit_roof_parapet_4m` | 4.0 × 1.5 × 0.59 | 452 |

**Batch 3**

| Piece | Size m (w × h × d) | Triangles |
|---|---|---|
| `kit_corner_inner_tall_1m` | 1.0 × 4.5 × 1.0 | 536 |
| `kit_corner_outer_tall_1m` | 1.0 × 4.5 × 1.0 | 560 |
| `kit_shopfront_door_2m` | 2.0 × 4.5 × 0.5 | 850 |
| `kit_shopfront_service_2m` | 2.0 × 4.5 × 0.5 | 820 |
| `kit_shopfront_shutter_4m` | 4.0 × 4.5 × 0.5 | 728 |
| `kit_shopfront_window_4m` | 4.0 × 4.5 × 0.5 | 564 |
| `kit_shopfront_window_6m` | 6.0 × 4.5 × 0.5 | 626 |

**Batch 4**

| Piece | Size m (w × h × d) | Triangles |
|---|---|---|
| `kit_roof_parapet_2m` | 2.0 × 1.5 × 0.59 | 312 |
| `kit_roof_parapet_corner_1m` | 1.0 × 1.502 × 1.0 | 412 |
| `kit_window_barred_1m` | 1.0 × 1.6 × 0.2 | 308 |
| `kit_window_frame_1m` | 1.0 × 1.6 × 0.2 | 250 |
| `kit_window_wide_2m` | 2.0 × 1.4 × 0.2 | 250 |

**Batch 5**

| Piece | Size m (w × h × d) | Triangles |
|---|---|---|
| `kit_awning_canopy_4m` | 4.0 × 0.82 × 1.5 | 396 |
| `kit_awning_fabric_4m` | 4.0 × 0.94 × 1.5 | 216 |
| `kit_awning_fabric_6m` | 6.0 × 0.94 × 1.5 | 258 |
| `kit_balcony_2m` | 2.0 × 1.55 × 1.0 | 612 |
| `kit_balcony_4m` | 4.0 × 1.55 × 1.0 | 882 |

**Batch 6**

| Piece | Size m (w × h × d) | Triangles |
|---|---|---|
| `kit_cable_bundle_4m` | 4.0 × 0.48 × 0.13 | 480 |
| `kit_duct_horizontal_4m` | 4.0 × 0.75 × 0.5 | 240 |
| `kit_fireescape_ladder_1m` | 1.0 × 3.5 × 0.292 | 246 |
| `kit_fireescape_landing_3m` | 3.0 × 1.5 × 1.2 | 550 |
| `kit_pipe_vertical_1m` | 1.0 × 3.5 × 0.255 | 404 |

**Batch 7**

| Piece | Size m (w × h × d) | Triangles |
|---|---|---|
| `kit_clutter_ac_bracket_1m` | 1.0 × 0.34 × 0.5 | 92 |
| `kit_clutter_ac_unit_1m` | 1.0 × 0.62 × 0.35 | 244 |
| `kit_roof_antenna_1m` | 1.0 × 4.28 × 1.0 | 306 |
| `kit_roof_hut_3m` | 3.0 × 2.66 × 2.6 | 362 |
| `kit_roof_vent_1m` | 1.0 × 1.26 × 1.0 | 324 |
| `kit_roof_watertank_2m` | 2.0 × 2.9 × 2.0 | 508 |

**Batch 8**

| Piece | Size m (w × h × d) | Triangles |
|---|---|---|
| `kit_kerb_corner_1m` | 1.0 × 0.15 × 1.0 | 156 |
| `kit_kerb_straight_4m` | 4.0 × 0.15 × 0.6 | 184 |
| `kit_neon_trim_2m` | 2.0 × 0.14 × 0.06 | 72 |
| `kit_neon_trim_4m` | 4.0 × 0.14 × 0.06 | 96 |
| `kit_sidewalk_slab_4m` | 4.0 × 0.153 × 3.0 | 564 |
| `kit_sign_horizontal_4m` | 4.0 × 0.9 × 0.18 | 80 |
| `kit_sign_vertical_1m` | 0.18 × 3.0 × 1.0 | 144 |
