# Flight combat: missiles M1 / M2, lock-on, lasers, flight sound, Admin's ordnance, the Ship Loadout app

Branch `claude/flight-combat`, build `2026-11-19-flight-combat-1`. The owner (19 Nov 2026): "Currently the ship fires laser cannons. But I've never fired a missile in the game yet. Can you make a lock-on function similar to Ace Combat for missiles. Maybe a missile animation. Upgrade laser cannon graphics. Add sound effects to flying. The base ship laser cannons do little damage, but they never run out. The M1 missiles turn faster, but will do less damage than an upgraded M2 missile which will turn slower. Admin can sell both more M1 missiles and upgraded M2. Make a ship Loadout App that is automatically added once a player acquires a ship from Admin in a later mission."

The lock-on is our own design in the spirit of that kind of arcade dogfighting (a seeker circle, a closing box, tones). It copies no interface, art, sound or names.

## Why missiles could never be fired

The missile code (lock, launch, homing) existed, but nothing in the current game ever gave the player a launcher:

- A launcher only counted when `state.creditGear` held `'launcher'` **and** `loadout.missile` was `'launcher'` (`flight-runtime-integration.js missileSource`).
- The only way to get one was Rook's launcher offer in the old Vesper / Meridian campaign (`prologue-integration.js module-launcher`, after two combat runs). That campaign is retired: a District campaign never reaches it.
- The ship grant (`campaign.js awardStarterShip`, used by the Mission Editor's ship reward, the beginner campaign and the developer test ship) gave the hull only, with `loadout.missile` null.

So every player, the developer test ship included, flew with `NO LAUNCHER`. Only the Developer Tools missile trial could fire one.

## What a ship comes with now

`void-runner/ordnance.js` (`VoidOrdnance`, pure, Node and browser):

- **The grant** (`grant`, called from `campaign.js awardStarterShip` and `giveShip`): the launcher is fitted on the wing rails, the M1 rack is filled (Kestrel: 6), the selected type is M1, and `story.flags.loadoutApp=true` puts the **Ship Loadout** app on the V1. Idempotent.
- **Existing saves** (`migrate`, from `campaign.js restore`): a District campaign that already owns a ship (the developer test ship, a ship from an earlier mission or the beginner campaign) gets the same once. A campaign with no ship is untouched. Older (pre-District) campaigns keep Rook's offer. If the player later removes the launcher in the app, that choice is kept.
- **Two types:** M1 (standard, agile: turns hard, smaller warhead) and M2 (upgraded: bigger warhead and blast, turns slowly). Separate racks: M1 fills the hull's missile capacity, M2 half of it (Kestrel 6 and 3).

## Balance values (Developer Tools > Combat Balance > Your missiles)

| Value | M1 | M2 |
|---|---|---|
| Damage (`missileM1Damage` / `missileM2Damage`) | 12 | 40 |
| Turning, rad/s (`...TurnRate`) | 2.6 | 0.9 |
| Speed (`...Speed`) | 100 | 82 |
| Blast and proximity fuse radius, m (`...Blast`; the fuse is 60% of it) | 4 | 10 |
| Price per missile at Admin (`...Price`) | **60 CR** | **180 CR** |

For scale: a raider has 2 to 4 armour, an interceptor 3 to 6, a heavy gunship 12 to 16 (`game.js spawnEnemy`, times `enemyHull`/2). A laser bolt does 1 (`laserDamage`); an M1 kills a raider or an interceptor, an M2 a gunship. The hull multiplies missile damage (`ships.js missile.damage`: Kestrel 1). The older `missileDamage`, `missileSpeed`, `missileTurnRate` values now drive enemy missiles only. `missileLockRadius` (the seeker circle) went from 0.085 to 0.13 of the screen, so a target is easier to hold in it. Lock time (`missileLockTime`, 1.5 s), cooldown, fuel and range are unchanged.

**Server note:** `void_runner_api.py clean_balance` requires every balance key. Saving Combat Balance works once the Render API is deployed from the same commit as the pages (it reads `balance-data.js`). Reading balance works either way (missing keys take their defaults).

## In flight

- **Lock-on** (`combat.js drawMissileReticle`, `targeting.js`): the seeker circle in front of the ship (dashed, with four ticks). A hostile inside it is acquired over the lock time: four brackets close in and turn onto it, `SEEK nn%`, a progress arc round the circle, and the **seeking tone** (a short beep that speeds up). Then a solid red box with a diamond, `LOCK`, and a **steady locked tone**. Losing the target starts again.
- **Targets:** Next (Tab), Previous (G), Nearest (T), Clear (C), Lock (B) as before; the selected target is marked even outside the circle (`TGT · distance`).
- **Fire** (F or right-click): with a lock, a guided round; without a lock, the missile is **dumb-fired** straight ahead (unguided). Empty rack, cooldown, no launcher: the dry click as before.
- **Switch M1 / M2:** Z (new bindable action `missileSwitch`; saves from before get Z or the first free key) or the mouse wheel. The selected type is saved as the default.
- **Guidance** (`missiles.js step`): a turn-rate limit per type, lead pursuit (aims where the target is going), a seeker cone (66°): a target that turns outside it is **lost** and the round flies on and burns out (a miss). Proximity fuse; blast damage (half the warhead, falling off) on other ships inside the blast; fuel and range. A typical hard break (target 120 m ahead turning away sideways and towards the player) is held by an M1 and slips an M2 (`tests/flight-combat.test.cjs`).
- **Missile visuals** (`flight-fx.js`, drawn by `babylon-renderer.js renderFlight`): a gunmetal body with nose, band and fins (M2 larger), a flickering motor flame, a smoke trail (hot puffs turning grey, capped per quality: Low 90, Medium 200, High 300 puffs), a flash at the wing rail it left from (left and right in turn: the Kestrel model's `missile_left` / `missile_right` positions as seen from the cockpit), the explosion (`VoidCombatEffects` `missile` for M1, `large` for M2), a small burst where a missed round burns out.
- **Lasers:** unlimited as before, low damage per bolt, heat and fire rate unchanged. New look: a thin hot core inside a soft pale-blue glow, oriented along the flight; red for enemy bolts; muzzle flashes at the two guns, low on either side of the canopy; sparks on a hit (`impact`), a shield shimmer on a shielded target.
- **Enemy missiles:** the existing LOCK WARNING / MISSILE INCOMING text and arrows stay; they now have their own warning beeps.

## Flight sound (`flight-sfx.js`)

All synthesized with WebAudio, nothing recorded or bought. Plays through the game's EFFECTS channel (master and effects volume and mute apply). Distant sounds fade and pan (`VoidAudio.spatial`).

Engine (a filtered-noise rumble, a turbine whine and a low tone, all following the throttle; louder and brighter on the drive / boost and in warp), lasers, enemy fire, missile ignition and motor whoosh, lock acquired, the seeking beep, the locked tone, target cycling, dry click, laser hits on a hull and on a shield, explosions, the player's own shield crackle and hull crunch, lock warning and missile-incoming beeps, boost, warp in / out. Outside flight the game's own small tones are unchanged. `VoidFlightSfx.counts` / `log` record what was played (for tests).

## Admin's counter (`ship-loadout.js`)

Talking to Admin in a District campaign: a mission conversation comes first as before (`live-content.js`); otherwise a pilot with a ship gets **Admin's counter · ship ordnance**: both missile types with their warhead, turning, speed, blast, the rack count and price, BUY 1 and BUY (fill the rack). Without a ship: "Admin sells ship ordnance to pilots. You do not have a ship yet." (an on-screen notice, no new voiced line). There is no M2 launcher upgrade: the launcher fires both types.

## The Ship Loadout app (V1)

Granted (never from the App Store, takes no storage), shown when `story.flags.loadoutApp` is true (`device-v1.js GRANTED`). A V1 banner says it arrived (once per save, `story.flags.loadoutAppSeen`). The app (`ship-loadout.js`, drawn into `personal-device.js APP_VIEW.loadout`):

- the ship from above (a drawn outline with the guns, rails and engines marked), hull, shield, top speed;
- LASER CANNONS: PRIMARY slot, unlimited, damage per bolt and rate;
- MISSILES: the launcher (FIT / REMOVE), both racks with counts, **SET AS DEFAULT**, each type's warhead / turning / blast;
- SLOTS with the player-facing names: SHIELD, DRIVE (internal `utility`: boosters and drones, with the owned ones to fit);
- UPGRADES: every module bay (weapon, shield, power, cooling, engine, sensor, thrusters and UTILITY, internal `signal`) with the owned upgrades to FIT / REMOVE (`progression.js install`).

## Mission Editor

- **Give the player a ship** (the existing ship reward, renamed): its note says the launcher, M1 rack and the Ship Loadout app come with it.
- **Missiles (M1 or M2):** a new reward, 1 to 30 rounds of one type, kept up to the rack. In the Form view (What becomes available) and the Blocks view (Item > The player gets missiles here). Checked by the game (`mission-content.js`) and the server (`void_runner_live_content.py`); `void_runner_admin_inventory.json` lists the kind.

## Saves

- `progression.missiles`: M1 rounds (unchanged meaning; null is a full rack). New `progression.m2` (0 to 30) and `progression.missileType` ('m1' / 'm2'). Validated in `void_runner_progression.py clean_progression` (old saves get 0 and 'm1').
- `creditGear: ['launcher']` and `loadout.missile: 'launcher'` were already accepted by `void_runner_api.py clean_save`.
- `story.flags.loadoutApp`, `story.flags.loadoutAppSeen`: booleans (already accepted).
- No new location, mission or contract ids: `save-manifest.json` unchanged.

## Tests

- `tests/flight-combat.test.cjs` (grant, migration, prices and racks, M1 vs M2 guidance and the hard-break miss, fuse and blast, dumb-fire, saves, Mission Editor reward, page order).
- `tests/missile-fire-consequences.test.cjs` updated: no lock now dumb-fires; the launch point is the wing rail.
- `tests/test_flight_combat.py` (server progression and the missile reward).
- Browser: `tests/flight-combat-browser.cjs` (new character, ship grant, V1 banner and app, Admin's counter purchase, Flight Skirmish: target cycling, seeking and locked tones, M1 hit, M2 miss and M1 hit on the same break, dumb-fire, Z switch, lasers, sound events). Screenshots: `docs/development/flight-combat/`.

## Not done / weak

- No chase camera exists, so the missile leaving the rail is seen from the cockpit (flash low to the side, then the missile and its trail ahead), not from outside the Kestrel.
- Gamepad: no button for the missile switch yet (the mouse wheel and Z work).
- Not checked on real hardware or the ROG Ally (frame rate with many trails), in VR, or by ear (headless browsers cannot listen: the sounds were checked as events and by reading the synthesis code). The volume balance of the new sounds against the music is a guess.
- The missile does not show on the Kestrel's exterior model on the landing pad (the model's rails are empty).
