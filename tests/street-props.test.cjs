/* Graphics modernization, batch 1 (docs/development/GRAPHICS_AUDIT.md): the Blender-made NeoChinatown street props replace only how the back alleys' furniture,
   wall boxes and lamp housings LOOK. These checks keep the file self-contained and light, the props street-only, Low on the box-built look, and the gameplay data
   (solids, NPC obstacles, furniture) independent of the drawing. */
'use strict';
const test=require('node:test'),assert=require('node:assert'),fs=require('node:fs'),path=require('node:path');
const R=p=>path.join(__dirname,'..',p),src=f=>fs.readFileSync(R(f),'utf8');
const GLB='void-runner/assets/models/ncz-props/ncz_street_props.glb',PROPS=['dumpster_green','dumpster_blue','crate','pallet','drum_rust','drum_blue','generator','utility_box','wall_lamp'];
function gltf(file){const b=fs.readFileSync(R(file));assert.equal(b.readUInt32LE(0),0x46546c67,'a GLB');assert.equal(b.readUInt32LE(8),b.length);const n=b.readUInt32LE(12);return {doc:JSON.parse(b.subarray(20,20+n).toString()),bytes:b.length};}

test('the street props file is a self-contained, light GLB with every prop as a top-level node',()=>{
 const {doc,bytes}=gltf(GLB);
 for(const i of [...(doc.images||[]),...(doc.buffers||[])])assert.ok(!i.uri||i.uri.startsWith('data:'),'no external files (asset-pipeline.js accepts only self-contained GLBs)');
 assert.ok(!(doc.extensionsUsed||[]).some(e=>/draco|meshopt/i.test(e)),'no compressed geometry the loader cannot decode');
 const top=new Set(doc.scenes[doc.scene||0].nodes.map(i=>doc.nodes[i].name));for(const p of PROPS)assert.ok(top.has(p),p+' is a top-level node (VoidAssets.instance picks it by name)');
 assert.deepEqual(doc.materials.map(m=>m.name).sort(),['ncz_props','ncz_props_glow'],'one shared material (and the lens/LED stand-in the game replaces)');
 assert.ok(doc.images.length<=3,'one atlas: colour, normal, metal/roughness');assert.ok(bytes<6e6,'under 6 MB');
 const m=JSON.parse(src('void-runner/assets/models/ncz-props/ncz-props-manifest.json'));assert.ok(m.triangles<16000,'the whole set under 16k triangles');for(const p of PROPS)assert.ok(m.props[p].triangles<2500,p+' under 2.5k triangles');});

test('the props load only for the street, and the back alleys draw them through the existing model loader',()=>{
 const N=require(R('void-runner/neochinatown.js'));assert.ok(N.models['ncz:street_props']);assert.ok(N.modelsFor('street')['ncz:street_props']);assert.ok(!N.modelsFor('interior')['ncz:street_props'],'not loaded inside the District');
 const s=src('void-runner/ncz-backalleys.js');assert.match(s,/let propsOk=!low&&typeof instance==='function'/,'Low keeps the box-built props');assert.match(s,/instance\(PROP,parent,'crate'\)/,'a missing model keeps the box-built props');
 assert.doesNotMatch(s.slice(s.indexOf('const prop=('),s.indexOf('const propAt=')),/solids|obstacles|R\(\)/,'drawing a prop neither draws a random number nor touches collision');});

test('the furniture, solids and NPC obstacles do not depend on how they are drawn',()=>{
 const BA=require(R('void-runner/ncz-backalleys.js'));
 for(const q of ['avenue','oldtown','far-south']){const a=JSON.stringify([BA.furniture(q),BA.solids(q),BA.obstacles(q)]);BA.build({B:{},scene:{},quarter:'port'});assert.equal(JSON.stringify([BA.furniture(q),BA.solids(q),BA.obstacles(q)]),a);
  assert.ok(BA.furniture(q).some(f=>f.kind==='dumpster'));}});
