/* Mission costs and ACCEPT / DENY (19 Nov 2026), in a real browser (offline): the "Make a mission" wizard makes a mission the player PAYS 100 credits for (Admin offers
   it, talk to Iris), asking ACCEPT / DENY; the Mission Editor shows "Player pays 100" and the question; PLAY IT NOW: the offer window shows the cost, DENY takes nothing and
   the offer comes back, ACCEPT takes exactly 100 credits once; a second session with 40 credits gets a greyed ACCEPT ("YOU NEED 100 CR") and nothing starts.
   The real save is untouched; no page errors. Usage: node tests/serve-modern.cjs, then node tests/mission-cost-browser.cjs (SITE_TEST_URL, SHOTS=dir, BROWSER_EXECUTABLE;
   default the bundled Chromium, software GL). */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',shots=process.env.SHOTS||null;if(shots)fs.mkdirSync(shots,{recursive:true});
const bundled=fs.existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':'/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',exe=process.env.BROWSER_EXECUTABLE||(fs.existsSync(bundled)?bundled:null);
const log=(...a)=>console.log('[mission-cost]',...a);
const shot=async(page,name)=>{if(shots)await page.screenshot({path:path.join(shots,name),timeout:180000});};
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'],...(exe?{executablePath:exe}:{})});const errors=[],posts=[];
 try{
  const ctx=await browser.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'}),page=await ctx.newPage().then(async p=>{await p.addInitScript(()=>{try{if(!localStorage.getItem('mission-editor-view'))localStorage.setItem('mission-editor-view','form');}catch{}});return p;});page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));
  await page.route('**/api/**',r=>{const p=new URL(r.request().url()).pathname.replace('/api/void-runner/','');if(r.request().method()==='POST')posts.push(p);if(p==='live-content')return r.fulfill({status:404,contentType:'application/json',body:'{"error":"off"}'});return r.fulfill({status:503,contentType:'application/json',body:'{"error":"offline test"}'});});
  const boot=()=>page.waitForFunction(()=>globalThis.VoidStartup?.started,null,{timeout:180000});
  const dev=()=>page.evaluate(()=>VoidDevTools.identity(async p=>{if(p==='developer/balance')return {values:VoidBalance.defaults,revision:1,preset:'NORMAL'};const e=new Error('Switched off in this offline test');e.status=404;throw e;}));
  await page.goto(base+'/void-runner.html');await boot();
  await page.evaluate(()=>{const s=C.startDistrictCampaign(C.fresh());s.story.flags.podWakePending=false;s.credits=500;localStorage.setItem('void-runner-campaign-v1',JSON.stringify({...s,savedAt:1700000000000}));localStorage.setItem('editor-tour-done','1');for(const k of ['editor-mode','mission-editor-drafts-v1'])localStorage.removeItem(k);});
  await page.reload();await boot();await dev();const before=await page.evaluate(()=>localStorage.getItem('void-runner-campaign-v1'));
  // ---- the wizard: Player pays 100, the question is forced on
  await page.evaluate(()=>VoidDevTools.open());await page.waitForSelector('[data-eh-task="make"]',{timeout:60000});await page.locator('[data-eh-task="make"]').click();
  await page.locator('[data-eh-template="talk"]').click();await page.waitForSelector('[data-eh-page="giver"]');await page.locator('[data-eh-giver="admin"]').click();await page.locator('[data-eh-next]').click();
  await page.waitForSelector('[data-eh-page="start"]');await page.locator('[data-eh-start="person"]').click();await page.locator('[data-eh-next]').click();
  await page.waitForSelector('[data-eh-page="steps"]');await page.locator('[data-eh-step-npc="0"]').selectOption('iris');await page.locator('[data-eh-next]').click();
  await page.waitForSelector('[data-eh-page="reward"]');assert.match(await page.locator('[data-eh-page="reward"] h3').textContent(),/get, or pay/);
  assert.equal(await page.locator('[data-eh-ask="no"]').isDisabled(),false,'a reward: the question is optional');
  await page.locator('[data-eh-dir="pays"]').click();await page.locator('[data-eh-reward="100"]').click();
  assert.equal(await page.locator('[data-eh-dir="pays"]').getAttribute('aria-checked'),'true');assert.equal(await page.locator('[data-eh-ask="yes"]').getAttribute('aria-checked'),'true');assert.equal(await page.locator('[data-eh-ask="no"]').isDisabled(),true,'paying: always asks');
  await shot(page,'01-wizard-pays.png');await page.locator('[data-eh-next]').click();
  await page.waitForSelector('[data-eh-page="name"]');assert.match(await page.locator('[data-eh-summary]').textContent(),/asks ACCEPT \/ DENY.*pays 100 credits when accepting/);
  await page.locator('[data-eh-title]').fill('TEST: A pass for 100');await page.locator('[data-eh-description]').fill('TEST: Admin sells a pass.');await page.locator('[data-eh-offer]').fill('TEST LINE: Admin offers a pass for a hundred.');
  await page.locator('[data-eh-next]').click();await page.waitForSelector('[data-eh-done]');const mid=await page.locator('[data-eh-done]').getAttribute('data-eh-done');log('made',mid);
  const made=await page.evaluate(id=>JSON.parse(localStorage.getItem('mission-editor-drafts-v1')).trees.flatMap(t=>t.missions).find(m=>m.id===id),mid);
  assert.deepEqual(made.cost,{amount:100,when:'accept'});assert.equal(made.rewards,0);assert.deepEqual(made.start,{how:'person',accept:true});
  // ---- the Mission Editor: "Player pays 100", the question (locked on), labels and DENY settings
  await page.locator('[data-eh-open="'+mid+'"]').click();const card=page.locator('[data-me-tree-mission="'+mid+'"]');await card.waitFor();
  assert.equal(await card.locator('[data-me-credits-dir]').inputValue(),'pays');assert.equal(await card.locator('[data-me-field="rewards"]').inputValue(),'100');assert.equal(await card.locator('[data-me-cost-when]').inputValue(),'accept');
  assert.equal(await card.locator('[data-me-ask-on]').isChecked(),true);assert.equal(await card.locator('[data-me-ask-on]').isDisabled(),true,'paying at ACCEPT: the question stays on');
  assert.equal(await card.locator('[data-me-ask-deny]').inputValue(),'again');assert.equal(await card.locator('[data-me-ask-yes]').getAttribute('placeholder'),'ACCEPT');
  await card.locator('[data-me-ask-on]').scrollIntoViewIfNeeded();await shot(page,'02-editor-pays-ask.png');
  // ---- PLAY IT: 150 credits; DENY takes nothing and the offer comes back; ACCEPT takes exactly 100, once
  await page.evaluate(()=>{try{VoidGraphics.quality='low';VoidBabylon.setQuality('low');}catch{}});
  const play=async credits=>{await page.locator('[data-me-play="tree:'+mid+'"]').click();await page.waitForFunction(()=>!document.getElementById('dev-test-banner').hidden&&mode==='walking',null,{timeout:900000,polling:100});await page.evaluate(c=>{state.credits=c;},credits);};
  const toLast=()=>page.evaluate(()=>{let n=0;while(speech&&(speech.index<speech.lines.length-1||speech.shown<speech.lines[speech.index].text.length)&&n++<40)advanceSpeech();return speech?{lines:speech.lines.map(l=>l.text),main:document.getElementById('speech-next')?.textContent,choices:[...document.querySelectorAll('[data-talk-choice]')].map(b=>({t:b.textContent,off:b.disabled})),offer:document.querySelector('[data-talk-offer]')?.textContent||'',need:document.querySelector('[data-talk-offer-need]')?.textContent||''}:null;});
  const S=()=>page.evaluate(id=>({mode,credits:state.credits,rec:state.universe.missions[id]||null,flag:state.story.flags['mc_'+id]}),mid);
  await play(150);
  await page.evaluate(()=>VoidInteractions.handlers.get('admin')());let d=await toLast();log('offer',JSON.stringify(d));
  assert.ok(d.lines.includes('TEST LINE: Admin offers a pass for a hundred.'));assert.equal(d.main,'ACCEPT');assert.deepEqual(d.choices,[{t:'DENY',off:false}]);assert.match(d.offer,/TEST: A pass for 100/);assert.match(d.offer,/COST 100 CR/);assert.match(d.offer,/Admin sells a pass/);
  await shot(page,'03-offer-cost.png');
  await page.locator('[data-talk-choice]').dispatchEvent('click');await page.waitForFunction(()=>mode==='walking'&&!speech);let s=await S();assert.equal(s.rec,null,'DENY takes nothing');assert.equal(s.credits,150);
  await page.evaluate(()=>VoidInteractions.handlers.get('admin')());d=await toLast();assert.equal(d.main,'ACCEPT','offered again after DENY');
  await page.locator('#speech-next').dispatchEvent('click');await page.waitForFunction(id=>!!state.universe.missions[id]?.acquired,mid);await page.waitForFunction(()=>mode==='walking');
  s=await S();log('after ACCEPT',JSON.stringify(s));assert.equal(s.credits,50,'exactly 100 credits taken');assert.equal(s.flag,100);
  await page.evaluate(()=>VoidInteractions.handlers.get('admin')());await page.waitForTimeout(300);await page.evaluate(()=>{try{resumeWalking();}catch{}});assert.equal((await S()).credits,50,'never charged twice');
  await page.evaluate(()=>VoidInteractions.handlers.get('district-iris')());s=await S();assert.equal(s.rec.completed,true,'talking to Iris completes it');assert.equal(s.credits,50,'nothing paid back at the end');await shot(page,'04-after-accept.png');
  await page.waitForTimeout(1200);assert.equal(await page.evaluate(()=>localStorage.getItem('void-runner-campaign-v1')),before,'the real save is untouched');
  await Promise.all([page.waitForNavigation({timeout:120000}),page.locator('#dev-test-banner button').dispatchEvent('click')]);await boot();await dev();await card.waitFor({timeout:120000});
  // ---- cannot afford: 40 credits; ACCEPT greyed with "YOU NEED 100 CR", DENY is the main button; nothing starts
  await play(40);await page.evaluate(()=>VoidInteractions.handlers.get('admin')());d=await toLast();log('short',JSON.stringify(d));
  assert.equal(d.main,'DENY');assert.deepEqual(d.choices,[{t:'ACCEPT · YOU NEED 100 CR',off:true}]);assert.match(d.need,/You need 100 CR/);await shot(page,'05-cannot-afford.png');
  await page.locator('[data-talk-choice]').dispatchEvent('click');await page.waitForTimeout(300);s=await S();assert.equal(s.rec,null,'nothing starts');assert.equal(s.credits,40,'credits unchanged');
  assert.equal(await page.evaluate(()=>localStorage.getItem('void-runner-campaign-v1')),before,'the real save is untouched');assert(!posts.some(p=>p==='save'||p.endsWith('/save')),'no cloud save');
  assert.deepEqual(errors,[],'no page errors');log('OK');
 }catch(e){console.error(e);console.error('page errors:',errors);process.exitCode=1;}finally{await browser.close();}
})();
