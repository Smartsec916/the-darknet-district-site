/* KEYMAP overlay in a real browser with the game's own input.js, keymap.js, V1 and stylesheets (no 3D). The first-pod-exit trigger in the real game is tests/keymap-game-browser.cjs.
   Usage: node tests/keymap-browser.cjs [chromium|firefox]   SHOTS=dir for screenshots */
const pw=require('playwright'),assert=require('node:assert/strict');
const name=process.argv[2]==='firefox'?'firefox':'chromium',base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',shots=process.env.SHOTS||'/tmp';
const PAGE='<!doctype html><meta charset=utf-8><link rel=stylesheet href="'+base+'/void-runner/device-v1.css"><link rel=stylesheet href="'+base+'/void-runner/keymap.css"><body style="margin:0;background:#06101a"><canvas id=c width=10 height=10></canvas><input id=typebox type=text style="position:fixed;left:5px;bottom:5px"></body>';
async function boot(browser,{saved,viewport={width:1280,height:720}}={}){
 const page=await browser.newPage({viewport});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route(base+'/__km',r=>r.fulfill({contentType:'text/html',body:PAGE}));await page.goto(base+'/__km');   // a real origin, so localStorage works
 await page.evaluate(s=>{if(s)localStorage.setItem('void-runner-controls-v1',JSON.stringify(s));else localStorage.removeItem('void-runner-controls-v1');
  window.state={story:{flags:{}},credits:0,progression:{personal:{weapon:'ward-pistol'}}};window.mode='walking';window.walkingKeys=new Set();window.clearInput=()=>{};window.C={stations:{}};window.walker={};window.walkingLocation={id:'neochinatown',area:'interior'};window.__saves=0;window.openMissionLog=function(){};addEventListener('keydown',e=>{if(e.code===(VoidInput?.bindings?.missionLog||'KeyL')&&!/INPUT/.test(e.target.tagName))openMissionLog();});   // what world-integration.js does for the L key
  window.save=()=>{window.__saves++;};},saved);
 for(const f of ['input.js','device-v1.js','personal-device.js','keymap.js'])await page.addScriptTag({url:base+'/void-runner/'+f});
 return {page,errors};
}
(async()=>{
 const browser=await pw[name].launch(name==='chromium'?{args:['--no-sandbox']}:{});const report={browser:name,version:browser.version()};
 try{
  let {page,errors}=await boot(browser);
  const vis=()=>page.evaluate(()=>!!document.getElementById('keymap')&&!document.getElementById('keymap').hidden);
  // 1. nothing shows by itself; K opens it with the exact hint; K hides it; K shows it again
  assert.equal(await vis(),false);await page.keyboard.press('KeyK');assert.equal(await vis(),true);
  assert.equal(await page.textContent('#keymap .km-hint'),'To hide the KeyMap Press K');
  assert.equal(await page.evaluate(()=>state.story.flags.keymapSeen),true,'opening it counts as seen (saved with the game)');assert.ok(await page.evaluate(()=>__saves)>=1);
  await page.waitForTimeout(500);await page.screenshot({path:shots+'/dd-keymap-walking.png'});
  const walk=await page.evaluate(()=>[...document.querySelectorAll('#keymap .km-key')].map(k=>k.querySelector('.km-cap').textContent+':'+k.querySelector('.km-act').textContent));
  for(const e of ['W:Forward','A:Left','S:Back','D:Right','Space:Jump','E:Use','R:Reload','B:Camera','G:Taxi','L:V1 device','K:KeyMap','P:Terminal','Esc:Pause'])assert.ok(walk.includes(e),e+' in '+walk.join(' '));
  // the mouse map: a drawn mouse; with a weapon every part has a job on foot
  const parts=()=>page.evaluate(()=>Object.fromEntries([...document.querySelectorAll('#keymap .km-mouse-map svg [data-part]')].map(p=>[p.dataset.part,p.classList.contains('on')])));
  const labels=()=>page.evaluate(()=>Object.fromEntries([...document.querySelectorAll('#keymap .km-ml')].map(l=>[l.dataset.part,l.querySelector('span').textContent])));
  assert.deepEqual(await parts(),{left:true,right:true,move:true,wheel:true});assert.equal((await labels()).right,'Aim');assert.equal((await labels()).wheel,'Change weapon');assert.equal((await labels()).move,'Look around');
  assert.deepEqual(await page.evaluate(()=>[...document.querySelectorAll('#keymap .km-tabs button')].map(b=>b.textContent)),['ON FOOT','CAMERA','SLEEPING POD','FLIGHT']);
  // a player with no weapon: the weapon keys and the right button / wheel are not offered
  await page.evaluate(()=>{state.progression.personal.weapon=null;});await page.keyboard.press('KeyK');await page.keyboard.press('KeyK');
  const bare=await page.evaluate(()=>[...document.querySelectorAll('#keymap .km-key')].map(k=>k.querySelector('.km-cap').textContent+':'+k.querySelector('.km-act').textContent));assert.ok(!bare.some(x=>/Reload|holster|Rifle/.test(x)),bare.join(' '));
  assert.deepEqual(await parts(),{left:true,right:false,move:true,wheel:false});assert.equal((await labels()).right,undefined);await page.screenshot({path:shots+'/dd-keymap-walking-unarmed.png'});
  // the camera raised: its own layout (left click photo, wheel zoom, F follow), shown by itself
  await page.evaluate(()=>{window.VoidDeviceCamera={active:true};});await page.waitForFunction(()=>VoidKeyMapUI.context==='camera');await page.waitForTimeout(300);
  const cam=await page.evaluate(()=>[...document.querySelectorAll('#keymap .km-key')].map(k=>k.querySelector('.km-cap').textContent+':'+k.querySelector('.km-act').textContent));assert.ok(cam.includes('F:Follow person')&&cam.includes('B:Camera away'),cam.join(' '));
  assert.equal((await labels()).left,'Take a photo');assert.equal((await labels()).wheel,'Zoom in / out');await page.screenshot({path:shots+'/dd-keymap-camera.png'});
  await page.evaluate(()=>{window.VoidDeviceCamera={active:false};state.progression.personal.weapon='ward-pistol';});await page.waitForFunction(()=>VoidKeyMapUI.context==='walking');
  // the Sleeping Pod tab
  await page.click('#keymap [data-ctx=pod]');const pod=await page.evaluate(()=>[...document.querySelectorAll('#keymap .km-key')].map(k=>k.querySelector('.km-cap').textContent+':'+k.querySelector('.km-act').textContent));
  for(const e of ['E:Exit pod','M:Music & lights','V:Vending','Q:Look at controls'])assert.ok(pod.includes(e),e+' in '+pod.join(' '));assert.equal(pod.length,8);await page.screenshot({path:shots+'/dd-keymap-pod.png'});
  await page.click('#keymap [data-ctx=walking]');await page.keyboard.press('KeyK');await page.evaluate(()=>location.reload());await page.waitForLoadState();await page.close();({page,errors}=await boot(browser));await page.keyboard.press('KeyK');
  assert.ok(!walk.some(x=>/^(Z|Q|J|M|N):/.test(x)),'unused keys are not drawn');report.walkingKeys=walk.length;
  await page.keyboard.press('KeyK');assert.equal(await vis(),false);await page.keyboard.press('KeyK');assert.equal(await vis(),true);
  // 2. the visible close control works
  await page.click('#keymap [data-km=close]');assert.equal(await vis(),false);assert.match(await page.textContent('#keymap .km-close'),/CLOSE · K/);
  // 3. gameplay input is untouched: movement keys still reach the game while it is open, and typing in a text box never toggles it
  await page.keyboard.press('KeyK');await page.evaluate(()=>{window.__w=[];addEventListener('keydown',e=>window.__w.push(e.code));});await page.keyboard.press('KeyW');assert.ok((await page.evaluate(()=>__w)).includes('KeyW'),'keys still reach the game');
  await page.keyboard.press('KeyK');await page.focus('#typebox');await page.keyboard.type('kkk');assert.equal(await page.inputValue('#typebox'),'kkk');assert.equal(await vis(),false,'typing a K in a text box does not toggle it');await page.evaluate(()=>document.getElementById('typebox').blur());
  // 4. interaction with the V1: opening the V1 hides it and K does nothing inside the V1; after closing, K works again
  await page.keyboard.press('KeyK');assert.equal(await vis(),true);await page.keyboard.press('KeyL');await page.waitForSelector('#personal-device.open');await page.waitForTimeout(400);assert.equal(await vis(),false,'the V1 takes the screen');
  await page.keyboard.press('KeyK');assert.equal(await vis(),false,'K is not a KeyMap key while the V1 is open');await page.keyboard.press('KeyL');await page.waitForFunction(()=>!VoidPersonalDevice.isOpen);await page.keyboard.press('KeyK');assert.equal(await vis(),true);
  // 5. other modes: the menu and the character creator hide it; K does nothing there
  await page.evaluate(()=>{window.mode='menu';});await page.waitForTimeout(500);assert.equal(await vis(),false);await page.keyboard.press('KeyK');assert.equal(await vis(),false,'no KeyMap over the menu');
  await page.evaluate(()=>{window.mode='walking';});
  // 6. flight has its own layout, with the player's own bindings
  await page.evaluate(()=>{window.mode='play';});await page.keyboard.press('KeyK');await page.waitForTimeout(500);assert.equal(await vis(),true);
  assert.equal(await page.evaluate(()=>VoidKeyMapUI.context),'flight');const fl=await page.evaluate(()=>[...document.querySelectorAll('#keymap .km-key')].map(k=>k.querySelector('.km-cap').textContent+':'+k.querySelector('.km-act').textContent));
  for(const e of ['Space:Fire','F:Missile','Tab:Next','K:KeyMap'])assert.ok(fl.includes(e),e);assert.ok(!fl.some(x=>/Jump|Inventory/.test(x)),'no on-foot actions in flight');await page.screenshot({path:shots+'/dd-keymap-flight.png'});
  await page.click('#keymap [data-ctx=walking]');assert.equal(await page.evaluate(()=>VoidKeyMapUI.context),'walking','the tabs switch layouts');
  await page.evaluate(()=>{window.mode='walking';});
  // 7. readable at other sizes
  for(const vp of [{width:1024,height:600},{width:1920,height:1080},{width:1366,height:768}]){await page.setViewportSize(vp);await page.waitForTimeout(400);
   const m=await page.evaluate(()=>{const r=document.getElementById('keymap').getBoundingClientRect();return {l:r.left,r:r.right,t:r.top,b:r.bottom,w:innerWidth,h:innerHeight,sw:document.getElementById('keymap').scrollWidth,cw:document.getElementById('keymap').clientWidth};});
   assert.ok(m.l>=0&&m.r<=m.w&&m.t>=0&&m.b<=m.h,'fits in '+vp.width+'x'+vp.height+': '+JSON.stringify(m));assert.ok(m.sw<=m.cw+1,'no horizontal overflow '+vp.width);
   if(vp.height>=720)for(const ctx of ['walking','camera','pod','flight']){await page.click('#keymap [data-ctx='+ctx+']');const s=await page.evaluate(()=>{const k=document.getElementById('keymap'),mm=k.querySelector('.km-mouse-map').getBoundingClientRect();return {sh:k.scrollHeight,ch:k.clientHeight,sw:k.scrollWidth,cw:k.clientWidth,mouse:mm.width>200&&mm.height>120};});
    assert.ok(s.sh<=s.ch+1&&s.sw<=s.cw+1,ctx+' needs no scrolling at '+vp.width+'x'+vp.height+': '+JSON.stringify(s));assert.ok(s.mouse,'the mouse map is drawn');await page.screenshot({path:shots+'/dd-keymap-'+ctx+'-'+vp.width+'x'+vp.height+'.png'});}
   await page.click('#keymap [data-ctx=walking]');
   await page.screenshot({path:shots+'/dd-keymap-'+vp.width+'x'+vp.height+'.png'});}
  assert.deepEqual(errors,[]);await page.close();
  // 8. saved controls: a player who put Mission log on K keeps it there; the KeyMap takes J and says so
  ({page,errors}=await boot(browser,{saved:{pitchUp:'KeyW',pitchDown:'KeyS',yawLeft:'KeyA',yawRight:'KeyD',rollLeft:'KeyQ',rollRight:'KeyR',throttleUp:'ShiftLeft',throttleDown:'KeyX',boost:'KeyE',fire:'Space',missile:'KeyF',nearest:'KeyT',next:'Tab',previous:'KeyG',clear:'KeyC',lock:'KeyB',missionLog:'KeyK',personalHud:'KeyP',pause:'Escape'}}));
  assert.equal(await page.evaluate(()=>VoidInput.bindings.missionLog),'KeyK');assert.equal(await page.evaluate(()=>VoidInput.bindings.keymap),'KeyJ');
  await page.keyboard.press('KeyK');await page.waitForTimeout(300);assert.equal(await vis(),false,'K is still the player\'s Mission log key, not the KeyMap');assert.equal(await page.evaluate(()=>VoidPersonalDevice.isOpen),true,'K still opens the V1 for this player');await page.evaluate(()=>VoidPersonalDevice.close());
  await page.keyboard.press('KeyJ');assert.equal(await vis(),true);assert.equal(await page.textContent('#keymap .km-hint'),'To hide the KeyMap Press J');
  const cust=await page.evaluate(()=>[...document.querySelectorAll('#keymap .km-key')].map(k=>k.querySelector('.km-cap').textContent+':'+k.querySelector('.km-act').textContent));assert.ok(cust.includes('K:V1 device')&&cust.includes('J:KeyMap'),cust.join(' '));
  await page.screenshot({path:shots+'/dd-keymap-custom.png'});assert.deepEqual(errors,[]);await page.close();
  console.log(JSON.stringify(report));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
