# Character creator and wardrobe (first version)

Status: built on branch `claude/character-creator` (from `codex/conversations-character-foundation` at `d950212`). Nothing is merged, deployed or turned on in production.

## What works today (tested)

| Feature | Real or preset? |
|---|---|
| Male and female base bodies, standard heights (male 1.78 m, female 1.66 m) | Real. One uniform scale per body so the top of the head reaches the standard height. No stretching. Heights live in `void-runner/character-catalog.json` (`bases`). |
| Outfits: 4 male (Smuggler, Netrunner, Worker, Trader), 3 female (Resident, Neon, Fixer) | **Preset-based, not interchangeable.** Each outfit is a whole existing character file with its own shoes. |
| Shoes | **Not selectable.** Each outfit has its own pair. The catalog lists the 5 shoe styles as `needs-export`. |
| Hairstyles: all 9 (short01-04, bob01-02, braid01, long01, ponytail01) + original + none | **Real.** Each hairstyle is cut out of the existing CC0 file it came from (`tools/assets/extract-hair-parts.cjs`) and re-fitted onto the chosen body's head at runtime (`character-fit.js`). All 9 pass the fit check on all 13 bodies tested. A hat hides hairstyles that would clip through it. |
| Hair colours: 8 (5 natural, 3 cyberpunk) | Real (tint on a brightness-normalised copy of the hair texture). |
| Clothing colours: 8 + original | Real, on the outfit mesh only. Skin, eyes, shoes and hair are never tinted. Dark outfits stay fairly dark. |
| Accessories (hat, eyewear, mask, collar) on/off | Real, only those the outfit already has. |
| Creator screen (rotating real-character preview in the pod room, keyboard, mouse, gamepad, confirm/cancel) | Real. Never downloaded on phones (scripts are inert until the device gate releases them). |
| First-time creation | Offered once, when a new campaign leaves the pod and no look is saved. Players with an existing character are never asked. |
| Wardrobe station | A panel on the south wall of the Sleeping Pod room, east of the music screen (`district-wardrobe`). Free, unlimited. Does not touch location, inventory, credits or missions. |
| Saving | Local (`void-runner-appearance:<account id or guest>`). Old `{gender, model}` characters map to `district-smuggler` / `district-resident` unchanged. |
| Server | `clean_appearance()` in `void_runner_api.py` validates ids against the same catalog. `POST /character/appearance` exists but answers 404 unless `VOID_APPEARANCE_ENABLED=true` (off by default). `GET /character` returns `appearance` when one is saved. |
| Multiplayer | The hub re-validates the appearance, sends it with each player, and handles `refresh` (wardrobe change, once per 2 s, same account only). Remote avatars are built from it; legacy players still use the plain model. Hub rules are bundled in `tools/district-hub/appearance/` (byte-identical copies, checked by a test: `node tools/assets/sync-hub-appearance.cjs` after changing the catalog). |

Cosmetics are separate from inventory and equipment and are not tradable: the creator code has no trade or loadout code and a test pins that.

## What is NOT modular yet (needs the owner's Blender + MPFB)

Each shipped character has its own body mesh with the skin under the clothes deleted, so outfits and shoes cannot be swapped. To make them swappable, export from MPFB 2.0.18 (MakeHuman CC0 system assets only), one standard body per sex, on the same 52-joint `mixamorig:` skeleton:

1. `base-male.glb` and `base-female.glb`: complete body (nothing deleted), head, eyes, brows, lashes, no clothes, with the standard heights above.
2. One file per outfit, fitted to that body, same skeleton: male_casualsuit01, 03, 05, male_worksuit01, male_elegantsuit01; female_sportsuit01, female_elegantsuit01.
3. One file per shoe style: shoes01 to shoes05 for each sex.
4. Texture size 512, white/neutral base colours where possible so tinting works; no animations in the part files.
5. Run `node tools/assets/analyze-character-models.cjs` on them and add the results to `tests/character-assets.test.cjs`.

Until then the catalog's `lockedOptions` list says so and the creator does not offer them.

## Performance (measured, software rendering, so counts only)

| Case | Triangles | Draw calls |
|---|---|---|
| One outfit with its own hair | 28,800 to 39,700 | 8 to 10 |
| Same with a swapped hairstyle (bob01, the heaviest, 8,474 tris) | about 34,000 to 35,000 | 7 |
| 4 / 8 / 12 characters | about 131k / 268k / 391k | 35 / 69 / 105 |

The targets in the brief (about 20,000 triangles and 8 draw calls on High; 6,000 to 8,000 and 4 on Low) are **not met**: these are the existing complete character files, and Low uses the same models. They are the same cost as the District's current NPCs, but a full 12-player room would be heavy on weak GPUs. Real savings need decimated or merged models made in Blender (lower-triangle LOD for Low, merged body+outfit meshes). This was not faked.

## Needs the owner's approval before production

- Turn on `VOID_APPEARANCE_ENABLED` on the Render API (then players' looks reach the hub through `/character`).
- Redeploy the hub from a reviewed branch (new `refresh` message, appearance in views). Do not redeploy it from this branch without review.
- A new Firestore field `appearance` on the existing `vr_players` documents (no new database).
- Merge to `main` (publishes the site). Licence ledger: derived hair parts are listed in `docs/VOID_RUNNER_ASSET_LICENSES.md`.

## Tests

`npm test` (catalog, fit, hub, trading, assets); `python3 -m unittest tests.test_character_appearance`; browser (software GL, local server on 5187): `tests/character-assembler-browser.cjs`, `character-creator-browser.cjs`, `character-remote-browser.cjs`, `character-performance-browser.cjs`. The Render-hub appearance test is in `tests/district-hub-prod-ws.cjs`.
