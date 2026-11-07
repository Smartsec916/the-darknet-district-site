/* Real VR companion conversation through the playable game: enter the suite, talk to Ava through the world
   interaction, check the dialogue floats (mode stays walking/vr-seated), walk away and confirm the conversation
   stays open and movement is free. Usage: node tests/vr-conversation-browser.cjs [low|high]. Serve on 5187 (or SITE_TEST_URL). */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const tier=process.argv[2]==='high'?'high':'low',base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187';
(async()=>{
 const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1280,height:800},reducedMotion:'reduce',serviceWorkers:'block'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://**/*',r=>r.abort());await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
 try{
  await page.addInitScript(q=>localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:q})),tier);
  await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started,null,{timeout:120000});
  await page.evaluate(async()=>{leaveMenu();state=C.fresh();state.quest='open';state.universe.freeTravel=true;state.story.flags.tutorialSkipped=true;state.location='earth';state.universe.currentSystem='sol';
   Object.assign(state.story.flags,{metAdmin:true,metIris:true,districtDoor:true,districtBadge:true});await enterWalking('sacramento');Object.assign(walker,{x:61,z:-65,yaw:0,pitch:0});});
  await page.waitForFunction(()=>VoidAssets.pending===0&&walkingLocation?.id==='neochinatown',null,{timeout:180000});
  // Open the real VR menu and its bedroom picker (this checks which companion model files are installed), then launch.
  await page.evaluate(()=>VoidVR.openMenu());await page.click('[data-vr="pick:suite"]');await page.waitForTimeout(2500);
  // Some companion models are licensed and absent from the open repository (Ava, Eva): use the first one that is installed.
  const who=await page.evaluate(async()=>{for(const id of ['kai','seren','ava','eva','una']){if(await VoidVR.launch('suite',{companion:id}))return id;}return null;});
  assert(who,'a companion model is installed');
  await page.waitForFunction(()=>VoidVR.session?.world&&VoidAssets.pending===0,null,{timeout:240000});await page.waitForTimeout(3000);
  const model=()=>page.evaluate(()=>{const c=VoidVR.session.world.companions[0],n=c.node;return {x:n.position.x,z:n.position.z,playing:n.metadata.animationGroups.filter(g=>g.isPlaying).length,meshes:n.getChildMeshes().filter(m=>m.isEnabled()&&m.isVisible).length};});
  // close any greeting, then start a real conversation through the world interaction
  await page.evaluate(()=>{if(VoidConversationUI.isOpen)resumeWalking();});
  const m0=await model();assert(m0.playing>=1&&m0.meshes>0,'companion model animates before talking');
  await page.evaluate(()=>VoidVR.session.world.interact({id:'vr-companion'}));
  await page.waitForSelector('.vr-companion-menu button.vr-choice',{timeout:20000});
  const open=await page.evaluate(()=>({mode,ui:VoidConversationUI.isOpen,live:!!document.querySelector('#screen.conversation-live'),near:Math.hypot(walker.x-VoidVR.session.world.companions[0].node.position.x,walker.z-VoidVR.session.world.companions[0].node.position.z)}));
  assert(['walking','vr-seated'].includes(open.mode),'mode stays '+open.mode);assert(open.ui&&open.live,'conversation is floating');
  // walk away: the conversation stays open and every key still moves us
  const p0=await page.evaluate(()=>({x:walker.x,z:walker.z}));
  // Held until a real distance is covered: software rendering at High runs at a few frames a second, so a fixed wait covers a frame-rate-dependent distance.
  await page.keyboard.down('KeyS');await page.waitForFunction(p=>Math.hypot(walker.x-p.x,walker.z-p.z)>.5,p0,{timeout:30000,polling:100}).catch(()=>{});await page.keyboard.up('KeyS');
  const away=await page.evaluate(p=>({mode,ui:VoidConversationUI.isOpen,menu:!!document.querySelector('.vr-companion-menu button.vr-choice'),moved:Math.hypot(walker.x-p.x,walker.z-p.z),dist:Math.hypot(walker.x-VoidVR.session.world.companions[0].node.position.x,walker.z-VoidVR.session.world.companions[0].node.position.z)}),p0);
  assert(away.moved>.4,'moved while talking: '+away.moved);assert(away.ui&&away.menu,'conversation still open after walking away');assert(['walking','vr-seated'].includes(away.mode));
  await page.keyboard.down('KeyD');await page.waitForFunction(([p,m])=>Math.hypot(walker.x-p.x,walker.z-p.z)!==m,[p0,away.moved],{timeout:30000,polling:100}).catch(()=>{});await page.keyboard.up('KeyD');
  assert(await page.evaluate(([p,m])=>Math.hypot(walker.x-p.x,walker.z-p.z)!==m,[p0,away.moved]),'movement not locked: sideways keeps moving');
  // choose the last option ("Never mind") from the real panel: closes and returns to free walking
  await page.click('.vr-companion-menu button.vr-choice >> nth=-1');await page.waitForTimeout(500);
  const closed=await page.evaluate(()=>({mode,ui:VoidConversationUI.isOpen}));assert(['walking','vr-seated'].includes(closed.mode));assert(!closed.ui,'closes after Never mind');
  const m1=await model();assert(m1.playing>=1&&m1.meshes===m0.meshes,'companion model/animation preserved');
  assert.deepEqual(errors,[]);console.log(JSON.stringify({tier,who,open,away,closed,m0,m1,errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
