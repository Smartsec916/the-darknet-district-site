/* Homepage account button, sign-in, chat identity and the administrator panel, in a real browser.
   Firebase and the Iris service are replaced by local stand-ins, so no real account or API is used.
   Run: python -m http.server 8765 (in the repo root), then SITE_TEST_URL=http://127.0.0.1:8765 node tests/iris-account-browser.cjs */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const base = process.env.SITE_TEST_URL || 'http://127.0.0.1:8765';
const channel = process.env.BROWSER_CHANNEL || 'msedge';

// A stand-in for firebase-auth.js. The signed-in account is kept in localStorage, as Firebase keeps it in the
// browser, so a reload or another page on the site is still signed in.
const firebaseMock = `
const KEY = 'mockFirebaseUser';
const make = raw => raw && ({ ...raw, isAnonymous: !!raw.isAnonymous, getIdToken: async () => 'token-for-' + raw.uid });
export const auth = { currentUser: make(JSON.parse(localStorage.getItem(KEY) || 'null')) };
export const provider = {};
const listeners = [];
const emit = () => listeners.forEach(fn => fn(auth.currentUser));
export function onAuthStateChanged(_a, fn) { listeners.push(fn); queueMicrotask(() => fn(auth.currentUser)); return () => {}; }
export async function getRedirectResult() { return null; }
export async function signInWithPopup() {
  const raw = JSON.parse(localStorage.getItem('mockNextUser') || '{"uid":"uid-visitor","displayName":"Neo Anderson"}');
  localStorage.setItem(KEY, JSON.stringify(raw)); auth.currentUser = make(raw); emit();
}
export async function signInWithRedirect() { return signInWithPopup(); }
export async function linkWithPopup() { return signInWithPopup(); }
export async function signOut() { localStorage.removeItem(KEY); auth.currentUser = null; emit(); }
export async function signInAnonymously() {}
export async function sendSignInLinkToEmail() {}
export function isSignInWithEmailLink() { return false; }
export async function signInWithEmailLink() {}
export const EmailAuthProvider = { credentialWithLink() { return {}; } };
export async function linkWithCredential() {}
`;

const json = (route, body, status = 200) => route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' }, body: JSON.stringify(body) });

(async () => {
  const browser = await chromium.launch({ headless: true, ...(channel === 'chromium' ? {} : { channel }) });
  const failures = [];
  const check = async (name, fn) => { try { await fn(); console.log('PASS', name); } catch (error) { failures.push(name); console.error('FAIL', name, '\n  ', error.message.split('\n').slice(0, 9).join(' / '), '\n  at', (String(error.stack).split('\n').find(l => l.includes('iris-account-browser')) || '').trim()); } };

  async function open({ viewport = { width: 1440, height: 900 }, me = { authenticated: false, admin: false }, nextUser, signedIn } = {}) {
    const context = await browser.newContext({ viewport, isMobile: viewport.width < 700, hasTouch: viewport.width < 700, bypassCSP: true });
    const page = await context.newPage();
    const seen = { chat: [], me: 0, link: null, forget: 0, errors: [] };
    page.on('pageerror', e => seen.errors.push(e.message));
    await page.route('**/firebase-auth.js', r => r.fulfill({ contentType: 'text/javascript', body: firebaseMock }));
    await page.route(/gstatic\.com|googletagmanager\.com|googleapis\.com/, r => r.fulfill({ contentType: 'text/javascript', body: '' }));
    await page.route('**/api/me', r => { seen.me++; return json(r, me); });
    await page.route('**/api/me/link-history', async r => { seen.link = { headers: r.request().headers(), body: r.request().postDataJSON() }; await json(r, { result: 'linked' }); });
    await page.route('**/api/me/forget', async r => { seen.forget++; await json(r, { erased: true }); });
    await page.route('**/api/chat/message', async r => { seen.chat.push({ headers: r.request().headers(), body: r.request().postDataJSON() }); await json(r, { response: 'Hello from the stand-in.' }); });
    await page.route('**/api/health', r => r.fulfill({ status: 200, body: '{}' }));
    await page.addInitScript(({ nextUser, signedIn }) => {
      if (window.name !== 'seeded') {
        window.name = 'seeded';
        if (nextUser) localStorage.setItem('mockNextUser', JSON.stringify(nextUser));
        if (signedIn) localStorage.setItem('mockFirebaseUser', JSON.stringify(signedIn));
      }
      window.IRIS_API_BASE = ''; // the stand-in answers same-origin
    }, { nextUser, signedIn });
    return { page, context, seen };
  }
  const rect = async (page, selector) => page.locator(selector).first().evaluate(e => { const b = e.getBoundingClientRect(); return { l: b.left, r: b.right, t: b.top, b: b.bottom, w: b.width, h: b.height }; });
  const openMenu = async page => {
    await page.locator('.district-account__button').click();
    await page.locator('.district-account__item').first().waitFor();
  };
  const sendChat = async (page, text) => {
    await page.locator('#chatButton').click();
    await page.locator('#messageInput').fill(text);
    await page.locator('#sendButton').click();
    await page.waitForFunction(() => /stand-in/.test(document.getElementById('chatMessages').innerText));
  };

  for (const [name, width, height] of [['wide 1920', 1920, 1000], ['desktop 1440', 1440, 900], ['laptop 1100', 1100, 800], ['phone 390', 390, 844]]) {
    await check(`login button: far right, apart from the navigation, no sideways scroll (${name})`, async () => {
      const { page, context, seen } = await open({ viewport: { width, height } });
      await page.goto(base + '/index.html');
      await page.waitForSelector('.district-account__button');
      const button = await rect(page, '.district-account__button');
      const links = await page.locator('.district-nav__links a').evaluateAll(list => list.map(e => { const b = e.getBoundingClientRect(); return { l: b.left, r: b.right, t: b.top, b: b.bottom }; }));
      assert.equal((await page.locator('.district-account__button').innerText()).replace(/\s+/g, ' ').trim(), 'ID LOG IN');
      assert.ok(button.r >= width - 70, `button is at the far right (right edge ${button.r} of ${width})`);
      assert.ok(button.r <= width, 'inside the screen');
      for (const link of links) {
        const clear = button.l >= link.r + 24 || button.t >= link.b + 4 || button.b <= link.t - 4;
        assert.ok(clear, 'never touching a navigation button');
      }
      assert.ok(button.h >= 44, 'a comfortable tap target');
      assert.ok(!(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)), 'no horizontal scroll');
      assert.deepEqual(seen.errors, []);
      await context.close();
    });
  }

  await check('anonymous chat works with no sign-in, sends a browser id and no sign-in header, and the chat shows no account controls', async () => {
    const { page, context, seen } = await open();
    await page.goto(base + '/index.html');
    await sendChat(page, 'hello Iris');
    assert.equal(seen.chat.length, 1);
    assert.match(seen.chat[0].body.clientId, /^[0-9a-f-]{36}$/);
    assert.equal(seen.chat[0].headers.authorization, undefined);
    assert.equal(seen.me, 0, 'a signed-out visitor makes no account request at all');
    assert.ok(!/log in|sign in|account/i.test(await page.locator('#chatContainer').innerText()));
    assert.equal(await page.locator('#chatContainer .district-account, #chatContainer .district-login').count(), 0);
    await context.close();
  });

  await check('log in with Google, stay signed in across a reload, then log out', async () => {
    const { page, context, seen } = await open({ nextUser: { uid: 'uid-visitor', displayName: 'Neo Anderson' } });
    await page.goto(base + '/index.html');
    await page.locator('.district-account__button').click();
    await page.locator('.district-login').waitFor({ state: 'visible' });
    await page.keyboard.press('Escape');
    assert.ok(await page.locator('.district-login').isHidden(), 'Escape closes the panel');
    await page.locator('.district-account__button').click();
    await page.getByText('CONTINUE WITH GOOGLE').click();
    await page.waitForFunction(() => /NEO ANDERSON/.test(document.querySelector('.district-account__label').textContent));
    assert.ok(await page.locator('.district-login').isHidden(), 'the panel closes after sign-in');

    await page.reload();
    await page.waitForFunction(() => /NEO ANDERSON/.test(document.querySelector('.district-account__label').textContent));

    await sendChat(page, 'signed in now');
    assert.equal(seen.chat.at(-1).headers.authorization, 'Bearer token-for-uid-visitor', 'the chat carries the sign-in so the server can verify it');

    await openMenu(page);
    const items = await page.locator('.district-account__item').allInnerTexts();
    assert.ok(items.includes('LOG OUT') && items.includes('LINK MY IRIS HISTORY') && !items.includes('IRIS CONTROLS'), items.join(' | '));
    await page.getByText('LOG OUT').click();
    await page.waitForFunction(() => document.querySelector('.district-account__label').textContent === 'LOG IN');
    await page.locator('#messageInput').fill('anonymous again');
    await page.locator('#sendButton').click();
    await page.waitForFunction(() => document.getElementById('chatMessages').innerText.split('stand-in').length > 2);
    assert.equal(seen.chat.at(-1).headers.authorization, undefined, 'after logging out the chat is anonymous again');
    await context.close();
  });

  await check('joining an anonymous history needs the visitor to say yes', async () => {
    const { page, context, seen } = await open({ signedIn: { uid: 'uid-visitor', displayName: 'Neo' }, me: { authenticated: true, admin: false, accountId: 'uid-visitor' } });
    await page.goto(base + '/index.html');
    await page.waitForFunction(() => document.querySelector('.district-account__label').textContent === 'NEO');
    let asked = null;
    page.on('dialog', async dialog => { asked = dialog.message(); await (dialog.type() === 'confirm' && dialog.message().startsWith('Connect') ? dialog.dismiss() : dialog.accept()); });
    await openMenu(page);
    await page.getByText('LINK MY IRIS HISTORY').click({ noWaitAfter: true });
    await page.waitForTimeout(500);
    assert.match(asked, /nothing is connected unless you choose OK/);
    assert.equal(seen.link, null, 'declining sends nothing');
    page.removeAllListeners('dialog');
    page.on('dialog', d => d.accept());
    await openMenu(page);
    await page.getByText('LINK MY IRIS HISTORY').click({ noWaitAfter: true });
    await page.waitForTimeout(500);
    assert.equal(seen.link.body.consent, true);
    assert.match(seen.link.body.clientId, /^[0-9a-f-]{36}$/);
    assert.equal(seen.link.headers.authorization, 'Bearer token-for-uid-visitor');
    await context.close();
  });

  await check('the administrator entry appears only when the server confirms an administrator, and developer tools stay quiet for the owner', async () => {
    const visitor = await open({ signedIn: { uid: 'uid-visitor', displayName: 'Neo' }, me: { authenticated: true, admin: false } });
    await visitor.page.goto(base + '/index.html');
    await visitor.page.waitForFunction(() => document.querySelector('.district-account__label').textContent === 'NEO');
    await openMenu(visitor.page);
    assert.ok(!(await visitor.page.locator('.district-account__menu').innerText()).includes('IRIS CONTROLS'));
    assert.equal(await visitor.page.evaluate(() => window.IrisIdentity.mode), null);
    await visitor.context.close();

    const owner = await open({ signedIn: { uid: 'uid-owner', displayName: 'Smart Sec' }, me: { authenticated: true, admin: true, mode: 'owner', accountId: 'uid-owner' } });
    await owner.page.goto(base + '/index.html');
    await owner.page.waitForFunction(() => document.querySelector('.district-account__label').textContent === 'SMART SEC');
    await openMenu(owner.page);
    const items = await owner.page.locator('.district-account__item').allInnerTexts();
    assert.ok(items.includes('IRIS CONTROLS') && !items.includes('LINK MY IRIS HISTORY'), items.join(' | '));
    assert.equal(await owner.page.evaluate(() => window.IrisIdentity.mode), 'owner');
    await owner.context.close();
  });

  await check('administrator panel: unauthorized accounts see nothing; the owner can switch mode and reset test visitors', async () => {
    const state = (mode) => ({
      mode, modes: ['owner', 'new', 'returning'],
      identities: {
        owner: { persistent: true, relationship: { mood: 'professional', trust: 4.2, familiarity: 0.6, affection: 0.4, respect: 0.9, playfulness: 0.3, visits: 3, messages: 40, lastSeen: '2026-11-01T10:00:00.000Z', preferences: ['likes synthwave'], recap: '', flirtCooldown: 0, minor: false } },
        returning: { persistent: true, resets: 1, relationship: null },
        new: { persistent: false, resets: 0, relationship: null },
      },
      active: { mode, live: { mood: 'playful', trust: 3.9, messagesThisChat: 4 }, recentChanges: [{ at: '2026-11-01T10:00:00.000Z', mood: 'playful', moodChanged: true, trust: 3.9, trustDelta: 0.25, warmth: 1, hostility: 0, flirt: 0, humor: 1, read: true }] },
      persistence: { emotionSystem: 'on', database: true, retentionDays: 180, flirtLevel: 2, recentChangesKeptInMemory: true },
      usageLast24h: { calls: 12, inputTokens: 34000, outputTokens: 900, estimatedCostUSD: 0.094 },
    });

    const denied = await open({ signedIn: { uid: 'uid-visitor', displayName: 'Neo' } });
    await denied.page.route('**/api/owner/state', r => json(r, { error: 'Not authorized.' }, 403));
    await denied.page.goto(base + '/iris-controls.html');
    await denied.page.waitForFunction(() => /not authorized/i.test(document.getElementById('gate').textContent));
    assert.ok(await denied.page.locator('#panel').isHidden());
    await denied.context.close();

    const signedOut = await open();
    await signedOut.page.goto(base + '/iris-controls.html');
    await signedOut.page.waitForFunction(() => /Log in from the homepage/.test(document.getElementById('gate').textContent));
    await signedOut.context.close();

    const owner = await open({ signedIn: { uid: 'uid-owner', displayName: 'Smart Sec' } });
    let current = 'owner';
    const posts = [];
    await owner.page.route('**/api/owner/state', r => json(r, state(current)));
    await owner.page.route('**/api/owner/mode', async r => { current = r.request().postDataJSON().mode; posts.push(['mode', current, r.request().headers().authorization]); await json(r, { mode: current }); });
    await owner.page.route('**/api/owner/reset', async r => { posts.push(['reset', r.request().postDataJSON().target]); await json(r, { reset: r.request().postDataJSON().target }); });
    owner.page.on('dialog', d => d.accept());
    await owner.page.goto(base + '/iris-controls.html');
    await owner.page.locator('#panel').waitFor({ state: 'visible' });
    const text = await owner.page.locator('#panel').innerText();
    for (const expected of ['OWNER', 'NEW VISITOR', 'RETURNING VISITOR', 'Current mood: playful', 'Emotion system', 'Model calls: 12', 'likes synthwave']) assert.ok(text.includes(expected), expected);
    assert.equal(await owner.page.locator('.mode[data-mode="owner"]').getAttribute('aria-checked'), 'true');
    await owner.page.locator('.mode[data-mode="new"]').click();
    await owner.page.waitForFunction(() => document.querySelector('.mode[data-mode="new"]').getAttribute('aria-checked') === 'true');
    await owner.page.locator('#resetReturning').click();
    await owner.page.waitForTimeout(300);
    assert.deepEqual(posts, [['mode', 'new', 'Bearer token-for-uid-owner'], ['reset', 'returning']]);
    assert.ok(!(await owner.page.locator('#panel').innerText()).includes('RESET OWNER'), 'there is no way to reset the owner memory here');
    await owner.context.close();
  });

  await browser.close();
  if (failures.length) { console.error(`\n${failures.length} FAILED:\n - ${failures.join('\n - ')}`); process.exitCode = 1; }
  else console.log('\nAll account button and control panel checks passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
