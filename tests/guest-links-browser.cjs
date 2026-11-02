/* Shareable guest links in a real browser (David's brief, 2026-11-01). Each link opens in a fresh browser profile
   straight into Guest Mode: no sign-in, intro or tutorial; the visitor can walk, talk and fly; restart, the Guest Menu
   and refresh work; invalid links fall back to the Guest Menu; the visitor's own browser save is never written;
   Developer Tools, account and cloud actions stay closed; VR enters and exits inside the guest session; repeated
   restarts don't leak meshes, textures or audio. Saves screenshots for the report.
   Serve the repository (node tests/serve-modern.cjs) and run: node tests/guest-links-browser.cjs
   SITE_TEST_URL overrides the host; BROWSER_CHANNEL=chromium uses bundled Chromium; GUEST_OUTPUT the screenshot folder. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',out=process.env.GUEST_OUTPUT||path.resolve('work/guest-links');
const channel=process.env.BROWSER_CHANNEL||'msedge',only=process.env.GUEST_ONLY?new Set(process.env.GUEST_ONLY.split(',')):null;fs.mkdirSync(out,{recursive:true});
const SAVE_KEY='void-runner-campaign-v1',results=[];
const realSave=JSON.stringify({version:1,quest:'legal-run',location:'kepler',credits:4321,marker:'visitor-own-save'});
(async()=>{const browser=await chromium.launch({headless:true,args:['--enable-gpu','--ignore-gpu-blocklist'],...(channel==='chromium'?{}:{channel})});
 // A fresh profile per case, like a friend opening the link for the first time. withSave seeds the visitor's own save.
 async function open(query,{withSave=false,viewport={width:1280,height:720},developer=false}={}){
  const context=await browser.newContext({viewport,serviceWorkers:'block'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{const t=m.text();if(m.type()==='error'&&!/status of 503|Failed to load resource|\[VOID guest\]/.test(t))errors.push(t.slice(0,300));});
  await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));
  await page.route('**/api/**',r=>{const u=r.request().url();if(developer&&/developer\/balance|\/balance$/.test(u))return r.fulfill({status:503,body:'offline test'});return r.fulfill({status:503,body:'offline test'});});
  if(withSave)await page.addInitScript(([k,v])=>{if(!sessionStorage.getItem('seeded')){localStorage.setItem(k,v);sessionStorage.setItem('seeded','1');}},[SAVE_KEY,realSave]);
  await page.goto(base+'/void-runner.html'+query,{waitUntil:'domcontentloaded'});
  return {context,page,errors};}
 const settle=page=>page.waitForFunction(()=>['ready','failed'].includes(VoidGuest.phase),null,{timeout:240000});
 const snap=page=>page.evaluate(k=>({phase:VoidGuest.phase,error:VoidGuest.error,mode,walking:walkingLocation?.id||null,place:walkingLocation?.name||null,vr:VoidVR.active,vrMenu:!!document.getElementById('vr-menu'),menu:VoidMenu.page,
  chip:!document.getElementById('guest-chip').hidden,loading:!document.getElementById('guest-loading').hidden,save:localStorage.getItem(k),devButton:getComputedStyle(document.getElementById('dev-balance-open')).display,
  quest:state.quest,tutorial:state.story.flags.tutorialSkipped,credits:state.credits,flags:{door:state.story.flags.districtDoor,badge:state.story.flags.districtBadge}}),SAVE_KEY);
 async function check(name,fn){if(only&&!only.has(name))return;const t=Date.now();try{await fn();results.push([name,'PASS',((Date.now()-t)/1000).toFixed(1)+'s']);console.log('PASS',name);}catch(e){results.push([name,'FAIL',e.message.split('\n')[0]]);console.log('FAIL',name,e.stack);process.exitCode=1;}}

 await check('loading screen and NeoChinatown arrival (fresh browser, own save untouched)',async()=>{
  const {context,page,errors}=await open('?visit=neochinatown&v=1',{withSave:true});
  await page.waitForSelector('#guest-loading h1');assert.match(await page.textContent('#guest-loading'),/GUEST EXPERIENCE[\s\S]*Destination: NeoChinatown/);await page.screenshot({path:path.join(out,'04-loading-screen.png')});
  await settle(page);const s=await snap(page);
  assert.equal(s.phase,'ready',JSON.stringify(s.error));assert.equal(s.mode,'walking');assert.equal(s.walking,'neochinatown');assert.equal(s.chip,true);assert.equal(s.loading,false);
  assert.equal(s.quest,'open','intro and tutorial skipped');assert.equal(s.tutorial,true);assert.equal(s.save,realSave,'the visitor\'s own save is untouched');assert.equal(s.devButton,'none');
  // Walk: hold W for a moment and the player moves.
  const before=await page.evaluate(()=>({x:walker.x,z:walker.z}));await page.locator('canvas#space').click({position:{x:640,y:400}}).catch(()=>{});await page.keyboard.down('KeyW');await page.waitForTimeout(1200);await page.keyboard.up('KeyW');
  const after=await page.evaluate(()=>({x:walker.x,z:walker.z,mode}));assert.ok(Math.hypot(after.x-before.x,after.z-before.z)>.5||after.mode!=='walking','the guest can walk');
  await page.evaluate(()=>{if(mode!=='walking')VoidMenu.returnTo?.();});await page.waitForTimeout(1500);await page.screenshot({path:path.join(out,'05-arrival-neochinatown.png')});
  // Saving anything (a sleep pod, a door, a menu) writes nothing.
  assert.equal(await page.evaluate(()=>save()),false);assert.equal((await snap(page)).save,realSave);
  assert.deepEqual(errors,[]);await context.close();});

 await check('Darknet District: spawn inside, doors open, talk to Iris, no permanent rewards',async()=>{
  const {context,page,errors}=await open('?visit=darknet-district');await settle(page);const s=await snap(page);
  assert.equal(s.phase,'ready',JSON.stringify(s.error));assert.deepEqual(s.flags,{door:true,badge:true});
  const zone=await page.evaluate(()=>VoidNeoChinatown.zone({x:walker.x,z:walker.z}).area);assert.equal(zone,'district');
  assert.equal(await page.evaluate(()=>VoidExplorer.blocked(walker.x,walker.z,walkingLocation)),false,'spawn on open floor');
  // NPC talk through the game's own interaction.
  await page.evaluate(()=>VoidInteractions.handlers.get('district-iris')({}));
  await page.waitForTimeout(400);const talk=await page.evaluate(()=>({mode,text:document.getElementById('screen').innerText}));
  assert.match(talk.text,/Iris|security/i,'Iris answers');await page.screenshot({path:path.join(out,'05b-district-iris.png')});
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),SAVE_KEY),null,'no save created in a fresh browser');
  assert.deepEqual(errors,[]);await context.close();});

 await check('Meridian arrival and Guest Menu, restart and refresh',async()=>{
  const {context,page,errors}=await open('?visit=meridian&v=1',{withSave:true});await settle(page);let s=await snap(page);
  assert.equal(s.phase,'ready',JSON.stringify(s.error));assert.equal(s.mode,'walking');assert.match(s.place,/MERIDIAN/i);
  await page.waitForTimeout(1500);await page.screenshot({path:path.join(out,'06-arrival-meridian.png')});
  // Return to Guest Menu: the chip opens the game menu, which is the Guest Menu here.
  await page.click('#guest-chip button');await page.waitForSelector('.guest-menu');const menu=await page.textContent('.guest-menu');
  for(const t of ['RESUME','RESTART SHARED EXPERIENCE','EXIT TO MAIN MENU'])assert.ok(menu.includes(t),t);assert.ok(!/CONTINUE CAMPAIGN|NEW CAMPAIGN|DEVELOPER/.test(menu),'no campaign or developer options');
  await page.screenshot({path:path.join(out,'07-guest-menu.png')});
  // Blocked actions are refused even if a button for them appears.
  for(const a of ['menu-continue','menu-new-confirm','cloud-save','cloud-load-confirm','menu-account','menu-devtools','checkout:wraith'])
   await page.evaluate(a=>{const b=document.createElement('button');b.dataset.action=a;document.getElementById('screen').append(b);b.click();b.remove();},a);
  s=await snap(page);assert.equal(s.save,realSave);assert.equal(await page.evaluate(()=>VoidDevTools.authorized),false);
  // Restart in place, twice, and count what the scene holds (no growth = no leak).
  const count=()=>page.evaluate(()=>{const s2=VoidBabylon.scene,e=s2?.getEngine?.();return s2?{meshes:s2.meshes.length,textures:s2.textures.length,materials:s2.materials.length,skeletons:s2.skeletons.length,anims:s2.animationGroups.length,scenes:e.scenes.length,engineTextures:e.getLoadedTexturesCache?.().length??0}:null;});
  await page.click('[data-action="guest-restart"]');await settle(page);await page.waitForFunction(()=>VoidGuest.phase==='ready');const first=await count();
  await page.evaluate(()=>VoidGuest.restart());await page.waitForFunction(()=>VoidGuest.arrivals>=3&&VoidGuest.phase==='ready',null,{timeout:240000});await page.waitForTimeout(1000);const second=await count();
  if(first&&second)for(const k of Object.keys(first))assert.ok(second[k]<=first[k]*1.05+2,'no growth in '+k+': '+first[k]+' → '+second[k]);
  // Refresh: the same shared experience starts again, the own save still untouched.
  await page.reload({waitUntil:'domcontentloaded'});await settle(page);s=await snap(page);assert.equal(s.phase,'ready');assert.match(s.place,/MERIDIAN/i);assert.equal(s.save,realSave);
  // Exit to Main Menu: the page without the link, and the visitor's own campaign is back.
  await page.click('#guest-chip button');await page.waitForSelector('[data-action="guest-exit"]');await Promise.all([page.waitForURL(u=>!u.search),page.click('[data-action="guest-exit"]')]);
  await page.waitForFunction(()=>VoidStartup.started,null,{timeout:120000});const home=await page.evaluate(k=>({guest:VoidGuest.active,save:localStorage.getItem(k),menu:VoidMenu.page,body:document.body.classList.contains('guest-mode')}),SAVE_KEY);
  assert.deepEqual(home,{guest:false,save:realSave,menu:'main',body:false});
  results.push(['  scene counts after restarts',JSON.stringify(first),JSON.stringify(second)]);assert.deepEqual(errors,[]);await context.close();});

 await check('scenario: flight entry from Meridian',async()=>{
  const {context,page,errors}=await open('?scenario=meridian-departure&v=1');await settle(page);const s=await snap(page);
  assert.equal(s.phase,'ready',JSON.stringify(s.error));assert.equal(s.mode,'play','flying');await page.waitForTimeout(3000);await page.screenshot({path:path.join(out,'08-flight-departure.png')});
  assert.equal(s.save,null);assert.deepEqual(errors,[]);await context.close();});

 await check('VR guest experience: enter the forest, exit back to the District, still a guest',async()=>{
  const {context,page,errors}=await open('?scenario=vr-forest&v=1',{withSave:true});await settle(page);let s=await snap(page);
  assert.equal(s.phase,'ready',JSON.stringify(s.error));assert.equal(s.vr,true);await page.waitForFunction(()=>VoidVR.session?.world&&!(VoidAssets.pending>0),null,{timeout:180000});await page.waitForTimeout(2500);
  await page.screenshot({path:path.join(out,'09-vr-forest.png')});
  const audioBefore=await page.evaluate(()=>VoidVR.debug.audio);
  await page.evaluate(()=>VoidVR.exit());await page.waitForFunction(()=>!VoidVR.active&&!VoidVR.busy&&walkingLocation?.id==='neochinatown',null,{timeout:120000});
  s=await snap(page);assert.equal(s.save,realSave,'VR exit wrote nothing');assert.equal(await page.evaluate(()=>VoidGuest.active),true);
  const audioAfter=await page.evaluate(()=>VoidVR.debug.audio);assert.equal(audioAfter.timers,0);assert.equal(audioAfter.nodes,0);
  // Again: enter and leave a second time without leftovers.
  assert.equal(await page.evaluate(()=>VoidVR.launch('tropical',{})),true);await page.waitForFunction(()=>VoidVR.session?.world,null,{timeout:180000});await page.evaluate(()=>VoidVR.exit());
  await page.waitForFunction(()=>!VoidVR.active&&!VoidVR.busy,null,{timeout:120000});assert.deepEqual(await page.evaluate(()=>VoidVR.debug.audio),{nodes:0,timers:0});
  results.push(['  VR audio in session / after exit',JSON.stringify(audioBefore),JSON.stringify(audioAfter)]);assert.deepEqual(errors,[]);await context.close();});

 await check('VR bedroom: only the terminal\'s own offered companions, never dev-only or unlicensed ones',async()=>{
  const {context,page,errors}=await open('?scenario=vr-bedroom');await settle(page);const s=await snap(page);
  assert.equal(s.phase,'ready',JSON.stringify(s.error));assert.equal(s.vrMenu,true,'the picker is open');
  await page.waitForTimeout(800);const cards=await page.evaluate(()=>[...document.querySelectorAll('#vr-menu .vr-card h2')].map(h=>h.textContent));assert.ok(cards.length>0);
  await page.click('#vr-menu [data-vr^="choose:female"]').catch(()=>{});await page.waitForTimeout(800);
  const names=await page.evaluate(()=>[...document.querySelectorAll('#vr-menu .vr-card')].map(c=>({name:c.querySelector('h2').textContent,usable:!!c.querySelector('[data-vr^="choose:"]')})));
  const offered=await page.evaluate(()=>[...VoidVRCompanions.companions.values()].filter(e=>VoidVRCompanions.offered(e,'thedarknetdistrict.com')).map(e=>e.name));
  for(const n of names.filter(n=>n.usable))assert.ok(offered.some(o=>n.name.startsWith(o))||/&/.test(n.name),n.name+' is offered publicly');
  assert.ok(!names.some(n=>n.usable&&/^Una/.test(n.name)),'dev-only Una is never offered');
  await page.screenshot({path:path.join(out,'09b-vr-bedroom-picker.png')});assert.deepEqual(errors,[]);await context.close();});

 await check('invalid and malicious links fall back to the Guest Menu with an explanation',async()=>{
  for(const [q,shot] of [['?visit=atlantis','10-invalid-link.png'],['?visit=meridian&save=%7B%22credits%22%3A1%7D',null],['?scenario=vr-combat',null],['?visit=meridian&v=9',null],['?visit=%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E',null]]){
   const {context,page,errors}=await open(q,{withSave:true});await page.waitForFunction(()=>VoidGuest.phase==='failed'&&VoidMenu.page==='guest',null,{timeout:180000});
   const s=await snap(page);assert.equal(s.save,realSave,q);assert.equal(await page.evaluate(()=>document.querySelectorAll('.guest-error img').length),0,'link text is never rendered as HTML');
   const text=await page.textContent('.guest-menu');assert.match(text,/LINK NOT AVAILABLE/,q);assert.match(text,/OTHER SHARED DESTINATIONS/);assert.match(text,/EXIT TO MAIN MENU/);
   if(shot)await page.screenshot({path:path.join(out,shot)});
   if(q==='?visit=atlantis'){await page.click('[data-action="guest-browse"]');await page.waitForSelector('.guest-browse');await page.screenshot({path:path.join(out,'10b-guest-destinations.png')});
    await page.click('[data-action="guest-go:darknet-district"]');await settle(page);assert.equal((await snap(page)).phase,'ready');assert.match(page.url(),/visit=darknet-district&v=1$/);}
   assert.deepEqual(errors,[],q);await context.close();}});

 await check('Share panel: Share Location, Share Scenario, generate and copy (developer view only)',async()=>{
  const {context,page,errors}=await open('');await page.waitForFunction(()=>VoidStartup.started,null,{timeout:120000});
  assert.equal(await page.evaluate(()=>VoidGuest.active),false);assert.equal(await page.evaluate(()=>getComputedStyle(document.getElementById('dev-balance-open')).display),'none','hidden from players');
  // The panel lives in Developer Tools, which only opens for a server-verified developer; stand that in for the screenshot.
  await page.evaluate(()=>{VoidDevTools.authorized=true;VoidDevTools.open('share');});await page.waitForSelector('.share-panel');
  await page.screenshot({path:path.join(out,'01-share-location.png')});
  await page.fill('#share-search','meridian');await page.waitForTimeout(150);await page.click('[data-share-pick="meridian"]');await page.click('[data-share="generate"]');
  const url=await page.inputValue('#share-url');assert.equal(url,base+'/void-runner.html?visit=meridian&v=1');
  await context.grantPermissions(['clipboard-read','clipboard-write'],{origin:base}).catch(()=>{});await page.click('[data-share="copy"]');await page.waitForTimeout(200);
  assert.match(await page.textContent('#share-status'),/copied|copy it/i);await page.screenshot({path:path.join(out,'03-generated-link.png')});
  await page.click('[data-share-tab="scenario"]');await page.click('[data-share-pick="vr-forest"]');await page.click('[data-share="generate"]');
  assert.equal(await page.inputValue('#share-url'),base+'/void-runner.html?scenario=vr-forest&v=1');await page.screenshot({path:path.join(out,'02-share-scenario.png')});
  // A player who isn't a developer can't drive the panel even by clicking its buttons.
  await page.evaluate(()=>{VoidDevTools.authorized=false;});const before=await page.inputValue('#share-url');await page.click('[data-share-pick="vr-tropical"]',{force:true}).catch(()=>{});assert.equal(await page.inputValue('#share-url').catch(()=>before),before);
  assert.deepEqual(errors,[]);await context.close();});

 await check('mobile layout: loading screen, chip and Guest Menu fit a phone',async()=>{
  const {context,page,errors}=await open('?visit=darknet-district',{viewport:{width:390,height:844}});await page.waitForSelector('#guest-loading h1');
  const wide=()=>page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert.equal(await wide(),false);await page.screenshot({path:path.join(out,'11-mobile-loading.png')});
  await settle(page);await page.click('#guest-chip button');await page.waitForSelector('.guest-menu');assert.equal(await wide(),false);await page.screenshot({path:path.join(out,'12-mobile-guest-menu.png')});
  assert.deepEqual(errors,[]);await context.close();});

 await check('regression: without a link the game starts normally with the visitor\'s own save',async()=>{
  const {context,page,errors}=await open('',{withSave:true});await page.waitForFunction(()=>VoidStartup.started,null,{timeout:120000});
  const s=await page.evaluate(k=>({guest:VoidGuest.active,menu:VoidMenu.page,save:localStorage.getItem(k),chip:document.getElementById('guest-chip'),loading:document.getElementById('guest-loading')}),SAVE_KEY);
  assert.deepEqual(s,{guest:false,menu:'main',save:realSave,chip:null,loading:null});assert.match(await page.textContent('.main-menu'),/CONTINUE CAMPAIGN/);
  assert.deepEqual(errors,[]);await context.close();});

 await browser.close();fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,1));console.table(results);
})().catch(e=>{console.error(e);process.exit(1);});
