# Advanced NPC interactions — implementation checkpoint (2026-11-22)

Branch: codex/npc-advanced-interactions. This is an isolated development branch, not deployed.

Owner-approved scope:
- Keep basic NPC editor intact. Optional collapsed Advanced settings.
- Proximity and room entry/exit triggers, short-visit and longer-visit dialogue, configurable time/cooldown; per-player state.
- Companion-style greeting and response choices; walk away cancels.
- Follow invitation, map destination, timed waiting/catch-up, arrival dialogue and actions, then return to original position/activity on cancellation.
- Linked NPC groups: one speaker at a time, alternate greetings or author ordered dialogue and synchronized compatible animations; no overlap.
- Consistent Eleven v4 controls, tags, bulk import and generation for supported speaking NPCs. No paid generations without explicit confirmation; keep existing assignments and clips.

Checkpoint 1: isolated pure helpers in void-runner/npc-advanced-interactions.js; smoke checks for speaker exclusivity, alternate turn, visit duration and timeout passed. Not loaded by game yet.

Next: add persistent schema and mirrored validation in mission-content.js and void_runner_live_content.py, editor controls in npc-editor.js, runtime adapters in live-content.js and path/escort adapters; verify script loading and draft/publish flow, audio completion/cancellation and room identity, multiplayer separation, and all existing regressions before merging. Add repository tests for helpers and integration before release. Do not treat this checkpoint as a complete implementation.

## Additional approved requirement: cross-area daily itineraries
- Select ordered destinations (home apartment, optional noodle stand, Iris's store, home) and dwell/activities at each. Connect destinations via existing walkable area links, gates and apartment/vestibule doors with appropriate access checks; do not teleport visible NPCs or bypass security.
- Reuse existing escort cross-area navigation where appropriate; current ordinary NPC paths are restricted to a single area. Keep existing single-area paths unchanged. Handle unavailable routes, scene unload and re-entry, and return home safely.
- Iris relationship visit: ambient partner conversation and compatible animations may continue while another player receives a private Comms mission call. Local in-person mission interactions take priority; resume afterward. Mission 011 evidence handover includes Iris; Mission 012 tutorial is remote. Test with two clients.
