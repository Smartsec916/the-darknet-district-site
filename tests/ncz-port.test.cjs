// The remade Port quarter (void-runner/ncz-port-data.js, ncz-port.js, ncz-kit.js; docs/development/NEOCHINATOWN_REMAKE.md) and the road taxi's model hook.
// Pure plan and wiring only; how it looks is checked in a browser (tests/ncz-port-browser.cjs).
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const D=require('../void-runner/ncz-port-data.js'),Q=require('../void-runner/ncz-quarters.js'),N=require('../void-runner/neochinatown.js'),E=require('../void-runner/exploration-controller.js'),S=require('../void-runner/street-sight.js'),R=require('../void-runner/road-taxi-rules.js');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
globalThis.VoidPortData=D;require('../void-runner/ncz-port.js');const P=globalThis.VoidPort;
// PARKED: the Port remake ships switched off (work in progress). These tests switch it on to keep its plan honest; the first one checks that off means off.
const OFF={enabled:P.enabled,layout:N.layout('street','port')};P.enabled=true;
const L=N.layout('street','port');
function reach(from,limit=60000){const key=(x,z)=>Math.round(x*4)+':'+Math.round(z*4),seen=new Set([key(from[0],from[1])]),todo=[[from[0],from[1]]],out=[];
 while(todo.length&&out.length<limit){const [x,z]=todo.pop();out.push([x,z]);for(const [dx,dz] of [[.25,0],[-.25,0],[0,.25],[0,-.25]]){const nx=x+dx,nz=z+dz,k=key(nx,nz);if(seen.has(k))continue;seen.add(k);if(!E.blocked(nx,nz,L))todo.push([nx,nz]);}}return out;}
const inside=(r,x,z,m=0)=>x>=r[0]-m&&x<=r[1]+m&&z>=r[2]-m&&z<=r[3]+m;

test('parked: switched off as shipped, and then the Port is exactly the old Port (no new collision, the old build)',()=>{
 assert.equal(OFF.enabled,false);assert.match(read('void-runner/ncz-port.js'),/enabled:false/);assert.ok(!OFF.layout.solids.some(s=>s.port||/~/.test(s.id)));assert.equal(E.blocked(41,-89,OFF.layout),true);
 assert.match(read('void-runner/neochinatown.js'),/root\.VoidPort\.enabled===true/);assert.match(read('void-runner/road-taxi-model.js'),/const api=\{enabled:false\}/,'the modelled taxi is parked too');
});
test('the plan uses the walkable Port that ncz-quarters.js defines',()=>{
 assert.deepEqual(D.YARD,Q.S.pad);assert.deepEqual(D.LANE,Q.QUARTERS.port.streets[1]);
 for(const [id,x0,x1,z0,z1] of D.BLOCKS){assert.ok(x1>x0&&z1>z0,id);assert.ok(inside(D.YARD,(x0+x1)/2,(z0+z1)/2)||inside(D.LANE,(x0+x1)/2,(z0+z1)/2),id+' stands in the yard or the lane');}
 assert.equal(new Set(D.BLOCKS.map(b=>b[0])).size,D.BLOCKS.length);
});
test('the places the game already uses are open floor: the spawn, the ship, the terminal, the taxi stop and its rank, the customs lane',()=>{
 const sp=Q.QUARTERS.port.spawn;assert.equal(E.blocked(sp[0],sp[2],L),false,'spawn');
 const board=L.interactions.find(i=>i.id==='board'),term=L.interactions.find(i=>i.id==='terminal');assert.ok(board&&term);
 for(const i of [board,term])assert.equal(E.blocked(i.position[0],i.position[2],L),false,i.id);
 const stop=Q.stop('passage');assert.equal(E.blocked(stop.position[0],stop.position[1],L),false,'taxi stop');
 // the cab's lane from the gate to its rank is clear for the width of a cab, and the walkers' lane to the gate is clear
 for(let z=-106.4;z<=-93.6;z+=.2)for(const x of [41.4,42.35,43.3])assert.ok(!D.solids().some(s=>Math.abs(x-s.position[0])<s.size[0]/2&&Math.abs(z-s.position[2])<s.size[2]/2),'cab lane '+x+','+z);
 for(let z=-106.4;z<=-92.6;z+=.2)assert.equal(E.blocked(39.15,z,L),false,'foot lane '+z);
 // a parked ship's footprint and its steps are clear of everything that was added
 for(const [id,x0,x1,z0,z1] of D.BLOCKS)assert.ok(x1<16.6||x0>29.4||z1<-103.6||z0>-88.4||!(x0<28&&x1>16&&z0<-90&&z1>-102),id+' is clear of the ship');
});
test('a walker reaches everything from the spawn, including the public toilet, and cannot leave the Port',()=>{
 const sp=Q.QUARTERS.port.spawn,cells=reach([sp[0],sp[2]]),has=(x,z)=>cells.some(c=>Math.hypot(c[0]-x,c[1]-z)<.45);
 for(const [name,x,z] of [['the terminal',34.5,-103],['the ship',27,-98],['the food stall\'s counter',35.5,-89.6],['the taxi stop',42.35,-99],['customs, walkers\' door',39.15,-106.3],['the toilet door',39.3,-92.3],['inside the toilet',39.3,-90.4],['the sinks',42.4,-90],['the far corner of the yard',14.2,-87.4],['the south-west corner',14.6,-104.6]])assert.ok(has(x,z),name);
 for(const [x,z] of cells)assert.ok(inside(D.YARD,x,z,.01)||inside([37.5,44,-107,-92],x,z,.4)||D.inWC(x,z,.01)||Q.laneAt({x,z},'port')||inside(Q.gate('customs').rect,x,z,.4),'walked out at '+x+','+z);
 assert.ok(!has(41.6,-87.1),'the shut stall is shut');
});
test('the toilet is cut out of the city block only in the Port, and nothing else in the city changes',()=>{
 const base=N.layout('street'),old=N.layout('street','oldtown'),av=N.layout('street','avenue');
 for(const l of [base,old,av])assert.ok(!l.solids.some(s=>s.port||/~/.test(s.id)),'no Port pieces outside the Port');
 assert.ok(L.solids.some(s=>s.port));assert.equal(E.blocked(41,-89,base),true,'solid city block where the toilet is, outside the Port');assert.equal(E.blocked(41,-89,L),false);
 // cut(): the pieces around a hole cover exactly what is left
 const one=[{id:'b',position:[5,15,5],size:[10,30,10]}],parts=D.cut(one,[4,6,4,6]);assert.equal(parts.length,4);
 const area=parts.reduce((a,s)=>a+s.size[0]*s.size[2],0);assert.ok(Math.abs(area-96)<1e-9);assert.deepEqual(D.cut(one,[20,22,20,22]),one);
});
test('street sight: the toilet is not a street, so nobody in it (or seen from it) is ever hidden',()=>{
 const rects=S.open(N);assert.ok(!S.within(rects,41,-89,S.config.margin));
 assert.equal(S.sees(rects,{x:41,y:1.7,z:-89},{x:61,z:-60}),true);assert.equal(S.sees(rects,{x:30,y:1.7,z:-96},{x:41,z:-89}),true);
});
test('screen mounts and venue fronts are named places the other work can use',()=>{
 assert.ok(D.MOUNTS.length>=4);assert.equal(new Set(D.MOUNTS.map(m=>m.id)).size,D.MOUNTS.length);
 for(const m of D.MOUNTS){assert.match(m.id,/^port-/);assert.equal(m.position.length,3);assert.ok(m.size[0]>1&&m.size[1]>1);assert.equal(Math.hypot(...m.normal),1);
  // the plane's rotation faces the way the mount says: a Babylon plane turned by ry faces (-sin ry, -cos ry)
  assert.ok(Math.abs(-Math.sin(m.ry)-m.normal[0])<1e-9&&Math.abs(-Math.cos(m.ry)-m.normal[1])<1e-9,m.id+' ry');assert.ok(m.note);}
 assert.ok(D.FRONTAGES.length>=2);for(const f of D.FRONTAGES){assert.match(f.id,/^port-venue-/);assert.ok(Math.abs(Math.hypot(f.to[0]-f.from[0],f.to[1]-f.from[1])-f.width)<.01,f.id);}
 assert.ok(D.HOUSING.length>=4);assert.equal(new Set(D.HOUSING.map(h=>h[2])).size,D.HOUSING.length,'unit numbers differ');
});
test('someone is in the toilet on some visits and not on others, and the answer is the same for the same day and visit',()=>{
 let n=0,stall=0,floor=0;for(let day=20000;day<20040;day++)for(let v=1;v<=10;v++){const a=D.passedOut(day,v);assert.deepEqual(a,D.passedOut(day,v));if(a){n++;if(a.where==='stall')stall++;else floor++;}}
 assert.ok(n>120&&n<320,'sometimes: '+n+' of 400');assert.ok(stall>30&&floor>30,'both ways: '+stall+' / '+floor);
});
test('the remade Port stands in for the old one: what it replaces, and what it leaves',()=>{
 assert.equal(P.replaces('old-building',[20,8,-80]),true);assert.equal(P.replaces('batch',[24,.06,-96]),true);assert.equal(P.replaces('landing-pad',[24,.06,-96]),true);assert.equal(P.replaces('puddle',[61,.02,-60]),true,'the old neighbourhood is not shown in pieces behind the Port');
 assert.equal(P.replaces('city-ground',[55,-.03,-121]),false);assert.equal(P.replaces('skyline',[400,90,-120]),false);assert.equal(P.replaces('old-building',[-100,8,-200]),false,'the city outside the old neighbourhood stays');
 const n=read('void-runner/neochinatown.js');assert.match(n,/PORT&&target===parent&&PORT\.replaces\(mesh\.name,p\)/);assert.match(n,/PORT&&PORT\.replaces\('batch',c\)/);assert.match(n,/catch\(e\)\{console\.warn\('\[Port\]/,'a failed remake falls back to the old Port');assert.match(n,/PORT\?\.dispose\(\)/);assert.match(n,/PORT\?\.tick\(dt,time\)/);
 assert.ok(D.WALLS.length>=6&&D.OPENINGS.every(o=>D.WALLS.some(w=>w.id===o.wall)&&o.to>o.from&&o.depth>1),'walls and declared openings for the gap check');
});
test('files are loaded in an order that works, and listed for offline play',()=>{
 const h=read('void-runner.html'),at=f=>h.indexOf('src="void-runner/'+f+'"');
 for(const f of ['ncz-port-data.js','ncz-kit.js','ncz-port.js','road-taxi-model.js'])assert.ok(at(f)>0,f);
 assert.ok(at('ncz-quarters.js')<at('ncz-port-data.js')&&at('ncz-port-data.js')<at('ncz-kit.js')&&at('ncz-kit.js')<at('ncz-port.js')&&at('ncz-port.js')<at('neochinatown.js'));
 assert.ok(at('road-taxi-rules.js')<at('road-taxi-model.js')&&at('road-taxi-model.js')<at('road-taxi.js'));
 assert.equal(read('static/void-runner.html'),h);
});
test('signs carry plain words only, and the kit knows every modelled prop that is shipped',()=>{
 const p=read('void-runner/ncz-port.js'),words=[...p.matchAll(/(?:words\(\[|label:|text\()'([^']+)'/g)].map(m=>m[1]);
 for(const w of words)assert.match(w,/^(CARGO( 0\d)?|FUEL|WC|CUSTOMS|07|↓|出口 EXIT ↓|麵 · NOODLES · 麵)$/,'unexpected sign text: '+w);
 const k=read('void-runner/ncz-kit.js'),dir=path.join(__dirname,'../void-runner/assets/models/ncz-kit');
 for(const f of fs.readdirSync(dir).filter(f=>f.endsWith('.glb')&&f!=='ncz-road-taxi.glb'))assert.ok(k.includes("'"+f.replace(/^ncz-|\.glb$/g,'')+"'"),f+' is a kit prop');
 for(const id of [...k.matchAll(/^  '([a-z-]+)':\{h:/gm)].map(m=>m[1]))assert.ok(fs.existsSync(path.join(dir,'ncz-'+id+'.glb')),id+'.glb is shipped');
});
test('the road taxi asks one loader for its model and nothing about its rules changed',()=>{
 const t=read('void-runner/road-taxi.js'),m=read('void-runner/road-taxi-model.js');
 assert.match(t,/VoidRoadTaxiModel\?\.dress\(cab,sc\)/);assert.match(m,/ncz-road-taxi\.glb/);assert.ok(fs.existsSync(path.join(__dirname,'../void-runner/assets/models/ncz-kit/ncz-road-taxi.glb')));
 for(const f of ['corporate-build.js','temple-build.js'])assert.match(read('void-runner/'+f),/VoidRoadTaxiModel\.park\(\{scene,parent,/,f);
 assert.doesNotMatch(m,/VoidRoadTaxiRules|VoidQuarters|walkingLocation|hail\(/,'the model file knows nothing of taxi rules');
 const w=R.createTraffic(1,4127,'port');assert.ok(w.taxis.length>=1);
});
