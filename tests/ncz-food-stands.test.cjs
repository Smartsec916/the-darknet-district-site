const test=require('node:test');
const assert=require('node:assert/strict');
const F=require('../void-runner/ncz-food-stands.js');
const Q=require('../void-runner/ncz-quarters.js');
const N=require('../void-runner/neochinatown.js');
const Night=require('../void-runner/ncz-nightlife.js');
const Containers=require('../void-runner/ncz-containers.js');
const Club=require('../void-runner/ncz-nightclub.js');
const Outskirts=require('../void-runner/ncz-outskirts-life.js');
const surface=Q.IDS.filter(q=>q!=='underground');

test('each checkpoint quarter has one vendor, four seats, and three usable player prompts',()=>{
 assert.deepEqual(Object.keys(F.STANDS).sort(),surface.slice().sort());
 assert.equal(new Set(Object.values(F.STANDS).map(s=>s.name)).size,surface.length,'each stand needs its own name');
 for(const q of surface){
  const layout=N.layout('street',q),seats=F.seats(q),prompts=F.seatPrompts(q);
  assert.ok(F.STANDS[q].name.trim()&&F.prompt(q).label.includes(F.STANDS[q].name.toUpperCase()),q+' name in vendor prompt');
  assert.equal(seats.length,4,q);assert.equal(seats.filter(s=>s.occupied).length,1,q);
  assert.equal(prompts.length,3,q);
  assert.equal(layout.interactions.filter(i=>i.action==='ncz-food-vendor'&&i.quarter===q).length,1,q);
  assert.equal(layout.interactions.filter(i=>i.action==='ncz-food-seat'&&i.quarter===q).length,3,q);
  assert.equal(layout.solids.filter(s=>s.id==='food-cart-'+q).length,1,q);
  for(const p of [F.STANDS[q],...seats])assert.ok(Q.inQuarter(q,p.x,p.z,2.6),q+' placement outside quarter');
 }
 const underground=N.layout('street','underground');assert.ok(!underground.interactions.some(i=>i.action==='ncz-food-vendor'||i.action==='ncz-food-seat'));
 const Crowd=require('../void-runner/crowd.js');for(const q of surface){const defs=Crowd.models('neochinatown','low','street',q);assert.ok(defs['crowd:'+F.STANDS[q].look]);assert.ok(defs['crowd:fixer-01']);}
});

test('food carts and stools do not overlap existing solid walls or gate doors',()=>{
 for(const q of surface){
  const base=N.layout('street',q).solids.filter(s=>!s.id?.startsWith('food-'));
  for(const s of F.solids(q))for(const wall of base){
   const [x,,z]=s.position,[sx,,sz]=s.size,[wx,,wz]=wall.position,[ww,,wd]=wall.size;
   const overlap=Math.abs(x-wx)<(sx+ww)/2-.02&&Math.abs(z-wz)<(sz+wd)/2-.02;
   assert.equal(overlap,false,q+' '+s.id+' overlaps '+wall.id);
  }
 }
});

test('sidewalk NPCs keep the food counters clear',()=>{
 for(const s of Object.values(F.STANDS)){
  assert.ok(Night.keepClear.some(([x,z,r])=>x===s.x&&z===s.z&&r>=3));
  assert.ok(Night.standing.some(([x,z])=>Math.hypot(x-s.x,z-s.z)<1));
 }
});

test('ad screen placement leaves a six metre buffer around food stands',()=>{
 const A=require('../void-runner/ad-screens-data.js');
 for(const [q,s] of Object.entries(F.STANDS))assert.equal(A.allowed(q,s.x,s.z,Q.GATES),false,q);
 assert.equal(A.allowed('oldtown',70.7,-106.5,Q.GATES),false,'the Old Town wall screen found by browser regression');
 assert.equal(A.allowed('oldtown',61,-80,Q.GATES),true,'unrelated screen stays eligible');
});

test('full food stand footprints clear destinations, checkpoint approaches, doors and building corners',()=>{
 const footprint=s=>{const p=[[-1.9,-1.8],[-1.9,.695],[1.9,-1.8],[1.9,.695]].map(([x,z])=>F.world(s,x,z));return [Math.min(...p.map(v=>v[0])),Math.max(...p.map(v=>v[0])),Math.min(...p.map(v=>v[1])),Math.max(...p.map(v=>v[1]))];};
 const pointGap=(r,x,z)=>Math.hypot(Math.max(r[0]-x,0,x-r[1]),Math.max(r[2]-z,0,z-r[3]));
 const rectGap=(a,b)=>Math.hypot(Math.max(a[0]-b[1],b[0]-a[1],0),Math.max(a[2]-b[3],b[2]-a[3],0));
 const solidRect=s=>{const [x,,z]=s.position,[w,,d]=s.size;return [x-w/2,x+w/2,z-d/2,z+d/2];};
 const doors=[['District',N.door.x,N.door.z],['NULL',Club.DOOR.x,Club.DOOR.z],...N.milked.DOORS.filter(d=>d.side==='street').map(d=>[d.id,d.x,d.z]),['Kai home',Containers.KAI_HOME.door.x,Containers.KAI_HOME.door.z]];
 const destinations=[...doors,...Q.STOPS.map(s=>['taxi '+s.id,...s.position]),['Port terminal',34.5,-103],['ship boarding',27,-98]];
 const solids=N.layout('all').solids;
 for(const q of surface){const r=footprint(F.STANDS[q]),near=[...solids,...Q.solids(q),...(q==='outskirts'?Containers.solids():[])];
  for(const s of near){const b=solidRect(s),gap=rectGap(r,b);const host={port:'city-block-46',oldtown:'city-block-39',avenue:'city-block-73','far-south':'city-block-18',outskirts:'container-17'}[q];
   assert.ok(gap>=(s.id===host?0:1.5),q+' stand is '+gap.toFixed(2)+' m from '+s.id);
   if(s.id!==host&&(s.id.startsWith('city-block-')||/^container-\d+$/.test(s.id)))for(const x of b.slice(0,2))for(const z of b.slice(2))assert.ok(pointGap(r,x,z)>=3,q+' stand crowds a corner of '+s.id);}
  for(const g of Q.GATES)assert.ok(rectGap(r,g.rect)>=8,q+' stand crowds checkpoint '+g.id);
  for(const [id,x,z] of destinations)assert.ok(pointGap(r,x,z)>=6,q+' stand crowds '+id);
 }
 const r=footprint(F.STANDS.outskirts);
 for(const p of Outskirts.PEOPLE){const points=p.walks?[p,[p.to[0],p.to[1]]]:[p];for(const point of points){const x=Array.isArray(point)?point[0]:point.x,z=Array.isArray(point)?point[1]:point.z;assert.ok(pointGap(r,x,z)>=2.5,'Outskirts stand crowds '+p.id);}}
});

test('taxi bodies clear every counter, occupied seat and customer route through turns',()=>{
 const taxi=require('../void-runner/road-taxi-rules.js');
 const taxiRadius=Math.hypot(taxi.SPEC.length,taxi.SPEC.width)/2;
 for(const q of surface){
  const stand=F.STANDS[q],net=taxi.network(q);
  if(q==='outskirts'){assert.equal(net.edges.length,0);continue;}
  assert.ok(net.edges.length,q);
  const points=F.solids(q).flatMap(box=>{
   const [x,,z]=box.position,[w,,d]=box.size;
   const nx=Math.ceil(w/.2),nz=Math.ceil(d/.2),out=[];
   for(let i=0;i<=nx;i++)for(let j=0;j<=nz;j++)out.push({x:x+w*(i/nx-.5),z:z+d*(j/nz-.5),radius:.15});
   return out;
  });
  for(let t=0;t<54;t+=.1){
   const p=F.customerPose(q,t),[x,z]=F.world(stand,p.x,p.z);
   points.push({x,z,radius:.45});
  }
  for(const point of points)for(const edge of net.edges){
   const nearest=taxi.projectPath(edge.pts,point);
   assert.ok(nearest.d>taxiRadius+point.radius,q+' taxi '+edge.id+' passes inside the dining area');
  }
 }
});

test('vendor menus and both maps resolve the physical counter in every surface quarter',()=>{
 const C=require('../void-runner/consumables.js'),P=require('../void-runner/npc-paths.js');
 const map=require('../void-runner/district-map.js').model(N),catalog=C.seed();
 for(const q of surface){
  const s=F.STANDS[q],vendor=F.prompt(q);
  const pins=map.pois.filter(p=>p.id===vendor.id);
  assert.equal(pins.length,1);assert.deepEqual([pins[0].x,pins[0].z],[vendor.position[0],vendor.position[2]]);
  assert.ok(P.mapData(q).shops.some(shop=>shop.name===s.name&&shop.x===s.x&&shop.z===s.z));
  const listed=C.listing(catalog,vendor.id,null,0);
  assert.ok(listed.entries.some(e=>e.item==='street-supper'&&e.price===12));
  assert.ok(listed.entries.some(e=>e.item==='sprint-tonic'&&e.price===40));
 }
});

test('frontage furniture preserves the 99 existing street entrance records',()=>{
 const doors=require('../void-runner/apartments.js').doors();
 assert.equal(doors.length,99);
 // Baseline on dcc5a3c5, including displayed numbers, exact positions and arrival directions.
 assert.equal(require('node:crypto').createHash('sha256').update(JSON.stringify(doors)).digest('hex'),
  'e18e53994d299deb065f0a06d2caf6c178b6c074b5993b954cb0f69ce6e1d0f3');
});
