// The Function / Frequencies: archive rules, page safety and the empty archive.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const A = require('../function/frequencies/archive-core.js');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const walk = (dir) => fs.readdirSync(path.join(root, dir), { withFileTypes: true })
  .flatMap((entry) => entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);

test('frequencies convert exactly between MHz and Hz', () => {
  assert.equal(A.mhzToHz('27.185'), 27185000);
  assert.equal(A.mhzToHz('27.065'), 27065000);
  assert.equal(A.mhzToHz(' 156.8 '), 156800000);
  assert.equal(A.mhzToHz('7.0035'), 7003500);
  for (const bad of ['', 'abc', '27,185', '-27', '1e3', '27.1234567', '0.001', '30001']) assert.equal(A.mhzToHz(bad), null, bad);
  assert.equal(A.formatFrequency(27185000), '27.185 MHz');
  assert.equal(A.formatFrequency(7003500), '7.0035 MHz');
  assert.equal(A.formatFrequency(915000000), '915.000 MHz');
  assert.equal(A.formatFrequency(77500), '77.500 kHz');
  assert.equal(A.formatFrequency(null), '—');
});

test('times, durations and confidence are formatted without guessing', () => {
  assert.equal(A.formatUtc('2026-10-24T18:00:05Z'), '2026-10-24 18:00:05 UTC');
  assert.equal(A.formatUtc('2026-10-24T18:00:05+02:00'), '—');
  assert.equal(A.formatUtc(null), '—');
  assert.equal(A.formatDuration(4.54), '4.5 s');
  assert.equal(A.formatDuration(125), '2 m 05 s');
  assert.equal(A.formatDuration(3725), '1 h 02 m 05 s');
  assert.equal(A.formatDuration(null), '—');
  assert.equal(A.formatConfidence(0.734), '73%');
  assert.equal(A.formatConfidence(null), 'Not assessed');
  assert.equal(A.formatConfidence(4), 'Not assessed');
  assert.equal(A.label(A.CLASSIFICATIONS, 'numbers_candidate'), 'Numbers station candidate');
  assert.equal(A.label(A.CLASSIFICATIONS, '__proto__'), 'Unrecorded');
});

test('search filters become the API query, and bad input is refused', () => {
  assert.deepEqual(A.buildQuery({}), { query: '', errors: [], filters: {} });
  const built = A.buildQuery({ q: ' ghost ', id: 'obs-1', from: '2026-01-01', to: '2026-01-31', fmin: '27', fmax: '27.405',
    band: 'HF', classification: 'cb', mode: 'am', status: 'unidentified', decoded: 'yes', sort: 'oldest', per_page: '50', page: '3' });
  assert.deepEqual(built.errors, []);
  assert.equal(built.query, 'q=ghost&id=OBS-1&from=2026-01-01&to=2026-01-31&fmin=27000000&fmax=27405000&band=HF&classification=cb&mode=am&status=unidentified&decoded=yes&sort=oldest&per_page=50&page=3');
  assert.equal(A.buildQuery({ q: 'a&b=c' }).query, 'q=a%26b%3Dc');
  assert.equal(A.buildQuery({ sort: 'newest', per_page: '25', page: '1' }).query, '');
  for (const bad of [{ q: 'x'.repeat(101) }, { id: '<script>' }, { from: '01/02/2026' }, { from: '2026-02-01', to: '2026-01-01' },
    { fmin: 'abc' }, { fmin: '30', fmax: '20' }, { band: 'XL' }, { classification: 'alien' }, { sort: 'random' }, { per_page: '7' }, { page: '0' }]) {
    assert.ok(A.buildQuery(bad).errors.length, JSON.stringify(bad));
  }
});

test('shared links restore the form, ignoring anything unexpected', () => {
  assert.deepEqual(A.filtersFromSearch('?q=ghost+signal&fmin=27185000&band=HF&evil=1&page=2'),
    { q: 'ghost signal', fmin: '27.185', band: 'HF', page: '2' });
  assert.deepEqual(A.filtersFromSearch('?q=%E0%A4%A&fmin=abc'), { fmin: '' });
  const round = A.buildQuery(A.filtersFromSearch('?' + A.buildQuery({ fmin: '27.065', fmax: '27.185', q: 'x' }).query));
  assert.equal(round.query, 'q=x&fmin=27065000&fmax=27185000');
});

test('the archive only claims what its status supports', () => {
  const empty = { receiver_state: 'not_commissioned', totals: { observations: 0 }, sources: [] };
  assert.equal(A.archiveNotice(empty).title, 'AWAITING FIRST TRANSMISSION');
  assert.match(A.archiveNotice(empty).text, /No monitoring equipment is connected/);
  assert.doesNotMatch(A.archiveNotice({ ...empty, receiver_state: 'online' }).text, /No monitoring equipment/);
  assert.equal(A.archiveNotice({ ...empty, totals: { observations: 3 } }), null);
  const failed = A.archiveNotice(null);
  assert.equal(failed.tone, 'error');
  assert.ok(failed.retry);
  assert.doesNotMatch(failed.title, /AWAITING/);

  assert.equal(A.channelMonitoring(empty, 27185000), 'Not yet monitored');
  assert.equal(A.channelMonitoring(null, 27185000), 'Not yet monitored');
  const live = { receiver_state: 'online', sources: [{ alias: 'RX-A', state: 'online', channels: [{ frequency_hz: 27185000, role: 'priority' }] }] };
  assert.equal(A.channelMonitoring(live, 27185000), 'Monitored (RX-A)');
  assert.equal(A.channelMonitoring(live, 27065000), 'Not yet monitored');
  assert.equal(A.channelMonitoring({ receiver_state: 'no_contact', sources: [{ alias: 'RX-A', state: 'no_contact', channels: [{ frequency_hz: 27185000 }] }] }, 27185000), 'No contact with station');
});

test('debounce waits for typing to stop', () => {
  const pending = new Map();
  let next = 0;
  const clock = { set: (fn) => { pending.set(++next, fn); return next; }, clear: (id) => pending.delete(id) };
  const calls = [];
  const typed = A.debounce((value) => calls.push(value), 400, clock);
  typed('g'); typed('gh'); typed('gho');
  assert.equal(pending.size, 1);
  [...pending.values()][0]();
  assert.deepEqual(calls, ['gho']);
});

test('debounce calls the real timers the way browsers require', async () => {
  // Browsers throw "Illegal invocation" when setTimeout runs as another object's method.
  const realSet = globalThis.setTimeout, realClear = globalThis.clearTimeout;
  globalThis.setTimeout = function (fn, ms) { if (this !== undefined && this !== globalThis) throw new TypeError('Illegal invocation'); return realSet(fn, ms); };
  globalThis.clearTimeout = function (h) { if (this !== undefined && this !== globalThis) throw new TypeError('Illegal invocation'); return realClear(h); };
  try {
    let calls = 0;
    const typed = A.debounce(() => calls++, 5);
    typed(); typed();
    await new Promise((resolve) => realSet(resolve, 30));
    assert.equal(calls, 1);
  } finally {
    globalThis.setTimeout = realSet;
    globalThis.clearTimeout = realClear;
  }
});

test('the API is Render in production and same-origin for local previews', () => {
  assert.equal(A.apiBase({ hostname: 'thedarknetdistrict.com' }), A.PRODUCTION_API);
  assert.equal(A.apiBase({ hostname: '127.0.0.1' }), '/api/function/frequencies');
  assert.equal(A.apiBase({ hostname: 'localhost.evil.example' }), A.PRODUCTION_API);
  assert.ok(A.PRODUCTION_API.startsWith('https://'));
  assert.ok(A.isObservation({ id: 'OBS-1', observed_at: 'x', frequency_hz: 1, identification: {}, content: {} }));
  assert.ok(!A.isObservation({ id: 'OBS-1', observed_at: 'x', frequency_hz: '1', identification: {}, content: {} }));
});

test('Function pages run only their own scripts and cannot inject markup', () => {
  for (const page of ['function/index.html', 'function/frequencies/index.html']) {
    const html = read(page);
    const csp = /http-equiv="Content-Security-Policy" content="([^"]+)"/.exec(html)[1];
    assert.match(csp, /default-src 'none'/, page);
    assert.doesNotMatch(csp, /unsafe-inline|unsafe-eval|\*/, page);
    assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)[^>]*>/i, page + ' has an inline script');
    assert.doesNotMatch(html, /\son[a-z]+=/i, page + ' has an inline event handler');
    assert.doesNotMatch(html, /googletagmanager|firebase|gtag/i, page);
  }
  const csp = /Content-Security-Policy" content="([^"]+)"/.exec(read('function/frequencies/index.html'))[1];
  assert.match(csp, /require-trusted-types-for 'script'/);
  assert.match(csp, /connect-src 'self' https:\/\/the-darknet-district-site\.onrender\.com;/);
  for (const script of ['function/frequencies/archive-core.js', 'function/frequencies/archive-ui.js']) {
    assert.doesNotMatch(read(script), /innerHTML|outerHTML|insertAdjacentHTML|document\.write|\beval\(|new Function|localStorage|sessionStorage|document\.cookie/, script);
  }
});

test('nothing in the published site is a fabricated or sample record', () => {
  const files = walk('function');
  assert.deepEqual(files.map((f) => path.extname(f)).filter((ext) => !['.html', '.css', '.js', '.svg'].includes(ext)), []);
  for (const file of files) {
    const text = read(file);
    assert.doesNotMatch(text, /SYNTHETIC|OBS-TEST|observed_at"\s*:/, file);
    const addresses = (text.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g) || []).filter((ip) => ip !== '127.0.0.1');
    assert.deepEqual(addresses, [], file + ' contains an IP address');
  }
});

test('the District links to The Function and keeps its own navigation', () => {
  const home = read('index.html');
  assert.match(home, /<a class="tdd-function" href="function\/">[\s\S]*Back door to The Function's website[\s\S]*Observe the activities of the corporation that governs beyond the District\.[\s\S]*<\/a>/);
  const navigation = /<nav\b[^>]*aria-label="Main navigation"[^>]*>([\s\S]*?)<\/nav>/.exec(home)[1];
  for (const [href, label] of [['games-list.html', 'Arcade'], ['store-first-page.html', 'Store'], ['resources.html', 'Resources'], ['sleeping_pod.html', 'Sleeping Pod'], ['about.html', 'About']]) {
    const link = [...navigation.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)].find(match => match[1] === href);
    assert.ok(link, href);
    assert.match(link[2].replace(/<[^>]*>/g, ' '), new RegExp(label), href);
  }
  assert.doesNotMatch(navigation, /class="district-nav__label">Home</);
  assert.match(home, /id="chatButton"/);
  assert.match(read('sitemap.xml'), /\/function\/frequencies\//);
});

test('The Function is always singular', () => {
  const files = ['index.html', 'accents.css', 'frequencies_api.py', ...walk('function'), ...walk('docs/function')];
  for (const file of files) assert.doesNotMatch(read(file), /The Functions\b/, file);
});
