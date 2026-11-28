'use strict';
// PLUG & PLAY (void-runner/low-quay-club.js): the way in, the dining floor, the alcove, the kitchen and the backstage are reachable on foot; each room's approach point is
// open floor; the glass is closed on the audience side; the dancers' route leads from the stage deck through the rear doorway into backstage.
const test=require('node:test'),assert=require('node:assert/strict');
const LQ=require('../void-runner/low-quay.js'),CL=require('../void-runner/low-quay-club.js'),PL=require('../void-runner/places.js');
const Crowd=require('../void-runner/crowd.js');
const R=.38,L=LQ.layout(),hits=(solids,x,z,r=R)=>solids.some(s=>Math.abs(x-s.position[0])<s.size[0]/2+r&&Math.abs(z-s.position[2])<s.size[2]/2+r);
const blockedBy=solids=>(x,z)=>Math.abs(x)>L.bounds[0]-R||Math.abs(z)>L.bounds[1]-R||hits(solids,x,z);
let blocked=blockedBy(L.solids);
// flood fill on a 0.2 m grid over the club and the alley in front of it, from the alley
function reach(){const S=.2,x0=22.4,x1=44,z0=356,z1=386,nx=Math.round((x1-x0)/S),nz=Math.round((z1-z0)/S),seen=new Uint8Array(nx*nz),q=[];
 const id=(i,j)=>j*nx+i,start=[Math.round((24-x0)/S),Math.round((371-z0)/S)];seen[id(...start)]=1;q.push(start);
 while(q.length){const [i,j]=q.pop();for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){const a=i+di,b=j+dj;if(a<0||b<0||a>=nx||b>=nz||seen[id(a,b)])continue;if(blocked(x0+a*S,z0+b*S))continue;seen[id(a,b)]=1;q.push([a,b]);}}
 return (x,z)=>!!seen[id(Math.round((x-x0)/S),Math.round((z-z0)/S))];}
const can=reach(),S_RISER=CL.STAGE.h/CL.STAGE.steps;

test('the club replaces its block: its doorway is open from the alley',()=>{
 assert.ok(!L.solids.some(s=>/^block-/.test(s.id)&&Math.abs(s.position[0]-35)<1&&Math.abs(s.position[2]-371)<1),'the block box is gone');
 assert.ok(can(27.5,371),'inside the doorway');assert.ok(CL.inside(30,371)&&!CL.inside(24,371));
});
test('dining floor, alcove, kitchen and backstage are reachable on foot',()=>{
 for(const [x,z,what] of [[30.4,371,'dining aisle'],[30.9,364.2,'between booths'],[39.5,363,'the alcove'],[34.65,380.5,'the kitchen'],[37.5,379.25,'between the island and the hatch'],[40.4,381,'the backstage room'],[41.6,370,'the corridor behind the stage']])
  assert.ok(can(x,z),what+' at '+x+','+z);
});
test('the space behind the glass outside the dancers\' steps is never reached; the kitchen and backstage doors are separate',()=>{
 for(const [x,z] of [[39.8,366],[39.8,374.5],[39.8,369.6],[39.8,372.4]])assert.ok(!can(x,z),'off-limits '+x+','+z);
 const [k0,k1]=CL.SIDE.kitchenDoor,[b0,b1]=CL.SIDE.backDoor;assert.ok(k1<b0-1,'the kitchen door is nearer the dining floor and clear of the backstage door');
});
test('the audience-side glass is solid: the deck is reached only through the rear doorway, and every front, side and diagonal facet blocks',()=>{
 const S=CL.STAGE,a=S.apothem;
 // close the back door: with it shut nothing on the floor reaches the deck, so the front and side glass have no gap
 const shut=[...L.solids,{id:'test-shut',position:[CL.BACK.x+CL.BACK.t/2,1,CL.BACK.door.z],size:[CL.BACK.t,2,CL.BACK.door.half*2+.1]}];
 const keep=blocked;blocked=blockedBy(shut);const closed=reach();blocked=keep;
 for(const [x,z] of [[S.x,S.z],[S.x+2,S.z+1],[S.x-2,S.z-1.5],[S.x,S.z+2.6],[S.x,S.z-2.6]])assert.ok(!closed(x,z),'the deck at '+x+','+z+' is sealed from the audience');
 assert.ok(closed(30.4,371),'the audience floor is still open');
 // each facet except the rear one: a point just outside and just inside, on the facet's normal, are both separated by glass
 for(let k=1;k<8;k++){const f=k*Math.PI/4,c=Math.cos(f),sn=Math.sin(f);
  for(const off of [-.8,0,.8]){const tx=-sn*off,tz=c*off;let blockedSeg=false;for(let d=a-.6;d<=a+.6;d+=.02)if(hits(L.solids,S.x+c*d+tx,S.z+sn*d+tz,.05))blockedSeg=true;assert.ok(blockedSeg,'facet '+k+' offset '+off+' is glass');}}
 // the rear facet is open only at its doorway
 const rearOpen=z=>{for(let x=S.x+a-.5;x<=S.x+a+.5;x+=.02)if(hits(L.solids,x,z,.05))return false;return true;};
 assert.ok(rearOpen(S.z),'the rear doorway is open');assert.ok(!rearOpen(S.z+S.rear.half+.3)&&!rearOpen(S.z-S.rear.half-.3),'glass either side of the rear doorway');
});
test('each room marker is its own approach point: open floor with walking clearance, reached from the street door, inside its own room',()=>{
 const at=(x,z)=>PL.deepest({scene:'planet-low-quay',x,z}),seen=new Set();
 for(const room of ['floor','stage','alcove','kitchen','backstage']){
  const n=PL.node('low-quay-plug-and-play-'+room),A=CL.APPROACH[room],[x,,z]=n.enter.spawn;
  assert.deepEqual([x,z,n.enter.yaw],[A.x,A.z,A.yaw],room+' enters at its approach point');assert.deepEqual(PL.target(n.id),[A.x,1.7,A.z],room+' target');
  assert.equal(n.enter.location,'low-quay');assert.ok(Number.isFinite(A.yaw));
  assert.ok(!hits(L.solids,x,z,R+.1),room+' marker has walking clearance');
  assert.ok(can(x,z),room+' marker reached on foot from the street door');
  assert.equal(at(x,z),n.id,room+' marker stands inside its own room');
  assert.equal(CL.heightAt(x,z),0,room+' marker is on the floor');
  seen.add(x+','+z);}
 assert.equal(seen.size,5,'five different points, not one shared spawn');
 // the stage marker: an audience viewing spot in front of the front glass, facing the pole, with nothing solid but the steps and glass between
 const A=CL.APPROACH.stage,S=CL.STAGE;assert.ok(A.x<S.x-S.apothem-S.steps*S.stepDepth&&Math.abs(A.z-S.z)<.5);
 assert.ok(Math.abs(Math.atan2(S.x-A.x,S.z-A.z)-A.yaw)<.05,'faces the pole');
 for(let x=A.x+.4;x<S.x-S.apothem-S.steps*S.stepDepth-.06;x+=.05)assert.ok(!hits(L.solids,x,A.z,.05),'clear floor up to the steps');
});
test('the dancers\' route: every leg from the pole to the dressing room is clear of collision, the heights change one riser at a time, and it reaches backstage',()=>{
 const W=CL.STAGE_WAYPOINTS,route=CL.DANCER_ROUTE.map(k=>W[k]);assert.ok(route.every(Boolean));
 for(const [k,[x,z,y]] of Object.entries(W)){assert.ok(!hits(L.solids,x,z),k+' is clear');assert.ok(Math.abs(CL.heightAt(x,z)-y)<1e-9,k+' height '+y);assert.ok(can(x,z),k+' is connected');}
 let last=CL.heightAt(route[0][0],route[0][1]);
 for(let i=1;i<route.length;i++){const [x0,z0]=route[i-1],[x1,z1]=route[i],n=Math.ceil(Math.hypot(x1-x0,z1-z0)/.04);
  for(let j=0;j<=n;j++){const x=x0+(x1-x0)*j/n,z=z0+(z1-z0)*j/n;assert.ok(!hits(L.solids,x,z),'leg '+CL.DANCER_ROUTE[i]+' clear at '+x.toFixed(2)+','+z.toFixed(2));
   const h=CL.heightAt(x,z);assert.ok(Math.abs(h-last)<=S_RISER+1e-9,'no drop of more than a riser at '+x.toFixed(2));last=h;}}
 assert.equal(PL.deepest({scene:'planet-low-quay',x:W.dressing[0],z:W.dressing[1]}),'low-quay-plug-and-play-backstage');
 assert.equal(PL.deepest({scene:'planet-low-quay',x:W.pole[0],z:W.pole[1]}),'low-quay-plug-and-play-stage');
 assert.equal(LQ.groundHeight(W.pole[1],W.pole[0]),LQ.CITY_Y+CL.STAGE.h,'the scene\'s walk height follows the deck');
 assert.equal(LQ.groundHeight(W.corridor[1],W.corridor[0]),LQ.CITY_Y);
});
test('every diner sits inside the club, and the robot arms stand on the kitchen counters',()=>{
 for(const [x,z] of CL.DINERS)assert.ok(CL.inside(x,z),'diner at '+x+','+z);
 for(const a of CL.ARMS)assert.ok(a.x>CL.KITCHEN.x0&&a.x<CL.KITCHEN.x1&&a.z>CL.KITCHEN.z0&&a.z<CL.KITCHEN.z1,a.id);
});
test('each diner has a registered crowd model and its configured animation clip',()=>{
 const models=CL.models();
 for(const [,,,look,clip] of CL.DINERS){
  assert.ok(models['crowd:'+look],'missing diner model '+look);
  assert.ok(Crowd.clips[look]?.includes(clip),look+' is missing animation '+clip);
 }
});
