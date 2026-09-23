const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'}),page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.stack));
 await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline'}));await page.route('**/api/void-runner/**',r=>r.fulfill({status:503,body:'offline'}));
 try{
 await page.goto('http://127.0.0.1:5000/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started);await page.waitForTimeout(500);
 assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>mode),'menu');await page.locator('[data-action="menu-settings"]').click();
 await page.locator('[data-setting="music"]').fill('23');await page.locator('[data-setting="effects"]').fill('35');await page.locator('[data-setting="voice"]').fill('0');
 await page.locator('[data-action="menu-bindings"]').click();await page.locator('[data-action="bind:missile"]').click();await page.keyboard.press('KeyW');assert.match(await page.locator('#binding-warning').textContent(),/already uses/);await page.keyboard.press('KeyV');assert.equal(await page.evaluate(()=>VoidInput.bindings.missile),'KeyV');
 await page.reload();await page.waitForFunction(()=>window.VoidStartup?.started);assert.equal(await page.evaluate(()=>VoidAudio.settings.music),.23);assert.equal(await page.evaluate(()=>VoidInput.bindings.missile),'KeyV');
 await page.locator('[data-action="menu-new"]').click();await page.getByText('Mara is waiting outside your old workshop.').waitFor();await page.locator('[data-action="story-intro"]').click();
 await page.evaluate(()=>{for(let i=0;i<6;i++)advanceSpeech();});await page.locator('[data-action="story-choice:0"]').click();await page.evaluate(()=>{advanceSpeech();advanceSpeech();});assert.equal(await page.evaluate(()=>mode),'play');assert.equal(await page.evaluate(()=>state.story.flags.maraPromise),true);
 await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>mode),'menu');await page.locator('[data-action="menu-settings"]').click();await page.locator('[data-action="menu-back"]').click();await page.locator('[data-action="menu-resume"]').click();assert.equal(await page.evaluate(()=>mode),'play');
 await page.keyboard.press('Escape');await page.locator('[data-action="menu-new"]').click();await page.getByText(/Existing campaign data/).waitFor();await page.locator('[data-action="menu-back"]').click();await page.locator('[data-action="menu-load"]').click();await page.locator('[data-action="menu-load-local"]').click();assert.equal(await page.evaluate(()=>mode),'play');
 const combat=await page.evaluate(()=>{
  state.creditGear.push('launcher');state.loadout.missile='launcher';resetMissileFlight();flight.route=null;flight.yaw=flight.pitch=flight.roll=0;flight.velocity={x:0,y:0,z:0};enemies=[{x:0,y:0,z:60,size:1,armor:100,maxArmor:100,shield:0,allegiance:'hostile'}];const e=enemies[0];stepMissileCombat(2,{x:0,y:0,z:0});mode='pause';return {status:missileStatus(),ammo:missileState.missilesLoaded};
 });assert.equal(combat.status,'LOCKED');await page.evaluate(()=>{mode='play';dispatchEvent(new KeyboardEvent('keydown',{code:'KeyV'}));dispatchEvent(new KeyboardEvent('keyup',{code:'KeyV'}));mode='pause';});
 const hit=await page.evaluate(()=>{mode='pause';const before=missileState.missilesLoaded;for(let i=0;i<120;i++)stepMissileCombat(1/60,{x:0,y:0,z:0});return {ammo:before,hull:enemies[0].armor,clouds:VoidCombatEffects.clouds.length};});assert.equal(hit.ammo,combat.ammo-1);assert(hit.hull<100);assert(hit.clouds>0);
 await page.evaluate(()=>title());await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.setViewportSize({width:1440,height:900});
 if(process.env.VOID_SCREENSHOT_DIR){fs.mkdirSync(process.env.VOID_SCREENSHOT_DIR,{recursive:true});await page.screenshot({path:process.env.VOID_SCREENSHOT_DIR+'/main-menu.png'});await page.locator('[data-action="menu-settings"]').click();await page.screenshot({path:process.env.VOID_SCREENSHOT_DIR+'/settings.png'});}
 assert.deepEqual(errors,[]);console.log('PASS menu, settings persistence, bindings, dialogue, resume/load, missile launch/damage, mobile layout');
 }finally{if(errors.length)console.error(errors);await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
