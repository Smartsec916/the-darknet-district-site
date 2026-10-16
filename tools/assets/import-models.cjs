/* Bulk model import for VOID//RUNNER (graphics brief §12). No dependencies; no Blender.
   Usage: node tools/assets/import-models.cjs <source folder> <output folder> [--pack <name>]
   - Finds every .gltf/.glb under the source folder (files are read as data only).
   - Converts .gltf + .bin + textures into one self-contained .glb (what asset-pipeline.js accepts).
   - Reports triangles, size in metres, materials, textures (and missing ones), animations, skins,
     duplicates and suspicious scales, into <output>/import-report.json and import-report.md.
   Importing only puts models in the library. It never assigns them to anything in the game:
   that is a separate, approved step in void-runner/assets/models/registry.json. */
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const [src,out]=process.argv.slice(2).filter(a=>!a.startsWith('--'));
const pack=(process.argv.find((a,i)=>process.argv[i-1]==='--pack'))||path.basename(src||'');
if(!src||!out){console.error('Usage: node tools/assets/import-models.cjs <source folder> <output folder> [--pack name]');process.exit(1);}
const root=path.resolve(src),dest=path.resolve(out);fs.mkdirSync(dest,{recursive:true});
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const inside=(base,p)=>{const r=path.resolve(base,p);return r.startsWith(path.resolve(base)+path.sep)||r===path.resolve(base)?r:null;};
const mime={'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp'};
const pad4=n=>(n+3)&~3;

function readGlb(buf){
 if(buf.readUInt32LE(0)!==0x46546c67)throw Error('not a GLB');
 let o=12,json=null,bin=null;
 while(o<buf.length){const len=buf.readUInt32LE(o),type=buf.readUInt32LE(o+4),data=buf.subarray(o+8,o+8+len);if(type===0x4e4f534a)json=JSON.parse(data.toString('utf8'));else if(type===0x004e4942)bin=data;o+=8+len;}
 return {json,bin};
}
// Packs a .gltf with external buffers and images into one binary chunk.
function pack_gltf(file){
 const dir=path.dirname(file),gltf=JSON.parse(fs.readFileSync(file,'utf8')),missing=[],chunks=[];let length=0;
 const add=data=>{const at=length;chunks.push(data);const padded=pad4(data.length);if(padded>data.length)chunks.push(Buffer.alloc(padded-data.length));length+=padded;return at;};
 const offsets=(gltf.buffers||[]).map(b=>{
  if(!b.uri)throw Error('buffer without uri');
  const data=b.uri.startsWith('data:')?Buffer.from(b.uri.split(',')[1],'base64'):(()=>{const p=inside(dir,decodeURIComponent(b.uri));if(!p||!fs.existsSync(p))throw Error('missing buffer '+b.uri);return fs.readFileSync(p);})();
  return add(data);
 });
 for(const v of gltf.bufferViews||[]){v.byteOffset=(v.byteOffset||0)+offsets[v.buffer];v.buffer=0;}
 for(const img of gltf.images||[]){
  if(img.bufferView!==undefined||!img.uri)continue;
  let data=null;
  if(img.uri.startsWith('data:'))data=Buffer.from(img.uri.split(',')[1],'base64');
  else{
   // Packs often keep shared textures in one folder; fall back to a unique file of the same name anywhere in the pack.
   let p=inside(dir,decodeURIComponent(img.uri));if(!p||!fs.existsSync(p))p=byName.get(path.basename(decodeURIComponent(img.uri)).toLowerCase())||null;
   if(p)data=fs.readFileSync(p);else{missing.push(img.uri);continue;}
  }
  const view=(gltf.bufferViews??=[]).push({buffer:0,byteOffset:add(data),byteLength:data.length})-1;
  img.mimeType=img.mimeType||mime[path.extname(img.uri).toLowerCase()]||'image/png';delete img.uri;img.bufferView=view;
 }
 gltf.buffers=[{byteLength:length}];
 return {json:gltf,bin:Buffer.concat(chunks,length),missing};
}
function writeGlb(json,bin){
 const j=Buffer.from(JSON.stringify(json),'utf8'),jl=pad4(j.length),bl=pad4(bin.length);
 const head=Buffer.alloc(12),jh=Buffer.alloc(8),bh=Buffer.alloc(8);
 head.writeUInt32LE(0x46546c67,0);head.writeUInt32LE(2,4);head.writeUInt32LE(12+8+jl+8+bl,8);
 jh.writeUInt32LE(jl,0);jh.writeUInt32LE(0x4e4f534a,4);bh.writeUInt32LE(bl,0);bh.writeUInt32LE(0x004e4942,4);
 return Buffer.concat([head,jh,j,Buffer.alloc(jl-j.length,0x20),bh,bin,Buffer.alloc(bl-bin.length)]);
}
// ---- Measurements ----
const mul=(a,b)=>{const r=new Array(16).fill(0);for(let i=0;i<4;i++)for(let j=0;j<4;j++)for(let k=0;k<4;k++)r[j*4+i]+=a[k*4+i]*b[j*4+k];return r;};
function local(n){
 if(n.matrix)return n.matrix;const [x,y,z,w]=n.rotation||[0,0,0,1],[sx,sy,sz]=n.scale||[1,1,1],[tx,ty,tz]=n.translation||[0,0,0];
 return [(1-2*(y*y+z*z))*sx,2*(x*y+z*w)*sx,2*(x*z-y*w)*sx,0,2*(x*y-z*w)*sy,(1-2*(x*x+z*z))*sy,2*(y*z+x*w)*sy,0,2*(x*z+y*w)*sz,2*(y*z-x*w)*sz,(1-2*(x*x+y*y))*sz,0,tx,ty,tz,1];
}
function measure(json){
 let triangles=0;const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
 const visit=(i,m)=>{const n=json.nodes[i],w=mul(m,local(n));
  if(n.mesh!==undefined)for(const p of json.meshes[n.mesh].primitives){
   const count=p.indices!==undefined?json.accessors[p.indices].count:json.accessors[p.attributes.POSITION].count;if((p.mode??4)===4)triangles+=count/3;
   const a=json.accessors[p.attributes.POSITION];if(!a?.min)continue;
   for(const c of [0,1,2,3,4,5,6,7]){const v=[c&1?a.max[0]:a.min[0],c&2?a.max[1]:a.min[1],c&4?a.max[2]:a.min[2]];
    for(let k=0;k<3;k++){const t=w[k]*v[0]+w[4+k]*v[1]+w[8+k]*v[2]+w[12+k];lo[k]=Math.min(lo[k],t);hi[k]=Math.max(hi[k],t);}}
  }
  for(const c of n.children||[])visit(c,w);};
 const scene=json.scenes?.[json.scene||0];const id=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
 for(const r of scene?.nodes||[])visit(r,id);
 const size=hi.map((h,k)=>Number.isFinite(h)?+(h-lo[k]).toFixed(3):0);
 return {triangles:Math.round(triangles),size,materials:(json.materials||[]).length,textures:(json.images||[]).length,animations:(json.animations||[]).map(a=>a.name||'unnamed'),skinned:(json.skins||[]).length>0};
}
const all=walk(root),files=all.filter(f=>/\.(gltf|glb)$/i.test(f));
// Image files by name (only names that occur once, so a texture is never guessed between two candidates).
const byName=new Map(),dupes=new Set();for(const f of all.filter(f=>mime[path.extname(f).toLowerCase()])){const k=path.basename(f).toLowerCase();if(byName.has(k))dupes.add(k);byName.set(k,f);}for(const k of dupes)byName.delete(k);
const report={pack,source:root,date:new Date().toISOString().slice(0,10),models:[]},seen=new Map();
for(const file of files){
 const rel=path.relative(root,file),id=(pack+'/'+rel.replace(/\.(gltf|glb)$/i,'')).toLowerCase().replace(/[^a-z0-9/]+/g,'-').replace(/-+/g,'-').replace(/(^-|-$)/g,'');
 const entry={id,source:rel,status:'imported',notes:[]};
 try{
  const {json,bin,missing}=/\.glb$/i.test(file)?{...readGlb(fs.readFileSync(file)),missing:[]}:pack_gltf(file);
  if((json.extensionsUsed||[]).some(e=>['KHR_draco_mesh_compression','EXT_meshopt_compression','KHR_texture_basisu'].includes(e)))entry.notes.push('compressed: needs a decoder the game does not ship');
  const glb=writeGlb(json,bin),hash=crypto.createHash('sha256').update(glb).digest('hex').slice(0,16);
  Object.assign(entry,measure(json),{bytes:glb.length,hash,missingTextures:missing});
  if(missing.length)entry.notes.push('missing textures: '+missing.join(', '));
  const big=Math.max(...entry.size);if(big>500)entry.notes.push('suspicious scale: larger than 500 units');if(big>0&&big<.05)entry.notes.push('suspicious scale: smaller than 5 cm');
  if(seen.has(hash)){entry.status='duplicate';entry.duplicateOf=seen.get(hash);}
  else{seen.set(hash,id);const outFile=path.join(dest,id+'.glb');fs.mkdirSync(path.dirname(outFile),{recursive:true});fs.writeFileSync(outFile,glb);entry.glb=path.relative(dest,outFile).split(path.sep).join('/');}
 }catch(error){entry.status='failed';entry.notes.push(error.message);}
 report.models.push(entry);
}
fs.writeFileSync(path.join(dest,'import-report.json'),JSON.stringify(report,null,1));
const ok=report.models.filter(m=>m.status==='imported');
fs.writeFileSync(path.join(dest,'import-report.md'),`# Import report: ${pack}\n\n${report.date} · ${files.length} files · ${ok.length} imported · ${report.models.filter(m=>m.status==='duplicate').length} duplicates · ${report.models.filter(m=>m.status==='failed').length} failed\n\n| id | triangles | size (x×y×z) | textures | animations | notes |\n|---|---|---|---|---|---|\n`+report.models.map(m=>`| ${m.id} | ${m.triangles??''} | ${(m.size||[]).join(' × ')} | ${m.textures??''} | ${(m.animations||[]).join(', ')} | ${[m.status!=='imported'?m.status:'',...m.notes].filter(Boolean).join('; ')} |`).join('\n')+'\n');
console.log(`${pack}: ${files.length} files, ${ok.length} imported, ${report.models.filter(m=>m.status==='duplicate').length} duplicates, ${report.models.filter(m=>m.status==='failed').length} failed -> ${dest}`);
