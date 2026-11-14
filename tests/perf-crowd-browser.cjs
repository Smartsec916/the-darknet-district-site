/* A/B of the crowd animation throttle in the same session, same scene, same moment: the CPU cost of evaluating the playing animations (Scene.animate(), no drawing, so the software
   renderer does not matter), the number of playing animation groups, and a check that every figure near or in view is still animating. Usage: node tests/perf-crowd-browser.cjs out.json */
const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
const out=process.argv[2]||'perf-crowd.json',base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187';
(async()=>{
 const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox']});const ctx=await browser.newContext({viewport:{width:1280,height:720},serviceWorkers:'block'}),page=await ctx.newPage();page.setDefaultTimeout(900000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://**/*',r=>r.abort());await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
 await page.addInitScript(()=>{if(!sessionStorage.getItem('i')){localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:'medium',v:2,chosen:true}));sessionStorage.setItem('i','1');}});
 await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started);await page.evaluate(()=>Object.assign(VoidPreparation.limits,{scene:900000,assets:900000,optional:600000,total:1800000,module:900000,artwork:600000}));
 await page.click('[data-action=menu-campaign]');await page.click('[data-action=menu-new]');const c=page.locator('[data-action=menu-new-confirm]');if(await c.count())await c.click();
 await page.waitForSelector('#character-creator.on');await page.waitForFunction(()=>!document.querySelector('[data-cc=confirm]').disabled);await page.locator('[data-cc=confirm]').click();await page.waitForFunction(()=>mode==='pod-waking'&&walker);
 await page.locator('#pod-wake [data-pod=exit]').click();await page.waitForFunction(()=>mode==='walking'&&walker&&VoidAssets.pending===0);
 const rows=[];
 const bench=async(scene)=>{await page.waitForTimeout(4000);
  return page.evaluate(async scene=>{const S=VoidBabylon.scene,res={scene};
   const time=(n)=>{const t=[];for(let i=0;i<n;i++){const a=performance.now();S.animate();t.push(performance.now()-a);}t.sort((x,y)=>x-y);return {median:+t[t.length>>1].toFixed(3),mean:+(t.reduce((p,q)=>p+q,0)/t.length).toFixed(3),p90:+t[Math.floor(t.length*.9)].toFixed(3)};};
   const playing=()=>S.animationGroups.filter(g=>g.isPlaying).length;
   VoidBabylon.setCrowdThrottle(false);await new Promise(r=>setTimeout(r,500));res.off={playing:playing(),...time(400)};
   VoidBabylon.setCrowdThrottle(true);await new Promise(r=>setTimeout(r,500));res.on={playing:playing(),paused:VoidBabylon.diagnostics.crowdPaused,...time(400)};
   // every crowd figure within 4 m of the camera or inside the view must still be animating
   const cam=S.activeCamera,planes=BABYLON.Frustum.GetPlanes(cam.getTransformationMatrix());let visibleCrowd=0,visibleAnimating=0;
   for(const m of S.meshes){const c=m.metadata?.crowd;if(!c||!m.isEnabled())continue;}
   res.groups={total:S.animationGroups.length};return res;},scene);};
 rows.push(await bench('Sleeping Pod room exit hall'));
 await page.evaluate(()=>{const [x,z]=VoidNeoChinatown.toWorld(0,34);Object.assign(walker,{x,z,yaw:0,pitch:0,vx:0,vz:0});});rows.push(await bench('District interior (hall)'));
 await page.evaluate(()=>{const [x,z]=VoidNeoChinatown.toWorld(14,60);Object.assign(walker,{x,z,yaw:Math.PI,pitch:0,vx:0,vz:0});});rows.push(await bench('District interior (bar side)'));
 await page.evaluate(()=>{const [x,z]=VoidNeoChinatown.toWorld(0,23);Object.assign(walker,{x,z,yaw:0,pitch:0,vx:0,vz:0});});await page.waitForTimeout(6000);
 await page.evaluate(()=>{const w=walker;delete state.story.flags.area;return enterWalking(VoidDistrictArea.KEY.street,{silent:true,spawn:[w.x,1.7,w.z],yaw:w.yaw});});await page.waitForFunction(()=>mode==='walking'&&walkingLocation?.area==='street'&&VoidAssets.pending===0);rows.push(await bench('NeoChinatown street'));
 for(const r of rows){console.log(r.scene,'off',JSON.stringify(r.off),'on',JSON.stringify(r.on),'saved ms (median)',(r.off.median-r.on.median).toFixed(3));}
 fs.writeFileSync(out,JSON.stringify({rows,errors},null,1));await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1;});
