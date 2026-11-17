/* NeoChinatown nightclub: the purchased "Cyberpunk Cyber Club" (CGTrader, item 5665404) set into the west side of
   Main Street where the owner's map marks "Nightclub" (2026-10-24 plan).
   The placement, collision and door are plain data and run in Node (tests/ncz-nightclub.test.cjs). The model itself is
   licensed content that stays out of the public repository (docs/VOID_RUNNER_ASSET_LICENSES.md): `create()` loads
   assets/models/ncz/nightclub.vrpak only when the player comes near, and unloads it again when they leave. Until the
   licence is cleared for release the club is off unless asked for (enabled()): open void-runner.html?nightclub=1 on a
   local server that has the pack. Everywhere else the city, its collision and its tests are exactly as they were. */
(function(root){
 'use strict';
 // World metres, x east, z north. RECT is the club plus its 1 m deep doorway through to Main Street's west face (x 51);
 // HALL is the hall inside. The model is 32 x 20 m; the map box is 28 x 24.5 m, so the hall is 4 m longer to the west
 // and 4.5 m narrower than drawn, centred on the same point. Nothing else on the map is within reach of it.
 const RECT=[18,51,-68.5,-48.5],HALL=[18,50,-68.5,-48.5],DOOR={x:50.5,z:-58.5,half:1.2,height:3.4};
 /* The way in (the owner, 16 Nov 2026): an OPEN doorway built as a short passage, 5 m from the street face to the hall, with a door frame at each end and no
    doors in them. It is the shape of a vestibule on purpose: hanging a door in each frame (ENTRY.doors) and exchanging the street for the club in the middle
    (as milked-transition.js does) is all a real vestibule would need. Until then nothing closes and nothing is exchanged. */
 const ENTRY={rect:[46,51,DOOR.z-DOOR.half,DOOR.z+DOOR.half],wall:.25,height:DOOR.height,doors:{outer:{x:50.7,z:DOOR.z,half:DOOR.half},inner:{x:46.3,z:DOOR.z,half:DOOR.half}},vestibule:false};
 // Model (Babylon metres, +x/+z as loaded) to world: turned a quarter turn so its entrance end faces the street.
 const FIT={x:63.2,y:9,z:-78.1,yaw:-Math.PI/2},ID='ncz:nightclub',SRC='assets/models/ncz/nightclub.vrpak';
 const toWorld=(gx,gz)=>[FIT.x-gz,gx+FIT.z];
 let forced=null;
 // Off by default. `?nightclub=1` on the page address (or localStorage 'void-nightclub' = '1') turns it on for a local build;
 // flip the default here once the owner has cleared the licence for the live site. Tests turn it on with force(true).
 // Since 2026-11-12 the club (named NULL by the owner) is ON in the game for everyone: where the purchased model is not published, the interior built in code below
 // (buildOwn) is used instead. `?nightclub=0` or localStorage 'void-nightclub' = '0' switches the club off. Outside a browser (Node tests, tools) it stays off
 // unless a test forces it, so the plain city layout and its tests are exactly as they were.
 const NAME='NULL';
 const asked=()=>{try{if(typeof document==='undefined'||!root.location)return false;if(/[?&]nightclub=0/.test(root.location.search||'')||root.localStorage?.getItem('void-nightclub')==='0')return false;return true;}catch(e){return false;}};
 const enabled=()=>forced!==null?forced:asked();
 const inRect=([x0,x1,z0,z1],x,z,m=0)=>x>=x0-m&&x<=x1+m&&z>=z0-m&&z<=z1+m;
 const inside=p=>!!p&&inRect(HALL,p.x,p.z);
 const distance=(x,z)=>Math.hypot(Math.max(RECT[0]-x,0,x-RECT[1]),Math.max(RECT[2]-z,0,z-RECT[3]));

 // Furniture that blocks movement, as [gx0,gx1,gz0,gz1] in model metres (measured from the model's own chairs, tables,
 // speaker stacks and DJ desk).
 const FURNITURE={
  chair:[[27.43,29.3,37.27,39.19],[24.77,26.54,14.13,15.75],[22.01,23.93,13.83,15.72],[27.05,28.65,21.32,23.07],[27.22,28.9,40,41.8],[27.38,28.86,25.85,27.5],[26.12,27.96,23.34,25.08],[9.97,11.89,31.66,33.57],[10,11.48,29.1,30.76],[10.56,12.39,17.02,18.92],[9.79,11.54,19.61,21.46],[12.91,14.8,13.99,15.92],[15.73,17.31,13.88,15.27]],
  table:[[27,28.18,38.82,40],[26.16,27.77,24.82,26.43],[10.79,12.16,30.62,32],[10.96,12.35,18.82,20.21],[14.48,15.92,14.69,16.13],[23.58,24.82,14.87,16.11]],
  speaker:[[28.01,29.1,43.41,44.49],[10.37,11.47,43.41,44.49],[21.46,22.54,42.88,43.73],[16.42,17.51,42.86,43.75],[10.28,11.4,14.25,15.28],[27.89,29,14.07,15.11]],
  'dj-desk':[[18.37,20.66,38.37,40.98]]};

 // The parts added for NULL that the purchased model does not have: a bar on the north wall and a VIP corner on the south wall, in the gaps between its tables.
 const BUILT={solid:[{id:'bar',x0:27.6,x1:34.4,z0:-50.5,z1:-49.8,h:1.1},{id:'vip-sofa',x0:35.2,x1:40.8,z0:-68.2,z1:-67.5,h:.8},{id:'vip-table',x0:37.4,x1:38.6,z0:-66.6,z1:-65.8,h:.5}],bar:{x:31,z:-51.4},dance:[28,42,-63.2,-53.8]};
 function solids(){
  const out=[],wall=(id,x0,x1,z0,z1,h=8)=>out.push({id,position:[(x0+x1)/2,h/2,(z0+z1)/2],size:[x1-x0,h,z1-z0]});
  // Shell: north, south and west walls, and the street wall with its doorway (the front is 1 m thick).
  wall('club-north',HALL[0]-.2,HALL[1],HALL[3],HALL[3]+.4);wall('club-south',HALL[0]-.2,HALL[1],HALL[2]-.4,HALL[2]);wall('club-west',HALL[0]-.4,HALL[0],HALL[2],HALL[3]);
  wall('club-front-south',HALL[1],RECT[1],HALL[2]-.4,DOOR.z-DOOR.half);wall('club-front-north',HALL[1],RECT[1],DOOR.z+DOOR.half,HALL[3]+.4);
  // The entry passage's two side walls, from the front wall into the hall.
  wall('club-entry-south',ENTRY.rect[0],HALL[1],ENTRY.rect[2]-ENTRY.wall,ENTRY.rect[2],ENTRY.height+.3);wall('club-entry-north',ENTRY.rect[0],HALL[1],ENTRY.rect[3],ENTRY.rect[3]+ENTRY.wall,ENTRY.height+.3);
  // Shuts the doorway until the model is in (see create()); `open` is the flag the door code in neochinatown.js uses.
  out.push({id:'club-shutter',position:[DOOR.x,DOOR.height/2,DOOR.z],size:[1,DOOR.height,DOOR.half*2],open:false});
  for(const [kind,list] of Object.entries(FURNITURE))list.forEach(([gx0,gx1,gz0,gz1],i)=>{const [xa,za]=toWorld(gx0,gz0),[xb,zb]=toWorld(gx1,gz1);
   out.push({id:'club-'+kind+'-'+i,position:[(xa+xb)/2,.5,(za+zb)/2],size:[Math.abs(xb-xa),1,Math.abs(zb-za)]});});
  for(const b of BUILT.solid)out.push({id:'club-'+b.id,position:[(b.x0+b.x1)/2,b.h/2,(b.z0+b.z1)/2],size:[b.x1-b.x0,b.h,b.z1-b.z0]});
  return out;}

 // Where the club's sound comes from (world metres): the six speaker stacks and the DJ desk (for ncz-club-audio.js).
 function emitters(){
  const out=[];for(const kind of ['speaker','dj-desk'])FURNITURE[kind].forEach(([gx0,gx1,gz0,gz1],i)=>{const [xa,za]=toWorld(gx0,gz0),[xb,zb]=toWorld(gx1,gz1);out.push({id:kind+'-'+i,kind,x:(xa+xb)/2,y:kind==='speaker'?1.7:1.3,z:(za+zb)/2});});
  return out;}

 // ---- Presentation (browser only) -------------------------------------
 // create() returns { tick(cam,dt,time), inside(cam), state(), dispose() }. `assets` is VoidAssets.
 function create({B,scene,parent,quality,assets,getSolids,onChange}){
  const low=quality==='low',state={phase:'idle',loads:0,unloads:0,error:null};
  let model=null,own=[],excluded=[],lights=[],beams=[],ball=null,interior=[],cones=[],clock=0,disposed=false,shutter=null;
  // The doorway's collision box in the CURRENT street layout. Looked up again whenever the layout has changed (the street is laid afresh for each quarter, and a
  // club that finishes loading while the street is still being entered would otherwise open a box that is no longer the one in the way).
  const solidShutter=()=>{const list=getSolids?.()||[];if(!shutter||!list.includes(shutter))shutter=list.find(s=>s.id==='club-shutter')||null;return shutter;};
  const setOpen=open=>{const s=solidShutter();if(s)s.open=open;onChange?.(open);};
  setOpen(false);

  // The doorway: the model's street wall is solid, so the tile at the door is removed (triangles whose corners all lie
  // in it) from the wall, skirting and any trim. Model metres: the street end is gz = 13.2, the door tile gx 17.6-21.6.
  function cutDoorway(mesh){
   const pos=mesh.getVerticesData('position'),idx=mesh.getIndices();if(!pos||!idx)return;
   mesh.computeWorldMatrix(true);const m=mesh.getWorldMatrix(),v=new B.Vector3(),keep=[];let cut=0;
   const at=i=>{B.Vector3.TransformCoordinatesFromFloatsToRef(pos[i*3],pos[i*3+1],pos[i*3+2],m,v);return [v.x,v.y,v.z];};
   for(let t=0;t<idx.length;t+=3){const p=[at(idx[t]),at(idx[t+1]),at(idx[t+2])];
    if(p.every(([x,y,z])=>Math.abs(z-13.2)<.35&&x>17.55&&x<21.65&&y<-4.95))cut++;else keep.push(idx[t],idx[t+1],idx[t+2]);}
   if(cut)mesh.setIndices(keep);return cut;}

  function dress(){
   const all=model.getChildMeshes(false),bare=o=>o.name.slice(ID.length+1);
   for(const mesh of all){mesh.isPickable=false;mesh.receiveShadows=false;
    const n=bare(mesh),mat=mesh.material,mn=mat?.name||'';
    if(/light_cone/.test(mn)){cones.push(mesh);mesh.renderingGroupId=0;mesh.alphaIndex=5;}
    else if(/^static_(wall|wall3|plint|det_1)$/.test(n))cutDoorway(mesh);
    if(/^(static_(chair|table|audio|det_1|det_2|door)|certain|ball)/.test(n))interior.push(mesh);
    // The model's own moving heads, beams and light boxes sit where only its clips (a 100x scale) could put them: left out, replaced by placeBeams.
    if(/^(head_|_light|Box538|lightcone)/.test(n))mesh.setEnabled(false);}
   // The model's own beams are huge cones aimed by its (unusable here) clips; they are hidden and replaced by sweeping beams of our own (see placeBeams).
   for(const c of cones)c.setEnabled(false);cones=[];
   for(const mat of model.getChildMeshes().map(m=>m.material).filter(Boolean))if(/^floor$/.test(mat.name)){mat.environmentIntensity=.6;mat.albedoColor=new B.Color3(.55,.5,.6);}
   // The mirror ball turns; the beams (placeBeams) sweep.
   const nodes=model.getDescendants(false);
   ball=nodes.find(n=>bare(n)==='ball')||null;
   // Colour washes: a few lights reaching only the club, so the rest of NeoChinatown's lights are not asked to shade it.
   const colours=[[1,.18,.7],[.15,.9,1],[.25,.4,1],[.7,.3,1]],spots=[[44,5.5],[36,5.5],[28,5.5],[22,5.5]];
   spots.slice(0,low?2:4).forEach(([x,y],i)=>{const l=new B.PointLight('ncz-club-light-'+i,new B.Vector3(x,y,-58.5+(i%2?3:-3)),scene);l.diffuse=new B.Color3(...colours[i]);l.specular=l.diffuse;l.range=28;l.intensity=0;l.includedOnlyMeshes=all.filter(m=>!!m.material);lights.push(l);});
   // NeoChinatown has far more lights than one shader takes (eight). The club is shaded by the sky light and its own four only, so the street's lights skip it.
   const mine=new Set(lights);for(const l of scene.lights){if(mine.has(l)||l.name==='ambient')continue;l.excludedMeshes.push(...all);excluded.push(l);}
   for(const m of all)m._resyncLightSources?.();
  }

  // Sweeping beams: a small fixture hung from the ceiling trusses with a thin additive cone under it, one colour each
  // (magenta, cyan, blue, violet). Spots are world x, z; the trusses run about 6.7 m up.
  const BEAM_SPOTS=[[24,-63.5],[30,-53.5],[36,-63.5],[42,-53.5],[27,-58.5],[45,-58.5],[33,-58.5],[39,-58.5]];
  let fade=null;
  function fadeTexture(){if(fade)return fade;fade=new B.DynamicTexture('ncz-club-beam-fade',{width:4,height:64},scene,false);const g=fade.getContext(),r=g.createLinearGradient(0,0,0,64);
   r.addColorStop(0,'#fff');r.addColorStop(.35,'#999');r.addColorStop(1,'#000');g.fillStyle=r;g.fillRect(0,0,4,64);fade.update();own.push(fade);return fade;}
  function placeBeams(){
   const colours=[[1,.2,.75],[.2,.9,1],[.3,.45,1],[.75,.35,1]],body=new B.StandardMaterial('ncz-club-fixture',scene);body.diffuseColor=new B.Color3(.05,.05,.07);body.specularColor=new B.Color3(.4,.4,.5);own.push(body);
   BEAM_SPOTS.slice(0,low?4:BEAM_SPOTS.length).forEach(([x,z],i)=>{
    const c=colours[i%4],pivot=new B.TransformNode('ncz-club-beam-pivot',scene);pivot.parent=parent;pivot.position.set(x,6.7,z);
    const fixture=B.MeshBuilder.CreateBox('ncz-club-fixture',{width:.34,height:.3,depth:.34},scene);fixture.material=body;fixture.parent=pivot;fixture.isPickable=false;
    const cone=B.MeshBuilder.CreateCylinder('ncz-club-beam',{diameterTop:.1,diameterBottom:2.4,height:7,tessellation:low?10:16,cap:B.Mesh.NO_CAP},scene);
    // The cone fades to nothing toward its open bottom end (an opacity gradient along its height), so it has no hard rim hanging in the air.
    const uv=cone.getVerticesData('uv'),pos=cone.getVerticesData('position');for(let k=0;k<pos.length/3;k++)uv[k*2+1]=Math.max(0,Math.min(1,(pos[k*3+1]+3.5)/7));cone.setVerticesData('uv',uv);
    const m=new B.StandardMaterial('ncz-club-beam-'+i,scene);m.disableLighting=true;m.emissiveColor=new B.Color3(...c);m.diffuseColor=B.Color3.Black();m.specularColor=B.Color3.Black();
    m.opacityTexture=fadeTexture();m.opacityTexture.getAlphaFromRGB=true;
    m.alpha=low?.12:.2;m.alphaMode=B.Engine.ALPHA_ADD;m.backFaceCulling=false;m.disableDepthWrite=true;own.push(m);
    cone.material=m;cone.parent=pivot;cone.position.y=-3.6;cone.isPickable=false;
    beams.push({pivot,i});});}

  /* Prepared early (prepare(), 17 Nov 2026): the street's loading screen builds the club, so the build and its shaders are not paid in the middle of a walk.
     It stays hidden (shutter shut, nothing drawn, no lights) until the player first comes within 70 m, exactly as when it was built there. */
  let shown=false,loading=null;
  const rootOf=()=>built||model;
  function reveal(){if(shown||state.phase!=='ready')return;shown=true;rootOf()?.setEnabled(true);setOpen(true);}
  function hold(){if(!shown)rootOf()?.setEnabled(false);}
  function load(){if(!loading)loading=load_().finally(()=>{loading=null;});return loading;}
  async function load_(){
   if(state.phase==='loading'||state.phase==='ready'||state.phase==='failed')return;state.phase='loading';
   try{
    // Ask first whether the purchased model is published at all (one small request): the loader's own retries for a missing file take a long time.
    const there=await fetch(new URL('void-runner/'+SRC,document.baseURI||location.href),{method:'HEAD'}).then(r=>r.ok,()=>false);if(!there)throw Error('the purchased model is not published here');
    await assets.load(ID,{src:SRC,scale:1,yaw:0},scene,null);
    if(disposed){assets.unload(ID);return;}
    model=assets.instance(ID,parent);
    if(!model)throw Error('Nightclub model missing');
    dress();
    model.position.set(FIT.x,FIT.y,FIT.z);model.getChildren()[0].rotation.y=FIT.yaw;
    // Placed; now the parts that never move again are frozen (the cut above needed them unplaced).
    model.computeWorldMatrix(true);
    for(const mesh of model.getChildMeshes(false)){mesh.computeWorldMatrix(true);{const n=mesh.name.slice(ID.length+1);if(!/^(Box538|head_|_light|lightcone|ball)/.test(n)&&!mesh.parent?.name?.match(/Box538|head_|_light/))mesh.freezeWorldMatrix();}}
    placeBeams();state.phase='ready';state.loads++;hold();
   }catch(error){
    // The purchased model is not published here: the club is built in code instead, in the same hall, round the same furniture.
    try{if(disposed)return;buildOwn();placeBeams();state.phase='ready';state.variant='built';state.loads++;state.error=null;staff(0,false);hold();}
    catch(e){state.phase='failed';state.error=e.message;console.warn('[VOID//RUNNER nightclub] unavailable, the door stays shut:',e.message);}}
  }
  /* The code-built NULL: shell, lit dance floor, DJ desk and speaker stacks, tables and chairs where the collision already has them, a bar, a VIP corner, and
     the people: dancers, the DJ, a bartender, the door staff, guests. Everything is added to `built` and removed with the club. */
  let built=null,floorTex=null,people=[],looksAsked=false,screenTex=null;
  function buildOwn(){
   const root0=new B.TransformNode('ncz-null',scene);root0.parent=parent;built=root0;const all=[];
   const M=(name,hex,em)=>{const m=new B.StandardMaterial('ncz-null-'+name,scene);m.diffuseColor=B.Color3.FromHexString(hex);m.specularColor=new B.Color3(.18,.18,.22);if(em)m.emissiveColor=B.Color3.FromHexString(em);own.push(m);return m;};
   const G=(name,hex,k=1)=>{const m=new B.StandardMaterial('ncz-null-'+name,scene);m.diffuseColor=B.Color3.Black();m.specularColor=B.Color3.Black();m.emissiveColor=B.Color3.FromHexString(hex).scale(k);m.disableLighting=true;own.push(m);return m;};
   const put=(mesh,mat,x,y,z,detail)=>{mesh.material=mat;mesh.parent=root0;mesh.position.set(x,y,z);mesh.isPickable=false;all.push(mesh);if(detail)interior.push(mesh);return mesh;};
   const box=(name,w,h,d,x,y,z,mat,detail)=>put(B.MeshBuilder.CreateBox('ncz-null-'+name,{width:w,height:h,depth:d},scene),mat,x,y,z,detail);
   const [x0,x1,z0,z1]=HALL,cx=(x0+x1)/2,cz=(z0+z1)/2,W=x1-x0,D=z1-z0,H=7.4;
   const wallM=M('wall','#14121c','#07060c'),darkM=M('dark','#0b0a10'),trimM=M('trim','#262432','#0c0b12'),hot=G('hot','#ff3fb4'),ice=G('ice','#38e8ff'),vio=G('violet','#9b5cff'),blu=G('blue','#3d6bff'),amb=G('amber','#ffb347',.9);
   // shell: floor, ceiling, three walls (the street wall is the club front built with the street)
   box('floor',W,.1,D,cx,-.03,cz,M('floor','#0e0d14','#050409'));box('ceiling',W,.2,D,cx,H,cz,darkM);
   box('wall-n',W,H,.3,cx,H/2,z1+.15,wallM);box('wall-s',W,H,.3,cx,H/2,z0-.15,wallM);box('wall-w',.3,H,D,x0-.15,H/2,cz,wallM);
   for(const z of [z0+.06,z1-.06])for(const [y,m] of [[.25,ice],[3.4,hot],[H-.5,vio]])box('wall-strip',W-.6,.07,.05,cx,y,z,m);
   for(let x=x0+4;x<x1;x+=6)for(const z of [z0+.05,z1-.05])box('pilaster',.5,H,.12,x,H/2,z,trimM);
   for(let x=x0+3;x<x1-1;x+=4)box('truss',.16,.16,D-.4,x,6.85,cz,trimM);for(const z of [cz-5,cz,cz+5])box('truss',W-1,.16,.16,cx,6.85,z,trimM);
   // dance floor: a grid of lit tiles that changes with the music's time
   const [dx0,dx1,dz0,dz1]=BUILT.dance;floorTex=new B.DynamicTexture('ncz-null-dance',{width:112,height:80},scene,false,B.Texture.NEAREST_SAMPLINGMODE);own.push(floorTex);floorTex.update();   // a dynamic texture is not 'ready' until it has been drawn once: pulse() only runs while the player is near, and a scene waiting for readiness would wait forever
   const fm=new B.StandardMaterial('ncz-null-dance',scene);fm.diffuseColor=B.Color3.Black();fm.specularColor=new B.Color3(.5,.5,.6);fm.emissiveTexture=floorTex;own.push(fm);
   put(B.MeshBuilder.CreateGround('ncz-null-dance',{width:dx1-dx0,height:dz1-dz0},scene),fm,(dx0+dx1)/2,.04,(dz0+dz1)/2);box('dance-edge',dx1-dx0+.3,.06,.12,(dx0+dx1)/2,.04,dz0-.1,ice);box('dance-edge',dx1-dx0+.3,.06,.12,(dx0+dx1)/2,.04,dz1+.1,hot);
   // the furniture the collision already has: tables, chairs, speaker stacks, the DJ desk
   const span=([gx0,gx1,gz0,gz1])=>{const [xa,za]=toWorld(gx0,gz0),[xb,zb]=toWorld(gx1,gz1);return {x:(xa+xb)/2,z:(za+zb)/2,w:Math.abs(xb-xa),d:Math.abs(zb-za)};};
   for(const r of FURNITURE.table){const t=span(r);put(B.MeshBuilder.CreateCylinder('ncz-null-table',{diameter:Math.min(t.w,t.d),height:.06,tessellation:20},scene),trimM,t.x,.78,t.z,true);put(B.MeshBuilder.CreateCylinder('ncz-null-table-leg',{diameter:.12,height:.76,tessellation:8},scene),darkM,t.x,.38,t.z,true);
    put(B.MeshBuilder.CreateCylinder('ncz-null-table-glow',{diameter:Math.min(t.w,t.d)*.55,height:.02,tessellation:20},scene),ice,t.x,.82,t.z,true);}
   for(const r of FURNITURE.chair){const c=span(r);box('seat',c.w*.7,.42,c.d*.7,c.x,.21,c.z,M('seat','#2a1430','#12071a'),true);}
   for(const r of FURNITURE.speaker){const p=span(r);box('speaker',p.w,2.2,p.d,p.x,1.1,p.z,darkM);for(const y of [.55,1.3,1.85])put(B.MeshBuilder.CreateTorus('ncz-null-cone',{diameter:Math.min(p.w,p.d)*.62,thickness:.05,tessellation:20},scene),y>1.5?hot:ice,p.x+p.w/2+.02,y,p.z).rotation.z=Math.PI/2;}
   const dj=span(FURNITURE['dj-desk'][0]);box('dj-desk',dj.w,1.05,dj.d,dj.x,.52,dj.z,trimM);box('dj-top',dj.w+.1,.05,dj.d+.1,dj.x,1.08,dj.z,vio);for(const dz of [-.6,.6])put(B.MeshBuilder.CreateCylinder('ncz-null-deck',{diameter:.55,height:.04,tessellation:24},scene),darkM,dj.x+.2,1.13,dj.z+dz,true);
   box('dj-riser',dj.w+2.4,.18,dj.d+3,dj.x-.6,.09,dj.z,darkM);
   // the wall of light behind the DJ: a low-resolution screen that pulses
   screenTex=new B.DynamicTexture('ncz-null-screen',{width:64,height:24},scene,false,B.Texture.NEAREST_SAMPLINGMODE);own.push(screenTex);screenTex.update();const sm=new B.StandardMaterial('ncz-null-screen',scene);sm.diffuseColor=B.Color3.Black();sm.specularColor=B.Color3.Black();sm.emissiveTexture=screenTex;sm.disableLighting=true;own.push(sm);
   const scr=put(B.MeshBuilder.CreatePlane('ncz-null-screen',{width:12,height:4.2,sideOrientation:B.Mesh.DOUBLESIDE},scene),sm,x0+.2,3.6,cz);scr.rotation.y=-Math.PI/2;
   // the name, inside too
   const nt=new B.DynamicTexture('ncz-null-name',{width:256,height:96},scene,false);own.push(nt);{const g=nt.getContext();g.clearRect(0,0,256,96);g.font='900 78px Arial,Helvetica,sans-serif';g.textAlign='center';g.textBaseline='middle';g.shadowColor='#38e8ff';g.shadowBlur=14;g.fillStyle='#eafcff';g.fillText(NAME,128,52);nt.hasAlpha=true;nt.update();}
   const nm=new B.StandardMaterial('ncz-null-name',scene);nm.diffuseColor=B.Color3.Black();nm.specularColor=B.Color3.Black();nm.emissiveTexture=nt;nm.opacityTexture=nt;nm.disableLighting=true;nm.backFaceCulling=false;own.push(nm);
   const name=put(B.MeshBuilder.CreatePlane('ncz-null-name',{width:5,height:1.9},scene),nm,x1-.25,5,cz);name.rotation.y=Math.PI/2;
   // the bar on the north wall: counter, lit front, back shelf of bottles
   const bar=BUILT.solid[0],bw=bar.x1-bar.x0,bx=(bar.x0+bar.x1)/2;box('bar',bw,1.1,.7,bx,.55,-50.15,trimM);box('bar-top',bw+.1,.05,.8,bx,1.12,-50.15,darkM);box('bar-front',bw,.5,.03,bx,.5,-50.52,blu);
   box('bar-shelf',bw,2.2,.25,bx,1.9,z1-.2,darkM);for(let k=0;k<3;k++)box('bar-shelf-light',bw-.3,.04,.05,bx,1.3+k*.6,z1-.34,k%2?hot:ice);
   for(let i=0;i<16;i++)box('bottle',.09,.3,.09,bar.x0+.4+i*.41,1.5+(i%3)*.6,z1-.38,[amb,ice,hot,vio][i%4],true);for(let i=0;i<5;i++)box('stool',.36,.74,.36,bar.x0+.9+i*1.25,.37,-51.15,darkM,true);
   // the VIP corner on the south wall: a low riser, a long sofa, a lit table, rope posts
   const sofa=BUILT.solid[1],tb=BUILT.solid[2];box('vip-riser',7,.12,3.4,38,.06,-66.6,M('vip','#1b1020','#0c0612'));box('vip-sofa',sofa.x1-sofa.x0,.45,.7,38,.34,-67.85,M('sofa','#3a1030','#1a0616'));box('vip-sofa-back',sofa.x1-sofa.x0,.9,.16,38,.7,-68.2,M('sofa','#3a1030','#1a0616'));
   box('vip-table',tb.x1-tb.x0,.45,tb.z1-tb.z0,38,.23,-66.2,trimM);box('vip-table-glow',1,.02,.6,38,.47,-66.2,vio);for(const x of [34.6,41.4]){put(B.MeshBuilder.CreateCylinder('ncz-null-rope-post',{diameter:.08,height:1,tessellation:8},scene),amb,x,.5,-64.95,true);}box('vip-rope',6.8,.04,.04,38,.92,-64.95,amb,true);
   // light the club by its own lights only (the street has far more lights than one shader takes)
   const colours=[[1,.18,.7],[.15,.9,1],[.25,.4,1],[.7,.3,1]],spots=[[44,5.5],[36,5.5],[28,5.5],[22,5.5]];
   spots.slice(0,low?2:4).forEach(([x,y],i)=>{const l=new B.PointLight('ncz-club-light-'+i,new B.Vector3(x,y,-58.5+(i%2?3:-3)),scene);l.diffuse=new B.Color3(...colours[i]);l.specular=l.diffuse;l.range=30;l.intensity=0;l.includedOnlyMeshes=all.slice();lights.push(l);});
   const mine=new Set(lights);for(const l of scene.lights){if(mine.has(l)||l.name==='ambient')continue;l.excludedMeshes.push(...all);excluded.push(l);}
   builtMeshes=all;
   // ---- the people (ordinary crowd looks; roles, not named characters) ----
   // Fewer people (the owner, 17 Nov 2026, for performance and so the target is easy to find): Low 2 dancers + DJ, bartender, door + Juno Vex = 6; Medium 3 dancers, the three
   // staff, 2 bar guests + Juno = 9; High / Ultra 4 dancers, the staff, 2 bar guests + Juno = 10. The VIP pair and the queue outside are gone. Counts: CAST_COUNTS.
   const spot=(id,x,z,face,clips,opts={})=>people.push({id,x,z,yaw:Math.atan2(face[0]-x,face[1]-z),clips,node:null,anim:null,...opts});
   const cast=castCounts(quality);for(let i=0;i<cast.dancers;i++){const a=i*2.4,r=1.6+(i%3)*1.5;spot('dancer-'+i,35+Math.cos(a)*r*1.5,-58.5+Math.sin(a)*r,[35,-58.5],['dance','laugh','idle'],{dance:true,phase:i*1.3});}
   spot('dj',dj.x-1,dj.z,[dj.x+6,dj.z],['interact','idle'],{dance:true,phase:.4,small:true});spot('bartender',BUILT.bar.x,-49.45,[BUILT.bar.x,-53],['idle']);
   spot('door',52.3,DOOR.z-2.1,[58,DOOR.z-2.6],['watch','idle']);
   // the two bar guests stand at the bar's west end, away from Juno's stool at the east end, so she reads as alone
   if(cast.guests){spot('bar-guest-a',28.1,-51.3,[28.6,-49],['drink','idle']);spot('bar-guest-b',29.5,-51.35,[29,-49],['talk','idle']);}
  }
  let builtMeshes=[];
  /* JUNO VEX (the owner's Mission 002, 17 Nov 2026): a woman with a short silver bob and a long black coat, her visor pushed up, sitting alone at NULL's bar checking her
     device. Built with the character assembler from the crowd kit (the FIXER look, the BOB hairstyle in SILVER, the coat tinted BLACK, the gear visor raised onto her
     forehead) and a small lit device in her hands. In the club for every player and at every quality; the V1 camera identifies her by name (VoidPhotoSubjects).
     She idles seated, now and then looks round the room, and checks her device. Nobody talks to her. */
  let juno=null,junoAsked=false;
  function junoBuild(){
   if(junoAsked||!root.VoidCharacterAssembler?.build)return;junoAsked=true;
   const holder=new B.TransformNode('ncz-null-juno',scene);holder.parent=built||parent;holder.position.set(JUNO.x,JUNO.y,JUNO.z);holder.rotation.y=JUNO.yaw;holder.metadata={club:'juno',photoSubject:'juno-vex'};
   juno={holder,api:null,phase:0,state:'sit',t:0,prop:null,look:0};
   Promise.resolve(root.VoidCharacterAssembler.build(JUNO.appearance,holder,{scene,clip:'sit'})).then(api=>{
    if(disposed||!juno){api?.dispose?.();return;}juno.api=api;
    // the visor pushed up onto her forehead: the same piece, moved up and back (it is skinned to the head, so it stays there through every clip); raised onto the top of her bob, its front edge just out over the fringe
    for(const m of api.meshes())if(/^gear:/.test(m.name)&&/visor/i.test(m.name+' '+(m.material?.name||''))){try{m.makeGeometryUnique();const P=B.VertexBuffer.PositionKind,pos=Float32Array.from(m.getVerticesData(P));for(let i=0;i<pos.length;i+=3){pos[i+1]+=JUNO.visorUp;pos[i+2]-=JUNO.visorBack;}m.setVerticesData(P,pos,false);m.refreshBoundingInfo?.();}catch{}}
    // her device: a small dark slab with a lit screen, held in front of her at lap height (the seated clip keeps her hands there)
    const dev=B.MeshBuilder.CreateBox('ncz-null-juno-device',{width:.075,height:.012,depth:.14},scene),dm=new B.StandardMaterial('ncz-null-juno-device',scene);dm.diffuseColor=new B.Color3(.02,.02,.03);dm.emissiveColor=new B.Color3(.12,.55,.75);dm.disableLighting=true;own.push(dm);
    dev.material=dm;dev.parent=holder;dev.position.set(0,JUNO.device[1],JUNO.device[2]);dev.rotation.x=-.55;dev.isPickable=false;juno.prop=dev;
    for(const m of api.meshes())m.isPickable=false;
    root.VoidPhotoSubjects?.set?.('juno-vex',holder,{name:'Juno Vex',role:''});
   }).catch(e=>{try{console.warn('[VOID//RUNNER nightclub] Juno Vex could not be built:',e?.message||e);}catch{}});
  }
  // idle, looking around (a slow turn of her head and shoulders toward the room and back), checking her device (the screen brightens, she looks down at it)
  function junoTick(dt,near){
   if(!juno)return;if(juno.holder.isEnabled()!==near)juno.holder.setEnabled(near);if(!near||!juno.api)return;
   juno.t+=dt;const want=juno.state==='sit'?7:juno.state==='look'?5:6;
   if(juno.t>want){juno.t=0;juno.phase++;juno.state=['look','sit','device','sit'][juno.phase%4];if(juno.state==='device')juno.api.play('sit-talk');else juno.api.play('sit');}
   const k=juno.state==='look'?Math.sin(juno.t/5*Math.PI):0;juno.look+=(k*.55-juno.look)*Math.min(1,dt*3);juno.holder.rotation.y=JUNO.yaw-juno.look;
   if(juno.prop)juno.prop.material.emissiveColor.set(.12,juno.state==='device'?.75:.45,juno.state==='device'?1:.65);}
  // (FIXER is left out of the crowd since 17 Nov 2026: Juno Vex is built on it, and a second figure with her bob and shades at the bar would not let her read as alone)
  const CAST=['district-resident','ncz-neon','outlaw-01','hacker-01','runner-02','district-smuggler','communion-tech'],clipsOf=look=>root.VoidCrowd?.clips?.[look]||['idle'];
  function staff(dt,near){
   if(!people.length&&!built){if(clock>2)junoBuild();junoTick(dt,near);return;}   // the purchased model has no crowd of its own: Juno still sits at the bar
   if(!people.length)return;
   if(!looksAsked&&clock>3&&typeof mode!=='undefined'&&mode==='walking'){looksAsked=true;for(const look of CAST.slice(0,5))try{Promise.resolve(root.VoidCharacterAssembler?.ensureLook?.(look,scene)).catch(()=>{});}catch{}}
   if(clock>2)junoBuild();junoTick(dt,near);
   people.forEach((p,i)=>{
    if(!p.node){const want=p.clips[0],order=[...CAST.slice(i%CAST.length),...CAST.slice(0,i%CAST.length)];let node=null,look=null,clip=null;
     for(const c of order){if(clipsOf(c).includes(want)&&(node=assets.instance('crowd:'+c,built))){look=c;clip=want;break;}}
     if(!node&&clock>14)for(const c of order){if((node=assets.instance('crowd:'+c,built))){look=c;clip=p.clips.find(k=>clipsOf(c).includes(k))||'idle';break;}}
     if(!node)return;p.node=node;p.look=look;p.clip=clip;p.anim=root.VoidCrowd?.animate?.(node,look,clip);node.position.set(p.x,0,p.z);node.rotation.y=p.yaw;node.metadata={...node.metadata,crowd:look,club:p.id};return;}
    if(p.node.isEnabled()!==near)p.node.setEnabled(near);if(!near)return;
    // Dancers without a dance of their own still move with the beat: a small bounce and sway.
    if(p.dance&&p.clip!=='dance'){const t=clock*3.9+p.phase;p.node.position.y=Math.abs(Math.sin(t))*(p.small?.02:.05);p.node.rotation.y=p.yaw+Math.sin(t*.5)*(p.small?.12:.45);}});
  }
  function pulse(time){
   if(floorTex){const g=floorTex.getContext(),cols=['#ff3fb4','#38e8ff','#9b5cff','#3d6bff','#101018','#101018'],step=Math.floor(time*2.2);for(let y=0;y<10;y++)for(let x=0;x<14;x++){g.fillStyle=cols[((x*7+y*13+step*(1+(x+y)%3))%cols.length+cols.length)%cols.length];g.fillRect(x*8,y*8,7,7);}floorTex.update();}
   if(screenTex){const g=screenTex.getContext();g.fillStyle='#05030a';g.fillRect(0,0,64,24);for(let x=0;x<32;x++){const h=3+Math.abs(Math.sin(time*3.1+x*.55))*14+Math.abs(Math.sin(time*5.3+x*1.3))*5;g.fillStyle=x%2?'#ff3fb4':'#38e8ff';g.fillRect(x*2,24-h,1,h);}screenTex.update();}
  }
  function unload(){
   if(built)return;   // the code-built club stays for the visit: it is small, and there is nothing to download again
   if(!model)return;setOpen(false);const gone=new Set(model.getChildMeshes(false));for(const l of excluded)l.excludedMeshes=l.excludedMeshes.filter(m=>!gone.has(m));excluded=[];for(const l of lights)l.dispose();lights=[];for(const b of beams)b.pivot.dispose(false,true);beams=[];for(const o of own)o.dispose();own=[];fade=null;cones=[];interior=[];ball=null;
   model.dispose(false,true);model=null;assets.unload(ID);state.phase='idle';state.unloads++;shown=false;}

  function tick(cam,dt,time){
   if(disposed||!cam)return;clock+=dt;
   {const s=solidShutter(),open=state.phase==='ready'&&shown;if(s&&s.open!==open)s.open=open;}   // the doorway's collision always follows the club's state
   const d=distance(cam.x,cam.z)*(root.VoidZoom?root.VoidZoom.now():1),here=inside(cam);   // zoomed with the camera app, the club is judged as near as it looks (zoom-detail.js)
   if(state.phase==='idle'&&d<70)load();
   else if(state.phase==='ready'&&d>130)unload();
   if(state.phase==='ready'&&!shown&&d<70)reveal();
   if(state.phase!=='ready')return;
   if(!shown){for(const l of lights)l.setEnabled(false);for(const b of beams)b.pivot.setEnabled(false);if(built)staff(dt,false);return;}
   if(built){const nearby=d<45;if(nearby&&Math.floor(clock*6)!==Math.floor((clock-dt)*6))pulse(time??clock);staff(dt,nearby);for(const m of builtMeshes)if(m.isEnabled()!==(d<130))m.setEnabled(d<130);}else staff(dt,d<45);
   // Interior detail and lights only while the club could be seen into; the shell stays for the skyline.
   const near=d<45;for(const m of interior)if(m.isEnabled()!==near)m.setEnabled(near);
   const live=d<28;
   lights.forEach((l,i)=>{l.setEnabled(live);if(live)l.intensity=(here?4.4:1.2)*(.55+.45*Math.sin(clock*(1.1+i*.37)+i*1.9));});
   for(const b of beams){b.pivot.setEnabled(near);if(!near)continue;
    b.pivot.rotation.x=.25+.55*Math.abs(Math.sin(clock*(.35+b.i*.05)+b.i));b.pivot.rotation.y=clock*(.22+b.i*.04)*(b.i%2?-1:1)+b.i*1.3;}
   if(near&&ball)ball.rotate(B.Axis.Y,dt*.5,B.Space.LOCAL);
  }

  return {tick,inside,isOpen:()=>state.phase==='ready'&&shown,state:()=>({...state,shown}),
   // Build the club now, hidden (the street's loading screen calls this); resolves when built, or after `ms` if a download is slow (it then finishes in the background).
   prepare(ms=6000){if(disposed)return Promise.resolve(false);const p=load();return Promise.race([Promise.resolve(p).then(()=>state.phase==='ready'),new Promise(r=>setTimeout(()=>r(false),ms))]);},
   // Compile the club's shaders both ways its lights will be seen (off from afar, on within 28 m), still behind the loading screen. `ready` waits for the scene.
   async warm(ready){if(disposed||!lights.length||typeof ready!=='function')return;const cap=p=>Promise.race([Promise.resolve(p).catch(()=>{}),new Promise(r=>setTimeout(r,5000))]);
    // (a scene that has not drawn a frame since a change takes its shaders as still current: incrementRenderId makes it look again, as a drawn frame would)
    for(const l of lights)l.setEnabled(true);scene.incrementRenderId();await cap(ready());if(disposed)return;for(const l of lights)l.setEnabled(false);scene.incrementRenderId();await cap(ready());},
   get model(){return model;},get juno(){return juno?{built:!!juno.api,state:juno.state,position:juno.holder.getAbsolutePosition().asArray(),enabled:juno.holder.isEnabled()}:null;},dispose(){disposed=true;if(juno){root.VoidPhotoSubjects?.remove?.('juno-vex',juno.holder);try{juno.api?.dispose?.();}catch{}try{juno.prop?.dispose();juno.holder.dispose(false,false);}catch{}juno=null;}if(built){for(const p of people){p.anim?.dispose?.();p.node?.dispose?.();}people=[];for(const l of excluded)l.excludedMeshes=l.excludedMeshes.filter(m=>!builtMeshes.includes(m));excluded=[];for(const l of lights)l.dispose();lights=[];for(const b of beams)b.pivot.dispose(false,true);beams=[];built.dispose(false,false);built=null;builtMeshes=[];for(const o of own)o.dispose();own=[];}else unload();setOpen(false);},get people(){return people.map(p=>({id:p.id,look:p.look||null,clip:p.clip||null,spawned:!!p.node}));}};
 }
 /* How many people NULL holds at each quality (the owner, 17 Nov 2026), Juno Vex not counted here (she is always there): dancers, staff (DJ, bartender, door), bar guests. */
 const CAST_COUNTS={low:{dancers:2,staff:3,guests:0},medium:{dancers:3,staff:3,guests:2},high:{dancers:4,staff:3,guests:2},ultra:{dancers:4,staff:3,guests:2}};
 const castCounts=q=>CAST_COUNTS[q]||CAST_COUNTS.medium;
 // Juno Vex's stool: the east end of the bar (stools at x 28.5 ... 33.5, z -51.15, 0.74 m high), sitting sideways to the bar, turned toward the room and the door so her face can be seen.
 const JUNO={x:33.55,y:.3,z:-51.35,yaw:1.9,visorUp:.095,visorBack:-.045,device:[0,.62,.32],appearance:{v:1,base:'female',look:'fixer-01',hair:'bob01',hairColor:'silver',clothingColor:'black',accessories:['gear-visor']}};
 const api={NAME,BUILT,ENTRY,CAST_COUNTS,castCounts,JUNO,enabled,force:v=>{forced=v;},RECT,HALL,DOOR,FIT,ID,SRC,toWorld,inside,distance,solids,emitters,create};
 if(typeof module!=='undefined')module.exports=api;else root.VoidNightclub=api;
 // The bar: a drink, nothing more for now (no credits, no effect). Registered once the game's interaction table exists.
 if(typeof document!=='undefined'){const t=setInterval(()=>{if(!root.VoidInteractions?.register)return;clearInterval(t);root.VoidInteractions.register('club-bar',()=>{try{resumeWalking();}catch{}try{announce('The bartender slides a glass across the bar. It glows faintly. You drink it anyway.');}catch{}});},500);}
})(globalThis);
