'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {createReturnTools}=require('../void-runner/npc-return.js');
const start={x:0,z:0},door={x:1,z:0},goal={x:2,z:0,key:'routine',area:'avenue'};
function tracker(){
 const A={CLEAR:.3,get:id=>id==='avenue'?{}:null,
  check:(p,area,margin,opts)=>({ok:!(p.x>.9&&p.x<1.1)||!!opts?.passing,area}),
  leg:(a,b,opts)=>opts?.closed?['closed']:[]};
 const E={walkRoute:()=>[]};
 return createReturnTools(A,E).createReturnTracker();
}
const input=(position=start,destination=goal,extra={})=>({position,area:'avenue',destination,...extra});
test('continue only the already verified transit leg through a non-stopping doorway',()=>{
 const t=tracker();assert.equal(t.update(input()).status,'walking');
 const r=t.update(input(door));assert.equal(r.status,'walking');
 assert.equal(r.reason,'verified-transit-leg');assert.equal(r.waypoint.x,2);
 assert.equal(r.lastObserved.x,1);assert.equal(r.lastLegalStop.x,0);
 assert.equal(t.update(input({x:2,z:0})).status,'arrived');
});
test('fresh transit observation or displaced actor cannot authorize a route',()=>{
 const t=tracker();assert.equal(t.update(input(door)).status,'hold');
 assert.equal(t.update(input(door,goal,{options:{passing:true}})).status,'hold');
 t.update(input());assert.equal(t.update(input({x:1,z:1})).status,'hold');
});
test('changed destination or newly blocked segment prevents stale transit continuation',()=>{
 let t=tracker();t.update(input());
 assert.equal(t.update(input(door,{...goal,key:'changed'})).status,'hold');
 t=tracker();t.update(input());
 assert.equal(t.update(input(door,goal,{options:{closed:true}})).status,'hold');
});
test('unload pauses a verified doorway leg and resumes only the same observed position',()=>{
 const t=tracker();t.update(input());t.update(input(door));
 for(let i=0;i<2;i++){
  const r=t.update({sceneLoaded:false});assert.equal(r.status,'paused');assert.equal(r.waypoint,null);
  assert.equal(r.lastObserved.x,1);assert.equal(r.lastLegalStop.x,0);
 }
 const resumed=t.update(input(door));assert.equal(resumed.status,'walking');
 assert.equal(resumed.reason,'verified-transit-leg');assert.equal(resumed.waypoint.x,2);
 assert.equal(t.update(input({x:2,z:0})).status,'arrived');
});
test('unloaded transit cannot resume after displacement, a changed destination or a blocked leg',()=>{
 for(const bad of [input({x:1.05,z:0}),input(door,{...goal,key:'changed'}),input(door,goal,{options:{closed:true}}),input(door,goal,{area:'oldtown'})]){
  const t=tracker();t.update(input());t.update(input(door));t.update({sceneLoaded:false});
  const r=t.update(bad);assert.equal(r.status,'hold');assert.equal(r.waypoint,null);
  assert.equal(t.update(input(door)).status,'hold','invalid resumption discards retained evidence');
 }
});
test('mission preemption always invalidates transit evidence, including during unload',()=>{
 for(const opts of [{preempted:true},{sceneLoaded:false,preempted:true}]){
  const t=tracker();t.update(input());t.update(input(door));t.update({sceneLoaded:false});
  const r=t.update(opts);assert.equal(r.status,'paused');assert.equal(r.waypoint,null);
  assert.equal(r.lastObserved.x,1);assert.equal(r.lastLegalStop.x,0);
  assert.equal(t.update(input(door)).status,'hold');
 }
});
test('unload before transit is observed cannot authorize a fresh doorway position',()=>{
 const t=tracker();t.update(input());t.update({sceneLoaded:false});
 assert.equal(t.update(input(door)).status,'hold');
});
test('legal re-entry after transit replans from actual position with current destination',()=>{
 const t=tracker();t.update(input());t.update(input(door));t.update({sceneLoaded:false});
 const r=t.update(input(start,{...start,key:'new-routine',area:'avenue'}));
 assert.equal(r.status,'arrived');assert.equal(r.lastObserved.x,0);
});
