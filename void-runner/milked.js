/* MILKED: an adult livestreaming service and sperm bank (NOT a nightclub) at the east end of The Avenue, NeoChinatown.
   docs/development/MILKED.md has the design. Everyone and everything shown is clothed and non-explicit; the clinical wing is sealed equipment and fictional screens.
   PURE DATA first (names, rooms, walls, interactions, places, the inactive mission): runs in Node and is unit-tested (tests/milked.test.cjs).
   create() is the Babylon presentation. It is built when the player comes within about 90 m and disposed beyond about 140 m (neochinatown.js streamDistricts).

   ==== WHERE TO CHANGE THINGS ====
   - Fish's name:            CONFIG.FISH_NAME below (the only place it is written).
   - Eva's model:            MODELS.eva  (milked-eva; separate from the VR companion Eva)  -> set `asset` to a packaged model id; until then the `look` is a clothed crowd model.
   - Fish's model:           MODELS.fish (milked-fish) -> same.
   - Dialogue (provisional): DIALOGUE below.  Nothing here is approved canon until David approves it.
   - The inactive mission:   MISSION below (data only; nothing registers it with VoidMissions). */
(function(root){
 'use strict';
 const CONFIG={NAME:'MILKED',TAGLINE:'LIVE · PRIVATE · CERTIFIED',BUSINESS:'adult livestreaming service and sperm bank',NIGHTCLUB:false,
  FISH_NAME:'Fish',      // <<< Fish's display name. Change it here and nowhere else.
  EVA_NAME:'Eva',PROVISIONAL:true};
 // Replacement points for the two characters. `look` is the clothed placeholder crowd model used today. To use a real model, package it with the usual private asset
 // process, then set `asset` to its id: create() uses it when VoidAssets has it and falls back to `look` when it does not.
 const MODELS={
  eva:{id:'milked-eva',name:CONFIG.EVA_NAME,role:'RECEPTION · MILKED',look:'ncz-neon',asset:null,clips:['talk','idle'],at:[231.1,-12.5],face:[220,-12.5],note:'REPLACEMENT POINT: Milked Eva (not the VR companion Eva).'},
  fish:{id:'milked-fish',name:CONFIG.FISH_NAME,role:'BACK OFFICE · MILKED',look:'fixer-01',asset:null,clips:['idle','watch'],at:[227.2,-37.9],face:[223.5,-33],note:'REPLACEMENT POINT: Fish.'}};
 // Provisional placeholder lines. Eva's background follows Origins (livestream performer, neural-network engineer, built Iris with the player's character).
 const DIALOGUE={
  eva:{greeting:['Welcome to Milked. Studio bookings are through the north door. The biobank is the east door. Please do not mix the two up. People do.',
   'Yes, I used to perform on camera. Some nights I still do. The channel pays for the part of my life I actually care about.',
   'I build neural networks. This place has good bandwidth, thick walls and very few questions.','Fish runs the business side. His office is at the back, past the lobby.'],
   checkin:['Check-in is automatic once you have an appointment or a booking. Everyone here is an adult, everyone is paid, and everyone is on the record.']},
  fish:{greeting:['Back office. Mind the cables.','Two services, one front door. Streaming brings in the viewers. The biobank brings in the trust. Do not ask me to explain the combination.',
   'Eva runs the front and the technical side. I keep the lights on and the paperwork honest.']}};
 // MISSION 3: data only, INACTIVE. Nothing registers it with VoidMissions and nothing starts it; the beginner missions are untouched. Needs David's approval to activate.
 const MISSION={id:'meet-eva-milked',number:3,title:'MEET EVA AT MILKED',active:false,status:'inactive',approval:'PROPOSED (placeholder data, not approved canon)',giver:null,npc:'milked-eva',location:'milked',
  objective:'Travel to Milked at the east end of The Avenue and talk to Eva at reception.',steps:[{id:'arrive',text:'Reach Milked (walk east along The Avenue, or take a taxi).'},{id:'reception',text:'Talk to Eva at the reception desk.'}],
  dialogue:['eva.greeting'],reward:null};

 // ---- Geometry (world metres, x east, z north). FOOTPRINT is the whole business; the street face is the west wall at x 212. ----
 const FOOTPRINT=[212,248,-46,16],DOOR={x:212,z:-12.5,half:2.2,height:3.6},PLAZA=[200,212,-30,5],TAXI={id:'milked',position:[206,-23],heading:-Math.PI/2};
 const T=.4,H=6;
 // Wall segments: [id, 'x'|'z', fixed coordinate, from, to, gaps]. A 'x' wall runs north-south at x = fixed; a 'z' wall runs east-west at z = fixed.
 const SEGMENTS=[
  ['front','x',212,-46,16,[[DOOR.z-DOOR.half,DOOR.z+DOOR.half]]],['north','z',16,212,248,[]],['south','z',-46,212,248,[]],['east','x',248,-46,16,[]],
  ['lobby-north','z',.5,212,248,[[222,226]]],
  ['studio-row','z',5,212,248,[[216,219],[228,231],[237.5,240]]],['studio-1|2','x',224,5,16,[]],['studio-2|3','x',236,5,16,[]],['ops-west','x',240,.5,5,[[2,4]]],
  ['spine','x',236,-46,.5,[[-6,-2]]],['clinic-south','z',-12,236,248,[[241,244]]],['lab-south','z',-26,236,248,[]],
  ['consult-west','x',243,-12,-6,[[-9.5,-7.5]]],['consult-north','z',-6,243,248,[]],
  ['office-north','z',-30,212,236,[[222,225.5]]]];
 // Furniture and equipment that blocks movement: [id, x0, x1, z0, z1, height]
 const FURNITURE=[
  ['reception-desk',228.4,229.7,-17.4,-7.6,1.1],['lobby-sofa-n',216,222,-3.3,-1.6,.9],['lobby-sofa-s',216,222,-27.6,-26,.9],['lobby-kiosk',219.2,220.4,-7.8,-6.6,1.6],['lobby-planter-n',212.6,214,-2.6,-1.2,1],['lobby-planter-s',212.6,214,-26.6,-25.2,1],
  ['s1-console',214,220.5,8,9,1],['s1-stage',214.5,221.5,12.5,15,.3],['s1-dressing',212.6,213.8,6,11,2.2],
  ['s2-console',226,232,8,9,1],['s2-stage',226.5,233.5,12.5,15,.3],['s2-dressing',234.2,235.4,6,11,2.2],
  ['s3-console',238,244,8,9,1],['s3-stage',238.5,245.5,12.5,15,.3],['s3-dressing',246.2,247.4,6,11,2.2],
  ['ops-racks',246.4,247.8,1,4.6,2.2],['ops-desk',241,245,3.6,4.6,1],
  ['clinic-kiosk',244,246,-1.8,-0.4,1.5],['clinic-seats',237,239,-11.5,-7.5,.6],
  ['lab-bench-w',237,238.6,-24.5,-13.5,1],['lab-cryo',246.2,247.8,-24.5,-13.5,2.4],['lab-centrifuge',240,243,-16,-14.2,1.1],
  ['staff-door',241,243.5,-26.3,-25.7,2.6],
  ['office-desk',221,226,-38.7,-37.3,1],['office-shelf-s',214,230,-45.6,-44.8,2.2],['office-couch',213,214.6,-40,-35,.9]];
 // Rooms: the registry the map, the tests and the editor read. wing: public, streaming, clinical, office.
 const ROOMS=[
  {id:'lobby',name:'Reception',wing:'public',rect:[212,236,-30,.5],ceiling:5.4},
  {id:'streaming-hall',name:'Streaming wing',wing:'streaming',rect:[212,240,.5,5],ceiling:3.6},
  {id:'studio-1',name:'Studio 1',wing:'streaming',rect:[212,224,5,16],ceiling:3.9,kind:'studio'},
  {id:'studio-2',name:'Studio 2',wing:'streaming',rect:[224,236,5,16],ceiling:3.9,kind:'studio'},
  {id:'studio-3',name:'Studio 3',wing:'streaming',rect:[236,248,5,16],ceiling:3.9,kind:'studio'},
  {id:'ops',name:'Streaming operations',wing:'streaming',rect:[240,248,.5,5],ceiling:3.4},
  {id:'biobank',name:'Biobank appointments',wing:'clinical',rect:[236,248,-12,.5],ceiling:3.6},
  {id:'consult',name:'Consultation (private)',wing:'clinical',rect:[243,248,-12,-6],ceiling:3.6},
  {id:'lab',name:'Biobank laboratory',wing:'clinical',rect:[236,248,-26,-12],ceiling:3.6},
  {id:'office',name:'Back office',wing:'office',rect:[212,236,-46,-30],ceiling:3.4}];
 // Everything the player can use. Handlers are registered by milked-integration.js.
 const INTERACTIONS=[
  {id:'milked-checkin',label:'CHECK-IN KIOSK',position:[219.8,1.7,-9.4],action:'milked-checkin',range:2.6},
  {id:'milked-eva',label:'TALK TO '+CONFIG.EVA_NAME.toUpperCase(),position:[227.6,1.7,-12.5],action:'milked-eva',range:3.4},
  {id:'milked-studio-1',label:'STUDIO 1 CONSOLE',position:[217.2,1.7,9.7],action:'milked-studio',studio:1,range:2.6},
  {id:'milked-studio-2',label:'STUDIO 2 CONSOLE',position:[229,1.7,9.7],action:'milked-studio',studio:2,range:2.6},
  {id:'milked-studio-3',label:'STUDIO 3 CONSOLE',position:[241,1.7,9.7],action:'milked-studio',studio:3,range:2.6},
  {id:'milked-ops',label:'BROADCAST MONITORING',position:[243,1.7,2.6],action:'milked-ops',range:2.8},
  {id:'milked-clinic-kiosk',label:'APPOINTMENT KIOSK',position:[245,1.7,-3],action:'milked-clinic',range:2.6},
  {id:'milked-consult',label:'CONSULTATION ROOM',position:[245.6,1.7,-9],action:'milked-consult',range:2.4},
  {id:'milked-lab',label:'SAMPLE INVENTORY',position:[239.6,1.7,-19],action:'milked-lab',range:3},
  {id:'milked-staff-door',label:'STAFF ONLY',position:[242.2,1.7,-24.6],action:'milked-staff',range:2.4},
  {id:'milked-fish',label:'TALK TO '+CONFIG.FISH_NAME.toUpperCase(),position:[223.5,1.7,-36.6],action:'milked-fish',range:3.4},
  {id:'milked-security',label:'SECURITY MONITOR',position:[230,1.7,-44.6],action:'milked-security',range:3}];
 // Names for the V1 Map (district-map.js reads these). x, z are where the pin goes.
 const PLACES=[
  {id:'milked-entrance',name:CONFIG.NAME+' · entrance',kind:'shop',x:210.6,z:DOOR.z},
  {id:'milked-reception',name:CONFIG.NAME+' · reception',kind:'service',x:225,z:-12.5},
  {id:'milked-streaming',name:CONFIG.NAME+' · streaming wing',kind:'service',x:226,z:2.7},
  {id:'milked-clinical',name:CONFIG.NAME+' · biobank wing',kind:'service',x:242,z:-5},
  {id:'milked-office',name:CONFIG.NAME+' · '+CONFIG.FISH_NAME+"'s office",kind:'service',x:224,z:-38}];
 const BOUNDS={rect:FOOTPRINT};

 const inRect=([x0,x1,z0,z1],x,z)=>x>=x0&&x<=x1&&z>=z0&&z<=z1;
 const inside=p=>!!p&&inRect(FOOTPRINT,p.x,p.z)&&p.x>212.2;
 const roomAt=(x,z)=>ROOMS.filter(r=>inRect(r.rect,x,z)).sort((a,b)=>(a.rect[1]-a.rect[0])*(a.rect[3]-a.rect[2])-(b.rect[1]-b.rect[0])*(b.rect[3]-b.rect[2]))[0]||null;
 function solids(){
  const out=[];
  for(const [id,axis,c,a,b,gaps] of SEGMENTS){
   const spans=[];let from=a;for(const [g0,g1] of [...gaps].sort((p,q)=>p[0]-q[0])){if(g0>from)spans.push([from,g0]);from=Math.max(from,g1);}if(b>from)spans.push([from,b]);
   spans.forEach(([s0,s1],i)=>out.push({id:'milked-wall-'+id+(spans.length>1?'-'+i:''),position:axis==='x'?[c,H/2,(s0+s1)/2]:[(s0+s1)/2,H/2,c],size:axis==='x'?[T,H,s1-s0]:[s1-s0,H,T]}));}
  for(const [id,x0,x1,z0,z1,h] of FURNITURE)out.push({id:'milked-'+id,position:[(x0+x1)/2,h/2,(z0+z1)/2],size:[x1-x0,h,z1-z0]});
  return out;}
 const interactions=()=>INTERACTIONS.map(i=>({...i,position:i.position.slice()}));

 // ---------------------------------------------------------------- presentation (browser only) ----------------------------------------------------------------
 // create({B,scene,parent,quality,assets}) -> {tick(cam,dt,time), inside(cam), people, state(), dispose()}
 function create({B,scene,parent,quality,assets}){
  const low=quality==='low',hi=quality==='high'||quality==='ultra',own=[],groups=new Map(),screens=[],people=[];let disposed=false,clock=0,looksAsked=false;
  const node=new B.TransformNode('milked',scene);node.parent=parent;
  const matCache=new Map();
  const M=(name,hex,em,alpha)=>{const key='m'+name+hex+em+alpha;if(matCache.has(key))return matCache.get(key);const m=new B.StandardMaterial('milked-'+name,scene);m.diffuseColor=B.Color3.FromHexString(hex);m.specularColor=new B.Color3(.2,.2,.24);if(em)m.emissiveColor=B.Color3.FromHexString(em);if(alpha!=null){m.alpha=alpha;m.backFaceCulling=false;}own.push(m);matCache.set(key,m);return m;};
  const G=(name,hex,k=1)=>{const key='g'+name+hex+k;if(matCache.has(key))return matCache.get(key);const m=new B.StandardMaterial('milked-'+name,scene);m.diffuseColor=B.Color3.Black();m.specularColor=B.Color3.Black();m.emissiveColor=B.Color3.FromHexString(hex).scale(k);m.disableLighting=true;own.push(m);matCache.set(key,m);return m;};
  const PINK='#ff3fb4',GREEN='#39ff9c',TEAL='#38e8ff',WHITE='#f2fbff';
  const wallM=M('wall','#221f2e','#14121e'),metal=M('metal','#1c1b24','#0c0b12'),trim=M('trim','#3a3748','#1c1a26'),dark=M('dark','#14121b','#0a0910'),floorM=M('floor','#1b1926','#100e19'),white=M('clinic-white','#cfd9dd','#2a3236'),pink=G('pink',PINK),green=G('green',GREEN),teal=G('teal',TEAL),glowW=G('white',WHITE);
  const track=m=>{own.push(m);return m;};
  // put(): a mesh that is merged with its material neighbours at the end (static), or kept (animated/dynamic).
  const put=(mesh,mat,x,y,z,keep)=>{mesh.material=mat;mesh.parent=node;mesh.position.set(x,y,z);mesh.isPickable=false;if(!keep){let g=groups.get(mat);if(!g)groups.set(mat,g=[]);g.push(mesh);}return mesh;};
  const box=(w,h,d,x,y,z,mat,keep)=>put(B.MeshBuilder.CreateBox('milked-box',{width:w,height:h,depth:d},scene),mat,x,y,z,keep);
  const cyl=(dia,h,x,y,z,mat,keep,seg=12)=>put(B.MeshBuilder.CreateCylinder('milked-cyl',{diameter:dia,height:h,tessellation:seg},scene),mat,x,y,z,keep);
  const tex=(w,h,draw)=>{const t=new B.DynamicTexture('milked-tex',{width:w,height:h},scene,false);own.push(t);const g=t.getContext();draw(g,w,h,0);t.update();return t;};
  const emissiveMat=(t,alpha)=>{const m=new B.StandardMaterial('milked-screen',scene);m.diffuseColor=B.Color3.Black();m.specularColor=B.Color3.Black();m.emissiveTexture=t;m.disableLighting=true;m.backFaceCulling=false;if(alpha){m.opacityTexture=t;}own.push(m);return m;};
  // A screen: a plane showing a small canvas that redraws every `period` seconds (cheap; no video).
  const screen=(w,h,px,py,pz,ry,cw,ch,draw,period=1.1)=>{const t=tex(cw,ch,draw),p=put(B.MeshBuilder.CreatePlane('milked-screen',{width:w,height:h},scene),emissiveMat(t),px,py,pz,true);p.rotation.y=ry;screens.push({t,draw,cw,ch,next:Math.random()*period,period,mesh:p});return p;};
  const sign=(w,h,px,py,pz,ry,cw,ch,draw)=>{const t=tex(cw,ch,draw),p=put(B.MeshBuilder.CreatePlane('milked-sign',{width:w,height:h},scene),emissiveMat(t,true),px,py,pz,true);p.rotation.y=ry;return p;};
  const FONT=s=>'bold '+s+'px Consolas,Menlo,monospace';
  const drop=(g,cx,cy,r,fill,stroke)=>{g.beginPath();g.moveTo(cx,cy-r*1.8);g.bezierCurveTo(cx+r*.15,cy-r*1.1,cx+r,cy-r*.45,cx+r,cy+r*.15);g.arc(cx,cy+r*.15,r,0,Math.PI,false);g.bezierCurveTo(cx-r,cy-r*.45,cx-r*.15,cy-r*1.1,cx,cy-r*1.8);g.closePath();if(fill){g.fillStyle=fill;g.fill();}if(stroke){g.strokeStyle=stroke;g.lineWidth=Math.max(2,r*.12);g.stroke();}};
  const TOW=Math.PI/2,TOE=-Math.PI/2,TON=Math.PI,TOS=0;   // plane rotation.y so the readable face points west (-x), east (+x), north (+z), south (-z)

  // ---------------- exterior: the street face on the plaza ----------------
  const FX=212,[fx0,fx1,fz0,fz1]=FOOTPRINT,dz=DOOR.z,dh=DOOR.half;
  box(.5,15,dz-dh-fz0,FX,7.5,(fz0+dz-dh)/2,metal);box(.5,15,fz1-(dz+dh),FX,7.5,(dz+dh+fz1)/2,metal);box(.5,15-DOOR.height,dh*2,FX,(15+DOOR.height)/2,dz,metal);
  box(36.6,.6,62.6,230,15.1,-15,dark);   // roof
  // glass bands with pink/green light behind them, left and right of the door
  const glassM=M('glass','#0c2a30','#05191d',.42),backP=G('glass-pink',PINK,.55),backG=G('glass-green',GREEN,.5);
  [[-40,-24,backP],[-21,-17,backG],[-8,-4,backG],[-1.5,2,backP],[5,13,backP]].forEach(([a,b,back],i)=>{const w=b-a,c=(a+b)/2;box(.06,5.4,w-.2,FX-.24,9,c,back);box(.06,5.6,w,FX-.32,9,c,glassM,true);for(const y of [6.1,11.9])box(.14,.14,w+.2,FX-.36,y,c,trim);});
  for(const z of [-26,-18.5,-10.5,-6,3.5,14])box(.16,15,.22,FX-.42,7.5,z,i2(z)?pink:green);
  function i2(z){return Math.round(z)%2===0;}
  // door frame, canopy and glow on the pavement
  for(const s of [-1,1])box(.2,DOOR.height,.14,FX-.28,DOOR.height/2,dz+s*(dh+.07),teal);box(.2,.14,dh*2+.28,FX-.28,DOOR.height+.07,dz,teal);
  box(2.4,.22,dh*2+3,FX-1.2,DOOR.height+.5,dz,metal);box(2.2,.06,dh*2+2.8,FX-1.2,DOOR.height+.37,dz,pink);
  box(7,.03,.5,FX-4.3,.03,dz-1.6,green);box(7,.03,.5,FX-4.3,.03,dz+1.6,pink);
  box(9,.02,dh*2+4,FX-5.5,.04,dz,G('spill',PINK,.22));
  // sliding glass doors, drawn open
  for(const s of [-1,1])box(.08,DOOR.height-.2,1.1,FX+.15,(DOOR.height-.2)/2,dz+s*(dh+.6),M('door-glass','#103038','#06161a',.5),true);
  // the big logo: white droplet with smaller droplets, and the name
  sign(8,9.6,FX-.55,10.8,dz,TOW,512,614,(g,w,h)=>{g.clearRect(0,0,w,h);g.shadowColor=PINK;g.shadowBlur=26;drop(g,256,340,150,'#ffffff',PINK);g.shadowBlur=0;drop(g,120,140,34,'#ffffff',GREEN);drop(g,405,95,24,'#ffffff',PINK);drop(g,430,215,18,'#e8fff4',GREEN);drop(g,86,470,22,'#e8fff4',PINK);drop(g,190,60,14,'#ffffff',GREEN);
   g.fillStyle='rgba(120,150,170,.35)';g.beginPath();g.ellipse(215,310,40,70,.5,0,Math.PI*2);g.fill();});
  sign(11,2.4,FX-.55,5.7,dz,TOW,1024,224,(g,w,h)=>{g.clearRect(0,0,w,h);g.font='900 170px Arial,Helvetica,sans-serif';g.textAlign='center';g.textBaseline='middle';g.shadowColor=PINK;g.shadowBlur=30;g.fillStyle='#ffffff';g.fillText(CONFIG.NAME,w/2,h*.52);g.shadowColor=GREEN;g.shadowBlur=14;g.strokeStyle=GREEN;g.lineWidth=3;g.strokeText(CONFIG.NAME,w/2,h*.52);});
  sign(7,.8,FX-.55,4.5,dz,TOW,768,88,(g,w,h)=>{g.clearRect(0,0,w,h);g.font=FONT(36);g.textAlign='center';g.textBaseline='middle';g.fillStyle=GREEN;g.shadowColor=GREEN;g.shadowBlur=10;g.fillText('LIVESTREAM STUDIOS · BIOBANK',w/2,h/2);});
  // advertising screens on the facade (streaming platform and biobank branding)
  const ad=(label,sub,c1,c2)=>(g,w,h,t)=>{g.fillStyle='#07060c';g.fillRect(0,0,w,h);const grad=g.createLinearGradient(0,0,w,h);grad.addColorStop(0,c1);grad.addColorStop(1,c2);g.fillStyle=grad;g.globalAlpha=.35;g.fillRect(0,0,w,h);g.globalAlpha=1;drop(g,w*.14,h*.58,h*.2,'#ffffff');g.fillStyle='#fff';g.font=FONT(Math.round(h*.2));g.textAlign='left';g.textBaseline='middle';g.fillText(label,w*.28,h*.36);g.font=FONT(Math.round(h*.11));g.fillStyle=c2;g.fillText(sub,w*.28,h*.68);g.fillStyle='#fff';g.fillRect(w*.28,h*.8,w*.4*(0.4+0.6*((t*.2)%1)),4);};
  screen(7,3.6,FX-.5,7.6,-33,TOW,512,262,ad('GO LIVE','CREATORS · BOOK A STUDIO',PINK,GREEN),2.5);screen(7,3.6,FX-.5,7.6,8.5,TOW,512,262,ad('BIOBANK','DISCREET · CERTIFIED · PRIVATE',GREEN,TEAL),2.5);
  sign(3,3,FX-.5,3.4,-3.6,TOW,256,256,(g,w,h)=>{g.clearRect(0,0,w,h);g.fillStyle='rgba(8,8,14,.9)';g.fillRect(0,0,w,h);g.strokeStyle=TEAL;g.lineWidth=6;g.strokeRect(6,6,w-12,h-12);g.font=FONT(40);g.fillStyle='#fff';g.textAlign='center';g.fillText('TAXI',w/2,80);g.fillStyle=GREEN;g.fillText('STOP →',w/2,140);g.font=FONT(24);g.fillStyle=PINK;g.fillText('NEOCHINATOWN',w/2,200);});
  for(const z of [-28,-22,-3,3])cyl(.34,.5,FX-7,.25,z,green);   // bollards along the approach

  // ---------------- floors, ceilings ----------------
  for(const r of ROOMS){const [x0,x1,z0,z1]=r.rect,cx=(x0+x1)/2,cz=(z0+z1)/2,clin=r.wing==='clinical';
   if(r.id!=='consult')box(x1-x0,.1,z1-z0,cx,-.04,cz,clin?M('clinic-floor','#b8c6cb','#1c2528'):r.id==='office'?M('office-floor','#221c24','#120d14'):floorM);
   box(x1-x0,.2,z1-z0,cx,r.ceiling+.1,cz,clin?white:dark);
   if(r.id!=='consult'){const strip=clin?glowW:r.wing==='streaming'?teal:pink;for(const k of [-1,1])box(x1-x0-1,.06,.1,cx,r.ceiling-.02,cz+k*(z1-z0)/4,strip);}}
  // interior faces of the walls: a dark skin with a lit rail, so the rooms read from inside
  // walls: every collision wall gets a mesh (dark metal; the biobank's own walls are pale), with a low lit rail so the rooms read from inside
  for(const w of solids().filter(x=>/^milked-wall-/.test(x.id)&&!/^milked-wall-front/.test(x.id))){const [px,,pz]=w.position,[sx,,sz]=w.size,clin=/consult|clinic-south|lab-south/.test(w.id)||(/east/.test(w.id)===false&&px>=248);
   box(sx,6,sz,px,3,pz,clin?M('clinic-wall','#d9e3e6','#242c2e'):wallM);
   if(!clin&&sx+sz>2)box(sx>sz?sx-.2:.12,.08,sx>sz?.12:sz-.2,px+(sx>sz?0:.22),.3,pz+(sx>sz?.22:0),pz<-30||px<236&&pz>0.4?teal:pink);}
  for(const [id,axis,c,a,b,gaps] of SEGMENTS)if(id!=='front')for(const [g0,g1] of gaps)box(axis==='x'?T:g1-g0,2.2,axis==='x'?g1-g0:T,axis==='x'?c:(g0+g1)/2,4.9,axis==='x'?(g0+g1)/2:c,wallM);
  // lobby: logo wall behind the desk, check-in screens, directional signs, sofas, plants
  sign(7,7.4,235.78,3,-12.5,TOW,512,545,(g,w,h)=>{g.clearRect(0,0,w,h);g.shadowColor=PINK;g.shadowBlur=24;drop(g,256,300,130,'#ffffff',PINK);g.shadowBlur=0;drop(g,110,120,28,'#fff',GREEN);drop(g,410,120,20,'#fff',PINK);g.font=FONT(70);g.fillStyle='#fff';g.textAlign='center';g.fillText(CONFIG.NAME,256,500);});
  const checkin=(g,w,h,t)=>{g.fillStyle='#06070c';g.fillRect(0,0,w,h);g.fillStyle=TEAL;g.font=FONT(26);g.textAlign='left';g.fillText('CHECK-IN · BOOKINGS · MEMBERSHIPS',14,36);g.font=FONT(22);const rows=['STUDIO 1  ON AIR','STUDIO 2  PREP','STUDIO 3  ON AIR','BIOBANK   OPEN'];rows.forEach((r,i)=>{g.fillStyle=i===1?'#ffd166':i===3?GREEN:PINK;g.fillText(r,14,80+i*34);});g.fillStyle='#9fb0b8';g.fillText('NEXT APPT  '+(14+Math.floor(t/60)%8)+':'+(Math.floor(t)%2?'30':'00'),14,236);};
  screen(3.4,1.8,235.72,2.3,-16.5,TOW,420,222,checkin,1.2);screen(3.4,1.8,235.72,2.3,-8.5,TOW,420,222,checkin,1.2);
  const arrow=(text,col)=>(g,w,h)=>{g.fillStyle='rgba(6,6,12,.92)';g.fillRect(0,0,w,h);g.strokeStyle=col;g.lineWidth=6;g.strokeRect(5,5,w-10,h-10);g.font=FONT(44);g.fillStyle=col;g.textAlign='center';g.textBaseline='middle';g.fillText(text,w/2,h/2);};
  sign(4.2,1.1,224,4.1,.25,TOS,512,134,arrow('STREAMING WING ↑',PINK));sign(4.4,1.1,235.7,3.9,-4,TOW,512,134,arrow('BIOBANK →',GREEN));sign(4.2,1.1,223.4,4.1,-29.75,TON,512,134,arrow('STAFF · BACK OFFICE ↓',TEAL));
  sign(4.2,1.1,224,4.1,.75,TON,512,134,arrow('RECEPTION ↓',PINK));
  // reception desk, lit front, counter screens
  box(1.3,1.1,9.8,229,.55,-12.5,trim);box(1.5,.07,10,229,1.13,-12.5,dark);box(.06,.5,9.4,228.32,.5,-12.5,pink);box(.06,.07,9.6,228.32,1.1,-12.5,teal);for(const z of [-15.5,-9.5])box(.7,.45,.06,229.2,1.4,z,M('mon','#0b0b12','#050508'));
  box(.9,.02,.9,230.9,.02,-12.5,G('eva-pad',GREEN,.4));
  for(const [x,z,w,d] of [[219,-2.5,6,1.7],[219,-26.8,6,1.7]]){box(w,.45,d,x,.23,z,M('sofa','#2a1430','#12071a'));box(w,.55,.4,x,.7,z+(z>-10?.65:-.65),M('sofa','#2a1430','#12071a'));}
  for(const [x,z] of [[213.3,-1.9],[213.3,-25.9]]){cyl(.9,.9,x,.45,z,dark);cyl(.6,.9,x,1.2,z,M('leaf','#0e3a2a','#05160f'));}
  box(1.2,1.6,.5,219.8,.8,-7.2,trim);screen(.9,.9,219.8,1.15,-6.93,TOS,128,128,(g,w,h,t)=>{g.fillStyle='#06141a';g.fillRect(0,0,w,h);g.fillStyle=GREEN;g.font=FONT(18);g.textAlign='center';g.fillText('CHECK-IN',64,40);g.fillStyle=TEAL;g.fillText('TAP TO BEGIN',64,80);drop(g,64,108,8,'#fff');},3);
  // floor inlay in the lobby: pink and green lines leading from the door to the desk and the two wings
  box(.12,.02,11,222,.02,-18,pink);box(14,.02,.12,219,.02,-12.5,pink);box(.12,.02,13,224,.02,-6,pink);box(.12,.02,12.5,236-.8,.02,-4,green);

  // ---------------- streaming wing ----------------
  const studios=[{n:1,x0:212,x1:224,door:217.5,cx:218},{n:2,x0:224,x1:236,door:229.5,cx:230},{n:3,x0:236,x1:248,door:238.75,cx:242}];
  const chatNames=['nova_k','duskline','m3ri','tidepool','vex_9','halo.fm','quietbyte','ishi','pale_dawn','rooftop'],chatLines=['love the lights tonight','sound is crisp','first time here!','tip sent','can you play the slow one','this room is so calm','hi from the Underground City','camera 2 is perfect','new set tonight?','good night everyone'];
  const feed=(n)=>(g,w,h,t)=>{g.fillStyle='#07070c';g.fillRect(0,0,w,h);g.fillStyle=n%2?'#1a0f2a':'#0f1a2a';g.fillRect(0,0,w*.64,h);
   // a clothed performer silhouette swaying to the beat
   const sway=Math.sin(t*2.1+n)*10;g.fillStyle='#d9e3ea';g.beginPath();g.arc(w*.32+sway*.4,h*.28,13,0,Math.PI*2);g.fill();g.fillStyle=n%2?PINK:TEAL;g.fillRect(w*.32-14+sway*.5,h*.34,28,60);g.fillStyle='#223';g.fillRect(w*.32-12+sway*.3,h*.34+58,10,38);g.fillRect(w*.32+2+sway*.3,h*.34+58,10,38);
   g.fillStyle='#ff2b4a';g.beginPath();g.arc(16,16,6,0,Math.PI*2);g.fill();g.fillStyle='#fff';g.font=FONT(16);g.textAlign='left';g.fillText('LIVE',28,22);g.fillText((1200+n*743+Math.floor(t*3.1)*(n+1)).toLocaleString('en-US')+' watching',w*.36,22);
   g.fillStyle='rgba(0,0,0,.4)';g.fillRect(w*.64,0,w*.36,h);g.font=FONT(13);for(let i=0;i<7;i++){const k=(Math.floor(t*.8)+i+n*3)%chatLines.length;g.fillStyle=i%2?PINK:GREEN;g.fillText(chatNames[(k+n)%chatNames.length]+':',w*.655,34+i*26);g.fillStyle='#cfd8de';g.fillText(chatLines[k].slice(0,22),w*.655,34+i*26+12);}};
  for(const s of studios){const {n,x0,x1,cx}=s,wide=x1-x0,mid=(x0+x1)/2;
   // set wall (north), ring light, camera, mics, monitors, console desk, dressing space with a rack, ON AIR plate
   box(wide-.6,3.4,.12,mid,1.7,15.9,M('set'+n,n===2?'#1a2330':'#241530','#0a0710'));box(wide-2,.05,.1,mid,3,15.8,n%2?pink:teal);box(.1,3,.1,x0+1,1.5,15.8,green);box(.1,3,.1,x1-1,1.5,15.8,green);
   const sx=mid,stageZ=13.7;put(B.MeshBuilder.CreateTorus('milked-ring',{diameter:1.5,thickness:.07,tessellation:28},scene),glowW,sx,2.5,10.6,true).rotation.x=Math.PI/2;
   box(.08,2.5,.08,sx,1.25,10.6,dark);for(const k of [-.5,0,.5])box(.05,.9,.05,sx+k,.45,10.45,dark);box(.5,.35,.6,sx,1.55,10.5,M('cam','#111118','#08080c'));cyl(.18,.25,sx,1.55,10.15,glowW,false,10);box(.07,.07,.07,sx+.2,1.78,10.2,G('rec',RED(),1));
   for(const k of [-1.6,1.6]){box(.06,1.6,.06,sx+k,.8,12.8,dark);box(.28,.12,.28,sx+k,1.6,12.8,teal);}
   cyl(.04,1.4,sx-1.2,.9,11.5,dark);box(.12,.18,.12,sx-1.2,1.65,11.5,M('mic','#1a1a22','#08080c'));
   box(wide-3.5,1,.9,mid,.5,8.5,trim);for(let k=0;k<3;k++)box(.05,.04,.5,x0+3+k*2,1.02,8.5,k%2?pink:green);
   screen(2.2,1.2,x0+4.4,1.9,8.2,TOS,512,278,feed(n),.9);screen(1.6,.9,x1-4.6,1.6,8.1,TOS,320,174,(g,w,h,t)=>{g.fillStyle='#06070c';g.fillRect(0,0,w,h);g.fillStyle=TEAL;g.font=FONT(15);g.textAlign='left';g.fillText('STREAM HEALTH',10,24);g.fillStyle=GREEN;g.fillText('BITRATE '+(5.8+Math.sin(t)*.4).toFixed(1)+' Mb/s',10,56);g.fillStyle=PINK;g.fillText('VIEWERS '+(1200+n*743+Math.floor(t*3.1)*(n+1)).toLocaleString('en-US'),10,86);g.fillStyle=GREEN;g.fillText('PRIVACY MODE ON',10,116);g.fillStyle='#9fb0b8';g.fillText('CHAT FILTER ACTIVE',10,146);},1.2);
   // wall display of the live feed across the room, the way a creator would see the stream
   screen(3.4,1.9,mid,2.3,15.82,TON,640,359,feed(n+1),.9);
   // dressing / preparation corner behind a solid screen
   const dx=n===1?213.2:n===2?234.8:246.8;box(.12,2.2,5,dx,1.1,8.5,M('shoji','#1c1626','#0a0710'));box(.05,2,4.6,dx+(n===1?.08:-.08),1.1,8.5,G('shoji-glow',n%2?PINK:TEAL,.25));box(1.1,.06,.06,dx+(n===1?.9:-.9),1.7,6.4,dark);for(let k=0;k<4;k++)box(.04,.9,.5,dx+(n===1?.9:-.9),1.15,6.1+k*.45,M('garment'+k,['#3a2a55','#1d3a4a','#4a1d3a','#2a3a2a'][k],'#0a0a0e'));
   // ON AIR plate by the hall door
   sign(1.3,.45,s.door,2.9,4.82,TON,256,88,(g,w,h)=>{g.fillStyle='#0a0508';g.fillRect(0,0,w,h);g.fillStyle='#ff2b4a';g.font=FONT(44);g.textAlign='center';g.textBaseline='middle';g.fillText('ON AIR',w/2,h/2);});
   sign(1.4,.5,s.door,2.4,4.82,TON,256,92,(g,w,h)=>{g.fillStyle='#06070c';g.fillRect(0,0,w,h);g.fillStyle=TEAL;g.font=FONT(34);g.textAlign='center';g.textBaseline='middle';g.fillText('STUDIO '+n,w/2,h/2);});
   const stage=box(wide-5,.3,2.5,mid,.15,13.75,M('stage','#1c1626','#07040b'));box(wide-5,.04,.1,mid,.32,12.5,n%2?pink:teal);}
  // hall: dark corridor with lit rails and the doors' number plates (above)
  box(28,.04,.1,226,.02,1.2,pink);box(28,.04,.1,226,.02,4.8,teal);
  // ---------------- operations room ----------------
  screen(7,2.6,244,2.1,4.83,TOS,768,286,(g,w,h,t)=>{g.fillStyle='#04070a';g.fillRect(0,0,w,h);g.fillStyle=TEAL;g.font=FONT(22);g.textAlign='left';g.fillText('NETWORK STATUS',16,32);for(let i=0;i<6;i++){const y=60+i*36,v=.55+.4*Math.sin(t*.9+i*1.3);g.fillStyle='#142028';g.fillRect(16,y,360,18);g.fillStyle=i%2?PINK:GREEN;g.fillRect(16,y,360*v,18);g.fillStyle='#cfe';g.font=FONT(15);g.fillText('NODE-'+(i+1)+'  '+Math.round(v*100)+'%',390,y+14);}g.fillStyle=GREEN;g.font=FONT(18);g.fillText('CAMERA CONTROL · ONLINE',520,70);g.fillText('PRIVACY / SECURITY · SECURE',520,110);g.fillStyle=PINK;g.fillText('3 STUDIOS LIVE',520,150);},1);
  for(let i=0;i<4;i++){box(.6,2.2,1.1,247.1,1.1,1.4+i*.95,M('rack','#101018','#05050a'));for(let k=0;k<6;k++)box(.04,.04,.7,246.78,.5+k*.3,1.4+i*.95,k%2?green:pink);}
  box(4,1,1,243,.5,4.1,trim);box(.5,.35,.06,242,1.5,4.5,M('mon','#0b0b12','#050508'));box(.5,.35,.06,243.4,1.5,4.5,M('mon','#0b0b12','#050508'));
  // ---------------- biobank (clinical) wing: bright, quiet, clean ----------------
  sign(4.6,1.3,241,3.1,.2,TOS,512,144,(g,w,h)=>{g.fillStyle='#e9f4f6';g.fillRect(0,0,w,h);g.fillStyle='#14363c';g.font=FONT(46);g.textAlign='center';g.textBaseline='middle';drop(g,60,88,22,TEAL);g.fillText('BIOBANK',w/2+24,h/2-6);g.font=FONT(18);g.fillText('DISCREET · CERTIFIED · PRIVATE',w/2+24,h-22);});
  box(2.2,1.5,.5,245,.75,-1.1,M('kiosk','#d6e2e6','#2e3a3e'));screen(1.7,.7,245,1.3,-1.37,TOS,320,132,(g,w,h,t)=>{g.fillStyle='#eaf4f6';g.fillRect(0,0,w,h);g.fillStyle='#14363c';g.font=FONT(17);g.textAlign='left';g.fillText('APPOINTMENTS',10,26);g.fillStyle='#2a8a7a';g.fillText('NEXT FREE  '+(10+Math.floor(t/30)%9)+':'+(Math.floor(t/15)%2?'15':'45'),10,60);g.fillStyle='#14363c';g.fillText('ID CHECK  ·  ADULTS ONLY',10,92);},3);
  box(1.2,.5,4,238,.3,-9.5,M('bench','#aebcc2','#222a2d'));box(.1,2,.1,238.6,1.2,-9.5,dark);
  // privacy-screened consultation booth: frosted panels, a desk and a screen
  box(.1,2.6,3.2,243.1,1.3,-10.6,M('frost','#9fb7be','#1a2326',.55),true);box(5,2.6,.1,245.5,1.3,-6.1,M('frost','#9fb7be','#1a2326',.55),true);box(1.6,.8,.8,246.6,.4,-9.5,M('desk','#d6e2e6','#2e3a3e'));screen(1.2,.7,246.9,1.5,-9.5,TOW,256,150,(g,w,h)=>{g.fillStyle='#eaf4f6';g.fillRect(0,0,w,h);g.fillStyle='#14363c';g.font=FONT(18);g.textAlign='left';g.fillText('CONSULTATION',10,30);g.fillStyle='#2a8a7a';g.fillText('PRIVATE · NOT RECORDED',10,64);},4);
  // laboratory: benches, a centrifuge, sealed containers, cryogenic storage along the east wall, an inventory display
  box(1.6,1,11,237.8,.5,-19,M('bench','#aebcc2','#222a2d'));box(3,1.1,1.8,241.5,.55,-15.1,M('bench','#aebcc2','#222a2d'));cyl(1.1,.45,241.5,1.3,-15.1,M('centrifuge','#e6eef0','#2b3436'),false,16);cyl(1.2,.06,241.5,1.54,-15.1,green,false,16);
  for(let i=0;i<5;i++){cyl(1.1,2.4,247,1.2,-24+i*2.1,M('cryo','#c8d4d8','#222a2d'),false,14);cyl(.5,.5,247,2.6,-24+i*2.1,teal,false,10);box(.05,.4,.4,246.4,1.5,-24+i*2.1,G('cryo-label',TEAL,.7));}
  for(let i=0;i<9;i++)cyl(.14,.34,237.8,1.18,-24+i*.9,M('vial'+(i%3),['#d8f4ff','#e8ffe8','#fff4d8'][i%3],'#1a2a30'),false,8);
  screen(5,2.4,236.2+.0,2.6,-19,TOW,640,307,(g,w,h,t)=>{g.fillStyle='#eaf4f6';g.fillRect(0,0,w,h);g.fillStyle='#14363c';g.font=FONT(24);g.textAlign='left';g.fillText('INVENTORY · CHAIN OF CUSTODY',16,34);g.font=FONT(18);for(let i=0;i<7;i++){const ok=(i+Math.floor(t/3))%5!==0;g.fillStyle='#14363c';g.fillText('UNIT '+(4100+i)+'  SEALED  '+(ok?'LOGGED':'VERIFYING'),16,76+i*34);g.fillStyle=ok?'#2a8a7a':'#d89a2a';g.fillRect(560,62+i*34,20,20);}g.fillStyle='#14363c';g.fillText('TEMPERATURE  -196 C   ALL UNITS NOMINAL',16,h-18);},1.5);
  box(2.6,2.7,.2,242.25,1.35,-26.1,M('staffdoor','#2a343a','#0e1316'));sign(2.2,.5,242.25,2.9,-25.95,TOS,256,60,(g,w,h)=>{g.fillStyle='#8a1a1a';g.fillRect(0,0,w,h);g.fillStyle='#fff';g.font=FONT(30);g.textAlign='center';g.textBaseline='middle';g.fillText('STAFF ONLY',w/2,h/2);});box(.3,.3,.06,243.7,1.4,-25.95,G('lock',RED(),.9));
  // ---------------- Fish's back office ----------------
  box(6,1,1.5,223.5,.5,-38,M('desk','#4a3a30','#241a14'));box(6.2,.06,1.7,223.5,1.03,-38,M('desktop','#5a463a','#2a1e16'));for(const x of [222,223.5,225])box(.7,.45,.06,x,1.38,-37.5,M('mon','#0b0b12','#050508'));
  screen(2.6,1.4,215,1.8,-45.78,TOS,512,276,(g,w,h,t)=>{g.fillStyle='#06070c';g.fillRect(0,0,w,h);g.fillStyle=PINK;g.font=FONT(20);g.textAlign='left';g.fillText('STREAMING · TODAY',14,30);g.fillStyle='#cfd8de';g.font=FONT(17);g.fillText('Active channels  3',14,66);g.fillText('Viewer-hours  '+(41200+Math.floor(t*7)).toLocaleString('en-US'),14,96);g.fillText('Creator payouts  on schedule',14,126);g.fillStyle=GREEN;g.fillText('Biobank appointments  12',14,170);g.fillText('Samples logged  sealed',14,200);},2);
  screen(3.2,1.7,230,2,-45.78,TOS,640,339,(g,w,h,t)=>{g.fillStyle='#06070c';g.fillRect(0,0,w,h);const cams=['LOBBY','HALL','LAB DOOR','STUDIO 2'];cams.forEach((c,i)=>{const x=(i%2)*w/2+8,y=Math.floor(i/2)*h/2+8;g.fillStyle=i%2?'#101a22':'#1a1022';g.fillRect(x,y,w/2-16,h/2-16);g.fillStyle=TEAL;g.font=FONT(16);g.textAlign='left';g.fillText('CAM '+(i+1)+'  '+c,x+8,y+22);g.fillStyle='#ff2b4a';g.fillRect(x+w/2-40,y+10,10,10);const px=x+30+((t*15+i*40)%(w/2-90));g.fillStyle='#aab';g.fillRect(px,y+60,8,26);});},1.6);
  for(let i=0;i<7;i++)box(1.9,.24,.9,214+i*2.1,.12+0,-45.2,M('records','#1d1a22','#07060a'));for(let i=0;i<4;i++)box(15.5,.06,.9,222,.55+i*.5,-45.2,M('shelf','#2a2530','#0c0a10'));
  box(1.6,.8,3.6,213.6,.4,-37.5,M('couch','#2a1a2e','#10091a'));rug(224,-34.5);
  function rug(x,z){box(6,.02,3.2,x,.02,z,M('rug','#2a0f24','#12061a'));}
  box(4,.03,.1,223.5,.03,-31,pink);

  // ---------------- merge static pieces by material (few draw calls) ----------------
  for(const [mat,list] of groups){if(list.length>1){const merged=B.Mesh.MergeMeshes(list,true,true,undefined,false,false);if(merged){merged.parent=node;merged.material=mat;merged.isPickable=false;merged.freezeWorldMatrix?.();}}else list[0].freezeWorldMatrix?.();}
  function RED(){return '#ff2b4a';}

  // ---------------- people (clothed placeholder models; roles, not nudity) ----------------
  const CAST=['district-resident','ncz-neon','fixer-01','hacker-01','communion-tech','runner-02'],clipsOf=look=>root.VoidCrowd?.clips?.[look]||['idle'];
  const spot=(id,x,z,face,clips,opts={})=>people.push({id,x,z,yaw:Math.atan2(face[0]-x,face[1]-z),clips,node:null,anim:null,spawned:false,...opts});
  const eva=MODELS.eva,fish=MODELS.fish;
  spot(eva.id,eva.at[0],eva.at[1],eva.face,eva.clips,{fixedLook:eva.look,asset:eva.asset,role:'eva'});spot(fish.id,fish.at[0],fish.at[1],fish.face,fish.clips,{fixedLook:fish.look,asset:fish.asset,role:'fish'});
  spot('performer-1',218,13.4,[218,9],['dance','laugh','idle'],{role:'performer',dance:true,phase:0});spot('performer-2',230,13.4,[230,9],['dance','laugh','idle'],{role:'performer',dance:true,phase:1.4});
  if(!low)spot('performer-3',242,13.4,[242,9],['dance','laugh','idle'],{role:'performer',dance:true,phase:2.2});
  spot('ops-tech',243,2.2,[243,4.7],['interact','idle'],{role:'tech'});spot('lab-tech',241.5,-17,[241.5,-15.1],['interact','idle'],{role:'lab'});
  if(!low){spot('guest-a',220.6,-5,[222,-8],['talk','idle'],{role:'guest'});spot('guest-b',239,-4.2,[245,-1.6],['idle'],{role:'guest'});}
  function staff(){
   if(!looksAsked&&clock>1&&typeof mode!=='undefined'&&mode==='walking'){looksAsked=true;for(const look of CAST)try{Promise.resolve(root.VoidCharacterAssembler?.ensureLook?.(look,scene)).catch(()=>{});}catch{}}
   people.forEach((p,i)=>{
    if(!p.node){let n=null,look=null,clip=null;
     if(p.asset&&assets?.container?.(p.asset)){n=assets.instance(p.asset,node);look=p.asset;clip='idle';}
     else{const order=p.fixedLook?[p.fixedLook]:[...CAST.slice(i%CAST.length),...CAST.slice(0,i%CAST.length)];
      for(const c of order){if(clipsOf(c).some(k=>p.clips.includes(k))&&(n=assets?.instance?.('crowd:'+c,node))){look=c;clip=p.clips.find(k=>clipsOf(c).includes(k))||'idle';break;}}}
     if(!n)return;p.node=n;p.look=look;p.clip=clip;p.spawned=true;p.anim=p.asset?null:root.VoidCrowd?.animate?.(n,look,clip);n.position.set(p.x,0,p.z);n.rotation.y=p.yaw;n.metadata={...n.metadata,milked:p.id};return;}
    if(p.dance&&p.clip!=='dance'){const t=clock*3.4+p.phase;p.node.position.y=Math.abs(Math.sin(t))*.03;p.node.rotation.y=p.yaw+Math.sin(t*.5)*.35;}});
  }
  function tick(cam,dt,time){
   if(disposed)return;clock+=dt;const near=!!cam&&cam.x>196;
   if(near){for(const s of screens){if(clock>s.next){s.next=clock+s.period;const g=s.t.getContext();s.draw(g,s.cw,s.ch,clock);s.t.update();}}}
   const nearIn=!!cam&&cam.x>205;if(nearIn)staff();
  }
  return {tick,inside:cam=>inside(cam),people,state:()=>({ready:!disposed,people:people.filter(p=>p.spawned).length,screens:screens.length}),
   dispose(){disposed=true;for(const p of people){try{p.anim?.dispose?.();p.node?.dispose?.();}catch{}}people.length=0;node.dispose(false,true);for(const o of own)try{o.dispose();}catch{}own.length=0;screens.length=0;}};
 }
 const api={CONFIG,MODELS,DIALOGUE,MISSION,FOOTPRINT,DOOR,PLAZA,TAXI,SEGMENTS,FURNITURE,ROOMS,INTERACTIONS,PLACES,BOUNDS,inside,roomAt,solids,interactions,create};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VoidMilked=api;
})(typeof globalThis!=='undefined'?globalThis:this);
