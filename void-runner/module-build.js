/* MODULAR INTERIORS: the 3D build of one cluster of modules (modules.js has the data and the walking area, module-integration.js the way in and out; docs/development/MODULES.md).
   It takes over VoidApartments.build for a walking area with `modular` (the older apartment set's rooms, `legacyPart`, still go to apartment-build.js).
   Art direction (docs/VOID_RUNNER_ART_DIRECTION.md, PERMANENT DIRECTION): dark, lived-in, practical light sources, real materials, no glowing outlines. Surfaces use the game's
   own CC0 PBR sets (assets/textures/ncz: ambientCG concrete, metal; assets/textures/district-interior: the kit's paint, tile, steel, gunmetal, canvas) and canvas textures drawn
   here (carpet tiles, ceiling grids, block walls, raised-floor tiles, rack fronts and their LEDs, screens, signs, the skyline). Props: the repository's own models
   (milked-office-chair, milked-pothos, milked-bamboo, props/crate; CC0 / owner generated, assets/models/CREDITS.md) as instances on Medium and High, stand-ins on Low.
   Performance: every static piece of every module is merged into one mesh per material (materials are shared by all the modules of the cluster), so a cluster is a few
   dozen draw calls whatever its size; the doors, LEDs and screens are the only moving parts. One real light per module on Medium (two on High), one for the whole cluster on
   Low; the rest are emissive fixtures. Everything made here is disposed on leaving and the scene's mood is put back.
   build({scene, parent, quality, def}) -> {tick(time, player), dispose(), lights(on, mod), lightsOn, toggle(object, mod), screen(mod, on), doors, accessPoint(ap, state), stats()}. */
(function(root){
 'use strict';
 const A=root.VoidApartments,M=root.VoidModules;if(!A||!M||typeof A.build!=='function')return;
 const base=typeof document!=='undefined'&&document.currentScript?new URL('.',document.currentScript.src):null,url=p=>base?new URL(p,base).href:p;
 const legacy=A.build;
 A.build=function(args){const d=args&&args.def;if(d&&d.modular&&!d.legacyPart)return build(args);return legacy.apply(this,arguments);};
 const PI=Math.PI,HALF=PI/2;

 function build({scene,parent,quality,def}){
  const B=root.BABYLON,low=quality==='low',hi=quality==='high'||quality==='ultra',C=def.cluster;
  const own=[],late=[],containers=[],props=[],rootN=new B.TransformNode('modules-'+C.id,scene);rootN.parent=parent;let disposed=false;
  // ---- the scene's mood: an interior at night (put back on dispose) ----
  const ip=scene.imageProcessingConfiguration,prev={clear:scene.clearColor.clone(),fogMode:scene.fogMode,fogDensity:scene.fogDensity,fogColor:scene.fogColor.clone(),exposure:ip.exposure,contrast:ip.contrast,env:scene.environmentIntensity};
  const sun=scene.getLightByName('sun'),amb=scene.getLightByName('ambient'),lp={sun:sun?.intensity,amb:amb?.intensity,dif:amb?.diffuse?.clone(),gnd:amb?.groundColor?.clone()};
  const MOOD={corp:{amb:'#a4acb8',gnd:'#5a5650',ai:1.15,exp:1.4,env:.45,clear:[.01,.012,.016]},tech:{amb:'#8aa0bc',gnd:'#3a4250',ai:1,exp:1.5,env:.4,clear:[.008,.01,.014]},
   back:{amb:'#aaa898',gnd:'#4a4640',ai:1.1,exp:1.35,env:.4,clear:[.012,.012,.011]},clinic:{amb:'#b8c4c8',gnd:'#343838',ai:1.05,exp:1.3,env:.45,clear:[.012,.014,.015]}}[def.style]||{amb:'#9aa0a8',gnd:'#222',ai:.75,exp:1.25,env:.3,clear:[.01,.01,.012]};
  scene.clearColor=new B.Color4(...MOOD.clear,1);scene.fogMode=B.Scene.FOGMODE_EXP2;scene.fogDensity=.01;scene.fogColor=new B.Color3(...MOOD.clear);ip.exposure=MOOD.exp;ip.contrast=1.18;scene.environmentIntensity=MOOD.env;
  if(sun)sun.intensity=0;if(amb){amb.intensity=MOOD.ai;amb.diffuse=B.Color3.FromHexString(MOOD.amb);if(amb.groundColor)amb.groundColor=B.Color3.FromHexString(MOOD.gnd);}
  let seed=7;for(const m of C.mods)for(const ch of m.id+m.type)seed=(seed*31+ch.charCodeAt(0))%2147483646+1;const rand=()=>((seed=seed*16807%2147483647)-1)/2147483646;
  // ---- materials (shared by every module of the cluster) ----
  const texCache=new Map(),T=(file)=>{if(texCache.has(file))return texCache.get(file);const t=new B.Texture(url('assets/textures/'+file),scene,false,true);t.wrapU=t.wrapV=B.Texture.WRAP_ADDRESSMODE;own.push(t);texCache.set(file,t);return t;};
  const mats=new Map(),parts=new Map();
  function P(key,{c='#808080',tex=null,nrm=null,tile=2,rough=.8,metal=0,em=null,alpha=1,dyn=null,emTex=null,unlit=false,nrmLevel=.8}={}){if(mats.has(key))return mats.get(key);let m;
   if(unlit){m=new B.StandardMaterial('mod-'+key,scene);m.diffuseColor=B.Color3.Black();m.specularColor=B.Color3.Black();m.disableLighting=true;if(dyn){m.emissiveTexture=dyn;m.emissiveColor=B.Color3.Black();}else m.emissiveColor=B.Color3.FromHexString(em||c);if(alpha<1)m.alpha=alpha;m.backFaceCulling=false;}
   else{m=new B.PBRMaterial('mod-'+key,scene);m.albedoColor=B.Color3.FromHexString(c);m.roughness=rough;m.metallic=metal;m.usePhysicalLightFalloff=false;m.environmentIntensity=.55;m.directIntensity=1.2;
    if(tex)m.albedoTexture=T(tex);if(dyn)m.albedoTexture=dyn;if(nrm&&!low){m.bumpTexture=T(nrm);m.bumpTexture.level=nrmLevel;}if(em)m.emissiveColor=B.Color3.FromHexString(em);if(emTex){m.emissiveTexture=emTex;m.emissiveColor=new B.Color3(1.4,1.4,1.4);}if(alpha<1){m.alpha=alpha;m.transparencyMode=2;}m.maxSimultaneousLights=6;}
   m.metadata={tile};own.push(m);mats.set(key,m);return m;}
  const canvas=(w,h,draw,name='mod-tex')=>{const t=new B.DynamicTexture(name,{width:w,height:h},scene,true);own.push(t);draw(t.getContext(),w,h);t.update();t.wrapU=t.wrapV=B.Texture.WRAP_ADDRESSMODE;return t;};
  // ---- geometry: static pieces are collected per material and merged at the end ----
  let cur=rootN;   // the node new pieces belong to (a module's own node: local metres, turned with it)
  const add=(m,mat,dynamic)=>{m.material=mat;m.isPickable=false;m.parent=cur;if(dynamic)return m;if(!parts.has(mat))parts.set(mat,[]);parts.get(mat).push(m);return m;};
  function bx(mat,[w,h,d],[x,y,z],ry=0,dynamic=false){const t=(mat.metadata&&mat.metadata.tile)||1,fu=[[w,h],[w,h],[d,h],[d,h],[w,d],[w,d]].map(([a,b])=>new B.Vector4(0,0,Math.max(.05,a/t),Math.max(.05,b/t)));
   const m=B.MeshBuilder.CreateBox('mod-box',{width:w,height:h,depth:d,faceUV:fu,wrap:true},scene);m.position.set(x,y,z);m.rotation.y=ry;return add(m,mat,dynamic);}
  const box2=(mat,x0,x1,y0,y1,z0,z1,dyn)=>bx(mat,[Math.max(.001,x1-x0),Math.max(.001,y1-y0),Math.max(.001,z1-z0)],[(x0+x1)/2,(y0+y1)/2,(z0+z1)/2],0,dyn);
  function cyl(mat,d,h,[x,y,z],tess=12,rx=0,rz=0,top=null,dyn=false){const m=B.MeshBuilder.CreateCylinder('mod-cyl',{diameterBottom:d,diameterTop:top??d,height:h,tessellation:tess},scene);m.position.set(x,y,z);m.rotation.x=rx;m.rotation.z=rz;return add(m,mat,dyn);}
  function plane(mat,w,h,[x,y,z],ry=0,dynamic=false,rx=0,uv=null){const o={width:w,height:h};if(uv){o.frontUVs=uv;o.backUVs=uv;o.sideOrientation=B.Mesh.DOUBLESIDE;}const m=B.MeshBuilder.CreatePlane('mod-plane',o,scene);m.position.set(x,y,z);m.rotation.y=ry;m.rotation.x=rx;return add(m,mat,dynamic);}
  function torus(mat,d,th,[x,y,z],rx=0,ry=0){const m=B.MeshBuilder.CreateTorus('mod-torus',{diameter:d,thickness:th,tessellation:16},scene);m.position.set(x,y,z);m.rotation.x=rx;m.rotation.y=ry;return add(m,mat);}
  function merge(){let n=0;for(const [mat,list] of parts){if(!list.length)continue;const mm=list.length>1?B.Mesh.MergeMeshes(list,true,true,undefined,false,false):list[0];if(!mm)continue;mm.name='mod-merged-'+mat.name;mm.material=mat;mm.parent=list.length>1?null:mm.parent;mm.isPickable=false;if(mm.parent===null&&parent)mm.parent=null;mm.freezeWorldMatrix();own.push(mm);n++;}parts.clear();return n;}
  // ---- textures drawn here ----
  const grime=(g,w,h,k=1)=>{for(let i=0;i<60*k;i++){const x=rand()*w,y=rand()*h,r=4+rand()*40;const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(10,8,4,'+(.04+rand()*.1)*k+')');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);}};
  const speck=(g,w,h,n,a=.05)=>{for(let i=0;i<n;i++){const v=rand();g.fillStyle='rgba('+(v<.5?'0,0,0,':'255,255,255,')+(a*.4+rand()*a)+')';g.fillRect(rand()*w,rand()*h,1+rand()*2,1+rand()*2);}};
  const TX={};
  TX.carpet=()=>TX._c??=canvas(512,512,(g,w,h)=>{g.fillStyle='#363b44';g.fillRect(0,0,w,h);const n=4,s=w/n;for(let i=0;i<n;i++)for(let j=0;j<n;j++){const v=((i+j)%2?6:-4)+(rand()-.5)*6;g.fillStyle='rgba('+(v>0?'255,255,255,':'0,0,0,')+Math.abs(v)/120+')';g.fillRect(i*s,j*s,s,s);
    g.save();g.beginPath();g.rect(i*s,j*s,s,s);g.clip();g.strokeStyle='rgba(120,130,150,.06)';g.lineWidth=2;for(let k=-s;k<s*2;k+=7){g.beginPath();if((i+j)%2){g.moveTo(i*s+k,j*s);g.lineTo(i*s+k,j*s+s);}else{g.moveTo(i*s,j*s+k);g.lineTo(i*s+s,j*s+k);}g.stroke();}g.restore();}
   speck(g,w,h,9000,.05);g.strokeStyle='rgba(0,0,0,.35)';g.lineWidth=1.5;for(let i=0;i<=n;i++){g.beginPath();g.moveTo(i*s,0);g.lineTo(i*s,h);g.stroke();g.beginPath();g.moveTo(0,i*s);g.lineTo(w,i*s);g.stroke();}
   for(let i=0;i<5;i++){const x=rand()*w,y=rand()*h,r=30+rand()*70,gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(0,0,0,.18)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);}},'mod-carpet');
  TX.ceilGrid=()=>TX._g??=canvas(256,256,(g,w,h)=>{g.fillStyle='#8d8f8e';g.fillRect(0,0,w,h);speck(g,w,h,5000,.06);g.fillStyle='#4a4d52';g.fillRect(0,0,w,5);g.fillRect(0,0,5,h);g.fillStyle='rgba(0,0,0,.12)';g.fillRect(5,5,w,3);g.fillRect(5,5,3,h);
   for(let i=0;i<40;i++){g.fillStyle='rgba(40,36,30,.25)';g.fillRect(8+rand()*240,8+rand()*240,1.5,1.5);}},'mod-ceil');
  TX.blocks=(base,lo)=>canvas(512,512,(g,w,h)=>{g.fillStyle=base;g.fillRect(0,0,w,h);const bh=h/8,bw=w/2;for(let r=0;r<8;r++)for(let c=-1;c<3;c++){const x=c*bw+(r%2?bw/2:0),v=(rand()-.5)*.08;g.fillStyle='rgba('+(v>0?'255,255,255,':'0,0,0,')+Math.abs(v)+')';g.fillRect(x+2,r*bh+2,bw-4,bh-4);}
   g.fillStyle='rgba(0,0,0,.35)';for(let r=0;r<=8;r++)g.fillRect(0,r*bh-1.5,w,3);for(let r=0;r<8;r++)for(let c=-1;c<3;c++)g.fillRect(c*bw+(r%2?bw/2:0)-1.5,r*bh,3,bh);speck(g,w,h,7000,.07);grime(g,w,h,.8);
   if(lo){const gr=g.createLinearGradient(0,h*.7,0,h);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(20,16,10,.35)');g.fillStyle=gr;g.fillRect(0,0,w,h);}},'mod-blocks');
  TX.raised=()=>TX._r??=canvas(512,512,(g,w,h)=>{g.fillStyle='#5a5f66';g.fillRect(0,0,w,h);const s=w/4;for(let i=0;i<4;i++)for(let j=0;j<4;j++){const perf=(i===1||i===2)&&j%2===0;g.fillStyle=perf?'#4a4f56':'#60656c';g.fillRect(i*s+3,j*s+3,s-6,s-6);
    if(perf){g.fillStyle='#1c1f24';for(let a=10;a<s-8;a+=9)for(let b=10;b<s-8;b+=9){g.beginPath();g.arc(i*s+a,j*s+b,2.3,0,7);g.fill();}}else speck(g,w,h,300,.05);}
   g.strokeStyle='#23262b';g.lineWidth=4;for(let i=0;i<=4;i++){g.beginPath();g.moveTo(i*s,0);g.lineTo(i*s,h);g.stroke();g.beginPath();g.moveTo(0,i*s);g.lineTo(w,i*s);g.stroke();}grime(g,w,h,.5);},'mod-raised');
  TX.grating=()=>TX._gr??=canvas(256,256,(g,w,h)=>{g.fillStyle='#0b0c0d';g.fillRect(0,0,w,h);g.fillStyle='#545a5e';for(let x=0;x<w;x+=16)g.fillRect(x,0,4,h);for(let y=0;y<h;y+=16)g.fillRect(0,y,w,3);speck(g,w,h,1500,.12);grime(g,w,h,.6);},'mod-grating');
  TX.vinyl=()=>TX._v??=canvas(512,512,(g,w,h)=>{g.fillStyle='#9aa3a4';g.fillRect(0,0,w,h);speck(g,w,h,12000,.05);for(let i=0;i<14;i++){g.strokeStyle='rgba(60,70,70,.06)';g.lineWidth=20+rand()*40;g.beginPath();g.moveTo(rand()*w,0);g.bezierCurveTo(rand()*w,h*.3,rand()*w,h*.6,rand()*w,h);g.stroke();}
   g.strokeStyle='rgba(0,0,0,.25)';g.lineWidth=2;g.beginPath();g.moveTo(w/2,0);g.lineTo(w/2,h);g.stroke();grime(g,w,h,.4);},'mod-vinyl');
  TX.stone=()=>TX._s??=canvas(512,512,(g,w,h)=>{g.fillStyle='#5a5b60';g.fillRect(0,0,w,h);for(let i=0;i<22;i++){g.strokeStyle='#8a8478';g.globalAlpha=.05+rand()*.12;g.lineWidth=.5+rand()*2;g.beginPath();let x=rand()*w,y=rand()*h;g.moveTo(x,y);for(let k=0;k<8;k++){x+=(rand()-.5)*120;y+=(rand()-.3)*90;g.lineTo(x,y);}g.stroke();}g.globalAlpha=1;
   g.strokeStyle='rgba(0,0,0,.6)';g.lineWidth=2;for(let i=0;i<=2;i++){g.beginPath();g.moveTo(0,i*256);g.lineTo(w,i*256);g.stroke();g.beginPath();g.moveTo(i*256,0);g.lineTo(i*256,h);g.stroke();}},'mod-stone');
  // wood veneer: long grain streaks, a few figured bands, two faint panel seams (no plank rows: on desks and panels they read as brick)
  TX.planks=(b,d)=>canvas(512,512,(g,w,h)=>{g.fillStyle=b;g.fillRect(0,0,w,h);for(let i=0;i<260;i++){const y=rand()*h,a=.03+rand()*.07;g.strokeStyle=rand()<.6?d:'rgba(255,230,200,1)';g.globalAlpha=a;g.lineWidth=.6+rand()*2.4;g.beginPath();g.moveTo(0,y);let yy=y;for(let x=0;x<=w;x+=32){yy+=(rand()-.5)*3;g.lineTo(x,yy);}g.stroke();}g.globalAlpha=1;
   for(let i=0;i<4;i++){const y=rand()*h,gr=g.createLinearGradient(0,y-20,0,y+20);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(.5,'rgba(0,0,0,.08)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,y-20,w,40);}g.fillStyle='rgba(0,0,0,.3)';g.fillRect(0,0,w,1.5);g.fillRect(0,h/2,w,1);},'mod-planks');
  TX.plaster=(base,seam)=>canvas(512,512,(g,w,h)=>{g.fillStyle=base;g.fillRect(0,0,w,h);speck(g,w,h,9000,.035);for(let i=0;i<6;i++){const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(30,26,20,.035)');g.fillStyle=gr;g.fillRect(rand()*w,0,40+rand()*120,h);}
   if(seam){g.fillStyle='rgba(0,0,0,.28)';g.fillRect(0,0,3,h);g.fillStyle='rgba(255,255,255,.06)';g.fillRect(3,0,2,h);}grime(g,w,h,.3);},'mod-plaster');
  TX.weave=base=>canvas(256,256,(g,w,h)=>{g.fillStyle=base;g.fillRect(0,0,w,h);for(let y=0;y<h;y+=2){g.fillStyle='rgba(0,0,0,'+(.05+rand()*.05)+')';g.fillRect(0,y,w,1);}for(let x=0;x<w;x+=2){g.fillStyle='rgba(255,255,255,'+(.02+rand()*.03)+')';g.fillRect(x,0,1,h);}speck(g,w,h,2500,.05);},'mod-weave');
  TX.tiles=base=>canvas(512,512,(g,w,h)=>{g.fillStyle='#6a6e6e';g.fillRect(0,0,w,h);const n=8,s2=w/n;for(let i=0;i<n;i++)for(let j=0;j<n;j++){const v=(rand()-.5)*.06;g.fillStyle=base;g.fillRect(i*s2+2,j*s2+2,s2-4,s2-4);g.fillStyle='rgba('+(v>0?'255,255,255,':'0,0,0,')+Math.abs(v)+')';g.fillRect(i*s2+2,j*s2+2,s2-4,s2-4);g.fillStyle='rgba(255,255,255,.12)';g.fillRect(i*s2+3,j*s2+3,s2-8,3);}grime(g,w,h,.35);},'mod-tiles');
  TX.whiteboard=()=>canvas(512,256,(g,w,h)=>{g.fillStyle='#d9dcd8';g.fillRect(0,0,w,h);for(let i=0;i<6;i++){g.fillStyle='rgba(120,120,110,.12)';g.fillRect(rand()*w,rand()*h,60+rand()*120,8+rand()*20);}
   const ink=['#22324a','#3a1f1f','#1d3a28'];g.lineWidth=2.5;for(let i=0;i<9;i++){g.strokeStyle=ink[i%3];g.beginPath();let x=20+rand()*400,y=24+i*24;g.moveTo(x,y);for(let k=0;k<10;k++){x+=8+rand()*12;g.lineTo(x,y+(rand()-.5)*6);}g.stroke();}
   g.strokeStyle='#22324a';g.strokeRect(330,120,140,90);g.beginPath();g.moveTo(340,200);g.lineTo(370,170);g.lineTo(400,182);g.lineTo(430,140);g.lineTo(460,150);g.stroke();g.font='bold 18px Arial';g.fillStyle='#3a1f1f';g.fillText('Q4 TARGETS',330,112);},'mod-wb');
  function skyline(){return TX._sk??=canvas(1024,512,(g,w,h)=>{const sky=g.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#020409');sky.addColorStop(.55,'#0a1020');sky.addColorStop(1,'#241a2a');g.fillStyle=sky;g.fillRect(0,0,w,h);
    for(let layer=0;layer<3;layer++){const shade=[16,11,6][layer],y0=[.3,.42,.55][layer]*h;let x=0;while(x<w){const bw=30+rand()*90,bh=y0+rand()*h*.35;g.fillStyle='rgb('+shade+','+(shade+3)+','+(shade+9)+')';g.fillRect(x,h-bh,bw,bh);
      for(let yy=h-bh+6;yy<h;yy+=7)for(let xx=x+4;xx<x+bw-4;xx+=6)if(rand()<[.06,.12,.2][layer]){g.fillStyle=rand()<.7?'rgba(255,190,120,'+(.25+rand()*.5)+')':'rgba(140,210,255,'+(.25+rand()*.5)+')';g.fillRect(xx,yy,3,3);}
      if(rand()<.12){g.fillStyle=['#c84a8a','#3aa8c0','#c89040'][Math.floor(rand()*3)];g.globalAlpha=.55;g.fillRect(x+bw*.2,h-bh+10,bw*.6,4);g.globalAlpha=1;}x+=bw+rand()*8;}}
    const haze=g.createLinearGradient(0,h*.45,0,h);haze.addColorStop(0,'rgba(70,40,80,0)');haze.addColorStop(1,'rgba(80,46,90,.35)');g.fillStyle=haze;g.fillRect(0,0,w,h);for(let i=0;i<30;i++){g.fillStyle='rgba(255,60,60,'+(.35+rand()*.5)+')';g.fillRect(rand()*w,h*(.2+rand()*.4),2,2);}},'mod-skyline');}
  // screens: one atlas of desktop UIs (4 cells), a meeting-room chart, a rack-status console, the CCTV quad, an ECG, the directory, a floor display
  function deskAtlas(){return TX._d??=canvas(1024,512,(g,w,h)=>{const cw=w/2,ch=h/2;for(let k=0;k<4;k++){const x0=(k%2)*cw,y0=Math.floor(k/2)*ch;g.fillStyle=['#06121c','#0a0f18','#0b1410','#100c14'][k];g.fillRect(x0,y0,cw,ch);
    g.fillStyle='rgba(120,180,220,.18)';g.fillRect(x0,y0,cw,22);g.fillStyle='#9ec8e0';g.font='bold 14px monospace';g.fillText(['MAIL · 14 UNREAD','LEDGER · Q4','TICKETS · 9 OPEN','SECURE CHAT'][k],x0+10,y0+16);
    for(let r=0;r<9;r++){g.fillStyle=r%3?'rgba(170,200,220,.45)':'rgba(220,230,240,.7)';g.fillRect(x0+12,y0+36+r*22,60+rand()*(cw-120),9);}
    if(k===1){g.strokeStyle='#5fd0a0';g.lineWidth=2;g.beginPath();g.moveTo(x0+300,y0+200);for(let i=0;i<8;i++)g.lineTo(x0+300+i*26,y0+200-rand()*120);g.stroke();}
    if(k===3){g.fillStyle='rgba(255,150,90,.6)';g.fillRect(x0+cw-120,y0+40,100,60);}g.fillStyle='rgba(0,0,0,.25)';for(let y=y0;y<y0+ch;y+=3)g.fillRect(x0,y,cw,1);}},'mod-desk');}
  function chartTex(){return canvas(512,288,(g,w,h)=>{g.fillStyle='#081018';g.fillRect(0,0,w,h);g.fillStyle='#d8e4ee';g.font='bold 20px Arial';g.fillText('QUARTERLY REVIEW · CONFIDENTIAL',20,32);const bars=[.4,.55,.5,.72,.66,.81];bars.forEach((b,i)=>{g.fillStyle=i===5?'#c89a4a':'#4a7a9a';g.fillRect(40+i*60,h-30-b*180,36,b*180);});
   g.strokeStyle='#8fd0b0';g.lineWidth=3;g.beginPath();g.moveTo(400,220);g.lineTo(430,190);g.lineTo(460,200);g.lineTo(490,140);g.stroke();g.fillStyle='#8a98a8';g.font='14px monospace';g.fillText('MARGIN +3.1%   HEADCOUNT -12',300,h-12);},'mod-chart');}
  function consoleTex(){return canvas(512,320,(g,w,h)=>{g.fillStyle='#03080c';g.fillRect(0,0,w,h);g.fillStyle='#7fd4ff';g.font='bold 18px monospace';g.fillText('DC-NODE 7 · RACK STATUS',16,28);for(let r=0;r<3;r++)for(let i=0;i<6;i++){const bad=(r===1&&i===3);g.fillStyle=bad?'#d04040':rand()<.15?'#d0a040':'#40b080';g.fillRect(24+i*76,56+r*60,60,40);g.fillStyle='#02060a';g.font='12px monospace';g.fillText(String.fromCharCode(65+r)+(i+1),30+i*76,80+r*60);}
   g.fillStyle='#9ad';g.font='14px monospace';g.fillText('> core B4: integrity check FAILED',16,262);g.fillText('> cooling: 21.4 C  load 78%',16,284);g.fillText('> _',16,306);},'mod-console');}
  function cctvTex(){return canvas(512,320,(g,w,h)=>{g.fillStyle='#050505';g.fillRect(0,0,w,h);for(let k=0;k<4;k++){const x=(k%2)*w/2,y=Math.floor(k/2)*h/2;const gr=g.createLinearGradient(x,y,x,y+h/2);gr.addColorStop(0,'#1e2622');gr.addColorStop(1,'#0c100e');g.fillStyle=gr;g.fillRect(x+3,y+3,w/2-6,h/2-6);
    g.fillStyle='rgba(180,200,190,.25)';for(let i=0;i<6;i++)g.fillRect(x+20+rand()*200,y+40+rand()*90,10+rand()*40,20+rand()*50);g.fillStyle='#cfe';g.font='12px monospace';g.fillText('CAM '+(k+1)+'  02:14:'+(10+k*7),x+10,y+18);}for(let y=0;y<h;y+=2){g.fillStyle='rgba(0,0,0,.25)';g.fillRect(0,y,w,1);}},'mod-cctv');}
  function ecgTex(){return canvas(512,256,(g,w,h)=>{g.fillStyle='#020806';g.fillRect(0,0,w,h);g.strokeStyle='#40e090';g.lineWidth=3;g.beginPath();for(let x=0;x<w;x+=2){const t=x%128,y=t>50&&t<56?40:t>56&&t<62?200:t>62&&t<68?110:120+Math.sin(x*.05)*4;x?g.lineTo(x,y):g.moveTo(x,y);}g.stroke();
   g.fillStyle='#40e090';g.font='bold 34px monospace';g.fillText('72',w-110,60);g.fillStyle='#60b0ff';g.fillText('98%',w-120,210);g.font='14px monospace';g.fillText('HR',w-150,40);g.fillText('SpO2',w-170,190);},'mod-ecg');}
  function directoryTex(floors){return canvas(256,512,(g,w,h)=>{g.fillStyle='#0b0c0e';g.fillRect(0,0,w,h);g.fillStyle='#c9b48a';g.font='bold 22px Arial';g.fillText('DIRECTORY',20,40);g.fillStyle='rgba(201,180,138,.5)';g.fillRect(20,52,w-40,2);
   const rows=[['B1','DATA CENTRE'],['G','RECEPTION'],['1','SUITE 100'],['2','SUITE 200'],['3','LEGAL'],['4','EXECUTIVE']];rows.forEach(([f,n],i)=>{g.fillStyle='#e8e2d4';g.font='bold 18px monospace';g.fillText(f,24,96+i*56);g.font='16px Arial';g.fillStyle='#b8b2a4';g.fillText(n,70,96+i*56);});},'mod-dir');}
  // the rack fronts: albedo (bezels, drive bays, handles) and the LEDs (two frames side by side: the blink swaps them)
  function rackTex(){if(TX._rk)return TX._rk;const W=512,H=1024,units=[];for(let v=0;v<4;v++){let y=10;const list=[];while(y<H/4-14){const u=[10,20,40][Math.floor(rand()*3)];list.push([y,u,Math.floor(rand()*4)]);y+=u+3;}units.push(list);}
   const alb=canvas(W,H,(g)=>{g.fillStyle='#121418';g.fillRect(0,0,W,H);for(let v=0;v<4;v++){const y0=v*H/4;for(const [y,u,k] of units[v]){g.fillStyle=['#24272c','#1b1e22','#2c2f34','#202226'][k];g.fillRect(14,y0+y,W/2-28,u);g.fillStyle='rgba(255,255,255,.06)';g.fillRect(14,y0+y,W/2-28,1.5);
     if(u>=20){g.fillStyle='#0c0d0f';for(let x=40;x<W/2-60;x+=22)g.fillRect(x,y0+y+4,16,u-8);}g.fillStyle='#4a4e54';g.fillRect(18,y0+y+2,5,u-4);g.fillRect(W/2-23,y0+y+2,5,u-4);}}
    g.drawImage(g.canvas,0,0,W/2,H,W/2,0,W/2,H);},'mod-rack');
   const led=canvas(W,H,(g)=>{g.fillStyle='#000';g.fillRect(0,0,W,H);for(let f=0;f<2;f++)for(let v=0;v<4;v++){const y0=v*H/4;for(const [y,u] of units[v]){for(let i=0;i<(u>=20?5:3);i++){const r=rand();if(f===1&&rand()<.35)continue;g.fillStyle=r<.6?'#2cff7a':r<.8?'#5ab4ff':r<.93?'#ffb02a':'#ff3a2a';g.fillRect(f*W/2+W/2-74+i*11,y0+y+u/2-3,7,6);}
      if(rand()<.45){g.fillStyle=rand()<.7?'#2cff7a':'#5ab4ff';g.fillRect(f*W/2+26,y0+y+u/2-2,5,5);}}}},'mod-rack-led');
   const back=canvas(256,512,(g,w,h)=>{g.fillStyle='#0d0e10';g.fillRect(0,0,w,h);const cols=['#2a4a8a','#c8b040','#2a2a2a','#8a3030','#3a6a3a','#7a7a7a'];for(let i=0;i<70;i++){g.strokeStyle=cols[i%cols.length];g.globalAlpha=.75;g.lineWidth=2+rand()*3;g.beginPath();const x=rand()*w;g.moveTo(x,0);g.bezierCurveTo(x+(rand()-.5)*80,h*.3,x+(rand()-.5)*80,h*.7,rand()*w,h);g.stroke();}g.globalAlpha=1;
    for(let y=20;y<h;y+=46){g.fillStyle='#1c1e22';g.fillRect(20,y,w-40,16);for(let x=30;x<w-30;x+=14){g.fillStyle=rand()<.5?'#2cff7a':'#333';g.fillRect(x,y+5,4,4);}}},'mod-rack-back');
   return TX._rk={alb,led,back};}
  function signTex(text,fg='#d8d2c4',bg='#16171a',w=512,h=128,font='bold 54px Arial'){return canvas(w,h,(g)=>{g.fillStyle=bg;g.fillRect(0,0,w,h);g.fillStyle=fg;g.font=font;const tw=g.measureText(text).width;if(tw>w*.9){const px=parseFloat(/(\d+)px/.exec(font)[1]);g.font=font.replace(/\d+px/,Math.floor(px*w*.9/tw)+'px');}g.textAlign='center';g.textBaseline='middle';g.fillText(text,w/2,h/2+3);},'mod-sign');}
  function artTex(hue){return canvas(256,320,(g,w,h)=>{const gr=g.createLinearGradient(0,0,w,h);gr.addColorStop(0,'hsl('+hue+',30%,20%)');gr.addColorStop(1,'hsl('+(hue+40)+',25%,8%)');g.fillStyle=gr;g.fillRect(0,0,w,h);for(let i=0;i<5;i++){g.fillStyle='hsla('+(hue+i*25)+',35%,'+(30+rand()*30)+'%,.5)';g.fillRect(rand()*w*.7,rand()*h*.7,40+rand()*90,6+rand()*60);}g.strokeStyle='rgba(230,220,200,.5)';g.lineWidth=2;g.beginPath();g.arc(w*.6,h*.4,50,0,5);g.stroke();},'mod-art');}
  function floorDisplay(){const t=new B.DynamicTexture('mod-floordisp',{width:256,height:96},scene,true);own.push(t);return t;}
  const drawFloor=(t,f)=>{const g=t.getContext();g.fillStyle='#050302';g.fillRect(0,0,256,96);g.fillStyle='#ff9a3a';g.font='bold 60px monospace';g.textAlign='center';g.textBaseline='middle';g.fillText(M.floorName(f).replace('GROUND','G'),128,52);t.update();};

  // ---- shared materials ----
  const S={
   steel:P('steel',{c:'#8a9096',tex:'district-interior/kit_steel_color.jpg',nrm:'district-interior/kit_steel_normal.jpg',tile:1,rough:.38,metal:.85}),gun:P('gun',{c:'#5a6068',tex:'district-interior/kit_gunmetal_color.jpg',nrm:'district-interior/kit_gunmetal_normal.jpg',tile:1.2,rough:.45,metal:.75}),
   dark:P('dark',{c:'#141518',rough:.55,metal:.35}),black:P('black',{c:'#070708',rough:.3,metal:.2}),plastic:P('plastic',{c:'#2a2c30',rough:.5,metal:.05}),white:P('white',{c:'#c8cac6',rough:.35}),
   glass:P('glass',{c:'#9ab4c0',rough:.04,metal:.15,alpha:.16}),frost:P('frost',{c:'#d4dcdf',rough:.4,alpha:.55}),alu:P('alu',{c:'#a8acb0',rough:.32,metal:.9}),
   wood:P('wood',{c:'#a08060',dyn:TX.planks('#5a4030','#2a1a10'),tile:1.6,rough:.5}),fabric:P('fabric',{c:'#c0c8d0',dyn:TX.weave('#4e5862'),nrm:'district-interior/kit_canvas_normal.jpg',tile:.8,rough:1,nrmLevel:.4}),
   paper:P('paper',{c:'#d8d4c8',rough:.9}),cardboard:P('cardboard',{c:'#6a5038',rough:.95}),rubber:P('rubber',{c:'#18191a',rough:.9}),
   concrete:P('concrete',{c:'#80807a',tex:'ncz/concrete-old-color.jpg',nrm:'ncz/concrete-old-normal.jpg',tile:2.5,rough:.92}),rust:P('rust',{c:'#7a6a5a',tex:'ncz/metal-leaks-color.jpg',nrm:'ncz/metal-leaks-normal.jpg',tile:1.4,rough:.6,metal:.55}),
   red:P('red-paint',{c:'#7a1e1a',rough:.45,metal:.3}),amberPaint:P('amber-paint',{c:'#8a6a24',rough:.55,metal:.2}),green:P('green-paint',{c:'#2e4a3a',rough:.6,metal:.2}),
   ledR:P('led-r',{em:'#ff2a2a',unlit:true}),ledG:P('led-g',{em:'#39ff9c',unlit:true}),ledA:P('led-a',{em:'#ffb347',unlit:true}),apScreen:P('ap-screen',{em:'#1f6f8a',unlit:true}),void:P('void',{c:'#050506',rough:.95,metal:0})};
  const STY={
   corp:{floor:P('carpet',{c:'#c4c8d0',dyn:TX.carpet(),tile:2.4,rough:.95}),wall:P('corp-wall',{c:'#d0ccc4',dyn:TX.plaster('#8e8a82',true),tile:1.2,rough:.85}),wain:S.wood,
    ceil:P('ceil-grid',{c:'#c4c6c4',dyn:TX.ceilGrid(),tile:.6,rough:.9}),skirt:S.dark,rail:S.alu,door:P('door-corp',{c:'#3a3e44',tex:'district-interior/kit_gunmetal_color.jpg',nrm:'district-interior/kit_gunmetal_normal.jpg',tile:1.2,rough:.35,metal:.7}),lamp:'#eef2f6'},
   tech:{floor:P('raised',{c:'#9aa0a8',dyn:TX.raised(),tile:2.4,rough:.55,metal:.4}),wall:P('tech-wall',{c:'#5c636c',tex:'district-interior/kit_gunmetal_color.jpg',nrm:'district-interior/kit_gunmetal_normal.jpg',tile:1.4,rough:.5,metal:.6}),wain:P('tech-wain',{c:'#3a4048',tex:'district-interior/kit_steel_color.jpg',nrm:'district-interior/kit_steel_normal.jpg',tile:1,rough:.45,metal:.75}),
    ceil:P('tech-ceil',{c:'#2a2d32',tex:'district-interior/kit_concrete_color.jpg',tile:2,rough:.9}),skirt:S.black,rail:S.steel,door:P('door-tech',{c:'#4a5058',tex:'district-interior/kit_steel_color.jpg',nrm:'district-interior/kit_steel_normal.jpg',tile:1.2,rough:.4,metal:.85}),lamp:'#d6e6ff'},
   back:{floor:P('back-floor',{c:'#77766f',tex:'ncz/concrete-old-color.jpg',nrm:'ncz/concrete-old-normal.jpg',tile:2.2,rough:.9}),wall:P('back-wall',{c:'#b4b6ae',dyn:TX.blocks('#8a8d86',true),tile:2,rough:.92}),wain:P('back-wain',{c:'#4c5a52',dyn:TX.blocks('#3a463f',true),tile:2,rough:.8}),
    ceil:P('back-ceil',{c:'#5a5a56',tex:'ncz/concrete-old-color.jpg',tile:2.5,rough:.95}),skirt:S.dark,rail:S.dark,door:P('door-back',{c:'#5a5e5a',tex:'ncz/metal-leaks-color.jpg',nrm:'ncz/metal-leaks-normal.jpg',tile:1.2,rough:.55,metal:.6}),lamp:'#e2f2e4'},
   clinic:{floor:P('vinyl',{c:'#b8c0c0',dyn:TX.vinyl(),tile:3,rough:.4}),wall:P('clinic-wall',{c:'#d0dcd8',dyn:TX.plaster('#8a9894',false),tile:2,rough:.8}),wain:P('clinic-tile',{c:'#ffffff',dyn:TX.tiles('#b4bcbc'),tile:1.2,rough:.2}),
    ceil:P('clinic-ceil',{c:'#c4c6c4',dyn:TX.ceilGrid(),tile:.6,rough:.9}),skirt:S.plastic,rail:S.steel,door:P('door-clinic',{c:'#8a9494',tex:'district-interior/kit_steel_color.jpg',tile:1.2,rough:.35,metal:.6}),lamp:'#f0f6ff'}};
  STY.lobby={...STY.corp,floor:P('stone',{c:'#d4d4d4',dyn:TX.stone(),tile:2,rough:.16,metal:.1})};
  const cabSteel=P('cab-steel',{c:'#eef0f2',tex:'district-interior/kit_steel_color.jpg',nrm:'district-interior/kit_steel_normal.jpg',tile:.8,rough:.4,metal:.3});
  STY.cab={...STY.corp,floor:P('cab-floor',{c:'#6a6c70',tex:'district-interior/kit_steel_color.jpg',tile:.4,rough:.7,metal:.3}),wall:cabSteel,wain:cabSteel,ceil:cabSteel};
  STY.maint={...STY.tech,floor:P('grating',{c:'#9aa0a0',dyn:TX.grating(),tile:.8,rough:.5,metal:.7}),wall:P('maint-wall',{c:'#b4b4a8',tex:'ncz/concrete-mold-color.jpg',nrm:'ncz/concrete-mold-normal.jpg',tile:2.2,rough:.92}),wain:S.rust,ceil:P('maint-ceil',{c:'#3a3a36',tex:'ncz/concrete-old-color.jpg',tile:2,rough:.95}),door:S.rust,lamp:'#ffd8a0'};
  const styleOf=type=>type==='elevator'?'cab':type==='elevator-lobby'?'lobby':type==='maint-corridor'?'maint':type==='clinic'?'clinic':(M.TYPES[type]&&M.TYPES[type].style)||'corp';
  // per module: its own fixture material (lights on / off per module) and screen material (screens on / off)
  const modState={};
  const lampOf=id=>{const st=modState[id];return st.lamp??=P('lamp-'+id,{em:STY[st.sty].lamp||'#eef',unlit:true});};
  const screenMat=(id,key,tex)=>{const st=modState[id];const m=P('scr-'+id+'-'+key,{dyn:tex,unlit:true});(st.screens??=[]).push(m);return m;};
  // ---- real lights ----
  const realLights=[],cap=low?1:Math.min(6,C.mods.length*2);
  function pointLight(modId,[x,y,z],hex,intensity,range){if(realLights.length>=cap)return null;const mn=modState[modId].node;mn.computeWorldMatrix(true);const p=B.Vector3.TransformCoordinates(new B.Vector3(x,y,z),mn.getWorldMatrix());
   const l=new B.PointLight('mod-light-'+modId,p,scene);l.diffuse=B.Color3.FromHexString(hex);l.specular=l.diffuse.scale(.35);l.intensity=intensity;l.range=range;l.metadata={on:intensity,mod:modId};own.push(l);realLights.push(l);return l;}
  // ---- props: repository models as instances (one draw call per source mesh) ----
  const propCache=new Map();
  function prop(file,[x,y,z],ry,h,standIn){if(low||!root.VoidAssets?.loadContainer){standIn?.();return;}const node=cur;
   if(!propCache.has(file))propCache.set(file,root.VoidAssets.loadContainer({src:'assets/models/'+file},scene,null,'mod:'+file).then(c=>{containers.push(c);for(const m of c.materials)if('usePhysicalLightFalloff' in m){m.usePhysicalLightFalloff=false;m.environmentIntensity=.5;m.maxSimultaneousLights=6;}return c;}));
   late.push(propCache.get(file).then(c=>{if(disposed)return;if(file.includes('office-chair')&&!c.metadata?.toned){c.metadata={...(c.metadata||{}),toned:true};for(const m of c.materials)if(m.albedoColor){m.albedoTexture=null;m.albedoColor=B.Color3.FromHexString('#1c1e22');m.roughness=.55;m.metallic=.25;}}   /* Milked's pink trim: a corporate charcoal here */const inst=c.instantiateModelsToScene(n=>'mod-'+n,false,{doNotInstantiate:false}),n=new B.TransformNode('mod-prop',scene);n.parent=node;for(const r0 of inst.rootNodes)r0.parent=n;
     n.position.set(x,0,z);n.rotation.y=ry;n.computeWorldMatrix(true);for(const m of n.getChildMeshes())m.computeWorldMatrix(true);const bb=n.getHierarchyBoundingVectors(true),sc=h/Math.max(.01,bb.max.y-bb.min.y);n.scaling.setAll(sc);n.position.y=y-(bb.min.y-0)*sc;
     for(const m of n.getChildMeshes()){m.isPickable=false;m.freezeWorldMatrix?.();}props.push(n);}).catch(e=>{if(disposed)return;console.warn('[modules] prop '+file,e?.message||e);try{const keep=cur;cur=node;standIn?.();cur=keep;merge();}catch{}}));}
  // a stand-in office chair (Low, or the model missing): seat, back, column, star base
  function chairStandIn(x,z,ry){const c=Math.cos(ry),s=Math.sin(ry);box2(S.plastic,x-.24,x+.24,.44,.52,z-.24,z+.24);bx(S.plastic,[.44,.5,.06],[x-s*.22,.82,z-c*.22],ry);cyl(S.steel,.05,.4,[x,.24,z]);cyl(S.dark,.56,.04,[x,.05,z],10);}
  const chair=(x,z,ry)=>prop('milked/milked-office-chair.glb',[x,0,z],ry,1.05,()=>chairStandIn(x,z,ry));
  const plant=(x,z,h=1.2,file='milked/milked-pothos.glb')=>{box2(S.dark,x-.2,x+.2,0,.38,z-.2,z+.2);prop(file,[x,.36,z],rand()*6,h-.36,()=>{cyl(P('leaf',{c:'#2e4a2a',rough:.8}),.5,h*.5,[x,.38+h*.25,z],8,0,0,.2);});};
  const crate=(x,z,ry,h=.6)=>prop('props/crate.glb',[x,0,z],ry,h,()=>bx(S.cardboard,[h*1.1,h,h*.9],[x,h/2,z],ry));

  // ================================================================ the modules
  const doorsOut=[],apLeds={},screens={};let lightsOn={};
  cur=rootN;
  // ---- the shell: floor, ceiling, walls with their door gaps, skirting, rails, the light switch ----
  function shell(mod,t,sty){const s=STY[sty],hw=t.w*M.GRID/2,hd=t.d*M.GRID/2,Ch=t.ceil,Wt=M.WALL,lamp=lampOf(mod.id);
   box2(s.floor,-hw,hw,-.02,0,-hd,hd);box2(s.ceil,-hw,hw,Ch,Ch+.04,-hd,hd);
   const openAt=e=>t.sockets.filter(so=>so.edge===e&&mod.open.includes(so.id)).map(so=>{const c=M.sockLocal(t,so);return (e==='s'||e==='n')?c[0]:c[1];}).sort((a,b)=>a-b);
   const win=t.windows&&!mod.edges[t.windows]?.neighbour?t.windows:null;
   for(const e of ['s','n','w','e']){const along=(e==='s'||e==='n')?hw:hd,gaps=openAt(e),dw=M.DOOR.w/2;let a=-along;const segs=[];for(const g of gaps){segs.push([a,g-dw]);a=g+dw;}segs.push([a,along]);
    // a box on this edge: along u0..u1, height y0..y1, from the wall face `f0` (0 = the boundary) inward by depth
    const E=(mat,u0,u1,y0,y1,f0,dep)=>{if(u1-u0<.005)return;if(e==='s')box2(mat,u0,u1,y0,y1,-hd+f0,-hd+f0+dep);else if(e==='n')box2(mat,u0,u1,y0,y1,hd-f0-dep,hd-f0);else if(e==='w')box2(mat,-hw+f0,-hw+f0+dep,y0,y1,u0,u1);else box2(mat,hw-f0-dep,hw-f0,y0,y1,u0,u1);};
    for(const [u0,u1] of segs){if(win===e&&u1-u0>1.2){E(s.wall,u0,u1,0,.95,0,Wt);E(s.wall,u0,u1,2.45,Ch,0,Wt);windowBand(e,u0,u1,hw,hd,Ch);}else E(s.wall,u0,u1,0,Ch,0,Wt);
     if(sty==='corp'||sty==='lobby'){E(s.wain,u0,u1,.1,.92,Wt,.02);E(s.rail,u0,u1,.92,.96,Wt,.03);E(s.skirt,u0,u1,0,.1,Wt,.025);E(S.dark,u0,u1,Ch-.06,Ch,Wt,.04);}
     else if(sty==='clinic'){E(s.wain,u0,u1,0,1.25,Wt,.012);E(s.rail,u0,u1,1.25,1.29,Wt,.02);}
     else if(sty==='tech'){E(s.wain,u0,u1,0,1.1,Wt,.015);E(S.black,u0,u1,0,.08,Wt,.03);for(let u=Math.ceil(u0/1.2)*1.2;u<u1-.05;u+=1.2)E(S.black,u-.01,u+.01,.08,Ch,Wt,.006);}
     else if(sty==='back'||sty==='maint'){E(s.wain,u0,u1,0,1.1,Wt,.006);E(S.dark,u0,u1,0,.12,Wt,.02);}
     else if(sty==='cab'){for(let u=u0+.45;u<u1-.1;u+=.6)E(S.dark,u-.006,u+.006,0,Ch,Wt,.004);E(S.wood,u0,u1,.9,.96,Wt+.03,.04);}}
    for(const g of gaps)E(s.wall,g-dw,g+dw,2.3,Ch,0,Wt);}   // over each door
   // the light switch
   if(t.sw){const [u,e]=t.sw,face=.005,pt=e==='s'?[u,-hd+Wt]:e==='n'?[u,hd-Wt]:e==='w'?[-hw+Wt,u]:[hw-Wt,u],ry={s:PI,n:0,w:HALF,e:-HALF}[e];
    bx(S.white,[.09,.13,.012],[pt[0]+(e==='w'?face:e==='e'?-face:0),1.4,pt[1]+(e==='s'?face:e==='n'?-face:0)],ry);bx(S.ledA,[.012,.012,.02],[pt[0]+(e==='w'?.01:e==='e'?-.01:0),1.44,pt[1]+(e==='s'?.01:e==='n'?-.01:0)],ry);}
   // ceiling services and fixtures
   if(sty==='corp'||sty==='clinic'){for(let x=-hw+.6;x<hw-.3;x+=2.4)for(let z=-hd+.9;z<hd-.6;z+=2.4){const big=t.w>1;if(!big&&Math.abs(x)>.1)continue;box2(S.alu,x-.33,x+.33,Ch-.03,Ch,z-.63,z+.63);box2(lamp,x-.3,x+.3,Ch-.035,Ch-.03,z-.6,z+.6);}
    if(t.w<=1){box2(S.dark,-.1,.1,Ch-.06,Ch,-hd+.3,hd-.3);box2(lamp,-.06,.06,Ch-.065,Ch-.06,-hd+.35,hd-.35);}
    for(let i=0;i<Math.max(1,Math.round(t.w*t.d/6));i++){const x=-hw+.8+rand()*(hw*2-1.6),z=-hd+.8+rand()*(hd*2-1.6);box2(S.white,x-.28,x+.28,Ch-.02,Ch,z-.28,z+.28);for(let k=-2;k<=2;k++)box2(S.dark,x-.24,x+.24,Ch-.025,Ch-.02,z+k*.09-.01,z+k*.09+.01);}}
   else if(sty==='lobby'){box2(S.dark,-hw+.4,hw-.4,Ch-.25,Ch,-hd+.4,-hd+.55);box2(S.dark,-hw+.4,hw-.4,Ch-.25,Ch,hd-.55,hd-.4);box2(lamp,-hw+.45,hw-.45,Ch-.255,Ch-.25,-hd+.42,-hd+.5);box2(lamp,-hw+.45,hw-.45,Ch-.255,Ch-.25,hd-.5,hd-.42);
    cyl(S.alu,.02,.6,[0,Ch-.3,0]);cyl(S.dark,.5,.08,[0,Ch-.62,0],20);cyl(lamp,.42,.02,[0,Ch-.665,0],20);}
   else if(sty==='cab'){box2(S.steel,-.85,.85,Ch-.05,Ch,-.85,.85);box2(lamp,-.6,.6,Ch-.055,Ch-.05,-.6,.6);}
   else if(sty==='tech'){}   // racks' own strips (server room)
   else{const n=Math.max(1,Math.round(Math.max(t.w,t.d)/2));for(let i=0;i<n;i++){const along=t.d>=t.w,u=-((along?hd:hw))+(i+.5)*(2*(along?hd:hw)/n),x=along?0:u,z=along?u:0;caged(x,Ch,z,along,lamp);}}}
  function caged(x,Ch,z,along,lamp){const L=1.25;if(along){box2(S.dark,x-.08,x+.08,Ch-.05,Ch,z-L/2,z+L/2);cyl(lamp,.04,L-.1,[x,Ch-.1,z],8,HALF);for(let k=-2;k<=2;k++)torus(S.dark,.13,.008,[x,Ch-.1,z+k*.27],HALF,0);}
   else{box2(S.dark,x-L/2,x+L/2,Ch-.05,Ch,z-.08,z+.08);cyl(lamp,.04,L-.1,[x,Ch-.1,z],8,0,HALF);for(let k=-2;k<=2;k++)torus(S.dark,.13,.008,[x+k*.27,Ch-.1,z],0,HALF);}}
  function windowBand(e,u0,u1,hw,hd,Ch){const out=e==='n'?hd:e==='s'?-hd:e==='e'?hw:-hw,sg=out>0?1:-1,ns=e==='n'||e==='s';const sky=P('skyline',{dyn:skyline(),unlit:true});
   const pane=(mat,a0,a1,y0,y1,o0,o1)=>ns?box2(mat,a0,a1,y0,y1,Math.min(o0,o1),Math.max(o0,o1)):box2(mat,Math.min(o0,o1),Math.max(o0,o1),y0,y1,a0,a1);
   pane(S.glass,u0,u1,.95,2.45,out-sg*.06,out-sg*.05);pane(S.alu,u0,u1,.9,.95,out-sg*.12,out);pane(S.alu,u0,u1,2.45,2.5,out-sg*.1,out);
   for(let u=u0;u<=u1+.01;u+=Math.max(1.2,(u1-u0)/Math.max(1,Math.round((u1-u0)/1.5))))pane(S.alu,Math.min(u1,u)-.03,Math.min(u1,u)+.03,.95,2.45,out-sg*.1,out);
   // blinds half down, the city beyond
   const sl=P('blinds',{c:'#5a5852',rough:.8});for(let y=2.42;y>1.75;y-=.045)pane(sl,u0+.04,u1-.04,y-.012,y,out-sg*.16,out-sg*.15);
   const w=u1-u0,c=(u0+u1)/2,dist=out+sg*2.5;if(ns)plane(sky,w+4,3.4,[c,1.55,dist],e==='n'?0:PI);else plane(sky,w+4,3.4,[dist,1.55,c],e==='e'?-HALF:HALF);}

  const BUILD={
   'office-floor'(mod,t){const pl=t.plan,lamp=lampOf(mod.id),scr=screenMat(mod.id,'desk',deskAtlas()),cap=P('partition-cap',{c:'#8a9096',rough:.35,metal:.85});
    const keyb=P('keyboard',{c:'#1a1b1d',rough:.6}),mug=['#8a2a2a','#d8d4c8','#2a4a6a'].map((c,i)=>P('mug'+i,{c,rough:.4}));let ci=0;
    for(const [x0,x1,z0,z1,o] of pl.cubes){const zc=(z0+z1)/2,deskX=o==='e'?[x0,x0+.75]:[x1-.75,x1],face=o==='e'?1:-1,dx=o==='e'?x0:x1;
     // partitions: two sides and the back, fabric with an aluminium cap
     for(const z of [z0,z1]){box2(S.fabric,x0,x1,0,1.25,z-.025,z+.025);box2(cap,x0,x1,1.25,1.28,z-.03,z+.03);}box2(S.fabric,dx-.025,dx+.025,0,1.25,z0,z1);box2(cap,dx-.03,dx+.03,1.25,1.28,z0,z1);
     box2(S.wood,deskX[0],deskX[1],.72,.75,z0+.05,z1-.05);box2(S.dark,deskX[0]+(o==='e'?0:.7),deskX[0]+(o==='e'?.05:.75),.05,.72,z0+.1,z1-.1);
     const ped=o==='e'?[deskX[0]+.05,deskX[0]+.7]:[deskX[1]-.7,deskX[1]-.05];box2(S.gun,ped[0],ped[1],0,.68,z1-.5,z1-.08);for(const y of [.2,.42,.6])box2(S.steel,ped[0]+(o==='e'?.64:-.01),ped[0]+(o==='e'?.66:.01),y,y+.02,z1-.4,z1-.18);
     // two screens on arms, keyboard, mouse, a mug, papers
     const mx=o==='e'?deskX[0]+.25:deskX[1]-.25;for(const k of [-1,1]){const mz=zc+k*.3;box2(S.dark,mx-.04*face-.02,mx-.04*face+.02,.75,1.02,mz-.02,mz+.02);bx(S.black,[.03,.34,.56],[mx,1.12,mz],0);const v=(ci++)%4,u0=(v%2)*.5,v0=v<2?.5:0;
      plane(scr,.53,.31,[mx+face*.017,1.12,mz],o==='e'?-HALF:HALF,false,0,new B.Vector4(u0,v0,u0+.5,v0+.5));}
     box2(keyb,mx+face*.3-.07,mx+face*.3+.07,.75,.77,zc-.22,zc+.22);box2(keyb,mx+face*.3-.04,mx+face*.3+.04,.75,.765,zc+.32,zc+.38);
     if(rand()<.7)cyl(mug[Math.floor(rand()*3)],.08,.1,[mx+face*.22,.8,zc-.62],10);if(rand()<.8)bx(S.paper,[.22,.02,.3],[mx+face*.28,.76,zc+.62],rand()*.6-.3);if(rand()<.4)cyl(S.dark,.24,.24,[deskX[0]+(o==='e'?.35:.4),.12,z0+.25],10);
     chair(o==='e'?x0+1.25:x1-1.25,zc-.05,o==='e'?-HALF:HALF);}
    // the manager's glass office
    const g=pl.mgr;const pane=(x0,x1,z0,z1)=>{box2(S.glass,x0,x1,0,t.ceil,z0,z1);box2(S.frost,x0-(x1-x0<.1?.002:0),x1+(x1-x0<.1?.002:0),1.05,1.45,z0-(z1-z0<.1?.002:0),z1+(z1-z0<.1?.002:0));};
    pane(2.78,2.82,g.z[0],g.gap[0]);pane(2.78,2.82,g.gap[1],g.z[1]);pane(g.x[0],g.x[1],1.18,1.22);
    for(const z of [g.z[0],g.gap[0],g.gap[1],g.z[1]-.01])box2(S.alu,2.76,2.84,0,t.ceil,z-.03,z+.03);for(const x of [g.x[0],4.3,g.x[1]-.01])box2(S.alu,x-.03,x+.03,0,t.ceil,1.16,1.24);box2(S.alu,2.76,2.84,2.25,2.3,g.gap[0],g.gap[1]);
    box2(S.alu,2.76,2.84,0,.06,g.z[0],g.z[1]);box2(S.alu,g.x[0],g.x[1],0,.06,1.16,1.24);
    const [dx0,dx1,dz0,dz1]=g.desk;box2(S.wood,dx0,dx1,.72,.76,dz0,dz1);box2(S.dark,dx0+.05,dx1-.05,.05,.72,dz0+.02,dz0+.06);for(const x of [dx0+.06,dx1-.06])box2(S.steel,x-.03,x+.03,0,.72,dz0+.05,dz1-.05);
    const mscr=screenMat(mod.id,'mgr',deskAtlas());bx(S.black,[.6,.36,.03],[4.5,1.12,3.55],0);plane(mscr,.57,.33,[4.5,1.12,3.53],PI,false,0,new B.Vector4(.5,.5,1,1));box2(S.dark,4.47,4.53,.76,.95,3.55,3.6);
    chair(4.5,4.15,PI);chair(4.5,2.45,0);
    const [cx0,cx1,cz0,cz1]=g.cred;box2(S.wood,cx0,cx1,0,.8,cz0,cz1);for(let i=0;i<9;i++){const bw=.04+rand()*.05,c=P('book'+(i%4),{c:['#4a2a24','#2a3a4a','#3a3a2a','#5a4a3a'][i%4],rough:.8});box2(c,cx0+.1+i*.1,cx0+.1+i*.1+bw,.8,.8+.2+rand()*.08,cz0+.08,cz1-.08);}
    cyl(S.alu,.12,.35,[5.2,.98,4.68]);cyl(P('shade',{c:'#d8cbb0',rough:.9,em:'#3a3020'}),.28,.18,[5.2,1.2,4.68],14,0,0,.22);
    const [sx0,sx1,sz0,sz1]=g.safe;box2(S.gun,sx0,sx1,0,.7,sz0,sz1);cyl(S.steel,.1,.03,[sx0-.01,.45,(sz0+sz1)/2],14,0,HALF);box2(S.steel,sx0-.03,sx0,.25,.3,sz0+.15,sz1-.15);
    plant(3.28,4.62,1.35,'milked/milked-bamboo.glb');{const art=P('art-mgr',{dyn:artTex(30),rough:.6});plane(art,1.2,.9,[5.885,1.6,2.6],HALF);box2(S.dark,5.87,5.9,1.13,2.07,1.98,3.22);}
    // the meeting nook
    const [tx0,tx1,tz0,tz1]=pl.meet.table;box2(S.wood,tx0,tx1,.72,.76,tz0,tz1);for(const x of [tx0+.35,tx1-.35])box2(S.steel,x-.05,x+.05,0,.72,(tz0+tz1)/2-.2,(tz0+tz1)/2+.2);
    for(const x of [tx0+.4,tx1-.4]){chair(x,tz0-.45,0);chair(x,tz1+.45,PI);}chair(tx0-.5,(tz0+tz1)/2,HALF);
    {const sc=pl.meet.screen,cm=screenMat(mod.id,'chart',chartTex());bx(S.black,[.05,.95,1.65],[sc.x-.03,1.5,sc.z],0);plane(cm,1.58,.89,[sc.x-.058,1.5,sc.z],HALF);box2(S.wood,5.45,5.9,0,.6,sc.z-.9,sc.z+.9);}
    {const wb=P('whiteboard',{dyn:TX.whiteboard(),rough:.25});plane(wb,1.9,1,[4.3,1.5,-4.885],PI);box2(S.alu,3.32,5.28,.98,1.0,-4.9,-4.82);}
    for(const x of [3,3.6])bx(P('acoustic',{c:'#3a4048',dyn:TX.weave('#3e4852'),tile:.6,rough:1}),[.02,1.2,.55],[5.88,1.5,-1.65-(x-3)*1.0],0);
    // copier, filing cabinets, water cooler, plants
    box2(S.white,.3,1.2,0,.9,-1.9,-1.25);box2(S.plastic,.3,1.2,.9,1.05,-1.9,-1.25);box2(P('copier-screen',{em:'#4aa0c0',unlit:true}),.7,.95,1.051,1.055,-1.32,-1.27);box2(S.paper,.4,.75,.6,.63,-1.25,-1.05);
    for(let i=0;i<3;i++){const x0=i*.6;box2(S.gun,x0+.01,x0+.59,0,1.3,-4.9,-4.35);for(const y of [.3,.62,.94,1.24])box2(S.steel,x0+.2,x0+.4,y,y+.02,-4.36,-4.33);}
    box2(S.white,2.2,2.6,0,.95,-4.85,-4.45);cyl(P('water',{c:'#6a9ab0',rough:.05,alpha:.55}),.3,.42,[2.4,1.16,-4.65],14);plant(2.38,-2.38,1.25);
    // signage by the south door, windows' sills
    {const sg=P('office-sign',{dyn:signTex('SUITE 400 · DATA SERVICES','#c9b48a','#101113',1024,128,'bold 54px Arial'),unlit:true});plane(sg,2.2,.28,[-.4,2.2,-4.885],PI);}
    // ceiling light panels: the aisles and the cubicle blocks (a dead one)
    for(const [x,z] of [[-4.95,1.95],[-4.95,3.85],[-4.95,-1.95],[-4.95,-3.85],[-1.05,1.95],[-1.05,3.85],[.85,1.95],[.85,3.85],[-1.05,-1.95],[-1.05,-3.85],[-3,0],[-3,3],[-3,-3],[1,0],[4.35,3],[4.4,-3.1],[4.6,0]]){
     box2(S.alu,x-.33,x+.33,t.ceil-.03,t.ceil,z-.63,z+.63);box2(x===-1.05&&z===-3.85?P('lamp-dead',{c:'#3a3c3e',rough:.4}):lamp,x-.3,x+.3,t.ceil-.035,t.ceil-.03,z-.6,z+.6);}},
   'server-room'(mod,t){const pl=t.plan,R=pl.rack,rk=rackTex(),front=P('rack-front',{c:'#ffffff',dyn:rk.alb,tile:1,rough:.4,metal:.3,emTex:rk.led}),back=P('rack-back',{c:'#ffffff',dyn:rk.back,tile:1,rough:.6}),lamp=lampOf(mod.id),body=P('rack-body',{c:'#1a1c20',tex:'district-interior/kit_gunmetal_color.jpg',tile:1,rough:.45,metal:.7});
    modState[mod.id].blink=rk.led;
    pl.rows.forEach(([x0,x1,f],r)=>{const fx=f==='e'?x1:x0,bxx=f==='e'?x0:x1,sg=f==='e'?1:-1;for(let i=0;i<R.n;i++){const z0=R.z0+i*R.w,z1=z0+R.w,zc=(z0+z1)/2;box2(body,x0,x1,0,2.05,z0+.005,z1-.005);
      const v=(i+r*2)%4;plane(front,.56,1.95,[fx+sg*.006,1.02,zc],f==='e'?-HALF:HALF,false,0,new B.Vector4(0,1-(v+1)/4,.5,1-v/4));plane(back,.56,1.95,[bxx-sg*.006,1.02,zc],f==='e'?HALF:-HALF);
      box2(S.dark,x0+.05,x1-.05,2.05,2.09,z0+.05,z1-.05);for(let k=0;k<4;k++)box2(S.black,x0+.15+k*.22,x0+.27+k*.22,2.09,2.092,z0+.1,z1-.1);
      if(r===pl.core.row&&i===pl.core.i){const tag=P('core-tag',{dyn:signTex('CORE B4','#1a1400','#c8a040',256,64,'bold 40px monospace'),rough:.5});plane(tag,.3,.075,[fx+sg*.012,1.92,zc],f==='e'?-HALF:HALF);box2(S.ledR,fx+sg*.004,fx+sg*.014,2.0,2.03,zc-.24,zc+.24);}}
     // end caps with the row letter, a strip light over the aisle
     for(const z of [R.z0,R.z0+R.n*R.w]){box2(S.gun,x0,x1,0,2.1,z-.015,z+.015);const lt=P('row-'+r,{dyn:signTex(String.fromCharCode(65+r),'#e8e8e8','#20232a',128,128,'bold 90px Arial'),rough:.5});plane(lt,.22,.22,[(x0+x1)/2,1.8,z+(z<R.z0+.1?-.02:.02)],z<R.z0+.1?0:PI);}
     // the ladder tray over the row, cables in it, drop rods to the ceiling
     const tx=(x0+x1)/2,ty=2.42,zA=R.z0-.2,zB=R.z0+R.n*R.w+.2;for(const s of [-.2,.2])box2(S.steel,tx+s-.012,tx+s+.012,ty,ty+.08,zA,zB);for(let z=zA;z<zB;z+=.3)box2(S.steel,tx-.2,tx+.2,ty,ty+.015,z-.012,z+.012);
     for(const [k,c] of [[-.1,'#8a7a2a'],[0,'#2a3a5a'],[.1,'#3a3a3a']])cyl(P('cable'+k,{c,rough:.6}),.05,zB-zA,[tx+k,ty+.05,(zA+zB)/2],8,HALF);for(const z of [zA+.2,zB-.2])box2(S.steel,tx-.01,tx+.01,ty+.08,t.ceil,z-.01,z+.01);});
    // cold-aisle and hot-aisle lights (linear, cold), the cross tray by the north wall
    for(const x of [-1,1.6])for(const z of [.4,2.6]){box2(S.dark,x-.07,x+.07,t.ceil-.06,t.ceil,z-.65,z+.65);box2(lamp,x-.04,x+.04,t.ceil-.065,t.ceil-.06,z-.6,z+.6);}
    box2(S.steel,-3.5,3.5,2.42,2.5,3.6,3.62);box2(S.steel,-3.5,3.5,2.42,2.5,3.98,4);cyl(P('cable-y',{c:'#8a7a2a',rough:.6}),.06,7,[0,2.47,3.8],8,0,HALF);
    // cooling units (two), ducts; the UPS; fire-suppression cylinders; the console
    for(const x of [-3.5,-2.7]){box2(P('crac',{c:'#b0b4b4',tex:'district-interior/kit_steel_color.jpg',tile:1.2,rough:.45,metal:.4}),x-.39,x+.39,0,1.9,-3.9,-3.1);for(let y=.2;y<1.5;y+=.06)box2(S.dark,x-.33,x+.33,y,y+.025,-3.105,-3.095);
     box2(P('crac-disp',{em:'#5ab4ff',unlit:true}),x-.12,x+.12,1.62,1.72,-3.096,-3.094);box2(S.steel,x-.3,x+.3,1.9,t.ceil,-3.85,-3.3);}
    box2(S.black,3.25,3.9,0,1.8,-2.7,-1.9);box2(P('ups-disp',{em:'#40d080',unlit:true}),3.245,3.25,1.4,1.52,-2.45,-2.15);for(let y=.2;y<1.2;y+=.1)box2(S.dark,3.244,3.25,y,y+.04,-2.65,-1.95);
    for(const z of [-2.35,-1.85]){cyl(S.red,.36,1.35,[-3.68,.68,z],16);cyl(S.dark,.12,.12,[-3.68,1.42,z],10);cyl(S.steel,.04,t.ceil-1.45,[-3.68,1.45+(t.ceil-1.45)/2,z],8);}plane(P('fire-sign',{dyn:signTex('FIRE SUPPRESSION · DO NOT ENTER ON ALARM','#e8e0d0','#5a1a16',1024,128,'bold 44px Arial'),unlit:true}),1.2,.15,[-3.893,1.8,-2.1],-HALF);
    box2(S.gun,1.2,3,.72,.76,-3.9,-3.3);box2(S.dark,1.25,2.95,0,.72,-3.88,-3.84);const cs=screenMat(mod.id,'console',consoleTex());for(const [x,u] of [[1.75,0],[2.45,1]]){bx(S.black,[.6,.36,.03],[x,1.12,-3.75],0);plane(cs,.57,.33,[x,1.12,-3.73],PI,false,0,new B.Vector4(u*.5,0,u*.5+.5,1));}
    box2(P('keyboard',{c:'#1a1b1d',rough:.6}),1.9,2.3,.76,.78,-3.55,-3.4);chair(2.1,-2.9,PI);
    {const sg=P('dc-sign',{dyn:signTex('DATA CENTRE · AUTHORISED STAFF ONLY','#d8d2c4','#14161a',1024,128,'bold 48px Arial'),unlit:true});plane(sg,1.8,.22,[1.4,2.35,-3.885],PI);}
    // sprinkler mains over everything, floor markings around the cooling units
    for(const z of [-2.5,1.5])cyl(S.red,.06,7.6,[0,t.ceil-.18,z],8,0,HALF);box2(S.amberPaint,-3.9,-2.25,.001,.004,-3.05,-3);},
   'elevator'(mod,t){const lamp=lampOf(mod.id);for(const [x0,x1,z0,z1] of [[-.88,-.84,-.7,.85],[.84,.88,-.4,.85],[-.85,.85,.84,.88]])box2(S.alu,x0,x1,.92,.96,z0,z1);
    bx(P('mirror',{c:'#6a7480',rough:.12,metal:.55}),[1.4,1.1,.01],[0,1.65,.888],0);box2(S.steel,.86,.9,.9,1.6,-.62,-.22);
    const fd=floorDisplay();drawFloor(fd,mod.floor);modState[mod.id].display=fd;plane(P('floordisp-'+mod.id,{dyn:fd,unlit:true}),.3,.11,[0,2.38,-.89],PI);
    (C.floors||[]).forEach((f,k)=>{cyl(f===mod.floor?S.ledA:S.steel,.05,.015,[.895,1.05+.2*k-(C.floors.filter(x=>x!==mod.floor).indexOf(f)>=0?0:0),-.42],14,0,HALF);});
    box2(P('cab-cam',{c:'#101010',rough:.2}),-.85,-.75,2.35,2.45,.75,.85);},
   'elevator-lobby'(mod,t){const lamp=lampOf(mod.id);// the lift surround (north wall, round the door), floor display, call panel
    const hd=t.d*M.GRID/2-M.WALL;box2(S.steel,-.85,-.68,0,2.5,hd-.06,hd);box2(S.steel,.68,.85,0,2.5,hd-.06,hd);box2(S.steel,-.85,.85,2.32,2.5,hd-.06,hd);
    const fd=floorDisplay();drawFloor(fd,mod.floor);modState[mod.id].display=fd;plane(P('floordisp-'+mod.id,{dyn:fd,unlit:true}),.34,.12,[0,2.65,hd-.012],0);
    box2(S.steel,-1.05,-.93,1.1,1.42,hd-.03,hd);cyl(S.ledA,.05,.02,[-.99,1.32,hd-.035],14,HALF);cyl(S.steel,.05,.02,[-.99,1.2,hd-.035],14,HALF);
    const dir=screenMat(mod.id,'dir',directoryTex());bx(S.black,[.05,1.05,.6],[2.875,1.5,.55],0);plane(dir,.52,.98,[2.847,1.5,.55],HALF);
    box2(S.wood,1.2,2.5,.4,.46,1.5,1.88);for(const x of [1.3,2.4])box2(S.steel,x-.03,x+.03,0,.4,1.53,1.85);plant(-2.52,1.57,1.4,'milked/milked-bamboo.glb');plant(2.6,-1.76,1.1);
    {const art=P('art-lobby',{dyn:artTex(200),rough:.6});plane(art,1.3,.95,[-2.885,1.6,-.2],-HALF);box2(S.dark,-2.9,-2.89,1.1,2.1,-.88,.48);}},
   'hall-office'(mod,t){const hd=t.d*M.GRID/2;plant(.68,2.25,1.1);{const art=P('art-hall',{dyn:artTex(15),rough:.6});plane(art,.9,.7,[-.885,1.55,3],-HALF);box2(S.dark,-.9,-.89,1.17,1.93,2.52,3.48);}
    const rn=P('runner',{c:'#4a3a34',dyn:TX.carpet(),tile:1.2,rough:1});box2(rn,-.55,.55,.001,.008,-hd+.3,hd-.3);
    for(const z of [-2.3,0,2.3]){box2(S.alu,.86,.9,1.9,2.1,z-.06,z+.06);box2(lampOf(mod.id),.85,.86,1.92,2.08,z-.04,z+.04);}},
   'hall-commercial'(mod,t){const hd=t.d*M.GRID/2,Ch=t.ceil;for(const [x,y,d,c] of [[-.72,Ch-.25,.1,'#5a5e5a'],[-.55,Ch-.18,.06,'#7a3a2a'],[.7,Ch-.3,.14,'#4a5a6a']])cyl(P('pipe'+c,{c,tex:'ncz/metal-leaks-color.jpg',tile:1,rough:.5,metal:.6}),d,hd*2-.2,[x,y,0],10,HALF);
    for(let z=-hd+.5;z<hd;z+=1.2)box2(S.dark,-.9,-.5,Ch-.32,Ch,z-.015,z+.015);box2(S.steel,.35,.85,Ch-.55,Ch-.5,-hd+.2,hd-.2);
    cyl(S.red,.16,.45,[-.8,.9,1.9],12);box2(S.dark,-.9,-.86,.8,1.3,1.82,1.98);crate(.67,2.35,.1,.55);crate(.67,2.35,.6,.4);
    {const sg=P('staff-sign',{dyn:signTex('STAFF ONLY','#e8e2d0','#5a1a16',512,128,'bold 64px Arial'),rough:.6});plane(sg,.6,.18,[-.885,1.75,-1.9],-HALF);}
    box2(S.ledR,.05,.25,Ch-.08,Ch-.04,hd-.16,hd-.12);plane(P('exit-sign',{dyn:signTex('EXIT ▲','#7cf0a0','#0a1a10',256,96,'bold 50px Arial'),unlit:true}),.5,.14,[0,2.45,-hd+.105],PI);
    box2(P('panel-box',{c:'#5a6058',rough:.5,metal:.5}),-.9,-.78,1,1.8,2.8,3.4);box2(S.dark,-.78,-.76,1.05,1.75,2.85,3.35);},
   'shop-back'(mod,t){shelving(-2.9,-.9,2.45,2.9,'x');shelving(-2.9,-2.45,.9,2.45,'z');shelving(-2.9,-2.45,-2.2,-.9,'z');
    box2(P('pallet',{c:'#6a5a40',tex:'ncz/metal-leaks-color.jpg',tile:2,rough:.9}),1,2.4,0,.14,1.2,2.6);for(let i=0;i<6;i++)crate(1.3+(i%2)*.75,1.55+Math.floor(i/2)%2*.75,rand()*.3,.45+((i>3)?0:.0));box2(P('wrap',{c:'#c8d0d0',rough:.2,alpha:.3}),1.02,2.38,.14,1.1,1.22,2.58);
    box2(S.steel,-2.9,-2.3,0,.9,-2.9,-2.3);box2(S.black,-2.85,-2.35,.6,.88,-2.85,-2.35);cyl(S.steel,.03,.5,[-2.6,1.15,-2.86],8);cyl(S.wood,.03,1.3,[-2.1,.65,-2.7],6,0,.3);
    desk(1,2.6,-2.9,-2.3,'s');safe(2.35,2.9,-2.2,-1.65);chair(1.8,-1.7,PI);for(let i=0;i<3;i++)box2(S.cardboard,-.6+i*.45,-.2+i*.45,0,.32+i*.06,2.4,2.85);
    box2(P('handtruck',{c:'#7a2a1a',rough:.5,metal:.6}),2.55,2.62,0,1.2,-.9,-.5);},
   'bar-back'(mod,t){const kg=P('keg',{c:'#c8ccd0',tex:'district-interior/kit_steel_color.jpg',tile:.6,rough:.38,metal:.6});for(let i=0;i<3;i++)for(let j=0;j<2;j++){const x=-2.6+i*.5,z=1.8+j*.55;cyl(kg,.4,.6,[x,.3,z],16);torus(S.steel,.4,.03,[x,.02,z]);torus(S.steel,.4,.03,[x,.58,z]);cyl(S.black,.05,.08,[x,.64,z],8);cyl(P('line',{c:'#c8c0a0',rough:.3,alpha:.6}),.015,t.ceil-.7,[x,.65+(t.ceil-.7)/2,z],6);}
    box2(S.steel,-2.9,-1.2,2.3,2.4,2.8,2.9);box2(S.gun,-2.9,-1.1,0,.06,1.4,2.9);
    shelving(1,2.9,2.45,2.9,'x',true);for(let i=0;i<4;i++)crate(2.6,1.15+i%2*.6,.0,.32+Math.floor(i/2)*.32);
    desk(-2.9,-2.3,-2.6,-1,'w');chair(-1.8,-1.8,-HALF);const cc=screenMat(mod.id,'cctv',cctvTex());bx(S.black,[.04,.36,.6],[-2.88,1.8,-1.8],0);plane(cc,.56,.33,[-2.857,1.8,-1.8],-HALF);
    safe(2.35,2.9,-2.9,-2.35);box2(S.steel,1,2.2,0,.9,-2.9,-2.35);box2(S.dark,1.05,2.15,.9,.94,-2.88,-2.37);for(let i=0;i<10;i++)cyl(P('glassware',{c:'#c8d4d8',rough:.05,alpha:.35}),.07,.12,[1.15+i%5*.22,1,-2.75+Math.floor(i/5)*.2],8);
    box2(S.dark,-.2,.2,.001,.006,-.2,.2);for(let k=-3;k<=3;k++)box2(S.black,-.18,.18,.006,.008,k*.05-.01,k*.05+.01);   // floor drain
    {const n=P('neon-old',{em:'#a05a30',unlit:true});plane(P('poster-bar',{dyn:artTex(340),rough:.7}),.6,.8,[1.2,1.6,-2.885],PI);box2(n,1.6,2.6,2.25,2.27,2.87,2.88);}},
   'clinic'(mod,t){const lamp=lampOf(mod.id);// exam bed under the surgical lamp, vitals monitor, IV stand, curtain
    box2(S.steel,-2.6,-.9,.45,.5,1.6,2.4);for(const x of [-2.5,-1])for(const z of [1.7,2.3])box2(S.steel,x-.02,x+.02,0,.45,z-.02,z+.02);box2(P('mattress',{c:'#2a3a44',rough:.7}),-2.58,-.92,.5,.64,1.62,2.38);box2(S.paper,-2.4,-1.1,.641,.645,1.7,2.3);box2(S.white,-2.55,-2.2,.64,.72,1.7,2.3);
    cyl(S.steel,.05,t.ceil-1.8,[-1.75,1.8+(t.ceil-1.8)/2,2],8);cyl(S.white,.6,.12,[-1.75,1.75,2],20);cyl(P('surg-lamp',{em:'#fff6e8',unlit:true}),.5,.01,[-1.75,1.685,2],20);
    cyl(S.steel,.04,1.4,[-.55,.7,2.55],8);bx(S.black,[.5,.34,.06],[-.55,1.55,2.55],PI);plane(screenMat(mod.id,'ecg',ecgTex()),.46,.3,[-.55,1.55,2.517],PI);
    cyl(S.steel,.025,1.8,[-.7,.9,1.45],8);box2(P('iv-bag',{c:'#c8d8e0',rough:.1,alpha:.5}),-.76,-.64,1.55,1.8,1.42,1.48);box2(S.steel,-2.9,-.6,2.39,2.41,1.25,1.27);box2(P('curtain',{c:'#5a7a7a',dyn:TX.weave('#3e4852'),tile:.6,rough:1}),-2.85,-1.9,.3,2.35,1.23,1.29);
    // medicine cabinet, fridge
    box2(S.white,1.1,2.9,0,2,2.45,2.9);box2(S.steel,1.1,2.9,1.98,2.02,2.42,2.9);box2(S.dark,1.1,2.9,0,.08,2.42,2.45);box2(S.steel,1.95,2.05,.95,1.0,2.4,2.43);for(const y of [.35,.7])box2(S.dark,1.12,2.88,y,y+.01,2.43,2.44);box2(S.glass,1.15,2.85,1.1,1.95,2.43,2.44);for(const y of [1.25,1.5,1.75])box2(S.steel,1.15,2.85,y,y+.02,2.5,2.88);for(let i=0;i<14;i++)box2(P('med'+(i%3),{c:['#e8e4d8','#c86a4a','#4a8ac8'][i%3],rough:.5}),1.2+i*.11,1.26+i*.11,1.27+(i%3)*.25,1.4+(i%3)*.25,2.55,2.65);
    box2(S.white,2.4,2.9,0,1.6,1.1,2.1);box2(S.glass,2.38,2.39,.1,1.5,1.15,2.05);box2(S.dark,2.37,2.4,.02,.1,1.1,2.1);box2(S.steel,2.35,2.38,.6,1.2,1.15,1.18);for(let i=0;i<8;i++)cyl(P('vial'+(i%2),{c:i%2?'#8a3a2a':'#c8d4e0',rough:.2}),.06,.16,[2.6,.3+Math.floor(i/4)*.45,1.3+(i%4)*.2],8);box2(P('fridge-light',{em:'#d8ecff',unlit:true}),2.5,2.85,1.45,1.47,1.2,2);
    // the counter with a sink, supplies; the terminal desk
    box2(S.white,-2.9,-2.3,0,.88,-2.8,-1);box2(S.steel,-2.9,-2.3,.88,.92,-2.8,-1);box2(S.dark,-2.8,-2.4,.86,.921,-2.2,-1.6);cyl(S.steel,.03,.35,[-2.8,1.09,-1.9],8);for(let i=0;i<5;i++)box2(P('jar'+(i%2),{c:i%2?'#e8e4d8':'#a8c8d8',rough:.3}),-2.8,-2.6,.92,1.02+rand()*.1,-2.7+i*.16,-2.58+i*.16);
    desk(1.1,2.7,-2.9,-2.3,'s',screenMat(mod.id,'term',ecgTex()));chair(1.9,-1.75,PI);cyl(P('biohazard',{c:'#8a7a2a',rough:.5}),.35,.5,[2.6,.25,-1.4],12);
    {const sg=P('clinic-sign',{dyn:signTex('CLINIC · NO WEAPONS','#e8f0f0','#2a4a4a',512,128,'bold 52px Arial'),unlit:true});plane(sg,1,.25,[-1.5,2.2,-2.885],PI);}},
   'storage'(mod,t){shelving(-1.9,-.2,1.45,1.9,'x');shelving(-1.9,-1.45,.1,1.45,'z');const lk=P('locker',{c:'#4a5a5a',tex:'district-interior/kit_steel_color.jpg',tile:.8,rough:.45,metal:.7});
    for(let i=0;i<4;i++){const z0=-1.9+i*.45;box2(lk,1.45,1.9,0,1.9,z0+.01,z0+.44);for(const y of [1.5,1.6,1.7])box2(S.black,1.448,1.45,y,y+.02,z0+.1,z0+.34);box2(S.steel,1.446,1.45,.95,1.1,z0+.36,z0+.38);}
    for(let i=0;i<3;i++)box2(S.cardboard,.15+i*.38,.5+i*.38,0,.3+(i%2)*.3,-1.9,-1.5);box2(P('breaker',{c:'#6a6e66',rough:.5,metal:.5}),.4,1,1.2,1.85,-1.9,-1.82);box2(S.dark,.45,.95,1.25,1.8,-1.821,-1.819);},
   'maint-corridor'(mod,t){const hd=t.d*M.GRID/2,Ch=t.ceil;const pm=(c)=>P('mpipe'+c,{c,tex:'ncz/metal-leaks-color.jpg',nrm:'ncz/metal-leaks-normal.jpg',tile:1,rough:.5,metal:.65});
    for(const [x,y,d,c] of [[-.78,Ch-.2,.16,'#6a5a4a'],[-.6,Ch-.15,.08,'#5a6a5a'],[.76,Ch-.25,.2,'#6a6058'],[.55,Ch-.14,.07,'#7a3a2a'],[-.82,.25,.1,'#5a5e5a'],[.82,.3,.12,'#4a4e52']])cyl(pm(c),d,hd*2-.2,[x,y,0],12,HALF);
    for(let z=-hd+.4;z<hd;z+=1){box2(S.dark,-.9,-.7,Ch-.35,Ch,z-.02,z+.02);box2(S.dark,.6,.9,Ch-.4,Ch,z-.02,z+.02);}
    box2(S.rust,.62,.9,0,1.4,-2.6,-1.6);for(const z of [-2.35,-1.85]){cyl(pm('#6a5a4a'),.12,.3,[.5,1.1,z],10,0,HALF);torus(S.red,.26,.03,[.33,1.1,z],0,0);}
    box2(P('junction',{c:'#5a6058',rough:.5,metal:.6}),-.9,-.72,.6,1.8,-2.4,-1.4);box2(S.ledA,-.721,-.719,1.6,1.65,-2.2,-2.15);box2(S.ledG,-.721,-.719,1.6,1.65,-2.05,-2);for(let i=0;i<3;i++)cyl(S.dark,.04,Ch-1.8,[-.8,1.8+(Ch-1.8)/2,-2.2+i*.3],6);
    {const sg=P('maint-sign',{dyn:signTex('MAINTENANCE · HIGH VOLTAGE','#1a1400','#c8a040',1024,128,'bold 52px Arial'),rough:.6});plane(sg,1.2,.18,[-.885,2.05,.9],-HALF);}
    box2(S.dark,-.06,.06,.009,.012,-hd+.2,hd-.2);}};
  // steel shelving with stock (axis: the shelf's long side), and the small pieces several rooms share
  function shelving(x0,x1,z0,z1,axis,bottles){const sm=P('shelf',{c:'#4a5058',tex:'district-interior/kit_steel_color.jpg',tile:.8,rough:.5,metal:.7}),h=2;for(const [x,z] of [[x0,z0],[x0,z1],[x1,z0],[x1,z1]])box2(sm,x-.025+(x===x1?-.0:0),x+.025,0,h,z-.025,z+.025);
   for(const y of [.12,.6,1.1,1.6,1.98]){box2(sm,x0,x1,y,y+.025,z0,z1);const L=axis==='x'?x1-x0:z1-z0;let u=.05;while(u<L-.15&&y<1.9){const w=.18+rand()*.32,hgt=.15+rand()*.3,c=bottles?P('bottle'+Math.floor(rand()*3),{c:['#3a2a1a','#2a3a2a','#5a4a2a'][Math.floor(rand()*3)],rough:.1,alpha:.85}):rand()<.7?S.cardboard:P('stock'+Math.floor(rand()*3),{c:['#8a8a7a','#3a4a5a','#6a3a2a'][Math.floor(rand()*3)],rough:.6});
     if(bottles){for(let b=0;b<3;b++)cyl(c,.07,.28,axis==='x'?[x0+u+b*.08,y+.17,(z0+z1)/2]:[(x0+x1)/2,y+.17,z0+u+b*.08],8);u+=.3;continue;}
     if(axis==='x')box2(c,x0+u,x0+u+w,y+.025,y+.025+hgt,z0+.04,z1-.04);else box2(c,x0+.04,x1-.04,y+.025,y+.025+hgt,z0+u,z0+u+w);u+=w+.04;}}}
  function desk(x0,x1,z0,z1,face,scrMat){box2(S.gun,x0,x1,.72,.76,z0,z1);for(const x of [x0+.04,x1-.04])box2(S.steel,x-.025,x+.025,0,.72,z0+.04,z1-.04);const xc=(x0+x1)/2,zc=(z0+z1)/2,sm=scrMat||screenMat(cur===rootN?'':Object.keys(modState).find(k=>modState[k].node===cur),'pc',deskAtlas());
   if(face==='s'){bx(S.black,[.55,.34,.03],[xc,1.12,z0+.12],0);plane(sm,.52,.31,[xc,1.12,z0+.137],PI,false,0,new B.Vector4(0,0,.5,.5));box2(P('keyboard',{c:'#1a1b1d',rough:.6}),xc-.22,xc+.22,.76,.78,z0+.3,z0+.45);}
   else{bx(S.black,[.03,.34,.55],[x0+.12,1.12,zc],0);plane(sm,.52,.31,[x0+.137,1.12,zc],-HALF,false,0,new B.Vector4(.5,0,1,.5));box2(P('keyboard',{c:'#1a1b1d',rough:.6}),x0+.3,x0+.45,.76,.78,zc-.22,zc+.22);}
   bx(S.paper,[.25,.02,.32],[xc+.3,.77,zc],.2);}
  function safe(x0,x1,z0,z1){box2(S.gun,x0,x1,0,.72,z0,z1);cyl(S.steel,.1,.03,[x0-.01,.45,(z0+z1)/2],14,0,HALF);box2(S.steel,x0-.03,x0,.22,.27,z0+.12,z1-.12);}

  // ---- build every module of the cluster ----
  for(const mod of C.mods){const t=M.TYPES[mod.type],sty=styleOf(mod.type);const node=new B.TransformNode('module-'+mod.id,scene);node.parent=rootN;node.position.set(mod.cx,0,mod.cz);node.rotation.y=mod.rot*HALF;
   modState[mod.id]={node,sty,t,mod,lightsOff:false};cur=node;lightsOn[mod.id]=true;
   shell(mod,t,sty);try{(BUILD[mod.type]||(()=>{}))(mod,t,sty);}catch(e){console.warn('[modules] build '+mod.type,e);}
   for(const l of t.lights.slice(0,low?1:2))pointLight(mod.id,[l[0],l[1],l[2]],l[3],l[4]*1.4,l[5]*1.25);
   (mod.items||[]).forEach(it=>{const y=Number.isFinite(it.y)?it.y:0;const k=P('item-'+it.type,{c:it.type==='loot'?'#6a5a2a':it.type==='mission-item'?'#2a4a6a':it.type==='note'?'#d8d4c8':'#4a4a4a',rough:.5,metal:.4});box2(k,it.x-.16,it.x+.16,y,y+.12,it.z-.11,it.z+.11);box2(S.ledA,it.x-.03,it.x+.03,y+.12,y+.125,it.z-.11,it.z-.1);});}
  // ================================================================ the doors (world metres): frame, sliding slab, lamps, access points, the vestibule beyond an exit
  cur=rootN;const doors=[],sound=()=>{try{root.VoidAudio?.event?.('door');}catch{}};
  for(const d of C.doors){const ax=d.tg[0]!==0,x=d.x,z=d.z,Wd=M.DOOR.w,H=M.DOOR.h,fw=M.DOOR.frame;const sideMod=C.mods.find(m=>m.id===M.parseRef(d.side).mod),otherMod=d.kind==='snap'?C.mods.find(m=>m.id===M.parseRef(d.side===d.a?d.b:d.a).mod):null;
   const sty=(sideMod&&sideMod.type==='elevator')||(otherMod&&otherMod.type==='elevator')?'cab':styleOf(sideMod?sideMod.type:'hall-office');const frame=sty==='cab'?S.steel:S.gun,slabMat=sty==='cab'?S.steel:(STY[sty]||STY.corp).door;
   const B2=(mat,a0,a1,y0,y1,b0,b1,dyn)=>ax?box2(mat,x+a0,x+a1,y0,y1,z+b0,z+b1,dyn):box2(mat,x+b0,x+b1,y0,y1,z+a0,z+a1,dyn);   // a: along the wall, b: across it
   const half=Wd/2;B2(frame,-half,-half+fw,0,H+.1,-.13,.13);B2(frame,half-fw,half,0,H+.1,-.13,.13);B2(frame,-half,half,H,H+.1,-.13,.13);B2(S.steel,-half+fw,half-fw,0,.012,-.12,.12);
   // a bi-parting door: two leaves slide apart into the wall on both sides (they fit a 2 m wall: no leaf ever shows past the module)
   const leaf=(a0,a1)=>{const m=B2(slabMat,a0,a1,0,H,-.025,.025,true);if(sty!=='cab'){const w=B2(sty==='corp'||sty==='lobby'?S.frost:S.glass,(a0+a1)/2-.06,(a0+a1)/2+.06,1.2,1.85,-.027,.027,true);w.parent=m;w.position.subtractInPlace(m.position);}
    return m;};
   const lA=leaf(-half+fw,-.004),lB=leaf(.004,half-fw);
   const lamps={};for(const [k,m] of [['open',S.ledG],['locked',S.ledR],['mine',S.ledA]])lamps[k]=B2(m,-.3,.3,H+.11,H+.14,-.14,.14,true);
   const sA=A.slider({mesh:lA,dir:[-d.tg[0],-d.tg[1]],dist:half-fw+.02,lamps,locked:!!d.locked,mine:d.kind!=='snap',sound}),sB=A.slider({mesh:lB,dir:[d.tg[0],d.tg[1]],dist:half-fw+.02,locked:!!d.locked,mine:d.kind!=='snap'});
   const s={id:d.id,rec:d,range:1.8,mesh:lA,get t(){return sA.t;},get locked(){return sA.locked;},get mine(){return sA.mine;},near(v){sA.near(v);sB.near(v);},tick(dt){sA.tick(dt);sB.tick(dt);},force(v){sA.force(v);sB.force(v);},set(o){sA.set(o);sB.set(o);},dispose(){lA.dispose();lB.dispose();}};doors.push(s);
   // the access points (one on each side that is here): a card reader with a screen and a red / green LED
   for(const [ref,pos] of Object.entries(d.ap||{})){const pw=d.side===ref?d:null,n=ref===d.side?d.n:[-d.n[0],-d.n[1]];const px=pos[0],pz=pos[2],o=.03;
    if(ax){box2(S.dark,px-.1,px+.1,1.22,1.52,pz-o*n[1]-.02,pz-o*n[1]+.02);box2(S.apScreen,px-.065,px+.065,1.42,1.49,pz-n[1]*.055-.003,pz-n[1]*.055+.003);}else{box2(S.dark,px-o*n[0]-.02,px-o*n[0]+.02,1.22,1.52,pz-.1,pz+.1);box2(S.apScreen,px-n[0]*.055-.003,px-n[0]*.055+.003,1.42,1.49,pz-.065,pz+.065);}
    const mk=m=>ax?box2(m,px-.015,px+.015,1.28,1.31,pz-n[1]*.06-.005,pz-n[1]*.06+.005,true):box2(m,px-n[0]*.06-.005,px-n[0]*.06+.005,1.28,1.31,pz-.015,pz+.015,true);const r=mk(S.ledR),g=mk(S.ledG);r.isVisible=!!d.locked;g.isVisible=!d.locked;apLeds[ref]={r,g};}
   // beyond an exit: a short dark vestibule (walls, a ceiling, an EXIT sign over the door) so an open door never shows the void
   if(d.leads){const n=d.n,V=(mat,a0,a1,y0,y1,c0,c1)=>ax?box2(mat,x+a0,x+a1,y0,y1,z+n[1]*c0,z+n[1]*c1):box2(mat,x+n[0]*c0,x+n[0]*c1,y0,y1,z+a0,z+a1);
    const vm=P('vest',{c:'#2a2c30',tex:'district-interior/kit_gunmetal_color.jpg',tile:1.2,rough:.6,metal:.4});const V2=(mat,a0,a1,y0,y1,c0,c1)=>{const lo=Math.min(c0,c1),hi2=Math.max(c0,c1);V(mat,a0,a1,y0,y1,lo,hi2);};
    V2(vm,-.75,-.6,0,2.5,.1,1.3);V2(vm,.6,.75,0,2.5,.1,1.3);V2(S.void,-.75,.75,0,2.5,1.25,1.3);V2(vm,-.75,.75,2.45,2.5,.1,1.3);V2(S.concrete,-.75,.75,-.02,0,.1,1.3);V2(P('vest-lamp',{em:'#ffb070',unlit:true}),-.4,.4,2.43,2.45,.6,.7);
    const sg=P(d.leads==='street'?'exit-street':'exit-door',{dyn:signTex(d.leads==='street'?'EXIT · STREET':'EXIT','#7cf0a0','#08140c',256,64,'bold 34px Arial'),unlit:true});const sp=plane(sg,.42,.11,[x-n[0]*.14,H+.3,z-n[1]*.14],Math.atan2(-n[0],-n[1])+PI);}}
  // the shared collision of each door (walkingLocation.solids): closed unless the door is open
  const doorSolids=new Map((def.solids||[]).filter(s=>s.door).map(s=>[s.door,s]));
  const merged=merge();
  // ---- lights on / off (per module), screens on / off (per module) ----
  function setLights(on,mod){const ids=mod?[mod]:C.mods.map(m=>m.id);for(const id of ids){lightsOn[id]=!!on;const st=modState[id];if(!st)continue;const lm=st.lamp;if(lm){if(!lm.metadata.base)lm.metadata.base=lm.emissiveColor.clone();lm.emissiveColor=on?lm.metadata.base.clone():lm.metadata.base.scale(.04);}
    for(const l of realLights)if(l.metadata.mod===id)l.intensity=on?l.metadata.on:0;}
   const offN=C.mods.filter(m=>lightsOn[m.id]===false).length;if(amb)amb.intensity=MOOD.ai*(1-.62*offN/Math.max(1,C.mods.length));}
  const screenOn={};function setScreen(mod,on){screenOn[mod]=!!on;for(const m of modState[mod]?.screens||[]){if(!m.metadata.tex)m.metadata.tex=m.emissiveTexture;m.emissiveTexture=on?m.metadata.tex:null;m.emissiveColor=on?B.Color3.Black():new B.Color3(.004,.005,.006);}}
  for(const m of C.mods){if(m.lightsOff)setLights(false,m.id);if(m.screenOff)setScreen(m.id,false);else screenOn[m.id]=true;}
  // ---- tick: doors (and their collision), LED blink ----
  let clock=0,blinkT=0;
  function tick(time,player){const dt=Math.min(.1,Math.max(0,clock?time-clock:0));clock=time;const p=player||(typeof walker!=='undefined'?walker:null);
   for(const d of doors){if(p){const dx=d.rec.x-p.x,dz=d.rec.z-p.z;d.near(dx*dx+dz*dz<d.range*d.range);}d.tick(dt);const so=doorSolids.get(d.id);if(so)so.open=d.t>.62;}
   blinkT+=dt;if(blinkT>.45){blinkT=0;for(const st of Object.values(modState))if(st.blink&&screenOn[st.mod.id]!==false)st.blink.uOffset=st.blink.uOffset?0:.5;}}
  function disposeAll(){disposed=true;for(const d of doors)try{d.dispose?.();}catch{}for(const c of containers)try{c.dispose();}catch{}for(const n of props)try{n.dispose(false,false);}catch{}rootN.dispose(false,true);for(const x of own)try{x.dispose();}catch{}
   scene.clearColor=prev.clear;scene.fogMode=prev.fogMode;scene.fogDensity=prev.fogDensity;scene.fogColor=prev.fogColor;ip.exposure=prev.exposure;ip.contrast=prev.contrast;scene.environmentIntensity=prev.env;
   if(sun&&lp.sun!=null)sun.intensity=lp.sun;if(amb){if(lp.amb!=null)amb.intensity=lp.amb;if(lp.dif)amb.diffuse=lp.dif;if(lp.gnd&&amb.groundColor)amb.groundColor=lp.gnd;}}
  return {area:'module',modular:true,cluster:C.id,tick,dispose:disposeAll,doors,lights:setLights,lightsOf:id=>lightsOn[id]!==false,get lightsOn(){return C.mods.every(m=>lightsOn[m.id]!==false);},screen:setScreen,screenOf:id=>screenOn[id]!==false,
   door:id=>doors.find(d=>d.id===id)||null,unlock(id){const d=doors.find(x=>x.id===id);if(d){d.set({locked:false});for(const ref of [d.rec.a,d.rec.b])if(apLeds[ref]){apLeds[ref].r.isVisible=false;apLeds[ref].g.isVisible=true;}}},
   accessPoint(ap,st){const ref=String(ap||'').split('/').pop(),l=apLeds[ref];if(l){l.r.isVisible=st!=='open';l.g.isVisible=st==='open';}},
   prepare:()=>Promise.race([Promise.allSettled(late),new Promise(r=>setTimeout(r,8000))]),stats:()=>({merged,doors:doors.length,lights:realLights.length,meshes:rootN.getChildMeshes().length+own.filter(x=>x.getClassName&&x.getClassName()==='Mesh').length,props:props.length})};}
 root.VoidModules=Object.assign(root.VoidModules||{},{build});
})(globalThis);
