/* Open early-access mode (HUB_ACCESS=registered) and District text chat, over real WebSockets with signed test tokens and a fake game API (no network, no emulator).
   Needs `ws`. Run: node --test tests/district-hub-chat.test.cjs */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const WebSocket=require('ws'),{main}=require('../tools/district-hub/server.cjs'),{fromEnv}=require('../tools/district-hub/config.cjs'),Chat=require('../tools/district-hub/chat.cjs'),{makeWorld}=require('./helpers/hub-fixtures.cjs');
const ORIGIN='https://thedarknetdistrict.com';
const base={HUB_MODE:'production',HUB_API_BASE:'https://api.test',PORT:'0'};

test('config: registered access is explicit, cannot be mixed with an id list or the old open switch, and the default stays restricted',()=>{
 const c=fromEnv({...base,HUB_ACCESS:'registered'});assert.equal(c.allowed,null);assert.equal(c.registeredOnly,true);assert.equal(c.verifiedEmail,false);
 assert.equal(fromEnv({...base,HUB_ACCESS:'registered',HUB_REQUIRE_VERIFIED_EMAIL:'true'}).verifiedEmail,true);
 assert.throws(()=>fromEnv({...base,HUB_ACCESS:'registered',HUB_ALLOWED_UIDS:'u1'}),/cannot be combined/);
 assert.throws(()=>fromEnv({...base,HUB_ACCESS:'registered',HUB_ALLOW_ANY_SIGNED_IN:'true'}),/replaces HUB_ALLOW_ANY_SIGNED_IN/);
 assert.throws(()=>fromEnv({...base,HUB_ACCESS:'everyone'}),/HUB_ACCESS must be/);
 assert.throws(()=>fromEnv({...base}),/HUB_ALLOWED_UIDS is empty/,'default is still restricted');
 assert.equal(fromEnv({...base,HUB_ALLOWED_UIDS:'u1'}).registeredOnly,false);
 assert.throws(()=>fromEnv({...base,HUB_ACCESS:'registered',HUB_TRADING:'simulated'}),/HUB_TRADING/,'trading stays off in production');
});
test('chat rules: cleaning, links, length, hidden characters, repeats',()=>{
 assert.deepEqual(Chat.clean('  hello   there  '),{ok:true,text:'hello there'});
 for(const bad of ['http://x.io','www.example.org','buy at foo.com now','x'.repeat(201),'','   ',null,7,'aaaaaaaaaaaaaaaa'])assert.equal(Chat.clean(bad).ok,false,String(bad));
 assert.equal(Chat.clean('a‮b​c\u0007d').text,'abcd','bidi, zero-width and control characters are removed');
 assert.equal(Chat.clean('<b>hi</b> & "you"').text,'<b>hi</b> & "you"','kept as plain text; clients draw it with textContent');
 assert.equal(Chat.cleanNote('  a\nb  '+'z'.repeat(300)).length<=120,true);
});

const world=()=>makeWorld({
 ann:{uid:'uid-ann',model:'district-resident',handle:'Ann_R'},ben:{uid:'uid-ben',model:'district-smuggler',handle:'Ben_K'},cy:{uid:'uid-cy',model:'district-smuggler',handle:'Cy_0'},
 anon:{uid:'uid-anon',provider:'anonymous'},banned:{uid:'uid-banned',model:'district-smuggler',handle:'Banned_1'},unverified:{uid:'uid-unv',model:'district-smuggler',handle:'Unv_1',emailVerified:false},verified:{uid:'uid-ver',model:'district-smuggler',handle:'Ver_1',emailVerified:true}});
async function boot(w,env={},logs=[]){return main({...base,HUB_ACCESS:'registered',HUB_DENY_UIDS:'uid-banned',HUB_MAX_PER_IP:'12',...env},{fetchJwks:w.fetchJwks,fetchImpl:w.fetchImpl,log:(...a)=>logs.push(a.join(' '))});}
class C{
 constructor(hub,origin=ORIGIN){this.msgs=[];this.closed=null;this.ws=new WebSocket(`ws://127.0.0.1:${hub.port}`,origin===null?{}:{origin});this.ws.on('message',d=>{this.msgs.push(JSON.parse(d));this.wake?.();});this.ws.on('close',c=>{this.closed=c;this.wake?.();});this.ws.on('error',()=>{this.err=true;this.wake?.();});this.open=new Promise(r=>{this.ws.on('open',r);this.ws.on('error',r);});}
 send(o){this.ws.send(JSON.stringify(o));}
 async until(fn,ms=4000){const end=Date.now()+ms;for(;;){const v=fn(this);if(v)return v;if(Date.now()>end)throw new Error('timeout '+JSON.stringify(this.msgs).slice(0,400)+' closed='+this.closed);await new Promise(r=>{this.wake=r;setTimeout(r,40);});}}
 of(t){return this.msgs.filter(m=>m.t===t);}
}
const join=async(hub,acct,x=5,z=5)=>{const c=new C(hub);await c.open;c.send({t:'hello',token:acct.token,room:'district-interior'});await c.until(c=>c.of('welcome').length||c.of('error').length||c.closed);if(c.of('welcome').length)c.send({t:'state',x,z,yaw:0});return c;};
const wait=ms=>new Promise(r=>setTimeout(r,ms));

test('open registered access: any registered account joins with no id list; anonymous, unauthenticated, forged, wrong-origin and denied are refused',async()=>{
 const w=world(),hub=await boot(w);
 try{
  const ann=await join(hub,w.accounts.ann);assert.equal(ann.of('welcome').length,1);assert.equal(ann.of('welcome')[0].features.chat,true);
  const anon=await join(hub,w.accounts.anon);await anon.until(c=>c.closed);assert.equal(anon.closed,4407);assert.match(anon.of('error')[0].reason,/registered account required/);assert.equal(anon.of('welcome').length,0);
  const banned=await join(hub,w.accounts.banned);await banned.until(c=>c.closed);assert.equal(banned.closed,4403);
  const forged=new C(hub);await forged.open;forged.send({t:'hello',token:'a.b.c',room:'district-interior'});await forged.until(c=>c.closed);assert.equal(forged.closed,4401);
  const none=new C(hub);await none.open;none.send({t:'chat',text:'hi'});await none.until(c=>c.closed);assert.equal(none.of('chat').length,0,'no chat before signing in');
  const bad=new C(hub,'https://evil.example');await bad.open.catch(()=>{});await wait(150);assert.equal(bad.of('welcome').length,0);assert.notEqual(bad.ws.readyState,1,'wrong origin never opens');
  assert.equal(hub.hub.peers.size,1);
  ann.ws.close();
 }finally{await hub.close();}
});
test('verified-email option refuses accounts whose email is unverified',async()=>{
 const w=world();w.accounts.unverified.emailVerified=false;
 const hub=await boot(w,{HUB_REQUIRE_VERIFIED_EMAIL:'true'});
 try{const u=await join(hub,w.accounts.unverified);await u.until(c=>c.closed);assert.equal(u.closed,4408);const v=await join(hub,w.accounts.verified);assert.equal(v.of('welcome').length,1,'a verified account joins');v.ws.close();}finally{await hub.close();}
});
test('two registered players chat both ways with hub-chosen names; clients cannot choose a name or an id',async()=>{
 const w=world(),hub=await boot(w);
 try{
  const ann=await join(hub,w.accounts.ann,5,5),ben=await join(hub,w.accounts.ben,6,5);await ann.until(c=>c.of('join').length>=1);
  ann.send({t:'chat',text:'Hello Ben'});await ben.until(c=>c.of('chat').length>=1);
  const got=ben.of('chat')[0];assert.equal(got.name,'Ann_R');assert.equal(got.text,'Hello Ben');assert.equal(got.id,ann.of('welcome')[0].you);assert.equal(ann.of('chat')[0].text,'Hello Ben','the sender sees their own line');
  await wait(750);ben.send({t:'chat',text:'Hi Ann <3'});await ann.until(c=>c.of('chat').length>=2);assert.equal(ann.of('chat')[1].name,'Ben_K');
  // identity or extra fields in a chat message: refused as invalid, never relayed
  await ben.until(c=>c.of('chat').length>=2);const n=ben.of('chat').length;ann.send({t:'chat',text:'x',name:'Admin'});ann.send({t:'chat',text:'x',id:'000000000000'});await wait(250);assert.equal(ben.of('chat').length,n);
  assert.ok(ann.of('refused').length>=1);
  ann.ws.close();ben.ws.close();
 }finally{await hub.close();}
});
test('allow-list mode also rejects anonymous accounts, and chat requires entering the District',async()=>{
 const w=world(),hub=await main({...base,HUB_ALLOWED_UIDS:'uid-ann,uid-anon',HUB_MAX_PER_IP:'12'},{fetchJwks:w.fetchJwks,fetchImpl:w.fetchImpl,quiet:true});
 try{
  const ann=new C(hub);await ann.open;ann.send({t:'hello',token:w.accounts.ann.token,room:'district-interior'});await ann.until(c=>c.of('welcome').length);
  const anon=await join(hub,w.accounts.anon);await anon.until(c=>c.closed);assert.equal(anon.closed,4407);assert.equal(anon.of('welcome').length,0);
  ann.send({t:'chat',text:'not inside yet'});await ann.until(c=>c.of('chat-refused').length);assert.match(ann.of('chat-refused')[0].reason,/Walk into/);assert.equal(hub.hub.peers.size,1);
  ann.ws.close();anon.ws.close();
 }finally{await hub.close();}
});
test('chat abuse limits: links, length, duplicates, speed, then a pause; nothing refused is relayed',async()=>{
 const w=world(),hub=await boot(w);
 try{
  const ann=await join(hub,w.accounts.ann),ben=await join(hub,w.accounts.ben,6,5);await ann.until(c=>c.of('join').length>=1);
  const refusals=()=>ann.of('chat-refused');
  ann.send({t:'chat',text:'go to http://spam.example'});await ann.until(c=>refusals().length>=1);assert.match(refusals()[0].reason,/Links/);
  ann.send({t:'chat',text:'x'.repeat(300)});await ann.until(c=>refusals().length>=2);
  ann.send({t:'chat',text:'one'});await ann.until(c=>c.of('chat').length>=1);
  ann.send({t:'chat',text:'one'});await ann.until(c=>refusals().length>=3);assert.match(refusals()[2].reason,/just said that|Slow down/);
  await wait(800);for(let i=0;i<8;i++)ann.send({t:'chat',text:'m'+i});await ann.until(c=>refusals().some(r=>/too fast|paused/.test(r.reason)),4000);
  assert.ok(ben.of('chat').length<=5,'at most 5 lines in the window reach others: '+ben.of('chat').length);
  assert.ok(ben.of('chat').every(m=>!/http|x{50}/.test(m.text)));
  ann.ws.close();ben.ws.close();
 }finally{await hub.close();}
});
test('mute/block: an ignored player\'s chat is not delivered; unmuting restores it; others still hear them',async()=>{
 const w=world(),hub=await boot(w);
 try{
  const ann=await join(hub,w.accounts.ann),ben=await join(hub,w.accounts.ben,6,5),cy=await join(hub,w.accounts.cy,7,5);await cy.until(c=>c.of('welcome').length&&c.of('welcome')[0].peers.length===2);
  const annId=ann.of('welcome')[0].you;ben.send({t:'ignore',id:annId,on:true});await wait(150);
  ann.send({t:'chat',text:'can anyone hear me'});await cy.until(c=>c.of('chat').length>=1);await wait(200);assert.equal(ben.of('chat').length,0,'the muting player hears nothing');assert.equal(cy.of('chat').length,1);
  ben.send({t:'ignore',id:annId,on:false});await wait(150);await wait(800);ann.send({t:'chat',text:'now?'});await ben.until(c=>c.of('chat').length>=1);assert.equal(ben.of('chat')[0].text,'now?');
  ben.send({t:'ignore',id:'zzzzzzzzzzzz',on:true});await ben.until(c=>c.of('refused').length>=1);   // not a valid id: invalid message
  for(const c of [ann,ben,cy])c.ws.close();
 }finally{await hub.close();}
});
test('report: goes to the hub log with reason, names and the reported player\'s recent lines; rate limited; unknown players refused',async()=>{
 const w=world(),logs=[],hub=await boot(w,{},logs);
 try{
  const ann=await join(hub,w.accounts.ann),ben=await join(hub,w.accounts.ben,6,5);await ann.until(c=>c.of('join').length>=1);
  const annId=ann.of('welcome')[0].you;ann.send({t:'chat',text:'rude words'});await ben.until(c=>c.of('chat').length>=1);
  ben.send({t:'report',id:annId,reason:'harassment',note:'was rude <b>to me</b>'});await ben.until(c=>c.of('reported').length);
  const line=logs.find(l=>/REPORT /.test(l));assert.ok(line);const r=JSON.parse(line.slice(line.indexOf('REPORT ')+7));
  assert.equal(r.reason,'harassment');assert.equal(r.reporter.name,'Ben_K');assert.equal(r.target.uid,'uid-ann');assert.equal(r.target.name,'Ann_R');assert.equal(r.recentLines[0].text,'rude words');assert.ok(!/token/i.test(line),'no token in the log');
  ben.send({t:'report',id:annId,reason:'spam'});await ben.until(c=>c.of('report-refused').length);assert.match(ben.of('report-refused')[0].reason,/wait/);
  ben.send({t:'report',id:'0123456789ab',reason:'spam'});ben.send({t:'report',id:annId,reason:'made-up'});await ben.until(c=>c.of('refused').length>=1);
  ann.send({t:'report',id:ann.of('welcome')[0].you,reason:'spam'});await ann.until(c=>c.of('report-refused').length);   // cannot report yourself
  for(const c of [ann,ben])c.ws.close();
 }finally{await hub.close();}
});
test('duplicate sessions: a second window replaces the first; no ghost avatar; chat is not duplicated',async()=>{
 const w=world(),hub=await boot(w);
 try{
  const ben=await join(hub,w.accounts.ben,6,5),ann1=await join(hub,w.accounts.ann,5,5);await ben.until(c=>c.of('join').length>=1);
  const ann2=await join(hub,w.accounts.ann,5,5);await ann1.until(c=>c.closed===4001);assert.equal(hub.hub.roomPeers('district-interior').length,2);
  ann2.send({t:'chat',text:'only once'});await ben.until(c=>c.of('chat').length>=1);await wait(200);assert.equal(ben.of('chat').length,1);
  ann2.ws.close();await ben.until(c=>c.of('leave').length>=1);ben.ws.close();
 }finally{await hub.close();}
});
test('hub outage: clients get a clean close and the process keeps no state that blocks a restart',async()=>{
 const w=world();let hub=await boot(w);const ann=await join(hub,w.accounts.ann);assert.equal(ann.of('welcome').length,1);
 await hub.close();await ann.until(c=>c.closed);assert.ok([1012,1006,1005].includes(ann.closed));
 hub=await boot(w);try{const ann2=await join(hub,w.accounts.ann);assert.equal(ann2.of('welcome').length,1,'rejoins after a restart');ann2.ws.close();}finally{await hub.close();}
});
