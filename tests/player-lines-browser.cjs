/* Player lines and animations in the Mission Editor (19 Nov 2026), in a real browser (offline): the wizard makes a mission (Admin offers it, talk to Iris); in step 1's
   "What is said" the owner writes Iris's line, + ADD A PLAYER LINE (the player's reply), + ADD A LINE FOR IRIS with "While saying this, Iris does: Shrug"; + STEP adds an
   animation step (Iris looks about, the mission waits 1 second). PLAY THIS DRAFT: Admin's offer, then Iris: the exchange shows in order (Iris, You, Iris), Iris's figure
   plays the shrug on her line; after the conversation the animation step plays "look" and completes the mission. The real save is untouched; no page errors.
   Usage: node tests/serve-modern.cjs, then node tests/player-lines-browser.cjs (SITE_TEST_URL, SHOTS=dir, BROWSER_EXECUTABLE; default the bundled Chromium, software GL). */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',shots=process.env.SHOTS||null;if(shots)fs.mkdirSync(shots,{recursive:true});
const bundled=fs.existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':'/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',exe=process.env.BROWSER_EXECUTABLE||(fs.existsSync(bundled)?bundled:null);
const log=(...a)=>console.log('[player-lines]',...a);
const shot=async(page,name)=>{if(shots)await page.screenshot({path:path.join(shots,name),timeout:180000});};
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'],...(exe?{executablePath:exe}:{})});const errors=[];
 try{
  const ctx=await browser.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'}),page=await ctx.newPage().then(async p=>{await p.addInitScript(()=>{try{if(!localStorage.getItem('mission-editor-view'))localStorage.setItem('mission-editor-view','form');}catch{}});return p;});page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));
  await page.route('**/api/**',r=>{const p=new URL(r.request().url()).pathname.replace('/api/void-runner/','');if(p==='live-content')return r.fulfill({status:404,contentType:'application/json',body:'{"error":"off"}'});return r.fulfill({status:503,contentType:'application/json',body:'{"error":"offline test"}'});});
  const boot=()=>page.waitForFunction(()=>globalThis.VoidStartup?.started,null,{timeout:180000});
  const dev=()=>page.evaluate(()=>VoidDevTools.identity(async p=>{if(p==='developer/balance')return {values:VoidBalance.defaults,revision:1,preset:'NORMAL'};const e=new Error('Switched off in this offline test');e.status=404;throw e;}));
  await page.goto(base+'/void-runner.html');await boot();
  await page.evaluate(()=>{const s=C.startDistrictCampaign(C.fresh());s.story.flags.podWakePending=false;localStorage.setItem('void-runner-campaign-v1',JSON.stringify({...s,savedAt:1700000000000}));localStorage.setItem('editor-tour-done','1');for(const k of ['editor-mode','mission-editor-drafts-v1'])localStorage.removeItem(k);});
  await page.reload();await boot();await dev();const before=await page.evaluate(()=>localStorage.getItem('void-runner-campaign-v1'));
  // ---- the wizard: Admin offers it in person, talk to Iris
  await page.evaluate(()=>VoidDevTools.open());await page.waitForSelector('[data-eh-task="make"]',{timeout:60000});await page.locator('[data-eh-task="make"]').click();
  await page.locator('[data-eh-template="talk"]').click();await page.waitForSelector('[data-eh-page="giver"]');await page.locator('[data-eh-giver="admin"]').click();await page.locator('[data-eh-next]').click();
  await page.waitForSelector('[data-eh-page="start"]');await page.locator('[data-eh-start="person"]').click();await page.locator('[data-eh-next]').click();
  await page.waitForSelector('[data-eh-page="steps"]');await page.locator('[data-eh-step-npc="0"]').selectOption('iris');await page.locator('[data-eh-next]').click();
  await page.waitForSelector('[data-eh-page="reward"]');await page.locator('[data-eh-next]').click();
  await page.waitForSelector('[data-eh-page="name"]');await page.locator('[data-eh-title]').fill('TEST: A word with Iris');await page.locator('[data-eh-description]').fill('TEST: lines and animations.');await page.locator('[data-eh-offer]').fill('TEST LINE: Admin says go and see Iris.');
  await page.locator('[data-eh-next]').click();await page.waitForSelector('[data-eh-done]');const mid=await page.locator('[data-eh-done]').getAttribute('data-eh-done');log('made',mid);
  await page.locator('[data-eh-open="'+mid+'"]').click();const card=page.locator('[data-me-tree-mission="'+mid+'"]');await card.waitFor();
  const sid=await card.locator('[data-me-tstep]').first().getAttribute('data-me-tstep'),kb=sid+'/say',box=()=>card.locator('[data-me-lines="'+kb+'"]');
  // ---- the NPC's line (the wizard leaves one empty line, or none), then the player's line, then the NPC again with a shrug
  if(!(await box().locator('[data-me-tline]').count()))await box().locator('[data-me-add-npc-line="'+kb+'"]').click();
  await box().locator('[data-me-tline="'+kb+'/0"] textarea').fill('TEST LINE: You again.');
  assert.match(await box().locator('[data-me-add-npc-line="'+kb+'"]').textContent(),/\+ ADD A LINE FOR IRIS/);
  await box().locator('[data-me-add-player-line="'+kb+'"]').click();const pl=box().locator('[data-me-tline="'+kb+'/1"]');await pl.waitFor();
  assert.equal(await pl.getAttribute('data-me-line-who'),'player');assert.equal(await pl.locator('select').first().inputValue(),'You');assert.equal(await pl.locator('[data-me-import]').count(),0,'no voice import for the player');assert.equal(await pl.locator('[data-me-line-anim]').count(),0,'no animation for the player');
  await pl.locator('textarea').fill('TEST LINE: Admin sent me.');
  // mission timers: the player's reply comes 3 seconds after Iris's first line
  await pl.locator('[data-me-line-time] summary').click();await pl.locator('[data-me-line-wait="'+kb+'/1"]').fill('3');assert.match(await pl.locator('[data-me-line-time] summary').textContent(),/waits 3 seconds before/);assert.match(await pl.locator('[data-me-line-state]').textContent(),/player’s line/,'the chip follows the typing');
  await box().locator('[data-me-add-npc-line="'+kb+'"]').click();const nl=box().locator('[data-me-tline="'+kb+'/2"]');await nl.waitFor();await nl.locator('textarea').fill('TEST LINE: Of course he did.');
  const pick=nl.locator('[data-me-line-anim-pick]');const opts=await pick.evaluate(s=>[...s.options].map(o=>o.value));log('Iris can do',opts.join(','));assert.ok(opts.includes('shrug')&&!opts.some(o=>/walk|^sit/.test(o)));
  await pick.selectOption('shrug');
  // ---- an animation step after the talk: Iris looks about, the mission waits 1 second
  await card.locator('[data-me-add-step="'+mid+'"]').click();const st2=card.locator('[data-me-tstep]').nth(1),s2=await st2.getAttribute('data-me-tstep');
  await st2.locator('[data-me-kind="'+s2+'"]').selectOption('anim');await card.locator('[data-me-tstep="'+s2+'"] [data-me-step-npc="'+s2+'"]').selectOption('iris');
  await card.locator('[data-me-step-clip="'+s2+'"]').selectOption('look');await card.locator('[data-me-step-hold="'+s2+'"]').fill('1');
  // a Wait step of 2 seconds after it
  await card.locator('[data-me-add-step="'+mid+'"]').click();const st3=card.locator('[data-me-tstep]').nth(2),s3=await st3.getAttribute('data-me-tstep');
  await st3.locator('[data-me-kind="'+s3+'"]').selectOption('wait');await card.locator('[data-me-step-hold="'+s3+'"]').fill('2');assert.match(await card.locator('[data-me-wait-words="'+s3+'"]').textContent(),/waits 2 seconds/);
  const draft=await page.evaluate(id=>JSON.parse(localStorage.getItem('mission-editor-drafts-v1')).trees.flatMap(t=>t.missions).find(m=>m.id===id),mid);
  assert.deepEqual(draft.objectives[0].say.map(l=>[l.who,l.text,l.anim||null]),[['','TEST LINE: You again.',null],['You','TEST LINE: Admin sent me.',null],['','TEST LINE: Of course he did.','shrug']]);
  assert.equal(draft.objectives[0].say[1].wait,3);assert.deepEqual({kind:draft.objectives[2].kind,hold:draft.objectives[2].hold},{kind:'wait',hold:2});
  assert.deepEqual({kind:draft.objectives[1].kind,npc:draft.objectives[1].npc,clip:draft.objectives[1].clip,hold:draft.objectives[1].hold},{kind:'anim',npc:'iris',clip:'look',hold:1});
  await box().scrollIntoViewIfNeeded();await shot(page,'01-editor-lines.png');await card.locator('[data-me-tstep="'+s2+'"]').scrollIntoViewIfNeeded();await shot(page,'02-editor-anim-step.png');
  // ---- PLAY THIS DRAFT
  await page.evaluate(()=>{try{VoidGraphics.quality='low';VoidBabylon.setQuality('low');}catch{}});
  await card.locator('[data-me-play="tree:'+mid+'"]').click();await page.waitForFunction(()=>!document.getElementById('dev-test-banner').hidden&&mode==='walking',null,{timeout:900000,polling:100});
  const toEnd=()=>page.evaluate(()=>{let n=0;while(speech&&n++<60)advanceSpeech();});
  await page.evaluate(()=>VoidInteractions.handlers.get('admin')());await toEnd();await page.waitForFunction(id=>!!state.universe.missions[id]?.acquired,mid,{timeout:30000});
  // stand in front of Iris so the shots show her (her own model must have loaded)
  await page.waitForFunction(()=>!!VoidNPCGestures.figure('iris'),null,{timeout:180000,polling:500});
  await page.evaluate(()=>{const c=VoidNPCGestures.figure('iris'),p=c.node.getAbsolutePosition();walker.x=p.x;walker.z=p.z-2.6;walker.yaw=0;});await page.waitForTimeout(1500);
  await page.evaluate(()=>{SPEECH_TIMING.read=60000;});await page.evaluate(()=>VoidInteractions.handlers.get('district-iris')());await page.waitForFunction(()=>speech&&speech.lines.length===3,null,{timeout:30000});
  const said=await page.evaluate(()=>speech.lines.map(l=>[l.who,l.text,l.anim||null]));log('conversation',JSON.stringify(said));
  assert.deepEqual(said,[['Iris','TEST LINE: You again.',null],['You','TEST LINE: Admin sent me.',null],['Iris','TEST LINE: Of course he did.','shrug']]);
  const held=await page.evaluate(()=>{speech.shown=speech.lines[0].text.length;advanceSpeech();window.__t0=performance.now();const iv=setInterval(()=>{if(speech&&!speech.waiting&&speech.lines[1]?.text==='TEST LINE: Admin sent me.'){window.__t1=performance.now();clearInterval(iv);}},20);const a={idx:speech.index,text:document.getElementById('spoken-text').textContent};advanceSpeech();a.after=speech.index;return a;});
  log('during the wait',JSON.stringify(held));assert.deepEqual(held,{idx:1,text:'…',after:1},'"…" shows and CONTINUE cannot skip the wait');await shot(page,'03a-waiting.png');
  // the 3-second wait (page time): then the player's line appears
  await page.waitForFunction(()=>{return !!window.__t1;},null,{timeout:30000,polling:20});
  const waited=await page.evaluate(()=>Math.round(window.__t1-window.__t0));log('waited',waited,'ms');assert.ok(waited>=2800&&waited<12000,'3 seconds (software GL runs its timers only every second or so while a screenshot renders): '+waited);await page.waitForTimeout(400);
  assert.equal(await page.evaluate(()=>document.querySelector('.speaker h2')?.textContent),'You','the player speaks the second line');await shot(page,'03-player-line.png');
  await page.evaluate(()=>{if(speech.index===1){speech.shown=speech.lines[1].text.length;advanceSpeech();}});await page.waitForFunction(()=>VoidNPCGestures.log.some(x=>x.id==='iris'&&x.clip==='shrug'),null,{timeout:15000,polling:50});
  await page.waitForTimeout(700);await shot(page,'04-iris-shrugs.png');
  const lg=await page.evaluate(()=>VoidNPCGestures.log);assert.ok(lg.some(x=>x.id==='iris'&&x.clip==='shrug'&&x.found),JSON.stringify(lg));
  const thread=await page.evaluate(()=>[...document.querySelectorAll('.conversation-thread .social-message b')].map(b=>b.textContent));log('thread',thread.join(','));assert.ok(thread.includes('You'),'the player line is kept in Iris’s conversation thread');
  await toEnd();
  // ---- the animation step: Iris looks about, then (1 s later) the mission is done
  await page.waitForFunction(()=>VoidNPCGestures.log.some(x=>x.id==='iris'&&x.clip==='look'),null,{timeout:15000,polling:50});await page.waitForTimeout(300);await shot(page,'05-anim-step.png');
  // then the Wait step (2 s) and the mission is done
  await page.waitForFunction(id=>state.universe.missions[id]?.objectives?.[Object.keys(state.universe.missions[id].objectives||{})[1]]===true||false,mid,{timeout:15000,polling:100}).catch(()=>{});
  const tw=Date.now();await page.waitForFunction(id=>state.universe.missions[id]?.completed===true,mid,{timeout:20000,polling:100});const ws=Date.now()-tw;log('wait step took about',ws,'ms');
  assert.ok(ws>=1200,'the Wait step held the mission: '+ws);log('mission completed after the animation and wait steps');
  await page.waitForTimeout(3500);assert.equal(await page.evaluate(()=>VoidNPCGestures.figure('iris').performing),null,'back to her own behaviour');
  assert.equal(await page.evaluate(()=>localStorage.getItem('void-runner-campaign-v1')),before,'the real save is untouched');
  assert.deepEqual(errors,[],'no page errors');log('OK');
 }catch(e){console.error(e);console.error('page errors:',errors);process.exitCode=1;}finally{await browser.close();}
})();
