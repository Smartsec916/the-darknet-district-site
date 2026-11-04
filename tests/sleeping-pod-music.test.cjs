// What must stay true in the source of the Sleeping Pod's personal music player ("My Music"). The behaviour itself is tests/sleeping-pod-music-browser.cjs.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const code = file => read(file).replace(/\/\*[^]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

test('privacy: the player\'s own songs are never sent anywhere (no network call, upload, socket, beacon or form in the music code)', () => {
  for (const file of ['sleeping-pod-music.js', 'sleeping-pod-playlist.js']) {
    assert.ok(!/fetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|FormData|EventSource|importScripts|firebase|navigator\.serviceWorker|\.postMessage/i.test(code(file)), file + ' makes a network call');
  }
});

test('playback uses object URLs of the picked files on the one existing audio element; nothing is read into memory or converted', () => {
  const music = code('sleeping-pod-music.js');
  assert.match(music, /URL\.createObjectURL\(t\.file\)/);
  assert.match(music, /revokeObjectURL/);
  assert.ok(!/new Audio\(|createElement\('audio'\)|FileReader|arrayBuffer\(|readAsDataURL|btoa\(/.test(music), 'no second audio element and no copy of the audio into strings');
});

test('the only storage is the opt-in IndexedDB copy on this device, behind the "Keep my songs" tick, plus one on/off flag', () => {
  const music = code('sleeping-pod-music.js');
  assert.match(music, /indexedDB\.open\(DB_NAME, 1\)/);
  assert.match(music, /KEEP_FLAG = 'darknet-pod-music-keep'/);
  assert.ok(!/localStorage\.setItem\((?!KEEP_FLAG)/.test(music) && !/sessionStorage|document\.cookie|caches\./.test(music));
  assert.match(music, /if \(keeping\) result\.added\.forEach\(keepTrack\)/, 'songs are stored only while the player has ticked the box');
  assert.match(music, /KEEP_LIMIT = 500 \* 1024 \* 1024/, 'a size limit');
});

test('the page keeps the website playlist as its own source and the one audio element the spectrum analyzer listens to', () => {
  const page = read('sleeping_pod.html');
  const tracks = (page.match(/'attached_assets\/[^']+\.mp3'/g) || []);
  assert.equal(tracks.length, 27, 'the website playlist still has its 27 songs');
  assert.equal((page.match(/<audio controls/g) || []).length, 1, 'one audio element for both sources');
  assert.match(page, /createPodSpectrum\(document\.getElementById\('podSpectrum'\), audioElement\)/);
  assert.match(page, /id="podSourceWebsite"[^]*id="podSourceMine"/);
  assert.match(page, /<script src="sleeping-pod-playlist\.js"><\/script>\s*<script src="sleeping-pod-music\.js"><\/script>/);
  assert.ok(page.indexOf('sleeping-pod-music.js') < page.indexOf('createPodMusic({'), 'the player code loads before the page uses it');
});

test('the file picker takes several files and the common browser formats, and has an accessible name', () => {
  const page = read('sleeping_pod.html');
  const input = /<input type="file" id="myMusicInput"[^>]*>/.exec(page)[0];
  assert.match(input, /\bmultiple\b/);
  for (const ext of ['audio/*', '.mp3', '.wav', '.ogg', '.m4a']) assert.ok(input.includes(ext), ext);
  assert.match(input, /aria-label=/);
  for (const id of ['myMusicAdd', 'myMusicShuffle', 'myMusicRepeat', 'myMusicClear', 'myMusicList', 'myMusicKeep']) assert.ok(page.includes('id="' + id + '"'), id);
});

test('a track change in progress is not interrupted by the old song ending, and a volume the player sets is remembered (both were real bugs)', () => {
  const page = read('sleeping_pod.html');
  assert.match(page, /if \(loadPending\) return;[^]*podMusic\.ended\(\)/);
  assert.match(page, /volumechange[^]*volumeMoved\(\)/);
  assert.match(page, /The player moved the volume control during the fade/);
});

test('the spectrum shares its levels for lighting that follows the music, and still reads the one audio element', () => {
  const spectrum = read('sleeping-pod-spectrum.js');
  assert.match(spectrum, /return \{ connect: connect, start: start, stop: stop, getLevels: getLevels \}/);
  assert.match(spectrum, /createMediaElementSource\(audio\)/);
});
