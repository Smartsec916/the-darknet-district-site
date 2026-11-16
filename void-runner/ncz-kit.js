/* NeoChinatown city kit (16 Nov 2026, docs/development/NEOCHINATOWN_REMAKE.md): the reusable pieces the remade quarters are built from.
   The Port (ncz-port.js) is the first user; Old Town and the Avenue are meant to use the same calls.
     create({B,scene,parent,quality,name}) -> kit
   What a kit gives a quarter's builder:
     - SURFACES   surf(): one shared set of tiling wall, metal and ground materials (ambientCG, CC0: assets/textures/ncz). Low: plain lit materials. Medium and up:
                  physically based with normal maps. Buildings are tinted and darkened toward the ground through vertex colours, so a street of different
                  buildings is still one draw call per surface.
     - BATCHES    box(), quad(): everything static is written straight into one mesh per material (finish() makes them).
     - FACADES    face() describes a wall; building() raises a block and dresses every face that shows: a ground floor of modules (shutter, door, shopfront,
                  blank), floors of windows from one painted sheet, sills, hoods, AC units, balconies, downpipes, conduits, fire escapes, a parapet and a roof
                  of plant, tanks and masts.
     - PICTURES   lit(): signs, number plates, intercoms and pictograms all live on one lit sheet (one draw call). mark(): ground and wall markings (paint,
                  drains, manholes, stains, tags) live on one see-through sheet.
     - PROPS      prop(): modelled props (Meshy, assets/models/ncz-kit) drawn as copies of one mesh; a plain built stand-in on Low or when a file is missing.
     - LIGHT      lamp heads, soft light cones (cheap "volumetric" shafts), light pools on walls and ground, and a few real lamps on Medium and up.
     - WET GROUND ground(): wet asphalt with a real mirror picture on Medium and up (puddles sharp, the rest soft), plain glossy on Low.
   Nothing here knows about any particular street. No lore, no brands: a builder passes its own words. */
(function(root){
 'use strict';
 const base=typeof document!=='undefined'&&document.currentScript?new URL('.',document.currentScript.src):null;
 const PROP_DIR='assets/models/ncz-kit/';
 /* The modelled props: file, the height in metres a copy stands (its other sizes follow), and how many triangles it has (for budgets).
    `yaw` turns the model so that its FRONT faces local -z (the way a Babylon plane faces), `sink` lowers it into the ground a little. */
 const PROPS={
  'ac-cluster':{h:1.9,wall:true,mirror:false},'balcony':{h:2.7,wall:true},'shutter-front':{h:4.1,wall:true},
  'water-tank':{h:3.4,mirror:false},'roof-plant':{h:2.1,long:'x',mirror:false},'fuel-bowser':{h:1.75,long:'x'},'cargo-loader':{h:2.0,long:'x'},'crate-stack':{h:1.9,long:'x'},'dumpster':{h:1.75,long:'x'},'vending':{h:1.95},'scooter':{h:1.15,long:'x'},'customs-booth':{h:3.1}};
 function create({B,scene,parent,quality,name='ncz-kit'}){
  const low=quality==='low',high=quality==='high'||quality==='ultra',own=[],lights=[],late=[],containers=[],systems=[],loose=new Map(),tickers=[];let disposed=false,finished=false;
  const node=new B.TransformNode(name,scene);node.parent=parent;
  let seed=90210;const rand=()=>((seed=seed*16807%2147483647)-1)/2147483646,reseed=s=>{seed=Math.max(1,Math.floor(s)%2147483646);},pick=a=>a[Math.floor(rand()*a.length)];
  const url=rel=>base?new URL(rel,base).href:rel;
  const file=n=>{const t=new B.Texture(url('assets/textures/ncz/'+n+'.jpg'),scene,false,true);t.wrapU=t.wrapV=B.Texture.WRAP_ADDRESSMODE;own.push(t);return t;};
  const tex=(n,w,h,draw,mips=true)=>{const t=new B.DynamicTexture(name+'-'+n,{width:w,height:h},scene,mips);draw(t.getContext(),w,h);t.update();own.push(t);return t;};
  const hex=h=>B.Color3.FromHexString(h);

  // ---------------- surfaces ----------------
  const mats={};
  /* A tiling surface. tile: metres one copy of the picture covers. haze: how much of itself it shows unlit (the city's glow), so weathering reads in the dark. */
  function surf(key,{color=null,normal=null,tint='#ffffff',rough=.7,metal=.05,haze=.1,tile=4,bump=1,spec=.08}={}){
   if(mats[key])return mats[key];let m;
   if(low){m=new B.StandardMaterial(name+'-'+key,scene);m.diffuseColor=hex(tint);m.specularColor=new B.Color3(spec,spec,spec*1.1);m.specularPower=48;
    if(color)m.diffuseTexture=file(color);m.emissiveColor=hex(tint).scale(haze*1.7);}   /* on Low the glow is multiplied by the surface itself (texture, tint and the darkening toward the ground) */
   else{m=new B.PBRMaterial(name+'-'+key,scene);m.albedoColor=hex(tint);m.roughness=rough;m.metallic=metal;m.usePhysicalLightFalloff=false;m.maxSimultaneousLights=8;m.environmentIntensity=.5;
    if(color){m.albedoTexture=file(color);m.emissiveTexture=m.albedoTexture;}if(normal){m.bumpTexture=file(normal);m.bumpTexture.level=bump;}m.emissiveColor=hex(tint).scale(haze);}
   m.metadata={tile};own.push(m);return mats[key]=m;}
  // A flat colour that only glows (lamp lenses, tubes, lit strips).
  function glow(key,h,k=1){const id='glow:'+key;if(mats[id])return mats[id];const m=new B.StandardMaterial(name+'-glow-'+key,scene);m.diffuseColor=B.Color3.Black();m.specularColor=B.Color3.Black();m.emissiveColor=hex(h).scale(k);m.disableLighting=true;m.metadata={tile:1};own.push(m);return mats[id]=m;}
  // The shared surfaces every quarter uses.
  const S={
   concrete:surf('concrete',{color:'concrete-old-color',normal:'concrete-old-normal',tint:'#9a9ea6',rough:.82,tile:6,haze:.2}),
   mold:surf('mold',{color:'concrete-mold-color',normal:'concrete-mold-normal',tint:'#8e959b',rough:.86,tile:7,haze:.2}),
   brick:surf('brick',{color:'brick-color',normal:'brick-normal',tint:'#8c7f78',rough:.85,tile:3,haze:.22}),
   plate:surf('plate',{color:'metal-leaks-color',normal:'metal-leaks-normal',tint:'#767c86',rough:.5,metal:.7,tile:4}),
   rustsheet:surf('rustsheet',{color:'corrugated-rust-color',normal:'corrugated-rust-normal',tint:'#8a8078',rough:.7,metal:.4,tile:3.5,haze:.2}),
   greensheet:surf('greensheet',{color:'corrugated-green-color',normal:'corrugated-green-normal',tint:'#6f7a74',rough:.7,metal:.4,tile:3.5,haze:.2}),
   bluesheet:surf('bluesheet',{color:'corrugated-blue-color',normal:'corrugated-blue-normal',tint:'#737d8c',rough:.7,metal:.4,tile:3.5,haze:.2}),
   paving:surf('paving',{color:'sidewalk-color',normal:'sidewalk-normal',tint:'#6c7482',rough:.6,tile:2.5}),
   tar:surf('tar',{color:'road-cracked-color',normal:'road-cracked-normal',tint:'#55585f',rough:.9,tile:8,haze:.06}),
   frame:surf('frame',{tint:'#1a1c21',rough:.5,metal:.8,haze:.25}),
   steel:surf('steel',{tint:'#3d4249',rough:.42,metal:.85,haze:.16}),
   rust:surf('rust',{tint:'#5b3d2c',rough:.85,metal:.3,haze:.16}),
   dark:surf('dark',{tint:'#0b0c0f',rough:.7,metal:.3,haze:.1}),
   yellow:surf('yellow',{tint:'#b98a1c',rough:.6,metal:.3,haze:.2}),
   tile:null,shutter:null};
  // Ribbed shutter steel and small wall tiles are painted here (no file).
  {const st=tex('shutter',64,256,(g,W,H)=>{g.fillStyle='#2a2e35';g.fillRect(0,0,W,H);for(let y=0;y<H;y+=16){const gr=g.createLinearGradient(0,y,0,y+16);gr.addColorStop(0,'#4e545e');gr.addColorStop(.45,'#30343b');gr.addColorStop(1,'#16181c');g.fillStyle=gr;g.fillRect(0,y,W,16);}
    for(let i=0;i<90;i++){g.fillStyle='rgba('+(rand()<.5?'120,76,44':'8,8,10')+','+(.06+rand()*.2)+')';g.fillRect(rand()*W,rand()*H,2+rand()*5,6+rand()*60);}});st.wrapU=st.wrapV=B.Texture.WRAP_ADDRESSMODE;
   const m=S.shutter=surf('shutter',{tint:'#9aa0aa',rough:.5,metal:.7,tile:1.6,haze:.12});if(low)m.diffuseTexture=st;else{m.albedoTexture=st;m.emissiveTexture=st;}
   const tt=tex('tiles',256,256,(g,W,H)=>{g.fillStyle='#8f9a94';g.fillRect(0,0,W,H);for(let y=0;y<H;y+=32)for(let x=0;x<W;x+=32){const v=150+Math.floor(rand()*50);g.fillStyle='rgb('+(v-12)+','+v+','+(v-8)+')';g.fillRect(x+1,y+1,30,30);if(rand()<.08){g.fillStyle='rgba(60,50,30,.5)';g.fillRect(x+1,y+1,30,30);}}
    for(let i=0;i<60;i++){const x=rand()*W,gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,'rgba(70,60,30,0)');gr.addColorStop(1,'rgba(60,48,24,'+(.1+rand()*.3)+')');g.fillStyle=gr;g.fillRect(x,rand()*H*.5,3+rand()*10,H);}g.strokeStyle='rgba(20,22,20,.9)';g.lineWidth=2;for(let i=0;i<=W;i+=32){g.beginPath();g.moveTo(i,0);g.lineTo(i,H);g.moveTo(0,i);g.lineTo(W,i);g.stroke();}});tt.wrapU=tt.wrapV=B.Texture.WRAP_ADDRESSMODE;
   const t2=S.tile=surf('tile',{tint:'#b9c2bc',rough:.3,metal:0,tile:1.2,haze:.14,spec:.3});if(low)t2.diffuseTexture=tt;else{t2.albedoTexture=tt;t2.emissiveTexture=tt;}}

  // ---------------- batches ----------------
  const batches=new Map(),WHITE=[1,1,1];
  const bat=m=>{let b=batches.get(m);if(!b)batches.set(m,b={p:[],n:[],u:[],c:[],i:[]});return b;};
  /* One quad: centre c, half-vectors ax (across) and ay (up the picture). It faces -(ax x ay), the way a Babylon plane turned to (ax, ay) does.
     uv=[u0,v0,u1,v1]; cb / ct are the colours of its bottom and top edges. */
  function quad(m,c,ax,ay,uv=[0,0,1,1],cb=WHITE,ct=cb){const b=bat(m),k=b.p.length/3,nx=-(ax[1]*ay[2]-ax[2]*ay[1]),ny=-(ax[2]*ay[0]-ax[0]*ay[2]),nz=-(ax[0]*ay[1]-ax[1]*ay[0]),l=Math.hypot(nx,ny,nz)||1;
   for(const [sx,sy,u,v,col] of [[-1,-1,uv[0],uv[1],cb],[1,-1,uv[2],uv[1],cb],[1,1,uv[2],uv[3],ct],[-1,1,uv[0],uv[3],ct]]){b.p.push(c[0]+ax[0]*sx+ay[0]*sy,c[1]+ax[1]*sx+ay[1]*sy,c[2]+ax[2]*sx+ay[2]*sy);b.n.push(nx/l,ny/l,nz/l);b.u.push(u,v);b.c.push(col[0],col[1],col[2],1);}
   b.i.push(k,k+1,k+2,k,k+2,k+3);}
  /* A box. size [across, up, deep], centre p, turned `yaw` about y. Its picture repeats by the surface's tile size, and continues up a wall whatever the box's
     height. tint multiplies the surface; ao=[bottom,top] darkens it toward the ground (and under things). faces: which of f(ront, -z) b(ack) r(ight) l(eft) t(op) d(own) to make (default all). */
  function box(m,[sx,sy,sz],[x,y,z],{yaw=0,tint=WHITE,ao=[1,1],faces='fbrltd',tile=m.metadata?.tile||4}={}){
   const c=Math.cos(yaw),s=Math.sin(yaw),ex=[c,0,-s],ez=[s,0,c],up=[0,1,0],h=sy/2,y0=y-h,cb=tint.map(v=>v*ao[0]),ct=tint.map(v=>v*ao[1]),mul=(a,k)=>[a[0]*k,a[1]*k,a[2]*k],at=(a,k)=>[x+a[0]*k,y,z+a[2]*k];
   const side=(ctr,ax,len)=>quad(m,ctr,mul(ax,len/2),mul(up,h),[0,y0/tile,len/tile,(y0+sy)/tile],cb,ct);
   if(faces.includes('f'))side(at(ez,-sz/2),ex,sx);if(faces.includes('b'))side(at(ez,sz/2),mul(ex,-1),sx);
   if(faces.includes('r'))side(at(ex,sx/2),ez,sz);if(faces.includes('l'))side(at(ex,-sx/2),mul(ez,-1),sz);
   if(faces.includes('t'))quad(m,[x,y+h,z],mul(ex,sx/2),mul(ez,sz/2),[0,0,sx/tile,sz/tile],ct,ct);
   if(faces.includes('d'))quad(m,[x,y-h,z],mul(ex,sx/2),mul(ez,-sz/2),[0,0,sx/tile,sz/tile],cb,cb);}
  // A mesh that cannot be written as boxes (tubes, cylinders): kept and merged per material by finish().
  function keep(mesh,m){mesh.material=m;mesh.parent=node;mesh.isPickable=false;if(!loose.has(m))loose.set(m,[]);loose.get(m).push(mesh);return mesh;}
  function cyl(m,r,h,[x,y,z],{t=10,rx=0,rz=0,top=r}={}){const c=B.MeshBuilder.CreateCylinder('kit-cyl',{diameterTop:top*2,diameterBottom:r*2,height:h,tessellation:t},scene);c.position.set(x,y,z);c.rotation.x=rx;c.rotation.z=rz;return keep(c,m);}
  function tube(m,pts,r,t=5){return keep(B.MeshBuilder.CreateTube('kit-tube',{path:pts.map(p=>new B.Vector3(p[0],p[1],p[2])),radius:r,tessellation:t,cap:B.Mesh.CAP_ALL},scene),m);}
  // A sagging cable between two points.
  function cable(a,b,sag=.8,r=.03,m=S.dark){const pts=[];for(let i=0;i<=10;i++){const t=i/10;pts.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t-Math.sin(Math.PI*t)*sag,a[2]+(b[2]-a[2])*t]);}return tube(m,pts,r,4);}

  // ---------------- the window sheet: eight windows, one picture, one draw call ----------------
  // 0 dark glass, 1 dark with a blind, 2 warm behind blinds, 3 warm with a curtain, 4 a screen's blue, 5 a pink-lit room, 6 frosted stairwell green, 7 shuttered
  const WCELL=[128,256],LIT=[2,3,4,5,6];
  function paintWindows(g,W,H,lit){g.fillStyle='#000';g.fillRect(0,0,W,H);
   for(let k=0;k<8;k++){const x=(k%4)*128,y=Math.floor(k/4)*256,w=128,h=256;g.save();g.translate(x,y);
    const on=LIT.includes(k);if(lit&&!on){g.restore();continue;}
    g.fillStyle=lit?'#000':'#0b0d10';g.fillRect(0,0,w,h);const body=['#0d141b','#0d141b','#e09a55','#f0bd80','#5fb4dc','#d0629c','#8fc7a0','#22262b'][k];
    g.fillStyle=body;g.fillRect(8,8,w-16,h-16);
    if(k===0||k===1){const gr=g.createLinearGradient(0,0,w,h);gr.addColorStop(0,'rgba(120,170,200,.16)');gr.addColorStop(.5,'rgba(120,170,200,0)');g.fillStyle=gr;g.fillRect(8,8,w-16,h-16);}
    if(k===1){g.fillStyle='#1d2228';g.fillRect(8,8,w-16,(h-16)*.55);g.fillStyle='rgba(0,0,0,.4)';for(let yy=12;yy<h*.55;yy+=9)g.fillRect(8,yy,w-16,2);}
    if(k===2){g.fillStyle='rgba(40,20,5,.55)';for(let yy=12;yy<h-10;yy+=10)g.fillRect(8,yy,w-16,4);g.fillStyle='rgba(20,10,0,.5)';g.fillRect(8,h*.72,w-16,h*.2);}
    if(k===3){g.fillStyle='rgba(90,40,20,.75)';g.fillRect(8,8,(w-16)*.42,h-16);g.fillStyle='rgba(30,14,6,.8)';g.fillRect(w*.55,h*.62,w*.3,h*.3);g.fillRect(w*.62,h*.48,w*.08,h*.16);const gr=g.createRadialGradient(w*.7,h*.3,2,w*.7,h*.3,60);gr.addColorStop(0,'rgba(255,240,200,.7)');gr.addColorStop(1,'rgba(255,240,200,0)');g.fillStyle=gr;g.fillRect(8,8,w-16,h-16);}
    if(k===4){const gr=g.createRadialGradient(w*.4,h*.7,4,w*.4,h*.7,110);gr.addColorStop(0,'rgba(210,240,255,.9)');gr.addColorStop(1,'rgba(10,30,60,.85)');g.fillStyle=gr;g.fillRect(8,8,w-16,h-16);}
    if(k===5){const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'rgba(60,10,60,.7)');gr.addColorStop(1,'rgba(255,120,190,.2)');g.fillStyle=gr;g.fillRect(8,8,w-16,h-16);g.fillStyle='rgba(20,0,20,.7)';g.fillRect(w*.2,h*.55,w*.22,h*.4);}
    if(k===6){g.fillStyle='rgba(255,255,255,.12)';for(let i=0;i<40;i++)g.fillRect(8+rand()*(w-20),8+rand()*(h-20),4,4);g.fillStyle='rgba(10,30,20,.5)';g.fillRect(8,h*.5,w-16,6);}
    if(k===7){g.fillStyle='rgba(0,0,0,.5)';for(let yy=10;yy<h-8;yy+=12)g.fillRect(8,yy,w-16,3);g.fillStyle='rgba(110,70,40,.3)';g.fillRect(w*.3,8,10,h-16);}
    // frame, mullion, transom
    g.fillStyle=lit?'#000':'#15181c';g.fillRect(w/2-3,8,6,h-16);g.fillRect(8,h*.36,w-16,6);g.strokeStyle=lit?'#000':'#22262c';g.lineWidth=8;g.strokeRect(4,4,w-8,h-8);
    if(!lit){g.fillStyle='rgba(0,0,0,.35)';for(let i=0;i<14;i++)g.fillRect(8+rand()*(w-16),8+rand()*(h-16),2,10+rand()*40);}
    g.restore();}}
  const winColor=tex('windows',512,512,(g,W,H)=>paintWindows(g,W,H,false)),winGlow=tex('windows-glow',512,512,(g,W,H)=>paintWindows(g,W,H,true));
  const winM=new B.StandardMaterial(name+'-windows',scene);winM.diffuseTexture=winColor;winM.emissiveTexture=winGlow;winGlow.level=low?1:1.25;winM.specularColor=new B.Color3(.3,.34,.4);winM.specularPower=90;winM.metadata={tile:1};own.push(winM);
  const winUV=k=>{const c=k%4,r=Math.floor(k/4);return [c/4+.004,1-(r+1)/2+.004,(c+1)/4-.004,1-r/2-.004];};

  // ---------------- the lit sheet (signs, plates, panels) and the mark sheet (paint, drains, stains, tags) ----------------
  function sheet(id,size,alpha){const cv=typeof document!=='undefined'?null:null,t=new B.DynamicTexture(name+'-'+id,{width:size,height:size},scene,true),g=t.getContext();if(!alpha){g.fillStyle='#000';g.fillRect(0,0,size,size);}own.push(t);
   let sx=2,sy=2,row=0,dirty=false;
   // draw(g,w,h) paints into a w x h pixel cell; returns its uv rectangle (v up).
   function cell(w,h,draw){w=Math.min(size-4,Math.ceil(w));h=Math.min(size-4,Math.ceil(h));if(sx+w+2>size){sx=2;sy+=row+4;row=0;}if(sy+h+2>size){console.info('[kit] '+id+' sheet is full');return [0,0,.001,.001];}
    g.save();g.translate(sx,sy);g.beginPath();g.rect(0,0,w,h);g.clip();draw(g,w,h);g.restore();const uv=[(sx+.5)/size,1-(sy+h-.5)/size,(sx+w-.5)/size,1-(sy+.5)/size];sx+=w+4;row=Math.max(row,h);dirty=true;return uv;}
   return {t,cell,flush(){if(dirty){t.update();dirty=false;}}};}
  const litSheet=sheet('lit',low?1024:2048,false),markSheet=sheet('marks',low?1024:2048,true),PX=low?40:80;   // pixels per metre on the sheets
  const litM=new B.StandardMaterial(name+'-lit',scene);litM.diffuseColor=B.Color3.Black();litM.specularColor=B.Color3.Black();litM.emissiveTexture=litSheet.t;litSheet.t.level=low?1:1.35;litM.disableLighting=true;litM.metadata={tile:1};own.push(litM);
  const markM=new B.StandardMaterial(name+'-marks',scene);markM.diffuseTexture=markSheet.t;markSheet.t.hasAlpha=true;markM.useAlphaFromDiffuseTexture=true;markM.specularColor=B.Color3.Black();markM.emissiveTexture=markSheet.t;markM.emissiveColor=B.Color3.Black();markM.zOffset=-2;markM.metadata={tile:1};own.push(markM);
  {const e=markSheet.t;markM.emissiveTexture=null;markM.emissiveColor=new B.Color3(.16,.17,.18);void e;}
  const FONT='bold {s}px "Noto Sans SC","Noto Sans JP","Microsoft YaHei","Yu Gothic",Consolas,sans-serif';
  const font=(g,s)=>{g.font=FONT.replace('{s}',Math.max(6,Math.round(s)));g.textAlign='center';g.textBaseline='middle';};
  /* A lit picture w x h metres at centre c, across-direction ax (unit) and up-direction ay (unit); it faces -(ax x ay). draw(g,W,H) paints it. */
  function lit(w,h,c,ax,ay,draw,{px=PX}={}){const uv=litSheet.cell(w*px,h*px,draw);quad(litM,c,[ax[0]*w/2,ax[1]*w/2,ax[2]*w/2],[ay[0]*h/2,ay[1]*h/2,ay[2]*h/2],uv);return uv;}
  function litAgain(uv,w,h,c,ax,ay){quad(litM,c,[ax[0]*w/2,ax[1]*w/2,ax[2]*w/2],[ay[0]*h/2,ay[1]*h/2,ay[2]*h/2],uv);}
  function mark(w,h,c,ax,ay,draw,{px=PX*.6}={}){const uv=markSheet.cell(w*px,h*px,draw);quad(markM,c,[ax[0]*w/2,ax[1]*w/2,ax[2]*w/2],[ay[0]*h/2,ay[1]*h/2,ay[2]*h/2],uv);return uv;}
  function markAgain(uv,w,h,c,ax,ay){quad(markM,c,[ax[0]*w/2,ax[1]*w/2,ax[2]*w/2],[ay[0]*h/2,ay[1]*h/2,ay[2]*h/2],uv);}
  // Painters for the common pictures.
  const paint={
   // words in light on a dark board: lines top to bottom; vertical=true stacks the characters of ONE line downward
   words:(lines,color,{bg='#07080b',edge=null,sub=null,vertical=false,tube=true}={})=>(g,W,H)=>{g.fillStyle=bg;g.fillRect(0,0,W,H);if(edge){g.strokeStyle=edge;g.lineWidth=Math.max(2,Math.min(W,H)*.04);g.strokeRect(g.lineWidth,g.lineWidth,W-g.lineWidth*2,H-g.lineWidth*2);}
    const items=vertical?[...lines[0]]:lines,n=items.length;items.forEach((text,i)=>{const cy=H*(i+.5)/n,size=vertical?Math.min(W*.74,H/n*.84):Math.min(H/n*.7,W/(Math.max(2,[...text].length)*.66));font(g,size);const col=sub&&i>0&&!vertical?sub:color;
     if(tube){g.shadowColor=col;g.shadowBlur=size*.35;}g.fillStyle=col;g.fillText(text,W/2,cy+size*.04);g.shadowBlur=0;g.fillStyle='rgba(255,255,255,.55)';g.fillText(text,W/2,cy+size*.04);});},
   // an abstract light panel: bars of colour, no words (a sign that says nothing)
   bars:(colors,{bg='#060709'}={})=>(g,W,H)=>{g.fillStyle=bg;g.fillRect(0,0,W,H);const n=colors.length,vert=H>W;colors.forEach((c,i)=>{g.shadowColor=c;g.shadowBlur=10;g.fillStyle=c;if(vert)g.fillRect(W*.2,H*(i+.18)/n,W*.6,H/n*.64);else g.fillRect(W*(i+.18)/n,H*.2,W/n*.64,H*.6);});g.shadowBlur=0;},
   arrow:(color,dir='right',{bg='#07080b'}={})=>(g,W,H)=>{g.fillStyle=bg;g.fillRect(0,0,W,H);g.save();g.translate(W/2,H/2);g.rotate({right:0,down:Math.PI/2,left:Math.PI,up:-Math.PI/2}[dir]||0);const s=Math.min(W,H)*.36;g.fillStyle=color;g.shadowColor=color;g.shadowBlur=8;g.beginPath();g.moveTo(s,0);g.lineTo(0,-s*.8);g.lineTo(0,-s*.3);g.lineTo(-s,-s*.3);g.lineTo(-s,s*.3);g.lineTo(0,s*.3);g.lineTo(0,s*.8);g.closePath();g.fill();g.restore();},
   // a warm or cold lit pane (door glass, a stairwell slit, a lamp diffuser)
   pane:(color,{bars=0,dim=1}={})=>(g,W,H)=>{const gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,color);gr.addColorStop(1,'#000');g.fillStyle=color;g.globalAlpha=dim;g.fillRect(0,0,W,H);g.globalAlpha=.35*dim;g.fillStyle=gr;g.fillRect(0,0,W,H);g.globalAlpha=1;g.fillStyle='rgba(0,0,0,.65)';for(let i=1;i<=bars;i++)g.fillRect(0,H*i/(bars+1)-2,W,4);g.strokeStyle='rgba(0,0,0,.8)';g.lineWidth=3;g.strokeRect(1,1,W-2,H-2);},
   // an intercom: a small screen, a speaker grille, rows of call buttons, a few of them lit
   intercom:()=>(g,W,H)=>{g.fillStyle='#1a1d22';g.fillRect(0,0,W,H);g.strokeStyle='#3b4049';g.lineWidth=2;g.strokeRect(1,1,W-2,H-2);g.fillStyle='#0c2a33';g.fillRect(W*.14,H*.06,W*.72,H*.2);g.fillStyle='#39d8ff';g.fillRect(W*.2,H*.12,W*.3,H*.03);g.fillStyle='#0a0b0d';for(let y=0;y<4;y++)g.fillRect(W*.2,H*(.31+y*.03),W*.6,2);
    for(let r=0;r<5;r++)for(let c=0;c<3;c++){g.fillStyle=rand()<.2?'#ffb347':'#3a3f47';g.fillRect(W*(.16+c*.25),H*(.47+r*.1),W*.18,H*.06);}},
   plate:(text,color='#d8dde2',bg='#15181c')=>(g,W,H)=>{g.fillStyle=bg;g.fillRect(0,0,W,H);g.strokeStyle='#4a505a';g.lineWidth=2;g.strokeRect(1,1,W-2,H-2);font(g,Math.min(H*.7,W/([...text].length*.62)));g.fillStyle=color;g.fillText(text,W/2,H/2+1);},
   // a pictogram of two figures (a public toilet)
   wc:(color='#e8eef2',bg='#0b2f4a')=>(g,W,H)=>{g.fillStyle=bg;g.fillRect(0,0,W,H);g.fillStyle=color;const fig=(cx,dress)=>{const s=H*.09;g.beginPath();g.arc(cx,H*.2,s,0,7);g.fill();if(dress){g.beginPath();g.moveTo(cx,H*.3);g.lineTo(cx-s*2.2,H*.68);g.lineTo(cx+s*2.2,H*.68);g.closePath();g.fill();}else g.fillRect(cx-s*1.3,H*.31,s*2.6,H*.37);g.fillRect(cx-s*1.1,H*.66,s*.9,H*.24);g.fillRect(cx+s*.2,H*.66,s*.9,H*.24);};fig(W*.3,false);fig(W*.7,true);g.fillRect(W/2-1.5,H*.12,3,H*.78);}};
  // Ground and wall marks.
  const stain={
   line:(color,dash=0)=>(g,W,H)=>{g.fillStyle=color;if(!dash)g.fillRect(0,0,W,H);else for(let x=0;x<W;x+=dash*2)g.fillRect(x,0,dash,H);g.globalCompositeOperation='destination-out';for(let i=0;i<W*H/60;i++){g.fillStyle='rgba(0,0,0,'+(.2+rand()*.6)+')';g.fillRect(rand()*W,rand()*H,1+rand()*5,1+rand()*3);}g.globalCompositeOperation='source-over';},
   hazard:(a='#c79418',b='#141414')=>(g,W,H)=>{g.fillStyle=b;g.fillRect(0,0,W,H);g.fillStyle=a;const s=Math.min(W,H);for(let x=-H;x<W+H;x+=s*1.2){g.beginPath();g.moveTo(x,H);g.lineTo(x+s*.6,H);g.lineTo(x+s*.6+H,0);g.lineTo(x+H,0);g.fill();}g.globalCompositeOperation='destination-out';for(let i=0;i<W*H/50;i++){g.fillStyle='rgba(0,0,0,'+(.2+rand()*.6)+')';g.fillRect(rand()*W,rand()*H,1+rand()*6,1+rand()*3);}g.globalCompositeOperation='source-over';},
   text:(text,color)=>(g,W,H)=>{font(g,Math.min(H*.86,W/([...text].length*.6)));g.fillStyle=color;g.fillText(text,W/2,H/2);g.globalCompositeOperation='destination-out';for(let i=0;i<W*H/40;i++){g.fillStyle='rgba(0,0,0,'+(.2+rand()*.6)+')';g.fillRect(rand()*W,rand()*H,1+rand()*6,1+rand()*3);}g.globalCompositeOperation='source-over';},
   ring:(color,lw=.08)=>(g,W,H)=>{g.strokeStyle=color;g.lineWidth=Math.min(W,H)*lw;g.beginPath();g.arc(W/2,H/2,Math.min(W,H)/2-g.lineWidth,0,7);g.stroke();g.globalCompositeOperation='destination-out';for(let i=0;i<W*H/50;i++){g.fillStyle='rgba(0,0,0,'+(.2+rand()*.6)+')';g.fillRect(rand()*W,rand()*H,1+rand()*6,1+rand()*3);}g.globalCompositeOperation='source-over';},
   manhole:()=>(g,W,H)=>{const r=Math.min(W,H)/2;g.fillStyle='#17191c';g.beginPath();g.arc(W/2,H/2,r-1,0,7);g.fill();g.strokeStyle='#3a3d42';g.lineWidth=r*.08;g.beginPath();g.arc(W/2,H/2,r*.86,0,7);g.stroke();g.strokeStyle='#2a2d31';g.lineWidth=r*.05;for(let i=-3;i<=3;i++){g.beginPath();g.moveTo(W/2-r*.7,H/2+i*r*.2);g.lineTo(W/2+r*.7,H/2+i*r*.2);g.stroke();}},
   drain:()=>(g,W,H)=>{g.fillStyle='#0a0b0c';g.fillRect(0,0,W,H);g.strokeStyle='#3d4046';g.lineWidth=3;g.strokeRect(2,2,W-4,H-4);g.fillStyle='#33363b';const n=Math.max(4,Math.round(W/12));for(let i=0;i<n;i++)g.fillRect(6+i*(W-12)/n,6,(W-12)/n*.45,H-12);},
   blot:(color,a=.5)=>(g,W,H)=>{for(let i=0;i<5;i++){const x=W*(.3+rand()*.4),y=H*(.3+rand()*.4),r=Math.min(W,H)*(.2+rand()*.28),gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,color.replace('A',String(a)));gr.addColorStop(1,color.replace('A','0'));g.fillStyle=gr;g.fillRect(0,0,W,H);}},
   streak:(color='rgba(18,14,10,A)')=>(g,W,H)=>{for(let i=0;i<7;i++){const x=W*rand(),w=W*(.04+rand()*.12),gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,color.replace('A',String(.35+rand()*.4)));gr.addColorStop(1,color.replace('A','0'));g.fillStyle=gr;g.fillRect(x,0,w,H*(.5+rand()*.5));}},
   // spray tags: loops and strokes that are not letters or words
   tag:color=>(g,W,H)=>{g.strokeStyle=color;g.lineCap='round';g.lineJoin='round';for(let k=0;k<2;k++){g.lineWidth=H*(.05+rand()*.05);g.beginPath();let x=W*.1,y=H*(.3+rand()*.4);g.moveTo(x,y);for(let i=0;i<7;i++){const nx=x+W*.12,ny=H*(.15+rand()*.7);g.bezierCurveTo(x+W*.02,ny,nx-W*.1,y,nx,ny);x=nx;y=ny;}g.stroke();}g.globalAlpha=.6;g.lineWidth=H*.02;g.beginPath();g.moveTo(W*.1,H*.9);g.lineTo(W*.9,H*.86);g.stroke();g.globalAlpha=1;for(let i=0;i<4;i++){const x=W*(.2+rand()*.6);g.fillStyle=color;g.fillRect(x,H*.6,2,H*(.1+rand()*.3));}}};
  // Flat on the ground at (x,z): w across (x when yaw 0), d deep.
  const groundAxes=yaw=>{const c=Math.cos(yaw),s=Math.sin(yaw);return [[c,0,-s],[s,0,c]];};
  function groundMark(w,d,x,z,draw,{yaw=0,y=.012,px}={}){const [ax,ay]=groundAxes(yaw);return mark(w,d,[x,y,z],ax,ay,draw,px?{px}:{});}

  // ---------------- facades ----------------
  /* A wall seen from the street: from (ax,az) to (bx,bz), with (nx,nz) pointing out of the wall into the street. Along it, s runs in the direction a picture's
     left-to-right runs for someone looking at the wall. */
  function face(ax,az,bx,bz,nx,nz){const tx=-nz,tz=nx,sa=ax*tx+az*tz,sb=bx*tx+bz*tz,x=sa<sb?ax:bx,z=sa<sb?az:bz;return {x,z,tx,tz,nx,nz,len:Math.hypot(bx-ax,bz-az),yaw:Math.atan2(-nx,-nz)};}
  const at=(f,s,y,o=0)=>[f.x+f.tx*s+f.nx*o,y,f.z+f.tz*s+f.nz*o];
  const fax=f=>[f.tx,0,f.tz],UP=[0,1,0];
  // A box standing on / hung from a wall: size [along, up, out], its centre at s along, y up, o out from the wall.
  const fbox=(f,m,size,s,y,o,opt={})=>box(m,size,at(f,s,y,o),{yaw:f.yaw,...opt});
  const flit=(f,w,h,s,y,o,draw,opt)=>lit(w,h,at(f,s,y,o),fax(f),UP,draw,opt);
  const fmark=(f,w,h,s,y,draw,o=.02,opt)=>mark(w,h,at(f,s,y,o),fax(f),UP,draw,opt);
  function window(f,s,y,w,h,k,o=.03){quad(winM,at(f,s,y,o),[f.tx*w/2,0,f.tz*w/2],[0,h/2,0],winUV(k));}
  // Light spilling on a wall or the ground: a soft blot of colour, added to the picture.
  const washM={};
  function washMat(c){if(washM[c])return washM[c];const t=tex('wash-'+c.slice(1),64,64,(g,W,H)=>{const gr=g.createRadialGradient(W/2,H/2,0,W/2,H/2,W/2);gr.addColorStop(0,c);gr.addColorStop(.5,c+'66');gr.addColorStop(1,c+'00');g.fillStyle=gr;g.fillRect(0,0,W,H);});t.hasAlpha=true;
   const m=new B.StandardMaterial(name+'-wash-'+c,scene);m.diffuseColor=B.Color3.Black();m.specularColor=B.Color3.Black();m.emissiveTexture=t;m.opacityTexture=t;m.disableLighting=true;m.alphaMode=B.Engine.ALPHA_ADD;m.disableDepthWrite=true;m.zOffset=-3;m.metadata={tile:1,fx:true};own.push(m);return washM[c]=m;}
  function wallWash(f,c,s,y,w,h,k=.5){const t=[k,k,k];quad(washMat(c),at(f,s,y,.05),[f.tx*w/2,0,f.tz*w/2],[0,h/2,0],[0,0,1,1],t);}
  function groundWash(c,x,z,w,d,k=.5,y=.02){const t=[k,k,k];quad(washMat(c),[x,y,z],[w/2,0,0],[0,0,d/2],[0,0,1,1],t);}
  // A soft dark patch where something stands on the ground (contact shadow).
  let shadeM=null;
  function shade(x,z,w,d,yaw=0,k=.75,y=.016){if(!shadeM){const t=tex('shade',64,64,(g,W,H)=>{const gr=g.createRadialGradient(W/2,H/2,W*.12,W/2,H/2,W/2);gr.addColorStop(0,'rgba(0,0,0,1)');gr.addColorStop(.6,'rgba(0,0,0,.55)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,W,H);});t.hasAlpha=true;
     shadeM=new B.StandardMaterial(name+'-shade',scene);shadeM.diffuseTexture=t;shadeM.useAlphaFromDiffuseTexture=true;shadeM.diffuseColor=B.Color3.Black();shadeM.specularColor=B.Color3.Black();shadeM.disableLighting=true;shadeM.zOffset=-2.5;shadeM.metadata={tile:1,fx:true};own.push(shadeM);}
   const [ax,ay]=groundAxes(yaw);quad(shadeM,[x,y,z],[ax[0]*w*.72,0,ax[2]*w*.72],[ay[0]*d*.72,0,ay[2]*d*.72],[0,0,1,1],[k,k,k]);}
  /* Light cones: a hollow cone of faint light under a lamp (the cheap stand-in for light in fog). */
  const coneM={};
  function cone(c,[x,y,z],h,r,{k=1,top=.12}={}){let m=coneM[c];if(!m){const t=tex('cone-'+c.slice(1),8,128,(g,W,H)=>{g.fillStyle='#000';g.fillRect(0,0,W,H);const gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,c);gr.addColorStop(.25,c+'70');gr.addColorStop(1,c+'00');g.fillStyle=gr;g.fillRect(0,0,W,H);},false);
     m=new B.StandardMaterial(name+'-cone-'+c,scene);m.diffuseColor=B.Color3.Black();m.specularColor=B.Color3.Black();m.emissiveTexture=t;m.disableLighting=true;m.alphaMode=B.Engine.ALPHA_ADD;m.alpha=.999;m.backFaceCulling=false;m.disableDepthWrite=true;m.fogEnabled=false;m.metadata={tile:1,fx:true};t.level=(low?.16:.11)*k;own.push(m);coneM[c]=m;}
   const mesh=B.MeshBuilder.CreateCylinder('kit-cone',{diameterTop:top*2,diameterBottom:r*2,height:h,tessellation:14,cap:B.Mesh.NO_CAP},scene);mesh.position.set(x,y-h/2,z);return keep(mesh,m);}

  // ---------------- props ----------------
  const propState=new Map(),standIns={};
  /* prop(id,[x,y,z],yaw,{h}): one copy of a modelled prop, its front turned to face the direction a Babylon plane with rotation.y=yaw faces. Copies of one
     prop are thin instances of one mesh. On Low, or when the file is missing, standIns[id](h) (a few boxes) is used in the same places. */
  function prop(id,p,yaw=0,{h=PROPS[id]?.h||1,shadow=null}={}){let st=propState.get(id);if(!st)propState.set(id,st={id,placed:[],meshes:null,ready:false});st.placed.push({p,yaw,h});
   if(shadow)shade(p[0],p[2],shadow[0],shadow[1],yaw);if(st.ready)applyProp(st,[st.placed[st.placed.length-1]]);return st;}
  function applyProp(st,list){if(!st.meshes||disposed)return;for(const {p,yaw,h} of list){const k=h/st.h,mat=B.Matrix.Compose(new B.Vector3(k,k,k),B.Quaternion.RotationYawPitchRoll(yaw,0,0),new B.Vector3(p[0],p[1],p[2]));for(const m of st.meshes)m.thinInstanceAdd(st.base.multiply(mat),false);}
   for(const m of st.meshes){m.thinInstanceBufferUpdated('matrix');m.thinInstanceRefreshBoundingInfo(false);m.alwaysSelectAsActiveMesh=false;}}
  // Take loaded or built meshes, bake them where they are, and work out the matrix that stands the prop on the origin, centred, PROPS.h tall, facing -z.
  function adopt(st,meshes,{turn=TURN[st.id]||0}={}){const list=[];
   for(const m of meshes){if(!m.getTotalVertices||!m.getTotalVertices())continue;m.computeWorldMatrix(true);m.setParent(null);m.bakeCurrentTransformIntoVertices();m.parent=node;m.isPickable=false;m.receiveShadows=false;list.push(m);}
   if(!list.length)throw Error('empty prop '+st.id);let lo=new B.Vector3(1e9,1e9,1e9),hi=new B.Vector3(-1e9,-1e9,-1e9);for(const m of list){m.refreshBoundingInfo();const b=m.getBoundingInfo().boundingBox;lo=B.Vector3.Minimize(lo,b.minimumWorld);hi=B.Vector3.Maximize(hi,b.maximumWorld);}
   const wall=PROPS[st.id]?.wall,long=PROPS[st.id]?.long;st.h=Math.max(.01,hi.y-lo.y);st.size=[hi.x-lo.x,hi.y-lo.y,hi.z-lo.z];
   // a wall prop lies flat against z; a long prop lies along x: a model that came out the other way is given a quarter turn
   if(wall&&st.size[0]<st.size[2]*.8||long==='x'&&st.size[2]>st.size[0]*1.1)turn+=Math.PI/2;st.turn=turn;
   // centre on x; stand on y=0; a wall prop's BACK (its +z side after the turn) sits on z=0, others are centred on z
   const centre=B.Matrix.Translation(-(lo.x+hi.x)/2,-lo.y,-(lo.z+hi.z)/2),rot=B.Matrix.RotationY(turn);let m0=centre.multiply(rot);
   if(wall){const d=(Math.abs(Math.cos(turn))>.5?st.size[2]:st.size[0])/2;m0=m0.multiply(B.Matrix.Translation(0,0,-d));}
   st.base=m0;st.meshes=list;st.ready=true;applyProp(st,st.placed);return st;}
  function tuneModel(mat){if('usePhysicalLightFalloff' in mat){mat.usePhysicalLightFalloff=false;mat.maxSimultaneousLights=8;mat.environmentIntensity=.5;mat.directIntensity=1.2;if(mat.albedoTexture&&!mat.emissiveTexture){mat.emissiveTexture=mat.albedoTexture;mat.emissiveColor=new B.Color3(.13,.14,.15);}}}
  const TURN={};   // per-model turn so the front faces -z (filled by the quarter's builder if a model came out facing another way)
  function loadProps(){
   for(const st of propState.values()){if(st.asked)continue;st.asked=true;
    const fallback=()=>{if(disposed||st.ready)return;try{const made=standIns[st.id]?.();if(made)adopt(st,made);}catch(e){console.info('[kit] no stand-in for '+st.id,e);}};
    if(low||!root.VoidAssets?.loadContainer||!PROPS[st.id]){fallback();continue;}
    late.push(root.VoidAssets.loadContainer({src:PROP_DIR+'ncz-'+st.id+'.glb'},scene,null,'ncz-kit:'+st.id).then(c=>{if(disposed){c.dispose();return;}containers.push(c);c.addAllToScene();for(const m of c.materials)tuneModel(m);
      const meshes=c.meshes.filter(m=>m.getTotalVertices&&m.getTotalVertices()>0);adopt(st,meshes);for(const n of c.transformNodes)if(!n.getChildren().length)n.setEnabled(false);onProp?.(st);})
     .catch(e=>{console.info('[kit] prop not available: '+st.id+' ('+(e?.message||e)+')');fallback();}));}}
  let onProp=null;
  // Simple pieces for stand-ins: a list of [material, size, centre] boxes merged into one mesh per material.
  function boxes(list){const by=new Map();for(const [m,s,p] of list){const b=B.MeshBuilder.CreateBox('kit-standin',{width:s[0],height:s[1],depth:s[2]},scene);b.position.set(p[0],p[1],p[2]);if(!by.has(m))by.set(m,[]);by.get(m).push(b);}
   return [...by].map(([m,l])=>{const g=l.length>1?B.Mesh.MergeMeshes(l,true,true):l[0];g.material=m;return g;});}
  Object.assign(standIns,{
   'ac-cluster':()=>boxes([[S.steel,[.9,.6,.4],[-.5,.3,0]],[S.steel,[.8,.55,.38],[.45,.28,0]],[S.steel,[.95,.65,.4],[0,1.25,0]],[S.frame,[1.9,.06,.45],[0,.62,0]],[S.frame,[.06,1.9,.06],[-.95,.95,.15]]]),
   'balcony':()=>boxes([[S.concrete,[2.4,.16,1.1],[0,.08,0]],[S.frame,[2.4,1.0,.05],[0,.66,-.52]],[S.frame,[.05,1.0,1.1],[-1.18,.66,0]],[S.frame,[.05,1.0,1.1],[1.18,.66,0]],[S.steel,[.8,.5,.35],[.6,.42,-.2]],[S.frame,[2.4,.06,1.1],[0,2.67,0]]]),
   'shutter-front':()=>boxes([[S.shutter,[2.3,2.9,.08],[-.6,1.45,0]],[S.plate,[.95,2.2,.08],[1.35,1.1,0]],[S.frame,[4,.16,1.0],[0,3.3,-.4]],[S.frame,[4,.3,.14],[0,3.95,0]],[S.frame,[.14,4.1,.14],[-1.93,2.05,0]],[S.frame,[.14,4.1,.14],[1.93,2.05,0]]]),
   'water-tank':()=>{const c=B.MeshBuilder.CreateCylinder('kit-standin',{diameter:2.2,height:2.2,tessellation:12},scene);c.position.y=2.3;c.material=S.rust;return [c,...boxes([[S.frame,[.12,1.2,.12],[-.8,.6,-.8]],[S.frame,[.12,1.2,.12],[.8,.6,-.8]],[S.frame,[.12,1.2,.12],[-.8,.6,.8]],[S.frame,[.12,1.2,.12],[.8,.6,.8]],[S.frame,[2,.1,2],[0,1.2,0]]])];},
   'roof-plant':()=>boxes([[S.steel,[3,1.7,1.8],[0,1.0,0]],[S.frame,[3.2,.16,2],[0,.08,0]],[S.frame,[1,.3,1],[-.7,2.0,0]],[S.frame,[1,.3,1],[.7,2.0,0]]]),
   'fuel-bowser':()=>{const c=B.MeshBuilder.CreateCylinder('kit-standin',{diameter:1.05,height:1.9,tessellation:12},scene);c.rotation.z=Math.PI/2;c.position.set(.2,1.05,0);c.material=S.rust;return [c,...boxes([[S.frame,[3,.18,1.3],[0,.45,0]],[S.steel,[.7,.8,.9],[-1.1,.95,0]],[S.yellow,[.12,.25,1.3],[1.5,.5,0]],[S.dark,[.3,.5,.3],[-1,.25,.5]],[S.dark,[.3,.5,.3],[1,.25,.5]],[S.dark,[.3,.5,.3],[-1,.25,-.5]],[S.dark,[.3,.5,.3],[1,.25,-.5]]])];},
   'cargo-loader':()=>boxes([[S.steel,[1.5,.7,3],[0,.75,0]],[S.yellow,[1.52,.3,1.1],[0,1.0,-.9]],[S.frame,[1.3,1.0,.08],[0,1.6,-.2]],[S.frame,[1.3,.08,1.0],[0,2.0,-.6]],[S.dark,[.35,.8,.8],[-.75,.4,-.9]],[S.dark,[.35,.8,.8],[.75,.4,-.9]],[S.dark,[.35,.8,.8],[-.75,.4,.9]],[S.dark,[.35,.8,.8],[.75,.4,.9]],[S.plate,[1.1,.5,1.0],[0,1.35,.8]]]),
   'crate-stack':()=>boxes([[S.rust,[1.4,.85,1.0],[-.25,.6,0]],[S.greensheet,[1.4,.85,1.0],[-.25,1.47,0]],[S.plate,[.7,1.4,.9],[.85,.85,0]],[S.frame,[2.3,.16,1.2],[.1,.08,0]]]),
   'dumpster':()=>boxes([[S.greensheet,[2.2,1.25,1.2],[0,.7,0]],[S.dark,[2.3,.1,1.3],[0,1.42,.1]],[S.dark,[.7,.6,.6],[-1.4,.3,-.2]],[S.dark,[.5,.45,.5],[-1.2,.22,-.8]]]),
   'vending':()=>boxes([[S.frame,[1.0,1.95,.8],[0,.975,0]],[glow('vend','#cfe8ff',.7),[.6,.9,.02],[-.1,1.3,-.41]],[glow('vend-pay','#ffb347',.7),[.12,.2,.02],[.36,1.0,-.41]]]),
   'scooter':()=>boxes([[S.dark,[.4,.5,1.5],[0,.55,0]],[S.dark,[.14,.5,.5],[0,.25,-.6]],[S.dark,[.14,.5,.5],[0,.25,.6]],[S.frame,[.5,.4,.45],[0,.95,.55]],[S.frame,[.6,.06,.06],[0,1.05,-.55]]]),
   'customs-booth':()=>boxes([[S.frame,[2.1,1.0,2.1],[0,.5,0]],[glow('booth','#f2c98a',.5),[1.9,1.1,1.9],[0,1.55,0]],[S.frame,[2.4,.2,2.4],[0,2.25,0]],[S.frame,[2.1,.25,2.1],[0,2.1,0]],[S.steel,[.7,.5,.5],[.4,2.6,.3]],[S.yellow,[2.14,.14,2.14],[0,.1,0]]])});

  // ---------------- building pieces ----------------
  const TINTS=[[1,1,1],[.92,.9,.86],[.82,.86,.9],[.9,.84,.8],[.8,.82,.8],[.95,.92,.98],[.76,.78,.84]];
  /* One building face dressed from the ground up.
       f       the face (face())
       h       the building's height
       wall    its surface
       ground  the ground floor: a list of modules left to right, each {kind,w,...}; w in metres, or 0 to share what is left over.
               kinds: 'blank' | 'shutter' | 'door' | 'shop' | 'vent' | 'model' (a shutter-front prop) | 'open' (leave it to the caller)
       gh      ground floor height,  fh  storey height,  dense  0..1 how much hangs on the wall
     Returns {bays:[{kind,s0,s1,...}], floors, cols:[s...]} so a builder can add its own pieces (signs, lamps) in the right places. */
  function dress(f,h,{wall=S.concrete,tint=WHITE,ground=[{kind:'blank',w:0}],gh=4.2,fh=3.15,dense=.6,litRate=.36,trim=S.frame,escape=false,pipes=true,canopy=true,number=null}={}){
   const out={bays:[],floors:0,cols:[]},len=f.len;
   // ---- ground floor ----
   const fixed=ground.reduce((a,g)=>a+(g.w||0),0),free=ground.filter(g=>!g.w).length,share=free?Math.max(0,len-fixed)/free:0;let s=0;
   for(const g of ground){const w=g.w||share,s0=s,s1=s+w,mid=(s0+s1)/2;s=s1;const bay={...g,s0,s1,mid,w};out.bays.push(bay);
    if(w<.3||g.kind==='open')continue;
    // every bay stands between two shallow piers under a lintel
    fbox(f,trim,[.22,gh,.2],s0+.11,gh/2,.1,{ao:[.5,1]});fbox(f,trim,[.22,gh,.2],s1-.11,gh/2,.1,{ao:[.5,1]});
    if(g.kind==='shutter'){const sw=w-.7,sh=Math.min(3.1,gh-.9);fbox(f,S.dark,[sw+.16,sh+.12,.08],mid,sh/2+.06,.03);fbox(f,S.shutter,[sw,sh,.06],mid,sh/2,.07,{ao:[.45,1],tint:g.tint||WHITE});fbox(f,trim,[sw+.3,.34,.3],mid,sh+.2,.15);   // the roll box
     fmark(f,sw,.3,mid,.16,stain.hazard(),.105);if(g.label)flit(f,Math.min(sw,[...g.label].length*.34+.5),.42,mid,sh+.2,.31,paint.words([g.label],g.color||'#e8c56a',{tube:false,bg:'#0c0d10'}));
     if(g.tag!==false&&rand()<.7)fmark(f,sw*.8,sh*.42,mid+(rand()-.5)*.3,sh*.45,stain.tag(pick(['rgba(210,205,190,.75)','rgba(120,220,235,.6)','rgba(235,110,170,.6)','rgba(240,190,90,.6)'])),.105);}
    else if(g.kind==='door'){door(f,mid,{number:g.number,light:g.light,gh});}
    else if(g.kind==='shop'){const sw=w-.8,sh=2.3;fbox(f,S.dark,[sw+.14,sh+.14,.1],mid,1.0+sh/2,.04);flit(f,sw,sh,mid,1.0+sh/2,.1,paint.pane(g.color||'#caa15e',{bars:g.bars??5,dim:g.dim??.5}),{px:24});fbox(f,trim,[sw+.2,.08,.2],mid,.96,.12);fbox(f,wall,[sw+.14,.9,.16],mid,.5,.06,{tint,ao:[.5,.9]});
     for(let i=1;i<3;i++)fbox(f,trim,[.06,sh,.06],s0+.4+sw*i/3,1.0+sh/2,.13);}
    else if(g.kind==='vent'){fbox(f,S.steel,[w-.9,1.3,.12],mid,2.2,.08,{ao:[.6,1]});for(let i=0;i<6;i++)fbox(f,S.dark,[w-1.1,.06,.05],mid,1.7+i*.2,.15);fbox(f,S.steel,[.5,.5,.6],mid,3.3,.3);}
    else if(g.kind==='model'){prop('shutter-front',at(f,mid,0,.02),f.yaw,{h:Math.min(gh,w*1.02)});}
    else{/* blank: meter boxes and a kick plate */fbox(f,S.dark,[w-.44,.5,.04],mid,.25,.03);if(w>2&&rand()<.8){const bs=s0+.6+rand()*(w-1.2);fbox(f,S.steel,[.5,.7,.16],bs,1.5,.09);fbox(f,S.steel,[.34,.44,.14],bs+.55,1.6,.08);fbox(f,trim,[.05,gh-1.9,.05],bs,1.85+(gh-1.9)/2,.05);}}
   }
   // the lintel band over the ground floor, with a run of conduit and a drip edge
   fbox(f,trim,[len,.34,.3],len/2,gh+.02,.14,{ao:[.7,1]});if(canopy)fbox(f,S.dark,[len,.05,.5],len/2,gh-.17,.25);
   fbox(f,S.steel,[len*.92,.07,.07],len/2,gh+.38,.06);fbox(f,S.rust,[len*.7,.05,.05],len*.4,gh+.5,.05);
   // ---- floors of windows ----
   const cw=2.5,cols=Math.max(1,Math.floor((len-.8)/cw)),pad=(len-cols*cw)/2,floors=Math.max(0,Math.floor((h-gh-1.1)/fh));out.floors=floors;
   for(let c=0;c<cols;c++)out.cols.push(pad+cw*(c+.5));
   const taken=new Set();
   for(let fl=0;fl<floors;fl++){const y=gh+.75+fl*fh+1.05;
    // a string course under each floor's windows
    if(fl%2===1)fbox(f,wall,[len,.14,.1],len/2,y-1.05,.05,{tint:tint.map(v=>v*.8)});
    for(let c=0;c<cols;c++){const sc=out.cols[c],r=rand();if(r<.06)continue;
     const k=r<.06+litRate?pick(LIT):pick([0,0,0,1,1,7]),ww=1.15,wh=1.6;
     fbox(f,S.dark,[ww+.16,wh+.16,.06],sc,y,.0);window(f,sc,y,ww,wh,k,.05);fbox(f,wall,[ww+.3,.09,.2],sc,y-wh/2-.08,.1,{tint:tint.map(v=>v*.9)});   // sill
     if(rand()<.3)fbox(f,S.rust,[ww+.24,.06,.34],sc,y+wh/2+.1,.17,{yaw:f.yaw});   // hood
     const q=rand();
     if(q<.14*dense+.04){prop('ac-cluster',at(f,sc+(rand()<.5?-.05:.05),y-wh/2-1.55,.02),f.yaw,{h:1.2+rand()*.5});fmark(f,.9,1.6,sc,y-wh/2-2.3,stain.streak(),.03);}
     else if(q<.24*dense+.04&&fl>0&&!taken.has(fl+':'+(c-1))){prop('balcony',at(f,sc,y-wh/2-.5,.02),f.yaw,{h:2.5});taken.add(fl+':'+c);}
     else if(q<.5*dense+.14){fbox(f,S.steel,[.8,.5,.4],sc,y-wh/2-.42,.24,{ao:[.7,1]});fbox(f,S.dark,[.5,.34,.02],sc,y-wh/2-.42,.45);}   // a single small AC
     if(rand()<.3)fmark(f,1.3,2.2,sc,y-wh/2-1.2,stain.streak(),.03);}}
   // ---- what runs up and along the wall ----
   if(pipes){const n=Math.max(1,Math.round(len/6*dense+.4));for(let i=0;i<n;i++){const ps=len*(i+.2+rand()*.6)/n,ph=h*(.7+rand()*.3);fbox(f,i%2?S.rust:S.steel,[.13,ph,.13],ps,ph/2,.09,{ao:[.5,1]});for(let y=2.6;y<ph;y+=3.1)fbox(f,S.dark,[.2,.06,.18],ps,y,.09);
     if(rand()<.6){const cy=gh+2+rand()*(h-gh-4);fbox(f,S.dark,[Math.min(len*.5,3+rand()*6),.06,.06],Math.min(len-1,Math.max(1,ps+(rand()-.5)*6)),cy,.06);}}
    for(let i=0;i<Math.round(len/9);i++){const bs=1+rand()*(len-2),by=gh+1+rand()*(h-gh-3);fbox(f,S.steel,[.4,.55,.18],bs,by,.1);}}
   if(escape&&floors>1&&len>7){const es=typeof escape==='number'?escape:len*.5;fireEscape(f,es,gh+.75,floors,fh);}
   // ---- parapet ----
   fbox(f,wall,[len,.7,.24],len/2,h+.35,-.02,{tint:tint.map(v=>v*.85)});fbox(f,trim,[len,.08,.34],len/2,h+.74,.0);
   return out;}
  /* A housing entrance: a recessed steel door with a wired-glass slit, a stoop, an intercom, a unit number, a mail bank and a caged lamp. It does not open. */
  function door(f,s,{number='1',light='#ffca8a',gh=4.2}={}){
   fbox(f,S.dark,[1.5,2.6,.12],s,1.3,.02);fbox(f,S.plate,[1.06,2.2,.07],s,1.16,.1,{tint:[.62,.66,.74],ao:[.5,1]});fbox(f,S.frame,[1.3,.12,.26],s,2.36,.13);for(const d of [-1,1])fbox(f,S.frame,[.12,2.4,.26],s+d*.62,1.2,.13);
   fbox(f,S.concrete,[1.7,.14,.6],s,.07,.3,{ao:[.6,1]});fbox(f,S.concrete,[1.3,.1,.3],s,.19,.17);   // stoop
   flit(f,.16,.7,s+.28,1.55,.14,paint.pane(light,{bars:3,dim:.75}),{px:60});fbox(f,S.steel,[.05,.3,.07],s-.36,1.1,.15);   // slit window, handle
   fbox(f,S.steel,[.3,.46,.06],s+.98,1.42,.05);flit(f,.24,.4,s+.98,1.42,.085,paint.intercom(),{px:160});
   flit(f,.44,.24,s,2.62,.09,paint.plate(String(number)),{px:140});
   fbox(f,S.steel,[.74,.42,.1],s-1.12,1.3,.06);for(let i=0;i<3;i++)fbox(f,S.dark,[.2,.03,.02],s-1.34+i*.22,1.4,.115);   // mail bank
   fbox(f,S.frame,[.2,.1,.24],s,2.96,.16);fbox(f,glow('door-lamp',light,.95),[.16,.2,.16],s,2.82,.2);wallWash(f,light,s,2.0,2.6,3.2,.4);const g=at(f,s,0,.9);groundWash(light,g[0],g[2],2.6,2.2,.3);
   return s;}
  // A fire escape: a landing at every floor, railings, and ladders between them.
  function fireEscape(f,s,y0,floors,fh){for(let fl=0;fl<floors;fl++){const y=y0+fl*fh;fbox(f,S.frame,[2.8,.06,.95],s,y,.5);fbox(f,S.frame,[2.8,.05,.04],s,y+.95,.95);fbox(f,S.frame,[2.8,.04,.03],s,y+.5,.95);for(const d of [-1.38,-.69,0,.69,1.38])fbox(f,S.frame,[.04,.95,.04],s+d,y+.47,.95);for(const d of [-1.38,1.38]){fbox(f,S.frame,[.04,.05,.95],s+d,y+.95,.5);fbox(f,S.rust,[.05,.5,.05],s+d,y-.25,.08,{yaw:f.yaw});}
    if(fl<floors-1){const ls=s+(fl%2?-.9:.9);for(const d of [-.2,.2])fbox(f,S.frame,[.04,fh,.04],ls+d,y+fh/2,.7);for(let r=.3;r<fh;r+=.34)fbox(f,S.frame,[.4,.03,.03],ls,y+r,.7);}}
   fbox(f,S.frame,[.04,2.2,.04],s-.9-.2,y0-1.1,.7);fbox(f,S.frame,[.04,2.2,.04],s-.9+.2,y0-1.1,.7);for(let r=.2;r<2.2;r+=.34)fbox(f,S.frame,[.4,.03,.03],s-.9,y0-2.2+r,.7);}
  // A roof: tar, plant, a tank, masts with a red lamp, a dish, a hut.
  function roof(x0,x1,z0,z1,h,{clutter=1,models=false}={}){quad(S.tar,[(x0+x1)/2,h+.02,(z0+z1)/2],[(x1-x0)/2,0,0],[0,0,(z1-z0)/2],[0,0,(x1-x0)/8,(z1-z0)/8],[.8,.8,.8]);
   const w=x1-x0,d=z1-z0,spot=()=>[x0+w*(.18+rand()*.64),z0+d*(.18+rand()*.64)];if(w<5||d<5)return;
   // modelled tanks and plant only where a builder asks (models): from the street a roof's middle is not seen, and every model is drawn in full wherever it stands
   if(rand()<.75*clutter){const [x,z]=spot();if(models)prop('water-tank',[x,h,z],rand()*6.28,{h:3+rand()*.9});else{cyl(S.rust,1.05,2.1,[x,h+2.15,z],{t:10});cyl(S.rust,.2,.5,[x,h+3.3,z],{t:10,top:.01});for(const [dx,dz] of [[-.7,-.7],[.7,-.7],[-.7,.7],[.7,.7]])box(S.frame,[.1,1.1,.1],[x+dx,h+.55,z+dz]);}}
   for(let i=0,n=Math.round((1+rand()*2)*clutter);i<n;i++){const [x,z]=spot(),yw=Math.floor(rand()*2)*Math.PI/2;if(models&&i===0)prop('roof-plant',[x,h,z],yw,{h:1.7+rand()*.7});else{box(S.steel,[2.6,1.3,1.5],[x,h+.75,z],{yaw:yw,ao:[.6,1]});box(S.frame,[2.8,.12,1.7],[x,h+.06,z],{yaw:yw});box(S.dark,[.9,.08,.9],[x,h+1.44,z],{yaw:yw});box(S.steel,[.7,.5,.7],[x+Math.cos(yw)*1.6,h+.6,z-Math.sin(yw)*1.6],{yaw:yw});}}
   if(rand()<.7){const [x,z]=spot(),mh=5+rand()*8;box(S.frame,[.1,mh,.1],[x,h+mh/2,z]);for(let k=1;k<=3;k++)box(S.frame,[1.6-k*.36,.04,.04],[x,h+mh*(.5+k*.14),z]);box(glow('beacon','#ff3b3b',1),[.16,.16,.16],[x,h+mh+.08,z]);}
   if(rand()<.6&&w>8&&d>8){const [x,z]=spot(),hw=2+rand()*2,hd=2+rand()*2,hh=2.4+rand();box(S.rustsheet,[hw,hh,hd],[x,h+hh/2,z],{tint:[.8,.8,.8],ao:[.6,1]});box(S.frame,[hw+.3,.1,hd+.3],[x,h+hh+.05,z]);}}
  /* A whole block: its body, a dressed face on every side listed, and a roof. faces: {n:{...dress options}, s:{}, e:{}, w:{}} (n = the side at larger z).
     Sides not listed are plain wall (they are hidden by neighbours, or far away). */
  function building([x0,x1,z0,z1],h,{wall=S.concrete,tint=pick(TINTS),faces={},y0=0,clutter=1,roofed=true,models=false}={}){
   const w=x1-x0,d=z1-z0;box(wall,[w,h-y0,d],[(x0+x1)/2,(y0+h)/2,(z0+z1)/2],{tint,ao:[y0?.7:.42,1],faces:roofed?'fbrl':'fbrld'});
   const F={s:face(x0,z0,x1,z0,0,-1),n:face(x0,z1,x1,z1,0,1),w:face(x0,z0,x0,z1,-1,0),e:face(x1,z0,x1,z1,1,0)},res={};
   for(const k of Object.keys(faces))res[k]={f:F[k],...dress(F[k],h,{wall,tint,...faces[k]})};
   if(roofed)roof(x0,x1,z0,z1,h,{clutter,models});return {F,res,h,rect:[x0,x1,z0,z1]};}
  /* A far tower: a plain block with a night facade (lit windows painted on), for the layers behind the street wall. One draw call for all of them per facade. */
  const towerM=['office','apartment','glass'].map((n,i)=>{const m=new B.StandardMaterial(name+'-tower-'+n,scene);m.diffuseTexture=file('facade-'+n+'-color');m.emissiveTexture=file('facade-'+n+'-glow');m.diffuseColor=new B.Color3(.3,.3,.36);m.specularColor=new B.Color3(.06,.06,.08);m.metadata={tile:[30,36,32][i]};own.push(m);return m;});
  function tower([x0,x1,z0,z1],h,k=0,{crown=true}={}){const m=towerM[k%3],w=x1-x0,d=z1-z0,x=(x0+x1)/2,z=(z0+z1)/2;box(m,[w,h,d],[x,h/2,z],{faces:'fbrl'});quad(S.tar,[x,h+.02,z],[w/2,0,0],[0,0,d/2],[0,0,w/8,d/8],[.6,.6,.6]);
   if(crown&&rand()<.6){const cw=w*(.4+rand()*.3),cd=d*(.4+rand()*.3),ch=3+rand()*9;box(m,[cw,ch,cd],[x,h+ch/2,z],{faces:'fbrlt'});if(rand()<.6){const mh=6+rand()*12;box(S.frame,[.25,mh,.25],[x,h+ch+mh/2,z]);box(glow('beacon','#ff3b3b',1),[.5,.5,.5],[x,h+ch+mh,z]);}}}

  // ---------------- lamps and real lights ----------------
  // A wall lamp on an arm with a pool of light under it.
  function wallLamp(f,s,y=4.6,c='#ffb35c',{arm=.9,coneK=1}={}){fbox(f,S.frame,[.06,.06,arm],s,y+.1,arm/2);fbox(f,S.frame,[.34,.12,.5],s,y,arm);fbox(f,glow('lamp-'+c,c,1.1),[.26,.05,.4],s,y-.08,arm);
   const p=at(f,s,y-.1,arm);cone(c,p,y-.1,1.7,{k:coneK});wallWash(f,c,s,y-1.2,4.5,5,.34);groundWash(c,p[0],p[2],5,5,.36);return p;}
  // A lamp that really lights things (Medium and up; Low has the pools and cones only).
  function light(p,c,intensity,range,{spot=null}={}){if(low)return null;const v=new B.Vector3(p[0],p[1],p[2]);const l=spot?new B.SpotLight(name+'-light',v,new B.Vector3(spot.dir[0],spot.dir[1],spot.dir[2]),spot.angle||1.5,spot.exp||1.5,scene):new B.PointLight(name+'-light',v,scene);
   l.diffuse=hex(c);l.specular=hex(c);l.intensity=intensity;l.range=range;l.parent=node;l.metadata={base:intensity};lights.push(l);return l;}

  // ---------------- wet ground ----------------
  /* ground(rects,{puddles}): wet asphalt over the rectangles [x0,x1,z0,z1]. Medium and up: the ground shows a mirror picture of whatever the builder hands to
     mirror(), softly; the puddles show it sharply. Low: glossy asphalt and dark glossy puddles with no picture. */
  let mirrorT=null;const mirrorList=[];
  function ground(rects,{puddles=[],y=0,tint='#6a6e78',tile=4}={}){
   const g=new B.StandardMaterial(name+'-ground',scene);g.diffuseTexture=file('road-color');g.bumpTexture=low?null:file('road-normal');g.diffuseColor=hex(tint);g.specularColor=new B.Color3(.42,.46,.5);g.specularPower=40;g.maxSimultaneousLights=8;g.metadata={tile,fx:true};own.push(g);
   g.emissiveColor=new B.Color3(.1,.105,.115);
   const p=new B.StandardMaterial(name+'-puddle',scene);p.diffuseColor=new B.Color3(.012,.016,.02);p.specularColor=new B.Color3(.8,.86,.95);p.specularPower=220;p.emissiveColor=new B.Color3(.012,.02,.024);p.zOffset=-1;p.metadata={tile:1,fx:true};own.push(p);
   const pt=tex('puddle-edge',128,128,(c,W,H)=>{c.clearRect(0,0,W,H);c.fillStyle='#fff';for(let i=0;i<9;i++){c.beginPath();c.ellipse(W*(.36+rand()*.28),H*(.36+rand()*.28),W*(.16+rand()*.16),H*(.14+rand()*.16),rand()*3,0,7);c.fill();}c.filter='blur(5px)';c.drawImage(c.canvas,0,0);c.filter='none';});pt.hasAlpha=true;p.opacityTexture=pt;
   if(!low){mirrorT=new B.MirrorTexture(name+'-mirror',{ratio:high?.75:.5},scene,true,0,B.Texture.TRILINEAR_SAMPLINGMODE);mirrorT.mirrorPlane=new B.Plane(0,-1,0,y+.01);mirrorT.clearColor=new B.Color4(.02,.035,.045,1);mirrorT.renderList=mirrorList;mirrorT.adaptiveBlurKernel=high?10:7;mirrorT.refreshRate=2;own.push(mirrorT);
    const gm=mirrorT,pm=mirrorT;g.reflectionTexture=gm;p.reflectionTexture=pm;gm.level=1;g.reflectionFresnelParameters=new B.FresnelParameters();g.reflectionFresnelParameters.bias=.04;g.reflectionFresnelParameters.power=3;g.reflectionFresnelParameters.leftColor=new B.Color3(.6,.6,.6);g.reflectionFresnelParameters.rightColor=new B.Color3(.04,.04,.04);
    p.reflectionFresnelParameters=new B.FresnelParameters();p.reflectionFresnelParameters.bias=.45;p.reflectionFresnelParameters.power=1.5;p.reflectionFresnelParameters.leftColor=B.Color3.White();p.reflectionFresnelParameters.rightColor=new B.Color3(.5,.5,.5);}
   for(const [x0,x1,z0,z1] of rects)quad(g,[(x0+x1)/2,y,(z0+z1)/2],[(x1-x0)/2,0,0],[0,0,(z1-z0)/2],[x0/tile,z0/tile,x1/tile,z1/tile]);
   for(const [x,z,rx,rz,yaw=0] of puddles){const [ax,ay]=groundAxes(yaw);quad(p,[x,y+.008,z],[ax[0]*rx,0,ax[2]*rx],[ay[0]*rz,0,ay[2]*rz]);}
   return {ground:g,puddle:p};}
  // Hand meshes to the mirror (ships, gates, anything the builder wants seen in the wet ground).
  function mirror(...meshes){for(const m of meshes.flat())if(m&&!mirrorList.includes(m))mirrorList.push(m);}

  // ---------------- particles ----------------
  let puffT=null;
  function steam([x,y,z],{rate=14,size=[.5,1.4],life=[2,4],up=.55,color=[.75,.78,.8],alpha=.16,box:bx=[.3,.1,.3],cap=90}={}){if(!B.ParticleSystem)return null;if(!puffT){puffT=tex('puff',64,64,(g,W,H)=>{const gr=g.createRadialGradient(W/2,H/2,0,W/2,H/2,W/2);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.5,'rgba(255,255,255,.4)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,W,H);});puffT.hasAlpha=true;}
   const ps=new B.ParticleSystem(name+'-steam',low?Math.ceil(cap/2):cap,scene);ps.particleTexture=puffT;ps.emitter=new B.Vector3(x,y,z);ps.minEmitBox=new B.Vector3(-bx[0],0,-bx[2]);ps.maxEmitBox=new B.Vector3(bx[0],bx[1],bx[2]);ps.direction1=new B.Vector3(-.12,up,-.12);ps.direction2=new B.Vector3(.16,up*1.5,.14);ps.minLifeTime=life[0];ps.maxLifeTime=life[1];ps.minSize=size[0];ps.maxSize=size[1];ps.emitRate=low?rate/2:rate;ps.minEmitPower=.5;ps.maxEmitPower=1;ps.gravity=new B.Vector3(.04,.05,0);
   ps.addSizeGradient(0,.4);ps.addSizeGradient(1,1.6);ps.color1=new B.Color4(color[0],color[1],color[2],alpha);ps.color2=new B.Color4(color[0]*.9,color[1]*.9,color[2]*.9,alpha*.7);ps.colorDead=new B.Color4(color[0],color[1],color[2],0);ps.blendMode=B.ParticleSystem.BLENDMODE_STANDARD;ps.minAngularSpeed=-.4;ps.maxAngularSpeed=.4;ps.preWarmCycles=60;ps.start();systems.push(ps);return ps;}

  // ---------------- finish ----------------
  const made=[];
  function finish(){if(finished)return made;finished=true;litSheet.flush();markSheet.flush();
   for(const [m,b] of batches){if(!b.i.length)continue;const mesh=new B.Mesh(name+'-batch-'+(m.name||'m'),scene),vd=new B.VertexData();vd.positions=b.p;vd.normals=b.n;vd.uvs=b.u;vd.colors=b.c;vd.indices=b.i;vd.applyToMesh(mesh);mesh.material=m;mesh.parent=node;mesh.isPickable=false;mesh.receiveShadows=false;mesh.useVertexColors=true;mesh.hasVertexAlpha=false;
    if(m===markM||m===shadeM||m.metadata?.fx&&m.alphaMode===B.Engine.ALPHA_ADD)mesh.alphaIndex=m===markM?2:m===shadeM?1:3;mesh.freezeWorldMatrix();made.push(mesh);}
   for(const [m,list] of loose){const g=list.length>1?B.Mesh.MergeMeshes(list,true,true,undefined,false,false):list[0];if(!g)continue;g.material=m;g.parent=node;g.isPickable=false;g.freezeWorldMatrix();made.push(g);}
   batches.clear();loose.clear();
   // the mirror shows the solid city (walls, windows, signs, props), not the ground, the light effects or the marks
   for(const m of made)if(!m.material?.metadata?.fx&&m.material!==markM)mirror(m);
   // modelled props are drawn in full wherever a copy stands, so they are kept out of the glow pass (they do not glow), and the small or high ones out of the mirror
   const gl0=scene.effectLayers?.find(l=>l.name==='void-glow');onProp=st=>{if(PROPS[st.id]?.mirror!==false)mirror(st.meshes);if(gl0&&!low)for(const m of st.meshes)gl0.addExcludedMesh(m);};loadProps();for(const st of propState.values())if(st.ready)onProp(st);
   // the glow layer must not bloom the soft light effects into white fog
   const gl=scene.effectLayers?.find(l=>l.name==='void-glow');if(gl)for(const m of made)if(m.material?.metadata?.fx)gl.addExcludedMesh(m);
   return made;}
  function tick(dt,time){for(const t of tickers)t(dt,time);}
  function dispose(){if(disposed)return;disposed=true;for(const ps of systems)ps.dispose();for(const l of lights)l.dispose();for(const c of containers){try{c.dispose();}catch{}}node.dispose(false,false);for(const o of own){try{o.dispose(false,true);}catch{try{o.dispose();}catch{}}}own.length=0;}
  return {B,scene,node,low,high,quality,S,TINTS,WHITE,PROPS,TURN,standIns,rand,reseed,pick,surf,glow,tex,file,hex,quad,box,cyl,tube,cable,keep,boxes,face,at,fbox,flit,fmark,window,winUV,LIT,lit,litAgain,mark,markAgain,groundMark,paint,stain,wallWash,groundWash,shade,cone,
   prop,loadProps,dress,door,fireEscape,roof,building,tower,wallLamp,light,lights,ground,mirror,steam,finish,tick,tickers,dispose,late,own,get mirrorTexture(){return mirrorT;},get disposed(){return disposed;},props:propState};
 }
 root.VoidCityKit={create,PROPS,PROP_DIR};
})(typeof globalThis!=='undefined'?globalThis:this);
