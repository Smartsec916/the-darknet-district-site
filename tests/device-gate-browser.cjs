/* The device gate in a real browser engine (Playwright, software GL; Edge when installed). What it proves, by what the browser actually does:
   phones (Pixel 7 and iPhone 13 emulation profiles, and a phone that asks for the desktop site) get the landing page, download no game script, model or
   Babylon file, register no service worker, and keep a working link to the website; a desktop starts the game exactly as before (also in a narrow
   window); a touch-only tablet gets the landing page with a "try anyway" choice that really starts the game; weak hardware starts on Low once and never
   overrides a player's own graphics choice. These are EMULATION profiles on this computer, not physical phones.
   Needs the local server (node tests/serve-modern.cjs) or BASE=...   Run: node tests/device-gate-browser.cjs   -> screenshots in work/device-gate/ */
const { chromium, devices } = require('playwright'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const BASE = process.env.BASE || 'http://127.0.0.1:5187', out = path.resolve(__dirname, '..', 'work', 'device-gate'); fs.mkdirSync(out, { recursive: true });
const results = [], ok = (n, d = '') => { results.push({ name: n, ok: true, detail: d }); console.log('ok  ', n, d); };
async function check(n, fn) { try { ok(n, (await fn()) || ''); } catch (e) { results.push({ name: n, ok: false, detail: e.message }); console.log('FAIL', n, '-', e.message.split('\n').slice(0, 3).join(' | ').slice(0, 500)); } }
const GAME_FILE = /\/void-runner\/(?!device-gate\.js)|\/void-runner-sw\.js/;   // any game script, stylesheet, model, vendor file or the service worker (only the gate itself is allowed)
async function open(browser, opts, init) {
  const ctx = await browser.newContext(opts); if (init) await ctx.addInitScript(init);
  const page = await ctx.newPage(), requests = [], errors = [];
  page.on('request', r => requests.push(new URL(r.url()).pathname)); page.on('pageerror', e => errors.push(e.message));
  await page.route(/\/api\/|firebase|googleapis|gstatic|googletagmanager/, r => r.abort());
  await page.goto(BASE + '/void-runner.html', { waitUntil: 'load' });
  return { ctx, page, requests, errors };
}
const gated = async page => ({ landing: await page.locator('#tdd-gate').count(), visible: await page.locator('#tdd-gate').isVisible().catch(() => false), canvas: await page.locator('#space').isVisible().catch(() => false), title: await page.locator('#tdd-gate-title').textContent().catch(() => ''), text: await page.locator('#tdd-gate').innerText().catch(() => '') });

(async () => {
  const b = await chromium.launch({ executablePath:process.env.CHROMIUM_PATH||undefined, args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox'] });
  for (const [name, profile] of [['Pixel 7', devices['Pixel 7']], ['iPhone 13', devices['iPhone 13']]]) {
    await check(`${name}: landing page, no game files, no service worker, a working way back to the website`, async () => {
      const { ctx, page, requests, errors } = await open(b, { ...profile });
      const g = await gated(page); assert.equal(g.landing, 1); assert.ok(g.visible); assert.equal(g.canvas, false, 'the 3D canvas is not shown');
      assert.match(g.title, /desktop experience/i); assert.match(g.text, /planned/i); assert.match(g.text, /not available yet/i);
      const fetched = [...new Set(requests.filter(p => GAME_FILE.test(p)))]; assert.deepEqual(fetched, [], 'no game script, model or worker was requested');
      assert.ok(!requests.some(p => /vendor|babylon|\.glb|\.vrpak|\.css$/.test(p) && /void-runner/.test(p)));
      assert.equal(await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length), 0, 'no service worker registered');
      assert.equal(await page.evaluate(() => typeof window.VoidStartup), 'undefined', 'the game never started');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, 'no sideways scrolling');
      assert.equal(await page.locator('#tdd-gate a[href="/"]').count(), 1);
      await page.screenshot({ path: path.join(out, name.replace(/\W+/g, '-') + '-landing.png') });
      await Promise.all([page.waitForURL(u => new URL(u).pathname === '/' || /index/.test(u.pathname)), page.click('#tdd-gate a[href="/"]')]);
      assert.deepEqual(errors, []); await ctx.close(); return `requests: ${requests.length}, none from the game`;
    });
  }
  await check('a phone that asks for the desktop site (a desktop user agent on a small touch-only screen) is still a phone', async () => {
    const { ctx, page, requests } = await open(b, { ...devices['Pixel 7'], userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' });
    const g = await gated(page); assert.equal(g.landing, 1); assert.deepEqual(requests.filter(p => GAME_FILE.test(p)), []); await ctx.close();
  });
  await check('a phone cannot force its way in with the tablet override', async () => {
    const { ctx, page } = await open(b, { ...devices['Pixel 7'] }, () => { try { sessionStorage.setItem('tdd-force-3d', '1'); } catch (e) { /* none */ } });
    assert.equal(await page.locator('#tdd-gate').count(), 1); assert.equal(await page.locator('#tdd-gate button').count(), 0, 'no override button on a phone'); await ctx.close();
  });
  await check('iPad (touch only): landing page with a "try anyway" choice; the choice really starts the game', async () => {
    const { ctx, page, requests } = await open(b, { ...devices['iPad (gen 7)'] });
    const g = await gated(page); assert.equal(g.landing, 1); assert.match(g.title, /tablet/i); assert.deepEqual(requests.filter(p => GAME_FILE.test(p)), []);
    assert.equal(await page.locator('#tdd-gate button').count(), 1); await page.screenshot({ path: path.join(out, 'iPad-landing.png') });
    await page.click('#tdd-gate button'); await page.waitForFunction(() => !document.getElementById('tdd-gate'), null, { timeout: 15000 });
    await page.waitForFunction(() => typeof window.VoidLoading !== 'undefined' || typeof window.VoidStartup !== 'undefined', null, { timeout: 120000 });
    await ctx.close();
  });
  await check('a desktop starts the game: the gate steps aside and the game scripts run in order; the menu appears', async () => {
    const { ctx, page, requests, errors } = await open(b, { viewport: { width: 1280, height: 720 } }, () => { try { localStorage.setItem('void-runner-graphics-v1', JSON.stringify({ quality: 'low' })); } catch (e) { /* none */ } });
    await page.waitForFunction(() => window.VoidStartup && window.VoidStartup.started, null, { timeout: 240000 });
    assert.equal(await page.locator('#tdd-gate').count(), 0); assert.ok(requests.some(p => /void-runner\/bootstrap\.js$/.test(p)));
    const order = requests.filter(p => /void-runner\/(cache|network|loading|game|bootstrap)\.js$/.test(p)).map(p => p.split('/').pop()); assert.deepEqual(order.filter((x, i) => order.indexOf(x) === i).slice(0, 3), ['cache.js', 'network.js', 'loading.js']);
    assert.ok(await page.locator('[data-action=menu-campaign]').count() > 0, 'the main menu is there');
    assert.deepEqual(errors.filter(e => !/Failed to load resource|net::ERR/.test(e)), []); await page.screenshot({ path: path.join(out, 'desktop-menu.png') }); await ctx.close();
  });
  await check('a narrow desktop window is still a desktop (the window width does not decide)', async () => {
    const { ctx, page } = await open(b, { viewport: { width: 420, height: 800 } });
    assert.equal(await page.locator('#tdd-gate').count(), 0); await page.waitForFunction(() => typeof VoidLoading !== 'undefined', null, { timeout: 60000 }); await ctx.close();
  });
  await check('weak hardware starts on Low once, and never overrides a choice the player already made', async () => {
    const weak = () => { Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 2 }); };
    let r = await open(b, { viewport: { width: 1280, height: 720 } }, weak);
    assert.deepEqual(JSON.parse(await r.page.evaluate(() => localStorage.getItem('void-runner-graphics-v1'))), { quality: 'low', auto: true }); await r.ctx.close();
    r = await open(b, { viewport: { width: 1280, height: 720 } }, () => { Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 2 }); try { if (!localStorage.getItem('void-runner-graphics-v1')) localStorage.setItem('void-runner-graphics-v1', JSON.stringify({ quality: 'high' })); } catch (e) { /* none */ } });
    assert.equal(JSON.parse(await r.page.evaluate(() => localStorage.getItem('void-runner-graphics-v1'))).quality, 'high'); await r.ctx.close();
  });
  await check('the gate never touches saves: no campaign key is read, written or removed by it', async () => {
    const src = fs.readFileSync(path.resolve(__dirname, '..', 'void-runner', 'device-gate.js'), 'utf8'); assert.ok(!/void-runner-campaign|\.retired/.test(src));
  });
  await b.close(); fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(results, null, 1));
  const failed = results.filter(r => !r.ok); console.log(`\n${results.length - failed.length}/${results.length} checks passed`); process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
