# THE DARKNET DISTRICT // DEVELOPER STUDIO (foundation, local, 14 Nov 2026)

`admin/studio.html` (+ `studio.js`, `studio.css`, `studio-model.js`). One page with the twelve tabs, each marked WORKING, PARTIAL (read-only) or PLANNED. Nothing here publishes anything.

## Reuse, not a new system
- **Sign-in and authorization:** the same Firebase sign-in as the content atlas (`../firebase-auth.js`) and the same server check (`GET /api/void-runner/developer/content`, administrator allow-list verified by the server on every call). A 401/403 keeps the Studio locked and draws nothing. The page holds no GitHub or publishing credential.
- **Stage 3 tools stay:** the content atlas, private drafts and release candidates (`admin/void-runner.html` and the server routes) are untouched and linked from the Dashboard. They remain the way to work on the archived mission and dialogue records.
- **Identities:** NPCs are the entries of `tools/audio/npc-voice-registry.json` (the Studio reads it, never keeps a second list); interaction points are the real layouts (`void-runner/neochinatown.js`); mission and dialogue records are the data in `void-runner/beginner.js`, the same structure the game runs.

## Working today
- **Missions:** create, edit, delete; id, title, type, giver (existing NPCs), location, reward, prerequisites, objectives (label, completion event, requirements, interaction/waypoint); live validation; mission-flow chart; "preview" that plays the chain with its own events and reports anything stuck; diff against the shipped definitions; change summary; export of a draft as JSON (marked `DRAFT · not published`).
- **Dialogue:** per mission and objective, the lines spoken on completion and the "too soon" branch, speakers chosen from known NPCs/speakers, a flowchart, validation of missing links and unknown speakers.
- **Read-only:** NPCs (registry, role, voice status, the missions each NPC gives, interaction point) and Locations (every District and street interaction point and the objectives that use it).
- **Settings & Publishing:** what must exist before publishing is switched on, with honest READY / NOT READY.

## Not built (do not present as features)
Characters, Animations, Asset Library, Stores & Items, Factions & Progression, Social & V1 (each tab says what exists in the repo today). Draft → pull-request publishing, rollback, audit trail and reviewer separation are NOT built: the publish button is disabled. Drafts are local to the browser (`studio-drafts-v1` in localStorage) until a server-side workflow exists. The old unmerged publishing PR (#195) was not merged.

## Asset Library plan (not started)
A local indexing service bound to 127.0.0.1 only, with a configurable folder path (the previously named Windows folder may have moved and was not visible from the cloud session), licence notes per pack (AI-processing and redistribution limits), no upload of purchased assets to public GitHub and no automatic extraction of large archives.

## Proposed next steps (need David's approval)
1. A server endpoint that turns an exported draft into a pull request with a server-side token (backend change).
2. Audit trail and reviewer role (extends the existing allow-list).
3. NPC metadata and interaction-point editing writing to the real registry and layouts.
4. Persist records for the archived missions in the same shape so one editor covers them.
