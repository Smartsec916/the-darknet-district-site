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

test('world-map stay converts to District plan metres and preserves editor action',()=>{
 const d={x:126.9,z:-61.9},plan={mode:'stay',area:'district',x:125.3,z:-96.4,yaw:0,actions:['watch']};
 const s=R.positionWorld(plan,100,d);
 assert.ok(Math.abs(s.x-1.6)<1e-6);
 assert.ok(Math.abs(s.z-54.5)<1e-6);
 assert.equal(s.clip,'watch');
 assert.ok(Math.abs(s.yaw-Math.PI)<1e-6);
});
test('world-map route is converted consistently and rejects unsupported areas',()=>{
 const door={x:126.9,z:-61.9};
 const plan={mode:'path',area:'district',points:[
  {x:125.3,z:-96.4,action:'idle',seconds:2},
  {x:125.3,z:-90.4,action:'look',seconds:2}]};
 const result=R.positionWorld(plan,4,door);
 assert.equal(result.mode,'path');
 assert.ok(Number.isFinite(result.x)&&Number.isFinite(result.z));
 const refused=R.positionWorld({...plan,area:'avenue'},4,door);
 assert.equal(refused.source,'default');
});
test('missing published plan stays stationary even when the clock changes',()=>{
 assert.deepEqual(R.positionWorld(null,0),R.positionWorld(null,86400));
});

test('Dax in-game actor uses the editor plan and loads its engine before the actor',()=>{
 const fs=require('node:fs'),path=require('node:path');
 const src=fs.readFileSync(path.resolve(__dirname,'../void-runner/dax.js'),'utf8');
 const html=fs.readFileSync(path.resolve(__dirname,'../void-runner.html'),'utf8');
 const paths=require('../void-runner/npc-paths.js');
 assert.equal(paths.MOVABLE.dax.asset,'npc-dax');
 assert.equal(paths.MOVABLE.dax.quarter,'district');
 assert.match(src,/const N=root\.VoidNeoChinatown,s=editorState\(\)/);
 assert.match(src,/root\.VoidLiveContent\?\.env\?\.npcPlans\?\.dax/);
 assert.match(src,/R\.timeline\(raw,X,N\.door,transition\)/);
 assert.match(src,/return readRoutine\(now\(\)\)/);
 assert.ok(html.indexOf('void-runner/dax-editor-routine.js')<html.indexOf('void-runner/dax.js'));
});

test('Dax cycles through all assigned stay actions instead of playing only the first',()=>{
 const p={mode:'stay',x:1,z:2,actions:['look','watch','shrug']};
 assert.equal(R.position(p,0).clip,'look');
 assert.equal(R.position(p,11).clip,'watch');
 assert.equal(R.position(p,21).clip,'shrug');
 assert.equal(R.position(p,31).clip,'look');
});

test('Dax editor only offers supported District maps and rejects street placement',()=>{
 const X=require('../void-runner/npc-paths.js');
 const fs=require('node:fs'),path=require('node:path');
 const map=fs.readFileSync(path.resolve(__dirname,'../void-runner/npc-map.js'),'utf8');
 assert.match(map,/if\(o\.npc==='dax'\)o\.area='district'/);
 assert.match(map,/o\.npc!=='dax'\|\|a\.id==='district'/);
 const outside=X.spotProblems('dax',{x:100,z:-6.4});
 assert.ok(outside.length>0,'a normal Avenue position is not supported by Dax interior runtime');
 const N=require('../void-runner/neochinatown.js'),hall=N.toWorld(1.6,54.5);
 assert.deepEqual(X.spotProblems('dax',{x:hall[0],z:hall[1]}),[]);
});
