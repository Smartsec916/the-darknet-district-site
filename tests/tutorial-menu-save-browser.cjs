const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/Campaign state changed|Campaign save changed|VOID frame/.test(m.text()))errors.push(m.text());});
 try{
  await page.route('**/api/void-runner/**',r=>r.fulfill({status:503,body:'offline'}));await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline'}));
  await page.goto('http://127.0.0.1:5187/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started);
  assert.equal(await page.locator('[data-action="menu-continue"]').isDisabled(),true);
  await page.locator('[data-action="menu-campaign"]').click();assert.equal(await page.evaluate(()=>hasSave),false);
  await page.locator('[data-action="menu-new"]').click();await page.waitForFunction(()=>mode==='walking',null,{timeout:90000});
  async function speech(){await page.evaluate(()=>{for(let i=0;i<15&&speech;i++){speech.shown=Infinity;advanceSpeech();}});}
  // Invoke the registered interactions, then exercise the actual raycast and weapon action.
  await page.evaluate(()=>{const item=walkingLocation.interactions.find(i=>i.id==='recording');VoidInteractions.handlers.get(item.action)({item});});
  await speech();
  await page.evaluate(()=>{const item=walkingLocation.interactions.find(i=>i.id==='mara');VoidInteractions.handlers.get(item.action)({item});});await speech();
  await page.locator('[data-action="opening-choice:0"]').click();
  await page.evaluate(()=>{Object.assign(walker,{x:24,z:-8,yaw:Math.PI/2,pitch:0,vx:0,vz:0});groundAction('draw');groundAction('aim');});
  for(let id=0;id<4;id++){
   await page.evaluate(id=>{const p=VoidOpening.cans[id].position,dx=p[0]-walker.x,dz=p[2]-walker.z;walker.yaw=Math.atan2(dx,dz);walker.pitch=Math.atan2(walker.y-p[1],Math.hypot(dx,dz));groundState.cooldown=0;groundAction('fire');},id);
  }
  assert.equal(await page.evaluate(()=>state.progression.opening.cans.length),4);
  assert.equal(await page.evaluate(()=>state.progression.flags.shootingTutorialComplete),true);
  assert.equal(await page.evaluate(()=>state.progression.flags.reload===true),false);
  assert.match(await page.locator('#tutorial-prompt').textContent(),/Meet Mara by the ship/);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem(SAVE_KEY)).progression.flags.shootingTutorialComplete),true);
  await page.screenshot({path:path.resolve('work/tutorial-complete.png')});
  // Reconstruct the completed targets with the completion callback missing.
  await page.evaluate(()=>{delete state.progression.flags.shootingTutorialComplete;delete state.progression.flags.groundCombat;state.progression.opening.cans=[];update(.016);});
  assert.equal(await page.evaluate(()=>state.progression.flags.shootingTutorialComplete),true);
  await page.reload();await page.waitForFunction(()=>window.VoidStartup?.started);await page.locator('[data-action="menu-continue"]').click();await page.waitForFunction(()=>mode==='walking');
  assert.match(await page.locator('#tutorial-prompt').textContent(),/Meet Mara by the ship/);
  assert.equal(await page.evaluate(()=>VoidBabylon.opening.mara.position.z),22);
  // Normal conversation unlocks boarding and remains complete after another reload.
  await page.evaluate(()=>{Object.assign(walker,{x:3,z:20,yaw:0,pitch:0});update(.016);interactWalking();});
  assert.equal(await page.evaluate(()=>mode),'dialogue');await speech();
  assert.match(await page.locator('#tutorial-prompt').textContent(),/Board the Kestrel/);
  await page.reload();await page.waitForFunction(()=>window.VoidStartup?.started);await page.locator('[data-action="menu-continue"]').click();await page.waitForFunction(()=>mode==='walking');
  assert.equal(await page.evaluate(()=>state.progression.flags.maraShipHandoff),true);
  await page.evaluate(()=>{delete state.progression.flags.maraShipHandoff;save();});
  // Direct boarding recovers the missed Mara interaction by playing the story handoff.
  await page.evaluate(async()=>leaveWalking());assert.equal(await page.evaluate(()=>mode),'dialogue');await speech();
  assert.equal(await page.evaluate(()=>state.progression.flags.maraShipHandoff),true);assert.equal(await page.evaluate(()=>state.progression.flags.board),true);
  assert.equal(await page.locator('[data-action="opening-start"]').count(),1);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem(SAVE_KEY)).progression.flags.board),true);
  await page.locator('[data-action="game-menu"]').click();assert.equal(await page.locator('[data-action="menu-skirmish"]').count(),1);
  await page.locator('[data-action="menu-main"]').click();await page.waitForFunction(()=>!VoidMenu.transitioning);
  assert.equal(await page.evaluate(()=>walkingLocation),null);assert.equal(await page.evaluate(()=>VoidMenu.returnTo),null);
  let stored=await page.evaluate(()=>localStorage.getItem(SAVE_KEY));
  for(let round=0;round<2;round++){
   await page.locator('[data-action="menu-skirmish"]').click();await page.locator('[data-action="skirmish-enter"]').click();await page.waitForFunction(()=>mode==='skirmish-fps',null,{timeout:90000});
   await page.evaluate(()=>{VoidSkirmish.action('fire');save();});
   assert.equal(await page.evaluate(()=>localStorage.getItem(SAVE_KEY)),stored);
   await page.locator('[data-action="game-menu"]').click();await page.locator('[data-action="skirmish-main"]').click();
   await page.locator('[data-action="menu-skirmish"]').click();await page.locator('[data-action="skirmish-type:flight"]').click();
   for(let i=0;i<5;i++)await page.locator('[data-action="flight-next"]').click();
   await page.locator('[data-action="flight-start"]').click();await page.waitForFunction(()=>mode==='play'&&VoidFlightSkirmish.active?.status==='active',null,{timeout:90000});
   await page.evaluate(()=>{state.credits=0;state.progression.personal.ammo=0;state.progression.missiles=0;state.progression.cargo=[];state.story.flags.temporary=true;save();});
   assert.equal(await page.evaluate(()=>localStorage.getItem(SAVE_KEY)),stored);
   await page.keyboard.press('Escape');await page.locator('[data-action="flight-main"]').click();await page.waitForFunction(()=>VoidMenu.page==='main');
   assert.equal(await page.evaluate(()=>localStorage.getItem(SAVE_KEY)),stored);
   await page.locator('[data-action="menu-continue"]').click();await page.waitForFunction(()=>mode==='walking');
   assert.equal(await page.evaluate(()=>state.progression.flags.board),true);assert.equal(await page.evaluate(()=>state.story.flags.temporary),undefined);
   await page.evaluate(async()=>leaveWalking());assert.equal(await page.locator('[data-action="opening-start"]').count(),1);
   await page.locator('[data-action="game-menu"]').click();await page.locator('[data-action="menu-main"]').click();await page.waitForFunction(()=>!VoidMenu.transitioning);
   stored=await page.evaluate(()=>localStorage.getItem(SAVE_KEY));
  }
  // Stable state does not cause duplicate autosave writes.
  assert.equal(await page.evaluate(()=>{save();const before=localStorage.getItem(SAVE_KEY);save();save();return localStorage.getItem(SAVE_KEY)===before;}),true);
  // Defeat saves progression while recovery returns to the last safe location.
  await page.locator('[data-action="menu-continue"]').click();await page.waitForFunction(()=>mode==='walking');
  await page.evaluate(async()=>leaveWalking());await page.locator('[data-action="opening-start"]').click();await page.waitForFunction(()=>mode==='play');
  await page.evaluate(()=>{damageTime=0;hurt(10000);});await page.waitForFunction(()=>mode==='over');
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem(SAVE_KEY)).progression.checkpoint.location),'vesper');
  assert.equal(await page.evaluate(()=>Object.hasOwn(JSON.parse(localStorage.getItem(SAVE_KEY)),'hp')),false);
  await page.locator('[data-action="progress-respawn"]').click();await page.waitForFunction(()=>mode==='walking');
  assert.equal(await page.evaluate(()=>state.location),'vesper');assert.equal(await page.evaluate(()=>groundState.health),100);
  await page.evaluate(async()=>{await mainAction('menu-main');});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.resolve('work/menu-mobile.png')});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  for(const action of ['menu-campaign','menu-skirmish','menu-continue'])assert.equal(await page.locator('[data-action="'+action+'"]').isVisible(),true);
  assert.deepEqual(errors,[]);console.log('PASS real can hits, missed completion recovery, reload, Mara fallback, boarding autosave, repeated FPS/Flight switching, save isolation, deduplicated writes, mobile menu.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
