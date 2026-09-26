# VOID//RUNNER — Meridian main menu

Implemented against repository commit `33bbfd53a5df7c577e7d16cebbe3522fe282e110`
(the merged opening update). The original runtime files matched the authoritative
GitHub blob hashes before editing. This update has **not been deployed**.

## Rendering and shared design

1. **Menu:** Meridian now occupies the center/right in a distant three-quarter
   exterior view. The left-side menu, labels, account information, save preview,
   controls and CSS are unchanged. There are no permanent ships in the background.
2. **Shared gameplay identity:** `VoidMeridian.design` and `VoidMeridian.build()`
   supply the same exterior for the menu and gameplay approach. The occupied station
   attaches those same exterior features around its existing H01/concourse geometry.
   Walkable collisions, NPCs, services, missions and campaign logic are retained.
   The menu does not construct the playable interior.
3. **Station:** H01/H02/H03 hangars, asymmetric solar outriggers, structural supports,
   service modules, communications dish/masts, a large docking collar, warm windows,
   hangar lights and navigation beacons. Off-white front-mounted tanks have hazard
   bands and reflective strips. Graphite hulls and repaired panel tones keep the
   palette industrial, with restrained illumination rather than extensive neon.
4. **Planet:** Retains Meridian’s existing gas-giant identity. A generated surface
   adds coherent atmospheric bands and a broad storm feature. The menu shader adds
   directional day/night lighting, a terminator and a subtle illuminated rim. The
   generated surface map is also used by the gameplay planet.
5. **Debris:** Four irregular asteroid shapes, instanced at varied scales, rotations
   and 3D depths. Slow rotation/drift provides foreground/midground parallax without
   arranging a ring of objects around the station.
6. **Lighting:** A warm directional star light and restrained cool fill expose
   sun-facing planes while retaining dark side faces. Warm windows and hangar strips
   suggest habitation; light tanks and blue arrays provide contrast.
7. **Motion:** Small, very slow camera drift; extremely slow planet rotation; slow
   debris movement; subdued beacon pulses. Reduced-motion settings freeze these
   animations. The existing Babylon engine and application animation loop are used.

## Performance and ownership

The menu is a lightweight presentation scene, preserving a paused gameplay scene
until Resume. It is disposed when leaving the menu. Static station geometry is
merged by material; stars/debris use instances. Low quality reduces instance counts
and planet tessellation. Textures are generated locally at modest sizes. There are
two lights and no menu shadow-map pass or interior/character loading.

Measured medium-quality menu: **22 draw calls**, 262 mesh/instance entries (mostly
stars/debris), and six textures. Three repeated menu visits held those counts
steady; Resume returned to one gameplay scene without moving the saved walker.
The last 120-frame headless Edge sample measured median 8.3 ms and p95 8.4 ms;
earlier samples were around 16.7 ms. These are local test-environment measurements,
not performance guarantees for other hardware.

## Verification

- All **68 existing JavaScript unit tests** passed; all top-level game scripts passed
  syntax checks.
- New menu browser suite passed: menu initialization, shared station identity,
  exterior-only loading, three hangar labels, camera drift/reduced motion, New
  Campaign, Settings, local loading, pause/resume resource ownership, missing GLB
  fallback and resizing at 1440×900, 1920×1080, 1366×768 and 390×844.
- Simulated identity/storage tests passed sign-in, cloud save/load, logout, another
  account, and offline/local state. No real account or cloud save was changed.
- Existing opening-to-District campaign regression passed, including Meridian entry,
  equipment installation, missile qualification, recovery and local reload.
- Existing flight/preparation recovery suite passed, including stable repeated
  station visits, missing optional models, timeout/retry and cancellation.
- Delayed 46-second engine loading and genuine engine-failure/retry checks passed.
- Tested browser flows produced no new uncaught JavaScript errors. Offline/API and
  missing-model failures were deliberately simulated. Tests use Edge/Playwright;
  Firefox, real mobile hardware and the live deployed update were not tested.

## Future assets and remaining limitations

The shared optional definition points to
`void-runner/assets/models/stations/meridian.glb`. Set `VoidMeridian.model.src` to
its `path` when that self-contained GLB is available. The existing
`VoidAssets.models.stations.meridian` override also applies to both menu and flight.
Missing or slow optional models fall back through the existing bounded pipeline.
Menu-owned containers unload independently of gameplay assets.

This remains a procedural pre-Blender station. Fine hull detailing, authored wear,
more complex tanks/framework and final normal/roughness maps remain future art work.
No station-specific reference image was attached to this request; the implementation
uses the written Meridian brief and existing gameplay footprint, rather than claiming
an image-exact match. The future exterior GLB must retain the H01 aperture alignment;
it does not automatically replace the playable interior/collisions.

## Changed files and installation

Ten files are included:

- `void-runner/meridian-station.js` — shared exterior and menu presentation.
- `void-runner/babylon-renderer.js` — shared construction, menu scene lifecycle.
- `void-runner/asset-pipeline.js` — scoped asset unload.
- `void-runner/bootstrap.js` — prepare the exterior-only menu at startup.
- `void-runner/world-integration.js` — menu rendering and transitions.
- `void-runner.html`, `static/void-runner.html` — load the shared module.
- `void-runner/MERIDIAN-MODEL.md` — model coordinates, hooks and ownership contract.
- Two `tests/meridian-*-browser.cjs` suites.

Use **either** the update ZIP or Git patch against the commit above. Merge ZIP
contents into the repository root, overwriting matching files without deleting
existing directories. For the patch, run `git apply --check` before `git apply`.
The patch was reverse-applied and forward-checked/applied against verified upstream
originals. `update-manifest.json` lists every included source file and SHA-256.

No backend changes are required for this menu update. Deploy through the existing
site workflow and verify with a fresh browser request to avoid cached scripts.
