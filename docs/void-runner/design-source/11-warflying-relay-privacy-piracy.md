# VOID//RUNNER — WARFLYING, THE RELAY BROADCAST NETWORK, SHIP PRIVACY & PIRACY

## ROLE AND PROJECT
You are the lead gameplay systems developer, technical architect, and narrative systems designer for my existing browser game, VOID//RUNNER.
Game: https://thedarknetdistrict.com/void-runner.html
Repository: https://github.com/Smartsec916/the-darknet-district-site
Engine: Babylon.js
Your task is to expand the existing game with interconnected systems for:

1. WarFlying — recreational electronic signal discovery.
2. The Relay — a shared information and broadcasting network.
3. Satellite communications and delayed uploads.
4. Ship privacy and electronic countermeasures.
5. Ship utility modules and equipment management.
6. WarFlying leaderboards and exploration progression.
7. Evidence-based crime detection.
8. Recoverable cargo and a repeatable piracy career.
9. Foundations for future bounty hunting and intelligence gathering.

These systems must work together logically, support future expansion, and fit naturally into the existing universe.
Do not rebuild VOID//RUNNER from scratch.
Inspect the existing implementation before modifying anything. Preserve working gameplay, established characters, mission systems, saving, inventory, ship equipment, and existing storylines.
The goal is a cohesive, playable feature set—not a collection of disconnected prototypes.

## 1. FIRST: AUDIT THE EXISTING GAME
Before implementing new features, inspect the repository and determine what already exists.
Specifically investigate:

* Ship radar and detection systems.
* Emissions controls and stealth mechanics.
* Existing scan functionality.
* Mission and objective systems.
* Ship upgrades and equipment slots.
* Hangar and loadout systems.
* Ship inventory and cargo capacity.
* Ship destruction and cargo drops.
* NPC dialogue and interactions.
* Faction reputation and hostility.
* Police and security behavior.
* Pirate ship behavior.
* Save/load persistence.
* Existing radio and communications.
* Existing audio playback.
* Public station screens and terminals.
* Existing economy and store systems.
* Existing documentation.

Identify implemented features, partially implemented features, and planned-but-unimplemented features.
Avoid duplicating working systems.
Reuse existing architecture where appropriate.
Preserve save compatibility whenever possible.
Document any necessary migrations.

## 2. ESTABLISHED UNIVERSE AND LORE
VOID//RUNNER is a science-fiction spaceflight and first-person game.
It includes independent traders, pirates, law enforcement, corporations, stations, settlements, and competing ideological factions.
Important established locations include:

**Meridian Station**
A major station containing hangars, a bar, stores, NPCs, and mission opportunities.

**The Darknet District**
A discreet privacy-oriented cyberpunk store, lounge, and VR arcade located in NeoChinatown, Tessaly System.
The specific planet has not been established.
Do not relocate it to Earth or Sacramento.
The Darknet District has special privacy protections that must be respected by the systems described below.

**The Nexus**
The Communion homeworld.
Its central AI was devastated by a Natural Order EMP attack, resulting in widespread humanitarian suffering.

**The Natural Order homeworld**
Its name has not yet been established.
It has rural farms, solar installations, practical repair culture, and a strong emphasis on human agency.
Do not invent a permanent planetary name without approval.

**Major factions**

The Communion
Generally supportive of artificial intelligence and sophisticated integrated technology.
Its aesthetic emphasizes white, silver, cyan, and sleek technological design.

The Natural Order
Emphasizes human independence, repairability, practical machinery, and control over technology.
It is not opposed to all technology.
Its aesthetic emphasizes industrial materials, gray, steel, and orange.

The player must retain the freedom to work with either faction, both factions where logically possible, or neither.
Do not force faction allegiance.

## 3. WARFLYING — CORE CONCEPT
Implement a recreational electronic signal discovery system called WarFlying.
WarFlying is inspired by the concept of discovering wireless networks, adapted to the VOID//RUNNER universe.
Players equip a scanner module and travel through space searching for electronic signals.
The scanner passively observes detectable emissions and records information about the sources.
WarFlying is an exploration activity, not automatically a criminal activity.
It should encourage players to visit unfamiliar systems, approach interesting locations, and discover unusual signal sources.
The player should be able to pursue WarFlying independently of the main campaign.

## 4. WHAT CAN BE DISCOVERED
WarFlying should recognize a broad variety of electronic signal sources.
Examples include:

* Civilian spacecraft.
* Cargo ships.
* Passenger ships.
* Police ships.
* Military ships.
* Pirate ships.
* Communion ships.
* Natural Order ships.
* Space stations.
* Navigation beacons.
* Communications satellites.
* Satellite communication signals.
* Industrial installations.
* Remote facilities.
* Automated equipment.
* Unidentified transmitters.
* Unusual electronic emissions.
* Other suitable electronic objects already present in the game.

Do not limit WarFlying to civilian ships.
Police and military vessels can also be discovered if their emissions are detectable.
However, detecting a signal must not automatically reveal classified information.
The system should distinguish between discovering an emitter and knowing everything about it.

## 5. PASSIVE SCANNING
The WarFlying scanner is primarily a passive electronic observation tool.
It should detect signals based on existing game-world conditions and radar/emissions systems where appropriate.
Factors may include:

* Distance.
* Signal strength.
* Whether the source is transmitting.
* Whether the source has disabled unnecessary emissions.
* Electronic interference.
* Privacy countermeasures.
* Regional environmental conditions.

Do not make the scanner omniscient.
It should not automatically identify every ship regardless of distance or emissions state.
It should not magically reveal hidden ships.
Preserve the existing distinction between radar, active detection, passive detection, and emissions management.
WarFlying must not replace normal navigation radar.

## 6. WARFLYING POINTS
The scoring system must remain simple.
Every newly discovered unique signal source is worth exactly ONE point.
No rarity multipliers.
No special point bonuses for military vessels.
No extra points for unusual objects.
No repeated point farming.
Examples:

* Discover one civilian cargo ship: +1.
* Discover one police ship: +1.
* Discover one satellite: +1.
* Discover one navigation beacon: +1.
* Discover one military ship: +1.

All count equally.
The challenge is discovering more unique sources.
This rule should be centralized so future development cannot accidentally introduce inconsistent scoring.

## 7. UNIQUE SIGNAL IDENTIFICATION
Each discoverable source needs a stable identity.
The system must distinguish between:

* A genuinely new source.
* A previously discovered source.
* A source seen again at a different location.
* A temporary contact whose identity cannot yet be established.

Use stable identifiers wherever possible.
Avoid treating a reused generic ship name as proof that two contacts are the same vessel.
Avoid generating unlimited points from respawned versions of the same logical object.
The exact identity strategy should fit the existing spawning and persistence systems.
If a signal cannot be confidently associated with a unique object, handle it conservatively rather than awarding repeated points.

## 8. REPEATED OBSERVATIONS
Previously discovered signals can be observed again.
Repeat observations should update the discovery record.
Useful information includes:

* First discovery timestamp.
* Most recent observation timestamp.
* Last known location.
* Previous observed locations.
* Signal category.
* Signal identity confidence.
* Signal characteristics.
* Number of observations.

Repeated observations must not award additional points.
This historical information will eventually support intelligence gathering, bounty hunting, and other gameplay.
Do not confuse repeated sightings with new discoveries.

## 9. WARFLYING DISCOVERY DATABASE
Create a persistent collection of WarFlying records.
Each record should contain appropriate structured information.
Suggested fields:

* Unique source ID.
* Display name, if known.
* Source category.
* First observed time.
* Last observed time.
* Observation history.
* Known or estimated locations.
* Identification confidence.
* Signal characteristics.
* Discovery point awarded.
* Upload status.
* Relevant faction or affiliation, if known.
* Optional notes or metadata.

Do not store unnecessary data.
Use the existing save architecture where practical.
The system should support future expansion without requiring a complete rewrite.

## 10. LOCAL RECORDING
WarFlying must continue working without an active communications network.
The scanner records observations locally aboard the player's ship.
The player should still be able to:

* Discover signals.
* Earn points.
* Review discoveries.
* Review observation history.
* Continue exploration.

Satellite communication outages must not erase local records.
The player must not lose WarFlying progress simply because a regional relay is unavailable.

## 11. THE RELAY — SHARED NETWORK
Introduce or expand The Relay as the universe's shared information and broadcasting network.
The Relay is a working name unless later changed.
It carries:

* Uploaded WarFlying observations.
* WarFlying leaderboard information.
* News.
* Advertisements.
* Public announcements.
* Faction statements.
* Propaganda.
* General broadcasts.
* Selected public intelligence.

It should feel like an established communications network used by the broader game universe.
It is not exclusively a WarFlying service.
The Relay does not belong automatically to either the Communion or the Natural Order.
Do not invent ownership or political control without approval.

## 12. SATELLITE COMMUNICATIONS
The Relay depends on communications infrastructure.
Satellite communication availability should be modeled separately from local radar and scanning.
A ship may still detect nearby objects even when its connection to The Relay is unavailable.
Represent communications availability through a reusable system.
Possible states include:

* Connected.
* Weak or degraded connection.
* Disconnected.
* Temporarily unavailable.

Only implement complexity that is useful and maintainable.
Do not invent unnecessary simulation overhead.

## 13. UPLOADING WARFLYING RECORDS
WarFlying observations are collected locally.
Uploading them to The Relay is a separate process.
Support:

**Automatic upload**
When enabled, eligible records upload whenever a working satellite connection is available.

**Manual upload**
The player can choose to upload pending records when communications are available.

Do not require immediate uploads to award local discovery points.
Do not make automatic uploading mandatory.
Keep the player's local discovery database separate from the shared information network.

## 14. OFFLINE UPLOAD QUEUE
When satellite communications are unavailable:

* New observations remain stored locally.
* Records requiring upload enter a pending queue.
* Existing discovery points remain intact.
* The player can review pending records.
* Uploads resume when connectivity returns, if automatic upload is enabled.

If automatic uploading is disabled, preserve the records until the player chooses to upload.
Prevent duplicate submissions.
Handle interrupted uploads safely.
The queue should survive saving and reloading.

## 15. REGIONAL COMMUNICATION OUTAGES
Communications failures should be regional or infrastructure-dependent where appropriate.
Future missions may involve:

* Destroyed communication satellites.
* Damaged relay stations.
* Repaired communication infrastructure.
* Deliberate signal interference.
* Temporary regional blackouts.

Do not invent or implement these missions now.
Instead, build a clean communications state system that future missions can influence.
For example, a future mission could change the communications status of a region without requiring changes to the WarFlying scanner itself.
An outage should not automatically disable every ship system.

## 16. WARFLYING INTERFACE
Provide a practical WarFlying interface within the existing ship UI.
It should show:

* Scanner installed or not installed.
* Scanner operating status.
* Newly discovered signals.
* Total unique discoveries.
* Total WarFlying points.
* Pending uploads.
* Network connection status.
* Automatic upload setting.
* Manual upload action.
* Discovery history.
* Last known observations.

Use existing interface conventions.
Avoid covering the cockpit with oversized panels.
The interface should be accessible but should not obstruct normal flight.
Provide clear notifications for new discoveries.

## 17. WARFLYING LEADERBOARD
Create an in-universe WarFlying leaderboard.
Use fictional NPC competitors initially.
Suggested competitors include:

* GhostVector.
* SignalWraith.
* EchoNine.
* VoidWalker.
* RiftRunner.

Their scores should progress over game time.
The player should be able to climb the rankings through legitimate discoveries.
Avoid unrealistic score inflation.
Do not make NPC rankings depend on an actual online leaderboard service.
Use the existing save system so progression remains consistent.
A real online leaderboard may be considered later.
Do not implement real multiplayer rankings now.

## 18. THE RELAY AS A BROADCAST NETWORK
The Relay should distribute programming through:

1. Ship radio.
2. Public screens and terminals.

These are two ways of receiving content from the same underlying network.
Avoid creating entirely unrelated news and announcement systems for radio and public displays.
Use shared content records where practical.
Different presentation formats are acceptable.
For example, a news story might have a spoken radio version and a shorter visual headline.

## 19. RADIO BROADCASTS
The ship radio should support suitable Relay content.
Possible programming includes:

* WarFlying leaderboard announcements.
* General news.
* Faction news.
* Commercial advertisements.
* Police recruitment messages.
* Shipping reports.
* Station announcements.
* Public safety notices.

The radio should make the universe feel alive.
However, routine broadcasts must not interfere with critical gameplay.
Prioritize:

1. Critical gameplay and combat warnings.
2. Mission-critical dialogue.
3. Direct NPC communications.
4. Important breaking news when safe to play.
5. Routine Relay broadcasts.
6. Nonessential ambient chatter.

Use existing audio systems where possible.
Do not create overlapping announcements that make dialogue unintelligible.
Support subtitles for spoken content.

## 20. PUBLIC SCREENS
Where appropriate, Relay programming should appear on public screens in:

* Stations.
* Bars.
* Public waiting areas.
* Commercial facilities.
* Other suitable locations.

Use existing screen and display systems where possible.
Content may include:

* Headlines.
* WarFlying rankings.
* Advertisements.
* Public notices.
* Faction messaging.

Keep displays readable and appropriate to the environment.
Do not add unnecessary performance-heavy rendering systems.

## 21. THE DARKNET DISTRICT PRIVACY EXCEPTION
The Darknet District is a discreet, privacy-oriented location.
Public Relay broadcasts must not play inside its protected premises.
WarFlying collection must not operate inside its protected premises.
This is an intentional part of the location's identity.
However, the following should still work:

* Local music.
* Arcade games.
* Sleeping pod playlists.
* Private communications.
* Appropriate local announcements.
* Existing store interactions.

Do not disable unrelated functionality.
Use a location-specific policy rather than hardcoding broad global restrictions.

## 22. ADMIN AND IRIS
The Darknet District includes two important NPCs:

**Admin**
Male, pragmatic, dry personality.

**Iris**
Female android Chief Security Officer.

They must remain physically present and interactable in the location.
Do not replace them with generic terminals.
Do not modify the separate website Iris chatbot as part of this task.
Preserve established characterization.

## 23. ADMIN'S INITIAL CARGO MISSION
An existing story element involves Admin asking the player to deliver a mysterious sealed shipment to Rook.
The mission is called or associated with:
"Don't Ask Questions"
This first delivery must remain trouble-free.
Do not add:

* Police inspections.
* Forced arrests.
* Mandatory combat.
* Confiscation.
* Automatic wanted status.
* Unavoidable interdiction.
* Unexpected mission failure caused by security forces.

The cargo contents remain unknown.
Do not reveal what is inside.
Do not rewrite this into a major criminal confrontation.
The mystery is intentional.

## 24. ADMIN INTRODUCES WARFLYING PRIVACY
After the initial cargo mission, Admin should be able to discuss WarFlying and the privacy implications of shared electronic observations.
The conversation should explain that ordinary electronic emissions can allow ships to be discovered and their movements recorded.
WarFlying records can become useful to people other than hobbyists.
This includes people interested in tracking vessels or studying traffic patterns.
Admin should introduce the idea of protecting the player's electronic identity.
Keep his dialogue consistent with his dry, practical personality.
Do not make him deliver an excessively long technical lecture.

## 25. SHIP WARFLYING SCRAMBLER
Admin should offer a purchasable WarFlying Scrambler.
Its purpose is to make the player's ship more difficult to identify reliably through WarFlying observations.
It should interfere with identification, not make the ship physically invisible.
The scrambler may:

* Reduce reliable electronic identification.
* Make some observations ambiguous.
* Complicate linking multiple sightings to the same ship.
* Reduce the usefulness of shared movement records.

It must not:

* Make the ship completely undetectable.
* Disable all radar contacts.
* Prevent visual identification.
* Guarantee immunity from police.
* Automatically erase existing records.
* Retroactively remove uploaded sightings.
* Block direct inspections.
* Function as an unlimited magical stealth system.

Preserve meaningful gameplay tradeoffs.

## 26. EXACTLY ONE SHIP UTILITY SLOT
Establish one mutually exclusive ship utility equipment slot.
This slot can hold exactly one of the following:

1. WarFlying Module
2. WarFlying Scrambler
3. Signal Tracker — future bounty-hunting equipment

The player cannot install more than one simultaneously.
This restriction is important.
The WarFlying Module enables the recreational scanning system.
The Scrambler provides electronic identification countermeasures.
The Signal Tracker will eventually provide intelligence about targeted ships.
Integrate the slot with the existing hangar and ship loadout systems.
Do not create a second competing equipment interface.

## 27. EQUIPMENT SWAPPING
Players should be able to change utility modules through an appropriate hangar or loadout interface.
Preserve ownership of purchased modules when they are unequipped.
Do not allow equipment swapping arbitrarily during combat or flight unless the existing game explicitly supports it.
Provide clear descriptions of each module.
Show which module is currently installed.
Validate the one-slot restriction during:

* Purchases.
* Equipment changes.
* Save loading.
* Ship changes.
* Any relevant inventory operations.

## 28. FUTURE SIGNAL TRACKER
Reserve the third utility module for a future bounty-hunting system.
The Signal Tracker will eventually allow a player to query shared WarFlying observations concerning a particular targeted ship.
It should use uploaded observation history.
It must not provide omniscient real-time tracking.
A future result might include:

* Last known sighting.
* Time of sighting.
* Location.
* Identification confidence.
* Previous sightings.

This is intelligence, not a magical live position feed.
Do not implement the complete bounty-hunting tracking gameplay now.
Only establish the equipment definition and architecture needed for future integration.

## 29. SCANNER PRIVACY AND CARGO CONTENTS
WarFlying is an electronic signal observation system.
It must not automatically reveal cargo contents.
A WarFlying discovery should not display:

* Exact cargo inventory.
* Hidden contraband.
* Private passenger manifests.
* Confidential mission contents.
* Sealed shipment details.

Other future gameplay systems may support cargo inspections, but WarFlying itself must not bypass those mechanics.
This is especially important for smuggling and piracy gameplay.

## 30. FULL-TIME PIRACY AS A CAREER
Players must eventually be able to pursue piracy as a repeatable career.
Piracy should not be limited to one scripted mission.
The core gameplay loop is:

1. Find a suitable cargo vessel.
2. Decide whether to attack.
3. Fight and destroy the vessel.
4. Recover physical cargo.
5. Carry the cargo in the player's ship.
6. Find a buyer willing to purchase it.
7. Sell the cargo.
8. Use the proceeds for repairs, ammunition, fuel, equipment, or other expenses.
9. Repeat.

Piracy should offer potential profit while introducing meaningful risk.
Do not force the player into a pirate faction.
Do not invent a mandatory criminal organization.
The player should be able to operate independently.

## 31. RECOVERABLE CARGO
When an eligible cargo ship is destroyed, it may leave recoverable cargo.
Spawn at most ONE physical recoverable cargo unit per destroyed eligible cargo vessel.
Do not spawn unlimited loot.
Do not create a cloud of dozens of cargo containers.
The cargo unit should be physically represented in the game world.
The player must approach and collect it through appropriate existing pickup mechanics.
The cargo must respect the player's ship cargo capacity.
If the player lacks capacity, the pickup should fail gracefully and explain why.
Prevent duplicate cargo spawning from the same destroyed ship.

## 32. CARGO OWNERSHIP AND SALES
Recovered cargo should become an inventory item with appropriate metadata.
Potential fields include:

* Cargo type.
* Quantity or unit.
* Value.
* Origin.
* Ownership or provenance, if relevant.
* Whether it is stolen or suspicious.
* Applicable sale restrictions.

Not every legitimate merchant should automatically purchase stolen cargo.
Some buyers may refuse suspicious goods.
Others may be willing to purchase them.
Use existing shops, markets, and NPCs where appropriate.
Do not invent an entire criminal economy if the current architecture can support the basic loop.
Avoid guaranteed profit on every encounter.
Piracy should involve meaningful economic decisions.

## 33. EVIDENCE-BASED CRIME DETECTION
Do not automatically make the player wanted merely because they attack a ship in an isolated area.
Crime detection should depend on evidence and observation.
Potential evidence sources include:

* Witnessing vessels.
* Distress transmissions.
* Police observations.
* Ship telemetry.
* Electronic identification.
* WarFlying records.
* Other relevant sensor data.

Distinguish between:

* A crime occurring.
* A witness observing the event.
* Evidence being recorded.
* Evidence being transmitted.
* Authorities receiving evidence.
* Authorities identifying the responsible ship.

These are related but different events.
The system should support this distinction.

## 34. WARFLYING AND CRIME EVIDENCE
WarFlying observations can potentially contribute to identifying a ship's location or movements.
However:
Simply appearing near a crime scene must not prove guilt.
A WarFlying sighting is evidence of an observation, not automatic proof of criminal conduct.
A scrambler may complicate identification.
Communications outages may delay the transmission of observations.
A distress signal may fail to reach authorities when satellite communications are unavailable.
Direct witnesses may still identify the attacker.
Build a coherent foundation without making the system unrealistically omniscient.

## 35. POLICE RESPONSE AND WANTED LEVELS
The game may eventually include a more sophisticated wanted system.
Possible future mechanics include:

* Police investigations.
* Identification of suspects.
* Warrants.
* Regional wanted status.
* Pursuit.
* Interdiction.
* Fines.
* Arrest.
* Confiscation.
* Escalating law enforcement responses.

Detailed wanted-level balancing and pursuit behavior are deferred.
Do not implement a large police simulation in this task.
Do not automatically apply universal wanted status for every hostile action.
Instead, build or preserve clean interfaces through which future law enforcement systems can consume evidence.
Do not disrupt existing police behavior unnecessarily.

## 36. SAVE SYSTEM AND PERSISTENCE
All relevant new systems must persist correctly.
This includes:

* WarFlying points.
* Unique discoveries.
* Observation histories.
* Upload queues.
* Automatic upload preferences.
* Current network status where appropriate.
* Installed utility module.
* Owned utility modules.
* NPC leaderboard state.
* Recovered cargo.
* Relevant evidence records.
* Other persistent state introduced by this work.

Avoid bloating save files unnecessarily.
Support older saves where practical.
Do not erase existing campaign progress.
Validate restored state.
Prevent duplicated discovery points, cargo, or equipment after loading.

## 37. PERFORMANCE, UI, AND AUDIO
VOID//RUNNER runs in a web browser.
Performance matters.
Avoid:

* Constantly scanning every world object every frame.
* Unbounded observation history growth.
* Excessive memory allocations.
* Massive UI panels.
* Unnecessary network calls.
* Large blocking operations.
* Audio overlap.
* Expensive rendering of public displays.

Prefer event-driven systems and reasonable update intervals.
Integrate with existing UI and audio controls.
Use clear, readable notifications.
Maintain acceptable performance on modest gaming hardware.
The system must not require a live AI service or paid backend.

## 38. TESTING AND VALIDATION
Create and execute appropriate tests.
Verify:

**WarFlying**

* Unique discovery awards exactly one point.
* Repeat observations award zero additional points.
* Discovery history updates correctly.
* Different signal categories are recognized.
* Scanner requires the correct utility module.
* Local discoveries work without satellite communications.

**Communications**

* Automatic uploads work when connected.
* Manual uploads work when connected.
* Uploads queue while disconnected.
* Queued records survive save/load.
* Uploads resume appropriately.
* Duplicate uploads are prevented.
* Radar continues functioning during Relay outages.

**Equipment**

* Exactly one utility module can be installed.
* Scanner and scrambler cannot operate simultaneously.
* Owned modules remain available after swapping.
* Older saves load safely.
* Future Signal Tracker support does not accidentally enable unfinished gameplay.

**Privacy**

* Scrambler complicates electronic identification.
* Scrambler does not make ships completely invisible.
* WarFlying does not reveal cargo inventories.
* The Darknet District blocks public Relay broadcasts and WarFlying collection.
* Local music, arcade games, private communications, and existing interactions still work.

**Piracy**

* Eligible destroyed cargo ships produce no more than one recoverable cargo unit.
* Cargo pickups respect ship capacity.
* Cargo cannot be duplicated.
* Cargo can be sold only to appropriate buyers.
* Basic piracy gameplay remains repeatable.
* Mere proximity to a crime does not automatically establish guilt.

**Story and regression**

* Admin's initial sealed cargo mission remains trouble-free.
* The shipment contents remain unknown.
* Admin and Iris remain physically present.
* Existing missions still progress correctly.
* Faction relationships remain intact.
* Existing ship flight, combat, saving, and equipment systems remain functional.

## 39. DOCUMENTATION
Document the implementation.
Include:

* WarFlying architecture.
* Discovery identification strategy.
* One-point scoring rule.
* Observation database structure.
* Satellite communications model.
* Upload queue behavior.
* Relay broadcast integration.
* Darknet District privacy rules.
* Utility module configuration.
* Scrambler behavior.
* Future Signal Tracker interfaces.
* Cargo recovery rules.
* Evidence model.
* Save migration details.
* Known limitations.
* Deferred features.
* Test results.

Keep documentation aligned with actual implemented behavior.
Do not claim planned features are complete.

## 40. SCOPE CONTROL AND APPROVALS
This is a substantial feature expansion.
Implement it in manageable stages.
First produce an audit and implementation plan.
Then prioritize:

**Stage A — Foundation**

* Existing system audit.
* Stable signal identities.
* Local observation storage.
* WarFlying scoring.
* Utility slot architecture.

**Stage B — WarFlying gameplay**

* Passive scanning.
* Discovery interface.
* Persistence.
* Fictional leaderboard.

**Stage C — Communications and privacy**

* Satellite connectivity.
* Upload queues.
* Scrambler.
* Darknet District privacy policies.

**Stage D — Relay integration**

* Shared broadcast content model.
* Radio integration.
* Public display integration.
* Appropriate broadcast priorities.

**Stage E — Piracy**

* Physical cargo recovery.
* Cargo inventory integration.
* Buyers and sales.
* Evidence foundations.

**Stage F — Testing**

* Automated tests.
* Gameplay verification.
* Save compatibility.
* Documentation.

Before major architectural changes, identify what must change and why.
Do not implement unrelated deferred systems.
Do not create new storylines merely to demonstrate the technology.
Do not add paid services.
Do not overwrite unrelated work.
Do not deploy to the live website without approval.

## 41. FUTURE FEATURES — DO NOT IMPLEMENT YET
The following are explicitly deferred:

* Real multiplayer WarFlying leaderboards.
* Full bounty-hunting Signal Tracker gameplay.
* Detailed police investigation and wanted-level mechanics.
* Satellite destruction missions.
* Satellite repair missions.
* Large-scale communications warfare.
* Major new criminal factions.
* Mandatory faction allegiance.
* Complex multiplayer intelligence sharing.

Build foundations that can support these later.
Do not turn this task into an uncontrolled expansion.

## 42. FINAL REPORT
When finished, provide a detailed development report covering:

1. Existing systems discovered during the audit.
2. Features implemented.
3. Features already present and reused.
4. Files created or modified.
5. How WarFlying works.
6. How discoveries and points are stored.
7. How satellite uploads work.
8. How the utility slot and scrambler work.
9. How The Relay is integrated.
10. How recoverable cargo and piracy work.
11. How crime evidence is handled.
12. Save compatibility and migration.
13. Tests performed and their results.
14. Known bugs or limitations.
15. Deferred features.
16. Any decisions requiring my approval.

Do not claim success without testing.
If a system is only partially implemented, state that clearly.

## FINAL DEVELOPMENT PRINCIPLES
VOID//RUNNER should feel like a living universe where electronic signals, privacy, information sharing, commerce, and crime interact naturally.
WarFlying should be a rewarding exploration hobby.
The Relay should make the universe feel connected.
Privacy equipment should provide meaningful tradeoffs.
Piracy should be a viable independent career.
Crime detection should depend on evidence rather than magical knowledge.
Satellite communication outages should have believable consequences without disabling unrelated ship systems.
Above all, preserve the player's freedom to explore, trade, fight, remain independent, or become a pirate.
Begin with the repository audit. Compare these requirements against the existing implementation, identify gaps, and avoid redoing completed work. Then propose the implementation stages and proceed with approved work.
