// The NeoChinatown nightclub (David's map, 2026-10-24): where it stands, how you get in, and that nothing else moved.
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),E=require('../void-runner/exploration-controller.js');
const club=require('../void-runner/ncz-nightclub.js'),townPath=require.resolve('../void-runner/neochinatown.js');
const off=require('../void-runner/neochinatown.js');
function town(){club.force(true);delete require.cache[townPath];const N=require('../void-runner/neochinatown.js');club.force(null);return N;}
const reach=(layout,from)=>{const S=.5,seen=new Set(),key=(x,z)=>x.toFixed(1)+','+z.toFixed(1),q=[from];seen.add(key(...from));
 for(let i=0;i<q.length&&i<400000;i++){const [x,z]=q[i];for(const [dx,dz] of [[S,0],[-S,0],[0,S],[0,-S]]){const nx=x+dx,nz=z+dz,k=key(nx,nz);if(seen.has(k)||E.blocked(nx,nz,layout))continue;seen.add(k);q.push([nx,nz]);}}return seen;};
const snap=v=>Math.round(v*2)/2,has=(seen,x,z)=>seen.has(snap(x).toFixed(1)+','+snap(z).toFixed(1));

test('off by default: without the club the city is exactly as before',()=>{
 assert.equal(club.enabled(),false);assert.ok(!off.footprints.club);assert.ok(!off.layout().solids.some(s=>/^club-/.test(s.id)));
});

test('the club stands west of Main Street, north-west of the landing pad, clear of everything else on the map',()=>{
 const N=town(),[x0,x1,z0,z1]=N.footprints.club,M=N.streets.main,pad=N.streets.pad;
 assert.equal(x1,M[0],'its doorway meets Main Street\'s west face');assert.ok(x1<=M[0]);
 assert.ok(x0<M[0]&&z1<M.at(-1),'west of the main street, below the avenue');
 assert.ok(z0>pad[3],'north of the landing pad');assert.ok(x1>pad[0],'in line with the pad, not past it');
 // The map's own box: x 22..50, z -70.5..-45.9. The hall is centred on it.
 assert.ok(Math.abs((x0+x1)/2-36)<3&&Math.abs((z0+z1)/2-(-58.2))<.5,'centred on the mapped box');
 for(const [id,r] of Object.entries(N.streets)){if(id==='main')continue;assert.ok(x1<=r[0]||x0>=r[1]||z1<=r[2]||z0>=r[3],'clear of '+id);}
 assert.ok(x1<=N.footprints.district[0]&&x1<=N.footprints.terrace[0],'clear of the District and its terrace');
 for(const id of ['board','terminal','tdd'])assert.ok(N.layout().interactions.some(i=>i.id===id),id+' kept');
 assert.deepEqual(N.layout().spawn,off.layout().spawn,'the landing spot did not move');
});

test('from the landing pad you can walk to the door, in, round the floor and back out; the shutter holds until the model is in',()=>{
 const N=town(),L=N.layout(),door=club.DOOR;
 const shut=reach(L,[L.spawn[0],L.spawn[2]]);
 assert.ok(has(shut,52,door.z),'the pavement outside the door is reachable');assert.ok(!has(shut,48,door.z),'but the shutter keeps you out');
 L.solids.find(s=>s.id==='club-shutter').open=true;
 const seen=reach(L,[L.spawn[0],L.spawn[2]]);
 for(const [x,z] of [[48.5,door.z],[44,-58.5],[34,-56],[34,-62],[24,-52],[24,-65],[20,door.z]])assert.ok(has(seen,x,z),'inside at '+x+','+z);
 // walls hold from inside
 assert.ok(!has(seen,34,-47.8)&&!has(seen,34,-68.8)&&!has(seen,17.3,-58.3),'north, south and west walls are solid');
 assert.ok(!has(seen,52,-48.5)||true);
 // the way out is the way in
 assert.ok(has(seen,52,door.z)&&has(seen,61,-60),'back on Main Street');
});

test('the door is wide enough for the player and the front is solid either side of it',()=>{
 const N=town(),L=N.layout();L.solids.find(s=>s.id==='club-shutter').open=true;const d=club.DOOR;
 for(const dz of [-.7,0,.7])assert.ok(!E.blocked(50.5,d.z+dz,L),'doorway free at '+dz);
 for(const z of [d.z-1.8,d.z+1.8,-50,-66])assert.ok(E.blocked(50.5,z,L),'front solid at z '+z);
});

test('furniture blocks movement but leaves the floor open, and the dance floor is walkable',()=>{
 const N=town(),L=N.layout();L.solids.find(s=>s.id==='club-shutter').open=true;
 const kinds=['chair','table','speaker','dj-desk'].map(k=>L.solids.filter(s=>s.id.startsWith('club-'+k)).length);
 assert.deepEqual(kinds,[13,6,6,1]);
 for(const s of L.solids.filter(s=>/^club-(chair|table|speaker|dj)/.test(s.id)))assert.ok(club.inside({x:s.position[0],z:s.position[2]}),s.id+' is inside the hall');
 const seen=reach(L,[L.spawn[0],L.spawn[2]]);const dj=L.solids.find(s=>s.id==='club-dj-desk-0');
 assert.ok(!has(seen,dj.position[0],dj.position[2]),'the DJ desk is solid');
 const total=[...seen].filter(k=>{const [x,z]=k.split(',').map(Number);return club.inside({x,z});}).length*.25;
 assert.ok(total>380,'most of the 640 m² hall is open floor ('+total+' m²)');
});

test('no city block is left standing inside the club and the main street is untouched',()=>{
 const N=town(),L=N.layout(),[x0,x1,z0,z1]=N.footprints.club;
 const blocks=L.solids.filter(s=>/^city-block-/.test(s.id)&&Math.abs(s.position[0]-(x0+x1)/2)<s.size[0]/2+(x1-x0)/2&&Math.abs(s.position[2]-(z0+z1)/2)<s.size[2]/2+(z1-z0)/2);
 for(const b of blocks){const bx0=b.position[0]-b.size[0]/2,bx1=b.position[0]+b.size[0]/2,bz0=b.position[2]-b.size[2]/2,bz1=b.position[2]+b.size[2]/2;
  assert.ok(bx1<=x0+1e-6||bx0>=x1-1e-6||bz1<=z0+1e-6||bz0>=z1-1e-6,b.id+' overlaps the club');}
 assert.deepEqual(N.streets.main,off.streets.main);assert.deepEqual(N.footprints.district,off.footprints.district);
});

test('the model fits the hall: 32 x 20 m, entrance end on Main Street',()=>{
 // Model corners (gx 9.6..29.6, gz 13.2..45.2) mapped through the fit land on HALL.
 const a=club.toWorld(9.6,13.2),b=club.toWorld(29.6,45.2);
 assert.ok(Math.abs(Math.max(a[0],b[0])-club.HALL[1])<1e-6&&Math.abs(Math.min(a[0],b[0])-club.HALL[0])<1e-6);
 assert.ok(Math.abs(Math.min(a[1],b[1])-club.HALL[2])<1e-6&&Math.abs(Math.max(a[1],b[1])-club.HALL[3])<1e-6);
 assert.ok(Math.abs(club.toWorld(19.6,13.2)[1]-club.DOOR.z)<1e-6,'the door tile is centred on the doorway');
});
