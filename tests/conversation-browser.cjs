/* Browser smoke: floating NPC dialogue never takes walking mode or movement away. */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const tier=process.argv[2]==='high'?'high':'low';
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1280,height:800},reducedMotion:'reduce'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
 await page.route(/firebase|gstatic|googleapis/,r=>r.abort());
 try{
  await page.addInitScript(q=>localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:q})),tier);
  await page.goto('http://127.0.0.1:5187/void-runner.html');
  await page.waitForFunction(()=>window.VoidStartup?.started,null,{timeout:120000});
  await page.click('[data-action=menu-campaign]');await page.click('[data-action=menu-new]');
  const confirm=page.locator('[data-action=menu-new-confirm]');if(await confirm.count())await confirm.click();
  await page.waitForFunction(()=>mode==='pod-waking'&&walker,null,{timeout:120000});
  await page.locator('#pod-wake button').click();
  await page.waitForFunction(()=>mode==='walking'&&walker,null,{timeout:30000});
  await page.evaluate(()=>talk('',[{who:'admin',text:'Test conversation.'}],()=>{},'CONTINUE'));
  const before=await page.evaluate(()=>({mode,x:walker.x,z:walker.z,yaw:walker.yaw,open:!document.querySelector('#screen').classList.contains('hidden')}));
  assert.equal(before.mode,'walking');assert(before.open);
  await page.keyboard.down('KeyW');await page.waitForTimeout(550);await page.keyboard.up('KeyW');
  const after=await page.evaluate(()=>({mode,x:walker.x,z:walker.z,rows:VoidConversationHistory.read(localStorage,'guest').length}));
  assert.equal(after.mode,'walking');assert(Math.hypot(after.x-before.x,after.z-before.z)>.02,'W moves during conversation');assert(after.rows>0);
  await page.mouse.click(640,400);await page.waitForFunction(()=>document.pointerLockElement?.id==='space',null,{timeout:5000});
  await page.mouse.move(675,400);await page.waitForTimeout(100);
  const yaw=await page.evaluate(()=>walker.yaw);assert.notEqual(yaw,before.yaw,'mouse look works while conversation remains open');
  await page.evaluate(()=>document.exitPointerLock());await page.waitForFunction(()=>!document.pointerLockElement);
  await page.locator('.conversation-minimize').click({timeout:15000,noWaitAfter:true});assert(await page.locator('#conversation-restore').isVisible());
  await page.locator('#conversation-restore').click({noWaitAfter:true});assert(await page.locator('.conversation-live').isVisible());
  await page.evaluate(()=>VoidHUD.open('comms'));
  assert(await page.locator('#personal-hud .social-thread').getByText('Test conversation.').isVisible());
  assert.equal(await page.locator('#personal-hud .social-profile .hud-tag').count(),0,'profiles have no visible NPC/player badge');
  await page.locator('[data-hud-filter=unread]').click();assert(await page.locator('#personal-hud .social-thread').getByText('Test conversation.').isVisible());
  await page.locator('[data-hud-achievement=merchandise]').click();assert(await page.locator('#personal-hud').getByText('District Supporter').isVisible());
  await page.locator('[data-hud-close]').click();
  assert.equal(await page.evaluate(()=>VoidConversationHistory.filter(VoidConversationHistory.read(localStorage,'guest'),'unread').length),0);
  /* archived Vesper tutorial choices now use the floating window, not a full-screen panel */
  await page.evaluate(()=>{resumeWalking();floatChoices('mara','Before you go.',button('YES','tutorial-yes')+button('NO','tutorial-no',true));});
  const choices=await page.evaluate(()=>({mode,panel:!!document.querySelector('#screen .panel.lead'),buttons:[...document.querySelectorAll('#screen .speech-controls button')].map(b=>b.dataset.action),live:!!document.querySelector('#screen.conversation-live .choice-menu')}));
  assert.equal(choices.mode,'walking');assert.equal(choices.panel,false);assert.deepEqual(choices.buttons,['tutorial-yes','tutorial-no']);assert(choices.live);
  const c0=await page.evaluate(()=>({x:walker.x,z:walker.z}));await page.keyboard.down('KeyW');await page.waitForTimeout(450);await page.keyboard.up('KeyW');
  assert(await page.evaluate(c=>Math.hypot(walker.x-c.x,walker.z-c.z)>.02,c0),'walking works with choices open');
  await page.evaluate(()=>resumeWalking());
  await page.screenshot({path:'/tmp/dd-conversation.png'});
  assert.deepEqual(errors,[]);console.log(JSON.stringify({tier,before,after,yaw,errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
