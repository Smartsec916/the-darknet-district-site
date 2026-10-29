# Supplied companion asset compatibility — 2026-10-29

No supplied model is included in the production release. Existing Seren, Kai and Nadia, their dialogue, voices and interactions remain unchanged. Counts below are inspection results, not proof of a successful Babylon conversion.

| Family / supplied formats | Geometry and rig | Expressions / clips | Assessment |
|---|---|---|---|
| female_secretary.zip: FBX + PNG | 932 triangles, 520 source faces, one mesh/material, 28 bones, skinned | No morphs or embedded clips | Best low-cost conversion candidate; not runtime-ready |
| Mégane Maya/Blender/Unity RAR exports | Inspected Blender-package FBX: 83,773 triangles, 43,236 faces, 11 meshes, 24 materials, 101 bones | 446 shape records (not 446 certified expressions); one Default clip | Licensing blocks current commercial integration; substantial material/texture optimization |
| 3D Female DL.1 7z: BLEND/FBX/PMX | FBX 239,767 triangles, 131,835 faces, 14 meshes, 13 materials, 132 bones | 18 shapes; no clips | Rights unresolved; high geometry, conversion/retarget required |
| FF7 Aerith Casual Wear 7z: BLEND/FBX/PMX | FBX 170,225 triangles, 170,109 faces, 19 meshes, 10 materials, 229 bones | No FBX morphs or clips | Franchise identity/commercial rights unresolved; exclude |
| RedDressSecretAgent OBJ/MTL/FBX + JPEG ZIP | FBX 292,380 triangles, one mesh/material, no bones/skin | No shapes or clips | Unsuitable as an animated companion without retopology and rigging |
| Toon3d2 BLEND/GLB/FBX | GLB 158,070 triangles, seven mesh groups, 54 material slots, one skin/85 joints; FBX 84 bones plus root | No GLB morph targets or animation clips | Direct GLB format but not performance/animation ready; license unresolved |

## Materials, structure and portability
Secretary has one 256×256 PNG atlas. Its FBX references secretary_tex.png and an additional secretary_tex256.png alpha filename absent from the ZIP; confirm whether alpha is unused or remap it during conversion, then inspect eyes/hair/materials visually. Its simple humanoid skeleton is not proof that current animation clips retarget correctly. Hair/clothing are in one mesh; no modular customization is established.

Toon GLB embeds 23 images ranging from 1024×1024 through 4000×4000 (also rectangular 1500×1000). It separates Body, Dress, Hair, earrings and shoes, but 54 materials and 34.65MB payload are expensive for handheld VR scenes. FBX and GLB triangle totals agree. Distinct material variants must be pruned deliberately, textures downsized, and a target draw-call/texture budget measured before integration. Separate pieces are not automatically interchangeable with unrelated bodies.

Mégane has tongue, eyes, teeth, tearline/occlusion, two hair parts and clothing meshes. The other Female DL includes mouth, hair, gloves, top, pants, boots and jacket meshes. Aerith has separate eyes/mouth/hair/clothing/accessories. These structures suggest adaptation possibilities; shape semantics, eye tracking, mouth motion, deformation and clipping remain unverified. Other archive texture resolutions, complete material relinking and alternate Mégane package parity were not fully certified. No facial or lip-sync capability is promised.

FBX units/axes and bone names were inspected, but final scale/orientation requires a Babylon load test. Convert from trusted local sources to optimized GLB without executing embedded scripts. Preserve rigs and supported morphs; map bones explicitly, test idle/walk/sit/gestures on each skeleton, and preserve existing animation assets. Use head/hand attachment sockets and per-body weighted clothing; do not assume cross-creator clothing fits. No customization editor is included.

## Rights evidence
- Secretary: creator [Vinrax listing](https://vinrax.itch.io/psx-secretary-character) identifies the exact ZIP and permits project use with credit. Credit Vinrax and preserve the listing record when converting. This resolves the earlier missing license evidence; it does not complete technical validation.
- Mégane: matching [CGTrader listing](https://www.cgtrader.com/free-3d-models/character/woman/megane-free-high-poly-3d-model), item 4685617, shows Editorial License (no AI). Required commercial-game permission is not established.
- RedDress: matching [creator listing](https://www.cgtrader.com/free-3d-models/character/woman/red-dress-secret-agent-character-3d-model), item 7118209, shows Royalty Free License (no AI), but technical readiness fails. Its franchise-inspired description warrants reviewing third-party rights before future use.
- Toon: owner supplied [download page](https://www.cgtrader.com/items/7280828/download-page). Public retrieval was inaccessible; download URL alone supplies no license terms. No circumvention was attempted.
- Female DL and Aerith: downloaded item IDs 7643719 and 6443418 were recovered from sanitized origin metadata; no commercial license record was supplied or established. A franchise fan model is not treated as commercially cleared.

No license/readme was found inside the inspected archives. Original assets remain outside Git. No private signed download tokens are included in this report.

## Method and limits
Archive listings and selected FBX files were read locally, GLB JSON and embedded image headers parsed directly. Temporary ufbx 0.0.5 reported meshes/rigs/shapes, but the inspection subprocess crashed at native shutdown after writing reports; totals are provisional except cross-checked GLB/FBX Toon geometry and publisher-confirmed Secretary triangles. No runtime dependency was added. BLEND scripts were not executed. No screenshots of integrated new companions exist because none passed the complete conversion, material, animation and performance gates.

## Follow-up
Convert and validate Secretary first in an isolated preview, with attribution and material repair. Measure actual scene GPU/CPU cost, camera framing, deformation and repeated VR disposal before enabling selection. Optimize Toon only after obtaining its listing/license terms. Keep the other models excluded until rights and technical blockers are resolved. This work does not block the separately authorized safe website/game release.