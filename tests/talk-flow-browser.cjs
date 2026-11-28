/* WALKING CONVERSATIONS FLOW BY THEMSELVES, the larger "Talk to" area and the speaker looking at you (the owner, 17 Nov 2026), in the real game (Chromium, software GL, offline).
   A new character finishes Awakening, then talks to Admin: his four-line offer of Eyes on the Street types and advances from line 1 to the last line with NO clicks
   (each recorded line after its clip, then a short beat), and then WAITS on the last line with ACCEPT / NOT NOW (never closes past the choice). Admin's head turns
   toward the player while he speaks, and back when the conversation ends. Admin's prompt still comes a step to the side, further back on either side, and looking a little past him (each out of reach before).
   Usage: node tests/talk-flow-browser.cjs   (its own static server on a free port; SITE_TEST_URL to use another; SHOTS=dir; BROWSER_EXECUTABLE=path) */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const shots=process.env.SHOTS||path.resolve(__dirname,'..','docs/development/talk-flow');fs.mkdirSync(shots,{recursive:true});
const bundled=['/opt/pw-browsers/chromium','/opt/pw-browsers/chromium-1243/chrome-linux64/chrome'].find(f=>fs.existsSync(f)),exe=process.env.BROWSER_EXECUTABLE||bundled||null;
const OFFER=['I heard you\'re looking for work.','Before I trust you with anything important, I need you to do a little reconnaissance.','Head outside. Across the street, you\'ll find a nightclub called NULL. There\'s someone hanging out in there I need you to take their picture so I can scrape it for more data','I\'ll mark their location'];
function serve(){const root=path.resolve(__dirname,'..'),types={'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.ogg':'audio/ogg','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.glb':'model/gltf-binary'};
 const srv=http.createServer((req,res)=>{let f;try{f=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));}catch{res.writeHead(400);return res.end();}if(!f.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);return res.end();}res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(d);});});
 return new Promise(r=>srv.listen(0,'127.0.0.1',()=>r(srv)));}
(async()=>{
 const srv=process.env.SITE_TEST_URL?null:await serve(),base=process.env.SITE_TEST_URL||'http://127.0.0.1:'+srv.address().port;
 const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader','--no-sandbox','--autoplay-policy=no-user-gesture-required'],...(exe?{executablePath:exe}:{})});
 const log=m=>console.log(new Date().toISOString().slice(11,19),m);
 try{
  const W=1366,H=768,ctx=await browser.newContext({viewport:{width:W,height:H},serviceWorkers:'block'}),page=await ctx.newPage();page.setDefaultTimeout(60000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const shot=async n=>{await page.screenshot({path:path.join(shots,n+'.png')});};
  await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));await page.route('**/api/**',r=>r.fulfill({status:503,contentType:'application/json',body:'{}'}));
  await page.addInitScript(()=>{if(!sessionStorage.getItem('i')){localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:'low',v:2,chosen:true}));sessionStorage.setItem('i','1');}});
  await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started);
  await page.evaluate(()=>Object.assign(VoidPreparation.limits,{scene:600000,assets:600000,optional:300000,total:1200000,module:600000,artwork:300000}));
  log('new character');
  await page.click('[data-action=menu-campaign]');log('campaign menu');
  await page.click('[data-action=menu-new]');log('new campaign selected');{const c=page.locator('[data-action=menu-new-confirm]');if(await c.count())await c.click();}
  await page.waitForSelector('#character-creator.on',{timeout:60000});log('character creator open');
  await page.waitForFunction(()=>!document.querySelector('[data-cc=confirm]')?.disabled,null,{timeout:60000});await page.locator('[data-cc=confirm]').click();log('character confirmed');
  await page.waitForFunction(()=>mode==='pod-waking'&&walker&&!document.getElementById('pod-wake').hidden,null,{timeout:60000});log('pod exit available');
  await page.keyboard.press('KeyE');
  try{await page.waitForFunction(()=>mode==='walking'&&walker,null,{timeout:12000});}
  catch(error){
    const pod=await page.evaluate(()=>{const exit=VoidDistrictArea.podExit(VoidNeoChinatown,state.story.flags.activePod||1);
      return {mode,input:VoidInputState.current.name,focused:document.hasFocus(),pending:VoidAssets.pending,
        blocked:VoidExplorer.blocked(exit.spawn[0],exit.spawn[2],walkingLocation),podPending:state.story.flags.podWakePending};});
    throw new Error('Pod exit did not enter walking mode: '+JSON.stringify({pod,errors}),{cause:error});
  }
  log('walking in the District');
  await page.waitForFunction(()=>VoidKeyMapUI.open,null,{timeout:10000});
  await page.keyboard.press('KeyK');
  await page.waitForFunction(()=>!VoidKeyMapUI.open,null,{timeout:10000});
  log('first-exit controls closed');
  await page.evaluate(()=>{VoidV1.bannerMs=600000;VoidV1.callTail=600000;});
  // where the player stands relative to Admin's interaction point: customer side (toward the room) found from the point and his figure
  const place=(dx,dz,off=0)=>page.evaluate(([dx,dz,off])=>{const it=walkingLocation.interactions.find(i=>i.id==='admin'),fig=VoidBabylon.scene.transformNodes.find(n=>n.metadata?.character==='admin').getAbsolutePosition();
   const ux=it.position[0]-fig.x,uz=it.position[2]-fig.z,L=Math.hypot(ux,uz),ox=ux/L,oz=uz/L,sx=-oz,sz=ox,x=it.position[0]+ox*dz+sx*dx,z=it.position[2]+oz*dz+sz*dx;   // dz: further into the room, dx: to the side
   Object.assign(walker,{x,z,yaw:Math.atan2(it.position[0]-x,it.position[2]-z)+off,pitch:-.05,vx:0,vz:0});
   return {sel:VoidExplorer.select(walker,walkingLocation,i=>!i.when||VoidStory.matches(state,i.when))?.id||null,d:Math.hypot(x-it.position[0],z-it.position[2])};},[dx,dz,off]);
  const useAdmin=async(dx=0,dz=1.2)=>{const p=await place(dx,dz);assert.equal(p.sel,'admin','Admin\'s prompt from '+dx+','+dz);await page.waitForTimeout(1200);await page.keyboard.press('KeyE');await page.waitForTimeout(800);};
  const captureLook=async()=>{if(!await page.evaluate(()=>document.pointerLockElement===canvas)){
    await page.mouse.click(W*.3,H*.45);
    await page.waitForFunction(()=>document.pointerLockElement===canvas,null,{timeout:10000});
  }};
  const checkDialogueControls=async name=>{
    await page.waitForFunction(()=>VoidConversationUI.isOpen&&VoidInputState.current.camera,null,{timeout:15000});
    await page.mouse.move(W*.3,H*.45);
    const start=await page.evaluate(()=>({x:walker.x,z:walker.z,yaw:walker.yaw,locked:document.pointerLockElement===canvas}));
    assert.ok(start.locked,name+' keeps mouse capture when opened with E');
    await page.mouse.move(W*.3+80,H*.45+20,{steps:4});
    await page.waitForFunction(yaw=>Math.abs(walker.yaw-yaw)>.02,start.yaw,{timeout:10000});
    await page.keyboard.down('KeyS');
    try{await page.waitForFunction(p=>Math.hypot(walker.x-p.x,walker.z-p.z)>.25,start,{timeout:10000});}
    finally{await page.keyboard.up('KeyS');}
    assert.ok(await page.evaluate(()=>VoidConversationUI.isOpen),name+' remains open while moving');
    log(name+' verified walking and mouse look');
  };
  try{await page.waitForFunction(()=>VoidBabylon.scene.transformNodes.some(n=>n.metadata?.character==='admin'),null,{timeout:30000});}
  catch(error){
    const assets=await page.evaluate(()=>({place:walkingLocation?.id,pending:VoidAssets.pending,failed:[...VoidAssets.failed.keys()],admin:walkingLocation?.interactions?.find(i=>i.id==='admin')}));
    throw new Error('Admin model did not load: '+JSON.stringify({assets,errors}),{cause:error});
  }
  log('Admin model ready');
  // ---- finish Mission 001: answer the call, then talk to Admin
  await page.waitForFunction(()=>!!state.universe.missions['m001-awakening']?.acquired);log('Awakening acquired');
  await page.keyboard.press('KeyL');await page.waitForFunction(()=>VoidPersonalDevice.isOpen&&VoidPersonalDevice.app===null&&!VoidPersonalDevice.busy);await page.locator('#personal-device .pd-callbar:not([hidden])').dispatchEvent('click');await page.waitForFunction(()=>VoidPersonalDevice.app==='comms'&&!VoidPersonalDevice.busy);await page.locator('[data-hangup]').dispatchEvent('click');await page.waitForSelector('#personal-device [data-call-live].ended');await page.keyboard.press('KeyL');await page.waitForFunction(()=>!VoidPersonalDevice.isOpen);
  await useAdmin();await page.waitForFunction(()=>state.universe.missions['m001-awakening']?.completed===true);await page.evaluate(()=>{while(speech)advanceSpeech();try{resumeWalking();}catch{}});await page.waitForFunction(()=>mode==='walking');
  // ---- the larger "Talk to" area: a step to the side, a step further back, and looking a little past him still give Admin's prompt (the old reach was 3 m, 57 degrees)
  for(const [dx,dz,off,why] of [[1.4,1.6,0,'a step to the side'],[2.5,2.5,0,'back and to one side (3.5 m; the old reach was 3 m)'],[-2.5,2.5,0,'back and to the other side (3.5 m)'],[1.4,1.6,-1.1,'looking about 63 degrees past him, away from Iris (the old limit was 57)']]){const p=await place(dx,dz,off);log('prompt '+why+' '+JSON.stringify(p));assert.equal(p.sel,'admin','Admin\'s prompt: '+why);}
  assert.equal((await place(1.4,1.6,1.1)).sel,'district-iris','looking past Admin toward Iris gives Iris: the one nearest the centre of the view, no stealing');
  assert.notEqual((await place(0,5.2)).sel,'admin','not from 5.2 m (beyond 1.5x his 3 m)');
  // ---- the offer: four lines, no clicks
  log('offer, hands off');await captureLook();await page.evaluate(()=>{window.__clicks=0;document.addEventListener('click',()=>window.__clicks++,true);});await useAdmin(1.5,1.4);
  assert.equal(await page.evaluate(()=>speech?.index),0,'the first spoken line opened');
  await checkDialogueControls('Eyes on the Street spoken dialogue');
  await place(1.5,1.4);
  const t0=Date.now(),seen=[0];let mid=false;
  while(Date.now()-t0<240000){const s=await page.evaluate(()=>speech?{i:speech.index,n:speech.lines.length,shown:Math.floor(speech.shown),len:speech.lines[speech.index].text.length,text:document.getElementById('spoken-text')?.textContent||'',btn:document.getElementById('speech-next')?.textContent,look:VoidNPCLook.current}:null);
   assert.ok(s,'the conversation is still open');if(!seen.includes(s.i)){seen.push(s.i);log('line '+(s.i+1)+'/'+s.n+' at '+((Date.now()-t0)/1000).toFixed(1)+' s');}
   if(s.i===1&&!mid&&s.shown>10){mid=true;await page.evaluate(()=>{if(window.VoidKeyMapUI?.open)VoidKeyMapUI.show(false);});await shot('talk-panel-mid');assert.ok(s.text.length>0,'the text types right away');assert.ok(s.look&&s.look.character==='admin','Admin looks at the speaker\'s listener: '+JSON.stringify(s.look));// face Admin himself (he stands behind the counter), from the side the player is on, and look at his face
    await page.evaluate(()=>{const h=VoidBabylon.scene.transformNodes.find(n=>/mixamorig:Head$/.test(n.name)&&n.parent&&VoidBabylon.scene.transformNodes.find(m=>m.metadata?.character==='admin')?.getDescendants(false).includes(n)).getAbsolutePosition(),cam=VoidBabylon.scene.activeCamera.globalPosition;walker.yaw=Math.atan2(h.x-cam.x,h.z-cam.z);walker.pitch=-Math.atan2(h.y-cam.y,Math.hypot(h.x-cam.x,h.z-cam.z));});
    await page.waitForTimeout(2500);await shot('admin-looks-side');const lk=await page.evaluate(()=>VoidNPCLook.current);log('look '+JSON.stringify(lk));
    assert.ok(lk.weight>.8,'turned fully');assert.ok(Math.abs(lk.offset)>.3,'the player is well to one side of where Admin faces');assert.ok(lk.miss<12,'his face points at the player\'s eyes (within 12 degrees): '+lk.miss);}
   if(s.i===s.n-1&&s.shown>=s.len)break;await page.waitForTimeout(300);}
  assert.deepEqual(seen,[0,1,2,3],'line 1 to the last line, in order, with no clicks');assert.equal(await page.evaluate(()=>window.__clicks),0,'no clicks');
  let d=await page.evaluate(()=>({lines:speech.lines.map(l=>l.text),main:document.getElementById('speech-next')?.textContent,choices:[...document.querySelectorAll('[data-talk-choice]')].map(b=>b.textContent)}));
  assert.deepEqual(d.lines,OFFER);assert.equal(d.main,'ACCEPT');assert.deepEqual(d.choices,['NOT NOW']);
  await page.waitForTimeout(9000);const still=await page.evaluate(()=>speech?{i:speech.index,acq:!!state.universe.missions['m002-eyes-on-the-street']}:null);assert.deepEqual(still,{i:3,acq:false},'the last line waits for the player\'s choice');await shot('talk-panel-choice');
  await checkDialogueControls('Eyes on the Street offer and reply');
  // ---- REPLAY still plays the line
  const replay=await page.evaluate(()=>{const b=document.querySelector('[data-action=speech-replay]');if(!b)return null;b.click();return speech.voice;});assert.ok(replay&&replay.clip,'REPLAY is there and the line has a clip');
  await page.waitForFunction(()=>speech?.voice?.started===true,null,{timeout:60000});
  // ---- NOT NOW: the conversation ends, the head turns back
  await page.locator('[data-talk-choice]').dispatchEvent('click');await page.waitForFunction(()=>mode==='walking'&&!speech);
  await page.waitForFunction(()=>VoidNPCLook.current===null,null,{timeout:60000});log('released');
  // ---- skip ahead: a click on SKIP moves to the next line at once
  await useAdmin(0,1.6);await page.waitForFunction(()=>speech&&speech.index===0);const skip=await page.evaluate(()=>{advanceSpeech();return speech.index;});assert.equal(skip,1,'SKIP goes to the next line');
  await page.evaluate(()=>{while(speech)advanceSpeech();try{resumeWalking();}catch{}});
  // Advance this test campaign through the intervening objectives so the next briefing opens through Admin's normal interaction.
  await page.evaluate(()=>{
    const id='m002-eyes-on-the-street',mission=VoidLiveContent.env.trees.flatMap(tree=>tree.missions).find(item=>item.id===id);
    state.universe.missions[id]={acquired:true,completed:true,objectives:Object.fromEntries(mission.objectives.map(step=>[step.id,true]))};
  });
  await captureLook();await useAdmin();
  await page.waitForFunction(()=>speech?.lines[0]?.text.startsWith('I did some digging. Halden Reyes'),null,{timeout:10000});
  await checkDialogueControls('Corporate Connections briefing');
  assert.deepEqual(errors,[],'no page errors');await ctx.close();
  console.log('talk flow browser test passed; screenshots in',shots);
 }finally{await browser.close();if(srv)srv.close();}
})().catch(e=>{console.error(String(e.stack||e).slice(0,2000));process.exit(1);});
