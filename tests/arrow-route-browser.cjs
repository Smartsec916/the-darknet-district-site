/* THE GUIDE ARROW ALONG MISSION 002'S ROUTE in the real game (Chromium, software GL, offline). The owner, 17 Nov 2026: "if it's pointing at a doorway and you walk
   slightly past the marker point the arrow points backwards for a bit". A new character finishes Awakening and accepts Eyes on the Street (as
   tests/eyes-on-the-street-browser.cjs does), then walks from Admin's counter out of the shop, down the hallway, through the inner door into the security vestibule,
   stops 0.4 m PAST the vestibule's middle (the point the old arrow aimed at) while the real checkpoint seals the doors, scans and swaps the street in, then on out of
   the outer door, 0.4 m past it, along the alley and across Main Street to NULL's door, in 6 cm steps. The arrow's world direction (VoidGuideRoute.live) is sampled every
   frame. Checks: it never turns more than 100 degrees between consecutive samples except at a deliberate route change (a snap); after each doorway it never points
   backwards along the route; just past each marker it points on. Screenshots at 1366: just past the vestibule's middle, and just past the District's street door.
   Usage: node tests/arrow-route-browser.cjs   (its own static server on a free port; SHOTS=dir; BROWSER_EXECUTABLE=path; QUALITY=low|medium|high) */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const shots=process.env.SHOTS||path.resolve(__dirname,'..','docs/development/arrow-smoothing');fs.mkdirSync(shots,{recursive:true});
const bundled=['/opt/pw-browsers/chromium','/opt/pw-browsers/chromium-1243/chrome-linux64/chrome'].find(f=>fs.existsSync(f)),exe=process.env.BROWSER_EXECUTABLE||bundled||null;
const quality=process.env.QUALITY||'low',ID='m002-eyes-on-the-street',W=1366,H=768;
function serve(){const root=path.resolve(__dirname,'..'),types={'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.ogg':'audio/ogg','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.glb':'model/gltf-binary'};
 const srv=http.createServer((req,res)=>{let f;try{f=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));}catch{res.writeHead(400);return res.end();}if(!f.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);return res.end();}res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(d);});});
 return new Promise(r=>srv.listen(0,'127.0.0.1',()=>r(srv)));}
const deg=r=>r*180/Math.PI,wrap=a=>((a+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;
(async()=>{
 const srv=await serve(),base='http://127.0.0.1:'+srv.address().port;
 const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader','--no-sandbox','--autoplay-policy=no-user-gesture-required'],...(exe?{executablePath:exe}:{})});
 const log=m=>console.log(new Date().toISOString().slice(11,19),m);
 try{
  const ctx=await browser.newContext({viewport:{width:W,height:H},serviceWorkers:'block'}),page=await ctx.newPage();page.setDefaultTimeout(300000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));await page.route('**/api/**',r=>r.fulfill({status:503,contentType:'application/json',body:'{}'}));
  await page.addInitScript(q=>{if(!sessionStorage.getItem('i')){localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:q,v:2,chosen:true}));sessionStorage.setItem('i','1');}},quality);
  await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started);
  await page.evaluate(()=>Object.assign(VoidPreparation.limits,{scene:600000,assets:600000,optional:300000,total:1200000,module:600000,artwork:300000}));
  log('new character');
  await page.click('[data-action=menu-campaign]');await page.click('[data-action=menu-new]');{const c=page.locator('[data-action=menu-new-confirm]');if(await c.count())await c.click();}
  await page.waitForSelector('#character-creator.on');await page.waitForFunction(()=>!document.querySelector('[data-cc=confirm]').disabled);await page.locator('[data-cc=confirm]').click();
  await page.waitForFunction(()=>mode==='pod-waking'&&walker&&!document.getElementById('pod-wake').hidden,null,{timeout:300000});
  await page.waitForFunction(()=>VoidAssets.pending===0,null,{timeout:300000});await page.waitForTimeout(800);await page.keyboard.press('KeyE');await page.waitForFunction(()=>mode==='walking'&&walker,null,{timeout:300000});
  await page.evaluate(()=>{VoidV1.bannerMs=600000;VoidV1.callTail=600000;});
  const useE=async id=>{const ok=await page.evaluate(id=>{const it=walkingLocation.interactions.find(i=>i.id===id);if(!it)return false;const inside=(x,z)=>walkingLocation.solids.some(o=>o.position&&o.size&&Math.abs(x-o.position[0])<o.size[0]/2+.35&&Math.abs(z-o.position[2])<o.size[2]/2+.35);
   for(const d of [1.6,1.3,1.9,1.0,2.1,.7])for(let a=0;a<16;a++){const ang=a*Math.PI/8,x=it.position[0]+Math.sin(ang)*d,z=it.position[2]+Math.cos(ang)*d,yaw=Math.atan2(it.position[0]-x,it.position[2]-z);if(inside(x,z))continue;
    if(VoidExplorer.select({x,z,yaw},walkingLocation,i=>!i.when||VoidStory.matches(state,i.when))?.id===id){Object.assign(walker,{x,z,yaw,pitch:0,vx:0,vz:0});return true;}}return false;},id);
   assert(ok,'a spot where '+id+' can be used exists');await page.waitForTimeout(1200);await page.keyboard.press('KeyE');await page.waitForTimeout(1500);};
  const toLast=()=>page.evaluate(()=>{let n=0;while(speech&&(speech.index<speech.lines.length-1||speech.shown<speech.lines[speech.index].text.length)&&n++<40)advanceSpeech();return !!speech;});
  await page.waitForFunction(()=>!!state.universe.missions['m001-awakening']?.acquired);
  await page.keyboard.press('KeyL');await page.waitForFunction(()=>VoidPersonalDevice.app==='comms'&&!VoidPersonalDevice.busy);await page.locator('[data-hangup]').dispatchEvent('click');await page.waitForSelector('#personal-device [data-call-live].ended');await page.keyboard.press('KeyL');await page.waitForFunction(()=>!VoidPersonalDevice.isOpen);
  await useE('admin');await page.waitForFunction(()=>state.universe.missions['m001-awakening']?.completed===true);await page.evaluate(()=>{try{resumeWalking();}catch{}});await page.waitForFunction(()=>mode==='walking');
  log('accept Mission 002');await useE('admin');assert.ok(await toLast());await page.locator('#speech-next').dispatchEvent('click');await page.waitForFunction(id=>!!state.universe.missions[id]?.acquired,ID);await page.waitForFunction(()=>mode==='walking');
  assert.equal(await page.evaluate(()=>state.universe.trackedMission),ID);

  // ---- the walk and the sampler. The software renderer draws about one frame a second, so the walk does not wait for frames: each 6 cm step sets the player,
  // runs the arrow exactly as a frame's draw does (drawMissionWaypoint, with 1/60 s since the last one) and records VoidGuideRoute.live; every 25 steps a real
  // frame runs (the checkpoint, the doors and the area swap live there).
  await page.evaluate(()=>{window.__arrow=[];});
  const walkLocal=(pts,world=false)=>page.evaluate(async([pts,world])=>{const P=pts.map(p=>world?p:VoidNeoChinatown.toWorld(p[0],p[1])),frame=()=>new Promise(r=>requestAnimationFrame(()=>r()));let c=0;
   for(let i=0;i<P.length-1;i++){const [ax,az]=P[i],[bx,bz]=P[i+1],d=Math.hypot(bx-ax,bz-az),n=Math.max(1,Math.ceil(d/.06)),yaw=Math.atan2(bx-ax,bz-az);
    for(let k=1;k<=n;k++){while(mode!=='walking')await frame();Object.assign(walker,{x:ax+(bx-ax)*k/n,z:az+(bz-az)*k/n,yaw,pitch:-.05,vx:0,vz:0});guideClock=performance.now()-1000/60;drawMissionWaypoint();
     const l=VoidGuideRoute.live;window.__arrow.push({x:walker.x,z:walker.z,area:walkingLocation?.area||'',mode,l:l?{b:l.bearing,raw:l.raw,a:l.alpha,wp:l.waypoint,snapped:l.snapped}:null});if(++c%25===0)await frame();}}},[pts,world]);
  const samples=()=>page.evaluate(()=>window.__arrow.splice(0));
  const all=[];const keep=(arr,travel,label)=>{for(const s of arr)all.push({...s,travel,label});};
  const at=(lx,lz)=>page.evaluate(([x,z])=>VoidNeoChinatown.toWorld(x,z),[lx,lz]);
  // 1. from Admin's counter out of the shop and down the hallway (local metres)
  log('shop to the vestibule');
  const admin=await page.evaluate(()=>{const a=walkingLocation.interactions.find(i=>i.id==='admin').position;return VoidNeoChinatown.toWorld(a[0],a[2]);});
  await page.evaluate(([x,z])=>{const [wx,wz]=VoidNeoChinatown.toWorld(x,z);Object.assign(walker,{x:wx,z:wz});},[8,45.2]);await page.waitForTimeout(800);await samples();
  await walkLocal([[8,45.2],[4.5,45.6],[3,46],[1.2,45.5],[0,42]]);keep(await samples(),null,'out of the shop');
  await walkLocal([[0,42],[0,30],[0,26.4]]);keep(await samples(),Math.atan2(0,1),'hallway');   // local -z is world +z
  // 2. slightly past the inner door (0.4 m) and then 0.4 m past the vestibule's middle (local 23: the old arrow's point), where the checkpoint seals and scans
  await walkLocal([[0,26.4],[0,25.6]]);keep(await samples(),0,'0.4 m past the inner door');
  const pastInner=await page.evaluate(()=>VoidGuideRoute.live);assert.equal(pastInner.waypoint,'district-door<','0.4 m past the inner door the arrow leads to the outer door');assert.ok(Math.abs(deg(wrap(pastInner.raw-0)))<30,'and points on: '+deg(pastInner.raw).toFixed(0));
  log('past the vestibule marker');await walkLocal([[0,25.6],[0,22.6]]);keep(await samples(),0,'0.4 m past the vestibule middle');
  const pastMid=await page.evaluate(()=>VoidGuideRoute.live);assert.ok(Math.abs(deg(wrap(pastMid.raw-0)))<30,'0.4 m past the vestibule\'s middle the arrow points on to the outer door: '+deg(pastMid.raw).toFixed(0));
  await page.waitForTimeout(1500);await page.screenshot({path:path.join(shots,'arrow-past-vestibule-'+W+'.png')});
  // the checkpoint: the street replaces the District while the player stands there (sampling goes on)
  log('the checkpoint exchange');await page.waitForFunction(()=>walkingLocation?.area==='street'&&mode==='walking',null,{timeout:180000});await page.waitForTimeout(2500);keep(await samples(),0,'during the exchange');   // (real frames: the arrow at the software renderer's own pace)
  const afterSwap=await page.evaluate(()=>VoidGuideRoute.live);assert.equal(afterSwap.waypoint,'district-door<','after the exchange the arrow still leads to the outer door');assert.ok(Math.abs(deg(wrap(afterSwap.raw)))<30,'and on: '+deg(afterSwap.raw).toFixed(0));
  // 3. out of the outer door, 0.4 m past it (screenshot), along the alley, to the junction with Main Street, to NULL's door
  log('out of the street door');const here=await page.evaluate(()=>[walker.x,walker.z]);const [lx,lz]=await page.evaluate(([x,z])=>VoidNeoChinatown.toWorld(x,z),here);
  await walkLocal([[lx,lz],[0,19.6]]);keep(await samples(),0,'0.4 m past the street door');
  const pastDoor=await page.evaluate(()=>VoidGuideRoute.live);assert.ok(['district-door<+','junction:s:oldtown:0:s:oldtown:1<'].includes(pastDoor.waypoint),'0.4 m past the street door: '+pastDoor.waypoint);assert.ok(Math.abs(deg(wrap(pastDoor.raw)))<100,'never back into the District: '+deg(pastDoor.raw).toFixed(0));
  await page.waitForTimeout(1500);await page.screenshot({path:path.join(shots,'arrow-past-street-door-'+W+'.png')});
  const al=await at(0,17.4),door=await page.evaluate(()=>VoidPlaces.target('null'));
  await walkLocal([[0,19.6],[0,17.4]]);keep(await samples(),0,'into the alley');
  await walkLocal([al,[71.5,-58.5]],true);keep(await samples(),-Math.PI/2,'along the alley');
  await walkLocal([[71.5,-58.5],[door[0]+1.6,door[2]]],true);keep(await samples(),-Math.PI/2,'across Main Street');
  const end=await page.evaluate(()=>VoidGuideRoute.live);assert.ok(end&&end.waypoint==='goal'&&end.alpha<.5,'at NULL\'s door the arrow fades out: '+JSON.stringify(end&&{wp:end.waypoint,a:end.alpha}));

  // ---- the checks over every sample
  const live=all.filter(s=>s.l&&s.mode==='walking');log(live.length+' samples');assert.ok(live.length>300,'enough samples: '+live.length);
  let worst=0,where=null;for(let i=1;i<live.length;i++){if(live[i].l.snapped)continue;const d=Math.abs(deg(wrap(live[i].l.b-live[i-1].l.b)));if(d>worst){worst=d;where=live[i];}}
  log('largest turn between frames: '+worst.toFixed(1)+' degrees ('+(where&&where.label)+')');assert.ok(worst<100,'the arrow turned '+worst.toFixed(0)+' degrees in one frame ('+(where&&where.label)+')');
  for(const s of live){if(s.travel===null||s.l.a<=.01)continue;const d=Math.abs(deg(wrap(s.l.raw-s.travel)));assert.ok(d<100,s.label+': the arrow pointed '+d.toFixed(0)+' degrees from the way the player walks (waypoint '+s.l.wp+')');}
  const shown=live.filter(s=>s.travel!==null&&s.l.a>.01).map(s=>Math.abs(deg(wrap(s.l.b-s.travel))));log('drawn arrow vs walking direction after the shop: max '+Math.max(...shown).toFixed(0)+' degrees');
  assert.deepEqual(errors,[],'no page errors');await ctx.close();
  console.log('arrow route browser test passed; screenshots in',shots);
 }finally{await browser.close();srv.close();}
})().catch(e=>{console.error(String(e.stack||e).slice(0,1500));process.exit(1);});
