const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'}),page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline'}));await page.route('**/api/void-runner/**',r=>r.fulfill({status:503,body:'offline'}));
 const out=process.env.VOID_SCREENSHOT_DIR;const shot=async name=>{if(out){fs.mkdirSync(out,{recursive:true});await page.screenshot({path:path.join(out,name+'.png')});}};
 try{
 await page.goto('http://127.0.0.1:5000/void-runner.html?renderer=legacy');await page.waitForFunction(()=>window.VoidStartup?.started);
 const assets=[];
 for(const origin of ['meridian','kepler','undertow','foundry']){
  const result=await page.evaluate(async origin=>{
   save=()=>{};state=C.fresh();state.quest='open';state.completed=2;state.location=origin;C.chooseDestination(state,origin==='kepler'?'meridian':'kepler');launch();mode='pause';const ok=await departureImages[origin].load();await skyboxes[origin].load();if(!ok)throw Error('Missing hangar '+origin);
   const image=departureImages[origin],c=document.createElement('canvas');c.width=image.naturalWidth;c.height=image.naturalHeight;const g=c.getContext('2d');g.drawImage(image,0,0);const alpha=g.getImageData(Math.floor(c.width*.5),Math.floor(c.height*.44),1,1).data[3];
   flight.route.departure=0;ctx.fillStyle='#38c4f1';ctx.fillRect(0,0,W,H);drawDeparture();const pixel=Array.from(ctx.getImageData(W*.5,H*.44,1,1).data);
   const original=ctx.drawImage,counts={};for(const phase of ['departure','align','warp','encounter','arrived']){flight.route.phase=phase;let count=0;ctx.drawImage=function(...args){if(args[0]===image)count++;return original.apply(this,args);};drawDeparture();counts[phase]=count;}ctx.drawImage=original;
   flight.route.phase='departure';flight.route.departure=.3;draw();return {origin,alpha,pixel,counts,width:c.width,height:c.height};
  },origin);assert(result.alpha<=1,'Transparent aperture');assert(result.pixel[1]>190&&result.pixel[2]>235,'Live background visible');assert(result.counts.departure>0);for(const p of ['align','warp','encounter','arrived'])assert.equal(result.counts[p],0);assets.push(result);await shot('hangar-'+origin);
  await page.evaluate(()=>{flight.route.departure=2;draw();});await shot('hangar-'+origin+'-passing');
  await page.evaluate(()=>{flight.route.phase='align';draw();});await shot('clear-'+origin);
 }
 const controls=await page.evaluate(()=>{
  mode='pause';const ship=VoidShips.get(state),read=()=>VoidHudMath.read(flight),results={};
  for(const [name,input]of Object.entries({left:{x:-1},right:{x:1},up:{y:-1},down:{y:1},bankLeft:{roll:-1},bankRight:{roll:1}})){
   Object.assign(flight,{yaw:0,pitch:0,roll:0,throttle:.8});VoidPilotFlight.reset(flight);for(let i=0;i<30;i++)VoidPilotFlight.step(flight,{x:0,y:0,roll:0,...input},1/60,ship.flight,false);results[name]=read();
  }
  Object.assign(flight,{yaw:0,pitch:0,roll:0,throttle:1.4});VoidPilotFlight.reset(flight);for(let i=0;i<240;i++)VoidPilotFlight.step(flight,{x:0,y:0,roll:0},1/60,ship.flight,false);results.fast=read();flight.throttle=.3;for(let i=0;i<240;i++)VoidPilotFlight.step(flight,{x:0,y:0,roll:0},1/60,ship.flight,false);results.slow=read();return results;
 });
 assert(controls.left.heading>180&&controls.right.heading<180);assert(controls.up.pitch>0&&controls.down.pitch<0);assert(controls.bankLeft.bank<0&&controls.bankRight.bank>0);assert(controls.fast.speed>controls.slow.speed);
 const locks=await page.evaluate(()=>{
  flight.yaw=flight.pitch=flight.roll=0;Object.assign(missileState,{ownsMissileLauncher:true,equipped:true,missilesLoaded:6,missileCapacity:6});missileCooldown=0;missileLock=VoidTargeting.fresh();enemies=[];spawnEnemy();const e=enemies[0];Object.assign(e,{x:0,y:0,z:80,size:1,armor:100,maxArmor:100,shield:0,velocity:{x:0,y:0,z:0}});
  const step=dt=>VoidTargeting.step(missileLock,enemies,flightPoint,W,H,dt,missileBalance(),VoidMissiles.ready(missileState));
  step(.2);const acquiring=missileLock.status;const p0=flightPoint(e);e.x=3;step(.1);const p1=flightPoint(e);for(let i=0;i<100;i++)step(.03);const locked=missileLock.status;
  e.x=500;step(.01);const lost={status:missileLock.status,progress:missileLock.progress,target:missileLock.target};e.x=0;step(.01);const reset=missileLock.progress;for(let i=0;i<100;i++)step(.03);draw();return {acquiring,locked,lost,reset,p0,p1};
 });assert.equal(locks.acquiring,'ACQUIRING');assert.equal(locks.locked,'LOCK');assert.equal(locks.lost.target,null);assert.equal(locks.lost.progress,0);assert(locks.reset<.1);assert(locks.p1.x>locks.p0.x);await shot('hud-locked');
 assert(await page.evaluate(()=>{mode='play';const before=missileState.missilesLoaded;fireMissile();mode='pause';return missiles.length>0&&missileState.missilesLoaded===before-1&&missileLock.target===null;}));
 await page.evaluate(()=>{flight.pitch=-.25;flight.roll=.5;flight.yaw=1.2;draw();});await shot('hud-banked');
 const performance=await page.evaluate(()=>{
  flight.route.phase='encounter';const batch=fn=>{for(let i=0;i<20;i++)fn();const t=performance.now();for(let i=0;i<200;i++)fn();return (performance.now()-t)/200;};
  const samples=[];for(let i=0;i<5;i++)samples.push(batch(drawFlightHud));flight.route.phase='departure';flight.route.departure=1.5;const departure=batch(drawDeparture);flight.route.phase='encounter';return {hudMillisecondsPerFrame:samples,departureMillisecondsPerFrame:departure,meshTriangles:departureMesh.length};
 });
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>draw());await shot('hud-mobile');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 const keyboard={};for(const key of ['a','d','w','s','q','r','Shift','x']){
  await page.evaluate(()=>{flight.route=null;enemies=[];hostile=[];spawned=resolved=current.enemies=0;current.duration=99999;elapsed=0;flight.yaw=flight.pitch=flight.roll=0;flight.throttle=.8;flight.mouseX=flight.mouseY=0;VoidPilotFlight.reset(flight);mode='play';});
  await page.keyboard.down(key);await page.waitForTimeout(400);await page.keyboard.up(key);keyboard[key]=await page.evaluate(()=>{mode='pause';return {...VoidHudMath.read(flight),throttle:flight.throttle};});
 }
 assert(keyboard.a.heading>180&&keyboard.d.heading>0&&keyboard.d.heading<180);assert(keyboard.w.pitch>0&&keyboard.s.pitch<0);assert(keyboard.q.bank<0&&keyboard.r.bank>0);assert(keyboard.Shift.throttle>.8&&keyboard.x.throttle<.8);assert.deepEqual(errors,[]);
 const report={assets,controls,keyboard,locks,performance,errors};if(out)fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
