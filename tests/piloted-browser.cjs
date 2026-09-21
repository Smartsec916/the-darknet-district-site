/* Deterministic input pilot: no enemy damage, player health or route progress cheats. */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge'});try{const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:5000/void-runner.html');await page.waitForFunction(()=>VoidStartup.started);
 const result=await page.evaluate(()=>{
  state=C.fresh();C.beginJourney(state);const results=[];
  for(let run=0;run<4;run++){
   if(['legal-offer','illegal-offer'].includes(state.quest))C.accept(state);
   launch();let frames=0,locks=0;const phases=new Set();
   for(;frames<18000&&mode==='play';frames++){
    phases.add(flight.route.phase);const e=enemies.find(e=>!e.dead),vector=e&&flight.route.phase==='encounter'?e:flight.route.vector;
    const lead=e&&flight.route.phase==='encounter'?Math.hypot(e.x,e.y,e.z)/VOID_BALANCE.laserProjectileSpeed:0;
    const x=vector.x+(e?.velocity.x||0)*lead-flight.velocity.x*lead,y=vector.y+(e?.velocity.y||0)*lead-flight.velocity.y*lead,z=vector.z+(e?.velocity.z||0)*lead-flight.velocity.z*lead;
    const targetYaw=Math.atan2(x,z),targetPitch=Math.atan2(y,Math.hypot(x,z)),yawError=Math.atan2(Math.sin(targetYaw-flight.yaw),Math.cos(targetYaw-flight.yaw));
    flight.mouseX=FM.clamp(yawError*3-flight.yawRate*.5,-1,1);flight.mouseY=FM.clamp((targetPitch-flight.pitch)*3-flight.pitchRate*.5,-1,1);
    firing=!!e;update(.04);
   }
   results.push({run,frames,mode,hp,quest:state.quest,combatRuns:state.combatRuns,phases:[...phases],resolved,required:current.enemies});
   if(mode==='over'||frames===18000)break;
  }
  mode='pause';return results;
 });console.log('Piloted flight results',JSON.stringify(result));assert.equal(result.length,4);assert.equal(result[3].quest,'open');assert.equal(result[3].combatRuns,2);assert(result.every(r=>r.hp>0));assert.deepEqual(errors,[]);
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
