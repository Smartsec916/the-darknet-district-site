'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {createReturnTools}=require('../void-runner/npc-return.js');
function fixture(){
 let blocked=false;
 const A={get:a=>a==='avenue'?{}:null,check:(p,a)=>({ok:a==='avenue'&&!blocked&&Number.isFinite(p.x)&&Number.isFinite(p.z),area:a})};
 const tools=createReturnTools(A,{}),registry=tools.createReturnSuspensions(),session={},user={},character={};
 const base={session,user,id:'npc',character,area:'avenue',key:'routine',position:{x:1,z:2},yaw:1,eligible:true};
 return {tools,registry,base,block:()=>{blocked=true;}};
}
test('return suspension copies observed legal stop, consumed once',()=>{
 const {registry,base}=fixture();assert.equal(registry.save(base),true);base.position.x=10;
 assert.deepEqual(registry.take(base),{x:1,z:2,yaw:1});assert.equal(registry.take(base),null);
});
test('return suspension rejects identity, save, character and routine changes',()=>{
 for(const override of [{user:{}},{session:{}},{character:{}},{key:'new'},{area:'district'},{eligible:false}]){
  const {registry,base}=fixture();assert.equal(registry.save(base),true);
  assert.equal(registry.take({...base,...override}),null);assert.equal(registry.take(base),null);
 }
});
test('return suspension checks current geometry and refuses missing user scope',()=>{
 const {registry,base,block}=fixture();assert.equal(registry.save({...base,user:null}),false);
 assert.equal(registry.save(base),true);block();assert.equal(registry.take(base),null);assert.equal(registry.save(base),false);
});
test('return suspension isolates NPC records and clears on identity switch',()=>{
 const {registry,base}=fixture();assert.equal(registry.save(base),true);assert.equal(registry.save({...base,id:'other',position:{x:3,z:4}}),true);
 assert.deepEqual(registry.take({...base,id:'other'}),{x:3,z:4,yaw:1});registry.select(base.session,{});assert.equal(registry.take(base),null);
});
test('actual scene adapter retains canonical observed stop only on scene disposal',()=>{
 const {tools,base}=fixture();
 const source=readFileSync(require.resolve('../void-runner/npc-made.js'),'utf8');
 const begin=source.indexOf('  const sessionNow='),end=source.indexOf('  const wl=',begin);
 assert.equal(begin>=0&&end>begin,true);
 const root={VoidAccount:{user:base.user},VoidNPCReturn:tools},HERE=new Set(['avenue']),shift={x:10,z:20};
 const registry=tools.createReturnSuspensions();
 // The adapter closes over disposed and reads the actual current save and user.
 const create=new Function('root','state','HERE','shift','returnSuspensions','disposed',source.slice(begin,end)+'\nreturn {suspendReturn,resumeReturn};');
 const plan={area:'avenue',key:'routine',why:'stay',mode:'stay'};
 const actor={id:base.id,c:base.character,plan,s:{x:-9,z:-18,yaw:1},returnJourney:{area:'avenue'}};
 const a=create(root,base.session,HERE,shift,registry,true),b=create(root,base.session,HERE,shift,registry,false);
 b.suspendReturn(actor);assert.equal(b.resumeReturn(actor.id,actor.c,plan),null);
 a.suspendReturn(actor);assert.deepEqual(b.resumeReturn(actor.id,actor.c,plan),{x:1,z:2,yaw:1});
 a.suspendReturn(actor);assert.equal(b.resumeReturn(actor.id,actor.c,{...plan,entry:{x:5,z:5}}),null);
 a.suspendReturn(actor);root.VoidAccount.user={};assert.equal(b.resumeReturn(actor.id,actor.c,plan),null);
});
