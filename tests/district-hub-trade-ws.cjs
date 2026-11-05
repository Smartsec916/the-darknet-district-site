/* Player-to-player trading over real WebSockets: two or three authenticated test players (signed test tokens, fake game API), the hub in production
   mode, and a SIMULATED ledger injected by the test (a production hub refuses a ledger and has trading disabled). Needs `ws`.
   Run: node --test tests/district-hub-trade-ws.cjs */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),WebSocket=require('ws');
const {main}=require('../tools/district-hub/server.cjs'),{makeWorld}=require('./helpers/hub-fixtures.cjs'),{SimulatedLedger}=require('../tools/district-hub/ledger.cjs');

const ORIGIN='https://thedarknetdistrict.com';
const world=()=>makeWorld({fox:{uid:'uid-fox',model:'district-resident',handle:'Neon_Fox'},bolt:{uid:'uid-bolt',model:'district-smuggler',handle:'Bolt_9'},ivy:{uid:'uid-ivy',model:'district-resident',handle:'Ivy_Net'}});
const inv=()=>({'uid-fox':{credits:500,stacks:{'scrap-plate':10,'med-gel':3},equipment:['pulse1-aa01']},'uid-bolt':{credits:200,stacks:{'drive-coil':4},equipment:['vector-bb01']},'uid-ivy':{credits:50,stacks:{},equipment:[]}});
async function boot(w,{ledger=new SimulatedLedger({inventories:inv()}),env={}}={}){
 const hub=await main({HUB_MODE:'production',HUB_API_BASE:'https://api.test',HUB_ALLOWED_UIDS:'uid-fox,uid-bolt,uid-ivy',PORT:'0',...env},{fetchJwks:w.fetchJwks,fetchImpl:w.fetchImpl,quiet:true,ledger,allowTestLedger:true});
 return {hub,ledger};
}
class C{
 constructor(hub){this.msgs=[];this.closed=null;this.ws=new WebSocket(`ws://127.0.0.1:${hub.port}`,{origin:ORIGIN});this.ws.on('message',d=>{this.msgs.push(JSON.parse(d));this.wake?.();});this.ws.on('close',c=>{this.closed=c;this.wake?.();});this.ws.on('error',()=>{});this.open=new Promise(r=>this.ws.on('open',r));}
 send(o){this.ws.send(JSON.stringify(o));}
 trade(op,more={}){this.send({t:'trade',op,...more});}
 async until(fn,ms=4000){const end=Date.now()+ms;for(;;){const v=fn(this);if(v)return v;if(Date.now()>end)throw new Error('timeout; last '+JSON.stringify(this.msgs.slice(-4)).slice(0,500)+' closed='+this.closed);await new Promise(r=>{this.wake=r;setTimeout(r,30);});}}
 ev(name){return this.msgs.filter(m=>m.t==='trade'&&m.ev===name);}
 last(name){return this.ev(name).at(-1);}
 count(name){return this.ev(name).length;}
}
const join=async(hub,acct,x=5,z=5)=>{const c=new C(hub);await c.open;c.send({t:'hello',token:acct.token,room:'district-interior'});await c.until(c=>c.msgs.some(m=>m.t==='welcome')||c.closed);c.send({t:'state',x,z,yaw:0});c.id=c.msgs.find(m=>m.t==='welcome').you;return c;};
const pair=async(w,hub,xb=6.5)=>{const a=await join(hub,w.accounts.fox),b=await join(hub,w.accounts.bolt,xb,5);
 await a.until(c=>c.msgs.some(m=>m.t==='join'));await b.until(c=>c.msgs.some(m=>m.t==='welcome'));await new Promise(r=>setTimeout(r,200));   // each is placed and known to the hub
 const bid=a.msgs.find(m=>m.t==='join').peer.id,aid=b.msgs.find(m=>m.t==='welcome').peers[0].id;return {a,b,aid,bid};};
const open=async(w,hub)=>{const p=await pair(w,hub);p.a.trade('request',{to:p.bid});await p.b.until(c=>c.count('incoming'));p.b.trade('accept');await p.a.until(c=>c.count('open'));await p.b.until(c=>c.count('open'));return p;};

test('trading is announced only when a ledger is attached; the production default has it off and refuses every message',async()=>{
 const w=world(),{hub}=await boot(w,{ledger:null});
 try{const {a,b,bid}=await pair(w,hub);
  assert.equal(a.msgs.find(m=>m.t==='welcome').features.trade,false);
  a.trade('request',{to:bid});await a.until(c=>c.count('refused'));assert.match(a.last('refused').reason,/not enabled/);assert.equal(b.count('incoming'),0);
  a.trade('offer',{v:0,credits:5,stacks:[],equipment:[]});await a.until(c=>c.count('refused')>=2);
  a.ws.close();b.ws.close();
 }finally{await hub.close();}
});

test('a full trade between two authenticated players: request, accept, offer, confirm, done',async()=>{
 const w=world(),{hub,ledger}=await boot(w);
 try{const {a,b}=await open(w,hub),t0=JSON.stringify(ledger.totals());
  assert.equal(a.msgs.find(m=>m.t==='welcome').features.trade,true);assert.equal(a.last('open').with.name,'Bolt_9');assert.equal(b.last('open').with.name,'Neon_Fox');assert.equal(a.last('open').simulated,true);
  assert.equal(a.last('open').inventory.credits,500,'each player is shown only their own server-side inventory');assert.equal(b.last('open').inventory.credits,200);
  a.trade('offer',{v:0,credits:100,stacks:[{id:'scrap-plate',qty:4}],equipment:['pulse1-aa01']});await b.until(c=>c.last('update')?.v===1);
  assert.equal(b.last('update').theirs.equipment[0].name,'Pulse cannon Mk I');
  b.trade('offer',{v:1,credits:20,stacks:[{id:'drive-coil',qty:2}],equipment:[]});await a.until(c=>c.last('update')?.v===2);
  a.trade('confirm',{v:2});await b.until(c=>c.last('update')?.confirmed.them===true);b.trade('confirm',{v:2});
  await a.until(c=>c.count('done'));await b.until(c=>c.count('done'));
  assert.equal(a.last('done').got.credits,20);assert.equal(b.last('done').got.credits,100);
  assert.equal((await ledger.snapshot('uid-fox')).credits,420);assert.equal((await ledger.snapshot('uid-bolt')).credits,280);assert(!(await ledger.snapshot('uid-fox')).equipment.includes('pulse1-aa01'));
  assert.equal(JSON.stringify(ledger.totals()),t0);assert.equal(ledger.log.at(-1).outcome,'completed');await a.until(c=>c.count('inventory'));
  a.ws.close();b.ws.close();
 }finally{await hub.close();}
});

test('walking away, disconnecting, cancelling and declining each end the trade without moving anything',async()=>{
 const w=world(),{hub,ledger}=await boot(w);
 try{
  const t0=JSON.stringify(ledger.totals());
  let p=await open(w,hub);p.a.trade('offer',{v:0,credits:10,stacks:[],equipment:[]});await p.b.until(c=>c.last('update')?.v===1);
  p.b.send({t:'state',x:12,z:5,yaw:0});await p.a.until(c=>c.count('cancelled'));assert.match(p.a.last('cancelled').reason,/walked away/);await p.b.until(c=>c.count('cancelled'));
  p.a.ws.close();p.b.ws.close();await new Promise(r=>setTimeout(r,200));
  p=await open(w,hub);p.b.ws.terminate();await p.a.until(c=>c.count('cancelled'));assert.match(p.a.last('cancelled').reason,/left/);p.a.ws.close();await new Promise(r=>setTimeout(r,200));
  p=await open(w,hub);p.a.trade('cancel');await p.b.until(c=>c.count('cancelled'));assert.match(p.b.last('cancelled').reason,/cancelled/);p.a.ws.close();p.b.ws.close();await new Promise(r=>setTimeout(r,200));
  p=await pair(w,hub);p.a.trade('request',{to:p.bid});await p.b.until(c=>c.count('incoming'));p.b.trade('decline');await p.a.until(c=>c.count('cancelled'));assert.match(p.a.last('cancelled').reason,/declined/);
  p.a.trade('request',{to:p.bid});await p.a.until(c=>c.count('refused'));assert.match(p.a.last('refused').reason,/Wait/);p.a.ws.close();p.b.ws.close();
  assert.equal(JSON.stringify(ledger.totals()),t0);assert.equal(ledger.log.length,0,'no settlement was even attempted');
 }finally{await hub.close();}
});

test('players too far apart cannot start a trade; a third player cannot barge in; a trade partner reconnecting ends the old session',async()=>{
 const w=world(),{hub}=await boot(w);
 try{
  const a=await join(hub,w.accounts.fox),far=await join(hub,w.accounts.bolt,30,5),near=await join(hub,w.accounts.ivy,5.5,5);
  await a.until(c=>c.msgs.filter(m=>m.t==='join').length>=2);await new Promise(r=>setTimeout(r,200));
  const farId=a.msgs.filter(m=>m.t==='join').find(m=>m.peer.name==='Bolt_9').peer.id,nearId=a.msgs.filter(m=>m.t==='join').find(m=>m.peer.name==='Ivy_Net').peer.id;
  a.trade('request',{to:farId});await a.until(c=>c.count('refused'));assert.match(a.last('refused').reason,/closer/);
  a.trade('request',{to:nearId});await near.until(c=>c.count('incoming'));
  far.send({t:'state',x:6,z:5,yaw:0});await new Promise(r=>setTimeout(r,200));   // bolt walks up, asks ivy, who is already being asked
  const ivyId=far.msgs.filter(m=>m.t==='join'||m.t==='welcome').flatMap(m=>m.peers||[m.peer]).find(p=>p.name==='Ivy_Net').id;
  far.trade('request',{to:ivyId});await far.until(c=>c.count('refused'));assert.match(far.last('refused').reason,/busy/);
  near.trade('accept');await a.until(c=>c.count('open'));
  const a2=await join(hub,w.accounts.fox,5,5);await a.until(c=>c.closed===4001);await near.until(c=>c.count('cancelled'));assert.match(near.last('cancelled').reason,/left/);
  for(const c of [a2,far,near])c.ws.close();
 }finally{await hub.close();}
});

test('malformed, oversized, forged and replayed trade messages are refused or ignored; nothing changes',async()=>{
 const w=world(),{hub,ledger}=await boot(w);
 try{
  const {a,b,aid}=await open(w,hub),snap=JSON.stringify(ledger.totals());
  a.send({t:'trade',op:'offer',v:0,credits:5,stacks:[],equipment:[],uid:'uid-bolt'});a.send({t:'trade',op:'steal'});a.send({t:'trade',op:'confirm',v:'x'});a.send({t:'trade'});
  await a.until(c=>c.msgs.filter(m=>m.t==='refused').length>=4);   // refused at the door: not a valid message at all
  a.send({t:'trade',op:'offer',v:0,credits:5,stacks:Array(60).fill({id:'scrap-plate',qty:1}),equipment:[]});await a.until(c=>c.msgs.filter(m=>m.t==='refused').length>=5);   // over the trade size limit
  const big=await join(hub,w.accounts.ivy,5.2,5);big.send({t:'trade',op:'offer',v:0,credits:5,stacks:Array(600).fill({id:'scrap-plate',qty:1}),equipment:[]});await big.until(c=>c.closed);assert.equal(big.closed,1009,'a frame far over the limit closes the connection');
  a.trade('offer',{v:0,credits:99999,stacks:[],equipment:[]});await a.until(c=>c.count('refused')>=1);assert.match(a.last('refused').reason,/not enough credits/);
  a.trade('offer',{v:0,credits:0,stacks:[{id:'contract-seal',qty:1}],equipment:[]});await a.until(c=>c.count('refused')>=2);assert.match(a.last('refused').reason,/Restricted/);
  a.trade('offer',{v:0,credits:0,stacks:[],equipment:['vector-bb01']});await a.until(c=>c.count('refused')>=3);assert.match(a.last('refused').reason,/not owned/,'bolt\'s equipment cannot be offered by fox');
  a.trade('offer',{v:0,credits:50,stacks:[],equipment:[]});await b.until(c=>c.last('update')?.v===1);
  a.trade('offer',{v:0,credits:60,stacks:[],equipment:[]});await a.until(c=>c.last('refused')?.reason==='Your view was out of date.');   // a replay of an old version is refused
  a.trade('confirm',{v:0});await a.until(c=>/changed/.test(c.last('refused').reason));
  a.trade('request',{to:aid});await a.until(c=>c.last('refused')?.reason==='You are already in a trade.');
  assert.equal(JSON.stringify(ledger.totals()),snap);assert.equal(ledger.log.length,0);
  a.ws.close();b.ws.close();
 }finally{await hub.close();}
});

test('a failed settlement tells both players, moves nothing, and the ledger keeps working',async()=>{
 const w=world(),{hub,ledger}=await boot(w);
 try{
  const {a,b}=await open(w,hub),before=JSON.stringify([await ledger.snapshot('uid-fox'),await ledger.snapshot('uid-bolt')]);
  a.trade('offer',{v:0,credits:100,stacks:[],equipment:[]});await b.until(c=>c.last('update')?.v===1);b.trade('offer',{v:1,credits:0,stacks:[{id:'drive-coil',qty:1}],equipment:[]});await a.until(c=>c.last('update')?.v===2);
  ledger.fault='between-writes';a.trade('confirm',{v:2});await b.until(c=>c.last('update')?.confirmed.them);b.trade('confirm',{v:2});
  await a.until(c=>c.count('failed'));await b.until(c=>c.count('failed'));assert.match(a.last('failed').reason,/Nothing was changed/);
  assert.equal(JSON.stringify([await ledger.snapshot('uid-fox'),await ledger.snapshot('uid-bolt')]),before);
  a.trade('request',{to:a.msgs.find(m=>m.t==='join').peer.id});await b.until(c=>c.count('incoming'));
  a.ws.close();b.ws.close();
 }finally{await hub.close();}
});

test('two trades racing for the same item: only one can complete',async()=>{
 const w=world(),{hub,ledger}=await boot(w);
 try{
  const a=await join(hub,w.accounts.fox),b=await join(hub,w.accounts.bolt,6,5),i=await join(hub,w.accounts.ivy,4.5,5);
  await a.until(c=>c.msgs.filter(m=>m.t==='join').length>=2);await new Promise(r=>setTimeout(r,200));
  const id=n=>a.msgs.filter(m=>m.t==='join').find(m=>m.peer.name===n).peer.id;
  // fox trades her pulse cannon with bolt; at the same moment the ledger sells it to ivy (as an NPC sale or another path would)
  a.trade('request',{to:id('Bolt_9')});await b.until(c=>c.count('incoming'));b.trade('accept');await a.until(c=>c.count('open'));
  a.trade('offer',{v:0,credits:0,stacks:[],equipment:['pulse1-aa01']});await b.until(c=>c.last('update')?.v===1);b.trade('offer',{v:1,credits:30,stacks:[],equipment:[]});await a.until(c=>c.last('update')?.v===2);
  a.trade('confirm',{v:2});await b.until(c=>c.last('update')?.confirmed.them);
  const sale=ledger.settle({tradeId:'e'.repeat(16),a:{uid:'uid-fox',offer:{credits:0,stacks:[],equipment:['pulse1-aa01']}},b:{uid:'uid-ivy',offer:{credits:10,stacks:[],equipment:[]}}});
  b.trade('confirm',{v:2});await sale;
  await a.until(c=>c.count('done')||c.count('failed'));const owners=[];for(const u of ['uid-fox','uid-bolt','uid-ivy'])if((await ledger.snapshot(u)).equipment.includes('pulse1-aa01'))owners.push(u);
  assert.equal(owners.length,1,'exactly one owner: '+owners);assert.equal(ledger.log.filter(x=>x.outcome==='completed').length,a.count('done')?2:1);
  for(const c of [a,b,i])c.ws.close();
 }finally{await hub.close();}
});
