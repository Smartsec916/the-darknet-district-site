// Tropical Escape fishing: where a cast is allowed (anywhere on the pier while facing the water, the owner, 17 Nov 2026) and where the float lands.
const test=require('node:test'),assert=require('node:assert/strict');
globalThis.VoidVR={register(){}};
globalThis.VoidVRKit={kit(){},spot:(id,label,x,z,range=2.4)=>({id:'vr-'+id,label,position:[x,1.7,z],action:'vr-act',range})};
require('../void-runner/vr-tropical.js');
const F=globalThis.VoidTropicalFishing,deg=d=>d*Math.PI/180;
// yaw 0 looks out to sea (+z), PI/2 to +x, -PI/2 to -x, PI back to the beach
let seed=7;const rnd=()=>((seed=seed*16807%2147483647)-1)/2147483646;

test('facing the water from anywhere on the pier allows a cast',()=>{
  const spots=[[21.5,25],[20.6,15],[22.4,30],[21.5,33],[21,19]];
  for(const [x,z] of spots)for(const yaw of [0,Math.PI/2,-Math.PI/2,deg(45),deg(-45)]){
    const f=F.facing(x,z,yaw);assert.equal(f.ok,true,'at '+x+','+z+' yaw '+yaw.toFixed(2)+': '+JSON.stringify(f));
    assert.ok(Math.abs(f.off)<=F.CONE+1e-9,'within 60 degrees of straight ahead');}
});

test('straight ahead wins when it reaches the water',()=>{
  const f=F.facing(21.5,25,Math.PI/2);assert.equal(f.off,0);assert.ok(f.lo>=1&&f.hi<=11&&f.hi>=f.lo);
  const g=F.facing(21.5,25,0);assert.equal(g.off,0,'straight down the pier to the open sea past its end');
});

test('facing inland, back toward the beach, gives no cast',()=>{
  for(const [x,z] of [[21.5,25],[21.5,30],[21.5,15],[21.5,11]]){const f=F.facing(x,z,Math.PI);assert.equal(f.ok,false,x+','+z);assert.equal(f.why,'inland');}
  // on the planks over the sand, facing along the beach: sand ahead
  assert.equal(F.facing(21.5,9,Math.PI/2).ok,false);assert.equal(F.facing(21.5,9,-Math.PI/2).ok,false);
});

test('only from the pier deck',()=>{
  for(const [x,z] of [[0,0],[-10,9],[24,12],[18,9]])assert.deepEqual(F.facing(x,z,0),{ok:false,why:'off-pier'});
});

test('a slight turn off the beach line still finds the water to the side (the cone is generous)',()=>{
  const f=F.facing(21.5,25,Math.PI-deg(25));assert.equal(f.ok,true);assert.ok(Math.abs(f.off)<=F.CONE);
});

test('the float lands on open water in front of the player, a new spot each time',()=>{
  const seen=new Set();
  for(const [x,z,yaw] of [[21.5,25,Math.PI/2],[21.5,25,-Math.PI/2],[21.5,32,0],[20.6,18,-deg(30)],[22.4,28,deg(120)]])for(let i=0;i<20;i++){
    const t=F.target(x,z,yaw,rnd);assert.equal(t.ok,true);assert.ok(F.inSea(t.x,t.z),'in the sea: '+t.x.toFixed(2)+','+t.z.toFixed(2));
    const d=Math.hypot(t.x-x,t.z-z);assert.ok(d>=3&&d<=11.5,'distance '+d);
    const dir=Math.atan2(t.x-x,t.z-z),diff=Math.abs(Math.atan2(Math.sin(dir-yaw),Math.cos(dir-yaw)));assert.ok(diff<=F.CONE+.2,'in front: '+diff);
    seen.add(t.x.toFixed(1)+','+t.z.toFixed(1));}
  assert.ok(seen.size>20);
  assert.equal(F.target(21.5,25,Math.PI,rnd).ok,false);
});

test('the rod rack stands on the pier, near its start, and the cast spot is placed by the world',()=>{
  const [x,z]=F.RACK;assert.ok(x>F.PIER[0]&&x<F.PIER[1]+.1&&z>F.SHORE&&z<20);
  let def=null;globalThis.VoidVR.register=e=>{if(e.id==='tropical')def=e;};delete require.cache[require.resolve('../void-runner/vr-tropical.js')];require('../void-runner/vr-tropical.js');
  const L=def.layout({}),rack=L.interactions.find(i=>i.id==='vr-rack'),fish=L.interactions.find(i=>i.id==='vr-fish');
  assert.equal(rack.label,'TAKE A FISHING ROD');assert.ok(F.onPier(rack.position[0],rack.position[2]));assert.ok(fish,'the cast prompt exists (the world moves it to the player each frame)');
  assert.ok(L.solids.some(s=>s.id==='vr-rod-rack'));
});
