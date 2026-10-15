# VOID//RUNNER — FACTION CAMPAIGN EXPANSION
## Iris Cargo Contracts & Faction Homeworld Missions

**Project:** VOID//RUNNER  
**Location:** The Darknet District — NeoChinatown, Tessaly System

This expansion begins after the player completes the original two introductory cargo deliveries and returns to The Darknet District to collect payment. Its purpose is to transition the player from ordinary cargo deliveries into faction-specific storylines on the factions' respective origin planets.

Important: David will personally decide what happens on each planet next. Do not invent or implement those planetary storylines yet.

## 1. Admin and Iris must always be in the store

Both Admin and Iris should be present in their store on every visit, and both remain visible and interactable. Admin must not disappear or be replaced by Iris. Do not duplicate either NPC.

- **Admin:** handles the original introduction to the Communion and Natural Order, provides his established dialogue, and remains available for appropriate future interactions.
- **Iris:** handles payment for the established faction cargo contracts, offers additional cargo missions after the introductory deliveries, and remains available for appropriate future interactions.

**David's clarification (2026-10-15):** on the visit where Iris pays the first delivery and says Admin is "Occupied", Admin is not shown. Keep "Occupied".

## 2. Return after the second introductory cargo delivery

**IRIS:** "Back again. You're becoming something of a regular."  
**PLAYER:** "Finished the delivery."  
**IRIS:** "So I see. Both shipments delivered, both clients satisfied. Remarkable, considering they can barely tolerate each other's existence."  
*(Iris confirms the delivery and transfers payment.)*  
**IRIS:** "There you are. All settled."  
*(She checks another set of shipping contracts.)*  
**IRIS:** "Actually, I have a little more work available. Both factions have requested additional supplies."  
**PLAYER:** "More deliveries?"  
**IRIS:** "Essentially. Although these shipments are a little more specialized."  
**PLAYER:** "Specialized how?"  
**IRIS:** "Each faction has rather particular requirements. The Communion wants technology. The Natural Order prefers equipment they can maintain without asking a machine for permission."  
*(Iris displays two contracts.)*  
**IRIS:** "Both destinations should be familiar to you by now. Interested?"

## 3. Player choices

Both contracts remain available independently.

**A. "Tell me about the Communion shipment."**  
**IRIS:** "Specialized processing modules, sensor components, and research hardware. Apparently they're expanding one of their projects."  
**PLAYER:** "What kind of project?"  
**IRIS:** "They haven't said. And I find it's generally best not to ask too many questions when someone is paying for delivery."  
Return to contract selection.

**B. "What does the Natural Order need?"**  
**IRIS:** "Industrial control assemblies, replacement machinery, and heavy-duty mechanical components."  
**PLAYER:** "Nothing computerized?"  
**IRIS:** "Oh, they use computers. They simply prefer theirs to remain obedient."  
Return to contract selection.

**C. "I'll take the Communion delivery."** Accept the Communion follow-up cargo mission, add faction-specific cargo, track the Communion destination.

**D. "I'll take the Natural Order delivery."** Accept the Natural Order follow-up cargo mission, add faction-specific cargo, track the Natural Order destination.

**E. "I'll think about it."**  
**IRIS:** "Of course. The contracts will remain available."  
End the conversation; accept neither; keep both available.

## 4. Faction-specific cargo

**Communion cargo manifest:** advanced processing modules; high-precision sensor assemblies; specialized research electronics. Do not establish the exact purpose of the equipment yet.

**Natural Order cargo manifest:** industrial control assemblies; heavy-duty mechanical components; replacement machinery and repair equipment. Do not establish the exact purpose of the equipment yet.

**Cargo rules:** use the existing cargo system; preserve cargo capacity restrictions; do not grant extra cargo space; identify each shipment clearly; prevent duplicate cargo; preserve cargo state through save/load; keep both contracts independently available; do not require allegiance to either faction.

## 5. Communion delivery — Dr. Elara Voss

**ELARA VOSS:** "Back again? I was hoping we'd see you."  
**PLAYER:** "I've got another shipment from The Darknet District."  
**ELARA VOSS:** "Excellent. We've been waiting for these components."  
*(Elara reviews the cargo.)*  
**ELARA VOSS:** "Everything looks to be in order. Thank you."  
**PLAYER:** "Seems like you need a lot of equipment."  
**ELARA VOSS:** "We do. There's quite a bit of work underway, and the situation with the Natural Order isn't making things any easier."  
*(She pauses.)*  
**ELARA VOSS:** "Actually, since you're here, there may be something else you could help us with."  
**PLAYER:** "What kind of help?"  
**ELARA VOSS:** "A delivery on our homeworld. Something that would help our people. I'd rather explain the details once you're there."

**Mission transition:** mark the cargo delivered; update the delivery mission; direct the player back to The Darknet District for Iris's payment; unlock a Communion planetary mission offer from Elara; allow accept, decline or postpone; do not create the actual planetary objectives yet. The player must not lose access to Elara or the offer by leaving to collect payment.

## 6. Natural Order delivery — Marcus Vale

**MARCUS VALE:** "Well, look who's back. Starting to think you're the only pilot out there who delivers anything on time."  
**PLAYER:** "Got another shipment for you."  
**MARCUS VALE:** "Good. We can use these parts."  
*(Marcus checks the cargo.)*  
**MARCUS VALE:** "Everything's here. That's a relief."  
**PLAYER:** "Having problems?"  
**MARCUS VALE:** "Nothing we can't handle. Just seems like every time we get one thing running, something else needs fixing."  
*(He shakes his head.)*  
**MARCUS VALE:** "And with the Communion stirring things up, supplies aren't getting any easier to come by."  
**PLAYER:** "Sounds like you could use some help."  
**MARCUS VALE:** "Actually, now that you mention it, there's another job. Down on our homeworld. Something that could make a real difference to our people."  
**PLAYER:** "What needs doing?"  
**MARCUS VALE:** "I'll explain the details when you're ready to head down there."

**Mission transition:** as for Elara, with a Natural Order planetary mission offer from Marcus.

## 7. Faction origin planets

Both factions have origin planets that will eventually hold faction-specific missions. For now: do not invent planet names, governments, leaders, settlements, terrain, enemies, combat encounters, mission causes or outcomes, or major faction developments, and do not decide which faction is right. Use clearly marked placeholders. Do not create playable planetary environments without approval.

## 8. Planetary mission placeholders

- **communion_origin_mission_01** (implemented id `communion-origin-mission-01`; saves allow only hyphens): Faction / Planetary; giver Dr. Elara Voss; Communion origin planet; status awaiting creator design; description "A faction-specific cargo mission intended to help the Communion's cause"; objectives not yet defined.
- **natural_order_origin_mission_01** (implemented id `natural-order-origin-mission-01`): Faction / Planetary; giver Marcus Vale; Natural Order origin planet; status awaiting creator design; description "A faction-specific cargo mission intended to help the Natural Order's cause"; objectives not yet defined.

These must not be completable and must not invent rewards, objectives, enemies or outcomes. If accepted before their content exists, the game must say the mission is not yet available rather than send the player anywhere.

## 9. Mission progression

1. **Admin:** introduces both factions; player picks the first delivery.
2. **First faction:** small faction space battle; deliver to Elara or Marcus; return to the District.
3. **Iris:** pays; offers the other original delivery; Admin remains present.
4. **Second faction:** second introductory delivery; return; Iris pays.
5. **New Iris contracts:** both offered; either can be chosen; both independently available.
6. **Faction contacts:** Communion cargo to Elara, Natural Order cargo to Marcus; each introduces a homeworld mission.
7. **Future planetary missions:** designed and approved separately.

## 10. Mission system requirements

Stable unique ids; both Iris contracts independently tracked; accepting one does not remove the other; both can be completed; cargo and credits awarded once; return-for-payment stays part of the cargo mission; the correct NPC receives each shipment; the correct homeworld mission becomes available afterward; everything survives save/load; markers update; missions can be tracked and untracked independently; placeholders never block other gameplay. Do not force the player to join either faction.

## 11. Character continuity

Admin (always present; nonchalant, business-minded), Iris (always present; android Chief Security Officer; handles payments and follow-up contracts), Dr. Elara Voss (Communion recipient; introduces Communion homeworld missions), Marcus Vale (Natural Order recipient; introduces Natural Order homeworld missions). Do not rename, replace or relocate them without approval.

**STOP DEVELOPMENT AT THE PLANETARY MISSION STAGE.** David will provide the planetary mission designs, events, objectives and outcomes later.
