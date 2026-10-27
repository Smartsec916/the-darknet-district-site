// City expansion and flying taxis: the old neighbourhood is untouched, the new streets are walkable, and fares are fair.
const test=require('node:test'),assert=require('node:assert/strict');
const N=require('../void-runner/neochinatown.js'),E=require('../void-runner/exploration-controller.js'),R=require('../void-runner/taxi-rules.js'),C=require('../void-runner/campaign.js');
function reachable(L,limit=400000){const S=.5,seen=new Set(),key=(x,z)=>x.toFixed(1)+','+z.toFixed(1),q=[[L.spawn[0],L.spawn[2]]];seen.add(key(...q[0]));
 for(let i=0;i<q.length&&i<limit;i++){const [x,z]=q[i];for(const [dx,dz] of [[S,0],[-S,0],[0,S],[0,-S]]){const nx=x+dx,nz=z+dz,k=key(nx,nz);if(seen.has(k)||E.blocked(nx,nz,L))continue;seen.add(k);q.push([nx,nz]);}}return q;}
const city=()=>{const s=C.fresh();s.location='earth';s.credits=100;return s;};

test('the three future districts are reached on foot from the landing pad, with no loading points',()=>{
  const L=N.layout(),cells=reachable(L);
  for(const d of N.districts){assert.ok(d.placeholder,d.id+' is marked a placeholder');assert.ok(cells.some(([x,z])=>Math.hypot(x-d.center[0],z-d.center[1])<4),d.id+' reachable');}
});

test('the old neighbourhood keeps its interactions, spawn and District walls',()=>{
  const L=N.layout();assert.deepEqual(L.spawn,[31,1.7,-96]);
  for(const id of ['board','terminal','tdd','district-scan','admin','district-iris','district-shop','district-bar','district-vr','district-pod','district-stairs'])assert.ok(L.interactions.some(i=>i.id===id),id);
  // Inside the old streets nothing new blocks the way; outside them the city is solid.
  for(const [x,z] of [[61,-90],[100,-12.5],[100,-58.5],[31,-96]])assert.equal(E.blocked(x,z,L),false);
  for(const [x,z] of [[30,-60],[90,-90],[120,-140]])assert.equal(E.blocked(x,z,L),true);
});

test('taxis run only in the city, on foot, outside the District and never in a fight',()=>{
  const s=city();assert.equal(R.availability(s,{onFoot:true,area:'street'}).ok,true);
  assert.equal(R.availability(s,{onFoot:true,area:'district'}).ok,false);
  assert.equal(R.availability(s,{onFoot:true,area:'street',combat:true}).ok,false);
  assert.equal(R.availability(s,{onFoot:false}).ok,false);
  const m=C.fresh();m.location='meridian';assert.match(R.availability(m,{onFoot:true}).reason,/No taxi service/);
});

test('destinations show a fare before calling, and refuse what makes no sense',()=>{
  const s=city(),L=N.layout(),list=R.destinations(s,{player:[31,-96],layout:L}),by=Object.fromEntries(list.map(d=>[d.id,d]));
  assert.equal(by.ship.ok,false,'already at the ship');assert.ok(by.district.ok&&by.district.fare>0&&by.district.fare<=R.fare.max);
  s.credits=1;assert.equal(R.destinations(s,{player:[31,-96],layout:L}).find(d=>d.id==='district').ok,false);
  // From Milked, Return to Ship lands at the zone nearest the ship's real position, not on it.
  const far=R.destinations(city(),{player:[220,-12.5],layout:L}).find(d=>d.id==='ship');assert.ok(far.ok);
  const z=R.zone(city(),far.zone),ship=R.shipPosition(L);assert.ok(Math.hypot(z.position[0]-ship[0],z.position[1]-ship[1])>8,'clear of the ship');
});

test('the fare is charged once, recorded until arrival, and refunded once after an interruption',()=>{
  const s=city();assert.equal(R.charge(s,'milked',20),20);assert.equal(s.credits,80);assert.equal(R.charge(s,'milked',20),0,'never twice');
  const saved=C.restore(JSON.stringify(s));assert.equal(saved.story.flags.taxiTrip,'milked:20');
  assert.equal(R.recover(saved),20);assert.equal(saved.credits,100);assert.equal(R.recover(saved),0);
  R.arrive(s);assert.equal(s.story.flags.taxiTrip,undefined);assert.equal(R.recover(s),0);
  const poor=city();poor.credits=5;assert.equal(R.charge(poor,'milked',20),0);assert.equal(poor.credits,5);
});
