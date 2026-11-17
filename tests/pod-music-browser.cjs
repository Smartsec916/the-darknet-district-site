/* The DARKNET·AMP on the pod's right-hand wall does everything (the owner, 16 Nov 2026; the pop-up panel is gone): real audio, song list, buttons, local-file privacy and independent
   pod controls, all by looking at the wall (no Q) and clicking. Run against tests/serve-modern.cjs. Args: [low|high] [width height]. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const tier=['medium','high'].includes(process.argv[2])?process.argv[2]:'low',SIZE=[Number(process.argv[3])||1366,Number(process.argv[4])||768],base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187';
const fixture=path.join(os.tmpdir(),'district-pod-browser-tone.wav');
function tone(){const rate=22050,n=rate*20,b=Buffer.alloc(44+n*2);b.write('RIFF',0);b.writeUInt32LE(36+n*2,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(rate,24);b.writeUInt32LE(rate*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(n*2,40);for(let i=0;i<n;i++){const t=i/rate,v=Math.sin(t*110*Math.PI*2)*.4+Math.sin(t*880*Math.PI*2)*.3;b.writeInt16LE(Math.round(v*32767),44+i*2);}fs.writeFileSync(fixture,b);}
(async()=>{
 tone();const browser=await chromium.launch({...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{}),args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox','--autoplay-policy=no-user-gesture-required']});
 try{
  const page=await browser.newPage({viewport:{width:SIZE[0],height:SIZE[1]},reducedMotion:'reduce',serviceWorkers:'block'}),errors=[],requests=[];page.setDefaultTimeout(240000);
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push({method:r.method(),url:r.url()}));
  await page.route('https://**/*',r=>r.abort());await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
  await page.addInitScript(q=>{localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:q}));Element.prototype.requestPointerLock=function(){return Promise.reject(new Error('not in tests'));};},tier);   // mouse capture is not testable headless: the pointer is free and the click goes where the pointer is
  await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started,null,{timeout:120000});
  await page.evaluate(()=>Object.assign(VoidPreparation.limits,{scene:900000,assets:300000,optional:300000,total:1500000}));
  const enter=index=>page.evaluate(async i=>{if(i===1){state=C.startDistrictCampaign(C.fresh());state.story.flags.appearanceOffered=true;await enterWalking('darknet-district',VoidDistrictArea.resume(state,VoidNeoChinatown));await showPodWake();}},index);
  await enter(1);
  await page.waitForFunction(()=>mode==='pod-waking'&&walkingLocation?.area==='interior',null,{timeout:180000});await page.waitForSelector('#pod-wake:not([hidden])');await page.waitForTimeout(800);
  const parts=await page.evaluate(()=>({screens:VoidBabylon.scene.meshes.filter(m=>m.name==='tesana-pod-screen').length,hatches:walkingLocation.interactions.filter(i=>i.action==='district-pod').length,roomPlayer:walkingLocation.interactions.some(i=>i.action==='district-pod-music')}));
  assert.deepEqual(parts,{screens:10,hatches:10,roomPlayer:false});
  const state_=()=>page.evaluate(()=>({...VoidPodMusic.state(),view:VoidPodPlayerUI.ui.view,offset:VoidPodPlayerUI.ui.offset,light:VoidPodMusic.lighting,mode}));
  // Where on the window a point of a wall face is (design units of the 384x192 player or the 320x180 light panel), found by asking the game what is under the pointer.
  const at=async(kind,dx,dy)=>page.evaluate(({kind,dx,dy})=>{const dim=kind==='music'?[384,192]:[320,180],tu=dx/dim[0],tv=dy/dim[1];let best=null;
   const hits=[];const stp=Math.max(10,Math.round(innerWidth/110));for(let y=0;y<innerHeight;y+=stp)for(let x=0;x<innerWidth;x+=stp){const h=VoidNeoChinatown.podPick(x,y);if(h&&h.kind===kind&&h.index===1)hits.push({x,y,u:h.u,v:h.v});}
   if(hits.length<6)return null;
   let px=hits.reduce((a,h)=>a+h.x,0)/hits.length,py=hits.reduce((a,h)=>a+h.y,0)/hits.length;let ax=1,ay=1;{const lo=hits.reduce((m,h)=>h.u<m.u?h:m),hi=hits.reduce((m,h)=>h.u>m.u?h:m),lo2=hits.reduce((m,h)=>h.v<m.v?h:m),hi2=hits.reduce((m,h)=>h.v>m.v?h:m);ax=(hi.x-lo.x)/((hi.u-lo.u)||1);ay=(hi2.y-lo2.y)/((hi2.v-lo2.v)||1);const m=hits[0];px=m.x+(tu-m.u)*ax;py=m.y+(tv-m.v)*ay;}
   for(let k=0;k<6;k++){const h=VoidNeoChinatown.podPick(px,py);if(!h||h.kind!==kind){const near=hits.reduce((m,q)=>Math.hypot(q.x-px,q.y-py)<Math.hypot(m.x-px,m.y-py)?q:m);px=near.x+(tu-near.u)*ax;py=near.y+(tv-near.v)*ay;continue;}px+=(tu-h.u)*ax;py+=(tv-h.v)*ay;}
   const h=VoidNeoChinatown.podPick(px,py);return h&&h.kind===kind&&Math.abs(h.u-tu)<.012&&Math.abs(h.v-tv)<.02&&px>2&&py>2&&px<innerWidth-2&&py<innerHeight-2?[px,py]:null;},{kind,dx,dy});
  const drag=async dx=>{const y0=Math.round(SIZE[1]*.2);await page.mouse.move(700,y0);await page.mouse.down();await page.mouse.move(700+dx,y0,{steps:4});await page.mouse.up();};
  const until=async(fn,label,timeout=30000)=>{try{await page.waitForFunction(fn,null,{timeout});}catch(e){throw new Error(label+' did not happen: '+JSON.stringify(await state_())+' audioError='+(await page.evaluate(()=>VoidPodMusic.element?.error?.message||VoidPodMusic.element?.error?.code||null)));}};
  const click=async(kind,dx,dy,what)=>{let p=await at(kind,dx,dy);for(let i=0;i<30&&!p;i++){await drag(kind==='lights'?50:-50);p=await at(kind,dx,dy);}   // looks over to the control with the mouse if it is not in view
   assert(p,'the '+(what||kind)+' control is on screen at '+dx+','+dy);await page.mouse.move(p[0],p[1]);await page.mouse.click(p[0],p[1]);await page.waitForTimeout(150);if(process.env.PODDEBUG)console.log(what||kind,dx,dy,p.map(Math.round),JSON.stringify(await page.evaluate(()=>({o:VoidPodPlayerUI.ui.offset,v:VoidPodPlayerUI.ui.view,i:VoidPodMusic.state().index,yaw:walker.yaw}))));};
  // From the waking view nothing is pressed: the mouse is dragged to look over to the right-hand wall.
  assert.equal(await at('music',200,60),null,'the player is not in view from the hatch view');
  for(let i=0;i<40&&!(await at('music',364,100));i++)await drag(Math.round(SIZE[0]/6));   // look right until the player's right edge comes into view
  for(let i=0;i<20&&!(await at('music',20,160));i++)await drag(40);   // and a little further until all of it is in view
  assert(await at('music',20,160),'the whole player can be brought into view with the mouse');
  assert(await at('music',200,60),'the player is in reach by looking with the mouse');
  assert.equal(await page.locator('#pod-music').count(),0,'no pop-up panel');
  await page.screenshot({path:`pod-wall-${tier}-${SIZE[0]}.png`});
  // The player face: its title opens the song list, as the old pop-up's list did.
  await click('music',200,124,'title');assert.equal((await state_()).view,'list','the title opens the song list');await page.screenshot({path:`pod-list-${tier}-${SIZE[0]}.png`});
  assert.equal((await state_()).count,27,'the hosted catalog is all there');
  await click('music',100,46+2*16+8,'third song');await until(()=>VoidPodMusic.playing&&VoidPodMusic.state().index===2,'wait',30000);
  await click('music',195,160,'next');await until(()=>VoidPodMusic.state().index===3);
  await click('music',115,160,'pause');await until(()=>!VoidPodMusic.playing);   // paused so the clock stands still: past 3 s a first press of previous restarts the song, within 3 s it goes back
  await click('music',35,160,'previous');if((await state_()).index===3)await click('music',35,160,'previous');await until(()=>VoidPodMusic.state().index===2);   // (a press after 3 s of a song first restarts it)
  await click('music',75,160,'play');await until(()=>VoidPodMusic.playing);
  await click('music',155,160,'stop');await until(()=>!VoidPodMusic.playing&&VoidPodMusic.state().position===0);
  // scrolling the list: the wheel over it, then the arrow buttons; the last song is reachable and plays
  await page.mouse.wheel(0,100);await page.waitForTimeout(200);assert((await state_()).offset>0,'the wheel scrolls the list');
  await click('music',362,46+6*16-10,'scroll down');for(let i=0;i<24;i++)await click('music',362,46+6*16-10,'scroll down');assert.equal((await state_()).offset,21,'scrolled to the end of 27 songs');
  await click('music',100,46+5*16+8,'last song');await until(()=>VoidPodMusic.state().index===26&&VoidPodMusic.playing);await page.screenshot({path:`pod-list-end-${tier}-${SIZE[0]}.png`});
  // back to the player: shuffle, repeat (off, all, one, off), volume, the title scrolls its text
  await click('music',350,13,'PL');assert.equal((await state_()).view,'player');
  await click('music',271,78,'shuffle');assert.equal((await state_()).shuffle,true);await click('music',271,78,'shuffle');assert.equal((await state_()).shuffle,false);
  const reps=[];for(let i=0;i<4;i++){await click('music',339,78,'repeat');reps.push((await state_()).repeat);}assert.deepEqual(reps,['all','one','off','all'],'repeat cycles off, all, one, off, all');
  await click('music',310,160,'volume');assert(Math.abs((await state_()).volume-.5)<.02,'volume bar sets the volume');assert(Math.abs(await page.evaluate(()=>VoidPodMusic.element.volume)-.5)<.02);
  await page.screenshot({path:`pod-player-${tier}-${SIZE[0]}.png`});
  // light panel: all three scenes by name
  for(const [dy,scene] of [[96,'reading'],[142,'music'],[50,'rest']]){await click('lights',80,dy,scene);assert.equal((await state_()).light,scene);}
  // My music: the tab, ADD SONGS (the browser's file dialog), the song plays, spectrum reacts
  await click('music',350,13,'PL');await click('music',177,34,'My music tab');assert.equal((await state_()).source,'mine');
  const chooser=page.waitForEvent('filechooser');await click('music',247,34,'add songs');await (await chooser).setFiles(fixture);
  await until(()=>VoidPodMusic.playing&&VoidPodMusic.element?.currentTime>.2,'wait',30000);assert.equal((await state_()).count,1);
  await page.screenshot({path:`pod-mine-${tier}-${SIZE[0]}.png`});
  await click('lights',80,142,'music sync');await until(()=>VoidPodMusic.levels().bass>.02,'wait',15000);
  await click('music',360,160,'volume');assert((await state_()).volume>.9);
  await click('music',300,183,'keep my songs');assert.equal((await state_()).keeping,true);await click('music',300,183,'keep my songs');assert.equal((await state_()).keeping,false);
  await click('music',337,54,'x');   // remove the only song: the list is empty
  await until(()=>VoidPodMusic.state().count===0&&!VoidPodMusic.playing);
  const dock=await page.evaluate(()=>VoidPodMusic.lightingFor(1));assert.equal(dock,'music');
  // leaving the pod pauses the music, the choices stay when the pod is entered again
  assert.equal((await state_()).view,'list');await click('music',50,34,'website tab');assert.equal((await state_()).source,'website');await click('music',100,86,'third song');await until(()=>VoidPodMusic.playing);
  const keep=await state_();
  await page.keyboard.press('KeyE');await page.waitForFunction(()=>mode==='walking'&&!VoidPodMusic.playing,null,{timeout:15000});
  const first=await page.evaluate(()=>walkingLocation.interactions.find(i=>i.podIndex===1));
  await page.evaluate(item=>VoidInteractions.handlers.get('district-pod')({item}),first);await page.waitForFunction(()=>mode==='pod-waking'&&state.story.flags.activePod===1);await page.waitForSelector('#pod-wake:not([hidden])');
  const back=await state_();assert.equal(back.index,keep.index,'pod 01 keeps its selected song');assert.equal(back.view,'player','the wall opens on the player');assert.equal(back.light,'music');
  const second=await page.evaluate(()=>walkingLocation.interactions.find(i=>i.podIndex===2));
  await page.keyboard.press('KeyE');await page.waitForFunction(()=>mode==='walking');
  await page.evaluate(item=>VoidInteractions.handlers.get('district-pod')({item}),second);await page.waitForFunction(()=>mode==='pod-waking'&&state.story.flags.activePod===2);await page.waitForSelector('#pod-wake:not([hidden])');
  const two=await state_();assert.equal(Math.round(two.volume*100),80,'pod 02 keeps independent volume');assert.equal(two.light,'rest');assert.equal(await page.evaluate(()=>VoidPodMusic.lists.mine.currentId),null);
  assert(!requests.some(r=>r.method!=='GET'&&r.url.includes(path.basename(fixture))),'private audio was never uploaded');
  assert.deepEqual(errors,[]);console.log(JSON.stringify({tier,size:SIZE.join('x'),parts,privateAudio:'local only',errors}));
 }finally{await browser.close();fs.rmSync(fixture,{force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
