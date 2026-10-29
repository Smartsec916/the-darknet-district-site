/* Real Babylon assets and fresh browser storage. Default: ten visits + all public VR experiences/companions. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const smoke=process.env.STABILIZATION_SMOKE==='1',base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',out=process.env.STABILIZATION_OUTPUT||path.resolve('work/stabilization');
const channel=process.env.BROWSER_CHANNEL||'msedge',result={resources:[],vr:[],timing:[],errors:[]};fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({headless:true,...(channel==='chromium'?{}:{channel})});try{
 const page=await browser.newPage({viewport:{width:1280,height:720},serviceWorkers:'block'});page.on('pageerror',e=>result.errors.push(e.stack));page.on('console',async m=>{if(/VOID frame|VOID.*preparation/.test(m.text())){const details=await Promise.all(m.args().map(a=>a.evaluate(v=>v?.error?.stack||v?.stack||v)));console.log('GAME ERROR',details);result.errors.push(m.text());}});
 await page.route('https://**/*',r=>r.abort());await page.route('**/api/**',r=>r.fulfill({status:503,body:'offline test'}));await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));
 await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>VoidStartup.started,null,{timeout:90000});
 await page.evaluate(()=>{leaveMenu();state=C.fresh();state.quest='open';state.location='meridian';state.universe.freeTravel=true;state.story.flags.tutorialSkipped=true;VoidGraphics.quality='low';VoidBabylon.setQuality('low');});
 async function settled(){await page.waitForFunction(()=>VoidAssets.pending===0,null,{timeout:120000});await page.waitForTimeout(350);}
 async function counts(){return page.evaluate(()=>{const s=VoidBabylon.scene;return {mode,error:VoidGraphics.error,meshes:s.meshes.length,textures:s.textures.length,materials:s.materials.length,skeletons:s.skeletons.length,groups:s.animationGroups.length,playing:s.animationGroups.filter(g=>g.isPlaying).length};});}
 for(let i=0;i<(smoke?3:10);i++){await page.evaluate(()=>enterWalking('hangar'));await settled();const c=await counts();result.resources.push(c);console.log('VISIT',i+1,c);assert(c.playing>=5,'crowd animations remain running');if(i>1)assert.deepEqual(c,result.resources[1],'resources plateau after warmup on visit '+(i+1));}
 await page.screenshot({path:path.join(out,'meridian.png')});
 // A frame-time observer is measured against RAF, not the stale engine FPS statistic.
 await page.evaluate(async()=>{state.location='earth';state.universe.currentSystem='sol';Object.assign(state.story.flags,{metAdmin:true,metIris:true,districtDoor:true,districtBadge:true});await enterWalking('sacramento');Object.assign(walker,{x:61,z:-65,yaw:0,pitch:0});});await settled();
 const normal=await page.evaluate(async()=>{const times=[];await new Promise(resolve=>{let last=performance.now(),n=0;function f(t){times.push(t-last);last=t;if(++n===90)resolve();else requestAnimationFrame(f);}requestAnimationFrame(f);});return {metrics:VoidFrameMetrics.stats,raf:times.sort((a,b)=>a-b)[45],crowd:VoidBabylon.district.nightlife.stats()};});result.timing.push({normal});
 // Controlled presentation slowdown; no second simulation/render loop and no engine-FPS stub.
 await page.evaluate(()=>{const s=VoidBabylon.scene;globalThis.testSlowObserver=s.onBeforeRenderObservable.add(()=>{const until=performance.now()+55;while(performance.now()<until){}});});
 await page.waitForTimeout(smoke?10000:18000);const slow=await page.evaluate(()=>({metrics:VoidFrameMetrics.stats,crowd:VoidBabylon.district.nightlife.stats(),paused:VoidBabylon.district.nightlife.people.filter(p=>p.anim&&!p.anim.active).length}));result.timing.push({slow});assert(slow.metrics.fps<40);assert(slow.crowd.budget<slow.crowd.people,'slowdown reduces density budget');
 if(!smoke)assert(slow.paused>0,'unseen crowd animation is paused');
 await page.evaluate(()=>VoidBabylon.scene.onBeforeRenderObservable.remove(testSlowObserver));
 // Moving to an empty, cheap view gives genuine recovery headroom while the same city governor remains active.
 await page.evaluate(()=>{Object.assign(walker,{x:0,z:-30,yaw:Math.PI,pitch:-1.1});});await page.waitForTimeout(smoke?8000:14000);
 const recovered=await page.evaluate(()=>({metrics:VoidFrameMetrics.stats,crowd:VoidBabylon.district.nightlife.stats()}));result.timing.push({recovered});
 if(recovered.metrics.fps>56)assert(recovered.crowd.budget>slow.crowd.budget,'density recovers gradually');
 await page.evaluate(()=>Object.assign(walker,{x:61,z:-65,yaw:0,pitch:0}));await page.waitForTimeout(1000);await page.screenshot({path:path.join(out,'neochinatown.png')});
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
 await page.evaluate(()=>{state.credits=1;state.progression.personal.ammo=0;save();});await page.reload();await page.waitForFunction(()=>VoidStartup.started);await page.locator('[data-action=menu-continue]').click();await page.waitForFunction(()=>mode==='walking'&&!VoidGraphics.busy,null,{timeout:90000});assert.deepEqual(await page.evaluate(()=>({credits:state.credits,ammo:state.progression.personal.ammo})),saved);assert(!await page.evaluate(()=>state.story.flags.vrReturn));result.interruption=true;
 // Isolated UI mode fixtures: hold the simulation while the existing weapon UI RAF updates.
 const visibility=await page.evaluate(()=>{const e=document.getElementById('weapon-select-hud');return {hidden:e.hidden,display:getComputedStyle(e).display};});assert.equal(visibility.hidden,false);assert.notEqual(visibility.display,'none');
 await page.evaluate(()=>{globalThis.testUIOwner={update,draw};update=()=>{};draw=()=>{};});
 for(const modeName of ['play','taxi','menu','dialogue']){await page.evaluate(m=>{mode=m;},modeName);await page.waitForTimeout(80);const v=await page.locator('#weapon-select-hud').evaluate(e=>({hidden:e.hidden,display:getComputedStyle(e).display}));assert(v.hidden&&v.display==='none',modeName);}
 await page.evaluate(()=>{update=testUIOwner.update;draw=testUIOwner.draw;resumeWalking();});assert.deepEqual(result.errors,[]);console.log(JSON.stringify(result,null,2));
 }finally{fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(result,null,2));await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
