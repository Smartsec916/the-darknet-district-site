const test = require('node:test');
const assert = require('node:assert/strict');
const pilot = require('../void-runner/pilot-flight.js');
const { ships } = require('../void-runner/ships.js');

test('pitch and bank respond immediately when reversing off either stop', () => {
  for (const ship of Object.values(ships)) {
    for (const hz of [30, 60, 144]) {
      for (const [axis, control, limit] of [['pitch', 'y', 1.48], ['roll', 'roll', 1.2]]) {
        for (const direction of [-1, 1]) {
          const state = { yaw: 0, pitch: 0, roll: 0, throttle: 0.8 };
          pilot.reset(state);
          for (let frame = 0; frame < hz * 3; frame++) {
            pilot.step(state, { [control]: direction }, 1 / hz, ship.flight);
          }
          assert.equal(state[axis], limit * direction);
          pilot.step(state, { [control]: -direction }, 1 / hz, ship.flight);
          assert.ok(state[axis] * direction < limit, ship.name + ' ' + axis + ' at ' + hz + ' Hz');
        }
      }
    }
  }
});
