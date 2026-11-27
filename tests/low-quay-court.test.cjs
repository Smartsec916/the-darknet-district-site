'use strict';
// Low Quay's main alley and food court (void-runner/low-quay-court.js): reachable on foot from the subway stairs; the walkway reached only by its two flights
// (never a jump between the court and the walkway); the window booths closed to players; one documented dancer anchor per window.
const test=require('node:test'),assert=require('node:assert/strict');
const LQ=require('../void-runner/low-quay.js'),CO=require('../void-runner/low-quay-court.js');
const R=.38,L=LQ.layout(),blocked=(x,z)=>Math.abs(x)>L.bounds[0]-R||Math.abs(z)>L.bounds[1]-R||L.solids.some(s=>Math.abs(x-s.position[0])<s.size[0]/2+R&&Math.abs(z-s.position[2])<s.size[2]/2+R);
const S=.2,X0=-40,X1=40,Z0=318.4,Z1=456,nx=Math.round((X1-X0)/S),nz=Math.round((Z1-Z0)/S),seen=new Uint8Array(nx*nz),steps=[];
{const id=(i,j)=>j*nx+i,q=[[Math.round((-12.5-X0)/S),Math.round((320-Z0)/S)]];seen[id(...q[0])]=1;
 while(q.length){const [i,j]=q.pop(),x=X0+i*S,z=Z0+j*S,h=LQ.groundHeight(z,x);for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){const a=i+di,b=j+dj;if(a<0||b<0||a>=nx||b>=nz||seen[id(a,b)])continue;const xx=X0+a*S,zz=Z0+b*S;if(blocked(xx,zz))continue;steps.push(Math.abs(LQ.groundHeight(zz,xx)-h));seen[id(a,b)]=1;q.push([a,b]);}}}
const can=(x,z)=>!!seen[Math.round((z-Z0)/S)*nx+Math.round((x-X0)/S)];
test('from the stairs: up the alley, into the food court, up both flights onto the walkway on all three sides',()=>{
 for(const [x,z,w] of [[-12.5,340,'alley'],[-12.5,405,'alley end'],[-2,430,'court'],[-28,419,'west flight'],[24,419,'east flight'],[-28,440,'west walkway'],[0,453.5,'north walkway'],[24,440,'east walkway']])assert.ok(can(x,z),w+' '+x+','+z);
 assert.equal(LQ.groundHeight(440,-28),LQ.CITY_Y+CO.U);assert.equal(LQ.groundHeight(430,-2),LQ.CITY_Y);
});
test('no step between neighbouring floor cells is more than a stair riser (no jumping from the walkway into the court)',()=>{
 assert.ok(steps.length>1000);assert.ok(Math.max(...steps)<.3,'largest step '+Math.max(...steps).toFixed(2));
});
test('the window booths are closed to players and each window has a documented dancer anchor',()=>{
 assert.ok(CO.WINDOWS.length>=10);assert.equal(CO.WINDOW_ANCHORS.length,CO.WINDOWS.length);
 for(const a of CO.WINDOW_ANCHORS){assert.ok(!can(a.x,a.z),a.id+' not walkable');assert.ok(a.x>CO.ALLEY.x1&&a.x<CO.ALLEY.x1+CO.BOOTH.depth);assert.equal(a.yaw,-Math.PI/2);assert.ok(!/#f{3,6}\b/i.test(a.tint));}
 // one side only: the alley's west side has no windows
 assert.ok(CO.WINDOWS.every(w=>w.z>CO.ALLEY.z0&&w.z<CO.ALLEY.z1));
});
