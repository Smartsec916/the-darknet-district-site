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
