/* Production multiplayer entry requires two account-bound records, not client claims. No Firebase or live API access. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const WebSocket=require('ws');
const {main}=require('../tools/district-hub/server.cjs');
const {makeWorld}=require('./helpers/hub-fixtures.cjs');
const Appearance=require('../void-runner/character-appearance.js');
const origin='https://thedarknetdistrict.com';

async function connect(hub,account,extra={}){
 const ws=new WebSocket(`ws://127.0.0.1:${hub.port}`,{origin}),messages=[];
 let closed=null;ws.on('message',raw=>messages.push(JSON.parse(raw)));ws.on('close',code=>{closed=code;});
 await new Promise((resolve,reject)=>{ws.once('open',resolve);ws.once('error',reject);});
 ws.send(JSON.stringify({t:'hello',token:account.token,room:'district-interior',...extra}));
 const end=Date.now()+4000;while(!messages.some(m=>m.t==='welcome'||m.t==='error')&&closed===null&&Date.now()<end)await new Promise(r=>setTimeout(r,20));
 if(!messages.length&&closed===null)throw new Error('join did not answer');
 return {ws,messages,get closed(){return closed;}};
}
const result=c=>c.messages.find(m=>m.t==='welcome'||m.t==='error');
async function closed(c){const end=Date.now()+4000;while(c.closed===null&&Date.now()<end)await new Promise(r=>setTimeout(r,20));return c.closed;}

test('registered entry preserves complete accounts, guides partial/new accounts, and rejects duplicate handles',async()=>{
 const w=makeWorld({
  veteran:{uid:'veteran',handle:'Veteran_1',model:'district-resident',appearance:Appearance.defaults('district-resident'),save:{credits:100},inventory:['item-a']},
  handleOnly:{uid:'handle-only',handle:'Handle_1'},characterOnly:{uid:'character-only',model:'district-smuggler'},
  newcomer:{uid:'newcomer'},duplicate:{uid:'duplicate',handle:'veteran_1',model:'district-smuggler'},
  anonymous:{uid:'anonymous',provider:'anonymous',handle:'Anon_1',model:'district-smuggler'}
 });
 const before=JSON.stringify({save:w.accounts.veteran.save,inventory:w.accounts.veteran.inventory,appearance:w.accounts.veteran.appearance});
 const hub=await main({HUB_MODE:'production',HUB_API_BASE:'https://api.test',HUB_ACCESS:'registered',HUB_MAX_PER_IP:'8',PORT:'0'},
  {fetchJwks:w.fetchJwks,fetchImpl:w.fetchImpl,quiet:true});
 try{
  const veteran=await connect(hub,w.accounts.veteran);assert.equal(result(veteran).t,'welcome');
  assert.deepEqual(hub.hub.peers.get('veteran').appearance,w.accounts.veteran.appearance);
  for(const [key,code,reason] of [['handleOnly',4411,'saved character required'],['characterOnly',4410,'District handle required'],
    ['newcomer',4414,'District handle and character required'],['duplicate',4412,'duplicate District handle'],['anonymous',4407,'registered account required']]){
    const c=await connect(hub,w.accounts[key]);assert.equal(result(c).reason,reason,key);assert.equal(await closed(c),code,key);
  }
  // Completing one missing field must leave the other and the existing records untouched.
  w.accounts.handleOnly.model='district-resident';w.accounts.characterOnly.handle='Character_1';
  w.accounts.newcomer.handle='New_1';w.accounts.newcomer.model='district-smuggler';
  const joined=[];for(const key of ['handleOnly','characterOnly','newcomer']){
    const c=await connect(hub,w.accounts[key]);joined.push(c);assert.equal(result(c).t,'welcome',key);
  }
  assert.equal(hub.hub.peers.get('handle-only').name,'Handle_1');
  assert.equal(hub.hub.peers.get('character-only').model,'district-smuggler');
  assert.equal(JSON.stringify({save:w.accounts.veteran.save,inventory:w.accounts.veteran.inventory,appearance:w.accounts.veteran.appearance}),before);
  assert(w.calls.every(([path])=>['/api/identity/me','/api/void-runner/character'].includes(path)),'the hub only reads account records');
  const reconnect=await connect(hub,w.accounts.veteran);assert.equal(result(reconnect).t,'welcome');assert.equal(await closed(veteran),4001);
  for(const c of [...joined,reconnect])c.ws.close();
 }finally{await hub.close();}
});

test('account lookup failure closes multiplayer; client-supplied names never bypass verification',async()=>{
 const w=makeWorld({ready:{uid:'ready',handle:'Ready_1',model:'district-resident'},offline:{uid:'offline',handle:'Offline_1',model:'district-smuggler'},offlineChar:{uid:'offline-char',handle:'Offline_2',model:'district-smuggler'}});
 let loseReady=false;
 const fetchImpl=(url,opt)=>((url.includes('/api/identity/me')&&(opt.headers.authorization.endsWith(w.accounts.offline.token)||
    (loseReady&&opt.headers.authorization.endsWith(w.accounts.ready.token))))||
    (url.includes('/api/void-runner/character')&&opt.headers.authorization.endsWith(w.accounts.offlineChar.token)))
  ?Promise.resolve({ok:false,status:503}):w.fetchImpl(url,opt);
 const hub=await main({HUB_MODE:'production',HUB_API_BASE:'https://api.test',HUB_ACCESS:'registered',PORT:'0'},
  {fetchJwks:w.fetchJwks,fetchImpl,quiet:true});
 try{
  const unavailable=await connect(hub,w.accounts.offline);assert.equal(result(unavailable).reason,'account verification unavailable');assert.equal(await closed(unavailable),4413);
  const unavailableCharacter=await connect(hub,w.accounts.offlineChar);assert.equal(result(unavailableCharacter).reason,'account verification unavailable');assert.equal(await closed(unavailableCharacter),4413);
  const forged=await connect(hub,w.accounts.ready,{name:'Admin'});assert.equal(await closed(forged),4002);assert.equal(forged.messages.some(m=>m.t==='welcome'),false);
  const ready=await connect(hub,w.accounts.ready);assert.equal(result(ready).t,'welcome');assert.equal(hub.hub.peers.get('ready').name,'Ready_1');
  loseReady=true;ready.ws.send(JSON.stringify({t:'refresh',token:w.accounts.ready.token}));assert.equal(await closed(ready),4413,'verification outage also closes an existing session on refresh');
 }finally{await hub.close();}
});
