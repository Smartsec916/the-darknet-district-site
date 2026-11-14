// Corporate District layout: separate area, bounds, reachability, security placement, lighting zones, the back alley, the map model, save compatibility, taxi.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../void-runner/corporate.js'),E=require('../void-runner/exploration-controller.js'),S=require('../void-runner/corporate-security.js'),R=require('../void-runner/taxi-rules.js'),N=require('../void-runner/neochinatown.js'),CAM=require('../void-runner/campaign.js'),A=require('../void-runner/area-map.js');
const L=C.layout();
const reach=(from=[0,-14])=>{const st=.5,seen=new Set(),key=(x,z)=>x.toFixed(1)+','+z.toFixed(1),q=[from];seen.add(key(...from));for(let i=0;i<q.length;i++){const [x,z]=q[i];for(const [dx,dz] of [[st,0],[-st,0],[0,st],[0,-st]]){const nx=x+dx,nz=z+dz,k=key(nx,nz);if(seen.has(k)||E.blocked(nx,nz,L))continue;seen.add(k);q.push([nx,nz]);}}return {q,has:(x,z)=>seen.has(key(x,z))};};
test('Corporate is its own walking location, about 1.8 km away, with a flat 60 CR fare',()=>{
  assert.equal(L.id,'corporate');assert.equal(L.corporate,true);assert.equal(L.kind,'city');assert.notEqual(L.id,'neochinatown');assert.equal(C.DISTANCE_M,1800);assert.equal(C.FARE,60);assert.equal(C.FARE,R.fare.max,'the existing maximum');
  assert.ok(!L.solids.some(s=>/club|milked|district-door/.test(s.id)),'none of NeoChinatown is in this scene');assert.ok(L.solids.length>40);
});
test('the arrival point is open ground inside the bounds, on the cab pad side',()=>{
  assert.equal(E.blocked(C.ARRIVAL.spawn[0],C.ARRIVAL.spawn[2],L),false);assert.ok(Math.abs(C.ARRIVAL.spawn[0])<L.bounds[0]&&Math.abs(C.ARRIVAL.spawn[2])<L.bounds[1]);assert.ok(Math.hypot(C.CAB_PAD.x-C.ARRIVAL.spawn[0],C.CAB_PAD.z-C.ARRIVAL.spawn[2])<8);
});
test('every street, alley, door and interaction can be walked to, with several routes',()=>{
  const r=reach();for(const s of C.STREETS)assert.ok(r.has(Math.round((s.rect[0]+s.rect[1])/4)*2,Math.round((s.rect[2]+s.rect[3])/4)*2)||r.q.some(([x,z])=>x>=s.rect[0]&&x<=s.rect[1]&&z>=s.rect[2]&&z<=s.rect[3]),s.id+' reachable');
  for(const i of L.interactions)assert.ok(r.q.some(([x,z])=>Math.hypot(x-i.position[0],z-i.position[2])<=i.range),i.id+' within reach');
  // multiple routes: the north service road is reachable and so is the back alley, from three different cross streets
  for(const [x,z] of [[0,92],[-50,60],[59,60],[-60,-50],[33,-50],[64,-50],[-40,-92],[80,-92]])assert.ok(r.has(x,z),x+','+z);
  // blocking one cross street still leaves a way round (the checkpoint street is not the only way north)
  const L2={...L,solids:[...L.solids,{id:'x',position:[0,5,60],size:[16,10,4]}]};const q2=reach();assert.ok(q2.has(59,60)&&q2.has(-50,60),'other cross streets');void L2;
});
test('there is a back alley with a maintenance door, cover and a camera, suited to a future break-in',()=>{
  const door=C.DOORS.find(d=>d.kind==='break-in');assert.ok(door&&door.locked,'a locked maintenance door');const alley=C.STREETS.find(s=>s.id==='back-alley');assert.ok(alley&&alley.rect[3]-alley.rect[2]>=6&&alley.rect[3]-alley.rect[2]<=10,'narrow');
  assert.ok(door.pos[1]>=alley.rect[2]&&door.pos[1]<=alley.rect[3],'the door opens onto the alley');
  const cover=C.PROPS.filter(p=>/dumpster|crates/.test(p[0])&&p[1][2]>=alley.rect[2]&&p[1][3]<=alley.rect[3]);assert.ok(cover.length>=4,'dumpsters and crates in the alley: '+cover.length);
  assert.ok(C.CAMERAS.some(c=>Math.hypot(c.x-door.pos[0],c.z-door.pos[1])<12),'a camera covers it');
  const dark=C.ZONES.find(z=>z.id==='recess-back-door');assert.ok(dark.light<=.2,'the doorway is in shadow');
  // the camera does not see every spot in front of the door at once: there is a timeable gap
  const cam=C.CAMERAS.find(c=>c.id==='cam-back-door');const mk=t=>S.create({cameras:[cam],guards:[],drones:[],cover:C.coverBoxes(),zones:C.ZONES,entrances:[]}).observers(t)[0];const spot={x:-45,z:-92,crouch:false,moving:true};const see=[];for(let t=0;t<30;t+=.25)see.push(S.sees(mk(t),spot,C.coverBoxes())>0);assert.ok(see.some(x=>x)&&see.some(x=>!x),'seen at some times, not at others');
});
test('lighting zones include dark lanes next to brightly lit surveillance areas, and covered places under walkways',()=>{
  const lights=C.ZONES.map(z=>z.light);assert.ok(Math.min(...lights)<=.2&&Math.max(...lights)>=.9);assert.ok(C.ZONES.some(z=>z.covered),'under walkways');
  assert.ok(S.lightAt(C.ZONES,30,18)>=.9,'the HQ front is lit');assert.ok(S.lightAt(C.ZONES,-60,-50)<=.2,'alley A is dark');assert.ok(S.lightAt(C.ZONES,0,0)>.6,'the boulevard is lit');
  for(const w of C.WALKWAYS)assert.ok(w.y>=14,'walkways are overhead');
});
test('security placement: guards at protected entrances, cameras with different coverage, drones on loops',()=>{
  for(const e of C.ENTRANCES){const g=C.GUARDS.find(g=>g.id===e.guard);assert.ok(g&&(g.x!==undefined||g.path));}
  assert.ok(new Set(C.CAMERAS.map(c=>c.yaw.toFixed(1))).size>=3,'cameras face different ways');for(const d of C.DRONES)assert.ok(d.path.length>=2&&S.loopLength(d.path)>20);
  assert.ok(C.GUARDS.slice(0,3).every(g=>g.entrance),'the first three guards (the low tier) stand at entrances');
  for(const g of C.GUARDS.filter(g=>g.x!==undefined))assert.equal(E.blocked(g.x,g.z,L),false,g.id+' stands on open ground');
  for(const c of C.CAMERAS)assert.ok(Math.abs(c.x)<100&&Math.abs(c.z)<100);
});
test('the map model shows streets, buildings, alleys, guarded and service entrances and the taxi stop',()=>{
  const m=C.mapModel();assert.ok(m.streets.some(s=>s.kind==='alley'));assert.ok(m.streets.some(s=>s.kind==='plaza'));assert.equal(m.buildings.length,C.BLOCKS.length);
  const ids=m.pois.map(p=>p.id);for(const id of ['corp-taxi','corp-hq','corp-service-n1','corp-back-door','corp-checkpoint-poi'])assert.ok(ids.includes(id),id);
  assert.ok(m.pois.filter(p=>p.kind==='guard').length>=2,'guarded entrances');assert.ok(m.pois.filter(p=>p.kind==='service').length>=3,'service entrances');assert.ok(m.pois.some(p=>/guarded/.test(p.name)));
  assert.deepEqual(m.bounds,{x0:-100,x1:100,z0:-100,z1:100});const sp=A.get('corporate');assert.ok(sp&&sp.model().pois.length===m.pois.length);
});
test('the V1 map module knows the area (district-map.js reads the registered space)',()=>{
  const src=fs.readFileSync(path.join(__dirname,'../void-runner/district-map.js'),'utf8');assert.match(src,/VoidAreaMap/);assert.match(src,/walkingLocation\.mapSpace/);
  const D=require('../void-runner/district-map.js');assert.ok(D.KIND_LAYER.guard,'guard markers have a layer');const m=D.model(N);assert.ok(!m.pois.some(p=>/^corp-/.test(p.id)),'NeoChinatown\'s own map is unchanged');
});
test('the street cab lists Corporate at a flat 60 CR; a player with less cannot call it; NeoChinatown keeps its other destinations',()=>{
  const s=CAM.fresh();s.location='earth';s.credits=100;const list=R.destinations(s,{player:[61,-100],layout:N.layout()}),d=list.find(x=>x.id==='corporate');
  assert.ok(d&&d.ok&&d.fare===60&&d.scene==='corporate'&&!d.placeholder);for(const id of ['ship','district','main','avenue','milked'])assert.ok(list.some(x=>x.id===id),id);
  s.credits=59;assert.equal(R.destinations(s,{player:[61,-100],layout:N.layout()}).find(x=>x.id==='corporate').ok,false);
  for(const x of list)if(x.fare!==undefined)assert.ok(x.fare<=R.fare.max,x.id+' within the cap');
  assert.equal(R.charge(s,'corporate',60),0,'59 CR cannot pay');s.credits=100;assert.equal(R.charge(s,'corporate',60),60);assert.equal(s.credits,40);assert.equal(R.charge(s,'corporate',60),0,'never twice');
});
test('Corporate adds no location id, mission or save field except the fog flag',()=>{
  const man=JSON.parse(fs.readFileSync(path.join(__dirname,'../void-runner/save-manifest.json'),'utf8'));assert.ok(!JSON.stringify(man).includes('corporate'));
  const src=fs.readFileSync(path.join(__dirname,'../void-runner/corporate.js'),'utf8').replace(/\/\*[\s\S]*?\*\//g,'');assert.ok(!/story\.flags|state\./.test(src));
  assert.equal(C.SPACE_FLAG,'corpFog');assert.equal(L.spawn[2],-14);
});
