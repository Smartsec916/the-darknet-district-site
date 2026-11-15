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

## Achievements on profiles (15 Nov 2026)

David asked for achievements to show on people's profiles.

- **New achievements:** "Make Highest Score in [game]" for each playable arcade game (Blackout Protocol, Corporate Zombies, Underground//Overdrive): holding the top verified score. Event `arcade_high_score_verified`.
- **Each achievement now has** a `difficulty` (1 Easy to 5 Hardest) and `paid` (true when it takes a real purchase: District Supporter).
- **On a profile** (`personal-device.js` `achievementsHtml`, rules in `achievements.js` `profileList`): three are shown, those bought with real money first, then the hardest; **VIEW ALL** opens the rest, and an ORDER menu sorts by Featured, Most recent, Difficulty or Type.
- **Residents** have achievements as part of who they are (`district-people.js` `achievements`, read with `achievementsOf(id)`): Dax holds all three arcade high scores and Reliable Courier (three cargo runs for Rook), as David specified; the others have one or two easy ones. Which resident has which, and the dates, are Claude's draft except Dax's.
- **Players show none yet.** A player's achievements must come from server-verified events (rule above), and that server side still does not exist. When it does, pass the player's verified unlocks to the same `profileList`.
- David wrote "filter for Most recent, Difficulty, or by Try": read as "Type". Change the labels in `achievements.js` `SORTS` if he meant something else.

## Local progress (`void-runner/local-progress.js`)

So a player can see how far along they are meanwhile, the game counts some of its own events **in the browser**, per account (or `local` when not signed in). It unlocks nothing, never says "unlocked", and is labelled "progress kept in this browser" on the player's own V1 profile. It is not visible to other players, does not follow the account to another computer, and could be edited by a determined player, which is exactly why it is not the achievement.

`VoidLocalProgress.count('tropical-fish', 1)` is called once per fish landed. When server records exist, the same place should report the `vr_fish_landed` event to the server instead, and this file becomes a display cache.

## Fishing (Tropical Escape, `void-runner/vr-tropical.js`)

At the pier's fishing spot press E to cast (you turn to face the water); when the float dips (a sound and "A BITE!") press E within about 1.7 seconds to land the fish. Too early or too late and it gets away. Six kinds of fish with random weights, all released. Each player fishes on their own screen; in a shared session the others do not see the rod or line.

## Tests

`tests/achievements.test.cjs` (the catalogue, unchanged), `tests/local-progress.test.cjs`, `tests/tropical-fishing-browser.cjs`.
