# Advertisement screens and the weekly WarFlying Leadership Board

Build `2026-11-16-adscreens-1` (16 Nov 2026), branch `claude/ad-screens-1`, local commits, not pushed, no pull request.
David's words and direction: [`docs/void-runner/design-source/12-street-advertisements-david.md`](../void-runner/design-source/12-street-advertisements-david.md). Voices: [`AD_SCREENS_VOICE_AUDITION.md`](AD_SCREENS_VOICE_AUDITION.md).

## What changed for the player

- **The static posters on NeoChinatown's streets are now screens.** Each is a built object, not a flat picture: a dark metal casing with raised edges, a hood, light bars in the quarter's colour, a red power light, brackets to the wall (big wall screens) or a plinth with a downlight (street-level stands).
- **Each kind of ad has its own look**: colours, lettering, a moving emblem and its own way of arriving. Food is hot orange with a steaming bowl and bouncy lettering; dating is pink with a beating heart; corporate propaganda is cold navy with a rising chart; healthcare is a pale clinical screen with a heartbeat trace; housing is a night skyline with windows going on and off; transport is yellow-and-black hazard stripes with a cab; black-market tech is a green terminal with falling characters; cybernetics is teal with a turning iris; a government announcement is grey and red with a plain seal and a slow light passing over it; ship equipment is a navy radar; police recruitment flashes red and blue; The Darknet District's apparel ad is black with the District's cyan and magenta; pro-WarFlying is lime on black with radio waves; news is broadcast blue; the board is black and gold.
- **The words appear in step with the voice.** A brand lands, then its tagline lights up word by word as it is said. Longer ads show one line at a time, each scrolling up as the next arrives. With no recording the words arrive at reading pace.
- **Every fifth slot is news or the WarFlying Leadership Board**, turn about. News is only David's own reports, and only ones whose story has already happened for that player; with none, it is always the board.
- **The board shows only the top five and changes every week, the same for every player.** #1 is always one of David's handles. A player who gets in is shown among the five; the fifth drops off.
- **Sound comes from the screen:** louder as you walk up, to the left or right of you as you turn. Only one screen ever talks at a time (the one heard best); the nearest two hum quietly; a short chime marks a new ad. Nothing is said in a checkpoint, indoors, during a conversation, in a menu, or while the radio's Relay is talking.
- **Meridian's station screens** have the same look and housings. What they say is unchanged, and they are still silent (the radio carries the Relay's voice).
- **The device's WarFlying app and the Mission Log** show the same weekly five, under the heading WARFLYING LEADERSHIP BOARD. The app's send button now reads **SUBMIT SCANS**, as David's ad says.

## Where the screens are, and what each area plays

| Area | Screens | Plays |
|---|---|---|
| Old Town (Main Street) | wall screens and street stands where the old posters were | food & beverages, dating & entertainment, black-market tech, cybernetics, housing, pro-WarFlying, The Darknet District apparel |
| The Port | one wall screen over the pad and one stand in the passage (new: the Port had no posters) | transport, housing, healthcare, David's ship-equipment ads, police recruitment, pro-WarFlying |
| The Avenue, middle | where the old posters were | everything except black-market tech, plus government announcements |
| The Avenue, Function Gate end (west of x = 36) | where the old posters were | corporate propaganda, government announcements, healthcare. **No Darknet District ads.** |
| The Avenue, East Gate end (east of x = 106) | **none** | the road to the Temple stays quiet |
| In or within 3 m of any checkpoint | **none** | |
| Zen Zephyr Temple, Corporate District | **none** (nothing was added to either) | |
| The Darknet District, Milked, NULL | untouched | the District's own silent anti-WarFlying screens are as they were |

This table is **proposed, not confirmed by David**. It is plain data so he can change it.

Left as they were: The Function's "civic notice" poster (silent, same place, same picture), the far skyline's giant posters, the District's own posters, the VR suite's window and the device's News feed (these still use the 12 old Tessaly brand posters from `ad-art.js`; none of them is voiced).

## What speaks today and what is silent

| | Today |
|---|---|
| David's seven space-station ads (thrusters, shields, missile lock, personal defence, District apparel, two police ads) | **spoken**, with the existing recordings in the provisional voices |
| David's three news reports | **spoken** when they come round (existing recordings, provisional voice) |
| The 47 brand ads, the 7 government announcements, the 3 pro-WarFlying ads | **silent**: shown with timed captions |
| The board's "#1" callout (a handle, or "a new number one") | **silent**: shown |
| The Function | no voice, no content |

Nothing new was recorded. See the audition plan for what David listens to and what is recorded after he picks.

## How to change things

All of it is in **`void-runner/ad-screens-data.js`** unless noted. After any change: bump `BUILD` in `void-runner-sw.js`, run `npm test`.

- **Add an ad** (only with David's words): add one line to `ADS`: `{id:'food-new-thing',cat:'food',brand:'New Thing™',line:'His tagline.'}`. An announcement has no `brand`. A longer ad is `{id, cat, title, lines:[...]}`. It appears in every area whose list contains that category. `tests/ad-screens.test.cjs` compares `ADS` with David's document word for word, so add the line to `docs/void-runner/design-source/12-street-advertisements-david.md` too.
- **Change what an area plays:** edit the `cats` list of that area in `ZONES`.
- **Move the edges of the Function Gate end or the East Gate quiet stretch:** the two rectangles at the top of `AREAS` (street metres, x from west to east). `zone:null` means no screen at all.
- **Make an area silent:** `speaks:false` on its entry in `ZONES`.
- **Add a screen by hand:** one entry in `PLACES` (quarter, `wall` or `kiosk`, position, the way it faces).
- **How often news or the board comes round:** `EVERY` (5).
- **How long a silent line stays up:** `TIMING`.
- **Eras (the lore timeline):** any ad can carry `era:'name'` (or a list). It then runs only when `ERA` is that name; an ad without `era` always runs. `ERA` is `null` today and **no eras exist**: none was invented. When David defines them, set `ERA` from the save (one line) and tag the ads.
- **A new category:** an entry in `CATEGORIES` with a `look`, and a look of that name in `LOOKS` in `void-runner/ad-screens.js` (colours, lettering, a background and an emblem; copy the nearest one).
- **Which voice reads a category:** the `speaker` of the category (a slot in `tools/audio/npc-voice-registry.json`). Recording is off until `RECORD` is switched on (audition plan).
- **The board's handles:** `void-runner/warflying-board.js`. `HANDLES` is David's list, verbatim. The generator's word lists are `FIRST`, `SECOND` and `PLAIN`.

## The weekly board, exactly

- The week is the ISO week (Monday 00:00 UTC). Everything is worked out from the week's name (for example `2026-W47`), so every player gets the same five with no server, and nothing is saved.
- #1: one of David's 57 handles, never the same two weeks running, always clearly ahead of the other four.
- #2 to #5: mostly from the generator (two words run together, about half ending in two digits like a login handle, some plain hobbyist handles), sometimes one of David's.
- During the week the lower four pick up the odd point at set moments, so David's radio commentary ("THAT SINGLE POINT HAS MOVED {NAME} INTO {RANK} PLACE!", the comeback, the new contender) still has real changes to report. Only handles from David's list are ever moved that way, because only those can be recorded.
- Scores are on the player's own scale (one point per unique signal) and stay below the number of signals that exist, so a thorough player can take #1. Then the board's voice line is "a new number one" and the screen shows the player's handle (their account's, or YOU).
- **Old saves:** nothing to migrate. The old five rivals (GhostVector and the others) were never saved as such; the Relay's saved "last board seen" is just names and points, the save server accepts the new handles unchanged (a test covers it), and a board saved in another week is simply not compared.

## How it is built

| File | What it is |
|---|---|
| `void-runner/ad-screens-data.js` | PURE DATA AND RULES. David's ads, the categories, the location table, the every-fifth rule, eras, timings. Tested: `tests/ad-screens.test.cjs`. |
| `void-runner/warflying-board.js` | PURE RULES. The weekly five, the handle generator, the player's place. Tested: `tests/warflying-board.test.cjs`. |
| `void-runner/ad-screens.js` | The looks (one painter for tall street screens and wide station screens), the housings, the feeds, the sound. |
| `void-runner/neochinatown.js` | Puts a screen where each street poster stood (`streetAd`), keeps The Function's poster, ticks and disposes the screens. |
| `void-runner/relay-screens.js` | Meridian's screens, drawn with the same looks and housings. |
| `void-runner/warflying-scan.js`, `relay-radio.js`, `warflying-scanner.js`, `personal-device.js` | Use the weekly board. |
| `void-runner/voice-clips.js` | A playing broadcast clip now reports its length and progress, so captions keep step. |

**Performance design.** A feed is one programme, one canvas texture and one material, shared by every screen showing it; all of a feed's pictures are merged into one mesh, and every housing part merges with the others of its material (four materials for all the housings of a quarter). Low has one feed per area at 384 x 576, redrawn 6 times a second; Medium and up have two per area (one at the Function Gate end) at 512 x 768, 10 to 12 times a second. A feed is redrawn only while one of its screens is within range, facing the player and not behind the camera. Everything is disposed with the quarter.

## Measured

Same machine and method before (`main`, build `2026-11-16-quarters-1`) and after, 1280 by 720, bundled Chromium with the software renderer. **These are counts of what the game asks the graphics card to do, not frame rates**; nobody has timed this on a real graphics card. "Pictures" is every texture alive in the scene.

| Where | Draw calls, Low | Pictures, Low | Draw calls, Medium | Pictures, Medium | Screens there | Animated feeds (Low / Medium) |
|---|---|---|---|---|---|---|
| Main Street middle, looking south (Old Town) | 202 → 194 | 305 → 306 | 423 → 415 | 372 → 369 | 12 | 1 / 2 |
| The Port pad, at the street spawn | 108 → 114 | 191 → 193 | 227 → 239 | 229 → 231 | 2 (new) | 1 / 2 |
| The Avenue junction, looking west | 206 → 182 | 240 → 239 | 471 → 451 | 292 → 299 | 22 | 2 / 3 |

Plainly: the screens cost nothing extra to draw on Main Street and the Avenue (slightly less: the old posters were separate objects, the new pictures are one merged object per feed). The Port gained two screens it did not have, for about 6 to 12 draw calls. What is new is the repainting: one to three small canvases, a few times a second, only while a screen is near and in view. The painting itself was not timed on real hardware.


## Checked

@@CHECKED@@

## Not done, and questions for David

@@OPEN@@
