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
   back:{amb:'#aaa898',gnd:'#4a4640',ai:1.1,exp:1.35,env:.4,clear:[.012,.012,.011]},clinic:{amb:'#b8c4c8',gnd:'#343838',ai:1.05,exp:1.3,env:.45,clear:[.012,.014,.015]},
   den:{amb:'#b09a84',gnd:'#4a3e34',ai:1.2,exp:1.45,env:.4,clear:[.012,.01,.008]},kitchen:{amb:'#b0aa9c',gnd:'#4a4038',ai:1.1,exp:1.35,env:.42,clear:[.012,.011,.01]},garage:{amb:'#9aa0a4',gnd:'#3a3a38',ai:1.05,exp:1.4,env:.4,clear:[.01,.011,.012]},
   tunnel:{amb:'#9c9a90',gnd:'#3a3832',ai:1.05,exp:1.45,env:.35,clear:[.008,.008,.008]},pit:{amb:'#9a9688',gnd:'#38342e',ai:1.05,exp:1.45,env:.3,clear:[.008,.007,.006]},gang:{amb:'#a49a8c',gnd:'#3a3630',ai:1.05,exp:1.45,env:.3,clear:[.009,.008,.007]}}[def.style]||{amb:'#9aa0a8',gnd:'#222',ai:.75,exp:1.25,env:.3,clear:[.01,.01,.012]};
  scene.clearColor=new B.Color4(...MOOD.clear,1);scene.fogMode=B.Scene.FOGMODE_EXP2;scene.fogDensity=.01;scene.fogColor=new B.Color3(...MOOD.clear);ip.exposure=MOOD.exp;ip.contrast=1.18;scene.environmentIntensity=MOOD.env;
  if(def.network)scene.fogDensity=.02;   // the tunnel network: the far end of a long tunnel sinks into the dark
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
  /* A NETWORK (def.network: the shared tunnel network under the city, ncz-underground.js): hundreds of metres of modules, so static pieces merge per material AND per 40 m
     chunk (frustum culling keeps working), the lamps share one material per style, and a small pool of real lights follows the player to the nearest fixtures. */
  const NET=!!def.network,chunkKey=m=>{if(cur!==rootN&&cur.metadata&&cur.metadata.chunk)return cur.metadata.chunk;return Math.floor(m.position.x/40)+','+Math.floor(m.position.z/40);},partMat=new Map();
  const add=(m,mat,dynamic)=>{m.material=mat;m.isPickable=false;m.parent=cur;if(dynamic)return m;const k=NET?mat.uniqueId+'|'+chunkKey(m):mat;if(NET)partMat.set(k,mat);if(!parts.has(k))parts.set(k,[]);parts.get(k).push(m);return m;};
  function bx(mat,[w,h,d],[x,y,z],ry=0,dynamic=false){const t=(mat.metadata&&mat.metadata.tile)||1,fu=[[w,h],[w,h],[d,h],[d,h],[w,d],[w,d]].map(([a,b])=>new B.Vector4(0,0,Math.max(.05,a/t),Math.max(.05,b/t)));
   const m=B.MeshBuilder.CreateBox('mod-box',{width:w,height:h,depth:d,faceUV:fu,wrap:true},scene);m.position.set(x,y,z);m.rotation.y=ry;return add(m,mat,dynamic);}
  const box2=(mat,x0,x1,y0,y1,z0,z1,dyn)=>bx(mat,[Math.max(.001,x1-x0),Math.max(.001,y1-y0),Math.max(.001,z1-z0)],[(x0+x1)/2,(y0+y1)/2,(z0+z1)/2],0,dyn);
  function cyl(mat,d,h,[x,y,z],tess=12,rx=0,rz=0,top=null,dyn=false){const m=B.MeshBuilder.CreateCylinder('mod-cyl',{diameterBottom:d,diameterTop:top??d,height:h,tessellation:tess},scene);m.position.set(x,y,z);m.rotation.x=rx;m.rotation.z=rz;return add(m,mat,dyn);}
  function plane(mat,w,h,[x,y,z],ry=0,dynamic=false,rx=0,uv=null){const o={width:w,height:h};if(uv){o.frontUVs=uv;o.backUVs=uv;o.sideOrientation=B.Mesh.DOUBLESIDE;}const m=B.MeshBuilder.CreatePlane('mod-plane',o,scene);m.position.set(x,y,z);m.rotation.y=ry;m.rotation.x=rx;return add(m,mat,dynamic);}
  function torus(mat,d,th,[x,y,z],rx=0,ry=0){const m=B.MeshBuilder.CreateTorus('mod-torus',{diameter:d,thickness:th,tessellation:16},scene);m.position.set(x,y,z);m.rotation.x=rx;m.rotation.y=ry;return add(m,mat);}
  function merge(){let n=0;for(const [key,list] of parts){const mat=partMat.get(key)||key;if(!list.length)continue;const mm=list.length>1?B.Mesh.MergeMeshes(list,true,true,undefined,false,false):list[0];if(!mm)continue;mm.name='mod-merged-'+mat.name;mm.material=mat;mm.parent=list.length>1?null:mm.parent;mm.isPickable=false;if(mm.parent===null&&parent)mm.parent=null;mm.freezeWorldMatrix();if(NET)mm.addLODLevel(low?60:75,null);own.push(mm);n++;}parts.clear();return n;}
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
  /* CORPORATE MOTIVATIONAL POSTERS (the owner's own lines, 19 Nov 2026): plain black text on a plain white sheet, clean sans-serif, nothing else (the owner: no graphics,
     icons, logos or gradients). One DynamicTexture per poster (owned, disposed with the room). */
  function posterTex(text){return canvas(384,512,(g,w,h)=>{g.fillStyle='#f2f2ef';g.fillRect(0,0,w,h);g.fillStyle='#111111';g.textAlign='center';g.textBaseline='alphabetic';let fs=44;const words=text.split(' ');let lines=[];
    for(;fs>=20;fs-=2){g.font='bold '+fs+'px Arial, Helvetica, sans-serif';lines=[];let ln='';for(const wd of words){const t=ln?ln+' '+wd:wd;if(g.measureText(t).width>w*.8&&ln){lines.push(ln);ln=wd;}else ln=t;}lines.push(ln);if(lines.length*fs*1.25<h*.7)break;}
    const top=(h-lines.length*fs*1.25)/2+fs*.95;lines.forEach((t,i)=>g.fillText(t,w/2,top+i*fs*1.25));},'mod-poster');}
  function artTex(hue){return canvas(256,320,(g,w,h)=>{const gr=g.createLinearGradient(0,0,w,h);gr.addColorStop(0,'hsl('+hue+',30%,20%)');gr.addColorStop(1,'hsl('+(hue+40)+',25%,8%)');g.fillStyle=gr;g.fillRect(0,0,w,h);for(let i=0;i<5;i++){g.fillStyle='hsla('+(hue+i*25)+',35%,'+(30+rand()*30)+'%,.5)';g.fillRect(rand()*w*.7,rand()*h*.7,40+rand()*90,6+rand()*60);}g.strokeStyle='rgba(230,220,200,.5)';g.lineWidth=2;g.beginPath();g.arc(w*.6,h*.4,50,0,5);g.stroke();},'mod-art');}
  function floorDisplay(){const t=new B.DynamicTexture('mod-floordisp',{width:256,height:96},scene,true);own.push(t);return t;}
  // ---- VARIOUS and THE UNDERGROUND: textures drawn here (generic, original designs: no real brands, no real writing systems, no religious symbols) ----
  const alphaTex=t=>{t.hasAlpha=true;return t;};
  TX.mesh=()=>TX._mh??=alphaTex(canvas(256,256,(g,w,h)=>{g.clearRect(0,0,w,h);g.strokeStyle='#a4aaaa';g.lineWidth=3;for(let k=-h;k<w+h;k+=32){g.beginPath();g.moveTo(k,0);g.lineTo(k+h,h);g.stroke();g.beginPath();g.moveTo(k,h);g.lineTo(k+h,0);g.stroke();}g.strokeStyle='rgba(90,60,40,.5)';g.lineWidth=2;for(let i=0;i<30;i++){const x=rand()*w,y=rand()*h;g.beginPath();g.moveTo(x,y);g.lineTo(x+6,y+6);g.stroke();}},'mod-mesh'));
  TX.blob=()=>TX._bl??=alphaTex(canvas(256,256,(g,w,h)=>{g.clearRect(0,0,w,h);for(let i=0;i<9;i++){const x=w*(.3+rand()*.4),y=h*(.3+rand()*.4),r=30+rand()*70,gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(255,255,255,'+(.35+rand()*.3)+')');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,w,h);}},'mod-blob'));
  TX.puff=()=>TX._pf??=alphaTex(canvas(128,256,(g,w,h)=>{g.clearRect(0,0,w,h);for(let i=0;i<14;i++){const y=h*(.15+rand()*.75),x=w*(.35+rand()*.3)+Math.sin(y*.04)*14,r=14+rand()*30,gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(220,220,214,'+(.12+rand()*.12)+')');gr.addColorStop(1,'rgba(220,220,214,0)');g.fillStyle=gr;g.fillRect(0,0,w,h);}},'mod-puff'));
  TX.drawers=()=>TX._dr??=canvas(512,512,(g,w,h)=>{g.fillStyle='#2a2c2e';g.fillRect(0,0,w,h);const c=10,r=14,cw=w/c,rh=h/r;for(let i=0;i<c;i++)for(let j=0;j<r;j++){const x=i*cw,y=j*rh,v=rand();g.fillStyle=v<.7?'#8a8e8a':v<.85?'#6a7a8a':'#8a6a4a';g.fillRect(x+2,y+2,cw-4,rh-4);g.fillStyle='rgba(0,0,0,.25)';g.fillRect(x+2,y+rh-6,cw-4,4);g.fillStyle='#e8e4d8';g.fillRect(x+cw*.2,y+5,cw*.6,8);g.fillStyle='#3a3a3a';g.fillRect(x+cw*.25,y+8,cw*.3*rand()+cw*.1,2);g.fillStyle='#2a2a2a';g.fillRect(x+cw*.38,y+rh*.62,cw*.24,4);}grime(g,w,h,.6);},'mod-drawers');
  TX.foam=()=>TX._fo??=canvas(256,256,(g,w,h)=>{g.fillStyle='#2a2a2e';g.fillRect(0,0,w,h);const n=8,s2=w/n;for(let i=0;i<n;i++)for(let j=0;j<n;j++){const x=i*s2+s2/2,y=j*s2+s2/2,gr=g.createRadialGradient(x-6,y-6,2,x,y,s2*.6);gr.addColorStop(0,(i+j)%2?'#56565c':'#1a1a1e');gr.addColorStop(1,(i+j)%2?'#2a2a2e':'#3e3e44');g.fillStyle=gr;g.fillRect(i*s2,j*s2,s2,s2);}speck(g,w,h,2500,.06);},'mod-foam');
  TX.peg=()=>TX._pg??=canvas(512,256,(g,w,h)=>{g.fillStyle='#6a5a44';g.fillRect(0,0,w,h);g.fillStyle='#2a2218';for(let x=8;x<w;x+=16)for(let y=8;y<h;y+=16){g.beginPath();g.arc(x,y,2.4,0,7);g.fill();}
   const tool=(x,y,l,a,c,wd)=>{g.save();g.translate(x,y);g.rotate(a);g.fillStyle='rgba(0,0,0,.35)';g.fillRect(-wd/2+3,3,wd,l);g.fillStyle=c;g.fillRect(-wd/2,0,wd,l);g.beginPath();g.arc(0,0,wd*.9,0,7);g.fill();g.restore();};for(let i=0;i<14;i++)tool(30+i*34,30+rand()*30,80+rand()*90,(rand()-.5)*.3,['#8a9096','#7a1e1a','#2a2c30','#c8a040','#5a6068'][i%5],6+rand()*8);grime(g,w,h,.5);},'mod-peg');
  TX.shoji=()=>TX._sj??=canvas(256,512,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#e0c898');gr.addColorStop(1,'#c8a878');g.fillStyle=gr;g.fillRect(0,0,w,h);speck(g,w,h,3000,.04);g.fillStyle='rgba(120,80,40,.12)';g.fillRect(w*.55,h*.62,w*.3,h*.18);
   g.fillStyle='#2a1a10';const c=3,r=6;for(let i=0;i<=c;i++)g.fillRect(i*w/c-(i===c?8:0)-(i&&i<c?3:0),0,i===0||i===c?8:6,h);for(let j=0;j<=r;j++)g.fillRect(0,j*h/r-(j===r?8:0)-(j&&j<r?3:0),w,j===0||j===r?8:6);grime(g,w,h,.4);},'mod-shoji');
  TX.tatami=()=>TX._tt??=canvas(256,256,(g,w,h)=>{g.fillStyle='#a8985e';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=3){g.fillStyle='rgba(60,50,20,'+(.08+rand()*.08)+')';g.fillRect(0,y,w,1.5);}for(let i=0;i<6;i++){const x=rand()*w,y=rand()*h,r=20+rand()*50,gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(50,40,20,.22)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,w,h);}},'mod-tatami');
  TX.felt=()=>TX._fe??=canvas(256,256,(g,w,h)=>{g.fillStyle='#24543a';g.fillRect(0,0,w,h);speck(g,w,h,6000,.06);const gr=g.createRadialGradient(w/2,h/2,10,w/2,h/2,w*.7);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.35)');g.fillStyle=gr;g.fillRect(0,0,w,h);g.fillStyle='rgba(20,10,5,.25)';g.beginPath();g.arc(w*.7,h*.3,12,0,7);g.fill();},'mod-felt');
  TX.graffiti=k=>alphaTex(canvas(512,256,(g,w,h)=>{g.clearRect(0,0,w,h);const cols=[['#c84a3a','#e8d8c0'],['#3a8ac8','#101010'],['#c8b03a','#2a1a3a'],['#8a3ac0','#e8e8e8']][k%4];g.lineCap='round';g.lineJoin='round';
   for(let pass=0;pass<2;pass++){g.strokeStyle=pass?cols[0]:cols[1];g.lineWidth=pass?14:24;g.globalAlpha=pass?.9:.75;g.beginPath();let x=40,y=h*.6;g.moveTo(x,y);for(let i=0;i<9;i++){const nx=x+30+rand()*30,ny=h*(.3+rand()*.45);g.quadraticCurveTo(x+rand()*40,h*(.15+rand()*.7),nx,ny);x=nx;y=ny;}g.stroke();}
   g.globalAlpha=.8;g.strokeStyle=cols[0];g.lineWidth=3;for(let i=0;i<8;i++){const x=60+rand()*360,y=h*.55+rand()*30;g.beginPath();g.moveTo(x,y);g.lineTo(x+rand()*2,y+20+rand()*60);g.stroke();}g.globalAlpha=1;},'mod-graffiti'));
  function flashTex(k){return canvas(384,512,(g,w,h)=>{g.fillStyle='#e8e0cc';g.fillRect(0,0,w,h);speck(g,w,h,2000,.05);const ink='#121010',col=['#a82a20','#2a6a3a','#2a4a8a','#c89a20'];
    const cellW=w/3,cellH=h/3;for(let i=0;i<9;i++){const cx=(i%3+.5)*cellW,cy=(Math.floor(i/3)+.5)*cellH,s=cellW*.32,kind=(i+k*4)%9;g.save();g.translate(cx,cy);g.lineWidth=4;g.strokeStyle=ink;g.fillStyle=col[(i+k)%4];g.beginPath();
     if(kind===0){for(let a=0;a<10;a++){const r=a%2?s*.45:s,an=a*Math.PI/5-Math.PI/2;g.lineTo(Math.cos(an)*r,Math.sin(an)*r);}g.closePath();}
     else if(kind===1){g.moveTo(0,s*.8);g.bezierCurveTo(-s*1.2,-s*.1,-s*.5,-s,0,-s*.35);g.bezierCurveTo(s*.5,-s,s*1.2,-s*.1,0,s*.8);}
     else if(kind===2){g.moveTo(-s*.2,-s);g.lineTo(s*.4,-s*.1);g.lineTo(0,-s*.1);g.lineTo(s*.25,s);g.lineTo(-s*.4,0);g.lineTo(0,0);g.closePath();}
     else if(kind===3){g.arc(0,0,s*.8,.6,Math.PI*2-.6);g.arc(s*.35,0,s*.6,Math.PI*2-.9,.9,true);g.closePath();}
     else if(kind===4){g.moveTo(-s,s*.2);for(let x=-s;x<=s;x+=4)g.lineTo(x,Math.sin(x/s*Math.PI*1.5)*s*.35);g.lineTo(s,s*.6);g.lineTo(-s,s*.6);g.closePath();}
     else if(kind===5){for(let p=0;p<5;p++){const an=p*Math.PI*2/5;g.moveTo(0,0);g.ellipse(Math.cos(an)*s*.45,Math.sin(an)*s*.45,s*.42,s*.22,an,0,7);}}
     else if(kind===6){g.moveTo(0,-s);g.lineTo(s*.15,s*.3);g.lineTo(-s*.15,s*.3);g.closePath();g.rect(-s*.35,s*.3,s*.7,s*.1);g.rect(-s*.08,s*.4,s*.16,s*.45);}
     else if(kind===7){g.ellipse(0,0,s,s*.5,0,0,7);g.fill();g.stroke();g.beginPath();g.fillStyle=ink;g.arc(0,0,s*.25,0,7);}
     else{g.moveTo(0,-s);g.lineTo(s*.7,0);g.lineTo(0,s);g.lineTo(-s*.7,0);g.closePath();}
     g.fill();g.stroke();g.restore();}grime(g,w,h,.3);},'mod-flash');}
  function mixerTex(){return canvas(512,256,(g,w,h)=>{g.fillStyle='#18191c';g.fillRect(0,0,w,h);for(let c=0;c<12;c++){const x=16+c*40;g.fillStyle='#24262a';g.fillRect(x,8,34,h-16);for(let k=0;k<4;k++){g.fillStyle='#3a3c40';g.beginPath();g.arc(x+17,26+k*24,8,0,7);g.fill();g.fillStyle=['#c8c4b8','#c84a3a','#3a8ac8','#c8a03a'][k];g.fillRect(x+16,18+k*24,2,7);}
    g.fillStyle='#050505';g.fillRect(x+15,128,4,100);const fy=140+rand()*70;g.fillStyle='#d8d4c8';g.fillRect(x+7,fy,20,10);g.fillStyle='#e8e2d0';g.fillRect(x+4,h-30,26,8);for(let m=0;m<6;m++){g.fillStyle=m<4?'#2a8a3a':m<5?'#c8a020':'#c82a20';g.globalAlpha=rand()<.6?1:.25;g.fillRect(x+28,200-m*8,4,5);g.globalAlpha=1;}}grime(g,w,h,.4);},'mod-mixer');}
  function waveTex(){return canvas(512,288,(g,w,h)=>{g.fillStyle='#04070a';g.fillRect(0,0,w,h);g.fillStyle='#e85a3a';g.font='bold 22px monospace';g.fillText('● LIVE  03:12:44',16,30);g.fillStyle='#8ab0c8';g.font='15px monospace';g.fillText('TX 94.7  ·  LISTENERS ?',300,30);
    g.strokeStyle='#5ad0a0';g.lineWidth=1.5;g.beginPath();for(let x=0;x<w;x+=2){const a=(Math.sin(x*.05)+Math.sin(x*.13)*.5)*(.3+rand()*.7)*50;g.moveTo(x,h*.55-a);g.lineTo(x,h*.55+a);}g.stroke();g.fillStyle='rgba(0,0,0,.25)';for(let y=0;y<h;y+=3)g.fillRect(0,y,w,1);},'mod-wave');}
  function ordersTex(){return canvas(512,288,(g,w,h)=>{g.fillStyle='#0a0806';g.fillRect(0,0,w,h);g.fillStyle='#ffb050';g.font='bold 20px monospace';g.fillText('ORDERS · KITCHEN',14,26);const rows=['#112  BEEF NOODLE  x2','#113  DUMPLINGS  x12','#114  BROTH, NO EGG','#115  RICE  x3  (RUSH)','#116  NOODLE, EXTRA CHILLI','#117  TO GO · BACK DOOR'];
    rows.forEach((r,i)=>{g.fillStyle=i===3?'#ff6a3a':'#e8d8b8';g.font='16px monospace';g.fillText(r,18,62+i*34);g.fillStyle='rgba(255,176,80,.25)';g.fillRect(14,70+i*34,w-28,1);});g.fillStyle='rgba(0,0,0,.25)';for(let y=0;y<h;y+=3)g.fillRect(0,y,w,1);},'mod-orders');}
  function scanTex(){return canvas(512,320,(g,w,h)=>{g.fillStyle='#030a10';g.fillRect(0,0,w,h);g.strokeStyle='#4aa0d0';g.lineWidth=2;g.beginPath();g.arc(140,60,22,0,7);g.moveTo(140,82);g.lineTo(140,190);g.moveTo(100,100);g.lineTo(180,100);g.moveTo(100,100);g.lineTo(80,180);g.moveTo(180,100);g.lineTo(200,180);g.moveTo(140,190);g.lineTo(115,290);g.moveTo(140,190);g.lineTo(165,290);g.stroke();
    g.strokeStyle='#ffb04a';g.lineWidth=4;g.beginPath();g.moveTo(180,100);g.lineTo(200,180);g.stroke();for(const [x,y] of [[180,100],[190,140],[200,180]]){g.beginPath();g.arc(x,y,5,0,7);g.stroke();}
    g.fillStyle='#9ad0f0';g.font='bold 18px monospace';g.fillText('FIT CHECK · L ARM',260,40);g.font='14px monospace';['SERVO 1 ..... OK','SERVO 2 ..... OK','SERVO 3 ..... CAL','GRIP ........ 82%','LINK ........ STABLE'].forEach((t,i)=>g.fillText(t,260,80+i*26));g.fillStyle='rgba(0,0,0,.25)';for(let y=0;y<h;y+=3)g.fillRect(0,y,w,1);},'mod-scan');}
  function scopeTex(){return canvas(256,192,(g,w,h)=>{g.fillStyle='#031008';g.fillRect(0,0,w,h);g.strokeStyle='rgba(60,160,90,.35)';g.lineWidth=1;for(let x=0;x<w;x+=32){g.beginPath();g.moveTo(x,0);g.lineTo(x,h);g.stroke();}for(let y=0;y<h;y+=32){g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke();}g.strokeStyle='#6af0a0';g.lineWidth=2;g.beginPath();for(let x=0;x<w;x+=2){const y=h/2+Math.sin(x*.09)*40+(x%64<4?-30:0);x?g.lineTo(x,y):g.moveTo(x,y);}g.stroke();},'mod-scope');}
  function sleevesTex(){return canvas(512,512,(g,w,h)=>{g.fillStyle='#1a1410';g.fillRect(0,0,w,h);for(let r=0;r<4;r++){let x=4;while(x<w-4){const sw=4+rand()*7;g.fillStyle='hsl('+Math.floor(rand()*360)+','+(20+rand()*40)+'%,'+(15+rand()*35)+'%)';g.fillRect(x,r*128+10,sw,112);x+=sw+.6;}g.fillStyle='#3a2a1e';g.fillRect(0,r*128+122,w,6);}grime(g,w,h,.4);},'mod-sleeves');}
  function inkTex(){return canvas(256,512,(g,w,h)=>{g.fillStyle='#d8ccb0';g.fillRect(0,0,w,h);speck(g,w,h,3000,.05);for(let L=0;L<3;L++){g.fillStyle='rgba(20,18,16,'+(.18+L*.22)+')';g.beginPath();g.moveTo(0,h*(.45+L*.13));for(let x=0;x<=w;x+=16)g.lineTo(x,h*(.4+L*.13)-Math.abs(Math.sin(x*.02+L*2))*h*(.16-L*.03)-rand()*6);g.lineTo(w,h);g.lineTo(0,h);g.closePath();g.fill();}
    g.strokeStyle='rgba(20,18,16,.6)';g.lineWidth=3;for(let i=0;i<3;i++){g.beginPath();g.moveTo(w*.6+i*14,h*.12);g.quadraticCurveTo(w*.7,h*.2,w*.62+i*10,h*.3);g.stroke();}const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'rgba(90,60,20,.15)');gr.addColorStop(1,'rgba(90,60,20,.3)');g.fillStyle=gr;g.fillRect(0,0,w,h);},'mod-ink');}
  function charmTex(k){return canvas(64,256,(g,w,h)=>{g.fillStyle=['#d8c89a','#e0d0a8','#c8b888'][k%3];g.fillRect(0,0,w,h);g.strokeStyle='#8a1a14';g.lineWidth=4;g.lineCap='round';for(let i=0;i<6;i++){const y=30+i*34;g.beginPath();g.moveTo(14+rand()*8,y);g.quadraticCurveTo(w/2,y+rand()*20-10,w-14-rand()*8,y+rand()*14);g.stroke();if(rand()<.6){g.beginPath();g.moveTo(w/2,y-8);g.lineTo(w/2+rand()*8-4,y+18);g.stroke();}}
    g.fillStyle='rgba(138,26,20,.8)';g.beginPath();g.arc(w/2,h-26,12,0,7);g.fill();grime(g,w,h,.5);},'mod-charm');}
  function altarTex(){return canvas(512,320,(g,w,h)=>{g.fillStyle='#1e120c';g.fillRect(0,0,w,h);const gr=g.createRadialGradient(w/2,h*.45,10,w/2,h*.45,120);gr.addColorStop(0,'#c89a40');gr.addColorStop(.6,'#8a6020');gr.addColorStop(1,'rgba(60,40,10,0)');g.fillStyle=gr;g.beginPath();g.arc(w/2,h*.45,110,0,7);g.fill();
    g.strokeStyle='rgba(220,180,90,.6)';g.lineWidth=3;for(const r of [70,90])g.beginPath(),g.arc(w/2,h*.45,r,0,7),g.stroke();g.fillStyle='rgba(30,20,12,.9)';g.beginPath();g.moveTo(0,h);for(let x=0;x<=w;x+=20)g.lineTo(x,h*.82-Math.abs(Math.sin(x*.015))*60);g.lineTo(w,h);g.fill();
    g.strokeStyle='rgba(200,160,90,.35)';g.lineWidth=2;for(let i=0;i<5;i++){g.beginPath();const y=40+i*12;g.moveTo(30+i*6,y);g.bezierCurveTo(90,y-20,120,y+20,170,y);g.stroke();g.beginPath();g.moveTo(w-30-i*6,y);g.bezierCurveTo(w-90,y-20,w-120,y+20,w-170,y);g.stroke();}grime(g,w,h,.6);},'mod-altar');}
  function oddsTex(){return canvas(384,256,(g,w,h)=>{g.fillStyle='#1c201e';g.fillRect(0,0,w,h);g.fillStyle='rgba(220,220,210,.08)';for(let i=0;i<8;i++)g.fillRect(rand()*w,rand()*h,80+rand()*120,10+rand()*30);g.strokeStyle='rgba(230,230,220,.7)';g.lineWidth=2;for(let r=0;r<5;r++){g.beginPath();g.moveTo(20,40+r*44);g.lineTo(w-20,40+r*44);g.stroke();}
    g.strokeStyle='rgba(230,230,220,.45)';g.lineWidth=3;for(let i=0;i<10;i++){const y=26+Math.floor(i/2)*44,x=i%2?220:30;g.beginPath();g.moveTo(x,y);for(let k=0;k<6;k++)g.lineTo(x+12+k*14,y+(rand()-.5)*10);g.stroke();}g.fillStyle='rgba(230,230,220,.8)';g.font='bold 22px monospace';g.fillText('VS',176,32);},'mod-odds');}
  // the shared VARIOUS materials: chain-link, decals (stains, puddles), smoke / steam, graffiti
  function meshMat(){const m=P('mesh',{c:'#a8aeae',dyn:TX.mesh(),tile:.5,rough:.45,metal:.75});if(!m.metadata.cut){m.metadata.cut=1;m.useAlphaFromAlbedoTexture=true;m.transparencyMode=1;m.alphaCutOff=.35;m.backFaceCulling=false;}return m;}
  function decalMat(key,c,rough,metal=0,a=.85){const m=P(key,{c,dyn:TX.blob(),tile:1,rough,metal});if(!m.metadata.cut){m.metadata.cut=1;m.useAlphaFromAlbedoTexture=true;m.transparencyMode=2;m.alpha=a;}return m;}
  const stainMat=()=>decalMat('stain','#0e0b08',.6),puddleMat=()=>decalMat('puddle','#0c1014',.03,.35,.9),oilMat=()=>decalMat('oil','#050505',.15,.2);
  function smokeMat(key,c='#dcdcd6',a=.55){const m=P(key,{dyn:TX.puff(),unlit:true});if(!m.metadata.cut){m.metadata.cut=1;m.opacityTexture=TX.puff();m.emissiveColor=B.Color3.FromHexString(c).scale(.55);m.emissiveTexture=null;m.alpha=a;}return m;}
  const graffMat=k=>{const m=P('graffiti'+k,{c:'#ffffff',dyn:TX.graffiti(k),tile:1,rough:.7});if(!m.metadata.cut){m.metadata.cut=1;m.useAlphaFromAlbedoTexture=true;m.transparencyMode=2;}return m;};
  const decal=(m,w,d,x,z,y=.004,ry=0)=>plane(m,w,d,[x,y,z],ry,false,HALF);
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
  // VARIOUS and THE UNDERGROUND (20 Nov 2026): warm wood (tea house, card room, tattoo, shrine), a kitchen, a garage, service tunnels, the fight pit, a gang checkpoint
  STY.den={...STY.corp,floor:P('den-floor',{c:'#8a7464',dyn:TX.planks('#3a2a20','#140c08'),tile:1.4,rough:.5}),wall:P('den-wall',{c:'#a09080',dyn:TX.plaster('#4e4238',true),tile:1.4,rough:.9}),wain:P('den-wain',{c:'#8a7060',dyn:TX.planks('#2e2018','#100a06'),tile:1.2,rough:.45}),
   ceil:P('den-ceil',{c:'#3a3430',tex:'ncz/concrete-old-color.jpg',tile:2.5,rough:.95}),skirt:S.black,rail:S.dark,door:P('door-den',{c:'#4a3a30',tex:'ncz/metal-leaks-color.jpg',nrm:'ncz/metal-leaks-normal.jpg',tile:1.2,rough:.55,metal:.5}),lamp:'#ffc890'};
  STY.kitchen={...STY.back,floor:P('quarry',{c:'#a08070',dyn:TX.tiles('#6a4434'),tile:1.6,rough:.55}),wall:P('kitchen-wall',{c:'#cfcabc',dyn:TX.tiles('#a8a494'),tile:1.2,rough:.35}),
   wain:P('stainless',{c:'#b8bcbc',tex:'district-interior/kit_steel_color.jpg',nrm:'district-interior/kit_steel_normal.jpg',tile:.8,rough:.3,metal:.85}),lamp:'#fff0d8'};
  STY.garage={...STY.maint,floor:P('garage-floor',{c:'#6e6c66',tex:'ncz/concrete-old-color.jpg',nrm:'ncz/concrete-old-normal.jpg',tile:2,rough:.8}),lamp:'#eef2f4'};
  STY.tunnel={...STY.maint,floor:P('wet-floor',{c:'#5a5a56',tex:'ncz/concrete-old-color.jpg',nrm:'ncz/concrete-old-normal.jpg',tile:2,rough:.32}),wall:P('tunnel-wall',{c:'#8a8a80',tex:'ncz/concrete-mold-color.jpg',nrm:'ncz/concrete-mold-normal.jpg',tile:2,rough:.85}),
   wain:P('tunnel-wain',{c:'#4a4a44',tex:'ncz/concrete-mold-color.jpg',tile:2,rough:.6}),ceil:P('tunnel-ceil',{c:'#4a4a46',tex:'ncz/concrete-old-color.jpg',tile:2,rough:.95}),door:S.rust,lamp:'#ffd8a0'};
  STY.pit={...STY.tunnel,floor:P('pit-floor',{c:'#6a6862',tex:'ncz/concrete-old-color.jpg',nrm:'ncz/concrete-old-normal.jpg',tile:2.4,rough:.85}),wall:P('pit-wall',{c:'#7a7a74',tex:'ncz/concrete-old-color.jpg',nrm:'ncz/concrete-old-normal.jpg',tile:2.5,rough:.92}),lamp:'#ffe6c0'};
  STY.gang={...STY.back,floor:P('gang-floor',{c:'#6a6862',tex:'ncz/concrete-old-color.jpg',nrm:'ncz/concrete-old-normal.jpg',tile:2,rough:.8}),wall:P('gang-wall',{c:'#9a9890',dyn:TX.blocks('#6a6a64',true),tile:2,rough:.92}),wain:P('gang-wain',{c:'#3a3a36',dyn:TX.blocks('#2e2e2a',true),tile:2,rough:.85}),
   door:P('door-gang',{c:'#5a5048',tex:'ncz/metal-leaks-color.jpg',nrm:'ncz/metal-leaks-normal.jpg',tile:1,rough:.6,metal:.7}),lamp:'#ffcf90'};
  // shared VARIOUS materials made once (lazily: only the rooms that use them pay for their textures)
  const VM={};const darkWood=()=>VM.dw??=P('dark-wood',{c:'#6a5040',dyn:TX.planks('#3a2418','#120a06'),tile:1,rough:.5}),lacquer=()=>VM.lq??=P('lacquer',{c:'#2a1612',rough:.2,metal:.05}),
   cushion=()=>VM.cu??=P('cushion',{c:'#5a2a26',dyn:TX.weave('#4a2420'),tile:.4,rough:1}),celadon=()=>VM.ce??=P('celadon',{c:'#7a9a88',rough:.2}),brass=()=>VM.br??=P('brass',{c:'#a08040',rough:.35,metal:.9}),
   tatami=()=>VM.ta??=P('tatami',{c:'#b8a878',dyn:TX.tatami(),tile:1,rough:1}),rug=()=>VM.rg??=P('rug',{c:'#5a2a22',dyn:TX.weave('#4a2018'),tile:.8,rough:1}),leather=()=>VM.le??=P('leather',{c:'#1c1a1a',rough:.45}),
   shoji=()=>{if(VM.sj)return VM.sj;const tx=TX.shoji(),m=P('shoji',{c:'#c8b490',dyn:tx,tile:1,rough:.9,emTex:tx});m.emissiveColor=new B.Color3(.55,.44,.3);return VM.sj=m;},
   esd=()=>VM.es??=P('esd-mat',{c:'#2a4a5a',rough:.8}),pipeM=c=>P('mpipe'+c,{c,tex:'ncz/metal-leaks-color.jpg',nrm:'ncz/metal-leaks-normal.jpg',tile:1,rough:.5,metal:.65});
  const styleOf=type=>type==='elevator'?'cab':type==='elevator-lobby'?'lobby':type==='maint-corridor'?'maint':type==='clinic'?'clinic':(M.TYPES[type]&&M.TYPES[type].style)||'corp';
  // per module: its own fixture material (lights on / off per module) and screen material (screens on / off)
  const modState={};
  const lampOf=id=>{const st=modState[id];return st.lamp??=P(NET?'lamp-net-'+st.sty:'lamp-'+id,{em:STY[st.sty].lamp||'#eef',unlit:true});};
  // warm paper lanterns (amber, not white): their own material per module, dimmed by the light switch with the module's lamps
  const paperOf=id=>{const st=modState[id];if(st.paper)return st.paper;const m=P(NET?'paper-lamp-net':'paper-lamp-'+id,{em:'#b8642a',unlit:true});if(!NET)(st.extra??=[]).push(m);return st.paper=m;};
  const screenMat=(id,key,tex)=>{const st=modState[id];const m=P('scr-'+id+'-'+key,{dyn:tex,unlit:true});(st.screens??=[]).push(m);return m;};
  // ---- real lights ----
  const realLights=[],cap=low?1:Math.min(6,C.mods.length*2),anchors=[];
  function pointLight(modId,[x,y,z],hex,intensity,range){if(NET){const mn=modState[modId].node;mn.computeWorldMatrix(true);anchors.push({p:B.Vector3.TransformCoordinates(new B.Vector3(x,y,z),mn.getWorldMatrix()),c:B.Color3.FromHexString(hex),i:intensity,r:range,mod:modId});return null;}
   if(realLights.length>=cap)return null;const mn=modState[modId].node;mn.computeWorldMatrix(true);const p=B.Vector3.TransformCoordinates(new B.Vector3(x,y,z),mn.getWorldMatrix());
   const l=new B.PointLight('mod-light-'+modId,p,scene);l.diffuse=B.Color3.FromHexString(hex);l.specular=l.diffuse.scale(.35);l.intensity=intensity;l.range=range;l.metadata={on:intensity,mod:modId};own.push(l);realLights.push(l);return l;}
  // ---- props: repository models as instances (one draw call per source mesh) ----
  const propCache=new Map();
  function prop(file,[x,y,z],ry,h,standIn){if(low||!root.VoidAssets?.loadContainer){standIn?.();return;}const node=cur;
   if(!propCache.has(file))propCache.set(file,root.VoidAssets.loadContainer({src:'assets/models/'+file},scene,null,'mod:'+file).then(c=>{containers.push(c);for(const m of c.materials)if('usePhysicalLightFalloff' in m){m.usePhysicalLightFalloff=false;m.environmentIntensity=.5;m.maxSimultaneousLights=6;}return c;}));
   late.push(propCache.get(file).then(c=>{if(disposed)return;if(file.includes('office-chair')&&!c.metadata?.toned){c.metadata={...(c.metadata||{}),toned:true};for(const m of c.materials)if(m.albedoColor){m.albedoTexture=null;m.albedoColor=B.Color3.FromHexString('#1c1e22');m.roughness=.55;m.metallic=.25;}}   /* Milked's pink trim: a corporate charcoal here */const inst=c.instantiateModelsToScene(n=>'mod-'+n,false,{doNotInstantiate:false}),n=new B.TransformNode('mod-prop',scene);n.parent=node;for(const r0 of inst.rootNodes)r0.parent=n;
     n.position.set(x,0,z);n.rotation.y=ry;n.computeWorldMatrix(true);for(const m of n.getChildMeshes())m.computeWorldMatrix(true);const bb=n.getHierarchyBoundingVectors(true),sc=h/Math.max(.01,bb.max.y-bb.min.y),py=node&&node.getAbsolutePosition?node.getAbsolutePosition().y:0;n.scaling.setAll(sc);n.position.y=y-(bb.min.y-py)*sc;   // (20 Nov 2026) measured from its parent's height: underground (y -3) a prop stood ~0.6 m off its mark
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
  function shell(mod,t,sty){const s=STY[sty],hw=t.w*M.GRID/2,hd=t.d*M.GRID/2,Ch=t.ceil,Wt=M.WALL,lamp=lampOf(mod.id),seam=new Set(mod.seam||[]);
   if(t.stairs){box2(s.floor,-hw,hw,-.02,0,-hd,-.5);box2(s.floor,-hw,.25,-.02,0,-.5,hd);box2(s.ceil,-hw,hw,Ch,Ch+.04,-hd,1);box2(s.ceil,-.25,hw,Ch,Ch+.04,1,hd);}   // a stairwell: the shaft down (east) and the opening up (west)
   else{box2(s.floor,-hw,hw,-.02,0,-hd,hd);box2(s.ceil,-hw,hw,Ch,Ch+.04,-hd,hd);}
   const openAt=e=>t.sockets.filter(so=>so.edge===e&&mod.open.includes(so.id)).map(so=>{const c=M.sockLocal(t,so);return (e==='s'||e==='n')?c[0]:c[1];}).sort((a,b)=>a-b);
   const win=t.windows&&!mod.edges[t.windows]?.neighbour?t.windows:null;
   for(const e of ['s','n','w','e']){if(seam.has(e))continue;   // a seam between two tunnel tubes: no wall
    const along=(e==='s'||e==='n')?hw:hd,gaps=openAt(e),dw=M.DOOR.w/2;let a=-along;const segs=[];for(const g of gaps){segs.push([a,g-dw]);a=g+dw;}segs.push([a,along]);
    // a box on this edge: along u0..u1, height y0..y1, from the wall face `f0` (0 = the boundary) inward by depth
    const E=(mat,u0,u1,y0,y1,f0,dep)=>{if(u1-u0<.005)return;if(e==='s')box2(mat,u0,u1,y0,y1,-hd+f0,-hd+f0+dep);else if(e==='n')box2(mat,u0,u1,y0,y1,hd-f0-dep,hd-f0);else if(e==='w')box2(mat,-hw+f0,-hw+f0+dep,y0,y1,u0,u1);else box2(mat,hw-f0-dep,hw-f0,y0,y1,u0,u1);};
    for(const [u0,u1] of segs){if(win===e&&u1-u0>1.2){E(s.wall,u0,u1,0,.95,0,Wt);E(s.wall,u0,u1,2.45,Ch,0,Wt);windowBand(e,u0,u1,hw,hd,Ch);}else E(s.wall,u0,u1,0,Ch,0,Wt);
     if(sty==='corp'||sty==='lobby'||sty==='den'){E(s.wain,u0,u1,.1,.92,Wt,.02);E(s.rail,u0,u1,.92,.96,Wt,.03);E(s.skirt,u0,u1,0,.1,Wt,.025);E(S.dark,u0,u1,Ch-.06,Ch,Wt,.04);}
     else if(sty==='clinic'||sty==='kitchen'){E(s.wain,u0,u1,0,1.25,Wt,.012);E(s.rail,u0,u1,1.25,1.29,Wt,.02);}
     else if(sty==='tech'){E(s.wain,u0,u1,0,1.1,Wt,.015);E(S.black,u0,u1,0,.08,Wt,.03);for(let u=Math.ceil(u0/1.2)*1.2;u<u1-.05;u+=1.2)E(S.black,u-.01,u+.01,.08,Ch,Wt,.006);}
     else if(sty==='back'||sty==='maint'||sty==='garage'||sty==='gang'||sty==='tunnel'||sty==='pit'){E(s.wain,u0,u1,0,1.1,Wt,.006);E(S.dark,u0,u1,0,.12,Wt,.02);}
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
   else if(sty==='tech'||sty==='den'||sty==='gang'||sty==='pit'||t.tube||t.ownLamps){}   // their own fixtures (racks' strips, lanterns, bulbs, work lights, tunnel lamps)
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
    plant(3.28,4.62,1.35,'milked/milked-bamboo.glb');
    // four framed motivational posters (the owner's lines): two over the west cubicles and one by the meeting nook in the open office, the surveillance one in the manager's glass office
    {const PW=.6,PH=.8,frame=P('poster-frame',{c:'#0c0c0c',rough:.4,metal:.2});const poster=(key,text,x,z,ry)=>{const tx=posterTex(text),m=P('poster-'+key,{c:'#ffffff',dyn:tx,tile:1,rough:.3,metal:0,emTex:tx});m.emissiveColor=new B.Color3(.08,.08,.08);
      const n=ry===PI?[0,1]:ry===-HALF?[1,0]:[-1,0];bx(frame,[n[0]?.02:PW+.03,PH+.03,n[0]?PW+.03:.02],[x,1.95,z],0);plane(m,PW,PH,[x+n[0]*.016,1.95,z+n[1]*.016],ry);};
     poster('think','Think outside the box. Stay inside your cubicle',-5.885,3.85,-HALF);
     poster('watch','The corporation believes in you. Surveillance confirms it.',5.885,2.6,HALF);
     poster('individual','Individuality is encouraged within approved parameters',-5.885,-3.85,-HALF);
     poster('team','Teamwork makes the shareholders\' dreams work',2.5,-4.885,PI);}
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
  // ================================================================ VARIOUS (20 Nov 2026): small businesses and back-street rooms; THE UNDERGROUND
  // small shared pieces: a safe facing any way, a stool, a wooden chair, a bulb on its flex, a paper lantern, a low table with cushions, a backlit paper screen
  function safeF(x0,x1,z0,z1,f){box2(S.gun,x0,x1,0,.72,z0,z1);const xc=(x0+x1)/2,zc=(z0+z1)/2;if(f==='w'||f==='e'){const x=f==='w'?x0:x1,o=f==='w'?-1:1;cyl(S.steel,.1,.03,[x+o*.01,.45,zc],14,0,HALF);box2(S.steel,Math.min(x,x+o*.03),Math.max(x,x+o*.03),.22,.27,z0+.12,z1-.12);}
   else{const z=f==='s'?z0:z1,o=f==='s'?-1:1;cyl(S.steel,.1,.03,[xc,.45,z+o*.01],14,HALF);box2(S.steel,x0+.12,x1-.12,.22,.27,Math.min(z,z+o*.03),Math.max(z,z+o*.03));}}
  function stool(x,z,h=.62){cyl(S.dark,.34,.05,[x,h,z],14);cyl(S.steel,.04,h,[x,h/2,z],8);cyl(S.dark,.42,.03,[x,.015,z],12);}
  function woodChair(x,z,ry){const c=Math.cos(ry),s=Math.sin(ry);box2(S.wood,x-.22,x+.22,.44,.48,z-.22,z+.22);bx(S.wood,[.42,.5,.04],[x-s*.2,.74,z-c*.2],ry);for(const a of [-.18,.18])for(const b of [-.18,.18])box2(S.dark,x+a-.02,x+a+.02,0,.44,z+b-.02,z+b+.02);}
  function bulb(x,z,y,Ch,lamp){cyl(S.black,.01,Ch-y,[x,y+(Ch-y)/2,z],6);cyl(S.dark,.05,.05,[x,y+.02,z],8);cyl(lamp,.08,.11,[x,y-.06,z],10,0,0,.05);}
  function lantern(x,z,y,Ch,lamp,d=.42){lamp=paperOf(Object.keys(modState).find(k=>modState[k].node===cur)||'');cyl(S.black,.01,Ch-y-.24,[x,y+.24+(Ch-y-.24)/2,z],6);cyl(lamp,d,.46,[x,y,z],16);cyl(S.dark,d*.7,.03,[x,y+.24,z],12);cyl(S.dark,d*.7,.03,[x,y-.24,z],12);for(let k=-1;k<=1;k++)torus(S.dark,d+.01,.006,[x,y+k*.12,z]);}
  function lowTable(x0,x1,z0,z1,y0=0){const lq=lacquer(),xc=(x0+x1)/2,zc=(z0+z1)/2,cu=cushion();box2(lq,x0,x1,y0+.34,y0+.4,z0,z1);for(const x of [x0+.06,x1-.06])for(const z of [z0+.06,z1-.06])box2(lq,x-.03,x+.03,y0,y0+.34,z-.03,z+.03);
   const ce=celadon();cyl(ce,.07,.06,[xc-.2,y0+.43,zc+.12],10);cyl(ce,.07,.06,[xc+.22,y0+.43,zc-.1],10);cyl(P('teapot',{c:'#3a2a22',rough:.4}),.16,.13,[xc,y0+.465,zc],12);cyl(P('teapot',{c:'#3a2a22',rough:.4}),.03,.12,[xc+.1,y0+.49,zc],6,0,-1);
   const cs=[];if(x1-x0>=z1-z0){cs.push([xc,z0-.35],[xc,z1+.35],[x0-.35,zc],[x1+.35,zc]);}else cs.push([x0-.35,zc],[x1+.35,zc],[xc,z0-.35],[xc,z1+.35]);for(const [cx,cz] of cs)box2(cu,cx-.27,cx+.27,y0+.001,y0+.09,cz-.27,cz+.27);}
  function tatamiMats(x0,x1,z0,z1,y=0){const ta=tatami(),ed=P('tatami-edge',{c:'#1a1a14',rough:.9}),n=Math.max(1,Math.round((x1-x0)/1)),w=(x1-x0)/n;for(let i=0;i<n;i++){const a=x0+i*w;box2(ta,a+.005,a+w-.005,y,y+.03,z0,z1);box2(ed,a+.005,a+.045,y,y+.032,z0,z1);box2(ed,a+w-.045,a+w-.005,y,y+.032,z0,z1);}}
  function shojiWall(e,u0,u1,hw,hd,y0=.12,y1=2.1){const sj=shoji(),dw=darkWood(),w=u1-u0,c=(u0+u1)/2,h=y1-y0,yc=(y0+y1)/2,f=.004;
   if(e==='n'){plane(sj,w,h,[c,yc,hd-.1-f],0);box2(dw,u0,u1,y1,y1+.06,hd-.14,hd-.1);box2(dw,u0,u1,y0-.06,y0,hd-.14,hd-.1);}else if(e==='s'){plane(sj,w,h,[c,yc,-hd+.1+f],PI);box2(dw,u0,u1,y1,y1+.06,-hd+.1,-hd+.14);box2(dw,u0,u1,y0-.06,y0,-hd+.1,-hd+.14);}
   else if(e==='w'){plane(sj,w,h,[-hw+.1+f,yc,c],-HALF);box2(dw,-hw+.1,-hw+.14,y1,y1+.06,u0,u1);box2(dw,-hw+.1,-hw+.14,y0-.06,y0,u0,u1);}else{plane(sj,w,h,[hw-.1-f,yc,c],HALF);box2(dw,hw-.14,hw-.1,y1,y1+.06,u0,u1);box2(dw,hw-.14,hw-.1,y0-.06,y0,u0,u1);}}
  function kettleSet(x,z,y){box2(S.black,x-.15,x+.15,y,y+.04,z-.15,z+.15);cyl(P('kettle',{c:'#6a6660',rough:.3,metal:.8}),.2,.18,[x,y+.13,z],14,0,0,.13);torus(S.dark,.14,.012,[x,y+.27,z],HALF);cyl(P('kettle',{c:'#6a6660',rough:.3,metal:.8}),.03,.14,[x+.12,y+.14,z],6,0,-.9);}
  function bonsai(x,z,y){box2(P('pot',{c:'#4a3a32',rough:.6}),x-.14,x+.14,y,y+.12,z-.14,z+.14);cyl(P('bark',{c:'#3a2a1e',rough:.9}),.045,.26,[x,y+.24,z],6,.3);for(const [dx,dy,dz,d] of [[-.08,.36,0,.24],[.1,.42,.05,.2],[0,.5,-.04,.16]])cyl(P('leaf',{c:'#2e4a2a',rough:.8}),d,.07,[x+dx,y+dy,z+dz],8,0,0,d*.6);}
  function inkScroll(x,z,y,ry,w=.5,h=1){plane(P('scroll',{dyn:inkTex(),rough:.8}),w,h,[x,y,z],ry);const dw=darkWood(),o=ry===HALF||ry===-HALF;if(o){box2(dw,x-.015,x+.015,y+h/2,y+h/2+.03,z-w/2-.04,z+w/2+.04);box2(dw,x-.015,x+.015,y-h/2-.03,y-h/2,z-w/2-.04,z+w/2+.04);}else{box2(dw,x-w/2-.04,x+w/2+.04,y+h/2,y+h/2+.03,z-.015,z+.015);box2(dw,x-w/2-.04,x+w/2+.04,y-h/2-.03,y-h/2,z-.015,z+.015);}}
  const graffiti=(k,w,h,x,y,z,ry)=>plane(graffMat(k),w,h,[x,y,z],ry);
  // the tunnel cross-section (every tube piece, both walls alike; see modules.js TUBE): heights and offsets from the centre line
  const XS={low:[.8,.28,.12],high:[.76,.22,.16],small:[.84,.42,.07],tray:[.25,.32],drain:.12};
  Object.assign(BUILD,{
   'pawn-back'(mod,t){const mesh=meshMat(),lamp=lampOf(mod.id);
    // the lock-up cage (north-west): posts, rails, chain-link on its open sides, a padlocked door; shelves of tagged goods, a guitar, a wheel inside
    for(const [x,z] of [[-1,1.2],[-1,2.88],[-2.88,1.2],[-1.95,1.2]])box2(S.steel,x-.025,x+.025,0,2.2,z-.025,z+.025);for(const y of [.03,1.1,2.18]){box2(S.steel,-2.9,-1,y-.015,y+.015,1.18,1.22);box2(S.steel,-1.02,-.98,y-.015,y+.015,1.2,2.9);}
    box2(mesh,-2.88,-1,.05,2.17,1.195,1.205);box2(mesh,-1.005,-.995,.05,2.17,1.2,2.88);box2(P('padlock',{c:'#8a7a3a',rough:.35,metal:.85}),-1.13,-1.05,.98,1.07,1.15,1.18);
    shelving(-2.85,-1.1,2.45,2.85,'x');const gt=P('guitar',{c:'#6a3a1e',rough:.35});cyl(gt,.36,.09,[-2.8,.36,1.62],16,0,HALF);cyl(gt,.28,.09,[-2.8,.62,1.62],16,0,HALF);box2(S.dark,-2.84,-2.78,.72,1.45,1.59,1.65);
    torus(S.rubber,.6,.05,[-1.45,.32,1.75],HALF);cyl(S.steel,.06,.06,[-1.45,.32,1.75],8,HALF);for(let i=0;i<7;i++)box2(S.paper,-2.7+i*.22,-2.66+i*.22,.98,1.06,2.43,2.44);box2(S.cardboard,-2.2,-1.5,0,.45,1.4,1.9);
    // the buying counter under a steel grille in the north wall (the shop front glows dimly beyond), the item scanner, a ledger, a bell
    box2(S.gun,1,2.9,0,.95,2.3,2.9);box2(S.steel,.98,2.9,.95,1,2.28,2.9);box2(S.dark,1,2.9,0,.08,2.28,2.31);box2(P('shopfront',{em:'#2a1e12',unlit:true}),1.1,2.8,1.02,2.1,2.892,2.896);
    for(let x=1.12;x<2.8;x+=.08)box2(S.steel,x-.007,x+.007,1,2.1,2.86,2.89);box2(S.gun,1.05,2.85,2.1,2.16,2.84,2.9);box2(S.gun,1.05,1.1,1,2.16,2.84,2.9);box2(S.gun,2.8,2.85,1,2.16,2.84,2.9);box2(S.black,1.6,2.1,1,1.05,2.85,2.9);
    box2(S.black,2.05,2.55,1,1.05,2.4,2.7);box2(S.glass,2.08,2.52,1.05,1.052,2.42,2.68);box2(S.ledR,2.1,2.5,1.052,1.054,2.54,2.56);box2(P('ledger',{c:'#3a1a14',rough:.7}),1.2,1.5,1,1.03,2.4,2.62);cyl(S.steel,.08,.04,[1.7,1.02,2.45],10);box2(S.rubber,1,2.6,.001,.008,1.6,2.25);
    // a stack of old screens by the east door, tagged; shelving of goods (south-west); the appraisal desk with a loupe lamp; the safe
    for(const z0 of [.95,1.42])for(const y0 of [0,.45]){box2(S.plastic,2.35,2.88,y0,y0+.42,z0,z0+.46);box2(S.black,2.34,2.35,y0+.05,y0+.37,z0+.05,z0+.41);box2(S.paper,2.33,2.34,y0+.3,y0+.36,z0+.36,z0+.42);}
    shelving(-2.9,-2.45,-2.4,-.9,'z');desk(1,2.6,-2.9,-2.3,'s');chair(1.8,-1.7,PI);safeF(2.35,2.9,-2.2,-1.65,'w');cyl(S.steel,.02,.35,[2.3,.93,-2.75],6);torus(S.dark,.14,.02,[2.3,1.1,-2.62]);cyl(lamp,.12,.005,[2.3,1.09,-2.62],12);
    for(let i=0;i<3;i++)box2(S.cardboard,-2.3+i*.45,-1.95+i*.45,0,.3+i*.08,-2.85,-2.5);
    plane(P('pawn-sign',{dyn:signTex('ALL SALES FINAL · NO QUESTIONS','#d8c8a0','#1a1612',1024,128,'bold 52px Arial'),rough:.6}),1.4,.18,[-2.885,2.25,-1.65],-HALF);decal(stainMat(),1.2,.9,.2,-.4);},
   'noodle-kitchen'(mod,t){const lamp=lampOf(mod.id),ss=STY.kitchen.wain,flame=P('flame',{em:'#ff6a1a',unlit:true}),wok=P('wok',{c:'#1a1816',rough:.35,metal:.8});
    // the range: stainless body, iron grates, two woks and a stock pot on their burners, the splash-back, the hood and its duct, steam
    box2(ss,-2.9,-.9,0,.86,2.25,2.9);box2(S.black,-2.9,-.9,.86,.9,2.25,2.9);box2(S.dark,-2.9,-.9,0,.08,2.22,2.25);for(const x of [-2.5,-1.3])box2(S.steel,x-.25,x+.25,.62,.64,2.22,2.25);
    [-2.5,-1.9,-1.3].forEach((x,i)=>{torus(flame,.2,.025,[x,.91,2.58]);if(i<2){cyl(wok,.14,.12,[x,.98,2.58],18,0,0,.46);box2(wok,x+.22,x+.42,1.02,1.04,2.56,2.6);}else{cyl(ss,.34,.36,[x,1.08,2.58],16);cyl(P('broth',{c:'#5a3a1a',rough:.15}),.31,.005,[x,1.262,2.58],16);}});
    box2(ss,-2.9,-.9,.9,1.9,2.88,2.9);box2(ss,-2.9,-.9,1.95,2.25,2.2,2.9);box2(S.dark,-2.85,-.95,1.94,1.95,2.25,2.85);box2(lamp,-2.6,-1.2,1.935,1.94,2.3,2.4);box2(ss,-2.2,-1.6,2.25,t.ceil,2.5,2.9);
    const st=smokeMat('steam');for(const x of [-2.5,-1.3]){plane(st,.6,.9,[x,1.55,2.55],0);plane(st,.6,.9,[x,1.55,2.55],HALF);}plane(stainMat(),1.8,.7,[-1.9,1.55,2.875],0);box2(S.rubber,-2.8,-1,.001,.012,1.6,2.2);
    // the walk-in cooler: insulated box, heavy door with hinges and latch, a temperature readout, frost on the seal
    const cl=P('cooler',{c:'#c4c8c4',tex:'district-interior/kit_steel_color.jpg',tile:1,rough:.4,metal:.5});box2(cl,1.5,2.9,0,t.ceil,1.1,2.9);box2(P('cooler-door',{c:'#d0d4d0',tex:'district-interior/kit_steel_color.jpg',tile:.8,rough:.35,metal:.45}),1.46,1.5,.05,2.05,1.45,2.45);
    for(const y of [.35,1.65])box2(S.steel,1.43,1.47,y,y+.15,2.42,2.5);box2(S.steel,1.39,1.46,1,1.25,1.5,1.57);box2(P('cool-disp',{em:'#40d080',unlit:true}),1.49,1.495,1.6,1.68,1.2,1.36);box2(P('frost-strip',{c:'#e8f0f4',rough:.6}),1.44,1.46,.05,.12,1.45,2.45);
    plane(P('cool-sign',{dyn:signTex('COLD ROOM · KEEP SHUT','#1a2a3a','#d8e0e8',512,96,'bold 44px Arial'),rough:.6}),.6,.11,[1.497,2.25,1.95],HALF);
    // the prep table: board, cleaver, scallions, the dough tub, bowls on the shelf below; a mop bucket
    box2(ss,-2.9,-2.2,.86,.9,-2.6,-1);for(const x of [-2.85,-2.25])for(const z of [-2.55,-1.05])box2(ss,x-.02,x+.02,0,.86,z-.02,z+.02);box2(ss,-2.88,-2.22,.2,.22,-2.58,-1.02);for(let i=0;i<3;i++)cyl(S.white,.22,.06,[-2.55,.25+i*.06,-2.2],12,0,0,.16);
    box2(P('board',{c:'#a08868',rough:.7}),-2.75,-2.35,.9,.93,-2.2,-1.75);box2(S.steel,-2.5,-2.4,.93,.935,-1.7,-1.55);box2(S.black,-2.47,-2.43,.93,.95,-1.55,-1.45);for(let i=0;i<6;i++)cyl(P('scallion',{c:'#4a7a3a',rough:.6}),.015,.4,[-2.68+i*.022,.92,-1.35],6,HALF);
    cyl(S.white,.3,.18,[-2.5,.99,-1.2],14);cyl(P('dough',{c:'#e8dcc0',rough:.8}),.26,.02,[-2.5,1.08,-1.2],14);cyl(P('bucket',{c:'#c8a020',rough:.5}),.32,.3,[-1.95,.15,-2.55],12);cyl(S.wood,.03,1.3,[-1.85,.65,-2.7],6,0,.25);
    // sacks of rice and flour on a pallet; the order counter with its tablet and ticket printer; the order screen over it
    box2(P('pallet',{c:'#6a5a40',tex:'ncz/metal-leaks-color.jpg',tile:2,rough:.9}),.9,2.4,0,.12,-2.9,-2.3);const sk=[P('sack0',{c:'#c8b898',rough:1}),P('sack1',{c:'#e0dcd0',rough:1})];for(let L=0;L<3;L++)for(let i=0;i<2;i++)bx(sk[(L+i)%2],[.62,.18,.48],[1.3+i*.72,.21+L*.19,-2.6],(rand()-.5)*.15);
    box2(ss,2.3,2.9,0,.92,-2,-1);box2(S.steel,2.28,2.9,.92,.95,-2,-1);box2(S.black,2.42,2.46,.95,1.15,-1.34,-1.06);plane(screenMat(mod.id,'tab',deskAtlas()),.26,.18,[2.418,1.06,-1.2],HALF,false,0,new B.Vector4(0,.5,.5,1));
    box2(S.dark,2.4,2.62,.95,1.07,-1.85,-1.6);box2(S.paper,2.38,2.4,.75,1.06,-1.78,-1.68);bx(S.black,[.04,.38,.62],[2.88,1.75,-1.75],0);plane(screenMat(mod.id,'orders',ordersTex()),.58,.34,[2.857,1.75,-1.75],HALF);
    // spice shelf on the west wall, a floor drain
    box2(ss,-2.9,-2.65,1.5,1.53,.9,2.1);for(let i=0;i<8;i++)cyl(P('jar'+(i%3),{c:['#8a3a1a','#c8a040','#3a2a1a'][i%3],rough:.3}),.08,.14,[-2.78,1.6,.98+i*.15],10);box2(S.dark,-.2,.2,.001,.006,-.2,.2);for(let k=-3;k<=3;k++)box2(S.black,-.18,.18,.006,.008,k*.05-.01,k*.05+.01);
    decal(stainMat(),1.4,1,-1.6,1.5);},
   'repair-shop'(mod,t){const lamp=lampOf(mod.id),bt=P('bench-top',{c:'#8a7656',dyn:TX.planks('#5a4a32','#2a1e12'),tile:1.4,rough:.6}),pcb=P('pcb',{c:'#1e4a2a',rough:.45,metal:.2});
    const bench=(x0,x1,z0,z1)=>{box2(bt,x0,x1,.86,.9,z0,z1);for(const x of [x0+.04,x1-.04])for(const z of [z0+.04,z1-.04])box2(S.gun,x-.025,x+.025,0,.86,z-.025,z+.025);box2(S.gun,x0+.02,x1-.02,.2,.22,z0+.04,z1-.04);};bench(-2.9,-1,2.2,2.9);bench(-2.9,-2.25,-2.6,-.9);
    // the north bench: anti-static mat, soldering station and iron, the magnifier lamp, a phone board in its clamp, chips, the pegboard of tools above
    box2(esd(),-2.6,-1.3,.9,.903,2.3,2.75);box2(S.dark,-2.75,-2.5,.9,1,2.6,2.8);box2(S.ledA,-2.7,-2.66,.96,.98,2.598,2.6);cyl(S.steel,.06,.12,[-2.4,.96,2.7],10);cyl(S.dark,.025,.22,[-2.42,1.04,2.62],6,.6);
    cyl(S.steel,.025,.7,[-1.3,1.25,2.82],6);const ar=cyl(S.steel,.02,.62,[-1.5,1.6,2.62],6,0,HALF);ar.rotation.y=-.9;torus(S.dark,.22,.03,[-1.75,1.36,2.42]);cyl(P('lens',{c:'#a8c0c8',rough:.02,alpha:.35}),.2,.01,[-1.75,1.36,2.42],16);torus(lamp,.18,.012,[-1.75,1.34,2.42]);
    box2(pcb,-2.05,-1.75,1,1.01,2.4,2.6);box2(S.steel,-2.1,-2.04,.9,1.02,2.45,2.55);box2(S.steel,-1.76,-1.7,.9,1.02,2.45,2.55);for(let i=0;i<5;i++)box2(S.black,-2.02+i*.05,-1.99+i*.05,1.01,1.016,2.45+(i%2)*.06,2.49+(i%2)*.06);
    plane(P('peg',{dyn:TX.peg(),rough:.8}),1.8,.9,[-1.95,1.6,2.885],0);plane(P('repair-sign',{dyn:signTex('REPAIRS · ALL BRANDS · NO WARRANTY','#d8d0b8','#141618',1024,128,'bold 46px Arial'),rough:.6}),1.6,.2,[-1.95,2.3,2.885],0);
    // the west bench: the scope (screen), a bench supply, a gutted laptop, a heap of phones
    box2(S.plastic,-2.85,-2.5,.9,1.18,-1.98,-1.62);box2(S.dark,-2.5,-2.495,.95,1.15,-1.95,-1.65);plane(screenMat(mod.id,'scope',scopeTex()),.22,.16,[-2.493,1.08,-1.85],-HALF);for(let k=0;k<3;k++)cyl(S.steel,.025,.02,[-2.488,.97,-1.75+k*.04],8,0,HALF);
    box2(S.dark,-2.85,-2.55,.9,1.05,-1.5,-1.2);box2(P('psu-led',{em:'#ff5a2a',unlit:true}),-2.55,-2.546,.99,1.02,-1.45,-1.25);box2(S.plastic,-2.8,-2.45,.9,.92,-2.45,-2.1);box2(pcb,-2.75,-2.5,.92,.925,-2.4,-2.15);box2(S.dark,-2.72,-2.6,.925,.94,-2.38,-2.3);
    for(let i=0;i<6;i++)bx(S.black,[.08,.012,.15],[-2.6+rand()*.25,.905+i*.012,-1.05+rand()*.1],rand()*3);
    // the parts drawers (north-east), shelves of jobs waiting with tickets (east), the terminal desk and the safe, stools
    box2(S.gun,1,2.9,0,1.8,2.45,2.9);plane(P('drawers',{dyn:TX.drawers(),rough:.6}),1.86,1.7,[1.95,.9,2.447],0);shelving(2.45,2.9,.9,2.3,'z');for(let i=0;i<5;i++)box2(S.paper,2.44,2.45,.7+(i%3)*.5,.78+(i%3)*.5,1+i*.25,1.08+i*.25);
    desk(1,2.6,-2.9,-2.3,'s');chair(1.8,-1.7,PI);safeF(2.35,2.9,-2.2,-1.65,'w');stool(-1.9,1.7);stool(-1.85,-1.75);decal(stainMat(),1,.8,.4,.6);},
   'implant-shop'(mod,t){const lamp=lampOf(mod.id),lea=leather(),alloy=P('alloy',{c:'#9aa4ac',rough:.3,metal:.85});
    // the implant chair: column, base, seat, a tilted back with a headrest, the leg rest, arm rests; a tool tray beside it
    cyl(S.steel,.14,.5,[-1.8,.25,1.75],12);box2(S.steel,-2.2,-1.4,0,.04,1.4,2.1);bx(lea,[.62,.12,.75],[-1.8,.6,1.75]);const bk=bx(lea,[.6,.75,.1],[-1.8,.95,2.28]);bk.rotation.x=.55;const lg=bx(lea,[.58,.1,.55],[-1.8,.5,1.18]);lg.rotation.x=-.45;
    box2(lea,-1.95,-1.65,1.22,1.34,2.45,2.58);box2(lea,-2.18,-2.1,.7,.76,1.5,2.05);box2(lea,-1.5,-1.42,.7,.76,1.5,2.05);box2(S.steel,-1.3,-1.05,.8,.82,.95,1.3);cyl(S.steel,.025,.8,[-1.18,.4,1.12],6);for(let i=0;i<4;i++)box2(S.steel,-1.27+i*.055,-1.24+i*.055,.82,.83,1,1.22);
    // the ceiling tool arm over the chair, a ring light, the scan monitor on the wall
    box2(S.steel,-2,-1.6,t.ceil-.03,t.ceil,1.55,1.95);cyl(S.steel,.06,.6,[-1.8,t.ceil-.3,1.75],8);cyl(S.dark,.1,.1,[-1.8,t.ceil-.65,1.75],12);cyl(S.steel,.05,.5,[-1.8,t.ceil-.68,1.5],8,HALF);cyl(S.dark,.08,.2,[-1.8,t.ceil-.82,1.25],10);cyl(S.ledA,.03,.01,[-1.8,t.ceil-.925,1.25],8);
    cyl(S.steel,.025,t.ceil-1.95,[-1.55,1.95+(t.ceil-1.95)/2,1.85],6);torus(S.white,.5,.06,[-1.8,1.95,1.85]);torus(lamp,.44,.02,[-1.8,1.92,1.85]);
    bx(S.black,[.62,.4,.04],[-1.6,1.75,2.88],0);plane(screenMat(mod.id,'scan',scanTex()),.58,.36,[-1.6,1.75,2.857],0);
    // the parts bench: a prosthetic forearm on its stand, its cover off; trays of parts; anti-static mat
    box2(S.steel,.9,2.2,.86,.9,2.45,2.9);for(const x of [.95,2.15])box2(S.steel,x-.02,x+.02,0,.86,2.5,2.85);box2(esd(),1,2.1,.9,.903,2.5,2.85);cyl(S.dark,.12,.02,[1.4,.91,2.68],10);cyl(S.steel,.025,.25,[1.4,1.03,2.68],6);
    cyl(alloy,.09,.4,[1.4,1.2,2.68],12,0,HALF);cyl(S.plastic,.1,.18,[1.27,1.2,2.68],12,0,HALF);cyl(S.dark,.08,.05,[1.61,1.2,2.68],10,0,HALF);box2(alloy,1.63,1.72,1.16,1.24,2.63,2.73);for(let k=0;k<4;k++)box2(alloy,1.72,1.82,1.21,1.225,2.635+k*.026,2.652+k*.026);
    cyl(P('cable-r',{c:'#8a2a2a',rough:.5}),.012,.3,[1.35,1.16,2.73],6,0,HALF);box2(S.steel,1.75,2.1,.9,.93,2.5,2.75);for(let i=0;i<6;i++)box2(P('part'+(i%2),{c:['#c8a040','#3a4a5a'][i%2],rough:.4,metal:.6}),1.78+(i%3)*.1,1.84+(i%3)*.1,.93,.95,2.53+Math.floor(i/3)*.1,2.58+Math.floor(i/3)*.1);
    // the parts fridge (glass door to the west), its light and boxes
    box2(S.white,2.3,2.9,0,1.9,1.1,2.4);box2(S.glass,2.28,2.29,.1,1.8,1.15,2.35);box2(S.dark,2.27,2.3,.02,.1,1.1,2.4);box2(S.steel,2.25,2.28,.6,1.2,1.18,1.21);box2(P('fridge-light',{em:'#d8ecff',unlit:true}),2.4,2.85,1.75,1.77,1.2,2.3);
    for(const y of [.5,.9,1.3]){box2(S.steel,2.32,2.88,y,y+.02,1.15,2.35);for(let i=0;i<4;i++)box2(P('ibox'+(i%2),{c:['#d8dce0','#3a6a8a'][i%2],rough:.5}),2.42,2.7,y+.02,y+.14,1.2+i*.28,1.42+i*.28);}
    // the counter: autoclave, sink, a sharps bin, gloves; the terminal desk and the safe; a sign
    box2(S.white,-2.9,-2.3,0,.88,-2.6,-1);box2(S.steel,-2.9,-2.3,.88,.92,-2.6,-1);box2(S.steel,-2.85,-2.4,.92,1.22,-2.5,-2.05);cyl(S.dark,.22,.02,[-2.4,1.07,-2.27],16,0,HALF);box2(S.ledG,-2.4,-2.395,1.16,1.18,-2.15,-2.1);
    box2(S.dark,-2.8,-2.4,.86,.921,-1.8,-1.3);cyl(S.steel,.03,.35,[-2.8,1.09,-1.55],8);box2(P('sharps',{c:'#c8a020',rough:.5}),-2.85,-2.65,.92,1.12,-1.25,-1.05);box2(P('gloves',{c:'#2a5a9a',rough:.6}),-2.6,-2.4,.92,1.02,-1.25,-1.08);
    desk(1,2.6,-2.9,-2.3,'s');chair(1.8,-1.7,PI);safeF(2.35,2.9,-2.2,-1.65,'w');plane(P('cyber-sign',{dyn:signTex('FITTINGS · REPAIRS · NO RECORDS','#d0e0e0','#14202a',1024,128,'bold 48px Arial'),rough:.6}),1.4,.17,[-2.05,2.2,-2.885],PI);
    for(const z of [-2.4,2.4])cyl(S.dark,.06,5.6,[0,t.ceil-.12,z],8,0,HALF);},
   'laundry-back'(mod,t){const lamp=lampOf(mod.id),wm=P('washer',{c:'#a8acaa',tex:'district-interior/kit_steel_color.jpg',tile:.8,rough:.4,metal:.6}),port=P('porthole',{c:'#202a2e',rough:.05,metal:.3,alpha:.7});
    // three front-loaders on a plinth (one out of order), pipes behind
    box2(S.concrete,-2.9,-.9,0,.12,2.15,2.9);[-2.55,-1.9,-1.25].forEach((x,i)=>{box2(wm,x-.31,x+.31,.12,1.3,2.2,2.9);torus(S.steel,.44,.05,[x,.7,2.19],HALF);cyl(port,.4,.02,[x,.7,2.19],18,HALF);box2(S.dark,x-.28,x+.28,1.12,1.26,2.18,2.2);box2(i===1?S.ledR:S.ledG,x+.15,x+.2,1.17,1.21,2.175,2.18);});
    box2(S.paper,-1.98,-1.82,.98,1.1,2.172,2.176);cyl(pipeM('#5a6a5a'),.08,2,[-1.9,1.6,2.84],10,0,HALF);cyl(pipeM('#6a5a4a'),.06,2,[-1.9,1.75,2.85],10,0,HALF);
    // two columns of stacked dryers and their ducts
    for(const x of [1.4,2.4]){for(const y of [0,.95]){box2(wm,x-.48,x+.48,y,y+.93,2.15,2.9);torus(S.steel,.5,.04,[x,y+.45,2.14],HALF);cyl(port,.46,.02,[x,y+.45,2.14],18,HALF);box2(S.dark,x+.3,x+.42,y+.75,y+.88,2.14,2.15);}
     cyl(P('duct',{c:'#b0b4b8',rough:.35,metal:.8}),.16,t.ceil-1.88,[x,1.88+(t.ceil-1.88)/2,2.7],10);}
    // the folding table with stacks of folded work clothes, bags beneath; two laundry carts
    box2(S.white,-2.9,-2.1,.86,.9,-2.6,-1);for(const x of [-2.85,-2.15])for(const z of [-2.55,-1.05])box2(S.steel,x-.02,x+.02,0,.86,z-.02,z+.02);const cc=['#3a4a5a','#5a5a52','#2a2a2e','#6a3a2a'];
    for(let i=0;i<6;i++){const c=P('cloth'+(i%4),{c:cc[i%4],rough:1});box2(c,-2.8+(i%2)*.36,-2.48+(i%2)*.36,.9,.97+((i*37)%5)*.03,-2.5+Math.floor(i/2)*.5,-2.15+Math.floor(i/2)*.5);}bx(P('bag',{c:'#4a5a6a',rough:.9}),[.4,.45,.4],[-2.5,.22,-1.45],.3);
    for(const z0 of [-2,-1.52]){box2(P('cart-canvas',{c:'#6a6458',rough:1}),1.92,2.68,.2,.85,z0+.02,z0+.4);box2(S.steel,1.9,2.7,.83,.86,z0,z0+.42);for(const x of [1.95,2.65])for(const z of [z0+.05,z0+.37])cyl(S.dark,.08,.06,[x,.04,z],8,0,HALF);bx(P('cloth'+(z0<-1.8?1:3),{c:cc[z0<-1.8?1:3],rough:1}),[.6,.14,.3],[2.3,.88,z0+.21],rand());}
    // the office desk and the change safe; detergent on a shelf; a drain, a puddle, lint; a sign
    desk(.95,2.2,-2.9,-2.3,'s');stool(1.55,-1.85);safeF(2.35,2.9,-2.9,-2.35,'n');box2(S.steel,-2.9,-2.6,1.2,1.23,.9,2.1);for(let i=0;i<5;i++)box2(P('jug'+(i%3),{c:['#2a6a9a','#d8d4c8','#c86a2a'][i%3],rough:.4}),-2.85,-2.7,1.23,1.45,.95+i*.22,1.1+i*.22);
    box2(S.dark,-.2,.2,.001,.006,-.2,.2);decal(puddleMat(),1.2,.8,-1.3,1.6);decal(P('lint',{c:'#9a9a94',rough:1}),.3,.2,1.6,1.9,.005);plane(P('laundry-sign',{dyn:signTex('DO NOT OVERLOAD · NO DYES','#1a1a1a','#d8d4c8',1024,128,'bold 52px Arial'),rough:.6}),1.2,.15,[-2.885,1.9,-1.8],-HALF);},
   'tea-room'(mod,t){const lamp=lampOf(mod.id),dw=darkWood(),lq=lacquer();
    // worn tatami over the boards, two low tables with floor cushions, cups and a teapot; an ashtray
    tatamiMats(-2.85,-.65,.75,2.85);tatamiMats(-2.85,-.65,-2.85,-.75);lowTable(-2.3,-1.1,1.1,2.3,.03);lowTable(-2.3,-1.1,-2.3,-1.1,.03);cyl(S.dark,.12,.03,[-1.35,.45,-2],10);
    // backlit paper sliding screens on the north and south walls (a patched pane), dark-wood beams overhead
    shojiWall('n',-2.85,-.75,3,3);shojiWall('n',.75,2.85,3,3);shojiWall('s',-2.85,-1.2,3,3);shojiWall('s',.75,2.85,3,3);box2(P('patch',{c:'#e8dcc0',rough:.9}),-2.2,-1.95,1.2,1.45,2.884,2.886);
    for(const x of [-1.8,0,1.8])box2(dw,x-.08,x+.08,t.ceil-.14,t.ceil,-2.9,2.9);
    // the tea station: cabinet, kettle on a hot plate, cups upside down on a cloth, tins on a shelf; a cheap heater; an extension cord
    box2(dw,2.35,2.9,0,.85,.9,2.6);box2(lq,2.33,2.9,.85,.88,.88,2.62);kettleSet(2.6,2.15,.88);box2(P('cloth-w',{c:'#d8d4c8',rough:1}),2.45,2.8,.88,.885,1,1.75);const ce=celadon();for(let i=0;i<6;i++)cyl(ce,.07,.06,[2.53+(i%2)*.16,.915,1.1+Math.floor(i/2)*.22],10);
    box2(dw,2.62,2.9,1.45,1.48,1,2.45);for(let i=0;i<4;i++)cyl(P('tin'+(i%2),{c:['#5a4a2a','#2a3a3a'][i%2],rough:.4,metal:.6}),.11,.15,[2.76,1.555,1.15+i*.3],12);
    box2(P('heater',{c:'#8a8a84',rough:.5,metal:.3}),1.5,1.85,0,.45,2.68,2.85);box2(P('heater-glow',{em:'#7a2a10',unlit:true}),1.52,1.83,.1,.4,2.675,2.68);cyl(S.black,.012,1.2,[1.95,.006,2.2],4,HALF);
    // the alcove: a raised platform, an ink painting of mountains, a bonsai, the strongbox
    box2(dw,2.35,2.9,0,.48,-2.6,-1.1);box2(lq,2.33,2.9,.48,.5,-2.62,-1.08);inkScroll(2.885,-1.85,1.4,HALF,.5,1);bonsai(2.62,-1.45,.5);box2(P('lacquer-red',{c:'#4a1410',rough:.22}),2.45,2.8,.5,.72,-2.45,-2.05);box2(brass(),2.43,2.45,.58,.64,-2.3,-2.2);
    // paper lanterns over the tables (the room's light), a water stain on the ceiling
    lantern(-1.7,1.7,1.7,t.ceil,lamp);lantern(-1.7,-1.7,1.7,t.ceil,lamp);plane(stainMat(),.9,.7,[1.1,t.ceil-.005,.4],0,false,-HALF);},
   'tea-under'(mod,t){const lamp=lampOf(mod.id),dw=darkWood(),lq=lacquer(),Ch=t.ceil,conc=STY.tunnel.wall;
    // the converted chamber: a raw concrete barrel vault over everything (springing at 2.3 m), concrete ribs, pipes along the springing line, a valve, water stains
    vaultOver(2.9,2.9,2.3,.9,[-2.2,0,2.2]);
    for(const x of [-2.75,2.75]){cyl(pipeM('#5a5e5a'),.14,5.8,[x,2.25,0],10,HALF);cyl(pipeM('#7a3a2a'),.07,5.8,[x+(x<0?.14:-.14),2.12,0],8,HALF);}torus(S.red,.26,.03,[2.62,1.95,-1.9],0,0);cyl(pipeM('#5a5e5a'),.08,.3,[2.75,2.08,-1.9],8);
    plane(stainMat(),1.2,1.4,[-2.89,2.5,.8],-HALF);plane(stainMat(),1,1.2,[2.89,2.6,-.6],HALF);
    // a dark-wood lining to 2.1 m: wainscot all round, backlit paper screens on the long walls
    for(const [e,a0,a1] of [['w',-2.85,-1.2],['w',.1,1.4],['e',-2.3,.4],['e',1.0,2.85]])shojiWall(e,a0,a1,3,3,.95,2.05);
    for(const e of ['w','e']){const x=e==='w'?-2.9:2.9,o=e==='w'?1:-1;box2(dw,Math.min(x,x+o*.06),Math.max(x,x+o*.06),0,.9,-2.9,2.9);box2(dw,Math.min(x,x+o*.09),Math.max(x,x+o*.09),.9,.95,-2.9,2.9);box2(dw,Math.min(x,x+o*.09),Math.max(x,x+o*.09),2.05,2.12,-2.9,2.9);}
    // the doors: wooden frames on the room side of the front (south) and back (north) doorways; the tunnel side stays raw
    for(const so of t.sockets){if(!mod.open.includes(so.id))continue;const zf=so.edge==='n'?2.9:-2.9,o=so.edge==='n'?-1:1,[cx]=M.sockLocal(t,so);for(const s2 of [-1,1])box2(dw,cx+s2*.6-(s2>0?0:.12),cx+s2*.6+(s2>0?.12:0),0,2.34,Math.min(zf,zf+o*.08),Math.max(zf,zf+o*.08));box2(dw,cx-.72,cx+.72,2.22,2.34,Math.min(zf,zf+o*.08),Math.max(zf,zf+o*.08));}
    // the tatami dais (west) with two low tables and cushions; the east table on mats
    box2(dw,-2.9,-1.1,0,.15,-2.5,1.3);box2(lq,-1.12,-1.08,0,.16,-2.5,1.3);tatamiMats(-2.85,-1.15,-2.45,1.25,.15);lowTable(-2.4,-1.6,-1.95,-1.05,.18);lowTable(-2.4,-1.6,-.15,.75,.18);tatamiMats(1.05,2.35,-2.75,-.45);lowTable(1.2,2.2,-2.2,-1,.03);
    // the service partition (hides the back door), the tea station against it, the folding screen at the end of the passage
    box2(dw,-2.9,1.15,0,2.3,1.5,1.6);shojiWall('n',-2.6,-.1,3,1.42,.6,2.0);box2(dw,1.1,1.18,0,2.3,1.48,1.62);
    // (20 Nov 2026) the station stands out from the partition as an island: the tea room host stands behind it (spot 'host'), the lucky cat on its east end faces the room
    box2(dw,-.8,1,0,.85,.2,.7);box2(lq,-.82,1.02,.85,.88,.18,.72);kettleSet(-.45,.45,.88);const ce=celadon();for(let i=0;i<6;i++)cyl(ce,.07,.06,[.05+(i%3)*.17,.915,.32+Math.floor(i/3)*.2],10);for(let i=0;i<3;i++)cyl(P('tin'+(i%2),{c:['#5a4a2a','#2a3a3a'][i%2],rough:.4,metal:.6}),.11,.15,[.6,.955,.3+i*.15],12);
    {const L=root.VoidLuckyCat,cx=.86,cy=.88,cz=.42,cm=P('lucky-cat',{c:(L?L.COLOUR[0]:'#e9e4dc'),rough:.35});const sb=()=>L&&L.standIn(cx,cy,cz,{ball:(d,x,y,z)=>{const m=B.MeshBuilder.CreateSphere('mod-ball',{diameter:d,segments:8},scene);m.position.set(x,y,z);add(m,cm);},box:(w,h,d,x,y,z)=>bx(cm,[w,h,d],[x,y,z],0)});if(L)prop(L.FILE,[cx,cy,cz],0,.24,sb);}
    {const sp=P('byobu',{c:'#6a5a40',dyn:inkTex(),rough:.8});for(let i=0;i<3;i++){const x=2.34+i*.22,m=bx(sp,[.23,1.7,.03],[x,.85,.9],(i%2?.25:-.25));}box2(dw,2.2,2.9,1.69,1.72,.86,.94);}
    // the nook behind the partition: shelves of supplies and the strongbox, a service sink, crates
    bulb(-.3,2.25,2.15,Ch,lamp);shelving(-2.9,-2.4,1.7,2.9,'z');box2(P('lacquer-red',{c:'#4a1410',rough:.22}),-2.38,-2.2,.95,1.15,2.2,2.45);box2(S.steel,2.2,2.9,0,.88,2.5,2.9);box2(S.dark,2.3,2.8,.84,.881,2.58,2.82);cyl(S.steel,.03,.3,[2.55,1.03,2.86],8);crate(-1.65,2.6,.3,.45);
    // the bonsai on its stand, lanterns (the room's light), a scroll; the floor of the aisle stays raw, wet concrete
    box2(dw,2.4,2.9,0,.9,-2.9,-2.4);bonsai(2.65,-2.65,.9);inkScroll(2.885,-.95,1.5,HALF,.4,.8);lantern(-2,-1.5,2,Ch,lamp,.4);lantern(-2,.3,2,Ch,lamp,.4);lantern(1.7,-1.6,2,Ch,lamp,.36);lantern(.1,.1,2.35,Ch,lamp,.3);
    // (20 Nov 2026) the owner's sign behind the tea room host, on the partition above him: 表と裏 ("front and back"), cream brush-style characters on a dark lacquered board
    {const st=canvas(768,256,(g,w,h)=>{g.fillStyle='#1c120c';g.fillRect(0,0,w,h);g.strokeStyle='#6a4a22';g.lineWidth=10;g.strokeRect(14,14,w-28,h-28);g.fillStyle='#e8d8b0';g.textAlign='center';g.textBaseline='middle';g.font='bold 150px "Noto Serif JP","Noto Serif CJK JP","Yu Mincho","Hiragino Mincho ProN","MS Mincho","Noto Sans JP","Noto Sans CJK JP","Noto Sans SC","Microsoft YaHei","PingFang SC","Noto Sans CJK SC","WenQuanYi Zen Hei",serif';g.fillText('表と裏',w/2,h/2+6);},'mod-sign-omote-ura');const sm=P('sign-omote-ura',{c:'#ffffff',dyn:st,rough:.5,tile:1});if(!sm.emissiveTexture){sm.emissiveTexture=st;sm.emissiveColor=new B.Color3(.28,.24,.2);}const sx=.1,sw2=.36,sy=2.15,sh=.24;plane(sm,sw2*2,sh,[sx,sy,1.494],0);box2(dw,sx-sw2-.02,sx+sw2+.02,sy-sh/2-.02,sy-sh/2,1.47,1.5);box2(dw,sx-sw2-.02,sx+sw2+.02,sy+sh/2,sy+sh/2+.02,1.47,1.5);}   // centred over the host (spot 'host', x .1), above the partition's paper panel (it stands 8 cm proud of the partition up to 2.0 m and hid the sign's left end), 3:1 like its texture; the counter's lantern hangs higher, over the counter's front edge, below the sight lines from every seat and from the door to the sign
    // (20 Nov 2026) the owner's painting (a white cat among cherry blossoms) on the nook's north wall (23 Nov 2026, the owner: moved 0.45 m to the viewer's left, from x 2.36 to 1.91, centred on the wall's free stretch between the partition and the sink; its picture lamp moves with it), in a thin dark frame, lit by a small warm picture lamp
    {const pm=P('tea-painting',{c:'#ffffff',tex:'paintings/tea-room-cat-painting.jpg',tile:1,rough:.92});if(!pm.emissiveTexture&&pm.albedoTexture){pm.emissiveTexture=pm.albedoTexture;pm.emissiveColor=new B.Color3(.12,.11,.095);pm.directIntensity=.55;pm.environmentIntensity=.15;pm.specularIntensity=.2;}const px=1.91,py=1.62,pz=2.884,pw=.57,ph=.76;plane(pm,pw,ph,[px,py,pz],0);for(const [x0,x1,y0,y1] of [[px-pw/2-.035,px+pw/2+.035,py+ph/2,py+ph/2+.035],[px-pw/2-.035,px+pw/2+.035,py-ph/2-.035,py-ph/2],[px-pw/2-.035,px-pw/2,py-ph/2,py+ph/2],[px+pw/2,px+pw/2+.035,py-ph/2,py+ph/2]])box2(dw,x0,x1,y0,y1,pz-.004,2.9);box2(S.steel,px-.14,px+.14,py+ph/2+.07,py+ph/2+.1,2.78,2.9);box2(P('picture-lamp',{c:'#ffd9a0',em:'#ffc070',unlit:true}),px-.12,px+.12,py+ph/2+.06,py+ph/2+.07,2.8,2.86);}
    decal(puddleMat(),.9,.6,.2,-2.3);},
   'card-room'(mod,t){const lamp=lampOf(mod.id),felt=P('felt',{c:'#2a5a3a',dyn:TX.felt(),tile:1.8,rough:.95}),rail=P('table-rail',{c:'#2a1a12',rough:.35});
    // the card table: pedestal, a padded rail round an oval of felt; chips, cards, glasses, an ashtray; six chairs
    box2(S.dark,-.5,.5,0,.7,-.2,.2);box2(S.dark,-.7,.7,0,.05,-.35,.35);box2(rail,-.4,.4,.72,.77,-.5,.5);for(const x of [-.4,.4])cyl(rail,1,.05,[x,.745,0],24);box2(felt,-.4,.4,.77,.775,-.43,.43);for(const x of [-.4,.4])cyl(felt,.86,.005,[x,.7725,0],24);
    const chipC=['#8a1a1a','#1a1a1a','#d8d4c8','#1a5a3a','#2a3a7a'];for(let i=0;i<14;i++){const c=P('chip'+(i%5),{c:chipC[i%5],rough:.4}),n=2+Math.floor(rand()*5),x=-.65+rand()*1.3,z=(rand()<.5?-1:1)*(.18+rand()*.15);cyl(c,.045,.008*n,[x,.776+.004*n,z],10);}
    for(let i=0;i<7;i++)bx(P(i<4?'card':'card-back',{c:i<4?'#e8e4dc':'#6a1a1a',rough:.5}),[.06,.003,.09],[-.5+rand(),.778,(rand()-.5)*.5],rand()*PI);for(const [x,z] of [[-.6,.3],[.62,-.28]])cyl(P('glassware',{c:'#c8d4d8',rough:.05,alpha:.35}),.07,.1,[x,.83,z],8);cyl(S.dark,.12,.025,[.5,.79,.3],10);
    for(const [x,z,r] of [[-.4,-1,0],[.4,-1,0],[-.4,1,PI],[.4,1,PI],[-1.4,0,HALF],[1.4,0,-HALF]])woodChair(x,z,r);box2(rug(),-1.7,1.7,.001,.012,-1.35,1.35);
    // the lamp: a long green shade low over the felt, on chains (the room's light)
    const sh=P('shade-green',{c:'#1e3a2a',rough:.45,metal:.3});box2(sh,-.75,.75,1.45,1.55,-.24,.24);box2(sh,-.8,.8,1.42,1.45,-.27,-.24);box2(sh,-.8,.8,1.42,1.45,.24,.27);box2(lamp,-.7,.7,1.448,1.452,-.2,.2);for(const x of [-.6,.6])cyl(S.dark,.012,t.ceil-1.55,[x,1.55+(t.ceil-1.55)/2,0],6);
    // a worn sofa and a coat rack (west), the bar cart (north-east), the lookout desk with the street feed, the cash safe
    const so=P('sofa',{c:'#3a2620',dyn:TX.weave('#3a2018'),tile:.5,rough:.7});box2(so,-2.9,-2.15,0,.42,1,2.6);box2(so,-2.9,-2.7,.42,.85,1,2.6);box2(so,-2.9,-2.15,.42,.62,1,1.15);box2(so,-2.9,-2.15,.42,.62,2.45,2.6);
    cyl(S.dark,.04,1.75,[-2.65,.875,2.78],8);box2(P('coat',{c:'#1e2024',rough:.9}),-2.8,-2.5,.95,1.6,2.7,2.86);const br=brass();box2(br,2.1,2.8,.85,.88,1.8,2.6);box2(br,2.1,2.8,.3,.33,1.8,2.6);for(const x of [2.13,2.77])for(const z of [1.83,2.57])cyl(br,.025,.88,[x,.44,z],6);
    for(let i=0;i<6;i++){const k=i%3;cyl(P('bottle'+k,{c:['#3a2a1a','#2a3a2a','#5a4a2a'][k],rough:.1,alpha:.85}),.08,.3,[2.25+(i%3)*.2,1.03,1.95+Math.floor(i/3)*.4],10);}
    box2(S.gun,1,2.6,.72,.76,-2.9,-2.3);for(const x of [1.04,2.56])box2(S.steel,x-.025,x+.025,0,.72,-2.86,-2.34);bx(S.black,[.62,.38,.04],[1.8,1.15,-2.75],0);plane(screenMat(mod.id,'cctv',cctvTex()),.58,.34,[1.8,1.15,-2.728],PI);box2(S.dark,1.77,1.83,.76,.96,-2.8,-2.75);chair(1.8,-1.9,PI);
    safeF(-2.9,-2.35,-2.9,-2.35,'e');plane(P('rules',{dyn:signTex('HOUSE RULES · NO CREDIT · NO PHONES','#d8d0b8','#1a1410',1024,128,'bold 48px Arial'),rough:.7}),1.5,.19,[1.8,1.85,-2.885],PI);plane(P('art-cards',{dyn:artTex(30),rough:.6}),.6,.8,[2.885,1.6,1.1],HALF);
    plane(smokeMat('haze','#c8c0b0',.25),3,1,[0,2.1,0],0,false,HALF);},
   'tattoo'(mod,t){const lamp=lampOf(mod.id),lea=leather();
    // the tattoo chair (a padded bench on a hydraulic column, raised back, arm rest, fresh film), the artist's stool, an articulated lamp
    cyl(S.steel,.16,.45,[-1.7,.22,1.8],12);box2(S.steel,-2.1,-1.3,0,.04,1.4,2.2);box2(lea,-2.05,-1.4,.5,.66,1.2,2.2);const hr=bx(lea,[.62,.1,.5],[-1.72,.78,2.35]);hr.rotation.x=-.5;box2(lea,-1.4,-1.05,.7,.76,1.6,1.9);cyl(S.steel,.03,.25,[-1.2,.6,1.75],6);
    box2(P('film',{c:'#d8e0e4',rough:.1,alpha:.25}),-2.06,-1.39,.661,.664,1.2,2.2);stool(-1.2,1.35,.55);cyl(S.dark,.3,.03,[-2.3,.015,1.25],12);cyl(S.steel,.03,1.7,[-2.3,.85,1.25],6);const a=cyl(S.steel,.025,.78,[-2.02,1.72,1.5],6,0,HALF);a.rotation.y=-PI/4;
    cyl(S.dark,.22,.12,[-1.74,1.68,1.78],14,0,0,.12);cyl(lamp,.18,.01,[-1.74,1.615,1.78],14);box2(rug(),-2.5,-.95,.001,.012,.95,2.7);
    // the ink station: a rolling cabinet, rows of ink bottles, the machine on its cradle, gloves, a towel roll
    box2(S.black,1,2.4,0,.9,2.4,2.9);for(const y of [.3,.6])box2(S.dark,1.02,2.38,y,y+.01,2.395,2.4);box2(S.steel,1,2.4,.9,.93,2.4,2.9);const IC=['#101010','#8a1a1a','#1a3a8a','#1a6a3a','#c8a020','#6a2a7a','#d0d0d0'];
    for(let i=0;i<14;i++)cyl(P('ink'+(i%7),{c:IC[i%7],rough:.25}),.04,.09,[1.1+(i%7)*.12,.975,2.82-Math.floor(i/7)*.12],8);box2(S.steel,1.95,2.1,.93,.99,2.48,2.58);box2(P('gloves',{c:'#2a5a9a',rough:.6}),2.15,2.35,.93,1.03,2.7,2.85);cyl(S.white,.1,.22,[2.25,1.04,2.5],10,0,HALF);
    // flash boards (original designs): east wall over the waiting bench, south wall, west wall over the counter
    const fl=(k,w,h,pos,ry)=>{plane(P('flash-'+k,{dyn:flashTex(k),rough:.7}),w,h,pos,ry);};fl(0,.72,.96,[2.885,1.6,1.15],HALF);fl(1,.72,.96,[2.885,1.6,1.95],HALF);fl(2,.96,.72,[-2.05,1.7,-2.885],PI);fl(3,.72,.96,[-2.885,1.7,-1.75],-HALF);
    for(const [x,y,z] of [[2.88,2.06,1.15],[2.88,2.06,1.95]])box2(S.red,x-.01,x,y,y+.02,z-.02,z+.02);
    // the waiting bench, magazines; the counter: sink, autoclave, a sharps bin, spray bottles; the booking desk, the safe; track lights; a plant; a sign
    box2(S.wood,2.4,2.9,.4,.45,.9,2.1);for(const z of [1,2])box2(S.steel,2.45,2.85,0,.4,z-.02,z+.02);box2(P('mag',{c:'#8a3a2a',rough:.5}),2.5,2.75,.45,.46,1.3,1.5);
    box2(S.gun,-2.9,-2.3,0,.86,-2.6,-1);box2(S.steel,-2.9,-2.3,.86,.9,-2.6,-1);box2(S.dark,-2.8,-2.4,.84,.901,-1.8,-1.3);cyl(S.steel,.03,.35,[-2.8,1.07,-1.55],8);box2(S.steel,-2.85,-2.45,.9,1.15,-2.5,-2.1);box2(P('sharps',{c:'#c8a020',rough:.5}),-2.85,-2.65,.9,1.1,-1.25,-1.05);
    for(let i=0;i<3;i++)cyl(P('spray'+(i%2),{c:['#c8d0d0','#3a8a5a'][i%2],rough:.3}),.06,.2,[-2.5+i*.08,1,-1.15],8);desk(1,2.6,-2.9,-2.3,'s');chair(1.8,-1.7,PI);safeF(2.35,2.9,-2.2,-1.65,'w');
    box2(S.black,-2.4,1.6,t.ceil-.04,t.ceil,-.03,.03);for(const x of [-1.9,-.9,.6,1.4]){cyl(S.dark,.1,.16,[x,t.ceil-.12,0],10);cyl(lamp,.08,.005,[x,t.ceil-.205,0],10);}plant(.8,-2.62,1.1);
    plane(P('tattoo-sign',{dyn:signTex('INK · WALK-INS AFTER DARK','#e0d0c0','#1a1210',1024,128,'bold 52px Arial'),rough:.6}),1.4,.18,[1.8,2.25,-2.885],PI);},
   'radio-booth'(mod,t){const lamp=lampOf(mod.id),foam=P('foam',{c:'#3a3a3e',dyn:TX.foam(),tile:.5,rough:1});
    // egg-crate foam on the walls round the desk and the couch
    box2(foam,-2.9,-2.84,.9,2.4,.7,2.84);box2(foam,-2.9,-2.84,.9,2.4,-2.9,-.7);box2(foam,-2.84,-.7,.9,2.4,2.84,2.9);box2(foam,-2.84,-1.15,.9,2.3,-2.9,-2.84);box2(foam,2.84,2.9,.9,2.4,-2.9,-.7);
    // the desk: mixer, speakers, the mic on its boom with a split pop filter, headphones; the ON AIR light (off); the broadcast monitor on the wall; the chair
    box2(S.dark,-2.7,-.9,.76,.8,2,2.84);for(const x of [-2.66,-.94])box2(S.steel,x-.02,x+.02,0,.76,2.05,2.8);box2(S.dark,-2.65,-.95,0,.76,2.78,2.82);box2(S.black,-2.3,-1.3,.8,.86,2.15,2.6);plane(P('mixer',{dyn:mixerTex(),rough:.5}),.98,.43,[-1.8,.862,2.375],0,false,HALF);
    for(const x of [-2.55,-1.05]){box2(S.black,x-.12,x+.12,.8,1.15,2.6,2.8);cyl(S.dark,.16,.02,[x,1.02,2.595],12,HALF);cyl(S.dark,.08,.02,[x,.88,2.595],10,HALF);}
    cyl(S.dark,.05,.1,[-1,.85,2.75],8);cyl(S.dark,.025,.5,[-1,1.1,2.75],6);cyl(S.dark,.02,.75,[-1,1.38,2.38],6,HALF);cyl(S.black,.06,.16,[-1,1.3,1.98],10);torus(S.black,.16,.01,[-1,1.33,1.88],HALF);cyl(P('popf',{c:'#101010',rough:.9,alpha:.6}),.15,.005,[-1,1.33,1.88],14,HALF);
    torus(S.black,.18,.03,[-2.45,.83,2.2]);box2(S.dark,-2.1,-1.5,1.98,2.22,2.84,2.9);plane(P('onair',{dyn:signTex('ON AIR','#5a1a14','#120404',256,96,'bold 56px Arial'),rough:.4}),.56,.2,[-1.8,2.1,2.837],0);
    bx(S.black,[.04,.4,.66],[-2.82,1.7,1.1],0);plane(screenMat(mod.id,'wave',waveTex()),.62,.36,[-2.797,1.7,1.1],-HALF);chair(-1.8,1.45,0);box2(rug(),-2.4,-.6,.001,.012,.8,2);
    // transmitter racks: two cabinets with blinking fronts, a meter unit, coax up through the ceiling
    {const rk=rackTex(),front=P('rack-front',{c:'#ffffff',dyn:rk.alb,tile:1,rough:.4,metal:.3,emTex:rk.led}),body=P('rack-body',{c:'#1a1c20',tex:'district-interior/kit_gunmetal_color.jpg',tile:1,rough:.45,metal:.7});modState[mod.id].blink=rk.led;
     for(const x0 of [1.72,2.3]){box2(body,x0,x0+.58,0,1.9,2.12,2.9);plane(front,.54,1.8,[x0+.29,.95,2.114],0,false,0,new B.Vector4(0,.5,.5,.75));}box2(S.gun,1.75,2.85,1.9,2.05,2.3,2.85);for(let i=0;i<4;i++)box2(S.ledA,1.85+i*.25,1.95+i*.25,1.95,1.99,2.298,2.3);
     for(const x of [2.5,2.62])cyl(S.black,.03,t.ceil-2.05,[x,2.05+(t.ceil-2.05)/2,2.75],6);}
    // the couch and a crate of records; record shelves (east, south half); the playout table; a poster
    const cu=P('couch',{c:'#4a4438',dyn:TX.weave('#4a4436'),tile:.5,rough:1});box2(cu,-2.84,-2.2,0,.42,-2.6,-1);box2(cu,-2.84,-2.62,.42,.8,-2.6,-1);box2(cu,-2.84,-2.2,.42,.58,-2.6,-2.45);box2(cu,-2.84,-2.2,.42,.58,-1.15,-1);
    box2(P('crate-milk',{c:'#2a4a8a',rough:.5}),-2,-1.6,0,.3,-2.8,-2.4);box2(P('sleeves',{dyn:sleevesTex(),rough:.7}),-1.98,-1.62,.3,.32,-2.78,-2.42);box2(S.wood,2.45,2.84,0,1.6,-2.6,-1);plane(P('sleeves',{dyn:sleevesTex(),rough:.7}),1.5,1.5,[2.448,.8,-1.8],HALF);
    for(const y of [0,.4,.8,1.2,1.58])box2(S.wood,2.42,2.45,y,y+.02,-2.6,-1);desk(.9,1.9,-2.9,-2.4,'s');stool(1.4,-1.95);plane(P('poster-radio',{dyn:artTex(260),rough:.7}),.55,.75,[1.4,1.85,-2.885],PI);cyl(S.black,.015,2.4,[.2,.007,1.2],4,HALF);},
   'scooter-bay'(mod,t){const lamp=lampOf(mod.id),yl=P('lift-yellow',{c:'#8a7020',rough:.55,metal:.4}),paint=P('scooter',{c:'#6a2a22',rough:.35,metal:.5}),red=P('chest-red',{c:'#8a1e1a',rough:.4,metal:.5});
    // the scissor lift and the scooter on it (pointing north), one side panel off, its battery and wiring showing
    box2(yl,-2.5,-1.1,0,.06,1,2.6);for(const x of [-2.4,-1.2])for(const s2 of [1,-1]){const a=bx(yl,[.06,.06,1.6],[x,.26,1.8],0);a.rotation.x=.28*s2;}box2(yl,-2.55,-1.05,.46,.52,.95,2.65);for(let z=1;z<2.6;z+=.25)box2(S.black,-2.56,-2.54,.47,.51,z,z+.1);
    const wy=.72;for(const z of [1.25,2.35]){torus(S.rubber,.36,.09,[-1.8,wy,z],HALF,HALF);cyl(S.steel,.16,.08,[-1.8,wy,z],12,0,HALF);}box2(paint,-1.95,-1.65,.62,.7,1.45,2.15);box2(paint,-2,-1.6,.7,1.05,1.85,2.45);box2(P('seat',{c:'#141414',rough:.6}),-1.96,-1.64,1.05,1.12,1.85,2.35);
    const sh=bx(paint,[.4,.7,.06],[-1.8,1,1.38],0);sh.rotation.x=-.25;const fk=cyl(S.steel,.05,.75,[-1.8,1,1.3],8);fk.rotation.x=-.25;cyl(S.dark,.04,.62,[-1.8,1.4,1.42],8,0,HALF);cyl(S.white,.12,.06,[-1.8,1.28,1.32],12,HALF);
    box2(S.dark,-1.68,-1.6,.75,.98,1.95,2.35);cyl(S.red,.012,.4,[-1.6,.9,2.15],4,HALF);const pn=bx(paint,[.03,.4,.55],[-1.03,.2,2.3],0);pn.rotation.z=.2;
    // the tool chest and the pegboard; tyres on wall hooks
    box2(red,2.2,2.9,.06,1.1,1.1,2.3);for(let y=.2;y<1.05;y+=.15)box2(S.steel,2.19,2.2,y,y+.015,1.2,2.2);box2(S.black,2.2,2.9,1.1,1.12,1.1,2.3);for(const z of [1.15,2.25])cyl(S.dark,.08,.06,[2.55,.04,z],8,0,HALF);box2(S.steel,2.3,2.7,1.12,1.14,1.3,1.4);box2(S.steel,2.35,2.45,1.12,1.16,1.8,2.1);
    plane(P('peg',{dyn:TX.peg(),rough:.8}),1.6,.9,[1.9,1.75,2.885],0);for(const x of [.95])torus(S.rubber,.5,.12,[x,1.55,2.8],HALF);
    // oil drums on a spill tray (one with a funnel)
    box2(yl,1.5,2.8,0,.08,-2.8,-1.5);const dc=['#1a3a6a','#5a3a1e','#1a1a1a','#3a5a3a'];[[1.85,-2.45],[2.45,-2.45],[1.85,-1.85],[2.45,-1.85]].forEach(([x,z],i)=>{const m=P('drum'+i,{c:dc[i],tex:'ncz/metal-leaks-color.jpg',tile:.8,rough:.5,metal:.6});cyl(m,.56,.86,[x,.51,z],16);torus(S.dark,.56,.025,[x,.3,z]);torus(S.dark,.56,.025,[x,.72,z]);cyl(S.dark,.05,.02,[x+.15,.95,z+.1],8);});
    cyl(S.steel,.03,.15,[1.85,1.02,-2.45],10,0,0,.2);plane(P('garage-sign',{dyn:signTex('NO SMOKING · FUEL','#1a1400','#c8a040',512,128,'bold 52px Arial'),rough:.6}),.7,.18,[2.885,1.8,-2.15],HALF);
    // the workbench: vice, the diagnostic laptop, oil cans; a compressor under it; tyres stacked by the south wall
    box2(S.wood,-2.9,-2.25,.86,.9,-2.6,-1);for(const x of [-2.86,-2.29])for(const z of [-2.56,-1.04])box2(S.gun,x-.02,x+.02,0,.86,z-.02,z+.02);box2(S.gun,-2.4,-2.28,.9,1.05,-1.4,-1.2);
    box2(S.plastic,-2.75,-2.4,.9,.92,-2.05,-1.65);box2(S.plastic,-2.77,-2.75,.92,1.16,-2.03,-1.67);plane(screenMat(mod.id,'diag',consoleTex()),.34,.2,[-2.748,1.04,-1.85],-HALF);for(let i=0;i<3;i++)cyl(P('oilcan',{c:'#8a6a1a',rough:.4,metal:.6}),.1,.18,[-2.75+i*.13,.99,-2.45],10);
    cyl(red,.3,.6,[-2.6,.22,-1.4],12,HALF);for(let i=0;i<4;i++)torus(S.rubber,.55,.17,[-1.8,.09+i*.17,-2.55]);
    // the floor: oil stains, a painted line round the lift, a drain
    decal(oilMat(),1.1,.8,-.5,1.4);decal(oilMat(),.8,.6,1,-.6);for(const [x0,x1,z0,z1] of [[-2.75,-.85,.75,.8],[-2.75,-.85,2.75,2.8],[-.9,-.85,.75,2.8]])box2(S.amberPaint,x0,x1,.001,.004,z0,z1);box2(S.dark,-.2,.2,.001,.006,-.2,.2);},
   'shrine-room'(mod,t){const lamp=lampOf(mod.id),dw=darkWood(),red=P('shrine-red',{c:'#5a1a14',rough:.45}),wax=P('wax',{c:'#d8ccb0',rough:.6}),flm=P('candle-flame',{em:'#ffb050',unlit:true});
    // the altar: a low dark-wood table under a red cloth, a painted back panel (a gold disc over mountains: no symbols), offerings, coins, the incense bowl and its smoke
    box2(dw,-1.5,.5,0,.7,1.4,1.9);box2(red,-1.45,.45,.7,.71,1.35,1.9);box2(red,-1.45,.45,.35,.7,1.35,1.36);box2(dw,-1.4,.4,.71,1.9,1.84,1.9);plane(P('altar-panel',{dyn:altarTex(),rough:.6}),1.6,1,[-.5,1.35,1.837],0);box2(dw,-1.5,.5,1.9,1.95,1.7,1.9);
    box2(S.white,-1.28,-.92,.71,.72,1.5,1.72);for(let i=0;i<5;i++)cyl(P('fruit'+(i%2),{c:['#c86a1a','#a8a020'][i%2],rough:.5}),.09,.08,[-1.18+(i%3)*.08,.76+Math.floor(i/3)*.06,1.58+(i%2)*.06],10);cyl(S.white,.12,.06,[-.6,.74,1.6],12);cyl(P('rice',{c:'#e8e4d8',rough:.9}),.11,.01,[-.6,.775,1.6],12);
    cyl(celadon(),.07,.06,[-.3,.74,1.65],10);for(let i=0;i<4;i++)cyl(brass(),.03,.004,[-.2+i*.05,.712,1.5],8);cyl(P('pot',{c:'#4a3a32',rough:.6}),.16,.1,[.1,.76,1.6],12);cyl(P('ash',{c:'#8a8680',rough:1}),.14,.005,[.1,.811,1.6],12);
    for(let k=0;k<3;k++){cyl(P('incense',{c:'#7a3a1e',rough:.8}),.006,.25,[.1+(k-1)*.025,.93,1.6],4,(k-1)*.1);box2(P('ember',{em:'#ff6a20',unlit:true}),.096+(k-1)*.025+(k-1)*.012,.104+(k-1)*.025+(k-1)*.012,1.04,1.05,1.596,1.604);}
    const sm=smokeMat('incense-smoke','#c8c4bc',.4);for(let k=0;k<3;k++){plane(sm,.35,.7,[.1+(k-1)*.05,1.4+k*.35,1.55],k*.7);plane(sm,.35,.7,[.1+(k-1)*.05,1.4+k*.35,1.55],k*.7+HALF);}plane(smokeMat('incense-haze','#b8b4ac',.18),3.4,3.4,[0,t.ceil-.15,0],0,false,HALF);
    // candles on the altar and on a rack in the south-east corner
    for(const x of [-1.35,.35]){cyl(wax,.06,.18,[x,.8,1.75],8);cyl(flm,.002,.05,[x,.915,1.75],6,0,0,.025);}box2(S.dark,1.3,1.9,.6,.63,-1.9,-1.2);box2(S.dark,1.3,1.9,.95,.98,-1.9,-1.2);for(const x of [1.33,1.87])for(const z of [-1.87,-1.23])cyl(S.dark,.025,.98,[x,.49,z],6);
    for(let i=0;i<14;i++){const tier=i<8?.63:.98,x=1.4+(i%4)*.14,z=-1.82+(Math.floor(i/4)%2)*.25+(i>=8?.12:0),h=.05+((i*7)%5)*.02;cyl(wax,.04,h,[x,tier+h/2,z],6);if(i%5!==3)cyl(flm,.002,.035,[x,tier+h+.018,z],5,0,0,.018);}box2(wax,1.35,1.85,.55,.6,-1.85,-1.25);
    // paper charm strips on red thread over a low cabinet (west wall), a worn mat and a kneeling cushion, two red lanterns, a hanging lantern (the room's light), smoke stains above
    box2(dw,-1.9,-1.62,0,.8,.1,1.3);box2(dw,-1.9,-1.84,1.55,1.6,.1,1.3);for(let i=0;i<10;i++){const z=.18+i*.11;plane(P('charm'+(i%3),{dyn:charmTex(i%3),rough:.9}),.07,.3,[-1.83,1.36-(i%3)*.04,z],-HALF);box2(P('thread',{c:'#8a1a14',rough:.8}),-1.84,-1.83,1.5-(i%3)*.04,1.55,z-.003,z+.003);}
    box2(tatami(),-1.3,.3,.001,.03,.3,1.3);box2(cushion(),-.75,-.25,.03,.12,.75,1.15);for(const x of [-1.6,.6])cyl(P('lantern-red',{c:'#8a1a14',rough:.7,em:'#2a0604'}),.22,.26,[x,1.95,1.7],12);
    lantern(-.5,.6,1.75,t.ceil,lamp,.32);plane(stainMat(),1.4,1,[-.4,t.ceil-.005,1.3],0,false,-HALF);decal(stainMat(),.8,.6,.8,.2);},
   'fight-pit'(mod,t){const lamp=lampOf(mod.id),mesh=meshMat(),mat=P('ring-mat',{c:'#3a3a3c',dyn:TX.weave('#2e2e30'),tile:1.2,rough:.85}),Ch=t.ceil;
    // the ring: a low concrete platform with a patched canvas mat, scaffold poles, chain-link walls, the gate gap on the south side; buckets and a towel in two corners
    box2(S.concrete,-1.95,1.95,0,.15,-1.95,1.95);box2(mat,-1.85,1.85,.15,.16,-1.85,1.85);decal(stainMat(),1.2,1,.3,.4,.163);decal(stainMat(),.8,.7,-.9,-.6,.164);for(const [x0,z0] of [[-.6,.9],[.7,-1.2]])box2(P('tape',{c:'#8a8a84',rough:.6}),x0,x0+.5,.16,.162,z0,z0+.08);
    for(const x of [-1.9,0,1.9])for(const z of [-1.9,0,1.9])if(x||z)cyl(S.steel,.06,2.15,[x,1.075,z],8);for(const x of [-.6,.6])cyl(S.steel,.06,2.15,[x,1.075,-1.9],8);
    for(const y of [.25,2.1]){box2(S.steel,-1.93,-1.87,y-.02,y+.02,-1.9,1.9);box2(S.steel,1.87,1.93,y-.02,y+.02,-1.9,1.9);box2(S.steel,-1.9,1.9,y-.02,y+.02,1.87,1.93);box2(S.steel,-1.9,-.6,y-.02,y+.02,-1.93,-1.87);box2(S.steel,.6,1.9,y-.02,y+.02,-1.93,-1.87);}
    box2(mesh,-1.905,-1.895,.16,2.1,-1.9,1.9);box2(mesh,1.895,1.905,.16,2.1,-1.9,1.9);box2(mesh,-1.9,1.9,.16,2.1,1.895,1.905);box2(mesh,-1.9,-.6,.16,2.1,-1.905,-1.895);box2(mesh,.6,1.9,.16,2.1,-1.905,-1.895);
    for(const [x,z] of [[-1.55,1.55],[1.55,1.55]]){cyl(P('bucket',{c:'#c8a020',rough:.5}),.3,.3,[x,.31,z],12);box2(P('towel',{c:'#d8d4c8',rough:1}),x-.2,x+.2,.16,.2,z-.4,z-.25);}
    // standing room: concrete steps along the west wall, barrels with a plank (south-east), the betting cage (north-east) with its grille, slot, ledger and odds board
    box2(S.concrete,-3.9,-3.1,0,.45,.2,3.6);box2(S.concrete,-3.9,-3.5,.45,.9,.2,3.6);box2(S.amberPaint,-3.12,-3.1,.42,.45,.2,3.6);box2(S.amberPaint,-3.52,-3.5,.87,.9,.2,3.6);
    [[2.85,-3.5],[3.5,-3.5],[3.5,-3.0]].forEach(([x,z],i)=>cyl(P('drum'+(i+1),{c:['#1a3a6a','#5a3a1e','#1a1a1a','#3a5a3a'][i+1],tex:'ncz/metal-leaks-color.jpg',tile:.8,rough:.5,metal:.6}),.56,.86,[x,.43,z],16));box2(S.wood,2.55,3.85,.86,.9,-3.65,-3.35);
    box2(S.gun,2.9,3.2,0,1.05,1.4,3.9);box2(S.steel,2.85,3.2,1.05,1.1,1.4,3.9);box2(S.gun,2.9,3.9,0,2.2,1.4,1.5);box2(S.gun,2.9,3.9,2.2,2.26,1.4,3.9);for(let z=1.55;z<3.88;z+=.09)box2(S.steel,2.9,2.92,1.1,2.2,z-.007,z+.007);box2(S.black,2.88,2.9,1.1,1.16,2.2,2.6);
    box2(P('cage-glow',{em:'#2a1a0a',unlit:true}),3.85,3.88,.5,2.1,1.5,3.85);box2(P('ledger',{c:'#3a1a14',rough:.7}),2.95,3.15,1.1,1.13,2.7,3);cyl(S.steel,.01,.4,[3.05,1.11,3.2],4,HALF);plane(P('odds',{dyn:oddsTex(),rough:.9}),.9,.6,[3.4,1.75,1.395],PI);box2(darkWood(),2.93,3.87,1.43,1.46,1.385,1.4);box2(darkWood(),2.93,3.87,2.04,2.07,1.385,1.4);
    // hanging work lights over the ring (the room's light) on a cable, pipes high on the walls, graffiti, a fire extinguisher, stains
    for(const [x,z] of [[-1,-1],[1,-1],[-1,1],[1,1]]){cyl(S.black,.012,Ch-2.6,[x,2.6+(Ch-2.6)/2,z],6);cyl(S.dark,.42,.22,[x,2.5,z],14,0,0,.12);cyl(lamp,.36,.01,[x,2.385,z],14);}cyl(S.black,.02,2,[0,Ch-.05,-1],4,0,HALF);cyl(S.black,.02,2,[0,Ch-.05,1],4,0,HALF);cyl(S.black,.02,2,[0,Ch-.06,0],4,HALF);
    for(const z of [3.72,-3.72])cyl(pipeM('#5a5e5a'),.14,7.6,[0,Ch-.25,z],10,0,HALF);cyl(pipeM('#7a3a2a'),.08,7.6,[3.75,Ch-.4,0],10,HALF);graffiti(0,2,1,1.2,1.9,3.885,0);graffiti(2,1.8,.9,-3.885,1.9,-2.4,-HALF);graffiti(1,1.6,.8,1.6,1.6,-3.885,PI);
    cyl(S.red,.16,.5,[-2.6,.45,-3.82],12);box2(S.dark,-2.7,-2.5,.75,.8,-3.9,-3.86);decal(stainMat(),1.6,1.2,-2.6,-2.5);decal(puddleMat(),1.2,.8,2.2,-1.2);decal(stainMat(),1,1,2.6,2.6);},
   'gang-vestibule'(mod,t){const lamp=lampOf(mod.id),mesh=meshMat(),Ch=t.ceil;
    // the fence down the middle (scaffold posts, chain-link), the pass-through over the table, a steel plate under it, the gate leaf swung open at the north end
    for(const z of [-1.6,-.6,.6,1.6])cyl(S.steel,.05,2.2,[0,1.1,z],8);box2(S.steel,-.03,.03,2.17,2.2,-1.6,1.6);box2(mesh,-.005,.005,0,2.17,-1.6,-.6);box2(mesh,-.005,.005,0,2.17,.6,1.6);box2(mesh,-.005,.005,1.25,2.17,-.6,.6);box2(S.rust,-.04,.04,0,.75,-.6,.6);box2(S.steel,-.14,.14,.75,.78,-.6,.6);
    // Only the public tunnel checkpoints need this opening clear. The fixed fence ends at z=1.6.
    if(!NET){box2(mesh,.025,.035,.05,2,1.65,2.5);box2(S.steel,.02,.04,.05,2,2.48,2.52);box2(S.steel,.02,.04,1.98,2.02,1.65,2.52);}
    // the battered table: a cash box with a padlock, the scanner wand, a list; stools behind it
    box2(P('table-worn',{c:'#5a4a3a',dyn:TX.planks('#4a3a2a','#1a120a'),tile:1,rough:.8}),.25,1.25,.72,.75,-.6,.6);for(const x of [.3,1.2])for(const z of [-.55,.55])box2(S.dark,x-.025,x+.025,0,.72,z-.025,z+.025);
    box2(P('cashbox',{c:'#3a4a3a',rough:.45,metal:.6}),.6,.9,.75,.85,-.5,-.25);box2(P('padlock',{c:'#8a7a3a',rough:.35,metal:.85}),.58,.6,.77,.82,-.4,-.35);cyl(S.black,.04,.35,[.7,.775,.35],8,HALF);cyl(S.dark,.08,.04,[.7,.775,.55],10,HALF);box2(S.paper,.35,.55,.75,.752,0,.25);
    stool(1.65,-.75);stool(1.65,.75);
    // the CCTV monitor on a crate (south-east), its cable up the wall
    box2(P('crate-wood',{c:'#6a5638',dyn:TX.planks('#5a4630','#2a1e10'),tile:.8,rough:.85}),1.2,1.9,0,.9,-2.9,-2.2);box2(S.plastic,1.3,1.8,.9,1.3,-2.75,-2.35);plane(screenMat(mod.id,'cctv',cctvTex()),.42,.32,[1.55,1.1,-2.347],PI);cyl(S.black,.015,Ch-1.3,[1.85,1.3+(Ch-1.3)/2,-2.85],4);
    // steel plates round both doors (heavy doors), graffiti, bare bulbs (the room's light), a bin, cigarette ends
    for(const [zf,o] of [[2.9,-1],[-2.9,1]]){const z0=Math.min(zf,zf+o*.05),z1=Math.max(zf,zf+o*.05);box2(S.rust,-1.9,-1.62,0,Ch,z0,z1);box2(S.rust,-.38,-.1,0,Ch,z0,z1);box2(S.rust,-1.62,-.38,2.3,Ch,z0,z1);for(const y of [.4,1.2,2])for(const x of [-1.8,-.2])cyl(S.dark,.03,.02,[x,y,zf+o*.06],6,HALF);}
    graffiti(0,2.4,1.3,-1.885,1.4,.2,-HALF);graffiti(3,1,.6,1.885,1.6,.4,HALF);graffiti(1,1.2,.7,.9,1.7,-2.885,PI);graffiti(2,1,.5,-1,2.45,-2.835,PI);
    for(const [x,z] of [[-1,-1.5],[-1,1.2],[.9,0]])bulb(x,z,1.95,Ch,lamp);cyl(S.rust,.4,.6,[1.6,.3,1.05],12);decal(stainMat(),1,.8,-1,.3);decal(stainMat(),.8,.6,.9,-1.6);},
   'stairwell'(mod,t){const hw=t.w*M.GRID/2,hd=t.d*M.GRID/2,Ch=t.ceil,conc=S.concrete,fl=C.floors||[],up=fl.some(f=>f>mod.floor),down=fl.some(f=>f<mod.floor),R=.19,N=13,G=(hd-.1+.5)/N;
    // the flight down (east): steps into the shaft below the floor, its walls, a dark landing far below, a handrail; the flight up (west) under an opening in the ceiling
    for(let i=0;i<N;i++){const z0=-.5+i*G;box2(conc,.25,hw-.1,-(i+1)*R-.15,-(i+1)*R,z0,z0+G);box2(S.amberPaint,.25,hw-.1,-(i+1)*R-.004,-(i+1)*R+.002,z0,z0+.04);}
    box2(conc,hw-.1,hw,-2.9,0,-.5,hd);box2(conc,.2,.25,-2.9,0,-.5,hd);box2(conc,.25,hw-.1,-2.9,0,hd-.1,hd);box2(S.void,.25,hw-.1,-2.95,-2.9,-.5,hd);
    for(let i=0;i<N;i++){const z0=-.5+i*G;box2(conc,-hw+.1,-.25,0,(i+1)*R,z0,z0+G);box2(S.amberPaint,-hw+.1,-.25,(i+1)*R-.002,(i+1)*R+.004,z0,z0+.04);}
    box2(S.void,-hw,-.25,Ch+.85,Ch+.9,1,hd);for(const [x0,x1,z0,z1] of [[-hw,-hw+.1,1,hd],[-.3,-.25,1,hd],[-hw,-.25,hd-.1,hd],[-hw,-.25,1,1.05]])box2(conc,x0,x1,Ch,Ch+.85,z0,z1);
    const sl=Math.atan2(R,G),rl=Math.hypot(N*G,N*R);for(const [x,dir] of [[-hw+.16,1],[hw-.16,-1]]){const r=cyl(S.steel,.045,rl,[x,dir>0?.95+N*R/2:.95-N*R/2,-.5+N*G/2],8,HALF-dir*sl);}
    // the divider wall with its rail, the chain across the top of the flight down, signs, the level
    box2(conc,-.25,.25,0,1,-.5,hd);cyl(S.steel,.05,hd+.5,[0,1.05,(hd-.5)/2],8,HALF);for(const x of [.4,1.75])cyl(S.steel,.05,1,[x,.5,-.52],8);box2(S.steel,.3,1.85,.98,1.02,-.54,-.5);box2(S.amberPaint,.3,1.85,.55,.58,-.535,-.505);
    if(!down)plane(P('stairs-closed',{dyn:signTex('CLOSED','#1a1400','#c8a040',256,96,'bold 50px Arial'),rough:.6}),.4,.14,[1.07,.8,-.545],PI);
    if(!up){box2(S.steel,-1.85,-.3,.98,1.02,-.54,-.5);for(const x of [-1.75,-.4])cyl(S.steel,.05,1,[x,.5,-.52],8);plane(P('stairs-closed',{dyn:signTex('CLOSED','#1a1400','#c8a040',256,96,'bold 50px Arial'),rough:.6}),.4,.14,[-1.07,.8,-.545],PI);}
    plane(P('stair-level-'+mod.id,{dyn:signTex('LEVEL '+M.floorName(mod.floor),'#d8c890','#2a2620',512,128,'bold 60px Arial'),rough:.7}),.8,.2,[-hw+.115,2.05,-1.6],-HALF);graffiti(1,1.2,.6,hw-.115,1.7,-1.6,HALF);decal(puddleMat(),.8,.5,0,-2.3);}
  });
  // TUNNEL TUBES: the cross-section (pipes, the tray, the channel) is the same on every piece and symmetric, so pieces butt together seamlessly; the lamps hang every 2 m
  function tube(mod,t){const hw=t.w*M.GRID/2,hd=t.d*M.GRID/2,Ch=t.ceil,lamp=lampOf(mod.id),j=t.sockets.length>2,open=new Set((mod.open||[]).map(id=>(t.sockets.find(s=>s.id===id)||{}).edge)),dark=P('drain-water',{c:'#0a0e10',rough:.02,metal:.4});
   const pLow=pipeM('#5a5e5a'),pHigh=pipeM('#6a5a4a'),pSm=pipeM('#7a3a2a'),run=(m,d,y,off,ax,a0,a1)=>{const L=a1-a0,c=(a0+a1)/2;if(L<.01)return;if(ax==='z')cyl(m,d,L,[off,y,c],10,HALF);else cyl(m,d,L,[c,y,off],10,0,HALF);};
   const sides=j?['w','e','s','n']:['w','e'],edgeOf=(sd)=>sd==='w'||sd==='e'?{ax:'z',off:sd==='w'?-1:1,a0:-hd,a1:hd}:{ax:'x',off:sd==='s'?-1:1,a0:-hw,a1:hw};
   for(const sd of sides){const E=edgeOf(sd),closed=!j||!open.has(sd);
    // high pipes and the small pipe run round every side (over a junction's openings too); the low pipe only along a closed wall
    run(pHigh,XS.high[2],Ch-XS.high[1],E.off*XS.high[0],E.ax,E.a0,E.a1);run(pSm,XS.small[2],Ch-XS.small[1],E.off*XS.small[0],E.ax,E.a0,E.a1);if(closed)run(pLow,XS.low[2],XS.low[1],E.off*XS.low[0],E.ax,E.a0,E.a1);
    // brackets every metre on a closed wall (at the same places on every piece: half-metre marks)
    if(closed)for(let u=E.a0+.5;u<E.a1;u+=1){if(E.ax==='z')box2(S.dark,E.off*.9-.02,E.off*.9+.02,.15,Ch-.1,u-.02,u+.02);else box2(S.dark,u-.02,u+.02,.15,Ch-.1,E.off*.9-.02,E.off*.9+.02);}}
   if(j){for(const [sx,sz] of [[-1,-1],[1,-1],[-1,1],[1,1]]){cyl(pLow,XS.low[2],Ch-XS.high[1]-XS.low[1],[sx*XS.low[0],(XS.low[1]+Ch-XS.high[1])/2,sz*XS.low[0]],10);}   // risers in the corners join the low pipes of the arms to the high ring
    for(const sd of ['s','n','w','e'])if(open.has(sd)){const E=edgeOf(sd==='s'||sd==='n'?(sd):sd);for(const k of [-1,1]){if(sd==='s'||sd==='n')run(pLow,XS.low[2],XS.low[1],k*XS.low[0],'z',sd==='s'?-hd:XS.low[0],sd==='s'?-XS.low[0]:hd);else run(pLow,XS.low[2],XS.low[1],k*XS.low[0],'x',sd==='w'?-hw:XS.low[0],sd==='w'?-XS.low[0]:hw);}}}
   // the cable tray on the centre line of the ceiling (a cross in a junction), cables in it
   const tray=(ax,a0,a1)=>{if(ax==='z'){box2(S.steel,-XS.tray[0],XS.tray[0],Ch-XS.tray[1],Ch-XS.tray[1]+.02,a0,a1);for(const s2 of [-1,1])box2(S.steel,s2*XS.tray[0]-.012,s2*XS.tray[0]+.012,Ch-XS.tray[1],Ch-XS.tray[1]+.07,a0,a1);for(const [k,c] of [[-.1,'#8a7a2a'],[0,'#2a2a2a'],[.1,'#2a3a5a']])cyl(P('cable'+k,{c,rough:.6}),.04,a1-a0,[k,Ch-XS.tray[1]+.04,(a0+a1)/2],8,HALF);}
    else{box2(S.steel,a0,a1,Ch-XS.tray[1],Ch-XS.tray[1]+.02,-XS.tray[0],XS.tray[0]);for(const s2 of [-1,1])box2(S.steel,a0,a1,Ch-XS.tray[1],Ch-XS.tray[1]+.07,s2*XS.tray[0]-.012,s2*XS.tray[0]+.012);for(const [k,c] of [[-.1,'#8a7a2a'],[0,'#2a2a2a'],[.1,'#2a3a5a']])cyl(P('cable'+k,{c,rough:.6}),.04,a1-a0,[(a0+a1)/2,Ch-XS.tray[1]+.04,k],8,0,HALF);}};
   tray('z',-hd,hd);if(j&&(open.has('w')||open.has('e')))tray('x',open.has('w')?-hw:XS.tray[0],open.has('e')?hw:-XS.tray[0]);
   // the drainage channel down the centre line (a cross in a junction): dark water under a steel grate
   const ch=(ax,a0,a1)=>{if(ax==='z'){box2(dark,-XS.drain,XS.drain,.0006,.003,a0,a1);for(let u=a0+.125;u<a1;u+=.25)box2(S.steel,-XS.drain-.01,XS.drain+.01,.003,.007,u-.015,u+.015);}else{box2(dark,a0,a1,.0006,.003,-XS.drain,XS.drain);for(let u=a0+.125;u<a1;u+=.25)box2(S.steel,u-.015,u+.015,.003,.007,-XS.drain-.01,XS.drain+.01);}};
   ch('z',-hd,hd);if(j&&(open.has('w')||open.has('e')))ch('x',open.has('w')?-hw:XS.drain,open.has('e')?hw:-XS.drain);
   // lamps: a caged lamp at the middle of every 2 m cell, hung from the tray
   for(let k=0;k<t.d;k++){const z=-hd+1+k*2;cyl(S.dark,.02,.12,[0,Ch-XS.tray[1]-.06,z],6);caged(0,Ch-XS.tray[1]-.06,z,false,lamp);}
   // the wet: puddles, water streaks on the walls, graffiti on a closed wall, a junction box on the 6 m piece
   for(let k=0;k<t.d;k++){const z=-hd+1+k*2;if(rand()<.6)decal(puddleMat(),.6+rand()*.6,.4+rand()*.4,(rand()-.5)*1.1,z+(rand()-.5)*1.2,.004+k*.0005);}
   for(const sd of ['w','e'])if(!j||!open.has(sd)){const x=sd==='w'?-.895:.895;if(rand()<.7)plane(stainMat(),.6+rand()*.5,1.4,[x,1.6,(rand()-.5)*(hd*2-1)],sd==='w'?-HALF:HALF);}
   if(!j&&t.d>=2&&rand()<.8){const sd=rand()<.5?'w':'e';graffiti(Math.floor(rand()*4),1.4,.7,sd==='w'?-.893:.893,1.25,(rand()-.5)*(hd*2-2),sd==='w'?-HALF:HALF);}
   if(t.dress==='lantern')lanternDress(mod,t,hd,Ch,j,open);
   if(mod.type==='tunnel'){box2(P('junction',{c:'#5a6058',rough:.5,metal:.6}),-.9,-.72,.6,1.6,.4,1.3);box2(S.ledA,-.721,-.719,1.4,1.45,.6,.65);box2(S.ledG,-.721,-.719,1.4,1.45,.75,.8);}}
  // THE UNDERGROUND, EAST ASIAN SET: a concrete vault over a converted chamber, cloth (curtains, banners), a lantern string, a wall shrine; then the rooms
  function vaultOver(hw,hd,spring,rise,ribs){const conc=STY.tunnel.wall,v=B.MeshBuilder.CreateCylinder('mod-vault',{diameter:hw*2,height:hd*2,arc:.5,tessellation:28,enclose:false,sideOrientation:B.Mesh.DOUBLESIDE},scene);v.rotation.set(HALF,0,0);v.scaling.set(1,1,rise/hw);v.position.set(0,spring,0);add(v,conc);
   for(const z of ribs){const r=B.MeshBuilder.CreateCylinder('mod-rib',{diameter:hw*2-.2,height:.22,arc:.5,tessellation:28,enclose:true,sideOrientation:B.Mesh.DOUBLESIDE},scene);r.rotation.set(HALF,0,0);r.scaling.set(1,1,rise/hw);r.position.set(0,spring,z);add(r,S.concrete);}}
  const clothMat=(key,c,tex)=>{const m=P(key,{c,dyn:tex,tile:1,rough:1});if(!m.metadata.ds){m.metadata.ds=1;m.backFaceCulling=false;}return m;};
  TX.fold=base=>canvas(256,256,(g,w,h)=>{g.fillStyle=base;g.fillRect(0,0,w,h);for(let x=0;x<w;x+=2){const v=Math.sin(x*.12)*.16+Math.sin(x*.31)*.06;g.fillStyle=v>0?'rgba(255,255,255,'+v*.5+')':'rgba(0,0,0,'+(-v)+')';g.fillRect(x,0,2,h);}speck(g,w,h,2000,.05);grime(g,w,h,.5);},'mod-fold');
  function bannerTex(k){return canvas(128,384,(g,w,h)=>{g.fillStyle=['#5a1612','#14283a','#2a2a14'][k%3];g.fillRect(0,0,w,h);g.strokeStyle='#b88a3a';g.fillStyle='#b88a3a';g.lineWidth=4;g.strokeRect(10,10,w-20,h-30);
    for(let i=0;i<3;i++){const y=70+i*100;if((i+k)%3===0){g.beginPath();g.arc(w/2,y,26,0,7);g.stroke();g.beginPath();g.arc(w/2,y,12,0,7);g.fill();}else if((i+k)%3===1){g.beginPath();g.moveTo(w/2,y-30);g.lineTo(w/2+26,y);g.lineTo(w/2,y+30);g.lineTo(w/2-26,y);g.closePath();g.stroke();}else{for(let r=0;r<3;r++){g.beginPath();g.arc(w/2,y+14,30-r*9,Math.PI,0);g.stroke();}}}
    g.fillStyle='rgba(0,0,0,.6)';for(let x=0;x<w;x+=8)g.fillRect(x,h-14+((x/8)%2)*4,4,14);grime(g,w,h,.5);},'mod-banner');}
  function tilesTex(){return TX._ti??=canvas(256,64,(g,w,h)=>{g.fillStyle='#1e4a32';g.fillRect(0,0,w,h);g.fillStyle='#d8d0b8';g.fillRect(0,0,w,h*.55);for(let x=0;x<w;x+=16){g.fillStyle='rgba(0,0,0,.45)';g.fillRect(x,0,1.5,h);}},'mod-tiles-mj');}
  function faceTex(){return TX._tf??=canvas(256,256,(g,w,h)=>{g.fillStyle='#e0d8c0';g.fillRect(0,0,w,h);for(let i=0;i<16;i++){const x=(i%4)*64,y=Math.floor(i/4)*64;g.strokeStyle='rgba(0,0,0,.35)';g.strokeRect(x+1,y+1,62,62);const n=1+i%6;for(let k=0;k<n;k++){g.fillStyle=['#2a5a3a','#8a1a14','#1a3a6a'][(i+k)%3];g.beginPath();g.arc(x+14+(k%3)*18,y+16+Math.floor(k/3)*28,7,0,7);g.fill();}}},'mod-tile-face');}
  function menuTex(){return canvas(512,256,(g,w,h)=>{g.fillStyle='#16201a';g.fillRect(0,0,w,h);g.fillStyle='rgba(220,220,210,.06)';for(let i=0;i<6;i++)g.fillRect(rand()*w,rand()*h,120,20);
    for(let i=0;i<6;i++){const x=20+(i%3)*165,y=20+Math.floor(i/3)*118;g.strokeStyle='rgba(235,230,215,.8)';g.lineWidth=3;g.beginPath();g.ellipse(x+45,y+55,38,16,0,0,Math.PI);g.stroke();g.beginPath();g.moveTo(x+7,y+55);g.lineTo(x+83,y+55);g.stroke();
     g.strokeStyle=['#e8b040','#e86a3a','#8ad06a'][i%3];for(let k=0;k<3;k++){g.beginPath();g.moveTo(x+25+k*15,y+50);g.quadraticCurveTo(x+30+k*15,y+30,x+22+k*15,y+15);g.stroke();}g.fillStyle='rgba(235,230,215,.85)';for(let k=0;k<3+i%3;k++)g.fillRect(x+100+k*12,y+50,7,7);}},'mod-menu');}
  function lanternString(x0,z0,x1,z1,y,n,mod){const L=Math.hypot(x1-x0,z1-z0),c=cyl(S.black,.008,L,[(x0+x1)/2,y,(z0+z1)/2],4,0,HALF);c.rotation.y=-Math.atan2(z1-z0,x1-x0);const pm=paperOf(mod.id),red=P('lantern-red',{c:'#8a1a14',rough:.7,em:'#2a0604'});
   for(let i=1;i<=n;i++){const f=i/(n+1),x=x0+(x1-x0)*f,z=z0+(z1-z0)*f,m=i%2?pm:red;cyl(S.black,.006,.08,[x,y-.04,z],4);cyl(m,.16,.2,[x,y-.18,z],10);cyl(S.dark,.1,.02,[x,y-.075,z],8);cyl(S.dark,.1,.02,[x,y-.285,z],8);}}
  function wallShrine(x,z,face,mod){const dw=darkWood(),o=face==='e'?1:-1,wx=x,flm=P('candle-flame',{em:'#ffb050',unlit:true});box2(dw,Math.min(wx,wx+o*.14),Math.max(wx,wx+o*.14),1.05,1.07,z-.22,z+.22);box2(dw,Math.min(wx,wx+o*.02),Math.max(wx,wx+o*.02),1.05,1.5,z-.22,z+.22);
   box2(dw,Math.min(wx,wx+o*.17),Math.max(wx,wx+o*.17),1.5,1.53,z-.27,z+.27);box2(P('shrine-red',{c:'#5a1a14',rough:.45}),Math.min(wx+o*.02,wx+o*.12),Math.max(wx+o*.02,wx+o*.12),1.07,1.08,z-.2,z+.2);cyl(P('wax',{c:'#d8ccb0',rough:.6}),.04,.08,[wx+o*.08,1.12,z-.1],6);cyl(flm,.002,.035,[wx+o*.08,1.177,z-.1],5,0,0,.018);
   cyl(S.white,.06,.04,[wx+o*.08,1.1,z+.08],8);plane(P('charm0',{dyn:charmTex(0),rough:.9}),.06,.24,[wx+o*.021,1.3,z+.05],o>0?-HALF:HALF);}
  function lanternDress(mod,t,hd,Ch,j,open){
   if(j){lanternString(-.85,0,.85,0,Ch-.5,3,mod);lanternString(0,-.85,0,.85,Ch-.55,2,mod);return;}
   for(let k=0;k<t.d;k++){const z=-hd+1+k*2;lanternString(-.86,z-.75,.86,z+.25,Ch-.5,3,mod);}
   const bn=k=>P('banner'+k,{dyn:bannerTex(k),rough:.95});plane(bn(0),.34,1,[-.885,1.75,1.6],-HALF);plane(bn(1),.34,1,[.885,1.75,.4],HALF);if(t.d>=3)plane(bn(2),.34,1,[-.885,1.75,-.4],-HALF);
   for(const [x,y] of [[-.885,2.27],[.885,2.27]])for(const z of [1.6,.4,-.4])box2(darkWood(),x-.012,x+.012,y,y+.03,z-.2,z+.2);wallShrine(.9,-1,'w',mod);if(t.d>=3)wallShrine(-.9,2,'e',mod);}
  Object.assign(BUILD,{
   'mahjong'(mod,t){const lamp=lampOf(mod.id),dw=darkWood(),Ch=t.ceil,felt=P('felt',{c:'#2a5a3a',dyn:TX.felt(),tile:1.8,rough:.95}),tw=P('mj-wall',{c:'#ffffff',dyn:tilesTex(),tile:1,rough:.35}),tf=P('mj-face',{c:'#ffffff',dyn:faceTex(),tile:1,rough:.35});
    vaultOver(3,3,2.4,.6,[-2,0,2]);for(const x of [-2.82,2.82])cyl(pipeM('#5a5e5a'),.14,5.8,[x,2.3,0],10,HALF);
    for(const e of ['w','e']){const x=e==='w'?-2.9:2.9,o=e==='w'?1:-1;box2(dw,Math.min(x,x+o*.06),Math.max(x,x+o*.06),0,1.1,-2.9,2.9);box2(dw,Math.min(x,x+o*.09),Math.max(x,x+o*.09),1.1,1.15,-2.9,2.9);}
    // three square game tables with walls of tiles, a few tiles face up, dishes of chips; four stools each; a low shade over each (the room's light)
    const table=(x0,x1,z0,z1)=>{const xc=(x0+x1)/2,zc=(z0+z1)/2,hs=(x1-x0)/2;box2(dw,x0,x1,.72,.76,z0,z1);box2(felt,x0+.06,x1-.06,.76,.765,z0+.06,z1-.06);for(const sx of [-1,1])for(const sz of [-1,1])box2(dw,xc+sx*(hs-.08)-.03,xc+sx*(hs-.08)+.03,0,.72,zc+sz*(hs-.08)-.03,zc+sz*(hs-.08)+.03);
     for(const s2 of [-1,1]){box2(tw,xc-.3,xc+.3,.765,.795,zc+s2*.32-.02,zc+s2*.32+.02);box2(tw,xc+s2*.32-.02,xc+s2*.32+.02,.765,.795,zc-.3,zc+.3);}for(let i=0;i<5;i++)plane(tf,.06,.08,[xc-.15+i*.07,.767,zc-.05+(i%2)*.06],rand()*.3,false,HALF,new B.Vector4((i%4)*.25,.75,(i%4)*.25+.25,1));
     cyl(S.white,.18,.03,[xc+.18,.78,zc+.18],12);for(let i=0;i<5;i++)cyl(P('chip'+(i%5),{c:['#8a1a1a','#1a1a1a','#d8d4c8','#1a5a3a','#2a3a7a'][i%5],rough:.4}),.04,.01,[xc+.15+(i%2)*.05,.8+i*.006,zc+.16],8);
const sh=P('shade-green',{c:'#1e3a2a',rough:.45,metal:.3});cyl(S.black,.01,Ch-2.1,[xc,2.1+(Ch-2.1)/2,zc],6);cyl(sh,.6,.18,[xc,2.0,zc],14,0,0,.16);cyl(lamp,.52,.01,[xc,1.905,zc],14);};
    table(-2.5,-1.3,-2.4,-1.2);table(-2.5,-1.3,1,2.2);table(1.2,2.4,-.6,.6);for(const st of t.stools||[])stool(st.x,st.z,.48);   // the stools (modules.js MJ_STOOLS: the ones people sit on stand a little further out)
    // the cashier nook (north-east): an L counter with a hatch, a register, a calculator, the ledger; shelves behind; a red lantern
    box2(dw,1.6,1.7,0,1.05,1.6,2.9);box2(dw,1.6,2.9,0,1.05,1.6,1.7);box2(lacquer(),1.55,2.9,1.05,1.09,1.55,1.72);box2(lacquer(),1.55,1.72,1.05,1.09,1.55,2.9);box2(S.dark,1.85,2.2,1.09,1.25,2.2,2.45);box2(S.ledG,1.85,1.86,1.2,1.22,2.25,2.4);box2(S.plastic,1.75,1.95,1.09,1.11,1.8,1.95);box2(P('ledger',{c:'#3a1a14',rough:.7}),2.2,2.5,1.09,1.12,1.75,1.95);
    box2(dw,2.6,2.9,1.3,1.33,1.8,2.85);for(let i=0;i<4;i++)cyl(P('tin'+(i%2),{c:['#5a4a2a','#2a3a3a'][i%2],rough:.4,metal:.6}),.1,.14,[2.75,1.4,1.9+i*.24],10);cyl(P('lantern-red',{c:'#8a1a14',rough:.7,em:'#2a0604'}),.26,.3,[2.25,2.1,2.25],12);
    // a shelf of thermos flasks and tea tins (south-east), the curtain inside the front door, smoke haze, a clock, stains
    box2(dw,2.2,2.9,0,1.2,-2.9,-2.2);for(let i=0;i<4;i++)cyl(P('flask'+(i%2),{c:['#8a2a22','#2a5a6a'][i%2],rough:.35,metal:.3}),.11,.32,[2.35+(i%2)*.3,1.36,-2.75+Math.floor(i/2)*.3],10);
    {const nm=clothMat('noren','#1a2a3a',TX.fold('#1e2e44'));box2(dw,-.75,.75,2.24,2.27,-2.78,-2.74);for(const x of [-.47,0,.47])plane(nm,.44,.8,[x,1.84,-2.76],0);}
    for(const y of [1.95,2.3])plane(smokeMat('haze','#c8c0b0',.22),5.6,5.6,[0,y,0],0,false,HALF);cyl(S.white,.32,.04,[0,2.0,2.86],18,HALF);cyl(S.dark,.34,.03,[0,2.0,2.875],18,HALF);decal(stainMat(),1.2,1,.2,1.6);decal(puddleMat(),.8,.6,.4,-2.4);},
   'flophouse'(mod,t){const lamp=lampOf(mod.id),Ch=t.ceil,pm=pipeM('#5a5e5a');
    // pipes and a cable tray overhead, along the room
    for(const x of [-.6,.6])cyl(pm,.14,5.8,[x,Ch-.2,0],10,HALF);cyl(pipeM('#7a3a2a'),.08,5.8,[0,Ch-.35,0],8,HALF);box2(S.steel,-.25,.25,Ch-.5,Ch-.48,-2.9,2.9);
    // four nooks: a cot with a worn blanket and a pillow, a locker, a shelf, a dim bulb; cloth curtains on rails (one drawn open) and between the nooks
    const blanket=[clothMat('blanket0','#5a4a3a',TX.fold('#4a3e30')),clothMat('blanket1','#3a4652',TX.fold('#323c46')),clothMat('blanket2','#5a3030',TX.fold('#4a2a2a'))],cur2=clothMat('curtain-cloth','#a89070',TX.fold('#8a7456')),lk=P('locker',{c:'#4a5a5a',tex:'district-interior/kit_steel_color.jpg',tile:.8,rough:.45,metal:.7});
    M.COT_LAYOUT.forEach((c,k)=>{const {sx,sz,xi,za,zb,zc,cx,width,depth}=c,xw=sx*2.85,hx=width/2,z0=zc-depth/2,z1=zc+depth/2;
     box2(S.steel,cx-hx,cx+hx,.34,.40,z0,z1);for(const x of [cx-hx+.05,cx+hx-.05])for(const z of [z0+.08,z1-.08])box2(S.steel,x-.02,x+.02,0,.34,z-.02,z+.02);box2(P('mattress-w',{c:'#6a6a5e',rough:.9}),cx-hx,cx+hx,.40,.54,z0,z1);
     box2(blanket[k%3],cx-hx,cx+hx,.54,.59,sz>0?z0:zc-.45,sz>0?zc+.45:z1);box2(P('pillow',{c:'#b8b4a4',rough:1}),cx-.36,cx+.36,.54,.65,sz>0?z1-.40:z0+.08,sz>0?z1-.08:z0+.40);
     const lz=zc-sz*.65;box2(lk,cx-.25,cx+.25,.02,.29,lz-.25,lz+.25);box2(S.black,cx-.24,cx+.24,.27,.30,lz-.24,lz+.24);
     box2(darkWood(),Math.min(xw,xw-sx*.25),Math.max(xw,xw-sx*.25),1.3,1.33,za+.3,zb-.3);for(let i=0;i<3;i++)box2(P('stuff'+(i%3),{c:['#6a3a2a','#3a4a5a','#8a8a7a'][i%3],rough:.7}),Math.min(xw,xw-sx*.2),Math.max(xw,xw-sx*.2),1.33,1.43+i*.04,za+.5+i*.4,za+.75+i*.4);
     bulb(sx*2.1,zc,1.95,Ch,lamp);box2(S.steel,xi-.015,xi+.015,2.12,2.15,za,zb);
     const w=zb-za-.05,mesh=plane(cur2,w,2.0,[xi,1.1,zc],sx>0?HALF:-HALF,true),ct={mesh,w,zc,sz,open:c.open,amount:c.open?1:0};(modState[mod.id].curtains??={})[c.curtain]=ct;drawCurtain(ct);
     box2(S.rubber,cx-.1,cx+.1,0,.08,sz>0?za-.1+.2:zb-.25,sz>0?za+.3:zb-.05);});
    for(const sx of [-1,1]){const xi=sx*1.05;box2(S.steel,Math.min(sx*2.9,xi),Math.max(sx*2.9,xi),2.12,2.15,-.015,.015);plane(cur2,1.8,2.0,[sx*1.97,1.1,0],0);}
    // the aisle: a worn runner, a mop bucket, a sign of house rules in pictures, stains
    box2(rug(),-.6,.6,.001,.012,-2.5,2.5);cyl(P('bucket',{c:'#c8a020',rough:.5}),.3,.3,[.7,.15,-2.6],12);decal(stainMat(),1,.8,0,1.2);decal(puddleMat(),.7,.5,-.3,-1.4);graffiti(3,1,.5,-1.5,2.4,-2.885,PI);},
   'food-stall'(mod,t){const lamp=lampOf(mod.id),Ch=t.ceil,ss=P('stainless',{c:'#b8bcbc',tex:'district-interior/kit_steel_color.jpg',nrm:'district-interior/kit_steel_normal.jpg',tile:.8,rough:.3,metal:.85}),dw=darkWood(),flame=P('flame',{em:'#ff6a1a',unlit:true}),wok=P('wok',{c:'#1a1816',rough:.35,metal:.8});
    // the counter: a wood front, a worn steel top, condiments; three stools on the aisle side; an awning over it
    box2(dw,.1,.7,0,.95,-1.5,1.5);box2(ss,.05,.75,.95,1,-1.55,1.55);for(const z of [-.9,0,.9])stool(-.3,z,.7);cyl(S.steel,.1,.14,[.3,1.07,-1.2],10);cyl(P('chilli',{c:'#8a1a0a',rough:.2}),.08,.1,[.3,1.05,-.95],10);cyl(S.steel,.06,.04,[.3,1.02,1.2],10);
    {const aw=P('awning',{c:'#7a2a1e',dyn:TX.weave('#6a2418'),tile:.6,rough:.9});const a=bx(aw,[.9,.03,3.3],[.3,2.25,0],0);a.rotation.z=.25;for(const z of [-1.6,1.6])box2(S.steel,.02,.06,1,2.2,z-.02,z+.02);}
    // the cook's side: the wok and a stock pot on their burners with steam, a hood duct, ladles; the cooler with drinks; the menu board of pictures
    box2(ss,1.3,1.9,0,.86,-1.4,.6);box2(S.black,1.3,1.9,.86,.9,-1.4,.6);torus(flame,.2,.025,[1.6,.91,-.9]);cyl(wok,.14,.12,[1.6,.98,-.9],18,0,0,.46);torus(flame,.2,.025,[1.6,.91,.1]);cyl(ss,.34,.36,[1.6,1.08,.1],16);cyl(P('broth',{c:'#5a3a1a',rough:.15}),.31,.005,[1.6,1.262,.1],16);
    const st=smokeMat('steam');for(const z of [-.9,.1]){plane(st,.6,.9,[1.6,1.6,z],0);plane(st,.6,.9,[1.6,1.6,z],HALF);}box2(ss,1.3,1.9,2.0,2.2,-1.4,.6);box2(ss,1.5,1.8,2.2,Ch,-.6,-.2);for(let i=0;i<3;i++)cyl(S.steel,.02,.4,[1.85,1.55,-1.2+i*.12],6);
    {const cb=P('cooler-body',{c:'#2a2e32',rough:.6,metal:.3}),ci=P('cooler-inside',{c:'#14181b',rough:.9});cb.directIntensity=.4;ci.directIntensity=.3;/* the stall's lamp hangs a metre away: full direct light washed the cooler out to white */box2(cb,1.84,1.9,0,1.8,1,1.9);box2(ci,1.82,1.84,.1,1.7,1.05,1.85);for(const z of [1,1.85])box2(cb,1.3,1.9,0,1.8,z,z+.05);box2(cb,1.3,1.9,1.7,1.8,1,1.9);box2(cb,1.3,1.9,0,.1,1,1.9);for(const y of [.38,.78,1.18])box2(S.dark,1.32,1.82,y,y+.02,1.05,1.85);}box2(P('cooler-glass',{c:'#3a4a52',rough:.08,metal:.1,alpha:.12}),1.28,1.29,.1,1.7,1.05,1.85);/* (20 Nov 2026) a hollow, dark cooler: it was a solid white box behind the glass, a bright white panel over the counter with the cans hidden inside it */box2(S.dark,1.27,1.3,.02,.1,1,1.9);box2(P('fridge-light',{em:'#d8ecff',unlit:true}),1.4,1.85,1.65,1.67,1.1,1.8);for(const y of [.4,.8,1.2])for(let i=0;i<5;i++)cyl(P('can'+(i%3),{c:['#c83a2a','#2a7ac8','#e8c040'][i%3],rough:.3,metal:.6}),.07,.14,[1.45,y+.08,1.1+i*.15],8);
    bx(dw,[.05,.7,1.2],[1.88,1.85,-.4],0);plane(P('menu',{dyn:menuTex(),rough:.9}),1.1,.55,[1.852,1.85,-.4],HALF);
    // paper lanterns over the counter (the stall's light), a crate of vegetables, pipes, a puddle
    for(const z of [-1,0,1])lantern(.4,z,2.0,Ch,lamp,.3);crate(-1.6,1.6,.2,.4);box2(P('greens',{c:'#4a7a3a',rough:.8}),-1.75,-1.45,.4,.48,1.45,1.75);cyl(pipeM('#5a5e5a'),.14,3.8,[-1.82,Ch-.25,0],10,HALF);decal(puddleMat(),.9,.6,-1.2,-1.2);decal(oilMat(),.8,.6,1,-.4);}
  });
  for(const id of ['tunnel','tunnel-short','tunnel-mid','tunnel-junction','tunnel-lantern','tunnel-lantern-junction'])BUILD[id]=tube;
  BUILD['tunnel-chamber']=function(mod,t){const hw=t.w*M.GRID/2,hd=t.d*M.GRID/2,Ch=t.ceil,lamp=lampOf(mod.id),pm=pipeM('#5a5e5a');
   // the sump in the middle (a grated pit, the pump, its riser and a pipe across the ceiling), the valve wheel on a corner riser, pipe runs and a tray round the ceiling
   box2(S.concrete,-.45,.45,0,.12,-.45,.45);box2(P('drain-water',{c:'#0a0e10',rough:.02,metal:.4}),-.38,.38,.121,.125,-.38,.38);cyl(P('pump',{c:'#3a5a7a',rough:.45,metal:.5}),.4,.55,[0,.4,0],14);cyl(S.dark,.3,.3,[0,.8,0],12);cyl(pm,.12,Ch-.95,[0,.95+(Ch-.95)/2,0],10);cyl(pm,.12,hd*2-.2,[0,Ch-.25,0],10,HALF);
   cyl(pipeM('#6a5a4a'),.14,Ch,[1.82,Ch/2,1.82],10);torus(S.red,.3,.03,[1.66,1.2,1.66],HALF,-PI/4);for(const sx of [-1,1])cyl(pipeM('#7a3a2a'),.08,hd*2-.2,[sx*1.84,Ch-.4,0],8,HALF);
   for(const z of [-1,1])caged(0,Ch,z*1.2,false,lamp);decal(puddleMat(),1.2,.9,-1,-.9);decal(puddleMat(),.8,.6,1,.9);graffiti(1,1.4,.5,0,Ch-.35,-hd+.115,PI);};

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
  for(const mod of C.mods){const t=M.TYPES[mod.type],sty=styleOf(mod.type);const node=new B.TransformNode('module-'+mod.id,scene);node.parent=rootN;node.position.set(mod.cx,0,mod.cz);node.rotation.y=mod.rot*HALF;if(NET)node.metadata={chunk:Math.floor(mod.cx/40)+','+Math.floor(mod.cz/40)};
   modState[mod.id]={node,sty,t,mod,lightsOff:false};cur=node;lightsOn[mod.id]=true;
   shell(mod,t,sty);try{(BUILD[mod.type]||(()=>{}))(mod,t,sty);}catch(e){console.warn('[modules] build '+mod.type,e);}
   for(const l of t.lights.slice(0,low?1:2))pointLight(mod.id,[l[0],l[1],l[2]],l[3],l[4]*1.4,l[5]*1.25);
   (mod.items||[]).forEach(it=>{const y=Number.isFinite(it.y)?it.y:0;const k=P('item-'+it.type,{c:it.type==='loot'?'#6a5a2a':it.type==='mission-item'?'#2a4a6a':it.type==='note'?'#d8d4c8':'#4a4a4a',rough:.5,metal:.4});box2(k,it.x-.16,it.x+.16,y,y+.12,it.z-.11,it.z+.11);box2(S.ledA,it.x-.03,it.x+.03,y+.12,y+.125,it.z-.11,it.z-.1);});}
  // ================================================================ the doors (world metres): frame, sliding slab, lamps, access points, the vestibule beyond an exit
  // extra dressing from the caller (def.dress: the tunnel network's alcoves and signs, ncz-underground.js), with the same materials, helpers and merging; `at(modId)` puts new pieces in a module's own frame
  if(typeof def.dress==='function')try{def.dress({B,P,S,STY,VM,box2,bx,cyl,plane,decal,graffiti,crate,stool,bulb,lantern,signTex,stainMat,puddleMat,pipeM,darkWood,lampOf,paperOf,low,hi,at:id=>{cur=modState[id]?modState[id].node:rootN;return cur;}});}catch(e){console.warn('[modules] dress',e);}
  cur=rootN;const doors=[],sound=()=>{try{root.VoidAudio?.event?.('door');}catch{}};
  // what each exit shows beyond its vestibule (door-views.js): the street of that quarter (the tunnels: the stair landing), or the module / apartment / hallway through a connection
  const DV=root.VoidDoorViews,viewCache=DV?DV.cache(B,scene,own):null;
  const viewKey=d=>{if(!DV)return null;try{if(d.leads==='street'){if(def.network)return 'landing';const sd=root.VoidApartments?.door?.(def.door||'');return DV.street(sd?sd.quarter:'avenue');}
   const t=M.TYPES[d.leadsType];if(!t)return null;if(t.legacy)return DV.housing(t.legacy.part==='hall'?'hallx':'apt',t.legacy.style);return t.style==='gang'?'checkpoint':DV.mod(t.style);}catch{return null;}};
  for(const d of C.doors){if(d.seam)continue;   // a seam between two tunnel tubes: open tunnel, no door
   const ax=d.tg[0]!==0,x=d.x,z=d.z,Wd=M.DOOR.w,H=M.DOOR.h,fw=M.DOOR.frame;const sideMod=C.mods.find(m=>m.id===M.parseRef(d.side).mod),otherMod=d.kind==='snap'?C.mods.find(m=>m.id===M.parseRef(d.side===d.a?d.b:d.a).mod):null;
   const both=[sideMod,otherMod].map(m=>m&&m.type),gang=both.some(x=>x&&styleOf(x)==='gang'),teaU=both.includes('tea-under'),teaSide=teaU?(sideMod&&sideMod.type==='tea-under'?-1:1)*(ax?d.n[1]:d.n[0]):0;   // the tea room's side of the door (b across the wall)
   const sty=(sideMod&&sideMod.type==='elevator')||(otherMod&&otherMod.type==='elevator')?'cab':gang?'gang':styleOf(sideMod?sideMod.type:'hall-office');const frame=sty==='cab'?S.steel:S.gun,slabMat=sty==='cab'?S.steel:(STY[sty]||STY.corp).door;
   const B2=(mat,a0,a1,y0,y1,b0,b1,dyn)=>ax?box2(mat,x+a0,x+a1,y0,y1,z+b0,z+b1,dyn):box2(mat,x+b0,x+b1,y0,y1,z+a0,z+a1,dyn);   // a: along the wall, b: across it
   const half=Wd/2;B2(frame,-half,-half+fw,0,H+.1,-.13,.13);B2(frame,half-fw,half,0,H+.1,-.13,.13);B2(frame,-half,half,H,H+.1,-.13,.13);B2(S.steel,-half+fw,half-fw,0,.012,-.12,.12);
   // a bi-parting door: two leaves slide apart into the wall on both sides (they fit a 2 m wall: no leaf ever shows past the module)
   const leaf=(a0,a1)=>{const m=B2(teaU?darkWood():slabMat,a0,a1,0,H,-.025,.025,true),kid=(mat,c0,c1,y0,y1,b0,b1)=>{const w=B2(mat,c0,c1,y0,y1,b0,b1,true);w.parent=m;w.position.subtractInPlace(m.position);return w;},mid=(a0+a1)/2;
    if(gang){kid(S.black,mid-.1,mid+.1,1.52,1.6,-.03,.03);kid(S.rust,mid-.13,mid+.13,1.61,1.69,-.033,.033);for(const y of [.35,1.05,1.95])kid(S.dark,a0+.02,a1-.02,y,y+.05,-.031,.031);}   // a gang door: heavy plate, a sliding eye slot, cross bands
    else if(teaU){const r0=teaSide>0?.026:-.029,r1=teaSide>0?.029:-.026;kid(shoji(),a0+.07,a1-.07,.3,2.0,r0,r1);for(const y of [.3,1.15,2.0])kid(darkWood(),a0+.04,a1-.04,y-.02,y+.02,Math.min(r0,r1)-.003,Math.max(r0,r1)+.003);kid(S.rust,a0,a1,0,H,teaSide>0?-.031:.026,teaSide>0?-.026:.031);}   // the tea room: paper and wood inside, raw steel on the tunnel side
    else if(sty!=='cab'){kid(sty==='corp'||sty==='lobby'?S.frost:S.glass,mid-.06,mid+.06,1.2,1.85,-.027,.027);}
    return m;};
   const lA=leaf(-half+fw,-.004),lB=leaf(.004,half-fw);
   const lamps={};for(const [k,m] of [['open',S.ledG],['locked',S.ledR],['mine',S.ledA]])lamps[k]=B2(m,-.3,.3,H+.11,H+.14,-.14,.14,true);
   const sA=A.slider({mesh:lA,dir:[-d.tg[0],-d.tg[1]],dist:half-fw+.02,lamps,locked:!!d.locked,mine:d.kind!=='snap',sound}),sB=A.slider({mesh:lB,dir:[d.tg[0],d.tg[1]],dist:half-fw+.02,locked:!!d.locked,mine:d.kind!=='snap'});
   const s={id:d.id,rec:d,range:2.2,mesh:lA,get t(){return sA.t;},get locked(){return sA.locked;},get mine(){return sA.mine;},near(v){sA.near(v);sB.near(v);},tick(dt){sA.tick(dt);sB.tick(dt);},force(v){sA.force(v);sB.force(v);},set(o){sA.set(o);sB.set(o);},dispose(){lA.dispose();lB.dispose();}};doors.push(s);
   // the access points (one on each side that is here): a card reader with a screen and a red / green LED
   for(const [ref,pos] of Object.entries(d.ap||{})){const pw=d.side===ref?d:null,n=ref===d.side?d.n:[-d.n[0],-d.n[1]];const px=pos[0],pz=pos[2],o=.03;
    if(ax){box2(S.dark,px-.1,px+.1,1.22,1.52,pz-o*n[1]-.02,pz-o*n[1]+.02);box2(S.apScreen,px-.065,px+.065,1.42,1.49,pz-n[1]*.055-.003,pz-n[1]*.055+.003);}else{box2(S.dark,px-o*n[0]-.02,px-o*n[0]+.02,1.22,1.52,pz-.1,pz+.1);box2(S.apScreen,px-n[0]*.055-.003,px-n[0]*.055+.003,1.42,1.49,pz-.065,pz+.065);}
    const mk=m=>ax?box2(m,px-.015,px+.015,1.28,1.31,pz-n[1]*.06-.005,pz-n[1]*.06+.005,true):box2(m,px-n[0]*.06-.005,px-n[0]*.06+.005,1.28,1.31,pz-.015,pz+.015,true);const r=mk(S.ledR),g=mk(S.ledG);r.isVisible=!!d.locked;g.isVisible=!d.locked;apLeds[ref]={r,g};}
   // beyond an exit: a short dark vestibule (walls, a ceiling, an EXIT sign over the door) so an open door never shows the void
   if(d.leads){const n=d.n,V=(mat,a0,a1,y0,y1,c0,c1)=>ax?box2(mat,x+a0,x+a1,y0,y1,z+n[1]*c0,z+n[1]*c1):box2(mat,x+n[0]*c0,x+n[0]*c1,y0,y1,z+a0,z+a1);
    const vm=P('vest',{c:'#2a2c30',tex:'district-interior/kit_gunmetal_color.jpg',tile:1.2,rough:.6,metal:.4});const V2=(mat,a0,a1,y0,y1,c0,c1)=>{const lo=Math.min(c0,c1),hi2=Math.max(c0,c1);V(mat,a0,a1,y0,y1,lo,hi2);};
    V2(vm,-.75,-.6,0,2.5,.1,1.3);V2(vm,.6,.75,0,2.5,.1,1.3);V2(S.void,-.75,.75,0,2.5,1.27,1.3);{const k=viewKey(d);if(k)plane(viewCache.get(k),1.25,2.5,[x+n[0]*1.25,1.25,z+n[1]*1.25],Math.atan2(n[0],n[1]));}/* the place beyond, in the doorway (door-views.js) */V2(vm,-.75,.75,2.45,2.5,.1,1.3);V2(S.concrete,-.75,.75,-.02,0,.1,1.3);V2(P('vest-lamp',{em:'#ffb070',unlit:true}),-.4,.4,2.43,2.45,.6,.7);
    const sg=P(d.leads==='street'?'exit-street':'exit-door',{dyn:signTex(d.leads==='street'?'EXIT · STREET':'EXIT','#7cf0a0','#08140c',256,64,'bold 34px Arial'),unlit:true});const sp=plane(sg,.42,.11,[x-n[0]*.14,H+.3,z-n[1]*.14],Math.atan2(-n[0],-n[1])+PI);}}
  // the shared collision of each door (walkingLocation.solids): closed unless the door is open
  const doorSolids=new Map((def.solids||[]).filter(s=>s.door).map(s=>[s.door,s]));
  const merged=merge();
  // ---- lights on / off (per module), screens on / off (per module) ----
  function setLights(on,mod){const ids=mod?[mod]:C.mods.map(m=>m.id);for(const id of ids){lightsOn[id]=!!on;const st=modState[id];if(!st)continue;for(const lm of [st.lamp,...(st.extra||[])]){if(!lm)continue;if(!lm.metadata.base)lm.metadata.base=lm.emissiveColor.clone();lm.emissiveColor=on?lm.metadata.base.clone():lm.metadata.base.scale(.04);}
    for(const l of realLights)if(l.metadata.mod===id)l.intensity=on?l.metadata.on:0;}
   const offN=C.mods.filter(m=>lightsOn[m.id]===false).length;if(amb)amb.intensity=MOOD.ai*(1-.62*offN/Math.max(1,C.mods.length));}
  const screenOn={};function setScreen(mod,on){screenOn[mod]=!!on;for(const m of modState[mod]?.screens||[]){if(!m.metadata.tex)m.metadata.tex=m.emissiveTexture;m.emissiveTexture=on?m.metadata.tex:null;m.emissiveColor=on?B.Color3.Black():new B.Color3(.004,.005,.006);}}
  for(const m of C.mods){if(m.lightsOff)setLights(false,m.id);if(m.screenOff)setScreen(m.id,false);else screenOn[m.id]=true;}
  // the network's light pool (NET): a few real lights, moved to the fixtures nearest the player a few times a second (the rest of the tunnel is lit by its emissive lamps)
  const pool=[];if(NET&&anchors.length){const n=low?1:hi?4:3;for(let i=0;i<n;i++){const l=new B.PointLight('net-light-'+i,new B.Vector3(0,-50,0),scene);l.intensity=0;l.range=8;l.metadata={on:0,mod:null,pool:true};own.push(l);pool.push(l);realLights.push(l);}}
  let poolT=1;function placePool(p){if(!pool.length||!p)return;const px=p.x,pz=p.z,best=anchors.map(a=>({a,d:(a.p.x-px)**2+(a.p.z-pz)**2})).filter(o=>lightsOn[o.a.mod]!==false).sort((u,v)=>u.d-v.d).slice(0,pool.length);
   pool.forEach((l,i)=>{const o=best[i];if(!o){l.intensity=0;return;}l.position.copyFrom(o.a.p);l.diffuse=o.a.c;l.specular=o.a.c.scale(.35);l.intensity=o.a.i*1.4;l.range=o.a.r*1.25;l.metadata.mod=o.a.mod;});}
  // ---- tick: doors (and their collision), LED blink ----
  let clock=0,blinkT=0;
  // the people who may walk through a door here: the street pair and the cat, givers made in the editor and the built-in ones (the tea room host), people walking with the
  // player inside a location (npc-escort-indoors.js), and any other code's figures (root.VoidModuleWalkers: a function giving [{x, z}])
  let npcT=0,people=[];
  function walkers(){const out=[],add=q=>{if(q&&Number.isFinite(q.x)&&Number.isFinite(q.z))out.push({x:q.x,z:q.z});};
   try{const sp=root.VoidStreetPair?.live?.();if(sp){add(sp.her);add(sp.cat);}}catch{}try{for(const q of root.VoidMadeNPCs?.live?.()?.people||[])if(q.enabled!==false)add(q);}catch{}
   try{for(const f of root.VoidBabylon?.zone?.escortIndoors?.stats?.()||[])add(f);}catch{}try{for(const f of (typeof root.VoidModuleWalkers==='function'?root.VoidModuleWalkers():[])||[])add(f);}catch{}return out;}
  function drawCurtain(c){c.mesh.scaling.x=1-.8*c.amount;c.mesh.position.z=c.zc+c.sz*c.w*.4*c.amount;}
  function toggleCurtain(mod,id){const c=modState[mod]?.curtains?.[id];if(!c)return null;c.open=!c.open;return c.open;}
  function tick(time,player){const dt=Math.min(.1,Math.max(0,clock?time-clock:0));clock=time;const p=player||(typeof walker!=='undefined'?walker:null);
   for(const st of Object.values(modState))for(const c of Object.values(st.curtains||{})){const target=c.open?1:0;if(c.amount!==target){c.amount+=Math.sign(target-c.amount)*Math.min(Math.abs(target-c.amount),dt*2.5);drawCurtain(c);}}
   if((npcT-=dt)<=0){npcT=.2;people=walkers();}   // NPCs open the doors too (modules.js doorWanted), looked up five times a second
   for(const d of doors){d.near(M.doorWanted(d.rec,p,people,d.range));d.tick(dt);const so=doorSolids.get(d.id);if(so)so.open=d.t>.62;}
   if(pool.length){poolT+=dt;if(poolT>.3){poolT=0;placePool(p);}}
   blinkT+=dt;if(blinkT>.45){blinkT=0;for(const st of Object.values(modState))if(st.blink&&screenOn[st.mod.id]!==false)st.blink.uOffset=st.blink.uOffset?0:.5;}}
  function disposeAll(){disposed=true;for(const d of doors)try{d.dispose?.();}catch{}for(const c of containers)try{c.dispose();}catch{}for(const n of props)try{n.dispose(false,false);}catch{}rootN.dispose(false,true);for(const x of own)try{x.dispose();}catch{}
   scene.clearColor=prev.clear;scene.fogMode=prev.fogMode;scene.fogDensity=prev.fogDensity;scene.fogColor=prev.fogColor;ip.exposure=prev.exposure;ip.contrast=prev.contrast;scene.environmentIntensity=prev.env;
   if(sun&&lp.sun!=null)sun.intensity=lp.sun;if(amb){if(lp.amb!=null)amb.intensity=lp.amb;if(lp.dif)amb.diffuse=lp.dif;if(lp.gnd&&amb.groundColor)amb.groundColor=lp.gnd;}}
  return {area:'module',modular:true,cluster:C.id,tick,dispose:disposeAll,doors,toggleCurtain,lights:setLights,lightsOf:id=>lightsOn[id]!==false,get lightsOn(){return C.mods.every(m=>lightsOn[m.id]!==false);},screen:setScreen,screenOf:id=>screenOn[id]!==false,
   door:id=>doors.find(d=>d.id===id)||null,unlock(id){const d=doors.find(x=>x.id===id);if(d){d.set({locked:false});for(const ref of [d.rec.a,d.rec.b])if(apLeds[ref]){apLeds[ref].r.isVisible=false;apLeds[ref].g.isVisible=true;}}},
   accessPoint(ap,st){const ref=String(ap||'').split('/').pop(),l=apLeds[ref];if(l){l.r.isVisible=st!=='open';l.g.isVisible=st==='open';}},
   prepare:()=>Promise.race([Promise.allSettled(late),new Promise(r=>setTimeout(r,8000))]),stats:()=>({merged,doors:doors.length,lights:realLights.length,anchors:anchors.length,meshes:rootN.getChildMeshes().length+own.filter(x=>x.getClassName&&x.getClassName()==='Mesh').length,props:props.length})};}
 root.VoidModules=Object.assign(root.VoidModules||{},{build});
})(globalThis);
