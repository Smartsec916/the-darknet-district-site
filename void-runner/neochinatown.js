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
  const streets={avenue:[2,152,-20,-5],main:[51,71,-124,-20],alley:[71,136,-61.6,-55.5],road:[13,51,-121,-116],passage:[37.5,44,-116,-92],pad:[13,37.5,-106,-86],
    // City expansion (David's brief, 2026-10-27): walkable streets out to three future districts. The neighbourhood above is
    // unchanged; only the avenue's closed ends and the main street's south end now open onto these.
    avenueWest:[-60,2,-20,-5],corporate:[-120,-60,-40,15],avenueEast:[152,200,-20,-5],milked:[200,240,-30,5],mainSouth:[56,66,-190,-124],containers:[30,100,-250,-190]};
  // Future districts: placeholders until David supplies their designs. Each streams its own detail as you approach.
  const districts=[
    {id:'corporate',name:'Corporate District',lines:['CORPORATE DISTRICT','PLACEHOLDER'],rect:streets.corporate,center:[-90,-12.5],taxi:[-90,-12.5],heading:Math.PI/2,placeholder:true},
    {id:'milked',name:'Milked',lines:['MILKED','FUTURE LOCATION'],rect:streets.milked,center:[220,-12.5],taxi:[220,-12.5],heading:-Math.PI/2,placeholder:true},
    {id:'containers',name:'Container Settlement',lines:['CONTAINER SETTLEMENT','PLACEHOLDER'],rect:streets.containers,center:[65,-220],taxi:[65,-215],heading:0,placeholder:true}];
  // Taxi landing zones: open street wide enough for the cab, clear of doors, the ship and the sidewalk crowd.
  const taxiZones=[{id:'main',name:'Main Street',position:[61,-100],heading:0},{id:'avenue',name:'The avenue',position:[40,-12.5],heading:Math.PI/2},{id:'alley-mouth',name:'Main Street by the alley',position:[61,-66],heading:0},{id:'passage',name:'The passage by the landing pad',position:[40.75,-101],heading:0},
    ...districts.map(d=>({id:d.id,name:d.name,position:d.taxi,heading:d.heading,district:d.id}))];
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
  solids.push({id:'arcade-terminal',position:[-6.85,.8,36],size:[.7,1.6,1.1]}); // the VR terminal kiosk
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
    {id:'district-vr',label:'ACCESS VR EXPERIENCES',position:[-6.2,1.7,36],action:'district-vr',range:3},
    {id:'district-vending',label:'VENDING MACHINES',position:[-5,1.7,49.5],action:'district-vending',range:2.6},
    {id:'district-pod',label:'REST IN A SLEEP POD',position:[-12.5,1.7,62.5],action:'district-pod',range:3},
    {id:'district-meeting',label:'MEETING ROOM / PRIVATE',position:[2.4,1.7,62.5],action:'district-meeting',range:2.6},
    {id:'district-stairs',label:'CLIMB TO THE SMOKING AREA',position:[0,1.7,75.5],action:'district-stairs',range:2.6},
    {id:'district-stairs-down',label:'GO BACK DOWNSTAIRS',position:[30,1.7,68],action:'district-stairs-down',range:2.6}
  ];
  // The city blocks between the streets: solid wherever there is no street, District or terrace.
  // A half-metre grid merged into row runs, then runs of equal width stacked into boxes.
  // The walled area: the old neighbourhood plus the expansion (x west..east, z south..north).
  const cityBox=[-140,250,-262,20];
  function blocks(){
    const S=.5,[X0,X1,Z0,Z1]=cityBox,open=[...Object.values(streets),...Object.values(footprints)],runs=new Map(),out=[];
    // Row by row: the open cells are those whose centres fall inside a street or footprint, so each row's solid runs are the
    // gaps between the open intervals, snapped to the half-metre grid (the same boxes a cell-by-cell scan gives, much faster).
    const cells=(X1-X0)/S;
    for(let z=Z0;z<Z1;z+=S){const cz=z+S/2,spans=open.filter(r=>cz>=r[2]&&cz<=r[3]).map(r=>[Math.max(0,Math.ceil((r[0]-X0-S/2)/S)),Math.min(cells,Math.floor((r[1]-X0-S/2)/S)+1)]).filter(([i,j])=>j>i).sort((p,q)=>p[0]-q[0]);
     let i=0;const solid=[];for(const [a,b] of spans){if(a>i)solid.push([i,a]);i=Math.max(i,b);}if(i<cells)solid.push([i,cells]);
     for(const [a,b] of solid){const x0=X0+a*S,x1=X0+b*S,key=x0+':'+x1,prev=runs.get(key);if(prev&&prev.z1===z)prev.z1=z+S;else{const r={x0,x1,z0:z,z1:z+S};runs.set(key,r);out.push(r);}}}
    return out.map((r,i)=>({id:'city-block-'+i,position:[(r.x0+r.x1)/2,15,(r.z0+r.z1)/2],size:[r.x1-r.x0,30,r.z1-r.z0]}));
  }
  const cityBlocks=blocks();
  const signs=[];
  function layout(){
    const placed=solids.map(s=>{const [x,z]=toWorld(s.position[0],s.position[2]);return {...s,position:[x,s.position[1],z],size:s.size.slice()};});
    const items=interactions.map(i=>{const [x,z]=toWorld(i.position[0],i.position[2]);return {...i,position:[x,i.position[1],z]};});
    return {id:'neochinatown',name:'NEOCHINATOWN / TESSALY',kind:'city',district:true,bounds:[260,270],spawn:[31,1.7,-96],yaw:2.44,color:'#3a2f4a',music:'earth',ship:'starter',
    solids:[...placed,...cityBlocks.map(s=>({...s,position:s.position.slice(),size:s.size.slice()})),{id:'ship',position:[22,2,-96],size:[3.6,4,10.5]}],
    interactions:[{id:'board',label:'BOARD YOUR SHIP',position:[27,1.7,-98],action:'board',range:3.5},{id:'terminal',label:'LANDING TERMINAL',position:[34.5,1.7,-103],action:'terminal',range:3},...items],signs:[]};}

  // ---- Presentation -------------------------------------------------------
  const ads=()=>(root.VoidAds?.brands||[]).map(b=>b.id);
  function build({scene,parent,quality,characterModel,shipModel,state,instance:modelInstance}){
    const B=root.BABYLON,low=quality==='low',owned=[],districtRoot=new root.BABYLON.TransformNode('district-root',scene);let target=parent,disposed=false;districtRoot.parent=parent;districtRoot.position.set(DOOR.x,0,DOOR.z+20);districtRoot.rotation.y=Math.PI;const textures=[],staticMeshes=new Map(),dynamic=[],v=(x,y,z)=>new B.Vector3(x,y,z);
    let seed=4127;const rand=()=>((seed=seed*16807%2147483647)-1)/2147483646;
    // Night in a megacity (David's references, 2026-10-27): a teal-black sky, blue-green haze that swallows the distant
    // towers, and little ambient light outdoors, so neon, windows and lamps do the lighting. NeoChinatown only: everything
    // is put back on leaving, and the exposure is re-applied each frame in case a quality change resets it.
    const ip=scene.imageProcessingConfiguration,previous={clear:scene.clearColor.clone(),fogMode:scene.fogMode,fogDensity:scene.fogDensity,fogColor:scene.fogColor.clone(),exposure:ip.exposure,contrast:ip.contrast,env:scene.environmentIntensity};
    scene.clearColor=new B.Color4(.02,.05,.06,1);scene.fogMode=B.Scene.FOGMODE_EXP2;scene.fogDensity=.0028;scene.fogColor=new B.Color3(.075,.155,.17);
    const look={exposure:1.3,contrast:1.18},applyLook=()=>{if(ip.exposure!==look.exposure)ip.exposure=look.exposure;if(ip.contrast!==look.contrast)ip.contrast=look.contrast;};applyLook();scene.environmentIntensity=Math.min(previous.env??1,.3);
    const sun=scene.getLightByName('sun'),ambient=scene.getLightByName('ambient');const lightState={sun:sun?.intensity,ambient:ambient?.intensity,diffuse:ambient?.diffuse?.clone(),ground:ambient?.groundColor?.clone()};
    // Outdoors: a dim teal sky light. Inside the District the original warm level returns (see tick).
    const outdoor={intensity:low?.6:.5,diffuse:new B.Color3(.42,.62,.72),ground:new B.Color3(.12,.07,.16)},indoor={intensity:.8,diffuse:lightState.diffuse,ground:lightState.ground};
    if(sun)sun.intensity=.04;if(ambient){ambient.intensity=outdoor.intensity;ambient.diffuse=outdoor.diffuse;if(ambient.groundColor)ambient.groundColor=outdoor.ground;}
    const mats={};
    function mat(key,hex,{rough=.8,metal=.2,glow=null,alpha=1}={}){if(mats[key])return mats[key];const m=new B.PBRMaterial('ncz-'+key,scene);m.albedoColor=B.Color3.FromHexString(hex);m.roughness=rough;m.metallic=metal;if(glow)m.emissiveColor=B.Color3.FromHexString(glow);if(alpha<1){m.alpha=alpha;m.transparencyMode=2;}owned.push(m);mats[key]=m;return m;}
    function glowMat(key,hex,intensity=1){if(mats[key])return mats[key];const m=new B.StandardMaterial('ncz-'+key,scene);m.diffuseColor=B.Color3.Black();m.emissiveColor=B.Color3.FromHexString(hex).scale(intensity);m.disableLighting=true;owned.push(m);mats[key]=m;return m;}
    // While `discard` is set, built parts are thrown away: an upgraded block (below) still runs its procedural code so the
    // seeded random sequence, and so every sign, window and height elsewhere in the city, stays exactly as it was.
    let discard=false;
    function add(mesh,m,p,merge=true){if(discard){mesh.dispose();return mesh;}mesh.material=m;mesh.position.set(...p);mesh.parent=target;mesh.isPickable=false;mesh.receiveShadows=false;if(merge){if(!staticMeshes.has(m))staticMeshes.set(m,[]);staticMeshes.get(m).push(mesh);}else dynamic.push(mesh);return mesh;}
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
    // Shopfront panels: dark grey with the worn-asphalt grain, so they read as weathered render rather than flat colour.
    const shopfront=mat('shopfront','#5c6067',{rough:.85,metal:.1});shopfront.albedoTexture=acg('road-color');shopfront.bumpTexture=acg('road-normal');shopfront.emissiveTexture=acg('road-color');shopfront.emissiveColor=new B.Color3(.2,.2,.22); // a faint self-light so the grain reads on the dim street
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
    const signSpots=[];let signIndex=0;
    // ---- Upgraded blocks: the purchased Cyberpunk City pack (CGTrader; licensed, kept out of the repository, see
    // docs/VOID_RUNNER_ASSET_LICENSES.md) ----
    // Where the pack's models are installed, a block's visible buildings and shopfronts come from them. Collision,
    // interactions, streets, signs and kiosks are unchanged; without the models the procedural block stays.
    // Models face +z as converted (tools/animation-pipeline/pack_to_glb.py); `yaw` turns them to face the street.
    const piece=(key,only,p,yaw)=>{const n=modelInstance?.('ncz:'+key,target,only);if(!n)return null;n.position.set(...p);n.rotation.y=yaw;for(const m of n.getChildMeshes()){m.isPickable=false;m.receiveShadows=false;}return n;};
    const upgraded=[];
    // Block A (prototype, 2026-10-31): Main Street's west side across from the alley mouth. An apartment block over a
    // row of street stalls fronts the street from z -76.6 to -49.4, replacing two procedural plots.
    // Both files or neither: the building alone would leave the stall row empty (a first visit on a slow connection can
    // finish one in time and not the other; the late one is cached for the next visit).
    {const front=51,z0=-76.6,z1=-49.4,face=Math.PI/2,stallTop=4.65,both=['ncz:building5','ncz:storefronts'].every(id=>root.VoidAssets?.container?.(id)),
     b=both?piece('building5',null,[front-11.91/2,stallTop,(z0+z1)/2],face):null;
     if(b){upgraded.push({rect:[front-11.95,front,z0,z1],street:'main'});
      const stalls=[['Store1',3.73],['Store.001',3.57],['Store3',3.71],['StoreFurniture1.007',3.57],['Store.002',3.57],['Store3',3.71]],w=4.02,start=(z0+z1)/2-stalls.length*w/2;
      stalls.forEach(([name,depth],i)=>piece('storefronts',name,[front-depth/2,0,start+w*(i+.5)],face));
      // A fascia between the stall roofs and the building, and plain wall at both ends of the stall row.
      box('blockA-fascia',[.6,stallTop-4.2,z1-z0],[front-.3,4.2+(stallTop-4.2)/2,(z0+z1)/2],frame);
      for(const [a,c] of [[z0,start],[start+stalls.length*w,z1]])if(c-a>.05)box('blockA-end',[3.7,stallTop,c-a],[front-1.85,stallTop/2,(a+c)/2],shopfront);}}
    const upgradedAt=(x,z,m=0)=>upgraded.some(u=>inside(u.rect,x,z,m));
    for(const e of edges){
     const len=Math.hypot(e.b[0]-e.a[0],e.b[1]-e.a[1]),wide=e.street==='avenue'||e.street==='main',sw=wide?3:e.street==='road'?1.5:0,ry=faceInto(e.n);
     // Sidewalk strip, storefronts, awnings and signs on the wide streets; facades on the rest.
     for(let s=0;s<len;s+=7){const t0=s/len,t1=Math.min(1,(s+7)/len),p=along(e,(t0+t1)/2),seg=(t1-t0)*len;if(inGap(e,p))continue;
      const into=[-e.n[0],-e.n[1]],wall=[p[0]+e.n[0]*.05,p[1]+e.n[1]*.05];
      if(sw){const c=[p[0]+into[0]*sw/2,p[1]+into[1]*sw/2];slab(e.n[0]?[sw,.18,seg]:[seg,.18,sw],[c[0],.09,c[1]]);}
      if(e.street==='pad')continue;
      // Ground-floor shopfronts: plain dark grey, lightly textured, for now (David, 2026-10-26). rand() still runs so the signs stay put.
      rand();const run=seg-1.5,face=new B.Vector4(0,0,run/3,1),edge=new B.Vector4(0,0,.05,1),up=upgradedAt(wall[0]+e.n[0]*.5,wall[1]+e.n[1]*.5);discard=up;
      add(B.MeshBuilder.CreateBox('storefront',{width:e.n[0]?.1:run,height:3,depth:e.n[0]?run:.1,faceUV:e.n[0]?[edge,edge,face,face,edge,edge]:[face,face,edge,edge,edge,edge],wrap:true},scene),shopfront,[wall[0],1.6,wall[1]]);
      box('awning',e.n[0]?[1.2,.12,seg-1.2]:[seg-1.2,.12,1.2],[p[0]+into[0]*.6,3.4,p[1]+into[1]*.6],frame);discard=false;
      if(wide&&rand()<.55){const [lines,colors]=shopSigns[signIndex++%shopSigns.length];neon('shop-sign-'+signIndex,lines,colors,2.4,4.4,[p[0]+into[0]*.25,5.2,p[1]+into[1]*.25],ry);signSpots.push({c:colors[0],f:{x:p[0]+e.n[0]*.12,z:p[1]+e.n[1]*.12,tx:e.n[0]?0:1,tz:e.n[0]?1:0,nx:-e.n[0],nz:-e.n[1]}});}
      if(wide&&rand()<.35&&!(discard=up))billboard(5.5+rand()*2,[p[0]+into[0]*.3,10+rand()*2.5,p[1]+into[1]*.3],ry);
      discard=false;if(wide&&rand()<.4){const k=[p[0]+into[0]*(sw-.4),p[1]+into[1]*(sw-.4)];box('kiosk-frame',e.n[0]?[.3,2.9,1.9]:[1.9,2.9,.3],[k[0],1.45,k[1]],frame);plane('kiosk-ad',1.6,2.4,[k[0]+into[0]*.17,1.55,k[1]+into[1]*.17],adMat(nextAd()),ry);}}
    }
    for(const [x0,x1,z] of [[2,152,-12.5]])for(let x=x0+4;x<x1-2;x+=6)box('lane-mark',[2.6,.02,.18],[x,.02,z],glowMat('lane','#d7c06a',.55));
    for(let z=-120;z<-22;z+=6)box('lane-mark',[.18,.02,2.6],[61,.02,z],glowMat('lane','#d7c06a',.55));
    // The avenue runs on into the wider city: its ends open onto the expansion streets (streets.avenueWest / avenueEast).
    // Landing pad: the Kestrel, pad lights, a low wall and the landing terminal.
    box('landing-pad',[18,.12,16],[24,.06,-96],mat('pad','#26262c',{rough:.6,metal:.4}));
    for(const [x,z] of [[15.4,-103.6],[32.6,-103.6],[15.4,-88.4],[32.6,-88.4]])cyl('pad-light',.2,.14,[x,.14,z],amber,true,8);
    for(let i=0;i<4;i++)box('pad-stripe',[18,.02,.25],[24,.13,-104+i*5.3],glowMat('pad-stripe','#f2b33d',.35));
    const ship=shipModel('starter','friendly',parent,{landed:true});ship.position.set(22,1.9,-96);ship.scaling.setAll(2.2);ship.rotation.y=Math.PI;
    box('terminal-base',[.9,1.3,.6],[35.6,.65,-103],frame);plane('terminal-screen',.8,.55,[35.28,1.45,-103],texMat('landing-terminal',texture('landing-terminal',256,176,(g,W,H)=>{g.fillStyle='#04080e';g.fillRect(0,0,W,H);g.fillStyle='#7ff0ff';g.font='bold 22px monospace';g.fillText('LANDING',20,40);g.fillText('TERMINAL',20,66);g.fillStyle='#ffb347';g.font='15px monospace';g.fillText('PAD 07 · KESTREL',20,104);g.fillText('PARKING: THE FUNCTION',20,128);g.fillText('[E] CONNECT',20,156);}),{glow:true}),-Math.PI/2);
    // Puddles: glossy dark water that catches the haze and the lights, not black holes.
    const puddle=new B.StandardMaterial('ncz-puddle',scene);puddle.diffuseColor=new B.Color3(.02,.03,.04);puddle.specularColor=new B.Color3(.7,.8,.9);puddle.specularPower=180;puddle.emissiveColor=new B.Color3(.05,.1,.115);puddle.alpha=.82;owned.push(puddle);
    for(let i=0;i<14;i++){const r=Object.values(S)[i%5],x=r[0]+rand()*(r[1]-r[0]),z=r[2]+rand()*(r[3]-r[2]);const p=add(B.MeshBuilder.CreateDisc('puddle',{radius:.8+rand()*1.4,tessellation:18},scene),puddle,[x,.025,z]);p.rotation.x=Math.PI/2;p.scaling.y=.55;}
    // The Function's banner over the avenue where the main street meets it.
    neon('function-banner',['THE FUNCTION WATCHES OVER YOU','功能 · 秩序 · 利潤'],['#e8f0ff','#ff4a4a'],16,2.6,[61,16,-4.6],0);
    // Batched geometry: thousands of windows, AC units, parapets and roof parts written straight into one mesh per
    // material instead of one mesh each, so entering NeoChinatown stays quick. Same convention as a Babylon plane:
    // a quad turned by r about y faces (-sin r, 0, -cos r).
    const batches=new Map();
    function quadAt(m,c,ax,ay,n,w,h,us=1,vs=1){if(discard)return;let b=batches.get(m);if(!b)batches.set(m,b={p:[],n:[],u:[],i:[]});const k=b.p.length/3;for(const [sx,sy,u,vv] of [[-1,-1,0,0],[1,-1,1,0],[1,1,1,1],[-1,1,0,1]]){b.p.push(c[0]+(ax[0]*sx*w+ay[0]*sy*h)/2,c[1]+(ax[1]*sx*w+ay[1]*sy*h)/2,c[2]+(ax[2]*sx*w+ay[2]*sy*h)/2);b.n.push(...n);b.u.push(u*us,vv*vs);}b.i.push(k,k+1,k+2,k,k+2,k+3);}
    const quad=(m,c,w,h,r,us,vs)=>quadAt(m,c,[Math.cos(r),0,-Math.sin(r)],[0,1,0],[-Math.sin(r),0,-Math.cos(r)],w,h,us,vs);
    // tile: metres one copy of the texture covers ([across, up]); without it a face shows the texture once.
    function cuboid(m,[sx,sy,sz],[x,y,z],tile){const [tw,th]=tile||[sx,sy],us=a=>tile?a/tw:1,vs=tile?sy/th:1;quad(m,[x,y,z-sz/2],sx,sy,0,us(sx),vs);quad(m,[x,y,z+sz/2],sx,sy,Math.PI,us(sx),vs);quad(m,[x+sx/2,y,z],sz,sy,-Math.PI/2,us(sz),vs);quad(m,[x-sx/2,y,z],sz,sy,Math.PI/2,us(sz),vs);quadAt(m,[x,y+sy/2,z],[1,0,0],[0,0,1],[0,1,0],sx,sz);quadAt(m,[x,y-sy/2,z],[1,0,0],[0,0,-1],[0,-1,0],sx,sz);}
    const bbox=(name,size,p,m)=>cuboid(m,size,p);
    // ---- Old neighbourhood (foreground): weathered low-rise blocks under the megacity (David's references, 2026-10-27) ----
    // Corrugated steel, old concrete and leaking plate (ambientCG, CC0), small lit windows, wall AC units, balconies and
    // pipes, and roofs cluttered with tanks, AC units, antennas and dishes. Boxes on the old plots: collision is unchanged.
    const old=[['corrugated-rust',.6,4,.2],['corrugated-green',.6,4,.17],['corrugated-blue',.7,4,.24],['concrete-old',.7,6,.26],['concrete-mold',.72,6,.26],['metal-leaks',.72,5,.26]].map(([n,tint,tile,haze])=>{const m=new B.StandardMaterial('ncz-old-'+n,scene);m.diffuseTexture=acg(n+'-color');m.bumpTexture=acg(n+'-normal');m.diffuseColor=new B.Color3(tint,tint,tint*1.1);m.specularColor=new B.Color3(.05,.05,.06);m.metadata={tile};
     // A dimmed copy of the texture glows faintly, as if lit by the city's haze, so the weathering reads in the dark.
     const e=m.diffuseTexture.clone();e.level=haze;m.emissiveTexture=e;textures.push(e);owned.push(m);return m;});
    // Windows: a dark frame with glass, or a warm or cool room seen through blinds.
    const windowTex=(name,c)=>texture('window-'+name,64,96,(g,W,H)=>{g.fillStyle='#07090c';g.fillRect(0,0,W,H);g.fillStyle=c||'#10161d';g.fillRect(5,5,W-10,H-10);if(c){g.fillStyle='rgba(0,0,0,.38)';for(let y=9;y<H-6;y+=7)g.fillRect(5,y,W-10,2);g.fillStyle='rgba(0,0,0,.55)';g.fillRect(W/2-1,5,2,H-10);g.fillRect(5,H*.55,W-10,3);}else{g.fillStyle='rgba(120,170,200,.10)';g.fillRect(9,9,9,H-18);}});
    const windowLit=[['warm','#d9894a'],['lamp','#e8b878'],['cyan','#4fb8cc'],['pink','#c45a9a'],['tv','#8fd0b0']].map(([n,c])=>texMat('window-'+n,windowTex(n,c),{glow:true})),windowDark=texMat('window-dark',windowTex('dark',null));
    const faceRot=(nx,nz)=>nz<0?0:nz>0?Math.PI:nx>0?-Math.PI/2:Math.PI/2;
    // A facade: start corner (x, z), direction along it (tx, tz), length, outward normal (nx, nz).
    const faceOf=(x0,x1,z0,z1,side)=>({s:{x:x0,z:z0,tx:1,tz:0,len:x1-x0,nx:0,nz:-1},n:{x:x0,z:z1,tx:1,tz:0,len:x1-x0,nx:0,nz:1},w:{x:x0,z:z0,tx:0,tz:1,len:z1-z0,nx:-1,nz:0},e:{x:x1,z:z0,tx:0,tz:1,len:z1-z0,nx:1,nz:0}})[side];
    const onFace=(f,s,y,out=.05)=>[f.x+f.tx*s+f.nx*out,y,f.z+f.tz*s+f.nz*out];
    const roofTar=mat('roof-tar','#3a3b42',{rough:.95,metal:0});roofTar.albedoTexture=acg('road-cracked-color');
    // A roof skin just above a building's top, its texture repeating every 8 m.
    const roofTop=(x0,x1,z0,z1,h)=>quadAt(roofTar,[(x0+x1)/2,h+.02,(z0+z1)/2],[1,0,0],[0,0,1],[0,1,0],x1-x0,z1-z0,(x1-x0)/8,(z1-z0)/8);
    function oldBox(x0,x1,z0,z1,y0,h,k){roofTop(x0,x1,z0,z1,y0+h);const w=x1-x0,d=z1-z0,m=old[k%old.length],t=m.metadata.tile,side=a=>new B.Vector4(0,0,a/t,h/t),cap=new B.Vector4(0,0,w/6,d/6);return add(B.MeshBuilder.CreateBox('old-building',{width:w,height:h,depth:d,faceUV:[side(w),side(w),side(d),side(d),cap,cap],wrap:true},scene),m,[(x0+x1)/2,y0+h/2,(z0+z1)/2]);}
    function facadeDetail(f,h,first=5.6){
     const cols=Math.floor((f.len-1.2)/2.6),floors=Math.floor((h-first-.6)/3.2)+1;if(cols<1||floors<1)return;const pad=(f.len-cols*2.6)/2,ry=faceRot(f.nx,f.nz),along=f.tx!==0;
     for(let fl=0;fl<floors;fl++)for(let c=0;c<cols;c++){const s=pad+1.3+c*2.6,y=first+fl*3.2;if(rand()<.1)continue;
      const lit=rand()<.34;quad(lit?windowLit[Math.floor(rand()*windowLit.length)]:windowDark,onFace(f,s,y),1.1,1.4,ry);
      if(rand()<.14)bbox('wall-ac',along?[.85,.6,.5]:[.5,.6,.85],onFace(f,s,y-1.1,.28),pipe);
      else if(rand()<.05&&fl>0){bbox('balcony',along?[2.2,.12,1]:[1,.12,2.2],onFace(f,s,y-.85,.5),frame);bbox('balcony-rail',along?[2.2,.9,.05]:[.05,.9,2.2],onFace(f,s,y-.4,.98),frame);}}
     if(f.len>6){bbox('downpipe',[.14,h,.14],onFace(f,f.len*(.1+rand()*.8),h/2,.12),rust);if(rand()<.6)bbox('conduit',along?[f.len*.6,.08,.08]:[.08,.08,f.len*.6],onFace(f,f.len/2,first-1.6,.1),frame);}
    }
    function roofClutter(x0,x1,z0,z1,h){const w=x1-x0,d=z1-z0,at=()=>[x0+w*(.2+rand()*.6),z0+d*(.2+rand()*.6)];
     bbox('parapet',[w,.6,.2],[(x0+x1)/2,h+.3,z0+.1],concrete);bbox('parapet',[w,.6,.2],[(x0+x1)/2,h+.3,z1-.1],concrete);bbox('parapet',[.2,.6,d],[x0+.1,h+.3,(z0+z1)/2],concrete);bbox('parapet',[.2,.6,d],[x1-.1,h+.3,(z0+z1)/2],concrete);
     for(let i=0,n=1+Math.floor(rand()*3);i<n;i++){const [x,z]=at();bbox('roof-ac',[1.6,1.1,1.2],[x,h+.55,z],pipe);bbox('roof-ac-grille',[1,.04,.9],[x,h+1.12,z],frame);}
     if(rand()<.5){const [x,z]=at();cyl('water-tank',1.1,2.2,[x,h+1.75,z],rust,true,12);for(const [dx,dz] of [[-.7,-.7],[.7,-.7],[-.7,.7],[.7,.7]])bbox('tank-leg',[.1,.65,.1],[x+dx,h+.33,z+dz],frame);}
     if(rand()<.55){const [x,z]=at(),mh=4+rand()*7;bbox('antenna',[.1,mh,.1],[x,h+mh/2,z],frame);for(let k=1;k<=3;k++)bbox('antenna-bar',[1.5-k*.35,.04,.04],[x,h+mh*(.5+k*.14),z],frame);bbox('antenna-light',[.15,.15,.15],[x,h+mh+.05,z],red);}
     if(rand()<.45){const [x,z]=at(),dish=add(B.MeshBuilder.CreateSphere('dish',{diameter:1.6,segments:8,slice:.5,sideOrientation:B.Mesh.DOUBLESIDE},scene),metal,[x,h+1.5,z]);dish.rotation.x=-1.1;dish.rotation.y=rand()*6.28;bbox('dish-post',[.1,1.1,.1],[x,h+.55,z],frame);}
     if(rand()<.35&&w>6&&d>6){const sw=w*(.3+rand()*.2),sd=d*(.3+rand()*.2),[x,z]=at();oldBox(x-sw/2,x+sw/2,z-sd/2,z+sd/2,h,2.6+rand()*1.8,Math.floor(rand()*3));}
    }
    // An old building on a plot: body, windows and wall clutter on the faces that show, roof clutter on top.
    function lowrise(x0,x1,z0,z1,h,k,faces,first){if(x1-x0<.5||z1-z0<.5)return;if(!faces.length){const m=old[k%old.length];cuboid(m,[x1-x0,h,z1-z0],[(x0+x1)/2,h/2,(z0+z1)/2],[m.metadata.tile,m.metadata.tile]);roofTop(x0,x1,z0,z1,h);if(!low&&rand()<.7)roofClutter(x0,x1,z0,z1,h);return;}oldBox(x0,x1,z0,z1,0,h,k);for(const side of faces)facadeDetail(faceOf(x0,x1,z0,z1,side),h,first);if(faces.length&&(!low||rand()<.5))roofClutter(x0,x1,z0,z1,h);}
    // Ground under the whole city out to the horizon, just below the streets. Without it, every gap between buildings, the
    // strip at the foot of each wall and the land past the outer ring showed straight through to the sky (David, 2026-10-27).
    {const c=[(cityBox[0]+cityBox[1])/2,(cityBox[2]+cityBox[3])/2],ground0=mat('city-ground','#1c1d22',{rough:.92,metal:.05});ground0.albedoTexture=acg('road-cracked-color');
     ground('city-ground',[c[0]-1400,c[0]+1400,c[1]-1400,c[1]+1400],ground0,-.03,12);}
    // Every city block between the streets is built up in plots of up to 12 m, set back 0.35 m from the street so the
    // storefronts stay in front. Plots on the avenue and the main street are taller; nothing you can't walk into looks open.
    const openNear=(x0,x1,z0,z1)=>[...Object.values(S),...Object.values(footprints)].some(([a,b,c,d])=>x0<b&&x1>a&&z0<d&&z1>c);
    const onWide=(x0,x1,z0,z1)=>[S.avenue,S.main].some(([a,b,c,d])=>x0-.6<b&&x1+.6>a&&z0-.6<d&&z1+.6>c);
    for(const s of cityBlocks){const [cx,,cz]=s.position,[w,,d]=s.size,X0=cx-w/2,Z0=cz-d/2,nx=Math.ceil(w/12),nz=Math.ceil(d/12),I=.12,E=.3;
     for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){let x0=X0+w*i/nx,x1=X0+w*(i+1)/nx,z0=Z0+d*j/nz,z1=Z0+d*(j+1)/nz;const faces=[];
      const [a,b,c,e]=[x0,x1,z0,z1];if(openNear(a-E,a,c,e)){x0+=I;faces.push('w');}if(openNear(b,b+E,c,e)){x1-=I;faces.push('e');}if(openNear(a,b,c-E,c)){z0+=I;faces.push('s');}if(openNear(a,b,e,e+E)){z1-=I;faces.push('n');}
      const wide=onWide(a,b,c,e);discard=upgradedAt((a+b)/2,(c+e)/2);lowrise(x0,x1,z0,z1,wide?18+rand()*12:9+rand()*8,i+j*2+s.id.length,faces,wide?7.4:4.6);}}
    discard=false;
    // The outer ring: older mid-rise blocks all round the city's edge (cityBox), facing inward.
    {const [X0,X1,Z0,Z1]=cityBox,ring=[[X0-24,X1+24,Z1,Z1+18,'s'],[X0-24,X1+24,Z0-18,Z0,'n'],[X0-24,X0,Z0,Z1,'e'],[X1,X1+24,Z0,Z1,'w']];
     ring.forEach(([x0,x1,z0,z1,face],k)=>{const along=x1-x0>z1-z0,n=Math.ceil((along?x1-x0:z1-z0)/14);for(let i=0;i<n;i++){const a=i/n,b=(i+1)/n,r=along?[x0+(x1-x0)*a,x0+(x1-x0)*b,z0,z1]:[x0,x1,z0+(z1-z0)*a,z0+(z1-z0)*b];lowrise(...r,26+rand()*20,i+k,[face],8);}});}

    // ---- The city in between: plain lit blocks from the outer ring out to the megacity, seen from a taxi or a roof ----
    {const [X0,X1,Z0,Z1]=cityBox,c=[(X0+X1)/2,(Z0+Z1)/2],R=low?280:300;
     for(let x=c[0]-R;x<c[0]+R;x+=26)for(let z=c[1]-R;z<c[1]+R;z+=26){if(Math.hypot(x+13-c[0],z+13-c[1])>R||x+26>X0-44&&x<X1+44&&z+26>Z0-40&&z<Z1+40)continue;
      const w=18+rand()*6,d=18+rand()*6,h=18+rand()*48,m=windowMats[Math.floor(rand()*3)];cuboid(m,[w,h,d],[x+13,h/2,z+13],m.metadata.tile);roofTop(x+13-w/2,x+13+w/2,z+13-d/2,z+13+d/2,h);}}
    // ---- The megacity (background): enormous lit towers far beyond the old blocks ----
    // Two rings of night towers (ambientCG facades) with set-back crowns, giant ad screens, light strips and beacons.
    // No collision; the haze fades them with distance. One thinner ring on low quality.
    const screens=[],skyCentre=[(cityBox[0]+cityBox[1])/2,(cityBox[2]+cityBox[3])/2],sky=low?[[30,290,370,100,260]]:[[44,290,370,110,320],[58,400,560,220,620]];
    sky.forEach(([n,r0,r1,h0,h1],ring)=>{for(let i=0;i<n;i++){const a=(i+rand()*.7)/n*Math.PI*2,r=r0+rand()*(r1-r0),dir=[Math.sin(a),Math.cos(a)],perp=[Math.cos(a),-Math.sin(a)],x=skyCentre[0]+dir[0]*r,z=skyCentre[1]+dir[1]*r,w=18+rand()*26,d=18+rand()*26,h=h0+rand()*(h1-h0),k=i*7+ring;
      const m=windowMats[k%3],[tw,th]=m.metadata.tile,side=q=>new B.Vector4(0,0,q/tw,h/th),cap=new B.Vector4(0,0,.01,.01);
      add(B.MeshBuilder.CreateBox('skyline',{width:w,height:h,depth:d,faceUV:[side(w),side(w),side(d),side(d),cap,cap],wrap:true},scene),m,[x,h/2,z]).rotation.y=a;
      // A set-back crown or a spire on some.
      if(rand()<.45){const cw=w*(.45+rand()*.25),ch=h*(.08+rand()*.12);add(B.MeshBuilder.CreateBox('skyline-crown',{width:cw,height:ch,depth:d*.6,faceUV:[side(cw),side(cw),side(d*.6),side(d*.6),cap,cap],wrap:true},scene),m,[x,h+ch/2,z]).rotation.y=a;if(rand()<.6){const sh=20+rand()*50;cyl('skyline-spire',.6,sh,[x,h+ch+sh/2,z],frame,true,6);box('skyline-beacon',[1.2,1.2,1.2],[x,h+ch+sh,z],red);}}
      else box('skyline-beacon',[1.4,1.4,1.4],[x,h+.7,z],red);
      // Light strips down the corners that face the neighbourhood.
      if(rand()<.4){const c=[magenta,cyan,violet][Math.floor(rand()*3)];for(const sgn of [-1,1]){const p=[x+perp[0]*sgn*w/2-dir[0]*d/2,z+perp[1]*sgn*w/2-dir[1]*d/2];box('skyline-strip',[.9,h*.85,.9],[p[0],h*.5,p[1]],c).rotation.y=a;}}
      // Giant vertical ad screens facing the neighbourhood; a few nearer ones change.
      if(rand()<(ring?.25:.5)){const sw=Math.min(w*.75,30),sh=sw*1.5,y=Math.max(sh/2+20,h*(.4+rand()*.3)),p=[x-dir[0]*(d/2+.6),y,z-dir[1]*(d/2+.6)],live=!ring&&screens.length<5;
       const sc=add(B.MeshBuilder.CreatePlane('skyline-screen',{width:sw,height:sh},scene),adMat(nextAd()),p,!live);sc.rotation.y=a;if(live)screens.push({mesh:sc,next:4+screens.length*2.3});}}});
    // The night sky (David, 2026-10-28: no visible dome edge). A closed sphere whose colour depends only on
    // elevation, so it has no rim, cap or seam: the fog colour at the horizon (distant towers fade straight into it),
    // a band of light pollution just above, polluted haze, then near-black overhead matching the clear colour.
    // A slower, flatter smog shell of drifting, wrap-around blotches lit from below by the neon sits inside it.
    const skyShells=[];{const fog=scene.fogColor,stops=[[-90,fog],[0,fog],[3,[.17,.3,.32]],[9,[.14,.25,.27]],[20,[.11,.2,.22]],[40,[.085,.155,.175]],[65,[.07,.125,.145]],[90,[.06,.11,.13]]],
     colour=e=>{for(let k=1;k<stops.length;k++)if(e<=stops[k][0]){const [e0,c0]=stops[k-1],[e1,c1]=stops[k],t=(e-e0)/(e1-e0),a=c0.r!=null?[c0.r,c0.g,c0.b]:c0,b2=c1.r!=null?[c1.r,c1.g,c1.b]:c1;return a.map((v,j)=>v+(b2[j]-v)*t);}return stops[stops.length-1][1];};
     const shell=(name,diameter,flat,paint)=>{const m=B.MeshBuilder.CreateSphere(name,{diameter,segments:low?16:28,sideOrientation:B.Mesh.BACKSIDE},scene),pos=m.getVerticesData(B.VertexBuffer.PositionKind),cols=[];
      for(let k=0;k<pos.length;k+=3){const e=Math.asin(Math.max(-1,Math.min(1,pos[k+1]/(diameter/2))))*180/Math.PI;cols.push(...paint(e));}
      m.setVerticesData(B.VertexBuffer.ColorKind,cols);m.scaling.y=flat;m.position.set(skyCentre[0],-40,skyCentre[1]);m.parent=target;m.isPickable=false;m.applyFog=false;m.infiniteDistance=false;skyShells.push(m);return m;};
     const dome=shell('night-sky',2900,1,e=>[...colour(e),1]),dm=new B.StandardMaterial('ncz-night-sky',scene);owned.push(dm);
     dm.disableLighting=true;dm.emissiveColor=B.Color3.White();dm.diffuseColor=B.Color3.Black();dm.specularColor=B.Color3.Black();dm.fogEnabled=false;dome.material=dm;dome.useVertexColors=true;
     scene.clearColor=new B.Color4(.06,.11,.13,1);
     if(!low){// Smog: tiling blotches (each drawn again across every edge so no seam shows), mapped flat from above
      // like a cloud deck, so nothing pinches overhead.
      const t=texture('smog',512,512,(g,W,H)=>{g.fillStyle='#000';g.fillRect(0,0,W,H);for(let n=0;n<110;n++){const x=rand()*W,y=rand()*H,r=20+rand()*70,a=.22+rand()*.35;
        for(const dx of [-W,0,W])for(const dy of [-H,0,H]){const gr=g.createRadialGradient(x+dx,y+dy,0,x+dx,y+dy,r);gr.addColorStop(0,'rgba(255,255,255,'+a+')');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.beginPath();g.ellipse(x+dx,y+dy,r*1.6,r*.8,0,0,Math.PI*2);g.fill();}}});
      t.wrapU=t.wrapV=B.Texture.WRAP_ADDRESSMODE;
      // A cloud deck lit from below: warmer (neon) toward the horizon, thinning a little straight overhead.
      const smog=shell('smog-shell',2500,.55,e=>{const a=e<-2?0:e<8?(e+2)/10:e<70?1:1-(e-70)/40,warm=Math.max(0,1-e/35);return [.2+.2*warm,.27+.03*warm,.33+.12*warm,a*.75];});
      {const pos=smog.getVerticesData(B.VertexBuffer.PositionKind),uv=[];for(let k=0;k<pos.length;k+=3)uv.push(pos[k]/1250*2.2,pos[k+2]/1250*2.2);smog.setVerticesData(B.VertexBuffer.UVKind,uv);}
      const sm=new B.StandardMaterial('ncz-smog',scene);owned.push(sm);sm.disableLighting=true;sm.diffuseColor=B.Color3.Black();sm.specularColor=B.Color3.Black();sm.emissiveColor=B.Color3.White();sm.opacityTexture=t;t.getAlphaFromRGB=true;sm.useAlphaFromDiffuseTexture=false;
      sm.fogEnabled=false;sm.backFaceCulling=false;smog.material=sm;smog.useVertexColors=true;smog.hasVertexAlpha=true;smog.alphaIndex=-10;}
     // Kept out of the glow layer (it would bloom the whole sky).
     const glow=scene.effectLayers?.find(l=>l.name==='void-glow');if(glow)for(const m of skyShells)glow.addExcludedMesh(m);}
    // IronEye drones patrol above the main street and the avenue.
    const drones=[];const droneBody=mat('ironeye','#1d1f24',{rough:.4,metal:.8});for(let i=0;i<(low?2:4);i++){const n=new B.TransformNode('ironeye-'+i,scene);n.parent=parent;const body=add(B.MeshBuilder.CreateSphere('ironeye-body',{diameter:.9,segments:10},scene),droneBody,[0,0,0],false);body.parent=n;body.scaling.y=.6;const eye=add(B.MeshBuilder.CreateDisc('ironeye-eye',{radius:.16,tessellation:12},scene),red,[0,0,-.46],false);eye.parent=n;for(const s of [-1,1]){const rot=box('ironeye-rotor',[.9,.04,.12],[s*.55,.25,0],frame,false);rot.parent=n;}drones.push({n,phase:i*1.7,x:i<3?61:100,z:i<3?-100+i*30:-12.5});}
    // Street pedestrians on the sidewalks.
    for(const [x,z,i] of [[52.6,-40,1],[69.4,-78,2],[52.6,-100,3],[34,-6.6,4],[98,-18.4,5]])characterModel('crew-ncz'+i,parent,[x,0,z],true);
    // Nightlife: people walking and standing about on the sidewalks, a few of them drunk (ncz-nightlife.js).
    const nightlife=root.VoidNightlife&&modelInstance?root.VoidNightlife.start({B,scene,parent,quality,instance:modelInstance}):null;
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
    // Understated entrance: reinforced sliding door, small mark, camera. The frame is two jambs and a header (it
    // used to be one solid slab across the doorway, which is why the opened door never looked open).
    for(const x of [-3.05,3.05])box('district-door-jamb',[.3,3.6,.5],[x,1.8,20.15],frame);box('district-door-header',[6.4,.5,.5],[0,3.35,20.15],frame);
    // Both District doors are pairs of panels that slide into the walls (doors.tick below). Locked until the story
    // opens them, then automatic: they open as you approach from either side and close behind you.
    const doorPanels=(id,z,m,lightZ)=>{const panels=[-1,1].map(s=>{const p=box(id+'-panel',[2.82,3.1,.24],[s*1.41,1.55,z],m,false);p.name=id+(s<0?'-left':'-right');return p;});
     const seam=box(id+'-seam',[.04,3.1,.26],[0,1.55,z],frame,false);const light=box(id+'-status',[5.6,.06,.06],[0,3.15,lightZ],red,false);return {panels,seam,light};};
    const outerDoor=doorPanels('district-door',20,mat('door-steel','#2b2e33',{rough:.4,metal:.85}),19.84);
    neon('district-mark',['DD'],['#9b7bff'],.7,.4,[2.6,2.9,19.7],0);

    // ---- Vestibule --------------------------------------------------------
    add(B.MeshBuilder.CreateGround('vestibule-floor',{width:6,height:6},scene),floor,[0,.02,23]);
    for(const side of [-1,1])box('vestibule-wall',[.3,3.6,6],[side*3.1,1.8,23],metal);box('vestibule-ceiling',[6.4,.3,6],[0,3.6,23],frame);
    box('scanner-post',[.35,1.3,.35],[2.6,.65,24.5],frame);box('scanner-face',[.3,.4,.05],[2.6,1.25,24.31],cyan);
    for(const z of [21.5,24.5])box('status-display',[.05,.6,1],[-2.92,2.2,z],[cyan,magenta][z>23?1:0]);
    box('vestibule-light',[4,.05,.3],[0,3.42,23],white);
    const innerDoor=doorPanels('district-inner-door',26,mat('door-inner','#1d2026',{rough:.35,metal:.9}),25.84);
    const doors=(()=>{const list=[{id:'district-door',flag:'districtDoor',z:20,...outerDoor,open:0,kick:0},{id:'district-inner-door',flag:'districtBadge',z:26,...innerDoor,open:0,kick:0}];
     const green=mat('door-ok','#1d6b4a',{glow:'#3dffa8'}),solidOf=d=>d.solid||(d.solid=(typeof walkingLocation!=='undefined'?walkingLocation?.solids:null)?.find?.(s=>s.id===d.id)||null);
     for(const d of list)if(state.story?.flags?.[d.flag])d.light.material=green;
     // Each frame: open toward 1 when unlocked and you're near (or just pressed E), else close; the collision box is
     // there whenever the door is less than 80% open, and a door never closes on you while you're in the doorway.
     function tick(dt){const cam=scene.activeCamera?.globalPosition,flags=(typeof state!=='undefined'?state:null)?.story?.flags||{};
      const [lx,lz]=cam?toWorld(cam.x,cam.z):[99,99];
      for(const d of list){const unlocked=!!flags[d.flag];if(unlocked&&d.light.material!==green)d.light.material=green;d.kick=Math.max(0,d.kick-dt);
       const near=Math.abs(lx)<3.4&&Math.abs(lz-d.z)<3,inDoorway=Math.abs(lx)<3.2&&Math.abs(lz-d.z)<1.1,want=unlocked&&(near||d.kick>0)||(d.open>.05&&inDoorway)?1:0;
       const before=d.open;d.open=Math.max(0,Math.min(1,d.open+(want?1:-1)*dt*1.25));const e=d.open*d.open*(3-2*d.open);
       if(d.open!==before){d.panels[0].position.x=-1.41-e*2.75;d.panels[1].position.x=1.41+e*2.75;d.seam.setEnabled(e<.02);}
       const solid=solidOf(d);if(solid)solid.open=d.open>=.8;}}
     return {tick,list,kick(id,seconds=4){const d=list.find(x=>x.id===id);if(d){d.kick=seconds;}},state:()=>list.map(d=>({id:d.id,open:+d.open.toFixed(2),locked:!(typeof state!=='undefined'&&state?.story?.flags?.[d.flag]),blocking:!!solidOf(d)&&!solidOf(d).open}))};})();

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

    // The VR terminal (David, 2026-10-28): a dark kiosk on the spot where E opens the VR menu, facing the hallway, with
    // cyan/magenta edge light and a live screen (experience list, scan line, pulsing prompt). Its collision is the
    // 'arcade-terminal' solid; the interaction prompt sits at its screen.
    const terminal=(()=>{const X=-6.85,Z=36,face=-Math.PI/2,dark=mat('kiosk-shell','#121419',{rough:.32,metal:.85}),trim=mat('kiosk-trim','#24272e',{rough:.25,metal:.9});
     box('kiosk-plinth',[.72,.1,1.12],[X,.05,Z],trim,false);box('kiosk-pedestal',[.34,.95,.62],[X-.04,.57,Z],dark,false);
     const head=box('kiosk-head',[.2,.86,1.14],[X+.03,1.42,Z],dark,false);head.rotation.z=.26;
     for(const s of [-1,1]){const strip=box('kiosk-edge',[.03,.86,.03],[X+.14,1.42,Z+s*.58],s<0?cyan:magenta,false);strip.rotation.z=.26;}
     const halo=box('kiosk-halo',[.04,.03,1.0],[X-.07,1.86,Z],cyan,false);void halo;
     box('kiosk-base-glow',[.9,.01,1.3],[X+.05,.012,Z],mat('kiosk-floor','#05060a',{glow:'#1b5e66'}),false);
     // The screen: drawn on a canvas each fifth of a second.
     const W=256,H=320,t=new B.DynamicTexture('ncz-vr-terminal-screen',{width:W,height:H},scene,true);textures.push(t);
     const sm=new B.StandardMaterial('ncz-vr-terminal-screen',scene);owned.push(sm);sm.diffuseColor=B.Color3.Black();sm.specularColor=B.Color3.Black();sm.emissiveTexture=t;sm.disableLighting=true;
     // On the head's front face, so it leans back with it.
     const screen=B.MeshBuilder.CreatePlane('kiosk-screen',{width:.98,height:.74},scene);screen.material=sm;screen.parent=head;screen.isPickable=false;
     screen.position.set(.102,.02,0);screen.rotation.y=face;
     // The terminal's own list (hidden experiences such as the Combat Simulator never appear).
     const items=(root.VoidVR?.listed?.()||[]).map(e=>e.title.toUpperCase()).slice(0,4);if(!items.length)items.push('RELAX IN A FOREST','TROPICAL ESCAPE','PLAY IN A BEDROOM');let clock=0,redraw=0;
     function draw(){const g=t.getContext();g.fillStyle='#04060b';g.fillRect(0,0,W,H);
      g.strokeStyle='rgba(56,232,255,.55)';g.lineWidth=2;g.strokeRect(6,6,W-12,H-12);
      g.fillStyle='#38e8ff';g.font='bold 22px monospace';g.fillText('VR // ARCADE',18,40);g.fillStyle='#ff3fb4';g.fillRect(18,50,90,3);
      g.font='14px monospace';items.forEach((it,i)=>{const y=86+i*42,hot=Math.floor(clock/1.6)%items.length===i;g.fillStyle=hot?'rgba(56,232,255,.18)':'rgba(255,255,255,.04)';g.fillRect(14,y-20,W-28,32);
       g.fillStyle=hot?'#e8fbff':'#7f97a8';g.fillText((hot?'> ':'  ')+it,20,y);});
      // Little live bars and a sweeping scan line.
      for(let i=0;i<10;i++){const h=6+Math.abs(Math.sin(clock*2+i*.9))*20;g.fillStyle=i%2?'#ff3fb4':'#38e8ff';g.fillRect(20+i*14,250-h,9,h);}
      const pulse=.55+.45*Math.sin(clock*4);g.fillStyle='rgba(232,251,255,'+pulse.toFixed(2)+')';g.font='bold 16px monospace';g.fillText('[E] SELECT EXPERIENCE',20,284);
      const sy=(clock*60)%H;g.fillStyle='rgba(56,232,255,.08)';g.fillRect(8,sy,W-16,6);t.update();}
     draw();
     return {tick(dt){clock+=dt;redraw-=dt;if(redraw<=0){redraw=.2;draw();}},screen};})();

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
    // The arcade terminal (vr-core.js): a booth's player takes off the session and steps to the corner for a visitor.
    // The scene is rebuilt after the simulation, so they are back at their rig when the visitor returns.
    root.VoidNeoChinatown&&(root.VoidNeoChinatown.booths={stepAside(i){const z=[32.4,39.6][i],p=vrPlayers.find(p=>Math.abs(p.node.position.z-z)<.5);if(!p||p.aside)return false;
     p.aside={t:0,from:[p.node.position.x,p.node.position.z],to:[-15.6,z+(i?2.6:-2.6)]};try{p.c.play('walk');}catch{try{p.c.play('idle');}catch{}}return true;}});
    function vrTick(dt){for(const p of vrPlayers){if(p.node.isDisposed())continue;
      if(p.aside){const a=p.aside;a.t=Math.min(1,a.t+dt/1.4);const e=a.t<.5?2*a.t*a.t:1-Math.pow(-2*a.t+2,2)/2;p.node.position.x=a.from[0]+(a.to[0]-a.from[0])*e;p.node.position.z=a.from[1]+(a.to[1]-a.from[1])*e;
       p.node.rotation.y=a.t<1?Math.atan2(a.to[0]-a.from[0],a.to[1]-a.from[1]):Math.PI/2;if(a.t>=1&&!a.idle){a.idle=true;try{p.c.play('idle');}catch{}}continue;}
      p.timer-=dt;
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
     // The licensed Neon Urban Utility machine (Astral-3D; docs/VOID_RUNNER_ASSET_LICENSES.md), back to the alcove wall,
     // front where the built machines' glass was; the built machine below stays as the fallback if it isn't there.
     if(!instance('vending-neon',[-6.4,0,z],Math.PI/2)){
     // A hollow cabinet: back, top, base and sides, open at the front behind the glass.
     box('vending-back',[.5,2.2,1.6],[x-.25,1.1,z],vendBody);box('vending-top',[.5,.26,1.6],[x+.25,2.07,z],vendBody);box('vending-base',[.5,.34,1.6],[x+.25,.17,z],vendBody);box('vending-side',[.5,2.2,.07],[x+.25,1.1,z-.765],vendBody);box('vending-side',[.5,2.2,.36],[x+.25,1.1,z+.62],vendBody);box('vending-back-glow',[.04,1.6,1.1],[x+.12,1.15,z-.12],glowMat('vend-back-'+i,['#12384a','#3a1236','#3a2e10'][i],1));
     for(let s=0;s<4;s++){const sy=.5+s*.42;box('vending-shelf',[.62,.03,1.1],[x+.2,sy,z-.12],frame);for(let k=0;k<5;k++){const h=.16+((i*7+s*3+k)%3)*.05,c=(i+s*2+k)%5;box('vending-item',[.22,h,.16],[x+.3,sy+h/2+.02,z-.55+k*.21],glowMat('vend-item-'+c,itemColors[c],.5));}}
     box('vending-led',[.05,.05,1.1],[x+.48,1.97,z-.12],glowMat('vend-led','#f4f8ff',1.5));box('vending-glass',[.02,1.68,1.14],[x+.51,1.18,z-.12],vendGlass,false);
     box('vending-panel',[.06,1.5,.32],[x+.5,1.1,z+.6],frame);box('vending-pay',[.02,.26,.2],[x+.535,1.38,z+.6],glowMat('vend-pay','#6cff9e',.9));box('vending-card',[.02,.1,.18],[x+.535,1.08,z+.6],amber);}
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

    // Taxi zones: a painted box and TAXI on the road, so players know where cabs set down.
    {const t=texture('taxi-zone',256,256,(g,W,H)=>{g.clearRect(0,0,W,H);g.strokeStyle='rgba(242,179,61,.85)';g.lineWidth=8;g.setLineDash([22,14]);g.strokeRect(10,10,W-20,H-20);g.setLineDash([]);g.fillStyle='rgba(242,179,61,.8)';g.font='bold 64px Consolas,monospace';g.textAlign='center';g.textBaseline='middle';g.fillText('TAXI',W/2,H/2);});t.hasAlpha=true;
     const m=texMat('taxi-zone',t);m.useAlphaFromDiffuseTexture=true;m.emissiveColor=new B.Color3(.35,.25,.08);
     for(const z of taxiZones){const g=add(B.MeshBuilder.CreateGround('taxi-zone',{width:5,height:7},scene),m,[z.position[0],.03,z.position[1]],false);g.rotation.y=z.heading||0;}}
    // ---- Future districts: placeholders that stream (city expansion, 2026-10-27) ----
    // Each district's own detail is built when the camera comes within 90 m and disposed beyond 140 m. The streets, walls
    // and surrounding buildings are always there. A placeholder holds no game state, so loading it again changes nothing.
    const city={live:new Map(),loads:0,unloads:0};
    function placeholder(d){const node=new B.TransformNode('district-'+d.id,scene),own=[];node.parent=parent;
     const [x0,x1,z0,z1]=d.rect,cx=(x0+x1)/2,cz=(z0+z1)/2,face=d.id==='corporate'?[x0+.4,cz,-Math.PI/2]:d.id==='milked'?[x1-.4,cz,Math.PI/2]:[cx,z0+.4,Math.PI];
     const t=new B.DynamicTexture('ncz-district-sign-'+d.id,{width:1024,height:256},scene,true),g=t.getContext();g.fillStyle='#07090c';g.fillRect(0,0,1024,256);g.strokeStyle='#5ff2ff';g.lineWidth=6;g.strokeRect(8,8,1008,240);g.textAlign='center';g.textBaseline='middle';
     g.fillStyle='#e8f4f6';g.font='bold 78px Consolas,monospace';g.fillText(d.lines[0],512,100);g.fillStyle='#f2b33d';g.font='bold 44px Consolas,monospace';g.fillText(d.lines[1],512,186);t.update();
     const m=new B.StandardMaterial('ncz-district-sign-'+d.id,scene);m.diffuseColor=B.Color3.Black();m.emissiveTexture=t;m.disableLighting=true;own.push(t,m);
     const sign=B.MeshBuilder.CreatePlane('district-sign',{width:14,height:3.5},scene);sign.material=m;sign.parent=node;sign.position.set(face[0],7,face[1]);sign.rotation.y=face[2];sign.isPickable=false;
     const frameM=new B.StandardMaterial('ncz-district-frame-'+d.id,scene);frameM.diffuseColor=new B.Color3(.08,.09,.1);own.push(frameM);
     const back=B.MeshBuilder.CreateBox('district-sign-back',{width:14.6,height:4.1,depth:.3},scene);back.material=frameM;back.parent=node;back.position.set(face[0]+Math.sin(face[2])*.2,7,face[1]+Math.cos(face[2])*.2);back.rotation.y=face[2];back.isPickable=false;
     // Bollard lights round the plaza edge (flat-topped, low), so the placeholder reads at night.
     const lamp=new B.StandardMaterial('ncz-district-lamp-'+d.id,scene);lamp.emissiveColor=B.Color3.FromHexString('#5ff2ff');lamp.disableLighting=true;own.push(lamp);
     for(const [px,pz] of [[x0+1,z0+1],[x1-1,z0+1],[x0+1,z1-1],[x1-1,z1-1]]){const b=B.MeshBuilder.CreateBox('district-bollard',{width:.3,height:.5,depth:.3},scene);b.material=lamp;b.parent=node;b.position.set(px,.25,pz);b.isPickable=false;}
     return {dispose(){node.dispose(false,true);for(const x of own)x.dispose();}};}
    const rectDistance=([x0,x1,z0,z1],x,z)=>Math.hypot(Math.max(x0-x,0,x-x1),Math.max(z0-z,0,z-z1));
    function streamDistricts(cam){if(!cam)return;for(const d of districts){const near=rectDistance(d.rect,cam.x,cam.z),live=city.live.get(d.id);
     if(!live&&near<90){city.live.set(d.id,placeholder(d));city.loads++;}else if(live&&near>140){live.dispose();city.live.delete(d.id);city.unloads++;}}}
    root.VoidNeoChinatown&&(root.VoidNeoChinatown.city=city);
    let weather=null;
    // ---- Street detail: neon light spill, blade signs, wall lamps, cables, graffiti, the District's front, rain ----
    {const saved=target;target=parent;
     // Light pools: an additive glow on the wall and the wet ground near each light, instead of many real lights
     // (the scene already has more lights than its shaders use).
     const washMats={};function washMat(c,k){const key=c+k;if(washMats[key])return washMats[key];const t=texture('wash-'+c,128,128,(g,W,H)=>{g.fillStyle='#000';g.fillRect(0,0,W,H);const r=g.createRadialGradient(W/2,H/2,1,W/2,H/2,W/2);r.addColorStop(0,c);r.addColorStop(.35,c+'88');r.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=r;g.fillRect(0,0,W,H);});
      const m=new B.StandardMaterial('ncz-wash',scene);m.diffuseColor=B.Color3.Black();m.specularColor=B.Color3.Black();m.emissiveTexture=t;m.disableLighting=true;m.alphaMode=B.Engine.ALPHA_ADD;m.alpha=k;m.disableDepthWrite=true;owned.push(m);washMats[key]=m;return m;}
     const wallWash=(c,f,s,y,w,h,k)=>{const p=add(B.MeshBuilder.CreatePlane('wall-wash',{width:w,height:h},scene),washMat(c,k),onFace(f,s,y,.09));p.rotation.y=faceRot(f.nx,f.nz);return p;};
     const floorWash=(c,x,z,w,d,y,k)=>add(B.MeshBuilder.CreateGround('floor-wash',{width:w,height:d},scene),washMat(c,k),[x,y,z]);
     // Shop-sign spill: each storefront neon lights its patch of wall and the sidewalk under it.
     for(const {c,f} of signSpots){wallWash(c,f,0,5.2,5,6.5,.4);const g=onFace(f,0,0,1.6);floorWash(c,g[0],g[2],f.tx?4:2.8,f.tx?2.8:4,.2,.3);}
     // The street faces (outward normal into the street) of the avenue and the main street, with the gaps where streets join.
     const fronts=[[{x:2,z:-20.12,tx:1,tz:0,len:150,nx:0,nz:1},[[51,71]]],[{x:2,z:-4.88,tx:1,tz:0,len:150,nx:0,nz:-1},[]],[{x:50.88,z:-124,tx:0,tz:1,len:104,nx:1,nz:0},[[-121,-116]]],[{x:71.12,z:-124,tx:0,tz:1,len:104,nx:-1,nz:0},[[-61.6,-55.5]]]];
     const inGapF=(f,s,gaps)=>{const c=f.tx?f.x+s:f.z+s;return gaps.some(([g0,g1])=>c>g0-2&&c<g1+2);};
     // Blade signs: vertical neon sticking out from the wall, readable from both directions (two single-sided faces).
     const blades=[['拉麵','#ff5b5b'],['旅館','#7ff0ff'],['當鋪','#ffcf5a'],['診所','#6cff9e'],['電器','#9b7bff'],['HOTEL','#ff5bd0'],['PHO','#ffb347'],['KEBAB','#ffcf5a'],['CYBERWARE','#7ff0ff'],['網吧','#38e8ff'],['TATTOO','#ff5bd0'],['麻將','#ff5b5b'],['PAWN','#ffcf5a'],['BAR','#ff5bd0'],['NOODLES','#ffb347'],['CLINIC','#6cff9e']];
     const flickers=[],bladeMats={};let bladeIndex=0;
     function blade(f,s,y){const [word,c]=blades[bladeIndex++%blades.length],chars=[...word],hh=chars.length*.9+.5;
      const m=bladeMats[word]??=texMat('blade-'+word,texture('blade-'+word,128,Math.round(128*hh/1.1),(g,W,H)=>{g.fillStyle='rgba(6,6,10,.94)';g.fillRect(0,0,W,H);g.strokeStyle=c;g.lineWidth=5;g.shadowColor=c;g.shadowBlur=10;g.strokeRect(6,6,W-12,H-12);const n=chars.length,size=Math.min(W*.62,(H-24)/n*.86);g.font='bold '+size+'px "Noto Sans SC","Microsoft YaHei",sans-serif';g.textAlign='center';g.textBaseline='middle';chars.forEach((ch,i)=>{const yy=12+(H-24)*(i+.5)/n;g.shadowBlur=16;g.fillStyle=c;g.fillText(ch,W/2,yy);g.shadowBlur=0;g.fillStyle='rgba(255,255,255,.8)';g.fillText(ch,W/2,yy);});}),{glow:true});
      // The sign stands at right angles to the wall: its faces look along the street.
      const ry=faceRot(f.tx,f.tz),mid=onFace(f,s,y,1.05),parts=[];
      for(const [flip,o] of [[0,-.03],[Math.PI,.03]]){const p=B.MeshBuilder.CreatePlane('blade-sign',{width:1.1,height:hh},scene);add(p,m,[mid[0]-f.tx*o,y,mid[2]-f.tz*o],false);p.rotation.y=ry+flip;parts.push(p);}
      bbox('blade-arm',f.tx?[.06,.06,1]:[1,.06,.06],onFace(f,s,y+hh/2-.2,.5),frame);
      wallWash(c,f,s,y,4.5,hh+3,.42);if(rand()<.25)flickers.push({meshes:parts,next:2+rand()*6,off:0});}
     // Wall lamps over the sidewalks: amber sodium or cold white, each with its pool on the wet paving.
     function lamp(f,s){const warm=rand()<.6,c=warm?'#ffb35c':'#bfe9ff';bbox('wall-lamp',f.tx?[.6,.14,.35]:[.35,.14,.6],onFace(f,s,4.4,.35),warm?amber:white);bbox('wall-lamp-arm',f.tx?[.06,.06,.4]:[.4,.06,.06],onFace(f,s,4.5,.15),frame);
      wallWash(c,f,s,3.4,6,5,.32);const g=onFace(f,s,0,1.5);floorWash(c,g[0],g[2],f.tx?5:3,f.tx?3:5,.2,.3);}
     for(const [f,gaps] of fronts)for(let s=4;s<f.len-3;s+=3.5){if(inGapF(f,s,gaps))continue;const r=rand();if(r<.2)blade(f,s,7.2+rand()*2.5);else if(r<.33)lamp(f,s);}
     // Overhead cables: sagging bundles strung between facing buildings, 7-11 m up, each end on a junction box.
     const cableMat=mat('cable','#0a0a0c',{rough:.6,metal:.3});
     function cable(a,b,sag,r){const pts=[];for(let i=0;i<=12;i++){const t=i/12;pts.push(v(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t-Math.sin(Math.PI*t)*sag,a[2]+(b[2]-a[2])*t));}add(B.MeshBuilder.CreateTube('cable',{path:pts,radius:r,tessellation:4},scene),cableMat,[0,0,0]);}
     function span(a,b,n){if(taxiZones.some(z=>Math.hypot((a[0]+b[0])/2-z.position[0],(a[1]+b[1])/2-z.position[1])<8))return;for(let i=0;i<n;i++){const A=[a[0],7+rand()*4,a[1]],Bp=[b[0],7+rand()*4,b[1]];cable(A,Bp,.6+rand()*1.2,.025+rand()*.02);bbox('junction-box',[.35,.45,.35],A,frame);bbox('junction-box',[.35,.45,.35],Bp,frame);}}
     for(let z=-118;z<-24;z+=8+rand()*5)span([51.05,z],[70.95,z+(rand()-.5)*6],2+Math.floor(rand()*2));
     for(let x=6;x<150;x+=9+rand()*6){if(x>49&&x<73)continue;span([x,-19.95],[x+(rand()-.5)*6,-5.05],1+Math.floor(rand()*2));}
     for(let x=16;x<50;x+=7+rand()*4)span([x,-120.95],[x+(rand()-.5)*4,-116.05],1+Math.floor(rand()*2));
     for(let z=-114;z<-94;z+=6+rand()*3)span([37.55,z],[43.95,z+(rand()-.5)*3],1);
     for(let x=A[0]+4;x<A[1]-2;x+=7+rand()*5)if(Math.abs(x-DOOR.x)>5)span([x,A[3]-.2],[x+(rand()-.5)*3,A[2]+.2],1+Math.floor(rand()*2));
     // Graffiti on the quieter streets: the access road, the passage and the pad's walls, above the shopfront line.
     const tags=[['QUESTION THE SYSTEM','spray','#e8e2d0','#b52a2a'],['PRIVACY IS RESISTANCE','stencil','#7ff0ff'],['YOU ARE NOT A PRODUCT','hand','#ffcf5a'],['WHO WATCHES THE WATCHERS?','stencil','#f2f0e8'],['DISCONNECT TO EXIST','spray','#6cff9e','#101814'],['OBEY / CONSUME / REPEAT','stencil','#ff5bd0'],['NO GODS. NO ALGORITHMS.','hand','#e8e2d0'],['YOUR DATA IS NOT YOURS','spray','#9b7bff','#120c1c']];
     [[{x:13,z:-121.12,tx:1,tz:0,nx:0,nz:1},9,4.6,7],[{x:13,z:-115.88,tx:1,tz:0,nx:0,nz:-1},12,4.4,6],[{x:37.38,z:-116,tx:0,tz:1,nx:1,nz:0},14,4.2,5.5],[{x:44.12,z:-116,tx:0,tz:1,nx:-1,nz:0},8,4.2,6],[{x:12.88,z:-106,tx:0,tz:1,nx:1,nz:0},10,3.6,7],[{x:13,z:-85.88,tx:1,tz:0,nx:0,nz:-1},15,4,6.5],[{x:13,z:-106.12,tx:1,tz:0,nx:0,nz:1},6,3.4,5],[{x:13,z:-121.12,tx:1,tz:0,nx:0,nz:1},29,5,5.5]]
      .forEach(([f,s,y,w],i)=>{const [text,style,c,o]=tags[i%tags.length],lines=style==='stencil'||text.length<16?1:2;decal(graffiti(text,style,c,o),w,w*(lines>1?.5:.25),onFace(f,s,y,.06),faceRot(f.nx,f.nz));});
     // Wet streets: more dark mirror puddles on the higher settings.
     for(let i=0;i<(low?0:26);i++){const r=[S.main,S.avenue,S.road,S.pad,S.passage][i%5],x=r[0]+2+rand()*(r[1]-r[0]-4),z=r[2]+2+rand()*(r[3]-r[2]-4);const p=add(B.MeshBuilder.CreateDisc('puddle',{radius:.6+rand()*1.6,tessellation:16},scene),puddle,[x,.026,z]);p.rotation.x=Math.PI/2;p.scaling.y=.5+rand()*.4;}
     // Landing pad: four wall floodlights, cold white, lighting the pad and the Kestrel's surroundings.
     for(const [x,z,f] of [[13.4,-100,{x:12.88,z:-106,tx:0,tz:1,nx:1,nz:0}],[13.4,-91,{x:12.88,z:-106,tx:0,tz:1,nx:1,nz:0}],[19,-86.4,{x:13,z:-85.88,tx:1,tz:0,nx:0,nz:-1}],[30,-105.6,{x:13,z:-106.12,tx:1,tz:0,nx:0,nz:1}]]){const s=f.tx?x-f.x:z-f.z;box('pad-flood',f.tx?[1.2,.5,.4]:[.4,.5,1.2],onFace(f,s,6.5,.3),white);wallWash('#cfefff',f,s,5,8,7,.35);const g=onFace(f,s,0,5);floorWash('#cfefff',g[0],g[2],11,11,.14,.42);}
     // The District's front stays discreet: a dim violet pool on the wet alley floor at its door.
     {const [dx,dz]=toWorld(0,18.4);floorWash('#9b7bff',dx,dz,6,3,.035,.35);}
     // Rain: streaks that follow the camera outdoors and stop inside the District. Off on low quality.
     let rain=null;
     if(!low&&B.ParticleSystem){const drop=texture('raindrop',8,64,(g,W,H)=>{g.clearRect(0,0,W,H);const gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,'rgba(190,225,255,0)');gr.addColorStop(1,'rgba(190,225,255,.85)');g.fillStyle=gr;g.fillRect(W/2-1.5,0,3,H);});drop.hasAlpha=true;
      const hi=quality==='high';rain=new B.ParticleSystem('ncz-rain',hi?3200:1700,scene);rain.particleTexture=drop;rain.emitter=v(31,0,-96);rain.minEmitBox=v(-24,12,-24);rain.maxEmitBox=v(24,17,24);rain.direction1=v(-.8,-24,-.4);rain.direction2=v(-.3,-28,.4);rain.minLifeTime=rain.maxLifeTime=.72;rain.minSize=.03;rain.maxSize=.045;rain.minScaleX=rain.maxScaleX=1;rain.minScaleY=11;rain.maxScaleY=15;rain.billboardMode=B.ParticleSystem.BILLBOARDMODE_STRETCHED;rain.color1=new B.Color4(.55,.72,.85,.3);rain.color2=new B.Color4(.45,.62,.78,.2);rain.colorDead=new B.Color4(.4,.5,.6,0);rain.emitRate=hi?3400:1800;rain.blendMode=B.ParticleSystem.BLENDMODE_ADD;rain.start();}
     weather={flickers,rain,rainRate:rain?.emitRate||0};
     target=saved;}
    // The District's front: a small backlit plaque, violet trim round the reinforced door and a second camera.
    {const saved=target;target=districtRoot;
     neon('district-plaque',['THE DARKNET DISTRICT'],['#c9b4ff'],2.3,.32,[0,4.05,19.6],0,'rgba(8,6,14,.94)');
     const trim=glowMat('violet-trim','#6c44b8',.6);box('district-trim',[6,.035,.035],[0,3.56,19.62],trim);for(const sx of [-1,1])box('district-trim',[.035,3.56,.035],[sx*2.96,1.78,19.62],trim);
     box('camera-arm-2',[.06,.06,.6],[3.4,3.95,19.6],frame);box('camera-body-2',[.25,.2,.45],[3.4,3.85,19.28],frame);box('camera-led-2',[.05,.05,.02],[3.4,3.85,19.04],red);
     target=saved;}

    for(const [m,b] of batches){const mesh=new B.Mesh('ncz-batch',scene),vd=new B.VertexData();vd.positions=b.p;vd.normals=b.n;vd.uvs=b.u;vd.indices=b.i;vd.applyToMesh(mesh);mesh.material=m;mesh.parent=parent;mesh.isPickable=false;}
    // Merge static meshes by material to keep draw calls low.
    for(const [m,list] of staticMeshes)if(list.length>1){const merged=B.Mesh.MergeMeshes(list,true,true,undefined,false,false);if(merged){merged.parent=parent;merged.material=m;merged.isPickable=false;}}
    let lastTick=null;
    function atmosphere(time,dt){applyLook();const cam=scene.activeCamera?.globalPosition,inside=!!cam&&zone({x:cam.x,z:cam.z}).area==='district',sky=inside?indoor:outdoor;
     if(ambient){ambient.intensity+=(sky.intensity-ambient.intensity)*Math.min(1,dt*3);if(inside!==wasInside){if(sky.diffuse)ambient.diffuse=sky.diffuse;if(sky.ground&&ambient.groundColor)ambient.groundColor=sky.ground;wasInside=inside;}}
     streamDistricts(cam);
     if(weather?.rain&&cam){weather.rain.emitter.x=cam.x;weather.rain.emitter.z=cam.z;weather.rain.emitRate=inside?0:weather.rainRate;}
     for(const fl of weather?.flickers||[]){if(fl.off>0){fl.off-=dt;if(fl.off<=0)for(const m of fl.meshes)m.isVisible=true;}else if(time>fl.next){fl.off=.05+Math.random()*.12;fl.next=time+2+Math.random()*7;for(const m of fl.meshes)m.isVisible=false;}}
     for(const s of screens)if(time>s.next){s.mesh.material=adMat(nextAd());s.next=time+9+Math.random()*4;}}
    let wasInside=null;
    function tick(time){const dt=lastTick===null?0:Math.min(.1,Math.max(0,time-lastTick));lastTick=time;if(skyShells[1])skyShells[1].rotation.y+=dt*.0035;vrTick(dt);doors.tick(dt);terminal.tick(dt);nightlife?.tick(dt);atmosphere(time,dt);for(const d of drones){d.n.position.set(d.x+Math.sin(time*.3+d.phase)*6,9+Math.sin(time*1.3+d.phase)*.4,d.z+Math.cos(time*.21+d.phase)*4);d.n.rotation.y=time*.3+d.phase;}}
    return {tick,city,nightlife,doors,dispose(){disposed=true;nightlife?.dispose();for(const live of city.live.values())live.dispose();city.live.clear();districtRoot.dispose();for(const l of lights)l.dispose();for(const t of textures)t.dispose();for(const m of owned)m.dispose(false,true);scene.clearColor=previous.clear;scene.fogMode=previous.fogMode;scene.fogDensity=previous.fogDensity;scene.fogColor=previous.fogColor;if(sun&&lightState.sun!=null)sun.intensity=lightState.sun;if(ambient&&lightState.ambient!=null)ambient.intensity=lightState.ambient;weather?.rain?.dispose();ip.exposure=previous.exposure;ip.contrast=previous.contrast;if(previous.env!=null)scene.environmentIntensity=previous.env;if(ambient){if(lightState.diffuse)ambient.diffuse=lightState.diffuse;if(lightState.ground&&ambient.groundColor)ambient.groundColor=lightState.ground;}}};
  }
  // Licensed models (docs/VOID_RUNNER_ASSET_LICENSES.md) dressing the District; loaded before build().
  const models={'crowd:vr-player-a':{src:'assets/models/crowd/vr-player-a.glb',background:true},'crowd:vr-player-b':{src:'assets/models/crowd/vr-player-b.glb',background:true},'district:couch':{src:'assets/models/district/couch.glb',scale:.5},'district:bin':{src:'assets/models/district/bin.glb',scale:.6},'district:chair':{src:'assets/models/district/chair.glb',scale:1},
   // Purchased vending machine (CGTrader, Royalty Free no AI): kept out of the public repository; the live site gets it,
   // encrypted, from the private asset repository (tools/assets/build-pages.cjs). Without it the built machines stay.
   'district:vending-neon':{src:'assets/models/district/vending-neon.vrpak',scale:1},
   // Purchased Cyberpunk City pack (CGTrader #4757767, Royalty Free no AI; upgraded blocks above): kept out of the
   // public repository; the live site gets it, encrypted, from the private asset repository. Without it the block
   // keeps its built buildings.
   'ncz:building5':{src:'assets/models/ncz/building5.vrpak'},'ncz:storefronts':{src:'assets/models/ncz/storefronts.vrpak'}};
  const api={layout,build,models,toWorld,zone,streets,footprints,door:DOOR,districts,taxiZones,cityBox};if(typeof module!=='undefined')module.exports=api;else root.VoidNeoChinatown=api;
})(globalThis);
