/* NeoChinatown art-direction pass: re-shoots the three matched player-eye views identically (docs/development/NEOCHINATOWN_REMAKE.md). Not part of npm test.
     node tests/ncz-artpass-views-browser.cjs <base-url> docs/development/neochinatown-remake/cameras.json <low|medium> <out-dir> [label]
   Serve the repository root first (node tests/serve-modern.cjs). CHROMIUM_PATH names the browser where the bundled one is not found; VIEWPORT=1280x720 overrides the size in the file.
   Boots the game offline, starts a new campaign, and for each view enters that quarter of NeoChinatown, stands the player at the recorded position with the
   recorded yaw and pitch (the game's own walking camera and field of view), hides the HUD, waits, and saves <out-dir>/<name>-<tier>.png (1920x1080).
   Also writes <out-dir>/report-<tier>.json: what was built and which building models were loaded (purchased city pack or the built fallback). */
'use strict';
const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
const [base,camFile,tier='low',out='out',label='']=process.argv.slice(2);fs.mkdirSync(out,{recursive:true});
const cams=JSON.parse(fs.readFileSync(camFile,'utf8')),[VW,VH]=process.env.VIEWPORT?process.env.VIEWPORT.split('x').map(Number):(cams.viewport||[1920,1080]);
(async()=>{
 const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox']});
 const page=await b.newPage({viewport:{width:VW,height:VH},serviceWorkers:'block'});page.setDefaultTimeout(2400000);const errs=[];page.on('pageerror',e=>errs.push(e.message));page.on('console',m=>{if(/\[Port\]|\[Block\]|\[kit\]/.test(m.text()))errs.push('console: '+m.text().slice(0,500));});
 await page.route('https://**/*',r=>r.abort());await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
 await page.addInitScript(q=>localStorage.setItem('void-runner-graphics-v1',JSON.stringify({renderer:'babylon',quality:q,v:2,chosen:true})),tier);
 const T0=Date.now(),say=m=>console.log('['+Math.round((Date.now()-T0)/1000)+'s] '+m);await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started);say('started');
 await page.evaluate(()=>{Object.assign(VoidPreparation.limits,{scene:1800000,assets:1200000,optional:1200000,area:1800000,total:3600000});});
 await page.click('[data-action=menu-campaign]');await page.click('[data-action=menu-new]');const c=page.locator('[data-action=menu-new-confirm]');if(await c.count())await c.click();
 await page.waitForSelector('#character-creator.on');say('creator');await page.waitForFunction(()=>!document.querySelector('[data-cc=confirm]').disabled);await page.locator('[data-cc=confirm]').click();
 await page.waitForFunction(()=>mode==='pod-waking'&&walker);say('pod');await page.waitForTimeout(2500);await page.evaluate(()=>document.querySelector('#pod-wake [data-pod=exit]').click());await page.waitForFunction(()=>mode==='walking');say('walking in the District');
 const report={label,tier,base,views:{}};let quarter=null;
 for(const v of cams.views){
  if(v.quarter!==quarter){quarter=v.quarter;await page.evaluate(q=>{delete state.story.flags.area;return enterWalking('sacramento',{silent:true,quarter:q});},quarter);await page.waitForFunction(q=>mode==='walking'&&walkingLocation?.quarter===q,quarter);say('in '+quarter);
   await page.waitForFunction(()=>!window.VoidAssets||VoidAssets.pending===0,null,{timeout:900000}).catch(()=>{});await page.waitForTimeout(tier==='low'?9000:20000);}
  const info=await page.evaluate(async v=>{
   // hide everything on the page that is not the game's picture
   if(!document.getElementById('artpass-hide')){const st=document.createElement('style');st.id='artpass-hide';st.textContent='body *:not(canvas){visibility:hidden!important} canvas{visibility:visible!important}';document.head.appendChild(st);}
   const set=()=>{walker.x=v.position[0];walker.z=v.position[2];walker.y=v.position[1];walker.yaw=v.yaw;walker.pitch=v.pitch;walker.vx=walker.vz=0;};set();
   const sc=VoidBabylon.scene||BABYLON.EngineStore.LastCreatedScene;if(window.__hold)sc.onBeforeRenderObservable.remove(window.__hold);window.__hold=sc.onBeforeRenderObservable.add(set);
   await new Promise(r=>setTimeout(r,6000));const cam=sc.activeCamera,p=cam.globalPosition,ins=window.__ins||(window.__ins=new BABYLON.SceneInstrumentation(sc));
   const pack=Object.keys(VoidNeoChinatown.models||{}).filter(k=>/^ncz:/.test(k));
   return {camera:{position:[+p.x.toFixed(3),+p.y.toFixed(3),+p.z.toFixed(3)],fov:+cam.fov.toFixed(4),fovMode:cam.fovMode===0?'vertical':'horizontal'},draws:ins.drawCallsCounter.current,tris:Math.round(sc.getActiveIndices()/3),
    buildings:{purchasedPackFiles:pack,purchasedPackLoaded:Object.fromEntries(pack.map(k=>[k,!!VoidAssets.container?.(k)])),nightclubFrontEnabled:!!window.VoidNightclub?.enabled?.(),remadePort:!!VoidBabylon.district?.port,remadeBlock:!!VoidBabylon.district?.block}};},v);
  await page.screenshot({path:path.join(out,v.name+'-'+tier+'.png')});report.views[v.name]=info;console.log(v.name,tier,JSON.stringify(info));
  if(!v.fov&&info.camera.fov){v.fov=info.camera.fov;v.fovMode=info.camera.fovMode;}}
 report.errors=errs;fs.writeFileSync(path.join(out,'report-'+tier+'.json'),JSON.stringify(report,null,1));if(cams.views.some(v=>v.fov))fs.writeFileSync(camFile,JSON.stringify(cams,null,1));
 console.log('errors',JSON.stringify(errs.slice(0,8)));await b.close();
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
