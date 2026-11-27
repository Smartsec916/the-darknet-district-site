/* PLUG & PLAY, a nightclub at Low Quay (the owner's request, 27 Nov 2026). The name, the sign text PLUG & PLAY and the wall sign's design (chrome letters with a pink
   neon outline, a plug and socket, a reclining figure drawn in neon above) are the owner's; his concept image is docs/development/universe-graphics/plugplay-reference.jpg.
   The ground floor of one quay city block, entered from the alley through an open doorway (the NULL club's way in: a hall in the same scene, no loading).
   Light after the VR area "Play in a Bedroom" (vr-suite-room.js, its rose mood: a magenta key, amber lamps and candles, violet, LED strips and floor washes); coloured
   only, never white. No dancing and no dance floor: curved plum booths round candle-lit tables with diners seated in pairs (the street figures' own sit clips; no
   dialogue, no new behaviours); an octagonal stage set back from the back wall, closed in on every side and over the top by thick bulletproof glass in a bolted steel
   frame with pink edge light, three amber-lit steps at the front, one chrome pole in its centre, empty; quilted panels lit pink behind it; an arched alcove lounge
   with sofas, candles, a diamond-pattern lit panel and pink light bars; exposed ducts and pink ceiling panels; palms in chrome planters.
   Repeated furniture is built once and instanced. The layout and collision are plain data (Node-tested, tests/low-quay.test.cjs). */
(function(root){
 'use strict';
 // Metres in Low Quay's own space (x east, z north; the floor is the quay level). The club is the ground floor of the block x 26..44, z 358..384; the door is in its west wall.
 const CLUB={x0:26,x1:44,z0:358,z1:384},WALL=.6,H=5,DOOR={x:26,z:371,half:1.15,h:3.1};
 const STAGE={x:35.9,z:371,apothem:3.2,h:.6,glass:3.6,t:.14,steps:3,stepDepth:.46,stepWidth:3.4};   // octagon: flats face the four walls; the back flat is 1.3 m off the back wall (BACK.x)
 // Back of house (the owner): a SIDE wall north of the stage closes off the club's north-east corner; two doors in it, clearly apart. The nearer the dining floor
 // (west) is the KITCHEN's; the other is the BACKSTAGE's. A serving hatch and the owner's wall sign sit between them. The backstage is a dressing and storage room
 // (north-east) joined to a corridor behind the stage's back wall; the stage's back door stands open onto it, so the stage is seen from backstage, but a low chrome
 // bar and collision close the doorway: nobody reaches the stage or the space behind the glass. Plain walkable doorways in the same hall (no loading, no interaction).
 const SIDE={z:377.9,t:.3,x0:33,kitchenDoor:[34.3,35.4],backDoor:[39.3,40.3],hatch:[36,37.6,1,1.8],doorH:2.4};
 const BACK={x:40.4,t:.3,z0:364.8,z1:377.9,door:{z:371,half:.55,h:2.4},room:{x0:39.2,z1:383.4},split:38.9};
 const BACK_PROPS={mirror:[42.95,43.4,365.6,368.4],chair:[42.05,42.55,366.75,367.25],rail:[42.4,43.05,368.9,371.6],lockers:[42.95,43.4,372.2,375.6],crates:[41.4,42.7,382.1,383.4],trunk:[39.5,40.6,382.6,383.4]};
 // The kitchen: stainless counters, a range with a hood, a prep island, a serving hatch shelf, a sink, fridges, shelves; the cooking is done by industrial robot arms
 // (the owner: mechanical, not humanoid): three counter-mounted arms (spatula at the range, ladle at the island, gripper at the hatch) and a gantry arm on a rail.
 const KITCHEN={x0:33.3,x1:38.9,z0:378.2,z1:383.4,counter:[33.3,38.9,382.75,383.4],range:[38.2,38.9,379.1,381.7],island:[35.3,37.1,379.9,380.9],fridge:[33.3,34,379.4,381.9],pass:[35.8,37.8,378.2,378.6]};
 const ARMS=[{id:'spatula',x:37.7,z:383.05,y:.92,yaw:Math.PI*.75,phase:0},{id:'ladle',x:37,z:380.4,y:.92,yaw:Math.PI/2,phase:1.7},{id:'gripper',x:37.4,z:378.4,y:.92,yaw:-Math.PI/2,phase:3.1}];
 const GANTRY={x0:33.8,x1:38.4,z:382.1,y:3.2,phase:.9};
 const ALCOVE={x0:35.4,x1:43.4,z0:358.6,z1:364.4,wall:.4,arch:[36.4,39.6],archTop:4};   // the lounge in the south-east corner, through an arch
 // Booths: a curved banquette round a small table, open toward the stage (+x). [table x, z]
 const BOOTHS=[[29.2,362.2],[29.2,366.2],[29.2,375.8],[29.2,379.8],[32.9,362.4]];
 const BOOTH_R=1,BOOTH_ARC=[70,290];   // seat radius (m) and the arc it covers, in degrees from +x
 const seatAt=(b,deg)=>{const a=deg*Math.PI/180,[x,z]=BOOTHS[b];return [x+Math.cos(a)*.98,z+Math.sin(a)*.98,Math.atan2(-Math.cos(a),-Math.sin(a))];};   // [x,z,yaw facing the table]
 const SOFAS=[{x0:36,x1:42.6,z0:358.6,z1:359.5},{x0:42.5,x1:43.4,z0:359.5,z1:363.6}],LOUNGE_TABLES=[[38.1,361.2],[41,361.5]];
 const PLANTERS=[[27.2,364.2],[27.2,377.8],[32,366.3],[32,375.7],[35.9,363.4]];
 // Who sits where: generic CC0-made street figures (crowd.js street looks, their own sit / sit-talk clips), never the licensed companions. [x,z,yaw,look,clip]
 const DINERS=[[...seatAt(0,160),'npc-club-f','sit-talk'],[...seatAt(0,220),'npc-club-m','sit'],[...seatAt(2,150),'npc-casual-f','sit'],[...seatAt(2,205),'npc-hacker','sit-talk'],
  [...seatAt(4,165),'npc-cyber-pvc','sit-talk'],[...seatAt(4,215),'npc-casual-m','sit'],[...seatAt(1,145),'npc-student','sit'],[...seatAt(1,205),'npc-lookout','sit-talk'],
  [38.9,359.25,0,'npc-club-f','sit-talk'],[40.3,359.25,0,'npc-club-m','sit']];
 const LOOKS=[...new Set(DINERS.map(d=>d[3]))];
 const inside=(x,z,m=0)=>x>CLUB.x0+WALL-m&&x<CLUB.x1-WALL+m&&z>CLUB.z0+WALL-m&&z<CLUB.z1-WALL+m;
 const isClubBlock=b=>b[0]===CLUB.x0&&b[1]===CLUB.x1&&b[2]===CLUB.z0&&b[3]===CLUB.z1;
 function solids(){const S=[],W=(id,x0,x1,z0,z1,h=H)=>S.push({id:'club-'+id,position:[(x0+x1)/2,h/2,(z0+z1)/2],size:[x1-x0,h,z1-z0]});
  W('wall-s',CLUB.x0,CLUB.x1,CLUB.z0,CLUB.z0+WALL);W('wall-n',CLUB.x0,CLUB.x1,CLUB.z1-WALL,CLUB.z1);W('wall-e',CLUB.x1-WALL,CLUB.x1,CLUB.z0,CLUB.z1);
  W('wall-w-s',CLUB.x0,CLUB.x0+WALL,CLUB.z0,DOOR.z-DOOR.half);W('wall-w-n',CLUB.x0,CLUB.x0+WALL,DOOR.z+DOOR.half,CLUB.z1);
  const a=STAGE.apothem;W('stage',STAGE.x-a-STAGE.steps*STAGE.stepDepth,STAGE.x+a+.1,STAGE.z-a-.1,STAGE.z+a+.1,STAGE.glass+STAGE.h);   // the glass and its steps: seen, never reached
  W('stage-back',STAGE.x+STAGE.apothem,BACK.x,BACK.z0,STAGE.z+STAGE.apothem+.8,3);   // between the glass and the back wall: closed off (the back doorway leads only onto this)
  const bd=BACK.door,E=CLUB.x1-WALL,N=CLUB.z1-WALL,sz0=SIDE.z,sz1=SIDE.z+SIDE.t,[kd0,kd1]=SIDE.kitchenDoor,[bd0,bd1]=SIDE.backDoor;
  W('back-wall-s',BACK.x,BACK.x+BACK.t,BACK.z0,bd.z-bd.half);W('back-wall-n',BACK.x,BACK.x+BACK.t,bd.z+bd.half,BACK.z1);
  W('side-w',SIDE.x0,kd0,sz0,sz1);W('side-mid',kd1,bd0,sz0,sz1);W('side-e',bd1,BACK.x,sz0,sz1);
  W('kitchen-wall-w',SIDE.x0,KITCHEN.x0,sz1,N);W('kitchen-split',BACK.split,BACK.room.x0,sz1,N);
  for(const [k,[a0,a1,b0,b1]] of Object.entries(BACK_PROPS))W('back-'+k,a0,a1,b0,b1,2);
  for(const k of ['counter','range','island','fridge','pass']){const [a0,a1,b0,b1]=KITCHEN[k];W('kitchen-'+k,a0,a1,b0,b1,k==='fridge'?2.1:1);}
  W('arch-w',ALCOVE.x0,ALCOVE.arch[0],ALCOVE.z1,ALCOVE.z1+ALCOVE.wall);W('arch-e',ALCOVE.arch[1],ALCOVE.x1,ALCOVE.z1,ALCOVE.z1+ALCOVE.wall);
  BOOTHS.forEach(([x,z],i)=>W('booth-'+i,x-1.42,x+.5,z-1.42,z+1.42,1.1));SOFAS.forEach((s,i)=>W('sofa-'+i,s.x0,s.x1,s.z0,s.z1,1));LOUNGE_TABLES.forEach(([x,z],i)=>W('lounge-table-'+i,x-.4,x+.4,z-.4,z+.4,.7));
  PLANTERS.forEach(([x,z],i)=>W('planter-'+i,x-.32,x+.32,z-.32,z+.32,.8));
  return S;}
 const ROBOT_PIECES=['base','upper','fore','spatula','ladle','gripper','carriage','rail'];
 const models=()=>({...Object.fromEntries(LOOKS.map(l=>['crowd:'+l,{src:'assets/models/crowd/'+l+'.glb',background:true}])),...Object.fromEntries(ROBOT_PIECES.map(p=>['lowquay:robot-'+p,{src:'assets/models/low-quay/robot-'+p+'.glb',scale:1}]))});
 const api={CLUB,WALL,H,DOOR,STAGE,SIDE,BACK,BACK_PROPS,KITCHEN,ARMS,GANTRY,ALCOVE,BOOTHS,BOOTH_R,BOOTH_ARC,SOFAS,LOUNGE_TABLES,PLANTERS,DINERS,LOOKS,seatAt,inside,isClubBlock,solids,models};
 if(typeof module!=='undefined'&&module.exports){module.exports=api;return;}

 // ================= browser: the build (called from low-quay-city.js with its helpers; the floor is at Y) =================
 api.build=function(c){
  const {B,scene,parent,K,place,mat,glow,tex,sprite,owned,steel,Y,quality}=c,low=quality==='low',C=h=>B.Color3.FromHexString(h),P=Math.PI;
  const plaster=mat('club-plaster','#3a2238',{spec:.08}),floorM=mat('club-floor','#0e0b10',{spec:.7,pow:110}),velvet=mat('club-velvet','#5a1a4a',{spec:.3,pow:40}),plum=mat('club-plum','#2c1236',{spec:.3,pow:40});
  const chrome=mat('club-chrome','#9a8aa6',{spec:1,pow:160}),black=mat('club-black','#0a080c',{spec:.45,pow:70}),duct=mat('club-duct','#2a2230',{spec:.6,pow:60});
  const mag=glow('club-mag','#ff2d96',1.5),pink=glow('club-pink','#ff4fb0',1.2),vio=glow('club-vio','#9a4dff',1.1),amb=glow('club-amb','#ffae5c',1.2),candle=glow('club-candle','#ffa040',1.6);
  const glassM=new B.StandardMaterial('lq-club-glass',scene);glassM.diffuseColor=C('#1a1020');glassM.alpha=.18;glassM.specularColor=new B.Color3(1,.8,.95);glassM.specularPower=180;glassM.emissiveColor=C('#140a1a');glassM.backFaceCulling=false;glassM.maxSimultaneousLights=8;owned.push(glassM);
  const T=(key,w,h,draw,alpha=false)=>tex('club-'+key,w,h,draw,alpha);
  const washOf=(key,rgb,a)=>sprite('club-'+key,T(key,128,128,(g,w,h)=>{const gr=g.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,'rgba('+rgb+','+a+')');gr.addColorStop(1,'rgba('+rgb+',0)');g.fillStyle=gr;g.fillRect(0,0,w,h);},true),true);
  const wMag=washOf('wash-mag','255,45,150',.45),wAmb=washOf('wash-amb','255,160,80',.42),wVio=washOf('wash-vio','175,60,235',.38);
  const flat=(m,w,h,x,y,z,ry=0,rx=0)=>{const p=B.MeshBuilder.CreatePlane('lq-club-flat',{width:w,height:h},scene);p.material=m;p.position.set(x,y,z);p.rotation.set(rx,ry,0);p.parent=parent;p.isPickable=false;owned.push(p);return p;};
  const glowTex=(key,w,h,draw)=>{const t=T(key,w,h,draw,true),m=new B.StandardMaterial('lq-club-'+key,scene);m.diffuseColor=B.Color3.Black();m.emissiveTexture=t;m.opacityTexture=t;m.disableLighting=true;m.specularColor=B.Color3.Black();owned.push(m);return m;};
  const S=K(),{x0,x1,z0,z1}=CLUB,cx=(x0+x1)/2,cz=(z0+z1)/2,fl=Y+.02;
  // ---- shell: walls (doorway open), black ceiling, polished floor ----
  S.box(plaster,x1-x0,H,WALL,cx,Y+H/2,z0+WALL/2);S.box(plaster,x1-x0,H,WALL,cx,Y+H/2,z1-WALL/2);S.box(plaster,WALL,H,z1-z0,x1-WALL/2,Y+H/2,cz);
  const wN=DOOR.z-DOOR.half-z0,wS=z1-DOOR.z-DOOR.half;S.box(plaster,WALL,H,wN,x0+WALL/2,Y+H/2,z0+wN/2);S.box(plaster,WALL,H,wS,x0+WALL/2,Y+H/2,z1-wS/2);S.box(plaster,WALL,H-DOOR.h,DOOR.half*2,x0+WALL/2,Y+DOOR.h+(H-DOOR.h)/2,DOOR.z);
  S.box(black,x1-x0,.2,z1-z0,cx,Y+H-.1,cz);S.box(floorM,x1-x0-2*WALL,.03,z1-z0-2*WALL,cx,Y+.015,cz);
  for(const s of [-1,1]){S.box(chrome,.7,DOOR.h,.1,x0+.3,Y+DOOR.h/2,DOOR.z+s*(DOOR.half+.05));S.box(pink,.04,DOOR.h-.2,.04,x0-.03,Y+DOOR.h/2,DOOR.z+s*(DOOR.half-.04));S.box(pink,.04,DOOR.h-.2,.04,x0+WALL+.03,Y+DOOR.h/2,DOOR.z+s*(DOOR.half-.04));}
  S.box(chrome,.7,.12,DOOR.half*2+.2,x0+.3,Y+DOOR.h+.06,DOOR.z);
  // ---- ceiling: three exposed ducts with a pink rim, hangers, recessed pink panels ----
  for(const x of [28.6,32.4,36.2]){S.cyl(duct,.32,z1-z0-1.4,x,Y+4.35,cz,14,P/2);S.box(pink,.04,.03,z1-z0-1.6,x+.3,Y+4.18,cz);for(let z=z0+2;z<z1-1;z+=3.5)S.box(steel,.05,.5,.05,x,Y+4.7,z);}
  for(const [x,z] of [[30.5,361],[30.5,368],[30.5,374],[30.5,381],[34.3,364],[34.3,378]])S.box(mag,1.4,.02,.6,x,Y+H-.21,z);
  S.box(vio,.05,.04,z1-z0-1.4,x0+WALL+.1,Y+H-.32,cz);S.box(vio,x1-x0-1.4,.04,.05,cx,Y+H-.32,z1-WALL-.1);
  // ---- the stage: an octagonal platform, three amber-edged steps, the chrome pole, glass all round and over the top ----
  const {x:sx,z:sz,apothem:a,h:sh,glass:gh,t}=STAGE,R=a/Math.cos(P/8),side=2*a*Math.tan(P/8);
  const oct=(m,r,hh,y)=>{const o=B.MeshBuilder.CreateCylinder('lq-club-oct',{diameter:2*r,height:hh,tessellation:8},scene);o.rotation.y=P/8;o.position.set(sx,y,sz);o.material=m;o.parent=parent;o.isPickable=false;owned.push(o);return o;};
  oct(black,R,sh,Y+sh/2);oct(plum,R-.25,.02,Y+sh+.01);
  for(let i=0;i<STAGE.steps;i++){const d=(i+1)*STAGE.stepDepth,hh=sh*(STAGE.steps-i)/STAGE.steps;S.box(black,STAGE.stepDepth,hh,STAGE.stepWidth,sx-a-d+STAGE.stepDepth/2,Y+hh/2,sz);S.box(amb,.03,.03,STAGE.stepWidth,sx-a-d+.015,Y+hh-.02,sz);}
  S.cyl(chrome,.045,gh,sx,Y+sh+gh/2,sz,18);S.cyl(chrome,.16,.06,sx,Y+sh+.03,sz,20);
  for(let k=0;k<8;k++){const f=k*P/4,px=sx+Math.cos(f)*a,pz=sz+Math.sin(f)*a,ry=P/2-f;
   const pane=B.MeshBuilder.CreateBox('lq-club-pane',{width:side-.08,height:gh-.1,depth:t},scene);pane.material=glassM;pane.position.set(px,Y+sh+gh/2,pz);pane.rotation.y=ry;pane.parent=parent;pane.isPickable=false;owned.push(pane);
   for(const y of [Y+sh+.04,Y+sh+gh-.04]){const e=S.box(pink,side-.1,.035,.035,px+Math.cos(f)*(t/2+.02),y,pz+Math.sin(f)*(t/2+.02),ry);}
   const v=f+P/8,vx=sx+Math.cos(v)*R,vz=sz+Math.sin(v)*R;S.box(steel,.14,gh+.1,.14,vx,Y+sh+gh/2,vz);for(const y of [.4,1.4,2.4,3.3])S.cyl(chrome,.035,.05,vx+Math.cos(v)*.08,Y+sh+y,vz+Math.sin(v)*.08,8,P/2,0);}
  oct(glassM,R,.08,Y+sh+gh+.04);oct(steel,R+.12,.12,Y+sh+gh+.12).scaling.set(1,1,1);
  for(const dz of [-1.3,1.3]){S.cyl(black,.16,.22,sx-.6,Y+sh+gh-.12,sz+dz,12);S.cyl(vio,.1,.02,sx-.6,Y+sh+gh-.24,sz+dz,12);}
  const poolTex=glowTex('pole-glow',128,128,(g,w,h)=>{const gr=g.createRadialGradient(64,64,4,64,64,64);gr.addColorStop(0,'rgba(255,60,170,.85)');gr.addColorStop(.5,'rgba(255,45,150,.35)');gr.addColorStop(1,'rgba(255,45,150,0)');g.fillStyle=gr;g.fillRect(0,0,w,h);});
  poolTex.alphaMode=B.Engine.ALPHA_ADD;poolTex.disableDepthWrite=true;flat(poolTex,3.4,3.4,sx,Y+sh+.03,sz,0,P/2);
  // quilted panels on the back wall behind the stage, lit pink from below
  const quilt=glowTex('quilt',256,256,(g,w,h)=>{const gr=g.createLinearGradient(0,h,0,0);gr.addColorStop(0,'#c0247a');gr.addColorStop(.45,'#4a0f36');gr.addColorStop(1,'#14060f');g.fillStyle=gr;g.fillRect(0,0,w,h);g.strokeStyle='rgba(10,0,8,.7)';g.lineWidth=3;
   for(let i=-8;i<16;i++){g.beginPath();g.moveTo(i*32,0);g.lineTo(i*32+h,h);g.stroke();g.beginPath();g.moveTo(i*32,h);g.lineTo(i*32+h,0);g.stroke();}g.fillStyle='rgba(255,120,200,.35)';for(let y=16;y<h;y+=32)for(let x=16+((y/32)%2)*16;x<w;x+=32){g.beginPath();g.arc(x,y,2,0,7);g.fill();}});
  quilt.emissiveTexture.uScale=1.4;quilt.emissiveTexture.vScale=1.6;
  // ---- the back wall behind the stage (quilted either side of the open back door), the side wall with the kitchen and backstage doors and the serving hatch ----
  const bd=BACK.door,E=x1-WALL,N=z1-WALL,bxw=BACK.x+BACK.t/2,lw=bd.z-bd.half-BACK.z0,rw=BACK.z1-bd.z-bd.half,mid=(a,b)=>(a+b)/2;
  S.box(plaster,BACK.t,H,lw,bxw,Y+H/2,BACK.z0+lw/2);S.box(plaster,BACK.t,H,rw,bxw,Y+H/2,BACK.z1-rw/2);S.box(plaster,BACK.t,H-bd.h,bd.half*2,bxw,Y+bd.h+(H-bd.h)/2,bd.z);
  flat(quilt,lw-.2,4.2,BACK.x-.01,Y+2.25,BACK.z0+lw/2,P/2);flat(quilt,rw-.2,4.2,BACK.x-.01,Y+2.25,BACK.z1-rw/2,P/2);   // facing the stage (-x)
  for(const s of [-1,1])S.box(chrome,BACK.t+.04,bd.h,.06,bxw,Y+bd.h/2,bd.z+s*(bd.half+.03));S.box(chrome,BACK.t+.04,.06,bd.half*2+.12,bxw,Y+bd.h+.03,bd.z);S.box(pink,.03,.03,bd.half*2,BACK.x-.02,Y+bd.h+.08,bd.z);
  S.box(black,.05,bd.h-.04,bd.half*2-.04,BACK.x+BACK.t+.45,Y+bd.h/2,bd.z+bd.half+.1,-1.25);S.box(chrome,.05,.05,bd.half*2,BACK.x+BACK.t+.05,Y+.9,bd.z);for(const s of [-1,1])S.box(chrome,.05,.9,.05,BACK.x+BACK.t+.05,Y+.45,bd.z+s*bd.half);
  const sz0=SIDE.z,szc=SIDE.z+SIDE.t/2,dh=SIDE.doorH,[kd0,kd1]=SIDE.kitchenDoor,[bd0,bd1]=SIDE.backDoor,[h0,h1,hy0,hy1]=SIDE.hatch;
  const sideSeg=(a,b)=>S.box(plaster,b-a,H,SIDE.t,mid(a,b),Y+H/2,szc);sideSeg(SIDE.x0,kd0);sideSeg(kd1,h0);sideSeg(h1,bd0);sideSeg(bd1,BACK.x);
  for(const [a,b] of [[kd0,kd1],[bd0,bd1]]){S.box(plaster,b-a,H-dh,SIDE.t,mid(a,b),Y+dh+(H-dh)/2,szc);for(const x of [a-.03,b+.03])S.box(chrome,.06,dh,SIDE.t+.06,x,Y+dh/2,szc);S.box(pink,b-a,.03,.03,mid(a,b),Y+dh+.06,sz0-.02);}
  S.box(plaster,h1-h0,hy0,SIDE.t,mid(h0,h1),Y+hy0/2,szc);S.box(plaster,h1-h0,H-hy1,SIDE.t,mid(h0,h1),Y+hy1+(H-hy1)/2,szc);S.box(chrome,h1-h0+.2,.05,SIDE.t+.5,mid(h0,h1),Y+hy0,szc);S.box(amb,h1-h0,.02,.02,mid(h0,h1),Y+hy1-.03,sz0-.02);
  // a swinging service door to the kitchen, standing half open; the backstage doorway open
  S.box(mat('club-steel-door','#4a4650',{spec:.8,pow:90}),kd1-kd0-.06,dh-.05,.05,kd0+.35*Math.cos(-.9)+.02,Y+dh/2,sz0+SIDE.t+.35,0-.9);
  // ---- the backstage: corridor behind the stage and the dressing / storage room, dark walls, coloured bulbs and a violet lamp ----
  const back=mat('club-backstage','#16101a',{spec:.08}),cz2=mid(BACK.z0,BACK.z1),bx2=mid(BACK.x+BACK.t,E),rm=BACK.room;
  S.box(back,.04,H,N-BACK.z0,E-.02,Y+H/2,mid(BACK.z0,N));S.box(mat('club-back-floor','#141016',{spec:.3}),E-BACK.x-BACK.t,.03,N-BACK.z0,bx2,Y+.035,mid(BACK.z0,N));S.box(mat('club-back-floor','#141016',{}),BACK.x+BACK.t-rm.x0,.03,N-SIDE.z-SIDE.t,mid(rm.x0,BACK.x+BACK.t),Y+.035,mid(SIDE.z+SIDE.t,N));
  S.box(black,E-BACK.split,.1,N-BACK.z0,mid(BACK.split,E),Y+3.2,mid(BACK.z0,N));S.box(plaster,BACK.split-BACK.split+.3,H,N-SIDE.z-SIDE.t,BACK.split+.15,Y+H/2,mid(SIDE.z+SIDE.t,N));
  const BP=BACK_PROPS;
  {const [a0,a1,b0,b1]=BP.mirror;S.box(mat('club-dresser','#2a1a22',{spec:.3}),a1-a0,.78,b1-b0,mid(a0,a1),Y+.39,mid(b0,b1));S.box(mat('club-mirror','#1a1826',{spec:1,pow:200,em:'#0c0a14'}),.03,1.1,b1-b0-.4,E-.04,Y+1.5,mid(b0,b1));
   const bulb=glow('club-bulb','#ffb070',1.3),bulb2=glow('club-bulb2','#ff5fb0',1.3);for(let k=0;k<7;k++){const zz=b0+.25+k*(b1-b0-.5)/6;S.cyl(k%2?bulb2:bulb,.04,.06,E-.07,Y+2.1,zz,8,0,P/2);}for(let k=0;k<4;k++){const yy=1.05+k*.32;for(const zz of [b0+.22,b1-.22])S.cyl(k%2?bulb:bulb2,.04,.06,E-.07,Y+yy,zz,8,0,P/2);}}
  {const [a0,a1,b0,b1]=BP.chair;S.box(velvet,a1-a0,.06,b1-b0,mid(a0,a1),Y+.46,mid(b0,b1));S.box(velvet,.06,.5,b1-b0,a0+.03,Y+.74,mid(b0,b1));for(const dx of [.04,a1-a0-.04])for(const dz of [.04,b1-b0-.04])S.box(steel,.03,.46,.03,a0+dx,Y+.23,b0+dz);}
  {const [a0,a1,b0,b1]=BP.rail;for(const z of [b0+.05,b1-.05])S.box(chrome,.04,1.7,.04,mid(a0,a1),Y+.85,z);S.box(chrome,.04,.04,b1-b0,mid(a0,a1),Y+1.68,mid(b0,b1));
   const cloth=[mat('club-cloth-a','#5a1040',{spec:.3}),mat('club-cloth-b','#2a1a4a',{spec:.5,pow:60}),mat('club-cloth-c','#7a2a5a',{spec:.2}),mat('club-cloth-d','#111018',{spec:.6,pow:80})];
   for(let k=0;k<9;k++){const z=b0+.25+k*(b1-b0-.5)/8,hh=.75+(k%3)*.12;S.box(cloth[k%4],.42,hh,.06,mid(a0,a1),Y+1.62-hh/2,z);}}
  {const [a0,a1,b0,b1]=BP.lockers,lk=mat('club-locker','#2c2a36',{spec:.5,pow:60});for(let k=0;k<4;k++){const w=(b1-b0)/4,z=b0+w*(k+.5);S.box(lk,a1-a0,2,w-.03,mid(a0,a1),Y+1,z);S.box(steel,.02,.12,.03,a0-.01,Y+1.1,z+w*.3);S.box(black,.02,.05,w-.15,a0-.01,Y+1.8,z);}}
  {const [a0,a1,b0,b1]=BP.crates,cr=mat('club-crate','#3a2c22',{spec:.1});S.box(cr,a1-a0,.6,b1-b0,mid(a0,a1),Y+.3,mid(b0,b1));S.box(cr,.6,.5,.6,a0+.35,Y+.85,b0+.4);S.box(mat('club-case','#18141e',{spec:.6,pow:80}),.5,.35,.7,a1-.3,Y+.78,b1-.5);}
  {const [a0,a1,b0,b1]=BP.trunk;S.box(mat('club-trunk','#3a1a2a',{spec:.4}),a1-a0,.62,b1-b0,mid(a0,a1),Y+.31,mid(b0,b1));S.box(chrome,a1-a0+.02,.04,b1-b0+.02,mid(a0,a1),Y+.5,mid(b0,b1));}
  S.box(vio,.12,.12,.3,E-.08,Y+2.7,BACK.z1-1.4);S.box(mag,.1,.1,.3,bx2,Y+3.12,BACK.z0+1.2);S.box(vio,.3,.1,.1,mid(rm.x0,E),Y+3.1,N-.1);
  flat(wVio,3,3,E-.05,Y+1.9,BACK.z1-1.6,P/2);flat(wVio,2.6,4,bx2,Y+.05,BACK.z1-2.4,0,P/2);flat(wAmb,2.6,3,bx2,Y+.05,mid(BP.mirror[2],BP.mirror[3]),0,P/2);flat(wMag,2.4,2.4,bx2,Y+.05,BACK.z0+1.4,0,P/2);flat(wVio,3.6,3.6,mid(rm.x0,E),Y+.05,mid(SIDE.z,N),0,P/2);
  // ---- the kitchen: stainless counters and shelves, a range with a hood and glowing burners, the prep island, fridges, a sink; amber and red light ----
  const KC=KITCHEN,ss=mat('club-stainless','#8a8890',{spec:1,pow:140}),ssD=mat('club-stainless-dark','#4a4a52',{spec:.9,pow:120}),tileK=mat('club-kitchen-wall','#2a1a1a',{spec:.3});
  S.box(tileK,.04,H,KC.z1-KC.z0,KC.x0+.02,Y+H/2,mid(KC.z0,N));S.box(tileK,KC.x1-KC.x0,H,.04,mid(KC.x0,KC.x1),Y+H/2,N-.02);S.box(mat('club-kitchen-floor','#1a1414',{spec:.5,pow:80}),KC.x1-KC.x0,.03,N-KC.z0,mid(KC.x0,KC.x1),Y+.035,mid(KC.z0,N));
  S.box(black,KC.x1-KC.x0,.1,N-KC.z0,mid(KC.x0,KC.x1),Y+3.6,mid(KC.z0,N));
  const ctr=([a0,a1,b0,b1],h=.9)=>{S.box(ssD,a1-a0,h-.04,b1-b0,mid(a0,a1),Y+(h-.04)/2,mid(b0,b1));S.box(ss,a1-a0+.02,.04,b1-b0+.02,mid(a0,a1),Y+h-.02,mid(b0,b1));};
  ctr(KC.counter);ctr(KC.island);ctr(KC.pass);
  {const [a0,a1,b0,b1]=KC.counter;S.box(black,.5,.04,.4,34.4,Y+.905,mid(b0,b1));S.cyl(chrome,.02,.35,34.4,Y+1.08,b1-.08,8);   // the sink
   for(const y of [1.7,2.2,2.7]){S.box(ss,a1-a0-.4,.03,.32,mid(a0,a1),Y+y,b1-.16);}for(let k=0;k<9;k++){const x=a0+.5+k*.55;S.cyl(k%3?ssD:ss,.12+(k%2)*.04,.16+(k%3)*.05,x,Y+1.79+(k%3)*.02,b1-.17,12);S.cyl(ss,.09,.12,x+.2,Y+2.3,b1-.16,10);}}
  {const [a0,a1,b0,b1]=KC.range;S.box(black,a1-a0,.88,b1-b0,mid(a0,a1),Y+.44,mid(b0,b1));S.box(ssD,a1-a0+.02,.04,b1-b0+.02,mid(a0,a1),Y+.9,mid(b0,b1));
   const burner=glow('club-burner','#ff3a10',1.2);for(const z of [b0+.6,b0+1.3,b0+2]){S.cyl(burner,.13,.015,mid(a0,a1),Y+.925,z,16);S.cyl(ss,.16,.12,mid(a0,a1)-.02,Y+.99,z,14);}
   S.box(ss,a1-a0+.3,.5,b1-b0+.2,mid(a0,a1)-.1,Y+2.45,mid(b0,b1));S.box(amb,.03,.02,b1-b0,a0-.24,Y+2.2,mid(b0,b1));S.box(ssD,.4,1.2,.4,mid(a0,a1),Y+3.05,mid(b0,b1));flat(wAmb,1.6,3,mid(a0,a1)-.3,Y+.95,mid(b0,b1),0,P/2);}
  {const [a0,a1,b0,b1]=KC.fridge;for(const z of [mid(b0,b1)-.62,mid(b0,b1)+.62]){S.box(ss,a1-a0,2.05,1.2,mid(a0,a1),Y+1.025,z);S.box(chrome,.03,.6,.04,a1+.02,Y+1.2,z+.4);S.box(glow('club-fridge-led','#ff5a2a',1),.02,.04,.2,a1+.01,Y+1.85,z-.3);}}
  flat(wAmb,3,3,mid(KC.x0,KC.x1),Y+.05,mid(KC.z0,N),0,P/2);flat(washOf('wash-red','255,60,30',.4),3,3,KC.x1-.6,Y+.05,mid(KC.range[2],KC.range[3]),0,P/2);
  S.box(glow('club-kitchen-strip','#ff7a3a',1),KC.x1-KC.x0-.4,.03,.06,mid(KC.x0,KC.x1),Y+3.52,mid(KC.z0,N));
  // ---- the robot arms (Blender pieces, low-quay/robot-*.glb, stacked on joint nodes; code turns the joints) and the gantry over the back counter ----
  const robots=[],piece=(id,par)=>{try{return root.VoidAssets?.instance?.('lowquay:robot-'+id,par)||null;}catch{return null;}};
  const node=(name,par,x=0,y=0,z=0)=>{const n=new B.TransformNode('lq-robot-'+name,scene);n.parent=par;n.position.set(x,y,z);return n;};
  function arm(par,tool){const turn=node('turn',par),shoulder=node('shoulder',turn,0,.52,0),elbow=node('elbow',shoulder,0,.62,0),wrist=node('wrist',elbow,0,.52,0);
   const parts=[piece('base',turn),piece('upper',shoulder),piece('fore',elbow),piece(tool,wrist)];return {turn,shoulder,elbow,wrist,ok:parts.every(Boolean)};}
  for(const A of ARMS){const at=node('arm-'+A.id,parent,A.x,Y+A.y,A.z);at.rotation.y=A.yaw;const a=arm(at,A.id);if(a.ok)robots.push({...A,...a});else at.dispose();}
  let gantry=null;{const g=node('gantry',parent,0,Y+GANTRY.y,GANTRY.z);for(let x=GANTRY.x0+.5;x<GANTRY.x1;x+=1){const r=piece('rail',g);if(r)r.position.x=x;}S.box(steel,.06,Y+H-Y-GANTRY.y-.24,.06,GANTRY.x0+.2,Y+GANTRY.y+.9,GANTRY.z);S.box(steel,.06,H-GANTRY.y-.24,.06,GANTRY.x1-.2,Y+GANTRY.y+.9,GANTRY.z);
   const cart=node('cart',g,mid(GANTRY.x0,GANTRY.x1),0,0),car=piece('carriage',cart),hang=node('hang',cart,0,-.32,0);hang.rotation.x=P;const a=arm(hang,'gripper');if(car&&a.ok)gantry={g,cart,...a};}
  const pose=(r,t,ph,kind)=>{const u=t+ph;
   if(kind==='spatula'){r.turn.rotation.y=.25*Math.sin(u*.7);r.shoulder.rotation.x=.55+.12*Math.sin(u*1.3);r.elbow.rotation.x=1.05+.18*Math.sin(u*1.3+.6);const flip=(u%3.2)<.5?Math.sin((u%3.2)/.5*P)*1.2:0;r.wrist.rotation.x=.4+flip;}
   else if(kind==='ladle'){r.turn.rotation.y=.18*Math.sin(u*1.6);r.shoulder.rotation.x=.7+.06*Math.cos(u*1.6);r.elbow.rotation.x=1.1+.1*Math.sin(u*1.6);r.wrist.rotation.x=.5;r.wrist.rotation.y=u*2.2;}
   else{const c=(u%6)/6,lift=Math.sin(c*P*2);r.turn.rotation.y=c<.5?-.9+c*3.6:.9-(c-.5)*3.6;r.shoulder.rotation.x=.45+.25*lift;r.elbow.rotation.x=1.2-.3*lift;r.wrist.rotation.x=.6;}};
  const robotTick=time=>{
    const t=time||0;for(const r of robots)pose(r,t,r.phase,r.id);
    if(gantry){const u=t*.35+GANTRY.phase,s=(Math.sin(u)+1)/2;gantry.cart.position.x=GANTRY.x0+.4+s*(GANTRY.x1-GANTRY.x0-.8);pose(gantry,t,GANTRY.phase,'gripper');gantry.turn.rotation.y*=.5;}};
  // ---- the owner's wall sign on the back wall left of the stage: PLUG & PLAY in chrome with a pink neon outline, a plug and socket, the reclining neon figure above ----
  const sign=glowTex('wall-sign',1024,680,(g,w,h)=>{g.clearRect(0,0,w,h);g.lineJoin='round';g.lineCap='round';
   // the reclining figure: one continuous neon line, lying along the top of the lettering, head to the left, a knee raised
   g.save();g.translate(150,40);g.strokeStyle='#ff4fb8';g.shadowColor='#ff2d96';g.shadowBlur=22;g.lineWidth=7;g.beginPath();
   g.moveTo(60,150);g.bezierCurveTo(40,120,44,70,78,52);g.bezierCurveTo(108,36,140,54,138,86);g.bezierCurveTo(136,108,124,118,112,124);   // head and hair
   g.bezierCurveTo(140,124,170,140,190,150);g.bezierCurveTo(240,168,300,160,350,150);g.bezierCurveTo(400,140,440,120,470,90);g.bezierCurveTo(490,70,510,64,520,88);   // shoulder, back, hip, raised knee
   g.bezierCurveTo(530,112,560,140,620,150);g.lineTo(700,152);g.stroke();
   g.beginPath();g.moveTo(112,124);g.bezierCurveTo(100,150,96,170,120,178);g.bezierCurveTo(180,186,260,186,330,182);g.bezierCurveTo(420,178,520,176,620,170);g.lineTo(700,166);g.stroke();g.restore();
   // the lettering: chrome with a pink outline
   const word=(s,x,y,size)=>{g.font='italic 900 '+size+'px Arial,Helvetica,sans-serif';g.textAlign='left';g.textBaseline='alphabetic';g.shadowColor='#ff2d96';g.shadowBlur=24;g.lineWidth=12;g.strokeStyle='#ff3fa6';g.strokeText(s,x,y);g.shadowBlur=0;
    const gr=g.createLinearGradient(0,y-size,0,y);gr.addColorStop(0,'#e6d2ee');gr.addColorStop(.48,'#b49ac4');gr.addColorStop(.52,'#6a5480');gr.addColorStop(1,'#cbb6dc');g.fillStyle=gr;g.fillText(s,x,y);g.lineWidth=3;g.strokeStyle='#2a1030';g.strokeText(s,x,y);};
   word('PLUG',70,365,170);g.font='italic 900 120px Arial,Helvetica,sans-serif';g.shadowColor='#ff2d96';g.shadowBlur=20;g.fillStyle='#ff3fa6';g.fillText('&',60,500);word('PLAY',170,600,170);
   // the plug and its socket, in neon
   g.shadowColor='#ff2d96';g.shadowBlur=20;g.strokeStyle='#ff4fb8';g.lineWidth=9;g.beginPath();g.moveTo(330,450);g.lineTo(600,450);g.stroke();
   g.fillStyle='#8a6aa0';g.strokeStyle='#d07cff';g.lineWidth=6;g.beginPath();g.roundRect?g.roundRect(600,410,140,80,22):g.rect(600,410,140,80);g.fill();g.stroke();g.fillStyle='#c9b4d8';g.fillRect(740,425,46,14);g.fillRect(740,461,46,14);
   g.strokeStyle='#ff3fa6';g.lineWidth=10;g.beginPath();g.ellipse(880,450,90,150,0,0,7);g.stroke();g.fillStyle='#1a0816';g.beginPath();g.ellipse(880,450,70,130,0,0,7);g.fill();g.fillStyle='#ff4fb8';g.fillRect(845,410,18,40);g.fillRect(897,410,18,40);g.beginPath();g.arc(880,500,12,0,7);g.fill();});
  flat(sign,3.6,2.4,mid(SIDE.hatch[1],SIDE.backDoor[0])-.05,Y+3.35,SIDE.z-.03,0);   // on the side wall, between the hatch and the backstage door, facing the floor
  // ---- booths: a curved plum banquette round a black table with a glowing candle ----
  const bk=K(),[a0,a1]=BOOTH_ARC,NB=8,step=(a1-a0)/NB;
  for(let i=0;i<NB;i++){const d=(a0+step*(i+.5))*P/180,ry=P/2-d,w=2*1.0*Math.sin(step*P/360)+.06;bk.box(velvet,w,.42,.6,Math.cos(d)*1.0,.21,Math.sin(d)*1.0,ry);const wb=2*1.33*Math.sin(step*P/360)+.06;bk.box(velvet,wb,.62,.22,Math.cos(d)*1.33,.72,Math.sin(d)*1.33,ry);bk.box(pink,wb,.02,.02,Math.cos(d)*1.46,.06,Math.sin(d)*1.46,ry);}
  bk.cyl(black,.48,.04,0,.72,0,24);bk.cyl(chrome,.49,.012,0,.705,0,24);bk.cyl(chrome,.05,.7,0,.35,0,8);bk.cyl(black,.28,.03,0,.015,0,16);
  bk.cyl(mat('club-candle-glass','#5a3a2a',{spec:.9,pow:120,em:'#2a1408'}),.07,.11,.12,.8,.05,12);bk.cyl(candle,.035,.05,.12,.8,.05,8);bk.cyl(mat('club-drink','#3a1a2a',{spec:.9,pow:120,em:'#200810'}),.035,.1,-.18,.79,-.12,8);
  const booth=bk.done('club-booth');BOOTHS.forEach(([x,z])=>place(booth,x,Y,z));
  if(!low)BOOTHS.forEach(([x,z])=>flat(wAmb,2.2,2.2,x,Y+.025,z,0,P/2));
  // ---- palms in chrome planters, lit from below ----
  const frond=glowTex('frond',128,256,(g,w,h)=>{g.clearRect(0,0,w,h);g.strokeStyle='#4a6a2a';g.lineWidth=4;g.beginPath();g.moveTo(w/2,h);g.quadraticCurveTo(w/2+8,h/2,w/2,6);g.stroke();
   for(let i=0;i<22;i++){const y=h-12-i*11,l=46*Math.sin((i+2)/24*Math.PI);g.strokeStyle=i%2?'#6a8a32':'#58782a';g.lineWidth=3;for(const s of [-1,1]){g.beginPath();g.moveTo(w/2,y);g.quadraticCurveTo(w/2+s*l*.6,y-4,w/2+s*l,y+10);g.stroke();}}});
  frond.emissiveTexture.level=.55;frond.backFaceCulling=false;
  const pk=K();pk.cyl(chrome,.3,.7,0,.35,0,20);pk.cyl(black,.27,.02,0,.7,0,16);pk.box(amb,.5,.02,.02,0,.04,-.31);for(let i=0;i<6;i++){const a=i/6*P*2;pk.plane(frond,.9,1.7,Math.sin(a)*.28,1.35,Math.cos(a)*.28,a,-.45);}
  const palm=pk.done('club-palm');PLANTERS.forEach(([x,z])=>{place(palm,x,Y,z);flat(wAmb,1.6,1.6,x,Y+.03,z,0,P/2);});
  // ---- the alcove lounge: an arched opening with pink trim, a lower violet ceiling, sofas, candle tables, a diamond-pattern lit panel, pink light bars ----
  const AL=ALCOVE,[ax0,ax1]=AL.arch,acx=(ax0+ax1)/2,ar=(ax1-ax0)/2,aspring=AL.archTop-ar,wz=AL.z1+AL.wall/2;
  S.box(plaster,ax0-AL.x0,H,AL.wall,(AL.x0+ax0)/2,Y+H/2,wz);S.box(plaster,AL.x1-ax1,H,AL.wall,(ax1+AL.x1)/2,Y+H/2,wz);S.box(plaster,ax1-ax0,H-AL.archTop,AL.wall,acx,Y+AL.archTop+(H-AL.archTop)/2,wz);
  for(let i=0;i<6;i++){const u=(i+.5)/6,dx=ar*u,hh=AL.archTop-(aspring+Math.sqrt(Math.max(0,ar*ar-dx*dx)));if(hh>.02)for(const s of [-1,1])S.box(plaster,ar/6+.01,hh,AL.wall,acx+s*dx,Y+AL.archTop-hh/2,wz);}
  for(const s of [-1,1])for(const zz of [AL.z1-.02,AL.z1+AL.wall+.02])S.box(pink,.04,aspring,.04,acx+s*ar,Y+aspring/2,zz);
  for(let i=0;i<14;i++){const t0=P*i/14,t1=P*(i+1)/14,ta=(t0+t1)/2,len=ar*(t1-t0)+.02;for(const zz of [AL.z1-.02,AL.z1+AL.wall+.02])S.box(pink,len,.04,.04,acx+Math.cos(ta)*ar,Y+aspring+Math.sin(ta)*ar,zz,0,0,ta+P/2);}
  S.box(plum,AL.x1-AL.x0,.1,AL.z1-AL.z0,(AL.x0+AL.x1)/2,Y+3.6,(AL.z0+AL.z1)/2);S.box(pink,AL.x1-AL.x0-.3,.03,.03,(AL.x0+AL.x1)/2,Y+3.5,AL.z1-.15);
  for(const s of SOFAS){const w=s.x1-s.x0,d=s.z1-s.z0,bx=(s.x0+s.x1)/2,bz=(s.z0+s.z1)/2,along=w>d;S.box(velvet,w,.44,d,bx,Y+.22,bz);
   if(along){S.box(velvet,w,.6,.24,bx,Y+.74,s.z0+.12);for(let x=s.x0+.6;x<s.x1-.3;x+=1.1)S.box(plum,.7,.4,.18,x,Y+.66,s.z0+.32,0,-.25);}else{S.box(velvet,.24,.6,d,s.x1-.12,Y+.74,bz);for(let z=s.z0+.5;z<s.z1-.3;z+=1.1)S.box(plum,.18,.4,.7,s.x1-.32,Y+.66,z,0,0,.25);}}
  const lt=K();lt.cyl(black,.4,.04,0,.6,0,20);lt.cyl(chrome,.05,.58,0,.3,0,8);lt.cyl(candle,.035,.06,0,.66,0,8);lt.cyl(mat('club-candle-glass','#5a3a2a',{}),.07,.11,0,.66,0,12);const loungeTable=lt.done('club-lounge-table');LOUNGE_TABLES.forEach(([x,z])=>place(loungeTable,x,Y,z));
  const diamond=glowTex('diamond',256,256,(g,w,h)=>{g.fillStyle='#16060f';g.fillRect(0,0,w,h);for(let y=0;y<4;y++)for(let x=0;x<4;x++){const px=x*64+32,py=y*64+32,gr=g.createLinearGradient(px-32,py-32,px+32,py+32);gr.addColorStop(0,'#ff4fb0');gr.addColorStop(.5,'#5a1040');gr.addColorStop(1,'#c02a80');g.fillStyle=gr;g.beginPath();g.moveTo(px,py-29);g.lineTo(px+29,py);g.lineTo(px,py+29);g.lineTo(px-29,py);g.closePath();g.fill();}});
  flat(diamond,3.4,2.2,x1-WALL-.02,Y+2.2,361.7,P/2);
  for(const x of [36.4,39.6])S.box(pink,.1,1.8,.04,x,Y+2.2,AL.z0+.02);for(const z of [359.9,363.4])S.box(pink,.04,1.8,.1,AL.x1-.02,Y+2.2,z);
  flat(wVio,7.6,5,(AL.x0+AL.x1)/2,Y+.03,(AL.z0+AL.z1)/2,0,P/2);flat(wMag,5,3,(AL.x0+AL.x1)/2,Y+1.8,AL.z0+.05,P);
  // ---- floor washes round the stage and on the back wall; the doorway's glow on the alley ----
  flat(wMag,9,10,sx,Y+.03,sz,0,P/2);flat(wMag,6,4,BACK.x-.05,Y+.7,sz,P/2);flat(wMag,5,5,31,Y+.03,371,0,P/2);flat(wMag,4,3,x0-1.6,Y+.03,DOOR.z,0,P/2);
  // ---- the PLUG & PLAY sign over the door, on the alley ----
  const out=glowTex('door-sign',1024,256,(g,w,h)=>{g.clearRect(0,0,w,h);g.fillStyle='rgba(12,4,14,.9)';g.fillRect(8,8,w-16,h-16);g.strokeStyle='#9a4dff';g.lineWidth=8;g.strokeRect(14,14,w-28,h-28);
   g.font='italic 900 150px Arial,Helvetica,sans-serif';g.textAlign='center';g.textBaseline='middle';g.shadowColor='#ff2d96';g.shadowBlur=26;g.fillStyle='#ff5fb0';g.fillText('PLUG & PLAY',w/2,h/2+6,w-80);});
  flat(out,5.2,1.3,x0-.12,Y+DOOR.h+.95,DOOR.z,P/2);   // faces the alley (-x)
  // ---- the diners (they arrive when their models do; seated from the first frame) ----
  const seated=[];let tries=0;
  function seatAll(){if(!root.VoidAssets?.instance)return;DINERS.forEach(([x,z,yaw,look,clip],i)=>{if(seated[i])return;let n=null;try{n=root.VoidAssets.instance('crowd:'+look,parent);}catch{n=null;}if(!n)return;
   n.position.set(x,Y,z);n.rotation.y=yaw;try{root.VoidCrowd?.dress?.(n,look,'lq-club-'+i);}catch{}let ctrl=null;try{ctrl=root.VoidCrowd?.animate?.(n,look,clip);}catch{}seated[i]={node:n,ctrl};});}
  S.done('club-static').forEach(m=>{m.isVisible=true;});   // the club's own static parts, merged per material and drawn (kits are hidden instancing sources)
  api.state={seated,robots,gantry:()=>gantry};   // for the browser checks (tests/*-browser, screenshots)
  return {tick(time){if(seated.filter(Boolean).length<DINERS.length&&(tries++%30)===0)seatAll();robotTick(time);}};
 };
 root.VoidLowQuayClub=api;
})(globalThis);
