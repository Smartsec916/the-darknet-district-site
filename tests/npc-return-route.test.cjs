'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const A=require('../void-runner/npc-areas.js');
const {preflight,validateCandidate}=require('../tools/npc-return-route.cjs');
const a={x:19.5,z:2.5},b={x:47.5,z:-2.5};
test('return preflight finds a verified detour around an actual Avenue obstruction in both directions',()=>{
 assert.ok(A.leg(a,b).length);
 for(const [from,to] of [[a,b],[b,a]]){
  const p=preflight(from,to,'avenue');
  assert.equal(p.status,'ready');
  assert.ok(p.points.length>1);
  assert.ok(validateCandidate(from,to,'avenue',p.points));
  assert.deepEqual(p.points.at(-1),to);
 }
});
test('straight route and exact arrival do not introduce an invented destination',()=>{
 const from={x:23.1,z:6},to={x:23.1,z:6.2};
 assert.deepEqual(preflight(from,from,'avenue'),{status:'arrived',points:[]});
 const result=preflight(from,to,'avenue');
 assert.equal(result.status,'ready');
 assert.deepEqual(result.points,[to]);
});
test('refuses unregistered positions, invalid numbers and cross-area returns',()=>{
 for(const [from,to,area] of [[a,b,'missing'],[a,{x:Infinity,z:0},'avenue'],[a,{x:999,z:999},'avenue'],[a,b,'oldtown']]){
  const p=preflight(from,to,area);assert.equal(p.status,'hold');assert.deepEqual(p.points,[]);
 }
});
test('rejects shortcut through a real wall and any route not ending at the exact routine target',()=>{
 const from={x:23.1,z:6},to={x:40,z:9.5};
 assert.equal(validateCandidate(from,to,'avenue',[to]),false);
 assert.equal(validateCandidate(a,b,'avenue',[{x:45.75,z:1.75}]),false);
 assert.equal(validateCandidate(a,b,'avenue',null),false);
});
test('three real alley-to-yard returns either hold or expose only validated pedestrian segments',()=>{
 for(const [from,to] of [[{x:23.1,z:6},{x:40,z:9.5}],[{x:22.5,z:-35.5},{x:37,z:-32}],[{x:95,z:-36.5},{x:113.9,z:-32.5}]]){
  const p=preflight(from,to,'avenue');
  if(p.status==='ready')assert.ok(validateCandidate(from,to,'avenue',p.points));
  else{assert.equal(p.status,'hold');assert.deepEqual(p.points,[]);}
 }
});
