/* Combined-build smoke test (David, 2026-11-04): campaigns from before the District reset are retired, new campaigns have no ship or missions,
   NPC dialogue still answers, ship gating and the empty landing pad hold, and the regular mobile site stays separate from the 3D game.
   Run: node tests/serve-modern.cjs &  then  node tests/integration-smoke-browser.cjs [low|high]   (Playwright, software GL is fine) */
const {chromium,devices}=require('playwright'),assert=require('node:assert/strict');
const BASE=process.env.BASE||'http://127.0.0.1:5187',tier=process.argv[2]==='high'?'high':'low';
const C=require('../void-runner/campaign.js'),M=require('../void-runner/mission-log.js');
// A save in the format used before the mission reset: open quest, a mission in progress, credits, free travel, no area or ship flags.
const old=C.fresh();old.quest='open';old.location='earth';old.credits=450;old.universe.freeTravel=true;old.story.flags.metAdmin=true;old.story.flags.metIris=true;M.acquire(old,'legal-run');
const U=require('../void-runner/universe.js');old.progression.checkpoint={location:'earth'};U.discover(old,'earth');old.universe.visitedLocations=[...new Set([...old.universe.visitedLocations,'earth'])];old.universe.currentSystem=U.system('earth');old.universe.discoveredSystems=[...new Set([...old.universe.discoveredSystems,old.universe.currentSystem])];
delete old.story.flags.campaignEpoch; // what makes it a pre-reset save
const OLD_SAVE=JSON.stringify(old);
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox']});
 const limits=()=>Object.assign(VoidPreparation.limits,{scene:900000,assets:300000,optional:300000,total:1500000});
 const open=async(ctx,seed)=>{const pg=await ctx.newPage(),errs=[];pg.on('pageerror',e=>errs.push(e.message));
  await pg.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));await pg.route(/firebase|gstatic|googleapis/,r=>r.abort());
  await pg.addInitScript(([t,save])=>{try{localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:t}));if(save&&!localStorage.getItem('void-runner-campaign-v1'))localStorage.setItem('void-runner-campaign-v1',save);}catch(e){}},[tier,seed||null]);
  await pg.goto(BASE+'/void-runner.html');await pg.waitForFunction(()=>window.VoidStartup?.started,null,{timeout:120000});await pg.evaluate(limits);return {pg,errs};};
 const walking=pg=>pg.waitForFunction(()=>mode==='walking'&&walker&&walkingLocation,null,{timeout:900000});
 const pad=pg=>pg.evaluate(()=>({landed:(VoidBabylon.scene.transformNodes.some(n=>n.metadata?.landed)||VoidBabylon.scene.meshes.some(m=>m.metadata?.landed)),hull:(walkingLocation.solids.find(s=>s.id==='ship')||{}).open,boardShown:walkingLocation.interactions.filter(i=>i.action==='board').map(i=>!i.when||VoidStory.matches(state,i.when)),header:document.querySelector('header .wide strong').textContent}));
 const talk=(pg,who)=>pg.evaluate(async w=>{const before=document.getElementById('notice').textContent;VoidInteractions.handlers.get(w)();await new Promise(r=>setTimeout(r,600));return {speech:!!speech,line:speech&&speech.lines&&speech.lines[0]&&speech.lines[0].text,notice:document.getElementById('notice').textContent};},who);
 // 1. A campaign from before the reset: retired. Not loadable, a copy kept, the slot freed, Continue unavailable, the menu says so.
 {const ctx=await b.newContext({viewport:{width:1000,height:600}}),{pg,errs}=await open(ctx,OLD_SAVE);
  const r=await pg.evaluate(()=>({slot:localStorage.getItem('void-runner-campaign-v1'),copy:localStorage.getItem('void-runner-campaign-v1.retired'),cont:document.querySelector('[data-action=menu-continue]')?.disabled,text:document.body.innerText,hasSave}));
  console.log(tier,'pre-reset save',JSON.stringify({slot:r.slot,copyKept:r.copy===OLD_SAVE,continueDisabled:r.cont,noticeShown:/retired in the District reset/.test(r.text),hasSave:r.hasSave}));
  assert.equal(r.slot,null);assert.equal(r.copy,OLD_SAVE);assert.equal(r.cont,true);assert(/retired in the District reset/.test(r.text));assert.equal(r.hasSave,false);
  assert.deepEqual(errs,[]);await ctx.close();}
 // 2. A new campaign: outside the doors, no ship, nothing on the pad, no missions, no pistol; Admin and Iris answer with notices only.
 {const ctx=await b.newContext({viewport:{width:1000,height:600}}),{pg,errs}=await open(ctx);
  await pg.click('[data-action=menu-campaign]');await pg.click('[data-action=menu-new]');await pg.waitForTimeout(1500);const c=await pg.$('[data-action=menu-new-confirm]');if(c)await c.click();
  await walking(pg);await pg.waitForTimeout(6000);
  const r=await pg.evaluate(()=>({area:walkingLocation.area,flags:{area:state.story.flags.area,pool:state.story.flags.missionPool,ship:state.story.flags.shipAccess},hasShip:VoidShips.hasShip(state),missions:VoidMissions.all(state,C).length,weapon:state.progression.personal.weapon,local:VoidNeoChinatown.toWorld(walker.x,walker.z)}));
  console.log(tier,'new campaign',JSON.stringify(r));
  assert.equal(r.area,'street');assert.deepEqual(r.flags,{area:undefined,pool:'closed',ship:'none'});assert.equal(r.hasShip,false);assert.equal(r.missions,0);assert.equal(r.weapon,null);assert(Math.abs(r.local[0])<.1&&Math.abs(r.local[1]-17)<.1,'outside the doors');
  await pg.evaluate(()=>{VoidInteractions.handlers.get('tdd')();const [x,z]=VoidNeoChinatown.toWorld(2,23.6);walker.x=x;walker.z=z;});
  await pg.evaluate(()=>{const [x,z]=VoidNeoChinatown.toWorld(0,45);walker.x=x;walker.z=z;});
  const pa=await pad(pg);console.log(tier,'new campaign pad',JSON.stringify(pa));assert.equal(pa.landed,false,'no Kestrel on the pad');assert.equal(pa.hull,true,'no invisible box');assert.deepEqual(pa.boardShown,[false]);assert.equal(pa.header,'NONE');
  const adminNotice=await pg.evaluate(async()=>{VoidInteractions.handlers.get('admin')();await new Promise(r=>setTimeout(r,500));return {speech:!!speech,notice:document.getElementById('notice').textContent};});
  assert.equal(adminNotice.speech,false,'Admin offers nothing to a new campaign');assert(/nothing for you/i.test(adminNotice.notice),'Admin: '+adminNotice.notice);
  const irisLine=await pg.evaluate(async()=>{VoidInteractions.handlers.get('district-iris')();await new Promise(r=>setTimeout(r,500));return speech&&speech.lines&&speech.lines[0]&&speech.lines[0].text;});assert(irisLine&&/Cameras are clean/.test(irisLine),'Iris still speaks: '+irisLine);
  await pg.evaluate(()=>resumeWalking());
  const left=await pg.evaluate(async()=>{await leaveWalking();return document.getElementById('notice').textContent+'|'+mode;});assert(/do not have a ship/i.test(left)&&/walking$/.test(left),'boarding is refused: '+left);
  assert.deepEqual(errs,[]);await ctx.close();}
 // 2b. A link that still carries the retired share parameters opens the normal game at the main menu, with no jump and no guest session.
 {const ctx=await b.newContext({viewport:{width:1000,height:600}}),pg=await ctx.newPage(),errs=[];pg.on('pageerror',e=>errs.push(e.message));
  await pg.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));await pg.route(/firebase|gstatic|googleapis/,r=>r.abort());
  await pg.goto(BASE+'/void-runner.html?visit=darknet-district&v=1');await pg.waitForFunction(()=>window.VoidStartup?.started,null,{timeout:120000});await pg.waitForTimeout(1500);
  const r=await pg.evaluate(()=>({guest:typeof VoidGuest,share:typeof VoidShare,mode,menu:!!document.querySelector('[data-action=menu-campaign]'),chip:!!document.getElementById('guest-chip')}));
  console.log(tier,'old share link',JSON.stringify(r));assert.equal(r.guest,'undefined');assert.equal(r.share,'undefined');assert.equal(r.menu,true,'the normal main menu is shown');assert.equal(r.chip,false);assert.notEqual(r.mode,'walking','no jump into a place');
  assert.deepEqual(errs,[]);await ctx.close();}
 // 3. The regular mobile site: no redirect, no 3D scripts or models fetched, ENTER is a plain link, login and navigation present.
 {const ctx=await b.newContext({...devices['iPhone 13']}),pg=await ctx.newPage(),reqs=[],errs=[];pg.on('request',r=>reqs.push(r.url()));pg.on('pageerror',e=>errs.push(e.message));
  await ctx.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));await ctx.route(/firebase|gstatic|googleapis|fonts\./,r=>r.abort());
  await pg.goto(BASE+'/index.html',{waitUntil:'domcontentloaded'});await pg.waitForTimeout(3000);
  const h=await pg.evaluate(()=>({href:document.querySelector('.tdd-enter-button')?.getAttribute('href'),text:document.querySelector('.tdd-enter-button')?.textContent.trim(),login:!!document.querySelector('[data-enter-login]'),nav:[...document.querySelectorAll('nav a')].map(a=>a.textContent.trim()).length,hscroll:document.documentElement.scrollWidth>innerWidth+2}));
  console.log(tier,'mobile home',JSON.stringify(h));assert(pg.url().endsWith('/index.html'),'no automatic redirect');assert.equal(h.href,'void-runner.html');assert.equal(h.text,'ENTER THE DARKNET DISTRICT');assert(h.login&&h.nav>=5&&!h.hscroll);
  assert.deepEqual(reqs.filter(u=>/void-runner\/|babylon|\.glb|\.vrpak/.test(u)),[],'no game scripts, engine or models are fetched by the regular mobile site');
  const g=await pg.evaluate(async()=>(await fetch('games-list.html')).text());assert(!/void.?runner/i.test(g),'the Arcade does not list the 3D game');
  assert.deepEqual(errs,[]);await ctx.close();}
 await b.close();console.log(tier,'integration smoke ok');})().catch(e=>{console.log('FAIL',e.message.split('\n')[0]);process.exit(1)});
