# Loading, menu, voices and departure fixes

Apply this update on top of the Babylon foundation (`d759a5f`) / the deployed equivalent. The ZIP contains changed/new files with repository paths. Extract and upload those files to a new branch; do not upload the ZIP or flatten directories. This task does not push, merge or deploy anything.

## Changes

- Startup progress moves smoothly toward required loading stages and keeps advancing during an asset wait. It is explicitly estimated, with elapsed time, and never delays a ready game. Optional account initialization no longer overwrites the essential-art loading message. Failed startup stops the indicator and offers Retry.
- Main-menu account status says SIGNED IN without revealing the Google display name or email. Account details remain on the explicitly opened account page. No new username requirement or account migration.
- Back is the first control on Settings.
- Automatic speech selection uses known masculine/feminine voice names, prefers natural/enhanced voices when available, and uses character-specific pacing/preferences instead of voice-list indices. Mara uses a mature, measured profile; Elias an older, warm profile. Every character has a manual voice override in Settings → Character voices, saved on this browser. If no known matching voice exists, automatic mode leaves subtitles instead of knowingly assigning the wrong presentation. Unknown voices can be selected manually. Empty initial voice catalogs get a delayed retry that is cancelled when dialogue changes.
- Babylon departure now shows an activity indicator, elapsed time, and preparation stages. Cancel is briefly disabled to prevent a second click on Board/Launch from cancelling the newly opened loading panel.
- Relaunching after cancelling a pending preparation now shows preparation and waits for the previous work to settle before starting the new flight. Previously that click returned silently while an old preparation promise existed.
- Cancelling the first departure keeps the player at a Vesper departure screen. The save format historically anchors the opening route at Meridian; displaying the ordinary station menu for that unfinished route misleadingly showed Meridian before the player flew there. The original opening flight and campaign transitions are retained.
- Account focus-refresh attempts are limited to one per minute during outages, reducing repeated network errors when switching between the page and developer tools.

## Verification

48 JavaScript unit tests passed. Seven browser suites passed: launch-menu-fixes-browser, menu-browser, account-menu-browser, audio-browser, startup-speed, babylon-recovery-browser, and babylon-piloted-browser. Tests use headless Microsoft Edge/Chromium on this machine.

The new regression suite clicks through the actual new-campaign/Mara dialogue in both renderers, verifies flight starts before any delivery, and cancels/relaunches an unfinished preparation while account services fail. It also checks gradual progress during delayed artwork, privacy and Back placement. The Babylon pilot completed the four opening routes with real flight/combat logic. Startup remained about 362 ms with an unrelated image request held open. Settings screenshot inspected.

## Limits and screenshot logs

The supplied screenshots show Render API 429/503 responses and missing CORS headers on those responses. Client retry throttling does not repair an unavailable hosted API; that service still needs operational attention if the errors persist. Local flight was verified with those optional services unavailable. The Babylon source-map 404 is for a developer debugging file, not the game engine itself.

The exact Firefox session was not reproduced. The confirmed cancellation/relaunch failure and misleading opening-station fallback are fixed, but the screenshots alone cannot establish every cause of the reported launch failure. Failed or timed-out 3D preparation retains Retry and Original Renderer recovery.

Browser speech cannot guarantee acting quality, exact age or emotional delivery across devices. These changes improve casting and pacing; no recorded dialogue, new paid speech service or human-quality performance is claimed.
