// WarFlying Stage C in the browser: Admin's scene and store, the Relay link and upload queue, the
// District policy and the scrambler. Needs the local server (node tests/serve-modern.cjs) and Edge.
require('node:fs').mkdirSync('work',{recursive:true});
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));try{
 await page.route('**/api/void-runner/**',r=>r.fulfill({status:503,body:'offline'}));await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline'}));
 await page.goto('http://127.0.0.1:5187/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started);
 // A pilot back in The Darknet District after delivering Admin's sealed crate to Rook.
 await page.evaluate(async()=>{state=C.fresh();Object.assign(state,{quest:'open',credits:2000,location:'earth'});state.universe.freeTravel=true;state.universe.currentSystem='sol';
  for(const id of VoidProgression.flags)state.progression.flags[id]=true;state.progression.completed=true;
  Object.assign(state.story.flags,{metAdmin:true,metIris:true,factionIntro:true,districtDoor:true,districtBadge:true,sealedCargo:'delivered',factionFirst:'communion',[C.factionDeliveries.communion.flag]:'paid'});await enterWalking('earth');});
 assert.equal(await page.evaluate(()=>VoidWarFlyingScanner.link().state),'unavailable','no uploads on the premises');
 assert.equal(await page.evaluate(()=>VoidComms.allows(state.location,!!walkingLocation,'relay')),false);
 // Admin's scene plays in full, in order, then offers his stock.
 await page.evaluate(()=>VoidInteractions.handlers.get('admin')());
 const heard=[];for(let i=0;i<90;i++){const t=await page.evaluate(()=>speech?.lines?.[speech.index]?.text||document.querySelector('.dialogue-window')?.innerText||'');heard.push(t);
  if(await page.locator('[data-action^="faction-choice:"]').count())break;await page.locator('#speech-next').click();}
 const text=heard.join('\n');
 assert.match(text,/So, you made it back\. Good\. Rook said everything arrived\./);assert.match(text,/After that last delivery\? I’d say you got lucky\./);
 assert.equal(await page.evaluate(()=>state.story.flags.warflyingIntro),true);
 assert.equal(await page.evaluate(()=>state.progression.equipment.owned.filter(id=>id.startsWith('warflying')).length),0,'nothing bought for the player');
 await page.screenshot({path:'work/warflying-c-admin.png'});
 await page.locator('[data-action^="faction-choice:"]',{hasText:'SCRAMBLER'}).click();
 assert.equal(await page.locator('[data-action^="admin-buy:"]').count(),1,'Admin sells only the scrambler');
 await page.screenshot({path:'work/warflying-c-store.png'});
 await page.locator('[data-action="admin-buy:warflying-scrambler"]').click();
 const bought=await page.evaluate(()=>({credits:state.credits,owned:state.progression.equipment.owned.includes('warflying-scrambler'),fitted:VoidProgression.utility(state)}));
 assert.deepEqual(bought,{credits:1100,owned:true,fitted:null},'bought, never auto-fitted');
 await page.locator('[data-action="progress-return"]').click();
 // Talking again: his idle line, then the stock.
 await page.evaluate(()=>VoidInteractions.handlers.get('admin')());assert.ok(await page.locator('[data-action^="faction-choice:"]',{hasText:'SCRAMBLER'}).count());
 await page.locator('[data-action^="faction-choice:"]',{hasText:'NOT RIGHT NOW'}).click();

 // In flight: the scanner listens, and uploads follow the link.
 await page.evaluate(async()=>{resumeWalking?.();state.location='meridian';state.universe.currentSystem='erebus';state.credits+=600;VoidProgression.buy(state,'warflying-module');VoidProgression.install(state,'signal','warflying-module');
  state.quest='legal-run';await launch();});
 await page.waitForFunction(()=>mode==='play',null,{timeout:35000});
 const flight1=await page.evaluate(async()=>{current.duration=999;current.enemies=0;enemies=[];
  // Routes are held still so the test controls the phase.
  VoidWarp.step=()=>false;globalThis.route=(o,d,phase,progress)=>(current.destination=d,preparedDestination=d,Object.assign(VoidWarp.create(o,d,null,false),{phase,progress}));
  flight.route=route('meridian','kepler','warp',.1);
  for(const id of ['beacon:erebus-1','beacon:erebus-2','satellite:erebus-1'])VoidWarFlying.observe(state.warflying,{sourceId:id,confidence:'confirmed',place:'erebus'},Date.now());
  const queued=VoidWarFlying.queue(state.warflying).length;for(let i=0;i<24;i++)update(.25);
  return {mode,installed:VoidWarFlyingScanner.installed,skirmish:!!globalThis.VoidFlightSkirmish?.active,loc:state.location,queued,after:VoidWarFlying.queue(state.warflying).length,hud:document.getElementById('warflying-hud').textContent,link:VoidWarFlyingScanner.link().state,transfer:VoidWarFlyingScanner.transfer,auto:state.warflying.autoUpload};});
 assert.equal(flight1.link,'connected');assert.ok(flight1.queued>=3);assert.equal(flight1.after,0,'auto-upload emptied the queue '+JSON.stringify(flight1));assert.match(flight1.hud,/RELAY CONNECTED/);
 await page.evaluate(()=>draw());await page.screenshot({path:'work/warflying-c-hud.png'});
 // Warp between systems: no link; records wait and nothing is lost.
 const warp=await page.evaluate(()=>{
  flight.route=route('meridian','vigil','warp',.4);
  VoidWarFlying.observe(state.warflying,{sourceId:'beacon:erebus-3',confidence:'confirmed',place:'erebus'},Date.now());
  for(let i=0;i<10;i++)update(.25);
  return {link:VoidWarFlyingScanner.link().state,queued:VoidWarFlying.queue(state.warflying).length,hud:document.getElementById('warflying-hud').textContent,points:VoidWarFlying.points(state.warflying)};});
 assert.equal(warp.link,'disconnected');assert.ok(warp.queued>=1,'records wait');assert.match(warp.hud,/NO SIGNAL · \d+ QUEUED/);
 await page.evaluate(()=>draw());await page.screenshot({path:'work/warflying-c-warp.png'});
 // Back in range with auto-upload off: held until the player uploads from the Mission Log.
 const log=await page.evaluate(()=>{state.warflying.autoUpload=false;flight.route=route('meridian','kepler','warp',.4);for(let i=0;i<8;i++)update(.25);
  const waiting=VoidWarFlying.queue(state.warflying).length;openMissionLog();return {waiting,text:document.querySelector('#mission-log section.warflying')?.innerText};});
 assert.ok(log.waiting>=1,'held until the player uploads');assert.match(log.text,/RELAY LINK/);assert.match(log.text,/Admin’s briefing/);assert.match(log.text,/YOUR SHIP ON THE RELAY/);
 await page.locator('#mission-log [data-action=warflying-upload]').click();
 await page.evaluate(()=>{for(let i=0;i<8;i++)update(.25);});
 assert.equal(await page.evaluate(()=>VoidWarFlying.queue(state.warflying).length),0,'manual upload sent everything');
 await page.locator('#mission-log [data-action=warflying-auto]').click();assert.equal(await page.evaluate(()=>state.warflying.autoUpload),true);
 await page.locator('#mission-log section.warflying').scrollIntoViewIfNeeded();await page.screenshot({path:'work/warflying-c-log.png'});
 await page.evaluate(()=>closeMissionLog());
 // The scrambler, fitted in place of the scanner: a pilot logs you on arrival, unidentified.
 const scr=await page.evaluate(()=>{VoidProgression.install(state,'signal','warflying-scrambler');const before={...state.warflying.trail};
  flight.route=route('meridian','kepler','warp',.6);update(.05);const hud=document.getElementById('warflying-hud').textContent;
  let c=state.warflying.clock;while(!VoidWarFlyingScan.noticed('meridian','kepler',c))c++;state.warflying.clock=c;
  flight.route=route('meridian','kepler','arrived',1);update(.05);
  return {before,after:state.warflying.trail,hud,scanning:VoidWarFlyingScanner.installed};});
 assert.equal(scr.hud,'SCRAMBLER · ACTIVE');assert.equal(scr.scanning,false,'no scanning with the scrambler fitted');
 assert.equal(scr.after.unlinked,scr.before.unlinked+1);assert.equal(scr.after.linked,scr.before.linked,'earlier sightings untouched');
 assert.deepEqual(errors,[]);console.log('PASS WarFlying Stage C',{flight1,warp,trail:scr.after});
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
