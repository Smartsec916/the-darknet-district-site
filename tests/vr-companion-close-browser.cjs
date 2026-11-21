/* Companions up close, in conversation (the owner, 17 Nov 2026: "when interacting with them sometimes their head, eyes, arms disappear. Sometimes
   they're in odd positions, probably because of head tracking"). For each companion whose model is on this machine: walk up, open the menu, choose
   Chat, then for ten seconds look at them from several angles, distances and heights while they talk, gesture and turn to you. Checks:
     - every part that has any vertex in the camera's view is drawn (in the scene's active meshes): nothing culled by a stale bounding box;
     - no part is switched off or hidden by anything else (street-sight.js, npc-look.js and the crowd's own culling never touch a companion);
     - the camera never comes inside the near clipping plane of their body (the player is kept half a metre away);
     - the attention pass keeps to its limits: the commanded turn within maxHeadYaw / maxHeadPitch, what it adds to the clip within maxCorrection, and
       it does not tip the head sideways;
     - no arms-out bind pose (T-pose) frame while clips change.
   Serve the repository root (python -m http.server 5187) and run: node tests/vr-companion-close-browser.cjs
   COMPANIONS=nadia,kai picks who (default: every companion whose file is present). BROWSER_EXECUTABLE=/path/to/chrome for a bundled Chromium
   (add BROWSER_ARGS=--use-gl=swiftshader in a container without a GPU; it then samples for longer than ten seconds, at least 14 times). Pictures go to
   work/companion-close. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',out=process.env.COMPANION_OUTPUT||path.resolve('work/companion-close');
const channel=process.env.BROWSER_CHANNEL||'msedge',models=path.join(__dirname,'../void-runner/assets/models/crowd'),errors=[],report={};fs.mkdirSync(out,{recursive:true});
const files={nadia:'vr-companion-fc1.vrpak',kai:'npc-kai.glb',zane:'npc-zane.glb',luna:'npc-luna.glb',ava:'vr-companion-ava.vrpak',eva:'vr-companion-pg.vrpak','base-f':'vr-companion-bf.vrpak','base-m':'vr-companion-bm.vrpak'};
const wanted=(process.env.COMPANIONS||Object.keys(files).join(',')).split(',').filter(id=>files[id]&&fs.existsSync(path.join(models,files[id])));
(async()=>{if(!wanted.length){console.log('SKIP: no companion model on this machine.');return;}
 const args=(process.env.BROWSER_ARGS||'').split(' ').filter(Boolean);
 const browser=await chromium.launch({headless:true,args,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:channel==='chromium'?{}:{channel})});try{
 const page=await browser.newPage({viewport:{width:1366,height:768},serviceWorkers:'block'});page.on('pageerror',e=>errors.push(e.stack));
 page.on('console',m=>{const t=m.text();if(m.type()==='error'&&!/status of 503|Failed to load resource/.test(t))errors.push(t);if(/VR companion|npc look/i.test(t))errors.push(t);});
 await page.route('https://**/*',r=>r.abort());await page.route('**/api/**',r=>r.fulfill({status:503,body:'offline test'}));await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));
 await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>VoidStartup.started,null,{timeout:120000});
 await page.evaluate(async()=>{leaveMenu();state=C.fresh();state.quest='open';state.universe.freeTravel=true;state.story.flags.tutorialSkipped=true;state.location='earth';state.universe.currentSystem='sol';
  Object.assign(state.story.flags,{metAdmin:true,metIris:true,districtDoor:true,districtBadge:true});await enterWalking('sacramento');Object.assign(walker,{x:61,z:-65,yaw:0,pitch:0});});
 await page.waitForFunction(()=>VoidAssets.pending===0&&walkingLocation?.id==='neochinatown',null,{timeout:180000});
 // One sample: parts in view but not drawn, parts switched off, the nearest vertex to the camera, the attention numbers, the arms.
 const sample=()=>page.evaluate(()=>{const B=BABYLON,x=VoidVR.session.world.companions[0],n=x.node,sc=n.getScene(),cam=sc.activeCamera,eye=cam.globalPosition;
  sc.updateTransformMatrix?.(true);const planes=B.Frustum.GetPlanes(cam.getTransformationMatrix()),am=sc.getActiveMeshes(),active=new Set(am.data.slice(0,am.length));
  const r={missing:[],off:[],near:Infinity,culled:!!VoidCrowd.controller(n)?.culled,npcLook:globalThis.VoidNPCLook?.current?.character||null};
  for(const m of n.getChildMeshes()){if(!(m.getTotalVertices?.()>0))continue;const name=m.name.replace(/^.*?-/,'');
   if(!m.isVisible)r.off.push(name);if(!m.isEnabled())continue;const pos=m.getPositionData(true,false),wm=m.getWorldMatrix(),v=new B.Vector3(),t=new B.Vector3(),step=3*Math.max(1,Math.floor(pos.length/3/1500));let inView=false;
   for(let i=0;i<pos.length;i+=step){v.set(pos[i],pos[i+1],pos[i+2]);B.Vector3.TransformCoordinatesToRef(v,wm,t);const d=B.Vector3.Distance(t,eye);if(d<r.near)r.near=d;if(!inView&&planes.every(p=>p.dotCoordinate(t)>=0))inView=true;}
   if(inView&&m.isVisible&&!active.has(m))r.missing.push(name);}
  const a=x.att,D=180/Math.PI;r.att={yaw:a.yaw*D,pitch:a.pitch*D,added:a.added,yawRel:a.post?.yawRel,weight:a.weight};
  const bone=k=>n.getDescendants(false).find(t=>t.name.endsWith('mixamorig:'+k));const armDir=s=>{const u=bone(s+'Arm'),f=bone(s+'ForeArm');if(!u||!f)return null;return f.getAbsolutePosition().subtract(u.getAbsolutePosition()).normalize().y;};
  r.arms=[armDir('Left'),armDir('Right')];r.playing=n.metadata.animationGroups.filter(g=>g.isPlaying).map(g=>g.name.replace(/^.*?-(?=[a-z])/,''));r.talking=!!globalThis.VoidConversationUI?.isOpen||typeof speech!=='undefined'&&!!speech;return r;});
 for(const id of wanted){
  assert(await page.evaluate(id=>VoidVR.launch('suite',{companion:id}),id),'enter the bedroom with '+id);
  await page.waitForFunction(()=>VoidVR.session?.world&&VoidAssets.pending===0,null,{timeout:240000});await page.waitForTimeout(2500);
  const limits=await page.evaluate(()=>{const x=VoidVR.session.world.companions[0],C=VoidVRCompanions,D=180/Math.PI;x.att.debug=true;x.c.mode='stay';
   return {yaw:x.cfg.maxHeadYaw*1.2*D,pitch:x.cfg.maxHeadPitch*D,addYaw:C.maxCorrection.yaw*D,addPitch:C.maxCorrection.pitch*D};});
  // Up to them, then Chat from their menu (the real panel), so the line is on screen while we look.
  const place=(d,a,p)=>page.evaluate(([d,a,p])=>{const n=VoidVR.session.world.companions[0].node,y=n.rotation.y+a;walker.x=n.position.x+Math.sin(y)*d;walker.z=n.position.z+Math.cos(y)*d;
   walker.yaw=Math.atan2(n.position.x-walker.x,n.position.z-walker.z);walker.pitch=p;},[d,a,p]);
  await place(.9,0,0);await page.waitForTimeout(400);await page.evaluate(()=>VoidVR.session.world.interact({id:'vr-companion'}));await page.waitForSelector('.vr-companion-menu button.vr-choice');
  const opts=await page.$$eval('.vr-companion-menu button.vr-choice',b=>b.map(x=>x.textContent));const chat=opts.indexOf('CHAT');
  if(chat>=0)await page.evaluate(i=>document.querySelectorAll('.vr-companion-menu button.vr-choice')[i].click(),chat);   // the panel's own click handler (a pointer click can time out under software rendering)
  await page.evaluate(()=>{const x=VoidVR.session.world.companions[0];x.gesture('greet');});
  const views=[[.55,0,.25],[.6,.7,0],[.5,-.7,.35],[.7,1.3,-.2],[.55,-1.3,.1],[.6,0,-.55],[.9,2.4,0],[.65,-2.4,.2],[.5,.3,.5],[.75,-.3,-.35]],samples=[];
  const t0=Date.now();let i=0;
  while(Date.now()-t0<10000||i<14){const [d,a,p]=views[i%views.length];if(i%2===0)await place(d,a,p);if(i===6)await page.evaluate(()=>VoidVR.session.world.companions[0].gesture('laugh'));
   await page.waitForTimeout(250);samples.push(await sample());i++;}
  await page.evaluate(()=>document.querySelectorAll('[class*=dialogue],#vr-companion-line').forEach(e=>e.style.visibility='hidden'));await place(.55,.35,.15);await page.waitForTimeout(600);
  await page.screenshot({path:path.join(out,id+'-close.png')});
  await page.evaluate(()=>document.querySelectorAll('[class*=dialogue],#vr-companion-line').forEach(e=>e.style.visibility=''));
  const bad=samples.filter(s=>s.missing.length||s.off.length);
  report[id]={samples:samples.length,missing:[...new Set(bad.flatMap(s=>s.missing))],off:[...new Set(bad.flatMap(s=>s.off))],near:Math.min(...samples.map(s=>s.near)),
   yaw:Math.max(...samples.map(s=>Math.abs(s.att.yaw))),pitch:Math.max(...samples.map(s=>Math.abs(s.att.pitch))),addYaw:Math.max(...samples.map(s=>Math.abs(s.att.added?.yaw||0))),
   addPitch:Math.max(...samples.map(s=>Math.abs(s.att.added?.pitch||0))),roll:Math.max(...samples.map(s=>Math.abs(s.att.added?.roll||0))),talking:samples.filter(s=>s.talking).length,
   tpose:samples.filter(s=>s.arms.every(y=>y!=null&&Math.abs(y)<.3)).length};
  console.log(id,JSON.stringify(report[id]));
  assert(samples.length>=12,id+': sampled for ten seconds');
  assert.deepEqual(report[id].missing,[],id+': parts in view are drawn');
  assert.deepEqual(report[id].off,[],id+': no part hidden by another system');
  assert(samples.every(s=>!s.culled&&!s.npcLook),id+': street culling and the walking-conversation head turn leave the companion alone');
  assert(report[id].near>.1,id+': the camera stays outside the near plane of their body ('+report[id].near.toFixed(3)+' m)');
  assert(chat<0||report[id].talking>=samples.length*.8,id+': the conversation was open while we looked');
  assert(report[id].yaw<=limits.yaw+.5&&report[id].pitch<=limits.pitch+.5,id+': commanded head turn within limits '+JSON.stringify(report[id]));
  assert(report[id].addYaw<=limits.addYaw+1&&report[id].addPitch<=limits.addPitch+1,id+': added turn within maxCorrection');
  assert(report[id].roll<8,id+': the attention pass keeps the head level (added roll '+report[id].roll.toFixed(1)+' degrees)');
  assert.equal(report[id].tpose,0,id+': no arms-out bind pose');
  await page.evaluate(()=>{for(let k=0;k<6&&mode==='dialogue';k++)advanceSpeech?.();VoidVR.exit();});await page.waitForTimeout(800);}
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,1));
 assert.deepEqual(errors,[],'no page errors');console.log('PASS: companions stay whole up close',wanted.join(', '));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
