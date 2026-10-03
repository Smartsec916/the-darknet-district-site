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
   state=C.fresh();state.quest='open';state.location='meridian';state.universe.freeTravel=true;state.universe.missionLogUnlocked=true;
   for(const id of ['throttle','navigation','jumpTravel'])VoidProgression.mark(state,id);
   VoidMissions.sync(state,C);await enterWalking('hangar');save();
  });
  await page.keyboard.press('F1');
  assert.equal(await page.locator('#mission-log').count(),1);
  assert(await page.locator('#mission-log').getByText('FLIGHT TRAINING').count());
  assert(await page.locator('#mission-log .mission-entry li.pending').count()>0);
  assert(await page.locator('#mission-log .mission-entry li.complete').count()>0);
  await page.locator('[data-untrack="flight-training"]').click();
  assert.equal(await page.evaluate(()=>VoidMissions.tracked(state,C)),null);
  await page.waitForFunction(()=>document.getElementById('mission-tracker').hidden);
  await page.waitForFunction(()=>document.getElementById('tutorial-prompt').hidden);
  await page.keyboard.press('F1');await page.locator('[data-track="meet-admin"]').click();
  assert.equal(await page.evaluate(()=>VoidMissions.tracked(state,C)?.id),'meet-admin');
  await page.waitForFunction(()=>document.getElementById('mission-tracker').textContent.includes('MEET ADMIN'));
  await page.keyboard.press('F1');await page.locator('[data-track="flight-training"]').click();
  assert.equal(await page.evaluate(()=>VoidMissions.tracked(state,C)?.objectives.find(o=>!o.complete)?.id),'steer');
  await page.reload();await page.waitForFunction(()=>window.VoidStartup?.started);
  assert.equal(await page.evaluate(()=>VoidMissions.tracked(state,C)?.id),'flight-training');
  assert.equal(await page.evaluate(()=>VoidMissions.tracked(state,C)?.objectives.find(o=>o.id==='steer')?.complete),false);
  assert.deepEqual(errors,[]);
  console.log('Mission browser: F1, objective states, untrack, switch, retrack and save/reload passed.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
