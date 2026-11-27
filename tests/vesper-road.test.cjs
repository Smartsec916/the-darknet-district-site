/* Vesper road (void-runner/vesper.js, docs/development/VESPER_ROAD.md): the drivable-ready road out of the Ward Repair yard, its ground height, and the
   workshop layout it must leave untouched. Pure: no browser. */
const test=require('node:test'),assert=require('node:assert/strict');
const V=require('../void-runner/vesper-visuals.js'),{road:R,models,REPLACED,vehicleBounds}=require('../void-runner/vesper.js'),O=require('../void-runner/opening-data.js'),W=require('../void-runner/vesper-world.js'),X=require('../void-runner/exploration-controller.js');
const L=O.layout(),hit=(x,z,s,pad=0)=>Math.abs(x-s.position[0])<s.size[0]/2+pad&&Math.abs(z-s.position[2])<s.size[2]/2+pad;

test('the workshop layout keeps its spawn, solids, interaction points and yard rectangle; the road corridor is added beside it',()=>{
 assert.deepEqual(L.spawn,[-3,1.68,-17]);assert.equal(L.solids.filter(s=>!s.id.startsWith('vesper-')).length,16,'the yard\'s 16 solids (the road sites\' buildings follow them: vesper-sites.test.cjs)');assert.deepEqual(L.interactions.map(i=>i.id),['recording','mara','personal-shop','maintenance','board']);
 assert.deepEqual(L.bounds,[R.X_LIMIT,80],'the yard rectangle is unchanged');assert.equal(typeof L.walkable,'function');
});

test('the centre line is continuous, starts on the front apron and runs far past the walkable area',()=>{
 const c=R.centreline();assert(c.length>300);for(let i=1;i<c.length;i++)assert(Math.hypot(c[i].x-c[i-1].x,c[i].z-c[i-1].z)<2.5,'gap at '+i);
 assert(Math.hypot(c[0].x-14,c[0].z-5)<.01);assert(R.total()>1300);const u=R.yardLength();assert(u>200&&u<R.total());assert.equal(R.usableLength(),R.total(),'the whole road is walkable and drivable');
 const end=c.find(p=>p.s>=u);assert(Math.abs(end.x-R.X_LIMIT)<2);
});

test('no collision solid or interaction point sits on the road or the parking apron (a vehicle is never blocked by layout data)',()=>{
 for(const p of R.centreline().filter(p=>p.s<=R.yardLength()))for(const side of [-1,0,1]){const x=p.x-p.tz*side*R.WIDTH/2,z=p.z+p.tx*side*R.WIDTH/2;for(const s of L.solids)assert(!hit(x,z,s,.4),s.id+' on the road at s='+p.s.toFixed(1));}
 const [cx,cz]=R.PARKING.center,[w,d]=R.PARKING.size;for(let x=cx-w/2;x<=cx+w/2;x+=.5)for(let z=cz-d/2;z<=cz+d/2;z+=.5){assert(R.onParking(x,z));for(const s of L.solids)assert(!hit(x,z,s,.4),s.id+' on the parking apron');}
 for(const i of L.interactions){assert(!R.onRoad(i.position[0],i.position[2]),i.id);assert(!R.onParking(i.position[0],i.position[2]),i.id);}
});

test('the road keeps clear of the shooting lane and its berm, the Kestrel pad and the comms tower',()=>{
 for(const p of R.centreline()){const edge=R.WIDTH/2;
  assert(!(p.x>24&&p.x<49&&p.z-edge<.5),'into the firing lane at s='+p.s.toFixed(1));assert(!(p.x+edge>43&&p.x-edge<54&&p.z-edge<4.6),'into the berm at s='+p.s.toFixed(1));
  assert(!(p.x+edge>1&&p.x-edge<23&&p.z+edge>13&&p.z-edge<37),'across the pad at s='+p.s.toFixed(1));
  assert(Math.hypot(p.x-27,p.z-42)>8);}
});

test('ground height: flat on the yard road and parking; beyond, the road climbs smoothly (grade <= 10 %) and never sinks into the carved land',()=>{
 for(const p of R.centreline().filter(p=>p.s<=R.yardLength())){assert.equal(R.groundAt(p.x,p.z),R.SURFACE_Y);}
 assert.equal(R.groundAt(...R.PARKING.center),R.SURFACE_Y);assert.equal(R.groundAt(0,40),0,'open sand in the yard');
 let prev=null;for(const p of R.centreline().filter(p=>p.s>R.yardLength())){const g=R.groundAt(p.x,p.z);
  for(const o of [-3.4,0,3.4]){const x=p.x-p.tz*o,z=p.z+p.tx*o;assert(W.height(x,z)<=g+1e-6,'terrain above the road at s='+p.s.toFixed(1));}
  if(prev!==null)assert(Math.abs(g-prev.g)<=.1*(p.s-prev.s)+1e-6,'grade over 10 % at s='+p.s.toFixed(1));prev={g,s:p.s};}
});

test('the pass: the road climbs between the two high points through a saddle well below both, in a cutting no deeper than ~25 m',()=>{
 const [N,S]=W.PEAKS,top=Math.max(...R.centreline().map(p=>R.roadY(p.s))),pk=p=>W.height(p.x,p.z);
 assert(pk(N)>top+120&&pk(S)>top+120,'both peaks stand well above the road ('+pk(N).toFixed(0)+', '+pk(S).toFixed(0)+' vs '+top.toFixed(0)+')');
 for(const p of [N,S])for(const [dx,dz] of [[60,0],[-60,0],[0,60],[0,-60]])assert(pk(p)>W.height(p.x+dx,p.z+dz),'a summit');
 const col=W.nearest(W.PASS.x,W.PASS.z,true);assert(col.distance<15,'the road goes through the saddle');
 // the pass lies between them: the road crosses the line joining the peaks
 const side=p=>Math.sign((S.x-N.x)*(p.z-N.z)-(S.z-N.z)*(p.x-N.x)),L=R.centreline();assert.notEqual(side(L[0]),side(L[L.length-1]));
 for(const p of L.filter(q=>Math.hypot(q.x-W.PASS.x,q.z-W.PASS.z)<120)){const info={};W.height(p.x+p.tz*30,p.z-p.tx*30,info);assert(info.natural-R.roadY(p.s)<26,'cut at s='+p.s.toFixed(0));}
});

test('terrain: the yard is flat as before; the bench under the road is flat; heights are finite and the ground is continuous everywhere around the road',()=>{
 for(const [x,z] of [[0,0],[100,100],[-200,50],[150,-150]])assert.equal(W.height(x,z),-.035);
 for(const p of R.centreline().filter((p,i)=>Math.hypot(p.x,p.z)>W.YARD_R+30&&p.s<R.total()-60&&i%7===0)){const e=R.roadY(p.s);for(const o of [-5,-2,0,2,5]){const h=W.height(p.x-p.tz*o,p.z+p.tx*o);assert(Math.abs(h-(e-W.FLOOR))<.01,'bench at s='+p.s.toFixed(0)+' o='+o);}}
 for(let x=-1500;x<=2500;x+=97)for(let z=-1500;z<=1500;z+=89){const h=W.height(x,z);assert(Number.isFinite(h)&&h>=-.035&&h<600);}
 // the carve never makes a cliff of its own: within 200 m of the road the carved ground is no steeper than the natural ground beside it (plus the bank)
 for(const p of R.centreline().filter((p,i)=>p.s>R.yardLength()&&i%11===0))for(const o of [-150,-90,-40,-20,-12,12,20,40,90,150]){const x=p.x-p.tz*o,z=p.z+p.tx*o,h=W.height(x,z),d=Math.abs(W.height(x+1,z)-h),dn=Math.abs(W.baseHeight(x+1,z)-W.baseHeight(x,z));assert(d<Math.max(1.6,dn+.6),'steep step at s='+p.s.toFixed(0)+' o='+o+' ('+d.toFixed(2)+')');}
});

test('walking: the yard rectangle behaves exactly as before; beyond it a person walks the road corridor and nothing else',()=>{
 const rect={...L,walkable:undefined};
 for(let x=-240;x<=240;x+=7.3)for(let z=-90;z<=90;z+=6.1){if(Math.abs(x)<=R.X_LIMIT-.5&&Math.abs(z)<=79.5)assert.equal(X.blocked(x,z,L),X.blocked(x,z,rect),'yard '+x+','+z);}
 for(const p of R.centreline().filter(p=>p.s>R.yardLength()-10&&p.s<R.total()-60))for(const o of [-7,-3,0,3,7]){const x=p.x-p.tz*o,z=p.z+p.tx*o;assert(!X.blocked(x,z,L),'corridor blocked at s='+p.s.toFixed(0)+' o='+o);}
 for(const p of R.centreline().filter(p=>p.s>R.yardLength()+20))for(const o of [-12,12]){const x=p.x-p.tz*o,z=p.z+p.tx*o;if(Math.abs(x)<=R.X_LIMIT&&Math.abs(z)<=80||require('../void-runner/vesper-sites.js').siteAt(x,z))continue;assert(X.blocked(x,z,L),'off the corridor at s='+p.s.toFixed(0));}
 assert(X.blocked(600,200,L)&&X.blocked(240,60,L),'open mountain is not walkable');
 // a person walking east along the road from the yard ends past the pass
 const w={x:200,z:-8,yaw:Math.PI/2,pitch:0},end=R.centreline()[R.centreline().length-1];for(let i=0;i<40000&&R.nearest(w.x,w.z).s<R.total()-40;i++){const n=R.nearest(w.x+Math.sin(w.yaw)*4,w.z+Math.cos(w.yaw)*4);w.yaw=Math.atan2(n.x+n.tx*6-w.x,n.z+n.tz*6-w.z);X.step(w,{x:0,z:1,run:true},.05,L);}
 assert(R.nearest(w.x,w.z).s>=R.total()-41,'walked to '+w.x.toFixed(0)+', '+w.z.toFixed(0));
});

test('models: the workshop model is Medium and above (Low keeps the code-built shop); the road kit loads on every tier; only the plain fuel cylinder is replaced',()=>{
 assert.deepEqual(Object.keys(models('low')),['vesper:roadkit']);assert.deepEqual(Object.keys(models('medium')).sort(),['vesper:roadkit','vesper:workshop']);
 assert.deepEqual([...REPLACED].sort(),['fuel-cap','fuel-drum']);
 const fs=require('node:fs'),path=require('node:path');for(const f of ['vesper-workshop.glb','vesper-roadkit.glb']){const b=fs.readFileSync(path.join(__dirname,'..','void-runner','assets','models','vesper',f));assert.equal(b.toString('latin1',0,4),'glTF');assert(b.length<3e6,f+' stays small');}
});

test('the utility vehicle (vehicle-rules.js) fits the whole road and the parking apron, its own spot stays clear, and it drives from the yard over the pass to the end',()=>{
 const VR=require('../void-runner/vehicle-rules.js'),world={solids:L.solids,bounds:L.bounds,inBounds:vehicleBounds,groundHeight:R.groundAt};
 for(const p of R.centreline().filter(p=>p.s<=R.total()-8)){const yaw=Math.atan2(p.tx,p.tz);assert(!VR.collides(p.x,p.z,yaw,world),'blocked at s='+p.s.toFixed(1));}
 const [cx,cz]=R.PARKING.center;assert(!VR.collides(cx,cz,R.PARKING.yaw,world),'parking apron');
 const s=VR.SPOTS.vesper;assert(!R.onRoad(s.x,s.z)&&!R.onParking(s.x,s.z));
 assert(VR.collides(600,200,0,world),'the truck cannot leave the corridor into the mountains');
 // drive it: full throttle, steering toward a point 12 m ahead on the centre line
 const p0=R.centreline().find(p=>p.s>=60),v=VR.create({x:p0.x,z:p0.z,yaw:Math.atan2(p0.tx,p0.tz)}),end=R.total()-15;let maxSpeed=0,blocked=0;
 for(let i=0;i<60*1000;i++){const n=R.nearest(v.x,v.z);if(n.s>=end)break;const a=R.centreline().find(p=>p.s>=n.s+12)||n,want=Math.atan2(a.x-v.x,a.z-v.z),err=Math.atan2(Math.sin(want-v.yaw),Math.cos(want-v.yaw));
  VR.step(v,{throttle:1,brake:0,steer:Math.max(-1,Math.min(1,err*3)),handbrake:false,boost:false},1/60,world);maxSpeed=Math.max(maxSpeed,v.speed);if(v.blocked)blocked++;
  assert(Math.abs(v.y-R.groundAt(v.x,v.z))<.6,'wheels on the ground at '+v.x.toFixed(0));}
 assert(R.nearest(v.x,v.z).s>=end,'reached the end of the road (got to s='+R.nearest(v.x,v.z).s.toFixed(0)+')');assert(maxSpeed>13,'at full speed');assert.equal(blocked,0,'never blocked');
});
