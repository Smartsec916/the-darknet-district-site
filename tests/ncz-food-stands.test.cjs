const test=require('node:test');
const assert=require('node:assert/strict');
const F=require('../void-runner/ncz-food-stands.js');
const Q=require('../void-runner/ncz-quarters.js');
const N=require('../void-runner/neochinatown.js');
const Night=require('../void-runner/ncz-nightlife.js');

test('each checkpoint quarter has one vendor, four seats, and three usable player prompts',()=>{
 assert.deepEqual(Object.keys(F.STANDS).sort(),Q.IDS.slice().sort());
 for(const q of Q.IDS){
  const layout=N.layout('street',q),seats=F.seats(q),prompts=F.seatPrompts(q);
  assert.equal(seats.length,4,q);assert.equal(seats.filter(s=>s.occupied).length,1,q);
  assert.equal(prompts.length,3,q);
  assert.equal(layout.interactions.filter(i=>i.action==='ncz-food-vendor'&&i.quarter===q).length,1,q);
  assert.equal(layout.interactions.filter(i=>i.action==='ncz-food-seat'&&i.quarter===q).length,3,q);
  assert.equal(layout.solids.filter(s=>s.id==='food-cart-'+q).length,1,q);
  for(const p of [F.STANDS[q],...seats])assert.ok(Q.inQuarter(q,p.x,p.z,2.6),q+' placement outside quarter');
 }
});

test('food carts and stools do not overlap existing solid walls or gate doors',()=>{
 for(const q of Q.IDS){
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
