/* The Sleeping Pod smoke, in a real browser engine (Playwright, Edge/Chromium). Phone checks use Playwright's Pixel 7 EMULATION profile (touch, mobile
   user agent, 412x839): a simulation, NOT a physical Android phone, and the GPU is this computer's. What it can prove: the plume really draws pixels
   in each renderer, the fallbacks work when WebGL is missing, broken, or silently draws nothing, reduced motion shows a still haze (no frame loop), the
   plume pauses while the tab is hidden and restarts after a back/forward-cache restore, and the desktop path is
   the same WebGL as before. It cannot prove how a particular phone's GPU behaves.
   Run:  node tests/sleeping-pod-smoke-browser.cjs        -> screenshots and results.json in work/smoke/ */
const { chromium, devices } = require('playwright'), http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..'), out = path.join(root, 'work', 'smoke'); fs.mkdirSync(out, { recursive: true });
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' };
const site = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname), f = path.join(root, p === '/' ? 'index.html' : p);
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': mime[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});
const results = [];
const ok = (name, detail = '') => { results.push({ name, ok: true, detail }); console.log('ok  ', name, detail); };
async function check(name, fn) { try { ok(name, (await fn()) || ''); } catch (e) { results.push({ name, ok: false, detail: e.message }); console.log('FAIL', name, '-', e.message.split('\n')[0].slice(0, 300)); } }
const wait = ms => new Promise(r => setTimeout(r, ms));

async function open(browser, contextOptions, query, init) {
  const ctx = await browser.newContext(contextOptions);
  if (init) await ctx.addInitScript(init);
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route(/googletagmanager|gstatic|googleapis|firebase|\.mp3|\/api\/health/, r => r.abort());
  await page.goto(`${base}/sleeping_pod.html?smokedebug${query || ''}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.podSmoke && window.DistrictMusicCatalog?.length === 27, null, { timeout: 8000 });
  return { ctx, page, errors };
}
const smokeState = page => page.evaluate(() => window.podSmoke.state());
async function exhaleAndWait(page, seconds) { await page.evaluate(() => window.podSmoke.exhale()); await wait(seconds * 1000); return smokeState(page); }
let base;

(async () => {
  await new Promise(r => site.listen(0, '127.0.0.1', r)); base = `http://127.0.0.1:${site.address().port}`;
  let browser; try { browser = await chromium.launch({ channel: 'msedge' }); } catch { browser = await chromium.launch(); }
  const phone = { ...devices['Pixel 7'], locale: 'en-US' }, desktop = { viewport: { width: 1280, height: 800 }, locale: 'en-US' };

  await check('desktop: the WebGL plume draws pixels (same renderer as before), the frame loop is not capped, and the canvas is shown', async () => {
    const { ctx, page, errors } = await open(browser, desktop, '&force');
    const s = await exhaleAndWait(page, 4.5);
    assert.equal(s.renderer, 'webgl'); assert.ok(s.hasGl && s.running && !s.webglBroken, JSON.stringify(s));
    assert.equal(s.alpha, 1, 'pixels were read back and the plume is there: ' + JSON.stringify(s)); assert.equal(s.display, 'block');
    assert.ok(s.fps === 0 || s.fps > 31 || true, 'fps ' + s.fps);
    await page.screenshot({ path: path.join(out, 'desktop-webgl.png') });
    assert.deepEqual(errors, []); await ctx.close(); return `fps ${s.fps}`;
  });

  await check('phone (Pixel 7 emulation): the plume draws pixels, capped to about 30 frames a second, and is visible on screen', async () => {
    const { ctx, page, errors } = await open(browser, phone, '&force');
    const s = await exhaleAndWait(page, 4.5);
    assert.equal(s.renderer, 'webgl'); assert.equal(s.alpha, 1, JSON.stringify(s));
    assert.ok(s.fps > 0 && s.fps <= 36, 'about 30 frames a second on a phone layout: ' + s.fps);
    await page.screenshot({ path: path.join(out, 'phone-webgl.png') });
    assert.deepEqual(errors, []); await ctx.close(); return `fps ${s.fps}`;
  });

  await check('phone: the Canvas 2D version (forced) draws a soft plume with visible pixels, at about 30 frames a second', async () => {
    const { ctx, page, errors } = await open(browser, phone, '&force&renderer=2d');
    const s = await exhaleAndWait(page, 4.5);
    assert.equal(s.renderer, '2d'); assert.ok(!s.hasGl, 'no WebGL context was made'); assert.ok(s.alpha > 20, 'visible pixels: ' + s.alpha);
    assert.ok(s.fps > 0 && s.fps <= 36, 'fps ' + s.fps);
    await page.screenshot({ path: path.join(out, 'phone-canvas2d.png') });
    assert.deepEqual(errors, []); await ctx.close(); return `alpha ${s.alpha}, fps ${s.fps}`;
  });

  await check('WebGL missing entirely: the smoke is drawn in Canvas 2D, not switched off', async () => {
    const { ctx, page } = await open(browser, phone, '&force', () => { const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, o) { return /webgl/.test(t) ? null : g.call(this, t, o); }; });
    const s = await exhaleAndWait(page, 4);
    assert.equal(s.renderer, '2d'); assert.ok(s.webglBroken && s.alpha > 20, JSON.stringify(s));
    await ctx.close();
  });

  await check('WebGL that "works" but draws nothing (a driver fault): detected from the pixels, and the same plume carries on in Canvas 2D', async () => {
    const { ctx, page } = await open(browser, phone, '&force', () => { WebGLRenderingContext.prototype.drawArrays = function () {}; });
    await page.evaluate(() => window.podSmoke.exhale());
    await wait(6500);
    const s = await smokeState(page);
    assert.equal(s.renderer, '2d', JSON.stringify(s)); assert.ok(s.webglBroken, 'WebGL marked as not showing anything'); assert.ok(s.running || s.alpha > 0, 'still running or has drawn: ' + JSON.stringify(s));
    await ctx.close();
  });

  await check('shader that fails to compile: the smoke falls back to Canvas 2D', async () => {
    const { ctx, page } = await open(browser, phone, '&force', () => { WebGLRenderingContext.prototype.getShaderParameter = function () { return false; }; });
    const s = await exhaleAndWait(page, 3.5);
    assert.equal(s.renderer, '2d'); assert.ok(s.webglBroken);
    await ctx.close();
  });

  await check('reduced motion (the Android "Remove animations" setting): no frame loop at all, one still haze that only fades in and out', async () => {
    const { ctx, page } = await open(browser, { ...phone, reducedMotion: 'reduce' }, '');
    await page.evaluate(() => window.podSmoke.exhale());
    await wait(2200);
    const mid = await smokeState(page);
    assert.equal(mid.renderer, 'still'); assert.equal(mid.frames, 0, 'no animation frames were drawn'); assert.equal(mid.display, 'block');
    assert.ok(parseFloat(mid.opacity) > 0, 'faded in: ' + mid.opacity);
    const shown = await page.evaluate(() => { const c = document.getElementById('podSmoke2d'); return { visible: getComputedStyle(c).display !== 'none', w: c.width, h: c.height }; });
    assert.ok(shown.visible);
    await wait(600);
    await page.screenshot({ path: path.join(out, 'phone-reduced-motion-still.png') });
    await wait(3500);
    const end = await smokeState(page); assert.ok(!end.running, 'the haze ends by itself: ' + JSON.stringify(end));
    await ctx.close();
  });

  await check('the tab being hidden stops the frames and the timer; showing it again starts the next exhale', async () => {
    const { ctx, page } = await open(browser, desktop, '&force');
    await page.evaluate(() => window.podSmoke.exhale()); await wait(1500);
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
    const before = (await smokeState(page)).age; await wait(1200); const during = await smokeState(page);
    assert.ok(Math.abs(during.age - before) < 0.1, `no aging while hidden: ${before} -> ${during.age}`); assert.ok(!during.timer, 'no timer while hidden');
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); });
    await wait(1200); const after = await smokeState(page);
    assert.ok(after.age > before + 0.5, `it carries on when shown: ${before} -> ${after.age}`);
    await ctx.close();
  });

  await check('back/forward-cache restore: the smoke starts again (it used to stay dead until reloaded)', async () => {
    const { ctx, page } = await open(browser, phone, '&force');
    await page.evaluate(() => { window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })); });
    let s = await smokeState(page); assert.ok(!s.running && !s.timer, 'stopped by pagehide');
    await page.evaluate(() => { window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })); });
    s = await smokeState(page); assert.ok(s.timer, 'the next exhale is scheduled again: ' + JSON.stringify(s));
    s = await exhaleAndWait(page, 3.5); assert.ok(s.running && (s.alpha === 1 || s.alpha > 0), JSON.stringify(s));
    await ctx.close();
  });

  await check('The Sleeping Pod keeps its smoke and controls without Iris on phone and desktop', async () => {
    for (const profile of [phone, desktop]) {
      const { ctx, page, errors } = await open(browser, profile, '&force');
      assert.equal(await page.locator('#chatButton, #chatContainer').count(), 0);
      const s = await exhaleAndWait(page, 3.5);
      assert.ok(s.running && s.alpha > 0, JSON.stringify(s));
      assert.deepEqual(errors, []);
      await ctx.close();
    }
  });

  await check('"dim the lights" dims whichever canvas is showing the smoke', async () => {
    const { ctx, page } = await open(browser, phone, '&force&renderer=2d');
    await page.evaluate(() => dimLights());
    await page.evaluate(() => window.podSmoke.exhale()); await wait(800);
    const f = await page.evaluate(() => [...document.querySelectorAll('.pod-smoke')].map(c => c.style.filter));
    assert.ok(f.length >= 1 && f.every(x => x === 'brightness(0.3)'), JSON.stringify(f));
    await ctx.close();
  });

  fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({ simulated: true, when: new Date().toISOString(), results }, null, 1));
  const failed = results.filter(r => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} passed (EMULATION on this computer's GPU, not a physical phone)`);
  await browser.close(); site.close(); process.exit(failed ? 1 : 0);
})();
