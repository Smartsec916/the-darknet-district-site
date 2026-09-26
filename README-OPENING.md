# VOID//RUNNER — planetside opening update

This is an incremental update to the existing game, based on GitHub commit
`ad6256a8be9a88233cb3ee23281898ff8f77cafa` (`VOID-RUNNER-progression-update`).
The latest repository head was checked again before packaging. No deployment has
been performed.

## What changed

1. **Root cause:** New Campaign already selected Vesper, but `enterWalking()` routed
   every universe location through `VoidStationLayouts.layout()` and the hangar
   renderer. Vesper was therefore a station with a different label. The live HTML,
   world integration and prologue integration matched the baseline source when
   fetched without a cached response; this was a source-code issue in those files,
   not a different deployed opening.
2. **Restored opening:** Vesper now has its own open-front workshop layout, collision
   map and Babylon scene. The player starts at standing height inside and can move
   immediately. The same landscape is used for planetside departure; takeoff no
   longer constructs a Vesper station shell.
3. **Existing material retained:** The previous workshop scene and Mara introduction
   remain in `story-scenes.js` / `story-content.js` for older story saves. Existing
   character/ship artwork references, campaign IDs, stations, account systems,
   inventory, ships and later missions remain in place. The superseded damaged-drone
   tutorial and mandatory preflight optic purchase are removed from the new opening.
4. **Canonical boss:** The repository identifies him as **Elias Ward**. He appears
   here as a projected bust over a recording case, never a physical NPC. His original
   “The ship is yours” line is retained. Mara Voss remains the physical guide, with
   grey hair and green workwear. Her original response choice and relationship
   effects are retained.
5. **FPS controls:** Normalized acceleration, quick braking, sprint, held crouch,
   grounded jump/gravity, subdivided wall collision, pointer-lock looking and saved
   mouse sensitivity. Existing E interaction and inventory remain. Touch actions
   include crouch, with separated movement/action controls.
6. **Tutorial:** Recording → Mara’s pistol handoff → follow her around the workshop
   → aim/fire/reload → knock down four of six cans → board Kestrel → inspect ship
   inventory/preflight information → start engines → existing Meridian route.
   Cans use ray hits and lightweight bounce/roll impulses. There is no hostile
   opening attack. Mara provides more practice ammunition if the player runs out.
7. **Visuals:** Warm workshop lights, directional shadows, blue sky and moon,
   distant mesas, sparse settlement, workbench/tools/cables/storage, generated worn
   surfaces, dust, chamfered props, a refined Kestrel hull and a 3D first-person
   pistol. These are still stylized procedural assets, not the photorealistic
   appearance of the supplied references.
8. **Model architecture:** `opening-data.js` separates gameplay anchors from scene
   geometry. Optional GLB hooks cover Mara, Elias’s projection, Kestrel, pistol,
   workbench and workshop shell. Missing or stalled models fall back through the
   existing bounded asset pipeline. See `void-runner/OPENING-MODELS.md` for paths,
   scale/orientation, replacement boundaries and export requirements.
9. **Remaining art work:** Detailed faces, rigged walking/handoff animation, richer
   hull topology, authored surface maps and final workshop props still require
   custom assets. Boarding uses a preflight interface and the existing flight
   cockpit; it does not introduce a walkable ship interior.
10. **Performance:** Shared materials, merged nearby static meshes, small generated
    textures, six dynamic cans and no additional render loop or physics dependency.
    Low quality disables workshop shadows and reduces dust. Three repeated visits
    held steady at 145 meshes, 13 textures and 3 lights. A 120-frame headless Edge
    sample measured median 16.7 ms and p95 17.1 ms; real hardware will vary.

## Validation and limits

- **68 JavaScript tests passed**, including new opening gates, migration, collision,
  normalized movement and jump checks; all top-level game JavaScript parsed.
- **26 scoped Python tests passed**, including opening data through the full
  campaign-save validator, pre-gift null weapon, saved cans and existing account
  entitlement checks.
- Browser checks passed for New Campaign, crouch/jump, recording, dialogue choice,
  gift, Mara movement, ray-hit cans, reload, local save refresh, boarding/inventory,
  surface departure, Meridian reward and station entry.
- The subsequent campaign regression passed module purchase/install, missile
  unlock/target/lock/fire, free travel, recovery/reload and physical District entry.
- Missing and stalled optional models, repeated scene disposal, a 46-second engine
  load, genuine engine failure/retry, offline API services and preparation recovery
  were checked. Desktop 1440×900 and 1920×1080, narrow 390×844 and emulated touch
  layouts were captured; the touch controls were checked for overlap.
- Browser tests place the player at interaction anchors and accelerate flight
  arrivals/combat deterministically. No complete manually piloted deployment run,
  real-device mobile run, Firefox run, live cloud-save round trip or real payment
  transaction was performed. An unrelated site-wide CORS test could not import the
  site's `server` module in this scoped source snapshot; it is not counted above.

## Files and installation

The package contains **23 changed/new files**: both HTML entry points; opening data,
scene and model documentation; Babylon renderer/integration; walking controller;
world/prologue integration and CSS; client/server progression validation; and 10
test files. `update-manifest.json` lists each path and SHA-256.

Use **one** installation method against the baseline above:

- **Update ZIP:** Extract and merge its contents into the repository root, replacing
  matching files. Do not replace/delete the whole existing `void-runner` directory.
- **Git patch:** From the repository root, run `git apply --check` on the patch,
  then `git apply`. The patch was reverse-applied and forward-checked/applied against
  originals whose Git blob hashes match the authoritative repository tree.

Deploy the static files **and `void_runner_progression.py` together** using the
existing site/backend deployment. The server validator must preserve the new
opening fields. The public site serves a ten-minute cache lifetime; validate with
a fresh request after deploying. Existing scripts/assets outside the overlay are
still required. No unrelated website files are included.

The next art pass should prioritize Mara/Elias likeness, Kestrel detail and workshop
surfaces, followed by a manual end-to-end flight test on the deployed build.
