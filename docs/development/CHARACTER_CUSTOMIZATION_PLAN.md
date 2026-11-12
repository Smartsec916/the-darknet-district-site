# Player character creator: implementation plan

> **Status 2026-11-12:** A preset creator is already live (before EXIT POD: hair and outfit presets). This document is the unfinished part-assembler design. "Nothing here is built" below means that assembler, not the live creator. The six decisions in §11 are still open. Companion looks are a different system (`void-runner/vr-companions.js`). Current handoff: `docs/development/AI_HANDOFF.md`.

Written 2026-11-05. **Plan for the part assembler. Every remaining stage needs the owner's go-ahead.** The evidence for every statement about assets is in `CHARACTER_MODEL_AUDIT.md`. This plan does not change the multiplayer sign-in checks or the trading rules; it only adds an appearance record next to the existing character record.

## 1. What the creator can and cannot be

**Can be built from what the project already makes** (MakeHuman/MPFB builds, CC0): a male and a female base body; a choice of about 9 hairstyles; hair colour; a choice of outfits (5 male and 2 female are in the repository today, more exist in the owner's MPFB library but are not inventoried); 5 shoe styles; a few accessories (shades, visor, mask, headset, fedora); several skin tones; outfit colour variations.

**Cannot be offered with these models:** facial sliders, expressions, body morphing in the game (the models have no morph targets and no face bones). Different body shapes or head shapes would each be another pre-built base body, and every outfit and hairstyle would have to be fitted to it again. The plan therefore promises **presets and swaps, not sliders**.

**Cannot be offered from the Tesana, CGTrader or DAZ models:** licence and technical reasons in the audit (sections 7 and 8).

## 2. Recommended approach: standard bases, fitted parts, a data catalog

Do **not** build a full character file for every outfit and hairstyle combination: 2 bases x 9 hair x 8 outfits x 5 shoes x colours is thousands of files. Do **not** put outfits on a different skeleton either.

1. **Two new standard base bodies** (`base-m`, `base-f`): built once on the owner's MPFB setup with fixed, sensible heights (the current looks are 1.33 m and 1.96 m), the 52-joint `mixamorig:` skeleton the game already uses, underwear baked in, a body at about 8,000 to 10,000 triangles, one skin texture per tone.
2. **Parts as separate small files, fitted to those bases:** each hairstyle, outfit, pair of shoes and accessory exported as its own `.glb` that carries the **same 52 joints in the same order** and its own small texture. The audit verified that the 22 current characters already have identical joint names and order, and that these parts are separate meshes inside them; the work is re-exporting them against the fixed bases (hair and clothes are fitted per body, so each part is exported once for `base-m` and once for `base-f`).
3. **Runtime assembly in the browser** (`character-assembler.js`, new): load the base once, load each chosen part (cached across all players), attach the part meshes to the base's skeleton, give each part a material built from its texture and the chosen colour. Twelve players then share the same loaded parts.
4. **Tinting** from neutral (greyscale) master textures for hair and for the main colour of outfits, applied as a material colour (cheap, no new files per colour). Skin tones are separate textures. Accent colours or two-tone outfits can use a small mask texture later.
5. **One shared animation library per base** (`anim-m.glb`, `anim-f.glb`, about 1.5 MB each, loaded once) instead of clips repeated inside every character file. The runtime already clones animation groups per instance; sharing means retargeting by bone name on load. **This is a spike before it is a promise** (see Stage 0).
6. **A catalog file** (`void-runner/character-catalog.json`, new, the single source of truth) listing every base, skin, hair, colour, outfit, shoe and accessory by **id**, with its file, triangle count, which base it fits, which graphics tiers include it, and its **licence record**.

### Why not a merged mesh per player?
Merging parts into one mesh with a composed texture atlas would cut draw calls to about 3 per character, but costs build time on every load and loses the part cache. It is a **later optimisation** if frame time on the owner's PC or the ROG Ally demands it.

## 3. How the appearance is stored and shared (multiplayer-safe)

The appearance is a small record of **ids**, never file paths:

```json
{"v":1,"base":"m","skin":"s3","hair":{"id":"short02","color":"c4"},"outfit":{"id":"casual03","color":"o2"},"shoes":"shoes03","accessories":["shades0"]}
```

- **Saved to the account** in the existing character record (`vr_players/{hash(uid)}`, field `character`), next to `gender`/`model`, validated **on the server** against the same catalog (`void_runner_api.py`): every id must exist, fit the chosen base, be marked licence-verified, and be allowed for that account. Unknown or extra fields are refused. A legacy record (`{gender, model}`) maps to a preset so every saved character keeps working.
- **One character per account is preserved.** The character identity stays created-once; the appearance becomes editable later through a **new, rate-limited, authenticated endpoint** (non-anonymous accounts only, a revision counter, refusal of anything off-catalog), so changing clothes never creates a second character. (This is a server change and needs approval when the time comes.)
- **Single-player and multiplayer load the same record:** the game reads it from `/api/void-runner/character`; the hub already receives the character by forwarding the player's own token, so it carries the appearance **ids** to other players. The hub re-validates ids against its own copy of the catalog and drops anything unknown. Clients reconstruct the look from their **local catalog** and files; they never accept a model path from a message. A test must keep the server, hub and client catalogs identical.
- **Message size:** the record is about 150 bytes, well inside the hub's limits; a peer's look is sent once in `join` or `welcome`, not with every position update.
- **Guests** (anonymous accounts) cannot save a character today and keep the default look for others; they may preview locally.
- **The administrator** keeps the special Admin character; it is outside the creator.

## 4. Performance budgets and tiers

| Budget | High | Low |
|---|---|---|
| Triangles per character | 20,000 or fewer | 6,000 to 8,000 (a decimated body, shorter hair, a simpler outfit) |
| Draw calls per character | 8 or fewer | 4 or fewer |
| Textures per character | 5 at 512 px | 3 at 256 px |
| Loaded parts | shared by id across all players in the room | same |
| Players drawn in full | 12 (the room cap) | 6, the rest simplified |
| Download for a first-time visitor | base 1 to 2 MB, animation library about 1.5 MB, each part 50 to 400 KB | smaller variants |

Texture compression (the project already has KTX2 tooling: `tools/assets/ktx2-glb.mjs`, `pack-variant-textures.cjs`) should be used for the shipped parts. All numbers are targets to be confirmed by frame-time measurement on a real PC and the ROG Ally (software rendering here cannot answer it). Mobile visitors are unaffected: the device gate keeps every game file and model away from phones; a future mobile social page should show a small 2D portrait, never the 3D files.

## 5. Staged implementation (each stage ends with something testable)

**Stage 0: spikes (no game change, a few days; they decide the rest).**
1. Assemble a base plus separately exported hair and outfit on one skeleton in Babylon; check that parts follow every animation without a gap, and that two players sharing a part do not interfere.
2. Tinting quality: tint a neutral hair texture and an outfit texture; accept or ask for two-tone masks.
3. Decimate a body to the budget and look at the shoulders, hips and knees in motion.
4. **Inventory the owner's MPFB library** (hair, clothing, skins, "Suits 02") and read the licence text of each pack and each item; record in `docs/VOID_RUNNER_ASSET_LICENSES.md`.
5. Retarget the walk, sit and dance clips onto two bases from one shared library and compare with the embedded originals.
6. Measure frame time with twelve characters on the owner's PC and the ROG Ally at Low and High.

**Stage 1: standard bases (assets, the owner's Blender).** Build `base-m` and `base-f`; skins (aim for six tones per sex); export the **existing 9 hairstyles, the 7 existing clothing items that are licence-clear, 5 shoes and the accessories** fitted to each base. Needs: the owner's MPFB setup and time. **New assets needed:** more female outfits (only 2 exist), more streetwear and corporate and rebellious District styles, and any outfit from a pack whose licence is not yet verified.

**Stage 2: catalog and ids (code, no visuals).** `character-catalog.json`, validators in JavaScript and Python, the legacy-record mapping, a test that fails if any catalog entry lacks a verified licence record or a file, and a test that server, hub and client read the same ids. Works with the existing two looks as the first catalog entries.

**Stage 3: the assembler (code).** `character-assembler.js`, used first by the existing remote-player drawing and then by the preview; part and material caches; the Low and High tiers; disposal; tests for budgets (triangles, draw calls) and for 12 players.

**Stage 4: creator and preview (code).** A creator screen (replacing the plain two-look choice in the account panel): choose male or female base; hairstyle and colour; outfit and colour; shoes and accessories; turntable preview with the idle animation; confirm or cancel; works with a keyboard and a gamepad; in the District's cyberpunk interface style. Guests can preview but not save.

**Stage 5: save to the account (server).** Appearance field validation; creation stores it; the later-change endpoint with revision and rate limit; migration of existing characters; tests against the Firebase emulators (as `tests/test_character_emulator.py` does). Needs approval because it changes the API.

**Stage 6: show it in the game and in multiplayer.** The hub forwards appearance ids; `remote-players.js` builds each other player from them; single-player draws the local character where a body is needed (a mirror, the pod). Name tags and every limit stay as they are.

**Stage 7: changing appearance later.** A **wardrobe mirror** in the Sleeping Pod room (where a player already wakes) and, later, a clothing store. The location is an **owner decision** (the hallway floor plan and pod allocation are still open and are not invented here). Different outfits for different places (a corporate outfit for the corporate district, streetwear for the District) can be saved as outfit slots later.

**Stage 8: growing the catalog.** Adding an item is: export the part for each base, add its entry with a licence record, run the catalog test. New male and female models are new bases only if the owner wants a new body shape.

## 6. What can be done with existing assets and what needs new ones

| Feature | With existing assets | Needs new assets or decisions |
|---|---|---|
| Male or female base | Yes, after Stage 1 (rebuild of existing MakeHuman figures at standard height and budget) | Standard height and body decisions by the owner |
| Hairstyles | 9 styles, both sexes | More styles, curls and braids need new MakeHuman or other CC0 hair; hair physics is not supported |
| Hair colour | Tint of neutral textures | Neutral master textures (a build step) |
| Skin tone | 13 skin textures exist across the crowd (light and dark families, two ages, two sexes) | A planned set of six tones per sex, built once |
| Facial appearance | Eyebrows and eyelashes are separate meshes (swap or tint); eye colour by texture | Facial sliders and expression: **not possible** with these models |
| Clothing | 5 male and 2 female outfits, 5 shoes, plus accessories | More female outfits and a wider cyberpunk range; the Suits 02 and heroine suit **after licence verification** |
| Outfit colour | Tint of the main colour | Masks for two-tone outfits |
| Outfit per location | Yes (data) | The places and rules (owner) |
| Animations | idle, walk, sit, dance, talk, wave, laugh exist (per file) | **run, jog, hug, turn in place, jump and crouch are in no built file**; a shared library per base |
| Optional accessories | shades, visor, mask, headset, fedora | More items would be built with the existing script |
| Preview | Yes (Stage 4 code only) | n/a |

## 7. Licensing gates (no unverified asset is imported)

1. Only items whose licence is **recorded as verified** may have `verified: true` in the catalog; a test refuses a catalog item without a licence record.
2. First tranche: the CC0 MakeHuman hair, standard clothing, shoes, skins and our own accessories; walk, sit and similar clips from the Quaternius library.
3. Held until verified: Suits 02 outfits, `culturalibre_heroine_suit_2`, and the Rokoko and Mixamo clips for **redistribution inside a public web game**.
4. Never: the Tesana characters, the CGTrader companion models and the DAZ and waitress files as player material.
5. Possession of a ZIP is never treated as permission; the licence text (or its absence) is written into the ledger first.

## 8. Missing for a complete creator (the list to hand to the asset builder)

1. Standard male and female base bodies (a chosen height, a budgeted body, underwear, several skin tones each).
2. Every hairstyle, outfit, shoes and accessory re-exported as fitted separate parts for each base, with neutral textures where tinting is wanted.
3. More outfits, especially female, and the cyberpunk streetwear, corporate and rebellious District ranges, with licence records.
4. A shared animation library per base: idle, walk, run, turn, sit (enter, loop, exit), wave, talk, laugh, dance, hug, emotes; **run, hug, turn and the rest need new or newly verified clips**.
5. A character catalog, the assembler, the creator screen, server validation and the appearance field.
6. A preview scene and the in-world wardrobe location (an owner decision).
7. Licence records for every item and pack.

## 9. Order I would implement in (safest first, each step keeps the game working)

1. Stage 0 spikes and the licence inventory (decide before building).
2. Stage 2 catalog and validators with the two existing looks (invisible to players, easy to test).
3. Stage 1 standard bases and the first small part set (the owner's Blender session).
4. Stage 3 assembler used by the remote-player code at High, then Low.
5. Stage 4 creator and preview.
6. Stage 5 server save and the later-change endpoint (with approval).
7. Stage 6 multiplayer and Stage 7 wardrobe.
8. Stage 8 catalog growth.

An **interim option** with existing assets only, if the owner wants something sooner: a preset picker offering the existing male and female looks (for example `district-smuggler`, `hacker-01`, `regular-01`, `vr-player-a`; `district-resident`, `ncz-neon`, `vesper-pilot`, `vr-player-b`). It reuses the current ids, but players would resemble the crowd NPCs, each look is 29,000 to 40,000 triangles and about 3 MB, and it adds nothing to the final creator, so it is **not recommended** over starting with the spikes.

## 10. Risks

| Risk | Mitigation |
|---|---|
| Parts do not follow the skeleton cleanly | Stage 0 spike 1 before any asset work |
| Clothes clip or float on a body they were not fitted to | A fixed base per sex; one export per part per base; no sharing across bases |
| Tinting looks muddy | Spike 2; neutral masters; two-tone masks if needed |
| Frame cost of twelve characters | Budgets, tiers, shared parts, optional atlas merge, measured on the ROG Ally |
| Licence of Suits 02, Rokoko or Mixamo redistribution | Verification gate; first tranche uses only verified items |
| Unsuitable combinations | Underwear baked into the base; catalog rules per item; the open age and chat policy decisions (`AI_ROADMAP.md`) stay with the owner |
| Existing characters break | Legacy mapping and a test that every stored `{gender, model}` still resolves |

## 11. Decisions needed from the owner before Stage 1

1. Heights and body build of the two standard bases.
2. Whether the first creator may use only the already-verified CC0 items (smaller but clean) or waits for the Suits 02 and other licence checks.
3. Where players change clothes (pod mirror, store, both) and whether outfits can differ by location.
4. How many skin tones, hair colours and outfit colours for the first release.
5. Whether to buy or commission anything new (no new paid asset or service is assumed).
6. Whether the appearance may change freely later, with a cool-down, or only for a cost or at set places.
