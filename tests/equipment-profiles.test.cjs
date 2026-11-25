const test=require('node:test'),assert=require('node:assert/strict');
const profiles=require('../void-runner/equipment-profiles.js');
const balance=require('../void-runner/balance.js'),ordnance=require('../void-runner/ordnance.js'),missiles=require('../void-runner/missiles.js'),progress=require('../void-runner/progression.js');
const flat=y=>({mode:'smooth',points:[[0,y],[1,y]]});
test('equipment defaults match legacy shield, armor and splash behavior',()=>{
 assert.deepEqual(profiles.damageLayers(4,10),{absorbed:4,hullDamage:6});
 assert.deepEqual(profiles.damageLayers(4,10,{shieldScale:2,hullScale:.5}),{absorbed:4,hullDamage:4});
 assert.deepEqual(profiles.damageLayers(0,20,{maximumDamage:8,damageMultiplier:3}),{absorbed:0,hullDamage:8});
 assert.throws(()=>profiles.validate({pulse:{minimumDamage:8,maximumDamage:2}}));
 assert.equal(profiles.absorb(4,10,.25),2.5);assert.equal(profiles.recharge(10,20,20,flat(.25)),15);
 assert.equal(profiles.splash(.25),.375);assert.throws(()=>profiles.validate({pulseCoils:{energyCurve:{mode:'linear',points:[[1,0],[0,1]]}}}));
});
test('configured curve reaches an actual game projectile and changes splash damage',()=>{
 const b=balance.defaults,opts=ordnance.spec('m1',b,null,{m1:{splashCurve:flat(.7)}});
 const target={x:0,y:0,z:2,size:1},near={x:1,y:0,z:2,size:1};
 const shot=missiles.launch({ownsMissileLauncher:true,equipped:true,missilesLoaded:1,missileCapacity:1},{progress:1,target},{f:{x:0,y:0,z:1},r:{x:1,y:0,z:0},u:{x:0,y:1,z:0}},b,0,{...opts,origin:{right:0,up:0,forward:0}});
 const hits=[];missiles.step(shot,.02,{x:0,y:0,z:0},b,[target,near],(e,d)=>hits.push(d));
 assert.deepEqual(hits,[opts.damage,opts.damage*.35]);assert.equal(shot.detonated.hit,true);
});
test('firing the game energy bank samples the equipped cost curve',()=>{
 const bank={energy:30,heat:0};assert.equal(progress.consume(bank,{}, {capacity:60,heatLimit:100,heat:4,cost:6,energyCurve:flat(.5)}),true);
 assert.deepEqual(bank,{energy:27,heat:4});
});
