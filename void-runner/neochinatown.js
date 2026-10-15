/* NeoChinatown, Tessaly: the landing street, the alley and The Darknet District.
   layout() is engine-independent gameplay data (walls, interactions, signs).
   build() is presentation only; it never changes collision or progression. */
(function(root){
  const base=typeof document!=='undefined'&&document.currentScript?new URL('.',document.currentScript.src):null;

  // ---- Layout -------------------------------------------------------------
  // Street (z -62..0) -> alley (z 0..20) -> vestibule (z 20..26) -> hallway (z 26..78).
  // Rooms branch off the hallway; the smoking terrace is reached by the stairs.
  const solids=[];
  const wall=(id,x1,z1,x2,z2,h=6,t=.4)=>{const w=Math.abs(x2-x1)||t,d=Math.abs(z2-z1)||t;solids.push({id,position:[(x1+x2)/2,h/2,(z1+z2)/2],size:[w,h,d]});};
  // Street canyon and landing pad.
  wall('street-west',-12,-64,-12,0,40,4);wall('street-east',12,-64,12,0,40,4);wall('street-end',-12,-64,12,-64,40,2);
  // Alley.
  wall('alley-west-block',-12,0,-3,0,30,2);wall('alley-east-block',3,0,12,0,30,2);
  wall('alley-west',-3,0,-3,26,30);wall('alley-east',3,0,3,26,30);
  solids.push({id:'district-door',position:[0,1.6,20],size:[6,3.2,.3]});
  solids.push({id:'district-inner-door',position:[0,1.6,26],size:[6,3.2,.3]});
  // Hallway walls with openings to each room.
  const left=[[26,31.5],[36.5,46.5],[52.5,59.5],[64.5,78]],right=[[26,30.5],[35.5,44.5],[49.5,60.5],[64.5,78]];
  left.forEach(([a,b],i)=>wall('hall-west-'+i,-3,a,-3,b));right.forEach(([a,b],i)=>wall('hall-east-'+i,3,a,3,b));
  wall('hall-end',-3,78,3,78);
  // VR / arcade (west, z 28..44).
  wall('vr-north',-17,28,-3,28);wall('vr-west',-17,28,-17,44);wall('vr-south',-17,44,-3,44);
  // Vending alcove (west, z 46.5..52.5).
  wall('vend-back',-7,46.5,-7,52.5);wall('vend-n',-7,46.5,-3,46.5);wall('vend-s',-7,52.5,-3,52.5);
  // Sleeping pods (west, z 55..70).
  wall('pods-north',-17,55,-3,55);wall('pods-west',-17,55,-17,70);wall('pods-south',-17,70,-3,70);
  // Bar (east, z 28..42).
  wall('bar-north',3,28,17,28);wall('bar-east',17,28,17,42);wall('bar-south',3,42,17,42);
  // Admin & Iris shop (east, z 43..53).
  wall('shop-north',3,43,17,43);wall('shop-east',17,43,17,53);wall('shop-south',3,53,17,53);
  // Meeting room (east, z 56..69); its door stays shut unless Admin opens it.
  wall('meet-north',3,56,15,56);wall('meet-east',15,56,15,69);wall('meet-south',3,69,15,69);
  solids.push({id:'meeting-door',position:[3,1.6,62.5],size:[.3,3.2,4]});
  // Furniture that blocks movement.
  for(const [id,x,z,w,d] of [['bar-counter',10,38.5,9,1.1],['shop-counter',10,47.2,8,1.1],['meeting-table',9,62.5,4,2.4],['arcade-row',-15.6,36,1,12],['pods-row',-15.4,62.5,2.6,13]])solids.push({id,position:[x,.6,z],size:[w,1.2,d]});
  // Smoking terrace, an open roof reached by the stairs at the hallway end.
  wall('terrace-north',28,58,48,58,1.1);wall('terrace-south',28,78,48,78,1.1);wall('terrace-west',28,58,28,78,1.1);wall('terrace-east',48,58,48,78,1.1);

  const interactions=[
    {id:'board',label:'BOARD YOUR SHIP',position:[0,1.7,-54],action:'board',range:3.5},
    {id:'terminal',label:'LANDING TERMINAL',position:[7,1.7,-44],action:'terminal',range:3},
    {id:'tdd',label:'ENTER THE DARKNET DISTRICT',position:[0,1.7,19.2],action:'tdd',range:3},
    {id:'district-scan',label:'PRESENT BADGE TO SCANNER',position:[2.2,1.7,24.5],action:'district-scan',range:2.6,when:{flags:{districtDoor:true}}},
    // Admin and Iris are both at the counter, except while the first faction payment waits and Admin is 'occupied' (doc 06).
    {id:'admin',label:'SPEAK WITH ADMIN',position:[8,1.7,46.2],action:'admin',range:3,when:{notFlags:{adminOccupied:true}}},
    {id:'district-iris',label:'SPEAK WITH IRIS',position:[12.5,1.7,46.2],action:'district-iris',range:3},
    {id:'district-shop',label:'BROWSE THE SHOP',position:[14.8,1.7,50.5],action:'district-shop',range:2.8},
    {id:'district-bar',label:'TALK TO THE BARTENDER',position:[10,1.7,37.2],action:'district-bar',range:3},
    {id:'district-vr',label:'VR RIGS',position:[-9,1.7,40],action:'district-vr',range:3},
    {id:'district-vending',label:'VENDING MACHINES',position:[-5,1.7,49.5],action:'district-vending',range:2.6},
    {id:'district-pod',label:'REST IN A SLEEP POD',position:[-12.5,1.7,62.5],action:'district-pod',range:3},
    {id:'district-meeting',label:'MEETING ROOM / PRIVATE',position:[2.4,1.7,62.5],action:'district-meeting',range:2.6},
    {id:'district-stairs',label:'CLIMB TO THE SMOKING AREA',position:[0,1.7,75.5],action:'district-stairs',range:2.6},
    {id:'district-stairs-down',label:'GO BACK DOWNSTAIRS',position:[30,1.7,68],action:'district-stairs-down',range:2.6}
  ];
  const signs=[];
  function layout(){return {id:'neochinatown',name:'NEOCHINATOWN / TESSALY',kind:'city',district:true,bounds:[50,80],spawn:[0,1.7,-47],yaw:0,color:'#3a2f4a',music:'earth',ship:'starter',
    solids:solids.map(s=>({...s,position:s.position.slice(),size:s.size.slice()})),interactions:interactions.map(i=>({...i,position:i.position.slice()})),signs:[]};}

  // ---- Presentation -------------------------------------------------------
  const ads=()=>(root.VoidAds?.brands||[]).map(b=>b.id);
  function build({scene,parent,quality,characterModel,shipModel,state}){
    const B=root.BABYLON,low=quality==='low',owned=[],textures=[],staticMeshes=new Map(),dynamic=[],v=(x,y,z)=>new B.Vector3(x,y,z);
    let seed=4127;const rand=()=>((seed=seed*16807%2147483647)-1)/2147483646;
    const previous={clear:scene.clearColor.clone(),fogMode:scene.fogMode,fogDensity:scene.fogDensity,fogColor:scene.fogColor.clone()};
    scene.clearColor=new B.Color4(.035,.03,.07,1);scene.fogMode=B.Scene.FOGMODE_EXP2;scene.fogDensity=.0085;scene.fogColor=new B.Color3(.10,.07,.16);
    const sun=scene.getLightByName('sun'),ambient=scene.getLightByName('ambient');const lightState={sun:sun?.intensity,ambient:ambient?.intensity};
    if(sun)sun.intensity=.25;if(ambient){ambient.intensity=.8;}
    const mats={};
    function mat(key,hex,{rough=.8,metal=.2,glow=null,alpha=1}={}){if(mats[key])return mats[key];const m=new B.PBRMaterial('ncz-'+key,scene);m.albedoColor=B.Color3.FromHexString(hex);m.roughness=rough;m.metallic=metal;if(glow)m.emissiveColor=B.Color3.FromHexString(glow);if(alpha<1){m.alpha=alpha;m.transparencyMode=2;}owned.push(m);mats[key]=m;return m;}
    function glowMat(key,hex,intensity=1){if(mats[key])return mats[key];const m=new B.StandardMaterial('ncz-'+key,scene);m.diffuseColor=B.Color3.Black();m.emissiveColor=B.Color3.FromHexString(hex).scale(intensity);m.disableLighting=true;owned.push(m);mats[key]=m;return m;}
    function add(mesh,m,p,merge=true){mesh.material=m;mesh.position.set(...p);mesh.parent=parent;mesh.isPickable=false;mesh.receiveShadows=false;if(merge){if(!staticMeshes.has(m))staticMeshes.set(m,[]);staticMeshes.get(m).push(mesh);}else dynamic.push(mesh);return mesh;}
    const box=(name,size,p,m,merge=true)=>add(B.MeshBuilder.CreateBox(name,{width:size[0],height:size[1],depth:size[2]},scene),m,p,merge);
    const cyl=(name,r,h,p,m,merge=true,t=12)=>add(B.MeshBuilder.CreateCylinder(name,{diameter:r*2,height:h,tessellation:t},scene),m,p,merge);
    function texture(name,w,h,draw){const t=new B.DynamicTexture('ncz-'+name,{width:w,height:h},scene,true);draw(t.getContext(),w,h);t.update();textures.push(t);return t;}
    function texMat(name,t,{glow=false,alpha=false}={}){const m=new B.StandardMaterial('ncz-'+name,scene);owned.push(m);if(glow){m.diffuseColor=B.Color3.Black();m.emissiveTexture=t;m.disableLighting=true;}else{m.diffuseTexture=t;m.specularColor=new B.Color3(.08,.08,.1);}if(alpha){m.opacityTexture=t;}return m;}
    function plane(name,w,h,p,m,ry=0,merge=false){const mesh=B.MeshBuilder.CreatePlane(name,{width:w,height:h,sideOrientation:B.Mesh.DOUBLESIDE},scene);add(mesh,m,p,merge);mesh.rotation.y=ry;return mesh;}
    function neon(name,lines,colors,w,h,p,ry=0,bg='rgba(0,0,0,0)'){const t=texture(name,512,Math.round(512*h/w),(g,W,H)=>{g.fillStyle=bg;g.fillRect(0,0,W,H);const n=lines.length;lines.forEach((text,i)=>{const size=Math.min(H/n*.62,W/(Math.max(4,text.length)*.62));g.font='bold '+size+'px "Noto Sans SC","Microsoft YaHei",sans-serif';g.textAlign='center';g.textBaseline='middle';const c=colors[i%colors.length];g.shadowColor=c;g.shadowBlur=18;g.fillStyle=c;g.fillText(text,W/2,H*(i+.5)/n);g.shadowBlur=0;g.fillStyle='rgba(255,255,255,.85)';g.fillText(text,W/2,H*(i+.5)/n);});});return plane(name,w,h,p,texMat(name,t,{glow:true,alpha:true}),ry);}
    // Tessaly ads are painted locally (ad-art.js): ship parts, weapons, security, labour.
    const adMats={},adIds=ads();function adMat(id){if(adMats[id])return adMats[id];const brand=root.VoidAds.brands.find(b=>b.id===id)||root.VoidAds.brands[0];const t=texture('ad-'+brand.id,low?256:512,low?384:768,(g,W,H)=>root.VoidAds.paint(g,W,H,brand));const m=new B.StandardMaterial('ncz-ad-'+brand.id,scene);m.diffuseColor=B.Color3.Black();m.emissiveTexture=t;m.disableLighting=true;owned.push(m);adMats[id]=m;return m;}
    let adIndex=0;const nextAd=()=>adIds[(adIndex++)%adIds.length];
    function billboard(w,p,ry){const id=nextAd();const frame=box('billboard-frame',[w+.4,w*1.5+.4,.25],[p[0]+Math.sin(ry)*.15,p[1],p[2]+Math.cos(ry)*.15],mat('frame','#15151a',{rough:.5,metal:.7}));frame.rotation.y=ry;return plane('billboard',w,w*1.5,p,adMat(id),ry);}

    // Shared surfaces.
    const asphaltTex=texture('asphalt',512,512,(g,W,H)=>{g.fillStyle='#16161c';g.fillRect(0,0,W,H);for(let i=0;i<9000;i++){g.fillStyle='rgba('+(rand()<.5?'255,255,255':'0,0,0')+','+(rand()*.06)+')';g.fillRect(rand()*W,rand()*H,1+rand()*3,1+rand()*3);}for(let i=0;i<14;i++){const x=rand()*W,y=rand()*H,r=20+rand()*70,gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(40,30,60,.5)');gr.addColorStop(1,'rgba(40,30,60,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);}});
    asphaltTex.uScale=6;asphaltTex.vScale=10;
    const asphalt=mat('asphalt','#ffffff',{rough:.28,metal:.35});asphalt.albedoTexture=asphaltTex;
    const panelTex=texture('wall-panels',512,512,(g,W,H)=>{g.fillStyle='#22252b';g.fillRect(0,0,W,H);for(let y=0;y<H;y+=128)for(let x=0;x<W;x+=128){g.fillStyle='rgba(255,255,255,'+(.015+rand()*.03)+')';g.fillRect(x+4,y+4,120,120);g.strokeStyle='#0e1013';g.lineWidth=4;g.strokeRect(x+2,y+2,124,124);for(const [dx,dy] of [[10,10],[118,10],[10,118],[118,118]]){g.fillStyle='#4a4f57';g.fillRect(x+dx-3,y+dy-3,6,6);}}for(let i=0;i<2500;i++){g.fillStyle='rgba(0,0,0,'+(rand()*.12)+')';g.fillRect(rand()*W,rand()*H,1+rand()*8,1);}});
    const metal=mat('dark-metal','#ffffff',{rough:.55,metal:.6});metal.albedoTexture=panelTex;
    const grateTex=texture('grate',256,256,(g,W,H)=>{g.fillStyle='#1b1d21';g.fillRect(0,0,W,H);g.strokeStyle='#2c3036';g.lineWidth=3;for(let i=0;i<W;i+=16){g.beginPath();g.moveTo(i,0);g.lineTo(i,H);g.stroke();}for(let i=0;i<H;i+=48){g.fillStyle='#111316';g.fillRect(0,i,W,4);}});grateTex.uScale=3;grateTex.vScale=20;
    const floor=mat('grate','#ffffff',{rough:.45,metal:.6});floor.albedoTexture=grateTex;
    const frame=mat('frame','#15151a',{rough:.5,metal:.7}),pipe=mat('pipe','#3a3d42',{rough:.45,metal:.8}),rust=mat('rust','#5a3a2a',{rough:.85,metal:.3}),concrete=mat('concrete','#3b3a40',{rough:.9,metal:0});
    const cyan=glowMat('cyan','#38e8ff',1.1),magenta=glowMat('magenta','#ff3fb4',1.1),amber=glowMat('amber','#ffb347',1),red=glowMat('red','#ff3b3b',1),violet=glowMat('violet','#9b5cff',1),white=glowMat('white','#e8f0ff',.9);

    // ---- Street, landing pad and skyline ---------------------------------
    add(B.MeshBuilder.CreateGround('ncz-street',{width:24,height:66},scene),asphalt,[0,0,-31]);
    for(const x of [-10.5,10.5])box('sidewalk',[3,.18,64],[x,.09,-32],concrete);
    for(let z=-58;z<-2;z+=6)box('lane-mark',[.18,.02,2.6],[0,.02,z],glowMat('lane','#d7c06a',.55));
    box('landing-pad',[16,.12,16],[0,.06,-52],mat('pad','#26262c',{rough:.6,metal:.4}));
    for(const [x,z] of [[-7.6,-59.6],[7.6,-59.6],[-7.6,-44.4],[7.6,-44.4]])cyl('pad-light',.2,.14,[x,.14,z],amber,true,8);
    const ship=shipModel('starter','friendly',parent);ship.position.set(0,1.9,-55);ship.scaling.setAll(2.2);ship.rotation.y=Math.PI;
    for(let i=0;i<10;i++){const z=-58+i*6,x=(i%2?-1:1)*(4+rand()*4);const p=add(B.MeshBuilder.CreateDisc('puddle',{radius:.8+rand()*1.4,tessellation:18},scene),mat('puddle','#0c0c14',{rough:.04,metal:.9}),[x,.025,z]);p.rotation.x=Math.PI/2;p.scaling.y=.55;}
    // Tower faces: lit window grids. Each tower picks a palette.
    const windowMats=['#ffd08a','#7fe8ff','#ff8ad8'].map((c,k)=>{const t=texture('windows-'+k,256,512,(g,W,H)=>{g.fillStyle='#0b0b12';g.fillRect(0,0,W,H);for(let y=6;y<H;y+=14)for(let x=6;x<W;x+=12){if(rand()<.42){g.fillStyle=c;g.globalAlpha=.25+rand()*.75;g.fillRect(x,y,7,8);}}g.globalAlpha=1;});const m=new B.StandardMaterial('ncz-windows-'+k,scene);m.diffuseColor=new B.Color3(.05,.05,.07);m.emissiveTexture=t;owned.push(m);return m;});
    function tower(x,z,w,d,h,k){const m=windowMats[k%3];const b=box('tower',[w,h,d],[x,h/2,z],m);const roofY=h+.5;box('tower-crown',[w*.6,1.2,d*.6],[x,roofY,z],frame);if(rand()<.7){cyl('tower-mast',.15,6+rand()*8,[x,roofY+4,z],pipe);add(B.MeshBuilder.CreateSphere('tower-beacon',{diameter:.7,segments:6},scene),red,[x,roofY+9,z]);}if(rand()<.6)box('tower-neon-strip',[.25,h*.7,.25],[x+(w/2+.13)*(x<0?1:-1),h*.45,z-d/2+.6],[cyan,magenta,violet][k%3]);return b;}
    for(const side of [-1,1])for(let z=-62,k=0;z<2;k++){const d=8+rand()*8,w=10+rand()*8,h=40+rand()*110;tower(side*(14+w/2),z+d/2,w,d,h,k+(side>0?1:0));z+=d+.6;}
    if(!low)for(let i=0;i<46;i++){const a=i/46*Math.PI*2,r=110+rand()*90,x=Math.sin(a)*r,z=-20+Math.cos(a)*r;tower(x,z,12+rand()*14,12+rand()*14,60+rand()*170,i);}
    // Street-facing billboards and bilingual neon.
    for(let i=0;i<6;i++){const z=-56+i*10,side=i%2?-1:1;billboard(5.5,[side*11.7,10+rand()*14,z],side>0?Math.PI/2:-Math.PI/2);}
    for(let i=0;i<4;i++){const z=-50+i*13,side=i%2?1:-1;billboard(7,[side*11.7,30+rand()*18,z],side>0?Math.PI/2:-Math.PI/2);}
    const shopSigns=[[['夜市','NIGHT MARKET'],['#ff5bd0','#7ff0ff']],[['龍麵館','DRAGON NOODLES'],['#ffcf5a','#ff5b5b']],[['電子','ELECTRONICS'],['#7ff0ff','#9b7bff']],[['藥房','PHARMACY 24H'],['#6cff9e','#e8f0ff']],[['茶','TEA HOUSE'],['#ffb347','#ffe9c4']],[['功能','THE FUNCTION PROVIDES'],['#e8f0ff','#ff4a4a']]];
    shopSigns.forEach(([lines,colors],i)=>{const side=i%2?1:-1,z=-54+i*9;const s=neon('shop-sign-'+i,lines,colors,2.4,4.4,[side*11.55,4.6,z],side>0?Math.PI/2:-Math.PI/2);});
    neon('function-banner',['THE FUNCTION WATCHES OVER YOU','功能 · 秩序 · 利潤'],['#e8f0ff','#ff4a4a'],16,2.6,[0,16,-63.6],Math.PI);
    // Eye-level ad kiosks on both sidewalks, facing the road.
    for(let z=-56,i=0;z<-4;z+=8,i++){const side=i%2?-1:1,x=side*9.2;box('kiosk-frame',[.3,2.9,1.9],[x+side*.18,1.45,z],frame);plane('kiosk-ad',1.6,2.4,[x,1.55,z],adMat(nextAd()),side>0?Math.PI/2:-Math.PI/2);box('kiosk-trim',[.06,.06,1.9],[x,2.85,z],[cyan,magenta,amber][i%3]);}
    // Ground-floor storefront glow along the sidewalks.
    for(const side of [-1,1])for(let z=-60;z<-2;z+=7){box('storefront',[.1,3,5.5],[side*11.95,1.6,z+2.5],[glowMat('shop-cyan','#38e8ff',.32),glowMat('shop-magenta','#ff3fb4',.32),glowMat('shop-amber','#ffb347',.3),glowMat('shop-violet','#9b5cff',.32)][Math.floor(rand()*4)]);box('awning',[1.2,.12,5.8],[side*11.4,3.4,z+2.5],frame);}
    // IronEye drones patrol above the street.
    const drones=[];const droneBody=mat('ironeye','#1d1f24',{rough:.4,metal:.8});for(let i=0;i<(low?2:4);i++){const n=new B.TransformNode('ironeye-'+i,scene);n.parent=parent;const body=add(B.MeshBuilder.CreateSphere('ironeye-body',{diameter:.9,segments:10},scene),droneBody,[0,0,0],false);body.parent=n;body.scaling.y=.6;const eye=add(B.MeshBuilder.CreateDisc('ironeye-eye',{radius:.16,tessellation:12},scene),red,[0,0,-.46],false);eye.parent=n;for(const s of [-1,1]){const rot=box('ironeye-rotor',[.9,.04,.12],[s*.55,.25,0],frame,false);rot.parent=n;}drones.push({n,phase:i*1.7,z:-50+i*14});}
    // Street pedestrians.
    for(const [x,z,i] of [[-9.6,-40,1],[9.8,-33,2],[-9.4,-22,3],[9.5,-14,4],[-9.8,-8,5]])characterModel('crew-ncz'+i,parent,[x,0,z],true);

    // ---- Alley ------------------------------------------------------------
    add(B.MeshBuilder.CreateGround('alley-floor',{width:6,height:26},scene),asphalt,[0,.01,13]);
    for(const side of [-1,1]){box('alley-wall',[.3,14,26],[side*3.15,7,13],metal);for(let z=2;z<20;z+=3.5){cyl('alley-pipe',.12,14,[side*2.85,7,z],pipe,true,8);}
      box('alley-ac',[1,1.1,1.4],[side*2.4,3.4+rand()*4,6+rand()*10],pipe);for(let i=0;i<3;i++)box('alley-cable',[.04,.04,26],[side*2.7,5.5+i*.4,13],frame);}
    box('dumpster',[1.6,1.3,2.6],[-2,.65,8],mat('dumpster','#2d4a3a',{rough:.7,metal:.4}));
    box('alley-crates',[1,1,1],[2.2,.5,12],rust);box('alley-crates',[.8,.8,.8],[2.2,1.4,12.1],rust);
    for(const z of [4,11,17])box('alley-lamp',[.5,.12,.3],[0,6.2,z],amber);
    neon('alley-sign',['小心','WATCH YOUR STEP'],['#ff5bd0','#7ff0ff'],1.4,2.2,[-2.88,4.2,10],-Math.PI/2);
    billboard(2.2,[2.88,4.6,15],Math.PI/2);
    // Understated entrance: reinforced door, small mark, camera.
    box('district-door-frame',[6.4,3.6,.5],[0,1.8,20.15],frame);
    if(!state.story?.flags?.districtDoor){const door=box('district-door',[5.6,3.1,.28],[0,1.55,20],mat('door-steel','#2b2e33',{rough:.4,metal:.85}),false);door.name='district-door';}
    neon('district-mark',['DD'],['#9b7bff'],.7,.4,[2.6,2.9,19.7],0);
    box('camera-body',[.25,.2,.45],[-2.6,3.5,19.6],frame);box('camera-led',[.05,.05,.02],[-2.6,3.5,19.36],red);

    // ---- Vestibule --------------------------------------------------------
    add(B.MeshBuilder.CreateGround('vestibule-floor',{width:6,height:6},scene),floor,[0,.02,23]);
    for(const side of [-1,1])box('vestibule-wall',[.3,3.6,6],[side*3.1,1.8,23],metal);box('vestibule-ceiling',[6.4,.3,6],[0,3.6,23],frame);
    box('scanner-post',[.35,1.3,.35],[2.6,.65,24.5],frame);box('scanner-face',[.3,.4,.05],[2.6,1.25,24.31],cyan);
    for(const z of [21.5,24.5])box('status-display',[.05,.6,1],[-2.92,2.2,z],[cyan,magenta][z>23?1:0]);
    box('vestibule-light',[4,.05,.3],[0,3.42,23],white);
    if(!state.story?.flags?.districtBadge){const inner=box('district-inner-door',[5.6,3.1,.28],[0,1.55,26],mat('door-inner','#1d2026',{rough:.35,metal:.9}),false);inner.name='district-inner-door';box('inner-door-light',[5.6,.06,.06],[0,3.15,25.84],red,false).name='district-inner-door-light';}

    // ---- Hallway and room shells -----------------------------------------
    add(B.MeshBuilder.CreateGround('district-floor',{width:34,height:52},scene),floor,[0,.02,52]);
    box('district-ceiling',[34,.3,52],[0,4.2,52],frame);
    for(const s of solids){if(!/^(hall|vr|vend|pods|bar|shop|meet)-/.test(s.id))continue;box('district-wall',[Math.max(.3,s.size[0]),4.2,Math.max(.3,s.size[2])],[s.position[0],2.1,s.position[2]],metal);}
    for(let z=28;z<78;z+=4){box('hall-beam',[6,.3,.3],[0,3.9,z],frame);box('hall-led',[.08,.05,3.6],[-2.6,3.85,z+2],z%8?cyan:magenta);box('hall-led',[.08,.05,3.6],[2.6,3.85,z+2],z%8?magenta:cyan);}
    for(const [z,side] of [[30.5,1],[46,-1],[58,1],[66,-1]])plane('hall-ad',1.2,1.8,[side*2.82,2.2,z],adMat(nextAd()),side>0?Math.PI/2:-Math.PI/2);
    for(const z of [40,72])box('hall-camera',[.2,.2,.4],[2.7,3.6,z],frame);
    const roomSign=(lines,colors,p,ry)=>neon('room-sign-'+lines[0],lines,colors,2.4,.7,p,ry,'rgba(10,10,16,.9)');
    roomSign(['VR / ARCADE'],['#38e8ff'],[-2.8,3.4,34],-Math.PI/2);roomSign(['BAR · LOUNGE'],['#ffb347'],[2.8,3.4,33],Math.PI/2);
    roomSign(['ADMIN & IRIS'],['#9b7bff'],[2.8,3.4,47],Math.PI/2);roomSign(['VENDING'],['#6cff9e'],[-2.8,3.4,49.5],-Math.PI/2);
    roomSign(['SLEEP PODS'],['#ff5bd0'],[-2.8,3.4,62],-Math.PI/2);roomSign(['MEETING ROOM'],['#e8f0ff'],[2.8,3.4,62.5],Math.PI/2);
    roomSign(['SMOKING AREA ↑'],['#ffb347'],[0,3.5,77.7],0);
    neon('welcome',['THE DARKNET DISTRICT'],['#9b7bff'],5,.8,[0,3.3,26.6],0);

    // VR / arcade: rigs, cabinets, seating, players.
    for(let i=0;i<4;i++){const x=-13+i*2.6;box('vr-chair',[1.1,.6,1.1],[x,.3,32],mat('chair','#2a2340',{rough:.7}));box('vr-back',[1.1,1.2,.2],[x,1,31.5],mat('chair','#2a2340',{rough:.7}));box('vr-ring',[1.4,.06,1.4],[x,2.6,32],[cyan,magenta][i%2]);plane('vr-screen',1.4,.9,[x,1.9,30.1],adMat(nextAd()),Math.PI);characterModel('crew-vr'+i,parent,[x,0,32.3],true);}
    for(let i=0;i<5;i++){const z=31+i*2.4;box('arcade-cabinet',[1,2.1,1.4],[-16.2,1.05,z],mat('cabinet','#141420',{rough:.5,metal:.5}));plane('arcade-screen',.9,.8,[-15.68,1.55,z],adMat(nextAd()),-Math.PI/2);box('arcade-marquee',[.1,.3,1.3],[-15.66,2.2,z],[magenta,cyan,amber,violet][i%4]);}
    box('vr-bench',[4,.45,1],[-9,.22,42.5],mat('chair','#2a2340',{rough:.7}));characterModel('crew-vr-watch',parent,[-9,0,42.3],true);
    for(let i=0;i<3;i++)box('vr-floor-strip',[12,.02,.08],[-10,.03,36+i*2],[cyan,magenta,violet][i]);

    // Bar and lounge: counter, bottles, booths, bartender, patrons.
    box('bar-counter',[9,1.1,1.1],[10,.55,38.5],mat('bar-top','#2b1d18',{rough:.35,metal:.2}));box('bar-counter-glow',[9,.05,.05],[10,1.1,37.92],amber);
    box('bar-back-shelf',[10,.08,.5],[10,1.6,41.6],frame);box('bar-back-shelf',[10,.08,.5],[10,2.3,41.6],frame);
    for(let i=0;i<22;i++){const x=5.5+i*.42;cyl('bottle',.07,.32,[x,1.82+(i%2)*.7,41.6],[amber,cyan,magenta,violet][i%4],true,6);}
    for(const x of [6.5,9,11.5,14])cyl('bar-stool',.25,.8,[x,.4,37.2],frame,true,10);
    for(const z of [29.5,32.5]){box('booth-seat',[3.5,.5,1],[14.5,.25,z],mat('booth','#4a1d2e',{rough:.8}));box('booth-table',[2.6,.08,1],[14.5,.8,z+1],frame);}
    characterModel('nyx-district',parent,[10,0,40],false);characterModel('crew-bar1',parent,[7,0,36.6],true);characterModel('crew-bar2',parent,[14.5,0,30],true);
    plane('bar-menu',2.2,1.2,[16.8,2.4,35],texMat('bar-menu',texture('bar-menu',384,210,(g,W,H)=>{g.fillStyle='#0d0a08';g.fillRect(0,0,W,H);g.fillStyle='#ffb347';g.font='bold 22px monospace';g.fillText('BAR · LOUNGE',16,32);g.font='15px monospace';[['FILTERED AIR, 10 MIN','12'],['VANTOR STOUT','9'],['RECLAIMED-WATER GIN','14'],['SYNTH WHISKEY','18'],['NO CREDIT · NO TABS','']].forEach(([a,b],i)=>{g.fillStyle=i===4?'#9b7bff':'#e8e0d0';g.fillText(a,16,66+i*30);g.fillText(b,W-48,66+i*30);});}),{glow:true}),Math.PI/2);box('bar-light',[8,.05,.3],[10,4,36],amber);

    // Admin & Iris shop: counter, display cases, shelves, workstation.
    box('shop-counter',[8,1.1,1.1],[10,.55,47.2],mat('shop-counter','#1f2228',{rough:.35,metal:.7}));box('shop-counter-glow',[8,.05,.05],[10,1.1,46.62],violet);
    for(let i=0;i<3;i++){const z=44.5+i*2.8;box('display-case',[1,2.4,2.2],[16.3,1.2,z],mat('case-glass','#8fd8ff',{rough:.05,metal:.1,alpha:.25}));box('case-light',[.05,2.2,.05],[15.78,1.2,z-1],[cyan,red,cyan][i]);for(let k=0;k<4;k++)box('display-item',[.6,.12,1.2],[16.3,.5+k*.5,z],[pipe,frame][k%2]);}
    box('shop-shelf',[6.4,2.6,.6],[11,1.3,43.55],frame);for(let k=0;k<4;k++)box('shelf-goods',[5.8,.25,.4],[11,.5+k*.6,43.75],[cyan,amber,violet,magenta][k]);
    box('admin-workstation',[2,.9,1],[8,.45,50.8],frame);plane('admin-screen',1.6,.9,[8,1.5,51.3],texMat('admin-screen',texture('admin-screen',256,144,(g,W,H)=>{g.fillStyle='#04060a';g.fillRect(0,0,W,H);g.fillStyle='#38e8ff';g.font='12px monospace';for(let i=0;i<9;i++)g.fillText(['> trace sovereign','> relay: tessaly-07','> badge db sync','> iris.status OK','> mainframe 98%','> firewall ACTIVE','> cams 12/12','> vend restock','> _'][i],8,16+i*14);}),{glow:true}),0);
    plane('shop-holo',1.6,2.4,[10,2.6,52.8],adMat('helix'),0);
    if(state?.story?.flags?.adminOccupied!==true)characterModel('admin',parent,[8,0,48.6],false);characterModel('iris',parent,[12.5,0,48.6],false);

    // Vending alcove: three lit machines.
    for(let i=0;i<3;i++){const z=47.6+i*1.9;box('vending-body',[1,2.2,1.6],[-6.3,1.1,z],mat('vend','#16161d',{rough:.5,metal:.6}));plane('vending-front',.05+1.3,1.7,[-5.78,1.25,z],texMat('vend-'+i,texture('vend-'+i,128,170,(g,W,H)=>{g.fillStyle=['#0b2a33','#2b0b26','#2a220b'][i];g.fillRect(0,0,W,H);for(let y=10;y<H-30;y+=24)for(let x=8;x<W-10;x+=22){g.fillStyle=['#38e8ff','#ff5bd0','#ffb347','#6cff9e'][(x+y)%4];g.fillRect(x,y,14,16);}g.fillStyle='#e8f0ff';g.font='bold 14px sans-serif';g.fillText(['DRINKS','SNACKS','TECH'][i],10,H-10);}),{glow:true}),-Math.PI/2);}
    box('vend-bin',[.5,.8,.5],[-3.6,.4,52],pipe);

    // Sleep pods: two stacked rows with ring-lit hatches and numbers.
    for(let row=0;row<2;row++)for(let i=0;i<5;i++){const z=57+i*2.6,y=.9+row*1.7;box('pod-shell',[2.6,1.5,2.3],[-15.4,y,z],mat('pod','#202028',{rough:.4,metal:.6}));const ring=add(B.MeshBuilder.CreateTorus('pod-ring',{diameter:1.1,thickness:.08,tessellation:20},scene),[magenta,cyan][(i+row)%2],[-14.08,y,z]);ring.rotation.z=Math.PI/2;neon('pod-no-'+row+i,[String(row*5+i+1).padStart(2,'0')],['#e8f0ff'],.4,.25,[-14.06,y+.62,z+.8],-Math.PI/2);}
    box('pod-ladder',[.1,3.2,.6],[-14,1.6,69],pipe);box('pod-terminal',[.4,1.2,.4],[-6,.6,57],frame);box('pod-terminal-screen',[.05,.4,.3],[-5.78,1.1,57],cyan);
    box('pods-light',[.3,.05,13],[-9,4,62.5],glowMat('pod-dim','#5a3c8a',.6));

    // Meeting room: glass wall to the hallway, table, chairs, screen.
    if(!state.story?.flags?.meetingOpen)box('meeting-door',[.25,3.1,4],[3,1.55,62.5],mat('door-inner','#1d2026',{rough:.35,metal:.9}),false).name='meeting-door';
    box('meeting-table',[4,.12,2.4],[9,.8,62.5],mat('bar-top','#2b1d18',{rough:.35,metal:.2}));for(const [dx,dz] of [[-1.4,-1.6],[0,-1.6],[1.4,-1.6],[-1.4,1.6],[0,1.6],[1.4,1.6]])box('meeting-chair',[.6,.9,.6],[9+dx,.45,62.5+dz],frame);
    plane('meeting-screen',3,1.7,[14.8,2.2,62.5],texMat('meeting-screen',texture('meeting-screen',256,144,(g,W,H)=>{g.fillStyle='#05070c';g.fillRect(0,0,W,H);g.strokeStyle='#9b7bff';g.lineWidth=2;g.strokeRect(10,10,W-20,H-20);g.fillStyle='#9b7bff';g.font='bold 16px monospace';g.fillText('TESSALY / SECURE LINK',20,36);g.fillStyle='#38e8ff';g.font='12px monospace';g.fillText('ENCRYPTION: ACTIVE',20,60);g.fillText('PARTICIPANTS: 0',20,80);}),{glow:true}),Math.PI/2);

    // Stairs at the hallway end rise into the ceiling.
    for(let i=0;i<8;i++)box('stair-step',[3,.2,.5],[0,.1+i*.45,74+i*.45],pipe);box('stair-rail',[.08,.08,4.5],[1.6,2.6,75.6],amber);

    // ---- Smoking terrace (open roof) --------------------------------------
    add(B.MeshBuilder.CreateGround('terrace-floor',{width:20,height:20},scene),asphalt,[38,.02,68]);
    for(const [x,z,w,d] of [[38,58,20,.1],[38,78,20,.1],[28,68,.1,20],[48,68,.1,20]]){box('terrace-rail',[w||.1,.08,d||.1],[x,1.05,z],amber);for(let t=0;t<=1;t+=.1)box('rail-post',[.08,1.05,.08],[x+(w>1?(t-.5)*w:0),.52,z+(d>1?(t-.5)*d:0)],frame);}
    box('terrace-hatch',[2.4,2.6,2],[30,1.3,70.5],frame);box('terrace-vent',[2,1.6,2],[45,.8,61],pipe);box('terrace-vent-fan',[1.6,.05,1.6],[45,1.62,61],frame);
    for(const z of [64,72]){box('terrace-bench',[.7,.45,3],[46.6,.22,z],rust);}
    cyl('ash-bin',.3,.9,[44.5,.45,75.5],pipe,true,10);characterModel('crew-smoke1',parent,[44,0,73],true);characterModel('crew-smoke2',parent,[40,0,60.6],true);
    for(let i=0;i<5;i++)box('string-light',[.12,.12,.12],[31+i*3.5,2.6-Math.sin(i/4*Math.PI)*.3,77.6],amber);
    billboard(9,[38,22,92],0);neon('terrace-neon',['新天地','NEW HORIZON'],['#ff5bd0','#7ff0ff'],6,3,[58,14,70],Math.PI/2);

    // Coloured light pools for the interior and street.
    const lights=[];const point=(p,c,i,r)=>{const l=new B.PointLight('ncz-light',v(...p),scene);l.diffuse=B.Color3.FromHexString(c);l.intensity=i;l.range=r;l.parent=parent;lights.push(l);};
    if(!low){point([0,6,-30],'#ff5bd0',.9,30);point([0,6,-10],'#38e8ff',.8,26);point([0,3,23],'#9be8ff',.6,8);point([-10,3,36],'#38e8ff',.9,14);point([10,3,36],'#ffb347',1.4,14);point([13,3,33],'#ff8a5c',.9,10);point([10,3,48],'#c9b4ff',1.5,12);point([14,3,51],'#38e8ff',.8,8);point([-10,3,62],'#ff5bd0',.6,12);point([38,4,68],'#ffb347',.6,14);point([0,3.5,40],'#e8f0ff',.6,16);point([0,3.5,64],'#e8f0ff',.6,16);}

    // Merge static meshes by material to keep draw calls low.
    for(const [m,list] of staticMeshes)if(list.length>1){const merged=B.Mesh.MergeMeshes(list,true,true,undefined,false,false);if(merged){merged.parent=parent;merged.material=m;merged.isPickable=false;}}
    function tick(time){for(const d of drones){d.n.position.set(Math.sin(time*.3+d.phase)*6,9+Math.sin(time*1.3+d.phase)*.4,d.z+Math.cos(time*.21+d.phase)*4);d.n.rotation.y=time*.3+d.phase;}}
    return {tick,dispose(){for(const l of lights)l.dispose();for(const t of textures)t.dispose();for(const m of owned)m.dispose(false,true);scene.clearColor=previous.clear;scene.fogMode=previous.fogMode;scene.fogDensity=previous.fogDensity;scene.fogColor=previous.fogColor;if(sun&&lightState.sun!=null)sun.intensity=lightState.sun;if(ambient&&lightState.ambient!=null)ambient.intensity=lightState.ambient;}};
  }
  const api={layout,build};if(typeof module!=='undefined')module.exports=api;else root.VoidNeoChinatown=api;
})(globalThis);
