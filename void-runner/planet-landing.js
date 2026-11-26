/* PLANET LANDINGS AND TAKE-OFFS (the owner, 20 Nov 2026: "I've also never flown from a space station to a planet yet ... it should probably have one so players don't get
   stuck out in space and can't return to Servo or land on other planets. it would be cool if the landing zones coming in matched what each area looked like ie: NeoChinaTown").
   PRESENTATION ONLY: travel, warp, missions, cargo and docking rewards are unchanged (campaign.js complete / world-integration.js arrive / dock decide where the player is).
   - DESCENT (about 22 s, skippable): when a flight ends at a planetside location (universe.js planetside: NeoChinatown on Servo, Vantor, The Nexus, the Natural Order
     homeworld, Vesper) the cockpit view plays: the planet filling the canopy, atmospheric entry (plasma glow, heat shimmer, shake), the cloud layer (rain on Servo),
     the flight over the landing area at its own time of day, lining up and the touchdown on the pad (gear thump, steam or dust). The walkable place loads underneath
     at the same time (dock() runs as before); the view hands over when the touchdown is done and the place is ready.
   - ASCENT (about 14 s, skippable): boarding the ship on a planet (launch from the ground) plays the reverse: lift-off, the climb over the area, the cloud layer, space.
     The existing flight starts as before (its departure phase follows). Mission steps that watch the flight (Mission 012 board / take off / jump / dock, the beginner
     campaign) read the same mode and route as before: the sequence never changes mode or the route; it only holds the game's update while it plays.
   - THE LANDING AREAS are estimates built from the real layout data, never invented: NeoChinatown from neochinatown.js (streets, footprints, the city box, the plot
     heights, the outer ring, the in-between blocks and the megacity rings), ncz-quarters.js (the Port pad, the gates), ncz-containers.js (the Outskirts' homes) and
     corporate.js (the Corporate District's blocks, set to the west); The Nexus and the Natural Order homeworld from planets.js (their buildings around the pad);
     Vantor from exploration-data.js mars-terminal (subsurface access, pressure control); Vesper from the opening scene (desert workshop by the ridges).
   - SKIP: the SKIP button, Space, Enter or Escape. SETTING: Settings > Flight > "Play landing sequences" (On by default; this browser only, localStorage).
   - DEAD ENDS FIXED with this (see tests/planet-landing.test.cjs): a District player without a ship anywhere but NeoChinatown takes a passenger shuttle home from the
     BOARD point (shuttleHome); a flight that lands at NeoChinatown sets down at the Port, on the street (campaign.js complete).
   Pure part (Node and browser): biomes, timelines, camera paths, the city plan. Browser part: one small Babylon scene on the game's engine, disposed after each sequence. */
(function(root){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports;
 const U=node?require('./universe.js'):root.VoidUniverse;
 const KEY='void-landing-sequences',HOME='earth';
 // ---- timelines (seconds) ----
 const TIMELINES={descent:[['orbit',4],['entry',4.6],['clouds',3.2],['approach',7.4],['touchdown',3.6]],ascent:[['liftoff',3.4],['climb',4.8],['clouds',2.6],['space',3.2]]};
 const duration=kind=>(TIMELINES[kind]||[]).reduce((n,p)=>n+p[1],0);
 function phaseAt(kind,t){const list=TIMELINES[kind]||[];let a=0;for(let i=0;i<list.length;i++){const [id,d]=list[i];if(t<a+d||i===list.length-1)return {id,index:i,k:Math.max(0,Math.min(1,(t-a)/d)),start:a,length:d};a+=d;}return null;}
 /* ---- the landing areas. pad: where the ship stands in the walkable scene (x, z, ground y). face: the way the ship's nose points there (its view at touchdown).
    arrive: the direction flown over the area on the way in; leave: the climb-out direction. Light: 'night' (lit city, emissive) or 'day'. ---- */
 const BIOMES={
  earth:{id:'neochinatown',planet:'Servo',place:'NeoChinatown',pad:'THE PORT · PAD 01',at:[22,-96,0],eye:3.4,face:[0,-1],arrive:[-1,0],leave:[.86,.51],light:'night',weather:'rain',
   sky:['#04050a','#1b1622','#3a2a2e'],fog:['#17131c',.0021],clouds:'#24212a',cloudGlow:'#3a2c2c',ground:'steam',
   orbit:{ocean:'#0b1622',land:'#1a1d22',lights:'#ffb46a',cloud:'#5d6370',rim:'#6e8cff',night:true,density:.9}},
  mars:{id:'vantor',planet:'Vantor',place:'Vantor · Subsurface Access',pad:'PRESSURE CONTROL · LANDING PAD',at:[-7,-24,0],eye:3.2,face:[0,1],arrive:[0,1],leave:[0,1],light:'night',weather:'dust',
   sky:['#07040a','#2a1612','#5a2c1c'],fog:['#2a1712',.0016],clouds:'#5a3524',cloudGlow:'#8a4a2a',ground:'dust',
   orbit:{ocean:'#4a2416',land:'#8a4a2c',lights:'#ffb060',cloud:'#b07a5a',rim:'#ff9a6a',night:true,density:.04}},
  nexus:{id:'nexus',planet:'The Nexus',place:'Cantor System · Communion homeworld',pad:'LANDING PAD',at:[-4,-29,0],eye:2.8,face:[Math.sin(.3),Math.cos(.3)],arrive:[Math.sin(.3),Math.cos(.3)],leave:[-Math.sin(.3),-Math.cos(.3)],light:'day',weather:'haze',
   sky:['#5d6a75','#8c99a3','#b2bcc3'],fog:['#8c9ba6',.0019],clouds:'#a7b1b9',cloudGlow:'#c9d2d8',ground:'dust',
   orbit:{ocean:'#2b3a46',land:'#76848e',lights:'#7fe6ff',cloud:'#c9d2d8',rim:'#9fd8ff',night:false,density:.35}},
  'order-homeworld':{id:'order',planet:'Natural Order homeworld',place:'Garrow System',pad:'LANDING PAD',at:[-4,-29,0],eye:2.8,face:[Math.sin(.3),Math.cos(.3)],arrive:[Math.sin(.3),Math.cos(.3)],leave:[-Math.sin(.3),-Math.cos(.3)],light:'day',weather:'none',
   sky:['#3f6da0','#80a8cc','#b8cde0'],fog:['#a3b8c8',.0016],clouds:'#eef2f5',cloudGlow:'#ffffff',ground:'dust',
   orbit:{ocean:'#1d4a78',land:'#5f7a3a',lights:'#ffd28a',cloud:'#f3f5f7',rim:'#8fc4ff',night:false,density:.08}},
  vesper:{id:'vesper',planet:'Vesper',place:'Ward Freight Workshop',pad:'WORKSHOP YARD',at:[12,25,0],eye:3.4,face:[Math.sin(Math.PI+.4),Math.cos(Math.PI+.4)],arrive:[Math.sin(Math.PI+.4),Math.cos(Math.PI+.4)],leave:[-Math.sin(Math.PI+.4),-Math.cos(Math.PI+.4)],light:'day',weather:'dust',
   sky:['#6f8296','#9aaab9','#cfb99c'],fog:['#cfb99c',.0011],clouds:'#e2d6c4',cloudGlow:'#fff3de',ground:'dust',
   orbit:{ocean:'#8f8270',land:'#c2a584',lights:'#ffe0a8',cloud:'#e8dccb',rim:'#e9cfa8',night:false,density:.03}}};
 BIOMES['cinder-landing']={...BIOMES.nexus,id:'cinder-landing',planet:'Cinder Ring',place:'Ring Survey Site',pad:'Survey Landing',weather:'none'};
 const biome=id=>Object.hasOwn(BIOMES,id)?BIOMES[id]:null;
 /* A location with a descent: on the ground (universe.js planetside) and with a landing area here. */
 const landable=id=>!!(U&&U.planetside(id)&&biome(id));
 const systemName=id=>{try{return U.systems[U.system(id)].name;}catch{return '';}};
 function captions(id,kind){const b=biome(id);if(!b)return {};const sys=systemName(id).toUpperCase(),planet=b.planet.toUpperCase();
  return kind==='ascent'?{liftoff:'LIFT-OFF · '+b.pad,climb:'CLIMB-OUT · '+b.place.toUpperCase(),clouds:'CLOUD LAYER',space:'LEAVING '+planet+' · '+sys}
   :{orbit:'ORBITAL APPROACH · '+planet+' · '+sys,entry:'ATMOSPHERIC ENTRY',clouds:'CLOUD LAYER',approach:'FINAL APPROACH · '+b.place.toUpperCase(),touchdown:'TOUCHDOWN · '+b.pad};}
 /* The setting (this browser only): on unless the player turned it off. */
 function enabled(storage){try{const s=storage||(typeof localStorage!=='undefined'?localStorage:null);return !s||s.getItem(KEY)!=='off';}catch{return true;}}
 function setEnabled(on,storage){try{const s=storage||localStorage;s.setItem(KEY,on?'on':'off');}catch{}}
 /* ---- dead-end fix: a District player with no ship of their own, anywhere but NeoChinatown, rides a passenger shuttle home from the BOARD point ----
    (before this, BOARD said "You do not have a ship yet." or "Talk to the station contact before boarding." and there was no way back to Servo). Not in the old
    Vesper opening (no ship yet there is the story) and never for a ship owner. */
 const district=s=>s?.story?.flags?.missionPool==='closed';
 const hasShip=s=>s?.story?.flags?.shipAccess!=='none';
 function needsShuttle(s){return !!(s&&s.story&&district(s)&&!hasShip(s)&&s.location!==HOME&&U&&Object.hasOwn(U.locations,s.location||''));}
 function shuttleHome(s){if(!needsShuttle(s))return false;const from=s.location;s.location=HOME;s.destination=null;s.travel=null;if(s.universe)U.visit(s);const f=s.story.flags;delete f.area;delete f.quarter;
  if(s.progression&&typeof s.progression==='object')s.progression.checkpoint={location:HOME};if(typeof from==='string'&&from.length<40)f.shuttleFrom=from;return true;}
 // ---- maths ----
 const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t,ease=t=>t*t*(3-2*t),easeOut=(t,p=2)=>1-Math.pow(1-t,p),easeIn=(t,p=2)=>Math.pow(t,p);
 function rng(seed){let a=seed>>>0;return ()=>{a=a+0x6D2B79F5>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
 // Catmull-Rom through points [x,y,z]; u in 0..1 over the whole list.
 function spline(P,u){const n=P.length-1,f=clamp(u)*n,i=Math.min(n-1,Math.floor(f)),t=f-i,p0=P[Math.max(0,i-1)],p1=P[i],p2=P[i+1],p3=P[Math.min(n,i+2)];
  return [0,1,2].map(k=>.5*(2*p1[k]+(-p0[k]+p2[k])*t+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*t*t+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*t*t*t));}
 const yawOf=([x,z])=>Math.atan2(x,z);
 function turn(a,b,t){let d=b-a;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;return a+d*t;}
 /* The flight lines over each area (world metres): in from the clouds along `arrive`, a gentle S over the area, lining up, the hover over the pad. */
 function approachPoints(b){const [px,pz]=b.at,[ax,az]=b.arrive,sx=-az,sz=ax,P=(back,alt,side=0)=>[px-ax*back+sx*side,alt,pz-az*back+sz*side];
  return [P(1300,900,-200),P(820,640,-120),P(440,400,60),P(210,215,30),P(95,105,-10),P(40,50,0),P(0,28,0)];}
 function climbPoints(b){const [px,pz]=b.at,[ax,az]=b.leave,sx=-az,sz=ax,P=(fwd,alt,side=0)=>[px+ax*fwd+sx*side,alt,pz+az*fwd+sz*side];
  return [P(0,30,0),P(60,52,10),P(170,120,40),P(330,260,90),P(700,620,180),P(1200,1320,240)];}
 /* The camera (cockpit eye) at time t of a kind's city phases: {pos, yaw, pitch, roll, space:false}. Orbit / space phases return {space:true, k} (the browser draws those). */
 function camera(id,kind,t){const b=biome(id);if(!b)return null;const ph=phaseAt(kind,t);if(!ph)return null;const [px,pz]=b.at,gy=b.at[2]||0,faceYaw=yawOf(b.face),eye=gy+b.eye;
  const look=(P,u,pitch0,pitch1)=>{const p=spline(P,u),q=spline(P,Math.min(1,u+.02)),r=spline(P,Math.max(0,u-.02)),dx=q[0]-p[0],dz=q[2]-p[2],yaw=Math.atan2(dx,dz)||0,
   y1=Math.atan2(q[0]-r[0],q[2]-r[2]),y2=Math.atan2(dx,dz),bank=clamp(turn(0,y2-y1,1)*-6,-.35,.35);return {pos:p,yaw,pitch:lerp(pitch0,pitch1,u),roll:bank};};
  if(kind==='descent'){
   if(ph.id==='orbit'||ph.id==='entry')return {space:true,phase:ph.id,k:ph.k};
   const A=approachPoints(b);
   if(ph.id==='clouds'){const top=[A[0][0]-b.arrive[0]*500,1650,A[0][2]-b.arrive[1]*500],k=easeIn(ph.k,1.2),p=[lerp(top[0],A[0][0],k),lerp(top[1],A[0][1],k),lerp(top[2],A[0][2],k)];return {pos:p,yaw:yawOf(b.arrive),pitch:-.55+.2*ph.k,roll:.05,phase:ph.id,k:ph.k};}
   if(ph.id==='approach'){const u=easeOut(ph.k,1.15),c=look(A,u,-.98,-.3),w=ease(clamp((u-.3)/.5)),cp=Math.cos(c.pitch);
    // late in the approach the eye goes to the landing area itself (the pad and the streets round it sit in the canopy, above the dashboard)
    const ahead=[c.pos[0]+Math.sin(c.yaw)*cp*100,c.pos[1]+Math.sin(c.pitch)*100,c.pos[2]+Math.cos(c.yaw)*cp*100],to=[px-b.arrive[0]*6,gy,pz-b.arrive[1]*6],tg=[0,1,2].map(i=>lerp(ahead[i],c.pos[i]+(to[i]-c.pos[i])*100/Math.max(1,Math.hypot(to[0]-c.pos[0],to[1]-c.pos[1],to[2]-c.pos[2])),w));
    const dx=tg[0]-c.pos[0],dy=tg[1]-c.pos[1],dz=tg[2]-c.pos[2];return {...c,yaw:Math.atan2(dx,dz),pitch:Math.atan2(dy,Math.hypot(dx,dz)),phase:ph.id,k:ph.k};}
   // touchdown: down from the hover onto the pad, turning to the way the ship stands; a small settle after the gear touches (k .78)
   const k=ph.k,down=easeOut(clamp(k/.78),2.2),settle=k>.78?Math.sin((k-.78)/.22*Math.PI)*-.12:0,y=lerp(gy+28,eye,down)+settle;
   return {pos:[px,y,pz],yaw:turn(yawOf(b.arrive),faceYaw,ease(clamp(k/.7))),pitch:lerp(-.42,-.08,ease(k)),roll:0,phase:ph.id,k,touched:k>=.78};}
  if(ph.id==='liftoff'){const k=ph.k,up=ease(k),C=climbPoints(b);return {pos:[px,lerp(eye,C[0][1],up),pz],yaw:turn(faceYaw,yawOf(b.leave),ease(clamp((k-.25)/.75))),pitch:lerp(-.06,-.18,k),roll:0,phase:ph.id,k};}
  const C=climbPoints(b);
  if(ph.id==='climb'){const u=easeIn(ph.k,1.25)*.8,c=look(C,u,-.62,-.1);return {...c,phase:ph.id,k:ph.k};}
  if(ph.id==='clouds'){const u=.8+.2*ph.k,c=look(C,u,-.04,.26);return {...c,phase:ph.id,k:ph.k};}
  return {space:true,phase:ph.id,k:ph.k};}
 /* ---- NeoChinatown from the air: the real layout, built cheaply (the browser part instances it). Deterministic; no random numbers of the walkable city's. ----
    N: neochinatown.js; CT: ncz-containers.js; CORP: corporate.js. quality: low | medium | high | ultra. */
 function solidRects(box,open,S){const [X0,X1,Z0,Z1]=box,cells=Math.round((X1-X0)/S),runs=new Map(),out=[];
  for(let z=Z0;z<Z1;z+=S){const cz=z+S/2,spans=open.filter(r=>cz>=r[2]&&cz<=r[3]).map(r=>[Math.max(0,Math.ceil((r[0]-X0-S/2)/S)),Math.min(cells,Math.floor((r[1]-X0-S/2)/S)+1)]).filter(([i,j])=>j>i).sort((p,q)=>p[0]-q[0]);
   let i=0;const solid=[];for(const [a,b] of spans){if(a>i)solid.push([i,a]);i=Math.max(i,b);}if(i<cells)solid.push([i,cells]);
   for(const [a,b] of solid){const x0=X0+a*S,x1=X0+b*S,key=x0+':'+x1,prev=runs.get(key);if(prev&&prev.z1===z)prev.z1=z+S;else{const r={x0,x1,z0:z,z1:z+S};runs.set(key,r);out.push(r);}}}
  return out;}
 const overlap=([a,b,c,d],[e,f,g,h],m=0)=>a<f+m&&b>e-m&&c<h+m&&d>g-m;
 function cityPlan(N,CT,CORP,quality='medium'){
  const low=quality==='low',high=quality==='high'||quality==='ultra',rand=rng(2026112),streets=N.streets,open=[...Object.values(streets),...Object.values(N.footprints)],box=N.cityBox,pad=streets.pad;
  const wide=r=>[streets.avenue,streets.main,streets.farSouth].some(s=>s&&overlap(r,s,.8));
  const heightField=(x,z)=>{const C=17,ix=Math.floor(x/C),iz=Math.floor(z/C),fx=x/C-ix,fz=z/C-iz,sm=t=>t*t*(3-2*t),cor=(i,j)=>{let h=Math.imul(i+7919,374761393)^Math.imul(j+104729,668265263);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;},u=sm(fx),w=sm(fz);
   return (cor(ix,iz)*(1-u)+cor(ix+1,iz)*u)*(1-w)+(cor(ix,iz+1)*(1-u)+cor(ix+1,iz+1)*u)*w;};
  // the plots: the city blocks between the streets, cut into plots of up to 12 m, with the walkable city's floor counts (4 to 7 floors on the wide streets)
  const plots=[];solidRects(box,open,.5).forEach((r,bi)=>{const w=r.x1-r.x0,d=r.z1-r.z0,nx=Math.ceil(w/12),nz=Math.ceil(d/12);
   for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){const x0=r.x0+w*i/nx,x1=r.x0+w*(i+1)/nx,z0=r.z0+d*j/nz,z1=r.z0+d*(j+1)/nz,R=[x0,x1,z0,z1],hf=heightField((x0+x1)/2,(z0+z1)/2),bump=rand()<.18?1:0,wd=wide(R);
    const faces=[];if(open.some(o=>overlap([x0-.6,x0,z0+.5,z1-.5],o)))faces.push('w');if(open.some(o=>overlap([x1,x1+.6,z0+.5,z1-.5],o)))faces.push('e');if(open.some(o=>overlap([x0+.5,x1-.5,z0-.6,z0],o)))faces.push('s');if(open.some(o=>overlap([x0+.5,x1-.5,z1,z1+.6],o)))faces.push('n');
    plots.push({x0,x1,z0,z1,h:wd?7.4+(3+Math.min(2,Math.floor(hf*3))+bump)*3.2+1.5:4.6+(1+Math.min(2,Math.floor(hf*3))+bump)*3.2+1.5,k:(i+j*2+bi)%3,faces,wide:wd});}});
  // the places with their own walls: the District (13 m brick, its front on the alley), the roof terrace's building, Milked
  const fp=N.footprints,landmarks=[{id:'district',r:fp.district,h:13},{id:'terrace',r:fp.terrace,h:9.6},{id:'milked',r:fp.milked,h:16}].filter(l=>l.r);
  // the outer ring round the city box (26 to 46 m), the blocks in between out to 300 m (18 to 66 m), the megacity's rings of towers (110 to 620 m)
  const [X0,X1,Z0,Z1]=box,centre=[(X0+X1)/2,(Z0+Z1)/2],ring=[];
  [[X0-24,X1+24,Z1,Z1+18],[X0-24,X1+24,Z0-18,Z0],[X0-24,X0,Z0,Z1],[X1,X1+24,Z0,Z1]].forEach(([x0,x1,z0,z1])=>{const along=x1-x0>z1-z0,n=Math.ceil((along?x1-x0:z1-z0)/14);
   for(let i=0;i<n;i++){const a=i/n,b=(i+1)/n,r=along?[x0+(x1-x0)*a,x0+(x1-x0)*b,z0,z1]:[x0,x1,z0+(z1-z0)*a,z0+(z1-z0)*b];ring.push({x0:r[0],x1:r[1],z0:r[2],z1:r[3],h:26+rand()*20,k:i%3});}});
  const mid=[],R=low?240:300;for(let x=centre[0]-R;x<centre[0]+R;x+=26)for(let z=centre[1]-R;z<centre[1]+R;z+=26){if(Math.hypot(x+13-centre[0],z+13-centre[1])>R||x+26>X0-44&&x<X1+44&&z+26>Z0-40&&z<Z1+40)continue;
   const w=18+rand()*6,d=18+rand()*6,h=18+rand()*48;mid.push({x0:x+13-w/2,x1:x+13+w/2,z0:z+13-d/2,z1:z+13+d/2,h,k:Math.floor(rand()*3)});}
  // the landing corridors: the tallest towers stand clear of them (the flight lines' clearance is tested)
  const [px,,pz]=[pad[0]+(pad[1]-pad[0])*.36,0,(pad[2]+pad[3])/2],E=BIOMES.earth,line=(x,z,[dx,dz],sign)=>{const along=((x-px)*dx+(z-pz)*dz)*sign;return along>-60?Math.abs((x-px)*dz-(z-pz)*dx)-along*.15:1e9;},lane=(x,z,half)=>line(x,z,E.arrive,-1)<half||line(x,z,E.leave,1)<half;   // the flight lines: in from the east over the District, out to the north-east across Old Town
  const towers=[],rings=low?[[30,290,370,100,260]]:high?[[44,290,370,110,320],[58,400,560,220,620]]:[[40,290,370,110,320],[40,400,560,220,520]];
  rings.forEach(([n,r0,r1,h0,h1],ri)=>{for(let i=0;i<n;i++){const a=(i+rand()*.7)/n*Math.PI*2,r=r0+rand()*(r1-r0),x=centre[0]+Math.sin(a)*r,z=centre[1]+Math.cos(a)*r,w=18+rand()*26,d=18+rand()*26,h=h0+rand()*(h1-h0);
   if(lane(x,z,105))continue;towers.push({x,z,w,d,h,k:(i*7+ri)%3,beacon:rand()<.7,screen:rand()<(low?.08:.16)});}});
  for(const m of mid)if(lane((m.x0+m.x1)/2,(m.z0+m.z1)/2,60))m.h=Math.min(m.h,30);
  // the Corporate District (corporate.js BLOCKS, its own scene about 1.8 km away through the Function Gate): set to the west, towers taller than the city's own so they read on the skyline
  const corp=[];if(CORP&&CORP.BLOCKS){const cx=-1250,cz=-12,scale=2.2;for(const b of CORP.BLOCKS){const [a,bb,c,d]=b.rect;corp.push({x0:cx+a,x1:cx+bb,z0:cz+c,z1:cz+d,h:b.h*scale,k:b.id.length%3,id:b.id});}}
  // the Outskirts: the container homes (ncz-containers.js plan)
  const homes=[];try{for(const h of (CT&&CT.plan?CT.plan(quality):[])){const w=h.axis==='z'?h.w:h.d,d=h.axis==='z'?h.d:h.w;(h.levels||[{paint:'#807f78'}]).forEach((l,i)=>homes.push({x:h.x+((l.off||[0,0])[0]||0),z:h.z+((l.off||[0,0])[1]||0),y:i*(CT.CH||2.59),w,d,h:CT.CH||2.59,paint:l.paint||'#807f78'}));}}catch{}
  // what lights the streets: blade signs on the wide streets' fronts, a lit shopfront strip on every street front, street lamps along every street
  const signs=[],strips=[],lamps=[],COLS=['#ff3fb4','#35d8ff','#ff5a4a','#ffb347','#e8eef8'];
  for(const p of plots){for(const f of p.faces){const vertical=f==='w'||f==='e',len=vertical?p.z1-p.z0:p.x1-p.x0,mid=vertical?(p.z0+p.z1)/2:(p.x0+p.x1)/2,edge={w:p.x0,e:p.x1,s:p.z0,n:p.z1}[f],out={w:-1,e:1,s:-1,n:1}[f];
    if(len<4)continue;const col=COLS[Math.floor(rand()*COLS.length)];
    strips.push({x:vertical?edge+out*.25:mid,z:vertical?mid:edge+out*.25,len:len*.82,along:vertical?'z':'x',y:3.6,c:rand()<.55?'#ffcf8a':col});
    if(p.wide&&rand()<(low?.35:.7)){const n=rand()<.3?2:1;for(let s=0;s<n;s++){const t=(s+.5)/n*len-len/2+(rand()-.5)*2,hh=3+rand()*4.5;signs.push({x:vertical?edge+out*.75:mid+t,z:vertical?mid+t:edge+out*.75,y:5.4+hh/2+rand()*2,h:hh,along:vertical?'x':'z',c:COLS[Math.floor(rand()*4)]});}}}}
  for(const [id,r] of Object.entries(streets)){if(/^back-/.test(id)||id==='corporate'||id==='avenueWest'||id==='avenueEast')continue;const [x0,x1,z0,z1]=r,w=x1-x0,d=z1-z0;if(Math.min(w,d)<4)continue;const alongX=w>=d,len=alongX?w:d,n=Math.max(1,Math.floor(len/(low?20:14)));
   for(let i=0;i<n;i++){const t=(i+.5)/n;for(const side of [0,1]){if(id==='pad'||id==='outskirts'||id==='outskirtsWest'||id==='outskirtsEast')continue;lamps.push(alongX?{x:x0+w*t,z:side?z1-.6:z0+.6}:{x:side?x1-.6:x0+.6,z:z0+d*t});}}}
  return {box,centre,pad:{rect:pad,at:[px,pz]},streets,plots,landmarks,ring,mid,towers,corp,homes,signs,strips,lamps,gates:(N.quarters&&N.quarters.GATES||[]).map(g=>({id:g.id,rect:g.rect.slice()}))};}
 /* The tallest building under a point (for the flight-line clearance test). */
 function heightAt(plan,x,z){let h=0;const inR=(a,b,c,d)=>x>=a&&x<=b&&z>=c&&z<=d;for(const p of [...plan.plots,...plan.ring,...plan.mid,...plan.corp])if(inR(p.x0,p.x1,p.z0,p.z1))h=Math.max(h,p.h);
  for(const l of plan.landmarks)if(inR(...l.r))h=Math.max(h,l.h);for(const t of plan.towers)if(inR(t.x-t.w/2,t.x+t.w/2,t.z-t.d/2,t.z+t.d/2))h=Math.max(h,t.h);return h;}
 const api={KEY,HOME,TIMELINES,BIOMES,duration,phaseAt,biome,landable,captions,enabled,setEnabled,needsShuttle,shuttleHome,approachPoints,climbPoints,camera,spline,cityPlan,heightAt,rng};
 if(node){module.exports=api;return;}
 root.VoidLanding=api;
 if(typeof document==='undefined')return;

 // =============================================================== BROWSER ===============================================================
 const base=document.currentScript?new URL('.',document.currentScript.src):new URL('void-runner/',location.href);
 const st=()=>{try{return state;}catch{return null;}},md=()=>{try{return mode;}catch{return null;}};
 const css=document.createElement('style');css.textContent='#landing-seq{position:fixed;inset:0;z-index:95;background:#000;cursor:default;user-select:none}#landing-seq[hidden]{display:none}#landing-seq canvas{position:absolute;inset:0;width:100%;height:100%}'
  +'#landing-seq .ls-cap{position:absolute;left:5vw;top:calc(7vh + 18px);font:600 13px/1.4 ui-monospace,Consolas,monospace;letter-spacing:.2em;color:#d9e4e6;text-shadow:0 0 4px #000;opacity:.92;transition:opacity .4s}'
  +'#landing-seq .ls-sub{position:absolute;left:5vw;top:calc(7vh + 40px);font:12px/1.4 ui-monospace,Consolas,monospace;letter-spacing:.14em;color:#9fb3b8;text-shadow:0 0 4px #000}'
  +'#landing-seq .ls-skip{position:absolute;right:5vw;bottom:calc(7vh + 18px);font:700 13px/1 ui-monospace,Consolas,monospace;letter-spacing:.18em;color:#e8eef0;background:rgba(6,10,14,.62);border:1px solid rgba(220,232,236,.5);padding:10px 16px;cursor:pointer}'
  +'#landing-seq .ls-skip:hover,#landing-seq .ls-skip:focus-visible{background:rgba(30,40,48,.85);border-color:#fff;outline:none}#landing-seq .ls-skip small{font-weight:400;color:#9fb3b8;margin-left:8px;letter-spacing:.1em}';
 document.head.append(css);
 let el=null,cv=null,g=null,L=null,hooked=false;
 function ui(){if(el)return;el=document.createElement('div');el.id='landing-seq';el.hidden=true;el.setAttribute('role','img');
  el.innerHTML='<canvas></canvas><div class="ls-cap" aria-live="polite"></div><div class="ls-sub"></div><button type="button" class="ls-skip" data-landing-skip>SKIP<small>SPACE</small></button>';
  document.body.append(el);cv=el.querySelector('canvas');g=cv.getContext('2d');el.querySelector('[data-landing-skip]').addEventListener('click',e=>{e.preventDefault();skip();});}
 // ---- the game loop: while a sequence plays, the game's update is held and its draw replaced (draw / update are game.js functions, wrapped once, outermost) ----
 function hook(){if(hooked)return true;if(typeof draw!=='function'||typeof update!=='function')return false;const od=draw,ou=update;
  draw=function(){if(L&&!paused()){try{frame();}catch(e){console.error('[landing sequence]',e);end('error');}return;}return od.apply(this,arguments);};
  update=function(){if(L&&!paused())return;return ou.apply(this,arguments);};hooked=true;return true;}
 // The game menu (Esc in flight, a lost focus) pauses the sequence; leaving to the main menu or a new campaign ends it.
 function paused(){if(!L)return false;const m=md();if(m==='menu'||m==='title'){if(!(root.VoidMenu&&VoidMenu.returnTo)||st()!==L.state){end('left');return true;}if(!el.hidden){el.hidden=true;}L.wasPaused=true;return true;}
  if(L.wasPaused){L.wasPaused=false;el.hidden=false;L.last=performance.now();}return false;}
 const keys=e=>{if(!L||paused())return;if(['Space','Enter','Escape','NumpadEnter'].includes(e.code)){if(e.type==='keydown'&&!e.repeat)skip();}e.preventDefault();e.stopImmediatePropagation();};
 // ---- quality ----
 const Q=()=>{const q=root.VoidBabylon?.quality||'medium';return q;};
 // ---- textures ----
 function dyn(scene,name,w,h,paint,alpha=false){const t=new BABYLON.DynamicTexture('ls-'+name,{width:w,height:h},scene,true);const c=t.getContext();paint(c,w,h);t.update();t.hasAlpha=alpha;return t;}
 function noise2(w,h,seed,oct=5){const r=rng(seed),grids=[];for(let o=0;o<oct;o++){const n=4<<o,a=new Float32Array((n+1)*(n/2+1));for(let i=0;i<a.length;i++)a[i]=r();grids.push({n,a});}
  return (u,v)=>{let s=0,amp=1,tot=0;for(const {n,a} of grids){const m=n/2,x=u*n,y=v*m,i=Math.floor(x)%n,j=Math.min(m-1,Math.floor(y)),fx=x-Math.floor(x),fy=y-Math.floor(y),i2=(i+1)%n,sm=t=>t*t*(3-2*t),q=(ii,jj)=>a[jj*(n+1)+ii];
   const v0=lerp(q(i,j),q(i2,j),sm(fx)),v1=lerp(q(i,j+1),q(i2,j+1),sm(fx));s+=lerp(v0,v1,sm(fy))*amp;tot+=amp;amp*=.52;}return s/tot;};}
 const hex=h=>{const n=parseInt(h.slice(1),16);return [n>>16&255,n>>8&255,n&255];};
 // ---- the orbit space: the planet seen from orbit and during entry (its own corner of the scene, 60 km below the landing area) ----
 const O=[0,-60000,0],PR=100;
 function buildPlanet(scene,b,q){const B=BABYLON,o=b.orbit,small=q==='low',W=small?512:1024,H=W/2,own=[];
  const root_=new B.TransformNode('ls-orbit',scene);root_.position.set(...O);
  const nz=noise2(W,H,b.id.length*977+13,small?5:6),cz=noise2(W,H,b.id.length*311+7,small?5:6),lz=noise2(W,H,b.id.length*53+5,4);
  const [oc,la,li,cl]=[hex(o.ocean),hex(o.land),hex(o.lights),hex(o.cloud)];
  const surf=dyn(scene,'planet',W,H,(c,w,h)=>{const img=c.createImageData(w,h),d=img.data;for(let y=0;y<h;y++)for(let x=0;x<w;x++){const u=x/w,v=y/h,n=nz(u,v),land=clamp((n-.48)*7),cc=clamp((cz(u*1.6%1,v)-.5)*3.2)*(.55+.45*Math.sin(v*Math.PI)),i=(y*w+x)*4;
    for(let k=0;k<3;k++)d[i+k]=lerp(lerp(oc[k],la[k]*(0.75+0.5*n),land),cl[k],cc*.85);d[i+3]=255;}c.putImageData(img,0,0);});
  const lights=dyn(scene,'lights',W,H,(c,w,h)=>{c.fillStyle='#000';c.fillRect(0,0,w,h);if(!o.density)return;const img=c.getImageData(0,0,w,h),d=img.data,r=rng(b.id.length*71);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){const u=x/w,v=y/h,n=nz(u,v);if(n<.5)continue;const city=clamp((lz(u,v)-.45)*3.5)*o.density,p=r();if(p<city*1.3){const i=(y*w+x)*4,s=.4+r()*.6;d[i]=li[0]*s;d[i+1]=li[1]*s;d[i+2]=li[2]*s;d[i+3]=255;}}c.putImageData(img,0,0);});
  const m=new B.StandardMaterial('ls-planet',scene);m.diffuseTexture=surf;m.emissiveTexture=lights;m.specularColor=new B.Color3(.05,.05,.06);m.emissiveColor=new B.Color3(.025,.03,.045);m.fogEnabled=false;own.push(m);
  const s=B.MeshBuilder.CreateSphere('ls-planet',{diameter:PR*2,segments:small?32:56},scene);s.parent=root_;s.material=m;s.rotation.y=1.2;
  const am=new B.StandardMaterial('ls-atmo',scene);am.diffuseColor=B.Color3.Black();am.specularColor=B.Color3.Black();am.disableLighting=true;am.fogEnabled=false;am.alpha=.9;am.alphaMode=B.Constants.ALPHA_ADD;am.backFaceCulling=true;
  const fr=new B.FresnelParameters();fr.leftColor=B.Color3.FromHexString(o.rim);fr.rightColor=B.Color3.Black();fr.power=2.2;fr.bias=.12;am.emissiveFresnelParameters=fr;am.emissiveColor=B.Color3.Black();own.push(am);
  const atmo=B.MeshBuilder.CreateSphere('ls-atmo',{diameter:PR*2*1.035,segments:small?24:40},scene);atmo.parent=root_;atmo.material=am;
  return {root:root_,planet:s,own,tick(t){s.rotation.y=1.2+t*.004;}};}
 function buildStars(scene,q){const B=BABYLON,t=dyn(scene,'stars',1024,512,(c,w,h)=>{c.fillStyle='#000';c.fillRect(0,0,w,h);const r=rng(4242);for(let i=0;i<(q==='low'?900:1800);i++){const a=r(),s=r()<.03?1.6:r()<.2?1:.6;c.fillStyle='rgba('+(200+r()*55|0)+','+(205+r()*50|0)+',255,'+(.25+a*.75)+')';c.fillRect(r()*w,r()*h,s,s);}});
  const m=new B.StandardMaterial('ls-stars',scene);m.emissiveTexture=t;m.diffuseColor=B.Color3.Black();m.specularColor=B.Color3.Black();m.disableLighting=true;m.backFaceCulling=false;m.fogEnabled=false;
  const s=B.MeshBuilder.CreateSphere('ls-stars',{diameter:9000,segments:12},scene);s.material=m;s.infiniteDistance=true;s.isPickable=false;return s;}
 function buildSky(scene,b){const B=BABYLON,[top,midc,hor]=b.sky,t=dyn(scene,'sky',16,256,(c,w,h)=>{const gr=c.createLinearGradient(0,0,0,h);gr.addColorStop(0,top);gr.addColorStop(.38,midc);gr.addColorStop(.5,hor);gr.addColorStop(.62,b.fog[0]);gr.addColorStop(1,b.fog[0]);c.fillStyle=gr;c.fillRect(0,0,w,h);});
  const m=new B.StandardMaterial('ls-sky',scene);m.emissiveTexture=t;m.diffuseColor=B.Color3.Black();m.specularColor=B.Color3.Black();m.disableLighting=true;m.backFaceCulling=false;m.fogEnabled=false;
  const s=B.MeshBuilder.CreateSphere('ls-sky',{diameter:8000,segments:16},scene);s.material=m;s.infiniteDistance=true;s.isPickable=false;return s;}
 // the cloud deck: three soft layers the descent falls through (and the ascent punches up through)
 function buildClouds(scene,b,q){const B=BABYLON,t=dyn(scene,'cloud',512,512,(c,w,h)=>{const r=rng(77);c.clearRect(0,0,w,h);for(let i=0;i<(q==='low'?140:260);i++){const x=r()*w,y=r()*h,rad=20+r()*70,gr=c.createRadialGradient(x,y,0,x,y,rad);gr.addColorStop(0,'rgba(255,255,255,'+(.18+r()*.22)+')');gr.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=gr;
    for(const dx of [-w,0,w])for(const dy of [-h,0,h]){c.save();c.translate(dx,dy);c.fillRect(x-rad,y-rad,rad*2,rad*2);c.restore();}}},true);
  const layers=[];[[1000,1],[1090,1.4],[1190,.8]].forEach(([y,s],i)=>{const m=new B.StandardMaterial('ls-cloud'+i,scene);m.diffuseTexture=t;m.useAlphaFromDiffuseTexture=true;m.diffuseColor=B.Color3.Black();m.specularColor=B.Color3.Black();
   m.emissiveColor=B.Color3.FromHexString(i===0?b.cloudGlow:b.clouds);m.disableLighting=true;m.backFaceCulling=false;m.alpha=.95;
   const p=B.MeshBuilder.CreateGround('ls-cloud'+i,{width:9000,height:9000},scene);p.position.set(b.at[0],y,b.at[1]);p.material=m;p.isPickable=false;t.uScale=t.vScale=6;p.rotation.y=i*.7;layers.push(p);});return layers;}
 // ---- instancing: one box mesh per material / size class, each building a thin instance ----
 function batcher(scene,q){const B=BABYLON,groups=new Map(),meshes=[],own=[];
  function add(key,mat,uvw,uvh,m){let gr=groups.get(key);if(!gr){gr={mat,uvw,uvh,list:[]};groups.set(key,gr);}gr.list.push(m);}
  function mesa(key,mat,x,z,w,h,d,yaw=0){let gr=groups.get('m|'+key);if(!gr){gr={mat,uvw:[1,1],uvh:1,list:[],mesa:true};groups.set('m|'+key,gr);}gr.list.push({x,y:h/2,z,w,h,d,yaw});}
  function box(key,mat,x,y,z,w,h,d,yaw=0,tile=null){const t=tile||[0,0],qw=t[0]?Math.max(1,Math.round(w/t[0]*4)/4):1,qh=t[1]?Math.max(1,Math.round(h/t[1]*4)/4):1,qd=t[0]?Math.max(1,Math.round(d/t[0]*4)/4):1;
   const k=key+(t[0]?'|'+qw+'|'+qh+'|'+qd:'');add(k,mat,[qw,qd],qh,{x,y,z,w,h,d,yaw});}
  function build(){for(const [key,gr] of groups){const [uw,ud]=gr.uvw,side=a=>new B.Vector4(0,0,a,gr.uvh),cap=new B.Vector4(0,0,.01,.01);
   const mesh=gr.mesa?B.MeshBuilder.CreateCylinder('ls-m-'+key,{diameterTop:.42,diameterBottom:1,height:1,tessellation:9},scene):B.MeshBuilder.CreateBox('ls-b-'+key,{size:1,faceUV:[side(uw),side(uw),side(ud),side(ud),cap,cap],wrap:true},scene);mesh.material=gr.mat;mesh.isPickable=false;
   const buf=new Float32Array(gr.list.length*16),S=new B.Vector3(),T=new B.Vector3(),R=new B.Quaternion();
   gr.list.forEach((b,i)=>{S.set(b.w,b.h,b.d);T.set(b.x,b.y,b.z);B.Quaternion.RotationYawPitchRollToRef(b.yaw||0,0,0,R);B.Matrix.Compose(S,R,T).copyToArray(buf,i*16);});
   mesh.thinInstanceSetBuffer('matrix',buf,16,true);mesh.thinInstanceRefreshBoundingInfo(false);mesh.freezeWorldMatrix();meshes.push(mesh);}groups.clear();return meshes;}
  return {box,mesa,build,meshes,own};}
 function glowMat(scene,name,hexc,k=1){const B=BABYLON,m=new B.StandardMaterial('ls-'+name,scene);m.diffuseColor=B.Color3.Black();m.specularColor=B.Color3.Black();m.emissiveColor=B.Color3.FromHexString(hexc).scale(k);m.disableLighting=true;return m;}
 function litMat(scene,name,hexc,{spec=.04,emit=0}={}){const B=BABYLON,m=new B.StandardMaterial('ls-'+name,scene);m.diffuseColor=B.Color3.FromHexString(hexc);m.specularColor=new B.Color3(spec,spec,spec);if(emit)m.emissiveColor=B.Color3.FromHexString(hexc).scale(emit);return m;}
 // the ambientCG night facades the walkable city uses (CC0, assets/textures/ncz): the face, darkened, with its own lit windows. tile = metres one copy covers (wide, high)
 function facades(scene){const B=BABYLON,acg=n=>{const t=new B.Texture(new URL('assets/textures/ncz/'+n+'.jpg',base).href,scene,false,true);t.wrapU=t.wrapV=B.Texture.WRAP_ADDRESSMODE;return t;};
  return [['office',[28,34]],['apartment',[40,52]],['glass',[30,36]]].map(([n,tile])=>{const m=new B.StandardMaterial('ls-facade-'+n,scene);m.diffuseTexture=acg('facade-'+n+'-color');m.emissiveTexture=acg('facade-'+n+'-glow');m.diffuseColor=new B.Color3(.2,.2,.24);m.specularColor=new B.Color3(.05,.05,.06);m.metadata={tile};return m;});}
 // ---- NEOCHINATOWN from the air ----
 function buildCity(scene,b,q){const B=BABYLON,N=root.VoidNeoChinatown,plan=cityPlan(N,root.VoidContainers,root.VoidCorporate,q),low=q==='low',high=q==='high'||q==='ultra',bt=batcher(scene,q),F=facades(scene),t0=performance.now();
  // the ground: the city's real streets painted from neochinatown.js (wet asphalt lit by the street lamps and the shop fronts), the Port pad, the alley's glow, the gates
  const [X0,X1,Z0,Z1]=plan.box,M=8,GX0=X0-M,GX1=X1+M,GZ0=Z0-M,GZ1=Z1+M,TW=low?1024:2048,TH=Math.round(TW*(GZ1-GZ0)/(GX1-GX0)),sx=TW/(GX1-GX0),sz=TH/(GZ1-GZ0);
  const P=(x,z)=>[(x-GX0)*sx,(GZ1-z)*sz],RR=(c,[x0,x1,z0,z1],fill)=>{const [a,b2]=P(x0,z1),[e,f]=P(x1,z0);c.fillStyle=fill;c.fillRect(a,b2,e-a,f-b2);};
  const ground=dyn(scene,'city-ground',TW,TH,(c,w,h)=>{const r=rng(31);c.fillStyle='#07080b';c.fillRect(0,0,w,h);
   for(const [id,s] of Object.entries(plan.streets))RR(c,s,/^back-/.test(id)?'#17151b':id==='pad'?'#2a2b30':/outskirts/.test(id)?'#211c16':['avenue','main','farSouth'].includes(id)?'#211d26':'#1b1820');
   // lane lines on the road streets
   c.strokeStyle='rgba(170,160,120,.28)';c.lineWidth=Math.max(1,sx*.15);c.setLineDash([sx*3,sx*4]);for(const id of ['avenue','main','farSouth','road']){const s=plan.streets[id];if(!s)continue;const [x0,x1,z0,z1]=s;c.beginPath();if(x1-x0>z1-z0){const [a,y]=P(x0,(z0+z1)/2),[e]=P(x1,0);c.moveTo(a,y);c.lineTo(e,y);}else{const [x,y]=P((x0+x1)/2,z1),[,y2]=P(0,z0);c.moveTo(x,y);c.lineTo(x,y2);}c.stroke();}c.setLineDash([]);
   c.globalCompositeOperation='lighter';
   const pool=(x,z,rad,col,a)=>{const [u,v]=P(x,z),R2=rad*sx,gr=c.createRadialGradient(u,v,0,u,v,R2),[cr,cg,cb]=hex(col);gr.addColorStop(0,'rgba('+cr+','+cg+','+cb+','+a+')');gr.addColorStop(1,'rgba('+cr+','+cg+','+cb+',0)');c.fillStyle=gr;c.fillRect(u-R2,v-R2,R2*2,R2*2);};
   for(const l of plan.lamps){pool(l.x,l.z,8,'#ffb066',.7);pool(l.x,l.z,2.2,'#fff0d0',.9);}
   for(const s of plan.strips)pool(s.x,s.z,4,s.c,.22);
   for(const s of plan.signs)pool(s.x,s.z,6,s.c,.5);
   // the District alley: its signs and doorways wash the wet ground magenta and violet (the District's door is on its south side)
   {const a=plan.streets.alley;if(a)for(let x=a[0]+3;x<a[1];x+=5)pool(x,(a[2]+a[3])/2+(r()-.5)*3,4.5,r()<.5?'#ff3fb4':'#8b5cff',.26);pool(N.door.x,N.door.z+1.5,7,'#ff3fb4',.45);}
   // the Port pad: markings, edge lights and PAD 01
   {const p=plan.streets.pad;const [a,b2]=P(p[0]+1.5,p[3]-1.5),[e,f]=P(p[1]-1.5,p[2]+1.5);c.strokeStyle='rgba(255,196,80,.85)';c.lineWidth=Math.max(1.5,sx*.3);c.strokeRect(a,b2,e-a,f-b2);
    const [cx,cy]=P(b.at[0],b.at[1]);c.beginPath();c.arc(cx,cy,6*sx,0,7);c.stroke();c.beginPath();c.arc(cx,cy,4.4*sx,0,7);c.stroke();c.fillStyle='rgba(255,196,80,.85)';c.font='bold '+Math.round(4*sx)+'px monospace';c.textAlign='center';c.textBaseline='middle';c.fillText('01',cx+8.5*sx,cy);
    for(let x=p[0]+1;x<=p[1]-1;x+=3){pool(x,p[2]+.8,1.6,'#ffc04d',.6);pool(x,p[3]-.8,1.6,'#ffc04d',.6);}pool(b.at[0],b.at[1],9,'#ffcf8a',.16);}
   for(const gt of plan.gates)pool((gt.rect[0]+gt.rect[1])/2,(gt.rect[2]+gt.rect[3])/2,7,'#ffb347',.35);
   c.globalCompositeOperation='source-over';});
  const gm=new B.StandardMaterial('ls-city-ground',scene);gm.diffuseColor=B.Color3.Black();gm.specularColor=new B.Color3(.18,.18,.22);gm.specularPower=48;gm.emissiveTexture=ground;
  const gp=B.MeshBuilder.CreateGround('ls-city-ground',{width:GX1-GX0,height:GZ1-GZ0},scene);gp.position.set((GX0+GX1)/2,0,(GZ0+GZ1)/2);gp.material=gm;gp.isPickable=false;
  // the land beyond: the megacity's lit street grid out to the horizon (tiled)
  const far=dyn(scene,'far-grid',512,512,(c,w,h)=>{const r=rng(9);c.fillStyle='#07080b';c.fillRect(0,0,w,h);c.globalCompositeOperation='lighter';
   // blocks of lit roofs and courtyards between sodium-lit streets, the odd neon square
   for(let by=0;by<h;by+=32)for(let bx=0;bx<w;bx+=32){const k=r();c.fillStyle='rgba('+(40+k*50|0)+','+(30+k*30|0)+','+(28+k*20|0)+',1)';c.fillRect(bx+5,by+5,22,22);for(let i=0;i<9;i++){c.fillStyle=r()<.85?'rgba(255,196,130,'+(.4+r()*.6)+')':r()<.5?'rgba(255,70,180,.9)':'rgba(80,210,255,.9)';c.fillRect(bx+6+r()*19,by+6+r()*19,2,2);}}
   for(let i=0;i<=16;i++){const y=i*32;c.fillStyle='rgba(255,165,80,.75)';c.fillRect(0,y,w,3);c.fillRect(y,0,3,h);}
   for(let i=0;i<4;i++){const y=(i*128+64);c.fillStyle='rgba(255,190,110,.9)';c.fillRect(0,y,w,5);c.fillRect(y,0,5,h);}});far.uScale=far.vScale=30;far.level=.5;
  const fm=new B.StandardMaterial('ls-far',scene);fm.diffuseColor=B.Color3.Black();fm.specularColor=B.Color3.Black();fm.emissiveTexture=far;fm.disableLighting=true;
  const fg=B.MeshBuilder.CreateGround('ls-far',{width:9000,height:9000},scene);fg.position.set(plan.centre[0],-.6,plan.centre[1]);fg.material=fm;fg.isPickable=false;
  // the buildings (each a thin instance of its size class's box)
  const fac=k=>F[k%3],tile=k=>F[k%3].metadata.tile;
  for(const p of plan.plots)bt.box('f'+p.k,fac(p.k),(p.x0+p.x1)/2,p.h/2,(p.z0+p.z1)/2,p.x1-p.x0-.24,p.h,p.z1-p.z0-.24,0,tile(p.k));
  for(const p of plan.ring)bt.box('f'+p.k,fac(p.k),(p.x0+p.x1)/2,p.h/2,(p.z0+p.z1)/2,p.x1-p.x0,p.h,p.z1-p.z0,0,tile(p.k));
  for(const p of plan.mid)bt.box('f'+p.k,fac(p.k),(p.x0+p.x1)/2,p.h/2,(p.z0+p.z1)/2,p.x1-p.x0,p.h,p.z1-p.z0,0,tile(p.k));
  // roofs: dark, with the odd rooftop plant box (the facade textures' corners are not roof material)
  const roof=litMat(scene,'roof','#16171b',{emit:.04}),plant=litMat(scene,'plant','#2a2b30',{emit:.05}),rr=rng(44);
  for(const p of [...plan.plots,...plan.ring,...plan.mid]){const w=p.x1-p.x0,d=p.z1-p.z0,cx=(p.x0+p.x1)/2,cz=(p.z0+p.z1)/2;bt.box('roof',roof,cx,p.h+.06,cz,w-.1,.14,d-.1);if(rr()<.45)bt.box('plant',plant,cx+(rr()-.5)*w*.5,p.h+.8,cz+(rr()-.5)*d*.5,1.6+rr()*2,1.6,1.4+rr()*2);}
  for(const t of plan.towers){bt.box('roof',roof,t.x,t.h+6.1,t.z,t.w*.6,.14,t.d*.6);}
  for(const t of plan.towers){bt.box('f'+t.k,fac(t.k),t.x,t.h/2,t.z,t.w,t.h,t.d,0,tile(t.k));bt.box('f'+((t.k+1)%3),fac(t.k+1),t.x,t.h+3,t.z,t.w*.6,6,t.d*.6,0,tile(t.k+1));}
  // landmarks: the District (brick, its rooftop plant and the violet wash from its alley), the roof terrace's building, Milked
  const brick=litMat(scene,'brick','#2a1d1a',{emit:.12});const brickT=new B.Texture(new URL('assets/textures/ncz/brick-color.jpg',base).href,scene);brick.diffuseTexture=brickT;brick.emissiveColor=new B.Color3(.05,.035,.04);
  for(const l of plan.landmarks){const [x0,x1,z0,z1]=l.r;bt.box('lm-'+l.id,l.id==='district'?brick:fac(1),(x0+x1)/2,l.h/2,(z0+z1)/2,x1-x0,l.h,z1-z0,0,l.id==='district'?null:tile(1));}
  // the Corporate District: its blocks to the west, glass and steel, beyond the haze (no fog on them so they still read; their light is dimmed instead)
  const corpMat=F[2].clone('ls-corp');corpMat.fogEnabled=false;corpMat.emissiveColor=B.Color3.Black();corpMat.diffuseColor=B.Color3.Black();corpMat.disableLighting=true;
  for(const c of plan.corp)bt.box('corp',corpMat,(c.x0+c.x1)/2,c.h/2,(c.z0+c.z1)/2,c.x1-c.x0,c.h,c.z1-c.z0,0,tile(2));
  for(const c of plan.corp)bt.box('roof',roof,(c.x0+c.x1)/2,c.h+.06,(c.z0+c.z1)/2,c.x1-c.x0-.1,.14,c.z1-c.z0-.1);
  // the Outskirts' container homes
  const paints=new Map();for(const h of plan.homes){if(!paints.has(h.paint)){const m=litMat(scene,'paint'+paints.size,h.paint,{emit:.06});paints.set(h.paint,m);}bt.box('home-'+h.paint,paints.get(h.paint),h.x,h.y+h.h/2,h.z,h.w,h.h,h.d);}
  // the gates: small checkpoint buildings with amber lamps
  const gateMat=litMat(scene,'gate','#3a3d42',{emit:.08});for(const gt of plan.gates){const [x0,x1,z0,z1]=gt.rect;bt.box('gate',gateMat,(x0+x1)/2,2.6,(z0+z1)/2,x1-x0,5.2,z1-z0);}
  // lights: shop-front strips, blade signs, street lamps, tower beacons
  const cols=new Map(),gl=(c,k=1)=>{const key=c+k;if(!cols.has(key))cols.set(key,glowMat(scene,'g'+cols.size,c,k));return cols.get(key);};
  for(const s of plan.strips)bt.box('strip'+s.c,gl(s.c,.5),s.x,s.y,s.z,s.along==='x'?s.len:.12,.14,s.along==='x'?.12:s.len);
  for(const s of plan.signs)bt.box('sign'+s.c,gl(s.c,1.15),s.x,s.y,s.z,s.along==='x'?1.4:.3,s.h,s.along==='x'?.3:1.4);
  for(const l of plan.lamps)bt.box('lamp',gl('#ffc27a',1.6),l.x,6.2,l.z,.9,.25,.9);
  const beacons=[];for(const t of plan.towers)if(t.beacon)beacons.push([t.x,t.h+9,t.z]);for(const c of plan.corp)beacons.push([(c.x0+c.x1)/2,c.h+4,(c.z0+c.z1)/2]);
  const red=glowMat(scene,'beacon','#ff2a20',1.6);for(const p of beacons)bt.box('beacon',red,p[0],p[1],p[2],1.4,1.4,1.4);
  // the megacity's giant ad screens (abstract colour fields: no invented brands or words), facing the city
  const ads=[];{const tex=dyn(scene,'ads',256,512,(c,w,h)=>{const r=rng(5);for(let i=0;i<4;i++){const y=i*h/4,gr=c.createLinearGradient(0,y,w,y+h/4);gr.addColorStop(0,['#ff3fb4','#35d8ff','#ffb347','#8b5cff'][i]);gr.addColorStop(1,['#3a0a40','#062a3a','#3a1a06','#120a3a'][i]);c.fillStyle=gr;c.fillRect(0,y,w,h/4);
     c.fillStyle='rgba(255,255,255,.18)';for(let k=0;k<6;k++)c.fillRect(r()*w,y+r()*h/4,20+r()*90,3+r()*10);}});
   const am=new B.StandardMaterial('ls-ad',scene);am.diffuseColor=B.Color3.Black();am.specularColor=B.Color3.Black();am.emissiveTexture=tex;am.disableLighting=true;am.backFaceCulling=false;
   for(const t of plan.towers)if(t.screen){const p=B.MeshBuilder.CreatePlane('ls-ad',{width:t.w*.8,height:Math.min(60,t.h*.25)},scene);const a=Math.atan2(plan.centre[0]-t.x,plan.centre[1]-t.z);p.rotation.y=a+Math.PI;
    p.position.set(t.x+Math.sin(a)*(Math.max(t.w,t.d)/2+.3),t.h*.62,t.z+Math.cos(a)*(Math.max(t.w,t.d)/2+.3));p.material=am;p.isPickable=false;ads.push(p);}}
  bt.build();
  // light in the wet air: a soft glow round every lamp, sign and shop front (billboard sprites, one draw call), so the streets read as lit lines from the air
  {
   const list=[];const add=(x,y,z,size,col,a)=>{const [r,g2,bb]=hex(col);list.push([x,y,z,size,r/255,g2/255,bb/255,a]);};
   for(const l of plan.lamps)add(l.x,6,l.z,5,'#ffb066',.45);
   for(const s of plan.signs)add(s.x,s.y,s.z,3.2,s.c,.4);
   {const a=plan.streets.alley;if(a)for(let x=a[0]+2;x<a[1];x+=4)add(x,4,(a[2]+a[3])/2,4.5,x%8<4?'#ff3fb4':'#8b5cff',.4);add(N.door.x,3,N.door.z+1.5,5,'#ff3fb4',.6);}
   {const p=plan.streets.pad;for(let x=p[0]+1;x<=p[1]-1;x+=3){add(x,.6,p[2]+.8,2,'#ffc04d',.6);add(x,.6,p[3]-.8,2,'#ffc04d',.6);}}
   for(const gt of plan.gates)add((gt.rect[0]+gt.rect[1])/2,6,(gt.rect[2]+gt.rect[3])/2,4,'#ffb347',.4);
   // each glow: three crossed soft planes (seen from any side and from above), thin instances per colour, added light
   const gt=dyn(scene,'glow',64,64,(c,w,h)=>{const gr=c.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.22,'rgba(255,255,255,.4)');gr.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=gr;c.fillRect(0,0,w,h);},true);
   const parts=[0,1,2].map(i=>{const m=B.MeshBuilder.CreatePlane('ls-gp',{size:1,sideOrientation:B.Mesh.DOUBLESIDE},scene);if(i===0)m.rotation.x=Math.PI/2;else m.rotation.y=i===1?0:Math.PI/2;m.bakeCurrentTransformIntoVertices();return m;});
   const proto=B.Mesh.MergeMeshes(parts,true,true);proto.setEnabled(false);const groups=new Map();
   for(const [x,y,z,size,r,g2,bb,a] of list){const key=(r*255|0)+','+(g2*255|0)+','+(bb*255|0)+','+a;if(!groups.has(key))groups.set(key,{c:[r*a,g2*a,bb*a],items:[]});groups.get(key).items.push([x,y,z,size]);}
   for(const [key,gr] of groups){const m=new B.StandardMaterial('ls-gl'+key,scene);m.diffuseColor=B.Color3.Black();m.specularColor=B.Color3.Black();m.opacityTexture=gt;m.emissiveColor=new B.Color3(gr.c[0],gr.c[1],gr.c[2]);m.disableLighting=true;m.alphaMode=B.Constants.ALPHA_ADD;m.backFaceCulling=false;m.disableDepthWrite=true;
    const mesh=proto.clone('ls-glows');mesh.setEnabled(true);mesh.material=m;mesh.isPickable=false;
    const buf=new Float32Array(gr.items.length*16);gr.items.forEach(([x,y,z,sz],i)=>B.Matrix.Compose(new B.Vector3(sz,sz,sz),B.Quaternion.Identity(),new B.Vector3(x,y,z)).copyToArray(buf,i*16));mesh.thinInstanceSetBuffer('matrix',buf,16,true);mesh.thinInstanceRefreshBoundingInfo(false);}}
  // the haze over the District alley (a soft violet light standing in the wet air)
  const haze=dyn(scene,'haze',64,64,(c,w,h)=>{const gr=c.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);gr.addColorStop(0,'rgba(255,90,200,.55)');gr.addColorStop(1,'rgba(255,90,200,0)');c.fillStyle=gr;c.fillRect(0,0,w,h);},true);
  const hm=new B.StandardMaterial('ls-haze',scene);hm.diffuseColor=B.Color3.Black();hm.specularColor=B.Color3.Black();hm.emissiveTexture=haze;hm.opacityTexture=haze;hm.disableLighting=true;hm.alphaMode=B.Constants.ALPHA_ADD;hm.backFaceCulling=false;
  {const a=plan.streets.alley;if(a){const p=B.MeshBuilder.CreatePlane('ls-haze',{width:a[1]-a[0]+20,height:22},scene);p.billboardMode=B.Mesh.BILLBOARDMODE_Y;p.position.set((a[0]+a[1])/2,8,(a[2]+a[3])/2);p.material=hm;p.isPickable=false;}}
  // the Port's approach lights: blink in turn toward the pad
  const strobe=glowMat(scene,'strobe','#fff1c4',2);const strobes=[];for(let i=0;i<7;i++){const s=B.MeshBuilder.CreateBox('ls-strobe',{size:.7},scene);s.position.set(b.at[0]+14+i*4.5,.5,b.at[1]);s.material=strobe;s.isPickable=false;strobes.push(s);}
  return {plan,tick(t){strobes.forEach((s,i)=>s.setEnabled(((t*6-i)%7+7)%7<1.2));red.emissiveColor.set(1.6*(.35+.65*(Math.sin(t*3)>0)),.42*(Math.sin(t*3)>0),.3*(Math.sin(t*3)>0));},built:performance.now()-t0,instances:plan.plots.length+plan.ring.length+plan.mid.length+plan.towers.length};}
 // ---- the other landing areas (cheap, from their walkable scenes' layouts) ----
 function scatter(seed,n,R,skip){const r=rng(seed),out=[];for(let i=0;i<n*3&&out.length<n;i++){const a=r()*Math.PI*2,d=Math.sqrt(r())*R,x=Math.sin(a)*d,z=Math.cos(a)*d;if(!skip(x,z))out.push([x,z,r(),r(),r()]);}return out;}
 function terrain(scene,b,colA,colB,seed,size=6000){const B=BABYLON,t=dyn(scene,'terrain',512,512,(c,w,h)=>{const n=noise2(w,h,seed,5),img=c.createImageData(w,h),d=img.data,A=hex(colA),Bc=hex(colB);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const v=n(x/w,y/h),i=(y*w+x)*4;const gr2=((x*7919+y*104729)%97)/97*.12;for(let k=0;k<3;k++)d[i+k]=lerp(A[k],Bc[k],clamp(v*1.3-.15+gr2));d[i+3]=255;}c.putImageData(img,0,0);});t.uScale=t.vScale=24;
  const m=new B.StandardMaterial('ls-terrain',scene);m.diffuseTexture=t;m.specularColor=B.Color3.Black();if(b.light==='night')m.emissiveColor=B.Color3.FromHexString(colB).scale(.3);
  const gnd=B.MeshBuilder.CreateGround('ls-terrain',{width:size,height:size},scene);gnd.position.set(b.at[0],-.05,b.at[1]);gnd.material=m;gnd.isPickable=false;return gnd;}
 function buildPad(scene,b,col,lights){const B=BABYLON,m=litMat(scene,'pad','#3a3f44',{emit:b.light==='night'?.25:0});const p=B.MeshBuilder.CreateCylinder('ls-pad',{diameter:14,height:.2,tessellation:36},scene);p.position.set(b.at[0],.1,b.at[1]);p.material=m;
  const ring=B.MeshBuilder.CreateTorus('ls-pad-ring',{diameter:11,thickness:.25,tessellation:48},scene);ring.position.set(b.at[0],.22,b.at[1]);ring.material=glowMat(scene,'pad-ring',col,lights?.55:.4);return p;}
 function buildVantor(scene,b,q){const B=BABYLON,bt=batcher(scene,q);terrain(scene,b,'#2a140c','#6a3a22',61);
  // mars-terminal (exploration-data.js): the airlock pair, the concourse and industry halls, pressure control; built at the surface as the access complex's head
  const concrete=litMat(scene,'concrete','#4a4440',{emit:.05}),steel=litMat(scene,'steel','#3a3a3e',{emit:.05}),amber=glowMat(scene,'sodium','#ffae4a',1.3),warn=glowMat(scene,'warn','#ff5a2a',1.4);
  for(const s of (root.VoidExplorationData?.locations?.['mars-terminal']?.solids||[])){bt.box('vc',concrete,s.position[0],s.size[1]/2,s.position[2],s.size[0],s.size[1],s.size[2]);bt.box('va',amber,s.position[0],s.size[1]+.15,s.position[2],s.size[0]*.9,.15,.25);}
  // the shaft down to the underground city: a wide lit ring north of the airlocks, vent stacks, pipe runs, sodium masts
  const shaft=B.MeshBuilder.CreateCylinder('ls-shaft',{diameter:46,height:3,tessellation:48},scene);shaft.position.set(0,1.5,46);shaft.material=steel;const hole=B.MeshBuilder.CreateCylinder('ls-hole',{diameter:40,height:3.2,tessellation:48},scene);hole.position.set(0,1.6,46);hole.material=glowMat(scene,'deep','#120604',1);
  const rim=B.MeshBuilder.CreateTorus('ls-rim',{diameter:43,thickness:.6,tessellation:64},scene);rim.position.set(0,3.2,46);rim.material=amber;
  const r=rng(8);for(let i=0;i<10;i++){const a=i/10*Math.PI*2,x=Math.sin(a)*34,z=46+Math.cos(a)*34,h=10+r()*18;bt.box('vs',steel,x,h/2,z,2.4,h,2.4);bt.box('vw',warn,x,h+.6,z,.9,.9,.9);}
  for(let i=0;i<14;i++){bt.box('vp',steel,-60+i*9,1.2,-6+(i%2)*3,8.6,.8,.8);}for(let i=0;i<12;i++){const x=-36+(i%6)*14,z=i<6?-40:12;bt.box('vm',steel,x,7,z,.4,14,.4);bt.box('va',amber,x,14.2,z,1.6,.3,.6);}
  // mesas on the horizon and a scatter of rock
  const rock=litMat(scene,'rock','#4a2616',{emit:.08});for(const [x,z,a,c] of scatter(19,q==='low'?20:40,1600,(x,z)=>Math.hypot(x,z)<220)){const h=30+a*120,w=90+c*260;bt.mesa('vr',rock,b.at[0]+x,b.at[1]+z,w,h,w*.7,a*3);}
  bt.build();buildPad(scene,b,'#ffae4a',true);return {tick(){}};}
 function buildNexus(scene,b,q){const B=BABYLON,bt=batcher(scene,q),L=root.VoidPlanets?.layout('nexus');terrain(scene,b,'#5b6770','#7d8a93',23);
  const white=litMat(scene,'shell','#d6dde2'),grey=litMat(scene,'grey','#8e9aa3'),dark=litMat(scene,'dark','#2b3238'),cyan=glowMat(scene,'cyan','#7fe6ff',1);
  for(const s of (L?.solids||[]))bt.box('ns',s.id==='core'?white:grey,s.position[0],s.size[1]/2,s.position[2],s.size[0],s.size[1],s.size[2]);
  // the core (planets.js): the vast data hall, its upper tier and the broken spire
  bt.box('nw',white,0,11,37,28,22,14);bt.box('nw',white,0,27,37,20,10,10);for(let i=-3;i<=3;i++)bt.box('nc',i%2?dark:cyan,i*4,11,29.9,.4,20,.2);
  const sp=B.MeshBuilder.CreateCylinder('ls-spire',{diameterTop:3.2,diameterBottom:8,height:34,tessellation:24},scene);sp.position.set(0,49,38);sp.material=white;
  const cap=B.MeshBuilder.CreateCylinder('ls-spire-break',{diameterTop:1.2,diameterBottom:3.6,height:8,tessellation:16},scene);cap.position.set(1.8,67,38);cap.rotation.z=.55;cap.material=grey;
  // the ruined tech city round the plaza: pale towers, most of their light gone, a few cyan seams still burning
  for(const [x,z,a,c,e] of scatter(31,q==='low'?90:180,1400,(x,z)=>Math.hypot(x,z+10)<80||z<-29&&Math.abs(x+4-(z+29)*Math.tan(.3))<70)){const h=12+a*a*110,w=12+c*22;bt.box('nt',e<.5?white:grey,x,h/2,z,w,h,w*(.7+e*.5));if(c<.35)bt.box('nn',cyan,x+w/2+.1,h*.5,z,.2,h*.6,.3);if(a>.85)bt.box('nk',dark,x,h+1,z,w*.6,2,w*.4);}
  bt.build();buildPad(scene,b,'#7fe6ff',false);return {tick(){}};}
 function buildOrder(scene,b,q){const B=BABYLON,bt=batcher(scene,q),L=root.VoidPlanets?.layout('order-homeworld');
  // fields: a patchwork of crops, gold and green, with lanes between them
  const t=dyn(scene,'fields',1024,1024,(c,w,h)=>{const r=rng(12);c.fillStyle='#5c5236';c.fillRect(0,0,w,h);const s=64;for(let y=0;y<h;y+=s)for(let x=0;x<w;x+=s){c.fillStyle=['#6f8a3a','#8a8a3e','#b59a4a','#5f7a34','#7a6a3a','#91a04a'][Math.floor(r()*6)];c.fillRect(x+3,y+3,s-6,s-6);c.strokeStyle='rgba(0,0,0,.12)';c.lineWidth=1;for(let k=6;k<s-6;k+=5){c.beginPath();c.moveTo(x+3,y+k);c.lineTo(x+s-3,y+k);c.stroke();}}});t.uScale=t.vScale=4;
  const fm=new B.StandardMaterial('ls-fields',scene);fm.diffuseTexture=t;fm.specularColor=B.Color3.Black();const fg=B.MeshBuilder.CreateGround('ls-fields',{width:6000,height:6000},scene);fg.position.set(b.at[0],-.05,b.at[1]);fg.material=fm;fg.isPickable=false;
  const wood=litMat(scene,'wood','#6b4a2e'),red=litMat(scene,'barn','#7a2e22'),metal=litMat(scene,'metal','#9a9a92',{spec:.2}),panel=litMat(scene,'solar','#1d2a44',{spec:.5}),tree=litMat(scene,'tree','#2f4a24');
  for(const s of (L?.solids||[])){if(s.id==='silos'){for(const dx of [-2.5,2.5]){const c=B.MeshBuilder.CreateCylinder('ls-silo',{diameter:4.4,height:s.size[1]+3,tessellation:20},scene);c.position.set(s.position[0]+dx,(s.size[1]+3)/2,s.position[2]);c.material=metal;}continue;}
   bt.box('os',s.id==='barn'?red:wood,s.position[0],s.size[1]/2,s.position[2],s.size[0],s.size[1],s.size[2]);bt.box('or',metal,s.position[0],s.size[1]+.3,s.position[2],s.size[0]+.6,.6,s.size[2]+.6);}
  // farmsteads, solar arrays and windbreaks out to the horizon
  for(const [x,z,a,c] of scatter(41,q==='low'?40:80,1600,(x,z)=>Math.hypot(x,z)<60)){if(a<.4){bt.box('ob',c<.5?red:wood,x,3,z,10+c*8,6,8);bt.box('or',metal,x,6.3,z,11+c*8,.6,9);}else if(a<.7){for(let i=0;i<6;i++)bt.box('op',panel,x+i*5,1.1,z,4,.2,9,0);}else{for(let i=0;i<10;i++)bt.box('ot',tree,x+i*7,5,z,4.5,10,4.5);}}
  bt.build();buildPad(scene,b,'#c9a24a',false);return {tick(){}};}
 function buildSurveyPad(scene,b){
  const ground=BABYLON.MeshBuilder.CreateGround('survey-ground',{width:6000,height:6000},scene);
  const material=new BABYLON.StandardMaterial('survey-ground',scene);
  material.diffuseColor=BABYLON.Color3.FromHexString('#4c4946');ground.material=material;
  buildPad(scene,b,'#909da2',false);return {tick(){}};
 }
 function buildVesper(scene,b,q){const B=BABYLON,bt=batcher(scene,q);terrain(scene,b,'#a88a64','#d1b38a',5);
  const metal=litMat(scene,'shed','#7a6a58'),rust=litMat(scene,'rust','#8a4a2a'),rock=litMat(scene,'ridge','#b0916a');
  // the Ward Freight workshop (opening-scene.js): sheds and a yard around the Kestrel's stand; ridges all round
  bt.box('vw',metal,-6,4,8,24,8,14);bt.box('vw',rust,-6,8.4,8,25,.8,15);bt.box('vw',metal,22,3,-6,12,6,10);for(let i=0;i<8;i++)bt.box('vc',rust,-20+i*3.2,1.3,-20,2.6,2.6,6);
  for(const [x,z,a,c] of scatter(17,q==='low'?24:48,1700,(x,z)=>Math.hypot(x,z)<200)){const h=40+a*160,w=140+c*300;bt.mesa('vr',rock,b.at[0]+x,b.at[1]+z,w,h,w*.6,a*3);}
  bt.build();buildPad(scene,b,'#d4bd87',false);return {tick(){}};}
 // ---- one sequence's scene ----
 function create(engine,id,kind){const B=BABYLON,b=biome(id),q=Q(),scene=new B.Scene(engine);scene.clearColor=new B.Color4(0,0,0,1);scene.autoClear=true;scene.skipPointerMovePicking=true;
  const cam=new B.FreeCamera('ls-cam',new B.Vector3(0,10,0),scene);cam.inputs.clear();cam.minZ=.5;cam.maxZ=7000;cam.fov=.95;scene.activeCamera=cam;
  const hemi=new B.HemisphericLight('ls-hemi',new B.Vector3(0,1,0),scene),sun=new B.DirectionalLight('ls-sun',new B.Vector3(-.6,-.5,.4),scene);
  const ip=scene.imageProcessingConfiguration;ip.contrast=1.25;ip.exposure=b.light==="night"?1.45:1;ip.vignetteEnabled=true;ip.vignetteWeight=1.6;ip.vignetteColor=new B.Color4(0,0,0,0);
  const stars=buildStars(scene,q),orbit=buildPlanet(scene,b,q),sky=buildSky(scene,b),clouds=buildClouds(scene,b,q);
  const area=b.id==='cinder-landing'?buildSurveyPad(scene,b):b.id==='neochinatown'?buildCity(scene,b,q):b.id==='vantor'?buildVantor(scene,b,q):b.id==='nexus'?buildNexus(scene,b,q):b.id==='order'?buildOrder(scene,b,q):buildVesper(scene,b,q);
  let glow=null;if(q!=='low'){try{glow=new B.GlowLayer('ls-glow',scene,{mainTextureRatio:q==='medium'?.25:.4,blurKernelSize:q==='medium'?24:40});glow.intensity=b.light==='night'?.75:.35;}catch{glow=null;}}
  const cityMeshes=scene.meshes.filter(m=>m!==stars&&m!==sky&&!clouds.includes(m)&&!orbit.root.getChildMeshes().includes(m));
  // orbit geometry: the camera's line in and the sun (night landings come in over the dark side with a lit crescent; day landings over the lit side)
  const dirIn=new B.Vector3(.62,.42,-.66).normalize(),side=B.Vector3.Cross(dirIn,B.Vector3.Up()).normalize(),sunDir=b.orbit.night?dirIn.scale(.25).add(side.scale(.97)).normalize():dirIn.scale(-.55).add(side.scale(.8)).normalize();
  let space=null;
  function setSpace(on){if(space===on)return;space=on;orbit.root.setEnabled(on);for(const m of cityMeshes)m.setEnabled(!on);for(const c of clouds)c.setEnabled(!on);sky.setEnabled(!on);stars.setEnabled(true);
   scene.fogMode=on?B.Scene.FOGMODE_NONE:B.Scene.FOGMODE_EXP2;scene.fogColor=B.Color3.FromHexString(b.fog[0]);scene.fogDensity=b.fog[1];
   if(on){sun.direction=sunDir.clone();sun.intensity=1.6;hemi.intensity=.04;scene.clearColor=new B.Color4(0,0,0,1);}
   else{const night=b.light==='night';sun.direction=new B.Vector3(-.5,-.8,.3);sun.intensity=night?0:1.1;hemi.intensity=night?.32:.7;hemi.diffuse=B.Color3.FromHexString(night?'#5a5f7a':'#ffffff');hemi.groundColor=B.Color3.FromHexString(night?'#2a1c22':'#4a4a44');const f=B.Color3.FromHexString(b.fog[0]);scene.clearColor=new B.Color4(f.r,f.g,f.b,1);}}
  const tmp=new B.Vector3();
  function place(t){const c=camera(id,kind,t);if(!c)return null;
   if(c.space){setSpace(true);const o=new B.Vector3(...O),k=c.k;let pos,target,up=B.Vector3.Up();
    if(kind==='descent'&&c.phase==='orbit'){const d=lerp(3.4,1.42,easeOut(k,1.6));pos=o.add(dirIn.scale(PR*d));target=o.add(side.scale(PR*lerp(.55,.18,k))).add(new B.Vector3(0,-PR*.15*k,0));}
    else if(kind==='descent'){const d=lerp(1.42,1.012,easeIn(k,1.3)),p=dirIn.add(side.scale(.35*k)).normalize();pos=o.add(p.scale(PR*d));target=o.add(p.subtract(side.scale(lerp(.5,.32,k))).normalize().scale(PR*.99));up=p;}
    else{const d=lerp(1.01,1.65,easeIn(k,1.4)),p=dirIn.add(side.scale(.3)).normalize();pos=o.add(p.scale(PR*d));const tang=B.Vector3.Cross(side,p).normalize();target=pos.add(tang.scale(-PR)).add(p.scale(PR*lerp(-.22,-.08,k)));up=p;}
    cam.position.copyFrom(pos);cam.upVector=up;cam.setTarget(target);orbit.tick(t);return c;}
   setSpace(false);cam.upVector=B.Vector3.Up();cam.position.set(c.pos[0],c.pos[1],c.pos[2]);const cp=Math.cos(c.pitch);tmp.set(c.pos[0]+Math.sin(c.yaw)*cp*100,c.pos[1]+Math.sin(c.pitch)*100,c.pos[2]+Math.cos(c.yaw)*cp*100);cam.setTarget(tmp);cam.rotation.z=c.roll||0;scene.fogDensity=b.fog[1]*lerp(1,.3,clamp((c.pos[1]-120)/650));area.tick?.(t);return c;}
  return {scene,cam,b,place,area,dispose(){try{glow?.dispose();}catch{}scene.dispose();}};}
 // ---- 2D: plasma, shimmer, clouds, rain, dust or steam, shake, letterbox, fades, the cockpit ----
 const sprites=new Map();function sprite(col){if(sprites.has(col))return sprites.get(col);const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d'),r=rng(3),[cr,cg,cb]=hex(col);
  for(let i=0;i<60;i++){const a=r()*Math.PI*2,d=r()*70,px=128+Math.cos(a)*d,py=128+Math.sin(a)*d*.7,rad=18+r()*40,gr=x.createRadialGradient(px,py,0,px,py,rad);gr.addColorStop(0,'rgba('+cr+','+cg+','+cb+',.3)');gr.addColorStop(1,'rgba('+cr+','+cg+','+cb+',0)');x.fillStyle=gr;x.fillRect(px-rad,py-rad,rad*2,rad*2);}
  sprites.set(col,c);return c;}
 const drops=Array.from({length:26},(_,i)=>{const r=rng(1000+i);return {x:r(),y:r()*.6,s:.4+r(),v:.02+r()*.06,ph:r()*10};});
 function effects(c,w,h,t,s,cam,src){const b=s.b,kind=s.kind,ph=phaseAt(kind,Math.min(s.t,duration(kind)-1e-3)),k=ph.k,id=ph.id,reduced=typeof reducedMotion!=='undefined'&&reducedMotion;
  // the 3D view, shaken (entry, the touchdown thump, lift-off), with the entry's heat shimmer
  let shake=0;if(id==='entry')shake=6*Math.sin(k*Math.PI);else if(id==='clouds')shake=2.2;else if(id==='liftoff')shake=2*(1-k);if(s.thump>0)shake+=s.thump*9;if(reduced)shake*=.2;
  const ox=(Math.sin(t*47)+Math.sin(t*31))*shake*.5,oy=(Math.cos(t*41)+Math.sin(t*23))*shake*.5;
  if(id==='entry'&&!reduced){const n=24,sh=h/n;for(let i=0;i<n;i++){const dx=Math.sin(i*.9+t*24)*4*Math.sin(k*Math.PI);c.drawImage(src,0,i*src.height/n,src.width,src.height/n,ox+dx-6,oy+i*sh-6,w+12,sh+1);}}
  else c.drawImage(src,ox-6,oy-6,w+12,h+12);
  // atmospheric entry: the plasma sheath round the nose, orange to white, flickering
  if(id==='entry'||(kind==='descent'&&id==='clouds'&&k<.25)){const a=id==='entry'?Math.sin(clamp(k*1.15)*Math.PI)*.95:(1-k/.25)*.4,fl=.82+.18*Math.sin(t*53)*Math.sin(t*17);c.save();c.globalCompositeOperation='lighter';
   const gr=c.createRadialGradient(w/2,h*.62,h*.18,w/2,h*.55,Math.hypot(w,h)*.62);gr.addColorStop(0,'rgba(255,120,40,0)');gr.addColorStop(.55,'rgba(255,110,40,'+(.18*a*fl)+')');gr.addColorStop(1,'rgba(255,170,100,'+(.95*a*fl)+')');c.fillStyle=gr;c.fillRect(0,0,w,h);
   c.strokeStyle='rgba(255,200,150,'+(.35*a)+')';c.lineWidth=2;const r=rng((t*20)|0);for(let i=0;i<40;i++){const ang=r()*Math.PI*2,r0=h*(.25+r()*.2),r1=r0+h*(.12+r()*.35);c.beginPath();c.moveTo(w/2+Math.cos(ang)*r0*1.3,h*.6+Math.sin(ang)*r0);c.lineTo(w/2+Math.cos(ang)*r1*1.3,h*.6+Math.sin(ang)*r1);c.stroke();}c.restore();}
  // the cloud layer: a grey-out with cloud drifting past
  let veil=0;if(id==='clouds')veil=Math.sin(k*Math.PI)*.92;if(kind==='descent'&&id==='entry'&&k>.8)veil=Math.max(veil,(k-.8)/.2*.85);if(kind==='ascent'&&id==='space'&&k<.15)veil=(1-k/.15)*.6;
  if(veil>0){c.save();c.globalAlpha=veil;c.fillStyle=b.clouds;c.fillRect(0,0,w,h);const sp=sprite(b.cloudGlow),off=((t*(kind==='descent'?-700:700))%(1.6*h)+1.6*h)%(1.6*h);c.globalAlpha=Math.min(1,veil*1.1);for(let i=0;i<9;i++){const x=((i*.37)%1)*w*1.2-w*.3,y=(off+i*h*.21)%(1.6*h)-h*.5,S=w*(.55+(i%3)*.18);c.drawImage(sp,x,y,S,S*.7);}c.restore();}
  // rain (Servo) / blown dust (Vantor, Vesper) below the cloud deck
  const below=!cam.space&&cam.pos[1]<1000;if(below&&(b.weather==='rain'||b.weather==='dust')){const rain=b.weather==='rain',n=rain?(Q()==='low'?90:200):60,spd=cam.phase==='approach'?1.4:cam.phase==='touchdown'||cam.phase==='liftoff'?.6:1,r=rng(9);c.save();c.strokeStyle=rain?'rgba(190,205,225,.26)':'rgba(200,150,110,.18)';c.lineWidth=rain?1:2;c.beginPath();
   for(let i=0;i<n;i++){const x=(r()*w+t*(rain?60:300)*spd)%w,y=(r()*h+t*(rain?1400:180)*spd*(.6+r()*.4))%h,l=rain?16+r()*26*spd:6+r()*10;c.moveTo(x,y);c.lineTo(x-l*(rain?.18:1.6),y-l);}c.stroke();c.restore();
   if(rain){c.save();for(const d of drops){const y=((d.y+t*d.v*.3)%.62)*h,x=d.x*w,R=2+d.s*3;c.fillStyle='rgba(200,215,235,.06)';c.beginPath();c.arc(x,y,R,0,7);c.fill();c.fillStyle='rgba(255,255,255,.1)';c.fillRect(x-R*.3,y-R*.5,R*.4,R*.25);}c.restore();}}
  // steam (NeoChinatown's wet pad) or dust (the others) blown out from under the ship at touchdown and lift-off
  let blow=0;if(id==='touchdown')blow=clamp((k-.35)/.3)*(1-clamp((k-.9)/.1)*.5);if(id==='liftoff')blow=1-clamp((k-.35)/.65);
  if(blow>0){const col=b.ground==='steam'?[205,210,220]:hex(b.clouds),r=rng(77);c.save();for(let i=0;i<26;i++){const a=r(),x=w*(.5+(r()-.5)*1.4*(.6+blow)),y=h*(.72+r()*.3)-blow*h*.08*a,R=h*(.08+r()*.18)*(.7+blow*.6),gr=c.createRadialGradient(x,y,0,x,y,R);gr.addColorStop(0,'rgba('+col[0]+','+col[1]+','+col[2]+','+(.28*blow)+')');gr.addColorStop(1,'rgba('+col[0]+','+col[1]+','+col[2]+',0)');c.fillStyle=gr;c.fillRect(x-R,y-R,R*2,R*2);}c.restore();}
  // the painted Kestrel cockpit (cockpit-overlay.js) with live readouts; a passenger shuttle has no cockpit
  if(!s.shuttle&&root.VoidCockpitOverlay?.ready){const speed=cam.space?(id==='orbit'?7800:id==='entry'?lerp(7800,900,k):lerp(400,7800,k)):id==='touchdown'?lerp(40,0,k):id==='liftoff'?lerp(0,30,k):id==='clouds'?320:lerp(id==='approach'?280:60,id==='approach'?40:260,k);
   c.save();c.translate(ox*.25,oy*.25);try{VoidCockpitOverlay.draw(c,w,h,{hull:100,shield:100,heat:id==='entry'?60+30*Math.sin(k*Math.PI):12,power:100,speed,throttle:id==='touchdown'?.2:.6,route:b.place.toUpperCase().slice(0,12),missiles:0,target:'NONE'},t);}catch{}c.restore();}
  // letterbox, fades in and out
  const bar=Math.round(h*.07);c.fillStyle='#000';c.fillRect(0,0,w,bar);c.fillRect(0,h-bar,w,bar);
  let fade=0;if(s.t<.6)fade=1-s.t/.6;if(s.ending)fade=Math.max(fade,clamp(s.ending/.5));if(fade>0){c.fillStyle='rgba(0,0,0,'+fade+')';c.fillRect(0,0,w,h);}}
 // ---- sound (flight-sfx.js: synthesized, the effects channel) ----
 const sfx=n=>{try{root.VoidFlightSfx?.play?.(n);}catch{}};
 const CUES={descent:[[0,'arrive'],[4,'entry'],[8.6,'wind'],[11.8,'thrusters'],[16.6,'gear'],[19.2,'thrusters'],[21.9,'touchdown'],[22.1,'steam']],ascent:[[0,'liftoff'],[.6,'steam'],[2.8,'gear'],[3.4,'thrusters'],[8.2,'wind'],[10.8,'exit']]};
 // ---- running a sequence ----
 function frame(){const s=L,now=performance.now(),dt=Math.min(.1,(now-s.last)/1000);s.last=now;const total=duration(s.kind);
  if(!s.engineReady){end('no engine');return;}
  if(s.t<total)s.t=Math.min(total,s.t+dt);else s.hold+=dt;
  for(const [at,n] of CUES[s.kind])if(!s.cued.has(at)&&s.t>=at&&!s.skipped){s.cued.add(at);if(n!=='steam'||s.b.ground==='steam')sfx(n);}
  const c=s.handle.place(Math.min(s.t,total-1e-3));if(!c){end('no camera');return;}
  if(c.touched&&!s.thumped){s.thumped=true;s.thump=1;}s.thump=Math.max(0,(s.thump||0)-dt*3);
  // the hand-over: the sequence is done and the place behind it is ready (or failed, so its own panel shows)
  if(s.t>=total&&!s.ending){const m=md(),waiting=!s.preview&&(s.kind==='descent'?['arrival','preparing','preparing-flight'].includes(m)||(root.VoidGraphics&&VoidGraphics.busy):['preparing','preparing-flight'].includes(m)||(root.VoidGraphics&&VoidGraphics.busy)||m==='walking'&&s.age<2);
   cap(waiting?(s.kind==='descent'?'PORT SYSTEMS · CONNECTING':'DEPARTURE CLEARANCE · STAND BY'):'',waiting?'':'');if(!waiting||s.hold>45)s.ending=.0001;}
  if(s.ending){s.ending+=dt;if(s.ending>.5){end('done');return;}}
  s.age+=dt;
  // ascent: the launch was refused (back on the ground, or a held departure's panel): stop at once so the player sees why
  if(s.kind==='ascent'&&!s.preview&&s.age>1.5&&(md()==='walking'&&typeof walkingLocation!=='undefined'&&walkingLocation||md()==='dock')){end('launch held');return;}
  const engine=s.engine;try{root.VoidBabylon.resizeViewport(innerWidth,innerHeight);}catch{}s.handle.scene.render();
  const D=Math.min(devicePixelRatio||1,2),w=innerWidth,h=innerHeight;if(cv.width!==Math.round(w*D)||cv.height!==Math.round(h*D)){cv.width=Math.round(w*D);cv.height=Math.round(h*D);}g.setTransform(D,0,0,D,0,0);
  effects(g,w,h,now/1000,s,c,engine.getRenderingCanvas());
  if(!s.ending&&s.t<total){const ph=phaseAt(s.kind,s.t);cap(s.captions[ph.id]||'',s.sub);}}
 let capText='';function cap(t,sub){if(!el)return;if(t!==capText){capText=t;el.querySelector('.ls-cap').textContent=t;}const sb=el.querySelector('.ls-sub');if(sub!==undefined&&sb.textContent!==sub)sb.textContent=sub||'';}
 function skip(){const s=L;if(!s||s.ending)return;const total=duration(s.kind);if(s.t<total-.8){s.skipped=true;s.t=total-.8;s.cued=new Set(CUES[s.kind].map(x=>x[0]));}}
 function start(kind,id,o={}){if(L||!landable(id)||!enabled())return false;if(!hook())return false;
  const engine=root.VoidBabylon?.scene?.getEngine?.();if(!engine||!root.BABYLON)return false;ui();
  let handle;try{handle=create(engine,id,kind);}catch(e){console.error('[landing sequence] could not build',e);return false;}
  L={kind,id,b:biome(id),state:st(),engine,engineReady:true,handle,t:0,hold:0,age:0,last:performance.now(),cued:new Set(),thump:0,captions:captions(id,kind),sub:o.shuttle?'PASSENGER SHUTTLE · '+biome(id).planet.toUpperCase():(kind==='descent'?biome(id).planet.toUpperCase()+' · '+systemName(id).toUpperCase():''),shuttle:!!o.shuttle,preview:!!o.preview,ending:0,startedAt:Date.now()};
  try{document.exitPointerLock?.();}catch{}el.hidden=false;capText='';cap('',L.sub);el.querySelector('[data-landing-skip]').focus({preventScroll:true});
  addEventListener('keydown',keys,{capture:true});addEventListener('keyup',keys,{capture:true});
  root.dispatchEvent?.(new CustomEvent('void-landing',{detail:{phase:'start',kind,id}}));log.push({kind,id,start:Date.now()});if(log.length>20)log.shift();return true;}
 function end(why){const s=L;if(!s)return;L=null;try{s.handle.dispose();}catch(e){console.warn('[landing sequence] dispose',e);}
  if(el){el.hidden=true;g&&g.clearRect(0,0,cv.width,cv.height);}removeEventListener('keydown',keys,{capture:true});removeEventListener('keyup',keys,{capture:true});
  try{last=performance.now();}catch{}const rec=log[log.length-1];if(rec&&rec.kind===s.kind&&rec.id===s.id){rec.end=Date.now();rec.why=why;rec.skipped=!!s.skipped;}
  root.dispatchEvent?.(new CustomEvent('void-landing',{detail:{phase:'end',kind:s.kind,id:s.id,why,skipped:!!s.skipped}}));}
 const log=[];
 // ---- where the sequences start (outermost wrappers: every earlier wrapper still runs first and decides as before) ----
 function install(){if(typeof arrive!=='function'||typeof launch!=='function'||typeof leaveWalking!=='function')return false;
  // DESCENT: a flight ended at a planetside place (campaign.js complete moved the player; world-integration.js arrive has already started dock(), which loads the place underneath)
  const prevArrive=arrive;arrive=function(){const s=st(),from=s?.location,wasPlay=md()==='play';const r=prevArrive.apply(this,arguments);
   try{const now=st();if(wasPlay&&now&&now===s&&now.location!==from&&!root.VoidFlightSkirmish?.active)start('descent',now.location);}catch(e){console.warn('[landing sequence]',e);}return r;};
  // ASCENT: boarding on a planet (a launch from the ground in the open game; the old Vesper opening's own cockpit flow is left alone)
  const prevLaunch=launch;launch=function(){const s=st();let go=false;try{go=!!s&&md()==='walking'&&typeof walkingLocation!=='undefined'&&!!walkingLocation&&s.quest==='open'&&landable(s.location)&&!L;}catch{}
   if(go)start('ascent',s.location);const r=prevLaunch.apply(this,arguments);Promise.resolve(r).then(()=>{if(L&&L.kind==='ascent'&&!['play','preparing','preparing-flight','pause','menu'].includes(md()))end('launch held');},()=>{if(L&&L.kind==='ascent')end('launch failed');});return r;};
  // THE WAY HOME without a ship: BOARD anywhere but NeoChinatown takes the passenger shuttle to the Port
  const prevLeave=leaveWalking;leaveWalking=async function(){const s=st();if(!needsShuttle(s))return prevLeave.apply(this,arguments);
   try{document.exitPointerLock?.();walkingKeys.clear();}catch{}shuttleHome(s);try{save();}catch{}try{announce('No ship of your own: a passenger shuttle takes you home to NeoChinatown.');}catch{}
   walkingLocation=walker=null;start('descent',HOME,{shuttle:true});return dock();};
  // SETTINGS: Flight > Play landing sequences
  if(typeof settingsPage==='function'){const prevSettings=settingsPage;settingsPage=function(){const r=prevSettings.apply(this,arguments);const p=screen.querySelector('.settings-panel');
   p?.insertAdjacentHTML('beforeend','<h2>Flight</h2><label>Play landing sequences<select id="landing-seq-setting"><option value="on"'+(enabled()?' selected':'')+'>On</option><option value="off"'+(enabled()?'':' selected')+'>Off</option></select></label><p class="fine">The descent to a planet and the take-off from one. Skip any time with SKIP or Space.</p>');return r;};
   screen.addEventListener('change',e=>{if(e.target?.id==='landing-seq-setting')setEnabled(e.target.value!=='off');});}
  return true;}
 if(!install()){const w=setInterval(()=>{if(install())clearInterval(w);},200);}
 Object.defineProperties(api,Object.getOwnPropertyDescriptors({start,end,skip,get active(){return L?{kind:L.kind,id:L.id,t:L.t,phase:phaseAt(L.kind,Math.min(L.t,duration(L.kind)-1e-3))?.id,ending:!!L.ending,skipped:!!L.skipped,paused:!!L.wasPaused}:null;},log,
  /* tests: hold the sequence at a time */ frameTo(t){if(L){L.t=Math.max(0,Math.min(duration(L.kind),t));L.cued=new Set(CUES[L.kind].filter(x=>x[0]<=L.t).map(x=>x[0]));}}}));
})(globalThis);
