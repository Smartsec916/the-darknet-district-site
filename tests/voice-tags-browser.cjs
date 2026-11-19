/* ElevenLabs voice tags (the owner, 19 Nov 2026), in a real browser (offline): a draft mission whose in-person offer line is "[whispers] Keep it down, runner."
   is made in the Mission Editor (which shows the help line under the line fields, the Kokoro warning for a tag on a Kokoro-voiced character and a malformed bracket),
   then played (PLAY THIS DRAFT): talking to Admin shows the line in the conversation window WITHOUT the tag.
   Usage: node tests/serve-modern.cjs, then node tests/voice-tags-browser.cjs (SITE_TEST_URL, SHOTS=dir, BROWSER_EXECUTABLE; default the bundled Chromium, software GL). */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',shots=process.env.SHOTS||null;if(shots)fs.mkdirSync(shots,{recursive:true});
const bundled=fs.existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':'/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',exe=process.env.BROWSER_EXECUTABLE||(fs.existsSync(bundled)?bundled:null);
const log=(...a)=>console.log('[voice-tags]',...a);
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'],...(exe?{executablePath:exe}:{})});const errors=[];
 try{
  const ctx=await browser.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'}),page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));
  await page.route('**/api/**',r=>{const p=new URL(r.request().url()).pathname.replace('/api/void-runner/','');if(p==='live-content')return r.fulfill({status:404,contentType:'application/json',body:'{"error":"off"}'});return r.fulfill({status:503,contentType:'application/json',body:'{"error":"offline test"}'});});
  const boot=()=>page.waitForFunction(()=>globalThis.VoidStartup?.started,null,{timeout:180000});
  await page.goto(base+'/void-runner.html');await boot();
  await page.evaluate(()=>{const s=C.startDistrictCampaign(C.fresh());s.story.flags.podWakePending=false;s.story.flags.appearanceOffered=true;localStorage.setItem('void-runner-campaign-v1',JSON.stringify({...s,savedAt:1700000000000}));localStorage.removeItem('mission-editor-drafts-v1');localStorage.setItem('editor-tour-done','1');});
  await page.reload();await boot();
  await page.evaluate(()=>Object.assign(VoidPreparation.limits,{scene:900000,assets:900000,optional:600000,area:900000,total:1800000,module:600000,artwork:300000}));
  await page.evaluate(()=>VoidDevTools.identity(async p=>{if(p==='developer/balance')return {values:VoidBalance.defaults,revision:1,preset:'NORMAL'};const e=new Error('Switched off in this offline test');e.status=404;throw e;}));
  // ---- the Voice box: the model choice (Admin's ElevenLabs voice from the re-voice file; Eleven v4 by default), saved as a draft choice with the model
  await page.evaluate(()=>{VoidDevTools.npcFocus='admin';VoidDevTools.open('npcs');});await page.waitForSelector('[data-voice-panel="admin"] [data-voice-model]',{timeout:90000});
  const ms=page.locator('[data-voice-panel="admin"] [data-voice-model]');assert.equal(await ms.inputValue(),'eleven_v4');
  assert.match(await ms.locator('option[value="eleven_v4"]').textContent(),/Eleven v4 \(newest; supports voice tags — used for Zen Zephyr\)/);
  await ms.selectOption('eleven_flash_v2_5');await page.waitForFunction(()=>JSON.parse(localStorage.getItem('mission-editor-drafts-v1')||'{}').voices?.admin?.model==='eleven_flash_v2_5',null,{timeout:10000});
  const est=await page.locator('[data-voice-panel="admin"] [data-voice-estimate]').textContent();log('estimate with Flash:',est);assert.match(est,/with Flash v2\.5 \(an estimate/);
  if(shots){await page.locator('[data-voice-panel="admin"]').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(shots,'voice-tags-model.png')});}
  await page.locator('[data-voice-panel="admin"] [data-voice-model]').selectOption('eleven_v4');
  // ---- the editor: a new tree, a mission Admin gives in person, the offer line with a voice tag; the help line; the Kokoro warning
  await page.evaluate(()=>VoidDevTools.open('missions'));await page.waitForSelector('[data-me-new-tree]',{timeout:90000});
  await page.locator('[data-me-new-tree]').click();await page.locator('[data-me-new-name]').fill('Tags test');await page.locator('[data-me-create-tree]').click();
  const T='draft-tags-test',m1=T+'-m1';await page.waitForSelector('[data-me-owner-tree="'+T+'"]');await page.locator('[data-me-tree="'+T+'"]').click();await page.waitForSelector('[data-me-add-mission]');
  await page.locator('[data-me-add-mission]').click();await page.waitForSelector('[data-me-tree-mission="'+m1+'"]');const c1=()=>page.locator('[data-me-tree-mission="'+m1+'"]');
  await c1().locator('[data-me-giver]').selectOption('admin');await c1().locator('[data-me-field="title"]').fill('TEST: Quiet word');
  await c1().locator('[data-me-step-npc="step-1"]').selectOption('admin');await c1().locator('[data-me-label="step-1"]').fill('Talk to Admin (test)');
  assert.ok(await c1().locator('[data-me-tag-help]').count()>0,'the help line under the line fields');
  assert.match(await c1().locator('[data-me-tag-help]').first().textContent(),/You can add ElevenLabs voice tags like \[whispers\] or \[laughs\]\. Players never see them; only ElevenLabs voices use them\./);
  // a tag on a Kokoro-voiced character (Nyx): the warning; a malformed bracket: the plain problem
  const say=()=>c1().locator('[data-me-tline="step-1/say/0"]');await say().locator('select').selectOption('nyx');await say().locator('textarea').fill('[sighs] Another round?');
  const note=()=>say().locator('[data-me-tag-note]');await note().waitFor({state:'visible',timeout:10000});const nt=await note().textContent();log('warning on Nyx:',nt);assert.match(nt,/Kokoro voice, which cannot use voice tags/);
  await say().locator('textarea').fill('[Sighs Another round?');assert.match(await note().textContent(),/not closed/);
  if(shots){await say().scrollIntoViewIfNeeded();await page.screenshot({path:path.join(shots,'voice-tags-editor.png')});}
  await say().locator('select').selectOption('admin');await say().locator('textarea').fill('TEST LINE: Admin answers.');
  const starts=await c1().locator('[data-me-starts] option').evaluateAll(o=>o.map(x=>x.value));log('starts',starts.join(','));
  if(await c1().locator('[data-me-tline="offer/0"]').count()===0){await c1().locator('[data-me-starts]').selectOption(starts.includes('person')?'person':starts[0]);}
  await c1().locator('[data-me-tline="offer/0"] textarea').fill('[whispers] Keep it down, runner.');
  assert.equal(await note().count(),1);
  const content=await page.evaluate(()=>VoidMissionEditor.draftContent()),mine=content.trees.find(t=>t.id===T);assert.equal(mine.missions[0].offer[0].text,'[whispers] Keep it down, runner.','the draft keeps the tag (for the voice)');
  // ---- the game: PLAY THIS DRAFT, talk to Admin: the conversation window shows the line without the tag
  await page.evaluate(()=>{try{VoidGraphics.quality='low';VoidBabylon.setQuality('low');}catch{}});
  await page.locator('[data-me-play="tree:'+m1+'"]').click();
  await page.waitForFunction(()=>!document.getElementById('dev-test-banner').hidden&&mode==='walking',null,{timeout:900000,polling:100});
  assert.equal(await page.evaluate(m=>VoidLiveContent.env.trees.flatMap(t=>t.missions).find(x=>x.id===m).offer[0].text,m1),'Keep it down, runner.','stripped where content is adapted');
  await page.evaluate(()=>VoidInteractions.handlers.get('admin')());
  await page.waitForFunction(()=>VoidConversationUI.isOpen,null,{timeout:60000});
  const said=await page.evaluate(()=>speech.lines.map(l=>l.text));log('lines in the conversation:',JSON.stringify(said));assert.deepEqual(said,['Keep it down, runner.']);
  await page.waitForTimeout(1500);
  const shown=await page.evaluate(()=>document.body.innerText);assert.match(shown,/Keep it down, runner\./,'the line is on screen');assert.doesNotMatch(shown,/\[whispers\]/,'the tag is not on screen');
  if(shots)await page.screenshot({path:path.join(shots,'voice-tags-conversation.png'),timeout:300000});
  log('OK: the conversation window shows the line without its tag');
  assert.deepEqual(errors.filter(e=>!/reading 'update'/.test(e)),[],'no page errors');
  log('PASS');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
