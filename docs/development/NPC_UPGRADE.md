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

- Six bases from the street figures: casual woman (#26), night-shift woman (#1), mercenary (#11); casual man (#27), office man (#2), netrunner (#10). Each comes in three outfits (as made and two colour versions) and takes the eight clothing colours (on the clothes only, in the shader). A street figure is one mesh: its hair, shoes and details are its own, so hairstyle, hair colour and the extras/cyber gear are not offered on them (the creator says so). Height stays standard per body.
- The 11 old looks are `retired` (never offered) but still valid. `character-appearance.js migrate()` moves a player's saved retired look to its `replacedBy` (same body, keeping the clothing colour) when it is loaded (local save, server copy), when the hub shows it (`tools/district-hub/protocol.cjs look()`) and when another player's look arrives (`remote-players.js`). Stored records are never rewritten. `void_runner_api.py clean_appearance` still accepts the old looks and enforces the street-look rules; `migrate_appearance` mirrors the rule for server tools. The campaign save has no appearance field: `campaign.js restore()` and `clean_save()` needed no change. The old `{gender, model}` field keeps its two presets.

## Not done / not verified

- Off-world crowds (`vesper-*`, `order-*`, `communion-*` in their own systems, `meridian-bartender`): not reachable without a ship; left on the old looks.
- The Corporate District scene has no ambient crowd to add office workers to (its people are the Function's robots).
- NULL's interior is the licensed club model (private pack): its crowd list was changed but not seen in a browser here.
- No hair colour or hairstyle on the new creator bases; no separate shoes/outfits (whole figures).
- Real GPU / ROG Ally frame rates; VR.
