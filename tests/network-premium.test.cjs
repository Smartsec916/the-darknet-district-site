const test=require('node:test'),assert=require('node:assert/strict');
const N=require('../void-runner/network.js'),C=require('../void-runner/campaign.js'),S=require('../void-runner/ships.js'),W=require('../void-runner/warp.js');
N.config.backoff=1;N.config.maxBackoff=2;N.config.timeout=20;
test('GET deduplication, bounded transient retry, permanent errors and POST single attempt',async()=>{
 const original=global.fetch;let calls=0;
 try{
  global.fetch=async()=>{calls++;await new Promise(r=>setTimeout(r,2));return new Response(calls<3?'suspended':JSON.stringify({ok:true}),{status:calls<3?503:200});};
  const [a,b]=await Promise.all([N.request('balance'),N.request('balance')]);assert.equal(calls,3);assert.deepEqual(a,b);assert.equal(N.states.balance.state,'ready');
  calls=0;global.fetch=async()=>{calls++;return new Response('{}',{status:401});};await assert.rejects(N.request('account'));assert.equal(calls,1);
  calls=0;global.fetch=async()=>{calls++;throw new TypeError('NetworkError when attempting to fetch resource.');};await assert.rejects(N.request('catalog'),/Unable to reach VOID NETWORK/);assert.equal(calls,3);assert.equal(N.states.catalog.state,'degraded');
  calls=0;await assert.rejects(N.request('checkout',{body:{item:'spectre'}}));assert.equal(calls,1);
  calls=0;global.fetch=(_url,{signal})=>new Promise((resolve,reject)=>{calls++;signal.addEventListener('abort',()=>reject(new DOMException('timeout','AbortError')));});await assert.rejects(N.request('balance'),/timed out/);assert.equal(calls,3);
 }finally{global.fetch=original;}
});
test('forged legacy saves and campaign credits never unlock Spectre or its equipment',()=>{
 S.verify([]);const s=C.fresh();s.credits=100000;s.ownedShips.push('ship3');s.activeShip='ship3';s.standardGear.push('pulse3','shield3');s.loadout={weapon:'pulse3',shield:'shield3'};
 assert(!C.buyShip(s,'ship3'));assert.equal(s.credits,100000);assert(!C.switchShip(s,'ship3'));assert.equal(S.get(s).id,'starter');assert.equal(C.stats(s).damage,1);assert(!C.ownsEquipment(s,'pulse3'));
 const restored=C.restore(JSON.stringify(s));assert.deepEqual(restored.ownedShips,['starter']);assert.equal(restored.activeShip,'starter');assert(!restored.standardGear.includes('pulse3'));
 S.verify(['spectre']);assert(C.switchShip(restored,'ship3'));assert.equal(C.stats(restored).ship.id,'ship3');assert(C.ownsEquipment(restored,'pulse3'));assert.equal(restored.credits,100000);
 S.verify([]);assert.equal(S.get(restored).id,'starter');assert.equal(C.stats(restored).damage,1);assert(!C.switchShip(restored,'ship3'));
});
test('departure and eight-second reveal timing remain centralized through encounter resume',()=>{
 const r=W.create('kepler','meridian','route',true);assert.equal(r.phase,'departure');for(let i=0;i<23;i++)W.step(r,.1,r.vector);assert.equal(r.phase,'align');
 for(let i=0;i<70&&r.phase!=='encounter';i++)W.step(r,.1,r.vector);assert.equal(r.phase,'encounter');const progress=r.progress;for(let i=0;i<100;i++)W.step(r,.1,r.vector,false);assert.equal(r.progress,progress);
 W.step(r,.1,r.vector,true);for(let i=0;i<100&&r.progress*W.config.warpSeconds<8;i++)W.step(r,.1,r.vector,true);
 assert(r.progress*W.config.warpSeconds>=8&&r.progress*W.config.warpSeconds<8.11);assert.equal(r.destination,'meridian');assert.equal(r.phase,'warp');
 for(let i=0;i<100;i++)W.step(r,.1,r.vector,true);assert.equal(r.phase,'arrived');
});
