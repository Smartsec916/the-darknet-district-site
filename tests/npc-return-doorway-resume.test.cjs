'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {createReturnTools}=require('../void-runner/npc-return.js');
const area='avenue',goal={x:2,z:0,key:'routine',area},start={x:0,z:0};
function fixture(){
 let closed=false;
 const A={CLEAR:.3,get:id=>id===area?{}:null,check:(p,id,margin,opts)=>({ok:id===area&&Number.isFinite(p.x)&&Number.isFinite(p.z)&&(!(p.x>.9&&p.x<1.1)||!!opts?.passing&&!closed),area:id}),leg:(a,b)=>closed&&Math.min(a.x,b.x)<1.1&&Math.max(a.x,b.x)>.9?['closed']:[]};
 const api=createReturnTools(A,{walkRoute:()=>[]}),registry=api.createReturnSuspensions(),driver=api.createMountedReturn();
 const session={},user={},character={},options={made:true,adult:false};
 let position=start;
 const tick=(p,destination=goal)=>driver.tick({position:p,area,destination,dt:.05,speed:1,options});
 for(let i=0;i<20;i++){const r=tick(position);assert.equal(r.status,'walking');position=r.position;}
 assert.ok(position.x>.9&&position.x<1.1);
 const args={session,user,character,id:'npc',area,key:goal.key,position,yaw:1,driver,destination:goal,options,eligible:true};
 return {api,registry,driver,position,tick,args,close:()=>{closed=true;}};
}
test('mounted return retains only an issued doorway stride, consumes once, and finishes physically',()=>{
 const f=fixture();assert.equal(f.registry.save(f.args),true);
 assert.equal(f.tick(f.position).status,'hold');
 const r=f.registry.take(f.args);assert.ok(r);assert.equal(r.driver,f.driver);assert.equal(r.x,f.position.x);
 assert.equal(f.registry.take(f.args),null);let p={x:r.x,z:r.z};
 for(let i=0;i<100;i++){const q=f.tick(p);assert.ok(Math.hypot(q.position.x-p.x,q.position.z-p.z)<=.05000001);p=q.position;if(q.status==='arrived')break;assert.equal(q.status,'walking');}
 assert.ok(Math.abs(p.x-goal.x)<=.025);
});
test('no doorway suspension from fresh driver, displaced actor, or changed goal',()=>{
 for(const mode of ['fresh','displaced','goal']){
  const f=fixture(),bad={...f.args};
  if(mode==='fresh')bad.driver=f.api.createMountedReturn();
  if(mode==='displaced')bad.position={x:f.position.x+.03,z:0};
  if(mode==='goal')bad.destination={...goal,x:3};
  assert.equal(f.registry.save(bad),false);assert.equal(f.registry.take(f.args),null);
 }
});
test('changed geometry invalidates saved doorway evidence and it is not reusable',()=>{
 const f=fixture();assert.equal(f.registry.save(f.args),true);f.close();
 assert.equal(f.registry.take(f.args),null);assert.equal(f.registry.take(f.args),null);
 assert.equal(f.tick(f.position).status,'hold');
});
test('transit record is scoped to save, identity, character, area, routine, target and eligibility',()=>{
 for(const override of [{session:{}},{user:{}},{character:{}},{area:'oldtown'},{key:'new'},{destination:{...goal,x:3}},{eligible:false},{options:{made:true,adult:true}}]){
  const f=fixture();assert.equal(f.registry.save(f.args),true);
  assert.equal(f.registry.take({...f.args,...override}),null);assert.equal(f.registry.take(f.args),null);
 }
});
test('displacement before first resumed stride invalidates cached doorway evidence',()=>{
 const f=fixture();assert.equal(f.registry.save(f.args),true);assert.ok(f.registry.take(f.args));
 const p={x:f.position.x+.03,z:0};const q=f.tick(p);assert.equal(q.status,'hold');assert.deepEqual(q.position,p);
 assert.equal(f.tick(p).status,'hold');
});
test('actual mounted adapter retains the issued driver in shifted scene coordinates',()=>{
 const f=fixture(),source=readFileSync(require.resolve('../void-runner/npc-made.js'),'utf8');
 const begin=source.indexOf('  const sessionNow='),end=source.indexOf('  const wl=',begin);
 assert.ok(begin>=0&&end>begin);
 const shift={x:10,z:20},root={VoidAccount:{user:f.args.user},VoidNPCReturn:f.api},HERE=new Set([area]);
 const create=new Function('root','state','HERE','shift','returnSuspensions','disposed',source.slice(begin,end)+'\nreturn {suspendReturn,resumeReturn};');
 const a=create(root,f.args.session,HERE,shift,f.registry,true),b=create(root,f.args.session,HERE,shift,f.registry,false);
 const plan={area,key:goal.key,why:'stay',mode:'stay',x:goal.x-shift.x,z:goal.z-shift.z};
 const actor={id:f.args.id,c:f.args.character,plan,s:{x:f.position.x-shift.x,z:f.position.z-shift.z,yaw:1},returnJourney:{area,driver:f.driver}};
 b.suspendReturn(actor);assert.equal(b.resumeReturn(actor.id,actor.c,plan),null);
 a.suspendReturn(actor);const r=b.resumeReturn(actor.id,actor.c,plan);assert.ok(r);assert.equal(r.driver,f.driver);assert.ok(Math.abs(r.x-f.position.x)<1e-8);
 assert.equal(b.resumeReturn(actor.id,actor.c,plan),null);
 assert.ok(source.includes('driver:resumed.driver||root.VoidNPCReturn.createMountedReturn()'));
});

test('mounted driver and suspension registry resume twice in real Old Town public-pavement transit, both directions',()=>{
 const A=require('../void-runner/npc-areas.js');
 const api=require('../void-runner/npc-return.js');
 const area='oldtown',options={made:true,adult:false};
 const legal=(p,passing=false)=>{
  const c=A.check(p,area,passing?A.CLEAR-.1:undefined,{...options,passing});
  return c.ok&&c.area===area;
 };
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
 // Use the established real pedestrian geometry fixture, not a synthetic opening.
 let fixture;
 for(let i=517;i<=524&&!fixture;i++){
  const x=i/10,a={x,z:-63},b={x,z:-54};
  if(!legal(a)||!legal(b)||A.leg(a,b,options).length)continue;
  const samples=Array.from({length:46},(_,j)=>({x,z:-63+j*.2}));
  if(samples.every(p=>legal(p,true))&&samples.some(p=>!legal(p)))fixture={a,b};
 }
 assert.ok(fixture,'real passing-only public pavement leg must exist');
 for(const [from,to] of [[fixture.a,fixture.b],[fixture.b,fixture.a]]){
  const driver=api.createMountedReturn(),registry=api.createReturnSuspensions();
  const destination={...to,area,key:'routine'},session={},user={},character={};
  let position={...from},suspensions=0,total=0,arrived=false;
  for(let i=0;i<1000;i++){
   const result=driver.tick({position,area,destination,dt:.05,speed:1,options});
   if(result.status==='arrived'){arrived=true;break;}
   assert.equal(result.status,'walking',JSON.stringify({position,result}));
   const step=distance(position,result.position);
   assert.ok(step<=.05000001);
   assert.deepEqual(A.leg(position,result.position,options),[]);
   assert.ok(legal(result.position,true));
   total+=step;position=result.position;
   if(!legal(position)&&suspensions<2){
    const args={session,user,character,id:'fixture',area,key:'routine',position,yaw:0,driver,destination,options,eligible:true};
    assert.equal(registry.save(args),true,'driver-issued transit observation must survive unloading');
    const resumed=registry.take(args);
    assert.ok(resumed);assert.equal(resumed.driver,driver);
    assert.ok(distance(resumed,position)<1e-8,'resume must retain exact observed position');
    assert.equal(registry.take(args),null,'resume record is single-use');
    suspensions++;position={x:resumed.x,z:resumed.z};
   }
  }
  assert.ok(arrived&&distance(position,to)<=.025,'physical arrival required');
  assert.equal(suspensions,2,'exercise repeat unloading inside passing-only geometry');
  assert.ok(total+.025>=distance(from,to),'no skipped distance');
 }
});
