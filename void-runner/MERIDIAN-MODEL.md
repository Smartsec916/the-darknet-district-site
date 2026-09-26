# Shared Meridian exterior

`meridian-station.js` owns `VoidMeridian.design`, `build()`, and the optional model
definition. The menu and flight approach call the same exterior builder. The occupied
station attaches the same exterior features while retaining the existing walkable
H01 shell, collisions, characters and interactions. No interior is loaded for the menu.

H01 remains centered at X=0, Z=-11, with the approach aperture at Z=-26. H02/H03,
habitation and service modules, arrays, collar, tanks and communications all use the
same metre-space coordinates in each presentation. Changes to this design affect
Meridian only. Menu camera, planet and debris staging are separate from gameplay.

## Future GLB

Place a self-contained model at `void-runner/assets/models/stations/meridian.glb`
and set `VoidMeridian.model.src = VoidMeridian.model.path` in the module. Its default
is null, so the placeholder requires no GLB download. Both menu and flight approach
use that definition. The existing `VoidAssets.models.stations.meridian` override
takes precedence in both places. Export +Y up, H01 facing −Z, metre scale, with origin
and aperture aligned to the coordinates above. `scale` and `yaw` allow import correction.

The existing pipeline validates same-origin, self-contained GLBs and bounds optional
loading. A failure falls back to the shared procedural exterior. No decoder, external
texture endpoint, new asset-loading system, or separate menu-only model is introduced.
The menu has a scoped container key and unloads only its own asset when closed.

The future exterior GLB does not automatically replace the playable interior or
generate collision meshes. Author that interior/collision alignment separately;
keep the H01 aperture clear and do not bake NPCs or parked ships into the exterior.

## Scene ownership and performance

The menu uses the existing Babylon engine and application animation loop. A small
presentation scene avoids destroying a paused walking/flight scene. Closing the
menu disposes its scene and assets. Initial startup contains no playable station
interior. Shared static materials/meshes and instanced stars/rocks keep draw calls
low; low quality reduces stars, debris and planet tessellation. There are two lights,
no shadow-map pass, no permanent ships and no downloaded image textures.

Motion is a small oscillating camera drift, extremely slow planetary rotation,
slowly turning/drifting debris and restrained navigation beacons. Reduced-motion
settings freeze these animations. The front-end controls and CSS are unchanged.

Run `node tests/serve-modern.cjs`, then `node tests/meridian-menu-browser.cjs` with
Playwright and Edge installed. The browser suite uses mocked network failures and
checks shared geometry, pause/resume ownership, controls, load, resizing, animation
and missing-model fallback. It writes screenshots under `work/`.
