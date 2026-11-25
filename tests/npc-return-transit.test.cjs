'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const stateSource=readFileSync(require.resolve('../tools/npc-return-state.cjs'),'utf8');
const routeSource=readFileSync(require.resolve('../tools/npc-return-route.cjs'),'utf8');
const start={x:0,z:0},door={x:1,z:0},goal={x:2,z:0,key:'routine',area:'avenue'};
function tracker(){
 const A={CLEAR:.3,get:id=>id==='avenue'?{}:null,
  check:(p,area,margin,opts)=>({ok:!(p.x>.9&&p.x<1.1)||!!opts?.passing,area}),
  leg:(a,b,opts)=>opts?.closed?['closed']:[]};
 const E={walkRoute:()=>[]};
 function load(source){const module={exports:{}};vm.runInNewContext(source,{module,require:id=>{
  if(id.endsWith('/npc-areas.js'))return A;
  if(id.endsWith('/npc-escort.js'))return E;
  if(id.endsWith('/npc-return-route.cjs')||id==='./npc-return-route.cjs')return load(routeSource);
  throw Error(id);
 }});return module.exports;}
 return load(stateSource).createReturnTracker();
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
test('unload and mission preemption issue no movement and retain the actual observation separately from a safe stop',()=>{
 for(const opts of [{sceneLoaded:false},{preempted:true}]){
  const t=tracker();t.update(input());t.update(input(door));
  const r=t.update(opts);assert.equal(r.status,'paused');assert.equal(r.waypoint,null);
  assert.equal(r.lastObserved.x,1);assert.equal(r.lastLegalStop.x,0);
  assert.equal(t.update(input(door)).status,'hold');
 }
});
