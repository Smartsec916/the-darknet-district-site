const test=require('node:test'),assert=require('node:assert/strict');
const {TradeBook,parseTrade}=require('../tools/district-hub/trade.cjs'),{SimulatedLedger,DisabledLedger}=require('../tools/district-hub/ledger.cjs'),{INV,offer}=require('./helpers/ledger-contract.cjs');

function rig({ledger,inv=INV(),rules={},positions={}}={}){
 let now=1_000_000,n=0;const out=new Map(),peers=new Map();
 const ids={alice:'a1a1a1a1a1a1',bob:'b2b2b2b2b2b2',carol:'c3c3c3c3c3c3',dave:'d4d4d4d4d4d4'};
 for(const [uid,id] of Object.entries(ids))peers.set(uid,{uid,id,name:uid[0].toUpperCase()+uid.slice(1),room:'district-interior',x:0,z:0,placed:true,...(positions[uid]||{})});
 peers.get('bob').x=1.5;peers.get('carol').x=40;peers.get('dave').x=1;peers.get('dave').z=1;
 const led=ledger||new SimulatedLedger({inventories:inv,now:()=>now}),
  book=new TradeBook({ledger:led,peers:{byUid:u=>peers.get(u)||null,byPublicId:id=>[...peers.values()].find(p=>p.id===id)||null},send:(u,m)=>{(out.get(u)||out.set(u,[]).get(u)).push(m);},
   now:()=>now,newId:()=>(++n).toString(16).padStart(16,'0'),simulated:true,rules});
 const evs=(u,ev)=>(out.get(u)||[]).filter(m=>m.ev===ev),last=(u,ev)=>evs(u,ev).at(-1);
 const say=(u,op,more={})=>book.handle(u,{t:'trade',op,...more});
 const move=(u,x,z=0)=>{const p=peers.get(u);p.x=x;p.z=z;book.onMove(u);};
 /* alice asks bob, bob accepts: an open session at version 0 */
 const open=async(a='alice',b='bob')=>{await say(a,'request',{to:ids[b]});await say(b,'accept');return book.sessionOf(a);};
 const o=(v,credits=0,stacks=[],equipment=[])=>({v,credits,stacks,equipment});
 return {book,led,peers,ids,out,evs,last,say,move,open,o,tick:ms=>{now+=ms;},msgs:()=>out};
}
const total=l=>JSON.stringify(l.totals());

test('a full trade: request, accept, both offer, both confirm, done',async()=>{
 const r=rig(),t0=total(r.led);
 await r.say('alice','request',{to:r.ids.bob});
 assert.equal(r.last('alice','requested').to.name,'Bob');assert.equal(r.last('bob','incoming').from.name,'Alice');
 await r.say('bob','accept');
 for(const u of ['alice','bob']){assert.equal(r.last(u,'open').simulated,true);assert(r.last(u,'open').inventory.credits>0);}
 assert.equal(r.last('alice','open').with.name,'Bob');
 await r.say('alice','offer',r.o(0,100,[{id:'scrap-plate',qty:4}],['pulse1-aa01']));
 assert.deepEqual(r.last('bob','update').theirs.stacks.map(s=>[s.name,s.qty]),[['Hull scrap',4]]);assert.equal(r.last('bob','update').theirs.equipment[0].name,'Pulse cannon Mk I');
 await r.say('bob','offer',r.o(1,20,[{id:'drive-coil',qty:2}]));
 const v=r.book.sessionOf('alice').v;
 await r.say('alice','confirm',{v});assert.equal(r.last('bob','update').confirmed.them,true);assert.equal(r.last('alice','update').confirmed.you,true);
 await r.say('bob','confirm',{v});
 assert.equal(r.last('alice','done').got.credits,20);assert.equal(r.last('bob','done').got.credits,100);
 assert.equal((await r.led.snapshot('alice')).credits,420);assert.equal((await r.led.snapshot('bob')).credits,280);assert(r.last('alice','inventory'));
 assert.equal(r.book.sessionOf('alice'),null);assert.equal(r.book.sessionOf('bob'),null);assert.equal(r.led.log.at(-1).outcome,'completed');assert.equal(total(r.led),t0);
});

test('a request needs players in the same place and close together',async()=>{
 const r=rig();
 await r.say('alice','request',{to:r.ids.carol});assert.match(r.last('alice','refused').reason,/closer/);
 r.peers.get('bob').room='nexus-hall';await r.say('alice','request',{to:r.ids.bob});assert.match(r.last('alice','refused').reason,/another location/);r.peers.get('bob').room='district-interior';
 await r.say('alice','request',{to:r.ids.alice});assert.match(r.last('alice','refused').reason,/not here/);
 await r.say('alice','request',{to:'ffffffffffff'});assert.match(r.last('alice','refused').reason,/not here/);
 r.peers.get('bob').placed=false;await r.say('alice','request',{to:r.ids.bob});assert.match(r.last('alice','refused').reason,/not here/);r.peers.get('bob').placed=true;
 r.peers.get('alice').placed=false;await r.say('alice','request',{to:r.ids.bob});assert.match(r.last('alice','refused').reason,/Not in the room/);
 assert.equal(r.book.sessions.size,0);
});

test('walking away, changing location, disconnecting or timing out cancels the trade for both',async()=>{
 let r=rig();await r.open();r.move('bob',9);assert.match(r.last('alice','cancelled').reason,/walked away/);assert(r.last('bob','cancelled'));assert.equal(r.book.sessions.size,0);
 r=rig();await r.open();r.move('bob',4);assert.equal(r.book.sessions.size,1,'a step back inside the release distance keeps it');r.move('bob',4.6);assert.equal(r.book.sessions.size,0);
 r=rig();await r.open();r.peers.get('bob').room='nexus-hall';r.book.onMove('bob');assert.match(r.last('alice','cancelled').reason,/location/);
 r=rig();await r.open();r.book.onLeave('bob');assert.match(r.last('alice','cancelled').reason,/Bob left/);assert.equal(r.book.sessionOf('alice'),null);
 r=rig();await r.say('alice','request',{to:r.ids.bob});r.book.onLeave('alice');assert.match(r.last('bob','cancelled').reason,/Alice left/);
 r=rig();await r.say('alice','request',{to:r.ids.bob});r.tick(31_000);r.book.sweep();assert.match(r.last('alice','cancelled').reason,/expired/);
 r=rig();await r.open();r.tick(301_000);r.book.sweep();assert.match(r.last('bob','cancelled').reason,/timed out/);
 r=rig();await r.say('alice','request',{to:r.ids.bob});r.move('alice',-6);assert.equal(r.book.sessions.size,0,'a request lapses when the asker leaves');
 r=rig();await r.open();await r.say('alice','offer',r.o(0,10));r.move('bob',9);assert.equal((await r.led.snapshot('alice')).credits,500,'nothing moved');
});

test('either player can cancel, decline works, and a declined player must wait before asking again',async()=>{
 let r=rig();await r.open();await r.say('bob','cancel');assert.match(r.last('alice','cancelled').reason,/Bob cancelled/);
 r=rig();await r.say('alice','request',{to:r.ids.bob});await r.say('alice','cancel');assert.match(r.last('bob','cancelled').reason,/Alice cancelled the request/);assert.equal(r.book.sessions.size,0);
 r=rig();await r.say('alice','request',{to:r.ids.bob});await r.say('bob','decline');assert.match(r.last('alice','cancelled').reason,/declined/);
 await r.say('alice','request',{to:r.ids.bob});assert.match(r.last('alice','refused').reason,/Wait/);r.tick(9000);await r.say('alice','request',{to:r.ids.bob});assert(r.last('bob','incoming'));
 await r.say('alice','cancel');await r.say('alice','cancel');assert.match(r.last('alice','refused').reason,/not in a trade/);
 await r.say('bob','accept');assert.match(r.last('bob','refused').reason,/no request/);
});

test('sessions never overlap',async()=>{
 const r=rig();await r.say('alice','request',{to:r.ids.bob});
 await r.say('dave','request',{to:r.ids.bob});assert.match(r.last('dave','refused').reason,/Bob is busy/);
 await r.say('dave','request',{to:r.ids.alice});assert.match(r.last('dave','refused').reason,/Alice is busy/);
 await r.say('alice','request',{to:r.ids.dave});assert.match(r.last('alice','refused').reason,/already in a trade/);
 await r.say('alice','accept');assert.match(r.last('alice','refused').reason,/no request/,'the asker cannot accept their own request');
 await r.say('bob','accept');await r.say('bob','request',{to:r.ids.dave});assert.match(r.last('bob','refused').reason,/already in a trade/);
 assert.equal(r.book.sessions.size,1);assert.equal(r.book.sessionOf('dave'),null);
 // two players asking each other at the same instant: the second is refused, there is one session
 const q=rig();await Promise.all([q.say('alice','request',{to:q.ids.bob}),q.say('bob','request',{to:q.ids.alice})]);assert.equal(q.book.sessions.size,1);
});

test('a changed offer cancels both confirmations, and a confirmation is bound to the version it saw',async()=>{
 const r=rig();await r.open();
 await r.say('alice','offer',r.o(0,50));await r.say('bob','offer',r.o(1,10));
 const v=r.book.sessionOf('alice').v;await r.say('alice','confirm',{v});assert.equal(r.last('alice','update').confirmed.you,true);
 await r.say('bob','offer',r.o(v,1000)).catch(()=>{});          // bob raises his offer beyond what he owns (200): refused, nothing changes
 assert.match(r.last('bob','refused').reason,/not enough credits/);assert.equal(r.book.sessionOf('alice').confirmed[ 'alice' ],true,'a refused change does not disturb the confirmation');
 await r.say('bob','offer',r.o(v,5));assert.equal(r.last('alice','update').confirmed.you,false,'a real change resets alice');assert.equal(r.last('alice','update').theirs.credits,5);
 await r.say('alice','confirm',{v});assert.match(r.last('alice','refused').reason,/changed/,'alice cannot confirm what she has not seen');
 const v2=r.book.sessionOf('alice').v;await r.say('bob','confirm',{v});assert.match(r.last('bob','refused').reason,/changed/);
 await r.say('bob','confirm',{v:v2});assert.equal(r.led.log.length,0,'one confirmation is not a trade');
 await r.say('alice','offer',r.o(v2,50));assert.equal(r.book.sessionOf('alice').confirmed.bob,undefined,'both reset again');
});

test('offers are checked against the ledger, never trusted',async()=>{
 const r=rig({rules:{perSecond:1000}});await r.open();
 const bad=[[r.o(0,501),/credits/],[r.o(0,0,[{id:'scrap-plate',qty:11}]),/enough/],[r.o(0,0,[],['vector-bb01']),/not owned/],[r.o(0,-1),/credits/],[r.o(0,1.5),/credits/],[r.o(0,0,[{id:'contract-seal',qty:1}]),/Restricted/],
  [r.o(0,0,[],['wraith-aa09']),/Purchased/],[r.o(0,0,[{id:'scrap-plate',qty:1},{id:'scrap-plate',qty:1}]),/duplicate/],[r.o(0,'5'),/credits/]];
 for(const [m,re] of bad){await r.say('alice','offer',m);assert.match(r.last('alice','refused').reason,re,JSON.stringify(m));}
 assert.equal(r.book.sessionOf('alice').v,0,'nothing was accepted');
 await r.say('alice','confirm',{v:0});assert.match(r.last('alice','refused').reason,/Nothing has been offered/);
});

test('if an offered item is gone by the time of confirmation, nothing moves and both are told',async()=>{
 const r=rig();await r.open();await r.say('alice','offer',r.o(0,0,[],['pulse1-aa01']));await r.say('bob','offer',r.o(1,20));
 const v=r.book.sessionOf('alice').v;
 await r.led.settle({tradeId:'f'.repeat(16),a:{uid:'alice',offer:offer({equipment:['pulse1-aa01']})},b:{uid:'dave',offer:offer({credits:5})}});   // alice sells it elsewhere in the meantime
 const before=total(r.led);await r.say('bob','confirm',{v});
 assert.match(r.last('bob','failed').reason,/Alice can no longer cover/);assert(r.last('alice','failed'));assert.equal(total(r.led),before);assert.equal(r.book.sessionOf('alice'),null);
});

test('a failure while settling leaves both players untouched and free to trade again',async()=>{
 const r=rig();await r.open();await r.say('alice','offer',r.o(0,100));await r.say('bob','offer',r.o(1,0,[{id:'drive-coil',qty:2}]));const v=r.book.sessionOf('alice').v,snap=[JSON.stringify(await r.led.snapshot('alice')),JSON.stringify(await r.led.snapshot('bob'))];
 r.led.fault='between-writes';await r.say('alice','confirm',{v});await r.say('bob','confirm',{v});
 assert.match(r.last('alice','failed').reason,/Nothing was changed/);assert(r.last('bob','failed'));
 assert.deepEqual([JSON.stringify(await r.led.snapshot('alice')),JSON.stringify(await r.led.snapshot('bob'))],snap);assert.equal(r.book.sessions.size,0);
 await r.open();assert.equal(r.book.sessions.size,1,'a fresh session starts normally');
});

test('repeated and replayed messages do nothing extra',async()=>{
 const r=rig();await r.open();await r.say('alice','offer',r.o(0,100));await r.say('bob','offer',r.o(1,0,[{id:'drive-coil',qty:1}]));const v=r.book.sessionOf('alice').v;
 await Promise.all([r.say('alice','confirm',{v}),r.say('alice','confirm',{v}),r.say('bob','confirm',{v}),r.say('bob','confirm',{v})]);
 assert.equal(r.led.log.filter(x=>x.outcome==='completed').length,1,'one completed trade');assert.equal((await r.led.snapshot('alice')).credits,400);
 await r.say('alice','confirm',{v});assert.match(r.last('alice','refused').reason,/no open trade/,'a replay after completion is refused');
 await r.say('bob','accept');await r.say('alice','offer',r.o(v,5));assert.match(r.last('alice','refused').reason,/no open trade/);assert.equal((await r.led.snapshot('alice')).credits,400);
});

test('with the production ledger (disabled) every trading message is refused and nothing can change',async()=>{
 const r=rig({ledger:new DisabledLedger()});assert.equal(r.book.enabled,false);
 for(const op of ['request','accept','decline','cancel','offer','confirm'])await r.say('alice',op,op==='request'?{to:r.ids.bob}:op==='offer'?o0():{});
 function o0(){return {v:0,credits:0,stacks:[],equipment:[]};}
 assert.equal(r.evs('alice','refused').length,6);assert(r.evs('alice','refused').every(m=>/not enabled/.test(m.reason)));assert.equal(r.book.sessions.size,0);
});

test('message flooding is limited',async()=>{
 const r=rig();for(let i=0;i<14;i++)await r.say('alice','cancel');assert(r.evs('alice','refused').some(m=>m.reason==='Slow down.'));
 r.tick(1100);await r.say('alice','cancel');assert.match(r.last('alice','refused').reason,/not in a trade/,'the limit resets');
});

test('trade messages must have exactly the expected shape',()=>{
 const ok=[{t:'trade',op:'request',to:'a1a1a1a1a1a1'},{t:'trade',op:'accept'},{t:'trade',op:'decline'},{t:'trade',op:'cancel'},{t:'trade',op:'confirm',v:3},{t:'trade',op:'offer',v:0,credits:5,stacks:[],equipment:[]}];
 for(const m of ok)assert.deepEqual(parseTrade(m),m);
 const bad=[null,[],'x',{t:'trade'},{t:'trade',op:'steal'},{t:'trade',op:'request'},{t:'trade',op:'request',to:'A1A1A1A1A1A1'},{t:'trade',op:'request',to:'a1a1a1a1a1a1',uid:'bob'},{t:'trade',op:'accept',extra:1},
  {t:'trade',op:'confirm',v:-1},{t:'trade',op:'confirm',v:1.5},{t:'trade',op:'confirm',v:'1'},{t:'trade',op:'offer',v:0,credits:5,stacks:[]},{t:'trade',op:'offer',v:0,credits:5,stacks:[],equipment:[],owner:'x'},{t:'chat',op:'accept'}];
 for(const m of bad)assert.equal(parseTrade(m),null,JSON.stringify(m));
});

test('fuzz: thousands of random actions never break the rules or the totals',async()=>{
 let seed=12345;const rnd=n=>{seed=(seed+0x6D2B79F5)|0;let t=Math.imul(seed^(seed>>>15),1|seed);t=(t+Math.imul(t^(t>>>7),61|t))^t;return Math.floor(((t^(t>>>14))>>>0)/4294967296*n);};   // mulberry32: a fixed seed, but properly mixed
 const r=rig({rules:{perSecond:1e9}}),users=['alice','bob','carol','dave'],t0=total(r.led);let completed=0;
 for(let i=0;i<3000;i++){
  const u=users[rnd(4)],act=rnd(10),s=r.book.sessionOf(u),other=users[rnd(4)];
  if(act===0)await r.say(u,'request',{to:r.ids[other]});else if(act===1)await r.say(u,'accept');else if(act===2)await r.say(u,'decline');else if(act===3)await r.say(u,'cancel');
  else if(act===4||act===5){const snap=await r.led.snapshot(u);await r.say(u,'offer',{v:s?s.v-rnd(2):0,credits:rnd(snap.credits+50),stacks:snap.stacks.length&&rnd(2)?[{id:snap.stacks[0].id,qty:1+rnd(snap.stacks[0].qty+1)}]:[],equipment:snap.equipment.length&&rnd(3)===0?[snap.equipment[0]]:[]});}
  else if(act===6)await r.say(u,'confirm',{v:s?s.v-(rnd(5)===0?1:0):0});
  else if(act===7){r.move(users[rnd(4)],rnd(12));}
  else if(act===8&&rnd(2)){   // a guided, well-formed attempt, so that real trades happen among the noise
   const a=users[rnd(4)],b=users[rnd(4)];if(a!==b){r.peers.get(a).x=0;r.peers.get(b).x=1;r.peers.get(a).z=0;r.peers.get(b).z=0;await r.say(a,'request',{to:r.ids[b]});await r.say(b,'accept');const ss=r.book.sessionOf(a);
    if(ss){for(const p of [a,b]){const sn=await r.led.snapshot(p);await r.say(p,'offer',{v:r.book.sessionOf(a)?.v,credits:rnd(sn.credits+1),stacks:[],equipment:sn.equipment.length&&rnd(2)?[sn.equipment[0]]:[]});}
     await r.say(a,'confirm',{v:r.book.sessionOf(a)?.v});await r.say(b,'confirm',{v:r.book.sessionOf(b)?.v});}}}
  else{r.tick(rnd(40_000));r.book.sweep();}
  const seen=new Set();for(const sess of r.book.sessions.values()){for(const p of [sess.a,sess.b]){assert(!seen.has(p),'a player is in two sessions');seen.add(p);assert.equal(r.book.byUid.get(p),sess);}}
  for(const p of r.book.byUid.keys())assert(seen.has(p),'a stale entry points at a finished session');
  if(i%50===0){assert.equal(total(r.led),t0,'totals changed at step '+i);for(const x of users){const sn=await r.led.snapshot(x);assert(sn.credits>=0);}}
 }
 completed=r.led.log.filter(x=>x.outcome==='completed').length;assert.equal(total(r.led),t0);assert(completed>=1,'some trades completed ('+completed+')');
});
