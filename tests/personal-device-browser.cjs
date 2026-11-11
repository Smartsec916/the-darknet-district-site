/* V1 personal device in the real District (software GL). Usage: node tests/personal-device-browser.cjs [low|high] */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const tier=process.argv[2]==='high'?'high':'low',base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',shot=process.env.SHOTS||'/tmp';
(async()=>{
 const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox']});const errors=[];
 try{
  const page=await browser.newPage({viewport:{width:1400,height:800},reducedMotion:'no-preference',serviceWorkers:'block'});page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push('console: '+m.text());});
  page.setDefaultTimeout(120000);
  await page.route('https://**/*',r=>r.abort());await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
  await page.addInitScript(q=>localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:q})),tier);await page.goto(base+'/void-runner.html');
  await page.waitForFunction(()=>window.VoidStartup?.started,null,{timeout:120000});
  await page.click('[data-action=menu-campaign]');await page.click('[data-action=menu-new]');const c=page.locator('[data-action=menu-new-confirm]');if(await c.count())await c.click();
  // new campaigns create a character first (first-player repair): confirm it so the player has a saved look
  await page.waitForSelector('#character-creator.on');await page.waitForFunction(()=>!document.querySelector('[data-cc=confirm]').disabled);await page.locator('[data-cc=confirm]').click();
  await page.waitForFunction(()=>mode==='pod-waking'&&walker);await page.locator('#pod-wake button').click();
  await page.waitForFunction(()=>mode==='walking'&&walker&&VoidAssets.pending===0);await page.waitForTimeout(1500);
  const pos=()=>page.evaluate(()=>({x:walker.x,z:walker.z,yaw:walker.yaw,keys:[...walkingKeys],mode,frame:VoidBabylon.scene.getFrameId()}));
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  const open=()=>page.evaluate(()=>VoidPersonalDevice.isOpen);
  const before=await page.evaluate(()=>({credits:state.credits,loc:state.location,inv:JSON.stringify(state.inventory||null),missions:JSON.stringify(state.universe?.trackedMission||null)}));
  assert.equal(await page.locator('#pd-chip').isVisible(),true,'a discoverable V1 chip is shown on foot');
  // 1. L opens and closes the device; the game does not change mode and keeps running
  await page.keyboard.press('KeyL');await page.waitForSelector('#personal-device.open');
  let p=await pos();assert.equal(p.mode,'walking','the world is not paused');
  const f0=p.frame;await page.waitForTimeout(800);assert((await pos()).frame>f0,'the world keeps rendering');
  const w=await page.evaluate(()=>{const r=document.getElementById('personal-device').getBoundingClientRect();return {w:r.width,vw:innerWidth,right:r.right};});assert(Math.abs(w.w/w.vw-.5)<.06,'about half of the screen: '+JSON.stringify(w));
  await page.screenshot({path:shot+'/dd-device-home-'+tier+'.png'});
  await page.keyboard.press('KeyL');await page.waitForFunction(()=>!VoidPersonalDevice.isOpen);
  // 2. Holding W, then opening: no movement while open, nothing resumes by itself afterwards
  await page.keyboard.down('KeyW');await page.waitForTimeout(500);const moved=await pos();await page.keyboard.press('KeyL');await page.waitForSelector('#personal-device.open');
  const a=await pos();assert.deepEqual(a.keys,[],'held movement keys are released');await page.waitForTimeout(900);const b=await pos();assert(dist(a,b)<.05,'no movement while the device is open (W still held)');
  await page.keyboard.up('KeyW');await page.keyboard.press('KeyL');await page.waitForFunction(()=>!VoidPersonalDevice.isOpen);await page.waitForTimeout(700);const c2=await pos();assert(dist(b,c2)<.05,'nothing resumes after closing');
  await page.keyboard.down('KeyW');await page.waitForTimeout(700);await page.keyboard.up('KeyW');assert(dist(c2,await pos())>.2,'a fresh key press moves again');
  // 3. W held ACROSS the device: open, close while still holding: stays still until released and pressed again
  await page.keyboard.down('KeyW');await page.waitForTimeout(300);await page.keyboard.press('KeyL');await page.waitForSelector('#personal-device.open');await page.keyboard.press('KeyL');await page.waitForFunction(()=>!VoidPersonalDevice.isOpen);
  const d1=await pos();await page.waitForTimeout(900);assert(dist(d1,await pos())<.05,'a key held through the device does not resume movement');
  await page.keyboard.up('KeyW');await page.keyboard.down('KeyW');await page.waitForTimeout(600);await page.keyboard.up('KeyW');assert(dist(d1,await pos())>.15,'pressed again: moves');
  // 4. Text entry never moves or closes anything
  await page.keyboard.press('KeyL');await page.waitForSelector('#personal-device.open');
  await page.evaluate(()=>{const i=document.createElement('input');i.type='text';i.id='pd-test-input';document.querySelector('#personal-device .pd-main').appendChild(i);i.focus();});
  const t0=await pos();await page.keyboard.type('wasd lel e');await page.waitForTimeout(500);const t1=await pos();assert(dist(t0,t1)<.05,'typing does not move the character');
  assert.equal(await page.inputValue('#pd-test-input'),'wasd lel e');assert.equal(await open(),true,'typing L does not close the device');await page.evaluate(()=>document.getElementById('pd-test-input').remove());
  // 5. Expand and collapse
  await page.click('[data-do=expand]');let r=await page.evaluate(()=>document.getElementById('personal-device').getBoundingClientRect().width/innerWidth);assert(r>.9,'expanded: '+r);
  await page.click('[data-do=expand]');r=await page.evaluate(()=>document.getElementById('personal-device').getBoundingClientRect().width/innerWidth);assert(Math.abs(r-.5)<.06,'collapsed: '+r);
  // 6. Navigation, back, Esc; Mission Log with no missions; the old pistol text is gone
  await page.click('[data-app=missions]');assert.match(await page.textContent('#personal-device .pd-main'),/No active missions/);assert.doesNotMatch(await page.textContent('#personal-device'),/pistol|Mara gives/i);
  await page.keyboard.press('Escape');assert.equal(await page.textContent('#personal-device .pd-title'),'HOME');assert.equal(await open(),true,'Esc in an app goes back, it does not close');
  // 7. Camera and Gallery are placeholders; App Store lists installed apps and no purchases
  await page.click('[data-app=camera]');assert.match(await page.textContent('#personal-device .pd-main'),/Not available in the V1/);assert.equal(await page.locator('#personal-device .pd-main button').count(),0);await page.click('[data-do=back]');
  await page.click('[data-app=gallery]');assert.match(await page.textContent('#personal-device .pd-main'),/No photos/);await page.click('[data-do=back]');
  await page.click('[data-app=store]');const store=await page.textContent('#personal-device .pd-main');assert.match(store,/No additional apps are available yet/);assert.doesNotMatch(store,/price|\$|credits|buy/i);await page.click('[data-do=back]');
  await page.click('[data-app=news]');assert.match(await page.textContent('#personal-device .pd-main'),/No news received yet/);await page.click('[data-do=back]');
  await page.click('[data-app=messages]');assert.match(await page.textContent('#personal-device .pd-main'),/not connected|No chat yet/i);await page.click('[data-sub=dm]');assert.match(await page.textContent('#personal-device .pd-main'),/not available yet/);await page.click('[data-do=back]');
  // 8. Social: my own profile uses my real saved look (a portrait is drawn from the character), NPCs without a model say unavailable
  await page.evaluate(()=>{state.story.met=[...(state.story.met||[]),'rook'];});
  await page.click('[data-app=social]');
  await page.waitForFunction(()=>{const i=document.querySelector('#personal-device img.pd-portrait');return i&&/^data:image\/jpeg;base64,/.test(i.src);},null,{timeout:240000});
  const social=await page.evaluate(()=>({imgs:[...document.querySelectorAll('#personal-device img.pd-portrait')].map(i=>({key:i.dataset.pk,len:i.src.length})),sil:document.querySelectorAll('#personal-device .pd-sil').length,text:document.querySelector('#personal-device .pd-main').textContent}));
  assert(social.imgs.length>=1&&social.imgs[0].len>2000,'a real picture was drawn');assert(social.sil>=1,'the NPC without a model shows the unavailable state');assert.match(social.text,/PORTRAIT UNAVAILABLE/);assert.doesNotMatch(social.text,/@[^ ]*\.[a-z]{2,}|uid|token/i);
  await page.screenshot({path:shot+'/dd-device-social-'+tier+'.png'});
  const firstUrl=await page.evaluate(()=>document.querySelector('#personal-device img.pd-portrait').src),firstKey=social.imgs[0].key;
  // 9. Changing the look changes the portrait (new key, new picture); the old picture is not reused
  await page.evaluate(()=>{const A=VoidCharacterAppearance,a=VoidCharacterCreator.stored();const b={...a,hair:a.hair==='bob01'?'short02':'bob01',hairColor:'magenta'};A.save(localStorage,VoidAccount?.user?.uid||'guest',A.validate(b)?b:{...a,hairColor:'magenta'});});
  await page.click('[data-do=back]');await page.click('[data-app=social]');
  await page.waitForFunction(k=>{const i=document.querySelector('#personal-device img.pd-portrait');return i&&i.dataset.pk!==k&&/^data:image\/jpeg/.test(i.src);},firstKey,{timeout:240000});
  const second=await page.evaluate(()=>({key:document.querySelector('#personal-device img.pd-portrait').dataset.pk,url:document.querySelector('#personal-device img.pd-portrait').src}));
  assert.notEqual(second.key,firstKey);assert.notEqual(second.url,firstUrl,'the portrait follows the new look');
  const stored=await page.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('void-runner-portraits-v1')||'{}')));assert(!stored.includes(firstKey),'the outdated picture of this character was dropped from the cache');
  // 10. Map: only explored places; walking to the bar reveals it; the save records exploration
  await page.click('[data-do=back]');await page.click('[data-app=map]');await page.waitForSelector('canvas[data-map]');
  const nearby=await page.evaluate(()=>document.querySelectorAll('#personal-device [data-places] .pd-line').length);
  const total=await page.evaluate(()=>walkingLocation.interactions.length);assert(nearby<total,'not every place is shown at the start: '+nearby+' of '+total);
  await page.keyboard.press('KeyL');await page.waitForFunction(()=>!VoidPersonalDevice.isOpen);
  await page.evaluate(()=>{const i=walkingLocation.interactions.find(x=>x.id==='district-bar');walker.x=i.position[0];walker.z=i.position[2]+(i.position[2]<-100?3:-3);});await page.waitForTimeout(2500);
  await page.keyboard.press('KeyL');await page.waitForSelector('#personal-device.open');await page.click('[data-app=map]');
  const found=await page.evaluate(()=>document.querySelector('#personal-device [data-places]').textContent);assert.match(found,/bartender/i,'the bar is now on the map');
  const flags=await page.evaluate(()=>({m:state.story.flags.deviceMapInterior,model:state.story.flags.deviceModel}));assert.ok(flags.m&&/^[0-9a-f]+$/.test(flags.m));assert.equal(flags.model,'v1');
  await page.screenshot({path:shot+'/dd-device-map-'+tier+'.png'});
  // 11. Settings persist in the save
  await page.click('[data-do=back]');await page.click('[data-app=settings]');await page.click('[data-set=motion][data-value=reduced]');
  assert.match(await page.evaluate(()=>state.story.flags.deviceSettings),/motion=reduced/);
  // 12. Looking around outside the device works; dragging inside it does not turn the camera
  await page.click('[data-do=back]');const y0=(await pos()).yaw;await page.mouse.move(300,400);await page.mouse.down();await page.mouse.move(420,400,{steps:5});await page.mouse.up();const y1=(await pos()).yaw;assert(Math.abs(y1-y0)>.02,'drag outside the device turns the view');
  await page.mouse.move(1000,400);await page.mouse.down();await page.mouse.move(1150,420,{steps:5});await page.mouse.up();assert(Math.abs((await pos()).yaw-y1)<.001,'dragging inside the device does not turn the view');
  // 13. Esc at home closes; save/resume keeps the device state; nothing else in the game changed
  await page.keyboard.press('Escape');await page.waitForFunction(()=>!VoidPersonalDevice.isOpen);
  const saved=await page.evaluate(()=>{save();const s=JSON.parse(localStorage.getItem('void-runner-campaign-v1')).story.flags;return {model:s.deviceModel,set:s.deviceSettings,map:s.deviceMapInterior,epoch:s.campaignEpoch};});assert.equal(saved.model,'v1');assert.match(saved.set,/motion=reduced/);assert.ok(saved.epoch);
  const after=await page.evaluate(()=>({credits:state.credits,loc:state.location,inv:JSON.stringify(state.inventory||null),missions:JSON.stringify(state.universe?.trackedMission||null)}));assert.deepEqual(after,before);
  console.log(JSON.stringify({tier,errors}));assert.deepEqual(errors,[]);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
