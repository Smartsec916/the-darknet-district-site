# District asset import status — 2026-11-10

**Complete on draft PR #212, not deployed.** All nine hairstyle GLBs from `claude/character-creator` were imported into `void-runner/assets/models/parts/` using existing **binary Git blob SHAs**, without UTF-8 conversion:

`hair-short01.glb`, `hair-short02.glb`, `hair-short03.glb`, `hair-short04.glb`, `hair-bob01.glb`, `hair-bob02.glb`, `hair-braid01.glb`, `hair-long01.glb`, `hair-ponytail01.glb`.

The generated hair fit metadata is `void-runner/assets/models/parts/bind-data.json`, catalog source in `void-runner/character-catalog.json`, and browser copy in `void-runner/character-catalog.js`.

At PR head `e3e0ba1`, Node, Python and Babylon stabilization CI passed (run [42893600023](https://github.com/Smartsec916/the-darknet-district-site/actions/runs/42893600023)). **Still inspect the rendered appearance and clothing controls manually** before release. Private purchased companion models must stay in their authorized private asset pipeline, not this public repository.

See `docs/development/AI_HANDOFF.md` and `docs/development/AI_ROADMAP.md` for the current release gate.
