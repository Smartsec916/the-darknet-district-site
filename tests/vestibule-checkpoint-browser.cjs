/* The security vestibule as a player meets it, in a real browser: the scan (and the load behind it) may only start in the middle of the vestibule with BOTH doors
   shut, the two doors are never open together, the view does not jump, and the far door opens afterwards. Every frame is watched from inside the page.
   SITE_TEST_URL=http://127.0.0.1:5187 node tests/vestibule-checkpoint-browser.cjs [low|high] */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',tier=process.argv[2]==='high'?'high':'low';
(async()=>{
 const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox']}),errors=[];
 const page=await browser.newPage({viewport:{width:1280,height:720},serviceWorkers:'block'});page.setDefaultTimeout(300000);page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://**/*',r=>r.abort());await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
 await page.addInitScript(q=>localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:q})),tier);
 try{
  await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started);
  await page.click('[data-action=menu-campaign]');await page.click('[data-action=menu-new]');const c=page.locator('[data-action=menu-new-confirm]');if(await c.count())await c.click();
  await page.waitForSelector('#character-creator.on');await page.waitForFunction(()=>!document.querySelector('[data-cc=confirm]').disabled);await page.locator('[data-cc=confirm]').click();
  await page.waitForFunction(()=>mode==='pod-waking'&&walker&&VoidAssets.pending===0);await page.locator('#pod-wake [data-pod=exit]').click();await page.waitForFunction(()=>mode==='walking');
  // The watcher: every frame, note any moment the rules are broken.
  await page.evaluate(()=>{window.__v={bothOpen:0,scanWithOpenDoor:0,frames:0,states:[]};(function f(){requestAnimationFrame(f);const d=VoidBabylon.district?.doors;if(!d)return;const st=d.state(),open=st.filter(x=>x.open>.02).length,scan=!document.getElementById('district-transition').hidden;
   __v.frames++;if(open>1)__v.bothOpen++;if(scan&&open>0)__v.scanWithOpenDoor++;const p=VoidDistrict.state;if(__v.states.at(-1)!==p)__v.states.push(p);})();});
  const stand=(lx,lz,yaw)=>page.evaluate(([lx,lz,yaw])=>{const [x,z]=VoidNeoChinatown.toWorld(lx,lz);walker.x=x;walker.z=z;if(yaw!==undefined)walker.yaw=yaw;walker.pitch=0;},[lx,lz,yaw]);
  const where=()=>page.evaluate(()=>{const [lx,lz]=VoidNeoChinatown.toWorld(walker.x,walker.z);return {lx:+lx.toFixed(2),lz:+lz.toFixed(2),yaw:+walker.yaw.toFixed(3),area:walkingLocation?.area,mode,doors:VoidBabylon.district?.doors?.state()||[],sealed:VoidDistrict.sealed,scan:!document.getElementById('district-transition').hidden,state:VoidDistrict.state};});
  const doorOpen=id=>page.waitForFunction(i=>VoidBabylon.district?.doors?.state().find(x=>x.id===i)?.open>=.8,id);
  const arrived=area=>page.waitForFunction(a=>mode==='walking'&&walkingLocation?.area===a&&document.getElementById('district-transition').hidden&&VoidDistrict.state==='COMPLETE',area);
  // ---- Leaving: hall -> inner door opens by itself -> middle of the vestibule -> both shut -> scan -> street loaded -> outer door opens ----
  await stand(0,28.6,Math.PI);await doorOpen('district-inner-door');let w=await where();assert.equal(w.doors.find(x=>x.id==='district-door').open,0,'inside, the outer door stays shut');
  await stand(.4,23,2.6);await page.waitForFunction(()=>VoidDistrict.state==='ENTRY_DOOR_CLOSING'||VoidDistrict.busy);w=await where();
  assert.equal(w.scan,false,'no scan yet: the inner door is still closing');assert.equal(w.mode,'walking','the player is not frozen while the doors close');
  await page.waitForFunction(()=>!document.getElementById('district-transition').hidden);w=await where();
  assert(w.sealed&&w.sealed.length===2&&w.sealed.every(x=>x.open<=.02&&x.blocking),'when the scan appears both doors are shut and solid: '+JSON.stringify(w.sealed));
  assert.doesNotMatch(await page.locator('#district-transition').textContent(),/airlock|%/i);await page.screenshot({path:'/tmp/vestibule-scan-out.png'});
  await arrived('street');w=await where();assert.deepEqual([w.lx,w.lz,w.yaw],[.4,23,2.6],'same spot, same facing, now on the street side');
  await doorOpen('district-door');w=await where();assert.equal(w.doors.find(x=>x.id==='district-inner-door').open,0,'on the street side the inner door stays shut');await page.screenshot({path:'/tmp/vestibule-after-out.png'});
  // standing still in the middle does not send the player back
  await page.waitForTimeout(2500);assert.equal((await where()).area,'street');
  // ---- Entering: alley -> outer door -> middle -> both shut -> scan -> interior -> inner door opens ----
  await stand(0,17.4,Math.PI);await page.waitForFunction(()=>VoidDistrict.armed&&VoidDistrict.state==='IDLE');await doorOpen('district-door');
  await stand(-.6,23.2,Math.PI);await page.waitForFunction(()=>!document.getElementById('district-transition').hidden);w=await where();
  assert(w.sealed&&w.sealed.length===2&&w.sealed.every(x=>x.open<=.02&&x.blocking),'entering: both doors shut when the scan appears');await page.screenshot({path:'/tmp/vestibule-scan-in.png'});
  await arrived('interior');w=await where();assert.deepEqual([w.lx,w.lz],[-.6,23.2]);await doorOpen('district-inner-door');
  // ---- Turning back while the doors close calls it off ----
  await stand(0,29,Math.PI);await page.waitForFunction(()=>VoidDistrict.armed&&VoidDistrict.state==='IDLE');await doorOpen('district-inner-door');
  await stand(0,23,0);await page.waitForFunction(()=>VoidDistrict.busy);await stand(0,28.6,0);await page.waitForFunction(()=>!VoidDistrict.busy);w=await where();
  assert.equal(w.area,'interior');assert.equal(w.scan,false);assert.equal(w.mode,'walking');await doorOpen('district-inner-door');
  const v=await page.evaluate(()=>window.__v);assert.equal(v.bothOpen,0,'the two doors were never open together');assert.equal(v.scanWithOpenDoor,0,'the scan was never up with a door open');
  const seen=await page.evaluate(()=>VoidDistrict.history);   // every state the checkpoint went through (several pass within one frame)
  for(const need of ['ENTRY_DOOR_OPEN','ENTRY_DOOR_CLOSING','VESTIBULE_SECURED','SECURITY_SCAN','DESTINATION_LOADING','DESTINATION_READY','EXIT_DOOR_OPEN','COMPLETE'])assert(seen.includes(need),'state passed through: '+need);
  assert.deepEqual(errors,[]);console.log(JSON.stringify({ok:true,tier,frames:v.frames,bothOpen:v.bothOpen,scanWithOpenDoor:v.scanWithOpenDoor}));
 }catch(e){console.error('WHERE',JSON.stringify(await page.evaluate(()=>({state:VoidDistrict?.state,busy:VoidDistrict?.busy,armed:VoidDistrict?.armed,mode,area:walkingLocation?.area,doors:VoidBabylon.district?.doors?.state(),v:window.__v})).catch(()=>null)));throw e;}
 finally{await browser.close();}
})().catch(e=>{console.error(String(e.stack||e).slice(0,900));process.exit(1);});
