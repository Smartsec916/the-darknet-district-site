/* Local browser check of targeted multiplayer setup. Account API behavior is covered by Python and WebSocket tests. */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187';
(async()=>{
 const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox']});
 const errors=[];
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800},reducedMotion:'reduce',serviceWorkers:'block'});
  page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(120000);
  await page.route('https://**/*',r=>r.abort());await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
  await page.addInitScript(()=>{localStorage.setItem('void-runner-graphics-v1','{"quality":"low"}');localStorage.setItem('tdd-multiplayer','1');});
  await page.goto(base+'/void-runner.html?multiplayer=1');
  await page.waitForFunction(()=>window.VoidStartup?.started,null,{timeout:120000});
  await page.click('[data-action=menu-campaign]');await page.click('[data-action=menu-new]');
  const confirm=page.locator('[data-action=menu-new-confirm]');if(await confirm.count())await confirm.click();
  await page.waitForFunction(()=>mode==='pod-waking'&&walker,null,{timeout:120000});
  await page.evaluate(()=>{state.story.flags.appearanceOffered=true;});await page.locator('#pod-wake button').click();
  await page.waitForFunction(()=>mode==='walking'&&VoidAssets.pending===0,null,{timeout:120000});
  const snapshot=()=>page.evaluate(()=>({credits:state.credits,location:state.location,story:JSON.stringify(state.story),inventory:JSON.stringify(state.inventory||null)}));
  const before=await snapshot();
  await page.evaluate(()=>{
   VoidAccount.user={uid:'setup-user',isAnonymous:false,getIdToken:async()=> 'test-token'};
   VoidAccount.profileReady=true;VoidAccount.handle=null;VoidAccount.character=null;
   VoidAccount.claimMultiplayerHandle=async value=>{if(value!=='Neon_1')throw new Error('That handle is taken.');VoidAccount.handle=value;return value;};
   VoidAccount.completeMultiplayerCharacter=async look=>{window.__setupLook=look;VoidAccount.character={gender:look.base,model:look.base==='female'?'district-resident':'district-smuggler'};return {character:VoidAccount.character,created:true};};
   settingsPage();
  });
  assert.equal(await page.locator('#multiplayer-handle').count(),1,'new account is offered a handle');
  assert.equal(await page.locator('[data-action=multiplayer-character]').count(),1,'new account is offered character creation');
  await page.locator('#multiplayer-handle').fill('Neon_1');await page.locator('[data-action=multiplayer-handle]').click();
  await page.waitForFunction(()=>VoidAccount.handle==='Neon_1'&&!document.querySelector('#multiplayer-handle'));
  assert.equal(await page.locator('[data-action=multiplayer-character]').count(),1,'only missing character remains');
  await page.locator('[data-action=multiplayer-character]').click();await page.waitForSelector('#character-creator.on');
  await page.waitForFunction(()=>!document.querySelector('[data-cc=confirm]')?.disabled,null,{timeout:120000});
  await page.locator('[data-cc=base][data-v=female]').click();await page.locator('[data-cc=confirm]').click();
  await page.waitForFunction(()=>VoidAccount.character?.gender==='female'&&!!window.__setupLook);
  assert.equal(await page.evaluate(()=>VoidAccount.handle),'Neon_1','character setup kept the handle');
  const after=await snapshot();
  assert.deepEqual(after,before,'setup did not replace the campaign or inventory');
  await page.evaluate(()=>settingsPage());
  assert.equal(await page.locator('#multiplayer-handle').count(),0);
  assert.equal(await page.locator('[data-action=multiplayer-character]').count(),0,'complete account has no setup prompts');
  await page.evaluate(()=>{VoidAccount.handle=null;settingsPage();});
  assert.equal(await page.locator('#multiplayer-handle').count(),1,'a character-only account gets only handle setup');
  assert.equal(await page.locator('[data-action=multiplayer-character]').count(),0,'existing character is not offered replacement');
  await page.locator('#multiplayer-handle').fill('Neon_1');await page.locator('[data-action=multiplayer-handle]').click();
  await page.waitForFunction(()=>VoidAccount.handle==='Neon_1');
  assert.equal(await page.evaluate(()=>VoidAccount.character.gender),'female','claiming a missing handle preserves the character');
  assert.deepEqual(errors,[]);console.log('Multiplayer entry browser setup passed.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
