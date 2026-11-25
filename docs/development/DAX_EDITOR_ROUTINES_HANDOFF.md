# Dax's editor-driven routines

PR #523 implements the movement scope of issue #522. One licensed Dax actor consumes the validated plan in the District. Without a plan, she stands at her hallway post at world x 125.3, z -96.4. She uses the bundled idle, look, watch, silent talk, glance-back, shrug and walk motions. **Check V3 // Shadow** uses the native look motion and lights her left-eye camera.

## Reproduce the routine test

1. Open Developer Tools → NPCs → Dax. Verify the map only offers the District and **Clear placement to hallway default** returns her to the hallway.
2. Make a route at x 125.3 with z -96.4 and -99.9. Give the first point **Check V3 // Shadow** for 3 seconds and the second **Walk on**. In draft play, observe the eye light, continuous walking, and the return to the first point. The route speed is 1.3 m/s. A stay rotates through its chosen actions every 10 seconds.
3. Add a time block at 08:00–09:00, select another safe hallway spot and a different action, and select 08:15 in **Play this draft at this time**. Verify that the block wins. Repeat outside its window, then clear the schedule and placement.
4. Published plans use UTC, including overnight blocks. Two clients with the same published version and current UTC resolve the same position regardless of save clock or when either entered. At block boundaries she walks through a route found against the District's collision geometry. When a connecting walk cannot be built or would overrun a block, she follows the all-day plan.
5. Local stores and unbundled builds can lack the licensed model. The renderer then omits Dax and logs the missing asset once. The live asset comes from the private licensed-assets repository through the existing Pages build.

The PR exercises publish, guest retrieval and clear with the local API's fake persistence. It never changes the owner's live Dax configuration.

## Current playtime and advanced behavior

The existing campaign clock is per save: 1 real minute of visible active play adds 12 in-game minutes, with a 5-second cap on each tick gap. It counts walking, flight and road taxi rides, and pauses for menus, loading, conversation and hidden tabs. The saved `story.flags.gameMin` counts whole minutes. Uncommitted fractional progress lasts for the current page. The Dax schedule does not use this clock.

To verify the campaign clock, start walking and record the in-game time. Walk for 30 active seconds, take a zone transition, then walk for 20 active seconds. The clock should advance about 6 minutes in the first interval and 4 more in the second, independent of loading time. Save and reload. Check that the saved whole-minute count resumes and that time spent in the menu or with the game closed does not advance it.

## Encounters and mission authoring

In Developer Tools under Combat Balance, **Dax encounters** controls the minimum active real minutes for each contact. Both timers default to -1 (disabled pending approval). A nonnegative value enables the corresponding encounter. The civilian reputation bounds are inclusive, and both default to 0. A lawful current contract or completed legal run qualifies for recruitment. An unlawful current contract or completed illegal run qualifies for a bounty check. When both qualify, Dax checks the bounty first.

On seeing the player she records one encounter per District visit in the current campaign. On a later visit she recognizes them. Her normal line of sight and the District walls limit recognition. She walks toward an eligible player, makes contact within 1.8 metres, then walks back to her scheduled position. Contact sets the saved story flag `daxRecruitContact` or `daxBountyContact` once. Use the flag as the trigger for an authored notification mission. An available Dax giver mission uses its normal offer and accept/deny flow. The existing V3 and recordings remain in use.

For an accelerated draft, set recruitment to 1 active minute and minimum civilian reputation to 5. In a throwaway save with a lawful contract and civilian reputation 5, accumulate 30 active seconds in each of two zones. Save and reload. Approach within sight in the District and observe the offer and return walk. Repeat in a fresh draft with an unlawful contract, reputation -3, a 2-minute bounty threshold and maximum reputation -3. Check the saved contact flag and verify it persists when returning. These are test settings; the shipped timers stay disabled until configured.
