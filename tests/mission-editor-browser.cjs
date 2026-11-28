/* Developer Tools > Mission Editor in a real browser (offline: every API call is mocked or refused, no Firebase).
   1. Opens Developer Tools > Mission Editor as a confirmed developer (the identity hook dev-tools.js uses after a server-confirmed sign-in) and takes screenshots at 1366x768 and 1920x1080.
   (17 Nov 2026: the older trees are archived; parts 1-3 now use the Main storyline.) 1b. "How this mission starts" of Mission 001 (screenshot), the archived group, EXIT TO MAIN MENU.
   2. Writes a test line for Admin's Mission 001 introduction, presses PLAY THIS DRAFT FROM HERE on "Find and speak with Admin", checks the game shows it in a throwaway
      session with the banner, that nothing is written to the real save or the cloud, then LEAVE DRAFT: the page reloads, the real save is byte-identical, the editor
      reopens on the same mission and step, and the edit is still in the draft.
   3. Opens the publish check screen against a mocked server (publishing switched on) and checks blocking problems, player warnings and the PUBLISH TO ALL PLAYERS button.
   5. NEW TREE: creates a tree, names it, renames it (the id stays), adds a mission with Admin as giver, a "talk to Iris" step, a story flag and credits; a second mission given by
      Dr. Elara Voss (an earlier character players cannot reach today). PLAY THIS DRAFT: Admin offers it, Iris completes it, the flag and credits are applied, the real save is
      untouched, LEAVE DRAFT returns with the tree intact. The publish check screen (mocked server) lists the new missions and the unreachable giver. Players get a published tree.
   Usage: node tests/serve-modern.cjs, then node tests/mission-editor-browser.cjs  (SITE_TEST_URL=http://127.0.0.1:<port>, SHOTS=dir, BROWSER_EXECUTABLE=path; default: the bundled
   Chromium if present; ONLY=trees runs part 5 alone, ONLY=chain part 6 alone)
   6. THE OWNER'S CHAIN (17 Nov 2026): tree A, given by Admin: "talk to Iris" GRANTS A SHIP; "fly to Meridian"; "talk to Rook" STARTS tree B, given by Rook. Draft play from the start (Admin
      offers it, Iris grants the ship), then PLAY THIS DRAFT FROM HERE at the flight step: the player starts at the Port with the ship, boards, really flies and docks at Meridian,
      meets Rook (link fires), and Rook offers tree B's mission. All text is placeholder test text in this file only. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',shots=process.env.SHOTS||path.resolve('docs/development/mission-editor');fs.mkdirSync(shots,{recursive:true});
const bundled=fs.existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':'/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',exe=process.env.BROWSER_EXECUTABLE||(fs.existsSync(bundled)?bundled:null);
const REAL_SAVE=JSON.stringify({version:1,quest:'open',location:'earth',credits:4321,savedAt:1700000000000,story:{flags:{missionPool:'closed',realSaveMarker:true}}});
const EDITED='TEST LINE: Admin introduces the District (test text).';
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader'],...(exe?{executablePath:exe}:{})});const errors=[],posts=[];
 try{
  const ctx=await browser.newContext({viewport:{width:1366,height:768},serviceWorkers:'block'}),page=await ctx.newPage().then(async p=>{await p.addInitScript(()=>{try{if(!localStorage.getItem('mission-editor-view'))localStorage.setItem('mission-editor-view','form');}catch{}});return p;});
  page.on('pageerror',e=>errors.push(e.message));
  let publishMode='off';
  await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));
  await page.route('**/api/**',r=>{const u=new URL(r.request().url()),p=u.pathname.replace('/api/void-runner/','');if(r.request().method()==='POST')posts.push(p);
   if(p==='live-content')return r.fulfill({status:404,contentType:'application/json',body:'{"error":"off"}'});
   if(p==='developer/live-content'&&publishMode==='on')return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({enabled:true,editor:true,version:1,publishedAt:1763380000,history:[{version:1,at:1763380000,action:'publish',note:'First test'}]})});
   if(p==='developer/live-content/check')return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,errors:[],warnings:[]})});
   return r.fulfill({status:503,contentType:'application/json',body:'{"error":"offline test"}'});});
  await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>globalThis.VoidStartup?.started,null,{timeout:90000});
  if(!process.env.ONLY||process.env.ONLY==='jump'){
   await page.evaluate(()=>VoidDevTools.identity(async()=>({values:VoidBalance.defaults,revision:1,preset:'NORMAL'})));
   await page.evaluate(()=>VoidDevTools.open('test'));
   const stages=page.locator('#dev-test-stage');
   const ids=await page.evaluate(()=>VoidLiveContent.env.trees.flatMap(t=>t.missions.map(m=>'mission:'+m.id)));
   assert(ids.length>0);
   assert.deepEqual(await stages.locator('option[value^="mission:"]').evaluateAll(opts=>opts.map(o=>o.value)),ids);
   const saved=await page.evaluate(()=>localStorage.getItem('void-runner-campaign-v1'));
   await stages.selectOption(ids.at(-1));
   await page.locator('[data-dev="test-start"]').click();
   await page.waitForFunction(()=>VoidDevTest.active&&mode==='walking',null,{timeout:90000});
   assert.equal(await page.evaluate(()=>save()),false);
   assert.equal(await page.evaluate(()=>localStorage.getItem('void-runner-campaign-v1')),saved);
   console.log('Playable mission jumps verified:',ids.length);
   await page.reload();await page.waitForFunction(()=>VoidStartup.started);
   if(process.env.ONLY==='jump')return;
  }
  if(!process.env.ONLY){
  // A real save of a District campaign, written the way the game writes it, then one reload so the game has read it back.
  await page.evaluate(m=>{const s=C.startDistrictCampaign(C.fresh());s.credits=4321;s.story.flags.realSaveMarker=true;localStorage.setItem('void-runner-campaign-v1',JSON.stringify({...s,savedAt:1700000000000}));},null);
  await page.reload();await page.waitForFunction(()=>globalThis.VoidStartup?.started,null,{timeout:90000});
  const developer=()=>page.evaluate(()=>VoidDevTools.identity(async(p,body)=>{if(p==='developer/balance')return {values:VoidBalance.defaults,revision:1,preset:'NORMAL'};const e=new Error(p.startsWith('developer/live-content')&&window.__publishOn?'':'Switched off in this offline test');e.status=404;if(p==='developer/live-content'&&window.__publishOn)return {enabled:true,editor:true,version:1,publishedAt:1763380000,history:[{version:1,at:1763380000,action:'publish',note:'First test'}]};if(p==='developer/live-content/check')return {ok:true,errors:[],warnings:[]};throw e;}));
  await developer();await page.evaluate(()=>VoidDevTools.open('missions'));
  await page.waitForSelector('#me-root [data-me-tree="main-storyline"]',{timeout:60000});
  const trees=await page.locator('[data-me-tree]').count();assert.equal(trees,11,'the main storyline and ten archived trees');
  assert.equal(await page.locator('[data-me-archived] [data-me-tree]').count(),10,'every older tree is under "Removed from the game (archived)"');assert.equal(await page.locator('[data-me-archived]').evaluate(d=>d.open),false,'collapsed');
  assert.match(await page.locator('.me-how summary').textContent(),/PUBLISH TO ALL PLAYERS: OFF on the server/);
  assert.match(await page.locator('[data-me-mission-label="m001-awakening"]').textContent(),/Mission 001 — Awakening/);
  await page.screenshot({path:path.join(shots,'mission-editor-1366.png')});
  // How this mission starts (Mission 001: by notification, Messages, Admin, first pod exit)
  const sp=page.locator('[data-me-start="m001-awakening"]');await sp.scrollIntoViewIfNeeded();
  assert.equal(await sp.locator('[data-me-starts]').inputValue(),'comms','Starts: By Comms call');assert.deepEqual(await sp.locator('[data-me-starts] option').allTextContents(),['In person','By Messages','By Comms call','Notification only']);
  assert.ok(await page.evaluate(()=>{const st=document.querySelector('[data-me-tree-mission="m001-awakening"] [data-me-start]');return !!st.previousElementSibling.querySelector('[data-me-giver]');}),'the panel is right under Giver');
  assert.equal(await sp.locator('[data-me-start-from] ').inputValue(),'admin');assert.equal(await sp.locator('[data-me-start-header]').inputValue(),'ADMIN // INCOMING MESSAGE');assert.equal(await sp.locator('[data-me-start-when]').inputValue(),'pod-exit');
  assert.equal(await sp.locator('[data-me-start-text]').inputValue(),'You\'re awake. Good.\nWhen you\'re ready, come find me. We need to talk.');
  await sp.screenshot({path:path.join(shots,'how-this-mission-starts-1366.png')});
  assert.equal(await page.locator('[data-me-placeholder]').count(),1,'Admin\'s introduction is marked as a placeholder for the owner');
  // the archived trees: open the group, the Communion arc with the owner's locked lines, marked "not in the game", copyable
  await page.locator('[data-me-archived] summary').click();await page.locator('[data-me-tree="communion"]').click();await page.waitForSelector('.me-lock');
  assert.match(await page.locator('[data-me-archived-tree="communion"]').textContent(),/NOT IN THE GAME/);await page.locator('.me-lock').first().scrollIntoViewIfNeeded();
  assert.match(await page.locator('.me-lock').first().textContent(),/Your script — locked/);await page.screenshot({path:path.join(shots,'mission-editor-communion-1366.png')});
  // All lines for Admin
  await page.locator('[data-me-mode="npcs"]').click();await page.waitForSelector('[data-me-npc]');assert.equal(await page.locator('[data-me-npc]').inputValue(),'admin');
  assert.match(await page.locator('#me-root').textContent(),/ElevenLabs/);await page.screenshot({path:path.join(shots,'mission-editor-admin-lines-1366.png')});
  await page.setViewportSize({width:1920,height:1080});await page.locator('[data-me-mode="trees"]').click();await page.locator('[data-me-tree="main-storyline"]').click();
  await page.waitForSelector('[data-me-tree-mission="m001-awakening"]');await page.locator('[data-me-start="m001-awakening"]').scrollIntoViewIfNeeded();
  await page.screenshot({path:path.join(shots,'mission-editor-1920.png')});
  await page.locator('[data-me-start="m001-awakening"]').screenshot({path:path.join(shots,'how-this-mission-starts-1920.png')});
  // write a test introduction line for Admin, then play the draft from "Find and speak with Admin"
  const line=page.locator('[data-me-tline="speak/say/0"] textarea').first();await line.fill(EDITED);
  const draft=await page.evaluate(()=>JSON.parse(localStorage.getItem('mission-editor-drafts-v1')));assert.equal(draft.trees.find(t=>t.id==='main-storyline').missions[0].objectives[2].say[0].text,EDITED,'autosaved on every edit');
  await page.screenshot({path:path.join(shots,'mission-editor-edit-1920.png')});
  const before=await page.evaluate(()=>localStorage.getItem('void-runner-campaign-v1'));assert(before&&JSON.parse(before).story.flags.realSaveMarker===true,'the real save is in the browser');
  await page.evaluate(()=>{try{VoidGraphics.quality='low';VoidBabylon.setQuality('low');}catch{}});   // the software renderer is slow; the draft play itself is what is checked
  await page.locator('[data-me-play="tree:m001-awakening#speak"]').click();
  await page.waitForFunction(()=>!document.getElementById('dev-test-banner').hidden&&mode==='walking',null,{timeout:180000});
  assert.match(await page.locator('#dev-test-banner').textContent(),/PLAYING DRAFT: Mission 001 — Awakening — not your real save.*LEAVE DRAFT/);
  const inGame=await page.evaluate(()=>({tracked:VoidMissions.tracked(state,C)?.id,objective:VoidMissions.tracked(state,C)?.objective,steps:state.universe.missions['m001-awakening'].objectives}));
  assert.equal(inGame.tracked,'m001-awakening');assert.equal(inGame.objective,'Locate Admin');assert.deepEqual(inGame.steps,{'exit-pod':true,message:true},'started at the chosen step');
  await page.evaluate(()=>VoidInteractions.handlers.get('admin')());
  const shown=await page.evaluate(()=>speech?.lines?.map(l=>l.text)||[]);assert(shown.includes(EDITED),'Admin says the draft introduction: '+shown.join(' | '));
  await page.screenshot({path:path.join(shots,'draft-play-1920.png'),timeout:180000});
  await page.waitForTimeout(1200);
  assert.equal(await page.evaluate(()=>localStorage.getItem('void-runner-campaign-v1')),before,'the real save is untouched during draft play');
  assert(!posts.some(p=>p==='save'||p.endsWith('/save')),'no cloud save during draft play: '+posts.join(','));
  // LEAVE DRAFT: back to the editor on the same mission, draft intact
  await Promise.all([page.waitForNavigation({timeout:60000}),page.locator('#dev-test-banner button').click()]);
  await page.waitForFunction(()=>globalThis.VoidStartup?.started,null,{timeout:90000});
  assert.equal(await page.evaluate(()=>localStorage.getItem('void-runner-campaign-v1')),before,'the real save is byte-identical after leaving');
  await developer();
  await page.waitForSelector('[data-me-tree-mission="m001-awakening"]',{timeout:60000});
  assert.equal(await page.locator('[data-me-tline="speak/say/0"] textarea').first().inputValue(),EDITED,'the edit is still in the draft');
  assert.match(await page.locator('#me-status').textContent(),/Back from your draft play/);
  await page.screenshot({path:path.join(shots,'after-leave-1920.png')});
  // the publish check screen against a mocked server with publishing switched on
  await page.evaluate(()=>{window.__publishOn=true;});await page.evaluate(()=>VoidMissionEditor.refreshServer());
  await page.locator('[data-me-mode="publish"]').click();await page.waitForSelector('#me-check');
  const check=await page.locator('#me-check').textContent();assert.match(check,/What changes for players/);assert.match(check,/Mission numbers \(1\)/);assert.match(check,/Mission 001 — Awakening · Main storyline · id m001-awakening/);
  await page.screenshot({path:path.join(shots,'publish-check-1920.png'),fullPage:false});
  assert.equal(await page.locator('[data-me-publish]').isDisabled(),false,'a valid draft can be published');assert.match(await page.locator('[data-me-publish]').textContent(),/PUBLISH TO ALL PLAYERS/);
  // EXIT TO MAIN MENU during PLAY THIS DRAFT: like LEAVE DRAFT (the real save is restored by the reload) but the game opens on its main menu, not the editor
  await page.locator('[data-me-mode="trees"]').click();await page.locator('[data-me-play="tree:m001-awakening#speak"]').click();
  await page.waitForFunction(()=>!document.getElementById('dev-test-banner').hidden&&mode==='walking',null,{timeout:180000});
  await page.evaluate(()=>VoidDevTools.open());await Promise.all([page.waitForNavigation({timeout:60000}),page.locator('[data-dev="exit-menu"]').dispatchEvent('click')]);   // dispatched: in the running game the software renderer's frames are too slow for a pointer click to settle
  await page.waitForFunction(()=>globalThis.VoidStartup?.started,null,{timeout:90000});
  assert.equal(await page.evaluate(()=>localStorage.getItem('void-runner-campaign-v1')),before,'the real save is byte-identical after EXIT TO MAIN MENU from a draft');
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('mission-editor-return')),null,'the editor is not reopened');
  await page.waitForFunction(()=>mode==='menu'&&!!document.querySelector('#screen:not(.hidden) .main-menu'),null,{timeout:60000});
  await developer();await page.evaluate(()=>VoidDevTools.open('missions'));await page.waitForSelector('[data-me-tree="main-storyline"]',{timeout:60000});await page.evaluate(()=>{window.__publishOn=true;});await page.evaluate(()=>VoidMissionEditor.refreshServer());
  await page.locator('[data-me-mode="publish"]').click();await page.waitForSelector('#me-check');
  // a broken draft blocks the publish button
  await page.evaluate(()=>{const d=JSON.parse(localStorage.getItem('mission-editor-drafts-v1'));d.trees.find(t=>t.id==='main-storyline').missions[0].start.channel='fax';localStorage.setItem('mission-editor-drafts-v1',JSON.stringify(d));});
  await page.locator('[data-me-mode="trees"]').click();await page.locator('[data-me-mode="publish"]').click();
  assert.equal(await page.locator('[data-me-publish]').isDisabled(),true,'errors block publishing');assert.match(await page.locator('#me-check').textContent(),/unknown notification channel/);
  // EXIT TO MAIN MENU (Developer Tools header): out of the game into the main menu, saving as the game menu does
  await page.locator('[data-dev="exit-menu"]').click();await page.waitForFunction(()=>mode==='menu'&&document.getElementById('dev-balance').hidden&&!!document.querySelector('#screen:not(.hidden) .main-menu'),null,{timeout:30000});
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
  }
  if(process.env.ONLY!=='chain')await newTrees(browser,errors,posts);
  if(process.env.ONLY!=='trees')await chain(browser,errors,posts);
  assert.deepEqual(errors,[],'no page errors');
  console.log('mission editor browser test passed; screenshots in',shots);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
// ---------------- 5. a NEW tree: create, name, add missions, play, check, leave, publish screen ----------------
async function newTrees(browser,errors,posts){
 const ctx=await browser.newContext({viewport:{width:1366,height:768},serviceWorkers:'block'}),page=await ctx.newPage().then(async p=>{await p.addInitScript(()=>{try{if(!localStorage.getItem('mission-editor-view'))localStorage.setItem('mission-editor-view','form');}catch{}});return p;});page.on('pageerror',e=>errors.push('trees: '+e.message));
 await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));
 await page.route('**/api/**',r=>{const p=new URL(r.request().url()).pathname.replace('/api/void-runner/','');if(r.request().method()==='POST')posts.push(p);return r.fulfill({status:p==='live-content'?404:503,contentType:'application/json',body:'{"error":"offline test"}'});});
 const boot=async()=>{await page.waitForFunction(()=>globalThis.VoidStartup?.started,null,{timeout:90000});};
 await page.goto(base+'/void-runner.html');await boot();
 await page.evaluate(()=>{const s=C.startDistrictCampaign(C.fresh());s.credits=777;s.story.flags.realSaveMarker=true;localStorage.setItem('void-runner-campaign-v1',JSON.stringify({...s,savedAt:1700000000000}));localStorage.removeItem('mission-editor-drafts-v1');});
 await page.reload();await boot();
 const developer=()=>page.evaluate(()=>VoidDevTools.identity(async(p)=>{if(p==='developer/balance')return {values:VoidBalance.defaults,revision:1,preset:'NORMAL'};
  if(p==='developer/live-content'&&window.__publishOn)return {enabled:true,editor:true,version:1,publishedAt:1763380000,history:[{version:1,at:1763380000,action:'publish',note:'First test'}]};
  if(p==='developer/live-content/check')return {ok:true,errors:[],warnings:[]};const e=new Error('Switched off in this offline test');e.status=404;throw e;}));
 await developer();await page.evaluate(()=>VoidDevTools.open('missions'));await page.waitForSelector('[data-me-new-tree]',{timeout:60000});
 // create and name a tree
 await page.locator('[data-me-new-tree]').click();await page.locator('[data-me-new-name]').fill('Browser test tree');await page.locator('[data-me-new-note]').fill('Made by the browser test.');await page.locator('[data-me-create-tree]').click();
 await page.waitForSelector('[data-me-owner-tree="draft-browser-test-tree"]');assert.equal(await page.locator('[data-me-tree="draft-browser-test-tree"]').count(),1,'the new tree is listed');
 await page.locator('[data-me-rename="draft-browser-test-tree"]').fill('Renamed test tree');await page.locator('[data-me-mode="trees"]').click();
 assert.match(await page.locator('[data-me-tree="draft-browser-test-tree"]').textContent(),/Renamed test tree/,'renamed; the id is unchanged');
 // rename an existing tree too (display name only)
 await page.locator('[data-me-archived] summary').click();   // the older trees sit in the collapsed "Removed from the game (archived)" group
 await page.locator('[data-me-tree="vesper-opening"]').click();await page.locator('[data-me-rename="vesper-opening"]').fill('Old opening (renamed)');await page.locator('[data-me-tree="beginner"]').click();
 assert.match(await page.locator('[data-me-tree="vesper-opening"]').textContent(),/Old opening \(renamed\)/);
 const names=await page.evaluate(()=>JSON.parse(localStorage.getItem('mission-editor-drafts-v1')).names);assert.deepEqual(names,{'vesper-opening':'Old opening (renamed)'});
 await page.locator('[data-me-tree="draft-browser-test-tree"]').click();await page.waitForSelector('[data-me-add-mission]');
 // mission 1: Admin gives it, talk to Iris, a story flag and credits
 await page.locator('[data-me-add-mission]').click();const m1='draft-browser-test-tree-m1';await page.waitForSelector('[data-me-tree-mission="'+m1+'"]');
 const card=page.locator('[data-me-tree-mission="'+m1+'"]');
 const groups=await card.locator('[data-me-giver] optgroup').evaluateAll(gs=>gs.map(g=>({label:g.label,ids:[...g.querySelectorAll('option')].map(o=>o.value)})));
 assert.equal(groups[0].label,'In the current District game');assert(groups[0].ids.includes('admin')&&groups[0].ids.includes('iris')&&groups[0].ids.includes('milked-eva'));
 assert.equal(groups[1].label,'Earlier characters (not in the District today)');for(const id of ['rook','mara','elara','marcus'])assert(groups[1].ids.includes(id),id);
 await card.locator('[data-me-giver]').selectOption('admin');await page.waitForSelector('[data-me-giver-status="'+m1+'"]');
 assert.match(await page.locator('[data-me-giver-status="'+m1+'"]').textContent(),/can be played now.*Players can reach them today/);
 await page.locator('[data-me-tree-mission="'+m1+'"] [data-me-field="title"]').fill('TEST MISSION ONE');
 await page.locator('[data-me-tree-mission="'+m1+'"] [data-me-step-npc="step-1"]').selectOption('iris');
 await page.locator('[data-me-tree-mission="'+m1+'"] [data-me-label="step-1"]').fill('Talk to Iris (test)');
 await page.locator('[data-me-tree-mission="'+m1+'"] [data-me-tline="offer/0"] textarea').fill('TEST LINE: offered by Admin.');
 await page.locator('[data-me-tree-mission="'+m1+'"] [data-me-tline="step-1/say/0"] textarea').fill('TEST LINE: Iris says the step is done.');
 await page.locator('[data-me-tree-mission="'+m1+'"] [data-me-unlock-kind]').selectOption('flag');await page.locator('[data-me-tree-mission="'+m1+'"] [data-me-unlock-value]').fill('browserTest');await page.locator('[data-me-tree-mission="'+m1+'"] [data-me-unlock-add]').click();
 await page.locator('[data-me-tree-mission="'+m1+'"] [data-me-unlock-kind]').selectOption('credits');await page.locator('[data-me-tree-mission="'+m1+'"] [data-me-unlock-value]').fill('40');await page.locator('[data-me-tree-mission="'+m1+'"] [data-me-unlock-add]').click();
 await page.locator('[data-me-tree-mission="'+m1+'"] [data-me-unlock-kind]').selectOption('item');await page.locator('[data-me-tree-mission="'+m1+'"] [data-me-unlock-add]').click();
 assert.match(await page.locator('[data-me-tree-mission="'+m1+'"] [data-me-unlock="item"]').textContent(),/needs a code change/,'a store item is kept but marked as needing a code change');
 assert.equal(await page.locator('[data-me-play="tree:'+m1+'"]').isDisabled(),false,'mission 1 can be played');
 // mission 2: an earlier character players cannot reach (Dr. Elara Voss)
 await page.locator('[data-me-add-mission]').click();const m2='draft-browser-test-tree-m2';await page.waitForSelector('[data-me-tree-mission="'+m2+'"]');
 await page.locator('[data-me-tree-mission="'+m2+'"] [data-me-giver]').selectOption('elara');await page.locator('[data-me-tree-mission="'+m2+'"] [data-me-field="title"]').fill('TEST MISSION TWO');
 await page.locator('[data-me-tree-mission="'+m2+'"] [data-me-step-npc="step-1"]').selectOption('elara');await page.locator('[data-me-tree-mission="'+m2+'"] [data-me-label="step-1"]').fill('Talk to Dr. Voss (test)');
 await page.locator('[data-me-tree-mission="'+m2+'"] [data-me-kind="step-1"]').selectOption('talk');
 assert.match(await page.locator('[data-me-giver-status="'+m2+'"]').textContent(),/Earlier character.*Players cannot reach them today/);
 await page.locator('[data-me-mode="trees"]').click();
 const cap=await page.locator('[data-me-capability]').textContent();assert.match(cap,/PLAY THIS DRAFT: 2 of 2 mission\(s\) can be played now/);assert.match(cap,/Dr\. Elara Voss/);
 const draft=await page.evaluate(()=>JSON.parse(localStorage.getItem('mission-editor-drafts-v1')).trees.find(t=>t.id!=='main-storyline'));assert.equal(draft.id,'draft-browser-test-tree');assert.equal(draft.name,'Renamed test tree');assert.deepEqual(draft.missions.map(m=>m.id),[m1,m2]);
 await page.locator('[data-me-owner-tree]').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(shots,'new-tree-1366.png')});
 await page.locator('[data-me-tree-mission="'+m1+'"]').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(shots,'new-tree-mission-1366.png')});
 await page.setViewportSize({width:1920,height:1080});await page.locator('[data-me-capability]').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(shots,'new-tree-1920.png')});
 // play mission 1 as a draft
 const before=await page.evaluate(()=>localStorage.getItem('void-runner-campaign-v1'));
 await page.evaluate(()=>{try{VoidGraphics.quality='low';VoidBabylon.setQuality('low');}catch{}});
 await page.locator('[data-me-play="tree:'+m1+'"]').click();
 await page.waitForFunction(()=>!document.getElementById('dev-test-banner').hidden&&mode==='walking',null,{timeout:120000});
 assert.match(await page.locator('#dev-test-banner').textContent(),/PLAYING DRAFT: Mission \d{3} — TEST MISSION ONE/);
 assert.deepEqual(await page.evaluate(()=>[walkingLocation?.id,walkingLocation?.area]),['neochinatown','interior'],'draft play starts inside the District, next to Admin');
 await page.evaluate(()=>VoidInteractions.handlers.get('admin')());
 let st=await page.evaluate(m=>({tracked:state.universe.trackedMission,rec:state.universe.missions[m],lines:speech?.lines?.map(l=>l.text)||[]}),m1);
 assert.equal(st.tracked,m1,'Admin offers the new mission and it is tracked');assert(st.lines.includes('TEST LINE: offered by Admin.'),st.lines.join('|'));
 await page.evaluate(()=>{try{resumeWalking();}catch{}});const credits=await page.evaluate(()=>state.credits);
 await page.evaluate(()=>VoidInteractions.handlers.get('district-iris')());
 st=await page.evaluate(m=>({rec:state.universe.missions[m],flag:state.story.flags.mf_browserTest,paid:state.story.flags['mt_'+m],credits:state.credits,lines:speech?.lines?.map(l=>l.text)||[]}),m1);
 assert.equal(st.rec.completed,true,'talking to Iris completes the mission');assert.equal(st.flag,true,'the story flag unlock is applied');assert.equal(st.paid,true);assert.equal(st.credits,credits+40,'the credits unlock is applied');
 assert(st.lines.includes('TEST LINE: Iris says the step is done.'));
 await page.screenshot({path:path.join(shots,'new-tree-draft-play-1920.png'),timeout:180000});
 await page.waitForTimeout(1200);assert.equal(await page.evaluate(()=>localStorage.getItem('void-runner-campaign-v1')),before,'the real save is untouched');
 assert(!posts.some(p=>p==='save'||p.endsWith('/save')),'no cloud save');
 await Promise.all([page.waitForNavigation({timeout:60000}),page.locator('#dev-test-banner button').click()]);await boot();
 assert.equal(await page.evaluate(()=>localStorage.getItem('void-runner-campaign-v1')),before,'the real save is byte-identical after leaving');
 await developer();await page.waitForSelector('[data-me-owner-tree="draft-browser-test-tree"]',{timeout:60000});
 assert.equal(await page.locator('[data-me-tree-mission]').count(),2,'the tree is intact after leaving');
 // the publish check screen (mocked server, publishing on)
 await page.evaluate(()=>{window.__publishOn=true;});await page.evaluate(()=>VoidMissionEditor.refreshServer());await page.locator('[data-me-mode="publish"]').click();await page.waitForSelector('#me-check');
 assert.equal(await page.locator('[data-me-new-mission^="draft-browser"]').count(),2,'the check screen lists the new missions');assert.equal(await page.locator('[data-me-far="elara"]').count(),1,'and the giver players cannot reach');
 assert.match(await page.locator('#me-check').textContent(),/Tree names/);assert.equal(await page.locator('[data-me-publish]').isDisabled(),false,'the draft can be published');
 const content=await page.evaluate(()=>VoidMissionEditor.draftContent());assert.deepEqual(content.trees.find(t=>t.id==='draft-browser-test-tree').missions.map(m=>m.id),[m1,m2]);assert.equal(content.trees[0].id,'main-storyline','the main storyline is always sent');assert(!JSON.stringify(content).includes('"item"'),'the store item is not sent');
 await page.locator('[data-me-new-missions]').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(shots,'new-tree-publish-1920.png')});await page.setViewportSize({width:1366,height:768});await page.locator('[data-me-new-missions]').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(shots,'new-tree-publish-1366.png')});
 await ctx.close();
 // every player: a published tree is applied (fail safe otherwise)
 const c2=await browser.newContext({viewport:{width:1366,height:768},serviceWorkers:'block'}),p2=await c2.newPage();p2.on('pageerror',e=>errors.push('trees player: '+e.message));
 await p2.route('https://**/*',r=>r.abort());await p2.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));
 await p2.route('**/api/**',r=>new URL(r.request().url()).pathname.endsWith('/live-content')?r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({version:9,content})}):r.fulfill({status:503,body:'{}'}));
 await p2.goto(base+'/void-runner.html');await p2.waitForFunction(()=>globalThis.VoidStartup?.started,null,{timeout:90000});await p2.waitForFunction(()=>VoidLiveContent.current.version>0||VoidLiveContent.current.refused,null,{timeout:30000});
 const got=await p2.evaluate(m=>({def:VoidMissions.definitions[m],refused:VoidLiveContent.current.refused}),m1);assert.equal(got.refused,null,'published tree accepted: '+JSON.stringify(got.refused));assert.equal(got.def.ownerTree,'draft-browser-test-tree');
 await c2.close();
}

// ---------------- 6. The owner's chain: Admin's tree grants a ship, the player flies to Rook, meeting Rook starts Rook's tree ----------------
const L=t=>[{who:'',text:'TEST LINE: '+t}];
function chainDraft(){const step=(id,kind,x,label,say)=>({id,label,kind,npc:'',place:'',item:'',say:say?L(say):[],early:[],...x});
 const a={id:'draft-test-district-start',name:'Test: District start',note:'browser test fixture',status:'draft',seq:1,missions:[{id:'draft-test-district-start-m1',title:'TEST: ADMIN JOB',type:'side',giver:'admin',description:'',rewards:0,seq:3,offer:L('Admin offers the job.'),
  objectives:[step('step-1','talk',{npc:'iris'},'Talk to Iris (test)','Iris hands over the ship.'),step('step-2','arrive',{place:'meridian'},'Fly to Meridian (test)'),step('step-3','talk',{npc:'rook'},'Find Rook (test)','Rook says hello.')],
  ending:{npc:'',place:'',label:'',say:[]},choices:[],unlocks:[{kind:'ship',id:'starter',when:'step-1'},{kind:'location',id:'meridian',when:'step-1'},{kind:'tree',id:'draft-test-rook',when:'step-3'}]}]};
 const b={id:'draft-test-rook',name:'Test: Rook',note:'browser test fixture',status:'draft',seq:1,missions:[{id:'draft-test-rook-m1',title:'TEST: ROOK JOB',type:'side',giver:'rook',description:'',rewards:0,seq:1,offer:L('Rook offers his job.'),
  objectives:[step('step-1','talk',{npc:'nyx'},'Talk to Nyx (test)','Nyx answers.')],ending:{npc:'',place:'',label:'',say:[]},choices:[],unlocks:[]}]};
 return {version:1,missions:{},lines:{},played:{},trees:[a,b],names:{}};}
async function chain(browser,errors,posts){
 const ctx=await browser.newContext({viewport:{width:1920,height:1080},serviceWorkers:'block'}),page=await ctx.newPage().then(async p=>{await p.addInitScript(()=>{try{if(!localStorage.getItem('mission-editor-view'))localStorage.setItem('mission-editor-view','form');}catch{}});return p;});page.on('pageerror',e=>errors.push('chain: '+e.message));const log=t=>console.log('[chain] '+t);
 await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));
 await page.route('**/api/**',r=>{const p=new URL(r.request().url()).pathname.replace('/api/void-runner/','');if(r.request().method()==='POST')posts.push(p);return r.fulfill({status:p==='live-content'?404:503,contentType:'application/json',body:'{"error":"offline test"}'});});
 const boot=async()=>{await page.waitForFunction(()=>globalThis.VoidStartup?.started,null,{timeout:90000});};
 const developer=()=>page.evaluate(()=>VoidDevTools.identity(async(p)=>{if(p==='developer/balance')return {values:VoidBalance.defaults,revision:1,preset:'NORMAL'};const e=new Error('Switched off in this offline test');e.status=404;throw e;}));
 await page.goto(base+'/void-runner.html');await boot();
 await page.evaluate(d=>{const s=C.startDistrictCampaign(C.fresh());s.story.flags.realSaveMarker=true;localStorage.setItem('void-runner-campaign-v1',JSON.stringify({...s,savedAt:1700000000000}));localStorage.setItem('mission-editor-drafts-v1',JSON.stringify(d));},chainDraft());
 await page.reload();await boot();const before=await page.evaluate(()=>localStorage.getItem('void-runner-campaign-v1'));
 await developer();await page.evaluate(()=>VoidDevTools.open('missions'));await page.waitForSelector('[data-me-tree="draft-test-district-start"]',{timeout:60000});
 await page.locator('[data-me-tree="draft-test-district-start"]').click();await page.waitForSelector('[data-me-links]');
 assert.match(await page.locator('[data-me-links]').textContent(),/leads to tree “Test: Rook” from “TEST: ADMIN JOB”, at step step-3/);assert.equal(await page.locator('[data-me-tree-map]').count(),1);
 await page.locator('[data-me-links]').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(shots,'chain-links-1920.png')});
 await page.locator('[data-me-tree="draft-test-rook"]').click();await page.waitForSelector('[data-me-started-by]');assert.match(await page.locator('[data-me-links]').textContent(),/started by tree “Test: District start”/);
 await page.locator('[data-me-tree="draft-test-district-start"]').click();await page.waitForSelector('[data-me-play="tree:draft-test-district-start-m1"]');
 // 1. from the start: Admin offers, Iris grants the ship
 await page.evaluate(()=>{try{VoidGraphics.quality='low';VoidBabylon.setQuality('low');}catch{}});
 await page.locator('[data-me-play="tree:draft-test-district-start-m1"]').click();await page.waitForFunction(()=>!document.getElementById('dev-test-banner').hidden&&mode==='walking',null,{timeout:120000});
 await page.evaluate(()=>VoidInteractions.handlers.get('admin')());await page.evaluate(()=>{try{resumeWalking();}catch{}});
 assert.equal(await page.evaluate(()=>VoidInteractions.handlers.get('district-iris')()||state.universe.trackedMission),'draft-test-district-start-m1');
 let st=await page.evaluate(()=>({ship:VoidShips.hasShip(state),owned:state.ownedShips,free:state.universe.freeTravel,rook:VoidMissionContent.treeWants(state,VoidLiveContent.env,['rook'])}));
 assert(st.ship&&st.owned.includes('starter')&&st.free,'Iris’s step grants the ship: '+JSON.stringify(st));log('ship granted '+JSON.stringify(st));
 await Promise.all([page.waitForNavigation({timeout:60000}),page.locator('#dev-test-banner button').click()]);await boot();await developer();
 await page.waitForSelector('[data-me-play="tree:draft-test-district-start-m1#step-2"]',{timeout:60000});
 // 2. jump to "ship granted": PLAY THIS DRAFT FROM HERE at the flight step
 await page.evaluate(()=>{try{VoidGraphics.quality='low';VoidBabylon.setQuality('low');}catch{}});
 await page.locator('[data-me-play="tree:draft-test-district-start-m1#step-2"]').click();await page.waitForFunction(()=>!document.getElementById('dev-test-banner').hidden&&mode==='walking'&&VoidAssets.pending===0,null,{timeout:180000});
 st=await page.evaluate(()=>({wl:walkingLocation?.id,area:walkingLocation?.area,q:walkingLocation?.quarter,ship:VoidShips.hasShip(state),rec:state.universe.missions['draft-test-district-start-m1']}));log('at the pad '+JSON.stringify(st));
 assert.equal(st.area,'street');assert.equal(st.q,'port');assert(st.ship,'the ship from step 1 is there');assert.deepEqual(st.rec.objectives,{'step-1':true});
 await page.screenshot({path:path.join(shots,'chain-port-1920.png'),timeout:180000});
 // board at Pad 01 (the same call as pressing E at the ship) and fly the real route to Meridian
 await page.evaluate(()=>leaveWalking());await page.waitForFunction(()=>mode==='play',null,{timeout:300000});
 await page.evaluate(()=>{window.__iv=setInterval(()=>{const r=flight.route;VoidInput.held[r?.phase==='align'?'add':'delete'](VoidInput.bindings.warp);if(!r||r.phase!=='align'){flight.mouseX=0;flight.mouseY=0;return;}const m=flightRoutes().find(x=>x.id==='meridian');if(!m)return;const b=flightBasis(),v=m.vector,al=b.f.x*v.x+b.f.y*v.y+b.f.z*v.z,ex=b.r.x*v.x+b.r.y*v.y+b.r.z*v.z,ey=b.u.x*v.x+b.u.y*v.y+b.u.z*v.z;
  const S=window.__st||(window.__st={sx:1,sy:1,flip:1});if(S.last!==undefined&&al<S.last-.002){if(S.flip===1)S.sy=-S.sy;else S.sx=-S.sx;S.flip=-S.flip;}S.last=al;flight.mouseX=Math.max(-1,Math.min(1,ex*4))*S.sx;flight.mouseY=Math.max(-1,Math.min(1,ey*4))*S.sy;},200);});
 for(let i=0;i<200;i++){await page.waitForTimeout(8000);const f=await page.evaluate(()=>({mode,loc:state.location,phase:flight?.route?.phase,progress:flight?.route?.progress}));if(i%5===0)log('flight '+JSON.stringify(f));if(['over','arrival','dock','walking'].includes(f.mode)||f.loc!=='earth')break;}
 await page.evaluate(()=>clearInterval(window.__iv));
 for(let i=0;i<6;i++){const m=await page.evaluate(()=>mode);if(m==='walking')break;const clicked=await page.evaluate(()=>{const b=document.querySelector('#screen:not(.hidden) [data-action=dock]');if(b){b.click();return true;}return false;});await page.waitForTimeout(clicked?4000:3000);}
 await page.waitForFunction(()=>(mode==='walking'||mode==='dock')&&state.location==='meridian'&&VoidAssets.pending===0,null,{timeout:300000});await page.waitForTimeout(2000);
 st=await page.evaluate(()=>state.universe.missions['draft-test-district-start-m1']);assert.equal(st.objectives['step-2'],true,'docking at Meridian completes the flight step');log('docked at Meridian');
 await page.screenshot({path:path.join(shots,'chain-meridian-1920.png'),timeout:180000});
 // 3. meet Rook: the link fires; Rook then offers his tree's mission; Nyx completes it
 await page.evaluate(()=>VoidInteractions.handlers.get('talk')({item:{character:'rook'}}));
 st=await page.evaluate(()=>({rec:state.universe.missions['draft-test-district-start-m1'],link:state.story.flags['ts_draft-test-rook'],lines:speech?.lines?.map(l=>l.text)||[]}));
 assert.equal(st.rec.completed,true);assert.equal(st.link,true,'meeting Rook starts the Rook tree');assert(st.lines.includes('TEST LINE: Rook says hello.'));
 await page.evaluate(()=>{try{resumeWalking();}catch{}});await page.evaluate(()=>VoidInteractions.handlers.get('talk')({item:{character:'rook'}}));
 st=await page.evaluate(()=>({tracked:state.universe.trackedMission,lines:speech?.lines?.map(l=>l.text)||[]}));assert.equal(st.tracked,'draft-test-rook-m1','Rook offers the first mission of his tree');assert(st.lines.includes('TEST LINE: Rook offers his job.'));
 await page.screenshot({path:path.join(shots,'chain-rook-tree-1920.png'),timeout:180000});
 await page.evaluate(()=>{try{resumeWalking();}catch{}});await page.evaluate(()=>VoidInteractions.handlers.get('talk')({item:{character:'nyx'}}));
 assert.equal(await page.evaluate(()=>state.universe.missions['draft-test-rook-m1'].completed),true,'Nyx completes it');
 assert.equal(await page.evaluate(()=>localStorage.getItem('void-runner-campaign-v1')),before,'the real save is untouched');assert(!posts.some(p=>p==='save'||p.endsWith('/save')),'no cloud save');
 await ctx.close();
}