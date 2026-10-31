/* Builds a companion's look-variant textures (hair colours, eye colours, face looks) as scrambled .vrtex files the
   bedroom loads only when that look is chosen (vr-suite.js), so unused variants cost no download or GPU memory.
   Usage: node tools/assets/pack-variant-textures.cjs <jobs.json> <out-dir>
   jobs.json: [{"name":"hair-black","color":"<png/jpg>","alpha":"<png, red channel = alpha>"?,"max":2048}, ...]
   With "alpha" the result is a PNG with that alpha (alpha-tested hair); without, a JPEG. Scrambled like models
   (pack-model.cjs; asset-pipeline.js unpack()). Uses the installed Microsoft Edge through Playwright. */
const fs=require('fs'),path=require('path'),{chromium}=require('playwright'),{pack}=require('./pack-model.cjs');
const [jobsFile,outDir]=process.argv.slice(2);
if(!jobsFile||!outDir){console.error('Usage: node tools/assets/pack-variant-textures.cjs <jobs.json> <out-dir>');process.exit(1);}
const data=f=>'data:image/'+(/\.jpe?g$/i.test(f)?'jpeg':'png')+';base64,'+fs.readFileSync(f).toString('base64');
(async()=>{
 const jobs=JSON.parse(fs.readFileSync(jobsFile,'utf8'));fs.mkdirSync(outDir,{recursive:true});
 const browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage();
 for(const j of jobs){
  const b64=await page.evaluate(async({color,alpha,max})=>{
   const load=async src=>createImageBitmap(await (await fetch(src)).blob()),c=await load(color),k=Math.min(1,max/Math.max(c.width,c.height));
   const W=Math.round(c.width*k),H=Math.round(c.height*k),cv=new OffscreenCanvas(W,H),g=cv.getContext('2d');g.drawImage(c,0,0,W,H);
   if(alpha){const a=await load(alpha),ac=new OffscreenCanvas(W,H),ag=ac.getContext('2d');ag.drawImage(a,0,0,W,H);
    const px=g.getImageData(0,0,W,H),ap=ag.getImageData(0,0,W,H).data;for(let i=0;i<px.data.length;i+=4)px.data[i+3]=ap[i];g.putImageData(px,0,0);}
   const blob=await cv.convertToBlob(alpha?{type:'image/png'}:{type:'image/jpeg',quality:.88});
   const bytes=new Uint8Array(await blob.arrayBuffer());let s='';for(let i=0;i<bytes.length;i+=32768)s+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(s);
  },{color:data(j.color),alpha:j.alpha?data(j.alpha):null,max:j.max||2048});
  const raw=Buffer.from(b64,'base64'),file=path.join(outDir,j.name+'.vrtex');
  fs.writeFileSync(file,pack(raw,(raw.length*2654435761)>>>0));console.log(path.basename(file),raw.length,'bytes');
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
