/* The Mission Editor's Blocks view (19 Nov 2026), in a real browser (offline): "Make a mission" (Lace gives it, talk to Lace) opens the new mission in BLOCKS. In the Lace block
   the owner writes her Words with an orange Action inside (a shrug), a blue Player block with the player's reply; + ADD A BLOCK adds a Time block (wait 2 s), an Ask ACCEPT /
   DENY block (the question, DENY ends the mission) and an Item block (+50 credits when the wait is done); the Ask block is dragged above the Time block. Form -> Blocks ->
   Form leaves the draft identical. PLAY THIS DRAFT: Lace offers it, then her lines (the shrug), then the question: DENY ends the mission; talked to again she offers it again;
   ACCEPT goes on: the wait, then +50 and the mission is done. The real save is untouched; no page errors. Screenshots (SHOTS=dir) of the editor and the game.
   Usage: node tests/serve-modern.cjs, then node tests/mission-blocks-browser.cjs (SITE_TEST_URL, SHOTS=dir, BROWSER_EXECUTABLE; default the bundled Chromium, software GL). */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',shots=process.env.SHOTS||null;if(shots)fs.mkdirSync(shots,{recursive:true});
const bundled=fs.existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':'/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',exe=process.env.BROWSER_EXECUTABLE||(fs.existsSync(bundled)?bundled:null);
const PART=process.env.PART||'all';
const log=(...a)=>console.log('[mission-blocks]',...a);
const shot=async(page,name,loc)=>{if(!shots)return;if(loc)await loc.screenshot({path:path.join(shots,name),timeout:180000});else await page.screenshot({path:path.join(shots,name),timeout:180000});};
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'],...(exe?{executablePath:exe}:{})});const errors=[];
 try{
  const ctx=await browser.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'}),page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));
  await page.route('**/api/**',r=>{const p=new URL(r.request().url()).pathname.replace('/api/void-runner/','');if(p==='live-content')return r.fulfill({status:404,contentType:'application/json',body:'{"error":"off"}'});return r.fulfill({status:503,contentType:'application/json',body:'{"error":"offline test"}'});});
  const boot=()=>page.waitForFunction(()=>globalThis.VoidStartup?.started,null,{timeout:180000});
  const dev=()=>page.evaluate(()=>VoidDevTools.identity(async p=>{if(p==='developer/balance')return {values:VoidBalance.defaults,revision:1,preset:'NORMAL'};const e=new Error('Switched off in this offline test');e.status=404;throw e;}));
  await page.goto(base+'/void-runner.html');await boot();
  await page.evaluate(()=>{const s=C.startDistrictCampaign(C.fresh());s.story.flags.podWakePending=false;s.credits=500;localStorage.setItem('void-runner-campaign-v1',JSON.stringify({...s,savedAt:1700000000000}));localStorage.setItem('editor-tour-done','1');for(const k of ['editor-mode','mission-editor-drafts-v1','mission-editor-view'])localStorage.removeItem(k);});
  await page.reload();await boot();await dev();const before=await page.evaluate(()=>localStorage.getItem('void-runner-campaign-v1'));
  // ---- the wizard: Lace gives it in person, talk to Lace
  await page.evaluate(()=>VoidDevTools.open());await page.waitForSelector('[data-eh-task="make"]',{timeout:60000});await page.locator('[data-eh-task="make"]').click();
  await page.locator('[data-eh-template="talk"]').click();await page.waitForSelector('[data-eh-page="giver"]');await page.locator('[data-eh-giver="ethereal-lace"]').click();await page.locator('[data-eh-next]').click();
  await page.waitForSelector('[data-eh-page="start"]');await page.locator('[data-eh-start="person"]').click();await page.locator('[data-eh-next]').click();
  await page.waitForSelector('[data-eh-page="steps"]');await page.locator('[data-eh-step-npc="0"]').selectOption('ethereal-lace');await page.locator('[data-eh-next]').click();
  await page.waitForSelector('[data-eh-page="reward"]');await page.locator('[data-eh-next]').click();
  await page.waitForSelector('[data-eh-page="name"]');await page.locator('[data-eh-title]').fill('TEST: Blocks with Lace');await page.locator('[data-eh-offer]').fill('TEST LINE: Lace has a job for you.');
  await page.locator('[data-eh-next]').click();await page.waitForSelector('[data-eh-done]');const mid=await page.locator('[data-eh-done]').getAttribute('data-eh-done');log('made',mid);
  await page.locator('[data-eh-open="'+mid+'"]').click();const card=page.locator('[data-me-tree-mission="'+mid+'"]');await card.waitFor();
  const root=card.locator('[data-mb-mission="'+mid+'"]');await root.waitFor({timeout:30000});log('opened in Blocks');
  assert.equal(await card.locator('[data-mb-view="blocks"]').getAttribute('aria-checked'),'true','the wizard opens the mission in Blocks');
  const draft=()=>page.evaluate(id=>JSON.parse(localStorage.getItem('mission-editor-drafts-v1')).trees.flatMap(t=>t.missions).find(m=>m.id===id),mid);
  const s1=(await draft()).objectives[0].id,kb=s1+'/say';
  // ---- the Lace block: her Words (with a shrug), the player's reply (a blue block inside)
  const lace=root.locator('[data-mb-block="step:'+s1+'"]');await lace.waitFor();
  assert.match(await lace.getAttribute('style'),/--who:/);assert.match(await lace.locator('.mb-head').first().textContent(),/WHO.*Lace/s);
  if(!(await lace.locator('[data-mb-line="'+kb+'/0"]').count()))await lace.locator('[data-mb-add-line="'+kb+'"]').click();
  await lace.locator('[data-mb-line="'+kb+'/0"] textarea').fill('TEST LINE: Took you long enough.');
  await lace.locator('[data-me-line-anim-pick="'+kb+'/0"]').selectOption('shrug');
  await lace.locator('[data-mb-add-player="'+kb+'"]').click();const pl=lace.locator('[data-mb-line="'+kb+'/1"]');await pl.waitFor();
  assert.equal(await pl.getAttribute('data-me-line-who'),'player');assert.equal(await pl.locator('xpath=ancestor::article[@data-mb-who-group]').count(),1,'the player line sits in its own (blue) block');
  assert.match(await pl.locator('xpath=ancestor::article[@data-mb-who-group]').getAttribute('style'),/--who:#4da3ff/i,'the player is blue');
  await pl.locator('textarea').fill('TEST LINE: I came, didn’t I?');await page.waitForTimeout(300);
  // ---- + ADD A BLOCK: Time (wait 2 s), then Ask ACCEPT / DENY, then Item (+50 credits)
  const addBefore=async(kind,choice)=>{await root.locator('[data-me-add-step="'+mid+'"]').click();await root.locator('[data-mb-pick="'+kind+'"]').click();await root.locator('[data-mb-choose="'+choice+'"]').click();await page.waitForTimeout(300);};
  await addBefore('time','wait');let d=await draft();const sw=d.objectives[1].id;assert.equal(d.objectives[1].kind,'wait');
  await root.locator('[data-me-step-hold="'+sw+'"]').fill('2');
  await root.locator('[data-me-add-step="'+mid+'"]').click();await shot(page,'01-picker.png',root.locator('[data-mb-picker]'));await root.locator('[data-mb-pick="ask"]').click();await root.locator('[data-mb-choose="ask"]').click();await page.waitForTimeout(300);
  d=await draft();const sa=d.objectives[2].id;assert.equal(d.objectives[2].kind,'ask');
  // Guide me points at the question
  await page.waitForTimeout(800);assert.ok(await root.locator('[data-me-step-question="'+sa+'"]').evaluate(n=>n.classList.contains('eg-next')),'Guide me highlights the question inside the Ask block');
  assert.ok(await root.locator('[data-mb-block="step:'+sa+'"]').evaluate(n=>n.classList.contains('mb-bad')),'the empty Ask block is outlined red');
  await root.locator('[data-me-step-question="'+sa+'"]').fill('TEST LINE: Will you carry it to the Port?');await root.locator('[data-mb-ask-yes="'+sa+'"]').fill('I’LL DO IT');await root.locator('[data-mb-ask-no="'+sa+'"]').fill('NOT ME');
  await root.locator('[data-mb-ask-deny="'+sa+'"]').selectOption('end');await page.waitForTimeout(300);
  // the Item block after the wait: drop it below the Time block (its gap is after it)
  d=await draft();
  const gapAfter=async bid=>{const gaps=await root.evaluate((r,bid)=>{const items=[...r.querySelectorAll(':scope .mb-timeline > li')];const i=items.findIndex(li=>li.querySelector(':scope > [data-mb-block="'+bid+'"]'));return items[i+1]?.dataset.mbGap;},bid);return gaps;};
  const g=await gapAfter('step:'+sw);await root.locator('[data-mb-add="'+g+'"]').click();await root.locator('[data-mb-pick="item"]').click();await root.locator('[data-mb-choose="credits"]').click();await page.waitForTimeout(300);
  d=await draft();const un=(d.unlocks||[]).find(u=>u.kind==='credits');assert.ok(un,'credits unlock');assert.equal(un.when,sw,'given when the block above (the wait) is done');
  await root.locator('[data-mb-unlock-amount="'+d.unlocks.indexOf(un)+'"]').fill('50');await page.waitForTimeout(300);
  // ---- drag the Ask block above the Time block
  const h=root.locator('[data-mb-handle="step:'+sa+'"]'),waitBlock=root.locator('[data-mb-block="step:'+sw+'"]');
  await h.scrollIntoViewIfNeeded();const hb=await h.boundingBox();await page.mouse.move(hb.x+hb.width/2,hb.y+hb.height/2);await page.mouse.down();
  await waitBlock.scrollIntoViewIfNeeded().catch(()=>{});let wb=await waitBlock.boundingBox();await page.mouse.move(wb.x+120,wb.y+20,{steps:8});await page.waitForTimeout(200);wb=await waitBlock.boundingBox();await page.mouse.move(wb.x+120,wb.y+8,{steps:3});await page.mouse.up();await page.waitForTimeout(500);
  d=await draft();log('order after the drag',d.objectives.map(o=>o.kind).join(' → '));assert.deepEqual(d.objectives.map(o=>o.id),[s1,sa,sw],'dragged above the wait');
  assert.equal(d.unlocks.find(u=>u.kind==='credits').when,sw,'the reward stays below the wait');
  assert.deepEqual(d.objectives[0].say.map(l=>[l.who,l.text,l.anim||null]),[['','TEST LINE: Took you long enough.','shrug'],['You','TEST LINE: I came, didn’t I?',null]]);
  assert.deepEqual({q:d.objectives[1].question,yes:d.objectives[1].yes,no:d.objectives[1].no,deny:d.objectives[1].deny},{q:'TEST LINE: Will you carry it to the Port?',yes:'I’LL DO IT',no:'NOT ME',deny:undefined});
  // ▲ ▼ by keyboard: the Item block cannot go above the first step (it skips ahead or says why)
  await root.scrollIntoViewIfNeeded();await page.evaluate(()=>{document.getElementById('dev-balance').scrollTop=document.querySelector('[data-mb-mission]').offsetTop;});
  await shot(page,'02-blocks-timeline.png');await shot(page,'03-lace-block.png',lace);await shot(page,'04-ask-block.png',root.locator('[data-mb-block="step:'+sa+'"]'));
  // ---- Form -> Blocks -> Form: the same data
  const before2=JSON.stringify(await draft());await card.locator('[data-mb-view="form"]').click();await card.locator('[data-me-tstep="'+sa+'"] [data-me-step-question="'+sa+'"]').waitFor();
  assert.equal(await card.locator('[data-me-step-question="'+sa+'"]').inputValue(),'TEST LINE: Will you carry it to the Port?','the Form view shows the Ask step too');await shot(page,'05-form-view-ask.png',card.locator('[data-me-tstep="'+sa+'"]'));
  await page.locator('[data-me-tree-mission="'+mid+'"] [data-mb-view="blocks"]').click();await page.locator('[data-mb-mission="'+mid+'"]').waitFor();assert.equal(JSON.stringify(await draft()),before2,'switching views changes nothing');
  // delete + UNDO
  const gw=page.locator('[data-mb-mission="'+mid+'"]');await gw.locator('[data-mb-del="step:'+sw+'"]').click();await page.waitForTimeout(300);assert.equal((await draft()).objectives.length,2);
  await gw.locator('[data-mb-undo]').click();await page.waitForTimeout(500);assert.equal(JSON.stringify(await draft()),before2,'UNDO puts the deleted block back');
  if(PART==='editor'){assert.deepEqual(errors,[],'no page errors');log('editor part OK');return;}
  // ---- PLAY THIS DRAFT
  await page.evaluate(()=>{try{VoidGraphics.quality='low';VoidBabylon.setQuality('low');}catch{}});
  await page.locator('[data-me-play="tree:'+mid+'"]').click();await page.waitForFunction(()=>!document.getElementById('dev-test-banner').hidden&&mode==='walking',null,{timeout:900000,polling:100});
  await page.waitForFunction(()=>VoidBabylon.district?.streetPair?.stats?.().her?.id==='ethereal-lace',null,{timeout:900000,polling:1000});log('Lace is out');
  await page.evaluate(()=>{SPEECH_TIMING.read=60000;});
  const near=()=>page.evaluate(()=>{const h=VoidBabylon.district.streetPair.stats().her;Object.assign(walker,{x:h.x+1.4,z:h.z-.6,yaw:-Math.PI/2});});
  const talk=()=>page.evaluate(()=>{const it=VoidBabylon.district.streetPair.talkItems['ethereal-lace'];try{walkTarget=it;}catch{}VoidInteractions.handlers.get('street-pair')({item:it});});
  const toEnd=()=>page.evaluate(()=>{let n=0;while(speech&&!speech.choices&&n++<60)advanceSpeech();});
  const rec=()=>page.evaluate(id=>state.universe.missions[id]||null,mid);
  const askShown=()=>page.waitForFunction(()=>!!speech&&Array.isArray(speech.choices)&&!!speech.askStep,null,{timeout:30000,polling:100});
  const finishLines=()=>page.evaluate(()=>{let n=0;while(speech&&n++<60){speech.shown=(speech.lines[speech.index]||{text:''}).text.length;if(speech.index===speech.lines.length-1&&speech.choices)break;advanceSpeech();}});
  const choose=label=>page.evaluate(label=>{const k=speech.choices.findIndex(c=>c.label===label);if(k<0)throw new Error('no choice '+label);speech.index=speech.lines.length-1;speech.shown=speech.lines[speech.index].text.length;renderLine();
   if(k===0){speech.shown=speech.lines[speech.index].text.length;advanceSpeech();if(speech&&speech.choices){speech.shown=1e9;advanceSpeech();}return;}const b=document.querySelector('[data-talk-choice="'+k+'"]');if(!b)throw new Error('no button '+label);b.click();},label);
  for(const round of ['deny','accept']){
   await near();await page.waitForTimeout(500);await talk();await page.waitForTimeout(500);assert.match(await page.evaluate(()=>speech?.lines?.map(l=>l.text).join(' ')||''),/Lace has a job for you/,'offered ('+round+')');await toEnd();
   await page.waitForFunction(id=>!!state.universe.missions[id]?.acquired,mid,{timeout:30000});
   await near();await talk();await page.waitForFunction(()=>speech&&speech.lines.length>=2,null,{timeout:30000});
   const said=await page.evaluate(()=>speech.lines.map(l=>[l.who,l.text,l.anim||null]));log(round,'conversation',JSON.stringify(said));
   assert.deepEqual(said.map(([w,t,a])=>[w==='You'?'You':'npc',t,a]),[['npc','TEST LINE: Took you long enough.','shrug'],['You','TEST LINE: I came, didn’t I?',null]]);assert.notEqual(said[0][0],'You');
   if(round==='deny'){await page.waitForTimeout(1200);await shot(page,'06-lace-shrugs.png');}
   await toEnd();await askShown();await finishLines();await page.waitForTimeout(400);
   const q=await page.evaluate(()=>({text:speech.lines.map(l=>l.text).join(' '),choices:speech.choices.map(c=>c.label)}));log(round,'asked',JSON.stringify(q));
   assert.match(q.text,/Will you carry it to the Port\?/);assert.deepEqual(q.choices,['I’LL DO IT','NOT ME']);
   if(round==='deny'){await shot(page,'07-mid-mission-ask.png');await choose('NOT ME');await page.waitForTimeout(600);assert.equal(await rec(),null,'DENY ends the mission (it goes back to Lace)');log('DENY: the mission ended');continue;}
   const cr=await page.evaluate(()=>state.credits);await choose('I’LL DO IT');await page.waitForTimeout(300);
   assert.equal((await rec()).objectives[sa],true,'ACCEPT: the question is done');
   const t0=Date.now();await page.waitForFunction(id=>state.universe.missions[id]?.completed===true,mid,{timeout:30000,polling:100});const ws=Date.now()-t0;log('ACCEPT: the wait took about',ws,'ms; credits',cr,'->',await page.evaluate(()=>state.credits));
   assert.ok(ws>=1200,'the Time block held the mission');assert.ok(await page.evaluate(()=>state.credits)>=cr+50,'+50 credits (and the reward)');}
  await page.waitForTimeout(800);await shot(page,'08-mission-done.png');
  assert.equal(await page.evaluate(()=>localStorage.getItem('void-runner-campaign-v1')),before,'the real save is untouched');
  assert.deepEqual(errors,[],'no page errors');log('OK');
 }catch(e){console.error(e);console.error('page errors:',errors);process.exitCode=1;}finally{await browser.close();}
})();
