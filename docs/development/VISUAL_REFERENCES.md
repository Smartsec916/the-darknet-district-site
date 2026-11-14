# Visual reference images (12 Nov 2026)

David supplied these pictures on 12 November 2026. The files are not in the repository yet. Each entry below says so. Until they are added under [`references/`](references/README.md), these descriptions are the reference.

This file records looks, and the limits he set with them. It does not start the work. Do not change game code from this file alone.

Two limits apply even when the matching job is underway:

- Leave the existing Sleeping Pod room as it is until David says otherwise. Pod code stays in `void-runner/neochinatown.js`, `void-runner/pod-music.js`, and `void-runner/world-integration.js`.
- The VR play area keeps its two divided areas and its layout. Lighting only, on that job.

In-game Iris stays a game character. Do not connect the website chatbot (`chatbot.html`, `iris-*.html`, `identity_api.py`). The Iris picture below is a look reference only.

If a picture is added later and it disagrees with the text, ask David. Do not guess which one wins, except where an entry already says the primary look wins.

## Admin

**Feeds:** the in-game NPC Admin, the man at the District shop counter (`characterModel('admin')` beside the shop). Not the website admin tools, and not a new person.

**Images:** two, both pending.

**Unmasked.** Silver hair, a grey beard, and a grey jacket with mustard-orange panels. He holds a tablet. His face is visible.

**Masked.** The same man in a black respirator mask, with an earpiece, and a black hooded tactical coat with orange accents.

Admin does not have a glowing cyber-eye in either picture. Do not add one.

## Iris

**Feeds:** the look of the in-game Iris, the android Chief Security Officer who stands in the shop with Admin (`characterModel('iris')`). The website picture is the source of the primary look. It does not put the website chatbot into the game.

**Primary (the website picture).** Image pending. White-silver bob with bangs, pale skin, grey-blue eyes, two glowing orange dots under the eyes, black earpieces, a high black collar, and gunmetal/black segmented armour with orange lights.

**Secondary (angle sheet).** Image pending. Longer messy white hair, a cheek mark, and a white and grey plated suit.

The primary wins on conflicts. If the angle sheet disagrees about the hair, the face, or the armour, build the website picture.

## Zen Zephyr

**Feeds:** the character Zen Zephyr, and the Sanctum of the Circuit. David plans that temple as a taxi-only hilltop scene, far from the city. It is not built, and it is not one of the current taxi stops (those are the zones in `void-runner/road-taxi-rules.js`). A shop T-shirt and the track "Sanctum of the Circuit" already use the name. This picture is the character and the place, not the shirt.

**Image:** pending.

A meditating android monk. Silver head, closed eyes, a dark robe with a mustard sash, mechanical arms, and teal lights on the chest. He is in a misty temple whose pillars are server racks.

## Container housing (Outskirts)

**Feeds:** the Outskirts container housing. On the map this is the placeholder district Container Settlement (`id: 'containers'`, south of the built streets). The block is still a placeholder. This picture is the look for when that block is built.

**Image:** pending.

A shanty of shipping containers in rusted red, faded teal, and dirty yellow, stacked one or two high. Corrugated roofs, solar panels, air-conditioning units, tarps, and laundry. The ground has muddy puddles and junk. Cables sag between power poles. One doorway is lit warm yellow. The sky is a stormy teal. In the distance, a satellite rig and the city skyline.

## Vending machine

**Feeds:** the glass-front cannabis vending machine. This is not the sleeping-pod wall unit. That unit already has its Tesana stock and stays flavour only (nothing charged, nothing added to inventory) until David decides otherwise. It is also not, by itself, an order to restyle the three machines in the District vending alcove.

The age-policy question for vending flavour is still open in the handoff. This picture does not settle it.

**Image:** pending.

A dark metal cabinet with a glass front. Clear acrylic bins of green buds. Green and white branded pouches with black oval labels, and price cards. Black slots with buttons. Lighting is purple, pink, and green. On the left: a card/crypto reader, a screen, and the pickup slot.

## Corporate guard robots

**Feeds:** the corporate guard robots on the Corporate District street. That district is still a placeholder (`id: 'corporate'`). The picture covers how they look and how they behave.

**Image:** pending.

Bulky humanoid robots in matte black segmented armour. Rounded helmets with no face. Eyes glow red/pink. A small orange light on the chest. Hoses and cables at the sides, an antenna on the back, and long black rifles held low. The street has rainy teal glass towers, vertical neon signs, and wet pavement.

They stay passive unless the player acts, for example by breaking in. If the player walks up to an entrance, they ask what the player is doing there.

## Sleeping pod occupants

**Feeds:** how people inside Sleeping Pods should look, and the stay David described. Do not modify the existing sleeping pod room until David says so. The room, the ten pods, the music player, and the wall vending unit stay as they are.

In-game occupants must stay clothed and non-explicit. If a reference reads as more revealing than that, the game version stays covered.

**Images:** four, all pending. Each is a tight white capsule lit by one strong colour:

1. Teal light strips.
2. Cyan, with a red side panel.
3. Hot pink neon.
4. Pink light bars.

Shared in all four: hex windows, small screens, and wall panels. The occupants are tattooed punk/goth women who look tired after a shift. Hair is a bob, a ponytail, or long. They wear boots, and fishnets or stockings, and the rest of their clothes stay on.

**Pod flow he described, not built by this note.** Walk over from the bar, reserve a pod for an 8 hour or a 12 hour shift, then get out. Recorded here so the later pass has it. The room is unchanged until he says otherwise.

## District store

**Feeds:** Iris and Admin's shop inside the District (interaction `district-shop`). Not the website store, and not Shopify.

**Image:** pending.

The picture is a dark gear shop. Tactical backpacks and vests hang on a black wall. Magazines and pouches sit on wood-topped counters. Screens show glitchy red neon. Ceiling cables are exposed. Fluorescent tubes light the room. The back door is covered in graffiti.

David wants the built shop more cluttered than that picture:

- In front: clothing racks, electronics, and a holo viewer for stickers, patches, and QR codes.
- Behind the counter: cluttered storage, and an electronics workstation.
- A metal mesh wall at the back, with a storage walkway behind the mesh.

## VR play area lighting

**Feeds:** lighting only, in the existing VR play area. That room is the two glass booths off the hallway: NEON STRIKE (the shooter) and SKYLINE SOCIAL, split by the glass partition, with the viewing strip by the hallway (`void-runner/neochinatown.js`, the VR arcade block). Do not move the walls, the partition, the booths, or the hallway opening. Do not merge or redivide the two areas.

The five-cabinet arcade in the old pod room is a different room (`ARCADE.md`). This entry does not restyle it.

**Image:** pending.

A neon VR arcade corridor. The base of the room is low and dark. Hot magenta and pink light the left side and the ceiling. Cyan and teal light the right side and the length of the corridor. A pink neon menu sign. Thin white fluorescent tubes. At the far end, a doorway lit warm yellow-orange. Small screens pick up amber and green. The floor is glossy, wet-look, and reflects the pink and the teal. Light haze. High contrast.

## Building kit style

**Feeds:** the modular facade kit for buildings. Mood only. No separate picture.

Use these as the mood, once their images are in: the District store, the arcade corridor (the VR play-area lighting picture above), the Outskirts containers, and the corporate street. Those images are pending.

Facades should read as worn concrete and metal, dark, with the neon carrying the colour. This does not authorise rebuilding the store, the VR room, the container block, or the corporate street.

This is not the earlier `docs/cyberpunk-kit-reference` branch. That kit was reviewed and not adopted. Do not revive it from this note.

## References David pasted into the chat during the hall wall session (after 15 Nov 2026)

The pictures themselves are not in the repository (the cloud session cannot save chat images or read David's `DDD-References-*.zip` archives). Written out so the next session can work from them. Mood references, not floor plans.

- **Hallway / container alley.** A dark service alley lined with shipping containers used as stalls: dark navy corrugated steel, container frames, cabinets and breaker boxes on the walls, pipes and a mezzanine overhead, a wet concrete floor with yellow edge lines. Light: cold white from above (skylight and small bulkhead lamps), small **red** lamps at the stalls, red light lying on the wet floor. No neon strips. David's notes: wall "similar to a shipping container", "a little darker"; "remove the neon stripe lighting"; white lights "partially covered with cables, vents... so the light is less direct, and more coming from behind"; "some coloured lighting for accents along the hallway".
- **Sleeping Pod interior (two pictures).** A capsule with scratched metal panels and rounded corners, a large rounded window at the foot showing a neon street, a music player screen on the left wall, a glass-fronted vending unit on the right (drinks, snacks, small cases), magenta LED strips, short **amber** accent strips, a ceiling fan vent, a louvred grille, a rumpled duvet. David's later correction: **"the sleeping pods are too light, they should be darker panels with lighting"**: keep the panels dark and let the strips, screens and vending glass carry the colour.
- **Pod corridor.** A narrow dark corridor of capsules with arched openings and cushioned benches, grated metal floor, white ceiling panels behind grilles, orange-framed lit vending panels, pink and red spill light.
- **Pod hatch.** A capsule door edged with a pink light ring, a small screen inside, a hexagonal window.
- **Vending machines (two pictures).** Glass-fronted refrigerated cabinets, each shelf lit by its own cold white tube with one shelf washed pink: clear tubs and jars of dried herbal buds with dark labels, next to snacks and drinks. David: "some object in the vending machines should have things similar to this as well as snacks". (The pod vending list already has GREEN NEON and MIDNIGHT KUSH jars, marked fictional.)
- **Bar / oxygen bar.** A dark bar with an "OXYGEN BAR" sign (O2 mark, Japanese lettering), tall glowing cyan oxygen cylinders with bubbles on the back bar, two wall screens (OXYGEN MENU: O2 Purity Blend, Hyper Focus, Recovery, Calm, Sleep Prep; DRINK MENU), bottle shelves, a long counter with a pink light under its edge, chrome stools, booths, patrons breathing through masks on hoses, a pink dome pendant lamp, a window on a neon city. **For the bar room; not built yet. The menu wording and the oxygen service are new content: propose to David before adding interactions.**
- **The Darknet District store (five pictures).** A dark shop inside container walls: wire-mesh panels with rifles and carbines mounted on them under warm strip lights, rails of black hoodies and jackets with graphic prints, backpacks and plate carriers hung on pegboard, a workbench with gear laid out, a glass display cabinet, cardboard boxes on the floor, bare fluorescent tubes in battered reflectors, sagging cable bundles, graffiti and stickers, a red LED sign and red lamp glow, a small neon outline sign. **For the Admin and Iris shop; not built yet.**
- **Storage behind Admin and Iris.** David: "there should be a separate area with a mesh divider behind Admin and Iris for storage". Not built yet: a caged stock area behind the counter (wire-mesh partition, shelving, boxes); check the counter's collision and the Admin/Iris positions before placing it.
