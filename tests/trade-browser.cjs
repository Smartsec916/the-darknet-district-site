/* Two real browsers trading through the trade window, against the hub with a SIMULATED ledger (never a real item or credit) and signed test sign-ins.
   Proves the whole flow a player sees: the [T] prompt near another player, the request, accept and decline, the two-column window, editing offers,
   both confirmations, the exchange, cancel by walking away, and that a hub without a ledger (the production default) shows no trading at all.
   SITE_TEST_URL=http://127.0.0.1:5187 node tests/trade-browser.cjs [low|high]   (needs `ws`, Playwright and the game on a local server) */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const {main}=require('../tools/district-hub/server.cjs'),{makeWorld}=require('./helpers/hub-fixtures.cjs'),{SimulatedLedger}=require('../tools/district-hub/ledger.cjs');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',tier=process.argv[2]==='high'?'high':'low',wait=ms=>new Promise(r=>setTimeout(r,ms));
const w=makeWorld({fox:{uid:'uid-fox',model:'district-resident',handle:'Neon_Fox'},bolt:{uid:'uid-bolt',model:'district-smuggler',handle:'Bolt_9'}});
const ledger=new SimulatedLedger({inventories:{'uid-fox':{credits:500,stacks:{'scrap-plate':10,'med-gel':3},equipment:['pulse1-aa01']},'uid-bolt':{credits:200,stacks:{'drive-coil':4},equipment:['vector-bb01']}}});
const env=port=>({HUB_MODE:'production',HUB_API_BASE:'https://api.test',HUB_ALLOWED_UIDS:'uid-fox,uid-bolt',PORT:String(port)});
const boot=(port,withLedger)=>main(env(port),{fetchJwks:w.fetchJwks,fetchImpl:w.fetchImpl,quiet:true,origins:[new URL(base).origin],...(withLedger?{ledger,allowTestLedger:true}:{})});

(async()=>{
 let hub=await boot(0,true);const port=hub.port,errors=[];
 const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox']});
 async function player(acct){
  const ctx=await browser.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce',serviceWorkers:'block'}),page=await ctx.newPage();
  page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(240000);
  await page.route('https://**/*',r=>r.abort());await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
  await page.addInitScript(([q,t])=>{localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:q}));localStorage.setItem('tdd-dev-mp-token',t);},[tier,acct.token]);
  await page.goto(`${base}/void-runner.html?multiplayer=1&hub=ws://127.0.0.1:${port}`);await page.waitForFunction(()=>window.VoidStartup?.started,null,{timeout:120000});
  await page.click('[data-action=menu-campaign]');await page.click('[data-action=menu-new]');const c=page.locator('[data-action=menu-new-confirm]');if(await c.count())await c.click();
  await page.waitForFunction(()=>mode==='pod-waking'&&walker,null,{timeout:120000});await page.locator('#pod-wake button').click();
  await page.waitForFunction(()=>mode==='walking'&&walker&&VoidAssets.pending===0,null,{timeout:120000});
  return page;}
 let pages=[];
 const until=async(p,fn,arg,ms=240000)=>{try{await p.waitForFunction(fn,arg,{timeout:ms,polling:150});}catch(e){for(const [n,q] of pages.entries())console.error('DIAG',n,JSON.stringify(await q.evaluate(()=>({open:VoidTrade.open,session:VoidTrade.session,result:VoidTrade.result,prompt:VoidTrade.promptText,toast:VoidTrade.toastText,status:VoidRemotePlayers.status,features:VoidRemotePlayers.features}))).slice(0,1500));throw e;}};
 // CLOSE, if the summary is still up (it also closes itself after a while, which on a slow machine can come first).
 const closeBoth=async()=>{for(const p of pages)await p.getByRole('button',{name:'CLOSE'}).click({timeout:4000}).catch(()=>{});for(const p of pages)await until(p,()=>!VoidTrade.open,undefined,60000);};
 try{
  const A=await player(w.accounts.fox),B=await player(w.accounts.bolt);pages=[A,B];
  for(const p of [A,B])await until(p,()=>VoidRemotePlayers.connected&&VoidRemotePlayers.peers.length===1&&VoidRemotePlayers.peers[0].drawn&&VoidRemotePlayers.features.trade);
  const t0=JSON.stringify(ledger.totals());

  // 1. The prompt, the request, the answer.
  await until(A,()=>/TRADE WITH Bolt_9/.test(VoidTrade.promptText||''));assert.match(await A.evaluate(()=>VoidTrade.promptText),/\[T\]/);
  await A.keyboard.press('KeyT');
  await until(B,()=>/Neon_Fox wants to trade/.test(VoidTrade.toastText||''));await until(A,()=>/Waiting for Bolt_9/.test(VoidTrade.toastText||''));
  // Decline first: the asker is told, and cannot ask again at once.
  await B.keyboard.press('KeyN');const declinedAt=Date.now();await until(A,()=>!VoidTrade.toastText&&!VoidTrade.open);
  await A.keyboard.press('KeyT');await A.waitForTimeout(800);
  const early=Date.now()-declinedAt<6000,asked=await B.evaluate(()=>VoidTrade.toastText);
  if(early)assert.equal(asked,null,'a declined player is not asked again at once');   // (on a very slow machine the 8 s cool-down may already be over: the rule itself is unit tested)
  if(!asked){await A.waitForTimeout(Math.max(0,9000-(Date.now()-declinedAt)));await A.keyboard.press('KeyT');}
  await until(B,()=>/wants to trade/.test(VoidTrade.toastText||''));await B.keyboard.press('KeyY');
  for(const p of [A,B]){await until(p,()=>VoidTrade.open&&document.querySelector('#trade-window'));assert.match(await p.locator('#trade-window .tw-sim').textContent(),/SIMULATED INVENTORY/);}
  assert.equal(await A.evaluate(()=>VoidTrade.session.inventory.credits),500);assert.equal(await B.evaluate(()=>VoidTrade.session.inventory.credits),200);

  // 2. Offers, side by side. A: 100 credits, 2 hull scrap, the pulse cannon. B: 20 credits, 1 drive coil.
  await A.locator('#trade-window input[type=number]').fill('100');
  await A.locator('button[aria-label="Offer more Hull scrap"]').click();await A.locator('button[aria-label="Offer more Hull scrap"]').click();
  await A.locator('input[aria-label="Offer Pulse cannon Mk I"], input[aria-label^="Offer pulse1"]').first().check().catch(async()=>{await A.locator('#trade-window input[type=checkbox]').first().check();});
  await until(B,()=>VoidTrade.session.theirs.credits===100&&VoidTrade.session.theirs.stacks.some(s=>s.id==='scrap-plate'&&s.qty===2)&&VoidTrade.session.theirs.equipment.length===1);
  await B.locator('#trade-window input[type=number]').fill('20');await B.locator('button[aria-label="Offer more Salvaged drive coil"]').click();
  await until(A,()=>VoidTrade.session.theirs.credits===20&&VoidTrade.session.theirs.stacks.some(s=>s.id==='drive-coil'));
  const view=await B.locator('#trade-window').innerText();assert.match(view,/NEON_FOX OFFERS/);assert.match(view,/Hull scrap/);assert.match(view,/Pulse cannon Mk I/);
  await A.screenshot({path:`/tmp/dd-trade-${tier}.png`});

  // 3. A change after a confirmation clears it; then both confirm the final offer.
  await A.getByRole('button',{name:'CONFIRM EXCHANGE'}).click();await until(B,()=>VoidTrade.session.confirmed.them===true);
  await B.locator('#trade-window input[type=number]').fill('25');await until(A,()=>VoidTrade.session.confirmed.you===false&&VoidTrade.session.theirs.credits===25);
  await until(B,()=>VoidTrade.session.confirmed.you===false);
  await A.getByRole('button',{name:'CONFIRM EXCHANGE'}).click();await until(B,()=>VoidTrade.session.confirmed.them===true);await B.getByRole('button',{name:'CONFIRM EXCHANGE'}).click();
  for(const p of [A,B])await until(p,()=>VoidTrade.result?.ok===true);
  assert.match(await A.evaluate(()=>VoidTrade.result.text),/TRADE COMPLETE/);
  assert.equal((await ledger.snapshot('uid-fox')).credits,500-100+25);assert.equal((await ledger.snapshot('uid-bolt')).credits,200+100-25);assert(!(await ledger.snapshot('uid-fox')).equipment.includes('pulse1-aa01'));
  assert.equal(JSON.stringify(ledger.totals()),t0,'nothing created or destroyed');assert.equal(ledger.log.filter(x=>x.outcome==='completed').length,1);
  await closeBoth();

  // 4. Walking away cancels, and nothing moves.
  await A.waitForTimeout(500);await A.keyboard.press('KeyT');await until(B,()=>/wants to trade/.test(VoidTrade.toastText||''));await B.keyboard.press('KeyY');
  for(const p of [A,B])await until(p,()=>VoidTrade.open);
  await A.locator('#trade-window input[type=number]').fill('10');await until(B,()=>VoidTrade.session.theirs.credits===10);
  await B.evaluate(()=>{walker.x+=8;});
  for(const p of [A,B])await until(p,()=>VoidTrade.result&&VoidTrade.result.ok===false&&/walked away/.test(VoidTrade.result.text));
  assert.equal(ledger.log.filter(x=>x.outcome==='completed').length,1,'no second exchange');assert.equal((await ledger.snapshot('uid-fox')).credits,425);
  await closeBoth();

  // 5. The production default: a hub restarted without a ledger shows no trading at all.
  await hub.close();hub=await boot(port,false);
  for(const p of [A,B])await until(p,()=>VoidRemotePlayers.connected&&VoidRemotePlayers.peers.length===1&&VoidRemotePlayers.features.trade===false,null,300000);
  await A.waitForTimeout(1500);assert.equal(await A.evaluate(()=>VoidTrade.promptText),null,'no prompt when the hub has trading off');
  await A.keyboard.press('KeyT');await A.waitForTimeout(500);assert.equal(await B.evaluate(()=>VoidTrade.toastText),null);

  assert.deepEqual(errors,[]);console.log(JSON.stringify({tier,completed:ledger.log.filter(x=>x.outcome==='completed').length,errors}));
 }finally{await browser.close();await hub.close().catch(()=>{});}
})().catch(e=>{console.error(e);process.exitCode=1;});
