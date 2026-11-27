/* The Vesper mine (void-runner/vesper-sites.js, data from tools/assets/vesper/build_vesper_mine.py; docs/development/VESPER_ROAD.md): the portal, the adit
   inside the mountain, the cage and the placeholder depth. Pure: no browser. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const S=require('../void-runner/vesper-sites.js'),W=require('../void-runner/vesper-world.js'),{road:R,vehicleBounds}=require('../void-runner/vesper.js'),O=require('../void-runner/opening-data.js'),X=require('../void-runner/exploration-controller.js'),P=require('../void-runner/places.js');
const mine=S.sites().find(s=>s.id==='mine'),L=O.layout(),[ox,oz]=mine.origin;
const walk=(w,n,input={x:0,z:1})=>{for(let i=0;i<n;i++)X.step(w,input,.05,L);return w;};

test('the depth is one placeholder constant and the levels are data: the bottom level sits MINE_DEPTH_M below the adit',()=>{
 assert.equal(S.MINE_DEPTH_M,120);assert.equal(S.MINE_DEPTH_M%mine.section,0,'a whole number of 10 m shaft sections');
 assert.deepEqual(S.LEVELS.map(l=>l.level),[0,1]);assert.equal(S.levelY(1),-S.MINE_DEPTH_M);
 for(const f of mine.floors)assert(Math.abs(f.y-(mine.y+S.levelY(f.level)))<1e-9);
 for(const f of ['vesper-mine.glb','vesper-mine-deep.glb']){const b=fs.readFileSync(path.join(__dirname,'..','void-runner','assets','models','vesper',f));assert.equal(b.toString('latin1',0,4),'glTF');assert(b.length<3e6,f+' modest');}
});

test('the adit is inside the mountain: rock over every metre of its floor, the yard is a flat pad, the cell in front of the headwall is the terrain hole',()=>{
 for(const f of mine.floors.filter(f=>f.level===0)){const [x0,x1,z0,z1]=f.rect;for(let x=x0;x<=x1;x+=1)for(let z=z0;z<=z1;z+=1){if(z-oz<.5)continue;assert(W.height(x,z)>f.y+4.5,'rock over the adit at '+(x-ox)+','+(z-oz));}}
 for(let x=ox-16;x<=ox+8;x+=4)for(let z=oz-16;z<=oz-1;z+=3)assert(Math.abs(W.height(x,z)-(mine.y-W.FLOOR))<.05,'yard pad at '+(x-ox)+','+(z-oz));
 assert.deepEqual(mine.hole,[ox-8,ox+8,oz-8,oz]);assert.equal(mine.hole[3]%8,0,'aligned to the coarsest fine-chunk grid (8 m on Low)');
});

test('walking: from the yard through the portal, along the adit, round the bend into the collar chamber and into the cage; nothing off the tunnels',()=>{
 S.setLevel(0);const w={x:ox+1.5,z:oz-20,yaw:0,pitch:0};walk(w,260);assert(w.z>oz+25,'walked in to z '+(w.z-oz).toFixed(1));
 assert.equal(R.groundAt(w.x,w.z),mine.y,'the adit floor, not the mountain above');
 w.x=ox;w.z=oz+33.3;w.yaw=Math.PI/2;walk(w,260);assert(w.x>ox+23.5,'round the bend to x '+(w.x-ox).toFixed(1));
 const [cx,cz]=mine.cage;w.x=cx-5;w.z=cz;w.yaw=Math.PI/2;walk(w,60);assert(Math.abs(w.x-cx)<1.2&&Math.abs(w.z-cz)<1.2,'into the cage');
 assert(X.blocked(ox+10,oz+10,L),'solid rock between the tunnels');assert(X.blocked(ox,oz+50,L),'past the chamber');
 const prompt=L.interactions.find(i=>i.id==='vesper-mine-cage-down');assert(prompt&&!prompt.hidden);assert(L.interactions.find(i=>i.id==='vesper-mine-cage-up').hidden);
});

test('levels: at the bottom only the bottom level\'s floors, solids and the cage-up prompt count; back at the adit everything is as before',()=>{
 S.setLevel(1);const [cx,cz]=mine.cage;
 assert(!X.blocked(cx-4,cz,L)&&!X.blocked(ox+45,oz+34,L),'the station and the drift');assert(X.blocked(ox+60,oz+34,L),'the cart in the drift');assert(X.blocked(ox,oz+10,L),'the adit is not on this level');
 assert.equal(R.groundAt(ox+45,oz+34),mine.y-S.MINE_DEPTH_M);
 assert(L.interactions.find(i=>i.id==='vesper-mine-cage-down').hidden&&!L.interactions.find(i=>i.id==='vesper-mine-cage-up').hidden);
 assert(L.solids.find(s=>s.id==='vesper-mine-winder').open,'the adit\'s winder is not down here');assert(!L.solids.find(s=>s.id==='vesper-mine-deep-drill-rig').open);
 const w={x:cx-4,z:oz+30.6,yaw:Math.PI/2,pitch:0};while(w.x<ox+32.5)walk(w,1);w.yaw=0;while(w.z<oz+32.6)walk(w,1);w.yaw=Math.PI/2;walk(w,600);assert(w.x>ox+62,'walked the drift to x '+(w.x-ox).toFixed(1));
 S.setLevel(0);assert(!L.solids.find(s=>s.id==='vesper-mine-winder').open&&L.solids.find(s=>s.id==='vesper-mine-deep-drill-rig').open);
});

test('the road and the truck are untouched by the mine; the truck can drive onto the yard; places with approach points',()=>{
 S.setLevel(0);const VR=require('../void-runner/vehicle-rules.js'),world={solids:L.solids,bounds:L.bounds,inBounds:vehicleBounds,groundHeight:R.groundAt};
 for(const p of R.centreline().filter(p=>Math.hypot(p.x-ox,p.z-oz)<80))assert(!VR.collides(p.x,p.z,Math.atan2(p.tx,p.tz),world),'road blocked at s='+p.s.toFixed(0));
 assert(!VR.collides(ox+4,oz-20,0,world),'the yard');
 for(const id of ['vesper-mine','vesper-mine-adit','vesper-mine-bottom']){const n=P.node(id);assert(n&&n.proposed,id);}
 const t=P.target('vesper-mine');assert(Math.abs(t[1]-(R.groundAt(t[0],t[2])+1.7))<.15);assert(!X.blocked(t[0],t[2],L));
 assert.equal(P.deepest({scene:'vesper',x:ox+60,y:mine.y-S.MINE_DEPTH_M+1.7,z:oz+34}),'vesper-mine-bottom');
 assert.equal(P.deepest({scene:'vesper',x:ox,y:mine.y+1.7,z:oz+20}),'vesper-mine-adit');
});
