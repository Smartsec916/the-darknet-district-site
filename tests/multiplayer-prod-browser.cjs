/* Two independent browsers through the PRODUCTION hub path (HUB_MODE=production): Firebase-style signed tokens checked with a local key set,
   characters and handles fetched from an in-process fake of the game API, an account allow-list, name tags. No emulator, no network.
   SITE_TEST_URL=http://127.0.0.1:5187 node tests/multiplayer-prod-browser.cjs [low|high]   (needs npm install for `ws`, and Playwright) */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),WebSocket=require('ws');
const {main}=require('../tools/district-hub/server.cjs'),{makeWorld}=require('./helpers/hub-fixtures.cjs');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',tier=process.argv[2]==='high'?'high':'low',wait=ms=>new Promise(r=>setTimeout(r,ms));
const w=makeWorld({fox:{uid:'uid-fox',model:'district-resident',handle:'Neon_Fox'},bolt:{uid:'uid-bolt',model:'district-smuggler',handle:'Bolt_9'},
 guest:{uid:'uid-guest',provider:'anonymous'},stranger:{uid:'uid-stranger',model:'district-smuggler',handle:'Stranger'}});
const env=port=>({HUB_MODE:'production',HUB_API_BASE:'https://api.test',HUB_ALLOWED_UIDS:'uid-fox,uid-bolt,uid-guest',PORT:String(port)});
const hubLog=[];const boot=port=>main(env(port),{fetchJwks:w.fetchJwks,fetchImpl:w.fetchImpl,log:(...a)=>hubLog.push(new Date().toISOString().slice(11,23)+' '+a.join(' ')),origins:[new URL(base).origin]});   // the test page's own origin stands in for the site's   // the test page's own origin stands in for the site's

(async()=>{
 let hub=await boot(0);const port=hub.port,errors=[];
 const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox']});
 let pa,pb,pc;
 async function player(acct){
  const ctx=await browser.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce',serviceWorkers:'block'}),page=await ctx.newPage();
  page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(240000);
  await page.route('https://**/*',r=>r.abort());await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
  await page.addInitScript(([q,t])=>{localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:q}));localStorage.setItem('tdd-dev-mp-token',t);},[tier,acct.token]);
  await page.goto(`${base}/void-runner.html?multiplayer=1&hub=ws://127.0.0.1:${port}`);await page.waitForFunction(()=>window.VoidStartup?.started,null,{timeout:120000});
  await page.click('[data-action=menu-campaign]');await page.click('[data-action=menu-new]');
  const confirm=page.locator('[data-action=menu-new-confirm]');if(await confirm.count())await confirm.click();
  await page.waitForFunction(()=>mode==='pod-waking'&&walker,null,{timeout:120000});await page.evaluate(()=>{state.story.flags.appearanceOffered=true;});await page.locator('#pod-wake button').click();
  await page.waitForFunction(()=>mode==='walking'&&walker&&VoidAssets.pending===0,null,{timeout:120000});
  return {ctx,page};}
 const peersOf=p=>p.page.evaluate(()=>VoidRemotePlayers.peers);
 const until=async(p,fn,ms=120000)=>{try{await p.page.waitForFunction(f=>eval('('+f+')')(VoidRemotePlayers.peers,VoidRemotePlayers),fn.toString(),{timeout:ms,polling:200});}
  catch(e){for(const [n,q] of [['A',pa],['B',pb]])if(q)console.error('DIAG',n,JSON.stringify(await q.page.evaluate(()=>({status:VoidRemotePlayers.status,lastClose:VoidRemotePlayers.lastClose,sock:VoidRemotePlayers.socketState,trace:VoidRemotePlayers.trace,now:Math.round(performance.now()),peers:VoidRemotePlayers.peers}))));console.error('DIAG hub log',hubLog.slice(-25).join(' | '),'gate',hub.gate.count);throw e;}};
 const snapshot=p=>p.page.evaluate(()=>({loc:state.location,credits:state.credits,story:JSON.stringify(state.story),npcs:(()=>{const remote=n=>{for(let q=n.parent;q;q=q.parent)if(/^remote-player:/.test(q.name))return true;return false;};return VoidBabylon.scene.transformNodes.filter(n=>/^crowd:/.test(n.name)&&!remote(n)).length;})()}));
 const raw=acct=>new Promise((res,rej)=>{const s=new WebSocket(`ws://127.0.0.1:${port}`,{origin:new URL(base).origin});const o={s,msgs:[]};s.on('message',d=>o.msgs.push(JSON.parse(d)));s.on('close',c=>{o.closed=c;});s.on('error',rej);
  s.on('open',()=>{s.send(JSON.stringify({t:'hello',token:acct.token,room:'district-interior'}));setTimeout(()=>{if(s.readyState===1)s.send(JSON.stringify({t:'state',x:139.4+1.4,z:-98.9,yaw:0}));res(o);},700);});});
 try{
  pa=await player(w.accounts.fox);pb=await player(w.accounts.bolt);
  const before=[await snapshot(pa),await snapshot(pb)];
  // 1. Different accounts: each sees the other's registered handle as a name tag and the character the API stored for that account.
  await until(pa,v=>v.length===1&&v[0].drawn&&v[0].tagged);await until(pb,v=>v.length===1&&v[0].drawn&&v[0].tagged);
  const seenByA=(await peersOf(pa))[0],seenByB=(await peersOf(pb))[0];
  assert.deepEqual([seenByA.name,seenByA.model],['Bolt_9','district-smuggler']);assert.deepEqual([seenByB.name,seenByB.model],['Neon_Fox','district-resident']);
  assert(w.calls.every(([,t])=>Object.values(w.accounts).some(a=>a.token===t)),'the hub only forwarded the players\' own tokens');
  // 2. Movement and facing, as before.
  const b0=await pb.page.evaluate(()=>({x:walker.x,z:walker.z}));await pb.page.keyboard.down('KeyW');
  await pa.page.waitForFunction(()=>VoidRemotePlayers.peers[0]?.seen.includes('walk'),null,{timeout:90000,polling:100});
  await pb.page.waitForFunction(p=>Math.hypot(walker.x-p.x,walker.z-p.z)>.8,b0,{timeout:90000,polling:100});await pb.page.keyboard.up('KeyW');
  await wait(500);await pb.page.evaluate(()=>{walker.yaw=2.2;});
  const t0=Date.now();let err,dyaw;
  for(;;){const b=await pb.page.evaluate(()=>({x:walker.x,z:walker.z,yaw:walker.yaw})),a=(await peersOf(pa))[0];err=Math.hypot(a.x-b.x,a.z-b.z);dyaw=Math.abs(Math.atan2(Math.sin(a.yaw-b.yaw),Math.cos(a.yaw-b.yaw)));if(err<.35&&dyaw<.2||Date.now()-t0>60000)break;await wait(200);}
  assert(err<.35&&dyaw<.2,`A sees B in the right place and facing (err ${err.toFixed(2)}, yaw ${dyaw.toFixed(2)})`);
  // 3. Even an allow-listed anonymous account cannot enter; a stranger not on the list is refused too.
  const g=await raw(w.accounts.guest);assert.equal(g.closed,4407);assert.equal(g.msgs.some(m=>m.t==='welcome'),false);
  const names=(await peersOf(pb)).map(x=>x.name).sort();assert.deepEqual(names,['Neon_Fox']);
  const st=await raw(w.accounts.stranger).catch(()=>null);await wait(300);assert(!st||st.closed===4403,'a stranger is refused: '+st?.closed);
  await pa.page.evaluate(()=>{const p=VoidRemotePlayers.peers.find(x=>x.name==='Bolt_9');walker.yaw=Math.atan2(p.x-walker.x,p.z-walker.z);walker.pitch=0;});await wait(1500);await pa.page.screenshot({path:`/tmp/dd-multiplayer-prod-${tier}.png`});
  g.s.terminate();
  // 4. The hub restarts (as a host does on a deploy): every client is told 1012 and reconnects within seconds, with no duplicates.
  const r0=Date.now();await hub.close();await pb.page.waitForFunction(()=>VoidRemotePlayers.peers.length===0&&!VoidRemotePlayers.connected,null,{timeout:60000});
  hub=await boot(port);
  await until(pa,v=>v.length===1&&v[0].drawn&&v[0].tagged,240000);await until(pb,v=>v.length===1&&v[0].drawn&&v[0].tagged,240000);const reconnectMs=Date.now()-r0;
  // 5. Single-player is unaffected: NPC count, story, credits, location unchanged, and nothing about multiplayer was saved.
  const after=await snapshot(pb);assert.equal(after.npcs,before[1].npcs);assert.equal(after.story,before[1].story);assert.equal(after.credits,before[1].credits);assert.equal(after.loc,before[1].loc);
  assert(await pb.page.evaluate(()=>!Object.keys(localStorage).some(k=>/multiplayer|remote|hub/i.test(k)&&!['tdd-multiplayer','tdd-dev-mp-token'].includes(k))),'no multiplayer data stored');
  assert.deepEqual(errors,[]);console.log(JSON.stringify({tier,err:+err.toFixed(3),dyaw:+dyaw.toFixed(3),reconnectMs,names:[seenByA.name,seenByB.name],npcs:after.npcs,errors}));
 }finally{await browser.close();await hub.close().catch(()=>{});}
})().catch(e=>{console.error(e);process.exitCode=1;});
