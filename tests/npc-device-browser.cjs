/* People using their V1 in the real game (Chromium, software GL, offline). NeoChinatown's Old Town street: walkers and standers use the hologram (counts within the
   caps); a walker reading theirs (screenshot); NULL: a selfie on the dance floor and a pair selfie (screenshot); STAGE A STREET ARGUMENT HERE: most people nearby film it,
   a V3 // Shadow carrier and a monk-tagged person do not (screenshot); performance: draw calls and the module's own frame cost with the feature on and off.
   Usage: node tests/npc-device-browser.cjs   (own static server on a free port; SHOTS=dir; BROWSER_EXECUTABLE=path; QUALITY=low|medium|high) */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const shots=process.env.SHOTS||path.resolve(__dirname,'..','docs/development/npc-v1-use');fs.mkdirSync(shots,{recursive:true});
const bundled=['/opt/pw-browsers/chromium','/opt/pw-browsers/chromium-1243/chrome-linux64/chrome'].find(f=>fs.existsSync(f)&&fs.statSync(f).isFile()),exe=process.env.BROWSER_EXECUTABLE||bundled||null;
const quality=process.env.QUALITY||'medium',W=1366,H=768,only=process.env.ONLY||'';
function serve(){const root=path.resolve(__dirname,'..'),types={'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.ogg':'audio/ogg','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.glb':'model/gltf-binary'};
 const srv=http.createServer((req,res)=>{let f;try{f=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));}catch{res.writeHead(400);return res.end();}if(!f.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);return res.end();}res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(d);});});
 return new Promise(r=>srv.listen(0,'127.0.0.1',()=>r(srv)));}
(async()=>{
 const srv=await serve(),base='http://127.0.0.1:'+srv.address().port;
 const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader','--no-sandbox'],...(exe?{executablePath:exe}:{})});
 const log=m=>console.log(new Date().toISOString().slice(11,19),m);
 try{
  const ctx=await browser.newContext({viewport:{width:W,height:H},serviceWorkers:'block'}),page=await ctx.newPage();page.setDefaultTimeout(300000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(/npc device/i.test(m.text()))errors.push(m.text());});
  const shot=async n=>{await page.waitForTimeout(400);await page.screenshot({path:path.join(shots,n+'-'+W+'.png')});log('shot '+n);};
  await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));await page.route('**/api/**',r=>r.fulfill({status:503,contentType:'application/json',body:'{}'}));
  await page.addInitScript(q=>{localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:q,v:2,chosen:true}));},quality);
  await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started);
  await page.evaluate(()=>Object.assign(VoidPreparation.limits,{scene:600000,assets:600000,optional:300000,total:1200000,module:600000,artwork:300000}));
  log('street, Old Town');
  await page.evaluate(async()=>{const d=C.startDistrictCampaign(C.fresh());d.story.flags.podWakePending=false;state=d;walkingLocation=walker=null;mode='menu';document.getElementById('screen')?.classList.add('hidden');state.location='earth';await enterWalking(VoidDistrictArea.KEY.street,{silent:true,quarter:'oldtown'});});
  await page.waitForFunction(()=>mode==='walking'&&walkingLocation?.area==='street');
  await page.waitForFunction(()=>VoidAssets.pending===0,null,{timeout:400000});
  await page.waitForFunction(()=>VoidBabylon.district?.nightlife?.stats().spawned>=8,null,{timeout:300000});
  await page.evaluate(()=>{for(const id of ['pd-notify'])document.getElementById(id)?.remove();});
  const S=()=>page.evaluate(()=>VoidNPCDevice.stats());
  const full=v=>page.waitForFunction(v=>VoidNPCDevice.agents().find(a=>a.node===window[v])?.w>=.97,v,{timeout:120000});   // the pose fully in (the software renderer runs at a frame or two a second)
  // the camera d metres from a person's head, `ang` round from their front, looking at their chest (walker.pitch: negative looks up)
  const front=(v,d,ang=0,aimDy=-.3)=>page.evaluate(([v,d,ang,aimDy])=>{const n=window[v],B=BABYLON,head=n.getDescendants(false).find(t=>/mixamorig:Head$/.test(t.name)),hp=(head||n).getAbsolutePosition(),f=B.Vector3.TransformNormal(B.Axis.Z,n.getWorldMatrix());f.y=0;f.normalize();const y=Math.atan2(f.x,f.z)+ang;
   Object.assign(walker,{x:hp.x+Math.sin(y)*d,z:hp.z+Math.cos(y)*d});walker.yaw=Math.atan2(hp.x-walker.x,hp.z-walker.z);const eye=VoidBabylon.scene.activeCamera.globalPosition.y;walker.pitch=-Math.atan2(hp.y+aimDy-eye,d);},[v,d,ang,aimDy]);
  // (1) the street on its own: let the scheduler run, then count. Stand mid Main Street looking along it.
  await page.evaluate(()=>Object.assign(walker,{x:61,z:-95,yaw:0,pitch:-.05}));
  await page.waitForTimeout(25000);let st=await S();log('street '+JSON.stringify(st));
  const ag=await page.evaluate(()=>VoidNPCDevice.agents().map(({node,...a})=>a));
  const walkers=ag.filter(a=>a.kind==='walker'),using=walkers.filter(a=>a.session).length;log('walkers '+walkers.length+' using '+using);
  assert.ok(st.agents>=8,'street people are taking part');assert.ok(st.posed<=st.cap,'posed within the cap');
  assert.ok(using<=Math.max(1,Math.floor(walkers.length*.2)),'at most a fifth of the walkers');
  const someone=ag.some(a=>a.session);assert.ok(someone,'somebody on the street is using their V1');
  if(!only||only.includes('walker')){
   // (2) a walker reading their V1: the nearest walker made to read, the player a few metres in front of them, looking at them
   const at=await page.evaluate(()=>{const a=VoidNPCDevice.agents().filter(a=>a.kind==='walker'&&a.node.isEnabled()&&a.tier==='v1');const t=a[0];VoidNPCDevice.tag(t.node,{force:()=>'scroll'});window.__w=t.node;return t.key;});
   const follow=async(ms,ang=.35)=>{const end=Date.now()+ms;while(Date.now()<end){await front('__w',1.5,ang);await page.waitForTimeout(120);}};
   await follow(3000);await full('__w');await follow(1500);const one=await page.evaluate(()=>{const {node,...a}=VoidNPCDevice.agents().find(a=>a.node===window.__w);return a;});log('walker '+JSON.stringify(one));assert.equal(one.pose,'scroll');assert.ok(one.holo&&one.cuff,'the wrist cuff and its hologram panel are up');
   await shot('walker-reading');await follow(1500,1.2);await shot('walker-reading-side');
   await page.evaluate(()=>VoidNPCDevice.tag(window.__w,{force:()=>null}));
  }
  if(!only||only.includes('shadow')){
   // (2b) a V3 // Shadow carrier: streamed into the eye. One eye glows; no cuff, no panel, no raised arm. A close-up.
   await page.evaluate(()=>{const a=VoidNPCDevice.agents().filter(a=>a.kind==='stander'&&a.node.isEnabled()).sort((x,y)=>x.d-y.d)[0];VoidNPCDevice.tag(a.node,{tier:'v3',force:()=>'scroll'});window.__s=a.node;});
   await front('__s',.8,.2,-.05);await full('__s');await front('__s',.8,.2,-.05);await page.waitForTimeout(800);const sh=await page.evaluate(()=>{const {node,...a}=VoidNPCDevice.agents().find(a=>a.node===window.__s);return a;});log('shadow '+JSON.stringify(sh));
   assert.equal(sh.tier,'v3');assert.ok(sh.eye,'one eye glows');assert.ok(!sh.cuff&&!sh.holo&&!sh.frame,'no cuff, no panel');await shot('shadow-eye-closeup');
   await page.evaluate(()=>VoidNPCDevice.tag(window.__s,{force:()=>null,tier:'v1'}));
  }
  if(!only||only.includes('bump')){
   // (2c) reading while walking: a near miss (a late sidestep) and a bump into someone coming the other way; a frame sequence of each
   const setup=bump=>page.evaluate(bump=>{const N=VoidBabylon.district.nightlife,ws=N.people.filter(p=>p.node&&!p.fixed&&!p.away&&!p.hidden&&!p.drunk&&!p.friendOf&&!p.pairOf&&!N.people.some(o=>o.pairOf===p.id||o.friendOf===p.id)&&p.l.id.startsWith('main'));
    const p=ws.find(p=>VoidNPCDevice._agent(p.node)?.tier!=='v3'),o=ws.find(o=>o!==p&&o.l===p.l)||ws.find(o=>o!==p);if(!p||!o)return null;VoidNPCDevice.tag(p.node,{tier:'v1',force:()=>'scroll'});VoidNPCDevice.tag(o.node,{tier:'v1',force:()=>null});
    o.l=p.l;o.dir=-p.dir;o.t=p.t+p.dir*3.2;o.side=p.side+(bump?0:.15);o.state='walk';p.state='walk';p.timer=o.timer=60;p.reading=false;window.__w=p.node;window.__o=o.node;window.__p=p;return {p:p.id,o:o.id,stats:N.stats()};},bump);
   const seq=async(name,bump)=>{const s0=await setup(bump);assert.ok(s0,'two walkers for the '+name);await page.waitForFunction(()=>VoidNPCDevice._agent(window.__w)?.w>.9&&window.__p.reading,null,{timeout:120000});
    if(bump)await page.evaluate(()=>{window.__p.plan={kind:'bump',at:99};});
    const out=[],snap=async i=>{await front('__w',2.4,1.35,-.3);await shot(name+'-'+i);out.push(await page.evaluate(()=>({state:window.__p.state,side:+window.__p.side.toFixed(2),pose:VoidNPCDevice._agent(window.__w)?.pose,stats:VoidBabylon.district.nightlife.stats()})));};
    const m0=s0.stats;await snap(0);
    await page.waitForFunction(([m0,bump])=>{const st=VoidBabylon.district.nightlife.stats();const n=window.__p,o=window.__o;const p=n.node.position,q=o.position;
     if(!window.__lastCam||performance.now()-window.__lastCam>300){window.__lastCam=performance.now();}return bump?n.state==='bump':st.misses>m0.misses;},[m0,bump],{timeout:240000,polling:200});
    await snap(1);await page.waitForTimeout(2500);await snap(2);await page.waitForTimeout(5000);await snap(3);
    log(name+' '+JSON.stringify(out.map(o=>[o.state,o.side,o.pose,o.stats.misses,o.stats.bumps])));return out;};
   const miss=await seq('near-miss',false);assert.ok(miss.at(-1).stats.misses>0,'a near miss: a late sidestep');
   const hit=await seq('bump',true);assert.ok(hit.some(o=>o.state==='bump'),'the bump: they stop');assert.ok(hit.at(-1).stats.personBumps>0,'into the person coming the other way');
   await page.evaluate(()=>{VoidNPCDevice.tag(window.__w,{force:()=>null});});
  }
  if(!only||only.includes('argument')){
   // (3) the staged argument on Main Street: most film it; a V3 // Shadow carrier and a monk do not
   await page.evaluate(()=>Object.assign(walker,{x:61,z:-80,yaw:Math.PI,pitch:-.08}));await page.waitForTimeout(1500);
   const tagged=await page.evaluate(()=>{const near=VoidNPCDevice.agents().filter(a=>a.node.isEnabled()&&a.kind!=='story').map(a=>({a,d:Math.hypot(a.node.getAbsolutePosition().x-61,a.node.getAbsolutePosition().z-(-85))})).sort((x,y)=>x.d-y.d);
    const v3=near[0].a,monk=near[1].a;VoidNPCDevice.tag(v3.node,{tier:'v3'});VoidNPCDevice.tag(monk.node,{monk:true});window.__v3=v3.node;window.__monk=monk.node;return {v3:v3.key,monk:monk.key,d:[near[0].d,near[1].d]};});
   log('tagged '+JSON.stringify(tagged));
   const r=await page.evaluate(()=>VoidCrowdReact.stageArgument({x:61,z:-85,radius:16,duration:20}));log('argument '+JSON.stringify(r));assert.ok(!r.error,r.error);
   const v3r=r.reactions.find(x=>x.id.startsWith(tagged.v3+'#')),mr=r.reactions.find(x=>x.id.startsWith(tagged.monk+'#'));
   assert.ok(v3r&&['ignore','leave'].includes(v3r.mode),'the V3 // Shadow carrier does not film: '+JSON.stringify(v3r));assert.equal(mr?.mode,'ignore','the monk ignores it');
   assert.ok(r.reactions.filter(x=>x.mode==='film').length>=Math.max(2,r.reactions.filter(x=>!['ignore','leave'].includes(x.mode)).length*.5),'most film it');
   await page.waitForTimeout(6000);
   const live=await page.evaluate(()=>VoidNPCDevice.agents().filter(a=>a.react).map(a=>({key:a.key,react:a.react,pose:a.pose,frame:a.frame,tier:a.tier})));log('reacting '+JSON.stringify(live));
   assert.ok(live.filter(a=>a.react==='film'&&a.pose==='film'&&a.frame).length>=1,'people are filming it (frames up)');
   assert.ok(!live.some(a=>(a.key===tagged.v3||a.key===tagged.monk)&&a.pose==='film'),'not the V3 carrier or the monk');
   await page.evaluate(()=>Object.assign(walker,{x:58.5,z:-77,yaw:Math.atan2(61-58.5,-85+77),pitch:.12}));await page.waitForTimeout(2500);await shot('argument-crowd');
   await page.evaluate(()=>Object.assign(walker,{x:64,z:-91,yaw:Math.atan2(61-64,-85+91),pitch:.12}));await page.waitForTimeout(2500);await shot('argument-crowd-2');
   await page.waitForFunction(()=>!VoidNPCDevice.stats().staged&&VoidNPCDevice.agents().every(a=>!a.react),null,{timeout:90000});log('the argument and the reactions ended');
  }
  if(!only||only.includes('perf')){
   // (4) performance: a busy view, the feature on (people forced to use it up to the cap) and off
   await page.evaluate(()=>Object.assign(walker,{x:61,z:-118,yaw:0,pitch:-.03}));await page.waitForTimeout(2500);
   const measure=()=>page.evaluate(async()=>{const sc=VoidBabylon.scene,eng=sc.getEngine();const out={calls:[],ms:[],frame:[]};for(let i=0;i<20;i++){await new Promise(r=>requestAnimationFrame(r));out.calls.push(eng._drawCalls?.current??sc.getActiveMeshes().length);out.ms.push(VoidNPCDevice.stats().ms);}
    const avg=a=>a.reduce((s,x)=>s+x,0)/a.length;return {drawCalls:Math.round(avg(out.calls)),deviceMs:+avg(out.ms).toFixed(3),posed:VoidNPCDevice.stats().posed};});
   await page.evaluate(()=>{const inst=new BABYLON.SceneInstrumentation(VoidBabylon.scene);window.__inst=inst;});
   const force=on=>page.evaluate(on=>{for(const a of VoidNPCDevice.agents())VoidNPCDevice.tag(a.node,{force:on?()=>'scroll':()=>null});},on);
   const calls=()=>page.evaluate(async()=>{const s=[];for(let i=0;i<12;i++){await new Promise(r=>requestAnimationFrame(r));s.push(window.__inst.drawCallsCounter.current);}return Math.round(s.reduce((a,b)=>a+b,0)/s.length);});
   await force(false);await page.waitForTimeout(3000);const off={...(await measure()),draws:await calls()};
   await force(true);await page.waitForTimeout(3000);const on={...(await measure()),draws:await calls()};
   log('perf off '+JSON.stringify(off)+' on '+JSON.stringify(on));fs.writeFileSync(path.join(shots,'perf-'+quality+'.json'),JSON.stringify({quality,off,on},null,1));
   assert.ok(on.posed<=(await S()).cap);await shot('busy-forced-'+quality);await force(false);
  }
  if(!only||only.includes('club')){
   // (5) NULL: a selfie on the dance floor and a pair selfie
   await page.evaluate(()=>Object.assign(walker,{x:44,z:-57.5,yaw:-Math.PI/2,pitch:-.08}));
   await page.waitForFunction(()=>VoidNPCDevice.agents().filter(a=>a.kind==='dancer'||a.kind==='bar').length>=2,null,{timeout:240000});
   await page.waitForTimeout(3000);
   const club=await page.evaluate(()=>VoidNPCDevice.agents().filter(a=>['dancer','bar'].includes(a.kind)).map(({node,...a})=>({...a,p:node.getAbsolutePosition().asArray()})));log('club '+JSON.stringify(club.map(a=>a.key+':'+a.kind+':'+a.tier)));
   const d0=club.find(a=>a.kind==='dancer');await page.evaluate(k=>{const a=VoidNPCDevice.agents().find(a=>a.key===k);VoidNPCDevice.tag(a.node,{force:()=>'selfie',tier:'v1'});window.__d=a.node;},d0.key);
   await front('__d',1.7,.5);await full('__d');await front('__d',1.7,.5);await page.waitForTimeout(800);const sf=await page.evaluate(()=>{const {node,...a}=VoidNPCDevice.agents().find(a=>a.node===window.__d);return a;});assert.equal(sf.pose,'selfie');assert.ok(sf.frame,'the selfie frame is out');await shot('null-selfie');
   await page.evaluate(()=>VoidNPCDevice.tag(window.__d,{force:()=>null}));
   // pair selfie: the two bar guests (Medium and up) or two dancers, through the scheduler's own pair session
   const pairOk=await page.evaluate(()=>{const all=VoidNPCDevice.agents(),a=all.find(x=>x.key==='bar-guest-a')||all.find(x=>x.key==='dancer-0'),b=all.find(x=>x.key===(a.key==='bar-guest-a'?'bar-guest-b':'dancer-1'));if(!a||!b)return null;
    const s=VoidNPCDevice.scheduler.state;for(const x of [a,b]){VoidNPCDevice.tag(x.node,{tier:'v1'});}const dur=12;s.get(a.id).session={pose:'pair-selfie',role:'holder',partner:b.id,t:0,dur,flash:[4]};s.get(b.id).session={pose:'pair-selfie',role:'friend',partner:a.id,t:0,dur,flash:[]};window.__pa=a.node;return [a.key,b.key];});
   log('pair '+pairOk);
   if(pairOk){await page.waitForFunction(()=>VoidNPCDevice.agents().filter(a=>a.pose==='pair-selfie'&&a.w>.9).length===2,null,{timeout:120000});await front('__pa',2.0,-.7,-.25);await page.waitForTimeout(1500);
    const pr=await page.evaluate(()=>VoidNPCDevice.agents().filter(a=>a.pose==='pair-selfie').map(a=>a.key));log('pair posed '+pr);assert.ok(pr.length===2,'both in the pair selfie');await shot('null-pair-selfie');}
   // a drink photographed at the bar (there are no food stalls in the game yet: the bar is the eating and drinking spot)
   const fp=await page.evaluate(()=>{const a=VoidNPCDevice.agents().find(a=>a.kind==='bar'&&a.key!=='bar-guest-b')||VoidNPCDevice.agents().find(a=>a.kind==='bar');if(!a)return null;for(const x of VoidNPCDevice.agents())if(x.kind==='bar')VoidNPCDevice.scheduler.end(x.id,'bar');VoidNPCDevice.tag(a.node,{force:()=>'food-photo',tier:'v1'});window.__f=a.node;return a.key;});
   if(fp){await front('__f',1.4,.9);await full('__f');await front('__f',1.4,.9,-.4);await page.waitForTimeout(800);await shot('null-bar-food-photo');}
  }
  assert.deepEqual(errors,[],'no page errors');
  log('OK');
 }finally{await browser.close();srv.close();}
})().catch(e=>{console.error(e);process.exit(1);});
