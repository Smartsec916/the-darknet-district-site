/* THE CHARACTER EDGE LIGHT in a real browser (Chromium, software GL, offline), before/after the 18 Nov 2026 fix (character-finish.js CharacterRimPlugin and
   vr-companions.js CompanionRimPlugin never set _isEnabled, so the rim was never compiled in). Three fixed views: the character creator's stage with the player's
   figure, a street resident in the alley, and Kai in the VR suite. For each: a screenshot, whether the rim is in the materials, and the frame cost.
     node tests/rim-light-browser.cjs [low|medium|high]   (BASE=dir serves another copy of the site, e.g. main's files; SHOTS=dir; LABEL=before|after) */
'use strict';
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const tier=['low','medium','high','ultra'].includes(process.argv[2])?process.argv[2]:'medium',label=process.env.LABEL||'run',shots=process.env.SHOTS||path.resolve(__dirname,'..','docs/development/street-lights');fs.mkdirSync(shots,{recursive:true});
const bundled=['/opt/pw-browsers/chromium','/opt/pw-browsers/chromium-1243/chrome-linux64/chrome'].find(f=>fs.existsSync(f)&&fs.statSync(f).isFile()),exe=process.env.BROWSER_EXECUTABLE||bundled||null;
const ROOT=path.resolve(process.env.BASE||path.resolve(__dirname,'..'));
function serve(){const types={'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.ogg':'audio/ogg','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.glb':'model/gltf-binary'};
 const srv=http.createServer((req,res)=>{let f;try{f=path.resolve(ROOT,'.'+decodeURIComponent(req.url.split('?')[0]));}catch{res.writeHead(400);return res.end();}if(!f.startsWith(ROOT+path.sep)){res.writeHead(403);return res.end();}
  fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);return res.end();}res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(d);});});
 return new Promise(r=>srv.listen(0,'127.0.0.1',()=>r(srv)));}
(async()=>{
 const srv=await serve(),base='http://127.0.0.1:'+srv.address().port,log=m=>console.log(new Date().toISOString().slice(11,19),m),out={tier,label};
 const b=await chromium.launch({headless:true,...(exe?{executablePath:exe}:{}),args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader','--no-sandbox','--autoplay-policy=no-user-gesture-required']});
 try{
  const page=await (await b.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1,serviceWorkers:'block',reducedMotion:'reduce'})).newPage();page.setDefaultTimeout(600000);const errs=[];page.on('pageerror',e=>errs.push(e.message));
  page.on('console',m=>{if(m.type()==='error'&&/shader|effect|compil/i.test(m.text()))errs.push('console: '+m.text().slice(0,400));});
  await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));await page.route('**/api/**',r=>r.fulfill({status:503,contentType:'application/json',body:'{}'}));
  await page.addInitScript(q=>localStorage.setItem('void-runner-graphics-v1',JSON.stringify({renderer:'babylon',quality:q,v:2,chosen:true})),tier);
  await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started);
  await page.evaluate(()=>Object.assign(VoidPreparation.limits,{scene:900000,assets:900000,optional:600000,area:900000,total:1800000,module:600000,artwork:300000}));
  const perf=()=>page.evaluate(()=>{const sc=VoidBabylon.scene,e=sc.getEngine(),gl=e._gl,t=[];let dc=0;for(let i=0;i<5;i++){const d0=e._drawCalls.current,a=performance.now();sc.render();gl.finish();t.push(performance.now()-a);dc=e._drawCalls.current-d0;}t.sort((a,b)=>a-b);
   const mats=new Set();for(const m of sc.meshes)if(m.isEnabled()&&m.material)mats.add(m.material);let rim=0,rimOn=0,comp=0,compOn=0;
   for(const m of mats){const p=m.pluginManager?.getPlugin?.('CharacterRim'),q=m.pluginManager?.getPlugin?.('CompanionRim');if(p){rim++;if(p._isEnabled)rimOn++;}if(q){comp++;if(q._isEnabled)compOn++;}}
   return {frameMs:+t[2].toFixed(1),drawCalls:dc,characterRim:rim,characterRimOn:rimOn,companionRim:comp,companionRimOn:compOn};});
  const shot=async name=>{await page.waitForTimeout(2500);await page.evaluate(()=>{document.getElementById('pd-notify')?.remove();});await page.screenshot({path:path.join(shots,name+'-'+tier+'-'+label+'.png')});out[name]=await perf();log(name+' '+JSON.stringify(out[name]));};
  // 1. The character creator: a new campaign opens it before the pod.
  await page.click('[data-action=menu-campaign]');await page.click('[data-action=menu-new]');const confirm=page.locator('[data-action=menu-new-confirm]');if(await confirm.count())await confirm.click();
  await page.waitForSelector('#character-creator.on',{timeout:300000});await page.waitForFunction(()=>!document.querySelector('[data-cc=confirm]')?.disabled&&VoidAssets.pending===0,null,{timeout:300000});await page.waitForTimeout(4000);
  await shot('rim-creator');
  // the creator's panel hidden, so the figure is seen whole
  await page.evaluate(()=>{for(const e of document.querySelectorAll('#character-creator > *:not(canvas)'))e.style.visibility='hidden';});await shot('rim-creator-bare');
  await page.evaluate(()=>{for(const e of document.querySelectorAll('#character-creator > *'))e.style.visibility='';});
  await page.locator('[data-cc=confirm]').click();await page.waitForFunction(()=>!document.querySelector('#character-creator.on'),null,{timeout:60000});
  // 2. A street resident: the smoker against the alley's north wall (ncz-alley.js), seen from across the alley.
  await page.evaluate(async()=>{const d=C.startDistrictCampaign(C.fresh());d.story.flags.podWakePending=false;state=d;walkingLocation=walker=null;mode='menu';document.getElementById('screen')?.classList.add('hidden');state.location='earth';
   await enterWalking(VoidDistrictArea.KEY.street,{silent:true,quarter:'oldtown',spawn:[104,1.7,-59]});});
  await page.waitForFunction(()=>mode==='walking'&&walkingLocation?.quarter==='oldtown'&&VoidAssets.pending===0);await page.waitForTimeout(4000);
  await page.evaluate(()=>Object.assign(walker,{x:104.3,z:-58.6,yaw:-.05,pitch:.12}));await shot('rim-street');
  // 3. Kai in the VR suite, seen from 1.7 m in front, a little to one side.
  const vr=await page.evaluate(()=>typeof VoidVR!=='undefined'&&VoidVR.launch('suite',{companion:'kai'}));
  if(vr){await page.waitForFunction(()=>VoidVR.session?.world&&VoidAssets.pending===0,null,{timeout:300000});await page.waitForTimeout(4000);
   await page.evaluate(()=>{const x=VoidVR.session.world.companions[0];x.c.mode='stay';const n=x.node,y=n.rotation.y+.45;walker.x=n.position.x+Math.sin(y)*1.7;walker.z=n.position.z+Math.cos(y)*1.7;walker.yaw=Math.atan2(n.position.x-walker.x,n.position.z-walker.z);walker.pitch=.08;});
   await shot('rim-companion');}
  out.errors=errs.slice(0,10);fs.writeFileSync(path.join(shots,'rim-'+tier+'-'+label+'.json'),JSON.stringify(out,null,1));log('errors '+errs.length+(errs.length?': '+errs.slice(0,3).join(' | '):''));
 }finally{await b.close();srv.close();}
})().catch(e=>{console.error(e);process.exit(1);});
