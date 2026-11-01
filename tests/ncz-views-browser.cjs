/* NeoChinatown from fixed viewpoints, for before/after comparisons of visual work (local tool). For each view it saves a
   screenshot and records frame time, render time, active meshes, draw calls, textures and the GPU process's memory
   (Windows "GPU Process Memory" counters), so a change can be judged on looks and cost at the same spots.
   Serve the repository root on localhost and run: node tests/ncz-views-browser.cjs <label>  -> work/ncz-views/<label>/ */
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',label=process.argv[2]||'run',out=path.resolve('work/ncz-views',label);fs.mkdirSync(out,{recursive:true});
// [name, x, z, yaw (0 = north, +z), pitch (+ looks down)]: world metres, as in neochinatown.js.
const views=[
 ['pad',22,-84,Math.PI,.05],['pad-to-passage',30,-100,.9,.02],['road-east',16,-118.5,Math.PI/2,.02],
 ['main-south',61,-118,0,.02],['main-mid',61,-90,0,.0],['main-north',61,-28,Math.PI,.02],['main-west-shops',66,-75,-Math.PI/2,-.05],
 ['alley-mouth',72,-58.5,Math.PI/2,.02],['alley-door',120,-58.5,Math.PI,.15],['avenue-west',8,-12.5,Math.PI/2,.0],['avenue-east',146,-12.5,-Math.PI/2,.0],
 ['avenue-junction',61,-14,Math.PI*.75,-.12],['corporate',-70,-12.5,-Math.PI/2,-.05],['milked',196,-12.5,Math.PI/2,-.05],['containers',61,-185,Math.PI,-.03]];
function gpuMB(pid){if(process.platform!=='win32'||!pid)return null;try{const ps='$s=Get-Counter -Counter "\\GPU Process Memory(pid_'+pid+'_*)\\Dedicated Usage","\\GPU Process Memory(pid_'+pid+'_*)\\Shared Usage" -ErrorAction Stop;$t=0;foreach($c in $s.CounterSamples){$t+=$c.CookedValue};"$t"';return Math.round(Number(execFileSync('powershell.exe',['-NoProfile','-Command',ps],{encoding:'utf8'}).trim())/1048576);}catch{return null;}}
(async()=>{const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'msedge',args:['--enable-gpu','--ignore-gpu-blocklist']});const report={label,views:{},errors:[]};
 try{const cdp=await browser.newBrowserCDPSession(),gpuPid=(await cdp.send('SystemInfo.getProcessInfo')).processInfo.find(p=>/gpu/i.test(p.type))?.id;
  const page=await browser.newPage({viewport:{width:1280,height:720},serviceWorkers:'block'});page.on('pageerror',e=>report.errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error'&&!/status of 503/.test(m.text()))report.errors.push(m.text());});
  await page.route('https://**/*',r=>r.abort());await page.route('**/api/**',r=>r.fulfill({status:503,body:'offline test'}));await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));
  await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>VoidStartup.started,null,{timeout:90000});
  const t0=Date.now();
  await page.evaluate(async()=>{leaveMenu();state=C.fresh();state.quest='open';state.universe.freeTravel=true;state.story.flags.tutorialSkipped=true;state.location='earth';state.universe.currentSystem='sol';
   Object.assign(state.story.flags,{metAdmin:true,metIris:true,districtDoor:true,districtBadge:true});await enterWalking('sacramento');});
  await page.waitForFunction(()=>VoidAssets.pending===0&&walkingLocation?.id==='neochinatown',null,{timeout:240000});report.enterMs=Date.now()-t0;
  report.quality=await page.evaluate(()=>VoidGraphics.quality);
  // Freeze the crowd and rain variation as far as the game allows: same seed per run is the game's own.
  await page.evaluate(()=>{document.querySelectorAll('#notice,.hud-prompt').forEach(e=>e.style.visibility='hidden');});
  for(const [name,x,z,yaw,pitch] of views){
   await page.evaluate(([x,z,yaw,pitch])=>{Object.assign(walker,{x,z,yaw,pitch});},[x,z,yaw,pitch]);await page.waitForTimeout(1800);
   const m=await page.evaluate(async()=>{const s=VoidBabylon.scene,e=s.getEngine(),inst=new BABYLON.SceneInstrumentation(s);inst.captureRenderTime=true;const t=[];
    await new Promise(r=>{let l=performance.now(),n=0;function f(x){t.push(x-l);l=x;if(++n===90)r();else requestAnimationFrame(f);}requestAnimationFrame(f);});t.sort((a,b)=>a-b);
    const rt=inst.renderTimeCounter.average;inst.dispose();return {medianFrameMs:+t[45].toFixed(1),p95FrameMs:+t[85].toFixed(1),renderMs:+rt.toFixed(2),activeMeshes:s.getActiveMeshes().length,drawCalls:e._drawCalls?.current??null,meshes:s.meshes.length,textures:s.textures.length};});
   await page.screenshot({path:path.join(out,name+'.png')});report.views[name]={...m,gpuMB:gpuMB(gpuPid)};console.log(name,JSON.stringify(report.views[name]));}
  report.heapMB=await page.evaluate(()=>Math.round((performance.memory?.usedJSHeapSize||0)/1e6));
  report.renderer=await page.evaluate(()=>{try{const gl=VoidBabylon.scene.getEngine()._gl,x=gl.getExtension('WEBGL_debug_renderer_info');return gl.getParameter(x.UNMASKED_RENDERER_WEBGL);}catch{return '?';}});
  console.log('enter',report.enterMs,'ms; quality',report.quality,'; errors',report.errors.length);
 }finally{fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,1));await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
