/* Developer Tools beginner redesign (18 Nov 2026), in a real browser (offline): the Start page and its tour, Basic / Advanced, the "Make a mission" wizard
   (Admin gives it, talk to Iris, 100 credits), UNDO / REDO of an edit, "Test my mission", then PLAY IT NOW: the draft mission is offered by Admin and completed by
   talking to Iris in the throwaway session; the real save is untouched; no page errors. Usage: node tests/serve-modern.cjs, then node tests/editor-redesign-browser.cjs
   (SITE_TEST_URL, SHOTS=dir, BROWSER_EXECUTABLE; default the bundled Chromium, software GL). PART=editor stops before the draft play. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',shots=process.env.SHOTS||null;if(shots)fs.mkdirSync(shots,{recursive:true});
const bundled=fs.existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':'/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',exe=process.env.BROWSER_EXECUTABLE||(fs.existsSync(bundled)?bundled:null);
const log=(...a)=>console.log('[editor-redesign]',...a),PART=process.env.PART||'all';
const shot=async(page,name)=>{if(shots)await page.screenshot({path:path.join(shots,name),timeout:180000});};
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'],...(exe?{executablePath:exe}:{})});const errors=[],posts=[];
 try{
  const ctx=await browser.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'}),page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));
  await page.route('**/api/**',r=>{const p=new URL(r.request().url()).pathname.replace('/api/void-runner/','');if(r.request().method()==='POST')posts.push(p);if(p==='live-content')return r.fulfill({status:404,contentType:'application/json',body:'{"error":"off"}'});return r.fulfill({status:503,contentType:'application/json',body:'{"error":"offline test"}'});});
  const boot=()=>page.waitForFunction(()=>globalThis.VoidStartup?.started,null,{timeout:180000});
  const dev=()=>page.evaluate(()=>VoidDevTools.identity(async p=>{if(p==='developer/balance')return {values:VoidBalance.defaults,revision:1,preset:'NORMAL'};const e=new Error('Switched off in this offline test');e.status=404;throw e;}));
  await page.goto(base+'/void-runner.html');await boot();
  await page.evaluate(()=>{const s=C.startDistrictCampaign(C.fresh());s.story.flags.podWakePending=false;s.credits=500;localStorage.setItem('void-runner-campaign-v1',JSON.stringify({...s,savedAt:1700000000000}));for(const k of ['editor-mode','editor-tour-done','mission-editor-drafts-v1','npc-editor-advanced'])localStorage.removeItem(k);});
  await page.reload();await boot();await dev();const before=await page.evaluate(()=>localStorage.getItem('void-runner-campaign-v1'));
  // ---- the Start page: opening Developer tools with no tab shows it, in Basic mode, and the tour starts by itself the first time
  await page.evaluate(()=>VoidDevTools.open());await page.waitForSelector('[data-eh-task="make"]',{timeout:60000});
  assert.deepEqual(await page.locator('[data-eh-task]').evaluateAll(b=>b.map(x=>x.dataset.ehTask)),['make','place','test','publish']);
  for(const t of ['missions','npcs','test','balance','achievements'])assert.equal(await page.locator('[data-eh-tab="'+t+'"]').count(),1,'more tools: '+t);
  assert.ok(await page.locator('[data-eh-task="make"] svg').count(),'cards have icons');assert.equal(await page.evaluate(()=>devPanel.classList.contains('dev-basic')),true,'Basic by default');
  await page.waitForSelector('[data-eh-tour-box]');assert.match(await page.locator('[data-eh-tour-box]').textContent(),/Tour · 1 of 7/);await shot(page,'01-start-tour.png');
  await page.locator('[data-eh-tour-next]').click();assert.match(await page.locator('[data-eh-tour-box]').textContent(),/Make a mission/);assert.equal(await page.locator('[data-eh-task="make"].eh-tour-target').count(),1,'the tour points at the real card');
  await page.locator('[data-eh-tour-skip]').click();assert.equal(await page.locator('[data-eh-tour-box]').count(),0);assert.equal(await page.evaluate(()=>localStorage.getItem('editor-tour-done')),'1');
  await page.locator('[data-dev="tour"]').click();await page.waitForSelector('[data-eh-tour-box]');for(let i=0;i<7;i++)await page.locator('[data-eh-tour-next]').click();assert.equal(await page.locator('[data-eh-tour-box]').count(),0,'the ? button replays the tour to its end');
  await shot(page,'02-start.png');
  // ---- the wizard: one question per page, a progress bar, problems that say how to fix them
  await page.locator('[data-eh-task="make"]').click();await page.waitForSelector('[data-eh-page="kind"]');assert.equal(await page.locator('[data-eh-progress="1"]').count(),1);
  await page.locator('[data-eh-next]').click();assert.match(await page.locator('[data-eh-problems]').textContent(),/Pick one of the cards/);
  await page.locator('[data-eh-template="talk"]').click();await page.waitForSelector('[data-eh-page="giver"]');assert.equal(await page.locator('[data-eh-progress="2"]').count(),1);
  await page.locator('[data-eh-next]').click();assert.match(await page.locator('[data-eh-problems]').textContent(),/Choose who gives the mission/);
  await page.locator('[data-eh-giver="admin"]').click();await shot(page,'03-wizard-giver.png');await page.locator('[data-eh-next]').click();
  await page.waitForSelector('[data-eh-page="start"]');await page.locator('[data-eh-start="messages"]').click();await page.locator('[data-eh-next]').click();assert.match(await page.locator('[data-eh-problems]').textContent(),/type it in the box/);
  await page.locator('[data-eh-start="person"]').click();await page.locator('[data-eh-next]').click();
  await page.waitForSelector('[data-eh-page="steps"]');await page.locator('[data-eh-step-npc="0"]').selectOption('iris');
  assert.equal(await page.locator('[data-eh-step-label="0"]').inputValue(),'Talk to Iris','the Mission Log line is filled in for you');
  await page.locator('[data-eh-add-step]').click();await page.locator('[data-eh-next]').click();assert.match(await page.locator('[data-eh-problems]').textContent(),/Step 2: choose who/);
  await page.locator('[data-eh-step-remove="1"]').click();await shot(page,'04-wizard-steps.png');await page.locator('[data-eh-next]').click();
  await page.waitForSelector('[data-eh-page="reward"]');await page.locator('[data-eh-reward="100"]').click();await page.locator('[data-eh-next]').click();
  await page.waitForSelector('[data-eh-page="name"]');assert.match(await page.locator('[data-eh-summary]').textContent(),/Admin gives it.*Step 1: Talk to Iris.*100 credits/);
  await page.locator('[data-eh-back]').click();await page.waitForSelector('[data-eh-page="reward"]');await page.locator('[data-eh-next]').click();await page.waitForSelector('[data-eh-page="name"]');
  await page.locator('[data-eh-next]').click();assert.match(await page.locator('[data-eh-problems]').textContent(),/Give the mission a name/);
  await page.locator('[data-eh-title]').fill('TEST: A word with Iris');await page.locator('[data-eh-offer]').fill('TEST LINE: Admin offers the wizard mission.');await shot(page,'05-wizard-name.png');
  await page.locator('[data-eh-next]').click();await page.waitForSelector('[data-eh-done]');const mid=await page.locator('[data-eh-done]').getAttribute('data-eh-done');log('made',mid);
  const made=await page.evaluate(id=>{const d=JSON.parse(localStorage.getItem('mission-editor-drafts-v1'));const t=d.trees.find(x=>x.missions.some(m=>m.id===id));return {tree:t.id,m:t.missions.find(m=>m.id===id)};},mid);
  assert.equal(made.tree,'draft-my-missions');assert.equal(made.m.giver,'admin');assert.equal(made.m.rewards,100);assert.deepEqual(made.m.objectives.map(o=>[o.kind,o.npc,o.label]),[['talk','iris','Talk to Iris']]);assert.ok(Number.isInteger(made.m.number));
  await shot(page,'06-wizard-done.png');
  // ---- the editor opens it; Basic hides ids and rarely used settings, Advanced shows them; UNDO / REDO an edit
  await page.locator('[data-eh-open="'+mid+'"]').click();const card=page.locator('[data-me-tree-mission="'+mid+'"]');await card.waitFor();await page.waitForTimeout(200);
  assert.equal(await card.locator('[data-me-number]').isVisible(),false,'Basic: the mission number row is hidden');assert.equal(await card.locator('[data-me-field="category"]').isVisible(),false);
  assert.equal(await card.locator('[data-me-field="title"]').isVisible(),true);assert.match(await card.locator('[data-me-tstep="step-1"] > .me-row > b').first().textContent(),/^STEP 1$/,'Basic: no step id');
  assert.equal(await page.locator('.eg-done').count()+await page.locator('.eg-next').count()>0,true,'Guide me still runs');
  await page.locator('[data-dev-advanced]').check();await card.waitFor();await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>localStorage.getItem('editor-mode')),'advanced');
  assert.equal(await page.locator('[data-me-tree-mission="'+mid+'"] [data-me-number]').isVisible(),true,'Advanced shows everything');assert.match(await page.locator('[data-me-tree-mission="'+mid+'"] [data-me-tstep="step-1"] > .me-row > b').first().textContent(),/STEP 1 · step-1/);
  await page.locator('[data-dev-advanced]').uncheck();await page.waitForTimeout(200);
  const title=()=>page.evaluate(id=>JSON.parse(localStorage.getItem('mission-editor-drafts-v1')).trees.find(x=>x.id==='draft-my-missions').missions.find(m=>m.id===id).title,mid);
  await page.locator('[data-me-tree-mission="'+mid+'"] [data-me-field="title"]').fill('TEST: renamed');await page.waitForTimeout(100);assert.equal(await title(),'TEST: renamed');
  assert.equal(await page.locator('[data-dev="undo"]').isDisabled(),false);await page.locator('[data-dev="undo"]').click();await page.waitForTimeout(150);assert.equal(await title(),'TEST: A word with Iris','UNDO puts the name back');
  assert.equal(await page.locator('[data-me-tree-mission="'+mid+'"] [data-me-field="title"]').inputValue(),'TEST: A word with Iris','the editor shows it');
  await page.locator('[data-dev="redo"]').click();await page.waitForTimeout(150);assert.equal(await title(),'TEST: renamed','REDO');
  await page.locator('#dev-balance').press('Control+z');await page.waitForTimeout(150);assert.equal(await title(),'TEST: A word with Iris','Ctrl+Z');
  // removing the mission can be undone too
  page.once('dialog',d=>d.accept());await page.locator('[data-me-tree-mission="'+mid+'"] .me-x').first().click();await page.waitForTimeout(150);assert.equal(await page.locator('[data-me-tree-mission="'+mid+'"]').count(),0);
  await page.locator('[data-dev="undo"]').click();await page.locator('[data-me-tree-mission="'+mid+'"]').waitFor();log('undo of a removal: ok');
  // ---- Test my mission lists it as ready
  await page.locator('[data-dev-tab="home"]').click();await page.locator('[data-eh-task="test"]').click();await page.waitForSelector('[data-eh-test="'+mid+'"]');
  assert.equal(await page.locator('[data-eh-test="'+mid+'"] [data-eh-play]').count(),1,'ready to play');await shot(page,'07-test-my-mission.png');
  // the balance tab hides the internal key line in Basic
  await page.locator('[data-dev-tab="balance"]').click();await page.waitForSelector('[data-balance="missileDamage"]');assert.equal(await page.locator('.dev-range').first().isVisible(),false);
  await page.locator('[data-dev-tab="home"]').click();await page.locator('[data-eh-task="test"]').click();await page.waitForSelector('[data-eh-test="'+mid+'"]');
  if(PART==='editor'){log('editor part done');}
  else{
   // ---- PLAY IT: the throwaway session; Admin offers it, Iris completes it, the credits are paid; the real save is untouched
   await page.evaluate(()=>{try{VoidGraphics.quality='low';VoidBabylon.setQuality('low');}catch{}});
   await page.locator('[data-eh-test="'+mid+'"] [data-eh-play]').click();
   await page.waitForFunction(()=>!document.getElementById('dev-test-banner').hidden&&mode==='walking',null,{timeout:900000,polling:100});
   assert.match(await page.locator('#dev-test-banner').textContent(),/PLAYING DRAFT: Mission \d{3} — TEST: A word with Iris/);
   await page.evaluate(()=>VoidInteractions.handlers.get('admin')());
   let st=await page.evaluate(m=>({tracked:state.universe.trackedMission,lines:speech?.lines?.map(l=>l.text)||[]}),mid);log('after Admin:',JSON.stringify(st));
   assert.equal(st.tracked,mid,'Admin offers the wizard mission');assert(st.lines.includes('TEST LINE: Admin offers the wizard mission.'));
   await page.evaluate(()=>{try{resumeWalking();}catch{}});const credits=await page.evaluate(()=>state.credits);
   await page.evaluate(()=>VoidInteractions.handlers.get('district-iris')());
   st=await page.evaluate(m=>({rec:state.universe.missions[m],credits:state.credits}),mid);log('after Iris:',JSON.stringify(st));
   assert.equal(st.rec.completed,true,'talking to Iris completes it');assert.equal(st.credits,credits+100,'the reward is paid');
   await shot(page,'08-draft-play.png');
   await page.waitForTimeout(1200);assert.equal(await page.evaluate(()=>localStorage.getItem('void-runner-campaign-v1')),before,'the real save is untouched');
   assert(!posts.some(p=>p==='save'||p.endsWith('/save')),'no cloud save');
   await Promise.all([page.waitForNavigation({timeout:120000}),page.locator('#dev-test-banner button').click()]);await boot();await dev();
   await page.waitForSelector('[data-me-tree-mission="'+mid+'"]',{timeout:120000});log('LEAVE DRAFT returns to the mission in the editor');}
  assert.deepEqual(errors,[],'no page errors');log('OK');
 }catch(e){console.error(e);console.error('page errors:',errors);process.exitCode=1;}finally{await browser.close();}
})();
