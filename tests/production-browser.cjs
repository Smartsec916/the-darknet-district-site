/* Real cross-origin HTTPS/CORS. Host resolver maps production names to test server. */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge',args:['--no-proxy-server','--host-resolver-rules=MAP thedarknetdistrict.com 127.0.0.1:5443, MAP www.thedarknetdistrict.com 127.0.0.1:5443, MAP the-darknet-district-site.onrender.com 127.0.0.1:5443']});
 const context=await browser.newContext({ignoreHTTPSErrors:true}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const fixture=async data=>context.request.post('https://127.0.0.1:5443/__fixture',{data});
 try{
  await fixture({mode:'slow',owned:[],requests:[]});
  await page.goto('https://thedarknetdistrict.com/void-runner.html',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>VoidStartup.started);
  assert.equal(new URL(page.url()).origin,'https://thedarknetdistrict.com');assert.match(await page.locator('#service-status').innerText(),/CONNECTING/);
  assert.equal(await page.locator('#loading-screen').count(),0);assert(!/NetworkError|Failed to fetch/.test(await page.locator('body').innerText()));
  await page.waitForFunction(()=>VoidNetwork.states.balance?.state==='ready');
  let requests=(await (await context.request.get('https://127.0.0.1:5443/__fixture')).json()).requests;
  assert.equal(requests.filter(r=>r.path.endsWith('/catalog')).length,0);assert.equal(requests.filter(r=>r.path.includes('/developer/')).length,0);
  for(const origin of ['https://thedarknetdistrict.com','https://www.thedarknetdistrict.com']){
   await fixture({mode:'healthy',requests:[]});await page.goto(origin+'/void-runner.html');await page.waitForFunction(()=>VoidStartup.started&&window.fixtureIdentity);
   const results=await page.evaluate(async()=>{const out={};for(const path of ['balance','catalog','account','developer/balance']){try{out[path]=await VoidNetwork.request(path,{token:path==='balance'||path==='catalog'?undefined:'fixture-token',scope:'fixture'});}catch(e){out[path]={status:e.status};}}return out;});
   assert(results.balance.values);assert.equal(results.catalog.products[0].amount,100);assert.deepEqual(results.account.owned,[]);assert.equal(results['developer/balance'].status,403);
   requests=(await (await context.request.get('https://127.0.0.1:5443/__fixture')).json()).requests;
   assert(requests.some(r=>r.method==='OPTIONS'&&r.path.endsWith('/account')&&r.origin===origin));
   assert(requests.some(r=>r.method==='OPTIONS'&&r.path.endsWith('/developer/balance')&&r.origin===origin));
  }
  // Verified account inventory, selection, sign-out, forged save, and failure revalidation.
  await fixture({mode:'healthy',owned:['spectre']});
  await page.evaluate(()=>{fixtureIdentity({uid:'pilot',getIdToken:async()=> 'fixture-token'});});await page.waitForFunction(()=>VoidShips.owns(state,'ship3'));
  assert(await page.evaluate(()=>{state.completed=2;state.quest='open';state.credits=9999;const selected=C.switchShip(state,'ship3');hangar();return selected&&VoidShips.get(state).id==='ship3';}));
  await page.evaluate(()=>fixtureIdentity(null));assert.equal(await page.evaluate(()=>state.activeShip),'starter');assert.equal(await page.evaluate(()=>VoidShips.owns(state,'ship3')),false);
  await page.evaluate(()=>{state.ownedShips.push('ship3');state.standardGear.push('pulse3','shield3');state.activeShip='ship3';save();});await page.reload();await page.waitForFunction(()=>VoidStartup.started);assert.equal(await page.evaluate(()=>VoidShips.get(state).id),'starter');
  await page.evaluate(()=>{shop();});assert.match(await page.locator('.shop-layout').innerText(),/PREMIUM SHIP[\s\S]*\$1.00 USD/);assert(!/2500 CR/.test(await page.locator('.shop-layout').innerText()));
  await page.getByRole('button',{name:'PURCHASE / $1.00 USD',exact:true}).click();assert.equal(await page.evaluate(()=>view),'account');assert.equal(await page.evaluate(()=>VoidShips.owns(state,'ship3')),false);
  await fixture({mode:'gateway',owned:[],requests:[]});
  await page.evaluate(()=>{VoidNetwork.config.backoff=50;VoidNetwork.config.maxBackoff=100;fixtureIdentity({uid:'pilot',getIdToken:async()=> 'fixture-token'});});
  await page.waitForFunction(()=>VoidNetwork.states.account?.state==='degraded');assert.equal(await page.evaluate(()=>VoidShips.owns(state,'ship3')),false);assert.match(await page.locator('#service-status').innerText(),/OFFLINE/);
  await page.evaluate(()=>shop());await page.getByRole('button',{name:'PURCHASE / $1.00 USD',exact:true}).click();await page.waitForFunction(()=>!VoidAccount.busy);
  assert.match(await page.locator('#notice').innerText(),/unavailable|not currently available/i);assert(!await page.evaluate(()=>VoidShips.owns(state,'ship3')));
  assert(await page.evaluate(async()=>{state.quest='legal-run';await launch();return mode==='play';}));
  requests=(await (await context.request.get('https://127.0.0.1:5443/__fixture')).json()).requests;assert.equal(requests.filter(r=>r.path.endsWith('/checkout')).length,0);assert.equal(requests.filter(r=>r.path.endsWith('/catalog')&&r.method==='GET').length,3);
  // Browser throttling applies to actual HTTPS traffic; essential art has an observable loading state.
  await fixture({mode:'healthy'});const slow=await context.newPage();const cdp=await context.newCDPSession(slow);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
  await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:300,downloadThroughput:400*1024,uploadThroughput:100*1024,connectionType:'cellular3g'});
  await slow.goto('https://thedarknetdistrict.com/void-runner.html',{waitUntil:'commit'});await slow.locator('#loading-screen').waitFor();assert(!/NetworkError|Failed to fetch/.test(await slow.locator('body').innerText()));
  await slow.waitForFunction(()=>window.VoidStartup?.started,{},{timeout:60000});await slow.close();
  assert.deepEqual(errors,[]);console.log('Production-origin HTTPS: apex/www CORS, actual OPTIONS, slow services, throttled startup, Render-style gateway failure, purchase lock and sign-out passed.');
 }finally{await fixture({mode:'healthy',owned:[]});await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
