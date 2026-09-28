const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.route('**/api/void-runner/**',r=>r.fulfill({status:503,body:'offline'}));
  await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline'}));
  await page.goto('http://127.0.0.1:5187/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started);
  await page.locator('[data-action="menu-new"]').click();await page.waitForFunction(()=>mode==='walking');
  await page.evaluate(async()=>{
   state.quest='arrival';state.story.chapter='arrival';state.universe.station=null;
   const a=launch(),owner=VoidFlightSession.active,b=launch();
   if(a!==b||owner.kind!=='CAMPAIGN'||owner.status!=='PREPARING')throw Error('Duplicate/preparing authority');
   await a;if(!VoidFlightSession.running()||VoidFlightSession.active!==owner)throw Error('Activation authority');
   window.firstOwner=owner;
  });
  await page.evaluate(()=>{
   const owner=VoidFlightSession.active,refs={enemies,missiles,flight,hp};const before=localStorage.getItem(SAVE_KEY);
   openGameMenu();if(owner.status!=='PAUSED'||VoidFlightSession.active!==owner)throw Error('Pause replaced owner');
   window.oldResume=VoidMenu.returnTo;resumeMenu();
   if(owner.status!=='RUNNING'||mode!=='play'||refs.enemies!==enemies||refs.missiles!==missiles||refs.flight!==flight||refs.hp!==hp)throw Error('Resume reset runtime');
   if(localStorage.getItem(SAVE_KEY)!==before)throw Error('Lifecycle pause saved');
  });
  await page.evaluate(async()=>{
   const owner=VoidFlightSession.active;damageTime=0;shieldHP=0;hurt(99999);
   if(owner.status!=='ENDED'||VoidFlightSession.active)throw Error('Defeat retained authority');
   const after=localStorage.getItem(SAVE_KEY);await VoidFlightSession.end(owner);await VoidFlightSession.end(owner);
   if(localStorage.getItem(SAVE_KEY)!==after)throw Error('Repeated end saved');
   await launch();if(VoidFlightSession.active.id===owner.id||!VoidFlightSession.running())throw Error('Retry owner');
   openGameMenu();const stale=VoidMenu.returnTo;await safeRespawn();const recoveredMode=mode;stale();
   if(mode!==recoveredMode||VoidFlightSession.active)throw Error('Stale resume resurrected flight');
   if(groundState.health!==100||state.progression.personal.ammo!==P.tuning.ground.magazine||state.progression.personal.reserve<24)throw Error('Recovery resource regression');
  });
  await page.waitForFunction(()=>mode==='walking');
  // Hold the real renderer at its entry. It deliberately ignores cancellation until released.
  await page.evaluate(()=>{
   window.lifecycleTrace=[];window.realPrepare=VoidBabylon.prepareSpace;
   let first=true;
   VoidBabylon.prepareSpace=async function(...args){
    if(first){first=false;lifecycleTrace.push('A-preparing');await new Promise(r=>window.finishOldPreparation=r);lifecycleTrace.push('A-settled');}
    else lifecycleTrace.push('B-preparing');
    return realPrepare(...args);
   };
   window.launchA=launch();window.ownerA=VoidFlightSession.active;
  });
  await page.waitForFunction(()=>!!window.finishOldPreparation);
  await page.evaluate(()=>VoidInput.held.add(VoidInput.bindings.fire));
  await page.locator('[data-action="migration-cancel"]').click();
  await page.evaluate(()=>{
   window.endA=ownerA.cleanup;window.launchB=launch();
   if(VoidFlightSession.active===ownerA||ownerA.status!=='ENDED'||VoidInput.held.size)throw Error('Replacement/input authority');
  });
  await page.waitForTimeout(150);
  assert.deepEqual(await page.evaluate(()=>lifecycleTrace),['A-preparing']);
  await page.evaluate(async()=>{
   finishOldPreparation();await Promise.all([launchA,endA,launchB]);
   if(!VoidFlightSession.running()||mode!=='play')throw Error('Replacement failed to activate');
   const owner=VoidFlightSession.active,scene=VoidBabylon.scene,root=scene.getTransformNodeByName('space-'+VoidBabylon.diagnostics.location);
   if(!root||root.isDisposed())throw Error('Missing replacement resources');
   await VoidFlightSession.end(ownerA);oldResume();
   if(VoidFlightSession.active!==owner||!VoidFlightSession.running()||root.isDisposed())throw Error('Stale cleanup/resume damaged new owner');
   VoidBabylon.prepareSpace=realPrepare;
  });
  assert.deepEqual(await page.evaluate(()=>lifecycleTrace),['A-preparing','A-settled','B-preparing']);
  await page.evaluate(async()=>{await safeRespawn();await launch();if(!VoidFlightSession.running())throw Error('Subsequent flight failed');});
  await page.evaluate(async()=>{
   const owner=VoidFlightSession.active;await prepareDestination();
   if(VoidFlightSession.active!==owner||!VoidFlightSession.running())throw Error('Destination preparation replaced owner');
   const prepare=VoidBabylon.prepareSpace;VoidBabylon.prepareSpace=async()=>{throw Error('Injected destination failure');};
   await prepareDestination();VoidBabylon.prepareSpace=prepare;
   if(owner.status!=='ENDED'||VoidFlightSession.active||VoidGraphics.busy)throw Error('Failed destination retained authority');
   await launch();if(!VoidFlightSession.running())throw Error('Destination retry failed');
  });
  assert.deepEqual(errors,[]);console.log('PASS Campaign lifecycle: duplicate launch, pause/resume, defeat/retry, recovery, stale resume, delayed cancellation/replacement, stale cleanup, input clearing and subsequent flight.');
 }finally{console.log('PAGE ERRORS',errors);await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
