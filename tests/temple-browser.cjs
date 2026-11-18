/* ZEN ZEPHYR TEMPLE in a real browser (Chromium, software GL, offline). Rewritten 18 Nov 2026 (build 2026-11-18-temple-1): the sky cab is gone, so this walks the way
   players do now: the Avenue, the East Gate's walkers' lane (checkpoint scan), the Temple. Then: the arrival, the courtyard, the chamber, the dais and Zen Zephyr, the
   typed conversation (local quotes), the floor's sound (soft stone steps), the hall's lights and floor mirror per quality tier, the area's V1 map, performance
   (draw calls and the frame's cost, measured), and the walk back through the gate. Screenshots go to SHOTS (default docs/development/temple/).
     node tests/temple-browser.cjs [low|medium|high]   (own static server on a free port; BROWSER_EXECUTABLE=path) */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const tier=['low','medium','high'].includes(process.argv[2])?process.argv[2]:'medium',shots=process.env.SHOTS||path.resolve(__dirname,'..','docs/development/temple');fs.mkdirSync(shots,{recursive:true});
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
 await page.evaluate(async()=>{const d=C.startDistrictCampaign(C.fresh());d.story.flags.podWakePending=false;d.credits=100;state=d;walkingLocation=walker=null;mode='menu';document.getElementById('screen')?.classList.add('hidden');state.location='earth';
  await enterWalking(VoidDistrictArea.KEY.street,{silent:true,quarter:'avenue',spawn:[138,1.7,-6.8]});});
 await page.waitForFunction(()=>mode==='walking'&&walkingLocation?.quarter==='avenue'&&VoidAssets.pending===0);await page.waitForTimeout(3000);
 const at=(x,z,yaw=0,pitch=0)=>page.evaluate(([x,z,yaw,pitch])=>{Object.assign(walker,{x,z,yaw,pitch});},[x,z,yaw,pitch]);
 const shot=async(name,wait=2500)=>{await page.waitForTimeout(wait);await page.evaluate(()=>document.getElementById('pd-notify')?.remove());await page.screenshot({path:path.join(shots,name+'-'+tier+'.png')});log('shot '+name);};
 const walk=async(x1,z1)=>{const t0=Date.now();for(;;){const r=await page.evaluate(([x1,z1])=>{if(mode!=='walking'||!walker)return 'wait';const dx=x1-walker.x,dz=z1-walker.z,d=Math.hypot(dx,dz);if(d<.05)return 'done';const s=Math.min(.35,d),nx=walker.x+dx/d*s,nz=walker.z+dz/d*s;if(VoidExplorer.blocked(nx,nz,walkingLocation))return 'blocked';walker.x=nx;walker.z=nz;walker.yaw=Math.atan2(dx,dz);return d<=s?'done':'moving';},[x1,z1]);
  if(r==='done')return;assert.ok(Date.now()-t0<300000,'walk to '+x1+','+z1+' stuck ('+r+')');await page.waitForTimeout(r==='moving'?60:250);}};
 const NORTH=0,EAST=Math.PI/2,WEST=-Math.PI/2;
 // 1. the East Gate from the Avenue: the walkers' lane is whole (its corner pylon stands beside it, not over it)
 const py=await page.evaluate(()=>{const g=VoidQuarters.gate('east'),foot=g.lanes.find(l=>l.kind==='foot');return {py:VoidQuarters.pylons(g),foot:foot.v};});
 for(const [a,c] of py.py)assert.ok(c<=py.foot[0]||a>=py.foot[1],'no pylon over the walkers\' lane: '+JSON.stringify(py));
 await at(128,-12,EAST,-.05);await shot('01-east-gate-avenue');await at(138,-6.8,EAST,-.05);await shot('02-east-gate-walkers-lane');
 // 2. through the lane: the checkpoint scans and the Temple replaces the Avenue
 await walk(144,-6.8);await walk(148,-6.8);await page.waitForFunction(()=>VoidGateTransit.busy||walkingLocation?.id==='temple',null,{timeout:60000});await page.waitForFunction(()=>walkingLocation?.id==='temple'&&mode==='walking'&&!VoidGateTransit.busy,null,{timeout:600000});
 await page.waitForFunction(()=>VoidAssets.pending===0);await page.waitForTimeout(3000);
 const arr=await page.evaluate(()=>({pos:[walker.x,walker.z],hasNcz:VoidBabylon.scene.meshes.some(m=>/^ncz|district-root|^milked|^corp/.test(m.name)),zone:!!VoidBabylon.zone?.monk,lights:VoidBabylon.scene.lights.filter(l=>l.isEnabled()).map(l=>l.name),own:VoidBabylon.zone.lights(),mirrored:VoidBabylon.zone.mirrored()}));
 log('arrival '+JSON.stringify(arr));assert.ok(Math.abs(arr.pos[0])<2&&Math.abs(arr.pos[1]+38)<2,'arrived at the hilltop stop: '+arr.pos);assert.equal(arr.hasNcz,false,'the city is not loaded here');assert.equal(arr.zone,true);
 assert.ok(arr.lights.length<=12,'scene lights within budget: '+arr.lights);assert.equal(arr.own.length,tier==='low'?0:tier==='high'?5:3,'the hall\'s own lights for '+tier);assert.ok(tier==='low'?arr.mirrored===0:arr.mirrored>20,'the floor mirror on Medium and up');
 // 3. the place
 await at(0,-38,NORTH,-.02);await shot('03-temple-arrival');await at(0,-16,NORTH,-.04);await shot('04-temple-entrance');await at(0,-3,NORTH,0);await shot('05-temple-hall-wide');
 await at(-14,-3,.55,-.05);await shot('06-temple-hall-corner');await at(12,17,WEST,.05);await shot('07-temple-hall-across');await at(0,14.2,NORTH,-.12);await shot('08-temple-dais-zen-zephyr');
 // performance: the hall's draw calls and the frame's cost (software GL: relative numbers only)
 const perf=await page.evaluate(()=>{const sc=VoidBabylon.scene,e=sc.getEngine(),gl=e._gl,t=[],d=[];for(let i=0;i<14;i++){const d0=e._drawCalls.current,a=performance.now();sc.render();gl.finish();t.push(performance.now()-a);d.push(e._drawCalls.current-d0);}t.sort((a,b)=>a-b);d.sort((a,b)=>a-b);
  return {drawCalls:d[7],activeMeshes:sc.getActiveMeshes().length,meshes:sc.meshes.length,materials:sc.materials.length,textures:sc.textures.length,frameMs:+t[7].toFixed(1)};});log('performance at the dais '+JSON.stringify(perf));
 // 4. the floor underfoot: soft stone, a little quieter than the street (the sound itself is not heard by this test)
 const snd=await page.evaluate(async()=>{try{VoidAudio.unlock?.();}catch{}await new Promise(r=>setTimeout(r,4000));const a=VoidMusicArea?.area,s=VoidAmbience.surface(a);let played=false;for(let i=0;i<20&&!played;i++){played=VoidAmbience.ownStep(false);if(!played)await new Promise(r=>setTimeout(r,500));}
  return {area:a,surface:s,played,stone:VoidAmbience.ownStepSound('stone',false,.5,.5),street:VoidAmbience.ownStepSound('wet',false,.5,.5)};});
 log('steps '+JSON.stringify(snd));assert.equal(snd.area,'temple');assert.equal(snd.surface,'stone');assert.equal(snd.played,true,'the player\'s own recorded step plays in the Temple');assert.ok(snd.stone.level<snd.street.level);
 // 5. Zen Zephyr: the seated monk, then a typed conversation (local quotes)
 await at(0,16.2,NORTH,.05);await page.waitForTimeout(800);assert.equal(await page.evaluate(()=>VoidExplorer.select(walker,walkingLocation)?.id),'temple-monk','looking at the monk offers the conversation');
 const posBefore=await page.evaluate(()=>[walker.x,walker.z]);await page.evaluate(()=>VoidInteractions.handlers.get('temple-monk')({item:{}}));await page.waitForSelector('#zen-chat:not([hidden])');
 assert.match(await page.textContent('#zen-chat header'),/NOT AN AI/);await page.keyboard.type('wasd e l k',{delay:20});assert.deepEqual(await page.evaluate(()=>[walker.x,walker.z]),posBefore,'typing did not move the player');
 await page.fill('#zen-chat input','serenity');await page.keyboard.press('Enter');await page.waitForFunction(()=>document.querySelectorAll('#zen-log .zen').length>=2);
 assert.equal(await page.evaluate(()=>[...document.querySelectorAll('#zen-log .zen')].pop().textContent),'In the network of complex codes, serenity lies in the simplest line.');
 await shot('09-zen-zephyr-chat-panel',600);await page.keyboard.press('Escape');await page.waitForFunction(()=>!VoidTemple.panel.isOpen&&mode==='walking');
 for(const [act,item] of [['temple-altar',{altar:2}],['temple-incense',{}],['temple-overlook',{}]]){await page.evaluate(([a,i])=>VoidInteractions.handlers.get(a)({item:i}),[act,item]);assert.ok((await page.evaluate(()=>document.getElementById('notice').textContent)).length>10,act);}
 // 6. the V1 map of the Temple, with fog of war
 const fog=await page.evaluate(()=>({explored:VoidBabylon.zone.fog.explored(),total:VoidBabylon.zone.fog.total}));assert.ok(fog.explored>5&&fog.explored<fog.total,'partly explored: '+JSON.stringify(fog));
 // 7. back on foot through the East Gate: the Avenue again, the Temple disposed and the scene's mood restored
 await at(-8,-40,0);await page.evaluate(()=>VoidInteractions.handlers.get('temple-walk')({item:{}}));await page.waitForFunction(()=>walkingLocation?.quarter==='avenue'&&mode==='walking'&&!VoidGateTransit.busy,null,{timeout:600000});
 const back=await page.evaluate(()=>({pos:[walker.x,walker.z],temple:VoidBabylon.scene.meshes.some(m=>/^tmp-|^mk-/.test(m.name)),templeLights:VoidBabylon.scene.lights.some(l=>/^temple-/.test(l.name)),mirror:VoidBabylon.scene.textures.some(t=>t.name==='temple-floor-mirror'),fog:state.story.flags.templeFog}));
 log('back '+JSON.stringify(back));assert.equal(back.temple,false,'nothing of the Temple is left');assert.equal(back.templeLights,false);assert.equal(back.mirror,false);assert.ok(typeof back.fog==='string'&&back.fog.length>10);
 await page.waitForTimeout(2500);await walk(141,-6.8);await at(141,-6.8,EAST,-.05);await shot('10-east-gate-lane-back-on-the-avenue');
 assert.deepEqual(errs,[]);console.log(JSON.stringify({ok:true,tier,perf,lights:arr.own,mirrored:arr.mirrored,steps:snd.surface}));
 }finally{await b.close();srv.close();}
})().catch(e=>{console.error(String(e.stack||e).slice(0,1500));process.exit(1);});
