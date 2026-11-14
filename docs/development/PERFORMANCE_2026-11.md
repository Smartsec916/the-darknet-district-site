# Browser performance profile and optimization (14 Nov 2026)

Tools: `tests/perf-profile-browser.cjs` (per scene: resolution, draw calls, active meshes, meshes, materials, textures, geometries, vertices, skeletons, animation groups, lights, long tasks, JavaScript CPU profile, loading times), `tests/perf-crowd-browser.cjs` (A/B of the one optimization below, same session, same scene), `tests/graphics-measure-browser.cjs` (presets).
**Every frame time and frame rate here comes from a SOFTWARE renderer (SwiftShader, no GPU) and is NOT what a player's GPU gives.** Counts (draw calls, meshes, materials, textures, vertices, animation groups) and JavaScript CPU time are real measurements of what the game asks for. No FPS improvement is claimed. All numbers are Medium (the default), 1280x720, device pixel ratio 1 (render 1280x720).

## Profile (before any change)
| Scene | draw calls | active / total meshes | materials (in use) | textures | vertices | skeletons | playing / all animation groups |
|---|---|---|---|---|---|---|---|
| Sleeping Pod room | 632 | 444 / 710 | 336 (247) | 116 | 321k | 7 | 7 / 62 |
| District interior, hall | 150 | 91 / 710 | 336 (247) | 116 | 321k | 7 | 7 / 62 |
| District interior, bar side | 336 | 168 / 710 | 336 (247) | 116 | 321k | 7 | 7 / 62 |
| NeoChinatown street | 345 | 172 / 968 | 308 (268) | 241 | 1.35M | 40 | 36 / 348 |
| Ship flight (departure) | 60 | 97 / 590 | 34 | 13 | 51k | 0 | 0 / 0 |
| Meridian Station | 650 | 422 / 867 | 280 (243) | 60 | 369k | 8 | 7 / 74 |

Loading (software renderer, so only relative): pod exit 32.6 s, street entry 39.5 s, launch 4.1 s, Meridian 77 s. JavaScript heap about 200 MB in every scene.

## What the measurements say
- **The JavaScript is not the bottleneck.** In every scene 78 to 96% of the JavaScript self time is `drawImage` (copying the Babylon canvas into the page canvas, which on this machine waits for the software GPU), and less than 1% is game or Babylon code. Long tasks (over 100 ms) are every frame here, again because of the software renderer.
- **Counts that matter on a real GPU.** The District and Meridian send 150 to 650 draw calls with 280 to 340 materials and **zero instances** (the flight scene shows the engine can instance: 394 instances for 60 draw calls). Medium doubles draw calls against Low (632 vs 310 in the pod room) because the glow layer redraws the scene. These are the likely real-GPU costs; they need the ROG Ally test (`GRAPHICS_TEST_ROG_ALLY.md`) before anyone changes the look to chase them.
- Babylon's own per-frame CPU counters: animation evaluation 3 to 7 ms, active-mesh evaluation 3 to 4.5 ms, render targets 2.4 to 5 ms (these counters are noisy at 0.3 to 0.5 frames per second).

## Optimization applied (one, measured)
**Crowd animation throttle** (`babylon-renderer.js` `crowdThrottle`): every 4th frame a crowd figure that is farther than 4 m and outside the camera view (2.5 m margin) has its animation paused (crowd.js `setActive`), and resumes when near or in view. Only animation evaluation stops; positions, activities and clip choices keep running.
A/B, same session and scene, CPU cost of `Scene.animate()` (400 calls, no drawing):
| Scene | playing groups off to on | median ms per call off to on |
|---|---|---|
| Sleeping Pod room | 7 to 6 | 1.1 to 0.9 |
| District hall | 7 to 2 | 1.0 to 0.6 |
| District bar side | 7 to 2 | 1.0 to 0.6 |
| NeoChinatown street | 12 to 18 (the street's groups start and stop by themselves) | 1.7 to 1.7 (no change) |
The saving is real but small: 0.2 to 0.4 ms per frame in the District (about 2% of a 60 fps frame), nothing in the street. It is kept because it is safe and switchable (`VoidBabylon.setCrowdThrottle(false)`), not because it moves the frame rate.

## Candidates examined and NOT applied (and why)
- Freezing materials or world matrices (`freezeMaterials`, `freezeWorldMatrix`): would save per-frame checks on 247 materials and 700 meshes, but neon flicker, screens, doors and animated props change at runtime; wholesale freezing would break them. Needs an audit of which meshes are truly static.
- Instancing the District kit (0 instances today): the likely biggest real-GPU saving (draw calls and state changes), but it changes how the kit is built (`tools/assets/kit`) and needs before/after screenshots and a real-GPU measurement.
- Restricting the glow layer to emissive meshes: halves draw calls but lets glow bleed through walls. Visual change, not applied.
- Lower texture or shader work, LOD, occlusion culling: no evidence from these measurements; texture memory and fill rate need a real GPU to judge.
- Opaque (`alpha:false`) page canvas, `preserveDrawingBuffer:false`: plausible present-path savings, but the blit cost cannot be judged without a GPU and the camera feature (V1 Phase 5) will want the buffer.

## Next
Run `tests/perf-profile-browser.cjs` on the ROG Ally (hardware GPU) and look at draw calls, GPU time per frame and the glow layer before touching the kit.
