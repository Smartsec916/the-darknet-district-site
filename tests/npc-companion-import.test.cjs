const test=require('node:test'),assert=require('node:assert/strict');
const studio=require('../void-runner/vr-companion-studio.js');
const importer=require('../void-runner/npc-companion-import.js');
function glb(skins=[],animations=[]){
 const json=Buffer.from(JSON.stringify({asset:{version:'2.0'},meshes:[{primitives:[{attributes:{POSITION:0}}]}],skins,animations}));
 const pad=(4-json.length%4)%4,bytes=Buffer.concat([json,Buffer.alloc(pad,32)]);
 const h=Buffer.alloc(20);h.writeUInt32LE(0x46546c67,0);h.writeUInt32LE(2,4);h.writeUInt32LE(20+bytes.length,8);h.writeUInt32LE(bytes.length,12);h.writeUInt32LE(0x4e4f534a,16);
 return new Blob([h,bytes]);
}
const meta={id:'local-example',name:'Example',sex:'female',about:'A resident',
 personality:{initiative:.3},dialogue:{greet:['Hello there']},worldBehavior:{trigger:'near'}};
test('reads the actual Companion Studio transfer and retains NPC metadata and local-only assets',async()=>{
 const p=studio.packTransfer(meta,[{meta:{kind:'model'},blob:glb([{joints:[0]}],[{name:'idle'}])},
  {meta:{kind:'motion',clip:'walk',name:'Walking'},blob:new Blob(['motion'])},
  {meta:{kind:'voice',record:{text:'Hello there',hash:'test'}},blob:new Blob(['audio'])}]);
 const x=await importer.inspect(p);
 assert.equal(x.name,'Example');assert.deepEqual(x.personality,meta.personality);
 assert.deepEqual(x.dialogue,meta.dialogue);assert.deepEqual(x.worldBehavior,meta.worldBehavior);
 assert.equal(x.skeletonCount,1);assert.deepEqual(x.animationNames,['idle']);
 assert.equal(x.motions[0].clip,'walk');assert.equal(x.voices[0].record.text,'Hello there');
 assert.equal(x.modelBytes,(await x.model.arrayBuffer()).byteLength);
 assert.equal(x.localTestOnly,true);
});
test('accepts static model but explicitly warns about missing rigging and clips',async()=>{
 const x=await importer.inspect(studio.packTransfer(meta,[{meta:{kind:'model'},blob:glb()}]));
 assert.equal(x.skeletonCount,0);assert.equal(x.warnings.length,2);
});
test('rejects missing model and unsupported transfer data',async()=>{
 await assert.rejects(importer.inspect(studio.packTransfer(meta,[])),/exactly one model/);
 await assert.rejects(importer.inspect(new Blob(['not a package'])),/transfer|Companion Studio/i);
 await assert.rejects(importer.inspect(studio.packTransfer(meta,[{meta:{kind:'model'},blob:new Blob(['not glb'])}])),/GLB/);
});
test('rejects external model resources instead of loading outside files',async()=>{
 const json=Buffer.from(JSON.stringify({asset:{version:'2.0'},meshes:[{primitives:[]}],buffers:[{uri:'https://example.org/a.bin'}]}));
 const pad=Buffer.alloc((4-json.length%4)%4,32);const h=Buffer.alloc(20);
 h.writeUInt32LE(0x46546c67,0);h.writeUInt32LE(2,4);h.writeUInt32LE(20+json.length+pad.length,8);
 h.writeUInt32LE(json.length+pad.length,12);h.writeUInt32LE(0x4e4f534a,16);
 const p=studio.packTransfer(meta,[{meta:{kind:'model'},blob:new Blob([h,json,pad])}]);
 await assert.rejects(importer.inspect(p),/external buffers or textures/);
});
