# Dax's editor-driven routines — Issue #522

## Owner's decision

Remove Dax's hard-coded wandering, daily itinerary and automatic disappearance from **actual gameplay**. The existing Dax (one licensed character) must be controlled by Developer Tools → NPCs, requiring no mission. If no plan exists she stands still in the District.

## Implemented in draft PR #523 (not merged or live)

- `dax-editor-routine.js` supplies deterministic stationary, stay, and looping waypoint states and accepts **world-map** coordinates from the editor, converting them to Dax's interior plan coordinates with the NeoChinatown door transform.
- `npc-paths.js` registers the existing `dax` ID as an editor-movable character, using its existing `npc-dax` animation list. Initial editor placements and routes are validated **inside the District only**; unsupported areas return errors rather than showing a ghost actor.
- `void-runner.html` loads the routine evaluator before `dax.js`.
- The **in-game Dax actor now reads published or local-test NPC plans** from `VoidLiveContent.current.content.npcs.dax` and resolves the current block with `VoidNPCPaths.planNow()`, then drives its existing licensed 3D actor from the evaluator. The legacy `schedule()` functions remain exported for compatibility tests only; the live frame loop no longer calls them.
- When no plan is configured she remains in the safe hallway at plan x=1.6,z=54.5. The evaluator never creates a second character.
- Daily schedule block selection uses **shared UTC time**, rather than each player's personal save clock, so multiplayer clients agree on Dax's position. Verify this design decision against game design expectations before release.
- Added source-level runtime and pure evaluator tests under `tests/dax-editor-routine.test.cjs`.

## Outstanding and blockers

1. Run full GitHub CI, fix failures. Repository's generated `void_runner_admin_inventory.json` will drift when `npc-paths.js` or other source changes; regenerate using `node tools/admin-inventory.cjs` and commit projection before merging.
2. Add browser runtime checks with the **licensed Dax model** and a missing-asset fallback. Verify floor alignment, smooth route transitions, idle/walk clips, no duplicated Dax, and multiple clients seeing same position.
3. Verify that Dax's existing NPC Editor entry offers the correct District map and schedule controls. The editor still lists other areas in some global selectors, even though validation restricts Dax to District; filter unsupported choices in UI. Expand to NeoChinatown and other interiors **only** after distinct scene runtime transitions work.
4. Test publishing a real Dax stay, route, schedule, and clearing/resetting a plan; ensure live content validation allows it without a mission. The previous tests in `tests/dax.test.cjs` still exercise legacy pure itinerary functions; replace them once that code is retired entirely.
5. Decide whether editor scheduling should use UTC time (shared multiplayer) or a new synchronized game-world clock; do not reuse save-local game time for a shared NPC.
6. On complete tests, merge through normal rules, deploy, verify the live game; keep PR draft until then.

**Separate independent work:** Companion importer #520 / PR #521; Desire #524. This Dax branch does not add any model files or alter missions.

## Subsequent implementation: editor UI and multi-action behavior

- `npc-map.js` now restricts Dax's map-area picker to **District interior** until scene-specific outside routing is available, avoiding misleading location options.
- `npc-paths.js` allows Dax's legitimate adult-access bar, VR and arcade positions in the District, consistent with her original gameplay visits; street locations remain rejected.
- The routine engine now cycles through the owner's selected stay actions, instead of playing only the first action forever.
- Added regression checks for the map picker, interior-only restriction, and stay-action cycling.

### Remaining work only
- Rebuild `void_runner_admin_inventory.json` from the source with `node tools/admin-inventory.cjs` and commit; verify all CI, including the newest Dax-specific tests. Prior repo tests also showed inventory drift.
- Perform browser runtime testing with Dax's licensed private model (floor/collision, animations and transitions, multiplayer same-place check, publish/clear schedule/route, no duplicates).
- New areas outside the District still require dedicated spawn/scene/transition support, not just a dropdown unlock.
- Decide whether Dax's daily editor schedule should follow the synchronized UTC clock currently implemented or a future shared in-game world clock. Do NOT switch back to per-player save time; that would desync her between players.
- After acceptance tests, merge PR #523 and deploy. The PR is still draft and no live Dax behavior is changed by these commits.
