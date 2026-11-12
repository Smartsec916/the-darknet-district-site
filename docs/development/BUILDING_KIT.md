# NeoChinatown building kit

A set of modular building pieces for replacing the box buildings on the street. Status: **in progress, not yet used by the game** (David reviews each batch).

- Pieces: `void-runner/assets/models/kit/*.glb`, listed with sizes, triangle counts and snap points in `kit-manifest.json`.
- Shared textures: `void-runner/assets/models/kit/textures/` (generated, nothing licensed). The `.glb` files refer to these; they carry no pictures of their own.
- Source: `tools/assets/kit/build_kit.py` (the pieces, built by code with Blender's `bpy`) and `kit_textures.py` (the textures). There is no `.blend` file.
- Rebuild: `python tools/assets/kit/build_kit.py --batch 1 --preview out.png` (add `--textures` to regenerate the textures). `--assemble out.png` renders a two-storey corner made from the pieces, to check how they join.

Rules: metres; 1 m grid; widths 2 / 4 / 6 m; upper floors 3.5 m, shopfront floor 4.5 m; Y up, front faces +Z, origin at the bottom-left-front corner; under 3,000
triangles a piece; five shared materials (`kit_concrete`, `kit_metal`, `kit_glass`, `kit_emissive`, `kit_asphalt`); light only from `kit_emissive`, no lamps.
Window panes are separate child nodes (`<piece>__glass_<n>`) so the game can switch a window between dark glass and a lit look from the emissive atlas.

| Batch | Pieces | State |
|---|---|---|
| 1 | wall_plain 2/4/6 m, wall_windows 4/6 m | built, approved |
| 2 | corner_outer 1 m, corner_inner 1 m, cornice 2/4/6 m, cornice_corner 1 m, roof_parapet 4 m | built, awaiting review |
| 3 | shopfronts (4.5 m): window 4/6 m, shutter 4 m, door 2 m, service 2 m | planned |
| 4 | window frames: 1 m, wide 2 m, barred 1 m | planned |
| 5 | awnings and balconies | planned |
| 6 | fire escape, pipes, ducts, cables | planned |
| 7 | roof and wall clutter | planned |
| 8 | signs, kerbs, sidewalk slab (3 m deep) | planned |
