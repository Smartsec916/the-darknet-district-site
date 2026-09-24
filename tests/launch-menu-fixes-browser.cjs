const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  for(const renderer of ['legacy','babylon']) {
   const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/firebase-auth.js',r=>r.abort());
   await page.route('**/api/void-runner/**',r=>r.fulfill({status:503,body:'offline'}));
   await page.route('**/art/vesper-people.png',async r=>{await new Promise(resolve=>setTimeout(resolve,2200));await r.continue();});
   await page.goto('http://127.0.0.1:5000/void-runner.html?renderer='+renderer,{waitUntil:'domcontentloaded'});
   const first=await page.locator('#init-progress').evaluate(e=>e.value);await page.waitForTimeout(600);
   assert(await page.locator('#init-progress').evaluate(e=>e.value)>first);
   assert.match(await page.locator('#init-activity').innerText(),/elapsed/);
   await page.waitForFunction(()=>VoidStartup.started);
   await page.evaluate(()=>{VoidAccount.user={displayName:'Private Real Name',email:'private@example.com'};renderMainMenu();});
   assert(!/Private Real Name|private@example/.test(await page.locator('.main-menu').innerText()));
   await page.click('[data-action=menu-settings]');assert.equal(await page.locator('.settings-panel button').first().getAttribute('data-action'),'menu-back');
   await page.click('[data-action=menu-back]');await page.click('[data-action=menu-new]');await page.click('[data-action=story-intro]');
   // Exercise the real dialogue buttons, not a direct campaign-state shortcut.
   for(let i=0;i<6;i++)await page.click('[data-action=speech-next]');
   await page.click('[data-action="story-choice:0"]');
   for(let i=0;i<2;i++)await page.click('[data-action=speech-next]');
   await page.waitForFunction(()=>mode==='play',null,{timeout:35000});
   assert.equal(await page.evaluate(()=>state.quest),'arrival');
   assert.equal(await page.evaluate(()=>state.completed),0);
   assert.equal(await page.evaluate(()=>flight.route.phase),'departure');
   if(renderer==='babylon') {
    // Cancel a still-pending load and relaunch immediately; old code ignored this click.
    await page.evaluate(()=>{dock();const original=VoidBabylon.prepareSpace;window.releaseTestLoad=null;VoidBabylon.prepareSpace=async(...args)=>{await new Promise(r=>window.releaseTestLoad=r);VoidBabylon.prepareSpace=original;return original(...args);};});
    await page.click('[data-action=launch]');
    assert(await page.locator('[data-action=migration-cancel]').isDisabled());
    await page.waitForTimeout(900);await page.click('[data-action=migration-cancel]');
    assert.match(await page.locator('#screen').innerText(),/VESPER \/ KESTREL READY/);
    assert.equal(await page.evaluate(()=>state.completed),0);
    await page.click('[data-action=launch]');assert.equal(await page.evaluate(()=>mode),'preparing');
    assert(await page.locator('.loading-activity').isVisible());
    await page.evaluate(()=>window.releaseTestLoad());
    await page.waitForFunction(()=>mode==='play',null,{timeout:35000});
   }
   assert.deepEqual(errors,[]);await page.close();
  }
  console.log('PASS gradual loading, private main menu, top Back, real Mara dialogue → flight in both renderers, cancel/relaunch while loading with services offline');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
