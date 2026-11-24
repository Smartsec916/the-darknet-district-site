const test = require('node:test');
const assert = require('node:assert/strict');
const guide = require('../void-runner/guide-route');
const underground = require('../void-runner/ncz-underground');
const city = require('../void-runner/neochinatown');
const explorer = require('../void-runner/exploration-controller');

const starts = { oldtown: [15, -75], avenue: [25, 6], 'far-south': [36, -190] };
const tea = underground.placeById('under-tea-room').at;
for (const [street, start] of Object.entries(starts)) {
  for (const returning of [false, true]) {
    test(street + (returning ? ' from the underground tea room' : ' to the underground tea room'), () => {
      const follower = guide.follower(), graph = guide.graphFor('neochinatown');
      const dest = returning ? street : 'underground', target = returning ? start : tea;
      let quarter = returning ? 'underground' : street;
      let layout = city.layout('street', quarter), crossings = 0;
      const [x, z] = returning ? [tea[0] + 1.8, tea[1] + 1.4] : start;
      const player = { x, z, yaw: 0, y: 1.7, eye: 1.68, height: 0 };
      for (let i = 0; i < 3600; i++) {
        const step = follower.update({ graph, scene: 'neochinatown', area: 'street', quarter, player,
          goal: { x: target[0], z: target[1], quarter: dest }, key: 'tea', dt: .05, solids: layout.solids });
        assert.ok(step, 'Lost route in ' + quarter);
        if (step.final && quarter === dest && step.length < 1.2) {
          assert.equal(crossings, 1);
          return;
        }
        const next = step.waypoint;
        if (next.transition && Math.hypot(next.x - player.x, next.z - player.z) < 1.35) {
          const id = next.id.slice('stairs:'.length, -1);
          const arrival = returning ? underground.leave(id) : underground.arrive(id);
          quarter = arrival.quarter;
          layout = city.layout('street', quarter);
          Object.assign(player, { x: arrival.spawn[0], z: arrival.spawn[2], vx: 0, vz: 0 });
          crossings++;
          continue;
        }
        // The browser animates these proximity-operated doors. Walls, fences, rails and furniture stay solid.
        for (const solid of layout.solids) if (solid.door) solid.open = true;
        player.yaw = step.bearing;
        explorer.step(player, { x: 0, z: 1 }, .05, layout);
      }
      assert.fail('Player did not arrive from ' + street);
    });
  }
}

test('mission navigation uses the Reyes access point until the door is hacked and the Veyra cab for its other floor', () => {
  const modules = require('../void-runner/modules');
  const escort = require('../void-runner/npc-escort');
  const missions = require('../void-runner/main-story').trees().flatMap(t => t.missions);
  const document = { createElement: () => ({ dataset: {}, setAttribute() {} }),
    body: { appendChild() {} }, head: { appendChild() {} } };
  let instance, room;
  const context = { document, setInterval() {}, VoidModules: modules, VoidNPCEscort: escort,
    VoidLiveContent: { env: { trees: [{ missions }] } },
    VoidApartments: { open: () => [instance], insideMod: () => room } };
  require('node:vm').runInNewContext(require('node:fs').readFileSync(require.resolve('../void-runner/mission-guide'), 'utf8'), context);
  function enter(apt, mod) {
    const mission = missions.find(m => m.apartments?.some(a => a.id === apt));
    const loc = mission.apartments.find(a => a.id === apt);
    instance = { loc, key: mission.id + '/' + apt, mission: mission.id, id: apt, hacked: [] };
    room = mod;
    context.walkingLocation = modules.layout(instance, modules.analyse(loc).clusterOf(room).id);
  }
  const next = mod => context.VoidMissionGuide.aptGoal({ apt: { a: instance.id, m: instance.mission, mod } });
  const at = interaction => Array.from(interaction.position);
  enter('reyes', 'hall');
  const hall = context.walkingLocation;
  assert.deepEqual(Array.from(next('flat').position), at(hall.interactions.find(i => i.ap === 'reyes/hall.d0')));
  instance.hacked.push('hall.d0');
  assert.deepEqual(Array.from(next('flat').position), at(hall.interactions.find(i => i.action === 'mod-portal' && i.door?.includes('flat.entry'))));
  enter('veyra', 'lobby');
  const cab = context.walkingLocation.cluster.mods.find(m => m.type === 'elevator');
  assert.deepEqual(Array.from(next('office').position), [cab.cx, 1.7, cab.cz]);
});

test('a known unreachable room gives no arrow and a solid barrier increases the displayed walk', () => {
  const regions = [{ id:'a', rects:[[0,3,0,3]] }, { id:'b', rects:[[5,8,0,3]] }];
  assert.deepEqual(guide.plan({regions, portals:[]}, {x:1,z:1}, {x:6,z:1}), []);
  const step = guide.follower().update({ graph:null, scene:'test', player:{x:0,z:0}, goal:{x:6,z:0},
    key:'detour', dt:.05, solids:[{ position:[3,1,0],size:[1,2,5] }] });
  assert.ok(step && !step.final && Math.abs(step.waypoint.z)>2);
  assert.ok(step.length>7);
});
