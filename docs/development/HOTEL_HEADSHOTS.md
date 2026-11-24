# Hotel Headshots

Updated 24 November 2026. Branch `codex/hotel-headshots`, based on `origin/main` `ad2ef321`. Playable implementation, **not merged or deployed**.

## Owner's direction

Five-floor, nonlethal first-person arcade shooter with money theft, evasive play, a foam blaster, defensive hit detection and local high scores. The owner subsequently specified **neon, slightly cyberpunk, not fancy**, a **centered blaster**, and **no gray or white attachments on the blaster**. Those corrections supersede the initial luxury hotel treatment. The weapon now has only a tan barrel, tan nozzle and tan grip, centered below the crosshair and brought close enough that its circular back end is out of view. The owner’s subsequent width adjustment narrows it by approximately 14% without moving it.

## Play

Run `node tests/serve-modern.cjs`, then open `http://127.0.0.1:5187/hotel-headshots/index.html` on desktop. WASD moves, mouse aims, left click fires (hold for automatic fire), Shift sprints, E interacts, Escape pauses. The canvas renders at 1024 × 768 and the entire game frame, including menus, scales at 4:3. Pointer-lock loss, tab hiding and window blur pause the game.

Begin inside the front lobby facing reception. Pay the receptionist $250 from the initial $10,250, leaving $10,000. Theft and active pursuit require payment; entering a room can wake its sleeper before payment. Free refill tanks replenish the 48-shot reservoir. Pass through the rear pool door, cross the deck to the enclosed east stairwell, climb the stairs and press E at the landing to load the next floor. Floors 2–5 also offer a return stair interaction. Money, ammo and repelled count carry across floors; revisited floors remember doors, guest resistance/retreat, and sleeping/waking/pool-exit activity. The fifth-floor rooftop checkout ends the run. Zero money ends it immediately.

## Implementation

- `hotel-headshots/rules.js`: five different connected layouts, difficulty parameters, navigation, line of sight, payment/theft, resistance, progression and leaderboard sanitation. Runs in both Node and browsers.
- `hotel-headshots/scene.js`: original procedural environment meshes and textures, neon hotel fixtures, furniture, doors, pool, mirrors, curtains, bottles and stairs. Uses the existing locally vendored Babylon 8.26 engine; no dependency or paid asset added.
- `hotel-headshots/game.js`: input, swept projectile collision, nearest-mesh hit regions, damage/retreat, pursuit/search/roaming/pathfinding, NPC door opening, separation, theft cooldowns, recoil, temporary foam decals, environmental impacts, synthesized soundtrack and effects, menus and storage.
- Head hits remove 100 resistance, torso/legs 50, arms/hands 15. Higher-floor guests have more resistance. Raised arm meshes physically intercept shots before the body. Retreating guests cannot steal and count only once.
- Free tanks cannot soft-lock an empty-ammo run. Navigation routes around furniture and walls; doors can be opened by pursuing guests. Movement is normalized diagonally. Collision and effect counts are bounded.
- Storage is isolated to `hotel-headshots-settings-v1` and `hotel-headshots-scores-v1`. The leaderboard is **local to this browser**, not a global or server-verified score service. Storage failure is handled, and a failed score write is reported on victory.
- Debug mutation helpers exist only with `?test=1` on `localhost` or `127.0.0.1`; the normal public diagnostic API returns a state snapshot only.

## Reference-plan redesign (24 November 2026)

The owner supplied three hotel-plan references and requested real corridors and individual rooms. All floors now use a 31 × 31 collision grid: front lobby and check-in desk, a central hall with a double-loaded cross corridor, separately enclosed bedrooms and bathrooms with usable doors, a rear pool door and a separate stairwell. Reception and Guest Rooms have eight bedrooms; Pool & Spa and Luxury Suites have six; Penthouse has four larger rooms. Pool size, lounge furniture and room divisions vary by floor. Standard guest counts are 10, 14, 18, 22 and 26.

Residents include a desk receptionist, hallway walkers, awake bedroom guests, bathroom occupants, slow sleepers (2.6 seconds), fast sleepers (0.45 seconds), and two swimmers. Entering the assigned room wakes a sleeper; hits also wake them. Wake-up poses blend upright and move off the bed before pursuit. Swimmers use the recessed water area, respond to pool-deck entry, move to the visible ladder, take turns climbing and then join pursuit. Pool water blocks ordinary walking; swimming/climbing guests cannot steal. Retreating swimmers still leave the pool harmlessly. NPC door navigation continues across rooms and bathrooms.

Defensive poses alternate between forehead cover, palms-out and crossed forearms. All three use bone-following hand/arm proxies and pass actual ray-interception checks. `tests/hotel-headshots-residents-browser.cjs` checks room-entry wake timing, bathroom reaction, both swimmers reaching and climbing the ladder, and screenshots of the new scenes. `tools/assets/hotel/render_layouts.cjs` draws the real layout data into `hotel-headshots/floor-1-plan.png` and `hotel-headshots/revised-level-plans.png` beside this document.

## District and website integration

The games list has a Hotel Headshots card in root and static copies. Cabinet 1 (`arcade-cab-01`, formerly LASER MOTH) now runs `hotel-headshots/index.html` through the existing isolated arcade iframe. TURBO KELP remains unused. The cabinet has its own title, colors, poster, interaction and four-frame attract image captured from the game's actual opening screen. The existing anti-WarFlying screen is retained in place; only its obsolete `replaces: laser-moth` metadata is removed.

The existing rule that every playable cabinet has a highest-score achievement and Dax holds those cabinet achievements is extended to this title. This is catalog/profile metadata only: the local leaderboard does not grant a verified District achievement. The read-only admin inventory is regenerated. District service-worker build: `2026-11-24-hotel-headshots-6`.

No Sleeping Pod, music-player, account/save implementation, production API, merchandise, entitlement, payment or licensed-model file changed. The District HTML entrypoints remain unchanged and byte-identical.

## Verification

- Full Node suite (24 Nov): **1,167 passed, 0 failed, 1 skipped** (1,168 total), including embedded model/animation integrity.
- Save compatibility: **19 Python tests passed** (`tests.test_story_save`, `tests.test_progression_save`).
- Account/API contracts: **35 Python tests passed** (`tests.test_void_runner_api`, `tests.test_identity_api`), using their fake services, not production data.
- `node tests/hotel-headshots-browser.cjs`: real Edge/WebGL rendering; pointer lock, movement, entrance, payment, pause/resume, actual projectile headshot, arm interception, live theft and harmless retreat, refill, all floor transitions, victory, bankruptcy, persisted leaderboard and 4:3/native resolution. Also regenerates cabinet captures. Screenshots are inspected, not just created.
- `node tests/hotel-headshots-district-browser.cjs`: real District creator, own Sleeping Pod entry/exit, cabinet interaction, iframe gameplay and return to walking; no page errors. External services are blocked/mocked in this local test.
- The browser scripts start and stop a local server at port 5187; run one at a time and close any existing host on that port first. They use Edge on Windows.

## Visual limits / further polish

The NPC pass (24 November 2026) replaces the primitive figures with three adult MakeHuman/MPFB skinned bodies, textured faces/skin, eyes, hair and original opaque two-piece swimwear. Six clothing palettes and modest build variations are retained. Idle/walk clips are retargeted from the existing public companion; three defensive arm poses (forehead cover, open palms, crossed forearms) blend over locomotion. Bone-following hit volumes preserve head/body/arm combat. The receptionist uses the new detailed guest model, positioned beside the desk terminal. `characters.js` loads these assets before simulation starts. Build source: `tools/assets/hotel/build_characters.py`; asset provenance: `hotel-headshots/assets/README.md`. These are more detailed game characters, not photorealistic scans. Furniture and room fittings remain procedural. Running scales the walk cycle. Sleeping, waking, backstroke and climbing use authored procedural transforms over the skeleton; these are not dedicated motion-captured clips. Fabric boundaries and some furnishings remain simplified. The five floors are separate scenes connected through stair interactions, not one continuously loaded tower. Real-GPU performance, headset controls and audio by ear have not been certified. Local software-rendered browser checks prove operation, not a target hardware frame rate. No paid generation, model purchase or licensed asset import was performed.

See the checked screenshots in `hotel-headshots/` alongside this document. Do not publish without the owner's release instruction.

## Lobby dining addition — 24 November 2026

The ground-floor lobby now has a side food area, NIGHT BITES, with two dining tables, chairs, noodle bowls, cups, napkins, chopsticks, reactive bottles and a hot-food counter. Two existing guest slots become seated diners, keeping difficulty counts unchanged. They animate eating with a held spoon, remain seated before check-in, and stand at different speeds when approached after check-in or alerted by foam. Their chair exits are walkable; the normal chase/retreat rules resume after standing. Seated hit volumes follow the same skeleton. Dining activity and standing progress survive floor revisits. Other floors retain their lounges. Updated plans show the food area.

Dining validation: ten Hotel Headshots rule/model tests pass, including clear diner exit routes. The resident browser suite confirms eating before payment, two stand-up transitions, walkable pursuit starts, sleeper timing, bathroom pursuit and both swimmers leaving the pool, with no page errors. Checked image: `hotel-headshots/lobby-dining.png`. Seating and eating use procedural skeleton poses, not motion capture.

## Guest-room furnishings — 24 November 2026

All 32 bedrooms across five floors now include two bedside cabinets with drawers, lamps and a room phone, a writing desk with stationery and mug, a desk chair, and a wall-mounted TV displaying hotel information. Every room has its own existing enclosed bathroom, usable bathroom door, vanity/mirror, shower and toilet. Explicit bathroom-door and furniture data make completeness testable. Small bedside cabinets use fitted collision bounds so they cannot seal off narrow rooms. Tests cover bedroom-to-bathroom/entry/awake-position paths, including sampling actual player collision along each path with doors open.

Furnishing validation: all 12 Hotel Headshots rule/model tests passed; the complete resident browser suite passed with no page errors; both new room previews were visually checked. Screenshots: `hotel-headshots/furnished-room.png` and `hotel-headshots/room-desk-tv.png`. The TV currently displays the hotel information channel.
