const{chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
const browser=await chromium.launch({channel:'msedge',headless:true});
async function page(){const p=await browser.newPage();await p.route('**/firebase-auth.js',r=>r.abort());await p.route('**/api/void-runner/**',r=>r.fulfill({status:503,body:'offline'}));return p;}
async function pilot(p){for(let chunk=0;chunk<250;chunk++){
 const status=await p.evaluate(()=>{for(let i=0;i<80&&mode==='play';i++){
  const e=enemies.find(VoidStory.hostile),v=e&&flight.route.phase==='encounter'?e:flight.route.vector,lead=e&&flight.route.phase==='encounter'?FM.length(e)/VOID_BALANCE.laserProjectileSpeed:0;
  const x=v.x+(e?.velocity.x||0)*lead-flight.velocity.x*lead,y=v.y+(e?.velocity.y||0)*lead-flight.velocity.y*lead,z=v.z+(e?.velocity.z||0)*lead-flight.velocity.z*lead;
  const yaw=Math.atan2(x,z),pitch=Math.atan2(y,Math.hypot(x,z));flight.mouseX=FM.clamp(Math.atan2(Math.sin(yaw-flight.yaw),Math.cos(yaw-flight.yaw))*3-flight.yawRate*.5,-1,1);flight.mouseY=FM.clamp((pitch-flight.pitch)*3-flight.pitchRate*.5,-1,1);firing=!!e;update(.04);
 }draw();return mode;});
 if(status==='preparing-flight'){await p.waitForFunction(()=>mode!=='preparing-flight');continue;}if(status!=='play')return;
}throw Error('Pilot did not finish');}
try{
 const p=await page(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/vendor/babylon-8.26.0.js',async r=>{await new Promise(resolve=>setTimeout(resolve,32000));await r.continue();});
 await p.goto('http://127.0.0.1:5000/void-runner.html');await p.waitForFunction(()=>VoidStartup.started);
 assert.equal(await p.evaluate(()=>localStorage.getItem('void-runner-graphics-v1')),null);assert.equal(await p.evaluate(()=>VoidGraphics.renderer),'babylon');
 await p.click('[data-action=menu-new]');await p.click('[data-action=story-intro]');for(let i=0;i<6;i++)await p.click('[data-action=speech-next]');await p.click('[data-action="story-choice:0"]');for(let i=0;i<2;i++)await p.click('[data-action=speech-next]');
 await p.waitForTimeout(30500);assert.equal(await p.evaluate(()=>mode),'preparing');assert.equal(await p.locator('[data-action=migration-fallback]').count(),0);
 await p.waitForFunction(()=>mode==='play',null,{timeout:15000});assert.equal(await p.evaluate(()=>skyRendererAttempted),false);
 const geometry=await p.evaluate(()=>{mode='pause';draw();return {z:VoidBabylon.diagnostics.stationPosition[2],ready:VoidBabylon.diagnostics.exteriorReady,rocks:VoidBabylon.scene.meshes.filter(m=>m.name==='asteroid').length};});assert(geometry.z<0&&geometry.ready&&geometry.rocks>0);
 const reveal=await p.evaluate(()=>{mode='play';VoidNavigationReveal.reset(navigationReveal,'departure');update(1.9);const early=VoidNavigationReveal.opacity(navigationReveal);update(.5);return {early,late:VoidNavigationReveal.opacity(navigationReveal)};});assert.equal(reveal.early,0);assert(reveal.late>0);
 await pilot(p);await p.getByRole('button',{name:'EXIT TO SPACE STATION →',exact:true}).click();await p.click('[data-action=bar]');await p.click('[data-action=talk-rook]');
 await p.evaluate(()=>{speech.shown=speech.lines[0].text.length;updateSpeech(0);});await p.click('[data-action=speech-next]');await p.click('[data-action=launch]');await p.waitForFunction(()=>mode==='play');assert.equal(await p.evaluate(()=>ambientTraffic.contacts.length),0);
 await pilot(p);await p.evaluate(()=>{speech.shown=speech.lines[0].text.length;updateSpeech(0);});await p.getByRole('button',{name:'GO BACK TO YOUR SHIP →',exact:true}).click();
 assert.equal(await p.locator('[data-action=launch]').count(),1);assert(!/Make this ship|KEEP PLAYING/.test(await p.locator('#screen').innerText()));
 const saved=await p.evaluate(()=>({credits:state.credits,quest:state.quest,ship:state.activeShip,upgrades:state.upgrades}));
 await p.unroute('**/vendor/babylon-8.26.0.js');await p.reload();await p.waitForFunction(()=>VoidStartup.started);await p.click('[data-action=menu-load]');await p.click('[data-action=menu-load-local]');await p.waitForFunction(()=>mode==='play');
 assert.deepEqual(await p.evaluate(()=>({credits:state.credits,quest:state.quest,ship:state.activeShip,upgrades:state.upgrades})),saved);
 await p.evaluate(()=>{mode='pause';});
 // Same physical station cannot appear during early warp or an interdiction.
 const visibility=await p.evaluate(async()=>{await VoidBabylon.prepareSpace(current.destination);flight.route.phase='warp';flight.route.progress=.1;draw();const early=VoidBabylon.diagnostics.stationVisible;flight.route.progress=.8;draw();const late=VoidBabylon.diagnostics.stationVisible;flight.route.phase='encounter';draw();return {early,late,combat:VoidBabylon.diagnostics.stationVisible};});assert.deepEqual(visibility,{early:false,late:true,combat:false});
 assert.deepEqual(errors,[]);await p.close();
 // Persisted renderer settings and explicit switch in both directions.
 const settings=await page();await settings.goto('http://127.0.0.1:5000/void-runner.html');await settings.waitForFunction(()=>VoidStartup.started);
 await settings.evaluate(()=>{state=C.fresh();C.beginJourney(state);save();});
 for(const renderer of ['legacy','babylon','legacy','babylon']){
  await settings.evaluate(()=>{title();settingsPage();});await settings.selectOption('#renderer-setting',renderer);await settings.reload();await settings.waitForFunction(()=>VoidStartup.started);assert.equal(await settings.evaluate(()=>VoidGraphics.renderer),renderer);
  await settings.evaluate(async()=>await launch());assert.equal(await settings.evaluate(()=>activeRenderer),renderer);
 }
 await settings.close();
 for(const failure of ['http','timeout']){
  const f=await page(),logs=[];f.on('console',m=>{if(m.type()==='error')logs.push(m.text());});
  await f.route('**/vendor/babylon-8.26.0.js',async r=>{if(failure==='timeout'){await new Promise(resolve=>setTimeout(resolve,600));await r.continue().catch(()=>{});}else await r.abort();});
  await f.goto('http://127.0.0.1:5000/void-runner.html');await f.waitForFunction(()=>VoidStartup.started);
  await f.evaluate(async()=>{VoidGraphics.renderer='babylon';graphicsSave();VoidPreparation.limits.module=100;state=C.fresh();C.beginJourney(state);await launch();});
  assert.equal(await f.locator('[data-action=migration-fallback]').count(),1);assert.equal(await f.evaluate(()=>JSON.parse(localStorage.getItem('void-runner-graphics-v1')).renderer),'babylon');assert(logs.some(s=>s.includes('[VOID//RUNNER preparation]')));
  await f.waitForTimeout(700);assert.equal(await f.evaluate(()=>mode),'dock');assert.equal(await f.evaluate(()=>VoidBabylon.diagnostics.ready),false);
  await f.click('[data-action=migration-fallback]');assert.equal(await f.evaluate(()=>activeRenderer),'legacy');assert.equal(await f.evaluate(()=>JSON.parse(localStorage.getItem('void-runner-graphics-v1')).renderer),'legacy');await f.close();
 }
 console.log('PASS clean 32-second first load, full Mara/arrival/delivery UI, returning save, station geometry/reveal, settings persistence and explicit fallback after HTTP failure/timeout');
}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
