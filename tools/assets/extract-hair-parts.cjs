#!/usr/bin/env node
/* Builds the hairstyle parts used by the character creator FROM FILES ALREADY IN THE REPOSITORY (MakeHuman, CC0): each hairstyle is lifted out of the character
   file it was built into and written as its own small .glb (the mesh, its texture, the 52-joint skeleton, its skin). It also writes the data the game needs to
   re-fit a hairstyle onto a different body (inverse-bind matrices of the head and neck joints, head size) and a fit report (which hairstyle suits which body).
   Nothing here needs Blender. What this tool CANNOT do is separate outfits or shoes: the body mesh in each file has its skin removed under the clothes.
     node tools/assets/extract-hair-parts.cjs [--check]       (--check recomputes and compares with the committed files and writes nothing)                           */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const {parseGlb,accessor,writeGlb}=require('./glb-lib.cjs'),Fit=require('../../void-runner/character-fit.js');
const ROOT=path.join(__dirname,'..','..'),CROWD=path.join(ROOT,'void-runner/assets/models/crowd'),OUT=path.join(ROOT,'void-runner/assets/models/parts');

// style -> the file it is lifted from (its own body is recorded as the source body)
const HAIR={short01:'vesper-mechanic',short02:'hacker-01',short03:'regular-01',short04:'district-smuggler',bob01:'meridian-bartender',bob02:'fixer-01',braid01:'district-resident',long01:'ncz-neon',ponytail01:'vesper-pilot'};
const BODIES=['district-smuggler','hacker-01','vesper-trader','regular-01','vr-companion-m','district-resident','ncz-neon','vesper-pilot','order-grower','fixer-01','vr-companion-f','meridian-bartender','vesper-mechanic'];
const base=n=>n.replace(/^[a-z_0-9]+\./,'');

function bodyInfo(file){
 const g=parseGlb(path.join(CROWD,file+'.glb')),{json}=g,skin=json.skins[0],names=skin.joints.map(i=>json.nodes[i].name),head=names.indexOf('mixamorig:Head');
 const ibmAll=accessor(g,skin.inverseBindMatrices).values;
 const mesh=json.meshes.findIndex(m=>base(m.name)==='base'),p=json.meshes[mesh].primitives[0];
 const pos=accessor(g,p.attributes.POSITION).values,J=accessor(g,p.attributes.JOINTS_0).values,W=accessor(g,p.attributes.WEIGHTS_0).values,wmax=json.accessors[p.attributes.WEIGHTS_0].componentType===5126?1:json.accessors[p.attributes.WEIGHTS_0].componentType===5121?255:65535;
 const M=ibmAll.slice(head*16,head*16+16),lo=[1e9,1e9,1e9],hi=[-1e9,-1e9,-1e9];let top=-1e9;
 for(let k=0;k<pos.length/3;k++){top=Math.max(top,pos[k*3+1]);let wh=0;for(let c=0;c<4;c++)if(J[k*4+c]===head)wh+=W[k*4+c]/wmax;if(wh<.9)continue;const q=Fit.point(M,pos[k*3],pos[k*3+1],pos[k*3+2]);for(let c=0;c<3;c++){lo[c]=Math.min(lo[c],q[c]);hi[c]=Math.max(hi[c],q[c]);}}
 return {g,names,ibmAll,headDims:[0,1,2].map(c=>+(hi[c]-lo[c]).toFixed(5)),topY:+top.toFixed(4)};
}
const r5=a=>a.map(v=>+v.toFixed(6));

function extractHair(style,file){
 const g=parseGlb(path.join(CROWD,file+'.glb')),{json}=g,mi=json.meshes.findIndex(m=>base(m.name)===style);if(mi<0)throw new Error(style+' not found in '+file);
 const prim=json.meshes[mi].primitives[0],skin=json.skins[0],mat=json.materials[prim.material],tex=json.textures[mat.pbrMetallicRoughness.baseColorTexture.index],img=json.images[tex.source],view=json.bufferViews[img.bufferView];
 const chunks=[],views=[],accs=[],add=(buf,target)=>{const off=chunks.reduce((n,c)=>n+c.length,0);chunks.push(buf);while(off+buf.length<chunks.reduce((n,c)=>n+c.length,0)){}const pad=(4-buf.length%4)%4;if(pad)chunks.push(Buffer.alloc(pad));views.push({buffer:0,byteOffset:off,byteLength:buf.length,...(target?{target}:{})});return views.length-1;};
 const attr=(name,src)=>{const a=accessor(g,src),vi=add(a.bytes,name==='indices'?34963:34962);accs.push({bufferView:vi,componentType:a.def.componentType,count:a.def.count,type:a.def.type,...(a.def.normalized?{normalized:true}:{}),...(a.def.min?{min:a.def.min,max:a.def.max}:{})});return accs.length-1;};
 const attributes={};for(const k of ['POSITION','NORMAL','TEXCOORD_0','JOINTS_0','WEIGHTS_0'])if(prim.attributes[k]!==undefined)attributes[k]=attr(k,prim.attributes[k]);
 const indices=attr('indices',prim.indices);
 const ibm=accessor(g,skin.inverseBindMatrices),ibmView=add(ibm.bytes);accs.push({bufferView:ibmView,componentType:5126,count:ibm.def.count,type:'MAT4'});const ibmAcc=accs.length-1;
 const imgBytes=g.bin.subarray(view.byteOffset||0,(view.byteOffset||0)+view.byteLength),imgView=add(Buffer.from(imgBytes));
 // nodes: the joint hierarchy (every node that is not a mesh node), then one mesh node
 const keep=json.nodes.map((n,i)=>n.mesh===undefined?i:-1).filter(i=>i>=0),remap=new Map(keep.map((o,n)=>[o,n]));
 const nodes=keep.map(o=>{const n=json.nodes[o],c={name:n.name};for(const k of ['translation','rotation','scale','matrix'])if(n[k])c[k]=n[k];if(n.children){const ch=n.children.filter(x=>remap.has(x)).map(x=>remap.get(x));if(ch.length)c.children=ch;}return c;});
 const childSet=new Set(nodes.flatMap(n=>n.children||[])),roots=nodes.map((_,i)=>i).filter(i=>!childSet.has(i));
 nodes.push({name:'hair-'+style,mesh:0,skin:0});
 const out={asset:{version:'2.0',generator:'tools/assets/extract-hair-parts.cjs',extras:{source:file+'.glb',license:'MakeHuman system asset (CC0), see docs/VOID_RUNNER_ASSET_LICENSES.md'}},scene:0,scenes:[{nodes:[...roots,nodes.length-1]}],nodes,
  skins:[{joints:skin.joints.map(j=>remap.get(j)),inverseBindMatrices:ibmAcc}],meshes:[{name:'hair-'+style,primitives:[{attributes,indices,material:0,mode:4}]}],
  materials:[{name:'hair-'+style,pbrMetallicRoughness:{baseColorTexture:{index:0},metallicFactor:0,roughnessFactor:mat.pbrMetallicRoughness.roughnessFactor??.8},alphaMode:mat.alphaMode||'OPAQUE',...(mat.alphaCutoff!==undefined?{alphaCutoff:mat.alphaCutoff}:{}),doubleSided:!!mat.doubleSided}],
  textures:[{source:0,sampler:0}],samplers:[{magFilter:9729,minFilter:9987,wrapS:10497,wrapT:10497}],images:[{bufferView:imgView,mimeType:img.mimeType||'image/png',name:'hair-'+style}],
  accessors:accs,bufferViews:views};
 const bytes=writeGlb(out,chunks);
 // which joints does this hair use, with the source body's inverse-bind matrices
 const J=accessor(g,prim.attributes.JOINTS_0).values,W=accessor(g,prim.attributes.WEIGHTS_0).values,wd=json.accessors[prim.attributes.WEIGHTS_0].componentType===5126?1:json.accessors[prim.attributes.WEIGHTS_0].componentType===5121?255:65535,used=new Set();
 for(let k=0;k<J.length;k++)if(W[k]/wd>1e-4)used.add(J[k]);
 return {bytes,used:[...used].sort((a,b)=>a-b),tris:json.accessors[prim.indices].count/3,mime:img.mimeType};
}

function build(){
 const bodies={},info={};
 for(const f of new Set([...BODIES,...Object.values(HAIR)]))info[f]=bodyInfo(f);
 const joints=info[BODIES[0]].names;for(const [f,b] of Object.entries(info))if(JSON.stringify(b.names)!==JSON.stringify(joints))throw new Error(f+' has a different skeleton');
 const parts={},files={};
 for(const [style,file] of Object.entries(HAIR)){
  const e=extractHair(style,file);parts[style]={source:file,file:'hair-'+style+'.glb',tris:e.tris,bytes:e.bytes.length,joints:e.used,headDims:info[file].headDims,ibm:Object.fromEntries(e.used.map(j=>[j,r5(info[file].ibmAll.slice(j*16,j*16+16))]))};
  files['hair-'+style+'.glb']=e.bytes;
 }
 const needed=new Set(Object.values(parts).flatMap(p=>p.joints));
 for(const f of BODIES)bodies[f]={headDims:info[f].headDims,topY:info[f].topY,ibm:Object.fromEntries([...needed].sort((a,b)=>a-b).map(j=>[j,r5(info[f].ibmAll.slice(j*16,j*16+16))]))};
 const fit={};
 for(const [style,p] of Object.entries(parts)){fit[style]={};for(const f of BODIES){const r=Fit.headFit(p.headDims,bodies[f].headDims);fit[style][f]={scale:+r.scale.toFixed(4),mismatch:+r.mismatch.toFixed(4),ok:r.mismatch<=Fit.FIT_LIMIT};}}
 const data={version:1,generatedBy:'tools/assets/extract-hair-parts.cjs',fitLimit:Fit.FIT_LIMIT,joints,parts,bodies,fit};
 return {data,files};
}
function main(){
 const check=process.argv.includes('--check'),{data,files}=build(),json=JSON.stringify(data);
 if(check){const cur=fs.readFileSync(path.join(OUT,'bind-data.json'),'utf8');for(const [n,b] of Object.entries(files))if(!fs.existsSync(path.join(OUT,n))||Buffer.compare(fs.readFileSync(path.join(OUT,n)),b))throw new Error(n+' differs from the tool output');if(cur!==json)throw new Error('bind-data.json differs from the tool output');console.log('parts match the tool output');return;}
 fs.mkdirSync(OUT,{recursive:true});for(const [n,b] of Object.entries(files))fs.writeFileSync(path.join(OUT,n),b);fs.writeFileSync(path.join(OUT,'bind-data.json'),json);
 const total=Object.values(files).reduce((n,b)=>n+b.length,0);console.log('wrote',Object.keys(files).length,'hair parts,',(total/1024).toFixed(0),'KB, and bind-data.json');
 for(const [s,r] of Object.entries(data.fit))console.log(s.padEnd(10),BODIES.map(f=>(r[f].ok?'+':'-')).join(''),' ',Object.entries(r).map(([f,x])=>f.slice(0,6)+':'+x.mismatch).join(' '));
}
module.exports={build,HAIR,BODIES};
if(require.main===module)main();
