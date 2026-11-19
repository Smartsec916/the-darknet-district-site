/* ElevenLabs voice choice in Developer Tools (queue item 0b, 18 Nov 2026), in a real browser (offline): NPCs > Lines & voice shows the current voice (Kokoro read-only,
   or ElevenLabs), refuses a bad link, takes a pasted link plus a name, shows the line / character / credit estimate and a "Listen on ElevenLabs" link, UNDO takes the
   choice back, the voices file downloads in revoice-engines.json format, and the Mission Editor's giver card shows the same voice. No request ever goes to ElevenLabs.
   Usage: node tests/serve-modern.cjs, then node tests/npc-voices-browser.cjs (SITE_TEST_URL, SHOTS=dir, BROWSER_EXECUTABLE; default the bundled Chromium, software GL). */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',shots=process.env.SHOTS||null;if(shots)fs.mkdirSync(shots,{recursive:true});
const bundled=fs.existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':'/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',exe=process.env.BROWSER_EXECUTABLE||(fs.existsSync(bundled)?bundled:null);
const log=(...a)=>console.log('[npc-voices]',...a),ID='AbCdEfGhIjKlMnOpQrSt';
const shot=async(t,name)=>{if(shots)await t.screenshot({path:path.join(shots,name)});};
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'],...(exe?{executablePath:exe}:{})});const errors=[],eleven=[];
 try{
  const ctx=await browser.newContext({viewport:{width:1366,height:900},serviceWorkers:'block',acceptDownloads:true}),page=await ctx.newPage().then(async p=>{await p.addInitScript(()=>{try{if(!localStorage.getItem('mission-editor-view'))localStorage.setItem('mission-editor-view','form');}catch{}});return p;});page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(/elevenlabs/i.test(r.url()))eleven.push(r.url());});
  await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));
  await page.route('**/api/**',r=>{const p=new URL(r.request().url()).pathname.replace('/api/void-runner/','');if(p==='live-content')return r.fulfill({status:404,contentType:'application/json',body:'{"error":"off"}'});return r.fulfill({status:503,contentType:'application/json',body:'{"error":"offline test"}'});});
  const boot=()=>page.waitForFunction(()=>globalThis.VoidStartup?.started,null,{timeout:180000});
  const dev=()=>page.evaluate(()=>VoidDevTools.identity(async p=>{if(p==='developer/balance')return {values:VoidBalance.defaults,revision:1,preset:'NORMAL'};const e=new Error('Switched off in this offline test');e.status=404;throw e;}));
  await page.goto(base+'/void-runner.html');await boot();
  await page.evaluate(()=>{const s=C.startDistrictCampaign(C.fresh());s.story.flags.podWakePending=false;localStorage.setItem('void-runner-campaign-v1',JSON.stringify({...s,savedAt:1700000000000}));for(const k of ['mission-editor-drafts-v1','npc-editor-advanced'])localStorage.removeItem(k);localStorage.setItem('editor-tour-done','1');});
  await page.reload();await boot();await dev();
  await page.evaluate(()=>VoidDevTools.open('home'));await page.waitForSelector('[data-eh-cards]',{timeout:90000});   // Developer tools open on the Start page (it keeps UNDO / REDO current)
  const draft=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('mission-editor-drafts-v1')||'{}').voices||{});
  const open=async id=>{await page.evaluate(id=>{VoidDevTools.npcFocus=id;VoidDevTools.open('npcs');},id);await page.waitForSelector('[data-voice-panel="'+id+'"]',{timeout:90000});};
  // ---- a Kokoro character: read-only registered voice; an ElevenLabs one from the re-voice file
  await open('nyx');let cur=page.locator('[data-voice-panel="nyx"] [data-voice-current]');assert.equal(await cur.getAttribute('data-voice-current'),'kokoro');assert.match(await cur.textContent(),/af_river · approved · read-only/);
  assert.match(await page.locator('[data-npc-facts="nyx"]').textContent(),/Voice: free local voice af_river \(locked\)/);
  await open('admin');cur=page.locator('[data-voice-panel="admin"] [data-voice-current]');assert.equal(await cur.getAttribute('data-voice-current'),'elevenlabs');assert.match(await cur.textContent(),/set in the re-voice file/);
  assert.equal(await page.locator('[data-voice-panel="admin"] [data-voice-listen]').getAttribute('href'),'https://elevenlabs.io/voices/DMyrgzQFny3JI1Y1paM5');
  const est=await page.locator('[data-voice-panel="admin"] [data-voice-estimate]').textContent();log('admin estimate:',est);assert.match(est,/Re-voicing all of Admin’s lines: \d+ line\(s\) · [\d,]+ characters · about [\d,]+ ElevenLabs credits/);
  assert.match(await page.locator('[data-voice-panel="admin"]').textContent(),/Estimate only: about 1 credit per character/);
  // ---- Reverie: no voice yet; a bad link is refused in plain words; a pasted link plus a name is saved in the draft
  await open('grey-reverie');const P=()=>page.locator('[data-voice-panel="grey-reverie"]');
  assert.equal(await P().locator('[data-voice-current]').getAttribute('data-voice-current'),'elevenlabs');   // her voice in revoice-engines.json (19 Nov 2026)
  assert.match(await P().locator('[data-voice-street]').textContent(),/ordinary, neutral street voice/);
  await P().locator('[data-voice-choose] summary').click();
  await P().locator('[data-voice-input]').fill('https://example.com/voices/'+ID);assert.match(await P().locator('[data-voice-check]').textContent(),/Only an elevenlabs\.io link/);
  await P().locator('[data-voice-input]').fill('AbCdEf123');assert.match(await P().locator('[data-voice-check]').textContent(),/exactly 20 letters and digits/);
  await P().locator('[data-voice-input]').fill('https://elevenlabs.io/voices/'+ID);assert.match(await P().locator('[data-voice-check]').textContent(),new RegExp('✓ Voice ID '+ID));
  assert.equal(await P().locator('[data-voice-listen-new]').getAttribute('href'),'https://elevenlabs.io/voices/'+ID);assert.equal(await P().locator('[data-voice-listen-new]').getAttribute('target'),'_blank');
  await P().locator('[data-voice-save]').click();assert.match(await P().locator('[data-voice-check]').textContent(),/Give the voice a name/,'a name is needed');assert.deepEqual(await draft(),{});
  await P().locator('[data-voice-name]').fill('Gravel street vendor');await shot(P(),'01-choose-voice.png');await P().locator('[data-voice-save]').click();await page.waitForTimeout(200);
  const v=await draft();log('draft voices:',v);assert.equal(v['grey-reverie'].voiceId,ID);assert.equal(v['grey-reverie'].name,'Gravel street vendor');assert.match(v['grey-reverie'].chosen,/^\d{4}-\d{2}-\d{2} by the owner$/);
  cur=P().locator('[data-voice-current]');assert.equal(await cur.getAttribute('data-voice-current'),'elevenlabs');assert.match(await cur.textContent(),/Gravel street vendor .* your choice in this draft/);
  assert.equal(await P().locator('[data-voice-listen]').getAttribute('href'),'https://elevenlabs.io/voices/'+ID);assert.match(await page.locator('[data-npc-facts="grey-reverie"]').textContent(),/Voice: ElevenLabs — Gravel street vendor \(Eleven v4\) · LISTEN ON ELEVENLABS ↗ · your draft choice/);
  assert.match(await page.locator('#npc-root .me-status').textContent(),/Nothing was generated or paid/);await shot(P(),'02-voice-chosen.png');
  // ---- UNDO takes it back, REDO puts it back
  await page.locator('[data-dev="undo"]').click();await page.waitForTimeout(200);assert.deepEqual(await draft(),{},'UNDO removes the choice');
  await page.locator('[data-dev="redo"]').click();await page.waitForTimeout(200);assert.equal((await draft())['grey-reverie'].voiceId,ID,'REDO puts it back');
  // ---- the voices file: revoice-engines.json format, the file's own voices kept
  await open('grey-reverie');const [dl]=await Promise.all([page.waitForEvent('download'),P().locator('[data-voice-export]').click()]);assert.equal(dl.suggestedFilename(),'revoice-engines.json');
  const file=JSON.parse(fs.readFileSync(await dl.path(),'utf8')),repo=JSON.parse(fs.readFileSync(path.join(__dirname,'..','tools/audio/revoice-engines.json'),'utf8'));
  assert.deepEqual(Object.keys(file),['about','characters']);for(const k of Object.keys(repo.characters))if(k!=='grey-reverie')assert.deepEqual(file.characters[k],repo.characters[k],k);
  assert.equal(file.characters['grey-reverie'].engine,'elevenlabs');assert.equal(file.characters['grey-reverie'].voiceId,ID);assert.match(file.characters['grey-reverie'].chosen,/by the owner \(https:\/\/elevenlabs\.io\/voices\//);
  // ---- the draft content carries it and passes the same check as publishing; the editor's lines for her use it
  const c=await page.evaluate(()=>VoidMissionEditor.draftContent());assert.equal(c.voices['grey-reverie'].voiceId,ID);
  assert.deepEqual(await page.evaluate(c=>VoidMissionContent.check({format:c.format,version:c.version,voices:c.voices},{}).errors,c),[]);
  assert.equal(await page.evaluate(()=>VoidMissionEditor.shared.voiceNow('grey-reverie').voiceId),ID);
  // ---- the Mission Editor's giver card shows the same voice
  await page.evaluate(()=>{VoidMissionEditor.shared.addGiverMission('grey-reverie','voice-test-tree');VoidDevTools.open('missions');});
  const card=page.locator('[data-me-tree-mission] [data-voice-panel="grey-reverie"]').first();await card.waitFor({timeout:60000});await card.scrollIntoViewIfNeeded();
  assert.match(await card.locator('[data-voice-current]').textContent(),/Gravel street vendor/);assert.equal(await card.locator('[data-voice-export]').count(),0,'the compact card has no export');await shot(card,'03-giver-card-voice.png');
  // ---- a refused character is never offered a voice (rules checked in the page)
  assert.ok(await page.evaluate(()=>!!VoidNPCVoices.refusal('the-function')&&!!VoidNPCVoices.refusal('special-character')&&!!VoidNPCVoices.refusal('news-anchor')));
  assert.deepEqual(eleven,[],'no request to ElevenLabs (the listen links are only links)');
  assert.deepEqual(errors,[],'no page errors');log('ok');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
