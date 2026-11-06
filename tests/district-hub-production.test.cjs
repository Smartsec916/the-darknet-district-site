const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {createVerifier}=require('../tools/district-hub/google-auth.cjs'),{createApiProvider}=require('../tools/district-hub/api-providers.cjs');
const {clientIp,ConnectionGate}=require('../tools/district-hub/limits.cjs'),{fromEnv}=require('../tools/district-hub/config.cjs');
const {Hub}=require('../tools/district-hub/protocol.cjs');

const PROJECT='the-darknet-district-71873',NOW=1_800_000_000_000,sec=NOW/1000;
const {privateKey,publicKey}=crypto.generateKeyPairSync('rsa',{modulusLength:2048}),other=crypto.generateKeyPairSync('rsa',{modulusLength:2048});
const jwk=(k,kid)=>({...k.publicKey.export({format:'jwk'}),kid,alg:'RS256',use:'sig'});
const b64=o=>Buffer.from(JSON.stringify(o)).toString('base64url');
function token(over={},{key=privateKey,kid='k1',alg='RS256',header={}}={}){
 const payload={aud:PROJECT,iss:`https://securetoken.google.com/${PROJECT}`,sub:'uid-1',iat:sec-10,auth_time:sec-10,exp:sec+3000,firebase:{sign_in_provider:'password'},...over};
 const h=b64({alg,kid,typ:'JWT',...header}),p=b64(payload),sig=alg==='RS256'?crypto.sign('RSA-SHA256',Buffer.from(h+'.'+p),key).toString('base64url'):'x';
 return h+'.'+p+'.'+sig;}
const verifier=(extra={})=>createVerifier({projectId:PROJECT,now:()=>NOW,fetchJwks:async()=>({keys:[jwk({publicKey},'k1')],maxAge:3600}),...extra});

test('a genuine Google-style token is accepted and reports guest or registered',async()=>{
 const v=verifier();
 assert.deepEqual(await v.verify(token()),{uid:'uid-1',provider:'password',anonymous:false,expiresAt:sec+3000});
 assert.equal((await v.verify(token({firebase:{sign_in_provider:'anonymous'}}))).anonymous,true);
 assert.equal((await v.verify(token({firebase:{}}))).provider,'unknown');
});
test('every way of forging or misusing a token is refused',async()=>{
 const v=verifier();
 const bad={'wrong audience':token({aud:'another-project'}),'wrong issuer':token({iss:'https://securetoken.google.com/another'}),'expired':token({exp:sec-1}),
  'issued in the future':token({iat:sec+3600}),'auth time in the future':token({auth_time:sec+3600}),'no subject':token({sub:''}),'long subject':token({sub:'x'.repeat(200)}),
  'signed by a different key':token({},{key:other.privateKey}),'unknown key id':token({},{kid:'zzz'}),'alg none':token({},{alg:'none'}),'hmac confusion':token({},{alg:'HS256'}),
  'no kid':token({},{kid:null}),'garbage':'a.b.c','two parts':'a.b','empty':'','huge':'a'.repeat(9000),'not a string':undefined};
 for(const [name,t] of Object.entries(bad))assert.equal(await v.verify(t),null,name);
 const good=token().split('.');good[1]=b64({...JSON.parse(Buffer.from(good[1],'base64url')),sub:'admin'});
 assert.equal(await v.verify(good.join('.')),null,'a tampered payload fails the signature');
});
test('keys are cached, refreshed for an unknown key id at most once a minute, and an outage means not signed in',async()=>{
 let calls=0,t=NOW;const keys=[{keys:[jwk({publicKey},'k1')]},{keys:[jwk({publicKey},'k1'),jwk(other,'k2')]}];
 const v=createVerifier({projectId:PROJECT,now:()=>t,fetchJwks:async()=>keys[Math.min(calls++,1)]});
 await v.verify(token());await v.verify(token());assert.equal(calls,1,'cached');
 assert.equal(await v.verify(token({},{key:other.privateKey,kid:'k2'})),null,'unknown id within a minute does not refetch');assert.equal(calls,1);
 t+=61_000;assert.equal((await v.verify(token({iat:sec+60,auth_time:sec+60,exp:sec+9000},{key:other.privateKey,kid:'k2'})))?.uid,'uid-1','after a minute it refreshes and finds the rotated key');assert.equal(calls,2);
 const down=createVerifier({projectId:PROJECT,now:()=>NOW,fetchJwks:async()=>{throw new Error('offline');}});assert.equal(await down.verify(token()),null);
});

test('the API provider forwards the player\'s own token, validates what comes back, and never throws',async()=>{
 const seen=[];const answers={'/api/void-runner/character':{character:{gender:'female',model:'district-resident'}},'/api/identity/me':{handle:'Neon_Fox'}};
 const f=async(url,opt)=>{const path=new URL(url).pathname;seen.push([path,opt.headers.authorization]);return {ok:true,headers:{get:()=>'application/json'},json:async()=>answers[path]};};
 const api=createApiProvider({apiBase:'https://api.example.com',fetchImpl:f});
 assert.deepEqual(await api.profile('TOKEN',{anonymous:false}),{model:'district-resident',handle:'Neon_Fox',appearance:null});
 assert(seen.every(([,h])=>h==='Bearer TOKEN'),'only the player\'s own token is sent');
 seen.length=0;assert.deepEqual(await api.profile('TOKEN',{anonymous:true}),{model:null,handle:'Neon_Fox',appearance:null});assert.deepEqual(seen.map(s=>s[0]),['/api/identity/me'],'a guest is never looked up for a character');
 answers['/api/identity/me']={handle:'<script>alert(1)</script>'};answers['/api/void-runner/character']={character:{model:{$ne:1}}};
 assert.deepEqual(await api.profile('T',{anonymous:false}),{model:null,handle:null,appearance:null},'unsafe values are dropped');
 for(const bad of [async()=>{throw new Error('timeout');},async()=>({ok:false,status:401,headers:{get:()=>''},json:async()=>({})}),async()=>({ok:true,headers:{get:()=>'text/html'},json:async()=>({})}),async()=>({ok:true,headers:{get:()=>'application/json'},json:async()=>[1]})])
  assert.deepEqual(await createApiProvider({apiBase:'https://api.example.com',fetchImpl:bad}).profile('T',{anonymous:false}),{model:null,handle:null,appearance:null});
 assert.throws(()=>createApiProvider({apiBase:'api.example.com/path'}));
});

test('client addresses come only from the proxies we trust',()=>{
 assert.equal(clientIp('10.0.0.5','1.2.3.4, 9.9.9.9',0),'10.0.0.5','no proxy: the socket address, the header is ignored');
 assert.equal(clientIp('10.0.0.5','6.6.6.6, 1.2.3.4',1),'1.2.3.4','one proxy: the right-most entry; anything left of it is the visitor\'s own claim');
 assert.equal(clientIp('10.0.0.5','6.6.6.6, 1.2.3.4, 10.1.1.1',2),'1.2.3.4');
 assert.equal(clientIp('10.0.0.5','not an ip',1),'10.0.0.5');assert.equal(clientIp('10.0.0.5',undefined,1),'10.0.0.5');assert.equal(clientIp(undefined,undefined,0),'unknown');
});
test('connection limits: per address, per minute and overall',()=>{
 let t=0;const g=new ConnectionGate({perIp:2,perIpPerMinute:3,total:3,now:()=>t});
 assert(g.admit('a').ok&&g.admit('a').ok);assert.equal(g.admit('a').reason,'too many connections from this address');
 g.release('a');assert(g.admit('a').ok);g.release('a');assert.equal(g.admit('a').reason,'connecting too quickly');
 t=61_000;assert(g.admit('a').ok);assert(g.admit('b').ok);assert.equal(g.admit('c').reason,'hub is full',g.count+' open');
 g.release('a');g.release('a');g.release('b');assert.equal(g.count,0);
});

test('configuration fails closed',()=>{
 const base={HUB_MODE:'production',HUB_API_BASE:'https://api.example.com',HUB_ALLOWED_UIDS:'u1, u2'};
 const c=fromEnv(base);assert.equal(c.host,'0.0.0.0');assert.deepEqual([...c.allowed],['u1','u2']);assert.deepEqual(c.origins,['https://thedarknetdistrict.com','https://www.thedarknetdistrict.com']);
 assert.throws(()=>fromEnv({...base,HUB_ALLOWED_UIDS:''}),/HUB_ALLOWED_UIDS is empty/,'no allow-list: refuses to start');
 assert.equal(fromEnv({...base,HUB_ALLOWED_UIDS:'',HUB_ALLOW_ANY_SIGNED_IN:'true'}).allowed,null,'an open test must be asked for in words');
 assert.throws(()=>fromEnv({...base,HUB_API_BASE:'http://api.example.com'}),/HUB_API_BASE/);assert.throws(()=>fromEnv({...base,HUB_API_BASE:''}));
 assert.throws(()=>fromEnv({...base,HUB_ALLOWED_ORIGINS:'*'}),/exact https origins/);assert.throws(()=>fromEnv({...base,HUB_ALLOWED_ORIGINS:'https://*.example.com'}));
 assert.throws(()=>fromEnv({...base,PORT:'abc'}));assert.equal(fromEnv({...base,RENDER:'true'}).trustHops,1,'on Render one proxy is trusted');
 for(const v of ['simulated','on','true','1','real'])assert.throws(()=>fromEnv({...base,HUB_TRADING:v}),/HUB_TRADING is not available in production/,'production never enables trading: '+v);
 assert.equal(fromEnv({...base,HUB_TRADING:'off'}).tradingSimulated,false);
 assert.throws(()=>fromEnv({}),/Emulator mode/,'the default mode is local emulators only');
 assert.throws(()=>fromEnv({FIREBASE_AUTH_EMULATOR_HOST:'auth.example.com:9099',FIRESTORE_EMULATOR_HOST:'127.0.0.1:8080'}));
 assert.equal(fromEnv({FIREBASE_AUTH_EMULATOR_HOST:'127.0.0.1:9099',FIRESTORE_EMULATOR_HOST:'127.0.0.1:8080'}).host,'127.0.0.1');
});

test('trading can only be simulated, and only on a local emulator hub',()=>{
 const local={FIREBASE_AUTH_EMULATOR_HOST:'127.0.0.1:9099',FIRESTORE_EMULATOR_HOST:'127.0.0.1:8080'};
 assert.equal(fromEnv(local).tradingSimulated,false,'off unless asked for');assert.equal(fromEnv({...local,HUB_TRADING:'simulated'}).tradingSimulated,true);assert.equal(fromEnv({...local,HUB_TRADING:'off'}).tradingSimulated,false);
 assert.throws(()=>fromEnv({...local,HUB_TRADING:'real'}),/off or simulated/);assert.throws(()=>fromEnv({...local,HUB_TRADING:'true'}),/off or simulated/);
});
test('handles become name tags, and anything unsafe falls back to a guest or pilot name',()=>{
 const joined=(uid,who)=>{const hub=new Hub({send(){},close(){},now:()=>1e6}),c={};hub.join(c,{t:'hello',token:'x',room:'district-interior'},{uid,...who});return hub.byConn.get(c).name;};
 assert.equal(joined('a',{anonymous:false,handle:'Neon_Fox'}),'Neon_Fox');
 assert.equal(joined('b',{anonymous:true,handle:'Quiet_9'}),'Quiet_9','a handle-only account shows its registered handle');
 assert(/^Guest-[0-9a-f]{4}$/.test(joined('c',{anonymous:true})));assert(/^Pilot-[0-9a-f]{4}$/.test(joined('d',{anonymous:false})));
 for(const bad of ['<b>x</b>','ab','a'.repeat(21),'has space','Admin‮','',null,{},7])assert(/^(Guest|Pilot)-/.test(joined('e'+String(bad).length+typeof bad,{anonymous:false,handle:bad})),String(bad));
});
