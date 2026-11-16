/* Old Town, the alley-corner block on Main Street (16 Nov 2026, docs/development/NEOCHINATOWN_REMAKE.md): the ONE block built to the art-direction pass.
   David: "build one continuous block to match [the paint-over], verify the building joins in the running game ... Let's judge that block before applying
   the style district-wide."
     build({B,scene,parent,quality}) -> {replaces(name,p), tick(dt,time), dispose(), kit}      called by neochinatown.js for Old Town only.
   The block is Main Street's EAST side from Milked's side street to the North Gate (x 71, z -68.5 to -20), with the alley passing under a bridge of flats.
   Existing assets only: the game's own wall, metal, paving and facade textures (assets/textures/ncz), its sign names and its lamp and light-pool style, put
   together with the city kit (ncz-kit.js); the kit's modelled props are NOT used here (plain built AC units and balconies stand in).
   What it sets, for the rest of the city to follow if David approves:
     - STOREFRONT ALIGNMENT  one street wall on the street line; every unit between piers under one lintel at 4.2 m; one sign band (3.3 to 3.9 m, under the canopy); one
                             canopy line; doors and shutters in a steady rhythm; buildings of different height and surface that meet on shared party walls.
     - LIGHTING PALETTE      PALETTE below: warm sodium lamps on the pavement, teal fill from the sky and the fog, restrained sign accents, warm window light.
     - THE LANDMARK          the Lantern Bridge: flats built across the alley mouth with a lit window band, a row of red lanterns under it and a tall
                             chevron light on its corner. It is the only thing that crosses an opening on the street, and the warmest spot on it.
   Walkable space, collision, the alley, the District's door, NULL, the taxi stop and every interaction are untouched: this file draws, it does not change
   the layout. The city blocks behind stay solid and opaque (street-sight.js). When this file is missing or throws, neochinatown.js builds the block as before. */
(function(root){
 'use strict';
 const PI=Math.PI;
 // The frontage, and the old plots it stands in for.
 const X=71,Z0=-68.5,Z1=-20,ALLEY=[-61.6,-55.5],DEPTH=12,ZONE=[70.3,83.05,-68.62,-19.9],FRONT=[67.4,71.35,-68.5,-26];
 const PALETTE={sodium:'#ffb35c',window:'#f0bd80',teal:'#3fb8c4',lantern:'#ff5a2e',pink:'#ff5fb0',fog:'#13272b'};
 /* The buildings, south to north: [id, z from, z to, height, surface, tint index]. They share party walls: where one ends the next begins. */
 const UNITS=[['corner-south',Z0,ALLEY[0],16.5,'brick',3],['bridge',ALLEY[0],ALLEY[1],15,'plate',6],['corner-north',ALLEY[1],-43.7,22,'concrete',2],['mid',-43.7,-31.8,17.5,'mold',4],['gate-end',-31.8,Z1,25,'bluesheet',0]];
 // The street walls this block makes, and its intentional opening, for the gap check (the same form as VoidPortData.WALLS / OPENINGS).
 const WALLS=[{id:'main-east-block',a:[X,Z1-6],b:[X,Z0],normal:[-1,0],height:15,depth:.6},{id:'alley-mouth-south',a:[X,ALLEY[0]],b:[X+6,ALLEY[0]],normal:[0,1],height:5,depth:.6},{id:'alley-mouth-north',a:[X+6,ALLEY[1]],b:[X,ALLEY[1]],normal:[0,-1],height:5,depth:.6},
  {id:'milked-street-side',a:[80.6,Z0],b:[X,Z0],normal:[0,-1],height:15,depth:.6}];
 const OPENINGS=[{id:'alley-mouth',wall:'main-east-block',from:(Z1-6)-ALLEY[1],to:(Z1-6)-ALLEY[0],height:5.2,depth:70,note:'the alley: 6.1 m wide, open under the bridge to 5.2 m; it runs 65 m east to the District'}];
 const within=(r,x,z)=>x>=r[0]&&x<=r[1]&&z>=r[2]&&z<=r[3];
 const KEEP=/^(alley|district|dumpster|club|milked|billboard|kiosk|sidewalk|cable|lane-mark|puddle|city-ground|ironeye|crew|gate|taxi)/;
 /* Does this block stand in for a piece of the old street build? The old plots and everything on their roofs; and, on the street front, the old
    storefront strip, awnings, shop signs, blade signs, wall lamps and their light pools. Never the alley's own brick walls and fittings, the pavement, the
    advertisement boards and kiosks (the screens work's), cables, or anything in another street. */
 function replaces(name,p){const n=name||'',x=p[0],z=p[2];
  // the one piece of the alley's brick that is not in the alley: the first alley building's side wall, which runs 8 m up Main Street on this block's street line
  if(n==='alley-building-side'&&Math.abs(x-X)<.3&&z>ALLEY[1]&&z<ALLEY[1]+9)return true;
  if(KEEP.test(n))return false;
  const inAlley=z>ALLEY[0]-.45&&z<ALLEY[1]+.45;
  if(within(ZONE,x,z)&&!(inAlley&&x>X+.25)&&(/^(old-building|batch|water-tank|dish|tower|antenna|roof)/.test(n)&&x>=X-.2||x>=X-.05))return true;
  if(within(FRONT,x,z)&&!inAlley)return /^(storefront|awning|shop-sign|blade|floor-wash|wall-wash|batch)/.test(n)&&(n!=='batch'||x>70.3);
  return false;}
 function build({B,scene,parent,quality}){
  const K=root.VoidCityKit.create({B,scene,parent,quality,name:'ncz-block',models:false}),{S,low,rand,pick}=K,T=K.TINTS,P=PALETTE;let disposed=false;K.reseed(51515);
  try{
  const surfOf=k=>S[k];
  // the game's own shop names (neochinatown.js shopSigns / blades): nothing new is named here
  const SIGNS=[[['藥房','PHARMACY 24H'],'#6cff9e'],[['茶','TEA HOUSE'],'#ffb347'],[['REPAIR · 修理'],'#7ff0ff'],[['電子','ELECTRONICS'],'#9b7bff'],[['LAUNDRY'],'#e8f0ff'],[['龍麵館','DRAGON NOODLES'],'#ffcf5a'],[['夜市','NIGHT MARKET'],'#ff5bd0']];let signAt=0;
  const axFor=d=>[-d[1],0,d[0]];
  // ---- the buildings ----
  const faces={};
  for(const [id,za,zb,h,surf,ti] of UNITS){if(id==='bridge')continue;const wall=surfOf(surf),tint=T[ti];
   // (the alley's own brick walls skin these buildings' alley sides: the bodies stop just inside that brick so the two never share a plane)
   const south=id==='corner-south',x1=south?80.6:X+11.9;K.building([X,x1,id==='corner-north'?za+.15:za,south?zb-.15:zb],h,{wall,tint,clutter:.8});
   const f=faces[id]=K.face(X,id==='gate-end'?Z1-6:zb,X,za,-1,0);   // the gate-end's last 6 m stand behind the North Gate
   if(south)K.dress(K.face(X,za,x1,za,0,-1),h,{wall,tint,ground:[{kind:'blank',w:0}],dense:.6,litRate:.3});   // its side on Milked's street
   const len=f.len,ground=id==='corner-south'?[{kind:'shop',w:0,color:P.window,dim:.5,bars:4},{kind:'door',w:2.6,number:'61'}]
    :id==='corner-north'?[{kind:'shop',w:4.2,color:'#d98f5a',dim:.6,bars:3},{kind:'shop',w:0,color:P.window,dim:.5,bars:5},{kind:'door',w:2.6,number:'55'}]
    :id==='mid'?[{kind:'shutter',w:3.6},{kind:'shop',w:0,color:'#9fc4d0',dim:.4,bars:6},{kind:'shop',w:4,color:P.window,dim:.55,bars:4}]
    :[{kind:'door',w:2.6,number:'31'},{kind:'shutter',w:0}];void len;
   const r=K.dress(f,h,{wall,tint,ground,dense:.75,litRate:.42,escape:id==='mid'?6:false});
   // the sign band: every shop's name on one line, the same height along the whole block
   for(const b of r.bays)if(b.kind==='shop'){const [lines,c]=SIGNS[signAt++%SIGNS.length],w=Math.min(b.w-.7,3.6);K.fbox(f,S.frame,[w+.16,.74,.1],b.mid,3.6,.32);K.flit(f,w,.62,b.mid,3.6,.375,K.paint.words([lines.join(' · ')],c,{bg:'#08090c'}));K.wallWash(f,c,b.mid,3.3,w+1.4,2.6,.3);const g=K.at(f,b.mid,0,1.5);K.groundWash(c,g[0],g[2],w+1,2.6,.22,.2);}
   // warm light out of each shop window onto the pavement
   for(const b of r.bays)if(b.kind==='shop'){const g=K.at(f,b.mid,0,1.3);K.groundWash(P.window,g[0],g[2],b.w,2.8,.3,.2);}}
  // party walls: a thin pier where two buildings meet, so the join reads as built
  for(const z of [-43.7,-31.8])K.box(S.frame,[.34,17.5,.3],[X-.12,8.75,z],{ao:[.5,1]});
  // ---- the Lantern Bridge over the alley mouth ----
  {const y0=5.2,h=15,za=ALLEY[0],zb=ALLEY[1],x1=X+6,mz=(za+zb)/2,w=zb-za;
   K.box(S.plate,[x1-X+.15,h-y0,w+.9],[(X+x1)/2-.075,(h+y0)/2,mz],{tint:[.78,.82,.9],ao:[.6,1]});   // 15 cm proud of its neighbours, so no two faces share a planeK.roof(X,x1,za,zb,h,{clutter:.4});
   // the legs it stands on: the two corner piers on the street line (the alley's own brick walls run on behind them)
   for(const z of [za-.02,zb+.02])K.box(S.concrete,[.7,y0,.55],[X+.35,y0/2,z+(z<mz?-.2:.2)],{tint:T[5],ao:[.45,1]});
   const fb=K.face(X-.15,zb,X-.15,za,-1,0),fe=K.face(x1,za,x1,zb,1,0);
   // street side: a band of lit windows, a balcony rail, a girder under it
   for(const f of [fb,fe]){K.fbox(f,S.frame,[w+.9,.5,.3],w/2,y0+.25,.12);K.fbox(f,S.frame,[w+.9,.16,.3],w/2,h+.2,.1);
    for(let c=0;c<3;c++){const s=1.02+c*2.03;K.fbox(f,S.dark,[1.75,2.1,.06],s,8.2,0);K.window(f,s-.42,8.2,.8,1.9,c===1?3:2);K.window(f,s+.42,8.2,.8,1.9,c===0?3:c===1?2:4);K.fbox(f,S.plate,[1.9,.09,.2],s,7.08,.1);
     K.fbox(f,S.dark,[1.75,1.7,.06],s,12,0);K.window(f,s-.42,12,.8,1.5,pick([0,1,2]));K.window(f,s+.42,12,.8,1.5,pick([0,5,2]));}
    K.fbox(f,S.frame,[w,.05,.05],w/2,6.75,.3);for(let s=.2;s<w;s+=.55)K.fbox(f,S.frame,[.03,.8,.03],s,6.35,.3);K.fbox(f,S.frame,[w,.06,.36],w/2,5.92,.16);
    K.wallWash(f,P.window,w/2,8.2,w+2,4,.3);}
   // soffit: dark steel, two warm tubes, the lanterns
   K.box(S.dark,[x1-X,.1,w+.5],[(X+x1)/2,y0-.05,mz],{faces:'d'});for(const x of [X+1.5,X+4.5]){K.box(S.frame,[.16,.06,w-1],[x,y0-.1,mz]);K.box(K.glow('soffit',P.sodium,1),[.08,.04,w-1.4],[x,y0-.14,mz]);}
   const lan=K.glow('lantern','#ffffff',1);lan.emissiveTexture=K.tex('lantern',64,64,(g,Wd,Ht)=>{const gr=g.createLinearGradient(0,0,0,Ht);gr.addColorStop(0,'#3a0806');gr.addColorStop(.18,'#c8301a');gr.addColorStop(.5,'#ff7a3a');gr.addColorStop(.82,'#c8301a');gr.addColorStop(1,'#3a0806');g.fillStyle=gr;g.fillRect(0,0,Wd,Ht);g.fillStyle='rgba(60,8,4,.45)';for(let x=0;x<Wd;x+=8)g.fillRect(x,0,1.5,Ht);});lan.emissiveColor=B.Color3.Black();
   for(let i=0;i<5;i++){const z=za+.75+i*(w-1.5)/4,y=y0-.62-(i%2)*.12,l=B.MeshBuilder.CreateSphere('block-lantern',{diameter:.5,segments:10},scene);l.scaling.y=.86;l.position.set(X-.28,y,z);K.keep(l,lan);K.box(S.dark,[.16,.05,.16],[X-.28,y+.26,z]);K.box(S.dark,[.02,y0-y-.3,.02],[X-.28,(y0+y+.3)/2,z]);}
   K.tube(S.dark,[[X-.28,y0-.1,za+.3],[X-.28,y0-.22,mz],[X-.28,y0-.1,zb-.3]],.015,4);
   K.groundWash(P.lantern,X-1.2,mz,5,w+1.5,.45,.2);K.groundWash(P.sodium,X+3,mz,7,w,.5,.03);K.wallWash(fb,P.lantern,w/2,4.2,w+2,2.6,.35);
   // the chevron light on the north pier: a tall column of arrowheads pointing down to the way in (no words)
   {const cz=zb+.75,cy=10.2,ch=8.2,cw=1.15,draw=(g,Wd,Ht)=>{g.fillStyle='#07080b';g.fillRect(0,0,Wd,Ht);g.strokeStyle=P.sodium;g.lineWidth=4;g.strokeRect(5,5,Wd-10,Ht-10);const n=7;for(let i=0;i<n;i++){const y=Ht*(i+.5)/n,s=Wd*.3,c=i%2?P.sodium:'#ffd9a0';g.strokeStyle=c;g.shadowColor=c;g.shadowBlur=12;g.lineWidth=Wd*.11;g.lineJoin='miter';g.beginPath();g.moveTo(Wd/2-s,y-s*.45);g.lineTo(Wd/2,y+s*.45);g.lineTo(Wd/2+s,y-s*.45);g.stroke();}g.shadowBlur=0;};
    K.box(S.frame,[cw+.3,ch+.3,.22],[X-.45-cw/2,cy,cz]);K.box(S.frame,[.5,.1,.1],[X-.2,cy+ch/2-.4,cz]);K.box(S.frame,[.5,.1,.1],[X-.2,cy-ch/2+.4,cz]);
    const uv=K.lit(cw,ch,[X-.45-cw/2,cy,cz-.115],axFor([0,-1]),[0,1,0],draw);K.litAgain(uv,cw,ch,[X-.45-cw/2,cy,cz+.115],axFor([0,1]),[0,1,0]);
    K.wallWash(faces['corner-north'],P.sodium,faces['corner-north'].len-.75,cy,4,ch+3,.4);K.groundWash(P.sodium,X-1.6,cz,4.5,4.5,.35,.2);}}
  // ---- lamps: warm sodium on the pavement at a steady spacing, one cold lamp at the gate end ----
  const lamps=[];for(const [id,s] of [['corner-south',3.2],['corner-north',6.6],['mid',5.9],['gate-end',3.4]])lamps.push(K.wallLamp(faces[id],s,5.0,id==='gate-end'?'#bfe9ff':P.sodium,{arm:1.1}));
  // real light on Medium and up: the bridge's underside and one pavement lamp (Old Town already carries most of the lamps a surface may use)
  K.light([X+1.5,4.4,(ALLEY[0]+ALLEY[1])/2],P.sodium,1.5,13);if(lamps[1])K.light([lamps[1][0],4.7,lamps[1][2]],P.sodium,1.1,12);
  // ---- the pavement in front: drains, stains, a few dark wet patches (no mirror here: Old Town is the heavy quarter) ----
  for(const z of [-66,-50,-38,-29])K.groundMark(.42,1.2,68.2,z,K.stain.drain(),{y:.2});
  for(let i=0;i<8;i++)K.groundMark(1.6+rand()*2,1.4+rand()*2,68.6+rand()*1.8,Z0+2+rand()*(Z1-6-Z0-4),K.stain.blot(i%3?'rgba(6,7,9,A)':'rgba(40,26,12,A)',.5),{y:.2,px:14,yaw:rand()*3});
  for(const z of [-64.5,-47,-35.5])K.shade(70.2,z,1.2,2.4,0,.6,.2);
  K.finish();
  }catch(e){try{K.dispose();}catch{}throw e;}
  return {replaces,kit:K,tick(dt,time){if(!disposed)K.tick(dt,time);},dispose(){if(disposed)return;disposed=true;K.dispose();},stats:()=>({meshes:K.node.getChildMeshes().length,lights:K.lights.length})};
 }
 root.VoidOldTownBlock={build,replaces,enabled:true,UNITS,WALLS,OPENINGS,PALETTE,ZONE,FRONT,ALLEY};
 if(typeof module!=='undefined'&&module.exports)module.exports=root.VoidOldTownBlock;
})(typeof globalThis!=='undefined'?globalThis:this);
