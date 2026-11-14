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
`tests/device-v1.test.cjs` (rules: storage, timing, saves), `tests/device-v1-timing-browser.cjs` (real browser: measured transition times, reduced motion, rapid clicking, frame stalls; `node tests/device-v1-timing-browser.cjs [chromium|firefox]`), `tests/personal-device-browser.cjs` (the V1 inside the real game). Still not done: Camera and Gallery are placeholders (Phase 5); News is unchanged (Phase 3); no follow system (Phase 4).

## Messages (Phase 2)
The left-side chat box is gone. `void-runner/district-chat.js` is now a headless **session store** (no screen): one multiplayer listener, the last 100 lines of this page session in arrival order, a duplicate guard, the unread counter and the slash commands. It listens whether or not the V1 is open, so messages that arrive while the V1 is closed are kept and counted. Nothing is stored on disk or on a server (no history) and the registered-account / District-interior-only rules of the multiplayer service are unchanged. The V1 Messages app is the screen: **DISTRICT CHAT** (sender, time, NEW marker, composer; Enter anywhere in the District opens it with the box ready), **PLAYERS** (mute, block, report), **CONVERSATIONS** (local NPC transcript), **PRIVATE** (an honest "not available" card).

Unread: only other people's messages, only while the chat is not on screen. Shown as `V1 · L · N NEW` on the device chip, a badge on the Messages tile and on the DISTRICT CHAT tab (99+ cap). Looking at the chat reads everything. Own messages never count.

Reports reach the hub's server log only (docs/development/MODERATION.md); the screen says so and does not claim a permanent record. **Private messages** need new backend support (delivery, storage, server-checked blocking, an age/moderation policy) and are not built; nothing in this phase fakes them.

Tests: `tests/district-chat-store.test.cjs` (mocked multiplayer service), `tests/device-messages-browser.cjs` (real browser, mocked service), `tests/district-chat-browser.cjs` (LIVE: two real game pages through the real hub; needs a machine that can load two pages quickly).

## KeyMap (Phase 2)
`void-runner/keymap.js` + `keymap.css`. K shows or hides it (the `keymap` action in `input.js`, rebindable in Keybindings). It appears by itself once, right after the first successful Sleeping Pod exit (never in the character creator or inside the pod); `story.flags.keymapSeen` records that it was seen (opening it by hand counts). Only keys with an action are drawn, in their real keyboard positions, for ON FOOT or FLIGHT; customisable actions come from the player's own bindings. The fixed on-foot keys are listed once in `keymap.js` with the source file that handles each; `tests/keymap.test.cjs` checks them against that source, so a changed control must be changed there too. Saves from before the KeyMap: it takes K, unless the player already uses K for something else; then that binding is kept and the KeyMap takes the next free key (J, N, M, ...) and its hint says which. The overlay does not take over input (the game keeps running underneath); the V1, menus and the character creator hide it.

## Graphics defaults (Phase 2)
See `docs/development/GRAPHICS_TEST_ROG_ALLY.md`. New players start on Medium; `graphics-prefs.js` defines what a saved value means; Settings > Graphics has Reset to Medium; the game never changes the preset by itself.
