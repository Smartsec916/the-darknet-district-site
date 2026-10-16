# VOID//RUNNER: Asset Candidates

**As of:** 2026-10-16 · **Approved by David (2026-10-16):** Ultimate Spaceships models for pirates and traffic; Essentials crates, barrels, lockers, shelves and desks for Meridian. **Now in the game**; see `VOID_RUNNER_GRAPHICS_ROADMAP.md`. Scores follow `VOID_RUNNER_ART_DIRECTION.md` (theme 30, function 20, geometry and materials 20, environment 15, technical 15; licence pass/fail; 85 to approve).

**How these were judged:** I looked at each creator's own preview images on its official page (checked 2026-10-16). Those images are lit presentation renders, so every score is **provisional until the models are rendered in our game**. None is approved yet.

| Candidate | Source | Licence (checked) | Size (free version) | Covers | Seen | Score (est.) | Status |
|---|---|---|---|---|---|---|---|
| **Modular Sci-Fi MegaKit** (270+ grid-based walls, floors, doors, columns, props; free Standard edition is about 60–70% of the pack) | https://quaternius.com/packs/modularscifimegakit.html · download https://quaternius.itch.io/modular-sci-fi-megakit | **CC0**: commercial use, no attribution | Standard zip **46 MB** (glTF/FBX/OBJ) | Meridian interiors, derelict variants, station props | Preview render: dark industrial corridor with structural ribs, panel lines and practical strip lights. Good match for Meridian and the derelicts. | 85 (25/18/15/13/14) | **Shortlisted.** Needs an in-game render check. |
| **Sci-Fi Essentials Kit** (60+ props: crates, screens, guns, animated robot enemies; built to match the MegaKit) | https://quaternius.com/packs/scifiessentialskit.html · https://quaternius.itch.io/sci-fi-essentials-kit | **CC0** | Standard zip **159 MB** | Crates, consoles, screens, pistol, robots | Preview: a control room with consoles, crates and two spherical robots. Props look industrial; the robots are cute/stylized. | 81 (24/17/15/12/13) | **Partly shortlisted** (props and guns). Robots rejected for this art direction. |
| **Ultimate Spaceships Pack** (10 textured ships) | https://quaternius.com/packs/ultimatespaceships.html · free files in the creator's Google Drive folder (linked from that page) | **CC0** | Not shown (10 models; likely small) | Enemy fighters, traffic | Preview: properly modelled hard-surface hulls with panelling and engines, far beyond our box ships, but semi-stylized with bright purple engine glow (can be retinted). | 79 (21/18/15/11/14) | **Below 85.** A big step up but not a perfect fit; **David's call** whether to use it for pirates and traffic while better ships are sought. Not for the Kestrel. |
| Universal Base Characters (6 rigged base bodies, 20 hairstyles, ~13k triangles) | https://quaternius.com/packs/universalbasecharacters.html | CC0 | — | NPCs | Preview: stylized "hero" proportions in underwear, with no sci-fi clothing. | 52 | **Rejected for now.** No suitable outfits; wrong style. |
| Poly Haven HDRIs and PBR textures (metal plates, concrete, rust) | https://polyhaven.com (licence: https://polyhaven.com/license) | **CC0** | HDRI 1K about 1–2 MB each | Image-based lighting so PBR renders properly; tiling metal and concrete materials | Licence page checked; individual items not yet picked | n/a (materials and lighting) | **Recommended** for Phase H; pick 1–2 interior or space HDRIs. |
| Kenney space kits | https://kenney.nl/assets | CC0 (Kenney's stated policy; not re-checked) | — | — | Not inspected; Kenney's sci-fi kits are deliberately toy-like low-poly | — | **Not evaluated**; likely outside the art direction. |
| Sketchfab models (realistic ships, characters) | https://sketchfab.com | Per model; many are CC-BY (commercial OK with credit), some are NC (not allowed) | — | Kestrel-class ship, realistic NPCs | Downloads need a signed-in account | — | **Manual list needed.** I won't sign in or download from accounts; David would pick and download any that pass. |

## Gaps no free pack covers well (yet)
- **Realistic humans in work clothing** for NPCs. Options: a Sketchfab CC-BY set chosen by David, or a paid pack (needs approval).
- **A Kestrel replacement** that keeps its identity. The current custom Kestrel stays until a model is approved.

## Proposed first downloads (awaiting David's permission)
1. Modular Sci-Fi MegaKit, Standard (46 MB), from itch.io, $0 "name your own price"
2. Sci-Fi Essentials Kit, Standard (159 MB), from itch.io, $0
3. Ultimate Spaceships Pack, from the creator's Google Drive folder (size shown on download)

They'd be downloaded to a working folder **outside** the repo. Only selected GLB files, after an in-game look, would be committed.

## Review round 1 (2026-10-16): downloaded, imported and rendered

David approved downloading the three free Standard editions. They're kept outside the repo in `%LOCALAPPDATA%/void-runner-assets/`:
- MegaKit: 46 MB
- Essentials Kit: 159 MB
- Spaceships pack: 145 MB from the creator's public Google Drive folder, whose `License.txt` states CC0 1.0

All three were converted to self-contained GLBs with `tools/assets/import-models.cjs` (237 models, 1 broken file in the MegaKit itself) and rendered in the developer gallery (`tools/assets/gallery-server.cjs`), using game-like lighting plus a reflection environment built in code.

| Pack | What the renders show | Revised score | Recommendation |
|---|---|---|---|
| **Ultimate Spaceships** (11 ships, 750–8,300 triangles) | Weathered orange, grey and black industrial hulls with real engines, cockpits and wings; detail is mostly in textures. The purple glow in the promo was an effect added for that image, not part of the models. **Placed in a real flight** as raider (Striker), interceptor (Challenger) and gunship (Insurgent): they read clearly at combat range and are a large step up from the box ships. | 84 (24/18/14/13/15) | Use for **pirates and traffic** (raider, interceptor, gunship, courier, shuttle, security) pending David's review. **Not for the Kestrel or faction ships.** |
| **Sci-Fi Essentials Kit**: props | Crates, large crates, barrels, ammo cases, lockers, shelving, desks and a pilot-style chair: solid industrial PBR. The blue tarp crates and the green health items are brighter than the art direction. | 86 for crates, barrels, lockers, shelving and desks (25/18/16/13/14) | **Shortlist** for Meridian hangar and bar dressing. |
| **Sci-Fi Essentials Kit**: robots and syringe/health items | Toy-like robots, bright green consumables | — | Reject. |
| **Modular Sci-Fi MegaKit** (free edition) | Good shapes (crates, pipe racks, rails, vents, walls), but the free edition's materials are near-black trim textures; the pack's colour masks only come with the paid Source edition. It needs the new reflection environment to read at all. | 78 (24/18/13/12/11) | Hold. Use a few props (pipe holder, rails, vents, crate4) if they read well in the game; whole interiors would need recolouring or the paid edition (needs approval). |

**Screenshots** (in the review folder, not committed): `ingame-fighters.jpg` (real models in flight), plus contact sheets `ships.jpg`, `essentials-props.jpg`, `megakit-props.jpg` and `megakit-walls.jpg`.
