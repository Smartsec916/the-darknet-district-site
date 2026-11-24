const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{fileURLToPath}=require('node:url');
test('retarget missing mandatory tracks and preserve bound geometry across real imports',async()=>{
 const w=await import('../void-runner/rig-workshop.mjs'),m=await import('../void-runner/rig-motion.mjs');
 const filenames=['void-runner/assets/models/crowd/vr-companion-f.glb','void-runner/assets/models/crowd/npc-grey-reverie.glb'];
 if(process.env.RIG_REGRESSION_FILES)filenames.push(...JSON.parse(process.env.RIG_REGRESSION_FILES));
 const native=global.fetch;global.fetch=async url=>new Response(fs.readFileSync(fileURLToPath(url)));
 try{for(const filename of filenames){
  const doc=await w.open(new Blob([fs.readFileSync(filename)])),rig=m.inspect(doc);assert.ok(rig.ready,JSON.stringify(rig));
  for(const key of ['LeftForeArm','LeftLowerLeg'])doc.json.nodes[rig.mapping[key]].name='custom-'+key.length+'-'+key.slice(-3);
  assert.ok(m.inspect(doc).ready,'infer unnamed intermediate joint');
  doc.json.animations=doc.json.animations.filter(a=>a.name==='walk').slice(0,1);
  if(doc.json.animations.length)doc.json.animations[0].name='Walking';
  const original=JSON.stringify(doc.json.animations),file=new Blob([m.GLB.write(doc.json,doc.binary)]);
  const fixed=await w.repair(file),again=await w.check(fixed.blob);
  assert.deepEqual(again.missing,[],JSON.stringify(fixed.review));assert.ok(again.clips.includes('run'));
  assert.deepEqual(again.doc.json.skins,doc.json.skins);assert.deepEqual(again.doc.json.meshes,doc.json.meshes);
  assert.deepEqual(again.doc.binary.subarray(0,doc.binary.length),doc.binary);
  assert.equal(original,JSON.stringify(again.doc.json.animations.slice(0,doc.json.animations.length)));
  assert.equal((await w.repair(fixed.blob)).blob,fixed.blob,'idempotent');
  const staticDoc=structuredClone(doc.json);delete staticDoc.skins;for(const n of staticDoc.nodes)delete n.skin;
  assert.equal(m.inspect({json:staticDoc,binary:doc.binary}).state,'unrigged');
 }}finally{global.fetch=native;}
});
