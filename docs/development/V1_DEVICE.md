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

## 15 Nov 2026: District residents, profiles, jobs, face-on portraits (PR pending David's approval)

David asked for the NPCs in The Darknet District to be listed with the players, with names, profiles and jobs, and for players to pick their own jobs.

- **`void-runner/district-people.js`** (pure, tested): `JOBS` (David's eight first: Smuggler, Pirate, Mercenary, Merchant, Influencer, Dancer, DJ, Mechanic; then 24 additions for him to keep or cut) and `NPCS`, the roster of named residents: Admin, Iris, Nyx (bar), the two bar patrons, the VR watcher, the two VR booth players, the four hallway figures, and DJ Vanta at NULL. **Every name, job and line except Admin, Iris and Nyx is Claude's draft for David to change.** To add a resident who enters the District, add one line there.
- **Players tab (Messages):** real players first (each now has a PROFILE button), then the residents of the place you are standing in (the District interior, or NULL for the DJ).
- **Social:** residents here are listed; any profile opens with name, jobs, a line and where they are.
- **Your own profile:** WHAT YOU DO (up to three jobs) and ABOUT YOU (one line, 120 characters, cleaned). Both are stored in the save (`story.flags.profileJobs`, `profileAbout`). **Other players cannot see them yet:** the District server accepts no profile fields; sending them needs a hub and API change and David's go-ahead (free text shown to others also needs the chat's moderation rules).
- **Faces:** a named resident keeps one fixed crowd look (`crowd.js` asks `VoidDistrictPeople.lookFor`), and the portrait uses the look the scene really shows. Nyx has no model yet, so the portrait says unavailable (no face is invented).
- **Face-on portraits:** `device-portraits.js` now aims the camera square at the face (found from the eyelashes of the posed figure) and frames tighter. `ASSET_VERSION` is 4, so old pictures are redrawn. Known limit: the idle pose can still tilt the head a little.

## 15 Nov 2026 (later): MY V1, empty App Store, job dropdowns, sponsored News feed (same pending PR)

- **MY V1** (`device` app; `D.appTitle` names it after the model, so a V2 shows MY V2): storage, model, the ten system apps and installed apps, moved here from the App Store.
- **App Store:** shows only "No apps available yet." until `STORE_EXTRA` has entries.
- **Jobs:** two dropdowns (JOB, SECOND JOB) instead of a wall of buttons; `MAX_JOBS` is 2.
- **News feed** (`void-runner/news-feed.js`, tested): up to eight small SPONSORED lines mixed among the reports, in a new random order each time the app is opened. Sources: the station screen brands (`ad-art.js`, not The Function's notice), the Relay's advert and police spots word for word (`relay-content.json`), and District store adverts posted by Admin or Iris for the goods the in-game shop shelves show (`store-atlas.json`), each with a link to the real storefront page. **The store advert sentences (`STORE_LINES`) are Claude's drafts.** `GAME_ITEMS` (empty) is where an item Admin or Iris sell through mission progress gets its advert line and the flag or mission that unlocks it.

## 15 Nov 2026 (later still): the Camera app is a live viewfinder; News posts are boxed

- **Camera** (`void-runner/device-camera.js`, tested in `tests/device-camera.test.cjs`): choosing CAMERA closes the panel and puts a viewfinder over the real game view. The player still walks and looks. L (opening the V1) or leaving walking mode closes it. While it is up the game's own readouts are hidden (`body.pd-camera-on`); the interact prompt and notices stay.
  - HUD: corner brackets, a plain crosshair with no circle, running timecode, battery (the device's own figure for the session, not the computer's), signal (from the game's comms state), zoom, focus, camera id, real frame rate, ISO.
  - Name tags: light green, with a thin line to the head, for named District residents (`district-people.js`) and other players. Placed up and to the side of the head, kept on screen, measured from the figure's real position every frame, and never drawn through a wall (collision boxes; glass and low counters do not block).
  - Zoom: mouse wheel through `DEVICES.<model>.camera.zooms` (`[1, 1.5, 2, 3]`) up to that model's `maxZoom` (V1: 2). A later model raises `maxZoom`.
  - Theme: every colour is a device CSS variable (`--pd-*`; `--pd-tag` is the tag green) and the HUD carries `data-device`, so a new device theme restyles the camera with no code change.
  - Not built: taking or keeping photos (Gallery is still "coming later").
- **News:** each sponsored post and each report sits in its own bordered box.

## 15 Nov 2026 (night): follow people with the camera; one look per character; games page

- **Aim and follow:** in the Camera, putting the crosshair on a person OR on their tag selects them (the tag fills in, the aperture turns green, "F · FOLLOW NAME" appears). F follows or unfollows. Following is kept in the save (`story.flags.socialFollowing`, `district-people.js`) and listed in Social under FOLLOWING; a profile also has a FOLLOW button. Residents and players with a registered handle can be followed. Tags of people standing close together no longer cover each other.
- **One look per character:** Admin's and Iris's figures and their profile portraits are drawn from the same record (`district-people.js`). Iris's portrait had been drawn from a wrong copy of her look; a test now compares them.
- **Not built yet (David asked 15 Nov):** tagging people in Messages and Mission Logs, and bounties on NPCs or players. Both need the District server to carry and check them.
- **Games page:** "The Darknet District - Game" card; `site-return.js` puts a "← WEBSITE" button on every game page (VOID//RUNNER: main menu only); inside the arcade the cabinet bar says EXIT GAME.

