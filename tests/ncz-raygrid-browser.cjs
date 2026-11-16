/* The ray-grid gap check for one block's street walls (the repeatable 3D check David asked for; docs/development/NEOCHINATOWN_REMAKE.md). Not part of npm test.
     node tests/ncz-raygrid-browser.cjs <base-url> <low|medium> <out-dir> <oldtown-block|port> <new|old> [label]
   WALLS and OPENINGS come from the game's own data (VoidOldTownBlock.WALLS / .OPENINGS, or VoidPortData.WALLS / .OPENINGS).
   For every wall: rays STEP m apart along it and YSTEP m apart in height, from the ground to the wall's declared height, each starting OFF m in front of the
   street line and travelling straight into the wall. A ray is FLAGGED when it passes more than the wall's `depth` behind the street line without meeting a
   drawn, solid surface. NOT counted as surfaces: anything invisible or switched off (collision boxes are not drawn at all), signs, screens, advertisement
   boards, lit pictures, window glass sheets, light effects, decals, puddles, the ground, the sky, people, and thin-instanced props. A declared opening is
   still checked, to its own depth (what is behind it must be closed too).
   `old` switches the remade block (or Port) off before the street is built, so the SAME walls are checked on the old build: that is the BEFORE.
   Saves <out>/raygrid-<which>.json and marked-up screenshots (flagged rays as red bars on the street line) from player positions. */
'use strict';
const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
const [base,tier='low',out='out',what='oldtown-block',which='new',label='']=process.argv.slice(2);fs.mkdirSync(out,{recursive:true});
const SHOTS={'oldtown-block':[['wall-from-the-road',61,-47,1.5708,-.18],['alley-corner-north',64.5,-52.5,1.2,-.25],['alley-corner-south',64.5,-64.5,1.9,-.25],['alley-mouth',66.5,-58.5,1.5708,-.12],['south-end',63,-66,1.2,-.2],['north-end',63,-33,1.9,-.2],['milked-street-side',76,-72.5,0,-.3]],
 port:[['west',31,-96,-1.5708,-.22],['north',25,-103,0,-.22],['south',25,-89,3.1416,-.2],['lane-east',38,-99,1.5708,-.25],['customs',40.7,-98,3.1416,-.2]]}[what];
(async()=>{
 const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox']});
 const page=await b.newPage({viewport:{width:1600,height:900},serviceWorkers:'block'});page.setDefaultTimeout(2400000);const errs=[];page.on('pageerror',e=>errs.push(e.message));page.on('console',m=>{if(/\[Port\]|\[Block\]|\[kit\]/.test(m.text()))errs.push('console: '+m.text().slice(0,500));});
 await page.route('https://**/*',r=>r.abort());await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
 await page.addInitScript(q=>localStorage.setItem('void-runner-graphics-v1',JSON.stringify({renderer:'babylon',quality:q,v:2,chosen:true})),tier);
 await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started);
 await page.evaluate(()=>{Object.assign(VoidPreparation.limits,{scene:1800000,assets:1200000,optional:1200000,area:1800000,total:3600000});});
 await page.click('[data-action=menu-campaign]');await page.click('[data-action=menu-new]');const c=page.locator('[data-action=menu-new-confirm]');if(await c.count())await c.click();
 await page.waitForSelector('#character-creator.on');await page.waitForFunction(()=>!document.querySelector('[data-cc=confirm]').disabled);await page.locator('[data-cc=confirm]').click();
 await page.waitForFunction(()=>mode==='pod-waking'&&walker);await page.waitForTimeout(2500);await page.evaluate(()=>document.querySelector('#pod-wake [data-pod=exit]').click());await page.waitForFunction(()=>mode==='walking');
 const quarter=what==='port'?'port':'oldtown';
 await page.evaluate(([what,which,q])=>{if(what==='port'&&window.VoidPort)VoidPort.enabled=which==='new';if(what==='oldtown-block'&&window.VoidOldTownBlock)VoidOldTownBlock.enabled=which==='new';delete state.story.flags.area;state.story.flags.shipAccess='owned';return enterWalking('sacramento',{silent:true,quarter:q});},[what,which,quarter]);
 await page.waitForFunction(q=>mode==='walking'&&walkingLocation?.quarter===q,quarter);await page.waitForFunction(()=>!window.VoidAssets||VoidAssets.pending===0,null,{timeout:900000}).catch(()=>{});await page.waitForTimeout(tier==='low'?9000:20000);
 const rep=await page.evaluate(([what,STEP,YSTEP,OFF])=>{const sc=VoidBabylon.scene||BABYLON.EngineStore.LastCreatedScene,src=what==='port'?VoidPortData:VoidOldTownBlock,dist=VoidBabylon.district||{};
  const skip=/rain|wash|cone|shade|marks|-lit$|windows|window-|puddle|ground|neon|sign|blade|billboard|kiosk|decal|graffiti|glow|(^|-)ad-|sky|smog|skyline|steam|puff|taxi|kit-cone|gap-mark|crowd|character|lantern|pool/i;
  const person=m=>{for(let a=m;a;a=a.parent)if(a.metadata?.crowd||a.metadata?.nightlife||a.metadata?.alley||a.metadata?.character)return true;return false;};
  const pred=m=>m.isEnabled()&&m.isVisible&&m.visibility>0&&m.material&&m.getTotalVertices()>0&&!m.hasThinInstances&&!m.skeleton&&!skip.test(m.name||'')&&!skip.test(m.material.name||'')&&m.material.alphaMode!==BABYLON.Engine.ALPHA_ADD&&(m.material.alpha===undefined||m.material.alpha>.9)&&!person(m);
  const walls=[],flags=[];let rays=0;
  for(const w of src.WALLS){const dx=w.b[0]-w.a[0],dz=w.b[1]-w.a[1],len=Math.hypot(dx,dz),tx=dx/len,tz=dz/len,n=w.normal,row={id:w.id,length:+len.toFixed(1),height:w.height,rays:0,flagged:0,inOpenings:0,flaggedInOpenings:0};
   for(let s=STEP/2;s<len;s+=STEP)for(let y=.15;y<w.height;y+=YSTEP){const op=src.OPENINGS.find(o=>o.wall===w.id&&s>=o.from&&s<=o.to&&y<=o.height),depth=op?op.depth:w.depth;
     const o=new BABYLON.Vector3(w.a[0]+tx*s+n[0]*OFF,y,w.a[1]+tz*s+n[1]*OFF),dir=new BABYLON.Vector3(-n[0],0,-n[1]),h=sc.pickWithRay(new BABYLON.Ray(o,dir,OFF+depth),pred);rays++;row.rays++;if(op)row.inOpenings++;
     if(!h||!h.hit){const far=sc.pickWithRay(new BABYLON.Ray(o,dir,2000),pred);row.flagged++;if(op)row.flaggedInOpenings++;flags.push({wall:w.id,s:+s.toFixed(2),y:+y.toFixed(2),x:+(w.a[0]+tx*s).toFixed(2),z:+(w.a[1]+tz*s).toFixed(2),n,opening:op?.id||null,beyond:far?.hit?far.pickedMesh.name:'nothing',beyondAt:far?.hit?+far.distance.toFixed(2):null});}}
   walls.push(row);}
  if(flags.length){const m=new BABYLON.StandardMaterial('gap-mark',sc);m.disableLighting=true;m.emissiveColor=new BABYLON.Color3(1,.04,.04);m.diffuseColor=BABYLON.Color3.Black();m.fogEnabled=false;const bx=BABYLON.MeshBuilder.CreateBox('gap-mark',{size:1},sc);bx.material=m;bx.isPickable=false;bx.renderingGroupId=1;
   const mats=new Float32Array(flags.length*16);flags.forEach((f,i)=>{BABYLON.Matrix.Compose(new BABYLON.Vector3(f.n[0]?.05:STEP*.8,YSTEP*.8,f.n[0]?STEP*.8:.05),BABYLON.Quaternion.Identity(),new BABYLON.Vector3(f.x+f.n[0]*.04,f.y,f.z+f.n[1]*.04)).copyToArray(mats,i*16);});bx.thinInstanceSetBuffer('matrix',mats,16,true);bx.alwaysSelectAsActiveMesh=true;sc.effectLayers?.find(l=>l.name==='void-glow')?.addExcludedMesh(bx);}
  const packIds=Object.keys(VoidNeoChinatown.models||{}).filter(k=>/^ncz:/.test(k)),pack=Object.fromEntries(packIds.map(k=>[k,!!VoidAssets.container?.(k)]));
  const seen={};for(const f of flags)if(!f.opening){seen[f.beyond]=(seen[f.beyond]||0)+1;}
  // group the flagged rays outside openings into gaps: runs that touch each other on one wall
  const gaps=[];for(const f of flags.filter(f=>!f.opening)){let g=gaps.find(g=>g.wall===f.wall&&f.s>=g.s0-STEP*1.5&&f.s<=g.s1+STEP*1.5&&f.y>=g.y0-YSTEP*1.5&&f.y<=g.y1+YSTEP*1.5);if(!g)gaps.push(g={wall:f.wall,s0:f.s,s1:f.s,y0:f.y,y1:f.y,x0:f.x,x1:f.x,z0:f.z,z1:f.z,rays:0,beyond:{}});g.s0=Math.min(g.s0,f.s);g.s1=Math.max(g.s1,f.s);g.y0=Math.min(g.y0,f.y);g.y1=Math.max(g.y1,f.y);g.x0=Math.min(g.x0,f.x);g.x1=Math.max(g.x1,f.x);g.z0=Math.min(g.z0,f.z);g.z1=Math.max(g.z1,f.z);g.rays++;g.beyond[f.beyond]=(g.beyond[f.beyond]||0)+1;}
  gaps.sort((p,q)=>q.rays-p.rays);
  return {rules:{STEP,YSTEP,OFF,walls:src.WALLS,openings:src.OPENINGS},rays,flagged:flags.length,flaggedOutsideOpenings:flags.filter(f=>!f.opening).length,walls,seenThroughGaps:seen,gaps:gaps.slice(0,30),
   assets:{remadeBlock:!!dist.block,remadePort:!!dist.port,buildingsAre:(dist.block||dist.port)?'built in code by the city kit from the game\'s existing textures (FALLBACK class: no purchased model)':'the old procedural blocks (FALLBACK: no purchased model)',purchasedCityPack:{files:packIds,loaded:pack,anyLoaded:Object.values(pack).some(Boolean),drawnOnThisBlock:false,note:'the pack\'s one use (Main Street west, z -76.6 to -49.4) is switched off while the nightclub front is enabled: '+!!window.VoidNightclub?.enabled?.()}},flags:flags.slice(0,3000)};},[what,.2,.25,.6]);
 console.log('ASSETS',JSON.stringify(rep.assets));console.log('RAY GRID',what,which,tier,JSON.stringify({rays:rep.rays,flagged:rep.flagged,outsideOpenings:rep.flaggedOutsideOpenings,walls:rep.walls,seenThroughGaps:rep.seenThroughGaps}));console.log('GAPS',JSON.stringify(rep.gaps.slice(0,8)));
 fs.writeFileSync(path.join(out,'raygrid-'+what+'-'+which+'-'+tier+'.json'),JSON.stringify(rep,null,1));
 // marked-up pictures from player positions; plus a close-up of the largest gap (or of GAP_AT="x,y,z,yaw,pitch" to re-shoot the same spot afterwards)
 const shots=SHOTS.slice();const g=rep.gaps[0];let close=process.env.GAP_AT?process.env.GAP_AT.split(',').map(Number):null;
 if(!close&&g){const w=rep.rules.walls.find(w=>w.id===g.wall),cx=(g.x0+g.x1)/2,cz=(g.z0+g.z1)/2,cy=(g.y0+g.y1)/2,d=Math.max(2.2,Math.min(6,(g.y1-g.y0)*1.2+2));close=[cx+w.normal[0]*d,1.7,cz+w.normal[1]*d,Math.atan2(-w.normal[0],-w.normal[1]),-Math.atan2(cy-1.7,d)];console.log('GAP_AT='+close.map(v=>+v.toFixed(3)).join(','));}
 if(close)shots.push(['gap-close-up',close[0],close[2],close[3],close[4]]);
 await page.evaluate(()=>{const st=document.createElement('style');st.textContent='body *:not(canvas){visibility:hidden!important} canvas{visibility:visible!important}';document.head.appendChild(st);});
 for(const [name,x,z,yaw,pitch] of shots){await page.evaluate(async v=>{const set=()=>{walker.x=v[0];walker.z=v[1];walker.yaw=v[2];walker.pitch=v[3];walker.vx=walker.vz=0;};set();const sc=VoidBabylon.scene;if(window.__hold)sc.onBeforeRenderObservable.remove(window.__hold);window.__hold=sc.onBeforeRenderObservable.add(set);await new Promise(r=>setTimeout(r,3500));},[x,z,yaw,pitch]);await page.screenshot({path:path.join(out,name+'-'+which+'-'+tier+'.png')});}
 console.log('errors',JSON.stringify(errs.slice(0,6)));await b.close();
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
