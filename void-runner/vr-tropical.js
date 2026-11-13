/* VR experience: Tropical Escape. A sandy beach on a calm sea: palms, loungers under an umbrella, a thatched
   shelter, a wooden pier with a bench at the end, shells along the tideline, and a day or sunset sky. Coastal rocks,
   shells and plants from Poly Haven (CC0); palms, pier and shelter built here; generated surf, wind and gulls.
   Dolphins offshore (Quaternius Animated Fish Pack, CC0) swim at the surface and leap on a code-drawn arc. */
(function(){
 const {kit,spot}=VoidVRKit;
 const SHORE=10,PIER=[20,23],PIER_END=34;
 // Sand rises gently from the waterline; small dunes toward the back.
 const height=(x,z)=>z>SHORE+2?-.6-(z-SHORE-2)*.25:(SHORE-z)*.035+.25*Math.sin(x*.12)*Math.max(0,(SHORE-6-z)/30);
 const onPier=(x,z)=>x>PIER[0]&&x<PIER[1]&&z>SHORE-2&&z<PIER_END;
 const spots={lounger:[[-6,3],[-2.5,3],[1,3]],pierBench:[21.5,32.5],hut:[-18,-14],surf:[-10,11.5],shells:[[-26,8.5],[6,9.2],[30,8]]};
 // Dolphins stay on the sea surface. The body is placed so the waterline (the opaque sea, untouched) cuts the belly;
 // a leap is a sine arc that leaves and returns to that height, then the model is hidden until it surfaces again.
 const Dolphins=(function(){
  const SURFACE=-.32,SEA=.08,SCALE=.55,X0=-36,X1=40,LEAP_H=3.2,LEAP_D=9,LEAP_T=1.45,UNDER=1.7;
  const lanes=[{x:14,z:48,yaw:Math.PI/2,wait:1.6,speed:3.3},{x:-6,z:62,yaw:-Math.PI/2,wait:7.5,speed:3.6},{x:-24,z:42,yaw:Math.PI/2,wait:4.4,speed:3.1}];
  function create(n){return lanes.slice(0,Math.max(0,n|0)).map(L=>({x:L.x,z:L.z,yaw:L.yaw,speed:L.speed,wait:L.wait,y:SURFACE,pitch:0,phase:'swim',t:0,shown:true}));}
  function step(d,dt){const ev=[];dt=Math.min(.1,Math.max(0,dt||0));
   if(d.phase==='swim'){d.shown=true;d.y=SURFACE;d.pitch=0;d.x+=Math.sin(d.yaw)*d.speed*dt;d.z+=Math.cos(d.yaw)*d.speed*dt;
    if(d.x<X0||d.x>X1){d.x=Math.max(X0,Math.min(X1,d.x));d.yaw=-d.yaw;d.wait=Math.max(d.wait,1.4);}
    d.wait-=dt;if(d.wait<=0){d.phase='leap';d.t=0;d.leap={x:d.x,z:d.z,yaw:d.yaw};ev.push({splash:true});}}
   else if(d.phase==='leap'){d.t+=dt;d.shown=true;const u=Math.min(1,d.t/LEAP_T),along=LEAP_D*u;d.x=d.leap.x+Math.sin(d.leap.yaw)*along;d.z=d.leap.z+Math.cos(d.leap.yaw)*along;
    d.y=SURFACE+LEAP_H*Math.sin(Math.PI*u);d.pitch=-Math.atan2(LEAP_H*Math.PI*Math.cos(Math.PI*u),LEAP_D);
    if(u>=1){d.phase='under';d.t=0;d.y=SURFACE;d.pitch=0;d.shown=false;ev.push({splash:true});}}
   else{d.t+=dt;d.shown=false;d.y=SURFACE;d.pitch=0;d.x+=Math.sin(d.yaw)*d.speed*1.15*dt;d.z+=Math.cos(d.yaw)*d.speed*1.15*dt;
    if(d.x<X0||d.x>X1){d.x=Math.max(X0,Math.min(X1,d.x));d.yaw=-d.yaw;}
    if(d.t>=UNDER){d.phase='swim';d.t=0;d.shown=true;d.wait=5.5+Math.abs(Math.sin(d.x))*3.2;ev.push({splash:true});}}
   return ev;}
  // Cloned glTF groups drive transform nodes, not the skeleton bones. Link each bone or the swim clip never reaches the mesh.
  function linkBones(node,prefix){const byName=new Map();for(const t of node.getChildTransformNodes(false))byName.set(t.name,t);const seen=new Set();
   for(const mesh of node.getChildMeshes(false)){mesh.isPickable=false;const sk=mesh.skeleton;if(!sk||seen.has(sk))continue;seen.add(sk);
    for(const bone of sk.bones){const link=byName.get(prefix+bone.name);if(link)bone.linkTransformNode(link);}}}
  function spawn(k,container,count){const B=k.B,plainMats=new Map();for(const g of container.animationGroups||[])g.stop();
   // One StandardMaterial per glTF colour, shared by every dolphin, so the beach does not pay for a PBR shader.
   function plain(node){for(const mesh of node.getChildMeshes(false)){const src=mesh.material;if(!src)continue;let m=plainMats.get(src);
    if(!m){const c=src.albedoColor||src.diffuseColor;m=k.material('dolphin-'+(src.name||'skin'),{spec:.28});if(c)m.diffuseColor=c.clone();m.specularColor=new B.Color3(.2,.24,.26);plainMats.set(src,m);}mesh.material=m;}}
   const tex=k.paint('dolphin-splash',64,64,(g,W)=>{const r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,255,255,.85)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,W,W);},true);
   const dolphins=create(count).map((d,i)=>{const prefix='vr-dolphin'+i+'-';
    const inst=container.instantiateModelsToScene(n=>prefix+n,false,{doNotInstantiate:true});
    const node=new B.TransformNode('vr-dolphin'+i,k.scene);node.parent=k.parent;globalThis.VoidAssets?.ownInstance(inst,node);
    for(const r0 of inst.rootNodes)r0.parent=node;node.scaling.setAll(SCALE);linkBones(node,prefix);plain(node);
    const swim=(inst.animationGroups||[]).find(g=>/swim/i.test(g.name))||inst.animationGroups[0];swim.start(true,.9);
    const cap=count>2?36:24,splash=new B.ParticleSystem('vr-dolphin-splash'+i,cap,k.scene);splash.particleTexture=tex;splash.emitter=new B.Vector3(d.x,SEA,d.z);
    splash.minEmitBox=new B.Vector3(-.6,0,-.6);splash.maxEmitBox=new B.Vector3(.6,.25,.6);splash.minSize=.28;splash.maxSize=1.15;splash.minLifeTime=.4;splash.maxLifeTime=.95;splash.emitRate=0;
    splash.direction1=new B.Vector3(-1.5,1.8,-1.5);splash.direction2=new B.Vector3(1.5,3.6,1.5);splash.gravity=new B.Vector3(0,-7,0);splash.minEmitPower=.7;splash.maxEmitPower=1.5;
    splash.color1=new B.Color4(1,1,1,.55);splash.color2=new B.Color4(.85,.94,1,.3);splash.colorDead=new B.Color4(1,1,1,0);splash.blendMode=B.ParticleSystem.BLENDMODE_STANDARD;splash.start();
    return Object.assign(d,{node,swim,splash,splashT:0});});
   const burst=d=>{d.splash.emitter.set(d.x,SEA,d.z);d.splash.manualEmitCount=(d.splash.manualEmitCount||0)+42;d.splashT=.22;d.splash.emitRate=90;};
   const apply=d=>{d.node.position.set(d.x,d.y,d.z);d.node.rotationQuaternion=B.Quaternion.RotationYawPitchRoll(d.yaw,d.pitch,0);d.node.setEnabled(d.shown);};
   for(const d of dolphins)apply(d);
   k.every(dt=>{for(const d of dolphins){for(const ev of step(d,dt))if(ev.splash)burst(d);if(d.splashT>0){d.splashT-=dt;if(d.splashT<=0)d.splash.emitRate=0;}apply(d);}});
   let dead=false;function dispose(){if(dead)return;dead=true;for(const d of dolphins){try{d.swim.stop();}catch(e){}try{d.splash.dispose();}catch(e){}try{d.node.dispose();}catch(e){}}dolphins.length=0;if(api.live===dolphins)api.live=null;}
   const prev=k.dispose.bind(k);k.dispose=function(){dispose();return prev();};api.live=dolphins;return {dolphins,dispose};}
  const api={create,step,spawn,SURFACE,SEA,SCALE,LEAP_H,lanes,live:null};return api;})();
 globalThis.VoidTropicalDolphins=Dolphins;
 function layout(){const sea=(x0,x1)=>({id:'vr-sea',position:[(x0+x1)/2,1,27],size:[x1-x0,2,26]});
  return {id:'vr-tropical',name:'VR · TROPICAL ESCAPE',bounds:[40,40],spawn:[-4,1.7,-24],yaw:0,music:null,signs:[],
   solids:[sea(-41,PIER[0]),sea(PIER[1],41),{id:'vr-pier-end',position:[21.5,1,PIER_END+1],size:[4,2,2]},{id:'vr-hut',position:[-18,1,-16.6],size:[.4,2,.4]},{id:'vr-hut2',position:[-14.6,1,-16.6],size:[.4,2,.4]}],
   interactions:[...spots.lounger.map(([x,z],i)=>spot('lounger'+i,'RELAX ON THE LOUNGER',x,z-1.2,1.8)),spot('pier-bench','SIT AT THE END OF THE PIER',21.5,31.6,2),spot('fish','FISH FROM THE PIER',21.5,26,2.2),spot('hut','CHANGE THE SKY (DAY / SUNSET)',-16.3,-12.4,2.4),spot('surf','WADE INTO THE SURF',-10,11.5,3),...spots.shells.map(([x,z],i)=>spot('shell'+i,'PICK UP THE SHELL',x,z,1.8))]};}
 async function build(ctx){
  const k=kit(ctx),B=k.B,api=ctx.api,low=ctx.quality==='low';
  const presets={day:{sky:'beach-day',light:{clear:[.55,.75,.95],fog:[.72,.82,.9],fogDensity:.0028,sunColor:[1,.97,.9],sunIntensity:1.7,sunDir:[-.3,-.9,.4],sky:[.85,.92,1],ground:[.6,.55,.42],ambient:.9,exposure:1.05},sea:'#1f7d8f'},
   sunset:{sky:'beach-sunset',light:{clear:[.85,.5,.35],fog:[.82,.55,.42],fogDensity:.0035,sunColor:[1,.62,.35],sunIntensity:1.3,sunDir:[.15,-.35,1],sky:[.95,.7,.55],ground:[.45,.32,.25],ambient:.75,exposure:1.0},sea:'#3a4a6a'}};
  let dome=null,sea=null;
  function setTime(t){const p=presets[t]||presets.day;k.light(p.light);dome?.dispose();dome=k.sky(p.sky,Math.PI);if(sea)sea.diffuseColor=B.Color3.FromHexString(p.sea);if(sea?.reflectionTexture){sea.reflectionTexture.dispose();const r=new B.Texture(k.base+'sky/'+p.sky+'.jpg',k.scene);r.coordinatesMode=B.Texture.EQUIRECTANGULAR_MODE;r.level=.22;sea.reflectionTexture=r;}k.time=t;}
  setTime(ctx.settings.time||'day');
  const sand=k.material('sand',{color:'sand-color',normal:'sand-normal',scale:30,hex:'#f2e3c4'});k.terrain('beach',220,160,height,sand);
  sea=k.water('sea',{hex:presets[k.time].sea,alpha:1,sky:presets[k.time].sky,scale:30,reflect:.22,spec:.45});const ocean=k.mesh(B.MeshBuilder.CreateGround('vr-ocean',{width:2400,height:2400},k.scene),sea,[0,-.05,1200+SHORE-1]);
  // Foam on the tideline: a band that washes in and out.
  {const t=k.paint('foam',256,64,(g,W,H)=>{g.clearRect(0,0,W,H);for(let i=0;i<500;i++){g.fillStyle='rgba(255,255,255,'+(Math.random()*.7)+')';g.beginPath();g.arc(Math.random()*W,Math.random()*H*.7+H*.15,1+Math.random()*3,0,Math.PI*2);g.fill();}},true);t.uScale=60;
   const m=k.material('foam');m.diffuseTexture=t;m.useAlphaFromDiffuseTexture=true;m.emissiveColor=new B.Color3(.6,.62,.62);const band=k.mesh(B.MeshBuilder.CreateGround('vr-foam',{width:400,height:3},k.scene),m,[0,.02,SHORE+.4]);
   k.every((dt,time)=>{const w=Math.sin(time*.55);band.position.z=SHORE+.3+w*.9;band.visibility=.55+.35*Math.max(0,-w);t.uOffset+=dt*.004;});}
  // Palms: a leaning ringed trunk and drooping painted fronds, two shapes, drawn as thin instances.
  const bark=k.material('palm-bark',{color:'bark-color',normal:'bark-normal',hex:'#c9b089'});bark.diffuseTexture.vScale=6;
  const frondTex=k.paint('frond',128,512,(g,W,H)=>{g.clearRect(0,0,W,H);g.strokeStyle='#6b7d2e';g.lineWidth=5;g.beginPath();g.moveTo(W/2,0);g.lineTo(W/2,H);g.stroke();
   for(let y=8;y<H-6;y+=7){const len=W*.48*Math.sin(Math.PI*y/H),c=['#3f7a2a','#4d8a30','#5a9a36','#356a24'][y%4];g.strokeStyle=c;g.lineWidth=4;for(const s of [-1,1]){g.beginPath();g.moveTo(W/2,y);g.quadraticCurveTo(W/2+s*len*.6,y+6,W/2+s*len,y+20);g.stroke();}}},true);
  const frondMat=k.foliage('frond',frondTex);
  const palmTemplates=[0,1].map(v=>{const h=7+v*2.5,lean=1.2+v*.8,path=[];for(let i=0;i<=12;i++){const t=i/12;path.push(new B.Vector3(lean*t*t,h*t,0));}
   const trunk=B.MeshBuilder.CreateTube('palm',{path,radiusFunction:(i)=>.24-i*.008,tessellation:10,cap:B.Mesh.CAP_END},k.scene);trunk.material=bark;
   const top=path[path.length-1],fronds=[];for(let i=0;i<10;i++){const a=i/10*Math.PI*2+v,L=3.6+(i%3)*.5,l=[],r=[];for(let j=0;j<=10;j++){const t=j/10,dist=t*L,y=t*1.1-t*t*2.4,w=.75*Math.sin(Math.PI*Math.min(1,t*1.15));const cx=top.x+Math.cos(a)*dist,cz=top.z+Math.sin(a)*dist,px=-Math.sin(a)*w,pz=Math.cos(a)*w;l.push(new B.Vector3(cx+px,top.y+y,cz+pz));r.push(new B.Vector3(cx-px,top.y+y,cz-pz));}
    const f=B.MeshBuilder.CreateRibbon('frond',{pathArray:[l,r]},k.scene);const uv=[];for(let s=0;s<2;s++)for(let j=0;j<=10;j++)uv.push(s,1-j/10);f.setVerticesData(B.VertexBuffer.UVKind,uv);fronds.push(f);}
   for(let c=0;c<3;c++){const nut=B.MeshBuilder.CreateSphere('nut',{diameter:.32,segments:6},k.scene);nut.position.set(top.x+Math.cos(c*2.1)*.25,top.y-.25,top.z+Math.sin(c*2.1)*.25);fronds.push(nut);}
   const crown=B.Mesh.MergeMeshes(fronds,true,true,undefined,false,false);crown.material=frondMat;return [trunk,crown];});
  const palmSpots=[[-30,-6],[-24,-12],[-12,-4],[-8,-18],[4,-8],[12,-14],[16,-2],[26,-10],[32,-4],[-34,-20],[36,-18],[-4,-30],[8,-26],[24,-24],[-20,-30],[30,-32],[-36,4],[38,6],[-14,6],[10,5]].map(([x,z],i)=>({x,z,v:i%2,r:i*1.9,s:.85+(i%5)*.08}));
  for(const v of [0,1]){const list=palmSpots.filter(p=>p.v===v),buf=new Float32Array(list.length*16);list.forEach((p,i)=>B.Matrix.Compose(new B.Vector3(p.s,p.s,p.s),B.Quaternion.RotationYawPitchRoll(p.r,0,0),new B.Vector3(p.x,height(p.x,p.z)-.1,p.z)).copyToArray(buf,i*16));
   for(const m of palmTemplates[v]){m.thinInstanceSetBuffer('matrix',buf.slice(),16);m.thinInstanceRefreshBoundingInfo(true);m.parent=k.parent;m.isPickable=false;}}
  // Coastal plants, rocks and shells.
  const [rocks,fern,grass,shell,patio,dolphin]=await Promise.all(['coast-rocks','fern','grass','shell','patio-set','dolphin'].map(n=>k.model(n)));
  let seed=11;const rnd=()=>((seed=seed*16807%2147483647)-1)/2147483646;
  k.scatter(grass,Array.from({length:low?80:200},()=>{const x=(rnd()*2-1)*40,z=-40+rnd()*30;return {p:[x,height(x,z),z],r:rnd()*6,s:.7+rnd()*.7};}));
  k.scatter(fern,Array.from({length:low?30:70},()=>{const x=(rnd()*2-1)*40,z=-40+rnd()*24;return {p:[x,height(x,z),z],r:rnd()*6,s:.9+rnd()*.8};}));
  // The coast-rock model is a whole 64 m stretch of shore: a quarter of it makes an outcrop at each end of the beach.
  for(const [x,z,r,s] of [[-44,8,0,.26],[44,9,2.6,.24]])k.place(rocks,[x,height(x,Math.min(z,SHORE))-.6,z],r,s);
  const shells=spots.shells.map(([x,z],i)=>k.place(shell,[x,height(x,z)+.03,z],i*2,1.6));
  // Shelter: four posts, a thatched roof and a patio set beneath.
  const wood=k.material('wood',{color:'wood-floor-color',hex:'#b08a62'}),thatch=k.material('thatch');thatch.diffuseTexture=k.paint('thatch',256,256,(g,W,H)=>{g.fillStyle='#8a6a3a';g.fillRect(0,0,W,H);for(let i=0;i<1400;i++){g.strokeStyle=['#a4844a','#6e5228','#c09a58'][i%3];g.lineWidth=1+Math.random()*1.5;const x=Math.random()*W,y=Math.random()*H;g.beginPath();g.moveTo(x,y);g.lineTo(x+(Math.random()-.5)*4,y+14+Math.random()*10);g.stroke();}});
  for(const [x,z] of [[-18,-16.6],[-14.6,-16.6],[-18,-11.6],[-14.6,-11.6]])k.cyl('hut-post',.22,3,[x,height(x,z)+1.5,z],wood,8);
  const roof=k.cyl('hut-roof',6.4,2.2,[-16.3,height(-16.3,-14)+4,-14.1],thatch,12,.2);
  k.place(patio,[-16.3,height(-16.3,-14.1),-14.1],0,1);
  const glowSign=k.mesh(B.MeshBuilder.CreatePlane('vr-sky-panel',{width:.9,height:.5},k.scene),k.material('sky-panel',{hex:'#000000',emissive:'#ffcf8a'}),[-14.75,height(-14.75,-12)+1.6,-11.7],Math.PI);
  // Loungers under an umbrella, facing the sea.
  const cushion=k.material('cushion',{color:'fabric-color',normal:'fabric-normal',scale:2,hex:'#f4f0e6'}),pole=k.material('pole',{hex:'#e8e2d4'}),canvas=k.material('canvas',{hex:'#e8604a'});canvas.backFaceCulling=false;
  for(const [x,z] of spots.lounger){const y=height(x,z);const base=k.box('lounger',[.8,.18,2],[x,y+.32,z],wood);const back=k.box('lounger-back',[.8,.12,.9],[x,y+.62,z-1.05],wood);back.rotation.x=-.7;k.box('cushion',[.72,.1,1.8],[x,y+.46,z+.05],cushion);for(const dx of [-.34,.34])for(const dz of [-.85,.85])k.box('leg',[.06,.3,.06],[x+dx,y+.15,z+dz],wood);}
  k.cyl('umbrella-pole',.07,2.8,[-2.5,height(-2.5,2)+1.4,2],pole,8);k.cyl('umbrella',4.2,.7,[-2.5,height(-2.5,2)+2.9,2],canvas,16,.1);
  // The pier: planks on posts out over the water, a bench at the end.
  for(let z=SHORE-2;z<PIER_END;z+=.5)k.box('plank',[3,.08,.42],[21.5,.62,z],wood);for(let z=SHORE;z<PIER_END;z+=3)for(const x of PIER)k.cyl('pier-post',.25,2.4,[x,-.4,z],wood,8);
  const bench=await k.model('bench');k.place(bench,[21.5,.66,33],0,1);
  // Gulls wheeling out over the water.
  const gullMat=k.material('gull',{hex:'#f2f2f2'}),gulls=[];for(let i=0;i<6;i++){const n=new B.TransformNode('vr-gull',k.scene);n.parent=k.parent;for(const s of [-1,1]){const w=B.MeshBuilder.CreatePlane('vr-gwing',{width:.8,height:.22,sideOrientation:B.Mesh.DOUBLESIDE},k.scene);w.material=gullMat;w.parent=n;w.position.x=s*.4;w.rotation.x=Math.PI/2;w.side=s;w.isPickable=false;}gulls.push({n,a:i,r:20+i*5,h:12+i*2});}
  k.every((dt,time)=>{for(const g of gulls){g.a+=dt*.12;g.n.position.set(Math.cos(g.a)*g.r,g.h,40+Math.sin(g.a)*g.r*.6);g.n.rotation.y=-g.a;for(const w of g.n.getChildMeshes())w.rotation.z=w.side*Math.sin(time*5+g.a)*.45;}});
  // Offshore, in sight of the beach and the pier. The sea plane and its collision are left as they are.
  Dolphins.spawn(k,dolphin,low?2:3);
  let found=0;
  // ---- Fishing from the pier. Press E to cast; when the float dips (a splash, and the words on screen) press E again within a moment to land the fish.
  // Too early or too late and it gets away. The fish stay in the simulation; the COUNT of fish landed is kept outside it (local-progress.js). Each player fishes
  // on their own screen: in a shared session the others do not see the line.
  const FISH=[['a small silver fish',.2,.6],['a striped reef fish',.4,1.2],['a yellow-tailed fish',.6,1.8],['a broad flat fish',.9,2.6],['a long blue fish',1.5,4.5],['a heavy red fish',2.5,7]];
  const rodMat=k.material('rod',{hex:'#3a2a1c'}),floatMat=k.material('float',{hex:'#ff5a3c',emissive:'#5a1408'}),fishMat=k.material('fish',{hex:'#b9c7d4',spec:.5});
  const rod=k.cyl('rod',.035,2.6,[0,0,0],rodMat,6,.012),bob=k.mesh(B.MeshBuilder.CreateSphere('vr-float',{diameter:.16,segments:8},k.scene),floatMat,[0,0,0]),line=k.cyl('line',.008,1,[0,0,0],rodMat,4),
   fish=k.mesh(B.MeshBuilder.CreateSphere('vr-fish',{diameter:.5,segments:8},k.scene),fishMat,[0,0,0]);fish.scaling.set(1,.42,.3);for(const m of [rod,bob,line,fish]){m.setEnabled(false);m.isPickable=false;}
  const fishing={state:'idle',t:0,bite:0,at:[0,0],jump:0};
  const stow=()=>{fishing.state='idle';for(const m of [rod,bob,line])m.setEnabled(false);};
  function cast(){const side=walker.x<21.5?-1:1;fishing.at=[side<0?PIER[0]-2.6:PIER[1]+2.6,Math.max(SHORE+4,Math.min(PIER_END-1,walker.z+.5))];fishing.state='waiting';fishing.t=0;fishing.bite=3+Math.random()*6;
   walker.yaw=side*Math.PI/2;walker.pitch=.12;   // you turn to the water you are casting into
   fishing.at[1]=walker.z;rod.position.set(walker.x+side*.9,1.9,walker.z-side*.45);rod.rotation.set(0,0,-side*1.05);bob.position.set(fishing.at[0]+side*1.4,-.02,fishing.at[1]-side*.45);
   const tip=[walker.x+side*2.02,2.55,walker.z-side*.45],dx=bob.position.x-tip[0],dy=bob.position.y-tip[1],len=Math.hypot(dx,dy);line.scaling.y=len;line.position.set(tip[0]+dx/2,tip[1]+dy/2,bob.position.z);line.rotation.set(0,0,Math.atan2(dx,-dy));
   for(const m of [rod,bob,line])m.setEnabled(true);api.sfx(520,.18,'triangle',.05);announce('You cast out from the pier. Watch the float; press E when it dips.');}
  function land(){const f=FISH[Math.min(FISH.length-1,Math.floor(Math.random()**1.6*FISH.length))],kg=(f[1]+Math.random()*(f[2]-f[1])).toFixed(1),r=globalThis.VoidLocalProgress?.count('tropical-fish',1);
   fish.position.set(bob.position.x,0,bob.position.z);fish.setEnabled(true);fishing.jump=1;stow();api.sfx(880,.3,'triangle',.07);
   const total=r?r.total:0,got=r?.earned?.[0];announce('You land '+f[0]+', '+kg+' kg, and let it go.'+(total?' Fish landed: '+total+'.':'')+(got?' That is '+got.goal+': the goal of "'+got.title+'".':''));}
  k.every((dt,time)=>{
   if(fishing.jump>0){fishing.jump-=dt*1.1;const j=1-fishing.jump;fish.position.y=Math.sin(j*Math.PI)*1.5;fish.rotation.z=j*5;if(fishing.jump<=0)fish.setEnabled(false);}
   if(fishing.state==='idle')return;fishing.t+=dt;
   if(!onPier(walker.x,walker.z)){stow();announce('You reel in and leave the pier.');return;}
   if(fishing.state==='waiting'){bob.position.y=-.02+Math.sin(time*2.2)*.03;if(fishing.t>=fishing.bite){fishing.state='bite';fishing.t=0;api.sfx(300,.2,'sine',.09);announce('A BITE! Press E now!');}}
   else if(fishing.state==='bite'){bob.position.y=-.16+Math.sin(time*26)*.05;if(fishing.t>1.7){stow();api.sfx(180,.3,'sine',.05);announce('Too slow. It took the bait and got away.');}}});
  return {tick:k.tick,dispose:k.dispose,
   update(){walker.y+=onPier(walker.x,walker.z)?.66:height(walker.x,Math.min(walker.z,SHORE+1.5));api.audioLevel('waves',.06+.12*Math.max(0,1-Math.abs(walker.z-SHORE)/40)**2,.3);},
   interact(item){const id=item.id.slice(3);
    if(id.startsWith('lounger')){const [x,z]=spots.lounger[+id.slice(7)];api.sit({x,z:z-.6,yaw:0,eye:.95,pitch:.05,text:'You stretch out on the lounger. The sea is warm and blue.'});}
    else if(id==='pier-bench')api.sit({x:21.5,z:33.2,yaw:0,eye:1.75,text:'You sit at the end of the pier, the sea all around you.'});
    else if(id==='hut'){const next=k.time==='day'?'sunset':'day';setTime(next);api.session.settings.time=next;announce(next==='day'?'Bright afternoon.':'Sunset over the water.');}
    else if(id==='fish'){if(fishing.state==='idle')cast();else if(fishing.state==='bite')land();else{stow();announce('You reel in too early. Nothing on the line.');}}
    else if(id==='surf'){api.sfx(220,.8,'sine',.06);announce('Warm water runs over your feet and draws back across the sand.');}
    else if(id.startsWith('shell')){const s=shells[+id.slice(5)];if(s.isEnabled()){s.setEnabled(false);found++;api.sfx(1200,.25,'triangle',.05);announce('A shell, pink inside. ('+found+' of '+shells.length+' found. They stay in the simulation.)');}}},
   setOption(key,val){if(key==='time'&&val!==k.time)setTime(val);if(key==='gulls')api.audioSet('birdLevel',val==='off'?0:1);}};
 }
 VoidVR.register({id:'tropical',shared:true,title:'Tropical Escape',status:'ready',station:1,preview:'void-runner/assets/vr/sky/beach-day.jpg',
  description:'A sandy beach on a calm sea: palms, loungers, a thatched shelter, a pier, and dolphins leaping offshore.',
  defaults:{time:'day',gulls:'on'},settings:[{key:'time',label:'Time of day',values:[['day','Afternoon'],['sunset','Sunset']]},{key:'gulls',label:'Gulls',values:[['on','On'],['off','Off']]}],
  ambience:()=>({waves:.12,wind:.03,gulls:true}),layout,build});
})();
