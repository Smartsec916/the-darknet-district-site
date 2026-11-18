/* THE MONKS in a real browser (Chromium, software GL, offline), 18 Nov 2026: Old Town (the city centre, monks rare) against the Avenue by the East Gate (many more of
   the walkers are monks, on the monk pace, in monk figures), close-ups of the three monks, the cost of the street's monks (draw calls and frame time with and without them),
   then on foot through the East Gate to the Temple: its monks, Zen Zephyr's own seated model from the entrance side (he faces away) and from the front, and his gaze
   while he speaks (npc-look.js turns his model's zz:Neck / zz:Head). Screenshots go to SHOTS (default docs/development/monks/).
     node tests/monks-browser.cjs [low|medium|high]   (own static server on a free port; BROWSER_EXECUTABLE=path) */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const tier=['low','medium','high'].includes(process.argv[2])?process.argv[2]:'medium',shots=process.env.SHOTS||path.resolve(__dirname,'..','docs/development/monks');fs.mkdirSync(shots,{recursive:true});
const bundled=['/opt/pw-browsers/chromium','/opt/pw-browsers/chromium-1243/chrome-linux64/chrome'].find(f=>fs.existsSync(f)&&fs.statSync(f).isFile()),exe=process.env.BROWSER_EXECUTABLE||bundled||null;
function serve(){const root=path.resolve(__dirname,'..'),types={'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.ogg':'audio/ogg','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.glb':'model/gltf-binary'};
 const srv=http.createServer((req,res)=>{let f;try{f=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));}catch{res.writeHead(400);return res.end();}if(!f.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);return res.end();}res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(d);});});
 return new Promise(r=>srv.listen(0,'127.0.0.1',()=>r(srv)));}
(async()=>{
 const srv=await serve(),base='http://127.0.0.1:'+srv.address().port,log=m=>console.log(new Date().toISOString().slice(11,19),m);
 const b=await chromium.launch({headless:true,...(exe?{executablePath:exe}:{}),args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader','--no-sandbox','--autoplay-policy=no-user-gesture-required']});
 try{
  const page=await (await b.newContext({viewport:{width:1280,height:720},serviceWorkers:'block'})).newPage();page.setDefaultTimeout(600000);const errs=[];page.on('pageerror',e=>errs.push(e.message));
  await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));await page.route('**/api/**',r=>r.fulfill({status:503,contentType:'application/json',body:'{}'}));
  await page.addInitScript(q=>localStorage.setItem('void-runner-graphics-v1',JSON.stringify({renderer:'babylon',quality:q,v:2,chosen:true})),tier);
  await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started);
  await page.evaluate(()=>Object.assign(VoidPreparation.limits,{scene:900000,assets:900000,optional:600000,area:900000,total:1800000,module:600000,artwork:300000}));
  const at=(x,z,yaw=0,pitch=0)=>page.evaluate(([x,z,yaw,pitch])=>{Object.assign(walker,{x,z,yaw,pitch});},[x,z,yaw,pitch]);
  const shot=async(name,wait=2500)=>{await page.waitForTimeout(wait);await page.evaluate(()=>{document.getElementById('pd-notify')?.remove();});await page.screenshot({path:path.join(shots,name+'-'+tier+'.png')});log('shot '+name);};
  const walk=async(x1,z1)=>{const t0=Date.now();for(;;){const r=await page.evaluate(([x1,z1])=>{if(mode!=='walking'||!walker)return 'wait';const dx=x1-walker.x,dz=z1-walker.z,d=Math.hypot(dx,dz);if(d<.05)return 'done';const s=Math.min(.35,d),nx=walker.x+dx/d*s,nz=walker.z+dz/d*s;if(VoidExplorer.blocked(nx,nz,walkingLocation))return 'blocked';walker.x=nx;walker.z=nz;walker.yaw=Math.atan2(dx,dz);return d<=s?'done':'moving';},[x1,z1]);
   if(r==='done')return;assert.ok(Date.now()-t0<300000,'walk to '+x1+','+z1+' stuck ('+r+')');await page.waitForTimeout(r==='moving'?60:250);}};
  const perf=()=>page.evaluate(()=>{const sc=VoidBabylon.scene,e=sc.getEngine(),gl=e._gl,t=[],d=[];for(let i=0;i<12;i++){const d0=e._drawCalls.current,a=performance.now();sc.render();gl.finish();t.push(performance.now()-a);d.push(e._drawCalls.current-d0);}t.sort((a,b)=>a-b);d.sort((a,b)=>a-b);return {drawCalls:d[6],activeMeshes:sc.getActiveMeshes().length,frameMs:+t[6].toFixed(1)};});
  // A close-up of one monk look: a copy of the figure placed in front of the camera (idle), then removed.
  const closeUp=async(look,name,x,z,yaw,dist=2.6,clip='idle')=>{await page.evaluate(([look,x,z,yaw,dist,clip])=>{const B=BABYLON,sc=VoidBabylon.scene,id='crowd:'+look,parent=sc.getTransformNodeByName('district-root')||sc.getTransformNodeByName('temple')||null;
    const n=VoidAssets.instance(id,parent||new B.TransformNode('cu-holder',sc));n.position.set(x+Math.sin(yaw)*dist,0,z+Math.cos(yaw)*dist);n.rotation.y=yaw+Math.PI;VoidCrowd.animate(n,look,clip);window.__cu=n;Object.assign(walker,{x,z,yaw,pitch:-.12});},[look,x,z,yaw,dist,clip]);
   await shot(name,3000);await page.evaluate(()=>{window.__cu?.dispose();window.__cu=null;});};
  const street=async(quarter,spawn)=>{await page.evaluate(async([quarter,spawn])=>{const d=C.startDistrictCampaign(C.fresh());d.story.flags.podWakePending=false;d.credits=100;state=d;walkingLocation=walker=null;mode='menu';document.getElementById('screen')?.classList.add('hidden');state.location='earth';
    await enterWalking(VoidDistrictArea.KEY.street,{silent:true,quarter,spawn});},[quarter,spawn]);
   await page.waitForFunction(q=>mode==='walking'&&walkingLocation?.quarter===q&&VoidAssets.pending===0,quarter);
   await page.waitForFunction(()=>{const N=VoidBabylon.district?.nightlife;return N&&N.people.filter(p=>!p.fixed).every(p=>p.node);},null,{timeout:240000,polling:1000});await page.waitForTimeout(3000);
   return page.evaluate(()=>{const N=VoidBabylon.district.nightlife,w=N.people.filter(p=>!p.fixed);return {walkers:w.length,monks:w.filter(p=>p.monkPlan).length,monkFigures:w.filter(p=>p.monkPlan&&p.node&&/^npc-monk-/.test(p.look)).length,tagged:w.filter(p=>p.monkPlan&&VoidNPCDevice._agent?.(p.node)?.monk!==false).length,looks:[...new Set(w.filter(p=>p.monkPlan).map(p=>p.look))],stats:N.stats(),
    monkPos:w.filter(p=>p.monkPlan).map(p=>[+p.node.position.x.toFixed(1),+p.node.position.z.toFixed(1)])};});};
  // 1. Old Town, the city centre: monks are rare
  const old=await street('oldtown',[61,1.7,-70]);log('old town '+JSON.stringify(old));await at(61,-70,Math.PI,-.04);await shot('01-old-town-centre');
  // 2. the Avenue toward the East Gate: many more of the walkers are monks; they walk slowly and are tagged monks (no V1, never film)
  const ave=await street('avenue',[100,1.7,-12]);log('avenue '+JSON.stringify(ave));
  assert.ok(ave.monks/ave.walkers>old.monks/Math.max(1,old.walkers),'more monks toward the Temple');assert.equal(ave.monkFigures,ave.monks,'every street monk wears a monk figure');assert.ok(ave.monkPos.every(p=>p.every(Number.isFinite)),'every monk stands somewhere real');
  const slow=await page.evaluate(()=>{const N=VoidBabylon.district.nightlife;return N.people.filter(p=>p.monk&&p.node).map(p=>+p.speed.toFixed(3));});log('monk speeds '+JSON.stringify(slow));const pace=await page.evaluate(()=>VoidNightlife.monkSpeed());assert.ok(slow.length&&slow.every(s=>Math.abs(s-pace)<1e-3),'monks walk at the monk pace');
  await at(128,-12.5,-Math.PI/2,-.03);await shot('02-avenue-toward-city-from-east-gate');await at(110,-12.5,Math.PI/2,-.03);await shot('03-avenue-toward-east-gate');
  const withMonks=await perf();await page.evaluate(()=>{for(const p of VoidBabylon.district.nightlife.people)if(p.monkPlan&&p.node)p.node.setEnabled(false);});const withoutMonks=await perf();await page.evaluate(()=>{for(const p of VoidBabylon.district.nightlife.people)if(p.monkPlan&&p.node&&!p.hidden&&!p.away)p.node.setEnabled(true);});
  log('avenue perf with monks '+JSON.stringify(withMonks)+' without '+JSON.stringify(withoutMonks));
  // 3. close-ups of the three monks (the street's light, on the Avenue)
  for(const [i,look] of ['npc-monk-elder','npc-monk-tech','npc-monk-grey'].entries())await closeUp(look,'0'+(4+i)+'-close-'+look.slice(4),122,-6.6-0,Math.PI,2.4);
  // 4. through the East Gate on foot, to the Temple
  await at(138,-6.8,Math.PI/2,0);await walk(144,-6.8);await walk(148,-6.8);await page.waitForFunction(()=>walkingLocation?.id==='temple'&&mode==='walking'&&!VoidGateTransit.busy,null,{timeout:600000});
  await page.waitForFunction(()=>VoidAssets.pending===0);
  await page.waitForFunction(()=>{const z=VoidBabylon.zone;return z?.zen?.().model&&z.monks().every(m=>m.shown);},null,{timeout:240000,polling:1000});await page.waitForTimeout(3000);
  const temple=await page.evaluate(()=>({zen:VoidBabylon.zone.zen(),monks:VoidBabylon.zone.monks(),primitive:VoidBabylon.scene.meshes.filter(m=>/^mk-/.test(m.name)&&!m.isDisposed()).length,head:VoidBabylon.scene.transformNodes.filter(n=>/zz:(Head|Neck)$/.test(n.name)).map(n=>n.name)}));log('temple '+JSON.stringify(temple));
  assert.equal(temple.zen.model,true);assert.equal(temple.zen.head,true);assert.equal(temple.primitive,0,'the primitive figure is gone');assert.equal(temple.monks.length,{low:2,medium:5,high:7}[tier]);
  await at(0,-38,0,-.02);await shot('07-temple-arrival');await at(-2,-24,.35,-.03);await shot('08-temple-courtyard-monks');
  await at(0,-3,0,-.02);await shot('09-temple-hall-entrance-zen-from-behind');await at(0,15,0,.02);await shot('10-zen-zephyr-from-the-entrance-side');
  await at(0,29,Math.PI,-.12);await shot('11-zen-zephyr-front');await at(-1.2,25.4,Math.PI-.25,-.22);await shot('12-zen-zephyr-front-close');
  await at(-12,9,.7,-.05);await shot('13-temple-monks-at-altars');await at(12,20,-1.9,-.05);await shot('14-temple-monk-aisle');
  const tperf=await perf();log('temple perf (dais view) '+JSON.stringify(tperf));
  // 5. his gaze: talk to him (the prompt is on the entrance side; he sits facing away, so his head and a little of his body turn toward the player)
  await at(0,16.2,0,.05);await page.evaluate(()=>{try{VoidAudio.unlock?.();}catch{}VoidInteractions.handlers.get('temple-monk')({item:{}});});
  await page.waitForFunction(()=>VoidNPCLook.current?.character==='zen-zephyr'&&VoidNPCLook.current.weight>.8,null,{timeout:30000});const look=await page.evaluate(()=>VoidNPCLook.current);log('gaze '+JSON.stringify(look));
  await at(1.5,16.6,-.15,.06);await shot('15-zen-zephyr-turns-to-speak',1500);
  assert.deepEqual(errs,[]);console.log(JSON.stringify({ok:true,tier,old,avenue:ave,perf:{avenue:{withMonks,withoutMonks},temple:tperf},gaze:look}));
 }finally{await b.close();srv.close();}
})().catch(e=>{console.error(String(e.stack||e).slice(0,1500));process.exit(1);});
