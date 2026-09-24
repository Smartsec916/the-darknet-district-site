const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage();try{
 await page.route('**/api/void-runner/**',r=>r.fulfill({status:503,body:'offline'}));await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline'}));
 const engine=fs.readFileSync(path.join(__dirname,'../void-runner/vendor/babylon-8.26.0.js'));
 await page.route('**/vendor/babylon-8.26.0.js',async r=>{await new Promise(resolve=>setTimeout(resolve,46000));await r.fulfill({contentType:'text/javascript',body:engine});});
 await page.goto('http://127.0.0.1:5187/void-runner.html',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.VoidStartup?.started,{},{timeout:70000});assert.equal(await page.locator('#loading-screen').count(),0);console.log('PASS delayed 46-second engine load survives the former 45-second deadline with offline services.');
 await page.unroute('**/vendor/babylon-8.26.0.js');await page.route('**/vendor/babylon-8.26.0.js',r=>r.abort());await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.VoidStartup?.error);assert.match(await page.locator('#init-status').textContent(),/Babylon engine unavailable/);assert(await page.locator('#init-retry').isVisible());console.log('PASS genuine engine failure exposes actionable reason and retry.');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
