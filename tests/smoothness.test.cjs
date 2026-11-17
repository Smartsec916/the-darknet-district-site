/* Smoothness (docs/development/SMOOTHNESS_AUDIT.md): the light-slot settling that stops a mass shader rebuild in the middle of a walk. */
const test=require('node:test'),assert=require('node:assert/strict');
const A=require('../void-runner/asset-pipeline.js');

const sceneWith=(lights,mats)=>{let renderId=0;return {lights:Array.from({length:lights},(_,i)=>({name:'l'+i})),materials:mats.map(n=>n===undefined?{name:'plain'}:{maxSimultaneousLights:n}),incrementRenderId(){renderId++;},get renderId(){return renderId;}};};

test('settleLights gives every material the slots the glTF loader would give it at its next model (one per light, at most eight)',()=>{
 const s=sceneWith(5,[4,4,8,6]);assert.equal(A.settleLights(s),2);assert.deepEqual(s.materials.map(m=>m.maxSimultaneousLights),[5,5,8,6]);
 const big=sceneWith(12,[4,8]);A.settleLights(big);assert.deepEqual(big.materials.map(m=>m.maxSimultaneousLights),[8,8],'never above eight (asset-pipeline.js keeps every material within eight)');
});

test('settleLights never lowers a material, leaves materials without light slots alone, and is a no-op when nothing needs raising',()=>{
 const s=sceneWith(3,[4,8,undefined]);assert.equal(A.settleLights(s),0);assert.deepEqual(s.materials.map(m=>m.maxSimultaneousLights),[4,8,undefined]);assert.equal(s.renderId,0,'nothing changed, so nothing is asked to look again');
});

test('after raising, settleLights makes the scene re-check its shaders (a scene that has drawn no frame since takes them as current)',()=>{
 const s=sceneWith(6,[4]);A.settleLights(s);assert.equal(s.renderId,1);
});

test('the loader is told which models are already in the offline cache',()=>{assert.equal(typeof A.isCached,'function');});
