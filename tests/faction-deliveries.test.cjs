const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../void-runner/campaign.js'),M=require('../void-runner/mission-log.js'),U=require('../void-runner/universe.js');
// A pilot standing in The Darknet District after meeting Admin.
function district(){const s=C.fresh();s.quest='open';s.location='earth';s.progression.completed=true;s.progression.flags.missileFired=true;s.universe=U.restore({...s.universe,freeTravel:true},s);s.universe.freeTravel=true;s.story.flags.metAdmin=true;return s;}
const mission=(s,id)=>M.all(s,C).find(m=>m.id===id);
function deliverAndPay(s,faction){const d=C.factionDeliveries[faction];C.complete(s);assert.equal(s.location,d.destination);assert(C.deliverFaction(s,faction));s.location='earth';return C.collectFactionPayment(s);}

test('the two faction systems and outposts exist with their approved names',()=>{
  assert.equal(U.systems.communion.name,'Cantor System');assert.equal(U.systems.communion.hub,'vigil');assert.equal(U.locations.vigil.name,'The Vigil');
  assert.equal(U.systems['natural-order'].name,'Garrow System');assert.equal(U.systems['natural-order'].hub,'holdfast');assert.equal(U.locations.holdfast.name,'Holdfast');
  assert.equal(C.stations.vigil.name,'The Vigil');assert.equal(C.stations.holdfast.name,'Holdfast');
});
test('Admin offers both deliveries only after the player has met him',()=>{
  const s=district();s.story.flags.metAdmin=false;assert.deepEqual(C.factionOffers(s),[]);
  s.story.flags.metAdmin=true;assert.deepEqual(C.factionOffers(s).sort(),['communion','natural-order']);
  // Asking about a delivery is dialogue only; nothing changes until the player accepts.
  assert.equal(s.contract,null);assert(!s.universe.discoveredSystems.includes('communion'));
});
test('accepting one delivery opens only that system and leaves the other untouched',()=>{
  const s=district();assert(C.acceptFaction(s,'communion'));
  assert.equal(s.contract,'communion-delivery');assert.equal(s.story.flags.factionFirst,'communion');assert.equal(s.story.flags.communionDelivery,'accepted');
  assert(s.universe.discoveredSystems.includes('communion'));assert(!s.universe.discoveredSystems.includes('natural-order'));
  assert.equal(s.story.flags.orderDelivery,undefined);assert.deepEqual(C.factionOffers(s),[]);assert(!C.acceptFaction(s,'natural-order'));
  assert(M.track(s,'communion-delivery',C));assert.equal(mission(s,'communion-delivery').destination,'vigil');
  assert(U.destinations(s).includes('vigil'));
});
test('arriving does not pay; the recipient takes the cargo and the goal returns to the District',()=>{
  const s=district();C.acceptFaction(s,'communion');M.track(s,'communion-delivery',C);
  const f=C.flight(s);assert.equal(f.destination,'vigil');assert.equal(f.reward,0);
  const credits=s.credits;C.complete(s);
  assert.equal(s.location,'vigil');assert.equal(s.contract,null);assert(s.credits<=credits);
  let m=mission(s,'communion-delivery');assert(!m.completed);assert.equal(m.objective,'Deliver the equipment to Dr. Elara Voss');assert.equal(m.interaction,'elara');
  assert(C.deliverFaction(s,'communion'));assert(!C.deliverFaction(s,'communion'));
  m=mission(s,'communion-delivery');assert.equal(m.destination,'earth');assert.equal(m.interaction,'district-iris');assert.equal(m.objective,'Return to The Darknet District and collect payment');
  assert.equal(s.story.flags.adminAway,true);assert.equal(s.universe.trackedMission,'communion-delivery');
});
test('Iris pays once, then offers the remaining delivery',()=>{
  const s=district();C.acceptFaction(s,'natural-order');
  const paid=deliverAndPay(s,'natural-order');assert.equal(paid.length,1);assert.equal(paid[0].payment,1200);
  const credits=s.credits;assert.deepEqual(C.collectFactionPayment(s),[]);assert.equal(s.credits,credits);
  assert(mission(s,'order-delivery').completed);assert.equal(s.story.flags.orderDelivery,'paid');
  assert.deepEqual(C.factionOffers(s),['communion']);assert(C.acceptFaction(s,'communion'));assert.equal(s.story.flags.factionFirst,'natural-order');
  deliverAndPay(s,'communion');assert.equal(s.story.flags.factionsVisited,true);assert.deepEqual(C.factionOffers(s),[]);
  assert(mission(s,'communion-delivery').completed);
});
test('a delivery cannot be handed over somewhere else or before it is accepted',()=>{
  const s=district();assert(!C.deliverFaction(s,'communion'));C.acceptFaction(s,'communion');assert(!C.deliverFaction(s,'communion'));
  s.location='holdfast';assert(!C.deliverFaction(s,'natural-order'));
});
test('generic contract acceptance cannot bypass the District offer rules',()=>{
  const s=district();s.story.flags.metAdmin=false;assert(!C.accept(s,'communion-delivery'));
  s.story.flags.metAdmin=true;assert(C.accept(s,'communion-delivery'));assert.equal(s.story.flags.communionDelivery,'accepted');
});
test('faction progress survives save and load at every stage',()=>{
  const s=district();C.acceptFaction(s,'communion');
  let r=C.restore(JSON.stringify(s));assert.equal(r.contract,'communion-delivery');assert(r.universe.discoveredSystems.includes('communion'));assert.equal(C.flight(r).destination,'vigil');
  C.complete(s);r=C.restore(JSON.stringify(s));assert.equal(r.location,'vigil');assert(C.deliverFaction(r,'communion'));
  r=C.restore(JSON.stringify(r));assert.equal(r.story.flags.communionDelivery,'delivered');assert.equal(mission(r,'communion-delivery').destination,'earth');
  r.location='earth';C.collectFactionPayment(r);r=C.restore(JSON.stringify(r));assert(mission(r,'communion-delivery').completed);assert.deepEqual(C.factionOffers(r),['natural-order']);
  assert(r.universe.discoveredLocations.includes('vigil'));
});
test('Rook holds runs into a faction system until the player has made Admin’s delivery there',()=>{
  const s=district();s.location='meridian';s.story.flags.rookSystems='erebus,sol';C.acceptFaction(s,'communion');s.contract=null;
  assert.notEqual(C.rookRunTarget(s),'vigil');for(let n=0;n<8;n++){s.story.flags.rookRuns=n;assert.notEqual(C.rookRunTarget(s),'vigil');}
  s.story.flags.rookRuns=0;s.story.flags.communionDelivery='delivered';assert.equal(C.rookRunTarget(s),'vigil');
});
test('older saves without faction state are unchanged',()=>{
  const s=district();delete s.story.flags.metAdmin;const r=C.restore(JSON.stringify(s));
  assert.deepEqual(r.universe.discoveredSystems.sort(),['erebus','sol']);assert.deepEqual(C.factionOffers(r),[]);
});
test('Admin is hidden once a delivery is made, using the notFlags condition',()=>{
  const Story=require('../void-runner/story.js'),s=district(),hidden={notFlags:{adminAway:true}};
  assert(Story.matches(s,hidden));C.acceptFaction(s,'communion');C.complete(s);C.deliverFaction(s,'communion');assert(!Story.matches(s,hidden));
});
