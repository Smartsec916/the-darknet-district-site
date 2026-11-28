/* LOW QUAY: the main alley and the food court (the owner's request, 27 Nov 2026).
   - The main alley runs straight north from the subway stairs (x -15..-10). Along its EAST side, the ground floor of the buildings is a row of shallow lit booths behind
     tinted glass, softly lit red (BOOTH_LIGHT, owner 28 Nov 2026), curtains half drawn; each has floor space for a dancer to be added later. No people are added here.
     WINDOW_ANCHORS lists, per window, where a dancer would stand and which way she faces (yaw, radians; 0 = facing +z, -PI/2 = facing -x, i.e. out to the alley);
     that facing is the default (WINDOW_YAW), changeable per anchor (windowAnchors).
   - At the alley's north end (the end opposite the station) it opens into a food court: an open plaza of instanced food stalls, shared tables and stools, hanging coloured
     lanterns, abstract glowing signs (no text), steam from the cookers. Stairs on the west and east sides lead up to an elevated walkway that wraps the west, north
     and east sides of the plaza under a canopy (steel frame, translucent panels), with railings overlooking the court and coloured lamps under the canopy.
   Pedestrian only; coloured light only. The layout, the walk height and the collision are plain data (Node-tested, tests/low-quay-court.test.cjs). */
(function(root){
 'use strict';
 // Metres, Low Quay's own space, measured from the quay city's ground (CITY_Y above the tarmac).
 const ALLEY={x0:-15,x1:-10,z0:318,z1:410};
 const BOOTH={depth:2.6,height:3.6,width:3,pitch:4.5};   // the ground floor of the east-side buildings is set back BOOTH.depth for the booths
 const EAST_FACES=[[332,354],[358,384],[388,410]];          // the east-side blocks' faces on the alley (z ranges), all at x = ALLEY.x1
 // The booths' light (owner, 28 Nov 2026: red, dim and sensual): one colour for the set, a default and not a rule. BOOTH_LIGHT.windows overrides it per window
 // (index -> '#rrggbb'). It drives only the booths' own lit back wall, curtain glow, light strip and floor glow; no other Low Quay light reads it. Never white.
 const BOOTH_LIGHT={color:'#8a0f2a',windows:{}};
 const boothColor=i=>BOOTH_LIGHT.windows[i]||BOOTH_LIGHT.color;
 const WINDOWS=[];EAST_FACES.forEach(([a,b])=>{const n=Math.floor((b-a-1)/BOOTH.pitch),start=a+(b-a-n*BOOTH.pitch)/2+BOOTH.pitch/2;for(let i=0;i<n;i++)WINDOWS.push({z:start+i*BOOTH.pitch});});
  // The facing is a default, not a rule (owner, 27 Nov 2026): WINDOW_YAW faces out to the alley; windowAnchors(yaw) builds the same anchors with another facing
 // (one value, or a function of the window's index), so a dancer added later can face any way the owner chooses. The tint is the booth's coloured light (never white).
 const WINDOW_YAW=-Math.PI/2;
 const windowAnchors=(yaw=WINDOW_YAW)=>WINDOWS.map((w,i)=>{const y=typeof yaw==='function'?yaw(i,w):yaw;return {id:'alley-window-'+i,x:ALLEY.x1+BOOTH.depth*.55,z:w.z,yaw:y,faces:y===WINDOW_YAW?'-x (out to the alley)':'custom',floor:'quay level (CITY_Y)',tint:boothColor(i)};});
 const WINDOW_ANCHORS=windowAnchors();
 const PLAZA={x0:-26,x1:22,z0:412,z1:451.5},U=4.5,BAND=4;   // the walkway is U above the court; bands BAND wide on the west, north and east
 const STAIR={z0:413,z1:425};                                 // the two flights (west and east bands) rise from z0 to z1
 const W_BAND=[PLAZA.x0-BAND,PLAZA.x0],E_BAND=[PLAZA.x1,PLAZA.x1+BAND],N_BAND=[PLAZA.z1,PLAZA.z1+BAND+1];   // the north band runs to the scene's edge (z 456)
 // Food stalls along the foot of the walkway (facing into the court), shared tables in the middle.
 const STALLS=[...[430,437,444].map(z=>({x:PLAZA.x0+1.1,z,yaw:Math.PI/2})),...[430,437,444].map(z=>({x:PLAZA.x1-1.1,z,yaw:-Math.PI/2})),...[-18,-10,6,14].map(x=>({x,z:PLAZA.z1-1.1,yaw:Math.PI}))];
 const TABLES=[];for(const x of [-15,-5,5])for(const z of [420,428,436,444])if(!(x===-5&&z===420))TABLES.push({x,z});
 const inBand=(x,z)=>(x>=W_BAND[0]&&x<W_BAND[1]&&z>=PLAZA.z0&&z<N_BAND[1])||(x>=E_BAND[0]&&x<E_BAND[1]&&z>=PLAZA.z0&&z<N_BAND[1])||(z>=N_BAND[0]&&z<N_BAND[1]&&x>=W_BAND[0]&&x<E_BAND[1]);
 // Walk height above the quay ground: 0 in the court and the alleys, U on the walkway, a straight ramp on the two flights.
 function heightAt(x,z){if(!inBand(x,z))return 0;if(z>=N_BAND[0])return U;return z<=STAIR.z0?0:z>=STAIR.z1?U:U*(z-STAIR.z0)/(STAIR.z1-STAIR.z0);}
 const inCourt=(x,z)=>x>=W_BAND[0]&&x<E_BAND[1]&&z>=PLAZA.z0-2&&z<N_BAND[1];
 function solids(){const S=[],W=(id,x0,x1,z0,z1,h=1.1)=>S.push({id:'court-'+id,position:[(x0+x1)/2,h/2,(z0+z1)/2],size:[x1-x0,h,z1-z0]});
  // railings on the walkway's inner edge (open at the foot of each flight), and the bands' outer sides
  W('rail-w',PLAZA.x0-.3,PLAZA.x0,STAIR.z0+.6,PLAZA.z1);W('rail-e',PLAZA.x1,PLAZA.x1+.3,STAIR.z0+.6,PLAZA.z1);W('rail-n',PLAZA.x0-.3,PLAZA.x1+.3,PLAZA.z1,PLAZA.z1+.3);
  W('out-e',E_BAND[1],32,PLAZA.z0-2,460,6);W('out-w-foot',W_BAND[0]-.6,W_BAND[0],PLAZA.z0-2,PLAZA.z0,6);
  // the flights' side walls toward the plaza's south strip (the foot of each flight is open to the south)
  STALLS.forEach((s,i)=>{const along=Math.abs(Math.sin(s.yaw))>.5;W('stall-'+i,s.x-(along?.8:1.7),s.x+(along?.8:1.7),s.z-(along?1.7:.8),s.z+(along?1.7:.8),1.2);});
  TABLES.forEach((t,i)=>W('table-'+i,t.x-.5,t.x+.5,t.z-1.6,t.z+1.6,.8));
  return S;}
 const api={ALLEY,BOOTH,EAST_FACES,BOOTH_LIGHT,boothColor,WINDOWS,WINDOW_YAW,windowAnchors,WINDOW_ANCHORS,PLAZA,U,BAND,STAIR,W_BAND,E_BAND,N_BAND,STALLS,TABLES,inBand,heightAt,inCourt,solids};
 if(typeof module!=='undefined'&&module.exports){module.exports=api;return;}

 // ================= browser: the build (called from low-quay-city.js with its helpers; the quay ground is at Y) =================
 api.build=function(c){
  const {B,scene,parent,K,place,mat,glow,tex,sprite,owned,steel,dark,concD,conc,amber,Y,quality}=c,low=quality==='low',P=Math.PI,mid=(a,b)=>(a+b)/2;
  const S=K();
  // ---------- the alley windows: one built booth per booth colour (boothColor), placed along the east side ----------
  const {depth:bd,height:bh,width:bw,pitch}=BOOTH,X=ALLEY.x1;
  const frameM=mat('court-frame','#1a1418',{spec:.4,pow:60}),wallM=mat('court-booth-wall','#120c12',{spec:.1}),glassM=new B.StandardMaterial('lq-court-glass',scene);
  glassM.diffuseColor=B.Color3.FromHexString('#120a14');glassM.alpha=.32;glassM.specularColor=new B.Color3(.7,.5,.7);glassM.specularPower=140;glassM.backFaceCulling=false;owned.push(glassM);
  const colours=[...new Set(WINDOWS.map((w,i)=>boothColor(i)))],boothKits=colours.map((hex,k)=>{const t=tex('court-booth-'+k,256,256,(g,w,h)=>{const gr=g.createRadialGradient(w*.5,h*.62,8,w*.5,h*.6,w*.7);gr.addColorStop(0,hex);gr.addColorStop(.45,hex+'aa');gr.addColorStop(1,'#12060e');g.fillStyle=gr;g.fillRect(0,0,w,h);});
    const back=new B.StandardMaterial('lq-court-boothback-'+k,scene);back.diffuseColor=B.Color3.Black();back.emissiveTexture=t;back.disableLighting=true;back.specularColor=B.Color3.Black();t.level=1.8;owned.push(back);
    const cur=tex('court-curtain-'+k,128,256,(g,w,h)=>{g.clearRect(0,0,w,h);for(let x=0;x<w;x+=8){const a=.35+.3*Math.sin(x*.4);g.fillStyle='rgba(60,12,40,'+a.toFixed(2)+')';g.fillRect(x,0,8,h);}},true);
    const curM=new B.StandardMaterial('lq-court-curtain-'+k,scene);curM.diffuseTexture=cur;curM.useAlphaFromDiffuseTexture=true;curM.emissiveColor=B.Color3.FromHexString(hex).scale(.45);curM.specularColor=B.Color3.Black();curM.backFaceCulling=false;owned.push(curM);
    const strip=glow('court-strip-'+k,hex,1.1),floorGlow=sprite('court-floor-'+k,tex('court-floorglow-'+k,128,128,(g,w,h)=>{const gr=g.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,hex+'88');gr.addColorStop(1,hex+'00');g.fillStyle=gr;g.fillRect(0,0,w,h);},true),true);
    const k2=K();
    k2.box(wallM,.1,bh,bw,bd-.05,bh/2,0);k2.plane(back,bw-.1,bh-.4,bd-.11,bh/2,0,-P/2);                                  // the lit back wall (faces the alley, -x)
    for(const s of [-1,1])k2.box(wallM,bd,bh,.1,bd/2,bh/2,s*bw/2);k2.box(wallM,bd,.1,bw,bd/2,bh-.05,0);k2.box(mat('court-booth-floor','#1a0e14',{spec:.5,pow:80}),bd,.06,bw,bd/2,.03,0);
    k2.box(glassM,.04,bh-.75,bw-.1,.06,.25+(bh-.75)/2,0);for(const s of [-1,1])k2.plane(curM,.9,bh-.8,.35,.3+(bh-.8)/2,s*(bw/2-.5),-P/2);   // the glass, the curtains drawn to the sides
    k2.box(strip,.05,.04,bw-.2,.12,bh-.42,0);k2.box(frameM,.2,.25,bw,.05,.12,0);k2.plane(floorGlow,2.4,2.4,bd*.5,.08,0,0,P/2);
    return k2.done('court-booth-'+k);});
  const pier=K();pier.box(frameM,bd+.1,bh+.4,pitch-bw,(bd+.1)/2-.05,(bh+.4)/2,0);const pierKit=pier.done('court-pier');
  for(const [a,b] of EAST_FACES){S.box(frameM,bd+.1,.4,b-a,X+(bd+.1)/2-.05,Y+bh+.2,mid(a,b));}   // the lintel over the row
  WINDOWS.forEach((w,i)=>{place(boothKits[colours.indexOf(boothColor(i))],X,Y,w.z);place(pierKit,X,Y,w.z+pitch/2);if(i===0||WINDOWS[i-1].z<w.z-pitch-1)place(pierKit,X,Y,w.z-pitch/2);});
  // the face ends beyond the first and last window of each block
  for(const [a,b] of EAST_FACES){const ws=WINDOWS.filter(w=>w.z>a&&w.z<b),lo=ws[0].z-pitch/2,hi=ws[ws.length-1].z+pitch/2;if(lo-a>.05)S.box(frameM,bd+.1,bh+.4,lo-a,X+(bd+.1)/2-.05,Y+(bh+.4)/2,mid(a,lo));if(b-hi>.05)S.box(frameM,bd+.1,bh+.4,b-hi,X+(bd+.1)/2-.05,Y+(bh+.4)/2,mid(hi,b));}
  // ---------- the food court ----------
  const {x0,x1,z0,z1}=PLAZA,yU=Y+U,plinth=mat('court-plinth','#2a2228',{spec:.15}),deck=mat('court-deck','#3a3438',{spec:.4,pow:60});
  // the walkway: a plinth from the ground to the deck (stalls stand at its foot), the deck on top; the flights rise as a stepped ramp
  const band=(a0,a1,b0,b1)=>{S.box(plinth,a1-a0,U-.05,b1-b0,mid(a0,a1),Y+(U-.05)/2,mid(b0,b1));S.box(deck,a1-a0,.1,b1-b0,mid(a0,a1),yU-.05,mid(b0,b1));};
  for(const [a0,a1] of [W_BAND,E_BAND]){band(a0,a1,STAIR.z1,N_BAND[0]);const n=18,run=(STAIR.z1-STAIR.z0)/n;for(let i=0;i<n;i++){const h=U*(i+1)/n;S.box(plinth,a1-a0,h,run,mid(a0,a1),Y+h/2,STAIR.z0+run*(i+.5));if(i%3===2)S.box(amber,a1-a0,.03,.05,mid(a0,a1),Y+h+.015,STAIR.z0+run*i+.03);}
   S.box(plinth,a1-a0,.02,STAIR.z0-z0+.1,mid(a0,a1),Y+.01,mid(z0,STAIR.z0));}
  band(W_BAND[0],E_BAND[1],N_BAND[0],N_BAND[1]);
  // railings on the inner edge (posts, a top rail, a glass infill) and along the flights
  const rk=K();rk.box(steel,.08,1.05,.08,0,.52,0);rk.box(steel,.06,.06,3,0,1.05,1.5);rk.box(glassM,.03,.8,2.9,0,.5,1.5);const railKit=rk.done('court-rail');
  for(let z=STAIR.z1;z<z1-.5;z+=3){place(railKit,x0-.15,yU,z);place(railKit,x1+.15,yU,z);place(railKit,W_BAND[0]+.15,yU,z);place(railKit,E_BAND[1]-.15,yU,z);}   // inner and outer edges
  for(let x=x0;x<x1;x+=3)place(railKit,x,yU,z1+.15,P/2);
  for(const xx of [x0-.15,x1+.15]){const len=Math.hypot(STAIR.z1-STAIR.z0-.6,U*(1-.6/(STAIR.z1-STAIR.z0)));const r=S.box(steel,.06,.06,len,xx,Y+U*(.5+.3/(STAIR.z1-STAIR.z0))+1.05,mid(STAIR.z0+.6,STAIR.z1),0,-Math.atan2(U*(1-.6/(STAIR.z1-STAIR.z0)),STAIR.z1-STAIR.z0-.6));}
  // the canopy: posts on both edges of each band, a frame, translucent panels, coloured lamps beneath
  const panelM=new B.StandardMaterial('lq-court-panel',scene);panelM.diffuseColor=B.Color3.FromHexString('#2a1a3a');panelM.alpha=.5;panelM.emissiveColor=B.Color3.FromHexString('#1a0a22');panelM.specularColor=new B.Color3(.5,.4,.6);panelM.backFaceCulling=false;owned.push(panelM);
  const lampCols=[glow('court-lamp-a','#ff5a2a',1.2),glow('court-lamp-b','#ff3fa6',1.2),glow('court-lamp-c','#9a4dff',1.1),glow('court-lamp-d','#ffae5c',1.2)];
  const ck=K();ck.box(steel,.14,3.2,.14,-BAND/2+.2,1.6,0);ck.box(steel,.14,3.4,.14,BAND/2-.2,1.7,0);ck.box(steel,BAND+.3,.12,.14,0,3.3,0,0,0,.06);ck.box(panelM,BAND+.6,.04,3.1,0,3.42,0,0,0,.06);const canopy=ck.done('court-canopy');
  const lamps=lampCols.map((m,k)=>{const lk=K();lk.box(steel,.02,.5,.02,0,3.05,0);lk.cyl(m,.16,.28,0,2.7,0,12);return lk.done('court-canopy-lamp-'+k);});
  let li=0;for(let z=STAIR.z1+1;z<N_BAND[0];z+=3){place(canopy,mid(...W_BAND),yU,z,P);place(canopy,mid(...E_BAND),yU,z);place(lamps[li++%4],mid(...W_BAND),yU,z);place(lamps[li++%4],mid(...E_BAND),yU,z);}
  for(let x=W_BAND[0]+1.5;x<E_BAND[1]-1;x+=3){place(canopy,x,yU,mid(...N_BAND),-P/2);place(lamps[li++%4],x,yU,mid(...N_BAND));}
  // food stalls: a counter, a back unit, a cooker with a glowing hob, an awning frame with a coloured strip, an abstract glowing sign
  const stM=mat('court-stall','#3a2a22',{spec:.2}),ssM=mat('court-steel','#7a7880',{spec:.9,pow:120}),hob=glow('court-hob','#ff4a14',1.2);
  const signTex=tex('court-signs',512,128,(g,w,h)=>{g.fillStyle='#0a0610';g.fillRect(0,0,w,h);const cols=['#ff3fa6','#ffae5c','#25c9c2','#ff5a2a'];cols.forEach((c,i)=>{g.strokeStyle=c;g.lineWidth=7;g.shadowColor=c;g.shadowBlur=14;const x0=i*128+16;g.beginPath();g.arc(x0+28,h/2,24,0,7);g.stroke();g.beginPath();g.moveTo(x0+62,h*.3);g.lineTo(x0+108,h*.3);g.moveTo(x0+62,h*.55);g.lineTo(x0+96,h*.55);g.moveTo(x0+62,h*.8);g.lineTo(x0+104,h*.8);g.stroke();});});
  const signMs=[0,1,2,3].map(k=>{const m=new B.StandardMaterial('lq-court-sign-'+k,scene);m.diffuseColor=B.Color3.Black();m.emissiveTexture=signTex;m.disableLighting=true;m.specularColor=B.Color3.Black();owned.push(m);return [m,new B.Vector4(k/4,0,(k+1)/4,1)];});
  const stallKits=signMs.map(([sm,uv],k)=>{const s=K();s.box(stM,3.2,1.05,.8,0,.52,0);s.box(ssM,3.3,.05,.9,0,1.07,0);s.box(stM,3.2,2.2,.5,0,1.1,-1.2);s.box(ssM,1.2,.06,.6,.7,1.12,-.8);s.cyl(hob,.18,.02,.7,1.16,-.8,14);s.cyl(ssM,.2,.18,.7,1.25,-.8,14);
   for(const sx of [-1,1])s.box(steel,.06,2.6,.06,sx*1.55,1.3,.4);s.box(steel,3.2,.06,.06,0,2.6,.4);s.box(lampCols[k],3.1,.05,.05,0,2.55,.45);s.plane(sm,2,.5,0,2.95,.42,P,0,uv);return s.done('court-stall-'+k);});
  STALLS.forEach((st,i)=>place(stallKits[i%4],st.x,Y,st.z,st.yaw));
  // shared tables: a long table with six stools
  const tk=K();tk.box(mat('court-table','#2a1e1a',{spec:.3}),1,.06,3.2,0,.76,0);for(const sz of [-1.3,1.3])tk.box(steel,.8,.72,.06,0,.37,sz);for(const sx of [-.85,.85])for(const sz of [-1.1,0,1.1]){tk.cyl(ssM,.18,.05,sx,.48,sz,12);tk.cyl(steel,.03,.46,sx,.23,sz,6);}const tableKit=tk.done('court-table');
  TABLES.forEach(t=>place(tableKit,t.x,Y,t.z));
  // the court floor: wet paving tinted by the lamps (painted washes)
  const wash=(rgb,a)=>sprite('court-wash-'+rgb,tex('court-wash-'+rgb.replace(/,/g,'-'),128,128,(g,w,h)=>{const gr=g.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,'rgba('+rgb+','+a+')');gr.addColorStop(1,'rgba('+rgb+',0)');g.fillStyle=gr;g.fillRect(0,0,w,h);},true),true);
  const washes=[wash('255,90,40',.35),wash('255,63,166',.3),wash('154,77,255',.3),wash('255,174,92',.32)];
  const flat=(m,w,h,x,y,z)=>{const p=B.MeshBuilder.CreatePlane('lq-court-wash',{width:w,height:h},scene);p.material=m;p.position.set(x,y,z);p.rotation.x=P/2;p.parent=parent;p.isPickable=false;owned.push(p);};
  STALLS.forEach((st,i)=>flat(washes[i%4],5,5,st.x+Math.sin(st.yaw)*1.4,Y+.03,st.z+Math.cos(st.yaw)*1.4));TABLES.forEach((t,i)=>flat(washes[(i+1)%4],4,5,t.x,Y+.03,t.z));
  // hanging lanterns on cables across the court (one built lantern per colour, instanced)
  const lan=lampCols.map((m,k)=>{const l=K();l.cyl(m,.22,.42,0,0,0,10);l.cyl(dark,.24,.05,0,.23,0,10);l.cyl(dark,.24,.05,0,-.23,0,10);return l.done('court-lantern-'+k);});
  for(let r=0;r<5;r++){const z=418+r*7.4;S.box(dark,x1-x0,.02,.02,mid(x0,x1),Y+5.2,z);for(let x=x0+2;x<x1-1;x+=3.2){const sag=Math.sin((x-x0)/(x1-x0)*P);place(lan[(r+Math.round(x))%4&3],x,Y+4.95-sag*.9,z);}}
  // steam over the cookers: soft sprites that rise and fade in a loop
  const steamTex=tex('court-steam',64,64,(g,w,h)=>{const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(200,170,190,.32)');gr.addColorStop(1,'rgba(200,170,190,0)');g.fillStyle=gr;g.fillRect(0,0,w,h);},true),steamM=sprite('court-steam',steamTex,false);steamM.alpha=.8;
  const puffs=[];if(!low)STALLS.forEach((st,i)=>{const cx=st.x+Math.cos(st.yaw)*.7+Math.sin(st.yaw)*(-.8),cz=st.z-Math.sin(st.yaw)*.7+Math.cos(st.yaw)*(-.8);for(let k=0;k<3;k++){const p=B.MeshBuilder.CreatePlane('lq-court-steam',{size:.9},scene);p.material=steamM;p.billboardMode=B.Mesh.BILLBOARDMODE_ALL;p.parent=parent;p.isPickable=false;owned.push(p);puffs.push({p,x:cx,z:cz,ph:k/3+i*.13});}});
  S.done('court-static').forEach(m=>{m.isVisible=true;});   // the merged static parts are drawn (kits are hidden instancing sources)
  return {tick(time){const t=time||0;for(const f of puffs){const u=(t*.25+f.ph)%1;f.p.position.set(f.x+Math.sin(u*6+f.ph*9)*.15,Y+1.3+u*2.2,f.z);f.p.scaling.setAll(.6+u*1.6);f.p.visibility=Math.sin(u*P)*.9;}}};
 };
 root.VoidLowQuayCourt=api;
})(globalThis);
