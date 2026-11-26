const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const data=require('../void-runner/pixel-neon-dialogue.json');
const {choose,makeRoute}=require('../void-runner/pixel-neon.js');
const life=require('../void-runner/district-life.js');
test('every approved take is playable and every exchange fits an eligible stop',()=>{
 const ids=new Set(),seen=new Set(),at=makeRoute(life);
 for(let t=0;t<1000;t+=.5){
  const pose=at(t);
  assert.ok(Number.isFinite(pose.x+pose.z+pose.yaw));
  for(const e of data)if(choose([e],pose,true,new Map()))seen.add(e.id);
 }
 assert.equal(seen.size,88);
 for(const e of data)for(const l of e.lines){
  assert.ok(!ids.has(l.id));ids.add(l.id);assert.ok(l.seconds>0);
  assert.ok(fs.statSync(path.join(__dirname,'../void-runner/assets/audio/voice/extra/pixel-neon',l.id+'.mp3')).size>1000);
 }
 assert.equal(ids.size,281);
});
test('Admin proximity, venue and recency determine eligible conversations',()=>{
 const pose={kind:'store',remaining:100},history=new Map();
 let next=choose(data,pose,false,history,()=>0);
 assert.ok(next.locations.includes('store')&&!next.requiresAdminNearby);
 history.set(next.id,1);
 assert.notEqual(choose(data,pose,false,history,()=>0).id,next.id);
 assert.equal(choose(data.filter(e=>e.requiresAdminNearby),pose,false,history),null);
 assert.equal(choose(data,{...pose,remaining:.5},true,history),null);
});

test('the pair visit Hotel Headshots and only stop for a kiss off the hallway path',()=>{
 const route=makeRoute(life),city=require('../void-runner/neochinatown.js');
 const cab=city.arcade.find(c=>c.game==='hotel-headshots');
 assert.equal(route(0).z,cab.z);
 const spots=new Set();
 for(let t=0;t<2000;t+=.25){
  const p=route(t);
  if(p.kind==='kiss'){assert.ok(Math.abs(p.x)>1);spots.add(p.x+','+p.z);}
 }
 assert.equal(spots.size,1);
});
