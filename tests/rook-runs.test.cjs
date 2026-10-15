const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../void-runner/campaign.js'),M=require('../void-runner/mission-log.js');
function open(){const s=C.fresh();s.quest='open';s.location='meridian';s.progression.completed=true;s.progression.flags.missileFired=true;s.universe=require('../void-runner/universe.js').restore({...s.universe,freeTravel:true},s);s.universe.freeTravel=true;return s;}
test('older saves that used the undertow id load at Rusthaven',()=>{
  const old={version:1,quest:'open',location:'undertow',credits:10,completed:4,contract:null,upgrades:{guns:1,armor:0,engines:0}};
  const s=C.restore(JSON.stringify(old));assert.equal(s.location,'rusthaven');assert.equal(C.stations.rusthaven.name,'Rusthaven Port');
});
test('Rook keeps offering numbered freight runs and sends the first one into a newly opened system',()=>{
  const s=open();s.story.flags.rookSystems='erebus';
  assert.equal(C.rookRunTarget(s),'sol-belt');
  assert(C.accept(s,'rook-run'));const f=C.flight(s);assert.equal(f.destination,'sol-belt');assert.equal(f.id,'rook-run-1');assert(f.reward>0);
  assert(M.all(s,C).some(m=>m.id==='rook-run-1'&&!m.completed));
  const credits=s.credits;C.complete(s);assert.equal(s.location,'sol-belt');assert(s.credits>credits-1000);assert.equal(s.contract,null);
  assert.equal(s.story.flags.rookRuns,1);assert.match(s.story.flags.rookSystems,/sol/);
  assert(M.all(s,C).some(m=>m.id==='rook-run-1'&&m.completed));
  // Next run is a new mission entry, rotating through known stops.
  assert(C.accept(s,'rook-run'));assert.equal(C.missionFlight(s).id,'rook-run-2');assert.notEqual(C.rookRun(s).destination,'sol-belt');
  const r=C.restore(JSON.stringify(s));assert.equal(r.contract,'rook-run');assert.equal(C.rookRun(r).destination,C.rookRun(s).destination);
});
