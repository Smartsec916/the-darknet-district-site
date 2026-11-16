/* NeoChinatown's quarters and checkpoints in a real browser (docs/development/NEOCHINATOWN_QUARTERS.md). Not part of npm test.
     SITE_TEST_URL=http://127.0.0.1:5187 node tests/ncz-quarters-browser.cjs [low|medium]
   Walks Port Customs and the North Gate both ways, walks the Function Gate to the Corporate District and back and the East Gate to the Temple and back, calls a taxi
   at a stop's post (CALL A TAXI) and with the G key, rides a taxi from Old Town to the Corporate
   District and back, to the Temple and back, and across the city to the Port. Checks the quarter, the fare and that nothing is thrown.
   In a software renderer the game runs at a few percent of real time, so the cabs' own rules are stepped forward between frames while they drive on open
   road (never inside a gate). CHROMIUM_PATH names the browser where the bundled one is not found. */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',tier=process.argv[2]||'low';
(async()=>{
 const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox']});
 const page=await b.newPage({viewport:{width:1280,height:720},serviceWorkers:'block'});page.setDefaultTimeout(1500000);const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.route('https://**/*',r=>r.abort());await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
 await page.addInitScript(q=>localStorage.setItem('void-runner-graphics-v1',JSON.stringify({renderer:'babylon',quality:q,v:2,chosen:true})),tier);
 await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started);
 await page.evaluate(()=>{Object.assign(VoidPreparation.limits,{scene:900000,assets:600000,optional:600000,area:900000,total:1800000});});
 await page.click('[data-action=menu-campaign]');await page.click('[data-action=menu-new]');const c=page.locator('[data-action=menu-new-confirm]');if(await c.count())await c.click();
 await page.waitForSelector('#character-creator.on');await page.waitForFunction(()=>!document.querySelector('[data-cc=confirm]').disabled);await page.locator('[data-cc=confirm]').click();
 await page.waitForFunction(()=>mode==='pod-waking'&&walker);await page.waitForTimeout(2500);await page.keyboard.press('KeyE');await page.waitForFunction(()=>mode==='walking');
 const info=()=>page.evaluate(()=>({mode,loc:walkingLocation?.id,q:walkingLocation?.quarter||null,credits:state.credits,trip:state.story.flags.roadTaxiTrip||null,taxi:VoidRoadTaxi.status()?.phase||null,gate:VoidGateTransit.state,swapMs:VoidGateTransit.lastSwapMs}));
 const enter=async(q,spawn)=>{await page.evaluate(([q,spawn])=>{delete state.story.flags.area;state.credits=1000;return enterWalking('sacramento',{silent:true,quarter:q,...(spawn?{spawn}:{})});},[q,spawn]);await page.waitForFunction(q=>mode==='walking'&&walkingLocation?.quarter===q,q);await page.waitForTimeout(4000);};
 // walk a straight line in small steps, only over open floor (waits for doors)
 const walk=async(x1,z1,timeout=150000)=>{const t0=Date.now();for(;;){const r=await page.evaluate(([x1,z1])=>{if(mode!=='walking'||!walker)return 'wait';const dx=x1-walker.x,dz=z1-walker.z,d=Math.hypot(dx,dz);if(d<.05)return 'done';const s=Math.min(.35,d),nx=walker.x+dx/d*s,nz=walker.z+dz/d*s;if(VoidExplorer.blocked(nx,nz,walkingLocation))return 'blocked';walker.x=nx;walker.z=nz;walker.yaw=Math.atan2(dx,dz);return d<=s?'done':'moving';},[x1,z1]);
   if(r==='done')return;assert.ok(Date.now()-t0<timeout,'walk to '+x1+','+z1+' stuck ('+r+')');await page.waitForTimeout(r==='moving'?60:250);}};
 // from outside the near door (a), through the middle of the lane (m), out of the far door (b)
 const pass=async(name,a,m,b,to)=>{await page.evaluate(([x,z])=>{walker.x=x;walker.z=z;},a);await page.waitForTimeout(700);await walk(m[0],m[1]);await page.waitForFunction(()=>VoidGateTransit.busy,null,{timeout:60000});await page.waitForFunction(()=>!VoidGateTransit.busy&&mode==='walking',null,{timeout:400000});
  const s=await info();assert.equal(s.gate,'COMPLETE',name);assert.equal(s.q||s.loc,to,name);if(b)await walk(b[0],b[1]);console.log(name,'ok, exchange',s.swapMs,'ms');};
 const fast=()=>page.evaluate(()=>{const w=VoidRoadTaxi.world;if(!w||VoidRoadTaxi.crossing||VoidGateTransit.busy)return;const c=w.job&&!w.job.released?w.job.cab:null;if(!c)return;for(let i=0;i<25&&['to-pickup','to-dest'].includes(c.phase)&&c.pathLen-c.s>14;i++)VoidRoadTaxiRules.stepWorld(w,.1,{x:walker.x,z:walker.z,riding:mode==='road-taxi'});});
 const until=async(test,what)=>{const t0=Date.now();for(;;){await fast();const s=await info();if(test(s))return s;assert.ok(Date.now()-t0<900000,what+' timed out: '+JSON.stringify(s));await page.waitForTimeout(350);}};
 const ride=async(dest,test)=>{assert.equal(await page.evaluate(d=>VoidRoadTaxi.hail(d),dest),true,'hail '+dest);await until(s=>s.taxi==='waiting','cab for '+dest);await page.evaluate(()=>VoidRoadTaxi.board());const s=await until(test,'ride to '+dest);console.log('ride to',dest,'ok',JSON.stringify(s));return s;};
 const stepOut=async()=>{await page.evaluate(()=>VoidRoadTaxi.exit());await page.waitForFunction(()=>mode==='walking');};

 // ---- on foot ----
 await enter('oldtown');
 await pass('Port Customs, Old Town to the Port',[39.15,-115.2],[39.15,-110],[39.15,-104],'port');assert.equal(await page.evaluate(()=>state.story.flags.quarter),undefined,'the Port needs no flag');
 await pass('Port Customs, the Port to Old Town',[39.15,-104.5],[39.15,-110],[39.15,-115.5],'oldtown');assert.equal(await page.evaluate(()=>state.story.flags.quarter),'oldtown');
 await pass('North Gate, west lane, to the Avenue',[52.8,-28.5],[52.8,-23],[52.8,-17.5],'avenue');
 await pass('Function Gate, on foot, to the Corporate District',[12.5,-18.2],[6,-18.2],null,'corporate');
 await page.evaluate(()=>VoidInteractions.handlers.get('corp-gate')({}));await page.waitForFunction(()=>walkingLocation?.quarter==='avenue'&&mode==='walking'&&!VoidGateTransit.busy,null,{timeout:400000});await walk(12.5,-18.2);console.log('Function Gate, on foot, back to the Avenue ok');
 // the East Gate's walkers' lane (16 Nov 2026): to the Temple, and back by the EAST GATE prompt there
 await pass('East Gate, on foot, to the Temple',[141,-6.8],[148,-6.8],null,'temple');
 await page.evaluate(()=>VoidInteractions.handlers.get('temple-walk')({}));await page.waitForFunction(()=>walkingLocation?.quarter==='avenue'&&mode==='walking'&&!VoidGateTransit.busy,null,{timeout:400000});await walk(141,-6.8);console.log('East Gate, on foot, back to the Avenue ok');
 // calling a taxi: the prompt at a stop's post opens the list of destinations and fares; so does G
 {const p=await page.evaluate(()=>walkingLocation.interactions.find(i=>i.id==='taxi-call-east-gate'));assert.ok(p&&p.label==='CALL A TAXI');await page.evaluate(p=>{walker.x=p.position[0];walker.z=p.position[2];},p);await page.waitForTimeout(1500);
  await page.evaluate(()=>VoidInteractions.handlers.get('road-taxi-call')({}));await page.waitForFunction(()=>VoidHUD.isOpen&&VoidHUD.tab==='taxi');assert.ok(await page.locator('[data-hud-action="taxi-call:temple"]').count(),'the list offers the Temple with its fare');await page.keyboard.press('Escape');await page.waitForFunction(()=>!VoidHUD.isOpen&&mode==='walking');
  await page.keyboard.press('KeyG');await page.waitForFunction(()=>VoidHUD.isOpen&&VoidHUD.tab==='taxi');await page.keyboard.press('Escape');await page.waitForFunction(()=>!VoidHUD.isOpen);console.log('CALL A TAXI and G open the taxi list ok');}
 await pass('North Gate, east lane, to Old Town',[69.2,-17.5],[69.2,-23],[69.2,-28.5],'oldtown');
 // the South Gate (A5, opened 16 Nov 2026) takes walkers in both pavements, both ways; Milked is on the far side of it
 await pass('South Gate, west lane, to Far South',[52.8,-122],[52.8,-127],[52.8,-133],'far-south');
 await pass('South Gate, west lane, back to Old Town',[52.8,-132],[52.8,-127],[52.8,-121],'oldtown');
 await pass('South Gate, east lane, to Far South',[69.2,-122],[69.2,-127],[69.2,-133],'far-south');
 await pass('South Gate, east lane, back to Old Town',[69.2,-132],[69.2,-127],[69.2,-121],'oldtown');
 // the Far South Gate (A6, live since stage 2) is a PEDESTRIAN vestibule: walkers only, both ways; the Outskirts' only way in and out
 await enter('far-south',[61,1.7,-212]);
 await pass('Far South Gate, on foot, to The Outskirts',[61,-216],[61,-221],[61,-228],'outskirts');
 assert.equal(await page.evaluate(()=>state.story.flags.quarter),'outskirts','the Outskirts is remembered');
 await pass('Far South Gate, on foot, back to Far South',[61,-227],[61,-221],[61,-215],'far-south');
 assert.equal(await page.evaluate(()=>walkingLocation.solids.filter(s=>/^gate-far-south-gate-/.test(s.id)&&s.door).length),2,'one lane, two doors, no vehicle bay');
 await enter('outskirts');{const L=await page.evaluate(()=>walkingLocation.interactions.filter(i=>i.action==='road-taxi-call').length);assert.equal(L,0,'no taxi post in The Outskirts');}
 await enter('oldtown');
 // ---- by taxi ----
 await page.evaluate(()=>{walker.x=66;walker.z=-60;state.credits=1000;});await page.waitForTimeout(1500);
 let s=await ride('corporate',s=>s.loc==='corporate'&&s.mode==='walking');assert.equal(s.credits,940);assert.equal(s.trip,null);
 await page.evaluate(()=>VoidInteractions.handlers.get('corp-cab')({}));s=await until(s=>s.loc==='neochinatown'&&s.taxi==='arrived','the ride back from the Corporate District');assert.equal(s.q,'avenue');assert.equal(s.credits,940,'the ride back is included');await stepOut();
 s=await ride('temple',s=>s.loc==='temple'&&s.mode==='walking');assert.equal(s.credits,880);
 await page.evaluate(()=>VoidInteractions.handlers.get('temple-cab')({}));s=await until(s=>s.loc==='neochinatown'&&s.taxi==='arrived','the ride back from the Temple');assert.equal(s.q,'avenue');await stepOut();
 // Milked corner is in Far South: the cab goes through the South Gate (A5) and the fare is the stop table's
 await page.evaluate(()=>{walker.x=66;walker.z=-60;state.credits=1000;});await page.waitForTimeout(1500);
 s=await ride('milked',s=>s.q==='far-south'&&s.taxi==='arrived');assert.ok(s.credits<1000&&s.credits>=1000-60,'the fare is charged once: '+s.credits);assert.equal(s.trip,null,'the trip is closed when the cab arrives');await stepOut();
 s=await ride('main',s=>s.q==='oldtown'&&s.taxi==='arrived');await stepOut();
 await page.evaluate(()=>{state.credits=880;});
 s=await ride('passage',s=>s.q==='port'&&s.taxi==='arrived');assert.ok(s.credits<880&&s.credits>=880-60);await stepOut();assert.equal((await info()).trip,null);
 assert.deepEqual(await page.evaluate(()=>[typeof VoidTaxi,typeof VoidSkyCab]),['undefined','undefined'],'the sky cabs are gone');
 assert.deepEqual(errs,[],'no page errors');console.log('NeoChinatown quarters: all passes and rides ok');await b.close();
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
