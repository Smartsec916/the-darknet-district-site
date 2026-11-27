'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {createReturnTools}=require('../void-runner/npc-return.js');

// Exercise the actual mounted actor adapter with neutral scene fixtures, not
// a second implementation of its movement or priority logic.
const source=readFileSync(require.resolve('../void-runner/npc-made.js'),'utf8');
const start=source.indexOf('  function step(p,dt,cam)');
const end=source.indexOf('  function sync(){',start);
assert.ok(start>=0&&end>start,'mounted actor step boundary not found');
const stepSource=source.slice(start,end);
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
function fixture({shift={x:10,z:20},path=false}={}){
 const area='avenue',from={x:0,z:0},to={x:2,z:0};
 const local=q=>({x:q.x-shift.x,z:q.z-shift.z});
 const world=q=>({x:q.x+shift.x,z:q.z+shift.z});
 const safe=q=>Number.isFinite(q.x)&&Number.isFinite(q.z)&&!(q.x>.9&&q.x<1.1&&q.z<1);
 const A={CLEAR:.3,get:id=>id===area?{}:null,check:(q,id)=>({ok:id===area&&safe(q),area:id}),
  leg:(a,b)=>Array.from({length:101},(_,i)=>({x:a.x+(b.x-a.x)*i/100,z:a.z+(b.z-a.z)*i/100})).every(safe)?[]:['blocked']};
 const E={walkRoute:(a,b)=>[{x:a.x,z:1.5},{x:b.x,z:1.5},b]};
 const plan={key:'routine',area,why:path?'path':'stay',mode:path?'path':'stay',...local(to),points:[local(to)],actions:['idle']};
 let current=plan,talking=false,pose=null,routineCalls=0;
 const position={...local(from),y:0,set(x,y,z){Object.assign(this,{x,y,z});}};
 const p={id:'fixture',node:{position,rotation:{y:0},isEnabled:()=>true,setEnabled(){}},s:{...local(from),yaw:0},y:0,key:'social:fixture',plan:{key:'social:fixture',social:true,area,mode:'escort'},esc:{key:'social:fixture',st:{}},c:{}};
 const root={VoidNPCReturn:createReturnTools(A,E),VoidLiveContent:{socialPose:()=>pose}};
 const deps={root,scenePlan:x=>x,planOf:()=>current,HERE:new Set([area]),chatting:()=>talking?p.id:null,me:()=>null,Ar:{leg:(a,b)=>A.leg(world(a),world(b))},inView:()=>false,seenAt:()=>false,yAt:()=>0,shift,cfg:{speed:1,showRadius:100},SP:{routineStep(s){routineCalls++;s.clip='idle';}},rnd:()=>.5,companionPlan:(p,plan)=>plan,items:new Map(),escTick:()=>{throw Error('unexpected escort');},animRadius:50,NPX:()=>({crowdClips:()=>['idle','talk']})};
 const step=new Function(...Object.keys(deps),stepSource+'\nreturn step;')(...Object.values(deps));
 return {p,A,plan,to,world,tick:()=>step(p,.05,null),talk:v=>{talking=v;},pose:v=>{pose=v;},setPlan:v=>{current=v;},routineCalls:()=>routineCalls};
}
test('mounted adapter walks after social travel, in shifted coordinates, for stay and path routines',()=>{
 for(const path of [false,true]){
  const f=fixture({path});let total=0;
  for(let i=0;i<400;i++){
   const old=f.world(f.p.s);f.tick();const next=f.world(f.p.s),step=dist(old,next);
   assert.ok(step<=.05000001,'mounted actor jumped');assert.equal(f.A.leg(old,next).length,0);
   assert.ok(dist(f.world(f.p.node.position),next)<1e-8,'render node did not follow actor');
   total+=step;if(!f.p.returnJourney)break;
  }
  assert.ok(total>3,'did not walk around obstacle');assert.ok(dist(f.world(f.p.s),f.to)<=.025);assert.equal(f.p.returnJourney,null);
  assert.equal(f.routineCalls(),0);f.tick();assert.equal(f.routineCalls(),1);
 }
});
test('mounted adapter stops during chat and social pose, then resumes without relocation',()=>{
 const f=fixture();f.tick();const pos=f.world(f.p.s);
 f.talk(true);for(let i=0;i<10;i++)f.tick();assert.ok(dist(f.world(f.p.s),pos)<1e-8);
 f.talk(false);f.pose('talk');for(let i=0;i<10;i++)f.tick();assert.ok(dist(f.world(f.p.s),pos)<1e-8);
 f.pose(null);f.tick();assert.ok(dist(f.world(f.p.s),pos)>0);assert.ok(dist(f.world(f.p.s),pos)<=.05000001);
});
test('mounted adapter relinquishes ordinary return on a new priority plan',()=>{
 const f=fixture();f.tick();assert.ok(f.p.returnJourney);
 f.setPlan({...f.plan,key:'mission:fixture',why:'mission',x:f.p.s.x,z:f.p.s.z});
 f.tick();assert.equal(f.p.returnJourney,null);assert.equal(f.routineCalls(),1);
});
test('mounted adapter does not seize a taxi escort on the routine transition',()=>{
 const f=fixture();f.p.esc.st.ride='in-cab';f.tick();assert.equal(f.p.returnJourney,undefined);assert.equal(f.routineCalls(),1);
});
