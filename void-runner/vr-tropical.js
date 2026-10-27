/* VR experience: Tropical Escape. A sandy beach on a calm sea: palms, loungers under an umbrella, a thatched
   shelter, a wooden pier with a bench at the end, shells along the tideline, and a day or sunset sky. Coastal rocks,
   shells and plants from Poly Haven (CC0); palms, pier and shelter built here; generated surf, wind and gulls. */
(function(){
 const {kit,spot}=VoidVRKit;
 const SHORE=10,PIER=[20,23],PIER_END=34;
 // Sand rises gently from the waterline; small dunes toward the back.
 const height=(x,z)=>z>SHORE+2?-.6-(z-SHORE-2)*.25:(SHORE-z)*.035+.25*Math.sin(x*.12)*Math.max(0,(SHORE-6-z)/30);
 const onPier=(x,z)=>x>PIER[0]&&x<PIER[1]&&z>SHORE-2&&z<PIER_END;
 const spots={lounger:[[-6,3],[-2.5,3],[1,3]],pierBench:[21.5,32.5],hut:[-18,-14],surf:[-10,11.5],shells:[[-26,8.5],[6,9.2],[30,8]]};
 function layout(){const sea=(x0,x1)=>({id:'vr-sea',position:[(x0+x1)/2,1,27],size:[x1-x0,2,26]});
  return {id:'vr-tropical',name:'VR · TROPICAL ESCAPE',bounds:[40,40],spawn:[-4,1.7,-24],yaw:0,music:null,signs:[],
   solids:[sea(-41,PIER[0]),sea(PIER[1],41),{id:'vr-pier-end',position:[21.5,1,PIER_END+1],size:[4,2,2]},{id:'vr-hut',position:[-18,1,-16.6],size:[.4,2,.4]},{id:'vr-hut2',position:[-14.6,1,-16.6],size:[.4,2,.4]}],
   interactions:[...spots.lounger.map(([x,z],i)=>spot('lounger'+i,'RELAX ON THE LOUNGER',x,z-1.2,1.8)),spot('pier-bench','SIT AT THE END OF THE PIER',21.5,31.6,2),spot('hut','CHANGE THE SKY (DAY / SUNSET)',-16.3,-12.4,2.4),spot('surf','WADE INTO THE SURF',-10,11.5,3),...spots.shells.map(([x,z],i)=>spot('shell'+i,'PICK UP THE SHELL',x,z,1.8))]};}
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
  const [rocks,fern,grass,shell,patio]=await Promise.all(['coast-rocks','fern','grass','shell','patio-set'].map(n=>k.model(n)));
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
  let found=0;
  return {tick:k.tick,dispose:k.dispose,
   update(){walker.y+=onPier(walker.x,walker.z)?.66:height(walker.x,Math.min(walker.z,SHORE+1.5));api.audioLevel('waves',.06+.12*Math.max(0,1-Math.abs(walker.z-SHORE)/40)**2,.3);},
   interact(item){const id=item.id.slice(3);
    if(id.startsWith('lounger')){const [x,z]=spots.lounger[+id.slice(7)];api.sit({x,z:z-.6,yaw:0,eye:.95,pitch:.05,text:'You stretch out on the lounger. The sea is warm and blue.'});}
    else if(id==='pier-bench')api.sit({x:21.5,z:33.2,yaw:0,eye:1.75,text:'You sit at the end of the pier, the sea all around you.'});
    else if(id==='hut'){const next=k.time==='day'?'sunset':'day';setTime(next);api.session.settings.time=next;announce(next==='day'?'Bright afternoon.':'Sunset over the water.');}
    else if(id==='surf'){api.sfx(220,.8,'sine',.06);announce('Warm water runs over your feet and draws back across the sand.');}
    else if(id.startsWith('shell')){const s=shells[+id.slice(5)];if(s.isEnabled()){s.setEnabled(false);found++;api.sfx(1200,.25,'triangle',.05);announce('A shell, pink inside. ('+found+' of '+shells.length+' found. They stay in the simulation.)');}}},
   setOption(key,val){if(key==='time'&&val!==k.time)setTime(val);if(key==='gulls')api.audioSet('birdLevel',val==='off'?0:1);}};
 }
 VoidVR.register({id:'tropical',title:'Tropical Escape',status:'ready',station:1,preview:'void-runner/assets/vr/sky/beach-day.jpg',
  description:'A sandy beach on a calm sea: palms, loungers, a thatched shelter and a pier at sunset or in the afternoon sun.',
  defaults:{time:'day',gulls:'on'},settings:[{key:'time',label:'Time of day',values:[['day','Afternoon'],['sunset','Sunset']]},{key:'gulls',label:'Gulls',values:[['on','On'],['off','Off']]}],
  ambience:()=>({waves:.12,wind:.03,gulls:true}),layout,build});
})();
