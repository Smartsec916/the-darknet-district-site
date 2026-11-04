# Tesana ZIP asset audit (inspection only)

Written 2026-11-04 for the Codex handoff (`docs/development/CODEX_HANDOFF.md`). Repository: `Smartsec916/the-darknet-district-site`.

## Read this first

- **Nothing from either ZIP has been imported into the repository.** Both ZIPs were extracted into a scratch folder outside the repository and inspected. The only thing built from them was a scratch copy of the Sleeping Pod project (with Tesana's online SDK script removed) so it could be run and looked at; that copy was never committed.
- **The one feature that sounds like it came from the Sleeping Pod ZIP, the wall-mounted music player in PR #192, is our own implementation**, written for the Babylon.js game. No Tesana code or asset is in it. It borrows an *idea* (a wall-mounted player, local files through browser-only addresses, music-reactive lighting) and the *look* of the website's own LED spectrum.
- **Licensing is the main gate.** Our asset policy (`docs/VOID_RUNNER_ASSET_LICENSES.md`) is pass/fail: *commercial use must be allowed, and anything without a clear licence is not allowed.* The textures in both ZIPs are CC0 (clear). The 3D models are AI-generated through Tesana's tool and have **no licence statement**; they fail that policy until David or Tesana's terms say otherwise. See "Licensing and provenance".
- The ZIPs are **Three.js** projects. Our game is **Babylon.js 8.26**. Nothing runs as-is; only data (GLB files, textures, colour tables, product lists) transfers directly. Code must be re-written, not copied.
- Do not restore retired Void Runner campaign content because it appears in the spaceflight ZIP. Its story, missions, dialogue and characters are **rejected** below.

## The two ZIPs

| | ZIP 1: Sleeping Pod | ZIP 2: Spaceflight |
|---|---|---|
| File as uploaded | `e9194520-game-20261103-855074a5-code1.zip` (David's name: `game-20261103-855074a5-code(2).zip`) | `d897bfca-game-20261102-02234611-code.zip` |
| Tesana game id | `game-20261103-855074a5` | `game-20261102-02234611` |
| Size | 77 files, 6.6 MB | 114 files, 21 MB |
| Engine and tools | Three.js 0.185.1, TypeScript, Vite 7 | Three.js 0.185.1, Phaser 3.90, Rapier physics, three.quarks, TypeScript, Vite |
| Content | One scene: a sleeping capsule with wall screens, a vending machine, a corridor seen through a window | A whole retired Void Runner-style game: space flight, ground levels, 11 character models, 6 vehicle and prop models, dialogue, missions |
| Models (GLB) | None. All geometry is built in code | 17 GLB files |
| Textures | 6 CC0 material sets (JPG), store art (WebP) | 5 CC0 material sets (JPG), 2 mood images, store art |
| Audio files | None (music and sound are synthesised in code) | None (sound is synthesised in code) |

Both ZIPs contain Tesana plumbing that must **not** be copied: `README_EXPORT.md`, `.tesana_storage_state.json`, `.storefront_kit*.json/.log`, `assets/ui/.storefront_pass.json`, `assets/ui/storefront.json`, the store art, and an `index.html` that loads `https://unpkg.com/@tesana/sdk@1.2.0/dist/tesana.iife.js` and a CloudFront endpoint (Tesana's save and shop service). The Pod ZIP's game code itself makes no network call.

## Inventory: what is in each ZIP

### ZIP 1: Sleeping Pod (source in `src/`, all paths relative to the ZIP root)

| Area | Path | What it is | Size |
|---|---|---|---|
| Entry and page | `src/main.ts` | Host page: mounts the pod, builds the wall music player and light controller, vending overlay | 8 KB |
| Scene core | `src/pod/SleepingPod.ts` | Renderer, quality tiers (high/low), adaptive resolution, reflection-probe bake (PMREM and a cube camera), public API (`displays`, `lighting`, `focusDisplay`, `getVending`, `triggerSmoke`) | 22 KB |
| Dimensions | `src/pod/layout.ts` | Pod 1.3 m wide, 1.12 m high, about 2.45 m long; ribs; bed heights; corridor spacing | 1.5 KB |
| Interior geometry | `src/pod/podInterior.ts` | Shell tube, rounded ribs, recessed ceiling panels, molded wall panels, corner light slots, entrance bezel with neighbouring capsules, bed (base, mattress, quilted blanket, two pillows), far wall with rain window, flush wall screens, air-conditioning unit, reading light, ventilation fan | 29 KB |
| Geometry helpers | `src/pod/geometry.ts` | Rounded boxes and rings, rounded-rectangle paths, `blanketGeometry`, `pillowGeometry`, box UV projection | 16 KB |
| Materials | `src/pod/materials.ts` | PBR library on 6 scanned sets, tuned colours, wear map and decals applied | 11 KB |
| Wear | `src/pod/wear.ts` | Procedural worn-paint map (grime, hairline scratches, chips), wear decals placed where people touch or breathe on things, cloth normal map, and a shader tweak that exposes bare metal on exposed rounded edges | 16 KB |
| Lighting | `src/pod/lighting.ts` | 6 colour presets, custom colour, brightness, power, music-reactive "Music Sync"; 5 area lights, 2 shadow-casting spotlights, 5 point lights | 10 KB |
| Camera | `src/pod/cameraRig.ts` | "Entrance" and "reclining" viewpoints, drag to look (clamped to about 100 degrees), hover parallax, glide-to-screen close-ups | 8 KB |
| Screens | `src/pod/screens.ts`, `displays.ts` | Canvas-drawn wall screens: music player, light controller, vending glass, ad, menu; neon signs and glow textures | 22 KB, 3 KB |
| Vending | `src/pod/vending.ts` | Touch-glass vending machine with 20 products (canvas-drawn packaging: bottles, cans, jars, bags, tins, packs, bento, vape, medkit, chip, cells, cable, parcel), prices, description panel, dispensing animation, price strips | 51 KB |
| Corridor | `src/pod/corridor.ts` | What is seen through the window: wet floor, blade signs, vending machines, hatches, rain streaks, glowing far end | 9 KB |
| Smoke | `src/pod/smoke.ts` | Intermittent vapour: instanced noise sprites in one draw call, tinted by room light | 7 KB |
| Post effects | `src/pod/postfx.ts` | Bloom, then a film grade (soft vignette, edge chromatic aberration, grain, lifted shadows) | 3 KB |
| Music | `src/audio/MusicEngine.ts` | Web Audio engine: three **generative synth tracks** ("Neon Rain", "Capsule 03-117", "Night Shift"), local file loading, host `<audio>` attach, analyser, spectrum bands and bass/mid/high levels | 14 KB |
| UI faces | `src/ui/playerFace.ts`, `lightFace.ts`, `panelOverlay.ts` | The wall player and light controller artwork, and real DOM buttons positioned over each projected screen for accessibility | 10 KB, 6 KB, 5 KB |
| Materials (data) | `assets/materials/<set>/` | `diamondplate008b`, `fabric062`, `leather030`, `metal062c`, `metalplates015b`, `paintedmetal003` (colour, normal, roughness, and where present metalness, AO and height; 1K JPG, about 100 to 380 KB each) | about 5 MB |

The Pod ZIP's storefront art (`assets/ui/cover.webp`, `explore_frame.webp`, `banner.webp`) shows an **older cyan and green** version of the pod with quilted padded walls. The **current code is pink and violet** (presets start from magenta `0xe96bbf`), with no quilted wall padding. The code, not the store art, is what David's brief describes.

### ZIP 2: Spaceflight (all paths relative to the ZIP root)

Measured with a script that reads each GLB's header (triangles, joints, animations, textures). "Tri" is triangles.

| Path | Kind | Tri | File | Rig | Textures |
|---|---|---|---|---|---|
| `assets/characters/captain/captain.glb` | character | 3,889 | 321 KB | 52 joints, no clips | 3 x 1024, WebP |
| `.../elara/elara.glb` | character | 3,938 | 348 KB | 53 joints | 3 x 1024 |
| `.../iris/iris.glb` | character | 3,300 | 422 KB | 52 joints | 3 x 1024 |
| `.../kai/kai.glb` | character | 3,160 | 415 KB | 52 joints | 3 x 1024 |
| `.../mara/mara.glb` | character | 3,533 | 378 KB | 46 joints | 3 x 512 |
| `.../marcus/marcus.glb` | character | 3,917 | 588 KB | 52 joints | 3 x 1024 |
| `.../nadia/nadia.glb` | character | 3,800 | 526 KB | 52 joints (faces -z, root turned 180 degrees) | 3 x 1024 |
| `.../pedestrian_a/pedestrian_a.glb` | character (man, hooded rain jacket) | 4,253 | 756 KB | 52 joints | 3 x 1024 |
| `.../pedestrian_b/pedestrian_b.glb` | character (woman, vinyl coat, dyed bob) | 3,705 | 565 KB | 52 joints | 3 x 1024 |
| `.../rook/rook.glb` | character | 2,933 | 181 KB | 52 joints | 3 x 512 |
| `.../seren/seren.glb` | character | 3,341 | 439 KB | 34 joints | 3 x 1024 |
| `assets/props/vehicles/player_ship.glb` | ship (5.9 x 1.5 x 5.95 units) | 3,297 | 477 KB | none | 3 x 1024 |
| `.../flying_taxi.glb` | flying taxi (1.6 x 1.2 x 1.1) | 3,300 | 393 KB | none | 3 x 1024 |
| `.../freighter.glb` | freighter (3.3 x 1.2 x 1.1) | 3,695 | 682 KB | none | 3 x 1024 |
| `.../pirate_fighter.glb` | pirate fighter (0.9 x 0.5 x 1.35) | 4,088 | 532 KB | none | 3 x 1024 |
| `assets/props/misc/meridian_station.glb` | station | 4,130 | 775 KB | none | 3 x 1024 |
| `assets/props/misc/satellite.glb` | satellite | 3,397 | 539 KB | none | 3 x 1024 |
| `assets/materials/{asphalt025b,concrete041a,grass002,ground046,metalplates015a}/` | CC0 material sets | n/a | about 1 MB each | n/a | 1K JPG |
| `assets/ui/title_bg.jpg`, `holo_ad.jpg` | AI mood images (a title collage; a billboard portrait) | n/a | 264 KB, 32 KB | n/a | n/a |
| `src/core/{pbr,fx,rig,audio,assets}.ts`, `src/space/space.ts`, `src/ground/*.ts`, `src/ui/hud.ts`, `src/relay.ts`, `src/systems.ts` | game code (Three.js) | n/a | n/a | n/a | n/a |
| `src/data/{dialogue,missions,world,items}.ts`, `src/ground/levels.ts` | **retired campaign content** | n/a | 5 to 104 KB | n/a | n/a |

Every GLB is one mesh, one material, WebP textures (`EXT_texture_webp`), made by glTF-Transform. **No GLB carries any animation clip.** The Tesana game animates the characters in code with a procedural rig (`src/core/rig.ts`: walk, sit, talk, wave, nod, head tracking) that rotates bones of a T-posed body. Each model's `*.meta.json` says it faces +z (Nadia is the exception) and is "web ready".

## Comparison with what the game already has

| Topic | Tesana | The game today | Verdict |
|---|---|---|---|
| Character models | About 3 to 4k triangles, static T-pose, no clips, VRM-style bone names (`Hips`, `UpperChest`, `LeftUpperArm`), 1024 px x 3 textures each | 22 crowd models in `void-runner/assets/models/crowd/`: 29k to 55k triangles, 52 `mixamorig:` bones, **5 to 24 baked animation clips each**, 512 px textures, 2.7 to 4.3 MB each (93 MB for all models) | Tesana is about 10 times lighter but **has no animations and cannot use ours**: the bone names share **zero** names with our `mixamorig:` rigs, so every clip would need retargeting. Ours are heavier but finished. |
| Ships | Four single-mesh AI-generated ships, about 3.3k to 4.1k triangles | Six Quaternius CC0 ships (`striker`, `challenger`, ...) mapped in `model-registry.js`, plus the **procedural Kestrel** (player ship; ownership and handling are canon and stay) | Not clearly better, no clear licence. Not recommended. |
| Station | `meridian_station.glb`, 4.1k triangles | Meridian is a bespoke kit-built station with Quaternius kit pieces, interiors and exteriors (`meridian-station.js`, `meridian-kitbash.js`, `meridian-interior*.js`) | Reject (would replace a canon, hand-built location). |
| City textures | asphalt, concrete, grass, desert ground, metal plates (ambientCG CC0) | NeoChinatown already uses ambientCG sets (`void-runner/assets/textures/ncz/`: road, cracked road, sidewalk, brick, concrete, corrugated metal, metal leaks, facades) | Mostly **duplicates**. Not needed. |
| Pod interior | A detailed, worn, lit capsule | `neochinatown.js` pods: two stacked rows of box shapes with an oval hatch, glass, a box mattress and pillow | The Tesana pod is **far more detailed**. This is the one clear visual gain. |
| Bedding and wear | Quilted blanket and pillow geometry, cloth normal, procedural scratches, chips, grime, edge wear | Flat boxes, no wear | Clear gain, needs re-writing. |
| Vending | 20-product touch machine with drawn packaging | Three lit boxes and a one-line text | Clear gain, but see the age-policy flag. |
| Music | Generative synth, local files (one at a time), analyser | Website player; **PR #192** in-game wall player (own code) with playlists, shuffle, repeat, spectrum, reactive lights | #192 already goes further for the player; Tesana's three **generative synth tracks** are a unique, copyright-free addition. |
| Effects | Bloom, film-grade shader, smoke sprites, rain lines, planet/atmosphere/sky GLSL | Babylon presets and effects; planets, skies and cockpit already exist | Mostly equivalent. The pod film grade and the wear technique are the only worthwhile items. |

**Not rendered.** Models were measured and read, not rendered side by side with ours. Visual preference (is a Tripo ship better looking than a Quaternius one) is therefore **not** claimed. The Tesana pod was run from a scratch copy and its current look reviewed against the code and the store art.

## Licensing and provenance

| Asset group | Origin | Status |
|---|---|---|
| All textures in `assets/materials/*` (both ZIPs) | ambientCG; each `material.json` says `"license": "CC0 (AmbientCG)"` and names the source id (for example `ambientcg:DiamondPlate008B`) | **Clear.** CC0: commercial use, modification and redistribution allowed; no attribution needed (credit anyway, as `docs/VOID_RUNNER_ASSET_LICENSES.md` does). |
| All 17 GLB models | Generated by Tesana's 3D tool (`mcp__game-3d-models__generate_3d_batch` in `assets/generation-meta.json`), with the prompts recorded; manifest names `tripo_model_version: P1-20260311`; some entries are `taskId: library:<hash>` (a Tesana shared library) or `vision-check:` ids | **Unclear: fails our "clear licence" rule.** No licence file; the ownership and commercial-use terms of Tripo output as resold through Tesana, and of Tesana's shared "library" items, must be read from Tesana's terms and confirmed by David. |
| Characters that depict named people (`iris`, `rook`, `elara`, `marcus`, `mara`, `kai`, `seren`, `nadia`, `captain`) | Generated from reference images and prompts (`.character_refs/captain/*.png` are four AI reference views) | Same licence gap, **and** they depict established or retired NPC identities. Do not replace NPCs without David's approval. |
| `assets/ui/title_bg.jpg`, `holo_ad.jpg` | AI-generated mood images; `holo_ad.jpg` is a billboard portrait of a woman | No licence; reject. |
| Store art (`cover.webp`, `banner.webp`, `explore_frame.webp`, `app_icon.webp`, `title_poster*.webp`) | Tesana storefront pass | Not for the game. |
| Pod and spaceflight **source code** | Written by Tesana's tooling for David's games | Presumably David's, but it is Three.js code that must be re-written anyway. |
| Dependencies: Phaser, Rapier, three.quarks, Three.js | MIT/Apache-style open source | Not needed; adding a second engine is rejected. |

**David's Tesana plan.** David reported on 2026-11-04 that he has the **Max Plan** on Tesana. That is a paid plan, and it may well give him commercial rights to what his projects generate. **This audit has not seen the plan's terms**, so the models stay marked "not cleared" until the terms are read and written down. Needed from the Max Plan terms (and any Tripo or "library" terms they point to): (1) commercial use of generated 3D models in a game he sells or publishes; (2) redistribution of the GLB files inside a public repository and on a public site (our Pages site serves files to anyone, though the project encrypts its licensed models, see `tools/assets/build-pages.cjs`); (3) whether items taken from Tesana's shared "library" (the `library:` task ids in `.tesana/asset-gen-ledger.json` cover **10 of the 17 models**: nine characters, namely `iris`, `kai`, `mara`, `marcus`, `nadia`, `pedestrian_a`, `pedestrian_b`, `rook`, `seren`, plus `satellite`; the other seven, namely `captain`, `elara`, the four vehicles and the station, have their own generation ids) are covered the same way as models he generated himself; (4) any attribution or credit requirement; (5) what happens to the rights if the plan lapses. If these are confirmed, the licence gate on rows M6 and M7 lifts; the other conditions on them (a retargeting spike and a side-by-side render) remain. A paid plan also means **David can generate new assets inside Tesana without any new spending by us**; the project rule "no new paid services" is unaffected, because nothing is being added. Do not run Tesana's generator on David's behalf without his say-so.

**Services:** nothing in the game code calls Tesana. Only `index.html` does (the SDK and CloudFront endpoint). Do not bring `index.html`, `.tesana*`, `.storefront*`, `README_EXPORT.md` or the store art into the repository.

## Three.js to Babylon.js: what transfers

| Piece | How it transfers |
|---|---|
| GLB models and JPG/WebP textures | Directly loadable in Babylon (`SceneLoader`), after policy approval. WebP textures need `EXT_texture_webp` support in the pinned Babylon loader: verify with one model first. |
| Colour tables, product lists, preset lists, dimensions | Copy as data. |
| Procedural geometry (rounded boxes, blanket, pillow, ribs) | Re-write the maths as Babylon `VertexData` or a small builder. No shared code. |
| Procedural canvas textures (wear map, decals, cloth normal, packaging art, neon text, screens) | Run as-is on a 2D canvas, then upload as a `DynamicTexture`, **or** render once to a PNG/WebP offline and ship the file (cheaper at runtime, preferred for wear). |
| `onBeforeCompile` edge-wear shader tweak | Babylon uses `MaterialPluginBase` or a `NodeMaterial`; or bake the edge wear into the AO/roughness textures offline. |
| `RectAreaLight` (5 in the pod), PMREM and cube-camera reflection bake, two shadow-casting spots | **No direct equivalent to rely on.** Our high-quality tier already hit the GPU's limit on lights (`GL_MAX_VERTEX_UNIFORM_BUFFERS`, 14) with 12 District lights plus two lamps; the pod's roughly 13 lights would fail outright. Re-light with emissive strips, baked light or reflection probe, and at most 3 to 4 real lights. |
| Bloom, vignette, chromatic aberration, grain | Babylon's default rendering pipeline covers bloom; the grade needs a small custom `PostProcess`. Use for the pod only. |
| Smoke sprites, rain streaks, planet/sky/atmosphere GLSL | Portable as `ShaderMaterial`/`ParticleSystem` with uniform renames, but the website's pod page already has its own smoke, and the game already has planets and skies. Low value. |
| Procedural character rig (`rig.ts`) | Not useful: it drives T-posed Three.js bones. Retargeting to our Mixamo clips is a separate, unproven spike. |

## Prioritised shortlist

Columns follow David's requested format. **Difficulty:** S = under a day, M = 1 to 3 days, L = about a week, XL = more than a week (rough, unmeasured). **Status of every row: inspected, not imported.**

### High priority (clear visual gain, low risk)

| # | Asset or technique | Source ZIP and path | Destination | Current equivalent | Expected improvement | Import / adapt | Performance | Licence | Dependencies | Difficulty | Recommendation |
|---|---|---|---|---|---|---|---|---|---|---|---|
| H1 | Pod PBR material sets: `metal062c` (walls, trim), `metalplates015b` (floor/wall plates), `paintedmetal003` (painted shell), `diamondplate008b` (floor), `fabric062` (bedding), `leather030` | Pod: `assets/materials/<set>/*.jpg` | New in-game pod interior (wall, floor, bed) | Flat coloured boxes | Believable scratched metal, painted metal, fabric | Direct import (re-encode 1K to 512/1K WebP) | About 6 sets x 4 maps; share across all pods, 512 on low | CC0, clear | New pod geometry (H3) | M (with H3) | **Import** |
| H2 | Wear and grime technique: worn-paint map, scratches, chips, seam grime, decals placed at touch/breath points, cloth normal | Pod: `src/pod/wear.ts` | Pod interior; later District metal and Meridian | None | David's brief: visible, naturally accumulated wear, chipped paint, grimy seams and vents | Adapt (port to canvas or bake to PNG offline) | One 1K tiling map plus a few decals; cheap | Code written for David's project; presumed his | H1 | M | **Adapt** |
| H3 | Pod shell and fittings geometry: rounded shell tube, ribs, ceiling panels, molded wall panels, corner light slots, entrance bezel, AC unit, fan, window | Pod: `src/pod/podInterior.ts`, `geometry.ts`, `layout.ts` | Reusable `pod-interior` module for the District (`neochinatown.js` interior, pods row) | Box pods at `neochinatown.js` pods block | The single largest visual upgrade; reusable per pod | Recreate in Babylon (re-write maths) | Instance one pod mesh set; merge static parts; budget per pod about 40 meshes | Own code | PR #191 pod allocator; District floor plan (pending David) | L | **Recreate** |
| H4 | Bedding: quilted blanket, two pillows, irregular fabric | Pod: `geometry.ts` (`blanketGeometry`, `pillowGeometry`), `fabric062` | Pod bed | Box mattress | David's "realistic, irregular bedding" | Adapt (re-write two functions) | A few hundred vertices | Own code, CC0 texture | H1 | M | **Adapt** |
| H5 | Light presets and colour picker: Pod Original, Night City, After Hours, Deep Sleep, Underground, Music Sync; custom colour; brightness; power | Pod: `src/pod/lighting.ts` (the `LIGHT_PRESETS` table) and `lightFace.ts` | Pod wall (light controller screen beside the music player) | None (PR #192 only reacts to music) | Customisable colours; default pink/violet | Adapt the data and UI idea; re-light in Babylon | Must stay inside our light budget | Own code | Re-lighting decision (see performance) | M | **Adapt** |
| H6 | Three generative synth tracks | Pod: `src/audio/MusicEngine.ts` (synth sequencer) | A third source in the pod music player ("Pod synth") | None | Copyright-free music with no files; avoids the website playlist's "(Cover)" licensing question | Adapt (about 150 lines of Web Audio) | Light | Own code | PR #192 | S | **Adapt** |
| H7 | Pod default appearance values: about 20 percent darker, pink/violet | Pod: preset `a/b/c` colours and `brightness` | Pod lighting default | n/a | Matches the brief | Data | None | n/a | H5 | S | **Adapt** |

### Medium priority (useful, needs adaptation or a decision)

| # | Asset or technique | Source ZIP and path | Destination | Current equivalent | Expected improvement | Import / adapt | Performance | Licence | Dependencies | Difficulty | Recommendation |
|---|---|---|---|---|---|---|---|---|---|---|---|
| M1 | Vending machine and its 20-product catalogue with drawn packaging | Pod: `src/pod/vending.ts` | District vending alcove (`district-vending`) and a pod-side machine | Three lit boxes, one text line | Rich, readable machine; tie purchases to game credits | Adapt (canvas art to `DynamicTexture`) | 20 small textures; atlas them | Own code; fictional brands | **Age policy** (tobacco, vape, cannabis-style and "black market" items); credits and inventory design | L | **Adapt**, gated on the age-policy decision |
| M2 | Pod screens as a system: canvas faces on the wall, DOM buttons over each projected screen for accessibility | Pod: `screens.ts`, `displays.ts`, `panelOverlay.ts` | Wall screens in pods and the District | PR #192 wall screen is read-only; controls open with E | Click-to-use wall screens | Adapt | Low | Own code | Pointer/camera handling in the game (pointer lock) | M | **Adapt** (optional) |
| M3 | Reclining first-person camera in the pod | Pod: `src/pod/cameraRig.ts` | Pod start experience ("wake up in a pod") | None | The cinematic start David wants | Recreate (a Babylon camera rig) | None | Own code | #191 pod-start flow | M | **Recreate** |
| M4 | Rain window and corridor view | Pod: `corridor.ts` | Pod window | None | Atmosphere | Recreate (cheap: a lit plane, streaks, a few signs) | Low if kept simple | Own code | H3 | M | **Recreate** |
| M5 | Film-grade post effect (vignette, edge chromatic aberration, grain) | Pod: `postfx.ts` | Pod only | None | Cinematic feel | Adapt (a small `PostProcess`) | One extra full-screen pass; **low tier: off** | Own code | None | S | **Adapt**, high tier only |
| M6 | Lightweight background pedestrians (`pedestrian_a`, `pedestrian_b`) | Space: `assets/characters/pedestrian_a|b/*.glb` | Distant NeoChinatown crowd, social areas (never named NPCs) | Crowd of 22 heavy models | About 10 times fewer triangles per crowd member | Adapt: needs a **retargeting spike** to our `mixamorig` clips, textures downscaled to 512 | 3.7 to 4.3k triangles each | **Unclear (fails policy until cleared)** | Licence decision; retarget spike | L | **Hold**: only after licence is cleared and a spike works |
| M7 | Flying taxi | Space: `assets/props/vehicles/flying_taxi.glb` | City traffic / taxi prop (`city-taxi.js`, `traffic.js`) | Existing traffic and taxi code | A better-looking taxi, if it beats ours | Import (static prop; set scale, yaw) | 3.3k triangles | **Unclear** | Licence; a side-by-side render | S to M | **Hold** (render and licence first) |

### Low priority or reject

| # | Asset | Source | Why | Recommendation |
|---|---|---|---|---|
| L1 | `player_ship.glb` | Space | The Kestrel is canon and procedural; ownership, handling and upgrades are untouched; licence unclear | **Reject** |
| L2 | `freighter.glb`, `pirate_fighter.glb` | Space | Quaternius CC0 ships already fill these roles; licence unclear | **Reject** (or revisit only after licence is cleared) |
| L3 | `meridian_station.glb`, `satellite.glb` | Space | Meridian is a bespoke canon location; licence unclear; a satellite prop is trivial | **Reject** |
| L4 | `captain`, `iris`, `rook`, `elara`, `marcus`, `mara`, `kai`, `seren`, `nadia` models | Space | Established or retired NPC identities; no approval to change a face; no clips; licence unclear. In-game Iris must stay separate | **Reject** |
| L5 | Asphalt, concrete, grass, desert ground, metal plates textures | Space | The game already ships equivalent ambientCG sets for NeoChinatown | **Reject** (duplicates) |
| L6 | Planet, sky, atmosphere shaders; rain lines; smoke sprites; bloom | Space and Pod | Already equivalent in the game or the website | **Reject** |
| L7 | `src/data/*`, `src/ground/levels.ts`, `src/relay.ts`, `src/systems.ts`, `src/ui/hud.ts`, `src/space/space.ts` | Space | Retired Void Runner campaign, story, missions and HUD; do not restore retired content | **Reject** |
| L8 | `title_bg.jpg`, `holo_ad.jpg` | Space | AI mood images, no licence | **Reject** |
| L9 | Store art, `index.html`, `.tesana*`, `.storefront*`, `README_EXPORT.md` | Both | Tesana plumbing and marketing art | **Reject** |
| L10 | Phaser, Rapier, three.quarks, Three.js | Both | A second engine is out of scope | **Reject** |

### Inferior to what we already have
- **Characters:** the Tesana characters have **no animation**; our 22 crowd models have 5 to 24 clips each and a working pipeline (`crowd.js`, `animation-library.js`). They are lighter, not better.
- **City textures:** duplicates of sets we already use.
- **Ships and station:** single AI meshes with one baked material; not shown to be better than our hand-modelled CC0 ships and kit-built Meridian.
- **Spaceflight game systems:** retired content.

## Features of the Sleeping Pod ZIP and their state

| Feature | In PR #192? | Left to integrate |
|---|---|---|
| Wall-mounted music player | **Yes, our own version.** A screen on the pod room's south wall (E opens a player) | Tesana's screen-as-a-system (click-to-use) is optional (M2) |
| Local music from the player's computer | **Yes.** Several files, browser-only, optional browser-local keep | Tesana's engine loads only one file at a time; ours is already ahead |
| Playlist, shuffle, repeat, volume, progress | **Yes** | None |
| Website playlist as a built-in source | **Yes** (the site's 27 songs) | See licensing flag for "(Cover)" titles |
| LED spectrum | **Yes** (the website's analyser look) | None |
| Music-reactive lighting | **Yes**, on what the District already has (pink lamp, ceiling panels, pod glow, new wall strip) | A separate Tesana-style light controller (H5) |
| Generative synth tracks | No | H6 |
| Pod interior geometry and layout | No | H3 |
| Materials, scratches, wear, chipped paint, grime | No | H1, H2 |
| Bedding | No | H4 |
| Vending machine and contents | No | M1 (age policy) |
| Window, corridor view | No | M4 |
| Reclining camera and interaction | No | M3, M2 |
| Light presets and colours | No | H5, H7 |
| Ambient audio | No (the Pod ZIP has none; the Spaceflight ZIP has a synthesised rain ambience in `src/core/audio.ts`) | Optional |
| Film grade, smoke | No (the website pod page has its own smoke) | M5 |
| Pod reservation, per-pod preferences, audio isolation from the hallway | No | Pod allocator in PR #191 (architecture only) |

## Sleeping Pod integration recommendation

1. **Do not port the ZIP.** Re-build the pod in Babylon as a reusable module (`pod-interior`), using the ZIP as a reference for dimensions, layering, colour and wear.
2. **Re-light it first.** Decide the lighting approach before modelling: emissive light strips and a baked or probe-based fill, with at most 3 to 4 real lights per pod. One shared pod mesh set, instanced per pod. Merge static parts (the District builder already merges static meshes by material).
3. **Appearance** (David's brief): pink/violet default, about 20 percent darker than the original, customisable colours and presets (H5, H7), visible wear (H2), scratched metal and glass, chipped paint, grimy seams and vents, irregular bedding (H4).
4. **Keep the wall player from PR #192**; add a light controller screen beside it later.
5. **Wait for the District floor plan** (a pending approval in PR #191) before placing the final hallway of pods. A testable pod module can be built first without it.
6. **Multiplayer fit** (PR #191): one pod module, instanced; per-pod light and music settings are local; hallway sound isolation is a mix change (low-pass the hallway while inside), not new geometry.

## Music-player recommendation

Already delivered in PR #192 (see `docs/SLEEPING-POD-MUSIC.md`). Remaining: (a) add the three generative synth tracks (H6) as a copyright-free third source; (b) decide whether the website playlist, which has "(Cover)" titles and strong language and is publicly served, should ship in the first live test (see the handoff's approvals).

## Performance concerns

- The pod's lighting alone (about 13 lights, 5 of them area lights) exceeds our GPU light budget; it must be re-lit.
- Characters carry three 1024 px textures each (about 17 MB of GPU memory uncompressed per character); 20 pedestrians would be about 340 MB unless textures are shared or reduced to 512.
- All GLBs use WebP textures; confirm the pinned Babylon loader reads them before relying on them.
- Procedural canvas textures are cheap once generated; do generation once at load, not per frame.
- Performance on a real GPU has **not** been measured; every browser test so far used software rendering.

## Proposed sequence of small pull requests (nothing started)

1. **Pod re-lighting and budget spike** (no art): prove a pod can be lit within the light budget at low and high.
2. **Pod shell and bed** (H3, H4) with CC0 materials (H1), one instanced module, placed in the existing pods row.
3. **Pod wear and lighting presets** (H2, H5, H7).
4. **Pod synth tracks** (H6).
5. **Vending machine** (M1), after the age-policy decision.
6. **Pod camera, window and corridor** (M3, M4), with the pod-start flow in PR #191.
7. **Crowd and traffic spikes** (M6, M7): only after David clears the licence and a retargeting spike and side-by-side renders justify them.

Dependencies: 2 to 6 depend on the District floor plan and the pod allocator in PR #191 only for the final placement; the pod module itself does not.

## Decisions needed from David

1. **Licence of the Tesana models:** David has the Tesana **Max Plan**. Read that plan's terms (and the Tripo and shared-library terms they cite), confirm the five points under "David's Tesana plan" above, and record the answer in this file. Until then nothing from `assets/characters` or `assets/props` may be imported.
2. **Vending machine content** (tobacco, vape, cannabis-style items, "black market" parcel) depends on the age policy.
3. **Whether to render and compare** the Tesana vehicles and pedestrians against ours (a half-day spike) before any decision.
4. **Pod appearance direction:** confirm "about 20 percent darker, pink/violet" from the current code, not the older cyan/green store art.
