/* The VR suite's apartment (vr-suite.js puts the companion and the interactions in it): a dark, private bedroom high
   above NeoChinatown at night. Built here in code: upholstered bed, sofa and lounge chair from rounded shapes, draped
   bedding and heavy curtains, a fluted walnut feature wall, concealed LED strips with painted light washes, and a
   layered city beyond the glass (lit towers, Chinese neon, Tessaly ads, flying traffic, street glow and haze).
   Parts that share a material are merged, so the room and the city draw in a few dozen calls.
   Textures: ambientCG and Poly Haven (CC0) or painted here; the calathea plants are Poly Haven (CC0). */
(function(){
 const rng=seed=>{let s=seed>>>0;return ()=>((s=(s*1664525+1013904223)>>>0)/4294967296);};
 // ---- Geometry: plain arrays {p,n,uv,i}; triangles are wound to face their normals ----
 function wind(d){const P=d.p,N=d.n,I=d.i;for(let t=0;t<I.length;t+=3){const a=I[t]*3,b=I[t+1]*3,c=I[t+2]*3,ux=P[a]-P[b],uy=P[a+1]-P[b+1],uz=P[a+2]-P[b+2],vx=P[c]-P[b],vy=P[c+1]-P[b+1],vz=P[c+2]-P[b+2];
   if((uy*vz-uz*vy)*(N[a]+N[b]+N[c])+(uz*vx-ux*vz)*(N[a+1]+N[b+1]+N[c+1])+(ux*vy-uy*vx)*(N[a+2]+N[b+2]+N[c+2])<0){const x=I[t+1];I[t+1]=I[t+2];I[t+2]=x;}}return d;}
 // A box, or with r a rounded box (k: 1 puffy like a pillow, 6 crisp like upholstery). UVs are in metres.
 function box([w,h,d],r=0,k=6,N=r?8:1){const I=[w/2-r,h/2-r,d/2-r],p=[],n=[],uv=[],i=[];
  for(let a=0;a<3;a++)for(const s of [-1,1]){const u=(a+1)%3,v=(a+2)%3,b0=p.length/3;
   for(let y=0;y<=N;y++)for(let x=0;x<=N;x++){const c=[0,0,0];c[a]=s;c[u]=Math.sin((-1+2*x/N)*Math.PI/2);c[v]=Math.sin((-1+2*y/N)*Math.PI/2);
    let q;if(r){const e=c.map(t=>Math.sign(t)*Math.abs(t)**k),l=Math.hypot(...e);q=e.map(t=>t/l);}else{q=[0,0,0];q[a]=s;}
    const P=c.map((t,j)=>t*I[j]+r*q[j]);p.push(...P);n.push(...q);if(a===1)uv.push(P[0],P[2]);else uv.push(P[2-a],P[1]);}
   for(let y=0;y<N;y++)for(let x=0;x<N;x++){const A=b0+y*(N+1)+x;i.push(A,A+1,A+N+2,A,A+N+2,A+N+1);}}
  return wind({p,n,uv,i});}
 // A cloth or curved surface: f(u,v) -> [x,y,z,U,V]; ref is roughly the side that should face out.
 function sheet(nu,nv,f,ref){const p=[],uv=[],i=[],n=[];for(let y=0;y<=nv;y++)for(let x=0;x<=nu;x++){const q=f(x/nu,y/nv);p.push(q[0],q[1],q[2]);uv.push(q[3],q[4]);}
  for(let y=0;y<nv;y++)for(let x=0;x<nu;x++){const A=y*(nu+1)+x;i.push(A,A+1,A+nu+2,A,A+nu+2,A+nu+1);}
  BABYLON.VertexData.ComputeNormals(p,i,n);const m=(Math.floor(nv/2)*(nu+1)+Math.floor(nu/2))*3;
  if(n[m]*ref[0]+n[m+1]*ref[1]+n[m+2]*ref[2]<0){for(let t=0;t<i.length;t+=3){const x=i[t+1];i[t+1]=i[t+2];i[t+2]=x;}for(let j=0;j<n.length;j++)n[j]=-n[j];}
  return {p,n,uv,i};}
 // A flat quad: centre, right and up unit vectors, size and texture rectangle. It faces up × right.
 function quad(c,R,U,w,h,[u0,v0,u1,v1]=[0,0,1,1]){const N=[U[1]*R[2]-U[2]*R[1],U[2]*R[0]-U[0]*R[2],U[0]*R[1]-U[1]*R[0]],p=[],n=[];
  for(const [sx,sy] of [[-1,-1],[1,-1],[1,1],[-1,1]]){for(let j=0;j<3;j++)p.push(c[j]+R[j]*sx*w/2+U[j]*sy*h/2);n.push(...N);}
  return wind({p,n,uv:[u0,v0,u1,v0,u1,v1,u0,v1],i:[0,1,2,0,2,3]});}
 const from=m=>{const d={p:[...m.getVerticesData('position')],n:[...m.getVerticesData('normal')],uv:[...(m.getVerticesData('uv')||[])],i:[...m.getIndices()]};m.dispose();return d;};
 const scaleUV=(d,s)=>({...d,uv:d.uv.map(x=>x*s)});
 // Geometry gathered per material and built as one mesh each.
 function batches(k){const B=k.B,groups=new Map(),meshes=[];
  const add=(mat,d,pos=[0,0,0],rot=0,s=1)=>{let g=groups.get(mat);if(!g)groups.set(mat,g={p:[],n:[],uv:[],i:[]});const r=typeof rot==='number'?[0,rot,0]:rot,
    M=B.Matrix.Compose(new B.Vector3(s,s,s),B.Quaternion.RotationYawPitchRoll(r[1],r[0],r[2]),new B.Vector3(...pos)),o=new B.Vector3(),b=g.p.length/3;
   for(let j=0;j<d.p.length;j+=3){B.Vector3.TransformCoordinatesFromFloatsToRef(d.p[j],d.p[j+1],d.p[j+2],M,o);g.p.push(o.x,o.y,o.z);B.Vector3.TransformNormalFromFloatsToRef(d.n[j],d.n[j+1],d.n[j+2],M,o);o.normalize();g.n.push(o.x,o.y,o.z);}
   for(const x of d.uv)g.uv.push(x);for(const x of d.i)g.i.push(x+b);};
  // A group of parts placed and turned together (furniture): local position and rotation inside it.
  const group=(origin,yaw)=>(mat,d,p=[0,0,0],rot=0)=>{const r=typeof rot==='number'?[0,rot,0]:rot,c=Math.cos(yaw),s=Math.sin(yaw);add(mat,d,[origin[0]+p[0]*c+p[2]*s,origin[1]+p[1],origin[2]-p[0]*s+p[2]*c],[r[0],r[1]+yaw,r[2]]);};
  const build=name=>{const out=[];for(const [mat,g] of groups){const m=new B.Mesh('vr-'+name+'-'+mat.name,k.scene),v=new B.VertexData();v.positions=g.p;v.normals=g.n;v.uvs=g.uv;v.indices=g.i;v.applyToMesh(m);k.mesh(m,mat);out.push(m);meshes.push(m);}groups.clear();return out;};
  return {add,group,build,meshes};}
 const hex=(B,h,l=1)=>B.Color3.FromHexString(h).scale(l);
 const FACE={up:[[1,0,0],[0,0,1]],down:[[1,0,0],[0,0,-1]],east:[[0,0,1],[0,1,0]],west:[[0,0,-1],[0,1,0]],south:[[1,0,0],[0,1,0]],north:[[-1,0,0],[0,1,0]]};
 // Additive light washes: a flat emissive colour, shaped by a greyscale mask used as opacity.
 // Light atlas cells: radial pool, halo around a rectangle, glow along edges, wash fading from one end.
 const CELL=[[0,.5],[.5,.5],[0,0],[.5,0]].map(([u,v])=>[u+.008,v+.008,u+.492,v+.492]),flipV=([u0,v0,u1,v1])=>[u0,v1,u1,v0];

 async function build(k,ctx){
  const B=k.B,scene=k.scene,low=ctx.quality==='low',high=ctx.quality==='high',b=batches(k),tick=[];
  // ---- Textures ----
  const T=(path,scale)=>{const t=k.own(new B.Texture(new URL(path,k.base).href,scene));t.uScale=t.vScale=scale;t.wrapU=t.wrapV=B.Texture.WRAP_ADDRESSMODE;return t;};
  const mat=(name,h,{spec=.08,power=32,color,normal,scale=1,bump=1,fresnel}={})=>{const m=k.own(new B.StandardMaterial('vr-suite-'+name,scene));m.diffuseColor=hex(B,h);m.specularColor=new B.Color3(spec,spec,spec);m.specularPower=power;
   if(color)m.diffuseTexture=T(color,scale);if(normal){m.bumpTexture=T(normal,scale);m.bumpTexture.level=bump;}m.maxSimultaneousLights=8;
   // Velvet and silk: a faint self-glow of their own colour so they read in the dark.
   if(fresnel)m.emissiveColor=hex(B,fresnel,.12);return m;};
  const atlas=k.paint('suite-light',512,512,g=>{const img=g.createImageData(512,512);
   for(let y=0;y<512;y++)for(let x=0;x<512;x++){const cell=(y<256?0:2)+(x<256?0:1),u=(x%256-4)/247,v=(y%256-4)/247;let a=0;
    if(u>=0&&u<=1&&v>=0&&v<=1){const dx=Math.abs(u-.5)*2,dy=Math.abs(v-.5)*2;
     if(cell===0)a=Math.max(0,1-Math.hypot(dx,dy))**2.2;
     else if(cell===1){const ex=Math.max(0,dx-.56)/.44,ey=Math.max(0,dy-.5)/.5;a=Math.max(0,1-Math.hypot(ex,ey))**1.7;}
     else if(cell===2){const e=Math.min(1-dx,1-dy);a=Math.min(1,Math.exp(-e*6)*.8+Math.exp(-e*2)*.06);}
     else a=(1-v)**1.7*Math.max(0,Math.sin(Math.PI*u))**1.2;}
    const i=(y*512+x)*4,c=Math.round(a*255);img.data[i]=img.data[i+1]=img.data[i+2]=c;img.data[i+3]=255;}g.putImageData(img,0,0);});atlas.getAlphaFromRGB=true;
  const marble=k.paint('suite-marble',512,512,g=>{const r=rng(7);g.fillStyle='#141217';g.fillRect(0,0,512,512);for(let n=0;n<30;n++){g.strokeStyle='rgba('+(190+r()*50|0)+','+(170+r()*40|0)+','+(185+r()*45|0)+','+(.04+r()*.16)+')';g.lineWidth=.4+r()*2.4;g.beginPath();let x=r()*512,y=-10;g.moveTo(x,y);while(y<520){x+=(r()-.5)*70;y+=18+r()*30;g.lineTo(x,y);}g.stroke();}});
  // The painting over the sofa: a neon moon over dark water and ink towers, with a red seal.
  const art=k.paint('suite-art',1024,560,g=>{const W=1024,H=560,r=rng(23),bg=g.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#0b0710');bg.addColorStop(.62,'#1c0b1e');bg.addColorStop(1,'#08060b');g.fillStyle=bg;g.fillRect(0,0,W,H);
   const moon=g.createRadialGradient(W*.66,H*.36,4,W*.66,H*.36,H*.3);moon.addColorStop(0,'rgba(255,214,232,.95)');moon.addColorStop(.35,'rgba(255,92,170,.7)');moon.addColorStop(1,'rgba(120,30,110,0)');g.fillStyle=moon;g.fillRect(0,0,W,H);
   for(let i=0;i<14;i++){const x=40+i*58+r()*30,h=H*(.2+r()*.42);g.fillStyle='rgba(6,4,9,'+(.75+r()*.25)+')';g.fillRect(x,H*.64-h,26+r()*40,h);}
   g.globalCompositeOperation='lighter';for(let i=0;i<70;i++){const y=H*.66+r()*H*.3,x=W*.66+(r()-.5)*W*.5*(1-(y-H*.66)/(H*.4));g.strokeStyle='rgba(255,'+(70+r()*90|0)+',170,'+(.08+r()*.25)+')';g.lineWidth=1+r()*4;g.beginPath();g.moveTo(x-20-r()*60,y);g.lineTo(x+20+r()*60,y);g.stroke();}
   g.strokeStyle='rgba(214,170,96,.55)';g.lineWidth=2;g.beginPath();g.arc(W*.66,H*.36,H*.21,Math.PI*.9,Math.PI*1.9);g.stroke();g.globalCompositeOperation='source-over';
   g.fillStyle='#a3162c';g.fillRect(W*.88,H*.78,44,44);g.fillStyle='#ffe9ee';g.font='bold 32px "Microsoft JhengHei","PingFang TC","Noto Sans CJK TC",serif';g.textAlign='center';g.fillText('夜',W*.88+22,H*.78+34);});
  // ---- Materials ----
  const wood=mat('walnut','#6b4a3a',{color:'textures/wood-floor-color.jpg',normal:'textures/wood-floor-normal.jpg',scale:.7,spec:.22,power:48});
  const floor=mat('floor','#5d4a43',{color:'textures/wood-floor-color.jpg',normal:'textures/wood-floor-normal.jpg',scale:.45,spec:.32,power:64});
  const plaster=mat('plaster','#45424a',{color:'../textures/ncz/concrete-old-color.jpg',normal:'../textures/ncz/concrete-old-normal.jpg',scale:.3,spec:.04,bump:.6});
  const panel=mat('panel','#2a292f',{normal:'../textures/ncz/concrete-old-normal.jpg',scale:.5,spec:.14,power:24,bump:.25});
  const ceiling=mat('ceiling','#16141b',{spec:.02});
  const stone=k.own(new B.StandardMaterial('vr-suite-marble',scene));stone.diffuseTexture=marble;stone.diffuseColor=hex(B,'#ffffff');stone.specularColor=new B.Color3(.7,.68,.72);stone.specularPower=96;stone.maxSimultaneousLights=8;
  const metal=mat('bronze','#7a6656',{spec:.85,power:72});const black=mat('black','#0d0c10',{spec:.25,power:48});
  const velvet=mat('velvet','#3b2134',{color:'textures/fabric-color.jpg',normal:'textures/fabric-normal.jpg',scale:2.2,spec:.05,fresnel:'#4a1f3c'});
  const duvet=mat('duvet','#2c2833',{color:'textures/fabric-color.jpg',normal:'textures/fabric-normal.jpg',scale:2.6,spec:.06,fresnel:'#22202c'});
  const linen=mat('linen','#7d6a74',{color:'textures/fabric-color.jpg',normal:'textures/fabric-normal.jpg',scale:3,spec:.05});
  const accent=mat('accent','#7a1650',{color:'textures/fabric-color.jpg',normal:'textures/fabric-normal.jpg',scale:2.5,spec:.06,fresnel:'#a0306a'});
  const curtainMat=mat('curtain','#2a2027',{color:'textures/fabric-color.jpg',normal:'textures/fabric-normal.jpg',scale:2,spec:.04,fresnel:'#2c1830'});curtainMat.backFaceCulling=false;
  const leather=mat('leather','#2b1d1a',{normal:'textures/fabric-normal.jpg',scale:1.5,spec:.32,power:40,bump:.3});
  const rugMat=mat('rug','#3a3036',{color:'textures/carpet-color.jpg',normal:'textures/carpet-normal.jpg',scale:.8,spec:.02});
  const wax=mat('wax','#e8d8c4',{spec:.1});const ceramic=mat('ceramic','#1b1820',{spec:.6,power:80});
  const glass=mat('glass','#1c2030',{spec:.7,power:128});glass.alpha=.12;glass.backFaceCulling=false;
  const paintMat=k.own(new B.StandardMaterial('vr-suite-art',scene));paintMat.diffuseTexture=art;paintMat.specularColor=new B.Color3(.05,.05,.05);paintMat.maxSimultaneousLights=8;paintMat.emissiveColor=new B.Color3(.08,.05,.08);
  const led={mag:k.glow('suite-led-mag','#ff2d96',1.6),vio:k.glow('suite-led-vio','#7b45ff',1.3),amb:k.glow('suite-led-amb','#ffae5c',1.2)},flame=k.glow('suite-flame','#ffb050',1.6),globe=k.glow('suite-globe','#ffc27a',1.3);
  const washMat=name=>{const m=k.own(new B.StandardMaterial('vr-suite-wash-'+name,scene));m.opacityTexture=atlas;m.diffuseColor=B.Color3.Black();m.disableLighting=true;m.alphaMode=B.Engine.ALPHA_ADD;m.alpha=.99;m.fogEnabled=false;m.backFaceCulling=false;m.disableDepthWrite=true;return m;};
  const wash={mag:washMat('mag'),vio:washMat('vio'),amb:washMat('amb'),city:washMat('city'),cyan:washMat('cyan')};wash.cyan.emissiveColor=hex(B,'#3fc8ff',.35);
  const W=(m,c,face,w,h,cell,flip)=>{const [R,U]=FACE[face];b.add(m,quad(c,R,U,w,h,flip?flipV(CELL[cell]):CELL[cell]));};
  // ---- Shell: walnut floor, charcoal plaster, a soffit with a violet cove, a dark recessed ceiling ----
  b.add(floor,box([12.2,.1,10.2]),[0,-.05,0]);b.add(ceiling,box([12.2,.1,10.2]),[0,3.6,0]);
  b.add(plaster,box([12.4,3.7,.2]),[0,1.8,5.1]);b.add(plaster,box([12.4,3.7,.2]),[0,1.8,-5.1]);b.add(plaster,box([.2,3.7,10.4]),[-6.1,1.8,0]);
  for(const [s,p] of [[[12.2,.4,.8],[0,3.1,4.6]],[[12.2,.4,.8],[0,3.1,-4.6]],[[.8,.4,8.4],[-5.6,3.1,0]],[[.8,.4,8.4],[5.6,3.1,0]]])b.add(plaster,box(s),p);
  for(const [s,p,l] of [[[10.4,.03,.03],[0,3.315,4.27],[[10.4,.08,.025],[0,3.34,4.2]]],[[10.4,.03,.03],[0,3.315,-4.27],[[10.4,.08,.025],[0,3.34,-4.2]]],[[.03,.03,8.4],[-5.27,3.315,0],[[.025,.08,8.4],[-5.2,3.34,0]]],[[.03,.03,8.4],[5.27,3.315,0],[[.025,.08,8.4],[5.2,3.34,0]]]]){b.add(led.vio,box(s),p);b.add(plaster,box(l[0]),l[1]);}
  W(wash.vio,[0,3.545,0],'down',10.3,8.3,2);
  // Downlights in the soffit, each throwing a soft scallop down the wall.
  for(const [x,z,face] of [[-5.6,-3.4,'east'],[-5.6,2.4,'east'],[-3.8,-4.6,'south'],[-.8,-4.6,'south'],[3.6,-4.6,'south']]){b.add(led.amb,from(B.MeshBuilder.CreateCylinder('d',{diameter:.09,height:.02,tessellation:12},scene)),[x,2.895,z]);
   const wx=face==='east'?-5.965:x,wz=face==='south'?-4.985:z;W(wash.amb,[wx,2.15,wz],face,1.3,1.6,3);}
  // West wall: large charcoal panels with reveals.
  for(const z of [-3.75,-1.25,1.25,3.75])b.add(panel,box([.03,2.82,2.36]),[-5.985,1.43,z]);
  // ---- The feature wall: fluted walnut behind the bed, framed by magenta light ----
  for(let x=-3.2;x<=3.21;x+=.085)b.add(wood,box([.05,2.88,.04]),[x,1.44,4.98]);
  for(const s of [-1,1]){b.add(led.mag,box([.025,2.88,.025]),[s*3.27,1.44,4.975]);W(wash.mag,[s*3.05,1.44,4.94],'north',.9,3.1,0);}
  // Headboard: deep channel-tufted velvet, floating, with a magenta halo on the wall behind it.
  b.add(black,box([3.38,1.42,.06]),[0,1.15,4.9]);for(let i=0;i<11;i++)b.add(velvet,box([.3,1.36,.16],.07,2,6),[-1.5+i*.3,1.15,4.8]);
  W(wash.mag,[0,1.15,4.935],'north',5.2,2.7,1);
  // ---- The bed: a low walnut platform on a hidden plinth lit from beneath ----
  b.add(black,box([2.6,.2,2.3]),[0,.1,3.55]);for(const [s,p] of [[[2.6,.02,.02],[0,.04,2.39]],[[.02,.02,2.3],[-1.31,.04,3.55]],[[.02,.02,2.3],[1.31,.04,3.55]]])b.add(led.mag,box(s),p);
  W(wash.mag,[0,.018,3.4],'up',4.3,3.9,1);
  b.add(wood,box([3,.1,2.7],.02,6,3),[0,.25,3.55]);b.add(linen,box([2.8,.26,2.4],.07,4,6),[0,.43,3.55]);
  // Cloth that lies on top and drapes over the sides (and foot): s runs across, t along the bed.
  const drape=(e,r=.08)=>{const arc=Math.PI*r/2;return e<arc?[r*Math.sin(e/r),r*(1-Math.cos(e/r))]:[r+(e-arc)*.06,r+(e-arc)];};
  const cloth=({half=1.4,over=.34,t0,t1,foot,top,zFoot,fold=1})=>sheet(52,34,(u,v)=>{const s=(u*2-1)*(half+over),t=t0+(t1-t0)*v,ex=Math.max(0,Math.abs(s)-half),ez=foot?Math.max(0,-t):0,[ox,dx]=drape(ex),[oz,dz]=drape(ez);
    let x=Math.sign(s)*(Math.min(Math.abs(s),half)+ox),z=zFoot+Math.max(t,0)-oz,y=top-Math.max(dx,dz);
    y+=fold*(.012*Math.sin(s*6.3+1)*Math.sin(t*4.1)+.007*Math.sin(s*13+t*7))*(1-Math.min(1,Math.max(ex,ez)*6));x+=Math.sign(s)*.022*Math.sin(z*9)*Math.min(1,ex*4);z-=.022*Math.sin(x*8)*Math.min(1,ez*4);
    return [x,y,z,s,t];},[0,1,0]);
  b.add(duvet,cloth({t0:-.34,t1:1.62,foot:true,top:.585,zFoot:2.35}));
  b.add(linen,box([2.9,.07,.3],.03,2,6),[0,.6,4.02]);
  b.add(accent,cloth({half:1.42,over:.3,t0:.3,t1:.85,top:.612,zFoot:2.35,fold:.6}));
  for(const s of [-1,1]){b.add(duvet,box([.82,.58,.2],.09,1.5,8),[s*.46,.86,4.66],[-.28,0,0]);b.add(linen,box([.76,.2,.5],.09,1.4,8),[s*.47,.68,4.3],[-.12,0,0]);}
  b.add(accent,box([.5,.32,.14],.07,1.4,8),[0,.8,4.44],[-.22,0,0]);
  b.add(rugMat,box([4.6,.012,3.6]),[0,.006,2.7]);
  // Floating walnut nightstands with marble tops, pendant lamps, candles, books and a vase.
  for(const s of [-1,1]){const x=s*2.15;b.add(wood,box([.62,.3,.44]),[x,.48,4.76]);b.add(stone,box([.66,.025,.47]),[x,.645,4.75]);b.add(led.amb,box([.56,.015,.015]),[x,.325,4.56]);
   W(wash.amb,[x,.016,4.55],'up',1.3,1.1,0);W(wash.amb,[x,1.2,4.935],'north',1.5,1.5,0);
   b.add(metal,from(B.MeshBuilder.CreateCylinder('c',{diameter:.01,height:1.63,tessellation:6},scene)),[x,2.085,4.55]);b.add(metal,from(B.MeshBuilder.CreateCylinder('c',{diameterTop:.03,diameterBottom:.09,height:.05,tessellation:16},scene)),[x,1.285,4.55]);
   b.add(globe,from(B.MeshBuilder.CreateSphere('g',{diameter:.2,segments:12},scene)),[x,1.17,4.55]);}
  for(const [h,y,c] of [[.035,.675,accent],[.03,.708,velvet],[.025,.735,linen]])b.add(c,box([.24,h,.17]),[-2.28,y,4.72],.2);
  const candles=[[-2.02,.66,4.62,.1],[-2.9,.39,-.95,.12],[-2.75,.39,-.4,.08],[-2.85,.39,-.65,.15],[3.66,.56,-2.82,.1]];
  for(const [x,y,z,h] of candles){b.add(wax,from(B.MeshBuilder.CreateCylinder('w',{diameter:.07,height:h,tessellation:14},scene)),[x,y+h/2,z]);b.add(flame,box([.018,.04,.018],.008,1,4),[x,y+h+.03,z]);}
  b.add(ceramic,from(B.MeshBuilder.CreateCylinder('v',{diameterTop:.08,diameterBottom:.16,height:.32,tessellation:20},scene)),[2.25,.82,4.78]);b.add(metal,from(B.MeshBuilder.CreateSphere('s',{diameter:.12,segments:10},scene)),[2.0,.72,4.7]);
  // ---- Lounge: a low velvet sofa, marble coffee table, a slim floor lamp and the painting ----
  b.add(rugMat,box([2.9,.012,3.6]),[-3.75,.006,-.5]);
  b.add(velvet,box([.95,.32,2.6],.05,5,6),[-4.75,.24,-.5]);for(const z of [-1.7,.7])for(const x of [-5.1,-4.4])b.add(metal,box([.05,.08,.05]),[x,.04,z]);
  for(const z of [-1.07,.07]){b.add(velvet,box([.74,.17,1.13],.07,2.2,8),[-4.62,.48,z]);b.add(velvet,box([.2,.5,1.13],.08,2,8),[-5.1,.79,z],[0,0,.12]);}
  for(const z of [-1.72,.72])b.add(velvet,box([.95,.5,.16],.06,4,6),[-4.75,.42,z]);
  b.add(accent,box([.14,.38,.38],.07,1.4,8),[-4.95,.74,.42],[0,.25,.1]);
  b.add(stone,box([.7,.04,1.25],.015,6,3),[-2.8,.37,-.7]);for(const z of [-1.2,-.2])b.add(metal,box([.6,.35,.03]),[-2.8,.175,z]);
  b.add(metal,from(B.MeshBuilder.CreateCylinder('l',{diameter:.3,height:.03,tessellation:24},scene)),[-5.5,.015,-2.6]);b.add(metal,from(B.MeshBuilder.CreateCylinder('l',{diameter:.02,height:1.65,tessellation:8},scene)),[-5.5,.84,-2.6]);
  b.add(led.amb,from(B.MeshBuilder.CreateCylinder('l',{diameter:.045,height:1.05,tessellation:12},scene)),[-5.46,1.05,-2.6]);W(wash.amb,[-5.965,1.15,-2.6],'east',2.2,2.4,0);W(wash.amb,[-5.45,.016,-2.6],'up',1.6,1.6,0);
  b.add(paintMat,quad([-5.95,1.75,-.5],...FACE.east,2.1,1.15));b.add(metal,box([.03,1.21,2.16]),[-5.965,1.75,-.5]);b.add(metal,box([.07,.035,1.1]),[-5.9,2.42,-.5]);W(wash.amb,[-5.94,1.8,-.5],'east',2.5,1.5,3);
  // ---- South wall: a backlit walnut shelf over a credenza, and the floating desk with its holo screen ----
  b.add(wood,box([2.6,.4,.44]),[-2.3,.2,-4.78]);b.add(black,box([2.5,.04,.4]),[-2.3,.02,-4.76]);
  for(const x of [-3.52,-1.08])b.add(wood,box([.04,1.92,.3]),[x,1.36,-4.85]);for(const y of [.42,.98,1.56,2.3])b.add(wood,box([2.48,.035,.3]),[-2.3,y,-4.85]);
  b.add(k.glow('suite-shelf-back','#c8743a',.14),box([2.42,1.86,.01]),[-2.3,1.36,-4.995]);
  {const r=rng(5);for(const y of [.44,1.0,1.58])for(let x=-3.4;x<-1.25;){if(r()<.3){b.add(r()<.5?ceramic:metal,from(B.MeshBuilder.CreateCylinder('o',{diameterTop:.05+r()*.06,diameterBottom:.1+r()*.05,height:.14+r()*.18,tessellation:14},scene)),[x+.08,y+.12,-4.86]);x+=.26;continue;}
    const n=3+Math.floor(r()*6);for(let j=0;j<n;j++){const h=.2+r()*.12;b.add([velvet,accent,linen,black][Math.floor(r()*4)],box([.035,h,.2]),[x,y+h/2,-4.86]);x+=.04;}x+=.12;}}
  b.add(wood,box([1.8,.05,.6]),[1.4,.75,-4.7]);b.add(black,box([1.7,.1,.5]),[1.4,.675,-4.72]);b.add(led.vio,box([1.6,.015,.015]),[1.4,.62,-4.47]);W(wash.vio,[1.4,.33,-4.985],'south',2.2,.8,3);
  b.add(metal,box([.03,.4,.03]),[1.4,.97,-4.92]);W(wash.cyan,[1.4,1.25,-4.985],'south',2,1.3,0);
  b.add(leather,box([.42,.08,.42],.03,3,4),[1.4,.5,-4.05]);b.add(metal,from(B.MeshBuilder.CreateCylinder('s',{diameter:.05,height:.46,tessellation:8},scene)),[1.4,.23,-4.05]);b.add(metal,from(B.MeshBuilder.CreateCylinder('s',{diameter:.34,height:.02,tessellation:20},scene)),[1.4,.01,-4.05]);
  // Lounge chair by the window: cognac-dark leather on a bronze sled, a side table with a candle.
  {const add=b.group([4.3,0,-3.4],.9);add(leather,box([.82,.16,.76],.06,2.5,8),[0,.38,0]);add(leather,box([.82,.66,.16],.07,2.5,8),[0,.72,-.36],[-.22,0,0]);
   for(const s of [-1,1]){add(metal,box([.03,.03,.8]),[s*.42,.03,0]);add(metal,box([.03,.3,.03]),[s*.42,.17,.3]);add(metal,box([.03,.62,.03]),[s*.42,.3,-.36],[-.3,0,0]);}}
  b.add(stone,from(B.MeshBuilder.CreateCylinder('t',{diameter:.46,height:.03,tessellation:28},scene)),[3.66,.545,-2.82]);b.add(metal,from(B.MeshBuilder.CreateCylinder('t',{diameter:.04,height:.53,tessellation:8},scene)),[3.66,.265,-2.82]);
  // ---- The window wall: floor-to-ceiling glass, bronze mullions, a sliding door onto the balcony ----
  for(const [z0,z1] of [[-5,-3.1],[-3.1,-1.2],[1.2,3.1],[3.1,5]])b.add(glass,box([.02,2.9,z1-z0]),[6.05,1.45,(z0+z1)/2]);b.add(glass,box([.02,2.9,2.3]),[6.13,1.45,2.15]);
  for(const z of [-5,-3.1,-1.2,1.2,3.1,5])b.add(black,box([.08,2.9,.06]),[6.05,1.45,z]);b.add(black,box([.14,.04,10.1]),[6.05,.02,0]);b.add(black,box([.12,.5,10.4]),[6.07,3.15,0]);
  b.add(metal,box([.05,.03,9.8]),[5.82,2.885,0]);W(wash.city,[4.7,.017,0],'up',4,9.5,0);
  // Balcony: dark stone, glass rail, magenta strip at its base.
  b.add(stone,box([2.9,.12,5.4]),[7.45,-.06,0]);b.add(glass,box([.03,1.05,5.4]),[8.88,.55,0]);for(const s of [-1,1]){b.add(glass,box([2.8,1.05,.03]),[7.45,.55,s*2.68]);b.add(black,box([2.8,.05,.06]),[7.45,1.08,s*2.68]);}
  b.add(black,box([.06,.05,5.4]),[8.88,1.08,0]);b.add(led.mag,box([.02,.02,5.3]),[8.84,.012,0]);W(wash.mag,[8.55,.012,0],'up',1.2,5.6,0);
  // ---- Lights: a magenta key behind the headboard, amber pendants and lamp, the city through the glass, a face light ----
  const P=(name,pos,range)=>{const l=k.own(new B.PointLight('vr-suite-'+name,new B.Vector3(...pos),scene));l.range=range;l.specular=new B.Color3(.35,.3,.35);return l;};
  const L={head:P('head',[0,1.35,4.35],6),lampL:P('lamp-l',[-2.15,1.12,4.5],4.2),lampR:P('lamp-r',[2.15,1.12,4.5],4.2),city:P('city',[5.6,2.1,0],10),lounge:P('lounge',[-5.3,1.25,-2.6],5.5),face:P('face',[3,1.9,0],3.4)};
  // ---- Curtains: heavy folds hung at each end of the glass; drawn partly closed or pulled back ----
  const curtains=[1,-1].map(s=>{const d=sheet(40,8,(u,v)=>{const zz=-s*u*2.5,y=.02+v*2.86;return [.07*Math.sin(u*2.5*Math.PI*2/.3)*(1+.15*(1-v)),y,zz,u*2.5,y];},[-1,0,0]);
   const m=new B.Mesh('vr-suite-curtain',scene),vd=new B.VertexData();vd.positions=d.p;vd.normals=d.n;vd.uvs=d.uv;vd.indices=d.i;vd.applyToMesh(m);k.mesh(m,curtainMat,[5.8,0,s*4.95]);return m;});
  let curtainTarget=1;tick.push(dt=>{for(const c of curtains)c.scaling.z+=(curtainTarget-c.scaling.z)*Math.min(1,dt*2.5);});
  // ---- Plants: two calatheas ----
  const plant=await k.model('plant');k.place(plant,[5.3,0,4.35],0,1.3);k.place(plant,[-5.35,0,-4.3],2,1.15);
  // ---- The city ----
  const city=await buildCity(k,ctx,b,tick);
  // ---- Holo screen at the desk: the music preset and a live equaliser ----
  const screenTex=k.paint('suite-screen',512,256,()=>{});const sg=screenTex.getContext();let track='LOUNGE';
  const drawScreen=t=>{sg.fillStyle='#000';sg.fillRect(0,0,512,256);sg.strokeStyle='rgba(80,220,255,.75)';sg.lineWidth=3;sg.strokeRect(6,6,500,244);sg.fillStyle='#5ad8ff';sg.font='600 22px monospace';sg.fillText('SUITE AUDIO · 音樂',24,42);
   sg.fillStyle='#ff4fb0';sg.font='700 38px monospace';sg.fillText(track,24,92);for(let i=0;i<24;i++){const h=track==='OFF'?4:10+Math.abs(Math.sin(t*2.1+i*.7)*Math.sin(t*.9+i*.31))*112;sg.fillStyle=i%3?'rgba(255,79,176,.9)':'rgba(90,216,255,.9)';sg.fillRect(24+i*19.5,238-h,12,h);}
   sg.fillStyle='rgba(90,216,255,.65)';sg.font='16px monospace';sg.fillText('E · MUSIC',400,42);screenTex.update();};
  const holo=k.own(new B.StandardMaterial('vr-suite-holo',scene));holo.diffuseColor=B.Color3.Black();holo.emissiveTexture=screenTex;holo.disableLighting=true;holo.alphaMode=B.Engine.ALPHA_ADD;holo.alpha=.92;holo.backFaceCulling=false;
  const screenMesh=new B.Mesh('vr-suite-screen',scene);{const d=quad([0,0,0],...FACE.north,1.1,.55),vd=new B.VertexData();vd.positions=d.p;vd.normals=d.n;vd.uvs=d.uv;vd.indices=d.i;vd.applyToMesh(screenMesh);}k.mesh(screenMesh,holo,[1.4,1.2,-4.9]);
  let screenClock=0;tick.push((dt,t)=>{screenClock-=dt;if(screenClock<=0){screenClock=.12;drawScreen(t);}});
  // Furniture shadows: soft dark pools where things meet the floor; the companion gets one that follows.
  const shadowTex=k.paint('suite-shadow',128,128,g=>{const r=g.createRadialGradient(64,64,4,64,64,62);r.addColorStop(0,'#fff');r.addColorStop(1,'#000');g.fillStyle=r;g.fillRect(0,0,128,128);});shadowTex.getAlphaFromRGB=true;
  const shade=k.own(new B.StandardMaterial('vr-suite-shade',scene));shade.diffuseColor=B.Color3.Black();shade.opacityTexture=shadowTex;shade.disableLighting=true;shade.alpha=.6;shade.disableDepthWrite=true;
  for(const [x,z,w,d] of [[0,3.5,3.6,3.3],[-4.7,-.5,1.5,3.2],[-2.8,-.7,1.1,1.7],[4.3,-3.4,1.3,1.3],[1.4,-4.05,.8,.8]])b.add(shade,quad([x,.02,z],...FACE.up,w,d));
  const blob=new B.Mesh('vr-suite-blob',scene);{const d=quad([0,0,0],...FACE.up,.95,.95),vd=new B.VertexData();vd.positions=d.p;vd.normals=d.n;vd.uvs=d.uv;vd.indices=d.i;vd.applyToMesh(blob);}k.mesh(blob,shade,[0,.022,0]);blob.isVisible=false;
  b.build('suite');
  // The bloom layer would draw washes, haze and shadows as flat cards (it ignores their masks), so they stay out of it.
  const glowLayer=scene.metadata?.lookGlow;if(glowLayer)for(const m of k.parent.getChildMeshes())if(m.material?.opacityTexture||m.material===holo)glowLayer.addExcludedMesh(m);
  for(const m of k.parent.getChildMeshes())if(m.material&&m.material.maxSimultaneousLights<8)m.material.maxSimultaneousLights=8;
  // Floor reflections (high quality): a blurred mirror of the room's lights and the city.
  let mirror=null;if(high){mirror=k.own(new B.MirrorTexture('vr-suite-mirror',{ratio:.5},scene,true));mirror.mirrorPlane=new B.Plane(0,-1,0,0);mirror.level=.2;mirror.adaptiveBlurKernel=28;
   const floorMesh=b.meshes.find(m=>m.material===floor);mirror.renderList=k.parent.getChildMeshes().filter(m=>m!==floorMesh&&m.material!==shade&&m.material!==rugMat);floor.reflectionTexture=mirror;}
  // ---- Moods: recolour the LEDs, washes and lights together ----
  const moods={
   rose:{head:['#ff2d96',1.9],lamp:['#ffa25a',1.15],city:'#b44dff',lounge:['#ff9a5a',1],face:['#ffe2d6',1],led:{mag:['#ff2d96',1.5],vio:['#7b45ff',.85],amb:['#ffae5c',1.15]},wash:{mag:.8,vio:.55,amb:.5},candle:.9},
   warm:{head:['#ff4f8a',1.2],lamp:['#ffb26a',1.6],city:'#9a5cff',lounge:['#ffaa66',1.4],face:['#ffe6d6',1],led:{mag:['#ff3d8f',1.1],vio:['#8a5cff',.6],amb:['#ffb870',1.45]},wash:{mag:.45,vio:.4,amb:.8},candle:1},
   night:{head:['#8a3dff',1.4],lamp:['#7a84ff',.5],city:'#3d7bff',lounge:['#6a6aff',.45],face:['#e2e4ff',.85],led:{mag:['#b43dff',1.1],vio:['#4a5cff',1.4],amb:['#7f8dff',.55]},wash:{mag:.45,vio:.65,amb:.22},candle:.4},
   candle:{head:['#ff3a6a',.7],lamp:['#ff8a3a',.85],city:'#8a4dff',lounge:['#ff8f45',.7],face:['#ffd9bf',.85],led:{mag:['#ff3a6a',.55],vio:['#5a3aa0',.4],amb:['#ff9a4a',.75]},wash:{mag:.3,vio:.15,amb:.55},candle:1.35}};
  let M=moods.rose;
  function mood(name){M=moods[name]||moods.rose;for(const [l,[c,i]] of [[L.head,M.head],[L.lampL,M.lamp],[L.lampR,M.lamp],[L.lounge,M.lounge],[L.face,M.face]]){l.diffuse=hex(B,c);l.intensity=i;}
   for(const key of ['mag','vio','amb']){const [c,l]=M.led[key];led[key].emissiveColor=hex(B,c,l);wash[key].emissiveColor=hex(B,c,M.wash[key]);}globe.emissiveColor=hex(B,M.lamp[0],1.1+M.lamp[1]*.4);}
  // City light through the glass drifts slowly between its colour, magenta and cyan; candles flicker; the face light follows.
  const comps=[];const tmp=new B.Color3();
  tick.push((dt,t)=>{const a=(Math.sin(t*.21)+1)/2,c=B.Color3.Lerp(hex(B,M.city),a>.5?hex(B,'#ff3f9a'):hex(B,'#3fc0ff'),Math.abs(a-.5)*.9);L.city.diffuse=c;L.city.intensity=1.05+.15*Math.sin(t*.53);wash.city.emissiveColor=c.scaleToRef(.42,tmp).clone();
   flame.emissiveColor=hex(B,'#ffb050',M.candle*(1.25+.25*Math.sin(t*23)*Math.sin(t*7.3)));
   // Each companion has its own floor shadow; the face light lights whichever one is nearest to you.
   let near=null,nearD=Infinity;for(const f of comps){f.blob.position.x=f.node.position.x;f.blob.position.z=f.node.position.z;const d=Math.hypot(walker.x-f.node.position.x,walker.z-f.node.position.z);if(d<nearD){nearD=d;near=f;}}
   if(near){const comp=near.node,dx=walker.x-comp.position.x,dz=walker.z-comp.position.z,l=Math.hypot(dx,dz)||1;L.face.position.set(comp.position.x+dx/l*.85,near.headY()+.25,comp.position.z+dz/l*.85);}});
  return {mood,meshes:b.meshes,city,
   curtains(open){curtainTarget=open?.42:1;},
   music(name){track=String(name||'off').toUpperCase();},
   // A companion (one or more): full lighting, a floor shadow, the face light, and a place in the floor reflection.
   follow(node,head){const own=comps.length?blob.clone('vr-companion-blob-'+comps.length):blob;own.isVisible=true;comps.push({node,headY:head||(()=>1.8),blob:own});
    for(const m of node.getChildMeshes()){if(m.material)m.material.maxSimultaneousLights=8;mirror?.renderList.push(m);}},
   tick(dt,t){for(const f of tick)f(dt,t);}};
 }

 // ---- NeoChinatown at night: towers with lit windows, Chinese neon, Tessaly ads, avenues of flying traffic ----
 async function buildCity(k,ctx,b,tick){
  const B=k.B,scene=k.scene,r=rng(916),low=ctx.quality==='low',towers=[],aves={x:[78,142,212],z:[-64,66]},Y0=-92;
  const facade=(name,seed,lit,palette,ribbon)=>k.paint(name,512,512,g=>{const q=rng(seed);g.fillStyle='#050408';g.fillRect(0,0,512,512);
   for(let f=0;f<4;f++){const y0=f*128;g.fillStyle='#0d0a12';g.fillRect(0,y0+116,512,12);
    if(ribbon){g.fillStyle='rgba(120,200,255,'+(.08+q()*.1)+')';g.fillRect(0,y0+30,512,70);for(let x=0;x<512;x+=32)if(q()<lit){g.fillStyle=palette[Math.floor(q()*palette.length)];g.globalAlpha=.4+q()*.5;g.fillRect(x+2,y0+32,28,66);g.globalAlpha=1;}}
    else{const band=q()<.08;for(let c=0;c<12;c++){const x=c*42.67+9,on=band||q()<lit;g.fillStyle=on?palette[q()<.8?0:Math.floor(q()*palette.length)]:'#0c0b13';g.globalAlpha=on?(band?.35:.18+q()*.6):1;g.fillRect(x,y0+30,25,70);g.globalAlpha=1;
     if(on&&q()<.4){g.fillStyle='rgba(0,0,0,.45)';for(let s=y0+30;s<y0+100;s+=6)g.fillRect(x,s,25,2);}}}}},false);
  const tile=t=>{t.wrapU=t.wrapV=B.Texture.WRAP_ADDRESSMODE;return t;};
  const warm=['#ffc48a','#ffe0b8','#ffa860','#ff8ac8','#8fd8ff','#c49aff'];
  const texes=[tile(facade('suite-tower-a',11,.38,warm)),tile(facade('suite-tower-b',12,.22,['#ffd2a0','#ff5fb0','#5fd0ff','#ffb070'])),tile(facade('suite-tower-c',13,.55,['#cfe8ff','#9fd8ff','#ffffff','#ff9ad0'],true))];
  const towerMats=texes.map((t,i)=>{const m=k.own(new B.StandardMaterial('vr-suite-tower-'+i,scene));m.diffuseColor=B.Color3.Black();m.specularColor=B.Color3.Black();m.emissiveTexture=t;m.disableLighting=true;return m;});
  const clear=(x,z,w,d)=>!aves.x.some(a=>Math.abs(x-a)<w/2+8)&&!aves.z.some(a=>Math.abs(z-a)<d/2+8)&&!towers.some(t=>Math.abs(t.x-x)<(t.w+w)/2+3&&Math.abs(t.z-z)<(t.d+d)/2+3);
  const count=low?90:170;for(let tries=0;towers.length<count&&tries<count*40;tries++){const th=(r()-.5)*2.7,dist=34+r()**.8*430,x=8+Math.cos(th)*dist,z=Math.sin(th)*dist*1.15,w=14+r()*24,d=14+r()*24;
   if(x-w/2<40||!clear(x,z,w,d))continue;let top=-58+r()**1.1*(62+dist*.42);if(dist<110)top=Math.min(top,-14-r()*34);towers.push({x,z,w,d,th,dist,top,f:Math.floor(r()*3)});}
  // A tower's walls carry the window texture in 12 m tiles that line up with its floors; the roof is the dark slab.
  const tower=(x,z,w,d,y0,y1,uo)=>{const p=[],n=[],uv=[],i=[],X=[x-w/2,x+w/2],Z=[z-d/2,z+d/2],V0=(y0-Y0)/12,V1=(y1-Y0)/12;
   const side=(ax,az,bx,bz,nx,nz,len)=>{const o=p.length/3;p.push(ax,y0,az,bx,y0,bz,bx,y1,bz,ax,y1,az);for(let j=0;j<4;j++)n.push(nx,0,nz);uv.push(uo,V0,uo+len/12,V0,uo+len/12,V1,uo,V1);i.push(o,o+1,o+2,o,o+2,o+3);};
   side(X[0],Z[1],X[0],Z[0],-1,0,d);side(X[1],Z[0],X[1],Z[1],1,0,d);side(X[0],Z[0],X[1],Z[0],0,-1,w);side(X[1],Z[1],X[0],Z[1],0,1,w);
   const o=p.length/3;p.push(X[0],y1,Z[0],X[1],y1,Z[0],X[1],y1,Z[1],X[0],y1,Z[1]);for(let j=0;j<4;j++){n.push(0,1,0);uv.push(.5,.004);}i.push(o,o+1,o+2,o,o+2,o+3);return wind({p,n,uv,i});};
  const trim=[k.glow('suite-trim-mag','#ff3fa4',1.3),k.glow('suite-trim-cyan','#3fd8ff',1.2)],beacon=k.glow('suite-beacon','#ff2030',1.5);
  for(const t of towers){b.add(towerMats[t.f],tower(t.x,t.z,t.w,t.d,Y0,t.top,r()));
   if(r()<.4){const h=5+r()*12;b.add(towerMats[t.f],tower(t.x+(r()-.5)*t.w*.2,t.z+(r()-.5)*t.d*.2,t.w*.62,t.d*.62,t.top,t.top+h,r()));t.crown=t.top+h;}
   if(r()<.35){const m=trim[Math.floor(r()*2)],y=t.top+.3;for(const [s,p] of [[[t.w,.5,.5],[t.x,y,t.z-t.d/2]],[[t.w,.5,.5],[t.x,y,t.z+t.d/2]],[[.5,.5,t.d],[t.x-t.w/2,y,t.z]],[[.5,.5,t.d],[t.x+t.w/2,y,t.z]]])b.add(m,box(s),p);}
   if((t.crown||t.top)>10)for(const s of [-1,1])b.add(beacon,box([.8,.8,.8]),[t.x+s*t.w*.3,(t.crown||t.top)+.6,t.z]);}
  // The apartment's own tower around the window, so the balcony sits in a wall of other homes.
  for(const [s,p] of [[[.3,60,90],[6.35,33.4,0]],[[.3,100,90],[6.35,-50,0]],[[.3,3.4,40],[6.35,1.7,-25.2]],[[.3,3.4,40],[6.35,1.7,25.2]]])b.add(towerMats[0],scaleUV(box(s),1/12),p);
  // Vertical neon signs on the faces that look toward the window.
  const words=['夜市','旅館','龍麵館','網吧','電子','茶','藥房','麻將','新天地','當鋪','拉麵','診所','電器','酒吧','夜','修理'],cols=['#ff3fa4','#3fe0ff','#ffb347','#ff4a5a','#b07aff','#7dffb0'];
  const neonTex=k.paint('suite-neon',2048,512,g=>{g.textAlign='center';g.textBaseline='middle';words.forEach((w,i)=>{const x=i*128,c=cols[i%cols.length],chars=[...w],fs=Math.min(104,430/chars.length);
    g.fillStyle='#0b0811';g.fillRect(x+6,6,116,500);g.strokeStyle=c;g.lineWidth=4;g.shadowColor=c;g.shadowBlur=14;g.strokeRect(x+12,12,104,488);
    g.font='900 '+fs+'px "Microsoft JhengHei","Microsoft YaHei","PingFang TC","Noto Sans CJK TC",sans-serif';chars.forEach((ch,j)=>{const y=256+(j-(chars.length-1)/2)*fs*1.08;g.shadowBlur=22;g.fillStyle=c;g.fillText(ch,x+64,y);g.shadowBlur=0;g.globalAlpha=.55;g.fillStyle='#fff';g.fillText(ch,x+64,y);g.globalAlpha=1;});g.shadowBlur=0;});});
  const neon=name=>{const m=k.own(new B.StandardMaterial('vr-suite-'+name,scene));m.diffuseColor=B.Color3.Black();m.emissiveTexture=neonTex;m.disableLighting=true;m.backFaceCulling=false;return m;},neonMat=neon('neon'),flicker=neon('neon-flicker');let signs=0;
  for(const t of towers.filter(t=>t.dist<210&&Math.abs(t.th)<1.2).sort((a,b)=>a.dist-b.dist)){if(signs>=(low?18:40))break;
   for(let n=0;n<1+(r()<.55);n++){const s=1+t.dist/110,w=2.6*s,h=10.4*s,lim=Math.min(t.top-2,18),zc=t.z+(r()-.5)*Math.max(0,t.d-w-1);if(lim-h/2<-80+h/2)continue;
    const yc=-80+h/2+r()*(lim-h-(-80)),cell=Math.floor(r()*16);b.add(r()<.12?flicker:neonMat,quad([t.x-t.w/2-.4,yc,zc],...FACE.west,w,h,[cell/16+.002,.01,(cell+1)/16-.002,.99]));signs++;}}
  // Tessaly ads on three near towers (one cycles through the brands).
  const brands=(globalThis.VoidAds?.brands||[]).filter(x=>x.id!=='function'),adTex=k.paint('suite-ads',768,384,()=>{}),ag=adTex.getContext(),paintAd=(i,brand)=>{ag.save();ag.beginPath();ag.rect(i*256,0,256,384);ag.clip();ag.translate(i*256,0);try{globalThis.VoidAds.paint(ag,256,384,brand);}catch{ag.fillStyle='#200818';ag.fillRect(0,0,256,384);}ag.restore();adTex.update();};
  let adAt=0;brands.length&&[0,1,2].forEach(i=>paintAd(i,brands[(i*2)%brands.length]));
  const adMat=k.own(new B.StandardMaterial('vr-suite-ads',scene));adMat.diffuseColor=B.Color3.Black();adMat.emissiveTexture=adTex;adMat.disableLighting=true;
  towers.filter(t=>t.dist>110&&t.dist<230&&t.top>-6&&t.d>16&&Math.abs(t.th)>.3&&Math.abs(t.th)<1).slice(0,3).forEach((t,i)=>{const s=1+t.dist/160,w=12*s,h=18*s,yc=Math.min(t.top-h/2-2,16);
   b.add(adMat,quad([t.x-t.w/2-.5,yc,t.z],...FACE.west,w,h,[i/3+.002,.002,(i+1)/3-.002,.998]));for(const [sw,sh,dz,dy] of [[.5,h+1,w/2+.25,0],[.5,h+1,-w/2-.25,0],[w+1,.5,0,h/2+.25],[w+1,.5,0,-h/2-.25]])b.add(trim[1],box([.4,sh,sw===.5?.5:sw]),[t.x-t.w/2-.6,yc+dy,t.z+dz]);});
  let adClock=8;tick.push((dt,t)=>{adClock-=dt;if(adClock<=0&&brands.length){adClock=8;adAt++;paintAd(0,brands[adAt%brands.length]);}flicker.alpha=Math.sin(t*31)>-.2||Math.sin(t*3.1)>.6?1:.25;});
  // Streets far below glow amber; haze rises over the avenues.
  const street=k.glow('suite-street','#ff9a48',.9),ground=k.glow('suite-ground','#0b0710',1);b.add(ground,box([1400,.4,1400]),[300,-93,0]);
  for(const x of aves.x)b.add(street,box([7,.5,900]),[x,-92.4,0]);for(const z of aves.z)b.add(street,box([600,.5,7]),[330,-92.4,z]);
  const atlasTex=k.paint('suite-haze',128,128,g=>{const gr=g.createRadialGradient(64,64,2,64,64,63);gr.addColorStop(0,'#fff');gr.addColorStop(1,'#000');g.fillStyle=gr;g.fillRect(0,0,128,128);});atlasTex.getAlphaFromRGB=true;
  const haze=(name,h,l)=>{const m=k.own(new B.StandardMaterial('vr-suite-haze-'+name,scene));m.opacityTexture=atlasTex;m.diffuseColor=B.Color3.Black();m.emissiveColor=B.Color3.FromHexString(h).scale(l);m.disableLighting=true;m.alphaMode=B.Engine.ALPHA_ADD;m.alpha=.99;m.fogEnabled=false;m.backFaceCulling=false;m.disableDepthWrite=true;return m;};
  const hazeMag=haze('mag','#ff3a9a',.22),hazeAmb=haze('amb','#ff9a50',.16);
  for(const x of aves.x)b.add(hazeAmb,quad([x,-70,0],...FACE.west,900,70));for(let i=0;i<6;i++)b.add(hazeMag,quad([140+r()*220,-45+r()*50,(r()-.5)*400],...FACE.west,180,80));
  // The sky: a dark dome with a magenta haze band and far skyline silhouettes.
  const sky=k.paint('suite-skyline',2048,512,g=>{const q=rng(4),gr=g.createLinearGradient(0,0,0,512);gr.addColorStop(0,'#030207');gr.addColorStop(.42,'#0c0614');gr.addColorStop(.6,'#2a0c2c');gr.addColorStop(.68,'#3a1236');gr.addColorStop(.74,'#160818');gr.addColorStop(1,'#07040a');g.fillStyle=gr;g.fillRect(0,0,2048,512);
   for(let i=0;i<40;i++){g.fillStyle='rgba(255,70,170,'+(.015+q()*.03)+')';g.beginPath();g.ellipse(q()*2048,90+q()*150,120+q()*260,10+q()*24,0,0,7);g.fill();}
   for(let x=0;x<2048;){const w=10+q()*34,h=20+q()**1.6*95,base=360;g.fillStyle='#09060d';g.fillRect(x,base-h,w,h+160);for(let j=0;j<w*h/60;j++){g.fillStyle=q()<.7?'rgba(255,190,120,.5)':'rgba(120,220,255,.5)';g.fillRect(x+q()*w,base-h+q()*h,1.2,1.2);}x+=w+q()*6;}});
  const dome=B.MeshBuilder.CreateCylinder('vr-suite-sky',{diameter:1700,height:1000,tessellation:48,sideOrientation:B.Mesh.BACKSIDE},scene);const skyMat=k.own(new B.StandardMaterial('vr-suite-sky',scene));skyMat.diffuseColor=B.Color3.Black();skyMat.emissiveTexture=tile(sky);sky.uScale=2;skyMat.disableLighting=true;skyMat.fogEnabled=false;k.mesh(dome,skyMat,[0,100,0]);
  // Flying traffic along the avenues: headlights one way, tail lights the other.
  const cars=[];for(const [axis,list,heights] of [['z',aves.x,low?[-40,0]:[-62,-38,-14,12]],['x',aves.z,low?[-20]:[-48,-22,6]]])for(const a of list)for(const y of heights)for(const dir of [1,-1])for(let n=0;n<(low?2:4);n++)cars.push({axis,a:a+dir*3,y:y+dir*1.5,dir,t:axis==='z'?-420+r()*840:30+r()*500,v:16+r()*22});
  const carMesh=(h,l)=>{const m=B.MeshBuilder.CreateBox('vr-suite-car',{width:.9,height:.45,depth:3.6},scene);k.mesh(m,k.glow('suite-car-'+h,h,l));const list=cars.filter(c=>(c.dir>0)===(h==='#fff0d4'));const buf=new Float32Array(list.length*16);m.thinInstanceSetBuffer('matrix',buf,16,false);m.alwaysSelectAsActiveMesh=true;return {m,list,buf};};
  const lanes=[carMesh('#fff0d4',1.5),carMesh('#ff2a44',1.5)],mtx=new B.Matrix(),one=new B.Vector3(1,1,1),q0=B.Quaternion.Identity(),q90=B.Quaternion.RotationYawPitchRoll(Math.PI/2,0,0),pos=new B.Vector3();
  tick.push(dt=>{for(const {m,list,buf} of lanes){list.forEach((c,i)=>{c.t+=c.dir*c.v*dt;if(c.axis==='z'){if(c.t>420)c.t=-420;if(c.t<-420)c.t=420;pos.set(c.a,c.y,c.t);}else{if(c.t>530)c.t=30;if(c.t<30)c.t=530;pos.set(c.t,c.y,c.a);}
   B.Matrix.ComposeToRef(one,c.axis==='z'?q0:q90,pos,mtx);mtx.copyToArray(buf,i*16);});m.thinInstanceBufferUpdated('matrix');}});
  const glowLayer=scene.metadata?.lookGlow;if(glowLayer)for(const m of b.build('suite-city'))if(towerMats.includes(m.material)||m.material===skyMat)glowLayer.addExcludedMesh(m);
  return {towers:towers.length,signs};}
 globalThis.VoidVRSuiteRoom={build,box,sheet,quad};
})();
