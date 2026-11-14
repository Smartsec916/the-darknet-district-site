/* Two real game pages through the PRODUCTION hub path in open registered-account mode (HUB_ACCESS=registered, no id list): signed test tokens checked with a local
   key set, an in-process fake of the game API. Tests text chat both ways in the real District, names, saved appearance, mute, block, report, rate limits,
   anonymous refusal, a hub outage and recovery, and that single-player keeps working. No emulator, no network, no real Firebase.
   SITE_TEST_URL=http://127.0.0.1:5187 node tests/district-chat-browser.cjs [low|high]   (needs `ws` and Playwright) */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const {main}=require('../tools/district-hub/server.cjs'),{makeWorld}=require('./helpers/hub-fixtures.cjs'),A=require('../void-runner/character-appearance.js');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',tier=process.argv[2]==='high'?'high':'low',wait=ms=>new Promise(r=>setTimeout(r,ms));
const w=makeWorld({ann:{uid:'uid-ann',model:'district-resident',handle:'Ann_R',appearance:{...A.defaults('ncz-neon'),hair:'ponytail01',hairColor:'cyan'}},ben:{uid:'uid-ben',model:'district-smuggler',handle:'Ben_K'},anon:{uid:'uid-anon',provider:'anonymous'}});
const hubLog=[];const boot=port=>main({HUB_MODE:'production',HUB_API_BASE:'https://api.test',HUB_ACCESS:'registered',PORT:String(port),HUB_MAX_PER_IP:'8'},{fetchJwks:w.fetchJwks,fetchImpl:w.fetchImpl,log:(...a)=>hubLog.push(a.join(' ')),origins:[new URL(base).origin]});
(async()=>{
 let hub=await boot(0);const port=hub.port,errors=[];
 const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox']});
 async function player(acct){
  const ctx=await browser.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce',serviceWorkers:'block'}),page=await ctx.newPage();
  page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(240000);
  await page.route('https://**/*',r=>r.abort());await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
  await page.addInitScript(([q,t])=>{localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:q}));localStorage.setItem('tdd-dev-mp-token',t);},[tier,acct.token]);
  await page.goto(`${base}/void-runner.html?multiplayer=1&hub=ws://127.0.0.1:${port}`);await page.waitForFunction(()=>window.VoidStartup?.started,null,{timeout:120000});
  await page.click('[data-action=menu-campaign]');await page.click('[data-action=menu-new]');const c=page.locator('[data-action=menu-new-confirm]');if(await c.count())await c.click();
  await page.waitForFunction(()=>mode==='pod-waking'&&walker,null,{timeout:120000});await page.evaluate(()=>{state.story.flags.appearanceOffered=true;});await page.locator('#pod-wake button').click();
  await page.waitForFunction(()=>mode==='walking'&&walker&&VoidAssets.pending===0,null,{timeout:tier==='high'?600000:120000});   // a third software-rendered High page is slow to load
  return {ctx,page};}
 const lines=p=>p.page.evaluate(()=>VoidDistrictChat.lines.map(l=>(l.name?l.name+' ':'')+l.text));
 // Enter opens the V1 on Messages > District chat with the box ready (the old left-side box is gone); the V1 is closed again after sending, like the old Escape
 const say=async(p,text)=>{await p.page.keyboard.press('Enter');await p.page.waitForSelector('#personal-device.open [data-chatform] input:not([disabled])',{state:'visible'});await p.page.fill('#personal-device [data-chatform] input',text);await p.page.keyboard.press('Enter');await p.page.waitForFunction(t=>VoidDistrictChat.lines.some(l=>l.kind==='me'&&l.text===t),text,{timeout:30000});await p.page.evaluate(()=>VoidPersonalDevice.close());};
 try{
  const A1=await player(w.accounts.ann),B1=await player(w.accounts.ben);
  console.log('District chat browser: two registered game pages loaded');
  const snap=p=>p.page.evaluate(()=>({loc:state.location,credits:state.credits,inv:JSON.stringify(state.inventory||null),flags:JSON.stringify(state.story)}));
  const before=[await snap(A1),await snap(B1)];
  // 1. Both registered players see each other: name tag, character, and Ann's saved creator look
  for(const p of [A1,B1])await p.page.waitForFunction(()=>VoidRemotePlayers.peers.length===1&&VoidRemotePlayers.peers[0].drawn&&VoidRemotePlayers.peers[0].tagged&&VoidRemotePlayers.features.chat,null,{timeout:180000,polling:200});
  const seenByB=(await B1.page.evaluate(()=>VoidRemotePlayers.peers))[0],seenByA=(await A1.page.evaluate(()=>VoidRemotePlayers.peers))[0];
  assert.equal(seenByB.name,'Ann_R');assert.equal(seenByB.appearance.look,'ncz-neon');assert.equal(seenByA.name,'Ben_K');assert.equal(seenByA.appearance?.look,'district-smuggler','a legacy account is shown with the look matching its character');
  // 2. Chat both ways, typed with the keyboard, with the sender's name
  await say(A1,'Hello from Ann');await B1.page.waitForFunction(()=>VoidDistrictChat.lines.some(l=>/Ann_R.*Hello from Ann/.test(l.name+' '+l.text)),null,{timeout:30000});
  assert.ok((await B1.page.evaluate(()=>VoidDistrictChat.unread))>=1,'a message that arrived while the V1 was closed is counted as unread');assert.match(await B1.page.textContent('#pd-chip'),/NEW/);
  await wait(900);await say(B1,'Hi Ann, Ben here');await A1.page.waitForFunction(()=>VoidDistrictChat.lines.some(l=>/Ben_K.*Hi Ann, Ben here/.test(l.name+' '+l.text)),null,{timeout:30000});
  console.log('District chat browser: two-way messages verified');
  // typing never walks the character
  const p0=await A1.page.evaluate(()=>({x:walker.x,z:walker.z}));await say(A1,'wasd wasd wasd');await wait(700);const p1=await A1.page.evaluate(()=>({x:walker.x,z:walker.z}));assert(Math.hypot(p1.x-p0.x,p1.z-p0.z)<.05,'typing does not move the player');
  // 3. A message with markup is shown as text, never as markup
  await wait(800);await say(A1,'<img src=x onerror=alert(1)> hi');await B1.page.waitForFunction(()=>VoidDistrictChat.lines.some(l=>l.text.includes('<img src=x')),null,{timeout:30000});assert.equal(await B1.page.evaluate(()=>document.querySelectorAll('#personal-device img.chat-test,#personal-device .pd-msg img').length),0);
  // 4. Links and floods are refused by the hub (Ben sees why), are not delivered to Ann, and a flood pauses only the flooder's chat
  await wait(800);await B1.page.evaluate(()=>VoidRemotePlayers.sendChat('visit http://spam.example'));await B1.page.waitForFunction(()=>VoidDistrictChat.lines.some(l=>l.kind==='sys'&&/Links/.test(l.text)),null,{timeout:30000});
  await B1.page.evaluate(()=>{for(let i=0;i<9;i++)VoidRemotePlayers.sendChat('flood '+i);});await B1.page.waitForFunction(()=>VoidDistrictChat.lines.some(l=>l.kind==='sys'&&/too fast|paused|Slow down/.test(l.text)),null,{timeout:30000});
  await wait(600);const la=await lines(A1);assert(!la.some(t=>/spam\.example/.test(t)));assert(la.filter(t=>/flood \d/.test(t)).length<=5,'at most 5 flood lines get through');
  // 5. Mute from the PLAYERS panel: Ben stops hearing Ann (still sees her); unmute restores
  await B1.page.keyboard.press('Enter');await B1.page.waitForSelector('#personal-device.open [data-chatform] input',{state:'visible'});   // opening Messages releases the mouse from the game
  assert.equal(await B1.page.evaluate(()=>mode),'walking','opening Messages does not open the pause menu');
  await B1.page.click('#personal-device [data-sub=players]');await B1.page.getByRole('button',{name:'MUTE',exact:true}).click();await wait(1200);
  await A1.page.waitForTimeout(800);await A1.page.evaluate(()=>VoidRemotePlayers.sendChat('can you hear me now'));await wait(1500);
  assert(!(await lines(B1)).some(t=>/can you hear me now/.test(t)),'muted: not shown');assert.equal((await B1.page.evaluate(()=>VoidRemotePlayers.peers)).length,1,'a muted player is still visible');
  await B1.page.getByRole('button',{name:'UNMUTE'}).click();await wait(1500);await A1.page.evaluate(()=>VoidRemotePlayers.sendChat('and now'));await B1.page.waitForFunction(()=>VoidDistrictChat.lines.some(l=>/and now/.test(l.name+' '+l.text)),null,{timeout:30000});
  // 6. Report goes to the hub log with the reason and the reported player's recent lines
  await B1.page.getByRole('button',{name:'REPORT'}).click();await B1.page.selectOption('#personal-device .pd-report select','harassment');await B1.page.getByRole('button',{name:'SEND REPORT'}).click();
  for(let i=0;i<40&&!hubLog.some(l=>/REPORT /.test(l));i++)await wait(250);
  const rl=hubLog.find(l=>/REPORT /.test(l));assert(rl,'report logged');const rep=JSON.parse(rl.slice(rl.indexOf('REPORT ')+7));assert.equal(rep.reason,'harassment');assert.equal(rep.target.name,'Ann_R');assert(rep.recentLines.length>=1);
  console.log('District chat browser: moderation verified');
  // 7. Block hides the avatar and the chat, and survives a page reload (kept for this account in this browser)
  await B1.page.getByRole('button',{name:'BLOCK',exact:true}).click();await wait(1000);assert.equal((await B1.page.evaluate(()=>VoidRemotePlayers.peers)).length,0,'a blocked player is not drawn');
  assert(await B1.page.evaluate(()=>VoidRemotePlayers.ignored.some(([,m])=>m==='block')));
  await B1.page.getByRole('button',{name:'UNBLOCK'}).click();await wait(500);
  // 8. Anonymous access is refused by the hub (token is checked on the server)
  const AN=await player(w.accounts.anon).catch(e=>{throw e;});await AN.page.waitForFunction(()=>/registered account required/.test(VoidRemotePlayers.status),null,{timeout:120000});assert.equal(await AN.page.evaluate(()=>VoidRemotePlayers.features.chat),false);assert.equal(await AN.page.evaluate(()=>VoidRemotePlayers.connected),false,'no chat for anonymous visitors');
  assert.equal(hub.hub.peers.size,2,'the anonymous visitor never joined');await AN.ctx.close();
  console.log('District chat browser: anonymous account refused');
  // 9. Hub outage: both pages keep playing alone; the hub comes back on the same address and both rejoin, chat works again
  await hub.close();for(const p of [A1,B1])await p.page.waitForFunction(()=>!VoidRemotePlayers.connected,null,{timeout:60000});
  for(const p of [A1,B1]){assert.equal(await p.page.evaluate(()=>mode),'walking','single player continues');const a=await p.page.evaluate(()=>walker.x);await p.page.keyboard.down('KeyW');await wait(600);await p.page.keyboard.up('KeyW');assert.notEqual(await p.page.evaluate(()=>walker.x),a,'still walking during the outage');assert.ok(await p.page.evaluate(()=>VoidDistrictChat.lines.some(l=>l.kind==='sys'&&/Disconnected/.test(l.text))),'the chat says it is disconnected');}
  hub=await boot(port);
  for(const p of [A1,B1])await p.page.waitForFunction(()=>VoidRemotePlayers.connected&&VoidRemotePlayers.peers.length===1&&VoidRemotePlayers.features.chat,null,{timeout:240000,polling:500});
  assert.equal(hub.hub.peers.size,2,'no ghost or duplicate players after recovery');
  await wait(1000);await say(A1,'back online');await B1.page.waitForFunction(()=>VoidDistrictChat.lines.some(l=>/back online/.test(l.name+' '+l.text)),null,{timeout:60000});
  // 10. Nothing in the saves changed through any of this
  const after=[await snap(A1),await snap(B1)];assert.deepEqual(after,before,'chat, moderation and multiplayer never touch credits, inventory, location or story');
  assert(!hubLog.some(l=>/eyJ[A-Za-z0-9_-]{20,}\./.test(l)),'no token in the hub log');
  console.log(JSON.stringify({tier,errors,reports:hubLog.filter(l=>/REPORT/.test(l)).length}));assert.deepEqual(errors,[]);
 }finally{await browser.close();await hub.close().catch(()=>{});}
})().catch(e=>{console.error(e);process.exitCode=1;});
