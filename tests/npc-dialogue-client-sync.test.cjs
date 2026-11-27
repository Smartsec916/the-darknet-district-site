// Exercise the real walking dialogue adapter, remote message/lease methods and hub coordinator.
// Controlled clock and simulated transport/audio; the authenticated WebSocket suite is separate.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {NpcDialogue}=require('../tools/district-hub/npc-dialogue.cjs');
const live=fs.readFileSync('void-runner/live-content.js','utf8');
const remote=fs.readFileSync('void-runner/remote-players.js','utf8');
function section(src,start,end){
 const a=src.indexOf(start),b=src.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,'runtime section: '+start);return src.slice(a,b);
}
const adapter=section(live,'function groupTick()','function ordinaryTick()');
const wire=section(remote,"if(m.t==='npc-turn'){","if(m.t==='error'");
const methods=section(remote,'npcTurn(group,cooldown){','sendTrade(msg)');
function world(){
 let now=0;const clients=new Map(),events=[],timers=[];
 const book=new NpcDialogue(()=>now,(conn,m)=>{events.push({conn,...m});clients.get(conn).receive(m);});
 const at=t=>{assert.ok(t>=now);now=t;for(let i=0;i<timers.length;){if(timers[i].due<=now){timers.splice(i,1)[0].run();}else i++;}};
 function player(conn,visible,room='district-interior'){
  const peer={conn,room,placed:true,x:1,z:2},root={},spoken=[],poses=[],control={visible:new Set(visible),blocked:false,busy:new Set(),now:()=>now};
  const ws={readyState:1,send:s=>book.handle(peer,JSON.parse(s))};
  const transport=new Function('root','ws','clock','timer',
   "const npcTurns=new Map(),performance={now:clock},status='in',features={npcDialogue:true},setTimeout=timer;"+
   "root.VoidRemotePlayers={connected:true,features,"+methods+"};return m=>{"+wire+"};"
  )(root,ws,()=>now,(run,delay)=>timers.push({run,due:now+delay}));
  const members=['a','b','c'];
  const env={givers:members.map(id=>({id,name:id,say:id})),interactions:Object.fromEntries(members.map(id=>[id,{advanced:{group:{id:'demo',members,order:'alternate',cooldown:5,lines:id.toUpperCase()+'1'+String.fromCharCode(10)+id.toUpperCase()+'2'}}}]))};
  root.VoidAdvancedInteractions={createDialogueCoordinator:()=>({}),groupStep:()=>({line:null})};
  root.VoidAudio={speak:(id,line)=>{spoken.push([id,line]);return false;}};
  const runtime=new Function('root','env','control','poses',
    "let groupCoordinator=null,groupPlayback=null,groupIndex={},walkingLocation={quarter:'oldtown'},speech=false;"+
    "const Date={now:control.now},syncOrdinaryInteractions=()=>{},nearBlocked=()=>control.blocked,callBusy=()=>false,missionBusy=id=>control.busy.has(id),nearbyGroup=()=>control.visible,announce=()=>{},poseUntil=(...p)=>poses.push(p),finishGroup=()=>{};"+
    adapter+";return {tick:()=>groupPlayback?false:groupTick(),finish:()=>{groupPlayback?.finish?.();groupPlayback=null;}};"
  )(root,env,control,poses);
  const client={peer,receive:transport,...runtime,spoken,poses,control,env};clients.set(conn,client);return client;
 }
 return {book,at,player,events};
}
test('different views share three authored turns with actual client polling and lease release',()=>{
 const w=world(),a=w.player('one',['a','b']),b=w.player('two',['b','c']);
 const poll=t=>{w.at(t);a.tick();b.tick();};
 poll(0);poll(250);poll(750);poll(1000);
 assert.deepEqual(a.spoken,[['a','A1']]);assert.deepEqual(b.spoken,[]);
 assert.equal(w.book.activeByPeer.has(b.peer),false);
 assert.equal(w.book.activeByPeer.has(a.peer),true);
 w.at(1250);a.finish();
 poll(6250);poll(6500);poll(7000);poll(7250);
 assert.deepEqual(a.spoken,[['a','A1'],['b','B1']]);assert.deepEqual(b.spoken,[['b','B1']]);
 w.at(7500);a.finish();assert.equal(w.book.activeByPeer.has(b.peer),true);b.finish();
 poll(12500);poll(12750);poll(13250);poll(13500);
 assert.deepEqual(a.spoken,[['a','A1'],['b','B1']]);assert.deepEqual(b.spoken,[['b','B1'],['c','C1']]);
 w.at(13750);b.finish();
 assert.deepEqual(w.events.map(e=>[e.conn,e.turn]),[['one',0],['two',0],['one',1],['two',1],['one',2],['two',2]]);
 assert.equal(new Set(w.events.map(e=>e.group)).size,1);assert.equal(w.book.activeByPeer.size,0);
});
test('full-view group retains the legacy wire key and isolates different rooms',()=>{
 const w=world(),a=w.player('one',['a','b','c']),b=w.player('two',['a','b','c']),c=w.player('other',['a','b','c'],'other');
 w.at(0);a.tick();b.tick();c.tick();w.at(750);a.tick();b.tick();w.at(1000);a.tick();
 assert.deepEqual(a.spoken,[['a','A1']]);assert.deepEqual(b.spoken,[['a','A1']]);assert.deepEqual(c.spoken,[]);
 assert.equal(w.events[0].group,'oldtown:demo:111');assert.equal(w.events[0].token,w.events[1].token);
 a.finish();b.finish();assert.equal(w.book.activeByPeer.size,0);
});
test('unconsumed grant expires during a mission without releasing the other client',()=>{
 const w=world(),a=w.player('one',['a','b','c']),b=w.player('two',['a','b','c']);
 w.at(0);a.tick();b.tick();w.at(750);a.tick();b.control.busy.add('a');b.tick();
 w.at(1000);a.tick();assert.equal(w.book.activeByPeer.size,2);assert.deepEqual(b.spoken,[]);
 w.at(1950);b.tick();assert.equal(w.book.activeByPeer.has(b.peer),false);assert.equal(w.book.activeByPeer.has(a.peer),true);
 a.finish();assert.equal(w.book.activeByPeer.size,0);
});
test('draft and mission-owned groups do not request shared turns',()=>{
 const w=world(),a=w.player('one',['a','b','c']);
 a.env.draft=true;a.tick();assert.equal(w.book.groups.size,0);
 a.env.draft=false;a.control.busy.add('b');a.tick();assert.equal(w.book.groups.size,0);
});
