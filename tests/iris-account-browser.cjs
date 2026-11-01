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
const make = raw => raw && ({ providerData: [{ providerId: 'google.com' }], emailVerified: true, metadata: { creationTime: 'Tue, 01 Sep 2026 10:00:00 GMT', lastSignInTime: 'Sat, 31 Oct 2026 08:00:00 GMT' }, ...raw, isAnonymous: !!raw.isAnonymous, getIdToken: async () => 'token-for-' + raw.uid });
const log = name => { window.__authEvents = [...(window.__authEvents || []), name]; };
export const auth = { currentUser: make(JSON.parse(localStorage.getItem(KEY) || 'null')) };
export class GoogleAuthProvider { setCustomParameters(p) { this.params = p; } }
export const provider = new GoogleAuthProvider();
const listeners = [];
const emit = () => listeners.forEach(fn => fn(auth.currentUser));
export function onAuthStateChanged(_a, fn) { listeners.push(fn); queueMicrotask(() => fn(auth.currentUser)); return () => {}; }
export async function getRedirectResult() { return null; }
export async function signInWithPopup(_a, used) {
  log('popup'); window.__popupParams = used && used.params;
  if (localStorage.getItem('mockPopupMode') === 'cancel') throw Object.assign(new Error('closed'), { code: 'auth/popup-closed-by-user' });
  const raw = JSON.parse(localStorage.getItem('mockNextUser') || '{"uid":"uid-visitor","displayName":"Neo Anderson"}');
  localStorage.setItem(KEY, JSON.stringify(raw)); auth.currentUser = make(raw); emit();
}
export async function signInWithRedirect() { return signInWithPopup(); }
export async function linkWithPopup() { return signInWithPopup(); }
export async function signOut() { log('signOut'); localStorage.removeItem(KEY); auth.currentUser = null; emit(); }
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

  async function open({ viewport = { width: 1440, height: 900 }, phone = viewport.width < 700, me = { authenticated: false, admin: false }, nextUser, signedIn, handles = {}, handleServiceDown = false, takenBy = {} } = {}) {
    const context = await browser.newContext({ viewport, isMobile: phone, hasTouch: phone, bypassCSP: true });
    const page = await context.newPage();
    const seen = { chat: [], me: 0, link: null, forget: 0, errors: [], handleCalls: [] };
    // A stand-in for the handle registry: unique ignoring case, reserved words refused, one change per 30 days
    const registry = { mine: { 'uid-visitor': 'Neo', 'uid-owner': 'Smart_Sec', 'uid-neo': 'Neo_Anderson', 'uid-trinity': 'Trinity', ...handles }, next: {}, takenBy: { ghost_01: 'uid-other', ...takenBy } };
    seen.registry = registry;
    await page.route('**/api/identity/**', async r => {
      const request = r.request();
      const url = new URL(request.url());
      const path = url.pathname.replace('/api/identity', '');
      const uid = (request.headers().authorization || '').replace('Bearer token-for-', '') || null;
      seen.handleCalls.push({ method: request.method(), path, uid, body: request.method() === 'POST' ? request.postDataJSON() : null });
      if (handleServiceDown) return json(r, { error: 'Handles are opening soon. Local play is available.' }, 503);
      if (path === '/me') return uid ? json(r, { handle: registry.mine[uid] || null, nextChangeAt: registry.next[uid] || null }) : json(r, { error: 'Sign in or register a handle to continue.' }, 401);
      const available = /^\/handles\/([^/]+)\/available$/.exec(path);
      if (available) { const owner = registry.takenBy[decodeURIComponent(available[1]).toLowerCase()]; return json(r, { available: !owner || owner === uid }); }
      if (path === '/handle' && request.method() === 'POST') {
        const body = request.postDataJSON();
        if (!uid) return json(r, { error: 'Sign in or register a handle to continue.' }, 401);
        if (Object.keys(body).join() !== 'handle' || !/^[A-Za-z0-9_]{3,20}$/.test(body.handle)) return json(r, { error: 'Use 3\u201320 letters, numbers, or underscores.' }, 400);
        if (/^(admin|iris|system|moderator)$/i.test(body.handle)) return json(r, { error: 'This handle is reserved. Choose another.' }, 400);
        const owner = registry.takenBy[body.handle.toLowerCase()];
        if (owner && owner !== uid) return json(r, { error: 'That handle is taken.' }, 409);
        if (registry.next[uid] && registry.next[uid] * 1000 > Date.now() && registry.mine[uid] !== body.handle) return json(r, { error: 'You can change your handle again in 12 days.' }, 429);
        for (const key of Object.keys(registry.takenBy)) if (registry.takenBy[key] === uid) delete registry.takenBy[key];
        registry.takenBy[body.handle.toLowerCase()] = uid;
        registry.mine[uid] = body.handle;
        registry.next[uid] = Math.floor(Date.now() / 1000) + 30 * 86400;
        return json(r, { handle: body.handle, nextChangeAt: registry.next[uid] });
      }
      return json(r, { error: 'not found' }, 404);
    });
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
  // Opens the account menu and checks it floats over the page: fixed, inside the screen, on top, and the page did not scroll
  const openMenu = async page => {
    const before = await page.evaluate(() => scrollY);
    await page.locator('.district-account__button').click();
    await page.locator('.district-account__item').first().waitFor();
    await page.waitForTimeout(400);
    const seen = await page.evaluate(() => {
      const menu = document.querySelector('.district-account__menu');
      const box = menu.getBoundingClientRect();
      const first = menu.querySelector('.district-account__item');
      const f = first.getBoundingClientRect();
      const topmost = document.elementFromPoint(f.left + f.width / 2, f.top + f.height / 2);
      return { y: scrollY, position: getComputedStyle(menu).position, z: Number(getComputedStyle(menu).zIndex), box: [box.left, box.top, box.right, box.bottom], vw: innerWidth, vh: innerHeight, onTop: menu.contains(topmost) };
    });
    assert.equal(seen.position, 'fixed', 'the menu floats instead of sitting in the page');
    assert.equal(seen.y, before, 'opening the menu does not scroll the page');
    assert.ok(seen.box[0] >= 0 && seen.box[2] <= seen.vw && seen.box[1] >= 0 && seen.box[3] <= seen.vh, `the menu is on screen ${seen.box}`);
    assert.ok(seen.z >= 1000 && seen.onTop, 'the menu is above the rest of the page');
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
    assert.equal(await page.locator('#chatContainer .district-account, #chatContainer #districtLogin').count(), 0);
    await context.close();
  });

  await check('a signed-in message the server cannot verify is refreshed and retried, then sent anonymously rather than lost; a signed-out one never asks', async () => {
    const { page, context, seen } = await open({ signedIn: { uid: 'uid-visitor', displayName: 'Neo' }, me: { authenticated: true, admin: false } });
    await page.unroute('**/api/chat/message');
    const attempts = [];
    await page.route('**/api/chat/message', async r => {
      const h = r.request().headers();
      attempts.push({ auth: h.authorization, marker: h['x-iris-signed-in'], clientId: r.request().postDataJSON().clientId });
      if (attempts.length <= 2) return json(r, { error: 'Sign in again.', code: 'signin_required' }, 401);
      return json(r, { response: 'Hello from the stand-in.' });
    });
    await page.goto(base + '/index.html');
    await page.waitForFunction(() => document.querySelector('.district-account__label').textContent === 'NEO');
    await sendChat(page, 'will the server accept me?');
    assert.equal(attempts.length, 3, 'tried with the sign-in, tried again with a fresh one, then as an anonymous visitor');
    assert.equal(attempts[0].auth, 'Bearer token-for-uid-visitor');
    assert.equal(attempts[0].marker, '1');
    assert.equal(attempts[1].auth, 'Bearer token-for-uid-visitor');
    assert.equal(attempts[2].auth, undefined);
    assert.equal(attempts[2].clientId, attempts[0].clientId, 'the same browser, so nothing is lost');
    await context.close();

    const anonymous = await open();
    let tries = 0;
    await anonymous.page.unroute('**/api/chat/message');
    await anonymous.page.route('**/api/chat/message', async r => { tries++; await json(r, { response: 'Hello from the stand-in.' }); });
    await anonymous.page.goto(base + '/index.html');
    const waited = await anonymous.page.evaluate(async () => { const t = performance.now(); await window.IrisIdentity.authHeaders(); return performance.now() - t; });
    assert.ok(waited < 500, 'no waiting for a sign-in that does not exist');
    await sendChat(anonymous.page, 'hello');
    assert.equal(tries, 1);
    await anonymous.context.close();
  });

  await check('the first message after a reload carries the saved sign-in, never an anonymous one', async () => {
    const { page, context, seen } = await open({ signedIn: { uid: 'uid-owner', displayName: 'Smart Sec' }, me: { authenticated: true, admin: true, mode: 'owner' } });
    await page.addInitScript(() => localStorage.setItem('irisSignedIn', '1'));
    await page.goto(base + '/index.html');
    await sendChat(page, 'right away');
    assert.equal(seen.chat[0].headers.authorization, 'Bearer token-for-uid-owner');
    await context.close();
  });

  await check('the administrator sees a clear tag whenever Iris is not in Owner mode', async () => {
    const test = await open({ signedIn: { uid: 'uid-owner', displayName: 'Smart Sec' }, me: { authenticated: true, admin: true, mode: 'new', accountId: 'uid-owner' } });
    await test.page.goto(base + '/index.html');
    await test.page.waitForFunction(() => document.querySelector('.district-account__mode').textContent === 'NEW');
    await openMenu(test.page);
    assert.match(await test.page.locator('.district-account__modeline').innerText(), /NEW VISITOR/);
    await test.context.close();
    const owner = await open({ signedIn: { uid: 'uid-owner', displayName: 'Smart Sec' }, me: { authenticated: true, admin: true, mode: 'owner', accountId: 'uid-owner' } });
    await owner.page.goto(base + '/index.html');
    await owner.page.waitForFunction(() => document.querySelector('.district-account__label').textContent === 'SMART_SEC');
    assert.equal(await owner.page.locator('.district-account__mode').innerText(), '', 'no tag in Owner mode');
    await owner.context.close();
  });

  await check('log in with Google, stay signed in across a reload, then log out', async () => {
    const { page, context, seen } = await open({ nextUser: { uid: 'uid-visitor', displayName: 'Neo Anderson' } });
    await page.goto(base + '/index.html');
    await page.locator('.district-account__button').click();
    await page.locator('#districtLogin').waitFor({ state: 'visible' });
    await page.keyboard.press('Escape');
    assert.ok(await page.locator('#districtLogin').isHidden(), 'Escape closes the panel');
    await page.locator('.district-account__button').click();
    await page.getByText('CONTINUE WITH GOOGLE').click();
    await page.waitForFunction(() => document.querySelector('.district-account__label').textContent === 'NEO');
    assert.ok(await page.locator('#districtLogin').isHidden(), 'the panel closes after sign-in');

    await page.reload();
    await page.waitForFunction(() => document.querySelector('.district-account__label').textContent === 'NEO');

    await sendChat(page, 'signed in now');
    assert.equal(seen.chat.at(-1).headers.authorization, 'Bearer token-for-uid-visitor', 'the chat carries the sign-in so the server can verify it');

    await openMenu(page);
    const items = await page.locator('.district-account__item').allInnerTexts();
    assert.ok(items.includes('LOG OUT') && !items.includes('LINK MY IRIS HISTORY') && !items.includes('FORGET WHAT IRIS REMEMBERS') && !items.includes('IRIS CONTROLS'), items.join(' | '));
    await page.getByText('LOG OUT').click();
    await page.waitForFunction(() => document.querySelector('.district-account__label').textContent === 'LOG IN');
    await page.locator('#messageInput').fill('anonymous again');
    await page.locator('#sendButton').click();
    await page.waitForFunction(() => document.getElementById('chatMessages').innerText.split('stand-in').length > 2);
    assert.equal(seen.chat.at(-1).headers.authorization, undefined, 'after logging out the chat is anonymous again');
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
    await owner.page.waitForFunction(() => document.querySelector('.district-account__label').textContent === 'SMART_SEC');
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
      memory: {
        enabled: true, storesConversations: mode !== 'new', storedMessages: 42, linkedBrowsers: 1, retention: 'never (messages stay until deleted)',
        lastLookups: [{ at: '2026-11-01T10:00:00.000Z', kind: 'recall', ok: false, failure: 'query_failed', found: 0, ms: 12, candidates: 31, excludedAsInChat: 2, droppedAsRecallQuestions: 4, mode: 'grounded' }],
        latestRequest: { at: '2026-11-01T10:00:00.000Z', messagesIncluded: 5, approxTokens: 420, ok: true, mode: 'grounded' }, lookupFailuresRecent: 1,
        identityMix: { owner: 12, account: 1, browser: 3, none: 2, noneLastHour: 1 },
        server: { version: 'abc1234', startedAt: '2026-11-01T09:00:00.000Z' },
        estimatedAddedTokens: { requestsWithMemory: 3, tokens: 1260, costUSD: 0.31 },
        fallbacks: { last24hInDatabase: 2, sinceServerStart: 2, byReason: { server_error: 1, quota: 1 } },
      },
      persistence: { emotionSystem: 'on', database: true, retentionDays: 'never', flirtLevel: 2, recentChangesKeptInMemory: true },
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
    await owner.page.route('**/api/owner/memory/delete', async r => { posts.push(['delete', r.request().postDataJSON().target, r.request().postDataJSON().confirm]); await json(r, { deleted: 7 }); });
    const summaries = { session_abc123: { found: true, messages: 6, unkeyed: 3, filedUnderOwner: 1, filedElsewhere: 2, firstAt: '2026-10-30T10:00:00Z', lastAt: '2026-10-30T10:30:00Z' }, session_filed: { found: true, messages: 2, unkeyed: 0, filedUnderOwner: 0, filedElsewhere: 2, firstAt: '2026-10-30T10:00:00Z', lastAt: '2026-10-30T10:01:00Z' } };
    await owner.page.route('**/api/owner/session-summary**', r => json(r, { sessionId: 'x', ...(summaries[new URL(r.request().url()).searchParams.get('sessionId')] ?? { found: false }) }));
    await owner.page.route('**/api/owner/adopt-session', async r => { posts.push(['adopt', r.request().postDataJSON().sessionId]); await json(r, { adopted: 3, filedUnderOwner: 4 }); });
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
    const panelText = await owner.page.locator('#panel').innerText();
    for (const expected of ['Persistent memory', 'ON', 'Stored messages', '42', 'never (messages stay until deleted)', 'about 420 tokens', 'OpenAI canned replies', 'server_error', 'FAILED: query_failed']) assert.ok(panelText.includes(expected), expected);
    await owner.page.locator('#deleteOwnerMemory').click();
    await owner.page.waitForTimeout(300);
    // diagnostics say what the numbers mean
    for (const expected of ['31', 'Rows searched', 'Left out: already in this chat', 'Left out: earlier questions', 'matching stored message(s) were given to Iris', 'nobody 2', 'version abc1234']) assert.ok(panelText.includes(expected), expected);
    assert.ok(panelText.includes('saved under nobody'), 'a visitor message saved under nobody in the last hour is flagged');
    assert.equal(await owner.page.locator('#modeBanner').isVisible(), true, 'a test mode is announced at the top of the page');
    assert.match(await owner.page.locator('#modeBanner').innerText(), /NEW VISITOR/);
    // Adopt Chat: the outcome is always visible, right under the form, with the numbers
    await owner.page.fill('#adoptSession', 'does_not_exist');
    await owner.page.locator('#adoptButton').click();
    await owner.page.waitForFunction(() => /No session with that ID was found/.test(document.getElementById('adoptResult').textContent));
    await owner.page.fill('#adoptSession', 'session_filed');
    await owner.page.locator('#adoptButton').click();
    await owner.page.waitForFunction(() => /Nothing to adopt/.test(document.getElementById('adoptResult').textContent));
    await owner.page.fill('#adoptSession', 'session_abc123');
    await owner.page.locator('#checkButton').click();
    await owner.page.waitForFunction(() => /Found\. 6 message\(s\)/.test(document.getElementById('adoptResult').textContent));
    assert.ok(!posts.some(p => p[0] === 'adopt'), 'CHECK changes nothing');
    await owner.page.locator('#adoptButton').click();
    await owner.page.waitForFunction(() => /Adopted 3 message\(s\)/.test(document.getElementById('adoptResult').textContent));
    await owner.page.waitForTimeout(300);
    const result = owner.page.locator('#adoptResult');
    assert.equal(await result.isVisible(), true, 'the result is visible');
    assert.equal(await result.evaluate(el => { const b = el.getBoundingClientRect(); return b.top >= 0 && b.bottom <= window.innerHeight + 1; }), true, 'and on screen, not off to the side');
    assert.match(await result.innerText(), /Adopted 3 message\(s\)/, 'and it stays after the panel refreshes');
    assert.deepEqual(posts, [
      ['mode', 'new', 'Bearer token-for-uid-owner'], ['reset', 'returning'],
      ['delete', 'owner', 'delete my memories'], ['adopt', 'session_abc123'],
    ]);
    assert.ok(!(await owner.page.locator('#panel').innerText()).includes('RESET OWNER'), 'there is no way to reset the owner memory here');
    await owner.context.close();
  });


  const accountOf = { uid: 'uid-neo', displayName: 'Neo Anderson', email: 'neo@example.test' };
  const meOf = { authenticated: true, admin: false, accountId: 'uid-neo' };
  const menuText = page => page.locator('.district-account__menu').innerText();
  const label = page => page.locator('.district-account__label').innerText();
  const waitLabel = (page, text) => page.waitForFunction(expected => document.querySelector('.district-account__label').textContent === expected, text);

  await check('account dropdown: who is signed in, the actions, open and close by button, outside click, Escape and the keyboard', async () => {
    const { page, context } = await open({ signedIn: accountOf, me: meOf });
    await page.goto(base + '/index.html');
    await waitLabel(page, 'NEO_ANDERSON');
    await openMenu(page);
    const text = await menuText(page);
    for (const expected of ['Neo_Anderson', 'Google', 'ACCOUNT SETTINGS', 'SWITCH ACCOUNT', 'LOG OUT']) assert.ok(text.includes(expected), expected + ' in ' + text);
    for (const hidden of ['Neo Anderson', 'neo@example.test']) assert.ok(!text.includes(hidden), 'the menu never shows the Google name or email: ' + hidden);
    assert.equal(await page.locator('.district-account__button').getAttribute('aria-expanded'), 'true');

    await page.locator('.district-account__button').click();
    assert.ok(await page.locator('.district-account__menu').isHidden(), 'the same button closes it');

    await openMenu(page);
    await page.mouse.click(40, 560);
    assert.ok(await page.locator('.district-account__menu').isHidden(), 'clicking outside closes it');

    await openMenu(page);
    await page.keyboard.press('Escape');
    assert.ok(await page.locator('.district-account__menu').isHidden(), 'Escape closes it');
    assert.equal(await page.evaluate(() => document.activeElement.className), 'district-account__button', 'and focus goes back to the button');

    await openMenu(page);
    const focused = () => page.evaluate(() => document.activeElement.textContent);
    assert.equal(await focused(), 'ACCOUNT SETTINGS', 'focus starts on the first action');
    await page.keyboard.press('ArrowDown');
    assert.equal(await focused(), 'SWITCH ACCOUNT');
    await page.keyboard.press('End');
    assert.equal(await focused(), 'LOG OUT');
    await page.keyboard.press('ArrowDown');
    assert.equal(await focused(), 'ACCOUNT SETTINGS', 'arrows wrap around');
    await page.keyboard.press('ArrowUp');
    assert.equal(await focused(), 'LOG OUT');
    await page.keyboard.press('Home');
    assert.equal(await focused(), 'ACCOUNT SETTINGS');
    await page.keyboard.press('Tab');
    assert.ok(await page.locator('.district-account__menu').isHidden(), 'Tab leaves the menu and closes it');
    assert.equal(await page.evaluate(() => document.activeElement.className), 'district-account__button', 'focus returns to the account button');
    await context.close();
  });

  await check('account settings: the account\'s own details, no tokens, closes with Escape, page stays put', async () => {
    const { page, context } = await open({ signedIn: accountOf, me: meOf });
    await page.goto(base + '/index.html');
    await waitLabel(page, 'NEO_ANDERSON');
    await openMenu(page);
    await page.getByRole('menuitem', { name: 'ACCOUNT SETTINGS' }).click();
    await page.locator('#districtSettings').waitFor({ state: 'visible' });
    const panel = await page.locator('#districtSettings').innerText();
    for (const expected of ['HANDLE', 'Neo_Anderson', 'EMAIL (PRIVATE)', 'neo@example.test', 'SIGN-IN METHOD', 'Google', 'EMAIL VERIFIED', 'Yes', 'MEMBER SINCE', '2026-09-01', 'LAST SIGN-IN', '2026-10-31', 'ACCOUNT ID', 'uid-neo']) assert.ok(panel.includes(expected), expected + ' in ' + panel);
    assert.ok(!/token|password|secret|bearer/i.test(panel.replace(/This is what your account holds[^]*$/, '')), 'nothing sensitive is shown');
    assert.ok(!panel.includes('token-for'), 'no token value');
    assert.equal(await page.evaluate(() => scrollY), 0, 'the page did not scroll');
    assert.ok(await page.locator('.district-account__menu').isHidden(), 'the menu closed when the panel opened');
    await page.keyboard.press('Escape');
    assert.ok(await page.locator('#districtSettings').isHidden());
    await context.close();
  });

  await check('switch account: signs out first, forces the Google account chooser, ends on the other account', async () => {
    const { page, context, seen } = await open({ signedIn: accountOf, me: meOf, nextUser: { uid: 'uid-trinity', displayName: 'Trinity Moss', email: 'trinity@example.test' } });
    await page.goto(base + '/index.html');
    await waitLabel(page, 'NEO_ANDERSON');
    await openMenu(page);
    await page.getByText('SWITCH ACCOUNT').click();
    await waitLabel(page, 'TRINITY');
    assert.deepEqual(await page.evaluate(() => window.__authEvents), ['signOut', 'popup'], 'signed out before asking Google again');
    assert.deepEqual(await page.evaluate(() => window.__popupParams), { prompt: 'select_account' }, 'the previous account is not picked automatically');
    await page.reload();
    await waitLabel(page, 'TRINITY');
    await sendChat(page, 'as the second account');
    assert.equal(seen.chat.at(-1).headers.authorization, 'Bearer token-for-uid-trinity', 'the chat follows the new account');
    await context.close();
  });

  await check('switch account: backing out leaves a clear message, a signed-out header, and a way to try again', async () => {
    const { page, context } = await open({ signedIn: accountOf, me: meOf });
    await page.addInitScript(() => localStorage.setItem('mockPopupMode', 'cancel'));
    await page.goto(base + '/index.html');
    await waitLabel(page, 'NEO_ANDERSON');
    await openMenu(page);
    await page.getByText('SWITCH ACCOUNT').click();
    await waitLabel(page, 'LOG IN');
    await page.locator('#districtLogin').waitFor({ state: 'visible' });
    assert.match(await page.locator('#districtLogin').innerText(), /Account switch cancelled\. You are signed out\./);
    await page.evaluate(() => localStorage.removeItem('mockPopupMode'));
    await page.evaluate(() => localStorage.setItem('mockNextUser', JSON.stringify({ uid: 'uid-neo', displayName: 'Neo Anderson', email: 'neo@example.test' })));
    await page.getByText('CONTINUE WITH GOOGLE').click();
    await waitLabel(page, 'NEO_ANDERSON');
    await context.close();
  });

  await check('log out: header changes at once, only the sign-in ends, the Iris browser id and game saves stay', async () => {
    const { page, context, seen } = await open({ signedIn: accountOf, me: meOf });
    await page.goto(base + '/index.html');
    await waitLabel(page, 'NEO_ANDERSON');
    const irisId = await page.evaluate(() => { localStorage.setItem('voidRunnerSave', '{"progress":42}'); return window.IrisIdentity.clientId; });
    await openMenu(page);
    await page.getByText('LOG OUT').click();
    await waitLabel(page, 'LOG IN');
    assert.ok(await page.locator('.district-account__menu').isHidden());
    const kept = await page.evaluate(() => ({ id: localStorage.getItem('irisClientId'), save: localStorage.getItem('voidRunnerSave'), user: localStorage.getItem('mockFirebaseUser') }));
    assert.equal(kept.id, irisId, 'the Iris visitor id is kept');
    assert.equal(kept.save, '{"progress":42}', 'game progress is untouched');
    assert.equal(kept.user, null, 'the sign-in is gone');
    await page.reload();
    await waitLabel(page, 'LOG IN');
    assert.equal(await page.evaluate(() => window.IrisIdentity.clientId), irisId, 'still the same Iris visitor after a reload');
    await sendChat(page, 'logged out now');
    assert.equal(seen.chat.at(-1).headers.authorization, undefined);
    assert.equal(seen.chat.at(-1).body.clientId, irisId);
    await context.close();
  });

  await check('phone layout: the menu and the settings panel fit the screen and nothing scrolls sideways', async () => {
    const { page, context } = await open({ viewport: { width: 390, height: 844 }, signedIn: { ...accountOf, displayName: 'Neo Anderson With A Very Long Name', email: 'a.very.long.email.address.for.testing@example-domain.test' }, me: meOf });
    await page.goto(base + '/index.html');
    await page.waitForFunction(() => document.querySelector('.district-account__label').textContent !== 'LOG IN');
    await openMenu(page);
    const box = await rect(page, '.district-account__menu');
    assert.ok(box.l >= 0 && box.r <= 390, 'menu inside the screen ' + JSON.stringify(box));
    await page.getByRole('menuitem', { name: 'ACCOUNT SETTINGS' }).click();
    await page.locator('#districtSettings').waitFor({ state: 'visible' });
    const panel = await rect(page, '#districtSettings .district-login__panel');
    assert.ok(panel.l >= 0 && panel.r <= 390 && panel.b <= 844, 'settings inside the screen ' + JSON.stringify(panel));
    assert.ok(!(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)));
    await context.close();
  });


  await check('forgetting (not signed in): the sign-in panel offers to delete this browser\'s memories, with the browser id and a confirmation', async () => {
    const { page, context } = await open();
    const sent = [];
    await page.route('**/api/chat/memory', async r => { sent.push(['memory', r.request().postDataJSON()]); await json(r, { conversationMessages: 4, relationship: true, confirmation: 'delete my memories' }); });
    await page.route('**/api/chat/forget', async r => { sent.push(['forget', r.request().postDataJSON()]); await json(r, { ok: true, deleted: 'all', conversationMessages: 4 }); });
    await page.goto(base + '/index.html');
    const id = await page.evaluate(() => window.IrisIdentity.clientId);
    let message = '';
    page.on('dialog', async dialog => { message = dialog.message(); await dialog.accept(); });
    await page.locator('.district-account__button').click();
    await page.locator('#districtLogin').waitFor({ state: 'visible' });
    await page.getByText('DELETE WHAT IRIS REMEMBERS ABOUT THIS BROWSER').click({ noWaitAfter: true });
    await page.waitForTimeout(600);
    assert.match(message, /4 saved messages/);
    assert.deepEqual(sent, [['memory', { clientId: id }], ['forget', { clientId: id, confirm: 'delete my memories', scope: 'all' }]]);
    assert.match(await page.locator('#districtLogin').innerText(), /4 saved messages were deleted/);
    assert.equal(await page.evaluate(() => localStorage.getItem('irisClientId')), id, 'the browser\'s own Iris id is kept');
    await context.close();
  });


  // ---------------------------------------------------------------- user-created handles
  const handleDialog = page => page.locator('#districtHandle');
  const signedInNeo = { uid: 'uid-neo', displayName: 'Neo Anderson', email: 'neo@example.test' };

  await check('handles: the button shows the handle, never the Google name or the email, on every part of the page', async () => {
    const { page, context } = await open({ signedIn: signedInNeo, me: meOf });
    await page.goto(base + '/index.html');
    await waitLabel(page, 'NEO_ANDERSON');
    const everything = await page.evaluate(() => document.body.innerText + document.querySelector('.district-account__button').getAttribute('aria-label'));
    assert.ok(!/Neo Anderson|NEO ANDERSON|neo@example/i.test(everything), 'no real name or email on the page');
    await context.close();
  });

  await check('handles: first sign-in without a handle asks once; NOT NOW closes it and it does not come back this session', async () => {
    const { page, context, seen } = await open({ signedIn: signedInNeo, me: meOf, handles: { 'uid-neo': null } });
    await page.goto(base + '/index.html');
    await handleDialog(page).waitFor({ state: 'visible' });
    assert.match(await handleDialog(page).innerText(), /CHOOSE YOUR HANDLE/);
    assert.equal(await label(page), 'ACCOUNT', 'until a handle exists the button does not show the Google name');
    assert.ok(!/Neo Anderson/.test(await handleDialog(page).innerText()));
    await page.getByRole('button', { name: 'NOT NOW' }).click();
    await handleDialog(page).waitFor({ state: 'hidden' });
    await page.reload();
    await page.waitForFunction(() => document.querySelector('.district-account__label').textContent === 'ACCOUNT');
    await page.waitForTimeout(500);
    assert.equal(await handleDialog(page).isVisible(), false, 'asked once per session');
    await openMenu(page);
    assert.match(await menuText(page), /CHOOSE YOUR HANDLE/, 'still reachable from the menu');
    assert.deepEqual(seen.errors, []);
    await context.close();
  });

  await check('handles: checks shape first, then the server decides: reserved, look-alike taken (any case), then success updates the button without touching Iris', async () => {
    const { page, context, seen } = await open({ signedIn: signedInNeo, me: meOf, handles: { 'uid-neo': null } });
    await page.goto(base + '/index.html');
    await handleDialog(page).waitFor({ state: 'visible' });
    const input = page.locator('#districtHandleInput');
    const status = page.locator('#districtHandle .district-login__status');
    await input.fill('ab');
    assert.match(await status.innerText(), /At least 3/);
    await input.fill('has space');
    assert.match(await status.innerText(), /Letters, numbers and underscores only/);
    await page.getByRole('button', { name: 'SAVE HANDLE' }).click();
    assert.equal(seen.handleCalls.filter(c => c.method === 'POST').length, 0, 'a malformed handle is not even sent');
    await input.fill('Iris');
    await page.getByRole('button', { name: 'SAVE HANDLE' }).click();
    await page.waitForFunction(() => /reserved/.test(document.querySelector('#districtHandle .district-login__status').textContent));
    await input.fill('GHOST_01');
    await page.getByRole('button', { name: 'CHECK AVAILABILITY' }).click();
    await page.waitForFunction(() => /already taken/.test(document.querySelector('#districtHandle .district-login__status').textContent));
    await page.getByRole('button', { name: 'SAVE HANDLE' }).click();
    await page.waitForFunction(() => /taken/.test(document.querySelector('#districtHandle .district-login__status').textContent));
    assert.equal(await handleDialog(page).isVisible(), true, 'a conflict keeps the form open for another try');
    await input.fill('Neo_Runner');
    await page.getByRole('button', { name: 'SAVE HANDLE' }).click();
    await handleDialog(page).waitFor({ state: 'hidden' });
    await waitLabel(page, 'NEO_RUNNER');
    const saves = seen.handleCalls.filter(c => c.method === 'POST' && c.body.handle === 'Neo_Runner');
    assert.equal(saves.length, 1);
    assert.deepEqual(saves[0].body, { handle: 'Neo_Runner' }, 'the request carries only the handle: the account comes from the verified token');
    assert.equal(saves[0].uid, 'uid-neo');
    assert.equal(seen.forget, 0);
    assert.equal(seen.chat.length, 0, 'choosing a handle sends nothing to Iris');
    await context.close();
  });

  await check('handles: Change Handle in Account Settings; the new handle shows everywhere, and a second change inside the cooldown is explained', async () => {
    const { page, context } = await open({ signedIn: signedInNeo, me: meOf });
    await page.goto(base + '/index.html');
    await waitLabel(page, 'NEO_ANDERSON');
    await openMenu(page);
    await page.getByRole('menuitem', { name: 'ACCOUNT SETTINGS' }).click();
    const settings = page.locator('#districtSettings');
    await settings.waitFor({ state: 'visible' });
    assert.match(await settings.innerText(), /Neo_Anderson/);
    await settings.getByRole('button', { name: 'CHANGE HANDLE' }).click();
    await handleDialog(page).waitFor({ state: 'visible' });
    assert.equal(await page.locator('#districtHandleInput').inputValue(), 'Neo_Anderson');
    await page.locator('#districtHandleInput').fill('Thomas_A');
    await page.getByRole('button', { name: 'SAVE HANDLE' }).click();
    await waitLabel(page, 'THOMAS_A');
    await openMenu(page);
    assert.match(await menuText(page), /Thomas_A/);
    await page.getByRole('menuitem', { name: 'ACCOUNT SETTINGS' }).click();
    await settings.waitFor({ state: 'visible' });
    assert.match(await settings.innerText(), /change it again on \d{4}-\d{2}-\d{2}/);
    await settings.getByRole('button', { name: 'CHANGE HANDLE' }).click();
    await page.locator('#districtHandleInput').fill('Another_One');
    await page.getByRole('button', { name: 'SAVE HANDLE' }).click();
    await page.waitForFunction(() => /again in 12 days/.test(document.querySelector('#districtHandle .district-login__status').textContent));
    assert.equal(await label(page), 'THOMAS_A', 'a refused change leaves the handle alone');
    await context.close();
  });

  await check('handles: two browsers racing for one handle - exactly one wins and the other is told plainly', async () => {
    const one = await open({ signedIn: { uid: 'uid-neo', displayName: 'Neo Anderson' }, me: meOf, handles: { 'uid-neo': null } });
    const two = await open({ signedIn: { uid: 'uid-trinity', displayName: 'Trinity Moss' }, me: { authenticated: true, admin: false }, handles: { 'uid-trinity': null } });
    // Both stand-ins share one registry, like the real server
    two.seen.registry.takenBy = one.seen.registry.takenBy;
    for (const { page } of [one, two]) await page.goto(base + '/index.html');
    for (const { page } of [one, two]) { await handleDialog(page).waitFor({ state: 'visible' }); await page.locator('#districtHandleInput').fill('Cipher_9'); }
    await Promise.all([one, two].map(({ page }) => page.getByRole('button', { name: 'SAVE HANDLE' }).click()));
    await Promise.all([one, two].map(({ page }) => page.waitForFunction(() => document.querySelector('.district-account__label').textContent === 'CIPHER_9' || /taken/.test(document.querySelector('#districtHandle .district-login__status').textContent))));
    const labels = await Promise.all([one, two].map(({ page }) => label(page)));
    assert.equal(labels.filter(text => text === 'CIPHER_9').length, 1, 'only one account holds the handle: ' + labels);
    await one.context.close(); await two.context.close();
  });

  await check('handles: when the handle service is unavailable nothing is blocked, no prompt appears, and the message is plain', async () => {
    const { page, context, seen } = await open({ signedIn: signedInNeo, me: meOf, handleServiceDown: true });
    await page.goto(base + '/index.html');
    await page.waitForFunction(() => document.querySelector('.district-account__label').textContent === 'ACCOUNT');
    await page.waitForTimeout(500);
    assert.equal(await handleDialog(page).isVisible(), false);
    await openMenu(page);
    await page.getByRole('menuitem', { name: 'ACCOUNT SETTINGS' }).click();
    assert.match(await page.locator('#districtSettings').innerText(), /could not be loaded/);
    await page.locator('#districtSettings').getByRole('button', { name: 'CHOOSE HANDLE' }).click();
    await page.locator('#districtHandleInput').fill('Neo_Free');
    await page.getByRole('button', { name: 'SAVE HANDLE' }).click();
    await page.waitForFunction(() => /opening soon/.test(document.querySelector('#districtHandle .district-login__status').textContent));
    assert.deepEqual(seen.errors, []);
    await context.close();
  });

  await check('handles: Iris owner recognition is untouched - the handle never changes the account id or the Iris requests', async () => {
    const { page, context, seen } = await open({ signedIn: { uid: 'uid-owner', displayName: 'Smart Sec' }, me: { authenticated: true, admin: true, mode: 'owner', accountId: 'uid-owner' } });
    await page.goto(base + '/index.html');
    await waitLabel(page, 'SMART_SEC');
    await openMenu(page);
    assert.match(await menuText(page), /IRIS CONTROLS/);
    await sendChat(page, 'hello');
    assert.equal(seen.chat.at(-1).headers.authorization, 'Bearer token-for-uid-owner');
    assert.equal(seen.chat.at(-1).body.handle, undefined, 'the handle is not sent to Iris');
    await context.close();
  });

  // The phone chat window: header fixed, messages scroll under it, nav and input stay reachable (accents.css + syncChatViewport)
  const chatGeometry = page => page.evaluate(() => {
    const box = selector => { const b = document.querySelector(selector).getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom }; };
    return { vw: innerWidth, vh: innerHeight, nav: box('.district-nav'), chat: box('#chatContainer'), head: box('.chat-header'), msgs: box('#chatMessages'), input: box('#messageInput'), send: box('#sendButton'), button: box('#chatButton') };
  });
  const fillChat = page => page.evaluate(() => {
    for (let i = 0; i < 40; i++) addMessage('Message ' + i + ' lorem ipsum dolor sit amet consectetur adipiscing elit', i % 2 === 0);
    const list = document.getElementById('chatMessages');
    return { overflows: list.scrollHeight > list.clientHeight };
  });
  for (const [name, width, height] of [['iPhone portrait', 390, 844], ['Android portrait', 360, 740], ['small phone', 320, 568], ['phone landscape', 844, 390]]) {
    await check(`phone chat window (${name} ${width}x${height}): large, header stays put, messages scroll under it, nav and input reachable`, async () => {
      const { page, context } = await open({ viewport: { width, height }, phone: true });
      await page.goto(base + '/index.html');
      await page.locator('#chatButton').click();
      const { overflows } = await fillChat(page);
      assert.ok(overflows, 'enough messages to need scrolling');
      const before = await chatGeometry(page);
      await page.locator('#chatMessages').evaluate(el => { el.scrollTop = el.scrollHeight / 2; });
      await page.mouse.move((before.msgs.l + before.msgs.r) / 2, (before.msgs.t + before.msgs.b) / 2);
      await page.mouse.wheel(0, 300);
      const after = await chatGeometry(page);
      assert.ok(Math.abs(after.head.t - before.head.t) < 1 && Math.abs(after.head.b - before.head.b) < 1, 'the header does not move while messages scroll');
      assert.ok(Math.abs(after.msgs.t - after.head.b) < 1, 'messages begin exactly at the header edge ' + JSON.stringify(after));
      const header = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y).closest('.chat-header') !== null, { x: (after.head.l + after.head.r) / 2, y: (after.head.t + after.head.b) / 2 });
      assert.ok(header, 'nothing from the conversation is drawn over the header');
      assert.ok(after.chat.t >= after.nav.b - 0.5, 'the window starts below the navigation ' + JSON.stringify({ nav: after.nav.b, chat: after.chat.t }));
      assert.ok(after.chat.l >= 0 && after.chat.r <= after.vw && after.chat.b <= after.vh, 'the window is inside the screen');
      assert.ok(after.chat.r - after.chat.l >= Math.min(after.vw * 0.6, 500), 'the window uses the screen width ' + JSON.stringify(after.chat));
      assert.ok(after.input.b <= after.vh && after.send.b <= after.vh && after.send.r <= after.vw, 'input and Send are on screen');
      assert.ok(after.button.t >= after.chat.b - 0.5 || after.button.l >= after.chat.r - 0.5, 'the Chat with Iris button is not covered');
      const links = await page.evaluate(() => [...document.querySelectorAll('.district-nav a')].every(a => { const b = a.getBoundingClientRect(); const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); return hit && a.contains(hit); }));
      assert.ok(links, 'every navigation button can still be clicked');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth <= 3), 'no sideways scrolling');
      await context.close();
    });
  }

  await check('phone chat window: with the keyboard open (viewport shrinks) the input stays visible and the header stays on top', async () => {
    const { page, context } = await open({ viewport: { width: 390, height: 844 } });
    await page.goto(base + '/index.html');
    await page.locator('#chatButton').click();
    await fillChat(page);
    await page.setViewportSize({ width: 390, height: 500 });
    await page.waitForFunction(() => document.documentElement.classList.contains('iris-kb-open'));
    const geometry = await chatGeometry(page);
    assert.ok(geometry.input.b <= geometry.vh && geometry.send.b <= geometry.vh, 'input and Send fit above the keyboard ' + JSON.stringify(geometry));
    assert.ok(geometry.chat.t >= geometry.nav.b - 0.5, 'the navigation is still clear at this height');
    assert.ok(geometry.head.t >= 0 && Math.abs(geometry.msgs.t - geometry.head.b) < 1);
    await context.close();
  });

  await check('desktop chat window is unchanged: 300x450 at the bottom right', async () => {
    const { page, context } = await open({ viewport: { width: 1440, height: 900 } });
    await page.goto(base + '/index.html');
    await page.locator('#chatButton').click();
    const g = await chatGeometry(page);
    assert.equal(Math.round(g.chat.r - g.chat.l), 300);
    assert.equal(Math.round(g.chat.b - g.chat.t), 450);
    assert.equal(Math.round(g.vw - g.chat.r), 20);
    assert.equal(Math.round(g.vh - g.chat.b), 80);
    assert.equal(Math.round(g.msgs.b - g.msgs.t), 300);
    await context.close();
  });

  await browser.close();
  if (failures.length) { console.error(`\n${failures.length} FAILED:\n - ${failures.join('\n - ')}`); process.exitCode = 1; }
  else console.log('\nAll account button and control panel checks passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
