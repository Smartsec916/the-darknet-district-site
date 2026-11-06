/* Iris on the rest of the site, in a real browser engine (Playwright Chromium) with the Iris service replaced by stand-in answers
   (page.route), so nothing leaves the machine. Phone checks use Playwright's Pixel 7 EMULATION profile: a simulation, NOT a physical phone.
   What it proves, page by page: exactly one chat, the same capsule button and window, nothing hidden behind it, the window fits, one request per
   message, no extra backend calls, the conversation (session id, message count, what was said) follows the visitor from page to page, and the
   games have no chat.
   Run:  node tests/iris-widget-browser.cjs        -> screenshots and results.json in work/iris-widget/ */
const { chromium, devices } = require('playwright'), http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..'), out = path.join(root, 'work', 'iris-widget'); fs.mkdirSync(out, { recursive: true });
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg' };
const site = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname), f = path.join(root, p === '/' ? 'index.html' : p);
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': mime[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});

const WITH = ['games-list', 'about', 'resources', 'legal_resources', 'curious', 'osint', 'anti-osint', 'leaks', 'opsec', 'borderless', 'neurodivergent', 'biohacking',
  'store-first-page', 'store-apparel', 'store-apps', 'store-books', 'store-electronics', 'store-neurohackers', 'store-survival'].map(n => n + '.html');
const WITHOUT = ['sleeping_pod.html', 'game.html', 'raven.html', 'iris-protocols.html', 'origins/index.html', 'blackout-protocol/index.html', 'blackout-protocol/level1.html'];

const results = [];
const ok = (name, detail = '') => { results.push({ name, ok: true, detail }); console.log('ok  ', name, detail); };
async function check(name, fn) { try { ok(name, (await fn()) || ''); } catch (e) { results.push({ name, ok: false, detail: e.message }); console.log('FAIL', name, '-', e.message.split('\n')[0].slice(0, 300)); } }

async function newPage(browser, contextOptions) {
  const ctx = await browser.newContext(contextOptions);
  // The chat has deliberate randomness (a 5% "rebellion" line that is never sent to Iris, a 15% distraction, a 1% rare line); fix it so a message is one request
  await ctx.addInitScript(() => { Math.random = () => 0.5; });
  const page = await ctx.newPage();
  const state = { posts: [], health: 0, errors: [], replyN: 0 };
  page.on('pageerror', e => state.errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') state.errors.push('console: ' + m.text()); });
  await page.route('**/api/chat/message', async route => {
    const body = JSON.parse(route.request().postData() || '{}'); state.posts.push(body);
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ response: `Echo ${++state.replyN}: ${body.message}` }) });
  });
  await page.route('**/api/health', r => { state.health++; r.fulfill({ status: 200, body: '{}' }); });
  await page.route(/googletagmanager|google-analytics|gstatic|googleapis|shopifycdn|shopify|fonts\.g|firebase|hak5_products/, r => r.abort());
  return { ctx, page, state };
}

(async () => {
  await new Promise(r => site.listen(0, '127.0.0.1', r)); const base = `http://127.0.0.1:${site.address().port}`;
  let browser; try { browser = await chromium.launch({ channel: 'msedge' }); } catch { browser = await chromium.launch(); }
  const profiles = { desktop: { viewport: { width: 1366, height: 768 }, locale: 'en-US' }, phone: { ...devices['Pixel 7'], locale: 'en-US' } };
  const ignorable = /firebase|gstatic|Failed to load resource|net::ERR|hak5|googletagmanager|shopify|ERR_FAILED|frame-ancestors.*<meta> element/i;

  for (const [profileName, profile] of Object.entries(profiles)) {
    const { ctx, page, state } = await newPage(browser, profile);
    const tap = sel => profileName === 'phone' ? page.tap(sel) : page.click(sel);

    // 1. every page: one chat, the capsule, nothing covering it, the window fits, one request per message
    for (const file of WITH) {
      await check(`${profileName}: ${file}: one chat, capsule button visible, window opens and fits, one request per message`, async () => {
        const before = state.posts.length, healthBefore = state.health;
        await page.goto(`${base}/${file}`);
        await page.waitForSelector('#chatButton', { timeout: 8000 });
        await page.waitForFunction(() => window.__irisChatLoaded === true, null, { timeout: 8000 });
        const counts = await page.evaluate(() => ({ button: document.querySelectorAll('#chatButton').length, win: document.querySelectorAll('#chatContainer').length, input: document.querySelectorAll('#messageInput').length, scripts: [...document.scripts].filter(s => /iris-chat\.js/.test(s.src)).length, css: document.querySelectorAll('link[data-iris-widget-css]').length }));
        assert.deepEqual(counts, { button: 1, win: 1, input: 1, scripts: 1, css: 1 }, JSON.stringify(counts));
        const cap = await page.evaluate(() => { const b = document.getElementById('chatButton'); const r = b.getBoundingClientRect(), cs = getComputedStyle(b); const nav = document.querySelector('.district-nav'); const n = nav ? nav.getBoundingClientRect() : null;
          return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: innerWidth, h: innerHeight, pos: cs.position, radius: cs.borderRadius, nav: n && { b: n.bottom, t: n.top }, top: document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)?.closest('#chatButton') !== null, tdd: b.classList.contains('tdd-iris') }; });
        assert.ok(cap.tdd && cap.pos === 'fixed' && parseFloat(cap.radius) > 100, 'the glass capsule: ' + JSON.stringify(cap));
        assert.ok(cap.l >= 0 && cap.r <= cap.w && cap.t >= 0 && cap.b <= cap.h, 'the button is on screen: ' + JSON.stringify(cap));
        assert.ok(cap.top, 'nothing sits over the button');
        if (cap.nav) assert.ok(cap.t >= cap.nav.b - 1 || cap.b <= cap.nav.t + 1, 'the button does not overlap the navigation');
        // does the button hide a link or control? (anything interactive under its box, at the top of the page)
        const hidden = await page.evaluate(() => { const b = document.getElementById('chatButton').getBoundingClientRect(); return [...document.querySelectorAll('a[href], button, input, select, textarea, [role=button]')].filter(e => !e.closest('#chatContainer') && e.id !== 'chatButton' && !e.closest('#chatButton')).filter(e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 4 && r.height > 4 && cs.visibility !== 'hidden' && cs.display !== 'none' && r.left < b.right && r.right > b.left && r.top < b.bottom && r.bottom > b.top; }).map(e => (e.id || e.className || e.tagName).toString().slice(0, 40) + ':' + (e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 25)); });
        await page.screenshot({ path: path.join(out, `${profileName}-${file.replace('.html', '')}-closed.png`) });
        await tap('#chatButton'); await page.waitForSelector('#chatContainer', { state: 'visible' });
        const win = await page.evaluate(() => { const c = document.getElementById('chatContainer').getBoundingClientRect(), i = document.querySelector('#chatContainer .chat-input').getBoundingClientRect(), nav = document.querySelector('.district-nav')?.getBoundingClientRect(); return { l: c.left, r: c.right, t: c.top, b: c.bottom, w: innerWidth, h: innerHeight, inputB: i.bottom, navB: nav ? nav.bottom : 0, overflowX: document.documentElement.scrollWidth > innerWidth + 1 }; });
        assert.ok(win.l >= 0 && win.r <= win.w + 1 && win.t >= 0 && win.b <= win.h + 1 && win.inputB <= win.h + 1, 'the window fits: ' + JSON.stringify(win));
        if (profileName === 'phone') assert.ok(win.t >= win.navB - 2, 'on a phone the window leaves the navigation reachable: ' + JSON.stringify(win));
        await page.waitForFunction(() => /Neural interface active/.test(document.getElementById('chatMessages').textContent), null, { timeout: 5000 });
        await page.fill('#messageInput', `hello from ${file}`); await tap('#sendButton');
        await page.waitForFunction(t => document.getElementById('chatMessages').textContent.includes(t), `Echo`, { timeout: 8000 });
        await page.screenshot({ path: path.join(out, `${profileName}-${file.replace('.html', '')}-open.png`) });
        assert.equal(state.posts.length - before, 1, 'exactly one chat request for one message');
        assert.ok(state.health - healthBefore <= 1, 'at most the one wake-up ping');
        await tap('#chatMinimize');
        return hidden.length ? `covers (at the top of the page): ${hidden.join(' | ')}` : 'nothing under the button';
      });
    }

    // 2. the conversation follows the visitor
    await check(`${profileName}: the conversation follows the visitor across pages (session id, message count, what was said), with one request per message`, async () => {
      const fresh = await newPage(browser, profile); const { page: p, state: s } = fresh;
      const t = sel => profileName === 'phone' ? p.tap(sel) : p.click(sel);
      await p.goto(`${base}/games-list.html`); await p.waitForFunction(() => window.__irisChatLoaded === true); await t('#chatButton');
      await p.fill('#messageInput', 'first on the arcade page'); await t('#sendButton'); await p.waitForFunction(() => document.getElementById('chatMessages').textContent.includes('Echo 1'));
      await p.goto(`${base}/store-books.html`); await p.waitForFunction(() => window.__irisChatLoaded === true);
      assert.ok(!(await p.locator('#chatContainer').isVisible()), 'the window starts closed on the next page (it never covers a page the visitor has just opened)');
      await t('#chatButton');
      const text = await p.locator('#chatMessages').innerText();
      assert.ok(text.includes('first on the arcade page') && text.includes('Echo 1: first on the arcade page'), 'both sides of the earlier conversation are there: ' + text.slice(0, 200));
      assert.equal((text.match(/Neural interface active/g) ?? []).length, 1, 'the welcome line is not repeated');
      await p.fill('#messageInput', 'second on the store page'); await t('#sendButton'); await p.waitForFunction(() => document.getElementById('chatMessages').textContent.includes('Echo 2'));
      await p.goto(`${base}/about.html`); await p.waitForFunction(() => window.__irisChatLoaded === true); await t('#chatButton');
      await p.fill('#messageInput', 'third on about'); await t('#sendButton'); await p.waitForFunction(() => document.getElementById('chatMessages').textContent.includes('Echo 3'));
      assert.equal(s.posts.length, 3, 'one request per message, none for navigating');
      assert.equal(new Set(s.posts.map(b => b.sessionId)).size, 1, 'the same session id throughout');
      assert.deepEqual(s.posts.map(b => b.messageCount), [1, 2, 3], 'the message count continues, so a retry is still the same request');
      assert.equal(new Set(s.posts.map(b => b.clientId)).size, 1, 'the same browser id');
      assert.ok(s.posts.every(b => typeof b.clientId === 'string' && b.clientId.length > 8), 'the returning-visitor id is sent');
      assert.equal(await p.locator('#chatButton').count(), 1);
      const real = s.errors.filter(e => !ignorable.test(e)); assert.deepEqual(real, [], 'no script errors');
      await fresh.ctx.close();
    });

    await check(`${profileName}: "reset session" forgets the carried conversation; storage that is blocked just starts fresh without errors`, async () => {
      const fresh = await newPage(browser, profile); const { page: p, state: s } = fresh;
      const t = sel => profileName === 'phone' ? p.tap(sel) : p.click(sel);
      await p.goto(`${base}/about.html`); await p.waitForFunction(() => window.__irisChatLoaded === true); await t('#chatButton');
      await p.fill('#messageInput', 'remember me'); await t('#sendButton'); await p.waitForFunction(() => document.getElementById('chatMessages').textContent.includes('Echo 1'));
      await p.fill('#messageInput', 'reset session'); await t('#sendButton'); await p.waitForFunction(() => /Session reset/.test(document.getElementById('chatMessages').textContent));
      await p.goto(`${base}/opsec.html`); await p.waitForFunction(() => window.__irisChatLoaded === true); await t('#chatButton');
      const text = await p.locator('#chatMessages').innerText();
      assert.ok(!text.includes('remember me'), 'nothing carried on after a reset');
      await fresh.ctx.close();
      const blocked = await newPage(browser, profile);
      await blocked.ctx.addInitScript(() => { Object.defineProperty(window, 'sessionStorage', { get() { throw new Error('blocked'); } }); });
      await blocked.page.goto(`${base}/curious.html`); await blocked.page.waitForFunction(() => window.__irisChatLoaded === true);
      await (profileName === 'phone' ? blocked.page.tap('#chatButton') : blocked.page.click('#chatButton'));
      await blocked.page.fill('#messageInput', 'storage is blocked'); await (profileName === 'phone' ? blocked.page.tap('#sendButton') : blocked.page.click('#sendButton'));
      await blocked.page.waitForFunction(() => document.getElementById('chatMessages').textContent.includes('Echo 1'));
      assert.deepEqual(blocked.state.errors.filter(e => !ignorable.test(e)), [], 'no errors with storage blocked');
      await blocked.ctx.close();
    });

    await check(`${profileName}: only the session id, the count and the messages are saved in the tab; signing out forgets them`, async () => {
      const fresh = await newPage(browser, profile); const { page: p } = fresh;
      const t = sel => profileName === 'phone' ? p.tap(sel) : p.click(sel);
      await p.goto(`${base}/biohacking.html`); await p.waitForFunction(() => window.__irisChatLoaded === true); await t('#chatButton');
      await p.fill('#messageInput', 'a private thought'); await t('#sendButton'); await p.waitForFunction(() => document.getElementById('chatMessages').textContent.includes('Echo 1'));
      const saved = await p.evaluate(() => JSON.parse(sessionStorage.getItem('irisChatV1')));
      assert.deepEqual(Object.keys(saved).sort(), ['messageCount', 'messages', 'sessionId'], 'nothing else is stored');
      const everything = await p.evaluate(() => JSON.stringify({ s: { ...sessionStorage }, l: { ...localStorage } }));
      assert.ok(!/@|Bearer|idToken|refreshToken/.test(everything), 'no account data or token in the browser storage this adds');
      await p.evaluate(() => { window.IrisIdentity.setSignedInHint(true); window.IrisIdentity.setSignedInHint(false); });
      assert.equal(await p.evaluate(() => sessionStorage.getItem('irisChatV1')), null, 'signing out forgets the carried conversation');
      await fresh.ctx.close();
    });

    // 3. the games have no chat
    await check(`${profileName}: no game, game interface or standalone page has any chat`, async () => {
      const fresh = await newPage(browser, profile);
      for (const file of WITHOUT) {
        await fresh.page.goto(`${base}/${file}`, { waitUntil: 'domcontentloaded' }); await fresh.page.waitForTimeout(400);
        const found = await fresh.page.evaluate(() => ({ b: document.querySelectorAll('#chatButton, #chatContainer').length, c: Boolean(window.__irisChatLoaded), w: Boolean(window.__irisWidgetLoaded) }));
        assert.deepEqual(found, { b: 0, c: false, w: false }, `${file}: ${JSON.stringify(found)}`);
      }
      await fresh.ctx.close(); return WITHOUT.length + ' pages';
    });
    await ctx.close();
  }

  fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({ simulated: true, when: new Date().toISOString(), results }, null, 1));
  const failed = results.filter(r => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} passed (Chromium desktop and Pixel 7 EMULATION, not a physical phone)`);
  await browser.close(); site.close(); process.exit(failed ? 1 : 0);
})();
