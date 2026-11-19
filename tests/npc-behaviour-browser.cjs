/* Developer Tools > NPCs, queue item 1 (18 Nov 2026), in a real browser (offline): COPY CHATGPT PROMPT, a code-like paste refused, a ChatGPT-style answer (```json
   fence and chatter) checked and previewed on the map, PLAY IT (draft, not saved), USE THIS BEHAVIOUR (and UNDO), the Daily schedule timeline, the street cat in the
   NPCs tab; then the game: PLAY THIS DRAFT AT THIS TIME, schedule switching by forcing the in-game clock, and PET THE CAT offering a draft mission the cat gives.
   Usage: node tests/serve-modern.cjs, then node tests/npc-behaviour-browser.cjs (SITE_TEST_URL, SHOTS=dir, BROWSER_EXECUTABLE; default the bundled Chromium,
   software GL). PART=editor runs only the editor part. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',shots=process.env.SHOTS||path.resolve('docs/development/npc-behaviour');fs.mkdirSync(shots,{recursive:true});
const bundled=fs.existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':'/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',exe=process.env.BROWSER_EXECUTABLE||(fs.existsSync(bundled)?bundled:null);
const log=(...a)=>console.log('[npc-behaviour]',...a),PART=process.env.PART||'all',REV='grey-reverie';
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'],...(exe?{executablePath:exe}:{})});const errors=[];
 try{
  const ctx=await browser.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'}),page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));
  await page.route('**/api/**',r=>{const p=new URL(r.request().url()).pathname.replace('/api/void-runner/','');if(p==='live-content')return r.fulfill({status:404,contentType:'application/json',body:'{"error":"off"}'});return r.fulfill({status:503,contentType:'application/json',body:'{"error":"offline test"}'});});
  const boot=()=>page.waitForFunction(()=>globalThis.VoidStartup?.started,null,{timeout:180000});
  const dev=()=>page.evaluate(()=>VoidDevTools.identity(async p=>{if(p==='developer/balance')return {values:VoidBalance.defaults,revision:1,preset:'NORMAL'};const e=new Error('Switched off in this offline test');e.status=404;throw e;}));
  const limits=()=>page.evaluate(()=>Object.assign(VoidPreparation.limits,{scene:900000,assets:900000,optional:600000,area:900000,total:1800000,module:600000,artwork:300000}));
  await page.goto(base+'/void-runner.html');await boot();
  await page.evaluate(()=>{const s=C.startDistrictCampaign(C.fresh());s.story.flags.podWakePending=false;localStorage.setItem('void-runner-campaign-v1',JSON.stringify({...s,savedAt:1700000000000}));localStorage.removeItem('editor-guide-on');localStorage.removeItem('mission-editor-drafts-v1');localStorage.setItem('editor-tour-done','1');});
  await page.reload();await boot();await limits();await dev();
  await page.evaluate(()=>VoidDevTools.open('missions'));await page.waitForSelector('[data-me-new-tree]',{timeout:60000});
  // a draft mission given by the street cat (the wizard's own builder): talk to Iris, starts when the player pets the cat (accept / not now)
  const made=await page.evaluate(()=>VoidMissionEditor.shared.addWizardMission((d,o)=>{const a=VoidEditorWizard.fresh('talk');a.giver='street-cat';a.start='person-accept';a.steps[0].npc='iris';a.steps[0].label='Talk to Iris';a.title='TEST: The cat wants something';a.offer='TEST LINE: the cat stares at the alley.';return VoidEditorWizard.build(d,a,o);}));
  log('cat mission',JSON.stringify(made));
  await page.evaluate(()=>{VoidDevTools.npcFocus='grey-reverie';VoidDevTools.tab='npcs';VoidDevTools.render();});
  await page.waitForSelector('[data-npc-behaviour="'+REV+'"]',{timeout:60000});
  // ---- COPY CHATGPT PROMPT (the clipboard is recorded)
  await page.evaluate(()=>{globalThis.__copied=null;try{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async t=>{globalThis.__copied=t;}}});}catch{}});
  await page.locator('[data-npc-copy-prompt="'+REV+'"]').click();await page.waitForTimeout(200);
  const copied=await page.evaluate(()=>globalThis.__copied);assert.ok(copied&&copied.includes('ONLY ONE JSON OBJECT')&&copied.includes('ledge-reverie')&&copied.includes('WHAT I WANT REVERIE TO DO'),'prompt copied');log('prompt',copied.length,'characters');
  assert.match(await page.locator('.me-status').first().textContent(),/prompt is copied/);
  const paste=async t=>{await page.locator('[data-npc-paste="'+REV+'"]').fill(t);await page.locator('[data-npc-check="'+REV+'"]').click();await page.waitForTimeout(250);};
  // ---- a code-like paste is refused; nothing runs
  await page.evaluate(()=>{globalThis.__ran=false;});
  await paste('Here is code: ```js\nglobalThis.__ran=true; const go=()=>VoidStreetPair.force="x";\n```');
  const p1=await page.locator('[data-npc-recipe-problems="'+REV+'"]').textContent();assert.match(p1,/program code/);assert.equal(await page.evaluate(()=>globalThis.__ran),false);
  // a recipe with mistakes: plain fix-it messages
  await paste('{"recipe":"void-runner-npc-behaviour","version":1,"npc":"grey-reverie","allDay":{"do":"stay","at":"the moon","actions":["pole-dance"]},"schedule":[{"from":"8am","to":"12:00","do":"usual"}],"mood":"happy"}');
  const p2=await page.locator('[data-npc-recipe-problems="'+REV+'"]').textContent();log('problems:',p2.slice(0,300));for(const re of [/Unknown field at the top: “mood”/,/no place called “the moon”/,/cannot do “pole-dance”/,/"from" must be a 24-hour time/])assert.match(p2,re);
  await page.locator('[data-npc-behaviour="'+REV+'"]').screenshot({path:path.join(shots,'01-paste-problems.png')});
  // ---- a ChatGPT-style answer: chatter + a ```json fence
  const recipe=await page.evaluate(()=>VoidNPCBehaviour.examples('grey-reverie')[0]);
  await paste('Here is the behaviour recipe for Reverie:\n\n```json\n'+JSON.stringify(recipe,null,2)+'\n```\n\nShe will walk in the morning and sit at lunch.');
  assert.equal(await page.locator('[data-npc-recipe-problems="'+REV+'"]').count(),0);await page.waitForSelector('[data-npc-recipe-preview="'+REV+'"] canvas');
  const sum=await page.locator('[data-npc-recipe-preview="'+REV+'"] ul').textContent();log('preview:',sum.slice(0,200));assert.match(sum,/08:00–12:00/);assert.match(sum,/Lunch on the ledge/);
  await page.locator('[data-npc-recipe-show="0"]').click();await page.waitForTimeout(250);await page.locator('[data-npc-recipe-preview="'+REV+'"]').screenshot({path:path.join(shots,'02-paste-preview-route.png')});
  await page.locator('[data-npc-recipe-show="1"]').click();await page.waitForTimeout(250);await page.locator('[data-npc-recipe-preview="'+REV+'"]').screenshot({path:path.join(shots,'03-paste-preview-lunch.png')});
  assert.equal(await page.evaluate(()=>!!(JSON.parse(localStorage.getItem('mission-editor-drafts-v1')||'{}').npcs||{})['grey-reverie']),false,'nothing saved by previewing');
  // ---- USE THIS BEHAVIOUR, UNDO, and again
  const draftPlan=()=>page.evaluate(()=>(JSON.parse(localStorage.getItem('mission-editor-drafts-v1')||'{}').npcs||{})['grey-reverie']||null);
  await page.locator('[data-npc-recipe-use="'+REV+'"]').click();await page.waitForTimeout(250);let dp=await draftPlan();assert.equal(dp.schedule.length,3);assert.equal(dp.mode,'original');
  await page.locator('[data-npc-undo]').click();await page.waitForTimeout(250);assert.equal(await draftPlan(),null,'UNDO');
  await paste(JSON.stringify(recipe));await page.locator('[data-npc-recipe-use="'+REV+'"]').click();await page.waitForTimeout(250);dp=await draftPlan();assert.equal(dp.schedule.length,3);
  // ---- the Daily schedule timeline: 3 blocks (the night one drawn in two parts), edit a block on the map
  await page.locator('[data-npc-schedule="'+REV+'"]').scrollIntoViewIfNeeded();assert.equal(await page.locator('[data-npc-block]').count(),3);assert.equal(await page.locator('[data-npc-bar]').count(),4);
  await page.locator('[data-npc-schedule="'+REV+'"]').screenshot({path:path.join(shots,'04-daily-schedule.png')});
  await page.locator('[data-npc-block-edit="1"]').click();await page.waitForSelector('[data-npc-editing="'+REV+'"]');await page.waitForTimeout(250);
  assert.equal(await page.locator('[data-npc-edit-block="1"]').getAttribute('aria-pressed'),'true');await page.locator('[data-npc-place="'+REV+'"]').screenshot({path:path.join(shots,'05-edit-lunch-block-on-map.png')});
  // a block's time changed in the table; an overlap is shown in plain words, then put right
  await page.locator('[data-npc-block-time="to:1"]').fill('14:00');await page.locator('[data-npc-block-time="to:1"]').dispatchEvent('change');await page.waitForTimeout(250);
  assert.equal((await draftPlan()).schedule[1].to,'14:00');
  await page.locator('[data-npc-block-time="from:1"]').fill('11:00');await page.locator('[data-npc-block-time="from:1"]').dispatchEvent('change');await page.waitForTimeout(250);
  assert.match(await page.locator('[data-npc-schedule-problem]').first().textContent(),/overlaps time block 1/);
  await page.locator('[data-npc-block-time="from:1"]').fill('12:00');await page.locator('[data-npc-block-time="from:1"]').dispatchEvent('change');await page.waitForTimeout(250);assert.equal(await page.locator('[data-npc-schedule-problem]').count(),0);
  // ---- the street cat in the NPCs tab
  await page.locator('[data-npc="street-cat"]').click();await page.waitForSelector('[data-npc-place="street-cat"]');
  const catActs=await page.evaluate(()=>VoidNPCPaths.actionsFor('street-cat').map(a=>a.id));assert.deepEqual(catActs,['wait','cat-sit','cat-look','cat-wander','walk-on']);
  assert.ok(await page.locator('[data-npc-behaviour="street-cat"]').count());assert.ok(await page.locator('[data-npc-giver="street-cat"]').count());
  await page.locator('[data-npc-facts="street-cat"]').screenshot({path:path.join(shots,'06-street-cat-npc.png')});
  if(PART==='editor'){log('editor part done; page errors:',errors.length?errors.slice(0,5):'none');return;}
  // ---- the game: PLAY THIS DRAFT AT THIS TIME (09:00 in-game) for Reverie
  await page.locator('[data-npc="grey-reverie"]').click();await page.waitForSelector('[data-npc-try-range="'+REV+'"]');
  await page.locator('[data-npc-try-range="'+REV+'"]').evaluate(e=>{e.value='540';e.dispatchEvent(new Event('input'));});
  assert.match(await page.locator('[data-npc-try-say="'+REV+'"]').textContent(),/At 09:00 she follows time block 1/);
  await page.evaluate(()=>{try{VoidGraphics.quality='low';VoidBabylon.setQuality('low');}catch{}});
  await page.locator('[data-npc-play-at="'+REV+'"]').click();
  await page.waitForFunction(()=>!document.getElementById('dev-test-banner').hidden&&mode==='walking'&&walkingLocation?.quarter==='avenue',null,{timeout:900000,polling:50});
  log('in-game time:',await page.evaluate(()=>VoidClock.now(state).time));
  await page.evaluate(()=>{Object.assign(walker,{x:100,z:-10.5,yaw:0});});
  await page.waitForFunction(()=>VoidBabylon.district?.streetPair?.stats?.().her?.id==='grey-reverie',null,{timeout:900000,polling:1000});
  const herPlan=()=>page.evaluate(()=>VoidBabylon.district.streetPair.stats().her?.plan||null);
  const force=(h,m=0)=>page.evaluate(([h,m])=>{const t=((h*60+m)-VoidClock.START_MIN%1440+1440)%1440;state.story.flags[VoidClock.FLAG]=t+1440;},[h,m]);
  await page.waitForFunction(()=>/^sched:0:/.test(VoidBabylon.district.streetPair.stats().her?.plan||''),null,{timeout:120000,polling:500});log('09:00:',await herPlan());
  await page.screenshot({path:path.join(shots,'07-play-0900-morning-walk.png')});
  await force(12,30);await page.waitForFunction(()=>/^sched:1:/.test(VoidBabylon.district.streetPair.stats().her?.plan||''),null,{timeout:60000,polling:300});log('12:30:',await herPlan());
  await page.waitForFunction(()=>{const h=VoidBabylon.district.streetPair.stats().her;return h&&(h.act==='sit'||/sit/.test(h.mode));},null,{timeout:300000,polling:1000}).catch(()=>log('(she had not sat yet)'));
  await page.evaluate(()=>{const h=VoidBabylon.district.streetPair.stats().her;Object.assign(walker,{x:h.x+3,z:-7.4,yaw:Math.atan2(-3,h.z+7.4)});});await page.waitForTimeout(1500);await page.screenshot({path:path.join(shots,'08-play-1230-lunch-ledge.png')});
  await force(15,0);await page.waitForFunction(()=>VoidBabylon.district.streetPair.stats().her&&!VoidBabylon.district.streetPair.stats().her.plan,null,{timeout:60000,polling:300});log('15:00: her usual thing');
  await force(23,0);await page.waitForFunction(()=>/^sched:2:/.test(VoidBabylon.district.streetPair.stats().her?.plan||''),null,{timeout:60000,polling:300});log('23:00:',await herPlan());
  await force(1,0);await page.waitForFunction(()=>/^sched:2:/.test(VoidBabylon.district.streetPair.stats().her?.plan||''),null,{timeout:60000,polling:300});log('01:00 (past midnight):',await herPlan());
  // ---- PET THE CAT: the cat's draft mission is offered
  await page.waitForFunction(()=>VoidBabylon.district.streetPair.stats().cat?.pet===true,null,{timeout:300000,polling:500});
  const cat=await page.evaluate(()=>VoidBabylon.district.streetPair.stats().cat);log('cat',JSON.stringify(cat));
  await page.evaluate(c=>{Object.assign(walker,{x:c.x,z:c.z-1.2,yaw:0});},cat);await page.waitForTimeout(800);
  const it=await page.evaluate(()=>{const c=VoidBabylon.district.streetPair.catItem;return {label:c.label,listed:walkingLocation.interactions.includes(c)};});assert.equal(it.label,'PET THE CAT');assert.ok(it.listed);
  await page.evaluate(()=>{const it=VoidBabylon.district.streetPair.catItem;try{walkTarget=it;}catch{}VoidInteractions.handlers.get('street-cat')({item:it});});
  await page.waitForTimeout(1200);const shown=await page.evaluate(()=>document.body.innerText);log('offer shown:',/TEST LINE: the cat stares at the alley\./.test(shown));assert.match(shown,/TEST LINE: the cat stares at the alley\./);
  await page.screenshot({path:path.join(shots,'09-pet-the-cat-offer.png')});
  const stCat=await page.evaluate(()=>VoidBabylon.district.streetPair.stats().cat.mode);log('cat while petted:',stCat);
  log('page errors:',errors.length?errors.slice(0,5):'none');
 }catch(e){console.log('[npc-behaviour] page errors at failure:',errors.slice(0,8));try{const pg=browser.contexts()[0].pages()[0];console.log((await pg.evaluate(()=>document.getElementById('dev-balance')?.innerText||'')).slice(0,800));await pg.screenshot({path:path.join(shots,'failure.png')});}catch{}throw e;}finally{await browser.close();}
 if(errors.length)console.log('[npc-behaviour] page errors:',errors.slice(0,8));
})().catch(e=>{console.error(e);process.exit(1);});
