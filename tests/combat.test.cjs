const test=require('node:test'),assert=require('node:assert/strict');
const B=require('../void-runner/balance.js'),M=require('../void-runner/missiles.js'),T=require('../void-runner/targeting.js'),FM=require('../void-runner/cockpit-math.js');
test('lock requires continuous tracking and cannot transfer to another enemy',()=>{
 const lock=T.fresh(),a={x:0,y:0,z:80},b={...a};const project=e=>({x:500+e.x*10,y:352+e.y*10,z:e.z});
 T.step(lock,[a],project,1000,800,.75,B.defaults,true);assert.equal(lock.progress,.5);
 T.step(lock,[b],project,1000,800,.3,B.defaults,true);assert(Math.abs(lock.progress-.2)<1e-12);
 b.x=30;T.step(lock,[b],project,1000,800,.3,B.defaults,true);assert.equal(lock.progress,0);
 b.x=0;T.step(lock,[b],project,1000,800,1.5,B.defaults,true);assert.equal(lock.status,'LOCK');
 T.step(lock,[b],project,1000,800,1,B.defaults,false);assert.equal(lock.target,null);
});
test('missile ownership, equipment, ammo, lock and cooldown independently gate fire',()=>{
 const target={x:0,y:0,z:50,size:1},lock={target,progress:1},valid={ownsMissileLauncher:true,equipped:true,missilesLoaded:3,missileCapacity:3};
 for(const change of [{ownsMissileLauncher:false},{equipped:false},{missilesLoaded:0},{missileCapacity:0}])assert.equal(M.launch({...valid,...change},lock,FM.basis(0,0),B.defaults,0),null);
 assert.equal(M.launch({...valid},lock,FM.basis(0,0),B.defaults,1),null);
 assert.equal(M.launch({...valid},{...lock,progress:.9},FM.basis(0,0),B.defaults,0),null);
 assert(M.launch(valid,lock,FM.basis(0,0),B.defaults,0));assert.equal(valid.missilesLoaded,2);
});
test('homing has a bounded turn and a swept impact; expired rounds cannot chase forever',()=>{
 const d=M.turn({x:0,y:0,z:1},{x:1,y:0,z:0},.1);assert(Math.abs(Math.acos(d.z)-.1)<1e-9);
 const e={x:0,y:0,z:50,size:1},s={ownsMissileLauncher:true,equipped:true,missilesLoaded:2,missileCapacity:2};
 const m=M.launch(s,{target:e,progress:1},FM.basis(0,0),B.defaults,0);let damage=0;
 for(let i=0;i<100&&!m.dead;i++)M.step(m,.02,{x:0,y:0,z:0},B.defaults,[e],(_,n)=>damage+=n);
 assert.equal(damage,B.defaults.missileDamage);assert(m.dead);
 const miss=M.launch(s,{target:e,progress:1},FM.basis(0,0),B.defaults,0);e.x=1000;
 for(let i=0;i<400&&!miss.dead;i++)M.step(miss,.02,{x:0,y:0,z:0},B.defaults,[e],()=>assert.fail('Evasive target must miss'));
 assert(miss.dead);assert(miss.life<=0||miss.distance>=B.defaults.missileRange);
});
test('balance rejects unknown, nonfinite and out-of-range fields; presets are independent',()=>{
 for(const values of [{enemyAccuracy:2},{laserDamage:NaN},{missileSpeed:Infinity},{fake:1}])assert.throws(()=>B.validate(values));
 assert.equal(B.preset('NORMAL').laserDamage,1);assert(B.preset('EASY').enemyHull<B.defaults.enemyHull);assert(B.preset('HARD').enemyHull>B.defaults.enemyHull);
});
