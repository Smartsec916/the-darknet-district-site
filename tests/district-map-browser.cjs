/* The V1 map in a real browser: opens from the device, zooms, pans, selects a place, sets a waypoint, the HUD pointer follows the player and clears on arrival.
   SITE_TEST_URL is fixed to the local test server (node tests/serve-modern.cjs). */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox']});
 const page=await b.newPage({viewport:{width:1280,height:720},serviceWorkers:'block'});page.setDefaultTimeout(240000);const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.route('https://**/*',r=>r.abort());await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
 await page.addInitScript(()=>localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:'low'})));
 await page.goto('http://127.0.0.1:5187/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started);
 await page.click('[data-action=menu-campaign]');await page.click('[data-action=menu-new]');const c=page.locator('[data-action=menu-new-confirm]');if(await c.count())await c.click();
 await page.waitForSelector('#character-creator.on');await page.waitForFunction(()=>!document.querySelector('[data-cc=confirm]').disabled);await page.locator('[data-cc=confirm]').click();
 await page.waitForFunction(()=>mode==='pod-waking'&&walker&&VoidAssets.pending===0);await page.locator('#pod-wake [data-pod=exit]').click();await page.waitForFunction(()=>mode==='walking');
 await page.keyboard.press('KeyL');await page.waitForSelector('#personal-device.open');await page.locator('#personal-device [data-app=map]').click();await page.waitForSelector('#personal-device canvas.dm-canvas');await page.waitForTimeout(800);
 await page.screenshot({path:'/tmp/map-1.png'});
 await page.locator('[data-map=all]').click();await page.waitForTimeout(400);await page.screenshot({path:'/tmp/map-2.png'});
 const v0=await page.evaluate(()=>VoidDistrictMap.view.s);await page.locator('[data-map=in]').click();assert((await page.evaluate(()=>VoidDistrictMap.view.s))>v0,'zoom in');
 const box=await page.locator('canvas.dm-canvas').boundingBox();const c0=await page.evaluate(()=>VoidDistrictMap.view.cx);
 await page.mouse.move(box.x+200,box.y+150);await page.mouse.down();await page.mouse.move(box.x+120,box.y+150,{steps:4});await page.mouse.up();assert((await page.evaluate(()=>VoidDistrictMap.view.cx))>c0,'dragging left moves the view east');
 await page.locator('[data-map="pick:district-vr"]').click();assert.equal(await page.evaluate(()=>VoidDistrictMap.selected.id),'district-vr');await page.locator('[data-map=set]').click();
 assert.equal(await page.evaluate(()=>state.story.flags.deviceWaypoint),'district-vr');await page.waitForTimeout(500);await page.screenshot({path:'/tmp/map-3.png'});
 await page.keyboard.press('KeyL');await page.waitForFunction(()=>!document.querySelector('#personal-device.open'));await page.waitForFunction(()=>!document.getElementById('waypoint-chip').hidden);
 const chip=await page.locator('#waypoint-chip').textContent();assert.match(chip,/VR ARCADE · \d+ M/);assert.match(chip,/DIRECTION ONLY/);await page.screenshot({path:'/tmp/map-4.png'});
 const d0=parseInt(chip.match(/(\d+) M/)[1]);await page.evaluate(()=>{const p=VoidDistrictMap.data.pois.find(x=>x.id==='district-vr');walker.x=p.x+6;walker.z=p.z;});await page.waitForTimeout(700);
 const d1=parseInt((await page.locator('#waypoint-chip').textContent()).match(/(\d+) M/)[1]);assert(d1<d0&&d1<=7,'the distance follows the player: '+d0+' -> '+d1);
 await page.evaluate(()=>{const p=VoidDistrictMap.data.pois.find(x=>x.id==='district-vr');walker.x=p.x+1.5;walker.z=p.z;});await page.waitForFunction(()=>document.getElementById('waypoint-chip').hidden&&!state.story.flags.deviceWaypoint);
 assert.equal(await page.evaluate(()=>mode),'walking');assert.deepEqual(errs,[]);console.log(JSON.stringify({ok:true,chip}));await b.close();})().catch(e=>{console.error(String(e.stack||e).slice(0,700));process.exit(1);});
