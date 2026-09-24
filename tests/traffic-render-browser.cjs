const{chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true}),p=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
try{
 await p.route('**/firebase-auth.js',r=>r.abort());await p.goto('http://127.0.0.1:5000/void-runner.html');await p.waitForFunction(()=>VoidStartup.started);
 await p.evaluate(async()=>{state=C.fresh();C.beginJourney(state);await launch();mode='pause';});
 const checks=await p.evaluate(()=>{
  const results=[];
  for(let cycle=0;cycle<8;cycle++){
   let seed=9000+cycle*111;ambientTraffic=VoidTraffic.create(()=>((seed=(seed*1664525+1013904223)>>>0)/2**32));ambientTraffic.clock=15;
   const count=ambientTraffic.contacts.length;draw();
   const withTraffic=VoidBabylon.scene.meshes.length;
   for(const c of ambientTraffic.contacts)c.age=c.lifetime+.5;
   VoidTraffic.step(ambientTraffic,.05);draw();
   const wakes=VoidBabylon.scene.meshes.filter(m=>m.name==='traffic-warp-wake'&&m.isEnabled()).length;
   for(let i=0;i<50;i++)VoidTraffic.step(ambientTraffic,.1);
   draw();results.push({count,withTraffic,wakes,after:VoidBabylon.scene.meshes.length,contacts:ambientTraffic.contacts.length,textures:VoidBabylon.scene.textures.length});
  }
  return results;
 });
 assert(checks.some(x=>x.count>0&&x.wakes>0));assert(checks.every(x=>x.contacts===0));assert(checks.every(x=>x.after===checks[0].after&&x.textures===checks[0].textures));
 const combat=await p.evaluate(async()=>{state.quest='legal-run';await launch();mode='pause';draw();return {traffic:ambientTraffic.contacts.length,friendlies:enemies.filter(e=>VoidStory.relationship(e)==='friendly').length};});assert.deepEqual(combat,{traffic:0,friendlies:0});
 await p.evaluate(()=>{state.quest='arrival';flight.route.phase='departure';flight.route.progress=0;ambientTraffic=VoidTraffic.create(()=>.9);ambientTraffic.clock=15;draw();});
 if(process.env.VOID_SCREENSHOT_DIR){fs.mkdirSync(process.env.VOID_SCREENSHOT_DIR,{recursive:true});await p.screenshot({path:process.env.VOID_SCREENSHOT_DIR+'/departure-traffic.png'});}
 await p.evaluate(()=>dock());assert.equal(await p.evaluate(()=>ambientTraffic.contacts.length),0);assert.equal(await p.evaluate(()=>VoidBabylon.scene.meshes.length),0);
 assert.deepEqual(errors,[]);console.log('PASS Babylon traffic transforms/warp wakes/disposal, repeated stable mesh/texture counts, combat suppression and dock cleanup',JSON.stringify(checks));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
