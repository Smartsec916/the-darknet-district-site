/* Ava and Eva in the real bedroom: alone and together. Each loads without errors, stands on the floor at a human
   height and animates; together they keep apart, follow you or stay independently; their looks change from the VR
   menu (parts and colour textures) and come back after a reload; no empty speech box appears; the terminal
   remembers the pair. Also records frame time, draw calls and textures with both in the room.
   Serve the repository root on localhost (python -m http.server 5187) and run: node tests/vr-companion-party-browser.cjs */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',out=process.env.COMPANION_OUTPUT||path.resolve('work/companion-party');
const channel=process.env.BROWSER_CHANNEL||'msedge',errors=[],report={};fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({headless:true,args:['--enable-gpu','--ignore-gpu-blocklist'],...(channel==='chromium'?{}:{channel})});try{
 const page=await browser.newPage({viewport:{width:1280,height:720},serviceWorkers:'block'});page.on('pageerror',e=>errors.push(e.stack));
 page.on('console',m=>{const t=m.text();if(m.type()==='error'&&!/status of 503/.test(t))errors.push(t);if(/VR companion look/.test(t))errors.push(t);}); // 503s are this test's own offline API stubs
 await page.route('https://**/*',r=>r.abort());await page.route('**/api/**',r=>r.fulfill({status:503,body:'offline test'}));await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));
 async function boot(){await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>VoidStartup.started,null,{timeout:90000});
  await page.evaluate(async()=>{leaveMenu();state=C.fresh();state.quest='open';state.universe.freeTravel=true;state.story.flags.tutorialSkipped=true;state.location='earth';state.universe.currentSystem='sol';
   Object.assign(state.story.flags,{metAdmin:true,metIris:true,districtDoor:true,districtBadge:true});await enterWalking('sacramento');Object.assign(walker,{x:61,z:-65,yaw:0,pitch:0});});
  await page.waitForFunction(()=>VoidAssets.pending===0&&walkingLocation?.id==='neochinatown',null,{timeout:120000});}
 async function enter(opts){assert(await page.evaluate(o=>VoidVR.launch('suite',o),opts),'enter suite '+JSON.stringify(opts));
  await page.waitForFunction(()=>VoidVR.session?.world&&VoidAssets.pending===0,null,{timeout:180000});await page.waitForTimeout(3500);}
 // Everyone in the room: where they stand, their height and floor, what they're playing.
 const probe=()=>page.evaluate(()=>VoidVR.session.world.companions.map(x=>{const n=x.node,ms=n.getChildMeshes().filter(m=>m.isEnabled()&&m.isVisible);let lo=Infinity,hi=-Infinity;
  for(const m of ms){m.computeWorldMatrix(true);m.refreshBoundingInfo?.({applySkeleton:true,applyMorph:false});const b=m.getBoundingInfo().boundingBox;lo=Math.min(lo,b.minimumWorld.y);hi=Math.max(hi,b.maximumWorld.y);}
  return {id:x.who.id,name:x.who.name,x:+n.position.x.toFixed(2),z:+n.position.z.toFixed(2),floor:+(lo-n.getAbsolutePosition().y).toFixed(3),height:+(hi-lo).toFixed(3),mode:x.c.mode,
   clips:n.metadata.animationGroups.length,playing:n.metadata.animationGroups.filter(g=>g.isPlaying).map(g=>g.name.replace(/^.*-/,'')),blinks:n.getChildMeshes().some(m=>m.morphTargetManager?.numTargets)};}));
 const gap=ps=>ps.length>1?Math.hypot(ps[0].x-ps[1].x,ps[0].z-ps[1].z):Infinity;
 const dialogueOpen=()=>page.evaluate(()=>mode==='dialogue'||!!document.querySelector('.dialogue-window:not([hidden])')&&getComputedStyle(document.querySelector('.dialogue-window')).display!=='none'&&mode!=='walking');
 // A choice from a companion's menu, through the real panel.
 async function command(slot,label){await page.evaluate(id=>VoidVR.session.world.interact({id}),slot?'vr-companion-2':'vr-companion');await page.waitForSelector('.vr-companion-menu button.vr-choice');
  const opts=await page.$$eval('.vr-companion-menu button.vr-choice',b=>b.map(x=>x.textContent));const i=opts.indexOf(label.toUpperCase());assert(i>=0,label+' offered: '+opts.join(', '));
  await page.click('.vr-companion-menu button.vr-choice >> nth='+i);await page.waitForTimeout(300);return opts;}
 // The VR menu's look buttons (the same click path as the menu: opt:key:value).
 const setLook=(key,val)=>page.evaluate(([k,v])=>{const b=Object.assign(document.createElement('button'),{type:'button'});b.dataset.vr='opt:'+k+':'+v;document.body.append(b);b.click();b.remove();},[key,val]);
 const view=(d=4.2,pitch=.2)=>page.evaluate(([d,pitch])=>{const cs=VoidVR.session.world.companions,cx=cs.reduce((s,x)=>s+x.node.position.x,0)/cs.length,cz=cs.reduce((s,x)=>s+x.node.position.z,0)/cs.length,n=cs[0].node,a=n.rotation.y;
  walker.x=cx+Math.sin(a)*d;walker.z=cz+Math.cos(a)*d;walker.yaw=Math.atan2(cx-walker.x,cz-walker.z);walker.pitch=pitch;document.querySelectorAll('[class*=dialogue],#vr-companion-line').forEach(e=>e.style.visibility='hidden');},[d,pitch]);
 const shot=async name=>{await page.waitForTimeout(700);await page.screenshot({path:path.join(out,name+'.png')});};

 // 1. Each alone.
 await boot();await page.evaluate(()=>{localStorage.removeItem('void-runner-companion-looks-v1');});
 for(const id of ['ava','eva']){await enter({companion:id});const [p]=await probe();report[id+'-alone']=p;console.log(id,'alone',JSON.stringify(p));
  assert.equal(p.name,id==='ava'?'Ava':'Eva');assert(Math.abs(p.floor)<.09,id+' floor '+p.floor);assert(p.height>1.5&&p.height<1.95,id+' height '+p.height);assert.equal(p.clips,24);assert(p.playing.length>=1,id+' animates');
  assert.equal(await dialogueOpen(),false,id+': no speech box on entering (no lines yet)');
  await page.evaluate(()=>{VoidVR.session.world.onEnter();});await page.waitForTimeout(3000);assert.equal(await dialogueOpen(),false,id+': greeting without a line opens no panel');
  await view(3);await shot(id+'-alone');await page.evaluate(()=>VoidVR.exit());await page.waitForTimeout(500);}

 // 2. Together.
 // Confirming the pair at the terminal (the picker's own options step, which also remembers the choice).
 const pairOpts=await page.evaluate(()=>VoidVR.registry.get('suite').picker.options(['female',['ava','eva']]));assert.deepEqual(pairOpts,{companions:['ava','eva']});
 await enter(pairOpts);let ps=await probe();report.together=ps;console.log('together',JSON.stringify(ps));
 assert.deepEqual(ps.map(p=>p.name),['Ava','Eva']);assert(gap(ps)>.9,'start apart '+gap(ps));for(const p of ps){assert(Math.abs(p.floor)<.09,p.id+' floor '+p.floor);assert(p.playing.length>=1);}
 await view(4.2);await shot('together');
 // The menu without lines: a plain prompt, things to do together, no talk options.
 const menuText=await page.evaluate(()=>{VoidVR.session.world.interact({id:'vr-companion'});return document.querySelector('.dialogue-window')?.textContent||'';});
 await page.waitForSelector('.vr-companion-menu button.vr-choice');const offered=await page.$$eval('.vr-companion-menu button.vr-choice',b=>b.map(x=>x.textContent));report.menu={text:menuText.slice(0,120),offered};
 assert.match(menuText,/With Ava\. What would you like to do\?/);for(const o of ['CHAT','FLIRT','KISS'])assert(!offered.includes(o),o+' hidden without lines');for(const o of ['FOLLOW ME','STAY HERE','SIT TOGETHER'])assert(offered.includes(o),o);
 await page.click('.vr-companion-menu button.vr-choice.quiet');await page.waitForTimeout(300);
 // Follow: both follow you round the room and keep apart.
 await command(0,'Follow me');await command(1,'Follow me');
 let minGap=Infinity,far=0;
 for(const [x,z] of [[-2,-2.5],[1,-1],[2.5,2],[-1.5,1.5]]){await page.evaluate(([x,z])=>{walker.x=x;walker.z=z;walker.yaw=0;},[x,z]);
  for(let t=0;t<22;t++){await page.waitForTimeout(400);ps=await probe();minGap=Math.min(minGap,gap(ps));}
  const d=ps.map(p=>+Math.hypot(p.x-x,p.z-z).toFixed(2));console.log('waypoint',x,z,'distances',d,'at',ps.map(p=>[p.x,p.z]));far=Math.max(far,...d);}
 report.follow={minGap:+minGap.toFixed(2),furthestFromYou:+far.toFixed(2),modes:ps.map(p=>p.mode)};console.log('follow',JSON.stringify(report.follow));
 assert(minGap>.5,'companions never overlap while following ('+minGap+')');assert(far<3.2,'both keep up ('+far+')');
 await view(3.6);await shot('together-following');
 // Stay: Eva stays, Ava keeps following.
 await command(1,'Stay here');const evaAt=(await probe())[1];
 await page.evaluate(()=>{walker.x=3;walker.z=-3;walker.yaw=Math.PI;});await page.waitForTimeout(5500);ps=await probe();
 report.stay={eva:{before:[evaAt.x,evaAt.z],after:[ps[1].x,ps[1].z]},avaToYou:+Math.hypot(ps[0].x-3,ps[0].z+3).toFixed(2),modes:ps.map(p=>p.mode)};console.log('stay',JSON.stringify(report.stay));
 assert(Math.hypot(ps[1].x-evaAt.x,ps[1].z-evaAt.z)<.3,'Eva stays');assert(Math.hypot(ps[0].x-3,ps[0].z+3)<2.6,'Ava follows');assert.deepEqual(ps.map(p=>p.mode),['follow','stay']);
 // Go back: each returns to their own spot.
 await command(0,'Go back to your spot');await command(1,'Go back to your spot');await page.waitForTimeout(9000);ps=await probe();report.home=ps.map(p=>[p.x,p.z]);
 assert(Math.hypot(ps[0].x-3.6,ps[0].z-.3)<.5&&Math.hypot(ps[1].x-3.6,ps[1].z+1.5)<.5,'both back at their own spots '+JSON.stringify(report.home));
 // Looks: each changes independently; Eva's colour variants load as textures.
 const texOf=(slot,mat)=>page.evaluate(([s,m])=>{const n=VoidVR.session.world.companions[s].node;for(const x of n.getChildMeshes())if(x.material?.name===m)return x.material.albedoTexture?.name||x.material.albedoTexture?.url||null;return null;},[slot,mat]);
 const hairBefore=await texOf(1,'hair');
 for(const [k,v] of [['look-ava-outfit','bikini'],['look-ava-hair','long'],['look-ava-glasses','round'],['look-ava-face','makeup'],['look-eva-outfit','blue'],['look-eva-hair','ginger'],['look-eva-eyes','green'],['look-eva-face','2']])await setLook(k,v);
 await page.waitForTimeout(2500);const hairAfter=await texOf(1,'hair');report.looks={hairBefore:String(hairBefore).slice(0,60),hairAfter:String(hairAfter).slice(0,60)};
 assert.notEqual(hairAfter,hairBefore,'Eva\'s hair texture changed');
 const settings=await page.evaluate(()=>({...VoidVR.session.settings}));assert.equal(settings['look-ava-hair'],'long');assert.equal(settings['look-eva-eyes'],'green');
 const visible=await page.evaluate(()=>VoidVR.session.world.companions.map(x=>x.node.getChildMeshes().filter(m=>m.isEnabled()).map(m=>m.name.replace(/^.*?_(?=[a-z])/,'').replace(/_primitive\d+$/,''))));
 assert(visible[0].includes('hair_long')&&!visible[0].includes('hair_bob')&&visible[0].includes('glasses_round')&&visible[0].includes('bikini_top'),'Ava wears her new looks');
 assert(visible[1].includes('dress_blue')&&!visible[1].includes('dress_white'),'Eva wears blue');
 await view(4.2);await shot('together-new-looks');
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('void-runner-companion-looks-v1')));report.saved=saved;
 assert.deepEqual(saved,{ava:{outfit:'bikini',hair:'long',glasses:'round',face:'makeup'},eva:{outfit:'blue',hair:'ginger',eyes:'green',face:'2'}});
 // Back to the defaults for the pictures to come, saved too.
 for(const [k,v] of [['look-ava-outfit','red'],['look-ava-hair','bob'],['look-ava-glasses','none'],['look-ava-face','natural'],['look-eva-outfit','white'],['look-eva-hair','natural'],['look-eva-eyes','brown'],['look-eva-face','5']])await setLook(k,v);
 await page.waitForTimeout(800);assert.equal(await texOf(1,'hair'),hairBefore,'Eva\'s own hair texture is back');
 // Performance with both in the room: frame time over 120 frames (headless, so indicative only), draw calls, textures.
 await view(4.2);await page.waitForTimeout(1000);
 report.performance=await page.evaluate(async()=>{const times=[];await new Promise(r=>{let last=performance.now(),n=0;function f(t){times.push(t-last);last=t;if(++n===120)r();else requestAnimationFrame(f);}requestAnimationFrame(f);});
  times.sort((a,b)=>a-b);const s=VoidBabylon.scene,e=s.getEngine();return {medianFrameMs:+times[60].toFixed(1),p95FrameMs:+times[114].toFixed(1),activeMeshes:s.getActiveMeshes().length,
   textures:s.textures.length,skeletons:s.skeletons.length,renderer:(()=>{try{const gl=e._gl,x=gl.getExtension('WEBGL_debug_renderer_info');return x?gl.getParameter(x.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);}catch{return '?';}})()};});
 console.log('performance',JSON.stringify(report.performance));
 await page.evaluate(()=>VoidVR.exit());

 // 3. Reopening the game: the picker offers the pair again and looks come back.
 await page.evaluate(()=>{localStorage.setItem('void-runner-companion-looks-v1',JSON.stringify({ava:{hair:'pixie'},eva:{outfit:'pink'}}));});
 await boot();const initial=await page.evaluate(()=>VoidVR.registry.get('suite').picker.steps[1].initial(['female']));report.rememberedParty=initial;
 assert.deepEqual(initial,['ava','eva'],'the picker remembers Ava and Eva');
 await enter({companions:['ava','eva']});const vis=await page.evaluate(()=>VoidVR.session.world.companions.map(x=>x.node.getChildMeshes().filter(m=>m.isEnabled()).map(m=>m.name)));
 assert(vis[0].some(n=>/hair_pixie/.test(n))&&!vis[0].some(n=>/hair_bob/.test(n)),'Ava\'s saved hairstyle is restored');assert(vis[1].some(n=>/dress_pink/.test(n)),'Eva\'s saved outfit is restored');
 await page.evaluate(()=>localStorage.removeItem('void-runner-companion-looks-v1'));await page.evaluate(()=>VoidVR.exit());
 // 4. An old link to Seren still opens the suite with Seren (she stays until Ava's and Eva's lines arrive).
 await enter({choice:'f'});assert.deepEqual((await probe()).map(p=>p.name),['Seren']);await page.evaluate(()=>VoidVR.exit());
 assert.deepEqual(errors,[]);console.log('OK');
}finally{fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({report,errors},null,1));await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
