# Dax's editor-driven routines — Issue #522

User decision (23 Nov 2026): **remove Dax's old automatic itinerary**, not simply offer it as the default. Dax is already in the NPC list; she has no missions and should need none. She must be controllable by the NPC Editor's stay, route, animation, and daily schedule controls, with a safe stationary position until the owner configures one.

## Current draft stage
Added `void-runner/dax-editor-routine.js`, a small **pure, deterministic** interpreter for a validated NPC plan: stable default in the District, editor stay, editor path with waypoints/hold durations, and animation names restricted to the clips Dax actually has. The interpreter does not call the legacy autonomous schedule. Added targeted Node tests.

**Not connected yet:** the live Dax character still uses `dax.js`'s old schedule on main and on this branch. This draft is deliberately not merge/deploy ready. Do not claim the user has editor controls yet.

## Follow-up: make the actual change safely
1. Register the *existing* Dax id in `npc-paths.js` as MOVABLE with asset `npc-dax`, adult characteristics and safe supported areas/animations. Check `npc-areas.js` permissions and validate plans through the same server inventory and tests. Do not duplicate her avatar.
2. Wire her existing NPC Editor entry into plan editing; preserve the normal save/draft/publish workflow, independent of missions.
3. In `dax.js`, remove the legacy random/hourly itinerary as the live controller. Read the effective published or local-test `content.npcs.dax` plan and `VoidNPCPaths.planNow('dax',{plan,minute})`. Render from the new interpreter's position calculation, exclusively. Do not run two movement controllers.
4. Use the game clock's `minuteOfDay` for schedule blocks. Ensure a missing block or cleared plan means the *stationary default*, not `day()` or random absence. Preserve model, V3 device, eye effect, social profile, licensing and no-doppelganger guarantee.
5. Verify coordinate spaces and collision-safe paths before offering street scenes. `dax.js` uses District plan meters and currently spawns only in interior; `npc-areas.js` editor map coordinates may differ. Convert correctly and add per-scene spawn support before advertising other districts.
6. Replace old `tests/dax.test.cjs` expectations of random hourly travel after the runtime cutover. Add browser play/publish/clear tests, CI, runtime checks with authorized private model, and no-file graceful fallback.
7. Only when complete and CI succeeds: make PR non-draft, merge with normal repo protections and deploy, then check ordinary-player visibility. User already authorized deployment after passing tests.

This work is independent of companion importer issue #520 and PR #521.
