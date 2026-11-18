/* Players see each other's device (Chromium, software GL). A real local hub (tools/district-hub/hub-server.cjs, with a test identity: the token is the account) and
   two clients: the game page, and a scripted second player over a plain WebSocket. The scripted player stands in front of the page's camera and opens a V1 (the
   cuff and teal hologram), a V2 (placeholder violet), then a V3 // Shadow camera (only the eye glows); screenshots of each. Then the page opens its own device and the
   scripted player checks what it was told: only the model and read/cam, never anything about the screen.
   Usage: node tests/mp-device-browser.cjs   (own static server and hub on free ports; SHOTS=dir; BROWSER_EXECUTABLE=path; QUALITY=low|medium|high)
   Needs `ws` and `playwright` (NODE_PATH=... in a cloud container). Not named *.test.cjs: CI runs without them. */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),WebSocket=require('ws');
const {start}=require('../tools/district-hub/hub-server.cjs');
const shots=process.env.SHOTS||path.resolve(__dirname,'..','docs/development/mp-device');fs.mkdirSync(shots,{recursive:true});
const bundled=['/opt/pw-browsers/chromium','/opt/pw-browsers/chromium-1243/chrome-linux64/chrome'].find(f=>fs.existsSync(f)&&fs.statSync(f).isFile()),exe=process.env.BROWSER_EXECUTABLE||bundled||null;
const quality=process.env.QUALITY||'medium',W=1366,H=768;
function serve(){const root=path.resolve(__dirname,'..'),types={'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.ogg':'audio/ogg','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.glb':'model/gltf-binary'};
 const srv=http.createServer((req,res)=>{let f;try{f=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));}catch{res.writeHead(400);return res.end();}if(!f.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);return res.end();}res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(d);});});
 return new Promise(r=>srv.listen(0,'127.0.0.1',()=>r(srv)));}
const log=m=>console.log(new Date().toISOString().slice(11,19),m);
(async()=>{
 const srv=await serve(),base='http://127.0.0.1:'+srv.address().port;
 // test identities only: the token names the account (a local hub, never a deployed one)
 const hub=await start({identify:async t=>/^[A-Za-z0-9_]{3,20}$/.test(t)?{uid:'uid-'+t,anonymous:false,handle:t,model:'district-resident'}:null,port:0});const hubUrl='ws://127.0.0.1:'+hub.port;
 const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader','--no-sandbox'],...(exe?{executablePath:exe}:{})});
 let bot=null,beat=0;const got=[];
 try{
  const ctx=await browser.newContext({viewport:{width:W,height:H},serviceWorkers:'block'}),page=await ctx.newPage();page.setDefaultTimeout(300000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(/npc device/i.test(m.text()))errors.push(m.text());});
  const shot=async n=>{await page.waitForTimeout(600);await page.screenshot({path:path.join(shots,n+'.png')});log('shot '+n);};
  await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));await page.route('**/api/**',r=>r.fulfill({status:503,contentType:'application/json',body:'{}'}));
  await page.addInitScript(q=>{localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:q,v:2,chosen:true}));localStorage.setItem('tdd-dev-mp-token','Page_One');},quality);
  await page.goto(base+'/void-runner.html?multiplayer=1&hub='+encodeURIComponent(hubUrl));await page.waitForFunction(()=>window.VoidStartup?.started);
  await page.evaluate(()=>Object.assign(VoidPreparation.limits,{scene:600000,assets:600000,optional:300000,total:1200000,module:600000,artwork:300000}));
  await page.evaluate(async()=>{const d=C.startDistrictCampaign(C.fresh());d.story.flags.podWakePending=false;state=d;walkingLocation=walker=null;mode='menu';document.getElementById('screen')?.classList.add('hidden');state.location='earth';await enterWalking(VoidDistrictArea.KEY.interior,{silent:true});});
  await page.waitForFunction(()=>mode==='walking'&&walkingLocation?.area==='interior');
  await page.waitForFunction(()=>VoidAssets.pending===0,null,{timeout:400000});
  await page.waitForFunction(()=>VoidRemotePlayers.connected&&VoidRemotePlayers.features.dev,null,{timeout:120000});log('page connected; the hub knows devices');
  await page.evaluate(()=>{for(const id of ['pd-notify'])document.getElementById(id)?.remove();});
  // the scripted second player, 1.6 m in front of the page's camera, facing it
  const me=await page.evaluate(()=>({x:walker.x,z:walker.z,yaw:walker.yaw}));
  bot=new WebSocket(hubUrl);await new Promise((r,j)=>{bot.once('open',r);bot.once('error',j);});bot.on('message',d=>got.push(JSON.parse(String(d))));
  bot.send(JSON.stringify({t:'hello',token:'Bot_Two',room:'district-interior'}));
  const at={x:me.x+Math.sin(me.yaw)*1.6,z:me.z+Math.cos(me.yaw)*1.6,yaw:me.yaw+Math.PI};beat=setInterval(()=>{if(bot.readyState===1)bot.send(JSON.stringify({t:'state',x:at.x,z:at.z,yaw:at.yaw}));},150);
  await page.waitForFunction(()=>VoidRemotePlayers.peers.some(p=>p.name==='Bot_Two'&&p.drawn),null,{timeout:180000});
  await page.waitForFunction(()=>VoidNPCDevice.agents().some(a=>a.kind==='player-remote'),null,{timeout:180000});log('the other player is drawn and known to npc-device');
  await page.evaluate(()=>{walker.pitch=-.12;});await page.waitForTimeout(1500);
  await shot('mp-device-0-closed');let A=await page.evaluate(()=>VoidNPCDevice.agents().filter(a=>a.kind==='player-remote').map(({node,...a})=>a));assert.equal(A[0].holo,false,'closed: nothing shown');assert.equal(A[0].eye,false);
  const full=()=>page.waitForFunction(()=>VoidNPCDevice.agents().find(a=>a.kind==='player-remote')?.w>=.97,null,{timeout:120000});
  const ag=()=>page.evaluate(()=>{const {node,...a}=VoidNPCDevice.agents().find(a=>a.kind==='player-remote');return a;});
  bot.send(JSON.stringify({t:'dev',dev:'v1',pose:'read'}));await page.waitForFunction(()=>VoidRemotePlayers.peers.find(p=>p.name==='Bot_Two')?.dev==='v1');await full();
  A=await ag();log('v1 '+JSON.stringify(A));assert.equal(A.tier,'v1');assert.equal(A.pose,'scroll');assert.ok(A.holo&&A.cuff&&!A.eye,'V1: cuff and hologram');await shot('mp-device-1-v1-read');
  await new Promise(r=>setTimeout(r,300));bot.send(JSON.stringify({t:'dev',dev:'v2',pose:'read'}));await page.waitForFunction(()=>VoidNPCDevice.agents().find(a=>a.kind==='player-remote')?.tier==='v2');await page.waitForTimeout(2500);
  A=await ag();log('v2 '+JSON.stringify(A));assert.ok(A.holo&&A.cuff,'V2: the same cuff and panel');await shot('mp-device-2-v2-read');
  await new Promise(r=>setTimeout(r,300));bot.send(JSON.stringify({t:'dev',dev:'v1',pose:'cam'}));await page.waitForFunction(()=>VoidNPCDevice.agents().find(a=>a.kind==='player-remote')?.frame,null,{timeout:120000});await full();await shot('mp-device-3-v1-cam');
  await new Promise(r=>setTimeout(r,300));bot.send(JSON.stringify({t:'dev',dev:'v3',pose:'read'}));
  await page.waitForFunction(()=>{const a=VoidNPCDevice.agents().find(a=>a.kind==='player-remote');return a?.tier==='v3'&&a.eye&&!a.cuff&&!a.holo&&!a.frame;},null,{timeout:120000});await full();
  A=await ag();log('v3 '+JSON.stringify(A));
  // closer for the eye: the camera 0.9 m from the face
  at.x=me.x+Math.sin(me.yaw)*.9;at.z=me.z+Math.cos(me.yaw)*.9;await page.waitForTimeout(2500);await page.evaluate(()=>{walker.pitch=-.02;});await shot('mp-device-4-v3-eye');
  const legacyEye=await page.evaluate(()=>VoidBabylon.scene.meshes.filter(m=>/v3-eye|eye-glow/i.test(m.name)&&!/npc-v3-eye/.test(m.name)&&m.isEnabled()).map(m=>m.name));log('street-gear eye meshes: '+JSON.stringify(legacyEye));
  await new Promise(r=>setTimeout(r,300));bot.send(JSON.stringify({t:'dev',dev:null}));await page.waitForFunction(()=>{const a=VoidNPCDevice.agents().find(a=>a.kind==='player-remote');return a&&a.w===0&&!a.eye&&!a.holo;},null,{timeout:120000});log('closed again: nothing shown');
  // the page's own device: what the other player is told
  got.length=0;await page.evaluate(()=>{state.story.flags.deviceModel='v2';VoidPersonalDevice.open();});
  await new Promise(r=>setTimeout(r,2500));let devs=got.filter(m=>m.t==='dev');log('bot received '+JSON.stringify(devs));
  assert.ok(devs.length>=1);assert.deepEqual(devs.at(-1),{t:'dev',id:devs.at(-1).id,dev:'v2',pose:'read'});
  await page.evaluate(()=>VoidPersonalDevice.close());await new Promise(r=>setTimeout(r,2500));devs=got.filter(m=>m.t==='dev');assert.equal(devs.at(-1).dev,null);
  for(const m of devs)assert.deepEqual(Object.keys(m).filter(k=>!['t','id','dev','pose'].includes(k)),[],'nothing but the device state');
  assert.ok(!got.some(m=>m.t==='refused'),'the hub refused nothing');
  log('errors: '+JSON.stringify(errors));assert.deepEqual(errors,[]);
  log('PASS');
 }finally{clearInterval(beat);try{bot?.close();}catch{}await browser.close();await hub.close();srv.close();}
})().catch(e=>{console.error(e);process.exit(1);});
