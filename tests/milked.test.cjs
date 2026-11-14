// MILKED: an adult livestreaming service and sperm bank (not a nightclub). Identity, characters, rooms, taxi, map, the inactive mission and reachability.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const MK=require('../void-runner/milked.js'),N=require('../void-runner/neochinatown.js'),E=require('../void-runner/exploration-controller.js'),R=require('../void-runner/taxi-rules.js'),C=require('../void-runner/campaign.js'),Map_=require('../void-runner/district-map.js');
const src=fs.readFileSync(path.join(__dirname,'../void-runner/milked.js'),'utf8');
const code=src.replace(/\/\*[\s\S]*?\*\//g,'').replace(/(^|[^:'"])\/\/.*$/gm,'$1');
const reach=L=>{const S=.5,seen=new Set(),key=(x,z)=>x.toFixed(1)+','+z.toFixed(1),q=[[L.spawn[0],L.spawn[2]]];seen.add(key(...q[0]));for(let i=0;i<q.length;i++){const [x,z]=q[i];for(const [dx,dz] of [[S,0],[-S,0],[0,S],[0,-S]]){const nx=x+dx,nz=z+dz,k=key(nx,nz);if(seen.has(k)||E.blocked(nx,nz,L))continue;seen.add(k);q.push([nx,nz]);}}return q;};
const near=(cells,x,z,r)=>cells.some(([a,b])=>Math.hypot(a-x,b-z)<=r);

test('Milked is an adult livestreaming service and sperm bank, and it is not a nightclub',()=>{
  assert.equal(MK.CONFIG.NAME,'MILKED');assert.equal(MK.CONFIG.NIGHTCLUB,false);assert.match(MK.CONFIG.BUSINESS,/livestream/);assert.match(MK.CONFIG.BUSINESS,/sperm bank/);
  assert.ok(!/nightclub|dance floor|dj/i.test(MK.ROOMS.map(r=>r.name).join(' ')),'no nightclub rooms');
  assert.ok(!/ncz-nightclub|VoidNightclub|club-/.test(src.replace(/\/\*[\s\S]*?\*\//,'').replace(/\/\/.*$/gm,'')),'it does not reuse the nightclub module');
});
test('Eva and Fish have their own ids, separate from the VR companion Eva',()=>{
  const {eva,fish}=MK.MODELS,vr=require('../void-runner/vr-companions.js').list().map(c=>c.id);
  assert.equal(eva.id,'milked-eva');assert.equal(fish.id,'milked-fish');assert.notEqual(eva.id,fish.id);for(const id of [eva.id,fish.id])assert.ok(!vr.includes(id)&&id!=='eva');
  assert.match(eva.role,/MILKED/);assert.ok(MK.DIALOGUE.eva.greeting.some(l=>/perform|camera/.test(l)),'Eva keeps her Origins history as a performer');assert.ok(MK.DIALOGUE.eva.greeting.some(l=>/neural/.test(l)),'and as a neural-network engineer');
  assert.equal(MK.CONFIG.PROVISIONAL,true,'dialogue is provisional until approved');
});
test('Fish\'s name comes from one configurable value',()=>{
  assert.equal(MK.CONFIG.FISH_NAME,'Fish');assert.equal(MK.MODELS.fish.name,MK.CONFIG.FISH_NAME);
  assert.equal((src.match(/FISH_NAME:'Fish'/g)||[]).length,1,'the literal is written once');
  const load=name=>{const m={exports:{}};vm.runInNewContext(src.replace("FISH_NAME:'Fish'","FISH_NAME:'"+name+"'"),{module:m,globalThis:{}});return m.exports;};
  const other=load('Gus');assert.equal(other.MODELS.fish.name,'Gus');assert.equal(other.INTERACTIONS.find(i=>i.id==='milked-fish').label,'TALK TO GUS');assert.ok(other.PLACES.some(p=>/Gus's office/.test(p.name)));
});
test('each character has one documented model replacement point and a clothed placeholder',()=>{
  for(const m of [MK.MODELS.eva,MK.MODELS.fish]){assert.equal(m.asset,null,'no real model yet');assert.ok(m.look&&m.look.length,'a placeholder look');assert.match(m.note,/REPLACEMENT POINT/);}
  assert.match(src,/WHERE TO CHANGE THINGS/);assert.match(src,/MODELS\.eva/);
});
test('Milked is a built taxi destination with a fare under the cap, and the other future districts are still placeholders',()=>{
  const d=N.districts.find(d=>d.id==='milked');assert.ok(d&&!d.placeholder&&d.built);for(const id of ['corporate','containers'])assert.ok(N.districts.find(x=>x.id===id).placeholder);
  const z=N.taxiZones.find(z=>z.id==='milked');assert.ok(z);assert.ok(!(z.position[0]>=MK.FOOTPRINT[0]&&z.position[0]<=MK.FOOTPRINT[1]),'the cab lands on the plaza, not in the building');
  const s=C.fresh();s.location='earth';s.credits=100;const dest=R.destinations(s,{player:[61,-100],layout:N.layout()}).find(x=>x.id==='milked');
  assert.ok(dest.ok&&dest.fare>0&&dest.fare<=R.fare.max&&!dest.placeholder&&dest.streams);
  const l=R.destinations(s,{player:[61,-100],layout:N.layout()});assert.equal(l.filter(x=>x.placeholder).length,2);
});
test('the map lists the building, its named places and the taxi stop',()=>{
  const m=Map_.model(N);assert.ok(m.buildings.some(b=>b.id==='milked'&&b.rect===N.footprints.milked));
  for(const k of ['reception','streaming','clinical','office'])assert.ok(m.pois.some(p=>p.id==='milked-'+k),k);assert.ok(m.pois.some(p=>p.id==='taxi-milked'));assert.ok(!m.pois.some(p=>p.id==='dev-milked'),'no longer a "not built" placeholder');
  for(const p of MK.PLACES){const room=MK.roomAt(p.x,p.z);assert.ok(room||p.id==='milked-entrance',p.id+' is inside a room');}
});
test('mission 3 is data only and inactive; the beginner missions are untouched',()=>{
  const m=MK.MISSION;assert.equal(m.id,'meet-eva-milked');assert.equal(m.title,'MEET EVA AT MILKED');assert.equal(m.number,3);assert.equal(m.active,false);assert.equal(m.npc,'milked-eva');assert.equal(m.location,'milked');assert.ok(m.objective&&m.steps.length);
  const B=require('../void-runner/beginner.js'),V=require('../void-runner/mission-log.js');
  assert.equal(Object.keys(B.MISSIONS).length,6);assert.ok(!B.MISSIONS[m.id]&&!V.definitions[m.id],'nothing registers it');
  assert.ok(!/VoidMissions|register\(/.test(code),'milked.js never touches the mission manager');
});
test('the streaming wing and the biobank wing are registered as separate rooms',()=>{
  const by=w=>MK.ROOMS.filter(r=>r.wing===w);assert.equal(by('streaming').filter(r=>r.kind==='studio').length,3);assert.ok(by('streaming').some(r=>r.id==='ops'));
  for(const id of ['biobank','consult','lab'])assert.ok(by('clinical').some(r=>r.id===id),id);assert.ok(MK.ROOMS.some(r=>r.id==='lobby')&&MK.ROOMS.some(r=>r.id==='office'));
  const [fx0,fx1,fz0,fz1]=MK.FOOTPRINT;for(const r of MK.ROOMS){assert.ok(r.rect[0]>=fx0&&r.rect[1]<=fx1&&r.rect[2]>=fz0&&r.rect[3]<=fz1,r.id+' is inside the building');}
  assert.equal(MK.roomAt(218,11).id,'studio-1');assert.equal(MK.roomAt(241,-20).id,'lab');assert.equal(MK.roomAt(224,-38).id,'office');
});
test('the building keeps clear of the landing pad, the avenue and the other streets',()=>{
  const ov=(a,b)=>a[0]<b[1]&&a[1]>b[0]&&a[2]<b[3]&&a[3]>b[2];
  for(const id of ['pad','avenue','main','alley','road','passage','avenueEast','mainSouth','avenueWest'])assert.ok(!ov(MK.FOOTPRINT,N.streets[id]),id);
  assert.ok(!ov(MK.FOOTPRINT,[13,37.5,-106,-86]),'the landing pad stays clear');assert.ok(!ov(MK.FOOTPRINT,N.footprints.district));
  assert.ok(MK.FOOTPRINT[1]<=N.cityBox[1]&&MK.FOOTPRINT[3]<=N.cityBox[3],'inside the walled city');
});
test('every room and every interaction can be walked to; the desk, walls and the staff door are solid',()=>{
  const L=N.layout(),cells=reach(L);
  for(const i of L.interactions.filter(i=>/^milked-/.test(i.id)))assert.ok(near(cells,i.position[0],i.position[2],i.range),i.id+' within reach');
  for(const r of MK.ROOMS)assert.ok(near(cells,(r.rect[0]+r.rect[1])/2,(r.rect[2]+r.rect[3])/2,3),r.id+' reachable');
  assert.equal(E.blocked(212,-12.5,L),false,'the doorway is open');assert.equal(E.blocked(212,-6,L),true,'the wall beside it is solid');assert.equal(E.blocked(229,-12.5,L),true,'the desk is solid');assert.equal(E.blocked(242.2,-26,L),true,'the staff door is solid');
});
test('Milked adds no save fields, no location id and no mission',()=>{
  const man=JSON.parse(fs.readFileSync(path.join(__dirname,'../void-runner/save-manifest.json'),'utf8'));assert.ok(!JSON.stringify(man).includes('milked'));
  assert.ok(!/state\.|story\.flags/.test(code),'the presentation module touches no game state');
});
test('every interaction has a registered handler in the integration script',()=>{
  const integ=fs.readFileSync(path.join(__dirname,'../void-runner/milked-integration.js'),'utf8');
  for(const a of new Set(MK.INTERACTIONS.map(i=>i.action)))assert.ok(integ.includes("R('"+a+"'"),a);
});
