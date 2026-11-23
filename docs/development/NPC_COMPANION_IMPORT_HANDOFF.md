# NPC importer / Companion Studio bridge (Issue #520)

This branch adds a first, **non-publishing** stage: `void-runner/npc-companion-import.js` recognizes the real Companion Studio `.vrcompanion` transfer using the existing `vr-companion-studio.js` reader and validates the included GLB using `npc-paths.js`. It produces an in-memory preview handoff with model blob, glTF metadata, companion identity, personality, dialogue, motion files and voice files. It explicitly warns about unrigged or unanimated models. Nothing is written to the roster or uploaded.

**Not done in this stage:** wiring the file chooser into Developer Tools → NPCs; 3D runtime preview of the unpacked model; animation retargeting; mapping recorded dialogue into the world voice engine; rigging UI reuse; publishing. Do **not** merge/deploy as if end-to-end imports already work.

## Next implementation work
1. Review existing NPC importer UI and invoke `VoidNPCCompanionImport.inspect(file)` on `.vrcompanion` only. Keep `.glb/.gltf` paths unchanged.
2. Display metadata, validator information and useful warnings. Use existing local model preview, never auto-register globally.
3. Reuse Companion Studio's skeleton and animation preparation, then map the validated companion profile and recordings into world NPC records with explicit compatibility checks.
4. Add browser-driven end-to-end tests and test real owner-provided packages locally without committing proprietary content. Validate ownership and distribution licenses before any publishing.
5. Complete the normal PR checks and document release status on issue #520.

Targeted Node tests: `node --test tests/npc-companion-import.test.cjs`.
