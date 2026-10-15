const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../void-runner/campaign.js'),M=require('../void-runner/mission-log.js'),U=require('../void-runner/universe.js');
function district(){const s=C.fresh();s.quest='open';s.location='earth';s.progression.completed=true;s.progression.flags.missileFired=true;s.universe=U.restore({...s.universe,freeTravel:true},s);s.universe.freeTravel=true;s.story.flags.metAdmin=true;return s;}
function run(s,accept,faction){assert(accept(s,faction));C.complete(s);assert(C.deliverFaction(s,faction));s.location='earth';return C.collectFactionPayment(s);}
// A pilot who has finished and been paid for both introductory deliveries.
function regular(){const s=district();run(s,C.acceptFaction,'communion');run(s,C.acceptFaction,'natural-order');return s;}
const mission=(s,id)=>M.all(s,C).find(m=>m.id===id);

test('Iris offers both follow-up contracts only after both introductory deliveries are paid',()=>{
  const s=district();assert.deepEqual(C.supplyOffers(s),[]);run(s,C.acceptFaction,'communion');assert.deepEqual(C.supplyOffers(s),[]);
  run(s,C.acceptFaction,'natural-order');assert.equal(s.story.flags.factionsVisited,true);assert.deepEqual(C.supplyOffers(s).sort(),['communion','natural-order']);
});
test('each contract carries its faction’s cargo and goes to the same recipient',()=>{
  assert.match(C.supplyDeliveries.communion.cargo,/processing modules.*sensor assemblies.*research electronics/i);assert.equal(C.supplyDeliveries.communion.recipient,'elara');assert.equal(C.supplyDeliveries.communion.destination,'vigil');
  assert.match(C.supplyDeliveries['natural-order'].cargo,/control assemblies.*mechanical components.*repair equipment/i);assert.equal(C.supplyDeliveries['natural-order'].recipient,'marcus');assert.equal(C.supplyDeliveries['natural-order'].destination,'holdfast');
});
test('taking one contract leaves the other available, and both can be completed',()=>{
  const s=regular();assert(C.acceptSupply(s,'communion'));assert.deepEqual(C.supplyOffers(s),['natural-order']);
  assert(!C.acceptSupply(s,'natural-order'),'one cargo contract aboard at a time');
  C.complete(s);assert(C.deliverFaction(s,'communion'));assert(C.acceptSupply(s,'natural-order'),'the other can be taken once the hold is free');
  C.complete(s);assert.equal(C.deliverFaction(s,'natural-order').kind,'supply');s.location='earth';
  const credits=s.credits,paid=C.collectFactionPayment(s);assert.equal(paid.length,2);assert.equal(s.credits,credits+3000);
  assert.deepEqual(C.collectFactionPayment(s),[]);assert.equal(s.credits,credits+3000,'never paid twice');
  assert(mission(s,'communion-supply').completed&&mission(s,'order-supply').completed);assert.deepEqual(C.supplyOffers(s),[]);
});
test('arrival pays nothing; delivery sends the player back to Iris',()=>{
  const s=regular();C.acceptSupply(s,'natural-order');const f=C.flight(s);assert.equal(f.destination,'holdfast');assert.equal(f.reward,0);
  const credits=s.credits;C.complete(s);assert(s.credits<=credits);C.deliverFaction(s,'natural-order');
  const m=mission(s,'order-supply');assert.equal(m.destination,'earth');assert.equal(m.interaction,'district-iris');assert.equal(m.objective,'Return to The Darknet District and collect payment');
});
test('the recipient offers a homeworld delivery that stays available until accepted',()=>{
  const s=regular();C.acceptSupply(s,'communion');C.complete(s);assert.equal(C.originState(s,'communion'),null);
  C.deliverFaction(s,'communion');assert.equal(C.originState(s,'communion'),'offered');assert.equal(C.originState(s,'natural-order'),null);
  // Leaving to collect payment keeps the offer with Elara.
  s.location='earth';C.collectFactionPayment(s);assert.equal(C.originState(s,'communion'),'offered');
  assert(C.acceptOrigin(s,'communion'));assert(!C.acceptOrigin(s,'communion'));assert.equal(C.originState(s,'communion'),'loaded','cargo loads when the hold is free');
  const m=mission(s,'communion-origin-mission-01');assert(m&&!m.completed);assert.equal(m.destination,'nexus');assert(s.universe.discoveredLocations.includes('nexus'));
});
test('the generic cargo board cannot hand out these contracts early',()=>{
  const s=district();assert(!C.accept(s,'communion-supply'));const r=regular();assert(C.accept(r,'order-supply'));assert.equal(r.story.flags.orderSupply,'accepted');
});
test('follow-up contracts and homeworld offers survive save and load',()=>{
  const s=regular();C.acceptSupply(s,'communion');let r=C.restore(JSON.stringify(s));assert.equal(r.contract,'communion-supply');assert.equal(C.flight(r).destination,'vigil');
  C.complete(r);C.deliverFaction(r,'communion');r=C.restore(JSON.stringify(r));assert.equal(C.supplyStage(r,'communion'),'delivered');assert.equal(C.originState(r,'communion'),'offered');
  C.acceptOrigin(r,'communion');r=C.restore(JSON.stringify(r));assert.equal(C.originState(r,'communion'),'loaded');assert.equal(r.contract,'communion-origin-mission-01');assert(mission(r,'communion-origin-mission-01'));
  assert.deepEqual(C.supplyOffers(r),['natural-order']);
});
