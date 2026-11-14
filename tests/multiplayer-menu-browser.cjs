/* The Settings > Multiplayer test button (no browser console needed), on a local page against the production hub path with signed test tokens.
   One real browser plus a plain test socket as the second player. Proves: nothing connects until the tester presses JOIN; JOIN connects and draws the
   other player with a name tag; an account that is not on the test list is told so and stays single-player; LEAVE disconnects and removes the avatar;
   the choice is remembered after a reload; the live-site gate is not weakened. Needs `ws` and Playwright.
   SITE_TEST_URL=http://127.0.0.1:5187 node tests/multiplayer-menu-browser.cjs [low|high] */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),WebSocket=require('ws');
const {main}=require('../tools/district-hub/server.cjs'),{makeWorld}=require('./helpers/hub-fixtures.cjs');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',tier=process.argv[2]==='high'?'high':'low',wait=ms=>new Promise(r=>setTimeout(r,ms));
const w=makeWorld({fox:{uid:'uid-fox',model:'district-resident',handle:'Neon_Fox'},bolt:{uid:'uid-bolt',model:'district-smuggler',handle:'Bolt_9'},stranger:{uid:'uid-stranger',model:'district-smuggler',handle:'Stranger'}});
(async()=>{
 const hub=await main({HUB_MODE:'production',HUB_API_BASE:'https://api.test',HUB_ALLOWED_UIDS:'uid-fox,uid-bolt',PORT:'0'},{fetchJwks:w.fetchJwks,fetchImpl:w.fetchImpl,quiet:true,origins:[new URL(base).origin]});
 const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox']}),errors=[];
 try{
  async function open(acct){
   const ctx=await browser.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce',serviceWorkers:'block'}),page=await ctx.newPage();
   page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(240000);
   await page.route('https://**/*',r=>r.abort());await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
   await page.addInitScript(([q,t])=>{if(!sessionStorage.getItem('seeded')){localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:q}));localStorage.setItem('tdd-dev-mp-token',t);sessionStorage.setItem('seeded','1');}},[tier,acct.token]);
   await page.goto(`${base}/void-runner.html?hub=ws://127.0.0.1:${hub.port}`);await page.waitForFunction(()=>window.VoidStartup?.started,null,{timeout:120000});
   return {ctx,page};}
  const toDistrict=async page=>{await page.click('[data-action=menu-campaign]');await page.click('[data-action=menu-new]');const c=page.locator('[data-action=menu-new-confirm]');if(await c.count())await c.click();
   await page.waitForFunction(()=>mode==='pod-waking'&&walker,null,{timeout:120000});await page.evaluate(()=>{state.story.flags.appearanceOffered=true;});await page.locator('#pod-wake button').click();
   await page.waitForFunction(()=>mode==='walking'&&walker&&VoidAssets.pending===0,null,{timeout:120000});};
  const status=page=>page.evaluate(()=>document.getElementById('multiplayer-status')?.textContent);
  const raw=acct=>new Promise((res,rej)=>{const s=new WebSocket(`ws://127.0.0.1:${hub.port}`,{origin:new URL(base).origin}),o={s,closed:null};s.on('close',c=>{o.closed=c;});s.on('error',rej);
   s.on('open',()=>{s.send(JSON.stringify({t:'hello',token:acct.token,room:'district-interior'}));setTimeout(()=>{s.send(JSON.stringify({t:'state',x:139.4+1.4,z:-98.9,yaw:0}));res(o);},700);});});

  // 1. A listed tester. Nothing is connected or even created until the button is pressed.
  let {page}=await open(w.accounts.fox);
  assert.equal(await page.evaluate(()=>typeof VoidRemotePlayers),'undefined','no multiplayer code runs until the tester asks');
  await page.click('[data-action=menu-settings]');
  assert.match(await status(page),/Off/);assert.equal(await page.locator('#multiplayer-toggle').textContent(),'JOIN MULTIPLAYER TEST');
  await page.click('#multiplayer-toggle');
  assert.equal(await page.locator('#multiplayer-toggle').textContent(),'LEAVE MULTIPLAYER TEST');assert.equal(await page.evaluate(()=>localStorage.getItem('tdd-multiplayer')),'1');
  assert.equal(await page.evaluate(()=>typeof VoidRemotePlayers),'object','the button starts it without a reload');
  await page.click('[data-action=menu-back]').catch(()=>{});
  await page.goto(`${base}/void-runner.html?hub=ws://127.0.0.1:${hub.port}`);await page.waitForFunction(()=>window.VoidStartup?.started,null,{timeout:120000});
  assert.equal(await page.evaluate(()=>typeof VoidRemotePlayers),'object','the choice is remembered after a reload');
  await toDistrict(page);
  const g=await raw(w.accounts.bolt);
  try{await page.waitForFunction(()=>VoidRemotePlayers.connected&&VoidRemotePlayers.peers.length===1&&VoidRemotePlayers.peers[0].drawn&&VoidRemotePlayers.peers[0].tagged,null,{timeout:240000,polling:200});}catch(e){console.error('DIAG',JSON.stringify(await page.evaluate(()=>({status:VoidRemotePlayers.status,lastClose:VoidRemotePlayers.lastClose,sock:VoidRemotePlayers.socketState,trace:VoidRemotePlayers.trace,peers:VoidRemotePlayers.peers,mode,area:walkingLocation?.area,pending:VoidAssets.pending,flag:localStorage.getItem('tdd-multiplayer'),tok:!!localStorage.getItem('tdd-dev-mp-token')}))));throw e;}
  const peer=(await page.evaluate(()=>VoidRemotePlayers.peers))[0];assert.deepEqual([peer.name,peer.model],['Bolt_9','district-smuggler']);
  // 2. LEAVE from the Settings page (reached from the in-game menu) disconnects and removes the avatar.
  await page.evaluate(()=>settingsPage());assert.match(await status(page),/Connected/);
  await page.click('#multiplayer-toggle');
  await page.waitForFunction(()=>VoidRemotePlayers.peers.length===0&&VoidRemotePlayers.status==='off',null,{timeout:60000});assert.equal(await page.evaluate(()=>localStorage.getItem('tdd-multiplayer')),'0','leaving stores an explicit off choice');
  await wait(1500);assert.equal(await page.evaluate(()=>VoidRemotePlayers.peers.length),0,'stays alone after leaving');
  await page.click('#multiplayer-toggle');await page.waitForFunction(()=>VoidRemotePlayers.connected&&VoidRemotePlayers.peers.length===1,null,{timeout:240000,polling:200});
  g.s.terminate();await page.close();
  // 3. An account that is not on the test list is told so and stays single-player.
  ({page}=await open(w.accounts.stranger));
  await page.click('[data-action=menu-settings]');await page.click('#multiplayer-toggle');await page.click('[data-action=menu-back]');await toDistrict(page);
  await page.waitForFunction(()=>VoidRemotePlayers.status==='not on the test list',null,{timeout:240000,polling:200});
  await page.evaluate(()=>settingsPage());assert.match(await status(page),/not on the test list/);assert.equal(await page.evaluate(()=>VoidRemotePlayers.peers.length),0);
  await wait(2500);assert.equal(await page.evaluate(()=>VoidRemotePlayers.status),'not on the test list','it does not keep retrying');
  assert.deepEqual(errors,[]);console.log(JSON.stringify({tier,errors}));
 }finally{await browser.close();await hub.close().catch(()=>{});}
})().catch(e=>{console.error(e);process.exitCode=1;});
