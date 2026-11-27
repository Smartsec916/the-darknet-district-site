'use strict';
// Low Quay (Stale System): the pure rules in void-runner/low-quay.js (berth terminals, the stair walk height, the layout).
const test=require('node:test'),assert=require('node:assert/strict');
const LQ=require('../void-runner/low-quay.js');
const blocked=(x,z,loc)=>loc.solids.some(s=>Math.abs(x-s.position[0])<s.size[0]/2+.38&&Math.abs(z-s.position[2])<s.size[2]/2+.38);

test('berth terminal: no ship, same berth, and calling the ship to another berth',()=>{
 assert.equal(LQ.plan({shipAccess:'none',at:1,target:3}).kind,'none');
 assert.equal(LQ.plan({shipAccess:'granted',at:1,target:1}).kind,'here');
 const move=LQ.plan({shipAccess:'granted',at:1,target:2});
 assert.deepEqual([move.kind,move.from,move.to,move.swap],['move',1,2,null]);
 // a berth held by a parked craft: the craft swaps to the berth the ship leaves
 assert.equal(LQ.plan({shipAccess:'granted',at:1,target:4,craftAt:[0,4,5]}).swap,4);
 for(const bad of [-1,6,1.5,'2',undefined])assert.equal(LQ.plan({shipAccess:'granted',at:1,target:bad}).kind,'none');
});

test('six berths, one terminal each, each terminal reachable on foot',()=>{
 assert.equal(LQ.BERTHS.length,6);assert.equal(LQ.TERMINAL_AT.length,6);
 const L=LQ.layout(),terms=L.interactions.filter(i=>i.action==='quay-terminal');
 assert.deepEqual(terms.map(t=>t.berth),[0,1,2,3,4,5]);
 for(const t of terms)assert.ok(!blocked(t.position[0],t.position[2],L),'terminal '+t.id+' stands clear');
 assert.ok(!blocked(L.spawn[0],L.spawn[2],L),'spawn is clear');
});

test('the stairs: walk height is 0 in the station, the city level on the quay, a straight ramp between',()=>{
 const [a,b]=LQ.STAIRS,Y=LQ.CITY_Y;
 assert.equal(LQ.groundHeight(-423),0);assert.equal(LQ.groundHeight(a),0);assert.equal(LQ.groundHeight(b),Y);assert.equal(LQ.groundHeight(400),Y);
 assert.ok(Math.abs(LQ.groundHeight((a+b)/2)-Y/2)<1e-9);
 let prev=-1;for(let z=a-2;z<=b+2;z+=.5){const h=LQ.groundHeight(z);assert.ok(h>=prev);prev=h;}
 // a gentle enough climb to walk: under 30 degrees
 assert.ok(Math.atan2(Y,b-a)<Math.PI/6);
});

test('the train stops and the stairwell are on open floor; the quay edge beside the stairwell is closed',()=>{
 const L=LQ.layout();
 for(const t of L.interactions.filter(i=>i.action==='quay-train'))assert.ok(!blocked(t.position[0],t.position[2],L),t.id);
 // the ride ends at x 0 on each platform
 assert.ok(!blocked(0,-353,L));assert.ok(!blocked(0,275,L));
 // up the stairs: open from the platform to the quay
 for(let z=290;z<=330;z+=1)assert.ok(!blocked(-8,z,L),'stairwell z '+z);
 // beside the stairwell, at its height, there is no floor: closed
 for(const x of [-30,10,40])assert.ok(blocked(x,309,L),'edge x '+x);
 // everything lies inside the bounds
 for(const s of L.solids)assert.ok(Math.abs(s.position[2])<=L.bounds[1]+40);
});
