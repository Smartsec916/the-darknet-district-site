# V1 personal device

The V1 is the player's holographic device (L key, on foot or in a station). Rules and saved state: `void-runner/device-v1.js` (pure, unit-tested). Screen: `void-runner/personal-device.js`. Look: `void-runner/device-v1.css` (scoped to `#personal-device` and `#pd-chip`; loaded through `void-runner.html` like the other game stylesheets, and covered by the service-worker build number). `personal-hud.js` is the older P-key terminal and is NOT the V1.

## Look (Phase 1, local)
Matches the website navigation buttons (`home-navigation.css`): panel `#0c1b23`, edge `#38808b`, rail `#61eee9`, a single small `#d56cba` tick on launcher tiles. Teal is the main colour; pink is used only for that tick and the map's shop marker. Colours, spacing and timing are CSS variables at the top of the stylesheet.

## Starter-device timing
`DEVICES.v1.ui` (milliseconds): `appOpenMs` 320 (home -> app), `homeMs` 180 (back to home), `tabMs` 160 (inside an app), `startupMs` 600 (first opening after the page loads), `maxMs` 600 (hard ceiling). A transition shows a short loading card and then the screen; it is a timer, not a busy loop, and the latest request wins (clicking again, Back or closing cancels the one in flight). Reduced motion (the device's Animation setting, or the system setting when it is on FOLLOW SYSTEM) makes every delay 0. A later device model changes these numbers in its own `DEVICES` entry; nothing else needs to change. `D.delayMs(device, kind, still)` is the single place the rule lives.

## Storage
The stock V1 shows STORAGE USED 75% / AVAILABLE 25%, 9 system apps, 0 additional apps. 75% is `DEVICES.v1.storage.baseUsedPct`: a defined baseline of the model, **not** a measurement of the player's computer. Only optional apps that are actually installed change it: each future optional app (an entry in `STORE_EXTRA`, `{id,title,generation,note,storagePct}`) adds its own `storagePct`, capped at 100 (`D.storage(device)`). No such app exists yet and there is no purchasing system.

Saved state is unchanged: `story.flags.deviceApps` (comma list, system apps always present; an optional app id is kept only if it is in `STORE_EXTRA`), `deviceSettings`, `deviceModel`, `deviceVersion`, `deviceMapInterior`, `deviceMapStreet`. No new field.

## Tests
`tests/device-v1.test.cjs` (rules: storage, timing, saves), `tests/device-v1-timing-browser.cjs` (real browser: measured transition times, reduced motion, rapid clicking, frame stalls; `node tests/device-v1-timing-browser.cjs [chromium|firefox]`), `tests/personal-device-browser.cjs` (the V1 inside the real game). Not in Phase 1: Camera and Gallery stay placeholders; chat is not yet moved out of the left-side box (Phase 2); News is unchanged (Phase 3); no follow system (Phase 4).
