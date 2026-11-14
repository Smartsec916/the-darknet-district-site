/* Measures what each graphics preset really does in the scenes a player visits: internal render resolution, render scale, draw calls, active meshes, post-processing, frame time.
   Usage: node tests/graphics-measure-browser.cjs [out.json] [dpr=1]    (SITE_TEST_URL for the server)
   IMPORTANT: this machine (and CI) renders with a SOFTWARE renderer, so frame times here are NOT what a real GPU gives; resolution, draw calls and active meshes are exact counts.
   For real-GPU frame rates run it (or just play) on the target machine: docs/development/GRAPHICS_TEST_ROG_ALLY.md. */
const {chromium}=require('playwright'),fs=require('node:fs');
const out=process.argv[2]||'graphics-measure.json',dpr=Number(process.argv[3]||1),base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187';
(async()=>{
 const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox']});
 const ctx=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:dpr,serviceWorkers:'block'});const page=await ctx.newPage();page.setDefaultTimeout(240000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://**/*',r=>r.abort());await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
 await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started);
 const startQuality=await page.evaluate(()=>({quality:VoidGraphics.quality,chosen:VoidGraphics.chosen,stored:localStorage.getItem('void-runner-graphics-v1')}));
 await page.evaluate(()=>Object.assign(VoidPreparation.limits,{scene:240000,assets:240000,optional:120000}));
 await page.click('[data-action=menu-campaign]');await page.click('[data-action=menu-new]');const c=page.locator('[data-action=menu-new-confirm]');if(await c.count())await c.click();
 await page.waitForSelector('#character-creator.on');await page.waitForFunction(()=>!document.querySelector('[data-cc=confirm]').disabled);await page.locator('[data-cc=confirm]').click();
 await page.waitForFunction(()=>mode==='pod-waking'&&walker);await page.waitForTimeout(2500);
 const measure=async(scene,quality)=>{
  await page.evaluate(q=>{VoidGraphics.quality=q;VoidBabylon.setQuality(q);},quality);await page.waitForTimeout(3500);
  return page.evaluate(async scene=>{
   const S=VoidBabylon.scene,E=S.getEngine(),b=BABYLON,inst=new b.SceneInstrumentation(S);inst.captureFrameTime=true;inst.captureRenderTime=true;
   const t0=performance.now(),f0=S.getFrameId();await new Promise(r=>setTimeout(r,2500));const frames=S.getFrameId()-f0,secs=(performance.now()-t0)/1000;
   const gl=E._gl,dbg=gl.getExtension('WEBGL_debug_renderer_info'),pipe=S.metadata?.lookPipeline,glow=S.metadata?.lookGlow;
   const res={scene,quality:VoidGraphics.quality,cssViewport:[innerWidth,innerHeight],devicePixelRatio:devicePixelRatio,renderTarget:[E.getRenderWidth(),E.getRenderHeight()],
    computedSize:VoidBabylon.renderSize(innerWidth,innerHeight),preset:{scale:VoidBabylon.presets[VoidGraphics.quality].scale,maxDpr:VoidBabylon.presets[VoidGraphics.quality].maxDpr,maxWidth:VoidBabylon.presets[VoidGraphics.quality].maxWidth},
    drawCalls:inst.drawCallsCounter.current,activeMeshes:S.getActiveMeshes().length,totalMeshes:S.meshes.length,lights:S.lights.length,
    post:{pipeline:!!pipe,msaaSamples:pipe?pipe.samples:0,fxaa:!!pipe?.fxaaEnabled,bloom:!!pipe?.bloomEnabled,glowLayer:!!glow,glowIntensity:glow?glow.intensity:0},
    frames,fps:+(frames/secs).toFixed(2),frameMsAvg:+inst.frameTimeCounter.average.toFixed(1),renderMsAvg:+inst.renderTimeCounter.average.toFixed(1),renderer:dbg?gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL):'unknown'};
   inst.dispose();return res;},scene);
 };
 const rows=[];const all=async scene=>{for(const q of ['low','medium','high','ultra']){rows.push(await measure(scene,q));console.log(scene,q,JSON.stringify(rows.at(-1).renderTarget),rows.at(-1).drawCalls);}};
 await all('Sleeping Pod room (pod-waking)');
 await page.locator('#pod-wake [data-pod=exit]').click();await page.waitForFunction(()=>mode==='walking'&&walker&&VoidAssets.pending===0);await page.waitForTimeout(2000);
 await all('The Darknet District interior');
 await page.evaluate(()=>{delete state.story.flags.area;return enterWalking(VoidDistrictArea.KEY.street,{silent:true});});await page.waitForFunction(()=>mode==='walking'&&walkingLocation?.area==='street'&&VoidAssets.pending===0,null,{timeout:300000});await page.waitForTimeout(3000);
 await all('NeoChinatown street');
 await page.evaluate(()=>VoidVR.launch('forest',{}));await page.waitForFunction(()=>typeof VoidVR!=='undefined'&&(VoidVR.active||mode==='vr-seated'||/vr/.test(mode)),null,{timeout:300000}).catch(()=>{});await page.waitForTimeout(6000);
 await all('VR play area (forest)');
 fs.writeFileSync(out,JSON.stringify({dpr,startQuality,rows,errors},null,1));console.log('done',errors.length);await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1;});
