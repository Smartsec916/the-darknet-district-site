/* MISSION 003 — CORPORATE CONNECTIONS in the real game (Chromium, software GL, offline: every API call refused, so the shipped missions are in force).
   A new character; Missions 001 and 002 are finished through the game's own mission engine (their own browser tests walk them) → Admin's briefing in person (the owner's
   four lines, recorded) with ACCEPT / NOT NOW → Mission Log "Corporate Connections", tracked, the yellow arrow out of the District toward Milked → Far South's side street:
   the arrow leads to Milked's front doors → in through the front vestibule (the real checkpoint and loading card) → "Travel to Milked" done, the arrow now leads to Eva →
   Eva (the PROPOSED drafts, the player's lines, her two recorded lines) → she turns toward the staff door, the STAFF ONLY door opens for this player → the arrow leads to Fish
   through the staff door → Fish: the player's line, her Mandarin line at about 70% with the V1's English translation in her own voice starting about 0.75 s later (both clips' start times are
   checked), the line shown with "V1 TRANSLATION" under it → Fish added to the contacts and followed on Social (banner) → the mission is complete, no reward → active play
   the V1 shows the in-game time; in-game time is advanced (the page's own clock ticker, faked time: stopped in a menu and a conversation) and Fish's follow-up becomes
   due once after 6 in-game hours (a stub: no call is delivered).
   Usage: node tests/mission-003-browser.cjs  (its own static server on a free port; SITE_TEST_URL to use another; SHOTS=dir; BROWSER_EXECUTABLE=path; SIZES=1366,1920; QUALITY=low) */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const shots=process.env.SHOTS||path.resolve(__dirname,'..','docs/development/mission-003');fs.mkdirSync(shots,{recursive:true});
const bundled=['/opt/pw-browsers/chromium','/opt/pw-browsers/chromium-1243/chrome-linux64/chrome'].find(f=>{try{return fs.statSync(f).isFile();}catch{return false;}}),exe=process.env.BROWSER_EXECUTABLE||bundled||null;
const sizes=(process.env.SIZES||'1366,1920').split(',').map(w=>w==='1920'?[1920,1080]:[1366,768]),quality=process.env.QUALITY||'low';
const ID='m003-corporate-connections',M2='m002-eyes-on-the-street';
const BRIEF=['I did some digging. Halden Reyes has ties to an arms dealer who works closely with The Function.','I know an intel broker named Fish. She\'s a close friend of mine and works over at Milked. She might be able to tell us more.',
 'Head over there and let the receptionist, Eva, know you\'re there to see Fish.','And tell Eva I said hi.'];
const EN='Give me some time to work on it. I\'ll call you if anything comes up.';
function serve(){const root=path.resolve(__dirname,'..'),types={'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.ogg':'audio/ogg','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.glb':'model/gltf-binary'};
 const srv=http.createServer((req,res)=>{let f;try{f=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));}catch{res.writeHead(400);return res.end();}if(!f.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);return res.end();}res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(d);});});
 // a free port, never one of the ports other sessions use
 const avoid=new Set([5187,5188,5189,5291,5377,5611,5733,5743]);
 return new Promise((r,j)=>{const go=()=>srv.listen(0,'127.0.0.1',()=>{if(avoid.has(srv.address().port)){srv.close(go);return;}r(srv);});srv.on('error',j);go();});}
(async()=>{
 const srv=process.env.SITE_TEST_URL?null:await serve(),base=process.env.SITE_TEST_URL||'http://127.0.0.1:'+srv.address().port;
 const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader','--no-sandbox','--autoplay-policy=no-user-gesture-required'],...(exe?{executablePath:exe}:{})});
 const log=m=>console.log(new Date().toISOString().slice(11,19),m);
 try{
  for(const [W,H] of sizes){
   const ctx=await browser.newContext({viewport:{width:W,height:H},serviceWorkers:'block'}),page=await ctx.newPage();page.setDefaultTimeout(600000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
   const shot=async n=>{await page.screenshot({path:path.join(shots,n+'-'+W+'.png')});};
   await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));await page.route('**/api/**',r=>r.fulfill({status:503,contentType:'application/json',body:'{}'}));
   await page.addInitScript(q=>{if(!sessionStorage.getItem('i')){localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:q,v:2,chosen:true}));sessionStorage.setItem('i','1');}},quality);
   await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started);
   await page.evaluate(()=>Object.assign(VoidPreparation.limits,{scene:900000,assets:900000,optional:300000,total:1500000,module:600000,artwork:300000,area:900000}));
   log(W+'x'+H+' · new character');
   await page.click('[data-action=menu-campaign]');await page.click('[data-action=menu-new]');{const c=page.locator('[data-action=menu-new-confirm]');if(await c.count())await c.click();}
   await page.waitForSelector('#character-creator.on');await page.waitForFunction(()=>!document.querySelector('[data-cc=confirm]').disabled);await page.locator('[data-cc=confirm]').click();
   await page.waitForFunction(()=>mode==='pod-waking'&&walker&&!document.getElementById('pod-wake').hidden,null,{timeout:600000});
   await page.waitForFunction(()=>VoidAssets.pending===0,null,{timeout:600000});await page.waitForTimeout(800);await page.keyboard.press('KeyE');await page.waitForFunction(()=>mode==='walking'&&walker,null,{timeout:600000});
   await page.evaluate(()=>{VoidV1.bannerMs=600000;VoidV1.callTail=600000;window.__said=[];const a=announce;announce=function(t){window.__said.push(String(t));return a.apply(this,arguments);};});
   const S=()=>page.evaluate(id=>({mode,credits:state.credits,tracked:state.universe.trackedMission,rec:state.universe.missions[id]||null,flags:{staff:state.story.flags.mf_milkedStaff,contacts:state.story.flags.v1Contacts,following:state.story.flags.socialFollowing,gameMin:state.story.flags.gameMin,stamp:state.story.flags['gc_'+id],due:state.story.flags['ev_fish-followup-due']},
    log:VoidMissions.all(state,C).filter(m=>m.id===id).map(m=>({title:m.title,objective:m.objective,tracked:m.tracked,completed:m.completed}))}),ID);
   const useE=async id=>{const ok=await page.evaluate(id=>{const it=walkingLocation.interactions.find(i=>i.id===id);if(!it)return false;const inside=(x,z)=>walkingLocation.solids.some(o=>o.position&&o.size&&!o.open&&Math.abs(x-o.position[0])<o.size[0]/2+.35&&Math.abs(z-o.position[2])<o.size[2]/2+.35);
    for(const d of [1.6,1.3,1.9,1.0,2.1,.7])for(let a=0;a<16;a++){const ang=a*Math.PI/8,x=it.position[0]+Math.sin(ang)*d,z=it.position[2]+Math.cos(ang)*d,yaw=Math.atan2(it.position[0]-x,it.position[2]-z);if(inside(x,z))continue;
     if(VoidExplorer.select({x,z,yaw},walkingLocation,i=>!i.when||VoidStory.matches(state,i.when))?.id===id){Object.assign(walker,{x,z,yaw,pitch:0,vx:0,vz:0});return true;}}return false;},id);
    assert(ok,'a spot where '+id+' can be used exists');await page.waitForTimeout(1200);await page.keyboard.press('KeyE');await page.waitForTimeout(1500);};
   const toLast=()=>page.evaluate(()=>{let n=0;while(speech&&(speech.index<speech.lines.length-1||speech.shown<speech.lines[speech.index].text.length)&&n++<40)advanceSpeech();return speech?{lines:speech.lines.map(l=>l.text),who:speech.lines.map(l=>l.who),main:document.getElementById('speech-next')?.textContent,choices:[...document.querySelectorAll('[data-talk-choice]')].map(b=>b.textContent)}:null;});
   const way=()=>page.evaluate(()=>({wp:typeof trackedWalkWaypoint!=='undefined'&&trackedWalkWaypoint?{p:trackedWalkWaypoint.position,label:trackedWalkWaypoint.label||''}:null,live:VoidGuideRoute.live?{route:VoidGuideRoute.live.route,waypoint:VoidGuideRoute.live.waypoint}:null,area:walkingLocation.area}));
   // in-page walk in small steps, stopping at anything solid (the way a player moves); returns where the walker ended
   const walk=(x,z)=>page.evaluate(async([tx,tz])=>{const step=.12;for(let i=0;i<900;i++){const dx=tx-walker.x,dz=tz-walker.z,d=Math.hypot(dx,dz);if(d<step){if(!VoidExplorer.blocked(tx,tz,walkingLocation)){walker.x=tx;walker.z=tz;}break;}
     const nx=walker.x+dx/d*step,nz=walker.z+dz/d*step;if(VoidExplorer.blocked(nx,nz,walkingLocation)){await new Promise(r=>setTimeout(r,120));if(VoidExplorer.blocked(nx,nz,walkingLocation))break;}walker.x=nx;walker.z=nz;walker.yaw=Math.atan2(dx,dz);await new Promise(r=>requestAnimationFrame(r));}return [walker.x,walker.z];},[x,z]);

   // ---- Missions 001 and 002, finished through the mission engine (the same events the game sends; their own browser tests walk them in full)
   await page.waitForFunction(()=>!!state.universe.missions['m001-awakening']?.acquired);
   await page.evaluate(m2=>{const L=VoidLiveContent,ev=e=>VoidMissionContent.treeEvent(state,L.env,e,VoidMissions,C);ev({type:'talk',npcs:['admin']});ev({type:'heard',mission:'m001-awakening'});ev({type:'accept',mission:m2});ev({type:'place',places:['null']});
    ev({type:'photo',subjects:['juno-vex','halden-reyes']});ev({type:'send-photo',to:'admin',photo:{subjects:[{id:'juno-vex',valid:true},{id:'halden-reyes',valid:true}],during:[m2+'/photograph'],place:'null',at:1}});ev({type:'talk',npcs:['admin']});save();},M2);
   assert.equal(await page.evaluate(m2=>state.universe.missions[m2]?.completed,M2),true,'Mission 002 is done');
   await page.evaluate(()=>{try{VoidPersonalDevice.close();}catch{}try{resumeWalking();}catch{}});await page.waitForFunction(()=>mode==='walking');

   // ---- Admin's briefing in person: NOT NOW, then ACCEPT
   log('briefing');await useE('admin');
   let d=await toLast();assert.ok(d,'Admin briefs the player in person');assert.deepEqual(d.lines,BRIEF,'the owner\'s four lines, verbatim');assert.equal(d.main,'ACCEPT');assert.deepEqual(d.choices,['NOT NOW']);
   assert.equal(await page.evaluate(t=>VoidVoiceClips.has('Admin',t),BRIEF[0]),true,'Admin\'s briefing is recorded');
   await shot('briefing');
   await page.locator('[data-talk-choice]').dispatchEvent('click');await page.waitForFunction(()=>mode==='walking'&&!speech);assert.equal((await S()).rec,null,'NOT NOW takes nothing');
   await useE('admin');d=await toLast();assert.deepEqual(d.lines,BRIEF,'offered again');
   await page.locator('#speech-next').dispatchEvent('click');await page.waitForFunction(id=>!!state.universe.missions[id]?.acquired,ID);await page.waitForFunction(()=>mode==='walking');
   let s=await S();assert.equal(s.tracked,ID);assert.deepEqual(s.log.map(m=>[m.title,m.tracked,m.completed]),[['Corporate Connections',true,false]]);assert.equal(s.log[0].objective,'Travel to Milked.');
   assert.ok((await page.evaluate(()=>window.__said.join(' | '))).includes('NEW MISSION · Corporate Connections'),'players see the name only');
   // the arrow: the goal is Milked's front vestibule; inside the District the route leads out through the vestibule first
   await page.waitForTimeout(1500);let w=await way();assert.deepEqual(w.wp.p,await page.evaluate(()=>VoidPlaces.target('milked')),'the goal is Milked\'s front vestibule');
   assert.ok(w.live&&w.live.route.some(r=>/^district-door/.test(r)),'out through the District\'s doors first: '+(w.live&&w.live.route));

   // ---- Far South: the arrow to Milked's front doors, in through the front vestibule
   log('Far South');await page.evaluate(async()=>{state.location='earth';delete state.story.flags.area;await enterWalking(VoidDistrictArea.KEY.street,{silent:true,quarter:'far-south'});});
   await page.waitForFunction(()=>mode==='walking'&&walkingLocation?.area==='street'&&walkingLocation.quarter==='far-south');
   const MK=await page.evaluate(()=>({D:VoidMilked.DOOR,V:VoidMilked.VESTIBULE,S:VoidMilked.STAFF_DOOR,eva:VoidMilked.INTERACTIONS.find(i=>i.id==='milked-eva').position,fish:VoidMilked.INTERACTIONS.find(i=>i.id==='milked-fish').position}));
   await page.evaluate(([x,z])=>{Object.assign(walker,{x,z,yaw:Math.PI,pitch:0,vx:0,vz:0});},[MK.D.x,MK.D.z+5]);await page.waitForFunction(()=>VoidNeoChinatown.city.live.has('milked'),null,{timeout:600000});await page.waitForTimeout(2500);
   w=await way();assert.ok(w.live&&w.live.route[0].startsWith('milked-door'),'the arrow leads to Milked\'s front doors: '+(w.live&&w.live.route));await shot('arrow-milked');
   assert.equal((await S()).rec.objectives['travel-milked'],undefined,'not yet: the side street is not Milked');
   await walk(MK.D.x,MK.D.z+1.8);await page.waitForFunction(()=>VoidNeoChinatown.city.live.get('milked')?.doors?.state().find(d=>d.id==='milked-door')?.open>=.8,null,{timeout:300000});
   await walk(MK.D.x,(MK.V[2]+MK.V[3])/2);
   await page.waitForFunction(id=>state.universe.missions[id]?.objectives?.['travel-milked']===true,ID,{timeout:120000});log('arrived');
   await page.waitForFunction(()=>walkingLocation?.area==='milked'&&mode==='walking'&&VoidMilkedGate.state==='COMPLETE'&&!document.querySelector('#milked-transition.on'),null,{timeout:900000});
   s=await S();assert.equal(s.log[0].objective,'Speak with Eva at reception.');
   await page.waitForFunction(()=>VoidBabylon.zone.doors.state().find(d=>d.id==='milked-inner-door')?.open>=.8||true);await walk(MK.D.x,MK.D.z-4.4);await page.waitForTimeout(1500);
   w=await way();assert.deepEqual(w.wp.p,MK.eva,'after arriving, the arrow points to Eva');
   assert.equal(await page.evaluate(()=>VoidBabylon.zone.state().staffDoor.blocking),true,'the staff-only door is locked before Eva');

   // ---- Eva: the drafts, the player's lines, her two recorded lines; she turns toward the staff door; the door opens for this player
   log('Eva');await page.waitForFunction(()=>VoidBabylon.zone.people.some(p=>p.spawned&&p.role==='eva'),null,{timeout:600000});
   await useE('milked-eva');await page.waitForFunction(()=>!!speech&&speech.lines.length>=7);
   const eva=await page.evaluate(()=>({lines:speech.lines.map(l=>l.text),who:speech.lines.map(l=>l.who),name:document.querySelector('.speaker h2')?.textContent}));
   assert.equal(eva.name,'Eva');assert.deepEqual(eva.lines.slice(-2),['Oh, Admin! Tell him I said hi, too.','Fish is through the staff-only door. You\'ll find her in her office.']);assert.deepEqual(eva.who.slice(3,5),['You','You']);
   assert.equal(await page.evaluate(()=>state.story.flags.mf_milkedStaff),true,'Eva grants access');
   await page.waitForTimeout(2500);await shot('eva');
   await toLast();await page.waitForTimeout(800);
   const g=await page.evaluate(()=>VoidBabylon.zone.gestures);assert.ok(g.some(x=>x.who==='milked-eva'&&x.toward==='staff-door'),'Eva turns toward the staff door on her last line');
   assert.equal(await page.evaluate(t=>VoidVoiceClips.has('milked-eva',t),'Fish is through the staff-only door. You\'ll find her in her office.'),true,'her line is recorded');
   await page.locator('#speech-next').dispatchEvent('click');await page.waitForFunction(()=>mode==='walking'&&!speech);
   await page.waitForFunction(()=>VoidBabylon.zone.state().staffDoor.blocking===false,null,{timeout:30000});
   s=await S();assert.equal(s.log[0].objective,'Meet Fish in her office.');

   // ---- the arrow to Fish through the staff door; walk there
   await page.waitForTimeout(1500);w=await way();assert.deepEqual(w.wp.p,MK.fish,'the arrow points to Fish');assert.ok(w.live.route.includes('milked-staff-door>'),'through the STAFF ONLY door: '+w.live.route);
   await page.evaluate(([x,z])=>{Object.assign(walker,{x,z,yaw:Math.PI/2,pitch:0});},[MK.S.x-1,MK.S.z]);await page.waitForTimeout(1200);await shot('arrow-staff-door');
   const p=await walk(MK.S.x+1.25,MK.S.z);assert.ok(Math.abs(p[0]-(MK.S.x+1.25))<.05,'walked through the staff-only door: '+p);

   // ---- Fish: the player's line, then her Mandarin with the V1's English translation over it
   log('Fish');await page.waitForFunction(()=>VoidBabylon.zone.people.some(p=>p.spawned&&p.role==='fish'),null,{timeout:600000});
   const before=await page.evaluate(()=>VoidVoiceClips.played.length);
   await useE('milked-fish');await page.waitForFunction(()=>!!speech);
   let f=await page.evaluate(()=>({lines:speech.lines.map(l=>({who:l.who,text:l.text,tr:l.translation?.text||null}))}));
   assert.equal(f.lines.length,2,'the translation is part of Fish\'s line, not a line of its own');assert.equal(f.lines[0].who,'You');assert.equal(f.lines[1].who,'milked-fish');assert.equal(f.lines[1].tr,EN);
   await page.waitForFunction(()=>speech&&speech.index===1,null,{timeout:60000});
   await page.waitForFunction(b=>VoidVoiceClips.played.length>b&&VoidVoiceClips.played.at(-1).secondary,before,{timeout:60000});
   const rec=await page.evaluate(()=>VoidVoiceClips.played.at(-1));log(JSON.stringify(rec));
   assert.equal(rec.primary.speaker,'milked-fish');assert.ok(Math.abs(rec.primary.gain-.7)<.01,'Mandarin at about 70%');assert.equal(rec.secondary.speaker,'milked-fish','the English in Fish\'s own voice');assert.equal(rec.secondary.id,'extra:fish-m003-en');assert.equal(rec.secondary.gain,1);assert.equal(rec.secondary.effect,'device');
   const off=rec.secondary.at-rec.primary.at;assert.ok(off>=.6&&off<=.9,'the translation starts 0.6-0.9 s after the Mandarin: '+off);assert.ok(rec.secondary.at<rec.primary.at+rec.primary.duration,'they overlap: both stay audible');
   await page.waitForTimeout(1600);
   const tr=await page.evaluate(()=>{const e=document.querySelector('[data-v1-translation]');return e?e.textContent:null;});assert.ok(tr&&tr.startsWith('V1 TRANSLATION')&&tr.includes(EN),'the English under the Mandarin, labelled: '+tr);
   await shot('fish-translation');
   await page.waitForFunction(()=>speech&&speech.voice&&speech.voice.ended===true,null,{timeout:60000});
   s=await S();assert.equal(s.rec.completed,true,'the mission is complete after speaking with Fish');assert.equal(s.flags.contacts,'milked-fish');assert.match(s.flags.following,/n:milked-fish/);
   const said=await page.evaluate(()=>window.__said.join(' | '));assert.ok(said.includes('MISSION COMPLETE · Corporate Connections'),said);assert.ok(said.includes('FISH ADDED TO CONTACTS'));
   await page.locator('#speech-next').dispatchEvent('click');await page.waitForFunction(()=>mode==='walking'&&!speech);
   await page.waitForFunction(()=>!!document.querySelector('#pd-notify:not([hidden])'),null,{timeout:10000});const ban=await page.evaluate(()=>document.querySelector('#pd-notify').textContent);assert.match(ban,/Fish added to contacts/);
   await page.waitForTimeout(600);await shot('contact-notification');
   assert.equal(await page.evaluate(()=>VoidHudData.contacts(state).some(c=>c.id==='milked-fish')),true,'Fish is a V1 contact');
   assert.equal(await page.evaluate(()=>VoidDistrictPeople.isFollowing(state.story.flags,'n:milked-fish')),true,'and followed on Social');
   assert.equal((await S()).credits,s.credits,'no reward');

   // ---- the V1 shows the in-game time; the follow-up waits 6 in-game hours (in-game time runs only while walking or flying); fires once (a stub: nothing is delivered)
   await page.keyboard.press('KeyL');await page.waitForFunction(()=>VoidPersonalDevice.isOpen);await page.waitForTimeout(1500);
   const v1=await page.evaluate(()=>({shown:document.querySelector('[data-pd-clock]')?.textContent||'',now:VoidClock.now(state).label}));assert.match(v1.shown,/^\d\d:\d\d · DAY \d+$/,'the V1 shows the in-game time: '+v1.shown);assert.equal(v1.shown,v1.now);
   await shot('v1-clock');await page.keyboard.press('KeyL');await page.waitForFunction(()=>!VoidPersonalDevice.isOpen);await page.waitForFunction(()=>mode==='walking');
   log('in-game time');const fired=await page.evaluate(()=>{const out=[];addEventListener('void-tree-event',e=>out.push(e.detail.id));const L=VoidLiveContent;let t=performance.now()+1e6;
    L.clockTick(t);const st0=L.gameClock().followups[0];mode='menu';for(let i=0;i<200;i++)L.clockTick(t+=5000);const inMenu=L.gameClock().followups[0].elapsed;mode='dialogue';for(let i=0;i<50;i++)L.clockTick(t+=5000);const inTalk=L.gameClock().followups[0].elapsed;mode='walking';
    for(let i=0;i<st0.remaining-1;i++)L.clockTick(t+=5000);const mid=L.gameClock().followups[0];for(let i=0;i<2;i++)L.clockTick(t+=5000);const end=L.gameClock().followups[0];for(let i=0;i<50;i++)L.clockTick(t+=5000);
    return {st0,inMenu,inTalk,mid,end,events:out.slice(),flag:state.story.flags['ev_fish-followup-due'],now:L.gameClock().now.label};});
   log(JSON.stringify(fired));assert.equal(fired.st0.gameMinutes,360,'6 in-game hours');assert.equal(fired.inMenu,fired.st0.elapsed,'the clock stops in a menu');assert.equal(fired.inTalk,fired.st0.elapsed,'and in a conversation');
   assert.equal(fired.mid.due,false);assert.equal(fired.end.fired,true);assert.deepEqual(fired.events,['fish-followup-due'],'fires once');assert.equal(fired.flag,true);assert.equal(fired.end.dueAt,fired.st0.dueAt);
   assert.equal(await page.evaluate(()=>document.querySelector('#pd-notify')?.textContent.includes('Fish')&&!/call/i.test(document.querySelector('#pd-notify').textContent)),true,'no call is delivered (stub)');
   assert.deepEqual(errors.filter(e=>!/ResizeObserver|AbortError|The play\(\) request/.test(e)),[],'no page errors');
   log(W+' done');await ctx.close();}
 }finally{await browser.close();srv?.close();}
 console.log('mission-003-browser: OK');
})().catch(e=>{console.error(e);process.exit(1);});
