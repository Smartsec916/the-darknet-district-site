# NPC and character-creator upgrade (18 Nov 2026)

The owner approved 26 concept pictures for new street people and character-creator bases (the brief: `npc-upgrade-brief.md`, "Owner's changes"). #25 (Zane, the male VR companion) was done separately; #18 (the monk) is covered by the three monk figures. Concepts: `npc-upgrade/concepts-contact-sheet.jpg`. How they were made, credits and task ids: `MESHY_CHARACTERS.md`. Rights: `docs/VOID_RUNNER_ASSET_LICENSES.md`.

## The figures

25 files in `void-runner/assets/models/crowd/` (Meshy image to 3D, remesh 30k, auto-rig; the game's clips retargeted): one skinned mesh and one material each on the 24-joint skeleton (Mixamo names), 30,400 to 31,100 triangles, 3.1 to 4.7 MB with 2048 JPEG maps (93 MB for all 25).

| # | Id | Who | Where they are |
|---|---|---|---|
| 1 | `npc-office-f` | night-shift office worker (F) | mixed; many more toward the Function Gate |
| 2 | `npc-office-m` | night-shift office worker (M) | mixed; toward the Function Gate; also drinks |
| 3 | `npc-security` | corporate security contractor | toward the Function Gate; the private gates' guards; Cade in the VR shooter booth |
| 4 | `npc-executive` | corporate executive | toward the Function Gate |
| 5 | `npc-cook-old` | old Japanese street cook | at the food shopfronts |
| 6 | `npc-courier` | delivery courier | mixed; District crew; Outskirts |
| 7 | `npc-cook-f` | street cook | at the food shopfronts |
| 8 | `npc-club-f` | club-goer (F) | round NULL; NULL's crowd; Lumi in the VR social booth |
| 9 | `npc-club-m` | club-goer (M) | round NULL; NULL's crowd |
| 10 | `npc-hacker` | street hacker | mixed; club; District crew; creator base |
| 11 | `npc-merc` | augmented mercenary | mixed; District crew; creator base |
| 12 | `npc-veteran` | ex-military veteran | mixed; Outskirts |
| 13 | `npc-fixer` | fixer | mixed; District crew |
| 14 | `npc-vendor` | street vendor | one spot in Old Town and Far South |
| 15 | `npc-student` | student (adult) | mixed; club; District crew |
| 16 | `npc-tourist` | off-world tourist | mixed |
| 17 | `npc-medic` | clinic medic | mixed |
| 19 | `npc-enforcer` | gang enforcer | mixed; club; District crew |
| 20 | `npc-lookout` | gang lookout | mixed; club; District crew |
| 21 | `npc-outskirts-f` | Outskirts resident (F) | the Outskirts only |
| 22 | `npc-outskirts-m` | Outskirts resident (M) | the Outskirts only |
| 23 | `npc-elder-f` | elderly resident | mixed; Outskirts |
| 24 | `npc-busker` | busker | one spot in Old Town and on the Avenue |
| 26 | `npc-casual-f` | casual woman | mixed; creator base |
| 27 | `npc-casual-m` | casual man | mixed; creator base |

Clips (every figure): idle, talk, walk, look, watch, sit, smoke, drink, laugh, shrug, sit-enter, sit-exit, sit-talk, interact, drunk-walk, drunk-idle, drunk-sway, dance; `npc-security` adds the six VR shooter clips, `npc-club-f` pickup, menu and menu-tap. The V1 device poses (`npc-device.js`) are procedural and work on these skeletons unchanged.

## In the game

- **Registry** (`crowd.js`): `street` (number, sex, roles), `pools` per role, `replaced` / `swap()` (old anonymous look to new figure), `weightAt` / `orderAt` (who stands where), `streetFigures(quarter, quality)` (which files a quarter downloads), `dress()` (the variant).
- **Old ids** are kept (files, clip lists, catalog looks): the off-world places, Milked, and the named characters built on them (Juno Vex on `fixer-01`, Halden Reyes on `vesper-trader`, Admin's and Iris's fallbacks) are unchanged. Mapping: district-resident → casual-f, regular-01 → office-m, ncz-neon → club-f, fixer-01 → executive, runner-02 → courier, hacker-01 → hacker, outlaw-01 → enforcer, district-smuggler → fixer, cyborg-01 → merc, communion-tech → medic, vr-player-a → security (Cade, `district-people.js figure`), vr-player-b → club-f (Lumi; vr-player-b stays Milked studio 4's dancer).
- **Placement**: walkers (`ncz-nightlife.js`) take their own weighted order of figures from where they start (corporate types up to about 5x more likely within ~60 m of the Function Gate, the club-goers within ~30 m of NULL's door, the Outskirts' own people only in the Outskirts), and for the first 40 s wait for one of their own two (otherwise everyone would wear the first file to arrive). Cooks (`config.cooks` Low 1 / Medium 2 / High 3) at the window of a food shopfront (places.js SHOPFRONTS: noodles, ramen, tacos, tea, chai, night market) facing the street, beside the V1 work's diners; the vendor and the busker at one clear wall spot each (`vendorIn`, `buskerIn`). Monks are dealt as before (monkShare toward the East Gate). Counts per tier unchanged (the cooks, vendor and busker are added standers).
- **Other users of the crowd**: NULL's crowd (`ncz-nightclub.js` CAST), the alley (`ncz-alley.js`), the Outskirts (`ncz-outskirts-life.js`: the Outskirts' people first, the poor ones in the `worn` variant instead of the old per-piece re-tint), the private gates' guards (`ncz-gates.js`: the contractor in navy), staged street arguments (`npc-device.js`), the District's crew (`casts.district`), the VR booth players (`neochinatown.js`).
- **Variants** (`npc-variants.js`): a material plugin re-colours the clothes (hue turn, saturation, brightness, tint) and leaves the skin, found per pixel by its colour. One material per figure and variant sharing the figure's textures: no texture memory, no extra draw calls. 3 to 4 per figure; a person's variant is fixed by their id.
- **Downloads** per quarter and quality: Low 8, Medium 14, High all of the quarter's figures (`STREET_CAP`), each quarter's own kinds first (`QUARTER_KINDS`, `SPOTS`), in the background like the monks.

## The character creator

- **The two casual bases wear a black tee and black jeans** (the owner, 18 Nov 2026: "Can you make grey and jeans black?"): `tools/assets/street/recolor_casual.py` re-colours only the grey tee and the blue jeans in their baked maps (colour-range masks; the UV islands are scattered, so no region mask), to a charcoal black that keeps folds, seams and the denim weave; jacket, trainers, skin and hair untouched. The originals are kept as `npc-casual-f-classic.jpg` / `npc-casual-m-classic.jpg` and offered as the outfit CASUAL · GREY TEE, BLUE JEANS (a variant with its own map, loaded only when worn). Before and after: `npc-upgrade/casual-bases-before-after.jpg` (neutral light), `npc-upgrade/creator-casual-before-after.jpg` (in the creator).
- Six bases from the street figures: casual woman (#26), night-shift woman (#1), mercenary (#11); casual man (#27), office man (#2), netrunner (#10). Each comes in three outfits (as made and two colour versions) and takes the eight clothing colours (on the clothes only, in the shader). A street figure is one mesh: its hair, shoes and details are its own, so hairstyle, hair colour and the extras/cyber gear are not offered on them (the creator says so). Height stays standard per body.
- The 11 old looks are `retired` (never offered) but still valid. `character-appearance.js migrate()` moves a player's saved retired look to its `replacedBy` (same body, keeping the clothing colour) when it is loaded (local save, server copy, the old `{gender, model}` record) and when another player's look arrives (`remote-players.js`). The multiplayer hub relays every look exactly as saved, so players still on the old build keep seeing and sending the old looks (its rules and catalog copies in `tools/district-hub/appearance/` must be redeployed before it accepts the new looks). Stored records are never rewritten. `void_runner_api.py clean_appearance` still accepts the old looks and enforces the street-look rules; `migrate_appearance` mirrors the rule for server tools. The campaign save has no appearance field: `campaign.js restore()` and `clean_save()` needed no change. The old `{gender, model}` field keeps its two presets.

## The cyberpunk figures (19 Nov 2026, build `2026-11-19-cyber-characters-1`)

The owner: the NPCs and player characters "look very normal for a cyberpunk game"; more options, not blocky. Six more figures with visible cybernetics and layered techwear (Blade Runner 2049 / Altered Carbon, grounded), made the same way (`MESHY_CHARACTERS.md`: concepts, credits, task ids). The netrunner with an interface rig was left out (the owner); cybernetic arms are slim and human-shaped (his note). Concepts: `cyber-characters/concepts-sheet.jpg`.

| # | Id | Who | Where they are | Creator preset |
|---|---|---|---|---|
| 28 | `npc-cyber-samurai` | street samurai (M, 40s, Japanese): slim chrome-and-gunmetal left arm, armoured high-collar jacket, red sash, sheathed blade | mixed; round NULL; District crew; NULL's crowd; the alley | STREET SAMURAI (· DUSK, · NAVY) |
| 29 | `npc-cyber-exec` | chrome executive (F, 40s, Scandinavian): gunmetal metallic suit, chrome jaw and neck plating, data monocle | corporate only: toward the Function Gate | CHROME EXECUTIVE (· WINE, · NAVY) |
| 30 | `npc-cyber-respirator` | street runner (M, late 20s, Latino): twin-filter respirator, hoodie under a reflective-taped plate carrier | mixed; District crew role; the Outskirts; the alley | RESPIRATOR RUNNER (· OLIVE, · NAVY) |
| 31 | `npc-cyber-pvc` | nightlife courier (F, late 20s, Korean): clear iridescent PVC trench, cheek light dots, visor, chrome hand | mixed; round NULL; NULL's crowd | CLEAR PVC (· WINE, · NAVY) |
| 32 | `npc-cyber-bouncer` | club bouncer (M, 50s, Samoan, heavy build): slim chrome forearms, skull ports, padded ballistic vest | round NULL (not a walker elsewhere); District crew; NULL's crowd | CHROME BOUNCER (· OLIVE, · DUSK) |
| 33 | `npc-cyber-courier` | armoured courier (F, 30s, Black): cropped armoured jacket, ocular implant, exoskeleton leg brace | mixed; District crew role | EXO COURIER (· NAVY, · WINE) |

- **Files:** `void-runner/assets/models/crowd/npc-cyber-*.glb`, 3.4 to 4.1 MB (23 MB for all six), 30,748 to 31,005 triangles, one skinned mesh and one material on the 24-joint skeleton (Mixamo names), maps colour 2048, normal and roughness/metal 1024 (JPEG); the 18 street clips (the residents' set and the crowd's own walk, sit, drunk and dance clips, `characters/npc-cyber-*.json`). The V1 device poses (`npc-device.js`) are procedural and work on them unchanged.
- **Registry** (`crowd.js` `street`, `cyber: true`): placed by the same weights as the others. They come first in each quarter's mixed fill and after the specialists in its own kinds, so Medium (14 files per quarter) still shows them; High now loads all 31 figures of a quarter (`STREET_CAP` high/ultra 25 -> 31; Low and Medium unchanged; counts of people per tier unchanged). `casts.district` adds the bouncer and the samurai; NULL's crowd (`ncz-nightclub.js`) the PVC courier, the samurai and the bouncer; the alley the respirator runner and the samurai; the Outskirts the respirator runner.
- **Variants** (`npc-variants.js`): cool or dark tints only (dusk, navy, wine, olive), never `warm` (it would turn chrome to brass).
- **NPCs tab, giver creator, appearance editor:** they list `crowd.js street` / `clips`, so the six appear there as street figures with no other change (`npc-editor.js`, `npc-made.js`); `void_runner_admin_inventory.json` and `npc-clip-index.json` regenerated.
- **Player looks:** 18 catalog looks `street-cyber-*` (`"group": "cyber"`) in `character-catalog.json` (+ the generated `.js`), shown in their own **CYBERPUNK PRESETS** row of the creator (`character-creator.js`; `character-appearance.js options()` carries the group). They are street looks: whole figures, their own hair, no hair colour or extras; the eight clothing colours re-colour the clothes in the shader. The server (`void_runner_api.py clean_appearance`) validates from the same catalog file, so it accepts them with no code change. Old looks and saves are untouched.
- **Multiplayer hub:** `tools/district-hub/appearance/character-catalog.json` and `character-appearance.js` are copies (a test keeps them equal); `protocol.cjs RENDERABLE` follows the catalog. **The hub must be synced to branch `claude/character-creator` and redeployed on Render** before it relays the new looks; until then it relays them unchanged but shows other players the default model for them.
- **Tests:** `tests/npc-upgrade.test.cjs` (31 figures, the creator's 36 looks, and a new test for the six: placement, tints, creator, hub, server catalog), `tests/test_character_appearance.py`; browser `tests/cyber-characters-browser.cjs` (creator presets, the Old Town or Avenue street, a line-up in idle and walk, close-ups idle / walk / V1 / face). Screenshots: `cyber-characters/`.

## Not done / not verified

- Off-world crowds (`vesper-*`, `order-*`, `communion-*` in their own systems, `meridian-bartender`): not reachable without a ship; left on the old looks.
- The Corporate District scene has no ambient crowd to add office workers to (its people are the Function's robots).
- NULL's interior is the licensed club model (private pack): its crowd list was changed but not seen in a browser here.
- No hair colour or hairstyle on the new creator bases; no separate shoes/outfits (whole figures).
- Real GPU / ROG Ally frame rates; VR.
