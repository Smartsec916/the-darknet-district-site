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
  for(const s of near){const b=solidRect(s),gap=rectGap(r,b);assert.ok(gap>=1.5,q+' stand is '+gap.toFixed(2)+' m from '+s.id);
   if(s.id.startsWith('city-block-')||/^container-\d+$/.test(s.id))for(const x of b.slice(0,2))for(const z of b.slice(2))assert.ok(pointGap(r,x,z)>=3,q+' stand crowds a corner of '+s.id);}
  for(const g of Q.GATES)assert.ok(rectGap(r,g.rect)>=8,q+' stand crowds checkpoint '+g.id);
  for(const [id,x,z] of destinations)assert.ok(pointGap(r,x,z)>=6,q+' stand crowds '+id);
 }
 const r=footprint(F.STANDS.outskirts);
 for(const p of Outskirts.PEOPLE){const points=p.walks?[p,[p.to[0],p.to[1]]]:[p];for(const point of points){const x=Array.isArray(point)?point[0]:point.x,z=Array.isArray(point)?point[1]:point.z;assert.ok(pointGap(r,x,z)>=2.5,'Outskirts stand crowds '+p.id);}}
});
