/* MILKED in a real browser (16 Nov 2026: the inside is its own environment behind a security vestibule, like The Darknet District's).
   The player walks the real route in small steps (never through anything solid): the side street, the street doors, the vestibule, the exchange behind the
   loading card, reception, the hallway, the staff area, the rear lobby, the exchange again, the service alley, and back in through the front. Every frame is
   watched: the card may only be up while every door is shut, and an outer and an inner door are never open together. Screenshots go to SHOTS.
   SITE_TEST_URL=http://127.0.0.1:5187 CHROMIUM_PATH=... node tests/milked-browser.cjs [low|medium|high] */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',tier=['medium','high'].includes(process.argv[2])?process.argv[2]:'low',shots=process.env.SHOTS||path.join(os.tmpdir(),'milked-shots'),slow=tier==='low'?1:8;
fs.mkdirSync(shots,{recursive:true});
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox']});
 const page=await b.newPage({viewport:{width:1280,height:720},serviceWorkers:'block'});page.setDefaultTimeout(1200000);const errs=[];page.on('pageerror',e=>errs.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|net::ERR/.test(m.text()))errs.push('console: '+m.text());});
 const origin=new URL(base).origin;await page.route(u=>/^https:/.test(u.href)&&u.origin!==origin,r=>r.abort());await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
 await page.addInitScript(q=>localStorage.setItem('void-runner-graphics-v1',JSON.stringify({renderer:'babylon',quality:q,v:2,chosen:true})),tier);
 await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started);await page.evaluate(()=>Object.assign(VoidPreparation.limits,{scene:900000,assets:300000,optional:300000,area:900000,total:1500000}));
 await page.click('[data-action=menu-campaign]');await page.click('[data-action=menu-new]');const c=page.locator('[data-action=menu-new-confirm]');if(await c.count())await c.click();
 await page.waitForSelector('#character-creator.on');await page.waitForFunction(()=>!document.querySelector('[data-cc=confirm]').disabled);await page.locator('[data-cc=confirm]').click();
 await page.waitForFunction(()=>mode==='pod-waking'&&walker);await page.waitForTimeout(3000);await page.keyboard.press('KeyE');await page.waitForFunction(()=>mode==='walking');
 await page.evaluate(()=>{delete state.story.flags.area;return enterWalking(VoidDistrictArea.KEY.street,{silent:true,quarter:'far-south'});});await page.waitForFunction(()=>mode==='walking'&&walkingLocation?.area==='street'&&walkingLocation.quarter==='far-south');   // Milked moved to Far South on 16 Nov 2026
 // the save's flags, apart from the V1's explored-map bits (walking anywhere charts the map) , the in-game clock (game-clock.js: it runs while walking) and the V1's read marks (opening the V1 reads Admin's Mission 001 call)
 const flagsNow=()=>page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.entries(state.story.flags).filter(([k])=>!/^deviceMap|^gameMin$|^v1r_/.test(k)))));
 const saveBefore=await flagsNow(),mapBefore=await page.evaluate(()=>String(state.story.flags.deviceMapStreet||'').length);
 // Every coordinate below is in the building's OWN frame (as drawn: front wall z -74); DZ carries it to where it stands (VoidMilked.OFFSET, 16 Nov 2026). at, walk and blocked take and give that frame.
 const DZ=await page.evaluate(()=>VoidMilked.OFFSET[1]);
 const at=(x,z,yaw=0,pitch=0)=>page.evaluate(([x,z,yaw,pitch])=>{Object.assign(walker,{x,z,yaw,pitch,vx:0,vz:0});},[x,z+DZ,yaw,pitch]);
 const shot=async(name,wait=900)=>{await page.waitForTimeout(wait*slow);await page.screenshot({path:path.join(shots,name+'.jpg'),type:'jpeg',quality:82});};
 const blocked=(x,z)=>page.evaluate(([x,z])=>VoidExplorer.blocked(x,z,walkingLocation),[x,z+DZ]);
 // walk toward a point in small steps, the way a player moves: stops at anything solid. Returns where the walker ended up.
 const walk=(x,z)=>page.evaluate(async([tx,tzd,DZ])=>{const tz=tzd+DZ,step=.12;for(let i=0;i<900;i++){const dx=tx-walker.x,dz=tz-walker.z,d=Math.hypot(dx,dz);if(d<step){if(!VoidExplorer.blocked(tx,tz,walkingLocation)){walker.x=tx;walker.z=tz;}break;}const nx=walker.x+dx/d*step,nz=walker.z+dz/d*step;if(VoidExplorer.blocked(nx,nz,walkingLocation))break;walker.x=nx;walker.z=nz;walker.yaw=Math.atan2(dx,dz);if(i%3===2)await new Promise(r=>requestAnimationFrame(r));}return [+walker.x.toFixed(2),+(walker.z-DZ).toFixed(2)];},[x,z,DZ]);
 const reaches=async(x,z,what)=>{const p=await walk(x,z);assert.ok(Math.hypot(p[0]-x,p[1]-z)<.05,what+': walked to '+p+' instead of '+[x,z]);};
 const stops=async(x,z,what)=>{const p=await walk(x,z);assert.ok(Math.hypot(p[0]-x,p[1]-z)>.3,what+' should be solid, but the walker reached '+p);return p;};
 const doorsNow=()=>page.evaluate(()=>(walkingLocation?.area==='milked'?VoidBabylon.zone?.doors:VoidNeoChinatown.city?.live?.get('milked')?.doors)?.state()||null);
 const doorOpen=(id,want=true)=>page.waitForFunction(([id,want])=>{const d=(walkingLocation?.area==='milked'?VoidBabylon.zone?.doors:VoidNeoChinatown.city?.live?.get('milked')?.doors)?.state().find(d=>d.id===id);return !!d&&(want?d.open>=.8&&!d.blocking:d.open<=.02&&d.blocking);},[id,want],{timeout:300000});
 const EAST=Math.PI/2,WEST=-Math.PI/2,NORTH=0,SOUTH=Math.PI,MK=await page.evaluate(()=>{const L=VoidMilked.LOCAL;return {F:L.FOOTPRINT,D:L.DOOR,R:L.REAR,G:L.GATES,S:L.STUDIOS.map(s=>({n:s.n,room:L.ROOMS.find(r=>r.id===s.room).rect}))};});
 // Every frame from here on: the loading card is only ever up with every door shut, and an outer and an inner door are never open together.
 await page.evaluate(()=>{window.__mk={frames:0,bad:[]};const outer=new Set(['milked-door','milked-rear-door']);(function watch(){const st=(walkingLocation?.area==='milked'?VoidBabylon.zone?.doors:VoidNeoChinatown.city?.live?.get('milked')?.doors)?.state();
   if(st){__mk.frames++;const card=!!document.querySelector('#milked-transition.on'),open=st.filter(d=>d.open>.02);if(card&&open.length)__mk.bad.push('card up with '+open.map(d=>d.id+':'+d.open));if(open.some(d=>outer.has(d.id))&&open.some(d=>!outer.has(d.id)))__mk.bad.push('outer and inner open together: '+open.map(d=>d.id+':'+d.open));}requestAnimationFrame(watch);})();});
 const through=async(area,what)=>{await page.waitForFunction(a=>walkingLocation?.area===a&&mode==='walking'&&VoidMilkedGate.state==='COMPLETE'&&!document.querySelector('#milked-transition.on'),area,{timeout:900000});
  const h=await page.evaluate(()=>VoidMilkedGate.history);assert.deepEqual(h.slice(-7),['ENTRY_DOOR_CLOSING','SECURED','CHECK_IN','DESTINATION_LOADING','DESTINATION_READY','EXIT_DOOR_OPEN','COMPLETE'],what+': '+h.join(' > '));
  assert.ok((await page.evaluate(()=>VoidMilkedGate.sealed)).every(d=>d.open<=.02&&d.blocking),what+': every door was shut and solid when the room was sealed');};

 // 1. the street side: it streams in on the side street; the shopfront and the alley back are there, nothing of the inside is
 await at(63,-71.2,EAST);await page.waitForFunction(()=>VoidNeoChinatown.city.live.has('milked'));await shot('01-side-street-from-main-street',2500);
 await at(86.6,-69,Math.atan2(80.6-86.6,-74.5+69),.02);await shot('02-front');
 assert.equal(await page.evaluate(()=>VoidNeoChinatown.city.live.get('milked').state().area),'street');
 assert.equal(await page.evaluate(()=>walkingLocation.interactions.filter(i=>/^milked-/.test(i.id)).map(i=>i.id).join()),'milked-intercom','only the check-in reader exists on the street');
 // 2. closed doors and walls are solid: the player cannot walk through the front doors from across the street until they open, nor through the shopfront
 const st0=await doorsNow();assert.ok(st0.every(d=>d.open===0&&d.blocking),'all five doors start shut and solid: '+JSON.stringify(st0));assert.equal(await blocked(MK.D.x,MK.D.z),true,'the shut street doors are solid');
 await at(86.5,-71.5,SOUTH);await stops(86.5,-76,'the shopfront wall');await at(MK.D.x,-70.4,SOUTH);
 // 3. in through the front: the doors open as the player comes up, the inner doors never do on the street
 await reaches(MK.D.x,-72.2,'up to the doors');await doorOpen('milked-door');await reaches(MK.D.x,-74.6,'through the street doors');
 const inner=await stops(MK.D.x,-78.5,'the inner doors (from the street)');assert.ok(inner[1]>-76.7,'stopped at the inner doors: '+inner);
 assert.equal((await doorsNow()).find(d=>d.id==='milked-inner-door').locked,true);
 await page.evaluate(()=>{VoidMilkedTransition.TEXT.front.in.min=7000;});   // hold the card a little longer this once, so it can be photographed
 await walk(MK.D.x,-75.5);const card=await page.waitForFunction(()=>{const el=document.querySelector('#milked-transition.on');return el&&el.querySelector('.mt-card')?el.textContent:null;},null,{timeout:300000});
 assert.match(await card.jsonValue(),/MILKED.*VISITOR CHECK-IN/);await page.waitForTimeout(900);await page.screenshot({path:path.join(shots,'03-loading-card.jpg'),type:'jpeg',quality:82});
 await page.evaluate(()=>{VoidMilkedTransition.TEXT.front.in.min=1800;});
 await through('milked','in by the front');
 const pos=await page.evaluate(()=>[walker.x,walker.z]);assert.ok(Math.abs(pos[0]-MK.D.x)<.2&&Math.abs(pos[1]-DZ+75.5)<.2,'the player is in the same spot after the exchange: '+pos);
 assert.equal(await page.evaluate(()=>VoidBabylon.scene.meshes.some(m=>/^ncz-|^district-/.test(m.name))),false,'the street is not loaded while inside');
 assert.equal(await flagsNow(),saveBefore,'nothing was written to the save');
 await page.evaluate(()=>VoidBabylon.zone.doors.secure(true));await page.waitForTimeout(2500*slow);await at(MK.D.x,-74.55,SOUTH,-.03);await shot('04-vestibule',600);await page.evaluate(()=>VoidBabylon.zone.doors.secure(false));
 // 4. the street doors cannot be opened from inside; the inner doors open; reception, Eva
 await at(MK.D.x,-75.5,NORTH);const out=await stops(MK.D.x,-72,'the street doors (from inside)');assert.ok(out[1]<-74.2,'stopped at the street doors: '+out);
 await doorOpen('milked-inner-door');await reaches(MK.D.x,-78.4,'through the inner doors into reception');
 await page.waitForFunction(()=>VoidBabylon.zone.people.some(p=>p.spawned&&p.role==='eva'),null,{timeout:400000});await at(81.9,-77.7,Math.atan2(81.4-81.9,-81.5+77.7),-.03);await shot('05-reception-eva',1500);
 await stops(81.3,-82,'the reception desk');
 const eva=await page.evaluate(()=>walkingLocation.interactions.find(i=>i.id==='milked-eva'));assert.ok(eva,'Eva is an interaction');
 await page.evaluate(i=>VoidInteractions.handlers.get('milked-eva')({item:i}),eva);await page.waitForTimeout(400);
 assert.equal(await page.evaluate(()=>document.querySelector('.speaker h2')?.textContent),'Eva');
 await page.evaluate(()=>{for(let i=0;i<8&&typeof speech!=='undefined'&&speech;i++)advanceSpeech();});await page.waitForFunction(()=>mode==='walking');
 // 5. the hallway and the four studios: one dancer each, dancing, nobody else, never entered
 await at(84,-79,EAST);await reaches(84.6,-81.8,'to the door beside the desk');await reaches(86.4,-81.8,'into the hallway');
 await page.waitForFunction(()=>VoidBabylon.zone.people.filter(p=>p.spawned&&p.role==='dancer').length===4,null,{timeout:400000});await at(86,-81.8,EAST);await shot('06-studio-hallway',1500);
 const who=await page.evaluate(()=>VoidBabylon.zone.people.map(p=>({id:p.id,role:p.role,studio:p.studio||0,x:p.node.position.x,z:p.node.position.z,look:p.look,clip:p.clip,playing:!!p.node.metadata?.animationGroups?.some(g=>g.isPlaying)})));
 assert.equal(who.length,6,'Eva, Fish and four dancers: '+who.map(p=>p.id));
 for(const s of MK.S){const inRoom=who.filter(p=>p.x>s.room[0]&&p.x<s.room[1]&&p.z>s.room[2]&&p.z<s.room[3]);assert.equal(inRoom.length,1,'studio '+s.n+' has exactly one person');assert.equal(inRoom[0].role,'dancer');assert.equal(inRoom[0].studio,s.n);assert.match(inRoom[0].clip,/dance|^ac-/,'studio '+s.n+' is dancing: '+inRoom[0].clip);assert.ok(inRoom[0].playing,'the loop is playing');}
 assert.ok(new Set(who.filter(p=>p.role==='dancer').map(p=>p.look)).size>=3,'the dancers differ');assert.ok(new Set(who.filter(p=>p.role==='dancer').map(p=>p.clip)).size>=3,'and so do their dances');
 await at(87.2,-81.8,NORTH);await stops(87.2,-79,'a studio window');await at(88.95,-81.8,NORTH);await stops(88.95,-79,'a studio door');
 for(const [n,x,z,tx,tz] of [[1,87.2,-82.3,87.4,-77.5],[2,91.2,-82.3,91.4,-77.5],[3,87.8,-81.3,87.6,-85.5],[4,91.8,-81.3,91.6,-85.5]]){await at(x,z,Math.atan2(tx-x,tz-z),-.02);await shot('07-studio-'+n,1200);}
 await page.evaluate(()=>VoidInteractions.handlers.get('milked-studio')({item:{studio:2}}));assert.match(await page.evaluate(()=>document.getElementById('notice').textContent),/STUDIO 2 is ON AIR/);
 // E at each window keeps the ON AIR view and adds a transparent request menu with only real clips.
 await page.waitForSelector('#milked-animation-panel:not([hidden])');
 const menu=await page.evaluate(()=>{
  const p=document.querySelector('#milked-animation-panel'),z=VoidBabylon.zone;
  return {background:getComputedStyle(p).backgroundColor,heading:p.querySelector('h2').textContent,
   selected:[...p.querySelector('select').options].map(o=>o.value),valid:z.studioAnimations(2).clips};});
 assert.match(menu.heading,/STUDIO 2/);assert.equal(menu.background,'rgba(8, 12, 18, 0.64)');
 assert.deepEqual(menu.selected,menu.valid,'the dropdown matches the model currently loaded in Studio 2');
 if(menu.selected.length){
  await page.click('#milked-animation-panel .mk-request');
  assert.match(await page.locator('#milked-animation-panel .mk-result').textContent(),/REQUEST RECEIVED/);
  const active=await page.evaluate(()=>VoidBabylon.zone.people.find(p=>p.studio===2).request?.clip);
  assert.equal(active,menu.selected[0],'the request reaches the active animator');
 }
 await page.click('#milked-animation-panel .mk-close');assert.equal(await page.locator('#milked-animation-panel').isHidden(),true);
 await page.evaluate(()=>VoidInteractions.handlers.get('milked-studio')({item:{studio:1}}));
 await page.waitForSelector('#milked-animation-panel:not([hidden])');
 const shift=await page.evaluate(()=>({performer:VoidBabylon.zone.studioAnimations(1).performer,looks:VoidBabylon.zone.studioAnimations(1).clips}));
 assert.ok(['Lace','Reverie'].includes(shift.performer),'Studio 1 reads the on-shift model');
 assert.deepEqual(shift.looks,await page.locator('#milked-animation-choice option').evaluateAll(nodes=>nodes.map(n=>n.value)));
 await page.click('#milked-animation-panel .mk-close');
 // 6. the staff area: Fish in her office, the rear corridor
 // the STAFF ONLY door is locked until Eva lets the player through (Mission 003, 17 Nov 2026: story flag mf_milkedStaff); this walk-through grants it for the rest of the tour
 await at(92.6,-81.8,EAST);await stops(94.75,-81.8,'the locked staff-only door');assert.equal(await page.evaluate(()=>VoidBabylon.zone.state().staffDoor.blocking),true);
 await page.evaluate(()=>{state.story.flags.mf_milkedStaff=true;});await page.waitForFunction(()=>VoidBabylon.zone.state().staffDoor.blocking===false);await page.waitForTimeout(1200*slow);
 await at(92.6,-81.8,EAST);await reaches(94.75,-81.8,'through the staff door');await reaches(94.75,-78.6,'into Fish\'s office');
 await page.waitForFunction(()=>VoidBabylon.zone.people.some(p=>p.spawned&&p.role==='fish'),null,{timeout:400000});await at(94.3,-79.2,Math.atan2(97-94.3,-76.2+79.2),-.03);await shot('08-fish-office',1500);
 const fish=await page.evaluate(()=>walkingLocation.interactions.find(i=>i.id==='milked-fish'));await page.evaluate(i=>VoidInteractions.handlers.get('milked-fish')({item:i}),fish);await page.waitForTimeout(400);
 assert.equal(await page.evaluate(()=>document.querySelector('.speaker h2')?.textContent),'Fish');
 await page.evaluate(()=>{for(let i=0;i<6&&typeof speech!=='undefined'&&speech;i++)advanceSpeech();});await page.waitForFunction(()=>mode==='walking');
 await page.evaluate(()=>VoidInteractions.handlers.get('milked-cameras')({item:{}}));assert.match(await page.evaluate(()=>document.getElementById('notice').textContent),/REMOTE CAMERA CONTROLS/);
 await at(94.75,-80.4,SOUTH);await stops(97,-82.75,'a restroom door');await at(94.75,-80.4,SOUTH);await reaches(94.75,-86.4,'down the staff corridor');
 // 7. inside it is "Milked" for the camera and the music, taxis do not come indoors, the map still knows where the player is
 assert.equal(await page.evaluate(DZ=>VoidMilked.inside({x:89.5,z:-81.8+DZ})&&!VoidMilked.inside({x:89.5,z:-71+DZ}),DZ),true);
 assert.equal(await page.evaluate(()=>VoidMusicDirector.streetZones.find(q=>walker.x>=q.rect[0]&&walker.x<=q.rect[1]&&walker.z>=q.rect[2]&&walker.z<=q.rect[3])?.style),'milked','the music and the camera\'s place label read the same footprint');
 const taxi=await page.evaluate(()=>typeof VoidTaxi!=='undefined'?VoidTaxi?.status?.()||null:null);   // (the sky cabs are gone since the quarters: nothing to check unless it exists)if(taxi)assert.ok(!taxi.ok&&/Milked/.test(taxi.reason),'no cab indoors: '+JSON.stringify(taxi));
 await page.keyboard.press('KeyL');await page.waitForSelector('#personal-device.open');
 // the V1 opens on an app that has news for the player (Admin's Mission 001 call since 17 Nov 2026): back to the home screen first
 for(let i=0;i<4&&await page.locator('#personal-device [data-do=back]:not([hidden])').count();i++){await page.locator('#personal-device [data-do=back]').click();await page.waitForTimeout(600);}
 await page.locator('#personal-device [data-app=map]').click();await page.waitForSelector('#personal-device canvas.dm-canvas');
 const map=await page.evaluate(()=>{const m=VoidDistrictMap.model(VoidNeoChinatown);return {b:m.buildings.filter(x=>x.id==='milked').map(x=>x.name+'@'+x.rect.join(',')),p:m.pois.filter(x=>/^milked-|taxi-milked/.test(x.id)).map(x=>x.name),s:m.streets.map(s=>s.name)};});
 assert.ok(map.b.length===1&&/^MILKED/.test(map.b[0])&&map.b[0].endsWith('@'+(await page.evaluate(()=>VoidMilked.FOOTPRINT)).join(',')),'the building is on the map where it stands: '+map.b);
 for(const k of [/reception/,/studio hallway/,/office/,/rear door/,/Taxi stop/])assert.ok(map.p.some(n=>k.test(n)),k+' in '+map.p.join('|'));assert.ok(map.s.some(n=>/Side street/.test(n))&&map.s.some(n=>/Service alley/.test(n)));
 await shot('09-map',700);await page.keyboard.press('KeyL');await page.waitForFunction(()=>!document.querySelector('#personal-device.open'));
 // 8. out by the rear lobby: its north door opens, the alley door does not; the exchange; then the alley door opens onto the service alley
 await doorOpen('milked-lobby-north');await reaches(94.75,-88.7,'into the rear lobby');
 await page.waitForSelector('#milked-transition.on',{timeout:300000});await through('street','out by the rear');
 assert.equal(await page.evaluate(()=>!!VoidBabylon.zone),false,'the interior is released');await page.waitForFunction(()=>VoidNeoChinatown.city.live.has('milked'));
 await at(94.75,-88.7,SOUTH);await shot('10-rear-lobby-alley-door',1500);
 const n2=await stops(94.75,-85,'the lobby\'s north door (from the street side)');assert.ok(n2[1]<-87.6,'stopped at the north door: '+n2);
 await at(94.75,-88.7,SOUTH);await doorOpen('milked-rear-door');await reaches(94.75,-91.6,'out into the service alley');await reaches(72,-91.8,'along the alley to Main Street');
 await at(94.75,-93,NORTH,-.12);await shot('11-rear-door-from-the-alley',1200);
 // 9. and back in through the front, then in by the rear: both ways work in both directions
 await at(MK.D.x,-72,SOUTH);await doorOpen('milked-door');await reaches(MK.D.x,-75.5,'into the vestibule again');await page.waitForSelector('#milked-transition.on',{timeout:300000});await through('milked','in by the front again');
 await at(84,-79,NORTH);await page.waitForTimeout(500);await at(MK.D.x,-78.2,NORTH);await doorOpen('milked-inner-door');await reaches(MK.D.x,-75.5,'back into the vestibule');await page.waitForSelector('#milked-transition.on',{timeout:300000});await through('street','out by the front');
 await at(MK.D.x,-75.5,NORTH);await doorOpen('milked-door');await reaches(MK.D.x,-71.5,'out onto the side street');
 await at(94.75,-92,NORTH);await doorOpen('milked-rear-door');await reaches(94.75,-88.7,'into the rear lobby from the alley');await page.waitForSelector('#milked-transition.on',{timeout:300000});await through('milked','in by the rear');
 await doorOpen('milked-lobby-west');await at(94.75,-88.9,WEST);await reaches(92,-89,'through the lobby\'s west door into the rear corridor');await at(92.8,-89,WEST);await shot('12-rear-corridor',1500);
 await stops(80,-89.4,'the laundry cart');await reaches(84,-88.55,'round the laundry cart');await reaches(79.95,-88.55,'along the rear corridor');await reaches(79.95,-86,'into dressing room A');await at(83.6,-89,NORTH);await stops(83.6,-86.5,'dressing room B');
 // 10. nothing leaked, nothing saved, no errors
 const st=await page.evaluate(()=>VoidBabylon.zone.state());assert.ok(st.ready&&st.area==='milked'&&st.screens>=14&&st.doors.length===5,JSON.stringify(st));
 const w=await page.evaluate(()=>window.__mk);assert.ok(w.frames>50,'the door watch ran: '+w.frames);assert.deepEqual([...new Set(w.bad)].slice(0,5),[],'door rules held on every frame');
 assert.equal(await page.evaluate(()=>{delete state.story.flags.mf_milkedStaff;return JSON.stringify(Object.fromEntries(Object.entries(state.story.flags).filter(([k])=>!/^deviceMap|^gameMin$|^v1r_/.test(k))));}),saveBefore,'still nothing written to the save (the staff flag this test granted aside)');assert.ok(await page.evaluate(()=>String(state.story.flags.deviceMapStreet||'').length)>=mapBefore,'the explored-street map is not replaced by a smaller one (the inside is charted on the street\'s grid)');
 assert.equal(await page.evaluate(()=>VoidDistrictArea.keyFor(state)),'sacramento','a game saved in here resumes on the street side (and wakes in the Sleeping Pod)');
 assert.deepEqual(errs,[],'no page errors: '+errs.join(' | '));
 console.log('MILKED browser walk-through passed ('+tier+'), '+w.frames+' frames watched. Screenshots: '+shots);await b.close();
})().catch(e=>{console.error(e);process.exit(1);});
