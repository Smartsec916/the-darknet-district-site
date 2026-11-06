const test=require('node:test'),assert=require('node:assert/strict');
const {Hub,parse,publicId,LIMITS,ROOMS}=require('../tools/district-hub/protocol.cjs');
function rig(){let now=1e6;const sent=new Map(),closed=[];
 const hub=new Hub({send:(c,m)=>{(sent.get(c)||sent.set(c,[]).get(c)).push(m);},close:(c,code,why)=>closed.push([c,code,why]),now:()=>now});
 return {hub,sent,closed,adv:ms=>{now+=ms;},msgs:c=>sent.get(c)||[],last:c=>(sent.get(c)||[]).at(-1)};}
const hello={t:'hello',token:'x',room:'district-interior'},who=(uid,extra={})=>({uid,anonymous:false,model:'district-resident',...extra});
const st=(x,z,yaw=0)=>({t:'state',x,z,yaw});

test('only well-formed hello, state and bye messages parse; identity fields are invalid',()=>{
 assert(parse(JSON.stringify(hello)));assert(parse(JSON.stringify(st(1,2,3))));assert(parse('{"t":"bye"}'));
 for(const bad of ['{"t":"state","x":1,"z":2,"yaw":0,"uid":"other"}','{"t":"state","x":1,"z":2,"yaw":0,"model":"admin"}','{"t":"hello","token":"x","room":"r","name":"Admin"}','{"t":"state","x":"1","z":2,"yaw":0}','{"t":"state","x":null,"z":2,"yaw":0}','{"t":"state","x":1e9,"z":2,"yaw":0}','[]','7','{','x'.repeat(600)])assert.equal(parse(bad),null,bad);
});
test('public ids are stable, short and do not reveal the account id',()=>{assert.equal(publicId('uid-1'),publicId('uid-1'));assert.notEqual(publicId('uid-1'),publicId('uid-2'));assert.equal(publicId('uid-1').length,12);assert(!publicId('uid-1').includes('uid'));});
test('two players see each other once placed, with the server-chosen model; guests get the default look',()=>{
 const r=rig(),a={},b={};
 assert(r.hub.join(a,hello,who('A')));assert(r.hub.join(b,hello,who('B',{anonymous:true,model:'district-resident'})));
 assert.equal(r.last(a).t,'welcome');assert.deepEqual(r.last(a).peers,[],'nobody is shown before they report a position');
 r.hub.state(a,st(10,10));r.adv(100);r.hub.state(b,st(11,10));
 const joins=r.msgs(a).filter(m=>m.t==='join');assert.equal(joins.length,1);assert.equal(joins[0].peer.model,'district-smuggler','a guest cannot claim a character');assert(joins[0].peer.name.startsWith('Guest-'));
 assert.equal(r.msgs(b).find(m=>m.t==='join').peer.model,'district-resident');
});
test('the server derives the animation from speed and clamps facing',()=>{
 const r=rig(),a={},b={};r.hub.join(a,hello,who('A'));r.hub.join(b,hello,who('B'));r.hub.state(a,st(0,0));r.hub.state(b,st(5,5));
 r.adv(100);r.hub.state(a,st(0,.3,0));assert.equal(r.msgs(b).filter(m=>m.t==='state').at(-1).clip,'walk');
 r.adv(100);r.hub.state(a,st(0,.3,0));assert.equal(r.msgs(b).filter(m=>m.t==='state').at(-1).clip,'walk','walking holds briefly when a frame did not move');
 r.adv(1000);r.hub.state(a,st(0,.3,9));const s=r.msgs(b).filter(m=>m.t==='state').at(-1);assert.equal(s.clip,'idle');assert(Math.abs(s.yaw)<=Math.PI);
});
test('speed, bounds, snaps and floods are enforced',()=>{
 const r=rig(),a={};r.hub.join(a,hello,who('A'));r.hub.state(a,st(0,0));
 r.adv(100);assert.equal(r.hub.state(a,st(500,0)).ok,false,'out of bounds');
 r.adv(100);assert.equal(r.hub.state(a,st(30,0)).ok,true,'one snap allowed (a door, leaving the pod)');
 r.adv(100);assert.equal(r.hub.state(a,st(90,0)).ok,false,'a second jump so soon is refused');
 for(let i=0;i<LIMITS.violationsBeforeKick;i++){r.adv(100);r.hub.state(a,st(200+i*20,0));}
 assert(r.closed.some(c=>c[0]===a&&c[1]===4002),'repeat offenders are disconnected');
 const f=rig(),c={};f.hub.join(c,hello,who('F'));for(let i=0;i<LIMITS.maxPerSecond+3;i++)f.hub.state(c,st(i*.001,0));
 assert(f.closed.some(x=>x[0]===c&&x[1]===4002),'a flood is disconnected');
});
test('leaving, closing and silence each remove the avatar exactly once; no ghosts',()=>{
 const r=rig(),a={},b={},c={};for(const [k,u] of [[a,'A'],[b,'B'],[c,'C']]){r.hub.join(k,hello,who(u));r.hub.state(k,st(1,1));}
 r.hub.drop(a,0);r.hub.closed(a);assert.equal(r.msgs(b).filter(m=>m.t==='leave').length,1);
 r.adv(LIMITS.staleMs+1);r.hub.state(b,st(1,2));r.hub.sweep();
 assert(r.closed.some(x=>x[0]===c&&x[1]===4004),'a silent player times out');assert.equal(r.msgs(b).filter(m=>m.t==='leave').length,2);assert.equal(r.hub.peers.size,1);
});
test('reconnecting replaces the old session; no duplicate and no leave/join flicker leak',()=>{
 const r=rig(),a1={},a2={},b={};r.hub.join(a1,hello,who('A'));r.hub.join(b,hello,who('B'));r.hub.state(a1,st(1,1));r.adv(100);r.hub.state(b,st(2,2));
 r.hub.join(a2,hello,who('A'));
 assert(r.closed.some(x=>x[0]===a1&&x[1]===4001));assert.equal(r.hub.peers.size,2);assert.equal(r.msgs(b).filter(m=>m.t==='leave').length,1);
 r.hub.closed(a1);assert.equal(r.hub.peers.size,2,'the replaced connection closing must not remove the new one');assert.equal(r.msgs(b).filter(m=>m.t==='leave').length,1);
 r.hub.state(a2,st(1,1));assert.equal(r.msgs(b).filter(m=>m.t==='join'&&m.peer.id===publicId('A')).length,2,'announced again once the new session reports a position');
 assert.equal(r.msgs(a2).find(m=>m.t==='welcome').peers.length,1);
});
test('unknown rooms and full rooms are refused',()=>{
 const r=rig(),a={};assert.equal(r.hub.join(a,{...hello,room:'secret-room'},who('A')),false);assert.equal(r.last(a).t,'error');
 for(let i=0;i<ROOMS['district-interior'].cap;i++)assert(r.hub.join({},hello,who('P'+i)));
 const x={};assert.equal(r.hub.join(x,hello,who('late')),false);assert(r.closed.some(c=>c[0]===x&&c[1]===4003));
});
test('a login token fits in hello, but nothing else may be large',()=>{
 assert(parse(JSON.stringify({t:'hello',token:'a'.repeat(1500),room:'district-interior'})));
 assert.equal(parse(JSON.stringify({t:'hello',token:'a'.repeat(5000),room:'district-interior'})),null);
 assert.equal(parse(JSON.stringify({t:'state',x:1,z:2,yaw:0,pad:'a'.repeat(600)})),null);
});

test('chat, ignore and report messages: only exact shapes parse; identity or extra fields are invalid',()=>{
 const {parse}=require('../tools/district-hub/protocol.cjs');
 for(const ok of ['{"t":"chat","text":"hi"}','{"t":"ignore","id":"0123456789ab","on":true}','{"t":"report","id":"0123456789ab","reason":"spam"}','{"t":"report","id":"0123456789ab","reason":"other","note":"text"}'])assert.ok(parse(ok),ok);
 for(const bad of ['{"t":"chat","text":"hi","name":"Admin"}','{"t":"chat","text":5}','{"t":"chat"}','{"t":"chat","text":"'+'a'.repeat(900)+'"}','{"t":"ignore","id":"nope","on":true}','{"t":"ignore","id":"0123456789ab","on":"yes"}','{"t":"report","id":"0123456789ab","reason":"made-up"}','{"t":"report","id":"0123456789ab","reason":"spam","uid":"x"}','{"t":"report","id":"0123456789ab","reason":"spam","note":5}'])assert.equal(parse(bad),null,bad);
});
