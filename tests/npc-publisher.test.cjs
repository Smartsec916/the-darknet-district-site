const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {register} = require('../tools/npc-publisher.cjs');
const model = fs.readFileSync('void-runner/assets/models/crowd/npc-rin.glb');

test('a new model uses only the private repository and schedules an asset build', async () => {
  const calls = [];
  const result = await register(model, {allowOverTriangleLimit:true}, async (args, body) => {
    calls.push(args);
    if (args.includes('--jq')) throw Error('HTTP 404');
    if (body) {
      const packed = Buffer.from(JSON.parse(body).content, 'base64');
      assert.equal(packed.toString('ascii', 0, 4), 'VRPK');
      assert.equal(JSON.parse(body).branch, 'main');
    }
  });
  assert.equal(result.asset, 'npc-upload-' + result.hash.slice(0, 32));
  assert.ok(calls[1].includes('repos/Smartsec916/void-runner-licensed-assets/contents/void-runner/assets/models/crowd/' + result.asset + '.vrpak'));
  assert.deepEqual(calls[2], ['workflow','run','pages.yml','--repo','Smartsec916/the-darknet-district-site','--ref','main']);
});

test('a failed private repository check prevents all writes', async () => {
  let calls = 0;
  await assert.rejects(register(model, {allowOverTriangleLimit:true}, async () => {
    calls++;
    throw Error('HTTP 403');
  }), /403/);
  assert.equal(calls, 1);
});
