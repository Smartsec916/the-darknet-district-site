# VOID//RUNNER — progression and systems pass

## Result and source

Implemented in the existing game, against repository revision **9a1e603f53d3a497f1a8b126b07c35745f4d55f7** (`VOID-RUNNER-update7`). The 35 changed/new source and test files are an incremental overlay for that revision. Every modified file's original matched the authoritative GitHub blob. The generated patch passed a forward application check. No unrelated website files, vendor libraries or existing art were replaced. Nothing was pushed or deployed.

The previous pass already had Babylon station walking, shared interior/exterior layouts, Rook missions, route travel, cloud-save validation, authenticated premium ownership and procedural characters/ships. Its weaknesses were the early voucher-triggered free-travel unlock, no personal equipment/combat tutorial, overlapping upgrade menus, fragile physical resume state, a District entrance that ended at a placeholder, and a short engine-download deadline.

## Playable changes

**Persistent prologue.** `progression.js` stores demonstrated actions independently of location. The sequence is ground basics → personal equipment → Mara's existing ship handoff → flight → ship equipment → Rook's existing combat runs → launcher acquisition/installation → target selection, lock and missile firing → free exploration. Developer-readable stage IDs span `PROLOGUE-01_GROUND` through `PROLOGUE-07_MISSILE_TRAINING`, then `ACT-01_OPEN_WORLD`. Returning to Vesper does not clear those flags. Existing attachment/module conditions count even when completed early.

**Ground introduction.** Vesper's existing Ward workshop gains a diagnostic-kit pickup, a malfunctioning cargo drone, personal equipment counter, pistol, ammunition/reloading, drawing/holstering, aiming, jumping and a red-dot optic. Mara's original ship dialogue follows this work. The drone can damage the player and be destroyed; ordinary crew are not targets. Personal inventory uses weapon → optic slot → attachment → equip. Aiming visibly changes to the red-dot presentation. Yellow guidance advances as actions are verified. Flight prompts use current remappable bindings; walking retains its existing fixed bindings. Touch controls include sprint, jump, weapon actions, thrust, roll, target and lock. Full controller support was not added.

**Equipment cleanup.** The ordinary outfitter now exposes five modules: capacitor, cooling, pulse coils, shield and maneuvering vanes. Cards have lightweight SVG diagrams, compatibility, prices and current/new statistics. Buying adds ownership; the maintenance terminal installs/removes modules by slot. The first station arrival grants a Ward cooling loop plus a one-time 200-credit equipment allowance, so the purchase lesson is affordable. Existing owned legacy/account equipment remains accessible in maintenance; experimental items are not advertised as a large new shopping list. Existing premium ship checkout still uses the authenticated account integration.

**Combat and ships.** Laser volleys consume energy and separately add heat. Overheating locks firing until cooling reaches the recovery threshold. HUD shows both constraints. Base banks: Kestrel 72 energy / 12 recharge; Peregrine 96 / 16; Spectre 125 / 18. Modules modify those values. Kestrel and Peregrine have one cargo unit; Spectre has three, but turns more slowly than Peregrine. Premium power/cargo stats use verified ship ownership, not a forged active-ship field. Missile expenditure is saved; explicit dock restocking is currently free while balancing.

**Travel and cockpit.** In-system jumps increased from 12 to 14 seconds; interstellar jumps from 24 to 28 seconds. Interstellar interdiction remains prohibited. Objective/landing markers use yellow. Tactical radar projects contacts onto ship-relative front/rear/left/right axes, with altitude arrows and relationship colors. A target panel shows hull/shield values and a damage-colored schematic. It explicitly reports subsystem telemetry unavailable; engine/weapon subsystem damage is not simulated.

**Earth.** Landing still occurs at Sacramento municipal landing, outside the District. The street/alley walk reaches an entrance interaction; the vestibule beyond it contains Admin and Iris. Speaking there completes the existing Meet Admin objective. The previous “prototype ends here” entrance was replaced with this small physical continuation. It is a compact blockout, not a finished city interior or new quest campaign.

## Save, purchase and death behavior

Tutorial flags, personal items/attachments/ammo, module ownership/installations, missiles, cargo/data and foundation metadata persist alongside existing campaign fields. Credit purchases save immediately. Purchases do not move the physical checkpoint. Safe locations are recorded on walking/landing entry; loading discards transient route reconstruction and resumes at a safe location. Interrupted dialogue returns to the physical checkpoint instead of restoring a cinematic cursor.

Ship death offers checkpoint respawn; the ground encounter has medical recovery. Credits, missions and equipment remain intact, with no new financial death penalty. Existing authenticated premium entitlement handling is unchanged. Neither the new client state nor the new Python validator grants premium ownership.

Migration preserves earlier open saves rather than forcing a replay. Older in-progress saves infer ground completion after the existing ship handoff and retain their Rook mission state. Saves created by this pass use explicit flags and only unlock free travel after the required actions. Invalid checkpoint IDs fall back to the saved valid location. Local/cloud backup before manual testing remains useful; a deliberately new campaign still overwrites the local campaign through the existing confirmation UI.

## Foundations and explicit limits

- **Factions:** `factions.js` defines player, civilian, pirate, Erebus local, Sol local, neutral, Communion and Natural Order IDs. A centralized symmetric relationship table drives friendly/neutral/hostile classification. Communion and Natural Order are hostile to each other, neutral to the uncommitted player. Pirates are hostile to commercial/local factions. No faction fleets or civilization were inserted into the story.
- **NPC combat:** bounded to 24 actors in a loaded-area development encounter. Selection considers faction, distance, recent attacker, current target, protected target and pirate cargo value. Actors can retarget, fire, damage/destroy hostile NPCs; civilians flee. The existing story combat pilots were preserved. This is not a wholesale conversion of all scripted encounters, and the development battle does not yet support the full player-intervention/salvage loop.
- **Shared ground allegiance:** the faction API is independent of ship rendering and accepts ordinary actor records, so future ground NPCs can use the same relation/target model. General ground patrols, civilian reactions and raids are not implemented.
- **Cargo/data:** separate saved physical cargo and secure data lists, unit accounting, capacity checks for cargo recovery and new contract acceptance. Salvage survival/recovery functions exist and are tested. The opt-in battle records surviving cargo on wrecks; a production salvage pickup UI, market sale loop and pirate demand dialogue are not implemented.
- **Relays/objectives:** saved online/offline/damaged state, landing-terminal status and reusable repair-relay/deliver-data objective handlers. Local services remain available when a relay is offline. No communications network simulation or populated relay mission chain.
- **Reputation:** bounded persistent faction values and identifiers, not balanced automatic rewards/penalties, docking restrictions or discounts.
- **Future systems:** systems/locations carry owner/security faction metadata and systems expose population/shop/mission pools. Current ownership remains unspecified; neither future faction takes over Erebus or Sol. Add new system/location definitions and their content pools to expand the universe.
- **Future equipment:** modules include faction, technology and augmentation requirement metadata. These are extension points, not implemented augmentation gates/tech trees. Communion can later supply neural/AI equipment; Natural Order can supply conventional, wearable or hardened equipment without changing the module/inventory separation. Their full systems, politics, art sets, wars and quests remain future content.

## Renderer, assets and performance

Babylon remains authoritative; there is no silent legacy fallback. Engine download allowance is now four minutes, with a 270-second overall preparation cap; scene/optional-asset waits remain separately bounded. Startup reports its error and phase instead of only a generic failure. A 46-second delayed engine download passed. This addresses the known short-timeout risk; it does **not** establish the cause of the earlier Firefox screenshot, whose startup exception was never supplied. Server 503/429 issues require service-side investigation and were not “fixed” by extending a client timeout.

No large art dependencies were added. Equipment diagrams and ground props are procedural. Characters, pistol view, drone, station detail and the District room remain visibly placeholder-quality. Existing legacy art/code that still has consumers was retained, not blindly deleted. New menus replace the ordinary legacy upgrade lists; owned equipment and established controls retain working routes.

Repeated medium-quality station visits retained 807 meshes / 7 textures / 4 lights. Repeated touch/low-quality Vesper visits retained 614 meshes / 41 materials / 8 textures. These checks detect accumulation in those scenarios; they are not low-end-device FPS certification. Further instancing/merging and art optimization are appropriate before adding larger populations.

## Files and validation

New runtime files: `progression.js`, `factions.js`, `prologue-integration.js`, `prologue.css`, and `void_runner_progression.py`. Changes connect them through campaign, universe, mission log, cockpit/combat, ships, story, station renderer/integration, startup/preparation and both HTML entrypoints. `update-manifest.json` lists all 35 files and SHA-256 values.

Passed:

- **64 JavaScript unit tests**, including progression gates, early action recognition, migration, ownership, module compatibility, energy/heat, safe recovery, cargo, relays and faction targeting/combat.
- **24 Python tests**: 15 existing API tests, five story/save tests and four new progression-validation tests.
- **Prologue browser suite:** fresh ground controls, combat/pickup, optic UI, Mara/Rook flow, purchase versus installation, missile gate, checkpoint/reload, Sol/Earth routes and District entry/conversation. Arrival/combat checkpoints are advanced deterministically in parts of the test; this was not a complete manual combat playthrough.
- **Recovery browser suite:** timed departure/warp, local interdiction, optional asset failure, critical scene timeout, retry/cancellation and stable station visits.
- **Slow-startup suite:** 46-second engine delay with offline services; failed engine request produces explicit reason/retry.
- **Faction browser suite:** opt-in rendered NPC battle, no player target, population cleanup, repeat Vesper resources and narrow touch-layout checks.

These suites used Edge/Playwright. Firefox, real phones/controllers, authenticated cloud round trips and live paid checkout were not exercised. The older browser suites that depend on the former tutorial/unlock UI have not all been migrated; the new prologue suite supersedes that opening path. The full campaign's later missions remain covered by unit rules, not a full manual browser playthrough.

To run locally from the repository root: start `node tests/serve-modern.cjs`, then run the four browser files `prologue-browser.cjs`, `modern-recovery-browser.cjs`, `slow-startup-browser.cjs` and `faction-browser.cjs` under `tests/`. They require Playwright and Edge. Use `node --test tests/*.test.cjs` for unit tests and the existing Python dependency environment for API tests.

## Recommended fresh-save manual sequence

1. Back up the current save, start a new campaign, and confirm Vesper's yellow movement prompt. Move, look, sprint and jump using keyboard or touch controls.
2. Speak with Mara beside the ship. Collect the yellow diagnostic crate to the right of the workshop; draw the pistol, aim, shoot the red faulty drone, reload and holster. Verify damage and medical respawn if desired.
3. Open personal inventory. Walk through the corridor to the personal equipment counter. Buy the 25-credit sight. Open inventory → Ward pistol → optic slot → red-dot → equip. Return, draw and aim; verify the visible red dot.
4. Return to Mara and finish the established ship dialogue. Walk to the boarding interaction beside the Kestrel and enter it. In flight, demonstrate thrust/braking, pitch/yaw and roll. Align the yellow marker, jump and dock at Meridian.
5. Use maintenance beside the ship. Inspect ship inventory, select cooling and install the reward loop. Visit the concourse outfitter, buy the capacitor, and verify it is owned but not installed. Return to maintenance and install it in power; verify capacity rises from 72 to 96.
6. Accept Rook's legal delivery, defeat the attacker and dock. Return to Rook, accept the illegal run and finish it. Confirm the voucher does **not** enable free routes.
7. Claim the launcher at the outfitter, fit it in the missile slot, and launch the qualification route. Select a hostile, enable/hold lock, fire a missile and verify the saved ammo count. Verify open-world access only after all earlier required actions also passed.
8. Use F1 to track Admin. Travel to Sol Belt, then Earth; follow the yellow landing marker. Walk through Sacramento to the District entrance, enter and continue to Admin/Iris. Confirm objective completion.
9. Purchase equipment, quit/reload during a flight and verify inventory/credits persist while the character resumes at the safe landing. Test ship death/respawn. Return to Vesper and verify tutorials do not restart.
10. Sustain laser fire; watch energy fall and heat rise. Verify heat lockout clears after cooling and compare capacitor/cooling modules. Check Peregrine handling against the cargo-focused Spectre only on an account that legitimately owns it.

Balance priorities: ground drone damage/range, pistol aim tolerance, 200-credit allowance, module prices, energy-per-volley/heat recovery, free missile service, 14/28-second jumps and ship turn-rate tradeoffs. Flight values remain in `ships.js`/existing balance configuration; new module/resource values are in `progression.js`; NPC values and relation defaults are in `factions.js`.

## Exact faction development check

Use the automated `node tests/faction-browser.cjs` test for a repeatable scenario. It does not change any real account permissions.

For visual manual review, sign into an existing authorized developer account in a local development environment, enter ordinary flight, then run:

```js
VoidFactionEncounter.start([
  {id:'review-a', faction:'communion', role:'fighter', x:-25, y:0, z:90, hp:30},
  {id:'review-b', faction:'natural-order', role:'fighter', x:25, y:0, z:90, hp:30}
]);
```

The function returns false without existing developer authorization. During local alignment/combat, the actors should target each other and one should be destroyed without player input. Their radar allegiance is neutral to the player. Warp pauses this local simulation; leaving for walking clears it. `VoidFactionEncounter.stop()` removes the test encounter. Do not add these fleets to production story data merely to test the framework.

## Applying the update

Use **either** the ZIP overlay or the Git patch, not both. Apply to the existing `VOID-RUNNER-update7` revision. With Git, first run `git apply --check VOID-RUNNER-progression.patch`, then `git apply VOID-RUNNER-progression.patch`. If the repository has moved, review conflicts instead of overwriting newer work.

Deploy the changed HTML/scripts/styles and **both** Python API files together through the existing site deployment. Keep the existing vendor/art/configuration. The ZIP is not a complete website or standalone game. Production rollout, device QA, art refinement, real service validation and the documented future systems remain outstanding.
