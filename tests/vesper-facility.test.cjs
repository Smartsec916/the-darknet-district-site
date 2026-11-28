/* The Vesper road's end (void-runner/vesper-sites.js, data from tools/assets/vesper/build_vesper_facility.py; docs/development/VESPER_ROAD.md): the guard shack,
   the warehouse-looking facility with its big doors and the shared housing unit. Pure: no browser. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const S=require('../void-runner/vesper-sites.js'),W=require('../void-runner/vesper-world.js'),{road:R,vehicleBounds}=require('../void-runner/vesper.js'),O=require('../void-runner/opening-data.js'),X=require('../void-runner/exploration-controller.js'),P=require('../void-runner/places.js');
const f=S.sites().find(s=>s.id==='facility'),L=O.layout(),[ox,oz]=f.origin,solid=id=>L.solids.find(s=>s.id==='vesper-facility-'+id);

test('the road ends at the facility, and the guard shack and its barrier come first',()=>{
 const end=R.centreline().at(-1);assert(Math.hypot(end.x-ox,end.z-oz)<1,'the road ends at the gateway');
 const shack=f.places.find(p=>p.id==='vesper-guard-shack'),s=R.nearest((shack.rect[0]+shack.rect[1])/2,(shack.rect[2]+shack.rect[3])/2).s,gate=R.nearest(ox-35,oz).s;
 assert(s<gate&&gate<=R.total(),'shack at s='+s.toFixed(0)+' before the gateway at '+gate.toFixed(0));
 assert(R.total()>9500,'the road is '+R.total().toFixed(0)+' m');
 const b=fs.readFileSync(path.join(__dirname,'..','void-runner',f.model));assert.equal(b.toString('latin1',0,4),'glTF');assert(b.length<3.5e6,'modest model');
});

test('the barrier is open and nothing blocks the road to its end; the truck reaches the yard',()=>{
 const VR=require('../void-runner/vehicle-rules.js'),world={solids:L.solids,bounds:L.bounds,inBounds:vehicleBounds,groundHeight:R.groundAt};
 for(const p of R.centreline().filter(p=>p.x>ox-80))assert(!VR.collides(p.x,p.z,Math.PI/2,world),'blocked at s='+p.s.toFixed(0));
 assert(!VR.collides(ox+5,oz+10,0,world)&&!VR.collides(ox+5,oz-10,0,world),'drives on the yard');
 for(let x=ox-20;x<=ox+12;x+=4)for(let z=oz-30;z<=oz+30;z+=6)if(x>=ox||Math.abs(z-oz)>=24)assert(Math.abs(W.height(x,z)-(f.y-W.FLOOR))<.05,'yard flat at '+(x-ox)+','+(z-oz));
});

test('the warehouse: three big doors on its west side, shut (solid), and the whole building solid; the housing unit solid; the compound fenced but for the gateway',()=>{
 const doors=L.solids.filter(s=>/vesper-facility-wh-door-/.test(s.id));assert.equal(doors.length,3);for(const d of doors){assert(Math.abs(d.position[0]-(ox+18))<.5,'on the west wall');assert(d.size[2]>=6.9,'big: '+d.size[2]);}
 assert(X.blocked(ox+18,oz-10,L),'a door is shut');assert(X.blocked(ox+18.1,oz+11.6,L),'the personnel door is shut');
 assert(!X.blocked(ox+14,oz-10,L),'the apron in front of the doors');
 assert(X.blocked(ox+29,oz+27,L),'housing unit');
 assert(!X.blocked(ox-35,oz,L)&&X.blocked(ox-35,oz+20,L)&&X.blocked(ox+10,oz+46,L),'gateway open, fence closed');
});

test('the guard shack is entered through its door; places with approach points',()=>{
 const q=f.places.find(p=>p.id==='vesper-guard-shack'),w={x:q.approach[0],z:q.approach[1],yaw:q.yaw,pitch:0};for(let i=0;i<80;i++)X.step(w,{x:0,z:1},.05,L);
 assert(S.inRect(q.rect,w.x,w.z),'inside the shack at '+(w.x-ox).toFixed(1)+','+(w.z-oz).toFixed(1));
 for(const id of ['vesper-facility','vesper-guard-shack','vesper-warehouse','vesper-housing']){const n=P.node(id);assert(n&&n.proposed,id);const t=P.target(id);
  assert(Math.abs(t[1]-(R.groundAt(t[0],t[2])+1.7))<.15,id+' approach height');assert(!X.blocked(t[0],t[2],L),id+' approach free');}
 assert.equal(P.deepest({scene:'vesper',x:q.inside[0],z:q.inside[1]}),'vesper-guard-shack');
});
