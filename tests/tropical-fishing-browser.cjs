/* Fishing in Tropical Escape, in a real browser: take a rod from the rack (17 Nov 2026), cast from different places on the pier facing different water, no cast facing
   inland or without a rod, the rod goes back in the rack; then cast, wait for the bite, land the fish; too early loses it; the count is kept outside the simulation and shows on
   the player's own profile; the 100th fish reaches the goal (the achievement itself needs server records).   SITE_TEST_URL=http://127.0.0.1:5187 node tests/tropical-fishing-browser.cjs
   BROWSER_EXECUTABLE=/path/to/chrome uses that browser; SHOTS=dir saves screenshots of the rack and a cast at 1366 and 1920 wide. */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187';
(async()=>{const b=await chromium.launch({...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{}),args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox']});
 const shots=process.env.SHOTS||'',W=+(process.env.WIDTH||1280),page=await b.newPage({viewport:{width:W,height:Math.round(W*9/16)},serviceWorkers:'block'});page.setDefaultTimeout(300000);const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.route('https://**/*',r=>r.abort());await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
 await page.addInitScript(()=>localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:'low'})));
 await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started);
 await page.click('[data-action=menu-campaign]');await page.click('[data-action=menu-new]');const c=page.locator('[data-action=menu-new-confirm]');if(await c.count())await c.click();
 await page.waitForSelector('#character-creator.on');await page.waitForFunction(()=>!document.querySelector('[data-cc=confirm]').disabled);await page.locator('[data-cc=confirm]').click();
 await page.waitForFunction(()=>mode==='pod-waking'&&walker&&VoidAssets.pending===0);await page.waitForSelector('#pod-wake:not([hidden])');await page.keyboard.press('KeyE');await page.waitForFunction(()=>mode==='walking');
 await page.evaluate(()=>VoidVR.launch('tropical',{}));await page.waitForFunction(()=>walkingLocation?.kind==='vr'&&mode==='walking'&&!VoidVR.busy);
 const spot={position:[21.5,1.7,25]};
 const act=()=>page.evaluate(()=>VoidVR.session.world.interact({id:'vr-fish'})),notice=()=>page.evaluate(()=>document.getElementById('notice').textContent);
 const prompt=()=>page.evaluate(()=>document.getElementById('walking-interact').textContent),hint=()=>page.evaluate(()=>{const h=document.getElementById('vr-fish-hint');return h&&!h.hidden?h.textContent+(h.dataset.help==='1'?'#help':''):'';});
 const stand=(x,z,yaw)=>page.evaluate(([x,z,yaw])=>{walker.x=x;walker.z=z;walker.yaw=yaw;walker.pitch=0;},[x,z,yaw]).then(()=>page.waitForTimeout(400));
 const until=src=>page.waitForFunction(new Function('return /'+src+'/.test(document.getElementById("walking-interact").textContent)'),null,{timeout:20000});
 const fstate=()=>page.evaluate(()=>VoidVR.session.world.fishing());
 // ---- The rod rack (the owner, 17 Nov 2026): no rod, no cast; take one at the rack; cast anywhere on the pier facing the water; none facing inland; put it back.
 await stand(21.5,25,Math.PI/2);assert.doesNotMatch(await prompt(),/CAST/);assert.match(await hint(),/rack at the start of the pier#help/);await act();assert.match(await notice(),/Take a fishing rod/);assert.equal((await fstate()).state,'idle');
 const rack=await page.evaluate(()=>walkingLocation.interactions.find(i=>i.id==='vr-rack').position);
 await stand(rack[0]-1.1,rack[2],Math.PI/2);await until('TAKE A FISHING ROD');
 if(shots){await page.evaluate(()=>{walker.x=21.0;walker.z=13.2;walker.yaw=.62;walker.pitch=.18;});await page.waitForTimeout(1500);await page.screenshot({path:shots+'/rack-'+W+'.png'});await stand(rack[0]-1.1,rack[2],Math.PI/2);}
 await page.keyboard.press('KeyE');assert.equal((await fstate()).rod,true);assert.match(await notice(),/take a fishing rod/);await until('RETURN THE ROD');
 // two places, two directions: off the right side halfway out, and off the left side near the end
 for(const [x,z,yaw] of [[21.5,22,Math.PI/2],[20.7,31,-Math.PI/2+.4]]){await stand(x,z,yaw);await until('\\] CAST$');assert.equal(await hint(),'');
  await page.keyboard.press('KeyE');   // the real key, through the game's own interaction picker
  await page.waitForFunction(()=>VoidVR.session.world.fishing().state!=='idle');const t=(await fstate()).target;const dir=Math.atan2(t[0]-x,t[1]-z),diff=Math.abs(Math.atan2(Math.sin(dir-yaw),Math.cos(dir-yaw)));
  assert.ok(diff<1.3,'the float goes out in front: '+diff);assert.ok(await page.evaluate(t=>VoidTropicalFishing.inSea(t[0],t[1]),t),'onto the water');
  await page.waitForFunction(()=>VoidVR.session.world.fishing().state==='waiting');
  if(shots&&x===21.5){await page.evaluate(()=>{walker.pitch=.12;});await page.waitForTimeout(800);await page.screenshot({path:shots+'/cast-'+W+'.png'});}
  await page.waitForFunction(()=>/REEL IN/.test(document.getElementById('walking-interact').textContent));await act();assert.match(await notice(),/too early/);}
 // facing inland: no prompt, the hint, and E does nothing
 await stand(21.5,25,Math.PI);assert.doesNotMatch(await prompt(),/CAST/);await page.waitForFunction(()=>/Face the water to cast/.test(document.getElementById('vr-fish-hint')?.textContent||''));assert.match(await hint(),/Face the water to cast#help/);await act();assert.match(await notice(),/Face the water/);assert.equal((await fstate()).state,'idle');
 // back in the rack
 await stand(rack[0]-1.1,rack[2],Math.PI/2);await until('RETURN THE ROD');await page.evaluate(()=>VoidVR.session.world.interact({id:'vr-rack'}));assert.equal((await fstate()).rod,false);assert.match(await notice(),/back in the rack/);
 await stand(21.5,25,0);await act();assert.equal((await fstate()).state,'idle','no rod, no cast');
 await page.evaluate(()=>VoidVR.session.world.interact({id:'vr-rack'}));
 await page.evaluate(p=>{walker.x=p[0];walker.z=p[2];walker.yaw=0;},spot.position);await page.waitForTimeout(500);
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
 assert.equal(await page.evaluate(()=>document.getElementById('vr-fish-hint')),null,'the hint goes with the simulation');
 assert.equal(await page.evaluate(()=>VoidLocalProgress.record.counters['tropical-fish']),100);assert.match((await page.evaluate(()=>VoidLocalProgress.profileLines())).join('|'),/Catch 100 Fish · 100 of 100 · reached \d{4}-\d\d-\d\d/);
 assert.deepEqual(errs,[]);console.log(JSON.stringify({ok:true}));await b.close();})().catch(e=>{console.error(String(e.stack||e).slice(0,800));process.exit(1);});
