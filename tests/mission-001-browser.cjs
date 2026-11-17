/* MISSION 001 — AWAKENING in the real game (Chromium, software GL, offline: every API call refused, so the shipped missions are in force).
   A. A fresh character: customise → EXIT POD (E) → the V1 notification banner ("V1 · Incoming call from ADMIN · Press L to answer") and the device sound request →
      L opens the V1 on Comms with Admin's call (caller, timer, waveform, his two lines as a transcript; no reply; HANG UP) → the Mission Log shows "Awakening" (players
      never see the number), objective "Locate Admin", tracked → stand next to Admin and press E → the mission completes (live players: no dialogue, the MISSION COMPLETE
      notice; the placeholder line is never shown).
      Run at 1366x768 and 1920x1080, with screenshots of the banner, the V1 message and the Mission Log.
   B. An old save with beginner-campaign progress (exited the pod before Mission 001 existed): it loads clean (nothing old shown or tracked, credits and ship kept) and
      gets Mission 001 on the next pod exit.
   C. An in-person test tree (published content mocked for this browser only): Iris offers it when talked to, then it is in the Mission Log and tracked.
   Usage: node tests/mission-001-browser.cjs   (its own static server on a free port; SITE_TEST_URL to use another; SHOTS=dir; BROWSER_EXECUTABLE=path; ONLY=A|B|C; SIZES=1366) */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const shots=process.env.SHOTS||path.resolve(__dirname,'..','docs/development/mission-001');fs.mkdirSync(shots,{recursive:true});
const bundled=['/opt/pw-browsers/chromium','/opt/pw-browsers/chromium-1243/chrome-linux64/chrome'].find(f=>fs.existsSync(f)),exe=process.env.BROWSER_EXECUTABLE||bundled||null;
const only=process.env.ONLY||'',sizes=(process.env.SIZES||'1366,1920').split(',').map(w=>w==='1920'?[1920,1080]:[1366,768]);
const ADMIN_TEXT='You\'re awake. Good.\nWhen you\'re ready, come find me. We need to talk.';
// Our own static server (never the shared 5187-5189/5291 hosts), closed at the end.
function serve(){const root=path.resolve(__dirname,'..'),types={'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.ogg':'audio/ogg','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.glb':'model/gltf-binary'};
 const srv=http.createServer((req,res)=>{let f;try{f=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));}catch{res.writeHead(400);return res.end();}if(!f.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);return res.end();}res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(d);});});
 return new Promise(r=>srv.listen(0,'127.0.0.1',()=>r(srv)));}
(async()=>{
 const srv=process.env.SITE_TEST_URL?null:await serve(),base=process.env.SITE_TEST_URL||'http://127.0.0.1:'+srv.address().port;
 const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader','--no-sandbox','--autoplay-policy=no-user-gesture-required'],...(exe?{executablePath:exe}:{})});
 const log=m=>console.log(new Date().toISOString().slice(11,19),m);
 async function open(W,H,{content=null}={}){
  const ctx=await browser.newContext({viewport:{width:W,height:H},serviceWorkers:'block'}),page=await ctx.newPage();page.setDefaultTimeout(300000);const errors=[],sounds=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/assets\/audio\/ui\/device-.*-notify\.ogg/.test(r.url()))sounds.push(r.url().split('/').pop());});
  await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));
  await page.route('**/api/**',r=>{const p=new URL(r.request().url()).pathname;if(content&&p.endsWith('/live-content'))return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({version:3,content})});return r.fulfill({status:503,contentType:'application/json',body:'{}'});});
  await page.addInitScript(()=>{if(!sessionStorage.getItem('i')){localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:'low',v:2,chosen:true}));sessionStorage.setItem('i','1');}});
  await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started);
  await page.evaluate(()=>Object.assign(VoidPreparation.limits,{scene:600000,assets:600000,optional:300000,total:1200000,module:600000,artwork:300000}));
  return {ctx,page,errors,sounds};}
 const newCharacter=async page=>{await page.click('[data-action=menu-campaign]');await page.click('[data-action=menu-new]');const c=page.locator('[data-action=menu-new-confirm]');if(await c.count())await c.click();
  await page.waitForSelector('#character-creator.on');await page.waitForFunction(()=>!document.querySelector('[data-cc=confirm]').disabled);await page.locator('[data-cc=confirm]').click();};
 const toPod=page=>page.waitForFunction(()=>mode==='pod-waking'&&walker&&!document.getElementById('pod-wake').hidden,null,{timeout:300000});
 // The banner shows for about 8 s after the pod exit, so the walking state is awaited without waiting for every model to finish loading.
 const exitPod=async page=>{await page.waitForFunction(()=>VoidAssets.pending===0,null,{timeout:300000});await page.waitForTimeout(800);await page.keyboard.press('KeyE');await page.waitForFunction(()=>mode==='walking'&&walker,null,{timeout:300000});};
 const S=page=>page.evaluate(()=>({mode,credits:state.credits,ship:VoidShips.hasShip(state),tracked:state.universe.trackedMission,m:Object.fromEntries(Object.entries(state.universe.missions||{}).map(([k,v])=>[k,(v.completed?'DONE ':'open ')+Object.keys(v.objectives).join(',')])),
  log:VoidMissions.all(state,C).map(m=>({title:m.title,objective:m.objective,tracked:m.tracked,completed:m.completed}))}));
 // Stand where a player would, facing the thing, and press E (the same spot search as tests/beginner-browser.cjs).
 const useE=async(page,id)=>{const ok=await page.evaluate(id=>{const it=walkingLocation.interactions.find(i=>i.id===id);if(!it)return false;const inside=(x,z)=>walkingLocation.solids.some(o=>o.position&&o.size&&Math.abs(x-o.position[0])<o.size[0]/2+.35&&Math.abs(z-o.position[2])<o.size[2]/2+.35);
  for(const d of [1.6,1.3,1.9,1.0,2.1,.7])for(let a=0;a<16;a++){const ang=a*Math.PI/8,x=it.position[0]+Math.sin(ang)*d,z=it.position[2]+Math.cos(ang)*d,yaw=Math.atan2(it.position[0]-x,it.position[2]-z);if(inside(x,z))continue;
   if(VoidExplorer.select({x,z,yaw},walkingLocation,i=>!i.when||VoidStory.matches(state,i.when))?.id===id){Object.assign(walker,{x,z,yaw,pitch:0,vx:0,vz:0});return true;}}return false;},id);
  assert(ok,'a spot where '+id+' can be used exists');await page.waitForTimeout(1200);await page.keyboard.press('KeyE');await page.waitForTimeout(1500);};
 try{
  // ---------------------------------------------------------------- A
  if(!only||only==='A')for(const [W,H] of sizes){
   const {ctx,page,errors,sounds}=await open(W,H);log('A '+W+'x'+H);
   await newCharacter(page);await toPod(page);
   let s=await S(page);assert.deepEqual(s.m,{},'no mission in the pod');assert.deepEqual(s.log,[]);
   await page.evaluate(()=>{VoidV1.bannerMs=120000;});   // the software renderer is slow: keep the banner up while it is checked and photographed (players: about 8 s)
   await exitPod(page);
   await page.waitForFunction(()=>!!state.universe.missions['m001-awakening']?.acquired,null,{timeout:30000});
   await page.waitForSelector('#pd-notify.on:not(.away)',{timeout:30000}).catch(async e=>{console.log(JSON.stringify(await page.evaluate(()=>({mode,cls:document.getElementById('pd-notify')?.className,hidden:document.getElementById('pd-notify')?.hidden,text:document.getElementById('pd-notify')?.textContent,pending:VoidV1?.pending,notice:document.getElementById('notice')?.textContent}))));throw e;});
   const banner=(await page.locator('#pd-notify').innerText()).replace(/\s+/g,' ').trim();
   assert.equal(banner,'V1 · Incoming call from ADMIN · Press L to answer','the V1 notification');assert.equal(await page.locator('#pd-notify [data-help]').innerText(),'Press L to answer','the key hint is marked as a help hint');
   assert.match(await page.locator('#pd-chip').innerText(),/V1 · L · 1 NEW/);
   await page.screenshot({path:path.join(shots,'notification-'+W+'.png')});
   s=await S(page);log(JSON.stringify(s));assert.equal(s.tracked,'m001-awakening');assert.deepEqual(s.log,[{title:'Awakening',objective:'Locate Admin',tracked:true,completed:false}],'in the Mission Log even before the call is answered');
   assert.ok(sounds.includes('device-v1-notify.ogg'),'the V1 notification sound is requested: '+sounds.join(','));
   // L answers: the V1 opens on Comms with Admin's call
   await page.evaluate(()=>{VoidV1.callTail=120000;});   // the software renderer is slow: keep the call connected long enough to look at it (a player's call ends 6 s after the last line)
   await page.keyboard.press('KeyL');await page.waitForSelector('#personal-device.open');await page.waitForFunction(()=>!VoidPersonalDevice.busy&&VoidPersonalDevice.app==='comms');
   assert.equal(await page.locator('#pd-notify').isHidden(),true,'opening the V1 clears the banner');
   const callCard=page.locator('#personal-device [data-call-live]');await callCard.waitFor();
   assert.match(await callCard.innerText(),/INCOMING CALL · CONNECTED[\s\S]*ADMIN[\s\S]*\d\d:\d\d/);assert.equal(await callCard.locator('.pd-wave i').count(),14,'a waveform');
   await page.waitForFunction(()=>[...document.querySelectorAll('#personal-device .pd-call-line')].every(l=>getComputedStyle(l).opacity==='1'),null,{timeout:15000});assert.deepEqual(await callCard.locator('.pd-call-line').allInnerTexts(),['You\'re awake. Good.','When you\'re ready, come find me. We need to talk.'],'David\'s two lines as a transcript');
   assert.equal(await page.locator('#personal-device [data-call-live] input,#personal-device [data-call-live] textarea').count(),0,'no reply');
   await page.screenshot({path:path.join(shots,'v1-call-'+W+'.png')});
   if(await page.locator('[data-hangup]').count())await page.locator('[data-hangup]').dispatchEvent('click');await page.waitForSelector('#personal-device [data-call-live].ended',{timeout:30000});   // ends after the lines, or HANG UP (dispatched: the software renderer's frames are too slow for a pointer click to settle)
   assert.match(await page.locator('#personal-device').innerText(),/CALL ENDED[\s\S]*RECENT CALLS[\s\S]*ADMIN \/\/ INCOMING MESSAGE/,'kept under RECENT CALLS to read again');
   assert.ok(!/Mission 001|001/.test(await page.locator('#personal-device').innerText()),'no mission number on the device');
   // the Mission Log
   await page.evaluate(()=>VoidPersonalDevice.openApp('missions'));await page.waitForFunction(()=>!VoidPersonalDevice.busy&&VoidPersonalDevice.app==='missions');
   const card=await page.locator('#personal-device [data-mission-number="1"]').innerText();
   assert.match(card,/^Awakening/);assert.ok(!/001/.test(card),'players never see the number');assert.match(card,/OBJECTIVE\s+Locate Admin/);assert.match(card,/MAIN STORYLINE \/ INTRODUCTION · THE DARKNET DISTRICT/);assert.match(card,/2 OF 4 STEPS/);assert.match(card,/TRACKED/);
   assert.match(card,/✓ Exit the Sleeping Pod\./);assert.match(card,/✓ Receive Admin's message\./);assert.match(card,/○ Find and speak with Admin\./);assert.match(card,/○ Receive an introduction to The Darknet District\./);
   await page.screenshot({path:path.join(shots,'mission-log-'+W+'.png')});
   await page.keyboard.press('KeyL');await page.waitForFunction(()=>!VoidPersonalDevice.isOpen);
   assert.equal(await page.evaluate(()=>state.story.flags['v1r_m001-awakening_start']),true,'the call was answered');assert.match(await page.locator('#pd-chip').innerText(),/^V1 · L$/);
   // guidance points at Admin
   const g=await page.evaluate(()=>{const m=VoidMissions.tracked(state,C);return VoidMissions.guidance(state,m,true);});assert.deepEqual(g,{kind:'local',label:'Locate Admin',interaction:'admin'});
   // talk to Admin
   await page.evaluate(()=>{window.__said=[];const a=announce;announce=function(t){window.__said.push(String(t));return a.apply(this,arguments);};});
   await useE(page,'admin');await page.waitForTimeout(1000);
   s=await S(page);log(JSON.stringify(s));
   assert.equal(s.m['m001-awakening'],'DONE exit-pod,message,speak,introduction','Mission 001 complete');assert.equal(s.tracked,null);assert.equal(s.log[0].completed,true);
   const seen=await page.evaluate(()=>({speech:typeof speech!=='undefined'&&speech?speech.lines.map(l=>l.text):[],notice:(window.__said||[]).join(' | '),screen:document.querySelector('#screen:not(.hidden)')?.innerText||''}));
   assert.ok(!/\[David:/.test(JSON.stringify(seen)),'live players never see the placeholder');assert.match(seen.notice,/MISSION COMPLETE · Awakening/);assert.ok(!/001/.test(seen.notice));log('after talking to Admin: '+JSON.stringify(seen).slice(0,300));
   await page.screenshot({path:path.join(shots,'complete-'+W+'.png')});
   assert.deepEqual(errors,[],'no page errors');await ctx.close();}
  // ---------------------------------------------------------------- B
  if(!only||only==='B'){
   const {ctx,page,errors}=await open(1366,768);log('B old save');
   await page.evaluate(()=>{const s=C.startDistrictCampaign(C.fresh());delete s.story.flags.podWakePending;s.story.flags.appearanceOffered=true;s.credits=640;
    s.universe.missions={'first-contact':{acquired:true,completed:true,objectives:{v1:true,controls:true,speak:true}},'district-errand':{acquired:true,completed:false,objectives:{bar:true}}};
    s.story.flags['br_first-contact']=true;s.universe.trackedMission='district-errand';C.awardStarterShip(s);localStorage.setItem('void-runner-campaign-v1',JSON.stringify({...s,savedAt:1763300000000}));try{localStorage.setItem('void-runner-character-v1','{}');}catch{}});
   await page.reload();await page.waitForFunction(()=>window.VoidStartup?.started);
   let s=await S(page);assert.equal(s.tracked,null,'the removed mission is untracked on load');assert.deepEqual(s.log,[],'nothing old in the Mission Log');assert.equal(s.credits,640);assert.equal(s.ship,true,'the ship is kept');
   assert.equal(s.m['district-errand'],'open bar','the old record is kept');assert.equal(s.m['m001-awakening'],undefined);
   await page.click('[data-action=menu-campaign]');await page.click('[data-action=menu-load]');await page.click('[data-action=menu-load-local]');
   await Promise.race([toPod(page),page.waitForSelector('#character-creator.on').then(async()=>{await page.waitForFunction(()=>!document.querySelector('[data-cc=confirm]').disabled);await page.locator('[data-cc=confirm]').click();await toPod(page);})]);
   s=await S(page);assert.equal(s.m['m001-awakening'],undefined,'not before the pod exit');
   await exitPod(page);await page.waitForFunction(()=>!!state.universe.missions['m001-awakening']?.acquired,null,{timeout:30000});await page.waitForSelector('#pd-notify.on:not(.away)',{timeout:30000});
   s=await S(page);log(JSON.stringify(s));assert.equal(s.tracked,'m001-awakening');assert.deepEqual(s.log.map(m=>m.title),['Awakening']);assert.equal(s.credits,640);
   await page.screenshot({path:path.join(shots,'old-save-1366.png')});
   assert.deepEqual(errors,[],'no page errors');await ctx.close();}
  // ---------------------------------------------------------------- C
  if(!only||only==='C'){
   log('C in person');
   const {ctx,page}=await open(1366,768);
   const trees=await page.evaluate(()=>{const MC=VoidMissionContent,G=VoidLiveContent.env.givers;const t=MC.treesContent(VoidMainStory.trees(),{givers:G}).trees;
    t.push({id:'draft-browser-person',name:'Browser test: in person',missions:[{id:'draft-browser-person-m1',number:2,title:'TEST IN PERSON',type:'side',giver:'iris',offer:[{who:'iris',text:'TEST: a job, in person.'}],objectives:[{id:'step-1',label:'TEST: talk to Admin',kind:'talk',npc:'admin'}]}]});return t;});
   await ctx.close();
   const o=await open(1366,768,{content:{format:'darknet-district-mission-content',version:1,trees}});const p=o.page;
   await p.waitForFunction(()=>VoidLiveContent.current.version===3,null,{timeout:30000});
   await newCharacter(p);await toPod(p);await exitPod(p);await p.waitForFunction(()=>!!state.universe.missions['m001-awakening']?.acquired,null,{timeout:30000});
   // HANG UP at once: the call ends, the mission stays in the log
   await p.evaluate(()=>{VoidV1.callTail=120000;});
   await p.keyboard.press('KeyL');await p.waitForFunction(()=>VoidPersonalDevice.app==='comms'&&!VoidPersonalDevice.busy);await p.locator('[data-hangup]').waitFor();await p.locator('[data-hangup]').dispatchEvent('click');await p.waitForSelector('#personal-device [data-call-live].ended');
   assert.ok((await S(p)).log.some(m=>m.title==='Awakening'&&m.tracked));await p.keyboard.press('KeyL');await p.waitForFunction(()=>!VoidPersonalDevice.isOpen);
   await p.evaluate(()=>VoidInteractions.handlers.get('admin')());await p.waitForFunction(()=>state.universe.missions['m001-awakening']?.completed===true);
   await useE(p,'district-iris');const shown=await p.evaluate(()=>typeof speech!=='undefined'&&speech?speech.lines.map(l=>l.text):[]);assert.ok(shown.includes('TEST: a job, in person.'),'Iris offers it in person: '+shown.join(' | '));
   const s=await S(p);assert.equal(s.tracked,'draft-browser-person-m1');assert.ok(s.log.some(m=>m.title==='TEST IN PERSON'&&m.tracked&&!m.completed));
   // the tracked tree mission feeds the yellow arrow: it points at Admin (step 1: talk to Admin); STOP TRACKING hides it
   await p.evaluate(()=>{try{resumeWalking();}catch{}});await p.waitForFunction(()=>mode==='walking');
   const way=async()=>{await p.waitForTimeout(1200);return p.evaluate(()=>({wp:typeof trackedWalkWaypoint!=='undefined'&&trackedWalkWaypoint?trackedWalkWaypoint.position:null,admin:walkingLocation.interactions.find(i=>i.id==='admin').position,g:VoidMissions.guidance(state,VoidMissions.tracked(state,C),true)}));};
   let w=await way();assert.deepEqual(w.g,{kind:'local',label:'TEST: talk to Admin',interaction:'admin'});assert.deepEqual(w.wp,w.admin,'the arrow points at Admin');
   await p.screenshot({path:path.join(shots,'tree-arrow-to-admin-1366.png')});
   await p.evaluate(()=>VoidMissions.untrack(state));w=await way();assert.equal(w.wp,null,'STOP TRACKING hides the arrow');
   assert.deepEqual(await p.evaluate(()=>VoidMissions.all(state,C).map(m=>m.title)),['Awakening','TEST IN PERSON'],'no removed (beginner) mission is listed');
   assert.deepEqual(o.errors,[],'no page errors');await o.ctx.close();}
  console.log('mission 001 browser test passed; screenshots in',shots);
 }finally{await browser.close();if(srv)srv.close();}
})().catch(e=>{console.error(String(e.stack||e).slice(0,1500));process.exit(1);});
