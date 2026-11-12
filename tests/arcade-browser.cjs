/* The arcade in a real browser: the cabinets are there, the Blackout Protocol cabinet opens the REAL game page in a frame, the player cannot walk while it is open,
   leaving gives movement back, and the placeholder cabinets say they are not switched on.   SITE_TEST_URL=http://127.0.0.1:5187 node tests/arcade-browser.cjs */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187';
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox']});
 const page=await b.newPage({viewport:{width:1280,height:720},serviceWorkers:'block'});page.setDefaultTimeout(300000);const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.route('https://**/*',r=>r.abort());await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
 await page.addInitScript(()=>localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:'low'})));
 await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started);
 await page.click('[data-action=menu-campaign]');await page.click('[data-action=menu-new]');const c=page.locator('[data-action=menu-new-confirm]');if(await c.count())await c.click();
 await page.waitForSelector('#character-creator.on');await page.waitForFunction(()=>!document.querySelector('[data-cc=confirm]').disabled);await page.locator('[data-cc=confirm]').click();
 await page.waitForFunction(()=>mode==='pod-waking'&&walker&&VoidAssets.pending===0);await page.locator('#pod-wake [data-pod=exit]').click();await page.waitForFunction(()=>mode==='walking');
 const info=await page.evaluate(()=>({cabs:VoidNeoChinatown.arcade.length,playable:VoidNeoChinatown.arcade.filter(c=>c.playable).map(c=>c.game),screens:VoidBabylon.scene.textures.filter(t=>/ncz-arcade-screen-/.test(t.name)).length,carpet:!!VoidBabylon.scene.getMeshByName('arcade-carpet')}));
 assert.equal(info.cabs,5,'a small room: about five games');assert.deepEqual(info.playable,['blackout-protocol']);assert.equal(info.screens,5,'one screen picture per game');assert(info.carpet);
 // walk up to the playable cabinet: the prompt is for that game
 const stand=(lx,lz,yaw)=>page.evaluate(([lx,lz,yaw])=>{const [x,z]=VoidNeoChinatown.toWorld(lx,lz);Object.assign(walker,{x,z,yaw,pitch:0});},[lx,lz,yaw]);
 await stand(-8.6,62,Math.PI/2);await page.waitForTimeout(1200);const cab=await page.evaluate(()=>walkingLocation.interactions.find(i=>i.id==='district-arcade-blackout'));
 assert.equal(cab.label,'PLAY BLACKOUT PROTOCOL');await page.screenshot({path:'/tmp/arcade-cab.png'});
 const before=await page.evaluate(()=>[walker.x,walker.z]);
 await page.evaluate(i=>VoidInteractions.handlers.get('district-arcade')({item:i}),cab);await page.waitForSelector('#arcade-play:not([hidden]) iframe');
 assert.equal(await page.evaluate(()=>mode),'arcade');assert.equal(await page.evaluate(()=>VoidArcade.playing),'blackout-protocol');
 const frame=page.frameLocator('#arcade-play iframe');const src=await page.locator('#arcade-play iframe').getAttribute('src');assert.match(src,/\/blackout-protocol\/index\.html$/,'the real game page');
 await page.waitForFunction(()=>{try{return document.querySelector('#arcade-play iframe').contentDocument?.readyState==='complete'&&/blackout/i.test(document.querySelector('#arcade-play iframe').contentDocument.title+document.querySelector('#arcade-play iframe').contentDocument.body.textContent);}catch{return false;}});
 await page.screenshot({path:'/tmp/arcade-play.png'});
 // walking keys do nothing while playing
 await page.keyboard.down('KeyW');await page.waitForTimeout(700);await page.keyboard.up('KeyW');assert.deepEqual(await page.evaluate(()=>[walker.x,walker.z]),before,'the character stays at the cabinet');
 await page.locator('[data-arcade=leave]').click();await page.waitForFunction(()=>mode==='walking'&&document.getElementById('arcade-play').hidden);
 assert.equal(await page.locator('#arcade-play iframe').count(),0,'the game is unloaded');assert.equal(await page.evaluate(()=>VoidArcade.playing),null);
 // the standalone page is untouched and still loads on its own
 const solo=await b.newPage();const r=await solo.goto(base+'/blackout-protocol/index.html');assert.equal(r.status(),200);await solo.close();
 // a placeholder wall says it is not switched on
 const soon=await page.evaluate(()=>walkingLocation.interactions.find(i=>i.id==='district-arcade-soon-north'));await page.evaluate(i=>VoidInteractions.handlers.get('district-arcade-soon')({item:i}),soon);
 assert.match(await page.evaluate(()=>document.getElementById('notice').textContent),/not switched on yet/);assert.equal(await page.evaluate(()=>mode),'walking');
 assert.deepEqual(errs,[]);console.log(JSON.stringify({ok:true}));await b.close();})().catch(e=>{console.error(String(e.stack||e).slice(0,900));process.exit(1);});
