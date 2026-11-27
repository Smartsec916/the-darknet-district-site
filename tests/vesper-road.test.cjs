/* Vesper road (void-runner/vesper.js, docs/development/VESPER_ROAD.md): the drivable-ready road out of the Ward Repair yard, its ground height, and the
   workshop layout it must leave untouched. Pure: no browser. */
const test=require('node:test'),assert=require('node:assert/strict');
const V=require('../void-runner/vesper-visuals.js'),{road:R,models,REPLACED}=require('../void-runner/vesper.js'),O=require('../void-runner/opening-data.js');
const L=O.layout(),hit=(x,z,s,pad=0)=>Math.abs(x-s.position[0])<s.size[0]/2+pad&&Math.abs(z-s.position[2])<s.size[2]/2+pad;

test('the workshop layout keeps its spawn, solids and interaction points; only the walkable x bound grows along the road',()=>{
 assert.deepEqual(L.spawn,[-3,1.68,-17]);assert.equal(L.solids.length,16);assert.deepEqual(L.interactions.map(i=>i.id),['recording','mara','personal-shop','maintenance','board']);
 assert.deepEqual(L.bounds,[R.X_LIMIT,80],'the x bound is the road\'s walkable end; z stays 80');
});

test('the centre line is continuous, starts on the front apron and runs far past the walkable area',()=>{
 const c=R.centreline();assert(c.length>300);for(let i=1;i<c.length;i++)assert(Math.hypot(c[i].x-c[i-1].x,c[i].z-c[i-1].z)<2.5,'gap at '+i);
 assert(Math.hypot(c[0].x-14,c[0].z-5)<.01);assert(R.total()>700);const u=R.usableLength();assert(u>200&&u<R.total());
 const end=c.find(p=>p.s>=u);assert(Math.abs(end.x-R.X_LIMIT)<2);
});

test('no collision solid or interaction point sits on the road or the parking apron (a vehicle is never blocked by layout data)',()=>{
 for(const p of R.centreline().filter(p=>p.s<=R.usableLength()))for(const side of [-1,0,1]){const x=p.x-p.tz*side*R.WIDTH/2,z=p.z+p.tx*side*R.WIDTH/2;for(const s of L.solids)assert(!hit(x,z,s,.4),s.id+' on the road at s='+p.s.toFixed(1));}
 const [cx,cz]=R.PARKING.center,[w,d]=R.PARKING.size;for(let x=cx-w/2;x<=cx+w/2;x+=.5)for(let z=cz-d/2;z<=cz+d/2;z+=.5){assert(R.onParking(x,z));for(const s of L.solids)assert(!hit(x,z,s,.4),s.id+' on the parking apron');}
 for(const i of L.interactions){assert(!R.onRoad(i.position[0],i.position[2]),i.id);assert(!R.onParking(i.position[0],i.position[2]),i.id);}
});

test('the road keeps clear of the shooting lane and its berm, the Kestrel pad and the comms tower',()=>{
 for(const p of R.centreline()){const edge=R.WIDTH/2;
  assert(!(p.x>24&&p.x<49&&p.z-edge<.5),'into the firing lane at s='+p.s.toFixed(1));assert(!(p.x+edge>43&&p.x-edge<54&&p.z-edge<4.6),'into the berm at s='+p.s.toFixed(1));
  assert(!(p.x+edge>1&&p.x-edge<23&&p.z+edge>13&&p.z-edge<37),'across the pad at s='+p.s.toFixed(1));
  assert(Math.hypot(p.x-27,p.z-42)>8);}
});

test('ground height: flat and smooth on the walkable road and parking, following the drawn terrain beyond it',()=>{
 for(const p of R.centreline().filter(p=>p.s<=R.usableLength())){assert.equal(R.groundAt(p.x,p.z),R.SURFACE_Y);}
 assert.equal(R.groundAt(...R.PARKING.center),R.SURFACE_Y);assert.equal(R.groundAt(0,40),0,'open sand in the yard');
 let prev=null;for(const p of R.centreline().filter(p=>p.s>R.usableLength())){const g=R.groundAt(p.x,p.z),t=V.meshHeight(p.x,p.z);assert(g>=t-1e-9&&g-t<2.5,'road stays on the terrain at s='+p.s.toFixed(1));if(prev!==null)assert(Math.abs(g-prev)<3,'no step at s='+p.s.toFixed(1));prev=g;}
});

test('the drawn terrain height matches the mesh vertices exactly, and the refactor kept the old heights',()=>{
 const G=V.terrainGrid('medium');for(let k=1;k<G.ringCount;k+=3)for(let i=0;i<G.segments;i+=13){const a=i/G.segments*Math.PI*2,r=G.radii[k],x=Math.sin(a)*r,z=Math.cos(a)*r;assert(Math.abs(V.meshHeight(x,z)-V.terrainHeight(x,z))<1e-9);}
 assert.equal(V.meshHeight(100,100),0,'inside the inner ring the ground is flat');
});

test('models: the workshop model is Medium and above (Low keeps the code-built shop); the road kit loads on every tier; only the plain fuel cylinder is replaced',()=>{
 assert.deepEqual(Object.keys(models('low')),['vesper:roadkit']);assert.deepEqual(Object.keys(models('medium')).sort(),['vesper:roadkit','vesper:workshop']);
 assert.deepEqual([...REPLACED].sort(),['fuel-cap','fuel-drum']);
 const fs=require('node:fs'),path=require('node:path');for(const f of ['vesper-workshop.glb','vesper-roadkit.glb']){const b=fs.readFileSync(path.join(__dirname,'..','void-runner','assets','models','vesper',f));assert.equal(b.toString('latin1',0,4),'glTF');assert(b.length<3e6,f+' stays small');}
});
