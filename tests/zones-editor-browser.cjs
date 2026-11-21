/* The zones in the editor (zone-editor.js), in a real browser (offline): a mission made with "Make a mission" (Lace, talk to Lace) gets a Zone block in the Blocks view
   (+ ADD A BLOCK › Zone: Old Town turns Hostile until the mission ends), its "Zones and armed people" panel adds a city area; Developer Tools > Zones sets The Avenue to
   Neutral; the draft content carries all three and passes the game's checks. Usage: node tests/serve-modern.cjs, then node tests/zones-editor-browser.cjs (SITE_TEST_URL,
   SHOTS=dir, BROWSER_EXECUTABLE; default the bundled Chromium, software GL). */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',shots=process.env.SHOTS||null;if(shots)fs.mkdirSync(shots,{recursive:true});
const bundled=fs.existsSync('/opt/pw-browsers/chromium-1243/chrome-linux64/chrome')?'/opt/pw-browsers/chromium-1243/chrome-linux64/chrome':'/opt/pw-browsers/chromium',exe=process.env.BROWSER_EXECUTABLE||(fs.existsSync(bundled)?bundled:null);
const log=(...a)=>console.log('[zones-editor]',...a);
const shot=async(page,name,loc)=>{if(!shots)return;if(loc)await loc.screenshot({path:path.join(shots,name),timeout:240000});else await page.screenshot({path:path.join(shots,name),timeout:240000});};
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'],...(exe?{executablePath:exe}:{})});const errors=[];
 try{
  const page=await (await browser.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'})).newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));
  await page.route('**/api/**',r=>{const p=new URL(r.request().url()).pathname.replace('/api/void-runner/','');if(p==='live-content')return r.fulfill({status:404,contentType:'application/json',body:'{"error":"off"}'});return r.fulfill({status:503,contentType:'application/json',body:'{"error":"offline test"}'});});
  const boot=()=>page.waitForFunction(()=>globalThis.VoidStartup?.started,null,{timeout:180000});
  const dev=()=>page.evaluate(()=>VoidDevTools.identity(async p=>{if(p==='developer/balance')return {values:VoidBalance.defaults,revision:1,preset:'NORMAL'};const e=new Error('off');e.status=404;throw e;}));
  await page.goto(base+'/void-runner.html');await boot();
  await page.evaluate(()=>{const s=C.startDistrictCampaign(C.fresh());s.story.flags.podWakePending=false;localStorage.setItem('void-runner-campaign-v1',JSON.stringify({...s,savedAt:1700000000000}));localStorage.setItem('editor-tour-done','1');for(const k of ['editor-mode','mission-editor-drafts-v1','mission-editor-view'])localStorage.removeItem(k);});
  await page.reload();await boot();await dev();
  await page.evaluate(()=>VoidDevTools.open());await page.waitForSelector('[data-eh-task="make"]',{timeout:90000});await page.locator('[data-eh-task="make"]').click();
  await page.locator('[data-eh-template="talk"]').click();await page.waitForSelector('[data-eh-page="giver"]');await page.locator('[data-eh-giver="ethereal-lace"]').click();await page.locator('[data-eh-next]').click();
  await page.waitForSelector('[data-eh-page="start"]');await page.locator('[data-eh-start="person"]').click();await page.locator('[data-eh-next]').click();
  await page.waitForSelector('[data-eh-page="steps"]');await page.locator('[data-eh-step-npc="0"]').selectOption('ethereal-lace');await page.locator('[data-eh-next]').click();
  await page.waitForSelector('[data-eh-page="reward"]');await page.locator('[data-eh-next]').click();
  await page.waitForSelector('[data-eh-page="name"]');await page.locator('[data-eh-title]').fill('TEST: Zones');await page.locator('[data-eh-offer]').fill('TEST LINE: Lace has a job for you.');
  await page.locator('[data-eh-next]').click();await page.waitForSelector('[data-eh-done]');const mid=await page.locator('[data-eh-done]').getAttribute('data-eh-done');log('made',mid);
  await page.locator('[data-eh-open="'+mid+'"]').click();const card=page.locator('[data-me-tree-mission="'+mid+'"]');await card.waitFor();const root=card.locator('[data-mb-mission="'+mid+'"]');await root.waitFor({timeout:60000});
  // ---- the Zone block
  await root.locator('[data-me-add-step="'+mid+'"]').click();await root.locator('[data-mb-pick="zone"]').click();await shot(page,'e1-zone-choice.png',root.locator('[data-mb-picker]'));await root.locator('[data-mb-choose="zone"]').click();await page.waitForTimeout(400);
  const zid=await page.evaluate(id=>{const m=VoidMissionEditor.shared.local().trees.flatMap(t=>t.missions).find(x=>x.id===id);return m.objectives.find(o=>o.kind==='zone').id;},mid);log('zone step',zid);
  await card.locator('[data-me-step-zone-target="'+zid+'"]').selectOption('area:oldtown');await page.waitForTimeout(300);await card.locator('[data-me-step-zone="'+zid+'"]').selectOption('hostile');await page.waitForTimeout(300);
  const blk=card.locator('[data-me-tstep="'+zid+'"]');assert.match(await blk.innerText(),/Zone: Old Town → HOSTILE/);await blk.scrollIntoViewIfNeeded();await shot(page,'e2-zone-block.png',blk);
  // ---- the mission's panel: a city area while it runs
  const panel=card.locator('[data-me-zones="'+mid+'"]');await panel.scrollIntoViewIfNeeded();await panel.locator('[data-me-zone-area-add="'+mid+'"]').selectOption('avenue');await page.waitForTimeout(300);
  await card.locator('[data-me-zone-area="avenue"]').selectOption('hostile');await page.waitForTimeout(300);await card.locator('[data-me-zones="'+mid+'"]').scrollIntoViewIfNeeded();await shot(page,'e3-mission-zones.png',card.locator('[data-me-zones="'+mid+'"]'));
  // ---- Developer Tools > Zones
  await page.locator('[data-dev-tab="zones"]').click();await page.waitForSelector('[data-zones-table]',{timeout:60000});await page.locator('[data-zones-area="main-null"]').selectOption('neutral');await page.waitForTimeout(400);
  await page.locator('[data-zones-module="server-room"]').selectOption('hostile');await page.waitForTimeout(300);await shot(page,'e4-zones-tab.png');
  const r=await page.evaluate(id=>{const d=VoidMissionEditor.shared.local(),m=d.trees.flatMap(t=>t.missions).find(x=>x.id===id),c=VoidMissionEditor.draftContent();const mm=(c.trees||[]).flatMap(t=>t.missions).find(x=>x.id===id);
   const chk=VoidMissionContent.check(c,{givers:new Map(VoidLiveContent.env.givers.map(g=>[g.id,g])),places:VoidMissionGivers.placeIds()});return {zones:d.zones,combat:m.combat,step:m.objectives.find(o=>o.kind==='zone'),content:c.zones,sent:mm&&mm.combat,sentStep:mm&&mm.objectives.find(o=>o.kind==='zone'),errors:chk.errors.filter(e=>/zone|Zones|armed/i.test(e))};},mid);
  log(JSON.stringify(r));
  assert.deepEqual(r.zones,{areas:{'main-null':'neutral'},modules:{'server-room':'hostile'}});assert.deepEqual(r.content,r.zones);assert.deepEqual(r.combat,{areas:{avenue:'hostile'}});
  assert.equal(r.step.target,'area:oldtown');assert.equal(r.step.zone,'hostile');assert.ok(r.sent&&r.sentStep,'the draft content carries them');assert.deepEqual(r.errors,[]);
  assert.deepEqual(errors,[],'no page errors');log('PASS');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
