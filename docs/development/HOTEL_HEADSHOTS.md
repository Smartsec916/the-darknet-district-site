# Hotel Headshots

18 November 2026. Branch `codex/hotel-headshots`, based on `origin/main` `ad2ef321`. Playable implementation, **not merged or deployed**.

## Owner's direction

Five-floor, nonlethal first-person arcade shooter with money theft, evasive play, a foam blaster, defensive hit detection and local high scores. The owner subsequently specified **neon, slightly cyberpunk, not fancy**, a **centered blaster**, and **no gray or white attachments on the blaster**. Those corrections supersede the initial luxury hotel treatment. The weapon now has only a tan barrel, tan nozzle and tan grip, centered below the crosshair and brought close enough that its circular back end is out of view. The owner’s subsequent width adjustment narrows it by approximately 14% without moving it.

## Play

Run `node tests/serve-modern.cjs`, then open `http://127.0.0.1:5187/hotel-headshots/index.html` on desktop. WASD moves, mouse aims, left click fires (hold for automatic fire), Shift sprints, E interacts, Escape pauses. The canvas renders at 1024 × 768 and the entire game frame, including menus, scales at 4:3. Pointer-lock loss, tab hiding and window blur pause the game.

Enter through the front door and pay the receptionist $250 from the initial $10,250, leaving $10,000. Guests begin pursuing after payment. Free refill tanks replenish the 48-shot reservoir. Climb the east staircase and press E at the landing to load the next floor. Floors 2–5 also offer a return stair interaction. Money, ammo and repelled count carry across floors; revisited floors remember doors and guest resistance/retreat state. The fifth-floor rooftop checkout ends the run. Zero money ends it immediately.

## Implementation

- `hotel-headshots/rules.js`: five different connected layouts, difficulty parameters, navigation, line of sight, payment/theft, resistance, progression and leaderboard sanitation. Runs in both Node and browsers.
- `hotel-headshots/scene.js`: original procedural meshes and textures, adult-proportioned guests with six appearance variants, articulated walking/running/guard poses, neon hotel fixtures, furniture, doors, pool, mirrors, curtains, bottles and stairs. Uses the existing locally vendored Babylon 8.26 engine; no dependency or paid asset added.
- `hotel-headshots/game.js`: input, swept projectile collision, nearest-mesh hit regions, damage/retreat, pursuit/search/roaming/pathfinding, NPC door opening, separation, theft cooldowns, recoil, temporary foam decals, environmental impacts, synthesized soundtrack and effects, menus and storage.
- Head hits remove 100 resistance, torso/legs 50, arms/hands 15. Higher-floor guests have more resistance. Raised arm meshes physically intercept shots before the body. Retreating guests cannot steal and count only once.
- Free tanks cannot soft-lock an empty-ammo run. Navigation routes around furniture and walls; doors can be opened by pursuing guests. Movement is normalized diagonally. Collision and effect counts are bounded.
- Storage is isolated to `hotel-headshots-settings-v1` and `hotel-headshots-scores-v1`. The leaderboard is **local to this browser**, not a global or server-verified score service. Storage failure is handled, and a failed score write is reported on victory.
- Debug mutation helpers exist only with `?test=1` on `localhost` or `127.0.0.1`; the normal public diagnostic API returns a state snapshot only.

## District and website integration

The games list has a Hotel Headshots card in root and static copies. Cabinet 1 (`arcade-cab-01`, formerly LASER MOTH) now runs `hotel-headshots/index.html` through the existing isolated arcade iframe. TURBO KELP remains unused. The cabinet has its own title, colors, poster, interaction and four-frame attract image captured from the game's actual opening screen. The existing anti-WarFlying screen is retained in place; only its obsolete `replaces: laser-moth` metadata is removed.

The existing rule that every playable cabinet has a highest-score achievement and Dax holds those cabinet achievements is extended to this title. This is catalog/profile metadata only: the local leaderboard does not grant a verified District achievement. The read-only admin inventory is regenerated. District service-worker build: `2026-11-18-hotel-headshots-2`.

No Sleeping Pod, music-player, account/save implementation, production API, merchandise, entitlement, payment or licensed-model file changed. The District HTML entrypoints remain unchanged and byte-identical.

## Verification

- Full Node suite: **1,164 passed, 0 failed, 1 skipped** (1,165 total).
- Save compatibility: **19 Python tests passed** (`tests.test_story_save`, `tests.test_progression_save`).
- Account/API contracts: **35 Python tests passed** (`tests.test_void_runner_api`, `tests.test_identity_api`), using their fake services, not production data.
- `node tests/hotel-headshots-browser.cjs`: real Edge/WebGL rendering; pointer lock, movement, entrance, payment, pause/resume, actual projectile headshot, arm interception, live theft and harmless retreat, refill, all floor transitions, victory, bankruptcy, persisted leaderboard and 4:3/native resolution. Also regenerates cabinet captures. Screenshots are inspected, not just created.
- `node tests/hotel-headshots-district-browser.cjs`: real District creator, own Sleeping Pod entry/exit, cabinet interaction, iframe gameplay and return to walking; no page errors. External services are blocked/mocked in this local test.
- The browser scripts start and stop a local server at port 5187; run one at a time and close any existing host on that port first. They use Edge on Windows.

## Visual limits / further polish

This is playable original procedural art, **not a photorealistic or AAA character-asset pass**. Faces, swimwear, furniture and room fittings remain simplified, and the walking/guard poses use an articulated procedural rig rather than captured animation. The five floors are separate scenes connected through stair interactions, not one continuously loaded tower. Real-GPU performance, headset controls and audio by ear have not been certified. Local software-rendered browser checks prove operation, not a target hardware frame rate. No paid generation, model purchase or licensed asset import was performed.

See the checked screenshots in `hotel-headshots/` alongside this document. Do not publish without the owner's release instruction.
