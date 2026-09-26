# Ward workshop model contract

The existing game owns this location. `world-integration.js` sends Vesper to
`VoidOpening.layout()`; `VoidBabylon.prepareRoom()` constructs its Babylon scene.
There is no separate entry point, renderer loop, save store, or physics engine.

`opening-data.js` is the source of gameplay positions, colliders and interactions.
`opening-scene.js` owns the scene's visual resources. Its `dispose()` releases
materials, textures, lights, shadows, particles and camera-mounted weapon geometry.

## Optional replacements

Set the corresponding `VoidOpening.hooks` entry's `src` to its suggested `path`
after adding a self-contained GLB under `void-runner/`. Null `src` means no request.
The existing asset pipeline uses same-origin assets, rejects unsupported external
dependencies and compressed decoder formats, and falls back on a bounded failure.

| Hook | Suggested file, relative to void-runner/ | Origin and orientation |
| --- | --- | --- |
| mara | assets/models/characters/mara.glb | Feet at origin, +Y up, face +Z; about 1.8 m tall |
| elias | assets/models/characters/elias-hologram.glb | Bust base at origin, face +Z; about 1 m high; projection material applied by scene |
| kestrel | assets/models/ships/kestrel.glb | Hull center at origin, nose +Z; about 11 m long; imported hull replaces the workshop display |
| pistol | assets/models/weapons/ward-pistol.glb | Slide center at origin, barrel +Z; approximately 0.3 m long |
| bench | assets/models/props/workbench.glb | Ground origin; approximately 2.5 m wide × 8 m deep |
| workshop | assets/models/environment/ward-workshop.glb | World origin; rear Z −23, front Z +0.5, walls X ±13, roof Y 6.2 |

`scale` and `yaw` provide import corrections. Export applied transforms in metres.
The Kestrel's normal world/flight replacement remains `VoidAssets.models.ships.starter`;
configure both hooks with the same model when replacing both presentations. Workshop
Mara, hologram and pistol use dedicated hooks so they cannot become station NPCs or
independent campaign actors accidentally.

The shell replacement covers walls/roof/supports; the bench, props, hologram, Mara,
ship, landing legs, stairs and range are separately owned. Avoid baking duplicates
into the shell model. Hook changes do not alter collisions, interaction points,
save IDs or tutorial progression. Adjust `opening-data.js` deliberately if dimensions
change. The custom model for Elias is rendered as a projection, never physical NPC.

## Current interim assets and budgets

Current figures, weapon, ship and workshop props are procedural models. They are
not photorealistic substitutes for the supplied art. Custom facial detail, rigged
walking/handoff animations, richer hull topology, authored normals/roughness and
high-quality workshop wear are the next Blender/art pass.

Reuse materials, keep GLBs self-contained, target modest texture sizes, and avoid
decoders or remote texture services. The current scene merges nearby static geometry
by material, uses small generated textures and six dynamic practice cans. Low quality
disables workshop shadows and reduces dust; medium/high use one 1024/2048 shadow map.
No physics plugin or extra render loop is required for the cans.

## Validation

Run `node --test tests/*.test.cjs`. Serve the repository root with
`node tests/serve-modern.cjs`, then run `node tests/opening-browser.cjs` and
`node tests/prologue-browser.cjs` with Playwright installed and Edge available.
Tests default to localhost:5187 and write screenshots under `work/`.

The browser routes use real New Campaign UI, input, interactions and target rays;
player positions are placed at interaction anchors, and flight arrivals/combat are
advanced deterministically. They are not a substitute for a complete manually
piloted playthrough on the deployment or real mobile hardware.
