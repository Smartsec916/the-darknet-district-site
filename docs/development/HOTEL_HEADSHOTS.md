# Hotel Headshots

Updated 24 November 2026. Branch `codex/hotel-headshots`, based on `origin/main` `ad2ef321`. Playable implementation, **not merged or deployed**.

## Owner's direction

Five-floor, nonlethal first-person arcade shooter with money theft, evasive play, a foam blaster, defensive hit detection and local high scores. The owner subsequently specified **neon, slightly cyberpunk, not fancy**, a **centered blaster**, and **no gray or white attachments on the blaster**. Those corrections supersede the initial luxury hotel treatment. The weapon now has only a tan barrel, tan nozzle and tan grip, centered below the crosshair and brought close enough that its circular back end is out of view. The owner’s subsequent width adjustment narrows it by approximately 14% without moving it.

## Play

Run `node tests/serve-modern.cjs`, then open `http://127.0.0.1:5187/hotel-headshots/index.html` on desktop. WASD moves, mouse aims, left click fires (hold for automatic fire), Shift sprints, E interacts, Escape pauses. The canvas renders at 1024 × 768 and the entire game frame, including menus, scales at 4:3. Pointer-lock loss, tab hiding and window blur pause the game.

Begin inside the front lobby facing reception. Pay the receptionist $250 from the initial $10,250, leaving $10,000. Theft and active pursuit require payment; entering a room can wake its sleeper before payment. Free refill tanks replenish the 48-shot reservoir. Pass through the rear pool door, cross the deck to the enclosed east stairwell, climb the stairs and press E at the landing to load the next floor. Floors 2–5 also offer a return stair interaction. Money, ammo and repelled count carry across floors; revisited floors remember doors, guest resistance/retreat, and sleeping/waking/pool-exit activity. Reaching floor five triggers a police raid through all ground-floor entrances. Officers pursue across both stairways and shoot the player; the non-graphic ending records the remaining balance. There is no escape victory. Zero money ends it immediately.

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

The existing rule that every playable cabinet has a highest-score achievement and Dax holds those cabinet achievements is extended to this title. This is catalog/profile metadata only: the local leaderboard does not grant a verified District achievement. The read-only admin inventory is regenerated. District service-worker build: `2026-11-24-hotel-headshots-9`.

No Sleeping Pod, music-player, account/save implementation, production API, merchandise, entitlement, payment or licensed-model file changed. The District HTML entrypoints remain unchanged and byte-identical.

## Verification

- Full Node suite (24 Nov): **1,171 passed, 0 failed, 1 skipped** (1,172 total), including embedded model/animation integrity.
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

## Room windows and shared exterior — 24 November 2026

Every guest room has a framed window, sill, mullion and transparent glass. The view is an original low-detail 3D city with apartment towers, rooftop equipment, signs, street lamps and parked vehicles. A perspective-correct offscreen view provides parallax through a virtual opening; walls retain their collision and room isolation. This is the owner-authorized rendering shortcut, not a newly navigable outdoor map. One 512-square render texture is shared by all room windows, updated at most 20 times per second only in a guest room facing the window side. The exterior has six merged meshes, no NPCs, physics, shadows or reflection passes. Upper floors move the street downward to provide higher views. No hardware FPS guarantee is claimed.

Verification: all 13 Hotel Headshots rules/model tests passed, including placements for all 32 windows. Browser checks on floors 1 and 5 verified nonempty rendered city pixels, camera-relative parallax, transparent glazing, six exterior meshes, matching room/window counts, scene replacement, no page errors and no exterior updates while in the hallway. New screenshots: `hotel-headshots/window-floor-1.png`, `hotel-headshots/window-floor-5.png`. Cyan strokes identify windows on the updated floor plans.

## Recorded hit reactions — 24 November 2026

The owner requested four spoken reactions: Eww!, Ahhh!, Ohhh!, and Oh My God! They were generated as separate ElevenLabs v4 recordings using the workspace Lana voice and packaged as short mono 24 kHz WAV files (about 167 KB total). Provider alignment isolates the requested exclamations; edge fades and normalization avoid abrupt starts and clipping. Source IDs and file hashes are recorded in `hotel-headshots/assets/audio/manifest.json`. `tools/audio/process-hotel-reactions.cjs` packages source MP3s kept outside version control. The existing District voice registry and approved clips are untouched.

`reactions.js` decodes these files once after the Start gesture. Confirmed NPC foam hits trigger a shuffled selection, mild voice-pitch variation, stereo position and distance attenuation. At most two voices overlap, with 180 ms global and 1.1 s per-guest cooldowns. There is no queued speech. Pause, mute, floor changes, restart and game-over stop active voices. No generation/API service is contacted during gameplay. Browser checks cover actual projectile-hit playback, all four decoded files, nonconsecutive repeats, cooldown, overlap cap, pause and mute.

Final reaction validation: full Node suite 1,171 passed, 0 failed, 1 skipped; 14 Hotel Headshots checks passed. `node tests/hotel-headshots-residents-browser.cjs --audio` passed with the final WAVs, including a real projectile hit producing a live audio source, a two-voice overlap cap, cooldown, shuffle, pause and mute. Automated checks do not certify the sound of physical speakers.

## Botanical paintings — 24 November 2026

Owner-requested original oil-painting artwork: flowers only, bees flying around flowers, bees landed on blooms, and a mixed flying/landed composition. One generated square four-panel atlas is shared by four materials. 104 paintings across the five floors: every guest room, guest corridors, front lobbies, pool decks and stair landings. Frames are modeled walnut rails and inset edges with a shared wood-grain texture. Existing abstract placeholders are replaced. Paintings remain projectile-pickable and can receive temporary foam splatters. Frames are merged with other static geometry; no extra lights or animation loops are added.

Validation: all 15 Hotel Headshots rules/assets checks passed, including artwork coverage and unobstructed viewing positions on all floors. The browser artwork check verifies loaded textures, matching placement counts, wood-frame materials and no page errors; screenshots of flowers only, flying bees and landed bees are checked visually.


## 24 Nov 2026 — hotel layout audit and breakfast counter

Compared the owner's hotel-plan references with the [Gaylord Texan guest-room plans, page 4](https://www.marriott.com/content/dam/marriott-digital/ge/us-canada/hws/d/dalgt/en_us/document/assets/ge-dalgt-guest-rooms-suites-guide-99867.pdf) and the [Marriott Marquis room description](https://context.hosthotels.com/faq/html/properties/new-york-marriott-marquis/rooms.html). The useful patterns are a private bathroom near the entrance, sleeping space deeper in the room, furniture clear of circulation, and common corridors serving rooms independently.

- Mirrored the upper guest-room row, including bathrooms, furniture, window positions, paintings, sleeping orientation and collision footprints. Both rows now put bathrooms nearer the corridor and beds farther inside.
- Wake-up destinations are at the foot of each bed instead of behind its headboard.
- Upstairs/downstairs interactions share the same rear stair core on every floor; arriving players spawn on its clear landing. Upper floors have lounge seating instead of duplicate check-in desks.
- A dry rear passage connects the main hall to the stairwell without entering the pool. The pool has its own door; swimmers react when the player enters the pool area, not the dry passage.
- Ground-floor dining now has a wall-side breakfast counter with eggs, pancake stacks and butter, pastries, apples, a coffee machine, cups, sugar, and an adjacent mini fridge. The counter and fridge have collision; diners retain clear exits.

These are gameplay plans, not construction drawings: rooms and corridors retain generous arcade clearances; windows continue using the shared 3D city-view optimization; floor changes remain transitions rather than a continuous stacked building. The fridge and breakfast items are scenery, not a food inventory system. Updated floor-plan PNGs are generated from the actual level data.

Validation: 17 focused hotel tests; full Node suite 1,174 passed / 1 skipped; resident browser checks passed (dining, slow/fast waking, bathrooms, pool entry/ladder exits, blocking poses); complete gameplay browser passed all five floors, stair down/up round trip, victory and persistent scores. Breakfast counter preview rendered without browser errors.


## 24 Nov 2026 — natural exterior views

Owner correction: remove the cyberpunk city outside. Window views now show a shared 3D meadow and leafy trees under blue sky and white cloud banks. Tree roots stay at a fixed world elevation, so higher floors look over the canopy into more sky and clouds. Removed the separate penthouse skyline meshes as well. Retains clear glazing, perspective parallax, six merged exterior meshes, the 512px shared render target and 20Hz cap. Earlier city-view notes describe the superseded artwork.

Verified floor 1 and floor 5 screenshots, window parallax, clear glazing, six-mesh batching and idle render culling. Node suite: 1,174 passed, one skipped. Exterior foliage/clouds remain procedural and stylized.


## 24 Nov 2026 — daytime opening, pool and windows

The opening lobby and pool now use warm daylight with a blue sky and white clouds overhead. Framed transparent skylights replace opaque ceiling sections over the lobby and indoor pool; the penthouse pool remains open to the daytime sky. Ambient illumination and sunlight are brighter, while lobby/pool practical lights use a neutral warm tint. Guest-wing ceilings and neon interior accents remain. Window exteriors retain daytime trees, grass, sky and clouds. The player still starts in the reception lobby.

Validation: daytime lobby/pool/rooftop browser previews passed; cloud geometry excluded from neon bloom and projectile picking. Node suite: 1,174 passed, one skipped.


## 24 Nov 2026 — entrances, emergency exits and police ending (current)

The front entrance and main exit are in the lobby. The rear exit opens toward the pool. Both the east rear stairwell and west lobby stairway have signed emergency exits at their ground-floor bases. Either staircase works between every floor and preserves its matching arrival landing. The updated plans mark all four ground-floor doors.

The owner's final ending supersedes the original rooftop victory: reaching the penthouse triggers a police raid. Four uniformed officers enter through the main lobby, rear pool doorway and two emergency entrances. They breach doors, follow room/corridor paths, climb or descend the stairs to the player's floor, aim and fire visible projectiles with muzzle flashes and gunshot sounds. Walls stop rounds. Sirens and the HUD announce the cordon; no exterior door grants a victory. A police hit ends the run with “BUSTED. NO CHECKOUT.” and saves the remaining money as the final score. No blood, wound graphics or ragdoll death. Police geometry is original procedural uniform/helmet/armor geometry with walking and firing animation, not a licensed realistic police model.

`raid.js` owns deterministic multi-floor pursuit and projectile collision; the game owns rendering, sound, pause behavior and the ending. The raid persists across floor changes and resets on a new run. Older victory-test notes above are historical.

Validation: 21 focused hotel tests; full Node suite 1,178 passed / one skipped; all-floor gameplay browser passed with the penthouse trigger, police gunfire ending, final-score persistence, restart and 4:3 checks. Police/entrance browser confirms all four entry routes, sealed-exit interaction, uniform rendering and the non-graphic ending. Also simulated police following the player back down from floor five to reception.


## 24 Nov 2026 — lower foam-blaster grip

Added the owner-reference rounded tan lower grip, with three shallow rounded ridges and a side bolster. It sits partly behind the HUD and moves vertically by 0.02 local units with recoil before settling. The blaster remains centered and tan-only. Mouse-down now fires immediately, including the click that reacquires mouse capture; held-fire retains the 0.19-second shot interval. This treats the reported firing delay as unwanted lag, not a requested wind-up.


### Wind-up correction

Owner clarified that the new lower grip is the wind-up: it moves slightly up and back down for 0.18 seconds before the foam projectile and firing sound occur. Ammo is consumed only at release. Held fire repeats the wind-up, and pause/floor changes cancel a pending shot. This supersedes the immediate-fire interpretation above.


## 24 Nov 2026 — wider vertical mouse aim

Vertical mouse aim now reaches 89 degrees above and below horizontal (previously about 72 degrees). Foam follows the full 3D camera direction; the camera view matrix refreshes at shot release so the wind-up uses the current aim. Player movement stays on the floor. Controls now explicitly mention up/down aiming.


## 24 Nov 2026 — falling foam projectiles

Foam now follows a gravity-driven 3D arc instead of a straight ray. Launch speed varies by ±8% around 34 world units/second to make some shots fall short sooner; gravity is 9.8 units/second squared. Aim higher to compensate at distance. Each trajectory is swept against scene geometry in steps no larger than 1/60 second, retaining location-based NPC hits, arm interception and surface splatter. Upward shots have enough lifetime to fall back down; police rounds are unchanged.

Validation: 1,179 Node tests passed (one skipped). The live ballistics check confirmed visible downward travel and a floor splatter before the distant corridor wall; ammo consumption and projectile cleanup passed.
The full browser regression also passed: live projectile headshot, three shield poses, theft/refill, all five floors, police ending, restart, persistent scores and 4:3 rendering. The firing check now waits for actual shot release and impact rather than a fixed wall-clock delay.


## 24 Nov 2026 — liquid drips, attract tour and Milked sponsor

Impacts leave opaque, glossy white streaks with slowly descending drops instead of alpha-fading clouds. Streak origins track animated NPC hit regions while flow remains world-down. Floor hits spread into shallow puddles; ceiling drops fall. Effects drain/shrink away after nine seconds, with a hard cap of 72 drops / 144 simple meshes. This is a lightweight visual approximation, not fluid simulation or skinned-surface fluid adhesion.

The title now tours reception, pool, dining and a live firing/blocking demonstration. The District cabinet uses 16 captured 4:3 frames from those scenes, letterboxed inside its existing screen; its poster uses the same real capture. `tests/hotel-headshots-presentation-browser.cjs` owns capture so ordinary gameplay regressions do not overwrite it.

CHECK IN fades to black, shows THIS GAME IS SPONSORED BY with Milked's established pink wordmark / three white droplets (standalone SVG recreation of the existing canvas logo), then fades into the lobby after assets are ready. Simulation and money are held during the intro; releasing capture during it pauses on entry. Restart uses the same sequence.

Validation: 1,181 Node tests passed, one skipped; full five-floor gameplay browser regression passed. Dedicated tests cover downward flow, moving NPC regions, opacity, floor pooling, cleanup and the effect budget. Generated admin inventory refreshed because it fingerprints the District source. No deployment or production API/save changes.

Presentation and District-host checks passed: sponsor logo/fades, fresh-run balance, NPC liquid creation, character creator, Sleeping Pod exit, cabinet launch and return. The 16-frame strip stays below the existing 200 KB budget. Local test hosting now serves SVG with the correct image MIME type. Visual captures: `.test-temp/hotel-headshots/milked-sponsor.png`, `liquid-npc.png`, and `cabinet.png`.


## 24 Nov 2026 — botanical hotel cabinet decoration

The owner requested a cabinet theme drawn from the game. Reused the original flower-and-bee painting atlas already displayed throughout the hotel: a framed front panel and two side panels, walnut-grain control deck and trim, aged brass around the screen, muted rose/gold marquee accents, and a THE GRAND LIABILITY / FIVE FLOORS · NO REFUNDS plaque. The coin slot sits below the artwork. Existing screen, attract loop, controls, footprint and launch action remain functional. This adds one reused atlas texture and small decorative meshes; other cabinets are unchanged. Build 2026-11-24-hotel-headshots-19. Node suite: 1,181 passed, one skipped.

Cabinet integration validation: character creation, Sleeping Pod exit, Hotel Headshots launch, sponsor/start sequence, and return to the District passed without page errors. Full-cabinet preview is captured by `node tests/hotel-headshots-district-browser.cjs --cabinet-only`.


## 24 Nov 2026 — populated attract scenes

The attract loop now stages animated guests in every vignette: receptionist and passing lobby guests; two swimmers and a poolside walker; two diners and a passing dining guest; three approaching pursuers cycling the three real guard poses. It reuses existing guest models and animation code. Demo actors are isolated from gameplay and rebuilt with normal residents on CHECK IN. The dining camera is framed to include the seated guests. The cabinet's 16-frame capture is regenerated from these scenes; capture checks verify guest counts, swimming/eating activity, and movement toward the camera. Build 2026-11-24-hotel-headshots-20.

Validation: final 16-frame strip visually inspected; all four scenes show guests. Browser checks passed for guest counts, swimming/eating poses, approaching pursuers, sponsor transition, and restoration of normal enabled residents/resistance on start. Node suite: 1,181 passed, one skipped; cabinet artwork remains within the existing size budget.
