/* Focused Dev Tools capability browser regression: a registered NPC without a walking TALK prompt can create a notification-started mission through the existing NPC tab. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187';
const bundled=fs.existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':'/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',exe=process.env.BROWSER_EXECUTABLE||(fs.existsSync(bundled)?bundled:null);
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader'],...(exe?{executablePath:exe}:{})});
 const errors=[];
 try{
  const ctx=await browser.newContext({viewport:{width:1366,height:850},serviceWorkers:'block'}),page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));
  await page.route('**/api/**',r=>{const p=new URL(r.request().url()).pathname.replace('/api/void-runner/','');if(p==='live-content')return r.fulfill({status:404,contentType:'application/json',body:'{"error":"off"}'});return r.fulfill({status:503,contentType:'application/json',body:'{"error":"offline test"}'});});
  await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>globalThis.VoidStartup?.started,null,{timeout:120000});
  await page.evaluate(()=>{const s=C.startDistrictCampaign(C.fresh());s.story.flags.podWakePending=false;localStorage.setItem('void-runner-campaign-v1',JSON.stringify({...s,savedAt:1700000000000}));});
  await page.reload();await page.waitForFunction(()=>globalThis.VoidStartup?.started,null,{timeout:120000});
  await page.evaluate(()=>VoidDevTools.identity(async p=>{if(p==='developer/balance')return {values:VoidBalance.defaults,revision:1,preset:'NORMAL'};const e=new Error('offline');e.status=404;throw e;}));
  await page.evaluate(()=>{VoidDevTools.npcFocus='rin-takeda';VoidDevTools.open('npcs');});
  await page.waitForSelector('[data-npc-giver="rin-takeda"]',{timeout:60000});
  const b=page.locator('[data-npc-make-giver="rin-takeda"]');assert.equal(await b.isDisabled(),false,'no-TALK NPC mission button is enabled');
  assert.match(await page.locator('[data-npc-facts="rin-takeda"]').textContent(),/Device-started missions/i);
  await b.click();
  await page.waitForSelector('[data-me-tree-mission]',{timeout:60000});
  const draft=await page.evaluate(()=>JSON.parse(localStorage.getItem('mission-editor-drafts-v1')));
  const missions=(draft.trees||[]).flatMap(t=>t.missions||[]),m=missions.find(x=>x.giver==='rin-takeda');
  assert.ok(m,'Rin mission exists');assert.equal(m.start?.how,'notification');assert.equal(m.start?.channel,'notify');assert.equal(m.start?.from,'rin-takeda');
  const card=page.locator('[data-me-tree-mission="'+m.id+'"]');await card.waitFor();
  assert.equal(await card.locator('[data-me-starts]').inputValue(),'notify');
  assert.match(await card.locator('[data-me-giver-status="'+m.id+'"]').textContent(),/notification-started mission/i);
  assert.deepEqual(errors,[]);
  console.log('NPC capability browser regression passed:',m.id);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
