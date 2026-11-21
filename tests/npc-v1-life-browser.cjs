/* NPCs living with their V1 in the real game (Chromium, software GL, offline): Old Town's street. Checks and screenshots:
   tiers (V3 // Shadow rare again: street people used to take Admin's), a walker reading, a diner photographing their bowl at a food shopfront, a staged street
   argument (filmers within the quality's cap, the nearest; a monk and a V3 carrier do not film; people walk in and gather loosely), a NULL selfie; and the
   module's own frame cost, A/B against the files on main (BASE=dir holding main's void-runner/npc-device.js and ncz-nightlife.js, served in their place).
   Usage: node tests/npc-v1-life-browser.cjs   (SHOTS=dir; QUALITY=low|medium|high; ONLY=perf,reading,food,argument,club; BASE=dir for the A/B "before" run) */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const shots=process.env.SHOTS||path.resolve(__dirname,'..','docs/development/npc-v1-life');fs.mkdirSync(shots,{recursive:true});
const bundled=['/opt/pw-browsers/chromium','/opt/pw-browsers/chromium-1243/chrome-linux64/chrome'].find(f=>fs.existsSync(f)&&fs.statSync(f).isFile()),exe=process.env.BROWSER_EXECUTABLE||bundled||null;
const quality=process.env.QUALITY||'medium',W=1366,H=768,only=process.env.ONLY||'',base=process.env.BASE||'';
function serve(){const root=path.resolve(__dirname,'..'),types={'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.ogg':'audio/ogg','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.glb':'model/gltf-binary'};
 const srv=http.createServer((req,res)=>{let f;try{f=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));}catch{res.writeHead(400);return res.end();}if(!f.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  if(base){const rel=path.relative(root,f),alt=path.join(base,rel);if(/^void-runner[\\/](npc-device|ncz-nightlife)\.js$/.test(rel)&&fs.existsSync(alt))f=alt;}
  fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);return res.end();}res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(d);});});
 return new Promise(r=>srv.listen(0,'127.0.0.1',()=>r(srv)));}
(async()=>{
 const srv=await serve(),url='http://127.0.0.1:'+srv.address().port;
 const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader','--no-sandbox'],...(exe?{executablePath:exe}:{})});
 const log=m=>console.log(new Date().toISOString().slice(11,19),m);
 try{
  const ctx=await browser.newContext({viewport:{width:W,height:H},deviceScaleFactor:1,serviceWorkers:'block'}),page=await ctx.newPage();page.setDefaultTimeout(300000);const errors=[];page.on('pageerror',e=>errors.push(e.message+'\n'+(e.stack||'')));
  page.on('console',m=>{if(/npc device/i.test(m.text()))errors.push(m.text());});
  const shot=async n=>{await page.waitForTimeout(400);await page.screenshot({path:path.join(shots,n+'.png')});log('shot '+n);};
  await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));await page.route('**/api/**',r=>r.fulfill({status:503,contentType:'application/json',body:'{}'}));
  await page.addInitScript(q=>{localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:q,v:2,chosen:true}));},quality);
  await page.goto(url+'/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started);
  await page.evaluate(()=>Object.assign(VoidPreparation.limits,{scene:600000,assets:600000,optional:300000,total:1200000,module:600000,artwork:300000}));
  log('street, Old Town ('+quality+(base?', BASE files':'')+')');
  await page.evaluate(async()=>{const d=C.startDistrictCampaign(C.fresh());d.story.flags.podWakePending=false;state=d;walkingLocation=walker=null;mode='menu';document.getElementById('screen')?.classList.add('hidden');state.location='earth';await enterWalking(VoidDistrictArea.KEY.street,{silent:true,quarter:'oldtown'});});
  await page.waitForFunction(()=>mode==='walking'&&walkingLocation?.area==='street');
  await page.waitForFunction(()=>VoidAssets.pending===0,null,{timeout:400000});
  await page.waitForFunction(()=>VoidBabylon.district?.nightlife?.stats().spawned>=8,null,{timeout:300000});
  await page.evaluate(()=>{for(const id of ['pd-notify'])document.getElementById(id)?.remove();});
  const S=()=>page.evaluate(()=>VoidNPCDevice.stats());
  const agent=v=>page.evaluate(v=>{const {node,...a}=VoidNPCDevice.agents().find(a=>a.node===window[v])||{};return a;},v);
  const full=v=>page.waitForFunction(v=>VoidNPCDevice.agents().find(a=>a.node===window[v])?.w>=.97,v,{timeout:180000});
  // the camera d metres from a person's head, `ang` round from their front, looking at their chest (walker.pitch: negative looks up)
  const front=(v,d,ang=0,aimDy=-.3)=>page.evaluate(([v,d,ang,aimDy])=>{const n=window[v],B=BABYLON,head=n.getDescendants(false).find(t=>/mixamorig:Head$/.test(t.name)),hp=(head||n).getAbsolutePosition(),f=B.Vector3.TransformNormal(B.Axis.Z,n.getWorldMatrix());f.y=0;f.normalize();const y=Math.atan2(f.x,f.z)+ang;
   Object.assign(walker,{x:hp.x+Math.sin(y)*d,z:hp.z+Math.cos(y)*d});walker.yaw=Math.atan2(hp.x-walker.x,hp.z-walker.z);const eye=VoidBabylon.scene.activeCamera.globalPosition.y;walker.pitch=-Math.atan2(hp.y+aimDy-eye,d);},[v,d,ang,aimDy]);
  const hold=async(v,d,ang,aimDy,ms)=>{const end=Date.now()+ms;while(Date.now()<end){await front(v,d,ang,aimDy);await page.waitForTimeout(150);}};
  await page.evaluate(()=>Object.assign(walker,{x:61,z:-95,yaw:0,pitch:-.05}));await page.waitForTimeout(15000);
  const st=await S();log('street '+JSON.stringify(st));
  if(!base){const n=Object.values(st.tiers).reduce((a,b)=>a+b,0);assert.ok((st.tiers.v3||0)<=Math.max(2,n*.2),'V3 // Shadow is rare on the street again: '+JSON.stringify(st.tiers));}
  if(!only||only.includes('perf')){
   // the module's own cost per frame (CPU, ms): idle (nobody posed: the bookkeeping) and everyone forced to read in V1 (posed up to the cap). Busy view down Main Street.
   await page.evaluate(()=>Object.assign(walker,{x:61,z:-118,yaw:0,pitch:-.03}));await page.waitForTimeout(2500);
   const measure=()=>page.evaluate(async()=>{const out={ms:[],frame:[],pose:[]};for(let i=0;i<40;i++){await new Promise(r=>requestAnimationFrame(r));const s=VoidNPCDevice.stats();out.ms.push(s.ms);out.frame.push(s.msFrame??NaN);out.pose.push(s.msPose??NaN);}
    const avg=a=>+(a.reduce((s,x)=>s+x,0)/a.length).toFixed(3),max=a=>+Math.max(...a).toFixed(3);const s=VoidNPCDevice.stats();return {ms:avg(out.ms),msMax:max(out.ms),bookkeeping:avg(out.frame),posing:avg(out.pose),posed:s.posed,agents:s.agents,cap:s.cap};});
   const force=on=>page.evaluate(on=>{for(const a of VoidNPCDevice.agents())VoidNPCDevice.tag(a.node,on?{tier:'v1',force:()=>'scroll'}:{force:()=>null});},on);
   await force(false);await page.waitForTimeout(4000);const off=await measure();
   await force(true);await page.waitForTimeout(5000);const on=await measure();
   log('perf idle '+JSON.stringify(off)+' all reading '+JSON.stringify(on));fs.writeFileSync(path.join(shots,'perf-'+quality+(base?'-before':'-after')+'.json'),JSON.stringify({quality,base:!!base,idle:off,reading:on},null,1));
   await force(false);await page.waitForTimeout(2000);
  }
  if(base){log('BASE run: perf only');return;}
  if(!only||only.includes('reading')){
   // a walker reading their V1: walks slower, head down, the panel up
   await page.evaluate(()=>Object.assign(walker,{x:61,z:-95,yaw:0,pitch:-.05}));await page.waitForTimeout(1500);
   await page.evaluate(()=>{const a=VoidNPCDevice.agents().filter(a=>a.kind==='walker'&&a.node.isEnabled()&&!a.monk).sort((x,y)=>x.d-y.d)[0];VoidNPCDevice.tag(a.node,{tier:'v1',force:()=>'scroll'});window.__w=a.node;});
   await hold('__w',1.7,.5,-.3,3000);await full('__w');await hold('__w',1.7,.5,-.3,1500);const one=await agent('__w');log('reader '+JSON.stringify(one));
   assert.equal(one.pose,'scroll');assert.ok(one.holo&&one.cuff,'cuff and hologram panel up');
   const pace=await page.evaluate(()=>VoidCrowdReact.pace(window.__w));log('reading pace '+pace);
   await shot('01-walker-reading-v1');await page.evaluate(()=>VoidNPCDevice.tag(window.__w,{force:()=>null}));
  }
  if(!only||only.includes('food')){
   // a diner at a food shopfront photographs the bowl in their hand
   const d=await page.evaluate(()=>{const N=VoidBabylon.district.nightlife,p=N.people.filter(p=>p.kind==='food'&&p.node);if(!p.length)return {n:0,all:N.people.filter(p=>p.kind==='food').map(p=>p.id)};const x=p[0];VoidNPCDevice.tag(x.node,{tier:'v1',force:()=>'food-photo'});window.__f=x.node;return {n:p.length,id:x.id,sign:x.sign,x:x.x,z:x.z};});
   log('diners '+JSON.stringify(d));assert.ok(d.n>=1,'a diner stands at a food shopfront');
   await hold('__f',1.5,.75,-.45,3000);await full('__f');await hold('__f',1.5,.75,-.45,2500);const fd=await agent('__f');log('diner '+JSON.stringify(fd));
   assert.equal(fd.pose,'food-photo');assert.ok(fd.dish&&fd.frame,'the bowl in hand and the camera frame over it');await shot('02-food-photo-'+d.sign.replace(/[^A-Z]+/g,'-').toLowerCase());
   await hold('__f',1.2,1.6,-.5,1500);await shot('02b-food-photo-side');
   // and with the scheduler: the session ends and the bowl is put away
   await page.evaluate(()=>VoidNPCDevice.tag(window.__f,{force:()=>null}));await page.waitForFunction(()=>!VoidNPCDevice.agents().find(a=>a.node===window.__f)?.dish,null,{timeout:120000});
  }
  if(!only||only.includes('argument')){
   await page.waitForFunction(()=>VoidBabylon.district.nightlife.stats().spawned>=VoidBabylon.district.nightlife.stats().people*.8,null,{timeout:300000}).catch(()=>{});
   const spot=await page.evaluate(()=>{const ps=VoidNPCDevice.agents().filter(a=>a.node.isEnabled()&&a.kind!=='story').map(a=>a.node.getAbsolutePosition());let best=null,n=-1;for(const p of ps){const k=ps.filter(q=>Math.hypot(q.x-p.x,q.z-p.z)<10).length;if(k>n){n=k;best=p;}}return {x:best.x+(best.x<61?2:-2),z:best.z,n};});
   log('argument spot '+JSON.stringify(spot));await page.evaluate(s=>Object.assign(walker,{x:61,z:s.z+10,yaw:Math.PI,pitch:.08}),spot);await page.waitForTimeout(1500);
   const tagged=await page.evaluate(s=>{const near=VoidNPCDevice.agents().filter(a=>a.node.isEnabled()&&a.kind!=='story').map(a=>({a,d:Math.hypot(a.node.getAbsolutePosition().x-s.x,a.node.getAbsolutePosition().z-s.z)})).sort((x,y)=>x.d-y.d);
    const v3=near[0].a,monk=near[1].a;VoidNPCDevice.tag(v3.node,{tier:'v3'});VoidNPCDevice.tag(monk.node,{monk:true});window.__v3=v3.node;window.__monk=monk.node;return {v3:v3.key,monk:monk.key,d:[near[0].d,near[1].d]};},spot);
   const r=await page.evaluate(s=>VoidCrowdReact.stageArgument({x:s.x,z:s.z,duration:40}),spot);log('argument '+JSON.stringify(r));assert.ok(!r.error,r.error);
   const cap=(await page.evaluate(()=>VoidNPCDevice.filmCapFor(VoidBabylon.quality)));const films=r.reactions.filter(x=>x.mode==='film');
   log('filmers '+films.length+' cap '+cap+' of '+r.reactions.length);assert.ok(films.length>=1&&films.length<=cap,'filmers within the cap');
   const v3r=r.reactions.find(x=>x.id.startsWith(tagged.v3+'#')),mr=r.reactions.find(x=>x.id.startsWith(tagged.monk+'#'));
   assert.ok(v3r&&['ignore','leave'].includes(v3r.mode),'V3 does not film');assert.equal(mr?.mode,'ignore','the monk ignores it');
   await page.waitForFunction(()=>VoidNPCDevice.agents().filter(a=>a.react==='film'&&a.pose==='film'&&a.frame&&a.w>.9).length>=1,null,{timeout:480000});
   await page.waitForFunction(()=>VoidNPCDevice.agents().some(a=>a.react&&a.off>.6),null,{timeout:300000});
   const live=await page.evaluate(()=>VoidNPCDevice.agents().filter(a=>a.react).map(a=>({key:a.key,react:a.react,pose:a.pose,frame:a.frame,off:a.off,walk:a.gathering,tier:a.tier})));log('reacting '+JSON.stringify(live));
   assert.ok(!live.some(a=>(a.key===tagged.v3||a.key===tagged.monk)&&a.pose==='film'),'not the V3 carrier or the monk');
   // from beside the argument, looking at the crowd; then behind a filmer
   await page.evaluate(s=>{const B=BABYLON,ps=VoidNPCDevice.agents().filter(a=>a.react==='film').map(a=>a.node.getAbsolutePosition());const cx=ps.reduce((t,p)=>t+p.x,0)/ps.length,cz=ps.reduce((t,p)=>t+p.z,0)/ps.length;const dx=cx-s.x,dz=cz-s.z,l=Math.hypot(dx,dz)||1;
    Object.assign(walker,{x:s.x-dx/l*1.2+dz/l*1.5,z:s.z-dz/l*1.2-dx/l*1.5});walker.yaw=Math.atan2(cx-walker.x,cz-walker.z);walker.pitch=-.02;},spot);
   await page.waitForTimeout(3000);await shot('03-argument-crowd-filming');
   // round the scene: 6 m from the middle of the crowd and the argument, every 60 degrees, looking at that middle
   for(let k=0;k<6;k++){await page.evaluate(([s,k])=>{const ps=VoidNPCDevice.agents().filter(a=>a.react==='film'||a.react==='watch').map(a=>a.node.getAbsolutePosition());const cx=(ps.reduce((t,p)=>t+p.x,0)/ps.length+s.x)/2,cz=(ps.reduce((t,p)=>t+p.z,0)/ps.length+s.z)/2,y=k*Math.PI/3;
     Object.assign(walker,{x:cx+Math.sin(y)*6,z:cz+Math.cos(y)*6});walker.yaw=Math.atan2(cx-walker.x,cz-walker.z);walker.pitch=.05;},[spot,k]);await page.waitForTimeout(2500);await shot('03-argument-round-'+k);}
   for(const [i,ang] of [[0,Math.PI+.45],[1,Math.PI-.5],[2,Math.PI*.75]]){await page.evaluate(i=>{const a=VoidNPCDevice.agents().filter(a=>a.react==='film'&&a.frame).sort((x,y)=>y.w-x.w)[i%Math.max(1,VoidNPCDevice.agents().filter(a=>a.react==='film'&&a.frame).length)];window.__fm=a.node;},i);
    await hold('__fm',1.6,ang,-.15,2500);await shot('03b-argument-behind-a-filmer-'+i);}
   await page.evaluate(()=>VoidCrowdReact.stopArgument());
  }
  if(!only||only.includes('club')){
   // NULL: a selfie on the dance floor (the scheduler's own club behaviour, forced for the picture)
   await page.evaluate(()=>Object.assign(walker,{x:44,z:-57.5,yaw:-Math.PI/2,pitch:-.08}));
   await page.waitForFunction(()=>VoidNPCDevice.agents().filter(a=>a.kind==='dancer'||a.kind==='bar').length>=2,null,{timeout:240000});await page.waitForTimeout(2000);
   await page.evaluate(()=>{const a=VoidNPCDevice.agents().find(a=>a.kind==='dancer');VoidNPCDevice.tag(a.node,{force:()=>'selfie',tier:'v1'});window.__d=a.node;});
   await hold('__d',1.7,.5,-.3,3000);await full('__d');await hold('__d',1.7,.5,-.3,1500);const sf=await agent('__d');assert.equal(sf.pose,'selfie');assert.ok(sf.frame);await shot('04-null-selfie');
   await page.evaluate(()=>VoidNPCDevice.tag(window.__d,{force:()=>null}));
  }
  assert.deepEqual(errors,[],'no page errors');
  log('OK');
 }finally{await browser.close();srv.close();}
})().catch(e=>{console.error(e);process.exit(1);});
