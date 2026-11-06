/* The production hub (HUB_MODE=production) over real WebSockets with no network and no emulator: signed test tokens, an in-process
   fake of the game API. Needs `ws` (npm install). Run: node --test tests/district-hub-prod-ws.cjs */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),http=require('node:http');
const WebSocket=require('ws'),{main}=require('../tools/district-hub/server.cjs'),{makeWorld}=require('./helpers/hub-fixtures.cjs');

const ORIGIN='https://thedarknetdistrict.com';
const world=()=>makeWorld({
 fox:{uid:'uid-fox',model:'district-resident',handle:'Neon_Fox'},bolt:{uid:'uid-bolt',model:'district-smuggler',handle:'Bolt_9'},
 guest:{uid:'uid-guest',provider:'anonymous'},stranger:{uid:'uid-stranger',model:'district-smuggler',handle:'Stranger'},banned:{uid:'uid-banned',model:'district-smuggler'}});
async function boot(w,extra={}){
 const env={HUB_MODE:'production',HUB_API_BASE:'https://api.test',HUB_ALLOWED_UIDS:'uid-fox,uid-bolt,uid-guest,uid-banned',HUB_DENY_UIDS:'uid-banned',PORT:'0',HUB_MAX_PER_IP:'4',...extra};
 return main(env,{fetchJwks:w.fetchJwks,fetchImpl:w.fetchImpl,quiet:true});
}
class C{
 constructor(hub,origin=ORIGIN){this.msgs=[];this.closed=null;this.ws=new WebSocket(`ws://127.0.0.1:${hub.port}`,origin===null?{}:{origin});this.ws.on('message',d=>{this.msgs.push(JSON.parse(d));this.wake?.();});this.ws.on('close',c=>{this.closed=c;this.wake?.();});this.ws.on('error',()=>{this.err=true;this.wake?.();});this.open=new Promise(r=>this.ws.on('open',r));}
 send(o){this.ws.send(JSON.stringify(o));}
 async until(fn,ms=4000){const end=Date.now()+ms;for(;;){const v=fn(this);if(v)return v;if(Date.now()>end)throw new Error('timeout '+JSON.stringify(this.msgs).slice(0,300)+' closed='+this.closed);await new Promise(r=>{this.wake=r;setTimeout(r,40);});}}
 of(t){return this.msgs.filter(m=>m.t===t);}
}
const join=async(hub,acct,x=5,z=5)=>{const c=new C(hub);await c.open;c.send({t:'hello',token:acct.token,room:'district-interior'});await c.until(c=>c.of('welcome').length||c.closed);if(c.of('welcome').length)c.send({t:'state',x,z,yaw:0});return c;};

test('allowed accounts join; each sees the other with the API-stored character and handle; a guest gets a guest name',async()=>{
 const w=world(),hub=await boot(w);
 try{
  const fox=await join(hub,w.accounts.fox),bolt=await join(hub,w.accounts.bolt,6,5),guest=await join(hub,w.accounts.guest,7,5);
  await fox.until(c=>c.of('join').length>=2);
  const seen=Object.fromEntries(fox.of('join').map(m=>[m.peer.name.replace(/-[0-9a-f]{4}$/,'-'),m.peer.model]));
  assert.equal(seen['Bolt_9'],'district-smuggler');assert.equal(seen['Guest-'],'district-smuggler','a guest cannot claim a character');
  assert.equal(bolt.of('welcome')[0].peers.find(p=>p.name==='Neon_Fox').model,'district-resident');
  assert.deepEqual(w.calls.filter(([,t])=>t===w.accounts.guest.token).map(c=>c[0]),['/api/identity/me'],'a guest is never looked up for a character');
  assert(w.calls.every(([,t])=>Object.values(w.accounts).some(a=>a.token===t)),'the hub only ever forwards a player\'s own token');
  for(const c of [fox,bolt,guest])c.ws.close();
 }finally{await hub.close();}
});

test('the allow-list, deny-list, origin and sign-in checks are enforced on the verified account',async()=>{
 const w=world(),hub=await boot(w);
 try{
  const s=new C(hub);await s.open;s.send({t:'hello',token:w.accounts.stranger.token,room:'district-interior'});await s.until(c=>c.closed);assert.equal(s.closed,4403,'a valid account that is not on the list');
  const b=new C(hub);await b.open;b.send({t:'hello',token:w.accounts.banned.token,room:'district-interior'});await b.until(c=>c.closed);assert.equal(b.closed,4403,'the deny-list wins over the allow-list');
  const f=new C(hub);await f.open;f.send({t:'hello',token:'forged.token.value',room:'district-interior'});await f.until(c=>c.closed);assert.equal(f.closed,4401);
  const t=w.accounts.fox.token.split('.');t[1]=Buffer.from(JSON.stringify({...JSON.parse(Buffer.from(t[1],'base64url')),sub:'uid-bolt'})).toString('base64url');
  const x=new C(hub);await x.open;x.send({t:'hello',token:t.join('.'),room:'district-interior'});await x.until(c=>c.closed);assert.equal(x.closed,4401,'a token edited to claim another account fails its signature');
  for(const origin of ['https://evil.example','http://thedarknetdistrict.com',null]){const o=new C(hub,origin);await new Promise(r=>setTimeout(r,300));assert.notEqual(o.ws.readyState,1,'origin '+origin+' refused');o.ws.terminate();}
  assert.equal(hub.hub.peers.size,0);
 }finally{await hub.close();}
});

test('a hello that names an identity, and any extra field in a state message, is refused',async()=>{
 const w=world(),hub=await boot(w);
 try{
  const a=await join(hub,w.accounts.fox);
  for(const bad of [{t:'state',x:1,z:1,yaw:0,uid:'uid-bolt'},{t:'state',x:1,z:1,yaw:0,name:'Admin'},{t:'state',x:1,z:1,yaw:0,model:'admin'},{t:'hello',token:w.accounts.bolt.token,room:'district-interior'}])a.send(bad);
  await a.until(c=>c.of('refused').length>=3);assert.equal(hub.hub.peers.size,1);assert.equal([...hub.hub.peers.values()][0].name,'Neon_Fox');a.ws.close();
 }finally{await hub.close();}
});

test('connection limits, health check and orderly restart',async()=>{
 const w=world(),hub=await boot(w);
 try{
  const clients=[];for(let i=0;i<4;i++){const c=new C(hub);await c.open;clients.push(c);}
  const fifth=new C(hub);await fifth.until(c=>c.closed);assert.equal(fifth.closed,4006,'a fifth connection from one address is refused');
  const health=await new Promise(r=>http.get(`http://127.0.0.1:${hub.port}/health`,res=>{let b='';res.on('data',d=>b+=d);res.on('end',()=>r({status:res.statusCode,body:JSON.parse(b)}));}));
  assert.equal(health.status,200);assert.deepEqual(health.body,{ok:true,players:0},'the health page reveals a count only');
  assert.equal((await new Promise(r=>http.get(`http://127.0.0.1:${hub.port}/anything`,res=>r(res.statusCode)))),404);
  for(const c of clients)c.ws.close();await new Promise(r=>setTimeout(r,300));   // the address's slots are free again
  const a=await join(hub,w.accounts.fox);await hub.close();await a.until(c=>c.closed);assert.equal(a.closed,1012,'clients are told the service is restarting');
 }finally{await hub.close().catch(()=>{});}
});

test('duplicate sessions, drops and reconnects through the production path',async()=>{
 const w=world(),hub=await boot(w);
 try{
  const a1=await join(hub,w.accounts.fox),b=await join(hub,w.accounts.bolt,6,5);await b.until(c=>c.of('welcome').length);
  const a2=await join(hub,w.accounts.fox,7,5);await a1.until(c=>c.closed===4001);assert.equal(hub.hub.peers.size,2);
  await b.until(c=>c.of('leave').length===1&&c.of('join').length===1);
  a2.ws.terminate();await b.until(c=>c.of('leave').length===2);assert.equal(hub.hub.peers.size,1);
  const a3=await join(hub,w.accounts.fox);await b.until(c=>c.of('join').length===2);assert.equal(hub.hub.peers.size,2);
  a3.ws.close();b.ws.close();
 }finally{await hub.close();}
});

test('appearance: two authenticated players see each other\'s saved look; invalid ids fall back; a wardrobe refresh updates nearby players',async()=>{
 const A=require('../void-runner/character-appearance.js');
 const look=(l,extra={})=>({...A.defaults(l),...extra});
 const w=makeWorld({
  fox:{uid:'uid-fox',model:'district-resident',handle:'Neon_Fox',appearance:look('ncz-neon',{hair:'ponytail01',hairColor:'cyan',clothingColor:'crimson'})},
  bolt:{uid:'uid-bolt',model:'district-smuggler',handle:'Bolt_9'},
  evil:{uid:'uid-evil',model:'district-smuggler',handle:'Evil_1',appearance:{v:1,base:'male',look:'../../x',hair:'native',hairColor:null,clothingColor:null,accessories:[]}}});
 const hub=await main({HUB_MODE:'production',HUB_API_BASE:'https://api.test',HUB_ALLOWED_UIDS:'uid-fox,uid-bolt,uid-evil',PORT:'0',HUB_MAX_PER_IP:'4'},{fetchJwks:w.fetchJwks,fetchImpl:w.fetchImpl,quiet:true});
 try{
  const bolt=await join(hub,w.accounts.bolt,6,5),fox=await join(hub,w.accounts.fox,5,5),evil=await join(hub,w.accounts.evil,7,5);
  await bolt.until(c=>c.of('join').length>=2);
  const f=bolt.of('join').map(m=>m.peer).find(p=>p.name==='Neon_Fox'),e=bolt.of('join').map(m=>m.peer).find(p=>p.name==='Evil_1');
  assert.equal(f.model,'ncz-neon');assert.equal(f.appearance.hair,'ponytail01');assert.equal(f.appearance.clothingColor,'crimson');
  assert.equal(e.model,'district-smuggler');assert.deepEqual(e.appearance,A.defaults('district-smuggler'),'an invalid saved look falls back to the safe default');
  // legacy account without an appearance: shown with the look matching its old character, unchanged
  assert.equal(fox.of('welcome')[0].peers.find(p=>p.name==='Bolt_9').appearance.look,'district-smuggler');
  // the wardrobe: Fox saves a new look (the API now returns it) and refreshes; Bolt is told once
  w.accounts.fox.appearance=look('fixer-01',{hair:'bob01',hairColor:'violet'});
  fox.send({t:'refresh',token:w.accounts.fox.token});
  const ev=await bolt.until(c=>c.of('look')[0]);assert.equal(ev.model,'fixer-01');assert.equal(ev.appearance.hairColor,'violet');
  // too soon again: refused; nobody else may refresh for them (identity is the token's account)
  fox.send({t:'refresh',token:w.accounts.fox.token});await fox.until(c=>c.of('refused').some(m=>/too many/.test(m.reason)));
  bolt.send({t:'refresh',token:w.accounts.fox.token});await bolt.until(c=>c.of('refused').some(m=>/sign-in/.test(m.reason)));
  // no client may send a model or appearance of its own
  const before=bolt.of('look').length;bolt.send({t:'state',x:6,z:5,yaw:0,appearance:{}});await new Promise(r=>setTimeout(r,200));assert.equal(fox.of('look').length,0);assert.equal(bolt.of('look').length,before);
  for(const c of [fox,bolt,evil])c.ws.close();
 }finally{await hub.close();}
});

test('appearance: reconnect restores the saved look, one avatar per account, delayed/repeated changes settle on the latest, no ghosts',async()=>{
 const A=require('../void-runner/character-appearance.js'),look=(l,x={})=>({...A.defaults(l),...x});
 const w=makeWorld({fox:{uid:'uid-fox',model:'district-resident',handle:'Neon_Fox',appearance:look('ncz-neon',{hair:'long01'})},bolt:{uid:'uid-bolt',model:'district-smuggler',handle:'Bolt_9'}});
 let clock=1e6;const hub=await main({HUB_MODE:'production',HUB_API_BASE:'https://api.test',HUB_ALLOWED_UIDS:'uid-fox,uid-bolt',PORT:'0',HUB_MAX_PER_IP:'6'},{fetchJwks:w.fetchJwks,fetchImpl:w.fetchImpl,quiet:true});
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 try{
  const bolt=await join(hub,w.accounts.bolt,6,5);let fox=await join(hub,w.accounts.fox,5,5);
  await bolt.until(c=>c.of('join').length>=1);
  assert.equal(bolt.of('join')[0].peer.appearance.hair,'long01');
  // Fox disconnects: Bolt sees exactly one leave. Meanwhile Fox's saved look changes (made on another device).
  fox.ws.close();await bolt.until(c=>c.of('leave').length===1);
  w.accounts.fox.appearance=look('fixer-01',{hair:'bob02',hairColor:'brown'});
  fox=await join(hub,w.accounts.fox,5,5);await bolt.until(c=>c.of('join').length===2);
  const back=bolt.of('join')[1].peer;assert.equal(back.appearance.look,'fixer-01','reconnecting restores the latest saved look');assert.equal(back.id,bolt.of('join')[0].peer.id,'same public id, no duplicate identity');
  assert.equal(hub.hub.roomPeers('district-interior').length,2,'exactly two avatars in the room');
  // a second window for the same account replaces the first: still one avatar
  const fox2=await join(hub,w.accounts.fox,5,5);await fox.until(c=>c.closed===4001||c.ws.readyState>1);
  assert.equal(hub.hub.roomPeers('district-interior').length,2);
  // repeated changes: only the first is applied immediately, the rest are refused (rate limit); a later refresh picks up the newest saved look
  w.accounts.fox.appearance=look('hacker-01',{base:'male',hair:'short01'});w.accounts.fox.appearance.base='male';
  fox2.send({t:'refresh',token:w.accounts.fox.token});await bolt.until(c=>c.of('look').length>=1);
  for(const i of [1,2,3]){fox2.send({t:'refresh',token:w.accounts.fox.token});await fox2.until(c=>c.of('refused').filter(m=>/too many/.test(m.reason)).length>=i);}   // one at a time: the hub also ignores a refresh while one is still being checked
  assert.equal(bolt.of('look').length,1,'refused refreshes broadcast nothing');
  w.accounts.fox.appearance=look('regular-01',{base:'male',hair:'short03'});
  hub.hub.byConn.forEach(p=>{p.lastRefresh=-Infinity;});   // time passes
  fox2.send({t:'refresh',token:w.accounts.fox.token});await bolt.until(c=>c.of('look').length===2);assert.equal(bolt.of('look')[1].appearance.look,'regular-01');
  // leaving leaves no ghost, and a refresh from a connection that is gone does nothing
  fox2.ws.close();await bolt.until(c=>c.of('leave').length===2);await wait(100);assert.equal(hub.hub.roomPeers('district-interior').length,1);
  bolt.ws.close();
 }finally{await hub.close();}
});

test('a slow look refresh keeps the verified session and ignores a concurrent refresh',async()=>{
 const A=require('../void-runner/character-appearance.js');
 const w=makeWorld({fox:{uid:'uid-fox',model:'district-resident',appearance:A.defaults('district-resident')},bolt:{uid:'uid-bolt',model:'district-smuggler'}});
 let hold=false,release=null;
 const fetchImpl=async(url,options)=>{
  if(hold&&url.endsWith('/api/void-runner/character'))await new Promise(resolve=>{release=resolve;});
  return w.fetchImpl(url,options);
 };
 const hub=await main({HUB_MODE:'production',HUB_API_BASE:'https://api.test',HUB_ALLOWED_UIDS:'uid-fox,uid-bolt',PORT:'0'},
  {fetchJwks:w.fetchJwks,fetchImpl,quiet:true});
 try{
  const fox=await join(hub,w.accounts.fox),bolt=await join(hub,w.accounts.bolt,6,5);
  await bolt.until(c=>c.of('welcome').length&&hub.hub.peers.size===2);
  w.accounts.fox.appearance={...A.defaults('district-resident'),hair:'bob01'};
  hold=true;fox.send({t:'refresh',token:w.accounts.fox.token});
  await fox.until(()=>release);
  fox.send({t:'refresh',token:w.accounts.bolt.token}); // ignored while the first identity check is pending
  release();hold=false;
  await bolt.until(c=>c.of('look').length===1);
  assert.equal(bolt.of('look')[0].appearance.hair,'bob01');
  assert.equal(hub.hub.peers.size,2,'neither a slow API nor a concurrent message duplicates a player');
  assert.equal(fox.of('refused').length,0,'current busy behaviour is silent; document this limitation');
  fox.ws.close();bolt.ws.close();
 }finally{release?.();await hub.close();}
});
