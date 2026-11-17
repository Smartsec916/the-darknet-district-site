# NPC logic audit

16 November 2026. Baseline `origin/main` `81e802e9`. This is an evidence-led first pass over the running District and the NPC systems. Remaining browser routes are listed below for the next audit pass. No NPC runtime or production service was changed.

## Executive summary

The game has animated populations and several purposeful local routines. The District's seven ambient residents follow clock-based trips between home, arcade, shop and bar. Dax has her own clock-based route and visible device eye effect. The Outskirts has 7 to 16 decorative residents by quality setting. These are distinct systems. There is no game-wide tier assignment or enforced 20% intent-driven population. Most street and venue figures animate at fixed points or traverse fixed short paths. The broad food, work, taxi, home, social and pursuit sequences in the design brief are not present as complete NPC behavior pipelines.

## Runtime evidence

A local Babylon browser run on this commit entered the District interior with API requests isolated. After five seconds the scene had 906 meshes and 14 playing animation groups. The scene contained Admin, Iris, Nyx, VR players and several `crew-*` figures. `VoidDistrictLife` was loaded and Dax's schedule reported her walking toward the vending machines. No page error occurred. A second browser run entered the NeoChinatown street at its default spawn. After five seconds it had 276 meshes, one playing animation group and no `crew-*` transform nodes at that camera position. This is a local observation at the landing area, not a conclusion about the whole street. This verifies loading and activity for those scenes, not collision, synchronized multiplayer state or the other venues. The probe was run on Low quality in Edge with local hosting and is reproducible with `enterWalking('darknet-district',{silent:true})` after initializing a free-travel test state.

## Population inventory

| Population | IDs and location | Model and activity | Status |
| --- | --- | --- | --- |
| District named residents | Admin, Iris, Nyx, Rin, Jonah, Sable, Cade, Lumi, Kei, Mags, Tavi, Bishop and Dax in `district-people.js`; DJ Vanta in NULL | Own models for several, crowd looks for others. Profiles, jobs and some social follow state are data in `district-people.js`. | Defined. Admin, Iris and Nyx were observed in the District scene. Others require individual interaction checks. |
| District ambient crew | Seven IDs in `district-life.js` | Home, arcade, shop and bar rounds, with walk and stay clips. Oxygen masks at some bar stops. | Runtime module loaded. Route endpoints need collision validation. |
| Dax | `dax` | Licensed `npc-dax.vrpak`, seven interior stops, deterministic route and V3 eye indicator. | Scheduled position observed. Dialogue, player memory, recruiting and bounty actions are explicitly future stages in `dax.js`. |
| Outskirts | 16 `os-*` entries in `ncz-outskirts-life.js` | 7, 15 or 16 spawned by Low, Medium, or High/Ultra quality. Some use short back-and-forth walks. | Planned and implemented locally. No dialogue, mission, collision or multiplayer sync by design. |
| Milked | Eva, Fish and four `milked-dancer-*` entries in `milked.js` | Named staff and four studio dance loops. | Defined. This audit has not replayed the full venue transition. Milked mission remains inactive. |
| VR Play Area | `vr-player-a`, `vr-player-b` in `neochinatown.js` | Fixed booth figures with animation. | Defined. No general task planner. |
| Station crews | `crew-*` actors in `babylon-renderer.js` and station activity data | Activity points and animated state transitions. | Defined. The browser route and door interactions remain unverified here. |
| Other venues and streets | NULL, NeoChinatown, Corporate and Temple use their own scene data, crowd casts and interactions. | Most sampled actors are fixed or follow local scripts. | Full character-by-character runtime inventory remains open. |

## Architecture and feature status

- **Tier 1 works in several forms.** `crowd.js` chooses and controls clips, including culling and animation variants. `ncz-outskirts-life.js` plans static and short-route residents. `babylon-renderer.js` drives station activity actors.
- **Tier 2 is partial.** `district-life.js` completes home Ã¢â€ â€™ destination Ã¢â€ â€™ destination Ã¢â€ â€™ home movement for seven residents. At the arcade and store, arrival selects an animation and timed stay. There is no purchase or inventory transaction. Bar oxygen mask behavior is visible. No system-wide Tier 2 ratio exists in these modules.
- **Tier 3 is partial.** `dax.js` produces a shared-by-clock route and device eye effect. The file explicitly defers player memory, dialogue, recruitment, bounty behavior and life outside the District. No active API-backed NPC decision loop was found in these modules.
- **Navigation is authored.** District routines and Dax use manually specified hallway routes. Outskirts walkers move between two coordinates. These are neither navmesh paths nor dynamic obstacle avoidance. Station activities use their own activity points. A cross-location NPC route network was not found.
- **Animation is functional but specialized.** `crowd.js` blends and avoids restarting a playing clip. `anim-library.js` applies compatible licensed motion to a model's skeleton. The renderer maps activity states to clips. Eating, photographing, sneaking and prop handoff synchronization have no demonstrated generic implementation.
- **Social data is limited.** `district-people.js` stores follows in a save flag. Dax's V3 has a visual state. The audited routine modules do not open an interactive V1, send messages, take photos or share feeds. Player privacy and multi-user interactions need a separate runtime test.
- **Multiplayer NPCs are client-local.** `remote-players.js` handles other players. Dax and District residents derive positions from the clock, so clients can agree on an approximate location without server ownership. Local animations, interactions and transient crowd state are not server-authoritative in these modules.
- **Developer Studio is partial.** `admin/studio.js` offers a mission and dialogue flowchart. Its NPC panel reads the voice registry and shows metadata. It does not edit NPC behavior or routes. `docs/development/DEVELOPER_STUDIO.md` likewise lists NPC metadata editing as future work.

## Performance

The District smoke run measured scene size and playing groups only. It is insufficient for per-NPC CPU or GPU conclusions. The existing performance script first failed because its Chromium Headless Shell was not installed. A temporary Edge-channel copy did not reach its benchmark output during the observation window and was stopped. No performance result is claimed. `tests/perf-crowd-browser.cjs` contains a controlled `Scene.animate()` benchmark and a visible-crowd check. Run it on the baseline and a candidate change before prioritizing animation optimizations. The Outskirts caps populations by graphics tier and skips far-away actors. Counts of 25, 50 and 100 are not supported by that population and should not be fabricated from it.

## Prioritized work

| Priority | Improvement | Impact and approach | Main files | Risk |
| --- | --- | --- | --- | --- |
| P1 | Verify authored routes against current collision and doors | Prevent walkers crossing changed geometry; sweep every sampled segment and report blocked points. | `district-life.js`, `dax.js`, `neochinatown.js` | Medium |
| P1 | Run a venue-to-venue NPC browser trace | Record positions, clips and stuck periods in street, NULL, Milked, Corporate and Temple. | `tests/*browser.cjs` | Low |
| P1 | Validate model and clip availability for every named figure | Catch hidden characters and silent fallback after assets fail. | `district-people.js`, `crowd.js`, asset registry | Low |
| P2 | Define a small intent-driven street cohort | Give selected walkers reachable destinations with arrival, dwell and return states. Measure ratio in the actual spawned population. | street population modules | High |
| P2 | Give food stands a complete visit sequence | Approach, order, receive, eat and leave with prop timing. | street layout and interaction modules | Medium |
| P2 | Add stuck recovery for dynamic route followers | Detect no movement and retry or return to a known safe point. | life and station activity modules | Medium |
| P2 | Audit animation cadence and foot sliding | Compare displacement to clip phase and blend at transitions. | `crowd.js`, `anim-library.js` | Medium |
| P2 | Expose NPC identity, route and clip validation in Studio | Let developers see why a character is absent or unreachable. | `admin/studio.js`, `admin/studio-model.js` | Medium |
| P2 | Add NPC device actions connected to a task | Start with a visible check-message action and privacy-safe local state. | `district-life.js`, device modules | Medium |
| P3 | Expand Dax after canon decisions | Implement approved player recognition and encounter rules, then test multiplayer consistency. | `dax.js`, social and mission modules | High |

## Remaining verification

The current run did not walk NPC routes or test collision. Individual named interactions, save restoration, scene transitions, studio editing and multi-client behavior remain unverified. No 10/25/50/100 population benchmark was run. Those observations need browser captures and measured traces before declaring a route reliable or a performance bottleneck.
