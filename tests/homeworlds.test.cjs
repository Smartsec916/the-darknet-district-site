const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../void-runner/campaign.js'),M=require('../void-runner/mission-log.js'),U=require('../void-runner/universe.js'),P=require('../void-runner/progression.js'),R=require('../void-runner/flight-runtime.js');
function district(){const s=C.fresh();s.quest='open';s.location='earth';s.progression.completed=true;s.progression.flags.missileFired=true;s.universe=U.restore({...s.universe,freeTravel:true},s);s.universe.freeTravel=true;s.story.flags.metAdmin=true;return s;}
function run(s,accept,faction){accept(s,faction);C.complete(s);C.deliverFaction(s,faction);s.location='earth';C.collectFactionPayment(s);}
// A pilot who has delivered a supply contract and been offered the homeworld run.
function offered(faction){const s=district();run(s,C.acceptFaction,'communion');run(s,C.acceptFaction,'natural-order');run(s,C.acceptSupply,faction);return s;}
const mission=(s,id)=>M.all(s,C).find(m=>m.id===id);
function toPlanet(s,faction){const h=C.homeworlds[faction];while(s.location!==h.planet){assert(C.flight(s));C.complete(s);}}

test('the homeworlds exist in their factions\' systems and open only when the offer is accepted',()=>{
  assert.equal(U.locations.nexus.name,'The Nexus');assert.equal(U.system('nexus'),'communion');
  assert.equal(U.locations['order-homeworld'].name,'Natural Order Homeworld');assert.equal(U.system('order-homeworld'),'natural-order');
  const s=offered('communion');assert(!s.universe.discoveredLocations.includes('nexus'));
  C.acceptOrigin(s,'communion');assert(s.universe.discoveredLocations.includes('nexus'));
});
test('Communion: carry Elara\'s shipment to Kess, help on The Nexus, earn the scanner once',()=>{
  const s=offered('communion');assert(C.acceptOrigin(s,'communion'));assert.equal(s.contract,'communion-origin-mission-01');
  assert.equal(C.flight(s).reward,0);toPlanet(s,'communion');assert.equal(s.location,'nexus');
  assert(C.deliverOrigin(s,'communion'));assert(mission(s,'communion-origin-mission-01').completed);assert.equal(C.workState(s,'communion'),'offered');
  assert(!C.workStep(s,'communion','nexus-depot'),'nothing to do before agreeing');
  assert(C.acceptWork(s,'communion'));assert.equal(mission(s,'communion-restoration-01').interaction,'nexus-depot');
  assert(!C.workStep(s,'communion','nexus-aid'),'cannot deliver supplies before collecting them');
  assert(!C.completeWork(s,'communion'),'not before the work is done');
  for(const step of ['nexus-depot','nexus-aid','nexus-relay','nexus-power'])assert(C.workStep(s,'communion',step),step);
  assert(!C.workStep(s,'communion','nexus-relay'),'steps never repeat');assert.equal(mission(s,'communion-restoration-01').interaction,'kess');
  assert(C.completeWork(s,'communion'));assert(!C.completeWork(s,'communion'));
  assert.equal(s.progression.equipment.owned.filter(id=>id==='communion-scanner').length,1);assert(mission(s,'communion-restoration-01').completed);
  assert.deepEqual(C.factionEquipment(s),{scannerEarned:true,scannerInstalled:false,thrustersEarned:false,thrustersInstalled:false});
});
test('Natural Order: carry Marcus\'s shipment to Mercer, help on the farms, earn the thrusters',()=>{
  const s=offered('natural-order');C.acceptOrigin(s,'natural-order');toPlanet(s,'natural-order');assert(C.deliverOrigin(s,'natural-order'));
  assert(C.acceptWork(s,'natural-order'));
  for(const step of ['order-depot','order-farm','order-granary','order-market','order-workshop','order-solar'])assert(C.workStep(s,'natural-order',step),step);
  assert(C.completeWork(s,'natural-order'));assert(s.progression.equipment.owned.includes('order-thrusters'));assert.equal(s.story.flags.orderThrusters,true);
});
test('if the hold is busy the shipment waits with the giver',()=>{
  const s=offered('communion');s.contract='medicine';assert(C.acceptOrigin(s,'communion'));assert.equal(C.originState(s,'communion'),'accepted');
  assert.equal(mission(s,'communion-origin-mission-01').interaction,'elara');s.contract=null;assert(C.loadOrigin(s,'communion'));assert.equal(C.originState(s,'communion'),'loaded');
});
test('the scanner shortens missile lock time without touching range, damage or ammunition',()=>{
  const s=district();s.progression.equipment.owned.push('communion-scanner');const balance={missileLockTime:1.5,missileDamage:10,missileCooldown:2,missileRange:300};
  const config=st=>R.configure({stats:st,systems:{},upgrades:{},loadout:{},missiles:6,balance});
  const before=config(C.stats(s)).missileBalance;assert(P.install(s,'sensor','communion-scanner'));const after=config(C.stats(s)).missileBalance;
  assert.equal(before.missileLockTime,1.5);assert(Math.abs(after.missileLockTime-1.05)<1e-9,'1.5 s → 1.05 s on the Kestrel');
  assert.equal(after.missileDamage,before.missileDamage);assert.equal(after.missileRange,before.missileRange);assert.equal(after.missileCooldown,before.missileCooldown);
});
test('the thrusters sharpen turning without raising top speed, weapons or shields',()=>{
  const s=district();s.progression.equipment.owned.push('order-thrusters');const before=C.stats(s);assert(P.install(s,'thrusters','order-thrusters'));const after=C.stats(s);
  for(const k of ['yawRate','pitchRate','rollRate'])assert(after.flight[k]>before.flight[k]*1.1,k);
  assert(after.flight.angularAcceleration>before.flight.angularAcceleration*1.3);assert.equal(after.flight.maxSpeed,before.flight.maxSpeed);
  assert.equal(after.damage,before.damage);assert.equal(after.shield,before.shield);
});
test('both faction modules can be fitted together, are never sold, and persist',()=>{
  const s=district();s.credits=99999;assert(!P.buy(s,'communion-scanner'));assert(!P.buy(s,'order-thrusters'));
  s.progression.equipment.owned.push('communion-scanner','order-thrusters');assert(P.install(s,'sensor','communion-scanner'));assert(P.install(s,'thrusters','order-thrusters'));
  const r=C.restore(JSON.stringify(s));assert.deepEqual(C.factionEquipment(r),{scannerEarned:false,scannerInstalled:true,thrustersEarned:false,thrustersInstalled:true});
});
test('homeworld progress survives save and load, and Rook never runs freight there',()=>{
  const s=offered('communion');C.acceptOrigin(s,'communion');toPlanet(s,'communion');C.deliverOrigin(s,'communion');C.acceptWork(s,'communion');C.workStep(s,'communion','nexus-depot');
  const r=C.restore(JSON.stringify(s));assert.equal(r.location,'nexus');assert.equal(C.workState(r,'communion'),'accepted');assert.equal(r.story.flags.nexusSupplies,'carrying');
  r.location='meridian';for(let n=0;n<10;n++){r.story.flags.rookRuns=n;assert.notEqual(C.rookRunTarget(r),'nexus');}
});
