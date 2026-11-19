/* THE BLACKROCK CULT ROOM in 3D (browser only; cult-room.js has the room's measures and the timeline). Built in its OWN Babylon scene on the game's engine, only while a
   camera feed shows it (camera-feed.js), and disposed afterwards: the player's world is untouched and nothing of it lights or fogs this room.
   THE ROOM (art direction "PERMANENT DIRECTION": dark, controlled light, believable structure): 14 m square, 7 m high (two storeys) in the basement of a corporate tower.
   Board-formed concrete walls with pilasters and a ring beam, an exposed ceiling (beams, a ventilation duct, pipe runs, a cable tray), stained floor slab with a drain,
   conduit and junction boxes. The owl (the owner's own art, art/blackrock/owl-stencil.webp) is a weathered stencil on the far wall, lit by a hidden wash; under it a black
   stone altar with candles and a small lacquered box holding a paper card. One steel sliding door centred on the near wall; behind it a short dim service corridor with
   a caged wall light (only so the open door never shows empty space; nobody walks it but the figures).
   Lights (8 at most, the art direction's limit): the owl wash, a cool pool over the circle, the candles (flicker), the corridor lamp, a bulkhead over the door, a fill.
   FIGURES: npc-blackrock-robe.glb (Meshy, 24-joint rig) seven times: six robed figures (heights 0.96 to 1.05, the hood a little wider or narrower) and the initiate (the
   same robe). Every frame, cult-room.js poseAt() gives each figure its place, heading and clip; the clip frame is set from the timeline time (no drift; a faster test
   run stays in step). Changing clip blends over 0.35 s. The walk is played at speed / 1.2 m/s so the feet keep to the floor. */
(function(root){
 'use strict';
 const base=typeof document!=='undefined'&&document.currentScript?new URL('.',document.currentScript.src):null;
 const url=p=>base?new URL(p,base).href:p;
 const MODEL='npc-blackrock-robe.glb';
 const VAR=[{s:1,hw:1},{s:1.03,hw:1.06},{s:.97,hw:.95},{s:1.05,hw:1.02},{s:.96,hw:1.08},{s:1.01,hw:.97},{s:.99,hw:1.04}];   // initiate, robed-1..6: height, hood width
 function create(engine,opts={}){
  const B=root.BABYLON,C=root.VoidCultRoom,R=C.ROOM,S=R.size/2,H=R.height,low=opts.quality==='low';
  const scene=new B.Scene(engine);scene.clearColor=new B.Color4(.004,.004,.005,1);scene.ambientColor=new B.Color3(.02,.02,.022);scene.skipPointerMovePicking=true;
  scene.fogMode=B.Scene.FOGMODE_EXP2;scene.fogDensity=.028;scene.fogColor=new B.Color3(.012,.012,.014);
  const ip=scene.imageProcessingConfiguration;ip.exposure=1.25;ip.contrast=1.35;ip.toneMappingEnabled=true;ip.vignetteEnabled=true;ip.vignetteWeight=2.2;ip.vignetteColor=new B.Color4(0,0,0,0);
  ip.colorCurvesEnabled=true;const cc=new B.ColorCurves();cc.globalSaturation=-38;cc.shadowsHue=200;cc.shadowsDensity=18;cc.shadowsSaturation=30;ip.colorCurves=cc;   // security-camera colour: muted, cold shadows
  const own=[];let seed=11;const rand=()=>((seed=seed*16807%2147483647)-1)/2147483646;
  // ---- materials ----
  const texCache=new Map(),T=f=>{if(texCache.has(f))return texCache.get(f);const t=new B.Texture(url('assets/textures/'+f),scene,false,true);t.wrapU=t.wrapV=B.Texture.WRAP_ADDRESSMODE;own.push(t);texCache.set(f,t);return t;};
  const mats={};
  function P(key,{c='#808080',tex=null,nrm=null,tile=2,rough=.85,metal=0,em=null,alpha=1,dyn=null,nrmLevel=.8}={}){if(mats[key])return mats[key];const m=new B.PBRMaterial('cult-'+key,scene);
   m.albedoColor=B.Color3.FromHexString(c);m.roughness=rough;m.metallic=metal;m.usePhysicalLightFalloff=false;m.environmentIntensity=0;m.directIntensity=1.25;m.maxSimultaneousLights=8;
   if(tex)m.albedoTexture=T(tex);if(dyn)m.albedoTexture=dyn;if(nrm&&!low){m.bumpTexture=T(nrm);m.bumpTexture.level=nrmLevel;}if(em)m.emissiveColor=B.Color3.FromHexString(em);if(alpha<1){m.alpha=alpha;m.transparencyMode=2;}
   m.metadata={tile};own.push(m);return mats[key]=m;}
  const unlit=(key,c,dyn)=>{if(mats[key])return mats[key];const m=new B.StandardMaterial('cult-'+key,scene);m.disableLighting=true;m.diffuseColor=B.Color3.Black();m.specularColor=B.Color3.Black();if(dyn){m.emissiveTexture=dyn;m.emissiveColor=B.Color3.Black();}else m.emissiveColor=B.Color3.FromHexString(c);m.fogEnabled=false;own.push(m);return mats[key]=m;};
  const canvas=(w,h,draw,name)=>{const t=new B.DynamicTexture('cult-'+name,{width:w,height:h},scene,true);own.push(t);draw(t.getContext(),w,h);t.update();t.wrapU=t.wrapV=B.Texture.WRAP_ADDRESSMODE;return t;};
  // board-formed concrete: the horizontal form lines and tie holes, stains running down from the ring beam
  const boards=canvas(512,512,(g,w,h)=>{g.fillStyle='#8a8a86';g.fillRect(0,0,w,h);for(let i=0;i<2600;i++){const v=110+rand()*40|0;g.fillStyle='rgba('+v+','+v+','+(v-4)+','+(.05+rand()*.08)+')';g.fillRect(rand()*w,rand()*h,2+rand()*14,1+rand()*5);}
   for(let y=0;y<h;y+=64){g.fillStyle='rgba(40,40,38,.35)';g.fillRect(0,y,w,2);g.fillStyle='rgba(255,255,255,.05)';g.fillRect(0,y+2,w,1);for(let x=40;x<w;x+=128){g.fillStyle='rgba(30,30,28,.55)';g.beginPath();g.arc(x+(y/64%2)*64,y+32,4,0,7);g.fill();}}
   for(let i=0;i<26;i++){const x=rand()*w,l=60+rand()*300,gr=g.createLinearGradient(0,0,0,l);gr.addColorStop(0,'rgba(30,28,24,.32)');gr.addColorStop(1,'rgba(30,28,24,0)');g.fillStyle=gr;g.fillRect(x,0,3+rand()*10,l);}},'boards');
  const M={
   floor:P('floor',{c:'#6e6c66',tex:'ncz/concrete-old-color.jpg',nrm:'ncz/concrete-old-normal.jpg',tile:3,rough:.78,nrmLevel:.6}),
   wall:P('wall',{c:'#9a9890',dyn:boards,nrm:'ncz/concrete-mold-normal.jpg',tile:3.2,rough:.93,nrmLevel:.5}),
   col:P('col',{c:'#7e7c76',tex:'ncz/concrete-mold-color.jpg',nrm:'ncz/concrete-mold-normal.jpg',tile:2.4,rough:.92}),
   ceil:P('ceil',{c:'#3e3e3c',tex:'district-interior/kit_concrete_color.jpg',tile:3,rough:.95}),
   steel:P('steel',{c:'#7a8088',tex:'district-interior/kit_steel_color.jpg',nrm:'district-interior/kit_steel_normal.jpg',tile:1.2,rough:.42,metal:.85}),
   gun:P('gun',{c:'#4a5058',tex:'district-interior/kit_gunmetal_color.jpg',nrm:'district-interior/kit_gunmetal_normal.jpg',tile:1.2,rough:.5,metal:.75}),
   rust:P('rust',{c:'#6a5a4a',tex:'ncz/metal-leaks-color.jpg',nrm:'ncz/metal-leaks-normal.jpg',tile:1.4,rough:.6,metal:.55}),
   stone:P('stone',{c:'#1a1a1c',tex:'district-interior/kit_concrete_color.jpg',tile:1.2,rough:.38,metal:.05}),
   cloth:P('cloth',{c:'#0c0c0d',tex:'district-interior/kit_canvas_color.jpg',nrm:'district-interior/kit_canvas_normal.jpg',tile:.6,rough:1}),
   lacquer:P('lacquer',{c:'#140c0a',rough:.22,metal:.1}),brass:P('brass',{c:'#8a6a3a',rough:.35,metal:.9}),paper:P('paper',{c:'#e4e0d4',rough:.9}),
   wax:P('wax',{c:'#c8bea6',rough:.6,em:'#1a1206'}),dark:P('dark',{c:'#121314',rough:.6,metal:.3}),
   top:P('top',{c:'#4a5058',tex:'district-interior/kit_gunmetal_color.jpg',tile:1.2,rough:.5,metal:.75}),topSteel:P('top-steel',{c:'#7a8088',tex:'district-interior/kit_steel_color.jpg',tile:1.2,rough:.42,metal:.85}),topRust:P('top-rust',{c:'#6a5a4a',tex:'ncz/metal-leaks-color.jpg',tile:1.4,rough:.6,metal:.55}),topCol:P('top-col',{c:'#7e7c76',tex:'ncz/concrete-mold-color.jpg',tile:2.4,rough:.92}),
   lampWarm:unlit('lamp-warm','#ffcf8a'),lampCold:unlit('lamp-cold','#bcd4ff'),flame:unlit('flame','#ffb04a'),red:unlit('exit-red','#a01010')};
  // ---- geometry: static pieces merged per material at the end ----
  const parts=new Map(),rootN=new B.TransformNode('cult-room',scene);
  const add=(m,mat,dyn)=>{m.material=mat;m.isPickable=false;m.parent=rootN;if(dyn)return m;if(!parts.has(mat))parts.set(mat,[]);parts.get(mat).push(m);return m;};
  function bx(mat,[w,h,d],[x,y,z],ry=0,dyn=false){const t=(mat.metadata&&mat.metadata.tile)||1,fu=[[w,h],[w,h],[d,h],[d,h],[w,d],[w,d]].map(([a,b])=>new B.Vector4(0,0,Math.max(.05,a/t),Math.max(.05,b/t)));
   const m=B.MeshBuilder.CreateBox('cult-box',{width:w,height:h,depth:d,faceUV:fu,wrap:true},scene);m.position.set(x,y,z);m.rotation.y=ry;return add(m,mat,dyn);}
  const box2=(mat,x0,x1,y0,y1,z0,z1,dyn)=>bx(mat,[Math.max(.001,x1-x0),Math.max(.001,y1-y0),Math.max(.001,z1-z0)],[(x0+x1)/2,(y0+y1)/2,(z0+z1)/2],0,dyn);
  function cyl(mat,d,h,[x,y,z],{tess=12,rx=0,rz=0,top=null,dyn=false}={}){const m=B.MeshBuilder.CreateCylinder('cult-cyl',{diameterBottom:d,diameterTop:top??d,height:h,tessellation:tess},scene);m.position.set(x,y,z);m.rotation.x=rx;m.rotation.z=rz;return add(m,mat,dyn);}
  const W=.3,dz=R.door,cor=R.corridor;
  // floor slab, ceiling slab
  box2(M.floor,-S-W,S+W,-.2,0,-S-W,S+W);box2(M.ceil,-S-W,S+W,H,H+.3,-S-W,S+W);
  // walls: north, east, west whole; south with the door opening
  box2(M.wall,-S-W,S+W,0,H,S,S+W);box2(M.wall,S,S+W,0,H,-S,S);box2(M.wall,-S-W,-S,0,H,-S,S);
  box2(M.wall,-S-W,-dz.w/2-.12,0,H,-S-W,-S);box2(M.wall,dz.w/2+.12,S+W,0,H,-S-W,-S);box2(M.wall,-dz.w/2-.12,dz.w/2+.12,dz.h+.12,H,-S-W,-S);
  // pilasters every 3.5 m, a ring beam, a plinth
  for(const p of [-3.5,0,3.5]){for(const [x,z,w,d] of [[S-.2,p,.4,.6],[-S+.2,p,.4,.6]])bx(M.col,[w,H,d],[x,H/2,z]);}   // none on the owl's wall, none on the door wall (the camera looks along it)
  for(const [x0,x1,z0,z1] of [[-S,S,S-.5,S],[-S,S,-S,-S+.5],[S-.5,S,-S,S],[-S,-S+.5,-S,S]])box2(M.col,x0,x1,H-.7,H,z0,z1);
  for(const [x0,x1,z0,z1] of [[-S,S,S-.06,S],[S-.06,S,-S,S],[-S,-S+.06,-S,S],[-S,-dz.w/2-.12,-S,-S+.06],[dz.w/2+.12,S,-S,-S+.06]])box2(M.dark,x0,x1,0,.12,z0,z1);
  // the exposed ceiling: two deep beams, a duct with hangers, pipe runs, a cable tray
  for(const x of [-3.5,3.5])box2(M.topCol,x-.25,x+.25,H-.9,H,-S,S);
  box2(M.topSteel,-5.5,-4.5,H-1.5,H-1.0,-S,S);for(let z=-S+1;z<S;z+=2){box2(M.top,-5.55,-4.45,H-1.52,H-1.48,z-.03,z+.03);box2(M.top,-5.02,-4.98,H-1.5,H-.9,z-.02,z+.02);}
  for(let i=0;i<4;i++)cyl(i%2?M.topRust:M.top,.09+i*.03,R.size,[-6.55+i*.24,H-1.85-i*.06,0],{rx:Math.PI/2,tess:10});
  box2(M.top,-1.2,1.2,H-1.35,H-1.3,-S,S);for(let z=-S+.6;z<S;z+=1.2)box2(M.top,-1.2,1.2,H-1.33,H-1.31,z,z+.05);
  // conduit and boxes on the walls, a fire panel, an emergency exit sign over the door
  for(const z of [-4.8,-1.2,2.4]){box2(M.gun,S-.12,S-.02,1.4,1.9,z,z+.35);cyl(M.gun,.04,H-1.9,[S-.07,(H+1.9)/2,z+.17],{tess:6});}
  for(const x of [-6,-2.4,2.4,6])cyl(M.gun,.035,H-.3,[x,H/2,S-.06],{tess:6});
  box2(M.rust,-S+.02,-S+.14,1.2,2.2,3.6,4.4);box2(M.dark,-.45,.45,dz.h+.35,dz.h+.6,-S+.02,-S+.08);bx(M.red,[.8,.18,.01],[0,dz.h+.47,-S+.085]);
  // a floor drain at the centre, under the initiate; sealed cracks
  box2(M.gun,-.25,.25,0,.006,1.2,1.7);for(let i=0;i<5;i++)box2(M.dark,-.24,.24,.007,.009,1.24+i*.1,1.27+i*.1);
  // the door: steel frame, one leaf sliding into the wall (dynamic), a bulkhead lamp over it
  const fr=[[-dz.w/2-.12,-dz.w/2,0,dz.h+.12],[dz.w/2,dz.w/2+.12,0,dz.h+.12],[-dz.w/2,dz.w/2,dz.h,dz.h+.12]];for(const [x0,x1,y0,y1] of fr)box2(M.steel,x0,x1,y0,y1,-S-.04,-S+.06);
  const leaf=box2(M.gun,-dz.w/2,dz.w/2,0,dz.h,-S-.17,-S-.11,true);for(const yy of [.95,1.9])bx(M.steel,[dz.w-.1,.04,.02],[0,yy-1.25,-.04],0,true).parent=leaf;
  bx(M.lampCold,[.36,.12,.08],[0,dz.h+.95,-S+.06]);bx(M.gun,[.42,.04,.12],[0,dz.h+1.02,-S+.06]);
  // the corridor stub behind the door: floor, walls, low ceiling with a pipe, a caged wall light
  const cz0=-S-W,cz1=-S-W-cor.len,cw=cor.w/2;box2(M.floor,-cw-W,cw+W,-.2,0,cz1-W,cz0);box2(M.ceil,-cw-W,cw+W,cor.h,cor.h+.2,cz1-W,cz0);
  box2(M.wall,-cw-W,-cw,0,cor.h,cz1,cz0);box2(M.wall,cw,cw+W,0,cor.h,cz1,cz0);box2(M.wall,-cw-W,cw+W,0,cor.h,cz1-W,cz1);
  cyl(M.rust,.12,cor.len,[cw-.25,cor.h-.25,(cz0+cz1)/2],{rx:Math.PI/2,tess:8});bx(M.lampWarm,[.12,.22,.06],[-cw+.05,1.9,(cz0+cz1)/2-.6]);
  for(let i=0;i<3;i++)bx(M.gun,[.02,.26,.1],[-cw+.07,1.9,(cz0+cz1)/2-.6+(i-1)*.05]);
  // the altar: a black stone block on a plinth, cloth runner, candles, the box (its lid is dynamic: it opens), the card
  const A=R.altar;box2(M.stone,A.x-A.w/2-.15,A.x+A.w/2+.15,0,.12,A.z-A.d/2-.15,A.z+A.d/2+.15);box2(M.stone,A.x-A.w/2,A.x+A.w/2,.12,A.h-.05,A.z-A.d/2,A.z+A.d/2);
  box2(M.stone,A.x-A.w/2-.04,A.x+A.w/2+.04,A.h-.05,A.h,A.z-A.d/2-.04,A.z+A.d/2+.04);box2(M.cloth,A.x-.35,A.x+.35,A.h,A.h+.005,A.z-A.d/2-.06,A.z+A.d/2);box2(M.cloth,A.x-.35,A.x+.35,A.h-.55,A.h,A.z-A.d/2-.065,A.z-A.d/2-.06);
  const flames=[];for(const [cx,n] of [[-1,5],[1,5]])for(let i=0;i<n;i++){const x=A.x+cx*(.75+rand()*.4),z=A.z+(rand()-.5)*.5,h=.08+rand()*.22;cyl(M.wax,.045+rand()*.02,h,[x,A.h+h/2,z],{tess:8});const f=B.MeshBuilder.CreatePlane('cult-flame',{width:.03,height:.06},scene);f.position.set(x,A.h+h+.035,z);f.billboardMode=B.Mesh.BILLBOARDMODE_Y;f.material=M.flame;f.parent=rootN;f.isPickable=false;flames.push(f);}
  const bxD=R.box,boxY=A.h;box2(M.lacquer,A.x-bxD.w/2,A.x+bxD.w/2,boxY,boxY+bxD.h*.8,A.z-bxD.d/2,A.z+bxD.d/2);box2(M.brass,A.x-.02,A.x+.02,boxY+bxD.h*.55,boxY+bxD.h*.72,A.z-bxD.d/2-.005,A.z-bxD.d/2);
  const hinge=new B.TransformNode('cult-lid-hinge',scene);hinge.parent=rootN;hinge.position.set(A.x,boxY+bxD.h*.8,A.z+bxD.d/2);
  const lid=bx(M.lacquer,[bxD.w,bxD.h*.2,bxD.d],[0,bxD.h*.1,-bxD.d/2],0,true);lid.parent=hinge;
  const card=B.MeshBuilder.CreatePlane('cult-card',{width:.09,height:.13,sideOrientation:B.Mesh.DOUBLESIDE},scene);card.material=M.paper;card.isPickable=false;card.parent=rootN;card.position.set(A.x,boxY+bxD.h*.7,A.z);card.rotation.x=Math.PI/2;
  // the owl: the owner's art as a weathered stencil on the far wall (a plane's front faces -z: toward the room)
  const owlTex=new B.Texture(url('art/blackrock/owl-stencil.webp'),scene,false,true);owlTex.hasAlpha=true;own.push(owlTex);
  const owlMat=new B.PBRMaterial('cult-owl',scene);owlMat.albedoTexture=owlTex;owlMat.useAlphaFromAlbedoTexture=true;owlMat.transparencyMode=B.PBRMaterial.PBRMATERIAL_ALPHABLEND;owlMat.roughness=.95;owlMat.metallic=0;owlMat.usePhysicalLightFalloff=false;owlMat.environmentIntensity=0;owlMat.directIntensity=1.3;
  owlMat.emissiveTexture=owlTex;owlMat.emissiveColor=new B.Color3(.07,.07,.07);owlMat.zOffset=-2;owlMat.maxSimultaneousLights=8;own.push(owlMat);
  const owl=B.MeshBuilder.CreatePlane('cult-owl',{width:R.owl.w,height:R.owl.h},scene);owl.material=owlMat;owl.position.set(0,R.owl.y,S-.012);owl.parent=rootN;owl.isPickable=false;
  // merge the static pieces per material
  for(const [mat,list] of parts){if(list.length<2)continue;const m=B.Mesh.MergeMeshes(list,true,true,undefined,false,false);if(m){m.material=mat;m.isPickable=false;m.parent=rootN;m.freezeWorldMatrix();}}
  // ---- lights ----
  const L=[];
  const spot=(name,pos,dir,angle,col,int,range)=>{const l=new B.SpotLight('cult-'+name,new B.Vector3(...pos),new B.Vector3(...dir).normalize(),angle,2,scene);l.diffuse=B.Color3.FromHexString(col);l.specular=l.diffuse.scale(.4);l.intensity=int;l.range=range;L.push(l);return l;};
  const pt=(name,pos,col,int,range)=>{const l=new B.PointLight('cult-'+name,new B.Vector3(...pos),scene);l.diffuse=B.Color3.FromHexString(col);l.specular=l.diffuse.scale(.3);l.intensity=int;l.range=range;L.push(l);return l;};
  spot('owl-wash',[0,H-.35,S-3.4],[0,-.18,1],1.25,'#d8d0c4',5.2,14);
  const circleL=spot('circle',[0,H-.2,-.4],[0,-1,.06],1.25,'#aebdd6',3.4,12);circleL.exponent=7;
  const candles=pt('candles',[A.x,A.h+.45,A.z-.2],'#ff9a40',1.5,6.5);
  pt('door-lamp',[0,dz.h+.85,-S+.35],'#9fb6ff',.9,5);
  pt('corridor',[-cw+.4,1.9,(cz0+cz1)/2-.6],'#ffc070',1.1,4.5);
  const fill=new B.HemisphericLight('cult-fill',new B.Vector3(0,1,0),scene);fill.diffuse=new B.Color3(.10,.11,.13);fill.groundColor=new B.Color3(.02,.02,.025);fill.intensity=.55;fill.specular=B.Color3.Black();L.push(fill);
  // ---- the security camera (top corner over the door side; cult-room.js ROOM.camera) ----
  const cm=R.camera,cam=new B.UniversalCamera('cult-cam',new B.Vector3(cm.x,cm.y,cm.z),scene);cam.setTarget(new B.Vector3(cm.lookX,cm.lookY,cm.lookZ));cam.fov=cm.fov;cam.minZ=.05;cam.maxZ=60;scene.activeCamera=cam;
  // a camera housing and bracket in the corner (seen from the overview only)
  bx(M.gun,[.22,.16,.34],[cm.x-.1,cm.y+.06,cm.z+.1],0,true);
  // ---- the seven figures ----
  const cs=C.compile(opts.scene),actors={};let ready=false,failed=null;
  const ready_=B.SceneLoader.LoadAssetContainerAsync(url('assets/models/crowd/'),MODEL,scene).then(cont=>{
   for(const m of cont.materials){if(m.metallic!==undefined){m.metallic=0;m.roughness=.86;m.metallicTexture=null;m.albedoColor=new B.Color3(2.1,2.1,2.15);m.directIntensity=1.5;}m.maxSimultaneousLights=8;}   // matte black wool: the folds still read under the lights (dark is not black)
   C.ACTORS.forEach((id,i)=>{const inst=cont.instantiateModelsToScene(n=>'cult-'+id+'-'+n,false,{doNotInstantiate:true}),node=new B.TransformNode('cult-'+id,scene),v=VAR[i];
    for(const r of inst.rootNodes)r.parent=node;node.scaling.setAll(v.s);node.parent=rootN;
    const groups={};for(const g of inst.animationGroups){const nm=g.name.replace(/^cult-[a-z0-9-]+-/,'').replace(/\.\d+$/,'');g.stop();groups[nm]=g;}
    const tn=inst.rootNodes.flatMap(r=>r.getChildTransformNodes(false)),head=tn.find(t=>/(^|:|-)Head$/.test(t.name));if(head&&v.hw!==1)head.scaling.set(v.hw,1,v.hw);
    for(const m of inst.rootNodes.flatMap(r=>r.getChildMeshes(false))){m.isPickable=false;m.alwaysSelectAsActiveMesh=true;}
    actors[id]={node,groups,cur:null,prev:null,blend:1,hand:tn.find(t=>/(^|:|-)RightHand$/.test(t.name))||null};});
   ready=true;}).catch(e=>{failed=e;});
  const fpsOf=g=>(g.targetedAnimations[0]&&g.targetedAnimations[0].animation.framePerSecond)||60;
  function frameOf(g,clipT,rate,once){const fps=fpsOf(g),len=Math.max(1e-3,g.to-g.from),f=clipT*rate*fps;return g.from+(once?Math.min(len-.01,f):((f%len)+len)%len);}
  function play(a,clip,clipT,rate,once,dt){const g=a.groups[clip]||a.groups.stand||a.groups.idle;if(!g)return;
   if(a.cur!==g){if(a.prev&&a.prev!==g)a.prev.stop();a.prev=a.cur;a.cur=g;a.blend=a.prev?0:1;g.start(true,1,g.from,g.to,false);g.pause();a.curStart=clipT;}
   a.blend=Math.min(1,a.blend+dt/.35);g.goToFrame(frameOf(g,clipT,rate,once));g.setWeightForAllAnimatables(a.blend);
   if(a.prev){if(a.blend>=1){a.prev.stop();a.prev=null;}else a.prev.setWeightForAllAnimatables(1-a.blend);}}
  let last=0,cardInHand=false,flick=0;
  function tick(t){const dt=Math.max(0,Math.min(.2,t-last));last=t;
   // door and box
   const open=C.doorAt(cs,t);leaf.position.x=open*(dz.w+.1);
   const boxEv=cs.events.find(e=>e.type==='box'),boxK=boxEv?Math.max(0,Math.min(1,(t-boxEv.t)/1)):0;hinge.rotation.x=-boxK*1.7;
   const cardEv=cs.events.find(e=>e.type==='card');const inHand=!!cardEv&&t>=cardEv.t;
   if(inHand!==cardInHand){cardInHand=inHand;const h=actors.initiate&&actors.initiate.hand;if(inHand&&h){card.parent=h;card.position.set(0,.06,.04);card.rotation.set(0,0,0);card.scaling.setAll(1/(actors.initiate.node.scaling.x||1));}else{card.parent=rootN;card.position.set(A.x,boxY+bxD.h*.7,A.z);card.rotation.set(Math.PI/2,0,0);card.scaling.setAll(1);}}
   flick+=dt;candles.intensity=1.35+Math.sin(flick*13.1)*.12+Math.sin(flick*7.3+1)*.1+(rand()-.5)*.08;for(const f of flames)f.scaling.y=.85+Math.sin(flick*11+f.position.x*9)*.15;
   if(!ready)return;
   for(const id of C.ACTORS){const a=actors[id],p=C.poseAt(cs,id,t);a.node.setEnabled(!!p.visible);if(!p.visible)continue;a.node.position.set(p.x,0,p.z);a.node.rotation.y=p.yaw+(opts.modelYaw||0);play(a,p.clip,p.clipT,p.rate,p.once||C.ONCE.includes(p.clip),dt);}}
  const camera=cam;
  function overview(){for(const m of scene.meshes)if([M.ceil,M.top,M.topSteel,M.topRust,M.topCol].includes(m.material))m.setEnabled(false);
   const c=new B.ArcRotateCamera('cult-overview',-Math.PI/2-.35,.62,24,new B.Vector3(0,.5,-1),scene);c.fov=.85;c.minZ=.05;return c;}
  function dispose(){try{scene.dispose();}catch{}}
  return {scene,camera,compiled:cs,tick,dispose,overview,lights:L,get ready(){return ready;},get failed(){return failed;},loaded:ready_,actors,owl,card};
 }
 root.VoidCultRoomBuild={create,MODEL};
})(globalThis);
