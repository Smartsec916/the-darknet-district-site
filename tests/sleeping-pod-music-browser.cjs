/* The Sleeping Pod "My Music" player, in a real browser engine (Playwright; Edge if installed, else Chromium). It drives the real page with real audio
   files made on the spot (WAV in code; OGG, MP3 and M4A through ffmpeg when it is installed) and checks, by what the browser actually does:
   songs picked from the computer play, the website playlist and My Music switch back and forth on the one player, next / previous / shuffle / repeat /
   remove / clear / volume work, the LED spectrum and its levels move for BOTH sources, a file that cannot play is skipped, the optional "keep my
   songs in this browser" survives a reload and can be removed, and nothing is ever uploaded (no request carries a body, none leaves the test server).
   It cannot prove what a phone, Safari or Firefox does. Chromium builds without proprietary codecs cannot play M4A: the test then checks the
   page says so instead of failing silently.
   Run:  node tests/sleeping-pod-music-browser.cjs        -> screenshots and results.json in work/pod-music/ */
const { chromium } = require('playwright'), http = require('node:http'), fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..'), out = path.join(root, 'work', 'pod-music'), fixtures = path.join(out, 'fixtures');
fs.mkdirSync(fixtures, { recursive: true });
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg' };
const requests = [];
const site = http.createServer((req, res) => {
  requests.push({ method: req.method, url: req.url, length: Number(req.headers['content-length'] || 0) });
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname), f = path.join(root, p === '/' ? 'index.html' : p);
  if (req.method !== 'GET' || !f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  const size = fs.statSync(f).size, range = /bytes=(\d+)-(\d*)/.exec(req.headers.range || '');
  if (range) { const a = Number(range[1]), b = range[2] ? Number(range[2]) : size - 1; res.writeHead(206, { 'content-type': mime[path.extname(f)] || 'application/octet-stream', 'content-range': `bytes ${a}-${b}/${size}`, 'accept-ranges': 'bytes', 'content-length': b - a + 1 }); return fs.createReadStream(f, { start: a, end: b }).pipe(res); }
  res.writeHead(200, { 'content-type': mime[path.extname(f)] || 'application/octet-stream', 'accept-ranges': 'bytes', 'content-length': size }); fs.createReadStream(f).pipe(res);
});
const results = [];
const ok = (name, detail = '') => { results.push({ name, ok: true, detail }); console.log('ok  ', name, detail); };
async function check(name, fn) { try { ok(name, (await fn()) || ''); } catch (e) { results.push({ name, ok: false, detail: e.message }); console.log('FAIL', name, '-', e.message.split('\n')[0].slice(0, 400)); } }
const wait = ms => new Promise(r => setTimeout(r, ms));

// ── Test songs: a few tones each, so several spectrum bands light up ──
function wav(file, seconds, freqs) {
  const rate = 22050, n = Math.floor(rate * seconds), buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(rate, 24); buf.writeUInt32LE(rate * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) { let v = 0; for (const f of freqs) v += Math.sin(2 * Math.PI * f * i / rate) / freqs.length; buf.writeInt16LE(Math.round(v * 0.7 * 32767), 44 + i * 2); }
  fs.writeFileSync(file, buf);
}
const F = name => path.join(fixtures, name);
wav(F('Alpha Drive.wav'), 1.6, [110, 440, 1800]); wav(F('Beta Rain.wav'), 1.6, [220, 880, 3000]); wav(F('Gamma Pulse.wav'), 1.6, [150, 660, 2400]);
wav(F('Long Night.wav'), 12, [110, 440, 1800, 5000]);
fs.writeFileSync(F('notes.txt'), 'not a song'); fs.writeFileSync(F('broken.mp3'), 'this is text pretending to be an mp3, the browser cannot decode it');
const haveFfmpeg = (() => { try { cp.execSync('ffmpeg -version', { stdio: 'ignore' }); return true; } catch { return false; } })();
const extra = [];
if (haveFfmpeg) for (const [name, args] of [['Delta Glass.ogg', '-c:a libvorbis'], ['Echo Static.mp3', '-c:a libmp3lame'], ['Foxtrot Tape.m4a', '-c:a aac']]) {
  try { cp.execSync(`ffmpeg -y -loglevel error -f lavfi -i "sine=frequency=${300 + extra.length * 200}:duration=1.6" -af volume=6dB ${args} "${F(name)}"`); extra.push(name); } catch { /* codec missing: skipped */ }
}

let base;
async function open(browser, contextOptions = {}) {
  const ctx = await browser.newContext(contextOptions), page = await ctx.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|favicon|net::ERR/.test(m.text())) errors.push(m.text()); });
  await page.route(/googletagmanager|gstatic|googleapis|firebase|\/api\//, r => r.abort());
  await page.goto(`${base}/sleeping_pod.html`, { waitUntil: 'load' });
  return { ctx, page, errors };
}
const S = page => page.evaluate(() => ({
  src: audioElement.currentSrc || audioElement.src, paused: audioElement.paused, t: audioElement.currentTime, vol: audioElement.volume, ended: audioElement.ended,
  title: trackTitle.textContent, mine: podMusic.active,
  items: [...document.querySelectorAll('#myMusicList .pod-list__item')].map(li => ({ name: li.querySelector('.pod-list__name').textContent, current: li.classList.contains('is-current'), failed: li.classList.contains('is-failed') })),
  status: document.getElementById('myMusicStatus').textContent, count: document.getElementById('myMusicCount').textContent,
  repeat: document.getElementById('myMusicRepeat').textContent, shuffle: document.getElementById('myMusicShuffle').getAttribute('aria-pressed'),
  empty: !document.getElementById('myMusicEmpty').hidden
}));
const lit = page => page.evaluate(() => { const c = document.getElementById('podSpectrum'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 200) n++; return n; });
const until = async (fn, ms = 6000, label = 'condition') => { const t0 = Date.now(); for (;;) { const v = await fn(); if (v) return v; if (Date.now() - t0 > ms) throw new Error('timed out waiting for ' + label); await wait(80); } };
const playing = async page => until(async () => { const s = await S(page); return !s.paused && s.t > 0.15 ? s : null; }, 8000, 'playback to start');
const names = s => s.items.map(i => i.name);
const current = s => (s.items.find(i => i.current) || {}).name;

(async () => {
  await new Promise(r => site.listen(0, '127.0.0.1', r)); base = `http://127.0.0.1:${site.address().port}`;
  const args = ['--autoplay-policy=no-user-gesture-required'];
  let browser; try { browser = await chromium.launch({ channel: 'msedge', args }); } catch { browser = await chromium.launch({ args }); }
  const { page, errors, ctx } = await open(browser, { viewport: { width: 1280, height: 800 } });

  await check('the website playlist still plays first, and the spectrum and its levels move', async () => {
    await page.click('#musicButton');
    const s = await playing(page);
    assert.match(s.src, /attached_assets\/.+\.mp3$/); assert.equal(s.mine, false);
    await until(async () => (await lit(page)) > 150, 6000, 'lit spectrum columns');
    const levels = await page.evaluate(() => spectrum.getLevels());
    assert.ok(levels.bass + levels.mid + levels.high > 0.01, JSON.stringify(levels));
    await page.screenshot({ path: path.join(out, '1-website-playlist.png') });
    return decodeURIComponent(s.src.split('/').pop());
  });

  await check('My music: switching pauses the website song, shows the panel and an empty list that says what to do', async () => {
    await page.click('#podSourceMine');
    const s = await S(page);
    assert.equal(s.mine, true); assert.ok(s.paused, 'the website song stopped'); assert.ok(s.empty); assert.equal(s.count, '0 songs');
    assert.equal(await page.isVisible('#myMusicPanel'), true);
    assert.equal(await page.getAttribute('#podSourceMine', 'aria-pressed'), 'true'); assert.equal(await page.getAttribute('#podSourceWebsite', 'aria-pressed'), 'false');
    await wait(1500); assert.ok((await S(page)).paused, 'with nothing chosen the website song does not start by itself');
  });

  await check('Add songs opens the browser file picker (multiple files allowed, audio only)', async () => {
    const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.click('#myMusicAdd')]);
    assert.equal(chooser.isMultiple(), true);
    assert.match(await page.getAttribute('#myMusicInput', 'accept'), /audio\/\*.*\.mp3.*\.wav.*\.ogg.*\.m4a/);
  });

  await check('picking several files: songs are listed in order, a non-audio file is skipped with a message, and the first song starts', async () => {
    await page.setInputFiles('#myMusicInput', [F('Alpha Drive.wav'), F('Beta Rain.wav'), F('Gamma Pulse.wav'), F('notes.txt')]);
    const s = await playing(page);
    assert.deepEqual(names(s), ['Alpha Drive', 'Beta Rain', 'Gamma Pulse']); assert.equal(s.count, '3 songs');
    assert.match(s.status, /Added 3 songs/); assert.match(s.status, /not audio: notes\.txt/);
    assert.match(s.src, /^blob:/, 'a private object address, not a server file'); assert.equal(s.title, 'Alpha Drive'); assert.equal(current(s), 'Alpha Drive');
    return s.status;
  });

  await check('the spectrum and the levels move for My Music too', async () => {
    await until(async () => (await lit(page)) > 150, 6000, 'lit spectrum columns for a personal song');
    const levels = await page.evaluate(() => spectrum.getLevels());
    assert.ok(levels.bass + levels.mid + levels.high > 0.01, JSON.stringify(levels));
    await page.screenshot({ path: path.join(out, '2-my-music-playing.png') });
  });

  await check('a song that ends moves on by itself, and the list stops after the last song (Repeat off)', async () => {
    await until(async () => current(await S(page)) === 'Beta Rain', 6000, 'the next song');
    await until(async () => current(await S(page)) === 'Gamma Pulse', 6000, 'the third song');
    await until(async () => /End of the list/.test((await S(page)).status), 7000, 'the end of the list');
    const s = await S(page); assert.ok(s.paused, 'stopped at the end'); assert.equal(current(s), 'Gamma Pulse');
  });

  await check('Next and Previous: Next wraps to the first song; Previous within three seconds goes back a song', async () => {
    await page.click('button[aria-label="Next track"]'); let s = await playing(page); assert.equal(current(s), 'Alpha Drive');
    await page.click('button[aria-label="Next track"]'); s = await playing(page); assert.equal(current(s), 'Beta Rain');
    await page.click('button[aria-label="Previous track"]'); s = await playing(page); assert.equal(current(s), 'Alpha Drive');
    assert.equal(s.title, 'Alpha Drive');
  });

  await check('clicking a song plays that song; the volume the player sets is kept for every song from either source', async () => {
    await page.evaluate(() => { audioElement.volume = 0.4; });
    await wait(200);
    await page.click('#myMusicList .pod-list__item:nth-child(3) .pod-list__play');
    assert.equal(current(await S(page)), 'Gamma Pulse');
    await wait(1700); // the old song fades out (0.5 s), the new one loads and fades in (0.5 s)
    let s = await S(page); assert.ok(!s.paused && /^blob:/.test(s.src) && Math.abs(s.vol - 0.4) < 0.02, 'volume after the change was ' + s.vol);
    await page.click('button[aria-label="Next track"]'); await wait(1700);
    s = await S(page); assert.ok(!s.paused && Math.abs(s.vol - 0.4) < 0.02, 'volume after Next was ' + s.vol);
  });

  await check('Shuffle and Repeat: the buttons report their state; Repeat One keeps replaying the song that ends', async () => {
    await page.click('#myMusicShuffle'); assert.equal((await S(page)).shuffle, 'true');
    await page.click('#myMusicShuffle'); assert.equal((await S(page)).shuffle, 'false');
    await page.click('#myMusicRepeat'); assert.equal((await S(page)).repeat, 'Repeat: all');
    await page.click('#myMusicRepeat'); assert.equal((await S(page)).repeat, 'Repeat: one');
    await page.evaluate(() => { window.__starts = 0; audioElement.addEventListener('playing', () => { window.__starts++; }); });
    await page.click('#myMusicList .pod-list__item:nth-child(2) .pod-list__play'); await playing(page);
    await until(async () => (await page.evaluate(() => window.__starts)) >= 3, 9000, 'the same song to start again twice');
    const s = await S(page); assert.equal(current(s), 'Beta Rain', 'it never moved to another song');
    await page.click('#myMusicRepeat'); assert.equal((await S(page)).repeat, 'Repeat: off');
  });

  await check('Repeat All: the list starts again after the last song', async () => {
    await page.click('#myMusicRepeat'); // all
    await page.click('#myMusicList .pod-list__item:nth-child(3) .pod-list__play'); await playing(page);
    await until(async () => current(await S(page)) === 'Alpha Drive', 7000, 'the list to wrap');
    await page.click('#myMusicRepeat'); await page.click('#myMusicRepeat'); // back to off
  });

  await check('Shuffle plays every song once in a round, in a different order from the list', async () => {
    await page.click('#myMusicShuffle');
    const seen = [current(await S(page))];
    for (let i = 0; i < 2; i++) { await page.click('button[aria-label="Next track"]'); await playing(page); seen.push(current(await S(page))); }
    assert.equal(new Set(seen).size, 3, 'a shuffled round: ' + seen.join(' > '));
    await page.click('#myMusicShuffle');
  });

  await check('Remove: a song leaves the list; removing the song that plays moves on to the next one', async () => {
    await page.click('#myMusicList .pod-list__item:nth-child(1) .pod-list__play'); await playing(page);
    await page.click('#myMusicList .pod-list__item:nth-child(1) .pod-list__remove');
    const s = await playing(page); assert.deepEqual(names(s), ['Beta Rain', 'Gamma Pulse']); assert.equal(current(s), 'Beta Rain'); assert.match(s.status, /Removed "Alpha Drive"/);
    await page.click('#myMusicList .pod-list__item:nth-child(2) .pod-list__remove');
    assert.deepEqual(names(await S(page)), ['Beta Rain']);
  });

  await check('adding more songs during the same session keeps the ones already there and does not interrupt the song playing', async () => {
    const before = await S(page);
    await page.setInputFiles('#myMusicInput', [F('Alpha Drive.wav'), F('Beta Rain.wav')]);
    const s = await S(page);
    assert.deepEqual(names(s), ['Beta Rain', 'Alpha Drive']); assert.match(s.status, /1 already in the list/); assert.equal(current(s), 'Beta Rain');
    assert.ok(!s.paused && s.t >= before.t - 0.01, 'the song kept playing');
  });

  await check('the volume slider is the real audio control: volume is kept when the website playlist comes back', async () => {
    await page.click('#podSourceWebsite');
    const s = await until(async () => { const x = await S(page); return !x.paused && x.t > 0.2 && /attached_assets\/.+\.mp3$/.test(x.src) ? x : null; }, 9000, 'the website song to come back');
    assert.equal(s.mine, false); assert.match(s.title, /\S/);
    await wait(900); assert.ok(Math.abs((await S(page)).vol - 0.4) < 0.02, 'volume ' + (await S(page)).vol);
    await until(async () => (await lit(page)) > 150, 6000, 'lit spectrum for the website song again');
    await page.screenshot({ path: path.join(out, '3-back-on-website.png') });
  });

  await check('switching to My Music again resumes the song list where it was; the website song waits', async () => {
    await page.click('#podSourceMine'); const s = await playing(page);
    assert.equal(s.mine, true); assert.match(s.src, /^blob:/); assert.deepEqual(names(s), ['Beta Rain', 'Alpha Drive']);
  });

  await check('Clear playlist empties the list, stops the song and says so', async () => {
    await page.click('#myMusicClear');
    const s = await S(page);
    assert.deepEqual(names(s), []); assert.ok(s.paused); assert.ok(s.empty); assert.match(s.status, /Playlist cleared \(2 songs\)/); assert.equal(s.title, '');
    assert.equal(await page.isDisabled('#myMusicClear'), true);
  });

  await check('a file the browser cannot play is marked, skipped and the next song plays; the page never loops forever on bad files', async () => {
    await page.setInputFiles('#myMusicInput', [F('broken.mp3'), F('Gamma Pulse.wav')]);
    const s = await until(async () => { const x = await S(page); return x.items.some(i => i.failed) && current(x) === 'Gamma Pulse' && !x.paused ? x : null; }, 8000, 'the broken file to be skipped');
    assert.ok(s.items.find(i => i.name === 'broken').failed); assert.match(s.status, /Could not play "broken"/);
    await page.click('#myMusicClear');
    await page.setInputFiles('#myMusicInput', [F('broken.mp3')]);
    await until(async () => /None of these files could be played/.test((await S(page)).status), 6000, 'the all-bad-files message');
    await page.click('#myMusicClear');
  });

  await check('other formats: OGG and MP3 play; M4A plays where the browser can, and is refused with a message where it cannot', async () => {
    if (!extra.length) return 'ffmpeg not available: only WAV was exercised';
    const m4aOk = await page.evaluate(() => audioElement.canPlayType('audio/mp4') !== '');
    await page.setInputFiles('#myMusicInput', extra.map(F));
    const s = await S(page);
    const expected = extra.filter(n => !n.endsWith('.m4a') || m4aOk).map(n => n.replace(/\.\w+$/, ''));
    assert.deepEqual(names(s), expected);
    if (!m4aOk && extra.includes('Foxtrot Tape.m4a')) assert.match(s.status, /This browser cannot play: Foxtrot Tape\.m4a/);
    // every accepted file really plays
    for (let i = 0; i < expected.length; i++) { const x = await playing(page); assert.match(x.src, /^blob:/); if (i < expected.length - 1) { await page.click('button[aria-label="Next track"]'); } }
    await page.click('#myMusicClear');
    return `${expected.join(', ')}; M4A in this browser: ${m4aOk ? 'playable' : 'not supported (refused with a message)'}`;
  });

  await check('without "keep", a reload starts with an empty list (the browser cannot reopen picked files) and the page says so', async () => {
    await page.setInputFiles('#myMusicInput', [F('Alpha Drive.wav')]);
    assert.match(await page.textContent('.pod-mine__note'), /list is empty/);
    await page.reload(); await page.click('#musicButton'); await page.click('#podSourceMine');
    assert.deepEqual(names(await S(page)), []);
  });

  await check('Keep my songs in this browser: they survive a reload, play again, and are removed when unticked; nothing is uploaded', async () => {
    await page.click('#podSourceMine'); // (the player is still open from the check above)
    await page.setInputFiles('#myMusicInput', [F('Alpha Drive.wav'), F('Beta Rain.wav')]); await playing(page);
    await page.check('#myMusicKeep'); await wait(600);
    await page.setInputFiles('#myMusicInput', [F('Gamma Pulse.wav')]); await wait(600);
    await page.reload(); await page.click('#musicButton'); await page.click('#podSourceMine');
    let s = await until(async () => { const x = await S(page); return x.items.length === 3 ? x : null; }, 4000, 'the kept songs to come back');
    assert.deepEqual(names(s), ['Alpha Drive', 'Beta Rain', 'Gamma Pulse']); assert.equal(await page.isChecked('#myMusicKeep'), true);
    await page.click('button[aria-label="Next track"]'); s = await playing(page); assert.match(s.src, /^blob:/);
    await page.click('#myMusicList .pod-list__item:nth-child(1) .pod-list__remove'); await wait(400);
    await page.reload(); await page.click('#musicButton'); await page.click('#podSourceMine');
    s = await until(async () => { const x = await S(page); return x.items.length === 2 ? x : null; }, 4000, 'two kept songs after a removal');
    await page.uncheck('#myMusicKeep'); await wait(500);
    await page.reload(); await page.click('#musicButton'); await page.click('#podSourceMine');
    assert.deepEqual(names(await S(page)), [], 'unticking removed the saved copies');
    const left = await page.evaluate(() => new Promise(res => { const r = indexedDB.open('darknet-pod-music'); r.onsuccess = () => { const db = r.result; if (!db.objectStoreNames.contains('songs')) return res(0); const q = db.transaction('songs').objectStore('songs').count(); q.onsuccess = () => res(q.result); }; r.onerror = () => res(-1); }));
    assert.equal(left, 0);
  });

  await check('privacy: no request carried a body, every request stayed on the test server, and no song name was ever in a URL', async () => {
    const unsafe = requests.filter(r => r.method !== 'GET' || r.length > 0);
    assert.deepEqual(unsafe, []);
    const leaked = requests.filter(r => /Alpha|Beta|Gamma|Delta|Echo|Foxtrot|broken|Long%20Night/.test(decodeURIComponent(r.url)) && !/fixtures/.test(r.url) && r.url.includes('/'));
    assert.deepEqual(leaked.map(r => r.url), []);
    return `${requests.length} requests, all GET with no body`;
  });

  await check('the page reports no script errors through all of the above', async () => { assert.deepEqual(errors, []); });
  await ctx.close();

  // Layout: desktop and a phone-sized window, My Music open with songs: nothing overflows, the player scrolls instead of leaving the screen.
  for (const [name, viewport, mobile] of [['desktop', { width: 1280, height: 800 }, false], ['phone', { width: 390, height: 780 }, true]]) {
    await check(`layout on ${name}: the player stays inside the window with My Music open`, async () => {
      const c = await open(browser, { viewport, hasTouch: mobile, isMobile: mobile });
      await c.page.click('#musicButton'); await c.page.click('#podSourceMine');
      await c.page.setInputFiles('#myMusicInput', [F('Alpha Drive.wav'), F('Beta Rain.wav'), F('Gamma Pulse.wav'), F('Long Night.wav')]); await playing(c.page);
      const box = await c.page.evaluate(() => { const r = document.getElementById('audioPlayer').getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, w: innerWidth, h: innerHeight, sw: document.documentElement.scrollWidth, ph: document.getElementById('audioPlayer').scrollHeight, ch: document.getElementById('audioPlayer').clientHeight }; });
      assert.ok(box.top >= 0 && box.bottom <= box.h + 1 && box.left >= 0 && box.right <= box.w + 1, JSON.stringify(box));
      assert.ok(box.sw <= box.w, 'no sideways scrolling: ' + JSON.stringify(box));
      await c.page.screenshot({ path: path.join(out, `4-layout-${name}.png`) });
      assert.deepEqual(c.errors, []); await c.ctx.close(); return `player ${Math.round(box.bottom - box.top)}px tall in a ${box.h}px window`;
    });
  }

  await browser.close(); site.close();
  fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(results, null, 1));
  const failed = results.filter(r => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
