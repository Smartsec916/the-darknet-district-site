# Audio assets

No replacement canonical assets shipped yet. See VOID-RUNNER-BABYLON.md for GLB conventions. Existing reference artwork remains in void-runner/art/.

## Nightclub soundtrack (Cyber Club, NeoChinatown)

The club plays its own song, separate from NeoChinatown's score (`void-runner/ncz-club-audio.js`). Today that is an original
track generated live (`nightclub` in `void-runner/music-score.js`, 124 BPM house; no recorded or commercial music).
To install the final soundtrack: put a looping file at `void-runner/assets/audio/music/nightclub.ogg` (Opus/Ogg, stereo; mind
file size) and set `files.nightclub='void-runner/assets/audio/music/nightclub.ogg'` in `music-score.js`. The same speakers,
muffling and crossfades then apply to the file, which keeps playing and seeks to where it would be when you come back.
Tunable in `VoidClubAudio.config`: `crossfade` (seconds), `maxDistance`, wall/door loss and cut-offs, reverb, `panning` ('HRTF' for headphones).
