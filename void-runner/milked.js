/* MILKED: a small adult livestreaming production studio (NOT a nightclub, clinic, laboratory or public venue) on a quiet side street off Main Street, NeoChinatown.
   docs/development/MILKED.md has the design. The building only makes broadcasts: members watch from home, and nothing is collected and no procedure of any kind
   happens here. Every performer is an adult and everything shown is clothed and non-explicit.
   PURE DATA first (names, rooms, walls, interactions, places, the inactive mission): runs in Node and is unit-tested (tests/milked.test.cjs).
   create() is the Babylon presentation. It is built when the player comes within about 90 m and disposed beyond about 140 m (neochinatown.js streamDistricts).

   ==== WHERE TO CHANGE THINGS ====
   - Fish's name:            CONFIG.FISH_NAME below (the only place it is written).
   - Eva's model:            MODELS.eva  (milked-eva; separate from the VR companion Eva)  -> set `asset` to a packaged model id; until then the `look` is a clothed crowd model.
   - Fish's model:           MODELS.fish (milked-fish) -> same.
   - The four dancers:       STUDIOS below (one per studio: `look` is a clothed crowd figure, `clips` its own dance, `library` the shared-library clip used when that file is installed).
   - Dialogue (provisional): DIALOGUE below.  Nothing here is approved canon until David approves it.
   - The inactive mission:   MISSION below (data only; nothing registers it with VoidMissions). */
(function(root){
 'use strict';
 const CONFIG={NAME:'MILKED',TAGLINE:'LIVE · PRIVATE · ADULTS ONLY',BUSINESS:'small adult livestreaming production studio',NIGHTCLUB:false,ON_SITE_COLLECTION:false,
  FISH_NAME:'Fish',      // <<< Fish's display name. Change it here and nowhere else.
  EVA_NAME:'Eva',PROVISIONAL:true};
 // Replacement points for the two characters. `look` is the clothed placeholder crowd model used today. To use a real model, package it with the usual private asset
 // process, then set `asset` to its id: create() uses it when VoidAssets has it and falls back to `look` when it does not.
 const MODELS={
  eva:{id:'milked-eva',name:CONFIG.EVA_NAME,role:'RECEPTION · MILKED',look:'ncz-neon',asset:null,clips:['talk','idle'],at:[81.3,-81.85],face:[81.3,-78],note:'REPLACEMENT POINT: Milked Eva (not the VR companion Eva).'},
  fish:{id:'milked-fish',name:CONFIG.FISH_NAME,role:'OFFICE · MILKED',look:'fixer-01',asset:null,clips:['watch','idle'],at:[95.6,-76.9],face:[98,-76.9],note:'REPLACEMENT POINT: Fish.'}};
 // Provisional placeholder lines. Eva's background follows Origins (livestream performer, neural-network engineer, built Iris with the player's character).
 const DIALOGUE={
  eva:{greeting:['Welcome to Milked. We are a small broadcast studio. Everything made here goes out live to members who watch from home.',
   'Nothing but broadcasting happens in this building. The rest of the service is private, at the member\'s own address.',
   'Yes, I perform on camera. Some nights I still do. The channel pays for the part of my life I actually care about.',
   'I build neural networks. This place has good bandwidth, thick walls and very few questions.',
   'The studios are through the door beside my desk. You can watch from the hallway windows. Please do not knock on the glass. Fish is in the office at the back.']},
  fish:{greeting:['Office. Mind the cables.','Four studios, fixed cameras, nobody behind them. I run every camera from this desk.',
   'Eva runs the front and the technical side. I keep the lights on and the paperwork honest.']}};
 // MISSION 3: data only, INACTIVE. Nothing registers it with VoidMissions and nothing starts it; the beginner missions are untouched. Needs David's approval to activate.
 const MISSION={id:'meet-eva-milked',number:3,title:'MEET EVA AT MILKED',active:false,status:'inactive',approval:'PROPOSED (placeholder data, not approved canon)',giver:null,npc:'milked-eva',location:'milked',
  objective:'Travel to Milked, on the side street off Main Street, and talk to Eva at reception.',steps:[{id:'arrive',text:'Reach Milked (the side street off the east side of Main Street, or take a taxi).'},{id:'reception',text:'Talk to Eva at the reception desk.'}],
  dialogue:['eva.greeting'],reward:null};

 // ---- Geometry (world metres, x east, z north). FOOTPRINT is the whole business: a 20 m by 16 m infill in the block east of Main Street. ----
 // LANE is the quiet side street its front door opens onto (a dead end off Main Street); ALLEY is the service alley behind it, which also runs back to Main Street.
 const FOOTPRINT=[78,98,-90,-74],LANE=[71,101,-74,-68.5],ALLEY=[71,98.5,-93.5,-90];
 const DOOR={x:81.75,z:-74,half:1,height:2.7},INNER={x:81.75,z:-76.6,half:1,height:2.5},REAR={x:94.75,z:-90,half:.7,height:2.3};
 const VESTIBULE=[79.75,83.75,-76.6,-74],HALL=[85.5,93.5,-82.8,-80.8];
 // Sky cabs set down at the nearest open point on Main Street (the side street is too narrow for a cab). Road taxis never turn into the side street either.
 const TAXI={id:'milked',position:[61,-82],heading:0};
 const T=.24,H=6,CEIL=3.2;
 // Wall segments: [id, 'x'|'z', fixed coordinate, from, to, gaps]. A 'x' wall runs north-south at x = fixed; a 'z' wall runs east-west at z = fixed.
 const SEGMENTS=[
  ['front','z',-74,78,98,[[DOOR.x-DOOR.half,DOOR.x+DOOR.half]]],['rear','z',-90,78,98,[[REAR.x-REAR.half,REAR.x+REAR.half]]],['west','x',78,-90,-74,[]],['east','x',98,-90,-74,[]],
  ['vest-west','x',VESTIBULE[0],-76.6,-74,[]],['vest-east','x',VESTIBULE[1],-76.6,-74,[]],['vest-inner','z',-76.6,VESTIBULE[0],VESTIBULE[1],[[INNER.x-INNER.half,INNER.x+INNER.half]]],
  ['reception-south','z',-82.8,78,85.5,[]],['reception-east','x',85.5,-88,-74,[[-82.45,-81.15]]],
  ['hall-north','z',-80.8,85.5,93.5,[]],['hall-south','z',-82.8,85.5,93.5,[]],['studio-1|2','x',89.5,-80.8,-74,[]],['studio-3|4','x',89.5,-88,-82.8,[]],
  ['staff-west','x',93.5,-88,-74,[[-82.45,-81.15]]],['rear-corridor','z',-88,78,93.5,[[79.3,80.6]]],['dressing-a|b','x',81.75,-88,-82.8,[]],
  ['office-south','z',-79.6,93.5,98,[[94.1,95.4]]],
  ['restroom-west','x',96,-88,-81,[]],['restroom-north','z',-81,96,98,[]],['restroom-mid','z',-84.5,96,98,[]],['restroom-south','z',-88,96,98,[]]];
 // Furniture and equipment that blocks movement: [id, x0, x1, z0, z1, height]
 const FURNITURE=[
  ['reception-desk',79.6,83,-81,-80.2,1.1],['desk-return-w',79.6,79.9,-82.68,-81,1.1],['desk-return-e',82.7,83,-82.68,-81,1.1],['reception-bench',83.95,85.3,-74.9,-74.3,.5],['reception-planter',78.3,79.1,-75.1,-74.3,1],
  ['office-desk',96.5,97.3,-78.4,-75.4,.8],['office-shelf',95.85,97.35,-74.6,-74.2,1.6],['office-couch',93.8,95.5,-75.1,-74.3,.8],['staff-lockers',93.62,94.05,-87.7,-84.3,2],
  ['dressing-counter',78.4,81.4,-83.45,-82.92,.8],['dressing-rail',78.15,78.6,-87.4,-84.6,1.7],['corridor-cases',78.2,79,-89.8,-88.3,1],
  ['alley-dumpster',86,88,-91.15,-90.15,1.3],['alley-crates',96.7,98.3,-93.35,-92.2,1.2]];
 // Rooms: the registry the map, the tests and the editor read. zone: public, studios, staff. `closed` rooms are seen (through a window) or signed, never entered.
 const ROOMS=[
  {id:'vestibule',name:'Security vestibule',zone:'public',rect:VESTIBULE},
  {id:'reception',name:'Reception',zone:'public',rect:[78,85.5,-82.8,-74]},
  {id:'hallway',name:'Studio hallway',zone:'studios',rect:HALL},
  {id:'studio-1',name:'Studio 1',zone:'studios',rect:[85.5,89.5,-80.8,-74],kind:'studio',closed:true},
  {id:'studio-2',name:'Studio 2',zone:'studios',rect:[89.5,93.5,-80.8,-74],kind:'studio',closed:true},
  {id:'studio-3',name:'Studio 3',zone:'studios',rect:[85.5,89.5,-88,-82.8],kind:'studio',closed:true},
  {id:'studio-4',name:'Studio 4',zone:'studios',rect:[89.5,93.5,-88,-82.8],kind:'studio',closed:true},
  {id:'office',name:CONFIG.FISH_NAME+'\'s office',zone:'staff',rect:[93.5,98,-79.6,-74]},
  {id:'staff-corridor',name:'Staff corridor',zone:'staff',rect:[93.5,96,-90,-79.6]},
  {id:'rear-corridor',name:'Rear corridor',zone:'staff',rect:[78,93.5,-90,-88]},
  {id:'dressing-a',name:'Dressing room A',zone:'staff',rect:[78,81.75,-88,-82.8]},
  {id:'dressing-b',name:'Dressing room B',zone:'staff',rect:[81.75,85.5,-88,-82.8],closed:true},
  {id:'restroom-1',name:'Staff restroom',zone:'staff',rect:[96,98,-84.5,-81],closed:true},
  {id:'restroom-2',name:'Staff restroom',zone:'staff',rect:[96,98,-88,-84.5],closed:true}];
 // The four livestream studios. Each has exactly one adult dancer (a clothed crowd figure), its own lighting and its own set. `window` and `door` are the spans
 // (along x) of the observation window and the closed studio door in the hallway wall. `clips` are the look's own clips, tried in order; `library` is a clip from
 // the shared animation library (anim-library.js), used instead when that licensed file is installed.
 const STUDIOS=[
  {n:1,room:'studio-1',light:'pink',theme:'velvet',window:[86,88.4],door:[88.55,89.35],dancer:{id:'milked-dancer-1',look:'district-resident',clips:['dance','idle'],library:'ac-sensual-dance-3'}},
  {n:2,room:'studio-2',light:'green',theme:'fern',window:[90,92.4],door:[92.55,93.35],dancer:{id:'milked-dancer-2',look:'vr-companion-f',clips:['slow-dance','dance','idle'],library:'ac-sensual-movement-1'}},
  {n:3,room:'studio-3',light:'mixed',theme:'arcade',window:[86.6,89],door:[85.65,86.45],dancer:{id:'milked-dancer-3',look:'vr-companion-m',clips:['dance-samba','dance','idle'],library:'ac-stand-curve-2'}},
  {n:4,room:'studio-4',light:'mixed',theme:'mirror',window:[90.6,93],door:[89.65,90.45],dancer:{id:'milked-dancer-4',look:'vr-player-b',clips:['dance','idle'],library:'ac-stand-curve-3'}}];
 // Everything the player can use. Handlers are registered by milked-integration.js.
 const INTERACTIONS=[
  {id:'milked-intercom',label:'DOOR INTERCOM',position:[83.3,1.7,-75.3],action:'milked-intercom',range:1.5},
  {id:'milked-eva',label:'TALK TO '+CONFIG.EVA_NAME.toUpperCase(),position:[81.3,1.7,-80.1],action:'milked-eva',range:3},
  {id:'milked-security',label:'SECURITY MONITORS',position:[84.3,1.7,-82.1],action:'milked-security',range:1.8},
  ...STUDIOS.map(s=>({id:'milked-studio-'+s.n,label:'STUDIO '+s.n+' · OBSERVATION WINDOW',position:[(s.window[0]+s.window[1])/2,1.7,s.n<3?-81.35:-82.25],action:'milked-studio',studio:s.n,range:1.25})),
  {id:'milked-fish',label:'TALK TO '+CONFIG.FISH_NAME.toUpperCase(),position:[95.5,1.7,-76.5],action:'milked-fish',range:2.4},
  {id:'milked-cameras',label:'REMOTE CAMERA CONTROLS',position:[96.3,1.7,-78.7],action:'milked-cameras',range:1.5},
  {id:'milked-dressing-b',label:'DRESSING ROOM B',position:[83.6,1.7,-88.4],action:'milked-dressing',range:1.5},
  {id:'milked-restroom',label:'STAFF RESTROOMS',position:[95.6,1.7,-84.5],action:'milked-restroom',range:1.6}];
 // Names for the V1 Map (district-map.js reads these). x, z are where the pin goes.
 const PLACES=[
  {id:'milked-entrance',name:CONFIG.NAME+' · entrance',kind:'shop',x:DOOR.x,z:DOOR.z+1.4},
  {id:'milked-reception',name:CONFIG.NAME+' · reception',kind:'service',x:81.6,z:-79},
  {id:'milked-studios',name:CONFIG.NAME+' · studio hallway',kind:'service',x:89.5,z:-81.8},
  {id:'milked-office',name:CONFIG.NAME+' · '+CONFIG.FISH_NAME+'\'s office',kind:'service',x:95.75,z:-77},
  {id:'milked-rear-door',name:CONFIG.NAME+' · rear door (service alley)',kind:'service',x:REAR.x,z:REAR.z-1.2}];
 const BOUNDS={rect:FOOTPRINT};

 const inRect=([x0,x1,z0,z1],x,z)=>x>=x0&&x<=x1&&z>=z0&&z<=z1;
 const inside=p=>!!p&&p.x>FOOTPRINT[0]+.1&&p.x<FOOTPRINT[1]-.1&&p.z>FOOTPRINT[2]+.1&&p.z<FOOTPRINT[3]-.1;
 const distance=(x,z)=>Math.hypot(Math.max(FOOTPRINT[0]-x,0,x-FOOTPRINT[1]),Math.max(FOOTPRINT[2]-z,0,z-FOOTPRINT[3]));
 const roomAt=(x,z)=>ROOMS.filter(r=>inRect(r.rect,x,z)).sort((a,b)=>(a.rect[1]-a.rect[0])*(a.rect[3]-a.rect[2])-(b.rect[1]-b.rect[0])*(b.rect[3]-b.rect[2]))[0]||null;
 const spansOf=([,,,a,b,gaps])=>{const spans=[];let from=a;for(const [g0,g1] of [...gaps].sort((p,q)=>p[0]-q[0])){if(g0>from)spans.push([from,g0]);from=Math.max(from,g1);}if(b>from)spans.push([from,b]);return spans;};
 function solids(){
  const out=[];
  for(const seg of SEGMENTS){const [id,axis,c]=seg,spans=spansOf(seg);
   spans.forEach(([s0,s1],i)=>out.push({id:'milked-wall-'+id+(spans.length>1?'-'+i:''),position:axis==='x'?[c,H/2,(s0+s1)/2]:[(s0+s1)/2,H/2,c],size:axis==='x'?[T,H,s1-s0]:[s1-s0,H,T]}));}
  for(const [id,x0,x1,z0,z1,h] of FURNITURE)out.push({id:'milked-'+id,position:[(x0+x1)/2,h/2,(z0+z1)/2],size:[x1-x0,h,z1-z0]});
  return out;}
 const interactions=()=>INTERACTIONS.map(i=>({...i,position:i.position.slice()}));

 // ---------------------------------------------------------------- presentation (browser only) ----------------------------------------------------------------
 // create({B,scene,parent,quality,assets}) -> {tick(cam,dt,time), inside(cam), people, state(), dispose()}
 function create({B,scene,parent,quality,assets}){
  const low=quality==='low',own=[],groups=new Map(),screens=[],people=[],doors=[];let disposed=false,clock=0,looksAsked=false;
  const node=new B.TransformNode('milked',scene);node.parent=parent;
  const matCache=new Map();
  const M=(name,hex,em,alpha)=>{const key='m'+name+hex+em+alpha;if(matCache.has(key))return matCache.get(key);const m=new B.StandardMaterial('milked-'+name,scene);m.diffuseColor=B.Color3.FromHexString(hex);m.specularColor=new B.Color3(.2,.2,.24);if(em)m.emissiveColor=B.Color3.FromHexString(em);if(alpha!=null){m.alpha=alpha;m.backFaceCulling=false;}own.push(m);matCache.set(key,m);return m;};
  const G=(name,hex,k=1)=>{const key='g'+name+hex+k;if(matCache.has(key))return matCache.get(key);const m=new B.StandardMaterial('milked-'+name,scene);m.diffuseColor=B.Color3.Black();m.specularColor=B.Color3.Black();m.emissiveColor=B.Color3.FromHexString(hex).scale(k);m.disableLighting=true;own.push(m);matCache.set(key,m);return m;};
  const PINK='#ff3fb4',GREEN='#39ff9c',WHITE='#f4f8ff',RED='#ff2b4a',PI=Math.PI;
  const wallM=M('wall','#37323f','#231f2c'),metal=M('metal','#1a1920','#0b0a10'),trim=M('trim','#454152','#26232f'),dark=M('dark','#121017','#08070c'),floorM=M('floor','#1b1924','#12101a'),ceilM=M('ceiling','#0f0e14','#07060a'),
   pink=G('pink',PINK),green=G('green',GREEN),glowW=G('white',WHITE),red=G('red',RED),pinkDim=G('pink-dim',PINK,.45),greenDim=G('green-dim',GREEN,.4),warm=G('warm','#ffd9a8',.8);
  const tone=c=>c==='pink'?pink:green,hexOf=c=>c==='pink'?PINK:GREEN;
  // put(): a mesh that is merged with its material neighbours at the end (static), or kept (animated/dynamic).
  const put=(mesh,mat,x,y,z,keep)=>{mesh.material=mat;mesh.parent=node;mesh.position.set(x,y,z);mesh.isPickable=false;if(!keep){let g=groups.get(mat);if(!g)groups.set(mat,g=[]);g.push(mesh);}return mesh;};
  const box=(w,h,d,x,y,z,mat,keep)=>put(B.MeshBuilder.CreateBox('milked-box',{width:w,height:h,depth:d},scene),mat,x,y,z,keep);
  const rbox=(w,h,d,x,y,z,mat,rx,ry,rz)=>{const m=box(w,h,d,x,y,z,mat);m.rotation.set(rx||0,ry||0,rz||0);return m;};
  const cyl=(dia,h,x,y,z,mat,keep,seg=14)=>put(B.MeshBuilder.CreateCylinder('milked-cyl',{diameter:dia,height:h,tessellation:seg},scene),mat,x,y,z,keep);
  const cone=(dia,h,x,y,z,mat,seg=10)=>put(B.MeshBuilder.CreateCylinder('milked-cone',{diameterBottom:dia,diameterTop:0,height:h,tessellation:seg},scene),mat,x,y,z);
  const torus=(dia,th,x,y,z,mat,rx,ry)=>{const m=put(B.MeshBuilder.CreateTorus('milked-ring',{diameter:dia,thickness:th,tessellation:28},scene),mat,x,y,z);m.rotation.set(rx||0,ry||0,0);return m;};
  const tex=(w,h,draw)=>{const t=new B.DynamicTexture('milked-tex',{width:w,height:h},scene,false);own.push(t);const g=t.getContext();draw(g,w,h,0);t.update();return t;};
  const emissiveMat=(t,alpha)=>{const m=new B.StandardMaterial('milked-screen',scene);m.diffuseColor=B.Color3.Black();m.specularColor=B.Color3.Black();m.emissiveTexture=t;m.disableLighting=true;m.backFaceCulling=false;if(alpha){m.opacityTexture=t;}own.push(m);return m;};
  // A screen: a plane showing a small canvas that redraws every `period` seconds (cheap; no video).
  const screen=(w,h,px,py,pz,ry,cw,ch,draw,period=1.1)=>{const t=tex(cw,ch,draw),p=put(B.MeshBuilder.CreatePlane('milked-screen',{width:w,height:h},scene),emissiveMat(t),px,py,pz,true);p.rotation.y=ry;screens.push({t,draw,cw,ch,next:Math.random()*period,period,mesh:p});return p;};
  const sign=(w,h,px,py,pz,ry,cw,ch,draw)=>{const t=tex(cw,ch,draw),p=put(B.MeshBuilder.CreatePlane('milked-sign',{width:w,height:h},scene),emissiveMat(t,true),px,py,pz,true);p.rotation.y=ry;return p;};
  const FONT=s=>'bold '+s+'px Consolas,Menlo,monospace',LOGO=s=>'900 '+s+'px "Arial Black",Arial,Helvetica,sans-serif';
  // The droplet: a drawn shape (never an emoji), so it looks the same on every machine.
  const drop=(g,cx,cy,r,fill,stroke)=>{g.beginPath();g.moveTo(cx,cy-r*1.8);g.bezierCurveTo(cx+r*.15,cy-r*1.1,cx+r,cy-r*.45,cx+r,cy+r*.15);g.arc(cx,cy+r*.15,r,0,Math.PI,false);g.bezierCurveTo(cx-r,cy-r*.45,cx-r*.15,cy-r*1.1,cx,cy-r*1.8);g.closePath();if(fill){g.fillStyle=fill;g.fill();}if(stroke){g.strokeStyle=stroke;g.lineWidth=Math.max(2,r*.12);g.stroke();}};
  // The three white droplets of the logo, centred on (cx, cy), about 0.9 * px wide.
  const droplets=(g,cx,cy,px)=>{g.save();g.shadowColor='#ffffff';g.shadowBlur=px*.16;drop(g,cx-px*.14,cy+px*.1,px*.2,'#ffffff');g.shadowBlur=px*.1;drop(g,cx+px*.24,cy-px*.14,px*.115,'#ffffff');drop(g,cx+px*.3,cy+px*.3,px*.085,'#ffffff');g.restore();};
  // The logo: MILKED as a pink neon tube, then the three white droplets.
  const logo=(g,cx,cy,px)=>{g.save();g.font=LOGO(px);g.textBaseline='middle';g.textAlign='left';const tw=g.measureText(CONFIG.NAME).width,dw=px*.95,x0=cx-(tw+dw)/2;g.lineJoin='round';
   g.shadowColor=PINK;g.shadowBlur=px*.3;g.strokeStyle=PINK;g.lineWidth=px*.085;g.strokeText(CONFIG.NAME,x0,cy);g.shadowBlur=px*.12;g.fillStyle='#ff8ad2';g.fillText(CONFIG.NAME,x0,cy);g.shadowBlur=0;g.strokeStyle='#ffe9f7';g.lineWidth=Math.max(1.5,px*.016);g.strokeText(CONFIG.NAME,x0,cy);g.restore();
   droplets(g,x0+tw+px*.5,cy-px*.03,px);};
  const TOW=PI/2,TOE=-PI/2,TON=PI,TOS=0;   // plane rotation.y so the readable face points west (-x), east (+x), north (+z), south (-z)
  const flat=p=>{p.rotation.x=PI/2;return p;};   // a sign lying on the floor, readable from above
  const [fx0,fx1,fz0,fz1]=FOOTPRINT,TOP=9,cx0=(fx0+fx1)/2,cz0=(fz0+fz1)/2;
  let seed=20261116;const rnd=()=>(seed=(seed*1664525+1013904223)>>>0)/4294967296;

  // ---------------- weathered concrete (the shell: street front, alley back) ----------------
  const drawConcrete=(g,w,h)=>{seed=20261116;g.fillStyle='#5a5d66';g.fillRect(0,0,w,h);
   for(let i=0;i<5200;i++){const v=rnd();g.fillStyle='rgba('+(v<.5?'255,255,255':'0,0,0')+','+(.02+rnd()*.07)+')';g.fillRect(rnd()*w,rnd()*h,1+rnd()*3,1+rnd()*3);}
   for(let i=0;i<34;i++){const x=rnd()*w,len=50+rnd()*260,wd=2+rnd()*7,gr=g.createLinearGradient(0,0,0,len);gr.addColorStop(0,'rgba(8,8,10,'+(.08+rnd()*.16)+')');gr.addColorStop(1,'rgba(8,8,10,0)');g.fillStyle=gr;g.save();g.translate(x,rnd()*h*.5);g.fillRect(0,0,wd,len);g.fillRect(-wd*.5,0,wd*2,len*.7);g.restore();}
   for(let i=0;i<9;i++){const x=rnd()*w,y=rnd()*h,r=30+rnd()*70,gr=g.createRadialGradient(x,y,2,x,y,r);gr.addColorStop(0,'rgba(10,12,14,'+(.1+rnd()*.14)+')');gr.addColorStop(1,'rgba(10,12,14,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);}
   g.strokeStyle='rgba(0,0,0,.42)';g.lineWidth=2;for(const y of [170,341,511]){g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke();}for(const x of [255,511]){g.beginPath();g.moveTo(x,0);g.lineTo(x,h);g.stroke();}
   g.fillStyle='rgba(0,0,0,.5)';for(let y=20;y<h;y+=171)for(let x=30;x<w;x+=128){g.beginPath();g.arc(x,y,3,0,Math.PI*2);g.fill();}};
  const concrete=new B.StandardMaterial('milked-concrete',scene);const tile=t=>{t.wrapU=t.wrapV=B.Texture.WRAP_ADDRESSMODE;return t;};   // a DynamicTexture clamps by default
  concrete.diffuseTexture=tile(tex(512,512,drawConcrete));concrete.specularColor=new B.Color3(.04,.04,.05);const concreteGlow=tile(tex(512,512,drawConcrete));concreteGlow.level=1.1;concrete.emissiveTexture=concreteGlow;own.push(concrete);   // the same drawing twice: the second, dimmed, glows faintly so the weathering reads at night
  // A concrete block whose texture repeats every 6 m on every face, whatever its size.
  const cbox=(w,h,d,x,y,z)=>{const k=6,f=(a,b)=>new B.Vector4(0,0,a/k,b/k);return put(B.MeshBuilder.CreateBox('milked-concrete',{width:w,height:h,depth:d,faceUV:[f(w,h),f(w,h),f(d,h),f(d,h),f(w,d),f(w,d)],wrap:true},scene),concrete,x,y,z);};
  // A soft pool of light on a floor or a wall (radial glow, drawn once per colour).
  const poolT=new Map(),pool=(hex,w,d,x,y,z,k=.5)=>{let m=poolT.get(hex+k);if(!m){const t=tex(128,128,(g,W,Hh)=>{g.clearRect(0,0,W,Hh);const gr=g.createRadialGradient(64,64,4,64,64,62),c=B.Color3.FromHexString(hex),rgb=Math.round(c.r*255)+','+Math.round(c.g*255)+','+Math.round(c.b*255);gr.addColorStop(0,'rgba('+rgb+','+k+')');gr.addColorStop(1,'rgba('+rgb+',0)');g.fillStyle=gr;g.fillRect(0,0,W,Hh);});m=emissiveMat(t,true);poolT.set(hex+k,m);}
   const p=put(B.MeshBuilder.CreatePlane('milked-pool',{width:w,height:d},scene),m,x,y,z,true);return p;};
  // A sliding door leaf: slides along `axis` from its closed place by `travel` metres when the camera is near (cx, cz).
  const leaf=(w,h,d,x,y,z,mat,axis,travel,cx,cz,r=3.4)=>{const m=box(w,h,d,x,y,z,mat,true);doors.push({m,axis,from:axis==='x'?x:z,travel,cx,cz,r,k:0});return m;};
  const doorM=M('door','#22212b','#101016'),doorGlass=M('door-glass','#1a2a30','#0a1418',.55);

  // ---------------- the shell ----------------
  box(fx1-fx0,.1,fz1-fz0,cx0,-.04,cz0,floorM);box(fx1-fx0,.16,fz1-fz0,cx0,CEIL+.08,cz0,ceilM);box(fx1-fx0+.4,.3,fz1-fz0+.4,cx0,TOP+.15,cz0,dark);
  for(const seg of SEGMENTS.filter(s=>/^(front|rear|west|east)$/.test(s[0]))){const [id,axis,c]=seg,inner=id==='front'||id==='east'?-1:1;
   for(const [s0,s1] of spansOf(seg)){const len=s1-s0,mid=(s0+s1)/2;if(axis==='z'){cbox(len,TOP,.3,mid,TOP/2,c);box(len,CEIL,.04,mid,CEIL/2,c+inner*.17,wallM);}else{cbox(.3,TOP,len,c,TOP/2,mid);box(.04,CEIL,len,c+inner*.17,CEIL/2,mid,wallM);}}
   for(const [g0,g1] of seg[5]){const hgt=id==='front'?DOOR.height:REAR.height;cbox(g1-g0,TOP-hgt,.3,(g0+g1)/2,(TOP+hgt)/2,c);}}

  // ---------------- street front (faces north onto the side street): dark concrete, one pink sign, dark metal double doors ----------------
  const FZ=fz1,out=FZ+.16,dx=DOOR.x,dh=DOOR.half,dH=DOOR.height;
  for(const s of [-1,1])box(.12,dH+.1,.36,dx+s*(dh+.06),(dH+.1)/2,FZ,metal);box(dh*2+.24,.14,.36,dx,dH+.07,FZ,metal);   // steel door frame
  for(const s of [-1,1]){const l=leaf(dh-.01,dH-.04,.06,dx+s*dh/2,(dH-.04)/2,FZ,doorM,'x',s*(dh-.04),dx,FZ,4.2);const slit=box(.12,1.5,.02,-s*.22,.25,.035,doorGlass,true);slit.parent=l;const edge=box(.025,dH-.3,.02,-s*(dh/2-.05),0,.035,pinkDim,true);edge.parent=l;const pull=box(.04,.5,.05,-s*.36,-.2,.05,trim,true);pull.parent=l;}
  for(const s of [-1,1])box(.05,2.75,.05,dx+s*(dh+.42),1.45,out+.02,pink);   // thin pink vertical neon strips beside the door
  box(5.2,1.3,.08,dx,3.78,out,metal);   // the sign's dark back panel
  sign(5,1.2,dx,3.78,out+.06,TON,1024,246,(g,w,h)=>{g.clearRect(0,0,w,h);logo(g,w/2,h*.52,150);});
  box(5.5,.045,.045,dx,4.6,out+.02,green);   // thin green neon line above the sign
  box(3.4,.07,.75,dx,3,FZ+.5,metal);box(3.4,.03,.03,dx,2.96,FZ+.86,greenDim);   // slim canopy with small downlights
  for(const k of [-1.15,0,1.15]){cyl(.11,.05,dx+k,2.945,FZ+.5,glowW,false,10);if(!low)flat(pool('#ffe2f2',1.9,1.9,dx+k,.03,FZ+.75,.34));}
  flat(pool(PINK,4.6,2.6,dx,.028,FZ+1.3,.26));
  // steel plaque and the intercom by the door
  sign(.62,.8,dx+dh+1.15,1.5,out+.03,TON,248,320,(g,w,h)=>{g.fillStyle='#0b0b10';g.fillRect(0,0,w,h);g.strokeStyle='#5b5f6b';g.lineWidth=5;g.strokeRect(5,5,w-10,h-10);g.textAlign='center';g.fillStyle='#ffffff';g.font=LOGO(38);g.fillText(CONFIG.NAME,w/2,62);droplets(g,w/2,116,62);g.font=FONT(19);g.fillStyle=GREEN;g.fillText('LIVE BROADCAST',w/2,196);g.fillText('STUDIOS',w/2,220);g.fillStyle=PINK;g.font=FONT(21);g.fillText('ADULTS ONLY · 18+',w/2,262);g.fillStyle='#9aa3b0';g.font=FONT(15);g.fillText('BY APPOINTMENT',w/2,292);});
  box(.2,.32,.06,dx-dh-.9,1.45,out,trim);box(.05,.05,.02,dx-dh-.9,1.55,out+.04,green);box(.12,.1,.02,dx-dh-.9,1.4,out+.04,dark);
  // a small blade sign (the droplets only), so the door can be found from Main Street
  box(.06,1.05,.06,fx0+.9,4.55,FZ+.45,metal);box(.07,1.25,.82,fx0+.9,4.5,FZ+.95,metal);
  for(const [s,ry] of [[-1,TOW],[1,TOE]])sign(.7,1.1,fx0+.9+s*.045,4.5,FZ+.95,ry,160,250,(g,w,h)=>{g.fillStyle='#0b0b10';g.fillRect(0,0,w,h);g.strokeStyle=PINK;g.lineWidth=5;g.shadowColor=PINK;g.shadowBlur=10;g.strokeRect(8,8,w-16,h-16);g.shadowBlur=0;droplets(g,w/2-4,h/2-6,120);});
  // the long blank studio wall: four small louvred slits with pink and green light behind them (nothing to see in), old conduit, a downpipe
  [86.6,89.6,92.6,95.6].forEach((x,i)=>{box(1.7,.42,.05,x,3.35,out-.02,i%2?greenDim:pinkDim);for(let k=0;k<4;k++)box(1.78,.035,.09,x,3.2+k*.1,out+.01,metal);box(1.86,.05,.1,x,3.6,out,trim);box(1.86,.05,.1,x,3.1,out,trim);});
  box(13,.05,.05,91,2.55,out,trim);box(.1,TOP-.4,.1,fx1-.5,(TOP-.4)/2,out,M('pipe','#2a2c31','#101114'));box(.05,2.4,.05,84.7,1.2,out,trim);box(.26,.34,.12,84.7,2.5,out,metal);
  if(!low){   // the upper floor: dark windows (one faintly lit), a ledge, an old AC unit
   box(fx1-fx0+.1,.22,.3,cx0,5.05,out-.02,trim);box(fx1-fx0+.2,.3,.5,cx0,TOP,FZ+.1,metal);
   [80.6,84.6,88.6,92.6,96.2].forEach((x,i)=>{box(1.5,1.7,.06,x,6.7,out-.02,i===3?G('upper-lit','#ffb9e2',.2):M('upper-glass','#0c1014','#06080a'));box(1.62,.07,.1,x,7.58,out,trim);box(1.62,.07,.1,x,5.82,out,trim);box(.06,1.7,.09,x,6.7,out,trim);for(const s of [-1,1])box(.07,1.76,.1,x+s*.78,6.7,out,trim);});
   box(.95,.62,.5,94.4,5.5,FZ+.42,M('ac','#3a3d44','#17181c'));box(.7,.4,.03,94.4,5.5,FZ+.68,dark);}
  // the dead end of the side street: bins and a crate against the far wall (clear of the walking line)
  if(!low){for(const [x,z] of [[99.4,-73.3],[100.3,-73.4]])cyl(.56,1,x,.5,z,M('bin','#22262b','#0e1012'),false,12);box(.9,.7,.7,100.2,.35,-69.2,M('crate','#3a3128','#17130f'));}

  // ---------------- alley back (faces south onto the service alley): steel staff door, one caged lamp ----------------
  const BZ=fz0,bo=BZ-.16,rx=REAR.x,rh=REAR.half,rH=REAR.height;
  for(const s of [-1,1])box(.1,rH+.08,.36,rx+s*(rh+.05),(rH+.08)/2,BZ,metal);box(rh*2+.2,.12,.36,rx,rH+.06,BZ,metal);
  {const l=leaf(rh*2-.02,rH-.04,.06,rx,(rH-.04)/2,BZ,M('rear-door','#2b2e35','#131419'),'x',-(rh*2-.1),rx,BZ,3);const bar=box(.9,.06,.05,0,-.05,-.05,trim,true);bar.parent=l;const kick=box(rh*2-.1,.28,.02,0,-(rH/2)+.2,-.035,metal,true);kick.parent=l;}
  box(.34,.2,.22,rx,rH+.42,bo-.06,metal);box(.24,.12,.16,rx,rH+.3,bo-.06,G('rear-lamp',GREEN,.85));flat(pool(GREEN,3,2.4,rx,.03,BZ-1.3,.3)).rotation.y=0;
  sign(1.5,.42,rx+1.75,1.75,bo-.02,TOS,360,100,(g,w,h)=>{g.fillStyle='#0c0c11';g.fillRect(0,0,w,h);g.strokeStyle='#4a4e58';g.lineWidth=4;g.strokeRect(4,4,w-8,h-8);g.fillStyle='#fff';g.font=LOGO(30);g.textAlign='left';g.textBaseline='middle';g.fillText(CONFIG.NAME,16,34);droplets(g,170,32,44);g.font=FONT(18);g.fillStyle=GREEN;g.fillText('STAFF · DELIVERIES',16,74);});
  box(2,1.25,.95,87,.65,-90.65,M('dumpster','#243a33','#0d1613'));box(2.06,.1,1,87,1.32,-90.65,M('dumpster-lid','#17231f','#080d0b'));for(const s of [-1,1])cyl(.14,.1,87+s*.8,.07,-91.05,dark,false,8).rotation.x=PI/2;
  box(1.2,.6,.9,97.4,.3,-92.75,M('crate','#3a3128','#17130f'));box(.9,.55,.8,97.5,.88,-92.8,M('crate-b','#2c2f36','#111317'));
  if(!low){for(const x of [80.5,84,90.5]){box(1.1,.75,.5,x,2.9,bo-.25,M('ac','#3a3d44','#17181c'));cyl(.5,.04,x,2.9,bo-.52,dark,false,12).rotation.x=PI/2;box(.05,2.5,.05,x+.7,1.25,bo-.03,trim);}
   box(14,.07,.07,86,3.6,bo-.04,M('pipe','#2a2c31','#101114'));box(.12,TOP-.5,.12,79,(TOP-.5)/2,bo-.06,M('pipe','#2a2c31','#101114'));
   box(.26,.14,.2,83,2.5,bo-.08,metal);box(.18,.06,.14,83,2.41,bo-.08,warm);flat(pool('#ffd9a8',2.6,2.2,83,.03,BZ-1.2,.2));
   sign(1.1,1.1,89,1.5,bo-.02,TOS,128,128,(g,w,h)=>{g.clearRect(0,0,w,h);g.globalAlpha=.5;droplets(g,w/2-4,h/2-4,92);});}

  // ---------------- interior walls ----------------
  // every inner collision wall gets a mesh; the hallway's studio walls are built separately (windows and studio doors)
  for(const seg of SEGMENTS.filter(s=>!/^(front|rear|west|east|hall-north|hall-south)$/.test(s[0]))){const [,axis,c]=seg;
   for(const [s0,s1] of spansOf(seg)){const len=s1-s0,mid=(s0+s1)/2;if(axis==='z')box(len,CEIL,T,mid,CEIL/2,c,wallM);else box(T,CEIL,len,c,CEIL/2,mid,wallM);}
   for(const [g0,g1] of seg[5]){const len=g1-g0,mid=(g0+g1)/2,top=seg[0]==='vest-inner'?INNER.height:2.2;if(axis==='z'){box(len,CEIL-top,T,mid,(CEIL+top)/2,c,wallM);for(const e of [g0,g1])box(.07,top,T+.06,e,top/2,c,trim);}else{box(T,CEIL-top,len,c,(CEIL+top)/2,mid,wallM);for(const e of [g0,g1])box(T+.06,top,.07,c,top/2,e,trim);}}}

  // ---------------- security vestibule (Milked's own: ribbed dark metal, a green ceiling panel, pink floor edges, a green scan frame) ----------------
  const [vx0,vx1,vz0]=VESTIBULE,vcz=(vz0+FZ)/2;
  for(const x of [vx0+.14,vx1-.14])for(let k=0;k<7;k++)box(.05,CEIL-.3,.12,x,CEIL/2,vz0+.3+k*.34,trim);   // ribbed side walls
  for(const x of [vx0+.2,vx1-.2])box(.05,.04,FZ-vz0-.4,x,.035,vcz,pink);   // pink floor edges
  box(2.1,.03,1.5,dx,CEIL-.02,vcz,G('vest-ceiling',GREEN,.5));box(2.3,.06,1.7,dx,CEIL-.005,vcz,metal);
  for(const s of [-1,1])box(.06,INNER.height,.06,dx+s*(INNER.half+.04),INNER.height/2,vz0+.16,green);box(INNER.half*2+.14,.06,.06,dx,INNER.height+.03,vz0+.16,green);   // the green scan frame at the inner doors
  for(const s of [-1,1]){const l=leaf(INNER.half-.01,INNER.height-.04,.05,dx+s*INNER.half/2,(INNER.height-.04)/2,vz0,doorGlass,'x',s*(INNER.half-.04),dx,vz0,3.2);const e=box(.03,INNER.height-.3,.06,-s*(INNER.half/2-.04),0,0,greenDim,true);e.parent=l;}
  flat(sign(1.5,1.5,dx,.03,vcz,0,256,256,(g,w,h)=>{g.clearRect(0,0,w,h);g.strokeStyle=PINK;g.lineWidth=5;g.globalAlpha=.8;g.beginPath();g.arc(w/2,h/2,110,0,Math.PI*2);g.stroke();g.globalAlpha=.9;droplets(g,w/2-6,h/2-6,170);}));
  box(.07,.5,.34,vx1-.16,1.5,vcz+.1,dark);screen(.28,.36,vx1-.205,1.52,vcz+.1,TOW,128,164,(g,w,h,t)=>{g.fillStyle='#05080a';g.fillRect(0,0,w,h);g.fillStyle=GREEN;g.font=FONT(17);g.textAlign='center';g.fillText('ID CHECK',w/2,28);g.fillStyle='#fff';g.font=FONT(30);g.fillText('18+',w/2,74);g.fillStyle=Math.floor(t)%2?GREEN:'#1f8a58';g.font=FONT(16);g.fillText('VERIFIED',w/2,112);g.fillStyle=PINK;g.fillText('WELCOME',w/2,142);},1);
  cyl(.2,.1,vx0+.45,CEIL-.07,vz0+.5,dark,false,12);box(.04,.04,.04,vx0+.45,CEIL-.14,vz0+.5,red);   // dome camera

  // ---------------- reception ----------------
  const slat=M('slat','#191622','#0d0b14');
  for(let i=0;i<19;i++)box(.1,CEIL-.1,.05,78.5+i*.37,CEIL/2,-82.64,slat);   // slatted wall behind the desk
  box(4,1.25,.05,81.3,2.2,-82.62,dark);sign(3.8,1,81.3,2.2,-82.585,TON,820,216,(g,w,h)=>{g.clearRect(0,0,w,h);logo(g,w/2,h*.52,128);});
  box(4.2,.04,.04,81.3,1.5,-82.6,green);for(const s of [-1,1])box(.04,1.35,.04,81.3+s*2.1,2.2,-82.6,pink);
  // compact desk: lit front, a computer, a small bell-free counter
  box(3.4,1.06,.8,81.3,.53,-80.6,trim);box(3.56,.06,.94,81.3,1.09,-80.6,dark);box(3.3,.05,.03,81.3,.98,-80.19,pink);box(3.3,.36,.02,81.3,.42,-80.19,pinkDim);box(3.56,.02,.03,81.3,1.12,-80.14,green);
  for(const x of [79.75,82.85])box(.3,1.06,1.68,x,.53,-81.84,trim);
  box(.64,.4,.04,80.7,1.4,-80.72,M('mon','#0b0b12','#050508'));box(.08,.16,.08,80.7,1.17,-80.74,dark);box(.5,.02,.18,80.75,1.13,-80.98,dark);
  screen(.58,.34,80.7,1.4,-80.745,TOS,256,150,(g,w,h,t)=>{g.fillStyle='#06070c';g.fillRect(0,0,w,h);g.fillStyle=PINK;g.font=FONT(15);g.textAlign='left';g.fillText('BROADCAST SCHEDULE',8,20);g.font=FONT(13);STUDIOS.forEach((s,i)=>{g.fillStyle=i%2?GREEN:'#ffd3ee';g.fillText('STUDIO '+s.n+'   ON AIR',8,46+i*22);});g.fillStyle='#8f9aa8';g.fillText('MEMBERS ONLINE '+(1840+Math.floor(t*2.3)%400),8,140);},2);
  box(.3,.2,.03,82.2,1.23,-80.55,M('tablet','#0b0b12','#050508'));screen(.26,.16,82.2,1.235,-80.53,TON,128,80,(g,w,h)=>{g.fillStyle='#06070c';g.fillRect(0,0,w,h);g.fillStyle=GREEN;g.font=FONT(15);g.textAlign='center';g.fillText('SIGN IN',w/2,30);g.fillStyle='#fff';g.fillText('18+ · ID',w/2,58);},6);
  box(.9,.02,.9,MODELS.eva.at[0],.02,MODELS.eva.at[1],G('eva-pad',GREEN,.3));
  // security monitors beside the hallway door
  box(1.7,1.1,.06,84.3,1.95,-82.63,dark);screen(1.56,.98,84.3,1.95,-82.59,TON,512,320,(g,w,h,t)=>{g.fillStyle='#04060a';g.fillRect(0,0,w,h);['VESTIBULE','HALLWAY','REAR DOOR','SIDE STREET'].forEach((c,i)=>{const x=(i%2)*w/2+6,y=Math.floor(i/2)*h/2+6,cw=w/2-12,ch=h/2-12;g.fillStyle=i%2?'#0d1a14':'#1a0d16';g.fillRect(x,y,cw,ch);g.strokeStyle='rgba(255,255,255,.08)';for(let k=1;k<4;k++){g.beginPath();g.moveTo(x,y+ch*k/4);g.lineTo(x+cw,y+ch*k/4);g.stroke();}g.fillStyle=GREEN;g.font=FONT(15);g.textAlign='left';g.fillText('CAM '+(i+1)+' · '+c,x+8,y+20);g.fillStyle=Math.floor(t+i)%2?RED:'#5a1420';g.beginPath();g.arc(x+cw-14,y+14,5,0,Math.PI*2);g.fill();g.fillStyle='#8f9aa8';g.font=FONT(12);g.fillText('NO MOTION',x+8,y+ch-8);});},1.6);
  sign(1.3,.34,85.36,2.5,-81.8,TOW,300,80,(g,w,h)=>{g.fillStyle='#0a0a10';g.fillRect(0,0,w,h);g.strokeStyle=GREEN;g.lineWidth=4;g.strokeRect(4,4,w-8,h-8);g.fillStyle=GREEN;g.font=FONT(40);g.textAlign='center';g.textBaseline='middle';g.fillText('STUDIOS',w/2,h/2+2);});
  leaf(.06,2.16,1.28,85.5,1.08,-81.8,doorM,'z',1.2,85.5,-81.8,2.6);
  // minimal seating: one bench and a plant
  box(1.35,.1,.56,84.62,.45,-74.6,M('bench','#2a1430','#12071a'));for(const s of [-1,1])box(.08,.42,.5,84.62+s*.56,.21,-74.6,metal);
  cyl(.7,.8,78.7,.4,-74.7,dark);for(const [a,b,c] of [[0,0,1.5],[.16,.1,1.2],[-.14,.12,1.25],[.02,-.16,1.1]])cone(.5,c,78.7+a,.8+c/2,-74.7+b,M('leaf','#0e3a2a','#061a12'));
  // floor inlay: a pink line from the doors to the desk, a green one on to the hallway door; ceiling strips
  box(.06,.02,3,dx,.02,-78.4,pink);box(2.9,.02,.06,83.2,.02,-79.9,green);box(.06,.02,1.9,84.65,.02,-80.85,green);
  box(5.4,.04,.06,81.75,CEIL-.03,-79.4,pinkDim);box(.06,.04,4.2,79,CEIL-.03,-79.6,greenDim);box(.06,.04,4.2,84.6,CEIL-.03,-79.6,greenDim);
  for(const [x,z] of [[79.2,-78],[84.4,-78],[81.75,-80.6]])cyl(.16,.04,x,CEIL-.02,z,warm,false,10);

  // ---------------- studio hallway: narrow, an observation window and a closed studio door for each studio ----------------
  const glassM=M('glass','#12202a','#060c10',.2),onAir=G('on-air',RED,1);
  const [hx0,hx1,hz0,hz1]=HALL;
  for(const s of STUDIOS){const r=ROOMS.find(q=>q.id===s.room).rect,north=s.n<3,wz=north?hz1:hz0,hn=north?-1:1,ry=north?TOS:TON,[w0,w1]=s.window,[d0,d1]=s.door,cuts=[[w0,w1,'w'],[d0,d1,'d']].sort((a,b)=>a[0]-b[0]),col=s.light==='mixed'?(s.n===3?'pink':'green'):s.light;
   let from=r[0];for(const [a,b,kind] of cuts){if(a>from)box(a-from,CEIL,T,(from+a)/2,CEIL/2,wz,wallM);
    if(kind==='w'){box(b-a,.8,T,(a+b)/2,.4,wz,wallM);box(b-a,CEIL-2.6,T,(a+b)/2,(CEIL+2.6)/2,wz,wallM);box(b-a,1.8,.03,(a+b)/2,1.7,wz,glassM,true);
     for(const y of [.785,2.615])box(b-a+.06,.03,.03,(a+b)/2,y,wz+hn*(T/2+.01),G('frame-'+col,hexOf(col),.75));for(const e of [a,b])box(.03,1.86,.03,e,1.7,wz+hn*(T/2+.01),G('frame-'+col,hexOf(col),.75));}
    else{box(b-a,CEIL-2.1,T,(a+b)/2,(CEIL+2.1)/2,wz,wallM);box(b-a,2.1,.08,(a+b)/2,1.05,wz,doorM);box(.05,.3,.04,b-.14,1.05,wz+hn*.06,trim);
     sign(.52,.17,(a+b)/2,1.62,wz+hn*.05,ry,208,68,(g,w,h)=>{g.fillStyle='#07080c';g.fillRect(0,0,w,h);g.fillStyle=hexOf(col);g.font=FONT(34);g.textAlign='center';g.textBaseline='middle';g.fillText('STUDIO '+s.n,w/2,h/2+2);});
     // ON AIR indicator over the studio door
     box(.74,.26,.07,(a+b)/2,2.5,wz+hn*(T/2+.03),dark);sign(.66,.2,(a+b)/2,2.5,wz+hn*(T/2+.075),ry,264,80,(g,w,h)=>{g.fillStyle='#16040a';g.fillRect(0,0,w,h);g.shadowColor=RED;g.shadowBlur=12;g.fillStyle='#ff5a72';g.font=FONT(52);g.textAlign='center';g.textBaseline='middle';g.fillText('ON AIR',w/2,h/2+3);});
     box(.07,.07,.05,(a+b)/2+.46,2.5,wz+hn*(T/2+.05),onAir,true);}
    from=b;}
   if(r[1]>from)box(r[1]-from,CEIL,T,(from+r[1])/2,CEIL/2,wz,wallM);}
  box(hx1-hx0-.2,.02,.05,(hx0+hx1)/2,.02,hz0+.2,pinkDim);box(hx1-hx0-.2,.02,.05,(hx0+hx1)/2,.02,hz1-.2,greenDim);box(hx1-hx0-1,.04,.1,(hx0+hx1)/2,CEIL-.03,(hz0+hz1)/2,G('hall-light','#ffd3ee',.5));
  sign(.9,.26,93.36,2.5,-81.8,TOW,280,80,(g,w,h)=>{g.fillStyle='#0a0a10';g.fillRect(0,0,w,h);g.strokeStyle=PINK;g.lineWidth=4;g.strokeRect(4,4,w-8,h-8);g.fillStyle=PINK;g.font=FONT(40);g.textAlign='center';g.textBaseline='middle';g.fillText('STAFF',w/2,h/2+2);});
  leaf(.06,2.16,1.28,93.5,1.08,-81.8,doorM,'z',1.2,93.5,-81.8,2.6);

  // ---------------- the four studios (seen through the windows; nobody goes in) ----------------
  const camM=M('cam','#101016','#07070b'),standM=M('stand','#23232b','#0e0e13'),lens=M('lens','#1c2a3a','#0a1220'),studioLights=[];
  const feed=n=>(g,w,h,t)=>{g.fillStyle='#07070c';g.fillRect(0,0,w,h);const c=STUDIOS[n-1].light==='green'?GREEN:STUDIOS[n-1].light==='pink'?PINK:n%2?PINK:GREEN;g.fillStyle=n%2?'#1c0f24':'#0d1c18';g.fillRect(0,0,w,h);
   // a clothed performer silhouette swaying (a drawing, not a camera)
   const sway=Math.sin(t*1.7+n)*w*.03,bx=w*.5+sway;g.fillStyle='#d9e3ea';g.beginPath();g.arc(bx,h*.3,h*.07,0,Math.PI*2);g.fill();g.fillStyle=c;g.fillRect(bx-h*.08,h*.38,h*.16,h*.3);g.fillStyle='#232733';g.fillRect(bx-h*.07,h*.68,h*.06,h*.24);g.fillRect(bx+h*.01,h*.68,h*.06,h*.24);
   g.fillStyle=RED;g.beginPath();g.arc(w*.07,h*.1,h*.035,0,Math.PI*2);g.fill();g.fillStyle='#fff';g.font=FONT(Math.round(h*.09));g.textAlign='left';g.fillText('LIVE · STUDIO '+n,w*.12,h*.13);g.textAlign='right';g.fillText((900+n*431+Math.floor(t*2.3)*(n+1)%300).toLocaleString('en-US'),w*.96,h*.13);};
  for(const s of STUDIOS){const [x0,x1,za,zb]=ROOMS.find(q=>q.id===s.room).rect,north=s.n<3,zw=north?za:zb,zbk=north?zb:za,dir=north?1:-1,depth=Math.abs(zbk-zw),mid=(x0+x1)/2,vD=Math.min(2.6,depth*.46),
    P=(u,v)=>[mid+u,zw+dir*v],c1=s.light==='mixed'?'pink':s.light,c2=s.light==='mixed'?'green':s.light,A=tone(c1),Bc=tone(c2),hex1=hexOf(c1),hex2=hexOf(c2),[px,pz]=P(0,vD),backRy=north?TOS:TON,bz=zbk-dir*.16;
   s.spot=[px,pz];s.face=[px,zw];
   // podium with a lit rim, a colour wash on the floor and the back wall, a ceiling bar
   cyl(1.5,.1,px,.06,pz,dark,false,24);cyl(1.58,.035,px,.03,pz,A,false,24);flat(pool(hex1,3.6,3.6,px,.022,pz,.5));if(s.light==='mixed')flat(pool(hex2,2.6,2.6,px+.9,.024,pz+dir*.9,.42));
   {const w=pool(hex2,3.7,3,mid,1.6,bz-dir*.09,.4);w.rotation.y=backRy;}
   box(2.4,.05,.07,px,CEIL-.03,pz,A);box(.07,.05,2,mid+1.2,CEIL-.03,pz,Bc);for(const k of [-.8,.8])cyl(.14,.16,px+k,CEIL-.1,pz-dir*.7,standM,false,10);
   // fixed cameras on stands (remote controlled from the office: nobody stands behind them)
   for(const [u,v,hgt] of [[-1.2,.7,1.45],[1.2,.85,1.25]]){const [qx,qz]=P(u,v),fxv=px-qx,fzv=pz-qz,L=Math.hypot(fxv,fzv),ax=fxv/L,az=fzv/L,yaw=Math.atan2(ax,az);
    cyl(.04,hgt-.1,qx,(hgt-.1)/2,qz,standM,false,8);for(let k=0;k<3;k++){const a=k*2.094+u;rbox(.03,.72,.03,qx+Math.sin(a)*.2,.33,qz+Math.cos(a)*.2,standM,Math.cos(a)*.6,0,-Math.sin(a)*.6);}
    rbox(.2,.16,.32,qx,hgt,qz,camM,0,yaw,0);const ln=cyl(.11,.14,qx+ax*.22,hgt,qz+az*.22,lens,false,12);ln.rotation.set(PI/2,yaw,0);rbox(.24,.03,.2,qx-ax*.02,hgt+.1,qz-az*.02,standM,0,yaw,0);
    box(.035,.035,.035,qx+ax*.14,hgt+.1,qz+az*.14,red);}
   // lighting equipment: a softbox and a ring light on stands, an LED bar under the back wall
   {const [qx,qz]=P(-1.55,1.75),yaw=Math.atan2(px-qx,pz-qz);cyl(.045,1.9,qx,.95,qz,standM,false,8);for(let k=0;k<3;k++){const a=k*2.094;rbox(.03,.6,.03,qx+Math.sin(a)*.18,.27,qz+Math.cos(a)*.18,standM,Math.cos(a)*.6,0,-Math.sin(a)*.6);}
    rbox(.7,.9,.14,qx,2.05,qz,dark,0,yaw,0);rbox(.62,.82,.02,qx+Math.sin(yaw)*.08,2.05,qz+Math.cos(yaw)*.08,G('softbox',WHITE,.85),0,yaw,0);}
   {const [qx,qz]=P(1.6,1.95),yaw=Math.atan2(px-qx,pz-qz);cyl(.04,1.5,qx,.75,qz,standM,false,8);cyl(.3,.03,qx,.02,qz,standM,false,10);torus(.5,.05,qx,1.7,qz,glowW,PI/2,yaw);}
   box(2.9,.07,.1,mid,.05,bz-dir*.12,Bc);
   // a wall monitor showing the outgoing stream
   {const ex=north?x1-.14:x0+.14,[,mz]=P(0,vD+.4);box(.05,.56,.94,ex,1.95,mz,dark);screen(.86,.48,ex+(north?-.03:.03),1.95,mz,north?TOW:TOE,256,144,feed(s.n),.9);}
   // the set: unique decorations and furniture
   if(s.theme==='velvet'){for(let i=0;i<12;i++)box(.31,CEIL-.2,.07+(i%2)*.05,x0+.32+i*.305,CEIL/2,bz,i%2?M('velvet-a','#4a1230','#22081a'):M('velvet-b','#5e1a40','#2c0b1e'));
    for(const u of [-1.1,0,1.1])box(.05,2.2,.05,mid+u,1.5,bz-dir*.14,pink);
    const [sx,sz]=P(-.95,depth-1.1);box(1.5,.38,.66,sx,.24,sz,M('chaise','#5a1d44','#2a0c20'));box(1.5,.5,.16,sx,.62,sz+dir*.3,M('chaise','#5a1d44','#2a0c20'));box(.16,.3,.66,sx-.7,.5,sz,M('chaise','#5a1d44','#2a0c20'));
    const [tx,tz]=P(1.25,depth-1);cyl(.42,.5,tx,.25,tz,dark,false,12);cyl(.05,.3,tx,.65,tz,trim,false,8);cyl(.24,.2,tx,.88,tz,G('lamp-shade','#ffc4e6',.8),false,12);
    cyl(2.5,.02,px,.012,pz,M('rug-rose','#3a1028','#1c0814'),false,24);}
   else if(s.theme==='fern'){for(let i=0;i<9;i++)box(.4,CEIL-.2,.06,x0+.34+i*.415,CEIL/2,bz,i%2?M('fern-a','#0d2a1e','#06140e'):M('fern-b','#123425','#081a12'));
    torus(1.5,.06,mid,1.85,bz-dir*.12,green,PI/2,0);
    for(const [u,v,hgt] of [[-1.5,depth-.75,1.5],[1.45,depth-.8,1.9],[1.55,depth-2,1.2],[-1.6,depth-2.1,1]]){const [qx,qz]=P(u,v);cyl(.42,.42,qx,.21,qz,dark,false,10);cyl(.05,hgt*.5,qx,.42+hgt*.25,qz,M('stem','#2a2018','#120e0a'),false,6);for(const [a,b,c] of [[0,0,1],[.14,.1,.8],[-.13,.1,.84],[.03,-.15,.74]])cone(.46*hgt/1.4,hgt*.6*c,qx+a,.5+hgt*.36+hgt*.3*c,qz+b,M('leaf','#0e3a2a','#061a12'));}
    const [sx,sz]=P(-.5,depth-1.15);cyl(.36,.05,sx,.74,sz,M('stool','#2a2018','#120e0a'),false,12);cyl(.05,.72,sx,.36,sz,standM,false,8);cyl(.34,.03,sx,.02,sz,standM,false,12);
    cyl(2.6,.02,px,.012,pz,M('rug-moss','#0f2a1a','#07150d'),false,24);}
   else if(s.theme==='arcade'){for(let i=0;i<3;i++)for(let j=0;j<2;j++){const [qx,qz]=P(-.72+i*.72,depth-.42),y=.3+j*.56;box(.64,.52,.5,qx,y,qz,M('crt','#15151b','#08080b'));rbox(.46,.34,.02,qx,y+.02,qz-dir*.26,(i+j)%2?G('crt-g',GREEN,.7):G('crt-p',PINK,.7),0,0,0);}
    for(const u of [-1.55,1.55]){const [qx,qz]=P(u,depth-.42);box(.5,1.15,.45,qx,.58,qz,M('speaker','#101015','#06060a'));for(const y of [.36,.82]){const c=cyl(.3,.03,qx,y,qz-dir*.235,trim,false,14);c.rotation.x=PI/2;}}
    for(let i=0;i<4;i++)for(let j=0;j<4;j++)box(.55,.02,.55,px-.825+i*.55,.012,pz-.825+j*.55,(i+j)%2?M('check-a','#231426','#110a13'):M('check-b','#0f2219','#07110c'));
    rbox(.05,1.5,.05,x0+.16,1.6,zw+dir*4.2,pink,.6,0,0);rbox(.05,1.5,.05,x1-.16,1.6,zw+dir*4.2,green,-.6,0,0);
    const [sx,sz]=P(.75,depth-1.25);cyl(.34,.05,sx,.72,sz,M('stool-red','#3a1420','#1a0a10'),false,12);cyl(.05,.7,sx,.35,sz,standM,false,8);cyl(.32,.03,sx,.02,sz,standM,false,12);}
   else{for(const [u,c] of [[-1.05,pink],[0,green],[1.05,pink]]){box(.92,2.5,.04,mid+u,1.42,bz,M('mirror','#8ea2b6','#2a3540'));for(const e of [-.48,.48])box(.035,2.5,.05,mid+u+e,1.42,bz-dir*.01,c);}
    const bx=x1-.3;{const b=cyl(.05,2.7,bx,1,zw+dir*2.9,trim,false,8);b.rotation.x=PI/2;}for(const v of [1.7,2.9,4.1])box(.2,.05,.05,bx+.1,1,zw+dir*v,standM);
    for(let i=0;i<7;i++)box(.07+(i%2)*.04,CEIL-.3,.3,x0+.17,CEIL/2,zw+dir*(3.5+i*.22),i%2?M('drape-a','#0f3122','#071710'):M('drape-b','#134030','#092016'));
    const [sx,sz]=P(-.9,depth-1.05);cyl(.62,.4,sx,.2,sz,M('ottoman','#3a1436','#1b0a19'),false,16);
    for(const [u,v,w,d,c] of [[0,-1.1,2.2,.05,pink],[0,1.1,2.2,.05,pink],[-1.1,0,.05,2.2,green],[1.1,0,.05,2.2,green]])box(w,.02,d,px+u,.014,pz+v,c);}
   if(!low){const L=new B.PointLight('milked-studio-light-'+s.n,new B.Vector3(px,2.5,pz-dir*.9),scene);L.parent=node;L.diffuse=B.Color3.Lerp(B.Color3.FromHexString(hex1),B.Color3.White(),.4);L.specular=B.Color3.FromHexString(hex2).scale(.4);L.intensity=36;L.range=7;   /* the figures are PBR (physical falloff), so this is a small lamp, lighting only the dancer */L.setEnabled(false);own.push(L);studioLights[s.n]=L;}}

  // ---------------- staff area: corridor, Fish's office, dressing rooms, restrooms, the rear door ----------------
  // staff corridor: lockers, a notice board, the exit sign over the rear door
  for(let i=0;i<5;i++){box(.4,1.95,.64,93.84,.98,-87.36+i*.68,M('locker','#262a33','#111318'));box(.02,.3,.04,94.05,1.3,-87.36+i*.68,i%2?pinkDim:greenDim);box(.02,.06,.3,94.05,1.7,-87.36+i*.68,dark);}
  sign(.8,.26,rx,rH+.36,BZ+.22,TON,240,78,(g,w,h)=>{g.fillStyle='#04140c';g.fillRect(0,0,w,h);g.fillStyle=GREEN;g.font=FONT(46);g.textAlign='center';g.textBaseline='middle';g.fillText('EXIT',w/2,h/2+3);});
  sign(1.5,.3,rx,3,BZ+.22,TON,420,84,(g,w,h)=>{g.fillStyle='#0a0a10';g.fillRect(0,0,w,h);g.fillStyle='#b9c2cf';g.font=FONT(30);g.textAlign='center';g.textBaseline='middle';g.fillText('SERVICE ALLEY',w/2,h/2+2);});
  box(.04,.02,9.6,95.8,.02,-84.8,greenDim);box(15.2,.02,.04,85.8,.02,-89.78,pinkDim);box(2.3,.04,.06,94.75,CEIL-.03,-85,G('staff-light','#e9fff4',.5));box(.06,.04,2.3,94.75,CEIL-.03,-88.9,G('staff-light','#e9fff4',.5));box(13,.04,.06,86,CEIL-.03,-89,G('staff-light','#e9fff4',.5));
  sign(1.1,.8,95.86,1.7,-84.5,TOW,220,160,(g,w,h)=>{g.fillStyle='#1a1410';g.fillRect(0,0,w,h);g.fillStyle='#d9d2c4';g.fillRect(14,14,84,60);g.fillRect(112,20,92,46);g.fillStyle='#ffc4e6';g.fillRect(20,88,70,54);g.fillStyle='#bff5d8';g.fillRect(104,80,100,66);g.fillStyle='#222';g.font=FONT(12);g.textAlign='left';g.fillText('ROTA',22,34);g.fillText('SET TIMES',118,40);g.fillText('18+ ONLY',26,112);g.fillText('ID ON FILE',110,104);});
  // restrooms (closed doors with plain signs)
  for(const [z,label] of [[-82.75,'RESTROOM 1'],[-86.25,'RESTROOM 2']]){box(.04,2.1,.9,95.865,1.05,z,doorM);box(.05,.3,.05,95.82,1.05,z+.32,trim);sign(.7,.2,95.835,1.7,z,TOW,250,72,(g,w,h)=>{g.fillStyle='#0a0a10';g.fillRect(0,0,w,h);g.fillStyle='#d5dbe4';g.font=FONT(30);g.textAlign='center';g.textBaseline='middle';g.fillText(label,w/2,h/2+2);});box(.03,.06,.06,95.83,1.95,z,green);}
  // rear corridor: the performers' doors of studios 3 and 4 (closed), a pipe run, small wall lights, flight cases, dressing room doors
  for(const [x,n] of [[87.5,3],[91.5,4]]){box(.95,2.12,.04,x,1.06,-88.135,doorM);box(.05,.3,.05,x+.34,1.05,-88.18,trim);box(.06,.06,.03,x+.62,1.5,-88.14,onAir,true);
   sign(.8,.2,x,2.36,-88.145,TOS,300,76,(g,w,h)=>{g.fillStyle='#0a0a10';g.fillRect(0,0,w,h);g.fillStyle=n===3?PINK:GREEN;g.font=FONT(28);g.textAlign='center';g.textBaseline='middle';g.fillText('STUDIO '+n+' · STAGE',w/2,h/2+2);});}
  box(15.3,.08,.08,85.7,CEIL-.3,-88.2,M('pipe','#2a2c31','#101114'));box(15.3,.05,.05,85.7,CEIL-.45,-88.18,trim);for(const x of [81.7,85.6,89.5,93])box(.2,.06,.1,x,2.75,-89.82,warm);
  box(.8,.55,1.5,78.6,.28,-89.05,M('case','#1b1d24','#0c0d11'));box(.74,.42,.8,78.6,.77,-89.3,M('case-b','#23262e','#101116'));for(const z of [-89.6,-88.5])box(.84,.05,.06,78.6,.3,z,trim);
  sign(.9,.22,79.95,2.42,-88.14,TOS,300,74,(g,w,h)=>{g.fillStyle='#0a0a10';g.fillRect(0,0,w,h);g.fillStyle=PINK;g.font=FONT(30);g.textAlign='center';g.textBaseline='middle';g.fillText('DRESSING A',w/2,h/2+2);});
  rbox(.06,2.16,1.2,79.42,1.08,-87.38,doorM,0,.5,0);   // dressing room A's door, standing open
  box(1.2,2.16,.04,83.6,1.08,-88.135,doorM);box(.05,.3,.05,84.05,1.05,-88.18,trim);box(.06,.06,.03,84.35,1.5,-88.14,red);
  sign(1,.34,83.6,2.6,-88.14,TOS,300,100,(g,w,h)=>{g.fillStyle='#0a0a10';g.fillRect(0,0,w,h);g.fillStyle=GREEN;g.font=FONT(28);g.textAlign='center';g.fillText('DRESSING B',w/2,38);g.fillStyle='#ff5a72';g.font=FONT(22);g.fillText('OCCUPIED',w/2,78);});
  // dressing room A: a mirror with bulbs, a counter and stools, a clothes rail, a bench
  box(2.7,1.1,.04,79.9,1.75,-82.94,M('mirror','#8ea2b6','#2a3540'));for(let i=0;i<8;i++){box(.09,.09,.06,78.65+i*.357,2.36,-82.95,warm);box(.09,.09,.06,78.65+i*.357,1.14,-82.95,warm);}
  box(3,.06,.55,79.9,.8,-83.19,trim);box(2.9,.74,.06,79.9,.4,-83.4,dark);for(const x of [79.2,80.6]){cyl(.36,.06,x,.5,-83.9,M('stool-p','#3a1436','#1b0a19'),false,12);cyl(.05,.48,x,.24,-83.9,standM,false,8);}
  box(.05,.05,2.8,78.38,1.7,-86,trim);for(const z of [-87.4,-84.6])box(.05,1.7,.05,78.38,.85,z,trim);for(let i=0;i<8;i++)box(.34,.95,.05,78.4,1.18,-87.2+i*.34,M('garment'+(i%4),['#5a1d44','#123425','#2c2f36','#3a1028'][i%4],['#22081a','#081a12','#111317','#1c0814'][i%4]));
  box(.5,.42,1.6,81.35,.21,-86,M('bench','#2a1430','#12071a'));box(1.8,.04,.06,79.9,CEIL-.03,-85.4,warm);
  // Fish's office: the broadcast monitor wall, the remote camera control desk, a couch, a shelf of drives
  const feeds=STUDIOS.map(s=>feed(s.n));
  box(.06,1.9,3.1,97.78,1.85,-76.9,dark);screen(2.9,1.72,97.74,1.85,-76.9,TOW,640,380,(g,w,h,t)=>{g.fillStyle='#030407';g.fillRect(0,0,w,h);feeds.forEach((f,i)=>{g.save();g.translate((i%2)*w/2+4,Math.floor(i/2)*h/2+4);g.beginPath();g.rect(0,0,w/2-8,h/2-8);g.clip();f(g,w/2-8,h/2-8,t+i);g.restore();});},.8);
  box(.8,.74,3,96.9,.37,-76.9,trim);box(.9,.06,3.1,96.9,.77,-76.9,dark);box(.03,.04,3,96.46,.72,-76.9,pinkDim);
  flat(screen(.5,.8,96.9,.805,-77.4,PI/2,160,288,(g,w,h,t)=>{g.fillStyle='#05070b';g.fillRect(0,0,w,h);g.fillStyle=GREEN;g.font=FONT(15);g.textAlign='left';g.fillText('REMOTE CAMERAS',8,22);for(let i=0;i<8;i++){const live=(Math.floor(t/4)+i)%8===0;g.fillStyle=live?PINK:'#16212a';g.fillRect(8+(i%2)*74,36+Math.floor(i/2)*58,66,48);g.fillStyle=live?'#fff':'#8f9aa8';g.font=FONT(14);g.fillText('S'+(Math.floor(i/2)+1)+' CAM '+'AB'[i%2],14+(i%2)*74,64+Math.floor(i/2)*58);}g.fillStyle='#8f9aa8';g.font=FONT(12);g.fillText('PAN  TILT  ZOOM',8,280);},1.3));
  for(const z of [-76.6,-76.2]){cyl(.14,.03,96.85,.815,z,standM,false,12);cyl(.035,.16,96.85,.9,z,trim,false,8);cyl(.06,.05,96.85,.99,z,z>-76.4?pink:green,false,8);}   // two joysticks
  for(let i=0;i<6;i++)box(.05,.02,.12,96.72+((i%3)*.09),.81,-75.75-Math.floor(i/3)*.16,i%2?pinkDim:greenDim);for(let i=0;i<4;i++)cyl(.07,.03,97.05,.815,-75.6-i*.14,trim,false,10);
  box(.5,.05,.5,95.95,.46,-78.1,dark);cyl(.06,.44,95.95,.22,-78.1,standM,false,8);box(.5,.55,.06,95.95,.78,-78.36,dark);   // the chair, pushed back
  box(1.7,.4,.7,94.65,.2,-74.72,M('couch','#2a1a2e','#10091a'));box(1.7,.42,.16,94.65,.6,-74.42,M('couch','#2a1a2e','#10091a'));
  box(1.5,1.6,.36,96.6,.8,-74.4,M('shelf','#1b1a22','#0b0a10'));for(let i=0;i<4;i++)for(let k=0;k<4;k++)box(.03,.03,.02,96.05+k*.36,.3+i*.36,-74.59,(i+k)%2?green:pink);
  screen(1.1,.62,96.6,2.25,-74.22,TOS,320,180,(g,w,h,t)=>{g.fillStyle='#05070b';g.fillRect(0,0,w,h);g.fillStyle=PINK;g.font=FONT(17);g.textAlign='left';g.fillText('BROADCAST · TONIGHT',10,24);g.font=FONT(14);g.fillStyle='#cfd8de';g.fillText('Studios on air      4 / 4',10,56);g.fillText('Members watching  '+(3900+Math.floor(t*5)%700).toLocaleString('en-US'),10,80);g.fillText('Stream health       good',10,104);g.fillStyle=GREEN;g.fillText('Payouts on schedule',10,134);g.fillText('All performers 18+, ID on file',10,158);},2);
  box(2.6,.02,1.6,95.3,.016,-77.6,M('rug','#22102a','#110815'));box(2.4,.04,.06,95.5,CEIL-.03,-77,pinkDim);cyl(.16,.04,94.6,CEIL-.02,-78.4,warm,false,10);
  box(.9,.02,.9,MODELS.fish.at[0],.02,MODELS.fish.at[1],G('fish-pad',PINK,.22));
  sign(1.1,.26,94.75,2.5,-79.74,TOS,330,78,(g,w,h)=>{g.fillStyle='#0a0a10';g.fillRect(0,0,w,h);g.fillStyle='#d5dbe4';g.font=FONT(32);g.textAlign='center';g.textBaseline='middle';g.fillText('OFFICE',w/2,h/2+2);});

  // ---------------- merge static pieces by material (few draw calls) ----------------
  for(const [mat,list] of groups){if(list.length>1){const merged=B.Mesh.MergeMeshes(list,true,true,undefined,false,false);if(merged){merged.parent=node;merged.material=mat;merged.isPickable=false;merged.freezeWorldMatrix?.();}}else list[0].freezeWorldMatrix?.();}

  // ---------------- people: Eva, Fish and one dancer in each studio (clothed crowd figures). Nobody else. ----------------
  const clipsOf=look=>root.VoidCrowd?.clips?.[look]||['idle'],SPARE=['district-resident','runner-02'];
  const spot=(id,x,z,face,clips,opts={})=>people.push({id,x,z,y:0,yaw:Math.atan2(face[0]-x,face[1]-z),clips,node:null,anim:null,spawned:false,...opts});
  const eva=MODELS.eva,fish=MODELS.fish;
  spot(eva.id,eva.at[0],eva.at[1],eva.face,eva.clips,{fixedLook:eva.look,asset:eva.asset,role:'eva'});spot(fish.id,fish.at[0],fish.at[1],fish.face,fish.clips,{fixedLook:fish.look,asset:fish.asset,role:'fish'});
  for(const s of STUDIOS)spot(s.dancer.id,s.spot[0],s.spot[1],s.face,s.dancer.clips,{fixedLook:s.dancer.look,spare:SPARE,role:'dancer',studio:s.n,library:s.dancer.library,y:.11,phase:s.n*1.3});
  const LOOKS=[...new Set(people.map(p=>p.fixedLook))];
  function staff(){
   if(!looksAsked&&clock>.5&&typeof mode!=='undefined'&&mode==='walking'){looksAsked=true;for(const look of LOOKS)try{Promise.resolve(root.VoidCharacterAssembler?.ensureLook?.(look,scene)).catch(()=>{});}catch{}}
   for(const p of people){
    if(!p.node){let n=null,look=null,clip=null;
     if(p.asset&&assets?.container?.(p.asset)){n=assets.instance(p.asset,node);look=p.asset;clip='idle';}
     else{   // Eva and Fish only ever use their own look; a dancer whose look is not on this machine after a while uses a spare clothed figure
      const order=p.spare&&clock>25?[p.fixedLook,...p.spare]:[p.fixedLook];
      for(const c of order){if(clipsOf(c).some(k=>p.clips.includes(k))&&(n=assets?.instance?.('crowd:'+c,node))){look=c;clip=p.clips.find(k=>clipsOf(c).includes(k))||'idle';break;}}}
     if(!n)continue;p.node=n;p.look=look;p.clip=clip;p.spawned=true;p.anim=p.asset?null:root.VoidCrowd?.animate?.(n,look,clip);n.position.set(p.x,p.y,p.z);n.rotation.y=p.yaw;n.metadata={...n.metadata,milked:p.id};
     if(p.role==='dancer'){const L=studioLights[p.studio];if(L){L.includedOnlyMeshes=n.getChildMeshes();L.setEnabled(true);}
      // the shared animation library, where it is installed: a different loop for each studio. Without it the look's own dance plays.
      if(p.library&&root.VoidAnimLibrary?.apply)Promise.resolve(root.VoidAnimLibrary.apply(n,look,{only:[p.library],scene})).then(added=>{if(disposed||p.node!==n||!added?.includes(p.library))return;p.anim?.play?.(p.library);p.clip=p.library;}).catch(()=>{});}
     continue;}
    // a figure with no dance of its own still moves: a slow sway on the spot
    if(p.role==='dancer'&&!/dance|^ac-/.test(p.clip)){const t=clock*2.6+p.phase;p.node.position.y=p.y+Math.abs(Math.sin(t))*.03;p.node.rotation.y=p.yaw+Math.sin(t*.5)*.4;}}
  }
  function tick(cam,dt){
   if(disposed)return;clock+=dt;const d=cam?distance(cam.x,cam.z):999;
   if(d<30){for(const s of screens){if(clock>s.next){s.next=clock+s.period;const g=s.t.getContext();s.draw(g,s.cw,s.ch,clock);s.t.update();}}
    {const k=Math.sin(clock*3.2)>0?1:.3;onAir.emissiveColor.copyFromFloats(k,.17*k,.29*k);}
    for(const o of doors){const want=Math.hypot(cam.x-o.cx,cam.z-o.cz)<o.r?1:0;if(o.k!==want){o.k+=Math.sign(want-o.k)*Math.min(Math.abs(want-o.k),dt*2.6);o.m.position[o.axis]=o.from+o.travel*o.k;}}}
   if(d<60)staff();
  }
  return {tick,inside:cam=>inside(cam),people,doors,state:()=>({ready:!disposed,people:people.filter(p=>p.spawned).length,dancers:people.filter(p=>p.spawned&&p.role==='dancer').map(p=>({studio:p.studio,look:p.look,clip:p.clip})),screens:screens.length,doors:doors.length}),
   dispose(){disposed=true;for(const p of people){try{p.anim?.dispose?.();p.node?.dispose?.();}catch{}}people.length=0;node.dispose(false,true);for(const o of own)try{o.dispose();}catch{}own.length=0;screens.length=0;doors.length=0;}};
 }
 const api={CONFIG,MODELS,DIALOGUE,MISSION,FOOTPRINT,LANE,ALLEY,DOOR,INNER,REAR,VESTIBULE,HALL,TAXI,SEGMENTS,FURNITURE,ROOMS,STUDIOS,INTERACTIONS,PLACES,BOUNDS,inside,distance,roomAt,solids,interactions,create};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VoidMilked=api;
})(typeof globalThis!=='undefined'?globalThis:this);
