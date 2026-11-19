# NULL, the nightclub

On Main Street's west side, directly across from the mouth of the alley that leads to The Darknet District. Named by David (2026-11-12). Code: `void-runner/ncz-nightclub.js` (place, collision, interior, people), `void-runner/ncz-club-audio.js` (sound), and the club front in `void-runner/neochinatown.js`.

## What is there

- **Outside:** the club front with a lit doorway, canopy and the NULL sign, visible from the alley mouth; door staff and (on Medium and High) two people waiting.
- **Inside** (32 x 20 m hall): a tile dance floor that changes with time, eight sweeping light beams, a DJ desk on a riser in front of a wall of light, speaker stacks, tables and seats along both long walls, a bar on the north wall with a bartender, a VIP corner on the south wall (riser, sofa, lit table, rope).
- **People:** dancers (3 / 6 / 9 by quality), the DJ, the bartender, door staff, and on Medium and High two guests at the bar, two in the VIP corner and two outside. Ordinary crowd looks; roles, not named characters; no dialogue.
- **Walking in:** the doorway is open once the club is ready; no key press. The bar has one prompt, ORDER A DRINK (a line of text; no credits, no effect).
- **Sound:** the existing club sound system: bass through the walls outside, full sound inside, from the speaker stacks and DJ desk.
- **Map:** NULL is on the V1 map with its building outline and a marker at the door.

## Two versions of the interior

The module was written for a purchased model ("Cyber Club", CGTrader). That model is **not published**: it is not on the live site or in the private asset repository, only on David's computer. So:

1. The game asks once whether `assets/models/ncz/nightclub.vrpak` exists.
2. If it does, the purchased model is used, as before.
3. If not (today, everywhere), `buildOwn()` builds the interior in code in the same hall, round the same furniture positions, and adds the bar, VIP corner and people.

To use the purchased model later: confirm its licence, put `nightclub.vrpak` in the private asset repository under `void-runner/assets/models/ncz/`, and redeploy. Nothing else needs changing. Note that the people, bar and VIP corner are currently part of the code-built version only.

## Switches

- On for everyone in the game. `?nightclub=0` (or localStorage `void-nightclub` = `0`) turns it off.
- Outside a browser (tests, tools) it is off unless a test forces it, so the plain city layout tests are unchanged.
- The name is `NAME` in `ncz-nightclub.js`.

## Not done

- **Multiplayer:** the street is not a shared place (only the District interior is), so players do not see each other in the club. Making it shared needs a new room on the hub and a hub redeploy.
- **Named staff and dialogue** (DJ, bartender, door, manager): not written; names and lines are David's to approve.
- **Player dancing, sitting, strobe setting, club music volume control, social posts and photo metadata:** not built.
- The club's shop row on that stretch of Main Street is replaced by the club front.

## Tests

`tests/ncz-nightclub.test.cjs` (place, collision, NULL additions), `tests/ncz-club-audio.test.cjs`, `tests/nightclub-browser.cjs` (a real browser walk-through).
