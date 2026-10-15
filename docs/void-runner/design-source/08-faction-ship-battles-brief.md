# VOID//RUNNER — CLAUDE DEVELOPMENT PROMPT
## Faction Ship Battles During Introductory Cargo Missions

I want to introduce the growing conflict between The Communion and The Natural Order through small space battles the player witnesses while completing the two introductory cargo missions from The Darknet District.

These encounters should help establish the factions visually and atmospherically without forcing the player to participate.

Review the existing VOID//RUNNER codebase, ship assets, flight mechanics, AI systems, and mission structure before implementing changes.

## 1. Mission Integration

During both introductory faction cargo missions, the player should encounter a small battle between Communion and Natural Order spacecraft.

### Mission A — Communion Delivery

- The player accepts the Communion cargo delivery from Admin or Iris.
- While traveling toward Communion territory, the player encounters a small battle between the two factions.
- The battle should occur naturally along the existing travel route, preferably during a suitable space-flight segment.
- The player can observe the battle or continue toward the destination.
- The player eventually meets Dr. Elara Voss and delivers the cargo.

### Mission B — Natural Order Delivery

- The player accepts the Natural Order cargo delivery from Admin or Iris.
- While traveling toward Natural Order territory, the player encounters another small battle.
- This should be a separate encounter, not simply the exact same battle replayed.
- The player can observe or ignore the fighting.
- The player eventually meets Marcus Vale and delivers the cargo.

Each encounter should happen once per corresponding introductory mission, with its completion state preserved by the save system.

Do not interrupt warp travel in a way that conflicts with the game's existing flight mechanics.

## 2. Small-Scale Battles

These are minor skirmishes, not major fleet engagements.

Use approximately:

- 2 Communion ships.
- 2 Natural Order ships.

Adjust the count if necessary for performance or believable combat.

The ships should:

- Maneuver around each other.
- Fire their existing compatible weapons.
- Attempt to evade incoming fire.
- Take visible damage.
- Occasionally be destroyed.
- Continue fighting without requiring player involvement.

Avoid excessively long battles, large explosions, or overwhelming numbers of spacecraft.

The encounter should feel like the player has stumbled upon an ongoing conflict.

## 3. Distinct Faction Ship Designs

The two factions must have clearly recognizable visual identities.

Do not simply recolor identical ships.

### The Communion — Ship Design

The Communion embraces artificial intelligence, automation, and advanced technology.

Their ships should reflect that philosophy.

Visual direction:

- Sleek, refined silhouettes.
- Smooth surfaces and curved armor.
- Elegant, integrated hull structures.
- Minimal exposed machinery.
- Cool white, silver, and muted blue tones.
- Subtle blue or cyan lighting.
- Advanced-looking engines and weapon systems.
- Precise, almost graceful movement.

Their spacecraft should appear technologically sophisticated and highly automated.

Combat behavior:

- Smooth maneuvering.
- Coordinated formations.
- Precise targeting.
- Controlled evasive movements.
- Disciplined firing patterns.

### The Natural Order — Ship Design

The Natural Order distrusts artificial intelligence and prioritizes human control, mechanical reliability, and repairability.

Their ships should reflect that philosophy.

Visual direction:

- Angular, rugged silhouettes.
- Heavy industrial construction.
- Exposed mechanical details.
- Visible armor plating and structural elements.
- Practical, modular hull designs.
- Dark steel, weathered gray, and muted orange or amber tones.
- Conventional-looking engines and thrusters.
- A more utilitarian, military-industrial appearance.

Their spacecraft should look durable, repairable, and built for human crews.

Combat behavior:

- Aggressive but believable maneuvering.
- More direct attack patterns.
- Heavy bursts of weapons fire.
- Less polished formations.
- Strong emphasis on practical combat tactics.

Important: Natural Order ships can still have sophisticated computers and electronic systems. Their ideology is opposed to autonomous AI control, not all technology.

## 4. Both Factions Ignore the Player

This is extremely important.

Neither faction should target, pursue, hail, threaten, scan, or attack the player during these scripted encounters.

The player is a neutral cargo pilot and is not participating in the conflict.

Requirements:

- Faction AI targets only designated opposing faction ships.
- The player's ship must not be added to either faction's hostile target list.
- Neither faction should attempt to intercept the player.
- No automatic faction reputation changes.
- No mission requirement to destroy enemy ships.
- No forced dialogue or allegiance decisions.
- The player should be able to fly past without interference.
- Prevent stray weapons fire or collisions from unintentionally damaging the player during these introductory encounters.

For now, even if the player approaches the battle, the ships should remain focused on each other.

If the player fires on a faction ship, do not introduce a new retaliation or reputation system as part of this task. Preserve existing gameplay behavior where necessary and report any conflict with the requested neutral encounter design.

## 5. Environmental Storytelling

These encounters should communicate that tensions between the factions are escalating.

Possible atmospheric details:

- Distant weapons fire visible before the player reaches the battle.
- Engine trails and evasive maneuvers.
- Small explosions and damaged ships.
- Occasional drifting wreckage.
- A battle already in progress when the player arrives.

Avoid lengthy exposition.

The player should understand what is happening primarily through observation.

The battles should complement the later conversations with Dr. Elara Voss and Marcus Vale, who each describe the conflict from their own perspective.

## 6. Ship Assets and Performance

Before creating new spacecraft, inspect the repository for existing ship models, procedural geometry, materials, textures, and combat AI.

Reuse suitable existing systems wherever possible.

If new faction-specific ships are required:

- Create visually distinct ship models using the project's existing Babylon.js workflow.
- Prefer efficient reusable meshes and materials.
- Avoid unnecessary external dependencies.
- Optimize for browser performance.
- Use reasonable polygon counts.
- Ensure weapons, engine effects, and damage effects work with existing systems.

Do not replace the player's ships or modify unrelated spacecraft.

The faction ships should be reusable for future missions and larger encounters.

## 7. Encounter Behavior and Cleanup

Each battle must:

- Trigger at an appropriate location along the relevant mission route.
- Spawn only once for that mission.
- Avoid spawning directly in front of the player's ship.
- Remain optional to observe.
- Allow the player to continue without waiting for the battle to finish.
- Clean up distant ships, projectiles, and effects safely.
- Avoid interfering with docking, warp, mission tracking, or saving.

If the player leaves before the battle ends, the mission should continue normally.

If the player returns later, do not automatically repeat the introductory battle.

## 8. Mission Log and Navigation

The player's primary objective remains delivering cargo.

Do not add a combat objective.

Do not require the player to investigate the battle.

Do not block delivery progression if the battle is skipped.

After reaching the destination:

- Communion cargo is delivered to Dr. Elara Voss.
- Natural Order cargo is delivered to Marcus Vale.
- The objective changes to returning to The Darknet District for payment from Iris.

Preserve the established mission progression.

## 9. Testing

Verify the following:

1. Communion delivery triggers its intended skirmish.
2. Natural Order delivery triggers a separate skirmish.
3. Both factions use visually distinct spacecraft.
4. Ships correctly attack opposing faction ships.
5. Neither faction targets or damages the player.
6. The player can ignore the battle.
7. Cargo delivery remains possible if the battle is skipped.
8. Battles do not repeat after completion or save/load.
9. No unnecessary spacecraft remain spawned after leaving.
10. The encounters do not introduce major browser performance problems.

## 10. Development Restrictions

- Preserve existing approved storyline and mission dialogue.
- Do not introduce major new factions.
- Do not start a full-scale faction war.
- Do not force the player to choose sides.
- Do not add faction reputation or allegiance mechanics without approval.
- Do not redesign unrelated game systems.
- Do not modify Iris's existing chatbot implementation.
- Keep the new faction ship assets reusable for future missions.

## 11. Final Report

When finished, provide:

- Files modified or created.
- Description of the Communion ship design.
- Description of the Natural Order ship design.
- How the encounters trigger.
- How neutral-player behavior is enforced.
- How encounter completion is saved.
- Testing results.
- Any limitations or follow-up improvements recommended.

**Overall goal:** The player should feel that the Communion and Natural Order are already engaged in a simmering conflict, but that the wider universe continues operating around them. These introductory skirmishes are background events, not player combat missions.
