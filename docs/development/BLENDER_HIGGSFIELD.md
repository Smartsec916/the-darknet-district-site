# Blender and Higgsfield MCP: status and first asset

**Status (15 Nov 2026): NOT FUNCTIONAL from the Claude Code cloud session. Do not describe the integration as working.** No Blender object has been read or changed through it, and no asset has been created.

## Reported local setup (from David; not independently verifiable from the cloud session)
- Blender 5.2.3 LTS, Windows. Higgsfield Blender extension 1.5.61 (updated from 1.5.59), **MCP Control enabled**, the Higgsfield MCP panel shows **Connected**.
- Claude custom connector **Higgsfield Bridge**, URL `https://bridge.higgsfield.ai/mcp`, authenticated. Claude recognises about 182 tools (`ae_*`, `pr_*`, `bl_*`, `c4d_*`, plus `get_host_status`). The connector tool list was refreshed in Claude Desktop.

## The unresolved fault
In the Claude Code **cloud** session, `get_host_status` returns `{"aeft":false,"ppro":false,"blr":false,"c4d":false,"3d_bs":false}` and a read-only `bl_get_scene_summary` fails with: *"Blender is not connected. Open the Higgsfield panel in Blender and press Connect in 'Supercomputer Connection'."* Observed repeatedly on 15 Nov 2026, before and after the 1.5.61 update and the tool-list refresh. All hosts are false, not only Blender.

The Blender extension saying "Connected" does **not** prove this session can reach it. **Leading hypothesis (not confirmed):** this cloud session holds an outdated or different connection to Higgsfield's host relay (connectors are read when a session starts, and a Claude Desktop refresh does not reach an already-running cloud session). Alternatives not yet ruled out: the connector and Blender are signed in to different Higgsfield accounts; the "Supercomputer Connection" section (named in the error) is a separate connection from the "MCP" panel and is not connected; a Higgsfield-side registration problem. The bridge has no tool that reports account identity.

**Already done, do not repeat without new evidence:** extension installed and enabled; updated to 1.5.61; MCP Control on; MCP status checked; connector configured and authenticated; connector tool list refreshed; `get_host_status` tested repeatedly.

**Exact next test:** start a **new regular Claude conversation** (Claude Desktop, or a brand-new session) with Blender open and MCP Control on, and call `get_host_status` first, before any scene change. If `blr` is true: do the read-only inspection (`bl_get_scene_summary`, `bl_get_object` on the cube; report objects and dimensions in metres) and only then build. If it is still false in a fresh session: check that "Supercomputer Connection" in the Blender panel is connected, that both sides use the same Higgsfield account, and escalate to Higgsfield support with extension 1.5.61.

## Rules for using the Blender tools (from the bridge's own instructions)
Right-handed, Z up, metres, radians. Before building or changing a scene, load the bridge skills with `bl_get_skill` (`blender-scene` first, then only the modules the task needs; the audit/finalize gate last). Prefer a specific `bl_*` tool over `bl_execute` (arbitrary Python). Save only when David asks. Generation tools spend Higgsfield credits: do not use them without an explicit request. Do not use the After Effects, Premiere or Cinema 4D tools for game work.

## First planned asset: modular hallway wall (NOT started, NOT exported)
- Size: **4 m wide, 3 m high, 0.2 m thick.** The open Blender scene reportedly holds a resized default cube standing in for it; **its scale has not been applied** (apply scale before any modelling or export). I have not seen that scene.
- Design: worn gunmetal architectural panels; industrial reinforcement; maintenance access panels; cable conduits; ventilation; controlled recessed lighting (accent, not outlines); wear, scratches, stains, grime; **seamless horizontal tiling**; PBR materials; a Babylon.js-compatible GLB.
- Purpose: a small test of the whole Blender-to-game workflow before larger rooms.
- Must follow `docs/VOID_RUNNER_ART_DIRECTION.md` (PERMANENT DIRECTION) and the existing kit conventions in `docs/development/BUILDING_KIT.md` (the current kit is built by code with `bpy`: `tools/assets/kit/build_kit.py`, `kit_textures.py`).

## Blender-to-game workflow (once the connection works)
1. Read the game's real dimensions and coordinates (`neochinatown.js`, District interior files, collision `solids`); do not guess. 2. Build reusable modules. 3. Then rooms and sections. 4. Check dimensions, topology, materials, UVs. 5. Export optimised GLB. 6. Integrate in Babylon.js. 7. **Keep existing collision, navigation, doors and triggers working.** 8. Check NPC and multiplayer compatibility. 9. Test rendering and performance on PC hardware (software-rendered cloud numbers do not count). 10. Update docs and the asset inventory. A good-looking Blender scene is not automatically game-ready.
Licensing and packaging: `docs/VOID_RUNNER_ASSET_LICENSES.md`, `docs/VOID_RUNNER_ASSET_PIPELINE.md`; purchased or licensed models never go in the public repo.
