const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge'}),page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.stack));page.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text());});
try{await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline'}));await page.route('**/api/void-runner/**',r=>r.fulfill({status:503,body:'offline'}));await page.route('**/art/**',r=>r.abort());
await page.goto('http://127.0.0.1:5187/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started,{},{timeout:60000});
console.log('BOOT',await page.evaluate(()=>({mode,frames:VoidBabylon.diagnostics.frames})));
await page.evaluate(async()=>{state=C.fresh();await workshopOpening();});assert.equal(await page.evaluate(()=>mode),'walking');await page.screenshot({path:'work/vesper.png'});
await page.evaluate(async()=>{state=C.fresh();state.quest='legal-offer';await enterWalking('hangar');});assert.equal(await page.evaluate(()=>mode),'walking');
assert(await page.evaluate(()=>VoidBabylon.scene.getTransformNodeByName('npc-rook')!==null));
await page.evaluate(()=>{walker.x=8;walker.z=23;walker.yaw=0;update(.01);interactWalking();});assert.equal(await page.evaluate(()=>mode),'dialogue');
await page.evaluate(()=>{while(speech){speech.shown=Infinity;advanceSpeech();}});await page.waitForFunction(()=>mode==='walking');assert.equal(await page.evaluate(()=>state.quest),'legal-run');
await page.evaluate(async()=>{await leaveWalking();});await page.waitForFunction(()=>mode==='play');console.log('LAUNCH',await page.evaluate(()=>({mode,phase:flight.route.phase,traffic:VoidTraffic.visible(ambientTraffic).length})));
await page.evaluate(()=>{mode='pause';draw();});await page.screenshot({path:'work/departure.png'});
await page.evaluate(async()=>{mode='play';flight.route.phase='warp';flight.route.progress=.01;await prepareDestination();});assert.equal(await page.evaluate(()=>mode),'play');
await page.evaluate(()=>{flight.route.phase='arrived';flight.route.progress=1;spawned=resolved=current.enemies;enemies=[];elapsed=current.duration;approachTime=4;arrive();});await page.waitForFunction(()=>mode==='dialogue'||mode==='walking');
await page.evaluate(()=>{while(speech){speech.shown=Infinity;advanceSpeech();}});await page.waitForFunction(()=>mode==='walking');assert.equal(await page.evaluate(()=>state.location),'kepler');
await page.evaluate(async()=>{state=C.fresh();state.quest='open';state.completed=2;state.combatRuns=2;state.missileUnlocked=true;VoidUniverse.unlock(state);await enterWalking('hangar');});
await page.keyboard.press('F1');assert.equal(await page.locator('#mission-log').count(),1);await page.locator('[data-track="meet-admin"]').click();assert.equal(await page.evaluate(()=>mode),'walking');
for(const destination of ['sol-belt','earth','sol-belt','meridian']){await page.evaluate(async id=>{C.chooseDestination(state,id);await leaveWalking();},destination);await page.waitForFunction(()=>mode==='play');const r=await page.evaluate(()=>({origin:flight.route.origin,destination:flight.route.destination,policy:flight.route.policy}));console.log('ROUTE',r);if(r.origin==='meridian'||destination==='meridian'){assert.equal(r.policy.seconds,24);assert.equal(r.policy.interdiction,false);}await page.evaluate(async()=>{await prepareDestination();flight.route.phase='arrived';flight.route.progress=1;spawned=resolved=current.enemies;enemies=[];elapsed=current.duration;approachTime=4;arrive();});await page.waitForFunction(()=>mode==='walking');assert.equal(await page.evaluate(()=>state.location),destination);}
await page.screenshot({path:'work/station.png'});assert.deepEqual(errors,[]);console.log('PASS modern startup without art, Vesper, physical Rook, job acceptance, departure, docking, mission log and SOL round trip');
}finally{console.log('ERRORS',errors);await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});

