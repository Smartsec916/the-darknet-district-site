/* THE OUTSKIRTS' CONTAINER HOMES (David, 16 Nov 2026): past the Far South Gate the paved road stops and a rundown residential area of makeshift shipping-container
   dwellings begins, on packed gravel. Everything here is BUILT IN CODE from simple shapes (no model, no generated picture): a small container kit that stacks, offsets
   and weathers containers, adds decks and stairs, lean-tos, tarps, rooftop clutter, cables, lamps and fences, all from a fixed seed so every visit is the same place.
   PURE PART (runs in Node, tests/ncz-containers.test.cjs): PLAN, solids(), KAI_HOME, rects. BROWSER PART (below): build({B,scene,parent,quality}) -> {dispose()}.
   Low keeps plain materials and fewer props; Medium and High use physically based paint with a normal map, wet gravel, puddles and lamp lights.
   Kai Kryptos' home is ONE container reserved for him (KAI_HOME): a closed door, a lit window and a step, nothing inside, no interaction yet. Nobody lives in it yet and
   nothing here names or describes anyone (David, 16 Nov 2026: no character, dialogue or mission yet). No signs and no words are painted anywhere. */
(function(root){
 'use strict';
 const CL=6.06,CW=2.44,CH=2.59;   // a 20-foot container: length, width, height (metres)
 const PAINT=['#8f3b2c','#3f6177','#4c6f57','#807f78','#946f3a','#74403f','#5a5f7a'];   // faded red, blue, green, grey, ochre, brick, slate
 // A small deterministic random sequence (so the place never changes between visits).
 const rng=seed=>{let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};};
 /* Containers. [x, z, axis ('x': long side along x, 'z': along z), stack (1-3), flags]. flags: deck (deck and stairs on the long side facing the plaza), lean (a lean-to on
    the other long side), kai (the reserved home). Footprints keep every walkway at least 2.2 m wide (tests/ncz-containers.test.cjs checks it). */
 const BASE=[
  // the west edge of the hub (the opening at z -250..-240 is the west lane) and the east edge (opening at z -248..-240)
  [38.2,-229,'z',2,'deck'],[38.2,-235.2,'z',1,''],[38.2,-253.8,'z',3,''],
  [89.8,-229,'z',2,''],[89.8,-235.2,'z',3,'deck'],[89.8,-253.8,'z',2,'lean'],
  // the south edge, closed end to end
  [39.1,-258,'x',2,''],[45.3,-258,'x',3,''],[51.5,-258,'x',1,'lean'],[57.7,-258,'x',2,''],[63.9,-258,'x',3,''],[70.1,-258,'x',2,'lean'],[76.3,-258,'x',1,''],[82.5,-258,'x',3,''],[88.7,-258,'x',2,''],
  // clusters on the plaza that make the walkways wind
  [47,-240.5,'x',2,'deck'],[76,-248,'x',2,'lean'],[58,-251,'x',1,''],[66,-243,'z',1,''],
  // Kai Kryptos' home, on the east side of the plaza, its door toward the gate
  [82,-235,'z',1,'kai'],
  // the dead ends of the two lanes
  [22.5,-245,'z',2,''],[105.5,-244,'z',2,'']];
 const size=c=>c[2]==='x'?[CL,CW]:[CW,CL];
 // The plan: every container with its stack of levels (each a little offset and its own paint), decided once from the seed.
 function plan(seed=4127){const r=rng(seed),out=[];
  BASE.forEach(([x,z,axis,stack,flag],i)=>{const [w,d]=size([x,z,axis]),levels=[];
   for(let k=0;k<stack;k++)levels.push({k,off:k?[(r()-.5)*(axis==='x'?1.6:.5),(r()-.5)*(axis==='x'?.5:1.6)]:[0,0],paint:flag==='kai'?'#4d7a78':PAINT[Math.floor(r()*PAINT.length)],doorEnd:r()<.5?1:-1,window:r()<.35,sideDoor:r()<.5,dent:r()});
   out.push({id:'container-'+(i+1),x,z,axis,w,d,stack,flag,levels});});
  return out;}
 const PLAN=plan();
 const KAI=PLAN.find(c=>c.flag==='kai');
 /* The reserved home. position/yaw: where the door is and the way it faces (game yaw: 0 north, PI/2 east, -PI/2 west). A mission giver and an interaction can be attached
    here later. NOTHING else: no character, model, line, voice or text. */
 const KAI_HOME={id:'kai-kryptos-home',position:[KAI.x-CW/2,0,KAI.z],yaw:-Math.PI/2,door:{x:KAI.x-CW/2,z:KAI.z,width:.95,height:2.05},window:{x:KAI.x-CW/2,z:KAI.z+1.75},step:{x:KAI.x-CW/2-.4,z:KAI.z,w:1.3,d:.8,h:.28},interaction:null};
 // Collision: one box per container over its whole stack, the decks' and stairs' footprint, the fences, and the step.
 function solids(){const out=[];
  for(const c of PLAN){const h=c.stack*CH,[w,d]=[c.w+(c.stack>1?1.2:0),c.d+(c.stack>1?1.2:0)];out.push({id:c.id,position:[c.x,h/2,c.z],size:[w,h,d]});
   if(c.flag==='deck'){const s=deckRect(c);out.push({id:c.id+'-stairs',position:[(s[0]+s[1])/2,1.4,(s[2]+s[3])/2],size:[s[1]-s[0],2.8,s[3]-s[2]]});}
   if(c.flag==='lean'){const s=leanRect(c);out.push({id:c.id+'-leanto',position:[(s[0]+s[1])/2,1.2,(s[2]+s[3])/2],size:[s[1]-s[0],2.4,s[3]-s[2]]});}}
  for(const f of FENCES)out.push({id:f.id,position:[(f.r[0]+f.r[1])/2,1.1,(f.r[2]+f.r[3])/2],size:[f.r[1]-f.r[0],2.2,f.r[3]-f.r[2]]});
  return out;}
 // The deck and stairs of a 'deck' container sit on the side that faces the plaza middle (x 61): its footprint, [x0,x1,z0,z1].
 function deckRect(c){const toward=Math.sign(61-c.x)||1;return c.axis==='z'?(toward>0?[c.x+c.w/2,c.x+c.w/2+1.3,c.z-1.8,c.z+1.8]:[c.x-c.w/2-1.3,c.x-c.w/2,c.z-1.8,c.z+1.8]):[c.x-1.8,c.x+1.8,c.z+c.d/2,c.z+c.d/2+1.3];}
 // The lean-to goes on the side away from the plaza, against the next container or the wall behind: the footprint is cut short so it never blocks a walkway.
 function leanRect(c){const away=c.axis==='z'?(c.x<61?-1:1):(c.z<-245?-1:1);return c.axis==='z'?(away>0?[c.x+c.w/2,c.x+c.w/2+1.1,c.z-2.2,c.z+2.2]:[c.x-c.w/2-1.1,c.x-c.w/2,c.z-2.2,c.z+2.2]):(away>0?[c.x-2.2,c.x+2.2,c.z+c.d/2,c.z+c.d/2+1.1]:[c.x-2.2,c.x+2.2,c.z-c.d/2-1.1,c.z-c.d/2]);}
 // Plank fences across the two lane ends, behind the end containers, and a short run by the east lane.
 const FENCES=[{id:'fence-west-n',r:[20,21,-250,-247.8]},{id:'fence-west-s',r:[20,21,-242.2,-240]},{id:'fence-east-n',r:[107.2,108,-248,-246.2]},{id:'fence-east-s',r:[107.2,108,-241.8,-240]}];
 const api={CL,CW,CH,PAINT,BASE,PLAN,FENCES,KAI_HOME,plan,solids,deckRect,leanRect,rng,size};
 if(typeof module!=='undefined'&&module.exports){module.exports=api;return;}
 root.VoidContainers=api;
 if(typeof document==='undefined')return;

 // ================================================================ the BROWSER part ================================================================
 api.build=function build({B,scene,parent,quality}){
  const low=quality==='low',own=[],groups=new Map(),r=rng(90210),node=new B.TransformNode('outskirts-homes',scene);node.parent=parent;let disposed=false;
  const lin=h=>B.Color3.FromHexString(h).toLinearSpace();
  const track=o=>{own.push(o);return o;};
  // ---- the paint: one corrugated picture, tinted per container (Low: plain; Medium and up: physically based with a normal map) ----
  const draw=(h)=>{const t=new B.DynamicTexture('outskirts-ribs',{width:256,height:256},scene,true),g=t.getContext();h(g,256,256);t.update();t.wrapU=t.wrapV=B.Texture.WRAP_ADDRESSMODE;return track(t);};
  const ribs=draw((g,W,H)=>{g.fillStyle='#9a9a98';g.fillRect(0,0,W,H);for(let x=0;x<W;x+=16){const gr=g.createLinearGradient(x,0,x+16,0);gr.addColorStop(0,'#c4c4c0');gr.addColorStop(.5,'#6c6c6a');gr.addColorStop(1,'#a8a8a4');g.fillStyle=gr;g.fillRect(x,0,16,H);}
   for(let i=0;i<140;i++){g.fillStyle='rgba('+(r()<.6?'122,62,28':'20,16,12')+','+(.08+r()*.28)+')';g.fillRect(r()*W,r()*H,2+r()*6,8+r()*70);}   // rust and grime run down the ribs
   for(let i=0;i<9;i++){const x=r()*W,y=r()*H,rad=6+r()*16,gr=g.createRadialGradient(x,y,0,x,y,rad);gr.addColorStop(0,'rgba(20,16,14,.55)');gr.addColorStop(1,'rgba(20,16,14,0)');g.fillStyle=gr;g.fillRect(x-rad,y-rad,rad*2,rad*2);}});   // dents
  let ribNormal=null;if(!low){const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');for(let x=0;x<256;x+=16){const gr=g.createLinearGradient(x,0,x+16,0);gr.addColorStop(0,'#000');gr.addColorStop(.5,'#fff');gr.addColorStop(1,'#000');g.fillStyle=gr;g.fillRect(x,0,16,256);}
   const src=g.getImageData(0,0,256,256).data,t=track(new B.DynamicTexture('outskirts-rib-normal',{width:256,height:256},scene,true)),tg=t.getContext(),out=tg.createImageData(256,256),o=out.data,H=(x,y)=>src[(((y+256)%256)*256+((x+256)%256))*4]/255;
   for(let y=0;y<256;y++)for(let x=0;x<256;x++){const ax=(H(x+1,y)-H(x-1,y))*2.2,l=1/Math.hypot(ax,1),i=(y*256+x)*4;o[i]=(-ax*l*.5+.5)*255;o[i+1]=128;o[i+2]=(l*.5+.5)*255;o[i+3]=255;}tg.putImageData(out,0,0);t.update();t.wrapU=t.wrapV=B.Texture.WRAP_ADDRESSMODE;ribNormal=t;}
  const mats=new Map();
  const paint=hex=>{const k='p'+hex;if(mats.has(k))return mats.get(k);let m;
   if(low){m=new B.StandardMaterial('outskirts-paint',scene);m.diffuseTexture=ribs;m.diffuseColor=B.Color3.FromHexString(hex).scale(1.25);m.specularColor=new B.Color3(.08,.08,.08);m.emissiveColor=B.Color3.FromHexString(hex).scale(.1);}
   else{m=new B.PBRMaterial('outskirts-paint',scene);m.albedoTexture=ribs;m.albedoColor=lin(hex).scale(1.5);m.metallic=.45;m.roughness=.68;m.bumpTexture=ribNormal;m.bumpTexture.level=.9;m.emissiveTexture=ribs;m.emissiveColor=lin(hex).scale(.07);}
   track(m);mats.set(k,m);return m;};
  const flat=(key,hex,{rough=.8,metal=.3,glow=0}={})=>{if(mats.has(key))return mats.get(key);let m;
   if(low){m=new B.StandardMaterial('outskirts-'+key,scene);m.diffuseColor=B.Color3.FromHexString(hex);m.specularColor=new B.Color3(.05,.05,.05);if(glow)m.emissiveColor=B.Color3.FromHexString(hex).scale(glow);}
   else{m=new B.PBRMaterial('outskirts-'+key,scene);m.albedoColor=lin(hex);m.metallic=metal;m.roughness=rough;if(glow)m.emissiveColor=lin(hex).scale(glow);}
   track(m);mats.set(key,m);return m;};
  const glowM=(key,hex,k=1)=>{if(mats.has(key))return mats.get(key);const m=new B.StandardMaterial('outskirts-'+key,scene);m.diffuseColor=B.Color3.Black();m.specularColor=B.Color3.Black();m.emissiveColor=B.Color3.FromHexString(hex).scale(k);m.disableLighting=true;track(m);mats.set(key,m);return m;};
  const steel=flat('steel','#2a2c30',{rough:.55,metal:.7}),dark=flat('dark','#15161a',{rough:.6,metal:.5}),rust=flat('rust','#6a3a22',{rough:.9,metal:.2}),wood=flat('wood','#4a3a2a',{rough:.9,metal:0}),
   tarpB=flat('tarp-blue','#2c4a66',{rough:.85,metal:0}),tarpG=flat('tarp-green','#35503a',{rough:.85,metal:0}),solar=flat('solar','#16243a',{rough:.35,metal:.6}),cloth=[flat('cloth-a','#b85a3a',{rough:.95,metal:0}),flat('cloth-b','#c9c0a0',{rough:.95,metal:0}),flat('cloth-c','#4a7a8a',{rough:.95,metal:0})],
   door=flat('door','#3a3228',{rough:.7,metal:.45}),warm=glowM('window','#ffb25a',1.15),lamp=glowM('lamp','#ffa23a',1.4),fire=glowM('fire','#ff7a22',1.2);
  // ---- shapes: everything is added to a group per material and merged at the end ----
  const add=(mesh,m,x,y,z,ry=0,rx=0,rz=0)=>{mesh.material=m;mesh.parent=node;mesh.position.set(x,y,z);mesh.rotation.set(rx,ry,rz);mesh.isPickable=false;let g=groups.get(m);if(!g)groups.set(m,g=[]);g.push(mesh);return mesh;};
  const box=(w,h,d,x,y,z,m,ry,rx,rz)=>add(B.MeshBuilder.CreateBox('o-box',{width:w,height:h,depth:d},scene),m,x,y,z,ry,rx,rz);
  const cyl=(rad,h,x,y,z,m,t=low?8:12)=>add(B.MeshBuilder.CreateCylinder('o-cyl',{diameter:rad*2,height:h,tessellation:t},scene),m,x,y,z);
  const body=(w,h,d,x,y,z,m)=>{const side=a=>new B.Vector4(0,0,a/2.4,h/2.4);return add(B.MeshBuilder.CreateBox('o-body',{width:w,height:h,depth:d,faceUV:[side(w),side(w),side(d),side(d),new B.Vector4(0,0,w/3,d/3),new B.Vector4(0,0,.1,.1)],wrap:true},scene),m,x,y,z);};
  const roofs=[];   // the top of each stack: where the clutter goes
  const wall=(c,l,dir)=>{   // a long side of level l: dir +1 / -1 is the side's outward direction across the container
   const x=c.x+l.off[0],z=c.z+l.off[1],y0=l.k*CH;return {x,z,y0,dir};};
  for(const c of PLAN){
   c.levels.forEach((l,k)=>{const x=c.x+l.off[0],z=c.z+l.off[1],y=k*CH+CH/2,m=paint(l.paint),isX=c.axis==='x';
    body(c.w,CH,c.d,x,y,z,m);
    // roof slab, a little rusty, and corner castings
    box(c.w+.04,.05,c.d+.04,x,k*CH+CH+.02,z,rust);
    for(const sx of [-1,1])for(const sz of [-1,1]){box(.18,.16,.18,x+sx*(c.w/2-.05),k*CH+CH-.05,z+sz*(c.d/2-.05),dark);if(!low||k===0)box(.18,.16,.18,x+sx*(c.w/2-.05),k*CH+.05,z+sz*(c.d/2-.05),dark);}
    // the doors on one short end: two panels, a seam, two locking bars with handles
    {const e=l.doorEnd,ex=isX?x+e*(c.w/2+.03):x,ez=isX?z:z+e*(c.d/2+.03),ry=isX?0:Math.PI/2;
     const put=(w,h,dd,ox,oy,oz,mm)=>{const px=isX?ex+oz*e:ex+ox,pz=isX?ez+ox:ez+oz*e;box(isX?dd:w,h,isX?w:dd,px,k*CH+oy,pz,mm);};
     void ry;put(1.05,2.3,.06,-.55,1.3,0,door);put(1.05,2.3,.06,.55,1.3,0,door);put(.05,2.35,.1,0,1.3,.02,dark);if(!low){for(const ox of [-.7,-.38,.38,.7]){put(.05,2.3,.07,ox,1.3,.05,steel);put(.12,.05,.1,ox,1.3,.1,dark);}}}
    // a window on a long side: a warm lit square with a frame
    if(l.window){const s=l.k%2?1:-1,px=isX?x+.9:x+s*(c.w/2+.02),pz=isX?z+s*(c.d/2+.02):z+.9;box(isX?.9:.05,.7,isX?.05:.9,px,k*CH+1.5,pz,steel);box(isX?.78:.07,.58,isX?.07:.78,px+(isX?0:s*.01),k*CH+1.5,pz+(isX?s*.01:0),warm);}
    // a patched door cut into a long side (the plaza side on the ground level)
    if(l.sideDoor&&k===0&&c.flag!=='kai'){const s=isX?(c.z<-245?1:-1):(c.x<61?1:-1),px=isX?x-1.3:x+s*(c.w/2+.03),pz=isX?z+s*(c.d/2+.03):z-1.3;box(isX?.95:.06,2.05,isX?.06:.95,px,1.03,pz,door);box(isX?1.05:.1,2.15,isX?.1:1.05,px,1.07,pz,steel);box(isX?.5:.07,.5,isX?.07:.5,px+(isX?.1:s*.02),1.3,pz+(isX?s*.02:.1),rust);}
   });
   const top=c.stack*CH,tx=c.x+(c.levels[c.stack-1].off[0]),tz=c.z+(c.levels[c.stack-1].off[1]);roofs.push({x:tx,z:tz,y:top+.05,w:c.w,d:c.d,c});
   // deck and stairs, on the plaza side of a 'deck' container: a slab at the second level, posts, a rail, and steps down
   if(c.flag==='deck'){const R=deckRect(c),cx=(R[0]+R[1])/2,cz=(R[2]+R[3])/2,alongZ=c.axis==='z',toward=Math.sign(61-c.x)||1,dy=CH-.12;
    box(alongZ?1.3:3.6,.1,alongZ?3.6:1.3,cx,dy,cz,wood);for(const e of [-1,1]){const px=alongZ?cx+toward*.6:cx+e*1.7,pz=alongZ?cz+e*1.7:cz+(c.z<-245?-1:1)*.6;cyl(.04,1.0,px,dy+.5,pz,steel,6);}
    const rx=alongZ?cx+toward*.62:cx,rz=alongZ?cz:cz+.62;box(alongZ?.04:3.6,.05,alongZ?3.6:.04,rx,dy+.95,rz,steel);
    for(let i=0;i<9;i++){const sx=alongZ?cx+toward*(.2+i*.14):cx-1.9-i*.0,sz=alongZ?cz-1.9-(i+.5)*.0:cz+.2+i*.14;void sx;void sz;}
    for(let i=0;i<8;i++){const h=dy-(i+1)*(dy/9),off=1.9+i*.34;box(alongZ?1.0:.34,.06,alongZ?.34:1.0,alongZ?cx:cx-1.9+(-off+1.9)*0-off+1.9-1.9*0,h,alongZ?cz-off:cz,wood);}
    box(alongZ?.05:.05,dy,alongZ?3.2:.05,alongZ?cx-.5:cx,dy/2,alongZ?cz:cz,dark);}
   // a lean-to: a slanted corrugated sheet from the container's long side down to two posts
   if(c.flag==='lean'){const R=leanRect(c),cx=(R[0]+R[1])/2,cz=(R[2]+R[3])/2,alongZ=c.axis==='z',away=alongZ?(c.x<61?-1:1):(c.z<-245?-1:1);
    const ang=.42*away;box(alongZ?1.3:4.6,.05,alongZ?4.6:1.3,cx,2.15,cz,paint(c.levels[0].paint),0,alongZ?0:-ang,alongZ?ang:0);
    for(const e of [-1,1]){const px=alongZ?cx+away*.5:cx+e*2.1,pz=alongZ?cz+e*2.1:cz+away*.5;cyl(.04,1.8,px,.9,pz,steel,6);}}
  }
  // ---- the reserved home: a closed door, a lit window, a step, a porch lamp and a small awning (nothing inside, nothing to interact with yet) ----
  {const K=KAI_HOME,x=K.door.x,z=K.door.z,m=paint('#4d7a78');void m;
   box(.06,2.05,.95,x-.03,1.03,z,door);box(.1,2.2,1.1,x-.05,1.1,z,steel);box(.07,.6,.07,x-.06,1.1,z+.28,dark);   // door, frame, handle
   box(.06,.8,1.0,x-.03,1.6,z+1.75,steel);box(.07,.68,.88,x-.04,1.6,z+1.75,warm);box(.08,.68,.05,x-.05,1.6,z+1.75,dark);   // a window with a bar across it
   box(K.step.d,K.step.h,K.step.w,K.step.x,K.step.h/2,K.step.z,wood);box(.5,.14,1.5,x-.3,2.35,z,tarpG,0,0,-.35);   // the step and a tilted awning
   box(.14,.14,.14,x-.15,2.18,z+.7,lamp);box(.5,.9,.5,x-.7,.45,z-1.6,wood);box(.45,.6,.5,x-.7,1.2,z-1.55,wood);}   // a porch lamp and two crates
  // ---- rooftop clutter and tarps ----
  const clutter=(R,i)=>{const {x,z,y}=R,n=low?1:1+Math.floor(r()*2),kinds=['tank','antenna','dish','solar','laundry','ac','tarp'];
   for(let j=0;j<n+(i%3===0?1:0);j++){const kind=kinds[Math.floor(r()*kinds.length)],ox=(r()-.5)*(R.w-1.6),oz=(r()-.5)*(R.d-1.4),px=x+ox,pz=z+oz;
    if(kind==='tank'){cyl(.55,1.2,px,y+.9,pz,rust);for(const [a,b] of [[-.4,-.4],[.4,-.4],[-.4,.4],[.4,.4]])cyl(.03,.5,px+a,y+.25,pz+b,steel,5);}
    else if(kind==='antenna'){const h=2.5+r()*3;box(.06,h,.06,px,y+h/2,pz,steel);for(let k=1;k<=3;k++)box(1.2-k*.28,.03,.03,px,y+h*(.45+k*.15),pz,steel);box(.1,.1,.1,px,y+h+.05,pz,glowM('beacon','#ff3b2e',1.1));}
    else if(kind==='dish'){const d=add(B.MeshBuilder.CreateSphere('o-dish',{diameter:1.3,segments:8,slice:.5,sideOrientation:B.Mesh.DOUBLESIDE},scene),steel,px,y+1.2,pz,r()*6.28,-1.1);void d;box(.06,1,.06,px,y+.5,pz,dark);}
    else if(kind==='solar'){box(1.3,.04,.85,px,y+.55,pz,solar,r()*.6,-.45);box(.05,.5,.05,px,y+.25,pz,steel);}
    else if(kind==='laundry'){const l=Math.min(R.w,R.d)>3?3:2.2;box(.04,1.6,.04,px-l/2,y+.8,pz,steel);box(.04,1.6,.04,px+l/2,y+.8,pz,steel);box(l,.015,.015,px,y+1.55,pz,dark);for(let k=0;k<3;k++)box(.4,.55,.02,px-l/2+.5+k*.75,y+1.25,pz,cloth[(i+k)%3]);}
    else if(kind==='ac'){box(.9,.7,.6,px,y+.35,pz,steel);box(.7,.04,.5,px,y+.72,pz,dark);}
    else{box(R.w*.5,.04,R.d*.55,px,y+.55,pz,i%2?tarpB:tarpG,r()*.2,.12,.1);}}};
  roofs.forEach(clutter);
  // ---- on the ground: drums, pallets, crates, scrap, a fire barrel and lamp posts ----
  const drum=(x,z,m=rust)=>{cyl(.3,.9,x,.45,z,m);box(.62,.04,.62,x,.9,z,dark);};
  const spots=[[44,-234],[48,-249],[72,-252],[84,-243],[53,-229],[70,-229],[43,-246],[78,-229]];
  spots.forEach(([x,z],i)=>{drum(x,z,i%2?rust:flat('drum-blue','#23415a',{rough:.8,metal:.4}));if(i%2===0)drum(x+.7,z+.2);if(i%3===0){for(let k=0;k<3;k++)box(1.1,.12,1.1,x+1.2,.07+k*.13,z-.6,wood,k*.2);}if(i%3===1)box(.8,.6,.7,x-.9,.3,z+.7,wood,.3);});
  for(let i=0;i<(low?5:12);i++){const x=40+r()*50,z=-256+r()*24;if(PLAN.some(c=>Math.abs(x-c.x)<c.w/2+1.4&&Math.abs(z-c.z)<c.d/2+1.4))continue;box(.3+r()*.9,.1+r()*.35,.3+r()*.7,x,.1,z,r()<.5?rust:steel,r()*3);}   // scrap
  // the fire barrel in the plaza and the lamps: an orange glow, no real light on Low
  cyl(.32,.85,61,.43,-238,dark);box(.5,.12,.5,61,.88,-238,fire);
  const lampAt=[[61,-232],[52,-248],[80,-246],[44,-226]];lampAt.forEach(([x,z])=>{cyl(.05,4.2,x,2.1,z,steel,6);box(.5,.12,.3,x,4.2,z,steel);box(.34,.08,.2,x,4.12,z,lamp);});
  // ---- cables strung between the roofs ----
  const cable=track(flat('cable','#0a0a0c',{rough:.6,metal:.3}));
  for(let i=0;i<(low?6:16);i++){const a=roofs[Math.floor(r()*roofs.length)],b=roofs[Math.floor(r()*roofs.length)];if(a===b||Math.hypot(a.x-b.x,a.z-b.z)>16||Math.hypot(a.x-b.x,a.z-b.z)<3)continue;const pts=[];for(let k=0;k<=8;k++){const t=k/8;pts.push(new B.Vector3(a.x+(b.x-a.x)*t,a.y+.2+(b.y-a.y)*t-Math.sin(Math.PI*t)*(.5+r()*.9),a.z+(b.z-a.z)*t));}
   const tube=B.MeshBuilder.CreateTube('o-cable',{path:pts,radius:.025,tessellation:4},scene);add(tube,cable,0,0,0);}
  // ---- plank fences across the lane ends ----
  for(const f of FENCES){const w=f.r[1]-f.r[0],d=f.r[3]-f.r[2],cx=(f.r[0]+f.r[1])/2,cz=(f.r[2]+f.r[3])/2;box(w,2,d,cx,1,cz,wood);box(w+.1,.12,d+.1,cx,2.06,cz,dark);}
  // abstract marks on a few container sides: spray-paint shapes, no letters
  {const t=draw((g,W,H)=>{g.clearRect(0,0,W,H);g.lineWidth=14;g.lineCap='round';const cols=['#e8e2d0','#d8b04a','#7fd0d8'];for(let i=0;i<5;i++){g.strokeStyle=cols[i%3];g.beginPath();if(i%2){g.arc(52+i*40,128,24+i*5,0,6.28);}else{g.moveTo(20+i*44,40);g.lineTo(70+i*44,210);g.moveTo(20+i*44,210);g.lineTo(70+i*44,60);}g.stroke();}});
   t.hasAlpha=true;const gm=new B.StandardMaterial('outskirts-marks',scene);gm.diffuseTexture=t;gm.opacityTexture=t;gm.emissiveColor=new B.Color3(.18,.18,.16);gm.specularColor=B.Color3.Black();gm.backFaceCulling=false;track(gm);
   [[PLAN[7],'s'],[PLAN[10],'s'],[PLAN[2],'e'],[PLAN[15],'w'],[PLAN[17],'s']].forEach(([c,f],i)=>{const p=B.MeshBuilder.CreatePlane('o-mark',{width:2.4,height:1.4},scene),isE=f==='e'||f==='w';p.material=gm;p.parent=node;p.isPickable=false;
    p.position.set(isE?c.x+(f==='e'?1:-1)*(c.w/2+.04):c.x+1.2,1.4,isE?c.z+.5:c.z+(c.z<-245?-1:1)*(c.d/2+.04));p.rotation.y=isE?(f==='e'?-Math.PI/2:Math.PI/2):(c.z<-245?Math.PI:0);void i;});}
  // ---- the ground: gravel and mud, wet in the better settings ----
  const lampWash=(()=>{const t=draw((g,W,H)=>{g.fillStyle='#000';g.fillRect(0,0,W,H);const gr=g.createRadialGradient(W/2,H/2,2,W/2,H/2,W/2);gr.addColorStop(0,'#ff9a3a');gr.addColorStop(1,'#000');g.fillStyle=gr;g.fillRect(0,0,W,H);});const m=new B.StandardMaterial('outskirts-wash',scene);m.diffuseColor=B.Color3.Black();m.specularColor=B.Color3.Black();m.emissiveTexture=t;t.level=low?.55:.8;m.disableLighting=true;m.alphaMode=B.Engine.ALPHA_ADD;m.alpha=.99;m.disableDepthWrite=true;m.backFaceCulling=false;track(m);return m;})();
  const washes=[...lampAt.map(([x,z])=>[x,z,9]),[61,-238,6]];for(const [x,z,s] of washes){const p=B.MeshBuilder.CreateGround('o-wash',{width:s,height:s},scene);p.material=lampWash;p.parent=node;p.position.set(x,.06,z);p.isPickable=false;}
  const mud=track(new B.StandardMaterial('outskirts-mud',scene));mud.diffuseColor=new B.Color3(.07,.06,.05);mud.specularColor=B.Color3.Black();mud.alpha=.6;
  for(let i=0;i<(low?8:16);i++){const p=B.MeshBuilder.CreateDisc('o-mud',{radius:.9+r()*2,tessellation:14},scene),x=38+r()*52,z=-258+r()*32;p.material=mud;p.parent=node;p.position.set(x,.045,z);p.rotation.x=Math.PI/2;p.scaling.y=.6;p.isPickable=false;}
  if(!low){const pm=track(new B.StandardMaterial('outskirts-puddle',scene));pm.diffuseColor=new B.Color3(.02,.03,.04);pm.specularColor=new B.Color3(.7,.8,.9);pm.specularPower=160;pm.emissiveColor=new B.Color3(.08,.07,.05);pm.alpha=.8;
   for(let i=0;i<10;i++){const p=B.MeshBuilder.CreateDisc('o-puddle',{radius:.5+r()*1.2,tessellation:16},scene);p.material=pm;p.parent=node;p.position.set(40+r()*50,.05,-256+r()*30);p.rotation.x=Math.PI/2;p.scaling.y=.55;p.isPickable=false;}
   // two warm lights in the plaza (the street's own lights are kept for Old Town)
   for(const [x,z] of [[61,-233],[52,-247]]){const L=new B.PointLight('outskirts-lamp',new B.Vector3(x,4,z),scene);L.diffuse=new B.Color3(1,.62,.28);L.specular=new B.Color3(.4,.25,.1);L.intensity=14;L.range=16;own.push(L);}}
  // ---- merge every group into one mesh per material ----
  for(const [m,list] of groups){if(list.length>1){const mm=B.Mesh.MergeMeshes(list,true,true,undefined,false,false);if(mm){mm.parent=null;mm.material=m;mm.isPickable=false;mm.freezeWorldMatrix?.();own.push(mm);}}else{list[0].freezeWorldMatrix?.();}}
  groups.clear();
  return {dispose(){if(disposed)return;disposed=true;try{node.dispose(false,true);}catch{}for(const o of own)try{o.dispose();}catch{}own.length=0;},get disposed(){return disposed;}};
 };
})(typeof globalThis!=='undefined'?globalThis:this);
