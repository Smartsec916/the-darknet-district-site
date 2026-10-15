const test=require('node:test'),assert=require('node:assert/strict');
const B=require('../void-runner/faction-battle.js'),C=require('../void-runner/campaign.js'),U=require('../void-runner/universe.js');
// Seeded random numbers so every run fights the same battle.
function seeded(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const len=a=>Math.hypot(a.x,a.y,a.z);
function run(faction,seed,velocity={x:0,y:0,z:0},seconds=B.config.duration+20){
  const rng=seeded(seed),b=B.create(faction,undefined,rng),log={minShot:Infinity,minShip:Infinity,hits:0,destroyed:0,targets:[]};
  for(let t=0;t<seconds;t+=1/30){B.step(b,1/30,velocity,rng);
    for(const q of b.shots)log.minShot=Math.min(log.minShot,len(q));
    for(const s of b.ships){log.minShip=Math.min(log.minShip,len(s));if(s.target)log.targets.push([s.side,s.target.side]);}
    for(const e of b.events.splice(0)){if(e.type==='hit')log.hits++;if(e.type==='destroyed')log.destroyed++;}}
  return {b,log};
}
function district(){const s=C.fresh();s.quest='open';s.location='earth';s.progression.completed=true;s.progression.flags.missileFired=true;s.universe=U.restore({...s.universe,freeTravel:true},s);s.universe.freeTravel=true;s.story.flags.metAdmin=true;return s;}

test('each delivery gets its own small battle with two ships per faction',()=>{
  for(const faction of ['communion','natural-order']){const b=B.create(faction,undefined,seeded(1));
    assert.equal(b.ships.filter(s=>s.side==='communion').length,2);assert.equal(b.ships.filter(s=>s.side==='natural-order').length,2);
    assert(b.ships.every(s=>s.relationship==='neutral'&&s.battle&&s.marker==='none'));}
  const a=B.create('communion',undefined,seeded(1)),b=B.create('natural-order',undefined,seeded(1));
  assert.notDeepEqual(a.ships.map(s=>s.className),b.ships.map(s=>s.className));assert(Math.sign(a.center.x)!==Math.sign(b.center.x));
  assert.equal(b.wrecks.length,1);assert.equal(a.wrecks.length,0);
});
test('the faction designs are different ships, not recolors',()=>{
  const communion=Object.keys(B.classes).filter(id=>B.classes[id].side==='communion'),order=Object.keys(B.classes).filter(id=>B.classes[id].side==='natural-order');
  assert(communion.every(id=>id.startsWith('communion-')));assert(order.every(id=>id.startsWith('order-')));
  assert.notDeepEqual(B.sides.communion,B.sides['natural-order']);
});
test('the battle opens off to the side, never directly ahead or near the player',()=>{
  for(const faction of ['communion','natural-order']){const b=B.create(faction,undefined,seeded(3));
    const angle=Math.acos(b.center.z/len(b.center))*180/Math.PI;assert(angle>12,'center '+angle.toFixed(1)+'° off the nose');
    assert(b.ships.every(s=>len(s)>70));}
});
test('ships fight only the other faction and leave the player alone',()=>{
  for(const faction of ['communion','natural-order'])for(const seed of [1,2,3,4,5])for(const velocity of [{x:0,y:0,z:0},{x:0,y:0,z:22}]){
    const {log}=run(faction,seed,velocity);
    assert(log.targets.length>0&&log.targets.every(([a,b])=>a!==b),'targets only the opposing side');
    assert(log.minShot>=B.config.playerClearance,'no shot reaches the player ('+log.minShot.toFixed(1)+')');
    assert(log.minShip>=B.config.playerClearance,'no ship rams the player ('+log.minShip.toFixed(1)+')');
  }
});
test('ships trade fire, take damage and are sometimes destroyed',()=>{
  let destroyed=0,hits=0;for(const faction of ['communion','natural-order'])for(const seed of [1,2,3,4,5]){const {log}=run(faction,seed);hits+=log.hits;destroyed+=log.destroyed;assert(log.hits>0);}
  assert(destroyed>0,'some ships are destroyed');assert(destroyed<20,'not every ship dies every time');
});
test('the battle ends on its own and cleans up its ships and bolts',()=>{
  const {b}=run('communion',2,{x:0,y:0,z:0},B.config.duration+30);
  assert.equal(b.ships.length,0);assert.equal(b.shots.length,0);assert(b.ended);
});
test('the outbound jump drops out once, halfway, only while carrying that delivery',()=>{
  const s=district();C.acceptFaction(s,'communion');const mission=C.flight(s),route={phase:'warp',progress:.3,aligned:0};
  assert.equal(B.due(s,mission,route),null);route.progress=.52;assert.equal(B.due(s,mission,route),'communion');
  B.begin(s,route,'communion');assert.equal(route.phase,'align');assert.equal(route.progress,.5);assert.equal(s.story.flags.communionBattle,true);
  route.phase='warp';route.progress=.6;assert.equal(B.due(s,mission,route),null,'never repeats');
  const r=C.restore(JSON.stringify(s));assert.equal(r.story.flags.communionBattle,true,'survives save and load');
  // Skipping the battle never blocks the delivery.
  C.complete(s);assert(C.deliverFaction(s,'communion'));
});
test('no battle on other routes or after the cargo is delivered',()=>{
  const s=district();const route={phase:'warp',progress:.6,aligned:0};
  assert.equal(B.due(s,C.flight(s),route),null);
  C.acceptFaction(s,'natural-order');s.contract=null;assert.equal(B.due(s,{id:'order-delivery'},route),null);
});
test('after the drop the drive recharges before the jump can resume, whatever the frame rate',()=>{
  const W=require('../void-runner/warp.js'),s=district();C.acceptFaction(s,'communion');const route=W.create('earth','vigil','communion-delivery');
  route.phase='warp';route.progress=.55;B.begin(s,route,'communion');const ahead=route.vector;
  for(let t=0;t<B.config.rechargeSeconds-.3;t+=.25)W.step(route,.25,ahead);assert.equal(route.phase,'align');
  for(let t=0;t<2;t+=.25)W.step(route,.25,ahead);assert.equal(route.phase,'warp');assert(route.progress>=.5&&route.progress<.6,'resumes from the drop point');
});
