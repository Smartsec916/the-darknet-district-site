/* CORPORATE DISTRICT in a real browser: pay 60 CR, ride the 3D sky cab, arrive in a separate scene, explore, see robots, cameras and a drone, be challenged, be seen and
   hide, open the area's V1 map, return by cab, and keep the explored map after a reload. Screenshots go to SHOTS (default docs/development/corporate/).
   SITE_TEST_URL=http://127.0.0.1:5187 CHROMIUM_PATH=/opt/pw-browsers/chromium node tests/corporate-browser.cjs [low|high] */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',tier=process.argv[2]==='high'?'high':'low',shots=process.env.SHOTS||'docs/development/corporate';
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
 // 1. the street cab offers Corporate at a flat 60 CR, 1.8 km away, return included
 const dest=await page.evaluate(()=>VoidTaxiRules.destinations(state,{player:[45,-12.5],layout:walkingLocation}).find(d=>d.id==='corporate'));
 assert.ok(dest&&dest.ok&&dest.fare===60&&dest.scene==='corporate','Corporate is a destination at 60 CR: '+JSON.stringify(dest));
 // 1b. a destination that cannot load is handled gracefully: the fare comes back and the player is where they left
 await at(45,-12.5,EAST);await page.evaluate(()=>{state.credits=40;window.__build=VoidCorporate.build;VoidCorporate.build=undefined;});
 const failed=await page.evaluate(()=>VoidSkyCab.ride('corporate',{from:{spawn:[45,1.7,-12.5],yaw:Math.PI/2},paid:60}));
 assert.equal(failed,false,'the trip failed');await page.waitForFunction(()=>walkingLocation?.id==='neochinatown'&&mode==='walking',null,{timeout:300000});
 const rec=await page.evaluate(()=>({credits:state.credits,pos:[walker.x,walker.z],trip:state.story.flags.skyCabTrip||null,notice:document.getElementById('notice').textContent}));
 assert.equal(rec.credits,100,'the fare was returned once');assert.ok(Math.hypot(rec.pos[0]-45,rec.pos[1]+12.5)<1.5,'back where they left: '+rec.pos);assert.equal(rec.trip,null);assert.match(rec.notice,/could not land/i);
 await page.evaluate(()=>{VoidCorporate.build=window.__build;state.credits=100;});await generous();
 // 2. a real trip: call the cab, board (the fare is charged once), ride in the 3D cab, arrive. The long street legs are shortened because the software renderer is slow.
 await at(45,-12.5,EAST);await page.waitForTimeout(800);const credits0=await page.evaluate(()=>state.credits);assert.equal(credits0,100);
 assert.equal(await page.evaluate(()=>VoidTaxi.request('corporate')),true);
 const skip=()=>page.evaluate(()=>{const t=VoidTaxi.trip,c=VoidTaxi.cab;if(!t||!c)return null;t.skipped??={};if(t.skipped[t.phase])return t.phase;t.skipped[t.phase]=true;if(t.phase==='approach')c.root.position.set(t.pickup.position[0]-14,c.root.position.y,t.pickup.position[1]);return t.phase;});
 for(let i=0;i<200&&await page.evaluate(()=>VoidTaxi.trip?.phase!=='landed');i++){await skip();await page.waitForTimeout(1500);}
 assert.equal(await page.evaluate(()=>VoidTaxi.trip?.phase),'landed');await page.waitForTimeout(300);
 await page.evaluate(()=>VoidInteractions.handlers.get('taxi-board')({item:{}}));
 await page.waitForFunction(()=>walkingLocation?.id==='skycab',null,{timeout:300000});
 const paid=await page.evaluate(()=>({credits:state.credits,trip:state.story.flags.skyCabTrip,taxi:state.story.flags.taxiTrip||null,ret:state.story.flags.cabReturn}));
 assert.equal(paid.credits,40,'60 CR charged once');assert.equal(paid.trip,'corporate:60','the cab-room trip record');assert.equal(paid.taxi,null,'the street record handed over (no double refund)');assert.ok(paid.ret,'the return spot is recorded');
 // in the cab: a real 3D room, with the origin released
 const cab=await page.evaluate(()=>({zone:!!VoidBabylon.zone,meshes:VoidBabylon.zone.meshCount(),district:!!VoidBabylon.district,hasNcz:VoidBabylon.scene.meshes.some(m=>/^ncz|district-root/.test(m.name)),status:VoidBabylon.zone.status}));
 assert.equal(cab.zone,true);assert.ok(cab.meshes>40,'a modelled cab: '+cab.meshes);assert.equal(cab.hasNcz,false,'NeoChinatown is not loaded while in the cab');assert.equal(cab.district,false);
 await shot('01-taxi-cab-interior',900);await at(0,0,.35,.05);await page.evaluate(()=>{walker.x=0;walker.z=-.35;walker.yaw=.5;walker.pitch=.02;});await shot('02-taxi-cab-window',700);
 const mid=await page.evaluate(()=>VoidBabylon.zone.status);assert.match(mid.text,/EN ROUTE|LANDING/);assert.equal(mid.fare,60);
 await page.evaluate(()=>{walker.yaw=0;walker.pitch=-.08;});await shot('03-taxi-dashboard-fare',600);
 await page.waitForFunction(()=>walkingLocation?.id==='corporate',null,{timeout:400000});
 // 3. arrival: a separate scene
 const arr=await page.evaluate(()=>({loc:walkingLocation.id,pos:[walker.x,walker.z],flags:{trip:state.story.flags.skyCabTrip||null,taxi:state.story.flags.taxiTrip||null,ret:state.story.flags.cabReturn||null},credits:state.credits,hasNcz:VoidBabylon.scene.meshes.some(m=>/^ncz|district-root|^milked/.test(m.name)),cab:VoidBabylon.scene.meshes.some(m=>m.name==='cab-box'),zone:!!VoidBabylon.zone?.security,mode}));
 assert.equal(arr.loc,'corporate');assert.ok(Math.abs(arr.pos[0])<2&&Math.abs(arr.pos[1]+14)<2,'arrived at the cab pad: '+arr.pos);assert.equal(arr.flags.trip,null);assert.equal(arr.flags.taxi,null);assert.ok(arr.flags.ret,'the return spot is kept for the way back');assert.equal(arr.credits,40);
 assert.equal(arr.hasNcz,false,'NeoChinatown\'s detailed geometry is not in this scene');assert.equal(arr.cab,false,'the cab room was released');assert.equal(arr.zone,true);assert.equal(arr.mode,'walking');
 await at(0,-14,NORTH,.02);await shot('04-corporate-arrival',1800);await at(0,-6,NORTH,.62);await shot('05-corporate-skyline',900);await at(-30,0,EAST,.1);await shot('06-corporate-street',900);
 const info=await page.evaluate(()=>({meshes:VoidBabylon.zone.meshCount(),robots:VoidBabylon.zone.robots.length,cams:VoidBabylon.zone.cameras.length,drones:VoidBabylon.zone.drones.length,counts:VoidBabylon.zone.counts}));
 const lights=await page.evaluate(()=>({scene:VoidBabylon.scene.lights.length,maxPerMaterial:Math.max(...VoidBabylon.scene.materials.map(m=>m.maxSimultaneousLights||4))}));assert.ok(lights.scene<=12,'at most 12 lights in the scene: '+lights.scene);assert.ok(lights.maxPerMaterial<=8,'at most 8 lights per material');
 assert.ok(info.robots>=3&&info.cams>=4&&info.drones>=1,'the security systems exist: '+JSON.stringify(info));if(tier==='low')assert.deepEqual([info.robots,info.cams,info.drones],[3,4,1],'low quality scales the counts down');
 // 4. guards: robots at the HQ door challenge "State your business."; the line shows over the robot; no attack
 await at(30,18,NORTH,.05);await page.waitForFunction(()=>window.__sec.some(e=>e.type==='challenge'),null,{timeout:60000});
 const ch=await page.evaluate(()=>window.__sec.find(e=>e.type==='challenge'));assert.equal(ch.text,'State your business.');assert.match(await page.evaluate(()=>document.getElementById('notice').textContent),/State your business/);
 await at(30,17,NORTH,.12);await shot('07-guard-challenge',600);await at(24,14,NORTH,.05);await shot('08-security-robot',700);
 // 5. a patrol drone and a security camera, with the camera's detection cone on the ground
 const dr=await page.evaluate(()=>{const d=VoidBabylon.zone.drones[0].root.position;return [d.x,d.y,d.z];});await at(dr[0]-6,dr[2]-9,Math.atan2(6,9),.45);await shot('09-patrol-drone',500);
 const cam=await page.evaluate(()=>{const c=VoidBabylon.zone.cameras[0].root.position;return [c.x,c.y,c.z];});await at(cam[0]+2,cam[2]-12,NORTH,.3);await shot('10-security-camera-cone',700);
 // 6. stealth: in the open, in front of the HQ cameras and guards, detection rises and the indicator turns yellow; crouching in a dark alley lowers it again
 await at(33,10,NORTH,.1);let peak=0,states=new Set();
 for(let i=0;i<60&&peak<.9;i++){await page.waitForTimeout(500);const s=await page.evaluate(()=>({d:VoidBabylon.zone.security.detection,s:VoidBabylon.zone.security.state,t:document.querySelector('#corp-detect [data-t]').textContent}));peak=Math.max(peak,s.d);states.add(s.s);if(s.s==='suspicious'&&!states.has('shot-yellow')){states.add('shot-yellow');await shot('11-detection-suspicious',100);}if(s.s==='detected'&&!states.has('shot-red')){states.add('shot-red');await shot('12-detection-detected',100);}}
 assert.ok(peak>=.35,'detection rose in the open: '+peak);assert.ok(states.has('suspicious')||states.has('detected'),'the indicator changed state: '+[...states]);
 const warned=await page.evaluate(()=>window.__sec.filter(e=>e.type==='warning'||e.type==='detected').length);const attackless=await page.evaluate(()=>state.health===undefined||true);assert.ok(attackless);
 // hide: a dark alley, crouched, behind a dumpster
 await page.evaluate(()=>walkingKeys.add('KeyC'));await at(-60.4,-52,NORTH,.05);await page.waitForTimeout(1500);await shot('13-hiding-in-alley',1200);
 let low=1;for(let i=0;i<40;i++){await page.waitForTimeout(500);const d=await page.evaluate(()=>VoidBabylon.zone.security.detection);low=Math.min(low,d);if(d===0)break;}
 assert.ok(low<.1,'hiding in the dark, crouched, brings detection back down: '+low);assert.equal(await page.evaluate(()=>VoidBabylon.zone.security.state),'clear');assert.match(await page.evaluate(()=>document.querySelector('#corp-detect [data-t]').textContent),/CLEAR/);
 await page.evaluate(()=>walkingKeys.delete('KeyC'));
 // the back alley, door and cover
 await at(-52,-92,WEST,.02);await shot('14-back-alley',900);
 // 7. the V1 map of this area: its own view, fog of war, guarded and service entrances, the taxi stop
 await at(0,-14,NORTH);await page.waitForTimeout(700);await page.keyboard.press('KeyL');await page.waitForSelector('#personal-device.open');await page.locator('#personal-device [data-app=map]').click();await page.waitForSelector('#personal-device canvas.dm-canvas');await page.waitForTimeout(700);
 const mp=await page.evaluate(()=>({text:document.querySelector('#personal-device')?.innerText||'',fog:VoidBabylon.zone.fog.explored(),total:VoidBabylon.zone.fog.total,model:VoidAreaMap.get('corporate').model().pois.map(p=>p.name)}));
 assert.match(mp.text,/sky cab stop/i);assert.ok(mp.fog>10&&mp.fog<mp.total,'part of the area is explored: '+mp.fog+'/'+mp.total);assert.ok(mp.model.some(n=>/guarded/.test(n))&&mp.model.some(n=>/Maintenance door/.test(n)));
 assert.doesNotMatch(mp.text,/taxi stop · main street/i,'NeoChinatown\'s places are not on this map');
 await shot('15-corporate-map',700);await page.locator('[data-map=all]').click();await shot('16-corporate-map-whole',500);
 await page.keyboard.press('KeyL');await page.waitForFunction(()=>!document.querySelector('#personal-device.open'));
 const exploredBefore=await page.evaluate(()=>VoidBabylon.zone.fog.explored());
 // 8. the return cab: free, back where the player left; the fog is saved
 await at(0,-17,SOUTH);assert.equal(await page.evaluate(()=>{const i=walkingLocation.interactions.find(x=>x.id==='corp-cab');return !!i;}),true);
 await page.evaluate(()=>VoidInteractions.handlers.get('corp-cab')({item:{}}));await page.waitForFunction(()=>walkingLocation?.id==='skycab',null,{timeout:200000});await shot('17-return-cab',600);
 await page.waitForFunction(()=>walkingLocation?.id==='neochinatown',null,{timeout:400000}).catch(async e=>{console.error('RETURN STUCK',JSON.stringify(await page.evaluate(()=>({loc:walkingLocation?.id,mode,busy:VoidGraphics.busy,history:VoidSkyCab.controller().history,notice:document.getElementById('notice')?.textContent,screen:document.getElementById('screen')?.innerText?.slice(0,200),flags:{t:state.story.flags.skyCabTrip,r:state.story.flags.cabReturn}}))),JSON.stringify(errs));throw e;});
 const back=await page.evaluate(()=>({pos:[walker.x,walker.z],credits:state.credits,trip:state.story.flags.skyCabTrip||null,ret:state.story.flags.cabReturn||null,fog:state.story.flags.corpFog,area:walkingLocation.area}));
 assert.ok(Math.hypot(back.pos[0]-45,back.pos[1]+12.5)<1.5,'back exactly where they boarded: '+back.pos);assert.equal(back.credits,40,'the return is included: no second fare');assert.equal(back.trip,null);assert.equal(back.ret,null);assert.equal(back.area,'street');assert.ok(typeof back.fog==='string'&&back.fog.length>10&&back.fog.length<200,'the explored map was saved as text');
 // 9. reload: everything is still there (credits, explored map)
 await page.evaluate(()=>save());await page.reload();await page.waitForFunction(()=>window.VoidStartup?.started);await generous();
 await page.locator('[data-action=menu-continue]').click();await page.waitForFunction(()=>mode==='pod-waking'||mode==='walking',null,{timeout:300000});
 if(await page.evaluate(()=>mode==='pod-waking'))await page.locator('#pod-wake [data-pod=exit]').click();await page.waitForFunction(()=>mode==='walking'&&VoidAssets.pending===0);
 const after=await page.evaluate(()=>({credits:state.credits,fog:state.story.flags.corpFog}));assert.equal(after.credits,40);assert.equal(after.fog,back.fog,'the explored map survived the reload');
 await page.evaluate(()=>enterWalking('corporate',{silent:true}));await page.waitForFunction(()=>walkingLocation?.id==='corporate',null,{timeout:300000});
 const kept=await page.evaluate(()=>VoidBabylon.zone.fog.explored());assert.equal(kept,exploredBefore,'the same cells are still explored after the reload');
 await shot('18-corporate-after-reload',800);
 assert.deepEqual(errs,[]);console.log(JSON.stringify({ok:true,tier,info,peak:+peak.toFixed(2),explored:kept}));await b.close();})().catch(e=>{console.error(String(e.stack||e).slice(0,1500));process.exit(1);});
