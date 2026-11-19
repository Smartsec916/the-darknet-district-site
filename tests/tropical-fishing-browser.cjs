/* Fishing in Tropical Escape, in a real browser: cast, wait for the bite, land the fish; too early loses it; the count is kept outside the simulation and shows on
   the player's own profile; the 100th fish reaches the goal (the achievement itself needs server records).   SITE_TEST_URL=http://127.0.0.1:5187 node tests/tropical-fishing-browser.cjs */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187';
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox']});
 const page=await b.newPage({viewport:{width:1280,height:720},serviceWorkers:'block'});page.setDefaultTimeout(300000);const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.route('https://**/*',r=>r.abort());await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
 await page.addInitScript(()=>localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:'low'})));
 await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started);
 await page.click('[data-action=menu-campaign]');await page.click('[data-action=menu-new]');const c=page.locator('[data-action=menu-new-confirm]');if(await c.count())await c.click();
 await page.waitForSelector('#character-creator.on');await page.waitForFunction(()=>!document.querySelector('[data-cc=confirm]').disabled);await page.locator('[data-cc=confirm]').click();
 await page.waitForFunction(()=>mode==='pod-waking'&&walker&&VoidAssets.pending===0);await page.locator('#pod-wake [data-pod=exit]').click();await page.waitForFunction(()=>mode==='walking');
 await page.evaluate(()=>VoidVR.launch('tropical',{}));await page.waitForFunction(()=>walkingLocation?.kind==='vr'&&mode==='walking'&&!VoidVR.busy);
 const spot=await page.evaluate(()=>walkingLocation.interactions.find(i=>i.id==='vr-fish'));assert(spot,'the pier has a fishing spot');
 const act=()=>page.evaluate(()=>VoidVR.session.world.interact({id:'vr-fish'})),notice=()=>page.evaluate(()=>document.getElementById('notice').textContent);
 await page.evaluate(p=>{walker.x=p[0];walker.z=p[2];},spot.position);await page.waitForTimeout(500);
 // too early
 await act();assert.match(await notice(),/cast out/);await page.waitForTimeout(1500);await page.screenshot({path:'/tmp/fishing.png'});await act();assert.match(await notice(),/too early/);
 // a proper catch
 await act();await page.waitForFunction(()=>/A BITE/.test(document.getElementById('notice').textContent));await act();assert.match(await notice(),/You land .* kg.*Fish landed: 1\./);
 // too slow
 await act();await page.waitForFunction(()=>/A BITE/.test(document.getElementById('notice').textContent));await page.waitForFunction(()=>/got away/.test(document.getElementById('notice').textContent));
 // the 100th fish earns the achievement (98 more are reported by the game's own counter to save an hour of waiting)
 await page.evaluate(()=>{for(let i=0;i<98;i++)VoidLocalProgress.count('tropical-fish',1);});
 await act();await page.waitForFunction(()=>/A BITE/.test(document.getElementById('notice').textContent));await act();assert.match(await notice(),/Fish landed: 100\. That is 100: the goal of "Catch 100 Fish"\./);
 // leaving the simulation keeps the count; it shows on the player's own profile
 await page.evaluate(()=>VoidVR.exit());await page.waitForFunction(()=>!VoidVR.busy&&!VoidVR.active&&mode==='walking'&&walkingLocation?.area==='interior');
 assert.equal(await page.evaluate(()=>VoidLocalProgress.record.counters['tropical-fish']),100);assert.match((await page.evaluate(()=>VoidLocalProgress.profileLines())).join('|'),/Catch 100 Fish · 100 of 100 · reached \d{4}-\d\d-\d\d/);
 assert.deepEqual(errs,[]);console.log(JSON.stringify({ok:true}));await b.close();})().catch(e=>{console.error(String(e.stack||e).slice(0,800));process.exit(1);});
