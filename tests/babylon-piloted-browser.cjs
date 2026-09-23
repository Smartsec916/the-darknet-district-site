/* Actual combat/flight simulation through the adapter; no health or damage cheats. */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge'}),page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.stack));
try{
 await page.goto('http://127.0.0.1:5000/void-runner.html?renderer=babylon');await page.waitForFunction(()=>window.VoidStartup?.started);await page.evaluate(()=>{state=C.fresh();C.beginJourney(state);});
 const results=[];
 for(let run=0;run<4;run++){
  await page.evaluate(async()=>{if(['legal-offer','illegal-offer'].includes(state.quest))C.accept(state);await launch();});
  for(let chunk=0;chunk<250;chunk++){
   const status=await page.evaluate(()=>{
    for(let i=0;i<80&&mode==='play';i++){
     const e=enemies.find(VoidStory.hostile),vector=e&&flight.route.phase==='encounter'?e:flight.route.vector,lead=e&&flight.route.phase==='encounter'?FM.length(e)/VOID_BALANCE.laserProjectileSpeed:0;
     const x=vector.x+(e?.velocity.x||0)*lead-flight.velocity.x*lead,y=vector.y+(e?.velocity.y||0)*lead-flight.velocity.y*lead,z=vector.z+(e?.velocity.z||0)*lead-flight.velocity.z*lead;
     const yaw=Math.atan2(x,z),pitch=Math.atan2(y,Math.hypot(x,z)),error=Math.atan2(Math.sin(yaw-flight.yaw),Math.cos(yaw-flight.yaw));
     flight.mouseX=FM.clamp(error*3-flight.yawRate*.5,-1,1);flight.mouseY=FM.clamp((pitch-flight.pitch)*3-flight.pitchRate*.5,-1,1);firing=!!e;update(.04);
    }
    draw();return {mode,hp,quest:state.quest,resolved,required:current.enemies,phase:flight.route.phase,location:VoidBabylon.diagnostics.location};
   });
   if(status.mode==='preparing-flight'){await page.waitForFunction(()=>mode!=='preparing-flight');continue;}
   if(status.mode!=='play'){results.push(status);break;}
  }
 }
 assert.equal(results.length,4);assert.equal(results[3].quest,'open');assert(results.every(r=>r.hp>0));assert.deepEqual(errors,[]);console.log('PASS Babylon piloted opening campaign: thrust/alignment, lasers, hostile destruction, destination loading, docking and rewards',JSON.stringify(results));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
