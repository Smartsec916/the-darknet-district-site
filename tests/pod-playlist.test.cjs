// The rules of the player's own playlist ("My Music") on the Sleeping Pod page: which song is next, previous or current. The page behaviour is tests/sleeping-pod-music-browser.cjs.
const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../sleeping-pod-playlist.js');

const songs = names => names.map((name, i) => ({ name, size: 1000 + i, lastModified: 1 }));
const make = (names, random) => { const p = P.createPlaylist({ random }); p.add(songs(names)); return p; };
const labels = (p, ids) => ids.map(id => p.find(id).label);
// a fixed "random" so a shuffle is repeatable
const sequence = values => { let i = 0; return () => values[i++ % values.length]; };

test('what counts as a song: audio types and known audio extensions, nothing else', () => {
  for (const name of ['a.mp3', 'B.WAV', 'c.ogg', 'd.m4a', 'e.flac', 'f.opus', 'g.aac']) assert.ok(P.isAudioFile({ name, type: '' }), name);
  assert.ok(P.isAudioFile({ name: 'noext', type: 'audio/mpeg' }));
  for (const name of ['notes.txt', 'cover.jpg', 'movie.mp4', 'archive.zip', 'noext']) assert.ok(!P.isAudioFile({ name, type: '' }), name);
  assert.ok(!P.isAudioFile(null));
});

test('track labels are the file name without folder or extension', () => {
  assert.equal(P.trackName('Night Drive.mp3'), 'Night Drive');
  assert.equal(P.trackName('C:\\Music\\Neon   Rain.WAV'), 'Neon Rain');
  assert.equal(P.trackName('a.b.c.ogg'), 'a.b.c');
  assert.equal(P.trackName('.mp3'), 'Untitled');
  assert.equal(P.trackName('track.unknown'), 'track.unknown');
});

test('time is shown as m:ss and never as NaN', () => {
  assert.equal(P.formatTime(0), '0:00'); assert.equal(P.formatTime(65.9), '1:05'); assert.equal(P.formatTime(NaN), '0:00'); assert.equal(P.formatTime(Infinity), '0:00');
});

test('adding songs: the same file is not added twice; a different file with the same name is', () => {
  const p = P.createPlaylist();
  const first = p.add([{ name: 'a.mp3', size: 10, lastModified: 5 }, { name: 'b.mp3', size: 20, lastModified: 5 }]);
  assert.equal(first.added.length, 2); assert.equal(first.skipped, 0);
  const again = p.add([{ name: 'a.mp3', size: 10, lastModified: 5 }, { name: 'a.mp3', size: 99, lastModified: 5 }]);
  assert.equal(again.added.length, 1); assert.equal(again.skipped, 1);
  assert.equal(p.size, 3);
  assert.equal(new Set(p.tracks.map(t => t.id)).size, 3, 'ids are unique');
});

test('in order, Repeat Off: the list plays through and then stops; pressing Next at the end wraps', () => {
  const p = make(['a.mp3', 'b.mp3', 'c.mp3']);
  assert.equal(p.currentId, null);
  assert.equal(p.find(p.next(false)).label, 'a');
  assert.equal(p.find(p.next(true)).label, 'b');
  assert.equal(p.find(p.next(true)).label, 'c');
  assert.equal(p.next(true), null, 'the last song ended: stop');
  assert.equal(p.find(p.currentId).label, 'c', 'the current song is unchanged by a stop');
  assert.equal(p.find(p.next(false)).label, 'a', 'the Next button wraps');
});

test('Repeat All wraps by itself; Repeat One replays the song only when it ends, not when Next is pressed', () => {
  const p = make(['a.mp3', 'b.mp3']);
  p.setRepeat('all'); p.next(false); p.next(true);
  assert.equal(p.find(p.next(true)).label, 'a', 'Repeat All: back to the start');
  p.setRepeat('one');
  const a = p.currentId;
  assert.equal(p.next(true), a, 'Repeat One: the same song again');
  assert.equal(p.find(p.next(false)).label, 'b', 'the Next button still moves on');
  assert.equal(p.cycleRepeat(), 'off'); assert.equal(p.cycleRepeat(), 'all'); assert.equal(p.cycleRepeat(), 'one');
});

test('Previous goes back one song and wraps from the first to the last', () => {
  const p = make(['a.mp3', 'b.mp3', 'c.mp3']);
  p.select(p.tracks[1].id);
  assert.equal(p.find(p.previous()).label, 'a');
  assert.equal(p.find(p.previous()).label, 'c');
});

test('shuffle plays every song once per round, never the current one twice in a row, and Previous retraces what was played', () => {
  const p = make(['a.mp3', 'b.mp3', 'c.mp3', 'd.mp3', 'e.mp3'], sequence([.9, .1, .5, .3, .7, .2]));
  p.select(p.tracks[0].id); p.setShuffle(true);
  const played = [p.currentId]; for (let i = 0; i < 4; i++) played.push(p.next(true));
  assert.equal(new Set(played).size, 5, 'one round covers every song exactly once');
  assert.equal(p.next(true), null, 'Repeat Off: the round ended, so stop');
  p.setRepeat('all');
  const second = []; for (let i = 0; i < 5; i++) { const id = p.next(true); second.push(id); }
  assert.equal(new Set(second).size, 5, 'Repeat All starts a fresh round');
  assert.notEqual(second[0], played[4], 'the new round does not start by repeating the song that just played');
  const last = p.currentId, before = second[3];
  assert.equal(p.previous(), before, 'Previous returns to the song played before');
  assert.equal(p.next(false), last, 'and Next goes forward again to the same song');
});

test('turning shuffle off keeps the current song and returns to list order', () => {
  const p = make(['a.mp3', 'b.mp3', 'c.mp3'], sequence([.2, .8]));
  p.select(p.tracks[1].id); p.setShuffle(true); p.setShuffle(false);
  assert.equal(p.find(p.currentId).label, 'b');
  assert.equal(p.find(p.next(true)).label, 'c');
});

test('songs added while shuffling join the current round', () => {
  const p = make(['a.mp3', 'b.mp3'], sequence([.5]));
  p.select(p.tracks[0].id); p.setShuffle(true);
  p.add(songs(['x.mp3', 'y.mp3']).map((s, i) => ({ ...s, name: 'new' + i + '.mp3', size: 5000 + i })));
  const ids = []; for (let i = 0; i < 3; i++) ids.push(p.next(true));
  assert.equal(new Set(ids).size, 3);
  assert.equal(p.next(true), null);
});

test('removing: a song that is not playing just leaves; the playing one hands over to the song that takes its place', () => {
  const p = make(['a.mp3', 'b.mp3', 'c.mp3']);
  const [a, b, c] = p.tracks.map(t => t.id);
  p.select(b);
  assert.deepEqual(p.remove(a), { removed: true, wasCurrent: false, replacement: null });
  assert.equal(p.currentId, b);
  const out = p.remove(b);
  assert.ok(out.wasCurrent); assert.equal(out.replacement, c); assert.equal(p.currentId, c);
  const last = p.remove(c);
  assert.ok(last.wasCurrent); assert.equal(last.replacement, null); assert.equal(p.currentId, null); assert.equal(p.size, 0);
  assert.equal(p.remove('nope').removed, false);
  assert.equal(p.next(false), null, 'an empty list has nothing to play');
});

test('removing the last song of the list while it plays moves to the new last song', () => {
  const p = make(['a.mp3', 'b.mp3', 'c.mp3']);
  const [, b, c] = p.tracks.map(t => t.id); p.select(c);
  assert.equal(p.remove(c).replacement, b);
});

test('a removed song never comes back in a shuffle round or in Previous', () => {
  const p = make(['a.mp3', 'b.mp3', 'c.mp3', 'd.mp3'], sequence([.3, .6, .1]));
  const [a, b] = p.tracks.map(t => t.id);
  p.select(a); p.setShuffle(true); const second = p.next(true); p.remove(b);
  const rest = []; for (let i = 0; i < 4; i++) { const id = p.next(true); if (id) rest.push(id); }
  assert.ok(!rest.includes(b)); assert.notEqual(p.previous(), b); void second;
});

test('clear empties the list and everything that depends on it', () => {
  const p = make(['a.mp3', 'b.mp3']); p.next(false); p.setShuffle(true);
  p.clear();
  assert.equal(p.size, 0); assert.equal(p.currentId, null); assert.equal(p.next(true), null); assert.equal(p.previous(), null);
  assert.equal(p.add(songs(['a.mp3'])).added.length, 1, 'the same file can be added again after a clear');
});

test('the model holds no audio and sends nothing: it never touches the network, storage or the DOM', () => {
  const src = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'sleeping-pod-playlist.js'), 'utf8').replace(/\/\*[^]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  assert.ok(!/fetch\(|XMLHttpRequest|WebSocket|sendBeacon|localStorage|indexedDB|document\.|new Audio|FormData/.test(src));
});
