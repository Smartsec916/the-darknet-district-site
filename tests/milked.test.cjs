// MILKED: a small adult livestreaming production studio on a side street off Main Street (not a nightclub, clinic or laboratory). Identity, characters, rooms, studios, taxi, map, the inactive mission and reachability.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const MK=require('../void-runner/milked.js'),N=require('../void-runner/neochinatown.js'),E=require('../void-runner/exploration-controller.js'),R=require('../void-runner/taxi-rules.js'),C=require('../void-runner/campaign.js'),Map_=require('../void-runner/district-map.js');
const src=fs.readFileSync(path.join(__dirname,'../void-runner/milked.js'),'utf8');
const code=src.replace(/\/\*[\s\S]*?\*\//g,'').replace(/(^|[^:'"])\/\/.*$/gm,'$1');
const reach=L=>{const S=.5,seen=new Set(),key=(x,z)=>x.toFixed(1)+','+z.toFixed(1),q=[[L.spawn[0],L.spawn[2]]];seen.add(key(...q[0]));for(let i=0;i<q.length;i++){const [x,z]=q[i];for(const [dx,dz] of [[S,0],[-S,0],[0,S],[0,-S]]){const nx=x+dx,nz=z+dz,k=key(nx,nz);if(seen.has(k)||E.blocked(nx,nz,L))continue;seen.add(k);q.push([nx,nz]);}}return q;};
const near=(cells,x,z,r)=>cells.some(([a,b])=>Math.hypot(a-x,b-z)<=r);

const ov=(a,b)=>a[0]<b[1]&&a[1]>b[0]&&a[2]<b[3]&&a[3]>b[2];
const strings=o=>typeof o==='string'?[o]:o&&typeof o==='object'?Object.values(o).flatMap(strings):[];

test('Milked is a small adult livestreaming production studio: not a nightclub, and nothing is collected or treated on site',()=>{
  assert.equal(MK.CONFIG.NAME,'MILKED');assert.equal(MK.CONFIG.NIGHTCLUB,false);assert.equal(MK.CONFIG.ON_SITE_COLLECTION,false);assert.match(MK.CONFIG.BUSINESS,/small adult livestreaming production/);
  assert.ok(!/nightclub|dance floor|dj|bar\b/i.test(MK.ROOMS.map(r=>r.name).join(' ')),'no nightclub rooms');
  assert.ok(!/ncz-nightclub|VoidNightclub|club-/.test(src.replace(/\/\*[\s\S]*?\*\//,'').replace(/\/\/.*$/gm,'')),'it does not reuse the nightclub module');
});
test('the biobank, the consultation room, the laboratory, cryogenic storage and the appointment systems are gone',()=>{
  const gone=/biobank|sperm|clinic|consult|laborator|\blab\b|cryo|centrifuge|sample|specimen|appointment kiosk|check-in kiosk|medical|chain of custody|inventory/i;
  assert.ok(!gone.test(code),'nothing clinical is left in milked.js: '+(code.match(gone)||[''])[0]);
  const integ=fs.readFileSync(path.join(__dirname,'../void-runner/milked-integration.js'),'utf8');assert.ok(!gone.test(integ),'nor in the interaction handlers');
  for(const t of [...strings(MK.DIALOGUE),...strings(MK.MISSION),...MK.ROOMS.map(r=>r.name),...MK.INTERACTIONS.map(i=>i.label),...MK.PLACES.map(p=>p.name)])assert.ok(!gone.test(t),t);
  assert.ok(!MK.ROOMS.some(r=>r.wing==='clinical'||/^(biobank|consult|lab)$/.test(r.id)));assert.equal(MK.PLAZA,undefined,'the plaza is gone');
  assert.ok(MK.DIALOGUE.eva.greeting.some(l=>/watch from home/.test(l)),'Eva says the audience is at home');
});
test('Eva and Fish have their own ids, separate from the VR companion Eva',()=>{
  const {eva,fish}=MK.MODELS,vr=require('../void-runner/vr-companions.js').list().map(c=>c.id);
  assert.equal(eva.id,'milked-eva');assert.equal(fish.id,'milked-fish');assert.notEqual(eva.id,fish.id);for(const id of [eva.id,fish.id])assert.ok(!vr.includes(id)&&id!=='eva');
  assert.match(eva.role,/MILKED/);assert.ok(MK.DIALOGUE.eva.greeting.some(l=>/perform|camera/.test(l)),'Eva keeps her Origins history as a performer');assert.ok(MK.DIALOGUE.eva.greeting.some(l=>/neural/.test(l)),'and as a neural-network engineer');
  assert.equal(MK.CONFIG.PROVISIONAL,true,'dialogue is provisional until approved');
  assert.equal(MK.roomAt(...eva.at).id,'reception','Eva is at the reception desk');assert.equal(MK.roomAt(...fish.at).id,'office','Fish is in his office');
});
test('Fish\'s name comes from one configurable value',()=>{
  assert.equal(MK.CONFIG.FISH_NAME,'Fish');assert.equal(MK.MODELS.fish.name,MK.CONFIG.FISH_NAME);
  assert.equal((src.match(/FISH_NAME:'Fish'/g)||[]).length,1,'the literal is written once');
  const load=name=>{const m={exports:{}};vm.runInNewContext(src.replace("FISH_NAME:'Fish'","FISH_NAME:'"+name+"'"),{module:m,globalThis:{}});return m.exports;};
  const other=load('Gus');assert.equal(other.MODELS.fish.name,'Gus');assert.equal(other.INTERACTIONS.find(i=>i.id==='milked-fish').label,'TALK TO GUS');assert.ok(other.PLACES.some(p=>/Gus's office/.test(p.name)));assert.ok(other.ROOMS.some(r=>r.name==='Gus\'s office'));
});
test('each character has one documented model replacement point and a clothed placeholder',()=>{
  for(const m of [MK.MODELS.eva,MK.MODELS.fish]){assert.equal(m.asset,null);assert.ok(m.look&&m.look.length,'a look');}
  assert.match(MK.MODELS.eva.note,/REPLACEMENT POINT/,'Eva still waits for her own model');
  // Fish has her own model (16 Nov 2026): the file is in the repository and carries the clips her spot plays
  assert.equal(MK.MODELS.fish.look,'npc-fish');assert.ok(require('node:fs').existsSync(require('node:path').join(__dirname,'..','void-runner','assets','models','crowd','npc-fish.glb')));for(const c of MK.MODELS.fish.clips)assert.ok(require('../void-runner/crowd.js').clips['npc-fish'].includes(c),c);
  assert.match(src,/WHERE TO CHANGE THINGS/);assert.match(src,/MODELS\.eva/);
});
test('it is a small building on a quiet side street off Main Street, built into the block, with a service alley behind',()=>{
  const [x0,x1,z0,z1]=MK.FOOTPRINT,S=N.streets;assert.ok((x1-x0)*(z1-z0)<=400,'a small footprint (it was over 2,200 square metres)');assert.ok(x1-x0<=22&&z1-z0<=20);
  assert.deepEqual(S.milkedLane,MK.LANE);assert.deepEqual(S.milkedAlley,MK.ALLEY);assert.equal(S.milked,undefined,'the old plaza street is gone');assert.equal(N.footprints.milked,MK.FOOTPRINT);
  // the side street: narrow, a dead end, opening onto Main Street's east side; the front door is on it
  assert.equal(MK.LANE[0],S.main[1],'the side street starts at Main Street');assert.ok(MK.LANE[3]-MK.LANE[2]<=6.5,'narrow');assert.equal(MK.LANE[2],z1,'the building fronts the side street');assert.equal(MK.DOOR.z,z1);assert.ok(MK.DOOR.x>x0&&MK.DOOR.x<x1);
  assert.ok(x0-S.main[1]>=5,'it is not on Main Street itself: another building stands on the corner');
  // the service alley: behind the building, back to Main Street; the rear door is on it
  assert.equal(MK.ALLEY[3],z0,'the alley runs along the back wall');assert.equal(MK.ALLEY[0],S.main[1],'and returns to Main Street');assert.ok(MK.ALLEY[3]-MK.ALLEY[2]>=3&&MK.ALLEY[3]-MK.ALLEY[2]<=4.5);assert.equal(MK.REAR.z,z0);assert.ok(MK.ALLEY[1]>MK.REAR.x+1);
  // nothing else is cut into
  for(const id of ['pad','avenue','main','alley','road','passage','avenueEast','mainSouth','avenueWest'])for(const r of [MK.FOOTPRINT,MK.LANE,MK.ALLEY])assert.ok(!ov(r,S[id])||(id==='main'&&r!==MK.FOOTPRINT&&r[0]===S.main[1]),id);
  for(const r of [MK.FOOTPRINT,MK.LANE,MK.ALLEY]){for(const f of ['district','terrace']){const [a,b,c,d]=N.footprints[f];assert.ok(!ov(r,[a-1,b+1,c-1,d+1]),f+' keeps a wall of city block between');}assert.ok(!ov(r,[18,51,-68.5,-48.5]),'clear of the nightclub');assert.ok(!ov(r,[13,37.5,-106,-86]),'clear of the landing pad');}
  assert.ok(!ov(MK.LANE,MK.ALLEY)&&MK.LANE[2]-S.alley[2]<-5,'the side street is its own street, south of the alley to the District');
});
test('the front entrance is a small double-door vestibule of its own',()=>{
  const [x0,x1,z0,z1]=MK.VESTIBULE;assert.ok(x1-x0<=4.5&&z1-z0<=3,'small');assert.equal(z1,MK.DOOR.z,'against the front wall');assert.equal(MK.INNER.z,z0);assert.equal(MK.INNER.x,MK.DOOR.x,'two doors in line');
  assert.equal(MK.roomAt(MK.DOOR.x,(z0+z1)/2).id,'vestibule');assert.ok(!/district-door|district-inner-door|vestibule-(east|west)'/.test(code),'it shares nothing with The Darknet District\'s vestibule');
  assert.match(code,/green scan frame|vest-ceiling/);assert.ok(MK.INTERACTIONS.some(i=>i.id==='milked-intercom'));
});
test('Milked is a built taxi destination; the cab sets down on Main Street, not in the side street',()=>{
  const d=N.districts.find(d=>d.id==='milked');assert.ok(d&&!d.placeholder&&d.built);assert.deepEqual(d.rect,MK.FOOTPRINT);assert.ok(N.districts.find(x=>x.id==='containers').placeholder);assert.ok(N.districts.find(x=>x.id==='corporate').built);
  const z=N.taxiZones.find(z=>z.id==='milked'),[zx,zz]=z.position,m=N.streets.main;assert.ok(zx>m[0]+2&&zx<m[1]-2&&zz>m[2]&&zz<m[3],'the stop is on Main Street');
  assert.ok(Math.abs(zz-(MK.LANE[2]+MK.LANE[3])/2)<12,'near the mouth of the side street');for(const o of N.taxiZones.filter(o=>o.id!=='milked'))assert.ok(Math.hypot(o.position[0]-zx,o.position[1]-zz)>8,'clear of '+o.id);
  const s=C.fresh();s.location='earth';s.credits=100;const dest=R.destinations(s,{player:[40,-12.5],layout:N.layout()}).find(x=>x.id==='milked');
  assert.ok(dest.ok&&dest.fare>0&&dest.fare<=R.fare.max&&!dest.placeholder&&dest.streams);
  const l=R.destinations(s,{player:[40,-12.5],layout:N.layout()});assert.equal(l.filter(x=>x.placeholder).length,1);
  // road taxis keep to the roads they already drive: they never turn into the side street or the service alley
  const RT=require('../void-runner/road-taxi-rules.js'),rsrc=fs.readFileSync(path.join(__dirname,'../void-runner/road-taxi-rules.js'),'utf8');assert.ok(!/milkedLane|milkedAlley/.test(rsrc));
  for(const st of RT.stops())assert.ok(!ov([st.position[0],st.position[0],st.position[1],st.position[1]].map((v,i)=>v+(i%2?.01:-.01)),MK.LANE)&&!ov([st.position[0]-.01,st.position[0]+.01,st.position[1]-.01,st.position[1]+.01],MK.ALLEY),st.id);
  assert.ok(RT.stops().some(st=>Math.hypot(st.position[0]-zx,st.position[1]-zz)<=20),'a road-taxi stop on Main Street is within a short walk');
});
test('the map lists the building, its named places and the taxi stop',()=>{
  const m=Map_.model(N);assert.ok(m.buildings.some(b=>b.id==='milked'&&b.rect===N.footprints.milked&&/live broadcast studios/.test(b.name)));
  for(const k of ['entrance','reception','studios','office','rear-door'])assert.ok(m.pois.some(p=>p.id==='milked-'+k),k);assert.ok(m.pois.some(p=>p.id==='taxi-milked'));assert.ok(!m.pois.some(p=>p.id==='dev-milked'),'not a "not built" placeholder');
  for(const p of MK.PLACES){const room=MK.roomAt(p.x,p.z);assert.ok(room||/entrance|rear-door/.test(p.id),p.id+' is inside a room');}
  const e=MK.PLACES.find(p=>p.id==='milked-entrance'),r=MK.PLACES.find(p=>p.id==='milked-rear-door');assert.ok(e.z>MK.LANE[2]&&e.z<MK.LANE[3],'the entrance pin is on the side street');assert.ok(r.z>MK.ALLEY[2]&&r.z<MK.ALLEY[3],'the rear-door pin is in the service alley');
  assert.ok(m.streets.some(s=>s.id==='milkedLane'&&/Side street/.test(s.name))&&m.streets.some(s=>s.id==='milkedAlley'&&/Service alley/.test(s.name)));
});
test('mission 3 is data only and inactive; the beginner missions are untouched',()=>{
  const m=MK.MISSION;assert.equal(m.id,'meet-eva-milked');assert.equal(m.title,'MEET EVA AT MILKED');assert.equal(m.number,3);assert.equal(m.active,false);assert.equal(m.npc,'milked-eva');assert.equal(m.location,'milked');assert.ok(m.objective&&m.steps.length);
  const B=require('../void-runner/beginner.js'),V=require('../void-runner/mission-log.js');
  assert.equal(Object.keys(B.MISSIONS).length,6);assert.ok(!B.MISSIONS[m.id]&&!V.definitions[m.id],'nothing registers it');
  assert.ok(!/VoidMissions|register\(/.test(code),'milked.js never touches the mission manager');
});
test('reception, a narrow hallway with four studios, and a rear staff area are registered as rooms',()=>{
  const by=z=>MK.ROOMS.filter(r=>r.zone===z),ids=MK.ROOMS.map(r=>r.id);
  for(const id of ['vestibule','reception','hallway','office','staff-corridor','dressing-a','dressing-b','restroom-1','restroom-2'])assert.ok(ids.includes(id),id);
  assert.equal(by('studios').filter(r=>r.kind==='studio').length,4);assert.ok(by('staff').some(r=>r.id==='office'&&r.name===MK.CONFIG.FISH_NAME+'\'s office'));
  const [fx0,fx1,fz0,fz1]=MK.FOOTPRINT;for(const r of MK.ROOMS){assert.ok(r.rect[0]>=fx0&&r.rect[1]<=fx1&&r.rect[2]>=fz0&&r.rect[3]<=fz1,r.id+' is inside the building');}
  const h=MK.HALL;assert.ok(Math.min(h[1]-h[0],h[3]-h[2])<=2.2,'the hallway is narrow');assert.equal(MK.roomAt(87.5,-78).id,'studio-1');assert.equal(MK.roomAt(91.5,-85).id,'studio-4');assert.equal(MK.roomAt(95.7,-77).id,'office');
  for(const r of by('studios').filter(r=>r.kind==='studio'))assert.ok(r.rect[2]===h[3]||r.rect[3]===h[2],r.id+' is on the hallway');
  const o=MK.ROOMS.find(r=>r.id==='office').rect;assert.ok(o[0]>=h[1],'the staff area is at the far end of the hallway');
});
test('each studio has exactly one adult dancer, a window and a closed door on the hallway, an ON AIR indicator and its own lighting and set',()=>{
  const Crowd=require('../void-runner/crowd.js'),Lib=require('../void-runner/anim-library.js');
  assert.equal(MK.STUDIOS.length,4);assert.deepEqual(MK.STUDIOS.map(s=>s.n),[1,2,3,4]);
  assert.equal(new Set(MK.STUDIOS.map(s=>s.theme)).size,4,'four different sets');assert.equal(new Set(MK.STUDIOS.map(s=>s.dancer.look)).size,4,'four different figures');
  assert.equal(new Set(MK.STUDIOS.map(s=>s.dancer.clips[0])).size>=3,true,'the dances differ where the figures\' own clips allow');assert.equal(new Set(MK.STUDIOS.map(s=>s.dancer.library)).size,4,'and all four differ with the shared library');
  for(const c of ['pink','green','mixed'])assert.ok(MK.STUDIOS.some(s=>s.light===c),c+' lighting');
  for(const s of MK.STUDIOS){const r=MK.ROOMS.find(q=>q.id===s.room),d=s.dancer;assert.ok(r&&r.kind==='studio'&&r.closed);
   assert.ok(Crowd.clips[d.look],d.look+' is a crowd figure');assert.ok(Crowd.clips[d.look].includes(d.clips[0]),d.look+' really has '+d.clips[0]);assert.match(d.clips[0],/dance/);assert.ok(fs.existsSync(path.join(__dirname,'../void-runner/assets/models/crowd/'+d.look+'.glb')),d.look+' is in the repository');
   assert.ok(Lib.clip(d.library),d.library+' is a library clip');assert.ok(d.id!==MK.MODELS.eva.id&&d.look!==MK.MODELS.eva.look&&d.look!==MK.MODELS.fish.look);
   for(const span of [s.window,s.door])assert.ok(span[0]>=r.rect[0]&&span[1]<=r.rect[1]&&span[1]>span[0]);assert.ok(s.window[1]-s.window[0]>=2,'a real window');assert.ok(s.window[1]<=s.door[0]||s.door[1]<=s.window[0]);
   assert.ok(MK.INTERACTIONS.some(i=>i.action==='milked-studio'&&i.studio===s.n&&MK.roomAt(i.position[0],i.position[2]).id==='hallway'),'watched from the hallway');}
  // the build: one dancer per studio and nobody else in them; no camera operators; an ON AIR sign per studio door
  assert.match(code,/for\(const s of STUDIOS\)spot\(s\.dancer\.id/);assert.equal((code.match(/spot\(/g)||[]).length,3,'Eva, Fish, and the one loop over the studios: nobody else');
  assert.ok(!/performer-|ops-tech|lab-tech|guest-|operator/.test(code));assert.match(code,/ON AIR/);assert.match(src,/fixed cameras on stands/);
});
test('the logo is MILKED followed by three white droplets drawn as shapes, in pink and green',()=>{
  assert.match(code,/const droplets=/);assert.equal((code.match(/const droplets=[^;]*;/)[0].match(/drop\(g/g)||[]).length,0);const d=code.slice(code.indexOf('const droplets='),code.indexOf('const logo='));assert.equal((d.match(/drop\(g/g)||[]).length,3,'three droplets');assert.equal((d.match(/'#ffffff'/g)||[]).length>=4,true,'white');
  assert.ok(!/[\u{1F4A7}\u{1F4A6}]/u.test(src),'no emoji');assert.match(code,/PINK='#ff3fb4'/);assert.match(code,/GREEN='#39ff9c'/);assert.match(code,/logo\(g,w\/2/);
});
test('every room that is open and every interaction can be walked to; the studios are only seen through their windows',()=>{
  const L=N.layout(),cells=reach(L);
  for(const i of L.interactions.filter(i=>/^milked-/.test(i.id)))assert.ok(near(cells,i.position[0],i.position[2],i.range),i.id+' within reach');
  for(const r of MK.ROOMS){const c=[(r.rect[0]+r.rect[1])/2,(r.rect[2]+r.rect[3])/2];assert.equal(near(cells,c[0],c[1],.8),!r.closed,r.id+(r.closed?' is closed':' is reachable'));}
  for(const s of MK.STUDIOS){const r=MK.ROOMS.find(q=>q.id===s.room).rect;assert.ok(!cells.some(([x,z])=>x>r[0]+.5&&x<r[1]-.5&&z>r[2]+.5&&z<r[3]-.5),s.room+' is never entered');}
  // the walk-through: side street, front doors, vestibule, reception, the door beside the desk, hallway, staff area, rear door, service alley, Main Street
  for(const [what,x,z] of [['the side street',75,-71],['the front doors',MK.DOOR.x,MK.DOOR.z],['the vestibule',MK.DOOR.x,-75.3],['the inner doors',MK.INNER.x,MK.INNER.z],['reception',84,-79],['the door beside the desk',85.5,-81.8],['the hallway',89.5,-81.8],['the staff door',93.5,-81.8],['the staff corridor',94.75,-85],['Fish\'s office',95,-77.5],['the rear door',MK.REAR.x,MK.REAR.z],['the service alley',90,-91.8],['the alley mouth on Main Street',72,-91.8]])assert.equal(E.blocked(x,z,L),false,what+' is open');
  for(const [what,x,z] of [['the wall beside the front doors',79,-74],['the reception desk',81.3,-80.6],['a studio window',87.2,-80.8],['a studio door',88.95,-80.8],['dressing room B\'s door',83.6,-88],['a restroom door',96,-82.75],['the block between the side street and the alley to the District',85,-66],['the block between the service alley and the terrace',85,-94.5],['the block east of the building',103,-82]])assert.equal(E.blocked(x,z,L),true,what+' is solid');
  assert.ok(!near(cells,MK.MODELS.eva.at[0],MK.MODELS.eva.at[1],.3),'Eva is behind her desk');
});
test('Milked adds no save fields, no location id and no mission',()=>{
  const man=JSON.parse(fs.readFileSync(path.join(__dirname,'../void-runner/save-manifest.json'),'utf8'));assert.ok(!JSON.stringify(man).includes('milked'));
  assert.ok(!/state\.|story\.flags/.test(code),'the presentation module touches no game state');
});
test('every interaction has a registered handler in the integration script',()=>{
  const integ=fs.readFileSync(path.join(__dirname,'../void-runner/milked-integration.js'),'utf8');
  for(const a of new Set(MK.INTERACTIONS.map(i=>i.action)))assert.ok(integ.includes("R('"+a+"'"),a);
});
