/* THE AVENUE'S STREET PAIR in a real browser (Chromium, software GL, offline): Reverie on shift (forced UTC 06:30) and Lace on shift (UTC 15:30), each through
   her clip library (an idle, walking, running, sitting down, sitting, standing up, dancing, talking / gesturing, the V1: scrolling, a selfie, a photo of the cat)
   with the cat, the handover (nobody out), and the cat coming to the player. Close-ups are taken at deviceScaleFactor 1.
     node tests/street-pair-browser.cjs [low|medium|high]   (SHOTS=dir; WHO=reverie|lace for one of them; own static server on a free port) */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const tier=['low','medium','high'].includes(process.argv[2])?process.argv[2]:'medium',shots=process.env.SHOTS||path.resolve(__dirname,'..','docs/development/street-pair');fs.mkdirSync(shots,{recursive:true});
const bundled=['/opt/pw-browsers/chromium','/opt/pw-browsers/chromium-1243/chrome-linux64/chrome'].find(f=>fs.existsSync(f)&&fs.statSync(f).isFile()),exe=process.env.BROWSER_EXECUTABLE||bundled||null;
function serve(){const root=path.resolve(__dirname,'..'),types={'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.ogg':'audio/ogg','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.glb':'model/gltf-binary'};
 const srv=http.createServer((req,res)=>{let f;try{f=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));}catch{res.writeHead(400);return res.end();}if(!f.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);return res.end();}res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(d);});});
 return new Promise(r=>srv.listen(0,'127.0.0.1',()=>r(srv)));}
(async()=>{
 const srv=await serve(),base='http://127.0.0.1:'+srv.address().port,log=m=>console.log(new Date().toISOString().slice(11,19),m);
 const b=await chromium.launch({headless:true,...(exe?{executablePath:exe}:{}),args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader','--no-sandbox','--autoplay-policy=no-user-gesture-required']});
 try{
  const page=await (await b.newContext({viewport:{width:1280,height:720},serviceWorkers:'block'})).newPage();page.setDefaultTimeout(600000);const errs=[];page.on('pageerror',e=>errs.push(e.message+' @ '+String(e.stack||'').split('\n').slice(1,4).join(' | ')));
  await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));await page.route('**/api/**',r=>r.fulfill({status:503,contentType:'application/json',body:'{}'}));
  await page.addInitScript(q=>localStorage.setItem('void-runner-graphics-v1',JSON.stringify({renderer:'babylon',quality:q,v:2,chosen:true})),tier);
  await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started);
  await page.evaluate(()=>Object.assign(VoidPreparation.limits,{scene:900000,assets:900000,optional:600000,area:900000,total:1800000,module:600000,artwork:300000}));
  const at=(x,z,yaw=0,pitch=0)=>page.evaluate(([x,z,yaw,pitch])=>{Object.assign(walker,{x,z,yaw,pitch});},[x,z,yaw,pitch]);
  const shot=async(name,wait=2500,bare=false)=>{await page.waitForTimeout(wait);await page.evaluate(b=>{document.getElementById('pd-notify')?.remove();const s=document.getElementById('screen');if(s)s.style.visibility=b?'hidden':'';},bare);await page.screenshot({path:path.join(shots,name+'-'+tier+'.png')});await page.evaluate(()=>{const s=document.getElementById('screen');if(s)s.style.visibility='';});log('shot '+name);};
  const walk=async(x1,z1)=>{const t0=Date.now();for(;;){const r=await page.evaluate(([x1,z1])=>{if(mode!=='walking'||!walker)return 'wait';const dx=x1-walker.x,dz=z1-walker.z,d=Math.hypot(dx,dz);if(d<.05)return 'done';const s=Math.min(.35,d),nx=walker.x+dx/d*s,nz=walker.z+dz/d*s;if(VoidExplorer.blocked(nx,nz,walkingLocation))return 'blocked';walker.x=nx;walker.z=nz;walker.yaw=Math.atan2(dx,dz);return d<=s?'done':'moving';},[x1,z1]);
   if(r==='done')return;assert.ok(Date.now()-t0<300000,'walk to '+x1+','+z1+' stuck ('+r+')');await page.waitForTimeout(r==='moving'?60:250);}};
  const perf=()=>page.evaluate(()=>{const sc=VoidBabylon.scene,e=sc.getEngine(),gl=e._gl,t=[],d=[];for(let i=0;i<12;i++){const d0=e._drawCalls.current,a=performance.now();sc.render();gl.finish();t.push(performance.now()-a);d.push(e._drawCalls.current-d0);}t.sort((a,b)=>a-b);d.sort((a,b)=>a-b);return {drawCalls:d[6],activeMeshes:sc.getActiveMeshes().length,frameMs:+t[6].toFixed(1)};});
  // Close-ups: the camera 2.5 m in front of a figure that is already in the scene (turned `off` radians round it), looking at its chest.
  const frontOf=async(name,pos,yaw,off=0,dist=3,bare=true,pitch=.2)=>{const a=yaw+off,x=pos[0]+Math.sin(a)*dist,z=pos[1]+Math.cos(a)*dist;await at(x,z,Math.atan2(pos[0]-x,pos[1]-z),pitch);await shot(name,2500,bare);};   // pitch: positive looks down
  const street=async(quarter,spawn)=>{await page.evaluate(async([quarter,spawn])=>{const d=C.startDistrictCampaign(C.fresh());d.story.flags.podWakePending=false;d.credits=100;state=d;walkingLocation=walker=null;mode='menu';document.getElementById('screen')?.classList.add('hidden');state.location='earth';
    await enterWalking(VoidDistrictArea.KEY.street,{silent:true,quarter,spawn});},[quarter,spawn]);
   await page.waitForFunction(q=>mode==='walking'&&walkingLocation?.quarter===q&&VoidAssets.pending===0,quarter);await page.waitForTimeout(3000);};
  const SP=()=>page.evaluate(()=>VoidBabylon.district?.streetPair?.stats?.()||null);
  const force=(h,m=30,sec=0)=>page.evaluate(([h,m,sec])=>{const base=Date.UTC(2026,10,18,h,m,sec),t0=Date.now();VoidBabylon.district.streetPair.setClock(()=>base+(Date.now()-t0));},[h,m,sec]);
  // software GL draws a few frames a second: the street pair's own clock is moved on by hand (its tick, 50 ms steps) so the routine and the cat get somewhere
  const ff=s=>page.evaluate(n=>{const sp=VoidBabylon.district.streetPair;for(let i=0;i<n;i++)sp.tick(.05);},Math.round(s/.05));
  const until=async(fn,steps=60)=>{for(let i=0;i<steps;i++){if(await page.evaluate(fn))return true;await ff(1);}return false;};
  await street('avenue',[100,1.7,-14]);   // the player waits out in the road, beyond the cat's reach
  assert.ok(await SP(),'the street pair runs on the Avenue');
  if(process.env.PROBE){await force(+process.env.PROBE||6);await page.waitForFunction(()=>VoidBabylon.district.streetPair.stats().her,null,{timeout:300000,polling:1000});
   await page.evaluate(()=>{for(const g of VoidBabylon.district.streetPair.her.node.metadata.animationGroups)g.blendingSpeed=1;});
   for(const clip of ['idle','sit','sit-wave']){await page.evaluate(clip=>{const sp=VoidBabylon.district.streetPair,h=sp.her,st=VoidStreetPair.STEPS[1];Object.assign(h.s,{mode:'stop',left:999,clip,x:st.x,z:VoidStreetPair.seatOf(st),yaw:Math.PI,zo:0,device:null,sub:'test'});},clip);await page.waitForTimeout(6000);
    const r=await page.evaluate(()=>{const h=VoidBabylon.district.streetPair.her,m=h.node.getChildMeshes(false).find(m=>m.skeleton),sk=m.skeleton;const o={clip:h.clip,node:[+h.node.position.x.toFixed(2),+h.node.position.z.toFixed(2),+h.node.rotation.y.toFixed(2)]};
     for(const n of ['Hips','Head','LeftFoot','LeftHand']){const b=sk.bones.find(b=>b.name.endsWith(n));const t=b.getTransformNode?.();if(t)t.computeWorldMatrix(true);const v=t?t.getAbsolutePosition():b.getAbsolutePosition(m);o[n]=[+v.x.toFixed(2),+v.y.toFixed(2),+v.z.toFixed(2)];}return o;});log('probe '+JSON.stringify(r));}
   return;}
  const who=process.env.WHO||'both';
  // Hold her in one clip at a spot for a close-up (the routine's own 'stop' mode, long), the cross-fade given time to finish.
  const hold=(clip,extra={})=>page.evaluate(([clip,extra])=>{const h=VoidBabylon.district.streetPair.her;Object.assign(h.s,{mode:'stop',left:999,clip,device:null,face:null,sub:'test'},extra);},[clip,extra]);
  const herAt=()=>page.evaluate(()=>{const n=VoidBabylon.district.streetPair.her.node;return [n.position.x,n.position.z,n.rotation.y];});
  const close=async(name,off=.5,dist=2.6,pitch=.12,wait=2600)=>{const [x,z,y]=await herAt();const a=y+off,cx=x+Math.sin(a)*dist,cz=Math.max(-11,z+Math.cos(a)*dist);await at(cx,cz,Math.atan2(x-cx,z-cz),pitch);await shot(name,wait,true);};
  const feet=()=>page.evaluate(()=>{const h=VoidBabylon.district.streetPair.her.node;const sk=h.getChildMeshes(false).find(m=>m.skeleton)?.skeleton;if(!sk)return null;sk.computeAbsoluteMatrices(true);const y=['LeftToeBase','RightToeBase','LeftFoot','RightFoot'].map(n=>{const b=sk.bones.find(b=>b.name.endsWith(n));return b?b.getAbsolutePosition(h.getChildMeshes(false).find(m=>m.skeleton)).y:null;});return {pave:VoidBabylon.district.streetPair.stats().pave,y:y.map(v=>v===null?null:+v.toFixed(3))};});
  async function library(id,hour,tag){
   await force(hour);await page.waitForFunction(id=>VoidBabylon.district.streetPair.stats().her?.id===id&&VoidBabylon.district.streetPair.stats().cat,id,{timeout:300000,polling:1000});
   const groups=await page.evaluate(()=>VoidBabylon.district.streetPair.her.node.metadata.animationGroups.map(g=>g.name.replace(/^.*?-(?=[a-z-]+(\.\d+)?$)/,'')));log(tag+' clips '+JSON.stringify(groups));
   // software GL draws about a frame a second, and the 0.4 s cross-fade is per frame (about 25 frames): for the stills it is made quick, so each shows its clip
   await page.evaluate(()=>{for(const g of VoidBabylon.district.streetPair.her.node.metadata.animationGroups)g.blendingSpeed=.5;});
   // walking (the cat at her heel)
   await page.evaluate(()=>{const s=VoidBabylon.district.streetPair.her.s;Object.assign(s,{mode:'walk',left:60,x:102,dir:1,device:null});});await ff(2);
   assert.equal((await SP()).her.clip,'walk');await close(tag+'-walk',1.2,3.2);log(tag+' walk feet '+JSON.stringify(await feet()));
   // running a short way
   await page.evaluate(()=>{const s=VoidBabylon.district.streetPair.her.s;Object.assign(s,{mode:'run',left:30,x:96,dir:1});});await ff(.4);assert.equal((await SP()).her.clip,'run');
   await page.evaluate(()=>{VoidBabylon.district.streetPair.her.s.left=30;});await close(tag+'-run',1.3,3.4,.1,1800);await page.evaluate(()=>{const s=VoidBabylon.district.streetPair.her.s;s.mode='walk';s.left=60;});
   // idles, the cat near
   await page.evaluate(()=>{const s=VoidBabylon.district.streetPair.her.s;Object.assign(s,{x:106,z:-6.85,yaw:Math.PI});});
   for(const c of ['idle','idle-shift','idle-stretch','look']){await hold(c,{yaw:Math.PI});await close(tag+'-'+c,.35,2.6,.12,3200);}
   await hold('dance-groove',{yaw:Math.PI});await close(tag+'-dance-groove',.35,2.8,.12,3000);
   await hold('dance-bop',{yaw:Math.PI});await close(tag+'-dance-bop',-.4,2.8,.12,3000);
   await hold('gesture',{yaw:Math.PI*.8});await close(tag+'-gesture',.3,2.6,.12,3200);
   await hold('talk',{yaw:Math.PI});await close(tag+'-talk',.3,2.6,.12,3000);
   await hold('shrug',{yaw:Math.PI});await close(tag+'-shrug',.3,2.6,.12,2400);
   // the glance: a player close in front and to one side; her head and neck turn toward them (clamped), and back when they leave
   await hold('idle',{yaw:Math.PI});await close(tag+'-look-player',.55,2.3,.05,3500);{const l=(await SP()).look;log(tag+' glance '+JSON.stringify(l));assert.ok(l?.on&&l.w>.9,'she glances at the player');assert.ok(Math.abs(l.yaw)<=35.01);}
   await close(tag+'-look-player-wide',1.0,2.0,.05,3500);{const l=(await SP()).look;log(tag+' glance wide '+JSON.stringify(l));assert.ok(Math.abs(Math.abs(l.yaw)-35)<1.5,'clamped at 35 degrees');}
   {const [hx,hz]=await herAt();await at(hx,hz-7,0,0);}await page.waitForTimeout(4000);{const l=(await SP()).look,c=await page.evaluate(()=>{const p=VoidBabylon.scene.activeCamera.globalPosition;return [p.x,p.z];});log(tag+' glance after leaving '+JSON.stringify(l)+' camera '+JSON.stringify(c));assert.ok(l&&!l.on,'and looks away when the player leaves');await page.waitForFunction(()=>VoidBabylon.district.streetPair.stats().look.w<.05,null,{timeout:60000,polling:500});}   /* software GL draws a frame or two a second: the 0.4 s ease takes a few frames */
   // the V1: a scroll, a selfie, a photo of the cat (npc-device.js poses, forced by the routine)
   await hold('idle',{yaw:Math.PI,device:'scroll'});await close(tag+'-v1-scroll',.5,2.2,.18,3500);
   await hold('idle',{yaw:Math.PI,device:'selfie'});await close(tag+'-v1-selfie',.4,2.4,.12,3500);
   await page.evaluate(()=>{const sp=VoidBabylon.district.streetPair,c=sp.cat,h=sp.her;c.x=h.s.x+.9;c.z=h.s.z+.35;});
   await hold('idle',{device:'photo',face:{x:0,z:0},yaw:Math.PI/2});await page.evaluate(()=>{const sp=VoidBabylon.district.streetPair;sp.her.s.face={x:sp.cat.x,z:sp.cat.z};});await ff(1);await close(tag+'-v1-photo-cat',.9,2.6,.2,3500);
   log(tag+' device '+JSON.stringify(await page.evaluate(()=>VoidNPCDevice?.stats?.()||null)));
   // sitting down on a ledge (the transition), sitting, standing up
   const ledge=id==='grey-reverie'?'ledge-reverie':'ledge-laundry';
   await page.evaluate(l=>{const S=VoidStreetPair,h=VoidBabylon.district.streetPair.her,st=S.STEPS.find(t=>t.id===l);Object.assign(h.s,{mode:'to-step',step:st,x:st.x-1.5,z:S.frontOf(st),device:null,face:null,sub:null,left:0});},ledge);
   assert.ok(await until(()=>VoidBabylon.district.streetPair.stats().her.mode==='sit-down',200),'she sits down');await page.waitForTimeout(500);await close(tag+'-sit-down',.6,2.8,.12,10);
   assert.ok(await until(()=>VoidBabylon.district.streetPair.stats().her.mode==='sit',60),'she sits');await page.evaluate(()=>{const s=VoidBabylon.district.streetPair.her.s;s.left=999;s.device=null;s.waved=true;s.sub=null;});
   await close(tag+'-sit',.5,2.6,.15,3500);log(tag+' sit feet '+JSON.stringify(await feet()));await close(tag+'-sit-side',1.3,2.4,.15,1200);
   await page.evaluate(()=>{const s=VoidBabylon.district.streetPair.her.s;s.sub='wave';s.waveLeft=999;});await close(tag+'-sit-wave',.4,2.6,.15,3000);
   await page.evaluate(()=>{const s=VoidBabylon.district.streetPair.her.s;s.sub=null;s.left=0;});await ff(.1);assert.equal((await SP()).her.mode,'stand-up');await page.waitForTimeout(450);await close(tag+'-stand-up',.6,2.8,.12,10);
   assert.ok(await until(()=>VoidBabylon.district.streetPair.stats().her.mode==='walk',80),'and walks on');
   {const p=await perf();log(tag+' perf '+JSON.stringify(p));}}
  if(who!=='lace')await library('grey-reverie',6,'reverie');
  if(who!=='reverie')await library('ethereal-lace',15,'lace');
  // ---- handover (UTC 12:00:20): nobody is out; the cat goes home ----
  await force(12,0,20);await ff(1);
  {const s=await SP();log('handover '+JSON.stringify(s));assert.equal(s.her,null);assert.equal(s.onStreet,null);assert.ok(await until(()=>VoidBabylon.district.streetPair.stats().cat.mode==='home',10));}
  // ---- the player walks up to the cat: now and then it comes to them ----
  {let came=false;for(let k=0;k<6&&!came;k++){await page.evaluate(()=>{const c=VoidBabylon.district.streetPair.cat;c.until=0;c.lastNear=false;Object.assign(walker,{x:c.x+1.6,z:c.z-1.8});});await ff(.2);came=await until(()=>VoidBabylon.district.streetPair.stats().cat.mode==='player',40);if(!came){await page.evaluate(()=>Object.assign(walker,{x:100,z:-14}));await ff(.2);}}
   log('cat to player: '+came);if(came){const s=await SP();await at(await page.evaluate(()=>walker.x),await page.evaluate(()=>walker.z),await page.evaluate(()=>{const c=VoidBabylon.district.streetPair.cat;return Math.atan2(c.x-walker.x,c.z-walker.z);}),.55);await shot('cat-player',1500,true);}}
  {const s=await SP();log('bad numbers caught '+JSON.stringify(s.nan));assert.deepEqual(s.nan,{her:0,cat:0,look:0},'no bad numbers');}
  const real=errs.filter(e=>!/cache\.js/.test(e));   /* cache.js's 15-minute service-worker update tick throws when the test blocks service workers (a run over 15 minutes) */
  log('errors '+JSON.stringify(real.slice(0,5)));assert.equal(real.length,0,'page errors');
 }finally{await b.close();srv.close();}
})().catch(e=>{console.error(e);process.exit(1);});
