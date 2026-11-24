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

function runtimeFollowHarness(source=runtimeSource){
 const talkStart=source.indexOf('function ordinaryTalk(npcs)'),talkEnd=source.indexOf('function talkTo(',talkStart);
 const beginStart=source.indexOf('function endSocial('),beginEnd=source.indexOf('function socialDestination(',beginStart);
 assert.ok(talkStart>=0&&talkEnd>talkStart&&beginStart>=0&&beginEnd>beginStart);
 let time=0,choices=[],busy=false;
 const follow={role:'follow',invite:'Come along?',accept:'YES',decline:'NO',maxWait:5};
 const env={interactions:{iris:{advanced:{follow}}},givers:[{id:'iris',say:'iris'}]};
 const root={VoidAdvancedInteractions:A,VoidNPCPaths:{MOVABLE:{iris:{}}},talkChoice(lines,c){choices=c;return true;}};
 const control={now:()=>time,busy:()=>busy};
 const api=new Function('root','env','control',
  'const Date={now:control.now},MC={interactionLine:s=>s},social=new Map(),ordinaryTalkCounts=new Map(),carry={};let planAt=1,socialSerial=0;'+
  'const missionBusy=()=>control.busy(),resumeWalking=()=>{},saySocial=()=>{},socialDestination=()=>null,show=()=>{};'+
  source.slice(talkStart,talkEnd)+source.slice(beginStart,beginEnd)+
  ';return {open:()=>ordinaryTalk(["iris"]),phase:()=>social.get("iris")?.phase};'
 )(root,env,control);
 return {...api,advance:t=>{time=t;},choice:label=>choices.find(x=>x.label===label).run,
  republish(){env.interactions={iris:{advanced:{follow:{...follow}}}};},busy(){busy=true;}};
}
test('an expired invitation cannot be accepted, including at the exact deadline',()=>{
 const h=runtimeFollowHarness();h.open();const accept=h.choice('YES');h.advance(5000);accept();
 assert.notEqual(h.phase(),'active');
 h.open();h.choice('YES')();assert.equal(h.phase(),'active');
});
test('a superseded or declined invitation cannot start or cancel a newer session',()=>{
 const h=runtimeFollowHarness();h.open();const oldYes=h.choice('YES'),oldNo=h.choice('NO');
 h.advance(1000);h.open();const yes=h.choice('YES');oldYes();assert.equal(h.phase(),'offer');oldNo();assert.equal(h.phase(),'offer');
 yes();assert.equal(h.phase(),'active');oldNo();assert.equal(h.phase(),'active');
 h.open();const stop=h.choice('STOP FOLLOWING');stop();h.open();h.choice('YES')();stop();assert.equal(h.phase(),'active');
});
test('leaving, content replacement and mission priority invalidate the pending invitation',()=>{
 for(const change of [h=>h.choice('LEAVE')(),h=>h.republish(),h=>h.busy()]){
  const h=runtimeFollowHarness();h.open();const yes=h.choice('YES');change(h);yes();assert.notEqual(h.phase(),'active');
 }
});
test('two clients have independent invitation deadlines and acceptance',()=>{
 const a=runtimeFollowHarness(),b=runtimeFollowHarness();a.open();b.open();a.advance(5000);b.advance(4999);
 a.choice('YES')();b.choice('YES')();assert.notEqual(a.phase(),'active');assert.equal(b.phase(),'active');
});

function runtimeSocialLifecycleHarness(source=runtimeSource){
 const start=source.indexOf('function endSocial('),end=source.indexOf('function roomTick(',start);
 const carryStart=source.indexOf('function setCarry('),carryEnd=source.indexOf('/* Where the person',carryStart);
 const eventStart=source.indexOf('function onEscort('),eventEnd=source.indexOf('if(root.VoidStreetPair){root.VoidStreetPair.onEscort',eventStart);
 let time=0,busy=false;const said=[],follow={role:'lead',place:'store',maxWait:5,arrive:'HERE',cancel:'BYE'};
 const env={interactions:{iris:{advanced:{follow}}}};
 const root={VoidAdvancedInteractions:A,VoidNPCPaths:{MOVABLE:{iris:{name:'Iris'}}},VoidPlaces:{target:()=>[2,0,2]},VoidNPCAreas:{areaOf:()=> 'avenue',nearest:p=>p},VoidNPCEscort:{FLAG:'npcEsc',encode:c=>c.key}};
 const control={now:()=>time,busy:()=>busy};
 const api=new Function('root','env','control','said',
  'const Date={now:control.now},social=new Map(),carry={},state={story:{flags:{npcEsc:"mission/original"}}};let socialSerial=0,planAt=1,planCache={};'+
  'const missionBusy=()=>control.busy(),saySocial=(id,line)=>said.push(line),livePos=()=>({x:0,z:0}),treesOn=()=>false;'+
  source.slice(start,end)+source.slice(carryStart,carryEnd)+source.slice(eventStart,eventEnd)+
  ';return {start:()=>{const f=env.interactions.iris.advanced.follow,offer={phase:"offer",at:Date.now(),generation:0};social.set("iris",offer);return beginSocial("iris",offer,f);},plan:()=>socialPlan("iris"),end:()=>endSocial("iris","cancel"),event:(p,event,extra={})=>onEscort({npc:"iris",key:p.key,step:p.step,event,...extra}),carry:c=>setCarry("iris",c),flag:()=>state.story.flags.npcEsc};'
 )(root,env,control,said);
 return {...api,said,advance:t=>{time=t;},busy(){busy=true;},republish(){env.interactions={iris:{advanced:{follow:{...follow}}}};}};
}
test('an active lead expires after waiting, not while moving, and resets the wait on catch-up',()=>{
 const h=runtimeSocialLifecycleHarness();h.start();const p=h.plan();h.advance(4999);assert.ok(h.plan());h.advance(5000);assert.equal(h.plan(),null);
 h.start();const q=h.plan();h.event(q,'walk');h.advance(20000);assert.ok(h.plan());h.event(q,'wait');h.advance(24999);assert.ok(h.plan());
 h.event(q,'walk');h.advance(30000);h.event(q,'paused');h.advance(34999);assert.ok(h.plan());h.advance(35000);assert.equal(h.plan(),null);
});
test('an ended escort cannot complete or fail a newer escort for the same NPC',()=>{
 const h=runtimeSocialLifecycleHarness();h.start();const p=h.plan();h.end();h.start();const q=h.plan();assert.notEqual(p.key,q.key);
 h.event(p,'done');h.event(p,'failed');assert.ok(h.plan());h.event(q,'done');h.event(q,'done');assert.equal(h.plan(),null);assert.deepEqual(h.said,['BYE','HERE']);
});
test('active escort yields silently to mission priority or changed published content',()=>{
 for(const change of [h=>h.busy(),h=>h.republish()]){const h=runtimeSocialLifecycleHarness();h.start();const p=h.plan();change(h);assert.equal(h.plan(),null);h.event(p,'done');assert.deepEqual(h.said,[]);}
});
test('social escort carry never overwrites a saved mission escort',()=>{
 const h=runtimeSocialLifecycleHarness();h.start();const p=h.plan();h.carry({key:p.step,x:3,z:4});assert.equal(h.flag(),'mission/original');h.end();h.carry({key:p.step,x:4,z:5});assert.equal(h.flag(),'mission/original');h.carry({key:'mission/new',x:5,z:6});assert.equal(h.flag(),'mission/new');
});
