const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/api/void-runner/**',route=>route.fulfill({status:503,body:'offline'}));
  await page.goto('http://127.0.0.1:5189/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started);
  const result=await page.evaluate(()=>{
   const original=ctx.strokeText,labels=[];ctx.strokeText=function(value,...args){labels.push(value);return original.call(this,value,...args);};
   try{
    state=C.fresh();state.universe.freeTravel=false;current={destination:'meridian'};flight.route={phase:'align',destination:'meridian',vector:{x:0,y:0,z:1}};flight.nav={x:0,y:0,z:140};flight.roll=0;navigationReveal.elapsed=3;
    flight.yaw=0;flight.pitch=0;drawWarpMarker();const front=labels.at(-1);
    flight.yaw=Math.PI;drawWarpMarker();const behind=labels.at(-1);
    const positions=[];for(const yaw of [-.8,-.4,.4,.8]){flight.yaw=yaw;drawWarpMarker();positions.push(navigationEdge.angle);}
    flight.yaw=0;flight.pitch=.8;drawWarpMarker();const below=navigationEdge.angle;
    flight.pitch=-.8;drawWarpMarker();const above=navigationEdge.angle;
    return {front,behind,positions,below,above};
   }finally{ctx.strokeText=original;}
  });
  assert.equal(result.front,'MERIDIAN STATION');
  assert.equal(result.behind,'BEHIND / MERIDIAN STATION');
  assert(result.positions.every(Number.isFinite));
  assert(Number.isFinite(result.below)&&Number.isFinite(result.above));
  assert.deepEqual(errors,[]);console.log('Navigation browser: front, behind, lateral, vertical and turning markers passed.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
