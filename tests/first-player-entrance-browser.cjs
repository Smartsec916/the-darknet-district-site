/* Real keyboard traversal of the District's two security doors. Run against tests/serve-modern.cjs. */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const tier=process.argv[2]==='high'?'high':'low',base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187';
(async()=>{
 const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1100,height:700},reducedMotion:'reduce',serviceWorkers:'block'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.route('https://**/*',r=>r.abort());await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
  await page.addInitScript(q=>localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:q})),tier);
  await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started,null,{timeout:120000});
  await page.evaluate(()=>Object.assign(VoidPreparation.limits,{scene:900000,assets:300000,optional:300000,total:1500000}));
  await page.click('[data-action=menu-campaign]');await page.click('[data-action=menu-new]');
  const confirm=page.locator('[data-action=menu-new-confirm]');if(await confirm.count())await confirm.click();
  await page.waitForSelector('#character-creator.on',{timeout:180000});await page.waitForFunction(()=>!document.querySelector('[data-cc=confirm]')?.disabled,null,{timeout:180000});
  await page.locator('[data-cc=confirm]').click();await page.waitForFunction(()=>mode==='pod-waking',null,{timeout:60000});
  await page.locator('[data-pod=exit]').click();await page.waitForFunction(()=>mode==='walking'&&walkingLocation.area==='interior');
  for(let trip=0;trip<Number(process.env.TRIPS||2);trip++){
   // Leave through the inner door and allow the normal automatic exit transition to finish.
   await page.evaluate(()=>{const [x,z]=VoidNeoChinatown.toWorld(0,27.6);Object.assign(walker,{x,z,yaw:0,vx:0,vz:0});});
   await page.keyboard.down('w');await page.waitForFunction(()=>walkingLocation?.area==='street'&&mode==='walking',null,{timeout:180000});await page.keyboard.up('w');
   const outside=await page.evaluate(()=>VoidNeoChinatown.toWorld(walker.x,walker.z));assert(outside[1]<20,'outside the outer door: '+outside);
   if(trip===0){await page.evaluate(()=>{const [x,z]=VoidNeoChinatown.toWorld(0,14);Object.assign(walker,{x,z,yaw:Math.PI,pitch:0,vx:0,vz:0});});await page.screenshot({path:'/tmp/dd-security-entrance-'+tier+'.png'});}
   const noPrompt=await page.evaluate(()=>walkingLocation.interactions.every(i=>i.id!=='tdd'&&i.id!=='district-scan'));assert(noPrompt,'entrance does not require E');
   await page.evaluate(()=>{const [x,z]=VoidNeoChinatown.toWorld(0,17.4);Object.assign(walker,{x,z,yaw:Math.PI,vx:0,vz:0});});
   await page.waitForFunction(()=>VoidBabylon.district?.doors?.state()[0]?.open>.8,null,{timeout:15000});
   await page.keyboard.down('w');try{await page.waitForFunction(()=>walkingLocation?.area==='interior'&&mode==='walking',null,{timeout:60000});}
   catch(error){const detail=await page.evaluate(()=>({local:VoidNeoChinatown.toWorld(walker.x,walker.z),area:walkingLocation?.area,mode,doors:VoidBabylon.district?.doors?.state(),blocked:VoidExplorer.blocked(walker.x,walker.z,walkingLocation),keys:[...walkingKeys],busy:VoidDistrict.busy,graphicsBusy:VoidGraphics.busy,notice:document.getElementById('notice')?.textContent,flags:state.story.flags}));console.error('entrance stuck:',JSON.stringify(detail));throw error;}finally{await page.keyboard.up('w');}
   await page.waitForFunction(()=>document.getElementById('district-transition').hidden,null,{timeout:15000});
   const state=await page.evaluate(()=>({local:VoidNeoChinatown.toWorld(walker.x,walker.z),doors:VoidBabylon.district.doors.state(),flags:state.story.flags,overlay:document.getElementById('district-transition').hidden}));
   assert(state.local[1]>22,'crossed the open exterior door: '+JSON.stringify(state));assert.equal(state.flags.districtBadge,true);assert.equal(state.overlay,true);
  }
  assert.deepEqual(errors,[]);console.log(JSON.stringify({tier,roundTrips:Number(process.env.TRIPS||2),errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
