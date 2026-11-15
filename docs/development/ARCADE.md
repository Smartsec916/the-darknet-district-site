# The arcade (west room of the District)

Built 2026-11-12 in part of the old Sleeping Pod room. David's direction: a small room, about five games, a 1980s arcade inside a cyberpunk future, with placeholder cabinets for games to come.

## The room

- Local x -10.5..-3, z 57.5..66.5, opening onto the hallway (the ARCADE sign is over the doorway). The rest of the old pod room is closed off behind it.
- Patterned carpet, three tube lights, two coloured ceiling panels, five posters.
- Five cabinets in a row along the back wall, facing the doorway:

| Cabinet | Status |
|---|---|
| LASER MOTH | Placeholder (space shooter attract loop) |
| TURBO KELP | Placeholder (racing) |
| **BLACKOUT PROTOCOL** | **Playable**: the real game |
| HEXADUEL | Placeholder (fighting) |
| COBALT STAIRS | Placeholder (platform) |

The four placeholder names are working titles written by Claude for David to change or approve. No copyrighted characters, logos or artwork are used.

## Playing

Walk up to the Blackout Protocol cabinet and press E. `void-runner/district-arcade.js` opens the game's own page (`blackout-protocol/index.html`) in a frame over the District: the same code, saves and sign-in as the stand-alone page. The character stands still at the cabinet and stays connected to the District. LEAVE CABINET unloads the game and gives movement back. Nothing is passed into the game or read out of it. The stand-alone page is untouched.

## Adding a game

1. A new placeholder: add an id to `ARCADE` in `void-runner/neochinatown.js` and a line to `GAMES` in the arcade build (name, two colours, attract loop: `shooter`, `racer`, `fighter`, `platform`, `puzzle`, `brawler` or `maze`).
2. Making it playable: add `{title, page}` to `GAMES` in `district-arcade.js` and give its interaction `action:'district-arcade', game:'<id>'`.

## Not done yet

- Other players cannot see that a cabinet is in use, and two players can each open the game at once (each plays their own copy).
- No arcade sound, no NPCs in the room, no physical high-score board.
- Blackout Protocol itself is unchanged: the Level 3 character changes, the graphics for levels 4 onward, and the leaderboard/achievement link to District accounts are still to do. (Blackout Protocol already has its own `leaderboard.html` and sign-in files; those need to be studied before anything is added.)

## Tests

`tests/arcade.test.cjs` (data), `tests/arcade-browser.cjs` (a real browser: the cabinet opens the real game, movement is held, leaving restores it).

## 13 Nov 2026: Corporate Zombies

David's second game, **Corporate Zombies** (an arcade light-gun shooter made with Tesana), is built into `corporate-zombies/` (the export in `game-20261113-b23d2e92-code.zip`, built with `npm install && npx vite build`; only the build output, `index.html` plus one script and three small images, is kept here, not the source). It takes the fourth cabinet, replacing the placeholder HEXADUEL, and is playable the same way as Blackout Protocol (`district-arcade.js` GAMES, interaction `district-arcade-zombies`). It is also on the games page (`games-list.html`). The cabinet marquee, poster and attract screen use the working title style; the game loads Tesana's play SDK from unpkg for its own saves and leaderboard, the same way the export is wired.

## 15 Nov 2026: UNDERGROUND//OVERDRIVE

David's third game, **UNDERGROUND//OVERDRIVE** (a 3D arcade fighting game made with Tesana: tournament, same-device versus, training, online versus through Tesana rooms), is built into `underground-overdrive/` from the export `game-20261102-b9874ec6-code.zip` (`npm install && npx vite build`). Kept here: `index.html`, one script (`_app/`), the character models (`assets/characters/`, 7 MB) and `assets/manifest.json`. Left out because the game never loads them: Tesana's store-page art (`assets/ui/`) and three's Draco/Basis decoders. A viewport line was added to `index.html`; nothing else differs from the build.

It takes the **fifth cabinet**, replacing the placeholder COBALT STAIRS (interaction `district-arcade-overdrive`, which replaces the south COMING SOON prompt), and is on the games page. Three cabinets are now playable (Blackout Protocol, Corporate Zombies, UNDERGROUND//OVERDRIVE); LASER MOTH and TURBO KELP are still placeholders. The screens of playable cabinets now flash PRESS E TO PLAY instead of COMING SOON (Corporate Zombies' screen had been saying COMING SOON by mistake).

Checked with `tests/arcade-browser.cjs` (software renderer): the cabinet opens the game's title screen in the frame and LEAVE CABINET returns to walking. **Not checked:** an actual fight, the Tesana services (saves, leaderboard, online versus), which were blocked in the test container; they load from unpkg and Tesana's service exactly as the export is wired. To rebuild after a new export: build, then copy `dist/index.html`, `dist/_app` and `dist/assets/characters` + `manifest.json` over this folder.

## Attract screens, posters and light guns (15 Nov 2026)

- A working cabinet's screen steps through four pictures of its own game's opening (attract) screen, with scanlines and a flashing PRESS E TO PLAY. The pictures are in `void-runner/art/arcade/<game>-attract.jpg` (four 320x256 frames side by side) and were captured from the game pages themselves. Its poster uses `<game>-poster.jpg`. Cabinets that are not switched on keep the drawn loops and COMING SOON posters. To add a game: capture its screens, add the two files, and add its id to `ART` in `neochinatown.js` (a test checks that `ART` equals the playable games).
- This is a picture loop, not the game running: a web page cannot be drawn onto a 3D surface in the scene.
- Corporate Zombies has two light guns (red, blue) on its panel instead of a stick and buttons. They are simple shapes built in code.
- A player at a cabinet stays where they stand and other players still see them there (`remote-players.js` keeps the `arcade` mode in the room). Not yet confirmed with two real players.
- Every game page shows `← RETURN TO THE DARKNET DISTRICT` (top left; `site-return.js`); inside the arcade the bar's button reads `EXIT GAME · RETURN TO THE DARKNET DISTRICT`.
