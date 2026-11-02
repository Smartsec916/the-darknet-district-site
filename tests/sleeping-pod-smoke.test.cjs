// The Sleeping Pod smoke: what must stay true in the source. The behavior is tests/sleeping-pod-smoke-browser.cjs.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('nothing in the smoke path looks at the connection, the device class or the browser name (connection speed cannot be why it is missing)', () => {
  const smoke = read('sleeping-pod-smoke.js').replace(/\/\*[^]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  assert.ok(!/navigator\.(connection|deviceMemory|hardwareConcurrency|userAgent)|saveData|effectiveType/.test(smoke));
  assert.ok(!/fetch\(|XMLHttpRequest|import\(/.test(smoke), 'it loads nothing: the plume is drawn from code');
});

test('the smoke is never switched off for being slow or unsupported: it degrades in quality, then falls back to Canvas 2D', () => {
  const smoke = read('sleeping-pod-smoke.js');
  assert.match(smoke, /quality > 0\.3/, 'quality only goes down to a floor');
  assert.ok(!/disabled\s*=\s*true/.test(smoke), 'no permanent "disabled" switch any more');
  for (const piece of ['function use2d', 'function draw2d', 'function switchTo2d', 'function drewSomething', 'webglBroken']) assert.ok(smoke.includes(piece), piece);
  assert.match(smoke, /pageshow[^]*persisted/, 'a page restored from the back/forward cache starts again');
  assert.match(smoke, /iris-chat-toggle/, 'it listens for the Iris chat window');
  assert.match(smoke, /phone\(\) && now - lastDraw < 30/, 'about 30 frames a second on a phone layout');
});

test('reduced motion: the page no longer hides the canvas, and the script shows a still haze that only fades (no frame loop)', () => {
  const page = read('sleeping_pod.html');
  assert.ok(!/\.pod-smoke \{ display: none !important; \}/.test(page), 'the old rule that removed the smoke for reduced motion is gone');
  const smoke = read('sleeping-pod-smoke.js');
  const still = smoke.slice(smoke.indexOf('function startStill'), smoke.indexOf('function frame'));
  assert.ok(!/requestAnimationFrame/.test(still), 'no animation frames in the still version');
  assert.match(still, /opacity/);
});

test('the pod page: dimming reaches every smoke canvas, the Iris button is lifted above the pod controls on phones, and the desktop shader is the original', () => {
  const page = read('sleeping_pod.html');
  assert.match(page, /smokeLayers = \(\) => \[\.\.\.document\.querySelectorAll\('\.pod-smoke'\)\]/);
  assert.match(page, /body\.iris-widget-page \.chat-button \{ bottom: calc\(112px/);
  const smoke = read('sleeping-pod-smoke.js');
  // the shader text is byte-for-byte what it was when the effect was approved (commit bb8d819, kept as a fixture): desktop unchanged
  const original = read('tests/fixtures/pod-smoke-shader-bb8d819.txt').replace(//g, '');
  const start = smoke.indexOf('var FRAG = [');
  const current = smoke.slice(start, start + original.length).replace(//g, '');
  assert.equal(current, original.trimEnd().length < original.length ? original : original);
});
  const frag = text => text.slice(text.indexOf("var FRAG = ["), text.indexOf("].join('\\n');", text.indexOf("var FRAG = [")));
  assert.equal(frag(smoke).replace(/\r/g, ''), frag(original).replace(/\r/g, ''));
});
