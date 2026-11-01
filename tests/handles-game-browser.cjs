/* VOID//RUNNER shows the player's public handle (never the Google name or email), prompts for one when missing, and
   changes it without touching the account or progress. Firebase, the handle service and the game server are local
   stand-ins. Run: python -m http.server 8765 (repo root), then SITE_TEST_URL=http://127.0.0.1:8765 node tests/handles-game-browser.cjs */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const base = process.env.SITE_TEST_URL || 'http://127.0.0.1:8765';
const channel = process.env.BROWSER_CHANNEL || 'msedge';

const firebaseMock = `
const KEY = 'mockFirebaseUser';
const make = raw => raw && ({ providerData: [{ providerId: 'google.com' }], ...raw, isAnonymous: !!raw.isAnonymous, getIdToken: async () => 'token-for-' + raw.uid, reload: async () => {} });
export const auth = { currentUser: make(JSON.parse(localStorage.getItem(KEY) || 'null')) };
export class GoogleAuthProvider {}
export const provider = new GoogleAuthProvider();
let listener = () => {};
export function onAuthStateChanged(_a, fn) { listener = fn; queueMicrotask(() => fn(auth.currentUser)); return () => {}; }
export async function getRedirectResult() { return null; }
export async function signInWithPopup() {}
export async function signInWithRedirect() {}
export async function linkWithPopup() {}
export async function signOut() { localStorage.removeItem(KEY); auth.currentUser = null; listener(null); }
export async function signInAnonymously() {}
export async function sendSignInLinkToEmail() {}
export function isSignInWithEmailLink() { return false; }
export async function signInWithEmailLink() {}
export const EmailAuthProvider = { credentialWithLink() { return {}; } };
export async function linkWithCredential() {}
`;
const json = (route, body, status = 200) => route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' }, body: JSON.stringify(body) });
const GOOGLE_ACCOUNT = { uid: 'uid-real', displayName: 'Real Person', email: 'real.person@example.test' };

(async () => {
  const browser = await chromium.launch({ headless: true, ...(channel === 'chromium' ? {} : { channel }) });
  const failures = [];
  const check = async (name, fn) => { try { await fn(); console.log('PASS', name); } catch (error) { failures.push(name); console.error('FAIL', name, '\n  ', error.message.split('\n').slice(0, 8).join(' / ')); } };

  async function open({ handle = null, serviceDown = false } = {}) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    const seen = { errors: [], posts: [], state: { handle, next: null } };
    page.on('pageerror', e => seen.errors.push(e.message));
    await page.route('**/firebase-auth.js', r => r.fulfill({ contentType: 'text/javascript', body: firebaseMock }));
    await page.route(/gstatic\.com|googletagmanager\.com/, r => r.fulfill({ contentType: 'text/javascript', body: '' }));
    await page.route('**/api/void-runner/**', r => {
      const last = r.request().url().split('/').pop();
      return json(r, last === 'account' ? { owned: [], revision: 0, save: null, savedAt: null } : last === 'catalog' ? { products: [] } : { values: {}, revision: 0 });
    });
    await page.route('**/api/identity/**', async r => {
      const request = r.request();
      const path = new URL(request.url()).pathname.replace('/api/identity', '');
      if (serviceDown) return json(r, { error: 'Handles are opening soon. Local play is available.' }, 503);
      if (path === '/me') return json(r, { handle: seen.state.handle, nextChangeAt: seen.state.next });
      if (path === '/handle') {
        const body = request.postDataJSON();
        seen.posts.push(body);
        if (/^iris$/i.test(body.handle)) return json(r, { error: 'This handle is reserved. Choose another.' }, 400);
        if (/^taken_one$/i.test(body.handle)) return json(r, { error: 'That handle is taken.' }, 409);
        seen.state.handle = body.handle;
        seen.state.next = Math.floor(Date.now() / 1000) + 30 * 86400;
        return json(r, { handle: body.handle, nextChangeAt: seen.state.next });
      }
      return json(r, { error: 'not found' }, 404);
    });
    await page.addInitScript(account => localStorage.setItem('mockFirebaseUser', JSON.stringify(account)), GOOGLE_ACCOUNT);
    await page.goto(base + '/void-runner.html');
    await page.waitForFunction(() => window.VoidStartup?.started && window.VoidAccount?.request);
    await page.locator('[data-action="menu-account"]').click();
    return { page, context, seen };
  }
  const screenText = page => page.locator('#screen, .menu-shell, body').first().innerText();

  await check('VOID//RUNNER: a Google account with no handle is asked for one, and the Google name and email never appear', async () => {
    const { page, context, seen } = await open({ handle: null });
    await page.locator('#vr-handle').waitFor();
    const text = await page.locator('body').innerText();
    assert.match(text, /Choose your public handle/);
    assert.match(text, /Signed in as\s+Pilot/);
    assert.ok(!/Real Person|real\.person@example/.test(text), 'no real name or email on screen');
    await page.locator('#vr-handle').fill('Iris');
    await page.locator('[data-action="register-handle"]').click();
    await page.waitForFunction(() => /reserved/.test(document.body.innerText));
    await page.locator('#vr-handle').fill('Taken_One');
    await page.locator('[data-action="register-handle"]').click();
    await page.waitForFunction(() => /taken/.test(document.body.innerText));
    await page.locator('#vr-handle').fill('Void_Pilot');
    await page.locator('[data-action="register-handle"]').click();
    await page.waitForFunction(() => /Signed in as\s+Void_Pilot/.test(document.body.innerText));
    assert.deepEqual(seen.posts.at(-1), { handle: 'Void_Pilot' });
    assert.ok(!/Real Person|real\.person@example/.test(await page.locator('body').innerText()));
    await page.locator('[data-action="account-main-menu"]').click();
    assert.match(await page.locator('.menu-account').innerText(), /SIGNED IN · Void_Pilot/);
    assert.deepEqual(seen.errors, []);
    await context.close();
  });

  await check('VOID//RUNNER: a player with a handle sees it, can change it, and progress/purchases are not part of the change', async () => {
    const { page, context, seen } = await open({ handle: 'Void_Pilot' });
    await page.waitForFunction(() => /Signed in as\s+Void_Pilot/.test(document.body.innerText));
    assert.equal(await page.locator('#vr-handle').count(), 0, 'no claim form once a handle exists');
    const saveBefore = await page.evaluate(() => localStorage.getItem(Object.keys(localStorage).find(k => /void|campaign/i.test(k)) || ''));
    await page.locator('summary', { hasText: 'Change public handle' }).click();
    await page.locator('#vr-handle-change').fill('Cipher_Run');
    await page.locator('[data-action="change-handle"]').click();
    await page.waitForFunction(() => /Signed in as\s+Cipher_Run/.test(document.body.innerText));
    assert.deepEqual(seen.posts, [{ handle: 'Cipher_Run' }], 'only the handle is sent; the account comes from the token');
    const saveAfter = await page.evaluate(() => localStorage.getItem(Object.keys(localStorage).find(k => /void|campaign/i.test(k)) || ''));
    assert.equal(saveAfter, saveBefore, 'the local campaign is untouched');
    assert.deepEqual(seen.errors, []);
    await context.close();
  });

  await check('VOID//RUNNER: when the handle service is down the game still works and says so plainly', async () => {
    const { page, context, seen } = await open({ serviceDown: true });
    await page.waitForFunction(() => /handle could not be loaded/.test(document.body.innerText));
    assert.ok(!/Real Person|real\.person@example/.test(await page.locator('body').innerText()));
    assert.equal(await page.locator('[data-action="sign-out"]').count(), 1, 'the rest of the account page is still there');
    assert.deepEqual(seen.errors, []);
    await context.close();
  });

  await browser.close();
  if (failures.length) { console.error(`\n${failures.length} FAILED:\n - ${failures.join('\n - ')}`); process.exitCode = 1; }
  else console.log('\nAll game handle checks passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
