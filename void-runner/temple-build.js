/* ZEN ZEPHYR TEMPLE: the 3D build (browser only). Data is temple.js; the chat is zen-chat.js; the wiring and panel are temple-integration.js.
   build({scene,parent,quality,state}) -> {tick(time,player), dispose(), fog, monk, ...}. Called by the renderer when the walking location `temple` loads; the whole area is
   disposed when the player leaves (the cab room replaces it), so only one real place is ever loaded.
   Art direction (docs/VOID_RUNNER_ART_DIRECTION.md): serene, technological, mysterious; dark with controlled accents. Layered 3D-printed walls, tall server pillars with data
   flowing in their LEDs, hanging cables, low mist, a glossy floor that seems to reflect its lights, blue-flame incense, glowing data altars, a central dais under an oculus of
   light, the city far below to the south-east. No real lights are added: emissive accents, additive pools and the scene's ambient light. No heavy reflections or volumetrics. */
(function(root){
 'use strict';
 const T=root.VoidTemple;if(!T)return;
 function build({scene,parent,quality,state}){
  const B=root.BABYLON,Area=root.VoidAreaMap,low=quality==='low',hi=quality==='high'||quality==='ultra',own=[],node=new B.TransformNode('temple',scene);node.parent=parent;let disposed=false;
  // ---- the night on the hill ----
  const ip=scene.imageProcessingConfiguration,prev={clear:scene.clearColor.clone(),fogMode:scene.fogMode,fogDensity:scene.fogDensity,fogColor:scene.fogColor.clone(),exposure:ip.exposure,contrast:ip.contrast,env:scene.environmentIntensity};
  scene.clearColor=new B.Color4(.008,.018,.034,1);scene.fogMode=B.Scene.FOGMODE_EXP2;scene.fogDensity=low?.0042:.0034;scene.fogColor=new B.Color3(.028,.06,.088);ip.exposure=1.5;ip.contrast=1.18;scene.environmentIntensity=Math.min(prev.env??1,.3);
  const sun=scene.getLightByName('sun'),ambient=scene.getLightByName('ambient'),lp={sun:sun?.intensity,amb:ambient?.intensity,dif:ambient?.diffuse?.clone(),gnd:ambient?.groundColor?.clone()};
  if(sun)sun.intensity=.03;if(ambient){ambient.intensity=1.55;ambient.diffuse=new B.Color3(.36,.5,.66);if(ambient.groundColor)ambient.groundColor=new B.Color3(.08,.11,.16);}
  let seed=4417;const rand=()=>((seed=seed*16807%2147483647)-1)/2147483646;
  const mc=new Map(),M=(name,hex,em,spec=.2,alpha)=>{const k=name+hex+em+alpha;if(mc.has(k))return mc.get(k);const m=new B.StandardMaterial('tmp-'+name,scene);m.diffuseColor=B.Color3.FromHexString(hex);m.specularColor=new B.Color3(spec,spec,spec*1.1);m.specularPower=40;if(em)m.emissiveColor=B.Color3.FromHexString(em);if(alpha!=null){m.alpha=alpha;m.backFaceCulling=false;}own.push(m);mc.set(k,m);return m;};
  const G=(name,hex,k=1)=>{const key='g'+name+hex+k;if(mc.has(key))return mc.get(key);const m=new B.StandardMaterial('tmp-'+name,scene);m.diffuseColor=B.Color3.Black();m.specularColor=B.Color3.Black();m.emissiveColor=B.Color3.FromHexString(hex).scale(k);m.disableLighting=true;own.push(m);mc.set(key,m);return m;};
  const canvas=(w,h,draw)=>{const t=new B.DynamicTexture('tmp-tex',{width:w,height:h},scene,true);own.push(t);draw(t.getContext(),w,h);t.update();return t;};
  const emissiveMat=(t,alpha)=>{const m=new B.StandardMaterial('tmp-screen',scene);m.diffuseColor=B.Color3.Black();m.specularColor=B.Color3.Black();m.emissiveTexture=t;m.disableLighting=true;m.backFaceCulling=false;if(alpha)m.opacityTexture=t;own.push(m);return m;};
  const groups=new Map();
  const put=(mesh,mat,x,y,z,keep)=>{mesh.material=mat;mesh.parent=node;mesh.position.set(x,y,z);mesh.isPickable=false;if(!keep){let g=groups.get(mat);if(!g)groups.set(mat,g=[]);g.push(mesh);}return mesh;};
  const box=(w,h,d,x,y,z,mat,keep)=>put(B.MeshBuilder.CreateBox('tmp-box',{width:w,height:h,depth:d},scene),mat,x,y,z,keep);
  const rbox=(r,y0,y1,mat,keep)=>box(r[1]-r[0],y1-y0,r[3]-r[2],(r[0]+r[1])/2,(y0+y1)/2,(r[2]+r[3])/2,mat,keep);
  const cyl=(dia,h,x,y,z,mat,keep,seg=14,top)=>put(B.MeshBuilder.CreateCylinder('tmp-cyl',{diameter:dia,diameterTop:top,height:h,tessellation:seg},scene),mat,x,y,z,keep);
  const sign=(w,h,x,y,z,ry,cw,ch,draw,period)=>{const t=canvas(cw,ch,draw),p=put(B.MeshBuilder.CreatePlane('tmp-sign',{width:w,height:h},scene),emissiveMat(t,!period),x,y,z,true);p.rotation.y=ry;if(period)screens.push({t,draw,cw,ch,next:rand()*period,period});return p;};
  const screens=[],TOS=0,TON=Math.PI,TOW=Math.PI/2,TOE=-Math.PI/2;
  const washM={};const wash=hex=>{if(washM[hex])return washM[hex];const t=canvas(128,128,(g,w,h)=>{g.fillStyle='#000';g.fillRect(0,0,w,h);const rg=g.createRadialGradient(w/2,h/2,1,w/2,h/2,w/2);rg.addColorStop(0,hex);rg.addColorStop(.4,hex+'66');rg.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=rg;g.fillRect(0,0,w,h);});
   const m=new B.StandardMaterial('tmp-wash',scene);m.diffuseColor=B.Color3.Black();m.specularColor=B.Color3.Black();m.emissiveTexture=t;m.disableLighting=true;m.alphaMode=B.Engine.ALPHA_ADD;m.alpha=.5;m.disableDepthWrite=true;own.push(m);washM[hex]=m;return m;};
  const pool=(hex,x,z,w,d,k=.5,y=.05)=>{const g=B.MeshBuilder.CreateGround('tmp-pool',{width:w,height:d},scene);g.material=wash(hex);g.parent=node;g.position.set(x,y,z);g.isPickable=false;g.visibility=k/.5;return g;};
  // ---- materials ----
  const stoneTex=canvas(256,256,(g,w,h)=>{g.fillStyle='#1a2026';g.fillRect(0,0,w,h);for(let i=0;i<1600;i++){g.fillStyle='rgba('+(24+rand()*30|0)+','+(32+rand()*30|0)+','+(40+rand()*30|0)+','+(.12+rand()*.25)+')';g.fillRect(rand()*w,rand()*h,1+rand()*2,1+rand()*2);}g.strokeStyle='rgba(2,5,8,.8)';g.lineWidth=2;for(let i=0;i<=4;i++){g.beginPath();g.moveTo(i*64,0);g.lineTo(i*64,h);g.stroke();g.beginPath();g.moveTo(0,i*64);g.lineTo(w,i*64);g.stroke();}});
  stoneTex.wrapU=stoneTex.wrapV=B.Texture.WRAP_ADDRESSMODE;stoneTex.uScale=stoneTex.vScale=16;const stone=new B.StandardMaterial('tmp-stone',scene);stone.diffuseTexture=stoneTex;stone.specularColor=new B.Color3(.35,.45,.5);stone.specularPower=70;own.push(stone);
  // the hall's floor: dark polished stone that seems to reflect its own lights (a soft vertical glow under each lit thing, painted on, not a real reflection)
  const floorM=M('floor','#0b1319','#050a0e',.9);
  const layerTex=canvas(256,256,(g,w,h)=>{g.fillStyle='#101a20';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=6){const v=18+rand()*22|0;g.fillStyle='rgb('+v+','+(v+8)+','+(v+14)+')';g.fillRect(0,y,w,4);g.fillStyle='rgba(0,0,0,.55)';g.fillRect(0,y+4,w,2);}
   for(let i=0;i<500;i++){g.fillStyle='rgba(60,90,100,'+(.05+rand()*.12)+')';g.fillRect(rand()*w,rand()*h,2+rand()*10,1);}});
  layerTex.wrapU=layerTex.wrapV=B.Texture.WRAP_ADDRESSMODE;const layer=new B.StandardMaterial('tmp-layer',scene);layer.diffuseTexture=layerTex;layer.specularColor=new B.Color3(.2,.3,.34);layer.specularPower=24;own.push(layer);
  const trim=M('trim','#1f2a31','#0a1014',.3),dark=M('dark','#080d11',null,.1),metal=M('metal','#242d34','#0b1014',.5),silver=M('silver','#aeb9c2','#2a3138',.85),tealL=G('teal','#38e8ff',.85),blueF=G('flame','#5aa8ff',1),blueW=G('flameW','#bfe6ff',1),amber=G('amber','#e0a436',.7),warmL=G('warm','#ffcf8a',.8);
  // ---- the hill: a plateau, a long slope, the city far below ----
  const ground=B.MeshBuilder.CreateGround('tmp-plateau',{width:100,height:100},scene);ground.material=stone;ground.parent=node;ground.position.y=-.01;ground.isPickable=false;
  const slope=B.MeshBuilder.CreateCylinder('tmp-slope',{diameterTop:112,diameterBottom:760,height:70,tessellation:32,cap:B.Mesh.NO_CAP},scene);slope.material=M('slope','#0d1419','#05090c',.1);slope.parent=node;slope.position.y=-35.2;slope.isPickable=false;
  // the city's lights: a plane far below, scattered points (streets as lines), seen beyond the foot of the hill
  const cityTex=canvas(1024,1024,(g,w,h)=>{g.fillStyle='#02060a';g.fillRect(0,0,w,h);const cols=['#ffb347','#7fe9ff','#ff5ec4','#e8f6ff','#ffd28a'];
   for(let i=0;i<2600;i++){const x=rand()*w,y=rand()*h,c=cols[(rand()*cols.length)|0];g.fillStyle=c;g.globalAlpha=.35+rand()*.65;const s=2+rand()*4.5;g.fillRect(x,y,s,s);}g.globalAlpha=.4;g.lineWidth=3;for(let k=0;k<26;k++){g.strokeStyle=cols[k%cols.length];g.beginPath();const y=rand()*h;g.moveTo(0,y);g.lineTo(w,y+(rand()-.5)*160);g.stroke();g.beginPath();const x=rand()*w;g.moveTo(x,0);g.lineTo(x+(rand()-.5)*160,h);g.stroke();}g.globalAlpha=1;});
  const cityM=new B.StandardMaterial('tmp-city',scene);cityM.diffuseColor=B.Color3.Black();cityM.emissiveTexture=cityTex;cityM.disableLighting=true;cityM.fogEnabled=false;own.push(cityM);
  const cityPlane=B.MeshBuilder.CreateGround('tmp-city',{width:1100,height:1100},scene);cityPlane.material=cityM;cityPlane.parent=node;cityPlane.position.set(470,-72,-470);cityPlane.isPickable=false;
  // distant towers on the south-east arc, rising out of the glow
  {const facade=canvas(128,256,(g,w,h)=>{g.fillStyle='#0a161c';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=8)for(let x=0;x<w;x+=8){const r=rand();if(r<.22){g.fillStyle=r<.15?'rgba(255,200,120,.95)':'rgba(130,230,250,.95)';g.fillRect(x,y,6,6);}}});
   const sm=new B.StandardMaterial('tmp-skytower',scene);sm.diffuseColor=new B.Color3(.1,.16,.2);sm.emissiveTexture=facade;sm.specularColor=B.Color3.Black();sm.fogEnabled=false;own.push(sm);const list=[];
   for(let i=0;i<(low?40:80);i++){const a=(-80+rand()*92)*Math.PI/180,r=430+rand()*520,h=90+rand()*260*(.3+rand()),w=14+rand()*30,x=Math.cos(a)*r,z=Math.sin(a)*r;
    const b=B.MeshBuilder.CreateBox('tmp-skytower',{width:w,height:h,depth:w*(.6+rand()*.8)},scene);b.position.set(x,-72+h/2,z);b.rotation.y=rand()*3;b.material=sm;list.push(b);
    if(h>200&&i%3===0){const t=B.MeshBuilder.CreateBox('tmp-skyspire',{width:1.4,height:h*.25,depth:1.4},scene);t.position.set(x,-72+h+h*.12,z);t.material=sm;list.push(t);}}
   const m=B.Mesh.MergeMeshes(list,true,true,undefined,false,false);if(m){m.parent=node;m.material=sm;m.isPickable=false;}}
  // the city's glow rising into the mist: soft coloured bands over the south-east horizon
  {const gt=canvas(256,64,(g,w,h)=>{const gr=g.createLinearGradient(0,0,w,0);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(.2,'rgba(60,200,230,.34)');gr.addColorStop(.5,'rgba(255,120,190,.3)');gr.addColorStop(.8,'rgba(255,190,100,.3)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,w,h);const v=g.createLinearGradient(0,0,0,h);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(.62,'rgba(0,0,0,1)');v.addColorStop(1,'rgba(0,0,0,0)');g.globalCompositeOperation='destination-in';g.fillStyle=v;g.fillRect(0,0,w,h);});gt.hasAlpha=true;
   const gm=new B.StandardMaterial('tmp-cityglow',scene);gm.diffuseColor=B.Color3.Black();gm.emissiveTexture=gt;gm.opacityTexture=gt;gm.disableLighting=true;gm.backFaceCulling=false;gm.fogEnabled=false;gm.alphaMode=B.Engine.ALPHA_ADD;gm.disableDepthWrite=true;own.push(gm);
   for(const a of [-62,-38,-14]){const r=620,p=B.MeshBuilder.CreatePlane('tmp-cityglow',{width:760,height:240},scene);p.material=gm;p.parent=node;p.position.set(Math.cos(a*Math.PI/180)*r,-6,Math.sin(a*Math.PI/180)*r);p.billboardMode=B.Mesh.BILLBOARDMODE_Y;p.isPickable=false;}}
  // a horizon glow and a star dome
  {const glow=canvas(8,256,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(.6,'rgba(0,0,0,0)');gr.addColorStop(.88,'rgba(60,40,90,.35)');gr.addColorStop(1,'rgba(40,130,150,.5)');g.fillStyle=gr;g.fillRect(0,0,w,h);});
   const bm=new B.StandardMaterial('tmp-horizon',scene);bm.diffuseColor=B.Color3.Black();bm.emissiveTexture=glow;bm.opacityTexture=glow;bm.disableLighting=true;bm.backFaceCulling=false;bm.fogEnabled=false;own.push(bm);
   const h2=B.MeshBuilder.CreateCylinder('tmp-horizon',{diameter:1700,height:420,tessellation:32,sideOrientation:B.Mesh.BACKSIDE},scene);h2.material=bm;h2.parent=node;h2.position.y=60;h2.isPickable=false;h2.infiniteDistance=true;
   const stars=canvas(1024,512,(g,w,h)=>{g.fillStyle='rgba(0,0,0,0)';g.clearRect(0,0,w,h);for(let i=0;i<(low?220:520);i++){g.fillStyle='rgba(200,225,255,'+(.2+rand()*.7)+')';const s=rand()<.1?2:1;g.fillRect(rand()*w,rand()*h*.7,s,s);}});stars.hasAlpha=true;
   const sm2=new B.StandardMaterial('tmp-stars',scene);sm2.diffuseColor=B.Color3.Black();sm2.emissiveTexture=stars;sm2.opacityTexture=stars;sm2.disableLighting=true;sm2.backFaceCulling=false;sm2.fogEnabled=false;own.push(sm2);
   const dome=B.MeshBuilder.CreateSphere('tmp-stars',{diameter:1500,segments:16,sideOrientation:B.Mesh.BACKSIDE},scene);dome.material=sm2;dome.parent=node;dome.isPickable=false;dome.infiniteDistance=true;}
  // ---- the hall: layered 3D-printed walls (stacked bands, each a little in or out), ribs, lit seams ----
  const [hx0,hx1,hz0,hz1]=T.HALL,WT=.8,WH=13;
  const wallBands=(x0,x1,z0,z1,faceN)=>{const along=x1-x0>z1-z0,len=along?x1-x0:z1-z0;const bands=low?9:14,bh=WH/bands;for(let i=0;i<bands;i++){const o=(rand()-.5)*.22,y0=i*bh,r=along?[x0,x1,z0+o-.01,z1+o+.01]:[x0+o-.01,x1+o+.01,z0,z1];rbox(r,y0,y0+bh-.03,layer);}
   // a thin lit seam between two bands every few layers, so the print lines read as made, not painted
   for(const k of [3,7,11]){if(k>=bands)continue;const y=k*bh;if(along)box(len-.4,.04,.08,(x0+x1)/2,y,faceN>0?z1+.04:z0-.04,tealL);else box(.08,.04,len-.4,faceN>0?x1+.04:x0-.04,y,(z0+z1)/2,tealL);}
   for(let p=-len/2+3;p<len/2-1;p+=5){if(along)box(.5,WH,.4,(x0+x1)/2+p,WH/2,faceN>0?z1+.1:z0-.1,trim);else box(.4,WH,.5,faceN>0?x1+.1:x0-.1,WH/2,(z0+z1)/2+p,trim);}};
  // south wall (with the entrance gap), north, west, east (a window onto the city)
  wallBands(hx0,-3.5,hz0-WT/2,hz0+WT/2,-1);wallBands(3.5,hx1,hz0-WT/2,hz0+WT/2,-1);box(7,WH-9.5,WT,0,9.5+(WH-9.5)/2,hz0,layer);
  wallBands(hx0,hx1,hz1-WT/2,hz1+WT/2,1);wallBands(hx0-WT/2,hx0+WT/2,hz0,hz1,-1);
  // the east wall: solid below and above a long window (glass, so the player cannot step out)
  {const x=hx1,r0=[x-WT/2,x+WT/2,hz0,8],r1=[x-WT/2,x+WT/2,26,hz1];wallBands(...[r0[0],r0[1],r0[2],r0[3]],1);wallBands(r1[0],r1[1],r1[2],r1[3],1);rbox([x-WT/2,x+WT/2,8,26],0,1.2,layer);rbox([x-WT/2,x+WT/2,8,26],10,WH,layer);
   const glass=M('glass','#0a2a36','#0e4656',.7,.22);box(.12,8.8,18,x,5.6,17,glass,true);for(let z=8;z<=26;z+=3)box(.2,8.8,.18,x,5.6,z,trim);box(.2,.2,18.2,x,10,17,trim);box(.2,.2,18.2,x,1.2,17,trim);}
  // ceiling: beams, a coffered slab with an oculus (a round opening) over the dais
  for(let z=hz0+2;z<hz1;z+=6)box(hx1-hx0,.7,.9,0,12.2,z,trim);for(let x=hx0+3;x<hx1;x+=6)box(.9,.7,hz1-hz0,x,12.2,(hz0+hz1)/2,trim);
  {const ring=B.MeshBuilder.CreateTorus('tmp-oculus',{diameter:7.2,thickness:.5,tessellation:36},scene);put(ring,trim,T.DAIS.x,12.9,T.DAIS.z,false);
   for(const z of [hz0+.5,hz1-.5])box(hx1-hx0,.3,.3,0,12.9,z,trim);
   // the slab, built in two halves round the oculus (a cheap approximation: four boxes leave a square opening)
   rbox([hx0,hx1,hz0,T.DAIS.z-3.6],12.6,13.1,dark);rbox([hx0,hx1,T.DAIS.z+3.6,hz1],12.6,13.1,dark);rbox([hx0,-3.6,T.DAIS.z-3.6,T.DAIS.z+3.6],12.6,13.1,dark);rbox([3.6,hx1,T.DAIS.z-3.6,T.DAIS.z+3.6],12.6,13.1,dark);}
  // floor
  box(hx1-hx0,.1,hz1-hz0,0,-.04,(hz0+hz1)/2,floorM,true);
  // the oculus beam: a soft cone of pale blue light falling on the dais
  {const beamTex=canvas(4,128,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#fff');gr.addColorStop(.5,'#666');gr.addColorStop(1,'#000');g.fillStyle=gr;g.fillRect(0,0,w,h);});
   const bm=new B.StandardMaterial('tmp-beam',scene);bm.disableLighting=true;bm.emissiveColor=new B.Color3(.32,.55,.8);bm.diffuseColor=B.Color3.Black();bm.opacityTexture=beamTex;bm.opacityTexture.getAlphaFromRGB=true;bm.alpha=.28;bm.alphaMode=B.Engine.ALPHA_ADD;bm.backFaceCulling=false;bm.disableDepthWrite=true;own.push(bm);
   const cone=B.MeshBuilder.CreateCylinder('tmp-beam',{diameterTop:7,diameterBottom:5,height:12.4,tessellation:24,cap:B.Mesh.NO_CAP},scene);cone.material=bm;cone.parent=node;cone.position.set(T.DAIS.x,6.4,T.DAIS.z);cone.isPickable=false;}
  // ---- the dais: a round platform with concentric lit rings ----
  cyl(7.2,.5,T.DAIS.x,.25,T.DAIS.z,M('dais','#161e24','#080c10',.6),false,32);
  for(const [d,th,mat] of [[6.4,.05,tealL],[4.6,.04,tealL],[2.6,.04,blueW]]){const t=B.MeshBuilder.CreateTorus('tmp-ring',{diameter:d,thickness:th,tessellation:40},scene);put(t,mat,T.DAIS.x,.52,T.DAIS.z,true);}
  pool('#38e8ff',T.DAIS.x,T.DAIS.z,11,11,.5,.54);
  // ---- server pillars: dark racks with LED faces whose data scrolls up; a soft reflected glow under each on the floor ----
  const ledTex=canvas(64,256,(g,w,h)=>{g.fillStyle='#04080b';g.fillRect(0,0,w,h);for(let y=4;y<h;y+=9)for(let x=4;x<w-4;x+=8){const r=rand();if(r<.45){g.fillStyle=r<.2?'#38e8ff':r<.32?'#ffb347':'#7fe9ff';g.globalAlpha=.4+rand()*.6;g.fillRect(x,y,4,3);}}g.globalAlpha=1;});
  ledTex.wrapV=B.Texture.WRAP_ADDRESSMODE;ledTex.vScale=3;const ledM=new B.StandardMaterial('tmp-led',scene);ledM.diffuseColor=B.Color3.Black();ledM.specularColor=B.Color3.Black();ledM.emissiveTexture=ledTex;ledM.disableLighting=true;ledM.backFaceCulling=false;own.push(ledM);
  const reflect=canvas(64,256,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'rgba(56,232,255,.5)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,w,h);}),reflM=emissiveMat(reflect,true);reflM.alphaMode=B.Engine.ALPHA_ADD;reflM.disableDepthWrite=true;
  for(const [id,r,h] of T.PROPS.filter(p=>/^pillar/.test(p[0]))){const px=(r[0]+r[1])/2,pz=(r[2]+r[3])/2,sx=px<0?1:-1;rbox(r,0,h,M('rack','#10171c','#06090c',.5));rbox([r[0]-.08,r[1]+.08,r[2]-.08,r[3]+.08],0,.4,trim);rbox([r[0]-.08,r[1]+.08,r[2]-.08,r[3]+.08],h-.4,h,trim);
   // LED faces toward the centre aisle and the long sides
   const f1=put(B.MeshBuilder.CreatePlane('tmp-led',{width:1.5,height:h-1.2},scene),ledM,px+sx*.92,h/2,pz,true);f1.rotation.y=sx>0?TOE:TOW;
   const f2=put(B.MeshBuilder.CreatePlane('tmp-led',{width:1.5,height:h-1.2},scene),ledM,px,h/2,pz-.92,true);f2.rotation.y=TOS;const f3=put(B.MeshBuilder.CreatePlane('tmp-led',{width:1.5,height:h-1.2},scene),ledM,px,h/2,pz+.92,true);f3.rotation.y=TON;
   const rf=put(B.MeshBuilder.CreatePlane('tmp-reflect',{width:1.6,height:5},scene),reflM,px+sx*.2,.03,pz,true);rf.rotation.x=Math.PI/2;rf.position.x=px+sx*2.2;rf.scaling.x=1.2;}
  // ---- hanging cables: dark bundles from the beams, with little lights at their ends ----
  const cableM=M('cable','#05080a',null,.08);function cable(a,b,sag){const pts=[];for(let i=0;i<=10;i++){const t=i/10;pts.push(new B.Vector3(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t-Math.sin(Math.PI*t)*sag,a[2]+(b[2]-a[2])*t));}const m=B.MeshBuilder.CreateTube('tmp-cable',{path:pts,radius:.05,tessellation:5},scene);m.material=cableM;m.parent=node;m.isPickable=false;}
  for(let i=0;i<(low?10:22);i++){const x=-15+rand()*30,z=hz0+3+rand()*(hz1-hz0-6),x2=x+(rand()-.5)*6,z2=z+(rand()-.5)*6,y2=5+rand()*3.5;cable([x,12.2,z],[x2,y2,z2],.5+rand()*1.2);box(.14,.14,.14,x2,y2-.1,z2,rand()<.5?tealL:amber);}
  for(const [x,z] of [[-7,12],[7,12],[-7,28],[7,28]])cable([x*.6,12.2,z],[x,1.5,z],.8);
  // ---- data altars: low pylons with a sloped screen of scrolling text, a halo and a pool of light ----
  const altarFrames=[];[[-7,12,0],[7,12,1],[-7,28,2],[7,28,3]].forEach(([x,z,i])=>{rbox(T.PROPS.find(p=>p[0]==='altar-'+(i+1))[1],0,1.05,M('altar','#141c22','#070a0d',.5));
   const lines=['> INITIALISE','> LISTEN','> remember --all','> rest'],sc=sign(1,.7,x,1.45,z+(z<20?-.15:.15),z<20?TON:TOS,256,180,(g,w,h,t=0)=>{g.fillStyle='#03090c';g.fillRect(0,0,w,h);g.fillStyle='#38e8ff';g.font='bold 20px Consolas,monospace';g.textAlign='left';g.fillText('ALTAR '+(i+1),12,28);g.fillStyle='#9fe8ff';g.font='16px Consolas,monospace';for(let k=0;k<5;k++){const j=(Math.floor(t*.6)+k)%lines.length;g.globalAlpha=1-k*.18;g.fillText(lines[j]+(k===0?'_':''),12,60+k*22);}g.globalAlpha=1;},1.2);sc.rotation.x=z<20?.35:-.35;
   const ring=B.MeshBuilder.CreateTorus('tmp-halo',{diameter:1.5,thickness:.03,tessellation:30},scene);put(ring,tealL,x,1.15,z,true);pool('#38e8ff',x,z,5,5,.45,.04);});
  // ---- blue-flame incense: braziers in the courtyard and by the door; the flame is a few stretched emissive shapes that flicker ----
  const flames=[];for(const [id,r,h] of T.PROPS.filter(p=>/^(brazier|incense)/.test(p[0]))){const x=(r[0]+r[1])/2,z=(r[2]+r[3])/2;cyl(.8,.5,x,.35,z,metal,false,12,.6);cyl(.55,.18,x,.64,z,dark,false,12);
   const f=[];for(let k=0;k<3;k++){const s=B.MeshBuilder.CreateSphere('tmp-flame',{diameter:.34-k*.07,segments:6},scene);put(s,k===0?blueF:blueW,x,.95+k*.22,z,true);s.scaling.set(.8,1.6+k*.3,.8);f.push(s);}flames.push({f,x,z,p:rand()*6});pool('#5aa8ff',x,z,5,5,.55,.05);}
  // ---- the courtyard: a gate, lantern posts, the path, benches ----
  for(const [id,r,h] of T.PROPS.filter(p=>/^gate/.test(p[0]))){rbox(r,0,h,layer);rbox([r[0]-.15,r[1]+.15,r[2]-.15,r[3]+.15],0,.5,trim);rbox([r[0]-.15,r[1]+.15,r[2]-.15,r[3]+.15],h-.4,h,trim);}
  box(11.2,.9,.9,0,6.2,-30,layer);box(12,.25,1.2,0,6.8,-30,trim);box(10.4,.12,.12,0,5.7,-30.45,tealL);
  sign(7,.7,0,6.2,-30.48,TOS,512,60,(g,w,h)=>{g.fillStyle='#050a0d';g.fillRect(0,0,w,h);g.fillStyle='#9fe8ff';g.font='bold 30px Consolas,monospace';g.textAlign='center';g.textBaseline='middle';g.fillText('SANCTUM OF THE CIRCUIT',w/2,h/2+1);});
  for(const [x,z] of [[-5,-22],[5,-22],[-5,-12],[5,-12],[-3.5,-35],[3.5,-35]]){cyl(.14,3.4,x,1.7,z,metal,false,8);box(.34,.46,.34,x,3.5,z,blueW);pool('#5aa8ff',x,z,6,6,.4,.045);}
  for(const [id,r,h] of T.PROPS.filter(p=>/^bench/.test(p[0])))rbox(r,.4,.5,M('bench','#1d262c','#080b0d',.3)),rbox([r[0]+.2,r[0]+.4,r[2],r[3]],0,.4,metal),rbox([r[1]-.4,r[1]-.2,r[2],r[3]],0,.4,metal);
  // the overlook: a glass rail on the east edge, a sign
  {const r=T.PROPS.find(p=>p[0]==='overlook-rail')[1];rbox(r,0,1.1,M('rail','#10333f','#124452',.7,.35));rbox([r[0]-.05,r[1]+.05,r[2],r[3]],1.1,1.2,metal);sign(2.4,.5,41.2,1.9,-20,TOW,256,56,(g,w,h)=>{g.clearRect(0,0,w,h);g.fillStyle='#ffb347';g.shadowColor='#ffb347';g.shadowBlur=8;g.font='bold 24px Consolas,monospace';g.textAlign='center';g.textBaseline='middle';g.fillText('THE CITY BELOW',w/2,h/2);});pool('#ffb347',40,-20,6,8,.3,.04);}
  // parapet round the plateau
  for(const r of T.PARAPET){rbox(r,0,1.2,stone);}
  // stone path
  {const pm=M('path','#222c33','#0b1013',.5);box(6,.04,31,0,.025,-21.5,pm);box(40,.04,24,0,.02,-18,M('court','#1b242a','#090d10',.4));}
  // the taxi stop where the hill road ends: a parked road cab, a sign, a pool of light (the sky-cab ring is gone: sky cabs were scrapped, 16 Nov 2026)
  {const px=T.CAB_PAD.x,pz=T.CAB_PAD.z;pool('#38e8ff',px,pz,14,14,.5,.045);
   const builtCab=()=>{const paint=M('cabpaint','#c79a1c','#3d2e06',.5);box(2.4,.75,4.8,px,.8,pz,paint);box(2.1,.45,.8,px,.75,pz+2.75,paint);box(2.2,.9,3.1,px,1.5,pz+.1,M('cabglass','#071a20','#0e3a44',.6,.55));box(2.2,.08,3.1,px,2,pz+.1,paint);box(.9,.28,.4,px,2.25,pz+.1,M('cabsign','#ffd23f','#ffd23f'));
   for(const [dx,dz] of [[-1.2,1.55],[1.2,1.55],[-1.2,-1.55],[1.2,-1.55]])cyl(.7,.28,px+dx,.35,pz+dz,M('cabtyre','#08090a','#020203',.2)).rotation.z=Math.PI/2;};
   if(root.VoidRoadTaxiModel?.park)root.VoidRoadTaxiModel.park({scene,parent,x:px,z:pz,yaw:0,fallback:builtCab});else builtCab();   /* the modelled road cab (road-taxi-model.js); the built one on Low or if it is missing */
   sign(3.4,1.2,px,3.6,pz+4,TON,256,90,(g,w,h)=>{g.fillStyle='#04141a';g.fillRect(0,0,w,h);g.strokeStyle='#38e8ff';g.lineWidth=5;g.strokeRect(5,5,w-10,h-10);g.fillStyle='#fff';g.font='bold 30px Consolas,monospace';g.textAlign='center';g.textBaseline='middle';g.fillText('TAXI',w/2,34);g.fillStyle='#ffd23f';g.font='bold 20px Consolas,monospace';g.fillText('RETURN · E',w/2,64);});box(.25,3.6,.25,px,1.8,pz+4.2,metal);}
  // ---- mist: three slow, soft layers close to the ground ----
  const mistTex=canvas(256,256,(g,w,h)=>{g.fillStyle='rgba(0,0,0,0)';g.clearRect(0,0,w,h);for(let i=0;i<46;i++){const x=rand()*w,y=rand()*h,r=24+rand()*52,rg=g.createRadialGradient(x,y,1,x,y,r);rg.addColorStop(0,'rgba(120,170,200,.22)');rg.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=rg;g.fillRect(x-r,y-r,r*2,r*2);}});
  mistTex.hasAlpha=true;mistTex.wrapU=mistTex.wrapV=B.Texture.WRAP_ADDRESSMODE;const mists=[];for(let i=0;i<(low?2:3);i++){const m=new B.StandardMaterial('tmp-mist',scene);m.diffuseColor=B.Color3.Black();m.emissiveTexture=mistTex;m.opacityTexture=mistTex;m.disableLighting=true;m.backFaceCulling=false;m.alpha=.55-i*.12;m.disableDepthWrite=true;m.alphaMode=B.Engine.ALPHA_COMBINE;own.push(m);
   const p=B.MeshBuilder.CreateGround('tmp-mist',{width:100,height:100},scene);p.material=m;p.parent=node;p.position.y=.35+i*.55;p.isPickable=false;mistTex.uScale=mistTex.vScale=5;mists.push({m,sp:[.004+i*.002,.002-i*.001]});}
  // ---- Zen Zephyr: a seated android monk (primitives; replace through temple.js MODEL) ----
  const monk=new B.TransformNode('zen-zephyr',scene);monk.parent=node;monk.position.set(T.MODEL.seat[0],.5,T.MODEL.seat[1]);monk.rotation.y=T.MODEL.yaw;
  const mp=(mesh,mat,x,y,z)=>{mesh.material=mat;mesh.parent=monk;mesh.position.set(x,y,z);mesh.isPickable=false;return mesh;};
  const robe=M('robe','#151a1f','#07090b',.15),robeL=M('robeL','#1d242a','#0a0d10',.2),sash=M('sash','#b8892a','#3a2a08',.25),steel=M('steel','#8a96a0','#20262b',.8);
  mp(B.MeshBuilder.CreateCylinder('mk-legs',{diameter:1.7,height:.34,tessellation:20},scene),robe,0,.2,0);mp(B.MeshBuilder.CreateCylinder('mk-skirt',{diameterTop:.95,diameterBottom:1.5,height:.5,tessellation:20},scene),robeL,0,.5,.05);
  for(const s of [-1,1]){const k=mp(B.MeshBuilder.CreateCylinder('mk-knee',{diameter:.32,height:.7,tessellation:10},scene),robe,s*.55,.42,.5);k.rotation.z=Math.PI/2;k.rotation.y=s*.3;}
  const torso=mp(B.MeshBuilder.CreateCylinder('mk-torso',{diameterTop:.56,diameterBottom:.86,height:.86,tessellation:18},scene),robe,0,1.15,0);
  const sh=mp(B.MeshBuilder.CreateBox('mk-sash',{width:.18,height:.95,depth:.5},scene),sash,.05,1.15,.1);sh.rotation.z=.62;mp(B.MeshBuilder.CreateBox('mk-belt',{width:.86,height:.12,depth:.64},scene),sash,0,.82,.02);
  const lights=[[-.09,1.3],[0,1.22],[.09,1.3]].map(([x,y])=>mp(B.MeshBuilder.CreateBox('mk-chest',{width:.05,height:.05,depth:.03},scene),tealL,x,y,.33));
  for(const s of [-1,1]){mp(B.MeshBuilder.CreateSphere('mk-shoulder',{diameter:.3,segments:8},scene),steel,s*.42,1.46,0);mp(B.MeshBuilder.CreateCylinder('mk-arm',{diameter:.13,height:.42,tessellation:8},scene),robe,s*.46,1.2,.08).rotation.x=.35;
   const fa=mp(B.MeshBuilder.CreateCylinder('mk-forearm',{diameter:.11,height:.42,tessellation:8},scene),steel,s*.5,.98,.32);fa.rotation.x=1.15;mp(B.MeshBuilder.CreateTorus('mk-joint',{diameter:.16,thickness:.025,tessellation:12},scene),tealL,s*.47,1.1,.2);mp(B.MeshBuilder.CreateBox('mk-hand',{width:.12,height:.05,depth:.14},scene),steel,s*.52,.78,.5);}
  mp(B.MeshBuilder.CreateCylinder('mk-neck',{diameter:.16,height:.18,tessellation:10},scene),steel,0,1.62,0);for(const y of [1.58,1.64])mp(B.MeshBuilder.CreateTorus('mk-neckring',{diameter:.19,thickness:.018,tessellation:12},scene),metal,0,y,0).rotation.x=Math.PI/2;
  const head=new B.TransformNode('mk-head',scene);head.parent=monk;head.position.set(0,1.86,0);const hh=B.MeshBuilder.CreateSphere('mk-skull',{diameterX:.36,diameterY:.44,diameterZ:.4,segments:14},scene);hh.material=silver;hh.parent=head;hh.isPickable=false;
  for(const s of [-1,1]){const e=B.MeshBuilder.CreateBox('mk-eye',{width:.085,height:.012,depth:.01},scene);e.material=dark;e.parent=head;e.position.set(s*.075,.02,.195);e.isPickable=false;const ear=B.MeshBuilder.CreateCylinder('mk-ear',{diameter:.11,height:.03,tessellation:10},scene);ear.material=metal;ear.parent=head;ear.position.set(s*.19,0,0);ear.rotation.z=Math.PI/2;ear.isPickable=false;}
  const dot=B.MeshBuilder.CreateBox('mk-brow',{width:.03,height:.03,depth:.01},scene);dot.material=tealL;dot.parent=head;dot.position.set(0,.12,.2);dot.isPickable=false;
  pool('#38e8ff',T.MODEL.seat[0],T.MODEL.seat[1],3,3,.35,.56);
  // ---- flush static pieces by material ----
  for(const [mat,list] of groups){if(list.length>1){const merged=B.Mesh.MergeMeshes(list,true,true,undefined,false,false);if(merged){merged.parent=node;merged.material=mat;merged.isPickable=false;}}}
  // ---- exploration (V1 map) ----
  const space=Area?.get(T.ID),flags=state?.story?.flags,fog=space?Area.load(space,flags):null;let fogDirty=false,fogNext=0,fogSaved=0;
  let clock=0,last=null;
  function tick(time,player){
   if(disposed)return;const dt=last===null?0:Math.min(.1,Math.max(0,time-last));last=time;clock=time;
   ledTex.vOffset-=dt*.25;for(const m of mists){mistTex.uOffset+=0;}mistTex.uOffset+=dt*.004;mistTex.vOffset+=dt*.0025;
   // flames flicker; the monk breathes
   for(const fl of flames)fl.f.forEach((s,k)=>{const q=Math.sin(time*7+fl.p+k*1.9)*.5+Math.sin(time*11.3+fl.p*2+k)*.3;s.scaling.y=(1.5+k*.3)*(1+q*.14);s.scaling.x=s.scaling.z=.8*(1+q*.07);});
   const br=Math.sin(time*.9);torso.scaling.set(1+br*.012,1+br*.018,1+br*.012);head.rotation.x=br*.012;head.rotation.y=Math.sin(time*.23)*.05;for(const [i,l] of lights.entries())l.visibility=.7+.3*Math.sin(time*1.4+i);
   for(const s of screens)if(time>s.next){s.next=time+s.period;s.draw(s.t.getContext(),s.cw,s.ch,time);s.t.update();}
   if(fog&&player&&time>fogNext){fogNext=time+.5;if(fog.reveal(player.x,player.z,14)>0)fogDirty=true;if(fogDirty&&time>fogSaved+4){fogSaved=time;fogDirty=false;if(flags)Area.save(space,fog,flags);try{save();}catch{}}}}
  return {tick,fog,space,monk,head,flames,meshCount:()=>node.getChildMeshes().length,
   dispose(){if(disposed)return;disposed=true;if(fog&&flags){Area.save(space,fog,flags);try{save();}catch{}}node.dispose(false,true);for(const o of own)try{o.dispose();}catch{}own.length=0;
    scene.clearColor=prev.clear;scene.fogMode=prev.fogMode;scene.fogDensity=prev.fogDensity;scene.fogColor=prev.fogColor;ip.exposure=prev.exposure;ip.contrast=prev.contrast;if(prev.env!=null)scene.environmentIntensity=prev.env;
    if(sun&&lp.sun!=null)sun.intensity=lp.sun;if(ambient){if(lp.amb!=null)ambient.intensity=lp.amb;if(lp.dif)ambient.diffuse=lp.dif;if(lp.gnd&&ambient.groundColor)ambient.groundColor=lp.gnd;}}};
 }
 T.build=build;
})(typeof globalThis!=='undefined'?globalThis:this);
