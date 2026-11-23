/* CORPORATE DISTRICT: the 3D build (browser only). Data and rules are in corporate.js and corporate-security.js; actors in corporate-actors.js.
   build({scene,parent,quality,state}) -> {tick(time,player), dispose(), security, fog, ...}. Called by the renderer when the walking location `corporate` loads; the whole
   area is disposed when the player leaves (the cab room or NeoChinatown replaces it), so only one real place is ever loaded.
   Art direction (docs/VOID_RUNNER_ART_DIRECTION.md): dark, wet, layered. Teal glass towers with setbacks, concrete podiums, belt courses and pilasters, rooftop plant,
   conduits and vents in the alleys, wet asphalt, accent neon (a few vertical signs and billboards, not outlines), practical lamps with spill pools, rain and haze.
   No real lights are added (the scene already has more than a shader takes): emissive accents, additive spill pools and the scene's ambient light do the lighting. */
(function(root){
 'use strict';
 const C=root.VoidCorporate;if(!C)return;
 function build({scene,parent,quality,state}){
  const B=root.BABYLON,Sec=root.VoidCorporateSecurity,Act=root.VoidCorporateActors,Area=root.VoidAreaMap;
  const low=quality==='low',hi=quality==='high'||quality==='ultra',own=[],node=new B.TransformNode('corporate',scene);node.parent=parent;let disposed=false;
  // ---- scene mood: a dark teal-black night, haze that swallows the far towers, little ambient light. Everything is put back on dispose. ----
  const ip=scene.imageProcessingConfiguration,prev={clear:scene.clearColor.clone(),fogMode:scene.fogMode,fogDensity:scene.fogDensity,fogColor:scene.fogColor.clone(),exposure:ip.exposure,contrast:ip.contrast,env:scene.environmentIntensity};
  scene.clearColor=new B.Color4(.01,.03,.035,1);scene.fogMode=B.Scene.FOGMODE_EXP2;scene.fogDensity=low?.0065:.0052;scene.fogColor=new B.Color3(.035,.085,.095);ip.exposure=1.45;ip.contrast=1.2;scene.environmentIntensity=Math.min(prev.env??1,.28);
  const sun=scene.getLightByName('sun'),ambient=scene.getLightByName('ambient'),lightPrev={sun:sun?.intensity,amb:ambient?.intensity,dif:ambient?.diffuse?.clone(),gnd:ambient?.groundColor?.clone()};
  if(sun)sun.intensity=.03;if(ambient){ambient.intensity=1.7;ambient.diffuse=new B.Color3(.4,.58,.66);if(ambient.groundColor)ambient.groundColor=new B.Color3(.1,.12,.15);}
  let seed=90211;const rand=()=>((seed=seed*16807%2147483647)-1)/2147483646;
  // ---- materials ----
  const mc=new Map(),M=(name,hex,em,spec=.18,alpha)=>{const k=name+hex+em+alpha;if(mc.has(k))return mc.get(k);const m=new B.StandardMaterial('corp-'+name,scene);m.diffuseColor=B.Color3.FromHexString(hex);m.specularColor=new B.Color3(spec,spec,spec*1.08);m.specularPower=32;if(em)m.emissiveColor=B.Color3.FromHexString(em);if(alpha!=null){m.alpha=alpha;m.backFaceCulling=false;}own.push(m);mc.set(k,m);return m;};
  const G=(name,hex,k=1)=>{const key='g'+name+hex+k;if(mc.has(key))return mc.get(key);const m=new B.StandardMaterial('corp-'+name,scene);m.diffuseColor=B.Color3.Black();m.specularColor=B.Color3.Black();m.emissiveColor=B.Color3.FromHexString(hex).scale(k);m.disableLighting=true;own.push(m);mc.set(key,m);return m;};
  const canvas=(w,h,draw)=>{const t=new B.DynamicTexture('corp-tex',{width:w,height:h},scene,true);own.push(t);draw(t.getContext(),w,h);t.update();return t;};
  const TS=hi?512:256;
  // Facade: a curtain wall of dark teal glass, mullions, floor slabs, grime streaks; a separate emissive layer holds the lit windows (so unlit glass stays dark).
  function facadeTextures(variant){const cols=8,rows=24,W=TS,H=TS*2,cw=W/cols,rh=H/rows;let s=variant*977+13;const r=()=>((s=s*16807%2147483647)-1)/2147483646;const lit=[];
   const diff=canvas(W,H,(g)=>{const gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#10262d');gr.addColorStop(1,'#071317');g.fillStyle=gr;g.fillRect(0,0,W,H);
    for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const b=.05+r()*.1,x=i*cw,y=j*rh,on=r();g.fillStyle='rgb('+Math.round(8+b*60)+','+Math.round(24+b*150)+','+Math.round(30+b*160)+')';g.fillRect(x+2,y+2,cw-4,rh-4);
     const rg=g.createLinearGradient(x,y,x+cw,y+rh);rg.addColorStop(0,'rgba(120,210,230,'+(.05+r()*.1)+')');rg.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=rg;g.fillRect(x+2,y+2,cw-4,rh-4);
     if(on<.2)lit.push([x,y,r()<.7?'warm':'cool',.35+r()*.5]);else if(on<.23)lit.push([x,y,'cool',.5]);}
    g.fillStyle='#040a0c';for(let i=0;i<=cols;i++)g.fillRect(i*cw-1.5,0,3,H);for(let j=0;j<=rows;j++)g.fillRect(0,j*rh-1,W,2);
    g.fillStyle='rgba(2,6,8,.7)';for(let j=0;j<rows;j+=4)g.fillRect(0,j*rh-3,W,6);   // floor slab bands
    for(let k=0;k<14;k++){const x=r()*W,gr2=g.createLinearGradient(0,0,0,H);gr2.addColorStop(0,'rgba(0,0,0,0)');gr2.addColorStop(.5,'rgba(2,5,6,'+(.18+r()*.2)+')');gr2.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr2;g.fillRect(x,0,3+r()*5,H);}
    const bot=g.createLinearGradient(0,H*.8,0,H);bot.addColorStop(0,'rgba(0,0,0,0)');bot.addColorStop(1,'rgba(0,0,0,.55)');g.fillStyle=bot;g.fillRect(0,H*.8,W,H*.2);});
   const emi=canvas(W,H,(g)=>{g.fillStyle='#000';g.fillRect(0,0,W,H);for(const [x,y,tone,a] of lit){g.fillStyle=tone==='warm'?'rgba(214,168,104,'+a+')':'rgba(112,214,232,'+a+')';g.fillRect(x+4,y+4,cw-8,rh-8);}});
   return {diff,emi};}
  const facadeMats=[0,1,2].map(v=>{const {diff,emi}=facadeTextures(v);diff.wrapU=diff.wrapV=B.Texture.WRAP_ADDRESSMODE;emi.wrapU=emi.wrapV=B.Texture.WRAP_ADDRESSMODE;const m=new B.StandardMaterial('corp-facade'+v,scene);m.diffuseTexture=diff;m.emissiveTexture=emi;m.specularColor=new B.Color3(.55,.7,.75);m.specularPower=64;m.backFaceCulling=false;own.push(m);return m;});
  // Concrete podium: dark gunmetal with speckle, stains and a few dark openings; roof; ground.
  const concreteTex=canvas(256,256,(g,w,h)=>{g.fillStyle='#2a3036';g.fillRect(0,0,w,h);for(let i=0;i<1400;i++){g.fillStyle='rgba('+(20+rand()*30|0)+','+(24+rand()*30|0)+','+(26+rand()*30|0)+','+(.15+rand()*.3)+')';g.fillRect(rand()*w,rand()*h,1+rand()*2,1+rand()*2);}
   for(let k=0;k<7;k++){const x=rand()*w,gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,'+(.2+rand()*.25)+')');g.fillStyle=gr;g.fillRect(x,0,6+rand()*14,h);}g.strokeStyle='rgba(0,0,0,.5)';g.lineWidth=2;for(let y=0;y<h;y+=64){g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke();}for(let x=0;x<w;x+=128){g.beginPath();g.moveTo(x,0);g.lineTo(x,h);g.stroke();}});
  concreteTex.wrapU=concreteTex.wrapV=B.Texture.WRAP_ADDRESSMODE;const concrete=new B.StandardMaterial('corp-concrete',scene);concrete.diffuseTexture=concreteTex;concrete.specularColor=new B.Color3(.1,.1,.12);concrete.backFaceCulling=false;own.push(concrete);
  // Wet asphalt: dark, noisy, with lane markings; the plazas get paving slabs.
  const asphaltTex=canvas(512,512,(g,w,h)=>{g.fillStyle='#161b1f';g.fillRect(0,0,w,h);for(let i=0;i<5000;i++){g.fillStyle='rgba('+(30+rand()*34|0)+','+(36+rand()*34|0)+','+(42+rand()*34|0)+','+(.12+rand()*.25)+')';g.fillRect(rand()*w,rand()*h,1+rand()*2.4,1+rand()*2.4);}
   for(let k=0;k<10;k++){g.fillStyle='rgba(30,50,58,'+(.05+rand()*.08)+')';g.beginPath();g.ellipse(rand()*w,rand()*h,20+rand()*60,8+rand()*24,rand()*3,0,7);g.fill();}});
  asphaltTex.wrapU=asphaltTex.wrapV=B.Texture.WRAP_ADDRESSMODE;asphaltTex.uScale=asphaltTex.vScale=28;const asphalt=new B.StandardMaterial('corp-asphalt',scene);asphalt.diffuseTexture=asphaltTex;asphalt.specularColor=new B.Color3(.5,.6,.65);asphalt.specularPower=90;own.push(asphalt);
  const pavingTex=canvas(256,256,(g,w,h)=>{g.fillStyle='#232a2f';g.fillRect(0,0,w,h);g.strokeStyle='rgba(2,4,5,.9)';g.lineWidth=3;for(let i=0;i<=4;i++){g.beginPath();g.moveTo(i*64,0);g.lineTo(i*64,h);g.stroke();g.beginPath();g.moveTo(0,i*64);g.lineTo(w,i*64);g.stroke();}
   for(let i=0;i<900;i++){g.fillStyle='rgba('+(28+rand()*24|0)+','+(34+rand()*24|0)+','+(38+rand()*24|0)+','+(.1+rand()*.2)+')';g.fillRect(rand()*w,rand()*h,2,2);}});
  pavingTex.wrapU=pavingTex.wrapV=B.Texture.WRAP_ADDRESSMODE;pavingTex.uScale=192/8;pavingTex.vScale=14/8;   // both plazas are 192 x 14 m: one texture, tiled in metres
  const paving=new B.StandardMaterial('corp-paving',scene);paving.diffuseTexture=pavingTex;paving.specularColor=new B.Color3(.4,.5,.55);paving.specularPower=70;own.push(paving);
  const trim=M('trim','#262a2f','#0b0d10',.25),metal=M('metal','#1d2024','#07080a',.35),rust=M('rust','#2b211b','#0c0806',.15),roofM=M('roof','#101316','#06080a',.1),dark=M('dark','#0a0b0d',null,.1),
   concreteLight=M('concrete-light','#33383c','#101214',.1),amberL=G('amber','#ffb347',.8),warmL=G('warm','#ffc880',.9),coolL=G('cool','#bfe9ff',.9),tealL=G('teal','#38e8ff',.8),magL=G('mag','#ff3fb4',.7),redL=G('red','#ff2a2a',.9),orange=G('orange','#ff8a1f',.9);
  // ---- batched static geometry (per material) and merged props ----
  const batches=new Map(),meshGroups=new Map();
  const batch=m=>{let b=batches.get(m);if(!b)batches.set(m,b={p:[],n:[],u:[],i:[]});return b;};
  const quad=(m,a,b,c,d,n,uv)=>{const q=batch(m),o=q.p.length/3;q.p.push(...a,...b,...c,...d);for(let i=0;i<4;i++)q.n.push(...n);q.u.push(uv[0],uv[1],uv[2],uv[1],uv[2],uv[3],uv[0],uv[3]);q.i.push(o,o+1,o+2,o,o+2,o+3);};
  // A tower tier: four sides (UV in metres so the glass pattern keeps its scale) and a flat top.
  function tier(rect,y0,y1,sideM,topM,uOff=0,tw=24,th=86){const [x0,x1,z0,z1]=rect,h=y1-y0,vk=h/th,ux=(x1-x0)/tw,uz=(z1-z0)/tw;
   quad(sideM,[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],[0,0,-1],[uOff,0,uOff+ux,vk]);quad(sideM,[x1,y0,z1],[x0,y0,z1],[x0,y1,z1],[x1,y1,z1],[0,0,1],[uOff,0,uOff+ux,vk]);
   quad(sideM,[x0,y0,z1],[x0,y0,z0],[x0,y1,z0],[x0,y1,z1],[-1,0,0],[uOff,0,uOff+uz,vk]);quad(sideM,[x1,y0,z0],[x1,y0,z1],[x1,y1,z1],[x1,y1,z0],[1,0,0],[uOff,0,uOff+uz,vk]);
   quad(topM,[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1],[0,1,0],[0,0,1,1]);}
  const put=(mesh,mat,x,y,z,keep)=>{mesh.material=mat;mesh.parent=node;mesh.position.set(x,y,z);mesh.isPickable=false;if(!keep){let g=meshGroups.get(mat);if(!g)meshGroups.set(mat,g=[]);g.push(mesh);}return mesh;};
  const box=(w,h,d,x,y,z,mat,keep)=>put(B.MeshBuilder.CreateBox('corp-box',{width:w,height:h,depth:d},scene),mat,x,y,z,keep);
  const rbox=(r,y0,y1,mat,keep)=>box(r[1]-r[0],y1-y0,r[3]-r[2],(r[0]+r[1])/2,(y0+y1)/2,(r[2]+r[3])/2,mat,keep);
  const cyl=(dia,h,x,y,z,mat,keep,seg=10)=>put(B.MeshBuilder.CreateCylinder('corp-cyl',{diameter:dia,height:h,tessellation:seg},scene),mat,x,y,z,keep);
  const emissiveMat=(t,alpha)=>{const m=new B.StandardMaterial('corp-screen',scene);m.diffuseColor=B.Color3.Black();m.specularColor=B.Color3.Black();m.emissiveTexture=t;m.disableLighting=true;m.backFaceCulling=false;if(alpha)m.opacityTexture=t;own.push(m);return m;};
  const screens=[];
  const sign=(w,h,x,y,z,ry,cw,ch,draw,period)=>{const t=canvas(cw,ch,draw),p=put(B.MeshBuilder.CreatePlane('corp-sign',{width:w,height:h},scene),emissiveMat(t,!period),x,y,z,true);p.rotation.y=ry;if(period)screens.push({t,draw,cw,ch,next:rand()*period,period});return p;};
  const TOW=Math.PI/2,TOE=-Math.PI/2,TON=Math.PI,TOS=0;   // plane yaw so the readable face points west, east, north, south
  // Additive spill pools: light on wet ground from a lamp or sign, instead of a real light.
  const washTex={};const wash=(hex)=>{if(washTex[hex])return washTex[hex];const t=canvas(128,128,(g,w,h)=>{g.fillStyle='#000';g.fillRect(0,0,w,h);const rg=g.createRadialGradient(w/2,h/2,1,w/2,h/2,w/2);rg.addColorStop(0,hex);rg.addColorStop(.4,hex+'66');rg.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=rg;g.fillRect(0,0,w,h);});
   const m=new B.StandardMaterial('corp-wash',scene);m.diffuseColor=B.Color3.Black();m.specularColor=B.Color3.Black();m.emissiveTexture=t;m.disableLighting=true;m.alphaMode=B.Engine.ALPHA_ADD;m.alpha=.5;m.disableDepthWrite=true;own.push(m);washTex[hex]=m;return m;};
  const pool=(hex,x,z,w,d,k=.5)=>{const g=B.MeshBuilder.CreateGround('corp-pool',{width:w,height:d},scene);g.material=wash(hex);g.parent=node;g.position.set(x,.05,z);g.isPickable=false;g.visibility=k/.5;return g;};
  const wallPool=(hex,x,y,z,w,h,ry)=>{const p=B.MeshBuilder.CreatePlane('corp-wallpool',{width:w,height:h},scene);p.material=wash(hex);p.parent=node;p.position.set(x,y,z);p.rotation.y=ry;p.isPickable=false;return p;};

  // ---- ground, plazas, markings ----
  const ground=B.MeshBuilder.CreateGround('corp-ground',{width:200,height:200},scene);ground.material=asphalt;ground.parent=node;ground.position.y=-.01;ground.isPickable=false;
  for(const s of C.STREETS.filter(s=>s.kind==='plaza')){const [x0,x1,z0,z1]=s.rect,g=B.MeshBuilder.CreateGround('corp-paving',{width:x1-x0,height:z1-z0},scene);g.material=paving;g.parent=node;g.position.set((x0+x1)/2,.01,(z0+z1)/2);g.isPickable=false;}
  const markM=M('mark','#8a8f90','#202324',.1),yellowM=M('mark-y','#8a7a2a','#2a2408',.1);
  for(let x=-90;x<90;x+=9){box(4,.02,.22,x,.03,0,markM);}box(192,.02,.18,0,.03,10.6,yellowM);box(192,.02,.18,0,.03,-10.6,yellowM);
  for(let k=-4;k<=4;k++){box(.7,.02,5,-12+k*1.4,.03,0,markM);box(.7,.02,5,38+k*1.4,.03,0,markM);}   // crosswalks
  // ---- the towers ----
  const FACE=facadeMats;
  C.BLOCKS.forEach((b,i)=>{const [x0,x1,z0,z1]=b.rect,h=b.h,fm=FACE[i%3],fm2=FACE[(i+1)%3],pod=7+rand()*2,in1=1.5,in2=Math.min(5,(x1-x0)*.16);
   tier(b.rect,0,pod,concrete,roofM,rand()*3,10,10);
   const r1=[x0+in1,x1-in1,z0+in1,z1-in1];tier(r1,pod,h*.62,fm,roofM,rand()*4);
   const r2=[x0+in2,x1-in2,z0+in2,z1-in2];tier(r2,h*.62,h*.92,fm2,roofM,rand()*4);
   const r3=[x0+in2+4,x1-in2-4,z0+in2+4,z1-in2-4];if(r3[1]-r3[0]>8&&r3[3]-r3[2]>8)tier(r3,h*.92,h,fm,roofM,rand()*4);
   // belt courses (floor slab edges every few floors) and the podium cornice: layered edges give the glass depth
   for(const [y,inset] of [[pod,0],[pod+.1,in1-.3],[h*.62,in1-.3],[h*.92,in2-.3]]){const r=[x0+inset,x1-inset,z0+inset,z1-inset];for(const [a,bb,c,d] of [[r[0],r[1],r[2]-.25,r[2]],[r[0],r[1],r[3],r[3]+.25],[r[0]-.25,r[0],r[2],r[3]],[r[1],r[1]+.25,r[2],r[3]]])rbox([a,bb,c,d],y-.18,y+.18,trim);}
   for(let y=pod+14;y<h*.6;y+=14){const r=[x0+in1,x1-in1,z0+in1,z1-in1];for(const [a,bb,c,d] of [[r[0],r[1],r[2]-.2,r[2]],[r[0],r[1],r[3],r[3]+.2]])rbox([a,bb,c,d],y,y+.35,trim);}
   // pilasters on the podium faces that front a street or plaza, and recessed dark bays between them
   const face=(n,v0,v1,fix)=>{for(let v=v0+3;v<v1-1;v+=6){if(n==='s')rbox([v-.3,v+.3,fix-.5,fix],0,pod,trim);if(n==='n')rbox([v-.3,v+.3,fix,fix+.5],0,pod,trim);}};
   if(z0<0)face('n',x0,x1,z1);else face('s',x0,x1,z0);
   // rooftop plant: units, tanks, antennas, a red warning light
   const roofY=h,ru=[x0+in2+4,x1-in2-4,z0+in2+4,z1-in2-4];const rx=r3[1]-r3[0]>8?r3:r2;const topY=r3[1]-r3[0]>8?h:h*.92;
   for(let k=0;k<(low?3:6);k++){const px=rx[0]+1+rand()*(rx[1]-rx[0]-2),pz=rx[2]+1+rand()*(rx[3]-rx[2]-2);if(rand()<.5)box(1.5+rand()*2,1+rand()*1.4,1.5+rand()*2,px,topY+.9,pz,metal);else cyl(1.6+rand()*1.6,2+rand()*1.5,px,topY+1.4,pz,rust);}
   const ax=(rx[0]+rx[1])/2,az=(rx[2]+rx[3])/2;cyl(.18,10+rand()*8,ax,topY+7,az,metal);box(.3,.3,.3,ax,topY+13,az,redL);});
  // ---- ground floor details: HQ entrance, service entrance, bays, back door, checkpoint ----
  const hq=C.DOORS.find(d=>d.id==='hq');box(8,.4,3.6,30,4.4,24.2,metal);box(7.6,.08,3.2,30,4.18,24.2,warmL);for(const s of [-1,1])box(.5,4.2,.5,30+s*3.9,2.1,22.6,trim);   // canopy with an underlit strip, two columns
  box(6,3.2,.2,30,1.6,25.9,M('hqglass','#07181d','#0a2a31',.6));box(.12,3.2,.12,30,1.6,25.8,dark);sign(6.6,.9,30,5.4,25.7,TOS,512,70,(g,w,h)=>{g.fillStyle='#050809';g.fillRect(0,0,w,h);g.fillStyle='#bfe9ff';g.font='bold 40px Consolas,monospace';g.textAlign='center';g.textBaseline='middle';g.fillText('HEADQUARTERS',w/2,h/2+2);});
  pool('#bfe9ff',30,20,18,12,.55);wallPool('#bfe9ff',30,2.2,25.6,10,6,TOS);
  const svc=C.DOORS.find(d=>d.id==='service-n1');box(4,3,.25,-77,1.5,25.9,metal);box(4.4,.2,.9,-77,3.3,25.4,trim);for(let k=0;k<6;k++)box(.5,.06,.06,-78.4+k*.55,.04+0.01,25.7,k%2?dark:orange);box(.4,.3,.3,-74,3,25.6,warmL);pool('#ffb347',-77,22,9,8,.5);
  // hazard stripes on the loading bays and roll-up doors
  const rollTex=canvas(128,128,(g,w,h)=>{g.fillStyle='#2a2d31';g.fillRect(0,0,w,h);g.fillStyle='#15171a';for(let y=0;y<h;y+=8)g.fillRect(0,y,w,3);}),rollM=new B.StandardMaterial('corp-roll',scene);rollM.diffuseTexture=rollTex;rollM.specularColor=new B.Color3(.2,.2,.25);own.push(rollM);
  for(const d of C.DOORS.filter(d=>d.kind==='bay')){const cx=d.pos[0];const sj=put(B.MeshBuilder.CreatePlane('corp-roll',{width:8,height:4.2},scene),rollM,cx,2.1,-87.78,true);sj.rotation.y=Math.PI;box(8.6,.4,.3,cx,4.4,-88.3,metal);for(let k=0;k<8;k++)box(.9,.12,.06,cx-3.5+k,.2,-88.05,k%2?dark:amberL);box(.4,.5,.4,cx-4.6,.25,-88.6,dark);box(.4,.5,.4,cx+4.6,.25,-88.6,dark);}
  const bd=C.DOORS.find(d=>d.id==='back-door');box(2.4,2.8,.25,-40,1.4,-87.85,M('bdoor','#1e2226','#08090a',.3));box(.14,.2,.06,-38.6,1.3,-88.05,redL);box(2.6,.15,.2,-40,2.95,-88.1,trim);sign(1.6,.4,-40,3.4,-88.2,TOS,256,64,(g,w,h)=>{g.fillStyle='#050607';g.fillRect(0,0,w,h);g.fillStyle='#8a8f90';g.font='bold 26px Consolas,monospace';g.textAlign='center';g.textBaseline='middle';g.fillText('MAINTENANCE',w/2,h/2);});
  box(.4,.3,.3,-33,3.4,-88.4,warmL);pool('#ffb347',-33,-92,12,8,.55);   // the one lit spot on the back wall, so the dark doorway reads
  // checkpoint: booth, striped arm, barrier posts, floodlights, signs
  box(3.4,3,4,-6.3,1.5,44.5,M('booth','#1a1d21','#08090b',.3));box(.1,1.2,2.4,-4.55,1.9,44.5,M('boothglass','#0a2a31','#10424c',.6,.55));box(3.5,.2,4.2,-6.3,3.1,44.5,metal);box(.8,.5,.06,-6.3,2,46.55,tealL);
  const armM=M('arm','#a02828','#2a0a0a',.2);box(9.1,.2,.2,0,1.1,44,armM);for(let k=0;k<6;k++)box(.6,.21,.21,-4.2+k*1.4,1.1,44,markM);box(.5,1.1,.5,-4.6,.55,44,metal);
  for(const x of [5.2,7.6]){box(.4,1.1,.4,x,.55,44,metal);box(.45,.2,.45,x,1.2,44,amberL);}
  box(.3,6,.3,-7.4,3,40.5,metal);box(1.4,.4,.5,-7.4,6.1,40.5,coolL);pool('#bfe9ff',0,42,14,16,.55);
  sign(5,.8,0,4.9,43.8,TOS,512,80,(g,w,h)=>{g.fillStyle='#08090b';g.fillRect(0,0,w,h);g.fillStyle='#ffb347';g.font='bold 34px Consolas,monospace';g.textAlign='center';g.textBaseline='middle';g.fillText('SECURITY CHECKPOINT',w/2,h/2);}).position.y=5.2;
  box(.12,5.2,.12,-4.3,2.6,44,metal);box(.12,5.2,.12,4.3,2.6,44,metal);
  // ---- street furniture and cover (the same boxes the collision uses) ----
  const planterM=M('planter','#23272b','#0a0c0d',.15),leafM=M('leaf','#0d2a22','#04100c',.05),dumpM=M('dump','#1c3a2c','#08130e',.2),crateM=M('crate','#2e261c','#0e0b07',.1),benchM=M('bench','#262a2e','#0a0c0e',.3);
  for(const [id,r,h] of C.PROPS){const cx=(r[0]+r[1])/2,cz=(r[2]+r[3])/2,w=r[1]-r[0],d=r[3]-r[2];
   if(/planter/.test(id)){rbox(r,0,h,planterM);for(let k=0;k<5;k++){const s=put(B.MeshBuilder.CreateSphere('corp-shrub',{diameter:1.1,segments:5},scene),leafM,r[0]+.7+k*(w-1.4)/4,h+.35,cz);s.scaling.set(1,.8,1);}}
   else if(/dumpster/.test(id)){rbox(r,0,h,dumpM);rbox([r[0]-.05,r[1]+.05,r[2]-.05,r[3]+.05],h,h+.1,metal);box(w*.5,.05,d+.02,cx,h*.6,cz,dark);}
   else if(/crates/.test(id)){rbox(r,0,h,crateM);rbox([r[0]+.1,r[1]-.1,r[2]+.1,r[3]-.1],h,h+.9,crateM);for(const y of [.3,.75,1.2])box(w+.04,.06,d+.04,cx,y,cz,dark);}
   else if(/kiosk/.test(id)){rbox(r,0,h,metal);box(w*.7,1.1,.05,cx,1.5,r[2]-.02,M('kioskglass','#0a2a31','#1a6a78',.5));sign(1.4,.9,cx,1.55,r[2]-.06,TOS,128,80,(g,w2,h2)=>{g.fillStyle='#04141a';g.fillRect(0,0,w2,h2);g.fillStyle='#38e8ff';g.font='bold 20px Consolas,monospace';g.textAlign='center';g.fillText('INFO',w2/2,34);g.fillStyle='#ff3fb4';g.fillText('TRANSIT',w2/2,62);});}
   else if(/bench/.test(id)){rbox(r,.4,.5,benchM);rbox([r[0]+.2,r[0]+.35,r[2],r[3]],0,.4,metal);rbox([r[1]-.35,r[1]-.2,r[2],r[3]],0,.4,metal);}
   else if(/bollard/.test(id)){rbox(r,0,h,metal);rbox([r[0]-.02,r[1]+.02,r[2]-.02,r[3]+.02],h-.15,h,amberL);}
   else if(/booth|gate-arm/.test(id)){/* built with the checkpoint */}
   else rbox(r,0,h,metal);}
  // lamp posts with a lit head and a pool of light on the wet ground (lit zones: plazas, checkpoint, HQ front; the alleys have none)
  const lampXs=[-84,-66,-42,-20,2,26,44,62,80];for(const x of lampXs)for(const z of [18.5,-18.5]){cyl(.14,5.6,x,2.8,z,metal);box(.9,.18,.4,x,5.7,z+(z>0?.3:-.3),x%2?warmL:coolL);pool(x%2?'#ffb347':'#bfe9ff',x,z,9,9,.45);}
  // ---- alleys: conduits, pipes, vents, cables, steam, puddles ----
  const pipeM=M('pipe','#2c3034','#0c0e10',.4),ventM=M('vent','#1a1d20','#07080a',.3);
  for(const a of C.STREETS.filter(s=>s.kind==='alley'&&s.id!=='back-alley')){const [x0,x1,z0,z1]=a.rect;for(let z=z0+3;z<z1-3;z+=7){cyl(.16,6+rand()*3,x0+.15,3.2,z,pipeM,false,8);cyl(.1,5,x1-.15,3,z+2,pipeM,false,8);box(.35,.5,1.3,x0+.3,2+rand()*3,z+3,ventM);if(!low)box(.5,.4,.5,x1-.3,4.5,z-2,M('ac','#222629','#08090a',.2));}}
  for(let x=-90;x<90;x+=10){cyl(.18,10,x+rand()*3,5,-88.4,pipeM,false,8).rotation.z=Math.PI/2;box(.6,.7,.5,x+4,3.3,-88.45,ventM);if(!low)box(.5,.5,.5,x+7,5.2,-88.45,M('ac','#222629','#08090a',.2));}
  const cableM=M('cable','#050607',null,.05);function cable(a,b,sag){const pts=[];for(let i=0;i<=10;i++){const t=i/10;pts.push(new B.Vector3(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t-Math.sin(Math.PI*t)*sag,a[2]+(b[2]-a[2])*t));}const m=B.MeshBuilder.CreateTube('corp-cable',{path:pts,radius:.04,tessellation:4},scene);m.material=cableM;m.parent=node;m.isPickable=false;}
  for(const z of [-40,-56,-72]){cable([-62.2,9,z],[-57.8,9.6,z+1],.8);}for(const z of [-44,-64]){cable([29.8,8.5,z],[34.2,9,z],.7);cable([61.8,8,z],[66.2,9,z-1],.7);}
  for(let k=0;k<(low?8:20);k++){const p=B.MeshBuilder.CreateDisc('corp-puddle',{radius:.6+rand()*1.5,tessellation:16},scene);const pm=M('puddle','#05080a','#0b1c22',.9);p.material=pm;p.parent=node;const area=rand()<.5?[-96,96,-95,-89]:[-90,90,-24,24];p.position.set(area[0]+rand()*(area[1]-area[0]),.045,area[2]+rand()*(area[3]-area[2]));p.rotation.x=Math.PI/2;p.scaling.y=.5+rand()*.4;p.isPickable=false;}
  // ---- accent neon: a few vertical signs and billboards (not outlines) ----
  const vsigns=[['SECURITY','#38e8ff',-44.2,26,TOW],['TRANSIT','#ff3fb4',-7.8,30,TOE],['DATA','#38e8ff',8.2,34,TOW],['OFFICES','#ffb347',51.8,30,TOE],['CLINIC','#39ff9c',66.2,34,TOW],['LOGISTICS','#ff3fb4',-57.8,30,TOE]];
  for(const [word,col,x,z,ry] of vsigns){const h=word.length*1.05+.6;sign(1.1,h,x,15+h/2,z,ry,96,Math.round(96*h/1.1),(g,w,hh)=>{g.fillStyle='#04090c';g.fillRect(0,0,w,hh);g.strokeStyle=col;g.lineWidth=3;g.strokeRect(5,5,w-10,hh-10);g.fillStyle=col;g.font='bold '+Math.round(w*.62)+'px Consolas,monospace';g.textAlign='center';g.textBaseline='middle';[...word].forEach((ch,i)=>g.fillText(ch,w/2,12+(hh-24)*(i+.5)/word.length));});wallPool(col,x+(ry===TOW?-.1:.1),18,z,5,8,ry);}
  const ads=[['CITY SECURITY SERVICES','SAFE STREETS · SAFE FUTURE','#38e8ff','#ff3fb4'],['CLEAN AIR INITIATIVE','FILTERED · MONITORED · YOURS','#39ff9c','#38e8ff'],['TAXI TRANSIT','60 CR · RETURN INCLUDED','#ffb347','#ff3fb4']];
  const adDraw=(a)=>(g,w,h,t=0)=>{g.fillStyle='#05080a';g.fillRect(0,0,w,h);const gr=g.createLinearGradient(0,0,w,h);gr.addColorStop(0,a[2]+'55');gr.addColorStop(1,a[3]+'33');g.fillStyle=gr;g.fillRect(0,0,w,h);g.fillStyle='#fff';g.font='bold '+Math.round(h*.16)+'px Consolas,monospace';g.textAlign='left';g.textBaseline='middle';g.fillText(a[0],w*.06,h*.38);g.fillStyle=a[3];g.font='bold '+Math.round(h*.09)+'px Consolas,monospace';g.fillText(a[1],w*.06,h*.64);g.fillStyle=a[2];g.fillRect(w*.06,h*.8,w*.5*(.3+.7*((t*.15)%1)),5);};
  const bills=[[-26,26,TOS,0],[46,26,TOS,1],[10,-26,TON,2]];
  for(const [x,z,ry,k] of bills){const y=16,off=ry===TOS?-.35:.35;sign(14,6.2,x,y,z+(ry===TOS?-.35:.35),ry,640,282,adDraw(ads[k]),2.6);box(14.8,.25,.4,x,y+3.2,z+(ry===TOS?-.3:.3),metal);box(14.8,.25,.4,x,y-3.2,z+(ry===TOS?-.3:.3),metal);wallPool(ads[k][2],x,y,z+(ry===TOS?-.6:.6),20,12,ry);pool(ads[k][2],x,z+(ry===TOS?-9:9),16,12,.5);}
  // ---- elevated walkways: a deck with glass sides and an underlit strip, spanning between towers ----
  for(const w of C.WALKWAYS){const len=Math.hypot(w.b[0]-w.a[0],w.b[1]-w.a[1]),mx=(w.a[0]+w.b[0])/2,mz=(w.a[1]+w.b[1])/2,x=w.axis==='x';
   box(x?len:w.w,.5,x?w.w:len,mx,w.y,mz,metal);box(x?len:.1,2.2,x?.1:len,mx+(x?0:w.w/2),w.y+1.3,mz+(x?w.w/2:0),M('wglass','#0a2a31','#0f3a44',.5,.4),true);box(x?len:.1,2.2,x?.1:len,mx-(x?0:w.w/2),w.y+1.3,mz-(x?w.w/2:0),M('wglass','#0a2a31','#0f3a44',.5,.4),true);
   box(x?len:.12,.08,x?.12:len,mx,w.y-.3,mz,warmL);box(x?len:w.w,.2,x?w.w:len,mx,w.y+2.45,mz,roofM);for(let t=-len/2+3;t<len/2-2;t+=6)box(x?.2:w.w,.3,x?w.w:.2,x?mx+t:mx,w.y-.35,x?mz:mz+t,trim);}
  // ---- the taxi stop: a parked road cab at the kerb, a sign (the sky-cab ring is gone: sky cabs were scrapped, 16 Nov 2026) ----
  pool('#38e8ff',C.CAB_PAD.x,C.CAB_PAD.z,14,14,.5);
  {const cx=C.CAB_PAD.x,cz=C.CAB_PAD.z,paint=M('cabpaint','#c79a1c','#3d2e06',.5);box(2.4,.75,4.8,cx,.8,cz,paint);box(2.1,.45,.8,cx,.75,cz+2.75,paint);box(2.2,.9,3.1,cx,1.5,cz+.1,M('cabglass','#071a20','#0e3a44',.6,.55));box(2.2,.08,3.1,cx,2.0,cz+.1,paint);box(.9,.28,.4,cx,2.25,cz+.1,M('cabsign','#ffd23f','#ffd23f'));
   for(const [x,zz] of [[-1.2,1.55],[1.2,1.55],[-1.2,-1.55],[1.2,-1.55]])cyl(.7,.28,cx+x,.35,cz+zz,M('cabtyre','#08090a','#020203',.2)).rotation.z=Math.PI/2;box(.35,.12,.05,cx-.75,.85,cz+3.18,coolL);box(.35,.12,.05,cx+.75,.85,cz+3.18,coolL);}
  sign(3.4,1.2,0,3.6,-24.4,TOS,256,90,(g,w,h)=>{g.fillStyle='#04141a';g.fillRect(0,0,w,h);g.strokeStyle='#3a2c08';g.lineWidth=5;g.strokeRect(5,5,w-10,h-10);g.fillStyle='#fff';g.font='bold 30px Consolas,monospace';g.textAlign='center';g.textBaseline='middle';g.fillText('TAXI',w/2,34);g.fillStyle='#ffd23f';g.font='bold 20px Consolas,monospace';g.fillText('RETURN · E',w/2,64);}).rotation.y=Math.PI;
  try{const m=root.VoidTaxiVan?.ledFrames?.(B,scene,[{x:0,y:3.6,z:-24.4,turn:Math.PI,w:3.3,h:1.1,faces:[-1],off:.012}],{quality,parent:node});if(m)own.push(m);}catch(e){console.warn('[corporate] taxi sign LEDs',e);}   // the LED chase round the TAXI sign, as at the street stops
  box(.25,3.6,.25,0,1.8,-24.2,metal);
  // ---- distant skyline: rings of dark towers, merged into one mesh; a horizon glow ----
  {const sky=[],skyM=new B.StandardMaterial('corp-skyline',scene);skyM.diffuseTexture=FACE[0].diffuseTexture;skyM.specularColor=B.Color3.Black();skyM.diffuseColor=new B.Color3(.55,.75,.8);own.push(skyM);for(let i=0;i<(low?36:60);i++){const a=i/(low?36:60)*Math.PI*2+rand()*.08,r=135+rand()*170,h=70+rand()*190,w=14+rand()*26,x=Math.cos(a)*r,z=Math.sin(a)*r;
    const b=B.MeshBuilder.CreateBox('corp-sky',{width:w,height:h,depth:w*(.7+rand()*.6)},scene);b.position.set(x,h/2-6,z);b.rotation.y=rand()*3;b.material=skyM;sky.push(b);}
   const m=B.Mesh.MergeMeshes(sky,true,true,undefined,false,false);if(m){m.parent=node;m.isPickable=false;m.material=skyM;m.infiniteDistance=false;}
   const glow=canvas(8,256,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(.55,'rgba(0,0,0,0)');gr.addColorStop(.85,'rgba(70,40,90,.4)');gr.addColorStop(1,'rgba(30,120,130,.55)');g.fillStyle=gr;g.fillRect(0,0,w,h);});
   const bm=new B.StandardMaterial('corp-horizon',scene);bm.diffuseColor=B.Color3.Black();bm.emissiveTexture=glow;bm.opacityTexture=glow;bm.disableLighting=true;bm.backFaceCulling=false;bm.fogEnabled=false;own.push(bm);const cyl2=B.MeshBuilder.CreateCylinder('corp-horizon',{diameter:700,height:300,tessellation:32,sideOrientation:B.Mesh.BACKSIDE},scene);cyl2.material=bm;cyl2.parent=node;cyl2.position.y=100;cyl2.isPickable=false;cyl2.infiniteDistance=true;}
  // perimeter embankment wall (the area is a walled pocket; this is the visible edge)
  for(const r of C.PERIMETER){rbox(r,0,14,concrete);rbox([r[0],r[1],r[2],r[3]],14,14.4,trim);}
  // ---- flush the batches into meshes and merge the prop groups ----
  for(const [m,b] of batches){const mesh=new B.Mesh('corp-batch',scene),vd=new B.VertexData();vd.positions=b.p;vd.normals=b.n;vd.uvs=b.u;vd.indices=b.i;vd.applyToMesh(mesh);mesh.material=m;mesh.parent=node;mesh.isPickable=false;}
  for(const [mat,list] of meshGroups){if(list.length>1){const merged=B.Mesh.MergeMeshes(list,true,true,undefined,false,false);if(merged){merged.parent=node;merged.material=mat;merged.isPickable=false;}}}

  // ---- security: the same data the rules use ----
  const n=Sec.counts(quality),guards=C.GUARDS.slice(0,n.robots),cameras=C.CAMERAS.slice(0,n.cameras),drones=C.DRONES.slice(0,n.drones);
  const entrances=C.ENTRANCES.filter(e=>guards.some(g=>g.id===e.guard));
  const sec=Sec.create({guards,cameras,drones,cover:C.coverBoxes(),zones:C.ZONES,entrances});
  const robots=guards.map(g=>{const r=Act.buildRobot({B,scene,parent:node,own,id:g.id,x:g.x||g.path[0][0],z:g.z||g.path[0][1],yaw:g.yaw||0});r.def=g;r.faceUntil=0;return r;});
  const cams=cameras.map(c=>Act.buildCamera({B,scene,parent:node,own,cam:c}));const drs=drones.map(d=>{const a=Act.buildDrone({B,scene,parent:node,own,id:d.id,y:d.y});a.def=d;return a;});
  // a spoken line floats over the guard for a few seconds (passive: text only)
  const bubbles=[];function say(robot,text,t){const tex=canvas(384,64,(g,w,h)=>{g.clearRect(0,0,w,h);g.fillStyle='rgba(6,10,12,.85)';g.fillRect(0,0,w,h);g.strokeStyle='#ff2a5a';g.lineWidth=3;g.strokeRect(2,2,w-4,h-4);g.fillStyle='#ffd9df';g.font='bold 28px Consolas,monospace';g.textAlign='center';g.textBaseline='middle';g.fillText(text.toUpperCase(),w/2,h/2+1);});
   const m=B.MeshBuilder.CreatePlane('corp-bubble',{width:2.2,height:.37},scene),mat=emissiveMat(tex);m.material=mat;m.parent=robot.root;m.position.set(0,2.6,0);m.billboardMode=B.Mesh.BILLBOARDMODE_Y;m.isPickable=false;bubbles.push({m,mat,tex,until:t+4.5});}
  sec.on('challenge',e=>{const r=robots.find(x=>x.id===e.guard)||robots[0];if(r){r.faceUntil=clock+4.5;say(r,e.text,clock);}try{root.dispatchEvent?.(new CustomEvent('corporate-security',{detail:{type:'challenge',...e}}));}catch{}});
  sec.on('warning',e=>{const r=robots.find(x=>x.id===e.by)||robots.find(x=>x.def.entrance)||robots[0];if(r){r.faceUntil=clock+4;say(r,'Restricted area',clock);}});
  for(const ev of ['suspicious','detected','cleared','warning'])sec.on(ev,e=>{try{root.dispatchEvent?.(new CustomEvent('corporate-security',{detail:{type:ev,...e}}));}catch{}});

  // ---- the player's exploration (V1 map fog) ----
  const space=Area?.get(C.ID),flags=state?.story?.flags,fog=space?Area.load(space,flags):null;let fogDirty=false,fogNext=0,fogSaved=0;
  // ---- the surveillance indicator: normal (hidden calm), suspicious (yellow), detected (red) ----
  const hud=document.createElement('div');hud.id='corp-detect';hud.setAttribute('role','status');hud.style.cssText='position:fixed;top:134px;left:50%;transform:translateX(-50%);z-index:30;padding:6px 14px;font:700 13px Consolas,monospace;letter-spacing:.12em;border:1px solid #2a7f8a;background:rgba(4,12,16,.78);color:#7fe9ff;pointer-events:none;min-width:210px;text-align:center';
  hud.innerHTML='<div data-t>SURVEILLANCE · CLEAR</div><div style="height:3px;margin-top:5px;background:#0b2026"><i data-b style="display:block;height:3px;width:0;background:#38e8ff"></i></div>';document.body.appendChild(hud);const hudT=hud.querySelector('[data-t]'),hudB=hud.querySelector('[data-b]');
  const HUD={clear:['SURVEILLANCE · CLEAR','#7fe9ff','#2a7f8a'],suspicious:['SUSPICIOUS · YOU MAY HAVE BEEN SEEN','#ffd23f','#b8962a'],detected:['DETECTED · YOU HAVE BEEN SEEN','#ff4a5a','#b82a3a']};
  // ---- rain, following the player ----
  let rain=null;if(B.ParticleSystem){const drop=canvas(8,64,(g,w,h)=>{g.clearRect(0,0,w,h);const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'rgba(190,225,255,0)');gr.addColorStop(1,'rgba(190,225,255,.85)');g.fillStyle=gr;g.fillRect(w/2-1.5,0,3,h);});drop.hasAlpha=true;
   rain=new B.ParticleSystem('corp-rain',hi?3200:low?900:1700,scene);rain.particleTexture=drop;rain.emitter=new B.Vector3(0,0,0);rain.minEmitBox=new B.Vector3(-24,12,-24);rain.maxEmitBox=new B.Vector3(24,17,24);rain.direction1=new B.Vector3(-.8,-24,-.4);rain.direction2=new B.Vector3(-.3,-28,.4);rain.minLifeTime=rain.maxLifeTime=.72;rain.minSize=.03;rain.maxSize=.045;rain.minScaleY=11;rain.maxScaleY=15;rain.billboardMode=B.ParticleSystem.BILLBOARDMODE_STRETCHED;rain.color1=new B.Color4(.55,.72,.85,.3);rain.color2=new B.Color4(.45,.62,.78,.2);rain.colorDead=new B.Color4(.4,.5,.6,0);rain.emitRate=hi?3400:low?900:1800;rain.blendMode=B.ParticleSystem.BLENDMODE_ADD;rain.start();}
  let clock=0,last=null,prevPos=null;
  function tick(time,player){
   if(disposed)return;const dt=last===null?0:Math.min(.1,Math.max(0,time-last));last=time;clock=time;if(!player)return;
   if(rain){rain.emitter.x=player.x;rain.emitter.z=player.z;rain.emitter.y=0;}
   // the player's state for the stealth rules: crouching from the eye height, moving from how far they went
   const speed=prevPos&&dt?Math.hypot(player.x-prevPos.x,player.z-prevPos.z)/dt:0;prevPos={x:player.x,z:player.z};
   const p={x:player.x,z:player.z,crouch:player.y<1.4,moving:speed>.4,run:speed>4.2};
   if(dt>0)sec.step(dt,time,p);
   // actors: only those within range of the player are animated
   const near=(x,z,r)=>Math.hypot(x-player.x,z-player.z)<r,obs=new Map(sec.observers(time).map(o=>[o.id,o]));
   for(const r of robots){const o=obs.get(r.id);if(!o)continue;if(!near(o.x,o.z,120))continue;
    if(r.def.path){r.place(o.x,o.z,Sec.turnToward(r.yaw,o.yaw,dt*2.2));r.look(r.faceUntil>time?Math.atan2(player.x-o.x,player.z-o.z):o.yaw);}else{r.look(r.faceUntil>time?Math.atan2(player.x-o.x,player.z-o.z):o.yaw);}
    const pulse=.55+.45*Math.sin(time*2.4+o.x);r.light.visibility=pulse;for(const e of r.eyes)e.visibility=sec.seenBy===r.id?1:.6+.4*Math.sin(time*1.6);}
   for(const c of cams){const o=obs.get(c.id);if(o){c.aim(o.yaw,sec.seenBy===c.id);c.blink(time,sec.seenBy===c.id);}}
   for(const d of drs){const o=obs.get(d.id);if(o&&near(o.x,o.z,140))d.place(o.x,o.z,o.yaw,time,dt);}
   for(let i=bubbles.length-1;i>=0;i--){if(bubbles[i].until<time){bubbles[i].m.dispose();bubbles[i].tex.dispose();bubbles[i].mat.dispose();bubbles.splice(i,1);}}
   // ad screens redraw slowly
   for(const s of screens)if(time>s.next){s.next=time+s.period;s.draw(s.t.getContext(),s.cw,s.ch,time);s.t.update();}
   // the indicator
   const h=HUD[sec.state];if(hudT.textContent!==h[0]){hudT.textContent=h[0];hud.style.color=h[1];hud.style.borderColor=h[2];hudB.style.background=h[1];}hudB.style.width=Math.round(sec.detection*100)+'%';
   // fog of war for the V1 map: reveal around the player, save every few seconds
   if(fog&&time>fogNext){fogNext=time+.5;if(fog.reveal(player.x,player.z,18)>0)fogDirty=true;if(fogDirty&&time>fogSaved+4){fogSaved=time;fogDirty=false;if(flags)Area.save(space,fog,flags);try{save();}catch{}}}}
  return {tick,security:sec,fog,space,robots,cameras:cams,drones:drs,counts:n,say,get detection(){return sec.detection;},meshCount:()=>node.getChildMeshes().length,
   dispose(){if(disposed)return;disposed=true;if(fog&&flags){Area.save(space,fog,flags);try{save();}catch{}}hud.remove();rain?.dispose();for(const r of robots)r.dispose();for(const c of cams)c.dispose();for(const d of drs)d.dispose();for(const b of bubbles){b.m.dispose();b.tex.dispose();b.mat.dispose();}bubbles.length=0;
    node.dispose(false,true);for(const o of own)try{o.dispose();}catch{}own.length=0;
    scene.clearColor=prev.clear;scene.fogMode=prev.fogMode;scene.fogDensity=prev.fogDensity;scene.fogColor=prev.fogColor;ip.exposure=prev.exposure;ip.contrast=prev.contrast;if(prev.env!=null)scene.environmentIntensity=prev.env;
    if(sun&&lightPrev.sun!=null)sun.intensity=lightPrev.sun;if(ambient){if(lightPrev.amb!=null)ambient.intensity=lightPrev.amb;if(lightPrev.dif)ambient.diffuse=lightPrev.dif;if(lightPrev.gnd&&ambient.groundColor)ambient.groundColor=lightPrev.gnd;}}};
 }
 C.build=build;try{root.VoidMadeNPCs?.watchScene?.('corporate',C);}catch(e){}
})(typeof globalThis!=='undefined'?globalThis:this);
