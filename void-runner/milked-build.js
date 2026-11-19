/* MILKED: the Babylon presentation (milked.js has the data, docs/development/MILKED.md the design). Browser only.
   Two builds share one kit:
     VoidMilked.create({B,scene,parent,quality,assets})  the STREET side: the shopfront on the side street, the alley back, the security vestibule and the rear
                                                          lobby. Streamed in by neochinatown.js when the player comes within about 90 m.
     VoidMilked.build({scene,parent,quality})             the INTERIOR, an environment of its own (location key 'milked'): the same vestibule and rear lobby, plus
                                                          reception, the studio hallway, four studios, Fish's office, the staff area and the rear corridor.
   The vestibule and the rear lobby are built by the same code in both, so the player stands in the same room before and after the exchange
   (milked-transition.js). In the street build only the two outer doors can open; in the interior only the three inner ones.
   After the owner's reference sheets of 16 Nov 2026: near-black weathered metal and stained concrete, dark wet floors, pink neon as the accent and green as the
   second, exposed ducts, pipes and cable trays, plants, pinned photos and plush toys. Surfaces use the repository's own texture sets (the District interior kit,
   the street set, the suite's wood and fabric); the props in assets/models/milked/ were made with Meshy (optional files: a missing one is replaced by a simple
   stand-in built here, and Low quality always uses the stand-ins).
   Surfaces and light (fourth pass, 16 Nov 2026): Low keeps plain materials, a sky light, light pools and contact shadows. Medium and above use physically
   based materials with normal maps, a mirror in the floors, a small picture of the room for metal and glass to reflect, five lamps that follow the player to
   the nearest signs and tubes, and one key light with a shadow map. docs/development/MILKED.md has the whole account and the measurements.
   Content rules: every performer is an adult, everyone is clothed, nothing is explicit; each studio has exactly one dancer and nobody else; fixed cameras on
   stands, run remotely from the office, so there are no camera operators. */
(function(root){
 'use strict';
 const MK=root.VoidMilked;if(!MK||typeof document==='undefined')return;
 const HERE=document.currentScript?new URL('.',document.currentScript.src).href:'void-runner/';
 const {CONFIG,MODELS,FOOTPRINT,DOOR,INNER,REAR,VESTIBULE,HALL,LOBBY,LOBBY_N,LOBBY_W,DOORS,SEGMENTS,ROOMS,STUDIOS,T,CEIL,AREA,spansOf,distance,inside}=MK.LOCAL,[OX,OZ]=MK.OFFSET;   // everything here is drawn in the building's own frame; MK.OFFSET carries it to where it stands (milked.js)
 const toLocal=c=>c?{x:c.x-OX,y:c.y,z:c.z-OZ}:c;   // a camera or a player in world metres, in the building's frame
 const PINK='#ff3fb4',GREEN='#39ff9c',WHITE='#f4f8ff',RED='#ff2b4a',WARM='#ffd9a8',PI=Math.PI;
 const CJK='"Microsoft YaHei","PingFang SC","Noto Sans CJK SC","Noto Sans SC","WenQuanYi Zen Hei",sans-serif';
 const TOW=PI/2,TOE=-PI/2,TON=PI,TOS=0;   // plane rotation.y so the readable face points west (-x), east (+x), north (+z), south (-z)

 // ================================================================ the kit: materials, shapes, signs, doors, props ================================================================
 function kit({B,scene,parent,quality,area,offset}){
  const low=quality==='low',high=quality==='high'||quality==='ultra',interior=area===AREA,own=[],groups=new Map(),screens=[],leaves=new Map(),containers=[],models=new Map(),late=[],pbrs=[];let disposed=false,merged=false;
  const node=new B.TransformNode(interior?'milked-interior':'milked',scene);node.parent=parent;const [KX,KZ]=offset||[OX,OZ];node.position.set(KX,0,KZ);   // the one rigid move (milked.js OFFSET): every mesh and light below is parented to this node and keeps its own coordinates
  const matCache=new Map();
  /* Surfaces. Low keeps the plain (Standard) materials it had. Medium and above are physically based: roughness, metalness and a normal map on every main
     surface, so the metal, the concrete, the glass and the damp floors answer the lamps and show reflections.
     Each material carries a tag (metadata.mk) that says what it is for the reflections: 'floor' (it shows the mirror), 'fx' (light pools and contact
     shadows: never reflected), 'glow' (signs, tubes, screens), 'core' (the room itself). */
  const tag=(m,t)=>{m.metadata={...(m.metadata||{}),mk:t};return m;},lin=hex=>B.Color3.FromHexString(hex).toLinearSpace();
  const tile=t=>{t.wrapU=t.wrapV=B.Texture.WRAP_ADDRESSMODE;return t;};   // a DynamicTexture clamps by default
  let seed=20261116;const rnd=()=>(seed=(seed*1664525+1013904223)>>>0)/4294967296;
  const tex=(w,h,draw)=>{const t=new B.DynamicTexture('milked-tex',{width:w,height:h},scene,false);own.push(t);const g=t.getContext();draw(g,w,h,0);t.update();return t;};
  // A normal map from a drawn height picture (white is high): how the painted surfaces get their relief.
  const normalFrom=(size,draw,depth=2)=>{const c=document.createElement('canvas');c.width=c.height=size;const cg=c.getContext('2d');draw(cg,size,size);const src=cg.getImageData(0,0,size,size).data,t=new B.DynamicTexture('milked-normal',{width:size,height:size},scene,true);own.push(t);
   const g=t.getContext(),out=g.createImageData(size,size),o=out.data,Hh=(x,y)=>src[(((y+size)%size)*size+((x+size)%size))*4]/255;
   for(let y=0;y<size;y++)for(let x=0;x<size;x++){const ax=(Hh(x+1,y)-Hh(x-1,y))*depth,ay=(Hh(x,y+1)-Hh(x,y-1))*depth,l=1/Math.hypot(ax,ay,1),i=(y*size+x)*4;o[i]=(-ax*l*.5+.5)*255;o[i+1]=(ay*l*.5+.5)*255;o[i+2]=(l*.5+.5)*255;o[i+3]=255;}
   g.putImageData(out,0,0);t.update();return tile(t);};
  // fine scratches and small dents for the plain dark metal parts (frames, trims, doors)
  let scuffT=null;const scuff=()=>scuffT||(scuffT=normalFrom(256,(g,w,h)=>{g.fillStyle='#808080';g.fillRect(0,0,w,h);seed=313;g.lineWidth=1;for(let i=0;i<300;i++){const x=rnd()*w,y=rnd()*h,l=10+rnd()*90,a=(rnd()-.5)*.5+(rnd()<.2?1.5:0);g.strokeStyle=rnd()<.5?'rgba(255,255,255,.3)':'rgba(0,0,0,.34)';g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);g.stroke();}
   for(let i=0;i<26;i++){const x=rnd()*w,y=rnd()*h,r=3+rnd()*9,gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(0,0,0,.5)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);}},1.6));
  // How each plain-coloured material is finished on Medium and above: [metalness, roughness]. Anything not listed is a matt non-metal.
  const FINISH={metal:[.9,.4],trim:[.85,.36],dark:[.55,.5],black:[.5,.42],door:[.8,.36],stand:[.8,.42],cam:[.6,.4],lens:[.1,.08],brass:[1,.3],mirror:[1,.06],dome:[.2,.12],'pipe-red':[.5,.5],'door-glass':[0,.05],glass:[0,.04],acrylic:[0,.08],crt:[.2,.3],mug:[0,.25],bin:[.7,.5],dumpster:[.6,.55],'dumpster-lid':[.6,.5],fire:[.3,.35],bucket:[0,.4],chaise:[0,.5],ottoman:[0,.5],'stool-p':[0,.5]};
  const CORE=/^(metal|trim|dark|black|door|stand|mirror|door-glass|glass)$/,SCUFFED=/^(metal|trim|dark|black|door)$/;
  const M=(name,hex,em,alpha)=>{const key='m'+name+hex+em+alpha;if(matCache.has(key))return matCache.get(key);let m;
   if(low){m=new B.StandardMaterial('milked-'+name,scene);m.diffuseColor=B.Color3.FromHexString(hex);m.specularColor=new B.Color3(.2,.2,.24);if(em)m.emissiveColor=B.Color3.FromHexString(em);}
   else{const f=FINISH[name]||[0,.72];m=new B.PBRMaterial('milked-'+name,scene);m.albedoColor=lin(hex);m.metallic=f[0];m.roughness=f[1];m.usePhysicalLightFalloff=!interior;if(em)m.emissiveColor=lin(em);if(SCUFFED.test(name)){m.bumpTexture=scuff();m.bumpTexture.level=.7;}pbrs.push(m);}
   if(alpha!=null){m.alpha=alpha;m.backFaceCulling=false;}m.maxSimultaneousLights=8;if(CORE.test(name))tag(m,'core');own.push(m);matCache.set(key,m);return m;};
  const G=(name,hex,k=1)=>{const key='g'+name+hex+k;if(matCache.has(key))return matCache.get(key);const m=new B.StandardMaterial('milked-'+name,scene);m.diffuseColor=B.Color3.Black();m.specularColor=B.Color3.Black();m.emissiveColor=B.Color3.FromHexString(hex).scale(low?k:k*1.5);m.disableLighting=true;own.push(m);matCache.set(key,m);return tag(m,'glow');};
  // A surface from one of the repository's texture sets. Low: colour only. Medium and above: colour, normal map and either the set's own occlusion /
  // roughness / metalness map (`orm`) or plain numbers. `glow` re-uses the colour map as a faint light of its own so the weathering still reads where no lamp
  // reaches ("dark is not black"). `wet` gives a floor its damp patches (below); `f0` is how strongly a non-metal mirrors what is in front of it.
  const fileTex=(rel,level)=>{const t=new B.Texture(HERE+'assets/'+rel,scene);t.wrapU=t.wrapV=B.Texture.WRAP_ADDRESSMODE;if(level!=null)t.level=level;own.push(t);return t;};
  const ormOn=(m,t)=>{m.metallicTexture=t;m.useRoughnessFromMetallicTextureAlpha=false;m.useRoughnessFromMetallicTextureGreen=true;m.useMetallnessFromMetallicTextureBlue=true;m.useAmbientOcclusionFromMetallicTextureRed=true;};
  // The damp floor: a drawn roughness map (green channel) of smooth wet patches on a duller floor, with drag marks. It repeats every 7 m or so, not with the tiles.
  let wetT=null;const wetMap=()=>{if(wetT)return wetT;wetT=tile(tex(512,512,(g,w,h)=>{g.fillStyle='rgb(255,118,0)';g.fillRect(0,0,w,h);seed=4242;
    for(let i=0;i<30;i++){const x=rnd()*w,y=rnd()*h,r=28+rnd()*74,sx=1+rnd()*.9,a=rnd()*3;for(const ox of [-w,0,w])for(const oy of [-h,0,h]){g.save();g.translate(x+ox,y+oy);g.rotate(a);g.scale(sx,1);const gr=g.createRadialGradient(0,0,r*.3,0,0,r);gr.addColorStop(0,'rgba(255,14,0,.96)');gr.addColorStop(.72,'rgba(255,24,0,.8)');gr.addColorStop(1,'rgba(255,118,0,0)');g.fillStyle=gr;g.beginPath();g.arc(0,0,r,0,7);g.fill();g.restore();}}
    for(let i=0;i<150;i++){g.fillStyle='rgba(255,'+(150+Math.floor(rnd()*70))+',0,.4)';g.fillRect(rnd()*w,rnd()*h,16+rnd()*90,1+rnd()*2.4);}}));wetT.uScale=wetT.vScale=.31;return wetT;};
  const surf=(name,set,sep,tint,o={})=>{let m;
   if(low){m=new B.StandardMaterial('milked-'+name,scene);m.diffuseTexture=fileTex(set+sep+'color.jpg');m.diffuseColor=B.Color3.FromHexString(tint);const s=o.spec??.12;m.specularColor=new B.Color3(s,s,s*1.08);m.specularPower=o.power??32;if(o.glow)m.emissiveTexture=fileTex(set+sep+'color.jpg',o.glow);}
   else{m=new B.PBRMaterial('milked-'+name,scene);const c=fileTex(set+sep+'color.jpg'),p=o.pt??1;m.albedoTexture=c;m.albedoColor=new B.Color3(p,p,p*1.05);m.bumpTexture=fileTex(set+sep+'normal.jpg');m.bumpTexture.level=o.bump??1;m.usePhysicalLightFalloff=!interior;
    if(o.orm){ormOn(m,fileTex(set+sep+'orm.jpg'));m.metallic=o.metal??1;m.roughness=o.rough??1;}else if(o.wet){ormOn(m,wetMap());m.metallic=1;m.roughness=1;}else{m.metallic=o.metal??0;m.roughness=o.rough??.7;}
    if(o.f0)m.metallicF0Factor=o.f0;if(o.glow){m.emissiveTexture=c;const e=o.glow*(o.lift??.6);m.emissiveColor=new B.Color3(e,e,e*1.06);}pbrs.push(m);}
   m.maxSimultaneousLights=8;if(o.twoSided)m.backFaceCulling=false;own.push(m);return tag(m,o.tag||'core');};
  const KIT='textures/district-interior/kit_';
  const S={
   wall:surf('wall',KIT+'gunmetal','_','#7c7a88',{spec:.24,power:42,glow:.2,orm:1,pt:2.6}),              // near-black weathered metal: scratches and rust blooms
   concrete:surf('concrete',KIT+'concrete','_','#a9a6b2',{spec:.05,glow:.2,orm:1,pt:2.6}),              // stained, streaked concrete panels (inside)
   front:surf('front',KIT+'concrete','_','#c4c1cc',{spec:.06,glow:.42,orm:1,pt:2.4}),                   // the same concrete on the street, lifted a little for the night
   floor:surf('floor','textures/ncz/concrete-mold','-','#6a6574',{spec:.55,power:96,glow:.16,bump:.5,wet:1,f0:6,pt:1.1,tag:'floor'}),   // dark and damp: it mirrors the neon
   steel:surf('steel',KIT+'steel','_','#6f6d78',{spec:.42,power:64,glow:.16,orm:1,pt:1.8}),                   // brushed metal: doors, ducts, frames
   rust:surf('rust',KIT+'metal','_','#b9b2b4',{spec:.16,glow:.24,orm:1,pt:2.6}),                        // dark oxidised metal: ceilings, pipes, old plant
   wood:surf('wood','vr/textures/wood-floor','-','#8d7667',{spec:.28,power:56,glow:.16,rough:.32,f0:3,pt:1.3,tag:'floor'}),   // lacquered boards
   cloth:surf('cloth','vr/textures/fabric','-','#5d5f69',{spec:.04,glow:.2,twoSided:true,rough:.95,pt:1.1})};
  // (On Low a few near-identical dark materials are one, so that the contact shadows and the merged light pools cost it no extra draw calls.)
  const metal=M('metal','#1a1920','#0b0a10'),trim=M('trim','#3c3946','#1c1a24'),dark=low?metal:M('dark','#121017','#08070c'),black=M('black','#08080b','#040406');
  const pink=G('pink',PINK),green=G('green',GREEN),glowW=G('white',WHITE),red=G('red',RED),pinkDim=G('pink-dim',PINK,.45),greenDim=G('green-dim',GREEN,.4),warm=G('warm',WARM,.8);
  const tone=c=>c==='pink'?pink:green,hexOf=c=>c==='pink'?PINK:GREEN;
  // put(): a mesh that is merged with its material neighbours at the end (static), or kept (animated, or added after the merge).
  const put=(mesh,mat,x,y,z,keep)=>{mesh.material=mat;mesh.parent=node;mesh.position.set(x,y,z);mesh.isPickable=false;if(!keep&&!merged){let g=groups.get(mat);if(!g)groups.set(mat,g=[]);g.push(mesh);}return mesh;};
  const box=(w,h,d,x,y,z,mat,keep)=>put(B.MeshBuilder.CreateBox('milked-box',{width:w,height:h,depth:d},scene),mat,x,y,z,keep);
  const rbox=(w,h,d,x,y,z,mat,rx,ry,rz)=>{const m=box(w,h,d,x,y,z,mat);m.rotation.set(rx||0,ry||0,rz||0);return m;};
  // A textured block whose texture repeats every k metres on every face, whatever its size.
  const tbox=(w,h,d,x,y,z,mat,k=2.4,keep)=>{const f=(a,b)=>new B.Vector4(0,0,a/k,b/k);return put(B.MeshBuilder.CreateBox('milked-tbox',{width:w,height:h,depth:d,faceUV:[f(w,h),f(w,h),f(d,h),f(d,h),f(w,d),f(w,d)],wrap:true},scene),mat,x,y,z,keep);};
  const cyl=(dia,h,x,y,z,mat,keep,seg=14)=>put(B.MeshBuilder.CreateCylinder('milked-cyl',{diameter:dia,height:h,tessellation:seg},scene),mat,x,y,z,keep);
  const pipe=(dia,len,axis,x,y,z,mat)=>{const m=cyl(dia,len,x,y,z,mat,false,8);if(axis==='x')m.rotation.z=PI/2;else m.rotation.x=PI/2;return m;};
  const cone=(dia,h,x,y,z,mat,seg=10)=>put(B.MeshBuilder.CreateCylinder('milked-cone',{diameterBottom:dia,diameterTop:0,height:h,tessellation:seg},scene),mat,x,y,z);
  const ball=(dia,x,y,z,mat,sy=1)=>{const m=put(B.MeshBuilder.CreateSphere('milked-ball',{diameter:dia,segments:8},scene),mat,x,y,z);m.scaling.y=sy;return m;};
  const torus=(dia,th,x,y,z,mat,rx,ry)=>{const m=put(B.MeshBuilder.CreateTorus('milked-ring',{diameter:dia,thickness:th,tessellation:28},scene),mat,x,y,z);m.rotation.set(rx||0,ry||0,0);return m;};
  // A painted surface (drawn here): lit, with a faint glow of its own drawing.
  const painted=(name,size,draw,o={})=>{let m;
   if(low){m=new B.StandardMaterial('milked-'+name,scene);m.diffuseTexture=tile(tex(size,size,draw));const s=o.spec??.1;m.specularColor=new B.Color3(s,s,s);m.specularPower=o.power??32;if(o.glow){const e=tile(tex(size,size,draw));e.level=o.glow;m.emissiveTexture=e;}}
   else{m=new B.PBRMaterial('milked-'+name,scene);const c=tile(tex(size,size,draw)),p=o.pt??1;m.albedoTexture=c;m.albedoColor=new B.Color3(p,p,p);m.metallic=o.metal??0;m.roughness=o.rough??.6;m.usePhysicalLightFalloff=!interior;if(o.height){m.bumpTexture=normalFrom(size,o.height,o.depth??2);m.bumpTexture.level=o.bump??1;}
    if(o.f0)m.metallicF0Factor=o.f0;if(o.glow){m.emissiveTexture=c;const e=o.glow*(o.lift??.5);m.emissiveColor=new B.Color3(e,e,e);}pbrs.push(m);}
   m.maxSimultaneousLights=8;own.push(m);return tag(m,o.tag||'core');};
  const emissiveMat=(t,alpha,cull)=>{const m=new B.StandardMaterial('milked-screen',scene);m.diffuseColor=B.Color3.Black();m.specularColor=B.Color3.Black();m.emissiveTexture=t;m.disableLighting=true;m.backFaceCulling=!!cull;if(alpha){m.opacityTexture=t;}own.push(m);return tag(m,'glow');};
  const plane=(w,h,mat,x,y,z,ry)=>{const p=put(B.MeshBuilder.CreatePlane('milked-plane',{width:w,height:h},scene),mat,x,y,z,true);p.rotation.y=ry;return p;};
  // A screen: a plane showing a small canvas that redraws every `period` seconds (cheap; no video).
  const screen=(w,h,px,py,pz,ry,cw,ch,draw,period=1.1)=>{const t=tex(cw,ch,draw),p=plane(w,h,emissiveMat(t),px,py,pz,ry);screens.push({t,draw,cw,ch,next:Math.random()*period,period,mesh:p});return p;};
  // A sign: drawn once, transparent where nothing is drawn, readable from its front only (so nothing is ever seen mirrored).
  const sign=(w,h,px,py,pz,ry,cw,ch,draw)=>plane(w,h,emissiveMat(tex(cw,ch,draw),true,true),px,py,pz,ry);
  // A picture pinned or pasted to a wall: lit a little by its own drawing, opaque.
  const picture=(w,h,px,py,pz,ry,cw,ch,draw,level=.75)=>{const t=tex(cw,ch,draw);t.level=level;const m=emissiveMat(t,false,true);return plane(w,h,m,px,py,pz,ry);};
  const FONT=s=>'bold '+s+'px Consolas,Menlo,monospace',LOGO=s=>'900 '+s+'px "Arial Black",Arial,Helvetica,sans-serif',HAN=s=>'bold '+s+'px '+CJK;
  // The droplet: a drawn shape (never an emoji), so it looks the same on every machine.
  const drop=(g,cx,cy,r,fill,stroke)=>{g.beginPath();g.moveTo(cx,cy-r*1.8);g.bezierCurveTo(cx+r*.15,cy-r*1.1,cx+r,cy-r*.45,cx+r,cy+r*.15);g.arc(cx,cy+r*.15,r,0,Math.PI,false);g.bezierCurveTo(cx-r,cy-r*.45,cx-r*.15,cy-r*1.1,cx,cy-r*1.8);g.closePath();if(fill){g.fillStyle=fill;g.fill();}if(stroke){g.strokeStyle=stroke;g.lineWidth=Math.max(2,r*.12);g.stroke();}};
  // The three white droplets of the logo, centred on (cx, cy), about 0.9 * px wide.
  const droplets=(g,cx,cy,px)=>{g.save();g.shadowColor='#ffffff';g.shadowBlur=px*.16;drop(g,cx-px*.14,cy+px*.1,px*.2,'#ffffff');g.shadowBlur=px*.1;drop(g,cx+px*.24,cy-px*.14,px*.115,'#ffffff');drop(g,cx+px*.3,cy+px*.3,px*.085,'#ffffff');g.restore();};
  // The logo: MILKED as a pink neon tube in a clean wide sans-serif, then the three white droplets.
  const logo=(g,cx,cy,px)=>{g.save();g.font=LOGO(px);g.textBaseline='middle';g.textAlign='left';const tw=g.measureText(CONFIG.NAME).width,dw=px*.95,x0=cx-(tw+dw)/2;g.lineJoin='round';
   g.shadowColor=PINK;g.shadowBlur=px*.3;g.strokeStyle=PINK;g.lineWidth=px*.085;g.strokeText(CONFIG.NAME,x0,cy);g.shadowBlur=px*.12;g.fillStyle='#ff8ad2';g.fillText(CONFIG.NAME,x0,cy);g.shadowBlur=0;g.strokeStyle='#ffe9f7';g.lineWidth=Math.max(1.5,px*.016);g.strokeText(CONFIG.NAME,x0,cy);g.restore();
   droplets(g,x0+tw+px*.5,cy-px*.03,px);};
  const logoSign=(w,px,py,pz,ry)=>sign(w,w*.24,px,py,pz,ry,820,197,(g,W,Hh)=>{g.clearRect(0,0,W,Hh);logo(g,W/2,Hh*.52,118);});
  // A wall plate: dark panel, hairline border, lines of text. lines: [text, colour, size, cjk?]
  const plate=(w,h,px,py,pz,ry,lines,o={})=>{const cw=Math.round(256*Math.max(1,w/h)),ch=Math.round(256*Math.max(1,h/w));return sign(w,h,px,py,pz,ry,cw,ch,(g,W,Hh)=>{g.fillStyle=o.bg||'#0b0b10';g.fillRect(0,0,W,Hh);g.strokeStyle=o.border||'#4a4e58';g.lineWidth=4;g.strokeRect(4,4,W-8,Hh-8);
   g.textAlign='center';g.textBaseline='middle';const total=lines.reduce((a,l)=>a+l[2]*1.35,0);let y=(Hh-total)/2;for(const [t,c,s,han] of lines){y+=s*.675;if(t==='@logo'){logo(g,W/2,y,s);}else{g.font=han?HAN(s):FONT(s);g.fillStyle=c;if(o.neon){g.shadowColor=c;g.shadowBlur=s*.35;}g.fillText(t,W/2,y);g.shadowBlur=0;}y+=s*.675;}});};
  const flat=p=>{p.rotation.x=PI/2;return p;};   // a sign lying on the floor, readable from above
  // A soft pool of light on a floor or a wall (radial glow, drawn once per colour).
  // On Low every pool of one colour is a single merged mesh (its strength is in the corners' alpha), so they cost three draw calls in all. Above Low they stay
  // separate, as they were (the bloom layer treats them one by one), and inside they are fainter there: the lamps and the floor's reflections do most of that work.
  const poolT=new Map(),pool=(hex,w,d,x,y,z,k=.5)=>{if(!low&&interior)k=+(k*.6).toFixed(3);const key=low?hex:hex+k,a=low?1:k;let m=poolT.get(key);if(!m){const t=tex(128,128,(g,W,Hh)=>{g.clearRect(0,0,W,Hh);const gr=g.createRadialGradient(64,64,4,64,64,62),c=B.Color3.FromHexString(hex),rgb=Math.round(c.r*255)+','+Math.round(c.g*255)+','+Math.round(c.b*255);gr.addColorStop(0,'rgba('+rgb+','+a+')');gr.addColorStop(1,'rgba('+rgb+',0)');g.fillStyle=gr;g.fillRect(0,0,W,Hh);});m=tag(emissiveMat(t,true),'fx');m.disableDepthWrite=true;poolT.set(key,m);}
   const p=put(B.MeshBuilder.CreatePlane('milked-pool',{width:w,height:d},scene),m,x,y,z,!low);if(low){p.setVerticesData(B.VertexBuffer.ColorKind,[1,1,1,k,1,1,1,k,1,1,1,k,1,1,1,k]);p.hasVertexAlpha=true;}return p;};
  // A contact shadow: a soft dark patch on the floor under a person or a piece of furniture (every quality; all of them are one merged mesh).
  const blobM=(()=>{const t=tex(64,64,(g,W,Hh)=>{g.clearRect(0,0,W,Hh);const gr=g.createRadialGradient(32,32,3,32,32,31);gr.addColorStop(0,'rgba(0,0,0,.82)');gr.addColorStop(.55,'rgba(0,0,0,.5)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,W,Hh);}),m=new B.StandardMaterial('milked-contact-shadow',scene);m.diffuseColor=B.Color3.Black();m.specularColor=B.Color3.Black();m.emissiveColor=B.Color3.Black();m.disableLighting=true;m.opacityTexture=t;m.disableDepthWrite=true;own.push(m);return tag(m,'fx');})();
  const blob=(x,z,w,d=w,y=.011)=>{const p=put(B.MeshBuilder.CreatePlane('milked-contact-shadow',{width:w,height:d},scene),blobM,x,y,z);p.rotation.x=PI/2;return p;};
  // Reflections (Medium and above). mirror(): the picture a flat wet floor shows, drawn at half size, softened where the floor is rough. The caller lists
  // what it shows with reflectIn().
  const mirror=(y=.005)=>{const t=new B.MirrorTexture('milked-mirror',{ratio:high?.75:.5},scene,true,0,B.Texture.TRILINEAR_SAMPLINGMODE);t.mirrorPlane=new B.Plane(0,-1,0,y);t.clearColor=new B.Color4(0,0,0,1);t.renderList=[];own.push(t);return t;};
  // What a reflection shows: never the floors themselves, the light pools or the contact shadows; on Medium the rooms, the signs and the people, on High everything.
  // `lit` (the street's puddles on Medium): only what glows, which is all a puddle shows of a dark wall at night.
  const reflectIn=(extra=[],lit=false)=>node.getChildMeshes(false).filter(m=>{const t=m.material?.metadata?.mk;return m.isEnabled()&&m.material&&t!=='floor'&&t!=='fx'&&(high||t==='glow'||(t==='core'&&!lit));}).concat(high?[]:extra);
  const wash=(hex,w,h,x,y,z,ry,k=.4)=>{const p=pool(hex,w,h,x,y,z,k);p.rotation.y=ry;return p;};

  // ---------------- painted surfaces ----------------
  // Ribbed rubber matting, a slotted steel floor grating, a quilted (diamond-padded) wall.
  const rubber=painted('rubber',128,(g,w,h)=>{g.fillStyle='#16161a';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=8){g.fillStyle='#26262c';g.fillRect(0,y,w,3);g.fillStyle='#0a0a0c';g.fillRect(0,y+5,w,2);}},{spec:.18,glow:.25,rough:.78,tag:'floor',
   height:(g,w,h)=>{g.fillStyle='#505050';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=8){g.fillStyle='#e0e0e0';g.fillRect(0,y,w,3);g.fillStyle='#000';g.fillRect(0,y+5,w,2);}}});
  const slots=(g,w,h)=>{for(let y=10;y<h;y+=32)for(let x=8+(Math.floor(y/32)%2)*20;x<w;x+=40){g.beginPath();g.roundRect(x,y,26,11,5);g.fill();}};
  const grate=painted('grate',256,(g,w,h)=>{g.fillStyle='#24262c';g.fillRect(0,0,w,h);seed=771;for(let i=0;i<900;i++){g.fillStyle='rgba('+(rnd()<.5?'255,255,255':'0,0,0')+','+(.03+rnd()*.06)+')';g.fillRect(rnd()*w,rnd()*h,2+rnd()*10,1);}
   for(let i=0;i<7;i++){const x=rnd()*w,y=rnd()*h,r=14+rnd()*30,gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(120,62,30,.4)');gr.addColorStop(1,'rgba(120,62,30,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);}   // rust blooms
   g.fillStyle='#050507';slots(g,w,h);g.strokeStyle='rgba(0,0,0,.6)';g.lineWidth=3;g.strokeRect(1.5,1.5,w-3,h-3);g.strokeStyle='rgba(140,150,165,.25)';g.lineWidth=1;g.strokeRect(4,4,w-8,h-8);},{spec:.5,power:70,glow:.3,metal:.7,rough:.34,pt:2.2,f0:4,tag:'floor',depth:2.6,
   height:(g,w,h)=>{g.fillStyle='#b0b0b0';g.fillRect(0,0,w,h);seed=772;for(let i=0;i<260;i++){g.fillStyle='rgba('+(rnd()<.5?'255,255,255':'0,0,0')+',.12)';g.fillRect(rnd()*w,rnd()*h,4+rnd()*30,1);}g.fillStyle='#fff';for(let y=26;y<h;y+=32)for(let x=28+(Math.floor(y/32)%2)*20;x<w;x+=40){g.beginPath();g.arc(x,y,2.6,0,7);g.fill();}
    g.filter='blur(1.2px)';g.fillStyle='#000';slots(g,w,h);g.filter='none';g.strokeStyle='#000';g.lineWidth=4;g.strokeRect(0,0,w,h);}});
  const diamonds=(g,w,inner,mid,outer,stud)=>{const n=4,s=w/n;for(let i=-1;i<=n;i++)for(let j=-1;j<=n*2;j++){const cx=i*s+(j%2?s/2:0)+s/2,cy=j*s/2;const gr=g.createRadialGradient(cx-s*.08,cy-s*.1,2,cx,cy,s*.55);gr.addColorStop(0,inner);gr.addColorStop(.6,mid);gr.addColorStop(1,outer);g.fillStyle=gr;g.beginPath();g.moveTo(cx,cy-s/2);g.lineTo(cx+s/2,cy);g.lineTo(cx,cy+s/2);g.lineTo(cx-s/2,cy);g.closePath();g.fill();}
   g.fillStyle=stud;for(let i=0;i<=n;i++)for(let j=0;j<=n*2;j++){g.beginPath();g.arc(i*s+(j%2?s/2:0),j*s/2,3.2,0,7);g.fill();}};
  const quilt=painted('quilt',256,(g,w,h)=>{g.fillStyle='#17161b';g.fillRect(0,0,w,h);diamonds(g,w,'#3a3840','#1f1e24','#09090b','#050506');},{spec:.22,power:24,glow:.42,rough:.42,f0:1.6,pt:1.5,depth:3.2,lift:.3,
   height:(g,w,h)=>{g.fillStyle='#000';g.fillRect(0,0,w,h);diamonds(g,w,'#ffffff','#b4b4b4','#000000','#000000');}});
  // Abstract posters (text and shapes only: no people, no brands).
  const POSTERS=[
   (g,w,h)=>{g.fillStyle='#120a14';g.fillRect(0,0,w,h);g.strokeStyle=PINK;g.lineWidth=6;for(let i=0;i<6;i++){g.globalAlpha=.9-i*.13;g.beginPath();g.arc(w/2,h*.42,20+i*22,0,7);g.stroke();}g.globalAlpha=1;droplets(g,w/2-6,h*.42,90);g.fillStyle='#fff';g.font=LOGO(34);g.textAlign='center';g.fillText('LIVE',w/2,h*.82);g.fillStyle=GREEN;g.font=FONT(18);g.fillText('EVERY NIGHT',w/2,h*.92);},
   (g,w,h)=>{g.fillStyle='#07130e';g.fillRect(0,0,w,h);for(let i=0;i<9;i++){g.fillStyle=i%2?'#0f2a1c':'#39ff9c';g.globalAlpha=i%2?1:.75;g.fillRect(0,h*.1+i*h*.07,w*(.3+((i*37)%60)/100),h*.035);}g.globalAlpha=1;g.fillStyle='#fff';g.font=LOGO(30);g.textAlign='left';g.fillText('ON AIR',16,h*.86);g.fillStyle=PINK;g.font=HAN(22);g.fillText('直播中',18,h*.95);},
   (g,w,h)=>{g.fillStyle='#16161b';g.fillRect(0,0,w,h);g.fillStyle='#ffd400';for(let i=-4;i<12;i++){g.beginPath();g.moveTo(i*40,0);g.lineTo(i*40+20,0);g.lineTo(i*40-20,60);g.lineTo(i*40-40,60);g.fill();}g.fillStyle='#f4f8ff';g.font=LOGO(30);g.textAlign='center';g.fillText('QUIET',w/2,h*.45);g.fillText('ON SET',w/2,h*.6);g.fillStyle='#9aa3b0';g.font=FONT(15);g.fillText('PHONES OFF · DOORS SHUT',w/2,h*.8);},
   (g,w,h)=>{const gr=g.createLinearGradient(0,0,w,h);gr.addColorStop(0,'#3a0d2a');gr.addColorStop(1,'#07201a');g.fillStyle=gr;g.fillRect(0,0,w,h);g.strokeStyle='rgba(255,255,255,.75)';g.lineWidth=3;for(let i=0;i<5;i++){g.beginPath();g.moveTo(w*.1,h*(.2+i*.1));g.bezierCurveTo(w*.4,h*(.1+i*.1),w*.6,h*(.34+i*.1),w*.9,h*(.2+i*.1));g.stroke();}g.fillStyle=PINK;g.font=LOGO(26);g.textAlign='center';g.fillText('SIGNAL',w/2,h*.84);g.fillStyle='#fff';g.font=FONT(15);g.fillText('SEASON 04 · CH 12',w/2,h*.93);}];
  const poster=(i,w,px,py,pz,ry)=>picture(w,w*1.42,px,py,pz,ry,200,284,(g,W,Hh)=>{POSTERS[i%POSTERS.length](g,W,Hh);g.strokeStyle='rgba(0,0,0,.6)';g.lineWidth=5;g.strokeRect(0,0,W,Hh);},.7);
  // A wall of pinned photographs: abstract colour prints (no people), tape, a string of small lamps.
  const photoWall=(w,h,px,py,pz,ry,sd)=>picture(w,h,px,py,pz,ry,512,Math.round(512*h/w),(g,W,Hh)=>{seed=sd;g.fillStyle='#14131a';g.fillRect(0,0,W,Hh);const n=Math.round(W*Hh/5200);
   for(let i=0;i<n;i++){const pw=44+rnd()*34,ph=pw*(rnd()<.5?1.2:.82),x=8+rnd()*(W-pw-16),y=8+rnd()*(Hh-ph-16);g.save();g.translate(x+pw/2,y+ph/2);g.rotate((rnd()-.5)*.3);g.fillStyle='#e9e4dc';g.fillRect(-pw/2,-ph/2,pw,ph);
    const hues=[[255,63,180],[57,255,156],[255,190,120],[90,120,255],[230,230,240]],a=hues[Math.floor(rnd()*5)],b=hues[Math.floor(rnd()*5)],gr=g.createLinearGradient(-pw/2,-ph/2,pw/2,ph/2);gr.addColorStop(0,'rgb('+a.map(v=>Math.round(v*.55))+')');gr.addColorStop(1,'rgb('+b.map(v=>Math.round(v*.3))+')');g.fillStyle=gr;g.fillRect(-pw/2+4,-ph/2+4,pw-8,ph-(rnd()<.6?16:8));
    g.fillStyle='rgba(255,255,255,.35)';g.beginPath();g.arc((rnd()-.5)*pw*.4,(rnd()-.5)*ph*.3,3+rnd()*7,0,7);g.fill();g.fillStyle='rgba(220,210,170,.8)';g.fillRect(-9,-ph/2-4,18,8);g.restore();}
   g.strokeStyle='rgba(40,40,46,1)';g.lineWidth=2;g.beginPath();g.moveTo(0,14);g.quadraticCurveTo(W/2,44,W,12);g.stroke();for(let i=0;i<14;i++){const t=i/13,x=t*W,y=14+Math.sin(t*Math.PI)*15;g.fillStyle=i%2?'#ffb9e2':'#fff2c9';g.shadowColor=g.fillStyle;g.shadowBlur=8;g.beginPath();g.arc(x,y+4,3,0,7);g.fill();}g.shadowBlur=0;},.8);

  // ---------------- doors ----------------
  // A sliding leaf of door `id`: slides along `axis` from its closed place by `travel` metres as the door opens. Children (glass, decals) ride with it.
  const leaf=(id,mesh,axis,travel)=>{let l=leaves.get(id);if(!l)leaves.set(id,l=[]);l.push({m:mesh,axis,from:mesh.position[axis],travel});return mesh;};
  const child=(mesh,par,x,y,z)=>{mesh.parent=par;mesh.position.set(x,y,z);return mesh;};
  /* The door control. Every frame a door opens toward 1 when this environment may open it and the player is near (or it was just released), else it closes; its
     collision box is in place whenever it is less than 80% open, and a door never closes on someone standing in the doorway.
     The checkpoint's controls: secure(true) closes every door and keeps it closed; closed() is the door sensors (every leaf shut AND its collision in place);
     release(id) ends the seal and holds that door open for a while. */
  function doorControl(){
   const list=DOORS.map(d=>({...d,open:0,kick:0,can:MK.openable(d,area),leaves:leaves.get(d.id)||[]}));let secured=!!root.VoidMilkedGate?.busy;   // built during a transfer: the doors start sealed
   // Resolve against the current location every time: a scene can start ticking while the loader still holds the previous place's collision list.
   const solidOf=d=>(typeof walkingLocation!=='undefined'?walkingLocation?.solids:null)?.find?.(s=>s.id===d.id)||null;
   function tick(dt,cam){if(!cam)return;for(const d of list){d.kick=Math.max(0,d.kick-dt);
     const along=d.axis==='x'?cam.x-d.x:cam.z-d.z,across=d.axis==='x'?cam.z-d.z:cam.x-d.x,near=Math.hypot(along,across)<d.reach,inDoorway=Math.abs(along)<d.half+.3&&Math.abs(across)<.72;
     const want=secured?d.open>.05&&inDoorway:d.can&&(near||d.kick>0)||(d.open>.05&&inDoorway),before=d.open;d.open=Math.max(0,Math.min(1,d.open+(want?1:-1)*dt*1.5));
     if(d.open!==before){const e=d.open*d.open*(3-2*d.open);for(const l of d.leaves)l.m.position[l.axis]=l.from+l.travel*e;}
     const s=solidOf(d);if(s&&s.door)s.open=d.open>=.8;}}
   return {tick,list,secure(on){secured=!!on;if(on)for(const d of list)d.kick=0;},get secured(){return secured;},
    closed(){return list.every(d=>{const s=solidOf(d);return d.open<=.02&&(!s||!s.open);});},openness(){return list.reduce((a,d)=>a+d.open,0);},
    release(id,seconds=6){secured=false;const d=list.find(x=>x.id===id);if(d&&d.can)d.kick=seconds;},
    state:()=>list.map(d=>({id:d.id,open:+d.open.toFixed(2),locked:!d.can,blocking:!!solidOf(d)&&!solidOf(d).open}))};}
  // Small automatic doors inside the building (no collision of their own: they are open by the time anyone reaches them).
  const autos=[],auto=(mesh,axis,travel,cx,cz,r=2.6,lock=null)=>{autos.push({m:mesh,axis,from:mesh.position[axis],travel,cx,cz,r,k:0,lock});return mesh;};
  /* The staff-only door (Mission 003): it opens, and its collision box (milked.js solids, id STAFF_DOOR.id) gives way, only for a player Eva has let through. Per player:
     each client reads its own save. Read every frame, so it opens the moment Eva grants access. */
  const staffOpen=()=>{try{return !!MK.staffAccess?.(typeof state!=='undefined'?state?.story?.flags:null);}catch{return false;}};
  const staffSolid=()=>(typeof walkingLocation!=='undefined'?walkingLocation?.solids:null)?.find?.(s=>s.staff)||null;

  // ---------------- props: optional Meshy models (assets/models/milked/), sized by height and stood on the floor; a stand-in is built here if one is missing ----------------
  const model=name=>{let p=models.get(name);if(!p){p=root.VoidAssets.loadContainer({src:'assets/models/milked/milked-'+name+'.glb'},scene,null,'milked:'+name).then(c=>{if(disposed){c.dispose();throw Error('gone');}containers.push(c);
     for(const m of c.materials){if('usePhysicalLightFalloff' in m){m.usePhysicalLightFalloff=false;m.environmentIntensity=.45;m.directIntensity=1.5;if(/ring-light|softbox/.test(name)&&m.albedoTexture){m.emissiveTexture=m.albedoTexture;m.emissiveColor=new B.Color3(.55,.55,.6);}else if(m.albedoTexture){m.emissiveTexture=m.albedoTexture;m.emissiveColor=new B.Color3(.1,.1,.11);}}m.maxSimultaneousLights=8;}return c;});models.set(name,p);}return p;};
  const prop=(name,x,z,ry,h,y=0,standIn)=>{if(low||!root.VoidAssets?.loadContainer){standIn?.();return;}
   late.push(model(name).then(c=>{if(disposed)return;const inst=c.instantiateModelsToScene(n=>'milked-'+n,false,{doNotInstantiate:true}),n=new B.TransformNode('milked-prop-'+name,scene);n.parent=node;root.VoidAssets.ownInstance(inst,n);for(const r0 of inst.rootNodes)r0.parent=n;
     n.position.set(x,0,z);n.rotation.y=ry;n.computeWorldMatrix(true);for(const m of n.getChildMeshes())m.computeWorldMatrix(true);
     const bb=n.getHierarchyBoundingVectors(true),sc=h/Math.max(.01,bb.max.y-bb.min.y);n.scaling.setAll(sc);n.position.y=y-bb.min.y*sc;for(const m of n.getChildMeshes()){m.isPickable=false;m.freezeWorldMatrix?.();}})
    .catch(e=>{if(disposed)return;console.info('[Milked] prop not available: '+name);try{standIn?.();}catch{}}));};
  // The stand-ins (also what Low quality shows).
  const standM=low?trim:M('stand','#23232b','#0e0e13'),camM=low?black:M('cam','#101016','#07070b'),lens=M('lens','#1c2a3a','#0a1220'),leafM=M('leaf','#1c5a3a','#0c2a1a'),potM=low?metal:M('pot','#15151a','#09090c');
  const tripod=(x,z,h,a0=0)=>{cyl(.04,h,x,h/2,z,standM,false,8);for(let k=0;k<3;k++){const a=k*2.094+a0;rbox(.03,.72,.03,x+Math.sin(a)*.2,.33,z+Math.cos(a)*.2,standM,Math.cos(a)*.6,0,-Math.sin(a)*.6);}};
  const simple={
   camera:(x,z,yaw,h=1.45)=>{tripod(x,z,h-.1);rbox(.2,.16,.32,x,h,z,camM,0,yaw,0);const ln=cyl(.11,.14,x+Math.sin(yaw)*.22,h,z+Math.cos(yaw)*.22,lens,false,12);ln.rotation.set(PI/2,yaw,0);box(.035,.035,.035,x+Math.sin(yaw)*.14,h+.1,z+Math.cos(yaw)*.14,red);},
   ring:(x,z,yaw,h=1.8)=>{tripod(x,z,h-.3);torus(.46,.05,x,h-.1,z,glowW,PI/2,yaw);},
   softbox:(x,z,yaw,h=2)=>{tripod(x,z,h-.45);rbox(.7,.9,.14,x,h-.2,z,dark,0,yaw,0);rbox(.62,.82,.02,x+Math.sin(yaw)*.08,h-.2,z+Math.cos(yaw)*.08,G('softbox',WHITE,.85),0,yaw,0);},
   plant:(x,z,h=1.6,y=0)=>{cyl(.4,.4,x,y+.2,z,potM,false,10);const cane=M('cane','#3d5a2a','#1a2a12');for(const [a,b,c] of [[0,0,1],[.12,.08,.82],[-.11,.09,.88],[.03,-.13,.74],[-.06,-.08,.94]]){const top=h*c;rbox(.028,top,.028,x+a*1.4,y+.4+top/2,z+b*1.4,cane,b*.35,0,-a*.35);for(let i=0;i<3;i++){const t=.55+i*.2,m=ball(.34-i*.05,x+a*(1.4+t*1.6)+(i-1)*.07,y+.4+top*t,z+b*(1.4+t*1.6)+(1-i)*.06,leafM,.42);m.rotation.set(b*2,i*1.3,a*2);}}},
   vine:(x,z,y)=>{cyl(.24,.18,x,y+.09,z,potM,false,10);ball(.36,x,y+.24,z,leafM,.6);for(const [a,b] of [[.12,0],[-.1,.06],[0,-.12]])box(.05,.5,.05,x+a,y-.12,z+b,leafM);},
   chair:(x,z,yaw)=>{cyl(.5,.05,x,.06,z,standM,false,5);cyl(.06,.4,x,.26,z,standM,false,8);box(.5,.06,.5,x,.48,z,dark);rbox(.48,.6,.06,x-Math.sin(yaw)*.24,.85,z-Math.cos(yaw)*.24,dark,0,yaw,0);},
   cart:(x,z)=>{tbox(1,.6,.6,x,.52,z,S.cloth,1);for(const sx of [-1,1])for(const sz of [-1,1]){box(.03,.8,.03,x+sx*.5,.45,z+sz*.3,trim);cyl(.1,.04,x+sx*.45,.06,z+sz*.26,black,false,8).rotation.x=PI/2;}box(1.04,.03,.64,x,.84,z,trim);box(.8,.06,.4,x,.84,z,M('towel','#2a2c36','#12131a'));},
   flightCase:(x,z,w=.7,d=1,h=.6)=>{box(w,h,d,x,h/2+.06,z,black);for(const sx of [-1,1])for(const sz of [-1,1]){box(.04,h+.02,.04,x+sx*w/2,h/2+.06,z+sz*d/2,trim);}box(w+.03,.03,d+.03,x,h+.07,z,trim);box(w+.03,.03,d+.03,x,.07,z,trim);},
   cat:(x,y,z)=>{ball(.16,x,y+.08,z,M('cat','#e9e4dc','#55504a'));ball(.12,x,y+.2,z,M('cat','#e9e4dc','#55504a'));box(.03,.09,.03,x+.07,y+.25,z,M('cat','#e9e4dc','#55504a'));},
   shark:(x,y,z)=>{ball(.3,x,y+.07,z,M('plush-shark','#5f7f9a','#22303c'),.45);}};
  const lantern=(x,z,h=.7)=>{box(.3,.03,.3,x,.015,z,black);const m=cyl(.26,h,x,h/2+.03,z,G('lantern','#ffcf9a',.75),false,12);box(.3,.03,.3,x,h+.045,z,black);for(let i=1;i<5;i++)torus(.265,.008,x,.03+i*h/5,z,black,0,0);return m;};
  // Ceiling services: a duct, two pipes and a cable tray run along `axis` between a and b at the given cross position.
  const services=(axis,a,b,c,y,o={})=>{const len=b-a,mid=(a+b)/2,at=(off,yy)=>axis==='x'?[mid,yy,c+off]:[c+off,yy,mid];
   if(o.duct!==false){const [x,yy,z]=at(o.ductOff??0,y);tbox(axis==='x'?len:.42,.3,axis==='x'?.42:len,x,yy,z,S.steel,1.6);for(let k=a+1;k<b;k+=1.6){const p=axis==='x'?[k,yy,z]:[x,yy,k];box(axis==='x'?.05:.46,.34,axis==='x'?.46:.05,p[0],p[1],p[2],trim);}}
   if(o.pipes!==false)for(const [off,dia,mat] of [[(o.pipeOff??.42),.08,S.rust],[(o.pipeOff??.42)+.13,.05,M('pipe-red','#5a1c1c','#240a0a')]]){const [x,yy,z]=at(off,y+.06);pipe(dia,len,axis,x,yy,z,mat);}
   if(o.tray!==false){const [x,yy,z]=at(o.trayOff??-.45,y-.02);box(axis==='x'?len:.3,.03,axis==='x'?.3:len,x,yy,z,trim);for(const [off,mat] of [[-.08,black],[0,M('cable-g','#123a28','#081c13')],[.08,black]]){const q=at((o.trayOff??-.45)+off,y+.01);pipe(.035,len,axis,q[0],q[1],q[2],mat);}
    for(let k=a+.6;k<b;k+=1.8){const q=axis==='x'?[k,y+.12,z]:[x,y+.12,k];box(.02,.26,.02,q[0],q[1],q[2],trim);}}};
  // A tube light: a lit tube in a dark fitting, hung under the ceiling.
  const tube=(axis,len,x,y,z,mat)=>{box(axis==='x'?len+.1:.09,.04,axis==='x'?.09:len+.1,x,y+.045,z,black);pipe(.045,len,axis,x,y,z,mat);};
  const drain=(x,z,w=.5)=>plane(w,w,grateFlat,x,.012,z,0).rotation.x=PI/2;
  const grateFlat=grate;

  // ================================================================ pieces built in BOTH environments ================================================================
  const [fx0,fx1,fz0,fz1]=FOOTPRINT,FZ=fz1,BZ=fz0,dx=DOOR.x;
  const wallOf=(seg,mat=S.wall,hgt=CEIL)=>{const [id,axis,c]=seg;
   for(const [s0,s1] of spansOf(seg)){const len=s1-s0,mid=(s0+s1)/2;if(axis==='z')tbox(len,hgt,T,mid,hgt/2,c,mat);else tbox(T,hgt,len,c,hgt/2,mid,mat);}
   for(const [g0,g1] of seg[5]){const len=g1-g0,mid=(g0+g1)/2,top=id==='vest-inner'?INNER.height:id==='front'?DOOR.height:id==='rear'?REAR.height:2.2;if(hgt-top<.02)continue;
    if(axis==='z'){tbox(len,hgt-top,T,mid,(hgt+top)/2,c,mat);for(const e of [g0,g1])box(.08,top,T+.08,e,top/2,c,metal);box(len+.08,.08,T+.08,mid,top+.04,c,metal);}
    else{tbox(T,hgt-top,len,c,(hgt+top)/2,mid,mat);for(const e of [g0,g1])box(T+.08,top,.08,c,top/2,e,metal);box(T+.08,.08,len+.08,c,top+.04,mid,metal);}}};
  const seg=id=>SEGMENTS.find(s=>s[0]===id);
  // A glass door leaf with a dark metal frame, a small logo and a hazard-striped band at waist height on both faces.
  const hazard=(g,w,h)=>{g.fillStyle='#17171b';g.fillRect(0,0,w,h);g.fillStyle='#f2c400';for(let i=-2;i<w/h*2+2;i++){g.beginPath();g.moveTo(i*h,0);g.lineTo(i*h+h*.5,0);g.lineTo(i*h-h*.5,h);g.lineTo(i*h-h,h);g.fill();}};
  const glassM=M('door-glass','#16262e','#081014',.42);
  const decal=(par,w,hgt,face,zoff,xoff=0,lw=w*.7)=>{const lg=sign(lw,lw*.24,0,0,0,face,410,98,(g,W,Hh)=>{g.clearRect(0,0,W,Hh);logo(g,W/2,Hh*.52,58);});child(lg,par,xoff,hgt*.16,zoff);const hz=picture(w,.09,0,0,0,face,256,24,hazard,.6);child(hz,par,0,-hgt*.12,zoff);};
  function glassLeaf(id,w,hgt,x,z,travel){const f=put(B.MeshBuilder.CreateBox('milked-leaf',{width:w,height:hgt,depth:.03},scene),glassM,x,hgt/2,z,true);leaf(id,f,'x',travel);
   for(const [bw,bh,bx,by] of [[w,.07,0,hgt/2-.035],[w,.1,0,-hgt/2+.05],[.06,hgt,-w/2+.03,0],[.06,hgt,w/2-.03,0]])child(box(bw,bh,.06,0,0,0,metal,true),f,bx,by,0);
   decal(f,w-.16,hgt,TON,.02);decal(f,w-.16,hgt,TOS,-.02);return f;}

  // ---- the security vestibule (front): a small dark lobby between two sets of double doors ----
  function vestibule(){const [vx0,vx1,vz0]=VESTIBULE,vcz=(vz0+FZ)/2,dep=FZ-vz0,VH=2.9;
   for(const id of ['vest-west','vest-east','vest-inner'])wallOf(seg(id));
   tbox(vx1-vx0,.08,dep,dx,-.035,vcz,S.floor,2);tbox(vx1-vx0-.2,.1,dep-.2,dx,VH+.05,vcz,S.rust,2);
   // rubber ribbed mat, pink strips at the floor edges, a pink light bar overhead
   {const m=put(B.MeshBuilder.CreatePlane('milked-mat',{width:2.3,height:1.7},scene),rubber,dx,.012,vcz,true);m.rotation.x=PI/2;}
   box(2.36,.012,1.76,dx,.004,vcz,black);
   for(const x of [vx0+.17,vx1-.17]){box(.035,.03,dep-.3,x,.02,vcz,pink);if(!low)wash(PINK,1.1,dep,x+(x<dx?.5:-.5),.014,vcz,0,.3).rotation.x=PI/2;}
   box(2.5,.07,.2,dx,VH-.04,vcz,black);box(2.3,.03,.08,dx,VH-.085,vcz,pink);flat(pool(PINK,3.2,2.4,dx,.016,vcz,.2));
   for(const z of [vz0+.5,FZ-.5]){pipe(.06,vx1-vx0-.3,'x',dx,VH-.06,z,S.rust);}
   // wall sign on the left as you come in (the east wall), the card reader on the right (the west wall), a dome camera in the ceiling corner
   box(.04,1.56,1.16,vx1-.14,1.62,vcz,black);
   sign(1.08,1.48,vx1-.165,1.62,vcz,TOW,438,600,(g,w,h)=>{g.fillStyle='#0a0a0f';g.fillRect(0,0,w,h);g.strokeStyle='#3d404a';g.lineWidth=5;g.strokeRect(6,6,w-12,h-12);logo(g,w/2,96,70);g.strokeStyle=PINK;g.lineWidth=2;g.beginPath();g.moveTo(40,160);g.lineTo(w-40,160);g.stroke();
    g.textAlign='center';g.textBaseline='middle';g.fillStyle='#f4f8ff';g.font=FONT(34);g.fillText('VISITOR CHECK-IN',w/2,238);g.fillStyle=GREEN;g.font=HAN(34);g.fillText('访客登记',w/2,288);
    g.fillStyle='#f4f8ff';g.font=FONT(30);g.fillText('STAFF ONLY BEYOND',w/2,398);g.fillStyle=PINK;g.font=HAN(34);g.fillText('仅限员工',w/2,448);g.fillStyle='#8f9aa8';g.font=FONT(20);g.fillText('ADULTS ONLY · 18+',w/2,540);});
   box(.07,.34,.22,vx0+.155,1.36,vcz,black);screen(.17,.26,vx0+.195,1.38,vcz,TOE,96,146,(g,w,h,t)=>{g.fillStyle='#04100a';g.fillRect(0,0,w,h);g.strokeStyle=GREEN;g.lineWidth=3;for(let k=0;k<3;k++){g.globalAlpha=(Math.floor(t*2)%3===k)?1:.35;g.beginPath();g.arc(w/2,52,10+k*10,-2.3,-.84);g.stroke();}g.globalAlpha=1;g.fillStyle=GREEN;g.fillRect(w/2-4,50,8,8);g.font=FONT(15);g.textAlign='center';g.fillText('TAP CARD',w/2,100);g.fillStyle='#fff';g.font=HAN(15);g.fillText('请刷卡',w/2,126);},.5);
   box(.02,.03,.16,vx0+.19,1.18,vcz,green);if(!low)wash(GREEN,.9,1,vx0+.135,1.36,vcz,TOE,.34);
   {const d=put(B.MeshBuilder.CreateSphere('milked-dome',{diameter:.24,segments:10,slice:.5},scene),M('dome','#0c0f14','#05070a'),vx0+.42,VH,vz0+.45,false);d.rotation.x=PI;box(.03,.03,.03,vx0+.42,VH-.125,vz0+.45,red);box(.3,.03,.3,vx0+.42,VH-.01,vz0+.45,black);}
   // inner doors: glass in dark metal frames
   for(const s of [-1,1])glassLeaf('milked-inner-door',INNER.half-.01,INNER.height-.04,dx+s*INNER.half/2,vz0,s*(INNER.half-.05));
   box(INNER.half*2+.1,.05,.05,dx,INNER.height+.11,vz0+.15,greenDim);
   // outer doors: tall dark brushed-metal leaves, a narrow vision panel in each, arrow marks at the centre seam; logo and hazard band on the inside
   // the vision panels are painted: the rainy street seen from inside, the warm pink of the lobby seen from the street
   const glowIn=(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#3a1230');gr.addColorStop(.5,'#5a1c46');gr.addColorStop(1,'#1c0a18');g.fillStyle=gr;g.fillRect(0,0,w,h);g.fillStyle='rgba(255,138,210,.5)';g.fillRect(0,h*.34,w,6);};
   // from inside, each street door is a tall pane of rain-streaked glass: the buildings across the side street, their signs and lanterns, the wet road (one painting
   // across the two leaves; the street itself is not loaded while the player is inside)
   const viewT=tex(512,640,(g,w,h)=>{seed=9;const sky=g.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#060b12');sky.addColorStop(.5,'#0e1e27');sky.addColorStop(.62,'#173039');sky.addColorStop(1,'#0a1218');g.fillStyle=sky;g.fillRect(0,0,w,h);
    g.filter='blur(2px)';for(const [x,bw,top] of [[-10,150,60],[150,120,130],[280,110,36],[400,130,110]]){g.fillStyle='#0a1016';g.fillRect(x,top,bw-6,h*.6-top);for(let i=0;i<12;i++){if(rnd()<.5)continue;g.fillStyle=rnd()<.6?'rgba(255,196,120,.7)':'rgba(140,200,255,.45)';g.fillRect(x+12+(i%3)*((bw-30)/3),top+18+Math.floor(i/3)*46,(bw-60)/3,26);}}
    const signs=[[70,150,26,150,PINK],[250,110,22,190,GREEN],[395,170,30,120,'#ff4a3a'],[470,90,18,170,'#7fd8ff'],[160,262,90,20,WARM]];
    g.filter='blur(4px)';g.globalCompositeOperation='lighter';for(const [x,y,sw,sh,c] of signs){g.fillStyle=c;g.globalAlpha=.85;g.fillRect(x,y,sw,sh);g.globalAlpha=.3;g.fillRect(x-10,y-10,sw+20,sh+20);}
    g.fillStyle='#ff3a2a';g.globalAlpha=.9;for(const [x,y] of [[324,240],[352,246],[380,240]]){g.beginPath();g.arc(x,y,9,0,7);g.fill();}
    g.filter='blur(8px)';for(const [x,,sw,,c] of signs){const gr=g.createLinearGradient(0,h*.62,0,h);gr.addColorStop(0,c);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.globalAlpha=.5;g.fillRect(x-4,h*.62,sw+8,h*.36);}
    g.filter='none';g.globalCompositeOperation='source-over';g.globalAlpha=1;g.strokeStyle='rgba(200,225,255,.2)';g.lineWidth=1;for(let i=0;i<280;i++){const x=rnd()*w,y=rnd()*h,l=10+rnd()*26;g.beginPath();g.moveTo(x,y);g.lineTo(x-l*.16,y+l);g.stroke();}
    for(let i=0;i<36;i++){const x=rnd()*w,y=rnd()*h*.8,l=30+rnd()*120,gr=g.createLinearGradient(0,y,0,y+l);gr.addColorStop(0,'rgba(220,235,255,0)');gr.addColorStop(1,'rgba(220,235,255,.3)');g.strokeStyle=gr;g.lineWidth=1.6;g.beginPath();g.moveTo(x,y);g.lineTo(x+(rnd()-.5)*4,y+l);g.stroke();g.fillStyle='rgba(230,240,255,.5)';g.beginPath();g.arc(x,y+l,2,0,7);g.fill();}
    const v=g.createRadialGradient(w/2,h/2,h*.25,w/2,h/2,h*.72);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.5)');g.fillStyle=v;g.fillRect(0,0,w,h);});viewT.level=.9;const viewM=emissiveMat(viewT,false,true);
   const dh=DOOR.half,dH=DOOR.height;
   for(const s of [-1,1]){const f=put(B.MeshBuilder.CreateBox('milked-leaf',{width:dh-.01,height:dH-.04,depth:.07,faceUV:[0,1,2,3,4,5].map(()=>new B.Vector4(0,0,.5,1.3)),wrap:true},scene),S.steel,dx+s*dh/2,(dH-.04)/2,FZ,true);leaf('milked-door',f,'x',s*(dh-.05));
    child(box(.2,1.16,.075,0,0,0,black,true),f,s*.3,.5,0);{const p=B.MeshBuilder.CreatePlane('milked-street-view',{width:.76,height:1.72},scene);p.setVerticesData('uv',s<0?[0,0,.5,0,.5,1,0,1]:[.5,0,1,0,1,1,.5,1]);p.material=viewM;p.isPickable=false;child(p,f,0,.2,-.0455);for(const [bw,bh,bx,by] of [[.84,.05,0,1.085],[.84,.05,0,-.685],[.05,1.82,-.4,.2],[.05,1.82,.4,.2]])child(box(bw,bh,.03,0,0,0,metal,true),f,bx,by,-.05);}child(picture(.15,1.1,0,0,0,TON,32,256,glowIn,.8),f,s*.3,.5,.04);child(box(.02,dH-.3,.08,0,0,0,black,true),f,-s*(dh/2-.02),0,0);child(box(.05,.6,.06,0,0,0,trim,true),f,-s*.22,-.2,.06);
    child(sign(.16,.16,0,0,0,TON,64,64,(g,w,h)=>{g.clearRect(0,0,w,h);g.fillStyle='#d5dbe4';g.beginPath();if(s<0){g.moveTo(46,12);g.lineTo(18,32);g.lineTo(46,52);}else{g.moveTo(18,12);g.lineTo(46,32);g.lineTo(18,52);}g.fill();}),f,-s*(dh/2-.16),.15,.04);
    decal(f,dh-.3,dH,TOS,-.058,0,.44);}
   // what shows through the glass of the inner doors on the street side: a blurred glimpse of reception, painted (the inside is not built in that environment)
   if(!interior)picture(2.6,2.6,dx,1.3,vz0-.5,TON,256,256,(g,w,h)=>{g.fillStyle='#0b0910';g.fillRect(0,0,w,h);g.filter='blur(9px)';g.fillStyle='#2a0d22';g.fillRect(20,60,w-40,90);g.fillStyle=PINK;g.globalAlpha=.75;g.fillRect(64,84,128,26);g.globalAlpha=.5;g.fillRect(40,186,176,10);g.fillStyle=GREEN;g.globalAlpha=.4;g.fillRect(30,150,196,5);g.fillStyle='#fff';g.globalAlpha=.6;g.fillRect(196,84,18,22);g.globalAlpha=.5;g.fillStyle='#17131c';g.fillRect(50,160,156,60);g.filter='none';g.globalAlpha=1;},.75);}
  // ---- the rear lobby: a small airlock between the staff area and the service alley ----
  function lobby(){const [lx0,lx1,lz0,lz1]=LOBBY,lcx=(lx0+lx1)/2,lcz=(lz0+lz1)/2,LH=2.9,rx=REAR.x,rh=REAR.half,rH=REAR.height;
   for(const id of ['lobby-north','lobby-west','lobby-east'])wallOf(seg(id),S.concrete);
   tbox(lx1-lx0,.08,lz1-lz0,lcx,-.035,lcz,S.floor,2);tbox(lx1-lx0-.2,.1,lz1-lz0-.2,lcx,LH+.05,lcz,S.rust,2);drain(lcx-.5,lcz+.2);
   tube('x',1.3,lcx,LH-.1,lcz,green);flat(pool(GREEN,2.4,2.4,lcx,.016,lcz,.22));pipe(.09,lz1-lz0-.3,'z',lx1-.3,LH-.12,lcz,S.rust);pipe(.05,lz1-lz0-.3,'z',lx1-.45,LH-.1,lcz,M('pipe-red','#5a1c1c','#240a0a'));
   // the rear door (steel) with the lit EXIT sign over it
   {const f=put(B.MeshBuilder.CreateBox('milked-leaf',{width:rh*2-.02,height:rH-.04,depth:.07,faceUV:[0,1,2,3,4,5].map(()=>new B.Vector4(0,0,.7,1.1)),wrap:true},scene),S.steel,rx,(rH-.04)/2,BZ,true);leaf('milked-rear-door',f,'x',-(rh*2-.1));
    child(box(.9,.06,.05,0,0,0,trim,true),f,0,-.05,.06);child(box(.9,.06,.05,0,0,0,trim,true),f,0,-.05,-.06);child(box(rh*2-.1,.28,.02,0,0,0,black,true),f,0,-(rH/2)+.2,-.04);child(picture(rh*2-.2,.09,0,0,0,TON,256,24,hazard,.6),f,0,.5,.04);}
   box(.86,.3,.08,rx,rH+.36,BZ+.2,black);sign(.8,.26,rx,rH+.36,BZ+.245,TON,246,80,(g,w,h)=>{g.fillStyle='#04140c';g.fillRect(0,0,w,h);g.fillStyle=GREEN;g.shadowColor=GREEN;g.shadowBlur=10;g.font=FONT(40);g.textAlign='left';g.textBaseline='middle';g.fillText('EXIT',14,h/2+2);g.font=HAN(36);g.fillText('出口',132,h/2+2);});
   // the two inner doors: dark, with a small pink logo
   {const d=LOBBY_N,f=put(B.MeshBuilder.CreateBox('milked-leaf',{width:d.half*2-.02,height:d.height-.04,depth:.06},scene),M('door','#1b1a22','#0c0c11'),d.x,(d.height-.04)/2,d.z,true);leaf('milked-lobby-north',f,'x',d.half*2-.1);
    child(logoSign(.7,0,0,0,TON),f,0,.45,.035);child(logoSign(.7,0,0,0,TOS),f,0,.45,-.035);child(box(.05,.3,.09,0,0,0,trim,true),f,-d.half+.16,-.05,0);
    box(.86,.3,.08,d.x,d.height+.3,d.z+.2,black);sign(.8,.26,d.x,d.height+.3,d.z+.245,TON,246,80,(g,w,h)=>{g.fillStyle='#04140c';g.fillRect(0,0,w,h);g.fillStyle=GREEN;g.shadowColor=GREEN;g.shadowBlur=10;g.font=FONT(40);g.textAlign='left';g.textBaseline='middle';g.fillText('EXIT',14,h/2+2);g.font=HAN(36);g.fillText('出口',132,h/2+2);});}
   {const d=LOBBY_W,f=put(B.MeshBuilder.CreateBox('milked-leaf',{width:.06,height:d.height-.04,depth:d.half*2-.02},scene),M('door','#1b1a22','#0c0c11'),d.x,(d.height-.04)/2,d.z,true);leaf('milked-lobby-west',f,'z',d.half*2-.1);
    child(logoSign(.7,0,0,0,TOW),f,-.035,.45,0);child(logoSign(.7,0,0,0,TOE),f,.035,.45,0);child(box(.09,.3,.05,0,0,0,trim,true),f,0,-.05,d.half-.16);}
   // a fire point and a mop bucket: somebody keeps this place running
   box(.26,.5,.14,lx1-.2,1.3,lz0+.6,M('fire','#7a1418','#30080a'));cyl(.13,.42,lx1-.22,.75,lz0+.6,M('fire','#7a1418','#30080a'),false,10);cyl(.3,.3,lx1-.32,.15,lz1-.5,M('bucket','#2c4a5a','#122028'),false,10);pipe(.03,1.2,'x',lx1-.3,.72,lz1-.45,trim).rotation.z=1.25;}

  // ---------------- merge static pieces by material (few draw calls) ----------------
  function finish(){merged=true;for(const [mat,list] of groups){if(list.length>1){const alphaIn=list.some(m=>m.hasVertexAlpha),mm=B.Mesh.MergeMeshes(list,true,true,undefined,false,false);if(mm){mm.parent=node;mm.position.set(-KX,0,-KZ);mm.material=mat;   /* a merge bakes the meshes' WORLD positions (this node's move included): the merged mesh stands back by the move so it is not carried twice */mm.isPickable=false;if(alphaIn)mm.hasVertexAlpha=true;mm.freezeWorldMatrix?.();}}else list[0].freezeWorldMatrix?.();}groups.clear();}
  let clock=0;
  function animate(dt,cam,near=true){clock+=dt;if(!near)return;for(const s of screens){if(clock>s.next){s.next=clock+s.period;const g=s.t.getContext();s.draw(g,s.cw,s.ch,clock);s.t.update();}}
   if(area===AREA){const sd=staffSolid(),ok=staffOpen();if(sd&&sd.open!==ok)sd.open=ok;}
   if(cam)for(const o of autos){const want=Math.hypot(cam.x-o.cx,cam.z-o.cz)<o.r&&(!o.lock||staffOpen())?1:0;if(o.k!==want){o.k+=Math.sign(want-o.k)*Math.min(Math.abs(want-o.k),dt*2.6);o.m.position[o.axis]=o.from+o.travel*o.k;}}}
  function dispose(){disposed=true;node.dispose(false,true);for(const c of containers)try{c.dispose();}catch{}containers.length=0;for(const o of own)try{o.dispose();}catch{}own.length=0;screens.length=0;autos.length=0;}
  return {B,scene,node,low,high,interior,own,pbrs,tag,lin,mirror,reflectIn,blob,blobM,normalFrom,S,M,G,metal,trim,dark,black,pink,green,glowW,red,pinkDim,greenDim,warm,tone,hexOf,put,box,rbox,tbox,cyl,pipe,cone,ball,torus,tex,painted,emissiveMat,plane,screen,sign,picture,FONT,LOGO,HAN,drop,droplets,logo,logoSign,plate,flat,pool,wash,
   rubber,grate,quilt,poster,photoWall,leaf,child,doorControl,auto,prop,simple,standM,leafM,potM,lantern,services,tube,drain,wallOf,seg,hazard,glassM,vestibule,lobby,finish,animate,dispose,rnd,reseed:v=>{seed=v;},get clock(){return clock;},get disposed(){return disposed;},late,screens,
   fx0,fx1,fz0,fz1,FZ,BZ,dx};
 }

 // ================================================================ the STREET side ================================================================
 // create({B,scene,parent,quality}) -> {tick(cam,dt,time), inside(cam), doors, people, state(), dispose()}
 function create({B,scene,parent,quality}){
  const k=kit({B,scene,parent,quality,area:'street'}),{S,M,G,box,rbox,tbox,cyl,pipe,cone,ball,sign,picture,screen,plane,flat,pool,wash,metal,trim,dark,black,pink,green,greenDim,pinkDim,glowW,warm,red,logo,droplets,FONT,LOGO,HAN,low,fx0,fx1,fz0,fz1,FZ,BZ,dx}=k;
  const TOP=9,cx0=(fx0+fx1)/2,cz0=(fz0+fz1)/2,dh=DOOR.half,dH=DOOR.height;
  const brick=k.S.brick=(()=>{const m=new B.StandardMaterial('milked-brick',scene),t=n=>{const x=new B.Texture(HERE+'assets/textures/ncz/'+n+'.jpg',scene);x.wrapU=x.wrapV=B.Texture.WRAP_ADDRESSMODE;k.own.push(x);return x;};m.diffuseTexture=t('brick-color');m.diffuseColor=new B.Color3(.62,.58,.6);if(!low){m.bumpTexture=t('brick-normal');}const e=t('brick-color');e.level=.3;m.emissiveTexture=e;m.specularColor=new B.Color3(.04,.04,.04);k.own.push(m);return m;})();
  // ---------------- the shell: the old building's concrete, 9 m high, with a dark roof slab ----------------
  box(fx1-fx0+.4,.3,fz1-fz0+.4,cx0,TOP+.15,cz0,dark);
  for(const sg of SEGMENTS.filter(s=>/^(front|rear|west|east)$/.test(s[0]))){const [id,axis,c]=sg;
   for(const [s0,s1] of spansOf(sg)){const len=s1-s0,mid=(s0+s1)/2;if(axis==='z')tbox(len,TOP,.3,mid,TOP/2,c,S.front,3);else tbox(.3,TOP,len,c,TOP/2,mid,S.front,3);}
   for(const [g0,g1] of sg[5]){const hgt=id==='front'?dH:REAR.height;tbox(g1-g0,TOP-hgt,.3,(g0+g1)/2,(TOP+hgt)/2,c,S.front,3);for(const e of [g0,g1])box(.1,hgt+.08,.36,e+(e===g0?-.05:.05),(hgt+.08)/2,c,metal);box(g1-g0+.2,.12,.36,(g0+g1)/2,hgt+.06,c,metal);}}

  // ---------------- the shopfront (faces north onto the side street) ----------------
  // Stained concrete piers half a metre proud of the old wall, so the tall metal doors sit in a recess; a wide dark fascia with the sign; the old building beside and above.
  const PZ=-73.7,face=-73.5;
  for(const [x0,x1] of [[78,80.55],[82.95,85.5]])tbox(x1-x0,5,.4,(x0+x1)/2,2.5,PZ,S.front,2.2);
  tbox(2.4,2.1,.4,dx,3.95,PZ,S.front,2.2);box(2.4,.06,.42,dx,2.9,PZ,dark);
  for(const x of [78.02,80.53,82.97,85.48])box(.04,5,.42,x,2.5,PZ,black);for(const y of [1.25,2.5])box(7.5,.025,.02,81.75,y,face+.005,black);   // panel joints
  // the fascia: MILKED in pink neon, then the white droplets; a thin green line along its top edge
  box(7.2,1.16,.1,dx,3.92,face+.05,black);tbox(7.3,.06,.16,dx,4.53,face+.06,S.steel,1.5);tbox(7.3,.06,.16,dx,3.31,face+.06,S.steel,1.5);
  sign(4.5,1.08,dx,3.92,face+.11,TON,1024,246,(g,w,h)=>{g.clearRect(0,0,w,h);logo(g,w/2,h*.52,150);});
  box(7.2,.035,.035,dx,4.6,face+.1,green);if(!low){wash(PINK,6.5,2.2,dx,3.9,face+.12,TON,.16);}
  // the recess: a slim green-lit sensor bar over the doors, two warm downlights in the soffit, a thin pink strip up each side, a steel tread grate
  box(1.9,.07,.1,dx,dH+.1,FZ+.2,black);box(1.3,.02,.02,dx,dH+.075,FZ+.26,green);
  for(const s of [-.55,.55]){cyl(.1,.03,dx+s,2.865,PZ+.02,warm,false,10);if(!low)flat(pool(WARM,1.5,1.5,dx+s,.03,FZ+.7,.3));}
  for(const s of [-1,1])box(.035,2.6,.035,dx+s*1.18,1.38,face-.12,pink);
  {const m=plane(2.3,.9,k.grate,dx,.014,FZ+.55,0);m.rotation.x=PI/2;box(2.4,.02,1,dx,.004,FZ+.55,black);}
  flat(pool(PINK,4.8,3,dx,.028,FZ+1.6,.3));flat(pool(GREEN,2.2,1.6,dx-1.9,.027,FZ+1.3,.22));
  // card reader with a green light on the right-hand pier, vent grilles low and mid-height
  box(.2,.34,.09,80.15,1.36,face+.04,black);screen(.14,.2,80.15,1.4,face+.09,TON,70,100,(g,w,h,t)=>{g.fillStyle='#04100a';g.fillRect(0,0,w,h);g.strokeStyle=GREEN;g.lineWidth=3;for(let i=0;i<3;i++){g.globalAlpha=(Math.floor(t*2)%3===i)?1:.35;g.beginPath();g.arc(w/2,44,8+i*8,-2.3,-.84);g.stroke();}g.globalAlpha=1;g.fillStyle=GREEN;g.font=FONT(13);g.textAlign='center';g.fillText('CARD',w/2,84);},.5);
  box(.12,.025,.02,80.15,1.22,face+.09,green);if(!low)wash(GREEN,.9,.9,80.15,1.36,face+.02,TON,.3);
  const grille=(x,y,w=.7,h=.4)=>{box(w,h,.05,x,y,face+.02,black);for(let i=0;i<Math.round(h/.07);i++)rbox(w-.06,.02,.06,x,y-h/2+.05+i*.07,face+.05,trim,.5,0,0);box(w+.06,.03,.07,x,y+h/2+.015,face+.03,trim);box(w+.06,.03,.07,x,y-h/2-.015,face+.03,trim);};
  grille(79,.42);grille(79,2.05,.6,.34);grille(84.6,2.1,.6,.34);grille(83.4,.42,.5,.3);
  // a steel plate: adults only (kept from the first design)
  sign(.5,.62,79.2,1.45,face+.03,TON,200,248,(g,w,h)=>{g.fillStyle='#0b0b10';g.fillRect(0,0,w,h);g.strokeStyle='#5b5f6b';g.lineWidth=4;g.strokeRect(4,4,w-8,h-8);g.textAlign='center';g.fillStyle='#ffffff';g.font=LOGO(30);g.fillText(CONFIG.NAME,w/2,50);droplets(g,w/2,92,50);g.font=FONT(15);g.fillStyle=GREEN;g.fillText('LIVE BROADCAST',w/2,150);g.fillText('STUDIOS',w/2,170);g.fillStyle=PINK;g.font=FONT(16);g.fillText('ADULTS ONLY · 18+',w/2,206);g.fillStyle='#9aa3b0';g.font=HAN(15);g.fillText('访客登记',w/2,232);});
  // potted bamboo by the door
  k.prop('bamboo',84.2,-73.22,.4,1.75,0,()=>k.simple.plant(84.2,-73.22,1.5));
  // a small blade sign (the droplets only), so the door can be found from Main Street
  box(.06,1.05,.06,fx0+.5,5.35,face+.3,metal);box(.07,1.25,.82,fx0+.5,5.3,face+.8,metal);
  for(const [s,ry] of [[-1,TOW],[1,TOE]])sign(.7,1.1,fx0+.5+s*.045,5.3,face+.8,ry,160,250,(g,w,h)=>{g.fillStyle='#0b0b10';g.fillRect(0,0,w,h);g.strokeStyle=PINK;g.lineWidth=5;g.shadowColor=PINK;g.shadowBlur=10;g.strokeRect(8,8,w-16,h-16);g.shadowBlur=0;droplets(g,w/2-4,h/2-6,120);});
  // exposed pipes, conduit and an air-conditioning unit on the facade above
  pipe(.11,7.4,'x',81.75,4.95,face+.1,S.rust);pipe(.06,7.4,'x',81.75,5.12,face+.07,M('pipe-red','#5a1c1c','#240a0a'));pipe(.05,2.6,'x',79.4,2.92,face+.05,trim);
  for(const x of [78.3,85.2]){const v=cyl(.09,4.9,x,2.5,face+.08,S.rust,false,8);for(const y of [1,2.6,4.2])box(.16,.04,.14,x,y,face+.06,trim);}
  tbox(1,.66,.5,84.3,5.55,face+.2,S.steel,1.2);{const f=cyl(.5,.04,84.3,5.55,face+.46,black,false,14);f.rotation.x=PI/2;}box(1.1,.05,.6,84.3,5.2,face+.2,trim);pipe(.04,.9,'x',83.5,5.4,face+.06,black);
  // ---- the old building beside it: brick, a roast-duck restaurant window under a red awning, a shutter ----
  tbox(12.5,5,.4,91.75,2.5,PZ,brick,2.4);
  box(4.4,2.2,.1,88.6,1.6,face+.02,black);
  picture(4.1,1.9,88.6,1.62,face+.08,TON,512,238,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#ffb35a');gr.addColorStop(1,'#7a3a12');g.fillStyle=gr;g.fillRect(0,0,w,h);k.reseed(31);
   g.fillStyle='rgba(60,20,6,.55)';g.fillRect(0,h*.62,w,h*.38);g.fillStyle='#2a1206';g.fillRect(0,26,w,6);   // counter, the hanging rail
   for(let i=0;i<9;i++){const x=40+i*52+(k.rnd()-.5)*10;g.strokeStyle='#2a1206';g.lineWidth=2;g.beginPath();g.moveTo(x,30);g.lineTo(x,52);g.stroke();g.fillStyle=i%3===2?'#8a2a10':'#a8481a';g.beginPath();g.ellipse(x,84,13,32,0,0,7);g.fill();g.fillStyle='rgba(255,210,140,.35)';g.beginPath();g.ellipse(x-4,76,4,18,0,0,7);g.fill();}
   g.fillStyle='rgba(20,8,2,.8)';for(const x of [120,300,410]){g.beginPath();g.arc(x,h*.6,16,Math.PI,0);g.fill();g.fillRect(x-22,h*.6,44,50);}   // bowls and a diner's back, as shapes
   g.strokeStyle='#1a0a04';g.lineWidth=8;g.strokeRect(0,0,w,h);g.beginPath();g.moveTo(w/2,0);g.lineTo(w/2,h);g.stroke();g.fillStyle='#fff3d0';g.font=HAN(40);g.textAlign='center';g.fillText('烧鸭',w*.25,h-22);g.fillStyle='#ffe2a8';g.font=FONT(22);g.fillText('ROAST DUCK',w*.75,h-26);},1);
  {const aw=rbox(4.7,.06,1.1,88.6,3.02,face+.52,M('awning','#8a1418','#4a080a'),-.38,0,0);for(let i=0;i<8;i++)rbox(.14,.065,1.1,86.5+i*.6,3.02,face+.52,M('awning-stripe','#d8c8b0','#55483a'),-.38,0,0);box(4.7,.2,.04,88.6,2.78,face+1.03,M('awning','#8a1418','#4a080a'));}
  sign(2.6,.5,88.6,3.62,face+.03,TON,416,80,(g,w,h)=>{g.fillStyle='#3a0a0a';g.fillRect(0,0,w,h);g.fillStyle='#ffd27a';g.shadowColor='#ff8a2a';g.shadowBlur=8;g.textAlign='center';g.textBaseline='middle';g.font=HAN(44);g.fillText('金记烧鸭',w*.32,h/2+2);g.font=FONT(24);g.fillText('ROAST DUCK',w*.74,h/2+2);});
  flat(pool('#ffb35a',5,3,88.6,.026,FZ+1.9,.3));
  {const sh=new B.StandardMaterial('milked-shutter',scene),t=new B.Texture(HERE+'assets/textures/ncz/corrugated-green-color.jpg',scene);t.wrapU=t.wrapV=B.Texture.WRAP_ADDRESSMODE;sh.diffuseTexture=t;sh.diffuseColor=new B.Color3(.5,.5,.5);const e=new B.Texture(HERE+'assets/textures/ncz/corrugated-green-color.jpg',scene);e.level=.22;e.wrapU=e.wrapV=B.Texture.WRAP_ADDRESSMODE;sh.emissiveTexture=e;sh.specularColor=new B.Color3(.1,.1,.1);k.own.push(sh,t,e);
   tbox(3,2.6,.06,93.4,1.3,face+.03,sh,2);box(3.2,.2,.12,93.4,2.7,face+.05,trim);tbox(.9,2.1,.06,96.4,1.05,face+.03,S.steel,1.4);box(.05,.3,.05,96.7,1.05,face+.08,trim);}
  pipe(.09,12.4,'x',91.75,4.7,face+.08,S.rust);for(const x of [86,91.3,97.6])cyl(.07,4.7,x,2.35,face+.07,S.rust,false,8);box(.3,.4,.14,91.3,1.6,face+.08,trim);
  // ---- apartments above: warm-lit windows, ledges with planters ----
  tbox(fx1-fx0+.1,.2,.5,cx0,5.02,PZ,S.steel,2);box(fx1-fx0+.2,.3,.5,cx0,TOP,FZ+.1,metal);
  const WIN=(g,w,h,lit,sd)=>{k.reseed(sd);if(!lit){g.fillStyle='#0a0e12';g.fillRect(0,0,w,h);g.fillStyle='rgba(120,160,190,.08)';g.fillRect(6,6,w*.4,h-12);}else{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#ffcf8a');gr.addColorStop(1,'#c9783a');g.fillStyle=gr;g.fillRect(0,0,w,h);g.fillStyle='rgba(120,50,30,.55)';g.fillRect(0,0,w*.28,h);g.fillRect(w*.8,0,w*.2,h);   // curtains
     g.fillStyle='#16301c';for(let i=0;i<9;i++){g.beginPath();g.ellipse(w*.5+(k.rnd()-.5)*w*.3,h*.78-k.rnd()*h*.3,5+k.rnd()*5,14+k.rnd()*10,(k.rnd()-.5),0,7);g.fill();}g.fillStyle='#3a2414';g.fillRect(w*.4,h*.8,w*.2,h*.2);}
    g.strokeStyle='#15151a';g.lineWidth=7;g.strokeRect(0,0,w,h);g.beginPath();g.moveTo(w/2,0);g.lineTo(w/2,h);g.moveTo(0,h*.36);g.lineTo(w,h*.36);g.stroke();};
  [80.4,84.4,88.4,92.4,96.2].forEach((x,i)=>{const lit=i===1||i===3;picture(1.5,1.7,x,6.7,FZ+.165,TON,128,144,(g,w,h)=>WIN(g,w,h,lit,40+i),lit?.9:.8);
   if(low)return;tbox(1.7,.08,.34,x,5.8,FZ+.3,S.steel,1.2);box(1.66,.07,.1,x,7.6,FZ+.2,trim);
   if(i%2===1){box(1.4,.2,.26,x,5.94,FZ+.32,M('planter','#3a2a20','#17110c'));for(let j=0;j<6;j++)ball(.3,x-.55+j*.22,6.12+(j%2)*.05,FZ+.32,k.leafM,.8);flat(pool(WARM,2.2,1.6,x,.025,FZ+1.6,.14));}
   else{for(const s of [-1,1])box(.03,.5,.03,x+s*.8,6.05,FZ+.46,trim);box(1.66,.03,.03,x,6.3,FZ+.46,trim);}});
  if(!low){tbox(.95,.62,.5,94.4,5.5,FZ+.42,S.steel,1.2);box(.7,.4,.03,94.4,5.5,FZ+.68,dark);}
  // ---- the neighbours' side (the corner building west of the shopfront): a dark passage painted on its wall with green neon, red lanterns over the street ----
  picture(1.5,3.3,76.3,1.65,FZ+.02,TON,128,282,(g,w,h)=>{g.fillStyle='#050809';g.fillRect(0,0,w,h);for(let i=0;i<6;i++){const s=1-i*.13,x0=w/2-w*.42*s,y0=h*(.06+i*.05);g.strokeStyle='rgba(57,255,156,'+(.55-i*.08)+')';g.lineWidth=3;g.strokeRect(x0,y0,w*.84*s,h*.9*s);}g.fillStyle='#ff3a2a';g.shadowColor='#ff3a2a';g.shadowBlur=12;for(const [x,y,r] of [[40,70,9],[84,96,7],[60,120,5]]){g.beginPath();g.arc(x,y,r,0,7);g.fill();}g.shadowBlur=0;g.fillStyle=GREEN;g.font=HAN(22);g.textAlign='center';for(const [c,i] of [['茶',0],['室',1]])g.fillText(c,w*.5,h*.62+i*26);},.9);
  box(.12,2.4,.5,74.9,3.4,FZ+.3,black);for(const [s,ry] of [[-1,TOW],[1,TOE]])sign(.42,2.2,74.9+s*.07,3.4,FZ+.3,ry,60,314,(g,w,h)=>{g.fillStyle='#04100a';g.fillRect(0,0,w,h);g.fillStyle=GREEN;g.shadowColor=GREEN;g.shadowBlur=8;g.font=HAN(40);g.textAlign='center';['旅','馆'].forEach((c,i)=>g.fillText(c,w/2,110+i*90));});
  {const lan=G('lantern-red','#ff3a2a',.9);pipe(.012,5.4,'z',77.3,3.75,-71.2,black);[-73,-71.2,-69.4].forEach((z,i)=>{ball(.42,77.3,3.42,z,lan,1.15);cyl(.14,.05,77.3,3.68,z,black,false,8);cyl(.1,.05,77.3,3.17,z,black,false,8);box(.02,.16,.02,77.3,3.06,z,M('tassel','#b8860b','#4a3604'));flat(pool('#ff3a2a',2,2,77.3,.024,z,.2));});}
  /* Finding it from Main Street (the owner, 16 Nov 2026: "I couldn't get to Milked"; the side street had nothing on Main Street saying what is down it). A blade sign on a bracket
     at the side street's corner, read from both directions along Main Street, and a wall sign on the corner building facing across the road. Each is the existing logo and an
     arrow into the side street; no new wording. */
  {const way=(dir)=>(g,w,h)=>{g.fillStyle='#0b0b10';g.fillRect(0,0,w,h);g.strokeStyle='#4a4e58';g.lineWidth=5;g.strokeRect(5,5,w-10,h-10);const ax=dir<0?w*.13:w*.87;logo(g,w/2-dir*w*.09,h*.52,h*.42);
    g.strokeStyle='#ffe9f7';g.shadowColor=PINK;g.shadowBlur=14;g.lineWidth=h*.09;g.lineCap='round';g.lineJoin='round';g.beginPath();g.moveTo(ax-dir*h*.2,h*.5);g.lineTo(ax+dir*h*.14,h*.5);g.moveTo(ax-dir*h*.02,h*.28);g.lineTo(ax+dir*h*.16,h*.5);g.lineTo(ax-dir*h*.02,h*.72);g.stroke();g.shadowBlur=0;};
   const bx=69.85,by=4.5,bz=-74.25;box(2.3,.08,.08,bx,by+.42,bz,black);box(.08,.5,.08,70.92,by+.2,bz,black);box(2.2,.74,.07,bx,by,bz,black);
   sign(2.1,.66,bx,by,bz+.04,TON,640,200,way(-1));sign(2.1,.66,bx,by,bz-.04,TOS,640,200,way(1));   // seen walking south the side street is on the left; walking north, on the right
   box(.07,.9,3.3,70.93,4.6,-76.6,black);sign(3.1,.8,70.88,4.6,-76.6,TOW,640,166,way(-1));box(.035,.035,3.3,70.9,5.08,-76.6,green);
   flat(pool(PINK,3,2.6,69.9,.03,-73.2,.22));}
  // the dead end of the side street: bins and a crate against the far wall (clear of the walking line)
  if(!low){for(const [x,z] of [[99.4,-73.3],[100.3,-73.4]])cyl(.56,1,x,.5,z,M('bin','#22262b','#0e1012'),false,12);box(.9,.7,.7,100.2,.35,-69.2,M('crate','#3a3128','#17130f'));}

  // ---------------- the alley back (faces south onto the service alley): the steel staff door, a caged green lamp, plant and bins ----------------
  const bo=BZ-.16,rx=REAR.x,rH=REAR.height;
  box(.34,.2,.22,rx,rH+.42,bo-.06,metal);box(.24,.12,.16,rx,rH+.3,bo-.06,G('rear-lamp',GREEN,.85));flat(pool(GREEN,3,2.4,rx,.03,BZ-1.3,.3));
  sign(1.5,.42,rx+1.75,1.75,bo-.02,TOS,360,100,(g,w,h)=>{g.fillStyle='#0c0c11';g.fillRect(0,0,w,h);g.strokeStyle='#4a4e58';g.lineWidth=4;g.strokeRect(4,4,w-8,h-8);g.fillStyle='#fff';g.font=LOGO(30);g.textAlign='left';g.textBaseline='middle';g.fillText(CONFIG.NAME,16,34);droplets(g,170,32,44);g.font=FONT(18);g.fillStyle=GREEN;g.fillText('STAFF · DELIVERIES',16,74);});
  box(2,1.25,.95,87,.65,-90.65,M('dumpster','#243a33','#0d1613'));box(2.06,.1,1,87,1.32,-90.65,M('dumpster-lid','#17231f','#080d0b'));for(const s of [-1,1])cyl(.14,.1,87+s*.8,.07,-91.05,dark,false,8).rotation.x=PI/2;
  box(1.2,.6,.9,97.4,.3,-92.75,M('crate','#3a3128','#17130f'));box(.9,.55,.8,97.5,.88,-92.8,M('crate-b','#2c2f36','#111317'));
  if(!low){for(const x of [80.5,84,90.5]){tbox(1.1,.75,.5,x,2.9,bo-.25,S.steel,1.2);cyl(.5,.04,x,2.9,bo-.52,dark,false,12).rotation.x=PI/2;box(.05,2.5,.05,x+.7,1.25,bo-.03,trim);}
   pipe(.09,14,'x',86,3.6,bo-.06,S.rust);cyl(.12,TOP-.5,79,(TOP-.5)/2,bo-.06,S.rust,false,8);
   box(.26,.14,.2,83,2.5,bo-.08,metal);box(.18,.06,.14,83,2.41,bo-.08,warm);flat(pool(WARM,2.6,2.2,83,.03,BZ-1.2,.2));
   sign(1.1,1.1,89,1.5,bo-.02,TOS,128,128,(g,w,h)=>{g.clearRect(0,0,w,h);g.globalAlpha=.5;droplets(g,w/2-4,h/2-4,92);});}

  // ---------------- the two rooms that exist on both sides ----------------
  // ---------------- the wet pavement in front of the shopfront (Medium and above) ----------------
  // Shallow puddles that mirror the sign, the strips, the lit windows and the lanterns: the street's own puddles (dark, glossy), with a real reflection in them.
  // No lamp is added out here: the street already carries ten lights on Medium and the scene's limit is twelve.
  let wet=null,wetMirror=null,wetNext=0;
  if(!low){wetMirror=k.mirror(.034);wetMirror.level=.9;const m=new B.StandardMaterial('milked-puddles',scene);m.diffuseColor=new B.Color3(.012,.016,.02);m.specularColor=new B.Color3(.7,.8,.9);m.specularPower=180;m.emissiveColor=new B.Color3(.01,.018,.022);m.reflectionTexture=wetMirror;
   m.opacityTexture=k.tex(256,128,(g,w,h)=>{g.clearRect(0,0,w,h);k.reseed(61);for(let i=0;i<13;i++){const x=26+k.rnd()*(w-52),y=18+k.rnd()*(h-36),r=7+k.rnd()*13,a=k.rnd()*3,sx=1.3+k.rnd()*.8;g.save();g.translate(x,y);g.rotate(a);g.scale(sx,1);const gr=g.createRadialGradient(0,0,r*.55,0,0,r);gr.addColorStop(0,'rgba(255,255,255,.88)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.beginPath();g.arc(0,0,r,0,7);g.fill();g.restore();}});
   k.own.push(m);k.tag(m,'fx');wet=k.put(B.MeshBuilder.CreatePlane('milked-puddles',{width:11,height:4.6},scene),m,dx+1.4,.034,FZ+2.75,true);wet.rotation.x=PI/2;}
  // contact shadows under the things that stand on the pavement
  k.blob(84.2,-73.22,.9,.9,.036);k.blob(87,-90.65,2.8,1.7,.036);k.blob(97.4,-92.75,1.8,1.5,.036);
  k.vestibule();k.lobby();k.finish();
  const doors=k.doorControl();
  function tick(wcam,dt){if(k.disposed)return;const cam=toLocal(wcam),d=cam?distance(cam.x,cam.z):999,dz=d*(root.VoidZoom?root.VoidZoom.now():1);if(d<40)doors.tick(dt,cam);k.animate(dt,cam,dz<30);   /* dz: the distance as a zoomed camera shows it (zoom-detail.js) */
   if(wet){wet.setEnabled(d<36);if(d<36&&k.clock>wetNext){wetNext=k.clock+(k.clock<40?4:1e9);wetMirror.renderList=k.reflectIn([],true);}}}
  return {tick,inside:cam=>MK.inside(cam),people:[],doors,area:'street',state:()=>({ready:!k.disposed,area:'street',doors:doors.state(),screens:k.screens.length}),dispose(){k.dispose();}};
 }


 // ================================================================ the INTERIOR (its own environment) ================================================================
 // build({scene,parent,quality}) -> {tick(time,player), doors, people, state(), dispose()}   (the renderer's zone handle)
 function build({scene,parent,quality}){
  const B=root.BABYLON,k=kit({B,scene,parent,quality,area:AREA}),{high,S,M,G,box,rbox,tbox,cyl,pipe,cone,ball,torus,sign,picture,screen,plane,flat,pool,wash,plate,logoSign,poster,photoWall,metal,trim,dark,black,pink,green,greenDim,pinkDim,glowW,warm,red,tone,hexOf,logo,droplets,FONT,LOGO,HAN,low,fx0,fx1,fz0,fz1,FZ,BZ,dx,node,simple,prop,lantern,services,tube,drain,auto,child,wallOf,standM}=k;
  const cx0=(fx0+fx1)/2,cz0=(fz0+fz1)/2,people=[],lights=[],loading=new Set();let last=null,looksAsked=.5,faceNext=0;
  // ---- mood: a dark interior with a little haze; lamps and neon do the lighting. Everything is put back on dispose. ----
  const ip=scene.imageProcessingConfiguration,prev={clear:scene.clearColor.clone(),fogMode:scene.fogMode,fogDensity:scene.fogDensity,fogColor:scene.fogColor.clone(),exposure:ip.exposure,contrast:ip.contrast,env:scene.environmentIntensity};
  scene.clearColor=new B.Color4(.012,.01,.016,1);scene.fogMode=B.Scene.FOGMODE_EXP2;scene.fogDensity=.011;scene.fogColor=new B.Color3(.04,.026,.045);ip.exposure=1.3;ip.contrast=1.18;scene.environmentIntensity=low?Math.min(prev.env??1,.3):1;
  const sun=scene.getLightByName('sun'),ambient=scene.getLightByName('ambient'),lightPrev={sun:sun?.intensity,amb:ambient?.intensity,dif:ambient?.diffuse?.clone(),gnd:ambient?.groundColor?.clone()};
  if(sun)sun.intensity=.02;if(ambient){ambient.intensity=low?2.2:.6;   /* Low has no lamps: its sky light alone has to show the rooms */ambient.diffuse=new B.Color3(.74,.68,.82);if(ambient.groundColor)ambient.groundColor=new B.Color3(.2,.15,.23);}
  // The game outside VR multiplies the finished Medium and High picture by 0.3 (babylon-renderer.js; an open decision recorded in
  // docs/development/VR_SESSIONS.md), so nothing on screen can be brighter than 30% white there. That is not touched. While the player is in here the
  // exposure is raised so the walls, floors and faces sit higher under that ceiling (the neon is already at it). It is read from the live setting every
  // frame, so the rooms stay right if that number is ever changed or the picture is not going through that pass. Everything is put back on leaving.
  let comp=1;const expose=()=>{let d=1;try{const p=scene.postProcessRenderPipelineManager?.supportedPipelines?.find(q=>q.name==='void-look');if(p&&p.sharpenEnabled&&p.sharpen&&p.cameras?.includes(scene.activeCamera))d=p.sharpen.colorAmount;}catch{}const c=d>0&&d<1?Math.min(2.6,.78/d):1;if(c!==comp){comp=c;ip.exposure=1.3*c;}};
  /* Light (Medium and above). Twelve lights is the scene's limit and eight a material's, so:
       the sun and the sky light (2);
       five lamps that are always at the five neon signs, tube lights or screens nearest the player. glowAt() lists those places as the rooms are built, and
       the lamps fade out, move and fade in as the player walks, so nothing is recompiled;
       one key light with a shadow map, in the occupied room nearest the player (Eva's desk, Fish's desk or a studio);
       four small lamps for the four nearest people's faces (each lights only that person).
     Low has none of these: it keeps its flat sky light, the light pools and the contact shadows. */
  const GLOWS=[],glowAt=(zone,x,y,z,hex,intensity=1,range=5)=>{GLOWS.push({zone,x,y,z,c:B.Color3.FromHexString(hex),i:intensity*4.5,r:range});};
  const ZONE={vestibule:'front',reception:'front',hallway:'hall','studio-1':'hall','studio-2':'hall','studio-3':'hall','studio-4':'hall',office:'office','staff-corridor':'staff','rear-lobby':'staff','rear-corridor':'rear','dressing-a':'rear','dressing-b':'rear'},
   NEXT={front:['hall'],hall:['front','office','staff'],office:['hall','staff'],staff:['office','hall','rear'],rear:['staff']};
  const zoneOf=(x,z)=>{for(const r of ROOMS){const q=r.rect;if(x>=q[0]&&x<=q[1]&&z>=q[2]&&z<=q[3])return ZONE[r.id]||'staff';}return 'front';};
  const lamps=[],faces=[];let key=null,shadow=null,keyOf=null,keyK=0,hold=null;
  if(!low){
   for(let i=0;i<5;i++){const Lp=new B.PointLight('milked-lamp-'+i,new B.Vector3(cx0,2.4,cz0),scene);Lp.parent=node;Lp.intensity=0;Lp.range=5;Lp.renderPriority=1;k.own.push(Lp);lights.push(Lp);lamps.push({L:Lp,at:null,k:0});}
   key=new B.SpotLight('milked-key-light',new B.Vector3(82.2,2.7,-79.8),new B.Vector3(-.4,-1,-.6),1.75,1.3,scene);key.parent=node;key.intensity=0;key.range=8;key.shadowMinZ=.25;key.shadowMaxZ=8.5;key.renderPriority=1;k.own.push(key);lights.push(key);
   shadow=new B.ShadowGenerator(high?1024:512,key);shadow.usePercentageCloserFiltering=true;shadow.filteringQuality=high?B.ShadowGenerator.QUALITY_HIGH:B.ShadowGenerator.QUALITY_MEDIUM;shadow.bias=.002;shadow.normalBias=.025;shadow.setDarkness(.22);shadow.getShadowMap().refreshRate=2;k.own.push(shadow);
   hold=B.MeshBuilder.CreateBox('milked-hold',{size:.01},scene);hold.parent=node;hold.position.set(cx0,-2,cz0);hold.setEnabled(false);
   for(let i=0;i<4;i++){const Lp=new B.PointLight('milked-face-'+i,new B.Vector3(cx0,2.4,cz0),scene);Lp.parent=node;Lp.intensity=0;Lp.range=6;Lp.renderPriority=2;Lp.includedOnlyMeshes=[hold];k.own.push(Lp);lights.push(Lp);faces.push({L:Lp,p:null});}}
  function relight(dt,cam,zone){
   const near=GLOWS.map(s=>({s,d:Math.hypot(s.x-cam.x,s.z-cam.z)+(s.zone===zone?0:(NEXT[zone]||[]).includes(s.zone)?3:99)+(lamps.some(l=>l.at===s)?-.6:0)})).filter(q=>q.d<15).sort((a,b)=>a.d-b.d).slice(0,lamps.length).map(q=>q.s);
   for(const l of lamps){if(!l.at)continue;if(near.includes(l.at))l.k=Math.min(1,l.k+dt*2.5);else{l.k-=dt*3;if(l.k<=0){l.k=0;l.at=null;}}}
   for(const s of near){if(lamps.some(l=>l.at===s))continue;const l=lamps.find(q=>!q.at);if(!l)break;l.at=s;l.k=0;l.L.position.set(s.x,s.y,s.z);l.L.diffuse=s.c;l.L.specular=s.c.scale(.7);l.L.range=s.r;}
   for(const l of lamps)l.L.intensity=l.at?l.at.i*l.k:0;}
  function keyLight(dt,cam,zone){if(!key)return;let best=null,bd=1e9;
   for(const p of people){if(!p.spawned||!p.meshes)continue;if(p.zone!==zone&&!(NEXT[zone]||[]).includes(p.zone))continue;const d=Math.hypot(p.x-cam.x,p.z-cam.z)+(p.zone===zone?0:3)+(p===keyOf?-1:0);if(d<bd){bd=d;best=p;}}
   if(best!==keyOf){keyK=Math.max(0,keyK-dt*3);if(keyK<=0){keyOf=best;if(best){const c=best.key;key.position.set(c.x,2.7,c.z);key.setDirectionToTarget(new B.Vector3(best.x,.9,best.z));key.diffuse=c.dif;key.specular=c.dif.scale(.5);shadow.getShadowMap().renderList=[...near(casters,c.x,c.z,7),...best.meshes];}}}
   else if(best)keyK=Math.min(1,keyK+dt*2.5);
   key.intensity=keyOf?4*keyK:0;}
  function faceLamps(cam){const near=people.filter(p=>p.spawned&&p.meshes).sort((a,b)=>Math.hypot(a.x-cam.x,a.z-cam.z)-Math.hypot(b.x-cam.x,b.z-cam.z)).slice(0,faces.length);
   for(const f of faces)if(f.p&&!near.includes(f.p)){f.p=null;f.L.intensity=0;f.L.includedOnlyMeshes=[hold];f.L.setEnabled(false);f.L.setEnabled(true);}
   for(const p of near){let f=faces.find(q=>q.p===p);if(!f){f=faces.find(q=>!q.p);if(!f)break;f.p=p;const c=p.lamp;f.L.position.set(c.x,c.y,c.z);f.L.diffuse=c.dif;f.L.specular=c.spec;f.L.range=c.r;f.L.includedOnlyMeshes=p.meshes;f.L.setEnabled(false);f.L.setEnabled(true);}f.L.intensity=p.lamp.i/comp;}}
  // The places a lamp can be (zone, where, colour, strength, reach). The studios add theirs below.
  for(const g of [['front',81.3,2.1,-81.9,PINK,1.5,6],['front',81.3,.4,-79.6,PINK,1,3.4],['front',81.75,2.6,-75.5,PINK,.45,4],['front',79.4,2.8,-78,WARM,.8,5],['front',84.2,2.8,-78,WARM,.8,5],['front',84.3,1.95,-82,'#9fd8ff',.55,3.2],['front',80.2,1.4,-75.5,GREEN,.5,2.4],['front',84.9,2.5,-81.8,GREEN,.5,2.6],
    ['hall',86.5,CEIL-.55,-81.8,GREEN,1.2,4.8],['hall',88.5,CEIL-.55,-81.8,GREEN,1.2,4.8],['hall',90.5,CEIL-.55,-81.8,GREEN,1.2,4.8],['hall',92.5,CEIL-.55,-81.8,GREEN,1.2,4.8],
    ['office',95.2,CEIL-.45,-77,PINK,1.1,5],['office',97.2,2,-76.6,'#b8c8ff',.9,4],['office',96.6,1.3,-77.95,WARM,.9,3],['office',94.6,2.8,-78.4,WARM,.6,4.2],
    ['staff',94.75,CEIL-.5,-83.4,GREEN,1,5],['staff',95.5,2.4,-82.75,PINK,.5,2.6],['staff',95.5,2.4,-86.25,PINK,.5,2.6],['staff',(LOBBY[0]+LOBBY[1])/2,2.65,(LOBBY[2]+LOBBY[3])/2,GREEN,.5,4],
    ['rear',80.5,CEIL-.5,-89,GREEN,.9,4.4],['rear',84.5,CEIL-.5,-89,GREEN,.9,4.4],['rear',88.5,CEIL-.5,-89,GREEN,.9,4.4],['rear',92,CEIL-.5,-89,GREEN,.9,4.4],['rear',79.9,1.9,-83.5,WARM,1.3,5],['rear',79.95,2.4,-88.6,PINK,.5,2.6]])glowAt(...g);
  // The floors mirror the rooms (Medium and above): one half-size picture shared by every damp floor, the hallway's deck plate and the studios' boards.
  let mir=null,mirNext=0,mirAll=null,mirAllNext=0;const mirrored=new Set();
  // the pieces of a list within r metres of a point (a merged, building-wide mesh always counts)
  const near=(list,x,z,r)=>list.filter(m=>{const b=m.getBoundingInfo().boundingSphere;return b.radiusWorld>6||Math.hypot(b.centerWorld.x-x,b.centerWorld.z-z)<r+b.radiusWorld;});
  if(!low){mir=k.mirror(.005);mir.gammaSpace=!ip.applyByPostProcess;for(const m of [S.floor,k.grate,S.wood]){m.reflectionTexture=mir;mirrored.add(m);}}
  const doorM=M('door','#1b1a22','#0c0c11'),onAir=G('on-air',RED,1);

  // ---------------- the shell: floors, the ceiling slab, the outer walls' inner faces, the partitions ----------------
  box(fx1-fx0,.04,fz1-fz0,cx0,-.1,cz0,black);tbox(fx1-fx0,.16,fz1-fz0,cx0,CEIL+.08,cz0,S.rust,3);
  const floorOf=([x0,x1,z0,z1],mat,kk=2.4)=>tbox(x1-x0,.08,z1-z0,(x0+x1)/2,-.035,(z0+z1)/2,mat,kk);
  const [vx0,vx1,vz0]=VESTIBULE;
  floorOf([78,85.5,-82.8,vz0],S.floor);floorOf([78,vx0,vz0,-74],S.floor);floorOf([vx1,85.5,vz0,-74],S.floor);floorOf(HALL,k.grate,1);
  for(const st of STUDIOS)floorOf(ROOMS.find(q=>q.id===st.room).rect,S.wood,1.6);
  floorOf([93.5,98,-79.6,-74],S.floor);floorOf([93.5,96,LOBBY_N.z,-79.6],S.floor);floorOf([78,93.5,-90,-88],S.floor);floorOf([78,85.5,-88,-82.8],S.wood,1.6);
  for(const sg of SEGMENTS.filter(s=>/^(front|rear|west|east)$/.test(s[0]))){const [id,axis,c]=sg,inner=id==='front'||id==='east'?-1:1;
   for(const [s0,s1] of spansOf(sg)){const len=s1-s0,mid=(s0+s1)/2;if(axis==='z'){box(len,CEIL,.2,mid,CEIL/2,c,black);tbox(len,CEIL,.06,mid,CEIL/2,c+inner*.13,S.concrete,2.6);}else{box(.2,CEIL,len,c,CEIL/2,mid,black);tbox(.06,CEIL,len,c+inner*.13,CEIL/2,mid,S.concrete,2.6);}}
   for(const [g0,g1] of sg[5]){const hgt=id==='front'?DOOR.height:REAR.height;tbox(g1-g0,CEIL-hgt,.3,(g0+g1)/2,(CEIL+hgt)/2,c,S.concrete,2.6);for(const e of [g0,g1])box(.1,hgt+.08,.36,e+(e===g0?-.05:.05),(hgt+.08)/2,c,metal);box(g1-g0+.2,.12,.36,(g0+g1)/2,hgt+.06,c,metal);}}
  for(const sg of SEGMENTS.filter(s=>!/^(front|rear|west|east|hall-north|hall-south)$|^(vest-|lobby-)/.test(s[0])))wallOf(sg);
  k.vestibule();k.lobby();

  // ---------------- reception ----------------
  // the wall behind the desk: dark oxidised panels with the big pink neon logo
  tbox(7.26,CEIL-.06,.05,81.75,CEIL/2,-82.655,S.rust,1.5);for(let i=0;i<6;i++)box(.03,CEIL-.1,.03,78.6+i*1.25,CEIL/2,-82.62,black);
  sign(4.3,1.03,81.3,2.18,-82.6,TON,900,216,(g,w,h)=>{g.clearRect(0,0,w,h);logo(g,w/2,h*.52,132);});if(!low)wash(PINK,5.6,2.6,81.3,2.1,-82.615,TON,.26);
  // the desk: dark, the logo on its front in pink neon, a pink glow under it
  tbox(3.4,1.06,.8,81.3,.53,-80.6,S.wall,1.5);box(3.56,.05,.94,81.3,1.085,-80.6,black);box(3.44,.9,.03,81.3,.56,-80.185,black);
  sign(2.7,.65,81.3,.6,-80.165,TON,820,197,(g,w,h)=>{g.clearRect(0,0,w,h);logo(g,w/2,h*.52,118);});
  box(3.3,.03,.03,81.3,.04,-80.17,pink);flat(pool(PINK,4.4,1.8,81.3,.02,-79.6,.42));box(3.56,.015,.02,81.3,1.115,-80.14,pinkDim);
  for(const x of [79.75,82.85])tbox(.3,1.06,1.68,x,.53,-81.84,S.wall,1.5);
  box(.64,.4,.04,80.7,1.42,-80.72,black);box(.08,.18,.08,80.7,1.2,-80.74,black);box(.5,.02,.18,80.75,1.12,-80.98,black);
  screen(.58,.34,80.7,1.42,-80.745,TOS,256,150,(g,w,h,t)=>{g.fillStyle='#06070c';g.fillRect(0,0,w,h);g.fillStyle=PINK;g.font=FONT(15);g.textAlign='left';g.fillText('BROADCAST SCHEDULE',8,20);g.font=FONT(13);STUDIOS.forEach((s,i)=>{g.fillStyle=i%2?GREEN:'#ffd3ee';g.fillText('STUDIO '+s.n+'   ON AIR',8,46+i*22);});g.fillStyle='#8f9aa8';g.fillText('MEMBERS ONLINE '+(1840+Math.floor(t*2.3)%400),8,140);},2);
  // on the desk: the creators' check-in stand with its code, a bell, the lucky cat, an orchid, pens
  box(.24,.32,.015,82.25,1.27,-80.36,M('acrylic','#cfe6f0','#3a4a50',.35));
  sign(.21,.29,82.25,1.27,-80.35,TON,168,232,(g,w,h)=>{g.fillStyle='#f2f4f7';g.fillRect(0,0,w,h);g.fillStyle='#16161b';g.font=FONT(15);g.textAlign='center';g.fillText('OFFICIAL',w/2,22);g.fillText('CREATORS',w/2,40);g.fillStyle='#c41f86';g.fillText('CHECK-IN',w/2,58);k.reseed(5);const q=11,c=10,x0=(w-q*c)/2,y0=72;g.fillStyle='#16161b';for(let i=0;i<q;i++)for(let j=0;j<q;j++)if(k.rnd()<.5)g.fillRect(x0+i*c,y0+j*c,c,c);for(const [a,b] of [[0,0],[q-3,0],[0,q-3]]){g.fillStyle='#16161b';g.fillRect(x0+a*c,y0+b*c,3*c,3*c);g.fillStyle='#f2f4f7';g.fillRect(x0+a*c+c*.6,y0+b*c+c*.6,c*1.8,c*1.8);g.fillStyle='#16161b';g.fillRect(x0+a*c+c,y0+b*c+c,c,c);}g.fillStyle='#16161b';g.font=HAN(15);g.fillText('创作者签到',w/2,h-12);});
  cyl(.12,.02,81.75,1.12,-80.38,black,false,12);ball(.1,81.75,1.135,-80.38,M('brass','#b08a3a','#4a3812'),.7);cyl(.02,.03,81.75,1.19,-80.38,M('brass','#b08a3a','#4a3812'),false,6);
  prop('lucky-cat',80.15,-80.42,0,.3,1.11,()=>simple.cat(80.15,1.11,-80.42));
  cyl(.14,.13,82.78,1.175,-80.5,k.potM,false,10);for(const [a,b] of [[-.04,.42],[.05,.5]]){rbox(.012,b,.012,82.78+a,1.24+b/2,-80.5,M('stem','#3d5a2a','#1a2a12'),0,0,a*2);for(let i=0;i<3;i++)ball(.075,82.78+a*2.2+(i-1)*.05,1.24+b-.02-i*.07,-80.5+(i%2)*.03,M('orchid','#f6e4f2','#9a6f8e'),.8);}
  for(const dz of [-.06,.06])rbox(.2,.012,.09,82.78,1.25,-80.5+dz,k.leafM,0,dz*4,.3);
  cyl(.08,.1,81.25,1.16,-80.36,black,false,10);for(const [a,c] of [[-.015,PINK],[.01,'#d5dbe4'],[.025,GREEN]])rbox(.008,.16,.008,81.25+a,1.24,-80.36,M('pen'+c,c,c),0,0,a*6);
  // security monitors on the wall beside the desk
  box(1.7,1.1,.06,84.3,1.95,-82.6,black);screen(1.56,.98,84.3,1.95,-82.565,TON,512,320,(g,w,h,t)=>{g.fillStyle='#04060a';g.fillRect(0,0,w,h);['VESTIBULE','HALLWAY','REAR DOOR','SIDE STREET'].forEach((c,i)=>{const x=(i%2)*w/2+6,y=Math.floor(i/2)*h/2+6,cw=w/2-12,ch=h/2-12;g.fillStyle=i%2?'#0d1a14':'#1a0d16';g.fillRect(x,y,cw,ch);g.strokeStyle='rgba(255,255,255,.08)';for(let q=1;q<4;q++){g.beginPath();g.moveTo(x,y+ch*q/4);g.lineTo(x+cw,y+ch*q/4);g.stroke();}g.fillStyle=GREEN;g.font=FONT(15);g.textAlign='left';g.fillText('CAM '+(i+1)+' · '+c,x+8,y+20);g.fillStyle=Math.floor(t+i)%2?RED:'#5a1420';g.beginPath();g.arc(x+cw-14,y+14,5,0,Math.PI*2);g.fill();g.fillStyle='#8f9aa8';g.font=FONT(12);g.fillText('NO MOTION',x+8,y+ch-8);});},1.6);
  // the side door (beside the desk): STAFF ONLY, with a small logo on the leaf. It leads to the studio hallway.
  plate(1.25,.52,85.36,2.55,-81.8,TOW,[['STAFF ONLY',PINK,54],['仅限员工','#f4f8ff',50,1]],{neon:true});
  {const f=box(.06,2.16,1.28,85.5,1.08,-81.8,doorM,true);auto(f,'z',1.2,85.5,-81.8);child(logoSign(.7,0,0,0,TOW),f,-.035,.45,0);child(logoSign(.7,0,0,0,TOE),f,.035,.45,0);}
  // shelves along the west wall: ring binders, boxes, trailing pothos
  box(.04,2,3.6,78.16,1,-78.2,black);for(const y of [.25,.8,1.35,1.9])box(.42,.04,3.6,78.38,y,-78.2,trim);for(const z of [-80,-78.8,-77.6,-76.4])box(.42,2,.04,78.38,1,z,trim);
  {k.reseed(88);const cols=['#5a1c2a','#2c2f36','#1c2c4a','#d9d2c4','#12372a','#4a3a1c'];for(const y of [.82,1.37])for(let z=-79.94;z<-76.5;z+=.075){if(Math.abs(((z+80)%1.2)-1.2)<.08||k.rnd()<.12)continue;const c=cols[Math.floor(k.rnd()*cols.length)],h=.3+k.rnd()*.04;box(.26,h,.062,78.36,y+h/2,z+.03,M('binder'+c,c,c==='#d9d2c4'?'#55524c':'#0a0a0c'));}
   for(const z of [-79.4,-78.2,-77])box(.3,.22,.5,78.38,.38,z,M('archive','#6a5a44','#2a2218'));}
  prop('pothos',78.42,-79.4,PI/2,.8,1.4,()=>simple.vine(78.42,-79.4,1.92));prop('pothos',78.42,-77,PI/2,.7,1.5,()=>simple.vine(78.42,-77,1.92));
  // a bench, the bamboo, pinned photographs, a poster
  tbox(1.35,.1,.56,84.62,.45,-74.6,S.cloth,1);for(const s of [-1,1])box(.08,.42,.5,84.62+s*.56,.21,-74.6,metal);
  prop('bamboo',78.7,-74.7,0,1.95,0,()=>simple.plant(78.7,-74.7,1.6));
  photoWall(1.5,.95,84.6,1.75,-74.2,TOS,11);poster(0,.62,78.15,1.7,-75.5,TOE);poster(3,.56,85.36,1.7,-78.6,TOW);
  // ceiling services and three warm downlights
  services('x',78.2,85.3,-78.6,CEIL-.2);for(const [x,z] of [[79.4,-78],[84.2,-78],[81.75,-80.2]]){cyl(.16,.04,x,CEIL-.02,z,warm,false,10);if(!low)flat(pool(WARM,2.4,2.4,x,.018,z,.12));}

  // ---------------- the studio hallway: long and narrow, a big window and a door for each studio ----------------
  const glassM=M('glass','#12202a','#060c10',.2),[hx0,hx1,hz0,hz1]=HALL;
  for(const s of STUDIOS){const r=ROOMS.find(q=>q.id===s.room).rect,north=s.n<3,wz=north?hz1:hz0,hn=north?-1:1,ry=north?TOS:TON,[w0,w1]=s.window,[d0,d1]=s.door,cuts=[[w0,w1,'w'],[d0,d1,'d']].sort((a,b)=>a[0]-b[0]),col=s.light==='mixed'?(s.n===3?'pink':'green'):s.light;
   let from=r[0];for(const [a,b,kind] of cuts){if(a>from)tbox(a-from,CEIL,T,(from+a)/2,CEIL/2,wz,S.wall);
    if(kind==='w'){tbox(b-a,.8,T,(a+b)/2,.4,wz,S.wall);tbox(b-a,CEIL-2.6,T,(a+b)/2,(CEIL+2.6)/2,wz,S.wall);box(b-a,1.8,.03,(a+b)/2,1.7,wz,glassM,true);
     // dark metal frame, a lit strip along the sill, the logo on the glass
     for(const y of [.77,2.63])box(b-a+.12,.07,T+.06,(a+b)/2,y,wz,metal);for(const e of [a,b])box(.07,1.9,T+.06,e,1.7,wz,metal);
     box(b-a-.1,.02,.03,(a+b)/2,.82,wz+hn*(T/2+.035),G('sill-'+col,hexOf(col),.7));
     logoSign(.86,a+.62,1.05,wz+hn*.022,ry);}
    else{tbox(b-a,CEIL-2.1,T,(a+b)/2,(CEIL+2.1)/2,wz,S.wall);box(b-a,2.1,.08,(a+b)/2,1.05,wz,doorM);box(.05,.3,.04,b-.14,1.05,wz+hn*.06,trim);for(const e of [a,b])box(.06,2.1,T+.04,e,1.05,wz,metal);
     plate(.52,.17,(a+b)/2,1.62,wz+hn*.05,ry,[['STUDIO '+s.n,hexOf(col),66]],{bg:'#07080c',border:'#07080c'});
     // ON AIR indicator over the studio door
     box(.74,.26,.07,(a+b)/2,2.5,wz+hn*(T/2+.03),black);sign(.66,.2,(a+b)/2,2.5,wz+hn*(T/2+.075),ry,264,80,(g,w,h)=>{g.fillStyle='#16040a';g.fillRect(0,0,w,h);g.shadowColor=RED;g.shadowBlur=12;g.fillStyle='#ff5a72';g.font=FONT(52);g.textAlign='center';g.textBaseline='middle';g.fillText('ON AIR',w/2,h/2+3);});
     box(.07,.07,.05,(a+b)/2+.46,2.5,wz+hn*(T/2+.05),onAir,true);}
    from=b;}
   if(r[1]>from)tbox(r[1]-from,CEIL,T,(from+r[1])/2,CEIL/2,wz,S.wall);}
  // strip lights along the floor edges, green tube lights in a row overhead, a duct, pipes and a cable tray
  box(hx1-hx0-.2,.02,.04,(hx0+hx1)/2,.02,hz0+.19,pinkDim);box(hx1-hx0-.2,.02,.04,(hx0+hx1)/2,.02,hz1-.19,greenDim);
  for(const x of [86.5,88.5,90.5,92.5]){tube('x',1,x,CEIL-.42,-81.8,green);if(!low)flat(pool(GREEN,1.8,1.6,x,.02,-81.8,.16));}
  services('x',hx0+.1,hx1-.1,-81.8,CEIL-.18,{ductOff:.66,pipeOff:.3,trayOff:-.68});
  poster(1,.44,89.675,1.6,hz1-.125,TOS);poster(2,.44,89.325,1.6,hz0+.125,TON);
  // the far end: staff only, and the way out
  plate(1.2,.5,93.36,2.5,-81.8,TOW,[['STAFF ONLY',PINK,54],['仅限员工','#f4f8ff',50,1]],{neon:true});
  sign(.7,.22,93.36,2.92,-81.8,TOW,224,70,(g,w,h)=>{g.fillStyle='#04140c';g.fillRect(0,0,w,h);g.fillStyle=GREEN;g.shadowColor=GREEN;g.shadowBlur=8;g.font=FONT(34);g.textAlign='left';g.textBaseline='middle';g.fillText('EXIT',12,h/2+2);g.font=HAN(30);g.fillText('出口',112,h/2+2);g.beginPath();g.moveTo(190,h/2-12);g.lineTo(210,h/2);g.lineTo(190,h/2+12);g.fill();});
  {const f=box(.06,2.16,1.28,93.5,1.08,-81.8,doorM,true);auto(f,'z',1.2,93.5,-81.8,2.6,'staff');child(logoSign(.7,0,0,0,TOW),f,-.035,.45,0);}

  // ---------------- the four studios (seen through the windows; nobody goes in) ----------------
  
  const feed=n=>(g,w,h,t)=>{const c=STUDIOS[n-1].light==='green'?GREEN:STUDIOS[n-1].light==='pink'?PINK:n%2?PINK:GREEN;g.fillStyle=n%2?'#1c0f24':'#0d1c18';g.fillRect(0,0,w,h);
   // a clothed performer silhouette swaying (a drawing, not a camera)
   const sway=Math.sin(t*1.7+n)*w*.03,bx=w*.5+sway;g.fillStyle='#d9e3ea';g.beginPath();g.arc(bx,h*.3,h*.07,0,Math.PI*2);g.fill();g.fillStyle=c;g.fillRect(bx-h*.08,h*.38,h*.16,h*.3);g.fillStyle='#232733';g.fillRect(bx-h*.07,h*.68,h*.06,h*.24);g.fillRect(bx+h*.01,h*.68,h*.06,h*.24);
   g.fillStyle=RED;g.beginPath();g.arc(w*.07,h*.1,h*.035,0,Math.PI*2);g.fill();g.fillStyle='#fff';g.font=FONT(Math.round(h*.09));g.textAlign='left';g.fillText('LIVE · STUDIO '+n,w*.12,h*.13);g.textAlign='right';g.fillText((900+n*431+Math.floor(t*2.3)*(n+1)%300).toLocaleString('en-US'),w*.96,h*.13);};
  const plush=(x,y,z,i)=>{const c=[['#ff9ad0','#6a2a4c'],['#bff5d8','#2a5a44'],['#f2e6c8','#5a523c'],['#b9a6ff','#3a3066']][i%4],m=M('plush'+i%4,c[0],c[1]);ball(.17,x,y+.08,z,m,.9);ball(.12,x,y+.2,z,m);for(const s of [-1,1])ball(.05,x,y+.27,z+s*.05,m);};
  for(const s of STUDIOS){const [x0,x1,za,zb]=ROOMS.find(q=>q.id===s.room).rect,north=s.n<3,zw=north?za:zb,zbk=north?zb:za,dir=north?1:-1,depth=Math.abs(zbk-zw),mid=(x0+x1)/2,vD=Math.min(2.9,depth*.5),
    P=(u,v)=>[mid+u,zw+dir*v],c1=s.light==='mixed'?'pink':s.light,c2=s.light==='mixed'?'green':s.light,A=tone(c1),Bc=tone(c2),hex1=hexOf(c1),hex2=hexOf(c2),[px,pz]=P(0,vD),backRy=north?TOS:TON,bz=zbk-dir*.2,toDancer=(qx,qz)=>Math.atan2(px-qx,pz-qz);
   s.spot=[px,pz];s.face=[px,zw];
   // the quilted feature wall with the logo in pink neon, a glow along its base
   tbox(x1-x0-.3,CEIL-.1,.08,mid,CEIL/2,bz,k.quilt,1.1);sign(2.7,.65,mid,2.1,bz-dir*.06,backRy,820,197,(g,w,h)=>{g.clearRect(0,0,w,h);logo(g,w/2,h*.52,118);});
   box(x1-x0-.5,.035,.05,mid,.03,bz-dir*.07,pink);flat(pool(PINK,3.6,1.7,mid,.02,bz-dir*.95,.4));if(!low)wash(hex2,3.6,2.8,mid,1.5,bz-dir*.05,backRy,.22);
   // pink and green tube lights overhead on a bar; the dancer's mark
   pipe(.05,x1-x0-.5,'x',mid,CEIL-.16,pz,trim);tube('x',1.7,mid-.3,CEIL-.3,pz-dir*.55,A);tube('x',1.7,mid+.3,CEIL-.3,pz+dir*.65,Bc);
   cyl(1.5,.05,px,.03,pz,black,false,24);flat(pool(hex1,3.4,3.4,px,.062,pz,.34));
   // the camera on its tripod in the foreground with a small live-view screen (fixed cameras on stands, run from the office: nobody stands behind them)
   {const [qx,qz]=P(-.85,.95),yaw=toDancer(qx,qz);prop('camera-tripod',qx,qz,yaw+FACE.camera,1.5,0,()=>simple.camera(qx,qz,yaw));
    box(.24,.16,.02,qx+.3,1.36,qz-dir*.02,black);box(.02,.02,.2,qx+.16,1.3,qz,black);screen(.21,.13,qx+.3,1.36,qz-dir*.035,north?TOS:TON,160,100,feed(s.n),.9);box(.03,.03,.03,qx+.42,1.46,qz-dir*.03,red);}
   // two ring lights and a softbox on stands
   for(const [u,v] of [[-1.5,2.25],[1.45,1.3]]){const [qx,qz]=P(u,v),yaw=toDancer(qx,qz);prop('ring-light',qx,qz,yaw+FACE.ring,1.85,0,()=>simple.ring(qx,qz,yaw));}
   {const [qx,qz]=P(1.4,depth*.56),yaw=toDancer(qx,qz);prop('softbox',qx,qz,yaw+FACE.softbox,2.05,0,()=>simple.softbox(qx,qz,yaw));}
   // a wall monitor showing the outgoing stream
   {const ex=north?x1-.14:x0+.14,[,mz]=P(0,1.5);box(.05,.56,.94,ex,1.95,mz,black);screen(.86,.48,ex+(north?-.03:.03),1.95,mz,north?TOW:TOE,256,144,feed(s.n),.9);}
   // lived-in: bamboo, a paper floor lantern, a shelf of plush toys, a grey curtain down one side
   {const [qx,qz]=P(-1.5,depth-.62);prop('bamboo',qx,qz,s.n,1.9,0,()=>simple.plant(qx,qz,1.6));}
   {const [qx,qz]=P(1.25,depth-.7);lantern(qx,qz,.72);flat(pool(WARM,1.6,1.6,qx,.022,qz,.3));}
   {const sx=north?x0+.26:x1-.26,[,sz]=P(0,depth*.62);box(.24,.035,1.3,sx,1.42,sz,trim);box(.24,.035,1.3,sx,1.02,sz,trim);for(let i=0;i<3;i++)plush(sx,1.44,sz-.42+i*.42,s.n+i);prop('shark-plush',sx,sz+.1,north?PI/2:-PI/2,.2,1.04,()=>simple.shark(sx,1.04,sz));box(.18,.16,.2,sx,1.12,sz-.45,M('archive','#6a5a44','#2a2218'));}
   {const cx=north?x1-.2:x0+.2;for(let i=0;i<9;i++)tbox(.07+(i%2)*.06,CEIL-.25,.21,cx,CEIL/2,zw+dir*(depth-2.2+i*.2),S.cloth,1);box(.04,.04,2,cx,CEIL-.1,zw+dir*(depth-1.4),trim);}
   // the set that makes each studio its own
   if(s.theme==='velvet'){const [sx,sz]=P(.2,depth-1);const vel=M('chaise','#5a1d44','#2a0c20');box(1.5,.38,.66,sx,.24,sz,vel);box(1.5,.5,.16,sx,.62,sz+dir*.3,vel);box(.16,.3,.66,sx-.7,.5,sz,vel);cyl(2.6,.012,px,.012,pz,M('rug-rose','#3a1028','#1c0814'),false,24);}
   else if(s.theme==='fern'){for(const [u,v,hh] of [[1.5,depth-1.9,1.6],[-1.55,depth-2,1.3]]){const [qx,qz]=P(u,v);prop('bamboo',qx,qz,u,hh,0,()=>simple.plant(qx,qz,hh-.3));}const [qx,qz]=P(.1,depth-.5);prop('pothos',qx,qz,0,.6,.42,()=>simple.vine(qx,qz,.42));cyl(.36,.42,qx,.21,qz,k.potM,false,12);cyl(2.6,.012,px,.012,pz,M('rug-moss','#0f2a1a','#07150d'),false,24);}
   else if(s.theme==='arcade'){for(let i=0;i<2;i++)for(let j=0;j<2;j++){const [qx,qz]=P(-.1+i*.72,depth-.6),y=.3+j*.56;box(.64,.52,.5,qx,y,qz,M('crt','#15151b','#08080b'));rbox(.46,.34,.02,qx,y+.02,qz-dir*.26,(i+j)%2?G('crt-g',GREEN,.6):G('crt-p',PINK,.6),0,0,0);}
    for(let i=0;i<4;i++)for(let j=0;j<4;j++)box(.55,.012,.55,px-.825+i*.55,.012,pz-.825+j*.55,(i+j)%2?M('check-a','#231426','#110a13'):M('check-b','#0f2219','#07110c'));}
   else{const mx=north?x0+.16:x1-.16;for(const v of [.9,1.9,2.9]){box(.04,2.3,.9,mx,1.35,zw+dir*v,M('mirror','#27303a','#0c1016'));box(.05,2.36,.03,mx,1.35,zw+dir*(v-.47),trim);}{const b=cyl(.05,2.9,mx+(north?.14:-.14),1,zw+dir*1.9,trim,false,8);b.rotation.x=PI/2;}
    const [sx,sz]=P(.3,depth-1);cyl(.62,.4,sx,.2,sz,M('ottoman','#3a1436','#1b0a19'),false,16);}
   glowAt('hall',mid,2.1,bz-dir*.7,PINK,1.25,5.2);glowAt('hall',px,CEIL-.5,pz,hex2,.9,4.6);
   s.lamp={x:px,y:2.5,z:pz-dir*.9,dif:B.Color3.Lerp(B.Color3.FromHexString(hex1),B.Color3.White(),.4),spec:B.Color3.FromHexString(hex2).scale(.4),i:36,r:7};   // the figures use physical falloff, so this is a small lamp, lighting only the dancer
   s.key={x:px+.9,z:pz-dir*1.5,dif:B.Color3.Lerp(B.Color3.FromHexString(hex1),B.Color3.White(),.6)};
   k.blob(px,pz,1.05,1.05,.058);for(const [u,v,w] of [[-.85,.95,.8],[-1.5,2.25,.6],[1.45,1.3,.6],[1.4,depth*.56,.8],[-1.5,depth-.62,.8]]){const [qx,qz]=P(u,v);k.blob(qx,qz,w);}}

  // ---------------- Fish's office: the monitor wall, the schedule, the desk, shelves of archive boxes ----------------
  const feeds=STUDIOS.map(s=>feed(s.n));
  box(.06,1.36,2.36,97.8,2.02,-76.6,black);feeds.forEach((f,i)=>screen(1.06,.6,97.76,2.34-Math.floor(i/2)*.64,-76.05-(i%2)*1.1,TOW,256,144,f,.9));
  box(.06,1.3,.6,97.8,2.02,-75.02,black);screen(.52,1.22,97.76,2.02,-75.02,TOW,128,300,(g,w,h,t)=>{g.fillStyle='#07070c';g.fillRect(0,0,w,h);g.font=FONT(15);g.textAlign='left';const on=Math.floor(t/5)%5;['LIVE','SCHEDULE','CREATORS','REMOTE','ARCHIVE'].forEach((n,i)=>{g.fillStyle=i===on?PINK:'#15161d';g.fillRect(8,14+i*56,w-16,44);g.fillStyle=i===on?'#fff':'#9aa3b0';g.fillText(n,18,42+i*56);});},1.2);
  tbox(.8,.74,3,96.9,.37,-76.9,S.wall,1.4);box(.9,.05,3.1,96.9,.765,-76.9,black);
  box(.04,.44,1.24,97.08,1.1,-76.55,black);for(const z of [-76.9,-76.2])box(.06,.14,.06,97.08,.86,z,black);
  screen(1.18,.38,97.055,1.1,-76.55,TOW,512,164,(g,w,h,t)=>{g.fillStyle='#06070c';g.fillRect(0,0,w,h);g.fillStyle='#9aa3b0';g.font=FONT(13);g.textAlign='left';g.fillText('SCHEDULE · TONIGHT',8,16);for(let i=0;i<4;i++){g.fillStyle='#8f9aa8';g.fillText('S'+(i+1),8,48+i*30);for(let j=0;j<4;j++){const x0=40+j*118+((i*37)%50),ww=60+((i*53+j*31)%50);g.fillStyle=(i+j)%2?'#b02a82':'#1f9a62';g.fillRect(x0,34+i*30,ww,20);}}const x=40+((t*6)%460);g.strokeStyle='#fff';g.lineWidth=2;g.beginPath();g.moveTo(x,24);g.lineTo(x,h-6);g.stroke();},1);
  {const m=rbox(.04,.36,.6,96.98,1.05,-77.85,black,0,-.4,0);const p=screen(.56,.32,96.955,1.05,-77.86,TOW-.4,320,180,(g,w,h,t)=>{g.fillStyle='#05070b';g.fillRect(0,0,w,h);g.fillStyle=PINK;g.font=FONT(17);g.textAlign='left';g.fillText('BROADCAST · TONIGHT',10,24);g.font=FONT(14);g.fillStyle='#cfd8de';g.fillText('Studios on air      4 / 4',10,56);g.fillText('Members watching  '+(3900+Math.floor(t*5)%700).toLocaleString('en-US'),10,80);g.fillText('Stream health       good',10,104);g.fillStyle=GREEN;g.fillText('Payouts on schedule',10,134);g.fillText('All performers 18+, ID on file',10,158);},2);box(.06,.14,.06,97,.86,-77.85,black);}
  // the remote camera controls, a keyboard, a mug, pens, the desk lamp
  flat(screen(.42,.6,96.78,.8,-75.75,PI/2,160,228,(g,w,h,t)=>{g.fillStyle='#05070b';g.fillRect(0,0,w,h);g.fillStyle=GREEN;g.font=FONT(14);g.textAlign='left';g.fillText('REMOTE CAMERAS',8,20);for(let i=0;i<8;i++){const live=(Math.floor(t/4)+i)%8===0;g.fillStyle=live?PINK:'#16212a';g.fillRect(8+(i%2)*74,30+Math.floor(i/2)*46,66,38);g.fillStyle=live?'#fff':'#8f9aa8';g.font=FONT(13);g.fillText('S'+(Math.floor(i/2)+1)+' CAM '+'AB'[i%2],13+(i%2)*74,54+Math.floor(i/2)*46);}},1.3));
  for(const z of [-76.25,-76.0]){cyl(.12,.03,96.72,.805,z,standM,false,12);cyl(.03,.14,96.72,.88,z,trim,false,8);cyl(.05,.045,96.72,.96,z,z>-76.1?pink:green,false,8);}
  box(.16,.02,.46,96.74,.8,-76.75,black);cyl(.09,.11,96.72,.845,-77.3,M('mug','#c41f86','#4a0c32'),false,10);cyl(.08,.1,96.95,.84,-75.35,black,false,10);for(const a of [-.02,.015])rbox(.008,.16,.008,96.95+a,.92,-75.35,M('pen#d5dbe4','#d5dbe4','#d5dbe4'),0,0,a*6);
  cyl(.16,.03,96.75,.805,-78.15,black,false,12);rbox(.025,.5,.025,96.8,1.03,-78.15,trim,0,0,-.25);rbox(.025,.36,.025,96.78,1.33,-78.1,trim,.9,0,.3);cone(.18,.16,96.72,1.38,-77.95,black);cyl(.1,.02,96.72,1.31,-77.95,warm,false,10);flat(pool(WARM,1.1,1.1,96.75,.8,-77.85,.34));
  // her chair (the jacket over its back), the flight case by the door
  prop('office-chair',95.95,-78.05,FACE.chair+1.1,1.15,0,()=>simple.chair(95.95,-78.05,1.1));
  prop('flight-case',94,-77.1,PI/2,.7,0,()=>simple.flightCase(94,-77.1,.55,.9,.56));
  // the couch, a cabinet with shelves of archive boxes and a plush shark above it, plants, pinned photographs and notes
  tbox(1.7,.4,.7,94.65,.2,-74.72,S.cloth,1);tbox(1.7,.42,.16,94.65,.6,-74.42,S.cloth,1);
  tbox(1.5,.9,.36,96.6,.45,-74.4,S.wall,1.2);for(const y of [1.45,1.95]){box(1.5,.04,.3,96.6,y,-74.36,trim);for(let i=0;i<4;i++){if(y>1.9&&i===1)continue;box(.3,.26,.24,96.06+i*.36,y+.15,-74.36,M('archive','#6a5a44','#2a2218'));box(.12,.08,.005,96.06+i*.36,y+.15,-74.485,M('label','#e9e4dc','#6a665e'));}}
  prop('shark-plush',96.42,-74.38,PI,.2,1.97,()=>simple.shark(96.42,1.97,-74.38));prop('pothos',97.1,-74.4,PI,.6,.9,()=>simple.vine(97.1,-74.4,.9));prop('bamboo',93.95,-75.6,1,1.7,0,()=>simple.plant(93.95,-75.6,1.4));
  photoWall(1.6,.9,94.65,1.8,-74.2,TOS,77);
  picture(.7,.6,97.82,1.25,-78.9,TOW,128,110,(g,w,h)=>{g.fillStyle='#15141a';g.fillRect(0,0,w,h);['#ffe27a','#ff9ad0','#bff5d8','#ffe27a','#d9d2c4','#bff5d8'].forEach((c,i)=>{g.fillStyle=c;g.fillRect(8+(i%3)*40,8+Math.floor(i/3)*50,34,40);g.fillStyle='rgba(0,0,0,.55)';for(let q=0;q<3;q++)g.fillRect(12+(i%3)*40,16+Math.floor(i/3)*50+q*9,18+((i*7+q*5)%10),2);});},.7);
  box(2.6,.012,1.6,95.3,.012,-77.6,M('rug','#22102a','#110815'));tube('x',1.6,95.2,CEIL-.3,-77,pink);services('z',-79.4,-74.2,94.3,CEIL-.2,{pipes:false,trayOff:.5});cyl(.16,.04,94.6,CEIL-.02,-78.4,warm,false,10);
  // the plate beside her door
  box(.56,.8,.03,95.85,1.6,-79.74,black);sign(.52,.76,95.85,1.6,-79.76,TOS,260,380,(g,w,h)=>{g.fillStyle='#0b0b10';g.fillRect(0,0,w,h);g.strokeStyle='#4a4e58';g.lineWidth=4;g.strokeRect(4,4,w-8,h-8);logo(g,w/2,54,40);g.textAlign='center';g.textBaseline='middle';g.fillStyle='#f4f8ff';g.font=LOGO(40);g.fillText(CONFIG.FISH_NAME.toUpperCase(),w*.36,138);g.fillStyle=PINK;g.font=HAN(40);g.fillText('小鱼',w*.72,138);g.strokeStyle=GREEN;g.lineWidth=2;g.beginPath();g.moveTo(30,178);g.lineTo(w-30,178);g.stroke();g.fillStyle='#b9c2cf';g.font=FONT(26);['OPERATIONS','BROADCAST','SCHEDULING'].forEach((t,i)=>g.fillText(t,w/2,222+i*52));});

  // ---------------- staff corridor: lockers, the notice board, the restrooms ----------------
  for(let i=0;i<5;i++){tbox(.4,1.95,.64,93.84,.98,-86.76+i*.68,S.steel,1.3);box(.02,.3,.04,94.05,1.3,-86.76+i*.68,black);box(.02,.06,.3,94.05,1.7,-86.76+i*.68,black);}
  picture(1.1,.8,95.86,1.7,-84.5,TOW,220,160,(g,w,h)=>{g.fillStyle='#1a1410';g.fillRect(0,0,w,h);g.fillStyle='#d9d2c4';g.fillRect(14,14,84,60);g.fillRect(112,20,92,46);g.fillStyle='#ffc4e6';g.fillRect(20,88,70,54);g.fillStyle='#bff5d8';g.fillRect(104,80,100,66);g.fillStyle='#222';g.font=FONT(12);g.textAlign='left';g.fillText('ROTA',22,34);g.fillText('SET TIMES',118,40);g.fillText('18+ ONLY',26,112);g.fillText('ID ON FILE',110,104);},.75);
  const figures=(g,x,y,sc)=>{g.beginPath();g.arc(x,y,7*sc,0,7);g.fill();g.fillRect(x-8*sc,y+10*sc,16*sc,26*sc);g.fillRect(x-7*sc,y+38*sc,6*sc,22*sc);g.fillRect(x+1*sc,y+38*sc,6*sc,22*sc);g.beginPath();g.arc(x+40*sc,y,7*sc,0,7);g.fill();g.beginPath();g.moveTo(x+40*sc,y+10*sc);g.lineTo(x+54*sc,y+40*sc);g.lineTo(x+26*sc,y+40*sc);g.fill();g.fillRect(x+34*sc,y+40*sc,5*sc,20*sc);g.fillRect(x+41*sc,y+40*sc,5*sc,20*sc);};
  const restroomSign=(w,px,py,pz,ry)=>sign(w,w*.5,px,py,pz,ry,300,150,(g,W,Hh)=>{g.fillStyle='#0a0a10';g.fillRect(0,0,W,Hh);g.fillStyle=PINK;g.shadowColor=PINK;g.shadowBlur=10;figures(g,36,26,1.1);g.font=FONT(30);g.textAlign='left';g.fillText('RESTROOM',112,66);g.font=HAN(30);g.fillStyle='#f4f8ff';g.shadowBlur=0;g.fillText('洗手间',114,112);});
  for(const z of [-82.75,-86.25]){box(.04,2.1,.9,95.865,1.05,z,doorM);box(.05,.3,.05,95.82,1.05,z+.32,trim);restroomSign(.8,95.84,2.4,z,TOW);box(.03,.06,.06,95.83,1.95,z+.3,red);child(logoSign(.56,0,0,0,TOW),node,95.84,1.5,z);}
  tube('z',1.3,94.75,CEIL-.36,-83.4,green);services('z',LOBBY_N.z+.2,-79.8,95.4,CEIL-.2,{duct:false,pipeOff:.3,trayOff:-1.2});

  // ---------------- the rear corridor: dressing rooms, the stage doors, photographs and posters, the laundry cart ----------------
  const hanger=(g,x,y,sc,c)=>{g.strokeStyle=c;g.lineWidth=4*sc;g.lineCap='round';g.beginPath();g.arc(x,y-14*sc,6*sc,Math.PI*.9,Math.PI*2.4);g.lineTo(x,y);g.moveTo(x,y);g.lineTo(x-30*sc,y+18*sc);g.lineTo(x+30*sc,y+18*sc);g.closePath();g.stroke();};
  const dressing=(x,letter,occupied)=>sign(1.3,.46,x,2.48,-88.14,TOS,416,148,(g,w,h)=>{g.fillStyle='#0a0a10';g.fillRect(0,0,w,h);g.shadowColor=PINK;g.shadowBlur=12;hanger(g,56,66,1.2,PINK);g.fillStyle=PINK;g.font=FONT(34);g.textAlign='left';g.fillText('DRESSING ROOM '+letter,104,64);g.shadowBlur=0;g.fillStyle=occupied?'#ff5a72':'#f4f8ff';g.font=occupied?FONT(24):HAN(28);g.fillText(occupied?'OCCUPIED':'更衣室',106,112);});
  dressing(79.95,'A',false);rbox(.06,2.16,1.2,79.42,1.08,-87.38,doorM,0,.5,0);   // dressing room A's door, standing open
  dressing(83.6,'B',true);box(1.2,2.16,.05,83.6,1.08,-88.14,doorM);box(.05,.3,.05,84.05,1.05,-88.19,trim);box(.06,.06,.03,84.35,1.5,-88.15,red);logoSign(.7,83.6,1.55,-88.172,TOS);
  for(const [x,n] of [[87.5,3],[91.5,4]]){box(.95,2.12,.05,x,1.06,-88.14,doorM);box(.05,.3,.05,x+.34,1.05,-88.19,trim);box(.06,.06,.03,x+.62,1.5,-88.15,onAir,true);logoSign(.7,x,1.55,-88.172,TOS);
   plate(.9,.22,x,2.36,-88.15,TOS,[['STUDIO '+n+' · STAGE',n===3?PINK:GREEN,56]],{bg:'#0a0a10',border:'#0a0a10'});}
  photoWall(2.6,1,85.4,1.65,-89.82,TON,101);photoWall(1.7,.9,80,1.65,-89.82,TON,202);poster(2,.5,88.3,1.6,-89.82,TON);poster(3,.5,89,1.6,-89.82,TON);poster(0,.5,91.4,1.6,-89.82,TON);poster(1,.5,92.3,1.55,-89.82,TON);
  prop('laundry-cart',82.15,-89.52,0,.95,0,()=>simple.cart(82.15,-89.52));
  prop('flight-case',78.6,-89.05,0,.85,0,()=>simple.flightCase(78.6,-89.05,.7,1.3,.6));box(.6,.36,.5,78.6,1.03,-89.2,M('case-b','#23262e','#101116'));
  drain(86,-89);drain(90.5,-88.7,.4);
  for(const x of [80.5,84.5,88.5,92]){tube('x',1.1,x,CEIL-.38,-89,green);if(!low)flat(pool(GREEN,2,1.5,x,.02,-89,.14));}
  services('x',78.2,93.3,-89,CEIL-.18,{duct:false,pipeOff:.55,trayOff:-.62});
  box(.08,.3,.86,93.3,2.5,-89,black);sign(.8,.26,93.255,2.5,-89,TOW,246,80,(g,w,h)=>{g.fillStyle='#04140c';g.fillRect(0,0,w,h);g.fillStyle=GREEN;g.shadowColor=GREEN;g.shadowBlur=10;g.font=FONT(40);g.textAlign='left';g.textBaseline='middle';g.fillText('EXIT',14,h/2+2);g.font=HAN(36);g.fillText('出口',132,h/2+2);});
  // dressing room A: a mirror with bulbs, a counter and stools, a clothes rail, a bench
  box(2.7,1.1,.04,79.9,1.75,-82.94,M('mirror','#27303a','#0c1016'));for(let i=0;i<8;i++){box(.09,.09,.06,78.65+i*.357,2.36,-82.95,warm);box(.09,.09,.06,78.65+i*.357,1.14,-82.95,warm);}
  box(3,.06,.55,79.9,.8,-83.19,trim);box(2.9,.74,.06,79.9,.4,-83.4,black);for(const x of [79.2,80.6]){cyl(.36,.06,x,.5,-83.9,M('stool-p','#3a1436','#1b0a19'),false,12);cyl(.05,.48,x,.24,-83.9,standM,false,8);}
  box(.05,.05,2.8,78.38,1.7,-86,trim);for(const z of [-87.4,-84.6])box(.05,1.7,.05,78.38,.85,z,trim);for(let i=0;i<8;i++)box(.34,.95,.05,78.4,1.18,-87.2+i*.34,M('garment'+(i%4),['#5a1d44','#123425','#2c2f36','#3a1028'][i%4],['#22081a','#081a12','#111317','#1c0814'][i%4]));
  tbox(.5,.42,1.6,81.35,.21,-86,S.cloth,1);box(1.8,.04,.06,79.9,CEIL-.03,-85.4,warm);poster(0,.5,81.6,1.7,-85,TOW);

  // ---------------- contact shadows: a soft dark patch under each person and each piece of furniture (every quality) ----------------
  for(const [x,z,w,d] of [[81.3,-80.6,4.3,1.7],[79.75,-81.84,.9,2.3],[82.85,-81.84,.9,2.3],[81.3,-81.32,.95,.95],[84.62,-74.6,1.9,1],[78.38,-78.2,.95,4.2],[78.7,-74.7,.8,.8],
    [96.9,-76.9,1.5,3.7],[95.6,-76.9,.95,.95],[95.95,-78.05,.9,.9],[94,-77.1,1,1.3],[94.65,-74.62,2.2,1.3],[96.6,-74.4,1.9,.8],[93.9,-85.4,.9,3.9],
    [82.15,-89.52,1.5,1],[78.6,-89.05,1.1,1.7],[79.9,-83.25,3.3,1],[79.2,-83.9,.6,.6],[80.6,-83.9,.6,.6],[81.35,-86,.9,2],[78.4,-86,.7,3.1]])k.blob(x,z,w,d);

  k.finish();
  const doors=k.doorControl();
  // after the merge: which pieces take the key light's shadow and which cast one
  const casters=[];if(shadow){const CAST=new Set([S.wall,S.steel,S.cloth,S.concrete,metal,trim,dark,black,doorM,standM]);
   for(const m of node.getChildMeshes(false)){const t=m.material?.metadata?.mk;if(m.material&&t!=='fx'&&t!=='glow'&&!(m.material.alpha<1))m.receiveShadows=true;if(CAST.has(m.material))casters.push(m);}shadow.getShadowMap().renderList=casters.slice();}
  {const glow=scene.metadata?.lookGlow;if(glow)for(const m of node.getChildMeshes(false))if(m.material===k.blobM)try{glow.addExcludedMesh(m);}catch{}}
  /* What every other surface reflects (Medium and above): a small all-round picture of the room group the player is in, taken once when they come into it
     and twice more as the people and props arrive. There are two, so one is drawn while the other is in use (a surface cannot be drawn into the picture
     it is showing). The floors keep their mirror. */
  const probes=[],PROBE_AT={front:[81.75,1.5,-79.2],hall:[89.5,1.5,-81.8],office:[95.6,1.5,-77.2],staff:[94.75,1.5,-84],rear:[86,1.5,-89]},probeAgain=[14,34];let probeCur=-1,probePending=-1,probeSwap=0,probeShown=null,probeWant=null,probeDue=1.2;
  if(!low)for(let i=0;i<2;i++){const p=new B.ReflectionProbe('milked-room-'+i,high?256:128,scene,true,false,!!ip.applyByPostProcess);p.refreshRate=B.RenderTargetTexture.REFRESHRATE_RENDER_ONCE;p.cubeTexture.onAfterRenderObservable.add(()=>{p.drawn=(p.drawn||0)+1;});k.own.push(p);probes.push(p);}
  function roomPicture(clock,zone){if(!probes.length)return;
   if(probePending>=0){if(clock<probeSwap||!(probes[probePending].drawn>=6))return;{const i=scene.customRenderTargets.indexOf(probes[probePending].cubeTexture);if(i>=0)scene.customRenderTargets.splice(i,1);}probeCur=probePending;probePending=-1;probeShown=probeWant;const t=probes[probeCur].cubeTexture;for(const m of k.pbrs)if(!mirrored.has(m))m.reflectionTexture=t;return;}
   if(clock<1.2||(zone===probeShown&&clock<probeDue))return;if(clock>=probeDue)probeDue=probeAgain.length?probeAgain.shift():1e9;
   probeWant=zone;probePending=probeCur<0?0:1-probeCur;const p=probes[probePending],list=p.renderList;p.position.set(PROBE_AT[zone][0]+OX,PROBE_AT[zone][1],PROBE_AT[zone][2]+OZ);   /* a probe is not parented: world metres */list.length=0;
   for(const m of node.getChildMeshes(false))if(m.isEnabled()&&m.material&&m.material.metadata?.mk!=='fx'&&!m.skeleton)list.push(m);p.drawn=0;p.cubeTexture.resetRefreshCounter();if(!scene.customRenderTargets.includes(p.cubeTexture))scene.customRenderTargets.push(p.cubeTexture);probeSwap=clock+.3;}

  // ---------------- people: Eva, Fish and one dancer in each studio (clothed crowd figures). Nobody else. ----------------
  const assets=root.VoidAssets,clipsOf=look=>root.VoidCrowd?.clips?.[look]||['idle'],SPARE=['district-resident','runner-02'];
  const spot=(id,x,z,face,clips,opts={})=>people.push({id,x,z,y:0,yaw:Math.atan2(face[0]-x,face[1]-z),clips,node:null,anim:null,spawned:false,...opts});
  const eva=MODELS.eva,fish=MODELS.fish;
  spot(eva.id,eva.at[0],eva.at[1],eva.face,eva.clips,{fixedLook:eva.look,asset:eva.asset,role:'eva'});spot(fish.id,fish.at[0],fish.at[1],fish.face,fish.clips,{fixedLook:fish.look,asset:fish.asset,role:'fish'});
  for(const s of STUDIOS)spot(s.dancer.id,s.spot[0],s.spot[1],s.face,s.dancer.clips,{fixedLook:s.dancer.look,file:s.dancer.file,spare:s.n===1?null:SPARE,role:'dancer',zone:'hall',lamp:s.lamp,key:s.key,studio:s.n,library:s.dancer.library,dances:s.dancer.dances,y:.055,phase:s.n*1.3});
  for(const p of people)if(p.role!=='dancer'){const fx=Math.sin(p.yaw),fz=Math.cos(p.yaw),hex=p.role==='eva'?PINK:WARM;p.zone=p.role==='eva'?'front':'office';
   p.lamp={x:p.x+fx*1.2,y:2.3,z:p.z+fz*1.2,dif:B.Color3.Lerp(B.Color3.FromHexString(hex),B.Color3.White(),.55),spec:B.Color3.FromHexString(hex).scale(.5),i:30,r:6};
   p.key={x:p.x+fx*1.5+fz*.9,z:p.z+fz*1.5-fx*.9,dif:B.Color3.Lerp(B.Color3.FromHexString(hex),B.Color3.White(),.7)};}
  /* The dancers' clothes lean to black and pink (the owner's reference). The figures are the repository's own MakeHuman people (CC0), whose clothes and shoes are
     separate materials: each dancer gets its own tinted copy of those two (the model files and everyone else who wears the look are untouched). A face
     covering that came with a look (the street mask, the VR headset and its trackers) is hidden so that every dancer's face shows. Nothing else changes:
     the same clothed figures, the same clips. The licensed dancers (studio 2's Female Warrior, studio 3's Dex) keep their own outfits. */
  const OUTFIT={'district-resident':{suit:[.5,.45,.55],shoes:[3,.6,2]},'vr-companion-m':{suit:[.55,.5,.6],shoes:[1.4,.35,1.6]},'vr-player-b':{suit:[1.3,.3,5],shoes:[.2,.2,.22]}},COVER=/\.(mask0|headset0|trackers1)/;
  function dress(p){const o=OUTFIT[p.look];p.meshes=p.meshes.filter(m=>{const mat=m.material,nm=mat?.name||'';if(COVER.test(nm)){m.setEnabled(false);return false;}
    const c=o&&mat?.albedoColor?(/suit/.test(nm)?o.suit:/shoes/.test(nm)?o.shoes:null):null;if(c){const cl=mat.clone(nm+'-milked-'+p.studio);cl.albedoColor=new B.Color3(c[0],c[1],c[2]);k.own.push(cl);m.material=cl;}return true;});}
  const LOOKS=[...new Set([...people.map(p=>p.fixedLook),'npc-grey-reverie','npc-ethereal-lace'])];
  const asked=new Map();
  // A look that is a licensed companion model (the studio 3 dancer is Dex since 18 Nov 2026, the owner's choice) ships as an encrypted .vrpak, not a .glb.
  // Studio 2's dancer (the licensed Female Warrior, 18 Nov 2026) names her own .vrpak in milked.js; she is not a companion.
  const FILES=new Map(people.filter(p=>p.file).map(p=>[p.fixedLook,p.file]));
  const fileOf=look=>{if(FILES.has(look))return FILES.get(look);const C=root.VoidVRCompanions,e=C?.companions&&[...C.companions.values()].find(x=>x.model===look);return e?C.file(e):look+'.glb';};
  function askLooks(list=LOOKS){for(const look of list){const id='crowd:'+look;if(!assets?.container?.(id)&&!loading.has(look)){loading.add(look);asked.set(look,Promise.resolve(assets?.load?.(id,{src:'assets/models/crowd/'+fileOf(look),background:true},scene)).catch(()=>{}).then(()=>{loading.delete(look);asked.delete(look);}));}}return [...asked.values()];}
  // Who is speaking to the player now: the open walking conversation's current line (Eva and Fish speak as milked-eva / milked-fish, milked-integration.js).
  let lastSpeaker=null;
  function speakerNow(){try{const line=typeof speech!=='undefined'&&speech?.lines?.[speech.index];if(line){lastSpeaker=line.who;return lastSpeaker;}return root.VoidConversationUI?.isOpen?lastSpeaker:(lastSpeaker=null);}catch{return null;}}
  const studioOne=people.find(p=>p.studio===1);
  function syncStudioOne(){
   if(!studioOne)return;
   const wanted=MK.studioOnePerformer(Date.now());
   if(wanted.look===studioOne.fixedLook)return;
   studioOne.anim?.dispose?.();studioOne.node?.dispose?.();
   studioOne.node=null;studioOne.anim=null;studioOne.rot=null;studioOne.requestUntil=0;studioOne.meshes=[];
   studioOne.spawned=false;studioOne.fixedLook=wanted.look;
   studioOne.clips=wanted.clips;studioOne.dances=wanted.dances;studioOne.library=null;
   studioOne.look=null;studioOne.clip=null;
   askLooks([wanted.look]); // first load at shift change, without waiting for the normal 20s retry
   mirAll=null;mirNext=0;
  }
  // Requestable only while the named animation group exists on this exact loaded model.
  // Keep walking, seated/floor, partner and prop-based clips out of a stationary studio.
  const REQUESTABLE=/^(?:dance(?:-[a-z0-9-]+)?|slow-dance|idle(?:-[a-z0-9-]+)?|look|watch|gesture|shrug|talk|ac-stand-curve-[23])$/;
  function animationChoices(studio){
   syncStudioOne();const p=people.find(x=>x.studio===Number(studio));
   if(!p||!p.node||!p.anim)return {look:p?.fixedLook||null,ready:false,clips:[]};
   const groups=p.node.metadata?.animationGroups||[];
   const present=name=>groups.some(g=>g.name===name||g.name.endsWith('-'+name)||g.name.replace(/\.\d{3}$/,'').endsWith('-'+name));
   const options=[...new Set(root.VoidCrowd?.clips?.[p.look]||[])].filter(c=>REQUESTABLE.test(c)&&p.anim.has?.(c)&&present(c));
   return {look:p.look,ready:true,clips:options.map(id=>({id,label:id.replace(/^ac-/,'').replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}))};
  }
  function requestAnimation(studio,clip){
   const available=animationChoices(studio),p=people.find(x=>x.studio===Number(studio));
   if(!p||!available.ready)return {ok:false,message:'Performer is loading.'};
   if(typeof clip!=='string'||!available.clips.some(c=>c.id===clip))return {ok:false,message:'Animation unavailable for this performer.'};
   if(k.disposed||!p.anim)return {ok:false,message:'Studio is unavailable.'};
   try{
    p.anim.play(clip);p.clip=clip;p.requestUntil=k.clock+12;
    if(p.rot)p.rot.until=Math.max(p.rot.until,p.requestUntil+1);
    return {ok:true,message:'REQUEST RECEIVED · '+clip.replace(/-/g,' ').toUpperCase()};
   }catch{return {ok:false,message:'Unable to start the animation.'};}
  }
  function staff(clock,cam=null,dt=0){syncStudioOne();const speaker=cam?speakerNow():null;
   // The figures are loaded here, by this environment (nothing else preloads them for it). Asked again every 20 s while one is still missing: a download can be
   // dropped by a change of scene, and the shared look loader remembers such a download as done.
   if(clock>looksAsked&&typeof mode!=='undefined'&&mode==='walking'){looksAsked=clock+20;askLooks();}
   for(const p of people){
    if(!p.node){let n=null,look=null,clip=null;
     if(p.asset&&assets?.container?.(p.asset)){n=assets.instance(p.asset,node);look=p.asset;clip='idle';}
     else{   // Eva and Fish only ever use their own look; a dancer whose look is not on this machine after a while uses a spare clothed figure
      const order=p.spare&&clock>25&&!loading.has(p.fixedLook)?[p.fixedLook,...p.spare]:[p.fixedLook];   // a large licensed file still downloading is waited for, not replaced
      for(const c of order){if(clipsOf(c).some(q=>p.clips.includes(q))&&(n=assets?.instance?.('crowd:'+c,node))){look=c;clip=p.clips.find(q=>clipsOf(c).includes(q))||'idle';break;}}}
     if(!n)continue;p.node=n;p.look=look;p.clip=clip;p.spawned=true;p.anim=p.asset?null:root.VoidCrowd?.animate?.(n,look,clip);n.position.set(p.x,p.y,p.z);n.rotation.y=p.yaw;n.metadata={...n.metadata,milked:p.id,...(p.role!=='dancer'?{character:p.id}:{})};   /* character: the head tracking (npc-look.js) finds Eva and Fish by it */p.meshes=n.getChildMeshes();if(p.role==='dancer')dress(p);for(const m of p.meshes)if(m.material&&m.material.maxSimultaneousLights<8)m.material.maxSimultaneousLights=8;   /* or a look made for four lights never sees its own lamp */if(key)for(const m of p.meshes)key.excludedMeshes.push(m);mirAll=null;mirNext=0;
     if(p.role==='dancer'){
      // a rotation of dances (milked.js danceTurn), from the ones this figure's file really has; with fewer than two the old single loop below plays
      const groupsOf=(n.metadata?.animationGroups||[]).map(g=>g.name.replace(/\.\d{3}$/,'')),own=(p.dances||[]).filter(c=>clipsOf(look).includes(c)&&groupsOf.some(g=>g===c||g.endsWith('-'+c)));
      if(own.length>1){p.rot={list:own,n:0,until:clock+(MK.danceTurn(own,0,p.studio)?.seconds||30)};p.clip=MK.danceTurn(own,0,p.studio).clip;try{p.anim?.play?.(p.clip);}catch{}continue;}
      // the shared animation library, where it is installed: a different loop for each studio. Without it the look's own dance plays.
      if(p.library&&root.VoidAnimLibrary?.apply)Promise.resolve(root.VoidAnimLibrary.apply(n,look,{only:[p.library],scene})).then(added=>{if(k.disposed||p.node!==n||!added?.includes(p.library))return;p.anim?.play?.(p.library);p.clip=p.library;}).catch(()=>{});}
     continue;}
    /* Where Eva and Fish face: a gesture's turn (Mission 003: Eva turns toward the staff-only door as she says where Fish is), else toward the player while she is
       the one speaking to them (the owner, 18 Nov 2026: "When I got to Fish she didn't turn to look at me"), else her own way. Eased on its own value and written
       outright every frame, so the small body turn of the head tracking (npc-look.js) is never added up. While she speaks she plays her talk clip, if her look has one. */
    if(p.role!=='dancer'){const talking=!!cam&&speaker===p.id,want=p.turn&&clock<p.turn.until?p.turn.yaw:talking?Math.atan2(cam.x-p.x,cam.z-p.z):p.yaw;
     if(p.face===undefined)p.face=p.node.rotation.y;const d=Math.atan2(Math.sin(want-p.face),Math.cos(want-p.face));p.face+=d*Math.min(1,p.turn?.12:dt*5);p.node.rotation.y=p.face;
     if(talking!==!!p.talking){p.talking=talking;if(!p.turn)try{p.anim?.play?.(talking&&clipsOf(p.look).includes('talk')?'talk':p.clip);}catch{}}
     if(p.turn&&clock>=p.turn.until&&Math.abs(d)<.02){p.turn=null;try{p.anim?.play?.(talking&&clipsOf(p.look).includes('talk')?'talk':p.clips.includes('idle')?'idle':p.clip);}catch{}}}
    if(p.role==='dancer'&&p.requestUntil&&clock>=p.requestUntil){
     p.requestUntil=0;const resume=p.rot?.list?.[0]||p.dances?.[0]||p.clips[0];
     if(resume){try{p.anim?.play?.(resume);p.clip=resume;}catch{}}
     if(p.rot)p.rot.until=clock+20;
    }
    if(p.rot&&clock>=p.rot.until&&!p.requestUntil){const t=MK.danceTurn(p.rot.list,++p.rot.n,p.studio);p.rot.until=clock+t.seconds;p.clip=t.clip;try{p.anim?.play?.(t.clip);}catch{}}   // the next dance, cross-faded
    // a figure with no dance of its own still moves: a slow sway on the spot
    if(p.role==='dancer'&&!/dance|^ac-/.test(p.clip)){const t=clock*2.6+p.phase;p.node.position.y=p.y+Math.abs(Math.sin(t))*.03;p.node.rotation.y=p.yaw+Math.sin(t*.5)*.4;}}
  }
  function tick(time){
   if(k.disposed)return;const dt=last===null?0:Math.min(.1,Math.max(0,time-last));last=time;const cam=toLocal(scene.activeCamera?.globalPosition);
   doors.tick(dt,cam);k.animate(dt,cam,true);{const q=Math.sin(k.clock*3.2)>0?1:.3;onAir.emissiveColor.copyFromFloats(q,.17*q,.29*q);}
   expose();if(!low&&cam){const zone=zoneOf(cam.x,cam.z);relight(dt,cam,zone);keyLight(dt,cam,zone);if(k.clock>faceNext){faceNext=k.clock+.5;faceLamps(cam);}roomPicture(k.clock,zone);
    // the mirror's list: everything it may show is gathered a few times as the place fills up; on Medium only what is near the player is drawn into it
    if(k.clock>mirNext){mirNext=k.clock+.5;if(!mirAll||k.clock>mirAllNext){mirAllNext=k.clock+(k.clock<45?3:1e9);mirAll=k.reflectIn(people.flatMap(p=>p.meshes||[]));}mir.renderList=high?mirAll:near(mirAll,cam.x,cam.z,10);}}
   staff(k.clock,cam,dt);
  }
  /* Behind the check-in card (17 Nov 2026, docs/development/SMOOTHNESS_AUDIT.md): the people's figures are fetched and placed now, and every shader the rooms need
     (the people, the floor mirror's view of them, the glow and the key light's shadow) is compiled before the inner doors open. They used to be fetched only once
     the player was walking, so they arrived, and their shaders compiled, just as the inner doors opened. A slow download (over 8 s) still finishes in the background. */
  const prepared={};   // how long each step behind the card took, in ms (state().prepared; for checking on a real graphics card)
  async function prepare(){if(k.disposed)return;syncStudioOne();let t=performance.now();const lap=n=>{const now=performance.now();prepared[n]=Math.round(now-t);t=now;};const cap=(p,ms)=>Promise.race([Promise.resolve(p).catch(()=>{}),new Promise(r=>setTimeout(r,ms))]);
   // only figures already on this computer (in memory or the offline cache), the rule every place follows (asset-pipeline.js prepare): a first visit still downloads after the card
   const here=(await Promise.all(LOOKS.map(async look=>assets?.container?.('crowd:'+look)||await cap(assets?.isCached?.('assets/models/crowd/'+fileOf(look)),1500)?look:null))).filter(Boolean);if(k.disposed)return;
   await cap(Promise.all(askLooks(here)),8000);if(k.disposed)return;lap('figures');staff(k.clock);
   if(mir){mirAll=k.reflectIn(people.flatMap(p=>p.meshes||[]));mir.renderList=mirAll;}
   root.VoidAssets?.settleLights?.(scene);await cap(scene.whenReadyAsync(true),10000);if(k.disposed)return;lap('shaders');
   // The room picture that every surface reflects was taken 1.2 s after the doors opened (six views of the room in one frame); it is taken now, under the same
   // light (the lamps faded in as they would have been by then). The next ones come at 14 s and 34 s, as before.
   const w=typeof walker!=='undefined'&&walker?toLocal({x:walker.x,y:1.7,z:walker.z}):null;
   if(!low&&w&&probes.length){const zone=zoneOf(w.x,w.z);for(let i=0;i<3;i++){relight(1,w,zone);keyLight(1,w,zone);}faceLamps(w);expose();roomPicture(1.2,zone);const p=probes[probePending];if(p){try{p.cubeTexture.render();}catch{}roomPicture(1.5,zone);}lap('picture');}
   // The floor mirror draws the room with its own shader variants (a clip plane, mirrored); drawing it once here compiles them.
   if(mir){try{mir.render();}catch{}await cap(scene.whenReadyAsync(true),5000);try{mir.render();}catch{}lap('mirror');}}
  /* gesture(who, toward, seconds): `who` (a person's id, e.g. milked-eva) turns up to 70 degrees toward `toward` ('staff-door': the STAFF ONLY door beside her desk, the way to
     the staff area) and talks with her hands (her talk clip) for `seconds`, then turns back to her idle. Returns false when that person is not here. */
  const TOWARD={'staff-door':[85.5,-81.8]};
  function gesture(who,toward,seconds=4){const p=people.find(x=>x.id===who&&x.node);const at=TOWARD[toward];if(!p||!at)return false;let d=Math.atan2(at[0]-p.x,at[1]-p.z)-p.yaw;d=Math.atan2(Math.sin(d),Math.cos(d));
   p.turn={yaw:p.yaw+Math.max(-1.22,Math.min(1.22,d)),until:k.clock+Math.max(1,seconds),toward,at:k.clock};try{if(p.clips.includes('talk'))p.anim?.play?.('talk');}catch{}gestures.push({who,toward,at:k.clock});return true;}
  const gestures=[];
  return {tick,prepare,gesture,animationChoices,requestAnimation,get gestures(){return gestures.slice();},inside:()=>true,people,doors,area:AREA,state:()=>({ready:!k.disposed,area:AREA,staffDoor:(()=>{const sd=(typeof walkingLocation!=='undefined'?walkingLocation?.solids:null)?.find?.(x=>x.staff);return {granted:!!MK.staffAccess?.(typeof state!=='undefined'?state?.story?.flags:null),blocking:!!sd&&!sd.open};})(),prepared:{...prepared},people:people.filter(p=>p.spawned).length,dancers:people.filter(p=>p.spawned&&p.role==='dancer').map(p=>({studio:p.studio,look:p.look,clip:p.clip,dances:p.rot?.list.slice()||null,next:p.rot?+(p.rot.until-k.clock).toFixed(1):null})),screens:k.screens.length,doors:doors.state(),lights:lights.length}),
   dispose(){if(k.disposed)return;for(const p of people){try{p.anim?.dispose?.();p.node?.dispose?.();}catch{}}people.length=0;for(const p of probes){const i=scene.customRenderTargets.indexOf(p.cubeTexture);if(i>=0)scene.customRenderTargets.splice(i,1);}k.dispose();
    scene.clearColor=prev.clear;scene.fogMode=prev.fogMode;scene.fogDensity=prev.fogDensity;scene.fogColor=prev.fogColor;ip.exposure=prev.exposure;ip.contrast=prev.contrast;scene.environmentIntensity=prev.env;
    if(sun&&lightPrev.sun!=null)sun.intensity=lightPrev.sun;if(ambient){if(lightPrev.amb!=null)ambient.intensity=lightPrev.amb;if(lightPrev.dif)ambient.diffuse=lightPrev.dif;if(lightPrev.gnd&&ambient.groundColor)ambient.groundColor=lightPrev.gnd;}}};
 }
 // How far each Meshy model must be turned so that its front faces the way the code asks. Checked by looking (16 Nov 2026): all four come in facing +z, which is
 // what a yaw of 0 means here, so none needs a turn. A regenerated model may need a new number.
 const FACE={camera:0,ring:0,softbox:0,chair:0};
 /* The pointer signs in Old Town (the owner, 16 Nov 2026: Milked moved down the street, past the South Gate). Each is a blade sign on a bracket from the east wall of Main Street,
    read walking south: the existing MILKED logo, an arrow straight ahead and the plain words SOUTH GATE. No new wording. spots: [[x of the plate's middle, y, z]]. Built in Old Town's
    own frame (no move): they belong to Old Town, not to the building. */
 function pointers({B,scene,parent,quality,spots}){
  const k=kit({B,scene,parent,quality,area:'street',offset:[0,0]}),{box,sign,logo,black,FONT}=k;
  const ahead=(g,w,h)=>{g.fillStyle='#0b0b10';g.fillRect(0,0,w,h);g.strokeStyle='#4a4e58';g.lineWidth=6;g.strokeRect(6,6,w-12,h-12);logo(g,w*.38,h*.4,h*.4);
   g.strokeStyle='#ffe9f7';g.shadowColor=PINK;g.shadowBlur=14;g.lineWidth=h*.08;g.lineCap='round';g.lineJoin='round';const ax=w*.88;g.beginPath();g.moveTo(ax,h*.78);g.lineTo(ax,h*.2);g.moveTo(ax-h*.17,h*.38);g.lineTo(ax,h*.2);g.lineTo(ax+h*.17,h*.38);g.stroke();g.shadowBlur=0;
   g.font=FONT(h*.17);g.fillStyle=GREEN;g.textAlign='center';g.textBaseline='middle';g.fillText('SOUTH GATE',w*.38,h*.86);};
  for(const [bx,by,bz] of spots){box(2.9,.08,.08,bx,by+.55,bz,black);box(.08,.6,.08,bx+1.22,by+.3,bz,black);box(2.7,.97,.07,bx,by,bz,black);sign(2.6,.9,bx,by,bz+.045,TON,832,288,ahead);}
  k.finish();
  return {dispose(){k.dispose();}};
 }
 MK.create=create;MK.build=build;MK.pointers=pointers;

})(typeof globalThis!=='undefined'?globalThis:this);
