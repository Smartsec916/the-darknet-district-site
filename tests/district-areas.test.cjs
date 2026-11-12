/* NeoChinatown's street and The Darknet District's interior as separate environments (docs/void-runner/environment-separation.md).
   The District layout itself is unchanged: the interior area is exactly the District part of the original combined layout. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const N=require('../void-runner/neochinatown.js'),E=require('../void-runner/exploration-controller.js'),Crowd=require('../void-runner/crowd.js');
const all=N.layout(),street=N.layout('street'),interior=N.layout('interior');
const ids=l=>l.map(i=>i.id),at=item=>N.zone({x:item.position[0],z:item.position[2]}).area;
const ENTRANCE_SOLIDS=['district-door','district-front-east','district-front-west','district-inner-door','vestibule-east','vestibule-west'];

test('the default layout is still the whole combined layout, unchanged',()=>{
 assert.equal(all.solids.length,77);assert.equal(all.interactions.length,22);assert.equal(all.area,undefined);assert.equal(all.name,'NEOCHINATOWN / TESSALY');assert.equal(N.layout('all').solids.length,77);
});
test('the street environment is the outdoors plus the entrance, and nothing of the District behind the inner door',()=>{
 assert.equal(street.area,'street');assert.equal(street.solids.length,35);
 assert.deepEqual(ids(street.interactions).sort(),['board','terminal']);
 for(const s of street.solids)if(at(s)!=='street')assert(ENTRANCE_SOLIDS.includes(s.id),s.id+' is part of the entrance');
 for(const id of ENTRANCE_SOLIDS)assert(ids(street.solids).includes(id),id+' is in the street');
 assert.deepEqual(street.spawn,all.spawn);assert.equal(street.yaw,all.yaw);assert.equal(street.name,all.name);
});
test('the interior environment is exactly the District and terrace part of the original layout',()=>{
 assert.equal(interior.area,'interior');assert.equal(interior.solids.length,48);assert.equal(interior.interactions.length,20);
 assert.equal(interior.interactions.filter(i=>i.action==='district-pod').length,10,'every pod has a hatch interaction');
 const original=all.solids.filter(s=>['district','terrace'].includes(at(s)));
 assert.deepEqual(interior.solids,original,'solids are identical, in the same order');
 assert.deepEqual(interior.interactions,all.interactions.filter(i=>['district','terrace'].includes(at(i))),'interactions are identical');
 for(const id of ENTRANCE_SOLIDS)assert(ids(interior.solids).includes(id),id+' is in the interior');
 assert(!ids(interior.interactions).some(i=>['board','terminal','tdd'].includes(i)),'no street interactions');
 assert.equal(interior.name,'THE DARKNET DISTRICT');assert.equal(interior.ship,undefined);
});
test('every original solid and interaction lives in the street, the interior or both (the entrance)',()=>{
 for(const key of ['solids','interactions']){const s=new Set(ids(street[key])),i=new Set(ids(interior[key]));
  for(const item of all[key])assert(s.has(item.id)||i.has(item.id),item.id);
  const both=[...s].filter(x=>i.has(x));assert.deepEqual(both.sort(),(key==='solids'?ENTRANCE_SOLIDS:[]).sort(),key+' shared only at the entrance');}
});
test('the entrance is the same in both: the same doors and walls at the same places',()=>{
 for(const id of ENTRANCE_SOLIDS){const a=street.solids.find(s=>s.id===id),b=interior.solids.find(s=>s.id===id);assert.deepEqual(a,b,id);}
});
test('the interior spawn is inside the vestibule facing the inner door, on open floor; the street spawn is unchanged',()=>{
 const [x,y,z]=interior.spawn;assert.equal(E.blocked(x,z,interior),false);assert.equal(N.zone({x,z}).area,'district');
 const [lx,lz]=N.toWorld(x,z);assert(Math.abs(lx)<.01&&lz>20&&lz<26,'local '+lx+','+lz);assert.equal(interior.yaw,Math.PI);
 assert.equal(E.blocked(street.spawn[0],street.spawn[2],street),false);
});
test('the outer door is the only way from the street into the vestibule, and the inner door the only way on',()=>{
 const [ox,oz]=N.toWorld(0,17),[vx,vz]=N.toWorld(0,23),[hx,hz]=N.toWorld(0,30);
 assert.equal(E.blocked(ox,oz,street),false,'alley side is open');
 const door=street.solids.find(s=>s.id==='district-door');assert.equal(E.blocked(...N.toWorld(0,20),street),true,'closed outer door blocks');door.open=true;assert.equal(E.blocked(vx,vz,street),false,'the vestibule is reachable once it opens');door.open=false;
 const inner=interior.solids.find(s=>s.id==='district-inner-door');assert.equal(E.blocked(...N.toWorld(0,26),interior),true,'closed inner door blocks from the vestibule');inner.open=true;assert.equal(E.blocked(hx,hz,interior),false,'the hall is reachable once it opens');inner.open=false;
});
test('every pod hatch is reachable from the shared room and exits onto open floor',()=>{
 const A=require('../void-runner/district-area.js');
 for(let index=1;index<=10;index++){
  // the pods stand along the back wall of the building since 2026-11-12: lower row approached from z 74.3, upper row from 72.9
  const [x,wz]=N.toWorld(-5.2+((index-1)%5)*2.6,index<=5?74.3:72.9);
  assert(!E.blocked(x,wz,interior),'approach to pod '+index);
  assert.equal(E.select({x,z:wz,yaw:0},interior)?.podIndex,index,'hatch '+index+' can be selected');
  const exit=A.podExit(N,index);assert(!E.blocked(exit.spawn[0],exit.spawn[2],interior),'exit from pod '+index);
 }
});
test('each environment loads only its own assets',()=>{
 const s=Object.keys(N.modelsFor('street')),i=Object.keys(N.modelsFor('interior')),a=Object.keys(N.modelsFor('all'));
 assert(s.every(k=>k.startsWith('ncz:'))&&s.length>0);assert(i.every(k=>!k.startsWith('ncz:'))&&i.length>0);assert.deepEqual([...s,...i].sort(),a.sort());
 const cs=Object.keys(Crowd.models('neochinatown','high','street')),ci=Object.keys(Crowd.models('neochinatown','high','interior')),ca=Object.keys(Crowd.models('neochinatown','high'));
 assert.deepEqual([...cs,...ci].sort(),[...new Set(ca)].sort());assert(cs.includes('crowd:ncz-neon')&&!cs.includes('crowd:district-resident'));assert(ci.includes('crowd:district-resident')&&!ci.includes('crowd:ncz-neon'));
});
test('in the street area the inner door can never open, whatever the flags',()=>{
 const src=fs.readFileSync('void-runner/neochinatown.js','utf8');assert(src.includes("const isOpenable=d=>!(area==='street'&&d.id==='district-inner-door')&&!(area==='interior'&&d.id==='district-door');"),'and in the interior the outer door: the two are never open together');
 assert(src.includes("const unlocked=isOpenable(d)&&(d.id==='district-door'||!!flags[d.flag])"));
});
test('the build is split into gated sections, the entrance is built in every area, and the original random sequence is kept',()=>{
 const src=fs.readFileSync('void-runner/neochinatown.js','utf8');
 assert(src.includes("function build({scene,parent,quality,characterModel,shipModel,state,instance:modelInstance,area='all'})"));
 for(const needle of ['function buildStreet()','function buildEntrance()','function buildInterior()','function buildStreetDetail()','const wantStreet=area!==\'interior\',wantInterior=area!==\'street\'','const SEAMS=low?'])assert(src.includes(needle),needle);
 assert(src.indexOf('function buildEntrance()')<src.indexOf('function buildInterior()'),'the entrance comes before the interior');
 assert(/else if\(!wantStreet\)seed=SEAMS\[0\]/.test(src)&&/if\(!wantInterior\)\{seed=SEAMS\[1\]/.test(src),'each separate build resumes the combined build\'s random sequence');
});
test('the room loader passes the area to the build and to the asset lists',()=>{
 const r=fs.readFileSync('void-runner/babylon-renderer.js','utf8');assert(r.includes("area:def.area||'all'"));assert(r.includes("VoidNeoChinatown.modelsFor(def.area||'all')"));assert(r.includes("models('neochinatown',quality,def.area||'all')"));
});
test('the security entrance has no interaction prompt and scans automatically',()=>{
 assert(!all.interactions.some(i=>i.id==='district-scan'||i.id==='tdd'));
 const A=require('../void-runner/district-area.js');const [x,z]=N.toWorld(0,24);
 assert.equal(A.enterTrigger(N,{x,z}),true);
});
