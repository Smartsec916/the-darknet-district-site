# VOID//RUNNER combat update

Review baseline: upstream `496391910f56965222184afd822c6ab78b0948eb` (main, downloaded 2026-09-19). Nothing has been pushed, merged, or deployed.

## Existing system audit

- `campaign.js`: fresh campaign, version 1/2 migration, credits/reputation, upgrades, loadout, contracts, progression and rewards. `content.js`: the twelve additional missions and equipment catalog.
- `game.js`: local storage (`void-runner-campaign-v1`), UI/input, reset, flight lifecycle, sound and legacy flight functions.
- `account.js`, `firebase-auth.js`, `void_runner_api.py`: Google/Firebase identity, explicit cloud save/load, separate server-verified purchase inventory and Stripe fulfillment. Purchases are not stored in campaign ownership fields.
- `expansion.js`: shields, premium/earned equipment, training, boss/relay/escort/salvage mechanics and navigation.
- `cockpit.js` and `cockpit-math.js`: active first-person simulation, enemy AI, swept projectile collision, camera, cockpit renderer. This overrides the older flight loop in `game.js`; changing that old loop alone would not fix active combat.
- `scenes.js`, `world.js`, `fleet.js`, `stations.css`, `art/`: dialogue, station interiors/exteriors, space environments and the fleet sprite atlas. `flight-physics.js` supplies the older flight steering helpers.

### Reset finding

The inspected reset handler already calls `C.fresh()` and saves 100 credits. No automatic cloud-load path was found. The reproducible defect is that it then enters dialogue without refreshing the HUD or clearing flight/mission/equipment-trial state. Previous credits remain visible until launch. The replacement reset transition clears those transient systems, saves a fresh campaign, and refreshes both HUDs immediately. Tests check actual state, local storage, reload, account inventory and an unchanged cloud snapshot. A separate backend credit-retention defect was not reproduced in this revision.

### Enemy fire finding

Enemies already acquire the player's relative position, obey cooldowns, spawn visible hostile projectiles, and use swept segment/sphere collision. Misses do not damage the player. The shield wrapper absorbs damage before hull; existing brief damage immunity and Ghost Drive immunity remain. Added tuning affects the active cockpit loop, including enemy accuracy, shield capacity and archetype-scaled hull. NORMAL preserves existing timing/damage. Escort shots use the same damage/speed settings.

## Balance and developer access

`void-runner/balance-data.js` is the single numeric schema: defaults, minimums and maximums. Its assignment contains JSON; the Python API parses that JSON without executing JavaScript. Keep that format. `balance.js` validates/applies it, with independent EASY/NORMAL/HARD presets. Edits select CUSTOM. Rates are shots/second; distances and speed use simulation units; turn rate is radians/second; lock radius is a fraction of the shorter viewport dimension; accuracy is 0–1. Enemy hull is the base raider value; existing class/tier ratios remain.

Available: playerHull, playerShield, shieldRechargeRate, shieldRechargeDelay, laserDamage, laserFireRate, laserProjectileSpeed, laserRange, missileDamage, missileSpeed, missileTurnRate, missileLockTime, missileLockRadius, missileCooldown, missileLifetime, missileRange, enemyHull, enemyShield, enemyLaserDamage, enemyFireRate, enemyAccuracy, enemyProjectileSpeed, collisionDamage, repairCost; plus hull/shield/damage/cooldown upgrade increments and premium laser/shield tuning. Repair cost defaults to zero; if enabled, arrival servicing charges whole credits, capped at the available balance, once per completed route.

After reviewing and deploying the backend yourself:

1. Keep the existing Firebase Admin credentials and `VOID_ACCOUNTS_ENABLED=true` setup.
2. Set server environment `VOID_ADMIN_UIDS=uid1,uid2` to exact Firebase Authentication UIDs. Empty/unset denies everyone. No email comparison or client-provided admin flag is trusted. Do not put credentials or this allowlist into frontend code.
3. Merge the `vr_config` deny rule into existing Firestore rules. Check for overlapping broad allow rules: Firestore allows access if any matching rule allows it. Browser clients must have no direct write access to this collection. The Admin SDK performs all writes.
4. Sign in. The developer button appears only after `/developer/balance` succeeds. Both GET and POST verify Firebase tokens (including revocation) and the server allowlist. POST validates all numeric fields, checks a transactional revision and records the updating UID/time. Ordinary accounts get 403; invalid/missing tokens get 401.
5. Open the panel, adjust numeric inputs or a preset, Preview Next Flight for local testing, or Save for shared persistent tuning. Save affects subsequent flights after clients fetch/reload the configuration; it does not mutate active fights. Reload Current Values resolves conflicts; Reset to Defaults fills NORMAL values and requires Preview/Save. The public GET `/balance` exposes tuning numbers only.

Opening the panel during flight pauses it. Debug is opt-in, session-only and removed on sign-out. No player-facing difficulty menu was added. The button is available even before the first delivery for an authorized developer.

This is a single-player browser game: source and local memory remain inspectable. The server protects authoritative persistent balance and purchase records; the panel cannot prevent someone modifying their own local simulation.

## Missiles

Modules: `targeting.js`, `missiles.js`, `combat.js`, `combat-effects.js`. A continuous 1.5-second lock defaults to a viewport-relative circle. Leaving it or switching targets resets acquisition. Right-click only launches in active flight with a valid lock, equipped/owned launcher, ammunition and no cooldown. Context menus are suppressed on the active flight canvas only. Touch has a separate missile button when equipped; primary touch fire remains intact.

Missiles launch from an offset ship hardpoint, rotate at a bounded angular rate, travel visibly, use swept collision, respect relay protection/enemy shields, burst on impact and expire by lifetime/range. An evasive target can escape. Default damage 15, speed 90, turn rate 1.2 rad/s, cooldown 2s, lifetime 6s, range 540.

`missileState` separates `ownsMissileLauncher`, `equipped`, `missilesLoaded`, `missileCapacity`, and `type`. Ordinary accounts receive no launcher. No missile product, price, store listing or purchase route was added. Authorized developers can start session-only missile training with 12 rounds; the backend permission is rechecked before entering. Training changes no campaign inventory, cloud save or purchased ownership. Sign-out and normal launches remove the test equipment.

Future production ownership must come from a server-verified inventory capability. Add a secondary equipment slot plus validated ammunition/capacity fields to both local migration and server save validation when reloads/purchases are introduced. Never infer launcher ownership from loaded rounds or a save's claimed ownership. Current test rounds deliberately do not persist or grant account ownership.

## Artwork

Kepler was the second station using basic canvas geometry. `art/station-kepler.png` is now a 1536×1024 RGBA raster, loaded by `world.js`; the previous renderer remains a loading/error fallback. Existing interiors, Meridian and Rusthaven are preserved. Foundry's existing exterior remains outside this second-station replacement.

Generated with the built-in imagegen tool. Prompt: "Create a production game sprite: Kepler Exchange, massive realistic cinematic industrial orbital freight station, two horizontal stacked habitation rings around a tall central docking spine, large freighter hangars, dense trusses and weathered pale steel panels, tiny warm amber windows and restrained cyan navigation lights. Three-quarter exterior view from slightly above, full station isolated and centered with comfortable transparent margins, 1536x1024 landscape transparent PNG with genuine alpha. Worn believable machinery, intricate photo-real 3D cinematic lighting, cold shadows and warm rim light. No planet, no stars, no background, no text, no vector illustration or cartoon. Match a grounded hard sci-fi cargo game, station fills 85 percent of image."

The existing `ships.png` has one orientation per class. `enemy-views.js` selects front/rear/left/right and oblique directions from velocity versus the player. Its current fallback rotates/banks the original raster without horizontal mirroring; it does not invent genuine unseen surfaces.

Additional optional artwork: for each `raider`, `interceptor`, `gunship`, supply eight individual transparent 1024×1024 PNGs under `void-runner/art/enemies/`: `<class>-front.png`, `-rear.png`, `-left.png`, `-right.png`, `-front-left.png`, `-front-right.png`, `-rear-left.png`, `-rear-right.png`. Keep ship size/framing, markings and lighting consistent. Register their relative paths in `enemyDirectionalAssets` in `enemy-views.js`; missing/unloaded frames use the existing atlas. Banking is applied procedurally to the selected view. These 24 directional assets remain to be supplied; the Kepler asset is complete.

## Verification

Run `node --test tests/*.test.cjs` and `python -m unittest discover -s tests -p 'test_*.py'` with the repository's backend dependencies installed. For browser tests install Playwright, run the Flask app on 127.0.0.1:5000, then run `tests/browser-smoke.cjs`, `tests/cockpit-browser.cjs`, and `tests/combat-browser.cjs` with Node. Set `BROWSER_CHANNEL=msedge` if using Edge and optionally `VOID_SCREENSHOT_DIR` for captured images.

Tests cover campaign migrations/progression/equipment, camera/collisions, ownership/ammo/lock/turn bounds/expiry, admin authorization/validation/conflicts, existing payments/cloud boundaries, actual browser resets for signed-in and guest players, local persistence, explicit cloud restore, real enemy shots/hits/misses, cyan/red feedback, missile launch/damage/pause, private panel persistence and sign-out, station rendering, touch inputs and mobile layout. Browser identity/cloud operations are mocked; backend tests use real Flask routes with mocked Firebase verification/storage. Live Google OAuth, production Firestore rules/credentials and real-device touch feel require staging acceptance after review. No production data was changed.
