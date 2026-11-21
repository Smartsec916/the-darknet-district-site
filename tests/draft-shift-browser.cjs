/* Draft tests at the time Reverie or Lace is really out (the owner, 19 Nov 2026), in a real browser (offline): the page's real clock is put at 06:30 UTC (Reverie's
   shift). A new tree: a mission Lace gives, whose step is to talk to Reverie. PLAY THIS DRAFT runs on a simulated street clock at 15:00 UTC: Lace is on The Avenue (not
   Reverie), Studio 1 at Milked has Reverie, Lace's mission is available, the plain notice says Reverie isn't out, and the banner shows the street and in-game clocks.
   LEAVE DRAFT reloads the page and the street clock is the real time again (Reverie).
   Usage: node tests/serve-modern.cjs, then node tests/draft-shift-browser.cjs (SITE_TEST_URL, SHOTS=dir, BROWSER_EXECUTABLE; default the bundled Chromium, software GL). */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',shots=process.env.SHOTS||path.resolve('docs/development/draft-shift');fs.mkdirSync(shots,{recursive:true});
const bundled=fs.existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':'/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',exe=process.env.BROWSER_EXECUTABLE||(fs.existsSync(bundled)?bundled:null);
const log=(...a)=>console.log('[draft-shift]',...a);
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'],...(exe?{executablePath:exe}:{})});const errors=[];
 try{
  const ctx=await browser.newContext({viewport:{width:1366,height:800},serviceWorkers:'block'}),page=await ctx.newPage().then(async p=>{await p.addInitScript(()=>{try{if(!localStorage.getItem('mission-editor-view'))localStorage.setItem('mission-editor-view','form');}catch{}});return p;});page.on('pageerror',e=>errors.push(e.message));
  // the real clock of this page reads 06:30 UTC today (Reverie's shift), and keeps running
  await page.addInitScript(()=>{const d=new Date(),t=Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate(),6,30),o=Date.now,off=t-o.call(Date);Date.now=()=>o.call(Date)+off;});
  await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));
  await page.route('**/api/**',r=>{const p=new URL(r.request().url()).pathname.replace('/api/void-runner/','');if(p==='live-content')return r.fulfill({status:404,contentType:'application/json',body:'{"error":"off"}'});return r.fulfill({status:503,contentType:'application/json',body:'{"error":"offline test"}'});});
  const boot=()=>page.waitForFunction(()=>globalThis.VoidStartup?.started,null,{timeout:120000});
  await page.goto(base+'/void-runner.html');await boot();
  await page.evaluate(()=>{const s=C.startDistrictCampaign(C.fresh());s.story.flags.podWakePending=false;localStorage.setItem('void-runner-campaign-v1',JSON.stringify({...s,savedAt:1700000000000}));});
  await page.reload();await boot();
  assert.equal(await page.evaluate(()=>new Date(Date.now()).getUTCHours()),6);assert.equal(await page.evaluate(()=>VoidStreetPair.onStreet(VoidStreetPair.streetTime()).id),'grey-reverie','real time: Reverie');
  await page.evaluate(()=>Object.assign(VoidPreparation.limits,{scene:900000,assets:900000,optional:600000,area:900000,total:1800000,module:600000,artwork:300000}));
  await page.evaluate(()=>VoidDevTools.identity(async p=>{if(p==='developer/balance')return {values:VoidBalance.defaults,revision:1,preset:'NORMAL'};const e=new Error('Switched off in this offline test');e.status=404;throw e;}));
  await page.evaluate(()=>VoidDevTools.open('missions'));await page.waitForSelector('[data-me-new-tree]',{timeout:60000});
  await page.locator('[data-me-new-tree]').click();await page.locator('[data-me-new-name]').fill('Lace test');await page.locator('[data-me-create-tree]').click();
  const T='draft-lace-test',m1=T+'-m1';await page.waitForSelector('[data-me-owner-tree="'+T+'"]');await page.locator('[data-me-tree="'+T+'"]').click();
  await page.locator('[data-me-add-mission]').click();await page.waitForSelector('[data-me-tree-mission="'+m1+'"]');const c1=()=>page.locator('[data-me-tree-mission="'+m1+'"]');
  await c1().locator('[data-me-giver]').selectOption('ethereal-lace');await c1().locator('[data-me-field="title"]').fill('TEST: Lace asks');await c1().locator('[data-me-starts]').selectOption('person-accept');
  await c1().locator('[data-me-tline="offer/0"] textarea').fill('TEST LINE: Lace offers it.');await c1().locator('[data-me-kind="step-1"]').selectOption('talk');await c1().locator('[data-me-step-npc="step-1"]').selectOption('grey-reverie');await c1().locator('[data-me-label="step-1"]').fill('Talk to Reverie (test)');await c1().locator('[data-me-label="step-1"]').dispatchEvent('change');
  await c1().locator('[data-me-tline="step-1/say/0"] textarea').fill('TEST LINE: Reverie answers.');await c1().locator('[data-me-tline="step-1/say/0"] textarea').dispatchEvent('change');await page.waitForTimeout(800);log('draft step',JSON.stringify(await page.evaluate(id=>JSON.parse(localStorage.getItem('mission-editor-drafts-v1')).trees.flatMap(t=>t.missions).find(m=>m.id===id)?.objectives,m1)));
  await page.evaluate(()=>{try{VoidGraphics.quality='low';VoidBabylon.setQuality('low');}catch{}});
  // PLAY IT NOW's path (the start page's wizard; the same play() as PLAY THIS DRAFT, after a rebuild of the edited draft)
  await page.evaluate(id=>{VoidMissionEditor.shared.playTree(id);},m1);
  await page.waitForFunction(()=>!document.getElementById('dev-test-banner').hidden&&mode==='walking'&&walkingLocation?.quarter==='avenue',null,{timeout:900000,polling:50});
  const notice=await page.evaluate(()=>document.getElementById('notice').textContent);log('notice:',notice);
  assert.match(notice,/Testing at 15:00 UTC, Lace's shift\. Reverie isn't out then\./);
  const r=await page.evaluate(()=>({sim:VoidStreetPair.simulated(),hour:new Date(VoidStreetPair.streetTime()).getUTCHours(),out:VoidStreetPair.onStreet(VoidStreetPair.streetTime())?.id,studio1:VoidMilked.studioOnePerformer().look,
   lace:VoidMissionGivers.onDuty(VoidLiveContent.env.givers.find(g=>g.id==='ethereal-lace')),rev:VoidMissionGivers.onDuty(VoidLiveContent.env.givers.find(g=>g.id==='grey-reverie')),flags:Object.keys(state.story.flags).filter(k=>/streetTime|streetClock|skew|simulat/i.test(k))}));
  log(JSON.stringify(r));assert.deepEqual([r.sim,r.hour,r.out,r.studio1,r.lace,r.rev],[true,15,'ethereal-lace','npc-grey-reverie',true,false]);assert.deepEqual(r.flags,[],'nothing in the save');
  await page.waitForTimeout(1500);const banner=await page.evaluate(()=>document.getElementById('dev-test-banner').textContent);log('banner:',banner);assert.match(banner,/Street 15:0\d UTC \(test\)/);assert.match(banner,/In-game \d\d:\d\d · DAY \d+/);
  await page.evaluate(()=>{Object.assign(walker,{x:100,z:-14,yaw:0,pitch:.1});});await page.waitForFunction(()=>VoidAssets.pending===0,null,{timeout:900000});
  await page.waitForFunction(()=>VoidBabylon.district?.streetPair?.stats?.().her?.id==='ethereal-lace',null,{timeout:900000,polling:1000});
  const s=await page.evaluate(()=>VoidBabylon.district.streetPair.stats());log('street pair:',JSON.stringify({onShift:s.onShift,onStreet:s.onStreet,her:s.her&&[s.her.id,s.her.x.toFixed(1),s.her.z.toFixed(1)]}));
  assert.equal(s.onShift,'ethereal-lace');assert.equal(s.onStreet,'ethereal-lace');
  await page.evaluate(()=>{const h=VoidBabylon.district.streetPair.her;Object.assign(h.s,{mode:'stop',left:9999,clip:'idle',device:null,face:null,sub:'test',x:100,z:-6.85,yaw:Math.PI});VoidBabylon.district.streetPair.tick(.3);Object.assign(walker,{x:100,z:-11,yaw:0,pitch:.08});});
  await page.waitForTimeout(3000);await page.evaluate(()=>{announce(document.getElementById('notice').textContent||'');});await page.screenshot({path:path.join(shots,'lace-draft-at-reverie-hour.png'),timeout:300000});
  // leaving ends the simulated clock
  await page.locator('#dev-test-banner button').click();await page.waitForLoadState('load');await boot();
  assert.deepEqual(await page.evaluate(()=>[VoidStreetPair.simulated(),VoidStreetPair.onStreet(VoidStreetPair.streetTime())?.id]),[false,'grey-reverie'],'after LEAVE DRAFT: the real time again');
  assert.deepEqual(errors,[],'no page errors');log('PASS');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
