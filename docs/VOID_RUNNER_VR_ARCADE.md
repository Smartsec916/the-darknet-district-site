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
  - **Suite:** a soft chord pad in three presets over a low city hum.
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
  - **The apartment (redesigned 2026-10-28):** a dark, private bedroom high above NeoChinatown at night (`vr-suite-room.js`).
    - **Room:** charcoal plaster walls with large panels on one side, a fluted walnut feature wall behind the bed, a soffit around a raised ceiling with a hidden violet cove, and amber downlights.
    - **The bed:** a low walnut platform on a hidden plinth with magenta light underneath. It has a channel-tufted velvet headboard with a magenta halo, a draped charcoal duvet, a magenta throw, and stacked pillows.
    - **Furniture:** floating walnut nightstands with marble tops, pendant globes, candles and books. There is also a low velvet sofa, a marble coffee table and a slim floor lamp.
    - **Decor and workstation:** an ink-and-neon painting with a picture light, a backlit shelf over a credenza, and a floating desk whose holo screen shows the music and an equaliser. A leather lounge chair sits by the glass, with two calatheas.
    - **The view:** floor-to-ceiling glass with heavy curtains, partly drawn, and a sliding door onto a balcony with a glass rail.
    - **Outside:** about 170 lit towers, around 40 vertical Chinese neon signs and three Tessaly ads (one cycles), with amber avenues far below. Haze rises off the streets, flying traffic moves in both directions, and a far skyline fades into a magenta haze.
    - **Lighting:** magenta leads, with violet, muted pink and warm amber. There are six lights:
      - a magenta key behind the headboard
      - two amber pendants
      - a lounge lamp
      - the city's light through the glass, which drifts slowly between violet, magenta and cyan
      - a soft light that stays in front of the companion's face
    - **Light washes:** painted washes add the glows on walls, floor and ceiling.
    - **Reflections:** the floor reflects the room and the city on High quality.
  - **Controls:** four mood-lighting presets (Rose, the magenta default; Warm; Night; Candlelight), three music presets, curtains (partly drawn or pulled back), and seats on the sofa, the bed's edge facing the view, the lounge chair and the balcony rail.
  - **Companions:** choose Seren (female) or Kai (male), two original adult characters built with MakeHuman and animated with idle, talk, walk, sit, dance and gesture clips that cross-fade.
  - **Companion behaviour:**
    - The companion greets you, turns to face you, and talks through the game's own dialogue panel.
    - Lines come from varied pools and are never the same twice in a row.
    - They walk to the sofa and sit with you, dance with you (starting music if it's off), hold hands, and say goodnight, which ends the session.
  - **Affection and the kiss:** affection grows through conversation. A kiss is only offered when you're close (sitting or dancing) and have talked a while; before that, the companion declines kindly. The kiss is shown as a lean-in and a warm fade, never explicit.
  - **Optional:** everything here is optional; you can simply enjoy the room.

## Companions, choosing one, and life on the streets (2026-10-28)

David's briefs: believable, attentive companions with their own initiative, a two-step companion choice built for many more models later, the Combat Simulator off the terminal for now, and nightlife in NeoChinatown. The bedroom's look is unchanged: the same eight camera views, compared pixel by pixel before and after, differ by under 1 brightness level out of 255. The only changed pixels are moving things: traffic, the cycling ad and the music screen.

- **Terminal:**
  - **Experiences offered:** Relax in a Forest, Tropical Escape and Play in a Bedroom.
  - **Combat Simulator:** still registered (`listed:false` in `vr-combat.js`), with its code and assets kept. It can't be launched from the terminal or by normal play.
- **Choosing a companion:**
  - **The steps:** Play in a Bedroom → **Female / Male** → a gallery of that category's companions, each with a picture, name, short description and a selected tick → **Enter VR**. Back returns to the step before.
  - **Only usable companions can be picked.** The gallery checks each model's file and the clips it carries. A missing or incompatible one shows why and can't be chosen.
  - **Changing companion:** leave the simulation and choose again.
- **The companion registry (`void-runner/vr-companions.js`):** each entry holds the companion's id, name, category, model, preview picture, rig profile, clip roles (their own gestures), voice (none yet), personality settings and dialogue.
  - **Adding a companion:** build a MakeHuman look with the companion clips (`tools/animation-pipeline`), list it in `crowd.js`, then `register()` it. Neither the terminal nor the bedroom needs changing. Only the chosen companion is loaded.
- **Attention:**
  - **Head tracking:** the chest, neck and head turn so the face points at your eyes wherever you walk, while standing, sitting, talking or mid-gesture. Measured in the browser, they're within 1–5° of your eyes, sideways and up or down.
  - **Body turning:** if you go round behind them, they turn their whole body.
  - **Glances:** now and then they look away (out of the window, or to one side), then come back to you smoothly.
  - **Eyes and face:** the MakeHuman models have no eye bones or face shapes, so eyes, blinking and smiles aren't animated.
- **Initiative (the "brain"):**
  - **Who starts things:** they come over to you, comment on the view when you're at the window, and ask to join you when you sit on the sofa. If you stand near them without doing anything, they make a remark or a flirtatious aside, or invite you to dance, sit or lie back on the bed. "Not now" is respected: they won't ask that again for three minutes.
  - **When you come and go:** they greet you again after time apart, and watch you go when you walk away.
  - **On their own:** they wander, look out of the window, sit on the sofa, or play a gesture.
  - **How they move:** they walk round the furniture on a path (A* over the room's collision). Their remarks are subtitles, so they never stop you moving.
- **Flirting and gestures:** a blown kiss, a shy finger-wave, a coy look, a head tilt, hands on hips (Seren), a laugh, a look over the shoulder, a shrug when you decline, a slow romantic sway, a playful dance (Seren's belly dance, Kai's samba), a seated wave and a relaxed seated idle. New menu options: **Come over here** (from across the room) and **Lie back together** (they stretch out on the bed and you sit at its edge).
- **Personalities:** Seren is playful, warm and teasing (more initiative, more flirtatious). Kai is relaxed, attentive and wry (looks at you more, comes over less).
- **Behaviour settings (`defaults` in `vr-companions.js`; each personality overrides some):** initiative, flirtatiousness, approach frequency, attention, personal space, cooldowns for invitations, declines, approaches and remarks, idle-activity timing, walking speed, head-tracking strength, maximum head turn and tilt, and the body-turn thresholds.
- **NeoChinatown nightlife (`void-runner/ncz-nightlife.js`):**
  - **The crowd:** 22 people (High) or 14 (Medium) walk the sidewalks of Main Street, the avenue and the alley by the District. Low quality keeps the five standing people only.
  - **Drunks:** about 8% are drunk (configurable), and only on the nightlife lanes. They stagger and sway, stop to steady themselves, lean on walls, laugh and mutter a remark when you're near. Half of them have a sober friend walking beside them.
  - **Passers-by:** they glance, step round a drunk and sometimes laugh. Pairs walk together. Everyone steps round you and the standing crew. Nobody stops at the District door or the taxi stands, and no collision was added.
  - **Performance:** 60 fps in the browser test.
- **Crowd variety:** District and Meridian figures now and then break their loop with a laugh or a drink (`varietyFor` in `crowd.js`).
- **Testing:** Seren and Kai were both checked in the browser:
  - the picker
  - head tracking
  - body turning
  - paths
  - invitations and declines
  - sitting and lying back
  - gestures
  - three entries and exits

  The real game's credits, kit, missions and story stayed unchanged.

## Nadia, the first converted companion (2026-10-28)

- **Who she is:** **Nadia** (named by David): grounded, warm and direct. She grew up in NeoChinatown and teases you for being an outsider. She has her own settings: medium initiative and flirtatiousness, she comes over often, and she speaks a little more often than Seren. Her lines are her own DRAFTs.
- **Her model:** David's free CGTrader model "Realistic Contemporary Woman FC1" by Ludovisions. It is now a third companion in the Female gallery. The model's internal name stays `vr-companion-fc1`.
- **How she was made:** `tools/animation-pipeline/build_imported_character.py` with `characters/vr-companion-fc1.json`:
  - **Skeleton:** her bones are renamed to our Mixamo names, so head tracking and all 24 companion clips work. Her own A-pose rest pose is kept, and the clips are mapped from their T-pose.
  - **Size:** she was cut from 775,000 polygons to about 55,000 triangles:
    - The hair is kept as about 45% of its strips, each cut to 4 segments, with a low alpha cut-out.
    - The clear eye shells and the tongue are removed.
    - Skin hidden under the dress and shoes is removed; see-through lace keeps the skin under it.
    - Shoes, dress, teeth and pendant are decimated.
  - **Textures:** 512 px. The file is 8.8 MB.
- **Blinking:** her face keeps its two blink shapes, and the bedroom blinks any companion whose model has them, every 2–6 s.
- **Protection:** the model ships as `vr-companion-fc1.vrpak`, which the asset loader unscrambles (CGTrader's licence asks games to keep the model from casual extraction). It is not encryption.
- **Outside the repository:** the editable master (`FC1-master.blend`, full detail with the renamed rig) and the original download are in `%LOCALAPPDATA%/void-runner-assets/work/characters-2026-10-28/fc1` and `.../downloads/characters-2026-10-28/ludo`.

## The VR terminal and a compact companion menu (2026-10-28)

- **The terminal:** the VR menu used to open at an invisible spot. It now has a physical kiosk standing on that spot in the viewing strip by the booths' glass partition (`neochinatown.js`, `terminal`), facing the hallway.
  - **How it looks:** a dark plinth and pedestal, an angled console head with cyan and magenta edge strips, a halo light and a floor glow.
  - **The screen:** a live screen listing the terminal's own experiences, so the hidden Combat Simulator never shows. A highlight cycles through them, with small level bars, a scan line and a pulsing "[E] SELECT EXPERIENCE".
  - **Collision and prompt:** its collision is the `arcade-terminal` solid, and the E prompt sits at the screen.
- **Companion conversation (VR sessions only; `vr.css`, `body.vr-session`):**
  - **Plain lines:** a slim, fully opaque subtitle box at the bottom (620 px wide at most).
  - **The choice menu:** an opaque side panel (400 px) on the right, with compact buttons grouped Talk / Together / Leave in two columns. It scrolls on small screens and becomes one column on phones.
  - **Controls:** arrows, WASD or the d-pad move the highlight; Enter, Space, E or A choose; Escape or B closes the menu (Never mind / Not now). The first option is highlighted when it opens.
  - **Unchanged:** every interaction is still there, and story dialogue outside VR keeps its usual panel.
  - **Weapon chip:** hidden in VR (it overlapped the menu, and you're never armed there).

## Ava and Eva: two companions together, with looks (2026-10-30)

- **Who:** **Ava** (BGShop's "Ava" v2.0) and **Eva** (the CGTrader model "PrettyGirl_01"; that name is only in the build tools). Names by David. Registered as `ava` and `eva` in `vr-companions.js` (Eva's model keeps its internal name `vr-companion-pg`). Each has her own empty `personality` and `dialogue` and her own voice identity (`voice.characterId` `vr-ava` / `vr-eva`, no voice chosen yet); nothing is copied from Seren. Their personalities, lines and voices are David's to write.
- **Offered only on a local development server** (`listed:'dev'`): their CGTrader licences aren't confirmed for release, so on the public site the terminal still offers Seren and Nadia only. Locally (localhost or 127.0.0.1) the Female gallery shows Ava and Eva too.
- **Together:** both are `pairable`. In the gallery, selecting one and then the other brings both (`{companions:['ava','eva']}`); selecting a picked one again leaves it out; any other companion comes alone. The terminal remembers the last choice (`localStorage['void-runner-companion-party-v1']`) and picks it again. Each companion has her own model, looks, brain, head tracking, spot by the window, place on the sofa (you sit between them) and talk spot (`vr-companion`, `vr-companion-2`); each has her own floor shadow, and the face light lights whichever is nearer.
- **Keeping apart:** a destination closer than 0.9 m to where the other one is or is going moves round her; on the way the second gives way to the first for a moment, and either steps round one standing in the way. In the browser test the two were never closer than 0.79 m while following.
- **Commands (any companion):** *Follow me* (they keep a place behind you, each to her own side), *Stay here* (they keep their place; remarks continue, wandering stops) and *Go back to your spot*. Each is independent: one can follow while the other stays.
- **Without lines:** no speech box appears. Their menu opens with a plain prompt ("With Ava. What would you like to do?"), offers what needs no words (sit, dance, lie back, hold hands, the commands) and hides Chat, Compliment, Flirt, Kiss, Relax and Say goodnight. Invitations wait for lines. A command shows a short notice ("Ava is coming with you.").
- **Looks (VR menu, Esc):** one row per look, named per companion when two are in the room; changes are live and saved per browser (`localStorage['void-runner-companion-looks-v1']`, a preference like graphics and audio, not in the Campaign save).
  - Ava: *Outfit* (red top and skirt, default; bikini), *Hairstyle* (bob, default; long; pixie), *Glasses* (none, default; round; wire), *Make-up* (natural, default; the source's alternate make-up face texture). The round glasses were reduced from 135,000 to 8,000 triangles; their tinted lenses are left out (no transparency in the companion materials).
  - Eva: *Outfit* (white, default; blue floral; pink cherry; grey slip dress; the prints are texture variants of one dress), *Hair colour* (natural orange-and-white, default; black; blond; ginger; red; white; blue), *Eye colour* (brown, default; blue; green; hazel), *Make-up* (looks 1-6, 5 default). Colour and make-up variants are 2048 px textures in `assets/models/crowd/<model>/*.vrtex` (scrambled like the models; Eva's 19 MB together), loaded only when chosen.
  - Not offered: Eva's second body skin tone (the face textures may not match it).
- **How they were made:** `prepare_ava.py` / `prepare_prettygirl.py` turn each source into a clean Blender file, then `build_imported_character.py` (which also takes a `.blend` source) renames the bones to Mixamo and retargets the same 24 clips as Nadia.
  - Ava: Rigify control rig reduced to its deform bones with a clean chain; hairstyles and glasses skinned to the head; blink shapes made from her lid shapes. Skin under the top is split off (shown with the bikini only, as the source masks it), keeping the whole body's normals so the join doesn't show; skin under the skirt and bikini is set a few millimetres inward. The skirt takes the body's hip, pelvis and thigh weights so it bends when she sits; the bikini bottom is worn under the skirt. Materials take each source material's own images; hair textures have their colour bled into transparent texels (no light fringes) and are a little rougher (less sparkle).
  - Eva: materials rebuilt from the supplied textures; bones re-oriented on import, with the body chain aimed explicitly (the head had been aimed at its hair bones, which tipped her head over in every clip); one dress and slippers copy per print.
- **GPU memory (2026-10-31):** Ava's and Eva's textures are KTX2 / Basis Universal (`tools/assets/ktx2-glb.mjs`): base colour and normal maps as UASTC (sRGB and linear respectively, normal maps with Basis normal-map tuning), roughness / metal / occlusion as ETC1S; all with mipmaps and Zstandard. The GPU keeps them compressed (BC7 on this machine; ASTC or ETC on phones), transcoded on load by the locally hosted decoder in `void-runner/vendor/ktx2` (see its README; no CDN). Look variants are KTX2 too, and are freed when no longer worn. Eva carries one dress and slippers in the white print; the other prints are variants. Measured in Edge on an AMD Radeon integrated GPU (`tests/vr-companion-gpu-memory-browser.cjs`): both companions' textures went from 979 MB to 228 MB of GPU memory (Ava 598 → 150 MB, Eva 380 → 78 MB), and the GPU process's own committed memory with both in the room from 1,504 MB to 627 MB (Windows "GPU Process Memory" counters). Download: Ava 30.9 → 60.1 MB, Eva 28.5 → 28.7 MB (UASTC is larger to download than JPEG; it is what the GPU keeps). Render time with both: 2.7 → 2.8 ms; frame time at the 60 fps cap either way. Without any GPU compressed format (tested by hiding them) the textures load as RGBA, as before. 4096 px builds and the Blender masters are kept outside the repository in `%LOCALAPPDATA%/void-runner-assets/work/companions-2026-10-30`.
- **Not in the repository:** Ava's and Eva's built models, colour variants and gallery previews are git-ignored until their licences are confirmed (this repository is public). They are rebuilt locally from the sources with the scripts above; tests that need them skip when they're absent.
- **Seren:** unchanged and still the default female companion until Ava's and Eva's lines exist. The handover is ready: setting `replacedBy:'ava'` on Seren's entry takes her out of the gallery and sends old links (`choice:'f'`) and anything asking for Seren to Ava, without touching Kai, Nadia or the shared code (tested in `tests/vr-companion-party.test.cjs`). Seren's model and preview stay until that has been verified.
- **Tests:** `tests/vr-companion-party.test.cjs` (names, own config, looks, saving, pairs, picker, dev-only listing, VR menu rows, Seren handover) and `tests/vr-companion-party-browser.cjs` (in the real bedroom: each alone and both together load without errors, stand on the floor, animate; no speech box without lines; follow, stay and go back; looks change and come back after a reload; the terminal remembers the pair; an old Seren link still works).

## Needs David's review

- **Lines that still mention the sea:** the companions' draft lines were written for the old seaside suite. Three mention the sea or salt air ("the sea and the sky", "the air smells like salt", "the colour of honey" at sundown). They are unchanged here because dialogue was out of scope; they can be rewritten for the city if David wants.

- **Companions:** their names (Seren, Kai), personalities and every line are **drafts**, including the new lines for their initiative and the drunks' remarks in `ncz-nightlife.js`. They are unvoiced until their voices are approved through the audition tool.
- **Experience descriptions:** the menu descriptions too.
- **Nadia:** every line is a draft written in her voice (local, teasing the outsider).

## Not done yet

- **Hug:** none of the animation sources has a hug, so there's no hug animation.
- **Leftover textures:** leaving and re-entering NeoChinatown (with or without VR) leaves about a dozen texture copies behind each time. This predates the companion work. The board sign's copy is fixed; the rest come from the crowd figures and are small (they share their image data).

- **Animation:** no dedicated kiss or hand-holding motion. The companion steps close and plays a gesture.
- **Arcade players:** they have no walking clip, so stepping aside is a short slide.
- **Assets:** no imported tree, palm or animal models. Poly Haven's trees are full photoscans (up to 487 MB), so trees, palms and birds are built here.
- **Simulator display:** the on-screen pistol counter shows the real magazine; the simulated one is separate and invisible.

## Assets

About 5.9 MB of models, textures and skies (the bedroom redesign removed about 0.6 MB of furniture, wallpaper and sky), plus 6.1 MB for the two companions. Sources and licences are in `docs/VOID_RUNNER_ASSET_LICENSES.md` (VR arcade section).
