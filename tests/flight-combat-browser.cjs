/* Flight combat in the real game (Chromium, software GL, offline: every API call refused).
   A. A new character leaves the pod; a mission's ship grant (Campaign.awardStarterShip, what the Mission Editor's "Give the player a ship" calls) gives the Kestrel
      with its launcher, a full M1 rack and the Ship Loadout app: the V1 banner, the app tile, the app (slots with their names, lasers, both racks, default missile).
   B. Admin's counter: talking to Admin (after Mission 001's step) opens ship ordnance; buy M2 rounds; M1 is full; prices from the balance values.
   C. Flight Skirmish: lock-on (seeking, then locked; tones), Next / Previous / Nearest cycling, an M1 fired at a target (hit), an M2 at a target that breaks hard
      (the M2's slow turn loses it: a miss) and an M1 at the same break (it holds on), dumb-fire without a lock, lasers (muzzle flashes, bolts), the switch key,
      and the sounds asked for (VoidFlightSfx.counts: a headless browser cannot listen). Screenshots in SHOTS.
   D. Campaign flight: L opens the V1 on the Map app (flight navigation): this system's places and warp markers; choosing Kepler puts the blue NAV square on the
      warp marker to Meridian (Erebus); a mission at Kepler puts the yellow MISSION square on the same marker.
   Usage: node tests/flight-combat-browser.cjs   (own static server; SHOTS=dir; BROWSER_EXECUTABLE=path; ONLY=A,C or D to run parts: C and D start from a test ship).
   Software GL runs the game at a fraction of real time: allow about 30 minutes. */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const shots=process.env.SHOTS||path.resolve(__dirname,'..','docs/development/flight-combat');fs.mkdirSync(shots,{recursive:true});
const bundled=['/opt/pw-browsers/chromium','/opt/pw-browsers/chromium-1243/chrome-linux64/chrome'].find(f=>fs.existsSync(f)),exe=process.env.BROWSER_EXECUTABLE||bundled||null;
function serve(){const root=path.resolve(__dirname,'..'),types={'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.ogg':'audio/ogg','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.glb':'model/gltf-binary'};
 const srv=http.createServer((req,res)=>{let f;try{f=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));}catch{res.writeHead(400);return res.end();}if(!f.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);return res.end();}res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(d);});});
 return new Promise(r=>srv.listen(0,'127.0.0.1',()=>r(srv)));}
const log=m=>console.log(new Date().toISOString().slice(11,19),m);
(async()=>{
 const srv=await serve(),base='http://127.0.0.1:'+srv.address().port;
 const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader','--no-sandbox','--autoplay-policy=no-user-gesture-required'],...(exe?{executablePath:exe}:{})});
 const ctx=await browser.newContext({viewport:{width:1366,height:768},serviceWorkers:'block'}),page=await ctx.newPage();page.setDefaultTimeout(300000);const errors=[];
 page.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR',e.message,(e.stack||'').split('\n').slice(0,4).join(' | '));});
 await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));
 await page.route('**/api/**',r=>r.fulfill({status:503,contentType:'application/json',body:'{}'}));
 await page.addInitScript(()=>{if(!sessionStorage.getItem('i')){localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:'medium',v:2,chosen:true}));sessionStorage.setItem('i','1');}});
 await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started);
 await page.evaluate(()=>Object.assign(VoidPreparation.limits,{scene:600000,assets:600000,optional:300000,total:1200000,module:600000,artwork:300000}));
 const shot=async name=>{await page.screenshot({path:path.join(shots,name+'.png')});log('shot '+name);};
 try{
  if(!process.env.ONLY||process.env.ONLY.includes('A')){
  // ---- A: a new character, the ship grant, the V1 app
  await page.click('[data-action=menu-campaign]');await page.click('[data-action=menu-new]');const c=page.locator('[data-action=menu-new-confirm]');if(await c.count())await c.click();
  await page.waitForSelector('#character-creator.on');await page.waitForFunction(()=>!document.querySelector('[data-cc=confirm]').disabled);await page.locator('[data-cc=confirm]').click();
  await page.waitForFunction(()=>mode==='pod-waking'&&walker,null,{timeout:300000});await page.waitForFunction(()=>VoidAssets.pending===0,null,{timeout:300000});await page.waitForTimeout(800);
  await page.keyboard.press('KeyE');await page.waitForFunction(()=>mode==='walking'&&walker,null,{timeout:300000});log('walking');
  const before=await page.evaluate(()=>({ship:VoidShips.hasShip(state),app:VoidDeviceV1.restore(state.story.flags).apps.includes('loadout'),launcher:state.creditGear.includes('launcher')}));
  assert.deepEqual(before,{ship:false,app:false,launcher:false},'a new campaign has no ship, no launcher and no Loadout app');
  await page.waitForTimeout(9000);   // let Mission 001's call banner pass
  const granted=await page.evaluate(()=>{const r=VoidMissionContent?.unlockNow?VoidMissionContent.unlockNow(state,{kind:'ship',id:'starter'},{},C):(C.awardStarterShip(state),'SHIP ACQUIRED');save();
   return {r,ship:VoidShips.hasShip(state),launcher:state.creditGear.includes('launcher'),fitted:state.loadout.missile,m1:VoidOrdnance.counts(state),flag:state.story.flags.loadoutApp,app:VoidDeviceV1.restore(state.story.flags).apps.includes('loadout')};});
  log('granted '+JSON.stringify(granted));assert.equal(granted.ship,true);assert.equal(granted.launcher,true);assert.equal(granted.fitted,'launcher');assert.deepEqual(granted.m1,{m1:6,m2:0});assert.equal(granted.app,true);
  if(await page.evaluate(()=>VoidKeyMapUI?.open))await page.keyboard.press('KeyK');
  await page.waitForFunction(()=>state.story.flags.loadoutAppSeen===true,null,{timeout:60000});await page.waitForTimeout(400);await shot('a1-banner');
  log('banner: '+await page.evaluate(()=>document.getElementById('pd-notify')?.textContent||''));   // Mission 001's call banner can replace it on a slow machine; the app notice was sent (loadoutAppSeen)
  if(await page.evaluate(()=>VoidKeyMapUI?.open))await page.keyboard.press('KeyK');await page.waitForTimeout(300);
  await page.evaluate(()=>VoidPersonalDevice.open());await page.waitForTimeout(1500);for(let i=0;i<3;i++){const b=page.locator('#personal-device [data-do=back]');if(await b.count()&&await b.first().isVisible()){await b.first().click();await page.waitForTimeout(700);}}
  await page.waitForFunction(()=>!!document.querySelector('#personal-device [data-app=loadout]'),null,{timeout:30000});await page.waitForTimeout(600);await shot('a2-v1-home');
  await page.evaluate(()=>document.querySelector('#personal-device [data-app=loadout]').click());await page.waitForFunction(()=>!!document.querySelector('#personal-device .lo-ship'),null,{timeout:30000});await page.waitForTimeout(400);await shot('a3-loadout-app');
  const text=await page.locator('#personal-device').innerText();for(const w of ['LASER CANNONS','MISSILES','M1 SEEKER','M2 HEAVY','DRIVE','UTILITY','SHIELD','PRIMARY'])assert.ok(text.includes(w),'the app shows '+w);
  await page.evaluate(()=>document.querySelector('#personal-device [data-loadout="select:m2"]').click());assert.equal(await page.evaluate(()=>state.progression.missileType),'m2');await page.evaluate(()=>document.querySelector('#personal-device [data-loadout="select:m1"]').click());
  for(let i=0;i<4&&await page.evaluate(()=>VoidPersonalDevice.isOpen);i++){await page.evaluate(()=>VoidPersonalDevice.close());await page.waitForTimeout(500);}
  // ---- B: Admin's counter
  await page.evaluate(()=>{state.credits=1000;save();});
  assert.ok(await page.evaluate(()=>VoidNeoChinatown.layout('interior').interactions.some(i=>i.id==='admin-ordnance'&&VoidStory.matches(state,i.when))),'the ordnance counter beside Admin is there for a pilot');
  // Admin offers his mission in person (Mission 002) when talked to; the counter beside him is always his stock. A mission conversation can pop up at any time
  // in this test, so each step opens the stock and acts in one go.
  const counter=a=>page.evaluate(a=>{document.querySelectorAll('[data-talk-choice].quiet').forEach(b=>b.click());VoidInteractions.handlers.get('admin-ordnance')({});const has=!!document.querySelector('.ord-card'),pistol=!!document.querySelector('[data-admin-item]');
   if(a)document.querySelector('[data-action="'+a+'"]')?.click();return {mode,has,pistol,m1buy:!!document.querySelector('[data-action="ord-buy:m1:1"]'),credits:state.credits,c:VoidOrdnance.counts(state),saved:JSON.parse(localStorage.getItem(SAVE_KEY)).progression.m2};},a);
  const view=await counter(null);log('counter '+JSON.stringify(view));assert.ok(view.has,'the missile cards are in Admin\'s stock');assert.ok(view.pistol,'beside the rest of his stock (the pistol)');assert.equal(view.m1buy,false,'M1 rack is full: no M1 to buy');
  await shot('b1-admin-counter');
  const m2price=await page.evaluate(()=>VoidOrdnance.price('m2'));
  const bought=await counter('ord-buy:m2:1');log('bought '+JSON.stringify(bought));assert.equal(bought.credits,1000-m2price);assert.equal(bought.c.m2,1);assert.equal(bought.saved,1);
  const two=await counter('ord-buy:m2:2');assert.equal(two.c.m2,3);await page.waitForTimeout(200);await shot('b2-admin-bought');
  await page.evaluate(()=>{document.querySelector('[data-action=progress-return]')?.click();});await page.waitForTimeout(500);
  }else await page.evaluate(()=>{const d=C.startDistrictCampaign(C.fresh());d.story.flags.podWakePending=false;C.awardStarterShip(d);state=d;save();});
  if(!process.env.ONLY||process.env.ONLY.includes('C')){
  // ---- C: flight
  await page.evaluate(()=>VoidAudio.unlock());
  await page.evaluate(async()=>{VoidFlightSkirmish.setup();await VoidFlightSkirmish.start();});
  await page.waitForFunction(()=>mode==='play'&&VoidFlightSkirmish.active?.status==='active',null,{timeout:300000});log('flying');
  // A controlled range: the ship holds still, the enemies follow a script (the game's own guidance, damage, fuse and effects run unchanged).
  await page.evaluate(()=>{window.__pilot=VoidPilotFlight.step;VoidPilotFlight.step=function(f){f.velocity={x:0,y:0,z:0};f.yawRate=0;f.pitchRate=0;};
   VoidEnemyPilots.step=function(e,dt){const p=e.pilot;p.canFire=false;p.lock=0;e.velocity=e.script?e.script(e,dt):{x:0,y:0,z:0};return p;};
   VoidFlightSkirmish.lineBlocked=()=>false;VoidFlightSkirmish.blocksSegment=()=>false;flight.rocks.forEach(r=>{r.z+=400;});
   const place=(e,x,y,z)=>{Object.assign(e,{x,y,z,dead:false});e.armor=e.maxArmor=30;e.shield=e.maxShield=0;};
   enemies.forEach((e,i)=>place(e,(i-0.5)*60,8,160+i*20));flight.yaw=flight.pitch=flight.roll=0;window.__place=place;VoidFlightSfx.reset();});
  const S=()=>page.evaluate(()=>({lock:Math.round(missileLock.progress*100),locked:missileLock.progress>=1,target:enemies.indexOf(missileLock.target),sel:enemies.indexOf(selectedTarget),type:missileState.type,loaded:missileState.missilesLoaded,rack:missileState.rack,log:VoidFlightCombat.log.slice(-6),sfx:{...VoidFlightSfx.counts},lockState:VoidFlightSfx.lockState,engine:VoidFlightSfx.engineLevel,running:VoidFlightSfx.running}));
  // cycling: Next / Previous / Nearest
  await page.keyboard.press('Tab');const s1=await S();await page.keyboard.press('Tab');const s2=await S();await page.keyboard.press('KeyG');const s3=await S();await page.keyboard.press('KeyT');const s4=await S();
  log('cycle '+[s1.sel,s2.sel,s3.sel,s4.sel].join(' '));assert.notEqual(s1.sel,s2.sel,'Next changes target');assert.equal(s3.sel,s1.sel,'Previous goes back');assert.equal(s4.sel,0,'Nearest picks the closest');
  await shot('c1-cycle-target');
  // one target straight ahead, the other out of the way
  await page.evaluate(()=>{__place(enemies[0],0,0,110);__place(enemies[1],90,60,260);selectCombatTarget('clear');selectCombatTarget('lock');});
  await page.waitForFunction(()=>missileLock.target&&missileLock.progress>.3&&missileLock.progress<.8,null,{timeout:60000});await shot('c2-seeking');
  const seeking=await S();assert.equal(seeking.lockState,'seeking');
  await page.waitForFunction(()=>missileLock.progress>=1,null,{timeout:60000});await page.waitForTimeout(150);await shot('c3-locked');
  const locked=await S();log('locked '+JSON.stringify({lockState:locked.lockState,sfx:locked.sfx,engine:locked.engine,running:locked.running}));assert.equal(locked.lockState,'locked');assert.ok(locked.sfx['lock-seeking']&&locked.sfx.lock,'seeking and lock tones');
  // M1 at the locked target: a hit
  await page.keyboard.press('KeyF');await page.waitForTimeout(250);await shot('c4-m1-away');
  await page.waitForFunction(()=>VoidFlightCombat.log.some(x=>x.kind==='hit'||x.kind==='miss'),null,{timeout:60000});await page.waitForTimeout(120);await shot('c5-m1-hit');
  const hit=await S();log('m1 '+JSON.stringify(hit.log));assert.ok(hit.log.some(x=>x.kind==='hit'&&x.type==='m1'),'M1 hits a steady target');
  // the turning test: the target breaks hard sideways the moment the missile is away. M2 (slow turn) loses it; M1 holds on.
  const breakTest=async type=>{await page.evaluate(t=>{const e=enemies.find(x=>!x.dead)||enemies[0];__place(e,0,0,120);e.script=null;for(const o of enemies)if(o!==e)__place(o,-200,-150,400);if(missileState.type!==t)switchMissile(t);missileCooldown=0;selectCombatTarget('clear');selectCombatTarget('lock');window.__target=e;},type);
   await page.waitForFunction(()=>missileLock.progress>=1&&missileLock.target===__target,null,{timeout:60000});
   await page.evaluate(()=>{VoidFlightCombat.log.length=0;fireMissile();const e=__target,t0=time;e.script=(o)=>({x:time-t0>.25?50:0,y:time-t0>.25?15:0,z:time-t0>.25?-30:0});});
   await page.waitForTimeout(500);await shot('c6-'+type+'-break');
   await page.waitForFunction(()=>VoidFlightCombat.log.some(x=>x.kind==='hit'||x.kind==='miss'),null,{timeout:600000});const r=await S();await page.evaluate(()=>{if(__target)__target.script=null;});return r.log;};
  const m2=await breakTest('m2');log('m2 break '+JSON.stringify(m2));
  const m1=await breakTest('m1');log('m1 break '+JSON.stringify(m1));
  assert.ok(m2.some(x=>x.kind==='miss'),'the slow-turning M2 misses a hard break');assert.ok(m1.some(x=>x.kind==='hit'),'the agile M1 follows the same break');
  // dumb-fire: no lock, the missile goes straight ahead
  await page.evaluate(()=>{selectCombatTarget('clear');missileCooldown=0;VoidFlightCombat.log.length=0;fireMissile();});const dumb=await S();assert.ok(dumb.log.some(x=>x.kind==='launch'&&!x.guided),'a missile without a lock is fired unguided');
  // the switch key
  const t0=(await S()).type;await page.keyboard.press('KeyZ');const t1=(await S()).type;assert.notEqual(t0,t1,'Z switches M1 / M2');
  // lasers: hold fire
  await page.evaluate(()=>{const e=enemies.find(x=>!x.dead);if(e){__place(e,0,0,70);e.shield=e.maxShield=6;}selectCombatTarget('clear');});
  await page.keyboard.down('Space');await page.waitForTimeout(700);await shot('c7-lasers');await page.waitForTimeout(400);await page.keyboard.up('Space');
  const fx=await page.evaluate(()=>({...VoidFlightFx.diag}));const sfx=(await S()).sfx;log('fx '+JSON.stringify(fx)+' sfx '+JSON.stringify(sfx));
  assert.ok(fx.muzzles>0&&fx.launches>=4,'muzzle and rail flashes');for(const k of ['laser','missile','explosion','lock','hit'])assert.ok(sfx[k]>0,'sound '+k);
  assert.ok((await S()).engine>0,'engine layer follows the throttle');
  }
  // ---- D: Campaign flight, the V1 Map app's flight navigation and the squares on the markers
  await page.evaluate(async()=>{if(window.__pilot)VoidPilotFlight.step=window.__pilot;if(VoidFlightSkirmish.active)await VoidFlightSkirmish.end();});
  await page.evaluate(()=>{state.universe.discoveredLocations=[...new Set([...state.universe.discoveredLocations,'sol-belt','mars','meridian','kepler'])];state.location='earth';save();
   window.__active=VoidMissions.active;VoidMissions.active=(s,c)=>[...window.__active(s,c),{id:'test-far',title:'Test job at Kepler',destination:'kepler'}];});   // a mission in another system (test only)
  await page.evaluate(async()=>{await launch();});await page.waitForFunction(()=>mode==='play'&&flight.route&&flight.route.phase==='align',null,{timeout:300000});log('campaign flight '+await page.evaluate(()=>flight.route.origin+'→'+flight.route.destination));
  await page.keyboard.press('KeyL');await page.waitForFunction(()=>!!document.querySelector('#personal-device [data-nav]'),null,{timeout:30000});await page.waitForTimeout(500);await shot('d1-map-app-flight');
  const listed=await page.evaluate(()=>[...document.querySelectorAll('#personal-device [data-nav]')].map(b=>b.dataset.nav));log('map lists '+listed.join(','));
  for(const id of ['sol-belt','mars','meridian','kepler'])assert.ok(listed.includes(id),'the Map app lists '+id);
  await page.evaluate(()=>document.querySelector('#personal-device [data-nav="kepler"]').click());await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>state.story.flags.navTarget),'kepler');await shot('d2-map-app-selected');
  await page.keyboard.press('KeyL');await page.waitForTimeout(300);
  await page.evaluate(()=>{const r=flightRoutes().find(x=>x.id==='meridian');flight.yaw=Math.atan2(r.vector.x,r.vector.z)+.16;flight.pitch=0;flight.roll=0;});
  await page.waitForFunction(()=>VoidNavigationReveal.opacity(navigationReveal)>=1&&VoidFlightNav.shown.nav,null,{timeout:300000}).catch(()=>{});   // the markers fade in 2 s (game time) after the align starts
  const marks=await page.evaluate(()=>VoidFlightNav.shown);log('marks '+JSON.stringify(marks));assert.equal(marks.nav,'meridian','blue square on the warp marker toward Kepler');assert.ok(marks.mission.includes('meridian'),'yellow square for the mission in another system');
  await shot('d3-warp-marker-squares');
  await page.evaluate(()=>{VoidMissions.active=window.__active;});
  assert.deepEqual(errors.filter(m=>!/reading 'update'/.test(m)),[],'no page errors');   // cache.js's 15-minute service-worker update check fails when a test blocks service workers (not this feature)
  log('PASS');
 }catch(e){console.error(e);await shot('zz-failure').catch(()=>{});process.exitCode=1;console.log('errors',errors);}
 finally{await browser.close();srv.close();}
})();
