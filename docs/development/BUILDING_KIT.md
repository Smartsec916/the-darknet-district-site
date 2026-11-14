# NeoChinatown building kit

> **Permanent art direction (Nov 2026):** kit pieces and any Blender-made architecture must follow the PBR, wear, scale and export standards in `docs/VOID_RUNNER_ART_DIRECTION.md` ("PERMANENT DIRECTION", Blender section). The current kit is a first version and an upgrade candidate.

A set of modular building pieces for replacing the box buildings on the street. Status: **finished (47 pieces), not yet used by the game.** How to use it in the game: `BUILDING_KIT_HANDOVER.md`.

- Pieces: `void-runner/assets/models/kit/*.glb`, listed with sizes, triangle counts and snap points in `kit-manifest.json`.
- Shared textures: `void-runner/assets/models/kit/textures/` (generated, nothing licensed). The `.glb` files refer to these; they carry no pictures of their own.
- Source: `tools/assets/kit/build_kit.py` (the pieces, built by code with Blender's `bpy`) and `kit_textures.py` (the textures). There is no `.blend` file.
- Rebuild: `python tools/assets/kit/build_kit.py --batch 1 --preview out.png` (add `--textures` to regenerate the textures). `--assemble out.png` renders a two-storey corner made from the pieces, to check how they join.

Rules: metres; 1 m grid; widths 2 / 4 / 6 m; upper floors 3.5 m, shopfront floor 4.5 m; Y up, front faces +Z, origin at the bottom-left-front corner; under 3,000
triangles a piece; seven shared materials (`kit_concrete`, `kit_metal`, `kit_glass`, `kit_emissive`, `kit_asphalt`, `kit_ticker`, `kit_fabric`); light only from `kit_emissive` and `kit_ticker`, no lamps.
Shop signs are an LED text strip (`kit_ticker`, one texture repeating every 20 m): the game scrolls it by sliding that texture sideways. Its wording in `kit_textures.py` (`TICKER_TEXT`) is a placeholder until David approves it.
Neon tubes (`__neon_<n>`) and shop sign faces (`__sign_0`) are separate child nodes too, so the game can switch them off or give a sign its own picture.
Window panes are separate child nodes (`<piece>__glass_<n>`) so the game can switch a window between dark glass and a lit look from the emissive atlas.

| Batch | Pieces | State |
|---|---|---|
| 1 | wall_plain 2/4/6 m, wall_windows 4/6 m | built |
| 2 | corner_outer 1 m, corner_inner 1 m, cornice 2/4/6 m, cornice_corner 1 m, roof_parapet 4 m | built |
| 3 | shopfronts (4.5 m): window 4/6 m, shutter 4 m, door 2 m, service 2 m; corner_outer_tall and corner_inner_tall 1 m (4.5 m) | built |
| 4 | window_frame 1 m, window_wide 2 m, window_barred 1 m (surface-mounted units for plain walls); roof_parapet 2 m, roof_parapet_corner 1 m | built |
| 5 | awning_fabric 4/6 m, awning_canopy 4 m, balcony 2/4 m (their backs mount on the wall plane) | built |
| 6 | fireescape_landing 3 m, fireescape_ladder 1 m, pipe_vertical 1 m, duct_horizontal 4 m, cable_bundle 4 m | built |
| 7 | clutter_ac_unit 1 m, clutter_ac_bracket 1 m, roof_watertank 2 m, roof_antenna 1 m, roof_vent 1 m, roof_hut 3 m | built |
| 8 | sign_vertical 1 m, sign_horizontal 4 m, neon_trim 2/4 m, kerb_straight 4 m, kerb_corner 1 m, sidewalk_slab 4 m (3 m deep) | built |
