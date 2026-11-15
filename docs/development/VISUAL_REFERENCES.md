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
- **VR play area.** Two glass-walled booths side by side in a dark concrete room, one lit **pink** and one **cyan**: scratched glass panels in steel frames, a ceiling light bar in the booth's colour, a tracking camera in each upper corner, a headset and two controllers hung on a small wire-mesh rack on the back wall (with a short light strip above and below it), a floor unit, cables along the wall, and the play space marked on the wet floor with a thin line and corner marks in the booth's colour. Faint holograms (a fish, a city) on the glass. A bar with ring lights is visible beyond. **For the VR area; not rebuilt yet.** This is the one room where David's reference keeps coloured strip light, so the hallway's "no neon strips" rule should not be applied blindly there.
- **Repair workstation (for one half of the storage cage; built, first version).** An electronics bench under pink light: a green cutting mat with circuit boards, pliers, tweezers, a solder spool and flux; a red multimeter; a magnifier on a jointed arm; a soldering station showing 350 C; a rack of screwdrivers; shelves of small labelled parts bins (RES, CAP, IC, DIODE, LED, CONN, SWITCH, XTAL, MISC); a bench power supply showing 12.00 V; a small oscilloscope; two monitors (a board layout, a terminal); cables everywhere; a worn chair.
- **Security vestibule doors, both sides (two pictures).** Outside, in a wet alley: a heavy dark steel double door in a chamfered frame, each leaf with a raised octagonal panel, thin magenta and blue light lines set into the panels and frame corners, twin vertical handles with a lit slot, hinges, "THE DARKNET DISTRICT" with a small skyline mark painted on the right leaf and hazard stripes under it, a pink light bar in the lintel, a warm caged lamp above it, a fingerprint keypad on the left jamb (cyan print, red buttons), a dome security camera with a red light, an air-conditioning unit, a dragon graffiti, the same skyline sign in pink neon on the wall, bins, steam from a grate, cases stacked to the right. The second picture is the same door straight on, inside the room. **For the entrance and vestibule pass; not built yet.** The vestibule must still look identical on both sides of the checkpoint and loading must still happen only with both doors closed.
- **Arcade room.** A dark room of worn upright cabinets with chipped paint, lightning-bolt and sunset side art, glowing screens and lit buttons, coin doors with red lights; chrome stools with red seats; a pink fluorescent tube in a battered fitting; posters (a sunset grid, a city, a face in sunglasses); a pink neon triangle on the wall; a hanging CRT monitor showing static; cables across the ceiling; a window with blinds on a neon city; a lava lamp on a round table; haze, and pink and cyan reflections on a wet floor. **For the arcade; not rebuilt yet.** Like the VR booths and the bar, this room's reference keeps coloured neon: the hallway standard gives the quality (dark worn surfaces, real fittings, drawn bounce light, haze), the room's own reference gives its colour.

## References and instructions from David's later message (same session): written out, pictures not in the repository

- **Admin (three pictures).** An older man, about sixty: swept-back silver-grey hair, short grey beard, weathered skin. A heavy dark technical jacket with a high fleece or ribbed collar, **mustard-yellow panels** at the shoulders and front, zips, chest pocket, a dark turtleneck under it. One picture has a bulky headset visor, one slim dark glasses with a red dot: **David: in the store he is WITHOUT eyewear.**
- **Iris (one picture, three views).** A humanoid android who still reads as very human: a young woman's face, pale skin, grey-blue eyes with a small **amber light** on each cheekbone, a choppy **white bob** with a long fringe, a black ear module, a high black textured collar, grey-white armour plates on shoulders and upper back with visible joints.
- **Street characters (two group pictures)** for regular NPCs and player looks: layered black techwear, long coats, cargo trousers, heavy boots with lit soles, harnesses and pouches, coloured hair (blue, green mohawk), tattoos, visors and goggles, a hooded figure with a red mask, a kimono with dragon embroidery, a medic with red crosses, a cook in a stained apron, a suited woman with a case, glowing parasol.
- **NeoChinatown street.** NULL nightclub front with a pink sign, a rope line and doormen; a taxi with lit trim; a noodle stall with red lanterns, stools and steam; bollards with lit tops; graffiti; a distant tower with a ring; flying vehicles; heavy rain reflections.
- **Sleeping Pod interior (two more pictures).** As before (scratched pale-pink panels, window at the foot, player screen left, vending unit right, pink strips, amber accents, fan vent), seen from the bed.

**David's instructions with these** (none of this is built unless a later entry says so):
1. Upgrade Admin and Iris to these references.
2. Upgrade NPCs in the District and NeoChinatown, and the player models.
3. **V1 holographic polish and a third-person V1 hologram** for NPCs and other players (a long brief: keep the layout and readability; subtle shimmer, edge light, depth, open/close glow; a layered floating projection facing its user, device-use pose, fictional content only, no private content to observers; quality tiers; reduced motion). **David wants to APPROVE EVERYTHING in the V1 work before it goes live: show him the plan and pictures first; do not merge V1 changes without his go-ahead.** Note for that work: the hub rejects any extra key in the `state` message, so showing another player's device needs a hub change (`tools/district-hub/protocol.cjs`), which needs David's authorisation.
4. Upgrade the alley (done, `ALLEY_LIFE.md`): four people at most, always a drunk.
5. Upgrade the NeoChinatown streets.
6. Upgrade the pod interior seen right after character creation, and **let the player look around freely there instead of being held to buttons** (free look exists once in the pod normally: `podLook` in `world-integration.js`; the first wake-up screen is the part to check).

## Characters: NPCs and player characters (David, 15 Nov 2026)

Two pictures of NeoChinatown street people, given as the target for "big graphic upgrades" of both NPCs and player characters. David allows saved looks to be reset so players remake them.

- **Picture 1, eight people in a row on a wet neon street:** a woman in a sheer patterned robe with a glowing paper umbrella; a huge bald man with tattooed arms, a mechanical forearm and belt pouches; a medic in a cap and glasses with red-cross patches and pouches; an old man with a white beard, eye-piece and long worn coat reading a holographic tablet; a woman with a green mohawk, bubble gum, a lime jacket and ripped cargo trousers; a heavy cook in a stained apron with a towel on his shoulder; a businesswoman in a black suit with light-piped seams, a tablet and a case; a youth in a beanie and headphones sitting on a crate.
- **Picture 2, five people in an alley:** a woman with blue hair and goggles in a cropped jacket with pink light piping; a man with a shaved-side haircut, face implants, a long coat with red rebel markings, smoking; a hooded figure in a red-lit mask; a woman in an off-shoulder dragon-embroidered robe over thigh boots with red glasses; a man with a headset and cyan visor in a hooded tactical jacket.
- **What they share:** black and near-black layered clothing (leather, coated fabric, canvas), heavy boots, belts, straps, thigh rigs and pouches, tattoos, implants and eyewear, one small coloured light per person (piping, a visor, a device), wet highlights, strong individual silhouettes and clear jobs readable from the outfit (medic, cook, fixer, enforcer).
- **Gap to the game today:** the 22 MakeHuman figures have plain modern outfits, 512-pixel textures, no normal maps and no layered gear (`CHARACTER_MODEL_AUDIT.md`). David's Blender (5.2, reachable through the bridge) has MPFB installed but **no clothing, hair or skin packs**, so new outfits need either packs installed there, purchased models, or outfits modelled by code.

