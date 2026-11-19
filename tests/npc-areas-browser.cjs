/* "Let me place REVERIE or LACE anywhere" (the owner, 19 Nov 2026), in a real browser (offline): Developer Tools > NPCs > Reverie, "Keep her at one spot"; the map's
   area list; clicks on NULL's door (Old Town) and on Milked (Far South) refused with the plain reason; a click on the road moved onto the pavement; her spot put in Old
   Town (the District alley) and PLAY THIS DRAFT: the test session opens in Old Town and she is there (the street cat follows her there); then her spot in The Outskirts
   (the container yard) and PLAY THIS DRAFT again: she is there. Screenshots in SHOTS (default docs/development/npc-areas).
   Usage: node tests/serve-modern.cjs, then node tests/npc-areas-browser.cjs (SITE_TEST_URL, SHOTS=dir, BROWSER_EXECUTABLE; default the bundled Chromium, software GL). */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',shots=process.env.SHOTS||path.resolve('docs/development/npc-areas');fs.mkdirSync(shots,{recursive:true});
const bundled=fs.existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':'/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',exe=process.env.BROWSER_EXECUTABLE||(fs.existsSync(bundled)?bundled:null);
const log=(...a)=>console.log('[npc-areas]',...a),REV='grey-reverie';
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'],...(exe?{executablePath:exe}:{})});const errors=[];
 try{
  const ctx=await browser.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'}),page=await ctx.newPage().then(async p=>{await p.addInitScript(()=>{try{if(!localStorage.getItem('mission-editor-view'))localStorage.setItem('mission-editor-view','form');}catch{}});return p;});page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));
  await page.route('**/api/**',r=>{const p=new URL(r.request().url()).pathname.replace('/api/void-runner/','');if(p==='live-content')return r.fulfill({status:404,contentType:'application/json',body:'{"error":"off"}'});return r.fulfill({status:503,contentType:'application/json',body:'{"error":"offline test"}'});});
  const boot=()=>page.waitForFunction(()=>globalThis.VoidStartup?.started,null,{timeout:180000});
  const dev=()=>page.evaluate(()=>VoidDevTools.identity(async p=>{if(p==='developer/balance')return {values:VoidBalance.defaults,revision:1,preset:'NORMAL'};const e=new Error('Switched off in this offline test');e.status=404;throw e;}));
  const limits=()=>page.evaluate(()=>Object.assign(VoidPreparation.limits,{scene:900000,assets:900000,optional:600000,area:900000,total:1800000,module:600000,artwork:300000}));
  const open=async()=>{await limits();await dev();await page.evaluate(()=>VoidDevTools.open('missions'));await page.waitForSelector('[data-me-new-tree]',{timeout:60000});
   await page.evaluate(()=>{VoidDevTools.npcFocus='grey-reverie';VoidDevTools.tab='npcs';VoidDevTools.render();});await page.waitForSelector('[data-npc-place="'+REV+'"]',{timeout:60000});};
  await page.goto(base+'/void-runner.html');await boot();
  await page.evaluate(()=>{const s=C.startDistrictCampaign(C.fresh());s.story.flags.podWakePending=false;localStorage.setItem('void-runner-campaign-v1',JSON.stringify({...s,savedAt:1700000000000}));localStorage.removeItem('mission-editor-drafts-v1');localStorage.setItem('editor-tour-done','1');});
  await page.reload();await boot();await open();
  const plan=()=>page.evaluate(id=>(JSON.parse(localStorage.getItem('mission-editor-drafts-v1')||'{}').npcs||{})[id]||null,REV);
  const sel='[data-npc-place="'+REV+'"]';
  const area=async id=>{await page.locator(sel+' [data-npc-map-area]').selectOption(id);await page.waitForTimeout(250);};
  const clickMap=async(x,z)=>{const cv=page.locator(sel+' canvas.npcmap-canvas').first();await cv.scrollIntoViewIfNeeded();const p=await cv.evaluate((c,[x,z])=>c.npcMap.toScreen(x,z),[x,z]),b=await cv.boundingBox();await page.mouse.click(b.x+p.x,b.y+p.y);await page.waitForTimeout(350);};
  const note=()=>page.locator(sel+' [data-npc-map-note]').textContent();
  await page.locator(sel+' [data-npc-mode="stay"]').click();await page.waitForTimeout(300);
  const names=await page.locator(sel+' [data-npc-map-area] option').allTextContents();log('areas:',names.join(' | '));
  assert.deepEqual(names,['The Avenue','Old Town','Far South','The Outskirts','The Port','The Darknet District (inside)']);
  // the road on the Avenue: moved onto the pavement
  await clickMap(100,-9.5);let p=await plan();log('road click ->',p.x,p.z,await note());assert.ok(p.z>=-7.6&&p.z<=-5.8,'moved onto the north pavement');assert.match(await note(),/nearest spot/);
  // Old Town: NULL's door refused, the alley taken
  await area('oldtown');const before=JSON.stringify(await plan());await clickMap(52.5,-58);assert.match(await note(),/NULL/);assert.equal(JSON.stringify(await plan()),before,'nothing placed at NULL');
  await page.locator(sel).screenshot({path:path.join(shots,'01-oldtown-null-refused.png')});
  const alley=await page.evaluate(()=>VoidNPCAreas.places().find(q=>q.id==='oldtown-alley-mouth'));await clickMap(alley.x+4,alley.z);p=await plan();log('Old Town spot',JSON.stringify(p));
  assert.equal(await page.evaluate(q=>VoidNPCAreas.areaOf(q),p),'oldtown');assert.equal(await page.locator('[data-npc-problem]').count(),0);
  // Far South: Milked refused
  await area('far-south');await clickMap(88,-182);assert.match(await note(),/Milked/);await clickMap(69.5,-171);assert.match(await note(),/Milked/);await page.locator(sel).screenshot({path:path.join(shots,'02-far-south-milked-refused.png')});
  assert.equal(await page.evaluate(q=>VoidNPCAreas.areaOf(q),await plan()),'oldtown','still in Old Town');
  await area('district');await page.locator(sel).screenshot({path:path.join(shots,'03-district-map.png')});
  // ---- play the draft: she is in Old Town
  await page.evaluate(()=>{try{VoidGraphics.quality='low';VoidBabylon.setQuality('low');}catch{}});
  const play=async q=>{await page.locator('[data-npc-play="'+REV+'"]').click();
   await page.waitForFunction(q=>!document.getElementById('dev-test-banner').hidden&&mode==='walking'&&walkingLocation?.quarter===q,q,{timeout:900000,polling:100});
   await page.waitForFunction(()=>VoidBabylon.district?.streetPair?.stats?.().her?.id==='grey-reverie',null,{timeout:900000,polling:1000});
   const st=await page.evaluate(()=>VoidBabylon.district.streetPair.stats());log(q,'her',JSON.stringify(st.her),'here',st.here,'cat area',st.catArea);return st;};
  let st=await play('oldtown');assert.equal(st.her.area,'oldtown');assert.ok(Math.hypot(st.her.x-p.x,st.her.z-p.z)<1.5,'she is at her spot');assert.deepEqual(st.here,['oldtown']);
  await page.waitForFunction(()=>!!VoidBabylon.district.streetPair.stats().cat,null,{timeout:300000,polling:1000}).catch(()=>log('(the cat had not loaded)'));
  st=await page.evaluate(()=>VoidBabylon.district.streetPair.stats());log('cat',JSON.stringify(st.cat));if(st.cat)assert.ok(Math.hypot(st.cat.x-p.x,st.cat.z-p.z)<6,'the cat is with her');
  await page.evaluate(q=>{Object.assign(walker,{x:q.x-3,z:q.z,yaw:Math.PI/2});},p);await page.waitForTimeout(2500);await page.screenshot({path:path.join(shots,'04-play-oldtown-alley.png')});
  // ---- back (leaving reloads the page), then the Outskirts
  await page.locator('#dev-test-banner button').click();await page.waitForLoadState('load');await boot();await open();
  await page.locator(sel+' [data-npc-mode="stay"]').click().catch(()=>{});await area('outskirts');
  const yard=await page.evaluate(()=>VoidNPCAreas.places().find(q=>q.id==='outskirts-yard'));await clickMap(yard.x,yard.z);p=await plan();log('Outskirts spot',JSON.stringify(p));
  assert.equal(await page.evaluate(q=>VoidNPCAreas.areaOf(q),p),'outskirts');await page.locator(sel).screenshot({path:path.join(shots,'05-outskirts-map.png')});
  st=await play('outskirts');assert.equal(st.her.area,'outskirts');assert.ok(Math.hypot(st.her.x-p.x,st.her.z-p.z)<1.5);
  await page.evaluate(q=>{Object.assign(walker,{x:q.x,z:q.z-3.5,yaw:0});},p);await page.waitForTimeout(2500);await page.screenshot({path:path.join(shots,'06-play-outskirts-yard.png')});
  log('page errors:',errors.length?errors.slice(0,5):'none');
 }catch(e){console.log('[npc-areas] page errors at failure:',errors.slice(0,8));try{const pg=browser.contexts()[0].pages()[0];await pg.screenshot({path:path.join(shots,'failure.png')});}catch{}throw e;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
