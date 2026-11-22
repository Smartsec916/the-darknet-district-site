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

- Tier policy (owner clarification): Tier 1 ambient filler stays within its local area and never crosses vestibules as part of ordinary wandering. Cross-area itineraries and vestibule navigation are opt-in for Tier 2 and Tier 3 NPCs only. Preserve existing crowd budgets and local movement; test that Tier 1 cannot enter the cross-area planner.

## Crowd checkpoint
- NeoChinatown ambient walker targets 12/28/44 -> 8/20/31 (Low/Medium/High), standers and diners also reduced roughly 30%; cook/vendor configuration unchanged. NULL ambient count reduced by one per preset (6/9/10 total; named NPCs and staff retained). Syntax checks passed; regression testing pending, including monk counts and nightclub cast assertions.
- Add NPC Tier selector in editor and independent configurable Tier 1 density by area. Tier 2 and 3 must never be hidden or culled merely because of graphics quality or crowd-budget governor; preserve normal off-screen/unloaded-area optimizations and schedule state. No changes deployed yet.

## Owner-approved execution order (22 Nov)
1. Finish Advanced NPC interaction editor, timing, room triggers, dialogue branches, follow/return and arrival actions; Eleven v4 controls and linked group conversations. Test and checkpoint.
2. Finish companion residence/relationship visit support, cross-area Tier 2/3 itineraries, explicit tier selector and protected visibility; verify Iris remote calls do not interrupt unrelated local social interactions. Complete crowd-density changes and regression checks.
3. Tier 3 awareness and configurable reactions, compatible animation assignment; staged player hand-to-hand combat beginning in underground fighting ring, first-person arms only in combat, rounds and server-validated credit rewards. Preserve exploration and missions.
4. Underground entrance audit: Avenue, Old Town/NULL and Far South, both directions; clear visual and collision obstructions at door, stair and landing, improve localized lighting and obvious route to main tunnel; retain security and ambience. Verify actual walks and existing mission/escort routes.
Keep separate commits, update this handoff at each completed stage, and do not claim deployment until verified. The current checkpoint is not a complete implementation.

## Tier perception editor (owner addition, 22 Nov)
- Add optional Advanced > Awareness settings with editable sight range (feet), horizontal field of view, line-of-sight/obstruction checks, hearing range by event (walk, sprint, combat), and individual reaction rules. Tier 1 uses cheap local checks only; Tier 2 supports bounded event-driven perception; Tier 3 supports configurable investigation, suspicion and memory. Do not equate detection with omniscience or let NPCs see through walls.
- Map/3D developer preview: selectable NPC, directional sight cone, hearing radius and occluded regions where supported; display test event and detected/not detected state. Debug overlay is developer-only and off by default; use existing units conversion, collision geometry and movement state. No per-frame raycasts for entire crowds; stagger and bound active sensing. Test Dax, quiet versus sprinting player, blocked sight, distance limits and separate multiplayer event scope.

- Awareness/device extension: expose the NPC's assigned device (V1, V2 where available, V3 // Shadow or none), using its existing canonical equipment assignment. Separate normal vision from active device-assisted range and field of view; Shadow is integrated in the eye for equipped elite NPCs, no forearm hologram. Preview both sensing modes. Optional night vision and thermal modes as independently configurable future capabilities, with light/heat and obstruction rules; never treat thermal as unconditional through-wall vision. Preserve existing player Shadow zoom and device behavior. Thermal/night vision are exploratory features, not yet implemented.
