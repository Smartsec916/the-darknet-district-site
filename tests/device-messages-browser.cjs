/* V1 Messages in a real browser with the V1's own scripts and a MOCKED multiplayer service (no 3D game, no hub): unread badges, reading, rapid messages, closed-V1 receipt,
   duplicate listeners, players list (mute / block / report), private-message stub. The live two-client check is tests/district-chat-browser.cjs.
   Usage: node tests/device-messages-browser.cjs [chromium|firefox] */
const pw=require('playwright'),assert=require('node:assert/strict');
const name=process.argv[2]==='firefox'?'firefox':'chromium',base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187';
(async()=>{
 const browser=await pw[name].launch(name==='chromium'?{args:['--no-sandbox']}:{});const errors=[];
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800},reducedMotion:'reduce'});page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(20000);
  await page.setContent('<!doctype html><meta charset=utf-8><link rel=stylesheet href="'+base+'/void-runner/device-v1.css"><body style="margin:0;background:#050a10"><canvas id=c width=10 height=10></canvas></body>');
  await page.evaluate(()=>{
   window.state={story:{flags:{}},credits:0};window.mode='walking';window.walkingKeys=new Set();window.clearInput=()=>{};window.C={stations:{}};window.walker={};window.walkingLocation={id:'neochinatown',area:'interior'};
   const ls=new Set();window.__calls=[];window.__ign=[];
   window.VoidRemotePlayers={me:'aaaaaaaaaaaa',connected:true,features:{chat:true},peers:[{id:'bbbbbbbbbbbb',name:'Ben_K'},{id:'cccccccccccc',name:'Cy_Z'}],
    onChat(fn){ls.add(fn);return()=>ls.delete(fn);},get listenerCount(){return ls.size;},
    sendChat(t){window.__calls.push(['send',t]);return true;},get ignored(){return window.__ign.map(x=>[...x]);},
    setIgnore(id,m,n){window.__calls.push(['ignore',id,m]);window.__ign=window.__ign.filter(x=>x[0]!==id);if(m)window.__ign.push([id,m,n||'Player']);return true;},
    report(id,reason,note){window.__calls.push(['report',id,reason,note]);return true;}};
   window.__emit=m=>{for(const f of [...ls])f(m);};window.__ls=ls;
  });
  for(const f of ['device-v1.js','district-chat.js','personal-device.js'])await page.addScriptTag({url:base+'/void-runner/'+f});
  const say=(n,who='Ben_K',id='bbbbbbbbbbbb')=>page.evaluate(([n,who,id])=>{for(let i=0;i<n;i++)window.__emit({t:'chat',id,name:who,text:'msg '+Math.random().toString(36).slice(2)+i,at:Date.now()+i});},[n,who,id]);
  const settled=()=>page.waitForFunction(()=>!VoidPersonalDevice.busy);
  await page.waitForFunction(()=>window.VoidDistrictChat?.hubListener);
  assert.equal(await page.evaluate(()=>window.__ls.size),1,'one multiplayer listener');
  // the V1 chip exists while the device is closed (frame() builds it); wait for it
  await page.waitForSelector('#pd-chip',{state:'attached'});
  // 1. messages arrive while the V1 is closed: kept and counted on the chip; own messages are not
  await say(3);await page.evaluate(()=>window.__emit({t:'chat',id:'aaaaaaaaaaaa',name:'Me',text:'my own words',at:Date.now()}));
  assert.equal(await page.evaluate(()=>VoidDistrictChat.unread),3);assert.match(await page.textContent('#pd-chip'),/V1 · L · 3 NEW/);assert.match(await page.getAttribute('#pd-chip','aria-label'),/3 unread messages/);
  // 2. opening the V1 shows the count on the Messages tile; opening other apps keeps it
  await page.evaluate(()=>VoidPersonalDevice.open());await page.waitForSelector('#personal-device.open');await settled();
  assert.equal(await page.textContent('[data-app=messages] .pd-badge'),'3');assert.equal(await page.isVisible('[data-app=messages] .pd-badge'),true);
  await page.click('[data-app=settings]');await settled();await page.click('[data-do=back]');await settled();assert.equal(await page.textContent('[data-app=messages] .pd-badge'),'3','count survives other apps');
  await say(2);assert.equal(await page.textContent('[data-app=messages] .pd-badge'),'5','new arrivals while on home update the tile');
  await page.screenshot({path:(process.env.SHOTS||'/tmp')+'/dd-messages-tile-badge.png'});
  // 3. opening the chat reads everything: tab badge gone, NEW marker before the unread lines, history in order
  await page.click('[data-app=messages]');await settled();
  assert.equal(await page.evaluate(()=>VoidDistrictChat.unread),0);assert.equal(await page.locator('.pd-newline').count(),1);
  const order=await page.evaluate(()=>[...document.querySelectorAll('.pd-chatlog .pd-msg,.pd-chatlog .pd-newline')].map(e=>e.className.replace('pd-','')));assert.equal(order[0],'newline','the NEW marker comes first (nothing was read before)');
  assert.equal(await page.locator('.pd-chatlog .pd-msg').count(),6,'5 from others + my own line');assert.equal(await page.locator('.pd-chatlog .pd-msg.me').count(),1);
  assert.match(await page.textContent('.pd-chatlog .pd-msg-h time'),/\d/,'timestamps shown');assert.match(await page.textContent('.pd-chatlog .pd-msg-h'),/Ben_K/);
  // 4. live arrival while viewing: appended in place, still read, typing is not disturbed
  await page.fill('[data-chatform] input','half typed');await say(1,'Cy_Z','cccccccccccc');
  assert.equal(await page.locator('.pd-chatlog .pd-msg').count(),7);assert.equal(await page.inputValue('[data-chatform] input'),'half typed','typed text survives a new message');assert.equal(await page.evaluate(()=>VoidDistrictChat.unread),0);
  // 5. sending: SEND and Enter; a slash command is never sent as chat; /players opens the list
  await page.press('[data-chatform] input','Enter');assert.deepEqual(await page.evaluate(()=>window.__calls.filter(c=>c[0]==='send')),[['send','half typed']]);assert.equal(await page.inputValue('[data-chatform] input'),'');
  await page.fill('[data-chatform] input','/players');await page.click('[data-chatform] button[type=submit]');await settled();assert.equal(await page.evaluate(()=>VoidPersonalDevice.sub),'players');assert.ok(!(await page.evaluate(()=>window.__calls)).some(c=>c[1]==='/players'));
  // 6. players: mute / unmute / block / report; honest report wording
  assert.equal(await page.locator('.pd-main .pd-card h3').count(),2);
  await page.click('[data-ig=mute][data-id=bbbbbbbbbbbb]');assert.match(await page.textContent('.pd-main'),/\[MUTE\]/);await page.click('[data-ig=unmute][data-id=bbbbbbbbbbbb]');
  await page.click('[data-ig=block][data-id=cccccccccccc]');assert.match(await page.textContent('.pd-main'),/\[BLOCK\]/);
  await page.click('[data-rep-open=bbbbbbbbbbbb]');await page.selectOption('.pd-report select','spam');await page.fill('.pd-report input','bot');await page.click('[data-rep-send=bbbbbbbbbbbb]');
  assert.deepEqual((await page.evaluate(()=>window.__calls)).filter(c=>c[0]==='report'),[['report','bbbbbbbbbbbb','spam','bot']]);
  assert.match(await page.textContent('.pd-main'),/not kept as a permanent case file/);assert.doesNotMatch(await page.textContent('.pd-main'),/A human reads these/);
  await page.evaluate(()=>window.__emit({t:'reported'}));assert.match(await page.textContent('.pd-main'),/Report sent to the District server log/);
  await page.screenshot({path:(process.env.SHOTS||'/tmp')+'/dd-messages-players.png'});
  // 7. private messages: honest stub, no fake feature
  await page.click('[data-sub=dm]');await settled();assert.match(await page.textContent('.pd-main'),/Not available yet[\s\S]*not been built or approved/);assert.equal(await page.locator('.pd-main input').count(),0);
  // 8. close the V1, messages keep arriving and are counted; reopening shows them with a NEW marker; closing did not disconnect
  await page.click('[data-sub=chat]');await settled();await page.evaluate(()=>VoidPersonalDevice.close());await say(4);
  assert.equal(await page.evaluate(()=>VoidDistrictChat.unread),4);assert.match(await page.textContent('#pd-chip'),/4 NEW/);assert.equal(await page.evaluate(()=>VoidRemotePlayers.connected),true);
  await page.evaluate(()=>VoidPersonalDevice.open());await settled();await page.waitForSelector('[data-app=messages] .pd-badge:not([hidden])');assert.equal(await page.textContent('[data-app=messages] .pd-badge'),'4');
  await page.click('[data-app=messages]');await settled();assert.equal(await page.locator('.pd-newline').count(),1);const idx=await page.evaluate(()=>[...document.querySelectorAll('.pd-chatlog .pd-msg,.pd-chatlog .pd-newline')].findIndex(e=>e.classList.contains('pd-newline')));
  assert.equal(await page.locator('.pd-chatlog .pd-msg').count(),11);assert.equal(idx,7,'NEW sits before the 4 lines that arrived while closed (after the 7 already read)');
  await page.screenshot({path:(process.env.SHOTS||'/tmp')+'/dd-messages-chat.png'});
  // 9. rapid messages: 200 in a burst while viewing and while closed: counts exact, order kept, no stall
  await page.evaluate(()=>VoidPersonalDevice.close());await say(200);assert.equal(await page.evaluate(()=>VoidDistrictChat.unread),200);assert.match(await page.textContent('#pd-chip'),/99\+ NEW/);
  // 10. Enter-style jump: openApp goes straight to the chat with the box focused
  await page.evaluate(()=>VoidPersonalDevice.openApp('messages','chat',{focus:true}));await settled();await page.waitForFunction(()=>document.activeElement?.closest?.('[data-chatform]'));
  assert.equal(await page.evaluate(()=>VoidDistrictChat.unread),0);
  // 11. a registered account is still required: without it the box is disabled and says why
  await page.evaluate(()=>{VoidRemotePlayers.features.chat=false;});await page.evaluate(()=>VoidPersonalDevice.close());await page.evaluate(()=>VoidPersonalDevice.open());await settled();await page.click('[data-app=messages]');await settled();
  assert.equal(await page.locator('[data-chatform] input[disabled]').count(),1);assert.match(await page.getAttribute('[data-chatform] input','placeholder'),/registered account/);
  // 12. one listener throughout
  assert.equal(await page.evaluate(()=>window.__ls.size),1);
  console.log(JSON.stringify({browser:name,version:browser.version(),errors}));assert.deepEqual(errors,[]);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
