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
 await page.waitForFunction(()=>mode==='pod-waking'&&walker&&VoidAssets.pending===0);await page.waitForSelector('#pod-wake:not([hidden])');await page.keyboard.press('KeyE');await page.waitForFunction(()=>mode==='walking');
 await page.evaluate(()=>VoidVR.launch('tropical',{}));await page.waitForFunction(()=>walkingLocation?.kind==='vr'&&mode==='walking'&&!VoidVR.busy);
 const spot=await page.evaluate(()=>walkingLocation.interactions.find(i=>i.id==='vr-fish'));assert(spot,'the pier has a fishing spot');
 const act=()=>page.evaluate(()=>VoidVR.session.world.interact({id:'vr-fish'})),notice=()=>page.evaluate(()=>document.getElementById('notice').textContent);
 await page.evaluate(p=>{walker.x=p[0];walker.z=p[2];},spot.position);await page.waitForTimeout(500);
 // World-of-Warcraft style (the owner, 16 Nov 2026): E casts (the rod swings, the float flies out), the float splashes when a fish bites, and it must be LOOKED AT and clicked.
 const state=()=>page.evaluate(()=>VoidVR.session.world.fishing()),look=()=>page.evaluate(()=>{const f=VoidVR.session.world.fishing();walker.yaw=Math.atan2(f.float[0]-walker.x,f.float[2]-walker.z);walker.pitch=Math.atan2(walker.y-f.float[1]-.1,Math.hypot(f.float[0]-walker.x,f.float[2]-walker.z));}),away=()=>page.evaluate(()=>{walker.yaw+=1.2;});
 const click=()=>page.evaluate(()=>dispatchEvent(new MouseEvent('mousedown',{button:0,bubbles:true,cancelable:true})));
 const bite=()=>page.waitForFunction(()=>VoidVR.session.world.fishing().state==='bite');
 // too early: a click while waiting reels in with nothing
 await act();assert.match(await notice(),/draw the rod back/);assert.equal((await state()).state,'casting');await page.waitForFunction(()=>VoidVR.session.world.fishing().state==='waiting');await page.screenshot({path:'/tmp/fishing.png'});await click();assert.match(await notice(),/too early/);assert.equal((await state()).state,'idle');
 // a bite, but not looking at the float: nothing is landed
 await act();await bite();await away();await click();assert.match(await notice(),/Look at the float/);
 // looking at it and clicking lands the fish; the count and its kind are kept
 await look();await click();assert.match(await notice(),/You land .* kg.*Fish caught: 1\./);assert.equal(Object.values(await page.evaluate(()=>VoidLocalProgress.kinds('tropical-fish'))).reduce((a,b)=>a+b,0),1);
 assert.match(await page.evaluate(()=>document.getElementById('vr-fish-hud').textContent),/FISH CAUGHT\s*1/);
 // each cast lands somewhere else
 const spots=[];for(let i=0;i<3;i++){await act();await page.waitForFunction(()=>VoidVR.session.world.fishing().state==='waiting');spots.push((await state()).float.map(v=>v.toFixed(1)).join());await click();}assert.ok(new Set(spots).size>1,'the float lands in a different place: '+spots);
 // too slow
 await act();await bite();await page.waitForFunction(()=>/got away/.test(document.getElementById('notice').textContent));
 // the 100th fish reaches the goal (98 more are reported by the game's own counter to save an hour of waiting)
 await page.evaluate(()=>{for(let i=0;i<98;i++)VoidLocalProgress.count('tropical-fish',1);});
 await act();await bite();await look();await click();assert.match(await notice(),/Fish caught: 100\. That is 100: the goal of "Catch 100 Fish"\./);
 // leaving the simulation keeps the count; it shows on the player's own profile
 await page.evaluate(()=>VoidVR.exit());await page.waitForFunction(()=>!VoidVR.busy&&!VoidVR.active&&mode==='walking'&&walkingLocation?.area==='interior');
 assert.equal(await page.evaluate(()=>VoidLocalProgress.record.counters['tropical-fish']),100);assert.match((await page.evaluate(()=>VoidLocalProgress.profileLines())).join('|'),/Catch 100 Fish · 100 of 100 · reached \d{4}-\d\d-\d\d/);
 assert.deepEqual(errs,[]);console.log(JSON.stringify({ok:true}));await b.close();})().catch(e=>{console.error(String(e.stack||e).slice(0,800));process.exit(1);});
