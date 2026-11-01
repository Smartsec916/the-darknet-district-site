const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/api/void-runner/**',route=>route.fulfill({status:503,body:'offline'}));
  await page.goto('http://127.0.0.1:5189/void-runner.html');
  await page.waitForFunction(()=>window.VoidStartup?.started);
  await page.evaluate(async()=>{
   state=C.fresh();state.quest='arrival';state.location='meridian';state.universe.freeTravel=true;state.universe.missionLogUnlocked=true;
   state.progression.opening.pistol=true;
   for(const id of ['move','sprint','jump','groundCombat','board','throttle','navigation','jumpTravel'])VoidProgression.mark(state,id);
   VoidMissions.sync(state,C);VoidMissions.track(state,'flight-training',C);await enterWalking('hangar');save();
  });
  assert.equal(await page.locator('#mission-log-button').isHidden(),true); // The reminder is Vesper-only; L works here.
  await page.keyboard.press('KeyL');
  assert.equal(await page.locator('#mission-log').count(),1);
  assert(await page.locator('#mission-log').getByText('FLIGHT TRAINING').count());
  assert(await page.locator('#mission-log .mission-entry li.pending').count()>0);
  assert(await page.locator('#mission-log .mission-entry li.complete').count()>0);
  await page.locator('[data-untrack="flight-training"]').click();
  assert.equal(await page.evaluate(()=>VoidMissions.tracked(state,C)),null);
  await page.waitForFunction(()=>document.getElementById('mission-tracker').hidden);
  await page.waitForFunction(()=>document.getElementById('tutorial-prompt').hidden);
  await page.locator('[data-track="meet-admin"]').click();
  assert.equal(await page.evaluate(()=>VoidMissions.tracked(state,C)?.id),'meet-admin');
  assert.equal(await page.evaluate(()=>mode),'mission-log');await page.keyboard.press('KeyL');
  await page.waitForFunction(()=>document.getElementById('mission-tracker').textContent.includes('MEET ADMIN'));await page.keyboard.press('KeyL');
  await page.locator('[data-track="flight-training"]').click();
  assert.equal(await page.evaluate(()=>VoidMissions.tracked(state,C)?.objectives.find(o=>!o.complete)?.id),'steer');
  await page.reload();await page.waitForFunction(()=>window.VoidStartup?.started);
  assert.equal(await page.evaluate(()=>VoidMissions.tracked(state,C)?.id),'flight-training');
  assert.equal(await page.evaluate(()=>VoidMissions.tracked(state,C)?.objectives.find(o=>o.id==='steer')?.complete),false);
  assert.deepEqual(errors,[]);
  console.log('Mission browser: L, objective states, untrack, switch, retrack and save/reload passed.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
