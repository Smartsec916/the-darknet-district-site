# The alley by The Darknet District

Code: `void-runner/ncz-alley.js` (the people who stay), `void-runner/ncz-nightlife.js` (the walkers who pass through, lane `alley`), and the alley section of `void-runner/neochinatown.js` (props, tubes, steam).

## Who is there

| Person | Doing | Shown from |
|---|---|---|
| Three friends by the dumpster | talking, one laughing | Low (two), Medium (three) |
| Someone against the north wall | smoking | Low |
| Someone across from the District door | watching who goes in and out | Low |
| Someone further along | reading their device | Medium |
| Someone on the crates | sitting | Medium |
| Two at the far end | talking, one drinking | High |
| A loner near the alley mouth | drinking or smoking | High |

They are ordinary street people in the crowd looks: no names, no dialogue, no missions. A player who comes within about three metres gets a look (they turn, then go back to what they were doing); the watcher also turns when a player is at the District door. Walkers entering and leaving the alley come from the nightlife system.

## Rules

- Nobody stands in the walking lane, within 4.5 m of the District door, or in the vestibule. Nobody has collision. `tests/ncz-alley.test.cjs` checks every spot against the real layout.
- Their looks are requested in the background once the street is running; a person whose look has not arrived after a while wears any look that is ready.
- Hidden beyond 75 m from the camera.
- The street is not a shared place (only the District interior is), so each player has their own alley and nothing is synchronised.

## Changing it

Edit `PEOPLE` in `ncz-alley.js`: position, the point they face, what they do in order of preference, and the lowest quality tier that shows them. The test fails if a spot is in the way.

## Atmosphere added 2026-11-12

Rubbish bags, drums, a pallet stack and crate seats against the walls; two bare neon tubes on the north wall; steam rising from two drains (not on Low).

## Not done

- Sound: no alley ambience or murmured conversation was added (there are no voice assets for it, and voices are not invented).
- Named "tier 3" characters: none here; that needs David's approval of who they are.
