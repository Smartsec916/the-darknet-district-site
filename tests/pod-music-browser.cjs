/* The wall-mounted pod music player inside the 3D Darknet District, in a real browser engine (Playwright, software GL). It boots the real game into the
   District, finds the real wall screen, opens the real panel and picks real audio files (WAV in code; OGG and MP3 through ffmpeg when installed) with the
   browser's file chooser. It checks, by what the game actually does: the screen is on the pod room's wall and draws; the E interaction opens the player;
   songs play through the game's own music channel; the LED spectrum moves on the wall and in the panel for both the website playlist and My music; the
   pod room's light follows the music; shuffle, repeat, volume, next/previous, remove and clear work; a bad file is skipped; "keep my songs" survives a
   reload; nothing is uploaded; the music pauses when the player leaves the District. It cannot prove how a phone or another browser behaves.
   Needs the local server:  node tests/serve-modern.cjs   then:  node tests/pod-music-browser.cjs [low|high]   -> screenshots in work/pod-music/ */
const { chromium } = require('playwright'), fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process'), assert = require('node:assert/strict');
const BASE = process.env.BASE || 'http://127.0.0.1:5187', QUALITY = process.argv[2] || 'low';
const out = path.resolve(__dirname, '..', 'work', 'pod-music'), fx = path.join(out, 'fixtures'); fs.mkdirSync(fx, { recursive: true });
const F = n => path.join(fx, n), wait = ms => new Promise(r => setTimeout(r, ms));
function wav(file, seconds, make) {
  const rate = 22050, n = Math.floor(rate * seconds), b = Buffer.alloc(44 + n * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 2, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(rate, 24); b.writeUInt32LE(rate * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, make(i / rate))) * 0.7 * 32767), 44 + i * 2);
  fs.writeFileSync(file, b);
}
const tone = fs => t => fs.reduce((v, f) => v + Math.sin(2 * Math.PI * f * t) / fs.length, 0);
wav(F('Alpha Drive.wav'), 1.6, tone([110, 440, 1800])); wav(F('Beta Rain.wav'), 1.6, tone([220, 880, 3000])); wav(F('Gamma Pulse.wav'), 1.6, tone([150, 660, 2400]));
// a beat: a kick (80 Hz) twice a second over a steady hum, so the levels (and the light) rise and fall
wav(F('Beat Box.wav'), 14, t => { const k = Math.exp(-((t * 2) % 1) * 7), kick = Math.sin(2 * Math.PI * 80 * t) * k, hat = ((t * 4) % 1) < .08 ? (Math.random() - .5) * .5 : 0; return kick * .8 + Math.sin(2 * Math.PI * 1000 * t) * .12 + hat; });
fs.writeFileSync(F('notes.txt'), 'not a song'); fs.writeFileSync(F('broken.mp3'), 'text pretending to be an mp3');
const extra = []; try { cp.execSync('ffmpeg -version', { stdio: 'ignore' }); for (const [n, a] of [['Delta Glass.ogg', '-c:a libvorbis'], ['Echo Static.mp3', '-c:a libmp3lame']]) { cp.execSync(`ffmpeg -y -loglevel error -f lavfi -i "sine=frequency=${300 + extra.length * 200}:duration=1.6" -af volume=6dB ${a} "${F(n)}"`); extra.push(n); } } catch { /* WAV only */ }

const results = [], requests = [], errors = [];
const ok = (n, d = '') => { results.push({ name: n, ok: true, detail: d }); console.log('ok  ', n, d); };
async function check(n, fn) { try { ok(n, (await fn()) || ''); } catch (e) { results.push({ name: n, ok: false, detail: e.message }); console.log('FAIL', n, '-', e.message.split('\n')[0].slice(0, 500)); } }
const until = async (fn, ms = 8000, label = 'condition') => { const t0 = Date.now(); for (;;) { const v = await fn(); if (v) return v; if (Date.now() - t0 > ms) throw new Error('timed out waiting for ' + label); await wait(100); } };

async function boot(b, ctx) {
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => requests.push({ method: r.method(), url: r.url(), body: r.postData() }));
  await page.route(/\/api\/|firebase|googleapis|gstatic|googletagmanager/, r => r.abort());
  await page.goto(BASE + '/void-runner.html'); await page.waitForFunction(() => window.VoidStartup?.started, null, { timeout: 120000 });
  await page.evaluate(async () => { state = C.fresh(); Object.assign(state, { quest: 'open', location: 'earth' }); state.universe.currentSystem = 'sol'; state.universe.freeTravel = true; for (const id of VoidProgression.flags) state.progression.flags[id] = true; state.progression.completed = true; await enterWalking('sacramento'); });
  await page.waitForFunction(() => typeof mode !== 'undefined' && mode === 'walking' && walkingLocation && walker, null, { timeout: 300000 });
  await page.evaluate(() => { window.gameScene = () => BABYLON.EngineStore.Instances.flatMap(e => e.scenes).sort((a, b) => b.meshes.length - a.meshes.length)[0]; });
  // stand in the sleeping-pod room, in front of the wall screen (local x -9, z 66.5)
  await page.evaluate(() => { walker.x = 126.9 + 9; walker.z = -41.9 - 66.5; walker.yaw = Math.PI; walker.pitch = 0; for (let i = 0; i < 4; i++) update(.1); });
  return page;
}
const P = page => page.evaluate(() => ({ ...VoidPodMusic.state(), lv: VoidPodMusic.levels(), vol: VoidPodMusic.element?.volume, src: VoidPodMusic.element?.currentSrc || '', paused: VoidPodMusic.element ? VoidPodMusic.element.paused : true }));
const wallGreen = page => page.evaluate(() => { const t = gameScene().getTextureByName('ncz-pod-music'), c = t.getContext().canvas, d = t.getContext().getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 1] > 180 && d[i] < 130 && d[i + 2] < 160) n++; return n; });
const panelLit = page => page.evaluate(() => { const c = document.getElementById('pod-music-spectrum'); if (!c) return -1; const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 200) n++; return n; });
const strip = page => page.evaluate(() => { const m = gameScene().getMaterialByName('ncz-pod-music-strip'); return m ? [m.emissiveColor.r, m.emissiveColor.g, m.emissiveColor.b] : null; });
const lamp = page => page.evaluate(() => { const l = gameScene().lights.find(x => x.name === 'ncz-light' && x.intensity > 0 && Math.abs(x.position.y - 3) < .01 && Math.abs(x.intersectsMesh === undefined ? 0 : 0) < 1 && Math.abs(x.diffuse.r - 1) < .01 && Math.abs(x.diffuse.g - .357) < .02); return l ? l.intensity : null; });
const names = s => s.mine, shot = (page, n) => page.screenshot({ path: path.join(out, n) });
const drive = (page, n = 1) => page.evaluate(n => { for (let i = 0; i < n; i++) update(.05); }, n);

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
  await ctx.addInitScript(q => { try { if (!localStorage.getItem('void-runner-graphics-v1')) localStorage.setItem('void-runner-graphics-v1', JSON.stringify({ quality: q })); } catch (e) { /* none */ } }, QUALITY);
  const page = await boot(b, ctx);

  await check('the wall screen is mounted on the pod room wall, with an E interaction point beside it', async () => {
    const r = await page.evaluate(() => { const sc = gameScene(), m = sc.getMeshByName('pod-music-screen'), f = sc.getMeshByName('pod-screen-frame'), i = walkingLocation.interactions.find(x => x.action === 'district-pod-music'); if (!m || !i) return null; const p = m.getAbsolutePosition(); return { screen: [p.x, p.y, p.z], frame: !!f, it: i.position, range: i.range, handler: VoidInteractions.handlers.has('district-pod-music'), label: i.label }; });
    assert.ok(r, 'screen and interaction exist'); assert.ok(r.frame && r.handler);
    const d = Math.hypot(r.screen[0] - r.it[0], r.screen[2] - r.it[2]); assert.ok(d < 4, 'the interaction point is within reach of the screen (' + d.toFixed(1) + ' m)');
    return `${r.label}, ${d.toFixed(1)} m from the screen`;
  });

  await check('the screen draws its idle face (title, source, "[E] open the player")', async () => {
    await drive(page, 30); await wait(800); await drive(page, 30);
    const px = await page.evaluate(() => { const t = gameScene().getTextureByName('ncz-pod-music'), c = t.getContext().canvas, d = t.getContext().getImageData(0, 0, c.width, c.height).data; let bright = 0; for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] > 300) bright++; return bright; });
    assert.ok(px > 400, 'text and frame pixels: ' + px); await shot(page, '1-wall-screen-idle.png');
  });

  await check('E at the screen opens the player; the website playlist is the first source and is listed', async () => {
    await page.evaluate(() => VoidInteractions.handlers.get('district-pod-music')());
    await page.waitForSelector('#pod-music'); assert.equal(await page.evaluate(() => mode), 'equipment');
    assert.equal(await page.locator('#pod-music ol li').count(), 27, 'the website playlist');
    assert.equal(await page.getAttribute('[data-action="pod-music:source:website"]', 'aria-pressed'), 'true');
    await shot(page, '2-panel-website.png');
  });

  await check('the website playlist plays through the game\'s music channel; the wall and panel spectrum move; the pod light follows', async () => {
    const base = await strip(page);
    await page.click('[data-action="pod-music:toggle"]');
    const s = await until(async () => { const x = await P(page); return x.playing && x.position > .3 ? x : null; }, 15000, 'the website song to start');
    assert.match(s.src, /attached_assets\/.+\.mp3$/); assert.equal(s.source, 'website');
    await until(async () => (await panelLit(page)) > 120, 8000, 'lit panel spectrum');
    const moved = await until(async () => { await drive(page, 8); const a = await strip(page); return a && Math.abs(a[0] - base[0]) + Math.abs(a[1] - base[1]) + Math.abs(a[2] - base[2]) > .15 ? a : null; }, 8000, 'the ceiling strip to light up');
    return `strip ${base.map(x => x.toFixed(2))} -> ${moved.map(x => x.toFixed(2))}`;
  });

  await check('the wall screen shows the song and a lit spectrum while it plays', async () => {
    await page.evaluate(() => { leaveMenu?.(); }).catch(() => {});
    await until(async () => { await drive(page, 10); return (await wallGreen(page)) > 150; }, 8000, 'green spectrum columns on the wall screen');
  });

  await check('My music: switching pauses the website song; the empty list says what to do; Add songs opens the file chooser (several files, audio only)', async () => {
    await page.click('[data-action="pod-music:source:mine"]');
    assert.equal((await P(page)).playing, false); assert.match(await page.textContent('#pod-music'), /No songs yet/);
    const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.click('[data-action="pod-music:add"]')]);
    assert.equal(chooser.isMultiple(), true); assert.match(await page.getAttribute('#pod-music-input', 'accept'), /audio\/\*.*\.mp3.*\.wav.*\.ogg.*\.m4a/);
    await chooser.setFiles([F('Alpha Drive.wav'), F('Beta Rain.wav'), F('Gamma Pulse.wav'), F('notes.txt')]);
    const s = await until(async () => { const x = await P(page); return x.playing && x.position > .2 ? x : null; }, 10000, 'the first picked song');
    assert.deepEqual(names(s), ['Alpha Drive', 'Beta Rain', 'Gamma Pulse']); assert.equal(s.title, 'Alpha Drive'); assert.match(s.src, /^blob:/);
    assert.match(s.status, /Added 3 songs/); assert.match(s.status, /not audio: notes\.txt/);
    await shot(page, '3-panel-my-music.png');
  });

  await check('the spectrum and the room light move for personal songs too', async () => {
    await until(async () => (await panelLit(page)) > 120, 8000, 'lit panel spectrum for a personal song');
    await until(async () => { await drive(page, 10); return (await wallGreen(page)) > 150; }, 8000, 'wall spectrum');
    const lv = await page.evaluate(() => VoidPodMusic.levels()); assert.ok(lv.on && lv.bass + lv.mid + lv.high > .02, JSON.stringify(lv));
  });

  await check('songs advance by themselves and the list stops after the last (Repeat off)', async () => {
    await until(async () => (await P(page)).title === 'Beta Rain', 6000, 'song two'); await until(async () => (await P(page)).title === 'Gamma Pulse', 6000, 'song three');
    await until(async () => /End of the list/.test((await P(page)).status), 7000, 'the end of the list');
    assert.equal((await P(page)).playing, false);
  });

  await check('Previous / Next, picking a song, Shuffle and Repeat (one, all) behave', async () => {
    await page.click('[data-action="pod-music:next"]'); await until(async () => (await P(page)).title === 'Alpha Drive', 5000, 'Next wraps');
    await page.click('[data-action="pod-music:next"]'); await until(async () => (await P(page)).title === 'Beta Rain', 5000, 'Next');
    await page.click('[data-action="pod-music:prev"]'); await until(async () => (await P(page)).title === 'Alpha Drive', 5000, 'Previous');
    await page.click('#pod-music li:nth-child(3) .go'); await until(async () => (await P(page)).title === 'Gamma Pulse', 5000, 'picked song');
    await page.click('[data-action="pod-music:shuffle"]'); assert.equal((await P(page)).shuffle, true); await page.click('[data-action="pod-music:shuffle"]'); assert.equal((await P(page)).shuffle, false);
    await page.click('[data-action="pod-music:repeat"]'); assert.equal((await P(page)).repeat, 'all'); await page.click('[data-action="pod-music:repeat"]'); assert.equal((await P(page)).repeat, 'one');
    await page.evaluate(() => { window.__starts = 0; VoidPodMusic.element.addEventListener('playing', () => { window.__starts++; }); });
    await page.click('#pod-music li:nth-child(2) .go'); await until(async () => (await page.evaluate(() => window.__starts)) >= 3, 12000, 'the song to repeat twice');
    assert.equal((await P(page)).title, 'Beta Rain'); await page.click('[data-action="pod-music:repeat"]'); assert.equal((await P(page)).repeat, 'off');
  });

  await check('volume: the slider sets the music volume and it stays across songs', async () => {
    await page.fill('#pod-music-volume', '30'); const v = await P(page); assert.ok(Math.abs(v.vol - .3) < .01 && Math.abs(v.volume - .3) < .01, JSON.stringify([v.vol, v.volume]));
    await page.click('[data-action="pod-music:next"]'); await wait(800); assert.ok(Math.abs((await P(page)).vol - .3) < .01);
  });

  await check('Remove and Clear playlist', async () => {
    await page.click('#pod-music li:nth-child(1) [data-action^="pod-music:remove"]'); assert.equal((await P(page)).mine.length, 2);
    await page.click('[data-action="pod-music:clear"]'); const s = await P(page); assert.deepEqual(s.mine, []); assert.equal(s.playing, false); assert.match(s.status, /Playlist cleared \(2 songs\)/);
  });

  await check('a file the browser cannot play is marked and skipped; all-bad lists stop with a message', async () => {
    const [c1] = await Promise.all([page.waitForEvent('filechooser'), page.click('[data-action="pod-music:add"]')]); await c1.setFiles([F('broken.mp3'), F('Alpha Drive.wav')]);
    await until(async () => { const x = await P(page); return x.title === 'Alpha Drive' && x.playing ? x : null; }, 10000, 'to skip the broken file');
    assert.equal(await page.locator('#pod-music li.bad').count(), 1);
    await page.click('[data-action="pod-music:clear"]');
    const [c2] = await Promise.all([page.waitForEvent('filechooser'), page.click('[data-action="pod-music:add"]')]); await c2.setFiles([F('broken.mp3')]);
    await until(async () => /None of these files could be played/.test((await P(page)).status), 8000, 'the message'); await page.click('[data-action="pod-music:clear"]');
  });

  await check('OGG and MP3 files play too', async () => {
    if (!extra.length) return 'ffmpeg not available: WAV only';
    const [c] = await Promise.all([page.waitForEvent('filechooser'), page.click('[data-action="pod-music:add"]')]); await c.setFiles(extra.map(F));
    for (let i = 0; i < extra.length; i++) { await until(async () => { const x = await P(page); return x.playing && x.position > .1 ? x : null; }, 8000, 'song ' + extra[i]); if (i < extra.length - 1) await page.click('[data-action="pod-music:next"]'); }
    await page.click('[data-action="pod-music:clear"]'); return extra.join(', ');
  });

  await check('the music beat moves the room light (strip and ceiling panels) around its resting level', async () => {
    const [c] = await Promise.all([page.waitForEvent('filechooser'), page.click('[data-action="pod-music:add"]')]); await c.setFiles([F('Beat Box.wav')]);
    await until(async () => (await P(page)).playing, 8000, 'the beat'); const seen = [];
    for (let i = 0; i < 40; i++) { await drive(page, 3); const a = await strip(page); seen.push(a[0] + a[1] + a[2]); await wait(60); }
    const spread = Math.max(...seen) - Math.min(...seen); assert.ok(spread > .2, 'the strip pulses (spread ' + spread.toFixed(2) + ')');
    const lampNow = await lamp(page); await shot(page, '4-panel-beat.png');
    return `strip brightness ${Math.min(...seen).toFixed(2)}..${Math.max(...seen).toFixed(2)}${lampNow ? '; pod lamp ' + lampNow.toFixed(2) : '; (low quality has no pod lamp)'}`;
  });

  await check('closing the panel keeps the music playing; the wall screen shows the song; a screenshot from the player\'s eyes', async () => {
    await page.click('[data-action="progress-return"]'); await page.waitForFunction(() => mode === 'walking');
    await wait(600); await drive(page, 10); const s = await P(page); assert.ok(s.playing);
    await page.evaluate(() => { walker.x = 126.9 + 9; walker.z = -41.9 - 64; walker.yaw = Math.PI; walker.pitch = .05; for (let i = 0; i < 6; i++) update(.1); });
    await wait(1500); await drive(page, 10); await shot(page, '5-wall-screen-playing.png');
  });

  await check('leaving the District pauses the music (it belongs to the pod room); coming back does not restart it by itself', async () => {
    assert.ok((await P(page)).playing);
    await page.evaluate(() => { window.__w = walkingLocation; walkingLocation = null; VoidPodMusic.update(); });
    assert.equal((await P(page)).playing, false); await page.evaluate(() => { walkingLocation = window.__w; VoidPodMusic.update(); }); assert.equal((await P(page)).playing, false);
    await page.evaluate(() => VoidPodMusic.clearMine());
  });

  await check('Keep my songs in this browser: they survive a reload; unticking removes the saved copies', async () => {
    await page.evaluate(() => VoidInteractions.handlers.get('district-pod-music')()); await page.click('[data-action="pod-music:source:mine"]');
    await page.check('[data-pod-keep]'); const [c] = await Promise.all([page.waitForEvent('filechooser'), page.click('[data-action="pod-music:add"]')]); await c.setFiles([F('Alpha Drive.wav'), F('Beta Rain.wav')]);
    await until(async () => (await P(page)).mine.length === 2, 5000, 'two songs'); await wait(800);
    await page.evaluate(() => VoidPodMusic.element?.pause());
    await page.close(); const again = await boot(b, ctx);
    await again.evaluate(() => VoidInteractions.handlers.get('district-pod-music')()); await again.click('[data-action="pod-music:source:mine"]');
    await until(async () => (await P(again)).mine.length === 2, 6000, 'the kept songs to come back');
    assert.deepEqual((await P(again)).mine, ['Alpha Drive', 'Beta Rain']); assert.equal(await again.isChecked('[data-pod-keep]'), true);
    await again.click('#pod-music li:nth-child(1) .go'); await until(async () => (await P(again)).playing, 8000, 'a kept song to play');
    await again.uncheck('[data-pod-keep]'); await wait(500);
    const left = await again.evaluate(() => new Promise(res => { const r = indexedDB.open('darknet-pod-music'); r.onsuccess = () => { const db = r.result; if (!db.objectStoreNames.contains('songs')) return res(0); const q = db.transaction('songs').objectStore('songs').count(); q.onsuccess = () => res(q.result); }; r.onerror = () => res(-1); }));
    assert.equal(left, 0); await again.evaluate(() => VoidPodMusic.clearMine()); await again.close();
  });

  await check('privacy: no request carried a body or a song name; every request went to the local test server', async () => {
    assert.deepEqual(requests.filter(r => r.method !== 'GET' || r.body).map(r => r.method + ' ' + r.url), []);
    assert.deepEqual(requests.filter(r => !r.url.startsWith(BASE) && !/^(blob|data):/.test(r.url)).map(r => r.url), []);
    assert.deepEqual(requests.filter(r => /Alpha|Beta|Gamma|Beat|Delta|Echo|broken/.test(decodeURIComponent(r.url))).map(r => r.url), []);
    return requests.length + ' requests, all GET with no body';
  });
  await check('no script errors in the game through all of the above', async () => { assert.deepEqual(errors.filter(e => !/Failed to load resource|net::ERR/.test(e)), []); });

  await b.close();
  fs.writeFileSync(path.join(out, 'results-' + QUALITY + '.json'), JSON.stringify(results, null, 1));
  const failed = results.filter(r => !r.ok); console.log(`\n${results.length - failed.length}/${results.length} checks passed at ${QUALITY} quality`); process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
