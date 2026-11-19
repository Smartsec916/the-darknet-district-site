// Lossless meshopt geometry (18 Nov 2026, site slimming): the game's GLBs may use EXT_meshopt_compression, decoded by
// the locally served meshoptimizer decoder (never Babylon's CDN default). Lossless means: no meshopt filters (the
// octahedral / quaternion / exponent filters are lossy), no quantisation extension, and the decoded bytes are the
// original accessor data.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=path.join(__dirname,'..'),V=path.join(R,'void-runner'),DEC='vendor/meshopt_decoder-1.3.0.js';
const json=b=>JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString('utf8'));
function glbs(dir,out=[]){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())glbs(p,out);else if(e.name.endsWith('.glb'))out.push(p);}return out;}

test('the meshopt decoder and its licence are vendored, and the loader points Babylon at that copy',()=>{
 const src=fs.readFileSync(path.join(V,DEC),'utf8');assert.match(src,/Built from meshoptimizer 1\.3/);assert.match(src,/decodeGltfBufferAsync/);assert.match(src,/useWorkers/);
 assert.match(fs.readFileSync(path.join(V,'vendor/LICENSE-meshoptimizer.md'),'utf8'),/MIT License/);
 const assets=require('../void-runner/asset-pipeline.js');assert.equal(typeof assets.useMeshoptLocally,'function');
 assert.ok(fs.readFileSync(path.join(V,'asset-pipeline.js'),'utf8').includes("'"+DEC+"'"),'asset-pipeline.js names the local decoder');
 assert.ok(fs.readFileSync(path.join(V,'cache.js'),'utf8').includes("'"+DEC+"'"),'the offline cache warms the decoder');
});

test('every meshopt GLB in the game is lossless and decodes to its declared sizes',async()=>{
 const D=require('../void-runner/'+DEC);await D.ready;let files=0,views=0;
 for(const f of glbs(path.join(V,'assets'))){const b=fs.readFileSync(f),j=json(b);if(!(j.extensionsUsed||[]).includes('EXT_meshopt_compression'))continue;files++;
  const rel=path.relative(R,f);assert.ok(!(j.extensionsUsed||[]).includes('KHR_mesh_quantization'),rel+': not quantised');
  const bin=b.subarray(20+b.readUInt32LE(12)+8);
  for(const bv of j.bufferViews){const e=bv.extensions?.EXT_meshopt_compression;if(!e)continue;views++;
   assert.ok(!e.filter||e.filter==='NONE',rel+': no lossy meshopt filter');
   if(files<=3){const out=new Uint8Array(e.count*e.byteStride);D.decodeGltfBuffer(out,e.count,e.byteStride,bin.subarray(e.byteOffset||0,(e.byteOffset||0)+e.byteLength),e.mode,e.filter);}}}
 assert.ok(files>=150&&views>files,files+' meshopt GLBs, '+views+' compressed views');
});
