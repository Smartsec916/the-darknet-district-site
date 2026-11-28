const test=require('node:test'),assert=require('node:assert/strict');
const W=require('../void-runner/warp.js'),U=require('../void-runner/universe.js');

test('leaving a planet, the jump point is up in the sky',()=>{
 for(const origin of ['vesper','earth','mars','nexus','order-homeworld']){
  assert.ok(U.planetside(origin),origin+' is planetside');
  const v=W.create(origin,'meridian').vector;
  // Flight space has +y pointing down (see cockpit flightBasis), so up is negative y.
  assert.ok(v.y<=-Math.sin(15*Math.PI/180),origin+' warp point should be well above the horizon');
  assert.ok(Math.abs(Math.hypot(v.x,v.y,v.z)-1)<1e-9,'unit vector');
 }
});

test('leaving a station, the jump point stays level',()=>{
 for(const origin of ['meridian','kepler','rusthaven','foundry','vigil','holdfast','sol-belt']){
  assert.ok(!U.planetside(origin));assert.equal(W.create(origin,'vesper').vector.y,0);
 }
});

test('aligned departure needs a continuous warp hold',()=>{
 const r=W.create('vesper','meridian');r.phase='align';
 for(let i=0;i<20;i++)W.step(r,.25,r.vector);
 assert.equal(r.phase,'align');
 for(let i=0;i<11;i++)W.step(r,.25,r.vector,false,{held:true});
 assert.equal(r.phase,'align');
 W.step(r,.25,r.vector,false,{held:true});
 assert.equal(r.phase,'warp');
 const level=W.create('vesper','meridian');level.phase='align';const flat={x:level.vector.x,y:0,z:level.vector.z},n=Math.hypot(flat.x,flat.z);
 for(let i=0;i<16;i++)W.step(level,.25,{x:flat.x/n,y:0,z:flat.z/n},false,{held:true});
 assert.equal(level.phase,'align','aiming at the horizon no longer jumps from a planet');
});

test('a hit resets the spool and escaping leaves the encounter resolved without a combat clear',()=>{
 const route=W.create('meridian','kepler','legal-run',true);
 route.phase='encounter';route.encounter.state='active';route.progress=W.config.interruption;
 const engaged={held:true,escape:true};
 W.step(route,.25,route.vector,false,engaged);
 W.step(route,.25,route.vector,false,{escape:true});
 assert.equal(route.aligned,0,'releasing resets progress');
 W.step(route,.25,route.vector,false,engaged);
 assert.equal(W.interrupt(route,true),true);
 for(let i=0;i<20;i++)W.step(route,.25,route.vector,false,engaged);
 assert.equal(route.phase,'encounter');assert.equal(route.aligned,0);
 W.step(route,.25,route.vector,false,{escape:true});
 for(let i=0;i<12;i++)W.step(route,.25,route.vector,false,engaged);
 assert.equal(route.phase,'warp');assert.equal(route.encounter.evaded,true);
 const restored=W.restore(route,route.origin,route.destination,route.mission,true);
 assert.equal(restored.phase,'align');assert.equal(restored.aligned,0);
 assert.equal(restored.encounter.evaded,true);
});
