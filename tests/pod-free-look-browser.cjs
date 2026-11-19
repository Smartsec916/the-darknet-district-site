/* Lying in the Sleeping Pod the player can look around freely (drag, arrow keys; mouse capture is not testable headless) and E / M / V do what the buttons do.
   SITE_TEST_URL=http://127.0.0.1:5187 node tests/pod-free-look-browser.cjs */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187';
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox']});
 const page=await b.newPage({viewport:{width:1280,height:720},serviceWorkers:'block'});page.setDefaultTimeout(300000);const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.route('https://**/*',r=>r.abort());await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
 // A headless browser grants mouse capture but then reports no movement, so capture is switched off here and the drag path is what gets exercised.
 await page.addInitScript(()=>{localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:'low'}));Element.prototype.requestPointerLock=function(){return Promise.reject(new Error('not in tests'));};});
 await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started);
 await page.click('[data-action=menu-campaign]');await page.click('[data-action=menu-new]');const c=page.locator('[data-action=menu-new-confirm]');if(await c.count())await c.click();
 await page.waitForSelector('#character-creator.on');await page.waitForFunction(()=>!document.querySelector('[data-cc=confirm]').disabled);await page.locator('[data-cc=confirm]').click();
 await page.waitForFunction(()=>mode==='pod-waking'&&walker&&VoidAssets.pending===0);await page.waitForTimeout(800);
 const view=()=>page.evaluate(()=>({yaw:walker.yaw,pitch:walker.pitch||0,x:walker.x,z:walker.z,mode}));const v0=await view();
 // drag on the view (above the card) turns the head; the body stays in the pod
 await page.mouse.move(640,220);await page.mouse.down();await page.mouse.move(840,300,{steps:6});await page.mouse.up();let v=await view();
 assert(Math.abs(v.yaw-v0.yaw)>.4,'dragging sideways turns the view: '+(v.yaw-v0.yaw));assert(v.pitch-v0.pitch>.15,'dragging down looks down');assert.deepEqual([v.x,v.z,v.mode],[v0.x,v0.z,'pod-waking']);
 await page.screenshot({path:'/tmp/pod-look-1.png'});
 // a long drag cannot flip the view upside down
 await page.mouse.move(640,100);await page.mouse.down();await page.mouse.move(640,700,{steps:8});await page.mouse.up();assert((await view()).pitch<=1.2+1e-9);
 // arrow keys turn too
 const y1=(await view()).yaw;await page.keyboard.down('ArrowLeft');await page.waitForTimeout(700);await page.keyboard.up('ArrowLeft');assert((await view()).yaw<y1-.05,'the left arrow turns left');
 // the buttons still snap the view, from wherever the player was looking
 await page.locator('[data-pod=look]').click();assert.equal((await view()).yaw,await page.evaluate(()=>VoidDistrictArea.POD_VIEW.inside));await page.screenshot({path:'/tmp/pod-look-2.png'});
 // V opens the vending list; while it is open the view does not drift with the mouse
 await page.keyboard.press('KeyV');await page.waitForFunction(()=>!document.querySelector('.pod-vend').hidden);const yv=(await view()).yaw;
 await page.mouse.move(300,200);await page.mouse.down();await page.mouse.move(500,260,{steps:4});await page.mouse.up();assert.equal((await view()).yaw,yv);
 await page.locator('[data-vend=back]').click();await page.waitForFunction(()=>document.querySelector('.pod-vend').hidden);
 // M opens music and lights; returning comes back to the pod
 await page.keyboard.press('KeyM');await page.waitForFunction(()=>mode==='equipment');await page.locator('[data-action="pod-music:return"]').click();await page.waitForFunction(()=>mode==='pod-waking');
 // E gets up
 await page.keyboard.press('KeyE');await page.waitForFunction(()=>mode==='walking');assert.equal(await page.evaluate(()=>document.getElementById('pod-wake').hidden),true);
 assert.deepEqual(errs,[]);console.log(JSON.stringify({ok:true}));await b.close();})().catch(e=>{console.error(String(e.stack||e).slice(0,800));process.exit(1);});
