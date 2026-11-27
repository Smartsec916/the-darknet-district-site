/* LOW QUAY, the end of the line (the owner's direction, 27 Nov 2026): the security vestibule where the rail enters the city, the dark tunnel with a repeating series of wall lamps,
   the underground subway station (platform, tiled walls, pillars, benches, route map and board as plain graphics, stairs and an escalator up) and the pedestrian-only quay city above it:
   narrow alleys between tall buildings, small squares, canal-side paths and one footbridge. No roads, no vehicles, no road markings, no traffic lights.
   No white lights: every lamp is a colour (amber, orange, teal, blue, magenta, green, red). Signs carry only the owner's text (LOW QUAY, HIGH-SPEED RAIL); the vestibule's
   SECURITY CHECKPOINT is generic wording and PROPOSED. Everything repeated is one built piece placed many times (low-quay.js kits and instances). Presentation only: the collision boxes
   and the two train interactions come from low-quay.js. Called from VoidLowQuay.build with its helpers. */
(function(root){
 'use strict';
 const api={};
 api.build=function(c){
  const {B,scene,parent,K,place,mat,glow,tex,sprite,hide,C,S,owned,textures,concD,conc,dark,steel,amber,blue,red,green,hazard,glass,Z,CX,SEG,WY,BLOCKS,quality,waterMat,STAIRS}=c,Y=c.CITY_Y;   // the quay city stands on ground Y above the viaduct; the tunnel and the subway station are under it
  const low=quality==='low',orange=glow('orange','#ff7a22',1.1),teal=glow('teal','#25c9c2',1),magenta=glow('magenta','#ff3fa6',1),violet=glow('violet','#8f5cff',1),dimTeal=glow('dimTeal','#12706e',.9);
  const sg=(key,w,h,draw,x,y,z,ry,k=1)=>{const t=tex(key,512,Math.round(512*h/w),draw),m=new B.StandardMaterial('lq-'+key,scene);m.diffuseColor=B.Color3.Black();m.emissiveTexture=t;m.disableLighting=true;m.specularColor=B.Color3.Black();t.level=k;owned.push(m);const p=B.MeshBuilder.CreatePlane('lq-'+key,{width:w,height:h},scene);p.material=m;p.position.set(x,y,z);p.rotation.y=ry;p.parent=parent;p.isPickable=false;return p;};
  const R=(()=>{let s=733;return ()=>((s=s*16807%2147483647)-1)/2147483646;})();
  // ---------------- the security vestibule (one reusable structure) ----------------
  const V=K(),vz0=Z.vestA,vz1=Z.vestB;
  const dk=mat('vdark','#1a1c20',{spec:.25}),band=mat('vband','#d6a018',{spec:.1});
  function vestibule(z0,z1){
   for(const sx of [1.2,16.8]){V.box(dk,1.6,8,z1-z0,sx,4,(z0+z1)/2);V.box(steel,.4,8,.4,sx+(sx<9?.9:-.9),4,z0+.2);V.box(steel,.4,8,.4,sx+(sx<9?.9:-.9),4,z1-.2);}
   V.box(dk,17.6,1.6,z1-z0,9,7.2,(z0+z1)/2);
   for(const zz of [z0,z1])for(let i=0;i<9;i++)V.box(i%2?dk:band,1.9,.7,.3,.5+i*1.95,6.4,zz);     // hazard header
   for(const zz of [z0+.3,z1-.3])for(const sx of [2.2,15.8]){V.box(steel,1.3,5.6,.5,sx,2.8,zz);V.box(amber,.12,5,.05,sx+(sx<9?.7:-.7),2.8,zz+(zz<(z0+z1)/2?-.28:.28));}   // blast-door leaves, drawn back
   for(const tx of [6,12]){for(const sx of [-1.9,1.9])V.box(steel,.35,4.4,.45,tx+sx,2.2,(z0+z1)/2);V.box(dk,4.15,.55,.6,tx,4.55,(z0+z1)/2);       // scanner arch
    for(let i=0;i<5;i++)V.box(i===2?red:green,.2,.12,.05,tx-.8+i*.4,4.55,(z0+z1)/2-.32);V.box(teal,3.4,.05,.05,tx,4.15,(z0+z1)/2-.3);}
   V.box(orange,15,.1,.3,9,6.9,(z0+z1)/2);
  }
  vestibule(vz0,vz1);const vk=V.done('vestibule');vk.forEach(m=>{m.isVisible=true;});
  sg('sign-sec',6,1.1,(g,w,h)=>{g.fillStyle='#1a0c04';g.fillRect(0,0,w,h);g.strokeStyle='#ff9a2a';g.lineWidth=6;g.strokeRect(5,5,w-10,h-10);g.fillStyle='#ffab3d';g.font='bold 62px sans-serif';g.textAlign='center';g.fillText('SECURITY CHECKPOINT',w/2,h*.67,w-44);},9,5.5,vz0-.45,0);   // PROPOSED wording
  // ---------------- the tunnel: ONE segment of shell and ONE lamp, placed in a row ----------------
  const TS=9,tN=Math.floor((Z.tunB-vz1)/TS),T=K(),tmat=mat('tunnel','#0b0c0e',{spec:.03});
  T.box(tmat,1.2,7.4,TS,1.4,3.7,0);T.box(tmat,1.2,7.4,TS,16.6,3.7,0);T.box(tmat,18.4,1.2,TS,9,7.4,0);
  const tun=T.done('tunnel');
  const L=K();L.box(orange,.3,.5,1.5,2.0,3.4,0);L.box(steel,.12,.12,1.9,1.88,3.4,0);L.box(orange,.3,.5,1.5,16.0,3.4,0);L.box(steel,.12,.12,1.9,16.12,3.4,0);const lampsT=L.done('tunnel-lamp');
  const gtex=tex('tglow',64,128,(g,w,h)=>{const gr=g.createRadialGradient(0,h/2,0,0,h/2,h*.5);gr.addColorStop(0,'rgba(255,150,60,.75)');gr.addColorStop(1,'rgba(255,130,40,0)');g.fillStyle=gr;g.fillRect(0,0,w,h);},true),gmat=sprite('tglow',gtex,true);
  const GL=K();GL.plane(gmat,3.2,2.4,2.03,3.4,0,Math.PI/2);GL.plane(gmat,3.2,2.4,15.97,3.4,0,-Math.PI/2);const tglow=GL.done('tunnel-glow');
  for(let i=0;i<tN;i++){const z=vz1+TS/2+i*TS;place(tun,0,0,z);place(lampsT,0,0,z);place(tglow,0,0,z);}
  // ---------------- the subway station under the city ----------------
  const hz0=Z.hallA,hz1=Z.hallB,H=5.2,tileTex=tex('tiles',256,256,(g,w,h)=>{g.fillStyle='#161b1f';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=32)for(let x=0;x<w;x+=32){const v=(R()*14)|0;g.fillStyle='rgb('+(26+v)+','+(40+v)+','+(44+v)+')';g.fillRect(x+1,y+1,30,30);}g.fillStyle='rgba(255,140,50,.18)';g.fillRect(0,h-34,w,6);}),tileM=new B.StandardMaterial('lq-tiles',scene);
  tileM.diffuseTexture=tileTex;tileM.specularColor=new B.Color3(.25,.3,.3);tileM.specularPower=48;tileM.maxSimultaneousLights=8;owned.push(tileM);
  const wallBox=(w,h,d,x,y,z)=>{const m=B.MeshBuilder.CreateBox('lq-hall-wall',{width:w,height:h,depth:d,faceUV:Array.from({length:6},(_,i)=>new B.Vector4(0,0,(i<2?w:d)/8,h/8))},scene);m.material=tileM;m.position.set(x,y,z);m.parent=parent;m.isPickable=false;return m;};
  wallBox(.8,H,hz1-hz0,-18.4,H/2,(hz0+hz1)/2);wallBox(.8,H,hz1-hz0,19.9,H/2,(hz0+hz1)/2);wallBox(3.7,H,.8,-16.35,H/2,hz1+.4);wallBox(19.2,H,.8,9.9,H/2,hz1+.4);wallBox(15,Y+1.2-H,.8,-7.1,H+(Y+1.2-H)/2,hz1+.4);   // the back wall, open at the stairwell (x -14.6..0.4); the headwall above it rises to a parapet on the quay
  wallBox(1,H,.8,-17.5,H/2,hz0-.4);wallBox(21.6,H,.8,-7,H/2,hz0-.4);
  S.box(concD,38.4,.6,hz1-hz0,.75,H+.3,(hz0+hz1)/2);                      // roof (the terrace's underside)
  const floorM=mat('hfloor','#2a2d31',{spec:.45,pow:48});S.box(floorM,21.9,.54,hz1-hz0,-7.25,-.23,(hz0+hz1)/2);S.box(floorM,3.5,.54,hz1-hz0,17.75,-.23,(hz0+hz1)/2);   // platform floor either side of the line's deck (x 2..16)
  S.box(hazard,.3,.05,hz1-hz0-2,2.9,.06,(hz0+hz1)/2);S.box(red,.08,.04,hz1-hz0-2,3.3,.07,(hz0+hz1)/2);   // platform-edge markings
  // ceiling light rows and pillars
  const PL=K();PL.box(conc,.9,H,.9,0,H/2,0);PL.box(orange,.1,.12,.05,0,1.2,.47);PL.box(orange,.1,.12,.05,0,1.2,-.47);const pillars=PL.done('pillar');
  const CL=K();CL.box(dark,2.6,.12,.7,0,0,0);CL.box(teal,2.3,.06,.45,0,-.08,0);const ceilLamp=CL.done('ceil-lamp');
  const BN=K();BN.box(steel,2.2,.12,.6,0,.5,0);BN.box(steel,2.2,.7,.1,0,.9,-.28);BN.box(dark,.1,.5,.5,-.9,.25,0);BN.box(dark,.1,.5,.5,.9,.25,0);const bench=BN.done('bench');
  for(let z=hz0+6;z<hz1;z+=8){place(pillars,-6,0,z);place(pillars,17.6,0,z);}   // clear of both tracks (the second train runs at x 12)
  for(let z=hz0+4;z<hz1;z+=6){place(ceilLamp,-10,H-.1,z);place(ceilLamp,1,H-.1,z);place(ceilLamp,9,H-.1,z);}
  for(let z=hz0+8;z<hz1-4;z+=10)place(bench,-14.8,0,z,Math.PI/2);
  // the route map and departure board: plain graphics, no text
  sg('route-map',7,2.6,(g,w,h)=>{g.fillStyle='#07090d';g.fillRect(0,0,w,h);g.strokeStyle='#25c9c2';g.lineWidth=14;g.beginPath();g.moveTo(40,h*.7);g.lineTo(w*.4,h*.7);g.lineTo(w*.55,h*.3);g.lineTo(w-40,h*.3);g.stroke();g.strokeStyle='#ff3fa6';g.beginPath();g.moveTo(40,h*.3);g.lineTo(w*.3,h*.3);g.lineTo(w*.55,h*.7);g.lineTo(w-40,h*.7);g.stroke();g.fillStyle='#ffab3d';for(const [x,y] of [[w*.4,h*.7],[w*.55,h*.3],[w*.3,h*.3],[w*.55,h*.7]]){g.beginPath();g.arc(x,y,16,0,7);g.fill();}g.strokeStyle='#ffab3d';g.lineWidth=5;g.strokeRect(6,6,w-12,h-12);},-17.95,2.8,hz0+16,Math.PI/2,1);
  sg('board',4.4,1.1,(g,w,h)=>{g.fillStyle='#07090d';g.fillRect(0,0,w,h);const cols=['#25c9c2','#ffab3d','#ff3fa6'];for(let i=0;i<4;i++){g.fillStyle=cols[i%3];g.fillRect(24,18+i*(h/4.3),70+R()*140,h/9);g.fillStyle='#8f5cff';g.fillRect(w-120,18+i*(h/4.3),90,h/9);}g.strokeStyle='#25c9c2';g.lineWidth=5;g.strokeRect(4,4,w-8,h-8);},-6,4.2,hz0+30,0,1);
  sg('sign-hall-rail',6,1,(g,w,h)=>{g.fillStyle='#0b2a4e';g.fillRect(0,0,w,h);g.strokeStyle='#4aa8ff';g.lineWidth=6;g.strokeRect(5,5,w-10,h-10);g.fillStyle='#7cc4ff';g.font='bold 72px sans-serif';g.textAlign='center';g.fillText('HIGH-SPEED RAIL',w/2,h*.7,w-44);},-17.95,4.2,hz0+30,Math.PI/2,1);
  sg('sign-hall-quay',3.4,.9,(g,w,h)=>{g.fillStyle='#1b2a52';g.fillRect(0,0,w,h);g.fillStyle='#8fb6ff';g.font='bold 80px sans-serif';g.textAlign='center';g.fillText('LOW QUAY',w/2,h*.72,w-44);},-7,4.5,hz1-.45,Math.PI,1);
  // ---------------- stairs and escalator up to the quay ----------------
  const [s0,s1]=STAIRS,SL=s1-s0,NS=28,run=SL/NS,rise=Y/NS;   // the walk height follows VoidLowQuay.groundHeight(z): a straight ramp from s0 to s1 under the steps
  for(let i=0;i<NS;i++){S.box(concD,11,(i+1)*rise,run,-8.7,(i+1)*rise/2,s0+i*run+run/2);if(i%2===0)S.box(amber,11,.03,.06,-8.7,(i+1)*rise+.015,s0+i*run+.04);}
  S.box(concD,.6,Y+1.4,SL,-14.5,(Y+1.4)/2,s0+SL/2);S.box(concD,.6,Y+1.4,SL,.3,(Y+1.4)/2,s0+SL/2);S.box(concD,.4,Y+.6,SL,-3.05,(Y+.6)/2,s0+SL/2);S.box(steel,.08,.08,SL+1,-3.05,Y+.65,s0+SL/2);
  const escMat=new B.StandardMaterial('lq-esc',scene),escTex=tex('esc',64,256,(g,w,h)=>{g.fillStyle='#14171b';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=16){g.fillStyle='#2b3138';g.fillRect(4,y+2,w-8,11);g.fillStyle='#ff7a22';g.fillRect(4,y+13,w-8,2);}});
  escMat.diffuseTexture=escTex;escMat.emissiveColor=new B.Color3(.12,.07,.03);escMat.specularColor=B.Color3.Black();owned.push(escMat);escTex.vScale=10;
  const esc=B.MeshBuilder.CreateBox('lq-escalator',{width:2.2,height:.25,depth:Math.hypot(SL,Y)},scene);esc.material=escMat;esc.position.set(-1.6,Y/2-.1,s0+SL/2);esc.rotation.x=-Math.atan2(Y,SL);esc.parent=parent;esc.isPickable=false;
  // ---------------- the quay terrace, canal, footbridge ----------------
  const pave=new B.StandardMaterial('lq-pave',scene),pt=tex('pave',512,512,(g,w,h)=>{g.fillStyle='#24262b';g.fillRect(0,0,w,h);g.strokeStyle='rgba(0,0,0,.5)';g.lineWidth=2;for(let i=0;i<=w;i+=64){g.beginPath();g.moveTo(i,0);g.lineTo(i,h);g.stroke();g.beginPath();g.moveTo(0,i);g.lineTo(w,i);g.stroke();}for(let i=0;i<30;i++){const x=R()*w,y=R()*h,rad=20+R()*60,gr=g.createRadialGradient(x,y,0,x,y,rad);gr.addColorStop(0,'rgba(255,150,70,.16)');gr.addColorStop(1,'rgba(255,150,70,0)');g.fillStyle=gr;g.fillRect(x-rad,y-rad,rad*2,rad*2);}});
  pave.diffuseTexture=pt;pave.specularColor=new B.Color3(.4,.4,.45);pave.specularPower=40;pave.maxSimultaneousLights=8;owned.push(pave);
  const QZ0=Z.vestB,QZ1=480,top=(x0,x1,z0,z1)=>{const g=B.MeshBuilder.CreateGround('lq-terrace',{width:x1-x0,height:z1-z0},scene),uv=g.getVerticesData('uv');for(let i=0;i<uv.length;i+=2){uv[i]*=(x1-x0)/8;uv[i+1]*=(z1-z0)/8;}g.setVerticesData('uv',uv);g.position.set((x0+x1)/2,Y+.01,(z0+z1)/2);g.material=pave;g.parent=parent;g.isPickable=false;};
  // the ground of the quay (everything from the tunnel mouth on), open at the canal and over the stairwell
  top(-64,64,QZ0,s0);top(-64,-40,s0,QZ1);top(-30,-14.8,s0,QZ1);top(-14.8,.6,s1,QZ1);top(.6,64,s0,QZ1);
  // the sea wall: the quay's outer faces, the tunnel mouth left open in the south face
  const face=(w,h,x,y,z,ry)=>{const p=B.MeshBuilder.CreatePlane('lq-seawall',{width:w,height:h},scene);p.material=concD;p.position.set(x,y,z);p.rotation.y=ry;p.parent=parent;p.isPickable=false;return p;};
  face(64.8,Y-WY,-32,(Y+WY)/2,QZ0,0);face(46.8,Y-WY,40.6,(Y+WY)/2,QZ0,0);face(16.4,Y-8,9,(Y+8)/2,QZ0,0);face(16.4,-1.6-WY,9,(WY-1.6)/2,QZ0,0);
  face(QZ1-QZ0,Y-WY,64,(Y+WY)/2,(QZ0+QZ1)/2,-Math.PI/2);face(QZ1-QZ0,Y-WY,-64,(Y+WY)/2,(QZ0+QZ1)/2,Math.PI/2);
  S.box(concD,130,.5,1.2,0,Y+.25,QZ0+.6);S.box(amber,130,.06,.06,0,Y+.55,QZ0+.1);   // the parapet along the sea wall
  // the canal: its walls, the water a little below the paths, the end wall
  face(QZ1-s0,1.8,-30,Y-.9,(s0+QZ1)/2,Math.PI/2);face(QZ1-s0,1.8,-40,Y-.9,(s0+QZ1)/2,-Math.PI/2);face(10,1.8,-35,Y-.9,s0,Math.PI);
  const cw=B.MeshBuilder.CreateGround('lq-canal',{width:10,height:QZ1-s0},scene);cw.position.set(-35,Y-1.6,(s0+QZ1)/2);cw.material=waterMat;cw.parent=parent;cw.isPickable=false;
  S.box(concD,10,1.1,8,-35,Y-.55,340);S.box(amber,10,.05,.12,-35,Y+.03,336.1);S.box(amber,10,.05,.12,-35,Y+.03,343.9);   // the footbridge
  // railings along both canal paths: posts, a rail, and a lamp every 12 m
  const rl=K();rl.box(steel,.1,1,.1,0,.5,0);rl.box(steel,4,.07,.07,2,1,0);const rails=rl.done('railing');
  const lp=K();lp.box(steel,.12,3.4,.12,0,1.7,0);lp.box(steel,.5,.1,.1,.2,3.35,0);lp.box(amber,.34,.26,.34,.42,3.22,0);const lampPost=lp.done('quay-lamp');
  for(let z=300;z<456;z+=4)for(const x of [-30.2,-39.8]){if(z>=336&&z<344)continue;place(rails,x,Y,z,Math.PI/2);}
  for(let z=306;z<456;z+=12)for(const [x,ry] of [[-28,0],[-42,Math.PI]]){if(z>=334&&z<346)continue;place(lampPost,x,Y,z,ry);}
  // ---------------- the buildings: windowed boxes between 4 m alleys ----------------
  const winTex=(name,tints)=>tex(name,256,256,(g,w,h)=>{g.fillStyle='#090b10';g.fillRect(0,0,w,h);g.fillStyle='#12151c';for(let r=0;r<10;r++)g.fillRect(0,r*25.6+21,w,3);   // ten floors of eight bays: small windows, most of them dark
   for(let r=0;r<10;r++)for(let q=0;q<8;q++){const lit=R()<.32;g.globalAlpha=lit?.45+R()*.45:1;g.fillStyle=lit?tints[(R()*tints.length)|0]:'#0f131a';g.fillRect(q*32+7,r*25.6+6,18,12);if(lit&&R()<.4){g.globalAlpha=.6;g.fillStyle='#0b0d12';g.fillRect(q*32+7+R()*10,r*25.6+6,6,12);}}g.globalAlpha=1;});
  const faceMats=[['facA',['#ffb04a','#ff8a2a','#25c9c2']],['facB',['#25c9c2','#4aa8ff','#ffab3d']],['facC',['#ff3fa6','#ffab3d','#8f5cff']]].map(([k,t])=>{const m=new B.StandardMaterial('lq-'+k,scene);m.diffuseColor=new B.Color3(.05,.05,.06);m.emissiveTexture=winTex(k,t);m.specularColor=B.Color3.Black();m.maxSimultaneousLights=8;owned.push(m);m.emissiveTexture.wrapU=m.emissiveTexture.wrapV=1;return m;});
  const bparts=faceMats.map(()=>[]);
  // the quay's south end over the tunnel and the station: buildings seen from the viaduct and across the canal, not walkable (no solids; the city's walkable ground starts at the stairwell)
  const FAR=[[22,40,175,200,30],[44,62,175,205,46],[22,40,210,240,38],[44,62,212,245,26],[22,40,250,290,52],[44,62,255,292,34],[-62,-44,175,210,30],[-62,-44,220,260,44],[-40,-22,180,215,24],[-38,-22,225,262,36],[-62,-40,268,292,28],[-36,-20,270,292,20]];
  [...BLOCKS,...FAR].forEach(([x0,x1,z0,z1,h],i)=>{const k=i%3,w=x1-x0,d=z1-z0,uv=(a,b)=>new B.Vector4(0,0,a/12,h/25.6);const m=B.MeshBuilder.CreateBox('lq-block',{width:w,height:h,depth:d,faceUV:[uv(w),uv(w),uv(d),uv(d),new B.Vector4(.01,.01,.02,.02),new B.Vector4(.01,.01,.02,.02)]},scene);m.position.set((x0+x1)/2,Y+h/2,(z0+z1)/2);m.material=faceMats[k];bparts[k].push(m);});
  bparts.forEach((list,k)=>{if(!list.length)return;const m=B.Mesh.MergeMeshes(list,true,true,undefined,false,false);m.material=faceMats[k];m.parent=parent;m.isPickable=false;});
  // shopfronts, awnings, lamps and pipes on the alley walls: four built pieces, instanced
  const shops=['#ff9a3a','#25c9c2','#ff3fa6'].map((col,i)=>{const t=tex('shop'+i,64,64,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,col);gr.addColorStop(1,'#1a0d08');g.fillStyle=gr;g.fillRect(0,0,w,h);g.fillStyle='rgba(8,8,12,.6)';g.fillRect(6,h*.55,10,h*.45);g.fillRect(34,h*.6,9,h*.4);g.fillRect(0,0,w,5);g.fillRect(w/2-1,0,2,h);});const m=new B.StandardMaterial('lq-shop'+i,scene);m.diffuseColor=B.Color3.Black();m.emissiveTexture=t;m.disableLighting=true;m.specularColor=B.Color3.Black();owned.push(m);const k=K();k.plane(m,3.4,2.5,0,1.35,0);return k.done('shopfront'+i);});
  const awn=K();awn.box(mat('awning','#3a2430',{spec:.05}),3.8,.12,1.3,0,2.85,-.55,0,.35);awn.box(orange,3.8,.05,.05,0,2.55,-1.15);const awning=awn.done('awning');
  const brk=K();brk.box(steel,.1,.1,.4,0,3.3,-.2);brk.box(amber,.28,.24,.28,0,3.2,-.42);const bracket=brk.done('bracket');
  const pp=K();pp.cyl(steel,.1,12,.0,6,0,8);pp.box(steel,.3,.12,.3,0,4,0);pp.box(steel,.3,.12,.3,0,9,0);const pipe=pp.done('pipe');
  const AC=K();AC.box(dark,.9,.7,.5,0,0,0);AC.box(dimTeal,.3,.04,.04,0,-.1,-.27);const ac=AC.done('unit');
  let shopIdx=0;
  for(const [x0,x1,z0,z1,h] of BLOCKS){
   const faces=[[x0,z0,1,0,0,-1,x1-x0],[x0,z1,1,0,0,1,x1-x0],[x0,z0,0,1,-1,0,z1-z0],[x1,z0,0,1,1,0,z1-z0]];   // origin, along, outward normal, length
   for(const [ox,oz,ax,az,nx,nz,len] of faces){const ry=Math.atan2(-nx,-nz)+Math.PI,rot=nz>0?Math.PI:nz<0?0:nx>0?-Math.PI/2:Math.PI/2;
    for(let s=2.5;s<len-1.5;s+=6.2){if(R()<.15)continue;const px=ox+ax*s+nx*.04,pz=oz+az*s+nz*.04;place(shops[shopIdx++%3],px,Y,pz,rot);place(awning,px,Y,pz,rot);place(bracket,px+ax*3.1,Y,pz+az*3.1,rot);}
    if(R()<.7){const s=len*.5,px=ox+ax*s+nx*.05,pz=oz+az*s+nz*.05;place(pipe,px,Y,pz,rot,1,Math.min(1,h/12));}
    if(R()<.5){const s=len*(.25+R()*.5),px=ox+ax*s+nx*.3,pz=oz+az*s+nz*.3;place(ac,px,Y+6+R()*5,pz,rot);}}
  }
  // abstract neon blades (no text) and the owner's LOW QUAY sign with the wave mark on the back wall
  const neon=tex('neon',256,256,(g,w,h)=>{g.fillStyle='#07090d';g.fillRect(0,0,w,h);g.lineWidth=8;const cols=['#ff3fa6','#25c9c2','#ffab3d','#8f5cff'];cols.forEach((col,i)=>{g.strokeStyle=col;const x=i*64+10,y=0;g.strokeRect(x+4,y+8,48,h-16);g.beginPath();g.moveTo(x+14,h*.3);g.lineTo(x+42,h*.3);g.moveTo(x+14,h*.55);g.lineTo(x+42,h*.55);g.moveTo(x+14,h*.8);g.lineTo(x+42,h*.8);g.stroke();});}),nm=new B.StandardMaterial('lq-neon',scene);
  nm.diffuseColor=B.Color3.Black();nm.emissiveTexture=neon;nm.disableLighting=true;nm.specularColor=B.Color3.Black();nm.backFaceCulling=false;owned.push(nm);
  const blades=[];BLOCKS.forEach(([x0,x1,z0,z1,h],i)=>{if(h<30)return;const nz=i%2?1:-1,z=nz>0?z1+.05:z0-.05,cx=(x0+x1)/2;const p=B.MeshBuilder.CreatePlane('lq-blade',{width:1.4,height:4.6,frontUVs:new B.Vector4((i%4)/4,0,(i%4)/4+.25,1),backUVs:new B.Vector4((i%4)/4,0,(i%4)/4+.25,1),sideOrientation:B.Mesh.DOUBLESIDE},scene);p.position.set(cx,Y+Math.min(h-4,10+R()*6),z);p.rotation.y=nz>0?Math.PI:0;p.material=nm;blades.push(p);});
  if(blades.length){const m=B.Mesh.MergeMeshes(blades,true,true,undefined,false,false);m.material=nm;m.parent=parent;m.isPickable=false;}
  sg('sign-city',16,5,(g,w,h)=>{g.fillStyle='#0b0d1e';g.fillRect(0,0,w,h);g.strokeStyle='#ff3fa6';g.lineWidth=10;g.strokeRect(6,6,w-12,h-12);g.fillStyle='#ff7ac8';g.font='bold 150px sans-serif';g.textAlign='center';g.fillText('LOW QUAY',w*.5,h*.5,w-44);g.strokeStyle='#25c9c2';g.lineWidth=14;for(let k=0;k<2;k++){g.beginPath();for(let q=0;q<=80;q++){const x=w*.3+q*(w*.4/80),y=h*.72+k*28+Math.sin(q*.35)*9;q?g.lineTo(x,y):g.moveTo(x,y);}g.stroke();}},1,Y+44,419.4,Math.PI,1.1);
  // the city's lamps: a quay lamp post per square corner and alley mouth
  for(const [x,z] of [[-24,330],[26,330],[-12,356],[2,356],[16,356],[34,356],[-22,386],[4,386],[22,386],[42,386],[-8,418],[10,418],[30,418],[50,418],[-24,322],[26,322],[44,330]])place(lampPost,x,Y,z,x<0?0:Math.PI);
  return {tick(time){escTex.vOffset=(time*.35)%1;}};
 };
 if(typeof module!=='undefined')module.exports=api;else root.VoidLowQuayCity=api;
})(globalThis);
