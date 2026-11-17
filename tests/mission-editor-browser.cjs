/* Developer Tools > Mission Editor in a real browser (offline: every API call is mocked or refused, no Firebase).
   1. Opens Developer Tools > Mission Editor as a confirmed developer (the identity hook dev-tools.js uses after a server-confirmed sign-in) and takes screenshots at 1366x768 and 1920x1080.
   2. Edits Iris's line at DISTRICT ERRAND / "Report back to Iris", presses PLAY THIS DRAFT on that step, checks the game shows the edited line and objective in a throwaway
      session with the banner, that nothing is written to the real save or the cloud, then LEAVE DRAFT: the page reloads, the real save is byte-identical, the editor
      reopens on the same mission and step, and the edit is still in the draft.
   3. Opens the publish check screen against a mocked server (publishing switched on) and checks blocking problems, player warnings and the PUBLISH TO ALL PLAYERS button.
   Usage: node tests/serve-modern.cjs, then node tests/mission-editor-browser.cjs  (SHOTS=dir, BROWSER_EXECUTABLE=path; default: the bundled Chromium if present) */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',shots=process.env.SHOTS||path.resolve('docs/development/mission-editor');fs.mkdirSync(shots,{recursive:true});
const bundled='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',exe=process.env.BROWSER_EXECUTABLE||(fs.existsSync(bundled)?bundled:null);
const REAL_SAVE=JSON.stringify({version:1,quest:'open',location:'earth',credits:4321,savedAt:1700000000000,story:{flags:{missionPool:'closed',realSaveMarker:true}}});
const EDITED='TEST LINE: quiet bar, open shop, good eyes.';
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader'],...(exe?{executablePath:exe}:{})});const errors=[],posts=[];
 try{
  const ctx=await browser.newContext({viewport:{width:1366,height:768},serviceWorkers:'block'}),page=await ctx.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  let publishMode='off';
  await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));
  await page.route('**/api/**',r=>{const u=new URL(r.request().url()),p=u.pathname.replace('/api/void-runner/','');if(r.request().method()==='POST')posts.push(p);
   if(p==='live-content')return r.fulfill({status:404,contentType:'application/json',body:'{"error":"off"}'});
   if(p==='developer/live-content'&&publishMode==='on')return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({enabled:true,editor:true,version:1,publishedAt:1763380000,history:[{version:1,at:1763380000,action:'publish',note:'First test'}]})});
   if(p==='developer/live-content/check')return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,errors:[],warnings:[]})});
   return r.fulfill({status:503,contentType:'application/json',body:'{"error":"offline test"}'});});
  await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>globalThis.VoidStartup?.started,null,{timeout:90000});
  // A real save of a District campaign, written the way the game writes it, then one reload so the game has read it back.
  await page.evaluate(m=>{const s=C.startDistrictCampaign(C.fresh());s.credits=4321;s.story.flags.realSaveMarker=true;localStorage.setItem('void-runner-campaign-v1',JSON.stringify({...s,savedAt:1700000000000}));},null);
  await page.reload();await page.waitForFunction(()=>globalThis.VoidStartup?.started,null,{timeout:90000});
  const developer=()=>page.evaluate(()=>VoidDevTools.identity(async(p,body)=>{if(p==='developer/balance')return {values:VoidBalance.defaults,revision:1,preset:'NORMAL'};const e=new Error(p.startsWith('developer/live-content')&&window.__publishOn?'':'Switched off in this offline test');e.status=404;if(p==='developer/live-content'&&window.__publishOn)return {enabled:true,editor:true,version:1,publishedAt:1763380000,history:[{version:1,at:1763380000,action:'publish',note:'First test'}]};if(p==='developer/live-content/check')return {ok:true,errors:[],warnings:[]};throw e;}));
  await developer();await page.evaluate(()=>VoidDevTools.open('missions'));
  await page.waitForSelector('#me-root [data-me-tree="beginner"]',{timeout:60000});
  const trees=await page.locator('[data-me-tree]').count();assert.equal(trees,10,'ten mission trees');
  assert.match(await page.locator('.me-how summary').textContent(),/PUBLISH TO ALL PLAYERS: OFF on the server/);
  await page.screenshot({path:path.join(shots,'mission-editor-1366.png')});
  // the Communion arc with David's locked lines
  await page.locator('[data-me-tree="communion"]').click();await page.waitForSelector('.me-lock');await page.locator('.me-lock').first().scrollIntoViewIfNeeded();
  assert.match(await page.locator('.me-lock').first().textContent(),/David’s script — locked/);await page.screenshot({path:path.join(shots,'mission-editor-communion-1366.png')});
  // All lines for Admin
  await page.locator('[data-me-mode="npcs"]').click();await page.waitForSelector('[data-me-npc]');assert.equal(await page.locator('[data-me-npc]').inputValue(),'admin');
  assert.match(await page.locator('#me-root').textContent(),/ElevenLabs/);await page.screenshot({path:path.join(shots,'mission-editor-admin-lines-1366.png')});
  await page.setViewportSize({width:1920,height:1080});await page.locator('[data-me-mode="trees"]').click();await page.locator('[data-me-tree="beginner"]').click();
  await page.locator('[data-me-mission="beginner:district-errand"]').click();await page.waitForSelector('[data-me-step="report"]');
  await page.screenshot({path:path.join(shots,'mission-editor-1920.png')});
  // edit Iris's line and the objective, then play the draft from that step
  const line=page.locator('[data-me-step="report"] .me-line textarea').first();await line.fill(EDITED);
  const objective=page.locator('[data-me-step="bar"] .me-field textarea, [data-me-step="bar"] .me-field input').first();await objective.fill('Have a look at the bar');
  const draft=await page.evaluate(()=>JSON.parse(localStorage.getItem('studio-drafts-v1')));assert.equal(draft.missions[1].objectives[2].say[0].text,EDITED,'autosaved on every edit');
  await page.screenshot({path:path.join(shots,'mission-editor-edit-1920.png')});
  const before=await page.evaluate(()=>localStorage.getItem('void-runner-campaign-v1'));assert(before&&JSON.parse(before).story.flags.realSaveMarker===true,'the real save is in the browser');
  await page.evaluate(()=>{try{VoidGraphics.quality='low';VoidBabylon.setQuality('low');}catch{}});   // the software renderer is slow; the draft play itself is what is checked
  await page.locator('[data-me-play="beginner:district-errand#report"]').click();
  await page.waitForFunction(()=>!document.getElementById('dev-test-banner').hidden&&mode==='walking',null,{timeout:120000});
  assert.match(await page.locator('#dev-test-banner').textContent(),/PLAYING DRAFT: DISTRICT ERRAND — not your real save.*LEAVE DRAFT/);
  const inGame=await page.evaluate(()=>({tracked:VoidMissions.tracked(state,C)?.id,label:VoidBeginner.byId['district-errand'].objectives[0].label,objective:VoidMissions.tracked(state,C)?.objective,steps:VoidBeginner.summary(state).find(m=>m.id==='district-errand').objectives}));
  assert.equal(inGame.tracked,'district-errand');assert.equal(inGame.label,'Have a look at the bar');assert.deepEqual(inGame.steps.map(s=>s.done),[true,true,false],'started at the chosen step');
  await page.evaluate(()=>VoidInteractions.handlers.get('district-iris')());
  const shown=await page.evaluate(()=>speech?.lines?.map(l=>l.text)||[]);assert(shown.includes(EDITED),'Iris says the edited line: '+shown.join(' | '));
  await page.screenshot({path:path.join(shots,'draft-play-1920.png'),timeout:180000});
  await page.waitForTimeout(1200);
  assert.equal(await page.evaluate(()=>localStorage.getItem('void-runner-campaign-v1')),before,'the real save is untouched during draft play');
  assert(!posts.some(p=>p==='save'||p.endsWith('/save')),'no cloud save during draft play: '+posts.join(','));
  // LEAVE DRAFT: back to the editor on the same mission and step, draft intact
  await Promise.all([page.waitForNavigation({timeout:60000}),page.locator('#dev-test-banner button').click()]);
  await page.waitForFunction(()=>globalThis.VoidStartup?.started,null,{timeout:90000});
  assert.equal(await page.evaluate(()=>localStorage.getItem('void-runner-campaign-v1')),before,'the real save is byte-identical after leaving');
  await developer();
  await page.waitForSelector('[data-me-step="report"].on',{timeout:60000});
  assert.equal(await page.locator('[data-me-step="report"] .me-line textarea').first().inputValue(),EDITED,'the edit is still in the draft');
  assert.match(await page.locator('#me-status').textContent(),/Back from your draft play/);assert.equal(await page.locator('[data-me-played]').count(),1,'last played is shown');
  await page.screenshot({path:path.join(shots,'after-leave-1920.png')});
  // the publish check screen against a mocked server with publishing switched on
  await page.evaluate(()=>{window.__publishOn=true;});await page.evaluate(()=>VoidMissionEditor.refreshServer());if(process.env.DEBUG)console.log(JSON.stringify(await page.evaluate(()=>({live:VoidMissionEditor.server.live,note:VoidMissionEditor.server.note,flag:window.__publishOn}))));
  await page.locator('[data-me-mode="publish"]').click();await page.waitForSelector('#me-check');
  const check=await page.locator('#me-check').textContent();assert.match(check,/What changes for players/);assert.match(check,/now reads "Have a look at the bar"/);assert.match(check,/Players part-way through/);
  await page.screenshot({path:path.join(shots,'publish-check-1920.png'),fullPage:false});
  assert.equal(await page.locator('[data-me-publish]').isDisabled(),false,'a valid draft can be published');assert.match(await page.locator('[data-me-publish]').textContent(),/PUBLISH TO ALL PLAYERS/);

  // a broken draft blocks the publish button
  await page.evaluate(()=>{const d=JSON.parse(localStorage.getItem('studio-drafts-v1'));d.missions[0].objectives[0].on='teleport';localStorage.setItem('studio-drafts-v1',JSON.stringify(d));});
  await page.locator('[data-me-mode="trees"]').click();await page.locator('[data-me-mode="publish"]').click();
  assert.equal(await page.locator('[data-me-publish]').isDisabled(),true,'errors block publishing');assert.match(await page.locator('#me-check').textContent(),/nothing in the game can complete this step/);
  assert.deepEqual(errors,[],'no page errors');
  // 4. every player: published content is applied over the shipped missions; a record that fails the check is refused and the shipped missions stay
  for(const [label,body,expect] of [['valid',{version:7,content:{format:'darknet-district-mission-content',version:1,registry:{'legal-run':{title:'AN HONEST DAY'}},lines:[{who:'admin',from:'Always got work. Just depends on where you’re willing to go.',to:'Work? Always.'}]}},'AN HONEST DAY'],
   ['refused',{version:8,content:{format:'darknet-district-mission-content',version:1,registry:{'legal-run':{title:'<script>x</script>'}}}},'AN HONEST LIVING']]){
   const c2=await browser.newContext({viewport:{width:1366,height:768},serviceWorkers:'block'}),p2=await c2.newPage();p2.on('pageerror',e=>errors.push(label+': '+e.message));
   await p2.route('https://**/*',r=>r.abort());await p2.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));
   await p2.route('**/api/**',r=>new URL(r.request().url()).pathname.endsWith('/live-content')?r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)}):r.fulfill({status:503,body:'{}'}));
   await p2.goto(base+'/void-runner.html');await p2.waitForFunction(()=>globalThis.VoidStartup?.started,null,{timeout:90000});await p2.waitForFunction(()=>VoidLiveContent.current.version>0||VoidLiveContent.current.refused,null,{timeout:30000});
   const got=await p2.evaluate(()=>({title:VoidMissions.definitions['legal-run'].title,line:VoidMissionContent.mapLine(VoidLiveContent.env,{who:'Admin',text:'Always got work. Just depends on where you’re willing to go.'}).text,cur:VoidLiveContent.current}));
   assert.equal(got.title,expect,label);if(label==='valid')assert.equal(got.line,'Work? Always.');else assert(got.cur.refused&&got.cur.version===0,'fail safe');
   await c2.close();}
  assert.deepEqual(errors,[],'no page errors');
  console.log('mission editor browser test passed; screenshots in',shots);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
