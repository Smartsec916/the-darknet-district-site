/* THE CYBERPUNK FIGURES in a real browser (Chromium, software GL, offline), 19 Nov 2026: the character creator's CYBERPUNK PRESETS (each figure, a colour version and
   a clothing colour), then the six figures on the Avenue by the Function Gate: a line-up in idle and in the walk, a close-up of each (idle, walk, reading their V1),
   and the street as dealt (who the Avenue and Old Town show, the draw calls).
     node tests/cyber-characters-browser.cjs [low|medium|high]        SHOTS=dir (default docs/development/cyber-characters/), ONLY=creator|street, STREETS=oldtown,avenue (the line-up is on the last) */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const tier=['low','medium','high'].includes(process.argv[2])?process.argv[2]:'high',shots=process.env.SHOTS||path.resolve(__dirname,'..','docs/development/cyber-characters');fs.mkdirSync(shots,{recursive:true});
const bundled=['/opt/pw-browsers/chromium','/opt/pw-browsers/chromium-1243/chrome-linux64/chrome'].find(f=>fs.existsSync(f)&&fs.statSync(f).isFile()),exe=process.env.BROWSER_EXECUTABLE||bundled||null;
const ROOT=path.resolve(__dirname,'..'),CY=['npc-cyber-exec','npc-cyber-pvc','npc-cyber-courier','npc-cyber-samurai','npc-cyber-respirator','npc-cyber-bouncer'];
function serve(){const types={'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.ogg':'audio/ogg','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.glb':'model/gltf-binary'};
 const srv=http.createServer((req,res)=>{const u=decodeURIComponent(req.url.split('?')[0]);let f;try{f=path.resolve(ROOT,'.'+u);}catch{res.writeHead(400);return res.end();}if(!f.startsWith(ROOT+path.sep)){res.writeHead(403);return res.end();}
  fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);return res.end();}res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(d);});});
 return new Promise(r=>srv.listen(0,'127.0.0.1',()=>r(srv)));}
(async()=>{
 const srv=await serve(),base='http://127.0.0.1:'+srv.address().port,log=m=>console.log(new Date().toISOString().slice(11,19),m),only=(process.env.ONLY||'creator,street').split(',');
 const b=await chromium.launch({headless:true,...(exe?{executablePath:exe}:{}),args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader','--no-sandbox','--autoplay-policy=no-user-gesture-required']});
 const out={tier,creator:[],figures:{},streets:{}};
 try{
  const page=await (await b.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1,serviceWorkers:'block'})).newPage();page.setDefaultTimeout(600000);const errs=[];page.on('pageerror',e=>{if(/cache\.js/.test(String(e.stack))&&/reading 'update'/.test(e.message))return;errs.push(e.message+' @ '+String(e.stack||'').split('\n').slice(1,3).join(' | '));});
  const failed=[];page.on('response',r=>{if(/\/crowd\/npc-cyber-/.test(r.url())&&r.status()!==200)failed.push(r.url());});
  await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));await page.route('**/api/**',r=>r.fulfill({status:503,contentType:'application/json',body:'{}'}));
  await page.addInitScript(q=>localStorage.setItem('void-runner-graphics-v1',JSON.stringify({renderer:'babylon',quality:q,v:2,chosen:true})),tier);
  await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started);
  await page.evaluate(()=>Object.assign(VoidPreparation.limits,{scene:900000,assets:900000,optional:600000,area:900000,total:1800000,module:600000,artwork:300000}));
  const bare=async on=>page.evaluate(b=>{document.getElementById('pd-notify')?.remove();{const w=document.getElementById('pod-wake');if(w)w.style.display='none';}const s=document.getElementById('screen');if(s)s.style.visibility=b?'hidden':'';},on);
  const shot=async(name,wait=1500)=>{await page.waitForTimeout(wait);await bare(true);await page.screenshot({path:path.join(shots,name+'-'+tier+'.png')});await bare(false);log('shot '+name);};
  // 1. the creator: every cyberpunk preset, a colour version, a clothing colour; saved and read back
  if(only.includes('creator')){
   await page.click('[data-action=menu-campaign]');await page.click('[data-action=menu-new]');const confirm=page.locator('[data-action=menu-new-confirm]');if(await confirm.count())await confirm.click();
   await page.waitForSelector('#character-creator.on',{timeout:300000});const ready=()=>page.waitForFunction(()=>!document.querySelector('[data-cc=confirm]')?.disabled,null,{timeout:300000});await ready();
   const click=async(k,v)=>{await page.click(`[data-cc="${k}"][data-v="${v}"]`);await page.waitForTimeout(300);await ready();await page.waitForTimeout(1500);};
   for(const [bs,look] of [['female','street-cyber-exec'],['female','street-cyber-pvc'],['female','street-cyber-courier'],['male','street-cyber-samurai'],['male','street-cyber-respirator'],['male','street-cyber-bouncer']]){
    await click('base',bs);await click('look',look);const st=await page.evaluate(()=>({look:document.querySelector('[data-cc=look][aria-pressed=true]')?.dataset.v,cyber:[...document.querySelectorAll('.cc-cyber [data-cc=look]')].map(b=>b.dataset.v),heads:[...document.querySelectorAll('#character-creator h2')].map(h=>h.textContent)}));
    assert.equal(st.look,look);assert.ok(st.heads.includes('CYBERPUNK PRESETS'));assert.equal(st.cyber.length,9,'nine presets per body: '+st.cyber);await page.screenshot({path:path.join(shots,'creator-'+look+'-'+tier+'.png')});out.creator.push(look);log('creator '+look);}
   await click('look','street-cyber-bouncer-dusk');await page.screenshot({path:path.join(shots,'creator-street-cyber-bouncer-dusk-'+tier+'.png')});
   await click('base','female');await click('look','street-cyber-pvc-navy');await click('clothingColor','crimson');await page.screenshot({path:path.join(shots,'creator-street-cyber-pvc-navy-crimson-'+tier+'.png')});
   await page.click('[data-cc=confirm]');await page.waitForFunction(()=>mode!=='character-creator',null,{timeout:60000});const saved=await page.evaluate(()=>VoidCharacterCreator.stored());assert.equal(saved.look,'street-cyber-pvc-navy');assert.equal(saved.clothingColor,'crimson');out.saved=saved;
  }
  if(only.includes('street')){
   const street=async(quarter,spawn)=>{await page.evaluate(async([quarter,spawn])=>{const d=C.startDistrictCampaign(C.fresh());d.story.flags.podWakePending=false;state=d;walkingLocation=walker=null;mode='menu';document.getElementById('screen')?.classList.add('hidden');state.location='earth';
     await enterWalking(VoidDistrictArea.KEY.street,{silent:true,quarter,spawn});},[quarter,spawn]);
    await page.waitForFunction(q=>mode==='walking'&&walker&&walkingLocation?.quarter===q&&VoidAssets.pending===0,quarter);
    await page.waitForFunction(()=>{const N=VoidBabylon.district?.nightlife;if(!N)return true;const ps=N.people;return ps.filter(p=>p.node).length>=ps.length*.85;},null,{timeout:600000,polling:1000});await page.waitForTimeout(2500);
    return page.evaluate(()=>{const N=VoidBabylon.district?.nightlife,ps=N?N.people:[],looks={};for(const p of ps)if(p.node)looks[p.look]=(looks[p.look]||0)+1;return {people:ps.length,shown:ps.filter(p=>p.node).length,looks};});};
   const perf=()=>page.evaluate(()=>{const sc=VoidBabylon.scene,e=sc.getEngine(),gl=e._gl,t=[],d=[];for(let i=0;i<10;i++){const d0=e._drawCalls.current,a=performance.now();sc.render();gl.finish();t.push(performance.now()-a);d.push(e._drawCalls.current-d0);}t.sort((a,b)=>a-b);d.sort((a,b)=>a-b);return {drawCalls:d[5],activeMeshes:sc.getActiveMeshes().length,frameMs:+t[5].toFixed(1)};});
   for(const [q,spawn,view] of [['oldtown',[57,1.7,-62],[54.5,-50,Math.PI,-.02]],['avenue',[20,1.7,-12.5],[34,-12.5,-Math.PI/2,-.02]]].filter(([q])=>(process.env.STREETS||'oldtown,avenue').split(',').includes(q))){   /* STREETS=avenue: one street load (software GL runs out of memory loading two at High) */const s=await street(q,spawn);out.streets[q]={...s,perf:await perf()};log(q+' '+JSON.stringify(out.streets[q]));
    await page.evaluate(([x,z,yaw,pitch])=>Object.assign(walker,{x,z,yaw,pitch}),view);await shot('street-'+q,3000);
    const cy=Object.keys(s.looks).filter(l=>/^npc-cyber-/.test(l));out.streets[q].cyber=cy;}
   // the line-up on the Avenue's road (wide and clear): the six figures, facing the camera
   await page.evaluate(()=>{const N=VoidBabylon.district?.nightlife;for(const p of N?.people||[])if(p.node&&Math.hypot(p.node.position.x-30,p.node.position.z+12.5)<9)p.node.setEnabled(false);});   // nobody in front of them
   const made=await page.evaluate(async(CY)=>{const B=BABYLON,out={};window.__cy={};const par=(VoidBabylon.district?.nightlife?.people||[]).find(p=>p.node)?.node.parent||VoidBabylon.scene.transformNodes.find(t=>t.name==='ncz-root')||new B.TransformNode('cyber-lineup',VoidBabylon.scene);const wait=async l=>{if(!VoidAssets.container('crowd:'+l))VoidAssets.load('crowd:'+l,{src:'assets/models/crowd/'+l+'.glb',background:true},VoidBabylon.scene).catch(()=>{});   /* a figure this quarter does not deal (the bouncer is not on the Avenue) */for(let i=0;i<600;i++){const n=VoidAssets.instance('crowd:'+l,par);if(n)return n;await new Promise(r=>setTimeout(r,500));}return null;};
    for(let i=0;i<CY.length;i++){const l=CY[i],n=await wait(l);if(!n){out[l]=null;continue;}n.metadata={...n.metadata,crowd:l,npcDevice:{kind:'stander'}};n.position.set(30,0,-15.25+i*1.1);n.rotation.y=0;n.computeWorldMatrix(true);
     const f=B.Vector3.TransformNormal(B.Axis.Z,n.getWorldMatrix());n.rotation.y=Math.atan2(-1,0)-Math.atan2(f.x,f.z);   // their front toward -x (the camera)
     VoidCrowd.dress(n,l,'lineup-'+i,'orig');const c=VoidCrowd.animate(n,l,'idle');c?.play?.('idle');c?.setCulled?.(false);window.__cy[l]={n,c};
     const ms=n.getChildMeshes(false);let tris=0,top=0;for(const m of ms){tris+=(m.getTotalIndices?.()||0)/3;m.refreshBoundingInfo?.(true,true);const bb=m.getBoundingInfo().boundingBox;top=Math.max(top,bb.maximumWorld.y);}
     out[l]={meshes:ms.length,tris:Math.round(tris),top:+top.toFixed(2),clips:(n.metadata.animationGroups||[]).map(g=>g.name.replace(/^.*-(?=[a-z-]+$)/,'')).length};}
    return out;},CY);out.figures=made;log('figures '+JSON.stringify(made));for(const l of CY)assert.ok(made[l],l+' did not load');
   const cam=(x,z,tx,tz,ty=1.1)=>page.evaluate(([x,z,tx,tz,ty])=>{Object.assign(walker,{x,z});walker.yaw=Math.atan2(tx-x,tz-z);const eye=VoidBabylon.scene.activeCamera.globalPosition.y;walker.pitch=-Math.atan2(ty-eye,Math.hypot(tx-x,tz-z));},[x,z,tx,tz,ty]);
   const all=c=>page.evaluate(([CY,c])=>{for(const l of CY){const f=window.__cy[l];if(!f)continue;if(c==='walk')f.c.play('walk');else f.c.play(c);}},[CY,c]);
   await cam(23.2,-12.5,30,-12.5,1.0);await all('idle');await shot('lineup-idle',3000);
   await all('walk');await shot('lineup-walk',2200);await page.waitForTimeout(400);await shot('lineup-walk-b',300);
   await all('idle');
   for(let i=0;i<CY.length;i++){const l=CY[i],z=-15.25+i*1.1,name=l.slice(10);
    await page.evaluate(l=>window.__cy[l].c.play('idle'),l);await cam(28.2,z+.35,30,z,1.15);await shot('close-'+name+'-idle',1800);
    await cam(29.2,z+.12,30,z,1.6);await shot('face-'+name,1200);
    await page.evaluate(l=>window.__cy[l].c.play('walk'),l);await cam(27.9,z-.9,30,z,1.0);await shot('close-'+name+'-walk',1500);
    await page.evaluate(l=>{const f=window.__cy[l];f.c.play('idle');VoidNPCDevice.tag(f.n,{tier:'v1',force:()=>'scroll'});},l);await cam(28.4,z+.6,30,z,1.4);await page.waitForTimeout(4000);await shot('close-'+name+'-v1',1500);
    const v1=await page.evaluate(l=>{const a=VoidNPCDevice.agents().find(a=>a.node===window.__cy[l].n);return a?{w:+(a.w||0).toFixed(2),pose:a.session?.pose||a.pose||null}:null;},l);out.figures[l].v1=v1;
    await page.evaluate(l=>VoidNPCDevice.tag(window.__cy[l].n,{force:()=>null}),l);}
   out.perfLineup=await perf();
  }
  assert.deepEqual(failed,[]);assert.deepEqual(errs,[]);console.log(JSON.stringify(out));fs.writeFileSync(path.join(shots,'result-'+tier+'.json'),JSON.stringify(out,null,1));
 }finally{await b.close();srv.close();}
})().catch(e=>{console.error(String(e.stack||e).slice(0,1500));process.exit(1);});
