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

## Persistence audit (second pass)

| Data | Where it lives today | Across browsers/devices? |
|---|---|---|
| The old character `{gender, model}` | Firestore `vr_players/<sha256(uid)>.character` via the game API (`/character`, one per account, already live) | Yes |
| The creator look | **This browser only** (`localStorage` `void-runner-appearance:<account id or guest>`) while the server feature is off | No |
| The creator look on the server | Firestore `vr_players/<sha256(uid)>.appearance` through `POST /character/appearance`, written by the same Admin-SDK API as everything else. **Off** (404) until `VOID_APPEARANCE_ENABLED=true` on the game API | Yes, once enabled |

How it works now (built and tested locally with the fake-Firestore API tests and hub tests; no emulator binary and no production service was touched): confirming in the creator saves locally and, if signed in with a permanent account that has a character, also posts to the API. The API returns the saved look in `GET /character` and `GET /account`; the game uses the server copy first (so a second browser shows the same look), then this browser's copy, then the look matching the old character. While the flag is off the post gets a 404 and is ignored. Guests and anonymous accounts stay local only. The hub reads the look from the API with the player's own token, so a player can only ever change their own look.

### Firebase Console / Render actions you would eventually need (none done)

1. **No Firestore rules change, no new collection, no new index, no new credentials.** `appearance` is one more field on the existing `vr_players` document, written by the existing Admin-SDK API (which bypasses rules; browsers stay denied). Please confirm in the Console that `vr_players` is deny-all for browsers (this has never been verified from the Console; see `FIREBASE_MULTIPLAYER_AUDIT.md`).
2. **Authentication > Settings > Authorized domains**: `thedarknetdistrict.com` and `www.thedarknetdistrict.com` must be listed (already needed for sign-in).
3. Render, game API service: add environment variable `VOID_APPEARANCE_ENABLED=true` (only when you approve a test). No secret.
4. Render: the hub service (`HUB_RENDER_SETTINGS.md`). No Firebase secret.
5. Optionally, for a safe rollout, set the variable only for the test and unset it afterwards: the hub then falls back to each player's original character.

## Performance work (second pass)

Safe, appearance-preserving changes made: remote characters hide eyebrows and eyelashes beyond 8 m (Low) / 14 m (High), with hysteresis. That removes 2 of about 9 draw calls and about 560 triangles per distant character. Nothing was decimated or replaced. Counts only; no frame-rate claim is made from software rendering.

Looked at and not done (needs the Blender/MPFB export or a visible change): merging body, outfit and shoes into one mesh (they are separate materials and textures: 7 to 10 draw calls cannot drop without an atlas), a lower-triangle Low model (the body alone is about 15,800 triangles, half the budget), and reducing 512 px textures (about 4 MB per character on the GPU).

### Extra asset checklist for a lighter Low tier (owner's Blender)

1. For each of the 7 looks (or each standard base once the modular export exists): a Low model at 6,000 to 8,000 triangles: body decimated with clothes and hair baked into the same mesh, one 512 or 256 px atlas, one material, eyes painted into the texture.
2. Same skeleton, same skin weights, same 52 joints and clip names (`idle`, `walk`, ...) so `VoidCrowd.animate` works unchanged.
3. Files named `<look>-low.glb` in `void-runner/assets/models/crowd/`; the assembler can then load them on the Low tier. Run `tools/assets/analyze-character-models.cjs` on them first.
4. Compare screenshots at the normal viewing distance before accepting any decimation.
