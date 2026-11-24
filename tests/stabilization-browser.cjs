/* Real Babylon assets and fresh browser storage. Default: ten visits + all public VR experiences/companions. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const smoke=process.env.STABILIZATION_SMOKE==='1',base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',out=process.env.STABILIZATION_OUTPUT||path.resolve('work/stabilization');
const channel=process.env.BROWSER_CHANNEL||'msedge',result={resources:[],vr:[],timing:[],errors:[]};fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:channel==='chromium'?{}:{channel})});try{
 const page=await browser.newPage({viewport:{width:1280,height:720},serviceWorkers:'block'});page.on('pageerror',e=>result.errors.push(e.stack));page.on('console',async m=>{if(/\[escort across\]|\[escort arrival\]/.test(m.text())){const details=await Promise.all(m.args().map(a=>a.evaluate(v=>v?.stack||v)));console.log('ESCORT DIAGNOSTIC',details);}if(/VOID frame|VOID.*preparation/.test(m.text())){const details=await Promise.all(m.args().map(a=>a.evaluate(v=>v?.error?.stack||v?.stack||v)));console.log('GAME ERROR',details);result.errors.push(m.text());}});
 await page.route('https://**/*',r=>r.abort());await page.route('**/api/**',r=>r.fulfill({status:503,body:'offline test'}));await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));
 await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>VoidStartup.started,null,{timeout:90000});
 // A software-rendered CI machine builds a scene several times slower than any player's device: give scene building room here, so the check measures the game and not the runner.
 await page.evaluate(()=>Object.assign(VoidPreparation.limits,{scene:60000,assets:60000,optional:30000}));
 await page.evaluate(()=>{leaveMenu();state=C.fresh();state.quest='open';state.location='meridian';state.universe.freeTravel=true;state.story.flags.tutorialSkipped=true;VoidGraphics.quality='low';VoidBabylon.setQuality('low');});
 async function settled(){await page.waitForFunction(()=>VoidAssets.pending===0,null,{timeout:120000});await page.waitForTimeout(350);}
 async function counts(){return page.evaluate(()=>{const s=VoidBabylon.scene;return {mode,error:VoidGraphics.error,meshes:s.meshes.length,textures:s.textures.length,materials:s.materials.length,skeletons:s.skeletons.length,groups:s.animationGroups.length,playing:s.animationGroups.filter(g=>g.isPlaying).length};});}
 for(let i=0;i<(smoke?3:10);i++){await page.evaluate(()=>enterWalking('hangar'));await settled();const c=await counts();result.resources.push(c);console.log('VISIT',i+1,c);assert(c.playing>=5,'crowd animations remain running');if(i>1)assert.deepEqual(c,result.resources[1],'resources plateau after warmup on visit '+(i+1));}
 await page.screenshot({path:path.join(out,'meridian.png')});
 // A frame-time observer is measured against RAF, not the stale engine FPS statistic.
 // Since the quarters (2026-11-16) the street is three quarters and an entry with no position lands in the Port, which has no street crowd. The governor is
 // checked where the crowd is: Old Town, entered at the spot on Main Street this test has always stood on.
 await page.evaluate(async()=>{state.location='earth';state.universe.currentSystem='sol';Object.assign(state.story.flags,{metAdmin:true,metIris:true,districtDoor:true,districtBadge:true});await enterWalking('sacramento',{spawn:[61,1.7,-65],yaw:0});Object.assign(walker,{x:61,z:-65,yaw:0,pitch:0});});await settled();
 assert.equal(await page.evaluate(()=>walkingLocation.quarter),'oldtown');assert(await page.evaluate(()=>VoidBabylon.district.nightlife.stats().people)>=8,'Old Town has its street crowd');
 const normal=await page.evaluate(async()=>{const times=[];await new Promise(resolve=>{let last=performance.now(),n=0;function f(t){times.push(t-last);last=t;if(++n===90)resolve();else requestAnimationFrame(f);}requestAnimationFrame(f);});return {metrics:VoidFrameMetrics.stats,raf:times.sort((a,b)=>a-b)[45],crowd:VoidBabylon.district.nightlife.stats()};});result.timing.push({normal});
 // Controlled presentation slowdown; no second simulation/render loop and no engine-FPS stub.
 await page.evaluate(()=>{const s=VoidBabylon.scene;globalThis.testSlowObserver=s.onBeforeRenderObservable.add(()=>{const until=performance.now()+55;while(performance.now()<until){}});});
 await page.waitForFunction(()=>VoidFrameMetrics.stats.ready&&VoidFrameMetrics.stats.fps>0&&VoidFrameMetrics.stats.fps<40&&VoidBabylon.district.nightlife.stats().budget<VoidBabylon.district.nightlife.stats().people&&VoidBabylon.district.nightlife.people.some(p=>p.anim&&!p.anim.active),null,{timeout:90000});const slow=await page.evaluate(()=>({metrics:VoidFrameMetrics.stats,crowd:VoidBabylon.district.nightlife.stats(),paused:VoidBabylon.district.nightlife.people.filter(p=>p.anim&&!p.anim.active).length}));result.timing.push({slow});assert(slow.metrics.ready&&slow.metrics.fps>0&&slow.metrics.fps<40);assert(slow.crowd.budget<slow.crowd.people,'slowdown reduces density budget');
 assert(slow.paused>0,'unseen crowd animation is paused');
 await page.evaluate(()=>VoidBabylon.scene.onBeforeRenderObservable.remove(testSlowObserver));
 // Moving to an empty, cheap view gives genuine recovery headroom while the same city governor remains active.
 await page.evaluate(()=>{Object.assign(walker,{x:0,z:-30,yaw:Math.PI,pitch:-1.1});});await page.waitForTimeout(smoke?8000:14000);
 const recovered=await page.evaluate(()=>({metrics:VoidFrameMetrics.stats,crowd:VoidBabylon.district.nightlife.stats()}));result.timing.push({recovered});
 if(recovered.metrics.fps>56)assert(recovered.crowd.budget>slow.crowd.budget,'density recovers gradually');
 await page.evaluate(()=>Object.assign(walker,{x:61,z:-65,yaw:0,pitch:0}));await page.waitForTimeout(1000);await page.screenshot({path:path.join(out,'neochinatown.png')});
 // Exercise the rendered street checkpoint with a disposable made character and the
 // real published-content validator, invitation handler, social plan, and actor runtime.
 // All network requests are blocked above; this content exists only in this browser.
 const socialId='test-gate-traveller';
 const fixture=await page.evaluate(id=>{
  const L=VoidNPCEscort.linkById('gate:north:foot-w'),a=VoidNPCEscort.areaOfQuarter(walkingLocation.quarter),w=L.ends[a].wait;
  const content={format:'darknet-district-mission-content',version:1,
   characters:{[id]:{name:'Gate test traveller',model:'npc-casual-m',adult:true}},
   npcs:{[id]:{mode:'stay',x:w.x,z:w.z,yaw:0,actions:['idle'],tier:2}},
   interactions:{[id]:{distance:3,cooldown:30,advanced:{follow:{role:'follow',invite:'Walk with me.',accept:'WALK TOGETHER',decline:'NOT NOW',maxWait:120,districtTravel:true}}}}};
  const ok=VoidLiveContent.use(content,'published',1);
  VoidLiveContent.replan();Object.assign(walker,{x:w.x,z:w.z+1,yaw:0,pitch:0});
  return {ok,refused:VoidLiveContent.current.refused,area:a};
 },socialId);
 assert(fixture.ok,JSON.stringify(fixture.refused));
 await page.waitForFunction(id=>VoidMadeNPCs.live?.()?.people.some(p=>p.id===id&&p.enabled&&p.talk),socialId,{timeout:120000});
 const invited=await page.evaluate(id=>{
  const item=walkingLocation.interactions.find(i=>i.character===id&&i.action==='made-npc');
  if(!item)return false;
  const actor=VoidMadeNPCs.live().people.find(p=>p.id===id);
  Object.assign(walker,{x:actor.x,z:actor.z+1,yaw:0,pitch:0});
  VoidInteractions.handlers.get(item.action)({item});
  const choice=speech?.choices?.[0];
  if(choice?.label!=='WALK TOGETHER')return false;
  speech=null;VoidAudio.cancel();choice.run();return true;
 },socialId);
 assert(invited,'the real dialogue invitation was accepted');
 await page.waitForFunction(id=>{const p=VoidLiveContent.plans()[id];return p?.social&&VoidLiveContent.socialTravelPolicy(id,p.step)?.tier===2&&VoidEscortAcross.present().some(a=>a.npc===id);},socialId,{timeout:60000});
 // Deliberately fail after the destination scene has loaded to verify rollback and retry.
 // Keep a separate synthetic callback as an independent observation of scanner timing.
 async function scanSocialTransaction(fail){
  return page.evaluate(async ({fail,id})=>{
   const ctl=VoidGateTransit,lane=VoidQuarters.lane('north:foot-w'),from=walkingLocation.quarter;
   const gate=VoidQuarters.gate(lane.gate),to=gate.ends[VoidQuarters.other(VoidQuarters.endOf(gate,from))].quarter;
   const original=enterWalking,commits=[],queued=[],observed=[],entering=[];
   const plan=VoidLiveContent.plans()[id],session=plan?.step,leg=VoidLiveContent.socialTravelPolicy(id,session)?.leg;
   const snapshot=()=>{const plan=VoidLiveContent.plans()[id],policy=VoidLiveContent.socialTravelPolicy(id,session),actor=VoidMadeNPCs.live?.()?.people.find(p=>p.id===id),escort=VoidEscortAcross.present().find(p=>p.npc===id);return {carry:VoidLiveContent.carried(id),area:plan?.area,planKey:plan?.key,leg:policy?.leg,quarter:walkingLocation.quarter,mode,here:VoidEscortAcross.here(),walker:{x:walker.x,z:walker.z,area:VoidNPCAreas.areaOf(walker,plan?.area)},actor:actor?{x:actor.x,z:actor.z,enabled:actor.enabled,esc:actor.esc}:null,escort:escort?{x:escort.x,z:escort.z,phase:escort.phase,ride:escort.ride}:null,log:VoidEscortAcross.log().filter(e=>e.npc===id).slice(-4)};};
   const before=snapshot();
   enterWalking=async function(id,opts){
    if(opts?.gateLane===lane.key)entering.push({phase:ctl.state,lane:ctl.lane,target:VoidEscortAcross.target(id,opts),...snapshot()});
    const loaded=await original.apply(this,arguments);
    if(opts?.gateLane===lane.key){
     observed.push({phase:ctl.state,...snapshot()});
     queued.push(ctl.deferExchange(lane.key,()=>commits.push({phase:ctl.state,quarter:walkingLocation.quarter,overlayHidden:document.getElementById('gate-transit').hidden})));
     if(fail)throw Error('intentional test failure after destination scene load');
    }
    return loaded;
   };
   try{
    Object.assign(walker,{x:lane.mid[0],z:lane.mid[1],yaw:0,pitch:0});
    const ok=await ctl.go();
    return {ok,from,to,quarter:walkingLocation.quarter,phase:ctl.state,queued,commits,history:ctl.history,before,entering,observed,after:snapshot(),session,leg};
   }finally{enterWalking=original;}
  },{fail,id:socialId});
 }
 result.socialGate=[];
 for(const fail of [false,true,false]){
  if(result.socialGate.length)await page.waitForTimeout(1700);
  // Let the actual follower settle at the registered origin waiting point.
  await page.evaluate(()=>{const a=VoidNPCEscort.areaOfQuarter(walkingLocation.quarter),w=VoidNPCEscort.linkById('gate:north:foot-w').ends[a].wait;Object.assign(walker,{x:w.x,z:w.z,yaw:0,pitch:0});});
  await page.waitForFunction(id=>{const a=VoidNPCEscort.areaOfQuarter(walkingLocation.quarter),w=VoidNPCEscort.linkById('gate:north:foot-w').ends[a].wait,p=VoidEscortAcross.present().find(p=>p.npc===id);return p&&p.plan.area===a&&Math.hypot(p.x-w.x,p.z-w.z)<=1.8;},socialId,{timeout:60000});
  const scan=await scanSocialTransaction(fail);
  result.socialGate.push(scan);console.log('SOCIAL GATE TRANSACTION',JSON.stringify(scan));
  assert.deepEqual(scan.queued,[true],'the real EXCHANGE accepted exactly one deferred callback');
  assert.equal(scan.ok,!fail);
  assert.equal(scan.quarter,fail?scan.from:scan.to);
  assert.equal(scan.phase,fail?'RECOVERY':'COMPLETE');
  assert.deepEqual(scan.commits,fail?[]:[{phase:'COMPLETE',quarter:scan.to,overlayHidden:true}],'no premature or stale callback');
  assert(Number.isSafeInteger(scan.leg),'active social journey ordinal');
  assert.equal(scan.observed.length,1);
  assert.equal(scan.observed[0].phase,'EXCHANGE');
  assert.equal(scan.observed[0].carry?.area,scan.from,'actual NPC retains source area until clearance');
  assert.equal(scan.observed[0].leg,scan.leg,'journey does not advance while loading');
  assert.equal(scan.after.carry?.area,fail?scan.from:scan.to,'actual NPC commits only on clearance');
  assert.equal(scan.after.leg,scan.leg+(fail?0:1));
  assert.equal(scan.after.carry?.key,scan.session,'retry preserves the invitation generation');
  await settled();
  await page.waitForFunction(({id,area,session})=>{const p=VoidMadeNPCs.live?.()?.people.find(p=>p.id===id);return p?.enabled&&p.esc?.key===session&&VoidEscortAcross.present().some(a=>a.npc===id&&a.plan.area===area);},{id:socialId,area:fail?scan.from:scan.to,session:scan.session},{timeout:120000});
  await page.screenshot({path:path.join(out,'social-gate-'+result.socialGate.length+'.png')});
 }
 assert.equal(await page.evaluate(()=>walkingLocation.quarter),'oldtown','checkpoint retry returned to the original test district');
 await page.evaluate(()=>{VoidLiveContent.resetRun();VoidLiveContent.use(null,'shipped',0);VoidLiveContent.replan();});
 // Full campaign data lives in the original object; VR gets only a detached simulation state.
 const options=smoke?[['forest',{}]]:[['forest',{}],['tropical',{}],['suite',{companion:'seren'}],['suite',{companion:'kai'}],['suite',{companion:'nadia'}]];
 for(const [id,opts]of options){
  assert(await page.evaluate(({id,opts})=>VoidVR.launch(id,opts),{id,opts}),'enter '+id);await page.waitForTimeout(200);
  const snapshot=await page.evaluate(()=>JSON.stringify(VoidSimulationEffects.session.campaign));const saved=await page.evaluate(()=>localStorage.getItem(SAVE_KEY));
  const probe=await page.evaluate(()=>{const owner=VoidSimulationEffects.session.campaign;delete state.progression.flags.jump;groundAction('jump');const jump=state.progression.flags.jump===true;state.credits=0;state.progression.personal.ammo=0;state.progression.personal.reserve=0;state.progression.equipment.owned=[];state.progression.reputation.test=99;state.story.flags.vrTest=true;state.story.events.push('vr-test');state.universe.completedObjectives.push('vr-test');save();return {jump,owner:JSON.stringify(owner),effects:VoidSimulationEffects.session.effects};});
  assert.equal(probe.jump,false,'jump is routed to the inert progression sink');assert.equal(probe.owner,snapshot,'campaign remains untouched during VR');assert.equal(await page.evaluate(()=>localStorage.getItem(SAVE_KEY)),saved,'VR cannot persist campaign changes');
  await page.screenshot({path:path.join(out,'vr-'+id+(opts.companion?'-'+opts.companion:'')+'.png')});
  await page.evaluate(()=>VoidVR.exit());assert(!await page.evaluate(()=>VoidSimulationEffects.active));assert(!await page.evaluate(()=>state.story.flags.vrTest));assert(!await page.evaluate(()=>state.universe.completedObjectives.includes('vr-test')));
  const restored=await page.evaluate(()=>({credits:state.credits,ammo:state.progression.personal.ammo,equipment:state.progression.equipment.owned,events:state.story.events,flags:state.progression.flags,reputation:state.progression.reputation})),prior=JSON.parse(snapshot);
  assert.deepEqual(restored,{credits:prior.credits,ammo:prior.progression.personal.ammo,equipment:prior.progression.equipment.owned,events:prior.story.events,flags:prior.progression.flags,reputation:prior.progression.reputation});assert.deepEqual(await page.evaluate(()=>VoidVR.debug.audio),{nodes:0,timers:0},'VR audio is fully disconnected');result.vr.push({id,opts,isolation:true,resources:await counts()});console.log('VR PASS',id,opts);
 }
 // Interrupted VR resumes the real checkpoint, not the modified sandbox.
 await page.evaluate(()=>VoidVR.launch('forest',{}));const saved=await page.evaluate(()=>({credits:VoidSimulationEffects.session.campaign.credits,ammo:VoidSimulationEffects.session.campaign.progression.personal.ammo}));
 await page.evaluate(()=>{state.credits=1;state.progression.personal.ammo=0;save();});await page.reload();await page.waitForFunction(()=>VoidStartup.started);await page.locator('[data-action=menu-continue]').click();
 // Since the District-first start (2026-11-10) Continue wakes the player in their Sleeping Pod, and a player with no saved look meets the character creator first.
 // Walk that path as a player would: save the look, then get up.
 await page.waitForFunction(()=>!VoidGraphics.busy&&(mode==='walking'||mode==='pod-waking'||!!document.querySelector('#character-creator.on')),null,{timeout:90000});
 if(await page.locator('#character-creator.on').count()){await page.waitForFunction(()=>!document.querySelector('[data-cc=confirm]').disabled,null,{timeout:90000});await page.locator('[data-cc=confirm]').click({timeout:180000});await page.waitForFunction(()=>mode==='pod-waking'||mode==='walking',null,{timeout:180000});}
 if(await page.evaluate(()=>mode==='pod-waking')){await page.waitForSelector('#pod-wake:not([hidden])',{timeout:180000});   // the strip's EXIT POD button was removed (16 Nov 2026); E is the key for it
  for(let i=0;i<40&&await page.evaluate(()=>mode==='pod-waking');i++){await page.keyboard.press('KeyE');await page.waitForTimeout(3000);}}   // pressed again only while still in the pod (a key pressed before the pod is ready is lost; a button click used to wait)
 await page.waitForFunction(()=>mode==='walking'&&!VoidGraphics.busy,null,{timeout:240000});assert.deepEqual(await page.evaluate(()=>({credits:state.credits,ammo:state.progression.personal.ammo})),saved);assert(!await page.evaluate(()=>state.story.flags.vrReturn));result.interruption=true;
 // Isolated UI mode fixtures: hold the simulation while the existing weapon UI RAF updates.
 const visibility=await page.evaluate(()=>{const e=document.getElementById('weapon-select-hud');return {hidden:e.hidden,display:getComputedStyle(e).display};});assert.equal(visibility.hidden,false);assert.notEqual(visibility.display,'none');
 await page.evaluate(()=>{globalThis.testUIOwner={update,draw};update=()=>{};draw=()=>{};});
 for(const modeName of ['play','road-taxi','menu','dialogue']){await page.evaluate(m=>{mode=m;},modeName);await page.waitForFunction(()=>{const e=document.getElementById('weapon-select-hud');return e.hidden&&getComputedStyle(e).display==='none';},null,{timeout:30000}).catch(()=>{});const v=await page.locator('#weapon-select-hud').evaluate(e=>({hidden:e.hidden,display:getComputedStyle(e).display}));assert(v.hidden&&v.display==='none',modeName);}
 await page.evaluate(()=>{update=testUIOwner.update;draw=testUIOwner.draw;resumeWalking();});assert.deepEqual(result.errors,[]);console.log(JSON.stringify(result,null,2));
 }finally{fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(result,null,2));await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
