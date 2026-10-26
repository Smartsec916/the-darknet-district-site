/* NeoChinatown, Tessaly: the landing street, the alley and The Darknet District.
   layout() is engine-independent gameplay data (walls, interactions, signs).
   build() is presentation only; it never changes collision or progression. */
(function(root){
  const base=typeof document!=='undefined'&&document.currentScript?new URL('.',document.currentScript.src):null;

  // ---- Layout -------------------------------------------------------------
  // David's redesigned map (2026-10-26). World metres: x runs east, z runs north.
  //   Avenue: a wide street across the north edge, open-ended into the wider city.
  //   Main street: runs south from the avenue down to the access road.
  //   Landing pad: in the south-west, joined by a short passage and the access road to the main street.
  //   Alley: turns east off the main street; the District door opens off its south side.
  // The District keeps its own plan (the local metres below, door at local 0,20), turned a half turn so its
  // door faces the alley and the hallway runs south. A half turn is its own inverse: toWorld also maps back.
  const DOOR={x:126.9,z:-61.9};
  const toWorld=(x,z)=>[DOOR.x-x,DOOR.z+20-z];
  const streets={avenue:[2,152,-20,-5],main:[51,71,-124,-20],alley:[71,136,-61.6,-55.5],road:[13,51,-121,-116],passage:[37.5,44,-116,-92],pad:[13,37.5,-106,-86]};
  // Places with their own walls: the District (with its front wall on the alley) and the roof terrace.
  const footprints={district:[109.4,144.4,-120.4,-61.6],terrace:[78.4,99.4,-116.4,-95.4]};
  const inside=([x0,x1,z0,z1],x,z,m=0)=>x>=x0-m&&x<=x1+m&&z>=z0-m&&z<=z1+m;
  // Where a world point is: the streets, the District interior or the terrace (music, comms and tests use this).
  function zone(p){const [lx,lz]=toWorld(p.x,p.z);if(inside(footprints.terrace,p.x,p.z))return {area:'terrace',x:lx,z:lz};if(inside(footprints.district,p.x,p.z,.01)&&lz>=19.8)return {area:'district',x:lx,z:lz};return {area:'street',x:p.x,z:p.z};}

  const solids=[];
  const wall=(id,x1,z1,x2,z2,h=6,t=.4)=>{const w=Math.abs(x2-x1)||t,d=Math.abs(z2-z1)||t;solids.push({id,position:[(x1+x2)/2,h/2,(z1+z2)/2],size:[w,h,d]});};
  // District (local metres). The front wall closes the building either side of the vestibule.
  solids.push({id:'district-door',position:[0,1.6,20],size:[6,3.2,.3]});
  solids.push({id:'district-inner-door',position:[0,1.6,26],size:[6,3.2,.3]});
  wall('district-front-west',-17.5,19.85,-3,19.85,8,.3);wall('district-front-east',3,19.85,17.5,19.85,8,.3);
  wall('vestibule-west',-3,20,-3,26);wall('vestibule-east',3,20,3,26);
  // Hallway walls with openings to each room.
  const left=[[26,31.5],[36.5,46.5],[52.5,59.5],[64.5,78]],right=[[26,30.5],[35.5,44.5],[49.5,60.5],[64.5,78]];
  left.forEach(([a,b],i)=>wall('hall-west-'+i,-3,a,-3,b));right.forEach(([a,b],i)=>wall('hall-east-'+i,3,a,3,b));
  wall('hall-end',-3,78,3,78);
  // VR arcade (west, z 28..44): two glass booths along the back, a viewing strip by the hallway.
  wall('vr-north',-17,28,-3,28);wall('vr-west',-17,28,-17,44);wall('vr-south',-17,44,-3,44);
  wall('vr-booth-glass',-8.5,29,-8.5,43,3,.15);wall('vr-booth-partition',-17,36,-8.5,36,3,.15);
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
  for(const [id,x,z,w,d] of [['bar-counter',10,38.5,9,1.1],['shop-counter',10,47.2,8,1.1],['meeting-table',9,62.5,4,2.4],['pods-row',-15.4,62.5,2.6,13]])solids.push({id,position:[x,.6,z],size:[w,1.2,d]});
  // Smoking terrace, an open roof reached by the stairs at the hallway end.
  wall('terrace-north',28,58,48,58,1.1);wall('terrace-south',28,78,48,78,1.1);wall('terrace-west',28,58,28,78,1.1);wall('terrace-east',48,58,48,78,1.1);

  const interactions=[
    {id:'tdd',label:'ENTER THE DARKNET DISTRICT',position:[0,1.7,19.2],action:'tdd',range:3},
    {id:'district-scan',label:'PRESENT BADGE TO SCANNER',position:[2.2,1.7,24.5],action:'district-scan',range:2.6,when:{flags:{districtDoor:true}}},
    // Admin and Iris are both at the counter, except while the first faction payment waits and Admin is 'occupied' (doc 06).
    {id:'admin',label:'SPEAK WITH ADMIN',position:[8,1.7,46.2],action:'admin',range:3,when:{notFlags:{adminOccupied:true}}},
    {id:'district-iris',label:'SPEAK WITH IRIS',position:[12.5,1.7,46.2],action:'district-iris',range:3},
    {id:'district-shop',label:'BROWSE THE SHOP',position:[14.8,1.7,50.5],action:'district-shop',range:2.8},
    {id:'district-bar',label:'TALK TO THE BARTENDER',position:[10,1.7,37.2],action:'district-bar',range:3},
    {id:'district-vr',label:'VR ARCADE',position:[-6.2,1.7,36],action:'district-vr',range:3},
    {id:'district-vending',label:'VENDING MACHINES',position:[-5,1.7,49.5],action:'district-vending',range:2.6},
    {id:'district-pod',label:'REST IN A SLEEP POD',position:[-12.5,1.7,62.5],action:'district-pod',range:3},
    {id:'district-meeting',label:'MEETING ROOM / PRIVATE',position:[2.4,1.7,62.5],action:'district-meeting',range:2.6},
    {id:'district-stairs',label:'CLIMB TO THE SMOKING AREA',position:[0,1.7,75.5],action:'district-stairs',range:2.6},
    {id:'district-stairs-down',label:'GO BACK DOWNSTAIRS',position:[30,1.7,68],action:'district-stairs-down',range:2.6}
  ];
  // The city blocks between the streets: solid wherever there is no street, District or terrace.
  // A half-metre grid merged into row runs, then runs of equal width stacked into boxes.
  function blocks(){
    const S=.5,X0=0,X1=154,Z0=-126,Z1=-3,open=[...Object.values(streets),...Object.values(footprints)],runs=new Map(),out=[];
    for(let z=Z0;z<Z1;z+=S){let start=null;for(let x=X0;x<=X1;x+=S){const solid=x<X1&&!open.some(r=>inside(r,x+S/2,z+S/2));if(solid&&start===null)start=x;if(!solid&&start!==null){const key=start+':'+x,prev=runs.get(key);if(prev&&prev.z1===z)prev.z1=z+S;else{const r={x0:start,x1:x,z0:z,z1:z+S};runs.set(key,r);out.push(r);}start=null;}}}
    return out.map((r,i)=>({id:'city-block-'+i,position:[(r.x0+r.x1)/2,15,(r.z0+r.z1)/2],size:[r.x1-r.x0,30,r.z1-r.z0]}));
  }
  const cityBlocks=blocks();
  const signs=[];
  function layout(){
    const placed=solids.map(s=>{const [x,z]=toWorld(s.position[0],s.position[2]);return {...s,position:[x,s.position[1],z],size:s.size.slice()};});
    const items=interactions.map(i=>{const [x,z]=toWorld(i.position[0],i.position[2]);return {...i,position:[x,i.position[1],z]};});
    return {id:'neochinatown',name:'NEOCHINATOWN / TESSALY',kind:'city',district:true,bounds:[156,128],spawn:[31,1.7,-96],yaw:2.44,color:'#3a2f4a',music:'earth',ship:'starter',
    solids:[...placed,...cityBlocks.map(s=>({...s,position:s.position.slice(),size:s.size.slice()})),{id:'ship',position:[22,2,-96],size:[3.6,4,10.5]}],
    interactions:[{id:'board',label:'BOARD YOUR SHIP',position:[27,1.7,-98],action:'board',range:3.5},{id:'terminal',label:'LANDING TERMINAL',position:[34.5,1.7,-103],action:'terminal',range:3},...items],signs:[]};}

  // ---- Presentation -------------------------------------------------------
  const ads=()=>(root.VoidAds?.brands||[]).map(b=>b.id);
  function build({scene,parent,quality,characterModel,shipModel,state,instance:modelInstance}){
    const B=root.BABYLON,low=quality==='low',owned=[],districtRoot=new root.BABYLON.TransformNode('district-root',scene);let target=parent,disposed=false;districtRoot.parent=parent;districtRoot.position.set(DOOR.x,0,DOOR.z+20);districtRoot.rotation.y=Math.PI;const textures=[],staticMeshes=new Map(),dynamic=[],v=(x,y,z)=>new B.Vector3(x,y,z);
    let seed=4127;const rand=()=>((seed=seed*16807%2147483647)-1)/2147483646;
    const previous={clear:scene.clearColor.clone(),fogMode:scene.fogMode,fogDensity:scene.fogDensity,fogColor:scene.fogColor.clone()};
    scene.clearColor=new B.Color4(.035,.03,.07,1);scene.fogMode=B.Scene.FOGMODE_EXP2;scene.fogDensity=.0085;scene.fogColor=new B.Color3(.10,.07,.16);
    const sun=scene.getLightByName('sun'),ambient=scene.getLightByName('ambient');const lightState={sun:sun?.intensity,ambient:ambient?.intensity};
    if(sun)sun.intensity=.25;if(ambient){ambient.intensity=.8;}
    const mats={};
    function mat(key,hex,{rough=.8,metal=.2,glow=null,alpha=1}={}){if(mats[key])return mats[key];const m=new B.PBRMaterial('ncz-'+key,scene);m.albedoColor=B.Color3.FromHexString(hex);m.roughness=rough;m.metallic=metal;if(glow)m.emissiveColor=B.Color3.FromHexString(glow);if(alpha<1){m.alpha=alpha;m.transparencyMode=2;}owned.push(m);mats[key]=m;return m;}
    function glowMat(key,hex,intensity=1){if(mats[key])return mats[key];const m=new B.StandardMaterial('ncz-'+key,scene);m.diffuseColor=B.Color3.Black();m.emissiveColor=B.Color3.FromHexString(hex).scale(intensity);m.disableLighting=true;owned.push(m);mats[key]=m;return m;}
    function add(mesh,m,p,merge=true){mesh.material=m;mesh.position.set(...p);mesh.parent=target;mesh.isPickable=false;mesh.receiveShadows=false;if(merge){if(!staticMeshes.has(m))staticMeshes.set(m,[]);staticMeshes.get(m).push(mesh);}else dynamic.push(mesh);return mesh;}
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

    // Clear glass: barely tinted, no environment glare, so what is behind it stays readable.
    function glass(key,hex,alpha){if(mats[key])return mats[key];const m=new B.StandardMaterial('ncz-'+key,scene);m.diffuseColor=B.Color3.FromHexString(hex);m.emissiveColor=B.Color3.FromHexString(hex).scale(.08);m.specularColor=new B.Color3(.25,.25,.3);m.alpha=alpha;m.backFaceCulling=false;owned.push(m);mats[key]=m;return m;}
    // Imported models (models below); null when one isn't loaded, so callers keep their built version.
    const instance=(key,p,yaw=0)=>{const n=modelInstance?.('district:'+key,target);if(!n)return null;n.position.set(...p);n.rotation.y=yaw;return n;};

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

    // ---- Streets, landing pad and skyline (world metres, David's map 2026-10-26) ----
    const S=streets,overlaps=(x0,x1,z0,z1,m=.4)=>[...Object.values(S),...Object.values(footprints)].some(([a,b,c,d])=>x0<b+m&&x1>a-m&&z0<d+m&&z1>c-m);
    // Ground surfaces keep a 10 m texture repeat whatever their size.
    function ground(name,[x0,x1,z0,z1],m,y=0,repeat=10){const g=add(B.MeshBuilder.CreateGround(name,{width:x1-x0,height:z1-z0},scene),m,[(x0+x1)/2,y,(z0+z1)/2]);g.setVerticesData(B.VertexBuffer.UVKind,g.getVerticesData(B.VertexBuffer.UVKind).map((u,i)=>u*(i%2?(z1-z0):(x1-x0))/repeat));return g;}
    asphaltTex.uScale=asphaltTex.vScale=1;asphaltTex.wrapU=asphaltTex.wrapV=B.Texture.WRAP_ADDRESSMODE;
    // Upgraded surfaces (ambientCG, CC0; docs/VOID_RUNNER_ASSET_LICENSES.md): roads, paving, alley brick, night facades.
    const acg=name=>{const url=(base?new URL('assets/textures/ncz/'+name+'.jpg',base).href:'assets/textures/ncz/'+name+'.jpg'),t=new B.Texture(url,scene,false,true);t.wrapU=t.wrapV=B.Texture.WRAP_ADDRESSMODE;textures.push(t);return t;};
    asphalt.albedoTexture=acg('road-color');asphalt.bumpTexture=acg('road-normal');asphalt.roughness=.35;asphalt.metallic=.2; // a little wet
    const paving=mat('paving','#5a6680',{rough:.75,metal:.05});paving.albedoTexture=acg('sidewalk-color');paving.bumpTexture=acg('sidewalk-normal');
    // Sidewalk slabs: the paving repeats every 2 m on top and runs round the kerb.
    const slab=([w,h,d],p)=>{const top=new B.Vector4(0,0,w/2,d/2),kerb=new B.Vector4(0,0,Math.max(w,d)/2,.1);return add(B.MeshBuilder.CreateBox('sidewalk',{width:w,height:h,depth:d,faceUV:[kerb,kerb,kerb,kerb,top,top],wrap:true},scene),paving,p);};
    // Night facades: the face by day, darkened, with its own lit windows. tile = metres one copy covers (wide, high).
    const windowMats=[['office',[28,34]],['apartment',[40,52]],['glass',[30,36]]].map(([n,tile])=>{const m=new B.StandardMaterial('ncz-facade-'+n,scene);m.diffuseTexture=acg('facade-'+n+'-color');m.emissiveTexture=acg('facade-'+n+'-glow');m.diffuseColor=new B.Color3(.3,.3,.36);m.specularColor=new B.Color3(.08,.08,.1);m.metadata={tile};owned.push(m);return m;});
    function tower(x,z,w,d,h,k){const m=windowMats[k%3],[tw,th]=m.metadata.tile,side=a=>new B.Vector4(0,0,a/tw,h/th),cap=new B.Vector4(0,0,.01,.01);const b=add(B.MeshBuilder.CreateBox('tower',{width:w,height:h,depth:d,faceUV:[side(w),side(w),side(d),side(d),cap,cap],wrap:true},scene),m,[x,h/2,z]);const roofY=h+.5;box('tower-crown',[w*.6,1.2,d*.6],[x,roofY,z],frame);if(rand()<.7){cyl('tower-mast',.15,6+rand()*8,[x,roofY+4,z],pipe);add(B.MeshBuilder.CreateSphere('tower-beacon',{diameter:.7,segments:6},scene),red,[x,roofY+9,z]);}if(rand()<.6)box('tower-neon-strip',[.25,h*.7,.25],[x+(w/2+.13)*(x<0?1:-1),h*.45,z-d/2+.6],[cyan,magenta,violet][k%3]);return b;}
    for(const [name,r] of Object.entries(S))if(name!=='alley')ground('ncz-'+name,r,asphalt,0,4);
    // Street edges, outward normal pointing into the buildings, with gaps where another street joins.
    const edges=[
     {street:'avenue',a:[2,-5],b:[152,-5],n:[0,1],gaps:[]},{street:'avenue',a:[2,-20],b:[152,-20],n:[0,-1],gaps:[[51,71]]},
     {street:'main',a:[51,-124],b:[51,-20],n:[-1,0],gaps:[[-121,-116]]},{street:'main',a:[71,-124],b:[71,-20],n:[1,0],gaps:[[-61.6,-55.5]]},
     {street:'road',a:[13,-116],b:[51,-116],n:[0,1],gaps:[[37.5,44]]},{street:'road',a:[13,-121],b:[51,-121],n:[0,-1],gaps:[]},
     {street:'passage',a:[37.5,-116],b:[37.5,-106],n:[-1,0],gaps:[]},{street:'passage',a:[44,-116],b:[44,-92],n:[1,0],gaps:[]},
     {street:'pad',a:[13,-106],b:[13,-86],n:[-1,0],gaps:[]},{street:'pad',a:[13,-86],b:[37.5,-86],n:[0,1],gaps:[]},{street:'pad',a:[37.5,-92],b:[37.5,-86],n:[1,0],gaps:[]},{street:'pad',a:[13,-106],b:[37.5,-106],n:[0,-1],gaps:[]}];
    // A plane faces -z; turn it to face back into the street (away from its wall).
    const faceInto=n=>n[1]>0?0:n[1]<0?Math.PI:n[0]>0?Math.PI/2:-Math.PI/2;
    const along=(e,t)=>[e.a[0]+(e.b[0]-e.a[0])*t,e.a[1]+(e.b[1]-e.a[1])*t];
    const inGap=(e,p)=>e.gaps.some(([g0,g1])=>{const c=e.n[0]?p[1]:p[0];return c>g0-1.5&&c<g1+1.5;});
    const shopSigns=[[['夜市','NIGHT MARKET'],['#ff5bd0','#7ff0ff']],[['龍麵館','DRAGON NOODLES'],['#ffcf5a','#ff5b5b']],[['電子','ELECTRONICS'],['#7ff0ff','#9b7bff']],[['藥房','PHARMACY 24H'],['#6cff9e','#e8f0ff']],[['茶','TEA HOUSE'],['#ffb347','#ffe9c4']],[['TACOS · 24H'],['#ffb347','#ff5b5b']],[['RAMEN · BAR'],['#ff5bd0','#ffe9c4']],[['REPAIR · 修理'],['#7ff0ff','#ffcf5a']],[['LAUNDRY'],['#e8f0ff','#9b7bff']],[['BIO-CLINIC'],['#6cff9e','#e8f0ff']],[['CHAI · 茶'],['#ffb347','#ff8ad8']],[['NOODLES'],['#ffcf5a','#7ff0ff']]];
    let signIndex=0;
    for(const e of edges){
     const len=Math.hypot(e.b[0]-e.a[0],e.b[1]-e.a[1]),wide=e.street==='avenue'||e.street==='main',sw=wide?3:e.street==='road'?1.5:0,ry=faceInto(e.n);
     // Sidewalk strip, storefronts, awnings and signs on the wide streets; facades on the rest.
     for(let s=0;s<len;s+=7){const t0=s/len,t1=Math.min(1,(s+7)/len),p=along(e,(t0+t1)/2),seg=(t1-t0)*len;if(inGap(e,p))continue;
      const into=[-e.n[0],-e.n[1]],wall=[p[0]+e.n[0]*.05,p[1]+e.n[1]*.05];
      if(sw){const c=[p[0]+into[0]*sw/2,p[1]+into[1]*sw/2];slab(e.n[0]?[sw,.18,seg]:[seg,.18,sw],[c[0],.09,c[1]]);}
      if(e.street==='pad')continue;
      const glow=[glowMat('shop-cyan','#38e8ff',.32),glowMat('shop-magenta','#ff3fb4',.32),glowMat('shop-amber','#ffb347',.3),glowMat('shop-violet','#9b5cff',.32)][Math.floor(rand()*4)];
      box('storefront',e.n[0]?[.1,3,seg-1.5]:[seg-1.5,3,.1],[wall[0],1.6,wall[1]],glow);
      box('awning',e.n[0]?[1.2,.12,seg-1.2]:[seg-1.2,.12,1.2],[p[0]+into[0]*.6,3.4,p[1]+into[1]*.6],frame);
      if(wide&&rand()<.55){const [lines,colors]=shopSigns[signIndex++%shopSigns.length];neon('shop-sign-'+signIndex,lines,colors,2.4,4.4,[p[0]+into[0]*.25,5.2,p[1]+into[1]*.25],ry);}
      if(wide&&rand()<.35)billboard(5.5+rand()*2,[p[0]+into[0]*.3,12+rand()*18,p[1]+into[1]*.3],ry);
      if(wide&&rand()<.4){const k=[p[0]+into[0]*(sw-.4),p[1]+into[1]*(sw-.4)];box('kiosk-frame',e.n[0]?[.3,2.9,1.9]:[1.9,2.9,.3],[k[0],1.45,k[1]],frame);plane('kiosk-ad',1.6,2.4,[k[0]+into[0]*.17,1.55,k[1]+into[1]*.17],adMat(nextAd()),ry);}}
     // Towers behind the edge (outside every street, the District and the terrace).
     for(let s=0;s<len;){const d=6+rand()*9,w=10+rand()*8,t=(s+d/2)/len;if(t>1)break;const p=along(e,t),c=[p[0]+e.n[0]*(w/2+.3),p[1]+e.n[1]*(w/2+.3)],sx=e.n[0]?w:d,sz=e.n[0]?d:w;
      if(!overlaps(c[0]-sx/2,c[0]+sx/2,c[1]-sz/2,c[1]+sz/2,.2))tower(c[0],c[1],sx,sz,e.street==='avenue'||e.street==='main'?36+rand()*110:18+rand()*34,signIndex+s|0);s+=d+.6;}
    }
    for(const [x0,x1,z] of [[2,152,-12.5]])for(let x=x0+4;x<x1-2;x+=6)box('lane-mark',[2.6,.02,.18],[x,.02,z],glowMat('lane','#d7c06a',.55));
    for(let z=-120;z<-22;z+=6)box('lane-mark',[.18,.02,2.6],[61,.02,z],glowMat('lane','#d7c06a',.55));
    // The avenue runs on into the wider city: closed barriers and the lit towers beyond.
    for(const x of [2.4,151.6]){box('road-barrier',[.4,1.1,14],[x,.55,-12.5],mat('barrier','#c9b14a',{rough:.6,metal:.2}));for(let z=-18;z<=-7;z+=2.2)box('barrier-light',[.45,.18,.4],[x,1.2,z],red);neon('road-closed-'+x,['封路 · ROAD CLOSED'],['#ffcf5a'],4,.7,[x+(x<50?.25:-.25),2,-12.5],x<50?Math.PI/2:-Math.PI/2,'rgba(10,8,4,.9)');}
    // Landing pad: the Kestrel, pad lights, a low wall and the landing terminal.
    box('landing-pad',[18,.12,16],[24,.06,-96],mat('pad','#26262c',{rough:.6,metal:.4}));
    for(const [x,z] of [[15.4,-103.6],[32.6,-103.6],[15.4,-88.4],[32.6,-88.4]])cyl('pad-light',.2,.14,[x,.14,z],amber,true,8);
    for(let i=0;i<4;i++)box('pad-stripe',[18,.02,.25],[24,.13,-104+i*5.3],glowMat('pad-stripe','#f2b33d',.35));
    const ship=shipModel('starter','friendly',parent,{landed:true});ship.position.set(22,1.9,-96);ship.scaling.setAll(2.2);ship.rotation.y=Math.PI;
    box('terminal-base',[.9,1.3,.6],[35.6,.65,-103],frame);plane('terminal-screen',.8,.55,[35.28,1.45,-103],texMat('landing-terminal',texture('landing-terminal',256,176,(g,W,H)=>{g.fillStyle='#04080e';g.fillRect(0,0,W,H);g.fillStyle='#7ff0ff';g.font='bold 22px monospace';g.fillText('LANDING',20,40);g.fillText('TERMINAL',20,66);g.fillStyle='#ffb347';g.font='15px monospace';g.fillText('PAD 07 · KESTREL',20,104);g.fillText('PARKING: THE FUNCTION',20,128);g.fillText('[E] CONNECT',20,156);}),{glow:true}),-Math.PI/2);
    for(let i=0;i<14;i++){const r=Object.values(S)[i%5],x=r[0]+rand()*(r[1]-r[0]),z=r[2]+rand()*(r[3]-r[2]);const p=add(B.MeshBuilder.CreateDisc('puddle',{radius:.8+rand()*1.4,tessellation:18},scene),mat('puddle','#0c0c14',{rough:.04,metal:.9}),[x,.025,z]);p.rotation.x=Math.PI/2;p.scaling.y=.55;}
    // The Function's banner over the avenue where the main street meets it.
    neon('function-banner',['THE FUNCTION WATCHES OVER YOU','功能 · 秩序 · 利潤'],['#e8f0ff','#ff4a4a'],16,2.6,[61,16,-4.6],0);
    if(!low)for(let i=0;i<46;i++){const a=i/46*Math.PI*2,r=120+rand()*90,x=77+Math.sin(a)*r,z=-62+Math.cos(a)*r;tower(x,z,12+rand()*14,12+rand()*14,60+rand()*170,i);}
    // IronEye drones patrol above the main street and the avenue.
    const drones=[];const droneBody=mat('ironeye','#1d1f24',{rough:.4,metal:.8});for(let i=0;i<(low?2:4);i++){const n=new B.TransformNode('ironeye-'+i,scene);n.parent=parent;const body=add(B.MeshBuilder.CreateSphere('ironeye-body',{diameter:.9,segments:10},scene),droneBody,[0,0,0],false);body.parent=n;body.scaling.y=.6;const eye=add(B.MeshBuilder.CreateDisc('ironeye-eye',{radius:.16,tessellation:12},scene),red,[0,0,-.46],false);eye.parent=n;for(const s of [-1,1]){const rot=box('ironeye-rotor',[.9,.04,.12],[s*.55,.25,0],frame,false);rot.parent=n;}drones.push({n,phase:i*1.7,x:i<3?61:100,z:i<3?-100+i*30:-12.5});}
    // Street pedestrians on the sidewalks.
    for(const [x,z,i] of [[52.6,-40,1],[69.4,-78,2],[52.6,-100,3],[34,-6.6,4],[98,-18.4,5]])characterModel('crew-ncz'+i,parent,[x,0,z],true);
    // Two street lights (the District's own lights are added with its rooms).
    const streetLights=[];if(!low)for(const [p,c,i,r] of [[[61,7,-40],'#ff5bd0',.9,34],[[61,7,-12],'#38e8ff',.8,30]]){const l=new B.PointLight('ncz-street-light',v(...p),scene);l.diffuse=B.Color3.FromHexString(c);l.intensity=i;l.range=r;l.parent=parent;streetLights.push(l);owned.push(l);}

    // ---- Alley: old dark brick, counterculture graffiti, pipes and vents ----
    // Old, dirty red brick (ambientCG Bricks097, CC0), darkened toward charcoal by its material.
    const brickTex=acg('brick-color'),brickNormal=acg('brick-normal');
    for(const tex of [brickTex,brickNormal])tex.wrapU=tex.wrapV=B.Texture.WRAP_ADDRESSMODE; // repeat along and up the walls
    const brick=new B.StandardMaterial('ncz-alley-brick',scene);brick.diffuseTexture=brickTex;brick.bumpTexture=brickNormal;brick.diffuseColor=new B.Color3(.34,.29,.29);brick.specularColor=new B.Color3(.12,.1,.1);brick.specularPower=24;brick.emissiveColor=new B.Color3(.17,.12,.12);owned.push(brick);
    // A brick wall box whose texture repeats every 2 m along and 1.6 m up (one copy of the photo).
    function brickWall(name,x0,z0,x1,z1,h,y0=0,t=.4){const len=Math.hypot(x1-x0,z1-z0),u=len/2,vv=h/1.6,ut=t/2,uv=[new B.Vector4(0,0,u,vv),new B.Vector4(0,0,u,vv),new B.Vector4(0,0,ut,vv),new B.Vector4(0,0,ut,vv),new B.Vector4(0,0,u,ut),new B.Vector4(0,0,u,ut)];
     const m=B.MeshBuilder.CreateBox(name,{width:x0===x1?t:len,height:h,depth:x0===x1?len:t,faceUV:x0===x1?[uv[2],uv[3],uv[0],uv[1],uv[4],uv[5]]:uv,wrap:true},scene);return add(m,brick,[(x0+x1)/2,y0+h/2,(z0+z1)/2]);}
    const A=S.alley;
    {const alleyRoad=mat('alley-asphalt','#b4b4bc',{rough:.22,metal:.35});alleyRoad.albedoTexture=acg('road-cracked-color');alleyRoad.bumpTexture=acg('road-cracked-normal');ground('alley-floor',A,alleyRoad,.012,4);}
    // North side: a row of old brick buildings; south side: brick up to the District's front.
    for(let x=A[0];x<A[1];){const w=10+rand()*12,x1=Math.min(A[1],x+w),h=11+rand()*9;brickWall('alley-building',x,A[3]+.2,x1,A[3]+.2,h);brickWall('alley-building-side',x,A[3]+.2,x,A[3]+8,h);box('alley-roof',[x1-x,.4,8],[(x+x1)/2,h,A[3]+4.2],concrete);x=x1;}
    const doorX=[DOOR.x-3,DOOR.x+3];
    brickWall('alley-south',A[0],A[2]-.2,footprints.district[0],A[2]-.2,13);
    brickWall('district-facade',footprints.district[0],A[2]-.2,doorX[0],A[2]-.2,13);brickWall('district-facade',doorX[1],A[2]-.2,footprints.district[1],A[2]-.2,13);brickWall('district-facade-over-door',doorX[0],A[2]-.2,doorX[1],A[2]-.2,9.4,3.6);
    brickWall('alley-end',A[1]+.2,A[2],A[1]+.2,A[3],14);
    box('district-roofline',[footprints.district[1]-footprints.district[0],.5,58.8],[(footprints.district[0]+footprints.district[1])/2,13,-91],concrete);
    // Pipes, vents, junction boxes, cables, a camera over the door, bins, crates, dim lamps.
    for(let x=A[0]+5;x<A[1]-3;x+=7+rand()*5){cyl('alley-pipe',.11,12,[x,6,A[3]-.15],pipe,true,8);if(rand()<.5)box('alley-ac',[1.1,.9,.6],[x+1.6,3+rand()*5,A[3]-.35],pipe);if(rand()<.4)box('junction-box',[.6,.8,.25],[x-1.4,1.8,A[3]-.18],mat('junction','#3d4741',{rough:.6,metal:.6}));}
    for(let x=A[0]+8;x<footprints.district[0]-2;x+=9+rand()*6){cyl('alley-pipe',.13,12,[x,6,A[2]+.1],rust,true,8);if(rand()<.5)box('alley-vent',[.9,.5,.4],[x+1.2,2.6,A[2]+.2],pipe);}
    for(const z of [A[3]-.3,A[2]+.25])for(let i=0;i<3;i++){const c=cyl('alley-cable',.025,A[1]-A[0],[(A[0]+A[1])/2,5+i*.45,z],frame,true,6);c.rotation.z=Math.PI/2;}
    box('dumpster',[2.6,1.3,1.6],[86,.65,-57],mat('dumpster','#2d4a3a',{rough:.7,metal:.4}));box('dumpster-lid',[2.7,.1,1.7],[86,1.35,-57],frame);
    box('alley-crates',[1,1,1],[97,.5,-60.7],rust);box('alley-crates',[.8,.8,.8],[97.1,1.4,-60.7],rust);box('alley-crates',[1,1,1],[133,.5,-56.4],rust);
    const poolTex=texture('alley-lamp-pool',256,256,(g,W,H)=>{g.fillStyle='#000';g.fillRect(0,0,W,H);const r=g.createRadialGradient(W/2,H/2,4,W/2,H/2,W/2);r.addColorStop(0,'rgba(255,170,90,1)');r.addColorStop(.5,'rgba(255,140,70,.35)');r.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=r;g.fillRect(0,0,W,H);}),pool=new B.StandardMaterial('ncz-lamp-pool',scene);pool.diffuseColor=B.Color3.Black();pool.specularColor=B.Color3.Black();pool.emissiveTexture=poolTex;pool.disableLighting=true;pool.alphaMode=B.Engine.ALPHA_ADD;pool.alpha=.55;owned.push(pool);
    for(const x of [80,100,118,133]){box('alley-lamp',[.5,.12,.3],[x,5.2,A[3]-.4],amber);box('alley-lamp-arm',[.06,.06,.5],[x,5.3,A[3]-.2],frame);const f=add(B.MeshBuilder.CreateGround('alley-lamp-pool',{width:6,height:6},scene),pool,[x,.03,A[3]-2.6],false);const w=add(B.MeshBuilder.CreatePlane('alley-lamp-wash',{width:6,height:5},scene),pool,[x,3.4,A[3]-.06],false);}
    for(let x=A[0]+6;x<A[1];x+=11)box('drain-grate',[.9,.02,.5],[x,.03,(A[2]+A[3])/2],mat('drain','#0d0e10',{rough:.5,metal:.8}));
    box('camera-arm',[.06,.06,.6],[DOOR.x-3.3,3.9,A[2]+.1],frame);box('camera-body',[.25,.2,.45],[DOOR.x-3.3,3.8,A[2]+.42],frame);box('camera-led',[.05,.05,.02],[DOOR.x-3.3,3.8,A[2]+.66],red);
    neon('alley-sign',['小心','WATCH YOUR STEP'],['#ff5bd0','#7ff0ff'],1.4,2.2,[A[0]+3,4.2,A[3]-.25],0);
    // Graffiti: painted onto transparent decals a few centimetres off the walls, so each reads the right way round.
    const graffitiSets=[
     ['QUESTION THE SYSTEM','spray','#e8e2d0','#d6342c'],['WHO WATCHES THE WATCHERS?','stencil','#f2f0e8'],['YOUR DATA IS NOT YOURS','hand','#7ff0ff'],
     ['OBEY / CONSUME / REPEAT','stencil','#ff5bd0'],['FREEDOM IS NOT A SUBSCRIPTION','spray','#ffcf5a','#1b1b1b'],['THE SYSTEM IS WATCHING','hand','#e8e2d0'],
     ['DISCONNECT TO EXIST','spray','#6cff9e','#101814'],['NO GODS. NO ALGORITHMS.','stencil','#e8e2d0'],['YOU ARE NOT A PRODUCT','hand','#ff8a5c'],
     ['THINK FOR YOURSELF','spray','#9b7bff','#120c1c'],['CONSENT IS NOT OPTIONAL','hand','#f2f0e8'],['PRIVACY IS RESISTANCE','stencil','#7ff0ff']];
    function graffiti(text,style,color,outline){const words=text.split(' '),lines=style==='stencil'||text.length<16?[text]:[words.slice(0,Math.ceil(words.length/2)).join(' '),words.slice(Math.ceil(words.length/2)).join(' ')];
     return texture('graffiti-'+text,1024,lines.length>1?512:256,(g,W,H)=>{g.clearRect(0,0,W,H);
      // A ghost of older paint underneath.
      g.globalAlpha=.16;g.fillStyle=['#7ff0ff','#ff5bd0','#e8e2d0'][Math.floor(rand()*3)];g.font='italic bold 150px "Segoe Print",cursive';g.save();g.translate(W*.55,H*.62);g.rotate(-.12);g.fillText(['KR0W','ZER0','N1GHT','D.X.'][Math.floor(rand()*4)],-170,0);g.restore();g.globalAlpha=1;
      const size=Math.min(H/lines.length*.72,W/(Math.max(...lines.map(l=>l.length))*.56));
      lines.forEach((line,i)=>{const y=(i+.5)*H/lines.length;g.save();g.translate(W/2,y);g.rotate((rand()-.5)*.07);g.textAlign='center';g.textBaseline='middle';
       if(style==='stencil'){g.font='bold '+size+'px "Courier New",monospace';g.fillStyle=color;g.fillText(line,0,0);g.globalCompositeOperation='destination-out';for(let k=-3;k<=3;k++)g.fillRect(-W/2,k*size*.32-1,W,size*.06);g.globalCompositeOperation='source-over';}
       else if(style==='hand'){g.font='italic bold '+size+'px "Segoe Print","Comic Sans MS",cursive';g.lineWidth=size*.06;g.strokeStyle=color;g.strokeText(line,0,0);g.globalAlpha=.85;g.fillStyle=color;g.fillText(line,2,1);g.globalAlpha=1;}
       else{g.font='bold '+size+'px Impact,"Arial Black",sans-serif';g.lineJoin='round';g.lineWidth=size*.16;g.strokeStyle=outline||'#111';g.strokeText(line,0,0);g.fillStyle=color;g.fillText(line,0,0);g.lineWidth=size*.03;g.strokeStyle='rgba(255,255,255,.55)';g.strokeText(line,-2,-3);}
       g.restore();
       // Drips under the letters.
       g.fillStyle=color;for(let k=0;k<(style==='stencil'?3:9);k++){const x=W*.12+rand()*W*.76,l=10+rand()*55;g.globalAlpha=.75;g.fillRect(x,y+size*.32,3+rand()*3,l);g.beginPath();g.arc(x+2.5,y+size*.32+l,3.5,0,Math.PI*2);g.fill();g.globalAlpha=1;}});
      // Overspray speckle.
      for(let k=0;k<500;k++){g.fillStyle=color;g.globalAlpha=rand()*.35;g.fillRect(rand()*W,rand()*H,1.5,1.5);}g.globalAlpha=1;});}
    function decal(t,w,h,p,ry){const m=new B.StandardMaterial('ncz-graffiti',scene);m.diffuseTexture=t;m.diffuseTexture.hasAlpha=true;m.useAlphaFromDiffuseTexture=true;m.emissiveColor=new B.Color3(.32,.3,.3);m.specularColor=new B.Color3(.05,.05,.05);owned.push(m);
     const d=B.MeshBuilder.CreatePlane('graffiti',{width:w,height:h},scene);add(d,m,p,false);d.rotation.y=ry;return d;}
    // North wall faces south (into the alley): plane front -z means rotation 0. South wall faces north: rotation pi.
    const spots=[[78,2.4,'n',7],[90,4.6,'n',9],[104,1.9,'n',6],[116,3.4,'n',8],[128,5.4,'n',6],[82,2.2,'s',7.5],[95,3.8,'s',8],[106,1.8,'s',5],[113,5.6,'s',6],[134.5,2.4,'n',4],[121,6.6,'s',4.5],[73.5,6,'n',3.6]];
    spots.forEach(([x,y,side,w],i)=>{const [text,style,c,o]=graffitiSets[i%graffitiSets.length],lines=style==='stencil'||text.length<16?1:2,h=w*(lines>1?.5:.25);
     decal(graffiti(text,style,c,o),w,h,[x,y,side==='n'?A[3]-.04:A[2]+.04],side==='n'?0:Math.PI);});
    // Torn posters, half covered.
    for(const [x,side] of [[87,'n'],[101,'s'],[124,'n']]){const t=texture('poster-'+x,256,360,(g,W,H)=>{g.fillStyle='#d8d0bc';g.fillRect(0,0,W,H);g.fillStyle='#1b1b1b';g.font='bold 34px Impact,sans-serif';g.textAlign='center';g.fillText('PRIVACY IS',W/2,90);g.fillText('RESISTANCE',W/2,130);g.font='22px monospace';g.fillText('— THE NETWORK —',W/2,320);g.globalCompositeOperation='destination-out';g.beginPath();g.moveTo(W,H*.55);for(let k=0;k<12;k++)g.lineTo(W-k*20,H*.55+(rand()-.5)*30+k*12);g.lineTo(W,H);g.fill();g.globalCompositeOperation='source-over';});
     decal(t,1,1.4,[x,1.7,side==='n'?A[3]-.05:A[2]+.05],side==='n'?0:Math.PI);}
    target=districtRoot;
    // Understated entrance: reinforced door, small mark, camera.
    box('district-door-frame',[6.4,3.6,.5],[0,1.8,20.15],frame);
    if(!state.story?.flags?.districtDoor){const door=box('district-door',[5.6,3.1,.28],[0,1.55,20],mat('door-steel','#2b2e33',{rough:.4,metal:.85}),false);door.name='district-door';}
    neon('district-mark',['DD'],['#9b7bff'],.7,.4,[2.6,2.9,19.7],0);

    // ---- Vestibule --------------------------------------------------------
    add(B.MeshBuilder.CreateGround('vestibule-floor',{width:6,height:6},scene),floor,[0,.02,23]);
    for(const side of [-1,1])box('vestibule-wall',[.3,3.6,6],[side*3.1,1.8,23],metal);box('vestibule-ceiling',[6.4,.3,6],[0,3.6,23],frame);
    box('scanner-post',[.35,1.3,.35],[2.6,.65,24.5],frame);box('scanner-face',[.3,.4,.05],[2.6,1.25,24.31],cyan);
    for(const z of [21.5,24.5])box('status-display',[.05,.6,1],[-2.92,2.2,z],[cyan,magenta][z>23?1:0]);
    box('vestibule-light',[4,.05,.3],[0,3.42,23],white);
    if(!state.story?.flags?.districtBadge){const inner=box('district-inner-door',[5.6,3.1,.28],[0,1.55,26],mat('door-inner','#1d2026',{rough:.35,metal:.9}),false);inner.name='district-inner-door';box('inner-door-light',[5.6,.06,.06],[0,3.15,25.84],red,false).name='district-inner-door-light';}

    // ---- Hallway and room shells -----------------------------------------
    // Dark wet-look tiles (David's reference pictures, 2026-10-17): low roughness so the neon reads in them.
    const tileTex=texture('district-tiles',512,512,(g,W,H)=>{g.fillStyle='#0d0e14';g.fillRect(0,0,W,H);for(let y=0;y<H;y+=64)for(let x=0;x<W;x+=64){const s=15+rand()*9|0;g.fillStyle='rgb('+s+','+s+','+(s+7)+')';g.fillRect(x+2,y+2,60,60);}g.strokeStyle='#050608';g.lineWidth=3;for(let i=0;i<=W;i+=64){g.beginPath();g.moveTo(i,0);g.lineTo(i,H);g.stroke();g.beginPath();g.moveTo(0,i);g.lineTo(W,i);g.stroke();}for(let i=0;i<10;i++){const x=rand()*W,y=rand()*H,r=30+rand()*60,gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(0,0,0,.4)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);}});tileTex.uScale=6;tileTex.vScale=9;
    const tiles=mat('wet-tiles','#ffffff',{rough:.16,metal:.5});tiles.albedoTexture=tileTex;
    add(B.MeshBuilder.CreateGround('district-floor',{width:34,height:52},scene),tiles,[0,.02,52]);
    box('district-ceiling',[34,.3,52],[0,4.2,52],frame);
    // Walls only: furniture collision blocks (counters, the pod row) are drawn by their rooms, not as walls.
    for(const s of solids){if(!/^(hall|vr|vend|pods|bar|shop|meet)-/.test(s.id)||/-(counter|row|table)$/.test(s.id)||/glass|partition/.test(s.id))continue;/* glass booths are drawn by the VR arcade */box('district-wall',[Math.max(.3,s.size[0]),4.2,Math.max(.3,s.size[2])],[s.position[0],2.1,s.position[2]],metal);}
    for(let z=28;z<78;z+=4){box('hall-beam',[6,.3,.3],[0,3.9,z],frame);box('hall-led',[.08,.05,3.6],[-2.6,3.85,z+2],z%8?cyan:magenta);box('hall-led',[.08,.05,3.6],[2.6,3.85,z+2],z%8?magenta:cyan);}
    for(const [z,side] of [[30.5,1],[46,-1],[58,1],[66,-1]])plane('hall-ad',1.2,1.8,[side*2.82,2.2,z],adMat(nextAd()),side>0?Math.PI/2:-Math.PI/2);
    for(const z of [40,72])box('hall-camera',[.2,.2,.4],[2.7,3.6,z],frame);
    const roomSign=(lines,colors,p,ry)=>neon('room-sign-'+lines[0],lines,colors,2.4,.7,p,ry,'rgba(10,10,16,.9)');
    roomSign(['VR / ARCADE'],['#38e8ff'],[-2.8,3.4,34],-Math.PI/2);roomSign(['BAR · LOUNGE'],['#ffb347'],[2.8,3.4,33],Math.PI/2);
    roomSign(['ADMIN & IRIS'],['#9b7bff'],[2.8,3.4,47],Math.PI/2);roomSign(['VENDING'],['#6cff9e'],[-2.8,3.4,49.5],-Math.PI/2);
    roomSign(['SLEEP PODS'],['#ff5bd0'],[-2.8,3.4,62],-Math.PI/2);roomSign(['MEETING ROOM'],['#e8f0ff'],[2.8,3.4,62.5],Math.PI/2);
    roomSign(['SMOKING AREA ↑'],['#ffb347'],[0,3.5,77.7],0);
    neon('welcome',['THE DARKNET DISTRICT'],['#9b7bff'],5,.8,[0,3.3,26.6],0);

    // VR arcade (David, 2026-10-26): two standing VR booths behind glass, divided by a glass partition, with a
    // viewing strip by the hallway. One player is in a VR shooter, the other dances, dines and works menus.
    const boothGlass=glass('vr-glass','#bfe6ff',.13),boothFrame=mat('vr-frame','#1b1e24',{rough:.35,metal:.8});
    const booths=[{z0:29,z1:36,color:cyan,label:['NEON STRIKE','VR SHOOTER · SESSION LIVE'],tint:'#38e8ff'},{z0:36,z1:43,color:magenta,label:['SKYLINE SOCIAL','DANCE · DINE · PLAY'],tint:'#ff3fb4'}];
    for(const b of booths){const zc=(b.z0+b.z1)/2,len=b.z1-b.z0;
     // Floor: a dark pad with a lit play boundary.
     box('vr-pad',[7.4,.03,len-.6],[-12.7,.035,zc],mat('vr-pad','#101219',{rough:.5,metal:.4}));
     for(const [w,d,x,z] of [[7,.06,-12.7,b.z0+.5],[7,.06,-12.7,b.z1-.5],[.06,len-1,-16.2,zc],[.06,len-1,-9.2,zc]])box('vr-boundary',[w,.02,d],[x,.05,z],b.color);
     // Tracking rig overhead: a frame with sensor pods at the corners.
     for(const z of [b.z0+.4,b.z1-.4])box('vr-rig-beam',[7.6,.12,.12],[-12.7,3.6,z],boothFrame);for(const x of [-16.4,-9])box('vr-rig-beam',[.12,.12,len-.8],[x,3.6,zc],boothFrame);
     for(const [x,z] of [[-16.3,b.z0+.5],[-9.1,b.z0+.5],[-16.3,b.z1-.5],[-9.1,b.z1-.5]]){box('vr-sensor',[.18,.12,.18],[x,3.45,z],frame);box('vr-sensor-led',[.06,.03,.02],[x,3.42,z+(z<zc?.1:-.1)],b.color);}
     // Glass front with slim posts and a lit sill; a small session sign above the glass, out of the way.
     box('vr-glass-front',[.06,2.9,len-.12],[-8.5,1.45,zc],boothGlass,false);
     for(const z of [b.z0,b.z1])box('vr-post',[.12,3,.12],[-8.5,1.5,z],boothFrame);
     box('vr-sill',[.16,.06,len],[-8.5,.03,zc],b.color);box('vr-header',[.16,.12,len],[-8.5,2.95,zc],boothFrame);
     neon('vr-session-'+b.z0,b.label,[b.tint,'#e8f0ff'],2.2,.55,[-8.42,3.25,zc],-Math.PI/2,'rgba(6,8,14,.92)');}
    // The partition between the booths.
    box('vr-glass-partition',[7.9,2.9,.06],[-12.55,1.45,36],boothGlass,false);box('vr-partition-top',[7.9,.1,.12],[-12.55,2.95,36],boothFrame);
    // Viewing strip: a rail and a bench along the hallway side, a soft floor line.
    box('vr-rail',[.06,.06,13.6],[-7.6,1,36],pipe);for(const z of [30,34,38,42])box('vr-rail-post',[.06,1,.06],[-7.6,.5,z],pipe);
    box('vr-floor-line',[.05,.02,13.6],[-7.9,.04,36],violet);
    if(!instance('couch',[-4.6,0,41.5],-Math.PI/2))box('vr-bench',[1,.45,3],[-4.6,.22,41.5],mat('chair','#2a2340',{rough:.7}));
    characterModel('crew-vr-watch',target,[-5.4,0,33],true);

    // The two players. Each keeps to the middle of its booth and runs its own routine of whole moves (a start, a
    // middle and an end), with uneven pauses, so they never look like synchronised machines.
    const vrPlayers=[];
    function vrPlayer(look,x,z,routine){
     const place=()=>{const node=root.VoidAssets?.instance?.('crowd:'+look,target);if(!node)return false;node.position.set(x,0,z);node.rotation.y=Math.PI/2; // faces the glass and the viewers
      const c=root.VoidCrowd?.animate(node,look,'idle');if(c)vrPlayers.push({node,c,routine,step:0,timer:.5+rand()*2,base:Math.PI/2,turn:0,want:0});return true;};
     if(!place())root.VoidAssets?.onLoaded?.(id=>{if(id==='crowd:'+look&&!disposed)place();});}
    // Shooter: lift into aim, track, fire, take a hit, duck, come back up, aim low, fire, lower and breathe.
    const shooter=[['vr-aim',1.2,0],['vr-shoot',0,.15,'vr-aim'],['vr-aim',.8,-.35],['vr-shoot',0,-.35,'vr-aim'],['vr-aim-up',1.4,.25],['vr-shoot',0,.25,'vr-aim-up'],['vr-hit',0,0,'vr-aim'],['vr-duck',1.6,0],['vr-aim-down',1.3,-.2],['vr-shoot',0,-.2,'vr-aim-down'],['vr-aim',1,.4],['vr-shoot',0,.4,'vr-aim'],['idle',2.4,0]];
    // Second player: a dance, then a virtual meal, then working menus and talking to someone only they can see.
    const social=[['dance',9,0],['idle',1.6,0],['pickup',0,0,'idle'],['interact',0,0,'idle'],['idle',1.2,0],['pickup',0,.2,'idle'],['interact',0,.2,'idle'],['idle',1.8,0],['menu',2.6,-.2],['menu-tap',0,-.2,'menu'],['menu',1.4,.25],['menu-tap',0,.25,'menu'],['talk',3.4,0],['idle',2.2,0]];
    vrPlayer('vr-player-a',-12.6,32.4,shooter);vrPlayer('vr-player-b',-12.6,39.6,social);
    function vrTick(dt){for(const p of vrPlayers){if(p.node.isDisposed())continue;p.timer-=dt;
      // Small turns of the whole body toward where the virtual action is; the arms and legs come from the clips.
      p.turn+=(p.want-p.turn)*Math.min(1,dt*2.5);p.node.rotation.y=p.base+p.turn;
      if(p.timer>0||p.c.busy)continue;const [clip,hold,turn,after]=p.routine[p.step++%p.routine.length];p.want=turn;
      if(after){const len=p.c.playOnce(clip,after);p.timer=Math.max(.3,len)+(rand()*.3);}else{p.c.play(clip);p.timer=hold*(.8+rand()*.45);}}}

    // Bar and lounge: counter, bottles, booths, bartender, patrons.
    box('bar-counter',[9,1.1,1.1],[10,.55,38.5],mat('bar-top','#2b1d18',{rough:.35,metal:.2}));box('bar-counter-glow',[9,.05,.05],[10,1.1,37.92],amber);
    box('bar-back-shelf',[10,.08,.5],[10,1.6,41.6],frame);box('bar-back-shelf',[10,.08,.5],[10,2.3,41.6],frame);
    for(let i=0;i<22;i++){const x=5.5+i*.42;cyl('bottle',.07,.32,[x,1.82+(i%2)*.7,41.6],[amber,cyan,magenta,violet][i%4],true,6);}
    for(const x of [6.5,9,11.5,14])cyl('bar-stool',.25,.8,[x,.4,37.2],frame,true,10);
    for(const z of [29.5,32.5]){box('booth-seat',[3.5,.5,1],[14.5,.25,z],mat('booth','#4a1d2e',{rough:.8}));box('booth-table',[2.6,.08,1],[14.5,.8,z+1],frame);}
    characterModel('nyx-district',target,[10,0,40],false);characterModel('crew-bar1',target,[7,0,36.6],true);characterModel('crew-bar2',target,[14.5,0,30],true);
    plane('bar-menu',2.2,1.2,[16.8,2.4,35],texMat('bar-menu',texture('bar-menu',384,210,(g,W,H)=>{g.fillStyle='#0d0a08';g.fillRect(0,0,W,H);g.fillStyle='#ffb347';g.font='bold 22px monospace';g.fillText('BAR · LOUNGE',16,32);g.font='15px monospace';[['FILTERED AIR, 10 MIN','12'],['VANTOR STOUT','9'],['RECLAIMED-WATER GIN','14'],['SYNTH WHISKEY','18'],['NO CREDIT · NO TABS','']].forEach(([a,b],i)=>{g.fillStyle=i===4?'#9b7bff':'#e8e0d0';g.fillText(a,16,66+i*30);g.fillText(b,W-48,66+i*30);});}),{glow:true}),Math.PI/2);box('bar-light',[8,.05,.3],[10,4,36],amber);

    // Admin & Iris shop: counter, display cases, shelves, workstation.
    box('shop-counter',[8,1.1,1.1],[10,.55,47.2],mat('shop-counter','#1f2228',{rough:.35,metal:.7}));box('shop-counter-glow',[8,.05,.05],[10,1.1,46.62],violet);
    for(let i=0;i<3;i++){const z=44.5+i*2.8;box('display-case',[1,2.4,2.2],[16.3,1.2,z],mat('case-glass','#8fd8ff',{rough:.05,metal:.1,alpha:.25}));box('case-light',[.05,2.2,.05],[15.78,1.2,z-1],[cyan,red,cyan][i]);for(let k=0;k<4;k++)box('display-item',[.6,.12,1.2],[16.3,.5+k*.5,z],[pipe,frame][k%2]);}
    box('shop-shelf',[6.4,2.6,.6],[11,1.3,43.55],frame);for(let k=0;k<4;k++)box('shelf-goods',[5.8,.25,.4],[11,.5+k*.6,43.75],[cyan,amber,violet,magenta][k]);
    box('admin-workstation',[2,.9,1],[8,.45,50.8],frame);plane('admin-screen',1.6,.9,[8,1.5,51.3],texMat('admin-screen',texture('admin-screen',256,144,(g,W,H)=>{g.fillStyle='#04060a';g.fillRect(0,0,W,H);g.fillStyle='#38e8ff';g.font='12px monospace';for(let i=0;i<9;i++)g.fillText(['> trace sovereign','> relay: tessaly-07','> badge db sync','> iris.status OK','> mainframe 98%','> firewall ACTIVE','> cams 12/12','> vend restock','> _'][i],8,16+i*14);}),{glow:true}),0);
    plane('shop-holo',1.6,2.4,[10,2.6,52.8],adMat('helix'),0);
    if(state?.story?.flags?.adminOccupied!==true)characterModel('admin',target,[8,0,48.6],false);characterModel('iris',target,[12.5,0,48.6],false);

    // Vending alcove: three lit machines.
    // Machines (reference: glass fronts over lit shelves of goods, a payment panel at the side, a bright top light).
    const vendGlass=glass('vend-glass','#cfe8ff',.08),vendBody=mat('vend','#16161d',{rough:.5,metal:.6}),itemColors=['#38e8ff','#ff5bd0','#ffb347','#6cff9e','#e8f0ff'];
    for(let i=0;i<3;i++){const z=47.6+i*1.9,x=-6.3;
     // A hollow cabinet: back, top, base and sides, open at the front behind the glass.
     box('vending-back',[.5,2.2,1.6],[x-.25,1.1,z],vendBody);box('vending-top',[.5,.26,1.6],[x+.25,2.07,z],vendBody);box('vending-base',[.5,.34,1.6],[x+.25,.17,z],vendBody);box('vending-side',[.5,2.2,.07],[x+.25,1.1,z-.765],vendBody);box('vending-side',[.5,2.2,.36],[x+.25,1.1,z+.62],vendBody);box('vending-back-glow',[.04,1.6,1.1],[x+.12,1.15,z-.12],glowMat('vend-back-'+i,['#12384a','#3a1236','#3a2e10'][i],1));
     for(let s=0;s<4;s++){const sy=.5+s*.42;box('vending-shelf',[.62,.03,1.1],[x+.2,sy,z-.12],frame);for(let k=0;k<5;k++){const h=.16+((i*7+s*3+k)%3)*.05,c=(i+s*2+k)%5;box('vending-item',[.22,h,.16],[x+.3,sy+h/2+.02,z-.55+k*.21],glowMat('vend-item-'+c,itemColors[c],.5));}}
     box('vending-led',[.05,.05,1.1],[x+.48,1.97,z-.12],glowMat('vend-led','#f4f8ff',1.5));box('vending-glass',[.02,1.68,1.14],[x+.51,1.18,z-.12],vendGlass,false);
     box('vending-panel',[.06,1.5,.32],[x+.5,1.1,z+.6],frame);box('vending-pay',[.02,.26,.2],[x+.535,1.38,z+.6],glowMat('vend-pay','#6cff9e',.9));box('vending-card',[.02,.1,.18],[x+.535,1.08,z+.6],amber);
     neon('vend-label-'+i,[['DRINKS','SNACKS','TECH'][i]],[['#38e8ff','#ff5bd0','#ffb347'][i]],1.1,.22,[x+.52,2.08,z-.12],-Math.PI/2,'rgba(8,8,12,.92)');}
    box('vend-bin',[.5,.8,.5],[-3.6,.4,52],pipe);

    // Sleep pods: two stacked rows with ring-lit hatches and numbers.
    // Capsules (reference: rounded pods with glowing oval hatches, glass, a warm-lit bed inside).
    const podShell=mat('pod-shell','#56637e',{rough:.3,metal:.55}),podGlass=glass('pod-glass','#a8dcff',.1),podInner=glowMat('pod-inner','#ffc98a',.45),mattress=mat('pod-mattress','#e6dfd2',{rough:.9,metal:0}),podBlanket=mat('pod-blanket','#5a3a5e',{rough:.95,metal:0});
    // The pod's front: one solid panel with an oval window cut out (in the y–z plane, facing the room).
    function ovalPanel(p,width,height,rz,ry){const pos=[],idx=[],n=40;for(let k=0;k<=n;k++){const a=k/n*Math.PI*2,c=Math.cos(a),s=Math.sin(a),reach=Math.min(width/2/Math.max(Math.abs(c),1e-6),height/2/Math.max(Math.abs(s),1e-6));pos.push(0,s*ry,c*rz,0,s*reach,c*reach);if(k<n){const q=k*2;idx.push(q,q+1,q+2,q+1,q+3,q+2,q,q+2,q+1,q+1,q+2,q+3);}}
     const mesh=new B.Mesh('pod-front',scene),vd=new B.VertexData();vd.positions=pos;vd.indices=idx;// Faces the room (+x) on both windings, so it lights like the rest of the shell.
     vd.normals=pos.map((_,k)=>k%3===0?1:0);const uvs=[];for(let k=0;k<pos.length;k+=3)uvs.push(pos[k+2]/width+.5,pos[k+1]/height+.5);vd.uvs=uvs;vd.applyToMesh(mesh);return add(mesh,podShell,p);}
    for(let row=0;row<2;row++)for(let i=0;i<5;i++){const z=57+i*2.6,y=.9+row*1.7,hatch=[amber,magenta][(i+row)%2];
     // A hollow capsule: back, top, floor, sides and a fascia framing the hatch, so the bed shows through the glass.
     box('pod-back',[.12,1.5,2.3],[-16.64,y,z],podShell);for(const s of [-1,1]){box('pod-roof',[2.6,.1,2.3],[-15.4,y+s*.7,z],podShell);box('pod-side',[2.6,1.5,.1],[-15.4,y,z+s*1.1],podShell);}
     ovalPanel([-14.15,y,z],2.3,1.5,.95,.575);for(const s of [-1,1])box('pod-trim',[2.6,.08,.08],[-15.4,y+s*.72,z+1.11],frame);
     box('pod-inner-light',[.03,.9,1.7],[-16.56,y+.05,z],podInner);box('pod-ceiling-light',[2,.03,1.2],[-15.4,y+.63,z],podInner);
     const ring=add(B.MeshBuilder.CreateTorus('pod-ring',{diameter:1,thickness:.07,tessellation:32},scene),hatch,[-14.04,y,z]);ring.rotation.z=Math.PI/2;ring.scaling.set(1.15,1,1.9);
     const glass=add(B.MeshBuilder.CreateDisc('pod-glass',{radius:.5,tessellation:32,sideOrientation:B.Mesh.DOUBLESIDE},scene),podGlass,[-14.06,y,z],false);glass.rotation.y=Math.PI/2;glass.scaling.set(1.85,1.1,1);
     box('pod-mattress',[2.38,.24,2.08],[-15.39,y-.53,z],mattress);box('pod-pillow',[.45,.14,1.5],[-16.25,y-.34,z],mattress);box('pod-blanket',[1.1,.05,2.06],[-14.95,y-.39,z],podBlanket);
     neon('pod-no-'+row+i,[String(row*5+i+1).padStart(2,'0')],['#e8f0ff'],.4,.25,[-14.06,y+.62,z+.8],-Math.PI/2);}
    box('pod-ladder',[.1,3.2,.6],[-14,1.6,69],pipe);box('pod-terminal',[.4,1.2,.4],[-6,.6,57],frame);box('pod-terminal-screen',[.05,.4,.3],[-5.78,1.1,57],cyan);
    for(let z=56.8;z<69;z+=2.4)box('pods-ceiling-panel',[1,.04,1],[-9,4.03,z],glowMat('pod-panel','#7fe6ff',.9));

    // Meeting room: glass wall to the hallway, table, chairs, screen.
    if(!state.story?.flags?.meetingOpen)box('meeting-door',[.25,3.1,4],[3,1.55,62.5],mat('door-inner','#1d2026',{rough:.35,metal:.9}),false).name='meeting-door';
    box('meeting-table',[4,.12,2.4],[9,.8,62.5],mat('bar-top','#2b1d18',{rough:.35,metal:.2}));for(const [dx,dz] of [[-1.4,-1.6],[0,-1.6],[1.4,-1.6],[-1.4,1.6],[0,1.6],[1.4,1.6]])box('meeting-chair',[.6,.9,.6],[9+dx,.45,62.5+dz],frame);
    // Holo map wall (reference: a pink-framed map of routes and contacts). Abstract star systems, not real places.
    const mapTex=texture('meeting-map',768,384,(g,W,H)=>{g.fillStyle='#040a12';g.fillRect(0,0,W,H);g.strokeStyle='rgba(56,232,255,.14)';g.lineWidth=1;for(let x=0;x<W;x+=32){g.beginPath();g.moveTo(x,0);g.lineTo(x,H);g.stroke();}for(let y=0;y<H;y+=32){g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke();}const pts=[];for(let i=0;i<70;i++)pts.push([40+rand()*(W-80),44+rand()*(H-90)]);g.strokeStyle='rgba(56,232,255,.35)';for(let i=1;i<pts.length;i+=2){g.beginPath();g.moveTo(pts[i-1][0],pts[i-1][1]);g.lineTo(pts[i][0],pts[i][1]);g.stroke();}for(const [x,y] of pts){g.fillStyle='#38e8ff';g.fillRect(x-2,y-2,4,4);}g.strokeStyle='#ff3fb4';g.lineWidth=2;for(let i=0;i<6;i++){const [x,y]=pts[i*9];g.beginPath();g.arc(x,y,11,0,Math.PI*2);g.stroke();}g.fillStyle='#ff3fb4';g.font='bold 22px monospace';g.fillText('TESSALY / SECURE LINK',18,30);g.fillStyle='#38e8ff';g.font='14px monospace';g.fillText('ENCRYPTION: ACTIVE',18,H-14);});
    plane('meeting-screen',5,2.5,[14.8,2.3,62.5],texMat('meeting-map',mapTex,{glow:true}),Math.PI/2);
    for(const [size,p] of [[[.06,.1,5.3],[14.76,3.6,62.5]],[[.06,.1,5.3],[14.76,1,62.5]],[[.06,2.7,.1],[14.76,2.3,59.85]],[[.06,2.7,.1],[14.76,2.3,65.15]]])box('meeting-map-frame',size,p,magenta);
    const rackTex=texture('server-rack',128,256,(g,W,H)=>{g.fillStyle='#0a0c10';g.fillRect(0,0,W,H);for(let y=8;y<H-8;y+=14){g.fillStyle='#15181e';g.fillRect(6,y,W-12,11);for(let k=0;k<6;k++){g.fillStyle=['#38e8ff','#6cff9e','#ff3b3b','#ffb347'][(y+k*5)%4];if(rand()<.6)g.fillRect(12+k*8,y+4,3,3);}g.fillStyle='#2a2f38';g.fillRect(W-40,y+3,28,5);}}),rackFront=texMat('server-rack',rackTex,{glow:true});
    for(const x of [5,6,12,13]){box('server-rack',[.9,2.4,.8],[x,1.2,56.6],frame);plane('server-rack-front',.84,2.3,[x,1.2,57.01],rackFront,Math.PI,true);box('server-rack',[.9,2.4,.8],[x,1.2,68.4],frame);plane('server-rack-front',.84,2.3,[x,1.2,67.99],rackFront,0,true);}

    // ---- Upgrades from David's District reference pictures (2026-10-17) ----
    // VR / arcade: red and cyan ceiling tubes, headsets on the players, a row of glowing monitors.
    for(const x of [-14,-10,-6])box('vr-neon',[.06,.06,14],[x,4.02,36],red);for(const z of [30,36,42])box('vr-neon',[12,.06,.06],[-10,4.02,z],cyan);
    // Hallway: pipes and a duct overhead, cables at the walls, the neon reflected in the wet floor, bins.
    for(const [x,r,y,m] of [[-1.9,.15,3.72,pipe],[-1.5,.08,3.82,rust],[1.75,.2,3.68,pipe],[2.2,.07,3.85,pipe]]){const c=cyl('hall-pipe',r,50,[x,y,53],m);c.rotation.x=Math.PI/2;}
    box('hall-duct',[.9,.34,50],[0,3.86,53],metal);for(const x of [-2.82,2.82]){const c=cyl('hall-cable',.03,50,[x,.05,53],frame,true,6);c.rotation.x=Math.PI/2;}
    const streak=c=>{const m=glowMat('reflection-'+c,c,.4);m.alpha=.3;return m;};
    for(let z=28;z<78;z+=4)for(const [x,c] of [[-2.25,z%8?'#38e8ff':'#ff3fb4'],[2.25,z%8?'#ff3fb4':'#38e8ff']])box('neon-reflection',[.32,.004,3.2],[x,.034,z+2],streak(c));
    for(const [x,z] of [[2.55,44.2],[-2.55,53.5]])instance('bin',[x,0,z],x>0?-Math.PI/2:Math.PI/2);
    // Stairs at the hallway end rise into the ceiling.
    for(let i=0;i<8;i++)box('stair-step',[3,.2,.5],[0,.1+i*.45,74+i*.45],pipe);box('stair-rail',[.08,.08,4.5],[1.6,2.6,75.6],amber);

    // ---- Smoking terrace (open roof) --------------------------------------
    add(B.MeshBuilder.CreateGround('terrace-floor',{width:20,height:20},scene),asphalt,[38,.02,68]);
    for(const [x,z,w,d] of [[38,58,20,.1],[38,78,20,.1],[28,68,.1,20],[48,68,.1,20]]){box('terrace-rail',[w||.1,.08,d||.1],[x,1.05,z],amber);for(let t=0;t<=1;t+=.1)box('rail-post',[.08,1.05,.08],[x+(w>1?(t-.5)*w:0),.52,z+(d>1?(t-.5)*d:0)],frame);}
    box('terrace-hatch',[2.4,2.6,2],[30,1.3,70.5],frame);box('terrace-vent',[2,1.6,2],[45,.8,61],pipe);box('terrace-vent-fan',[1.6,.05,1.6],[45,1.62,61],frame);
    for(const z of [64,72]){box('terrace-bench',[.7,.45,3],[46.6,.22,z],rust);}
    cyl('ash-bin',.3,.9,[44.5,.45,75.5],pipe,true,10);characterModel('crew-smoke1',target,[44,0,73],true);characterModel('crew-smoke2',target,[40,0,60.6],true);
    for(let i=0;i<5;i++)box('string-light',[.12,.12,.12],[31+i*3.5,2.6-Math.sin(i/4*Math.PI)*.3,77.6],amber);
    billboard(9,[38,22,92],0);neon('terrace-neon',['新天地','NEW HORIZON'],['#ff5bd0','#7ff0ff'],6,3,[58,14,70],Math.PI/2);

    // Coloured light pools for the interior and street.
    const lights=[];const point=(p,c,i,r)=>{const l=new B.PointLight('ncz-light',v(...p),scene);l.diffuse=B.Color3.FromHexString(c);l.intensity=i;l.range=r;l.parent=target;lights.push(l);};
    if(!low){point([0,3,23],'#9be8ff',.6,8);point([-10,3,36],'#38e8ff',.9,14);point([10,3,36],'#ffb347',1.4,14);point([13,3,33],'#ff8a5c',.9,10);point([10,3,48],'#c9b4ff',1.5,12);point([14,3,51],'#38e8ff',.8,8);point([-10,3,62],'#ff5bd0',.6,12);point([38,4,68],'#ffb347',.6,14);point([0,3.5,40],'#e8f0ff',.6,16);point([0,3.5,64],'#e8f0ff',.6,16);}

    // Merge static meshes by material to keep draw calls low.
    for(const [m,list] of staticMeshes)if(list.length>1){const merged=B.Mesh.MergeMeshes(list,true,true,undefined,false,false);if(merged){merged.parent=parent;merged.material=m;merged.isPickable=false;}}
    let lastTick=null;
    function tick(time){const dt=lastTick===null?0:Math.min(.1,Math.max(0,time-lastTick));lastTick=time;vrTick(dt);for(const d of drones){d.n.position.set(d.x+Math.sin(time*.3+d.phase)*6,9+Math.sin(time*1.3+d.phase)*.4,d.z+Math.cos(time*.21+d.phase)*4);d.n.rotation.y=time*.3+d.phase;}}
    return {tick,dispose(){disposed=true;districtRoot.dispose();for(const l of lights)l.dispose();for(const t of textures)t.dispose();for(const m of owned)m.dispose(false,true);scene.clearColor=previous.clear;scene.fogMode=previous.fogMode;scene.fogDensity=previous.fogDensity;scene.fogColor=previous.fogColor;if(sun&&lightState.sun!=null)sun.intensity=lightState.sun;if(ambient&&lightState.ambient!=null)ambient.intensity=lightState.ambient;}};
  }
  // Licensed models (docs/VOID_RUNNER_ASSET_LICENSES.md) dressing the District; loaded before build().
  const models={'crowd:vr-player-a':{src:'assets/models/crowd/vr-player-a.glb',background:true},'crowd:vr-player-b':{src:'assets/models/crowd/vr-player-b.glb',background:true},'district:couch':{src:'assets/models/district/couch.glb',scale:.5},'district:bin':{src:'assets/models/district/bin.glb',scale:.6},'district:chair':{src:'assets/models/district/chair.glb',scale:1}};
  const api={layout,build,models,toWorld,zone,streets,footprints,door:DOOR};if(typeof module!=='undefined')module.exports=api;else root.VoidNeoChinatown=api;
})(globalThis);
