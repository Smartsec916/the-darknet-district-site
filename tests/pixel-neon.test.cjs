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
 assert.ok(Math.abs(route(0).z-cab.z)<.001);
 const spots=new Set();
 for(let t=0;t<2000;t+=.25){
  const p=route(t);
  if(p.kind==='kiss'){assert.ok(Math.abs(p.x)>1);spots.add(p.x+','+p.z);}
 }
 assert.equal(spots.size,1);
});

test('Pixel enters the left VR booth while Neon reaches the bar, and both paths clear District solids',()=>{
 const {activityPose}=require('../void-runner/pixel-neon.js'),city=require('../void-runner/neochinatown.js');
 const route=makeRoute(life),solids=city.layout('interior').solids;
 const poses=new Set();
 for(let t=0;t<4000;t+=.15){
  const p=route(t);
  for(const id of ['pixel','neon']){
   const pose=activityPose(id,p,life);
   if(!pose)continue;
   const [x,z]=city.toWorld(pose.x,pose.z);
   assert.ok(!solids.some(s=>s.position[1]-s.size[1]/2<1.6&&Math.abs(x-s.position[0])<s.size[0]/2+.21&&Math.abs(z-s.position[2])<s.size[2]/2+.21));
   if(p.kind==='vr'&&p.elapsed>30&&p.remaining>30){
    if(id==='neon')assert.ok(pose.bar);
    else{assert.deepEqual([pose.x,pose.z],[-12.6,32.4]);poses.add(pose.clip);}
   }
   if(p.kind==='arcade'&&p.elapsed>3&&p.remaining>3)assert.equal(!!pose.controls,id==='neon');
  }
 }
 assert.deepEqual([...poses].sort(),['idle','sz-bananaf','sz-cowgirlf','sz-doggyf','sz-missf','sz-pgf','sz-rodeof','sz-teddyf']);
});

test('authored VR visit uses the same timing for late joiners and zero-weight sequences stay disabled',()=>{
 const {activityPose,makeRoute,validVR,vrDefaults}=require('../void-runner/pixel-neon.js');
 const c={...vrDefaults,duration:80,yaw:-20,x:-12.75,sequences:[{clips:['missf'],speed:1,weight:0},{clips:['missf','doubleactf1'],enabled:[false,true],speed:1.5,weight:3}]};
 assert.ok(validVR(c));assert.equal(validVR({...c,sequences:[]}),false);
 const route=makeRoute(life,c),other=makeRoute(life,structuredClone(c));let samples=0;
 for(let t=0;t<3000;t+=1.5){
  const p=route(t);if(p.kind!=='vr')continue;
  assert.ok(Math.abs(p.elapsed+p.remaining-80)<1e-8);
  const a=activityPose('pixel',p,life,c);if(!a.vr)continue;
  assert.equal(a.x,c.x);assert.equal(a.yaw,-20*Math.PI/180);
  assert.deepEqual(a,activityPose('pixel',other(t),life,c));
  if(a.clip==='idle')continue;
  assert.equal(a.clip,'sz-doggyf');assert.ok(a.phase>=0&&a.phase<1);samples++;
 }
 assert.ok(samples>30);
});

test('accepted suggestions choose the next route, with one extra round per visit',()=>{
 const shared=require('../void-runner/shared-activities.js');
 const {stops,vrDefaults}=require('../void-runner/pixel-neon.js');
 const route=makeRoute(life,vrDefaults,data);
 const proposals=new Set(route.legs.filter(l=>l.decision).map(l=>l.decision.entry.id));
 for(const e of data.filter(e=>e.behavior.destination))assert.ok(proposals.has(e.id),e.id);
 const visits=shared.plan(stops,data,{'pn-night-vr-next':{destination:'bar'}});
 const choice=visits.find(v=>v.decision?.entry.id==='pn-night-vr-next');
 assert.equal(choice.next.kind,'bar');
 assert.equal(visits[visits.indexOf(choice)+1].place.kind,'bar');
 for(const leg of route.legs.filter(l=>l.place?.kind==='arcade'&&l.decision?.rule.destination==='arcade')){
  assert.ok(leg.end-leg.start-leg.decisionAt>40);
 }
 assert.ok(visits.length<=3*stops.length*2);
});

test('context and timing keep recordings with their actors and activities',()=>{
 const a=require('../void-runner/shared-activities.js');
 const ctx={venue:'bar',elapsed:30,remaining:60,split:false};
 const vrLine=data.find(e=>e.id==='pn-brief-bar-2');
 assert.equal(a.eligible(vrLine,vrLine.behavior,ctx),false);
 assert.ok(a.eligible(vrLine,vrLine.behavior,{...ctx,split:true}));
 const exit=data.find(e=>e.id==='pn-store-new-exit-1');
 assert.equal(a.eligible(exit,exit.behavior,{...ctx,venue:'store',completed:false}),false);
 assert.ok(a.eligible(exit,exit.behavior,{...ctx,venue:'store',admin:true,completed:true,remaining:30}));
 assert.ok(a.valid({'pn-night-vr-next':{destination:'store',delay:5}}));
 assert.equal(a.valid({'pn-night-vr-next':{delay:-1}}),false);
 assert.deepEqual(a.conversationAt(data,{},ctx,1000,1),a.conversationAt(data,{},structuredClone(ctx),1000,1));
});

test('authored trigger times change departure and retain the remaining recorded lines en route',()=>{
 const e=data.find(e=>e.id==='pn-night-vr-next'),api=require('../void-runner/pixel-neon.js');
 function transition(when){
  const route=api.makeRoute(life,api.vrDefaults,data,{[e.id]:{when,delay:2}});
  const leg=route.legs.find(l=>l.place&&l.decision?.entry.id===e.id);
  return {route,leg,duration:leg.end-leg.start-leg.decisionAt};
 }
 const early=transition('start'),late=transition('finish');
 assert.ok(Math.abs(early.duration-2)<1e-9);assert.ok(late.duration>early.duration);
 const traveling=early.route(early.leg.end+.1);
 assert.equal(traveling.kind,'district');assert.equal(traveling.decision.entry.id,e.id);
 assert.ok(traveling.decisionAt<0);
});

test('animation sequences respect the assigned speaker, clip lengths and trigger delay',()=>{
 const a=require('../void-runner/shared-activities.js'),e=data[0];
 const rule={when:'start',actor:'neon',delay:2,motions:['look','wave']};
 assert.ok(a.valid({[e.id]:rule}));
 assert.equal(a.motionAt(rule,e,1,'neon',()=>1),null);
 assert.equal(a.motionAt(rule,e,2.4,'pixel',()=>1),null);
 assert.equal(a.motionAt(rule,e,2.4,'neon',()=>1),'look');
 assert.equal(a.motionAt(rule,e,3.4,'neon',()=>1),'wave');
 assert.equal(a.motionAt(rule,e,4.4,'neon',()=>1),null);
});
test('Door 35 residents share their commute and return to their own apartments',()=>{
 const A=require('../void-runner/apartments.js'),N=require('../void-runner/neochinatown.js');
 const cross=require('../void-runner/crosswalks.js'),escort=require('../void-runner/npc-escort.js');
 const api=require('../void-runner/pixel-neon.js'),paths={};
 for(const [id,record] of Object.entries(A.districtPair)){
  const home=record.residence,door=A.door(home.door);
  assert.equal(door.number,35);
  assert.equal(A.slotNumber(home.slot,door.style),id==='pixel'?103:104);
  paths[id]=life.tactaRoute(door,N,cross,escort,A,home.slot,api.stops[0].at);
  assert.deepEqual(paths[id].street[0],door.front);
  assert.ok(paths[id].interior.at(-1).every((v,i)=>Math.abs(v-N.toWorld(...api.stops[0].at)[i])<1e-6));
 }
 const sample=api.homeSchedule(life,paths),phases=[];
 for(let s=1;s<1200;s++){
  const pixel=sample('pixel',s,5),neon=sample('neon',s,5);
  assert.equal(pixel.area,neon.area);
  const phase=pixel.phase==='home'?'rest':pixel.area||'visit';
  if(phases.at(-1)!==phase)phases.push(phase);
  if(phases.length>1&&phase==='visit')break;
 }
 assert.deepEqual(phases,['visit','interior','street','hall','flat','rest','flat','hall','street','interior','visit']);
});
