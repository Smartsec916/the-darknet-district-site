/* Monks on the street in the real game (Chromium, software GL, offline). Old Town's Main Street: one ordinary walker is tagged a monk for the test
   (VoidNPCDevice.tag(node,{monk:true})); a V1 reader set to walk into somebody is sent straight down the monk's line from ~12 m. The monk slows to its steady pace,
   its walk clip slows to match, it foresees the reader ~9 m off and drifts to one side of the sidewalk long before; the reader passes without a near miss or a bump.
   A short frame strip (side view) is saved. Usage: node tests/monk-walk-browser.cjs   (SHOTS=dir; BROWSER_EXECUTABLE=path; QUALITY=low|medium|high) */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const shots=process.env.SHOTS||path.resolve(__dirname,'..','docs/development/monk-walk');fs.mkdirSync(shots,{recursive:true});
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
  await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));await page.route('**/api/**',r=>r.fulfill({status:503,contentType:'application/json',body:'{}'}));
  await page.addInitScript(q=>{localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:q,v:2,chosen:true}));},quality);
  await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started);
  await page.evaluate(()=>Object.assign(VoidPreparation.limits,{scene:600000,assets:600000,optional:300000,total:1200000,module:600000,artwork:300000}));
  await page.evaluate(async()=>{const d=C.startDistrictCampaign(C.fresh());d.story.flags.podWakePending=false;state=d;walkingLocation=walker=null;mode='menu';document.getElementById('screen')?.classList.add('hidden');state.location='earth';await enterWalking(VoidDistrictArea.KEY.street,{silent:true,quarter:'oldtown'});});
  await page.waitForFunction(()=>mode==='walking'&&walkingLocation?.area==='street');
  await page.waitForFunction(()=>VoidAssets.pending===0,null,{timeout:400000});
  await page.waitForFunction(()=>VoidBabylon.district?.nightlife?.stats().spawned>=8,null,{timeout:300000});
  await page.evaluate(()=>{for(const id of ['pd-notify'])document.getElementById(id)?.remove();Object.assign(walker,{x:61,z:-70,yaw:Math.PI,pitch:-.05});});
  await page.waitForTimeout(4000);
  // The monk: an ordinary sober walker on Main Street with no companion, tagged monk. The reader: another, sent down the monk's line from 12 m.
  await page.waitForFunction(()=>{const N=VoidBabylon.district.nightlife;return N.people.filter(p=>p.node&&!p.fixed&&!p.away&&!p.hidden&&!p.drunk&&!p.friendOf&&!p.pairOf&&p.l.id.startsWith('main')).length>=3;},null,{timeout:180000,polling:500});
  const s0=await page.evaluate(()=>{const N=VoidBabylon.district.nightlife,ws=N.people.filter(p=>p.node&&!p.fixed&&!p.away&&!p.hidden&&!p.drunk&&!p.friendOf&&!p.pairOf&&!N.people.some(o=>o.pairOf===p.id||o.friendOf===p.id)&&p.l.id.startsWith('main'));
   const near=p=>Math.hypot(p.node.position.x-walker.x,p.node.position.z-walker.z),m=ws.filter(p=>p.t>20&&p.t<len(p)-20).sort((a,b)=>near(a)-near(b))[0]||ws.sort((a,b)=>near(a)-near(b))[0],r=ws.find(o=>o!==m&&VoidNPCDevice._agent(o.node)?.tier!=='v3')||ws.find(o=>o!==m);if(!m||!r)return null;
   function len(p){return Math.hypot(p.l.b[0]-p.l.a[0],p.l.b[1]-p.l.a[1]);}
   window.__m=m;window.__r=r;m.speed0=m.speed;m.t=Math.min(len(m)-30,Math.max(20,m.t));m.side=m.homeSide=.1;m.state='walk';m.faceTo=null;m.anim?.play?.('walk');m.timer=99;
   VoidNPCDevice.tag(m.node,{monk:true});{const l=m.l,k=m.t/len(m),x=l.a[0]+(l.b[0]-l.a[0])*k,z=l.a[1]+(l.b[1]-l.a[1])*k;window.__cam=[x-l.wall[0]*7,z-l.wall[1]*7,x,z];}VoidNPCDevice.tag(r.node,{tier:'v1',force:()=>'scroll'});
   return {monk:m.id,reader:r.id,lane:m.l.id,speed0:m.speed};});
  assert.ok(s0,'two walkers for the test');log('setup '+JSON.stringify(s0));
  const cam=()=>page.evaluate(()=>{const [x,z,tx,tz]=window.__cam;Object.assign(walker,{x,z,yaw:Math.atan2(tx-x,tz-z),pitch:-.08});});
  const hold=async(fn,ms=120000)=>{const end=Date.now()+ms;while(Date.now()<end){await cam();if(await page.evaluate(fn))return;await page.waitForTimeout(150);}throw new Error('timed out: '+fn);};
  await cam();
  await hold(()=>window.__m.monk===true,60000);
  // the reader set walking straight at the monk on the same line, once their hologram is up, their look set to bump (into whoever they meet)
  await page.evaluate(()=>{const m=window.__m,r=window.__r;r.l=m.l;r.dir=-m.dir;r.t=m.t+m.dir*12;r.side=m.side;r.homeSide=m.side;r.state='walk';r.faceTo=null;r.anim?.play?.('walk');r.timer=99;r.reading=false;});
  // while their hologram comes up, the camera looks at the reader (only people in view are drawn using a device)
  await hold(()=>{const m=window.__m,r=window.__r,l=m.l;if((r.t-m.t)*m.dir<9){r.t=m.t+m.dir*12;r.side=m.side;}const q=r.node.position;window.__cam=[q.x-l.wall[0]*5,q.z-l.wall[1]*5,q.x,q.z];return VoidNPCDevice._agent(r.node)?.w>.5&&r.reading;});
  const b0=await page.evaluate(()=>{const m=window.__m,r=window.__r;
   // a clear stretch for the meeting: other walkers on this pavement go round the corner for a while (people standing stay)
   for(const o of VoidBabylon.district.nightlife.people)if(o!==m&&o!==r&&!o.fixed&&o.l===m.l&&o.node){o.away=600;o.node.setEnabled(false);}window.__r.plan={kind:'bump',at:99};r.t=m.t+m.dir*12;r.side=m.side;r.homeSide=m.side;r.missed=null;
   const N=VoidBabylon.district.nightlife;window.__st0=N.stats();
   // the camera: across the street from the meeting point, 7 m out, looking at it
   const l=m.l,meetT=m.t+m.dir*12*m.speed/(m.speed+r.speed),k=meetT/Math.hypot(l.b[0]-l.a[0],l.b[1]-l.a[1]),x=l.a[0]+(l.b[0]-l.a[0])*k,z=l.a[1]+(l.b[1]-l.a[1])*k;
   window.__cam=[x-l.wall[0]*7,z-l.wall[1]*7,x,z];return {speed:m.speed,monkSpeed:VoidNightlife.monkSpeed(),stats:window.__st0};});
  log('monk speed '+b0.speed0+' -> '+b0.speed);assert.ok(Math.abs(b0.speed-b0.monkSpeed)<1e-9,'the monk walks at the monk pace');
  const read=()=>page.evaluate(()=>{const m=window.__m,r=window.__r,gap=(r.t-m.t)*m.dir,ratio=(m.node.metadata?.animationGroups||[]).filter(g=>g.isPlaying).map(g=>g.name+':'+g.speedRatio.toFixed(2));
   return {gap:+gap.toFixed(2),monkSide:+m.side.toFixed(2),readerSide:+r.side.toFixed(2),avoid:m.avoid?{side:+m.avoid.side.toFixed(2),gap:+(m.avoid.gap||0).toFixed(1)}:null,reading:r.reading,readerState:r.state,monkState:m.state,ratio,missed:!!r.missed,bumped:r.bumped||null,monkBumped:m.bumped||null,stats:VoidBabylon.district.nightlife.stats()};});
  const marks=[11.5,9,7,5,3,1,-1.5,-4],strip=[];let firstAvoid=null,minSep=Infinity,last=null;
  for(let i=0;i<4000&&marks.length;i++){await cam();const s=await read();last=s;if(s.avoid&&firstAvoid==null)firstAvoid=s.gap;if(Math.abs(s.gap)<.7)minSep=Math.min(minSep,Math.abs(s.monkSide-s.readerSide));
   if(s.gap<=marks[0]){const m=marks.shift();const f=path.join(shots,'monk-sidestep-'+String(strip.length).padStart(2,'0')+'.png');await page.screenshot({path:f});strip.push({f,...s});log('frame gap '+s.gap+' '+JSON.stringify({monk:s.monkSide,reader:s.readerSide,avoid:s.avoid,reading:s.reading,ratio:s.ratio}));void m;}
   else await page.waitForTimeout(80);}
  const st0=await page.evaluate(()=>window.__st0),window_m=await page.evaluate(()=>window.__m.id);
  log('first sensed at '+firstAvoid+' m; passing gap across '+minSep+'; stats '+JSON.stringify(last.stats)+' before '+JSON.stringify(st0));
  assert.ok(firstAvoid!=null&&firstAvoid>=7,'the monk foresaw the reader well ahead ('+firstAvoid+' m)');
  assert.ok(minSep>=.8,'they pass with room ('+minSep+' m across)');
  assert.ok(strip.every(s=>!s.missed),'the reader never noticed the monk');
  assert.ok(strip.every(s=>!s.monkBumped&&s.bumped!==window_m),'nobody bumped into the monk');assert.equal(last.stats.personBumps,st0.personBumps,'nobody bumped into anyone');
  assert.ok(strip.some(s=>s.ratio.some(r=>/walk:0\.6\d/.test(r))),'the monk\'s walk clip plays slowed');
  assert.deepEqual(errors,[],'no page errors');
  fs.writeFileSync(path.join(shots,'monk-sidestep.json'),JSON.stringify(strip.map(({f,...s})=>({file:path.basename(f),...s})),null,1));
  log('OK');
 }finally{await browser.close();srv.close();}
})().catch(e=>{console.error(e);process.exit(1);});
