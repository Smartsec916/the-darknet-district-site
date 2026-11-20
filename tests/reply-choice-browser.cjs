/* A player reply that is a choice, and "Walk near them" as its own way of starting (19 Nov 2026), in a real browser (offline).
   EDITOR: in the Blocks view the Start block's "How it starts" is set to "Walk near them (starts automatically)" (distance and banner words right there); Admin's offer words
   get a blue player reply made a choice: "Make this a choice: ACCEPT / DENY", Player gets 100 credits. The Form view shows the same mission (Starts: walk near; the reply's
   choice ticked); a second mission is set to walk near from the Form view's Starts list.
   GAME (PLAY THIS DRAFT): walking near Admin starts the mission, he says his line and the reply buttons sit on it (with a REWARD 100 CR card); ACCEPT: credits +100 and the
   conversation goes on. Played again: DENY ends the mission and gives nothing. The real save is untouched; no page errors.
   Usage: node tests/serve-modern.cjs, then node tests/reply-choice-browser.cjs (SITE_TEST_URL, SHOTS=dir, BROWSER_EXECUTABLE; default the bundled Chromium, software GL). */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',shots=process.env.SHOTS||null;if(shots)fs.mkdirSync(shots,{recursive:true});
const bundled=fs.existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':'/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',exe=process.env.BROWSER_EXECUTABLE||(fs.existsSync(bundled)?bundled:null);
const log=(...a)=>console.log('[reply-choice]',...a);
const shot=async(page,name)=>{if(shots)await page.screenshot({path:path.join(shots,name),timeout:300000});};
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'],...(exe?{executablePath:exe}:{})});const errors=[];
 try{
  const ctx=await browser.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'}),page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));
  await page.route('**/api/**',r=>{const p=new URL(r.request().url()).pathname.replace('/api/void-runner/','');if(p==='live-content')return r.fulfill({status:404,contentType:'application/json',body:'{"error":"off"}'});return r.fulfill({status:503,contentType:'application/json',body:'{"error":"offline test"}'});});
  const boot=()=>page.waitForFunction(()=>globalThis.VoidStartup?.started,null,{timeout:600000});
  await page.goto(base+'/void-runner.html');await boot();
  await page.evaluate(()=>{const s=C.startDistrictCampaign(C.fresh());s.story.flags.podWakePending=false;localStorage.setItem('void-runner-campaign-v1',JSON.stringify({...s,savedAt:1700000000000}));localStorage.setItem('editor-tour-done','1');localStorage.setItem('mission-editor-view','blocks');for(const k of ['editor-mode','mission-editor-drafts-v1'])localStorage.removeItem(k);});
  await page.reload();await boot();
  await page.evaluate(()=>Object.assign(VoidPreparation.limits,{scene:900000,assets:900000,optional:600000,area:900000,total:1800000,module:600000,artwork:300000}));
  await page.evaluate(()=>VoidDevTools.identity(async p=>{if(p==='developer/balance')return {values:VoidBalance.defaults,revision:1,preset:'NORMAL'};const e=new Error('Switched off in this offline test');e.status=404;throw e;}));
  await page.evaluate(()=>VoidDevTools.open('missions'));await page.waitForSelector('[data-me-new-tree]',{timeout:60000});
  await page.locator('[data-me-new-tree]').click();await page.locator('[data-me-new-name]').fill('Reply choice');await page.locator('[data-me-create-tree]').click();
  const T='draft-reply-choice',m1=T+'-m1',m2=T+'-m2';await page.locator('[data-me-tree="'+T+'"]').click();await page.locator('[data-me-add-mission]').click();
  const c=()=>page.locator('[data-me-tree-mission="'+m1+'"]');await c().waitFor();
  const mis=id=>page.evaluate(i=>JSON.parse(localStorage.getItem('mission-editor-drafts-v1')).trees.flatMap(t=>t.missions).find(m=>m.id===i),id);
  await c().locator('[data-me-giver]').selectOption('admin');await c().locator('[data-me-field="title"]').fill('TEST: a job from Admin');
  // ---- BLOCKS: the Start block's "How it starts" -> walk near
  await c().locator('[data-mb-start-mode="'+m1+'"]').waitFor();const opts=await c().locator('[data-mb-start-mode] option').allTextContents();log('how it starts',opts.join(' | '));assert.ok(opts.includes('Walk near them (starts automatically)'));
  await c().locator('[data-mb-start-mode]').selectOption('near');await c().locator('[data-mb-start-distance]').waitFor();
  let st=(await mis(m1)).start;assert.deepEqual({how:st.how,channel:st.channel,when:st.when,accept:st.accept},{how:'notification',channel:'notify',when:{kind:'near',npc:'admin',distance:5},accept:undefined});
  assert.match(await c().locator('[data-mb-near-auto]').textContent(),/Starts automatically — no click/);
  await c().locator('[data-mb-start-text]').fill('TEST: Admin waves you over.');
  // Admin's offer words, then the player's reply made a choice with +100 credits
  const offer0=c().locator('[data-mb-line="offer/0"] textarea').first();await offer0.fill('TEST LINE: Got a job for you. I pay 100 up front.');
  await c().locator('[data-mb-add-player="offer"]').click();await c().locator('[data-mb-line="offer/1"] textarea').first().fill('TEST: I’m in.');
  await c().locator('[data-mb-choice-on="offer/1"]').check();await c().locator('[data-mb-choice-way="offer/1"]').waitFor();await c().locator('[data-mb-choice-way="offer/1"]').selectOption('gets');
  await c().locator('[data-mb-choice-credits="offer/1"]').fill('100');await c().locator('[data-mb-choice-notext="offer/1"]').fill('TEST: Not today.');
  let line=(await mis(m1)).offer[1];log('choice line',JSON.stringify(line));assert.deepEqual(line.choice,{credits:100,noText:'TEST: Not today.'});assert.equal(line.who,'You');
  await c().locator('[data-me-step-npc="step-1"]').selectOption('iris');await c().locator('[data-me-label="step-1"]').fill('Talk to Iris (test)');
  await c().locator('[data-mb-choice="offer/1"]').scrollIntoViewIfNeeded();await shot(page,'01-blocks-reply-choice.png');
  await c().locator('[data-mb-start-mode]').scrollIntoViewIfNeeded();await shot(page,'02-blocks-start-walk-near.png');
  // ---- FORM: the same mission
  await c().locator('[data-mb-view="form"]').click();await c().locator('[data-me-starts]').waitFor();assert.equal(await c().locator('[data-me-starts]').inputValue(),'near');
  assert.equal(await c().locator('[data-mb-choice-on="offer/1"]').isChecked(),true,'the Form view shows the choice');assert.equal(await c().locator('[data-mb-choice-credits="offer/1"]').inputValue(),'100');
  await c().locator('[data-me-tline="offer/1"]').scrollIntoViewIfNeeded();await shot(page,'03-form-reply-choice.png');
  // a second mission: walk near from the Form view's Starts list
  await page.locator('[data-me-add-mission]').click();const c2=page.locator('[data-me-tree-mission="'+m2+'"]');await c2.waitFor();await c2.locator('[data-me-giver]').selectOption('iris');
  if(await c2.locator('[data-mb-view="form"]').count())await c2.locator('[data-mb-view="form"]').click();
  await c2.locator('[data-me-starts]').selectOption('near-accept');st=(await mis(m2)).start;assert.equal(st.when.kind,'near');assert.equal(st.channel,'notify');assert.equal(st.accept,true);
  await c2.locator('[data-me-starts]').selectOption('near');st=(await mis(m2)).start;assert.equal(st.accept,undefined);assert.equal(await c2.locator('[data-me-near-mode]').getAttribute('data-me-near-auto'),'true');
  await c2.locator('[data-me-starts]').scrollIntoViewIfNeeded();await shot(page,'04-form-starts-walk-near.png');
  // ---- the game
  await page.evaluate(()=>{try{VoidGraphics.quality='low';VoidBabylon.setQuality('low');}catch{}});
  const play=async()=>{await page.evaluate(()=>VoidDevTools.open('missions'));await page.locator('[data-me-tree="'+T+'"]').click();await page.locator('[data-me-play="tree:'+m1+'"]').click();
   await page.waitForFunction(()=>!document.getElementById('dev-test-banner').hidden&&mode==='walking',null,{timeout:900000,polling:100});
   const ad=await page.evaluate(()=>walkingLocation.interactions.find(i=>i.action==='admin')?.position||null);assert.ok(ad,'Admin is in this scene');
   const cr=await page.evaluate(()=>state.credits);await page.evaluate(p=>{Object.assign(walker,{x:p[0]+2.5,z:p[2]});},ad);
   await page.waitForFunction(()=>[...document.querySelectorAll('[data-talk-choice],#speech-next')].some(n=>n.getClientRects().length&&/ACCEPT|DENY/.test(n.textContent)),null,{timeout:30000,polling:200});return cr;};
  let cr=await play();await page.waitForFunction(()=>document.getElementById('speech-next')?.textContent==='ACCEPT',null,{timeout:60000,polling:200});   // after the line is read out
  const seen=await page.evaluate(()=>({text:document.querySelector('#screen .speech-text,#screen .conversation-thread')?.textContent||document.getElementById('screen').textContent,offer:document.querySelector('[data-talk-offer-money]')?.textContent||'',main:document.getElementById('speech-next')?.textContent,other:[...document.querySelectorAll('[data-talk-choice]')].map(b=>b.textContent)}));
  log('walked near',JSON.stringify({...seen,text:seen.text.slice(-160)}));assert.match(seen.text,/Got a job for you/);assert.equal(seen.main,'ACCEPT');assert.deepEqual(seen.other,['DENY']);assert.match(seen.offer,/REWARD 100 CR/);
  await shot(page,'05-game-walk-near-choice.png');
  await page.evaluate(()=>document.getElementById('speech-next').click());await page.waitForFunction(c0=>state.credits===c0+100,cr,{timeout:30000,polling:200}).catch(async e=>{log('debug',cr,JSON.stringify(await page.evaluate(id=>({cr:state.credits,flags:Object.fromEntries(Object.entries(state.story.flags).filter(([k])=>/^m[gac]_/.test(k))),rec:state.universe.missions[id],ask:VoidLiveContent.askNow(),speech:typeof speech!=='undefined'&&speech?{i:speech.index,n:speech.lines.length}:null,next:document.getElementById('speech-next')?.textContent}),m1)));throw e;});
  const after=await page.evaluate(id=>({credits:state.credits,rec:state.universe.missions[id]}),m1);log('ACCEPT',JSON.stringify(after));assert.equal(after.rec.objectives['offer-c1'],true);
  await page.waitForTimeout(800);await shot(page,'06-game-accepted.png');
  for(let i=0;i<6&&await page.evaluate(()=>typeof speech!=='undefined'&&!!speech);i++){await page.evaluate(()=>document.getElementById('speech-next')?.click());await page.waitForTimeout(600);}
  // ---- played again: DENY
  await Promise.all([page.waitForNavigation({timeout:600000}),page.evaluate(()=>document.querySelector('#dev-test-banner button').click())]);await boot();   // EXIT TEST reloads the page
  await page.evaluate(()=>Object.assign(VoidPreparation.limits,{scene:900000,assets:900000,optional:600000,area:900000,total:1800000,module:600000,artwork:300000}));
  await page.evaluate(()=>VoidDevTools.identity(async p=>{if(p==='developer/balance')return {values:VoidBalance.defaults,revision:1,preset:'NORMAL'};const e=new Error('Switched off in this offline test');e.status=404;throw e;}));
  await page.evaluate(()=>{try{VoidGraphics.quality='low';VoidBabylon.setQuality('low');}catch{}});
  cr=await play();await page.waitForFunction(()=>document.getElementById('speech-next')?.textContent==='ACCEPT',null,{timeout:60000,polling:200});await page.evaluate(()=>document.querySelector('[data-talk-choice="1"]').click());await page.waitForTimeout(1000);
  const den=await page.evaluate(id=>({credits:state.credits,rec:state.universe.missions[id]||null}),m1);log('DENY',JSON.stringify(den));assert.equal(den.credits,cr,'nothing given on DENY');assert.equal(den.rec,null,'the mission ended (offered again later)');
  await shot(page,'07-game-denied.png');
  assert.equal(await page.evaluate(id=>!!(JSON.parse(localStorage.getItem('void-runner-campaign-v1')||'{}').universe?.missions||{})[id],m1),false,'the real save is untouched');
  assert.deepEqual(errors,[]);log('PASS');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
