/* THE NPC UPGRADE in a real browser (Chromium, software GL, offline), 18 Nov 2026: the character creator with each of its six new bases (and a colour version and a
   clothing colour), then a street in each quarter (Old Town by NULL, the Avenue by the Function Gate, Far South, the Outskirts, the Port), close-ups of street figures,
   the cooks at the food shopfronts, the vendor and the busker, and the cost (draw calls, active meshes, frame time) at fixed views.
     node tests/npc-upgrade-browser.cjs [low|medium|high]        own static server on a free port; SHOTS=dir (default docs/development/npc-upgrade/)
     BEFORE=1 node tests/npc-upgrade-browser.cjs medium          serves main's version of every changed game script over this worktree (the old crowd), for the before numbers */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),cp=require('node:child_process');
const tier=['low','medium','high'].includes(process.argv[2])?process.argv[2]:'medium',before=!!process.env.BEFORE,shots=process.env.SHOTS||path.resolve(__dirname,'..','docs/development/npc-upgrade');fs.mkdirSync(shots,{recursive:true});
const bundled=['/opt/pw-browsers/chromium','/opt/pw-browsers/chromium-1243/chrome-linux64/chrome'].find(f=>fs.existsSync(f)&&fs.statSync(f).isFile()),exe=process.env.BROWSER_EXECUTABLE||bundled||null;
const ROOT=path.resolve(__dirname,'..');
// BEFORE: the game scripts and pages this branch changed, as they are on main (the model files are the same: main's crowd simply never asks for the new ones).
const old=new Map();if(before){const base=process.env.BASE_REF||'origin/main';for(const f of cp.execSync('git diff --name-only '+base+' -- void-runner.html void-runner/*.js void-runner/*.json',{cwd:ROOT,encoding:'utf8'}).split('\n').filter(Boolean)){try{old.set('/'+f,cp.execSync('git show '+base+':'+f,{cwd:ROOT,maxBuffer:64e6}));}catch{old.set('/'+f,null);}}}
function serve(){const types={'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.ogg':'audio/ogg','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.glb':'model/gltf-binary'};
 const srv=http.createServer((req,res)=>{const u=decodeURIComponent(req.url.split('?')[0]);let f;try{f=path.resolve(ROOT,'.'+u);}catch{res.writeHead(400);return res.end();}if(!f.startsWith(ROOT+path.sep)){res.writeHead(403);return res.end();}
  if(old.has(u)){const d=old.get(u);if(!d){res.writeHead(404);return res.end();}res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');return res.end(d);}
  fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);return res.end();}res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(d);});});
 return new Promise(r=>srv.listen(0,'127.0.0.1',()=>r(srv)));}
(async()=>{
 const srv=await serve(),base='http://127.0.0.1:'+srv.address().port,log=m=>console.log(new Date().toISOString().slice(11,19),m),tag=before?'before-':'';
 const b=await chromium.launch({headless:true,...(exe?{executablePath:exe}:{}),args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader','--no-sandbox','--autoplay-policy=no-user-gesture-required']});
 const out={tier,before,creator:[],streets:{},perf:{},closeups:[]};
 try{
  const page=await (await b.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1,serviceWorkers:'block'})).newPage();page.setDefaultTimeout(600000);const errs=[];page.on('pageerror',e=>{if(/cache\.js/.test(String(e.stack))&&/reading 'update'/.test(e.message))return;errs.push(e.message+' @ '+String(e.stack||'').split('\n').slice(1,3).join(' | '));});   /* the service worker is blocked in this harness (cache.js has no registration) */
  const bytes={};page.on('response',r=>{const u=r.url();if(/\/assets\/models\/crowd\/.+\.glb$/.test(u))r.body().then(x=>{bytes[u.split('/').pop()]=x.length;}).catch(()=>{});});
  await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));await page.route('**/api/**',r=>r.fulfill({status:503,contentType:'application/json',body:'{}'}));
  await page.addInitScript(q=>localStorage.setItem('void-runner-graphics-v1',JSON.stringify({renderer:'babylon',quality:q,v:2,chosen:true})),tier);
  await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started);
  await page.evaluate(()=>Object.assign(VoidPreparation.limits,{scene:900000,assets:900000,optional:600000,area:900000,total:1800000,module:600000,artwork:300000}));
  const at=(x,z,yaw=0,pitch=0)=>page.evaluate(([x,z,yaw,pitch])=>{Object.assign(walker,{x,z,yaw,pitch});},[x,z,yaw,pitch]);
  const shot=async(name,wait=2500,bare=true)=>{await page.waitForTimeout(wait);await page.evaluate(b=>{document.getElementById('pd-notify')?.remove();{const w=document.getElementById('pod-wake');if(w)w.style.display='none';}const s=document.getElementById('screen');if(s)s.style.visibility=b?'hidden':'';},bare);await page.screenshot({path:path.join(shots,tag+name+'-'+tier+'.png')});await page.evaluate(()=>{const s=document.getElementById('screen');if(s)s.style.visibility='';});log('shot '+name);};
  const perf=()=>page.evaluate(()=>{const sc=VoidBabylon.scene,e=sc.getEngine(),gl=e._gl,t=[],d=[];for(let i=0;i<12;i++){const d0=e._drawCalls.current,a=performance.now();sc.render();gl.finish();t.push(performance.now()-a);d.push(e._drawCalls.current-d0);}t.sort((a,b)=>a-b);d.sort((a,b)=>a-b);return {drawCalls:d[6],activeMeshes:sc.getActiveMeshes().length,frameMs:+t[6].toFixed(1)};});
  const frontOf=async(name,pos,yaw,off=0,dist=2.6,pitch=.16)=>{const a=yaw+off,x=pos[0]+Math.sin(a)*dist,z=pos[1]+Math.cos(a)*dist;await at(x,z,Math.atan2(pos[0]-x,pos[1]-z),pitch);await shot(name,2200);};
  // 1. the character creator (a new campaign opens it before the pod): every base, then a colour version and a clothing colour
  if(!before&&!process.env.NO_CREATOR){
   await page.click('[data-action=menu-campaign]');await page.click('[data-action=menu-new]');const confirm=page.locator('[data-action=menu-new-confirm]');if(await confirm.count())await confirm.click();
   await page.waitForSelector('#character-creator.on',{timeout:300000});const ready=()=>page.waitForFunction(()=>!document.querySelector('[data-cc=confirm]')?.disabled,null,{timeout:300000});await ready();
   const click=async(k,v)=>{await page.click(`[data-cc="${k}"][data-v="${v}"]`);await page.waitForTimeout(300);await ready();await page.waitForTimeout(1200);};
   for(const [base,look] of [['female','street-casual-f'],['female','street-office-f'],['female','street-merc'],['male','street-casual-m'],['male','street-office-m'],['male','street-hacker']]){
    await click('base',base);await click('look',look);const st=await page.evaluate(()=>({look:document.querySelector('[data-cc=look][aria-pressed=true]')?.dataset.v,looks:[...document.querySelectorAll('[data-cc=look]')].map(b=>b.dataset.v)}));
    assert.equal(st.look,look);assert.ok(st.looks.every(l=>/^street-/.test(l)),'only the new bases are offered: '+st.looks);await page.screenshot({path:path.join(shots,'creator-'+look+'-'+tier+'.png')});out.creator.push(look);log('creator '+look);}
   await click('look','street-hacker-navy');await page.screenshot({path:path.join(shots,'creator-street-hacker-navy-'+tier+'.png')});
   await click('clothingColor','crimson');await page.screenshot({path:path.join(shots,'creator-street-hacker-navy-crimson-'+tier+'.png')});
   await page.click('[data-cc=confirm]');await page.waitForFunction(()=>mode!=='character-creator',null,{timeout:60000});const saved=await page.evaluate(()=>VoidCharacterCreator.stored());assert.equal(saved.look,'street-hacker-navy');assert.equal(saved.clothingColor,'crimson');out.saved=saved;
  }
  // 2. the streets
  const street=async(quarter,spawn)=>{await page.evaluate(async([quarter,spawn])=>{const d=C.startDistrictCampaign(C.fresh());d.story.flags.podWakePending=false;d.credits=100;state=d;walkingLocation=walker=null;mode='menu';document.getElementById('screen')?.classList.add('hidden');state.location='earth';
    await enterWalking(VoidDistrictArea.KEY.street,{silent:true,quarter,spawn});},[quarter,spawn]);
   await page.waitForFunction(q=>mode==='walking'&&walkingLocation?.quarter===q&&VoidAssets.pending===0,quarter);
   await page.waitForFunction(()=>{const N=VoidBabylon.district?.nightlife;if(!N)return true;const ps=N.people;return ps.filter(p=>p.node).length>=ps.length*.85;},null,{timeout:600000,polling:1000});await page.waitForTimeout(2500);
   return page.evaluate(()=>{const N=VoidBabylon.district?.nightlife,ps=N?N.people:[],looks={};for(const p of ps)if(p.node)looks[p.look]=(looks[p.look]||0)+1;
    return {people:ps.length,shown:ps.filter(p=>p.node).length,looks,kinds:ps.reduce((o,p)=>(o[p.kind||(p.monkPlan?'monk':'walker')]=(o[p.kind||(p.monkPlan?'monk':'walker')]||0)+1,o),{}),variants:ps.filter(p=>p.node?.metadata?.variant).length};});};
  const hold=(pred)=>page.evaluate(src=>{const f=new Function('p','return '+src),N=VoidBabylon.district.nightlife,c=walker,ps=N.people.filter(p=>p.node&&!p.hidden&&!p.away&&f(p)).sort((a,b)=>Math.hypot(a.node.position.x-c.x,a.node.position.z-c.z)-Math.hypot(b.node.position.x-c.x,b.node.position.z-c.z));
   const p=ps[0];if(!p)return null;if(!p.fixed){p.state='stop';p.timer=999;p.anim?.play?.('idle');}return {id:p.id,look:p.look,kind:p.kind||'walker',variant:p.node.metadata?.variant||null,pos:[p.node.position.x,p.node.position.z],yaw:p.node.rotation.y};},String(pred));
  const quarters=[['oldtown',[57,1.7,-62],[54.5,-50,Math.PI,-.02]],['avenue',[20,1.7,-12.5],[34,-12.5,-Math.PI/2,-.02]],['far-south',[61,1.7,-150],[61,-140,Math.PI,-.02]],['outskirts',[61,1.7,-229],[61,-228,Math.PI,.02]],['port',[31,1.7,-96],[40,-104,-.6,-.02]]];
  for(const [q,spawn,view] of quarters){const s=await street(q,spawn);out.streets[q]=s;log(q+' '+JSON.stringify(s));await at(...view);await shot('street-'+q,3000);out.perf[q]=await perf();log(q+' perf '+JSON.stringify(out.perf[q]));
   if(before)continue;
   if(q==='oldtown'){   // club-goers by NULL's door, the cooks, the vendor and the busker, and a few close-ups
    await at(56,-66,-.4,-.02);await shot('null-club-goers',2500);
    for(const k of ['cook','vendor','busker']){const h=await hold(`p.kind==='${k}'`);if(h){out.closeups.push(h);await frontOf(k+'-'+h.look.slice(4),h.pos,h.yaw,.25,2.8);}}
    for(const l of ['npc-club-f','npc-club-m','npc-lookout','npc-enforcer','npc-hacker','npc-student']){const h=await hold(`p.look==='${l}'&&!p.monkPlan`);if(h){out.closeups.push(h);await frontOf('close-'+l.slice(4)+'-'+(h.variant||'orig'),h.pos,h.yaw,.3,2.4);}}}
   if(q==='avenue'){for(const l of ['npc-security','npc-executive','npc-office-f','npc-office-m','npc-tourist','npc-courier']){const h=await hold(`p.look==='${l}'&&!p.monkPlan`);if(h){out.closeups.push(h);await frontOf('close-'+l.slice(4)+'-'+(h.variant||'orig'),h.pos,h.yaw,.3,2.4);}}
    const c=await hold(`p.kind==='cook'`);if(c){out.closeups.push(c);await frontOf('cook-avenue-'+c.look.slice(4),c.pos,c.yaw,.25,2.8);}}
   if(q==='far-south'){const c=await hold(`p.kind==='cook'`);if(c){out.closeups.push(c);await frontOf('cook-far-south-'+c.look.slice(4),c.pos,c.yaw,-.3,2.8);}const v=await hold(`p.kind==='vendor'`);if(v){await frontOf('vendor-far-south',v.pos,v.yaw,.2,2.8);}}
   if(q==='outskirts'){const os=await page.evaluate(()=>{const ns=VoidBabylon.scene.transformNodes.filter(n=>n.metadata?.outskirts&&n.isEnabled());return ns.map(n=>({look:n.metadata.crowd,variant:n.metadata.variant||null,x:n.getAbsolutePosition().x,z:n.getAbsolutePosition().z,yaw:n.rotation.y}));});out.outskirts=os;log('outskirts people '+JSON.stringify(os.map(o=>o.look+':'+o.variant)));
    await at(61,-232,Math.PI,.06);await shot('outskirts-fire',2500);for(const l of ['npc-outskirts-f','npc-outskirts-m']){const o=os.find(o=>o.look===l);if(o)await frontOf('close-'+l.slice(4),[o.x,o.z],o.yaw,.2,2.4);}}}
  out.bytes=bytes;out.crowdMB=+(Object.values(bytes).reduce((s,x)=>s+x,0)/1048576).toFixed(1);out.files=Object.keys(bytes).length;
  assert.deepEqual(errs,[]);console.log(JSON.stringify(out));
 }finally{await b.close();srv.close();}
})().catch(e=>{console.error(String(e.stack||e).slice(0,1500));process.exit(1);});
