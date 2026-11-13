# Cyberpunk character gear (LOCAL, awaiting David's review)

Status: built locally on branch `claude/character-gear`. **Not pushed, not merged, not loaded by the game.** David asked for it to stay minimal.

- Source: `tools/assets/gear/build_gear.py` (parts built by code with Blender's `bpy`, the same way as `tools/assets/kit/`).
  Rebuild: `python tools/assets/gear/build_gear.py [--preview out_dir --on male|female --pose talk]`.
- Output: `void-runner/assets/models/gear/` (5 parts x 2 bodies, 10 small .glb files, 25 KB each) and `gear-manifest.json`.
- Parts: a thin **visor** (Head), a slim **collar** (Neck), a low **shoulder plate** on each side (LeftArm, RightArm) and a short **chest line** (Spine2). The lit details are
  hair-fine lines only, in one material (`gear_glow`, emissive, no real lights); the rest is dark gunmetal (`gear_shell`). No textures.
- Fitted separately to the male body (`district-smuggler`) and the female body (`district-resident`), from measurements of the shipped files.
- Skinned 100% to one joint of the character's own 52-joint skeleton and exported with that skeleton (the way the hairstyle parts work), so the parts follow every
  existing animation with no extra clips or per-frame code. Checked in Blender in the `talk` clip.
- Triangles per part: visor 216, collar 216, plate 56, chest line 24 (all under 300).
- Not done yet (needs David's review first): loading the parts in `character-assembler.js`, an accessory list in the catalog and creator, the hub catalog copy,
  tinting `gear_glow` by the player's accent colour, and a Babylon check of skinned parts on the shared skeleton.
