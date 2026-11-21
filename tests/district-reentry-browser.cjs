/* The District's staff after leaving and coming back (the owner, 18 Nov 2026: "After going the camera mission I returned to The Darknet District. Iris and the bartender are both
   block NPCs, Admin is the old model now"). Enters the District interior, checks Admin, Iris and Nyx are drawn from their own models, goes out to the street (Old Town, where NULL is),
   comes back in and checks again; screenshots of the three after re-entry.
   Usage: node tests/district-reentry-browser.cjs   (own static server on a free port; SHOTS=dir; BROWSER_EXECUTABLE=path; QUALITY=low|medium|high) */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const shots=process.env.SHOTS||path.resolve(__dirname,'..','docs/development/district-reentry');fs.mkdirSync(shots,{recursive:true});
const bundled=['/opt/pw-browsers/chromium','/opt/pw-browsers/chromium-1243/chrome-linux64/chrome'].find(f=>fs.existsSync(f)&&fs.statSync(f).isFile()),exe=process.env.BROWSER_EXECUTABLE||bundled||null;
const quality=process.env.QUALITY||'low',W=1366,H=768;
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
  page.on('console',m=>{const t=m.text();if(/stand-in|not available|failed|District\]/i.test(t))log('console: '+t.slice(0,300));});
  await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));await page.route('**/api/**',r=>r.fulfill({status:503,contentType:'application/json',body:'{}'}));
  await page.addInitScript(q=>{localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:q,v:2,chosen:true}));},quality);
  await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started);
  await page.evaluate(()=>Object.assign(VoidPreparation.limits,{scene:600000,assets:600000,optional:300000,total:1200000,module:600000,artwork:300000}));
  // Which model each of the three is drawn from: their own file (crowd:npc-*), the creator look (character:*), or the plain stand-in (anything else).
  // (several nodes may share the name: Nyx's plain stand-in figure is named like her holder; only enabled meshes count)
  const who=()=>page.evaluate(()=>{const out={};for(const [id,name] of [['admin','npc-admin'],['iris','npc-iris'],['nyx','npc-nyx-district']]){const nodes=VoidBabylon.scene.transformNodes.filter(n=>n.name===name);
    const shown=nodes.flatMap(h=>h.getChildMeshes(false).filter(m=>m.isEnabled()&&m.isVisible&&m.getTotalVertices()>0)),names=shown.map(m=>m.name);
    out[id]=names.some(n=>/^crowd:npc-/.test(n))?'own':nodes.some(h=>h.getChildren().some(c=>/^character:/.test(c.name)&&c.isEnabled()))?'look':names.length?'stand-in':'nothing';out[id+'Meshes']=names.length;}return out;});
  const ready=()=>page.waitForFunction(()=>['npc-admin','npc-iris','npc-nyx-district'].every(n=>VoidBabylon.scene.transformNodes.some(h=>h.name===n&&h.getChildMeshes(false).some(m=>/^crowd:npc-/.test(m.name)&&m.isEnabled()))),null,{timeout:120000}).catch(()=>log('not all own models after 120 s'));
  const settle=async()=>{await page.waitForFunction(()=>VoidAssets.pending===0,null,{timeout:400000});await page.waitForTimeout(6000);};
  const enter=async(area,quarter)=>{await page.evaluate(async([area,quarter])=>{await enterWalking(VoidDistrictArea.KEY[area],{silent:true,...(quarter?{quarter}:{})});},[area,quarter]);await page.waitForFunction(a=>mode==='walking'&&walkingLocation?.area===a,area);};
  log('interior, first visit');
  await page.evaluate(async()=>{const d=C.startDistrictCampaign(C.fresh());d.story.flags.podWakePending=false;state=d;walkingLocation=walker=null;mode='menu';document.getElementById('screen')?.classList.add('hidden');state.location='earth';});
  await enter('interior');await settle();
  // wait until each of them shows their own model (the retries run every 5 s or more)
  await ready();
  const first=await who();log('first visit '+JSON.stringify(first));
  if(process.env.FIRST_ONLY)process.exit(0);
  log('street (Old Town, NULL), then back in');
  await enter('street','oldtown');await settle();
  await enter('interior');await settle();
  await ready();
  const again=await who();log('after re-entry '+JSON.stringify(again));
  await page.evaluate(()=>{for(const id of ['pd-notify'])document.getElementById(id)?.remove();});
  // the camera d metres in front of a figure (along the way its holder faces), at standing eye height, looking at it
  const look=async(names,d,name)=>{await page.evaluate(([names,d])=>{const B=BABYLON,hs=names.map(n=>VoidBabylon.scene.transformNodes.find(h=>h.name===n&&h.getChildMeshes(false).some(m=>/^crowd:npc-/.test(m.name)))||VoidBabylon.scene.getTransformNodeByName(n));
    const p=hs.reduce((a,h)=>a.addInPlace(h.getAbsolutePosition().scale(1/hs.length)),B.Vector3.Zero()),f=B.Vector3.TransformNormal(B.Axis.Z,hs[0].getWorldMatrix());f.y=0;f.normalize();
    Object.assign(walker,{x:p.x+f.x*d,z:p.z+f.z*d});walker.yaw=Math.atan2(p.x-walker.x,p.z-walker.z);walker.pitch=-.12;},[names,d]);await page.waitForTimeout(3000);await page.screenshot({path:path.join(shots,name+'.png')});log('shot '+name);};
  await look(['npc-admin','npc-iris'],3.4,'reentry-admin-iris');
  await look(['npc-nyx-district'],2.4,'reentry-nyx');
  for(const k of ['admin','iris','nyx'])assert.equal(again[k],'own',k+' is drawn from their own model after coming back in');
  assert.deepEqual(errors,[],'no page errors');
  log('PASS');
 }finally{await browser.close();srv.close();}
})().catch(e=>{console.error(e);process.exit(1);});
