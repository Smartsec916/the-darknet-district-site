/* Shrinks the textures inside self-contained GLB files for the browser (graphics brief §22).
   Usage: node tools/assets/optimize-textures.cjs <in.glb> <out.glb> [maxSize=1024]
   Images larger than maxSize are scaled down; textures without transparency are re-encoded as JPEG
   (normal maps at higher quality). Geometry, materials and animations are untouched.
   Uses the installed Microsoft Edge through Playwright for decoding and encoding (no extra installs). */
const fs=require('fs'),path=require('path'),{chromium}=require('playwright');
const [input,output,max='1024']=process.argv.slice(2);
if(!input||!output){console.error('Usage: node tools/assets/optimize-textures.cjs <in.glb> <out.glb> [maxSize]');process.exit(1);}
const pad4=n=>(n+3)&~3;
function read(buf){let o=12,json,bin;while(o<buf.length){const len=buf.readUInt32LE(o),type=buf.readUInt32LE(o+4),data=buf.subarray(o+8,o+8+len);if(type===0x4e4f534a)json=JSON.parse(data.toString('utf8'));else if(type===0x004e4942)bin=data;o+=8+len;}return {json,bin};}
function write(json,bin){const j=Buffer.from(JSON.stringify(json)),jl=pad4(j.length),bl=pad4(bin.length),h=Buffer.alloc(12),a=Buffer.alloc(8),c=Buffer.alloc(8);
 h.writeUInt32LE(0x46546c67,0);h.writeUInt32LE(2,4);h.writeUInt32LE(28+jl+bl,8);a.writeUInt32LE(jl,0);a.writeUInt32LE(0x4e4f534a,4);c.writeUInt32LE(bl,0);c.writeUInt32LE(0x004e4942,4);
 return Buffer.concat([h,a,j,Buffer.alloc(jl-j.length,0x20),c,bin,Buffer.alloc(bl-bin.length)]);}
(async()=>{
 const {json,bin}=read(fs.readFileSync(input));
 // Which images must keep transparency, and which are normal maps.
 const alpha=new Set(),normal=new Set(),tex=i=>json.textures?.[i]?.source;
 for(const m of json.materials||[]){
  if(m.alphaMode&&m.alphaMode!=='OPAQUE'&&m.pbrMetallicRoughness?.baseColorTexture)alpha.add(tex(m.pbrMetallicRoughness.baseColorTexture.index));
  if(m.normalTexture)normal.add(tex(m.normalTexture.index));
 }
 const browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage();
 const parts=[],views=json.bufferViews.map(v=>bin.subarray(v.byteOffset||0,(v.byteOffset||0)+v.byteLength));let before=0,after=0;
 for(const [i,img] of (json.images||[]).entries()){
  if(img.bufferView===undefined)continue;const data=views[img.bufferView];before+=data.length;
  const keepPng=alpha.has(i),quality=normal.has(i)?.92:.86;
  const b64=await page.evaluate(async ({src,max,keepPng,quality})=>{
   const bmp=await createImageBitmap(await (await fetch(src)).blob()),k=Math.min(1,max/Math.max(bmp.width,bmp.height));
   const c=new OffscreenCanvas(Math.max(1,Math.round(bmp.width*k)),Math.max(1,Math.round(bmp.height*k)));c.getContext('2d').drawImage(bmp,0,0,c.width,c.height);
   const blob=await c.convertToBlob(keepPng?{type:'image/png'}:{type:'image/jpeg',quality});
   const bytes=new Uint8Array(await blob.arrayBuffer());let s='';for(let j=0;j<bytes.length;j+=32768)s+=String.fromCharCode(...bytes.subarray(j,j+32768));return btoa(s);
  },{src:'data:'+(img.mimeType||'image/png')+';base64,'+data.toString('base64'),max:Number(max),keepPng,quality});
  const out=Buffer.from(b64,'base64');after+=out.length;views[img.bufferView]=out;img.mimeType=keepPng?'image/png':'image/jpeg';
 }
 await browser.close();
 // Rebuild the binary chunk with every buffer view in order.
 let length=0;json.bufferViews.forEach((v,i)=>{v.byteOffset=length;v.byteLength=views[i].length;parts.push(views[i]);const p=pad4(views[i].length);if(p>views[i].length)parts.push(Buffer.alloc(p-views[i].length));length+=p;});
 json.buffers=[{byteLength:length}];
 fs.mkdirSync(path.dirname(path.resolve(output)),{recursive:true});fs.writeFileSync(output,write(json,Buffer.concat(parts,length)));
 console.log(path.basename(output)+': textures '+(before/1e6).toFixed(1)+' MB -> '+(after/1e6).toFixed(2)+' MB, file '+(fs.statSync(output).size/1e6).toFixed(2)+' MB');
})().catch(e=>{console.error(e);process.exit(1);});
