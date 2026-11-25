'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const A=require('../void-runner/npc-areas.js');
const {createReturnTracker}=require('../tools/npc-return-state.cjs');
const options={made:true,adult:false};
const step=.2;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
function legal(p,area,passing=false){
 const c=A.check(p,area,passing?A.CLEAR-.1:undefined,{...options,passing});
 return c.ok&&c.area===area;
}
function walk(from,to,area){
 const tracker=createReturnTracker(),destination={...to,area,key:'current-routine'};
 let pos={...from},distanceWalked=0,transitObservations=0,lastStop={...from};
 for(let i=0;i<2000;i++){
  const result=tracker.update({position:pos,area,destination,options});
  assert.deepEqual(result.lastObserved,{area,...pos},'tracker must use actual measured position');
  if(legal(pos,area))lastStop={...pos};
  else{
   transitObservations++;
   assert.ok(legal(pos,area,true),'only authorized transit may be observed');
   assert.equal(result.reason,'verified-transit-leg');
  }
  assert.deepEqual(result.lastLegalStop,{area,...lastStop});
  if(result.status==='arrived'){
   assert.equal(result.waypoint,null);
   assert.ok(distance(pos,to)<=.025);
   assert.ok(distanceWalked+.025>=distance(from,to),'no teleport or unobserved arrival');
   return {distanceWalked,transitObservations};
  }
  assert.equal(result.status,'walking',JSON.stringify({pos,result}));
  assert.ok(legal(result.waypoint,area),'next stopping point must be legal');
  assert.deepEqual(A.leg(pos,result.waypoint,options),[],'remaining leg must be authorized');
  const d=distance(pos,result.waypoint);
  assert.ok(d>0,'walking cannot issue a zero-length leg');
  const fraction=Math.min(1,step/d);
  const next={x:pos.x+(result.waypoint.x-pos.x)*fraction,z:pos.z+(result.waypoint.z-pos.z)*fraction};
  assert.ok(distance(pos,next)<=step+1e-9);
  assert.ok(legal(next,area,true));
  distanceWalked+=distance(pos,next);
  pos=next;
 }
 assert.fail('bounded observed walk never arrived');
}
test('observed return walks actual Avenue geometry in small steps in both directions',()=>{
 const a={x:19.5,z:2.5},b={x:47.5,z:-2.5};
 for(const [from,to] of [[a,b],[b,a]])walk(from,to,'avenue');
});
test('actual Old Town doorway transit never becomes a standing waypoint or teleports',()=>{
 // NULL public pavement: venue entrance is a passing-only rectangle for an
 // ordinary made NPC. Discover a narrow legal through-leg in real current
 // geometry rather than hard-coding obsolete furniture positions.
 const area='oldtown';
 let fixture=null;
 for(let i=517;i<=524&&!fixture;i++){
  const x=i/10,a={x,z:-63},b={x,z:-54};
  if(!legal(a,area)||!legal(b,area)||A.leg(a,b,options).length)continue;
  const samples=Array.from({length:46},(_,j)=>({x,z:-63+j*step}));
  if(samples.every(p=>legal(p,area,true))&&samples.some(p=>!legal(p,area)))fixture={a,b};
 }
 assert.ok(fixture,'expected a real public-pavement transit-only leg alongside NULL');
 for(const [from,to] of [[fixture.a,fixture.b],[fixture.b,fixture.a]]){
  const result=walk(from,to,area);
  assert.ok(result.transitObservations>0,'test must actually enter passing-only geometry');
 }
});
