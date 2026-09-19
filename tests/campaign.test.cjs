const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../void-runner/campaign.js');const content=require('../void-runner/content.js');
test('optional dock servicing charges once and keeps credits valid',()=>{
  const B=require('../void-runner/balance.js'),s=C.fresh();s.quest='legal-run';
  try{B.apply({...B.defaults,repairCost:20.4});const receipt=C.complete(s);assert.equal(receipt.repairCharged,20);assert.equal(s.credits,430);assert(C.restore(JSON.stringify(s)));}
  finally{B.apply(B.defaults);}
});
test('v1 saves migrate without losing credits, location or upgrades',()=>{
  const old={version:1,quest:'open',location:'undertow',credits:2450,reputation:10,completed:4,contract:'ghost',upgrades:{guns:2,armor:1,engines:3}};
  const s=C.restore(JSON.stringify(old));assert.equal(s.version,2);assert.equal(s.credits,2450);assert.deepEqual(s.upgrades,{...old.upgrades,shields:0});assert.deepEqual(s.cleared,[]);assert.equal(s.contract,'ghost');
});
test('all 12 chapter missions unlock in order and pay once per acceptance',()=>{
  const s=C.fresh();s.quest='open';s.reputation=5;assert.equal(C.accept(s,'gate-4'),false);
  for(const m of content.missions){assert.equal(C.accept(s,m.id),true);assert.equal(C.flight(s).kind,m.kind);const credits=s.credits;C.complete(s);assert.equal(s.credits,credits+m.reward);assert.equal(C.complete(s),null);assert(s.cleared.includes(m.id));}
  assert.equal(s.cleared.length,12);assert.equal(C.accept(s,'belt-1'),true);C.complete(s);assert.equal(s.cleared.length,12);
});
test('a forged local loadout never grants paid stats without ownership',()=>{
  const s=C.fresh();s.loadout={weapon:'wraith',shield:'aegis',utility:'ghost'};
  assert.equal(C.stats(s).damage,1);assert.equal(C.stats(s).shield,0);assert.equal(C.stats(s).drive,false);
  assert.equal(C.stats(s,['wraith']).damage,3.6875);assert.equal(C.stats(s,['aegis']).shield,70);
  assert.equal(C.stats(s,['ghost','sentinel']).drone,false);assert.equal(C.stats(s,['ghost','sentinel']).drive,true);
});
test('restore rejects invalid saves and ignores ownership claims',()=>{
  const s=C.fresh();s.credits=-1;assert.equal(C.restore(JSON.stringify(s)),null);s.credits=100;s.owned=['wraith'];assert.equal(C.restore(JSON.stringify(s)).owned,undefined);
  s.contract='missing';assert.equal(C.restore(JSON.stringify(s)),null);
});
test('opening campaign and earned equipment remain playable',()=>{
  const s=C.fresh();C.beginJourney(s);C.complete(s);C.accept(s);C.complete(s);C.complete(s);C.accept(s);C.complete(s);
  assert.equal(s.quest,'open');assert.equal(s.upgrades.guns,1);assert.equal(C.buy(s,'armor'),true);assert.equal(C.stats(s).hull,130);
});
test('credit equipment unlocks after the first delivery, without an account',()=>{
  const s=C.fresh();s.credits=5000;assert.equal(C.buy(s,'shields'),false);assert.equal(C.buyGear(s,'scout'),false);
  s.completed=1;s.quest='return';assert(C.buy(s,'shields'));assert.equal(C.stats(s).shield,15);assert(C.buyGear(s,'scout'));assert.equal(C.stats(s).droneDamage,2);
  assert.equal(C.buyGear(s,'wraith'),false);assert.equal(C.buyGear(s,'scout'),false);assert.equal(s.credits,4000);
  const restored=C.restore(JSON.stringify(s));assert.deepEqual(restored.creditGear,['scout']);assert.equal(C.stats(restored).drone,true);
});
test('exclusive tier is stronger and still requires account ownership',()=>{
  const s=C.fresh();s.completed=1;s.credits=10000;for(let i=0;i<3;i++)C.buy(s,'shields');C.buyGear(s,'vector');
  const normal=C.stats(s);assert.equal(normal.shield,45);assert.equal(normal.driveCooldown,12);
  s.loadout={weapon:'wraith',shield:'aegis',utility:'ghost'};assert.equal(C.stats(s).shield,45);assert.equal(C.stats(s).drive,false);
  const premium=C.stats(s,['wraith','aegis','ghost']);assert(premium.shield>normal.shield);assert(premium.shieldRegen>normal.shieldRegen);assert(premium.driveCooldown<normal.driveCooldown);
});
