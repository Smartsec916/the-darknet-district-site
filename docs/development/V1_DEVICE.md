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

**16 Nov 2026 (build `2026-11-16-fixes-1`): complete keys, four tabs, a mouse map.** Tabs: ON FOOT, CAMERA, SLEEPING POD, FLIGHT. Keys added: B camera, G taxi (new key), and with the camera raised F follow person; the Sleeping Pod tab lists E, M, V, Q and the arrows. Keys that only work in a situation are drawn only then (weapon keys with a weapon, Enter with chat, T / Y / N with trading, the player's own talk key with voice on), and a line under the keys names the ones not shown. Beside the keys is a drawn mouse (left button, right button, wheel, movement) labelled for the tab: on foot, camera (left click photo, wheel zoom), pod, flight. The KeyMap can be opened with the camera raised. Full list: [`PLAYTHROUGH_FIXES_1.md`](PLAYTHROUGH_FIXES_1.md).

## Graphics defaults (Phase 2)
See `docs/development/GRAPHICS_TEST_ROG_ALLY.md`. New players start on Medium; `graphics-prefs.js` defines what a saved value means; Settings > Graphics has Reset to Medium; the game never changes the preset by itself.

## 15 Nov 2026: District residents, profiles, jobs, face-on portraits (PR pending the owner's approval)

The owner asked for the NPCs in The Darknet District to be listed with the players, with names, profiles and jobs, and for players to pick their own jobs.

- **`void-runner/district-people.js`** (pure, tested): `JOBS` (the owner's eight first: Smuggler, Pirate, Mercenary, Merchant, Influencer, Dancer, DJ, Mechanic; then 24 additions for him to keep or cut) and `NPCS`, the roster of named residents: Admin, Iris, Nyx (bar), the two bar patrons, the VR watcher, the two VR booth players, the four hallway figures, and DJ Vanta at NULL. **Every name, job and line except Admin, Iris and Nyx is Claude's draft for the owner to change.** To add a resident who enters the District, add one line there.
- **Players tab (Messages):** real players first (each now has a PROFILE button), then the residents of the place you are standing in (the District interior, or NULL for the DJ).
- **Social:** residents here are listed; any profile opens with name, jobs, a line and where they are.
- **Your own profile:** WHAT YOU DO (up to three jobs) and ABOUT YOU (one line, 120 characters, cleaned). Both are stored in the save (`story.flags.profileJobs`, `profileAbout`). **Other players cannot see them yet:** the District server accepts no profile fields; sending them needs a hub and API change and the owner's go-ahead (free text shown to others also needs the chat's moderation rules).
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
- **Not built yet (the owner asked 15 Nov):** tagging people in Messages and Mission Logs, and bounties on NPCs or players. Both need the District server to carry and check them.
- **Games page:** "The Darknet District - Game" card; `site-return.js` puts a "← WEBSITE" button on every game page (VOID//RUNNER: main menu only); inside the arcade the cabinet bar says EXIT GAME.

## 15 Nov 2026 (night): WarFlying is an app

The owner: add the WarFlying app to the App Store; it takes 15% of storage on any personal device; it is no longer attached to ships; it has Activate / Deactivate; logged frequencies light the send button; the District interior is shielded. (He wrote "Warfling"; the game's existing name WarFlying is kept.)

- **App Store:** WARFLYING, free, 15% (`STORE_EXTRA` in `device-v1.js`; `install`/`uninstall`). A stock V1 goes from 75% to 90%. Installed apps appear on the home screen after the built-in ones.
- **The app:** ACTIVATE / DEACTIVATE (`story.flags.warflyingActive`), points, frequencies identified, waiting to send, **SEND DATA TO WARFLYING LEADERBOARD** (highlighted when anything is waiting; uses the existing Relay upload and its link rules, so it cannot send from inside the District), the leaderboard and recent discoveries.
- **Scanning** (`warflying-scanner.js`): listens when the app is installed and active. In flight it hears what it always did. On foot it logs the transmitter of the place you are in. **Inside The Darknet District it is shielded and hears nothing.**
- **The old ship module** (`warflying-module`, Utility slot) is no longer needed for scanning. It is still in the item list and still sold at outfitters so no save breaks. **Open question for the owner:** remove it from sale and refund owners? The scrambler is unchanged and still a ship module.

## 15 Nov 2026 (late): the scanning house rule, the V3 // SHADOW, walking speed

- **House rule:** someone inside the District with the WarFlying app ACTIVE is noticed after a few seconds. Admin goes half the time, Iris the other half; when Admin is not in the District Iris always goes (`district-people.js` `ETIQUETTE`; the walking is in `neochinatown.js`, `etiquette`). They walk round the counter, down the hallway to the player, face them, say their line (shown as a notice; **no recorded voice, and the wording is Claude's draft of the owner's instruction**), and walk back. Once per visit; it re-arms when the app is switched off. Checked in a test browser with the clock sped up (the software renderer's game clock crawls): the route, the line and the return. The walk animation itself was not seen.
- **V3 // SHADOW** (`DEVICES.v3`): faster timings, the same interface in monochrome green (`[data-device=v3]` in `device-v1.css`), camera `EYE 01` zooming to 4. The shared zoom array is now 1, 1.5, 2, 3, 4; the V1 still stops at 2. Nobody can get a V3 yet; it is Dax's device. Not built: the eye camera on B, and target lock on B in flight.
- **On foot:** walk 3.4 to 3.9 m/s, run 5.6 to 6.4 m/s (`exploration-controller.js`); still under the multiplayer server's 9 m/s limit.

## 15 Nov 2026: play as Admin (developers), first stage

The owner: when he signs in with his developer account (smartsec916@gmail.com) he wants the option to play as Admin; Admin has no missions, a ship available, and a V3 // SHADOW; Iris takes over Admin's tasks and mission dialogue.

- **Who sees it:** the main menu shows PLAY AS ADMIN beside DEVELOPER TOOLS, only for an account the game server confirms as a developer (`VOID_ADMIN_UIDS` on the game API; account ids, not emails), and the server is asked again when the session starts. If the owner's account does not show DEVELOPER TOOLS, its id is not in that list.
- **What it is:** a developer test session (`dev-test.js` `playAsAdmin`), so **nothing is saved** and EXIT TEST returns to the real save. A District campaign with no missions, the starter ship awarded, 10,000 credits, every place discovered, `deviceModel` v3 (green interface, faster, zoom to 4), spawn inside the District. The V1 shows Admin's own name, job and portrait. Admin the NPC is away from the counter (`adminOccupied`), so Iris is the one there, and Iris is the one who walks over for the scanning house rule.
- **Not built:** a kept Admin save; other players seeing the owner as Admin (they see his account's own saved character, because the multiplayer server sends that); Iris taking over Admin's mission steps and dialogue for OTHER players while the owner is online as Admin (needs the multiplayer server to say so, and the owner's approval of how Iris words Admin's lines); requesting a ship at the landing-pad terminal was not changed or re-checked.

## 15 Nov 2026 (late night): distance in the player lists; footsteps

- **Players (Messages) and Social:** outside The Darknet District each other player's row shows how far away they are ("42 m away"), nearest first. Inside the District no distance is shown (everyone is simply here).
- **Footsteps** (`void-runner/footsteps.js`, `tests/footsteps.test.cjs`): other players and NPCs who are moving near you make steps that come from their position, fade with distance, and are quicker and louder when they run; your own steps are louder when you run. A thud made in code, on the Effects channel, nearest five movers only. Not heard by Claude (the test browser has no sound): the owner to judge level and feel.


## 15 Nov 2026: photos, the Gallery and News filters

The owner: left mouse button takes a picture with the camera; pictures are kept in the Gallery at about 1% of storage each; players can delete them and post them to the News app; residents post too, at places like NULL; the tags of players and residents stay in every picture; News can be filtered (Broadcasts, Commerce, People).

- **Taking a photo.** With the viewfinder up (B), the left mouse button takes the picture (`device-camera.js` `shoot`). The picture is the game's own frame with the name tags drawn in; the list of who was tagged is kept with it. A full device says so instead of saving.
- **Gallery** (`device-gallery.js`). Photos are stored in this browser only (IndexedDB `void-runner-gallery`); nothing is uploaded. Each photo takes 1% of the device's storage on top of the apps (`D.storage` counts them), so a stock V1 holds 25. A photo can be opened, deleted (press twice) or posted.
- **News filters** (`personal-device.js` `newsView`): ALL, BROADCASTS (the Relay archive), COMMERCE (the adverts), PEOPLE (pictures).
- **People posts.** The player's posted photos and four pictures posted by residents (`NPC_POSTS`: Lumi and DJ Vanta at NULL, Nyx at the bar, Dax in the arcade). The residents' pictures were taken in the game with this camera and are in `void-runner/art/news/`. No captions were invented.
- **NOT DONE: other players cannot see your posts.** That needs picture storage and moderation on the server (cost and a reporting path), which has not been built or approved. Until then a post is visible to its owner only, and the photo screen says so.
- Tests: `tests/device-gallery.test.cjs`.
