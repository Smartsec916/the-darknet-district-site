/* NeoChinatown building-gap check in a real browser (David, 16 Nov 2026; docs/development/NCZ_GAP_CHECK.md). Not part of npm test. Built on the setup of
   tests/ncz-views-browser.cjs: enter the street, wait for it to finish loading, then inspect VoidBabylon.scene.
     node tests/ncz-gaps-browser.cjs <label> [quarter[,quarter]] [low|medium|high]        -> work/ncz-gaps/<label>/report.json, report.txt and marked-up pictures
     SITE_TEST_URL=http://127.0.0.1:5187 (default)   BROWSER_CHANNEL=msedge|chrome (default: the bundled Chromium with the software renderer)
     GAP_ONLY=<face id>   one face only (ids are printed)      GAP_SHOTS=0   no pictures      GAP_ASSETS_ONLY=1   stop after the asset report
     GAP_LIVE=1   read-only against a deployed site (SITE_TEST_URL=https://thedarknetdistrict.com): nothing is routed or blocked, no account is used, nothing is saved
     GAP_COMPARE=<label>   picture each face from where the run <label> pictured it (before / after pairs)
     GAP_PROXY=http://host:port   an outbound proxy for the browser, where the machine needs one
   1. ASSET REPORT: which building assets are in the scene, and whether each block is on the PURCHASED models or the FALLBACK built in code.
   2. For every expected wall of the quarter (tools/ncz/gap-check.cjs wallFaces), a close grid of short level rays from the street. A ray that passes the expected
      wall depth without meeting a building piece is a gap. Collision boxes, invisible meshes, signs, lights, people and declared openings are excluded.
   3. For each face with gaps, a picture from the player's position with every flagged ray marked, and a caption saying where it is.
   The pure parts (faces, ray grid, classification, exclusions) are in tools/ncz/gap-check.cjs and tested by tests/ncz-gap-check.test.cjs.
   Exit code 1 when any gap is found, so the same run shows "fails before, passes after". */
'use strict';
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path');
const G=require('../tools/ncz/gap-check.cjs');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',label=process.argv[2]||'run',quarters=(process.argv[3]||'oldtown,avenue').split(','),tier=process.argv[4]||'low',live=process.env.GAP_LIVE==='1';
const out=path.resolve('work/ncz-gaps',label);fs.mkdirSync(out,{recursive:true});
// GAP_COMPARE=<label of an earlier run>: each face is pictured from the place the earlier run pictured it from, so the two pictures can be laid side by side.
let before=null;try{if(process.env.GAP_COMPARE)before=JSON.parse(fs.readFileSync(path.resolve('work/ncz-gaps',process.env.GAP_COMPARE,'report.json'),'utf8'));}catch{}
const earlier=(q,id)=>before?.quarters?.[q]?.faces?.find(f=>f.id===id)?.player||null;
const OPT={step:Number(process.env.GAP_STEP)||.2,   // 0.2 m: closer than the narrowest gap found so far (0.24 m between two plots)
 heights:[.6,1.4,2.2,3.6,5,6.4],standoff:3,depth:1,margin:.4};
(async()=>{
 const channel=process.env.BROWSER_CHANNEL;const browser=await chromium.launch(channel?{headless:true,channel,args:['--enable-gpu','--ignore-gpu-blocklist']}:{...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox']});
 const report={label,base,tier,options:OPT,quarters:{},errors:[]},text=[];const say=(...a)=>{const s=a.join(' ');console.log(s);text.push(s);};
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720},serviceWorkers:'block',...(process.env.GAP_PROXY?{proxy:{server:process.env.GAP_PROXY}}:{})});page.setDefaultTimeout(1500000);page.on('pageerror',e=>report.errors.push(e.message));
  if(!live){await page.route('https://**/*',r=>r.abort());await page.route('**/api/**',r=>r.fulfill({status:503,body:'offline test'}));await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));}
  await page.addInitScript(q=>{try{localStorage.setItem('void-runner-graphics-v1',JSON.stringify({renderer:'babylon',quality:q,v:2,chosen:true}));}catch{}},tier);
  await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started,null,{timeout:180000});
  report.build=await page.evaluate(()=>{try{return document.documentElement.dataset.build||window.VOID_BUILD||null;}catch{return null;}});
  await page.evaluate(()=>{try{Object.assign(VoidPreparation.limits,{scene:900000,assets:600000,optional:600000,area:900000,total:1800000});}catch{}});
  // the same way in as ncz-views-browser.cjs: a local game that is never saved to an account, set down on the street
  await page.evaluate(async q=>{leaveMenu();state=C.fresh();state.quest='open';state.universe.freeTravel=true;state.story.flags.tutorialSkipped=true;state.location='earth';state.universe.currentSystem='sol';
   Object.assign(state.story.flags,{metAdmin:true,metIris:true,districtDoor:true,districtBadge:true});delete state.story.flags.area;await enterWalking('sacramento',{silent:true,quarter:q});},quarters[0]);
  for(const quarter of quarters){
   if(quarter!==quarters[0])await page.evaluate(q=>enterWalking('sacramento',{silent:true,quarter:q}),quarter);
   await page.waitForFunction(q=>mode==='walking'&&VoidAssets.pending===0&&walkingLocation?.id==='neochinatown'&&(!window.VoidQuarters||walkingLocation.quarter===q),quarter,{timeout:900000});await page.waitForTimeout(live?15000:6000);
   await page.evaluate(()=>{document.querySelectorAll('#notice,.hud-prompt,#mission-banner').forEach(e=>e.style.visibility='hidden');});
   // ---- 1. the asset report ----
   const assets=await page.evaluate(q=>{const sc=VoidBabylon.scene,N=VoidNeoChinatown,A=window.VoidAssets,models=N.modelsFor?N.modelsFor('street'):N.models||{};
    const purchased=Object.entries(models).filter(([id])=>id.startsWith('ncz:')).map(([id,def])=>({id,src:def.src,loaded:!!A?.container?.(id),inScene:sc.meshes.filter(m=>{for(let p=m;p;p=p.parent)if((p.name||'').includes(id))return true;return false;}).length}));
    const club=window.VoidNightclub;let clubModel=null;try{clubModel={id:'ncz:nightclub',src:'assets/models/ncz/nightclub.vrpak',loaded:!!A?.container?.('ncz:nightclub'),built:!!N.nightclub};}catch{}
    const count=re=>sc.meshes.filter(m=>re.test(m.name)&&m.isEnabled()&&m.getTotalVertices()>0).length,byMat={};for(const m of sc.meshes){if(!m.material||!m.getTotalVertices())continue;const k=m.material.name;if(/^ncz-(old|facade|shopfront|club-front)/.test(k))byMat[k]=(byMat[k]||0)+m.getTotalVertices();}
    return {quarter:q,sceneMeshes:sc.meshes.length,purchased,clubModel,fallback:{plotBodies:count(/^old-building/),storefrontStrips:count(/^storefront/),batches:count(/^ncz-batch/),gateParts:count(/^gate-/)},buildingMaterials:byMat};},quarter);
   const Q=await page.evaluate(q=>{const V=window.VoidQuarters,N=VoidNeoChinatown,MK=window.VoidMilked,NC=window.VoidNightclub;if(!V)return null;
    return {streets:V.QUARTERS[q].streets.filter(r=>!NC||r!==NC.RECT),gates:V.gatesOf(q).map(g=>({id:'gate '+g.name,rect:g.rect})),club:NC?{rect:NC.RECT,entry:NC.ENTRY.rect}:null,milked:MK?{door:MK.DOOR,rear:MK.REAR}:null,door:N.door,blocks:walkingLocation.solids.filter(s=>/^city-block-/.test(s.id)).map(s=>({id:s.id,position:s.position,size:s.size})),footprints:N.footprints};},quarter);
   if(!Q){say('This build has no quarters (VoidQuarters is missing): the check needs build 2026-11-16-quarters-1 or later.');break;}
   const usesPurchased=assets.purchased.some(p=>p.loaded&&p.inScene>0),built=usesPurchased?'PURCHASED models + fallback':'FALLBACK (built in code, no purchased model)';   // every picture says which (David, 16 Nov 2026)
   say('\n=== '+quarter.toUpperCase()+' · asset report ===');
   for(const p of assets.purchased)say('  purchased model '+p.id+' ('+p.src+'): '+(p.loaded?'LOADED':'NOT AVAILABLE')+', pieces in the scene: '+p.inScene);
   if(assets.clubModel)say('  purchased model '+assets.clubModel.id+' ('+assets.clubModel.src+'): '+(assets.clubModel.loaded?'LOADED':'NOT AVAILABLE')+(assets.clubModel.built?', built':''));
   say('  built in code (fallback), counted after pieces of one material are merged into one mesh: plot-body meshes '+assets.fallback.plotBodies+', shopfront meshes '+assets.fallback.storefrontStrips+', wall/window batches '+assets.fallback.batches+', gate parts '+assets.fallback.gateParts);
   say('  => this quarter\'s blocks are on '+(usesPurchased?'the PURCHASED city models where they exist, the fallback elsewhere':'the FALLBACK (built in code): no purchased city model is in the scene'));
   if(process.env.GAP_ASSETS_ONLY==='1'){report.quarters[quarter]={assets,usesPurchased};continue;}
   // ---- 2. the expected walls and the rays ----
   const openings=[...Q.gates,
    ...(Q.club?[{id:'NULL passage',rect:[Q.club.entry[0],Q.club.entry[1]+.6,Q.club.entry[2],Q.club.entry[3]]}]:[]),
    ...(Q.milked?[{id:'Milked front door',rect:[Q.milked.door.x-Q.milked.door.half-.3,Q.milked.door.x+Q.milked.door.half+.3,Q.milked.door.z-1.2,Q.milked.door.z]},{id:'Milked rear door',rect:[Q.milked.rear.x-Q.milked.rear.half-.3,Q.milked.rear.x+Q.milked.rear.half+.3,Q.milked.rear.z,Q.milked.rear.z+1.2]}]:[]),
    {id:'District door',rect:[Q.door.x-2,Q.door.x+2,Q.door.z-1.2,Q.door.z+.4]}];
   let faces=G.wallFaces(Q.streets,openings).map((f,i)=>({...f,id:quarter+'-'+f.street+f.side+'-'+Math.round(f.from)+'_'+Math.round(f.to)}));if(process.env.GAP_ONLY)faces=faces.filter(f=>f.id===process.env.GAP_ONLY);
   const qr=report.quarters[quarter]={assets,usesPurchased,openings,faces:[]};let total=0,flagged=0;
   for(const f of faces){const [x0,x1,z0,z1]=Q.streets[f.street],room=(f.axis==='z'?x1-x0:z1-z0)-.8,rays=G.rayGrid(f,{...OPT,room});
    const hits=await page.evaluate(rays=>{const B=BABYLON,sc=VoidBabylon.scene,pred=m=>m.getTotalVertices()>0&&!m.isDisposed();return rays.map(r=>{const ray=new B.Ray(new B.Vector3(...r.origin),new B.Vector3(...r.dir),r.length);
      return (sc.multiPickWithRay(ray,pred)||[]).filter(h=>h.hit).sort((a,b)=>a.distance-b.distance).slice(0,8).map(h=>{const m=h.pickedMesh,mat=m.material;let en=true;for(let p=m;p;p=p.parent)if(p.isEnabled&&!p.isEnabled(false)){en=false;break;}
       return {name:m.name,material:mat?.name||'',distance:+h.distance.toFixed(3),visible:m.isVisible,enabled:en,visibility:m.visibility,alpha:mat?(mat.alpha??1):1};});});},rays);
    const cols=new Map(),gaps=[];rays.forEach((r,i)=>{const c=G.classify(r,hits[i]);const col=cols.get(r.along)||{along:r.along,rows:0,gaps:0};col.rows++;if(c.result==='gap'){col.gaps++;gaps.push({along:+r.along.toFixed(2),y:r.y,wall:r.wall,skipped:c.skipped.slice(0,3)});}cols.set(r.along,col);});
    const present={};hits.forEach((h,i)=>{const c=G.classify(rays[i],h);if(c.result==='wall'){const k=c.by+' ['+c.material+']';present[k]=(present[k]||0)+1;}});
    // the pieces that should meet here: the plots that stand behind this face (from the layout), and for each how many of its rays went through
    const plots=G.plotsBehind(f,Q.blocks).map(p=>{const mine=rays.map((r,i)=>[r,i]).filter(([r])=>r.along>=p.from&&r.along<=p.to),bad=gaps.filter(g=>g.along>=p.from&&g.along<=p.to).length;return {...p,rays:mine.length,gaps:bad};});
    const fr={id:f.id,street:f.street,side:f.side,axis:f.axis,fixed:f.fixed,from:f.from,to:f.to,rays:rays.length,gaps:gaps.length,runs:G.runs([...cols.values()],OPT.step),piecesHit:present,plots,flagged:gaps};qr.faces.push(fr);total+=rays.length;flagged+=gaps.length;
    say('  face '+f.id+' ('+(f.axis==='z'?'x '+f.fixed+', z '+f.from+' to '+f.to:'z '+f.fixed+', x '+f.from+' to '+f.to)+', building to the '+({w:'west',e:'east',s:'south',n:'north'})[f.side]+'): '+gaps.length+' of '+rays.length+' rays pass through'+(gaps.length?'; widest runs: '+fr.runs.sort((a,b)=>b.width-a.width).slice(0,3).map(r=>r.width+' m at '+r.from+'..'+r.to).join(', '):''));
    if(gaps.length||process.env.GAP_ONLY){for(const p of plots)say('      plot body expected at x '+p.rect[0]+'..'+p.rect[1]+', z '+p.rect[2]+'..'+p.rect[3]+' ('+p.block+'): '+p.gaps+' of '+p.rays+' rays pass through');
     say('      pieces the rays did meet: '+(Object.entries(present).map(([k,v])=>k+' x'+v).join(', ')||'none'));}
    // ---- 3. the marked-up picture, from the player's position ----
    if(gaps.length&&process.env.GAP_SHOTS!=='0'){const run=fr.runs.slice().sort((a,b)=>b.rays-a.rays)[0]||{from:f.from,to:f.to},mid=(run.from+run.to)/2,back=Math.min(9,room),pos=earlier(quarter,f.id)||(f.axis==='z'?[f.fixed-f.n[0]*back,mid]:[mid,f.fixed-f.n[1]*back]),yaw=Math.atan2(f.n[0],f.n[1]);
     const near=gaps.filter(g=>Math.abs(g.along-mid)<14);
     await page.evaluate(([pos,yaw])=>{Object.assign(walker,{x:pos[0],z:pos[1],yaw,pitch:-.12});},[pos,yaw]);await page.waitForTimeout(2500);
     const n=await page.evaluate(([near,cap])=>{const B=BABYLON,sc=VoidBabylon.scene,cam=sc.activeCamera,e=sc.getEngine(),rw=e.getRenderWidth(),rh=e.getRenderHeight();document.getElementById('gap-marks')?.remove();
       const c=document.createElement('canvas');c.id='gap-marks';c.width=innerWidth;c.height=innerHeight;c.style.cssText='position:fixed;inset:0;z-index:99999;pointer-events:none';document.body.appendChild(c);const g=c.getContext('2d');let drawn=0;
       for(const p of near){const s=B.Vector3.Project(new B.Vector3(p.wall[0],p.y,p.wall[1]),B.Matrix.Identity(),sc.getTransformMatrix(),cam.viewport.toGlobal(rw,rh));if(s.z<0||s.z>1)continue;const x=s.x*innerWidth/rw,y=s.y*innerHeight/rh;if(x<0||y<0||x>innerWidth||y>innerHeight)continue;g.strokeStyle='#ff2a2a';g.lineWidth=2;g.beginPath();g.moveTo(x-5,y-5);g.lineTo(x+5,y+5);g.moveTo(x+5,y-5);g.lineTo(x-5,y+5);g.stroke();drawn++;}
       g.fillStyle='rgba(0,0,0,.78)';g.fillRect(0,innerHeight-54,innerWidth,54);g.fillStyle='#fff';g.font='15px monospace';g.fillText(cap[0],14,innerHeight-32);g.fillStyle='#ff8a8a';g.fillText(cap[1],14,innerHeight-12);return drawn;},
      [near,['GAP CHECK '+label+' · '+quarter+' · '+built+' · face '+f.id+' · player x '+pos[0].toFixed(1)+', z '+pos[1].toFixed(1)+' looking '+({w:'west',e:'east',s:'south',n:'north'})[f.side],gaps.length+' of '+rays.length+' rays on this face pass through the expected wall (red crosses: where each one crossed the wall line)']]);
     await page.screenshot({path:path.join(out,f.id+'.png')});fr.picture=f.id+'.png';fr.marked=n;fr.player=pos;await page.evaluate(()=>document.getElementById('gap-marks')?.remove());}
    else if(process.env.GAP_SHOTS==='all'||process.env.GAP_ONLY||earlier(quarter,f.id)){const mid=(f.from+f.to)/2,back=Math.min(9,room),pos=earlier(quarter,f.id)||(f.axis==='z'?[f.fixed-f.n[0]*back,mid]:[mid,f.fixed-f.n[1]*back]);await page.evaluate(([pos,yaw,cap])=>{Object.assign(walker,{x:pos[0],z:pos[1],yaw,pitch:-.12});document.getElementById('gap-marks')?.remove();const c=document.createElement('canvas');c.id='gap-marks';c.width=innerWidth;c.height=innerHeight;c.style.cssText='position:fixed;inset:0;z-index:99999;pointer-events:none';document.body.appendChild(c);const g=c.getContext('2d');g.fillStyle='rgba(0,0,0,.78)';g.fillRect(0,innerHeight-54,innerWidth,54);g.fillStyle='#fff';g.font='15px monospace';g.fillText(cap[0],14,innerHeight-32);g.fillStyle='#8affb0';g.fillText(cap[1],14,innerHeight-12);},[pos,Math.atan2(f.n[0],f.n[1]),['GAP CHECK '+label+' · '+quarter+' · '+built+' · face '+f.id+' · player x '+pos[0].toFixed(1)+', z '+pos[1].toFixed(1),'0 of '+rays.length+' rays pass through the expected wall']]);await page.waitForTimeout(2500);await page.screenshot({path:path.join(out,f.id+'.png')});fr.picture=f.id+'.png';await page.evaluate(()=>document.getElementById('gap-marks')?.remove());}}
   qr.rays=total;qr.gaps=flagged;say('  TOTAL '+quarter+': '+flagged+' of '+total+' rays pass through an expected wall, on '+qr.faces.filter(f=>f.gaps).length+' of '+qr.faces.length+' faces');
  }
  if(report.errors.length)say('page errors: '+report.errors.join(' | '));
 }finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,1));fs.writeFileSync(path.join(out,'report.txt'),text.join('\n')+'\n');await browser.close();}
 const bad=Object.values(report.quarters).reduce((a,q)=>a+(q.gaps||0),0);console.log(bad?'GAPS FOUND: '+bad:'NO GAPS');process.exitCode=bad?1:0;
})().catch(e=>{console.error(e);process.exitCode=2;});
