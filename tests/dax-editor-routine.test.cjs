const test=require('node:test'),assert=require('node:assert/strict');
const R=require('../void-runner/dax-editor-routine.js');
test('no configured routine means one safe stationary character, not the old automatic itinerary',()=>{
 const a=R.position(null,0),b=R.position(null,3600*12);
 assert.deepEqual(a,b);assert.equal(a.source,'default');assert.equal(a.inside,true);
 assert.equal(a.clip,'idle');assert.equal(a.x,1.6);assert.equal(a.z,54.5);
});
test('editor stay is respected and stable across time without mission state',()=>{
 const p={mode:'stay',x:2,z:50,yaw:1.2,actions:['watch']};
 const a=R.position(p,0),b=R.position(p,999999);
 assert.deepEqual(a,b);assert.equal(a.clip,'watch');assert.equal(a.x,2);
});
test('editor path moves between waypoints, stops and loops deterministically',()=>{
 const p={mode:'path',points:[{x:0,z:0,action:'look',seconds:3},{x:0,z:13,action:'shrug',seconds:4}]};
 const at=R.position(p,15),again=R.position(p,15);
 assert.deepEqual(at,again);assert.equal(at.source,'editor');
 const walking=R.position(p,7);
 assert.equal(walking.clip,'walk');
 assert.equal(walking.inside,true);
 const loop=R.position(p,34);
 assert.equal(loop.source,'editor');
});
test('unknown animation never plays on Dax private model',()=>{
 assert.equal(R.normalizedAction('npc-kai/sit'),'idle');
 assert.equal(R.normalizedAction('npc-dax/glance-back'),'glance-back');
});
test('invalid or empty plans cannot remove Dax from the world',()=>{
 assert.equal(R.position({mode:'path',points:[]}).source,'default');
 assert.equal(R.position({mode:'stay',x:NaN,z:1}).source,'default');
});
