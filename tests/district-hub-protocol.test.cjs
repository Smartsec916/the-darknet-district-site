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
test('two players see each other once placed, with the server-chosen model; a guest with no saved character gets the default look',()=>{
 const r=rig(),a={},b={};
 assert(r.hub.join(a,hello,who('A')));assert(r.hub.join(b,hello,who('B',{anonymous:true,model:undefined})));
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
test('players are visible everywhere they can walk: one room per place, people in the same place see each other, an unknown place is refused',()=>{
 for(const id of ['district-interior','neochinatown-street','corporate','temple','meridian','vesper'])assert(ROOMS[id],id);
 const r=rig(),a={},b={},c={},street={t:'hello',token:'x',room:'neochinatown-street'};
 assert(r.hub.join(a,street,who('A',{handle:'Ann_1'})));assert(r.hub.join(b,street,who('B',{handle:'Bob_1'})));assert(r.hub.join(c,hello,who('C',{handle:'Cat_1'})));
 r.hub.state(a,st(30,-90));r.adv(100);r.hub.state(b,st(32,-90));r.adv(100);r.hub.state(c,st(0,30));
 assert.deepEqual(r.msgs(a).filter(m=>m.t==='join').map(m=>m.peer.name),['Bob_1'],'Ann on the street sees Bob on the street, not Cat inside the District');
 assert.equal(r.msgs(c).filter(m=>m.t==='join').length,0,'Cat inside the District sees nobody from the street');
 assert.equal(r.hub.roomPeers('neochinatown-street').length,2);assert.equal(r.hub.roomPeers('district-interior').length,1);
 const d={};assert.equal(r.hub.join(d,{t:'hello',token:'x',room:'somewhere-made-up'},who('D')),false);assert.equal(r.last(d).reason,'unknown room');
 // the game client names the same rooms
 const src=require('node:fs').readFileSync('void-runner/remote-players.js','utf8'),m=src.match(/const PLACES=new Set\(\[([^\]]*)\]\)/);assert(m);
 for(const id of m[1].split(',').map(x=>x.trim().replace(/'/g,'')))assert(ROOMS[id],'the hub knows '+id);assert(src.includes("'neochinatown-street'"));
});

test('voice: a registered player gets a short-lived token for the voice room of the place they are in; the secret never leaves; guests and floods are refused',()=>{
 const crypto=require('node:crypto'),V=require('../tools/district-hub/voice.cjs');
 assert.equal(V.fromEnv({}),null,'no variables: voice is simply off');{const said=[];assert.equal(V.fromEnv({LIVEKIT_URL:'https://x.livekit.cloud',LIVEKIT_API_KEY:'APIabc123',LIVEKIT_API_SECRET:'s'.repeat(40)},m=>said.push(m)),null,'a wrong value turns voice off; it never stops the hub');assert.match(said[0],/LIVEKIT_URL/);assert(!said[0].includes('ssss'),'the warning never repeats a value');}
 const voice=V.fromEnv({LIVEKIT_URL:'wss://dd-test.livekit.cloud/',LIVEKIT_API_KEY:'APIabc123XYZ',LIVEKIT_API_SECRET:'super-secret-value-0123456789abcdef'});assert.equal(voice.url,'wss://dd-test.livekit.cloud');
 let now=1e6;const sent=new Map(),hub=new Hub({send:(c,m)=>{(sent.get(c)||sent.set(c,[]).get(c)).push(m);},close:()=>{},now:()=>now,voice});
 const a={},g={},b={};hub.join(a,{t:'hello',token:'x',room:'neochinatown-street'},who('A',{handle:'Ann_1'}));hub.join(g,hello,who('G',{anonymous:true,handle:'Guest_9'}));hub.join(b,hello,who('B',{handle:'Bob_1'}));
 assert.equal(sent.get(a).find(m=>m.t==='welcome').features.voice,true);assert.equal(sent.get(g).find(m=>m.t==='welcome').features.voice,false);
 assert.equal(hub.voiceToken(a).ok,true);const m=sent.get(a).at(-1);assert.equal(m.t,'voice-token');assert.equal(m.url,'wss://dd-test.livekit.cloud');assert.equal(m.room,'dd-neochinatown-street');assert.equal(m.identity,publicId('A'));
 const [h,p,sig]=m.token.split('.'),body=JSON.parse(Buffer.from(p,'base64url'));
 assert.equal(crypto.createHmac('sha256','super-secret-value-0123456789abcdef').update(h+'.'+p).digest('base64url'),sig,'signed with the secret');
 assert.equal(body.iss,'APIabc123XYZ');assert.equal(body.sub,publicId('A'));assert.equal(body.name,'Ann_1');assert.deepEqual(body.video,{room:'dd-neochinatown-street',roomJoin:true,canPublish:true,canSubscribe:true,canPublishData:false,canPublishSources:['microphone']});
 assert(body.exp-body.nbf<=700,'about ten minutes');assert(!JSON.stringify(sent.get(a)).includes('super-secret'),'the secret is never sent');assert(!JSON.stringify(body).includes('uid'),'no account id in the token');
 assert.equal(hub.voiceToken(a).ok,false,'not again straight away');now+=4000;assert.equal(hub.voiceToken(a).ok,true);
 assert.equal(hub.voiceToken(g).ok,false);assert.match(sent.get(g).at(-1).reason,/secured/);
 hub.voiceToken(b);assert.equal(sent.get(b).at(-1).room,'dd-district-interior','a different place is a different voice room');assert.equal(V.roomName('vr:0123456789ab'),'dd-vr-0123456789ab','a VR session has its own voice room');
 const off=new Hub({send:(c,m)=>{(sent.get(c)||sent.set(c,[]).get(c)).push(m);},close:()=>{},now:()=>now}),c={};off.join(c,hello,who('C',{handle:'Cat_1'}));assert.equal(off.voiceToken(c).ok,false);
 assert(parse('{"t":"voice-token"}'));assert.equal(parse('{"t":"voice-token","room":"x"}'),null,'the player cannot name a room');
});

test('the V3 eye light: a player says when they are using it, the room is told, and someone arriving later sees it',()=>{
 let now=1e6;const sent=new Map(),hub=new Hub({send:(c,m)=>{(sent.get(c)||sent.set(c,[]).get(c)).push(m);},close:()=>{},now:()=>now});
 assert.deepEqual(parse('{"t":"eye","on":true}'),{t:'eye',on:true});assert.equal(parse('{"t":"eye","on":1}'),null);assert.equal(parse('{"t":"eye","on":true,"colour":"red"}'),null,'nothing but on or off');
 const a={},b={},c={};hub.join(a,hello,who('A',{handle:'Ann_1'}));hub.join(b,hello,who('B',{handle:'Bob_1'}));hub.state(a,st(1,30));hub.state(b,st(2,31));now+=200;hub.tick?.();
 assert.equal(hub.eye(a,{t:'eye',on:true}),true);assert.deepEqual(sent.get(b).at(-1),{t:'eye',id:publicId('A'),on:true});assert.ok(!(sent.get(a)||[]).some(m=>m.t==='eye'),'not echoed to the sender');
 assert.equal(hub.eye(a,{t:'eye',on:true}),false,'saying it twice sends nothing');
 hub.join(c,hello,who('C',{handle:'Cat_1'}));hub.state(c,st(3,32));now+=200;hub.tick?.();
 const seen=(sent.get(c)||[]).flatMap(m=>m.t==='join'?[m.peer]:m.t==='welcome'||m.t==='snap'?(m.peers||[]):[]).find(p=>p&&p.id===publicId('A'));assert.ok(seen,'the newcomer is told about A');assert.equal(seen.eye,true);
 assert.equal(hub.eye(a,{t:'eye',on:false}),true);assert.deepEqual(sent.get(b).at(-1),{t:'eye',id:publicId('A'),on:false});
});
test('the device seen by others: only open/closed, the model and read/cam parse; nothing about the screen; the welcome says the hub knows it',()=>{
 assert.deepEqual(parse('{"t":"dev","dev":"v1"}'),{t:'dev',dev:'v1'});assert.deepEqual(parse('{"t":"dev","dev":null}'),{t:'dev',dev:null});assert.deepEqual(parse('{"t":"dev","dev":"v3","pose":"cam"}'),{t:'dev',dev:'v3',pose:'cam'});
 for(const bad of ['{"t":"dev"}','{"t":"dev","dev":"v4"}','{"t":"dev","dev":"V1"}','{"t":"dev","dev":true}','{"t":"dev","dev":null,"pose":"read"}','{"t":"dev","dev":"v1","pose":"selfie"}','{"t":"dev","dev":"v1","app":"messages"}','{"t":"dev","dev":"v1","pose":"read","text":"hi"}','{"t":"dev","dev":"v1","screen":"x"}','{"t":"dev","dev":"v2","id":"aaaaaaaaaaaa"}'])assert.equal(parse(bad),null,bad);
 const {hub,msgs}=rig(),a={};hub.join(a,hello,who('A'));assert.equal(msgs(a)[0].features.dev,true);
});
test('a device change goes to the room once, never to the sender; too-fast changes wait for the next position; latecomers see it',()=>{
 let now=1e6;const sent=new Map(),hub=new Hub({send:(c,m)=>{(sent.get(c)||sent.set(c,[]).get(c)).push(m);},close:()=>{},now:()=>now});const devs=c=>(sent.get(c)||[]).filter(m=>m.t==='dev');
 const a={},b={},c={};hub.join(a,hello,who('A'));hub.join(b,hello,who('B'));hub.state(a,st(1,30));hub.state(b,st(2,31));now+=300;
 assert.equal(hub.dev(a,{t:'dev',dev:'v1'}),true);assert.deepEqual(devs(b).at(-1),{t:'dev',id:publicId('A'),dev:'v1',pose:'read'});assert.equal(devs(a).length,0,'not echoed');
 assert.equal(hub.dev(a,{t:'dev',dev:'v1',pose:'read'}),false,'the same again sends nothing');assert.equal(devs(b).length,1);
 now+=50;assert.equal(hub.dev(a,{t:'dev',dev:'v1',pose:'cam'}),false,'too soon: held');assert.equal(devs(b).length,1);
 now+=100;hub.state(a,st(1,30));assert.equal(devs(b).length,1,'still inside the interval');now+=150;hub.state(a,st(1,30));assert.deepEqual(devs(b).at(-1),{t:'dev',id:publicId('A'),dev:'v1',pose:'cam'},'sent with the next position');
 now+=300;hub.dev(a,{t:'dev',dev:'v3',pose:'cam'});now+=50;hub.dev(a,{t:'dev',dev:'v3',pose:'cam'});assert.equal(devs(b).length,3,'no repeat');
 now+=10;hub.dev(a,{t:'dev',dev:'v2'});now+=10;hub.dev(a,{t:'dev',dev:'v3',pose:'cam'});now+=300;hub.state(a,st(1,30));assert.equal(devs(b).length,3,'a change and back before it went out sends nothing more');
 hub.join(c,hello,who('C'));const seen=(sent.get(c)||[]).find(m=>m.t==='welcome').peers.find(p=>p.id===publicId('A'));assert.equal(seen.dev,'v3');assert.equal(seen.pose,'cam');
 now+=300;hub.dev(a,{t:'dev',dev:null});assert.deepEqual(devs(b).at(-1),{t:'dev',id:publicId('A'),dev:null});
 const v=hub.view(hub.byConn.get(a));assert.equal(v.dev,null);assert.ok(!('pose' in v));
 assert.equal(hub.dev({},{t:'dev',dev:'v1'}),false,'no session, nothing');
});
