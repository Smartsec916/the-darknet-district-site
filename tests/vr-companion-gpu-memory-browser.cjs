/* GPU memory and load cost of the bedroom companions (local measurement tool; needs the locally built Ava and Eva
   models, and skips if they're absent). For Seren, Ava, Eva and Ava with Eva it records:
   - the GPU textures Babylon actually allocated for the companions (every InternalTexture in the engine, with its
     real size, mip levels and GPU format; compressed formats counted at their block size),
   - duplicates (the same image uploaded more than once),
   - on Windows, the Edge GPU process's dedicated and shared GPU memory from the OS counters
     ("GPU Process Memory"), before entering and after the companions are loaded,
   - load time, transfer size, frame time and render time; and after repeated entering and leaving, whether
     textures and GPU memory return to where they were.
   Serve the repository root on localhost and run: node tests/vr-companion-gpu-memory-browser.cjs [label] */
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',label=process.argv[2]||'run',out=path.resolve('work/gpu-memory');fs.mkdirSync(out,{recursive:true});
const models=path.join(__dirname,'../void-runner/assets/models/crowd');
if(!['vr-companion-ava.vrpak','vr-companion-pg.vrpak'].every(f=>fs.existsSync(path.join(models,f)))){console.log('SKIP: Ava and Eva are not built locally (licensed assets kept out of the repository).');process.exit(0);}
// Windows performance counters for one process: dedicated and shared GPU memory in MB (null elsewhere).
function gpuProcessMB(pid){if(process.platform!=='win32'||!pid)return null;
 try{const ps='$s=Get-Counter -Counter "\\GPU Process Memory(pid_'+pid+'_*)\\Dedicated Usage","\\GPU Process Memory(pid_'+pid+'_*)\\Shared Usage" -ErrorAction Stop;$d=0;$h=0;foreach($c in $s.CounterSamples){if($c.Path -like "*dedicated*"){$d+=$c.CookedValue}else{$h+=$c.CookedValue}};"$d $h"';
  const [d,h]=execFileSync('powershell.exe',['-NoProfile','-Command',ps],{encoding:'utf8'}).trim().split(/\s+/).map(Number);return {dedicatedMB:Math.round(d/1048576),sharedMB:Math.round(h/1048576),totalMB:Math.round((d+h)/1048576)};}catch(e){return {error:String(e.message).slice(0,120)};}}
(async()=>{const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'msedge',args:['--enable-gpu','--ignore-gpu-blocklist']});const report={label,scenarios:{},errors:[]};
 try{
 const cdp=await browser.newBrowserCDPSession();const procs=(await cdp.send('SystemInfo.getProcessInfo')).processInfo;const gpuPid=procs.find(p=>p.type==='GPU'||p.type==='gpu-process')?.id;report.gpuPid=gpuPid||null;
 const page=await browser.newPage({viewport:{width:1280,height:720},serviceWorkers:'block'});page.on('pageerror',e=>report.errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error'&&!/status of 503/.test(m.text()))report.errors.push(m.text());});
 await page.route('https://**/*',r=>r.abort());await page.route('**/api/**',r=>r.fulfill({status:503,body:'offline test'}));await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));
 let bytesIn=0;page.on('response',async r=>{if(/assets\/models\/crowd\/vr-companion|ktx2|vrtex|vendor\/ktx2/.test(r.url())){try{bytesIn+=(await r.body()).length;}catch{}}});
 await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>VoidStartup.started,null,{timeout:90000});
 await page.evaluate(async()=>{localStorage.removeItem('void-runner-companion-looks-v1');leaveMenu();state=C.fresh();state.quest='open';state.universe.freeTravel=true;state.story.flags.tutorialSkipped=true;state.location='earth';state.universe.currentSystem='sol';
  Object.assign(state.story.flags,{metAdmin:true,metIris:true,districtDoor:true,districtBadge:true});await enterWalking('sacramento');Object.assign(walker,{x:61,z:-65,yaw:0,pitch:0});});
 await page.waitForFunction(()=>VoidAssets.pending===0&&walkingLocation?.id==='neochinatown',null,{timeout:120000});
 // NO_GPU_COMPRESSION=1 hides the GPU's compressed formats, as on a device with none: KTX2 must still load (as RGBA).
 if(process.env.NO_GPU_COMPRESSION==='1'){report.noCompression=true;await page.evaluate(()=>{const c=VoidBabylon.scene.getEngine().getCaps();for(const k of ['astc','bptc','s3tc','s3tc_srgb','etc2','etc1','pvrtc','rgtc'])c[k]=null;});}
 // Every GPU texture the engine holds: real dimensions, mip chain and format.
 const textures=()=>page.evaluate(()=>{const e=VoidBabylon.scene.getEngine(),list=e.getLoadedTexturesCache(),gl=e._gl,C=BABYLON.Constants;
  // GL compressed formats (Babylon stores the GL enum in .format for compressed textures): BC1/ETC1/ETC2-RGB
  // and RGB S3TC are 4 bits per texel; BC3, BC7 (BPTC), ASTC 4x4, ETC2-RGBA8 are 8 bits.
  const half=new Set([0x83f0,0x83f1,0x8d64,0x9274,0x9275,0x9276,0x9277,0x8c4c,0x8c4d]),one=new Set([0x83f2,0x83f3,0x8e8c,0x8e8d,0x93b0,0x93d0,0x9278,0x9279,0x8c4e,0x8c4f]);
  const isCompressed=t=>half.has(t.format)||one.has(t.format);
  const bpp=t=>half.has(t.format)?.5:one.has(t.format)?1:t.type===C.TEXTURETYPE_FLOAT?16:t.type===C.TEXTURETYPE_HALF_FLOAT?8:4;
  const rows=list.map(t=>{const w=t.width,h=t.height,mips=t.generateMipMaps||t._hasMipMaps?4/3:1,b=w*h*bpp(t)*mips*(t.isCube?6:1);
   return {url:String(t.url||'').replace(/^.*\//,'').slice(0,60),w,h,format:'0x'+(t.format>>>0).toString(16),type:t.type,compressed:isCompressed(t),bytes:Math.round(b),uid:t.uniqueId};});
  return rows;});
 const sum=rows=>rows.reduce((s,r)=>s+r.bytes,0);
 // The companions' own textures: those referenced by their materials (by InternalTexture), counted once.
 const companionTextures=()=>page.evaluate(()=>{const seen=new Map();for(const x of VoidVR.session.world.companions)for(const m of x.node.getChildMeshes())for(const mat of m.material?.subMaterials||[m.material])for(const t of mat?.getActiveTextures?.()||[]){const it=t.getInternalTexture?.();if(!it)continue;const k=it.uniqueId;const prev=seen.get(k);seen.set(k,{uid:k,name:(t.name||'').slice(0,50),w:it.width,h:it.height,refs:(prev?.refs||0)+1,meshEnabled:(prev?.meshEnabled||false)||m.isEnabled()});}return [...seen.values()];});
 const frame=()=>page.evaluate(async()=>{const s=VoidBabylon.scene,inst=new BABYLON.SceneInstrumentation(s);inst.captureRenderTime=true;const t=[];await new Promise(r=>{let l=performance.now(),n=0;function f(x){t.push(x-l);l=x;if(++n===150)r();else requestAnimationFrame(f);}requestAnimationFrame(f);});t.sort((a,b)=>a-b);const rt=inst.renderTimeCounter.average;inst.dispose();return {medianFrameMs:+t[75].toFixed(2),p95FrameMs:+t[142].toFixed(2),avgRenderMs:+rt.toFixed(2)};});
 const idle=ms=>page.waitForTimeout(ms);
 await idle(3000);const before=await textures(),gpuBefore=gpuProcessMB(gpuPid);report.outside={textures:before.length,textureMB:+(sum(before)/1e6).toFixed(1),gpuProcess:gpuBefore};console.log('outside VR',JSON.stringify(report.outside));
 // SCENARIOS (JSON [[name,launchOptions],...]) measures other companions, e.g. the dev-only Una and base figures.
 const scenarios=process.env.SCENARIOS?JSON.parse(process.env.SCENARIOS):[['seren',{companion:'seren'}],['ava',{companion:'ava'}],['eva',{companion:'eva'}],['ava+eva',{companions:['ava','eva']}]];
 for(const [name,opts] of scenarios){
  bytesIn=0;const t0=Date.now();await page.evaluate(o=>VoidVR.launch('suite',o),opts);await page.waitForFunction(()=>VoidVR.session?.world&&VoidAssets.pending===0,null,{timeout:240000});const loadMs=Date.now()-t0;
  await page.evaluate(()=>{const cs=VoidVR.session.world.companions,cx=cs.reduce((s,x)=>s+x.node.position.x,0)/cs.length,cz=cs.reduce((s,x)=>s+x.node.position.z,0)/cs.length;walker.x=cx-3.6;walker.z=cz;walker.yaw=Math.PI/2;walker.pitch=.15;});
  await idle(4000);const all=await textures(),own=await companionTextures(),gpu=gpuProcessMB(gpuPid),f=await frame();
  const ownRows=all.filter(r=>own.some(o=>o.uid===r.uid));
  const dup={};for(const r of all){const k=r.url+'|'+r.w+'x'+r.h;if(r.url)dup[k]=(dup[k]||0)+1;}
  report.scenarios[name]={loadMs,transferMB:+(bytesIn/1e6).toFixed(1),companionTextures:own.length,companionTextureMB:+(sum(ownRows)/1e6).toFixed(1),hiddenOnlyTextures:own.filter(o=>!o.meshEnabled).length,
   compressed:ownRows.filter(r=>r.compressed).length,engineTextures:all.length,engineTextureMB:+(sum(all)/1e6).toFixed(1),duplicates:Object.entries(dup).filter(([,n])=>n>1).length,gpuProcess:gpu,...f};
  console.log(name,JSON.stringify(report.scenarios[name]));
  await page.evaluate(()=>VoidVR.exit());await idle(2500);}
 // Repeated entering and leaving: textures and GPU memory should come back down.
 const cycles=[];for(let i=0;i<5;i++){await page.evaluate(()=>VoidVR.launch('suite',{companions:['ava','eva']}));await page.waitForFunction(()=>VoidVR.session?.world&&VoidAssets.pending===0,null,{timeout:240000});await idle(1500);
  await page.evaluate(()=>VoidVR.exit());await idle(2500);const t=await textures();cycles.push({textures:t.length,textureMB:+(sum(t)/1e6).toFixed(1),gpuProcess:gpuProcessMB(gpuPid),heapMB:await page.evaluate(()=>Math.round((performance.memory?.usedJSHeapSize||0)/1e6))});}
 report.cycles=cycles;console.log('cycles',JSON.stringify(cycles));
 report.renderer=await page.evaluate(()=>{try{const gl=VoidBabylon.scene.getEngine()._gl,x=gl.getExtension('WEBGL_debug_renderer_info');return gl.getParameter(x.UNMASKED_RENDERER_WEBGL);}catch{return '?';}});
 report.formats=await page.evaluate(()=>{const c=VoidBabylon.scene.getEngine().getCaps();return {bc7:!!c.bptc,s3tc:!!c.s3tc,astc:!!c.astc,etc2:!!c.etc2,etc1:!!c.etc1,pvrtc:!!c.pvrtc};});
 console.log(report.renderer,JSON.stringify(report.formats),'errors',report.errors.length);
 }finally{fs.writeFileSync(path.join(out,label+'.json'),JSON.stringify(report,null,1));await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
