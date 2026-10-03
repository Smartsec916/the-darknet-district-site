const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/api/void-runner/**',route=>route.fulfill({status:503,body:'offline'}));
  await page.goto('http://127.0.0.1:5189/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started);
  const result=await page.evaluate(()=>{
   const audio=VoidAudio.event,fill=ctx.fillText,events=[],labels=[];
   VoidAudio.event=(name)=>events.push(name);ctx.fillText=function(value,...args){labels.push(value);return fill.call(this,value,...args);};
   try{
    const enemy={x:40,y:0,z:80,pilot:{lock:.3,heading:{x:-.45,y:0,z:-.9}}};enemies=[enemy];enemyMissiles=[];warningStage='none';warningClock=0;
    stepEnemyMissiles(.01,{x:0,y:0,z:0});drawEnemyLockWarning();const acquiring={stage:warningStage,label:labels.at(-1),event:events.at(-1)};
    launchEnemyMissile(enemy);enemy.x=-40;launchEnemyMissile(enemy);stepEnemyMissiles(.01,{x:0,y:0,z:0});drawEnemyLockWarning();const incoming={stage:warningStage,label:labels.at(-1),event:events.at(-1),count:enemyMissiles.length};
    enemyMissiles[0].dead=true;stepEnemyMissiles(.01,{x:0,y:0,z:0});enemyMissiles[0].z=-80;flight.arrows=[];drawEnemyLockWarning();const oneLeft={stage:warningStage,count:enemyMissiles.length,directional:flight.arrows.some(a=>a.label==='MISSILE')};
    enemyMissiles[0].dead=true;stepEnemyMissiles(.01,{x:0,y:0,z:0});const resumed={stage:warningStage,event:events.at(-1)};
    enemy.pilot.lock=0;stepEnemyMissiles(.01,{x:0,y:0,z:0});return {acquiring,incoming,oneLeft,resumed,cleared:warningStage};
   }finally{VoidAudio.event=audio;ctx.fillText=fill;}
  });
  assert.deepEqual(result,{acquiring:{stage:'acquiring',label:'LOCK WARNING',event:'warning'},incoming:{stage:'incoming',label:'MISSILE INCOMING',event:'incoming',count:2},oneLeft:{stage:'incoming',count:1,directional:true},resumed:{stage:'acquiring',event:'warning'},cleared:'none'});
  assert.deepEqual(errors,[]);console.log('Missile threat browser: acquisition, distinct incoming warning, two missiles and clear passed.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
