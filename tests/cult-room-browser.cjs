/* The Blackrock Cult Room in a real game page (bundled Chromium, software GL): a draft mission whose step "Hack the access point" shows the camera feed. The player
   hacks a street door's access point; the screen switches to the cult room's security camera; the scene plays and records itself; the recording is saved in the V1
   Gallery as a video; the view returns to the player where they stood; the step completes. The real save is untouched; no page errors.
   Usage: node tests/serve-modern.cjs, then node tests/cult-room-browser.cjs (SITE_TEST_URL, SHOTS=dir, SPEED (default 6: the scene plays faster for the test),
   BROWSER_EXECUTABLE). */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',shots=process.env.SHOTS||null,speed=Number(process.env.SPEED||6);if(shots)fs.mkdirSync(shots,{recursive:true});
const bundled=fs.existsSync('/opt/pw-browsers/chromium-1243/chrome-linux64/chrome')?'/opt/pw-browsers/chromium-1243/chrome-linux64/chrome':'/opt/pw-browsers/chromium',exe=process.env.BROWSER_EXECUTABLE||(fs.existsSync(bundled)?bundled:null);
const log=(...a)=>console.log('[cult-room]',...a);
const shot=async(page,name)=>{if(shots)await page.screenshot({path:path.join(shots,'feed-'+name+'.png'),timeout:240000});};
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required'],...(exe?{executablePath:exe}:{})});const errors=[];
 try{
  const page=await (await browser.newContext({viewport:{width:960,height:540},serviceWorkers:'block'})).newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));
  await page.route('**/api/**',r=>r.fulfill({status:503,contentType:'application/json',body:'{"error":"offline test"}'}));
  const boot=()=>page.waitForFunction(()=>globalThis.VoidStartup?.started,null,{timeout:180000});
  await page.goto(base+'/void-runner.html');await boot();
  await page.evaluate(()=>{const s=C.startDistrictCampaign(C.fresh());s.story.flags.podWakePending=false;s.story.flags.appearanceOffered=true;localStorage.setItem('void-runner-campaign-v1',JSON.stringify({...s,savedAt:1700000000000}));localStorage.setItem('editor-tour-done','1');});
  await page.reload();await boot();
  await page.evaluate(()=>VoidDevTools.identity(async p=>{if(p==='developer/balance')return {values:VoidBalance.defaults,revision:1,preset:'NORMAL'};const e=new Error('off');e.status=404;throw e;}));await page.waitForTimeout(1500);const before=await page.evaluate(()=>localStorage.getItem('void-runner-campaign-v1'));
  const ID='draft-cult-m1',DOOR='apt-main-w-96';
  const r=await page.evaluate(async({ID,DOOR})=>{const MC=VoidMissionContent,LC=VoidLiveContent;
   const feeds=[{id:'cam1',room:'blackrock-cult',scene:VoidCultRoom.defaultScene()}];
   const objectives=[{id:'cam',kind:'hack',ap:DOOR,hold:2,feed:'cam1',label:'Hack the camera feed'}];
   const trees=[{id:'draft-cult',name:'The camera',missions:[{id:ID,number:82,title:'The camera',type:'side',giver:'admin',offer:[{who:'admin',text:'There is a camera.'}],feeds,objectives}]}];
   const content=MC.fromDrafts({local:{trees},givers:LC.env.givers});const chk=MC.check(content,{givers:new Map(LC.env.givers.map(g=>[g.id,g])),places:VoidMissionGivers.placeIds()});if(!chk.ok)return {problem:chk.errors.join(' | ')};const d=VoidApartments.door(DOOR);
   return await VoidDevTest.session({banner:'CULT ROOM TEST',kind:'draft',apply:()=>LC.useDraft(content),build:()=>{const s=C.startDistrictCampaign(C.fresh());s.story.flags.podWakePending=false;s.story.flags.appearanceOffered=true;return s;},
    enter:async()=>{state.location='earth';await enterWalking(VoidDistrictArea.KEY.street,{silent:true,quarter:d.quarter,spawn:[d.front[0]-d.n[0]*1.5,1.7,d.front[1]-d.n[1]*1.5],yaw:Math.atan2(d.n[0],d.n[1])});}});},{ID,DOOR});
  assert.ok(r&&r.started&&!r.problem,JSON.stringify(r));
  await page.waitForFunction(()=>mode==='walking'&&walkingLocation?.area==='street'&&VoidBabylon.district?.aptDoors,null,{timeout:300000});await page.waitForTimeout(1500);
  assert.ok(await page.evaluate(()=>VoidMissionContent.treeEvent(state,VoidLiveContent.env,{type:'talk',npcs:['admin']},VoidMissions,C).offered),'Admin gives the mission');
  assert.equal(await page.evaluate(()=>VoidLiveContent.hacks()[0]?.feed),'cam1','the hack step carries the camera feed');
  const where=await page.evaluate(()=>({x:walker.x,z:walker.z,yaw:walker.yaw,scene:VoidBabylon.scene.uid}));await shot(page,'0-street');
  await page.evaluate(s=>{VoidCameraFeed.speed=s;},speed);
  await page.evaluate(id=>{const it=walkingLocation.interactions.find(i=>i.action==='apt-ap'&&i.ap===id);walker.x=it.position[0];walker.z=it.position[2];VoidInteractions.handlers.get('apt-ap')({item:it});},DOOR);
  await page.waitForTimeout(800);assert.equal(await page.evaluate(()=>!!VoidApartments.hacking),true,'the hack runs');await shot(page,'1-hack');
  await page.waitForFunction(()=>VoidCameraFeed.active,null,{timeout:30000});log('the feed is up');
  assert.equal(await page.evaluate(id=>state.universe.missions[id]?.objectives?.cam===true,ID),false,'not done by the hack alone');
  await page.waitForFunction(()=>VoidCameraFeed.recording,null,{timeout:120000});log('recording, the scene lasts',await page.evaluate(()=>VoidCameraFeed.duration),'s');
  const marks=[[8,'2-enter'],[60,'3-circle'],[114,'4-card'],[150,'5-exit']];const cost={};
  for(const [t,name] of marks){await page.waitForFunction(t=>!VoidCameraFeed.active||VoidCameraFeed.time>=t,t,{timeout:400000});if(!(await page.evaluate(()=>VoidCameraFeed.active)))break;
   if(name==='3-circle'){cost.circle=await page.evaluate(async()=>{const S=VoidCameraFeed.room.scene,inst=new BABYLON.SceneInstrumentation(S);inst.captureFrameTime=true;await new Promise(r=>setTimeout(r,1500));const o={draws:inst.drawCallsCounter.current,meshes:S.getActiveMeshes().length,lights:S.lights.length,fps:Math.round(S.getEngine().getFps())};inst.dispose();return o;});}
   const still=await page.evaluate(()=>({x:walker.x,z:walker.z,mode}));assert.ok(Math.abs(still.x-where.x)<3&&Math.abs(still.z-where.z)<3,'the player stays where they are');
   await shot(page,name);log('at',t,'s');}
  log('feed cost',JSON.stringify(cost));
  await page.waitForFunction(()=>!VoidCameraFeed.active,null,{timeout:600000});log('the feed ended');
  const after=await page.evaluate(id=>({done:state.universe.missions[id]?.objectives?.cam===true,mode,x:walker.x,z:walker.z,scene:VoidBabylon.scene.uid,videos:VoidGallery.videos,feedEl:document.getElementById('cam-feed').hidden}),ID);
  log('after',JSON.stringify({...after,videos:after.videos.map(v=>({bytes:v.bytes,duration:v.duration,type:v.type,place:v.place}))}));
  assert.equal(after.videos.length,1,'one video in the Gallery');assert.ok(after.videos[0].bytes>10000,'a real recording');assert.match(after.videos[0].type,/webm/);
  assert.equal(after.done,true,'the step completes when the recording is saved');assert.equal(after.mode,'walking');assert.equal(after.scene,where.scene,'the same world');assert.equal(after.feedEl,true);
  assert.ok(Math.abs(after.x-where.x)<3&&Math.abs(after.z-where.z)<3,'back where they stood');
  await page.waitForTimeout(1500);await shot(page,'6-back');
  const lum=await page.evaluate(()=>{const c=document.getElementById('space'),g=c.getContext('2d'),d=g.getImageData(0,0,c.width,c.height).data;let n=0;for(let i=0;i<d.length;i+=16)n+=d[i]+d[i+1]+d[i+2];return n/(d.length/16)/3;});log('street brightness after',lum.toFixed(1));assert.ok(lum>4,'the street is drawn again');
  // the V1 Gallery: the video is listed and plays in its own view
  await page.evaluate(()=>{VoidPersonalDevice.open();VoidPersonalDevice.openApp('gallery');});await page.waitForTimeout(1500);
  assert.equal(await page.locator('#personal-device [data-gallery-kind=video]').count(),1,'listed in the Gallery');await shot(page,'7-gallery');
  await page.locator('#personal-device [data-gallery-kind=video]').first().click();await page.waitForTimeout(1500);
  const vid=await page.evaluate(()=>{const v=document.querySelector('#personal-device video[data-gallery-video]');return v?{src:v.src.slice(0,5),dur:v.duration,err:v.error&&v.error.code}:null;});log('player',JSON.stringify(vid));
  assert.ok(vid&&vid.src==='blob:'&&!vid.err,'the recording plays');await shot(page,'8-player');
  await page.evaluate(()=>VoidPersonalDevice.close());
  await page.evaluate(()=>VoidDevTest.end?.());await page.waitForTimeout(1500);
  assert.equal(await page.evaluate(()=>localStorage.getItem('void-runner-campaign-v1')),before,'the real save is untouched');
  assert.deepEqual(errors,[],'no page errors');log('PASS');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
