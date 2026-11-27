'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {createReturnTools,createMountedReturn}=require('../void-runner/npc-return.js');
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const area='avenue',a={x:0,z:0},b={x:2,z:0},target={...b,key:'routine',area};
function fixture(){
 let closed=false;
 const safe=p=>Number.isFinite(p.x)&&Number.isFinite(p.z)&&!(p.x>.9&&p.x<1.1&&(closed||p.z<1));
 const A={CLEAR:.3,get:id=>id===area?{}:null,check:(p,id)=>({ok:id===area&&safe(p),area:id}),
  leg:(p,q)=>Array.from({length:101},(_,i)=>({x:p.x+(q.x-p.x)*i/100,z:p.z+(q.z-p.z)*i/100})).every(safe)?[]:['blocked']};
 const E={walkRoute:(from,to)=>[{x:from.x,z:1.5},{x:to.x,z:1.5},to]};
 return {api:createReturnTools(A,E),close:()=>{closed=true;},A};
}
function walk(driver,from,destination,options={},A=null){
 let position={...from},total=0;
 for(let i=0;i<4000;i++){
  const out=driver.tick({position,destination,area,dt:.05,speed:1,options});
  if(out.status==='arrived'){assert.ok(dist(position,destination)<=.025);return total;}
  assert.equal(out.status,'walking');
  const step=dist(position,out.position);assert.ok(step<=.05000001);
  if(A)assert.equal(A.leg(position,out.position).length,0);
  total+=step;position=out.position;
 }
 assert.fail('mounted return did not arrive');
}
test('mounted return moves around an obstacle without teleporting in either direction',()=>{
 const {api,A}=fixture();
 for(const [from,to] of [[a,b],[b,a]])assert.ok(walk(api.createMountedReturn(),from,{...to,key:'route',area},{},A)>3);
});
test('mounted return pauses without advancing and rejects stale cross-area targets',()=>{
 const {api}=fixture(),driver=api.createMountedReturn();
 const paused=driver.tick({position:a,destination:target,area,dt:.1,speed:1,paused:true});
 assert.deepEqual(paused.position,a);assert.equal(paused.clip,'idle');
 const moved=driver.tick({position:a,destination:target,area,dt:.1,speed:1});
 assert.ok(dist(moved.position,a)>0);
 const bad=driver.tick({position:moved.position,destination:{...target,area:'oldtown'},area,dt:.1,speed:1});
 assert.equal(bad.status,'hold');assert.deepEqual(bad.position,moved.position);
});
test('a new obstruction stops actual movement before the blocked segment',()=>{
 const {api,close,A}=fixture(),driver=api.createMountedReturn();let position={...a};
 position=driver.tick({position,destination:target,area,dt:.1,speed:1}).position;
 close();let held=false;
 for(let i=0;i<80;i++){
  const q=driver.tick({position,destination:target,area,dt:.1,speed:1});
  assert.equal(A.leg(position,q.position).length,0);position=q.position;held||=q.status==='hold';
 }
 assert.ok(held);assert.ok(position.x<.9);
});
test('separate mounted return drivers do not move or complete one another',()=>{
 const {api}=fixture(),one=api.createMountedReturn(),two=api.createMountedReturn();
 const first=one.tick({position:a,destination:target,area,dt:.1,speed:1});
 assert.equal(two.tick({position:b,destination:target,area,dt:.1,speed:1}).status,'arrived');
 assert.equal(one.tick({position:first.position,destination:target,area,dt:.1,speed:1}).status,'walking');
});
test('mounted return follows real Avenue pedestrian geometry in both directions',()=>{
 const p={x:19.5,z:2.5},q={x:47.5,z:-2.5};
 for(const [from,to] of [[p,q],[q,p]])assert.ok(walk(createMountedReturn(),from,{...to,key:'real',area},{made:true,adult:false})+.025>=dist(from,to));
});
