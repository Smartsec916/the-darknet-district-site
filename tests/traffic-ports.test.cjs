const test=require('node:test'),assert=require('node:assert/strict');
const T=require('../void-runner/traffic.js');
function rng(seed){return()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);}
const station={port:'origin',landing:{x:0,y:4,z:-15},out:{x:0,y:0,z:1}};
const far=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);

test('port traffic gathers around the landing area and keeps coming',()=>{
 let near=0,samples=0,arrivals=0,departures=0;
 for(let seed=1;seed<40;seed++){
  const r=rng(seed*97),area=T.create(r,false,station),mouth={x:0,y:4,z:-15+T.config.mouth};
  for(let i=0;i<1200;i++){
   T.step(area,.1,{x:0,y:0,z:0},{rng:r,...station});
   assert.ok(area.contacts.length<=T.config.port.max);
   if(i%10)continue;
   for(const c of area.contacts){samples++;if(far(c,mouth)<200)near++;if(c.docking){arrivals++;assert.deepEqual(c.destination,mouth);}if(c.role==='civilian departure')departures++;}
  }
  assert.ok(area.contacts.length>0,'a port is still busy after two minutes');
 }
 assert.ok(near/samples>.6,'most traffic is within 200 units of the port: '+(near/samples).toFixed(2));
 assert.ok(arrivals&&departures,'ships both arrive and leave');
});

test('open space traffic is sparse, random and enters far away out of warp',()=>{
 const r=rng(4242),area=T.create(r,false,{});const starts=[];
 assert.equal(area.contacts.length,0,'open space is not pre-filled around the player');
 let before=new Set();
 for(let i=0;i<20000;i++){
  T.step(area,.1,{x:0,y:0,z:3},{rng:r});
  assert.ok(area.contacts.length<=T.config.open.max);
  for(const c of area.contacts)if(!before.has(c)){starts.push({x:c.x,z:c.z,d:Math.hypot(c.x,c.y,c.z),warp:c.warp});}
  before=new Set(area.contacts);
 }
 assert.ok(starts.length>20,'ships keep passing through');
 for(const s of starts){assert.ok(s.d>=T.config.open.distance[0]-5,'new ship starts far away');assert.ok(s.warp>.8,'new ship arrives out of warp');}
 assert.ok(starts.some(s=>s.x<0)&&starts.some(s=>s.x>0)&&starts.some(s=>s.z<0)&&starts.some(s=>s.z>0),'arrivals come from every direction');
});

test('after hostiles are cleared traffic returns gradually, never as an instant batch',()=>{
 for(let seed=1;seed<30;seed++){
  const r=rng(seed*13),area=T.create(r,false,station);
  for(let i=0;i<50;i++)T.hold(area,r);
  assert.equal(area.contacts.length,0);
  T.step(area,.1,{x:0,y:0,z:0},{rng:r,...station});
  assert.ok(area.contacts.length<=1,'at most one ship enters on the first frame');
  for(const c of area.contacts)assert.ok(c.role==='civilian departure'||c.warp>.8,'a returning ship leaves the hangar or drops out of warp');
 }
 const r=rng(77),open=T.create(r,false,{});T.hold(open,r);
 for(let i=0;i<T.config.open.delay[0]*10-1;i++)T.step(open,.1,{x:0,y:0,z:0},{rng:r});
 assert.equal(open.contacts.length,0,'open space stays quiet for a while after a fight');
});

test('arriving at a new port finds it already busy',()=>{
 const r=rng(5),area=T.create(r,false,{});
 T.step(area,.1,{x:0,y:0,z:0},{rng:r});assert.equal(area.contacts.length,0);
 const destination={port:'destination',landing:{x:0,y:4,z:120},out:{x:0,y:0,z:-1}};
 T.step(area,.1,{x:0,y:0,z:0},{rng:r,...destination});
 assert.ok(area.contacts.length>=T.config.port.seed[0]);
 for(const c of area.contacts)assert.ok(far(c,destination.landing)<400,'seeded ships are at the destination port');
});

test('Vesper is a quiet port: two ships at most, still coming and going',()=>{
 const vesper={port:'origin',landing:{x:-12,y:3,z:-25},out:{x:0,y:-1,z:0},quiet:true};let seen=0;
 for(let seed=1;seed<40;seed++){
  const r=rng(seed*31),area=T.create(r,false,vesper);
  assert.ok(area.contacts.length>=1&&area.contacts.length<=2);
  for(let i=0;i<1200;i++){T.step(area,.1,{x:0,y:0,z:0},{rng:r,...vesper});assert.ok(area.contacts.length<=2);seen+=area.contacts.length;}
 }
 assert.ok(seen>0);
});
