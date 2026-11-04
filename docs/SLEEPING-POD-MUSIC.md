# Sleeping Pod: your own music ("My Music")

On `sleeping_pod.html`, the music player now has two sources on the **one** player: the **Website playlist** (the existing 27 songs, unchanged) and **My music**, songs you pick from your own computer.

## How a player uses it
1. Press **Play Music** to open the player.
2. Press **My music**. The website song pauses where it is.
3. Press **Add songs** and choose one or many files (MP3, WAV, OGG, M4A and a few others; which ones play depends on the browser). The first song starts if nothing was playing. You can add more at any time during the same visit.
4. In the list: click a song to play it, **×** removes it. **Shuffle**, **Repeat** (off, all, one) and **Clear playlist** are above the list. **Previous / Next** are the player's existing buttons; the player's own control shows the track time, progress bar and volume. The song's name is under "Now playing".
5. Press **Website playlist** to go back. The website song resumes where it stopped. Your list stays as it was.

## Privacy: what happens to your files
- **They never leave your browser.** The page reads no audio data, makes no request, and uploads nothing (not to Render, Neon, Firebase, Tesana or anywhere else). A song is a file handle that the browser plays through a private address (`blob:`) that exists only in your tab. `tests/sleeping-pod-music.test.cjs` fails if the music code ever contains a network call, and the browser test checks that every request in a whole session was a plain GET with no body.
- **Nothing is copied into the game repository.** Test songs are generated on the spot by the test and written to `work/` (not committed).
- **Multiplayer:** this is entirely local. It adds no network traffic and sends nothing to other players, so other players can never hear or receive your music. When the pod becomes a multiplayer space (PR #191), the pod's private-audio rule is already met by this design: audio is played only by your own browser, and nothing about it needs to be synchronised.

## After you reload the page
**The browser will not let a page reopen files you chose earlier** (that would let any website read your disk). So by default your list is **empty after a reload** and you add the songs again. The page says this under the list.

**Optional: "Keep my songs in this browser"** (a tick box, off by default). When ticked, a copy of each song you add is saved in this browser's own storage (IndexedDB) on this device, so the list comes back after a reload and you can press play right away. Things to know:
- It is still **local only**; nothing is sent anywhere.
- It uses disk space (a limit of 500 MB of songs applies; a song over the limit still plays that visit but is not kept, and the page says so).
- Unticking the box, removing a song, or **Clear playlist** deletes the saved copies. Clearing your site data, or a browser under storage pressure, can also remove them. Private/incognito windows do not keep them.
- It does not work across browsers or devices (each browser has its own copy), and it is not tied to your account.
- A browser feature that remembers file *locations* without copying (the File System Access API) exists only in Chromium browsers and asks for permission again after each restart, so it was not used.

## What was reused
- The page's existing `<audio>` element, volume control, fades, **spectrum analyzer** (`sleeping-pod-spectrum.js`) and Previous/Next buttons. Both sources play through the same element, so the analyzer works for both without changes to how it draws.
- Ideas from the Tesana Sleeping Pod export's `MusicEngine`: local files through object URLs. Its Three.js code and its generated synth tracks were not needed here.

## What is new
| File | What it is |
|---|---|
| `sleeping-pod-playlist.js` | The rules for the personal list (what is next, previous, shuffle rounds, repeat, remove, de-duplication, which files count as audio). No DOM, no audio. Unit tested in Node, and reusable by the 3D game's pod later. |
| `sleeping-pod-music.js` | The part that touches the page: file picker, the list, plays files through object URLs, the optional browser-local keep. |
| `sleeping_pod.html` | The source switch, the My Music panel, and small changes so both sources share one loader. |
| `sleeping-pod-spectrum.js` | Adds `getLevels()` (smoothed bass/mid/high, 0 to 1) so lighting can follow the music later. |

## Two existing faults fixed along the way (they would have broken My Music)
- **Volume reset on every track.** The player's volume control was undone at each track change (the fade always went back to 100%). The level you set is now kept for both sources.
- **A song ending during a track change** could cancel or double the change. The player now ignores that moment.

## Music-reactive lighting
The website page has no music-reactive lighting today (only a dim-the-lights button and the spectrum), so there was nothing to keep working there. `spectrum.getLevels()` is the hook for it. The Tesana pod's "Music Sync" lighting preset is a candidate for the 3D pod and would read the same levels.

## Not done / limits
- Playlists are not named, saved as files, or shared; there is no drag-to-reorder and no seek or volume widget of our own (the browser's audio control provides time, progress and volume).
- **Shuffle and Repeat apply to My Music.** The website playlist keeps its own behaviour (it shuffles itself each round).
- Format support belongs to the browser. A file the browser cannot play (for example M4A in a browser build without AAC, or FLAC in an old browser) is refused at the picker with a message, or skipped with a message if it fails later.
- Desktop browsers were tested (Chromium, Edge channel when present). Firefox, Safari and phones were not.
- This is the website's Sleeping Pod page. Bringing the same player into the 3D game's pod belongs to the pod integration work in PR #191; the playlist rules and this controller are written so that work can reuse them (it needs only an audio element and the markup ids).

## Tests
- `node --test tests/sleeping-pod-playlist.test.cjs tests/sleeping-pod-music.test.cjs` (part of `npm test`).
- `node tests/sleeping-pod-music-browser.cjs` (needs Playwright; uses `ffmpeg` for OGG/MP3/M4A test files if installed). 24 checks: playback of picked files, switching sources, next/previous, shuffle, repeat one and all, remove, clear, volume, spectrum pixels and levels for both sources, bad files, optional keep across a reload, no uploads, desktop and phone layout. Screenshots go to `work/pod-music/`.
