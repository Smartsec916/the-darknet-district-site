/* ZEN ZEPHYR TEMPLE in a real browser: pay 60 CR, ride the 3D sky cab (the same transition as Corporate), arrive on the hill, walk the courtyard into the chamber, speak with
   Zen Zephyr and type to him (local quotes), use the area's V1 map, return by cab, and keep the explored map after a reload. Screenshots go to SHOTS (default docs/development/temple/).
   SITE_TEST_URL=http://127.0.0.1:5187 CHROMIUM_PATH=/opt/pw-browsers/chromium node tests/temple-browser.cjs [low|high] */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',tier=process.argv[2]==='high'?'high':'low',shots=process.env.SHOTS||'docs/development/temple';
fs.mkdirSync(shots,{recursive:true});
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox']});
 const page=await b.newPage({viewport:{width:1280,height:720},serviceWorkers:'block'});page.setDefaultTimeout(300000);const errs=[];page.on('pageerror',e=>errs.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|net::ERR/.test(m.text()))errs.push('console: '+m.text());});
 const origin=new URL(base).origin;await page.route(u=>/^https:/.test(u.href)&&u.origin!==origin,r=>r.abort());await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
 await page.addInitScript(q=>localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:q})),tier);
 const generous=()=>page.evaluate(()=>Object.assign(VoidPreparation.limits,{scene:600000,assets:600000,optional:300000,total:1200000,module:600000,artwork:300000,area:600000}));
 await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started);await generous();
 await page.click('[data-action=menu-campaign]');await page.click('[data-action=menu-new]');const c=page.locator('[data-action=menu-new-confirm]');if(await c.count())await c.click();
 await page.waitForSelector('#character-creator.on');await page.waitForFunction(()=>!document.querySelector('[data-cc=confirm]').disabled);await page.locator('[data-cc=confirm]').click();
 await page.waitForFunction(()=>mode==='pod-waking'&&walker&&VoidAssets.pending===0);await page.locator('#pod-wake [data-pod=exit]').click();await page.waitForFunction(()=>mode==='walking');
 await page.evaluate(()=>{delete state.story.flags.area;return enterWalking(VoidDistrictArea.KEY.street,{silent:true});});await page.waitForFunction(()=>mode==='walking'&&walkingLocation?.area==='street');
 const at=(x,z,yaw=0,pitch=0)=>page.evaluate(([x,z,yaw,pitch])=>{Object.assign(walker,{x,z,yaw,pitch});},[x,z,yaw,pitch]);
 const shot=async(name,wait=1200)=>{await page.waitForTimeout(wait);await page.screenshot({path:shots+'/'+name+'.png'});};
 const NORTH=0,EAST=Math.PI/2,SOUTH=Math.PI,WEST=-Math.PI/2;
 await page.evaluate(()=>{window.__sec=[];addEventListener('corporate-security',e=>window.__sec.push(e.detail));});

 // 1. the street cab offers the Temple at a flat 60 CR, taxi only
 const dest=await page.evaluate(()=>VoidTaxiRules.destinations(state,{player:[45,-12.5],layout:walkingLocation}).find(d=>d.id==='temple'));
 assert.ok(dest&&dest.ok&&dest.fare===60&&dest.scene==='temple','the Temple is a destination at 60 CR: '+JSON.stringify(dest));
 // 1b. a Temple that cannot load is handled gracefully: the fare comes back and the player is where they left
 await at(45,-12.5,EAST);await page.evaluate(()=>{state.credits=40;window.__build=VoidTemple.build;VoidTemple.build=undefined;});
 assert.equal(await page.evaluate(()=>VoidSkyCab.ride('temple',{from:{spawn:[45,1.7,-12.5],yaw:Math.PI/2},paid:60})),false);await page.waitForFunction(()=>walkingLocation?.id==='neochinatown'&&mode==='walking',null,{timeout:300000});
 const rec=await page.evaluate(()=>({credits:state.credits,pos:[walker.x,walker.z],trip:state.story.flags.skyCabTrip||null}));assert.equal(rec.credits,100,'the fare was returned once');assert.ok(Math.hypot(rec.pos[0]-45,rec.pos[1]+12.5)<1.5);assert.equal(rec.trip,null);
 await page.evaluate(()=>{VoidTemple.build=window.__build;state.credits=100;});await generous();
 // 2. a real trip with the same 3D cab: call the cab, board (fare charged once), ride, arrive
 await at(45,-12.5,EAST);await page.waitForTimeout(800);assert.equal(await page.evaluate(()=>state.credits),100);assert.equal(await page.evaluate(()=>VoidTaxi.request('temple')),true);
 const skip=()=>page.evaluate(()=>{const t=VoidTaxi.trip,c=VoidTaxi.cab;if(!t||!c)return null;t.skipped??={};if(t.skipped[t.phase])return t.phase;t.skipped[t.phase]=true;if(t.phase==='approach')c.root.position.set(t.pickup.position[0]-14,c.root.position.y,t.pickup.position[1]);return t.phase;});
 for(let i=0;i<200&&await page.evaluate(()=>VoidTaxi.trip?.phase!=='landed');i++){await skip();await page.waitForTimeout(1500);}
 assert.equal(await page.evaluate(()=>VoidTaxi.trip?.phase),'landed');await page.waitForTimeout(300);await page.evaluate(()=>VoidInteractions.handlers.get('taxi-board')({item:{}}));
 await page.waitForFunction(()=>walkingLocation?.id==='skycab',null,{timeout:300000});
 const paid=await page.evaluate(()=>({credits:state.credits,trip:state.story.flags.skyCabTrip,taxi:state.story.flags.taxiTrip||null,ret:state.story.flags.cabReturn}));assert.equal(paid.credits,40);assert.equal(paid.trip,'temple:60');assert.equal(paid.taxi,null);assert.ok(paid.ret);
 const cab=await page.evaluate(()=>({meshes:VoidBabylon.zone.meshCount(),hasNcz:VoidBabylon.scene.meshes.some(m=>/^ncz|district-root/.test(m.name)),status:VoidBabylon.zone.status}));assert.ok(cab.meshes>40,'the same modelled cab: '+cab.meshes);assert.equal(cab.hasNcz,false);
 await shot('01-taxi-cab-interior',900);const mid=await page.evaluate(()=>VoidBabylon.zone.status);assert.match(mid.text,/EN ROUTE|LANDING/);assert.match(mid.text,/ZEN ZEPHYR/);assert.equal(mid.fare,60);
 await page.waitForFunction(()=>walkingLocation?.id==='temple',null,{timeout:400000});
 // 3. arrival on the hill
 const arr=await page.evaluate(()=>({pos:[walker.x,walker.z],flags:{trip:state.story.flags.skyCabTrip||null,taxi:state.story.flags.taxiTrip||null,ret:state.story.flags.cabReturn||null},credits:state.credits,hasNcz:VoidBabylon.scene.meshes.some(m=>/^ncz|district-root|^milked|^corp/.test(m.name)),cab:VoidBabylon.scene.meshes.some(m=>m.name==='cab-box'),zone:!!VoidBabylon.zone?.monk,mode,lights:VoidBabylon.scene.lights.length}));
 assert.ok(Math.abs(arr.pos[0])<2&&Math.abs(arr.pos[1]+38)<2,'arrived at the hilltop pad: '+arr.pos);assert.equal(arr.flags.trip,null);assert.equal(arr.flags.taxi,null);assert.ok(arr.flags.ret);assert.equal(arr.credits,40);assert.equal(arr.hasNcz,false,'the city is not loaded here');assert.equal(arr.cab,false);assert.equal(arr.zone,true);assert.equal(arr.mode,'walking');assert.ok(arr.lights<=12,'lights: '+arr.lights);
 await at(0,-38,NORTH,.04);await shot('02-temple-arrival',1800);await at(20,-30,Math.PI*.62,.12);await shot('03-temple-skyline-from-the-hill',900);await at(0,-26,NORTH,.05);await shot('04-temple-courtyard',900);await at(0,-9,NORTH,.08);await shot('05-temple-entrance',900);
 // 4. into the chamber: pillars, altars, dais, window
 await at(0,0,NORTH,.05);await shot('06-temple-chamber',1200);await at(8,17,EAST,.08);await shot('07-temple-window-skyline',900);await at(-5,10,EAST,.1);await shot('08-temple-data-altar',700);
 // 5. Zen Zephyr: the seated monk, then a typed conversation (local quotes)
 await at(0,16.2,NORTH,.05);await page.waitForTimeout(800);assert.equal(await page.evaluate(()=>walkingLocation.interactions.some(i=>i.id==='temple-monk')),true);
 const prompt=await page.evaluate(()=>{const it=VoidExplorer.select(walker,walkingLocation);return it?.id;});assert.equal(prompt,'temple-monk','looking at the monk offers the conversation');await shot('09-zen-zephyr',500);
 const posBefore=await page.evaluate(()=>[walker.x,walker.z]);await page.evaluate(()=>VoidInteractions.handlers.get('temple-monk')({item:{}}));await page.waitForSelector('#zen-chat:not([hidden])');
 assert.equal(await page.evaluate(()=>VoidTemple.panel.isOpen),true);assert.match(await page.textContent('#zen-chat header'),/NOT AN AI/);assert.ok((await page.textContent('#zen-log')).length>10,'he greets you');assert.equal(await page.evaluate(()=>document.activeElement?.tagName),'INPUT','the cursor is in the box');
 await page.keyboard.type('wasd e l k',{delay:20});assert.equal(await page.inputValue('#zen-chat input'),'wasd e l k','typing lands in the box');const moved=await page.evaluate(()=>[walker.x,walker.z]);assert.deepEqual(moved,posBefore,'typing did not move the player');assert.equal(await page.evaluate(()=>!!document.querySelector('#personal-device.open')),false,'typing L did not open the V1');
 await page.fill('#zen-chat input','serenity');await page.keyboard.press('Enter');await page.waitForFunction(()=>document.querySelectorAll('#zen-log .zen').length>=2);
 const first=await page.evaluate(()=>[...document.querySelectorAll('#zen-log .zen')].pop().textContent);assert.equal(first,'In the network of complex codes, serenity lies in the simplest line.','the exact line, for serenity');
 await page.fill('#zen-chat input','what is the mind?');await page.keyboard.press('Enter');await page.waitForFunction(()=>document.querySelectorAll('#zen-log .zen').length>=3);
 const second=await page.evaluate(()=>[...document.querySelectorAll('#zen-log .zen')].pop().textContent);assert.equal(second,'A mindful soul is like a processor; it understands, computes, and calmly executes.','the exact line, for the mind');
 await page.fill('#zen-chat input','xyzzy plugh');await page.keyboard.press('Enter');await page.waitForFunction(()=>document.querySelectorAll('#zen-log .zen').length>=4);
 const third=await page.evaluate(()=>[...document.querySelectorAll('#zen-log .zen')].pop().textContent);assert.ok(await page.evaluate(t=>VoidZenChat.FALLBACKS.includes(t),third),'a calm fallback: '+third);
 await page.locator('#zen-chat summary').click();await page.locator('#zen-list button').nth(6).click();assert.equal(await page.evaluate(()=>[...document.querySelectorAll('#zen-log .zen')].pop().textContent),await page.evaluate(()=>VoidZenChat.QUOTES[6].text),'a chosen teaching');
 assert.equal(await page.locator('#zen-list button').count(),await page.evaluate(()=>VoidZenChat.QUOTES.length),'every quote is selectable');
 await page.fill('#zen-chat input','I am afraid');await page.keyboard.press('Enter');await page.waitForTimeout(300);await shot('10-zen-zephyr-chat-panel',300);
 await page.keyboard.press('Escape');await page.waitForFunction(()=>!VoidTemple.panel.isOpen&&mode==='walking');assert.equal(await page.evaluate(()=>document.getElementById('zen-chat').hidden),true,'Escape closes the panel');assert.equal(await page.evaluate(()=>!!document.querySelector('.menu-open,#pause-menu:not(.hidden)')),false,'and does not open the pause menu');
 // the other interactions
 for(const [act,item] of [['temple-altar',{altar:2}],['temple-incense',{}],['temple-overlook',{}]]){await page.evaluate(([a,i])=>VoidInteractions.handlers.get(a)({item:i}),[act,item]);assert.ok((await page.evaluate(()=>document.getElementById('notice').textContent)).length>10,act);}
 // 6. the V1 map of the Temple, with fog of war
 await at(0,-38,NORTH);await page.waitForTimeout(700);await page.keyboard.press('KeyL');await page.waitForSelector('#personal-device.open');await page.locator('#personal-device [data-app=map]').click();await page.waitForSelector('#personal-device canvas.dm-canvas');await page.waitForTimeout(700);
 const mp=await page.evaluate(()=>({text:document.querySelector('#personal-device')?.innerText||'',fog:VoidBabylon.zone.fog.explored(),total:VoidBabylon.zone.fog.total,model:VoidAreaMap.get('temple').model().pois.map(p=>p.name)}));
 assert.match(mp.text,/ZEN ZEPHYR TEMPLE/);assert.match(mp.text,/sky cab stop/i);assert.ok(mp.fog>20&&mp.fog<mp.total,'partly explored: '+mp.fog+'/'+mp.total);assert.ok(mp.model.some(n=>/dais/i.test(n))&&mp.model.some(n=>/Data altar/.test(n))&&mp.model.some(n=>/Temple entrance/.test(n)));assert.doesNotMatch(mp.text,/taxi stop · main street/i);
 await shot('11-temple-map',700);await page.locator('[data-map=all]').click();await shot('12-temple-map-whole',500);await page.keyboard.press('KeyL');await page.waitForFunction(()=>!document.querySelector('#personal-device.open'));
 const exploredBefore=await page.evaluate(()=>VoidBabylon.zone.fog.explored());
 // 7. the return cab: free, back where the player left; the fog is saved
 await at(0,-38,NORTH);await page.evaluate(()=>VoidInteractions.handlers.get('temple-cab')({item:{}}));await page.waitForFunction(()=>walkingLocation?.id==='skycab',null,{timeout:200000});await shot('13-return-cab',600);
 await page.waitForFunction(()=>walkingLocation?.id==='neochinatown',null,{timeout:400000});
 const back=await page.evaluate(()=>({pos:[walker.x,walker.z],credits:state.credits,trip:state.story.flags.skyCabTrip||null,ret:state.story.flags.cabReturn||null,fog:state.story.flags.templeFog,area:walkingLocation.area}));
 assert.ok(Math.hypot(back.pos[0]-45,back.pos[1]+12.5)<1.5,'back exactly where they boarded: '+back.pos);assert.equal(back.credits,40);assert.equal(back.trip,null);assert.equal(back.ret,null);assert.equal(back.area,'street');assert.ok(typeof back.fog==='string'&&back.fog.length>10&&back.fog.length<200);
 const savedCells=(()=>{const f=require('../void-runner/area-map.js').createFog([-50,50,-50,50],5);f.decode(back.fog);return f.explored();})();console.log('fog before leaving',exploredBefore,'cells in saved text',savedCells);
 // 8. reload: credits and the explored map survive
 await page.evaluate(()=>save());await page.reload();await page.waitForFunction(()=>window.VoidStartup?.started);await generous();
 await page.locator('[data-action=menu-continue]').click();await page.waitForFunction(()=>mode==='pod-waking'||mode==='walking',null,{timeout:300000});
 if(await page.evaluate(()=>mode==='pod-waking'))await page.locator('#pod-wake [data-pod=exit]').click();await page.waitForFunction(()=>mode==='walking'&&VoidAssets.pending===0);
 const after=await page.evaluate(()=>({credits:state.credits,fog:state.story.flags.templeFog}));assert.equal(after.credits,40);assert.equal(after.fog,back.fog,'the explored map survived the reload');
 await page.evaluate(()=>enterWalking('temple',{silent:true}));await page.waitForFunction(()=>walkingLocation?.id==='temple',null,{timeout:300000});
 const kept=await page.evaluate(()=>VoidBabylon.zone.fog.explored());assert.equal(kept,savedCells,'the same cells are still explored after the reload');await shot('14-temple-after-reload',800);
 assert.deepEqual(errs,[]);console.log(JSON.stringify({ok:true,tier,explored:kept,lights:arr.lights}));await b.close();})().catch(e=>{console.error(String(e.stack||e).slice(0,1500));process.exit(1);});
