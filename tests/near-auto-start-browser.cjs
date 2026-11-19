/* "When walked near" starts by itself (19 Nov 2026), in a real browser (offline). EDITOR: a mission first set to "In person, asking ACCEPT / DENY" and then changed to
   By Messages + "When walked near" no longer keeps the question (it used to follow silently); the line under the trigger says "Starts automatically — no click";
   "Player pays 100" forces the question ("Asks ACCEPT / DENY", no switch) and "Player gets" turns it off again; the switch button turns it on and off.
   GAME (PLAY THIS DRAFT): walking within 5 m of Admin starts the mission at once: acquired and tracked with no click, no conversation and no offer window.
   The real save is untouched; no page errors. Usage: node tests/serve-modern.cjs, then node tests/near-auto-start-browser.cjs (SITE_TEST_URL, SHOTS=dir,
   BROWSER_EXECUTABLE; default the bundled Chromium, software GL). */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',shots=process.env.SHOTS||null;if(shots)fs.mkdirSync(shots,{recursive:true});
const bundled=fs.existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':'/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',exe=process.env.BROWSER_EXECUTABLE||(fs.existsSync(bundled)?bundled:null);
const log=(...a)=>console.log('[near-auto]',...a);
const shot=async(page,name)=>{if(shots)await page.screenshot({path:path.join(shots,name),timeout:300000});};
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'],...(exe?{executablePath:exe}:{})});const errors=[];
 try{
  const ctx=await browser.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'}),page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));
  await page.route('**/api/**',r=>{const p=new URL(r.request().url()).pathname.replace('/api/void-runner/','');if(p==='live-content')return r.fulfill({status:404,contentType:'application/json',body:'{"error":"off"}'});return r.fulfill({status:503,contentType:'application/json',body:'{"error":"offline test"}'});});
  const boot=()=>page.waitForFunction(()=>globalThis.VoidStartup?.started,null,{timeout:600000});
  await page.goto(base+'/void-runner.html');await boot();
  await page.evaluate(()=>{const s=C.startDistrictCampaign(C.fresh());s.story.flags.podWakePending=false;localStorage.setItem('void-runner-campaign-v1',JSON.stringify({...s,savedAt:1700000000000}));localStorage.setItem('editor-tour-done','1');for(const k of ['editor-mode','mission-editor-drafts-v1'])localStorage.removeItem(k);});
  await page.reload();await boot();
  await page.evaluate(()=>Object.assign(VoidPreparation.limits,{scene:900000,assets:900000,optional:600000,area:900000,total:1800000,module:600000,artwork:300000}));
  await page.evaluate(()=>VoidDevTools.identity(async p=>{if(p==='developer/balance')return {values:VoidBalance.defaults,revision:1,preset:'NORMAL'};const e=new Error('Switched off in this offline test');e.status=404;throw e;}));
  await page.evaluate(()=>VoidDevTools.open('missions'));await page.waitForSelector('[data-me-new-tree]',{timeout:60000});
  await page.locator('[data-me-new-tree]').click();await page.locator('[data-me-new-name]').fill('Near auto');await page.locator('[data-me-create-tree]').click();
  const T='draft-near-auto',m1=T+'-m1';await page.locator('[data-me-tree="'+T+'"]').click();await page.locator('[data-me-add-mission]').click();
  const c=()=>page.locator('[data-me-tree-mission="'+m1+'"]');await c().waitFor();
  const start=()=>page.evaluate(id=>JSON.parse(localStorage.getItem('mission-editor-drafts-v1')).trees.flatMap(t=>t.missions).find(m=>m.id===id).start,m1);
  const mode=async()=>({auto:await c().locator('[data-me-near-mode]').getAttribute('data-me-near-auto'),text:await c().locator('[data-me-near-mode]').textContent(),ask:await c().locator('[data-me-ask-on]').isChecked()});
  await c().locator('[data-me-giver]').selectOption('admin');await c().locator('[data-me-field="title"]').fill('TEST: walk up to Admin');
  // "In person, asking" first, then By Messages: the question implied by "In person, asking" does not follow
  await c().locator('[data-me-starts]').selectOption('person-accept');assert.equal((await start()).accept,true);
  await c().locator('[data-me-starts]').selectOption('messages');assert.equal((await start()).accept,undefined,'a device start does not inherit the in-person question');
  await c().locator('[data-me-start-header]').fill('TEST');await c().locator('[data-me-start-text]').fill('TEST: come over here.');
  await c().locator('[data-me-start-when]').selectOption('near');await page.waitForSelector('[data-me-near-mode="'+m1+'"]');
  let md=await mode();log('near mode',JSON.stringify(md));assert.equal(md.auto,'true');assert.match(md.text,/Starts automatically — no click/);assert.equal(md.ask,false);
  await c().locator('[data-me-near-mode]').scrollIntoViewIfNeeded();await shot(page,'01-editor-near-automatic.png');
  // Player pays 100: the question is forced on (no switch); Player gets: it goes off again
  await c().locator('[data-me-credits-dir]').selectOption('pays');await c().locator('[data-me-near-mode]').waitFor();md=await mode();assert.equal(md.auto,'false');assert.match(md.text,/Asks ACCEPT \/ DENY.*pays 100 CR/);assert.equal(await c().locator('[data-me-near-switch]').count(),0);
  await c().locator('[data-me-near-mode]').scrollIntoViewIfNeeded();await shot(page,'02-editor-near-pays.png');
  await c().locator('[data-me-credits-dir]').selectOption('gets');md=await mode();assert.equal(md.auto,'true','back to "Player gets": automatic again');assert.equal((await start()).accept,undefined);
  // the switch: ask, then automatic again
  await c().locator('[data-me-near-switch]').click();md=await mode();assert.equal(md.auto,'false');assert.equal(md.ask,true);assert.match(md.text,/starts only when the player presses ACCEPT/);
  await c().locator('[data-me-near-switch]').click();md=await mode();assert.equal(md.auto,'true');assert.equal((await start()).accept,undefined);
  await c().locator('[data-me-step-npc="step-1"]').selectOption('iris');await c().locator('[data-me-label="step-1"]').fill('Talk to Iris (test)');
  log('draft start',JSON.stringify(await start()));
  // ---- the game: walk near Admin, no click
  await page.evaluate(()=>{try{VoidGraphics.quality='low';VoidBabylon.setQuality('low');}catch{}});
  await page.locator('[data-me-play="tree:'+m1+'"]').click();
  await page.waitForFunction(()=>!document.getElementById('dev-test-banner').hidden&&mode==='walking',null,{timeout:900000,polling:100});
  const ad=await page.evaluate(()=>walkingLocation.interactions.find(i=>i.action==='admin')?.position||null);assert.ok(ad,'Admin is in this scene');
  assert.equal(await page.evaluate(id=>state.universe.missions[id]||null,m1),null,'not started before walking near');
  const clicks=await page.evaluate(()=>{window.__nearClicks=0;document.addEventListener('click',()=>{window.__nearClicks++;},true);return 0;});
  await page.evaluate(p=>{Object.assign(walker,{x:p[0]+2.5,z:p[2]});},ad);
  await page.waitForFunction(id=>!!state.universe.missions[id]?.acquired,m1,{timeout:20000});
  const after=await page.evaluate(id=>({tracked:state.universe.trackedMission,speech:typeof speech!=='undefined'&&!!speech,convo:!!VoidConversationUI?.isOpen,choice:document.querySelectorAll('[data-talk-choice],[data-talk-offer]').length,mode,clicks:window.__nearClicks}),m1);
  log('after walking near',JSON.stringify(after));
  assert.equal(after.tracked,m1,'started and tracked');assert.equal(after.speech,false,'no conversation');assert.equal(after.convo,false);assert.equal(after.choice,0,'no ACCEPT / DENY window');assert.equal(after.mode,'walking');assert.equal(after.clicks,clicks,'no click');
  await page.waitForTimeout(2000);await shot(page,'03-game-walked-near-started.png');
  await page.waitForTimeout(1200);assert.equal(await page.evaluate(id=>!!(JSON.parse(localStorage.getItem('void-runner-campaign-v1')||'{}').universe?.missions||{})[id],m1),false,'the real save is untouched');
  assert.deepEqual(errors,[]);log('PASS');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
