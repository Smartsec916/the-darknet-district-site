// Zen Zephyr Temple: layout, collision, reachability, the monk's replacement point, taxi destination, map and fog, lights, scene lifecycle, no network.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
require('../void-runner/corporate.js');const T=require('../void-runner/temple.js'),E=require('../void-runner/exploration-controller.js'),R=require('../void-runner/road-taxi-rules.js'),N=require('../void-runner/neochinatown.js'),CAM=require('../void-runner/campaign.js'),A=require('../void-runner/area-map.js'),QT=require('../void-runner/ncz-quarters.js'),Z=require('../void-runner/zen-chat.js');
const L=T.layout(),read=f=>fs.readFileSync(path.join(__dirname,'..','void-runner',f),'utf8'),strip=s=>s.replace(/\/\*[\s\S]*?\*\//g,'').replace(/(^|[^:'"])\/\/.*$/gm,'$1');
const reach=()=>{const st=.5,seen=new Set(),key=(x,z)=>x.toFixed(1)+','+z.toFixed(1),q=[[0,-38]];seen.add(key(0,-38));for(let i=0;i<q.length;i++){const [x,z]=q[i];for(const [dx,dz] of [[st,0],[-st,0],[0,st],[0,-st]]){const nx=x+dx,nz=z+dz,k=key(nx,nz);if(seen.has(k)||E.blocked(nx,nz,L))continue;seen.add(k);q.push([nx,nz]);}}return {q,has:(x,z)=>seen.has(key(x,z))};};
test('the Temple is its own walking location with a map space and a hilltop arrival',()=>{
  assert.equal(L.id,'temple');assert.equal(L.temple,true);assert.equal(L.mapSpace,'temple');assert.notEqual(L.id,'neochinatown');assert.equal(E.blocked(L.spawn[0],L.spawn[2],L),false);assert.ok(Math.hypot(T.CAB_PAD.x-L.spawn[0],T.CAB_PAD.z-L.spawn[2])<8,'arrive beside the cab pad');
  assert.ok(!L.solids.some(s=>/club|milked|district-door|corp-/.test(s.id)),'none of the city or Corporate');assert.equal(T.FARE,60);
});
test('taxi only: a road-taxi destination at a flat 60 CR through the East Gate, with a return cab at the stop',()=>{
  const s=CAM.fresh();s.location='earth';s.credits=100;const d=R.destinations(s,{player:[61,-100],quarter:'oldtown'}).find(x=>x.id==='temple');
  assert.ok(d&&d.ok&&d.fare===60&&d.scene==='temple'&&!d.placeholder);assert.deepEqual(d.legs.map(l=>l.gate),['north','east']);s.credits=59;assert.equal(R.destinations(s,{player:[61,-100],quarter:'oldtown'}).find(x=>x.id==='temple').ok,false);
  assert.ok(!N.districts.some(x=>x.id==='temple'),'it is not a street stop or a district of NeoChinatown');assert.ok(!N.taxiZones.some(z=>z.id==='temple'));
  const cab=L.interactions.find(i=>i.action==='temple-cab');assert.ok(cab&&Math.hypot(cab.position[0]-T.CAB_PAD.x,cab.position[2]-T.CAB_PAD.z)<6,'the return cab is at the pad');
  const f=QT.far('temple');assert.equal(f.fare,60);assert.equal(f.gate,'east');assert.equal(QT.lanesOf('east').filter(l=>l.kind==='foot').length,1,'the East Gate has a walkers\' lane (the owner, 16 Nov 2026)');
  {const w=L.interactions.find(i=>i.action==='temple-walk');assert.ok(w&&w.label==='EAST GATE · WALK TO NEOCHINATOWN');assert.equal(E.blocked(w.position[0],w.position[2],L),false,'the walk-back prompt is on open ground');assert.ok(Math.hypot(w.position[0]-cab.position[0],w.position[2]-cab.position[2])>w.range+cab.range,'and does not overlap the taxi prompt');
   assert.ok(Math.hypot(w.position[0]-L.spawn[0],w.position[2]-L.spawn[2])<12,'close to where a walker arrives');assert.match(fs.readFileSync(path.join(__dirname,'../void-runner/temple-integration.js'),'utf8'),/R\('temple-walk',[^\n]*returnFrom\('temple','foot'\)/);}assert.equal(R.returnTrip('temple').fare,0,'return included');assert.doesNotMatch(JSON.stringify(L.interactions)+JSON.stringify(T.mapModel()),/sky/i);
});
test('every part can be walked to; the chamber is entered through one gap, the pillars, dais, altars and glass are solid',()=>{
  const r=reach();for(const i of L.interactions)assert.ok(r.q.some(([x,z])=>Math.hypot(x-i.position[0],z-i.position[2])<=i.range),i.id+' within reach');
  for(const [x,z] of [[0,-30],[0,-20],[0,-5],[0,6],[0,17],[-14,6],[14,30],[40,-20]])assert.ok(r.has(x,z),x+','+z);
  assert.equal(E.blocked(0,-6,L),false,'the entrance gap is open');assert.equal(E.blocked(-6,-6,L),true,'the wall beside it is solid');assert.equal(E.blocked(18,17,L),true,'the glass window wall is solid');assert.equal(E.blocked(0,22,L),true,'the dais is solid');assert.equal(E.blocked(-11,12,L),true,'a pillar');assert.equal(E.blocked(7,12,L),true,'an altar');
  assert.equal(E.blocked(0,17,L),false,'the aisle runs up to the dais');assert.equal(E.blocked(60,0,L),true,'the plateau edge is bounded');
});
test('the required features exist: layered walls, server pillars, braziers, data altars, dais, window onto the city',()=>{
  assert.ok(T.PROPS.filter(p=>/^pillar/.test(p[0])).length>=8,'tall server pillars');assert.equal(T.PROPS.filter(p=>/^altar/.test(p[0])).length,4);assert.ok(T.PROPS.filter(p=>/^(brazier|incense)/.test(p[0])).length>=4,'incense braziers');assert.ok(T.PROPS.some(p=>p[0]==='dais'));
  for(const p of T.PROPS.filter(p=>/^pillar/.test(p[0])))assert.ok(p[2]>=8,'tall');
  const src=strip(read('temple-build.js'));for(const part of ['wallBands','ledTex','cable(','mist','flames','oculus','reflect','cityPlane','altar','monk'])assert.ok(src.includes(part),part);
  assert.match(read('temple-build.js'),/skyline|distant towers/i);
});
test('Zen Zephyr sits on the dais, in the middle of the chamber, with one documented replacement point',()=>{
  const m=T.MODEL;assert.equal(m.id,'zen-zephyr');assert.equal(m.name,'Zen Zephyr');assert.equal(m.asset,null,'no real model yet');assert.match(m.note,/REPLACEMENT POINT/);assert.equal(m.placeholder,'primitives');
  const [x,z]=m.seat;assert.ok(x>=T.HALL[0]&&x<=T.HALL[1]&&z>=T.HALL[2]&&z<=T.HALL[3],'inside the hall');assert.ok(Math.hypot(x-T.DAIS.x,z-T.DAIS.z)<.5,'on the dais');
  const talk=L.interactions.find(i=>i.action==='temple-monk');assert.ok(talk&&Math.hypot(talk.position[0]-x,talk.position[2]-z)<=talk.range+.5,'speakable from the dais edge');
  const src=read('temple.js');assert.match(src,/WHERE TO CHANGE THINGS/);assert.match(src,/MODEL/);
  for(const part of ['silver','closed eyes','mustard','mechanical','teal','seated'])assert.ok((m.look+read('temple-build.js')).toLowerCase().includes(part)||/sash/.test(read('temple-build.js')),part);
  assert.match(read('temple-build.js'),/mk-skull/);assert.match(read('temple-build.js'),/sash/);assert.match(read('temple-build.js'),/mk-chest/);
});
test('the V1 map has its own space: arrival, entrance, chamber, dais, altars, and exploration fog that saves and restores',()=>{
  const sp=A.get('temple');assert.ok(sp&&sp.flag==='templeFog'&&sp.cell===5);const m=sp.model(),ids=m.pois.map(p=>p.id);
  for(const id of ['temple-taxi','temple-entrance','temple-chamber','temple-dais','temple-altar-1','temple-altar-2','temple-altar-3','temple-altar-4'])assert.ok(ids.includes(id),id);
  assert.ok(m.buildings.some(b=>/Sanctum/.test(b.name)));assert.ok(m.streets.length>=4);assert.deepEqual(m.bounds,{x0:-50,x1:50,z0:-50,z1:50});
  const flags={};const fog=A.load(sp,flags);assert.equal(fog.explored(),0);fog.reveal(0,-38,14);fog.reveal(0,6,14);assert.equal(A.save(sp,fog,flags),true);assert.ok(flags.templeFog.length<190,'fits a save flag: '+flags.templeFog.length);
  const again=A.load(sp,flags);assert.equal(again.explored(),fog.explored());assert.equal(again.isExplored(0,6),true);assert.equal(again.isExplored(40,40),false);assert.equal(A.load(sp,{}).explored(),0,'an older save starts unexplored');
  assert.ok(!A.get('corporate').model().pois.some(p=>/^temple/.test(p.id)),'Corporate\'s map is separate');
});
test('lights: Low adds none; Medium and up add a few real lights within the budget, each lit only for the hall and disposed with it (graphics pass, 18 Nov 2026)',()=>{
  const src=strip(read('temple-build.js'));assert.ok(!/DirectionalLight|HemisphericLight/.test(src));assert.ok(/ambient/.test(src));
  const made=(src.match(/new B\.(PointLight|SpotLight)\(/g)||[]).length;assert.ok(made>=2&&made<=4,'a handful of light sources in the code');
  assert.match(src,/if\(!low\)\{const lit=/,'no extra light on Low');assert.match(src,/includedOnlyMeshes=lit/,'lit only for the hall\'s own meshes');assert.match(src,/if\(hi\)for\(const s of \[-1,1\]\)add/,'the two aisle fills on High only');
  assert.match(src,/L\.parent=node/,'lights go with the area when it is disposed');assert.match(src,/own\.push\(L\)/);
  assert.match(src,/if\(!low\)\{mirror=new B\.MirrorTexture/,'the floor mirror is Medium and up only');
});
test('scene lifecycle: it is built when the Temple loads and fully disposed (scene mood restored) when the player leaves',()=>{
  const src=read('temple-build.js');assert.match(src,/dispose\(\)\{/);for(const r of ['scene.clearColor=prev.clear','scene.fogDensity=prev.fogDensity','ip.exposure=prev.exposure','ambient.intensity=lp.amb','node.dispose(false,true)','Area.save(space,fog,flags)'])assert.ok(src.includes(r),r);
  const rend=fs.readFileSync(path.join(__dirname,'../void-runner/babylon-renderer.js'),'utf8');assert.match(rend,/def\.temple&&root\.VoidTemple\?\.build/);assert.match(rend,/zoneHandle\?\.dispose/);assert.match(rend,/def\.corporate\|\|def\.temple\?'area':'scene'/);
});
test('nothing is downloaded: no images, models or network in the build; the conversation panel stays local',()=>{
  const b=strip(read('temple-build.js')),i=strip(read('temple-integration.js'));for(const bad of ['.glb','.png','http','fetch(','XMLHttpRequest','ImportMesh','SceneLoader'])assert.ok(!b.includes(bad),'build: '+bad);
  // the only files it reads are the game's own interior texture kit (the same files the District rooms use), never on Low
  for(const m of b.match(/assets\/textures\/[^'"]+/g)||[])assert.match(m,/^assets\/textures\/district-interior\/$/,m);
  for(const set of (b.match(/set:'(kit_[a-z]+)'/g)||[]).map(x=>x.slice(5,-1)))for(const k of ['color','normal','orm'])assert.ok(fs.existsSync(path.join(__dirname,'../void-runner/assets/textures/district-interior',set+'_'+k+'.jpg')),set+'_'+k);
  assert.match(b,/if\(set&&!low\)/,'Low reads no texture files');
  for(const bad of ['fetch(','XMLHttpRequest','WebSocket','sendBeacon','localStorage'])assert.ok(!i.includes(bad),'panel: '+bad);assert.match(i,/Z\.LABEL/);assert.match(read('temple-integration.js'),/registerProvider/,'the future API hook is documented where it plugs in');assert.match(Z.LABEL,/NOT AN AI/);
});
test('the typed panel keeps typing away from the game, and Escape closes the panel',()=>{
  const i=read('temple-integration.js');assert.match(i,/stopPropagation/);assert.match(i,/key==='Escape'/);assert.match(i,/maxlength="200"/);assert.match(i,/resumeWalking/);assert.match(i,/CHOOSE A TEACHING/);assert.match(i,/R\('temple-monk'/);for(const a of new Set(L.interactions.map(x=>x.action)))assert.ok(i.includes("R('"+a+"'"),a);
});
test('the Temple adds no location id, mission or save field except the fog flag and the shared trip records',()=>{
  const man=JSON.parse(fs.readFileSync(path.join(__dirname,'../void-runner/save-manifest.json'),'utf8'));assert.ok(!JSON.stringify(man).includes('temple'));assert.equal(T.SPACE_FLAG,'templeFog');const src=strip(read('temple.js'));assert.ok(!/story\.flags|state\./.test(src));
});
