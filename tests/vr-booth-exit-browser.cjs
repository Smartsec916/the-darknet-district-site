/* The VR play area (the owner, 17 Nov 2026): "When you enter the VR Play area after selecting a room the NPC that was in the play area is pushed to the far corner
   for a moment. Can you have that NPC exit the play area out the front". In a real browser: the booth's player walks (a real walk clip) out through the gap at
   the end of the glass, across the viewing strip and out of the room's door, never into the booth's far corner, and is hidden once out of sight; entering a real
   simulation starts that walk; coming back, they are at their rig again.
   SITE_TEST_URL=http://127.0.0.1:5187 node tests/vr-booth-exit-browser.cjs   BROWSER_EXECUTABLE=/path/to/chrome uses that browser; SHOTS=dir saves before/after pictures. */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',shots=process.env.SHOTS||'';
(async()=>{const b=await chromium.launch({...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{}),args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox']});
 const page=await b.newPage({viewport:{width:1366,height:768},serviceWorkers:'block'});page.setDefaultTimeout(300000);const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.route('https://**/*',r=>r.abort());await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
 await page.addInitScript(()=>localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:'low'})));
 await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started);
 await page.click('[data-action=menu-campaign]');await page.click('[data-action=menu-new]');const c=page.locator('[data-action=menu-new-confirm]');if(await c.count())await c.click();
 await page.waitForSelector('#character-creator.on');await page.waitForFunction(()=>!document.querySelector('[data-cc=confirm]').disabled);await page.locator('[data-cc=confirm]').click();
 await page.waitForFunction(()=>mode==='pod-waking'&&walker&&VoidAssets.pending===0);await page.waitForSelector('#pod-wake:not([hidden])');await page.keyboard.press('KeyE');await page.waitForFunction(()=>mode==='walking');
 if(shots)await page.addStyleTag({content:'#keymap{display:none!important}'});   // the first-visit KEYMAP would cover the pictures
 const where=i=>page.evaluate(i=>VoidNeoChinatown.booths.where(i),i);
 await page.waitForFunction(()=>VoidNeoChinatown.booths?.where(0)&&VoidNeoChinatown.booths.where(1),null,{timeout:120000});
 // Stand on the viewing strip by the terminal, looking at the booths and the gaps at the ends of the glass.
 const watch=(lx,lz,tx,tz)=>page.evaluate(([lx,lz,tx,tz])=>{const n=VoidNeoChinatown,[x,z]=n.toWorld(lx,lz),[ax,az]=n.toWorld(tx,tz);walker.x=x;walker.z=z;walker.yaw=Math.atan2(ax-x,az-z);walker.pitch=.12;},[lx,lz,tx,tz]);
 // The far corners the players used to be pushed into ([-15.6, 29.8] and [-15.6, 42.2]): nowhere near the booth's back half.
 const farCorner=p=>p.x<-14;
 const has=await page.evaluate(()=>[VoidCrowd.clips['vr-player-a'].includes('walk'),VoidCrowd.clips['vr-player-b'].includes('walk')]);assert.deepEqual(has,[true,true],'both booth players carry a walk clip');
 for(const i of [0,1]){
  const home=await where(i);assert.ok(Math.abs(home.x+12.6)<.05&&home.shown&&!home.leaving,'at the rig: '+JSON.stringify(home));
  await (i?watch(-4.2,30.4,-9,42):watch(-4.6,40.6,-9,29.5));await page.waitForTimeout(600);if(shots)await page.screenshot({path:shots+'/booth'+i+'-before.png'});
  assert.equal(await page.evaluate(i=>VoidNeoChinatown.booths.stepAside(i),i),true);
  const walk=await page.evaluate(i=>{const n=VoidBabylon.scene.animationGroups.filter(g=>g.isPlaying&&/walk/.test(g.name));return n.map(g=>g.name);},i);assert.ok(walk.length>=1,'a walk clip plays: '+walk);
  const path=[];let shot=false;
  for(const t0=Date.now();Date.now()-t0<900000;){const p=await where(i);path.push(p);assert.ok(!farCorner(p),'never in the far corner: '+JSON.stringify(p));if(p.gone)break;
  // then look at the floor: a software renderer draws the whole room at a few frames a second, and each frame moves the walk at most 0.1 s.
   if(!shot&&p.x>-6.6){shot=true;if(shots)await page.screenshot({path:shots+'/booth'+i+'-leaving.png'});await page.evaluate(()=>{walker.pitch=1.3;});}await page.waitForTimeout(100);}
  const last=path[path.length-1];assert.equal(last.gone,true,'reaches the end of the walk: '+JSON.stringify(last));assert.equal(last.shown,false,'hidden once out in the hallway');
  // out through the front: past the glass (x -8.5) at the end gap, then the room's door (x -3), never through the glass or the side walls
  const gap=path.find(p=>p.x>-8.5);assert.ok(gap&&(i?gap.z>42.9:gap.z<29.1),'leaves the booth through the gap at the end of the glass: '+JSON.stringify(gap));
  assert.ok(path.some(p=>p.x>-3&&p.z>31.5&&p.z<36.5),'goes out of the room through its door');
  for(let k=1;k<path.length;k++)assert.ok(Math.hypot(path[k].x-path[k-1].x,path[k].z-path[k-1].z)<.6,'no jump between samples');
  if(shots){await (i?watch(-4.2,30.4,-9,42):watch(-4.6,40.6,-9,29.5));await page.waitForTimeout(400);await page.screenshot({path:shots+'/booth'+i+'-after.png'});}
  console.log('booth',i,'walked out in',path.length,'samples, from',JSON.stringify(path[0]),'to',JSON.stringify(last));}
 // A real launch: the scene is rebuilt for the return, so first leave and come back to put both players at their rigs again.
 await page.evaluate(()=>enterWalking(VoidDistrictArea.keyFor(state)));await page.waitForFunction(()=>mode==='walking'&&VoidNeoChinatown.booths?.where(1)&&!VoidNeoChinatown.booths.where(1).leaving,null,{timeout:120000});
 await watch(-5,36,-10,40);
 const seen=page.evaluate(async()=>{const out=[];const t0=performance.now();while(performance.now()-t0<4000){const p=VoidNeoChinatown.booths?.where(1);if(p)out.push(p);await new Promise(r=>setTimeout(r,40));}return out;});
 await page.evaluate(()=>{VoidVR.launch('forest',{});});const during=await seen;
 assert.ok(during.some(p=>p.leaving),'entering the simulation starts the walk out');for(const p of during)assert.ok(!farCorner(p),'not in the far corner while the visitor walks in: '+JSON.stringify(p));
 const moved=during.filter(p=>p.leaving);const gapD=p=>Math.hypot(p.x+8.5,p.z-43.38);assert.ok(gapD(moved[moved.length-1])<gapD(moved[0])-.1,'moving toward the gap at the front (a software renderer only gets a little way before the fade): '+JSON.stringify([moved[0],moved[moved.length-1]]));
 await page.waitForFunction(()=>walkingLocation?.kind==='vr'&&mode==='walking'&&!VoidVR.busy);
 await page.evaluate(()=>VoidVR.exit());await page.waitForFunction(()=>walkingLocation?.id==='neochinatown'&&mode==='walking'&&!VoidVR.busy&&VoidNeoChinatown.booths?.where(1),null,{timeout:120000});
 const back=await where(1);assert.ok(Math.abs(back.x+12.6)<.05&&Math.abs(back.z-39.6)<.05&&back.shown&&!back.leaving,'back at the rig after the simulation: '+JSON.stringify(back));
 assert.deepEqual(errs,[]);console.log('vr-booth-exit-browser: ok');await b.close();
})().catch(e=>{console.error(e);process.exit(1);});
