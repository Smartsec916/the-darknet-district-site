/* KEYMAP in the real game (software GL): it must NOT show during character creation or while the player is still in the Sleeping Pod, must show by itself right after the
   first successful pod exit, only once (also after a reload), and must hide/show with K without disturbing movement, the V1 or the pause menu.
   Usage: node tests/keymap-game-browser.cjs [low|high]   (SHOTS=dir for screenshots) */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const tier=process.argv[2]==='high'?'high':'low',base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',shot=process.env.SHOTS||'/tmp';
(async()=>{
 const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox']});const errors=[];
 try{
  const ctx=await browser.newContext({viewport:{width:1400,height:800},reducedMotion:'no-preference',serviceWorkers:'block'});
  const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push('console: '+m.text());});page.setDefaultTimeout(150000);
  await page.route('https://**/*',r=>r.abort());await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
  await page.addInitScript(q=>{if(!sessionStorage.getItem('km-init')){localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:q}));sessionStorage.setItem('km-init','1');}},tier);
  const vis=()=>page.evaluate(()=>!!document.getElementById('keymap')&&!document.getElementById('keymap').hidden);
  await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started);
  await page.click('[data-action=menu-campaign]');await page.click('[data-action=menu-new]');const c=page.locator('[data-action=menu-new-confirm]');if(await c.count())await c.click();
  // character creation: the KeyMap is not there
  await page.waitForSelector('#character-creator.on');assert.equal(await vis(),false,'not during character creation');await page.keyboard.press('KeyK');assert.equal(await vis(),false,'K does nothing in the character creator');
  await page.waitForFunction(()=>!document.querySelector('[data-cc=confirm]').disabled);await page.locator('[data-cc=confirm]').click();
  // in the pod: not yet
  await page.waitForFunction(()=>mode==='pod-waking'&&walker);await page.waitForTimeout(1500);assert.equal(await vis(),false,'not while still in the pod');await page.keyboard.press('KeyK');assert.equal(await vis(),false,'K does nothing inside the pod card');
  assert.equal(await page.evaluate(()=>!!state.story.flags.keymapSeen),false);
  // exit the pod: the KeyMap appears by itself, once
  await page.locator('#pod-wake [data-pod=exit]').click();await page.waitForFunction(()=>mode==='walking'&&walker&&VoidAssets.pending===0);
  await page.waitForFunction(()=>!!document.getElementById('keymap')&&!document.getElementById('keymap').hidden,null,{timeout:20000});
  assert.equal(await page.textContent('#keymap .km-hint'),'To hide the KeyMap Press K');assert.equal(await page.evaluate(()=>state.story.flags.keymapSeen),true);
  await page.waitForTimeout(800);await page.screenshot({path:shot+'/dd-keymap-first-exit-'+tier+'.png'});
  // K hides and shows; the game is still running and the mouse/keys are in a sane state
  await page.keyboard.press('KeyK');assert.equal(await vis(),false);await page.keyboard.press('KeyK');assert.equal(await vis(),true);await page.keyboard.press('KeyK');assert.equal(await vis(),false);
  await page.evaluate(()=>{const [x,z]=VoidNeoChinatown.toWorld(0,34);Object.assign(walker,{x,z,yaw:0,pitch:0,vx:0,vz:0});});await page.waitForTimeout(800);
  const p0=await page.evaluate(()=>({x:walker.x,z:walker.z}));await page.keyboard.down('KeyW');await page.waitForTimeout(2500);await page.keyboard.up('KeyW');const p1=await page.evaluate(()=>({x:walker.x,z:walker.z,mode,keys:[...walkingKeys]}));
  assert(Math.hypot(p1.x-p0.x,p1.z-p0.z)>.05,'the player can still move after the KeyMap closes');assert.equal(p1.mode,'walking');assert.deepEqual(p1.keys,[]);
  // V1 and the pause menu take over cleanly
  await page.keyboard.press('KeyK');assert.equal(await vis(),true);await page.keyboard.press('KeyL');await page.waitForSelector('#personal-device.open');await page.waitForFunction(()=>document.getElementById('keymap').hidden);
  await page.keyboard.press('KeyL');await page.waitForFunction(()=>!VoidPersonalDevice.isOpen);await page.keyboard.press('KeyK');assert.equal(await vis(),true);
  await page.keyboard.press('Escape');await page.waitForFunction(()=>mode==='menu');await page.waitForFunction(()=>document.getElementById('keymap').hidden);await page.keyboard.press('KeyK');assert.equal(await vis(),false,'no KeyMap over the pause menu');
  await page.evaluate(()=>{if(mode==='menu')resumeMenu();});await page.waitForFunction(()=>mode==='walking');
  // the saved flag survives a reload: continuing wakes the player in the pod; leaving it does NOT show the KeyMap again
  await page.evaluate(()=>save());const flag=await page.evaluate(()=>JSON.parse(localStorage.getItem('void-runner-campaign-v1')).story.flags.keymapSeen);assert.equal(flag,true,'saved with the game');
  await page.reload();await page.waitForFunction(()=>window.VoidStartup?.started);
  await page.locator('[data-action=menu-continue]').click();
  await page.waitForFunction(()=>mode==='pod-waking'||mode==='walking',null,{timeout:200000});
  if(await page.evaluate(()=>mode==='pod-waking')){assert.equal(await vis(),false);await page.locator('#pod-wake [data-pod=exit]').click();}
  await page.waitForFunction(()=>mode==='walking'&&VoidAssets.pending===0);await page.waitForTimeout(2500);assert.equal(await vis(),false,'not shown again on a later exit');
  await page.keyboard.press('KeyK');assert.equal(await vis(),true,'K still opens it on demand');
  // an older save that never saw the KeyMap: clearing the flag makes the next exit show it (existing players)
  console.log(JSON.stringify({tier,errors}));assert.deepEqual(errors,[]);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
