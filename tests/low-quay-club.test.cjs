'use strict';
// PLUG & PLAY (void-runner/low-quay-club.js): the way in, the dining floor, the alcove, the kitchen and the backstage are reachable on foot; the stage is not.
const test=require('node:test'),assert=require('node:assert/strict');
const LQ=require('../void-runner/low-quay.js'),CL=require('../void-runner/low-quay-club.js');
const R=.38,L=LQ.layout(),blocked=(x,z)=>Math.abs(x)>L.bounds[0]-R||Math.abs(z)>L.bounds[1]-R||L.solids.some(s=>Math.abs(x-s.position[0])<s.size[0]/2+R&&Math.abs(z-s.position[2])<s.size[2]/2+R);
// flood fill on a 0.2 m grid over the club and the alley in front of it, from the alley
function reach(){const S=.2,x0=22.4,x1=44,z0=356,z1=386,nx=Math.round((x1-x0)/S),nz=Math.round((z1-z0)/S),seen=new Uint8Array(nx*nz),q=[];
 const id=(i,j)=>j*nx+i,start=[Math.round((24-x0)/S),Math.round((371-z0)/S)];seen[id(...start)]=1;q.push(start);
 while(q.length){const [i,j]=q.pop();for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){const a=i+di,b=j+dj;if(a<0||b<0||a>=nx||b>=nz||seen[id(a,b)])continue;if(blocked(x0+a*S,z0+b*S))continue;seen[id(a,b)]=1;q.push([a,b]);}}
 return (x,z)=>!!seen[id(Math.round((x-x0)/S),Math.round((z-z0)/S))];}
const can=reach();

test('the club replaces its block: its doorway is open from the alley',()=>{
 assert.ok(!L.solids.some(s=>/^block-/.test(s.id)&&Math.abs(s.position[0]-35)<1&&Math.abs(s.position[2]-371)<1),'the block box is gone');
 assert.ok(can(27.5,371),'inside the doorway');assert.ok(CL.inside(30,371)&&!CL.inside(24,371));
});
test('dining floor, alcove, kitchen and backstage are reachable on foot',()=>{
 for(const [x,z,what] of [[30.4,371,'dining aisle'],[30.9,364.2,'between booths'],[39.5,363,'the alcove'],[34.65,380.5,'the kitchen'],[37.5,379.25,'between the island and the hatch'],[40.4,381,'the backstage room'],[41.6,370,'the corridor behind the stage']])
  assert.ok(can(x,z),what+' at '+x+','+z);
});
test('the stage and the space behind the glass are never reached; the kitchen and backstage doors are separate',()=>{
 for(const [x,z] of [[CL.STAGE.x,CL.STAGE.z],[CL.STAGE.x+2,CL.STAGE.z+1],[39.8,371],[39.8,366]])assert.ok(!can(x,z),'off-limits '+x+','+z);
 const [k0,k1]=CL.SIDE.kitchenDoor,[b0,b1]=CL.SIDE.backDoor;assert.ok(k1<b0-1,'the kitchen door is nearer the dining floor and clear of the backstage door');
});
test('every diner sits inside the club, and the robot arms stand on the kitchen counters',()=>{
 for(const [x,z] of CL.DINERS)assert.ok(CL.inside(x,z),'diner at '+x+','+z);
 for(const a of CL.ARMS)assert.ok(a.x>CL.KITCHEN.x0&&a.x<CL.KITCHEN.x1&&a.z>CL.KITCHEN.z0&&a.z<CL.KITCHEN.z1,a.id);
 assert.deepEqual(Object.keys(CL.models()).filter(k=>k.startsWith('crowd:')).map(k=>k.slice(6)).filter(l=>/companion|vr-|ava|eva|yuki|dex/i.test(l)),[]);
});
