# VOID//RUNNER: Art Direction

## PERMANENT DIRECTION (November 2026): AAA dark cyberpunk, PC only

**This section is a permanent project requirement set by David (owner). It governs all future graphics work by Claude Code, other AI assistants, Blender sessions, procedural generators and human contributors. Where anything else in this repository (older roadmaps, handoff diaries, earlier art-direction text below) disagrees, this section wins.** It is a direction, not a claim: the game does **not** yet reach this standard, and AAA quality is a long-term measurable goal.

### The target
The Darknet District is a **PC-only, ambitious, AAA-quality dark cyberpunk game**: cinematic, atmospheric and believable, with the environmental depth of modern high-end PC games. The game currently reads too much like an early-1980s Tron environment (simple geometry, clean neon outlines, bright glowing surfaces, thin environmental complexity). That is no longer an acceptable target.

**Primary references** (qualities only; never copy protected assets or reproduce existing environments):
- **Blade Runner 2049:** atmospheric darkness, cinematic lighting, monumental urban scale, environmental storytelling.
- **Altered Carbon:** dense cyberpunk interiors, futuristic nightlife, layered technology, gritty cities.
- **The Expanse:** functional industrial architecture, believable machinery, lived-in, grounded science fiction.

### Phase out (do not introduce or perpetuate as finished work)
Tron-style glowing grids; bright neon outlines around every structure; excessively clean futuristic surfaces; simplistic geometric walls and buildings; flat, featureless materials; empty corridors and rooms; unnaturally bright uniform lighting; repetitive, obviously procedural architecture; plastic-looking metal; oversaturated cyberpunk colours; anything that looks like an early prototype.

Existing assets with these traits are **candidates for future upgrade**. Do not remove them indiscriminately: replace them progressively and keep the function (collision, interactions, missions, NPCs, map, V1) working.

### Standards for all new environments and architectural assets
- **Architecture:** believable structural engineering; layered walls, ceilings and floors; industrial framing and supports; exposed pipes, conduits, cables, ventilation; access panels and maintenance infrastructure; realistic proportions; dense, lived-in detail.
- **Materials:** PBR; brushed and oxidised metal, concrete, industrial composites, glass, worn plastics; real roughness, reflections and imperfections; dirt, moisture, scratches, stains, corrosion, wear; good normal maps and material variation.
- **Lighting:** dark scenes with controlled illumination; cinematic contrast and deep shadow; localised neon and practical sources; atmospheric haze where it fits; believable light spill and reflection; **accent** lighting instead of glowing outlines; selective volumetrics and post-processing when practical.
- **Environmental storytelling:** evidence people live and work here; maintenance, repair and neglect; graffiti, posters, signage, clutter, discarded objects; machinery and infrastructure; different levels of wealth, cleanliness and technology across the world.
- **Dark is not black.** Players must still navigate, identify characters, read interfaces and recognise important objects.

### PC-only policy (the 3D game)
The 3D game no longer targets mobile. Optimise for modern desktop and laptop PCs (and the supported VR-style desktop presentation) with proper quality tiers. Prioritise: higher-quality geometry, more detailed environments, better lighting and shadows, realistic materials and textures, more complex architecture, better environmental effects, better character animation and presentation, and consistent frame pacing.
**PC-only does not mean unlimited.** Keep sensible polygon budgets, instancing, LODs, texture optimisation, efficient materials and streaming boundaries (the existing 90 m load / 140 m unload hysteresis, quality tiers `low`/`medium`/`high`/`ultra`, the 8-lights-per-material and 12-lights-per-scene limits). Never trade gameplay responsiveness for unnecessary complexity.
**Scope:** this applies to the 3D game. The website, store, accounts and other non-game pages keep supporting mobile browsers where appropriate. `void-runner/device-gate.js` (phones stay on the normal site) is unchanged by this direction.

### Blender and generated-asset standards
- Real-world **metric** dimensions; reuse the game's own dimensions and coordinates. **Inspect the current geometry** (`neochinatown.js`, `district-interior`, collision `solids`) before replacing rooms, walls, floors, ceilings or doors.
- Modular, reusable components; accurate scale and alignment; game-ready geometry; PBR materials; sensible UVs; efficient texture use.
- Clear object and collection names; correct export orientation and applied transforms; **GLB/glTF that loads in Babylon.js**.
- Large scenes may be built in Blender but stay organised and manageable to integrate. Generated assets must fit the existing world and keep gameplay working.
- Licensing and packaging rules still apply (`VOID_RUNNER_ASSET_LICENSES.md`, `VOID_RUNNER_ASSET_PIPELINE.md`): no unprotected proprietary assets in the public repo.

### Modernisation order and consistency
Replace Tron-like graphics progressively, **player-visible areas first, then outward**. Keep one coherent world across: NeoChinatown streets and buildings; the District exterior; the security vestibule; the main District interior; the VR Play area; the arcade; the Sleeping Pod room; the store and social areas; the nightclub; and other connected environments (Milked and the future Corporate District and Zen Zephyr Temple included). The goal is one believable world, not a pile of attractive unrelated assets. Do not rewrite gameplay systems under cover of graphics work. Protected areas (Sleeping Pod room, bedroom music player, VR play-area layout, licensed companions) stay protected unless David asks.

### Workflow for every graphics task
1. Read this section. 2. Inspect the relevant code and assets. 3. Establish real measurements and gameplay dependencies. 4. Design to the aesthetic above. 5. Build with suitable tools (Blender when it helps). 6. Verify appearance (look at screenshots), function and performance. 7. Do not ship new Tron-style placeholders as finished assets; if a placeholder is unavoidable, label it a placeholder and list it as an upgrade candidate. 8. Record what was done and what is still weak. 9. Update the handoff files (`docs/development/AI_HANDOFF.md`) so the next session continues cleanly.

### Known upgrade candidates (honest status, 15 Nov 2026)
Most of the street, District and interiors are still `MeshBuilder` geometry with emissive neon. Milked (PR #265) was built before this direction was recorded: it uses flat boxes, emissive signs and low-detail props and is an upgrade candidate. NULL, the District rooms, the arcade and the street share the same weakness.

---

## Earlier art direction: ships, stations and general rules (Phase B, October 2026)
The text below was written for ships and stations. Its rules on believable construction, PBR, real proportions and budgets still hold. Where it says neon is reserved for District signage or that bloom must stay subtle, read it together with the permanent direction above (accent, not outline).

**Status:** PROPOSED (Phase B of David's graphics brief). These are the rules every model, material and light is judged against.

## The look in one line
**Realistic, industrial, functional, atmospheric science fiction.** Ships and stations are machines built and repaired by working people: believable engineering first, then wear, then a little light. The references set qualities, not designs: Elite Dangerous, Star Citizen, The Expanse, Alien (1979), and cyberpunk for the District. Nothing is copied from them.

## Rules for every asset
1. **Construction you can believe:** panels, seams, fasteners, hinges, vents, access hatches. Shapes follow what the thing does.
2. **Real proportions:** a door fits a person (about 2.1 m), a stool is about 0.75 m, and a fighter is 12–20 m.
3. **Materials:** PBR (base colour, metal/roughness, normal map). Painted metal is mostly rough; bare metal is only on wear edges and moving parts. No chrome or mirror shine.
4. **Wear matches the place:** maintained but used at Meridian, neglected in derelicts, improvised in the District.
5. **Colour:** muted base tones (greys, gunmetal, faded paint). Colour is used for function: hazard stripes, faction marks, status lights. Neon is reserved for the District's signage.
6. **Light:** practical fixtures (strips, floods, screens) explain where the light comes from. Bloom is subtle, and only emissive screens and engines glow.
7. **Silhouette first:** each ship class must be recognisable from its outline at combat distance.
8. **Performance:** about 5–30k triangles per ship, 0.5–5k per prop, textures up to 2K (1K on Low), with shared materials across a pack.

**Reject:**
- cartoon or toy-like proportions
- flat primary colours
- fantasy or medieval objects
- household furniture that hasn't been adapted
- random one-off models that clash with their neighbours
- anything copying a commercial game or film design

**A missing replacement is better than a wrong one.**

## Places

| Place | Identity | Typical assets | Palette and light |
|---|---|---|---|
| **Meridian Station** | Working commercial station: modular, maintained, worn by daily use | Industrial seating, cargo crates and racks, hangar cranes and clamps, terminals, utility doors, storage lockers | Gunmetal, off-white panels, safety yellow; cool overhead strips, warm bar light |
| **Derelict stations** | The same modular kit, damaged | Broken panels, exposed cabling, debris, dead consoles | Corroded steel; emergency red, torch light, dust |
| **The Darknet District** (NeoChinatown, Tessaly System) | Underground cyberpunk: dense, improvised, black-market tech | Modified machinery, cable bundles, retrofitted terminals, signage | Dark concrete and steel; stronger coloured accents and neon signs, kept readable |
| **Vesper** | Frontier workshop in a desert | Tools, engine stands, crates | Dust-faded paint, warm sun, rust |
| **Faction space** | Communion: white, silver, cyan, sleek and automated. Natural Order: steel, grey, orange, rugged and repairable. | Faction hulls and stations (already approved designs; keep them) | As stated |

## Ships
- **Believable spacecraft:** visible engines and thrusters, weapon hardpoints where the guns fire, cockpit glazing, panel lines, a few greebles but not noise.
- **Distinct roles:**
  - raider: light and angular
  - interceptor: lean and fast
  - gunship: heavy and armoured
  - courier: small and boxy cargo
  - shuttle: passenger windows
  - police: navy and white with a light bar
- **One family per faction:** pirates and traffic should share one consistent pack, so the sky doesn't look like a model collection.
- **The Kestrel stays the Kestrel:** a weathered pale hull, red service stripe, swept wings and twin engines. Any replacement must keep those cues and needs David's approval.

## Characters
- **Style:** realistic or semi-realistic adult proportions in work clothing: flight jackets, coveralls, utility vests.
- **Named characters keep their established look**, and any change needs approval:
  - Mara: older mechanic
  - Rook: practical broker
  - Elias: hologram
  - Admin: pragmatic, dry
  - Iris: android CSO
- Generic crowds may come from one coordinated character set.

## David's reference images (local, not in the repo)
`D:/Pictures/Game/Start/` has folders for Derelict space station, Kestrel, Mara, Meridian Station (exterior plus an interior sheet: main hub, bar, store, hangars H01–H03, corridors, sleeping quarters, restrooms, docking collar, module connector) and Vesper. Use them as the target look:
- **Kestrel:** weathered off-white panels, a red stripe, swept wings and big twin engines.
- **Mara:** grey-haired mechanic in a worn work jacket and harness.
- **Meridian:** weathered grey modules with orange accents and lit window bands.

Note: the interior sheet labels the bar "The Drift"; the game calls it the Dead Channel. Don't change the name without David's decision.

## How assets are judged
Every candidate is scored (brief §9), with licence as a pass/fail gate:
- visual theme: 30%
- function: 20%
- geometry and materials: 20%
- environment fit: 15%
- technical fit: 15%

Scores come from **looking at real previews or renders**, never from names or tags. A candidate nobody has looked at is marked **VISUALLY UNVERIFIED** and can't be approved. The minimum score is 85/100.
