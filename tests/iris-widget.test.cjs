// Iris across the site: which pages carry the chat, which never do, that there is one shared copy of the chat code, and that the generated
// stylesheet is in step with the homepage's. Static checks; the browser behavior is tests/iris-widget-browser.cjs.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

// Every public page that should have Iris: the arcade directory, the whole store, every resource page, About, the Sleeping Pod
const WITH_IRIS = [
  'games-list.html', 'about.html', 'sleeping_pod.html',
  'resources.html', 'legal_resources.html', 'curious.html', 'osint.html', 'anti-osint.html', 'leaks.html', 'opsec.html', 'borderless.html', 'neurodivergent.html', 'biohacking.html',
  'store-first-page.html', 'store-apparel.html', 'store-apps.html', 'store-books.html', 'store-electronics.html', 'store-neurohackers.html', 'store-survival.html',
];
// Games, their interfaces, standalone sites and the in-world Iris pages: never
const WITHOUT_IRIS = [
  'void-runner.html', 'game.html', 'raven.html', 'obs.html', 'chatbot.html', '404.html',
  'iris-controls.html', 'iris-loadout.html', 'iris-protocols.html', 'iris-redacted.html', 'iris-surveillance.html', 'iris-terminal.html', 'iris-thoughts.html',
  'The Darknet District – Origins.html', 'The-Darknet-District-Book.html',
  'origins/index.html', 'function/index.html', 'admin/void-runner.html', ...fs.readdirSync(path.join(root, 'blackout-protocol')).filter(f => f.endsWith('.html')).map(f => 'blackout-protocol/' + f),
];

test('every page that should have Iris loads the shared widget once, and the homepage keeps its own markup', () => {
  for (const file of WITH_IRIS) {
    const html = read(file);
    const loaders = html.match(/<script src="iris-widget\.js" defer><\/script>/g) ?? [];
    assert.equal(loaders.length, 1, `${file}: one loader`);
    assert.ok(!/id="chatButton"|id="chatContainer"/.test(html), `${file}: no copy of the chat markup (the loader adds it)`);
    assert.ok(html.indexOf('<script src="iris-widget.js"') > html.indexOf('<body'), `${file}: the loader is in the body`);
  }
  const home = read('index.html');
  assert.equal((home.match(/id="chatButton"/g) ?? []).length, 1, 'the homepage has its one chat');
  assert.ok(!home.includes('iris-widget.js'), 'the homepage does not load the widget a second time');
  assert.ok(home.indexOf('iris-chat.js') > home.indexOf('iris-identity.js') && home.indexOf('iris-chat.js') < home.indexOf('src="script.js"'), 'identity, then chat, then the page script');
});

test('no game, game interface, standalone site or in-world Iris page has the chat', () => {
  for (const file of WITHOUT_IRIS) {
    if (!fs.existsSync(path.join(root, file))) continue;
    const html = read(file);
    assert.ok(!/iris-widget|iris-chat\.js|id="chatButton"/.test(html), `${file} must not carry the Iris chat`);
  }
  // and the games' own folders load none of the chat scripts
  for (const dir of ['void-runner', 'blackout-protocol']) {
    for (const f of fs.readdirSync(path.join(root, dir)).filter(f => f.endsWith('.js'))) assert.ok(!/__irisChatLoaded|iris-widget/.test(read(dir + '/' + f)), `${dir}/${f}`);
  }
});

test('the chat code lives in one file: iris-chat.js has it, script.js no longer does, and the widget loads rather than copies', () => {
  const chat = read('iris-chat.js');
  for (const piece of ['function toggleChat', 'async function sendMessage', 'function addMessage', 'async function postToIris', 'function syncChatViewport', 'window.IRIS_API_BASE', 'window.__irisChatLoaded = true']) {
    assert.ok(chat.includes(piece), `iris-chat.js has ${piece}`);
  }
  const script = read('script.js');
  for (const gone of ['function toggleChat', 'function sendMessage', 'function addMessage', 'postToIris', 'syncChatViewport', 'IRIS_API_BASE', 'chatState']) assert.ok(!script.includes(gone), `script.js no longer has ${gone}`);
  const widget = read('iris-widget.js');
  assert.ok(!/async function sendMessage|postToIris|\/api\/chat\/message/.test(widget), 'the loader does not chat');
  assert.match(widget, /document\.getElementById\('chatButton'\)/, 'it does nothing on a page that already has a chat');
  assert.match(widget, /data-iris-widget/, 'a page can opt out');
});

test('the widget builds the same chat the homepage has: the same ids, classes, labels and credit links', () => {
  const home = read('index.html');
  const widget = read('iris-widget.js');
  for (const id of ['chatButton', 'chatContainer', 'chatMinimize', 'chatMessages', 'messageInput', 'sendButton']) {
    assert.ok(home.includes(`id="${id}"`), `homepage has ${id}`);
    assert.ok(new RegExp(`id: '${id}'`).test(widget), `widget builds ${id}`);
  }
  for (const cls of ['chat-button', 'chat-container', 'chat-header', 'profile-pic', 'chat-title', 'chat-minimize', 'chat-messages', 'chat-input', 'chat-credits']) {
    assert.ok(home.includes(cls), `homepage uses ${cls}`);
    assert.ok(widget.includes(cls), `widget uses ${cls}`);
  }
  for (const text of ['Chatting with Iris', 'Chat with Iris', 'Type your message...', 'Minimize chat', 'https://www.met.no/en', 'https://creativecommons.org/licenses/by/4.0/', 'https://www.openstreetmap.org/copyright', 'MET Norway', 'CC BY 4.0']) {
    assert.ok(home.includes(text), `homepage has "${text}"`);
    assert.ok(widget.includes(text), `widget has "${text}"`);
  }
});

test('iris-widget.css is exactly what the build script makes from the homepage styles (run: node tools/build-iris-widget-css.cjs)', () => {
  const { build } = require('../tools/build-iris-widget-css.cjs');
  assert.equal(read('iris-widget.css').replace(/\r\n/g, '\n'), build().replace(/\r\n/g, '\n'));
  const css = read('iris-widget.css');
  assert.ok(!css.includes('site-home'), 'nothing is scoped to the homepage any more');
  assert.match(css, /body\.iris-widget-page\[data-hud="immersive"\] > #chatButton,\s*body\.iris-widget-page\[data-hud="immersive"\] > #chatContainer \{\s*position: fixed;\s*z-index: 1000;/, 'pinned to the screen under hud.css');
});

test('signing out forgets the conversation carried in the tab, and what is saved holds no account data', () => {
  const identity = read('iris-identity.js');
  assert.match(identity, /if \(!on && readHint\(\)\) \{ try \{ window\.sessionStorage\.removeItem\('irisChatV1'\)/);
  const chat = read('iris-chat.js');
  const writer = chat.slice(chat.indexOf('function irisWriteSaved'), chat.indexOf('function irisClearSaved'));
  for (const key of ['sessionId', 'messageCount', 'messages']) assert.ok(writer.includes(key), key);
  assert.ok(!/email|token|uid|clientId|handle|displayName|IrisIdentity/i.test(writer), 'only the session id, the count and the messages are saved');
});

test('the conversation follows the visitor: saved per tab, bounded, validated, and cleared by "reset session"', () => {
  const chat = read('iris-chat.js');
  assert.match(chat, /window\.sessionStorage/);
  assert.ok(!/localStorage/.test(chat), 'only this tab, never longer');
  assert.match(chat, /IRIS_SAVE_MAX_MESSAGES = 60/);
  assert.match(chat, /\^session_\[A-Za-z0-9_\]\+\$/, 'a saved session id is validated before it is trusted');
  assert.match(chat, /irisClearSaved\(\);/, 'reset session forgets it');
  assert.match(chat, /transient: true/, 'the "waking up" and error notices are not carried on');
  assert.match(chat, /textContent = text/, 'restored text is set as text, never as HTML');
  assert.ok(!/innerHTML/.test(chat.replace(/\/\/.*$/gm, '')), 'no HTML is built from conversation text');
});
