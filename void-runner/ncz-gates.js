/* The checkpoints of NeoChinatown as buildings (docs/development/NEOCHINATOWN_QUARTERS.md). Presentation only: the rules, rectangles, lanes and door
   positions are ncz-quarters.js; collision is that file's solids(), opened and shut here door by door.
   build({B,scene,parent,quality,quarter,instance}) -> {tick(dt,time), doors, scan(laneKey,on), dispose()}   (called by neochinatown.js for a quarter's build)

   Every gate at the quarter's edge is built whole: the gatehouse across the street, a room per lane with a door at each end, the scanner in each room, the
   guards, the signs. The same gate is built the same way in the quarter on its other side, so a player stands in the same room before and after the exchange.
   Guards: cheap private security at the city gates are PLACEHOLDERS (street figures in a plain dark uniform tint; a proper character pass comes later).
   The Function Gate is watched by the Corporate District's existing silent security robots as a stand-in: no voice, no lines, no new look.
   Nobody here speaks. Signs carry plain functional words only. */
(function(root){
 'use strict';
 const base=typeof document!=='undefined'&&document.currentScript?new URL('.',document.currentScript.src):null;
 // A taxi post: where each stands is in ncz-quarters.js (STOPS[].post, CALL_POINTS).
 const TALL={function:15.5,east:15.5};   // (a gate's own `height` wins: the Far South Gate, shut, is 13.5 m)
 function build({B,scene,parent,quality,quarter,instance}){
  const Q=root.VoidQuarters,low=quality==='low',high=quality==='high'||quality==='ultra',own=[],nodes=[],merge=new Map(),lights=[],guards=[];let disposed=false;
  const tex=(name,w,h,draw)=>{const t=new B.DynamicTexture('gate-'+name,{width:w,height:h},scene,true);draw(t.getContext(),w,h);t.update();own.push(t);return t;};
  const file=name=>{const rel='assets/textures/ncz/'+name+'.jpg',t=new B.Texture(base?new URL(rel,base).href:rel,scene,false,true);t.wrapU=t.wrapV=B.Texture.WRAP_ADDRESSMODE;own.push(t);return t;};
  const mats={};
  const pbr=(key,hex,{rough=.7,metal=.2,color=null,normal=null,scale=1}={})=>{if(mats[key])return mats[key];const m=new B.PBRMaterial('gate-'+key,scene);m.albedoColor=B.Color3.FromHexString(hex);m.roughness=rough;m.metallic=metal;
   if(color){m.albedoTexture=file(color);m.albedoTexture.uScale=m.albedoTexture.vScale=scale;}if(normal&&!low){m.bumpTexture=file(normal);m.bumpTexture.uScale=m.bumpTexture.vScale=scale;}
   // a dimmed copy of the surface glows faintly, as if lit by the strips and the city's haze: the rooms read on Low, which has no real lamp in them
   if(color){const e=m.albedoTexture.clone();e.level=1;own.push(e);m.emissiveTexture=e;}m.emissiveColor=B.Color3.FromHexString(hex).scale(low?.09:.11);own.push(m);return mats[key]=m;};
  const glow=(key,hex,k=1)=>{const id='glow-'+key;if(mats[id])return mats[id];const m=new B.StandardMaterial('gate-'+id,scene);m.diffuseColor=B.Color3.Black();m.specularColor=B.Color3.Black();m.emissiveColor=B.Color3.FromHexString(hex).scale(k);m.disableLighting=true;own.push(m);return mats[id]=m;};
  const picture=(key,t,{alpha=false,add=false,level=1}={})=>{const m=new B.StandardMaterial('gate-'+key,scene);m.diffuseColor=B.Color3.Black();m.specularColor=B.Color3.Black();m.emissiveTexture=t;t.level=level;m.disableLighting=true;m.backFaceCulling=false;
   if(alpha){m.opacityTexture=t;t.hasAlpha=true;}if(add){m.alphaMode=B.Engine.ALPHA_ADD;m.alpha=.99;m.disableDepthWrite=true;}own.push(m);return m;};
  // Surfaces: poured concrete gone dark with rain, plate steel with leak streaks, painted steel frames, ribbed shutter steel, rubber floor, hazard paint.
  const concrete=pbr('concrete','#8a8f96',{rough:.86,metal:.02,color:'concrete-old-color',normal:'concrete-old-normal',scale:.28}),
   mold=pbr('concrete-mold','#7b838a',{rough:.9,metal:.02,color:'concrete-mold-color',normal:'concrete-mold-normal',scale:.25}),
   plate=pbr('plate','#7c838c',{rough:.48,metal:.75,color:'metal-leaks-color',normal:'metal-leaks-normal',scale:.4}),
   frame=pbr('frame','#16181c',{rough:.5,metal:.8}),dark=pbr('dark','#0b0c0f',{rough:.6,metal:.6}),rail=pbr('rail','#2c3138',{rough:.4,metal:.9}),
   floorM=pbr('floor','#565b63',{rough:.42,metal:.55,color:'road-cracked-color',normal:'road-cracked-normal',scale:.5});
  const slatT=tex('slats',64,256,(g,W,H)=>{g.fillStyle='#2a2e35';g.fillRect(0,0,W,H);for(let y=0;y<H;y+=16){const gr=g.createLinearGradient(0,y,0,y+16);gr.addColorStop(0,'#4a505a');gr.addColorStop(.45,'#2d3138');gr.addColorStop(1,'#15171b');g.fillStyle=gr;g.fillRect(0,y,W,16);}
   let s=91;const r=()=>((s=s*16807%2147483647)-1)/2147483646;for(let i=0;i<70;i++){g.fillStyle='rgba('+(r()<.5?'110,70,40':'10,10,12')+','+(.08+r()*.2)+')';g.fillRect(r()*W,r()*H,2+r()*5,6+r()*50);}
   g.fillStyle='#17140a';g.fillRect(0,0,W,18);g.fillStyle='#c79418';for(let x=-18;x<W+18;x+=22){g.beginPath();g.moveTo(x,18);g.lineTo(x+11,18);g.lineTo(x+29,0);g.lineTo(x+18,0);g.fill();}});   // (drawn at the top of the picture: it is laid on upside down, so this is the shutter's foot)
  const shutterM=pbr('shutter','#ffffff',{rough:.5,metal:.7});shutterM.albedoTexture=slatT;shutterM.emissiveTexture=slatT;shutterM.emissiveColor=new B.Color3(.07,.07,.08);
  const leafT=tex('leaf',128,256,(g,W,H)=>{g.fillStyle='#3a4049';g.fillRect(0,0,W,H);let s=23;const r=()=>((s=s*16807%2147483647)-1)/2147483646;for(let i=0;i<160;i++){g.fillStyle='rgba('+(r()<.4?'120,80,50':'12,12,14')+','+(.06+r()*.16)+')';g.fillRect(r()*W,r()*H,1+r()*4,4+r()*40);}
   g.strokeStyle='#22262c';g.lineWidth=5;g.strokeRect(6,6,W-12,H-12);/* the picture is laid on upside down (a box's side faces): the window is drawn low so it sits at head height, the hazard band high so it sits at the foot */g.fillStyle='#0b1a22';g.fillRect(W*.25,H*.6,W*.5,H*.24);g.strokeStyle='#59626e';g.lineWidth=3;g.strokeRect(W*.25,H*.6,W*.5,H*.24);g.fillStyle='rgba(120,200,220,.18)';g.fillRect(W*.29,H*.62,W*.14,H*.2);
   g.save();g.beginPath();g.rect(8,H*.12,W-16,H*.12);g.clip();g.fillStyle='#17140a';g.fillRect(0,0,W,H);g.fillStyle='#c79418';for(let x=-H;x<W+H;x+=30){g.beginPath();g.moveTo(x,H*.24);g.lineTo(x+15,H*.24);g.lineTo(x+15+H*.12,H*.12);g.lineTo(x+H*.12,H*.12);g.fill();}g.restore();});
  const leafM=pbr('leaf','#ffffff',{rough:.5,metal:.7});leafM.albedoTexture=leafT;leafM.emissiveTexture=leafT;leafM.emissiveColor=new B.Color3(.08,.08,.09);
  const hazardT=tex('hazard',128,128,(g,W,H)=>{g.fillStyle='#17140a';g.fillRect(0,0,W,H);g.fillStyle='#c79418';for(let x=-H;x<W+H;x+=42){g.beginPath();g.moveTo(x,H);g.lineTo(x+21,H);g.lineTo(x+21+H,0);g.lineTo(x+H,0);g.fill();}
   let s=17;const r=()=>((s=s*16807%2147483647)-1)/2147483646;for(let i=0;i<260;i++){g.fillStyle='rgba(8,8,8,'+(.2+r()*.5)+')';g.fillRect(r()*W,r()*H,1+r()*7,1+r()*3);}});
  hazardT.wrapU=hazardT.wrapV=B.Texture.WRAP_ADDRESSMODE;
  const hazard=pbr('hazard','#ffffff',{rough:.7,metal:.2});hazard.albedoTexture=hazardT;
  const red=glow('red','#ff3030',1),green=glow('green','#3dffa8',.95),amber=glow('amber','#ffb347',.9),cold=glow('cold','#cfe2ff',1.05),warm=glow('warm','#ffcf9a',.8),dimRed=glow('dim-red','#ff3030',.35);
  // The beams: a soft bright line across a clear plane, added to the picture.
  // (Added to the picture, so black is "nothing": these are drawn on black, not on clear.)
  const beamT=tex('beam',64,256,(g,W,H)=>{g.fillStyle='#000';g.fillRect(0,0,W,H);const gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,'rgba(70,255,190,0)');gr.addColorStop(.42,'rgba(70,255,190,.10)');gr.addColorStop(.5,'rgba(190,255,235,1)');gr.addColorStop(.58,'rgba(70,255,190,.10)');gr.addColorStop(1,'rgba(70,255,190,0)');g.fillStyle=gr;g.fillRect(0,0,W,H);});
  const beamM=picture('beam',beamT,{add:true});
  const curtainT=tex('curtain',128,128,(g,W,H)=>{g.fillStyle='#000';g.fillRect(0,0,W,H);g.fillStyle='rgba(70,255,190,.045)';g.fillRect(0,0,W,H);});
  const curtainM=picture('curtain',curtainT,{add:true});
  const signMat=(key,lines,{w=512,h=128,color='#e9f1f5',sub='#ffb347',bg='#07090c',edge='#3a4250'}={})=>{if(mats['sign:'+key])return mats['sign:'+key];const t=tex('sign-'+key,w,h,(g,W,H)=>{g.fillStyle=bg;g.fillRect(0,0,W,H);g.strokeStyle=edge;g.lineWidth=Math.max(3,H*.04);g.strokeRect(4,4,W-8,H-8);
    const n=lines.length;lines.forEach((text,i)=>{const big=i===0,size=Math.min(H/n*(big?.7:.5),W/(Math.max(5,text.length)*.64));g.font='bold '+size+'px Consolas,"Courier New",monospace';g.textAlign='center';g.textBaseline='middle';g.fillStyle=big?color:sub;g.fillText(text,W/2,H*(i+.5)/n+2);});
    let s=key.length*37+5;const r=()=>((s=s*16807%2147483647)-1)/2147483646;for(let i=0;i<120;i++){g.fillStyle='rgba(0,0,0,'+(.15+r()*.4)+')';g.fillRect(r()*W,r()*H,1+r()*12,1+r()*2);}});return mats['sign:'+key]=picture('sign-'+key,t,{level:low?1.25:2});};   /* Medium and up grade the picture darker: the boards are driven harder there so they read the same */

  /* One gate, built in its own frame: local z runs along the direction of travel (from the gate's `lo` end to its `hi` end), local x across it. */
  function gateFrame(g){const s=Q.span(g),mid=(s.u0+s.u1)/2,vc=(s.v0+s.v1)/2,sv=g.axis==='z'?1:-1,n=new B.TransformNode('gate-'+g.id,scene);n.parent=parent;
   const [wx,wz]=Q.world(g,mid,vc);n.position.set(wx,0,wz);n.rotation.y=g.axis==='z'?0:Math.PI/2;nodes.push(n);
   const L=(u,v)=>[sv*(v-vc),u-mid];
   const put=(mesh,m,x,y,z,stat=true)=>{mesh.material=m;mesh.parent=n;mesh.position.set(x,y,z);mesh.isPickable=false;mesh.receiveShadows=false;if(stat){if(!merge.has(m))merge.set(m,[]);merge.get(m).push(mesh);}return mesh;};
   // box: a = across (v), y, b = along (u); sizes [across, height, along]
   const box=(name,[sa,sy,sb],[v,y,u],m,stat=true,more=null)=>{const [x,z]=L(u,v);return put(B.MeshBuilder.CreateBox('gate-'+name,{width:sa,height:sy,depth:sb,...(more||{})},scene),m,x,y,z,stat);};
   const cyl=(name,r,h,[v,y,u],m,stat=true,t=10)=>{const [x,z]=L(u,v);return put(B.MeshBuilder.CreateCylinder('gate-'+name,{diameter:r*2,height:h,tessellation:t},scene),m,x,y,z,stat);};
   // a plane across the lane whose front looks along -u (dir -1) or +u (dir 1)
   const face=(name,w,h,[v,y,u],m,dir,stat=true)=>{const [x,z]=L(u,v),p=put(B.MeshBuilder.CreatePlane('gate-'+name,{width:w,height:h},scene),m,x,y,z,stat);p.rotation.y=dir<0?0:Math.PI;return p;};
   const flat=(name,w,d,[v,y,u],m,stat=true)=>{const [x,z]=L(u,v);return put(B.MeshBuilder.CreateGround('gate-'+name,{width:w,height:d},scene),m,x,y,z,stat);};
   return {s,mid,vc,sv,n,L,box,cyl,face,flat};}

  const doorList=[],scanners=new Map(),statusLights=[];
  function buildGate(g){
   const F=gateFrame(g),{s,mid,box,cyl,face,flat}=F,W=s.v1-s.v0,D=s.u1-s.u0,vc=F.vc,H=g.height||TALL[g.id]||Q.WALL_H;
   const lanes=Q.lanesOf(g.id),spans=g.shut?[]:g.lanes.slice().sort((a,b)=>a.v[0]-b.v[0]);   // a shut gate is one wall (its lanes are only defined, for when it opens)
   // A gate shows a face to each side this quarter can stand on: one for a gate at the quarter's edge, both for a checkpoint inside the quarter.
   const sides=Q.sidesOf(g,quarter);let first=true;
   for(const l of lanes){const [a,b]=g.lanes.find(x=>x.id===l.id).v,top=l.kind==='foot'?3.05:3.8;buildDoors(F,g,l,a,b,top);buildScanner(F,g,l,a,b,top);}
   for(const side of sides){const out=side==='lo'?-1:1,uFace=side==='lo'?s.u0:s.u1;
   const fo=d=>uFace+out*d;   // a distance d out in front of this face
   // ---- the mass: solid between the lanes, a deep lintel over each lane, the storeys above ----
   let v=s.v0;const cores=[];for(const l of spans){if(l.v[0]-v>.02)cores.push([v,l.v[0]]);v=l.v[1];}if(s.v1-v>.02)cores.push([v,s.v1]);
   cores.forEach(([a,b],i)=>{if(first)box('core',[b-a,H,D],[(a+b)/2,H/2,mid],i%2?mold:concrete);
    // a steel base course and a band of plate at head height on the face
    box('base-course',[b-a+.06,.5,.08],[(a+b)/2,.25,fo(.04)],dark);box('face-band',[b-a,.18,.06],[(a+b)/2,3.75,fo(.03)],rail);
    if(b-a>1.1){box('pilaster',[.34,H,.28],[a+.17,H/2,fo(.14)],concrete);box('pilaster',[.34,H,.28],[b-.17,H/2,fo(.14)],concrete);}});
   for(const l of lanes){const [a,b]=g.lanes.find(x=>x.id===l.id).v,foot=l.kind==='foot',top=foot?3.05:3.8;
    if(first){box('lintel',[b-a,H-top,D],[(a+b)/2,(H+top)/2,mid],concrete);
    // the room: floor, wall plates with ribs, a ceiling tray with two light strips and a conduit, threshold paint
    flat('lane-floor',b-a,D,[(a+b)/2,.035,mid],floorM,true);
    for(const sd of [-1,1]){const wv=sd<0?a:b;box('lane-plate',[.06,2.1,D-.9],[wv-sd*.03,1.15,mid],plate);box('lane-kick',[.1,.22,D-.9],[wv-sd*.05,.11,mid],dark);
     for(let u=s.u0+1.1;u<s.u1-.9;u+=1.25)box('lane-rib',[.1,top-.1,.12],[wv-sd*.05,(top-.1)/2,u],frame);
     box('lane-conduit',[.07,.07,D-.8],[wv-sd*.12,top-.28,mid],rail);}
    box('lane-tray',[b-a-.5,.08,D-1.2],[(a+b)/2,top-.05,mid],dark);
    for(const u of [mid-D*.22,mid+D*.22])box('lane-lamp',[Math.min(1.6,b-a-1),.04,.34],[(a+b)/2,top-.1,u],cold);
    for(const end of ['lo','hi']){const u=end==='lo'?s.u0+Q.DOOR_T+.75:s.u1-Q.DOOR_T-.75;flat('lane-threshold',b-a-.3,.34,[(a+b)/2,.04,u],hazard,true);}
    }
    // ---- this quarter's face of the lane: a steel portal, a status bar, the lane's own small sign ----
    const dr=l.doors[side],half=dr.half,c=(a+b)/2,dh=dr.height;
    for(const sd of [-1,1])box('portal-jamb',[.26,dh+.3,.42],[c+sd*(half+.13),(dh+.3)/2,fo(.1)],frame);
    box('portal-head',[half*2+.8,.34,.46],[c,dh+.32,fo(.1)],frame);
    const st=box('status',[half*1.5,.07,.06],[c,dh+.6,fo(.3)],red,false);statusLights.push({mesh:st,door:dr.id});
    face('lane-sign',foot?1.5:1.9,.36,[c,dh+1.0,fo(.06)],signMat(foot?'ped':'veh',[foot?'PEDESTRIANS':'VEHICLES'],{w:384,h:96,color:foot?'#bfe9ff':'#ffcf7a'}),out);
    if(!foot){for(const sd of [-1,1]){box('hazard-post',[.3,1.2,.3],[c+sd*(half+.36),.6,fo(.52)],hazard);cyl('bollard',.13,1,[c+sd*(half+.75),.5,fo(1.5)],dark);box('bollard-cap',[.2,.05,.2],[c+sd*(half+.75),1.02,fo(1.5)],amber);}}
    flat('door-pool',half*2+2.6,3.2,[c,.045,fo(1.7)],washMat(foot?'#9fc8e8':'#e0a050',.34));
   }
   // ---- this quarter's face of the gatehouse: the name, lamps, a booth window, cameras, pipes ----
   const name=signMat('name-'+g.id,g.shut?[g.sign,'CLOSED']:[g.sign,'CHECKPOINT'],{w:768,h:g.shut?256:224,sub:g.shut?'#ff5a4a':'#ffb347'}),sw=Math.min(W-1.2,g.shut?7.5:6.4),sh=sw*(g.shut?.33:.29),sy=g.shut?7.1:Math.min(H-sh/2-.5,5.55);
   // the name board stands proud of the pilasters on two brackets, lit from above by two lamps on arms
   box('name-back',[sw+.36,sh+.36,.14],[vc,sy,fo(.4)],frame);face('name',sw,sh,[vc,sy,fo(.48)],name,out);for(const sd of [-1,1])box('name-bracket',[.12,.12,.36],[vc+sd*(sw/2-.4),sy,fo(.2)],rail);
   for(const sd of [-1,1]){box('name-lamp-arm',[.06,.06,.9],[vc+sd*sw*.3,sy+sh/2+.42,fo(.6)],rail);box('name-lamp',[.5,.1,.2],[vc+sd*sw*.3,sy+sh/2+.36,fo(1.05)],cold);}
   face('name-wash',sw+3,Math.max(sh+1,2*(sy+.3-3.95)),[vc,sy+.3,fo(.5)],washMat('#b8d4ee',low?.34:.5),out);   /* kept above the doorways: light on wall, never a sheet across an opening */
   // sodium floods low on the wall either side: the warm light a working gate stands in
   if(!g.shut){const ops=lanes.map(l=>{const d=l.doors[side],v=g.axis==='z'?d.x:d.z;return [v-d.half-.3,v+d.half+.3];}).sort((p,q)=>p[0]-q[0]);let v=s.v0;const solid=[];for(const [a,b] of ops){solid.push([v,a]);v=b;}solid.push([v,s.v1]);
    for(const [a,b] of solid)if(b-a>=1.5){const fx=(a+b)/2,fw=Math.min(4.2,b-a);box('flood',[.34,.14,.26],[fx,4.35,fo(.3)],amber);face('flood-wash',fw,5.2,[fx,2.4,fo(.07)],washMat('#e09a4a',low?.3:.42),out);flat('flood-pool',fw+.6,3.6,[fx,.046,fo(1.9)],washMat('#e09a4a',low?.22:.3));}}
   // booth windows in the wider cores: warm light behind blinds, a sill, a steel hood
   const blinds=mats.blinds||(mats.blinds=picture('blinds',tex('blinds',128,96,(gx,Wd,Hd)=>{gx.fillStyle='#0c0a08';gx.fillRect(0,0,Wd,Hd);for(let y=4;y<Hd;y+=7){gx.fillStyle='rgba(255,196,120,'+(.55+((y*7)%5)*.06)+')';gx.fillRect(4,y,Wd-8,3.4);}gx.fillStyle='rgba(8,8,10,.86)';gx.fillRect(Wd*.52,Hd*.3,Wd*.2,Hd*.7);gx.beginPath();gx.arc(Wd*.62,Hd*.3,Wd*.085,0,7);gx.fill();}),{level:.75}));
   for(const [a,b] of cores)if(b-a>=2.2&&!g.shut){const c=(a+b)/2,ww=Math.min(1.9,b-a-.8);box('booth-frame',[ww+.24,1.34,.14],[c,1.95,fo(.07)],frame);face('booth-window',ww,1.1,[c,1.95,fo(.15)],blinds,out);box('booth-sill',[ww+.4,.07,.3],[c,1.3,fo(.15)],rail);box('booth-hood',[ww+.5,.06,.44],[c,2.7,fo(.22)],dark);}
   // cameras on arms watching each lane, a red eye on each
   for(const l of lanes){const [a,b]=g.lanes.find(x=>x.id===l.id).v,c=(a+b)/2;box('cam-arm',[.05,.05,.7],[c+.9,l.doors[side].height+1.45,fo(.35)],rail);box('cam-body',[.2,.17,.4],[c+.9,l.doors[side].height+1.38,fo(.72)],dark);box('cam-eye',[.05,.05,.03],[c+.9,l.doors[side].height+1.38,fo(.93)],red);}
   // downpipes and a cable tray up the face
   cores.forEach(([a,b],i)=>{if(b-a<.5)return;cyl('downpipe',.07,H-.2,[a+(b-a)*.75,H/2,fo(.1)],rail);if(i%2===0)box('tray',[.3,.05,.05],[a+(b-a)*.3,4.6,fo(.06)],rail);});
   // parapet, roof plant, a mast
   box('parapet',[W,.5,.22],[vc,H+.25,fo(-.11)],concrete);box('parapet-rail',[W,.05,.05],[vc,H+.62,fo(-.1)],rail);
   if(g.id==='customs'){   // an upper storey over the passage: a strip of lit windows, corrugated cladding, an antenna
    if(first)box('upper',[W,4.4,D],[vc,H+2.2,mid],mold);box('upper-band',[W,.24,.1],[vc,H+.14,fo(.05)],rail);
    for(let k=0;k<3;k++)face('upper-window',1.5,1.0,[s.v0+1.15+k*2.1,H+2.2,fo(.04)],blinds,out);
    if(first){box('upper-roof',[W+.2,.2,D+.2],[vc,H+4.5,mid],dark);cyl('mast',.05,3.4,[s.v0+1,H+6.2,mid],rail);box('mast-tip',[.08,.08,.08],[s.v0+1,H+7.95,mid],red);}}
   if(g.bridge){   // the building bridged across Main Street over the gate: floors of flats, a transfer beam on brackets, service gear underneath
    const top=25,fac=bridgeMat();if(first)box('bridge',[W+.8,top-H,D+2.4],[vc,(top+H)/2,mid],fac);box('transfer-beam',[W+.9,.7,.5],[vc,H+.35,fo(1.2)],frame);
    for(let x=s.v0+1.5;x<s.v1;x+=3.4){box('bracket',[.3,1.1,1.2],[x,H-.55,fo(.6)],frame);box('bracket-light',[.18,.05,.5],[x,H-1.12,fo(.6)],amber);}
    if(first){box('bridge-roof',[W+1.2,.3,D+2.8],[vc,top+.15,mid],dark);for(const x of [s.v0+3,s.v1-4]){box('roof-unit',[2,1.2,1.6],[x,top+.9,mid],rail);}cyl('mast',.06,5,[vc+4,top+2.8,mid],rail);box('mast-tip',[.1,.1,.1],[vc+4,top+5.35,mid],red);}
    box('bridge-pipe',[W+.4,.16,.16],[vc,H+1.0,fo(1.28)],rail);}
   if((g.fortified||TALL[g.id])&&!g.shut){   // a fortified portal: two pylons, a deep cap beam, slit lights, beacons
    const py=Q.pylons(g);   // never over a lane's opening (ncz-quarters.js pylons)
    for(const [a,b] of py){const pc=(a+b)/2;if(first){box('pylon',[b-a,H+3,D+.6],[pc,(H+3)/2,mid],concrete);box('beacon',[.22,.22,.22],[pc,H+3.15,mid],red);}box('pylon-slit',[.12,4.2,.06],[pc,H-3,fo(.34)],dimRed);}
    if(first)box('cap-beam',[W,1.4,D+.9],[vc,H-.2,mid],dark);for(let x=s.v0+2.6;x<s.v1-2;x+=2.4)box('cap-rib',[.25,2.6,.3],[x,H-2.2,fo(.15)],frame);
    box('upper-plate',[W-3.4,2.2,.1],[vc,9.6,fo(.05)],plate);for(let x=s.v0+3;x<s.v1-2.6;x+=1.6)box('slit',[.5,.07,.05],[x,11.4,fo(.06)],cold);}
   if(g.shut)buildShut(F,g,H,out,fo);
   buildGuards(F,g,side,out,fo,lanes);first=false;}
   // one real lamp inside the gatehouse on the better settings (the strips are pictures of light, not light)
   if(!low&&!g.shut&&lanes.length){const l=lanes.find(x=>x.kind==='foot')||lanes[0],p=new B.PointLight('gate-light-'+g.id,new B.Vector3(l.mid[0],2.5,l.mid[1]),scene);p.diffuse=new B.Color3(.8,.9,1);p.specular=new B.Color3(.3,.35,.4);p.intensity=high?9:7;p.range=8.5;p.parent=parent;lights.push(p);}
  }
  // Additive light on a wall or the wet ground (the same trick the street uses instead of many real lamps).
  const washes={};function washMat(hex,k){const key=hex+k;if(washes[key])return washes[key];const t=tex('wash-'+key,128,128,(g,W,H)=>{g.fillStyle='#000';g.fillRect(0,0,W,H);const r=g.createRadialGradient(W/2,H/2,3,W/2,H/2,W/2);r.addColorStop(0,hex);r.addColorStop(1,'#000');g.fillStyle=r;g.fillRect(0,0,W,H);});
   const m=new B.StandardMaterial('gate-wash',scene);m.diffuseColor=B.Color3.Black();m.specularColor=B.Color3.Black();m.emissiveTexture=t;t.level=low?k:k*1.6;m.disableLighting=true;m.alphaMode=B.Engine.ALPHA_ADD;m.alpha=.99;m.disableDepthWrite=true;m.backFaceCulling=false;own.push(m);return washes[key]=m;}
  let bridgeM=null;function bridgeMat(){if(bridgeM)return bridgeM;const m=new B.StandardMaterial('gate-bridge',scene);const c=file('facade-apartment-color'),e=file('facade-apartment-glow');for(const t of [c,e]){t.uScale=.55;t.vScale=.34;}m.diffuseTexture=c;m.diffuseColor=new B.Color3(.34,.36,.4);m.emissiveTexture=e;e.level=.8;m.specularColor=new B.Color3(.05,.05,.06);own.push(m);return bridgeM=m;}

  // ---- doors: a pair of sliding steel leaves for walkers, a roll shutter for cabs; one at each end of every lane ----
  // A box lays a picture the other way up on its two broad faces; the far one is turned over so the painted band is at the foot on both sides.
  const PAINTED={faceUV:[new B.Vector4(0,0,1,1),new B.Vector4(0,1,1,0),new B.Vector4(0,0,1,1),new B.Vector4(0,0,1,1),new B.Vector4(0,0,1,1),new B.Vector4(0,0,1,1)]};
  function buildDoors(F,g,l,a,b,top){const {box}=F,c=(a+b)/2;
   for(const end of ['lo','hi']){const d=l.doors[end],u=g.axis==='z'?d.z:d.x,foot=l.kind==='foot',can=Q.openable(l,end,quarter);
    // the wall round the doorway inside the lane
    if((b-a)/2-d.half>.02)for(const sd of [-1,1])box('door-cheek',[(b-a)/2-d.half,top,Q.DOOR_T],[c+sd*((b-a)/2+d.half)/2,top/2,u],frame);
    if(top-d.height>.02)box('door-head',[d.half*2,top-d.height,Q.DOOR_T],[c,(top+d.height)/2,u],frame);
    const rec={id:d.id,gate:g.id,lane:l.key,rect:l.rect,end,can,foot,open:0,kick:0,hold:false,x:d.x,z:d.z,half:d.half,height:d.height,axis:d.axis,parts:[]};
    // One mesh per leaf: the hazard band and the window are painted on. A door that cannot open in this quarter never moves, so it joins the merged mesh.
    if(foot){for(const sd of [-1,1]){const leaf=box('leaf',[d.half,d.height,.12],[c+sd*d.half/2,d.height/2,u],leafM,!can,PAINTED);leaf.name=d.id+(sd<0?'-left':'-right');rec.parts.push({mesh:leaf,sd,home:leaf.position.x});}}
    else{const sh=box('shutter',[d.half*2,d.height,.14],[c,d.height/2,u],shutterM,!can,PAINTED);sh.name=d.id+'-shutter';rec.parts.push({mesh:sh,shutter:true,home:d.height/2});}
    if(!can)rec.parts.length=0;
    doorList.push(rec);}}
  // ---- the scanner in the middle of each lane: a slim arch with emitter strips, and the beams that sweep while a scan runs ----
  function buildScanner(F,g,l,a,b,top){const {box,face,flat,s,mid}=F,c=(a+b)/2,foot=l.kind==='foot',w=b-a,h=top-.25;
   for(const sd of [-1,1]){box('scan-post',[.16,h,.3],[c+sd*(w/2-.14),h/2,mid],frame);box('scan-emitter',[.03,h-.5,.08],[c+sd*(w/2-.235),h/2,mid],glow('scan-dim','#46ffbe',.32));}
   box('scan-head',[w-.1,.16,.3],[c,h+.02,mid],frame);box('scan-head-light',[w-.9,.03,.08],[c,h-.07,mid],glow('scan-dim','#46ffbe',.32));
   face('scan-label',.62,.2,[c-(w/2-.5)*F.sv*0+0,h+.02,mid-.155],signMat('scan',['SCAN'],{w:192,h:64,color:'#8dffd6',edge:'#1f4a3c'}),-1);face('scan-label',.62,.2,[c,h+.02,mid+.155],signMat('scan',['SCAN'],{w:192,h:64,color:'#8dffd6',edge:'#1f4a3c'}),1);
   const reach=(s.u1-s.u0)/2-.9,beams=[];
   // rings that travel the length of the room (a plane across the lane with a bright line down it), and for walkers a bar that rises and falls
   // A ring is a line of light drawn on the room itself: across the floor, up both walls and over the ceiling, travelling the length of the room. A thin sheet
   // of faint light hangs between them, so the line is seen crossing whoever stands there.
   const lineM=glow('scan-line','#9dffdc',1.5),softM=glow('scan-soft','#46ffbe',.6),glowLayer=scene.effectLayers?.find(l=>l.name==='void-glow');
   const ring=k=>{const p=face('scan-ring',w-.24,h-.06,[c,(h-.06)/2+.04,mid],curtainM,-1,false);p.setEnabled(false);glowLayer?.addExcludedMesh(p);   /* the faint sheet is kept out of the glow pass, or it would wash the whole room green */
    const part=(sx,sy,x,y,m,sz=.035)=>{const q=B.MeshBuilder.CreateBox('gate-scan-line',{width:sx,height:sy,depth:sz},scene);q.material=m;q.parent=p;q.position.set(x,y,0);q.isPickable=false;return q;};
    const hw=(w-.24)/2,hh=(h-.06)/2;part(w-.24,.05,0,-hh+.02,lineM,.05);part(w-.24,.05,0,hh-.02,lineM,.05);part(.05,h-.06,-hw+.02,0,lineM,.05);part(.05,h-.06,hw-.02,0,lineM,.05);
    part(w-.24,.012,0,-hh+.02,softM,.3);part(.012,h-.06,-hw+.02,0,softM,.3);part(.012,h-.06,hw-.02,0,softM,.3);
    const floorLine=flat('scan-floor',w-.4,.9,[c,.062,mid],beamM,false);floorLine.setEnabled(false);glowLayer?.addExcludedMesh(floorLine);beams.push({ring:p,floorLine,phase:k,reach,mid:p.position.z,fmid:floorLine.position.z});};
   ring(0);if(!foot||!low)ring(Math.PI);
   // for walkers, a level line that rises and falls on both walls
   let bar=null;if(foot){bar=new B.TransformNode('gate-scan-bar',scene);bar.parent=F.n;const [bx,bz]=F.L(mid,c);bar.position.set(bx,1.4,bz);for(const sd of [-1,1]){const q=B.MeshBuilder.CreateBox('gate-scan-level',{width:.03,height:.03,depth:2.6},scene);q.material=lineM;q.parent=bar;q.position.x=sd*(w/2-.075);q.isPickable=false;}bar.setEnabled(false);nodes.push(bar);}
   else{// a cab is long: side fans that sweep along it
    for(const sd of [-1,1]){const p=F.box('scan-side',[.03,.03,1.6],[c+sd*(w/2-.09),.75,mid],lineM,false);p.setEnabled(false);beams.push({side:p,phase:sd<0?0:Math.PI/2,reach:reach*.8,mid:p.position.z});}}
   scanners.set(l.key,{beams,bar,h,on:false,level:0,t:0});}
  // ---- a gate that does not open: a wide roll shutter in a concrete wall, barriers, a red lamp ----
  function buildShut(F,g,H,out,fo){const {box,cyl,flat,s,mid,vc}=F,W=s.v1-s.v0;
   box('shut-wall',[W,H,s.u1-s.u0],[vc,H/2,mid],concrete);for(const sd of [-1,1]){box('shut-pier',[1.6,H+1.2,2.2],[sd<0?s.v0+.8:s.v1-.8,(H+1.2)/2,mid],mold);box('beacon',[.2,.2,.2],[sd<0?s.v0+.8:s.v1-.8,H+1.32,mid],red);}
   const sw=W-5.4;box('shut-frame-head',[sw+.9,.6,.5],[vc,4.6,fo(.2)],frame);for(const sd of [-1,1])box('shut-frame-jamb',[.4,4.4,.5],[vc+sd*(sw/2+.2),2.2,fo(.2)],frame);
   box('shut-shutter',[sw,4.3,.16],[vc,2.15,fo(.12)],shutterM,true,PAINTED);box('shut-foot',[sw,.3,.2],[vc,.15,fo(.14)],hazard);
   // a chain across the shutter, a lock box, concrete barriers, cones of red light
   box('shut-bar',[sw+.2,.12,.1],[vc,1.25,fo(.26)],rail);box('shut-lock',[.5,.42,.2],[vc,1.25,fo(.32)],dark);box('shut-lock-led',[.08,.08,.03],[vc+.12,1.34,fo(.43)],red);
   for(let x=s.v0+3.6;x<s.v1-3;x+=3.2){box('barrier',[2.6,.9,.6],[x,.45,fo(2.3)],concrete);box('barrier-stripe',[2.6,.16,.62],[x,.72,fo(2.3)],hazard);}
   for(const sd of [-1,1]){cyl('shut-lamp-post',.06,3.2,[vc+sd*(sw/2+1.1),1.6,fo(.5)],rail);box('shut-lamp',[.3,.16,.3],[vc+sd*(sw/2+1.1),3.25,fo(.5)],red);if(!low){const p=flat('shut-pool',5,4,[vc+sd*(sw/2+1.1),.045,fo(1.8)],washMat('#ff4030',.3));void p;}}
   box('upper-plate',[W-4,2.4,.1],[vc,8.6,fo(.05)],plate);for(let x=s.v0+3;x<s.v1-2.6;x+=1.6)box('slit',[.5,.07,.05],[x,10.6,fo(.06)],dimRed);
  }
  // ---- the people at the gate ----
  function buildGuards(F,g,side,out,fo,lanes){if(g.shut||!g.guard)return;const s=F.s;
   const spots=[];const facing=g.axis==='z'?(out>0?0:Math.PI):(out>0?Math.PI/2:-Math.PI/2);
   const at=(v,d)=>{const [x,z]=Q.world(g,fo(d),v);return [x,z];};
   // Guards stand in front of solid wall beside a doorway, never in an opening or a cab's way: the stretches of wall between the doorways (and the gate's ends).
   const vOf=d=>g.axis==='z'?d.x:d.z,opens=lanes.map(l=>{const d=l.doors[side];return {l,a:vOf(d)-d.half,b:vOf(d)+d.half};}).sort((p,q)=>p.a-q.a),walls=[];
   {let v=s.v0;for(const o of opens){walls.push([v,o.a]);v=o.b;}walls.push([v,s.v1]);}
   const wide=walls.filter(([a,b])=>b-a>=.8),used=new Set();
   // beside a doorway: the wall touching it (the one nearer the gate's own end, so the guard is on the pavement, not in the road), .55 m from the doorway's edge
   const stand=(w,o)=>Math.abs(w[1]-o.a)<.01?w[1]-Math.min(.55,(w[1]-w[0])/2):w[0]+Math.min(.55,(w[1]-w[0])/2),edge=v=>Math.min(v-s.v0,s.v1-v);
   const beside=o=>{const cand=wide.filter(w=>!used.has(w)&&(Math.abs(w[1]-o.a)<.01||Math.abs(w[0]-o.b)<.01)).sort((p,q)=>edge(stand(p,o))-edge(stand(q,o)))[0];if(!cand)return null;used.add(cand);return at(stand(cand,o),.8);};
   const fo_=opens.find(o=>o.l.kind==='foot'),ba=opens.find(o=>o.l.kind==='bay');
   if(fo_){const p=beside(fo_);if(p)spots.push(p);}
   if(ba&&(!low||!spots.length)){const p=beside(ba);if(p)spots.push(p);}
   spots.forEach(([x,z],i)=>guards.push({gate:g.id,kind:g.guard,x,z,yaw:facing+(i?-.35:.3),node:null,tried:0,i}));}
  const UNIFORM=new B.Color3(.2,.24,.34),LOOKS=['fixer-01','communion-tech','runner-02','ncz-neon'];
  function spawnGuard(p){
   if(p.kind==='function'){const A=root.VoidCorporateActors;if(!A?.buildRobot){p.tried=99;return;}const r=A.buildRobot({B,scene,parent,own,id:'gate-'+p.gate+'-'+p.i,x:p.x,z:p.z,yaw:p.yaw});p.node=r.root||r;p.robot=r;p.node.metadata={...(p.node.metadata||{}),gateGuard:p.gate,standIn:'corporate security robot (silent)'};return;}
   if(typeof instance!=='function')return;let node=null,look=null;for(let k=0;k<LOOKS.length&&!node;k++){look=LOOKS[(p.i+k+p.gate.length)%LOOKS.length];node=instance('crowd:'+look,parent);}if(!node)return;
   node.position.set(p.x,0,p.z);node.rotation.y=p.yaw;node.metadata={...(node.metadata||{}),crowd:look,gateGuard:p.gate,placeholder:'private security: street figure in a uniform tint'};p.node=node;p.anim=root.VoidCrowd?.animate?.(node,look,p.i?'watch':'idle')||null;if(p.anim&&!p.anim.has?.(p.i?'watch':'idle'))p.anim.play?.('idle');
   // the uniform: every piece of clothing takes one dark blue-grey; skin, hair and eyes are left alone
   for(const m of node.getChildMeshes()){const mat=m.material,n=((m.name||'')+' '+(mat?.name||'')).toLowerCase();if(!mat||/\.body( |$)|eyebrow|eyelash|low-poly|short\d|long\d|bob\d|braid\d|ponytail\d|afro\d|hair|teeth|tongue|street-gear/.test(n))continue;const c=mat.clone(mat.name+'-uniform');if(!c)continue;own.push(c);
     if(c.albedoColor)c.albedoColor=UNIFORM.clone();else if(c.diffuseColor)c.diffuseColor=UNIFORM.clone();if(c.emissiveTexture)c.emissiveTexture=null;if(c.emissiveColor)c.emissiveColor=B.Color3.Black();m.material=c;}}

  for(const g of Q.gatesOf(quarter))buildGate(g);
  // ---- kerbside taxi stops in this quarter: a painted bay on the road and a post with a lit TAXI plate ----
  {const paint=picture('stop-paint',tex('stop-paint',256,512,(g,W,H)=>{g.clearRect(0,0,W,H);g.strokeStyle='rgba(226,170,60,.8)';g.lineWidth=10;g.setLineDash([34,20]);g.strokeRect(12,12,W-24,H-24);g.setLineDash([]);g.save();g.translate(W/2,H/2);g.rotate(-Math.PI/2);g.fillStyle='rgba(226,170,60,.82)';g.font='bold 110px Consolas,monospace';g.textAlign='center';g.textBaseline='middle';g.fillText('TAXI',0,6);g.restore();}),{alpha:true,level:.5}),plateM=signMat('taxi',['TAXI'],{w:192,h:96,color:'#ffcf7a',edge:'#6a4a14'});
   for(const st of Q.STOPS.filter(x=>x.quarter===quarter)){const g=B.MeshBuilder.CreateGround('gate-taxi-stop',{width:2.6,height:5.6},scene);g.material=paint;g.parent=parent;g.position.set(st.position[0],.045,st.position[1]);g.rotation.y=st.heading||0;g.isPickable=false;nodes.push(g);}
   // the posts: one at every stop and one by the District's door. A lit TAXI plate both ways, an amber lamp on top and a lit call panel at hand height (CALL A TAXI: road-taxi.js).
   for(const cp of Q.CALL_POINTS.filter(x=>x.quarter===quarter)){
    const post=cp.post;if(post){const n=new B.TransformNode('gate-taxi-post',scene);n.parent=parent;n.position.set(post[0],0,post[1]);n.rotation.y=post[2];nodes.push(n);
     const pole=B.MeshBuilder.CreateCylinder('gate-taxi-pole',{diameter:.09,height:2.9,tessellation:8},scene);pole.material=rail;pole.parent=n;pole.position.y=1.45;pole.isPickable=false;
     for(const sgn of [-1,1]){const pl=B.MeshBuilder.CreatePlane('gate-taxi-plate',{width:.9,height:.45},scene);pl.material=plateM;pl.parent=n;pl.position.set(0,2.75,sgn*.03);pl.rotation.y=sgn<0?0:Math.PI;pl.isPickable=false;}
     const back=B.MeshBuilder.CreateBox('gate-taxi-back',{width:.98,height:.53,depth:.05},scene);back.material=frame;back.parent=n;back.position.y=2.75;back.isPickable=false;
     const lampP=B.MeshBuilder.CreateBox('gate-taxi-lamp',{width:.22,height:.12,depth:.22},scene);lampP.material=amber;lampP.parent=n;lampP.position.y=3.08;lampP.isPickable=false;
     const panel=B.MeshBuilder.CreateBox('gate-taxi-panel',{width:.26,height:.34,depth:.12},scene);panel.material=frame;panel.parent=n;panel.position.y=1.25;panel.isPickable=false;
     for(const sgn of [-1,1]){const f=B.MeshBuilder.CreatePlane('gate-taxi-panel-face',{width:.2,height:.12},scene);f.material=amber;f.parent=n;f.position.set(0,1.3,sgn*.062);f.rotation.y=sgn<0?0:Math.PI;f.isPickable=false;}}}}
  // merge the fixed pieces by material
  for(const [m,list] of merge){const merged=list.length>1?B.Mesh.MergeMeshes(list,true,true,undefined,false,false):list[0];if(merged){merged.name='gate-static';merged.isPickable=false;if(list.length>1){merged.parent=parent;merged.material=m;}nodes.push(merged);}}
  merge.clear();

  // ---- the doors' controller ----
  const solidOf=d=>(typeof walkingLocation!=='undefined'?walkingLocation?.solids:null)?.find?.(s=>s.id===d.id)||null;
  const me=()=>{try{return typeof walker!=='undefined'&&walker&&typeof mode!=='undefined'&&['walking','road-taxi','preparing'].includes(mode)?walker:null;}catch{return null;}};
  let secured=!!root.VoidGateTransit?.busy;
  const doors={list:doorList,
   tick(dt){const p=me(),riding=typeof mode!=='undefined'&&mode==='road-taxi';
    for(const d of doorList){d.kick=Math.max(0,d.kick-dt);const dx=p?p.x-d.x:99,dz=p?p.z-d.z:99,alongD=d.axis==='x'?Math.abs(dz):Math.abs(dx),acrossD=d.axis==='x'?Math.abs(dx):Math.abs(dz);
     const inDoorway=!!p&&alongD<.55&&acrossD<d.half+.15,near=!!p&&!riding&&d.foot&&alongD<2.5&&acrossD<d.half+1.1;
     // a walker who has strayed into a vehicle bay (its shutter was up for a cab) is let out again: the bay's own door rises for them
     const strayed=!d.foot&&d.can&&!!p&&!riding&&p.x>d.rect[0]&&p.x<d.rect[1]&&p.z>d.rect[2]&&p.z<d.rect[3];
     const want=secured?(d.foot&&d.open>.05&&inDoorway):(d.can&&(near||strayed||d.kick>0||d.hold))||(d.foot&&d.open>.05&&inDoorway);
     if(want&&d.open===0&&d.can)try{root.VoidAudio?.event?.('door');}catch{}
     d.open=Math.max(0,Math.min(1,d.open+(want?1:-1)*dt*(d.foot?1.5:.9)));const e=d.open*d.open*(3-2*d.open);
     for(const part of d.parts){if(part.shutter)part.mesh.position.y=part.home+e*(d.height-.25);else part.mesh.position.x=part.home+part.sd*e*d.half*.96;}
     const s=solidOf(d);if(s)s.open=d.open>=.8;}
    for(const st of statusLights){const d=doorList.find(x=>x.id===st.door),m=!d||!d.can?red:d.open>.5?green:secured?amber:d.foot?green:amber;if(st.mesh.material!==m)st.mesh.material=m;}},
   secure(on){secured=!!on;if(on)for(const d of doorList){d.kick=0;d.hold=false;}},
   closed(){return doorList.every(d=>{const s=solidOf(d);return d.open<=.02&&(!s||!s.open);});},
   openness(){return doorList.reduce((t,d)=>t+d.open,0);},
   release(id,seconds=6){const d=doorList.find(x=>x.id===id);if(d&&d.can){d.kick=seconds;return true;}return false;},
   hold(id,on){const d=doorList.find(x=>x.id===id);if(d&&d.can){d.hold=!!on;return true;}return false;},
   state(){return Object.fromEntries(doorList.map(d=>[d.id,{open:+d.open.toFixed(3),can:d.can}]));},get secured(){return secured;}};
  function scan(key,on){const sc=scanners.get(key);if(!sc)return false;sc.on=!!on;return true;}
  let clock=0,guardCheck=0;
  function tick(dt,time){if(disposed)return;clock+=dt;doors.tick(dt);
   guardCheck-=dt;if(guardCheck<=0){guardCheck=.7;for(const p of guards)if(!p.node&&p.tried<40){p.tried++;try{spawnGuard(p);}catch(e){p.tried=99;console.warn('[gates] guard',e);}}}
   for(const p of guards)p.robot?.tick?.(dt);
   for(const sc of scanners.values()){const to=sc.on?1:0;if(sc.level===to&&!to)continue;sc.level=Math.max(0,Math.min(1,sc.level+(to?1:-1)*dt*3));sc.t+=dt;const vis=sc.level>.01;
    for(const b of sc.beams){if(b.ring){if(b.ring.isEnabled()!==vis){b.ring.setEnabled(vis);b.floorLine.setEnabled(vis);}if(vis){const o=Math.sin(sc.t*1.9+b.phase)*b.reach;b.ring.position.z=b.mid+o;b.floorLine.position.z=b.fmid+o;b.ring.visibility=sc.level;b.floorLine.visibility=sc.level*.6;}}
     else if(b.side){if(b.side.isEnabled()!==vis)b.side.setEnabled(vis);if(vis){b.side.position.z=b.mid+Math.sin(sc.t*2.6+b.phase)*b.reach;b.side.position.y=.75+.55*Math.sin(sc.t*1.7+b.phase);}}}
    if(sc.bar){if(sc.bar.isEnabled()!==vis)sc.bar.setEnabled(vis);if(vis)sc.bar.position.y=sc.h/2+Math.sin(sc.t*2.3)*(sc.h/2-.35);}}}
  return {tick,doors,scan,quarter,guards,scanners,stats:()=>({gates:Q.gatesOf(quarter).map(g=>g.id),doors:doorList.length,guards:guards.filter(p=>p.node).length,lights:lights.length}),
   dispose(){if(disposed)return;disposed=true;for(const p of guards){try{p.anim?.dispose?.();}catch{}try{p.robot?.dispose?p.robot.dispose():p.node?.dispose?.();}catch{}}for(const l of lights)l.dispose();for(const n of nodes)try{n.dispose(false,false);}catch{}for(const o of own)try{o.dispose();}catch{}own.length=0;}};
 }
 root.VoidGates={build,get STOP_POST(){return Object.fromEntries(root.VoidQuarters.STOPS.map(s=>[s.id,s.post]));}};
})(typeof globalThis!=='undefined'?globalThis:this);
