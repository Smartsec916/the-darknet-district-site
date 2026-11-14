/* THE BEGINNER CAMPAIGN, played in the real game from a fresh save (software GL; slow, about 20-30 minutes): Sleeping Pod -> six missions -> own ship -> launch -> real flight -> Meridian.
   Interactions are pressed with the real E key at the real spots; the District/street change uses enterWalking (the two doors are not walked through); the ship is steered with the
   same mouse input a player uses (a small controller loop does the aiming, as a player's hand would). Usage: node tests/beginner-browser.cjs   (SHOTS=dir)  */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',shots=process.env.SHOTS||'/tmp';
(async()=>{
 const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox']});const errors=[],log=m=>console.log(new Date().toISOString().slice(11,19),m);
 const ctx=await browser.newContext({viewport:{width:1280,height:720},serviceWorkers:'block'});const page=await ctx.newPage();page.setDefaultTimeout(300000);
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push('console: '+m.text());});
 await page.route('https://**/*',r=>r.abort());await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
 await page.addInitScript(()=>{if(!sessionStorage.getItem('i')){localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:'low',v:2,chosen:true}));sessionStorage.setItem('i','1');}});
 const watch=process.env.WATCH?setInterval(async()=>{try{console.log(new Date().toISOString().slice(11,19),'… '+JSON.stringify(await page.evaluate(()=>({mode,loc:state.location,screen:document.querySelector('#screen:not(.hidden)')?.innerText?.slice(0,90)||null,btn:[...document.querySelectorAll('#screen:not(.hidden) button')].map(b=>b.dataset.action).slice(0,4)}))));await page.screenshot({path:shots+"/bc-live.png"});}catch{}},45000):0;
 const snap=n=>page.screenshot({path:shots+'/bc-'+n+'.png'});
 const S=()=>page.evaluate(()=>({mode,loc:state.location,credits:state.credits,ship:VoidShips.hasShip(state),owned:state.ownedShips,free:state.universe.freeTravel,quest:state.quest,pool:state.story.flags.missionPool,tracked:state.universe.trackedMission,
  m:Object.fromEntries(Object.entries(state.universe.missions||{}).map(([k,v])=>[k,(v.completed?'DONE ':'open ')+Object.keys(v.objectives).join(',')])),area:walkingLocation?.area,keymapSeen:state.story.flags.keymapSeen}));
 const finishTalk=async()=>{for(let i=0;i<20;i++){const more=await page.evaluate(()=>{const b=document.querySelector('#screen:not(.hidden) [data-action=speech-next],#screen:not(.hidden) [data-action=walk-resume]');if(b){b.click();return true;}return false;});if(!more)break;await page.waitForTimeout(500);}await page.waitForFunction(()=>mode==='walking',null,{timeout:120000});};
 // stand where a real player would, facing the thing, then press E
 const useE=async id=>{
  const ok=await page.evaluate(id=>{const it=walkingLocation.interactions.find(i=>i.id===id);if(!it)return false;const inside=(x,z)=>walkingLocation.solids.some(o=>o.position&&o.size&&Math.abs(x-o.position[0])<o.size[0]/2+.35&&Math.abs(z-o.position[2])<o.size[2]/2+.35);
   for(const d of [1.6,1.3,1.9,1.0,2.1,.7])for(let a=0;a<16;a++){const ang=a*Math.PI/8,x=it.position[0]+Math.sin(ang)*d,z=it.position[2]+Math.cos(ang)*d,yaw=Math.atan2(it.position[0]-x,it.position[2]-z);if(inside(x,z))continue;
   const p={x,z,yaw};if(VoidExplorer.select(p,walkingLocation,i=>!i.when||VoidStory.matches(state,i.when))?.id===id){Object.assign(walker,{x,z,yaw,pitch:0,vx:0,vz:0});return true;}}return false;},id);
  assert(ok,'a spot where '+id+' can be used exists');await page.waitForTimeout(1200);await page.keyboard.press('KeyE');await page.waitForTimeout(1500);
 };
 // Changing between the District and the street: stand in the middle of the security vestibule (where the real checkpoint exchanges the two), let the game run a moment, then load the
 // other environment exactly as the checkpoint does (same place and facing). The two doors and the scan are not walked through here (tests/district-transition-browser.cjs covers them).
 const toArea=async key=>{await page.evaluate(()=>{const [x,z]=VoidNeoChinatown.toWorld(0,23);Object.assign(walker,{x,z,yaw:0,pitch:0,vx:0,vz:0});});await page.waitForTimeout(6000);
  await page.evaluate(k=>{const w=walker;delete state.story.flags.area;return enterWalking(VoidDistrictArea.KEY[k],{silent:true,spawn:[w.x,1.7,w.z],yaw:w.yaw});},key);
  await page.waitForFunction(k=>mode==='walking'&&walkingLocation?.area===k&&VoidAssets.pending===0,key,{timeout:300000});await page.waitForTimeout(2000);};
 // ---- boot: fresh save, character, pod
 await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started);await page.evaluate(()=>Object.assign(VoidPreparation.limits,{scene:600000,assets:600000,optional:300000,total:1200000,module:600000,artwork:300000}));
 await page.click('[data-action=menu-campaign]');await page.click('[data-action=menu-new]');const c=page.locator('[data-action=menu-new-confirm]');if(await c.count())await c.click();
 await page.waitForSelector('#character-creator.on');await page.waitForFunction(()=>!document.querySelector('[data-cc=confirm]').disabled);await page.locator('[data-cc=confirm]').click();
 await page.waitForFunction(()=>mode==='pod-waking'&&walker);let s=await S();log('in the pod '+JSON.stringify(s));
 assert.equal(s.ship,false,'the player starts without a ship');assert.equal(s.pool,'closed');assert.deepEqual(s.m,{},'no mission before the pod exit');assert.equal(s.free,false);
 await page.locator('#pod-wake [data-pod=exit]').click();await page.waitForFunction(()=>mode==='walking'&&walker&&VoidAssets.pending===0);
 // ---- 1 FIRST CONTACT
 await page.waitForFunction(()=>!!state.universe.missions['first-contact']?.acquired,null,{timeout:30000});s=await S();log('mission 1 offered '+JSON.stringify(s.m)+' tracked='+s.tracked);assert.equal(s.tracked,'first-contact');await snap('01-first-contact-offered');
 await page.keyboard.press('KeyL');await page.waitForSelector('#personal-device.open');await page.waitForFunction(()=>!VoidPersonalDevice.busy);await page.click('[data-app=missions]');await page.waitForFunction(()=>!VoidPersonalDevice.busy);
 const t1=await page.textContent('#personal-device .pd-main');assert.match(t1,/FIRST CONTACT/);assert.match(t1,/OBJECTIVE/);assert.match(t1,/Open your V1/);assert.match(t1,/Speak with Admin/);assert.match(t1,/[12] OF 3 STEPS/);assert.match(t1,/TRACKED|STOP TRACKING/);await snap('02-v1-mission-log');
 await page.keyboard.press('KeyL');await page.waitForFunction(()=>!VoidPersonalDevice.isOpen);await page.waitForTimeout(1500);s=await S();assert.ok(/v1/.test(s.m['first-contact']),'opening the V1 counted');assert.ok(/controls/.test(s.m['first-contact']),'the KeyMap counted');
 await useE('admin');await snap('03-admin-dialogue');await finishTalk();await page.waitForTimeout(1500);s=await S();log('after Admin '+JSON.stringify(s.m));
 assert.match(s.m['first-contact'],/^DONE/);assert.ok(s.m['district-errand'],'mission 2 started');assert.equal(s.tracked,'district-errand');
 // ---- 2 DISTRICT ERRAND
 await useE('district-iris');await finishTalk();s=await S();assert.ok(!/report/.test(s.m['district-errand']),'Iris sends you to the bar and shop first');
 await useE('district-bar');await finishTalk();await useE('district-shop');await page.waitForSelector('#screen:not(.hidden) [data-action=walk-resume]');await page.click('[data-action=walk-resume]');await page.waitForFunction(()=>mode==='walking');
 s=await S();assert.ok(/bar/.test(s.m['district-errand'])&&/shop/.test(s.m['district-errand']),JSON.stringify(s.m));const c0=s.credits;
 await useE('district-iris');await finishTalk();await page.waitForTimeout(1000);s=await S();assert.match(s.m['district-errand'],/^DONE/);assert.equal(s.credits,c0+100,'reward once');assert.equal(s.tracked,'job-worth-taking');await snap('04-errand-complete');
 // ---- 3 A JOB WORTH TAKING
 await useE('district-iris');await finishTalk();s=await S();assert.match(s.m['job-worth-taking'],/collect/);
 await toArea('street');await useE('terminal');await finishTalk();s=await S();assert.match(s.m['job-worth-taking'],/deliver/);assert.equal(s.ship,false,'delivering the parcel does not give a ship');
 await toArea('interior');await useE('district-iris');await finishTalk();s=await S();assert.match(s.m['job-worth-taking'],/^DONE/);assert.equal(s.credits,c0+350);
 // ---- 4 THE SHIP OPPORTUNITY
 await useE('admin');await finishTalk();await useE('district-iris');await finishTalk();s=await S();assert.match(s.m['ship-opportunity'],/^DONE/);assert.equal(s.ship,false,'still no ship: it is registered at the terminal');assert.equal(s.free,false);assert.equal(s.tracked,'first-ship');
 // ---- 5 YOUR FIRST SHIP
 await toArea('street');const noShip=await page.evaluate(()=>!VoidBabylon.scene.meshes.some(m=>/^ship[:-]|starter/i.test(m.name)&&m.isEnabled()));log('pad empty before the claim: '+noShip);
 await useE('terminal');await finishTalk();await page.waitForTimeout(3000);s=await S();log('after claim '+JSON.stringify(s));
 assert.equal(s.ship,true);assert.deepEqual(s.owned,['starter']);assert.equal(s.free,true);assert.equal(s.quest,'open');assert.equal(s.pool,'closed','the old campaign stays closed');assert.match(s.m['first-ship'],/claim/);
 await page.waitForFunction(()=>mode==='walking'&&walkingLocation?.area==='street'&&VoidAssets.pending===0,null,{timeout:300000});await page.waitForTimeout(2500);await snap('05-ship-on-pad');
 // ---- persistence: save, reload, continue
 await page.evaluate(()=>save());const saved=await page.evaluate(()=>{const j=JSON.parse(localStorage.getItem('void-runner-campaign-v1'));return {ship:j.story.flags.shipAccess,awarded:j.story.flags.starterShipAwarded,free:j.universe.freeTravel,q:j.quest,owned:j.ownedShips,m:Object.keys(j.universe.missions)};});log('saved '+JSON.stringify(saved));
 assert.deepEqual([saved.ship,saved.awarded,saved.free,saved.q],['granted',true,true,'open']);
 await page.reload();await page.waitForFunction(()=>window.VoidStartup?.started);await page.evaluate(()=>Object.assign(VoidPreparation.limits,{scene:600000,assets:600000,optional:300000,total:1200000,module:600000,artwork:300000}));
 await page.locator('[data-action=menu-continue]').click();await page.waitForFunction(()=>mode==='pod-waking'||mode==='walking',null,{timeout:300000});
 if(await page.evaluate(()=>mode==='pod-waking'))await page.locator('#pod-wake [data-pod=exit]').click();await page.waitForFunction(()=>mode==='walking'&&VoidAssets.pending===0);
 s=await S();log('after reload '+JSON.stringify(s));assert.equal(s.ship,true,'ship ownership persists after a reload');assert.equal(s.free,true);assert.match(s.m['first-ship'],/claim/);assert.equal(s.tracked,'first-ship');
 await page.keyboard.press('KeyL');await page.waitForSelector('#personal-device.open');await page.waitForFunction(()=>!VoidPersonalDevice.busy);await page.click('[data-app=missions]');await page.waitForFunction(()=>!VoidPersonalDevice.busy);
 const t2=await page.textContent('#personal-device .pd-main');assert.match(t2,/YOUR FIRST SHIP/);assert.match(t2,/Board your ship at Pad 01/);assert.match(t2,/COMPLETED/);await snap('06-v1-after-reload');await page.keyboard.press('KeyL');await page.waitForFunction(()=>!VoidPersonalDevice.isOpen);
 // ---- board and fly
 await toArea('street');await useE('board');await page.waitForFunction(()=>mode==='play',null,{timeout:300000});s=await S();log('flying '+JSON.stringify(s.m));
 await page.waitForFunction(()=>/DONE/.test(JSON.stringify(state.universe.missions['first-ship']||{completed:false}).replace(/true/,'DONE')),null,{timeout:30000}).catch(()=>{});
 await page.waitForTimeout(2000);s=await S();assert.match(s.m['first-ship'],/^DONE/,'boarding completed the mission');assert.ok(s.m['first-departure'],'the departure mission started');await snap('07-cockpit');
 await page.evaluate(()=>{window.__iv=setInterval(()=>{const r=flight.route;if(!r||r.phase!=='align'){flight.mouseX=0;flight.mouseY=0;return;}const m=flightRoutes().find(x=>x.id==='meridian');if(!m)return;const b=flightBasis(),v=m.vector,al=b.f.x*v.x+b.f.y*v.y+b.f.z*v.z,ex=b.r.x*v.x+b.r.y*v.y+b.r.z*v.z,ey=b.u.x*v.x+b.u.y*v.y+b.u.z*v.z;
  const S=window.__st||(window.__st={sx:1,sy:1,flip:1});if(S.last!==undefined&&al<S.last-.002){if(S.flip===1)S.sy=-S.sy;else S.sx=-S.sx;S.flip=-S.flip;}S.last=al;flight.mouseX=Math.max(-1,Math.min(1,ex*4))*S.sx;flight.mouseY=Math.max(-1,Math.min(1,ey*4))*S.sy;},200);});
 let phaseSeen=new Set();for(let i=0;i<200;i++){await page.waitForTimeout(8000);const f=await page.evaluate(()=>({mode,loc:state.location,phase:flight?.route?.phase,dest:flight?.route?.destination,progress:flight?.route?.progress}));phaseSeen.add(f.phase);if(i%5===0)log('flight '+JSON.stringify(f));
  if(f.phase==='warp'&&!phaseSeen.has('shot')){phaseSeen.add('shot');await snap('08-warp');}if(['over','arrival','dock','walking'].includes(f.mode)||f.loc!=='earth')break;}   // 'preparing-flight' is the game loading the flight scene: keep flying
 await page.evaluate(()=>clearInterval(window.__iv));
 s=await S();log('after flight '+JSON.stringify(s));assert.equal(s.loc,'meridian','the ship arrived at Meridian Station');assert.ok(/launch/.test(s.m['first-departure'])&&/warp/.test(s.m['first-departure']),'the launch and the jump were recorded: '+s.m['first-departure']);
 await snap('09-arrival');
 // arrival panel, then dock at Meridian
 for(let i=0;i<6;i++){const st=await page.evaluate(()=>({mode,btn:[...document.querySelectorAll('#screen:not(.hidden) button')].map(b=>b.dataset.action||b.textContent.trim())}));log('arrival '+JSON.stringify(st));if(st.mode==='walking')break;const clicked=await page.evaluate(()=>{const b=document.querySelector('#screen:not(.hidden) [data-action=dock]');if(b){b.click();return true;}return false;});if(!clicked)await page.waitForTimeout(3000);else await page.waitForTimeout(4000);}
 await page.waitForFunction(()=>(mode==='walking'||mode==='dock')&&state.location==='meridian'&&VoidAssets.pending===0,null,{timeout:300000});await page.waitForTimeout(4000);s=await S();log('at Meridian '+JSON.stringify(s));
 assert.equal(s.loc,'meridian');assert.match(s.m['first-departure'],/^DONE/,'FIRST DEPARTURE is complete');assert.equal(s.tracked,null);assert.ok(s.credits>=0);
 const where=await page.evaluate(()=>({walking:walkingLocation?.id,interactions:walkingLocation?.interactions?.length,solids:walkingLocation?.solids?.length,visited:state.universe.visitedLocations}));log('destination scene '+JSON.stringify(where));assert.ok(where.walking&&where.interactions>0,'the destination loaded as a real place');
 await snap('10-meridian');
 await page.keyboard.press('KeyL');await page.waitForSelector('#personal-device.open');await page.waitForFunction(()=>!VoidPersonalDevice.busy);await page.click('[data-app=missions]');await page.waitForFunction(()=>!VoidPersonalDevice.busy);const t3=await page.textContent('#personal-device .pd-main');assert.match(t3,/FIRST DEPARTURE/);assert.match(t3,/COMPLETED/);await snap('11-v1-complete');
 clearInterval(watch);console.log(JSON.stringify({result:'PASS',errors}));assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1;});
