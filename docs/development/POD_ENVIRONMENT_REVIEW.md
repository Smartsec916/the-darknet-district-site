# Sleeping Pod environment review: what can be shared across pods

Written 2026-11-05. **Review only; no pod geometry, material or texture was changed.** The roadmap keeps the other nine pods for later, and the hallway floor plan and pod allocation are open owner decisions, so this document does not invent either. It answers: which of pod 01's improvements could reach the other nine without duplicating assets, and at what cost.

## 1. How the pods are built today (`void-runner/neochinatown.js`, lines 635 to 665)

- One loop builds all ten capsules: 2 rows by 5 (`z = 57 + i * 2.6`, `y = 0.9 + row * 1.7`). Every pod gets the same shell: back, roof, two sides, an oval front panel, trim, inner and ceiling light strips, a ring-lit hatch, a glass disc, a mattress, a number sign.
- **Pod 01 only** (`detailed = row === 0 && i === 0`) is rebuilt from the owner's Tesana Sleeping Pod: a painted-metal shell, molded wall panels, two LED strips, three roof ribs and side ribs, ceiling panels, a vent with four slots, a rippled duvet and two pillows. Pods 02 to 10 get a plain pillow and blanket instead.
- **Materials are already shared.** The detail uses five materials created once (`tesana-pod-paint`, `-fabric`, `-rib`, `-vent`, `-led`) and two CC0 textures loaded once (`paintedmetal003-color.jpg`, `fabric062-color.jpg` in `assets/textures/tesana-pod/`). Nothing there is per-pod.
- **No lights per pod.** The glow is emissive material, not scene lights (the source scene's 13 lights would exceed the room's light budget; the lighting probe in `TESANA_ASSET_AUDIT.md` found the limit is four lights per material).
- **Static meshes are merged per material** (`add(..., merge = true)` collects meshes into `staticMeshes` by material and they are merged after the build). So repeating a detail with the same materials adds vertices to a merged mesh, not draw calls or textures.
- The pod music system recolours the shared `pod-panel` and `pod-inner` materials and a ceiling strip (`podScreen.tick`), so every pod already lights up with the music.

## 2. What it would cost to give pods 02 to 10 the same detail

Counted from the code: pod 01's extra detail is about **24 meshes** (2 walls, 2 LEDs, 9 ribs, 3 ceiling panels, 1 vent, 4 slots, 1 duvet, 2 pillows) of simple boxes plus one 130-vertex duvet and two small spheres, about 0.8 thousand vertices.

| Item | For nine more pods |
|---|---|
| New texture files | **0** (the two existing CC0 JPGs are reused) |
| New materials | **0** (the five existing ones are reused) |
| New lights | **0** |
| New draw calls | **about 0** (merged by material into the existing batches) |
| Extra vertices | about 7,000 to 8,000 in total, one time, at build |
| Extra build time | small; the District interior build already creates hundreds of boxes |
| Memory | a few hundred kilobytes of geometry |

This has not been measured in a browser (nothing was changed). A before and after measurement with `tests/district-areas-browser.cjs` and the lighting probe would be the acceptance test.

## 3. Recommendation (needs the owner's go-ahead)

1. **Factor, do not copy.** Move pod 01's detail block into one local function (for example `podDetail(y, z, variant)`) called for every pod, so a future change is made once. Pod 01's output must stay byte-for-byte the same geometry; a test can compare vertex counts of the merged meshes before and after.
2. **Vary by parameter, not by asset.** Colour (a tint chosen per pod from the two existing materials' families), the hatch ring colour (already alternates amber and magenta), the number sign, and which side the vent sits on. No new files.
3. **Keep pod 01's shell paint** as the signature of the first pod if the owner wants it to stay special; the other nine could use the shared `pod-shell` material with the ribs, LEDs, vent and fabric. That makes the room consistent without turning every pod into a copy of pod 01.
4. **Do not touch** hallway layout, pod count, allocation (who sleeps where), the pod 01 start position, or the rest interaction (`district-pod`), all of which are open or owner-controlled.
5. **Acceptance:** `npm test`; areas browser test; lighting probe shows no material exceeds four lights; Low and High screenshots of the pod row; frame time before and after on the owner's PC.

## 4. Other pod improvements that are safe to share later

- The pod number signs and the music screen already exist for all pods or the whole room.
- A shared "occupied" indicator for multiplayer (a lit hatch ring when a player sleeps there) would reuse the existing ring material; it needs the owner's pod allocation decision first.
- The remote-player avatars (name tags above) do not interact with pod geometry.

## 5. Status

Not started. Waiting for: the owner's decision to improve the other nine pods, and the pod allocation and floor-plan decisions.
