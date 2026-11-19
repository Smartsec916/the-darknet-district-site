/* Mission Editor, 18 Nov 2026, in a real browser (offline): the two separate features.
   1. EDITOR: a new tree; mission 1 given by Reverie with the start trigger "When walked near" (distance set to 8 m; 99 is clamped to 30; back to 8), its availability note;
      mission 2 given by Lace, in person with ACCEPT / NOT NOW. Screenshots of both.
   2. GAME (PLAY THIS DRAFT of mission 1): draft play runs at a time Reverie is out (19 Nov 2026: a simulated street clock in her shift, not a forced figure); her TALK TO REVERIE prompt follows her; the trigger waits while the
      game is not in walking mode, does not fire at 12 m, fires once at 3 m (the notification); then TALK TO REVERIE completes the step and she stops for the conversation.
   Usage: node tests/serve-modern.cjs, then node tests/editor-givers-browser.cjs (SITE_TEST_URL, SHOTS=dir, BROWSER_EXECUTABLE; default the bundled Chromium, software GL). */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',shots=process.env.SHOTS||path.resolve('docs/development/editor-givers');fs.mkdirSync(shots,{recursive:true});
const bundled=fs.existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':'/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',exe=process.env.BROWSER_EXECUTABLE||(fs.existsSync(bundled)?bundled:null);
const log=(...a)=>console.log('[editor-givers]',...a);
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'],...(exe?{executablePath:exe}:{})});const errors=[];
 try{
  const ctx=await browser.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'}),page=await ctx.newPage().then(async p=>{await p.addInitScript(()=>{try{if(!localStorage.getItem('mission-editor-view'))localStorage.setItem('mission-editor-view','form');}catch{}});return p;});page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));
  await page.route('**/api/**',r=>{const p=new URL(r.request().url()).pathname.replace('/api/void-runner/','');if(p==='live-content')return r.fulfill({status:404,contentType:'application/json',body:'{"error":"off"}'});return r.fulfill({status:503,contentType:'application/json',body:'{"error":"offline test"}'});});
  const boot=()=>page.waitForFunction(()=>globalThis.VoidStartup?.started,null,{timeout:120000});
  await page.goto(base+'/void-runner.html');await boot();
  await page.evaluate(()=>{const s=C.startDistrictCampaign(C.fresh());s.story.flags.podWakePending=false;localStorage.setItem('void-runner-campaign-v1',JSON.stringify({...s,savedAt:1700000000000}));});
  await page.reload();await boot();
  await page.evaluate(()=>Object.assign(VoidPreparation.limits,{scene:900000,assets:900000,optional:600000,area:900000,total:1800000,module:600000,artwork:300000}));
  await page.evaluate(()=>VoidDevTools.identity(async p=>{if(p==='developer/balance')return {values:VoidBalance.defaults,revision:1,preset:'NORMAL'};const e=new Error('Switched off in this offline test');e.status=404;throw e;}));
  await page.evaluate(()=>VoidDevTools.open('missions'));await page.waitForSelector('[data-me-new-tree]',{timeout:60000});
  // ---- 1. the editor
  await page.locator('[data-me-new-tree]').click();await page.locator('[data-me-new-name]').fill('Street givers');await page.locator('[data-me-create-tree]').click();
  const T='draft-street-givers',m1=T+'-m1',m2=T+'-m2';await page.waitForSelector('[data-me-owner-tree="'+T+'"]');
  await page.locator('[data-me-tree="'+T+'"]').click();await page.waitForSelector('[data-me-add-mission]');
  await page.locator('[data-me-add-mission]').click();await page.waitForSelector('[data-me-tree-mission="'+m1+'"]');const c1=()=>page.locator('[data-me-tree-mission="'+m1+'"]');
  const opts=await c1().locator('[data-me-giver] optgroup').first().evaluate(g=>[...g.querySelectorAll('option')].map(o=>o.value));assert.ok(opts.includes('grey-reverie')&&opts.includes('ethereal-lace'),'both are in the giver list');
  await c1().locator('[data-me-giver]').selectOption('grey-reverie');await page.waitForSelector('[data-me-giver-status="'+m1+'"]');
  const st1=await page.locator('[data-me-giver-status="'+m1+'"]').textContent();assert.match(st1,/Only while Reverie is out on the street: 00:00 to 12:00 UTC/);log('giver status:',st1);
  await c1().locator('[data-me-field="title"]').fill('TEST: walk past Reverie');
  await c1().locator('[data-me-starts]').selectOption('notify');await c1().locator('[data-me-start-text]').fill('TEST: Reverie waves you over.');
  await c1().locator('[data-me-start-when]').selectOption('near');await page.waitForSelector('[data-me-start-distance="'+m1+'"]');
  assert.equal(await c1().locator('[data-me-start-distance]').inputValue(),'5','default 5 m');assert.equal(await c1().locator('[data-me-start-near]').inputValue(),'grey-reverie','the giver by default');
  const draftWhen=()=>page.evaluate(id=>JSON.parse(localStorage.getItem('mission-editor-drafts-v1')).trees.find(t=>t.missions.some(m=>m.id===id)).missions.find(m=>m.id===id).start.when,m1);
  await c1().locator('[data-me-start-distance]').fill('99');await c1().locator('[data-me-start-distance]').dispatchEvent('change');assert.equal(await c1().locator('[data-me-start-distance]').inputValue(),'30','clamped to 30');assert.equal((await draftWhen()).distance,30);
  await c1().locator('[data-me-start-distance]').fill('8');await c1().locator('[data-me-start-distance]').dispatchEvent('change');assert.deepEqual(await draftWhen(),{kind:'near',npc:'grey-reverie',distance:8},'saved in the draft');
  await c1().locator('[data-me-step-npc="step-1"]').selectOption('grey-reverie');await c1().locator('[data-me-label="step-1"]').fill('Talk to Reverie (test)');
  await c1().locator('[data-me-tline="step-1/say/0"] textarea').fill('TEST LINE: Reverie answers.');
  assert.match(await c1().locator('[data-me-near-shift]').textContent(),/Only while Reverie/);
  await c1().locator('[data-me-start]').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(shots,'editor-walked-near-reverie.png')});
  await page.locator('[data-me-add-mission]').click();await page.waitForSelector('[data-me-tree-mission="'+m2+'"]');const c2=()=>page.locator('[data-me-tree-mission="'+m2+'"]');
  await c2().locator('[data-me-giver]').selectOption('ethereal-lace');await c2().locator('[data-me-field="title"]').fill('TEST: Lace asks a favour');await c2().locator('[data-me-starts]').selectOption('person-accept');
  assert.equal(await c2().locator('[data-me-tline="offer/0"] select').inputValue(),'ethereal-lace','the offer line follows the giver');
  await c2().locator('[data-me-tline="offer/0"] textarea').fill('TEST LINE: Lace offers it.');await c2().locator('[data-me-step-npc="step-1"]').selectOption('ethereal-lace');await c2().locator('[data-me-label="step-1"]').fill('Talk to Lace (test)');
  assert.match(await page.locator('[data-me-giver-status="'+m2+'"]').textContent(),/Only while Lace is out on the street: 12:00 to 00:00 UTC/);
  await c2().locator('[data-me-giver]').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(shots,'editor-lace-giver.png')});
  const content=await page.evaluate(()=>VoidMissionEditor.draftContent()),mine=content.trees.find(t=>t.id===T);
  assert.deepEqual(mine.missions[0].start.when,{kind:'near',npc:'grey-reverie',distance:8},'exported with the distance');assert.equal(mine.missions[1].giver,'ethereal-lace');
  const chk=await page.evaluate(c=>VoidMissionContent.check(c,{givers:new Map(VoidLiveContent.env.givers.map(g=>[g.id,g])),places:VoidMissionGivers.placeIds()}).errors,content);assert.deepEqual(chk,[]);
  // ---- 2. the game: play mission 1
  await page.evaluate(()=>{try{VoidGraphics.quality='low';VoidBabylon.setQuality('low');}catch{}});
  await page.locator('[data-me-play="tree:'+m1+'"]').click();
  await page.waitForFunction(()=>!document.getElementById('dev-test-banner').hidden&&mode==='walking'&&walkingLocation?.quarter==='avenue',null,{timeout:900000,polling:50});
  await page.evaluate(()=>{Object.assign(walker,{x:100,z:-27});});await page.waitForFunction(()=>VoidAssets.pending===0,null,{timeout:900000});   // out in the road, well beyond 8 m of anywhere she walks (her prompt appears only once her figure is in)
  log('draft play on the Avenue; UTC hour',new Date().getUTCHours(),'tracked',await page.evaluate(()=>state.universe.trackedMission));
  assert.equal(await page.evaluate(()=>VoidStreetPair.onStreet(VoidStreetPair.streetTime())?.id),'grey-reverie','draft play runs at a time Reverie is out (the real time, or a simulated street clock in her shift)');
  await page.waitForFunction(()=>VoidBabylon.district?.streetPair?.stats?.().her?.id==='grey-reverie',null,{timeout:900000,polling:1000});
  const sp=()=>page.evaluate(()=>VoidBabylon.district.streetPair.stats());
  // hold her in one place for the pictures (her routine otherwise walks on)
  await page.evaluate(()=>{const h=VoidBabylon.district.streetPair.her;Object.assign(h.s,{mode:'stop',left:9999,clip:'idle',device:null,face:null,sub:'test',x:100,z:-6.85,yaw:Math.PI});VoidBabylon.district.streetPair.tick(.3);});
  let s=await sp();log('her',JSON.stringify(s.her),'talk',JSON.stringify(s.talk));assert.equal(s.talk?.label,'TALK TO REVERIE');assert.ok(Math.abs(s.talk.x-100)<.05&&Math.abs(s.talk.z+6.85)<.05,'the prompt is where she is');
  const at=(x,z)=>page.evaluate(([x,z])=>{Object.assign(walker,{x,z,yaw:Math.atan2(100-x,-6.85-z),pitch:.12});},[x,z]);
  const rec=()=>page.evaluate(id=>state.universe.missions[id]||null,m1);
  await at(100,-6.85-12);await page.waitForTimeout(600);assert.equal(await page.evaluate(()=>VoidLiveContent.nearTick()),null,'12 m: nothing');assert.equal(await rec(),null);
  // 3 m from her (inside 8 m) but in a conversation with her (her greeting: no mission for her yet): the watch waits. All in one step, so the 250 ms watch never runs in between.
  await page.evaluate(()=>{Object.assign(walker,{x:100,z:-9.85,yaw:0,pitch:.12});walkTarget=VoidBabylon.district.streetPair.talkItems['grey-reverie'];interactWalking();});
  assert.equal(await page.evaluate(()=>VoidConversationUI.isOpen),true);assert.deepEqual(await page.evaluate(()=>speech.lines.map(l=>l.who+': '+l.text)),['grey-reverie: Hey.'],'her neutral greeting');
  await page.evaluate(()=>{const h=VoidBabylon.district.streetPair.her;Object.assign(h.s,{mode:'walk',left:20,sub:null});VoidBabylon.district.streetPair.tick(.1);});
  s=await sp();assert.equal(s.chat,true);assert.equal(s.her.mode,'stop','she stops walking to talk');assert.equal(s.her.sub,'chat');
  assert.equal(await page.evaluate(()=>VoidLiveContent.nearTick()),null,'never during a conversation');await page.waitForTimeout(1200);assert.equal(await rec(),null,'still not started');
  await page.waitForTimeout(1500);await page.screenshot({path:path.join(shots,'game-reverie-greeting.png'),timeout:300000});
  await page.evaluate(()=>{resumeWalking();const h=VoidBabylon.district.streetPair.her;VoidBabylon.district.streetPair.tick(.1);Object.assign(h.s,{mode:'stop',left:9999,clip:'idle',sub:'test',x:100,z:-6.85,face:null});});
  await page.waitForFunction(id=>!!state.universe.missions[id]?.acquired,m1,{timeout:20000});
  log('near distances',JSON.stringify(await page.evaluate(()=>VoidLiveContent.nearDistances())));
  assert.equal(await page.evaluate(()=>state.universe.trackedMission),m1,'started and tracked, without talking');assert.equal(await page.evaluate(()=>VoidLiveContent.nearTick()),null,'once');
  await page.waitForTimeout(2500);await page.screenshot({path:path.join(shots,'game-walked-near-started.png'),timeout:300000});
  await at(100,-6.85-2.6);await page.waitForTimeout(1500);
  const sel=await page.evaluate(()=>({mode,label:walkTarget?.label||null,walker:[walker.x,walker.z],near:walkingLocation.interactions.filter(i=>Math.hypot(i.position[0]-walker.x,i.position[2]-walker.z)<4).map(i=>i.id)}));log('selected',JSON.stringify(sel));
  assert.equal(sel.label,'TALK TO REVERIE','her prompt is the one offered');
  await page.waitForTimeout(1500);await page.screenshot({path:path.join(shots,'game-talk-to-reverie.png'),timeout:300000});
  await page.evaluate(()=>{const h=VoidBabylon.district.streetPair.her;Object.assign(h.s,{mode:'walk',left:20,sub:null});interactWalking();});
  await page.waitForFunction(()=>VoidConversationUI.isOpen,null,{timeout:20000});await page.evaluate(()=>VoidBabylon.district.streetPair.tick(.1));
  // the "walked near" watch never runs during a conversation (it floats over walking in the District)
  assert.equal(await page.evaluate(()=>mode),'walking','a District conversation floats over walking');
  s=await sp();assert.equal(s.chat,true,'she knows she is being talked to');assert.equal(s.her.mode,'stop','she stops walking for the conversation');assert.equal(s.her.sub,'chat');
  const done=await page.evaluate(id=>({rec:state.universe.missions[id],lines:(speech?.lines||[]).map(l=>l.who+': '+l.text)}),m1);log('dialogue',JSON.stringify(done.lines));
  assert.equal(done.rec.completed,true,'TALK TO REVERIE completes the step');assert.ok(done.lines.some(l=>/Reverie answers/.test(l)));
  await page.waitForTimeout(2000);await page.screenshot({path:path.join(shots,'game-reverie-dialogue.png'),timeout:300000});
  await page.evaluate(()=>{try{resumeWalking();}catch{}});for(let i=0;i<3;i++)await page.evaluate(()=>VoidBabylon.district.streetPair.tick(.6));
  s=await sp();assert.equal(s.chat,false);assert.notEqual(s.her.sub,'chat','she goes on her way after the conversation');
  assert.deepEqual(errors.filter(e=>!/offline|Failed to fetch|NetworkError/i.test(e)),[],'no page errors');
  log('PASS');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
