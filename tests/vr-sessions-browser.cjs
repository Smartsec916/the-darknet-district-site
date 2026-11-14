/* Shared VR sessions with three independent browser sessions and a hub started inside this process. SIMULATED identities (a fixed table), so this proves the
   game client and the hub together, NOT Firebase sign-in or the live services.   SITE_TEST_URL=http://127.0.0.1:5187 node tests/vr-sessions-browser.cjs */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',{start}=require('../tools/district-hub/hub-server.cjs');
const WHO={'tok-a':{uid:'uid-a',anonymous:false,model:'district-resident',handle:'Alpha_01'},'tok-b':{uid:'uid-b',anonymous:false,model:'district-smuggler',handle:'Bravo_02'},'tok-c':{uid:'uid-c',anonymous:false,model:'district-resident',handle:'Chara_03'}};
(async()=>{
 const hub=await start({identify:async t=>WHO[t]||null}),errors=[];
 const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox']});
 async function player(tok){
  const ctx=await browser.newContext({viewport:{width:1280,height:720},reducedMotion:'reduce',serviceWorkers:'block'}),page=await ctx.newPage();page.setDefaultTimeout(Number(process.env.VR_TEST_WAIT_MS)||240000);
  page.on('pageerror',e=>errors.push(e.message));await page.route('https://**/*',r=>r.abort());await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
  await page.addInitScript(t=>{localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:'low'}));localStorage.setItem('tdd-dev-mp-token',t);},tok);
  await page.goto(`${base}/void-runner.html?multiplayer=1&hub=ws://127.0.0.1:${hub.port}`);await page.waitForFunction(()=>window.VoidStartup?.started);
  await page.click('[data-action=menu-campaign]');await page.click('[data-action=menu-new]');const c=page.locator('[data-action=menu-new-confirm]');if(await c.count())await c.click();
  await page.waitForFunction(()=>document.querySelector('#character-creator.on')||(mode==='pod-waking'&&walker));
  if(await page.locator('#character-creator.on').count()){await page.waitForFunction(()=>!document.querySelector('[data-cc=confirm]').disabled);await page.locator('[data-cc=confirm]').click();}
  await page.waitForFunction(()=>mode==='pod-waking'&&walker&&VoidAssets.pending===0);await page.locator('#pod-wake [data-pod=exit]').click();await page.waitForFunction(()=>mode==='walking');
  await page.waitForFunction(()=>VoidRemotePlayers.connected);return {ctx,page};}
 const d=p=>p.page.evaluate(()=>({...VoidRemotePlayers.diagnostics,mode,kind:walkingLocation?.kind||'',area:walkingLocation?.area||'',walker:!!walker,vrDebug:VoidVR.debug,note:(document.querySelector('#vr-menu .vr-share strong')?.textContent||'')+' | '+(document.getElementById('notice')?.textContent||''),trace:VoidRemotePlayers.trace.slice(-6),vrId:walkingLocation?.vr||'',chip:document.getElementById('vr-chip')?.textContent||''}));
 const until=async(p,fn,what)=>{try{await p.page.waitForFunction(f=>eval('('+f+')')({...VoidRemotePlayers.diagnostics,mode,kind:walkingLocation?.kind||'',vrId:walkingLocation?.vr||'',chip:document.getElementById('vr-chip')?.textContent||'',menu:document.getElementById('vr-menu')?.textContent||''}),fn.toString(),{timeout:Number(process.env.VR_TEST_WAIT_MS)||150000,polling:250});}catch(e){console.error('FAILED:',what,JSON.stringify(await d(p)));throw e;}};
 const openMenu=async p=>{await p.page.evaluate(()=>VoidVR.openMenu());await p.page.waitForSelector('#vr-menu');};
 const inWorld=(p,exp,what)=>until(p,eval(`v=>v.kind==='vr'&&v.mode==='walking'&&v.vr&&v.vr.exp==='${exp}'`),what);
 try{
  // Only ONE real browser is inside a simulation at a time (a software renderer cannot build two at once); the other players speak to the hub directly, as a
  // game client would. wire(token) is such a player: it joins the District, keeps reporting a position, and records what the hub tells it.
  async function wire(tok){const c={got:[],peers:new Set()};c.ws=new WebSocket('ws://127.0.0.1:'+hub.port);await new Promise(r=>c.ws.onopen=r);
   c.ws.onmessage=e=>{const m=JSON.parse(e.data);c.got.push(m);if(m.t==='welcome'||m.t==='vr-room')c.peers=new Set((m.peers||[]).map(p=>p.id));else if(m.t==='join')c.peers.add(m.peer.id);else if(m.t==='leave')c.peers.delete(m.id);};
   c.ws.send(JSON.stringify({t:'hello',token:tok,room:'district-interior'}));c.at=[1,1];c.beat=setInterval(()=>c.ws.send(JSON.stringify({t:'state',x:c.at[0],z:c.at[1],yaw:0})),500);
   c.ask=(msg,type)=>new Promise(r=>{const n=c.got.length;c.ws.send(JSON.stringify(msg));const t=setInterval(()=>{const m=c.got.slice(n).find(x=>x.t===type);if(m){clearInterval(t);r(m);}},50);});
   c.sees=async(n,what)=>{for(let k=0;k<1200&&c.peers.size!==n;k++)await new Promise(r=>setTimeout(r,250));assert.equal(c.peers.size,n,what);};
   c.end=()=>{clearInterval(c.beat);c.ws.close();};return c;}
  const a=await wire('tok-a'),c=await wire('tok-c'),b=await player('tok-b');
  await until(b,v=>v.players===2&&v.rendered===2,'B sees A and C in the District');await a.sees(2,'A sees B and C');
  // 1. A opens a PUBLIC forest session. B finds it in the arcade menu, joins, and sees A inside. C, in the District, sees neither and hears nothing from inside.
  const pub=(await a.ask({t:'vr-create',exp:'forest',opts:'{}',private:false},'vr-room')).session;assert.equal(pub.private,false);await c.sees(1,'the District no longer shows A');
  await openMenu(b);await until(b,v=>/Relax in a Forest.*host Alpha_01.*1\/8/.test(v.menu),'the public session is listed for B');
  await b.page.click('[data-vr^="join:"]');await inWorld(b,'forest','B joined the forest session');const mark=c.got.length;   // from here on B moves inside the simulation
  const spawn=await b.page.evaluate(()=>[walker.x,walker.z]);a.at=[spawn[0]+2,spawn[1]];
  await until(b,v=>v.players===1&&v.rendered===1&&/PUBLIC SESSION · 2\/8/.test(v.chip),'B sees A in the forest and the head count');await a.sees(1,'A sees B in the forest');
  await c.sees(0,'C, in the District, sees nobody');await b.page.evaluate(()=>{walker.x+=.6;});await b.page.waitForTimeout(1500);assert(!c.got.slice(mark).some(m=>m.t==='state'||m.t==='join'),'nothing from inside the session reaches the District');
  // 2. The host leaves: the session stays for B, still listed, now hosted by B.
  await a.ask({t:'vr-leave'},'vr-room');a.at=[1,1];await until(b,v=>v.vr&&v.vr.count===1&&v.players===0&&/1\/8/.test(v.chip),'B is still in the session, now alone');
  let list=(await c.ask({t:'vr-list'},'vr-sessions')).list;assert.equal(list.length,1);assert.equal(list[0].host,'Bravo_02');assert.equal(list[0].id,pub.id);
  await b.page.evaluate(()=>VoidVR.exit());await until(b,v=>v.kind!=='vr'&&v.mode==='walking'&&!v.vr&&v.players===2,'B is back in the District with A and C');
  assert.equal(hub.hub.sessions.size,0,'the empty session is gone');
  // 3. A opens a PRIVATE tropical session. Not listed anywhere; its id and a guessed code open nothing; Quick Join finds nothing; with the code B gets in.
  await new Promise(r=>setTimeout(r,5200));const priv=(await a.ask({t:'vr-create',exp:'tropical',opts:'{}',private:true},'vr-room')).session;assert.match(priv.code,/^[A-HJ-NP-Z2-9]{8}$/);
  list=(await c.ask({t:'vr-list'},'vr-sessions')).list;assert.deepEqual(list,[],'a private session is not in the public list');
  assert.match((await c.ask({t:'vr-join',id:priv.id},'vr-refused')).reason,/not available/,'its id does not open it');assert.match((await c.ask({t:'vr-join',code:'AAAABBBB'},'vr-refused')).reason,/not valid/);
  await openMenu(b);await b.page.waitForTimeout(1500);assert(!/Tropical/.test(await b.page.locator('#vr-sessions').textContent()),'not listed in the game menu either');
  await b.page.click('[data-vr="quick"]');await until(b,v=>/No public session is open/.test(v.menu),'Quick Join never picks a private session');
  await b.page.fill('#vr-code',priv.code.toLowerCase().replace(/(.{4})/,'$1-'));await b.page.click('[data-vr="code"]');await inWorld(b,'tropical','B entered with the code');
  const sp2=await b.page.evaluate(()=>[walker.x,walker.z]);a.at=[sp2[0]+2,sp2[1]];
  await until(b,v=>v.players===1&&v.rendered===1&&/PRIVATE SESSION · CODE [A-Z2-9]{4}-[A-Z2-9]{4} · 2\/8/.test(v.chip),'B sees A in the private session');await c.sees(0,'C sees neither of them');
  await b.page.evaluate(()=>VoidVR.exit());await until(b,v=>v.kind!=='vr'&&v.mode==='walking'&&!v.vr&&v.players===1,'B is back in the District');await a.ask({t:'vr-leave'},'vr-room');a.at=[1,1];
  // 4. B opens a PUBLIC session from the menu: C finds it in the list, joins by its id and is told about B.
  await openMenu(b);await b.page.click('[data-vr="share:public"]');await b.page.click('[data-vr="pick:forest"]');await inWorld(b,'forest','B hosts a public session');
  list=(await c.ask({t:'vr-list'},'vr-sessions')).list;assert.equal(list.length,1);assert.equal(list[0].host,'Bravo_02');assert.equal(list[0].exp,'forest');
  const room=await c.ask({t:'vr-join',id:list[0].id},'vr-room');assert.equal(room.session.count,2);const sp3=await b.page.evaluate(()=>[walker.x,walker.z]);c.at=[sp3[0]+2,sp3[1]];
  await until(b,v=>v.players===1&&v.rendered===1&&/PUBLIC SESSION · 2\/8/.test(v.chip),'B sees C arrive in the session B opened');await c.sees(1,'C sees B');
  // 5. Everyone returns: normal District presence again.
  await b.page.evaluate(()=>VoidVR.exit());await c.ask({t:'vr-leave'},'vr-room');c.at=[1,1];
  await until(b,v=>v.kind!=='vr'&&v.players===2&&v.rendered===2,'B sees A and C in the District again');assert.equal(hub.hub.sessions.size,0);a.end();c.end();
  assert.deepEqual(errors,[]);console.log(JSON.stringify({ok:true,simulatedIdentities:true}));
 }finally{await browser.close();await hub.close?.();}
})().catch(e=>{console.error(e);process.exit(1);});
