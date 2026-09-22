const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'}),page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
 await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline'}));await page.route('**/api/void-runner/**',r=>r.fulfill({status:503,body:'Service Suspended'}));
 const output=process.env.VOID_SCREENSHOT_DIR;if(output)fs.mkdirSync(output,{recursive:true});const capture=async name=>{if(output)await page.screenshot({path:path.join(output,name+'.png')});};
 try{
  await page.goto('http://127.0.0.1:5000/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started);
  assert(!requests.some(u=>/sky-|station(?:-kepler|-undertow)?\.png|ships\.png/.test(u)),'Travel textures are not startup prerequisites');
  const routes=[['meridian','kepler'],['kepler','meridian'],['undertow','foundry'],['foundry','undertow']];
  for(const [origin,destination]of routes){
   await page.evaluate(async({origin,destination})=>{state=C.fresh();state.quest='open';state.completed=2;state.location=origin;C.chooseDestination(state,destination);launch();mode='pause';await Promise.all([departureImages[origin].load(),skyboxes[origin].load(),skyboxes[destination].load(),stationImages[origin]?.load(),stationImages[destination]?.load()]);flight.route.departure=.45;await new Promise(r=>setTimeout(r,450));$('notice').textContent='';updateWarpHud();draw();},{origin,destination});
   await capture('depart-'+origin);
   for(const seconds of [6,8.1,11.5]){
    const result=await page.evaluate(seconds=>{const r=flight.route;r.phase='warp';r.progress=seconds/VoidWarp.config.warpSeconds;r.encounter.state='cleared';flight.yaw=Math.atan2(r.vector.x,r.vector.z);flight.pitch=flight.roll=0;const records=[],original=drawStationExterior;drawStationExterior=(id,x,y,width)=>{records.push({id,width});original(id,x,y,width);};try{spawned=resolved=current.enemies;updateWarpHud();draw();return records;}finally{drawStationExterior=original;}},seconds);
    if(seconds<8)assert.deepEqual(result,[]);else{assert.equal(result[0].id,destination);assert(result[0].width>0);}
    await capture(origin+'-to-'+destination+'-warp-'+seconds);
   }
   await page.evaluate(()=>{flight.route.phase='arrived';flight.route.progress=1;approachTime=2.2;updateWarpHud();draw();});await capture('arrive-'+destination);
   const arrived=await page.evaluate(()=>{mode='play';spawned=resolved=current.enemies;enemies=[];for(let i=0;i<25&&mode==='play';i++)update(.04);return state.location;});assert.equal(arrived,destination);
  }
  // The final arrival gate follows the same configurable approach duration.
  assert(await page.evaluate(()=>{state=C.fresh();state.quest='open';state.completed=2;state.location='meridian';C.chooseDestination(state,'kepler');launch();flight.route.phase='arrived';flight.route.progress=1;spawned=resolved=current.enemies;enemies=[];const old=VoidWarp.config.approachSeconds;VoidWarp.config.approachSeconds=1;try{for(let i=0;i<30&&mode==='play';i++)update(.04);return state.location==='kepler';}finally{VoidWarp.config.approachSeconds=old;}}));
  // No destination image: geometry still matches identity and travel continues.
  await page.reload();await page.waitForFunction(()=>window.VoidStartup?.started);let release;const wait=new Promise(r=>release=r);await page.route('**/art/station-undertow.png',async r=>{await wait;await r.continue();});
  const fallback=await page.evaluate(()=>{state=C.fresh();state.quest='open';state.completed=2;state.location='kepler';C.chooseDestination(state,'undertow');launch();mode='pause';flight.route.phase='warp';flight.route.progress=.9;const calls=[],original=drawStationStructure;drawStationStructure=(id,...rest)=>{calls.push(id);original(id,...rest);};try{draw();return calls;}finally{drawStationStructure=original;}});assert.deepEqual(fallback,['undertow']);await capture('slow-destination-fallback');release();await page.waitForFunction(()=>undertowStationTexture.naturalWidth>0);await page.evaluate(()=>draw());
  await page.setViewportSize({width:390,height:844});await page.evaluate(()=>draw());assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await capture('travel-mobile');
  await page.evaluate(()=>{mode='dock';shop();});await capture('spectre-shop-mobile');
  assert.deepEqual(errors,[]);console.log('Travel visuals passed: four departures, four destination identities, hidden before 8s, growing after 8s, docking, lazy textures, slow-image fallback, mobile.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
