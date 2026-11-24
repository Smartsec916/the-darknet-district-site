const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const script = fs.readFileSync(require.resolve('../void-runner/cinematic-presentation.js'), 'utf8');

function source(query) {
  const calls = [];
  const surface = {};
  const env = {
    URL, location: {href: 'https://game.example/void-runner.html' + query},
    W: 1024, H: 768, mode: 'walking', draw: () => calls.push('game'),
    ctx: {drawImage: image => calls.push(image === surface ? 'world' : 'unexpected')},
    VoidBabylon: {scene: {getEngine: () => ({getRenderingCanvas: () => surface})}},
    document: {
      createElement: () => ({}), head: {append: () => calls.push('style')},
      documentElement: {classList: {toggle: (_, active) => calls.push(active)}}
    }
  };
  vm.runInNewContext(script, env);
  return {env, calls};
}

test('ordinary sessions retain the original draw path', () => {
  const {env, calls} = source('');
  env.draw();
  assert.deepEqual(calls, ['game']);
});

test('a clean source preserves menus and hacked-camera feeds', () => {
  const {env, calls} = source('?cinemaView=clean');
  env.draw();
  env.VoidCameraFeed = {active: true};
  env.draw();
  env.VoidCameraFeed.active = false;
  env.mode = 'menu';
  env.draw();
  assert.deepEqual(calls, ['style', 'game', true, 'world', 'game', false, 'game', false]);
});
