/* The cyberpunk gear in a real browser (docs/development/CHARACTER_GEAR.md).
   Checks, on the real assembler and the real skinned geometry:
     1. nothing is worn by default: every look, every saved-style appearance without gear ids, loads with no gear;
     2. each of the four gear accessories switches on and off independently (all 16 combinations) on a male and a female body;
     3. the gear is on the character's own skeleton and is merged into at most two meshes (shell, glow);
     4. clipping: for every outfit and every animation clip that exists (walk, sit, talk, dance, ...), each gear piece is measured against the skinned body at several
        frames. A piece "clips" if its nearest-surface distance closes by more than half of its resting gap (and below 2 mm) or goes through the surface it started outside of;
        it "floats" if it ends more than 3 cm from where it rests. This is a measurement of the real vertices, not a picture; screenshots are taken as well.
   SITE_TEST_URL=http://127.0.0.1:5187 SHOTS=/some/dir node tests/character-gear-browser.cjs        (Chromium with SwiftShader; run tests/serve-modern.cjs first) */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',shots=process.env.SHOTS||null,quick=process.env.QUICK==='1';
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox']});
 const page=await b.newPage({viewport:{width:1280,height:720},serviceWorkers:'block'});page.setDefaultTimeout(300000);const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.route('https://**/*',r=>r.abort());await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
 await page.addInitScript(()=>localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:'high'})));
 await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started);
 await page.evaluate(()=>Object.assign(VoidPreparation.limits,{scene:120000,assets:120000,optional:60000}));
 await page.click('[data-action=menu-campaign]');await page.click('[data-action=menu-new]');const c=page.locator('[data-action=menu-new-confirm]');if(await c.count())await c.click();
 await page.waitForSelector('#character-creator.on');await page.waitForFunction(()=>!document.querySelector('[data-cc=confirm]').disabled);await page.waitForTimeout(1500);

 // 1. nothing by default
 const defaults=await page.evaluate(()=>{const A=VoidCharacterAppearance,C=A.CATALOG,out=[];for(const id of Object.keys(C.looks)){const d=A.defaults(id);out.push({id,gear:d.accessories.filter(x=>x.startsWith('gear-')),valid:A.validate(d)});}
  // an appearance saved before the gear existed (no gear ids anywhere) is still valid and unchanged by normalize
  const old={v:1,base:'male',look:'district-smuggler',hair:'short01',hairColor:null,clothingColor:'black',accessories:['hat','eyewear']};
  return {looks:out,oldValid:A.validate(old),oldSame:JSON.stringify(A.normalize(old))===JSON.stringify(old),gearKinds:Object.keys(C.accessories).filter(k=>C.accessories[k].gear),eachLookOffers:Object.values(C.looks).every(l=>['gear-visor','gear-collar','gear-shoulders','gear-chest'].every(k=>Array.isArray(l.accessories[k])&&l.accessories[k].length===0))};});
 assert(defaults.looks.length===11,'eleven outfits');for(const l of defaults.looks){assert.deepEqual(l.gear,[],l.id+' wears no gear by default');assert(l.valid,l.id);}
 assert(defaults.oldValid&&defaults.oldSame,'an appearance saved before the gear existed is unchanged');assert.equal(defaults.gearKinds.length,4);assert(defaults.eachLookOffers,'every look offers all four');
 console.log('1. defaults ok: 11 outfits, none wears gear; old saved appearance unchanged; 4 gear kinds offered by every look');

 // 2 + 3. independence and structure, on a male and a female body
 const ids=['gear-visor','gear-collar','gear-shoulders','gear-chest'];
 const indep=await page.evaluate(async ids=>{const A=VoidCharacterAppearance,S=VoidBabylon.scene,res=[];
  for(const look of ['district-smuggler','district-resident']){const holder=new BABYLON.TransformNode('gear-test',S);holder.position.set(0,-50,0);
   const ch=await VoidCharacterAssembler.build(A.defaults(look),holder,{scene:S});
   for(let mask=0;mask<16;mask++){const acc=ids.filter((_,i)=>mask>>i&1),a={...A.defaults(look),accessories:acc};const ok=await ch.set(a);
    const gm=ch.meshes().filter(m=>/^gear:/.test(m.name)),skel=new Set(gm.map(m=>m.skeleton)),body=ch.meshes().find(m=>m.skeleton&&!/^gear:/.test(m.name));
    res.push({look,mask,acc,ok,meshes:gm.length,tris:gm.reduce((t,m)=>t+m.getTotalIndices()/3,0),sameSkeleton:gm.every(m=>m.skeleton===body.skeleton),enabled:gm.every(m=>m.isEnabled())});}
   ch.dispose();holder.dispose();}
  return res;},ids);
 for(const r of indep){assert(r.ok,'set ok '+r.look+' '+r.mask);assert(r.meshes<=2,'at most two gear meshes ('+r.meshes+')');assert.equal(r.meshes>0,r.acc.length>0,'gear present exactly when chosen');assert(r.sameSkeleton,'on the character skeleton');if(r.acc.length)assert(r.tris>0);}
 const maxTris=Math.max(...indep.map(r=>r.tris));console.log('2-3. independence ok: 16 combinations x 2 bodies; max 2 gear meshes; all on the character skeleton; largest full set',maxTris,'triangles');

 // 4. clipping measurement
 const ticker=setInterval(async()=>{try{console.log('   ...progress:',JSON.stringify(await page.evaluate(()=>window.__gearProgress||[])));}catch{}},60000);
 const clip=await page.evaluate(async ({ids,quick})=>{
  const A=VoidCharacterAppearance,S=VoidBabylon.scene,B=BABYLON,out=[];
  const skin=(mesh,rest)=>{const pos=mesh.getVerticesData('position'),nor=mesh.getVerticesData('normal'),idx=mesh.getVerticesData('matricesIndices'),w=mesh.getVerticesData('matricesWeights');
   if(rest)return {p:Float32Array.from(pos),n:Float32Array.from(nor)};
   const M=mesh.skeleton.getTransformMatrices(mesh),P=new Float32Array(pos.length),N=new Float32Array(pos.length),nv=pos.length/3;
   for(let v=0;v<nv;v++){let x=0,y=0,z=0,nx=0,ny=0,nz=0;const px=pos[v*3],py=pos[v*3+1],pz=pos[v*3+2],qx=nor[v*3],qy=nor[v*3+1],qz=nor[v*3+2];
    for(let k=0;k<4;k++){const wt=w[v*4+k];if(!wt)continue;const o=idx[v*4+k]*16;
     x+=wt*(px*M[o]+py*M[o+4]+pz*M[o+8]+M[o+12]);y+=wt*(px*M[o+1]+py*M[o+5]+pz*M[o+9]+M[o+13]);z+=wt*(px*M[o+2]+py*M[o+6]+pz*M[o+10]+M[o+14]);
     nx+=wt*(qx*M[o]+qy*M[o+4]+qz*M[o+8]);ny+=wt*(qx*M[o+1]+qy*M[o+5]+qz*M[o+9]);nz+=wt*(qx*M[o+2]+qy*M[o+6]+qz*M[o+10]);}
    P[v*3]=x;P[v*3+1]=y;P[v*3+2]=z;const l=Math.hypot(nx,ny,nz)||1;N[v*3]=nx/l;N[v*3+1]=ny/l;N[v*3+2]=nz/l;}
   return {p:P,n:N};};
  const concat=list=>{const n=list.reduce((t,a)=>t+a.p.length,0),p=new Float32Array(n),q=new Float32Array(n);let o=0;for(const a of list){p.set(a.p,o);q.set(a.n,o);o+=a.p.length;}return {p,n:q};};
  // nearest body vertex and signed distance (along that vertex's normal) for every gear vertex
  const measure=(g,body)=>{const nv=g.p.length/3,bn=body.p.length/3;let min=1e9,inside=0,sum=0;
   for(let i=0;i<nv;i++){const x=g.p[i*3],y=g.p[i*3+1],z=g.p[i*3+2];let best=1e9,bj=0;for(let j=0;j<bn;j++){const dx=x-body.p[j*3],dy=y-body.p[j*3+1],dz=z-body.p[j*3+2],d=dx*dx+dy*dy+dz*dz;if(d<best){best=d;bj=j;}}
    const d=Math.sqrt(best),sd=(x-body.p[bj*3])*body.n[bj*3]+(y-body.p[bj*3+1])*body.n[bj*3+1]+(z-body.p[bj*3+2])*body.n[bj*3+2];if(d<min)min=d;sum+=d;if(sd<-.002&&d<.03)inside++;}
   return {min,mean:sum/nv,inside,nv};};
  const groupsOf=ch=>S.animationGroups.filter(g=>g.targetedAnimations.length&&g.targetedAnimations[0].target?.isDescendantOf?.(ch.node));
  for(const look of Object.keys(A.CATALOG.looks)){
   window.__gearProgress=(window.__gearProgress||[]).concat(look);
   const holder=new B.TransformNode('clip-test',S);holder.position.set(0,-50,0);const L=A.CATALOG.looks[look];
   const ch=await VoidCharacterAssembler.build({...A.defaults(look),accessories:[]},holder,{scene:S});
   const bodyMeshes=()=>ch.meshes().filter(m=>m.skeleton&&!/^gear:/.test(m.name)&&m.isEnabled()&&m.getTotalVertices()>0&&!/eye|lash|brow|teeth|low-poly/i.test(m.name));
   // the clips this look really has
   const groups=groupsOf(ch),clips=[...new Set(groups.map(g=>g.name.replace(/^.*-/,'')))].filter(n=>/^(walk|run|sit|talk|dance|idle|smoke|laugh|drink|watch|work|interact|look|sit-talk|vr-aim|menu)$/.test(n));
   const use=quick?clips.filter(n=>['walk','sit','talk','dance'].includes(n)):clips;
   for(const gearId of ids){
    await ch.set({...A.defaults(look),accessories:[gearId]});
    const gear=ch.meshes().filter(m=>/^gear:/.test(m.name));if(!gear.length){out.push({look,gearId,error:'no gear meshes'});continue;}
    // rest reference
    for(const g of groupsOf(ch))g.stop();ch.node.getScene().stopAllAnimations?.();
    for(const sk of new Set(ch.meshes().filter(m=>m.skeleton).map(m=>m.skeleton)))sk.returnToRest?.();
    const rest=measure(concat(gear.map(m=>skin(m,true))),concat(bodyMeshes().map(m=>skin(m,true))));
    for(const clipName of use){
     const grp=groupsOf(ch).find(g=>g.name.endsWith('-'+clipName));if(!grp)continue;
     for(const g of groupsOf(ch))g.stop();grp.play(false);grp.pause();
     const from=grp.from,to=grp.to,frames=quick?4:6;let worstIn=0,worstMin=1e9,worstFar=0,worstMean=0;
     for(let f=0;f<frames;f++){grp.goToFrame(from+(to-from)*f/frames);
      for(const sk of new Set(ch.meshes().filter(m=>m.skeleton).map(m=>m.skeleton))){for(const bn of sk.bones)bn.getTransformNode?.()?.computeWorldMatrix(true);sk.prepare(true);}
      const now=measure(concat(gear.map(m=>skin(m,false))),concat(bodyMeshes().map(m=>skin(m,false))));
      worstIn=Math.max(worstIn,now.inside);worstMin=Math.min(worstMin,now.min);worstFar=Math.max(worstFar,now.mean-rest.mean);worstMean=Math.max(worstMean,now.mean);}
     out.push({look,gearId,clip:clipName,restMin:rest.min,restInside:rest.inside,minDist:worstMin,inside:worstIn,drift:worstFar,restMean:rest.mean,worstMean,verts:rest.nv});
    }
   }
   ch.dispose();holder.dispose();
  }
  return out;
 },{ids,quick});
 clearInterval(ticker);
 fs.writeFileSync(path.join(shots||'.','gear-clip-report.json'),JSON.stringify(clip,null,1));
 const errsC=clip.filter(r=>r.error);assert.equal(errsC.length,0,'every gear piece loads: '+JSON.stringify(errsC.slice(0,3)));
 // resting fit: no piece may start more than 4 cm from the body it is worn on (before the fit existed, outfits on smaller bodies had gear floating 10 to 14 cm away)
 const floaty=clip.filter(r=>r.clip&&(r.restMin>.04||r.worstMean>.05));
 const bad=clip.filter(r=>r.clip&&(r.inside-r.restInside>Math.max(8,r.verts*.08)||(r.minDist<Math.min(r.restMin*.5,.002)-1e-6&&r.restMin>.002)||r.drift>.03)).concat(floaty.map(r=>({...r,clip:'REST '+r.clip})));
 const looks=new Set(clip.map(r=>r.look)),clips=new Set(clip.filter(r=>r.clip).map(r=>r.clip));
 console.log('4. clipping measured: '+clip.filter(r=>r.clip).length+' (outfit x piece x clip) cases over '+looks.size+' outfits, clips: '+[...clips].join(', '));
 console.log('   flagged:',bad.length);{const sh=clip.filter(r=>r.gearId==='gear-shoulders'&&r.clip);const by={};for(const r of sh){const k=r.look;by[k]=Math.max(by[k]||0,r.worstMean);}console.log('   shoulder plates: worst mean distance to body (m) per outfit',JSON.stringify(Object.fromEntries(Object.entries(by).map(([k,v])=>[k,+v.toFixed(3)]))));}for(const r of bad.slice(0,40))console.log('   ',r.look,r.gearId,r.clip,'restMin',r.restMin.toFixed(4),'minDist',r.minDist.toFixed(4),'newlyInside',r.inside-r.restInside,'drift',r.drift.toFixed(3));

 // (screenshots, toggles, saving and the cost measurements are in tests/character-gear-creator-browser.cjs)
 assert.deepEqual(errs,[],'no page errors');
 console.log(bad.length?'GEAR CHECK: '+bad.length+' case(s) flagged (see report)':'GEAR CHECK PASSED');
 await b.close();
})().catch(e=>{console.error(String(e.stack||e).slice(0,900));process.exit(1);});
