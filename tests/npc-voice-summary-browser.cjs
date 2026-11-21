/* The voice summary at the top of an NPC's page (the owner, 19 Nov 2026: "show which Elevenlabs voice was selected for them. Maybe link to it"), in a real browser (offline):
   selecting Lace shows "Voice: ElevenLabs — … (Eleven v4) · LISTEN ON ELEVENLABS ↗" with her voice's page in a new tab, the EL badge in the list, Kokoro / none lines.
   No request ever goes to ElevenLabs. Usage: node tests/serve-modern.cjs, then node tests/npc-voice-summary-browser.cjs (SITE_TEST_URL, SHOTS=dir). */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',shots=process.env.SHOTS||null;if(shots)fs.mkdirSync(shots,{recursive:true});
const bundled=fs.existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':'/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',exe=process.env.BROWSER_EXECUTABLE||(fs.existsSync(bundled)?bundled:null);
const log=(...a)=>console.log('[npc-voice-summary]',...a);
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'],...(exe?{executablePath:exe}:{})});const errors=[],eleven=[];
 try{
  const page=await (await browser.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'})).newPage();page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(/elevenlabs/i.test(r.url()))eleven.push(r.url());});
  await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));
  await page.route('**/api/**',r=>r.fulfill({status:new URL(r.request().url()).pathname.endsWith('live-content')?404:503,contentType:'application/json',body:'{"error":"offline test"}'}));
  const boot=()=>page.waitForFunction(()=>globalThis.VoidStartup?.started,null,{timeout:180000});
  await page.goto(base+'/void-runner.html');await boot();
  await page.evaluate(()=>{const s=C.startDistrictCampaign(C.fresh());s.story.flags.podWakePending=false;localStorage.setItem('void-runner-campaign-v1',JSON.stringify({...s,savedAt:1700000000000}));for(const k of ['mission-editor-drafts-v1','npc-editor-advanced'])localStorage.removeItem(k);localStorage.setItem('editor-tour-done','1');});
  await page.reload();await boot();
  await page.evaluate(()=>VoidDevTools.identity(async p=>{if(p==='developer/balance')return {values:VoidBalance.defaults,revision:1,preset:'NORMAL'};const e=new Error('off');e.status=404;throw e;}));
  const open=async id=>{await page.evaluate(id=>{VoidDevTools.npcFocus=id;VoidDevTools.open('npcs');},id);await page.waitForSelector('[data-npc-facts="'+id+'"] [data-voice-summary]',{timeout:90000});return page.locator('[data-npc-facts="'+id+'"] [data-voice-summary]');};
  for(const [who,id,nm] of [['ethereal-lace','KR1TkIhkSykEjI4B0DtH','Lace'],['grey-reverie','n7Wi4g1bhpw4Bs8HK5ph','Reverie'],['dax','3WOiQKby7odOR8Z57fNQ','Dax']]){
   const s=await open(who),t=(await s.textContent()).replace(/\s+/g,' ');log(who+':',t);
   assert.match(t,new RegExp('^Voice: ElevenLabs — the voice chosen for '+nm+' on 19 Nov 2026 \\(Eleven v4\\) · LISTEN ON ELEVENLABS ↗ · saved in the voice file'));
   const a=s.locator('[data-voice-summary-listen]');assert.equal(await a.getAttribute('href'),'https://elevenlabs.io/voices/'+id);assert.equal(await a.getAttribute('target'),'_blank');assert.match(await a.getAttribute('rel'),/noopener/);
   assert.equal(await page.locator('[data-npc-voice-badge="'+who+'"]').count(),1,who+' has the EL badge in the list');
   if(who==='ethereal-lace'&&shots)await page.locator('#npc-root').screenshot({path:path.join(shots,'lace-voice-summary.png')});}
  // Basic and Advanced both show it
  await page.evaluate(()=>{localStorage.setItem('npc-editor-advanced','1');});const s2=await open('ethereal-lace');assert.match(await s2.textContent(),/LISTEN ON ELEVENLABS/);
  await page.evaluate(()=>{localStorage.removeItem('npc-editor-advanced');});
  assert.match(await (await open('nyx')).textContent(),/^Voice: free local voice af_river \(locked\)$/);assert.equal(await page.locator('[data-npc-voice-badge="nyx"]').count(),0);
  log('EL badges in the list:',await page.locator('[data-npc-voice-badge]').count());
  // the giver card names the model too
  await page.evaluate(()=>{VoidMissionEditor.shared.addGiverMission('ethereal-lace','voice-sum-tree');VoidDevTools.open('missions');});
  const card=page.locator('[data-me-tree-mission] [data-voice-panel="ethereal-lace"] [data-voice-current]').first();await card.waitFor({timeout:60000});
  const ct=await card.textContent();log('giver card:',ct);assert.match(ct,/\(Eleven v4\)/);assert.match(ct,/Listen on ElevenLabs/);
  assert.deepEqual(eleven,[],'no request to ElevenLabs');assert.deepEqual(errors,[]);log('PASS');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
