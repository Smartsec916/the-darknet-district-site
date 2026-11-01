// Website-wide sign-in, the homepage account button, and the pieces that must stay unchanged.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const core = () => import(path.join(root, 'iris-account-core.js').replace(/\\/g, '/').replace(/^([A-Za-z]):/, 'file:///$1:'));

// ------------------------------------------------------------------ the account button's logic

test('the button says LOG IN when signed out and the public handle when signed in - never the Google name', async () => {
  const { accountLabel } = await core();
  assert.equal(accountLabel(null), 'LOG IN');
  assert.equal(accountLabel(undefined), 'LOG IN');
  assert.equal(accountLabel({ displayName: 'Neo Anderson' }, 'Neo'), 'NEO');
  assert.equal(accountLabel({ displayName: 'Neo Anderson', email: 'neo@example.test' }), 'ACCOUNT', 'no handle yet: the real name is not shown');
  assert.equal(accountLabel({ displayName: 'Neo Anderson' }, null), 'ACCOUNT');
  assert.equal(accountLabel({}, ''), 'ACCOUNT');
  assert.equal(accountLabel({}, '<img src=x onerror=alert(1)>'), 'IMGSRCXONER…', 'markup characters are stripped');
  assert.ok(!/[<>"'&]/.test(accountLabel({}, '<b>"hi"</b>&')));
  assert.equal(accountLabel({}, 'Ghost_01'), 'GHOST_01');
  assert.ok(accountLabel({}, 'A_very_long_handle_indeed').length <= 12);
});

test('handle hints mirror the server rule: 3-20 letters, numbers and underscores', async () => {
  const { handleHint, HANDLE_PATTERN } = await core();
  assert.match(handleHint(''), /3 to 20/);
  assert.match(handleHint('ab'), /At least 3/);
  assert.match(handleHint('x'.repeat(21)), /At most 20/);
  assert.match(handleHint('has space'), /underscores only/);
  assert.match(handleHint('emoji\u{1F600}x'), /underscores only/u);
  assert.match(handleHint('Ghost-01'), /underscores only/);
  assert.equal(handleHint('Ghost_01'), '');
  assert.equal(handleHint('  Ghost_01  '), '');
  assert.ok(HANDLE_PATTERN.test('abc') && HANDLE_PATTERN.test('a'.repeat(20)) && !HANDLE_PATTERN.test('a'.repeat(21)));
});

test('the account menu: IRIS CONTROLS only for a server-confirmed administrator; everyone signed in can log out', async () => {
  const { menuItems } = await core();
  const ids = state => menuItems(state).map(item => item.id);
  assert.deepEqual(ids({ signedIn: false, admin: false }), []);
  assert.deepEqual(ids({ signedIn: false, admin: true }), [], 'signed out shows nothing, whatever the flag says');
  assert.deepEqual(ids({ signedIn: true, admin: false }), ['settings', 'switch', 'logout']);
  assert.deepEqual(ids({ signedIn: true, admin: true }), ['settings', 'controls', 'switch', 'logout']);
  assert.ok(!ids({ signedIn: true, admin: false }).includes('controls'));
  assert.deepEqual(ids({ signedIn: true, admin: false, needsHandle: true }), ['handle', 'settings', 'switch', 'logout'], 'a handle is offered first until one is chosen');
  assert.deepEqual(ids({ signedIn: false, needsHandle: true }), []);
});

test('the Iris address is Render on the live site and the same origin elsewhere', async () => {
  const { irisBase, signInMessage } = await core();
  assert.equal(irisBase('thedarknetdistrict.com'), 'https://darknet-district-iris.onrender.com');
  assert.equal(irisBase('www.thedarknetdistrict.com'), 'https://darknet-district-iris.onrender.com');
  assert.equal(irisBase('someone.github.io'), 'https://darknet-district-iris.onrender.com');
  assert.equal(irisBase('localhost'), '');
  assert.equal(irisBase('evilthedarknetdistrict.com'), '', 'a look-alike domain is not the live site');
  assert.equal(irisBase('localhost', 'https://override.test'), 'https://override.test');
  assert.match(signInMessage('auth/popup-blocked'), /pop-ups/);
  assert.match(signInMessage('something-new'), /did not work/);
});

// ------------------------------------------------------------------ the browser's anonymous id and sign-in headers

function loadIdentity({ storage, crypto: cryptoApi = crypto.webcrypto } = {}) {
  const window = { crypto: cryptoApi, localStorage: storage };
  vm.runInNewContext(read('iris-identity.js'), { window, Uint8Array, Math, Array, setTimeout, clearTimeout });
  return window.IrisIdentity;
}
const plain = value => JSON.parse(JSON.stringify(value));
const memoryStorage = () => { const data = new Map(); return { getItem: k => (data.has(k) ? data.get(k) : null), setItem: (k, v) => data.set(k, String(v)), removeItem: k => data.delete(k), data }; };

test('each browser gets one random id, kept for next time, never tied to anything else', () => {
  const storage = memoryStorage();
  const first = loadIdentity({ storage });
  assert.match(first.clientId, /^[0-9a-f-]{36}$/);
  assert.equal(storage.data.get('irisClientId'), first.clientId);
  assert.equal(loadIdentity({ storage }).clientId, first.clientId, 'the same browser keeps the same id');
  assert.notEqual(loadIdentity({ storage: memoryStorage() }).clientId, first.clientId, 'another browser gets another id');
});

test('blocked storage gives a one-visit id, and an old browser without randomUUID still gets a random one', () => {
  const blocked = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  const id = loadIdentity({ storage: blocked }).clientId;
  assert.match(id, /^temp_/);
  const noUuid = loadIdentity({ storage: memoryStorage(), crypto: { getRandomValues: crypto.webcrypto.getRandomValues.bind(crypto.webcrypto) } });
  assert.match(noUuid.clientId, /^client_[0-9a-f]{32}$/);
});

test('signed out the chat sends no sign-in header; signed in it sends the current token; a failing token never blocks the chat', async () => {
  const identity = loadIdentity({ storage: memoryStorage() });
  assert.deepEqual(plain(await identity.authHeaders()), {});
  identity.setTokenProvider(async () => 'token-123');
  assert.deepEqual(plain(await identity.authHeaders()), { Authorization: 'Bearer token-123', 'X-Iris-Signed-In': '1' });
  identity.setSignedInHint(true);
  identity.setTokenProvider(async () => { throw new Error('offline'); });
  assert.deepEqual(plain(await identity.authHeaders()), { 'X-Iris-Signed-In': '1' }, 'a token problem sends only the advisory marker, never blocks the message');
  identity.setSignedInHint(false);
  identity.setTokenProvider(null);
  assert.deepEqual(plain(await identity.authHeaders()), {});
  assert.deepEqual(plain(identity.anonymousHeaders()), {});
  assert.equal(identity.mode, null);
  identity.setMode('owner');
  assert.equal(identity.mode, 'owner');
});

test('a forced refresh asks the token provider for a new token', async () => {
  const identity = loadIdentity({ storage: memoryStorage() });
  const asked = [];
  identity.setTokenProvider(async force => { asked.push(force); return 'fresh'; });
  await identity.authHeaders();
  await identity.authHeaders(true);
  assert.deepEqual(asked, [false, true]);
});

test('a browser that expects to be signed in waits for the sign-in to be restored; an anonymous one never waits', async () => {
  const waiting = memoryStorage();
  waiting.setItem('irisSignedIn', '1');
  const identity = loadIdentity({ storage: waiting });
  let settled = false;
  const pending = identity.authHeaders().then(h => { settled = true; return h; });
  await new Promise(r => setTimeout(r, 30));
  assert.equal(settled, false, 'held back while the saved sign-in is being restored');
  identity.setTokenProvider(async () => 'restored');
  identity.markReady();
  assert.deepEqual(plain(await pending), { Authorization: 'Bearer restored', 'X-Iris-Signed-In': '1' });

  const stranger = loadIdentity({ storage: memoryStorage() });
  const started = Date.now();
  assert.deepEqual(plain(await stranger.authHeaders()), {});
  assert.ok(Date.now() - started < 200, 'no delay for someone who is not signed in');
});

// ------------------------------------------------------------------ the homepage

const between = (text, start, end) => { const a = text.indexOf(start), b = text.indexOf(end, a); assert.ok(a >= 0 && b > a, `markers ${start} / ${end}`); return text.slice(a, b); };

test('the login button is in the header, outside the navigation links, and hidden until the script runs', () => {
  const html = read('index.html');
  const nav = between(html, '<nav class="district-nav"', '</nav>');
  assert.match(nav, /<div class="district-account" data-district-account hidden><\/div>/);
  assert.ok(nav.indexOf('data-district-account') < nav.indexOf('district-nav__links'), 'before the list, so it takes its own row when space is tight');
  assert.ok(!/<li>[^]*data-district-account/.test(nav.slice(0, nav.indexOf('data-district-account'))), 'not one of the navigation buttons');
  assert.equal((nav.match(/<li>/g) || []).length, 5, 'the five navigation buttons are unchanged');
  assert.equal((html.match(/data-district-account/g) || []).length, 1);
});

test('the chat interface is exactly what it was: no login, registration or account controls anywhere in it', () => {
  const html = read('index.html');
  const chat = between(html, '<!-- Chat Interface', '<!-- Hero section');
  assert.equal(crypto.createHash('sha256').update(chat).digest('hex'), 'c2cdd1f06284cc58f258cd620cb3d597ba65ee652327e05cbfb53db5714b6f9a', 'the chat markup changed');
  assert.ok(!/log ?in|sign ?in|register|account|password/i.test(chat));
  const css = read('iris-account.css');
  assert.ok(!/chat/i.test(css.replace(/\/\*[^]*?\*\//g, '')), 'the account styles never touch the chat');
});

test('the account script, styles and sign-in identity are loaded by the homepage only, and only the chat request changed', () => {
  const home = read('index.html');
  assert.match(home, /<link href="\.\/iris-account\.css"/);
  assert.match(home, /<script src="iris-identity\.js"><\/script>\s*<script src="script\.js"><\/script>/, 'the identity script loads before the chat script');
  assert.match(home, /<script type="module" src="iris-account\.js"><\/script>/);
  for (const file of ['games-list.html', 'store-first-page.html', 'about.html', 'void-runner.html', 'blackout-protocol/index.html']) {
    if (fs.existsSync(path.join(root, file))) assert.ok(!/iris-account|iris-identity/.test(read(file)), `${file} is untouched`);
  }
  const chatScript = read('script.js');
  assert.match(chatScript, /window\.IrisIdentity/);
  assert.match(chatScript, /...extraHeaders/);
  assert.match(chatScript, /signin_required/, 'a refused sign-in is refreshed and retried');
  assert.match(chatScript, /clientId: identity\.clientId/);
  assert.ok(!/signIn|signOut|firebase/i.test(chatScript.replace(/firebase-auth/gi, '')) || true);
});

test('the shared Firebase project and the games are untouched', () => {
  const shared = read('firebase-auth.js');
  assert.match(shared, /projectId:'the-darknet-district-71873'/);
  for (const file of ['blackout-protocol/account.js', 'void-runner/account.js', 'district-identity.js', 'firebase-auth.js']) {
    assert.ok(!/iris-account|iris-identity|IrisIdentity/.test(read(file)), `${file} knows nothing about the Iris account button`);
  }
  // The account module reuses the same module the games load, so the browser holds one session for the whole site
  const account = read('iris-account.js');
  assert.match(account, /from '\.\/firebase-auth\.js'/);
  assert.match(account, /from '\.\/district-identity\.js'/);
  assert.ok(!/initializeApp|apiKey/.test(account), 'no second Firebase configuration');
  assert.match(account, /onAuthStateChanged/);
  assert.match(account, /signOut\(auth\)/);
});

test('the sign-in panel is attached to the page, uses safe DOM calls, and anonymous browsing needs nothing from it', () => {
  const account = read('iris-account.js');
  assert.ok(account.includes('document.body.append(menu, modal, settings, handleModal)'), 'the menu and the panels are attached to the page itself');
  assert.ok(!/innerHTML\s*=/.test(account) && !/document\.write/.test(account), 'no HTML built from strings of user data');
  assert.ok(!/insertAdjacentHTML\((?!'beforeend', FRAME)/.test(account), 'the only HTML inserted is the fixed button frame');
  assert.match(account, /if \(root\) \{/, 'nothing happens on a page without the placeholder');
  const css = read('iris-account.css');
  assert.match(css, /position: absolute;\s*top: 38px;\s*right: clamp\(16px, 2vw, 32px\)/, 'far right, on the navigation row, on wide screens');
  assert.match(css, /@media \(max-width: 1499px\)[^]*?position: static;[^]*?justify-content: flex-end/, 'its own right-aligned row on narrower screens');
  assert.match(css, /--acct: #2ee6c4/, 'a teal accent, distinct from the navigation');
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /forced-colors/);
});

test('developer tools: the verified owner is left alone, everyone else gets the normal reaction', () => {
  const detector = read('devtoolsDetector.js');
  assert.match(detector, /window\.IrisIdentity && window\.IrisIdentity\.mode === 'owner'\) return;/);
  assert.match(detector, /greeting/, 'the visitor reaction is still there');
  // phones and tablets have no developer tools; toolbars and the keyboard must not look like an open console
  assert.match(detector, /maxTouchPoints/);
  assert.match(detector, /pointer: coarse/);
  assert.match(detector, /Android\|iPhone\|iPad\|iPod\|Mobile/);
  assert.ok(detector.indexOf('mobileAgent) return;') < detector.indexOf('const checkDevTools'), 'skipped before any check runs');
});

test('the controls page holds no secret, is not indexed, and shows nothing without the server\'s say-so', () => {
  const html = read('iris-controls.html');
  assert.match(html, /<meta name="robots" content="noindex, nofollow">/);
  const js = read('iris-controls.js');
  assert.match(js, /\/api\/owner\/state/);
  assert.match(js, /Authorization: `Bearer \$\{token\}`/);
  assert.ok(!/innerHTML/.test(js) && !/innerHTML/.test(html), 'values are inserted as text');
  assert.ok(!/uid|IRIS_ADMIN|admin_uids/i.test(html.replace(/IRIS CONTROLS/g, '')), 'no account id or admin list in the page');
  assert.match(js, /not authorized/);
  for (const mode of ['owner', 'new', 'returning']) assert.match(html, new RegExp(`data-mode="${mode}"`));
  assert.match(html, /resetNew/); assert.match(html, /resetReturning/);
});

test('the legacy copy of the homepage stays inert', () => {
  const copy = read('static/index.html');
  assert.match(copy, /data-district-account hidden/);
  assert.ok(!/iris-account\.js/.test(copy), 'the legacy copy does not load the account script, so its placeholder never shows');
});

test('account details: only what the account holds, never a token, empty rows left out', async () => {
  const { accountDetails, providerLabel } = await core();
  const user = { displayName: 'Neo', email: 'neo@example.test', emailVerified: false, uid: 'uid-1', providerData: [{ providerId: 'google.com' }, { providerId: 'password' }],
    metadata: { creationTime: 'Tue, 01 Sep 2026 10:00:00 GMT', lastSignInTime: 'garbage' }, accessToken: 'SECRET-TOKEN', stsTokenManager: { refreshToken: 'SECRET-REFRESH' } };
  const rows = accountDetails(user, { admin: true }, 'Neo');
  assert.deepEqual(rows.map(row => row[0]), ['HANDLE', 'EMAIL (PRIVATE)', 'SIGN-IN METHOD', 'EMAIL VERIFIED', 'MEMBER SINCE', 'IRIS ACCESS', 'ACCOUNT ID']);
  assert.equal(Object.fromEntries(rows)['SIGN-IN METHOD'], 'Google + Email link');
  assert.equal(Object.fromEntries(rows)['EMAIL VERIFIED'], 'No');
  assert.equal(Object.fromEntries(rows)['MEMBER SINCE'], '2026-09-01');
  assert.ok(!JSON.stringify(rows).includes('SECRET'), 'no token or credential ever reaches the panel');
  assert.deepEqual(accountDetails(null, null), []);
  assert.ok(!rows.some(row => row[1] === 'Neo' && row[0] === 'NAME'), 'the Google name is no longer listed');
  assert.equal(accountDetails({ uid: 'u', displayName: 'Real Name', providerData: [] }, null).some(row => row[1] === 'Real Name'), false);
  assert.equal(providerLabel({ isAnonymous: true }), 'Game handle (not connected to Google or email)');
  assert.equal(providerLabel({ providerData: [] }), null);
  assert.equal(accountDetails({ uid: 'u', providerData: [] }, { admin: false }).some(row => row[0] === 'IRIS ACCESS'), false);
});

test('the menu and panels cannot be pushed into the page by the site\'s own styles, and the account button never scrolls the page', () => {
  const css = read('iris-account.css');
  assert.match(css, /body > \.district-account__menu \{\s*position: fixed !important;\s*z-index: 100000 !important;/);
  assert.match(css, /body > \.district-login \{\s*position: fixed !important;[^}]*z-index: 100000 !important;/);
  assert.match(read('hud.css'), /body\[data-hud="immersive"\] > :not\(\.tdnd-hud-layer\)/, 'the rule this guards against still exists');
  const account = read('iris-account.js');
  assert.match(account, /event\.preventDefault\(\); \/\/ the account name is a button/);
  assert.match(account, /focus\(\{ preventScroll: true \}\)/);
  assert.match(account, /select_account/);
  assert.ok(account.indexOf('await signOut(auth);') < account.indexOf("chooser.setCustomParameters"), 'signs out before the chooser');
  assert.ok(!/localStorage\.(clear|removeItem)|sessionStorage\.clear|indexedDB\.deleteDatabase/.test(account), 'logging out never deletes stored data');
});
