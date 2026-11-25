/* SITE_TEST_URL=http://127.0.0.1:5187 node tests/ncz-food-stands-browser.cjs */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),os=require('node:os'),fs=require('node:fs'),F=require('../void-runner/ncz-food-stands.js');
(async()=>{
 const browser=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1280,height:720},serviceWorkers:'block'}),errors=[];page.setDefaultTimeout(300000);
 page.on('pageerror',e=>errors.push(e.message));await page.route('https://**/*',r=>r.abort());await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
 await page.addInitScript(()=>localStorage.setItem('void-runner-graphics-v1',JSON.stringify({renderer:'babylon',quality:'low',v:2,chosen:true})));
 await page.goto((process.env.SITE_TEST_URL||'http://127.0.0.1:5187')+'/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started);
 await page.evaluate(()=>Object.assign(VoidPreparation.limits,{scene:900000,assets:600000,optional:600000,area:900000,total:1800000}));
 await page.click('[data-action=menu-campaign]');await page.click('[data-action=menu-new]');const confirm=page.locator('[data-action=menu-new-confirm]');if(await confirm.count())await confirm.click();
 await page.waitForSelector('#character-creator.on');await page.waitForFunction(()=>!document.querySelector('[data-cc=confirm]').disabled);await page.locator('[data-cc=confirm]').click();
 await page.waitForFunction(()=>mode==='pod-waking'&&walker);await page.keyboard.press('KeyE');await page.waitForFunction(()=>mode==='walking');
 for(const q of (process.env.FOOD_QUARTER?[process.env.FOOD_QUARTER]:Object.keys(F.STANDS))){
  const s=F.STANDS[q];await page.evaluate(q=>{delete state.story.flags.area;return enterWalking('sacramento',{silent:true,quarter:q});},q);
  await page.waitForFunction(q=>mode==='walking'&&walkingLocation?.quarter===q,q);
  await page.evaluate(q=>{const s=VoidFoodStands.STANDS[q];walker.x=s.x-5*Math.sin(s.yaw);walker.z=s.z-5*Math.cos(s.yaw);walker.yaw=s.yaw;walker.pitch=0;},q);
  await page.waitForFunction(q=>VoidBabylon.scene.transformNodes.some(n=>n.metadata?.foodVendor===q)&&VoidBabylon.scene.transformNodes.some(n=>n.metadata?.foodCustomer===q),q,{timeout:60000});
  await page.waitForFunction(q=>VoidBabylon.scene.meshes.some(m=>m.name.includes('food-vendor:'+q)),q,{timeout:60000});
  const result=await page.evaluate(q=>({cart:!!VoidBabylon.scene.getTransformNodeByName('food-stand-'+q),seats:walkingLocation.interactions.filter(i=>i.action==='ncz-food-seat'&&i.quarter===q).length,worker:VoidBabylon.scene.transformNodes.some(n=>n.metadata?.foodVendor===q),customer:VoidBabylon.scene.transformNodes.some(n=>n.metadata?.foodCustomer===q),apron:VoidBabylon.scene.meshes.some(m=>m.name.includes('food-vendor:'+q)),nearbyScreens:VoidAdScreens.current?.spots.filter(p=>Math.hypot(p.x-VoidFoodStands.STANDS[q].x,p.z-VoidFoodStands.STANDS[q].z)<20).map(p=>[p.x,p.z])||[]}),q);
  assert.equal(result.cart,true,q);assert.equal(result.seats,3,q);assert.equal(result.worker,true,q);assert.equal(result.customer,true,q);assert.equal(result.apron,true,q);
  for(const [x,z] of result.nearbyScreens)assert.ok(Math.hypot(x-s.x,z-s.z)>=6,q+' ad screen crowding food stand at '+x+','+z);
  const phases=await page.evaluate(async q=>{
   const scene=VoidBabylon.scene,customer=scene.transformNodes.find(n=>n.metadata?.foodCustomer===q);
   const clock=Date.now,offset=Object.keys(VoidFoodStands.STANDS).indexOf(q)*11,observed=[];
   try{
    for(const t of [3,7,12,20,40,44,50]){
     Date.now=()=>1000*(54*40000000+t-offset);
     await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);
     const pose=VoidFoodStands.customerPose(q,Date.now()/1000);
     observed.push({phase:pose.phase,error:Math.hypot(customer.position.x-pose.x,customer.position.z-pose.z),
      sip:scene.getMeshByName('food-diner-cup')?.isEnabled()&&customer.metadata.animationGroups.some(g=>g.name==='food-sip'&&g.isPlaying)});
    }
   }finally{Date.now=clock;}
   return observed;
  },q);
  assert.deepEqual(phases.map(p=>p.phase),['approach','sit-enter','sit','sip','sit-exit','leave','wait']);
  for(const p of phases){assert.ok(p.error<.01,q+' '+p.phase+' position');assert.equal(!!p.sip,p.phase==='sip',q+' seated cup animation');}
  const movement=await page.evaluate(q=>{
   const stand=VoidFoodStands.STANDS[q], [x,z]=VoidFoodStands.world(stand,-2.1,-2.8);
   const before={...walker};
   try{return [false,true].map(run=>{
    Object.assign(walker,{x,z,vx:0,vz:0,yaw:stand.yaw+Math.PI/2});
    for(let i=0;i<45;i++)VoidExplorer.step(walker,{x:0,z:1,run},1/60,walkingLocation);
    return Math.hypot(walker.x-x,walker.z-z);
   });}finally{Object.assign(walker,before);}
  },q);
  assert.ok(movement[0]>2.5&&movement[1]>4,q+' pedestrian clearance '+movement);
  console.log(q,result,movement);
  if(process.env.FOOD_SCREENSHOT_DIR){fs.mkdirSync(process.env.FOOD_SCREENSHOT_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.FOOD_SCREENSHOT_DIR,q+'-street.png')});}
  {
   if(q==='oldtown')await page.screenshot({path:process.env.FOOD_STANDING_SCREENSHOT||path.join(os.tmpdir(),'food-stand-oldtown-standing.png')});
   const seat=await page.evaluate(q=>walkingLocation.interactions.find(i=>i.id==='food-seat-'+q+'-1'),q);
   await page.evaluate(item=>VoidInteractions.handlers.get('ncz-food-seat')({item}),seat);
   assert.equal(await page.evaluate(()=>mode),'food-seated');
   if(q==='oldtown')await page.screenshot({path:process.env.FOOD_SCREENSHOT||path.join(os.tmpdir(),'food-stand-oldtown-seat.png')});
   await page.keyboard.press('KeyE');assert.equal(await page.evaluate(()=>mode),'walking');
   await page.evaluate(q=>VoidInteractions.handlers.get('ncz-food-vendor')({item:walkingLocation.interactions.find(i=>i.id==='food-stand-'+q),resume:resumeWalking}),q);
   const menu=page.getByRole('dialog',{name:'Vendor catalog'});await menu.waitFor();
   await menu.getByRole('button',{name:'Close',exact:true}).click();
   assert.equal(await page.evaluate(()=>mode),'walking');
  }
 }
 assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
