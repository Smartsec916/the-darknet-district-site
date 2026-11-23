# NPC importer / Companion Studio bridge (Issue #520)

## Implemented in PR #521 (not yet merged)

- A local-only `.vrcompanion` parser using the **actual** Companion Studio `unpackTransfer()` and existing NPC GLB validator.
- Validation of imported personality JSON through Companion Studio's `profile()` schema; rejects recordings unrelated to current dialogue.
- Counts recorded and missing voice lines so a future ElevenLabs missing-only generation action can use them.
- **NPC Editor import file picker now accepts `.vrcompanion` alongside `.glb` and `.gltf`.** On import it loads the companion parser on demand, extracts the model as a private browser draft, stores the original companion transfer and its voice/motion attachments in browser IndexedDB, and displays personality, voice, and animation metadata plus warnings.
- The existing `SHOW 3D PREVIEW`, local placement test, licensing checklist and import-package export remain the path for the extracted GLB.
- When downloading an import integration package, an imported companion downloads both the extracted GLB and its **original `.vrcompanion`** to prevent losing voice and separate motion binary attachments.
- Added tests in `tests/npc-companion-import.test.cjs` and `tests/npc-companion-editor.test.cjs`.

## Safety and limits

- **Not live.** The new code is only in PR #521; merging and deployment require passing checks and appropriate validation.
- Import is local-only. It does not register an NPC in published content, upload the model, or call ElevenLabs.
- Companion motions stored as separate transfer parts are not automatically merged into the extracted GLB's runtime animation groups. Current preview can play only the clips supported by its actual model or the existing compatible game library.
- The personality is retained as import metadata; this does not yet mean personality traits drive the ordinary world NPC runtime.
- Private character/model/voice binaries must never be committed to the public repository without appropriate rights.

## Outstanding work (for ChatGPT Work only if unfinished)

1. Investigate and resolve any Node, Python, Babylon/browser CI failures. Run manual browser integration with real user-supplied `.vrcompanion` examples and check preservation after browser refresh, local preview, animation playback and export.
2. Implement the separate **NPC Personality** ChatGPT prompt / JSON paste-and-validate UI for regular roster NPCs, with edit/preview/save, using Companion Studio's schema. Confirm game runtime consumes appropriate traits rather than merely displaying them.
3. Implement **NPC Voices** ElevenLabs voice selection and **Generate All Missing Voices** as an explicit user-triggered batch, leveraging Companion Studio's voice batch and the existing secure voice backend. Preserve unchanged recordings and handle changed text, retries, progress, and credit limits. Do not generate billable audio on import.
4. Integrate extracted companion motion and compatible profile/audio into the real NPC asset registration and publish mechanism without duplicate actors. Respect scene permissions, licensing and private assets. Provide rigging/retargeting where technically possible with accurate warnings.
5. Complete full regression + runtime tests, merge after passing checks, deploy to live, and verify ordinary-player visibility.

Progress should be recorded here, in PR #521, and in Issue #520. Related Dax editor change is **separate issue #522 / draft PR #523**; Desire is queued as #524.
