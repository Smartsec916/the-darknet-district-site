/* SITE_TEST_URL=http://127.0.0.1:5187 node tests/ncz-food-stands-browser.cjs */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),os=require('node:os'),F=require('../void-runner/ncz-food-stands.js');
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
  const result=await page.evaluate(q=>({cart:!!VoidBabylon.scene.getTransformNodeByName('food-stand-'+q),seats:walkingLocation.interactions.filter(i=>i.action==='ncz-food-seat'&&i.quarter===q).length,worker:VoidBabylon.scene.transformNodes.some(n=>n.metadata?.foodVendor===q),customer:VoidBabylon.scene.transformNodes.some(n=>n.metadata?.foodCustomer===q)}),q);
  assert.equal(result.cart,true,q);assert.equal(result.seats,3,q);assert.equal(result.worker,true,q);assert.equal(result.customer,true,q);
  console.log(q,result);
  if(q==='oldtown'){
   await page.screenshot({path:process.env.FOOD_STANDING_SCREENSHOT||path.join(os.tmpdir(),'food-stand-oldtown-standing.png')});
   const seat=await page.evaluate(()=>walkingLocation.interactions.find(i=>i.id==='food-seat-oldtown-1'));
   await page.evaluate(item=>VoidInteractions.handlers.get('ncz-food-seat')({item}),seat);
   assert.equal(await page.evaluate(()=>mode),'food-seated');
   await page.screenshot({path:process.env.FOOD_SCREENSHOT||path.join(os.tmpdir(),'food-stand-oldtown-seat.png')});
   await page.keyboard.press('KeyE');assert.equal(await page.evaluate(()=>mode),'walking');
   await page.evaluate(()=>VoidInteractions.handlers.get('ncz-food-vendor')({item:walkingLocation.interactions.find(i=>i.id==='food-stand-oldtown'),resume:resumeWalking}));
   assert.equal(await page.evaluate(()=>mode),'walking');
  }
 }
 assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
