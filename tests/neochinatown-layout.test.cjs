const test=require('node:test'),assert=require('node:assert/strict'),N=require('../void-runner/neochinatown.js'),E=require('../void-runner/exploration-controller.js');

// Walks the map on a half-metre grid from where the player lands (David's redesigned NeoChinatown, 2026-10-26).
function reachable(layout){
 const S=.5,seen=new Set(),key=(x,z)=>x.toFixed(1)+','+z.toFixed(1),queue=[[layout.spawn[0],layout.spawn[2]]];seen.add(key(...queue[0]));
 for(let i=0;i<queue.length&&i<200000;i++){const [x,z]=queue[i];for(const [dx,dz] of [[S,0],[-S,0],[0,S],[0,-S]]){const nx=x+dx,nz=z+dz,k=key(nx,nz);if(seen.has(k)||E.blocked(nx,nz,layout))continue;seen.add(k);queue.push([nx,nz]);}}
 return queue;
}
const near=(cells,[x,,z],r)=>cells.some(([cx,cz])=>Math.hypot(cx-x,cz-z)<=r);

test('from the landing pad the street, alley and District door can be reached on foot',()=>{
 const L=N.layout(),cells=reachable(L);
 for(const id of ['board','terminal','tdd'])assert(near(cells,L.interactions.find(i=>i.id===id).position,L.interactions.find(i=>i.id===id).range),id+' within reach');
 // The District stays shut until its door opens.
 assert(!near(cells,L.interactions.find(i=>i.id==='admin').position,3),'Admin is behind the District door');
});

test('with the District doors open every room and the stairs can be reached',()=>{
 const L=N.layout();L.solids=L.solids.filter(s=>!['district-door','district-inner-door','meeting-door'].includes(s.id));
 const cells=reachable(L);
 for(const i of L.interactions.filter(i=>!['district-stairs-down'].includes(i.id)))assert(near(cells,i.position,i.range),i.id+' within reach');
});

test('the terrace is its own space, reached by the stairs',()=>{
 const L=N.layout(),down=L.interactions.find(i=>i.id==='district-stairs-down'),[x,z]=N.toWorld(30.6,66.5);
 assert.equal(N.zone({x,z}).area,'terrace');assert(Math.hypot(x-down.position[0],z-down.position[2])<=down.range,'the stairs land next to the way back down');
 assert(!E.blocked(x,z,L),'the landing spot is open floor');
});

test('the District plan is turned, not mirrored, and the alley meets its door',()=>{
 const [dx,dz]=N.toWorld(0,20);assert.deepEqual([dx,dz],[N.door.x,N.door.z]);
 // Left of the hallway (VR, pods) ends up east of it; the hallway runs south from the alley.
 assert(N.toWorld(-10,36)[0]>N.door.x);assert(N.toWorld(0,70)[1]<N.door.z);
 const A=N.streets.alley;assert(N.door.x>A[0]&&N.door.x<A[1]&&Math.abs(N.door.z-A[2])<.5,'the door opens off the alley');
});
