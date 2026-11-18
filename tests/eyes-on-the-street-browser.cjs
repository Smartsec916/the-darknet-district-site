/* MISSION 002 — EYES ON THE STREET in the real game (Chromium, software GL, offline: every API call refused, so the shipped missions are in force).
   The whole flow at 1366x768 and 1920x1080: a new character finishes Awakening (EXIT POD, Admin's call, talk to Admin) → Admin's in-person offer: NOT NOW, then talking
   again and ACCEPT → Mission Log "Eyes on the Street", tracked, the yellow arrow out through the District's vestibule and then to NULL's door → walking into NULL brings
   Admin's Comms call (the owner's six lines) → Juno Vex at the bar talking with Halden Reyes, the yellow marker over the pair, and the hints (open the V1 / Camera / take
   the picture) → a photo of the wrong person, a photo of Juno ALONE (Halden out of the frame: does not count), then a valid photo of both (left click in the camera; the
   camera tags both by name) → Messages > Admin's conversation: ATTACH the wrong photo, SEND → "That's not the person...", the same for Juno alone, ATTACH the right photo, SEND → "Received..." → back to Admin in the District → "Not bad..." and the reward (100 credits, better standing with Admin), paid once.
   Usage: node tests/eyes-on-the-street-browser.cjs   (its own static server on a free port; SITE_TEST_URL to use another; SHOTS=dir; BROWSER_EXECUTABLE=path; SIZES=1366;
   QUALITY=low|medium|high) */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const shots=process.env.SHOTS||path.resolve(__dirname,'..','docs/development/eyes-on-the-street');fs.mkdirSync(shots,{recursive:true});
const bundled=['/opt/pw-browsers/chromium','/opt/pw-browsers/chromium-1243/chrome-linux64/chrome'].find(f=>fs.existsSync(f)),exe=process.env.BROWSER_EXECUTABLE||bundled||null;
const sizes=(process.env.SIZES||'1366,1920').split(',').map(w=>w==='1920'?[1920,1080]:[1366,768]),quality=process.env.QUALITY||'low';
const ID='m002-eyes-on-the-street';
const OFFER=['I heard you\'re looking for work.','Before I trust you with anything important, I need you to do a little reconnaissance.','Head outside. Across the street, you\'ll find a nightclub called NULL. There\'s someone hanging out in there I need you to take their picture so I can scrape it for more data','I\'ll mark their location'];
const CALL=['Your V1 has a camera. Press L to open your device, then select the Camera app.','Point it at the target. Your device should identify them automatically.','Left click will take a picture','You can also zoom with the camera by using the mouse wheel','Once you\'ve taken the photograph, open Messages, select my conversation, attach the photograph, and send it to me.','Nothing complicated. Just keep your eyes open.'];
function serve(){const root=path.resolve(__dirname,'..'),types={'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.ogg':'audio/ogg','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.glb':'model/gltf-binary'};
 const srv=http.createServer((req,res)=>{let f;try{f=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));}catch{res.writeHead(400);return res.end();}if(!f.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);return res.end();}res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(d);});});
 return new Promise(r=>srv.listen(0,'127.0.0.1',()=>r(srv)));}
(async()=>{
 const srv=process.env.SITE_TEST_URL?null:await serve(),base=process.env.SITE_TEST_URL||'http://127.0.0.1:'+srv.address().port;
 const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader','--no-sandbox','--autoplay-policy=no-user-gesture-required'],...(exe?{executablePath:exe}:{})});
 const log=m=>console.log(new Date().toISOString().slice(11,19),m);
 try{
  for(const [W,H] of sizes){
   const ctx=await browser.newContext({viewport:{width:W,height:H},serviceWorkers:'block'}),page=await ctx.newPage();page.setDefaultTimeout(300000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
   const shot=async n=>{await page.screenshot({path:path.join(shots,n+'-'+W+'.png')});};
   await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));await page.route('**/api/**',r=>r.fulfill({status:503,contentType:'application/json',body:'{}'}));
   await page.addInitScript(q=>{if(!sessionStorage.getItem('i')){localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:q,v:2,chosen:true}));sessionStorage.setItem('i','1');}},quality);
   await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started);
   await page.evaluate(()=>Object.assign(VoidPreparation.limits,{scene:600000,assets:600000,optional:300000,total:1200000,module:600000,artwork:300000}));
   log(W+'x'+H+' · new character');
   await page.click('[data-action=menu-campaign]');await page.click('[data-action=menu-new]');{const c=page.locator('[data-action=menu-new-confirm]');if(await c.count())await c.click();}
   await page.waitForSelector('#character-creator.on');await page.waitForFunction(()=>!document.querySelector('[data-cc=confirm]').disabled);await page.locator('[data-cc=confirm]').click();
   await page.waitForFunction(()=>mode==='pod-waking'&&walker&&!document.getElementById('pod-wake').hidden,null,{timeout:300000});
   await page.waitForFunction(()=>VoidAssets.pending===0,null,{timeout:300000});await page.waitForTimeout(800);await page.keyboard.press('KeyE');await page.waitForFunction(()=>mode==='walking'&&walker,null,{timeout:300000});
   await page.evaluate(()=>{VoidV1.bannerMs=600000;VoidV1.callTail=600000;window.__said=[];const a=announce;announce=function(t){window.__said.push(String(t));return a.apply(this,arguments);};});
   const S=()=>page.evaluate(id=>({mode,credits:state.credits,tracked:state.universe.trackedMission,rec:state.universe.missions[id]||null,rel:state.story.relationships||{},hint:VoidMissionGuide.hint,
    log:VoidMissions.all(state,C).filter(m=>m.id===id).map(m=>({title:m.title,objective:m.objective,tracked:m.tracked,completed:m.completed}))}),ID);
   const useE=async id=>{const ok=await page.evaluate(id=>{const it=walkingLocation.interactions.find(i=>i.id===id);if(!it)return false;const inside=(x,z)=>walkingLocation.solids.some(o=>o.position&&o.size&&Math.abs(x-o.position[0])<o.size[0]/2+.35&&Math.abs(z-o.position[2])<o.size[2]/2+.35);
    for(const d of [1.6,1.3,1.9,1.0,2.1,.7])for(let a=0;a<16;a++){const ang=a*Math.PI/8,x=it.position[0]+Math.sin(ang)*d,z=it.position[2]+Math.cos(ang)*d,yaw=Math.atan2(it.position[0]-x,it.position[2]-z);if(inside(x,z))continue;
     if(VoidExplorer.select({x,z,yaw},walkingLocation,i=>!i.when||VoidStory.matches(state,i.when))?.id===id){Object.assign(walker,{x,z,yaw,pitch:0,vx:0,vz:0});return true;}}return false;},id);
    assert(ok,'a spot where '+id+' can be used exists');await page.waitForTimeout(1200);await page.keyboard.press('KeyE');await page.waitForTimeout(1500);};
   // the conversation window: show every line to the last one (the choice buttons sit beside the main button there)
   const toLast=()=>page.evaluate(()=>{let n=0;while(speech&&(speech.index<speech.lines.length-1||speech.shown<speech.lines[speech.index].text.length)&&n++<40)advanceSpeech();return speech?{lines:speech.lines.map(l=>l.text),who:speech.lines[0].who,main:document.getElementById('speech-next')?.textContent,choices:[...document.querySelectorAll('[data-talk-choice]')].map(b=>b.textContent)}:null;});
   const way=()=>page.evaluate(()=>({wp:typeof trackedWalkWaypoint!=='undefined'&&trackedWalkWaypoint?{p:trackedWalkWaypoint.position,label:trackedWalkWaypoint.label||''}:null,g:VoidMissions.guidance(state,VoidMissions.tracked(state,C),true),area:walkingLocation.area}));
   // ---- finish Mission 001 (its own browser test covers it in detail)
   await page.waitForFunction(()=>!!state.universe.missions['m001-awakening']?.acquired);
   await page.keyboard.press('KeyL');await page.waitForFunction(()=>VoidPersonalDevice.app==='comms'&&!VoidPersonalDevice.busy);await page.locator('[data-hangup]').dispatchEvent('click');await page.waitForSelector('#personal-device [data-call-live].ended');await page.keyboard.press('KeyL');await page.waitForFunction(()=>!VoidPersonalDevice.isOpen);
   await useE('admin');await page.waitForFunction(()=>state.universe.missions['m001-awakening']?.completed===true);await page.evaluate(()=>{try{resumeWalking();}catch{}});await page.waitForFunction(()=>mode==='walking');
   // ---- the offer: NOT NOW, then again and ACCEPT
   log('offer');await useE('admin');
   let d=await toLast();assert.ok(d,'Admin offers it in person');assert.deepEqual(d.lines,OFFER,'The owner\'s four lines, verbatim');assert.equal(d.main,'ACCEPT');assert.deepEqual(d.choices,['NOT NOW']);
   await shot('offer');
   await page.locator('[data-talk-choice]').dispatchEvent('click');await page.waitForFunction(()=>mode==='walking'&&!speech);
   let s=await S();assert.equal(s.rec,null,'NOT NOW takes nothing');assert.deepEqual(s.log,[]);
   await useE('admin');d=await toLast();assert.deepEqual(d.lines,OFFER,'declining returns later: offered again');
   await page.locator('#speech-next').dispatchEvent('click');await page.waitForFunction(id=>!!state.universe.missions[id]?.acquired,ID);await page.waitForFunction(()=>mode==='walking');
   s=await S();log(JSON.stringify(s));assert.equal(s.tracked,ID);assert.deepEqual(s.log,[{title:'Eyes on the Street',objective:'Go to NULL, across the street.',tracked:true,completed:false}]);
   assert.ok((await page.evaluate(()=>window.__said.join(' | '))).includes('NEW MISSION · Eyes on the Street'));
   await page.evaluate(()=>VoidPersonalDevice.openApp('missions'));await page.waitForFunction(()=>VoidPersonalDevice.app==='missions'&&!VoidPersonalDevice.busy);
   const card=await page.locator('#personal-device [data-mission-number="2"]').innerText();assert.match(card,/^Eyes on the Street/);assert.ok(!/002/.test(card),'players never see the number');assert.match(card,/TRACKED/);assert.match(card,/○ Go to NULL, across the street\./);
   await shot('mission-log');await page.keyboard.press('KeyL');await page.waitForFunction(()=>!VoidPersonalDevice.isOpen);
   // ---- the arrow: out through the vestibule, then to NULL's door
   let w=await way();assert.deepEqual(w.g,{kind:'local',label:'Go to NULL, across the street.',place:'null'});assert.equal(w.area,'interior');
   // the goal is NULL's door; the arrow's route leads out through the District's inner door, the vestibule and the outer door first (guide-route.js, 17 Nov 2026)
   assert.deepEqual(w.wp.p,await page.evaluate(()=>VoidPlaces.target('null')),'the goal is NULL\'s door');
   await page.evaluate(()=>{const [x,z]=VoidNeoChinatown.toWorld(0,32);Object.assign(walker,{x,z,yaw:0,pitch:0});const [vx,vz]=VoidNeoChinatown.toWorld(0,23);walker.yaw=Math.atan2(vx-walker.x,vz-walker.z);});await page.waitForTimeout(1500);
   const live=await page.evaluate(()=>VoidGuideRoute.live);assert.deepEqual(live.route.slice(0,3),['district-inner-door<','district-door<','district-door<+'],'inside the District the arrow leads out through the vestibule first');assert.equal(live.waypoint,'district-inner-door<');await shot('arrow-vestibule');
   log('to the street');await page.evaluate(async()=>{state.location='earth';delete state.story.flags.area;await enterWalking(VoidDistrictArea.KEY.street,{silent:true,quarter:'oldtown'});});
   await page.waitForFunction(()=>mode==='walking'&&walkingLocation?.area==='street');await page.evaluate(()=>{Object.assign(walker,{x:66,z:-58.5,yaw:-Math.PI/2,pitch:0});});await page.waitForTimeout(1500);
   w=await way();const door=await page.evaluate(()=>VoidPlaces.target('null'));assert.deepEqual(w.wp.p,door,'on the street the arrow leads to NULL\'s door');
   await page.waitForFunction(()=>VoidNightclub&&VoidNeoChinatown&&true);await page.waitForTimeout(3000);await shot('arrow-null');
   assert.equal((await S()).rec.objectives['enter-null'],undefined,'not yet: the street is not NULL');
   // ---- into NULL: the step completes and Admin calls
   log('into NULL');await page.evaluate(()=>{Object.assign(walker,{x:49,z:-58.5});});await page.waitForTimeout(700);await page.evaluate(()=>{Object.assign(walker,{x:44,z:-57.5,yaw:-Math.PI/2});});
   await page.waitForFunction(id=>state.universe.missions[id]?.objectives['enter-null']===true,ID,{timeout:30000});
   await page.waitForSelector('#pd-notify.on:not(.away)',{timeout:30000});const banner=(await page.locator('#pd-notify').innerText()).replace(/\s+/g,' ').trim();
   assert.equal(banner,'V1 · Incoming call from ADMIN · Press L to answer','the V1 notification, with the player\'s own key');await shot('call-banner');
   await page.keyboard.press('KeyL');await page.waitForFunction(()=>VoidPersonalDevice.app==='comms'&&!VoidPersonalDevice.busy);const call=page.locator('#personal-device [data-call-live]');await call.waitFor();
   await page.waitForFunction(()=>[...document.querySelectorAll('#personal-device .pd-call-line')].length===6&&[...document.querySelectorAll('#personal-device .pd-call-line')].every(l=>getComputedStyle(l).opacity==='1'),null,{timeout:30000});
   assert.deepEqual(await call.locator('.pd-call-line').allInnerTexts(),CALL,'The owner\'s six lines, "Press L" kept');assert.match(await call.innerText(),/ADMIN \/\/ INCOMING CALL/);await shot('call');
   await page.locator('[data-hangup]').dispatchEvent('click');await page.keyboard.press('KeyL');await page.waitForFunction(()=>!VoidPersonalDevice.isOpen);
   s=await S();assert.equal(s.log[0].objective,'Photograph the target.');assert.equal(s.hint&&s.hint.id,'open','hint: open the V1');assert.match(s.hint.text,/Press L to open your V1/);
   // ---- Juno Vex, Halden Reyes and the marker over the pair
   await page.waitForFunction(()=>['juno-vex','halden-reyes'].every(id=>!!VoidPhotoSubjects.get(id)&&VoidPhotoSubjects.get(id).node.getChildMeshes().length>4),null,{timeout:240000});
   const pairAt=await page.evaluate(()=>{const a=VoidPhotoSubjects.get('juno-vex').node.getAbsolutePosition(),b=VoidPhotoSubjects.get('halden-reyes').node.getAbsolutePosition();return {d:Math.hypot(a.x-b.x,a.z-b.z),mid:[(a.x+b.x)/2,(a.z+b.z)/2],j:[a.x,a.z],h:[b.x,b.z]};});
   log('the pair '+JSON.stringify(pairAt));assert.ok(pairAt.d>=.6&&pairAt.d<=.9,'Juno and Halden close together');
   const facePair=(x,z)=>page.evaluate(([x,z,m])=>{Object.assign(walker,{x,z,yaw:Math.atan2(m[0]-x,m[1]-z),pitch:-.1});},[x,z,pairAt.mid]);
   const J=await page.evaluate(()=>VoidNightclub.JUNO);
   const face=(x,z)=>page.evaluate(([x,z,J])=>{const p=VoidPhotoSubjects.get('juno-vex').node.getAbsolutePosition();Object.assign(walker,{x,z,yaw:Math.atan2(p.x-x,p.z-z),pitch:-.1});},[x,z,J]);
   await face(39.5,-55.5);await page.waitForTimeout(4000);w=await way();assert.deepEqual(w.g,{kind:'local',label:'Photograph the target.',place:'null',target:'juno-vex'});
   const mark=await page.evaluate(()=>performance.now()-VoidMissionGuide.markerShown);assert.ok(mark<2000,'the yellow marker is drawn over the pair while the step is active and tracked');await shot('juno-marker');
   await facePair(36.2,-54.6);await page.waitForTimeout(2500);await shot('pair');
   await page.evaluate(()=>VoidMissions.untrack(state));await page.waitForTimeout(1200);const before=await page.evaluate(()=>VoidMissionGuide.markerShown);await page.waitForTimeout(1200);assert.equal(await page.evaluate(()=>VoidMissionGuide.markerShown),before,'no marker when the mission is not tracked');
   await page.evaluate(id=>VoidMissions.track(state,id,C),ID);
   // ---- a photo of the wrong person (facing the DJ, Juno out of the frame), then a valid one
   const camera=async()=>{await page.keyboard.press('KeyB');await page.waitForFunction(()=>VoidDeviceCamera.active);await page.waitForTimeout(1500);};
   const click=async()=>{const n=await page.evaluate(()=>VoidGallery.count),c=[Math.round(W/2),Math.round(H/2)];await page.mouse.click(...c);   // left click in the viewfinder
    // headless Chromium often refuses the pointer lock a player has here: the game then uses a first click on the view to take the mouse (mouse-control.js), so click again
    if(!await page.waitForFunction(n=>VoidGallery.count>n||VoidDeviceCamera.shooting,n,{timeout:4000}).then(()=>true,()=>false))await page.mouse.click(...c);
    await page.waitForFunction(n=>VoidGallery.count>n,n,{timeout:180000});return page.evaluate(()=>VoidGallery.photos[0]);};
   await page.evaluate(()=>{Object.assign(walker,{x:31,z:-58.6,yaw:-Math.PI/2,pitch:-.05});});await camera();await page.waitForFunction(()=>VoidDeviceCamera.tags.some(t=>t.name==='DJ Vanta'),null,{timeout:30000}).catch(()=>{});await shot('camera-wrong-person');
   const wrong=await click();log('wrong photo '+JSON.stringify(wrong.meta));assert.ok(wrong.meta,'the checks are kept with the photo');assert.ok(!wrong.meta.subjects.some(x=>x.id==='juno-vex'&&x.valid),'Juno is not in this one');if(!wrong.meta.subjects.some(x=>x.id==='dj-vanta'&&x.valid))log('note: the DJ was not judged a valid subject in the wrong photo');assert.equal(wrong.meta.place,'null-floor','NULL\'s main floor (places.js naming pass, 18 Nov 2026)');assert.deepEqual(wrong.meta.during,[ID+'/photograph']);
   assert.equal((await S()).rec.objectives.photograph,undefined,'a wrong photo does not complete the step');
   await page.keyboard.press('KeyB');await page.waitForFunction(()=>!VoidDeviceCamera.active);
   // Juno ALONE: close to the pair, side on, Juno in the middle of the frame and Halden out of it (the zoom at 2x). Found by trying aims with the camera's own judge.
   await camera();await page.mouse.move(Math.round(W/2),Math.round(H/2));for(let i=0;i<3;i++){await page.mouse.wheel(0,-120);await page.waitForTimeout(250);}
   const alone=await page.evaluate(async([j,h])=>{const frame=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const mx=(j[0]+h[0])/2,mz=(j[1]+h[1])/2,dx=j[0]-h[0],dz=j[1]-h[1],L=Math.hypot(dx,dz),px=dz/L,pz=-dx/L;
    for(const r of [1.2,1.5,1.0,1.8])for(const side of [1,-1])for(const along of [.3,.6,0]){const x=mx+px*r*side+dx/L*along,z=mz+pz*r*side+dz/L*along,base=Math.atan2(j[0]-x,j[1]-z);
     for(const off of [0,.08,-.08,.16,-.16,.24,-.24,.32,-.32]){Object.assign(walker,{x,z,yaw:base+off,pitch:-.12,vx:0,vz:0});await frame();await frame();const c=VoidDeviceCamera.capture(),J=c&&c.subjects.find(s=>s.id==='juno-vex'),Hn=c&&c.subjects.find(s=>s.id==='halden-reyes');
      if(J&&J.valid&&!(Hn&&Hn.valid))return {x,z,yaw:base+off,halden:Hn||null};}}return null;},[pairAt.j,pairAt.h]);
   log('Juno alone at '+JSON.stringify(alone));assert.ok(alone,'an aim that shows Juno without Halden exists');await page.evaluate(a=>Object.assign(walker,{x:a.x,z:a.z,yaw:a.yaw,pitch:-.12}),alone);await page.waitForTimeout(800);await shot('camera-juno-alone');
   const solo=await click();log('Juno alone '+JSON.stringify(solo.meta));assert.ok(solo.meta.subjects.some(x=>x.id==='juno-vex'&&x.valid),'Juno is in it');assert.ok(!solo.meta.subjects.some(x=>x.id==='halden-reyes'&&x.valid),'Halden is not');
   await page.waitForTimeout(1500);assert.equal((await S()).rec.objectives.photograph,undefined,'a photo of Juno alone does not complete the step');
   await page.keyboard.press('KeyB');await page.waitForFunction(()=>!VoidDeviceCamera.active);
   // both of them: from the floor, the pair in the middle of the frame; the camera tags both by name
   await facePair(37.2,-55.2);await camera();assert.equal((await S()).hint.id,'shoot','hint: left click');assert.equal(await page.evaluate(()=>VoidDeviceCamera.zoom),1,'the zoom is back at 1x when the camera opens again');
   await page.waitForFunction(()=>['Juno Vex','Halden Reyes'].every(n=>VoidDeviceCamera.tags.some(t=>t.name===n)),null,{timeout:30000});await shot('camera-juno');
   const good=await click();log('good photo '+JSON.stringify(good.meta));const j=good.meta.subjects.find(x=>x.id==='juno-vex'),hr=good.meta.subjects.find(x=>x.id==='halden-reyes');assert.ok(j&&j.valid,'a valid photo of Juno: '+JSON.stringify(good.meta.subjects));assert.ok(j.dist<=15);
   assert.ok(hr&&hr.valid&&hr.dist<=15,'and of Halden Reyes, in the same photo');assert.ok(good.tags.some(t=>t.name==='Juno Vex')&&good.tags.some(t=>t.name==='Halden Reyes'),'both tags drawn into the photo');
   await page.waitForFunction(id=>state.universe.missions[id]?.objectives.photograph===true,ID,{timeout:30000});
   await page.keyboard.press('KeyB');await page.waitForFunction(()=>!VoidDeviceCamera.active);s=await S();assert.equal(s.log[0].objective,'Send the photo to Admin.');assert.equal(s.hint.id,'open');
   // ---- Messages: Admin's conversation, ATTACH, SEND
   await page.keyboard.press('KeyL');await page.waitForFunction(()=>VoidPersonalDevice.isOpen&&!VoidPersonalDevice.busy);
   if(await page.evaluate(()=>VoidPersonalDevice.app!==null))await page.evaluate(()=>VoidPersonalDevice.openApp('messages'));else{assert.equal((await S()).hint.id,'messages');await page.locator('#personal-device [data-app=messages]').dispatchEvent('click');}
   await page.waitForFunction(()=>VoidPersonalDevice.app==='messages'&&!VoidPersonalDevice.busy);assert.equal((await S()).hint.id,'thread');
   await page.locator('#personal-device [data-thread=admin]').dispatchEvent('click');await page.waitForFunction(()=>VoidPersonalDevice.thread==='admin'&&!VoidPersonalDevice.busy);assert.equal((await S()).hint.id,'attach');
   const send=async id=>{await page.locator('#personal-device [data-attach-open]').dispatchEvent('click');await page.locator('#personal-device [data-attach-photo="'+id+'"]').waitFor();await page.locator('#personal-device [data-attach-photo="'+id+'"]').dispatchEvent('click');
    await page.locator('#personal-device [data-attach-form]').waitFor();await page.waitForFunction(()=>VoidMissionGuide.hint?.id==='send',null,{timeout:5000}).catch(()=>{});assert.equal((await S()).hint.id,'send');return page.locator('#personal-device [data-attach-send]').click();};
   const nots=()=>page.evaluate(()=>((document.querySelector('#personal-device [data-thread-log]')?.innerText||'').match(/That's not the person I'm looking for\. Check the description and try again\./g)||[]).length);
   await send(wrong.id);await page.waitForFunction(()=>/That's not the person I'm looking for\. Check the description and try again\./.test(document.querySelector('#personal-device [data-thread-log]')?.innerText||''),null,{timeout:30000});
   assert.equal((await S()).rec.objectives['send-photo'],undefined,'no fail, try again');await shot('wrong-photo-reply');
   const n1=await nots();await send(solo.id);await page.waitForFunction(n=>((document.querySelector('#personal-device [data-thread-log]')?.innerText||'').match(/That's not the person I'm looking for/g)||[]).length>n,n1,{timeout:30000});
   assert.equal((await S()).rec.objectives['send-photo'],undefined,'Juno alone is refused too');
   await send(good.id);await page.waitForFunction(()=>/Received\. That's exactly what I needed\. Come back when you're ready\./.test(document.querySelector('#personal-device [data-thread-log]')?.innerText||''),null,{timeout:30000});
   s=await S();assert.equal(s.rec.objectives['send-photo'],true);assert.equal(s.log[0].objective,'Return to Admin.');await shot('received');
   await page.keyboard.press('KeyL');await page.waitForFunction(()=>!VoidPersonalDevice.isOpen);
   // ---- back to Admin: the reward, once
   log('return');await page.evaluate(async()=>{state.location='earth';await enterWalking(VoidDistrictArea.KEY.interior,{silent:true,...VoidDistrictArea.resume(state,VoidNeoChinatown)});});await page.waitForFunction(()=>mode==='walking'&&walkingLocation?.area==='interior');
   w=await way();assert.deepEqual(w.g,{kind:'local',label:'Return to Admin.',interaction:'admin'});
   const credits=(await S()).credits;await useE('admin');
   const said=await page.evaluate(()=>speech?speech.lines.map(l=>l.text):[]);assert.deepEqual(said,['Not bad. You can follow instructions and keep a low profile. I might have more work for you.']);await shot('return');
   s=await S();assert.equal(s.rec.completed,true);assert.equal(s.credits,credits+100);assert.equal(s.rel.admin,10);assert.equal(s.tracked,null);
   const notice=await page.evaluate(()=>window.__said.join(' | '));assert.match(notice,/MISSION COMPLETE · Eyes on the Street  ·  \+100 credits  ·  BETTER STANDING WITH ADMIN/);
   await page.evaluate(()=>{while(speech)advanceSpeech();try{resumeWalking();}catch{}});await useE('admin');await page.evaluate(()=>{while(speech)advanceSpeech();try{resumeWalking();}catch{}});assert.equal((await S()).credits,credits+100,'paid once');
   assert.deepEqual(errors,[],'no page errors');await ctx.close();log(W+'x'+H+' passed');}
  console.log('eyes on the street browser test passed; screenshots in',shots);
 }finally{await browser.close();if(srv)srv.close();}
})().catch(e=>{console.error(String(e.stack||e).slice(0,2000));process.exit(1);});
