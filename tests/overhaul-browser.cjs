/* Real browser integration. Fixtures fast-forward routes and clear enemies through hitEnemy;
   missile acquisition/impact, steering, purchases and UI use the production systems. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'msedge'});
 try{
 const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline fixture'}));await page.route('**/api/void-runner/**',r=>r.fulfill({status:503,body:'offline fixture'}));
 await page.goto('http://127.0.0.1:5000/void-runner.html');await page.waitForFunction(()=>VoidStartup.started);
 assert.equal(await page.evaluate(()=>state.activeShip),'starter');
 const output=process.env.VOID_SCREENSHOT_DIR;if(output)fs.mkdirSync(output,{recursive:true});
 const capture=async name=>{if(output)await page.screenshot({path:path.join(output,name+'.png')});};
 await page.getByRole('button',{name:'MEET MARA →',exact:true}).click();await page.getByRole('button',{name:'NEXT →',exact:true}).click();await page.getByRole('button',{name:'NEXT →',exact:true}).click();await page.getByRole('button',{name:'BOARD SHIP →',exact:true}).click();
 await page.keyboard.down('d');await page.waitForFunction(()=>flight.yaw>.08,{},{timeout:5000});await page.keyboard.up('d');assert(await page.evaluate(()=>flight.yaw>.02),'Real keyboard events turn the cockpit');
 const turn=await page.evaluate(()=>{mode='play';flight.mouseX=0;const before=flight.yaw;keys.add('KeyD');for(let i=0;i<12;i++)update(.04);keys.clear();const rate=flight.yawRate;update(.04);mode='pause';return {turned:flight.yaw>before,inertia:flight.yawRate>0&&flight.yawRate<rate,route:flight.route.phase,ammo:missileState.missilesLoaded};});assert(turn.turned&&turn.inertia);assert.equal(turn.route,'align');assert.equal(turn.ammo,0);await capture('starter-align');
 async function completeRoute(){return page.evaluate(()=>{
   let interrupted=false,resumed=false;
   for(let i=0;i<5000&&['play','pause'].includes(mode);i++){
    mode='play';keys.clear();flight.mouseX=flight.mouseY=0;
    if(flight.route.phase==='align'){flight.yaw=Math.atan2(flight.route.vector.x,flight.route.vector.z);flight.pitch=0;flight.yawRate=flight.pitchRate=0;}
    if(flight.route.phase==='encounter'){interrupted=true;while(spawned<current.enemies)spawnEnemy();for(const e of enemies)hitEnemy(e,100000);enemies=enemies.filter(e=>!e.dead);objectiveCount=3;}
    const old=flight.route.phase;update(.04);if(old==='encounter'&&flight.route?.phase==='align')resumed=true;
   }
   return {mode,interrupted,resumed,location:state.location,combatRuns:state.combatRuns,travel:state.travel};
 });}
 assert.equal((await completeRoute()).location,'meridian');
 await page.getByRole('button',{name:'OPEN STATION MENU →',exact:true}).click();await page.getByRole('button',{name:'GO TO BAR →',exact:true}).click();await page.getByRole('button',{name:'ROOK · TALK',exact:true}).click();await page.getByRole('button',{name:'ACCEPT JOB →',exact:true}).click();await page.getByRole('button',{name:'LAUNCH →',exact:true}).click();
 const first=await completeRoute();assert(first.interrupted&&first.resumed);assert.equal(first.combatRuns,1);assert.equal(await page.evaluate(()=>state.missileUnlocked),false);
 await page.getByRole('button',{name:'OPEN STATION MENU →',exact:true}).click();await page.getByRole('button',{name:'KEEP PLAYING',exact:true}).click();await page.getByRole('button',{name:'RETURN TO MERIDIAN →',exact:true}).click();await completeRoute();await page.getByRole('button',{name:'OPEN STATION MENU →',exact:true}).click();await page.getByRole('button',{name:'GO TO BAR →',exact:true}).click();await page.getByRole('button',{name:'ROOK · TALK',exact:true}).click();await page.getByRole('button',{name:'ACCEPT JOB →',exact:true}).click();await page.getByRole('button',{name:'LAUNCH →',exact:true}).click();
 const second=await completeRoute();assert.equal(second.combatRuns,2);assert.equal(second.travel,null);assert.equal(await page.evaluate(()=>speech.lines.filter(l=>l.who==='rook').length),1);await page.getByRole('button',{name:'NEXT →',exact:true}).click();assert((await page.locator('#spoken-text').innerText()).includes('missile launcher'));await capture('rook-missile-offer');await page.getByRole('button',{name:'OPEN STATION MENU →',exact:true}).click();await page.locator('#expansion-nav [data-action="shop"]').click();
 await page.getByRole('button',{name:'INSTALL / ROOK’S VOUCHER',exact:true}).click();assert(await page.evaluate(()=>state.creditGear.includes('launcher')&&state.loadout.missile==='launcher'));
 await page.locator('#expansion-nav [data-action="hangar"]').click();await capture('hangar-starter');
 await page.evaluate(()=>{state.credits=3500;save();});await page.getByRole('button',{name:'STATION SHOP',exact:true}).click();await page.getByRole('button',{name:'BUY SHIP / 1000 CR',exact:true}).click();assert.equal(await page.evaluate(()=>state.credits),2500);assert.equal(await page.evaluate(()=>state.activeShip),'starter');
 assert.equal(await page.getByRole('button',{name:'BUY SHIP / 2500 CR',exact:true}).count(),0);await page.evaluate(()=>setOwnedGear(['spectre']));assert.equal(await page.evaluate(()=>state.credits),2500);await page.getByRole('button',{name:'OPEN HANGAR',exact:true}).click();
 const profiles=[];
 for(const id of ['ship2','ship3','starter']){
  if(id!=='starter')await page.locator('[data-action="ship-select:'+id+'"]').click();else await page.locator('[data-action="ship-select:starter"]').click();
  if(id!=='starter')await page.locator('[data-action="hangar-equip:launcher"]').click();
  const flightTest=await page.evaluate(()=>{C.chooseDestination(state,state.location==='kepler'?'meridian':'kepler');launch();mode='play';flight.route.phase='align';keys.add('KeyD');for(let i=0;i<15;i++)update(.04);keys.clear();mode='pause';draw();return {ship:state.activeShip,rate:flight.yawRate,cockpit:VoidShips.get(state).cockpit,audio:VoidShips.get(state).audio,capacity:missileState.missileCapacity};});profiles.push(flightTest);await capture(id+'-cockpit');await page.evaluate(()=>{mode='dock';hangar();});
 }
 assert(profiles[2].rate<profiles[0].rate&&profiles[0].rate<profiles[1].rate);assert.equal(new Set(profiles.map(p=>p.cockpit)).size,3);assert.equal(new Set(profiles.map(p=>p.audio.frequency)).size,3);
 const lock=await page.evaluate(()=>{
  C.chooseDestination(state,'kepler');launch();mode='play';flight.route.phase='encounter';flight.route.encounter.state='active';flight.yaw=flight.pitch=flight.roll=0;flight.velocity={x:0,y:0,z:0};spawnEnemy();const e=enemies[0];Object.assign(e,{x:0,y:0,z:55,armor:100,maxArmor:100,shield:0,fire:99});
  for(let i=0;i<80;i++)stepMissileCombat(.02,{x:0,y:0,z:0});mode='pause';draw();return {progress:missileLock.progress,ammo:missileState.missilesLoaded};
 });assert.equal(lock.progress,1);await capture('missile-lock');
 const fired=await page.evaluate(()=>{mode='play';fireMissile();const count=missiles.length;for(let i=0;i<100;i++)stepMissileCombat(.02,{x:0,y:0,z:0});mode='pause';return {count,ammo:missileState.missilesLoaded,armor:enemies[0].armor};});assert.equal(fired.count,1);assert.equal(fired.ammo,lock.ammo-1);assert.equal(fired.armor,85);
 const warning=await page.evaluate(()=>{mode='play';missileState.equipped=false;missileLock=VoidTargeting.fresh();const e=enemies[0];Object.assign(e,{x:0,y:0,z:125,heavy:true,fire:999,velocity:{x:0,y:0,z:-20}});VoidEnemyPilots.init(e,'elite');e.pilot.missileCooldown=0;flight.mouseX=flight.mouseY=0;flight.yaw=flight.pitch=flight.yawRate=flight.pitchRate=0;let acquiring=false;for(let i=0;i<200&&!enemyMissiles.length&&mode==='play';i++){update(.04);acquiring||=e.pilot.lock>.05;}mode='pause';draw();return {acquiring,incoming:enemyMissiles.length};});assert(warning.acquiring&&warning.incoming>0);await capture('enemy-missile-warning');
 await page.evaluate(()=>{mode='dock';C.switchShip(state,'ship3');save();audioSettings();});
 await page.getByLabel('Audio on',{exact:true}).check();await page.getByLabel('NPC voices on',{exact:true}).check();await page.getByLabel('Voice volume',{exact:true}).fill('0.5');await page.reload();await page.waitForFunction(()=>VoidStartup.started);
 assert.equal(await page.evaluate(()=>state.activeShip),'starter');assert.equal(await page.evaluate(()=>state.ownedShips.length),2);assert.equal(await page.evaluate(()=>VoidAudio.settings.voice),.5);assert.equal(await page.evaluate(()=>state.missileOfferSeen),true);
 await page.setViewportSize({width:390,height:844});await page.locator('#expansion-nav [data-action="hangar"]').click();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await capture('hangar-mobile');
 await page.evaluate(()=>{C.chooseDestination(state,'kepler');launch();mode='pause';draw();});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await capture('cockpit-mobile');
 const touch=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});touch.on('pageerror',e=>errors.push(e.message));await touch.goto('http://127.0.0.1:5000/void-runner.html');await touch.waitForFunction(()=>VoidStartup.started);assert(await touch.evaluate(()=>{state.quest='arrival';launch();flight.route.phase='align';aim({clientX:innerWidth*.8,clientY:innerHeight*.44});update(.1);mode='pause';return flight.yaw>0;}));
 assert.deepEqual(errors,[]);console.log('Overhaul browser checks passed:',JSON.stringify({first,second,profiles,lock,fired,errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
