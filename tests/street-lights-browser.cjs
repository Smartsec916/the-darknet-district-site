/* STREET LIGHTS in a real browser (Chromium, software GL, offline): the dark stretches of every NeoChinatown quarter from fixed viewpoints, with each quarter's draw
   calls, active meshes, lights and frame time (docs/development/AI_HANDOFF.md, street lights, 18 Nov 2026). Before/after: run it on main's files (BASE=dir) and on this branch.
     node tests/street-lights-browser.cjs [low|medium|high]   (SHOTS=dir; QUARTERS=oldtown,avenue,...; own static server on a free port; LABEL=before|after) */
'use strict';
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const tier=['low','medium','high','ultra'].includes(process.argv[2])?process.argv[2]:'medium',label=process.env.LABEL||'run',shots=process.env.SHOTS||path.resolve(__dirname,'..','docs/development/street-lights');fs.mkdirSync(shots,{recursive:true});
const bundled=['/opt/pw-browsers/chromium','/opt/pw-browsers/chromium-1243/chrome-linux64/chrome'].find(f=>fs.existsSync(f)&&fs.statSync(f).isFile()),exe=process.env.BROWSER_EXECUTABLE||bundled||null;
const ROOT=path.resolve(process.env.BASE||path.resolve(__dirname,'..'));
function serve(){const types={'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.ogg':'audio/ogg','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.glb':'model/gltf-binary'};
 const srv=http.createServer((req,res)=>{let f;try{f=path.resolve(ROOT,'.'+decodeURIComponent(req.url.split('?')[0]));}catch{res.writeHead(400);return res.end();}if(!f.startsWith(ROOT+path.sep)){res.writeHead(403);return res.end();}
  fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);return res.end();}res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(d);});});
 return new Promise(r=>srv.listen(0,'127.0.0.1',()=>r(srv)));}
// [name, x, z, yaw (0 = north, +z), pitch (positive looks down)]. Eye height is the walker's own.
const N=0,E=Math.PI/2,S=Math.PI,W=-Math.PI/2;
const VIEWS={
 oldtown:{spawn:[61,1.7,-80],views:[['main-north',61,-118,N,.05],['main-south',61,-32,S,.05],['main-west-gap',66,-58,W+.35,.12],['main-east-gap',56,-104,E-.35,.12],['alley',74,-59,E,.08]]},
 avenue:{spawn:[69.2,1.7,-16.6],views:[['pavement-laundry',86,-12,E-.75,.12],['avenue-east',80,-12.5,E,.05],['avenue-west',120,-12.5,W,.05],['avenue-south-side',118,-8,S+.3,.14],['avenue-far-west',40,-12.5,W,.05]]},
 'far-south':{spawn:[61,1.7,-140],views:[['farsouth-south',61,-136,S,.05],['farsouth-north',61,-214,N,.05],['farsouth-west-gap',66,-183,W+.3,.12],['farsouth-east-gap',56,-166,E-.3,.12]]},
 outskirts:{spawn:[61,1.7,-229],views:[['outskirts-plaza',61,-228,S,.1],['outskirts-west',58,-245,W,.08],['outskirts-east',64,-245,E,.08],['outskirts-west-lane',35,-245,W,.08],['outskirts-east-lane',93,-244,E,.08],['outskirts-back',61,-256,N,.1]]}};
const pick=(process.env.QUARTERS||Object.keys(VIEWS).join(',')).split(',');
const only=process.env.ONLY?new Set(process.env.ONLY.split(',')):null;   // ONLY=view,view: just those views
(async()=>{
 const srv=await serve(),base='http://127.0.0.1:'+srv.address().port,log=m=>console.log(new Date().toISOString().slice(11,19),m),out={tier,label,quarters:{}};
 const b=await chromium.launch({headless:true,...(exe?{executablePath:exe}:{}),args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader','--no-sandbox','--autoplay-policy=no-user-gesture-required']});
 try{
  const page=await (await b.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1,serviceWorkers:'block'})).newPage();page.setDefaultTimeout(600000);const errs=[];page.on('pageerror',e=>{errs.push(e.message);console.log('PAGEERROR',e.message,String(e.stack||'').split('\n').slice(1,3).join(' | '));});
  await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));await page.route('**/api/**',r=>r.fulfill({status:503,contentType:'application/json',body:'{}'}));
  await page.addInitScript(q=>localStorage.setItem('void-runner-graphics-v1',JSON.stringify({renderer:'babylon',quality:q,v:2,chosen:true})),tier);
  await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started);
  await page.evaluate(()=>Object.assign(VoidPreparation.limits,{scene:900000,assets:900000,optional:600000,area:900000,total:1800000,module:600000,artwork:300000}));
  const at=(x,z,yaw=0,pitch=0)=>page.evaluate(([x,z,yaw,pitch])=>{Object.assign(walker,{x,z,yaw,pitch});},[x,z,yaw,pitch]);
  const perf=()=>page.evaluate(()=>{const sc=VoidBabylon.scene,e=sc.getEngine(),gl=e._gl,t=[],d=[];for(let i=0;i<5;i++){const d0=e._drawCalls.current,a=performance.now();sc.render();gl.finish();t.push(performance.now()-a);d.push(e._drawCalls.current-d0);}t.sort((a,b)=>a-b);d.sort((a,b)=>a-b);
   const g=VoidBabylon.district?.streetGlow,res={};if(g){for(const m of g.meshes)m.setEnabled(false);const t2=[],d2=[];for(let i=0;i<5;i++){const d0=e._drawCalls.current,a=performance.now();sc.render();gl.finish();t2.push(performance.now()-a);d2.push(e._drawCalls.current-d0);}for(const m of g.meshes)m.setEnabled(true);t2.sort((a,b)=>a-b);d2.sort((a,b)=>a-b);res.withoutGlow={drawCalls:d2[2],frameMs:+t2[2].toFixed(1)};}
   return {...res,drawCalls:d[2],activeMeshes:sc.getActiveMeshes().length,frameMs:+t[2].toFixed(1),lights:sc.lights.filter(l=>l.isEnabled()).length,meshes:sc.meshes.length,materials:sc.materials.length};});
  const street=async(quarter,spawn)=>{await page.evaluate(async([quarter,spawn])=>{const d=C.startDistrictCampaign(C.fresh());d.story.flags.podWakePending=false;d.credits=100;state=d;walkingLocation=walker=null;mode='menu';document.getElementById('screen')?.classList.add('hidden');state.location='earth';
    await enterWalking(VoidDistrictArea.KEY.street,{silent:true,quarter,spawn});},[quarter,spawn]);
   const probe=setInterval(()=>page.evaluate(()=>JSON.stringify({mode,quarter:walkingLocation?.quarter,pending:VoidAssets.pending,ids:VoidAssets.pendingIds?.()||null})).then(t=>log('waiting '+t)).catch(()=>{}),30000);
   try{await page.waitForFunction(q=>mode==='walking'&&walkingLocation?.quarter===q&&VoidAssets.pending===0,quarter);}finally{clearInterval(probe);}await page.waitForTimeout(3000);};
  for(const q of pick){const Q=VIEWS[q];if(!Q||only&&!Q.views.some(v=>only.has(v[0])))continue;log('quarter '+q);await street(q,Q.spawn);const rec={views:{}};
   for(const [name,x,z,yaw,pitch] of Q.views.filter(v=>!only||only.has(v[0]))){await at(x,z,yaw,pitch);await page.waitForTimeout(2500);await page.evaluate(()=>{document.getElementById('pd-notify')?.remove();const s=document.getElementById('screen');if(s)s.style.visibility='hidden';});
    const file=path.join(shots,name+'-'+tier+'-'+label+'.png');await page.screenshot({path:file});rec.views[name]=await perf();log(name+' '+JSON.stringify(rec.views[name]));}
   rec.glow=await page.evaluate(()=>VoidBabylon.district?.streetGlow?.stats?.()||null);out.quarters[q]=rec;}
  out.errors=errs.slice(0,10);fs.writeFileSync(path.join(shots,'perf-'+tier+'-'+label+'.json'),JSON.stringify(out,null,1));log('errors '+errs.length+(errs.length?': '+errs.slice(0,3).join(' | '):''));
 }finally{await b.close();srv.close();}
})().catch(e=>{console.error(e);process.exit(1);});
