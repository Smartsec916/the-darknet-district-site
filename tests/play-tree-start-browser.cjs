/* PLAY FROM THE START OF THIS TREE and the always-shown apartments panel (19 Nov 2026), in a real browser (offline):
   1. Straight from the main menu (nothing walked yet), Basic mode: "Make a mission" offers "+ INSTANCE AN APARTMENT" on its steps page; the mission it makes has the
      apartment; the Mission Editor card shows "Apartments for this mission" with the apartment and "+ INSTANCE AN APARTMENT" (also in Advanced mode and from the pod).
   2. A two-mission tree (Admin offers each in person; talk to Iris): PLAY THIS DRAFT on mission 2 starts with mission 1 done; inside that session PLAY FROM THE START
      OF THIS TREE (mission 2's card) starts again with nothing of the tree started; talking to Admin offers mission 1, Iris completes it, then Admin offers mission 2.
   The real save is untouched; no page errors. Usage: node tests/serve-modern.cjs, then node tests/play-tree-start-browser.cjs (SITE_TEST_URL, SHOTS=dir,
   BROWSER_EXECUTABLE; default the bundled Chromium, software GL). */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',shots=process.env.SHOTS||null;if(shots)fs.mkdirSync(shots,{recursive:true});
const bundled=fs.existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':'/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',exe=process.env.BROWSER_EXECUTABLE||(fs.existsSync(bundled)?bundled:null);
const log=(...a)=>console.log('[play-tree-start]',...a);
const shot=async(page,name)=>{if(shots)await page.screenshot({path:path.join(shots,name),timeout:180000});};
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'],...(exe?{executablePath:exe}:{})});const errors=[];
 try{
  const ctx=await browser.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'}),page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));
  await page.route('**/api/**',r=>{const p=new URL(r.request().url()).pathname.replace('/api/void-runner/','');if(p==='live-content')return r.fulfill({status:404,contentType:'application/json',body:'{"error":"off"}'});return r.fulfill({status:503,contentType:'application/json',body:'{"error":"offline test"}'});});
  const boot=()=>page.waitForFunction(()=>globalThis.VoidStartup?.started,null,{timeout:180000});
  const dev=()=>page.evaluate(()=>VoidDevTools.identity(async p=>{if(p==='developer/balance')return {values:VoidBalance.defaults,revision:1,preset:'NORMAL'};const e=new Error('Switched off in this offline test');e.status=404;throw e;}));
  await page.goto(base+'/void-runner.html');await boot();
  await page.evaluate(()=>{const s=C.startDistrictCampaign(C.fresh());s.story.flags.podWakePending=false;localStorage.setItem('void-runner-campaign-v1',JSON.stringify({...s,savedAt:1700000000000}));localStorage.setItem('editor-tour-done','1');for(const k of ['editor-mode','mission-editor-drafts-v1'])localStorage.removeItem(k);});
  await page.reload();await boot();await dev();let before=await page.evaluate(()=>localStorage.getItem('void-runner-campaign-v1'));
  assert.equal(await page.evaluate(()=>mode),'menu','straight after load: the main menu, no street built');
  // ---- the wizard (Basic mode), with an apartment
  const make=async(title,withApt,tree)=>{await page.evaluate(async()=>{await VoidDevTools.loadEditor();VoidEditorHome.ui.view='home';VoidDevTools.tab='home';VoidDevTools.open();});await page.waitForSelector('[data-eh-task="make"]',{timeout:60000});await page.locator('[data-eh-task="make"]').click();
   await page.locator('[data-eh-template="talk"]').click();await page.waitForSelector('[data-eh-page="giver"]');await page.locator('[data-eh-giver="admin"]').click();await page.locator('[data-eh-next]').click();
   await page.waitForSelector('[data-eh-page="start"]');await page.locator('[data-eh-start="person"]').click();await page.locator('[data-eh-next]').click();
   await page.waitForSelector('[data-eh-page="steps"]');await page.locator('[data-eh-step-npc="0"]').selectOption('iris');
   if(withApt){const add=page.locator('[data-eh-apt-add]');await add.waitFor({timeout:30000});assert.ok(await add.isVisible(),'the wizard offers INSTANCE AN APARTMENT');await add.click();
    const door=await page.evaluate(()=>VoidApartments.doorsIn('oldtown')[0].id);await page.locator('[data-eh-apt-door]').selectOption(door);
    assert.equal(await page.locator('[data-eh-step-kind="1"]').inputValue(),'apt-enter','the step "Go into the mission’s apartment" was added');await shot(page,'01-wizard-apartment.png');}
   await page.locator('[data-eh-next]').click();await page.waitForSelector('[data-eh-page="reward"]');await page.locator('[data-eh-next]').click();
   await page.waitForSelector('[data-eh-page="name"]');await page.locator('[data-eh-title]').fill(title);await page.locator('[data-eh-description]').fill('TEST: '+title);await page.locator('[data-eh-offer]').fill('TEST LINE: Admin offers '+title+'.');
   if(tree)await page.locator('[data-eh-tree]').selectOption(tree);
   await page.locator('[data-eh-next]').click();await page.waitForSelector('[data-eh-done]');return page.locator('[data-eh-done]').getAttribute('data-eh-done');};
  const flat=await make('TEST: Flat job',true);log('made with an apartment',flat);
  const m=await page.evaluate(id=>JSON.parse(localStorage.getItem('mission-editor-drafts-v1')).trees.flatMap(t=>t.missions).find(x=>x.id===id),flat);
  assert.equal(m.apartments.length,1);assert.equal(m.objectives[1].kind,'apt-enter');assert.equal(m.objectives[1].apt,m.apartments[0].id);
  // ---- the Mission Editor card: the panel in Basic and Advanced mode, from the main menu and from the pod
  const panelCheck=async label=>{await page.evaluate(id=>{VoidDevTools.open('missions');const t=VoidMissionEditor.local().trees.find(t=>t.missions.some(m=>m.id===id));VoidMissionEditor.shared.goto({mode:'trees',tree:t.id,mission:'tree:'+id,scrollTo:true});VoidDevTools.render();},flat);
   const card=page.locator('[data-me-tree-mission="'+flat+'"]');await card.waitFor({timeout:60000});const panel=card.locator('[data-me-apt-panel]');await panel.waitFor({timeout:30000});
   assert.ok(await panel.isVisible(),label+': Apartments for this mission is visible');assert.ok(await card.locator('[data-me-apt-add]').isVisible(),label+': + INSTANCE AN APARTMENT is visible');
   assert.equal(await card.locator('[data-me-apt-door="'+m.apartments[0].id+'"]').inputValue(),m.apartments[0].door,label+': the wizard’s door is chosen');
   assert.equal(await card.locator('[data-me-apt-loading]').count(),0,label+': the doors are ready (no loading note)');return panel;};
  let panel=await panelCheck('main menu, Basic');await panel.scrollIntoViewIfNeeded();await shot(page,'02-panel-basic.png');
  await page.evaluate(()=>VoidDevTools.setMode('advanced'));await panelCheck('main menu, Advanced');await page.evaluate(()=>VoidDevTools.setMode('basic'));
  await page.evaluate(()=>{document.getElementById('dev-balance').hidden=true;});
  await page.evaluate(async()=>{const d=C.startDistrictCampaign(C.fresh());state=d;walkingLocation=walker=null;mode='menu';document.getElementById('screen')?.classList.add('hidden');state.location='earth';await enterWalking(VoidDistrictArea.KEY.interior,{silent:true,...VoidDistrictArea.resume(state,VoidNeoChinatown)});});
  assert.equal(await page.evaluate(()=>state.story.flags.podWakePending),true,'in the Sleeping Pod');await panelCheck('in the pod, Basic');
  // ---- a two-mission tree in "My missions" (a fresh draft)
  await page.evaluate(()=>{document.getElementById('dev-balance').hidden=true;});await page.reload();await boot();await dev();
  // (the pod check above walked a hand-made campaign outside a test session, which the game saved: the real save to protect is the one from here on)
  await page.evaluate(()=>localStorage.removeItem('mission-editor-drafts-v1'));await page.reload();await boot();await dev();before=await page.evaluate(()=>localStorage.getItem('void-runner-campaign-v1'));
  const m1=await make('TEST: First job',false);const m2=await make('TEST: Second job',false);
  const tree=await page.evaluate(([a,b])=>{const t=JSON.parse(localStorage.getItem('mission-editor-drafts-v1')).trees.find(t=>t.missions.some(m=>m.id===a));return {id:t.id,ids:t.missions.map(m=>m.id),b:t.missions.some(m=>m.id===b)};},[m1,m2]);
  assert.deepEqual(tree.ids,[m1,m2],'one tree, mission 1 then mission 2');log('tree',JSON.stringify(tree));
  await page.evaluate(()=>{try{VoidGraphics.quality='low';VoidBabylon.setQuality('low');}catch{}});
  await page.locator('[data-eh-open]').click();const card2=page.locator('[data-me-tree-mission="'+m2+'"]');await card2.waitFor({timeout:60000});
  assert.equal(await page.locator('[data-me-tree-start-row="'+tree.id+'"] [data-me-play-start]').count(),1,'the button is on the tree header');assert.equal(await page.locator('[data-me-play-start="'+tree.id+'"]').count(),3,'and beside each mission’s PLAY THIS DRAFT');
  const S=()=>page.evaluate(([a,b])=>({mode,banner:document.getElementById('dev-test-banner').hidden?null:document.getElementById('dev-test-banner').textContent,r1:state.universe.missions[a]||null,r2:state.universe.missions[b]||null,tracked:state.universe.trackedMission}),[m1,m2]);
  const started=()=>page.waitForFunction(()=>{const b=document.getElementById('dev-test-banner');return (b&&!b.hidden&&mode==='walking')||/needs|Fix these first|Cannot be played/.test(VoidMissionEditor.status||'');},null,{timeout:900000,polling:100});
  // PLAY THIS DRAFT on mission 2: mission 1 is done in that session
  await card2.locator('[data-me-play="tree:'+m2+'"]').click();await started();let s=await S();log('play mission 2',JSON.stringify(s));assert.equal(s.r1&&s.r1.completed,true,'PLAY THIS DRAFT on mission 2 starts with mission 1 done');
  // inside that session: PLAY FROM THE START OF THIS TREE (mission 2's card)
  await page.evaluate(()=>VoidDevTools.open('missions'));await card2.waitFor({timeout:60000});await card2.locator('[data-me-play-start="'+tree.id+'"]').scrollIntoViewIfNeeded();await shot(page,'03-buttons.png');
  await card2.locator('[data-me-play-start="'+tree.id+'"]').click();await started();s=await S();log('from the start',JSON.stringify(s));
  assert.match(s.banner,/PLAYING DRAFT TREE FROM THE START/);assert.equal(s.r1,null,'mission 1 not started');assert.equal(s.r2,null,'mission 2 not started');
  assert.equal(await page.evaluate(ids=>ids.some(id=>state.story.flags['mc_'+id]!==undefined||Object.keys(state.story.flags).some(k=>k.includes(id))),[m1,m2]),false,'no flag of the tree');await shot(page,'04-from-start.png');
  // as a player meets it: Admin offers mission 1, Iris completes it, then Admin offers mission 2
  const finish=()=>page.evaluate(()=>{let n=0;while(speech&&n++<60)advanceSpeech();try{resumeWalking();}catch{}});
  await page.evaluate(()=>VoidInteractions.handlers.get('district-iris')());await finish();s=await S();assert.equal(s.r1,null,'Iris has nothing before Admin offers it');
  await page.evaluate(()=>VoidInteractions.handlers.get('admin')());await page.waitForFunction(()=>!!speech,null,{timeout:10000});const said=await page.evaluate(()=>speech.lines.map(l=>l.text));assert.ok(said.includes('TEST LINE: Admin offers TEST: First job.'),said.join(' | '));
  await finish();await page.waitForFunction(id=>!!state.universe.missions[id]?.acquired,m1,{timeout:10000});s=await S();assert.equal(s.r2,null,'mission 2 waits');
  await page.evaluate(()=>VoidInteractions.handlers.get('district-iris')());await finish();await page.waitForFunction(id=>!!state.universe.missions[id]?.completed,m1,{timeout:10000});
  await page.evaluate(()=>VoidInteractions.handlers.get('admin')());await page.waitForFunction(()=>!!speech,null,{timeout:10000});const said2=await page.evaluate(()=>speech.lines.map(l=>l.text));assert.ok(said2.includes('TEST LINE: Admin offers TEST: Second job.'),said2.join(' | '));
  await finish();await page.waitForFunction(id=>!!state.universe.missions[id]?.acquired,m2,{timeout:10000});s=await S();log('after mission 1',JSON.stringify(s));await shot(page,'05-mission-2.png');
  await page.evaluate(()=>VoidInteractions.handlers.get('district-iris')());await finish();await page.waitForFunction(id=>!!state.universe.missions[id]?.completed,m2,{timeout:10000});
  await page.waitForTimeout(1200);assert.equal(await page.evaluate(()=>localStorage.getItem('void-runner-campaign-v1')),before,'the real save is untouched');
  await Promise.all([page.waitForNavigation({timeout:120000}),page.locator('#dev-test-banner button').dispatchEvent('click')]);await boot();
  assert.equal(await page.evaluate(()=>localStorage.getItem('void-runner-campaign-v1')),before,'the real save is untouched after LEAVE DRAFT');
  assert.deepEqual(errors,[],'no page errors');log('OK');
 }catch(e){console.error(e);console.error('page errors:',errors);process.exitCode=1;}finally{await browser.close();}
})();
