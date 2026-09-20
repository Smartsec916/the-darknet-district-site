/* Slow-load, art selection, save migration, dialogue, catalog and encounter regressions. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));
 await page.route('**/api/void-runner/**',r=>r.fulfill({status:503,body:'offline test'}));
 await page.addInitScript(()=>{
  window.earlyFrames=0;const raf=window.requestAnimationFrame;window.requestAnimationFrame=fn=>raf.call(window,t=>{if(fn.name==='loop'&&!window.VoidStartup?.started)window.earlyFrames++;fn(t);});
  window.artDraws=[];const draw=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(img,...args){if(img.src)window.artDraws.push(img.src.split('/').pop());return draw.call(this,img,...args);};
 });
 await page.route('**/cockpit.js',async r=>{await new Promise(resolve=>setTimeout(resolve,500));await r.continue();});
 await page.route('**/art/cockpit-kestrel.png',async r=>{await new Promise(resolve=>setTimeout(resolve,500));await r.continue();});
 await page.goto('http://127.0.0.1:5000/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started);await page.waitForTimeout(120);
 assert.equal(await page.evaluate(()=>earlyFrames),0);assert.equal(await page.evaluate(()=>VoidStartup.starts),1);assert.equal(await page.locator('.opening-card').count(),1);
 assert(!await page.evaluate(()=>artDraws.includes('station.png')),'No exterior drawn beneath opening');
 const counts=await page.evaluate(()=>{state=C.fresh();state.quest='legal-run';launch();mode='pause';artDraws=[];draw();return {cockpit:artDraws.filter(x=>x==='cockpit-kestrel.png').length,hud:!$('flight-hud').classList.contains('hidden')};});assert.equal(counts.cockpit,1);assert(counts.hud);
 const timing=await page.evaluate(()=>{state=C.fresh();state.quest='legal-run';launch();for(let i=0;i<249;i++)update(.04);const before=spawned;mode='pause';update(2);const paused=spawned;mode='play';update(.041);const after=spawned;mode='pause';return {before,paused,after,delay:VOID_BALANCE.firstRaiderDelay};});assert.deepEqual(timing,{before:0,paused:0,after:1,delay:10});
 await page.evaluate(()=>{state=C.fresh();state.quest='arrival';launch();mode='pause';elapsed=current.duration;approachTime=3;artDraws=[];draw();});assert(await page.evaluate(()=>artDraws.includes('station.png')));
 const out=process.env.VOID_SCREENSHOT_DIR;if(out){fs.mkdirSync(out,{recursive:true});await page.screenshot({path:path.join(out,'meridian-cockpit.png')});}
 await page.evaluate(()=>{state.quest='legal-offer';barRoom();});assert.equal(await page.getByRole('button',{name:'DOCK →',exact:true}).count(),0);
 await page.getByRole('button',{name:'NYX · TALK'}).click();await page.getByRole('button',{name:'BACK TO THE BAR'}).click();await page.getByRole('button',{name:'ROOK · TALK'}).click();assert((await page.locator('#spoken-text').textContent()).includes('Look out for raiders.'));
 await page.evaluate(()=>{state.quest='illegal-offer';rookConversation();});assert((await page.locator('#spoken-text').textContent()).includes('This run might be more dangerous.'));assert(!/reputation|one raider|more enemies/i.test(await page.locator('body').innerText()));
 await page.evaluate(()=>{state.quest='open';state.completed=2;shop();});assert.equal(await page.locator('.shop-placeholder').count(),2);assert.equal(await page.locator('[data-action^="purchase:"],[data-action^="buy:"],[data-action^="credit-gear:"]').count(),0);if(out)await page.screenshot({path:path.join(out,'placeholder-shop.png')});
 await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 const missing=await browser.newPage(),warnings=[];missing.on('console',m=>{if(m.type()==='warning')warnings.push(m.text())});await missing.route('**/art/station.png',r=>r.fulfill({status:404,body:'missing'}));await missing.goto('http://127.0.0.1:5000/void-runner.html');await missing.getByText('Game artwork unavailable').waitFor();assert(warnings.some(w=>w.includes('/void-runner/art/station.png')));assert.equal(await missing.evaluate(()=>VoidStartup.started),false);
 await missing.unroute('**/art/station.png');await missing.getByRole('button',{name:'RETRY',exact:true}).click();await missing.waitForFunction(()=>window.VoidStartup?.started);
 const staticPage=await browser.newPage();const failed=[];
 staticPage.on('response',r=>{if(new URL(r.url()).pathname.startsWith('/void-runner/')&&r.status()>=400)failed.push(r.url());});
 await staticPage.goto('http://127.0.0.1:5002/void-runner.html');await staticPage.waitForFunction(()=>window.VoidStartup?.started);
 assert.deepEqual(failed,[]);assert.equal(await staticPage.evaluate(()=>new URL(cockpitArt.src).pathname),'/void-runner/art/cockpit-kestrel.png');
 const noCockpit=await browser.newPage();await noCockpit.route('**/art/cockpit-kestrel.png',r=>r.fulfill({status:404,body:'missing'}));await noCockpit.goto('http://127.0.0.1:5000/void-runner.html');await noCockpit.getByText('Game artwork unavailable').waitFor();assert.equal(await noCockpit.evaluate(()=>VoidStartup.started),false);
 assert.deepEqual(errors,[]);await browser.close();console.log('Follow-up checks passed: slow startup, one scene/loop, cockpit draw, Meridian art, missing-art warning/retry, 10-second raider, pause, bar, dialogue, placeholders, mobile.');
})().catch(e=>{console.error(e);process.exit(1);});
