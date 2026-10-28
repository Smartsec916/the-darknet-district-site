const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const C=require('../void-runner/vr-companions.js'),crowd=require('../void-runner/crowd.js'),assets=require('../void-runner/asset-pipeline.js'),{pack}=require('../tools/assets/pack-model.cjs');
const models=path.join(__dirname,'../void-runner/assets/models/crowd'),specs=path.join(__dirname,'../tools/animation-pipeline/characters');
const glbJson=buf=>JSON.parse(buf.subarray(20,20+buf.readUInt32LE(12)).toString('utf8'));
const asArrayBuffer=buf=>buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.length);

test('every companion has its model file, a clip list matching its spec and a preview',()=>{
 for(const e of C.companions.values()){
  assert.ok(fs.existsSync(path.join(models,C.file(e))),e.id+': '+C.file(e)+' missing');
  assert.ok(fs.existsSync(path.join(__dirname,'..',e.preview)),e.id+': preview missing');
  const spec=JSON.parse(fs.readFileSync(path.join(specs,e.model+'.json'),'utf8'));
  assert.deepEqual([...spec.clips].sort(),[...crowd.clips[e.model]].sort(),e.model+' clips differ from its spec');
  for(const c of C.requiredClips)assert.ok(crowd.clips[e.model].includes(c),e.model+' lacks '+c);
 }
});

test('scrambled models round-trip and are not readable as GLB',()=>{
 const glb=Buffer.from('glTF fake model bytes, long enough to cover a few keystream words.');
 const packed=pack(glb,12345);
 assert.notEqual(packed.readUInt32LE(8),glb.readUInt32LE(0));
 assert.deepEqual(Buffer.from(assets.unpack(asArrayBuffer(packed))),glb);
 assert.throws(()=>assets.unpack(asArrayBuffer(glb)),/VRPK/);
});

test('Nadia (FC1 model) ships scrambled, within budget, with her clips and blinks',()=>{
 const e=C.get('nadia');
 assert.equal(e.sex,'female');assert.equal(C.file(e),'vr-companion-fc1.vrpak');
 assert.ok(C.list({sex:'female',has:m=>crowd.clips[m]}).find(x=>x.id==='nadia').usable);
 const raw=fs.readFileSync(path.join(models,'vr-companion-fc1.vrpak')),buf=Buffer.from(assets.unpack(asArrayBuffer(raw)));
 assets.validate(asArrayBuffer(buf));
 const j=glbJson(buf);
 assert.deepEqual(j.animations.map(a=>a.name).sort(),[...crowd.clips['vr-companion-fc1']].sort());
 let tris=0;for(const m of j.meshes)for(const p of m.primitives)tris+=j.accessors[p.indices].count/3;
 assert.ok(tris<=56000,'triangles '+tris);
 assert.ok(raw.length<10e6,'file '+raw.length);
 const morphs=j.meshes.flatMap(m=>m.extras?.targetNames||[]);
 assert.ok(morphs.includes('Eye_Blink_L')&&morphs.includes('Eye_Blink_R'),'blink shape keys');
 for(const b of ['Hips','Spine2','Neck','Head','LeftHand','RightFoot'])assert.ok(j.nodes.some(n=>n.name==='mixamorig:'+b),'bone '+b);
});
