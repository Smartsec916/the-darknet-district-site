/* ZEN ZEPHYR TEMPLE: the 3D build (browser only). Data is temple.js; the chat is zen-chat.js; the wiring and panel are temple-integration.js.
   build({scene,parent,quality,state}) -> {tick(time,player), dispose(), fog, monk, ...}. Called by the renderer when the walking location `temple` loads; the whole area is
   disposed when the player leaves (the cab room replaces it), so only one real place is ever loaded.
   Art direction (docs/VOID_RUNNER_ART_DIRECTION.md, PERMANENT DIRECTION; the owner's reference picture of Zen Zephyr's temple): a deep teal-green, misty hall; towering
   dark ribbed server columns with small cyan readouts and thin data strips; thin cables hanging from the vault; a wet, mirror-like stone floor with dark inlaid
   circuit and glyph lines; soft cold haze; a bright arched doorway behind the dais; the dais under an oculus. Warm accents only (candles, saffron cloth, prayer beads).
   Graphics pass 18 Nov 2026 (build 2026-11-18-temple-1): physically based surfaces from the game's own interior kit (void-runner/assets/textures/district-interior,
   the same files the District rooms use; nothing new is downloaded), a planar mirror on the hall floor (Medium and up, as Milked's floor), three real lights on
   Medium and five on High (oculus, doorway, candles; aisle fills on High), lit only for the hall's own meshes; Low keeps no extra light and no mirror. */
(function(root){
 'use strict';
 const T=root.VoidTemple;if(!T)return;
 const base=typeof document!=='undefined'&&document.currentScript?new URL('.',document.currentScript.src):null;   // the game's shared texture kit, relative to this script
 function build({scene,parent,quality,state}){
  const B=root.BABYLON,Area=root.VoidAreaMap,low=quality==='low',hi=quality==='high'||quality==='ultra',own=[],node=new B.TransformNode('temple',scene);node.parent=parent;let disposed=false;
  // ---- the night on the hill, and the hall's cold green haze (exp2 fog: the far end of the hall is softened, the skyline is not fogged) ----
  const ip=scene.imageProcessingConfiguration,prev={clear:scene.clearColor.clone(),fogMode:scene.fogMode,fogDensity:scene.fogDensity,fogColor:scene.fogColor.clone(),exposure:ip.exposure,contrast:ip.contrast,env:scene.environmentIntensity};
  scene.clearColor=new B.Color4(.008,.02,.026,1);scene.fogMode=B.Scene.FOGMODE_EXP2;scene.fogDensity=low?.011:.0135;scene.fogColor=new B.Color3(.05,.095,.095);ip.exposure=1.5;ip.contrast=1.2;scene.environmentIntensity=Math.min(prev.env??1,.35);
  const sun=scene.getLightByName('sun'),ambient=scene.getLightByName('ambient'),lp={sun:sun?.intensity,amb:ambient?.intensity,dif:ambient?.diffuse?.clone(),gnd:ambient?.groundColor?.clone()};
  if(sun)sun.intensity=.03;if(ambient){ambient.intensity=low?1.45:1.25;ambient.diffuse=new B.Color3(.34,.52,.52);if(ambient.groundColor)ambient.groundColor=new B.Color3(.06,.1,.1);}
  let seed=4417;const rand=()=>((seed=seed*16807%2147483647)-1)/2147483646;
  const mc=new Map(),M=(name,hex,em,spec=.2,alpha)=>{const k=name+hex+em+alpha;if(mc.has(k))return mc.get(k);const m=new B.StandardMaterial('tmp-'+name,scene);m.diffuseColor=B.Color3.FromHexString(hex);m.specularColor=new B.Color3(spec,spec,spec*1.1);m.specularPower=40;if(em)m.emissiveColor=B.Color3.FromHexString(em);if(alpha!=null){m.alpha=alpha;m.backFaceCulling=false;}m.maxSimultaneousLights=6;own.push(m);mc.set(k,m);return m;};
  const G=(name,hex,k=1)=>{const key='g'+name+hex+k;if(mc.has(key))return mc.get(key);const m=new B.StandardMaterial('tmp-'+name,scene);m.diffuseColor=B.Color3.Black();m.specularColor=B.Color3.Black();m.emissiveColor=B.Color3.FromHexString(hex).scale(k);m.disableLighting=true;own.push(m);mc.set(key,m);return m;};
  // Physically based surfaces. Medium and up: the interior kit's colour, normal and occlusion/roughness/metal maps (shared files, cached by the browser); Low: plain colours.
  // `self` is a small share of the surface's own colour given back, so dark never reads as black where no lamp reaches (as district-rooms.js does).
  const kitTex=new Map(),kit=(name,kind,scale)=>{const key=name+kind+scale;if(kitTex.has(key))return kitTex.get(key);const rel='assets/textures/district-interior/'+name+'_'+kind+'.jpg',t=new B.Texture(base?new URL(rel,base).href:rel,scene,false,true);
   t.wrapU=t.wrapV=B.Texture.WRAP_ADDRESSMODE;t.uScale=t.vScale=scale;own.push(t);kitTex.set(key,t);return t;};
  const P=(name,hex,{rough=.6,metal=.2,set=null,scale=1,self=.12,bump=1,albedo=null}={})=>{const key='p'+name;if(mc.has(key))return mc.get(key);const m=new B.PBRMaterial('tmp-'+name,scene),c=B.Color3.FromHexString(hex);
   m.albedoColor=low?c.scale(.36):c;m.roughness=rough;m.metallic=metal;m.usePhysicalLightFalloff=false;m.maxSimultaneousLights=6;m.emissiveColor=c.scale(low?self*.4:self);   /* Low's sky light shows a plain colour about twice as bright (district-rooms.js), so Low takes a darker share */
   if(albedo)m.albedoTexture=albedo;
   if(set&&!low){if(!albedo)m.albedoTexture=kit(set,'color',scale);m.bumpTexture=kit(set,'normal',scale);m.bumpTexture.level=bump;m.metallicTexture=kit(set,'orm',scale);m.useAmbientOcclusionFromMetallicTextureRed=true;m.useRoughnessFromMetallicTextureGreen=true;m.useMetallnessFromMetallicTextureBlue=true;}
   own.push(m);mc.set(key,m);return m;};
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
  const pools=[],pool=(hex,x,z,w,d,k=.5,y=.05)=>{const g=B.MeshBuilder.CreateGround('tmp-pool',{width:w,height:d},scene);g.material=wash(hex);g.parent=node;g.position.set(x,y,z);g.isPickable=false;g.visibility=k/.5;pools.push(g);return g;};
  // ---- materials ----
  const stoneTex=canvas(256,256,(g,w,h)=>{g.fillStyle='#1a2026';g.fillRect(0,0,w,h);for(let i=0;i<1600;i++){g.fillStyle='rgba('+(24+rand()*30|0)+','+(32+rand()*30|0)+','+(40+rand()*30|0)+','+(.12+rand()*.25)+')';g.fillRect(rand()*w,rand()*h,1+rand()*2,1+rand()*2);}g.strokeStyle='rgba(2,5,8,.8)';g.lineWidth=2;for(let i=0;i<=4;i++){g.beginPath();g.moveTo(i*64,0);g.lineTo(i*64,h);g.stroke();g.beginPath();g.moveTo(0,i*64);g.lineTo(w,i*64);g.stroke();}});
  stoneTex.wrapU=stoneTex.wrapV=B.Texture.WRAP_ADDRESSMODE;stoneTex.uScale=stoneTex.vScale=16;const stone=new B.StandardMaterial('tmp-stone',scene);stone.diffuseTexture=stoneTex;stone.specularColor=new B.Color3(.35,.45,.5);stone.specularPower=70;own.push(stone);
  // the walls' printed layers: thin stacked bands, each with a dark seam (the print lines), worn in places
  const layerTex=canvas(256,256,(g,w,h)=>{g.fillStyle='#4a5556';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=6){const v=60+rand()*34|0;g.fillStyle='rgb('+v+','+(v+10)+','+(v+9)+')';g.fillRect(0,y,w,4);g.fillStyle='rgba(0,0,0,.55)';g.fillRect(0,y+4,w,2);}
   for(let i=0;i<500;i++){g.fillStyle='rgba('+(rand()<.5?'20,30,30':'120,140,135')+','+(.05+rand()*.12)+')';g.fillRect(rand()*w,rand()*h,2+rand()*10,1);}});
  layerTex.wrapU=layerTex.wrapV=B.Texture.WRAP_ADDRESSMODE;
  const layer=P('layer','#5d6b6a',{rough:.82,metal:.05,set:'kit_concrete',scale:3,self:.07,bump:.8,albedo:layerTex});
  const trim=P('trim','#2f3a3c',{rough:.45,metal:.55,set:'kit_gunmetal',scale:1.5,self:.09}),dark=P('dark','#0b1012',{rough:.7,metal:.3,self:.04}),metal=P('metal','#3b4447',{rough:.42,metal:.8,set:'kit_steel',scale:1,self:.07}),
   silver=M('silver','#aeb9c2','#2a3138',.85),tealL=G('teal','#38e8ff',.85),tealD=G('tealD','#2fc7d8',.32),blueF=G('flame','#5aa8ff',1),blueW=G('flameW','#bfe6ff',1),amber=G('amber','#e0a436',.7),readout=G('readout','#8ff2ff',.75);
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
  // ---- the hall: layered 3D-printed walls (stacked bands, each a little in or out), ribs, a faint seam of light every few layers ----
  const [hx0,hx1,hz0,hz1]=T.HALL,WT=.8,WH=13,hall=[];   // `hall`: the meshes the hall's own lights and floor mirror are for (filled after the merge)
  const wallBands=(x0,x1,z0,z1,faceN)=>{const along=x1-x0>z1-z0,len=along?x1-x0:z1-z0;const bands=low?9:14,bh=WH/bands;for(let i=0;i<bands;i++){const o=(rand()-.5)*.22,y0=i*bh,r=along?[x0,x1,z0+o-.01,z1+o+.01]:[x0+o-.01,x1+o+.01,z0,z1];rbox(r,y0,y0+bh-.03,layer);}
   // a thin dim seam between two bands every few layers, so the print lines read as made, not painted (accent, not an outline)
   for(const k of [3,7]){if(k>=bands)continue;const y=k*bh;if(along)box(len-.4,.03,.06,(x0+x1)/2,y,faceN>0?z1+.04:z0-.04,tealD);else box(.06,.03,len-.4,faceN>0?x1+.04:x0-.04,y,(z0+z1)/2,tealD);}
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
   // the slab, built in four pieces round the oculus (a square opening; the ring above rounds it off)
   rbox([hx0,hx1,hz0,T.DAIS.z-3.6],12.6,13.1,dark);rbox([hx0,hx1,T.DAIS.z+3.6,hz1],12.6,13.1,dark);rbox([hx0,-3.6,T.DAIS.z-3.6,T.DAIS.z+3.6],12.6,13.1,dark);rbox([3.6,hx1,T.DAIS.z-3.6,T.DAIS.z+3.6],12.6,13.1,dark);}
  // ---- the floor: dark polished stone slabs with inlaid circuit lines; Medium and up mirror the hall in it (a planar reflection, as Milked's floor), Low paints a glow under each lit thing ----
  const floorTex=canvas(1024,1024,(g,w,h)=>{g.fillStyle='#223236';g.fillRect(0,0,w,h);
   for(let i=0;i<3000;i++){g.fillStyle='rgba('+(rand()<.5?'10,18,20':'70,92,94')+','+(.04+rand()*.08)+')';g.fillRect(rand()*w,rand()*h,1+rand()*3,1+rand()*3);}   // grain
   const cell=w/18;g.strokeStyle='rgba(4,8,9,.9)';g.lineWidth=2;for(let i=0;i<=18;i++){g.beginPath();g.moveTo(i*cell,0);g.lineTo(i*cell,h);g.stroke();g.beginPath();g.moveTo(0,i*cell*1.11);g.lineTo(w,i*cell*1.11);g.stroke();}   // slab joints, about 2 m
   // inlaid traces: right-angled runs with small pads, dark metal set into the stone
   g.lineCap='square';for(let k=0;k<70;k++){let x=Math.round(rand()*18)*cell,y=Math.round(rand()*18)*cell*1.11;g.strokeStyle='rgba(3,6,7,.95)';g.lineWidth=rand()<.3?4:2.5;g.beginPath();g.moveTo(x,y);
    for(let s=0;s<3+rand()*4;s++){if(s%2)x+=(rand()-.5)*cell*4;else y+=(rand()-.5)*cell*4;g.lineTo(x,y);}g.stroke();g.fillStyle='rgba(3,6,7,.95)';g.fillRect(x-5,y-5,10,10);}});
  const floorM=new B.StandardMaterial('tmp-floor',scene);floorM.diffuseTexture=floorTex;floorM.specularColor=new B.Color3(.55,.7,.7);floorM.specularPower=180;floorM.emissiveColor=new B.Color3(.012,.026,.028);floorM.maxSimultaneousLights=6;own.push(floorM);
  const floor=B.MeshBuilder.CreateGround('tmp-floor',{width:hx1-hx0,height:hz1-hz0},scene);floor.material=floorM;floor.parent=node;floor.position.set(0,.012,(hz0+hz1)/2);floor.isPickable=false;floor.receiveShadows=false;
  let mirror=null;if(!low){mirror=new B.MirrorTexture('temple-floor-mirror',{ratio:hi?.75:.5},scene,true,0,B.Texture.TRILINEAR_SAMPLINGMODE);mirror.mirrorPlane=new B.Plane(0,-1,0,.012);mirror.clearColor=new B.Color4(.02,.04,.042,1);
   mirror.renderList=[];mirror.level=.62;mirror.gammaSpace=!ip.applyByPostProcess;own.push(mirror);floorM.reflectionTexture=mirror;floorM.diffuseColor=new B.Color3(.62,.72,.72);}else floorM.diffuseColor=new B.Color3(.5,.58,.58);
  // the dais's inlay: dark glyph rings and spokes set into the floor round it (the reference picture's engraved floor), not lit lines
  {const gt=canvas(512,512,(g,w,h)=>{g.clearRect(0,0,w,h);g.strokeStyle='rgba(2,5,6,.92)';g.fillStyle='rgba(2,5,6,.92)';const c=w/2;
    for(const [r,lw] of [[248,5],[226,2],[196,6],[172,2]]){g.lineWidth=lw;g.beginPath();g.arc(c,c,r,0,7);g.stroke();}
    for(let i=0;i<64;i++){const a=i/64*Math.PI*2,r0=200,r1=i%4?222:244;g.lineWidth=i%4?2:4;g.beginPath();g.moveTo(c+Math.cos(a)*r0,c+Math.sin(a)*r0);g.lineTo(c+Math.cos(a)*r1,c+Math.sin(a)*r1);g.stroke();}
    for(let i=0;i<24;i++){const a=i/24*Math.PI*2+.07;g.save();g.translate(c+Math.cos(a)*184,c+Math.sin(a)*184);g.rotate(a+Math.PI/2);const k=i%3;if(k===0)g.fillRect(-6,-3,12,6);else if(k===1){g.beginPath();g.arc(0,0,5,0,7);g.fill();}else{g.fillRect(-7,-1.5,14,3);g.fillRect(-1.5,-5,3,10);}g.restore();}
    for(const a of [Math.PI/2,-Math.PI/2,0,Math.PI]){g.lineWidth=3;g.beginPath();g.moveTo(c+Math.cos(a)*250,c+Math.sin(a)*250);g.lineTo(c+Math.cos(a)*(a===Math.PI/2||a===-Math.PI/2?w:300),c+Math.sin(a)*(a===Math.PI/2||a===-Math.PI/2?w:300));g.stroke();}});
   gt.hasAlpha=true;const gm=new B.StandardMaterial('tmp-glyph',scene);gm.diffuseTexture=gt;gm.useAlphaFromDiffuseTexture=true;gm.specularColor=new B.Color3(.3,.38,.38);gm.specularPower=120;gm.diffuseColor=new B.Color3(.2,.24,.24);gm.zOffset=-2;gm.maxSimultaneousLights=6;own.push(gm);
   const gp=B.MeshBuilder.CreateGround('tmp-glyph',{width:13,height:13},scene);gp.material=gm;gp.parent=node;gp.position.set(T.DAIS.x,.016,T.DAIS.z);gp.isPickable=false;}
  // the oculus beam: a soft cone of pale light falling on the dais
  {const beamTex=canvas(4,128,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#fff');gr.addColorStop(.5,'#666');gr.addColorStop(1,'#000');g.fillStyle=gr;g.fillRect(0,0,w,h);});
   const bm=new B.StandardMaterial('tmp-beam',scene);bm.disableLighting=true;bm.emissiveColor=new B.Color3(.38,.62,.66);bm.diffuseColor=B.Color3.Black();bm.opacityTexture=beamTex;bm.opacityTexture.getAlphaFromRGB=true;bm.alpha=.14;bm.alphaMode=B.Engine.ALPHA_ADD;bm.backFaceCulling=false;bm.disableDepthWrite=true;own.push(bm);
   const cone=B.MeshBuilder.CreateCylinder('tmp-beam',{diameterTop:7,diameterBottom:5,height:12.4,tessellation:24,cap:B.Mesh.NO_CAP},scene);cone.material=bm;cone.parent=node;cone.position.set(T.DAIS.x,6.4,T.DAIS.z);cone.isPickable=false;}
  // ---- the dais: a round platform of dark polished stone, two steps, a thin lit edge (one accent, not rings of neon) ----
  {const daisM=P('dais','#1d2629',{rough:.28,metal:.35,set:'kit_tile',scale:2,self:.05});cyl(7.2,.32,T.DAIS.x,.16,T.DAIS.z,daisM,false,40);cyl(6.2,.5,T.DAIS.x,.25,T.DAIS.z,daisM,false,40);
   const t=B.MeshBuilder.CreateTorus('tmp-ring',{diameter:6.24,thickness:.035,tessellation:48},scene);put(t,tealD,T.DAIS.x,.5,T.DAIS.z,false);}
  pool('#38e8ff',T.DAIS.x,T.DAIS.z,10,10,low?.42:.26,.54);
  // ---- server pillars: towering dark ribbed columns (collars, a plinth and a capital), thin strips where data flows, small cyan readouts ----
  const ledTex=canvas(32,512,(g,w,h)=>{g.fillStyle='#020506';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=5)for(let x=3;x<w-3;x+=7){const r=rand();if(r<.3){g.fillStyle=r<.17?'#5fe6f2':r<.22?'#e6a64a':'#a8f4ff';g.globalAlpha=.25+rand()*.6;g.fillRect(x,y,4,2+(rand()<.2?6:0));}}g.globalAlpha=1;});
  ledTex.wrapV=B.Texture.WRAP_ADDRESSMODE;ledTex.vScale=2;const ledM=new B.StandardMaterial('tmp-led',scene);ledM.diffuseColor=B.Color3.Black();ledM.specularColor=B.Color3.Black();ledM.emissiveTexture=ledTex;ledTex.level=1.35;ledM.disableLighting=true;own.push(ledM);
  const rackM=P('rack','#2f3a3c',{rough:.42,metal:.45,set:'kit_gunmetal',scale:1,self:.11}),collarM=P('collar','#465356',{rough:.34,metal:.6,set:'kit_steel',scale:1,self:.1});
  const reflect=low?canvas(64,256,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'rgba(56,232,255,.4)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,w,h);}):null,reflM=reflect?emissiveMat(reflect,true):null;if(reflM){reflM.alphaMode=B.Engine.ALPHA_ADD;reflM.disableDepthWrite=true;}
  const PH=12.6;
  for(const [id,r] of T.PROPS.filter(p=>/^pillar/.test(p[0]))){const px=(r[0]+r[1])/2,pz=(r[2]+r[3])/2,sx=px<0?1:-1,inward=Math.atan2(-px,0);   // inward: the angle that faces the centre aisle
   cyl(1.95,.7,px,.35,pz,trim,false,24);cyl(1.55,PH,px,PH/2,pz,rackM,false,24);cyl(2.1,.6,px,PH-.3,pz,trim,false,24);
   for(const y of [2.7,5.6,8.5,11.2])cyl(1.82,.26,px,y,pz,collarM,false,24);
   // vertical ribs round the shaft (the reference's fluted server columns)
   for(let k=0;k<(low?8:12);k++){const a=(k+.5)/(low?8:12)*Math.PI*2,rb=box(.09,PH-1.4,.12,px+Math.sin(a)*.79,PH/2,pz+Math.cos(a)*.79,rackM);rb.rotation.y=a;}
   // three data strips toward the aisle, and two readouts on each collar
   for(const da of [-.5,0,.5]){const a=inward+da,s=box(.13,8.4,.05,px+Math.sin(a)*.86,6.4,pz+Math.cos(a)*.86,ledM);s.rotation.y=a;}
   for(const y of [2.7,5.6,8.5,11.2])for(const da of [-.28,.28]){const a=inward+da,rd=box(.2,.06,.02,px+Math.sin(a)*.92,y,pz+Math.cos(a)*.92,readout);rd.rotation.y=a;}
   if(reflM){const rf=put(B.MeshBuilder.CreatePlane('tmp-reflect',{width:1.4,height:4},scene),reflM,px+sx*2,.03,pz,true);rf.rotation.x=Math.PI/2;}
   else pool('#2fc7d8',px+sx*1.4,pz,3,3,.16,.03);}
  // ---- hanging cables: thin strands dropping from the vault, a few with a small light; a few heavier bundles sagging between beams ----
  const cableM=P('cable','#07090a',{rough:.5,metal:.1,self:.02});function cable(a,b,sag){const pts=[];for(let i=0;i<=10;i++){const t=i/10;pts.push(new B.Vector3(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t-Math.sin(Math.PI*t)*sag,a[2]+(b[2]-a[2])*t));}const m=B.MeshBuilder.CreateTube('tmp-cable',{path:pts,radius:.045,tessellation:5},scene);put(m,cableM,0,0,0);}
  for(let i=0;i<(low?6:10);i++){const x=-15+rand()*30,z=hz0+3+rand()*(hz1-hz0-6),x2=x+(rand()-.5)*6,z2=z+(rand()-.5)*6;cable([x,12.2,z],[x2,11.6,z2],1.2+rand()*1.8);}
  {let n=0;for(let i=0;i<(low?24:hi?70:48)&&n<200;i++){n++;const x=-16+rand()*32,z=hz0+2+rand()*(hz1-hz0-4);if(Math.hypot(x-T.DAIS.x,z-T.DAIS.z)<4.6||Math.abs(x)<2.2&&z<17){i--;continue;}   // never over the dais or the aisle
   const len=1.5+rand()*(rand()<.3?7:4.5),th=.018+rand()*.03;cyl(th,len,x,12.6-len/2,z,cableM,false,4);if(rand()<.32)box(.06,.06,.06,x,12.6-len-.04,z,rand()<.75?readout:amber);}}
  for(const [x,z] of [[-7,12],[7,12],[-7,28],[7,28]])cable([x*.6,12.2,z],[x,1.5,z],.8);
  // ---- the arched doorway behind the dais: a bright cold opening in the north wall, its light spilling across the floor ----
  {const ax=0,az=hz1-WT/2-.2,aw=4.4,ah=7.6;   // in front of the wall's printed bands (each stands up to 0.12 m proud)
   const at=canvas(256,448,(g,w,h)=>{g.clearRect(0,0,w,h);g.save();g.beginPath();g.moveTo(0,h);g.lineTo(0,w/2);g.arc(w/2,w/2,w/2,Math.PI,0);g.lineTo(w,h);g.closePath();g.clip();
    const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#5d8f8c');gr.addColorStop(.55,'#a9d6cf');gr.addColorStop(1,'#e8fbf6');g.fillStyle=gr;g.fillRect(0,0,w,h);
    g.fillStyle='rgba(30,60,60,.35)';for(const x of [.18,.34,.66,.82])g.fillRect(w*x-3,h*.32,6,h*.68);   // far columns beyond the door, softened by haze
    const v=g.createRadialGradient(w/2,h*.8,10,w/2,h*.7,h*.7);v.addColorStop(0,'rgba(255,255,255,.4)');v.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=v;g.fillRect(0,0,w,h);g.restore();});
   at.hasAlpha=true;const am=emissiveMat(at,true);at.level=low?1.1:1.35;
   const door=put(B.MeshBuilder.CreatePlane('tmp-arch',{width:aw,height:ah},scene),am,ax,ah/2,az,true);door.rotation.y=TOS;
   // the frame: two jambs and a round head of dark steel, set a little proud of the wall
   for(const s of [-1,1])box(.42,ah-aw/2+.2,.5,ax+s*(aw/2+.21),(ah-aw/2+.2)/2,az-.18,trim);
   {const pts=[];for(let i=0;i<=24;i++){const a=Math.PI*i/24;pts.push(new B.Vector3(ax+Math.cos(a)*(aw/2+.21),ah-aw/2+Math.sin(a)*(aw/2+.21),az-.18));}put(B.MeshBuilder.CreateTube('tmp-arch-head',{path:pts,radius:.24,tessellation:8},scene),trim,0,0,0);}
   pool('#bff5ec',ax,az-4.2,7,9,low?.45:.32,.03);
   // two saffron banners either side of the door (warm accent), on short rods
   const cloth=P('saffron','#b8741a',{rough:.92,metal:0,set:'kit_canvas',scale:1.5,self:.1,bump:.6});for(const s of [-1,1]){box(.95,4.8,.03,ax+s*4.1,7.2,az-.12,cloth);box(1.15,.06,.06,ax+s*4.1,9.65,az-.16,metal);box(.95,.18,.035,ax+s*4.1,4.86,az-.13,P('saffronD','#6e3f0c',{rough:.9,metal:0,self:.06}));}}
  // ---- cold haze: tall soft sheets of mist standing in the hall, brighter near the floor (Medium and up add more depth) ----
  {const ht=canvas(64,256,(g,w,h)=>{g.clearRect(0,0,w,h);const gr=g.createLinearGradient(0,h,0,0);gr.addColorStop(0,'rgba(120,190,180,.55)');gr.addColorStop(.35,'rgba(90,160,150,.22)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,w,h);
    const sd=g.createLinearGradient(0,0,w,0);sd.addColorStop(0,'rgba(0,0,0,1)');sd.addColorStop(.3,'rgba(0,0,0,0)');sd.addColorStop(.7,'rgba(0,0,0,0)');sd.addColorStop(1,'rgba(0,0,0,1)');g.globalCompositeOperation='destination-out';g.fillStyle=sd;g.fillRect(0,0,w,h);});
   ht.hasAlpha=true;const hm=new B.StandardMaterial('tmp-haze',scene);hm.diffuseColor=B.Color3.Black();hm.emissiveTexture=ht;hm.opacityTexture=ht;hm.disableLighting=true;hm.backFaceCulling=false;hm.alphaMode=B.Engine.ALPHA_ADD;hm.disableDepthWrite=true;hm.alpha=low?.35:.45;own.push(hm);
   const spots=[[0,31,9],[-8,26,8],[8,26,8],[-14,8,9],[14,8,9],[0,4,10],[-9,-2,7],[9,-2,7]].slice(0,low?3:8);
   for(const [x,z,w] of spots){const p=B.MeshBuilder.CreatePlane('tmp-haze',{width:w,height:9},scene);p.material=hm;p.parent=node;p.position.set(x,4.2,z);p.billboardMode=B.Mesh.BILLBOARDMODE_Y;p.isPickable=false;}}
  // ---- data altars: low pylons with a sloped screen of scrolling text, a string of prayer beads, candles ----
  const waxM=P('wax','#c9b48c',{rough:.55,metal:0,self:.06}),beadM=P('bead','#2a1810',{rough:.35,metal:.05,self:.05}),warmF=G('candle','#ffb45a',1.15),candles=[];
  const candleCluster=(x,z,n,r,y=0)=>{for(let i=0;i<n;i++){const a=rand()*Math.PI*2,d=rand()*r,cx=x+Math.cos(a)*d,cz=z+Math.sin(a)*d,h=.08+rand()*.22;cyl(.05+rand()*.04,h,cx,y+h/2,cz,waxM,false,8);
    const f=put(B.MeshBuilder.CreateSphere('tmp-candle',{diameter:.035,segments:4},scene),warmF,cx,y+h+.03,cz);f.scaling.y=2.2;}candles.push([x,z,y]);};
  const altarM=P('altar','#1a2224',{rough:.4,metal:.6,set:'kit_gunmetal',scale:1,self:.05});
  [[-7,12,0],[7,12,1],[-7,28,2],[7,28,3]].forEach(([x,z,i])=>{rbox(T.PROPS.find(p=>p[0]==='altar-'+(i+1))[1],0,1.05,altarM);
   const lines=['> INITIALISE','> LISTEN','> remember --all','> rest'],sc=sign(1,.7,x,1.45,z+(z<20?-.15:.15),z<20?TON:TOS,256,180,(g,w,h,t=0)=>{g.fillStyle='#03090a';g.fillRect(0,0,w,h);g.fillStyle='#5fd8e6';g.font='bold 20px Consolas,monospace';g.textAlign='left';g.fillText('ALTAR '+(i+1),12,28);g.fillStyle='#8fd8e2';g.font='16px Consolas,monospace';for(let k=0;k<5;k++){const j=(Math.floor(t*.6)+k)%lines.length;g.globalAlpha=.85-k*.16;g.fillText(lines[j]+(k===0?'_':''),12,60+k*22);}g.globalAlpha=1;},1.2);sc.rotation.x=z<20?.35:-.35;sc.material.emissiveTexture.level=.8;
   // a loop of dark wooden prayer beads laid on the top, a larger bead and a short saffron tassel
   for(let k=0;k<27;k++){const a=k/27*Math.PI*2;put(B.MeshBuilder.CreateSphere('tmp-bead',{diameter:.034,segments:4},scene),beadM,x+Math.cos(a)*.2+(z<20?.18:-.18),1.07,z+Math.sin(a)*.12+(z<20?.32:-.32));}
   box(.05,.05,.05,x+.4,1.075,z+(z<20?.32:-.32),beadM);box(.03,.1,.03,x+.45,1.05,z+(z<20?.32:-.32),P('saffron','#b8741a'));
   candleCluster(x+(x<0?-.85:.85),z,5,.3);pool('#38e8ff',x,z,4,4,low?.38:.22,.04);});
  // ---- warm accents round the dais: candles on the lower step, a saffron runner up the aisle to it ----
  for(const [x,z] of [[-2.6,18.8],[2.6,18.8],[-3.3,20.4],[3.3,20.4]])candleCluster(x,z,6,.28,.32);
  {const runner=P('runner','#a8661a',{rough:.95,metal:0,set:'kit_canvas',scale:.8,self:.08,bump:.7});box(1.3,.02,9.6,0,.023,13.4,runner);for(const s of [-1,1])box(.08,.022,9.6,s*.62,.024,13.4,P('saffronD','#6e3f0c'));
   pool('#ffb45a',0,19.3,6,3.2,low?.3:.2,.035);}
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
  if(root.VoidTempleWall?.build)root.VoidTempleWall.build({scene,parent:node,quality,own,mats:{layer,trim,dark}});else for(const r of T.PARAPET){rbox(r,0,1.2,stone);}   // the monastery wall at the edge (temple-wall.js, 18 Nov 2026); the old parapet if it is missing
  // stone path
  {const pm=M('path','#222c33','#0b1013',.5);box(6,.04,31,0,.025,-21.5,pm);box(40,.04,24,0,.02,-18,M('court','#1b242a','#090d10',.4));}
  // the taxi stop where the hill road ends: a parked road cab, a sign, a pool of light (the sky-cab ring is gone: sky cabs were scrapped, 16 Nov 2026)
  {const px=T.CAB_PAD.x,pz=T.CAB_PAD.z;pool('#38e8ff',px,pz,14,14,.5,.045);
   const paint=M('cabpaint','#c79a1c','#3d2e06',.5);box(2.4,.75,4.8,px,.8,pz,paint);box(2.1,.45,.8,px,.75,pz+2.75,paint);box(2.2,.9,3.1,px,1.5,pz+.1,M('cabglass','#071a20','#0e3a44',.6,.55));box(2.2,.08,3.1,px,2,pz+.1,paint);box(.9,.28,.4,px,2.25,pz+.1,M('cabsign','#ffd23f','#ffd23f'));
   for(const [dx,dz] of [[-1.2,1.55],[1.2,1.55],[-1.2,-1.55],[1.2,-1.55]])cyl(.7,.28,px+dx,.35,pz+dz,M('cabtyre','#08090a','#020203',.2)).rotation.z=Math.PI/2;
   sign(3.4,1.2,px,3.6,pz+4,TON,256,90,(g,w,h)=>{g.fillStyle='#04141a';g.fillRect(0,0,w,h);g.strokeStyle='#38e8ff';g.lineWidth=5;g.strokeRect(5,5,w-10,h-10);g.fillStyle='#fff';g.font='bold 30px Consolas,monospace';g.textAlign='center';g.textBaseline='middle';g.fillText('TAXI',w/2,34);g.fillStyle='#ffd23f';g.font='bold 20px Consolas,monospace';g.fillText('RETURN · E',w/2,64);});box(.25,3.6,.25,px,1.8,pz+4.2,metal);
   // the way back on foot (the East Gate's walkers' lane, 16 Nov 2026): a sign on a post beside the stop, and a strip of path to it
   {const wx=T.WALK_BACK.x,wz=T.WALK_BACK.z;box(2.2,.04,5,wx,.03,wz+2.2,M('path','#222c33','#0b1013',.5));
    sign(2.6,1,wx,2.9,wz-1.2,TON,256,98,(g,w,h)=>{g.fillStyle='#04141a';g.fillRect(0,0,w,h);g.strokeStyle='#38e8ff';g.lineWidth=5;g.strokeRect(5,5,w-10,h-10);g.fillStyle='#fff';g.font='bold 30px Consolas,monospace';g.textAlign='center';g.textBaseline='middle';g.fillText('EAST GATE',w/2,36);g.fillStyle='#ffd23f';g.font='bold 20px Consolas,monospace';g.fillText('ON FOOT · E',w/2,68);});box(.2,2.9,.2,wx,1.45,wz-1.4,metal);}}
  // ---- mist: slow, soft layers close to the ground, the hall's cold green ----
  const mistTex=canvas(256,256,(g,w,h)=>{g.fillStyle='rgba(0,0,0,0)';g.clearRect(0,0,w,h);for(let i=0;i<46;i++){const x=rand()*w,y=rand()*h,r=24+rand()*52,rg=g.createRadialGradient(x,y,1,x,y,r);rg.addColorStop(0,'rgba(120,180,170,.22)');rg.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=rg;g.fillRect(x-r,y-r,r*2,r*2);}});
  mistTex.hasAlpha=true;mistTex.wrapU=mistTex.wrapV=B.Texture.WRAP_ADDRESSMODE;mistTex.uScale=mistTex.vScale=5;for(let i=0;i<(low?2:3);i++){const m=new B.StandardMaterial('tmp-mist',scene);m.diffuseColor=B.Color3.Black();m.emissiveTexture=mistTex;m.opacityTexture=mistTex;m.disableLighting=true;m.backFaceCulling=false;m.alpha=.5-i*.12;m.disableDepthWrite=true;m.alphaMode=B.Engine.ALPHA_COMBINE;own.push(m);
   const p=B.MeshBuilder.CreateGround('tmp-mist',{width:100,height:100},scene);p.material=m;p.parent=node;p.position.y=.3+i*.5;p.isPickable=false;}
  // ---- Zen Zephyr: a seated android monk (primitives; replace through temple.js MODEL) ----
  const monk=new B.TransformNode('zen-zephyr',scene);monk.parent=node;monk.position.set(T.MODEL.seat[0],.5,T.MODEL.seat[1]);monk.rotation.y=T.MODEL.yaw;monk.metadata={...monk.metadata,character:'zen-zephyr',monk:true};   /* monks never film a street spectacle (npc-device.js) */
  const mp=(mesh,mat,x,y,z)=>{mesh.material=mat;mesh.parent=monk;mesh.position.set(x,y,z);mesh.isPickable=false;return mesh;};
  const robe=M('robe','#151a1f','#07090b',.15),robeL=M('robeL','#1d242a','#0a0d10',.2),sash=M('sash','#b8892a','#3a2a08',.25),steel=M('steel','#8a96a0','#20262b',.8);
  mp(B.MeshBuilder.CreateCylinder('mk-legs',{diameter:1.7,height:.34,tessellation:20},scene),robe,0,.2,0);mp(B.MeshBuilder.CreateCylinder('mk-skirt',{diameterTop:.95,diameterBottom:1.5,height:.5,tessellation:20},scene),robeL,0,.5,.05);
  for(const s of [-1,1]){const k=mp(B.MeshBuilder.CreateCylinder('mk-knee',{diameter:.32,height:.7,tessellation:10},scene),robe,s*.55,.42,.5);k.rotation.z=Math.PI/2;k.rotation.y=s*.3;}
  const torso=mp(B.MeshBuilder.CreateCylinder('mk-torso',{diameterTop:.56,diameterBottom:.86,height:.86,tessellation:18},scene),robe,0,1.15,0);
  const sh=mp(B.MeshBuilder.CreateBox('mk-sash',{width:.18,height:.95,depth:.5},scene),sash,.05,1.15,.1);sh.rotation.z=.62;mp(B.MeshBuilder.CreateBox('mk-belt',{width:.86,height:.12,depth:.64},scene),sash,0,.82,.02);
  const chestLights=[[-.09,1.3],[0,1.22],[.09,1.3]].map(([x,y])=>mp(B.MeshBuilder.CreateBox('mk-chest',{width:.05,height:.05,depth:.03},scene),tealL,x,y,.33));
  for(const s of [-1,1]){mp(B.MeshBuilder.CreateSphere('mk-shoulder',{diameter:.3,segments:8},scene),steel,s*.42,1.46,0);mp(B.MeshBuilder.CreateCylinder('mk-arm',{diameter:.13,height:.42,tessellation:8},scene),robe,s*.46,1.2,.08).rotation.x=.35;
   const fa=mp(B.MeshBuilder.CreateCylinder('mk-forearm',{diameter:.11,height:.42,tessellation:8},scene),steel,s*.5,.98,.32);fa.rotation.x=1.15;mp(B.MeshBuilder.CreateTorus('mk-joint',{diameter:.16,thickness:.025,tessellation:12},scene),tealL,s*.47,1.1,.2);mp(B.MeshBuilder.CreateBox('mk-hand',{width:.12,height:.05,depth:.14},scene),steel,s*.52,.78,.5);}
  mp(B.MeshBuilder.CreateCylinder('mk-neck',{diameter:.16,height:.18,tessellation:10},scene),steel,0,1.62,0);for(const y of [1.58,1.64])mp(B.MeshBuilder.CreateTorus('mk-neckring',{diameter:.19,thickness:.018,tessellation:12},scene),metal,0,y,0).rotation.x=Math.PI/2;
  const head=new B.TransformNode('mk:Head',scene);   /* named ...:Head so the speaker's gaze (npc-look.js) turns it toward the player while he talks */head.parent=monk;head.position.set(0,1.86,0);const hh=B.MeshBuilder.CreateSphere('mk-skull',{diameterX:.36,diameterY:.44,diameterZ:.4,segments:14},scene);hh.material=silver;hh.parent=head;hh.isPickable=false;
  for(const s of [-1,1]){const e=B.MeshBuilder.CreateBox('mk-eye',{width:.085,height:.012,depth:.01},scene);e.material=dark;e.parent=head;e.position.set(s*.075,.02,.195);e.isPickable=false;const ear=B.MeshBuilder.CreateCylinder('mk-ear',{diameter:.11,height:.03,tessellation:10},scene);ear.material=metal;ear.parent=head;ear.position.set(s*.19,0,0);ear.rotation.z=Math.PI/2;ear.isPickable=false;}
  const dot=B.MeshBuilder.CreateBox('mk-brow',{width:.03,height:.03,depth:.01},scene);dot.material=tealL;dot.parent=head;dot.position.set(0,.12,.2);dot.isPickable=false;
  pool('#38e8ff',T.MODEL.seat[0],T.MODEL.seat[1],3,3,.35,.56);
  // ---- flush static pieces by material ----
  for(const [mat,list] of groups){if(list.length>1){const merged=B.Mesh.MergeMeshes(list,true,true,undefined,false,false);if(merged){merged.parent=node;merged.material=mat;merged.isPickable=false;}}}
  // ---- the hall's own meshes: what its lights light and its floor mirrors (nothing outside the walls, no additive sheets, never the floor itself) ----
  const inHall=m=>{const b=m.getBoundingInfo().boundingBox,c=b.centerWorld,e=b.extendSizeWorld;return c.x>hx0-1.5&&c.x<hx1+1.5&&c.z>hz0-1.5&&c.z<hz1+1.5&&e.x<30&&e.z<30;};
  const additive=m=>m.material&&(m.material.alphaMode===B.Engine.ALPHA_ADD||m.material.disableDepthWrite||/tmp-(mist|haze|glyph)/.test(m.name));
  node.computeWorldMatrix(true);for(const m of node.getChildMeshes(false)){m.computeWorldMatrix(true);m.refreshBoundingInfo?.();if(m!==floor&&inHall(m)&&!pools.includes(m))hall.push(m);}
  for(const m of monk.getChildMeshes(false))if(!hall.includes(m))hall.push(m);
  if(mirror)mirror.renderList.push(...hall.filter(m=>!additive(m)&&m.position.y>-1));
  // ---- light (Medium and up): a cold key through the oculus onto the dais, the doorway's spill, the candles' warmth; High adds two low fills down the aisles.
  // Lit only for the hall's own meshes (the floor and the glyph inlay included), so nothing outside pays for them. Low adds no light at all. ----
  const lights=[];
  if(!low){const lit=[...hall.filter(m=>!additive(m)),floor,...node.getChildMeshes(false).filter(m=>/tmp-glyph/.test(m.name))];
   const add=(L,i,col,range)=>{L.intensity=i;L.diffuse=col;L.specular=col.scale(.6);L.range=range;L.parent=node;L.includedOnlyMeshes=lit;own.push(L);lights.push({L,base:i});return L;};
   add(new B.SpotLight('temple-oculus',new B.Vector3(T.DAIS.x,12.4,T.DAIS.z),new B.Vector3(0,-1,0),.95,2,scene),2.1,new B.Color3(.72,.92,.95),17);
   add(new B.PointLight('temple-doorway',new B.Vector3(0,3.4,hz1-1.6),scene),1.15,new B.Color3(.62,.92,.88),15);
   add(new B.PointLight('temple-candles',new B.Vector3(0,1.1,19.2),scene),.85,new B.Color3(1,.64,.32),6.5).metadata={candle:true};
   if(hi)for(const s of [-1,1])add(new B.PointLight('temple-fill-'+(s<0?'w':'e'),new B.Vector3(s*7.5,1.6,6),scene),.55,new B.Color3(.32,.7,.72),11);}
  // ---- exploration (V1 map) ----
  const space=Area?.get(T.ID),flags=state?.story?.flags,fog=space?Area.load(space,flags):null;let fogDirty=false,fogNext=0,fogSaved=0;
  let clock=0,last=null;const warmBase=warmF.emissiveColor.clone();
  function tick(time,player){
   if(disposed)return;const dt=last===null?0:Math.min(.1,Math.max(0,time-last));last=time;clock=time;
   ledTex.vOffset-=dt*.25;mistTex.uOffset+=dt*.004;mistTex.vOffset+=dt*.0025;
   // flames flicker (the blue incense and the candles); the monk breathes
   for(const fl of flames)fl.f.forEach((s,k)=>{const q=Math.sin(time*7+fl.p+k*1.9)*.5+Math.sin(time*11.3+fl.p*2+k)*.3;s.scaling.y=(1.5+k*.3)*(1+q*.14);s.scaling.x=s.scaling.z=.8*(1+q*.07);});
   const cf=1+Math.sin(time*9.1)*.06+Math.sin(time*15.7+1.3)*.04;warmF.emissiveColor.copyFrom(warmBase).scaleInPlace(cf);for(const l of lights)if(l.L.metadata?.candle)l.L.intensity=l.base*(.94+(cf-1)*1.6);
   const br=Math.sin(time*.9);torso.scaling.set(1+br*.012,1+br*.018,1+br*.012);head.rotation.x=br*.012;head.rotation.y=Math.sin(time*.23)*.05;for(const [i,l] of chestLights.entries())l.visibility=.7+.3*Math.sin(time*1.4+i);
   for(const s of screens)if(time>s.next){s.next=time+s.period;s.draw(s.t.getContext(),s.cw,s.ch,time);s.t.update();}
   if(fog&&player&&time>fogNext){fogNext=time+.5;if(fog.reveal(player.x,player.z,14)>0)fogDirty=true;if(fogDirty&&time>fogSaved+4){fogSaved=time;fogDirty=false;if(flags)Area.save(space,fog,flags);try{save();}catch{}}}}
  return {tick,fog,space,monk,head,flames,lights:()=>lights.map(l=>l.L.name),mirrored:()=>mirror?mirror.renderList.length:0,meshCount:()=>node.getChildMeshes().length,
   dispose(){if(disposed)return;disposed=true;if(fog&&flags){Area.save(space,fog,flags);try{save();}catch{}}node.dispose(false,true);for(const o of own)try{o.dispose();}catch{}own.length=0;
    scene.clearColor=prev.clear;scene.fogMode=prev.fogMode;scene.fogDensity=prev.fogDensity;scene.fogColor=prev.fogColor;ip.exposure=prev.exposure;ip.contrast=prev.contrast;if(prev.env!=null)scene.environmentIntensity=prev.env;
    if(sun&&lp.sun!=null)sun.intensity=lp.sun;if(ambient){if(lp.amb!=null)ambient.intensity=lp.amb;if(lp.dif)ambient.diffuse=lp.dif;if(lp.gnd&&ambient.groundColor)ambient.groundColor=lp.gnd;}}};
 }
 T.build=build;
})(typeof globalThis!=='undefined'?globalThis:this);
