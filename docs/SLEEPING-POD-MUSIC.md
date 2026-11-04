# Pod music: the wall player in the District's sleeping-pod room

A music player is mounted on the **south wall of the sleeping-pod room** in the 3D Darknet District (the room with the stacked sleep pods, west of the main hall). It plays the **Darknet District website playlist** or **your own songs from your computer**, and the room's lights move with the music.

**The website's Sleeping Pod page (`sleeping_pod.html`) is not touched.** Its player, playlist, appearance and behaviour are exactly as they were, on desktop and on phones. No personal-music feature was added to the website or the mobile pages, and the Iris chatbot is not part of the game.

## How a player uses it
1. Walk up to the wall screen in the pod room. It shows the song, the position, and a live LED spectrum. Press **E** at "POD MUSIC SCREEN" to open the player.
2. Choose **Website playlist** (the 27 songs of the website's Sleeping Pod page, streamed from the site) or **My music**.
3. In **My music**: **Add songs** opens the browser's file picker (several files at once; MP3, WAV, OGG, M4A and a few others, depending on the browser). The first song starts if nothing was playing. Add more at any time.
4. **Play/Pause, Previous, Next, Shuffle, Repeat** (off, all, one), a **volume** slider, a clickable **progress bar** with the time, and the song's name. In the list, click a song to play it; **×** removes it; **Clear playlist** empties the list.
5. **Return to gameplay** closes the panel. The music keeps playing and the wall screen keeps showing it.
6. The music belongs to the District: it pauses when you leave it (it is not saved, and it does not restart by itself).

## Privacy and multiplayer
- **Your files never leave your browser.** Songs are played through private `blob:` addresses that exist only in your tab. The player makes no request with your files, uploads nothing (not to Render, Neon, Firebase, Tesana or anywhere), and copies nothing into the repository. `tests/pod-music-browser.cjs` checks that every request in a whole session was a plain GET with no body and no song name.
- **Nobody else can hear it.** The sound is played by your own browser through the game's music channel. It is not part of the campaign save, the cloud save, or any multiplayer state, and it adds no network traffic. When pods become shared multiplayer rooms (PR #191), pod audio isolation is already satisfied for this feature: there is nothing to synchronise and nothing to leak.
- The website playlist is the site's own songs, streamed from the site (the same files the website's pod page already serves).

## After you reload the game
**A browser will not let a page reopen files you chose earlier.** (That would let any website read your disk.) So by default your **list is empty after a reload** and you add the songs again. The panel says so.

**Optional: "Keep my songs in this browser"** (a tick box, off by default). When ticked, a copy of each song you add is saved in this browser's own storage (IndexedDB) on this device, so the list comes back after a reload and you can press play at once.
- Still local only; nothing is sent anywhere.
- It uses disk space (a 500 MB limit applies; a song over the limit still plays that visit but is not kept, and the panel says so).
- Unticking, removing a song, or Clear playlist deletes the saved copies. Clearing your site data, or a browser short of space, can remove them too. Private windows do not keep them. Each browser and device has its own copy; it is not tied to your account.
- A browser feature that remembers file *locations* without copying (File System Access API) exists only in Chromium browsers and asks permission again after every restart, so it was not used.

## How it is built
| File | What it is |
|---|---|
| `void-runner/pod-playlist.js` | The rules of the list: what is next, previous, shuffle rounds, repeat, remove, no duplicates, which files count as audio. Pure logic, no audio, no page. Unit tested in Node (`tests/pod-playlist.test.cjs`). |
| `void-runner/pod-music.js` | The player: file picker, playback through `VoidAudio.connectMedia` (the game's own music channel, so music volume, mute and suspend apply), the LED spectrum analyser, the panel, the optional browser-local keep. |
| `void-runner/neochinatown.js` | The wall screen (3.4 m wide, on the room-side face of the 0.4 m pod-room wall), its E interaction point, and the music-reactive lighting (below). |
| `void-runner/music-integration.js` | While pod music plays, the city score steps aside; pod music pauses when the player leaves the District. |

**Music-reactive lighting.** No light was added (extra lights are costly on the GPU: on the integration build, two extra lamps from PR #181 pushed the high-quality tier past the GPU's limit on lights and broke shader compilation). Instead the music drives what is already there: the pink lamp over the pods (high quality), the ceiling panels, the pods' inner glow, and a new LED strip along both long walls of the room that shifts from magenta to cyan with the treble and brightens with the beat. Everything returns to its exact resting level when the music stops.

## What was reused
- The **LED spectrum** look and maths (24 columns, green/yellow/red, peak caps) from the website's `sleeping-pod-spectrum.js`, redrawn for the wall screen and the panel.
- The **website playlist** (the 27 songs and names from `sleeping_pod.html`).
- The idea of local files through object URLs and a wall-mounted player from the Tesana Sleeping Pod export; none of its Three.js code was used (it is a different engine, see the asset audit).

## Not done / limits
- **Shuffle and Repeat** apply to whichever source is open (each source keeps its own list state).
- There are no saved or named playlists, no drag-to-reorder and no per-pod preferences yet. Per-pod settings and pod audio isolation from hallway sound belong to the pod allocator work in PR #191.
- Format support belongs to the browser. A file the browser cannot play is refused at the picker, or marked and skipped with a message if it fails later.
- Desktop Chromium was tested (software rendering). Firefox, Safari, phones and a real GPU were not. The phone site is unchanged and not part of this.
- The wall screen is read, not clicked: the controls are in the panel opened with **E**.
- Some website song titles contain strong language and "(Cover)" labels. They are the site's existing playlist, unchanged, and are flagged for the unresolved age-policy and music-licensing review (PR #191).

## Merge notes
- This branch is based on `main`. `neochinatown.js` is also edited by the open District PRs (#181 entrance lamps, #187 area separation). The change here is two additions (one interaction line and one self-contained block that is created inside the existing build function plus one `podScreen.tick(dt)` call). Merging in any order should need only a hand-merge of those lines. In the area-separated build the screen and pod strips belong to the **interior** area and must be built only there.
- `void-runner-sw.js` `BUILD` is bumped; the admin inventory is regenerated; `static/void-runner.html` is synced.

## Tests
- `npm test` includes `tests/pod-playlist.test.cjs` (15 tests of the list rules).
- `node tests/pod-music-browser.cjs [low|high]` (needs the local server `node tests/serve-modern.cjs`, Playwright, and ideally `ffmpeg` for OGG/MP3 test files). It boots the real game into the District and checks: the screen is on the wall and visible in the rendered picture; E opens the player; the website playlist plays and moves the spectrum and the room light; a picked file plays (several at once, a non-audio file is skipped with a message); songs advance and stop at the end; Next/Previous, shuffle, repeat one/all, volume, remove, clear; a broken file is skipped and an all-broken list says so; OGG and MP3; the strip pulses with a beat; the panel closes and the music continues; leaving the District pauses it; keep-in-browser survives a reload and unticking removes it; no upload, and no script errors. Screenshots go to `work/pod-music/`.
