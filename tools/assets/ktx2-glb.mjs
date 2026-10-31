/* Re-encodes the textures inside a GLB as KTX2 / Basis Universal (KHR_texture_basisu), which the GPU keeps compressed
   (BC7 or ASTC where supported, transcoded on load) instead of expanding every image to 32-bit RGBA. Geometry,
   materials and animations are untouched; texture resolution is kept.
   Usage: node tools/assets/ktx2-glb.mjs <in.glb> <out.glb> [--recipe JSON]
          node tools/assets/ktx2-glb.mjs --image <in.png|jpg> <out.ktx2> <color|normal|data> [--alpha]
   How each image is encoded follows how the materials use it:
   - base colour (skin, eyes, hair, clothes, make-up; with alpha where the material cuts out): UASTC, sRGB, light
     rate-distortion optimisation, Zstandard supercompression;
   - normal maps: UASTC, linear, Basis normal-map tuning, Zstandard;
   - roughness / metal / occlusion data: ETC1S, linear (smaller download; transcodes to BC7 or ASTC like the rest).
   --recipe can override per image name, e.g. {"head_d":{"rdo":0}} to turn off RDO for one texture.
   Images are decoded in the installed Microsoft Edge (Playwright) and encoded with ktx2-encoder (MIT; Basis
   Universal, Apache-2.0). Build tool only: nothing here ships with the game. */
import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';
import {encodeToKTX2} from 'ktx2-encoder';

const pad4=n=>(n+3)&~3;
function read(buf){let o=12,json,bin;while(o<buf.length){const len=buf.readUInt32LE(o),type=buf.readUInt32LE(o+4),data=buf.subarray(o+8,o+8+len);if(type===0x4e4f534a)json=JSON.parse(data.toString('utf8'));else if(type===0x004e4942)bin=data;o+=8+len;}return {json,bin};}
function write(json,bin){const j=Buffer.from(JSON.stringify(json)),jl=pad4(j.length),bl=pad4(bin.length),h=Buffer.alloc(12),a=Buffer.alloc(8),c=Buffer.alloc(8);
 h.writeUInt32LE(0x46546c67,0);h.writeUInt32LE(2,4);h.writeUInt32LE(28+jl+bl,8);a.writeUInt32LE(jl,0);a.writeUInt32LE(0x4e4f534a,4);c.writeUInt32LE(bl,0);c.writeUInt32LE(0x004e4942,4);
 return Buffer.concat([h,a,j,Buffer.alloc(jl-j.length,0x20),c,bin,Buffer.alloc(bl-bin.length)]);}

// Encoder settings per kind of texture.
const KINDS={
 color:{isUASTC:true,isSetKTX2SRGBTransferFunc:true,isPerceptual:true,enableRDO:true,rdoQualityLevel:.75,needSupercompression:true,uastcLDRQualityLevel:2},
 normal:{isUASTC:true,isSetKTX2SRGBTransferFunc:false,isPerceptual:false,isNormalMap:true,enableRDO:true,rdoQualityLevel:.5,needSupercompression:true,uastcLDRQualityLevel:2},
 data:{isUASTC:false,isSetKTX2SRGBTransferFunc:false,isPerceptual:false,qualityLevel:230,compressionLevel:2},
};
function options(kind,over={}){const o={...KINDS[kind],generateMipmap:true,isKTX2File:true};if(over.rdo===0){o.enableRDO=false;}else if(over.rdo)o.rdoQualityLevel=over.rdo;if(over.uastc===false)Object.assign(o,KINDS.data,{isSetKTX2SRGBTransferFunc:kind==='color'});return o;}

let browser,page;
async function decode(bytes,mime){
 if(!page){browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});page=await browser.newPage();}
 const b64=await page.evaluate(async src=>{const bmp=await createImageBitmap(await (await fetch(src)).blob(),{premultiplyAlpha:'none',colorSpaceConversion:'none'});
  const c=new OffscreenCanvas(bmp.width,bmp.height),g=c.getContext('2d',{colorSpace:'srgb'});g.drawImage(bmp,0,0);const d=g.getImageData(0,0,bmp.width,bmp.height).data;
  let s='';for(let i=0;i<d.length;i+=32768)s+=String.fromCharCode(...d.subarray(i,i+32768));return [bmp.width,bmp.height,btoa(s)];},'data:'+mime+';base64,'+Buffer.from(bytes).toString('base64'));
 return {width:b64[0],height:b64[1],data:new Uint8Array(Buffer.from(b64[2],'base64'))};}
async function encode(bytes,mime,kind,over){const img=await decode(bytes,mime);return Buffer.from(await encodeToKTX2(new Uint8Array(1),{...options(kind,over),imageDecoder:async()=>img}));}

async function glb(input,output,recipe){
 const {json,bin}=read(fs.readFileSync(input));
 const role={};for(const m of json.materials||[]){const p=m.pbrMetallicRoughness||{};const mark=(t,k)=>{if(t){const s=json.textures[t.index].source;role[s]=role[s]==='color'||k==='color'?'color':role[s]||k;}};
  mark(p.baseColorTexture,'color');mark(m.emissiveTexture,'color');mark(m.normalTexture,'normal');mark(p.metallicRoughnessTexture,'data');mark(m.occlusionTexture,'data');}
 const views=json.bufferViews.map(v=>bin.subarray(v.byteOffset||0,(v.byteOffset||0)+v.byteLength));let before=0,after=0;const t0=Date.now();
 for(const [i,img] of (json.images||[]).entries()){
  if(img.bufferView===undefined||img.mimeType==='image/ktx2')continue;const kind=role[i]||'color',src=views[img.bufferView];before+=src.length;
  const k=await encode(src,img.mimeType,kind,recipe[img.name]||{});views[img.bufferView]=k;after+=k.length;img.mimeType='image/ktx2';
  console.log(' ',(img.name||i).toString().padEnd(34),kind.padEnd(6),(src.length/1e6).toFixed(2),'->',(k.length/1e6).toFixed(2),'MB');}
 // Textures point at their KTX2 image through KHR_texture_basisu (no fallback image: the decoder transcodes to RGBA
 // on GPUs without a compressed format, so one copy serves every device).
 for(const t of json.textures||[]){if(t.source!==undefined&&json.images[t.source].mimeType==='image/ktx2'){t.extensions={...(t.extensions||{}),KHR_texture_basisu:{source:t.source}};delete t.source;}}
 for(const key of ['extensionsUsed','extensionsRequired']){json[key]=[...new Set([...(json[key]||[]),'KHR_texture_basisu'])];}
 const parts=[];let length=0;json.bufferViews.forEach((v,i)=>{v.byteOffset=length;v.byteLength=views[i].length;parts.push(views[i]);const p=pad4(views[i].length);if(p>views[i].length)parts.push(Buffer.alloc(p-views[i].length));length+=p;});
 json.buffers=[{byteLength:length}];fs.mkdirSync(path.dirname(path.resolve(output)),{recursive:true});fs.writeFileSync(output,write(json,Buffer.concat(parts,length)));
 console.log(path.basename(output)+': textures '+(before/1e6).toFixed(1)+' MB -> '+(after/1e6).toFixed(1)+' MB, file '+(fs.statSync(output).size/1e6).toFixed(1)+' MB, '+((Date.now()-t0)/1000).toFixed(0)+' s');}

const args=process.argv.slice(2);
try{
 if(args[0]==='--image'){const [,inp,out,kind='color']=args;const bytes=fs.readFileSync(inp);const k=await encode(bytes,/\.jpe?g$/i.test(inp)?'image/jpeg':'image/png',kind,{});fs.writeFileSync(out,k);console.log(path.basename(out),(bytes.length/1e6).toFixed(2),'->',(k.length/1e6).toFixed(2),'MB');}
 else{const [inp,out]=args;if(!inp||!out){console.error('Usage: node tools/assets/ktx2-glb.mjs <in.glb> <out.glb> [--recipe JSON]');process.exit(1);}
  const ri=args.indexOf('--recipe');await glb(inp,out,ri>0?JSON.parse(args[ri+1]):{});}
}finally{await browser?.close();}
