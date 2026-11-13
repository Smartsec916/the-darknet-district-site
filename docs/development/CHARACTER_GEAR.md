# Cyberpunk character gear (LOCAL, awaiting David's review)

Status: built and integrated locally on branch `claude/character-gear`. **Not pushed, not merged, not deployed.** David approved the minimal design for local integration and testing (13 Nov 2026) and wants to review before anything is published.

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

## Integration (local)

- **How it is saved:** four new accessory ids, `gear-visor`, `gear-collar`, `gear-shoulders`, `gear-chest`, in `character-catalog.json` (`accessories`, flagged `gear`), and listed (with no mesh names) on every look.
  An appearance stores them in the existing `accessories` list. No new field, no version change, and the validators (JS, Python, hub) are unchanged. None is ever a default,
  so every existing character and every appearance saved before this loads exactly as before, with no gear.
- **Creator:** a CYBER GEAR row (each piece toggles on its own). The gear visor swaps with the outfit's own eyewear and the tech collar with its own collar (turning one on turns the other off).
- **Assembler (`character-assembler.js`):** loads only the pieces chosen, clones them onto the character's own skeleton, and merges them into two meshes (dark, lit): two draw calls
  for the whole set. Rebuilt only when the chosen set changes. 18 small files are fetched on first use only.
- **Test:** `tests/character-gear-browser.cjs` (defaults, all 16 combinations on both bodies, skeleton, and a vertex-level clipping measurement over every outfit and every animation clip that exists).

## What a live release would need (not done, awaiting David's approval)

1. Merge `claude/character-gear` to `main` (pages deploy, build id bump, admin inventory).
2. **Game API:** redeploy from `main` so `character-catalog.json` carries the four ids; otherwise saving an appearance WITH gear is refused ("That appearance is not available"), the same way the four outfits were until 13 Nov. No code, environment or database change.
3. **Hub:** the same catalog file in `tools/district-hub/appearance/` (plus the byte-identical `character-appearance.js`, whose only change is the creator's option list), then a manual redeploy. The hub validates and forwards the appearance as it is: its messages do not limit the list (the longest possible appearance is about 215 bytes).
4. Order: API and hub first, then the pages (or all at once); a player who saves gear before the servers know it keeps it on their own device only. A player on an old cached page who receives a gear appearance sees the plain model for that player (safe fallback), not a crash.
5. Two real signed-in accounts to confirm one sees the other's gear.
