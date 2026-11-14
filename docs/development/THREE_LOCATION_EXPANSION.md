# Three-location expansion: Milked, Corporate District, Zen Zephyr Temple

**Owner-approved scope, recorded 15 Nov 2026 from the working session** (the original brief existed only in chat until now). Order is fixed: **Milked, then Corporate District, then Zen Zephyr Temple.** One branch, one PR, full tests, a real-browser walkthrough with screenshots, merge, and a live verification for each, before the next starts. Never combine them. The owner approved merging and deploying each PR once its checks pass.

## Status at a glance

| Location | Status | Evidence |
|---|---|---|
| **Milked** | **Deployed** (PR [#265](https://github.com/Smartsec916/the-darknet-district-site/pull/265), `3129a09`). Verified locally and against the live site in a real browser. | `docs/development/MILKED.md`, `tests/milked.test.cjs`, `tests/milked-browser.cjs`, `docs/development/milked/` |
| **Corporate District** | **Planned, not started.** No branch, no code. Only the old placeholder plaza and sign exist. | `neochinatown.js` `districts` entry `corporate` (`placeholder:true`, plaza `streets.corporate = [-120,-60,-40,15]`, taxi zone `corporate`) |
| **Zen Zephyr Temple** | **Planned, not started.** No branch, no code. | Design material only: `VISUAL_REFERENCES.md` "Zen Zephyr", `origins/index.html` scenes |

Nothing from an earlier unfinished attempt by another agent exists: no branch, PR or code mentions these three places other than the placeholders above (searched 15 Nov 2026).

## Shared rules (all three)

- Lights: at most 8 affecting any material, at most 12 active per scene; neon is mostly emissive. Scale quality with the existing `low`/`medium`/`high`/`ultra` tiers and never override the player's graphics choice.
- Streaming: nearby objects load at about 90 m and unload beyond about 140 m, with hysteresis. Corporate and Temple use **independent area loading and disposal**, not those thresholds.
- Desktop and VR-style play only; do not break `device-gate.js`.
- Protected: the Sleeping Pod room, bedroom music player, VR play-area layout, licensed companion assets, unrelated store systems. Keep the landing pad clear (x 13 to 37.5, z -106 to -86).
- No proprietary models in the public repo (private asset process). Primitives and generated textures preferred. All NPCs clothed.
- No Earth/Sacramento terminology, no old Vesper opening. Keep internal ids (saves depend on them).
- Update the service-worker `BUILD`, keep `void-runner.html` and `static/void-runner.html` identical, no backend, Firebase, Neon, Render or secret changes, no new paid APIs.
- Each PR updates `AI_HANDOFF.md` and documents replacement points for its characters.
- **New work must also meet the permanent art direction** (`docs/VOID_RUNNER_ART_DIRECTION.md`). Milked predates it.

## CORPORATE DISTRICT (not started)

Approved requirements, as given:
- A **separate area about 1.8 km from central NeoChinatown**, with its own scene load and disposal (not distant geometry in the always-active street scene). While active: NeoChinatown detail is not rendered; use a cheap distant skyline backdrop; game state and V1 stay available; the player's return location is preserved.
- **Travel by sky cab, fare 60 CR (the existing maximum), with a return cab.**
- **Reusable 3D sky-cab transition** (also used by the Temple): the player stays visually inside a small, instantly loading 3D cab interior (seats, teal and magenta dashboard glow, fare readout, rain on the windows, blurred neon outside, subtle motion, progress feedback). Real 3D geometry, desktop and VR-style first person. The destination loads asynchronously and the scene switches only when ready; failed loads recover the fare and location; do not keep origin and destination loaded together longer than needed.
- **Environment:** rainy teal glass skyscrapers, corporate plazas, vertical neon, wet pavement, billboards, elevated walkways, service entrances, narrow alleys, loading bays, security checkpoints, distant skyline. Several routes, including **one back alley suitable for a future break-in mission**. Readable navigation and collision.
- **Security robots** (reusable, from Babylon primitives): bulky humanoid, matte black segmented armour, rounded faceless helmet, red/pink eyes, small orange chest light, side hoses, back antenna, black rifle held low. **Passive in this release.** Near a protected entrance a guard says "State your business." No combat. Provide a clean hook for later escalation.
- **Drones and cameras:** overhead patrol drones (repeatable routes, blinking lights, smooth turning, quality-scaled counts); security cameras (rotating head, red indicator, sweeping detection cone, predictable timing, blind spots). Prefer proximity or timed checks over per-frame cost.
- **Stealth:** detection reduced by crouching, shadow zones, solid cover, dumpsters and crates, dark doorways, passing under walkways. Real gaps in patrol and camera timing; dark lanes next to lit surveillance areas. Feedback: normal (none), suspicious (yellow), detected (red); it rises and falls predictably; a detected player is challenged or warned, **not attacked**. Use geometry, line of sight, cover volumes and defined light zones, not "visual shadows". Reusable detection hooks for later missions.
- **Corporate V1 Map:** its own map view (streets, buildings, alleys, guarded and service entrances, taxi stop, explored/unexplored fog, player, waypoints). Fog saves and restores. Corporate appears as a taxi destination on the city map. Existing map saves must not break.
- **Tests required:** taxi destination; 60 CR cap; fare handling; shared transition; scene load/unload; guard challenge; passive behaviour; drone patrols; camera sweep; detection states and modifiers; map fog and persistence. Acceptance: pay 60 CR, ride, arrive, explore, see robots and cameras, hide, get challenged, open the map, return by cab, keep exploration after reload. Screenshots: transition, skyline, street, guard, drone, camera, detection indicator, hiding place, map.

**What exists today:** the placeholder plaza west of the Avenue, a taxi zone `corporate` marked placeholder, and a "Corporate District / PLACEHOLDER" sign. Sky-cab and road-taxi rules live in `taxi-rules.js`, `city-taxi.js`, `road-taxi-rules.js`. The current sky cab flies inside the one street scene; the scene-switching transition does not exist yet. `district-transition.js` / `district-area.js` already load the District interior separately from the street and are the closest existing pattern. The V1 map (`district-map.js`) has one coordinate space (street and interior); a second map space does not exist yet. The unrelated "Corporate Zombies" arcade cabinet (#257) is a different thing.

**Missing decisions (do not invent):** the district's name and corporate identity (companies, logos, branding); what it is for in the story; any NPCs or dialogue beyond the guard's one line; whether the break-in mission exists and what it is; exact map extents and the fare formula versus the flat 60; whether the guards ever escalate; progression or rewards. Propose options to David for anything story-related.

**Next action:** a branch from `main`; read `district-transition.js`, `district-area.js`, `city-taxi.js`, `taxi-rules.js`, `district-map.js`; design the reusable cab-transition and the second scene lifecycle first; write the unit tests; then build the area.

## ZEN ZEPHYR TEMPLE: Sanctum of the Circuit (not started)

Approved requirements, as given:
- A separate, **taxi-only hilltop location** overlooking the distant NeoChinatown skyline; uses the same reusable sky-cab transition; has a return taxi. Serene, technological, mysterious.
- **One complete walkable meditation chamber:** layered 3D-printed technological walls, tall server pillars, hanging cables, light mist, glossy reflective-looking floor, blue-flame incense, glowing data altars, a central meditation dais, the skyline visible from the hill. Emissive lighting and cheap effects; no heavy dynamic reflections or volumetrics.
- **Zen Zephyr** (placeholder monk, seated on the dais): silver head, closed eyes, dark robe, mustard sash, mechanical details, teal chest lights, calm seated posture. One documented model replacement point. Interactable.
- **Local chat panel:** typed input, about 20 locally stored selectable responses or quotes, including these exact lines: "In the network of complex codes, serenity lies in the simplest line." and "A mindful soul is like a processor; it understands, computes, and calmly executes." Calm philosophical personality; basic keyword/topic matching and a fallback; it must not pretend to be an AI model. A clean optional interface for a future API dialogue system, with **no API costs, credentials or backend dependencies now**.
- **Temple V1 Map:** its own location and view (taxi arrival, entrance, main chamber, dais, data altars, player, fog; saves and restores) and a taxi destination.
- **Tests:** taxi routing and return; shared transition; scene lifecycle; monk configuration; quote responses; chat fallback; map exploration and persistence. Acceptance: take the cab, see the transition, arrive, enter, interact, type, get local replies, use the map, return. Screenshots: exterior skyline, chamber, monk, chat panel, map.

**Source material that exists:** `docs/development/VISUAL_REFERENCES.md` ("Zen Zephyr": an android monk in a misty temple whose pillars are server racks; the picture is still "pending", not in the repo). `origins/index.html` scenes `direct`, `detour` (temple of technology, quantum incense with blue flame), `sanctum_discovery`, `zen_wisdom`, `sanctum_introduction` (Zen Zephyr gives a contact at Milked), `resistance_philosophy`. In Origins the Sanctum is hidden in a pocket of digital space reached through a maintenance door in an abandoned server farm; **the game brief overrides that: it is a hilltop reached by taxi.** A shop T-shirt and the track "Sanctum of the Circuit" already use the name. Origins is mood, not canon, unless approved.

**Missing decisions (do not invent):** the monk's exact name usage and voice (no voice cast; do not assign one without David); the full set of 20 quotes beyond the two exact ones (placeholders only until approved); the hill's map position; relationship to Milked and Eva in the game story; any missions or rewards; whether the optional API dialogue is ever wanted.

**Dependencies:** the reusable cab transition and second-scene lifecycle from Corporate; the map's multi-space support from Corporate. Do Corporate first.

**Next action:** after Corporate is merged and live, branch from `main` and reuse its transition and map-space work.

## Replacement points
- Milked Eva, Fish: top of `void-runner/milked.js` (`MODELS.eva`, `MODELS.fish`, `CONFIG.FISH_NAME`).
- Zen Zephyr monk: to be created with the Temple (must be a single documented point, same pattern).
