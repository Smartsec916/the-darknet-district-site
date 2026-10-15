# VOID//RUNNER — Faction Homeworlds, Planetary Missions & Admin's Secret Cargo

David's brief (October 2026), condensed. **All dialogue in the game uses his exact wording**; the rules below are summarized. Sections 17–20 (Admin's secret cargo, police patrols, Rook's delivery) are built separately.

## Decisions (David, 2026-10-15)
- **The Nexus** is the Communion homeworld, in the **Cantor System**, orbited by The Vigil.
- The Natural Order homeworld is in the **Garrow System**, shown as **"Natural Order Homeworld"** until David names it.
- The homeworlds open when Elara's or Marcus's homeworld offer is accepted.

## Continuity
Elara and Marcus send a shipment to their homeworld. **Dr. Adrian Kess** (Nexus Infrastructure Recovery Coordinator) and **Daniel Mercer** (Agricultural Supply Coordinator) receive it and offer optional work for a faction ship upgrade. The player can return to the District for Iris's payment at any point. The cargo payment and the planetary work are independent. Admin and Iris stay in their store.

## The Nexus
- **History:** the Nexus AI, a planetary data centre, was integrated into citizens' bodies and daily life, and robots and automated infrastructure did the work. A Natural Order EMP attack severely damaged it, and it has never recovered.
- **People:** many now struggle with communication, labour, repair, decisions and household tasks. They are not unintelligent; they are recovering from the loss. Some adapt and rebuild, and some pray for the Nexus to return.
- **Look:** advanced but damaged; quiet; partly abandoned; hopeful in places. Damaged data-centre structures, broken terminals, flickering displays, disabled robots, exposed cables, repair crews, citizens gathered around terminals.
- **Music:** ethereal, melancholic, with occasional hopeful elements, never horror.

## Natural Order homeworld
A low-tech agricultural world: farming, mechanical labour, practical engineering, solar power, local production. It rejects autonomous AI control but not modern technology. It has fields, settlements, solar arrays, irrigation, workshops, machinery, storage and busy workers. Rural, productive and independent, occasionally strained, and never primitive. The music is organic percussion, warm and grounded.

## Dialogue
(Implemented word for word in `void-runner/homeworld-scenes.js`; arrival and offer scenes as written in the brief.)

**Kess, arrival:** "You must be the pilot Elara sent." … "Actually, there may be something you could help us with."
**Kess, offer (Helping Hands, `communion_restoration_01`):** "We have equipment that needs repairing…" … "So, are you interested?" Choices: I'll help / Tell me more about the scanner / Not right now. Decline: "Understood. The offer will remain open."
**Mercer, arrival:** "You the pilot Marcus sent?" … "Actually, if you've got some time, we could use another pair of hands."
**Mercer, offer (Keeping Things Running, `natural_order_agriculture_01`):** "We've got farms waiting on equipment…" … "So, interested?" Choices: I'll help / Tell me more about the thrusters / Not right now. Decline: "Suit yourself. We'll have work if you change your mind."

## Missions
- **Helping Hands:** collect medical supplies and deliver them to the aid station; repair infrastructure; restore a basic service; return to Kess. No combat. Reward: **Communion Targeting Scanner**, which really reduces missile lock time. Range, ammunition, damage and targeting rules are unchanged; it is not instantaneous; it persists. Clean, cyan Communion design. The game records that it is installed, for future reactions.
- **Keeping Things Running:** deliver farm equipment; move food to a distribution point; deliver parts to and repair a solar installation; return to Mercer. No combat. Reward: **Natural Order Maneuvering Thrusters**, which improve yaw, pitch and roll response but not top speed, weapons or shields. Rugged mechanical design. The game records it for future reactions.
- Both are optional and can be accepted, declined or postponed. Both modules can be fitted together. No automatic hostility, allegiance or reputation change.

## Restrictions
Do not invent planet names, leaders, settlements beyond these focused areas, enemies, or outcomes beyond these missions. Do not force allegiance. Keep environments focused and performant.
