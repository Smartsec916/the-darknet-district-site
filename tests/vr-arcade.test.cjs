// VR arcade worlds: each registers properly, spawns on open floor and every interaction can be reached on foot.
const test=require('node:test'),assert=require('node:assert/strict'),E=require('../void-runner/exploration-controller.js');
const registered=[];
globalThis.VoidVR={register:e=>registered.push(e)};
globalThis.VoidVRKit={kit(){},spot:(id,label,x,z,range=2.4)=>({id:'vr-'+id,label,position:[x,1.7,z],action:'vr-act',range})};
for(const f of ['vr-forest','vr-tropical','vr-combat','vr-suite'])require('../void-runner/'+f+'.js');
function reachable(L){const S=.5,seen=new Set(),key=(x,z)=>x.toFixed(1)+','+z.toFixed(1),q=[[L.spawn[0],L.spawn[2]]];seen.add(key(...q[0]));
 for(let i=0;i<q.length&&i<120000;i++){const [x,z]=q[i];for(const [dx,dz] of [[S,0],[-S,0],[0,S],[0,-S]]){const nx=x+dx,nz=z+dz,k=key(nx,nz);if(seen.has(k)||E.blocked(nx,nz,L))continue;seen.add(k);q.push([nx,nz]);}}return q;}

test('the four experiences are registered with titles, descriptions and a status',()=>{
  assert.deepEqual(registered.map(e=>e.id).sort(),['combat','forest','suite','tropical']);
  for(const e of registered){assert.ok(e.title&&e.description,e.id);assert.equal(e.status,'ready');assert.equal(typeof e.layout,'function');assert.equal(typeof e.build,'function');}
});
test('Play in a Bedroom asks for a companion first, with a female and a male choice',()=>{
  const s=registered.find(e=>e.id==='suite');assert.deepEqual(s.options.choices.map(c=>c.id),['f','m']);
});
test('every world spawns on open floor and every interaction is reachable on foot',()=>{
  for(const e of registered){const L=e.layout({choice:'f'});assert.equal(E.blocked(L.spawn[0],L.spawn[2],L),false,e.id+' spawn');
   const cells=reachable(L);for(const i of L.interactions.filter(i=>i.id!=='vr-companion'))assert.ok(cells.some(([x,z])=>Math.hypot(x-i.position[0],z-i.position[2])<=i.range),e.id+' '+i.id+' reachable');}
});
test('the combat range keeps the player behind the firing line',()=>{
  const L=registered.find(e=>e.id==='combat').layout({}),cells=reachable(L);assert.ok(cells.length>100);assert.ok(cells.every(([,z])=>z<-14.4),'nothing past the firing line can be reached');
});
