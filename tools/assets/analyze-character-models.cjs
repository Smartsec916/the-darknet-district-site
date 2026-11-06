#!/usr/bin/env node
/* Non-production asset analysis: reads glTF binary (.glb) files, and .glb members inside a ZIP, WITHOUT extracting anything and without any dependency,
   and reports what is really inside: triangles, vertices, separate meshes (outfit parts), materials, textures (type and size), the skeleton (joint count, naming
   convention, the joint names), animation clips, morph targets and whatever licence or generator text the file itself carries.
   It changes nothing and loads nothing into the game. Usage:
     node tools/assets/analyze-character-models.cjs [--json out.json] <file.glb | directory | archive.zip[::path-prefix]> ...
   A ZIP is only read through its table of contents; nothing in it is run or unpacked to disk. Having a ZIP file proves nothing about licence or redistribution. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');

function readZip(file){
 const buf=fs.readFileSync(file);let end=-1;
 for(let i=buf.length-22;i>=Math.max(0,buf.length-65558);i--)if(buf.readUInt32LE(i)===0x06054b50){end=i;break;}
 if(end<0)throw new Error('not a ZIP: '+file);
 const count=buf.readUInt16LE(end+10);let p=buf.readUInt32LE(end+16);const entries=[];
 for(let n=0;n<count;n++){
  if(buf.readUInt32LE(p)!==0x02014b50)break;
  const method=buf.readUInt16LE(p+10),csize=buf.readUInt32LE(p+20),usize=buf.readUInt32LE(p+24),nlen=buf.readUInt16LE(p+28),elen=buf.readUInt16LE(p+30),clen=buf.readUInt16LE(p+32),off=buf.readUInt32LE(p+42);
  const name=buf.toString('utf8',p+46,p+46+nlen);entries.push({name,method,csize,usize,off});p+=46+nlen+elen+clen;
 }
 const read=e=>{const lh=e.off,nl=buf.readUInt16LE(lh+26),el=buf.readUInt16LE(lh+28),start=lh+30+nl+el,raw=buf.subarray(start,start+e.csize);return e.method===0?raw:zlib.inflateRawSync(raw);};
 return {entries,read};
}

function imageSize(b,mime){
 try{
  if(/png/.test(mime)&&b.toString('latin1',1,4)==='PNG')return [b.readUInt32BE(16),b.readUInt32BE(20)];
  if(/jpe?g/.test(mime)){let i=2;while(i<b.length){if(b[i]!==0xff){i++;continue;}const m=b[i+1];if(m>=0xc0&&m<=0xcf&&![0xc4,0xc8,0xcc].includes(m))return [b.readUInt16BE(i+7),b.readUInt16BE(i+5)];i+=2+b.readUInt16BE(i+2);}}
  if(/webp/.test(mime)&&b.toString('latin1',0,4)==='RIFF'){const t=b.toString('latin1',12,16);
   if(t==='VP8 ')return [b.readUInt16LE(26)&0x3fff,b.readUInt16LE(28)&0x3fff];
   if(t==='VP8L'){const v=b.readUInt32LE(21);return [(v&0x3fff)+1,((v>>14)&0x3fff)+1];}
   if(t==='VP8X')return [(b.readUIntLE(24,3))+1,(b.readUIntLE(27,3))+1];}
 }catch{}
 return null;
}

function analyze(buf,name){
 if(buf.toString('latin1',0,4)!=='glTF')return {name,error:'not a glb'};
 const jl=buf.readUInt32LE(12),json=JSON.parse(buf.toString('utf8',20,20+jl));
 const binStart=20+jl+8,bin=buf.subarray(binStart,binStart+(buf.readUInt32LE(20+jl)||0));
 const acc=json.accessors||[],views=json.bufferViews||[],nodes=json.nodes||[];
 const out={name,bytes:buf.length,generator:json.asset?.generator||null,copyright:json.asset?.copyright||null,assetExtras:json.asset?.extras||null,extensionsUsed:json.extensionsUsed||[]};
 // geometry
 let tris=0,verts=0;const meshes=[];let morph=0;
 const skinnedMeshNodes=nodes.filter(n=>n.mesh!==undefined);
 for(const [mi,m] of (json.meshes||[]).entries()){
  let t=0,v=0;const attrs=new Set();let targets=0;
  for(const p of m.primitives||[]){
   const idx=p.indices!==undefined?acc[p.indices].count:(acc[p.attributes.POSITION]?.count||0);
   if((p.mode??4)===4)t+=Math.floor(idx/3);v+=acc[p.attributes.POSITION]?.count||0;Object.keys(p.attributes).forEach(a=>attrs.add(a));targets=Math.max(targets,(p.targets||[]).length);
  }
  const used=nodes.filter(n=>n.mesh===mi);
  meshes.push({name:m.name||('mesh'+mi),tris:t,verts:v,primitives:(m.primitives||[]).length,attributes:[...attrs].sort(),morphTargets:targets,morphNames:m.extras?.targetNames||null,materials:[...new Set((m.primitives||[]).map(p=>json.materials?.[p.material]?.name||('mat'+p.material)))],skinned:used.some(n=>n.skin!==undefined)});
  tris+=t*Math.max(1,used.length);verts+=v*Math.max(1,used.length);morph=Math.max(morph,targets);
 }
 out.triangles=tris;out.vertices=verts;out.meshes=meshes;out.morphTargetsMax=morph;out.drawCallsAtLeast=meshes.reduce((n,m)=>n+m.primitives,0);
 // height of the bind pose (position accessor bounds of skinned meshes; model units, normally metres)
 let lo=Infinity,hi=-Infinity;for(const m of json.meshes||[])for(const p of m.primitives||[]){const a=acc[p.attributes.POSITION];if(a?.min&&a?.max){lo=Math.min(lo,a.min[1]);hi=Math.max(hi,a.max[1]);}}
 out.bindPoseHeight=isFinite(lo)?+(hi-lo).toFixed(2):null;
 // materials, textures
 out.materials=(json.materials||[]).map(m=>({name:m.name||null,baseColorTexture:m.pbrMetallicRoughness?.baseColorTexture!==undefined,normalTexture:m.normalTexture!==undefined,mr:m.pbrMetallicRoughness?.metallicRoughnessTexture!==undefined,emissive:m.emissiveTexture!==undefined||!!m.emissiveFactor,alpha:m.alphaMode||'OPAQUE'}));
 const images=(json.images||[]).map(im=>{const v=views[im.bufferView];const b=v?bin.subarray(v.byteOffset||0,(v.byteOffset||0)+v.byteLength):null;return {name:im.name||null,mime:im.mimeType||null,bytes:v?.byteLength??null,size:b&&im.mimeType?imageSize(b,im.mimeType):null,uri:im.uri&&!/^data:/.test(im.uri)?im.uri:null};});
 out.images=images;out.imageBytes=images.reduce((n,i)=>n+(i.bytes||0),0);
 out.textureMegapixels=+images.reduce((n,i)=>n+(i.size?i.size[0]*i.size[1]:0),0).toFixed(0)/1e6;
 // skeleton
 const skins=(json.skins||[]).map(s=>({joints:s.joints.length,names:s.joints.map(j=>nodes[j].name||('node'+j))}));
 out.skins=skins.map(s=>({joints:s.joints}));const jn=skins[0]?.names||[];
 out.skeleton=jn.length?{joints:jn.length,convention:jn.some(n=>/^mixamorig:/i.test(n))?'mixamorig:':jn.some(n=>/^(Hips|Spine|UpperChest|LeftUpperArm)$/.test(n))?'VRM/Humanoid (Hips, LeftUpperArm)':jn.some(n=>/^(pelvis|spine_01|upperarm_l)$/i.test(n))?'Unreal/UAL (pelvis, upperarm_l)':'other',sample:jn.slice(0,6),names:jn,hasFingers:jn.some(n=>/finger|thumb|index|middle|ring|pinky/i.test(n)),hasFaceBones:jn.some(n=>/jaw|eye|brow|lip|tongue|cheek/i.test(n)),faceBoneCount:jn.filter(n=>/jaw|eye|brow|lip|tongue|cheek/i.test(n)).length}:null;
 // animation
 out.animations=(json.animations||[]).map(a=>{let dur=0;for(const s of a.samplers||[]){const ac=acc[s.input];if(ac?.max)dur=Math.max(dur,ac.max[0]);}return {name:a.name||null,seconds:+dur.toFixed(2),channels:(a.channels||[]).length};});
 // Where the bytes go: animation tracks, mesh data, skin matrices, images (accessor sizes; padding and views are ignored)
 const COMP={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4},NUM={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16};
 const size=i=>{const a=acc[i];return a?a.count*NUM[a.type]*COMP[a.componentType]:0;};
 const animAcc=new Set(),meshAcc=new Set();
 for(const a of json.animations||[])for(const sm of a.samplers||[]){animAcc.add(sm.input);animAcc.add(sm.output);}
 for(const m of json.meshes||[])for(const p of m.primitives||[]){Object.values(p.attributes).forEach(i=>meshAcc.add(i));if(p.indices!==undefined)meshAcc.add(p.indices);}
 out.animationBytes=[...animAcc].reduce((n,i)=>n+size(i),0);out.meshBytes=[...meshAcc].reduce((n,i)=>n+size(i),0);
 out.skinBytes=(json.skins||[]).reduce((n,s)=>n+(s.inverseBindMatrices!==undefined?size(s.inverseBindMatrices):0),0);
 return out;
}

function listFiles(p){const st=fs.statSync(p);if(st.isFile())return [p];return fs.readdirSync(p).flatMap(f=>listFiles(path.join(p,f)));}
function main(argv){
 let jsonOut=null;const targets=[];
 for(let i=0;i<argv.length;i++){if(argv[i]==='--json')jsonOut=argv[++i];else targets.push(argv[i]);}
 const results=[];
 for(const t of targets){
  const [file,prefix='']=t.split('::');
  if(/\.zip$/i.test(file)){const z=readZip(file);for(const e of z.entries)if(/\.glb$/i.test(e.name)&&e.name.startsWith(prefix)){try{results.push({source:path.basename(file)+'::'+e.name,...analyze(z.read(e),e.name)});}catch(err){results.push({source:file+'::'+e.name,error:String(err.message)});}}}
  else for(const f of listFiles(file))if(/\.glb$/i.test(f)){try{results.push({source:f,...analyze(fs.readFileSync(f),f)});}catch(err){results.push({source:f,error:String(err.message)});}}
 }
 if(jsonOut)fs.writeFileSync(jsonOut,JSON.stringify(results,null,1));
 return results;
}
module.exports={analyze,readZip,main,imageSize};
if(require.main===module){const r=main(process.argv.slice(2));for(const x of r)console.log(x.error?`${x.source}  ERROR ${x.error}`:`${x.source}  ${x.triangles} tris  ${x.meshes.length} meshes  ${x.skeleton?x.skeleton.joints+' joints ('+x.skeleton.convention+')':'no skeleton'}  ${x.animations.length} clips  ${(x.imageBytes/1024).toFixed(0)} KB images`);}
