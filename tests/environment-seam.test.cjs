/* Pins where The Darknet District interior meets NeoChinatown today (docs/void-runner/environment-separation.md).
   The interior layout is unchanged until the revised map arrives; update these numbers on purpose when it does. */
const test=require('node:test'),assert=require('node:assert/strict');
const N=require('../void-runner/neochinatown.js'),L=N.layout();
const area=p=>N.zone({x:p[0],z:p[2]}).area;
const group=(items)=>items.reduce((m,i)=>((m[area(i.position)]??=[]).push(i.id),m),{});
test('every interaction and solid belongs to exactly one of street, district or terrace',()=>{
 for(const item of [...L.interactions,...L.solids])assert(['street','district','terrace'].includes(area(item.position)),item.id);
});
test('the interior owns the District interactions, plus the terrace stairs',()=>{
 const g=group(L.interactions);
 assert.deepEqual(g.street.sort(),['board','terminal']);
 assert.deepEqual(g.district.sort(),['admin','district-arcade-blackout','district-arcade-soon-north','district-arcade-soon-south','district-arcade-zombies','district-bar','district-iris','district-meeting','district-pod','district-pod-02','district-pod-03','district-pod-04','district-pod-05','district-pod-06','district-pod-07','district-pod-08','district-pod-09','district-pod-10','district-shop','district-stairs','district-vending','district-vr','district-wardrobe']);
 assert.deepEqual(g.terrace,['district-stairs-down']);
});
test('solids split 50 district, 3 terrace, 29 street',()=>{
 const g=group(L.solids);assert.equal(g.district.length,50);assert.equal(g.terrace.length,3);assert.equal(g.street.length,29);
});
test('the security vestibule is two doors six metres apart, both on the District side of the seam',()=>{
 const outer=L.solids.find(s=>s.id==='district-door'),inner=L.solids.find(s=>s.id==='district-inner-door');
 assert(outer&&inner);assert(Math.abs(Math.abs(outer.position[2]-inner.position[2])-6)<1e-9);assert.equal(outer.position[0],inner.position[0]);
 assert.equal(area(outer.position),'district');assert.equal(area(inner.position),'district');
});
test('the street spawn and the landing pad are outside the interior',()=>{
 assert.equal(area(L.spawn),'street');assert.equal(area(L.interactions.find(i=>i.id==='board').position),'street');
});
test('the interior is its own footprint, and toWorld is its own inverse',()=>{
 const [a,b,c,d]=N.footprints.district;assert(b>a&&d>c);const [x,z]=N.toWorld(3,40),[x2,z2]=N.toWorld(x,z);assert(Math.abs(x2-3)<1e-9);assert(Math.abs(z2-40)<1e-9);
});
test('layoutByArea partitions the layout exactly, with nothing lost or duplicated',()=>{
 const by=N.layoutByArea();
 for(const k of ['solids','interactions']){const all=[...by.street[k],...by.district[k],...by.terrace[k]];assert.equal(all.length,L[k].length);assert.deepEqual(all.map(i=>i.id).sort(),L[k].map(i=>i.id).sort());}
 assert.equal(by.district.solids.length,50);assert.equal(by.district.interactions.length,23);assert.equal(by.terrace.interactions[0].id,'district-stairs-down');
});
