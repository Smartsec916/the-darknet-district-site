/* MILKED in a real browser (the 16 Nov 2026 redesign): the small studio on the side street off Main Street. It streams in, the player walks the whole route
   (side street, double doors, vestibule, reception, the door beside the desk, the studio hallway, the staff area, the rear door, the service alley, Main Street),
   meets Eva and Fish, looks into the four studios (exactly one dancer each, never entered) and opens the map. Screenshots go to SHOTS (default: a temp folder).
   SITE_TEST_URL=http://127.0.0.1:5187 node tests/milked-browser.cjs [low|medium|high] */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',tier=['medium','high'].includes(process.argv[2])?process.argv[2]:'low',shots=process.env.SHOTS||path.join(os.tmpdir(),'milked-shots');
fs.mkdirSync(shots,{recursive:true});
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox']});
 const page=await b.newPage({viewport:{width:1280,height:720},serviceWorkers:'block'});page.setDefaultTimeout(900000);const errs=[];page.on('pageerror',e=>errs.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|net::ERR/.test(m.text()))errs.push('console: '+m.text());});
 const origin=new URL(base).origin;await page.route(u=>/^https:/.test(u.href)&&u.origin!==origin,r=>r.abort());await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
 await page.addInitScript(q=>localStorage.setItem('void-runner-graphics-v1',JSON.stringify({renderer:'babylon',quality:q,v:2,chosen:true})),tier);
 await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started);await page.evaluate(()=>Object.assign(VoidPreparation.limits,{scene:900000,assets:300000,optional:300000,total:1500000}));
 await page.click('[data-action=menu-campaign]');await page.click('[data-action=menu-new]');const c=page.locator('[data-action=menu-new-confirm]');if(await c.count())await c.click();
 await page.waitForSelector('#character-creator.on');await page.waitForFunction(()=>!document.querySelector('[data-cc=confirm]').disabled);await page.locator('[data-cc=confirm]').click();
 await page.waitForFunction(()=>mode==='pod-waking'&&walker);await page.waitForTimeout(3000);await page.evaluate(()=>document.querySelector('#pod-wake [data-pod=exit]').click());await page.waitForFunction(()=>mode==='walking');
 await page.evaluate(()=>{delete state.story.flags.area;return enterWalking(VoidDistrictArea.KEY.street,{silent:true});});await page.waitForFunction(()=>mode==='walking'&&walkingLocation?.area==='street');
 const at=(x,z,yaw=0,pitch=0)=>page.evaluate(([x,z,yaw,pitch])=>{Object.assign(walker,{x,z,yaw,pitch});},[x,z,yaw,pitch]);
 const shot=async(name,wait=900)=>{await page.waitForTimeout(wait);await page.screenshot({path:path.join(shots,name+'.jpg'),type:'jpeg',quality:82});};
 const blocked=(x,z)=>page.evaluate(([x,z])=>VoidExplorer.blocked(x,z,walkingLocation),[x,z]);
 const live=()=>page.evaluate(()=>VoidNeoChinatown.city.live.get('milked')?.state()||null);
 const EAST=Math.PI/2,WEST=-Math.PI/2,NORTH=0,SOUTH=Math.PI,MK=await page.evaluate(()=>({F:VoidMilked.FOOTPRINT,D:VoidMilked.DOOR,R:VoidMilked.REAR,S:VoidMilked.STUDIOS.map(s=>({n:s.n,room:VoidMilked.ROOMS.find(r=>r.id===s.room).rect}))}));
 // 1. it is on the side street off Main Street and streams in there; nothing is left at the old site
 await at(63,-71.2,EAST);await page.waitForFunction(()=>VoidNeoChinatown.city.live.has('milked'));await shot('01-side-street-from-main-street',2500);
 assert.ok(await page.evaluate(()=>!VoidBabylon.scene.meshes.some(m=>/^milked/.test(m.name)&&m.getBoundingInfo().boundingBox.centerWorld.x>150)),'nothing of Milked is at the east end of the avenue');
 await at(84,-69,SOUTH-.2,-.08);await shot('02-front');
 // 2. the walk-through is open, and the walls, the desk and the closed rooms are solid
 const route=[['the side street',75,-71],['the front doors',MK.D.x,MK.D.z],['the vestibule',MK.D.x,-75.3],['the inner doors',MK.D.x,-76.6],['reception',84,-79],['the door beside the desk',85.5,-81.8],['the hallway',89.5,-81.8],['the staff door',93.5,-81.8],['the staff corridor',94.75,-85],['Fish\'s office',95,-77.5],['dressing room A',80,-86],['the rear door',MK.R.x,MK.R.z],['the service alley',90,-91.8],['the alley mouth',72,-91.8],['Main Street',66,-91.8]];
 for(const [what,x,z] of route)assert.equal(await blocked(x,z),false,what+' is walkable');
 for(const [what,x,z] of [['the wall beside the front doors',79,-74],['the reception desk',81.3,-80.6],['a studio window',87.2,-80.8],['a studio door',88.95,-80.8],['dressing room B',83.6,-88],['a restroom door',96,-82.75],['the old plaza',206,-12.5]])assert.equal(await blocked(x,z),true,what+' is solid');
 // 3. the doors slide open as the player comes up to them
 await at(MK.D.x,-71.6,SOUTH);await page.waitForFunction(()=>VoidNeoChinatown.city.live.get('milked').doors[0].k>.9,null,{timeout:120000});const doors=await page.evaluate(()=>VoidNeoChinatown.city.live.get('milked').doors.map(d=>+d.k.toFixed(2)));assert.ok(doors.slice(0,2).every(k=>k>.9),'the front doors are open: '+doors);assert.ok(doors[doors.length-1]<.1,'the far doors are shut');
 await at(MK.D.x,-74.7,SOUTH);await shot('03-vestibule',1500);
 // 4. reception: Eva behind the desk
 await at(MK.D.x,-77.4,SOUTH);await page.waitForFunction(()=>VoidNeoChinatown.city.live.get('milked')?.people?.some(p=>p.spawned&&p.role==='eva'),null,{timeout:280000});await shot('04-reception-eva',1500);
 const eva=await page.evaluate(()=>walkingLocation.interactions.find(i=>i.id==='milked-eva'));assert.ok(eva,'Eva is an interaction');
 await page.evaluate(i=>VoidInteractions.handlers.get('milked-eva')({item:i}),eva);await page.waitForTimeout(400);
 assert.equal(await page.evaluate(()=>document.querySelector('.speaker h2')?.textContent),'Eva');
 await page.evaluate(()=>{for(let i=0;i<8&&typeof speech!=='undefined'&&speech;i++)advanceSpeech();});await page.waitForFunction(()=>mode==='walking');
 // 5. the hallway and the four studios: one dancer each, dancing, nobody else, and nobody ever inside but them
 await at(86.2,-81.8,EAST);await page.waitForFunction(()=>VoidNeoChinatown.city.live.get('milked').people.filter(p=>p.spawned&&p.role==='dancer').length===4,null,{timeout:280000});await shot('05-studio-hallway',1500);
 const who=await page.evaluate(()=>VoidNeoChinatown.city.live.get('milked').people.map(p=>({id:p.id,role:p.role,studio:p.studio||0,x:p.node.position.x,z:p.node.position.z,look:p.look,clip:p.clip,playing:!!p.node.metadata?.animationGroups?.some(g=>g.isPlaying)})));
 assert.equal(who.length,6,'Eva, Fish and four dancers: '+who.map(p=>p.id));
 for(const s of MK.S){const inRoom=who.filter(p=>p.x>s.room[0]&&p.x<s.room[1]&&p.z>s.room[2]&&p.z<s.room[3]);assert.equal(inRoom.length,1,'studio '+s.n+' has exactly one person');assert.equal(inRoom[0].role,'dancer');assert.equal(inRoom[0].studio,s.n);assert.match(inRoom[0].clip,/dance|^ac-/,'studio '+s.n+' is dancing: '+inRoom[0].clip);assert.ok(inRoom[0].playing,'the loop is playing');}
 assert.ok(new Set(who.filter(p=>p.role==='dancer').map(p=>p.look)).size>=3,'the dancers differ');
 for(const [n,x,z,yaw] of [[1,87.2,-82.2,NORTH],[2,91.2,-82.2,NORTH],[3,87.8,-81.4,SOUTH],[4,91.8,-81.4,SOUTH]]){await at(x,z,yaw);await shot('06-studio-'+n,1200);}
 await page.evaluate(()=>VoidInteractions.handlers.get('milked-studio')({item:{studio:2}}));assert.match(await page.evaluate(()=>document.getElementById('notice').textContent),/STUDIO 2 is ON AIR/);
 // 6. the staff area: Fish in his office, the camera controls, the rear door
 await at(94.75,-79.2,NORTH+.35);await page.waitForFunction(()=>VoidNeoChinatown.city.live.get('milked')?.people?.some(p=>p.spawned&&p.role==='fish'),null,{timeout:280000});await shot('07-fish-office',1500);
 const fish=await page.evaluate(()=>walkingLocation.interactions.find(i=>i.id==='milked-fish'));await page.evaluate(i=>VoidInteractions.handlers.get('milked-fish')({item:i}),fish);await page.waitForTimeout(400);
 assert.equal(await page.evaluate(()=>document.querySelector('.speaker h2')?.textContent),'Fish');
 await page.evaluate(()=>{for(let i=0;i<6&&typeof speech!=='undefined'&&speech;i++)advanceSpeech();});await page.waitForFunction(()=>mode==='walking');
 await page.evaluate(()=>VoidInteractions.handlers.get('milked-cameras')({item:{}}));assert.match(await page.evaluate(()=>document.getElementById('notice').textContent),/REMOTE CAMERA CONTROLS/);
 await at(94.75,-86,SOUTH);await shot('08-staff-corridor-rear-door',1200);
 await at(94.75,-93,NORTH,-.12);await shot('09-rear-door-from-the-alley',1200);await at(97.5,-91.8,WEST);await shot('10-service-alley',800);
 // 7. inside counts as indoors for the music, and the state reports what is there
 assert.equal(await page.evaluate(()=>VoidMilked.inside({x:89.5,z:-81.8})&&!VoidMilked.inside({x:89.5,z:-71})),true);
 const st=await live();assert.ok(st.ready&&st.people===6&&st.dancers.length===4&&st.screens>=8&&st.doors>=6,JSON.stringify(st));
 // 8. the map names it, on the side street
 await at(84,-79,EAST);await page.keyboard.press('KeyL');await page.waitForSelector('#personal-device.open');await page.locator('#personal-device [data-app=map]').click();await page.waitForSelector('#personal-device canvas.dm-canvas');
 const map=await page.evaluate(()=>{const m=VoidDistrictMap.model(VoidNeoChinatown);return {b:m.buildings.filter(x=>x.id==='milked').map(x=>x.name+'@'+x.rect.join(',')),p:m.pois.filter(x=>/^milked-|taxi-milked/.test(x.id)).map(x=>x.name),s:m.streets.map(s=>s.name)};});
 assert.ok(map.b.length===1&&/^MILKED/.test(map.b[0])&&map.b[0].endsWith('@'+MK.F.join(',')),'the building is on the map where it stands: '+map.b);
 for(const k of [/reception/,/studio hallway/,/office/,/rear door/,/Taxi stop/])assert.ok(map.p.some(n=>k.test(n)),k+' in '+map.p.join('|'));assert.ok(!map.p.some(n=>/biobank|streaming wing/i.test(n)));assert.ok(map.s.some(n=>/Side street/.test(n))&&map.s.some(n=>/Service alley/.test(n)));
 await page.evaluate(()=>{VoidDistrictMap.view&&Object.assign(VoidDistrictMap.view,{cx:86,cz:-80,s:9});});await shot('11-map',700);
 await page.keyboard.press('KeyL');await page.waitForFunction(()=>!document.querySelector('#personal-device.open'));
 // 9. the sky cab lists it and lands on Main Street; leaving unloads the building again (beyond about 140 m)
 const dest=await page.evaluate(()=>{const d=VoidTaxiRules.destinations(state,{player:[40,-12.5],layout:walkingLocation}).find(d=>d.id==='milked'),z=VoidNeoChinatown.taxiZones.find(z=>z.id==='milked');return {d,z:z.position};});
 assert.ok(dest.d&&dest.d.ok&&dest.d.fare<=60&&!dest.d.placeholder,'sky cab destination: '+JSON.stringify(dest.d));assert.ok(dest.z[0]>51&&dest.z[0]<71,'the stop is on Main Street');
 await at(-60,-12.5,WEST);await page.waitForFunction(()=>!VoidNeoChinatown.city.live.has('milked'),null,{timeout:60000});
 assert.deepEqual(errs,[],'no page errors: '+errs.join(' | '));
 console.log('MILKED browser walk-through passed ('+tier+'). Screenshots: '+shots);await b.close();
})().catch(e=>{console.error(e);process.exit(1);});
