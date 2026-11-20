/* FOLLOW INTO A PLACE in a real browser (offline; 20 Nov 2026, the owner: "For the follow options if I add an apartment there should be an option to follow into the
   apartment"). A draft mission is played as a throwaway session (nothing saved). Two walks (KIND):
   - KIND=lead (default): Reverie waits on The Avenue about 20 m from an apartment street door. The player walks near and talks (her line), then "Follow her into Rundown
     apartment 104": she walks along the pavement to the street door, goes in first while the player is close, is waiting in the hallway when the player comes in, leads
     to the apartment's door, goes through, is in the apartment when the player comes in: both inside -> the step is done; she stays there.
   - KIND=bring: "They follow you" into a location from modules (office hallway, office floor, elevator, server room downstairs) with Lace: the player goes in first, she comes
     in through the door behind them a moment later, follows through the office into the elevator cab, rides down with the player, follows into the server room -> done.
   Every frame records her figure (street figure or the indoor one), the scene and whether she is on screen. Asserted: never a jump bigger than her speed x the frame time
   within a scene; on arriving in a scene she is either already there when it is first drawn (she went first, or rode in the cab) or comes in through the door the player
   came by (from behind that door); never gone in a scene while the step runs there; the step is done with both in the chosen room.
   Usage: node tests/serve-modern.cjs (or any static host of this folder), then node tests/follow-into-browser.cjs. KIND=lead|bring, SITE_TEST_URL, SHOTS=dir,
   BROWSER_EXECUTABLE (default the bundled Chromium, software GL). */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',shots=process.env.SHOTS||null,KIND=process.env.KIND||'lead';if(shots)fs.mkdirSync(shots,{recursive:true});
const bundled=fs.existsSync('/opt/pw-browsers/chromium-1243/chrome-linux64/chrome')?'/opt/pw-browsers/chromium-1243/chrome-linux64/chrome':'/opt/pw-browsers/chromium',exe=process.env.BROWSER_EXECUTABLE||(fs.existsSync(bundled)?bundled:null);
const log=(...a)=>console.log('[follow-into '+KIND+']',...a);
const shot=async(page,name)=>{if(shots)await page.screenshot({path:path.join(shots,KIND+'-'+name+'.png'),timeout:300000}).catch(()=>{});};
const WHO=KIND==='lead'?'grey-reverie':'ethereal-lace',DOOR='apt-avenue-n-16',WAIT={x:36,z:-6.4};
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'],...(exe?{executablePath:exe}:{})});const errors=[];
 try{
  const page=await (await browser.newContext({viewport:{width:960,height:540},serviceWorkers:'block'})).newPage();page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(/follow into/i.test(m.text()))console.log('[page]',m.text().slice(0,400));});
  await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));
  await page.route('**/api/**',r=>r.fulfill({status:503,contentType:'application/json',body:'{"error":"offline test"}'}));
  const boot=()=>page.waitForFunction(()=>globalThis.VoidStartup?.started,null,{timeout:600000});
  await page.goto(base+'/void-runner.html');await boot();
  await page.evaluate(()=>{const s=C.startDistrictCampaign(C.fresh());s.story.flags.podWakePending=false;s.story.flags.appearanceOffered=true;localStorage.setItem('void-runner-campaign-v1',JSON.stringify({...s,savedAt:1700000000000}));localStorage.setItem('editor-tour-done','1');});
  await page.reload();await boot();
  await page.evaluate(()=>{Object.assign(VoidPreparation.limits,{scene:900000,assets:900000,optional:600000,area:900000,total:1800000,module:600000,artwork:300000});try{VoidGraphics.quality='low';VoidBabylon.setQuality('low');}catch{}});
  await page.evaluate(()=>VoidDevTools.identity(async p=>{if(p==='developer/balance')return {values:VoidBalance.defaults,revision:1,preset:'NORMAL'};const e=new Error('off');e.status=404;throw e;}));
  // ---- the draft mission ----
  const r=await page.evaluate(async({KIND,WHO,DOOR,WAIT})=>{const MC=VoidMissionContent,LC=VoidLiveContent,ID='draft-into-m1';
   const office={id:'a1',door:DOOR,...JSON.parse(JSON.stringify(VoidModules.TEMPLATES.find(t=>t.id==='office-servers').loc))};
   const place=KIND==='lead'?{id:'a1',style:'rundown',door:DOOR,number:104}:office;
   const objectives=[{id:'s1',kind:'talk',npc:WHO,label:'Talk to her',say:[{who:WHO,text:'TEST LINE: come inside with me.'}]},
    KIND==='lead'?{id:'s2',kind:'follow-them',npc:WHO,apt:'a1',label:'Follow her into apartment 104'}:{id:'s2',kind:'they-follow',npc:WHO,apt:'a1',mod:'servers',label:'Bring her into the server room'},
    {id:'s3',kind:'talk',npc:WHO,label:'Talk to her inside'}];
   const trees=[{id:'draft-into',name:'Into',missions:[{id:ID,number:91,title:'Into',type:'side',giver:WHO,waitAt:{...WAIT,yaw:Math.PI},offer:[{who:WHO,text:'TEST: got a minute?'}],apartments:[place],objectives}]}];
   const content=MC.fromDrafts({local:{trees},givers:LC.env.givers});const na=MC.notApplied?MC.notApplied({local:{trees},givers:LC.env.givers}):[];if(na.length)return {problem:na.join(' | ')};
   const chk=MC.check(content,{givers:new Map(LC.env.givers.map(g=>[g.id,g])),places:VoidMissionGivers.placeIds()});if(!chk.ok)return {problem:chk.errors.join(' | ')};
   return await VoidDevTest.session({banner:'FOLLOW INTO TEST',kind:'draft',apply:()=>LC.useDraft(content),build:()=>{const S=VoidStreetPair,tc=S.testClock([WHO]);S.simulate(tc?tc.ms:null);const s=C.startDistrictCampaign(C.fresh());s.story.flags.podWakePending=false;s.story.flags.appearanceOffered=true;return s;},
    enter:async()=>{state.location='earth';await enterWalking(VoidDistrictArea.KEY.street,{silent:true,quarter:'avenue',spawn:[WAIT.x-6,1.7,WAIT.z-.4],yaw:Math.PI/2});}});},{KIND,WHO,DOOR,WAIT});
  assert.ok(r&&r.started&&!r.problem,JSON.stringify(r));
  await page.waitForFunction(()=>mode==='walking'&&walkingLocation?.area==='street'&&VoidBabylon.district?.aptDoors,null,{timeout:900000});
  // ---- the per-frame record ----
  await page.evaluate(WHO=>{const R=globalThis.__rec=[];let last=performance.now();const S=VoidBabylon.scene||BABYLON.EngineStore.LastCreatedScene;try{S.getEngine().setHardwareScalingLevel(3);}catch{}
   S.onAfterRenderObservable.add(()=>{try{const now=performance.now(),wl=walkingLocation,sc=VoidEscortIndoors.sceneOf(wl),street=sc.kind==='street';let h=null,seen=null;
    if(street){const sp=VoidBabylon.district?.streetPair,st=sp&&sp.stats();if(st&&st.her&&st.her.id===WHO)h={x:st.her.x,z:st.her.z};const mp=sp?.made?.people?.get?.(WHO);if(mp)h={x:mp.node.position.x,z:mp.node.position.z};}
    else{const f=VoidBabylon.zone?.escortIndoors?.figs?.get(WHO);if(f){h={x:f.x,z:f.z,clip:f.clip,walkIn:!!f.walkIn,phase:f.st?f.st.phase:null};}}
    if(h){try{const cam=S.activeCamera;seen=BABYLON.Frustum.IsPointInFrustum(new BABYLON.Vector3(h.x,1,h.z),BABYLON.Frustum.GetPlanes(cam.getTransformationMatrix()));}catch{}}
    const ind=VoidEscortIndoors.live();R.push({t:+((now-last)/1000).toFixed(3),scene:street?'street':sc.kind==='loc'?sc.scene:'other',h,seen,me:{x:walker.x,z:walker.z},mode,step:ind.steps[0]||null,rec:(state.universe.missions||{})['draft-into-m1']||null});last=now;}catch(err){R.push({err:String(err)});}});},WHO);
  const latest=()=>page.evaluate(()=>{const r=globalThis.__rec;for(let i=r.length-1;i>=0;i--)if(r[i].h)return r[i];return null;});
  const done=k=>page.evaluate(k=>state.universe.missions['draft-into-m1']?.objectives?.[k]===true,k);
  // the player's own walk (straight at walking pace; collisions are the game's, these are short legs on free floor)
  const walkTo=(tx,tz,v=3.9)=>page.evaluate(([tx,tz,v])=>new Promise(res=>{clearInterval(globalThis.__w);let last=performance.now();globalThis.__w=setInterval(()=>{if(mode!=='walking')return;const now=performance.now(),dt=Math.min(.2,(now-last)/1000);last=now;const dx=tx-walker.x,dz=tz-walker.z,d=Math.hypot(dx,dz);if(d<.08){clearInterval(globalThis.__w);res(true);return;}const s=Math.min(d,v*dt);walker.x+=dx/d*s;walker.z+=dz/d*s;walker.yaw=Math.atan2(dx,dz);},40);}),[tx,tz,v]);
  // follow her about `keep` metres behind (she leads), or walk a list of points while she follows
  const chase=(on,keep=2.6)=>page.evaluate(([on,keep])=>{clearInterval(globalThis.__c);if(!on)return;let last=performance.now();globalThis.__c=setInterval(()=>{if(mode!=='walking')return;const now=performance.now(),dt=Math.min(.2,(now-last)/1000);last=now;const r=globalThis.__rec;let x=null;for(let i=r.length-1;i>=0&&!x;i--)if(r[i].h)x=r[i];if(!x)return;const dx=x.h.x-walker.x,dz=x.h.z-walker.z,d=Math.hypot(dx,dz);if(d>keep+.05){const s=Math.min(d-keep,3.9*dt);walker.x+=dx/d*s;walker.z+=dz/d*s;}walker.yaw=Math.atan2(dx,dz);},40);},[on,keep]);
  await page.waitForFunction(()=>globalThis.__rec.some(r=>r.h),null,{timeout:600000,polling:500});let p=await latest();log('she is at',JSON.stringify(p.h));await shot(page,'01-street');
  assert.ok(Math.hypot(p.h.x-WAIT.x,p.h.z-WAIT.z)<1.5,'at her spot');
  // ---- talk: the mission starts, her line (step 1) ----
  await walkTo(WAIT.x-1.6,WAIT.z-.3);
  for(let i=0;i<3&&!(await done('s1'));i++){await page.evaluate(WHO=>{const it=walkingLocation.interactions.find(i=>i.character===WHO&&i.talk);if(it){try{walkTarget=it;}catch{}VoidInteractions.handlers.get(it.action)({item:it});}},WHO);await page.waitForTimeout(1500);
   for(let k=0;k<10&&await page.evaluate(()=>!!VoidConversationUI?.isOpen||mode==='dialogue'||document.querySelector('[data-talk-choice]'));k++){await page.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(b=>/ACCEPT|CONTINUE|CLOSE/.test(b.textContent)&&b.offsetParent);if(b)b.click();});await page.waitForTimeout(500);}}
  assert.ok(await done('s1'),'step 1 (her line) done');log('her line done; the follow step runs');
  const D=await page.evaluate(id=>{const d=VoidApartments.door(id);return {x:d.x,z:d.z,n:d.n,front:{x:d.front[0],z:d.front[1]}};},DOOR);
  const enterStreetDoor=async()=>{await walkTo(D.front.x,D.front.z);await walkTo(D.x-D.n[0]*.9,D.z-D.n[1]*.9,2);await page.waitForTimeout(1200);await walkTo(D.x-D.n[0]*.4,D.z-D.n[1]*.4,1.5);
   await page.waitForFunction(()=>mode==='walking'&&!!walkingLocation?.apartment,null,{timeout:600000,polling:300});await page.waitForTimeout(800);};
  if(KIND==='lead'){
   await chase(true);await page.waitForFunction(()=>VoidEscortIndoors.live().steps[0]?.where!=='street',null,{timeout:900000,polling:300});await chase(false);
   log('she went in first:',JSON.stringify(await page.evaluate(()=>VoidEscortIndoors.live().steps[0])));await shot(page,'02-she-went-in');
   await enterStreetDoor();log('in the hallway');
   await page.waitForFunction(WHO=>!!VoidBabylon.zone?.escortIndoors?.figs?.get(WHO),WHO,{timeout:60000,polling:200});await page.waitForTimeout(1200);await shot(page,'03-hallway-she-leads');
   // follow her to the apartment door; when she has gone through, walk into it
   await chase(true,1.8);await page.waitForFunction(()=>walkingLocation?.part==='hall'&&VoidEscortIndoors.live().steps[0]?.where==='flat',null,{timeout:900000,polling:300});await chase(false);log('she went into the apartment first');
   const slot=await page.evaluate(()=>{const o=walkingLocation.open[0];const d=VoidBabylon.zone.doors.find(x=>x.slot===o.slot);return {x:VoidApartments.ORIGIN[0]+d.at[0],z:VoidApartments.ORIGIN[1]+d.at[1],sg:Math.sign(d.at[1])||1};});
   await walkTo(slot.x,slot.z-slot.sg*.9,2);await page.waitForTimeout(1200);await walkTo(slot.x,slot.z-slot.sg*.2,1.5);
   await page.waitForFunction(()=>mode==='walking'&&walkingLocation?.part==='flat',null,{timeout:600000,polling:300});log('in the apartment');await page.waitForTimeout(1500);
  }else{
   // they follow: walk to the door with her behind, in first; she comes in through the door behind
   await walkTo(WAIT.x-3,WAIT.z-.6);await page.waitForTimeout(1500);await walkTo(D.front.x+2,D.front.z,2.4);await page.waitForTimeout(2500);await shot(page,'02-she-follows');await enterStreetDoor();log('in the hallway; she comes in behind');
   await page.waitForFunction(WHO=>!!VoidBabylon.zone?.escortIndoors?.figs?.get(WHO),WHO,{timeout:60000,polling:200});await shot(page,'03-she-comes-in');await page.waitForTimeout(2500);
   // through the office to the elevator cab, she follows; ride down; into the server room
   const path=await page.evaluate(()=>{const c=walkingLocation.cluster,hall=c.mods.find(m=>m.id==='hall'),off=c.mods.find(m=>m.id==='office'),lift=c.mods.find(m=>m.id==='lift'),d1=c.doors.find(d=>/hall/.test(d.a+d.b)&&/office/.test(d.a+d.b)),d2=c.doors.find(d=>/lift/.test(d.a+d.b));
    return {hall:{x:hall.cx,z:hall.cz},d1,off:{x:off.cx,z:off.cz},d2,lift:{x:lift.cx,z:lift.cz}};});
   const legs=[path.hall,{x:path.d1.x-path.d1.n[0]*1,z:path.d1.z-path.d1.n[1]*1},{x:path.d1.x+path.d1.n[0]*1.2,z:path.d1.z+path.d1.n[1]*1.2}];
   for(const q of legs){await walkTo(q.x,q.z,2.4);await page.waitForTimeout(400);}
   const route=await page.evaluate(([a,b])=>VoidNPCEscort.gridRoute(a,b,walkingLocation.solids.filter(s=>!s.door)),[{x:legs[2].x,z:legs[2].z},{x:path.lift.x,z:path.lift.z}]);
   for(const q of route){await walkTo(q.x,q.z,2.4);}await page.waitForTimeout(4000);await shot(page,'04-in-the-cab');
   log('in the cab:',JSON.stringify(await page.evaluate(()=>VoidBabylon.zone.escortIndoors.stats())));
   await page.evaluate(()=>{const it=walkingLocation.interactions.find(i=>i.action==='mod-elev');VoidInteractions.handlers.get('mod-elev')({item:it});});
   await page.waitForFunction(()=>walkingLocation?.cluster?.mods?.some(m=>m.id==='servers')&&mode==='walking',null,{timeout:600000,polling:300});await page.waitForTimeout(1500);await shot(page,'05-rode-down');
   const rode=await page.evaluate(()=>VoidEscortIndoors.live().log.filter(e=>e.e==='cross').map(e=>e.go));log('crossings',JSON.stringify(rode));assert.equal(rode[rode.length-1],'ride','she rode the elevator down with the player');
   const sv=await page.evaluate(()=>{const c=walkingLocation.cluster,s=c.mods.find(m=>m.id==='servers');return VoidNPCEscort.freeSpot({x:s.cx,z:s.cz},walkingLocation.solids,.5);});
   const r2=await page.evaluate(b=>VoidNPCEscort.gridRoute({x:walker.x,z:walker.z},b,walkingLocation.solids.filter(s=>!s.door)),sv);for(const q of r2)await walkTo(q.x,q.z,2.4);
  }
  await page.waitForFunction(()=>state.universe.missions['draft-into-m1']?.objectives?.s2===true,null,{timeout:900000,polling:500});log('step 2 done');
  await page.waitForTimeout(2500);await shot(page,'06-both-inside');
  const end=await page.evaluate(WHO=>({scene:VoidEscortIndoors.sceneOf(walkingLocation),fig:VoidBabylon.zone?.escortIndoors?.stats?.(),room:VoidApartments.insideMod?.(),talk:walkingLocation.interactions.some(i=>i.character===WHO&&i.talk),log:VoidEscortIndoors.live().log}),WHO);
  log('end',JSON.stringify({scene:end.scene.scene,fig:end.fig,room:end.room,talk:end.talk}));
  assert.ok(end.fig&&end.fig.some(f=>f.npc===WHO),'she is inside with the player');assert.ok(end.talk,'TALK TO her works inside');
  if(KIND==='bring')assert.ok(end.fig.some(f=>f.npc===WHO&&f.room==='servers'),'she is in the server room');else assert.equal(end.scene.scene,'flat');
  // ---- the record ----
  const rec=await page.evaluate(()=>globalThis.__rec);if(shots)fs.writeFileSync(path.join(shots,KIND+'-frames.json'),JSON.stringify(rec));
  const lim=6.6;let worst=0,pops=0,gone=0;const firstIn={};
  for(let i=1;i<rec.length;i++){const a=rec[i-1],b=rec[i];if(!b.h||b.scene==='other')continue;
   if(a.scene===b.scene&&a.h){const d=Math.hypot(b.h.x-a.h.x,b.h.z-a.h.z),l=lim*Math.min(.1,Math.max(b.t,a.t||0))+.06;   /* the game's own frame time and this record's differ by the render's jitter: the larger of two frames */if(d>l){worst=Math.max(worst,d-l);log('JUMP',i,b.scene,d.toFixed(2),JSON.stringify(a.h),'->',JSON.stringify(b.h));}}
   if(b.scene!=='street'&&(a.scene!==b.scene||!a.h)){ // she appears in an interior scene: at its first frame (already there), or coming in through the door (walkIn), or out of view
    const first=rec.findIndex(r=>r.scene===b.scene),k=i-first;if(!(k<=2||b.h.walkIn||b.seen===false)){pops++;log('POP',i,b.scene,JSON.stringify(b.h),'frame',k);}firstIn[b.scene]=firstIn[b.scene]??{k,walkIn:b.h.walkIn,seen:b.seen};}}
  for(let i=1;i<rec.length;i++){const a=rec[i-1],b=rec[i];if(a.h&&!b.h&&a.scene===b.scene&&b.scene!=='street'&&a.step&&a.step.where===a.scene&&!b.step?.done&&b.step&&b.step.where===b.scene)gone++;}
  log('frames',rec.length,'worst jump over the limit',worst.toFixed(3),'pops',pops,'gone',gone,'appearances',JSON.stringify(firstIn));
  assert.ok(worst<=0,'no jump within a scene');assert.equal(pops,0,'never popped in view');assert.equal(gone,0,'never gone while the step runs in that scene');
  assert.deepEqual(errors.filter(e=>!/reading 'update'/.test(e)),[]);log('PASS');
 }catch(e){console.log('[follow-into] page errors:',errors.slice(0,6));try{const pg=browser.contexts()[0].pages()[0];console.log(JSON.stringify(await pg.evaluate(()=>({mode,wl:walkingLocation&&{id:walkingLocation.id,area:walkingLocation.area,part:walkingLocation.part,cluster:walkingLocation.cluster?.id},me:[walker?.x,walker?.z],ind:VoidEscortIndoors.live(),plan:VoidLiveContent.plans()}))).slice(0,4000));if(shots)await pg.screenshot({path:path.join(shots,KIND+'-fail.png')}).catch(()=>{});}catch{}throw e;}
 finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
