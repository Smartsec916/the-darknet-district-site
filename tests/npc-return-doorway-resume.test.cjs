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
