/* A giver is never moved in or out of the player's view (the owner, 19 Nov 2026, about a denied offer: she goes about her own routine meanwhile, "never offer again" sends
   her back to it; never teleport while on screen). ncz-street-pair.js holdCheck: on The Avenue, with Reverie or Lace out and the camera looking at her, her plan changes to a
   spot in another area (what a "Giver waits at" spot elsewhere, or its end, does): she is HELD (still here, same figure); the camera turns away: she goes. A spot on her own
   pavement she can walk to: she walks there (never held). Offline, Chromium software GL.
     node tests/giver-hold-browser.cjs   (BROWSER_EXECUTABLE; own static server on a free port) */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const bundled=['/opt/pw-browsers/chromium','/opt/pw-browsers/chromium-1243/chrome-linux64/chrome'].find(f=>fs.existsSync(f)&&fs.statSync(f).isFile()),exe=process.env.BROWSER_EXECUTABLE||bundled||null;
function serve(){const root=path.resolve(__dirname,'..'),types={'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.glb':'model/gltf-binary'};
 const srv=http.createServer((req,res)=>{let f;try{f=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));}catch{res.writeHead(400);return res.end();}if(!f.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);return res.end();}res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(d);});});
 return new Promise(r=>srv.listen(0,'127.0.0.1',()=>r(srv)));}
(async()=>{
 const srv=await serve(),base='http://127.0.0.1:'+srv.address().port,log=m=>console.log('[giver-hold]',m);
 const b=await chromium.launch({headless:true,...(exe?{executablePath:exe}:{}),args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader','--no-sandbox']});
 try{
  const page=await (await b.newContext({viewport:{width:1280,height:720},serviceWorkers:'block'})).newPage();page.setDefaultTimeout(600000);const errs=[];page.on('pageerror',e=>errs.push(e.message));
  await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));await page.route('**/api/**',r=>r.fulfill({status:503,contentType:'application/json',body:'{}'}));
  await page.addInitScript(()=>localStorage.setItem('void-runner-graphics-v1',JSON.stringify({renderer:'babylon',quality:'low',v:2,chosen:true})));
  await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started);
  await page.evaluate(()=>Object.assign(VoidPreparation.limits,{scene:900000,assets:900000,optional:600000,area:900000,total:1800000,module:600000,artwork:300000}));
  await page.evaluate(async()=>{const d=C.startDistrictCampaign(C.fresh());d.story.flags.podWakePending=false;state=d;walkingLocation=walker=null;mode='menu';document.getElementById('screen')?.classList.add('hidden');state.location='earth';
   await enterWalking(VoidDistrictArea.KEY.street,{silent:true,quarter:'avenue',spawn:[100,1.7,-14]});});
  await page.waitForFunction(()=>mode==='walking'&&walkingLocation?.quarter==='avenue'&&VoidAssets.pending===0);
  const SP=()=>page.evaluate(()=>VoidBabylon.district.streetPair.stats());
  await page.evaluate(()=>{const base=Date.UTC(2026,10,18,15,30,0),t0=Date.now();VoidBabylon.district.streetPair.setClock(()=>base+(Date.now()-t0));});
  await page.waitForFunction(()=>!!VoidBabylon.district.streetPair.stats().her,null,{timeout:300000,polling:1000});
  const ff=n=>page.evaluate(n=>{const sp=VoidBabylon.district.streetPair;for(let i=0;i<n;i++)sp.tick(.05);},n);
  // the player stands 4 m in front of her, looking at her
  const look=async away=>{await page.evaluate(away=>{const n=VoidBabylon.district.streetPair.her.node.position,x=n.x,z=n.z-4;Object.assign(walker,{x,z,yaw:away?Math.PI:0,pitch:0});},away);await page.waitForTimeout(2500);};
  await page.evaluate(()=>{const h=VoidBabylon.district.streetPair.her;Object.assign(h.s,{mode:'stop',left:999,clip:'idle',device:null,sub:'test'});});
  await look(false);let s=await SP();const id=s.her.id;log('out: '+id+' at '+JSON.stringify(s.her));
  const node0=await page.evaluate(()=>VoidBabylon.district.streetPair.her.node.uniqueId);
  // a plan in another area (Old Town) while she is in view: held
  await page.evaluate(id=>{const P={key:'test-far',mode:'stay',x:-60,z:-40,yaw:0,actions:['idle'],area:'oldtown'};VoidStreetPair.planFor=x=>x===id?P:null;},id);
  await ff(4);s=await SP();log('in view: '+JSON.stringify({held:s.held,her:!!s.her}));
  assert.deepEqual(s.held,[id],'held while the player looks at her');assert.ok(s.her,'still here');assert.equal(await page.evaluate(()=>VoidBabylon.district.streetPair.her.node.uniqueId),node0,'the same figure, not moved away');
  // the player turns round: she goes (unseen)
  await look(true);await ff(4);s=await SP();log('looked away: '+JSON.stringify({held:s.held,her:!!s.her}));assert.deepEqual(s.held,[],'released once unseen');assert.equal(s.her,null,'gone to the other area out of sight');
  // back to her own routine (the plan ends): she comes back to the Avenue
  await page.evaluate(()=>{VoidStreetPair.planFor=()=>null;});await ff(10);await page.waitForFunction(()=>!!VoidBabylon.district.streetPair.stats().her,null,{timeout:60000,polling:500});
  // a spot on her own pavement that she can walk to: never held
  await page.evaluate(()=>{const h=VoidBabylon.district.streetPair.her;Object.assign(h.s,{mode:'stop',left:999,clip:'idle',device:null,sub:'test'});});await look(false);
  const near=await page.evaluate(id=>{const n=VoidBabylon.district.streetPair.her.node.position,P={key:'test-near',mode:'stay',x:+(n.x+1.5).toFixed(1),z:+n.z.toFixed(1),yaw:0,actions:['idle']};VoidStreetPair.planFor=x=>x===id?P:null;return P;},id);
  await ff(4);s=await SP();log('walkable spot: '+JSON.stringify({held:s.held,her:s.her&&s.her.mode}));assert.deepEqual(s.held,[]);assert.ok(s.her,'she stays and walks');
  assert.deepEqual(errs,[]);log('PASS');
 }finally{await b.close();srv.close();}
})().catch(e=>{console.error(String(e).slice(0,600));process.exit(1);});
