/* MILKED in a real browser: the building streams in from the plaza, the player walks in, meets Eva, sees the studios, biobank, lab and ops, meets Fish, uses the
   map and walks back out. Takes screenshots into SHOTS (default docs/development/milked/). SITE_TEST_URL=http://127.0.0.1:5187 node tests/milked-browser.cjs [low|high] */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',tier=process.argv[2]==='high'?'high':'low',shots=process.env.SHOTS||'docs/development/milked';
fs.mkdirSync(shots,{recursive:true});
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox']});
 const page=await b.newPage({viewport:{width:1280,height:720},serviceWorkers:'block'});page.setDefaultTimeout(300000);const errs=[];page.on('pageerror',e=>errs.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|net::ERR/.test(m.text()))errs.push('console: '+m.text());});
 await page.route('https://**/*',r=>r.abort());await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
 await page.addInitScript(q=>localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:q})),tier);
 await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started);
 await page.click('[data-action=menu-campaign]');await page.click('[data-action=menu-new]');const c=page.locator('[data-action=menu-new-confirm]');if(await c.count())await c.click();
 await page.waitForSelector('#character-creator.on');await page.waitForFunction(()=>!document.querySelector('[data-cc=confirm]').disabled);await page.locator('[data-cc=confirm]').click();
 await page.waitForFunction(()=>mode==='pod-waking'&&walker&&VoidAssets.pending===0);await page.locator('#pod-wake [data-pod=exit]').click();await page.waitForFunction(()=>mode==='walking');
 await page.evaluate(()=>{delete state.story.flags.area;return enterWalking(VoidDistrictArea.KEY.street,{silent:true});});await page.waitForFunction(()=>mode==='walking'&&walkingLocation?.area==='street');
 const at=(x,z,yaw=0,pitch=0)=>page.evaluate(([x,z,yaw,pitch])=>{Object.assign(walker,{x,z,yaw,pitch});},[x,z,yaw,pitch]);
 const shot=async(name,wait=900)=>{await page.waitForTimeout(wait);await page.screenshot({path:shots+'/'+name+'.png'});};
 const blocked=(x,z)=>page.evaluate(([x,z])=>VoidExplorer.blocked(x,z,walkingLocation),[x,z]);
 const EAST=Math.PI/2,WEST=-Math.PI/2,NORTH=0,SOUTH=Math.PI;
 // 1. it streams in as the player comes near, from the avenue
 await at(160,-12.5,EAST);await page.waitForFunction(()=>VoidNeoChinatown.city.live.has('milked'));
 assert.equal(await page.evaluate(()=>VoidNeoChinatown.city.live.has('milked')),true,'Milked is loaded within 90 m');
 await at(193,-12.5,EAST,.12);await page.waitForTimeout(1200);await shot('01-exterior');
 await at(204,-24,EAST-.55,.2);await shot('02-exterior-approach',300);
 // 2. the doorway is open and the lobby is walkable
 for(const [what,x,z] of [['the doorway',212,-12.5],['the lobby',218,-12.5],['in front of the desk',226.5,-12.5],['the streaming hall',222,3],['studio 1',218,11],['studio 2',230,11],['studio 3',242,11],['the ops room',243,2.5],['the biobank',241,-4],['the consultation room',245.5,-9],['the lab',241,-20],['Fish\'s office',223,-34]])assert.equal(await blocked(x,z),false,what+' is walkable');
 for(const [what,x,z] of [['the reception desk',229,-12.5],['the wall beside the door',212,-6],['the staff-only door',242.2,-26]])assert.equal(await blocked(x,z),true,what+' is solid');
 await at(213.5,-12.5,EAST);await shot('03-lobby',1500);
 await at(222,-12.5,EAST);
 await page.waitForFunction(()=>VoidNeoChinatown.city.live.get('milked')?.people?.some(p=>p.spawned&&p.role==='eva'),null,{timeout:280000}).catch(()=>{});
 await shot('04-reception-eva',1500);
 const people=await page.evaluate(()=>VoidNeoChinatown.city.live.get('milked').people.map(p=>({id:p.id,spawned:p.spawned})));
 // 3. Eva
 const eva=await page.evaluate(()=>walkingLocation.interactions.find(i=>i.id==='milked-eva'));assert.ok(eva,'Eva is an interaction');
 await page.evaluate(i=>VoidInteractions.handlers.get('milked-eva')({item:i}),eva);await page.waitForTimeout(400);
 const heading=await page.evaluate(()=>document.querySelector('.speaker h2')?.textContent);assert.equal(heading,'Eva');await shot('05-eva-dialogue',200);
 await page.evaluate(()=>{for(let i=0;i<6&&typeof speech!=='undefined'&&speech;i++)advanceSpeech();});await page.waitForFunction(()=>mode==='walking');
 // 4. streaming wing and the studios
 await at(223,2,NORTH);await shot('06-streaming-hall');
 for(const [n,x,z,yaw] of [[1,218,6.3,NORTH],[2,230,6.3,NORTH],[3,242,6.3,NORTH]]){await at(x,z,yaw);await shot('07-studio-'+n,1400);}
 await at(230,7,NORTH,-.05);await page.waitForTimeout(1000);
 const sc=await page.evaluate(()=>VoidNeoChinatown.city.live.get('milked').state());assert.ok(sc.screens>=15,'the displays are there');
 const st=await page.evaluate(()=>VoidInteractions.handlers.get('milked-studio')({item:{studio:2}}));assert.match(await page.evaluate(()=>document.getElementById('notice').textContent),/STUDIO 2/);
 await at(244,2.2,EAST);await shot('08-ops-room');
 // 5. biobank
 await at(237.5,-4,EAST);await shot('09-biobank-waiting',1200);
 await at(245.6,-7,SOUTH);await shot('10-consultation',600);
 await at(240,-14,SOUTH);await shot('11-lab',1200);await at(240,-15.5,EAST);await shot('11b-lab-cryo',500);
 await page.evaluate(()=>VoidInteractions.handlers.get('milked-staff')({item:{}}));assert.match(await page.evaluate(()=>document.getElementById('notice').textContent),/STAFF ONLY/);
 // 6. Fish
 await at(223,-32,SOUTH);
 await page.waitForFunction(()=>VoidNeoChinatown.city.live.get('milked')?.people?.some(p=>p.spawned&&p.role==='fish'),null,{timeout:280000}).catch(()=>{});
 await shot('12-fish-office',1500);
 const fish=await page.evaluate(()=>walkingLocation.interactions.find(i=>i.id==='milked-fish'));await page.evaluate(i=>VoidInteractions.handlers.get('milked-fish')({item:i}),fish);await page.waitForTimeout(400);
 assert.equal(await page.evaluate(()=>document.querySelector('.speaker h2')?.textContent),'Fish');await shot('13-fish-dialogue',200);
 await page.evaluate(()=>{for(let i=0;i<6&&typeof speech!=='undefined'&&speech;i++)advanceSpeech();});await page.waitForFunction(()=>mode==='walking');
 // 7. map
 await at(224,-12.5,EAST);await page.keyboard.press('KeyL');await page.waitForSelector('#personal-device.open');await page.locator('#personal-device [data-app=map]').click();await page.waitForSelector('#personal-device canvas.dm-canvas');
 const map=await page.evaluate(()=>{const m=VoidDistrictMap.model(VoidNeoChinatown);return {b:m.buildings.map(x=>x.name),p:m.pois.filter(x=>/^milked-|taxi-milked/.test(x.id)).map(x=>x.name)};});
 assert(map.b.some(n=>/^MILKED/.test(n)),'the building is on the map');assert(map.p.some(n=>/reception/.test(n))&&map.p.some(n=>/streaming/.test(n))&&map.p.some(n=>/biobank/.test(n))&&map.p.some(n=>/office/.test(n))&&map.p.some(n=>/Taxi stop/.test(n)),'named places and the taxi stop: '+map.p.join('|'));
 await page.evaluate(()=>{VoidDistrictMap.view&&Object.assign(VoidDistrictMap.view,{cx:226,cz:-14,s:6});});await shot('14-map',700);
 await page.keyboard.press('KeyL');await page.waitForFunction(()=>!document.querySelector('#personal-device.open'));
 // 8. taxi: Milked is a destination, with a fare under the cap; and the way back out is open
 const dest=await page.evaluate(()=>{const R=VoidTaxiRules;const l=R.destinations(state,{player:[60,-12.5],layout:walkingLocation}).find(d=>d.id==='milked');return l;});assert.ok(dest&&dest.ok&&dest.fare<=60&&!dest.placeholder,'sky cab destination: '+JSON.stringify(dest));
 // the sky cab really flies there: call it from the avenue, board, land on the Milked plaza, step out
 await at(45,-12.5,EAST);await page.waitForTimeout(800);const credits0=await page.evaluate(()=>state.credits);
 assert.equal(await page.evaluate(()=>VoidTaxi.request('milked')),true,'the cab can be called');
 // the software renderer is slow, so the long legs of the flight are shortened by moving the cab near the next point; every phase still runs
 const skip=()=>page.evaluate(()=>{const t=VoidTaxi.trip,c=VoidTaxi.cab;if(!t||!c)return null;t.skipped??={};if(t.skipped[t.phase])return t.phase;t.skipped[t.phase]=true;if(t.phase==='approach')c.root.position.set(t.pickup.position[0]-14,c.root.position.y,t.pickup.position[1]);if(t.phase==='cruise')c.root.position.set(t.to[0]-14,c.root.position.y,t.to[1]);return t.phase;});
 for(let i=0;i<200&&await page.evaluate(()=>VoidTaxi.trip?.phase!=='landed');i++){await skip();await page.waitForTimeout(1500);}
 await page.waitForTimeout(300);
 await page.evaluate(()=>VoidInteractions.handlers.get('taxi-board')({item:{}}));for(let i=0;i<300&&await page.evaluate(()=>VoidTaxi.trip?.phase!=='arrived');i++){await skip();await page.waitForTimeout(1500);}assert.equal(await page.evaluate(()=>VoidTaxi.trip?.phase),'arrived');
 const fare=credits0-await page.evaluate(()=>state.credits);assert.ok(fare>0&&fare<=60,'fare charged once, under the cap: '+fare);await shot('15-taxi-arrival',500);
 await page.evaluate(()=>VoidTaxi.exit());await page.waitForFunction(()=>mode==='walking');
 const out=await page.evaluate(()=>({x:walker.x,z:walker.z,live:VoidNeoChinatown.city.live.has('milked'),trip:state.story.flags.taxiTrip||null}));assert.ok(out.x>196&&out.x<212,'set down on the plaza: '+JSON.stringify(out));assert.equal(out.live,true);assert.equal(out.trip,null);
 await at(212,-12.5,WEST);assert.equal(await blocked(209,-12.5),false);assert.equal(await blocked(190,-12.5),false);
 await at(190,-12.5,WEST);await page.waitForTimeout(500);
 assert.equal(await page.evaluate(()=>mode),'walking');
 // 9. leaving unloads it again (beyond about 140 m)
 await at(40,-12.5,WEST);await page.waitForFunction(()=>!VoidNeoChinatown.city.live.has('milked'),null,{timeout:60000});
 assert.deepEqual(errs,[]);console.log(JSON.stringify({ok:true,tier,people,map:map.p.length,screens:sc.screens}));await b.close();})().catch(e=>{console.error(String(e.stack||e).slice(0,1200));process.exit(1);});
