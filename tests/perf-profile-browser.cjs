/* Performance profile of the real game at the SAME graphics preset in each scene: resolution, draw calls, active meshes, mesh / material / texture / geometry counts, loading time,
   JS long tasks, frame time, and a JavaScript CPU profile (top self-time functions). Usage: node tests/perf-profile-browser.cjs out.json [low|medium|high]  (default medium)
   SOFTWARE-RENDERER CAVEAT: this machine has no GPU, so frame times and frame rates are dominated by software rasterising and are NOT what a player's GPU gives. Counts (draw calls, meshes,
   materials, textures, vertices) and JavaScript CPU time are real measurements of what the game asks for. */
const {chromium}=require('playwright'),fs=require('node:fs');
const out=process.argv[2]||'perf.json',quality=process.argv[3]||'medium',base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187';
(async()=>{
 const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox']});
 const ctx=await browser.newContext({viewport:{width:1280,height:720},serviceWorkers:'block'}),page=await ctx.newPage();page.setDefaultTimeout(600000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://**/*',r=>r.abort());await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
 await page.addInitScript(q=>{if(!sessionStorage.getItem('i')){localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:q,v:2,chosen:true}));sessionStorage.setItem('i','1');}},quality);
 await page.addInitScript(()=>{window.__long=[];try{new PerformanceObserver(l=>{for(const e of l.getEntries())window.__long.push(Math.round(e.duration));}).observe({entryTypes:['longtask']});}catch{}});
 const cdp=await ctx.newCDPSession(page);await cdp.send('Profiler.enable');
 const t0=Date.now();await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started);const startupMs=Date.now()-t0;
 await page.evaluate(()=>Object.assign(VoidPreparation.limits,{scene:900000,assets:900000,optional:600000,total:1800000,module:900000,artwork:600000}));
 await page.click('[data-action=menu-campaign]');await page.click('[data-action=menu-new]');const c=page.locator('[data-action=menu-new-confirm]');if(await c.count())await c.click();
 await page.waitForSelector('#character-creator.on');await page.waitForFunction(()=>!document.querySelector('[data-cc=confirm]').disabled);await page.locator('[data-cc=confirm]').click();
 await page.waitForFunction(()=>mode==='pod-waking'&&walker);
 const rows=[];
 async function measure(scene,seconds=8){
  await page.waitForTimeout(3000);await page.evaluate(()=>{window.__long.length=0;});
  await cdp.send('Profiler.start');
  const r=await page.evaluate(async seconds=>{const S=VoidBabylon.scene,E=S.getEngine(),b=BABYLON,inst=new b.SceneInstrumentation(S);for(const k of ['captureFrameTime','captureRenderTime','captureActiveMeshesEvaluationTime','captureRenderTargetsRenderTime','captureAnimationsTime','captureParticlesRenderTime','captureCameraRenderTime','captureInterFrameTime'])inst[k]=true;
   const f0=S.getFrameId(),t0=performance.now();await new Promise(r=>setTimeout(r,seconds*1000));const frames=S.getFrameId()-f0,secs=(performance.now()-t0)/1000;
   const mats=new Set(S.meshes.map(m=>m.material).filter(Boolean)),verts=S.meshes.reduce((t,m)=>t+(m.getTotalVertices?.()||0),0),inst_=S.meshes.filter(m=>m.isAnInstance).length,thin=S.meshes.filter(m=>m.thinInstanceCount>0).length;
   const mem=performance.memory?{usedMB:Math.round(performance.memory.usedJSHeapSize/1048576)}:null;
   const res={quality:VoidGraphics.quality,render:[E.getRenderWidth(),E.getRenderHeight()],drawCalls:inst.drawCallsCounter.current,activeMeshes:S.getActiveMeshes().length,meshes:S.meshes.length,instances:inst_,thinInstanceMeshes:thin,materials:S.materials.length,materialsInUse:mats.size,textures:S.textures.length,geometries:S.geometries.length,vertices:verts,skeletons:S.skeletons.length,animationGroups:S.animationGroups.length,playingGroups:S.animationGroups.filter(g=>g.isPlaying).length,lights:S.lights.length,particleSystems:S.particleSystems.length,
    frames,fps:+(frames/secs).toFixed(2),ms:{frame:+inst.frameTimeCounter.average.toFixed(1),render:+inst.renderTimeCounter.average.toFixed(1),activeMeshesEval:+inst.activeMeshesEvaluationTimeCounter.average.toFixed(2),renderTargets:+inst.renderTargetsRenderTimeCounter.average.toFixed(2),animations:+inst.animationsTimeCounter.average.toFixed(2),particles:+inst.particlesRenderTimeCounter.average.toFixed(2),camera:+inst.cameraRenderTimeCounter.average.toFixed(2)},memory:mem,heapObjects:null};inst.dispose();return res;},seconds);
  const {profile}=await cdp.send('Profiler.stop');const self=new Map(),dt=profile.timeDeltas||[],idIdx=new Map(profile.nodes.map(n=>[n.id,n]));
  profile.samples.forEach((id,i)=>{const n=idIdx.get(id),key=(n.callFrame.functionName||'(anonymous)')+' '+(n.callFrame.url||'').split('/').pop()+':'+n.callFrame.lineNumber;self.set(key,(self.get(key)||0)+(dt[i]||0));});
  const total=[...self.values()].reduce((a,b)=>a+b,0)||1;r.cpuProfile=[...self.entries()].sort((a,b)=>b[1]-a[1]).slice(0,14).map(([k,v])=>({fn:k,pct:+(v/total*100).toFixed(1)}));
  r.longTasks=await page.evaluate(()=>({count:window.__long.length,over100:window.__long.filter(x=>x>100).length,max:Math.max(0,...window.__long)}));r.scene=scene;rows.push(r);console.log(scene,JSON.stringify({draw:r.drawCalls,active:r.activeMeshes,meshes:r.meshes,mats:r.materials,fps:r.fps,top:r.cpuProfile.slice(0,3)}));
 }
 await measure('Sleeping Pod room (pod-waking)');
 const tExit=Date.now();await page.locator('#pod-wake [data-pod=exit]').click();await page.waitForFunction(()=>mode==='walking'&&walker&&VoidAssets.pending===0);const exitMs=Date.now()-tExit;
 await page.evaluate(()=>{const [x,z]=VoidNeoChinatown.toWorld(0,34);Object.assign(walker,{x,z,yaw:0,pitch:0,vx:0,vz:0});});
 await measure('The Darknet District interior (hall)');
 await page.evaluate(()=>{const [x,z]=VoidNeoChinatown.toWorld(14,60);Object.assign(walker,{x,z,yaw:Math.PI,pitch:0,vx:0,vz:0});});await measure('The Darknet District interior (bar side)');
 const tS=Date.now();await page.evaluate(()=>{delete state.story.flags.area;return enterWalking(VoidDistrictArea.KEY.street,{silent:true});});await page.waitForFunction(()=>mode==='walking'&&walkingLocation?.area==='street'&&VoidAssets.pending===0);const streetMs=Date.now()-tS;await measure('NeoChinatown street');
 await page.evaluate(()=>{C.awardStarterShip(state);C.chooseDestination(state,'meridian');});
 const tF=Date.now();await page.evaluate(()=>{leaveWalking();});await page.waitForFunction(()=>mode==='play');const launchMs=Date.now()-tF;await measure('Ship flight (departure)');
 const tM=Date.now();await page.evaluate(async()=>{VoidFlightSession?.end?.();mode='menu';state.location='meridian';walkingLocation=walker=null;await dock();});await page.waitForFunction(()=>(mode==='walking'||mode==='dock')&&walkingLocation&&VoidAssets.pending===0,null,{timeout:900000}).catch(()=>{});const meridianMs=Date.now()-tM;await page.waitForTimeout(2000);await measure('Meridian Station');
 const tV=Date.now();await page.evaluate(()=>VoidVR.launch('forest',{}));await page.waitForTimeout(8000);const vrMs=Date.now()-tV;await measure('VR play area (forest)');
 fs.writeFileSync(out,JSON.stringify({quality,startupMs,transitionsMs:{podExit:exitMs,street:streetMs,launch:launchMs,meridian:meridianMs,vr:vrMs},rows,errors,renderer:'software (SwiftShader)'},null,1));console.log('done',errors.length);await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1;});
