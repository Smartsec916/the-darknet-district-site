/* Minimal, dependency-free GLB reading and writing for the asset tools (not used by the game at runtime). */
'use strict';
const fs=require('node:fs');
const NUM={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16};
const CT={5120:[1,'getInt8'],5121:[1,'getUint8'],5122:[2,'getInt16'],5123:[2,'getUint16'],5125:[4,'getUint32'],5126:[4,'getFloat32']};

function parseGlb(file){
 const b=Buffer.isBuffer(file)?file:fs.readFileSync(file),jl=b.readUInt32LE(12),json=JSON.parse(b.toString('utf8',20,20+jl));
 return {json,bin:b.subarray(20+jl+8)};
}
/* Tightly packed copy of an accessor's bytes (so a new file does not depend on the source's byte strides) and its element array. */
function accessor(glb,i){
 const {json,bin}=glb,a=json.accessors[i],v=json.bufferViews[a.bufferView],n=NUM[a.type],[sz,fn]=CT[a.componentType],stride=v.byteStride||n*sz,off=(v.byteOffset||0)+(a.byteOffset||0);
 const dv=new DataView(bin.buffer,bin.byteOffset,bin.length),bytes=Buffer.alloc(a.count*n*sz),values=new Array(a.count*n);
 for(let k=0;k<a.count;k++)for(let c=0;c<n;c++){const src=off+k*stride+c*sz;for(let q=0;q<sz;q++)bytes[(k*n+c)*sz+q]=bin[src+q];values[k*n+c]=dv[fn](src,true);}
 return {def:a,n,bytes,values};
}
function writeGlb(json,chunks,file){
 // chunks: [{buffer, name}] concatenated into the single BIN chunk; json.bufferViews already reference offsets into the concatenation
 let bin=Buffer.concat(chunks);while(bin.length%4)bin=Buffer.concat([bin,Buffer.alloc(1)]);
 json.buffers=[{byteLength:bin.length}];
 let j=Buffer.from(JSON.stringify(json),'utf8');while(j.length%4)j=Buffer.concat([j,Buffer.from(' ')]);
 const h=Buffer.alloc(12);h.write('glTF',0,'latin1');h.writeUInt32LE(2,4);h.writeUInt32LE(12+8+j.length+8+bin.length,8);
 const c0=Buffer.alloc(8);c0.writeUInt32LE(j.length,0);c0.write('JSON',4,'latin1');const c1=Buffer.alloc(8);c1.writeUInt32LE(bin.length,0);c1.write('BIN\0',4,'latin1');
 const out=Buffer.concat([h,c0,j,c1,bin]);if(file)fs.writeFileSync(file,out);return out;
}
module.exports={parseGlb,accessor,writeGlb,NUM,CT};
