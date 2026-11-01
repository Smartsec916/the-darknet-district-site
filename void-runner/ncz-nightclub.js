/* NeoChinatown nightclub: the purchased "Cyberpunk Cyber Club" (CGTrader, item 5665404) set into the west side of
   Main Street where David's map marks "Nightclub" (2026-10-24 plan).
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
 // Model (Babylon metres, +x/+z as loaded) to world: turned a quarter turn so its entrance end faces the street.
 const FIT={x:63.2,y:9,z:-78.1,yaw:-Math.PI/2},ID='ncz:nightclub',SRC='assets/models/ncz/nightclub.vrpak';
 const toWorld=(gx,gz)=>[FIT.x-gz,gx+FIT.z];
 let forced=null;
 // Off by default. `?nightclub=1` on the page address (or localStorage 'void-nightclub' = '1') turns it on for a local build;
 // flip the default here once David has cleared the licence for the live site. Tests turn it on with force(true).
 const asked=()=>{try{return /[?&]nightclub=1/.test(root.location?.search||'')||root.localStorage?.getItem('void-nightclub')==='1';}catch(e){return false;}};
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

 function solids(){
  const out=[],wall=(id,x0,x1,z0,z1,h=8)=>out.push({id,position:[(x0+x1)/2,h/2,(z0+z1)/2],size:[x1-x0,h,z1-z0]});
  // Shell: north, south and west walls, and the street wall with its doorway (the front is 1 m thick).
  wall('club-north',HALL[0]-.2,HALL[1],HALL[3],HALL[3]+.4);wall('club-south',HALL[0]-.2,HALL[1],HALL[2]-.4,HALL[2]);wall('club-west',HALL[0]-.4,HALL[0],HALL[2],HALL[3]);
  wall('club-front-south',HALL[1],RECT[1],HALL[2]-.4,DOOR.z-DOOR.half);wall('club-front-north',HALL[1],RECT[1],DOOR.z+DOOR.half,HALL[3]+.4);
  // Shuts the doorway until the model is in (see create()); `open` is the flag the door code in neochinatown.js uses.
  out.push({id:'club-shutter',position:[DOOR.x,DOOR.height/2,DOOR.z],size:[1,DOOR.height,DOOR.half*2],open:false});
  for(const [kind,list] of Object.entries(FURNITURE))list.forEach(([gx0,gx1,gz0,gz1],i)=>{const [xa,za]=toWorld(gx0,gz0),[xb,zb]=toWorld(gx1,gz1);
   out.push({id:'club-'+kind+'-'+i,position:[(xa+xb)/2,.5,(za+zb)/2],size:[Math.abs(xb-xa),1,Math.abs(zb-za)]});});
  return out;}

 // ---- Presentation (browser only) -------------------------------------
 // create() returns { tick(cam,dt,time), inside(cam), state(), dispose() }. `assets` is VoidAssets.
 function create({B,scene,parent,quality,assets,getSolids,onChange}){
  const low=quality==='low',state={phase:'idle',loads:0,unloads:0,error:null};
  let model=null,own=[],excluded=[],lights=[],beams=[],ball=null,interior=[],cones=[],clock=0,ambience=null,disposed=false,shutter=null;
  const solidShutter=()=>shutter||(shutter=(getSolids?.()||[]).find(s=>s.id==='club-shutter')||null);
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

  async function load(){
   if(state.phase==='loading'||state.phase==='ready'||state.phase==='failed')return;state.phase='loading';
   try{
    await assets.load(ID,{src:SRC,scale:1,yaw:0},scene,null);
    if(disposed){assets.unload(ID);return;}
    model=assets.instance(ID,parent);
    if(!model)throw Error('Nightclub model missing');
    dress();
    model.position.set(FIT.x,FIT.y,FIT.z);model.getChildren()[0].rotation.y=FIT.yaw;
    // Placed; now the parts that never move again are frozen (the cut above needed them unplaced).
    model.computeWorldMatrix(true);
    for(const mesh of model.getChildMeshes(false)){mesh.computeWorldMatrix(true);{const n=mesh.name.slice(ID.length+1);if(!/^(Box538|head_|_light|lightcone|ball)/.test(n)&&!mesh.parent?.name?.match(/Box538|head_|_light/))mesh.freezeWorldMatrix();}}
    placeBeams();state.phase='ready';state.loads++;setOpen(true);
   }catch(error){state.phase='failed';state.error=error.message;console.warn('[VOID//RUNNER nightclub] unavailable, the door stays shut:',error.message);}
  }
  function unload(){
   if(!model)return;setOpen(false);const gone=new Set(model.getChildMeshes(false));for(const l of excluded)l.excludedMeshes=l.excludedMeshes.filter(m=>!gone.has(m));excluded=[];for(const l of lights)l.dispose();lights=[];for(const b of beams)b.pivot.dispose(false,true);beams=[];for(const o of own)o.dispose();own=[];fade=null;cones=[];interior=[];ball=null;
   model.dispose(false,true);model=null;assets.unload(ID);state.phase='idle';state.unloads++;}

  // Ambience made here, nothing recorded or licensed: a low crowd murmur and a muffled four-on-the-floor thump.
  function makeAmbience(){
   const AC=root.AudioContext||root.webkitAudioContext;if(!AC)return null;
   const ctx=new AC(),master=ctx.createGain();master.gain.value=0;master.connect(ctx.destination);
   const len=ctx.sampleRate*4,buf=ctx.createBuffer(1,len,ctx.sampleRate),d=buf.getChannelData(0);let last=0;
   for(let i=0;i<len;i++){last=(last+.02*(Math.random()*2-1))/1.02;d[i]=last*3.2;}
   const src=ctx.createBufferSource();src.buffer=buf;src.loop=true;
   const band=ctx.createBiquadFilter();band.type='bandpass';band.frequency.value=430;band.Q.value=.6;const murmur=ctx.createGain();murmur.gain.value=.55;
   src.connect(band);band.connect(murmur);murmur.connect(master);src.start();
   const thump=ctx.createBiquadFilter();thump.type='lowpass';thump.frequency.value=170;thump.connect(master);
   let next=ctx.currentTime+.1;const beat=60/124;
   return {ctx,level(l){master.gain.setTargetAtTime(Math.min(1,l)*.32,ctx.currentTime,.5);},
    schedule(){if(ctx.state==='suspended')ctx.resume().catch(()=>{});
     while(next<ctx.currentTime+.4){const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.setValueAtTime(95,next);o.frequency.exponentialRampToValueAtTime(42,next+.14);
      g.gain.setValueAtTime(.0001,next);g.gain.exponentialRampToValueAtTime(.9,next+.008);g.gain.exponentialRampToValueAtTime(.0001,next+.22);o.connect(g);g.connect(thump);o.start(next);o.stop(next+.25);next+=beat;}},
    close(){try{ctx.close();}catch(e){/* already closed */}}};}

  function tick(cam,dt,time){
   if(disposed||!cam)return;clock+=dt;
   const d=distance(cam.x,cam.z),here=inside(cam);
   if(state.phase==='idle'&&d<70)load();
   else if(state.phase==='ready'&&d>130)unload();
   if(state.phase!=='ready'){ambience?.level(0);return;}
   // Interior detail and lights only while the club could be seen into; the shell stays for the skyline.
   const near=d<45;for(const m of interior)if(m.isEnabled()!==near)m.setEnabled(near);
   const live=d<28;
   lights.forEach((l,i)=>{l.setEnabled(live);if(live)l.intensity=(here?4.4:1.2)*(.55+.45*Math.sin(clock*(1.1+i*.37)+i*1.9));});
   for(const b of beams){b.pivot.setEnabled(near);if(!near)continue;
    b.pivot.rotation.x=.25+.55*Math.abs(Math.sin(clock*(.35+b.i*.05)+b.i));b.pivot.rotation.y=clock*(.22+b.i*.04)*(b.i%2?-1:1)+b.i*1.3;}
   if(near&&ball)ball.rotate(B.Axis.Y,dt*.5,B.Space.LOCAL);
   const level=here?1:d<6?.35:d<14?.12:0;
   if(level>0&&!ambience){try{ambience=makeAmbience();}catch(e){ambience=false;}}
   if(ambience){ambience.level(level);if(level>0)ambience.schedule();}}

  return {tick,inside,state:()=>({...state}),get model(){return model;},dispose(){disposed=true;unload();ambience?.close?.();ambience=null;setOpen(false);}};
 }
 const api={enabled,force:v=>{forced=v;},RECT,HALL,DOOR,FIT,ID,SRC,toWorld,inside,distance,solids,create};
 if(typeof module!=='undefined')module.exports=api;else root.VoidNightclub=api;
})(globalThis);
