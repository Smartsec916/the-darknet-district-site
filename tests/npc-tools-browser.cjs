/* Developer Tools > Mission Editor and > NPCs, 18 Nov 2026, in a real browser (offline): help text, "Guide me", "Giver waits at" placed on the map, the NPCs tab (start card,
   list, 3D preview with clips, a route made on the map, lines and voice), then PLAY THIS DRAFT: Reverie waits at the spot while her mission waits; and the NPC tab's own
   draft play: Reverie walks the route. Usage: node tests/serve-modern.cjs, then node tests/npc-tools-browser.cjs (SITE_TEST_URL, SHOTS=dir, BROWSER_EXECUTABLE; default the
   bundled Chromium, software GL). PART=editor runs only the editor part (fast). */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',shots=process.env.SHOTS||path.resolve('docs/development/npc-tools');fs.mkdirSync(shots,{recursive:true});
const bundled=fs.existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':'/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',exe=process.env.BROWSER_EXECUTABLE||(fs.existsSync(bundled)?bundled:null);
const log=(...a)=>console.log('[npc-tools]',...a),PART=process.env.PART||'all';
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'],...(exe?{executablePath:exe}:{})});const errors=[];
 try{
  const ctx=await browser.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'}),page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));
  await page.route('**/api/**',r=>{const p=new URL(r.request().url()).pathname.replace('/api/void-runner/','');if(p==='live-content')return r.fulfill({status:404,contentType:'application/json',body:'{"error":"off"}'});return r.fulfill({status:503,contentType:'application/json',body:'{"error":"offline test"}'});});
  const boot=()=>page.waitForFunction(()=>globalThis.VoidStartup?.started,null,{timeout:180000});
  const dev=()=>page.evaluate(()=>VoidDevTools.identity(async p=>{if(p==='developer/balance')return {values:VoidBalance.defaults,revision:1,preset:'NORMAL'};const e=new Error('Switched off in this offline test');e.status=404;throw e;}));
  const limits=()=>page.evaluate(()=>Object.assign(VoidPreparation.limits,{scene:900000,assets:900000,optional:600000,area:900000,total:1800000,module:600000,artwork:300000}));
  await page.goto(base+'/void-runner.html');await boot();
  await page.evaluate(()=>{const s=C.startDistrictCampaign(C.fresh());s.story.flags.podWakePending=false;localStorage.setItem('void-runner-campaign-v1',JSON.stringify({...s,savedAt:1700000000000}));localStorage.removeItem('editor-guide-on');});
  await page.reload();await boot();await limits();await dev();
  await page.evaluate(()=>VoidDevTools.open('missions'));await page.waitForSelector('[data-me-new-tree]',{timeout:60000});
  const next=()=>page.evaluate(()=>{const n=document.querySelector('.eg-next');if(!n)return null;const a=[...n.attributes].filter(x=>x.name.startsWith('data-')).map(x=>x.name+'='+x.value).join(' ');return {a,label:n.nextElementSibling?.classList.contains('eg-label')?n.nextElementSibling.textContent:''};});
  // ---- A. Guide me + help text
  await page.locator('[data-me-new-tree]').click();await page.waitForTimeout(150);let g=await next();log('guide:',g);assert.match(g.a,/data-me-new-name/);
  await page.screenshot({path:path.join(shots,'01-guide-new-tree.png')});
  await page.locator('[data-me-new-name]').fill('Avenue errands');await page.waitForTimeout(450);
  await page.locator('[data-me-create-tree]').click();const T='draft-avenue-errands',m1=T+'-m1';await page.waitForSelector('[data-me-owner-tree="'+T+'"]');await page.waitForTimeout(150);
  g=await next();log('guide:',g);assert.match(g.a,/data-me-add-mission/);
  await page.locator('[data-me-add-mission]').click();await page.waitForSelector('[data-me-tree-mission="'+m1+'"]');await page.waitForTimeout(200);const c1=()=>page.locator('[data-me-tree-mission="'+m1+'"]');
  g=await next();log('guide:',g);assert.match(g.a,/data-me-field=title/);assert.match(g.label,/needs a name/);
  await c1().locator('[data-me-field="title"]').fill('TEST: Reverie needs a hand');await page.waitForTimeout(500);g=await next();log('guide:',g);assert.match(g.a,/data-me-giver/);
  await c1().screenshot({path:path.join(shots,'02-guide-next-giver-and-help.png')});
  await c1().locator('[data-me-giver]').selectOption('grey-reverie');await page.waitForSelector('[data-me-wait-at="'+m1+'"]');await page.waitForTimeout(200);
  g=await next();log('guide:',g);assert.match(g.a,/data-me-step-npc=step-1/);
  const helps=await c1().locator('.me-help').count();assert.ok(helps>=15,'help text under the settings: '+helps);
  assert.match(await c1().locator('[data-me-help-location]').textContent(),/does NOT move anyone/);
  for(const sel of ['[data-me-starts]','[data-me-kind="step-1"]','[data-me-step-via="step-1"]'])assert.ok((await c1().locator(sel).evaluate(e=>e.parentElement.querySelector('.me-help')?.textContent||'')).length>20,sel+' has its help');
  await c1().locator('[data-me-kind="step-1"]').evaluate(e=>e.parentElement.querySelector('.me-help-all').open=true);await c1().locator('[data-me-kind="step-1"]').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(shots,'03-help-step-kinds.png')});
  await c1().locator('[data-me-kind="step-1"]').evaluate(e=>e.parentElement.querySelector('.me-help-all').open=false);
  await c1().locator('[data-me-step-npc="step-1"]').selectOption('grey-reverie');await page.waitForTimeout(250);g=await next();assert.match(g.a,/data-me-label=step-1/);
  await c1().locator('[data-me-label="step-1"]').fill('Talk to Reverie (test)');await page.waitForTimeout(500);
  await c1().locator('[data-me-tline="offer/0"] textarea').fill('TEST LINE: could you help me with something?');await page.waitForTimeout(500);
  g=await next();log('guide (all filled):',g);assert.match(g.a,/data-me-play=tree:/);assert.ok(await page.locator('.eg-done').count());
  // ---- B/C. Giver waits at: click the map
  const spot={x:96,z:-6.3};
  const clickMap=async(sel,x,z)=>{const cv=page.locator(sel+' canvas.npcmap-canvas').first();await cv.scrollIntoViewIfNeeded();const p=await cv.evaluate((c,[x,z])=>c.npcMap.toScreen(x,z),[x,z]),b=await cv.boundingBox();await page.mouse.click(b.x+p.x,b.y+p.y);};
  await clickMap('[data-me-wait-at="'+m1+'"]',spot.x,spot.z);await page.waitForTimeout(300);
  const wait=await page.evaluate(id=>JSON.parse(localStorage.getItem('mission-editor-drafts-v1')).trees.find(t=>t.missions.some(m=>m.id===id)).missions.find(m=>m.id===id).waitAt,m1);log('waitAt',wait);
  assert.ok(Math.abs(wait.x-spot.x)<.6&&Math.abs(wait.z-spot.z)<.6,'saved where clicked');
  await clickMap('[data-me-wait-at="'+m1+'"]',96,-12);await page.waitForTimeout(300);   // the road: snapped onto the pavement
  const w2=await page.evaluate(id=>JSON.parse(localStorage.getItem('mission-editor-drafts-v1')).trees.find(t=>t.missions.some(m=>m.id===id)).missions.find(m=>m.id===id).waitAt,m1);assert.ok(w2.z>=-7.6,'snapped onto the pavement');
  await clickMap('[data-me-wait-at="'+m1+'"]',spot.x,spot.z);await page.waitForTimeout(300);
  assert.match(await page.locator('[data-me-wait-text="'+m1+'"]').textContent(),/Spot: x 9[56]/);
  await page.locator('[data-me-wait-at="'+m1+'"]').screenshot({path:path.join(shots,'04-giver-waits-at-map.png')});
  const content=await page.evaluate(()=>VoidMissionEditor.draftContent());assert.ok(content.trees.find(t=>t.id===T).missions[0].waitAt,'exported');
  assert.deepEqual(await page.evaluate(c=>VoidMissionContent.check(c,{givers:new Map(VoidLiveContent.env.givers.map(g=>[g.id,g])),places:VoidMissionGivers.placeIds()}).errors,content),[]);
  // ---- D. NPCs tab
  if(await page.locator('[data-me-npc-link="grey-reverie"]').count())await page.locator('[data-me-npc-link="grey-reverie"]').first().click();else await page.evaluate(()=>{VoidDevTools.npcFocus='grey-reverie';VoidDevTools.tab='npcs';VoidDevTools.render();});
  await page.waitForSelector('[data-npc-start]',{timeout:60000});await page.waitForSelector('[data-npc-facts="grey-reverie"]',{timeout:60000});
  await page.screenshot({path:path.join(shots,'05-npcs-tab-start.png')});
  const listed=await page.evaluate(()=>VoidNPCEditor.entries().length);log('NPCs listed',listed);assert.ok(listed>40);
  assert.match(await page.locator('[data-npc-facts="grey-reverie"]').textContent(),/npc-grey-reverie/);
  await page.locator('[data-npc-preview-go="grey-reverie"]').click();await page.waitForSelector('[data-npc-clip]',{timeout:120000});
  const clips=await page.locator('[data-npc-clip]').evaluateAll(b=>b.map(x=>x.dataset.npcClip));log('preview clips',clips.join(','));assert.ok(clips.length>=10);
  await page.locator('[data-npc-clip]').filter({hasText:/wave|dance-bop/}).first().click();await page.waitForTimeout(1500);
  await page.locator('[data-npc-preview="grey-reverie"]').screenshot({path:path.join(shots,'06-npcs-preview-reverie.png')});
  // lines & voice (moved here): voice read-only
  assert.match(await page.locator('[data-npc-lines="grey-reverie"]').textContent(),/Hey\./);
  // a route
  await page.locator('[data-npc-mode="path"]').click();await page.waitForSelector('[data-npc-empty]');await page.waitForTimeout(150);g=await next();log('guide (route):',g);assert.match(g.label,/first point/);
  for(const [x,z] of [[100,-6.2],[104.4,-5.9],[110,-7]])await clickMap('[data-npc-place="grey-reverie"]',x,z),await page.waitForTimeout(250);
  await page.locator('[data-npc-point-action="1"]').selectOption('sit');await page.waitForTimeout(200);await page.locator('[data-npc-point-action="2"]').selectOption('scroll');await page.waitForTimeout(200);
  const plan=await page.evaluate(()=>JSON.parse(localStorage.getItem('mission-editor-drafts-v1')).npcs['grey-reverie']);log('route',JSON.stringify(plan));assert.equal(plan.points.length,3);
  assert.equal(await page.locator('[data-npc-problem]').count(),0,'no problems');
  const acts=await page.locator('[data-npc-point-action="0"] option').evaluateAll(o=>o.map(x=>x.value));assert.ok(!acts.some(a=>/sensual|slow|belly|hip|twerk|kiss|club|milk/.test(a)),acts.join());
  await page.locator('[data-npc-place="grey-reverie"]').screenshot({path:path.join(shots,'07-npcs-route-editor.png')});
  await page.locator('[data-npc-anims="grey-reverie"]').screenshot({path:path.join(shots,'08-npcs-add-animation.png')});
  // locked NPCs say why
  await page.locator('[data-npc="admin"]').click();await page.waitForSelector('[data-npc-place-locked="admin"]');log('admin:',await page.locator('[data-npc-place-locked="admin"]').textContent());
  await page.locator('[data-npc-lines="admin"]').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(shots,'09-npcs-admin-lines-voice.png')});
  if(PART==='editor'){log('editor part done');return;}
  // ---- the game: PLAY THIS DRAFT of the mission: Reverie waits at the spot while it waits
  await page.evaluate(()=>{VoidDevTools.tab='missions';VoidDevTools.render();});await page.waitForSelector('[data-me-play="tree:'+m1+'"]',{timeout:60000});
  await page.evaluate(()=>{try{VoidGraphics.quality='low';VoidBabylon.setQuality('low');}catch{}});
  // the route is in the draft too: the waiting mission wins while it waits
  await page.locator('[data-me-play="tree:'+m1+'"]').click();
  await page.waitForFunction(()=>!document.getElementById('dev-test-banner').hidden&&mode==='walking'&&walkingLocation?.quarter==='avenue',null,{timeout:900000,polling:50});
  await page.evaluate(()=>{Object.assign(walker,{x:96,z:-10.5,yaw:0});});
  await page.waitForFunction(()=>VoidBabylon.district?.streetPair?.stats?.().her?.id==='grey-reverie',null,{timeout:900000,polling:1000});
  const sp=()=>page.evaluate(()=>VoidBabylon.district.streetPair.stats());
  await page.waitForFunction(()=>{const h=VoidBabylon.district.streetPair.stats().her;return h&&/^wait:/.test(h.plan||'')&&Math.hypot(h.x-96,h.z+6.3)<.8;},null,{timeout:300000,polling:500});
  let st=await sp();log('waiting:',JSON.stringify(st.her));assert.match(st.her.plan,/^wait:draft-avenue-errands-m1/);
  await page.evaluate(()=>{Object.assign(walker,{x:100.2,z:-6.9,yaw:Math.atan2(96-100.2,-6.3+6.9)});});await page.waitForTimeout(2500);await page.screenshot({path:path.join(shots,'10-play-reverie-waits-at-spot.png')});
  // take the mission (it is offered in person: talking to her takes it): she goes back to her plan (the route in the draft)
  log('accept:',await page.evaluate(()=>{const r=VoidMissionContent.treeEvent(state,VoidLiveContent.env,{type:'talk',npcs:['grey-reverie']},VoidMissions,C);return JSON.stringify({offered:r.offered,plans:Object.keys(VoidLiveContent.env.npcPlans||{}),wait:VoidMissionContent.waitingAt(state,VoidLiveContent.env)});}));
  await page.waitForTimeout(1200);log('plans now:',await page.evaluate(()=>JSON.stringify(VoidLiveContent.plans())));
  await page.waitForFunction(()=>/^path:/.test(VoidBabylon.district.streetPair.stats().her?.plan||''),null,{timeout:60000,polling:500});
  const seen=new Set();for(let i=0;i<90;i++){st=await sp();if(st.her)seen.add(st.her.mode+':'+(st.her.act||''));if(seen.has('plan-do:look')&&[...seen].some(k=>/^sit:|sit-down/.test(k)))break;await page.waitForTimeout(1000);}
  log('route seen:',[...seen].join(' '));assert.ok([...seen].some(k=>k.startsWith('plan-go')||k.startsWith('plan-do')),'she follows the route');
  await page.evaluate(()=>{const h=VoidBabylon.district.streetPair.stats().her;Object.assign(walker,{x:h.x+4,z:-6.9,yaw:Math.atan2(-4,h.z+6.9)});});await page.waitForTimeout(1500);await page.screenshot({path:path.join(shots,'11-play-reverie-walks-route.png')});
  log('page errors:',errors.length?errors.slice(0,5):'none');
 }catch(e){console.log('[npc-tools] page errors at failure:',errors.slice(0,8));try{const pg=browser.contexts()[0].pages()[0];console.log((await pg.evaluate(()=>document.getElementById('dev-balance')?.innerText||'')).slice(0,800));await pg.screenshot({path:path.join(shots,'failure.png')});}catch{}throw e;}finally{await browser.close();}
 if(errors.length)console.log('[npc-tools] page errors:',errors.slice(0,8));
})().catch(e=>{console.error(e);process.exit(1);});
