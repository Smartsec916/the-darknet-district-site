# VOID//RUNNER
## COMPLETE GAME VISION & DEVELOPMENT MASTER PLAN
**The Darknet District — October 2026**

**Game:** https://thedarknetdistrict.com/void-runner.html

**GitHub Repository:** https://github.com/Smartsec916/the-darknet-district-site

**Game Engine:** Babylon.js

**Status:** Master planning document. Features described here include existing functionality, requested improvements, and future development goals. Implementation status must be verified against the repository.

---

# 1. GAME VISION

VOID//RUNNER is a browser-based science-fiction action/adventure game combining:

- First-person exploration and combat.
- Spaceflight and ship combat.
- Cargo hauling and smuggling.
- Bounty hunting.
- Space station exploration.
- Ship purchasing and customization.
- Character interactions and dialogue.
- Exploration of planets and abandoned stations.
- Political factions and player choices.
- An evolving campaign with optional side missions.

The game takes place in the larger Darknet District universe.

Players begin with limited resources, acquire their first spacecraft, and gradually gain access to new star systems, ships, equipment, and opportunities.

The game should emphasize player freedom, exploration, believable environments, and meaningful progression.

It should not require excessive survival grinding.

Players should be able to enjoy short gameplay sessions without losing progress.

---

# 2. STORYLINE AND CHARACTERS

## Opening Story

The player begins as a mechanic on a barren planet.

The starting settlement contains an open garage, workshop, several small habitats, a store, a bar, and industrial equipment.

The player previously worked for Elias Ward.

### Elias Ward

An older, fair-minded employer who treated his workers well.

Elias is deceased when the game begins.

He can appear through a holographic recording, providing background information and emotional context.

### Mara

An older, subdued mechanic who worked alongside the player.

Mara introduces the player to basic gameplay.

She provides the player's first gun and helps introduce the starter spacecraft.

Later, Mara directs the player to Meridian Station to meet Rook.

### Rook

A cargo contact operating through Meridian Station.

Rook introduces the player to increasingly valuable and dangerous cargo missions.

His assignments gradually involve smuggling, pirates, interdiction, and more complicated deliveries.

### Admin

An important character within The Darknet District.

Admin operates a shop and may provide special missions, equipment, and storyline connections.

### Iris

An android character associated with Admin and The Darknet District.

Iris can provide dialogue, information, missions, and world-building.

Her game integration should remain separate from the existing website chatbot so game development does not unintentionally change that system.

---

# 3. POLITICAL FACTIONS

## Sol System

Sol is primarily a neutral commercial region.

It contains trade, advertising, businesses, and competing political interests.

The player can visit Sol without immediately committing to either major faction.

## The Communion

A religious civilization that embraces artificial intelligence and cybernetic augmentation.

Its people once worshipped a powerful planetary AI.

That AI was destroyed.

The population has since experienced technological and social regression, and many believers await the AI's return.

Communion technology may include advanced targeting, augmentation, and electronic systems.

## The Natural Order

A civilization opposed to artificial intelligence and cybernetic augmentation.

The Natural Order prefers older, less AI-dependent technology.

Its ships and equipment should visually reflect that philosophy.

Natural Order forces sometimes conduct raids through Sol.

## Player Choices

Later in the campaign, the player encounters the conflict between the Communion and the Natural Order.

The player may:

- Support the Communion.
- Support the Natural Order.
- Remain neutral.

Faction decisions should affect available missions, relationships, equipment, and opportunities.

Neutral gameplay must remain viable.

A fourth alien faction may be introduced in a future expansion.

---

# 4. LOCATIONS AND STAR SYSTEMS

## Starting Planet

A barren world with a small industrial settlement.

Features include:

- Open-air garage.
- Workshop.
- Shooting practice area.
- Approximately four habitats.
- Small store.
- Bar.
- Dirt roads.
- Utility poles.
- Storage tanks.
- Industrial equipment.
- Workers and civilians.

Returning to this location must not automatically restart the tutorial.

## Meridian Station

An important early-game destination.

### Exterior

The station should include:

- Multiple hangars.
- Docking collar.
- Solar panels.
- Windows.
- External tanks.
- Industrial structures.
- Nearby spacecraft traffic.

Ships must enter station hangars nose-first.

Docking should use the actual ship orientation rather than simply rotating the camera.

### Interior

The layout should be:

**Hangar Entrance → Shop → Main Corridor → Bar/Lounge**

The Supplies/Outfitter shop remains near the entrance.

The Dead Channel bar/lounge should be relocated to the far end of the corridor.

The station should contain:

- Industrial lighting.
- Windows overlooking asteroid fields.
- Passing spacecraft.
- Occasional distant NPC battles.
- Seating areas.
- Restrooms.
- Sleeping quarters.
- NPC civilians.
- Shopkeepers.
- Bartender and patrons.
- Functional doors and interaction points.

The station should feel inhabited and operational.

## Earth — Sol System

The player eventually travels to Earth.

The intended landing location is near Sacramento, California, around J Street.

Old Sacramento contains flooded ruins.

A future high-speed rail connection toward San Francisco may be added.

### The Darknet District

The Earth location should include:

- Arrival alley.
- Security vestibule.
- Badge scanning.
- Main hallway.
- VR/arcade area.
- Bar.
- Admin and Iris shop.
- Vending machines.
- Sleeping pods.
- Meeting room.
- Stairs leading to a smoking area.

## Mars

Mars should feature an underground city.

The city will contain commercial areas, NPCs, missions, and a distinctive environment.

## Derelict Stations

Abandoned or partially occupied space stations.

Some contain hostile gangs or pirates.

Others may be deserted.

Gameplay can include:

- First-person combat.
- Cover-based encounters.
- Data retrieval.
- Encrypted information.
- Hidden supplies.
- Bounty targets.
- Coordinates unlocking additional destinations.

---

# 5. MISSION SYSTEM

The game should use a centralized mission manager.

Supported mission categories:

- Tutorial.
- Main Campaign.
- Cargo.
- Side Missions.
- Bounties.
- Station Missions.
- Faction Missions.
- Future mission types.

Mission acceptance, progression, completion, and tracking must operate independently.

Untracking a mission must never abandon, fail, delete, or reset it.

## Tutorial Mission

The tutorial begins when Mara gives the player a gun.

Objectives include:

1. Receive gun.
2. Learn movement.
3. Practice running and jumping.
4. Shoot training cans.
5. Board starter ship.
6. Learn throttle and braking.
7. Learn flight controls.
8. Learn navigation and alignment.
9. Complete introductory flight training.
10. Complete any appropriate introductory combat training.

Tutorial objectives should recognize successful player actions even when optional dialogue is missed.

The tutorial must not permanently block campaign progression.

Completed tutorial objectives must not repeatedly reactivate.

## Main Campaign — Meet Rook

This mission begins separately when Mara instructs the player to travel to Meridian Station.

Objectives:

1. Receive Mara's cargo assignment.
2. Travel to Meridian Station.
3. Dock at the station.
4. Enter the station.
5. Locate Rook.
6. Speak with Rook.
7. Begin Rook's cargo mission chain.

The cargo mission must continue independently of incomplete tutorial objectives.

## Mission Log

Add a MISSION LOG button near the bottom of the gameplay interface.

Also support F1 if available.

The Mission Log should display:

- Active missions.
- Completed missions.
- Mission descriptions.
- Current objectives.
- Completed objectives.
- Remaining objectives.
- Destinations.
- Rewards.
- Mission status.

Players can track or untrack missions.

Only one mission controls the primary highlighted navigation arrow at a time.

Other missions may continue progressing in the background.

The tracked mission selection must be saved.

## Cargo Missions

Rook's cargo missions should gradually increase in:

- Value.
- Risk.
- Distance.
- Illegality.
- Pirate activity.
- Interdiction probability.

Cargo should be vulnerable to loss if the player's ship is destroyed.

## Bounty Missions

Early bounty targets are relatively easy to locate.

Later targets use advanced techniques, including:

- Emissions control.
- Jammers.
- Concealment.
- More sophisticated evasion.

## Additional Missions

Future mission types include:

- Escort missions.
- Data retrieval.
- Station bar assignments.
- Admin/Iris missions.
- Derelict exploration.
- Faction operations.
- Smuggling.
- Special deliveries.

---

# 6. SPACECRAFT AND SHIP PROGRESSION

## Starter Ship — Kestrel

The Kestrel is a dependable utility spacecraft.

Its initial capability is approximately 3/10 compared with more advanced ships.

Features:

- Laser weapons.
- Empty missile racks initially.
- Limited cargo space.
- Basic radar.
- Upgradeable equipment.
- Repairable hull.

The planned starter-class cargo capacity is two units, subject to final balancing.

## Additional Ships

Second ship target price: 1,000 in-game credits.

A third ship should be more expensive and offer meaningful improvements.

Ships should differ in:

- Cargo capacity.
- Armor.
- Speed.
- Agility.
- Weapon capacity.
- Power systems.
- Heat management.
- Special equipment.

## Spectre 3

Previously proposed as an optional $1 real-money ship.

Its planned cargo capacity is approximately twice that of comparable ships.

Payment integration, balance, and platform feasibility require separate evaluation before implementation.

## Ship Equipment

Ships may support:

- Lasers.
- Missiles.
- Armor upgrades.
- Shields.
- Radar upgrades.
- Scanners.
- Jammers.
- Power upgrades.
- Targeting improvements.
- Cargo upgrades.

Personal inventory and ship inventory must be separate.

Hangar/loadout services should be available at relevant locations.

---

# 7. FLIGHT AND SPACE COMBAT

The flight system should balance accessibility with believable spacecraft behavior.

Features include:

- Throttle.
- Braking.
- Turning.
- Banking.
- Heat management.
- Power management.
- Damage.
- Ship repair.

## Target Locking

Use an Ace Combat-inspired targeting system.

The player keeps an enemy inside a targeting box until missile lock is achieved.

The HUD should also warn the player when an enemy is locking onto their ship.

## Weapons

Support:

- Laser weapons.
- Missiles.
- Limited ammunition.
- Weapon upgrades.
- Heat or power restrictions.

Missiles should become available through progression or purchases rather than automatically being provided.

## Enemy AI

Enemy ships should:

- Attack from varied angles.
- Pursue targets.
- Maneuver defensively.
- Retreat when heavily damaged.
- Attempt interdiction.
- React to player behavior.

Neutral ships may cross the player's route and warp away.

## Warp Travel

Warp should include an approximately eight-second cinematic fly-by effect.

Simply aligning with a warp marker must not automatically trigger travel.

Warp markers should appear approximately two seconds after launch or after the relevant area becomes clear.

The selected mission should determine which destination receives primary navigation highlighting.

---

# 8. CARGO, ECONOMY, AND INVENTORY

The game economy uses credits.

Credits can be earned through:

- Cargo hauling.
- Bounty hunting.
- Missions.
- Other approved gameplay activities.

Credits can be spent on:

- Ships.
- Repairs.
- Weapons.
- Missiles.
- Equipment.
- Supplies.
- Upgrades.

Illegal cargo should offer greater rewards but increase detection and interdiction risks.

Data items and coordinates should function as meaningful inventory or progression objects.

Ship destruction may result in cargo loss.

The economy should reward progression without requiring excessive repetitive grinding.

---

# 9. RADAR, SCANNING, AND STEALTH

Ships should have basic radar functionality.

Advanced equipment may improve detection capabilities.

## War-Flying

A scanning mechanic inspired by real-world wardriving.

Players may discover signals, installations, or other detectable systems.

Scanning activity can potentially reveal the player's location.

## Emissions Control

Players can disable emissions to reduce detection.

Doing so should also limit active radar functionality.

## Jammers

Jammers can interfere with tracking and detection.

Some locations, including areas associated with The Darknet District, may use electronic countermeasures.

Police or security zones may detect illegal cargo or suspicious emissions.

Advanced bounty targets should make use of stealth systems.

---

# 10. FIRST-PERSON GAMEPLAY

The player should be able to explore:

- Settlements.
- Garages.
- Stations.
- Shops.
- Bars.
- Derelict spacecraft.
- Faction locations.

Controls should support:

- Walking.
- Running.
- Jumping.
- Aiming.
- Shooting.
- Picking up objects.
- Interacting with NPCs.
- Using doors.
- Taking cover.

The starting pistol should have a 10-round magazine.

## NPC Behavior

NPCs may include:

- Civilians.
- Mechanics.
- Traders.
- Bartenders.
- Guards.
- Pirates.
- Gang members.
- Bounty targets.
- Faction personnel.

NPC animation states should support:

- Walking.
- Talking.
- Working.
- Drinking.
- Cleaning.
- Sleeping.
- Eating.
- Maintenance.
- Patrolling.
- Drawing weapons.
- Aiming.
- Shooting.
- Taking cover.
- Retreating.
- Taking damage.

Use suitable existing animation assets rather than adding unrelated animation packs.

---

# 11. COCKPIT AND USER INTERFACE

## 3D Cockpit

Replace the HTML/CSS cockpit frame with actual Babylon.js 3D geometry.

Use the Kestrel reference images for the desired appearance.

The cockpit should contain:

- Physical dashboard.
- Structural framing.
- Digital displays.
- Industrial metallic materials.
- Wear and weathering.
- Functional instrumentation.
- Appropriate lighting.

Instrument displays should include:

- Speed.
- Throttle.
- Hull.
- Shields.
- Power.
- Heat.
- Weapons.
- Missiles.
- Navigation.

Keep screen-space targeting overlays where necessary.

The cockpit must not interfere with visibility or performance.

## Main Menu

Include:

- Login.
- Start New Campaign.
- Load.
- Settings/Keybindings.
- Logout.

Remove unnecessary bottom interface elements.

## Skirmish Mode

Skirmish must remain accessible independently of Campaign.

Players must be able to return to the Main Menu and switch modes.

### Flight Skirmish

Options:

- Environment.
- Difficulty.
- Enemy count.
- Owned ship.
- Weapons.
- Loadout.

### FPS Skirmish

Use suitable station and derelict environments.

Visual and gameplay improvements shared with Campaign should also apply to Skirmish where appropriate.

## HUD

Include:

- Health/hull.
- Shield status.
- Speed.
- Power.
- Heat.
- Ammunition.
- Missiles.
- Targeting.
- Mission guidance.
- Radar.

Keep the interface readable and avoid unnecessary clutter.

---

# 12. SAVE AND LOAD SYSTEM

Autosave should occur:

- On station entry.
- On landing.
- After purchases.
- At appropriate campaign checkpoints.

Save data should include:

- Credits.
- Owned ships.
- Ship equipment.
- Inventory.
- Cargo.
- Current location.
- Mission progress.
- Completed missions.
- Tracked mission.

After death, the player should return to the previous valid station or checkpoint according to the save rules.

Returning to a previously visited location must not restart completed tutorials.

Save compatibility should be preserved across game updates whenever possible.

---

# 13. GRAPHICS AND ART DIRECTION

The game should have a grounded, industrial science-fiction appearance.

Visual inspiration includes:

- Worn spacecraft.
- Detailed mechanical structures.
- Industrial space stations.
- Cyberpunk commercial environments.
- Atmospheric lighting.
- Believable technology.

The Kestrel should follow the reference images, featuring:

- Angular hull.
- Weathered exterior.
- Twin engines.
- Cargo compartment.
- Physical cockpit.
- Weapon hardpoints.

Meridian Station should eventually match or exceed the quality of the strongest existing Vesper environments while maintaining browser performance.

Different factions should have distinct:

- Ship designs.
- Architecture.
- Equipment.
- Clothing.
- Signage.
- Visual identity.

Use reusable assets where practical.

---

# 14. AUDIO AND ATMOSPHERE

Audio should reinforce immersion.

Potential audio elements include:

- Ship engines.
- Weapon firing.
- Cockpit alerts.
- Hangar ambience.
- Station machinery.
- Radio chatter.
- NPC conversations.
- Environmental sounds.
- Warp effects.
- Background music.

Riffusion or other appropriately licensed music and sound assets may be used.

Audio should complement gameplay rather than overwhelm dialogue or critical alerts.

---

# 15. TECHNICAL ARCHITECTURE

The game uses Babylon.js and JavaScript.

3D assets may use Blender and GLB/glTF formats.

The website is hosted through GitHub Pages.

Relevant existing infrastructure includes Firebase authentication and associated backend services.

## Development Principles

- Preserve working systems.
- Avoid unnecessary rewrites.
- Reuse existing assets.
- Maintain compatibility with saved games.
- Centralize mission logic.
- Centralize ship and weapon balance data.
- Avoid unnecessary dependencies.
- Optimize browser rendering.
- Keep Iris integrations isolated from core game systems.

## Performance

The game should remain playable on hardware such as the ASUS ROG Ally Extreme.

Use:

- Optimized geometry.
- Level of detail.
- Instancing.
- Texture budgets.
- Efficient lighting.
- Controlled NPC counts.
- Performance profiling.

## Codex Delivery

For development changes:

- Inspect the existing implementation.
- Modify only necessary files.
- Run available tests.
- Report changes.
- Document limitations.
- Package only changed/new files in a ZIP.
- Preserve repository-relative paths.

Do not package the entire website unnecessarily.

---

# 16. VISUAL BALANCE LAB

Create a separate development tool for balancing gameplay.

This should be accessible outside the game.

The Balance Lab should allow comparison of:

- Hull strength.
- Armor.
- Damage.
- Agility.
- Power.
- Weapon DPS.
- Time to kill.
- Difficulty levels.

Use visual comparisons inspired by military aircraft stat displays.

Where possible, balance calculations should use the same authoritative data as the actual game.

Clearly distinguish simulated values from live gameplay values.

---

# 17. DEVELOPMENT ROADMAP

## Phase A — Stabilization

Fix:

- Tutorial softlocks.
- Mission progression conflicts.
- Mara/Rook mission separation.
- Save compatibility problems.

**Goal:** Player can reach Rook without tutorial interference.

## Phase B — Mission Interface

Implement or improve:

- Mission Log.
- Mission tracking.
- Navigation arrows.
- Objective status.
- Completed mission history.

**Goal:** Players can switch missions reliably.

## Phase C — Meridian Station

Improve:

- Head-on docking.
- Station layout.
- Corridor.
- Shop interactions.
- Bar relocation.
- NPC navigation.

**Goal:** Meridian Station works as a believable, explorable destination.

## Phase D — Cockpit and Flight

Improve:

- 3D cockpit.
- Functional instruments.
- Targeting displays.
- Flight feedback.
- Performance.

**Goal:** The spacecraft feels like a physical vehicle.

## Phase E — Core Gameplay

Expand:

- Rook cargo missions.
- Space combat.
- Bounty hunting.
- Derelict stations.
- First-person combat.

**Goal:** Establish complete, repeatable gameplay loops.

## Phase F — World Expansion

Develop:

- Sol System.
- Earth.
- The Darknet District.
- Mars.
- Communion territories.
- Natural Order territories.
- Additional ships.

**Goal:** Create a larger connected game world.

## Phase G — Advanced Systems

Expand:

- Radar.
- Scanning.
- Stealth.
- Jamming.
- Advanced NPC behavior.
- Ship balance.
- Skirmish options.

**Goal:** Increase gameplay depth without sacrificing reliability.

---

# 18. QUALITY ASSURANCE

The following player journey should work reliably:

1. Start a new campaign.
2. Receive the gun from Mara.
3. Shoot training targets.
4. Board the Kestrel.
5. Learn flight controls.
6. Receive the separate cargo mission.
7. Select the cargo mission in the Mission Log.
8. Navigate to Meridian Station.
9. Enter the hangar nose-first.
10. Explore the station.
11. Visit the shop.
12. Reach the bar.
13. Find Rook.
14. Continue the cargo campaign.
15. Save and exit.
16. Reload without losing progress.
17. Return to the Main Menu.
18. Enter Skirmish without corrupting Campaign progress.

The game should also be tested for:

- Browser compatibility.
- Frame rate.
- Collisions.
- NPC interactions.
- Weapon functionality.
- Mission persistence.
- Inventory accuracy.
- Loading transitions.
- Scene switching.
- Save migration.

A successful build alone does not mean the game is fully tested.

---

# 19. RISKS AND OPEN DECISIONS

Several areas require additional design or technical decisions:

- Detailed cockpit models and texture requirements.
- Migration of older mission saves.
- Performance costs of large 3D environments.
- Real-money ship purchase integration.
- AI-powered NPC conversations.
- Iris API usage and operating costs.
- Final ship prices.
- Cargo capacity balancing.
- Mission rewards.
- Faction reputation rules.
- Final star map and travel distances.

These should be resolved progressively as the game develops.

---

# 20. LONG-TERM OBJECTIVE

VOID//RUNNER should become a connected science-fiction world where players can:

- Explore planets and stations.
- Pilot and upgrade spacecraft.
- Transport legitimate or illegal cargo.
- Hunt criminals.
- Fight pirates.
- Discover abandoned installations.
- Build relationships with characters.
- Participate in faction conflicts.
- Make meaningful choices.
- Progress through an evolving campaign.

The game's systems should be designed for expansion without repeatedly rebuilding existing functionality.

**Ultimate development principle:**

Build a reliable, enjoyable player experience first, then expand the world and its complexity while preserving everything that already works.

---

**END OF VOID//RUNNER MASTER GAME DESIGN PLAN**
