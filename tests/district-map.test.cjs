/* The city map is generated from the game's own layout: nothing on it may be invented, and a waypoint must be honest about being a direction only. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const N=require('../void-runner/neochinatown.js'),M=require('../void-runner/district-map.js'),A=require('../void-runner/district-area.js');
const m=M.model(N),street=N.layout('street'),interior=N.layout('interior'),by=id=>m.pois.find(p=>p.id===id);
test('every street on the map is a street of the layout, at the layout\'s own rectangle; unbuilt districts are not streets',()=>{
 for(const s of m.streets){assert.deepEqual(s.rect,N.streets[s.id]);assert(s.name);}
 const placeholders=N.districts.filter(d=>d.placeholder).map(d=>d.id);assert(placeholders.length>0);for(const id of placeholders)assert(!m.streets.some(s=>s.id===id),id+' is not drawn as a street');
 assert.equal(m.streets.length,Object.keys(N.streets).length-placeholders.length);
});
test('every place on the map exists in the game, where the game has it',()=>{
 const all=new Map([...street.interactions,...interior.interactions].map(i=>[i.id,i]));
 for(const p of m.pois.filter(p=>!/^(entrance|vestibule|taxi-|dev-)/.test(p.id))){const i=all.get(p.id);assert(i,p.id+' is a real interaction');assert.deepEqual([p.x,p.z],[i.position[0],i.position[2]]);}
 assert.equal(m.pois.filter(p=>/pod/.test(p.id)).length,1,'ten pods are one place on the map');
 for(const t of m.pois.filter(p=>p.id.startsWith('taxi-'))){const z=N.taxiZones.find(z=>'taxi-'+z.id===t.id);assert.deepEqual([t.x,t.z],z.position);}
 const v=by('vestibule'),e=by('entrance');assert(A.centre(N,{x:v.x,z:v.z}),'the vestibule marker is the checkpoint\'s own middle');assert(!A.inVestibule(N,{x:e.x,z:e.z}),'the entrance marker is outside the door');
 assert.equal(by('district-vr').area,'interior');assert.equal(by('board').area,'street');assert.equal(by('district-vr').kind,'vr');assert.equal(by('district-shop').kind,'shop');
 assert.deepEqual(m.buildings.map(b=>b.rect),[N.footprints.district,N.footprints.terrace]);
 assert.equal(m.walls.street.length,street.solids.length);assert.equal(m.walls.interior.length,interior.solids.length);
});
test('places that are not built are development-only markers and never reach a player',()=>{
 const dev=m.pois.filter(p=>p.dev);assert.equal(dev.length,N.districts.filter(d=>d.placeholder).length);
 const all=Object.fromEntries(M.LAYERS.map(l=>[l[0],true]));assert(!M.visible(m,all,false).some(p=>p.dev));assert.equal(M.visible(m,all,true).filter(p=>p.dev).length,dev.length);
 assert(!m.pois.some(p=>p.id.startsWith('taxi-')&&N.districts.some(d=>d.placeholder&&'taxi-'+d.id===p.id)),'no taxi stop for a place that is not built');
});
test('layers switch groups of places; the players layer is off and empty',()=>{
 const on=Object.fromEntries(M.LAYERS.map(l=>[l[0],l[2]]));assert.equal(on.players,false);
 const noShops=M.visible(m,{...on,shops:false},false);assert(!noShops.some(p=>p.kind==='shop'));assert(noShops.some(p=>p.kind==='transit'));
 assert(!M.visible(m,{...on,transit:false},false).some(p=>p.kind==='transit'));assert(!m.pois.some(p=>p.kind==='player'));
});
test('a waypoint is a direction and a distance; across the checkpoint it leads to the vestibule first; arrival is within three metres',()=>{
 const bar=by('district-bar'),north={x:bar.x,z:bar.z-10,yaw:0,area:'interior'};
 let g=M.guidance(m,bar,north);assert.equal(Math.round(g.distance),10);assert(Math.abs(g.turn)<1e-9,'straight ahead');assert.equal(g.via,false);assert.equal(g.arrived,false);
 g=M.guidance(m,bar,{...north,yaw:Math.PI/2});assert(Math.abs(g.turn+Math.PI/2)<1e-9,'facing east, a target to the north is to the left');
 g=M.guidance(m,bar,{x:bar.x+1,z:bar.z+1,yaw:0,area:'interior'});assert.equal(g.arrived,true);
 g=M.guidance(m,bar,{x:61,z:-66,yaw:0,area:'street'});assert.equal(g.via,true);assert.equal(g.arrived,false);assert.equal(Math.round(g.distance),Math.round(Math.hypot(m.vestibule.x-61,m.vestibule.z+66)));
 g=M.guidance(m,by('vestibule'),{x:m.vestibule.x,z:m.vestibule.z+1,yaw:0,area:'street'});assert.equal(g.via,false);assert.equal(g.arrived,true);
 assert.equal(M.guidance(m,null,north),null);
});
test('the map ships as a game script before the device, in both copies of the page, and says plainly that it has no routes',()=>{
 for(const f of ['void-runner.html','static/void-runner.html']){const h=fs.readFileSync(f,'utf8');assert(h.indexOf('void-runner/district-map.js')>0&&h.indexOf('void-runner/district-map.js')<h.indexOf('void-runner/personal-device.js'));assert.match(h,/<script type="text\/tdd-game" src="void-runner\/district-map\.js">/);}
 const src=fs.readFileSync('void-runner/district-map.js','utf8');assert.match(src,/DIRECTION ONLY/);assert.match(src,/has no route data/);
});
