/* Street taxis in a real browser: the V1 map lists only the existing stops, a cab stops for the player,
   and a hail drives to that stop. Not part of npm test. SITE_TEST_URL=http://127.0.0.1:5187 node tests/road-taxi-browser.cjs */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187';
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox']});
 const page=await b.newPage({viewport:{width:1280,height:720},serviceWorkers:'block'});
 page.setDefaultTimeout(180000);const errs=[];page.on('pageerror',e=>errs.push(e.message));page.on('console',m=>{const t=m.text();if(m.type()==='error'&&/road-taxi|VOID frame|TypeError|ReferenceError/.test(t))errs.push(t);});
 await page.route('https://**/*',r=>r.abort());await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
 await page.addInitScript(()=>localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:'low'})));
 await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started);
 await page.click('[data-action=menu-campaign]');await page.click('[data-action=menu-new]');
 const confirm=page.locator('[data-action=menu-new-confirm]');if(await confirm.count())await confirm.click();
 await page.waitForSelector('#character-creator.on');await page.waitForFunction(()=>!document.querySelector('[data-cc=confirm]').disabled);
 await page.locator('[data-cc=confirm]').click();
 await page.waitForFunction(()=>mode==='pod-waking'&&walker&&VoidAssets.pending===0);
 await page.locator('#pod-wake [data-pod=exit]').click();await page.waitForFunction(()=>mode==='walking');
 await page.evaluate(()=>{delete state.story.flags.area;return enterWalking(VoidDistrictArea.KEY.street,{silent:true});});
 await page.waitForFunction(()=>mode==='walking'&&walkingLocation?.area==='street'&&VoidRoadTaxi.world&&VoidRoadTaxi.world.taxis.length>=2);
 await page.screenshot({path:'/tmp/road-taxi-street.png'});
 // A cab stops for the player, then moves once they step aside. Pick a cab on a straight stretch.
 const stopped=await page.evaluate(()=>{
  const R=VoidRoadTaxiRules;
  const cab=VoidRoadTaxi.world.taxis.find(t=>{if(t.phase!=='cruise')return false;const a=R.pointAlong(t.path,t.s+12,true);return Math.abs(Math.atan2(Math.sin(a.yaw-t.yaw),Math.cos(a.yaw-t.yaw)))<0.25;})||VoidRoadTaxi.world.taxis[0];
  const ahead=VoidRoadTaxiRules.pointAlong(cab.path,cab.s+9,true);
  walker.x=ahead.x;walker.z=ahead.z;walker.y=1.7;return cab.id;
 });
 await page.waitForFunction(id=>{const t=VoidRoadTaxi.world.taxis.find(c=>c.id===id);return t&&t.speed<1;},stopped);
 const gap=await page.evaluate(id=>{const t=VoidRoadTaxi.world.taxis.find(c=>c.id===id);return Math.hypot(t.x-walker.x,t.z-walker.z);},stopped);
 assert.ok(gap>2.4,'cab stopped short of the player, gap '+gap);
 await page.evaluate(id=>{const t=VoidRoadTaxi.world.taxis.find(c=>c.id===id),fx=Math.sin(t.yaw),fz=Math.cos(t.yaw);walker.x=t.x+fz*10;walker.z=t.z-fx*10;},stopped);
 await page.waitForFunction(id=>{const t=VoidRoadTaxi.world.taxis.find(c=>c.id===id);return t&&t.speed>3;},stopped);
 // Stand on the east edge of Main Street, clear of both lanes, then open the map.
 await page.evaluate(()=>{walker.x=70;walker.z=-100;walker.y=1.7;walker.yaw=Math.PI;});
 // The map offers the four real stops and no others.
 await page.keyboard.press('KeyL');await page.waitForSelector('#personal-device.open');
 await page.locator('#personal-device [data-app=map]').click();await page.waitForSelector('[data-map-hail]');
 const labels=await page.locator('[data-map-hail] button').allTextContents();
 assert.equal(labels.length,4,JSON.stringify(labels));
 for(const name of ['Main Street','The avenue','Main Street by the alley','The passage by the landing pad'])assert.ok(labels.some(t=>t.includes(name)),name);
 assert.ok(!labels.some(t=>/Corporate|Milked|Container/i.test(t)));
 await page.locator('[data-map-hail]').scrollIntoViewIfNeeded();
 await page.screenshot({path:'/tmp/road-taxi-map.png'});
 const before=await page.evaluate(()=>state.credits);
 const avenue=page.locator('[data-map-hail] button',{hasText:'The avenue'}).first();
 assert.equal(await avenue.isEnabled(),true);
 await avenue.click();
 await page.waitForFunction(()=>VoidRoadTaxi.active&&VoidRoadTaxi.world.job&&!VoidRoadTaxi.world.job.released);
 await page.screenshot({path:'/tmp/road-taxi-hail.png'});
 // The live loop is driving the cab. Software rendering is slow, so once movement is confirmed the rest of the ride is stepped with the same rules the loop uses.
 const moving=[];
 for(let i=0;i<4;i++){moving.push(await page.evaluate(()=>{const c=VoidRoadTaxi.world.job.cab;return c.phase+' '+c.s.toFixed(1)+' '+c.speed.toFixed(1);}));await page.waitForTimeout(400);}
 assert.ok(parseFloat(moving.at(-1).split(' ')[1])>parseFloat(moving[0].split(' ')[1]),'the cab is driving toward the pickup: '+moving.join(' | '));
 await page.evaluate(()=>{const player={x:walker.x,z:walker.z,riding:false};for(let i=0;i<800&&VoidRoadTaxi.world.job.cab.phase==='to-pickup';i++)VoidRoadTaxiRules.stepWorld(VoidRoadTaxi.world,0.1,player);});
 assert.equal(await page.evaluate(()=>VoidRoadTaxi.world.job.cab.phase),'waiting');
 await page.evaluate(()=>{const d=VoidRoadTaxiRules.doorPoints(VoidRoadTaxi.world.job.cab)[0];walker.x=d.x;walker.z=d.z;walker.yaw=VoidRoadTaxi.world.job.cab.yaw;});
 await page.waitForTimeout(400);
 await page.evaluate(()=>VoidRoadTaxi.board());
 await page.waitForFunction(()=>mode==='road-taxi');
 const fare=await page.evaluate(()=>state.credits);
 assert.ok(fare<before,'the fare is charged on boarding');
 await page.evaluate(()=>{for(let i=0;i<1200&&VoidRoadTaxi.world.job&&VoidRoadTaxi.world.job.cab.phase==='to-dest';i++){VoidRoadTaxiRules.stepWorld(VoidRoadTaxi.world,0.1,{x:walker.x,z:walker.z,riding:true});const s=VoidRoadTaxiRules.seatPoint(VoidRoadTaxi.world.job.cab);walker.x=s.x;walker.y=s.y;walker.z=s.z;}});
 await page.screenshot({path:'/tmp/road-taxi-arrived.png'});
 const near=await page.evaluate(()=>{const z=VoidNeoChinatown.taxiZones.find(t=>t.id==='avenue'),c=VoidRoadTaxi.world.job.cab;return Math.hypot(c.x-z.position[0],c.z-z.position[1]);});
 assert.ok(near<12,'arrived within 12 m of the avenue stop, was '+near);
 await page.keyboard.press('KeyE');
 await page.waitForFunction(()=>mode==='walking');
 assert.equal(await page.evaluate(()=>state.credits),fare,'stepping out does not charge again');
 assert.deepEqual(errs,[]);
 console.log(JSON.stringify({ok:true,stops:labels,fare:before-fare,gap}));
 await b.close();
})().catch(e=>{console.error(String(e.stack||e).slice(0,1200));process.exit(1);});
