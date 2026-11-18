/* THE AVENUE'S STREET PAIR in a real browser (Chromium, software GL, offline): Reverie on shift (forced UTC 06:30) with the cat beside her, Lace on shift (UTC 15:30)
   walking with the cat at her heel and sitting on a ledge with the cat sitting by her, the handover (nobody out), and the cat coming to the player.
     node tests/street-pair-browser.cjs [low|medium|high]   (SHOTS=dir; own static server on a free port) */
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
  // ---- Reverie (UTC 06:30) ----
  await force(6);await page.waitForFunction(()=>{const s=VoidBabylon.district.streetPair.stats();return s.her?.id==='grey-reverie'&&s.cat;},null,{timeout:300000,polling:1000});
  assert.ok(await until(()=>{const s=VoidBabylon.district.streetPair.stats();return Math.hypot(s.cat.x-s.her.x,s.cat.z-s.her.z)<1&&s.cat.sit>.9;}),'the cat sits by Reverie');
  log('reverie '+JSON.stringify(await SP()));
  await at(104.4,-9.8,0,.16);await shot('reverie-street',2500,true);
  await at(103.1,-7.9,Math.atan2(1.1,2.3),.36);await shot('reverie-cat',1500,true);
  // ---- Lace (UTC 15:30): walking, the cat at her heel ----
  await force(15);await page.waitForFunction(()=>VoidBabylon.district.streetPair.stats().her?.id==='ethereal-lace',null,{timeout:300000,polling:1000});
  assert.equal((await SP()).her.clip,'walk');
  await until(()=>{const s=VoidBabylon.district.streetPair.stats();return s.her.mode==='walk'&&Math.hypot(s.cat.x-s.her.x,s.cat.z-s.her.z)<1.2;},200);
  {const s=await SP();log('lace walking '+JSON.stringify(s));const cx=s.her.x+(s.cat.x<s.her.x?-3.2:3.2);await at(cx,-9.8,Math.atan2(s.her.x-cx,s.her.z+9.8),.14);await shot('lace-walking-cat',1500,true);}
  // ---- she sits on a ledge, the cat sits by her ----
  await page.evaluate(()=>{const h=VoidBabylon.district.streetPair.her;if(h.s.mode==='walk')h.s.left=.05;});
  assert.ok(await until(()=>VoidBabylon.district.streetPair.stats().her.mode==='sit',400),'Lace sits');
  assert.ok(await until(()=>{const s=VoidBabylon.district.streetPair.stats();return Math.hypot(s.cat.x-s.her.x,s.cat.z-s.her.z)<1.2&&s.cat.sit>.9;},300),'the cat sits by Lace');
  {const s=await SP();log('lace sitting '+JSON.stringify(s));await at(s.her.x-.6,-9.6,.12,.17);await shot('lace-sitting-cat',2000,true);await at(s.her.x+2.2,-8.2,Math.atan2(-2.2,2.8),.25);await shot('lace-sitting-cat-side',1500,true);}
  {const p=await perf();log('perf (both on the street, the cat posed) '+JSON.stringify(p));}
  // ---- handover (UTC 12:00:20): nobody is out; the cat goes home ----
  await force(12,0,20);await ff(1);
  {const s=await SP();log('handover '+JSON.stringify(s));assert.equal(s.her,null);assert.equal(s.onStreet,null);assert.ok(await until(()=>VoidBabylon.district.streetPair.stats().cat.mode==='home',10));}
  // ---- the player walks up to the cat: now and then it comes to them ----
  {let came=false;for(let k=0;k<6&&!came;k++){await page.evaluate(()=>{const c=VoidBabylon.district.streetPair.cat;c.until=0;c.lastNear=false;Object.assign(walker,{x:c.x+1.6,z:c.z-1.8});});await ff(.2);came=await until(()=>VoidBabylon.district.streetPair.stats().cat.mode==='player',40);if(!came){await page.evaluate(()=>Object.assign(walker,{x:100,z:-14}));await ff(.2);}}
   log('cat to player: '+came);if(came){const s=await SP();await at(await page.evaluate(()=>walker.x),await page.evaluate(()=>walker.z),await page.evaluate(()=>{const c=VoidBabylon.district.streetPair.cat;return Math.atan2(c.x-walker.x,c.z-walker.z);}),.55);await shot('cat-player',1500,true);}}
  const real=errs.filter(e=>!/cache\.js/.test(e));   /* cache.js's 15-minute service-worker update tick throws when the test blocks service workers (a run over 15 minutes) */
  log('errors '+JSON.stringify(real.slice(0,5)));assert.equal(real.length,0,'page errors');
 }finally{await b.close();srv.close();}
})().catch(e=>{console.error(e);process.exit(1);});
