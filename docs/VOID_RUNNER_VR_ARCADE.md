# VOID//RUNNER: the Darknet District VR arcade (2026-10-27)

David's brief: make the District's VR play area a working entertainment system. You approach the terminal, take a booth from its player, the world dissolves, and a different interactive world assembles around you.

## How it works

- **Terminal:** the existing VR terminal now says **E · ACCESS VR EXPERIENCES** and opens an opaque menu.
  - Four simulations: Relax in a Forest, Play in a Bedroom (choose a companion first), Combat Simulator, Tropical Escape.
  - An experience marked anything but `ready` is shown as IN DEVELOPMENT and can't be launched.
- **Booths:**
  - The arcade player in the booth you need (the shooter booth for combat, the social booth otherwise) walks to the corner.
  - You step into the station, and the world breaks into glowing digital cells over a data-stream grid.
  - The simulation assembles cell by cell. The effect covers its loading; if loading runs long, the grid keeps going.
  - NeoChinatown is unloaded while you're inside and rebuilt when you exit, so the arcade players are back at their rigs, as before.
- **Framework (`vr-core.js`):** experiences register `{id, title, description, status, station, options, settings, layout(opts), build(ctx)}`.
  - Each world is a walkable location using the game's own first-person controller, collision and E-interactions.
  - Each is built only when launched, and its meshes, textures, materials, lights, particles and sound are disposed on exit.
  - `vr-kit.js` holds the shared pieces:
    - lighting, saved and restored
    - photo skies
    - model loading and cheap scattering
    - painted foliage and water
    - walkable terrain
- **Isolation:**
  - Saving is paused for the whole session.
  - Credits, inventory, ammunition, cargo, equipment, missions and the story's met list are put back on exit.
  - The pistol inside uses simulated ammunition.
  - The Personal HUD is offline (no Sky Cabs, Comms or inventory changes), and the real world's captions and mission banner are hidden.
- **Exit:** the **EXIT VR · BACKSPACE** chip, Backspace, Esc for the VR menu (settings plus EXIT VR), or the controller's View button. You dissolve back to the terminal.
- **Reload during VR:** the save is the one from before the session (it carries `story.flags.vrReturn`), so you start at the terminal.
- **Failure:** if a world fails to load, you're returned to the terminal with a message.
- **Sound:** generated in the browser, with no audio files.
  - **Forest:** wind, leaves, a stream that gets louder near it, and birds.
  - **Beach:** surf, louder near the shore, and gulls.
  - **Range:** a low hum and target sounds.
  - **Suite:** a soft chord pad in three presets.
- **Music:** the city's score stops while you're inside.

## The four experiences

- **Relax in a Forest:**
  - **Scenery:** hills and woodland paths, a stream and a waterfall with mist, about 110 painted-leaf trees, and photoscanned grass, ferns, moss, boulders and logs. There are light shafts in the clearing, birds wheeling overhead and butterflies.
  - **Interactions:** sit on the bench or the log by the stream, touch the water, lie down in the clearing, watch wildlife from the hide (a flock comes over), and ring the wind chimes.
  - **Settings:** birdsong, stream volume and sunbeams.
- **Tropical Escape:**
  - **Scenery:** a sand beach, an animated sea reflecting the sky, foam washing in and out, palms with painted fronds, ferns and grass, rock outcrops, a thatched shelter with a patio set, three loungers under an umbrella, a pier with a bench at its end, and gulls.
  - **Interactions:** the loungers, the pier bench, wade into the surf, pick up three shells (they stay in the simulation), and change the sky (afternoon or sunset).
- **Combat Simulator:**
  - **The range:** holographic, with a 60-second challenge.
  - **Targets and drones:** pop-up and sliding targets; from 20 s, drones that strafe and fire harmless training bolts that cost virtual health.
  - **Scoring and difficulty:** score, accuracy, time and health on a board and on screen; Easy, Normal or Hard; start and reset consoles.
  - **The weapon:** a simulated pistol is lent if you have none; the real kit is put back on exit.
- **Play in a Bedroom:**
  - **The suite:** a furnished suite above a dusk sea, with a picture window and a glass door to a balcony.
  - **Controls:** four mood-lighting presets (warm, rose, night, candlelight), three music presets, curtains, and seats on the sofa, bed, armchair and balcony rail.
  - **Companions:** choose Seren (female) or Kai (male), two original adult characters built with MakeHuman and animated with idle, talk, walk, sit, dance and gesture clips that cross-fade.
  - **Companion behaviour:**
    - The companion greets you, turns to face you, and talks through the game's own dialogue panel.
    - Lines come from varied pools and are never the same twice in a row.
    - They walk to the sofa and sit with you, dance with you (starting music if it's off), hold hands, and say goodnight, which ends the session.
  - **Affection and the kiss:** affection grows through conversation. A kiss is only offered when you're close (sitting or dancing) and have talked a while; before that, the companion declines kindly. The kiss is shown as a lean-in and a warm fade, never explicit.
  - **Optional:** everything here is optional; you can simply enjoy the room.

## Needs David's review

- **Companions:** their names (Seren, Kai), personalities and every line are **drafts**. They are unvoiced until their voices are approved through the audition tool.
- **Experience descriptions:** the menu descriptions too.

## Not done yet

- **Animation:** no dedicated kiss or hand-holding motion. The companion steps close and plays a gesture.
- **Arcade players:** they have no walking clip, so stepping aside is a short slide.
- **Assets:** no imported tree, palm or animal models. Poly Haven's trees are full photoscans (up to 487 MB), so trees, palms and birds are built here.
- **Simulator display:** the on-screen pistol counter shows the real magazine; the simulated one is separate and invisible.

## Assets

About 6.7 MB of models, textures and skies, plus 6.1 MB for the two companions. Sources and licences are in `docs/VOID_RUNNER_ASSET_LICENSES.md` (VR arcade section).
