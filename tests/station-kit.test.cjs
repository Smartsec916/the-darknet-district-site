/* The space-station kit (void-runner/station-kit.js): pure checks on the piece file, the plans and what they must leave alone. */
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const Kit=require('../void-runner/station-kit.js'),Layouts=require('../void-runner/station-layouts.js');
const dir=path.join(__dirname,'..','void-runner','assets','models','station-kit'),manifest=require(path.join(dir,'station-kit-manifest.json')),props=require(path.join(dir,'station-props-manifest.json'));
const known=key=>manifest.pieces[key]||props[key]||key.startsWith('unit_');
const design={hangars:[{id:'H01',x:0,z:-11,w:36,h:9,d:30},{id:'H02',x:38,z:-11,w:36,h:9,d:30},{id:'H03',x:76,z:-11,w:36,h:9,d:30}],modules:[{id:'rear-service-spine',size:[100,7,10],position:[3,5,40],finish:'hull'},{id:'habitation',size:[30,10,12],position:[-18,12,35],finish:'panel'}]};

test('the piece file holds every piece in the manifest with the same triangle counts, and no pictures',()=>{
 const b=fs.readFileSync(path.join(dir,'station-kit.glb')),{pieces,own}=Kit.parseGLB(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));
 for(const [name,info] of Object.entries(manifest.pieces)){assert(pieces[name],name);assert.equal(pieces[name].reduce((n,p)=>n+p.indices.length/3,0),info.triangles,name);for(const part of pieces[name])assert(manifest.materials.includes(part.material),name+' '+part.material);}
 assert.deepEqual(own,{});
 assert(b.length<3e6,'the kit stays one small download');
});
test('every Meridian-class station has an identity and a full interior plan made only of known pieces',()=>{
 for(const id of Layouts.meridianClass){assert(Kit.identity[id],id);const def=Layouts.layout(id),plan=Kit.interiorPlan(def);
  assert(plan.length>600,id);for(const p of plan){assert(known(p.key),p.key);assert(def.rooms[p.zone],p.zone);assert(p.p.every(Number.isFinite));}
  for(const room of Object.keys(def.rooms))assert(Kit.interiorLamps(def).some(l=>l.zone===room),id+' '+room+' has lamps');}
});
test('the kit changes nothing a player can collide with or use',()=>{
 const before=JSON.stringify(Layouts.layout('meridian'));const def=Layouts.layout('meridian');Kit.interiorPlan(def);Kit.interiorLamps(def);
 assert.equal(JSON.stringify(def),before,'the plan only reads the layout');
 // loose cargo and props stay off the hangar's centre line, the boarding point and the door (they have no collision, as before)
 for(const p of Kit.interiorPlan(def))if(p.zone==='hangar'&&/^(crate|drum|prop_)/.test(p.key)){assert(Math.abs(p.p[0])>=9,p.key+' '+p.p);const [x,,z]=p.p;assert(!(x>-11&&x<-3&&z>-15&&z<-3),p.key+' stands clear of the parked ship');}
 // every hidden shell box is furniture or trim the kit models; walls, doors and floors are never hidden
 for(const name of Kit.HIDDEN)assert(!/wall|door|floor|roof|jamb|header|glass|window$/.test(name)||/sill|lintel/.test(name),name);
});
test('the exterior plan keeps the builder\'s design, and is lighter when seen from inside',()=>{
 const full=Kit.exteriorPlan(design),inside=Kit.exteriorPlan(design,{occupied:true});
 for(const p of full)assert(known(p.key),p.key);
 assert(full.some(p=>p.key==='collar'&&p.p.join()==='114,3,2'),'the collar stands where the builder put it');
 assert.equal(full.filter(p=>p.key==='tank').length,7);assert(inside.length<full.length);
 assert(!inside.some(p=>p.zone==='H01'&&(p.key==='roof_plate'||p.key==='hangar_truss')),'the walkable hangar keeps its own interior: only its mouth is dressed');
 assert.deepEqual(JSON.stringify(Kit.exteriorPlan(design)),JSON.stringify(full),'the plan is seeded: the same hull every time');
});
test('the renderer falls back to the earlier dressing when the kit is missing, and the full range is asked for only aboard a station',()=>{
 const r=fs.readFileSync(path.join(__dirname,'..','void-runner','babylon-renderer.js'),'utf8'),vr=fs.readFileSync(path.join(__dirname,'..','void-runner','vr-core.js'),'utf8');
 assert(r.includes("if(!kitNode)globalThis.VoidMeridianInteriorKit?.dress(scene,roomRoot,'ikit:')"));assert(r.includes("globalThis.VoidMeridianKitbash?.dress(scene,built,'kit:')"));
 assert(vr.includes('const want=session||globalThis.VoidStationKit?.aboard||globalThis.VoidVantor?.active?1:.3;'));assert.equal(Kit.aboard,false);
});
