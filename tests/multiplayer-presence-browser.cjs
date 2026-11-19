/* Presence in the District, with two (then three) independent browser sessions and a hub started inside this process. SIMULATED identities: the hub's identity
   check is a fixed table here, so this proves the game client and the hub together, NOT Firebase sign-in or the live services.
   SITE_TEST_URL=http://127.0.0.1:5187 node tests/multiplayer-presence-browser.cjs
   Covers the 2026-11-11 report (two players in their pods could not see each other): a player lying in a pod stays online and is shown at the pod door, never inside. */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',{start}=require('../tools/district-hub/hub-server.cjs');
const WHO={'tok-a':{uid:'uid-a',anonymous:false,model:'district-resident',handle:'Alpha_01'},'tok-b':{uid:'uid-b',anonymous:false,model:'district-smuggler',handle:'Bravo_02'}};
(async()=>{
 const hub=await start({identify:async t=>WHO[t]||null}),errors=[];
 const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox']});
 async function player(tok){
  const ctx=await browser.newContext({viewport:{width:1280,height:720},reducedMotion:'reduce',serviceWorkers:'block'}),page=await ctx.newPage();page.setDefaultTimeout(240000);
  page.on('pageerror',e=>errors.push(e.message));await page.route('https://**/*',r=>r.abort());await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
  await page.addInitScript(t=>{localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:'low'}));if(t)localStorage.setItem('tdd-dev-mp-token',t);},tok);
  await page.goto(`${base}/void-runner.html?multiplayer=1&hub=ws://127.0.0.1:${hub.port}`);await page.waitForFunction(()=>window.VoidStartup?.started);
  assert(!(await page.content()).includes('EARLIER CAMPAIGN'),'the main menu no longer offers the earlier-campaign download');
  await page.click('[data-action=menu-campaign]');await page.click('[data-action=menu-new]');const c=page.locator('[data-action=menu-new-confirm]');if(await c.count())await c.click();
  await page.waitForFunction(()=>document.querySelector('#character-creator.on')||(mode==='pod-waking'&&walker));
  if(await page.locator('#character-creator.on').count()){await page.waitForFunction(()=>!document.querySelector('[data-cc=confirm]').disabled);await page.locator('[data-cc=confirm]').click();}
  await page.waitForFunction(()=>mode==='pod-waking'&&walker&&VoidAssets.pending===0);return {ctx,page};}
 const d=p=>p.page.evaluate(()=>({...VoidRemotePlayers.diagnostics,mode,chip:document.getElementById('mp-chip')?.textContent||'',peers:VoidRemotePlayers.peers.map(x=>({name:x.name,drawn:x.drawn,x:x.x,z:x.z}))}));
 const until=async(p,fn,what)=>{try{await p.page.waitForFunction(f=>eval('('+f+')')({...VoidRemotePlayers.diagnostics,mode,chip:document.getElementById('mp-chip')?.textContent||''}),fn.toString(),{timeout:90000,polling:250});}catch(e){console.error('FAILED:',what,JSON.stringify(await d(p)));throw e;}};
 try{
  // 1. Both players lie in their pods and never leave: they must still be online together.
  const a=await player('tok-a'),b=await player('tok-b');
  await until(a,v=>v.mode==='pod-waking'&&v.status==='in'&&v.players===1&&v.rendered===1,'A, in the pod, sees B');
  await until(b,v=>v.mode==='pod-waking'&&v.status==='in'&&v.players===1&&v.rendered===1,'B, in the pod, sees A');
  await until(a,v=>/ONLINE · 1 OTHER PLAYER HERE/.test(v.chip),'A is told it is online with one other player');
  let da=await d(a);assert.equal(da.peers[0].name,'Bravo_02');
  // a pod is private: the other player is shown at the pod door, not on the bed
  const door=await a.page.evaluate(()=>{const e=VoidDistrictArea.podExit(VoidNeoChinatown,1);return [e.spawn[0],e.spawn[2]];});
  await a.page.waitForFunction(([x,z])=>{const p=VoidRemotePlayers.peers[0];return p&&Math.hypot(p.x-x,p.z-z)<.3;},door);
  // 2. B gets up and walks; opening the pause menu and the pod's music screen does not take B out of the District.
  await b.page.locator('#pod-wake [data-pod=exit]').click();await b.page.waitForFunction(()=>mode==='walking');
  await b.page.evaluate(()=>{walker.x+=1.2;});await a.page.waitForFunction(([x,z])=>{const p=VoidRemotePlayers.peers[0];return p&&Math.hypot(p.x-x,p.z-z)>.8;},door);
  await b.page.evaluate(()=>openGameMenu());await b.page.waitForFunction(()=>mode==='menu');await b.page.waitForTimeout(2500);
  assert.equal((await d(b)).status,'in','still online with the menu open');assert.equal((await d(a)).players,1,'A still sees B while B has a menu open');
  await b.page.evaluate(()=>resumeWalking());
  // 3. A visitor who is not signed in is told plainly that this is solo play, and is not connected.
  const g=await player(null);await until(g,v=>/PLAYING SOLO · SIGN IN/.test(v.chip)&&v.status!=='in','a visitor without an account is told it is solo play');
  assert.equal(hub.hub.peers.size,2,'the hub holds exactly the two signed-in players');await g.ctx.close();
  // 4. The same account in a second window takes over; the first window is told, and nobody is duplicated.
  const b2=await player('tok-b');await until(b2,v=>v.status==='in'&&v.players===1,'the second window of B is online');
  await until(b,v=>/ANOTHER WINDOW/.test(v.chip),'the first window of B is told it was replaced');
  await until(a,v=>v.players===1&&v.rendered===1,'A sees one B, not two');
  // 5. Leaving removes the avatar; coming back shows it again, once.
  await b2.ctx.close();await until(a,v=>v.players===0,'B left: A sees nobody');
  await b.page.evaluate(()=>document.getElementById('mp-chip').click());await until(b,v=>v.status==='in'&&v.players===1,'B returned in the first window');
  await until(a,v=>v.players===1&&v.rendered===1,'A sees B again, once');
  da=await d(a);const db=await d(b);assert.deepEqual(errors,[]);
  console.log(JSON.stringify({ok:true,simulatedIdentities:true,A:{status:da.status,players:da.players,rendered:da.rendered,fallbackAvatars:da.fallbackAvatars,reconnects:da.reconnects},B:{status:db.status,players:db.players,rendered:db.rendered,reconnects:db.reconnects}}));
 }finally{await browser.close();await hub.close?.();}
})().catch(e=>{console.error(e);process.exit(1);});
