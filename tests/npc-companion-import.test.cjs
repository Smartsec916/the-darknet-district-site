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
 assert.equal(x.dialogueLineCount,1);assert.equal(x.recordedLineCount,1);
 assert.deepEqual(x.missingVoiceLines,[]);
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

test('reports the unrecorded lines from the imported personality',async()=>{
 const m={...meta,dialogue:{greet:['Hello there','Welcome back'],chat:['What brings you here?']}};
 const p=studio.packTransfer(m,[{meta:{kind:'model'},blob:glb()},
  {meta:{kind:'voice',record:{text:'Hello there'}},blob:new Blob(['audio'])}]);
 const x=await importer.inspect(p);
 assert.equal(x.dialogueLineCount,3);assert.equal(x.recordedLineCount,1);
 assert.deepEqual(x.missingVoiceLines,['Welcome back','What brings you here?']);
});
test('rejects invalid personality but ignores stale recordings safely',async()=>{
 const bad={...meta,personality:{initiative:5}};
 await assert.rejects(importer.inspect(studio.packTransfer(bad,[{meta:{kind:'model'},blob:glb()}])),/Invalid behavior setting/);
 const p=studio.packTransfer(meta,[{meta:{kind:'model'},blob:glb()},
  {meta:{kind:'voice',record:{text:'Unrelated line'}},blob:new Blob(['audio'])}]);
 const x=await importer.inspect(p);
 assert.equal(x.orphanVoiceCount,1);
 assert.equal(x.voices.length,0);
 assert.deepEqual(x.missingVoiceLines,['Hello there']);
 assert.match(x.warnings[0],/old voice recording/);
});

test('repacking a character exports edited JSON and newly generated voices instead of the stale transfer',async()=>{
 const original=studio.packTransfer(meta,[{meta:{kind:'model'},blob:glb()},
  {meta:{kind:'voice',record:{text:'Hello there'}},blob:new Blob(['old-audio'])}]);
 const updated={...meta,name:'Example Two',
  dialogue:{greet:['Hello there','Welcome back']},
  voices:[
   {record:{text:'Hello there'},blob:new Blob(['old-audio'])},
   {record:{text:'Welcome back',voiceId:'ABCDEFGHIJKLMNOPQRST',model:'eleven_v4'},blob:new Blob(['new-audio'])},
   {record:{text:'Deleted old line'},blob:new Blob(['orphan-audio'])}
  ]};
 const repacked=await importer.repack(original,updated);
 const manifest=await studio.unpackTransfer(repacked);
 assert.equal(manifest.meta.name,'Example Two');
 assert.deepEqual(manifest.meta.dialogue,updated.dialogue);
 assert.equal(manifest.parts.filter(p=>p.meta.kind==='model').length,1);
 assert.deepEqual(manifest.parts.filter(p=>p.meta.kind==='voice').map(p=>p.meta.record.text),
  ['Hello there','Welcome back']);
 assert.equal(await manifest.parts.at(-1).blob.text(),'new-audio');
 const checked=await importer.inspect(repacked);
 assert.equal(checked.recordedLineCount,2);
 assert.deepEqual(checked.missingVoiceLines,[]);
});
test('repacking refuses invalid new personality and invalid export name',async()=>{
 const original=studio.packTransfer(meta,[{meta:{kind:'model'},blob:glb()}]);
 await assert.rejects(importer.repack(original,{...meta,voices:[],personality:{initiative:4}}),/Invalid behavior setting/);
 await assert.rejects(importer.repack(original,{...meta,voices:[],name:'X'.repeat(41)}),/40 characters/);
});
