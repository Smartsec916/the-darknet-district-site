// Reads a GLB's JSON and buffer views for tests, decoding EXT_meshopt_compression views (lossless, 18 Nov 2026) with
// the decoder the game ships. await ready before calling read().
const D=require('../void-runner/vendor/meshopt_decoder-1.3.0.js');
function read(b){const jl=b.readUInt32LE(12),json=JSON.parse(b.subarray(20,20+jl).toString('utf8')),bin=b.subarray(20+jl+8),cache=new Map();
 const view=i=>{if(cache.has(i))return cache.get(i);const v=json.bufferViews[i],e=v.extensions?.EXT_meshopt_compression;let out;
  if(e){const o=new Uint8Array(e.count*e.byteStride);D.decodeGltfBuffer(o,e.count,e.byteStride,bin.subarray(e.byteOffset||0,(e.byteOffset||0)+e.byteLength),e.mode,e.filter);out=Buffer.from(o.buffer,o.byteOffset,o.byteLength);}
  else out=bin.subarray(v.byteOffset||0,(v.byteOffset||0)+v.byteLength);cache.set(i,out);return out;};
 return {json,view};}
module.exports={ready:D.ready,read};
