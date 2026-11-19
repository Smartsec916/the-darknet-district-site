/* MISSION APARTMENTS: the 3D build of the three apartment interiors and their three hallways (browser only; apartments.js has the data and rules, apartment-integration.js
   the doors, the prompts and the walking in and out). docs/development/APARTMENTS.md.
   Art direction (docs/VOID_RUNNER_ART_DIRECTION.md, PERMANENT DIRECTION): dark, lived-in, practical light sources, real materials. The surfaces use the game's own CC0
   PBR texture sets (assets/textures/ncz: ambientCG concrete, metal, brick; assets/textures/district-interior: the kit's paint, tile, steel, gunmetal, glass) and a few
   canvas textures drawn here (floors, screens, posters, the skyline). Props: the repository's own models (assets/models/milked, props, district-props; CC0 / owner
   generated, see assets/models/CREDITS.md) on Medium and High, simple stand-ins on Low.
   Performance: every static piece is merged into one mesh per material (MergeMeshes), so a room is a few dozen draw calls; only the doors, hatches and the lights move.
   One or two real point lights, the rest are emissive fixtures. Everything this file makes is disposed on leaving, and the scene's mood is put back.
   build({scene, parent, quality, def}) -> {tick(time, player), dispose(), lights(on), lightsOn, open(object), toggle(object), doors, stats()}.
   DOORS (the owner, 19 Nov 2026: "automatic sliding doors"): every door here is a pocket door that slides sideways into the wall (0.5 s, eased) when someone allowed
   comes near and slides back about 1.5 s after they have gone; a light on the frame shows green (open / yours), red (locked) or amber (closed, yours). */
(function(root){
 'use strict';
 const base=typeof document!=='undefined'&&document.currentScript?new URL('.',document.currentScript.src):null;
 const url=p=>base?new URL(p,base).href:p;
 const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
 /* A sliding door: mesh (or instance) moved along `dir` by `dist` metres. lamps: {open, locked, mine} meshes shown one at a time (any may be missing).
    want(): true while someone allowed is near. Locked doors never open. */
 function slider({mesh,dir,dist=1.05,lamps={},locked=false,mine=false,hold=1.5,dur=.5,sound=null}){
  const c=mesh.position.clone();let t=0,target=0,lastNear=-1e9,clock=0,sliding=false;const d={mesh,closed:c,dir,dist,locked,mine,get t(){return t;},get open(){return t>.98;},get moving(){return sliding;}};
  function lamp(){const s=t>.02?'open':d.locked?'locked':d.mine?'mine':'idle';for(const [k,m] of Object.entries(lamps))if(m)m.isVisible=k===s||(s==='idle'&&k==='locked'&&!d.mine&&false);}
  d.near=(on)=>{if(on&&!d.locked)lastNear=clock;};
  d.force=v=>{target=v?1:0;if(v)lastNear=clock+60;};
  d.tick=dt=>{clock+=dt;const want=!d.locked&&clock-lastNear<hold?1:0;if(want!==target){target=want;if(sound&&want)try{sound();}catch{}}
   if(t===target)return;sliding=true;t=Math.max(0,Math.min(1,t+(target>t?1:-1)*dt/dur));if(t===target)sliding=false;const k=ease(t)*dist;mesh.position.set(c.x+dir[0]*k,c.y,c.z+dir[1]*k);lamp();};
  d.set=(o)=>{Object.assign(d,o);lamp();};lamp();return d;}

 function build({scene,parent,quality,def}){
  const B=root.BABYLON,A=root.VoidApartments,style=def.style||'normal',hall=def.part==='hall',low=quality==='low',hi=quality==='high'||quality==='ultra';
  const own=[],late=[],containers=[],node=new B.TransformNode('apartment-'+def.part+'-'+style,scene);node.parent=parent;node.position.set(A.ORIGIN[0],0,A.ORIGIN[1]);let disposed=false;
  // ---- the scene's mood: an interior at night. Put back on dispose. ----
  const ip=scene.imageProcessingConfiguration,prev={clear:scene.clearColor.clone(),fogMode:scene.fogMode,fogDensity:scene.fogDensity,fogColor:scene.fogColor.clone(),exposure:ip.exposure,contrast:ip.contrast,env:scene.environmentIntensity};
  const sun=scene.getLightByName('sun'),amb=scene.getLightByName('ambient'),lp={sun:sun?.intensity,amb:amb?.intensity,dif:amb?.diffuse?.clone(),gnd:amb?.groundColor?.clone()};
  const G=A.geo(style);
  const MOOD={'container-rundown':{amb:'#8a9488',gnd:'#2a2218',ai:.85,exp:1.3,env:.28,clear:[.012,.013,.012]},'container-regular':{amb:'#a8a8a6',gnd:'#2c2824',ai:.95,exp:1.3,env:.38,clear:[.012,.012,.015]},rundown:{amb:'#8a9a90',gnd:'#2a2620',ai:.85,exp:1.3,env:.3,clear:[.012,.014,.013]},normal:{amb:'#aaa4a0',gnd:'#2e2824',ai:.95,exp:1.3,env:.4,clear:[.012,.012,.016]},luxury:{amb:'#8a96b8',gnd:'#2a2218',ai:.85,exp:1.35,env:.5,clear:[.01,.012,.02]}}[style];
  scene.clearColor=new B.Color4(...MOOD.clear,1);scene.fogMode=B.Scene.FOGMODE_EXP2;scene.fogDensity=.012;scene.fogColor=new B.Color3(...MOOD.clear);ip.exposure=MOOD.exp;ip.contrast=1.15;scene.environmentIntensity=MOOD.env;
  if(sun)sun.intensity=0;if(amb){amb.intensity=MOOD.ai;amb.diffuse=B.Color3.FromHexString(MOOD.amb);if(amb.groundColor)amb.groundColor=B.Color3.FromHexString(MOOD.gnd);}
  let seed=({rundown:7,normal:31,luxury:97,'container-rundown':53,'container-regular':71}[style]||11)+(hall?500:0);const rand=()=>((seed=seed*16807%2147483647)-1)/2147483646;
  // ---- materials ----
  const texCache=new Map(),T=(file,s=1)=>{const k=file+s;if(texCache.has(k))return texCache.get(k);const t=new B.Texture(url('assets/textures/'+file),scene,false,true);t.wrapU=t.wrapV=B.Texture.WRAP_ADDRESSMODE;own.push(t);texCache.set(k,t);return t;};
  const mats=new Map(),parts=new Map();
  function P(key,{c='#808080',tex=null,nrm=null,tile=2,rough=.8,metal=0,em=null,alpha=1,dyn=null,emTex=false,unlit=false}={}){if(mats.has(key))return mats.get(key);
   let m;if(unlit){m=new B.StandardMaterial('apt-'+key,scene);m.diffuseColor=B.Color3.Black();m.specularColor=B.Color3.Black();m.disableLighting=true;if(dyn){m.emissiveTexture=dyn;m.emissiveColor=B.Color3.Black();}else m.emissiveColor=B.Color3.FromHexString(em||c);if(alpha<1){m.alpha=alpha;}m.backFaceCulling=false;}
   else{m=new B.PBRMaterial('apt-'+key,scene);m.albedoColor=B.Color3.FromHexString(c);m.roughness=rough;m.metallic=metal;m.usePhysicalLightFalloff=false;m.environmentIntensity=.6;m.directIntensity=1.2;
    if(tex)m.albedoTexture=T(tex);if(dyn)m.albedoTexture=dyn;if(nrm&&!low){m.bumpTexture=T(nrm);m.bumpTexture.level=.8;}if(em)m.emissiveColor=B.Color3.FromHexString(em);if(emTex&&m.albedoTexture){m.emissiveTexture=m.albedoTexture;}
    if(alpha<1){m.alpha=alpha;m.transparencyMode=2;}m.maxSimultaneousLights=6;}
   m.metadata={tile};own.push(m);mats.set(key,m);return m;}
  const canvas=(w,h,draw,name='apt-tex')=>{const t=new B.DynamicTexture(name,{width:w,height:h},scene,true);own.push(t);draw(t.getContext(),w,h);t.update();t.wrapU=t.wrapV=B.Texture.WRAP_ADDRESSMODE;return t;};
  // geometry: static pieces are collected per material and merged at the end
  const add=(m,mat,dynamic)=>{m.material=mat;m.isPickable=false;if(dynamic){m.parent=node;return m;}if(!parts.has(mat))parts.set(mat,[]);parts.get(mat).push(m);return m;};
  function bx(mat,[w,h,d],[x,y,z],ry=0,dynamic=false){const t=(mat.metadata&&mat.metadata.tile)||1,fu=[[w,h],[w,h],[d,h],[d,h],[w,d],[w,d]].map(([a,b])=>new B.Vector4(0,0,Math.max(.05,a/t),Math.max(.05,b/t)));
   const m=B.MeshBuilder.CreateBox('apt-box',{width:w,height:h,depth:d,faceUV:fu,wrap:true},scene);m.position.set(x,y,z);m.rotation.y=ry;return add(m,mat,dynamic);}
  const box2=(mat,x0,x1,y0,y1,z0,z1,dyn)=>bx(mat,[x1-x0,y1-y0,z1-z0],[(x0+x1)/2,(y0+y1)/2,(z0+z1)/2],0,dyn);
  function cyl(mat,d,h,[x,y,z],tess=12,rx=0,rz=0,top=null){const m=B.MeshBuilder.CreateCylinder('apt-cyl',{diameterBottom:d,diameterTop:top??d,height:h,tessellation:tess},scene);m.position.set(x,y,z);m.rotation.x=rx;m.rotation.z=rz;return add(m,mat);}
  function plane(mat,w,h,[x,y,z],ry=0,dynamic=false,rx=0){const m=B.MeshBuilder.CreatePlane('apt-plane',{width:w,height:h},scene);m.position.set(x,y,z);m.rotation.y=ry;m.rotation.x=rx;return add(m,mat,dynamic);}
  function merge(){let n=0;for(const [mat,list] of parts){if(!list.length)continue;const mm=list.length>1?B.Mesh.MergeMeshes(list,true,true,undefined,false,false):list[0];if(!mm)continue;mm.name='apt-merged-'+mat.name;mm.material=mat;mm.parent=node;mm.isPickable=false;mm.freezeWorldMatrix();n++;}parts.clear();return n;}
  // ---- textures drawn here ----
  const grime=(g,w,h,k=1)=>{for(let i=0;i<60*k;i++){const x=rand()*w,y=rand()*h,r=4+rand()*40;const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(10,8,4,'+(.05+rand()*.12)*k+')');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);}
   for(let i=0;i<10*k;i++){const x=rand()*w,gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'rgba(20,14,6,'+(.12*k)+')');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(x,0,1+rand()*4,h*(.3+rand()*.7));}};
  const planks=(base,dark,gap,k)=>canvas(512,512,(g,w,h)=>{g.fillStyle=base;g.fillRect(0,0,w,h);const rows=8,rh=h/rows;for(let r=0;r<rows;r++){let x=-rand()*200;while(x<w){const len=140+rand()*200,v=rand();g.fillStyle='rgba('+(v<.5?'0,0,0,':'255,255,255,')+(.03+rand()*.06)+')';g.fillRect(x,r*rh,len,rh);
    for(let i=0;i<14;i++){g.fillStyle=dark;g.globalAlpha=.08+rand()*.08;g.fillRect(x,r*rh+rand()*rh,len,1);}g.globalAlpha=1;g.fillStyle=gap;g.fillRect(x,r*rh,2,rh);x+=len;}g.fillStyle=gap;g.fillRect(0,r*rh,w,2);}grime(g,w,h,k);});
  const plaster=base=>canvas(256,256,(g,w,h)=>{g.fillStyle=base;g.fillRect(0,0,w,h);for(let i=0;i<3000;i++){const v=rand();g.fillStyle='rgba('+(v<.5?'0,0,0,':'255,255,255,')+(.02+rand()*.04)+')';g.fillRect(rand()*w,rand()*h,1+rand()*3,1+rand()*3);}grime(g,w,h,.25);});
  // patched insulation foam: yellow-brown slabs, taped seams, holes
  const insulation=base=>canvas(256,256,(g,w,h)=>{g.fillStyle=base;g.fillRect(0,0,w,h);for(let i=0;i<5000;i++){const v=rand();g.fillStyle='rgba('+(v<.5?'40,30,10,':'230,210,150,')+(.04+rand()*.08)+')';g.fillRect(rand()*w,rand()*h,2,2);}
   g.strokeStyle='rgba(150,150,140,.8)';g.lineWidth=9;for(let i=0;i<3;i++){g.beginPath();const y=rand()*h;g.moveTo(0,y);g.lineTo(w,y+(rand()-.5)*20);g.stroke();}for(let i=0;i<4;i++){g.fillStyle='rgba(30,20,10,.7)';g.beginPath();g.ellipse(rand()*w,rand()*h,6+rand()*18,4+rand()*10,rand()*3,0,7);g.fill();}grime(g,w,h,1.2);});
  const marble=(base,vein)=>canvas(512,512,(g,w,h)=>{g.fillStyle=base;g.fillRect(0,0,w,h);for(let i=0;i<26;i++){g.strokeStyle=vein;g.globalAlpha=.06+rand()*.16;g.lineWidth=.6+rand()*2.2;g.beginPath();let x=rand()*w,y=rand()*h;g.moveTo(x,y);for(let k=0;k<9;k++){x+=(rand()-.5)*120;y+=(rand()-.2)*90;g.lineTo(x,y);}g.stroke();}g.globalAlpha=1;
    g.strokeStyle='rgba(0,0,0,.55)';g.lineWidth=2;for(let i=0;i<=2;i++){g.beginPath();g.moveTo(0,i*256);g.lineTo(w,i*256);g.stroke();g.beginPath();g.moveTo(i*256,0);g.lineTo(i*256,h);g.stroke();}});
  const numberTex=(nums,lit)=>canvas(2048,128,(g,w,h)=>{g.fillStyle='#0b0b0d';g.fillRect(0,0,w,h);const cw=w/nums.length;nums.forEach((n,i)=>{g.fillStyle=style==='luxury'?'#c9a46a':style==='rundown'?'#b9b2a0':'#e9edf2';g.font='bold 66px '+(style==='luxury'?'Georgia,serif':'monospace');g.textAlign='center';g.textBaseline='middle';g.fillText(String(n),i*cw+cw/2,h/2+4);if(lit&&lit[i]){g.strokeStyle='#ffb347';g.lineWidth=3;g.strokeRect(i*cw+6,6,cw-12,h-12);}});},'apt-numbers');
  function skyline(){return canvas(1024,512,(g,w,h)=>{const sky=g.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#03050a');sky.addColorStop(.55,'#0c1222');sky.addColorStop(1,'#26182c');g.fillStyle=sky;g.fillRect(0,0,w,h);
    for(let layer=0;layer<3;layer++){const shade=[18,12,7][layer],y0=[.35,.45,.58][layer]*h;let x=0;while(x<w){const bw=30+rand()*90,bh=y0+rand()*h*.3;g.fillStyle='rgb('+shade+','+(shade+3)+','+(shade+10)+')';g.fillRect(x,h-bh,bw,bh);
      for(let yy=h-bh+6;yy<h;yy+=7)for(let xx=x+4;xx<x+bw-4;xx+=6)if(rand()<[.08,.14,.22][layer]){g.fillStyle=rand()<.7?'rgba(255,190,120,'+(.3+rand()*.5)+')':'rgba(120,210,255,'+(.3+rand()*.5)+')';g.fillRect(xx,yy,3,3);}
      if(rand()<.15){g.fillStyle=['#ff3fb4','#38e8ff','#ffb347'][Math.floor(rand()*3)];g.globalAlpha=.7;g.fillRect(x+bw*.2,h-bh+10,bw*.6,5);g.globalAlpha=1;}x+=bw+rand()*8;}}
    const haze=g.createLinearGradient(0,h*.5,0,h);haze.addColorStop(0,'rgba(80,40,90,0)');haze.addColorStop(1,'rgba(90,50,100,.35)');g.fillStyle=haze;g.fillRect(0,0,w,h);
    for(let i=0;i<40;i++){g.fillStyle='rgba(255,60,60,'+(.4+rand()*.5)+')';g.fillRect(rand()*w,h*(.2+rand()*.4),2,2);}},'apt-skyline');}
  function screenTex(kind){return canvas(512,320,(g,w,h)=>{const bg={rundown:'#020a04',normal:'#04101c',luxury:'#06060c'}[style];g.fillStyle=bg;g.fillRect(0,0,w,h);const fg={rundown:'#59ff8a',normal:'#7fd4ff',luxury:'#e8c890'}[style];g.fillStyle=fg;
    if(kind==='pc'){g.font='bold 22px monospace';g.fillText(style==='luxury'?'AURUM // HOME NODE':style==='normal'?'HOMEOS 9 · TERMINAL':'> bootleg_os v0.3',20,40);g.font='16px monospace';
     const L=style==='rundown'?['> mail: 0 new (relay offline)','> wallet: 12 cr','> net: borrowed signal 2/5','> _']:style==='normal'?['MESSAGES  3','RENT DUE  4 days','NETWORK   TESSALY-WIDE','LOCKED · PRESS E']:['SECURE SESSION','PORTFOLIO  +2.4%','CONCIERGE  ONLINE','LOCKED · BIOMETRIC'];
     L.forEach((t,i)=>g.fillText(t,20,90+i*36));g.strokeStyle=fg;g.globalAlpha=.25;for(let y=0;y<h;y+=3){g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke();}g.globalAlpha=1;}
    else{g.font='bold 40px monospace';g.textAlign='center';g.fillText(kind,w/2,h/2+14);}},'apt-screen');}
  function poster(seedText,hue){return canvas(256,384,(g,w,h)=>{const gr=g.createLinearGradient(0,0,w,h);gr.addColorStop(0,'hsl('+hue+',60%,18%)');gr.addColorStop(1,'hsl('+(hue+60)+',50%,8%)');g.fillStyle=gr;g.fillRect(0,0,w,h);
    for(let i=0;i<6;i++){g.fillStyle='hsla('+(hue+i*30)+',80%,55%,.35)';g.beginPath();g.arc(rand()*w,rand()*h*.7,20+rand()*60,0,7);g.fill();}g.fillStyle='#f2efe8';g.font='bold 30px Arial';g.fillText(seedText,16,h-40);g.font='14px monospace';g.fillText('NEOCHINATOWN · 2077',16,h-16);grime(g,w,h,.6);},'apt-poster');}

  // ---- palette per style ----
  const S={   // one function per style: only the chosen style's materials are made (P caches by name)
   // the Outskirts' containers: corrugated steel (ambientCG CC0 sets, as the yard's own containers); rundown bare and rusty, regular painted and lined with insulated panels
   'container-rundown':()=>({wall:P('wall',{c:'#6e6460',tex:'ncz/corrugated-rust-color.jpg',nrm:'ncz/corrugated-rust-normal.jpg',tile:1.6,rough:.7,metal:.55}),wain:P('wain',{c:'#c9b07a',dyn:insulation('#8f7a4a'),tile:1.2,rough:1}),
    floor:P('floor',{c:'#7a7268',dyn:planks('#3a3226','#151009','#0c0906',1.4),tile:2,rough:.9}),ceil:P('ceil',{c:'#5e5450',tex:'ncz/corrugated-rust-color.jpg',nrm:'ncz/corrugated-rust-normal.jpg',tile:1.4,rough:.7,metal:.5}),
    trim:P('trim',{c:'#3a3028',rough:.6,metal:.6}),door:P('door',{c:'#6a5a4a',tex:'ncz/metal-leaks-color.jpg',nrm:'ncz/metal-leaks-normal.jpg',tile:1.2,rough:.55,metal:.6}),
    lamp:P('lamp',{em:'#ffd9a0',unlit:true}),fabric:P('fabric',{c:'#5d5a4c',tex:'district-interior/kit_canvas_color.jpg',nrm:'district-interior/kit_canvas_normal.jpg',tile:1,rough:1}),wood:P('wood',{c:'#5b4632',rough:.85}),accent:P('accent',{em:'#ff8a2a',unlit:true})}),
   'container-regular':()=>({wall:P('wall',{c:'#cfd2cc',dyn:plaster('#5a6068'),tile:1.2,rough:.7}),wain:P('wain',{c:'#4a6a7a',tex:'ncz/corrugated-blue-color.jpg',nrm:'ncz/corrugated-blue-normal.jpg',tile:1.6,rough:.5,metal:.6}),
    floor:P('floor',{c:'#9a8f80',dyn:planks('#4a4038','#221a14','#140f0b',.3),tile:2.5,rough:.55}),ceil:P('ceil',{c:'#8a9aa2',tex:'ncz/corrugated-blue-color.jpg',nrm:'ncz/corrugated-blue-normal.jpg',tile:1.4,rough:.5,metal:.55}),
    trim:P('trim',{c:'#2a3034',rough:.45,metal:.6}),door:P('door',{c:'#3f4a52',tex:'district-interior/kit_gunmetal_color.jpg',nrm:'district-interior/kit_gunmetal_normal.jpg',tile:1.2,rough:.45,metal:.7}),
    lamp:P('lamp',{em:'#ffe6c4',unlit:true}),fabric:P('fabric',{c:'#6a7a86',tex:'district-interior/kit_canvas_color.jpg',nrm:'district-interior/kit_canvas_normal.jpg',tile:1,rough:1}),wood:P('wood',{c:'#7a5c40',rough:.6}),accent:P('accent',{em:'#38e8ff',unlit:true})}),
   rundown:()=>({wall:P('wall',{c:'#97a093',tex:'ncz/concrete-mold-color.jpg',nrm:'ncz/concrete-mold-normal.jpg',tile:2.4,rough:.95}),wain:P('wain',{c:'#6d6455',tex:'ncz/metal-leaks-color.jpg',nrm:'ncz/metal-leaks-normal.jpg',tile:1.6,rough:.7,metal:.4}),
    floor:P('floor',{c:'#8b8478',dyn:planks('#3b3a35','#141310','#0c0b09',1.6),tile:3,rough:.9}),ceil:P('ceil',{c:'#585b57',tex:'ncz/concrete-old-color.jpg',nrm:'ncz/concrete-old-normal.jpg',tile:2.5,rough:.95}),
    trim:P('trim',{c:'#2d2b27',rough:.7,metal:.3}),door:P('door',{c:'#5a5048',tex:'ncz/metal-leaks-color.jpg',nrm:'ncz/metal-leaks-normal.jpg',tile:1.2,rough:.55,metal:.6}),
    lamp:P('lamp',{em:'#cfe8d8',unlit:true}),fabric:P('fabric',{c:'#5d5a4c',tex:'district-interior/kit_canvas_color.jpg',nrm:'district-interior/kit_canvas_normal.jpg',tile:1,rough:1}),wood:P('wood',{c:'#5b4632',rough:.85}),accent:P('accent',{em:'#ff3fb4',unlit:true})}),
   normal:()=>({wall:P('wall',{c:'#d8d0c4',dyn:plaster('#5e5a55'),tile:2,rough:.85}),wain:P('wain',{c:'#3d4248',tex:'district-interior/kit_steel_color.jpg',nrm:'district-interior/kit_steel_normal.jpg',tile:1.4,rough:.5,metal:.5}),
    floor:P('floor',{c:'#9a8f80',dyn:planks('#5a4c3e','#2a2018','#1a140f',.25),tile:3,rough:.55}),ceil:P('ceil',{c:'#8e8c88',tex:'district-interior/kit_paint_color.jpg',tile:2,rough:.9}),
    trim:P('trim',{c:'#26292d',rough:.5,metal:.5}),door:P('door',{c:'#3a3f45',tex:'district-interior/kit_gunmetal_color.jpg',nrm:'district-interior/kit_gunmetal_normal.jpg',tile:1.2,rough:.45,metal:.7}),
    lamp:P('lamp',{em:'#ffe2b8',unlit:true}),fabric:P('fabric',{c:'#5a6470',tex:'district-interior/kit_canvas_color.jpg',nrm:'district-interior/kit_canvas_normal.jpg',tile:1,rough:1}),wood:P('wood',{c:'#6b5038',rough:.6}),accent:P('accent',{em:'#38e8ff',unlit:true})}),
   luxury:()=>({wall:P('wall',{c:'#8a8680',dyn:marble('#2b2a2c','#cfc6b8'),tile:2.4,rough:.35,metal:.05}),wain:P('wain',{c:'#a07a52',dyn:planks('#3a2618','#120a05','#0a0603',.1),tile:1.6,rough:.4}),
    floor:P('floor',{c:'#9a9690',dyn:marble('#1c1b1d','#8f8679'),tile:2,rough:.18,metal:.1}),ceil:P('ceil',{c:'#3a3836',tex:'district-interior/kit_paint_color.jpg',tile:2,rough:.8}),
    trim:P('trim',{c:'#b08a52',rough:.3,metal:.9}),door:P('door',{c:'#2b2622',dyn:planks('#2d1d12','#0d0805','#070403',.05),tile:1.2,rough:.35}),
    lamp:P('lamp',{em:'#ffd9a0',unlit:true}),fabric:P('fabric',{c:'#4a4240',tex:'district-interior/kit_canvas_color.jpg',nrm:'district-interior/kit_canvas_normal.jpg',tile:1,rough:1}),wood:P('wood',{c:'#3a2618',rough:.45}),accent:P('accent',{em:'#ffb070',unlit:true})})}[style]();
  const metal=P('metal',{c:'#6c7076',tex:'district-interior/kit_steel_color.jpg',nrm:'district-interior/kit_steel_normal.jpg',tile:1,rough:.4,metal:.8}),dark=P('dark',{c:'#141518',rough:.6,metal:.3}),black=P('black',{c:'#060607',rough:.35,metal:.2}),
   white=P('white',{c:'#d8d8d2',rough:.25}),tile=P('tile',{c:style==='luxury'?'#4b4a4e':style==='normal'?'#c9ccc8':'#9a9a88',tex:'district-interior/kit_tile_color.jpg',nrm:'district-interior/kit_tile_normal.jpg',tile:.8,rough:.3}),
   glass=P('glass',{c:'#a8c4d0',rough:.05,metal:.1,alpha:.18}),red=P('red-led',{em:'#ff2a2a',unlit:true}),green=P('green-led',{em:'#39ff9c',unlit:true}),amber=P('amber-led',{em:'#ffb347',unlit:true}),cardboard=P('cardboard',{c:'#5a4430',rough:.95});
  const lamps={open:green,locked:red,mine:amber};
  const doors=[];const sound=()=>{try{root.VoidAudio?.event?.('door');}catch{}};
  // A door in a wall: the frame (merged), the slab (moving), the frame lights (moving visibility). axis: 'x' = the wall runs along x (door faces ±z); 'z' along z.
  function slidingDoor({x,z,axis,face,w=1,h=2.1,slide=1,locked=false,mine=false,frameMat=S.trim,slabMat=S.door,id}){
   const ax=axis==='x',t=.06,fw=.08;
   if(ax){box2(frameMat,x-w/2-fw,x-w/2,0,h+fw,z-.12,z+.12);box2(frameMat,x+w/2,x+w/2+fw,0,h+fw,z-.12,z+.12);box2(frameMat,x-w/2,x+w/2,h,h+fw,z-.12,z+.12);}
   else{box2(frameMat,x-.12,x+.12,0,h+fw,z-w/2-fw,z-w/2);box2(frameMat,x-.12,x+.12,0,h+fw,z+w/2,z+w/2+fw);box2(frameMat,x-.12,x+.12,h,h+fw,z-w/2,z+w/2);}
   const slab=ax?bx(slabMat,[w,h,t],[x,h/2,z],0,true):bx(slabMat,[t,h,w],[x,h/2,z],0,true);
   // a handle-less pull groove and a kick plate, on the slab itself
   const lp={};for(const [k,m] of Object.entries(lamps)){const l=ax?bx(m,[w*.6,.03,.03],[x,h+.04,z+face*.135],0,true):bx(m,[.03,.03,w*.6],[x+face*.135,h+.04,z],0,true);lp[k]=l;}
   const d=slider({mesh:slab,dir:ax?[slide,0]:[0,slide],dist:w+.05,lamps:lp,locked,mine,sound});d.id=id;d.at=[x,z];doors.push(d);return d;}

  // ACCESS POINTS: a small card reader with a screen and a status LED beside each door (red: secured, green: open to this player)
  const apLeds={};
  function accessPanel(x,y,z,face,axis,id,ok){const ax=axis==='x',f=face;const sz=ax?[.2,.3,.05]:[.05,.3,.2];bx(P('ap',{c:'#1d2024',rough:.4,metal:.8}),sz,[x,y,z+(ax?f*.025:0)+0]).position.x+=ax?0:f*.025;
   const sc=P('ap-screen',{em:'#1f6f8a',unlit:true});if(ax){box2(sc,x-.065,x+.065,y+.03,y+.11,z+f*.05,z+f*.055);}else box2(sc,x+f*.05,x+f*.055,y+.03,y+.11,z-.065,z+.065);
   const mk=(m)=>ax?box2(m,x-.015,x+.015,y-.1,y-.07,z+f*.05,z+f*.06,true):box2(m,x+f*.05,x+f*.06,y-.1,y-.07,z-.015,z+.015,true);const r=mk(red),g=mk(green);r.isVisible=!ok;g.isVisible=!!ok;if(id)apLeds[id]={r,g};}
  const C=G.CEIL;
  let lightsOn=true;const realLights=[],fixtureMats=[S.lamp];let flicker=null;
  function pointLight(name,[x,y,z],hex,intensity,range){if(realLights.length>=(low?1:2))return null;const l=new B.PointLight('apt-light-'+name,new B.Vector3(A.ORIGIN[0]+x,y,A.ORIGIN[1]+z),scene);l.diffuse=B.Color3.FromHexString(hex);l.specular=l.diffuse.scale(.4);l.intensity=intensity;l.range=range;l.metadata={on:intensity};own.push(l);realLights.push(l);return l;}
  const interactive={};
  const props=[];
  function prop(file,[x,y,z],ry,h,standIn){if(low||!root.VoidAssets?.loadContainer){standIn?.();return;}
   late.push(root.VoidAssets.loadContainer({src:'assets/models/'+file},scene,null,'apt:'+file).then(c=>{if(disposed){return;}containers.push(c);for(const m of c.materials)if('usePhysicalLightFalloff' in m){m.usePhysicalLightFalloff=false;m.environmentIntensity=.5;m.maxSimultaneousLights=6;}
     const inst=c.instantiateModelsToScene(n=>'apt-'+n,false,{doNotInstantiate:true}),n=new B.TransformNode('apt-prop',scene);n.parent=node;root.VoidAssets.ownInstance?.(inst,n);for(const r0 of inst.rootNodes)r0.parent=n;
     n.position.set(x,0,z);n.rotation.y=ry;n.computeWorldMatrix(true);for(const m of n.getChildMeshes())m.computeWorldMatrix(true);const bb=n.getHierarchyBoundingVectors(true),sc=h/Math.max(.01,bb.max.y-bb.min.y);n.scaling.setAll(sc);n.position.y=y-bb.min.y*sc;
     for(const m of n.getChildMeshes()){m.isPickable=false;m.freezeWorldMatrix?.();}props.push(n);}).catch(()=>{if(disposed)return;try{standIn?.();standInMerge();}catch{}}));}
  let standInLate=[];const standInMerge=()=>{};

  if(hall)(G.container?buildCHall:buildHall)();else (G.container?buildCFlat:buildFlat)();
  const merged=merge();
  if(!hall&&def.lightsOff===true)setLights(false);   // the mission's "lights start: off"
  // ---- lights on / off ----
  function setLights(on){lightsOn=!!on;for(const l of realLights)l.intensity=on?l.metadata.on:0;for(const m of fixtureMats){if(!m.metadata.base)m.metadata.base=m.emissiveColor.clone();m.emissiveColor=on?m.metadata.base.clone():m.metadata.base.scale(.05);}
   if(amb)amb.intensity=on?MOOD.ai:MOOD.ai*.38;}
  let clock=0;
  function tick(time,player){const dt=Math.min(.1,Math.max(0,clock?time-clock:0));clock=time;
   const p=player||(typeof walker!=='undefined'?walker:null);
   for(const d of doors){if(p&&d.auto!==false){const dx=(A.ORIGIN[0]+d.at[0])-p.x,dz=(A.ORIGIN[1]+d.at[1])-p.z;d.near(dx*dx+dz*dz<(d.range||1.7)**2);}d.tick(dt);}
   for(const k of Object.values(interactive))k.tick?.(dt);
   if(flicker&&lightsOn){flicker.t-=dt;if(flicker.t<=0){flicker.on=!flicker.on;flicker.t=flicker.on?.4+rand()*4:.03+rand()*.12;const k=flicker.on?1:.15,md=flicker.mat.metadata;if(!md.base)md.base=flicker.mat.emissiveColor.clone();flicker.mat.emissiveColor=md.base.scale(k);if(flicker.light)flicker.light.intensity=flicker.light.metadata.on*(flicker.on?1:.35);}}}
  function disposeAll(){disposed=true;for(const k of Object.values(interactive))try{k.dispose?.();}catch{}for(const d of doors)d.mesh?.dispose?.();for(const c of containers)try{c.dispose();}catch{}for(const n of props)try{n.dispose(false,false);}catch{}node.dispose(false,true);for(const x of own)try{x.dispose();}catch{}
   scene.clearColor=prev.clear;scene.fogMode=prev.fogMode;scene.fogDensity=prev.fogDensity;scene.fogColor=prev.fogColor;ip.exposure=prev.exposure;ip.contrast=prev.contrast;scene.environmentIntensity=prev.env;
   if(sun&&lp.sun!=null)sun.intensity=lp.sun;if(amb){if(lp.amb!=null)amb.intensity=lp.amb;if(lp.dif)amb.diffuse=lp.dif;if(lp.gnd&&amb.groundColor)amb.groundColor=lp.gnd;}}
  // interactions: toggle an object (fridge, closet, panel): returns the new state
  function toggle(obj){const k=interactive[obj];if(!k)return null;return k.toggle();}
  return {area:hall?'apartment-hall':'apartment',style,part:def.part,tick,dispose:disposeAll,lights:setLights,get lightsOn(){return lightsOn;},toggle,interactive,doors,accessPoint(id,st){const l=apLeds[id];if(l){l.r.isVisible=st!=='open';l.g.isVisible=st==='open';}},
   prepare:()=>Promise.race([Promise.allSettled(late),new Promise(r=>setTimeout(r,6000))]),stats:()=>({merged,doors:doors.length,lights:realLights.length,meshes:node.getChildMeshes().length,props:props.length})};

  // ================================================================ THE APARTMENT
  function hinge(mesh,pivot,axis='y'){const n=new B.TransformNode('apt-hinge',scene);n.parent=node;n.position.set(...pivot);mesh.parent=n;mesh.position.set(mesh.position.x-pivot[0],mesh.position.y-pivot[1],mesh.position.z-pivot[2]);return n;}
  function swinging(name,hingeNode,openAngle,axis='y',dur=.45){let t=0,target=0;const k={get open(){return target===1;},toggle(){target=target?0:1;return target===1;},set(v){target=v?1:0;},tick(dt){if(t===target)return;t=Math.max(0,Math.min(1,t+(target>t?1:-1)*dt/dur));hingeNode.rotation[axis]=ease(t)*openAngle;}};interactive[name]=k;return k;}
  function buildFlat(){
   const F=A.FURN,[X0,X1]=A.APT.x,[Z0,Z1]=A.APT.z,bath=A.APT.bath,W=.2;
   // floor, ceiling, walls (layered: a skirting, a wainscot or tile band, the wall, a cornice)
   box2(S.floor,X0,X1,-.1,0,Z0,Z1);box2(S.ceil,X0,X1,C,C+.1,Z0,Z1);
   const win={rundown:[-1.4,.2,1.1,2.1],normal:[-2.7,.5,.95,2.25],luxury:[-3.3,1.3,.15,2.65]}[style];   // north window [x0,x1,y0,y1]
   // north wall around the window
   box2(S.wall,X0,win[0],0,C,Z1,Z1+W);box2(S.wall,win[1],X1,0,C,Z1,Z1+W);box2(S.wall,win[0],win[1],0,win[2],Z1,Z1+W);box2(S.wall,win[0],win[1],win[3],C,Z1,Z1+W);
   // south wall with the entry door
   box2(S.wall,X0,-.55,0,C,Z0-W,Z0);box2(S.wall,.55,X1,0,C,Z0-W,Z0);box2(S.wall,-.55,.55,2.15,C,Z0-W,Z0);
   box2(S.wall,X0-W,X0,0,C,Z0,Z1);box2(S.wall,X1,X1+W,0,C,Z0,Z1);
   // skirting and cornice round the main room
   for(const [a,b,c,d] of [[X0,X1,Z0,Z0+.02],[X0,X0+.02,Z0,Z1],[X1-.02,X1,Z0,Z1],[X0,X1,Z1-.02,Z1]]){box2(S.trim,a,b,0,.09,c,d);box2(S.trim,a,b,C-.07,C,c,d);}
   if(style!=='luxury'){box2(S.wain,X0,X0+.03,.09,.95,-1.75,-.05);box2(S.wain,X0,X0+.03,.95,.98,Z0+.1,Z1-.1);}   // a rail at dado height on the west wall (and a panel behind the desk)
   // the bathroom: partitions with tile on the inside, a tiled floor, a sliding door
   const bx0=bath.x[0],bz0=bath.z[0];
   box2(S.wall,bx0-.06,bx0+.06,0,C,bz0,Z1);box2(S.wall,bx0,bath.door[0],0,C,bz0-.06,bz0+.06);box2(S.wall,bath.door[1],X1,0,C,bz0-.06,bz0+.06);box2(S.wall,bath.door[0],bath.door[1],2.15,C,bz0-.06,bz0+.06);
   box2(tile,bx0+.06,X1,.005,.012,bz0+.06,Z1);box2(tile,bx0+.06,bx0+.08,0,1.5,bz0+.06,Z1);box2(tile,bx0+.06,X1,0,1.5,Z1-.02,Z1);box2(tile,X1-.02,X1,0,1.5,bz0+.06,Z1);
   const bathDoor=slidingDoor({x:(bath.door[0]+bath.door[1])/2,z:bz0,axis:'x',face:-1,w:bath.door[1]-bath.door[0],h:2.1,slide:-1,id:'bath'});bathDoor.range=1.5;
   // toilet, sink, shower
   {const [x0,x1,z0,z1]=F.toilet;box2(white,x0+.05,x1,0,.4,z0+.1,z1-.1);cyl(white,.42,.12,[(x0+x1)/2-.02,.42,(z0+z1)/2],16);box2(white,x1-.18,x1,.4,.85,z0+.06,z1-.06);}
   {const [x0,x1,z0,z1]=F.sink;box2(style==='luxury'?black:white,x0,x1,.78,.86,z0,z1);cyl(dark,.06,.25,[x0+.08,.92,(z0+z1)/2],8);box2(dark,x0,x1-.05,.1,.78,z0+.05,z1-.05);
    plane(P('mirror',{c:'#9fb0ba',rough:.02,metal:1}),.62,.8,[bx0+.075,1.55,(z0+z1)/2],-Math.PI/2);box2(S.lamp,bx0+.07,bx0+.1,1.98,2.01,z0+.05,z1-.05);}
   {const [x0,x1,z0,z1]=F.shower;box2(tile,x0,x1,0,.05,z0,z1);plane(glass,1.9,1.95,[x0,1.03,(z0+z1)/2],Math.PI/2);box2(S.trim,x0-.02,x0+.02,0,2.0,z0,z0+.03);cyl(metal,.22,.02,[(x0+x1)/2+.2,2.1,(z0+z1)/2+.2],16);cyl(metal,.025,.5,[X1-.05,1.86,(z0+z1)/2+.2],6,0,Math.PI/2);}
   // the bed (style), a nightstand with a lamp
   {const [x0,x1,z0,z1,h]=F.bed;
    if(style==='rundown'){for(let i=0;i<3;i++)box2(S.wood,x0+.05,x1,i*.06,i*.06+.04,z0+.05+i*0,z1-.05);for(let k=0;k<5;k++)box2(S.wood,x0+.05+k*.42,x0+.12+k*.42,0,.14,z0+.05,z1-.05);
     box2(P('mattress',{c:'#8a8270',tex:'district-interior/kit_canvas_color.jpg',tile:.8,rough:1}),x0+.1,x1-.05,.14,.32,z0+.1,z1-.1);box2(S.fabric,x0+.4,x1-.2,.32,.37,z0+.08,z1-.25);bx(white,[.4,.12,.6],[x1-.3,.4,(z0+z1)/2+.2],.3);}
    else{box2(style==='luxury'?S.wood:S.trim,x0,x1,0,.3,z0,z1);box2(white,x0+.05,x1-.05,.3,h,z0+.05,z1-.05);box2(S.fabric,x0+.05,x1-.55,h,h+.06,z0+.02,z1-.02);box2(style==='luxury'?P('throw',{c:'#5a2a22',rough:1}):P('throw',{c:'#2f3c4a',rough:1}),x0+.25,x0+.75,h+.02,h+.07,z0,z1);
     for(const zz of [z0+.42,z1-.42])bx(white,[.35,.14,.55],[x1-.3,h+.08,zz],0);box2(style==='luxury'?S.wain:S.trim,x1-.06,x1,.3,style==='luxury'?1.35:1.05,z0-.1,z1+.1);
     if(style==='luxury'){box2(S.accent,x1-.08,x1-.06,1.33,1.36,z0-.1,z1+.1);fixtureMats.push(S.accent);}}}
   {const [x0,x1,z0,z1,h]=F.nightstand;box2(style==='rundown'?cardboard:S.wood,x0,x1,0,h,z0,z1);cyl(dark,.12,.04,[(x0+x1)/2,h+.02,(z0+z1)/2],10);cyl(S.lamp,.14,.18,[(x0+x1)/2,h+.16,(z0+z1)/2],10,0,0,.1);}
   // the couch (the owner: "they need a couch too") and the low table in front of it: the same place in all three, each in its style
   {const [x0,x1,z0,z1]=F.couch,[tx0,tx1,tz0,tz1,th]=F.table,L=z1-z0;
    const cm=style==='rundown'?P('couch',{c:'#8a6c52',tex:'district-interior/kit_canvas_color.jpg',tile:.5,rough:1}):style==='normal'?P('couch',{c:'#7c8a96',tex:'district-interior/kit_canvas_color.jpg',tile:.5,rough:1}):P('couch',{c:'#5a3622',rough:.38,metal:.05});
    const seatTop=style==='luxury'?.4:.44,backTop=style==='luxury'?.78:.88;box2(cm,x0,x1,.1,seatTop-.12,z0,z1);box2(cm,x1-.24,x1,.1,backTop,z0,z1);for(const z of [z0,z1-.18])box2(cm,x0,x1,.1,style==='luxury'?.56:.64,z,z+.18);
    for(let i=0;i<2;i++){const za=z0+.18+i*(L-.36)/2,zb=za+(L-.36)/2-.02;bx(cm,[x1-x0-.3,.12,zb-za],[x0+(x1-x0-.3)/2+.02,seatTop-.06,(za+zb)/2],style==='rundown'?(i?.04:-.06):0);bx(cm,[.14,.4,zb-za-.04],[x1-.31,seatTop+.2,(za+zb)/2],0);}
    const legM=style==='normal'?metal:style==='luxury'?S.trim:S.wood;for(const [x,z] of [[x0+.06,z0+.06],[x1-.06,z0+.06],[x0+.06,z1-.06],[x1-.06,z1-.06]])box2(legM,x-.025,x+.025,0,.1,z-.025,z+.025);
    if(style==='rundown'){const stain=P('stain-dark',{c:'#2a1e14',rough:1});box2(stain,x0+.2,x0+.55,seatTop+.001,seatTop+.004,z0+.4,z0+.75);box2(P('patch',{c:'#44506a',tex:'district-interior/kit_canvas_color.jpg',tile:.3,rough:1}),x0+.25,x0+.45,seatTop+.002,seatTop+.006,z1-.7,z1-.45);box2(P('patch2',{c:'#7a3a2a',rough:1}),x1-.2,x1-.17,.5,.68,z0+.6,z0+.8);
     prop('props/crate.glb',[(tx0+tx1)/2,0,(tz0+tz1)/2],.15,.42,()=>box2(cardboard,tx0+.1,tx1-.1,0,.42,tz0+.1,tz1-.1));for(let i=0;i<3;i++)bx(cardboard,[.42,.04,.42],[(tx0+tx1)/2+(rand()-.5)*.1,.44+i*.04,(tz0+tz1)/2],rand());}
    else if(style==='normal'){box2(P('throw',{c:'#2f3c4a',rough:1}),x0+.1,x1-.05,seatTop+.01,seatTop+.04,z1-.55,z1-.2);box2(P('rug',{c:'#3b4652',tex:'district-interior/kit_canvas_color.jpg',tile:.5,rough:1}),-1.2,x1+.1,.002,.012,z0-.3,z1+.3);
     box2(S.wood,tx0,tx1,th-.04,th,tz0,tz1);for(const [x,z] of [[tx0+.05,tz0+.05],[tx1-.05,tz0+.05],[tx0+.05,tz1-.05],[tx1-.05,tz1-.05]])box2(metal,x-.015,x+.015,0,th-.04,z-.015,z+.015);cyl(P('mug',{c:'#d8d0c0',rough:.4}),.09,.1,[(tx0+tx1)/2,th+.05,tz0+.3],10);box2(P('book-0',{c:'#6a2a22',rough:.8}),tx0+.15,tx0+.4,th,th+.03,tz1-.4,tz1-.15);}
    else{box2(P('rug',{c:'#2a2826',tex:'district-interior/kit_canvas_color.jpg',tile:.5,rough:1}),-1.3,x1+.15,.002,.012,z0-.45,z1+.45);box2(black,tx0-.1,tx1+.1,th-.05,th,tz0-.1,tz1+.1);box2(S.trim,tx0,tx1,0,th-.05,tz0+.15,tz1-.15);
     prop('milked/milked-pothos.glb',[(tx0+tx1)/2,th,(tz0+tz1)/2],0,.3);box2(P('throw',{c:'#5a2a22',rough:1}),x0+.1,x1-.25,seatTop+.01,seatTop+.035,z0+.2,z0+.6);}}
   // the closet: carcass, a rail, hanging clothes, boxes on the shelf; two doors that swing
   {const [x0,x1,z0,z1,h]=F.closet,cm=style==='rundown'?S.door:S.trim;box2(cm,x0,x0+.03,0,h,z0,z1);box2(cm,x0,x1,0,.04,z0,z1);box2(cm,x0,x1,h-.04,h,z0,z1);box2(cm,x0,x1,0,h,z0,z0+.03);box2(cm,x0,x1,0,h,z1-.03,z1);box2(cm,x0,x1,1.75,1.78,z0,z1);
    cyl(metal,.025,z1-z0-.1,[(x0+x1)/2,1.62,(z0+z1)/2],6,Math.PI/2);const cols=['#2b2f36','#5a2a22','#3a4a3a','#1a1a1e','#6b6658','#283848'];
    for(let i=0;i<6;i++){const zz=z0+.2+i*.27;bx(P('cloth-'+(i%2),{c:cols[(i%2+(style==='luxury'?2:0))%6],tex:'district-interior/kit_canvas_color.jpg',tile:.6,rough:1}),[.5,.85+rand()*.25,.06],[(x0+x1)/2,1.15,zz],(rand()-.5)*.2);}
    for(let i=0;i<3;i++)box2(cardboard,x0+.06,x0+.5,1.78,1.78+.22+i*.03,z0+.1+i*.55,z0+.55+i*.55);box2(dark,x0+.05,x0+.4,0,.1,z0+.15,z0+.45);box2(dark,x0+.05,x0+.4,0,.1,z0+.5,z0+.8);
    const half=(z1-z0)/2,dm=style==='luxury'?S.wain:S.door,mk=(za,zb,piv,ang)=>{const m=box2(dm,x1-.03,x1,.02,h-.02,za,zb,true);return swinging('closet-'+ang,hinge(m,[x1,0,piv]),ang);};
    const a=mk(z0,z0+half-.005,z0,-1.6),b=mk(z0+half+.005,z1,z1,1.6);interactive.closet={get open(){return a.open;},toggle(){const v=a.toggle();b.set(v);return v;},tick(dt){a.tick(dt);b.tick(dt);}};delete interactive['closet--1.6'];delete interactive['closet-1.6'];
    interactive.closet._a=a;interactive.closet._b=b;}
   // the safe: heavy, with a keypad (red: locked)
   {const [x0,x1,z0,z1,h]=F.safe;box2(P('safe',{c:'#2a2c2e',tex:'district-interior/kit_gunmetal_color.jpg',tile:.5,rough:.35,metal:.85}),x0,x1,0,h,z0,z1);box2(black,x1,x1+.01,.08,h-.08,z0+.05,z1-.05);
    box2(dark,x1+.01,x1+.03,.36,.5,z0+.08,z0+.2);box2(red,x1+.03,x1+.035,.46,.48,z0+.1,z0+.13);cyl(metal,.16,.03,[x1+.025,.3,(z0+z1)/2+.08],12,0,Math.PI/2);
    const led=box2(green,x1+.03,x1+.035,.46,.48,z0+.15,z0+.18,true);led.isVisible=false;let blink=0;interactive.safe={open:false,toggle(){blink=1.2;return false;},tick(dt){if(blink>0){blink-=dt;led.isVisible=false;}}};}
   // the desk and the computer (a monitor facing the room, a keyboard, a tower)
   {const [x0,x1,z0,z1,h]=F.desk;const dm=style==='rundown'?S.wood:style==='luxury'?black:S.trim;box2(dm,x0,x1,h-.04,h,z0,z1);for(const zz of [z0+.03,z1-.06])box2(metal,x0+.05,x1-.05,0,h-.04,zz,zz+.03);
    const scr=P('screen',{dyn:screenTex('pc'),unlit:true});fixtureMats.push;box2(black,x0+.08,x0+.14,h+.02,h+.48,(z0+z1)/2-.33,(z0+z1)/2+.33);plane(scr,.62,.42,[x0+.145,h+.25,(z0+z1)/2],-Math.PI/2);box2(dark,x0+.05,x0+.12,h,h+.05,(z0+z1)/2-.08,(z0+z1)/2+.08);
    box2(dark,x0+.35,x0+.5,h,h+.02,(z0+z1)/2-.24,(z0+z1)/2+.24);box2(black,x0+.05,x0+.5,0,.45,z0+.1,z0+.32);box2(S.accent,x0+.5,x0+.505,.3,.32,z0+.12,z0+.3);
    prop('milked/milked-office-chair.glb',[x1+.4,0,(z0+z1)/2],-Math.PI/2,.95,()=>{box2(dark,x1+.15,x1+.65,.42,.48,(z0+z1)/2-.25,(z0+z1)/2+.25);box2(dark,x1+.6,x1+.66,.48,1,(z0+z1)/2-.25,(z0+z1)/2+.25);});}
   // no kitchen (the owner, 19 Nov 2026): a food and drinks vending machine, in the room's style (rundown: an old scuffed unit; normal: a standard one; luxury: a sleek dispenser)
   {const [x0,x1,z0,z1,h]=F.vending,fx=x1;const body=style==='luxury'?P('vend',{c:'#141418',rough:.25,metal:.8}):style==='normal'?P('vend',{c:'#2c3440',tex:'district-interior/kit_gunmetal_color.jpg',tile:.8,rough:.45,metal:.7}):P('vend',{c:'#5a3a32',tex:'ncz/metal-leaks-color.jpg',nrm:'ncz/metal-leaks-normal.jpg',tile:.8,rough:.6,metal:.5});
    box2(body,x0,x1-.02,0,h,z0,z1);const goods=(root.VoidPodVending&&root.VoidPodVending.products)||[];
    const shelf=P('vend-goods',{dyn:canvas(256,512,(g,w,hh)=>{g.fillStyle='#05070b';g.fillRect(0,0,w,hh);const rows=6,cols=4;for(let r=0;r<rows;r++){g.fillStyle='rgba(120,150,170,.25)';g.fillRect(0,(r+1)*hh/rows-6,w,3);for(let c=0;c<cols;c++){const d=goods[(r*cols+c)%Math.max(1,goods.length)]||[];const col=(d.art&&d.art[0])||['#c03030','#3070c0','#d0a020','#40a050'][(r+c)%4];
       const tall=/bottle|can/.test(d.kind||'can');g.fillStyle=col;const bw=tall?18:34,bh=tall?44:26;g.fillRect(c*w/cols+(w/cols-bw)/2,(r+1)*hh/rows-8-bh,bw,bh);g.fillStyle='rgba(255,255,255,.35)';g.fillRect(c*w/cols+(w/cols-bw)/2+3,(r+1)*hh/rows-8-bh+3,3,bh-6);}}
      const gr=g.createLinearGradient(0,0,w,0);gr.addColorStop(0,'rgba(255,255,255,.08)');gr.addColorStop(.5,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,w,hh);if(style==='rundown'){g.strokeStyle='rgba(220,220,220,.35)';g.beginPath();g.moveTo(40,90);g.lineTo(120,180);g.lineTo(90,260);g.stroke();}},'apt-vend'),unlit:true});
    plane(shelf,.7,1.25,[fx+.005,1.15,z0+.42],-Math.PI/2);fixtureMats.push(shelf);box2(black,fx-.02,fx+.01,.15,.45,z0+.1,z0+.75);   // the window and the pickup tray
    const pad=P('vend-pad',{em:style==='luxury'?'#e8c890':style==='normal'?'#7fd4ff':'#59ff8a',unlit:true});box2(pad,fx-.02,fx+.012,1.3,1.45,z1-.3,z1-.1);box2(dark,fx-.02,fx+.01,.9,1.2,z1-.3,z1-.1);fixtureMats.push(pad);
    const top=P('vend-top',{dyn:canvas(256,64,(g,w,hh)=>{g.fillStyle='#000';g.fillRect(0,0,w,hh);g.fillStyle=style==='luxury'?'#e8c890':style==='normal'?'#7fd4ff':'#ff4fc0';g.font='bold 34px Arial';g.textAlign='center';g.fillText(style==='luxury'?'PANTRY':style==='normal'?'SNACK·DRINK':'24H EATS',w/2,44);},'apt-vend-top'),unlit:true});plane(top,.95,.22,[fx+.005,1.8,(z0+z1)/2],-Math.PI/2);fixtureMats.push(top);
    if(style==='rundown'){box2(P('sticker',{c:'#c8b040',rough:.9}),fx,fx+.004,.6,.75,z1-.25,z1-.12);box2(P('scuff',{c:'#2a1c18',rough:1}),fx,fx+.003,.05,.3,z0+.05,z1-.05);}
    if(style==='luxury'){box2(S.accent,fx-.01,fx+.005,.02,.04,z0,z1);fixtureMats.push(S.accent);}
    // the space either side: a small shelf with a plant (normal, luxury) or stacked boxes (rundown)
    if(style==='rundown'){box2(cardboard,x0+.05,x0+.6,0,.5,.55,1.15);box2(cardboard,x0+.05,x0+.55,.5,.85,.6,1.05);prop('district-props/district-radio.glb',[x0+.3,.85,.85],Math.PI/2,.18);}
    else{box2(S.wood,x0,x0+.4,.95,.98,2.5,3.5);box2(S.wood,x0,x0+.4,1.45,1.48,2.5,3.5);prop('milked/milked-pothos.glb',[x0+.2,1.48,3.0],Math.PI/2,.45,()=>cyl(P('leaf',{c:'#2a5a3a',rough:.9}),.3,.3,[x0+.2,1.63,3],8));
     for(let i=0;i<6;i++)box2(P('book-'+(i%2),{c:['#6a2a22','#22406a'][i%2],rough:.8}),x0+.04,x0+.3,.98,.98+.2+rand()*.05,2.6+i*.1,2.68+i*.1);
     if(style==='normal')prop('milked/milked-lucky-cat.glb',[x0+.2,.98,3.35],Math.PI/2,.2);}}
   // storage in the north-west corner (no refrigerator: the owner, 19 Nov 2026): open shelving in the room's style, with boxes, bags and things people keep
   {const [x0,x1,z0,z1,h]=F.storage,sm=style==='luxury'?S.wood:style==='normal'?S.trim:P('shelf-rust',{c:'#5a4a3a',tex:'ncz/metal-leaks-color.jpg',tile:.8,rough:.6,metal:.5});
    box2(sm,x0,x0+.03,0,h,z0,z1);for(const z of [z0,z1-.03])box2(sm,x0,x1,0,h,z,z+.03);for(const y of [.05,.5,.95,1.4,h-.03])box2(sm,x0,x1,y,y+.03,z0,z1);
    const things=style==='luxury'?['#c9a46a','#2a2a30','#e8e0d0','#5a2a22']:style==='normal'?['#3a5a7a','#d8d0c0','#6a2a22','#4a6a4a']:['#7a5c3a','#3a3a30','#5a4030','#2a2a2a'];
    for(let r=0;r<4;r++)for(let k=0;k<3;k++){if(rand()<.25)continue;const y=.08+r*.45,zz=z0+.12+k*.38,hh=.15+rand()*.22,c=things[(r+k)%4];
     if(style!=='luxury'&&rand()<.45)box2(cardboard,x0+.05,x1-.04,y,y+hh,zz,zz+.32);else if(rand()<.5)cyl(P('jar',{c:things[0],rough:.4,metal:.2}),.12,hh,[(x0+x1)/2,y+hh/2,zz+.15],10);else box2(P('bin',{c:things[1],rough:.6}),x0+.06,x1-.06,y,y+hh*.8,zz,zz+.3);}
    if(style==='rundown'){const m=B.MeshBuilder.CreateSphere('bag',{diameter:.5,segments:6},scene);m.scaling.y=.7;m.position.set(x1+.1,.18,z0+.3);add(m,P('bag',{c:'#101012',rough:.25,metal:.1}));}}
   // the utility panel (south wall): a steel box with a hinged hatch over breakers, a junction block and a data port
   {const {x,y}=A.PANEL,zw=Z0;box2(metal,x-.27,x+.27,y-.37,y+.37,zw,zw+.05);box2(black,x-.24,x+.24,y-.34,y+.34,zw+.05,zw+.055);for(let i=0;i<6;i++)box2(i%3===1?red:dark,x-.2+i*.07,x-.15+i*.07,y+.05,y+.2,zw+.055,zw+.08);
    box2(P('copper',{c:'#b06a3a',rough:.4,metal:.9}),x-.2,x+.2,y-.25,y-.18,zw+.055,zw+.07);box2(green,x+.15,x+.18,y-.12,y-.09,zw+.055,zw+.065);cyl(dark,.06,1.4,[x+.18,y+1.05,zw+.04],6);
    const hm=box2(style==='rundown'?S.door:metal,x-.26,x+.26,y-.36,y+.36,zw+.06,zw+.085,true);box2(black,x-.06,x+.06,y+.25,y+.3,zw+.085,zw+.09);const hn=hinge(hm,[x-.26,0,zw+.06]);swinging('panel',hn,1.9);}
   // the light switch, the entry door (it slides into the wall: the way out)
   {const {x,y}=A.SWITCH;box2(style==='luxury'?S.trim:white,x-.05,x+.05,y-.07,y+.07,Z0,Z0+.015);box2(amber,x-.01,x+.01,y+.03,y+.05,Z0+.015,Z0+.02);
    const ed=slidingDoor({x:0,z:Z0-.1,axis:'x',face:1,w:1.1,h:2.15,slide:-1,id:'entry'});ed.range=1.3;ed.set({mine:true});accessPanel(-.85,1.38,Z0+.01,1,'x',def.apt?def.apt.id+'/entry':'entry',true);}
   // the window: glass, a frame, the city beyond (luxury: the whole wall)
   {const sk=P('skyline',{dyn:skyline(),unlit:true}),[wx0,wx1,wy0,wy1]=win,wz=Z1+.1;plane(sk,(wx1-wx0)*3.2+6,(wy1-wy0)*2.4+4,[(wx0+wx1)/2,(wy0+wy1)/2+.4,Z1+3.5],0);plane(glass,wx1-wx0,wy1-wy0,[(wx0+wx1)/2,(wy0+wy1)/2,wz],Math.PI);
    for(const xx of [wx0,wx1])box2(S.trim,xx-.04,xx+.04,wy0,wy1,Z1,Z1+.2);for(const yy of [wy0,wy1])box2(S.trim,wx0,wx1,yy-.04,yy+.04,Z1,Z1+.2);box2(S.trim,wx0-.05,wx1+.05,wy0-.06,wy0,Z1-.12,Z1);
    if(style==='luxury'){for(let i=1;i<4;i++){const xx=wx0+i*(wx1-wx0)/4;box2(S.trim,xx-.02,xx+.02,wy0,wy1,Z1+.05,Z1+.15);}}
    if(style==='normal'){for(let i=0;i<9;i++)box2(P('blind',{c:'#a8a49a',rough:.6}),wx0,wx1,wy1-.06-i*.07,wy1-.05-i*.07,Z1-.06,Z1-.04);}
    if(style==='rundown'){for(let i=1;i<6;i++)cyl(metal,.025,wy1-wy0,[wx0+i*(wx1-wx0)/6,(wy0+wy1)/2,Z1-.05],6);for(const yy of [wy0+.3,wy1-.3])cyl(metal,.025,wx1-wx0,[(wx0+wx1)/2,yy,Z1-.05],6,0,Math.PI/2);}}
   // ---- the light fixtures (emissive) and the real lights ----
   if(style==='rundown'){box2(dark,-1.6,.2,C-.06,C,-.1,.1);const tube=P('tube',{em:'#d6f0e0',unlit:true});cyl(tube,.05,1.6,[-.7,C-.09,0],8,0,Math.PI/2);fixtureMats.push(tube);
    const L=pointLight('main',[-.7,2.45,0],'#cfe6d4',2.18,9);flicker={mat:tube,light:L,t:2,on:true};
    // the cheap neon in the window: a pink sign hung inside the glass
    const sign=P('sign',{dyn:canvas(256,96,(g,w,h)=>{g.fillStyle='#000';g.fillRect(0,0,w,h);g.fillStyle='#ff4fc0';g.shadowColor='#ff3fb4';g.shadowBlur=14;g.font='bold 54px Arial';g.textAlign='center';g.fillText('LUCKY',w/2,66);},'apt-sign'),unlit:true});plane(sign,.9,.34,[-.6,1.9,Z1-.12],0);fixtureMats.push(sign);pointLight('neon',[-.6,1.7,Z1-.6],'#ff3fb4',0.8,4.5);
    box2(tube,1.6,2.2,C-.04,C,3.4,3.5);}
   else if(style==='normal'){const pan=P('panel-light',{em:'#ffe6c4',unlit:true});box2(dark,-1.55,-.05,C-.04,C,-.75,.75);box2(pan,-1.5,-.1,C-.05,C-.04,-.7,.7);fixtureMats.push(pan);box2(pan,2.5,3.3,C-.05,C-.04,3.3,3.9);
    pointLight('main',[-.8,2.4,0],'#ffe0b8',2.3,10);pointLight('bath',[2.8,2.3,3.6],'#e8f0ff',1.03,4);}
   else{const cove=P('cove',{em:'#ffcf96',unlit:true});for(const [a,b,c,d] of [[X0+.05,X1-.05,Z0+.06,Z0+.09],[X0+.06,X0+.09,Z0+.05,Z1-.05],[X1-.09,X1-.06,Z0+.05,bath.z[0]-.1]])box2(cove,a,b,C-.18,C-.16,c,d);fixtureMats.push(cove);
    const pend=P('pendant',{em:'#ffd29a',unlit:true});for(const xx of [-2,-1.4,-.8]){cyl(dark,.01,.7,[xx,C-.35,2.9],4);cyl(pend,.12,.14,[xx,C-.76,2.9],12);}fixtureMats.push(pend);
    pointLight('main',[-1.2,2.3,1.2],'#ffd6a8',1.95,10);pointLight('bath',[2.8,2.3,3.6],'#f0f2ff',0.92,4);box2(S.accent,bath.x[0]+.08,bath.x[0]+.1,2.4,2.42,bath.z[0]+.1,Z1-.1);}
   // ---- the advertisement screen across from the couch (rundown, normal): the city's own ad feed (ad-screens.js), switchable ----
   if(A.AD_SCREEN.styles.includes(style))adScreen();
   // ---- the room's character ----
   if(style==='rundown')rundownDecor();else if(style==='normal')normalDecor();else luxuryDecor();
   // placed items (the mission's own: a small case each, with a light band)
   for(const it of def.items||[]){const y=Number.isFinite(it.y)?it.y:0;box2(P('item',{c:'#2b2f35',rough:.4,metal:.6}),it.x-.18,it.x+.18,y,y+.18,it.z-.12,it.z+.12);box2(it.type==='mission-item'?amber:it.type==='loot'?green:P('item-band',{em:'#7fd4ff',unlit:true}),it.x-.185,it.x+.185,y+.11,y+.13,it.z-.125,it.z+.125);}
  }
  function adScreen(){const S0=G.AD_SCREEN,w=S0.w,h=w*1.5,x=S0.x,AS=root.VoidAdScreens,AD=root.VoidAdData,dd=def.door&&A.door(def.door);const old=style==='rundown'||style==='container-rundown';if(S0.wall==='s')return adScreenS(S0,w,h,AS,AD,dd,old);
   // the bezel: rundown an old thick plastic case with a scuffed corner and a taped cable; normal a thin clean metal frame
   if(style==='rundown'){box2(P('bezel-old',{c:'#24221f',rough:.55,metal:.1}),x,x+.09,S0.y-h/2-.07,S0.y+h/2+.07,S0.z-w/2-.07,S0.z+w/2+.07);box2(P('tape',{c:'#9a9078',rough:.9}),x+.09,x+.095,S0.y-h/2-.05,S0.y-h/2+.03,S0.z+.1,S0.z+.2);cyl(black,.012,S0.y-h/2,[x+.04,(S0.y-h/2)/2,S0.z+.15],4);}
   else{box2(S.trim,x,x+.04,S0.y-h/2-.025,S0.y+h/2+.025,S0.z-w/2-.025,S0.z+w/2+.025);}
   const off=P('screen-off',{c:'#050608',rough:.08,metal:.3});const pic=B.MeshBuilder.CreatePlane('apt-adscreen',{width:w,height:h},scene);pic.parent=node;pic.position.set(x+(style==='rundown'?.095:.045),S0.y,S0.z);pic.rotation.y=-Math.PI/2;pic.isPickable=false;   // faces +x, into the room
   let handle=null,feedMat=null,on=def.screenOff!==true,paintT=0,flick=0;
   if(AS&&AD&&AS.street&&dd){const env={B,scene,quality,quarter:dd.quarter,box:()=>({rotation:{},position:{},dispose(){}}),add:(m,mat)=>{feedMat=mat;m.dispose();return m;},dropped:()=>false,
     mat:(k,hex)=>P('ad-'+k,{c:hex}),glowMat:(k,hex)=>P('ad-'+k,{em:hex,unlit:true}),textures:own,owned:own};
    try{handle=AS.street(env);let ok=false;for(const p of [[dd.front[0],6,dd.front[1]],[dd.x,6,dd.z]]){if(handle.wall(w,p,dd.ry)){ok=true;break;}}if(!ok){handle.dispose();handle=null;feedMat=null;}}catch(e){console.info('[apartments] ad screen',e);handle=null;feedMat=null;}}
   if(!feedMat)feedMat=P('ad-fallback',{dyn:poster('NEOCHINATOWN',190),unlit:true});
   const apply=()=>{pic.material=on?feedMat:off;};apply();
   interactive.screen={get open(){return on;},toggle(){on=!on;apply();return on;},tick(dt){if(!on||!handle)return;handle.tick(dt);paintT-=dt;if(paintT<=0){paintT=.2;try{handle.paintAll();}catch{}}
     if(style==='rundown'){flick-=dt;if(flick<=0){flick=pic.visibility<1?.05+Math.random()*.08:2+Math.random()*6;pic.visibility=pic.visibility<1?1:.55;}}},dispose(){try{handle?.dispose();}catch{}}};
   own.push(pic);}
  // the screen on a south wall, facing north into the room (the container apartment): rotation.y = PI turns a plane's front (-z) to +z (CLAUDE.md)
  function adScreenS(S0,w,h,AS,AD,dd,old){const z=S0.z,x=S0.x;
   if(old){box2(P('bezel-old',{c:'#24221f',rough:.55,metal:.1}),x-w/2-.07,x+w/2+.07,S0.y-h/2-.07,S0.y+h/2+.07,z,z+.09);box2(P('tape',{c:'#9a9078',rough:.9}),x+.1,x+.2,S0.y-h/2-.05,S0.y-h/2+.03,z+.09,z+.095);cyl(black,.012,S0.y-h/2,[x+.15,(S0.y-h/2)/2,z+.04],4);}
   else box2(S.trim,x-w/2-.025,x+w/2+.025,S0.y-h/2-.025,S0.y+h/2+.025,z,z+.04);
   const off=P('screen-off',{c:'#050608',rough:.08,metal:.3}),pic=B.MeshBuilder.CreatePlane('apt-adscreen',{width:w,height:h},scene);pic.parent=node;pic.position.set(x,S0.y,z+(old?.095:.045));pic.rotation.y=Math.PI;pic.isPickable=false;
   let handle=null,feedMat=null,on=def.screenOff!==true,paintT=0,flick=0;
   // the feed: the door's own part of town when the ad data has screens there, else the nearest city quarter's (Far South) programme
   if(AS&&AD&&AS.street){const tries=[dd&&[dd.quarter,[dd.front[0],6,dd.front[1]],dd.ry],...A.doorsIn('far-south').slice(0,3).map(f=>['far-south',[f.front[0],6,f.front[1]],f.ry])].filter(Boolean);
    for(const [q,p,ry] of tries){try{const env={B,scene,quality,quarter:q,box:()=>({rotation:{},position:{},dispose(){}}),add:(m,mat)=>{feedMat=mat;m.dispose();return m;},dropped:()=>false,mat:(k,hex)=>P('ad-'+k,{c:hex}),glowMat:(k,hex)=>P('ad-'+k,{em:hex,unlit:true}),textures:own,owned:own};
      const hd=AS.street(env);if(hd.wall(w,p,ry)){handle=hd;break;}hd.dispose();feedMat=null;}catch(e){feedMat=null;}}}
   if(!feedMat)feedMat=P('ad-fallback',{dyn:poster('NEOCHINATOWN',190),unlit:true});
   const apply=()=>{pic.material=on?feedMat:off;};apply();
   interactive.screen={get open(){return on;},toggle(){on=!on;apply();return on;},tick(dt){if(!on||!handle)return;handle.tick(dt);paintT-=dt;if(paintT<=0){paintT=.2;try{handle.paintAll();}catch{}}
     if(old){flick-=dt;if(flick<=0){flick=pic.visibility<1?.05+Math.random()*.08:2+Math.random()*6;pic.visibility=pic.visibility<1?1:.55;}}},dispose(){try{handle?.dispose();}catch{}}};
   own.push(pic);}
  // ================================================================ THE CONTAINER APARTMENT (The Outskirts)
  function corrugate(mat,x0,x1,y0,y1,z0,z1,axis,step=.3){   // vertical ribs on a wall: thin boxes every `step`, merged with the wall's material
   if(axis==='x'){for(let x=x0+step/2;x<x1;x+=step)box2(mat,x-.035,x+.035,y0,y1,z0,z1);}else for(let z=z0+step/2;z<z1;z+=step)box2(mat,x0,x1,y0,y1,z-.035,z+.035);}
  function buildCFlat(){
   const F=G.FURN,[X0,X1]=G.APT.x,[Z0,Z1]=G.APT.z,bath=G.APT.bath,W=.12,rd=style==='container-rundown',steel=S.wall,rust=P('rust',{c:'#6a4a32',tex:'ncz/corrugated-rust-color.jpg',tile:1,rough:.8,metal:.4});
   box2(S.floor,X0,X1,-.1,0,Z0,Z1);box2(S.ceil,X0,X1,C,C+.08,Z0,Z1);
   // the shell: two containers welded together (a seam and a beam down the middle of the ceiling), ribbed walls, corner posts, end doors welded shut at the west end
   const win=[-1.1,.4,1.35,2.0];
   box2(steel,X0,win[0],0,C,Z1,Z1+W);box2(steel,win[1],X1,0,C,Z1,Z1+W);box2(steel,win[0],win[1],0,win[2],Z1,Z1+W);box2(steel,win[0],win[1],win[3],C,Z1,Z1+W);
   box2(steel,X0,-5.05,0,C,Z0-W,Z0);box2(steel,-3.95,X1,0,C,Z0-W,Z0);box2(steel,-5.05,-3.95,2.17,C,Z0-W,Z0);box2(steel,X0-W,X0,0,C,Z0,Z1);box2(steel,X1,X1+W,0,C,Z0,Z1);
   if(rd){corrugate(S.wall,X0,-5.1,0,C,Z0,Z0+.05,'x');corrugate(S.wall,-3.9,bath.x[0],0,C,Z0,Z0+.05,'x');corrugate(S.wall,X0,win[0],0,C,Z1-.05,Z1,'x');corrugate(S.wall,win[1],bath.x[0],0,C,Z1-.05,Z1,'x');}
   else{for(const [a,b] of [[X0,-5.05],[-3.95,bath.x[0]]])box2(S.wain,a,b,0,.9,Z0,Z0+.04);box2(S.wain,X0,bath.x[0],0,.9,Z1-.04,Z1);box2(S.trim,X0,bath.x[0],.9,.94,Z0,Z0+.05);box2(S.trim,X0,bath.x[0],.9,.94,Z1-.05,Z1);}
   box2(S.trim,X0,X1,C-.12,C,-.06,.06);for(const x of [X0+.05,-2,2,X1-.05])for(const z of [Z0+.06,Z1-.06])box2(S.trim,x-.06,x+.06,0,C,z-.06,z+.06);   // the welded seam / beam and the corner posts
   for(let x=X0+.6;x<X1;x+=1.2)box2(S.trim,x-.02,x+.02,C-.05,C,Z0,Z1);   // ceiling ribs
   // insulation: regular panels lined up; rundown torn foam patches and a tarp
   if(rd){for(const [x,y,z,ry,w2,h2] of [[-2.4,1.6,Z0+.07,Math.PI,1.4,1],[.9,1.9,Z1-.07,0,1.6,.9],[X0+.07,1.6,-1.2,-Math.PI/2,1.3,1.2],[2.9,1.4,Z0+.07,Math.PI,.9,1.1]]){const m=plane(S.wain,w2,h2,[x,y,z],ry);}
    const tarp=P('tarp',{c:'#2a5a8a',tex:'district-interior/kit_canvas_color.jpg',tile:.8,rough:.9});bx(tarp,[2.2,.02,1.6],[-4.6,C-.25,1.2],0);for(const x of [-5.6,-3.6])cyl(black,.01,.3,[x,C-.12,1.2],4);
    bx(tarp,[.02,1.6,1.5],[X0+.08,1.5,-1.3],0);}
   // the wet room at the east end: a ribbed partition, a sliding door, tiled floor, toilet, sink and shower
   box2(steel,bath.x[0]-.06,bath.x[0]+.06,0,C,Z0,bath.door[0]);box2(steel,bath.x[0]-.06,bath.x[0]+.06,0,C,bath.door[1],Z1);box2(steel,bath.x[0]-.06,bath.x[0]+.06,2.1,C,bath.door[0],bath.door[1]);
   box2(tile,bath.x[0]+.06,X1,.005,.012,Z0,Z1);box2(tile,X1-.02,X1,0,1.4,Z0,Z1);box2(tile,bath.x[0]+.06,X1,0,1.4,Z1-.02,Z1);
   const bd=slidingDoor({x:bath.x[0],z:(bath.door[0]+bath.door[1])/2,axis:'z',face:-1,w:bath.door[1]-bath.door[0],h:2.0,slide:1,id:'bath'});bd.range=1.4;
   {const [x0,x1,z0,z1]=F.toilet;box2(white,x0,x1-.05,0,.4,z0+.08,z1-.08);cyl(white,.4,.12,[(x0+x1)/2-.02,.42,(z0+z1)/2],16);box2(white,x1-.18,x1,.4,.82,z0+.05,z1-.05);}
   {const [x0,x1,z0,z1]=F.sink;box2(white,x0,x1,.78,.86,z0,z1);box2(dark,x0+.05,x1-.05,.1,.78,z0+.05,z1-.05);cyl(metal,.05,.22,[(x0+x1)/2,.95,z1-.06],8);plane(P('mirror',{c:'#9fb0ba',rough:.02,metal:1}),.5,.6,[(x0+x1)/2,1.5,Z1-.03],Math.PI);}
   {const [x0,x1,z0,z1]=F.shower;box2(tile,x0,x1,0,.05,z0,z1);plane(glass,1.9,1.35,[x0+.68,1.0,z0],0);cyl(metal,.2,.02,[(x0+x1)/2,2.08,(z0+z1)/2],12);cyl(metal,.025,.4,[(x0+x1)/2,2.25,(z0+z1)/2],6);}
   // bed: rundown a mattress on scavenged pallets; regular a compact platform bed with a duvet
   {const [x0,x1,z0,z1,h]=F.bed;if(rd){for(let k=0;k<4;k++)box2(S.wood,x0+.05+k*.52,x0+.14+k*.52,0,.14,z0+.05,z1-.05);box2(S.wood,x0,x1,.14,.18,z0,z1);box2(P('mattress',{c:'#8a8270',tex:'district-interior/kit_canvas_color.jpg',tile:.8,rough:1}),x0+.05,x1-.05,.18,.36,z0+.05,z1-.05);box2(S.fabric,x0+.3,x1-.3,.36,.4,z0+.02,z1-.3);bx(white,[.55,.12,.35],[x1-.45,.44,(z0+z1)/2],.2);}
    else{box2(S.trim,x0,x1,0,.28,z0,z1);box2(white,x0+.04,x1-.04,.28,h,z0+.04,z1-.04);box2(S.fabric,x0+.04,x1-.5,h,h+.06,z0+.02,z1-.02);for(const xx of [x1-.3])bx(white,[.4,.14,.6],[xx,h+.08,(z0+z1)/2],0);box2(S.trim,x0-.05,x1+.05,.28,1.1,z1-.05,z1);}}
   {const [x0,x1,z0,z1,h]=F.nightstand;box2(rd?cardboard:S.wood,x0,x1,0,h,z0,z1);cyl(S.lamp,.12,.16,[(x0+x1)/2,h+.1,(z0+z1)/2],10,0,0,.08);}
   // couch against the north wall facing the screen; a low table in front
   {const [x0,x1,z0,z1]=F.couch,[tx0,tx1,tz0,tz1,th]=F.table,cm=rd?P('couch',{c:'#7a5a44',tex:'district-interior/kit_canvas_color.jpg',tile:.5,rough:1}):P('couch',{c:'#6c7a86',tex:'district-interior/kit_canvas_color.jpg',tile:.5,rough:1});
    box2(cm,x0,x1,.1,.34,z0,z1);box2(cm,x0,x1,.1,.86,z1-.24,z1);for(const x of [x0,x1-.18])box2(cm,x,x+.18,.1,.62,z0,z1);for(let i=0;i<2;i++){const xa=x0+.18+i*(x1-x0-.36)/2,xb=xa+(x1-x0-.36)/2-.02;bx(cm,[xb-xa,.12,z1-z0-.3],[(xa+xb)/2,.4,z0+(z1-z0-.3)/2+.02],rd?(i?.04:-.05):0);}
    if(rd){box2(P('stain-dark',{c:'#2a1e14',rough:1}),x0+.3,x0+.7,.461,.464,z0+.1,z0+.4);box2(P('patch',{c:'#44506a',rough:1}),x1-.6,x1-.35,.462,.466,z0+.15,z0+.35);
     prop('props/crate.glb',[(tx0+tx1)/2,0,(tz0+tz1)/2],0,.42,()=>box2(cardboard,tx0+.1,tx1-.1,0,.42,tz0+.05,tz1-.05));}
    else{box2(P('throw',{c:'#2f3c4a',rough:1}),x1-.7,x1-.3,.47,.5,z0+.05,z1-.1);box2(S.wood,tx0,tx1,th-.04,th,tz0,tz1);for(const [x,z] of [[tx0+.05,tz0+.05],[tx1-.05,tz0+.05],[tx0+.05,tz1-.05],[tx1-.05,tz1-.05]])box2(metal,x-.015,x+.015,0,th-.04,z-.015,z+.015);cyl(P('mug',{c:'#d8d0c0',rough:.4}),.09,.1,[tx0+.3,th+.05,(tz0+tz1)/2],10);
     box2(P('rug',{c:'#3b4652',tex:'district-interior/kit_canvas_color.jpg',tile:.5,rough:1}),x0-.2,x1+.2,.002,.012,tz0-.3,z1);}}
   // closet (west end), safe, desk + computer (south wall), vending machine and storage (north wall), utility panel and light switch (south wall)
   {const [x0,x1,z0,z1,h]=F.closet,cm=rd?rust:S.trim;box2(cm,x0,x0+.03,0,h,z0,z1);box2(cm,x0,x1,h-.04,h,z0,z1);box2(cm,x0,x1,0,.04,z0,z1);for(const z of [z0,z1-.03])box2(cm,x0,x1,0,h,z,z+.03);cyl(metal,.025,z1-z0-.1,[(x0+x1)/2,1.65,(z0+z1)/2],6,Math.PI/2);
    const cols=['#2b2f36','#5a2a22','#3a4a3a','#1a1a1e'];for(let i=0;i<6;i++)bx(P('cloth-'+(i%2),{c:cols[i%4],tex:'district-interior/kit_canvas_color.jpg',tile:.6,rough:1}),[.48,.8+rand()*.2,.06],[(x0+x1)/2,1.2,z0+.2+i*.26],(rand()-.5)*.2);
    for(let i=0;i<2;i++)box2(cardboard,x0+.06,x0+.5,h-.04-.24,h-.04,z0+.15+i*.8,z0+.7+i*.8);
    const half=(z1-z0)/2,dm=rd?rust:S.door,mk=(za,zb,piv,ang)=>{const m=box2(dm,x1-.03,x1,.02,h-.02,za,zb,true);return swinging('closet-'+ang,hinge(m,[x1,0,piv]),ang);};const a=mk(z0,z0+half-.005,z0,-1.6),b2=mk(z0+half+.005,z1,z1,1.6);
    interactive.closet={get open(){return a.open;},toggle(){const v=a.toggle();b2.set(v);return v;},tick(dt){a.tick(dt);b2.tick(dt);}};delete interactive['closet--1.6'];delete interactive['closet-1.6'];}
   {const [x0,x1,z0,z1,h]=F.safe;box2(P('safe',{c:'#2a2c2e',tex:'district-interior/kit_gunmetal_color.jpg',tile:.5,rough:.35,metal:.85}),x0,x1,0,h,z0,z1);box2(dark,x1+.01,x1+.03,.36,.5,z0+.08,z0+.2);box2(red,x1+.03,x1+.035,.46,.48,z0+.1,z0+.13);cyl(metal,.16,.03,[x1+.025,.3,(z0+z1)/2+.08],12,0,Math.PI/2);
    interactive.safe={open:false,toggle(){return false;},tick(){}};}
   {const [x0,x1,z0,z1,h]=F.desk,dm=rd?S.wood:S.trim;box2(dm,x0,x1,h-.04,h,z0,z1);for(const x of [x0+.03,x1-.06])box2(metal,x,x+.03,0,h-.04,z0+.05,z1-.05);const scr=P('screen',{dyn:screenTex('pc'),unlit:true});
    box2(black,(x0+x1)/2-.33,(x0+x1)/2+.33,h+.02,h+.48,z0+.08,z0+.14);plane(scr,.62,.42,[(x0+x1)/2,h+.25,z0+.145],Math.PI);box2(dark,(x0+x1)/2-.24,(x0+x1)/2+.24,h,h+.02,z0+.35,z0+.5);
    prop('milked/milked-office-chair.glb',[(x0+x1)/2,0,z1+.4],0,.95,()=>{box2(dark,(x0+x1)/2-.25,(x0+x1)/2+.25,.42,.48,z1+.15,z1+.65);});}
   {const [x0,x1,z0,z1,h]=F.vending,fz=z0;const body=rd?P('vend',{c:'#5a3a32',tex:'ncz/metal-leaks-color.jpg',tile:.8,rough:.6,metal:.5}):P('vend',{c:'#2c3440',tex:'district-interior/kit_gunmetal_color.jpg',tile:.8,rough:.45,metal:.7});box2(body,x0,x1,0,h,z0+.02,z1);
    const goods=(root.VoidPodVending&&root.VoidPodVending.products)||[],shelf=P('vend-goods',{dyn:canvas(256,512,(g,w,hh)=>{g.fillStyle='#05070b';g.fillRect(0,0,w,hh);for(let r=0;r<6;r++){g.fillStyle='rgba(120,150,170,.25)';g.fillRect(0,(r+1)*hh/6-6,w,3);for(let c=0;c<4;c++){const d=goods[(r*4+c)%Math.max(1,goods.length)]||{};g.fillStyle=(d.art&&d.art[0])||['#c03030','#3070c0','#d0a020','#40a050'][(r+c)%4];const tall=/bottle|can/.test(d.kind||'can'),bw=tall?18:34,bh=tall?44:26;g.fillRect(c*w/4+(w/4-bw)/2,(r+1)*hh/6-8-bh,bw,bh);}}if(rd){g.strokeStyle='rgba(220,220,220,.35)';g.beginPath();g.moveTo(40,90);g.lineTo(120,180);g.lineTo(90,260);g.stroke();}},'apt-vend'),unlit:true});
    plane(shelf,.62,1.2,[x0+.4,1.15,fz-.005],0);fixtureMats.push(shelf);box2(black,x0+.08,x0+.72,.15,.45,fz-.01,fz+.02);const pad=P('vend-pad',{em:rd?'#59ff8a':'#7fd4ff',unlit:true});box2(pad,x1-.22,x1-.06,1.3,1.45,fz-.012,fz+.02);fixtureMats.push(pad);
    if(rd)box2(P('scuff',{c:'#2a1c18',rough:1}),x0+.05,x1-.05,.05,.3,fz-.003,fz);}
   {const [x0,x1,z0,z1,h]=F.storage;box2(rd?rust:S.trim,x0,x1,0,h,z1-.03,z1);for(const y of [.05,.6,1.15,h-.03])box2(rd?rust:S.trim,x0,x1,y,y+.03,z0,z1);for(let r=0;r<3;r++)for(let k=0;k<2;k++)if(rand()<.8)box2(rd&&rand()<.6?cardboard:P('bin',{c:rd?'#5a4030':'#3a5a7a',rough:.6}),x0+.05+k*.43,x0+.4+k*.43,.08+r*.55,.08+r*.55+.2+rand()*.2,z0+.05,z1-.05);}
   {const {x,y}=G.PANEL,zw=Z0;box2(metal,x-.27,x+.27,y-.37,y+.37,zw,zw+.05);box2(black,x-.24,x+.24,y-.34,y+.34,zw+.05,zw+.055);for(let i=0;i<6;i++)box2(i%3===1?red:dark,x-.2+i*.07,x-.15+i*.07,y+.05,y+.2,zw+.055,zw+.08);box2(green,x+.15,x+.18,y-.12,y-.09,zw+.055,zw+.065);
    const hm=box2(rd?rust:metal,x-.26,x+.26,y-.36,y+.36,zw+.06,zw+.085,true);const hn=hinge(hm,[x-.26,0,zw+.06]);swinging('panel',hn,1.9);cyl(dark,.06,C-y-.37,[x+.18,(C+y+.37)/2,zw+.04],6);}
   {const {x,y}=G.SWITCH;box2(white,x-.05,x+.05,y-.07,y+.07,Z0,Z0+.015);box2(amber,x-.01,x+.01,y+.03,y+.05,Z0+.015,Z0+.02);
    const ed=slidingDoor({x:G.APT.door.x,z:Z0-.06,axis:'x',face:1,w:1.05,h:2.1,slide:-1,id:'entry'});ed.range=1.3;ed.set({mine:true});const ap=G.AP;accessPanel(ap.x,ap.y,Z0+.01,1,'x',def.apt?def.apt.id+'/entry':'entry',true);}
   // the window: a hole cut in the north wall (rundown: half covered by a tarp), the city glow beyond
   {const sk=P('skyline',{dyn:skyline(),unlit:true}),[wx0,wx1,wy0,wy1]=win;plane(sk,8,5,[(wx0+wx1)/2,(wy0+wy1)/2+.4,Z1+3.5],0);plane(glass,wx1-wx0,wy1-wy0,[(wx0+wx1)/2,(wy0+wy1)/2,Z1+.06],Math.PI);for(const xx of [wx0,wx1])box2(S.trim,xx-.04,xx+.04,wy0,wy1,Z1-.02,Z1+.12);for(const yy of [wy0,wy1])box2(S.trim,wx0,wx1,yy-.04,yy+.04,Z1-.02,Z1+.12);
    if(rd){bx(P('tarp',{c:'#2a5a8a',rough:.9}),[.8,.7,.02],[wx0+.4,(wy0+wy1)/2+.05,Z1-.04],0);for(let i=1;i<5;i++)cyl(metal,.02,wy1-wy0,[wx0+i*(wx1-wx0)/5,(wy0+wy1)/2,Z1-.05],6);}}
   // light: rundown a caged bulb and a work lamp on a cable; regular a long LED strip and a warm panel
   if(rd){const bulb=P('bulb',{em:'#ffcf8a',unlit:true});for(const x of [-3.4,1.8]){cyl(black,.01,.4,[x,C-.2,0],4);const b=B.MeshBuilder.CreateSphere('bulb',{diameter:.12,segments:8},scene);b.position.set(x,C-.45,0);add(b,bulb);for(let k=0;k<4;k++)cyl(metal,.008,.18,[x+Math.sin(k*1.57)*.07,C-.45,Math.cos(k*1.57)*.07],4);}fixtureMats.push(bulb);
    const L=pointLight('main',[-1.2,2.0,0],'#ffcf9a',2.1,9);flicker={mat:bulb,light:L,t:3,on:true};const neon=P('sign',{dyn:canvas(256,96,(g,w,h)=>{g.fillStyle='#000';g.fillRect(0,0,w,h);g.fillStyle='#ff8a2a';g.shadowColor='#ff8a2a';g.shadowBlur=12;g.font='bold 50px Arial';g.textAlign='center';g.fillText('OPEN 24',w/2,64);},'apt-sign'),unlit:true});plane(neon,.7,.26,[-1.8,2.05,Z1-.08],0);fixtureMats.push(neon);}
   else{const strip=P('panel-light',{em:'#ffe6c4',unlit:true});box2(strip,X0+.4,bath.x[0]-.3,C-.13,C-.12,.1,.14);box2(strip,X0+.4,bath.x[0]-.3,C-.13,C-.12,-.14,-.1);fixtureMats.push(strip);box2(strip,4.4,5.4,C-.05,C-.04,-.3,.3);
    pointLight('main',[-1.2,2.1,0],'#ffe0b8',2.2,10);pointLight('bath',[4.9,2.1,0],'#e8f0ff',1.0,4);}
   if(G.AD_SCREEN)adScreen();
   // character: rundown scavenged parts, cans, a bucket under a drip, cables; regular plants, a print, a shelf of books
   if(rd){for(let i=0;i<6;i++)cyl(P('can',{c:'#b03a30',rough:.4,metal:.6}),.07,.12,[-2.5+rand()*4,.06,-1.5+rand()*1.6],8,rand()<.5?Math.PI/2:0);cyl(P('bucket',{c:'#3a6a8a',rough:.5}),.32,.3,[.9,.15,.2],12,0,0,.38);
    prop('district-interior/district_prop_crates_1m.glb',[-2.2,0,-1.9],0,.6,()=>box2(cardboard,-2.6,-1.8,0,.6,-2.3,-1.6));prop('district-props/district-radio.glb',[1.2,.5,2.12],Math.PI,.16);
    const tag=P('tag',{dyn:canvas(512,256,(g,w,h)=>{g.clearRect(0,0,w,h);g.lineWidth=8;g.strokeStyle='rgba(255,140,40,.75)';g.beginPath();g.moveTo(40,200);for(let k=0;k<6;k++)g.quadraticCurveTo(70+k*70,40,110+k*70,190);g.stroke();},'apt-tag'),rough:.9});tag.albedoTexture.hasAlpha=true;tag.useAlphaFromAlbedoTexture=true;tag.transparencyMode=1;tag.alphaCutOff=.2;plane(tag,1.6,.8,[2.5,1.7,Z1-.07],0);
    for(const [x0,z0,x1,z1] of [[-4.9,-2.3,-1.5,-2.3]])cyl(black,.015,x1-x0,[(x0+x1)/2,.02,z0],4,0,Math.PI/2);}
   else{prop('milked/milked-pothos.glb',[-2.15,1.8,2.15],0,.4,()=>cyl(P('leaf',{c:'#2a5a3a',rough:.9}),.3,.3,[-2.15,1.95,2.15],8));prop('milked/milked-bamboo.glb',[.85,0,1.95],0,1.2,()=>cyl(P('leaf',{c:'#2a5a3a',rough:.9}),.3,1,[.85,.5,1.95],8));
    bx(P('print',{dyn:poster('OUTSKIRTS',140),rough:.9}),[.6,.85,.02],[2.5,1.6,Z1-.05],0);prop('milked/milked-lucky-cat.glb',[-2.15,1.18,2.15],Math.PI,.2);}
   for(const it of def.items||[]){const y=Number.isFinite(it.y)?it.y:0;box2(P('item',{c:'#2b2f35',rough:.4,metal:.6}),it.x-.18,it.x+.18,y,y+.18,it.z-.12,it.z+.12);box2(it.type==='mission-item'?amber:it.type==='loot'?green:P('item-band',{em:'#7fd4ff',unlit:true}),it.x-.185,it.x+.185,y+.11,y+.13,it.z-.125,it.z+.125);}
  }
  // ================================================================ THE CONTAINER HALLWAY: three joined containers, four doors
  function buildCHall(){
   const H=G.HALL,[X0,X1]=H.x,[Z0,Z1]=H.z,Ch=G.HALL_CEIL,W=.12,rd=style==='container-rundown',steel=S.wall;
   box2(S.floor,X0,X1,-.1,0,Z0,Z1);box2(S.ceil,X0,X1,Ch,Ch+.08,Z0,Z1);
   for(const zs of [Z0,Z1]){let x=X0;const zz=zs>0?[Z1,Z1+W]:[Z0-W,Z0];for(const sl of H.slots.filter(q=>(q.z>0)===(zs>0))){box2(steel,x,sl.x-.6,0,Ch,...zz);box2(steel,sl.x-.6,sl.x+.6,2.2,Ch,...zz);x=sl.x+.6;}box2(steel,x,X1,0,Ch,...zz);
    if(rd)corrugate(steel,X0,X1,0,Ch,zs>0?Z1-.05:Z0,zs>0?Z1:Z0+.05,'x');else{box2(S.wain,X0,X1,0,.9,zs>0?Z1-.04:Z0,zs>0?Z1:Z0+.04);}box2(S.trim,X0,X1,0,.08,zs>0?Z1-.06:Z0,zs>0?Z1:Z0+.06);}
   for(const x of [X0+.08,-2.17+.2,2.17+.6,X1-.08])for(const z of [Z0+.06,Z1-.06])box2(S.trim,x-.06,x+.06,0,Ch,z-.06,z+.06);for(let x=X0+.5;x<X1;x+=1.0)box2(S.trim,x-.02,x+.02,Ch-.05,Ch,Z0,Z1);
   // the east end: welded-shut cargo doors with their locking bars, a vent; the west end: the street door
   box2(S.door,X1,X1+W,0,Ch,Z0,Z1);for(const z of [-.7,-.25,.25,.7])cyl(metal,.04,Ch-.3,[X1-.05,Ch/2,z],8);for(const y of [.6,1.9])for(const z of [-.7,-.25,.25,.7])box2(metal,X1-.1,X1-.02,y-.06,y+.06,z-.08,z+.08);box2(dark,X1-.03,X1,1.6,2.0,-.25,.25);
   box2(steel,X0-W,X0,0,Ch,Z0,-.58);box2(steel,X0-W,X0,0,Ch,.58,Z1);box2(steel,X0-W,X0,2.18,Ch,-.58,.58);
   const street=slidingDoor({x:X0-.06,z:0,axis:'z',face:1,w:1.08,h:2.12,slide:1,id:'street'});street.set({mine:true});street.range=1.4;
   const exitSign=P('exit',{dyn:canvas(256,96,(g,w,h)=>{g.fillStyle='#062a12';g.fillRect(0,0,w,h);g.fillStyle='#39ff9c';g.font='bold 48px Arial';g.textAlign='center';g.fillText('◂ YARD',w/2,64);},'apt-exit'),unlit:true});plane(exitSign,.5,.19,[X0+.03,2.3,0],-Math.PI/2);fixtureMats.push(exitSign);
   const open=new Map((def.open||[]).map(o=>[o.slot,o]));const nums=H.slots.map(sl=>open.get(sl.i)?.number||A.slotNumber(sl.i,style)),nm=P('numbers',{dyn:numberTex(nums),unlit:true});
   for(const sl of H.slots){const mine=open.has(sl.i),face=sl.z>0?-1:1,d=slidingDoor({x:sl.x,z:sl.z+(sl.z>0?.06:-.06),axis:'x',face,w:1.0,h:2.05,slide:1,locked:!mine||!!(open.get(sl.i)||{}).locked,mine,id:'slot-'+sl.i});d.slot=sl.i;d.range=1.15;
    const k=sl.i,n=nums.length,pl=B.MeshBuilder.CreatePlane('apt-num',{width:.36,height:.12,frontUVs:new B.Vector4(k/n,0,(k+1)/n,1),backUVs:new B.Vector4(k/n,0,(k+1)/n,1),sideOrientation:B.Mesh.DOUBLESIDE},scene);pl.position.set(sl.x+.75,1.55,sl.z+face*.005);pl.rotation.y=sl.z>0?0:Math.PI;add(pl,nm);
    accessPanel(sl.x-.75,1.38,sl.z>0?sl.z-.03:sl.z+.03,sl.z>0?-1:1,'x',mine?open.get(sl.i).id+'/hall':null,mine&&!(open.get(sl.i)||{}).locked);box2(black,sl.x-.55,sl.x+.55,0,2.2,sl.z>0?sl.z+.14:sl.z-.24,sl.z>0?sl.z+.24:sl.z-.14);}
   if(rd){const bulb=P('bulb',{em:'#ffcf8a',unlit:true});for(const x of [-4,0.3,4.5]){cyl(black,.01,.35,[x,Ch-.18,0],4);const b=B.MeshBuilder.CreateSphere('bulb',{diameter:.12,segments:8},scene);b.position.set(x,Ch-.4,0);add(b,bulb);}fixtureMats.push(bulb);const L=pointLight('main',[0,2.0,0],'#ffcf9a',2.0,9);flicker={mat:bulb,light:L,t:2,on:true};
    cyl(P('pipe-rust',{c:'#5a4030',tex:'ncz/metal-leaks-color.jpg',tile:1,rough:.6,metal:.5}),.08,X1-X0,[0,Ch-.15,Z1-.2],8,0,Math.PI/2);for(const [x,z] of [[-4.5,.8],[5.5,-.85]]){const m=B.MeshBuilder.CreateSphere('bag',{diameter:.5,segments:6},scene);m.scaling.y=.8;m.position.set(x,.2,z);add(m,P('bag',{c:'#101012',rough:.25}));}}
   else{const strip=P('panel-light',{em:'#ffe6c4',unlit:true});box2(strip,X0+.5,X1-.5,Ch-.11,Ch-.1,-.04,.04);fixtureMats.push(strip);pointLight('main',[-1,2.1,0],'#ffe0b8',2.0,10);prop('milked/milked-pothos.glb',[5.9,0,-.75],0,.7,()=>cyl(P('leaf',{c:'#2a5a3a',rough:.9}),.3,.6,[5.9,.3,-.75],8));}
  }
  function rundownDecor(){const [X0,X1,Z0,Z1]=[...A.APT.x,...A.APT.z];
   // peeling paint and water stains (decals on the walls), a stained ceiling corner
   const peel=P('peel',{dyn:canvas(256,256,(g,w,h)=>{g.clearRect(0,0,w,h);for(let i=0;i<14;i++){g.fillStyle='rgba(150,150,130,'+(.5+rand()*.4)+')';g.beginPath();let x=rand()*w,y=rand()*h;g.moveTo(x,y);for(let k=0;k<7;k++)g.lineTo(x+=(rand()-.5)*60,y+=(rand()-.5)*60);g.fill();g.strokeStyle='rgba(30,25,15,.6)';g.stroke();}grime(g,w,h,1.4);},'apt-peel'),rough:.95});
   peel.albedoTexture.hasAlpha=true;peel.useAlphaFromAlbedoTexture=true;peel.transparencyMode=1;peel.alphaCutOff=.3;
   for(const [x,y,z,ry,s] of [[X0+.025,1.9,1.6,-Math.PI/2,1.4],[1.0,1.5,Z0+.025,Math.PI,1.2],[X1-.025,2.2,-3,Math.PI/2,1.6],[1.33,1.3,3.6,Math.PI/2,1],[2.6,2.0,Z1-.025,0,1.3]])plane(peel,s,s,[x,y,z],ry);
   // graffiti tag over the bed
   const tag=P('tag',{dyn:canvas(512,256,(g,w,h)=>{g.clearRect(0,0,w,h);g.font='bold 120px Arial';g.lineWidth=8;g.strokeStyle='rgba(20,200,170,.75)';g.strokeText('R0T',40,170);g.fillStyle='rgba(255,60,160,.5)';g.fillText('R0T',48,176);},'apt-tag'),rough:.9});tag.albedoTexture.hasAlpha=true;tag.useAlphaFromAlbedoTexture=true;tag.transparencyMode=1;tag.alphaCutOff=.2;plane(tag,1.6,.8,[X1-.03,1.7,-.75],Math.PI/2);
   // clutter: pizza boxes, cans, trash bags, wires, an armchair, a TV on crates
   const bag=P('bag',{c:'#101012',rough:.25,metal:.1});for(const [x,z,s] of [[-2.6,4.4,.45],[-2.2,4.6,.38],[.9,-4.5,.4]]){const m=B.MeshBuilder.CreateSphere('bag',{diameter:s*1.4,segments:6},scene);m.scaling.y=.8;m.position.set(x,s*.5,z);add(m,bag);}
for(let i=0;i<7;i++)cyl(P('can',{c:'#b03a30',rough:.4,metal:.6}),.07,.12,[-1.5+rand()*2.5,.06,-1.5+rand()*3.5],8,rand()<.5?Math.PI/2:0);
   prop('props/crate.glb',[-1.6,0,1.4],.3,.55,()=>box2(cardboard,-1.9,-1.3,0,.55,1.15,1.65));prop('district-interior/district_prop_crates_1m.glb',[-1.1,0,4.4],0,.7,()=>box2(cardboard,-1.5,-.7,0,.7,4.1,4.7));
   for(const [x0,z0,x1,z1] of [[-1.2,-4.9,-1.6,1.4],[X1-.05,-3,X1-.05,1]])cyl(black,.015,Math.hypot(x1-x0,z1-z0),[(x0+x1)/2,.01,(z0+z1)/2],4,Math.PI/2,0).rotation.y=Math.atan2(x1-x0,z1-z0);
   box2(P('stain',{c:'#2a2418',rough:1}),1.6,3.2,.001,.004,-3.4,-2.4);
   bx(P('poster',{dyn:poster('BLACKOUT',330),rough:.9}),[.7,1,.01],[-2.6,1.6,Z0+.02],0);}
  function normalDecor(){const [X0,X1,Z0,Z1]=[...A.APT.x,...A.APT.z];
   // the holo-frame on the south wall (a soft animated picture) and a framed print
   const holo=P('holo',{dyn:canvas(256,160,(g,w,h)=>{const gr=g.createLinearGradient(0,0,w,h);gr.addColorStop(0,'#0b2a44');gr.addColorStop(1,'#3a1040');g.fillStyle=gr;g.fillRect(0,0,w,h);g.fillStyle='rgba(127,212,255,.8)';g.font='bold 22px Arial';g.fillText('KAI & MEI · 2071',18,140);g.beginPath();g.arc(90,70,40,0,7);g.fillStyle='rgba(255,200,150,.5)';g.fill();g.beginPath();g.arc(160,75,34,0,7);g.fillStyle='rgba(255,170,200,.45)';g.fill();},'apt-holo'),unlit:true});
   box2(black,-3.0,-2.9,1.3,1.95,Z0,Z0+.03);plane(holo,.9,.55,[-2.95+.45,1.62,Z0+.035],Math.PI);fixtureMats.push(holo);box2(black,-3.4,-1.5,1.25,1.3,Z0,Z0+.05);
   bx(P('print',{dyn:poster('TESSALY',200),rough:.9}),[.7,1,.02],[X1-.02,1.6,-3.3],Math.PI/2);
   // plants, a shelf with books, a small dining table and two stools
   prop('milked/milked-pothos.glb',[3.7,.55,.5],0,.4,()=>cyl(P('leaf',{c:'#2a5a3a',rough:.9}),.3,.35,[3.7,.73,.5],8));prop('milked/milked-bamboo.glb',[-3.0,0,-4.5],0,1.5,()=>cyl(P('leaf',{c:'#2a5a3a',rough:.9}),.35,1.2,[-3,.6,-4.5],8));
   box2(S.wood,X1-.3,X1,1.55,1.58,-4.4,-2.6);for(let i=0;i<10;i++)box2(P('book-'+(i%2),{c:['#6a2a22','#22406a'][i%2],rough:.8}),X1-.26,X1-.04,1.58,1.58+.2+rand()*.06,-4.35+i*.12,-4.26+i*.12);
   box2(S.wood,-1.9,-1.1,.74,.78,3.1,3.9);cyl(metal,.06,.74,[-1.5,.37,3.5],8);for(const z of [2.8,4.2])cyl(dark,.36,.6,[-1.5,.3,z],10);}
  function luxuryDecor(){const [X0,X1,Z0,Z1]=[...A.APT.x,...A.APT.z];
   // a wood slat feature wall behind the sofa, art, a bar island with stools, a lounge sofa and a low table, a sculpture
   for(let i=0;i<20;i++)box2(S.wain,1.29,1.34,.1,C-.25,2.3+i*.13,2.35+i*.13);
   const art=P('art',{dyn:canvas(512,320,(g,w,h)=>{g.fillStyle='#0d0c10';g.fillRect(0,0,w,h);for(let i=0;i<5;i++){g.strokeStyle='hsla('+(20+i*12)+',70%,'+(45+i*6)+'%,.9)';g.lineWidth=18-i*3;g.beginPath();g.arc(w*.55,h*.6,60+i*34,Math.PI*1.05,Math.PI*1.95);g.stroke();}g.fillStyle='#c9a46a';g.fillRect(40,h-50,120,4);},'apt-art'),rough:.6});
   box2(S.trim,-3.25,-1.75,1.12,2.08,Z0,Z0+.04);plane(art,1.42,.88,[-2.5,1.6,Z0+.045],Math.PI);box2(S.accent,-3.25,-1.75,2.1,2.12,Z0+.02,Z0+.06);
   box2(S.floor,-2.5,-.6,0,1.02,2.55,3.2);box2(S.trim,-2.55,-.55,1.02,1.06,2.5,3.25);box2(S.accent,-2.45,-.65,.08,.1,2.53,2.55);
   for(const x of [-2.1,-1.0])prop('district-props/district-bar-stool.glb',[x,0,2.15],0,.78,()=>{cyl(S.trim,.36,.06,[x,.76,2.15],12);cyl(metal,.05,.74,[x,.37,2.15],8);});
   for(let i=0;i<5;i++)cyl(P('bottle',{c:'#3a2a18',rough:.1,metal:.2}),.08,.3,[-2.3+i*.35,1.21,2.9],8);
   prop('milked/milked-bamboo.glb',[X0+.4,0,Z1-.9],0,1.9,()=>cyl(P('leaf',{c:'#2a5a3a',rough:.9}),.4,1.6,[X0+.4,.8,Z1-.9],8));
   cyl(S.trim,.05,.9,[-3.2,.45,-1.95],8);const orb=B.MeshBuilder.CreateTorusKnot('sculpt',{radius:.12,tube:.035,radialSegments:48,tubularSegments:8},scene);orb.position.set(3.7,.85,.5);add(orb,S.trim);}

  // ================================================================ THE HALLWAY
  function buildHall(){
   const H=A.HALL,[X0,X1]=H.x,[Z0,Z1]=H.z,Ch=A.HALL_CEIL,W=.25;
   box2(S.floor,X0,X1,-.1,0,Z0,Z1);box2(S.ceil,X0,X1,Ch,Ch+.1,Z0,Z1);
   // walls: pieces between the doors (door openings 1.2 m wide) on both sides
   const openings=x=>[x-.6,x+.6];
   for(const zSide of [Z0,Z1]){let x=X0;const zs=zSide>0?[Z1,Z1+W]:[Z0-W,Z0];for(const sl of H.slots.filter(s=>(s.z>0)===(zSide>0))){const [a,b]=openings(sl.x);box2(S.wall,x,a,0,Ch,...zs);box2(S.wall,a,b,2.2,Ch,...zs);x=b;}box2(S.wall,x,X1,0,Ch,...zs);
    box2(S.trim,X0,X1,0,.1,zSide>0?Z1-.02:Z0,zSide>0?Z1:Z0+.02);if(style!=='luxury')box2(S.wain,X0,X1,.1,1.0,zSide>0?Z1-.015:Z0,zSide>0?Z1:Z0+.015);box2(S.trim,X0,X1,Ch-.06,Ch,zSide>0?Z1-.03:Z0,zSide>0?Z1:Z0+.03);}
   // the east end (a window onto the city, or the stairs) and the west end (the street door)
   box2(S.wall,X1,X1+W,0,Ch,Z0,Z1);{const sk=P('skyline',{dyn:skyline(),unlit:true});box2(S.wall,X1-.02,X1,0,.9,Z0,Z1);plane(glass,2.0,1.4,[X1-.03,1.6,0],-Math.PI/2);plane(sk,7,4,[X1+3,1.6,0],-Math.PI/2);if(style==='rundown')for(let i=1;i<5;i++)cyl(metal,.025,1.4,[X1-.06,1.6,Z0+i*.5],6);}
   box2(S.wall,X0-W,X0,0,Ch,Z0,-.6);box2(S.wall,X0-W,X0,0,Ch,.6,Z1);box2(S.wall,X0-W,X0,2.2,Ch,-.6,.6);
   const street=slidingDoor({x:X0-.1,z:0,axis:'z',face:1,w:1.1,h:2.15,slide:1,id:'street',slabMat:style==='luxury'?P('street-glass',{c:'#202830',rough:.05,metal:.3,alpha:.55}):S.door});street.mine=true;street.range=1.4;
   const exitSign=P('exit',{dyn:canvas(256,96,(g,w,h)=>{g.fillStyle='#062a12';g.fillRect(0,0,w,h);g.fillStyle='#39ff9c';g.font='bold 48px Arial';g.textAlign='center';g.fillText('EXIT ▸',w/2,64);},'apt-exit'),unlit:true});plane(exitSign,.5,.19,[X0+.03,2.45,0],-Math.PI/2);fixtureMats.push(exitSign);
   // the apartment doors: numbered; the open one (this player's mission) amber, the rest locked (red)
   const open=new Map((def.open||[]).map(o=>[o.slot,o]));const nums=H.slots.map(sl=>open.get(sl.i)?.number||A.slotNumber(sl.i)),ntex=numberTex(nums),nm=P('numbers',{dyn:ntex,unlit:true});
   for(const sl of H.slots){const mine=open.has(sl.i),face=sl.z>0?-1:1,d=slidingDoor({x:sl.x,z:sl.z+(sl.z>0?.12:-.12),axis:'x',face,w:1.0,h:2.1,slide:1,locked:!mine||!!(open.get(sl.i)||{}).locked,mine,id:'slot-'+sl.i});d.slot=sl.i;d.range=1.25;
    if(mine)apLeds[open.get(sl.i).id+'/hall']=null;
    const pl=B.MeshBuilder.CreatePlane('apt-num',{width:.36,height:.12,frontUVs:new B.Vector4(sl.i/10,0,(sl.i+1)/10,1),backUVs:new B.Vector4(sl.i/10,0,(sl.i+1)/10,1),sideOrientation:B.Mesh.DOUBLESIDE},scene);pl.position.set(sl.x+.75,1.55,sl.z+face*.005);pl.rotation.y=sl.z>0?0:Math.PI;add(pl,nm);
    accessPanel(sl.x-.75,1.38,sl.z>0?sl.z-.03:sl.z+.03,sl.z>0?-1:1,'x',mine?open.get(sl.i).id+'/hall':null,mine&&!(open.get(sl.i)||{}).locked);
    // a dark entry beyond the door (seen when it opens)
    box2(black,sl.x-.55,sl.x+.55,0,2.2,sl.z>0?sl.z+.2:sl.z-.3,sl.z>0?sl.z+.3:sl.z-.2);}
   // lights: fixtures down the ceiling, one or two real lights
   if(style==='rundown'){const tube=P('tube',{em:'#d6f0e0',unlit:true});for(const x of [-8,-2,4,9]){box2(dark,x-.7,x+.7,Ch-.05,Ch,-.08,.08);cyl(tube,.045,1.3,[x,Ch-.08,0],8,0,Math.PI/2);}fixtureMats.push(tube);const L=pointLight('main',[-2,2.3,0],'#cfe6d4',2.07,12);flicker={mat:tube,light:L,t:1,on:true};
    for(const [x,z] of [[-6,1.0],[6.5,-1.0]]){const m=B.MeshBuilder.CreateSphere('bag',{diameter:.5,segments:6},scene);m.scaling.y=.8;m.position.set(x,.2,z);add(m,P('bag',{c:'#101012',rough:.25}));}
    cyl(metal,.12,X1-X0,[0,Ch-.15,Z1-.15],8,0,Math.PI/2);cyl(P('pipe-rust',{c:'#5a4030',tex:'ncz/metal-leaks-color.jpg',tile:1,rough:.6,metal:.5}),.08,X1-X0,[0,Ch-.15,Z1-.32],8,0,Math.PI/2);
    const tag=P('tag',{dyn:canvas(512,256,(g,w,h)=>{g.clearRect(0,0,w,h);g.font='bold 110px Arial';g.lineWidth=7;g.strokeStyle='rgba(255,180,60,.7)';g.strokeText('NO RENT',20,160);},'apt-tag'),rough:.9});tag.albedoTexture.hasAlpha=true;tag.useAlphaFromAlbedoTexture=true;tag.transparencyMode=1;tag.alphaCutOff=.2;plane(tag,1.8,.9,[3,1.5,Z0+.03],Math.PI);
    const peel=P('poster',{dyn:poster('MISSING',20),rough:.9});bx(peel,[.5,.72,.01],[-5,1.5,Z1-.02],0);}
   else if(style==='normal'){const pan=P('panel-light',{em:'#ffe6c4',unlit:true});for(const x of [-8,-3,2,7]){box2(dark,x-.45,x+.45,Ch-.04,Ch,-.3,.3);box2(pan,x-.4,x+.4,Ch-.05,Ch-.04,-.25,.25);}fixtureMats.push(pan);pointLight('main',[-3,2.3,0],'#ffe0b8',2.07,12);pointLight('end',[7,2.3,0],'#ffe0b8',1.38,9);
    const board=P('notice',{dyn:canvas(256,192,(g,w,h)=>{g.fillStyle='#2a2620';g.fillRect(0,0,w,h);for(let i=0;i<6;i++){g.fillStyle=['#e8e0c8','#f0d080','#c8e0f0'][i%3];g.fillRect(14+(i%3)*80,14+Math.floor(i/3)*88,66,72);g.fillStyle='#333';for(let k=0;k<5;k++)g.fillRect(20+(i%3)*80,26+Math.floor(i/3)*88+k*11,50,3);}},'apt-notice'),rough:.9});bx(board,[.9,.65,.02],[-5,1.5,Z1-.02],0);
    prop('milked/milked-pothos.glb',[10.6,0,-.9],0,.8,()=>cyl(P('leaf',{c:'#2a5a3a',rough:.9}),.35,.7,[10.6,.35,-.9],8));}
   else{const sconce=P('sconce',{em:'#ffd29a',unlit:true});for(const x of [-9,-5,-1,3,7])for(const zs of [Z0+.06,Z1-.06]){box2(S.trim,x-.06,x+.06,1.7,2.1,zs-.03,zs+.03);box2(sconce,x-.05,x+.05,1.75,2.05,zs-.04,zs+.04);}fixtureMats.push(sconce);
    box2(P('runner',{c:'#4a1c1a',tex:'district-interior/kit_canvas_color.jpg',tile:.6,rough:1}),X0+.5,X1-.5,.002,.012,-.55,.55);for(const zs of [Z0,Z1])box2(S.accent,X0,X1,.12,.14,zs>0?zs-.03:zs,zs>0?zs:zs+.03);fixtureMats.push(S.accent);
    pointLight('main',[-3,2.3,0],'#ffd6a8',1.84,12);pointLight('end',[7,2.3,0],'#ffd6a8',1.26,9);
    box2(S.wood,9.6,10.6,0,.82,-1.2,-.85);prop('milked/milked-bamboo.glb',[10.6,0,.9],0,1.6);const art=P('art',{dyn:poster('AURUM',35),rough:.6});bx(art,[.9,1.2,.02],[0,1.55,Z1-.03],0);}
  }
 }
 root.VoidApartments=Object.assign(root.VoidApartments||{},{build,slider});
})(globalThis);
