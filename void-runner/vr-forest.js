/* VR experience: Relax in a Forest. Woodland paths, a stream with a waterfall, a sunlit clearing, birds and
   butterflies, and places to sit, rest, watch wildlife and touch the water. Photoscanned plants and rocks
   (Poly Haven, CC0), painted-leaf trees, generated ambience. */
(function(){
 const {kit,spot}=VoidVRKit;
 // The stream runs north-south along the east side; the walk area is flat-ish, rising into hills at the edges.
 const streamX=z=>22+6*Math.sin(z/14),R=46;
 function height(x,z){const d=Math.abs(x-streamX(z)),edge=Math.max(0,Math.max(Math.abs(x),Math.abs(z))-R+4);
  return .22*Math.sin(x*.11)*Math.cos(z*.09)+.12*Math.sin(x*.31+z*.23)-(d<3.4?.75*(1-d/3.4)**1.5:0)+edge**1.6*.35;}
 const spots={bench:[-30,18],log:[19.4,10],water:[20.2,-2],clearing:[0,6],chimes:[-6.5,12.5],hide:[-30,18]};
 function layout(){
  const trunk=(x,z)=>({id:'vr-tree',position:[x,1,z],size:[.7,2,.7]});
  return {id:'vr-forest',name:'VR · RELAX IN A FOREST',bounds:[R,R],spawn:[0,1.7,-38],yaw:0,music:null,signs:[],
   solids:[...trees().filter(t=>Math.abs(t.x)<R&&Math.abs(t.z)<R).map(t=>trunk(t.x,t.z)),{id:'vr-falls',position:[24,2,43],size:[14,4,4]},{id:'vr-bench',position:[-30,.5,19],size:[2.2,1,.8]}],
   interactions:[spot('bench','SIT ON THE BENCH',-30,17.8),spot('log','SIT ON THE LOG BY THE STREAM',19.4,10),spot('water','TOUCH THE WATER',20.2,-2),spot('clearing','LIE DOWN IN THE CLEARING',0,6,3),spot('chimes','RING THE WIND CHIMES',-6.5,12.5),spot('hide','WATCH WILDLIFE',-30,21,2.2)]};}
 // Tree positions: denser toward the edges, never on the paths, the clearing, the stream or the start.
 let cache=null;function trees(){if(cache)return cache;let seed=91;const rnd=()=>((seed=seed*16807%2147483647)-1)/2147483646,out=[];
  const onPath=(x,z)=>Math.abs(x)<3&&z<8||Math.hypot(x,z-6)<10||Math.abs(z-10)<2.6&&x>0&&x<20||Math.abs(z-18)<2.6&&x<0&&x>-32||Math.abs(x-streamX(z))<4;
  for(let i=0;i<900&&out.length<120;i++){const x=(rnd()*2-1)*58,z=(rnd()*2-1)*58;if(onPath(x,z)||Math.hypot(x,z+38)<6)continue;if(Math.max(Math.abs(x),Math.abs(z))<30&&rnd()<.55)continue;out.push({x,z,kind:Math.floor(rnd()*3),s:.8+rnd()*.6,r:rnd()*6.28});}
  return cache=out;}
 async function build(ctx){
  const k=kit(ctx),B=k.B,api=ctx.api;
  k.light({clear:[.62,.74,.86],fog:[.56,.66,.62],fogDensity:.012,sunColor:[1,.9,.72],sunIntensity:1.5,sunDir:[-.55,-.75,.35],sky:[.75,.85,.95],ground:[.25,.3,.18],ambient:.85,exposure:1.05});
  k.sky('forest',1.2);
  const ground=k.material('ground',{color:'grass-color',normal:'grass-normal',scale:28,hex:'#c9d6b8'});
  k.terrain('ground',140,140,height,ground);
  // Woodland paths: forest-floor ribbons that follow the ground.
  const pathMat=k.material('path',{color:'forest-floor-color',normal:'forest-floor-normal',scale:1});pathMat.opacityTexture=k.paint('path-edge',64,8,(g,W)=>{const gr=g.createLinearGradient(0,0,W,0);gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(.25,'#fff');gr.addColorStop(.75,'#fff');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,W,8);},true);pathMat.opacityTexture.getAlphaFromRGB=true;
  const ribbon=(pts,w)=>{const l=[],r=[];for(let i=0;i<pts.length;i++){const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)],dx=b[0]-a[0],dz=b[1]-a[1],n=Math.hypot(dx,dz)||1,ox=-dz/n*w/2,oz=dx/n*w/2,[x,z]=pts[i];l.push(new B.Vector3(x+ox,height(x+ox,z+oz)+.04,z+oz));r.push(new B.Vector3(x-ox,height(x-ox,z-oz)+.04,z-oz));}
   const m=B.MeshBuilder.CreateRibbon('vr-path',{pathArray:[l,r]},k.scene);const uv=[];for(let j=0;j<2;j++)for(let i=0;i<pts.length;i++)uv.push(j,i*.5);m.setVerticesData(B.VertexBuffer.UVKind,uv);return k.mesh(m,pathMat);};
  const line=(a,b,n=24)=>Array.from({length:n+1},(_,i)=>[a[0]+(b[0]-a[0])*i/n+Math.sin(i*.7)*.6*(i%n?1:0),a[1]+(b[1]-a[1])*i/n]);
  ribbon(line([0,-44],[0,0],30),2.4);ribbon(line([0,10],[19,10],16),1.8);ribbon(line([0,16],[-30,18],22),1.8);
  // The stream and its waterfall.
  const water=k.water('stream',{hex:'#2a5a55',alpha:.86,sky:'forest',scale:6});
  {const l=[],r=[];for(let z=-70;z<=42;z+=2){const x=streamX(z);l.push(new B.Vector3(x-2.6,-.1,z));r.push(new B.Vector3(x+2.6,-.1,z));}k.mesh(B.MeshBuilder.CreateRibbon('vr-stream',{pathArray:[l,r]},k.scene),water);}
  const boulder=await k.model('boulder'),fern=await k.model('fern'),grass=await k.model('grass'),moss=await k.model('moss'),log=await k.model('log'),bench=await k.model('bench');
  // The falls: a cliff of boulders, a sheet of falling water and mist.
  for(const [x,y,z,s,r] of [[18,0,44,4.5,0],[24,3,46,5.5,1],[30,0,44,4.8,2],[21,6,47,4,3],[27,6.5,47,4.2,4],[24,9,48,3.6,5]])k.place(boulder,[x,y,z],r,s);
  {const t=k.paint('falls',128,512,(g,W,H)=>{g.clearRect(0,0,W,H);for(let i=0;i<70;i++){const x=Math.random()*W;g.strokeStyle='rgba(235,245,255,'+(.25+Math.random()*.55)+')';g.lineWidth=1+Math.random()*3;g.beginPath();g.moveTo(x,0);g.lineTo(x+(Math.random()-.5)*6,H);g.stroke();}},true);
   const m=k.material('falls');m.diffuseTexture=t;m.useAlphaFromDiffuseTexture=true;m.emissiveColor=new B.Color3(.55,.6,.62);m.backFaceCulling=false;t.vScale=2;k.every(dt=>{t.vOffset-=dt*1.4;});
   const sheet=k.mesh(B.MeshBuilder.CreatePlane('vr-falls',{width:3.4,height:9},k.scene),m,[24.5,4.2,43.2]);
   const mist=new B.ParticleSystem('vr-mist',220,k.scene);mist.particleTexture=k.paint('mist',64,64,(g,W)=>{const r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,255,255,.7)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,64,64);},true);
   mist.emitter=new B.Vector3(24.5,.3,42.5);mist.minEmitBox=new B.Vector3(-1.6,0,-.3);mist.maxEmitBox=new B.Vector3(1.6,.3,.3);mist.minSize=1;mist.maxSize=2.6;mist.minLifeTime=1.4;mist.maxLifeTime=2.8;mist.emitRate=70;mist.direction1=new B.Vector3(-.6,.6,-1);mist.direction2=new B.Vector3(.6,1.2,-.4);mist.color1=new B.Color4(1,1,1,.22);mist.color2=new B.Color4(.9,.95,1,.12);mist.colorDead=new B.Color4(1,1,1,0);mist.blendMode=B.ParticleSystem.BLENDMODE_STANDARD;mist.start();k.every(()=>{});k.mist=mist;}
  // Trees: three painted-leaf kinds, each a trunk and a crown, drawn as thin instances.
  const bark=k.material('bark',{color:'bark-color',normal:'bark-normal',hex:'#a89a88'});bark.diffuseTexture.vScale=3;
  const leafKinds=[k.foliage('leaves-oak',k.leafTexture('oak',[['#3f6b2a','#6c9a3c'],['#2f5a24','#5d8a32'],['#557d2c','#8fb24a']])),k.foliage('leaves-birch',k.leafTexture('birch',[['#6f9a3a','#a8c65a'],['#5c8a33','#93b84f']],{size:[7,14]})),k.foliage('leaves-pine',k.leafTexture('pine',[['#1f3b22','#36583a'],['#284a2b','#3f6a40']],{count:900,size:[12,26],needle:true}))];
  const kinds=[0,1,2].map(kind=>{const parts=[],crown=[],h=kind===2?11:kind===1?9:8;
   parts.push(B.MeshBuilder.CreateCylinder('t',{height:h,diameterTop:.18,diameterBottom:kind===1?.4:.62,tessellation:8},k.scene));parts[0].position.y=h/2;
   for(let i=0;i<(kind===2?0:4);i++){const b=B.MeshBuilder.CreateCylinder('b',{height:2.6,diameterTop:.05,diameterBottom:.16,tessellation:5},k.scene);b.position.set(Math.cos(i*1.7)*.7,h*.55+i*.6,Math.sin(i*1.7)*.7);b.rotation.set(.9,i*1.7,0);parts.push(b);}
   const cards=kind===2?14:12;for(let i=0;i<cards;i++){const s=kind===2?3.4-i*.16:3.2+Math.random()*1.2,y=kind===2?2.5+i*.62:h*.6+Math.random()*h*.45,rad=kind===2?.3:1.3+Math.random()*.6,a=i*2.39;
    for(const rot of [0,Math.PI/2]){const p=B.MeshBuilder.CreatePlane('c',{size:s,sideOrientation:B.Mesh.DOUBLESIDE},k.scene);p.position.set(Math.cos(a)*rad,y,Math.sin(a)*rad);p.rotation.set((Math.random()-.5)*.6,a+rot,(Math.random()-.5)*.4);crown.push(p);}
    if(kind!==2){const top=B.MeshBuilder.CreatePlane('c',{size:s*1.1},k.scene);top.position.set(Math.cos(a)*rad*.6,y+.6,Math.sin(a)*rad*.6);top.rotation.x=Math.PI/2;crown.push(top);}}
   const trunkMesh=B.Mesh.MergeMeshes(parts,true),crownMesh=B.Mesh.MergeMeshes(crown,true);trunkMesh.material=bark;crownMesh.material=leafKinds[kind];return [trunkMesh,crownMesh];});
  for(const [kind,[t,c]] of kinds.entries()){const list=trees().filter(x=>x.kind===kind),buf=new Float32Array(list.length*16);list.forEach((x,i)=>B.Matrix.Compose(new B.Vector3(x.s,x.s,x.s),B.Quaternion.RotationYawPitchRoll(x.r,0,0),new B.Vector3(x.x,height(x.x,x.z)-.1,x.z)).copyToArray(buf,i*16));
   for(const m of [t,c]){m.thinInstanceSetBuffer('matrix',buf.slice(),16);m.thinInstanceRefreshBoundingInfo(true);m.parent=k.parent;m.isPickable=false;}}
  // Ground cover.
  let seed=7;const rnd=()=>((seed=seed*16807%2147483647)-1)/2147483646,scatterOn=(n,keep,s0,s1)=>{const out=[];for(let i=0;i<n*4&&out.length<n;i++){const x=(rnd()*2-1)*50,z=(rnd()*2-1)*50;if(!keep(x,z))continue;out.push({p:[x,height(x,z)-.02,z],r:rnd()*6.28,s:s0+rnd()*(s1-s0)});}return out;};
  const offPath=(x,z)=>!(Math.abs(x)<1.6&&z<8)&&Math.abs(x-streamX(z))>2.8;
  k.scatter(grass,scatterOn(ctx.quality==='low'?220:520,(x,z)=>offPath(x,z)&&Math.hypot(x,z-6)>3,.9,1.6));
  k.scatter(fern,scatterOn(ctx.quality==='low'?60:150,(x,z)=>offPath(x,z)&&Math.hypot(x,z-6)>7,.8,1.5));
  k.scatter(moss,scatterOn(70,(x,z)=>offPath(x,z),.8,1.4));
  k.scatter(boulder,[...Array.from({length:14},(_,i)=>{const z=-40+i*6+rnd()*3,side=i%2?1:-1;return {p:[streamX(z)+side*(3+rnd()*1.5),-.2,z],r:rnd()*6,s:.5+rnd()*.7};}),{p:[-34,-.1,-8],r:1,s:1.4},{p:[34,-.1,-30],r:2,s:1.8},{p:[-38,-.1,30],r:3,s:1.6}]);
  k.place(log,[19.4,height(19.4,11.2)-.05,11.2],Math.PI/2,1.1);k.place(log,[-14,height(-14,-20),-20],.6,1.2);
  k.place(bench,[-30,height(-30,19)-.02,19],Math.PI,1);
  // Wind chimes on a low branch at the clearing's edge.
  const chimeMat=k.material('chime',{hex:'#b8c2c8',spec:.9}),chimes=[];k.cyl('chime-bar',.04,1.4,[-6.5,3.2,12.5],k.material('chime-wood',{hex:'#6b4a2e'})).rotation.z=Math.PI/2;
  for(let i=0;i<6;i++){const c=k.cyl('chime',.06,.5+i*.08,[-7.1+i*.24,2.7-i*.04,12.5],chimeMat,8);chimes.push(c);}
  // Light shafts through the canopy over the clearing.
  {const t=k.paint('shaft',64,256,(g,W,H)=>{const gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,'rgba(255,240,200,.0)');gr.addColorStop(.25,'rgba(255,240,200,.55)');gr.addColorStop(1,'rgba(255,240,200,0)');g.fillStyle=gr;g.fillRect(0,0,W,H);const h=g.createLinearGradient(0,0,W,0);h.addColorStop(0,'rgba(0,0,0,1)');h.addColorStop(.5,'rgba(0,0,0,0)');h.addColorStop(1,'rgba(0,0,0,1)');g.globalCompositeOperation='destination-out';g.fillStyle=h;g.fillRect(0,0,W,H);},true);
   const m=k.material('shaft');m.diffuseColor=B.Color3.Black();m.emissiveTexture=t;m.opacityTexture=t;m.disableLighting=true;m.alphaMode=B.Engine.ALPHA_ADD;m.backFaceCulling=false;m.alpha=.5;k.shafts=[];
   for(let i=0;i<7;i++){const p=k.mesh(B.MeshBuilder.CreatePlane('vr-shaft',{width:2.5+rnd()*2,height:16},k.scene),m,[-6+rnd()*12,7,2+rnd()*9]);p.rotation.set(.45,-.6+rnd()*.3,0);k.shafts.push(p);}}
  // Wildlife: a few birds wheeling overhead, butterflies in the clearing.
  const birdMat=k.material('bird',{hex:'#2a2622'}),birds=[];for(let i=0;i<9;i++){const n=new B.TransformNode('vr-bird',k.scene);n.parent=k.parent;for(const s of [-1,1]){const w=B.MeshBuilder.CreatePlane('vr-wing',{width:.6,height:.22,sideOrientation:B.Mesh.DOUBLESIDE},k.scene);w.material=birdMat;w.parent=n;w.position.x=s*.3;w.rotation.x=Math.PI/2;w.isPickable=false;w.side=s;}birds.push({n,a:i*.7,r:16+i*2.2,h:14+i%4*3,speed:.18+i%3*.04,c:[i%3*8-8,10+i%2*6]});}
  const flyMat=['#ffcf5a','#f2f2f2','#7fd0ff'].map((h,i)=>k.material('butterfly'+i,{hex:h,emissive:h}));const flies=[];for(let i=0;i<7;i++){const n=new B.TransformNode('vr-fly',k.scene);n.parent=k.parent;for(const s of [-1,1]){const w=B.MeshBuilder.CreatePlane('vr-fwing',{width:.12,height:.1,sideOrientation:B.Mesh.DOUBLESIDE},k.scene);w.material=flyMat[i%3];w.parent=n;w.position.x=s*.06;w.side=s;w.isPickable=false;}flies.push({n,ph:i*1.3,c:[-4+i*1.4,4+i%3*2]});}
  let flock=0,ripple=null;
  k.every((dt,time)=>{for(const b of birds){b.a+=dt*b.speed*(flock>0?2.2:1);const cx=flock>0?-30:b.c[0],cz=flock>0?30:b.c[1];b.n.position.set(cx+Math.cos(b.a)*b.r,b.h,cz+Math.sin(b.a)*b.r);b.n.rotation.y=-b.a;for(const w of b.n.getChildMeshes())w.rotation.z=w.side*Math.sin(time*9+b.a*3)*.6;}
   flock=Math.max(0,flock-dt);
   for(const f of flies){const t=time*.6+f.ph;f.n.position.set(f.c[0]+Math.sin(t)*2.2,.6+Math.abs(Math.sin(t*1.7))*.9,f.c[1]+Math.cos(t*.8)*2);for(const w of f.n.getChildMeshes())w.rotation.y=w.side*Math.sin(time*22+f.ph)*1.1;}
   for(const c of chimes)c.rotation.z=Math.sin(time*1.3+c.position.x*5)*(k.ring>0?.35:.05);k.ring=Math.max(0,(k.ring||0)-dt);
   if(ripple){ripple.t+=dt;ripple.m.scaling.setAll(1+ripple.t*3);ripple.m.visibility=Math.max(0,1-ripple.t);if(ripple.t>1.2){ripple.m.dispose();ripple=null;}}
   for(const s of k.shafts)s.visibility=k.beams===false?0:.8+Math.sin(time*.4+s.position.x)*.2;});
  const ringMat=k.material('ripple',{hex:'#dff4ff',emissive:'#9fc8d8'});ringMat.alpha=.6;
  return {tick:k.tick,dispose:k.dispose,
   update(){walker.y+=height(walker.x,walker.z);
    // The stream is louder close to it, the falls loudest of all.
    const d=Math.abs(walker.x-streamX(walker.z)),falls=Math.hypot(walker.x-24,walker.z-43);api.audioLevel('water',Math.min(.16,.16*Math.max(0,1-d/28)**2+.12*Math.max(0,1-falls/30)**2)*(k.waterLevel??1),.3);},
   interact(item){const id=item.id.slice(3);
    if(id==='bench')api.sit({x:-30,z:18.6,yaw:0,eye:1.2,text:'You sit on the bench. The forest goes on around you.'});
    else if(id==='log')api.sit({x:19.4,z:10.6,yaw:Math.PI/2,eye:1.1,text:'You sit on the log. The stream runs past your feet.'});
    else if(id==='clearing')api.sit({x:0,z:6,yaw:0,eye:.45,pitch:-1.15,text:'You lie back in the grass. Light comes through the leaves.'});
    else if(id==='hide'){api.sit({x:-30,z:18.6,yaw:0.2,eye:1.2,text:'You keep still and watch. Birds come wheeling over the trees.'});flock=14;for(let i=0;i<4;i++)setTimeout(()=>api.sfx(2600+Math.random()*1200,.18,'sine',.04),i*350);}
    else if(id==='water'){api.sfx(320,.5,'sine',.08);ripple?.m.dispose();ripple={t:0,m:k.mesh(B.MeshBuilder.CreateTorus('vr-ripple',{diameter:.6,thickness:.03,tessellation:24},k.scene),ringMat,[21.6,-.07,-2])};announce('The water is cold and clear. It runs over smooth stones.');}
    else if(id==='chimes'){k.ring=4;[1568,1760,2093,2349,2637].forEach((f,i)=>setTimeout(()=>api.sfx(f,1.6,'sine',.05),i*180));}},
   setOption(key,val){if(key==='birds')api.audioSet('birdLevel',val==='off'?0:val==='low'?.4:1);if(key==='water')k.waterLevel=val==='soft'?.4:1;if(key==='beams')k.beams=val==='on';}};
 }
 VoidVR.register({id:'forest',title:'Relax in a Forest',status:'ready',station:1,tint:'linear-gradient(135deg,#1d3b22,#5c8a3a)',preview:'void-runner/assets/vr/sky/forest.jpg',
  description:'A quiet forest with woodland paths, a stream and a waterfall, a sunlit clearing, birds and butterflies. Sit, rest, listen.',
  defaults:{birds:'high',water:'normal',beams:'on'},settings:[{key:'birds',label:'Birdsong',values:[['high','Lively'],['low','Quiet'],['off','Off']]},{key:'water',label:'Stream',values:[['normal','Clear'],['soft','Soft']]},{key:'beams',label:'Sunbeams',values:[['on','On'],['off','Off']]}],
  ambience:()=>({wind:.05,leaves:.02,water:true,birds:true}),layout,build});
})();
