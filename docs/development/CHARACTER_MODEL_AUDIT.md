# Character model and customization audit

Written 2026-11-05 from `codex/conversations-character-foundation` at `590eb7c`. **Audit only. Nothing was implemented, replaced, imported or changed in the game, and no production system was touched.** The companion document is `CHARACTER_CUSTOMIZATION_PLAN.md`.

How the facts were gathered: a dependency-free, read-only script (`tools/assets/analyze-character-models.cjs`) opens every `.glb` and reports what is really inside (triangles, separate meshes, textures and their pixel sizes, skeleton, clips, morph targets, embedded licence text), and can read `.glb` files inside a ZIP **without extracting it**. Its raw output is kept in `docs/development/character-audit/` (`crowd-glb-analysis.json`, `tesana-characters-analysis.json`). Anything in a prompt or an older document that I could not find as a file is listed under "Not present". Sizes and triangle counts are computed from the files, **not** measured as frame time: this sandbox has only software rendering.

## 1. Short answers

| Question | Answer |
|---|---|
| Male and female models ready to use | Today the game can already render **two player looks** (`district-smuggler`, male; `district-resident`, female), plus 20 more MakeHuman characters built for NPCs and companions. All 22 are CC0-based, animated, share one skeleton and are in the repository. They are **finished characters with their clothes and hair baked in**, not a creator kit. For a creator, build **one new standard base body per sex** (section 8). |
| Hairstyles and clothing available | In the repository: **9 hairstyles** (`short01` to `short04`, `bob01`, `bob02`, `braid01`, `long01`, `ponytail01`), a **fedora** and five small accessory types (shades, visor, mask, collar, headset), **12 outfits** and **5 shoe styles**, but only as meshes **inside the 22 character files**, each fitted to one body. The full MakeHuman and "Suits 02" libraries they came from are **not** in the repository; they live in the owner's Blender/MPFB install. There are no standalone hair or clothing files. |
| Compatible skeletons and animations | **All 22 MakeHuman files share one 52-joint `mixamorig:` skeleton with identical joint names and order (verified).** Clips are embedded in each file (5 to 24 per file). The 11 Tesana characters use a different (VRM-style) skeleton, have **no** clips, and are incompatible without rework. The paid companion models are rebuilt onto the same 52-joint names but are not in the repository. |
| Needs licence verification | The Rokoko, Mixamo and "Suits 02" pack terms as they apply to **redistribution inside a web game**, the `culturalibre_heroine_suit_2` outfit (source and licence not recorded anywhere), every CGTrader companion model, and every Tesana-generated character (section 7). |
| Missing for a full creator | Standard base bodies, hairs and outfits **re-exported as separate fitted parts**, neutral (tintable) textures, a shared animation library for the standard bases (plus run, hug, turn, which no built file has), a catalog, a preview scene, an appearance field on the server, and a wardrobe location (section 9 of the plan). |
| Safest order | Spikes first (shared-skeleton part assembly in Babylon, tinting), then catalog and server appearance ids, then a read-only preview, then base bodies and a small part set, then the in-world wardrobe. See the plan. |

## 2. What is actually present

| Group | Files | Where | Present and readable? |
|---|---|---|---|
| **A. MakeHuman/MPFB crowd characters** (CC0 builds) | 22 `.glb`, 72.8 MB in total | `void-runner/assets/models/crowd/` | **Yes**, read and measured. |
| B. Rig proof of concept | `mara-poc.glb` (1,600 triangles, 52 joints, 2 clips, no textures) | `void-runner/assets/animations/` | Yes. A rig test, not a character. |
| C. Paid or downloaded companion models | Nadia (`vr-companion-fc1.vrpak`, 8.8 MB), Ava, Eva, Una, Yuki (female base), Dex (male base) | `.vrpak` of Nadia in the repo (scrambled by design; `analyze` cannot read it); the others are **absent**: only their build specs (`tools/animation-pipeline/characters/vr-companion-*.json`) and prepare scripts exist, and the models are deployed from a private licensed-assets repository | **No** (Nadia present but unreadable; five absent) |
| D. Tesana characters | 11 `.glb` | In the owner's uploaded ZIP `d897bfca-game-...-code.zip` (`assets/characters/*`), **not** in the repository. The second ZIP (`e9194520-...`) has no characters (it is the Sleeping Pod project) | Yes, read in place without extracting |
| E. Pipeline sources | MPFB 2.0.18 body, skin, hair, clothing and "Suits 02" assets; the 113-clip FBX archive `VOID_RUNNER_KEEP.zip`; the Quaternius Universal Animation Library; Mixamo and Rokoko downloads | The owner's machine and the build scripts' folders; **not** in the repository | **No.** Only specs, scripts and `catalog.json` (a listing of the 113 clips) exist here |
| F. Player body in the world | None | The local player has no visible body; remote players are drawn from the group-A models by id (`remote-players.js`) | n/a |
| G. Characters built only in code | Mara, Rook, Iris, Admin and others are procedural Babylon meshes (`babylon-renderer.js`, `opening-scene.js`) | code | n/a (not a model asset) |

Nothing else in the repository is a character model: the other `.glb` files are ships, props, plants and set pieces.

## 3. Model inventory (group A, measured)

Columns: sex (from the build spec), file size, triangles, separate meshes (each is at least one draw call), textures, embedded clips, then the MakeHuman skin, hair, outfit and shoes the spec names, and where the game uses it. All textures are 512 px (JPEG for skin and eyes, PNG for the rest); no normal maps; none are KTX2-compressed.

| File | Sex | Size | Triangles | Meshes | Textures | Clips | Skin | Hair | Outfit | Shoes | Used by |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `communion-tech.glb` | female | 3.5 MB | 54,602 | 9 | 9 x 512 | 6 | young_african_female | bob02 | matcreator_mc-skinsuit_2022, matcreator_mc-scifi-armor_guardian | - | Vigil, Nexus, NeoChinatown crew |
| `communion-worker.glb` | male | 2.9 MB | 33,000 | 9 | 8 x 512 | 5 | middleage_asian_male | short01 | male_worksuit01 | shoes03 | Vigil, Nexus crew |
| `cyborg-01.glb` | male | 3.6 MB | 52,340 | 8 | 8 x 512 | 11 | middleage_african_male | - | matcreator_mc-skinsuit_2022, matcreator_mc-scifi-armor_jupiter7 | - | Meridian, Vigil crew |
| `district-resident.glb` | female | 3.0 MB | 32,118 | 10 | 7 x 512 | 8 | young_asian_female | braid01 | female_sportsuit01 | shoes04 | District crew; **current female player look** |
| `district-smuggler.glb` | male | 3.1 MB | 39,650 | 9 | 9 x 512 | 5 | middleage_caucasian_male | short04 | male_casualsuit01, fedora_cocked | shoes03 | District crew; **current male player look** |
| `fixer-01.glb` | female | 2.9 MB | 28,842 | 8 | 8 x 512 | 10 | middleage_caucasian_female | bob02 | female_elegantsuit01 | shoes03 | Meridian, Foundry, NeoChinatown crew |
| `hacker-01.glb` | male | 3.1 MB | 30,340 | 8 | 8 x 512 | 11 | young_asian_male | short02 | male_casualsuit05 | shoes03 | Meridian, District crew |
| `meridian-bartender.glb` | female | 2.8 MB | 35,068 | 8 | 8 x 512 | 6 | middleage_asian_female | bob01 | female_elegantsuit01 | shoes03 | Meridian bartender |
| `ncz-neon.glb` | female | 3.3 MB | 30,248 | 8 | 8 x 512 | 9 | young_caucasian_female | long01 | female_sportsuit01 | shoes05 | NeoChinatown street crew |
| `order-farmhand.glb` | male | 3.4 MB | 30,716 | 8 | 8 x 512 | 5 | young_caucasian_male | short03 | male_worksuit01, fedora_cocked | shoes02 | Holdfast crew |
| `order-grower.glb` | female | 2.9 MB | 31,598 | 8 | 7 x 512 | 5 | middleage_african_female | braid01 | female_sportsuit01 | shoes02 | Holdfast crew |
| `order-militia.glb` | male | 3.5 MB | 55,436 | 7 | 8 x 512 | 5 | middleage_asian_male | short01 | matcreator_mc-bodysuit-2021, matcreator_mc-scifi-armor_guardian | - | Holdfast guard |
| `outlaw-01.glb` | male | 4.1 MB | 48,732 | 8 | 7 x 512 | 13 | middleage_african_male | short02 | male_casualsuit05, matcreator_mc-scifi-armor_guardian | - | Meridian, Rusthaven, District crew |
| `regular-01.glb` | male | 3.2 MB | 31,124 | 10 | 7 x 512 | 12 | middleage_caucasian_male | short03 | male_worksuit01 | shoes03 | Meridian, Kepler, belt crew |
| `runner-02.glb` | female | 3.3 MB | 43,754 | 8 | 8 x 512 | 8 | young_asian_female | bob01 | culturalibre_heroine_suit_2 | shoes03 | NeoChinatown street crew |
| `vesper-mechanic.glb` | male | 3.0 MB | 32,616 | 8 | 7 x 512 | 5 | middleage_caucasian_male | short01 | male_worksuit01 | shoes03 | Vesper crew |
| `vesper-pilot.glb` | female | 2.9 MB | 32,496 | 8 | 7 x 512 | 6 | young_asian_female | ponytail01 | female_sportsuit01 | shoes03 | Vesper crew |
| `vesper-trader.glb` | male | 3.9 MB | 29,580 | 9 | 8 x 512 | 11 | middleage_african_male | short02 | male_casualsuit03, fedora01 | shoes01 | Vesper, Meridian, Rusthaven crew |
| `vr-companion-f.glb` | female | 4.5 MB | 30,378 | 7 | 7 x 512 | 24 | young_african_female | long01 | female_elegantsuit01 | shoes03 | Seren (VR companion) |
| `vr-companion-m.glb` | male | 4.4 MB | 37,832 | 7 | 7 x 512 | 20 | young_caucasian_male | short02 | male_elegantsuit01 | shoes01 | Kai (VR companion) |
| `vr-player-a.glb` | male | 2.8 MB | 29,068 | 12 | 7 x 512 | 7 | young_african_male | short02 | male_casualsuit03 | shoes01 | VR arcade player one |
| `vr-player-b.glb` | female | 3.0 MB | 32,164 | 12 | 7 x 512 | 7 | young_caucasian_female | ponytail01 | female_sportsuit01 | shoes05 | VR arcade player two |

Totals: 72.8 MB for the 22 files (about 24.5 MB images, 28.5 MB mesh data, 13.7 MB animation tracks). Triangles per character 28,842 to 55,436; draw calls (meshes) 7 to 12; textures 7 to 9; joints 52 on every one.

**Where the triangles go** (from the separate meshes inside the files):

| Part | Triangles seen |
|---|---|
| Body (`base`) | 14,992 to 20,344 (the largest single cost: roughly half of a character) |
| Hair | `short04` 1,050; `short03` 1,922; `bob02` 2,248; `short02` 3,344; `short01` 3,678; `long01` 4,108; `ponytail01` 5,352; `braid01` 5,518; `bob01` 8,474 |
| Outfit | 3,436 (`female_sportsuit01`) to 17,992 (sci-fi armour and the MatCreator suits); typical 4,200 to 7,000 |
| Shoes | 3,064 to 4,128 |
| Face parts | the `low-poly` mesh (the eyes) 172, eyebrows 192, eyelashes 368 (the same in every file) |
| Accessories (built by our script) | shades, visor, mask 324; collar 384; headset 324 + 324 + 384; mask slits 132 each |

The same part has the **same triangle count in every character that wears it** (for example `braid01` 5,518, `short02` 3,344), which shows each part is one fixed mesh topology, **fitted** to each body when it is built.

## 4. Skeleton, animation and rigs (verified)

- **One shared skeleton.** All 22 files carry a single skin with the same 52 joints, the same names (`mixamorig:Hips`, `mixamorig:LeftUpperArm`, ...) and the **same order**. Bone lengths and bind orientation differ per body (each character has its own proportions: bind-pose heights range from 1.35 to 1.97 model units), but names and hierarchy match, so clips can be exchanged between files as long as they are retargeted for the body.
- **No face rig.** Zero morph targets in every file and no jaw, eye or brow bones. Blinks, smiles and facial sliders are **not** possible with these models (`VOID_RUNNER_VR_ARCADE.md` says the same). Fingers: present as bones.
- **Clips are embedded per file, not shared.** Each file carries its own copies, 156 channels per clip, 15 fps, trimmed loops (idle 8.07 s, walk 1.4 s). They cost 0.4 MB (5 clips) to 1.5 MB (24 clips) per file, about 13.5 MB across the 22. Loading ten different looks therefore downloads the same walk clip ten times.
- **Clips actually built into at least one file (45 named in `clips.json`):** idle, talk, sit, sit-enter, sit-exit, sit-talk, sit-relax, sit-wave, smoke, watch, drink, laugh, look, interact, pickup, wipe, work, typing, menu, menu-tap, walk, walk-f, dance, dance-belly, dance-samba, slow-dance, wave, blow-kiss, coy, head-tilt, hips, glance-back, shrug, recline, idle-f2, idle-m2, drunk-idle, drunk-sway, drunk-walk, and seven `vr-*` shooter moves. The **player-sized set** every character would need (idle, walk, sit, sit-enter, sit-exit, wave, dance, talk, laugh) is complete in **one file only**, `vr-companion-f` (24 clips); `vr-companion-m` (20) lacks a standing wave, and the district models carry 5 or 8.
- **Not built into any file, and not in the 113-clip archive:** **run, jog, sprint, jump, crouch, hug, turning in place, cheer.** The archive `catalog.json` (113 clips, 74 Mixamo, 36 HumanIK, 2 Unreal) has no clip named run, jog, hug or jump and only one `Turns`; all 113 are marked `safeForProduction: false` and most `NEEDS_REVIEW` or `NEEDS_RETARGET`. Whether the Quaternius Universal Animation Library (the source of the current walk, sit-enter, sit-exit, sit-talk, interact and pickup) also offers jog, sprint, jump, crouch, dance or a hug is **not verified here**, because that pack is not in the repository.
- **Tooling:** `tools/animation-pipeline/build_mpfb_character.py` (Blender 5.2 + MPFB 2.0.18) builds a figure from a JSON spec and retargets clips; `optimize-textures.cjs` shrinks textures; `ktx2-glb.mjs` and `pack-variant-textures.cjs` can compress textures to KTX2. Rebuilding anything needs the owner's Blender setup and source packs.
- **Runtime:** `asset-pipeline.js` loads each GLB once and `instance()` clones meshes, skeleton and clips per player; `crowd.js` plays clips by name with a fallback chain (for example sit-talk to talk). Remote players (`remote-players.js`) use exactly this.
- **Retargeting between sexes:** works at the level of names; quality depends on both bodies sharing the same bone orientation convention, which holds within the MPFB builds. Clips authored for the female body were rebuilt separately for the male body in the companion files (`idle-f2` and `idle-m2`, `walk-f`).

## 5. Existing customization code

- **Companion "looks"** (`void-runner/vr-companions.js`): a catalog-driven system already in the game. Each companion lists look groups (`outfit`, `hair`, `glasses`, `face`), each with options that **show or hide named meshes** (`parts`), **swap a material's texture** from small variant files (`textures`, packed by `pack-variant-textures.cjs`, optionally KTX2) and set material values (`materials`). The chosen options are saved in `localStorage` (`void-runner-companion-looks-v1`). This is the pattern to generalise, not a new idea.
- **Server character record** (`void_runner_api.py`): `{gender, model}` where `model` must be exactly `district-smuggler` (male) or `district-resident` (female), or `admin` for the administrator. One per account, created once. The hub (`tools/district-hub/protocol.cjs`) only renders those two models.
- **No in-game creator exists**: the account panel offers the two looks as a plain choice.
- **Build-time styling only:** recolouring, glow trims and the accessories are done by `mpfb_styling.py` when a character is built, not at runtime.

## 6. Male and female options

| Role | Models | Notes |
|---|---|---|
| **Current player looks (keep working)** | `district-smuggler` (male), `district-resident` (female) | Referenced by saved characters and by the server; do not rename or remove. 39.7k and 32.1k triangles. |
| **Appearance presets for a creator (reuse the recipes, not the files)** | The specs of `hacker-01`, `regular-01`, `fixer-01`, `ncz-neon`, `vr-player-a/b`, `communion-worker`, `vesper-pilot` | Their recipes (skin + hair + outfit + shoes) are good starting presets, **rebuilt on the standard bases**. Reusing the NPC files themselves would make players look like the crowd. |
| **NPC-only (leave exactly as they are)** | `communion-tech`, `cyborg-01`, `order-militia`, `outlaw-01`, `runner-02`, `order-*`, `vesper-*`, `meridian-bartender` | Faction or role costumes (sci-fi armour, militia, bartender); several exceed 48k triangles. Players should not be able to wear faction armour by accident. |
| **Companions (leave)** | `vr-companion-f/m` (Seren, Kai), Nadia, Ava, Eva, Una, Yuki, Dex | Named characters; the paid ones have distribution limits (section 7). |
| **Do not use as players** | The 11 Tesana characters, `mara-poc.glb` | Section 7. |

Visual consistency: all group-A models share one style (MakeHuman realistic proportions with dark cyberpunk grading). The Tesana characters are stylised AI figures at about 3.5k triangles: mixing them would break consistency.

## 7. Licensing and provenance

Possession of a file or ZIP is not treated as a licence. Status as recorded in `docs/VOID_RUNNER_ASSET_LICENSES.md`, `tools/animation-pipeline/README.md`, `VOID_RUNNER_VR_ARCADE.md` and `TESANA_ASSET_AUDIT.md`:

| Asset | Source and terms on record | Status |
|---|---|---|
| MakeHuman bodies, skins, eyes, hair (`short01-04`, `bob01-02`, `braid01`, `long01`, `ponytail01`), clothing and shoes (`male_*suit*`, `female_*suit*`, `shoes01-05`), `fedora` | MakeHuman system assets via MPFB 2.0.18, **CC0** (stated in the crowd README and the licence ledger line for the companions) | **Verified on record** (CC0). The ledger records the companion rows explicitly; the other 20 crowd files are covered by the crowd README only. |
| `matcreator_mc-*` outfits (BodySuit-2021, SkinSuit_2022, SciFi-Armor Guardian, Jupiter7, Helios) | "Suits 02" pack through MPFB, described as CC0 in the README, which also forbids that pack's known-character costumes | **Needs verification**: the pack's own licence text is not in the repository. Used only by NPCs. |
| `culturalibre_heroine_suit_2` (`runner-02`, `runner-01`) | **No source or licence recorded anywhere** | **Needs verification; do not use in a creator** until identified. |
| Accessories (`shades`, `visor`, `mask`, `collar`, `headset`, trackers) | Generated by our own build script | Project-owned. |
| Walk, sit-enter/exit, sit-talk, interact, pickup | Quaternius Universal Animation Library, CC0 | **Verified** (CC0 per the pack). |
| Rokoko clips (idle, talk, laugh, smoke...) | Rokoko free library: "free to use in commercial projects"; **redistribution not addressed** (README) | **Needs verification** for shipping inside a public web game. |
| Mixamo clips (idle-f2, walk-f, dance-belly, drunk-*, ...) | Adobe Mixamo: royalty-free for games as part of a character | Likely fine as embedded character animation; confirm the terms for **raw clip redistribution** (we ship them only inside GLBs). |
| Nadia (Ludovisions FC1), Una, Yuki, Dex (CGTrader Royalty Free), Ava (BGShop), Eva (PrettyGirl_01, HelenNova) | CGTrader Royalty Free licences: game use allowed, **no redistribution of raw files**, no AI use; scrambled `.vrpak` and a private repository are the mitigation; Una's product page is **unidentified**; Ava and Eva are `listed: 'dev'` because release is unconfirmed | **Needs per-model verification; companion/NPC use only; never player bases and never extracted into a catalog.** |
| 11 Tesana characters | Generated by Tesana's 3D tool (Tripo `P1-20260311`); no licence file; the ZIP's README grants nothing about the models; several depict named characters from reference images; AI output may carry no copyright (see `TESANA_ASSET_AUDIT.md`) | **Do not import.** Technically incompatible too (below). The owner's plan statement and the three official Tesana pages could not be re-checked from this environment. |
| Anything in `waitress`, `body_female.fbx`, `Freya.blend`, DAZ morph packs | Recorded as unknown or doubtful in the ledger | **Do not import.** |

**Classification:** *verified for use*: group A bodies, skins, hair, standard clothing, shoes, accessories, UAL animation. *Needs verification before a creator ships*: Suits 02 outfits, the unidentified heroine suit, Rokoko and Mixamo redistribution inside a web game. *Technically incompatible*: Tesana characters (different skeleton and no clips), and any model needing a missing source pack. *Do not import*: Tesana characters, unverified CGTrader items, the DAZ and waitress files.

## 8. Technical compatibility matrix

| Asset | Skeleton | Clips | Separate parts | Skin tones | Hair | Clothing | Morphs | Suitable as player base |
|---|---|---|---|---|---|---|---|---|
| 22 MakeHuman crowd files | 52-joint `mixamorig:` (shared) | 5 to 24, embedded | **Yes** (body, hair, outfit, shoes, face parts, accessories are separate meshes) | texture swap possible (13 skin textures seen) | separate mesh, own texture | separate mesh, **fitted to its own body** | none | **Yes, as the source for standard bases** (not the files as they are) |
| `district-smuggler`, `district-resident` | same | 5 and 8 | yes | yes | yes | yes | none | **Yes** (the two current looks) |
| VR companion F/M | same | 24 and 20 | yes | yes | yes | yes | none | Possible base for sex-specific clip sets |
| Nadia, Ava, Eva, Una, Yuki, Dex | rebuilt onto the same names | many | outfit parts as hide/show | limited | limited | variants | blink shapes on some | **No** (licence, individual characters) |
| 11 Tesana characters | VRM-style 34 to 53 joints | none | **no** (one baked mesh) | no | baked | baked | none | **No** |
| `mara-poc.glb` | same 52 | 2 | proxy | no | no | no | none | No (test rig) |

## 9. Performance assessment (computed from the files)

| Item | Current look | 12 players, all different looks, at the current asset set |
|---|---|---|
| Download | 2.8 to 4.5 MB per look (about 0.9 to 1.8 MB of it textures, 0.4 to 1.5 MB animation) | about 36 MB for twelve different looks, once per session |
| Triangles drawn | 29k to 55k per character | about 400k |
| Draw calls | 7 to 12 per character (one per material) | about 110 |
| Textures (GPU, uncompressed RGBA with mip levels) | 7 to 9 at 512 px, about 10 MB per look | about 120 MB |
| Bones | 52 per character | twelve skeletons updated per frame |

At the Low graphics tier the existing crowd loads **no** models and uses procedural figures; remote players still need a model per distinct look, so Low needs its own, much cheaper path. Mobile visitors are unaffected: the device gate keeps every game script and model from phones.

**Recommended budgets for player characters (all to be confirmed by a frame-time test on a real PC and the ROG Ally):**

| Budget | High | Low |
|---|---|---|
| Triangles per character | 20,000 or fewer (body about 8,000 to 10,000, hair 1,000 to 4,000, outfit 3,000 to 6,000, shoes about 2,000) | 6,000 to 8,000 |
| Draw calls per character | 8 or fewer (merge face parts and hair into one) | 4 or fewer |
| Textures per character | 5 at 512 px | 3 at 256 px or compressed |
| Distinct looks loaded at once | 12 (room cap) | 6 full characters, the rest simplified |
| Animation | one shared clip library per base body (about 1.5 MB), not per look | same |

The body is the lever: at 15,000 to 20,000 triangles it is far heavier than its contribution to the look. Decimating weighted skinned meshes carries risk at joints, so the new bases must be built or re-exported at the budget and tested in motion.

## 10. Findings that change the plan

1. **A creator kit does not exist yet, but its ingredients do.** The pipeline already composes body, hair, outfit, shoes and accessories as separate meshes on one skeleton; they are merged into one file at build time.
2. **Parts are fitted per body.** Hair and clothes must be re-exported against a *fixed* standard male and female base, or they will clip or float on other bodies.
3. **No facial customization is possible** with these models (no morphs, no face bones): offer skin, eye, eyebrow and hair choices only.
4. **Colour needs neutral masters.** Hair and clothing textures are already coloured; runtime tinting works well only on neutral (greyscale) textures.
5. **Animations are duplicated and incomplete:** no run, hug or turn exists in any built file, and the player-sized clip set is complete in only one file.
6. **Body heights are inconsistent.** The bodies are built with different height settings: in game the current female player look (`district-resident`) stands about 1.33 m and the male (`district-smuggler`) about 1.96 m (measured earlier against the avatar preview), and the 22 files span roughly 1.3 to 2.0 m. Standard bases need chosen, consistent heights.
7. **Licence gaps** (Suits 02, the heroine suit, Rokoko and Mixamo redistribution) must close before any of those items enter a public catalog.
8. **Nothing here touches the multiplayer authentication or the trading security model.** The appearance would be a validated id record next to the existing character record.
