/* Bounded Babylon workshop scene. Asset hooks replace models, not gameplay anchors. */
(function(root){
 const base=typeof document==='undefined'?null:new URL('.',document.currentScript.src);
 function build({scene,parent,quality,shadowLight,characterModel,shipModel,state,camera}){
  const B=BABYLON,low=quality==='low',owned=[],textures=[],staticMeshes=[],dynamic=[],canNodes=[],v=(x,y,z)=>new B.Vector3(x,y,z);
  let seed=719;const rand=()=>((seed=seed*16807%2147483647)-1)/2147483646;
  const mats={};
  function texture(name,kind,color){const t=VoidVesperVisuals.surfaceTexture(B,scene,name,kind,color,quality);textures.push(t);return t;}
  function mat(name,color,rough=.8,metal=.1,glow){if(mats[name])return mats[name];const m=new B.PBRMaterial('ward-'+name,scene);owned.push(m);m.albedoColor=B.Color3.FromHexString(color);m.roughness=rough;m.metallic=metal;m.environmentIntensity=.6;if(glow)m.emissiveColor=B.Color3.FromHexString(glow);mats[name]=m;return m;}
  const sand=mat('sand','#ad8662',.97,0),paint=mat('paint','#887b68',.81,.32),steel=mat('steel','#464b4a',.52,.55),rust=mat('faded-orange','#b4773a',.75,.26),dark=mat('rubber','#222b2e',.9),floorMat=mat('concrete','#9d9483',.85,.09),blue=mat('monitor','#163443',.5,.2,'#3289a8'),warm=mat('warm','#efd59b',.5,.1,'#ffc373'),cloth=mat('cloth','#656b56');
  paint.albedoTexture=texture('paint','metal','#8e8b80');paint.albedoColor.set(1,1,1);
  steel.albedoTexture=texture('steel','metal','#555d5d');steel.albedoColor.set(1,1,1);
  rust.albedoTexture=texture('faded-orange','metal','#a97848');rust.albedoColor.set(1,1,1);
  floorMat.albedoTexture=texture('floor','floor','#999182');floorMat.albedoTexture.uScale=floorMat.albedoTexture.vScale=2;floorMat.albedoColor.set(1,1,1);
  sand.albedoTexture=texture('soil','soil','#b59570');sand.albedoColor.set(1,1,1);sand.albedoTexture.uScale=sand.albedoTexture.vScale=80;
  function add(mesh,m,p,owner=parent,merge=true){mesh.material=m;mesh.position.set(...p);mesh.parent=owner;mesh.receiveShadows=true;mesh.isPickable=false;if(merge)staticMeshes.push(mesh);return mesh;}
  function box(name,size,p,m=paint,owner=parent,merge=true){return add(B.MeshBuilder.CreateBox(name,{width:size[0],height:size[1],depth:size[2]},scene),m,p,owner,merge);}
  // Chamfered hero boxes: six faces, twelve bevels, eight corner triangles.
  function bevel(name,size,p,m=paint,owner=parent,b=.06,merge=true){const h=size.map(x=>x/2),q=h.map(x=>Math.max(.001,x-Math.min(b,Math.min(...h)*.5))),faces=[];
   for(let axis=0;axis<3;axis++)for(const sign of [-1,1]){const other=[0,1,2].filter(x=>x!==axis);faces.push([[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,c])=>{const point=[0,0,0];point[axis]=h[axis]*sign;point[other[0]]=q[other[0]]*a;point[other[1]]=q[other[1]]*c;return point;}));}
   for(let a=0;a<3;a++)for(let c=a+1;c<3;c++)for(const sa of [-1,1])for(const sc of [-1,1]){const free=3-a-c;faces.push([[true,-1],[false,-1],[false,1],[true,1]].map(([outer,side])=>{const p=[0,0,0];p[a]=(outer?h[a]:q[a])*sa;p[c]=(outer?q[c]:h[c])*sc;p[free]=q[free]*side;return p;}));}
   for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1])faces.push([0,1,2].map(axis=>[0,1,2].map(i=>(i===axis?h[i]:q[i])*[x,y,z][i])));
   const positions=[],indices=[],normals=[],uvs=[];for(const face of faces){const ab=v(...face[1]).subtract(v(...face[0])),ac=v(...face[2]).subtract(v(...face[0]));if(B.Vector3.Dot(B.Vector3.Cross(ab,ac),v(...face[0]))<0)face.reverse();const start=positions.length/3;for(let i=0;i<face.length;i++){positions.push(...face[i]);uvs.push(i===1||i===2?1:0,i>=2?1:0);}for(let i=1;i<face.length-1;i++)indices.push(start,start+i+1,start+i);}B.VertexData.ComputeNormals(positions,indices,normals);const mesh=new B.Mesh(name,scene),data=new B.VertexData();Object.assign(data,{positions,indices,normals,uvs});data.applyToMesh(mesh);return add(mesh,m,p,owner,merge);}
  function cylinder(name,radius,height,p,m=steel,owner=parent,segments=12,merge=true){return add(B.MeshBuilder.CreateCylinder(name,{height,diameter:radius*2,tessellation:segments},scene),m,p,owner,merge);}
  function tube(name,points,radius,m=dark){return add(B.MeshBuilder.CreateTube(name,{path:points.map(a=>v(...a)),radius,tessellation:6},scene),m,[0,0,0]);}
  function sign(name,text,p,w=2,h=.6,mcolor='#6dbea9',owner=parent){const t=new B.DynamicTexture(name,{width:512,height:128},scene,false);textures.push(t);const g=t.getContext();g.fillStyle='#132228';g.fillRect(0,0,512,128);g.strokeStyle=mcolor;g.lineWidth=4;g.strokeRect(8,8,496,112);g.fillStyle=mcolor;g.font='bold 25px monospace';g.textAlign='center';g.fillText(text,256,72);t.update();const m=new B.StandardMaterial(name,scene);owned.push(m);m.diffuseTexture=t;m.emissiveTexture=t;m.specularColor=B.Color3.Black();const mesh=B.MeshBuilder.CreatePlane(name,{width:w,height:h,sideOrientation:B.Mesh.DOUBLESIDE},scene);add(mesh,m,p,owner,false);return mesh;}
  function hook(id,at,fallback){const imported=VoidAssets.instance('opening:'+id,parent);if(imported){imported.position.set(...at);return imported;}return fallback();}
  const ground=add(B.MeshBuilder.CreateGround('vesper-terrain',{width:1600,height:1600,subdivisions:1},scene),sand,[0,-.07,0],parent,false);
  const sky=new B.ShaderMaterial('ward-sky',scene,{vertexSource:'precision highp float;attribute vec3 position;uniform mat4 worldViewProjection;varying vec3 p;void main(){p=position;gl_Position=worldViewProjection*vec4(position,1.);}',fragmentSource:'precision highp float;varying vec3 p;void main(){float h=clamp(normalize(p).y,0.,1.);vec3 c=mix(vec3(.89,.68,.50),vec3(.19,.45,.77),smoothstep(0.,.9,h));gl_FragColor=vec4(c,1.);}'},{attributes:['position'],uniforms:['worldViewProjection']});owned.push(sky);sky.backFaceCulling=false;sky.disableDepthWrite=true;sky.fogEnabled=false;
  const dome=B.MeshBuilder.CreateSphere('vesper-sky',{diameter:1900,segments:16,sideOrientation:B.Mesh.BACKSIDE},scene);add(dome,sky,[0,0,0],parent,false);dome.infiniteDistance=true;
  scene.clearColor=B.Color4.FromHexString('#9aaab9ff');scene.fogMode=B.Scene.FOGMODE_EXP2;scene.fogDensity=.00085;scene.fogColor=B.Color3.FromHexString('#cfb99c');scene.ambientColor=B.Color3.Black();
  const hemi=scene.lights.find(l=>l.name==='ambient');if(hemi){hemi.intensity=.38;hemi.diffuse=B.Color3.FromHexString('#b7d3ec');hemi.groundColor=B.Color3.FromHexString('#a78461');}shadowLight.direction=v(-.55,-.8,.25);shadowLight.intensity=2.2;shadowLight.diffuse=B.Color3.FromHexString('#ffe0ad');shadowLight.position=v(45,75,-30);shadowLight.shadowMinZ=1;shadowLight.shadowMaxZ=180;shadowLight.autoUpdateExtends=false;shadowLight.orthoLeft=-65;shadowLight.orthoRight=65;shadowLight.orthoBottom=-65;shadowLight.orthoTop=65;
  scene.imageProcessingConfiguration.toneMappingEnabled=true;scene.imageProcessingConfiguration.exposure=1.18;scene.imageProcessingConfiguration.contrast=1.08;
  // The whole horizon is a continuous 3D heightfield. Flight can look down or behind the shop.
  const rock=mat('rock','#927056',.94,0),ridgeMat=mat('mesa','#ffffff',.96,0);ridgeMat.backFaceCulling=false;
  VoidVesperVisuals.mountainRing(B,scene,parent,ridgeMat,quality);
  const moonMat=mat('moon','#d9dfeb',1,0,'#242937');moonMat.fogEnabled=false;moonMat.albedoTexture=texture('moon','moon','#bdc9dd');moonMat.albedoColor.set(1,1,1);const moon=add(B.MeshBuilder.CreateSphere('distant-moon',{diameter:240,segments:32},scene),moonMat,[410,270,850],parent,false);moon.receiveShadows=false;const companion=add(B.MeshBuilder.CreateSphere('vesper-companion',{diameter:38,segments:16},scene),moonMat,[285,245,760],parent,false);companion.receiveShadows=false;
  // Independent open-front workshop; no station shell, solar arrays or interior corridor.
  hook('workshop',[0,0,0],()=>{box('workshop-slab',[29,.25,28],[0,-.1,-10],floorMat);for(const x of [-13,13]){bevel('wall-panel',[.35,6,24],[x,3,-11.5]);for(let z=-21;z<1;z+=4)bevel('support-column',[.42,6.2,.5],[x*.97,3.1,z],steel);}
   box('back-panel',[26,6,.35],[0,3,-23],paint);box('garage-roof',[28,.28,25],[0,6.2,-11.5],steel);bevel('header',[27,.6,.65],[0,5.8,.5],rust);for(let z=-21;z<2;z+=4){bevel('roof-crossbeam',[26,.22,.22],[0,5.8,z],steel);for(const x of [-8,8]){const beam=bevel('diagonal-brace',[.16,.16,6],[x,5.4,z+1],steel);beam.rotation.z=x<0?.08:-.08;}}
   for(const x of [-12,12]){bevel('door-track',[.22,5.8,.25],[x,2.9,.9],dark);for(let y=1;y<5;y+=1.2)bevel('panel-repair',[.06,.8,1.4],[x>0?12.78:-12.78,y,-14],y%2?paint:steel);}
   for(const x of [-8,7])for(const z of [-6,-17]){bevel('light-fixture',[2.8,.16,.35],[x,5.9,z],dark);box('warm-strip',[2.5,.04,.2],[x,5.79,z],warm);}return parent;});
  // Shared wall and floor treatments keep the old collision shell and gameplay anchors intact.
  const inset=mat('wall-inset','#59615d',.78,.34),seam=mat('joint','#292f30',.91,.18),warning=mat('safety-ochre','#ba8950',.72,.22);
  const panelAlbedo=new B.Texture(new URL('art/vesper-weathered-panels.webp',base).href,scene,true,false),panelNormal=new B.Texture(new URL('art/vesper-weathered-normal.webp',base).href,scene,true,false);textures.push(panelAlbedo,panelNormal);
  panelAlbedo.anisotropicFilteringLevel=quality==='low'?2:8;panelNormal.anisotropicFilteringLevel=quality==='low'?2:8;
  inset.albedoTexture=panelAlbedo;inset.bumpTexture=panelNormal;inset.bumpTexture.level=.28;inset.albedoColor=B.Color3.FromHexString('#9caaa6');
  for(const side of [-1,1]){
   for(const z of [-19,-13,-7]){
    bevel('service-wall-panel',[.07,3.5,5.25],[side*12.76,2.9,z],inset,parent,.035);
    box('vertical-joint',[.10,4.5,.07],[side*12.69,2.9,z+2.65],seam);
    box('kick-plate',[.12,.75,5.25],[side*12.67,.46,z],steel);
    box('overhead-cable-tray',[.22,.16,5.25],[side*12.62,5.45,z],dark);
    if(z===-13){bevel('utility-cover',[.13,1.15,1.2],[side*12.60,2.1,z],paint,parent,.04);box('utility-screen',[.15,.32,.72],[side*12.52,2.25,z],blue);}
   }
   for(const z of [-18,-8]){
    bevel('exterior-buttress',[.35,6.0,.55],[side*13.18,3,z],steel,parent,.07);
    box('exterior-rail',[.12,.17,8.6],[side*13.25,1.05,z+2],rust);
   }
   box('portal-jamb',[.52,6.1,.55],[side*12.8,3.05,1.12],steel);
   box('portal-safety-stripe',[.035,3.8,.15],[side*12.47,2.1,1.47],warning);
  }
  for(const z of [-18,-12,-6]){
   bevel('ceiling-plate',[11,.055,5.1],[0,6.015,z],paint,parent,.035);
   box('ceiling-joint',[25,.09,.12],[0,5.95,z+2.55],seam);
  }
  for(const x of [-8,8])for(const z of [-17,-7]){
   box('floor-access',[2.0,.018,1.35],[x,.042,z],inset);
   for(const side of [-1,1])box('access-edge',[.065,.023,1.45],[x+side*1.02,.055,z],steel);
  }
  box('door-threshold',[26,.035,.55],[0,.055,1.0],steel);
  for(let x=-12;x<=12;x+=.5)box('threshold-slot',[.17,.038,.11],[x,.08,1.0],seam);
  for(const z of [7,11,15])for(const x of [4,12,20]){
   box('apron-joint',[5.2,.012,.035],[x,.064,z],seam);
  }
  for(const side of [-1,1])for(const z of [4,8,12]){
   box('apron-track',[.09,.018,2.2],[side*4.9,.063,z],seam);
  }
  const lamp=new B.PointLight('ward-worklamp',v(-7,3,-6),scene);lamp.diffuse=B.Color3.FromHexString('#ffc57c');lamp.intensity=45;lamp.range=12;lamp.parent=parent;
  if(!low){const entryLamp=new B.PointLight('ward-entrance-worklight',v(7,4,-1),scene);entryLamp.diffuse=B.Color3.FromHexString('#ffd4a0');entryLamp.intensity=22;entryLamp.range=15;entryLamp.parent=parent;}
  // Workbench, drawers, diagnostic screen and restrained tool silhouettes.
  hook('bench',[-10,0,-11],()=>{bevel('bench-top',[2.5,.18,8],[-10,1.03,-11],steel);for(const z of [-14,-8]){bevel('cabinet',[2.25,.95,2.6],[-10,.5,z],rust);for(let i=0;i<4;i++){bevel('drawer',[2.05,.16,.035],[-10,.22+i*.2,z+1.32],paint);bevel('drawer-handle',[.65,.045,.07],[-10,.22+i*.2,z+1.36],steel);}}for(let i=0;i<8;i++){const tool=bevel('bench-tool',[.12,.05,.45],[-10.8+rand()*1.4,1.16,-13+rand()*4],steel);tool.rotation.y=rand()*5;}return parent;});
  bevel('diagnostic-case',[1.8,1.2,.22],[-10,2,-13.7],rust);sign('diagnostic','KESTREL / SYSTEMS NOMINAL',[-10,2,-13.55],1.5,.85,'#69b9cc');
  for(let i=0;i<3;i++){bevel('service-case',[1.3,.7,1],[-11+i*1.7,.38,-20],i===1?steel:rust);bevel('case-lid',[1.34,.1,1.05],[-11+i*1.7,.79,-20],paint);}
  for(const z of [-18,-15]){cylinder('gas-bottle',.23,1.35,[9.6,.75,z],z===-18?rust:blue);cylinder('valve',.07,.14,[9.6,1.49,z],steel);}
  const hose=[];for(let i=0;i<48;i++){const a=i*.19;hose.push([-5+Math.cos(a)*(1.2-i*.008),.08,-14+Math.sin(a)*(1.2-i*.008)]);}tube('coiled-service-hose',hose,.045);tube('power-cable',[[-10,.09,-11],[-7,.09,-10],[-5,.09,-7],[-6,.09,-4]],.035);
  for(const x of [8.2,10.2])bevel('hoist-upright',[.18,3.2,.18],[x,1.6,-17],rust);bevel('hoist-crossbar',[2.6,.22,.3],[9.2,3.2,-17],rust);cylinder('hoist-cable',.018,1.3,[9.2,2.45,-17],steel);const hookRing=B.MeshBuilder.CreateTorus('hoist-hook',{diameter:.3,thickness:.06,tessellation:12},scene);add(hookRing,steel,[9.2,1.7,-17]);hookRing.rotation.x=Math.PI/2;
  // Useful workshop clutter stays along the sides, leaving a clear walking lane.
  for(let i=0;i<5;i++){bevel('tool-drawer',[1.3,.16,.05],[-10.3,.25+i*.14,-6.6],paint);bevel('tool-pull',[.6,.035,.09],[-10.3,.25+i*.14,-6.54],steel);}
  cylinder('shop-stool-seat',.4,.13,[-7.8,.86,-10],dark);for(const x of [-8,-7.6])for(const z of [-10.2,-9.8])cylinder('stool-leg',.035,.8,[x,.4,z],steel);
  for(let i=0;i<5;i++)bevel('floor-expansion-joint',[25,.012,.025],[0,.036,-20+i*4.5],dark);
  for(let i=0;i<55;i++)box('drain-slot',[.08,.016,.5],[-11+i*.4,.045,.6],dark);
  for(let i=0;i<10;i++){const z=-18+i*1.7;bevel('electrical-conduit',[.045,.045,1.55],[-12.7,2.4,z],steel);}
  for(let i=0;i<62;i++){const x=rand()*92-46,z=5+rand()*72;if(Math.abs(x-12)<14&&Math.abs(z-25)<15||Math.abs(x)<16&&z<10)continue;const stone=B.MeshBuilder.CreatePolyhedron('apron-stone',{type:1,size:.12+rand()*.55},scene);add(stone,rock,[x,.08,z]);stone.scaling.y=.5;}
  // Landing apron and maintained, older Kestrel. A single hook owns its replacement.
  box('landing-pad',[22,.12,24],[12,-.005,25],floorMat);for(const x of [2,22])for(let z=16;z<36;z+=3)box('pad-stripe',[.18,.025,1.8],[x,.07,z],rust);
  const ship=hook('kestrel',[12,1.8,25],()=>{const n=shipModel('starter','friendly',parent);n.position.set(12,2,25);n.scaling.set(2.4,2.4,2.8);n.rotation.y=Math.PI+.4;return n;});
  for(const x of [8.5,15.5])for(const z of [21,29]){cylinder('landing-leg',.1,1.5,[x,.78,z]);bevel('landing-foot',[.75,.12,1],[x,.1,z],dark);}
  for(let i=0;i<5;i++)bevel('boarding-step',[2,.14,.55],[5.5+i*.3,.13+i*.22,24],steel);
  for(const x of [-3,2])cylinder('sign-hanger',.015,.6,[x,5.5,.86],steel);
  sign('workshop-name','WARD REPAIR / INDEPENDENT',[-.8,4.8,.86],7,.8,'#dbbf85');
  cylinder('fuel-drum',1.8,2.2,[-22,1.10,14],paint, parent,16);cylinder('fuel-cap',.5,.15,[-22,2.27,14],steel);tube('fuel-hose',[[-22,.08,16],[-18,.08,20],[-16,.08,23]],.09);
  // Frontier village: a small lived-in cluster linked to the repair shop by a worn dirt road.
  const roadMat=mat('compacted-earth','#8c6b51',1,0),habitat=mat('habitat-shell','#a8a092',.88,.12),habitatTrim=mat('habitat-trim','#4d5959',.62,.36),shadeCloth=mat('shade-canvas','#8c745d',.98,0),amber=mat('village-amber','#d29a56',.55,.1,'#b06627');
  roadMat.albedoTexture=texture('compacted-road','soil','#a18468');roadMat.albedoColor.set(.88,.78,.68);roadMat.albedoTexture.uScale=8;roadMat.albedoTexture.vScale=3;
  habitat.albedoTexture=panelAlbedo;habitat.bumpTexture=panelNormal;habitat.albedoColor.set(1,1,1);
  function road(name,points,width){const left=[],right=[];for(let i=0;i<points.length;i++){const p=points[i],prev=points[Math.max(0,i-1)],next=points[Math.min(points.length-1,i+1)],dx=next[0]-prev[0],dz=next[1]-prev[1],len=Math.hypot(dx,dz)||1;left.push(v(p[0]-dz/len*width/2,.015,p[1]+dx/len*width/2));right.push(v(p[0]+dz/len*width/2,.015,p[1]-dx/len*width/2));}
   const strip=B.MeshBuilder.CreateRibbon(name,{pathArray:[left,right],sideOrientation:B.Mesh.DOUBLESIDE,updatable:false},scene);add(strip,roadMat,[0,0,0],parent,false);strip.receiveShadows=false;
   for(const side of [-1,1])for(let i=0;i<points.length-1;i++){const a=points[i],b=points[i+1],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz)||1,ox=-dz/len*width*.34*side,oz=dx/len*width*.34*side;tube('worn-wheel-track',[[a[0]+ox,.034,a[1]+oz],[b[0]+ox,.034,b[1]+oz]],.025,dark);}
  }
  road('shop-to-village-dirt-road',[[-14,5],[-25,7],[-34,14],[-40,27],[-44,36],[-49,45],[-55,53],[-65,58]],8);
  road('village-side-path',[[-45,35],[-53,32],[-61,28],[-67,21]],4);
  road('village-habitat-path',[[-52,47],[-43,52],[-37,59]],3.6);
  function awning(name,x,z,width,depth,color=shadeCloth,owner=parent){const roof=box(name,[width,.085,depth],[x,3.2,z],color,owner,false);roof.rotation.z=.045;for(const side of [-1,1])cylinder(name+'-post',.055,3.1,[x+side*(width/2-.15),1.55,z+depth/2-.12],steel,owner,8,false);for(let i=0;i<4;i++)box(name+'-rib',[width,.035,.045],[x,3.15,z-depth/2+i*depth/3],habitatTrim,owner,false);}
  function mergeModule(n){const pos=n.position.clone(),yaw=n.rotation.y;n.position.set(0,0,0);n.rotation.y=0;n.computeWorldMatrix(true);const groups=new Map();for(const mesh of n.getChildMeshes(true)){if(mesh.parent!==n||!mesh.material)continue;const group=groups.get(mesh.material)||[];group.push(mesh);groups.set(mesh.material,group);}for(const meshes of groups.values())if(meshes.length>1){const merged=B.Mesh.MergeMeshes(meshes,true,true,undefined,false,false);if(merged){merged.parent=n;merged.isPickable=false;merged.receiveShadows=true;}}n.position.copyFrom(pos);n.rotation.y=yaw;}
  function hut(id,x,z,yaw,variant){const n=new B.TransformNode('vesper-habitat-'+id,scene);n.parent=parent;n.position.set(x,0,z);n.rotation.y=yaw;
   const width=variant===2?9:7.5,depth=variant===1?8:6.5;
   bevel('habitat-plinth',[width+.6,.25,depth+.6],[0,.08,0],floorMat,n,.08,false);
   bevel('habitat-body',[width,3.5,depth],[0,1.9,0],habitat,n,.18,false);
   for(const side of [-1,1]){bevel('habitat-end-rib',[.26,3.7,.35],[side*(width/2-.18),1.95,depth/2-.16],habitatTrim,n,.05,false);box('habitat-window-frame',[1.4,.94,.17],[side*(width/2-.78),2.25,depth/2+.06],habitatTrim,n,false);box('habitat-window',[1.13,.68,.035],[side*(width/2-.78),2.25,depth/2+.16],blue,n,false);}
   bevel('habitat-roof',[width+.7,.32,depth+.8],[0,3.75,0],paint,n,.12,false);
   for(const side of [-1,1])bevel('habitat-roof-rail',[.12,.2,depth+.45],[side*(width/2+.25),3.94,0],habitatTrim,n,.02,false);
   bevel('habitat-door-frame',[1.72,2.6,.21],[0,1.45,depth/2+.05],habitatTrim,n,.06,false);bevel('habitat-door',[1.30,2.28,.09],[0,1.43,depth/2+.19],steel,n,.04,false);box('habitat-door-light',[.05,.5,.13],[.46,1.8,depth/2+.28],warm,n,false);
   for(let i=0;i<3;i++)bevel('habitat-vent',[.62,.10,.25],[-width/2+.7+i*.75,3.95,-depth/2+.8],habitatTrim,n,.02,false);
   const tank=cylinder('habitat-water-tank',.55,1.3,[width/2+.9,.68,-depth/4],paint,n,10,false);tank.rotation.z=.02;
   if(variant!==1){const shade=box('habitat-porch-shade',[width*.55,.08,2.5],[0,3.1,depth/2+1.38],shadeCloth,n,false);shade.rotation.x=-.13;for(const side of [-1,1])cylinder('porch-pole',.045,2.9,[side*width*.25,1.45,depth/2+2.48],steel,n,8,false);}
   mergeModule(n);return n;
  }
  hut('east',-36,46,2.75,0);hut('north',-38,65,2.45,1);hut('west',-66,17,1.85,2);hut('ridge',-65,65,2.55,0);
  function commerce(kind,x,z,yaw){const n=new B.TransformNode('vesper-'+kind,scene);n.parent=parent;n.position.set(x,0,z);n.rotation.y=yaw;const isBar=kind==='bar',w=isBar?11:10;
   bevel(kind+'-foundation',[w+1,.22,9.5],[0,.08,0],floorMat,n,.08,false);bevel(kind+'-shell',[w,4.3,8.5],[0,2.25,0],habitat,n,.16,false);bevel(kind+'-roof',[w+1,.45,9.3],[0,4.65,0],steel,n,.10,false);
   for(const side of [-1,1]){bevel(kind+'-corner',[.30,4.5,.32],[side*(w/2-.16),2.25,4.18],habitatTrim,n,.07,false);box(kind+'-window-frame',[1.9,1.25,.18],[side*3.08,2.7,4.32],habitatTrim,n,false);box(kind+'-window',[1.55,.91,.05],[side*3.08,2.7,4.43],isBar?amber:blue,n,false);}
   bevel(kind+'-door-frame',[2.35,3.25,.23],[0,1.66,4.31],habitatTrim,n,.06,false);bevel(kind+'-door',[1.9,2.83,.08],[0,1.55,4.46],dark,n,.05,false);
   awning(kind+'-awning',0,6.6,w+1,3,isBar?shadeCloth:paint,n);
   sign(kind+'-sign',isBar?'THE DUST BAR':'FRONTIER SUPPLY',[0,4.08,4.55],isBar?5.2:6.4,.68,isBar?'#efc187':'#a7d3c2',n).rotation.y=Math.PI;
   if(isBar){for(const side of [-1,1]){cylinder('bar-patio-table',.60,.14,[side*3,.8,7.0],steel,n,10,false);cylinder('bar-table-post',.055,.76,[side*3,.38,7],steel,n,8,false);for(const off of [-.85,.85])cylinder('bar-stool',.26,.45,[side*3+off,.23,7],rust,n,8,false);}}else for(let i=0;i<4;i++){bevel('store-cargo-crate',[.9,.7,.82],[-4.2+i*1.2,.37,7.3],i%2?paint:rust,n,.06,false);}
   mergeModule(n);return n;
  }
  commerce('store',-50,23,2.12);commerce('bar',-62,41,2.20);
  for(const [x,z] of [[-29,27],[-44,29],[-55,48],[-68,54]]){cylinder('village-comms-pole',.065,8.5,[x,4.25,z],steel);box('utility-crossarm',[2.1,.10,.12],[x,7.3,z],paint);for(const side of [-1,1]){cylinder('insulator',.11,.22,[x+side*.85,7.4,z],dark);box('lamp-head',[.50,.14,.35],[x+side*.85,5.3,z],warm);}bevel('pole-control-box',[.65,.84,.4],[x,.95,z],habitatTrim);}
  for(const [x,z] of [[-24,8],[-31,12],[-47,51],[-70,35]]){cylinder('storage-drum',.33,.9,[x,.45,z],rust);bevel('utility-case',[1.0,.58,.8],[x+1.1,.30,z+.5],paint);}
  if(!low)for(const [x,z] of [[-30,30],[-52,15],[-70,45],[-48,63]])for(let i=0;i<7;i++){const pebble=B.MeshBuilder.CreatePolyhedron('village-rock',{type:1,size:.12+rand()*.38},scene);add(pebble,rock,[x+rand()*5,.03,z+rand()*5]);pebble.scaling.y=.46;}
  const scrub=mat('desert-scrub','#625f43',1,0);
  for(let i=0;i<(low?32:88);i++){const x=-70+rand()*72,z=9+rand()*65;if(Math.abs(x+48)<12&&z>17&&z<50||Math.abs(x-12)<15&&z<38)continue;const clump=add(B.MeshBuilder.CreatePolyhedron('desert-scrub',{type:1,size:.18+rand()*.22},scene),scrub,[x,.10,z]);clump.scaling.set(.65,.35,1.2);clump.rotation.y=rand()*6.28;}
  // The exterior shell shares the interior frame, but gains a visible working facade.
  for(const side of [-1,1]){for(const z of [-18,-10,-2]){bevel('shop-exterior-rib',[.40,6.2,.55],[side*13.34,3.1,z],steel);box('shop-exterior-wall-band',[.12,.20,6],[side*13.25,4.9,z+1.3],rust);box('shop-exterior-lower-rail',[.17,.34,6],[side*13.24,.55,z+1.3],dark);}cylinder('shop-roof-antenna',.07,5,[side*10,8.65,-17],steel);box('shop-roof-aerial',[2.2,.07,.07],[side*10,10.8,-17],steel);}
  for(const x of [-11,-6,6,11]){bevel('garage-header-bracket',[.65,.36,.55],[x,5.9,1.15],steel);box('garage-threshold-warning',[.45,.025,.65],[x,.08,1.46],warning);}
  for(const [x,z] of [[-18,-9],[-20,-1],[-17,7]]){bevel('outdoor-parts-case',[1.7,1.2,1.1],[x,.62,z],paint);bevel('outdoor-parts-lid',[1.78,.16,1.16],[x,1.27,z],steel);}
  // Shooting lane faces away from settlement and landing pad, into a dirt backstop.
  const berm=B.MeshBuilder.CreateCylinder('range-berm',{height:7,diameterTop:4,diameterBottom:12,tessellation:8},scene);add(berm,rock,[47,2,-8]);berm.scaling.z=2.8;
  bevel('target-shelf',[1,.2,14],[39,1.02,-8],steel);for(const z of [-14,-2])bevel('rack-leg',[.16,1,.16],[39,.5,z],rust);
  for(const def of VoidOpening.cans){const node=new B.TransformNode('can-'+def.id,scene);node.parent=parent;node.position.set(...def.position);const body=cylinder('can-body-'+def.id,.14,.44,[0,0,0],def.id%2?paint:rust,node,12,false);body.isPickable=true;body.metadata={canId:def.id};cylinder('can-rim',.145,.025,[0,.23,0],steel,node,12,false);cylinder('can-rim',.145,.025,[0,-.23,0],steel,node,12,false);canNodes.push({id:def.id,node,body,velocity:null,spin:0,base:def.position.slice()});if(state.progression.opening?.cans.includes(def.id)){node.position.y=.2;node.rotation.z=1.3;body.isPickable=false;}}
  sign('range-note','KEEP FIRE TOWARD BERM',[36,1.5,-16],3,.55,'#c6b480').rotation.y=-Math.PI/2;
  // Mara is the only person here. Rounded primitives improve the interim silhouette.
  const mara=hook('mara',[7,0,-5],()=>{
   const n=new B.TransformNode('mara-visual',scene);n.parent=parent;n.position.set(7,0,-5);
   const jacket=mat('mara-jacket','#485c5b',.91,.08),jacketLight=mat('mara-seam','#72827b',.82,.09),trousers=mat('mara-trousers','#303b3b',.94,.04),skin=mat('mara-skin','#aa826c',.87,0),hair=mat('mara-hair','#c1c2b7',.92,0),boots=mat('mara-boots','#292e30',.9,.08),eye=mat('mara-eye','#222c30',.7,.05);
   bevel('mara-coat-body',[.58,.72,.35],[0,1.16,0],jacket,n,.09,false);
   bevel('mara-coat-hem',[.63,.30,.39],[0,.76,-.01],jacket,n,.08,false);
   for(const side of [-1,1]){
    const leg=cylinder('mara-trouser',.135,.76,[side*.16,.42,0],trousers,n,10,false);leg.rotation.z=side*.035;
    bevel('mara-boot',[.25,.20,.40],[side*.16,.11,.09],boots,n,.04,false);
    const sleeve=cylinder('mara-sleeve',.12,.61,[side*.405,1.20,0],jacket,n,10,false);sleeve.rotation.z=side*.20;
    cylinder('mara-cuff',.125,.09,[side*.48,.88,0],jacketLight,n,10,false);
    add(B.MeshBuilder.CreateSphere('mara-hand',{diameter:.18,segments:10},scene),skin,[side*.49,.79,.025],n,false);
    bevel('mara-lapel',[.18,.47,.055],[side*.15,1.36,.205],jacketLight,n,.025,false);
    box('mara-brow',[.115,.035,.038],[side*.093,1.77,.197],hair,n,false);
    add(B.MeshBuilder.CreateSphere('mara-eye',{diameter:.045,segments:8},scene),eye,[side*.095,1.735,.205],n,false);
    box('mara-work-pocket',[.18,.17,.06],[side*.17,1.07,.20],jacketLight,n,false);
   }
   cylinder('mara-neck',.12,.20,[0,1.56,0],skin,n,10,false);
   const head=add(B.MeshBuilder.CreateSphere('mara-head',{diameter:.42,segments:18},scene),skin,[0,1.75,0],n,false);head.scaling.set(.92,1.13,.89);
   bevel('mara-nose',[.075,.12,.09],[0,1.70,.205],skin,n,.018,false);
   const cap=add(B.MeshBuilder.CreateSphere('mara-silver-hair',{diameter:.46,segments:18},scene),hair,[0,1.91,-.047],n,false);cap.scaling.set(1.07,.45,.91);
   for(const side of [-1,1]){const lock=add(B.MeshBuilder.CreateSphere('mara-hair-lock',{diameter:.16,segments:10},scene),hair,[side*.19,1.78,-.02],n,false);lock.scaling.y=2.1;}
   box('mara-tool-belt',[.59,.085,.38],[0,.91,0],boots,n,false);
   bevel('mara-tool-pouch',[.19,.31,.23],[.39,.78,-.09],rust,n,.04,false);
   box('mara-jacket-patch',[.15,.08,.02],[-.19,1.40,.235],warning,n,false);
   for(const side of [-1,1]){bevel('mara-shoulder-pad',[.25,.18,.38],[side*.34,1.47,-.005],jacketLight,n,.055,false);add(B.MeshBuilder.CreateSphere('mara-ear',{diameter:.11,segments:8},scene),skin,[side*.205,1.70,0],n,false);}
   bevel('mara-collar',[.46,.13,.40],[0,1.51,0],jacketLight,n,.035,false);
   box('mara-jacket-zipper',[.025,.48,.02],[0,1.16,.222],boots,n,false);
   box('mara-mouth',[.12,.018,.015],[0,1.59,.195],boots,n,false);
   for(const side of [-1,1])box('mara-cheek',[.06,.014,.015],[side*.11,1.62,.18],jacketLight,n,false);
   return n;
  });mara.rotation.y=Math.PI;
  const maraCue=B.MeshBuilder.CreateTorus('mara-conversation-locus',{diameter:1.8,thickness:.017,tessellation:24},scene);add(maraCue,blue,[0,.05,0],mara,false);maraCue.isPickable=false;
  // Elias is a cyan bust projection above a case, never a physical character actor.
  bevel('projector-case',[1.8,.8,1.2],[-6,.43,-3],rust);bevel('projector-top',[1.9,.12,1.25],[-6,.9,-3],steel);sign('archive-label','ELIAS WARD / RECORDING',[-6,.68,-2.37],1.5,.28,'#77c6dc');
  // One transparent, depth-safe projection material can be reused by other archived figures.
  const holoMaterial=new B.ShaderMaterial('elias-projection',scene,{
   vertexSource:'precision highp float;attribute vec3 position;attribute vec3 normal;uniform mat4 worldViewProjection;uniform mat4 world;varying vec3 p;varying vec3 n;void main(){p=(world*vec4(position,1.)).xyz;n=normalize(mat3(world)*normal);gl_Position=worldViewProjection*vec4(position,1.);}',
   fragmentSource:'precision highp float;varying vec3 p;varying vec3 n;uniform vec3 cameraPosition;uniform float time;void main(){float facing=abs(dot(normalize(n),normalize(cameraPosition-p)));float edge=pow(1.-facing,1.6);float scan=.78+.22*sin(p.y*125.+time*2.2);float shimmer=.96+.04*sin(time*13.+p.x*8.);vec3 color=mix(vec3(.12,.53,.80),vec3(.43,.87,1.),edge);float alpha=(.32+.30*edge)*scan*shimmer;gl_FragColor=vec4(color*(.86+.14*scan),alpha);}',
  },{attributes:['position','normal'],uniforms:['worldViewProjection','world','cameraPosition','time'],needAlphaBlending:true});
  owned.push(holoMaterial);holoMaterial.backFaceCulling=false;holoMaterial.disableDepthWrite=true;
  const hologram=hook('elias',[-6,1.1,-3],()=>{
   const n=new B.TransformNode('elias-hologram',scene);n.parent=parent;n.position.set(-6,1.1,-3);
   const bust=add(B.MeshBuilder.CreateSphere('projection-shoulders',{diameter:1,segments:16},scene),holoMaterial,[0,.25,0],n,false);bust.scaling.set(.76,.48,.37);
   bevel('projection-chest',[.65,.37,.23],[0,.31,.12],holoMaterial,n,.09,false);
   for(const side of [-1,1])bevel('projection-lapel',[.17,.30,.045],[side*.14,.40,.245],holoMaterial,n,.03,false);
   const neck=add(B.MeshBuilder.CreateCylinder('projection-neck',{height:.18,diameter:.24,tessellation:12},scene),holoMaterial,[0,.57,0],n,false);
   const head=add(B.MeshBuilder.CreateSphere('projection-head',{diameter:.43,segments:20},scene),holoMaterial,[0,.81,0],n,false);head.scaling.set(1,1.18,.94);
   const hair=add(B.MeshBuilder.CreateSphere('projection-hair',{diameter:.45,segments:16},scene),holoMaterial,[0,1.005,-.025],n,false);hair.scaling.set(1.07,.35,.92);
   const beard=add(B.MeshBuilder.CreateSphere('projection-beard',{diameter:.29,segments:16},scene),holoMaterial,[0,.65,.105],n,false);beard.scaling.set(.85,.64,.55);
   for(const side of [-1,1]){bevel('projection-brow',[.15,.03,.045],[side*.11,.88,.19],holoMaterial,n,.015,false);bevel('projection-eye',[.06,.025,.028],[side*.1,.83,.212],holoMaterial,n,.01,false);}
   bevel('projection-nose',[.06,.12,.07],[0,.78,.225],holoMaterial,n,.02,false);
   return n;
  });
  hologram.rotation.y=Math.PI;hologram.scaling.x=hologram.scaling.z=1.13;
  for(const mesh of hologram.getChildMeshes()){mesh.material=holoMaterial;mesh.isPickable=false;mesh.receiveShadows=false;}
  const projectorRing=B.MeshBuilder.CreateTorus('projection-emitter',{diameter:.72,thickness:.025,tessellation:24},scene);add(projectorRing,blue,[-6,.99,-3],parent,false);
  const projectionHalo=B.MeshBuilder.CreateTorus('projection-boundary',{diameter:1.65,thickness:.014,tessellation:32},scene);add(projectionHalo,blue,[-6,.052,-3],parent,false);
  const boardCue=B.MeshBuilder.CreateTorus('kestrel-boarding-locus',{diameter:1.6,thickness:.02,tessellation:24},scene);add(boardCue,warm,[5.4,.06,24],parent,false);
  sign('kestrel-boarding-label','KESTREL / BOARD',[5.4,.75,22.7],2.2,.35,'#d4bd87');
  // Merge repeated static scenery by material; dynamic actors/targets stay independent.
  for(const m of Object.values(mats)){const batch=staticMeshes.filter(mesh=>mesh.material===m&&mesh.parent===parent&&Math.hypot(mesh.position.x,mesh.position.z)<80);if(batch.length>1){const merged=B.Mesh.MergeMeshes(batch,true,true,undefined,false,false);if(merged){merged.parent=parent;merged.receiveShadows=true;merged.isPickable=false;}}}
  let shadow;const noShadowMaterials=new Set([inset,seam,warning,warm,blue,roadMat,habitat,habitatTrim,shadeCloth,amber,scrub,rock]);if(!low){shadow=new B.ShadowGenerator(quality==='high'?2048:1024,shadowLight);shadow.usePercentageCloserFiltering=true;shadow.filteringQuality=B.ShadowGenerator.QUALITY_LOW;shadow.bias=.003;shadow.normalBias=.08;shadowLight.autoCalcShadowZBounds=false;for(const mesh of parent.getChildMeshes())if(mesh!==ground&&mesh!==dome&&mesh.material!==holoMaterial&&mesh!==moon&&!noShadowMaterials.has(mesh.material)&&!/^vesper-(habitat|store|bar)/.test(mesh.parent?.name||'')&&(mesh.parent!==mara||['mara-coat-body','mara-trouser','mara-head'].includes(mesh.name))&&Math.hypot(mesh.getAbsolutePosition().x,mesh.getAbsolutePosition().z)<55&&mesh.getTotalVertices()>0)shadow.addShadowCaster(mesh,false);}
  const dust=new B.ParticleSystem('workshop-dust',low?24:60,scene);const dot=new B.DynamicTexture('dust-dot',16,scene,false);textures.push(dot);let dc=dot.getContext();dc.clearRect(0,0,16,16);const grad=dc.createRadialGradient(8,8,0,8,8,8);grad.addColorStop(0,'#fff');grad.addColorStop(1,'rgba(255,255,255,0)');dc.fillStyle=grad;dc.fillRect(0,0,16,16);dot.update();dust.particleTexture=dot;dust.emitter=v(0,1,2);dust.minEmitBox=v(-14,0,-10);dust.maxEmitBox=v(14,4,16);dust.color1=new B.Color4(.8,.65,.42,.09);dust.color2=new B.Color4(.9,.8,.6,.04);dust.colorDead=new B.Color4(.9,.8,.6,0);dust.minSize=.035;dust.maxSize=.09;dust.minLifeTime=5;dust.maxLifeTime=10;dust.emitRate=low?2:5;dust.direction1=v(.1,.01,.03);dust.direction2=v(.25,.05,.08);dust.minEmitPower=.1;dust.maxEmitPower=.3;dust.gravity=v(0,0,0);dust.start();
  const weaponRoot=new B.TransformNode('ward-first-person',scene);weaponRoot.parent=camera;
  const importedPistol=VoidAssets.instance('opening:pistol',weaponRoot);
  if(!importedPistol){bevel('pistol-slide',[.065,.085,.29],[0,0,0],steel,weaponRoot,.012,false);bevel('pistol-grip',[.058,.14,.08],[0,-.085,-.07],dark,weaponRoot,.014,false);bevel('pistol-front-sight',[.012,.014,.018],[0,.048,.12],rust,weaponRoot,.004,false);bevel('pistol-rear-sight',[.06,.02,.022],[0,.05,-.105],dark,weaponRoot,.005,false);}
  for(const mesh of weaponRoot.getChildMeshes()){mesh.renderingGroupId=1;mesh.isPickable=false;mesh.receiveShadows=false;}weaponRoot.setEnabled(false);
  let leadIndex=state.progression.opening?.pistol?3:-1;const route=[[7,0,4],[20,0,4],[24,0,-8]];
  if(leadIndex===3)mara.position.set(24,0,-8);
  let lastTime=null;const handle={root:parent,mara,hologram,canNodes,ship,
   lead(){leadIndex=0;},
   weapon(drawn,aim,reloading){weaponRoot.setEnabled(drawn);weaponRoot.position.set(aim?0:.21,reloading?-.40:aim?-.07:-.23,aim?.5:.55);weaponRoot.rotation.set(reloading?.65:0,0,reloading?.4:0);camera.metadata={...camera.metadata,openingAim:aim};},
   hit(id,direction){const can=canNodes.find(c=>c.id===id);if(!can||can.velocity)return;can.velocity=v(direction.x*2.6,1.8,direction.z*2.6);can.spin=6;can.body.isPickable=false;},
   tick(time){const dt=lastTime===null?0:Math.min(.05,Math.max(0,time-lastTime));lastTime=time;if(leadIndex>=0&&leadIndex<route.length){const target=v(...route[leadIndex]),delta=target.subtract(mara.position),distance=delta.length();if(distance<.12)leadIndex++;else if(B.Vector3.Distance(camera.position,mara.position)<16){mara.position.addInPlace(delta.scale(Math.min(distance,dt*1.6)/distance));mara.rotation.y=Math.atan2(delta.x,delta.z);}}
    holoMaterial.setFloat('time',time);holoMaterial.setVector3('cameraPosition',camera.position);hologram.scaling.y=1.14+Math.sin(time*19)*.004;for(const c of canNodes)if(c.velocity){c.velocity.y-=9.8*dt;c.node.position.addInPlace(c.velocity.scale(dt));c.node.rotation.z+=c.spin*dt;c.node.rotation.x+=c.spin*.4*dt;if(c.node.position.y<.15){c.node.position.y=.15;c.velocity.y=Math.abs(c.velocity.y)*.18;c.velocity.x*=Math.exp(-7*dt);c.velocity.z*=Math.exp(-7*dt);c.spin*=Math.exp(-5*dt);if(Math.hypot(c.velocity.x,c.velocity.z)<.04&&c.velocity.y<.3)c.velocity=null;}}},
   dispose(){weaponRoot.dispose();shadow?.dispose();dust.dispose();for(const t of textures)t.dispose();for(const m of owned)m.dispose(false,false);scene.fogMode=B.Scene.FOGMODE_NONE;scene.imageProcessingConfiguration.toneMappingEnabled=false;scene.imageProcessingConfiguration.exposure=1;scene.imageProcessingConfiguration.contrast=1;scene.ambientColor=B.Color3.Black();if(hemi){hemi.intensity=.48;hemi.diffuse=B.Color3.White();hemi.groundColor=new B.Color3(.12,.15,.21);}shadowLight.autoUpdateExtends=true;shadowLight.orthoLeft=shadowLight.orthoRight=shadowLight.orthoTop=shadowLight.orthoBottom=null;shadowLight.position=v(0,0,0);shadowLight.intensity=1.5;shadowLight.diffuse=B.Color3.White();shadowLight.direction=v(.6,-.7,.4);}
  };return handle;
 }
 root.VoidOpeningScene={build};
})(globalThis);
