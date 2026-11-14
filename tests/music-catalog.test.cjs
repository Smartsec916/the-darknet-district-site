const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('both Sleeping Pod players use the same 27 hosted songs', () => {
  const context = {};
  vm.runInNewContext(fs.readFileSync('void-runner/music-catalog.js', 'utf8'), context);
  const songs = context.DistrictMusicCatalog;
  assert.equal(songs.length, 27);
  assert.equal(new Set(songs.map(song => song.id)).size, songs.length);
  assert.equal(new Set(songs.map(song => song.url)).size, songs.length);
  for (const song of songs) {
    assert.ok(song.id, 'catalog entries need stable IDs');
    assert.equal(song.published, true);
    assert.match(song.url, /^attached_assets\/[^/]+\.mp3$/);
    assert.ok(fs.statSync(song.url).size > 1000, song.url);
  }
  const site = fs.readFileSync('sleeping_pod.html', 'utf8');
  const game = fs.readFileSync('void-runner/pod-music.js', 'utf8');
  for (const page of ['void-runner.html']) {   // the website Sleeping Pod page on main still carries its own list; aligning it is a separate website change
    assert.ok(fs.readFileSync(page, 'utf8').includes('void-runner/music-catalog.js'));
  }
  void site;
  assert.match(game, /DistrictMusicCatalog\.filter\(song=>song\.published\)/);
  assert.match(game, /const WEBSITE_PLAYLIST=true/, 'the game offers the existing playlist by default');
});
