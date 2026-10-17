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

test('aiming at the sky point aligns and jumps',()=>{
 const r=W.create('vesper','meridian');r.phase='align';
 for(let i=0;i<10;i++)W.step(r,.1,r.vector);
 assert.equal(r.phase,'warp');
 const level=W.create('vesper','meridian');level.phase='align';const flat={x:level.vector.x,y:0,z:level.vector.z},n=Math.hypot(flat.x,flat.z);
 for(let i=0;i<10;i++)W.step(level,.1,{x:flat.x/n,y:0,z:flat.z/n});
 assert.equal(level.phase,'align','aiming at the horizon no longer jumps from a planet');
});
