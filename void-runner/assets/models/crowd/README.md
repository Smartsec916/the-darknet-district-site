# Crowd figures (VOID//RUNNER background NPCs)

Eighteen looks (the Dead Channel bartender joined on 2026-10-22) that dress the ambient `crew-*` NPCs, chosen per place in `void-runner/crowd.js`. Built with
`tools/animation-pipeline/build_mpfb_character.py` from the specs in `tools/animation-pipeline/characters/`.

- **Bodies, clothes, hair, skins:** MakeHuman system assets and the "Suits 02" pack via MPFB 2.0.18, all **CC0**.
  The Suits 02 known-character costumes are never used.
- **Recolours, glow trims and the simple visor/shades/mask/collar pieces** were made by the build script.
- **Motion:** Rokoko free mocap clips (David's VOID_RUNNER_KEEP set), retargeted, resampled to 15 fps and trimmed
  to 8-second loops. Rokoko's free-clip pages allow use "in any animation, VFX, game… including for commercial use";
  they do not address redistribution, so confirm Rokoko's terms before this ships publicly.
- **Walking:** `Walk_Loop` from the Quaternius Universal Animation Library (Standard, **CC0**, quaternius.com), retargeted from its Unreal-style rig using its T-pose clip as the reference pose.
- **Meridian moves (2026-10-22):** sit-enter, sit-exit, sit-talk, interact and pickup from the same Quaternius Universal Animation Library (**CC0**); look (Idle_LookingAround) and the bartender's polish (Clipboard_Lever_Computer) from the Rokoko set. The `meridian-bartender` look is MakeHuman CC0 like the others.
- Textures at 512 px, no normal maps, heavy garments decimated: about 2.5–3.5 MB per look, 49 MB in total.
  A place loads only its own looks (3–8). Low graphics quality loads none and keeps the procedural crew.
