const test=require('node:test'), assert=require('node:assert/strict');
const C=require('../void-runner/campaign'), P=require('../void-runner/progression'), S=require('../void-runner/ships');
const U=require('../void-runner/universe'), AI=require('../void-runner/enemy-pilots');
const refit={
 starter:['pulse','engine','ablative-laminate','warp-inducer'],
 ship2:['cipher-pulse','cipher-thrusters','cipher-laminate','cipher-inducer']
};
function build(ship,upgrade){
 const s=C.fresh(); s.credits=10000;
 if(ship==='ship2'){assert(C.buyShip(s,ship));assert(C.switchShip(s,ship));}
 if(upgrade)for(const id of refit[ship]){
  assert.equal(P.modules[id].listed,false);
  assert.equal(P.buy(s,id),false);
  s.progression.equipment.owned.push(id);
  assert(P.install(s,P.modules[id].slot,id));
 }
 return s;
}
test('all four flight steps improve together and installed parts round-trip',()=>{
 const states=[build('starter',false),build('starter',true),build('ship2',false),build('ship2',true)];
 const stats=states.map(s=>C.stats(s));
 for(let i=1;i<stats.length;i++){
  const prev=stats[i-1],next=stats[i];
  assert(next.hull>prev.hull);
  assert(next.flight.yawRate>prev.flight.yawRate);
  assert(next.flight.acceleration/next.flight.inertia>prev.flight.acceleration/prev.flight.inertia);
  assert(next.spool<prev.spool);
  assert(next.damage/next.cooldown>prev.damage/prev.cooldown);
 }
 const cipher=states[3],saved=C.restore(JSON.stringify(cipher));
 assert.equal(saved.activeShip,'ship2');
 assert.equal(C.stats(saved).spool,stats[3].spool);
 assert.equal(C.stats(saved).hull,148);
 assert(!P.install(states[1],'weapon','cipher-pulse'));
 assert(!P.buy(states[1],'cipher-inducer'));
 assert.equal(S.horizon.platform,'ship2');assert(S.horizon.cargo>P.systems(cipher).cargo);
 assert(!C.buyShip(cipher,'horizon'));
});
test('Rook approach is safe and ordinary local risk grows with region',()=>{
 const s=C.fresh();s.quest='arrival';assert.equal(C.flight(s).enemies,0);
 Object.assign(s,{quest:'open',location:'erebus-arrival',destination:'meridian'});
 s.universe.freeTravel=true;s.universe.missions['first-departure']={completed:false};
 assert.equal(C.flight(s).enemies,0);
 delete s.universe.missions['first-departure'];
 s.story.flags.kestrelCargo='aboard';
 for(let i=0;i<25;i++){s.story.flags.localTransitCount=i;assert.equal(C.flight(s).enemies,0);}
 const lanes=[['earth','mars'],['meridian','kepler'],['vigil','nexus'],['stale-arrival','low-quay']];
 const totals=lanes.map(([origin,destination])=>Array.from({length:1000},(_,i)=>U.routeThreat(origin,destination,i)).filter(r=>r.enemies).length);
 for(let i=1;i<totals.length;i++)assert(totals[i]>totals[i-1]);
 for(let i=0;i<20;i++)assert.equal(U.routeThreat('earth','erebus-arrival',i).enemies,0);
 const {rookie,trained,elite}=AI.tiers;
 assert(rookie.turn<trained.turn&&trained.turn<elite.turn);
 assert(rookie.acceleration<trained.acceleration&&trained.acceleration<elite.acceleration);
 assert(rookie.armor<trained.armor&&trained.armor<elite.armor);
 assert.equal(AI.interceptTime({x:100,y:0,z:0},{x:10,y:0,z:0},60),2);
});
