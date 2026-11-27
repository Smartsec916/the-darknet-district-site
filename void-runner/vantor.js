/* VANTOR underground city: the modelled arrival cavern and concourse (docs/development/UNIVERSE_GRAPHICS_TRACKER.md). PRESENTATION ONLY.
   The prototype room (exploration-data.js 'mars-terminal', built by babylon-renderer.js prepareRoom) keeps every collision solid, interaction point, spawn and sign; this
   adds one modelled shell (tools/assets/universe/build_vantor.py, assets/models/vantor/vantor-cavern.glb: rock vault, steel arches, bulkhead and gate, pads, floodlights,
   buildings cut into the walls, concourse blocks, light baked into vertex colours) and hides the prototype boxes it replaces. Low quality keeps the prototype room.
   If the model fails to load nothing is hidden and the prototype room shows as before. */
(function(root){
 'use strict';
 const ID='vantor:cavern',SRC='assets/models/vantor/vantor-cavern.glb';
 // The prototype pieces the shell replaces (names from prepareRoom); the terminal and boarding markers, ship struts and signs stay.
 const HIDE=new Set(['floor','side-wall','end-wall','ceiling','wall-rib','service-panel','ceiling-lamp','ceiling-beam','strip','floor-seam','airlock-left','airlock-right','concourse','industry']);
 const api={active:false,ID,SRC};
 const applies=def=>def&&def.kind==='underground';
 api.models=(def,quality)=>applies(def)&&quality!=='low'?{[ID]:{src:SRC,scale:1}}:{};
 api.dress=({scene,parent,def,quality,instance})=>{
  if(!applies(def)||quality==='low'||!parent)return null;
  const node=instance?.(ID,parent);if(!node){console.warn('[VOID Vantor] cavern model unavailable; the prototype room stays');return null;}
  node.name='vantor-cavern';
  for(const m of parent.getChildMeshes(false))if(HIDE.has(m.name))m.setEnabled(false);
  for(const m of node.getChildMeshes(false)){m.isPickable=false;m.checkCollisions=false;m.alwaysSelectAsActiveMesh=false;}
  const B=root.BABYLON,prev={clear:scene.clearColor.clone(),mode:scene.fogMode,density:scene.fogDensity,color:scene.fogColor.clone()};
  scene.clearColor=new B.Color4(.012,.008,.008,1);
  // Red-dust haze: thin exponential fog so the far cavern fades into dark rock (atmospheric perspective).
  scene.fogMode=B.Scene.FOGMODE_EXP2;scene.fogDensity=.0105;scene.fogColor=new B.Color3(.085,.05,.04);
  api.active=true;
  let alive=null;try{alive=animate({scene,parent,quality,node});}catch(e){console.warn('[VOID Vantor] animation skipped',e.message);}
  parent.metadata={...(parent.metadata||{}),art:{dispose(){api.active=false;alive?.();scene.clearColor=prev.clear;scene.fogMode=prev.mode;scene.fogDensity=prev.density;scene.fogColor=prev.color;}}};
  return node;
 };
 /* Environmental animation (visual only, no gameplay): wall and roof fans, steam, drips, suspended dust, two cargo lifts, a gantry hoist and flickering indicator lamps.
    Particle counts scale with the quality tier; everything is disposed with the room. Returns a function that stops it. */
 function animate({scene,parent,quality,node}){
  const B=root.BABYLON,k={medium:.5,high:1,ultra:1.4}[quality]||.5,owned=[],systems=[];
  const dark=new B.StandardMaterial('vantor-rotor',scene);dark.diffuseColor=new B.Color3(.06,.065,.07);dark.specularColor=new B.Color3(.2,.2,.22);owned.push(dark);
  const glow=new B.StandardMaterial('vantor-cab',scene);glow.diffuseColor=new B.Color3(.05,.05,.05);glow.emissiveColor=new B.Color3(1,.62,.28);owned.push(glow);
  const steelM=new B.StandardMaterial('vantor-hoist',scene);steelM.diffuseColor=new B.Color3(.1,.1,.11);steelM.specularColor=new B.Color3(.3,.3,.32);owned.push(steelM);
  const at=(name,x,y,z)=>{const n=new B.TransformNode(name,scene);n.parent=parent;n.position.set(x,y,z);return n;};
  // fans: [x,y,z,radius,axis,speed rad/s]
  const rotors=[];
  for(const [x,y,z,r,axis,speed] of [[-9.5,7.5,-8.12,1.55,'z',2.6],[9.5,7.5,-8.12,1.55,'z',-2.2],[-11.8,6.45,12.7,.42,'y',9],[-9.6,6.45,15.7,.42,'y',-8],[-7.4,6.45,18.7,.42,'y',10],[10.5,9.95,20,.95,'y',3.2]]){
   const pivot=at('vantor-fan',x,y,z);
   for(let i=0;i<6;i++){const flat=axis==='z',b=B.MeshBuilder.CreateBox('vantor-blade',flat?{width:r*.9,height:r*.22,depth:.04}:{width:r*.9,height:.03,depth:r*.22},scene);
    const piv=new B.TransformNode('vantor-blade-pivot',scene);piv.parent=pivot;b.parent=piv;b.position.x=r*.5;b.material=dark;b.isPickable=false;
    if(flat){piv.rotation.z=i*Math.PI/3;b.rotation.x=.5;}else{piv.rotation.y=i*Math.PI/3;b.rotation.x=.45;}}
   rotors.push({pivot,axis,speed});}
  // the two lifts and the gantry hoist
  const cabs=[];
  for(const sx of [-1,1]){const cab=B.MeshBuilder.CreateBox('vantor-lift-cab',{width:2.2,height:2.6,depth:2.1},scene);cab.parent=parent;cab.position.set(sx*27.6,0,-4.6);cab.material=glow;cab.isPickable=false;cabs.push({cab,phase:sx>0?0:Math.PI,x:sx*27.6});}
  const hoist=at('vantor-hoist',0,12.6,-28.6),trolley=B.MeshBuilder.CreateBox('trolley',{width:2.4,height:.8,depth:1.2},scene);trolley.parent=hoist;trolley.material=steelM;trolley.isPickable=false;
  const cable=B.MeshBuilder.CreateCylinder('cable',{diameter:.06,height:3.0},scene);cable.parent=hoist;cable.position.y=-1.9;cable.material=steelM;cable.isPickable=false;
  const load=B.MeshBuilder.CreateBox('load',{width:3.0,height:1.3,depth:1.3},scene);load.parent=hoist;load.position.y=-3.5;load.material=steelM;load.isPickable=false;
  // particles: one soft round sprite shared by every system
  const tex=new B.DynamicTexture('vantor-puff',64,scene,true),c=tex.getContext(),g=c.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.4,'rgba(255,255,255,.45)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(0,0,64,64);tex.update();tex.hasAlpha=true;owned.push(tex);
  const ps=(name,x,y,z,cap,cfg)=>{const e=at(name+'-emitter',x,y,z),p=new B.ParticleSystem(name,Math.max(8,Math.round(cap*k)),scene);p.particleTexture=tex;p.emitter=e;Object.assign(p,cfg);p.preWarmCycles=cfg.pre||0;p.preWarmStepOffset=5;p.isPickable=false;p.start();systems.push(p);return p;};
  const steam={minEmitBox:new B.Vector3(-.1,0,-.1),maxEmitBox:new B.Vector3(.1,0,.1),direction1:new B.Vector3(-.15,.9,-.1),direction2:new B.Vector3(.15,1.4,.1),minSize:.35,maxSize:.9,minLifeTime:1.6,maxLifeTime:3.2,emitRate:14*k,minEmitPower:.35,maxEmitPower:.8,color1:new B.Color4(.8,.82,.84,.22),color2:new B.Color4(.7,.72,.74,.14),colorDead:new B.Color4(.6,.6,.62,0),blendMode:B.ParticleSystem.BLENDMODE_STANDARD,gravity:new B.Vector3(0,.35,0),pre:90};
  for(const [x,y,z] of [[-6.25,1.45,19.8],[-6.25,1.45,21.0],[7.1,5.0,10.5],[7.1,4.1,13.7],[-20,-5.5,-24],[20,-5.5,-20],[-15.5,.4,-14]])ps('vantor-steam',x,y,z,40,steam);
  ps('vantor-dust-a',0,0,0,90,{minEmitBox:new B.Vector3(-14,1,-30),maxEmitBox:new B.Vector3(14,15,-8),direction1:new B.Vector3(-.06,-.02,-.06),direction2:new B.Vector3(.06,.05,.06),minSize:.03,maxSize:.08,minLifeTime:10,maxLifeTime:18,emitRate:9*k,minEmitPower:.1,maxEmitPower:.35,color1:new B.Color4(1,.78,.5,.55),color2:new B.Color4(.9,.8,.7,.35),colorDead:new B.Color4(1,.8,.6,0),blendMode:B.ParticleSystem.BLENDMODE_ONEONE,gravity:new B.Vector3(0,-.01,0),pre:400});
  ps('vantor-dust-b',0,0,0,90,{minEmitBox:new B.Vector3(-13,1,-4),maxEmitBox:new B.Vector3(13,12,31),direction1:new B.Vector3(-.05,-.02,-.05),direction2:new B.Vector3(.05,.05,.05),minSize:.03,maxSize:.07,minLifeTime:10,maxLifeTime:18,emitRate:9*k,minEmitPower:.1,maxEmitPower:.3,color1:new B.Color4(.8,.9,1,.5),color2:new B.Color4(.9,.85,.75,.3),colorDead:new B.Color4(1,1,1,0),blendMode:B.ParticleSystem.BLENDMODE_ONEONE,gravity:new B.Vector3(0,-.01,0),pre:400});
  const drip={minEmitBox:new B.Vector3(-.05,0,-.05),maxEmitBox:new B.Vector3(.05,0,.05),direction1:new B.Vector3(0,-.1,0),direction2:new B.Vector3(0,-.2,0),minSize:.05,maxSize:.09,minLifeTime:1.0,maxLifeTime:1.45,emitRate:1.6*k,minEmitPower:.1,maxEmitPower:.2,color1:new B.Color4(.7,.85,1,.7),color2:new B.Color4(.6,.75,.9,.5),colorDead:new B.Color4(.6,.75,.9,0),blendMode:B.ParticleSystem.BLENDMODE_STANDARD,gravity:new B.Vector3(0,-9.8,0),pre:60};
  for(const [x,y,z] of [[-6,10.3,-17],[5,10.3,-17],[12,7.3,-27],[-14.5,7.3,-27],[-13,10,10],[13,10,25]])ps('vantor-drip',x,y,z,12,drip);
  // indicator lamps: the shared red and teal emissive materials
  const lamps=[];for(const m of node.getChildMeshes(false)){const mat=m.material;if(mat&&/^lamp_(red|teal)$/.test(mat.name)&&!lamps.some(l=>l.mat===mat))lamps.push({mat,base:mat.emissiveIntensity??1,kind:mat.name});}
  let t=0;const obs=scene.onBeforeRenderObservable.add(()=>{const dt=Math.min(.1,scene.getEngine().getDeltaTime()/1000);t+=dt;
   for(const r of rotors)r.pivot.rotation[r.axis==='z'?'z':'y']+=r.speed*dt;
   for(const c of cabs)c.cab.position.y=7.5+14.5*Math.sin(t*.11+c.phase);
   hoist.position.x=9*Math.sin(t*.07);
   for(const l of lamps){const f=l.kind==='lamp_red'?(Math.sin(t*2.3)+Math.sin(t*5.9)>.6?1:.25):.8+.2*Math.sin(t*1.1);l.mat.emissiveIntensity=l.base*f;}});
  return ()=>{scene.onBeforeRenderObservable.remove(obs);for(const p of systems)p.dispose();for(const m of owned)m.dispose();};
 }
 // Vantor Relay (a placeholder orbital transfer hangar): a rock-cut hangar shell in place of the plain boxes (tools/assets/universe/build_relay.py). Same coordinates; collision is the layout's data.
 const RELAY_ID='vantor:relay',RELAY_SRC='assets/models/vantor/vantor-relay.glb',RELAY_HIDE=new Set(['hangar-wall','hangar-door-jamb','hangar-header','hangar-floor','hangar-roof','rear-bulkhead','cargo-crate','floor-guide','ceiling-light']);
 api.relayModels=(def,quality)=>def?.id==='vantor-relay'&&quality!=='low'?{[RELAY_ID]:{src:RELAY_SRC,scale:1}}:{};
 api.dressRelay=({scene,parent,def,quality,instance})=>{
  if(def?.id!=='vantor-relay'||quality==='low'||!parent)return null;
  const node=instance?.(RELAY_ID,parent);if(!node)return null;node.name='vantor-relay-hangar';
  for(const m of parent.getChildMeshes(false))if(RELAY_HIDE.has(m.name))m.setEnabled(false);
  for(const m of node.getChildMeshes(false)){m.isPickable=false;m.checkCollisions=false;}
  api.active=true;const prev=parent.metadata?.art;
  parent.metadata={...(parent.metadata||{}),art:{dispose(){api.active=false;prev?.dispose?.();}}};
  return node;
 };
 if(typeof module!=='undefined')module.exports=api;else root.VoidVantor=api;
})(globalThis);
