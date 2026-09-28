const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.route('**/api/void-runner/**',r=>r.fulfill({status:503,body:'offline'}));await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline'}));
 await page.goto('http://127.0.0.1:5187/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started);await page.locator('[data-action="menu-new"]').click();await page.waitForFunction(()=>mode==='walking');
 await page.evaluate(async()=>{
  // Local entitlement fixture only. No backend ownership grant or purchase is performed.
  setOwnedGear(['spectre']);C.switchShip(state,'ship3');state.quest='arrival';state.story.chapter='arrival';state.universe.station=null;
  state.creditGear.push('launcher');state.loadout.missile='launcher';state.progression.missiles=5;
  window.expectedStats=JSON.parse(JSON.stringify(C.stats(state)));window.definitionsBefore=JSON.stringify(VoidShips.ships);
  await launch();const craft=VoidFlightSession.active.craft;window.firstCraft=craft;
  if(craft.config.shipId!=='ship3'||JSON.stringify(craft.config.stats)!==JSON.stringify(expectedStats))throw Error('Launch stats changed');
  if(hp!==expectedStats.hull||shieldHP!==expectedStats.shield||weaponBank.energy!==P.systems(state).capacity||missileState.missileCapacity!==14||missileState.missilesLoaded!==5)throw Error('Initial resources changed');
  if(weaponBank!==craft.resources.weaponBank||missileState!==craft.resources.missileState)throw Error('Resource aliases do not resolve to owner');
  damageTime=0;hurt(shieldHP+7);if(shieldHP!==0||hp!==expectedStats.hull-7)throw Error('Damage does not reach runtime');
  if(JSON.stringify(VoidShips.ships)!==definitionsBefore)throw Error('Damage changed definition');
  if(!P.consume(weaponBank,null,craft.config.systems))throw Error('Explicit power consumption failed');
  flight.route.phase='encounter';spawnEnemy();const e=enemies[enemies.length-1];Object.assign(e,{x:0,y:0,z:45,size:3});flight.yaw=flight.pitch=flight.roll=0;
  selectCombatTarget('nearest');selectCombatTarget('lock');for(let i=0;i<200;i++)VoidTargeting.step(missileLock,lockCandidates(),flightPoint,W,H,.04,missileBalance(),true);
  fireMissile();if(missileState.missilesLoaded!==4||state.progression.missiles!==4)throw Error('Missile consumption/persistence changed');
  if(JSON.parse(localStorage.getItem(SAVE_KEY)).progression.missiles!==4)throw Error('Missile save missing');
  openGameMenu();window.pausedResources=JSON.stringify(craft.resources);window.pausedConfig=JSON.stringify(craft.config);
 });
 await page.waitForTimeout(400);
 await page.evaluate(()=>{
  if(JSON.stringify(firstCraft.resources)!==pausedResources)throw Error('Paused resources changed');
  setOwnedGear([]);if(state.activeShip!=='starter')throw Error('Campaign ownership did not refresh');
  if(JSON.stringify(firstCraft.resources)!==pausedResources||JSON.stringify(firstCraft.config)!==pausedConfig)throw Error('Ownership refresh changed active craft');
  if(VoidFlightCraft.ship().id!=='ship3'||missileBalance().missileDamage!==firstCraft.config.missileBalance.missileDamage)throw Error('Flight lookup reverted to Campaign');
  hud();updateEquipmentHud();if(!document.querySelector('header .wide strong').textContent.includes('Spectre'))throw Error('HUD changed craft');
  resumeMenu();if(JSON.stringify(firstCraft.resources)!==pausedResources)throw Error('Resume reset resources');
 });
 await page.evaluate(async()=>{
  await safeRespawn();await launch();const next=VoidFlightSession.active.craft;
  if(next===firstCraft||next.resources===firstCraft.resources||next.resources.weaponBank===firstCraft.resources.weaponBank)throw Error('Replacement aliases old resources');
  if(next.config.shipId!=='starter'||hp!==next.config.stats.hull||shieldHP!==next.config.stats.shield||weaponBank.energy!==next.config.systems.capacity)throw Error('Recovery did not initialize next source');
  const saved=JSON.parse(localStorage.getItem(SAVE_KEY));if(saved.craft||saved.session||saved.resources)throw Error('Runtime leaked into save');
  const owner=VoidFlightSession.active;damageTime=0;hurt(99999);await launch();
  if(VoidFlightSession.active===owner||hp!==VoidFlightSession.active.craft.config.stats.hull)throw Error('Defeat retry inherited damage');
 });
 assert.deepEqual(errors,[]);console.log('PASS runtime ownership: validated craft, shared stats, hull/shield damage, power, missiles/save, pause, ownership refresh, HUD, recovery and fresh retry.');
}finally{console.log('PAGE ERRORS',errors);await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
