// The Relay in the browser: routine programming, breaking news (queued in combat, then cutting in),
// the District's silence, no signal in warp, Meridian's screens, the news archive, WarFlying
// commentary from the real leaderboard, and save/load. Needs the local server and Edge.
require('node:fs').mkdirSync('work',{recursive:true});
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));try{
 await page.route('**/api/void-runner/**',r=>r.fulfill({status:503,body:'offline'}));await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline'}));
 await page.goto('http://127.0.0.1:5187/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started&&VoidRelayRadio.content.segments.length>0);
 // An open-world pilot on foot in Meridian, radio on THE RELAY.
 await page.evaluate(async()=>{state=C.fresh();Object.assign(state,{quest:'open',location:'meridian'});state.universe.freeTravel=true;state.universe.missionLogUnlocked=true;
  for(const id of VoidProgression.flags)state.progression.flags[id]=true;state.progression.completed=true;await enterWalking('hangar');await VoidRadio.tune('relay');});
 const caption=()=>page.evaluate(()=>{const c=document.getElementById('relay-caption');return c.hidden?'':c.innerText;});
 const tick=(n=1,dt=.5)=>page.evaluate(([n,dt])=>{for(let i=0;i<n;i++)update(dt);},[n,dt]);

 // 1. Routine programming: an ad or a statement plays as a caption (no broadcaster is cast yet).
 await tick(8);await page.waitForFunction(()=>VoidRelayRadio.state.state==='playing');
 const first=await page.evaluate(()=>({kind:VoidRelayRadio.state.segment.kind,status:VoidRadio.status}));
 assert.match(first.status,/ON AIR/);assert.match(await caption(),/THE RELAY ·/);
 // 2. The Tessaly outage becomes public at 40 minutes of play, while a conversation is running: it waits.
 const queued=await page.evaluate(()=>{state.warflying.clock=40*60;speech={lines:[{text:'x'}],index:0};for(let i=0;i<6;i++)update(.5);return {pending:[...state.relay.pending],state:VoidRelayRadio.state.state};});
 assert.deepEqual(queued.pending,['breaking-tessaly-comms-disruption']);assert.equal(queued.state,'held','gives way to the conversation');
 // Saved and reloaded while waiting: still queued.
 const reloaded=await page.evaluate(()=>{const r=C.restore(JSON.stringify(state)).relay;return {pending:r.pending,occurred:Object.keys(r.occurred)};});
 assert.deepEqual(reloaded.pending,['breaking-tessaly-comms-disruption']);assert.ok(reloaded.occurred.includes('tessaly-corridor-comms-disruption'));
 // Conversation over: breaking news airs first, in red.
 await page.evaluate(()=>{speech=null;for(let i=0;i<12;i++)update(.5);});
 await page.waitForFunction(()=>VoidRelayRadio.state.segment?.id==='breaking-tessaly-comms-disruption');
 assert.match(await caption(),/BREAKING[\s\S]*We interrupt our regularly scheduled programming/);
 await page.screenshot({path:'work/relay-breaking.png'});
 // 3. Breaking news cuts into an ad already on air.
 const cut=await page.evaluate(()=>{const s=VoidRelayRadio.content.segments,r=VoidRelayRadio.state;
  r.state='playing';r.segment=s.find(x=>x.id==='ad-shield-systems');state.relay.pending=['breaking-tessaly-comms-disruption'];update(.1);return r.segment?.id;});
 assert.equal(cut,'breaking-tessaly-comms-disruption');
 // 4. Meridian's screens show the same story.
 await page.evaluate(()=>{VoidRelayScreens.draw();});
 const screens=await page.evaluate(()=>VoidRelayScreens.screens.length);assert.equal(screens,2);
 const heads=await page.evaluate(()=>VoidRelay.headlines(state.relay,VoidRelayRadio.content,{system:'erebus',clock:state.warflying.clock,matches:()=>true},6).map(h=>h.headline));
 assert.equal(heads[0],'Communications disruption near Tessaly shipping corridor');
 await page.evaluate(()=>{walker.x=0;walker.z=19.5;walker.yaw=0;walker.pitch=-.32;VoidRelayScreens.draw();for(let i=0;i<3;i++)update(.016);draw();});
 await page.screenshot({path:'work/relay-screen-concourse.png'});
 await page.evaluate(()=>{walker.x=0;walker.z=54;walker.yaw=0;walker.pitch=-.12;for(let i=0;i<3;i++)update(.016);draw();});
 await page.screenshot({path:'work/relay-screen-bar.png'});
 // 5. The archive in the Mission Log: the story with what is confirmed and unknown, labelled reports.
 await page.evaluate(()=>openMissionLog());
 const archive=await page.evaluate(()=>document.querySelector('#mission-log .relay-archive')?.innerText||'');
 assert.match(archive,/NEWS ARCHIVE/);assert.match(archive,/Confirmed:/);assert.match(archive,/Unknown:\s*The cause of the disruption/);assert.match(archive,/Unverified report/);
 await page.locator('#mission-log .relay-archive details summary').first().click();
 await page.locator('#mission-log .relay-archive').scrollIntoViewIfNeeded();await page.screenshot({path:'work/relay-archive.png'});
 await page.evaluate(()=>closeMissionLog());
 // 6. WarFlying commentary from a real leaderboard change: RiftRunner passes the player.
 const wf=await page.evaluate(()=>{state.warflying.clock=0;for(const id of ['beacon:erebus-1','beacon:erebus-2','beacon:erebus-3','satellite:erebus-1','satellite:erebus-2','station:meridian','station:kepler'])VoidWarFlying.observe(state.warflying,{sourceId:id,confidence:'confirmed',place:'erebus'},1);
  const points=VoidWarFlying.points(state.warflying);VoidRelayRadio.watchBoard();state.warflying.clock=90*60;VoidRelayRadio.watchBoard();
  return {points,after:VoidWarFlying.points(state.warflying),moments:VoidRelayRadio.moments.map(m=>m.trigger+':'+(m.vars.name||''))};});
 assert.equal(wf.after,wf.points,'commentary never changes points');assert.ok(wf.moments.includes('warflying-one-point:RiftRunner'),JSON.stringify(wf.moments));
 const spoken=await page.evaluate(()=>{const r=VoidRelayRadio.state;r.state='gap';r.timer=0;r.segment=null;r.interrupted=null;state.relay.pending=[];update(.1);return {id:r.segment?.id,text:document.getElementById('relay-caption').innerText};});
 assert.equal(spoken.id,'warflying-one-point');assert.match(spoken.text,/WE HAVE A DEVELOPMENT/);
 const later=await page.evaluate(async()=>{const s=VoidRelayRadio.content.segments.find(x=>x.id==='warflying-one-point');return VoidRelay.render(s,state.relay.archive.at(-1).vars);});
 assert.ok(later.includes('AND THAT SINGLE POINT HAS MOVED RIFTRUNNER INTO FIFTH PLACE!'),later.join('|'));
 // 7. The Darknet District: silent on the premises.
 const district=await page.evaluate(async()=>{state.location='earth';state.universe.currentSystem='sol';await enterWalking('earth');for(let i=0;i<6;i++)update(.5);return {status:VoidRadio.status,state:VoidRelayRadio.state.state,caption:!document.getElementById('relay-caption').hidden,screens:VoidRelayScreens.screens.length};});
 assert.match(district.status,/NO SIGNAL INSIDE THE DISTRICT/);assert.equal(district.state,'idle');assert.equal(district.caption,false);assert.equal(district.screens,0);
 // 8. No satellite link in warp between systems: no programming, the queue waits.
 const warp=await page.evaluate(async()=>{state.location='meridian';state.universe.currentSystem='erebus';walkingLocation=walker=null;state.quest='legal-run';await launch();});
 await page.waitForFunction(()=>mode==='play',null,{timeout:35000});
 const out=await page.evaluate(()=>{VoidWarp.step=()=>false;flight.route=Object.assign(VoidWarp.create('meridian','vigil',null,false),{phase:'warp',progress:.4});current.destination='vigil';preparedDestination='vigil';
  current.enemies=0;enemies=[];state.relay.pending=['breaking-tessaly-comms-disruption'];delete state.relay.heard['breaking-tessaly-comms-disruption'];for(let i=0;i<6;i++)update(.5);
  return {status:VoidRadio.status,state:VoidRelayRadio.state.state,pending:[...state.relay.pending]};});
 assert.match(out.status,/NO SIGNAL IN WARP · 1 REPORT WAITING/);assert.equal(out.state,'idle');assert.deepEqual(out.pending,['breaking-tessaly-comms-disruption']);
 await page.evaluate(()=>draw());await page.screenshot({path:'work/relay-warp.png'});
 assert.deepEqual(errors,[]);console.log('PASS The Relay',{first,heads:heads.slice(0,3),wf:wf.moments,district,warp:out});
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
