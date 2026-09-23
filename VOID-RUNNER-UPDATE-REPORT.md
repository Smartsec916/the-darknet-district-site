# VOID//RUNNER update report

Implemented on local branch `codex/void-runner-menu-story-audio`, based on upstream commit `6ed17cc81f298e848713567d810d304c3d359a76`. The inspected earlier local game files matched this upstream revision. This package has not been pushed or deployed.

## What changed

- Traditional animated main menu, stronger CSS title treatment, local save details, campaign overwrite confirmation, integrated account access/logout, and a resumable pause/menu flow.
- Persistent music/SFX/voice controls, global mute and editable keyboard actions with duplicate detection and reset. Existing mouse, touch and default arrow-key controls remain.
- Missile keyboard input and compact ammo/lock/failure feedback. Acquisition and launch enforce range, ownership, loadout, ammo and cooldown. Friendly/neutral ships are excluded from combat targeting and damage.
- One expanded audio manager: procedural music and station ambience, layered combat/danger tension, ship engines, selected event sounds, distance attenuation, camera-relative stereo and device speech. Browser interaction unlocks audio; hidden pages suspend it.
- Canvas explosion variants for impacts, missiles, ships and large destruction, using reusable plasma sprites, smoke, shock rings and luminous debris trails.
- Central character/voice/location/NPC-ship definitions, structured branching dialogue, campaign-owned continuity, once-only events, pending scenes/encounters and dialogue checkpoints. New missions still use the existing content/mission engine.
- Server validation preserves bounded story data and metadata without granting account ownership. A generated save manifest shares mission/location IDs with Python validation. Both entry pages remain synchronized.

## Removed or relocated

Removed the old title renderer, opening replay/reset routes, global Ship/Campaign/Upgrades/Account/Hangar/Audio toolbar, old audio-settings screen/listener/CSS, duplicate tone generator, old physical-key listener/state and old pause panel. The workshop remains the new campaign opening. Hangar/upgrades/mission access live at stations; account switching, loading, audio and controls live in the menu. Existing verified developer tools remain restricted to their established authorization path.

## Missile diagnosis

The launcher inventory, Rook unlock/voucher, equipment state, ammo, homing projectile and damage path were already present. The practical problem was discoverability: fire was exposed only through right-click and a touch button, while failed attempts silently returned. The lock also lacked an explicit range check. Default **F** now calls the same launch function. The HUD reports launcher/equipment status, ammo, acquisition/lock, no target, range, cooldown and empty racks. Ammo still replenishes at departure, preserving existing behavior.

## Default bindings

| Action | Default |
|---|---|
| Pitch / yaw | W/S and A/D; arrow aliases |
| Roll | Q/R |
| Thrust up / down | Shift / X |
| Equipped drive | E |
| Primary weapon | Space or left mouse |
| Missile | F or right mouse, after lock |
| Nearest / next / previous hostile | T / Tab / G |
| Clear / reacquire lock | C / L |
| Pause / menu | Escape |

Docking remains automatic. Weapons are selected in the Hangar. No nonexistent reverse, secondary weapon or in-flight weapon-cycling system was invented.

## Adding content and voices

See `VOID-RUNNER-CONTENT.md` for working examples covering characters, portrait/voice profiles, friendly/hostile ships, dialogue branches, missions/chains, flags, location events, encounters, music and effects. The Mara opening is the real structured-dialogue example; `mara_courier` is an NPC definition example, not a new forced story encounter. Existing Nyx remains the bartender.

Browser SpeechSynthesis uses the exact displayed dialogue. New lines and scene/menu changes cancel prior speech. The adapter supports a future server/cached voice provider. For consistent voices across devices, ElevenLabs is an optional candidate described with official API links in the guide. It would need an account, secret server-side API key and licensed voice IDs. No paid dependency, API key or new media download was introduced.

## Verification

- **40 JavaScript unit tests passed.** Includes campaign migrations/progression, ownership restrictions, flight/AI, warp, missile physics/lock, input remapping, story continuity/events and audio behavior.
- **22 Python tests passed.** Includes account separation, purchase validation, CORS, save conflicts, ship/loadout rules and story/checkpoint validation.
- **9 browser suites passed:** menu/settings/bindings; simulated account switching; real Web Audio setup/mixing; full opening campaign/ship overhaul; hangar/HUD; input-driven campaign pilot; four-station travel; bounded startup; static and Flask entry points with dialogue reload checkpoints.
- The input-driven pilot completed all four opening routes without modifying health, enemy damage or route progress. Full campaign integration covered Rook’s launcher unlock/install, all three ship profiles, missile ammo/damage and incoming missiles.
- JavaScript syntax checks and `git diff --check` passed. Main menu, settings, dialogue and effects were inspected from browser screenshots. Mobile layout checks passed at 390 × 844.
- The static primary page and Flask-served mirrored page both started locally. The shared sync script was run; root and mirrored HTML match.

Account browser tests substitute Firebase/API fixtures. Real Google popup sign-in, production cloud writes, payments and live deployment were not exercised. Browser voices vary by operating system and installed voices; audible acting quality still benefits from listening on the target PC. Historical browser scripts outside the nine listed suites were not claimed as passing.

## Delivery and deployment

The ZIP contains changed/new repository files only; it reuses existing game art. Apply it over the repository root, or apply the accompanying Git patch to the stated base. Review changes before deploying. Deploy the Python validator and generated `void-runner/save-manifest.json` with the frontend so cloud saves retain new story fields. Existing Firebase/premium credentials remain unchanged.

No manual assets or additional credentials are required for this update. New standalone character portraits and a production external voice service are optional future work. NPC hail, follow, cargo transfer and persistent fleet simulation are extension points rather than completed new mechanics.

An exact changed-file list is appended during packaging.

## Changed files (41)

- `VOID-RUNNER-CONTENT.md`
- `VOID-RUNNER-UPDATE-REPORT.md`
- `scripts/sync-void-runner.cjs`
- `static/void-runner.html`
- `tests/account-menu-browser.cjs`
- `tests/audio-browser.cjs`
- `tests/combat.test.cjs`
- `tests/entrypoints-browser.cjs`
- `tests/menu-browser.cjs`
- `tests/menu-story.test.cjs`
- `tests/overhaul-browser.cjs`
- `tests/piloted-browser.cjs`
- `tests/startup-speed.cjs`
- `tests/test_story_save.py`
- `tests/travel-browser.cjs`
- `void-runner.html`
- `void-runner/account.js`
- `void-runner/bootstrap.js`
- `void-runner/campaign.js`
- `void-runner/cockpit.js`
- `void-runner/combat-effects.js`
- `void-runner/combat.js`
- `void-runner/content.js`
- `void-runner/expansion.css`
- `void-runner/expansion.js`
- `void-runner/flight-presentation.js`
- `void-runner/game.js`
- `void-runner/hangar.css`
- `void-runner/hangar.js`
- `void-runner/input.js`
- `void-runner/menu.css`
- `void-runner/menu.js`
- `void-runner/missiles.js`
- `void-runner/save-manifest.json`
- `void-runner/scenes.js`
- `void-runner/ship-audio.js`
- `void-runner/story-content.js`
- `void-runner/story-scenes.js`
- `void-runner/story.js`
- `void-runner/targeting.js`
- `void_runner_api.py`
