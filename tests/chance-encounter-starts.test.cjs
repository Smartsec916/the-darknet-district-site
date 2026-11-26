const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const { randomUUID } = require('node:crypto');
const engine = require('../void-runner/chance-encounter.js');
const source = fs.readFileSync(require.resolve('../void-runner/chance-encounter-game.js'), 'utf8');

test('place and moving NPC visits arm one roll on arrival and stay private to the current player', async () => {
  const seed = require('../void-runner/chance-encounter-seed.json');
  const graphs = ['place','near'].map(kind => ({
    ...seed, enabled:true, id:kind,
    conditions:{...seed.conditions,startTrigger:kind==='near'?{kind,target:'admin',distance:3}:{kind,target:'store'}}
  }));
  let tick, time=1e6, distance=9;
  const requests=[], listeners=new Map();
  const world={
    mode:'walking',walker:{x:5,z:10},walkingLocation:{part:'shop',area:'interior'},
    crypto:{randomUUID},console,Date:{now:()=>time},VoidAccount:{user:{uid:'a'}},VoidDevTest:{active:false},
    VoidChanceEncounter:engine,VoidNetwork:{request:async()=>({encounters:graphs})},
    VoidLiveContent:{nearBlocked:()=>false,giverDistance:()=>distance},
    VoidConsumableGame:{request:async(_,body)=>{requests.push(body);return {active:false,rolled:!!body.startEvent};}},
    setInterval:fn=>{tick=fn;},addEventListener:(name,fn)=>listeners.set(name,fn)
  };
  vm.runInNewContext(source,world);
  const enter=()=>listeners.get('void-place')({detail:{entered:['store'],left:[]}});
  await tick();distance=2;enter();await tick();
  assert.equal(requests.length,0);
  world.walkingLocation={part:'street',area:'street',quarter:'oldtown'};
  world.walker={x:52,z:-84};distance=10;
  await tick();
  assert.deepEqual(requests.map(r=>r.startEvent.kind),['place','near']);
  await tick();assert.equal(requests.length,2);
  time+=300000;await tick();
  assert.equal(requests.filter(r=>r.startEvent).length,2);
  world.VoidDevTest.active=true;enter();await tick();
  world.VoidDevTest.active=false;world.VoidAccount.user={uid:'b'};await tick();
  assert.equal(requests.filter(r=>r.startEvent).length,2);
  enter();await tick();
  assert.equal(requests.filter(r=>r.startEvent).length,3);
});
