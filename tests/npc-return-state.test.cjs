'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {createReturnTracker}=require('../tools/npc-return-state.cjs');
const {validateCandidate}=require('../tools/npc-return-route.cjs');
const a={x:19.5,z:2.5},b={x:47.5,z:-2.5};
const target=(p=b,key='evening')=>({...p,key,area:'avenue'});
const input=(position=a,destination=target(),extra={})=>({position,area:'avenue',destination,...extra});
test('observed return follows validated legs and does not claim arrival until measured at target',()=>{
 const tracker=createReturnTracker();let pos=a;
 let result=tracker.update(input(pos));
 assert.equal(result.status,'walking');assert.deepEqual(result.lastObserved,{area:'avenue',...a});
 assert.ok(result.waypoint.x!==b.x||result.waypoint.z!==b.z);
 for(let i=0;i<64&&result.status==='walking';i++){
  assert.ok(validateCandidate(pos,result.waypoint,'avenue',[result.waypoint]));
  pos=result.waypoint;result=tracker.update(input(pos));
 }
 assert.equal(result.status,'arrived');assert.deepEqual(pos,b);assert.equal(result.waypoint,null);
});
test('priority interaction pauses and replans from actual position on resumption',()=>{
 const tracker=createReturnTracker();tracker.update(input());
 const pause=tracker.update(input(a,target(),{preempted:true}));
 assert.equal(pause.status,'paused');assert.equal(pause.waypoint,null);
 const result=tracker.update(input(b));
 assert.equal(result.status,'arrived');assert.deepEqual(result.lastObserved,{area:'avenue',...b});
});
test('scene unload retains observation without inventing a spawn or destination',()=>{
 const tracker=createReturnTracker();tracker.update(input());
 const paused=tracker.update({sceneLoaded:false});
 assert.deepEqual(paused.lastObserved,{area:'avenue',...a});assert.equal(paused.waypoint,null);
 const invalid=tracker.update(input({x:NaN,z:0}));
 assert.equal(invalid.status,'hold');assert.equal(invalid.waypoint,null);
 assert.deepEqual(invalid.lastObserved,paused.lastObserved);
});
test('schedule change uses new current destination rather than stale route',()=>{
 const tracker=createReturnTracker();assert.equal(tracker.update(input()).status,'walking');
 const result=tracker.update(input(a,target(a,'morning')));
 assert.equal(result.status,'arrived');assert.deepEqual(result.lastObserved,{area:'avenue',...a});
});
test('cross-area, unregistered targets and missing routines hold without authorization or movement',()=>{
 const tracker=createReturnTracker();
 for(const dest of [{...target(),area:'oldtown'},target({x:999,z:999}),null]){
  const result=tracker.update(input(a,dest));assert.equal(result.status,'hold');assert.equal(result.waypoint,null);
 }
});
test('independent trackers and snapshots cannot mutate another NPC or their own route',()=>{
 const first=createReturnTracker(),second=createReturnTracker();
 const result=first.update(input());const initial={...result.waypoint};
 result.waypoint.x=999;result.lastObserved.x=999;
 assert.equal(second.update(input(b)).status,'arrived');
 assert.deepEqual(first.update(input()).waypoint,initial);
 first.reset();assert.equal(first.update({sceneLoaded:false}).lastObserved,null);
});
