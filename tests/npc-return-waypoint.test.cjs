'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {createReturnTools}=require('../void-runner/npc-return.js');
const start={x:0,z:0},goal={x:2,z:2},door={x:2,z:0},safe={x:0,z:2};
const same=(a,b)=>a.x===b.x&&a.z===b.z;
// Reproduce the real area API distinction: leg() uses passing:true and
// reduced clearance, while check() requires a legal stopping point.
function planner({otherArea=false,allowSafe=true}={}){
 const A={get:id=>id==='avenue'?{}:null,
  check:(p,area,margin,opts)=>same(p,door)?{ok:otherArea||!!opts?.passing,area:otherArea?'oldtown':area}:{ok:true,area},
  leg:(a,b)=>same(a,start)&&same(b,goal)||!allowSafe&&(same(a,safe)||same(b,safe))?['blocked']:[]};
 const E={walkRoute:()=>[door,goal]};
 return createReturnTools(A,E);
}
test('return planner rejects a passing-only doorway waypoint and selects a safe alternative',()=>{
 const p=planner();
 assert.equal(p.validateCandidate(start,goal,'avenue',[door,goal]),false);
 const result=p.preflight(start,goal,'avenue');
 assert.equal(result.status,'ready');
 assert.equal(JSON.stringify(result.points),JSON.stringify([safe,goal]));
});
test('return planner rejects an intermediate waypoint outside its authorized area',()=>{
 const p=planner({otherArea:true});
 assert.equal(p.validateCandidate(start,goal,'avenue',[door,goal]),false);
});
test('return planner holds when its only candidate stops in a prohibited doorway',()=>{
 const p=planner({allowSafe:false});
 const result=p.preflight(start,goal,'avenue');
 assert.equal(result.status,'hold');assert.equal(result.points.length,0);
});
