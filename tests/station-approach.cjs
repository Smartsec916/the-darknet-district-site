/* Exercise the actual post-combat renderer, without changing the user's save. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'msedge'});
 const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5000/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started);
 await page.evaluate(()=>Object.keys(C.stations).forEach(ensureLocationAssets));
 await page.waitForFunction(()=>stationTexture.complete&&stationTexture.naturalWidth);
 await page.waitForFunction(()=>undertowStationTexture.complete&&undertowStationTexture.naturalWidth&&keplerStationTexture.complete&&keplerStationTexture.naturalWidth);
 const routes=await page.evaluate(()=>{
  const s=C.fresh(),result=[];C.beginJourney(s);result.push(C.flight(s).destination);C.complete(s);C.accept(s);result.push(C.flight(s).destination);C.complete(s);result.push(C.flight(s).destination);C.complete(s);C.accept(s);result.push(C.flight(s).destination);return result;
 });
 assert.deepEqual(routes,['meridian','kepler','meridian','undertow']);
 assert.equal(await page.evaluate(()=>C.stations.undertow.name),'Rusthaven Port');
 await page.evaluate(()=>{state=C.fresh();state.quest='illegal-offer';rookConversation();});
 assert((await page.locator('.sr-only').textContent()).includes('Rusthaven'));
 const output=process.env.VOID_SCREENSHOT_DIR;if(output)fs.mkdirSync(output,{recursive:true});
 for(const destination of ['meridian','kepler','undertow','foundry']){
  const checked=await page.evaluate(async destination=>{
   await skyboxes[destination].decode();state=C.fresh();state.quest='open';state.completed=2;state.location=destination==='meridian'?'foundry':'meridian';
   current={destination,enemies:1,duration:40,kind:'delivery'};mode='pause';elapsed=36;approachTime=3;spawned=resolved=1;enemies=[];bullets=[];hostile=[];sparks=[];screen.classList.add('hidden');flightUI(true);$('route-name').textContent=C.stations[destination].name.toUpperCase();$('flight-objective').textContent='Route clear. Approaching delivery dock.';
   const calls=[];const original=drawStationStructure;const drawImage=ctx.drawImage;
   drawStationStructure=function(id,...args){calls.push(id);return original(id,...args);};ctx.drawImage=function(image,...args){if(image===stationTexture)calls.push('meridian');if(image===keplerStationTexture)calls.push('kepler');if(image===undertowStationTexture)calls.push('undertow');return drawImage.call(this,image,...args);};
   try{resolved=0;stationScene(C.stations[destination].color);const hidden=calls.length===0;resolved=1;stationScene(C.stations[destination].color);return {hidden,calls};}
   finally{drawStationStructure=original;ctx.drawImage=drawImage;draw();}
  },destination);
  assert(checked.hidden,'No station before all enemies are cleared');
  assert.deepEqual(checked.calls,[destination],'Exterior follows destination, not departure station');
  if(output)await page.screenshot({path:path.join(output,'approach-'+destination+'.png')});
 }
 assert.deepEqual(errors,[]);await browser.close();console.log('Story routes unchanged; all four post-combat exteriors match their destinations and stay hidden until hostiles clear.');
})().catch(e=>{console.error(e);process.exit(1);});
