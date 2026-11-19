/* PLAY straight after typing (19 Nov 2026 fix), in a real browser (offline): the wizard makes a mission (Admin offers it, talk to Iris); its step's "What the player must
   do" is emptied, so Test my mission says it is not ready; OPEN TO FIX shows the card with PLAY THIS DRAFT greyed; typing the step's words and pressing PLAY THIS DRAFT at once
   (no pause for Guide me) starts the draft session, never "step 1 needs what the player must do". Then Test my mission > PLAY after another edit, and PLAY THIS DRAFT FROM
   HERE straight after typing, start too. The real save is untouched; no page errors. Usage: node tests/serve-modern.cjs, then node tests/play-stale-browser.cjs
   (SITE_TEST_URL, SHOTS=dir, BROWSER_EXECUTABLE; default the bundled Chromium, software GL). */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',shots=process.env.SHOTS||null;if(shots)fs.mkdirSync(shots,{recursive:true});
const bundled=fs.existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':'/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',exe=process.env.BROWSER_EXECUTABLE||(fs.existsSync(bundled)?bundled:null);
const log=(...a)=>console.log('[play-stale]',...a);
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
  await page.reload();await boot();await dev();const before=await page.evaluate(()=>localStorage.getItem('void-runner-campaign-v1'));
  // ---- the wizard: a plain mission (Admin offers it in person, talk to Iris)
  await page.evaluate(()=>VoidDevTools.open());await page.waitForSelector('[data-eh-task="make"]',{timeout:60000});await page.locator('[data-eh-task="make"]').click();
  await page.locator('[data-eh-template="talk"]').click();await page.waitForSelector('[data-eh-page="giver"]');await page.locator('[data-eh-giver="admin"]').click();await page.locator('[data-eh-next]').click();
  await page.waitForSelector('[data-eh-page="start"]');await page.locator('[data-eh-start="person"]').click();await page.locator('[data-eh-next]').click();
  await page.waitForSelector('[data-eh-page="steps"]');await page.locator('[data-eh-step-npc="0"]').selectOption('iris');await page.locator('[data-eh-next]').click();
  await page.waitForSelector('[data-eh-page="reward"]');await page.locator('[data-eh-next]').click();
  await page.waitForSelector('[data-eh-page="name"]');await page.locator('[data-eh-title]').fill('TEST: Play straight away');await page.locator('[data-eh-description]').fill('TEST: a stale check.');await page.locator('[data-eh-offer]').fill('TEST LINE: Admin has a job.');
  await page.locator('[data-eh-next]').click();await page.waitForSelector('[data-eh-done]');const mid=await page.locator('[data-eh-done]').getAttribute('data-eh-done');log('made',mid);
  // ---- empty the step's words in the stored draft, as if the owner had cleared the box earlier, and reload: the editor is built from that draft
  await page.evaluate(id=>{const d=JSON.parse(localStorage.getItem('mission-editor-drafts-v1'));const m=d.trees.flatMap(t=>t.missions).find(x=>x.id===id);m.objectives[0].label='';localStorage.setItem('mission-editor-drafts-v1',JSON.stringify(d));},mid);
  await page.reload();await boot();await dev();await page.evaluate(()=>{try{VoidGraphics.quality='low';VoidBabylon.setQuality('low');}catch{}});
  await page.evaluate(()=>VoidDevTools.open());await page.waitForSelector('[data-eh-task="test"]',{timeout:60000});await page.locator('[data-eh-task="test"]').click();
  const row=page.locator('[data-eh-test="'+mid+'"]');await row.waitFor();assert.match(await row.textContent(),/Not ready yet: step 1 needs/);
  await page.locator('[data-eh-fix="'+mid+'"]').click();const card=page.locator('[data-me-tree-mission="'+mid+'"]');await card.waitFor({timeout:60000});
  const playBtn=card.locator('[data-me-play="tree:'+mid+'"]');assert.equal(await playBtn.isDisabled(),true,'not ready: PLAY THIS DRAFT is greyed');
  const label=card.locator('[data-me-label]').first();await label.scrollIntoViewIfNeeded();await shot(page,'01-not-ready.png');
  // ---- type the step's words and press PLAY THIS DRAFT at once: the button is live on the keystroke, and play checks what was typed (before the fix: "step 1 needs ...")
  await label.click();await page.keyboard.type('Talk to Iris now',{delay:0});
  const at=await page.evaluate(()=>{const b=document.querySelector('[data-me-play^="tree:"]:not([data-me-play*="#"])');return {disabled:b.disabled,built:JSON.stringify(VoidMissionEditor.built.trees.flatMap(t=>t.missions||[]).length)};});
  assert.equal(at.disabled,false,'PLAY THIS DRAFT is live as soon as the step is filled in (no wait for Guide me)');
  await playBtn.click({timeout:2000});
  await page.waitForFunction(()=>{const b=document.getElementById('dev-test-banner');return (b&&!b.hidden&&mode==='walking')||/needs what the player must do|Fix these first|Cannot be played/.test(VoidMissionEditor.status||'');},null,{timeout:900000,polling:100});
  const st=await page.evaluate(()=>({status:VoidMissionEditor.status,banner:!document.getElementById('dev-test-banner').hidden}));log('after PLAY',JSON.stringify(st));
  assert.equal(st.banner,true,'the draft session started: '+st.status);
  const label1=await page.evaluate(id=>VoidMissions.definitions[id]?.objectives?.[0]?.label||null,mid);assert.equal(label1,'Talk to Iris now','the session plays what was typed');await shot(page,'02-playing.png');
  assert.equal(await page.evaluate(()=>localStorage.getItem('void-runner-campaign-v1')),before,'the real save is untouched');
  await Promise.all([page.waitForNavigation({timeout:120000}),page.locator('#dev-test-banner button').dispatchEvent('click')]);await boot();await dev();await card.waitFor({timeout:120000});
  // ---- PLAY THIS DRAFT FROM HERE straight after typing in the same step
  const label2=card.locator('[data-me-label]').first();await label2.click();await page.keyboard.press('End');await page.keyboard.type(' (again)',{delay:0});
  await card.locator('[data-me-play="tree:'+mid+'#'+(await label2.getAttribute('data-me-label'))+'"]').click({timeout:2000});
  await page.waitForFunction(()=>{const b=document.getElementById('dev-test-banner');return (b&&!b.hidden&&mode==='walking')||/needs|Fix these first|Cannot be played/.test(VoidMissionEditor.status||'');},null,{timeout:900000,polling:100});
  assert.equal(await page.evaluate(()=>!document.getElementById('dev-test-banner').hidden),true,'PLAY FROM HERE started: '+await page.evaluate(()=>VoidMissionEditor.status));
  assert.equal(await page.evaluate(id=>VoidMissions.definitions[id].objectives[0].label,mid),'Talk to Iris now (again)');
  await Promise.all([page.waitForNavigation({timeout:120000}),page.locator('#dev-test-banner button').dispatchEvent('click')]);await boot();await dev();await card.waitFor({timeout:120000});
  // ---- Test my mission > PLAY after an edit made in the editor (no redraw in between)
  const label3=card.locator('[data-me-label]').first();await label3.fill('Talk to Iris (third)');
  await page.evaluate(id=>VoidMissionEditor.shared.playTree(id),mid);
  await page.waitForFunction(()=>{const b=document.getElementById('dev-test-banner');return b&&!b.hidden&&mode==='walking';},null,{timeout:900000,polling:100});
  assert.equal(await page.evaluate(id=>VoidMissions.definitions[id].objectives[0].label,mid),'Talk to Iris (third)');
  assert.equal(await page.evaluate(()=>localStorage.getItem('void-runner-campaign-v1')),before,'the real save is untouched');
  assert.deepEqual(errors,[],'no page errors');log('OK');
 }catch(e){console.error(e);console.error('page errors:',errors);process.exitCode=1;}finally{await browser.close();}
})();
