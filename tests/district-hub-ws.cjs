/* The local District hub over real WebSockets, with real emulator accounts. Run (emulators on, see docs/development/LOCAL_API_TEST.md):
   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 node --test tests/district-hub-ws.cjs
   Not named *.test.cjs on purpose: `npm test` and CI run without npm install, and this needs `ws` and the emulators. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const AUTH=process.env.FIREBASE_AUTH_EMULATOR_HOST,STORE=process.env.FIRESTORE_EMULATOR_HOST;
const skip=!AUTH||!STORE?'Firebase emulators are not running locally':false;
const WebSocket=skip?null:require('ws'),{create}=skip?{}:require('../tools/district-hub/emulator-providers.cjs'),{start}=skip?{}:require('../tools/district-hub/hub-server.cjs');

const post=async(path,body)=>(await fetch(`http://${AUTH}/identitytoolkit.googleapis.com/v1/accounts:${path}?key=fake`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)})).json();
const register=async()=>{const email=`h${crypto.randomUUID().slice(0,8)}@example.test`,d=await post('signUp',{email,password:'correct-horse-9',returnSecureToken:true});return {uid:d.localId,token:d.idToken};};
const guest=async()=>{const d=await post('signUp',{returnSecureToken:true});return {uid:d.localId,token:d.idToken};};
// Development data only: the character the API would have stored (the API itself is exercised by tests/test_character_emulator.py).
const giveCharacter=(uid,model)=>fetch(`http://${STORE}/v1/projects/demo-darknet-local/databases/(default)/documents/vr_players/${crypto.createHash('sha256').update(uid).digest('hex')}`,{method:'PATCH',headers:{authorization:'Bearer owner','content-type':'application/json'},body:JSON.stringify({fields:{character:{mapValue:{fields:{gender:{stringValue:model==='district-resident'?'female':'male'},model:{stringValue:model}}}}}})});

class Client{
  constructor(url,origin){this.msgs=[];this.closed=null;this.ws=new WebSocket(url,{origin});this.ws.on('message',d=>{this.msgs.push(JSON.parse(d.toString()));this.wake?.();});this.ws.on('close',(code)=>{this.closed=code;this.wake?.();});this.ws.on('error',()=>{});this.open=new Promise(r=>this.ws.on('open',r));}
  send(o){this.ws.send(typeof o==='string'?o:JSON.stringify(o));}
  async until(fn,ms=4000){const end=Date.now()+ms;for(;;){const v=fn(this);if(v)return v;if(Date.now()>end)throw new Error('timeout; saw '+JSON.stringify(this.msgs).slice(0,500)+' closed='+this.closed);await new Promise(r=>{this.wake=r;setTimeout(r,50);});}}
  of(t){return this.msgs.filter(m=>m.t===t);}
}
async function rig(){const providers=create(),hub=await start({identify:t=>providers.identify(t)});return {hub,url:`ws://127.0.0.1:${hub.port}`};}
const join=async(url,acct,x=10,z=10)=>{const c=new Client(url,'http://127.0.0.1:5188');await c.open;c.send({t:'hello',token:acct.token,room:'district-interior'});await c.until(c=>c.of('welcome').length||c.closed);if(c.of('welcome').length)c.send({t:'state',x,z,yaw:0});return c;};

test('providers refuse anything that is not the local emulators',{skip},()=>{
  const {create}=require('../tools/district-hub/emulator-providers.cjs');
  assert.throws(()=>create({FIREBASE_AUTH_EMULATOR_HOST:'auth.example.com:9099',FIRESTORE_EMULATOR_HOST:'127.0.0.1:8080'}));
  assert.throws(()=>create({FIREBASE_AUTH_EMULATOR_HOST:'127.0.0.1:9099'}));
  assert.throws(()=>create({FIREBASE_AUTH_EMULATOR_HOST:'127.0.0.1:9099',FIRESTORE_EMULATOR_HOST:'127.0.0.1:8080',GOOGLE_APPLICATION_CREDENTIALS:'/x.json'}));
});

test('two accounts see each other with the server-assigned characters; guests get the default look',{skip},async()=>{
  const {hub,url}=await rig();
  try{
    const A=await register(),B=await register(),G=await guest();await giveCharacter(A.uid,'district-resident');await giveCharacter(B.uid,'district-smuggler');
    const a=await join(url,A),b=await join(url,B,11,10),g=await join(url,G,12,10);
    await a.until(c=>c.of('join').length>=2);
    const seenByA=Object.fromEntries(a.of('join').map(m=>[m.peer.name.slice(0,5),m.peer.model]));
    assert.equal(seenByA['Pilot'],'district-smuggler');assert.equal(seenByA['Guest'],'district-smuggler','a guest cannot claim a character');
    await b.until(c=>c.of('welcome').length);assert.equal(b.of('welcome')[0].peers.find(p=>p.name.startsWith('Pilot')).model,'district-resident','B is told about A, wearing the character the server stored for A');
    await new Promise(r=>setTimeout(r,150));a.send({t:'state',x:10,z:10.4,yaw:1});await b.until(c=>c.of('state').some(m=>m.clip==='walk'));
    assert.equal(hub.hub.peers.size,3);for(const c of [a,b,g])c.ws.close();
  }finally{await hub.close();}
});

test('identity cannot be supplied or forged by a client',{skip},async()=>{
  const {hub,url}=await rig();
  try{
    const A=await register(),B=await register();
    const forged=new Client(url,'http://127.0.0.1:5188');await forged.open;forged.send({t:'hello',token:'forged.token.value',room:'district-interior'});await forged.until(c=>c.closed);assert.equal(forged.closed,4401);
    const a=await join(url,A);await giveCharacter(A.uid,'district-resident');
    for(const bad of [{t:'state',x:1,z:1,yaw:0,uid:B.uid},{t:'state',x:1,z:1,yaw:0,model:'admin'},{t:'state',x:1,z:1,yaw:0,name:'Admin'},{t:'hello',token:B.token,room:'district-interior'}]){a.send(bad);}
    await a.until(c=>c.of('refused').length>=3);assert.equal(hub.hub.peers.size,1);
    assert.equal([...hub.hub.peers.values()][0].name.startsWith('Pilot-'),true);
    const noHello=new Client(url,'http://127.0.0.1:5188');await noHello.open;noHello.send({t:'state',x:1,z:1,yaw:0});await noHello.until(c=>c.closed);assert.equal(noHello.closed,4002);
    const web=new Client(url,'https://evil.example');await Promise.race([web.open,new Promise(r=>setTimeout(r,500))]);assert.notEqual(web.ws.readyState,1,'a non-local web origin is refused');
    a.ws.close();
  }finally{await hub.close();}
});

test('leaving, dropping and reconnecting never duplicate an avatar or leave a ghost',{skip},async()=>{
  const {hub,url}=await rig();
  try{
    const A=await register(),B=await register();
    const a1=await join(url,A),b=await join(url,B,11,10);await b.until(c=>c.of('welcome').length);assert.equal(b.of('welcome')[0].peers.length,1);
    const a2=await join(url,A,12,10);                                   // the same account connects again
    await a1.until(c=>c.closed===4001);assert.equal(hub.hub.peers.size,2);
    await b.until(c=>c.of('leave').length===1&&c.of('join').length===1);
    a1.ws.terminate();await new Promise(r=>setTimeout(r,200));assert.equal(hub.hub.peers.size,2,'the replaced connection closing does not remove the live one');
    a2.ws.terminate();                                                  // abrupt drop, no goodbye
    await b.until(c=>c.of('leave').length===2);assert.equal(hub.hub.peers.size,1);
    const a3=await join(url,A);await b.until(c=>c.of('join').length===2);   // reconnect: exactly one new avatar
    a3.send({t:'bye'});await b.until(c=>c.of('leave').length===3);assert.equal(hub.hub.peers.size,1);
    b.ws.close();await new Promise(r=>setTimeout(r,200));assert.equal(hub.hub.peers.size,0);
  }finally{await hub.close();}
});
