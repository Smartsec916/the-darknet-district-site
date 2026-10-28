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
test('the bedroom keeps every seat and its companion spots off the furniture, and its interactions unchanged',()=>{
  const L=registered.find(e=>e.id==='suite').layout({choice:'f'});
  assert.deepEqual(L.interactions.map(i=>i.label),['TALK','MOOD LIGHTING','MUSIC','CURTAINS','SIT ON THE SOFA','SIT ON THE BED','SIT IN THE ARMCHAIR','LEAN ON THE BALCONY RAIL']);
  // Where the companion stands, and the spot it walks to before sitting, are open floor.
  for(const [x,z] of [[3.6,.3],[-3.7,.55]])assert.equal(E.blocked(x,z,L),false,x+','+z);
});
test('the bedroom geometry builds outward-facing boxes and draped cloth',()=>{
  require('../void-runner/vr-suite-room.js');const {box}=globalThis.VoidVRSuiteRoom;
  for(const d of [box([1,2,3]),box([.8,.2,.5],.09,1.4,8)]){assert.equal(d.p.length,d.n.length);assert.equal(d.uv.length/2,d.p.length/3);
   // Every triangle faces the same way as its normals (Babylon's convention: (p1-p2) x (p3-p2)).
   for(let t=0;t<d.i.length;t+=3){const [a,b,c]=[d.i[t]*3,d.i[t+1]*3,d.i[t+2]*3],P=d.p,N=d.n,u=[P[a]-P[b],P[a+1]-P[b+1],P[a+2]-P[b+2]],v=[P[c]-P[b],P[c+1]-P[b+1],P[c+2]-P[b+2]];
    const f=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];assert.ok(f[0]*(N[a]+N[b]+N[c])+f[1]*(N[a+1]+N[b+1]+N[c+1])+f[2]*(N[a+2]+N[b+2]+N[c+2])>=-1e-9);}}
});
