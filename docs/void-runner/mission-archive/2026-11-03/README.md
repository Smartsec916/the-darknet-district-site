# Mission archive, 2026-11-03

This is a snapshot of every mission and contract in the game, taken before David removed them from new campaigns.

- `missions.json` holds the mission definitions, contracts, Rook jobs, faction deliveries and story data. It also records the commit it came from and a fingerprint of each source file.
- Nothing was deleted from the game. The live definitions, mission engine, NPCs, voices and dialogue are all still in `void-runner/`, so existing saves keep working.
- The game does not load this archive. It is a reference and recovery copy.

## How to bring the missions back for new campaigns

Remove the `C.startDistrictCampaign(state)` call from `newJourney()` in `void-runner/game.js`, then bump `BUILD` in `void-runner-sw.js`. New campaigns return to Vesper and Mara's opening.

If a definition was later changed or deleted, compare it with `missions.json`, or restore the file from the commit named in `archivedFromCommit`.

To make a new snapshot: `node tools/archive-missions.cjs docs/void-runner/mission-archive/<date>`.
