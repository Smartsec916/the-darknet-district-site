# Hotel Headshots character assets

Built 24 November 2026 with Blender 5.2 and installed MPFB2 using `tools/assets/hotel/build_characters.py`.

`guest-a.glb`, `guest-b.glb`, `guest-c.glb` contain adult MakeHuman bodies (age phenotype 0.55), MPFB system skin maps, eyes, eyebrows, eyelashes and bob01 / ponytail01 / long01 hair. MakeHuman/MPFB system assets are CC0; installed asset headers credit Data Collection AB, Joel Palmius and Jonas Hauquier (September 2020 release). Swimwear uses original opaque material regions on the continuous skinned topology, so fabric and body deform identically; the runtime supplies six fabric colors.

Idle and walk animation are retargeted from this repository's public `void-runner/assets/models/crowd/vr-companion-f.glb`, already covered in `docs/VOID_RUNNER_ASSET_LICENSES.md` (MakeHuman/MPFB, Quaternius Universal Animation Library and owner Rokoko animation provenance). Three guard poses (forehead, open palms, crossed forearms) are authored in the build script. Sleeping/waking/swimming/climbing transforms are applied in the runtime. No licensed private companion model or raw animation library is included.

Three self-contained GLBs, approximately 5 MB each, with textures capped at 1024 pixels. Skeletons and materials are shared through scene asset containers; every guest has an independent animated skeleton. Runtime models are unpickable; skeletal region proxies handle combat. The receptionist uses a guest variant. The original public companion supplies only offline animation-retargeting input; it is not loaded at runtime.

Rebuild requires the existing local MPFB installation/assets and Blender; run Blender in background with `--python tools/assets/hotel/build_characters.py` from the repository root. Temporary build specs/logs belong in `.test-temp/hotel-headshots`.
