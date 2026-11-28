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
   npcs:{[id]:{mode:'stay',x:w.x,z:w.z,yaw:0,actions:['idle'],tier:1}},
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
 await page.waitForFunction(id=>{const p=VoidLiveContent.plans()[id];return p?.social&&VoidLiveContent.socialTravelPolicy(id,p.step)?.enabled===true&&VoidEscortAcross.present().some(a=>a.npc===id);},socialId,{timeout:60000});
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

 // Reuse the actual disposable follower, never a removed world NPC. Drive the real taxi
 // controller; only accelerate its public traffic rules on open road, as in ncz-quarters-browser.
 // No actor/escort/carry state is injected. Fail after loading the destination, then hail again.
 result.socialTaxi=[];
 const taxiSnapshot=()=>page.evaluate(id=>{
  const T=VoidRoadTaxi,j=T.world?.job,p=VoidLiveContent.plans()[id],a=VoidMadeNPCs.live?.()?.people.find(x=>x.id===id),c=VoidLiveContent.carried(id),policy=VoidLiveContent.socialTravelPolicy(id,p?.step);
  const seat=j&&!j.released?VoidRoadTaxiRules.companionSeat(j.cab):null;
  return {quarter:walkingLocation?.quarter,mode,gate:VoidGateTransit.state,rideOutcome:globalThis.socialTaxiProbe?.outcome||null,busy:VoidGateTransit.busy,crossing:T.crossing,active:T.active,phase:j&&!j.released?j.cab.phase:null,area:p?.area,session:p?.step,leg:policy?.leg,carry:c,actor:a||null,seatDistance:seat&&a?.esc?Math.hypot(a.esc.x-seat.x,a.esc.z-seat.z):null,credits:state.credits,trip:state.story.flags.roadTaxiTrip||null};
 },socialId);
 async function taxiUntil(test,label,advancePickup=false,advanceOccupied=false){
  const deadline=Date.now()+240000;let previous='';
  for(;;){
   if(advancePickup||advanceOccupied)await page.evaluate(({pickup,occupied})=>{
    const taxi=VoidRoadTaxi,world=taxi.world,cab=world?.job?.cab,made=VoidBabylon.district?.streetPair?.made;
    if(!cab||taxi.crossing||VoidGateTransit.busy)return;
    const phase=pickup?'to-pickup':'to-dest';
    if(occupied&&(!made||mode!=='road-taxi'))return;
    // Each traffic step has a matching actor step, including through corners.
    for(let i=0;i<25&&cab.phase===phase&&cab.pathLen-cab.s>3;i++){
     VoidRoadTaxiRules.stepWorld(world,.1,{x:walker.x,z:walker.z,riding:occupied});
     if(occupied)made.tick(.1);
    }
   },{pickup:advancePickup,occupied:advanceOccupied});
   const s=await taxiSnapshot();
   const key=JSON.stringify([s.mode,s.quarter,s.gate,s.crossing,s.phase,s.session,s.actor?.esc?.ride,s.rideOutcome?.ok]);
   if(key!==previous){previous=key;console.log('SOCIAL TAXI PROGRESS',label,JSON.stringify(s));}
   if(test(s))return s;
   assert(Date.now()<deadline,label+' timed out: '+JSON.stringify(s));await page.waitForTimeout(350);
  }
 }
 for(const fail of [true,false]){
  const origin=await taxiSnapshot();assert.equal(origin.quarter,'oldtown');assert(origin.session&&Number.isSafeInteger(origin.leg),'invitation survived foot journey');
  // Stand beside the existing actor on the origin pavement before hailing.
  assert(await page.evaluate(id=>{const a=VoidMadeNPCs.live?.()?.people.find(p=>p.id===id),P=VoidLiveContent.plans()[id],point=a&&P&&VoidNPCAreas.nearest(a,P.area,12);if(!point)return false;Object.assign(walker,{x:point.x,z:point.z,yaw:0,pitch:0});state.credits=1000;return VoidRoadTaxi.hail('avenue');},socialId),'hail real taxi to the adjacent quarter');
  await taxiUntil(s=>s.phase==='waiting','taxi reaches pickup',true);
  assert(await page.evaluate(id=>{const P=VoidLiveContent.plans()[id],j=VoidRoadTaxi.world?.job;if(!P||!j)return false;const ds=VoidRoadTaxiRules.doorPoints(j.cab);for(const d of ds.slice(0,2)){const p=VoidNPCAreas.nearest(d,P.area,8);if(p){Object.assign(walker,{x:p.x,z:p.z,yaw:0,pitch:0});return true;}}return false;},socialId),'approach a real taxi door from the pavement');
  const seated=await taxiUntil(s=>s.actor?.esc?.ride==='in-cab'&&s.session===origin.session&&s.seatDistance<=1,'actual NPC boards',false);
  console.log('SOCIAL TAXI SEATED',JSON.stringify(seated));
  // Record the real scene exchange without changing its arrival callbacks.
  await page.evaluate(({id,fail})=>{
   const original=enterWalking,ride=VoidGateTransit.ride,records=[];
   const probe=globalThis.socialTaxiProbe={original,ride,records,outcome:null};
   const snap=()=>{const p=VoidLiveContent.plans()[id],a=VoidMadeNPCs.live?.()?.people.find(x=>x.id===id);return {phase:VoidGateTransit.state,quarter:walkingLocation?.quarter,carry:VoidLiveContent.carried(id),session:p?.step,leg:VoidLiveContent.socialTravelPolicy(id,p?.step)?.leg,ride:a?.esc?.ride||null};};
   // Capture the controller's own result before its walking tick resets RECOVERY to IDLE.
   VoidGateTransit.ride=async function(o){
    console.log('SOCIAL TAXI RIDE START',JSON.stringify({lane:o.lane,from:o.from,to:o.to,...snap()}));
    try{const ok=await ride.apply(this,arguments);probe.outcome={ok,...snap(),history:VoidGateTransit.history.slice(-15)};console.log('SOCIAL TAXI RIDE END',JSON.stringify(probe.outcome));return ok;}
    catch(e){console.log('SOCIAL TAXI RIDE ERROR',String(e));throw e;}
   };
   enterWalking=async function(key,opts){
    const bay=opts?.gateLane&&VoidQuarters.lane(opts.gateLane)?.kind==='bay'&&VoidGateTransit.state==='EXCHANGE';
    if(bay)records.push({point:'before',...snap()});
    const value=await original.apply(this,arguments);
    if(bay){records.push({point:'loaded',...snap()});if(fail)throw Error('intentional social taxi failure after destination load');}
    return value;
   };
  },{id:socialId,fail});
  let end,records;
  try{
   await page.evaluate(()=>VoidRoadTaxi.board());
   assert.equal(await page.evaluate(()=>mode),'road-taxi','player boarded the actual taxi');
   end=await taxiUntil(s=>!s.crossing&&!s.busy&&(fail?s.rideOutcome?.ok===false&&s.rideOutcome.phase==='RECOVERY'&&s.quarter==='oldtown'&&s.mode==='walking':s.rideOutcome?.ok===true&&s.rideOutcome.phase==='COMPLETE'&&s.quarter==='avenue'&&s.mode==='road-taxi'),'taxi checkpoint '+(fail?'recovery':'clearance'),false,true);
  }finally{records=await page.evaluate(()=>{const p=globalThis.socialTaxiProbe;enterWalking=p.original;VoidGateTransit.ride=p.ride;delete globalThis.socialTaxiProbe;return p.records;});console.log('SOCIAL TAXI EXCHANGE TRACE',JSON.stringify(records));}
  result.socialTaxi.push({fail,origin,seated,records,end});console.log('SOCIAL TAXI TRANSACTION',JSON.stringify(result.socialTaxi.at(-1)));
  assert.deepEqual(records.map(x=>x.point),['before','loaded'],'one actual bay exchange');
  assert.equal(records[0].ride,'in-cab','actual actor remains seated at exchange');
  assert.equal(records[0].session,origin.session);
  assert.equal(records[1].carry?.area,origin.area,'no premature taxi arrival');
  assert.equal(records[1].leg,origin.leg,'no premature leg advance');
  assert.equal(end.carry?.key,origin.session,'same invitation after exchange');
  assert.equal(end.leg,origin.leg+(fail?0:1),'only clearance advances the journey');
  const area=await page.evaluate(()=>VoidNPCEscort.areaOfQuarter(walkingLocation.quarter));
  assert.equal(end.carry?.area,area);
  if(fail){
   assert.equal(end.credits,1000,'failed trip refunded exactly once');assert.equal(end.trip,null);
   await taxiUntil(s=>s.actor?.enabled&&s.actor.esc?.key===origin.session&&!s.actor.esc.ride&&s.area===area,'actual NPC recovers on the source pavement',false);
  }else{
   await taxiUntil(s=>s.actor?.esc?.key===origin.session&&s.actor.esc.ride==='in-cab'&&s.seatDistance<=1,'actual NPC seated after clearance',false);
   await taxiUntil(s=>s.phase==='arrived','taxi reaches actual destination',false,true);
   await page.evaluate(()=>VoidRoadTaxi.exit());
   await taxiUntil(s=>s.mode==='walking'&&s.actor?.enabled&&s.actor.esc?.key===origin.session&&!s.actor.esc.ride&&s.area===area,'actual NPC exits taxi with player',false);
   assert.equal(await page.evaluate(()=>state.story.flags.roadTaxiTrip||null),null,'successful trip closes fare record');
  }
  await page.screenshot({path:path.join(out,'social-taxi-'+(fail?'recovery':'clearance')+'.png')});
 }

 await page.evaluate(()=>{VoidLiveContent.resetRun();VoidLiveContent.use(null,'shipped',0);VoidLiveContent.replan();});

 // Same-area physical return: a fresh, disposable browser-only NPC in Avenue.
 // Use the real mounted actor, invitation and STOP FOLLOWING choice; never set
 // its position, escort state or return driver directly. Advance only its
 // existing runtime tick to keep this test independent of software GPU FPS.
 const returnId='test-ordinary-return';
 const returnFixture=await page.evaluate(id=>{
  const A=VoidNPCAreas,area=VoidNPCEscort.areaOfQuarter(walkingLocation.quarter),home={x:19.5,z:2.5};
  if(area!=='avenue')throw Error('return fixture requires Avenue');
  const opts={adult:true,made:true};
  const candidates=[6,8,4].flatMap(d=>Array.from({length:16},(_,i)=>({x:home.x+d*Math.cos(i*Math.PI/8),z:home.z+d*Math.sin(i*Math.PI/8)})));
  const target=candidates.find(q=>{const c=A.check(q,area,undefined,opts);return c.ok&&c.area===area&&!A.leg(home,q,opts).length;});
  if(!target)throw Error('no checked same-area follow target');
  const content={format:'darknet-district-mission-content',version:1,
   characters:{[id]:{name:'Return test walker',model:'npc-casual-m',adult:true}},
   npcs:{[id]:{mode:'stay',...home,yaw:0,actions:['idle'],tier:1}},
   interactions:{[id]:{distance:3,cooldown:30,advanced:{follow:{role:'follow',invite:'Walk with me.',accept:'WALK TOGETHER',decline:'NOT NOW',maxWait:120,districtTravel:true}}}}};
  const ok=VoidLiveContent.use(content,'published',1);VoidLiveContent.replan();Object.assign(walker,{...home,yaw:0,pitch:0});
  return {ok,refused:VoidLiveContent.current.refused,home,target,area};
 },returnId);
 assert(returnFixture.ok,JSON.stringify(returnFixture.refused));
 await page.waitForFunction(id=>VoidMadeNPCs.live?.()?.people.some(p=>p.id===id&&p.enabled&&p.talk),returnId,{timeout:120000});
 const returnProbe=await page.evaluate(({id,home,target,area})=>{
  const A=VoidNPCAreas,made=VoidBabylon.district?.streetPair?.made,actor=made?.people.get(id),opts={adult:true,made:true};
  if(!actor)throw Error('fixture NPC is not mounted');
  const pos=()=>({x:actor.s.x,z:actor.s.z}),dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  const choose=label=>{
   const item=walkingLocation.interactions.find(i=>i.character===id&&i.action==='made-npc');
   if(!item)throw Error('fixture TALK missing');
   Object.assign(walker,{...pos(),yaw:0,pitch:0});
   VoidInteractions.handlers.get(item.action)({item});
   const choice=speech?.choices?.find(c=>c.label===label);
   if(!choice)throw Error('missing choice '+label);
   speech=null;VoidAudio.cancel();choice.run();
  };
  choose('WALK TOGETHER');
  Object.assign(walker,{...target,yaw:0,pitch:0});
  for(let i=0;i<480&&dist(pos(),home)<2.5;i++)made.tick(.05);
  const displaced=pos(),active=VoidLiveContent.plans()[id];
  if(dist(displaced,home)<2.5||!active?.social||!actor.esc)throw Error('fixture did not physically follow: '+JSON.stringify({displaced,active}));
  choose('STOP FOLLOWING');
  const before=pos();Object.assign(walker,{...target,yaw:0,pitch:0});
  let maxStep=0,total=0,sawReturn=false,blocked=0,renderError=0,arrived=false;
  for(let i=0;i<600;i++){
   const last=pos();made.tick(.05);const next=pos(),step=dist(last,next);
   maxStep=Math.max(maxStep,step);total+=step;
   if(step>1e-8&&A.leg(last,next,opts).length)blocked++;
   renderError=Math.max(renderError,dist(next,actor.node.position));
   sawReturn||=actor.s.mode==='return';
   if(sawReturn&&!actor.returnJourney&&dist(next,home)<=.03){arrived=true;break;}
  }
  return {displaced:dist(displaced,home),cancelJump:dist(displaced,before),maxStep,total,blocked,renderError,sawReturn,arrived,remaining:dist(pos(),home),social:!!VoidLiveContent.plans()[id]?.social,mode:actor.s.mode};
 },{id:returnId,...returnFixture});
 console.log('NPC SAME AREA PHYSICAL RETURN',JSON.stringify(returnProbe));result.npcPhysicalReturn=returnProbe;
 assert(returnProbe.displaced>=2.5,'actor followed away from routine');
 assert(returnProbe.cancelJump<.001,'cancelling did not reposition the actor');
 assert(returnProbe.sawReturn&&returnProbe.arrived,'actual mounted return completed');
 assert(returnProbe.maxStep<=.31,'bounded physical strides, no relocation');
 assert(returnProbe.total+.03>=returnProbe.displaced,'walked the return distance');
 assert.equal(returnProbe.blocked,0,'return strides passed the real pedestrian geometry');
 assert(returnProbe.renderError<.03,'Babylon node follows the actual NPC position');
 assert.equal(returnProbe.social,false,'cancelled invitation is not active');
 await page.screenshot({path:path.join(out,'npc-physical-return.png')});

// Reload the real Avenue scene mid-return. Use an offline fixture identity only
// for this test: every remote API and Firebase request is blocked above.
 await page.evaluate(()=>{globalThis.npcReturnFixtureUser=VoidAccount.user;VoidAccount.user={uid:'offline-return-fixture',isAnonymous:true,getIdToken:async()=> 'offline-fixture'};});
 try{
  await page.evaluate(({home})=>enterWalking('sacramento',{quarter:'avenue',silent:true,spawn:[home.x,1.7,home.z],yaw:0}),returnFixture);
  await settled();
  await page.waitForFunction(id=>VoidBabylon.district?.streetPair?.made?.people.get(id)?.node.isEnabled(),returnId,{timeout:120000});
  const suspended=await page.evaluate(({id,home,target,area})=>{
   const made=VoidBabylon.district.streetPair.made,actor=made.people.get(id),A=VoidNPCAreas,opts={adult:true,made:true};
   const pos=()=>({x:actor.s.x,z:actor.s.z}),dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
   const choose=label=>{
    const item=walkingLocation.interactions.find(i=>i.character===id&&i.action==='made-npc');
    if(!item)throw Error('return reload fixture TALK missing');
    Object.assign(walker,{...pos(),yaw:0,pitch:0});
    VoidInteractions.handlers.get(item.action)({item});
    const choice=speech?.choices?.find(c=>c.label===label);
    if(!choice)throw Error('return reload fixture missing '+label);
    speech=null;VoidAudio.cancel();choice.run();
   };
   choose('WALK TOGETHER');Object.assign(walker,{...target,yaw:0,pitch:0});
   for(let i=0;i<480&&dist(pos(),home)<2.5;i++)made.tick(.05);
   if(dist(pos(),home)<2.5||!actor.esc)throw Error('reload fixture did not follow');
   choose('STOP FOLLOWING');Object.assign(walker,{...target,yaw:0,pitch:0});
   for(let i=0;i<8;i++)made.tick(.05);
   const observed=pos(),legal=A.check(observed,area,undefined,opts);
   if(!actor.returnJourney||!legal.ok||legal.area!==area||dist(observed,home)<1.5)throw Error('no legal mid-return observation');
   globalThis.npcReturnFixtureOldNode=actor.node;
   return {observed,distance:dist(observed,home)};
  },{id:returnId,...returnFixture});
  await page.evaluate(({target})=>enterWalking('sacramento',{quarter:'avenue',silent:true,spawn:[target.x,1.7,target.z],yaw:0}),returnFixture);
  await page.waitForFunction(id=>VoidBabylon.district?.streetPair?.made?.people.get(id)?.node.isEnabled(),returnId,{timeout:120000});
  const remounted=await page.evaluate(({id,home,area,suspended})=>{
   const made=VoidBabylon.district.streetPair.made,actor=made.people.get(id),A=VoidNPCAreas,opts={adult:true,made:true};
   const pos=()=>({x:actor.s.x,z:actor.s.z}),dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
   const start=pos(),recreated=actor.node!==globalThis.npcReturnFixtureOldNode&&globalThis.npcReturnFixtureOldNode.isDisposed();
   const resumed=!!actor.returnJourney,remainingAtMount=dist(start,home),discontinuity=dist(start,suspended.observed);
   let maxStep=0,blocked=0,arrived=false;
   for(let i=0;i<600;i++){const last=pos();made.tick(.05);const next=pos(),step=dist(last,next);maxStep=Math.max(maxStep,step);if(step>1e-8&&A.leg(last,next,opts).length)blocked++;if(!actor.returnJourney&&dist(next,home)<=.03){arrived=true;break;}}
   return {recreated,resumed,remainingAtMount,discontinuity,maxStep,blocked,arrived,remaining:dist(pos(),home)};
  },{id:returnId,...returnFixture,suspended});
  console.log('NPC SCENE RELOAD PHYSICAL RETURN',JSON.stringify({suspended,remounted}));result.npcReturnReload={suspended,remounted};
  assert(remounted.recreated,'actual NPC model disposed and remounted');
  assert(remounted.resumed&&remounted.remainingAtMount>1,'return still active after scene reload, not snapped home');
  assert(remounted.discontinuity<1,'retained position allowing ordinary elapsed walking ticks');
  assert(remounted.arrived&&remounted.maxStep<=.31&&remounted.blocked===0,'resumed return physically completed without collision');
  await page.screenshot({path:path.join(out,'npc-return-reload.png')});
 }finally{await page.evaluate(()=>{VoidAccount.user=globalThis.npcReturnFixtureUser;delete globalThis.npcReturnFixtureUser;delete globalThis.npcReturnFixtureOldNode;});}
 await page.evaluate(()=>{VoidLiveContent.resetRun();VoidLiveContent.use(null,'shipped',0);VoidLiveContent.replan();});


 // Rendered passing-only transit regression: seed a disposable actor at a legal
 // route endpoint, then use the actual mounted driver and scene lifecycle.
 // This isolates the return/remount adapter; the preceding tests cover the
 // real invitation and STOP FOLLOWING path without injecting actor state.
 const doorwayId='test-doorway-return';
 await page.evaluate(()=>{globalThis.doorwayFixtureUser=VoidAccount.user;VoidAccount.user={uid:'offline-doorway-fixture',isAnonymous:true,getIdToken:async()=> 'offline-fixture'};});
 try{
  const route=await page.evaluate(()=>{
   // Match the proven public-pavement passing-only regression fixture.
   const A=VoidNPCAreas,area='oldtown',opts={made:true,adult:false};
   const legal=(p,passing=false)=>{const c=A.check(p,area,passing?A.CLEAR-.1:undefined,{...opts,passing});return c.ok&&c.area===area;};
   for(let i=517;i<=524;i++){
    const x=i/10,from={x,z:-63},home={x,z:-54};
    if(!legal(from)||!legal(home)||A.leg(from,home,opts).length)continue;
    const samples=Array.from({length:46},(_,j)=>({x,z:-63+j*.2}));
    if(samples.every(p=>legal(p,true))&&samples.some(p=>!legal(p)))return {from,home,area};
   }
   throw Error('no real Old Town passing-only transit fixture');
  });
  await page.evaluate(({from})=>enterWalking('sacramento',{quarter:'oldtown',silent:true,spawn:[from.x,1.7,from.z],yaw:0}),route);
  await settled();
  const accepted=await page.evaluate(({id,home})=>{
   const content={format:'darknet-district-mission-content',version:1,
    // The persisted character schema uses omission, not false, for the default flag.
    characters:{[id]:{name:'Doorway return test walker',model:'npc-casual-m'}},
    npcs:{[id]:{mode:'stay',...home,yaw:0,actions:['idle'],tier:1}}};
   const ok=VoidLiveContent.use(content,'published',1);VoidLiveContent.replan();
   return {ok,refused:VoidLiveContent.current.refused};
  },{id:doorwayId,...route});
  assert(accepted.ok,JSON.stringify(accepted.refused));
  await page.waitForFunction(id=>VoidBabylon.district?.streetPair?.made?.people.get(id)?.node.isEnabled(),doorwayId,{timeout:120000});
  const suspended=await page.evaluate(({id,from,home,area})=>{
   const A=VoidNPCAreas,made=VoidBabylon.district.streetPair.made,actor=made.people.get(id),opts={adult:!!actor.c.adult,made:true};
   const legal=(p,passing=false)=>{const c=A.check(p,area,passing?A.CLEAR-.1:undefined,{...opts,passing});return c.ok&&c.area===area;};
   const pos=()=>({x:actor.s.x,z:actor.s.z}),dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
   made.tick(.05);
   if(opts.adult||actor.plan?.area!==area||dist(actor.plan,home)>.03||!legal(from))throw Error('invalid mounted doorway routine or fixture eligibility');
   Object.assign(actor.s,from);actor.node.position.x=from.x;actor.node.position.z=from.z;
   actor.returnJourney={area,driver:VoidNPCReturn.createMountedReturn()};
   let maxStep=0,blocked=0;
   for(let i=0;i<600;i++){
    const last=pos();made.tick(.05);const next=pos(),step=dist(last,next);
    maxStep=Math.max(maxStep,step);if(step>1e-8&&A.leg(last,next,opts).length)blocked++;
    if(step>1e-8&&!legal(next)&&legal(next,true)&&actor.returnJourney){
     // Prevent background ticks on the OLD instance between sampling and disposal.
     // The new scene starts normally; its first stride is not stubbed.
     globalThis.doorwayFixtureOld={node:actor.node,driver:actor.returnJourney.driver,made,tick:made.tick};
     made.tick=()=>{};
     return {observed:next,distance:dist(next,home),maxStep,blocked,renderError:dist(next,actor.node.position)};
    }
   }
   throw Error('mounted actor never reached a passing-only position');
  },{id:doorwayId,...route});
  assert(suspended.distance>1&&suspended.maxStep<=.31&&suspended.blocked===0&&suspended.renderError<.03,'verified rendered transit before unload');
  await page.evaluate(({from})=>enterWalking('sacramento',{quarter:'oldtown',silent:true,spawn:[from.x,1.7,from.z],yaw:0}),route);
  await page.waitForFunction(id=>VoidBabylon.district?.streetPair?.made?.people.get(id)?.node.isEnabled(),doorwayId,{timeout:120000});
  const remounted=await page.evaluate(({id,home,area,suspended})=>{
   const A=VoidNPCAreas,made=VoidBabylon.district.streetPair.made,actor=made.people.get(id),opts={adult:!!actor.c.adult,made:true};
   const old=globalThis.doorwayFixtureOld,pos=()=>({x:actor.s.x,z:actor.s.z}),dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
   const recreated=actor.node!==old.node&&old.node.isDisposed(),sameDriver=actor.returnJourney?.driver===old.driver;
   const start=pos(),discontinuity=dist(start,suspended.observed),remainingAtMount=dist(start,home);
   let maxStep=0,blocked=0,renderError=0,arrived=false;
   for(let i=0;i<600;i++){
    const last=pos();made.tick(.05);const next=pos(),step=dist(last,next);
    maxStep=Math.max(maxStep,step);if(step>1e-8&&A.leg(last,next,opts).length)blocked++;
    renderError=Math.max(renderError,dist(next,actor.node.position));
    if(!actor.returnJourney&&dist(next,home)<=.03){arrived=true;break;}
   }
   return {recreated,sameDriver,discontinuity,remainingAtMount,maxStep,blocked,renderError,arrived,remaining:dist(pos(),home)};
  },{id:doorwayId,...route,suspended});
  console.log('NPC PASSING-ONLY SCENE RELOAD',JSON.stringify({suspended,remounted}));result.npcDoorwayReload={suspended,remounted};
  assert(remounted.recreated&&remounted.sameDriver,'actual model disposal and exact issued driver retained');
  assert(remounted.discontinuity<1&&remounted.remainingAtMount>1,'resume near observed transit, not the routine endpoint');
  assert(remounted.arrived&&remounted.maxStep<=.31&&remounted.blocked===0&&remounted.renderError<.03,'resumed model walks to routine without relocation or collision');
  await page.screenshot({path:path.join(out,'npc-doorway-reload.png')});
 }finally{
  await page.evaluate(()=>{
   const old=globalThis.doorwayFixtureOld;if(old)old.made.tick=old.tick;
   delete globalThis.doorwayFixtureOld;VoidAccount.user=globalThis.doorwayFixtureUser;delete globalThis.doorwayFixtureUser;
   VoidLiveContent.resetRun();VoidLiveContent.use(null,'shipped',0);VoidLiveContent.replan();
  });
 }
 await page.evaluate(({home})=>enterWalking('sacramento',{quarter:'avenue',silent:true,spawn:[home.x,1.7,home.z],yaw:0}),returnFixture);
 await settled();

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
