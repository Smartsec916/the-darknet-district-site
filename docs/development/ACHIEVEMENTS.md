# Achievements and local progress

## Achievements (`void-runner/achievements.js`)

The catalogue and its rules. **An achievement is unlocked only by server-verified events; the browser never grants one.** Each definition names the event that counts (`condition: {event, field, equals, count}`).

| Achievement | Condition |
|---|---|
| District Arrival | Visit The Darknet District |
| Blackout Specialist | A verified Blackout Protocol score |
| Reliable Courier | Three cargo missions for Rook |
| District Supporter | A verified official T-shirt purchase |
| **Catch 100 Fish** (added 2026-11-12) | 100 `vr_fish_landed` events in Tropical Escape |

The server side that records verified events does not exist yet. David approved building it (2026-11-12) together with the Blackout Protocol leaderboard. Until then no achievement can actually be unlocked.

## Local progress (`void-runner/local-progress.js`)

So a player can see how far along they are meanwhile, the game counts some of its own events **in the browser**, per account (or `local` when not signed in). It unlocks nothing, never says "unlocked", and is labelled "progress kept in this browser" on the player's own V1 profile. It is not visible to other players, does not follow the account to another computer, and could be edited by a determined player, which is exactly why it is not the achievement.

`VoidLocalProgress.count('tropical-fish', 1)` is called once per fish landed. When server records exist, the same place should report the `vr_fish_landed` event to the server instead, and this file becomes a display cache.

## Fishing (Tropical Escape, `void-runner/vr-tropical.js`)

At the pier's fishing spot press E to cast (you turn to face the water); when the float dips (a sound and "A BITE!") press E within about 1.7 seconds to land the fish. Too early or too late and it gets away. Six kinds of fish with random weights, all released. Each player fishes on their own screen; in a shared session the others do not see the rod or line.

## Tests

`tests/achievements.test.cjs` (the catalogue, unchanged), `tests/local-progress.test.cjs`, `tests/tropical-fishing-browser.cjs`.
