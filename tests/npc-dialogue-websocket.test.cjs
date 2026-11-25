'use strict';
// Exercise actual authenticated WebSocket dispatch, not only the pure dialogue coordinator.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const WebSocket=require('ws');
const {main}=require('../tools/district-hub/server.cjs');
const {makeWorld}=require('./helpers/hub-fixtures.cjs');

async function until(check,label){
 const deadline=Date.now()+5000;
 while(Date.now()<deadline){
  const result=check();
  if(result)return result;
  await new Promise(resolve=>setTimeout(resolve,15));
 }
 throw new Error('Timed out: '+label);
}
async function connect(hub,account,room='district-interior'){
 const ws=new WebSocket('ws://127.0.0.1:'+hub.port,{origin:'https://thedarknetdistrict.com'});
 const messages=[];
 ws.on('message',raw=>messages.push(JSON.parse(raw)));
 await new Promise((resolve,reject)=>{
  ws.once('open',resolve);
  ws.once('error',reject);
 });
 const send=m=>ws.send(JSON.stringify(m));
 send({t:'hello',token:account.token,room});
 const welcome=await until(()=>messages.find(m=>m.t==='welcome'),'authenticated welcome');
 assert.equal(welcome.features.npcDialogue,true);
 send({t:'state',x:5,z:5,yaw:0});
 await until(()=>hub.hub.peers.get(account.uid)?.placed,'placed peer');
 return {ws,send,of:t=>messages.filter(m=>m.t===t)};
}
test('authenticated sockets share one linked NPC turn, isolate rooms and release exact leases on reconnect', {timeout:30000}, async()=>{
 const w=makeWorld({
  fox:{uid:'uid-fox',model:'district-resident',handle:'Neon_Fox'},
  bolt:{uid:'uid-bolt',model:'district-smuggler',handle:'Bolt_9'},
  other:{uid:'uid-other',model:'district-smuggler',handle:'Other_9'}
 });
 const hub=await main({HUB_MODE:'production',HUB_API_BASE:'https://api.test',HUB_ALLOWED_UIDS:'uid-fox,uid-bolt,uid-other',PORT:'0',HUB_MAX_PER_IP:'4'},
  {fetchJwks:w.fetchJwks,fetchImpl:w.fetchImpl,quiet:true});
 let now=0;
 const book=hub.hub.dialogue;
 book.now=()=>now; // only the dialogue clock; auth and socket transport remain real
 const ready=(client,group)=>client.send({t:'npc-ready',group,cooldown:5});
 const end=(client,turn)=>client.send({t:'npc-end',group:turn.group,token:turn.token});
 const key='district-interior/pair';
 try{
  let a=await connect(hub,w.accounts.fox);
  const b=await connect(hub,w.accounts.bolt);
  const other=await connect(hub,w.accounts.other,'neochinatown-street');
  const peerA=hub.hub.peers.get('uid-fox'),peerB=hub.hub.peers.get('uid-bolt');
  ready(a,'pair');ready(b,'pair');ready(other,'pair');
  await until(()=>book.groups.get(key)?.ready.size===2 && book.groups.get('neochinatown-street/pair')?.ready.size===1,'three ready frames across two rooms');
  now=700;
  ready(b,'pair');
  const firstA=await until(()=>a.of('npc-turn')[0],'Fox first turn');
  const firstB=await until(()=>b.of('npc-turn')[0],'Bolt first turn');
  assert.deepEqual(firstA,firstB);
  assert.equal(firstA.turn,0);
  assert.equal(other.of('npc-turn').length,0);
  assert.equal(book.activeByPeer.size,2);
  end(a,firstA);
  await until(()=>!book.activeByPeer.has(peerA),'Fox finishes');
  assert.equal(book.activeByPeer.get(peerB),book.groups.get(key));
  now=900;ready(a,'second');
  await until(()=>book.groups.get('district-interior/second')?.ready.has(peerA),'second group queued');
  now=1600;ready(a,'second');
  const second=await until(()=>a.of('npc-turn')[1],'second group granted');
  assert.notEqual(second.token,firstA.token);
  assert.equal(second.group,'second');
  // Same socket preserves frame ordering; the eye update is a transport barrier.
  end(a,firstA);ready(a,'third');a.send({t:'eye',on:true});
  await until(()=>b.of('eye').some(m=>m.on),'stale end processed before barrier');
  assert.equal(book.groups.has('district-interior/third'),false);
  assert.equal(book.activeByPeer.get(peerA),book.groups.get('district-interior/second'));
  assert.equal(b.of('npc-turn').length,1);
  b.ws.close();
  await until(()=>!hub.hub.peers.has('uid-bolt'),'Bolt disconnect');
  assert.equal(book.activeByPeer.has(peerB),false);
  assert.equal(book.groups.get(key).next,6600);
  a.ws.close();
  await until(()=>!hub.hub.peers.has('uid-fox'),'Fox disconnect');
  assert.equal(book.activeByPeer.size,0);
  now=6800;
  a=await connect(hub,w.accounts.fox);
  ready(a,'pair');
  const fresh=await until(()=>a.of('npc-turn')[0],'new connection granted a fresh turn');
  assert.equal(fresh.turn,1);
  assert.notEqual(fresh.token,firstA.token);
  end(a,firstA);end(a,fresh);
  await until(()=>book.activeByPeer.size===0,'fresh lease released');
  assert.equal(other.of('npc-turn').length,0);
 }finally{await hub.close();}
});
