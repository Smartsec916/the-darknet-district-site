/* The Port quarter of NeoChinatown, remade (16 Nov 2026, docs/development/NEOCHINATOWN_REMAKE.md). The first quarter built from the city kit (ncz-kit.js).
   David: "make it look like a real cyberpunk city ... The area around the landing pad looks especially bad with gaps."
     build({B,scene,parent,quality,instance,state}) -> {replaces(name,p), tick(dt,time), dispose(), mounts, kit}   called by neochinatown.js for the Port only.
   What it makes: a closed ring of dressed buildings round the pad yard and the lane to Port Customs (nothing shows between, behind or under them), a second
   ring of lit towers behind and a filled backdrop out to the old megacity; a working landing deck (markings, guidance lights, floodlight masts, a fuel bowser,
   a cargo tug, crates, a ground-control booth and the landing terminal); wet ground that mirrors the signs and lamps (Medium and up); a food stall; housing
   entrances that do not open; a public toilet you can walk into; a bridge building over the customs gatehouse; cables, lamps, steam and a few vertical signs.
   The plan (collision, the toilet, screen mounts, venue fronts) is ncz-port-data.js. The old Port is still built by neochinatown.js when this file is missing
   or throws; when it runs, replaces() tells neochinatown.js which of its own pieces to leave out, so the two never stand in the same place.
   Words on signs are plain and functional (PORT, CARGO, FUEL, EXIT, WC, numbers); nothing here invents a name. Screens are the screens work's: see MOUNTS. */
(function(root){
 'use strict';
 const D=root.VoidPortData,PI=Math.PI;
 // Everything this build covers itself (its two rings of buildings), and the old neighbourhood, which no other quarter's pieces may show in while the Port is up.
 const COVER=[-24,78,-142,-50],CORE=[-6,160,-130,2];
 const within=(r,x,z)=>x>=r[0]&&x<=r[1]&&z>=r[2]&&z<=r[3];
 // Does the remade Port stand in for this piece of the old street build? (the endless ground, the far megacity and the sky stay)
 function replaces(name,p){if(/^(city-ground|ironeye)/.test(name||''))return false;return within(COVER,p[0],p[2])||within(CORE,p[0],p[2]);}
 let visits=0;
 function build({B,scene,parent,quality,instance,state}){
  const K=root.VoidCityKit.create({B,scene,parent,quality,name:'ncz-port'}),{S,low,high,rand,pick}=K,W=D.WC,people=[],flick=[];let disposed=false,clock=0;visits++;
  try{
  K.reseed(70707);
  const [YX0,YX1,YZ0,YZ1]=D.YARD,[LX0,LX1,LZ0,LZ1]=D.LANE;
  // extra surfaces of the Port
  const canvas=K.surf('canvas',{tint:'#5d1d1b',rough:.95,metal:0,haze:.3}),porcelain=K.surf('porcelain',{tint:'#a6a89c',rough:.25,metal:0,haze:.16,spec:.4}),wood=K.surf('wood',{tint:'#4a3524',rough:.8,metal:0,haze:.18}),
   deckM=K.surf('deck',{color:'concrete-old-color',normal:'concrete-old-normal',tint:'#7b8088',rough:.5,tile:6,haze:.1});
  const cold='#cfe6ff',sodium='#ffb35c',warm='#ffc98a',green='#7dffc4',red='#ff4a3a',teal='#3fe0d0',pink='#ff5fb0',amber='#ffb347';
  const G=(k,c,v=1)=>K.glow(k,c,v);

  // ================= ground =================
  const puddles=[[20,-86.9,2.2,.8,.2],[35.2,-93.5,2.4,1.3,.5],[39.4,-96.5,1.6,1.1,1.2],[42.3,-103.4,1.5,2.2,0],[38.9,-104.6,1.3,.9,.4],[14.2,-95.2,.9,1.8,0],[28,-105,2.6,.8,.1],[34.8,-99.6,1.5,2.4,.3],[36.2,-90.6,1.2,1.0,.8],[24.5,-87.2,1.4,.6,0],[40.9,-93.6,1.2,.7,.2],
   [22,-100,1.6,1.1,.6],[27.5,-91.5,1.9,1.2,1.1],[18,-93,1.2,.9,.3]];
  const wet=K.ground([D.YARD,[LX0,LX1,-107.4,LZ1],[W.door[0],W.door[1],W.front[0],W.front[1]]],{puddles:puddles.slice(0,11)});
  // kerb line where the lane meets the yard, drains, manholes, road paint
  for(let z=-105;z<-93;z+=2.4)K.groundMark(.18,1.5,40.7,z,K.stain.line('rgba(215,196,120,.7)'));   // the lane's centre line (walkers west, cabs east)
  for(const [x,z,yaw] of [[39.2,-98.5,0],[26,-86.9,PI/2],[35.4,-101.2,0],[14,-90,0]])K.groundMark(.9,.9,x,z,K.stain.manhole(),{yaw});
  for(const [x,z,yaw] of [[37.2,-97,0],[37.2,-102.5,0],[43.6,-95,0],[20,-105.6,PI/2],[30,-86.5,PI/2],[13.5,-97.4,0]])K.groundMark(.42,1.3,x,z,K.stain.drain(),{yaw});
  for(let i=0;i<16;i++){const r=i%3?D.YARD:D.LANE,x=r[0]+1+rand()*(r[1]-r[0]-2),z=r[2]+1+rand()*(r[3]-r[2]-2);K.groundMark(2+rand()*3,2+rand()*3,x,z,K.stain.blot(i%4?'rgba(6,7,9,A)':'rgba(40,26,12,A)',.55),{yaw:rand()*3,px:14});}
  K.groundMark(2.6,.5,39.15,-105.6,K.stain.text('CUSTOMS','rgba(225,215,190,.75)'),{yaw:PI});K.groundMark(.5,1.1,39.15,-104.6,K.stain.text('↓','rgba(225,215,190,.75)'),{yaw:PI});

  // ================= the landing deck =================
  {const [x0,x1,z0,z1]=D.DECK,cx=(x0+x1)/2,cz=(z0+z1)/2,w=x1-x0,d=z1-z0,top=.125;
   K.box(deckM,[w,.12,d],[cx,.06,cz],{ao:[.5,1]});K.box(S.steel,[w+.24,.1,d+.24],[cx,.05,cz],{faces:'fbrl'});
   const M=(mw,md,x,z,draw,o)=>K.groundMark(mw,md,x,z,draw,{y:top+.006,...o});
   // hazard border, the touchdown ring, centre lines, the pad's number, hold lines toward the lane
   M(w-.3,.42,cx,z0+.32,K.stain.hazard());M(w-.3,.42,cx,z1-.32,K.stain.hazard());M(d-1.3,.42,x0+.32,cz,K.stain.hazard(),{yaw:PI/2});M(d-1.3,.42,x1-.32,cz,K.stain.hazard(),{yaw:PI/2});
   M(11,11,cx-2,cz,K.stain.ring('rgba(230,222,200,.7)',.035),{px:22});M(6.2,6.2,cx-2,cz,K.stain.ring('rgba(226,170,60,.7)',.03),{px:22});
   M(.16,13,cx-2,cz,K.stain.line('rgba(230,222,200,.5)',26),{px:20});M(15,.16,cx-2,cz,K.stain.line('rgba(230,222,200,.5)',26),{px:20});
   M(3.2,1.9,x1-2.6,z0+2.1,K.stain.text('07','rgba(232,224,204,.82)'),{yaw:PI});M(3.2,1.9,x0+2.6,z1-2.1,K.stain.text('07','rgba(232,224,204,.82)'));
   M(.3,5,x1-.95,-96,K.stain.line('rgba(226,170,60,.8)',18),{px:30});
   // guidance lights round the edge: amber along the sides, green at the approach end, a slow chase
   const guide=G('guide',amber,1),guideG=G('guide-g',green,.9);
   for(let x=x0+1;x<=x1-1;x+=2.67)for(const z of [z0+.12,z1-.12]){K.box(S.dark,[.26,.06,.26],[x,top+.03,z]);K.box(guide,[.16,.05,.16],[x,top+.07,z]);K.groundWash(amber,x,z,1.5,1.5,.3,top+.012);}
   for(let z=z0+2;z<=z1-2;z+=3)for(const [x,m,c] of [[x0+.12,guideG,green],[x1-.12,guide,amber]]){K.box(S.dark,[.26,.06,.26],[x,top+.03,z]);K.box(m,[.16,.05,.16],[x,top+.07,z]);K.groundWash(c,x,z,1.5,1.5,.3,top+.012);}
   K.tickers.push((dt,t)=>{const k=.55+.45*Math.sin(t*2.2);guide.emissiveColor.set(1*k,.7*k,.28*k);});
   // chocks and a ground power cable by where the ship stands
   K.box(S.yellow,[.5,.22,.3],[19.4,top+.11,-93.2]);K.box(S.yellow,[.5,.22,.3],[19.4,top+.11,-98.8]);
   K.tube(S.dark,[[16.6,.2,-87.4],[17.4,.16,-88.6],[18.6,top+.05,-89.9],[19.8,top+.05,-91.6],[20.6,top+.3,-93.4]],.05,5);}

  // ================= the street wall: a closed ring of buildings =================
  const T=K.TINTS;
  // West side of the yard.
  const bA=K.building([-3,YX0,-106.4,-96],20,{wall:S.brick,tint:T[3]}),fA=K.face(YX0,-106,YX0,-96,1,0);
  K.dress(fA,20,{wall:S.brick,tint:T[3],ground:[{kind:'shutter',w:4.2,label:'CARGO 01'},{kind:'shutter',w:4.2,label:'CARGO 02'},{kind:'blank',w:0}],escape:1.9,dense:.8});
  const bB=K.building([-3,YX0,-96,-85.6],27,{wall:S.concrete,tint:T[2]}),fB=K.face(YX0,-96,YX0,-86,1,0);
  K.dress(fB,27,{wall:S.concrete,tint:T[2],ground:[{kind:'door',w:3,number:'7'},{kind:'shop',w:4.2,color:'#8fb6c9',dim:.32,bars:6},{kind:'blank',w:0}],dense:.9,litRate:.42});
  // North side: a mid block and the tall tower (the big screen mount is on it).
  const bC=K.building([12.6,23,-86,-72],17,{wall:S.mold,tint:T[4]}),fC=K.face(YX0,-86,23,-86,0,-1);
  K.dress(fC,17,{wall:S.mold,tint:T[4],ground:[{kind:'blank',w:3.5},{kind:'shutter',w:3.5,label:'FUEL',color:'#ffb347',tag:false},{kind:'door',w:3,number:'12'}],dense:.9,escape:2.4});
  const bD=K.building([23,YX1,-86,-70],31,{wall:S.concrete,tint:T[6]}),fD=K.face(23,-86,YX1,-86,0,-1);
  K.dress(fD,31,{wall:S.concrete,tint:T[6],ground:[{kind:'model',w:4.3},{kind:'model',w:4.3},{kind:'blank',w:2},{kind:'open',w:0}],dense:.7,litRate:.4});
  // East of the yard's north-east nook: the block that holds the public toilet. Its south wall has the doorway in it, so it is built in parts.
  const hE=22;K.box(S.mold,[14.5,hE,14],[44.75,hE/2,-85],{tint:T[1],ao:[.42,1],faces:'brl'});K.roof(37.5,52,-92,-78,hE);
  {const m=S.mold,t=T[1],fz=-92,part=(x0,x1,y0,y1)=>K.box(m,[x1-x0,y1-y0,.5],[(x0+x1)/2,(y0+y1)/2,fz+.25],{tint:t,ao:[y0?1:.42,1],faces:'fbrltd'});
   part(37.5,W.door[0],0,hE);part(W.door[1],52,0,hE);part(W.door[0],W.door[1],2.3,hE);}
  const fEw=K.face(YX1,-86,YX1,-92,-1,0),fEs=K.face(LX0,-92,LX1,-92,0,-1);
  K.dress(fEw,hE,{wall:S.mold,tint:T[1],ground:[{kind:'open',w:2.4},{kind:'door',w:0,number:'3'}],dense:.8,canopy:false});
  K.dress(fEs,hE,{wall:S.mold,tint:T[1],ground:[{kind:'open',w:0}],dense:.5});
  // East side of the lane.
  const bF=K.building([LX1,53,-113.6,-92],24,{wall:S.bluesheet,tint:T[0]}),fF=K.face(LX1,-92,LX1,-107,-1,0);
  K.dress(fF,24,{wall:S.bluesheet,tint:T[0],ground:[{kind:'shop',w:4.5,color:'#d9a15a',dim:.55,bars:4},{kind:'shutter',w:4.5},{kind:'door',w:3,number:'44'},{kind:'blank',w:0}],dense:.9,escape:11.4,litRate:.45});
  // South side of the yard.
  const bG=K.building([26,YX1,-120,-106],22,{wall:S.concrete,tint:T[5]}),fG=K.face(YX1,-106,26,-106,0,1);
  K.dress(fG,22,{wall:S.concrete,tint:T[5],ground:[{kind:'blank',w:2.3},{kind:'door',w:3,number:'28'},{kind:'shutter',w:4.2},{kind:'blank',w:0}],dense:.8,litRate:.4});
  const bH=K.building([12.7,26,-120,-106],15,{wall:S.rustsheet,tint:T[0]}),fH=K.face(26,-106,YX0,-106,0,1);
  K.dress(fH,15,{wall:S.rustsheet,tint:T[0],ground:[{kind:'model',w:4.2},{kind:'shutter',w:4,label:'CARGO 03'},{kind:'model',w:0}],dense:.9,escape:8});
  // Corners and the far side of customs (seen only from above, but never open ground).
  K.building([-3,12.7,-124,-106.4],24,{wall:S.mold,tint:T[4]});K.building([-3,12.6,-85.6,-72],23,{wall:S.brick,tint:T[1]});K.building([37.5,53,-124,-113.6],12,{wall:S.concrete,tint:T[2],clutter:.5});
  // The bridge: flats built across the lane on top of the customs gatehouse (the gatehouse itself is ncz-gates.js and is not touched).
  {const gateTop=root.VoidQuarters?.WALL_H||7.2,h=17.5,z1=-108.1;K.box(S.plate,[LX1-LX0,h-gateTop,z1+113.6],[(LX0+LX1)/2,(h+gateTop)/2,(z1-113.6)/2],{tint:[.8,.84,.92],ao:[.6,1],faces:'fbrld'});K.roof(LX0,LX1,-113.6,z1,h,{clutter:.6});
   const f=K.face(LX0,z1,LX1,z1,0,1);
   for(let c=0;c<2;c++){const s=1.25+c*4,y=15.6;K.fbox(f,S.dark,[1.9,1.9,.06],s,y,0);K.window(f,s-.45,y,.85,1.7,pick(K.LIT));K.window(f,s+.45,y,.85,1.7,pick([0,1,2,3]));K.fbox(f,S.plate,[2.1,.09,.2],s,y-.95,.1);}
   K.fbox(f,S.frame,[6.5,.3,.3],3.25,gateTop+.15,.15);K.fbox(f,S.frame,[6.5,.14,.36],3.25,h+.4,.1);for(const s of [.25,6.25])K.fbox(f,S.frame,[.3,h-gateTop,.3],s,(h+gateTop)/2,.15);
   K.fbox(f,S.rust,[.14,h-gateTop,.14],5.9,(h+gateTop)/2,.38);K.prop('ac-cluster',K.at(f,.9,8.2,.02),f.yaw,{h:1.4});}

  // ================= behind the street wall: lit towers, then the filled backdrop =================
  [[[-22,-3,-112,-84],46],[[-21,-3,-84,-60],38],[[-24,-3,-138,-112],34],[[-3,14,-72,-52],41],[[14,34,-70,-50],58],[[34,56,-78,-54],44],[[53,67,-113.6,-88],37],[[52,78,-88,-60],52],[[53,72,-138,-113.6],43],[[6,28,-142,-124],39],[[28,53,-142,-124],50]]
   .forEach(([r,h],i)=>K.tower(r,h,i));
  for(let x=CORE[0]+6;x<CORE[1];x+=26)for(let z=CORE[2]+4;z<CORE[3]-8;z+=26){if(x+20>COVER[0]&&x<COVER[1]&&z+20>COVER[2]&&z<COVER[3])continue;const w=17+rand()*6,d=17+rand()*6;K.tower([x,x+w,z,z+d],22+rand()*46,Math.floor(rand()*3),{crown:!low});}
  // modelled tanks and plant on the roof edges that show against the sky from the yard
  for(const [id,x,y,z,yw,h] of [['water-tank',16.5,17,-83.6,.4,3.4],['water-tank',33.5,22,-108.6,2,3.2],['water-tank',47,24,-97,1,3.6],['water-tank',3,20,-102,0,3.3],['roof-plant',20.5,15,-108.2,0,2],['roof-plant',41,22,-90,PI/2,2.1],['roof-plant',9.5,27,-90,PI/2,2.2]])K.prop(id,[x,y,z],yw,{h});
  // lit strips and plain light panels high on the towers (no words)
  for(const [x,y,z,w,h,dir,cols] of [[14,44,-70.3,3,9,[0,-1],[pink,pink,teal]],[-3.3,30,-98,2.4,7,[1,0],[amber,amber]],[52.7,28,-100,2.2,6,[-1,0],[teal,teal,teal]],[40,37,-124.3,3,8,[0,1],[pink,amber,pink]]])
   {K.box(S.frame,[dir[0]?.3:w+.5,h+.5,dir[0]?w+.5:.3],[x-dir[0]*.2,y,z-dir[1]*.2]);K.lit(w,h,[x+dir[0]*.02,y,z+dir[1]*.02],[-dir[1],0,dir[0]],[0,1,0],K.paint.bars(cols),{px:10});}

  // ================= signs (few, vertical, plain words) =================
  const axFor=d=>[-d[1],0,d[0]];
  // a blade sign standing out from a wall, lit on both sides
  function blade(f,s,y,w,h,draw,c,{out=.35}={}){const o=out+w/2;K.fbox(f,S.frame,[.2,h+.24,w+.2],s,y,o);K.fbox(f,S.frame,[.1,.1,out+.1],s,y+h/2-.3,out/2);K.fbox(f,S.frame,[.1,.1,out+.1],s,y-h/2+.3,out/2);
   const p0=K.at(f,s-.105,y,o),p1=K.at(f,s+.105,y,o),uv=K.lit(w,h,p0,axFor([-f.tx,-f.tz]),[0,1,0],draw);K.litAgain(uv,w,h,p1,axFor([f.tx,f.tz]),[0,1,0]);
   K.wallWash(f,c,s,y,3.4,h+2.5,.42);const g=K.at(f,s,0,o+.4);K.groundWash(c,g[0],g[2],4,4,.3);}
  const portSign=(g,Wd,Ht)=>{g.fillStyle='#05080a';g.fillRect(0,0,Wd,Ht);g.strokeStyle=teal;g.lineWidth=4;g.strokeRect(5,5,Wd-10,Ht-10);const items=['港','P','O','R','T'],n=items.length;items.forEach((ch,i)=>{const cy=Ht*(i+.5)/n,sz=Wd*(i?.62:.74);g.font='bold '+sz+'px "Noto Sans SC","Noto Sans JP","Microsoft YaHei",sans-serif';g.textAlign='center';g.textBaseline='middle';g.shadowColor=teal;g.shadowBlur=sz*.3;g.fillStyle=teal;g.fillText(ch,Wd/2,cy);g.shadowBlur=0;g.fillStyle='rgba(255,255,255,.6)';g.fillText(ch,Wd/2,cy);});};
  blade(fB,7.6,12.4,1.25,6.4,portSign,teal);
  blade(fG,6.4,9.6,1.1,5.2,K.paint.words(['CARGO'],amber,{vertical:true,edge:amber}),amber);
  blade(fF,2.2,9.4,1.0,4.6,K.paint.bars([pink,pink,teal,pink]),pink);
  // over the lane, facing the yard: the way out through customs
  {const y=9.75,z=-108.02;K.box(S.frame,[3.5,.94,.14],[40.75,y,z]);K.lit(3.3,.78,[40.75,y,z+.075],axFor([0,1]),[0,1,0],K.paint.words(['出口 EXIT ↓'],green,{bg:'#04100c'}));}
  // the toilet's sign: a pictogram and the letters, over its door
  {const s=1.8;K.fbox(fEs,S.frame,[1.5,.74,.12],s,2.95,.08);K.flit(fEs,1.4,.64,s,2.95,.145,(g,Wd,Ht)=>{K.paint.wc()(g,Ht*1.05,Ht);g.save();g.translate(Ht*1.05,0);K.paint.words(['WC'],'#e8eef2',{bg:'#0b2f4a',tube:false})(g,Wd-Ht*1.05,Ht);g.restore();});
   blade(fEs,3.1,5.4,.7,.9,K.paint.wc(),'#7fb8e8',{out:.2});}

  // ================= screen mounts (frames only: the screens work hangs its pictures here) =================
  const mounts=D.MOUNTS.map(m=>{const [x,y,z]=m.position,[w,h]=m.size,n=m.normal,back=[x-n[0]*.22,y,z-n[1]*.22];K.box(S.frame,n[0]?[.3,h+.5,w+.5]:[w+.5,h+.5,.3],back);K.box(S.dark,n[0]?[.06,h,w]:[w,h,.06],[x-n[0]*.05,y,z-n[1]*.05]);
   // a screen on standby: a dim field with scan lines, no picture and no words (the screens work replaces it)
   K.lit(w-.2,h-.2,[x,y,z],axFor(n),[0,1,0],(g,Wd,Ht)=>{const gr=g.createLinearGradient(0,0,0,Ht);gr.addColorStop(0,'#06181c');gr.addColorStop(.5,'#0a2a30');gr.addColorStop(1,'#040d10');g.fillStyle=gr;g.fillRect(0,0,Wd,Ht);g.fillStyle='rgba(0,0,0,.35)';for(let yy=0;yy<Ht;yy+=4)g.fillRect(0,yy,Wd,2);g.fillStyle='rgba(90,220,230,.5)';g.fillRect(Wd*.06,Ht*.94,Wd*.05,Ht*.012);},{px:12});
   for(const k of [-1,1])K.box(S.steel,n[0]?[.5,.12,.12]:[.12,.12,.5],[x-n[0]*.5,y+k*h*.3,z-n[1]*.5]);return {...m};});

  // ================= equipment and clutter =================
  const blk=id=>{const b=D.BLOCKS.find(x=>x[0]===id);return {x0:b[1],x1:b[2],z0:b[3],z1:b[4],x:(b[1]+b[2])/2,z:(b[3]+b[4])/2,w:b[2]-b[1],d:b[4]-b[3]};};
  const put=(prop,id,yaw,h)=>{const b=blk(id);K.prop(prop,[b.x,0,b.z],yaw,{h,shadow:[b.w,b.d]});return b;};
  put('customs-booth','booth',PI,3.3);put('fuel-bowser','fuel',0,1.5);put('cargo-loader','loader',0,1.9);put('crate-stack','crates-s',0,1.25);put('dumpster','dumpster',PI,1.4);
  {const a=blk('crates-w1'),b=blk('crates-w2');K.prop('crate-stack',[a.x,0,a.z],PI/2,{h:1.2,shadow:[a.d,a.w]});K.prop('crate-stack',[b.x,0,b.z],-PI/2,{h:1.35,shadow:[b.d,b.w]});}
  put('scooter','scooter',0,1.12);
  {const v=blk('vending');K.prop('vending',[v.x0+.55,0,v.z],0,{h:1.95,shadow:[1,.8]});K.prop('vending',[v.x1-.55,0,v.z],0,{h:1.9,shadow:[1,.8]});K.groundWash(cold,v.x,v.z0-.9,3.2,2.2,.3);K.wallWash(fEs,cold,v.x-LX0,2.6,4,3,.2);}
  // floodlight masts
  const mastLights=[];
  for(const [id,tx,tz] of [['mast-sw',22,-97],['mast-nw',22,-95],['mast-se',27,-97]]){const b=blk(id),h=9.2;K.cyl(S.steel,.1,h,[b.x,h/2,b.z],{t:8});K.box(S.yellow,[.42,.9,.42],[b.x,.45,b.z],{ao:[.6,1]});K.box(S.frame,[.5,.12,.5],[b.x,h,b.z]);
   const dx=tx-b.x,dz=tz-b.z,l=Math.hypot(dx,dz),ux=dx/l,uz=dz/l,yaw=Math.atan2(ux,uz);K.box(S.frame,[1.5,.1,.1],[b.x,h+.2,b.z],{yaw});
   for(const k of [-.5,.5]){const hx=b.x+Math.cos(yaw)*k+ux*.25,hz=b.z-Math.sin(yaw)*k+uz*.25;K.box(S.frame,[.5,.4,.3],[hx,h+.2,hz],{yaw});K.box(G('flood',cold,1.15),[.42,.32,.04],[hx+ux*.16,h+.16,hz+uz*.16],{yaw});}
   K.cone(cold,[b.x+ux*1.2,h+.1,b.z+uz*1.2],h,5.2,{k:.8,top:.3});K.groundWash(cold,b.x+ux*5,b.z+uz*5,13,13,.3,.14);mastLights.push([b.x+ux*.4,h,b.z+uz*.4,dx,-h,dz]);}
  for(const id of ['bollard-1','bollard-2','bollard-3']){const b=blk(id);K.cyl(S.frame,.13,.95,[b.x,.475,b.z],{t:10});K.cyl(G('bollard',amber,.9),.135,.07,[b.x,.86,b.z],{t:10});K.groundWash(amber,b.x,b.z,1.6,1.6,.25);K.shade(b.x,b.z,.4,.4);}
  for(const id of ['barrier-1','barrier-2']){const b=blk(id),alongX=b.w>b.d,len=Math.max(b.w,b.d),yaw=alongX?0:PI/2;K.box(S.concrete,[len,.5,.46],[b.x,.25,b.z],{yaw,ao:[.5,.9],tile:2});K.box(S.concrete,[len,.42,.22],[b.x,.7,b.z],{yaw,tile:2});
   K.mark(len,.3,[b.x+(alongX?0:.235),.3,b.z+(alongX?-.235:0)],alongX?[1,0,0]:[0,0,1],[0,1,0],K.stain.hazard());K.mark(len,.3,[b.x-(alongX?0:.235),.3,b.z-(alongX?-.235:0)],alongX?[-1,0,0]:[0,0,-1],[0,1,0],K.stain.hazard());K.shade(b.x,b.z,b.w,b.d);}
  // the landing terminal: a console with a lit screen (the same words it has always carried), wired to the booth
  {const t=blk('terminal');K.box(S.frame,[.9,1.3,.6],[t.x,.65,t.z],{ao:[.5,1]});K.box(S.steel,[.96,.08,.66],[t.x,1.34,t.z]);K.box(S.dark,[.08,.62,.9],[t.x-.42,1.5,t.z]);
   K.lit(.82,.56,[t.x-.465,1.5,t.z],axFor([-1,0]),[0,1,0],(g,Wd,Ht)=>{g.fillStyle='#04080e';g.fillRect(0,0,Wd,Ht);g.textAlign='left';g.textBaseline='alphabetic';const u=Ht/176;g.fillStyle='#7ff0ff';g.font='bold '+22*u+'px monospace';g.fillText('LANDING',20*u,40*u);g.fillText('TERMINAL',20*u,66*u);g.fillStyle='#ffb347';g.font=15*u+'px monospace';g.fillText('PAD 07 · KESTREL',20*u,104*u);g.fillText('PARKING: THE FUNCTION',20*u,128*u);g.fillText('[E] CONNECT',20*u,156*u);},{px:220});
   K.groundWash('#7ff0ff',t.x-1.2,t.z,2.4,2,.25);K.tube(S.dark,[[t.x+.3,.1,t.z-.3],[t.x+.5,.06,t.z-.6],[t.x+.4,.06,t.z-.9]],.035,4);K.shade(t.x,t.z,.9,.6);}
  // street lamps on the walls, each with a pool and a cone
  const lampAt=[];
  lampAt.push(K.wallLamp(fF,7.1,5.2,sodium));lampAt.push(K.wallLamp(fA,8.6,5.0,sodium));K.wallLamp(fC,5.2,5.2,cold,{coneK:.8});K.wallLamp(fG,8.2,5.1,sodium);K.wallLamp(fH,7.4,5.0,cold,{coneK:.8});K.wallLamp(fB,9.3,5.2,sodium);K.wallLamp(fF,13.6,5.2,cold,{coneK:.7});
  // cables across the yard and the lane
  for(const [a,b,sag] of [[[13.2,12,-90],[37.4,13.5,-86.4],1.8],[[13.2,9.5,-101],[26,10.5,-105.8],1.2],[[23,14,-86.2],[33.8,9.4,-105.4],2.2],[[43.9,9,-95],[33.8,9.3,-105.4],1.4],[[43.9,8,-99.5],[37.6,9,-106],1],[[43.9,11,-103],[37.6,12,-91.9],1.3],[[13.2,15,-95],[13.5,9.3,-86.6],.8],[[37.6,15,-88],[43.9,13,-93],.7],[[43.9,7.4,-96.5],[37.6,7.8,-91.9],.5]])
   {K.cable(a,b,sag,.025+rand()*.02);K.box(S.steel,[.34,.44,.34],a);K.box(S.steel,[.34,.44,.34],b);}
  // bins and bags (built: small, and they sit against walls outside the walking lines)
  for(const [x,z] of [[13.5,-88.6],[43.6,-93.2],[37.1,-91.6],[23.4,-105.6]]){K.cyl(S.dark,.3,.9,[x,.45,z],{t:10});K.cyl(S.frame,.32,.05,[x,.92,z],{t:10});K.shade(x,z,.7,.7);}
  for(const [x,z,s] of [[13.6,-89.4,.5],[43.5,-94,.45],[36.9,-92.3,.4],[13.5,-104.2,.5],[22.6,-105.6,.45]]){const b=B.MeshBuilder.CreateSphere('port-bag',{diameter:s*1.5,segments:6},scene);b.scaling.set(1,.7,1.1);b.position.set(x,s*.42,z);K.keep(b,S.dark);}

  // ================= the food stall =================
  {const F=D.FOOD,[x0,x1,z0,z1]=F.rect,cx=(x0+x1)/2,top=2.55;
   // back wall: tiles, an extractor duct, shelves
   K.fbox(fD,S.tile,[3.9,2.6,.06],fD.len-1.95,1.3,.04,{ao:[.55,1]});K.fbox(fD,S.steel,[.5,.5,1.2],fD.len-1,3.1,.6);K.fbox(fD,S.steel,[.5,2.2,.5],fD.len-1,4.4,.3);K.fmark(fD,3.4,1.6,fD.len-1.95,2.6,K.stain.streak('rgba(40,26,10,A)'),.075);
   // counter (three sides), work top, cooking station
   K.box(wood,[x1-x0,.9,.5],[cx,.45,z0+.25],{ao:[.5,1],tile:1.5});K.box(S.steel,[x1-x0+.1,.05,.6],[cx,.93,z0+.25]);K.box(wood,[.45,.9,1.3],[x0+.22,.45,z0+1.1],{ao:[.5,1],tile:1.5});K.box(S.steel,[.5,.05,1.35],[x0+.22,.93,z0+1.1]);
   K.box(S.steel,[2.6,.86,.6],[cx+.3,.43,z1-.38],{ao:[.5,1]});K.box(S.dark,[2.6,.04,.6],[cx+.3,.88,z1-.38]);
   for(const [px,r,ph] of [[cx-.4,.24,.42],[cx+.35,.2,.36],[cx+1.0,.17,.3]]){K.cyl(S.steel,r,ph,[px,.9+ph/2,z1-.4],{t:14});K.cyl(S.dark,r*.92,.02,[px,.9+ph+.01,z1-.4],{t:14});K.steam([px,.9+ph,z1-.4],{rate:low?5:9,size:[.3,.9],life:[1.6,3],cap:50});}
   K.box(G('burner','#ff7a2a',.8),[1.5,.03,.3],[cx+.3,.9,z1-.4]);
   for(let i=0;i<7;i++){const bx=x0+.5+i*.28;K.cyl(pick([S.dark,S.rust,S.steel,S.greensheet]),.035+rand()*.02,.2+rand()*.1,[bx,1.08,z0+.38],{t:6});}
   for(let i=0;i<4;i++)K.cyl(porcelain,.09,.06+i*.012,[x1-.6,.98+i*.03,z0+.3],{t:10,top:.12});   // a stack of bowls
   K.cyl(S.rust,.17,.62,[x1-.3,.31,z1-.5],{t:10});K.cyl(S.steel,.05,.1,[x1-.3,.67,z1-.5],{t:8});   // gas cylinder
   // posts, awning, tin roof
   for(const [px,pz] of [[x0+.06,z0-.75],[x1-.06,z0-.75],[x0+.06,z1-.1],[x1-.06,z1-.1]])K.box(S.frame,[.08,top,.08],[px,top/2,pz]);
   {const aw=B.MeshBuilder.CreateBox('port-awning',{width:x1-x0+.5,height:.05,depth:3.2},scene);aw.position.set(cx,top+.12,(z0+z1)/2-.45);aw.rotation.x=-.13;K.keep(aw,canvas);}
   K.box(canvas,[x1-x0+.5,.34,.04],[cx,top-.3,z0-.98]);K.box(S.rustsheet,[x1-x0+.3,.06,1.4],[cx,top+.42,z1-.7],{tile:2});
   K.lit(x1-x0-.3,.5,[cx,top+.3,z0-1.02],axFor([0,-1]),[0,1,0],K.paint.words(['麵 · NOODLES · 麵'],'#ffd9a0',{bg:'#3a0f0c',tube:false}));
   // the board: bowls and numbers only
   K.box(S.frame,[.08,1.0,1.4],[x1-.02,1.85,z0+.9]);K.lit(1.3,.9,[x1-.07,1.85,z0+.9],axFor([-1,0]),[0,1,0],(g,Wd,Ht)=>{g.fillStyle='#120b08';g.fillRect(0,0,Wd,Ht);['12','15','9','18'].forEach((n,i)=>{const y=Ht*(i+.5)/4;g.strokeStyle='#ffcf8a';g.lineWidth=2.5;g.beginPath();g.arc(Wd*.2,y-Ht*.02,Ht*.07,0,PI);g.closePath();g.stroke();g.beginPath();for(let k=0;k<3;k++){g.moveTo(Wd*(.15+k*.05),y-Ht*.05);g.lineTo(Wd*(.15+k*.05),y-Ht*.09);}g.stroke();g.fillStyle='#ffe9c4';g.font='bold '+Ht*.16+'px monospace';g.textAlign='right';g.textBaseline='middle';g.fillText(n,Wd*.9,y);});});
   // lanterns and a bare bulb
   const lan=G('lantern','#ffffff',1);lan.emissiveTexture=K.tex('lantern',64,64,(g,Wd,Ht)=>{const gr=g.createLinearGradient(0,0,0,Ht);gr.addColorStop(0,'#3a0806');gr.addColorStop(.18,'#c8301a');gr.addColorStop(.5,'#ff7a3a');gr.addColorStop(.82,'#c8301a');gr.addColorStop(1,'#3a0806');g.fillStyle=gr;g.fillRect(0,0,Wd,Ht);g.fillStyle='rgba(60,8,4,.45)';for(let x=0;x<Wd;x+=8)g.fillRect(x,0,1.5,Ht);});lan.emissiveColor=B.Color3.Black();
   for(const lx of [x0+.6,cx,x1-.6]){const l=B.MeshBuilder.CreateSphere('port-lantern',{diameter:.36,segments:10},scene);l.scaling.y=.86;l.position.set(lx,top-.62,z0-.92);K.keep(l,lan);K.box(S.dark,[.14,.05,.14],[lx,top-.42,z0-.92]);K.box(S.dark,[.02,.14,.02],[lx,top-.36,z0-.92]);K.groundWash('#ff5a2e',lx,z0-1.2,2.2,2.2,.3);}
   K.box(G('bulb',warm,1.1),[.1,.14,.1],[cx-.6,top-.35,z0+.5]);K.cone(warm,[cx-.6,top-.4,z0+.5],top-.4,1.6,{k:.9});K.groundWash(warm,cx,z0-.6,5,3.4,.5);
   for(const [sx,sz] of F.stools){K.cyl(S.steel,.05,.6,[sx,.3,sz],{t:8});K.cyl(canvas,.18,.07,[sx,.635,sz],{t:12});K.cyl(S.steel,.16,.03,[sx,.015,sz],{t:12});K.shade(sx,sz,.5,.5);}
   K.shade(cx,(z0+z1)/2,x1-x0,z1-z0+.6,0,.8);K.light([cx,2.1,z0-.3],'#ffb070',low?0:1.5,9);}

  // ================= the public toilet =================
  let tube=null,tubeLight=null;
  {const [x0,x1,z0,z1]=W.room,h=W.height,cx=(x0+x1)/2,cz=(z0+z1)/2,t=.2,wallT=[.82,.86,.8];
   K.quad(S.tile,[cx,.012,(W.front[0]+z1)/2],[(x1-x0)/2+.2,0,0],[0,0,(z1-W.front[0])/2],[0,0,(x1-x0)/1.2,(z1-W.front[0])/1.2],[.5,.52,.48]);   // floor: the wall tile, filthy
   K.box(S.tile,[x1-x0+.4,h,t],[cx,h/2,z1+t/2],{tint:wallT,ao:[.5,1]});K.box(S.tile,[t,h,z1-z0+.2],[x0-t/2,h/2,cz],{tint:wallT,ao:[.5,1]});K.box(S.tile,[t,h,z1-z0+.2],[x1+t/2,h/2,cz],{tint:wallT,ao:[.5,1]});
   // the inside of the front wall, either side of and over the doorway, and the doorway's reveals
   const fz=z0-.01,part=(a,b,y0,y1)=>K.box(S.tile,[b-a,y1-y0,.04],[(a+b)/2,(y0+y1)/2,fz+.02],{tint:wallT,ao:[y0?1:.5,1],faces:'b'});part(x0,W.door[0],0,h);part(W.door[1],x1,0,h);part(W.door[0],W.door[1],2.3,h);
   for(const dx of W.door)K.box(S.steel,[.06,2.3,.5],[dx,1.15,-91.75]);K.box(S.steel,[W.door[1]-W.door[0],.06,.5],[(W.door[0]+W.door[1])/2,2.3,-91.75]);
   K.box(S.dark,[x1-x0+.4,.1,z1-W.front[0]],[cx,h+.05,(W.front[0]+z1)/2+.2],{faces:'d',tint:[.6,.6,.6]});   // ceiling
   // privacy screen, stall partitions and doors (raised off the floor), pans, the cleaner's cupboard
   {const [a,b,c,d]=W.screen;K.box(S.tile,[b-a,h,d-c],[(a+b)/2,h/2,(c+d)/2],{tint:wallT,ao:[.5,1]});}
   const sz=W.stallZ,part2=x=>{K.box(S.greensheet,[.05,1.85,z1-sz],[x,1.12,(sz+z1)/2],{tile:2});K.box(S.steel,[.07,.2,.07],[x,.1,sz+.1]);};
   W.stalls.forEach((st,i)=>{part2(st.x[0]);const mx=(st.x[0]+st.x[1])/2,dw=st.x[1]-st.x[0]-.5;
    K.box(S.steel,[.3,2.05,.06],[st.x[0]+.15,1.02,sz]);K.box(S.steel,[.2,2.05,.06],[st.x[1]-.1,1.02,sz]);
    if(st.door==='shut'){K.box(S.greensheet,[dw,1.75,.04],[st.x[0]+.3+dw/2,1.1,sz],{tile:2});K.box(G('wc-occupied',red,.8),[.08,.05,.02],[st.x[0]+.45,1.1,sz-.03]);}
    else{const a=st.door==='ajar'?.55:1.35;K.box(S.greensheet,[dw,1.75,.04],[st.x[0]+.3+Math.cos(a)*dw/2,1.1,sz+Math.sin(a)*dw/2],{yaw:-a,tile:2});}
    K.box(porcelain,[.42,.4,.56],[mx,.2,z1-.38],{ao:[.6,1]});K.box(porcelain,[.46,.42,.2],[mx,.62,z1-.12]);K.box(S.dark,[.4,.03,.44],[mx,.415,z1-.42]);
    K.fmark(K.face(st.x[0],z1,st.x[1],z1,0,-1),1.1,.8,.7,1.5,K.stain.tag(pick(['rgba(20,20,24,.8)','rgba(150,30,40,.7)','rgba(30,70,140,.7)'])),.01);});
   K.box(S.greensheet,[W.stalls[0].x[0]-x0,2.05,.05],[(x0+W.stalls[0].x[0])/2,1.02,sz],{tile:2});K.box(S.steel,[.05,.16,.03],[x0+.9,1.05,sz-.04]);
   // sinks, taps, a cracked mirror, a hand dryer, a bin
   {const [a,b,c,d]=W.counter;K.box(S.concrete,[b-a,.1,d-c],[(a+b)/2,.85,(c+d)/2],{tile:2});for(const z of [c+.5,(c+d)/2,d-.5]){K.box(porcelain,[.4,.14,.5],[(a+b)/2,.83,z]);K.box(S.dark,[.26,.02,.34],[(a+b)/2,.905,z]);K.box(S.steel,[.04,.16,.04],[b-.1,.98,z]);K.box(S.steel,[.14,.03,.03],[b-.16,1.05,z]);K.box(S.rust,[.05,.8,.05],[(a+b)/2,.4,z]);}
    K.box(S.frame,[.04,1.0,d-c-.1],[b-.01,1.65,(c+d)/2]);K.lit(d-c-.2,.9,[b-.035,1.65,(c+d)/2],axFor([-1,0]),[0,1,0],(g,Wd,Ht)=>{const gr=g.createLinearGradient(0,0,Wd,Ht);gr.addColorStop(0,'#1c2a2c');gr.addColorStop(.5,'#31474a');gr.addColorStop(1,'#141d20');g.fillStyle=gr;g.fillRect(0,0,Wd,Ht);g.strokeStyle='rgba(0,0,0,.85)';g.lineWidth=1.5;const ox=Wd*.62,oy=Ht*.4;for(let i=0;i<9;i++){g.beginPath();g.moveTo(ox,oy);let x=ox,y=oy;const an=i*.7+rand();for(let k=0;k<4;k++){x+=Math.cos(an+(rand()-.5)*.6)*Wd*.09;y+=Math.sin(an+(rand()-.5)*.6)*Wd*.09;g.lineTo(x,y);}g.stroke();}g.fillStyle='rgba(40,30,10,.35)';for(let i=0;i<30;i++)g.fillRect(rand()*Wd,rand()*Ht,2+rand()*6,2+rand()*5);},{px:60});}
   K.box(S.steel,[.3,.34,.2],[x0+.12,1.3,-90.6]);K.cyl(S.dark,.2,.6,[x0+.35,.3,-89.5],{t:8});
   // stains, tags (shapes, not words), a wet floor
   for(let i=0;i<7;i++)K.groundMark(1+rand()*1.6,1+rand()*1.6,x0+.6+rand()*(x1-x0-1.2),z0+.5+rand()*(z1-z0-2.4),K.stain.blot(i%2?'rgba(50,40,14,A)':'rgba(8,10,8,A)',.6),{y:.02,px:18,yaw:rand()*3});
   const fw=K.face(x0,z0,x0,z1,1,0),fe=K.face(x1,z0,x1,z1,-1,0),fn=K.face(x0,z1,x1,z1,0,-1);
   K.fmark(fw,2.2,1.1,1.6,1.5,K.stain.tag('rgba(20,20,26,.85)'),.01);K.fmark(fw,1.6,.9,3.6,1.7,K.stain.tag('rgba(160,40,60,.75)'),.01);K.fmark(fw,4.6,1.4,2.6,2.0,K.stain.streak('rgba(50,40,14,A)'),.012);K.fmark(fe,3,1.2,3.6,2.1,K.stain.streak('rgba(50,40,14,A)'),.012);K.fmark(fn,1,1.6,.6,1.9,K.stain.streak('rgba(40,34,12,A)'),.012);
   {const [a,b,c,d]=W.screen;K.fmark(K.face(a,c,a,d,-1,0),1.5,.8,.95,1.5,K.stain.tag('rgba(30,90,60,.75)'),.01);}
   for(const [px,pz,rx,rz] of [[41.2,-89.2,.9,.5],[42.4,-90.6,.6,.8],[39.2,-90.3,.5,.9]])K.quad(wet.puddle,[px,.024,pz],[rx,0,0],[0,0,rz]);
   // one tube that works (and flickers), one that is dead
   tube=B.MeshBuilder.CreateBox('port-wc-tube',{width:1.3,height:.05,depth:.09},scene);tube.position.set(41.6,h-.06,-89.1);tube.parent=K.node;tube.isPickable=false;tube.material=G('wc-tube','#d6ffe6',1.1);K.box(S.steel,[1.4,.05,.16],[41.6,h-.02,-89.1]);K.box(S.steel,[1.4,.05,.16],[39.3,h-.02,-90.4]);K.box(S.dark,[1.3,.04,.09],[39.3,h-.06,-90.4]);
   K.groundWash('#bfffd8',41.4,-89.4,4.4,3.6,.34,.03);K.wallWash(fn,'#bfffd8',3.2,1.7,4,2.4,.2);K.wallWash(fEs,'#bfffd8',W.door[0]+.65-LX0,1.2,1.6,2.6,.25);K.groundWash('#bfffd8',39.3,-92.6,2,1.6,.25);
   tubeLight=K.light([41.6,h-.3,-89.3],'#c8ffe0',1.1,7.5);}

  // ================= real lamps (Medium and up) =================
  for(const [x,y,z,dx,dy,dz] of mastLights.slice(0,2))K.light([x,y,z],cold,2.1,34,{spot:{dir:[dx,dy,dz],angle:1.45,exp:1.2}});
  if(lampAt[0])K.light([lampAt[0][0],4.8,lampAt[0][2]],sodium,1.3,15);if(lampAt[1])K.light([lampAt[1][0],4.6,lampAt[1][2]],sodium,1.1,14);

  // ================= steam from the roofs and a street vent =================
  K.steam([30,31.5,-80],{rate:6,size:[2,6],life:[5,9],up:.7,alpha:.1,cap:70});K.steam([4,27.5,-92],{rate:5,size:[2,5],life:[5,9],up:.7,alpha:.09,cap:60});K.steam([39.2,.1,-98.5],{rate:7,size:[.6,2.2],life:[2.5,4.5],up:.5,alpha:.1,cap:50});

  // ================= people: a vendor, a customer, and sometimes someone in the toilet =================
  // Existing street figures with their existing clips; nobody speaks and nobody can be talked to.
  const CAST=root.VoidAlley?.CAST||['ncz-neon','fixer-01','hacker-01','outlaw-01','district-resident'],clipsOf=look=>root.VoidCrowd?.clips?.[look]||['idle'];
  function person(id,want,[x,y,z],yaw,after){const looks=CAST.filter(c=>clipsOf(c).includes(want)),look=(looks.length?looks:CAST)[(visits+people.length*3)%(looks.length||CAST.length)];people.push({id,look,clip:clipsOf(look).includes(want)?want:'idle',x,y,z,yaw,after,node:null,anim:null});}
  if(instance){
   person('port-vendor','idle',[D.FOOD.vendor[0],0,D.FOOD.vendor[1]],D.FOOD.vendor[2]);
   if(!low)person('port-customer','sit',[D.FOOD.customer[0],.02,D.FOOD.customer[1]],D.FOOD.customer[2]);
   const day=Math.floor(Date.now()/864e5),who=D.passedOut(day,visits+(state?.story?.flags?.shipAccess==='none'?0:1));
   if(who){const st=W.stalls[W.slumpStall],mx=(st.x[0]+st.x[1])/2;
    if(who.where==='stall')person('port-slumped','sit',[mx+.08,-.02,W.room[3]-.52],PI,p=>{p.node.rotation.z=.3;p.node.rotation.x=.22;p.freeze=1.2;});
    else person('port-floor','sit',[W.floorSpot[0],.08,W.floorSpot[1]],W.floorSpot[2],p=>{p.node.rotation.x=-1.15;p.node.rotation.z=.12;p.freeze=.8;});}}
  let asked=false;
  function spawn(p){let node=null;try{node=instance('crowd:'+p.look,K.node);}catch{}if(!node&&clock>12){const alt=CAST.find(c=>clipsOf(c).includes(p.clip)&&(node=instance('crowd:'+c,K.node)));if(alt)p.look=alt;}
   if(!node)return;node.metadata={...node.metadata,crowd:p.look,port:p.id};p.node=node;node.position.set(p.x,p.y,p.z);node.rotation.y=p.yaw;p.anim=root.VoidCrowd?.animate?.(node,p.look,p.clip)||null;p.after?.(p);for(const m of node.getChildMeshes())K.mirror(m);}

  const made=K.finish();
  // the ship, and the customs gatehouse, are other builders' meshes: they are looked up once they exist so the wet ground shows them too
  let mirrored=false;
  // the Port's air is thicker than the old street's: the far towers sink into it, so the layers of the city read apart (put back by neochinatown.js on leaving)
  const FOG=low?.0062:.0075;
  function tick(dt,time){if(disposed)return;clock+=dt;K.tick(dt,time);if(scene.fogDensity!==FOG&&scene.fogMode)scene.fogDensity=FOG;
   if(!asked&&clock>3&&typeof mode!=='undefined'&&mode==='walking'){asked=true;for(const look of new Set(people.map(p=>p.look)))try{Promise.resolve(root.VoidCharacterAssembler?.ensureLook?.(look,scene)).catch(()=>{});}catch{}}
   for(const p of people){if(!p.node){spawn(p);continue;}if(p.freeze>0){p.freeze-=dt;if(p.freeze<=0){try{p.anim?.setActive?.(false);}catch{}}}}
   if(!mirrored&&clock>2&&K.mirrorTexture){mirrored=true;for(const m of scene.meshes){const n=m.name||'';if(/^gate-/.test(n)&&m.isEnabled())K.mirror(m);else{let a=m.parent;while(a&&!a.metadata?.landed)a=a.parent;if(a)K.mirror(m);}}}
   if(tube){const on=!(Math.sin(time*37)>.72&&Math.sin(time*5.3)>.2)&&!(time%11<.18);tube.isVisible=on;if(tubeLight)tubeLight.intensity=on?tubeLight.metadata.base:.15;}}
  function dispose(){if(disposed)return;disposed=true;for(const p of people){try{p.anim?.dispose?.();}catch{}try{p.node?.dispose?.();}catch{}p.node=null;}K.dispose();}
  return {replaces,tick,dispose,mounts,frontages:D.FRONTAGES,kit:K,people,made,stats:()=>({meshes:made.length,props:[...K.props.values()].map(s=>s.id+':'+s.placed.length+(s.ready?'':' (pending)')),people:people.map(p=>p.id+':'+p.look+':'+(p.node?'in':'waiting')),lights:K.lights.length})};
  }catch(e){for(const p of people){try{p.node?.dispose?.();}catch{}}try{K.dispose();}catch{}throw e;}
 }
 /* PARKED (16 Nov 2026): the Port remake is unfinished work in progress and is switched OFF. Set enabled to true (here, or in the console before entering the
    Port) to build it; while it is false the old Port is built and the Port's collision is the old one. */
 root.VoidPort={build,replaces,COVER,enabled:false,get mounts(){return D.MOUNTS;},get frontages(){return D.FRONTAGES;}};
})(typeof globalThis!=='undefined'?globalThis:this);
