// #495: regression coverage for the group/follow primitives already on main.
// This is a simulated two-session contract, not a browser/network multiplayer test.
const test=require('node:test');
const assert=require('node:assert/strict');
const A=require('../void-runner/npc-advanced-interactions.js');
const members=['iris','admin'];
const lines={iris:['A1','A2'],admin:['B1','B2']};
function session(clock){
 const coordinator=A.createDialogueCoordinator(clock),index={};
 return {coordinator,index,step:(near=members,id='store')=>A.groupStep(coordinator,{
  id,members,order:'alternate',cooldownMs:5000,lines,index,near
 })};
}
test('two player sessions retain separate turns, authored line positions and cooldowns',()=>{
 let now=1000;const a=session(()=>now),b=session(()=>now);
 assert.equal(a.step().line,'A1');
 assert.equal(b.step().line,'A1');
 now=5999;assert.equal(a.step().line,null);assert.deepEqual(a.index,{iris:1});
 now=6000;assert.equal(a.step().line,'B1');
 assert.deepEqual(b.index,{iris:1});
 now=11000;assert.equal(a.step().line,'A2');assert.equal(b.step().line,'B1');
 assert.deepEqual(a.index,{iris:2,admin:1});assert.deepEqual(b.index,{iris:1,admin:1});
});
test('loss of nearby participants never advances the group or consumes its next line',()=>{
 let now=0;const a=session(()=>now);assert.equal(a.step().line,'A1');
 now=5000;assert.equal(a.step(['iris']).line,null);assert.equal(a.step([]).line,null);
 assert.deepEqual(a.index,{iris:1});assert.equal(a.step().line,'B1');
});
test('a group lock cannot release another group or survive an explicit session reset',()=>{
 let now=0;const c=A.createDialogueCoordinator(()=>now);
 const old=c.acquire('store','iris',members,0,true);
 const other=c.acquire('other','iris',members,0,true);
 assert.ok(old);assert.ok(other);assert.equal(c.busy('other'),true);
 assert.equal(c.release(old,members),true);assert.equal(c.busy('other'),true);
 c.clear();assert.equal(c.busy('other'),false);
 const fresh=c.acquire('other','iris',members,0,true);assert.ok(fresh);
 assert.equal(c.release(other,members),false);assert.equal(c.busy('other'),true);
 assert.equal(c.release(fresh,members),true);
});
test('two independent follower invitations cannot share timeout or accepted state',()=>{
 let a=A.followStep(undefined,{dt:3,maxWait:5});
 let b=A.followStep(undefined,{accepted:true,near:true,maxWait:5});
 assert.equal(a.phase,'invite');assert.equal(b.phase,'lead');
 a=A.followStep(a,{dt:2,maxWait:5});assert.equal(a.phase,'return');
 b=A.followStep(b,{near:false,dt:1,maxWait:5});assert.equal(b.phase,'wait');
 b=A.followStep(b,{near:true,maxWait:5});assert.equal(b.phase,'lead');
 assert.equal(A.followStep(b,{atDestination:true,playerArrived:false,dt:1,maxWait:5}).phase,'wait');
 assert.equal(A.followStep(b,{atDestination:true,playerArrived:true,maxWait:5}).phase,'done');
 assert.equal(a.phase,'return');
});


// Exercise the actual walking-runtime adapter in isolation, not just its helper.
// This deliberately does not claim a browser or networked multiplayer test.
const fs=require('node:fs');
const runtimeSource=fs.readFileSync(require('node:path').join(__dirname,'../void-runner/live-content.js'),'utf8');
function runtimeGroupHarness(source=runtimeSource){
 const groupStart=source.indexOf('function groupTick()');
 const syncStart=source.indexOf('function syncOrdinaryInteractions()');
 const end=source.indexOf('function ordinaryTick()',groupStart);
 assert.ok(groupStart>=0&&end>groupStart,'walking group adapter not found');
 const adapter=source.slice(syncStart>=0&&syncStart<groupStart?syncStart:groupStart,end);
 let time=0;
 const spoken=[],members=['iris','admin'],poses=[],cancelled=[];
 const makeTable=()=>Object.fromEntries(members.map(id=>[id,{distance:3,advanced:{group:{
  id:'store',members:[...members],order:'alternate',cooldown:5,lines:id==='iris'?'A1\nA2':'B1\nB2'
 }}}]));
 const env={interactions:makeTable(),givers:members.map(id=>({id,name:id,say:id}))};
 const control={blocked:false,speaking:false,busy:new Set(),distance:{},now:()=>time,newScene:false,line:null};
 const root={VoidAdvancedInteractions:A,VoidAudio:{
  speak(id,text){spoken.push([id,text]);control.line={id,text,ordinary:true,active:true,key:spoken.length};return true;},
  get voiceStatus(){return control.line;},
  cancel(){cancelled.push(control.line?.text);control.line=null;}
 }};
 const tick=new Function('root','env','control','poses',
  'let ordinaryFor=null,groupCoordinator=null,groupPlayback=null,groupIndex={},ordinaryNear=new Map(),ordinaryTalkCounts=new Map(),walkingLocation={solids:[]},walker={x:0,y:1.7,z:0},speech=false;'+
  'const Date={now:control.now},nearBlocked=()=>control.blocked,callBusy=()=>false,missionBusy=id=>control.busy.has(id),giverDistance=id=>control.distance[id]??0,announce=()=>{},poseUntil=(...a)=>poses.push(a),where=()=>walker,giverPoint=()=>[0,0];'+
  adapter+';return ()=>{speech=control.speaking;if(control.newScene){walkingLocation={solids:[]};control.newScene=false;}return groupPlaybackTick(control.blocked||speech)||groupTick();};'
 )(root,env,control,poses);
 return {tick,spoken,poses,cancelled,control,env,makeTable,advance:t=>{time=t;},ended(){control.line.active=false;}};
}
test('walking group holds the speaker and pose until the audio ends, then applies cooldown',()=>{
 const h=runtimeGroupHarness();
 assert.equal(h.tick(),true);
 h.advance(5500);
 assert.equal(h.tick(),true);
 assert.deepEqual(h.spoken,[['iris','A1']]);
 assert.deepEqual(h.poses.at(-1),['iris','talk',650]);
 h.ended();assert.equal(h.tick(),false);
 h.advance(10499);assert.equal(h.tick(),false);
 h.advance(10500);assert.equal(h.tick(),true);
 assert.deepEqual(h.spoken,[['iris','A1'],['admin','B1']]);
});
test('walking group adapter clears the active line and turn when published interactions change',()=>{
 const h=runtimeGroupHarness();
 h.tick();h.ended();h.advance(3500);h.tick();
 h.advance(8500);h.tick();h.env.interactions=h.makeTable();
 h.advance(8750);assert.equal(h.tick(),true);
 assert.deepEqual(h.spoken,[['iris','A1'],['admin','B1'],['iris','A1']]);
 assert.deepEqual(h.cancelled,['B1']);
});
test('two walking runtime clients keep independent audio and cancel only the line they own',()=>{
 const a=runtimeGroupHarness(),b=runtimeGroupHarness();
 a.tick();b.tick();
 a.advance(1000);a.control.distance.iris=20;assert.equal(a.tick(),false);
 assert.deepEqual(a.cancelled,['A1']);assert.deepEqual(b.cancelled,[]);
 b.advance(8000);assert.equal(b.tick(),true);
 assert.deepEqual(b.spoken,[['iris','A1']]);
 b.control.line={id:'admin',text:'Mission call',ordinary:false,active:true,key:2};
 b.control.speaking=true;assert.equal(b.tick(),false);
 assert.deepEqual(b.cancelled,[],'mission speech belongs to another caller');
});
test('changing scenes or preempting the group with a mission releases the active line',()=>{
 for(const change of [c=>{c.newScene=true;},c=>{c.busy.add('iris');}]){
  const h=runtimeGroupHarness();h.tick();h.advance(1000);
  change(h.control);h.tick();
  assert.deepEqual(h.cancelled,['A1']);
 }
});
test('walking group adapter respects mission ownership, mismatched group definitions and blocked speech',()=>{
 const h=runtimeGroupHarness();h.control.busy.add('iris');assert.equal(h.tick(),false);
 h.control.busy.clear();h.env.interactions.admin.advanced.group.order='free';assert.equal(h.tick(),false);
 h.env.interactions=h.makeTable();h.control.speaking=true;assert.equal(h.tick(),false);
 h.control.speaking=false;h.control.blocked=true;assert.equal(h.tick(),false);
 h.control.blocked=false;assert.equal(h.tick(),true);assert.deepEqual(h.spoken,[['iris','A1']]);
});
