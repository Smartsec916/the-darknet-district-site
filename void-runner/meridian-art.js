/* Meridian presentation only: physical fittings, metre-scale materials and contact shadows. */
(function(root){
 'use strict';
 function enhance({B,scene,parent,box,material,quality}){
  const owned=[],textures=[];
  function metal(name,color,metallic=.25,roughness=.65){const m=new B.PBRMaterial('meridian-'+name,scene);m.albedoColor=B.Color3.FromHexString(color);m.metallic=metallic;m.roughness=roughness;m.maxSimultaneousLights=8;owned.push(m);return m;}
  const wall=metal('pressure-panels','#96988f',.32,.7),deck=metal('deck-plates','#555d61',.4,.61),frame=metal('gunmetal','#424b51',.65,.42),trim=metal('brushed-alloy','#9ca3a1',.6,.38),leather=metal('seat-upholstery','#674b33',0,.86),fabric=metal('bedding','#777967',0,1),ceramic=metal('ceramic','#afbab1',0,.32);
  // Procedural material stays usable if the optional authored texture fails to load.
  const fallback=new B.DynamicTexture('meridian-panel-fallback',256,scene,true);textures.push(fallback);const g=fallback.getContext();g.fillStyle='#aaa9a2';g.fillRect(0,0,256,256);g.strokeStyle='#474c4c';g.lineWidth=3;g.strokeRect(3,3,250,250);g.strokeRect(10,10,236,236);for(const x of [16,240])for(const y of [16,240]){g.fillStyle='#414746';g.beginPath();g.arc(x,y,3,0,Math.PI*2);g.fill();}fallback.update();wall.albedoTexture=fallback;deck.albedoTexture=fallback;
  let disposed=false;
  const authored=new B.Texture('void-runner/assets/textures/meridian-panels-v1.png',scene,false,false,B.Texture.TRILINEAR_SAMPLINGMODE,()=>{if(!disposed){wall.albedoTexture=authored;deck.albedoTexture=authored;}},()=>{});authored.anisotropicFilteringLevel=quality==='low'?2:8;textures.push(authored);
  function metreUV(mesh,scale=3){const p=mesh.getVerticesData(B.VertexBuffer.PositionKind),n=mesh.getVerticesData(B.VertexBuffer.NormalKind);if(!p||!n)return;const uv=[];for(let i=0;i<p.length;i+=3){const x=Math.abs(n[i]),y=Math.abs(n[i+1]);uv.push((x>.5?p[i+2]:p[i])/scale,(y>.5?p[i+2]:p[i+1])/scale);}mesh.setVerticesData(B.VertexBuffer.UVKind,uv);}
  const oldFurniture=new Set(['lounge-chair','chair-back','chair-metal-leg','bar-stool','bottle','bunk-mattress','pod-bank','pod-bank-2','washbasin','sanitary-fixture']);
  for(const mesh of [...parent.getChildMeshes()]){
   if(mesh.parent!==parent)continue;
   if(oldFurniture.has(mesh.name)){mesh.dispose();continue;}
   if(mesh.material?.name==='station'||mesh.material?.name==='floor'){mesh.material=mesh.material.name==='floor'?deck:wall;metreUV(mesh);}
   else if(mesh.material?.name==='panel'){mesh.material=frame;metreUV(mesh);}
  }
  function cylinder(name,p,diameter,height,mat,diameterTop=diameter){const m=B.MeshBuilder.CreateCylinder(name,{diameterBottom:diameter,diameterTop,height,tessellation:quality==='low'?10:18},scene);m.position.set(...p);m.parent=parent;m.material=mat;return m;}
  function ellipsoid(name,p,size,mat){const m=B.MeshBuilder.CreateSphere(name,{diameter:1,segments:quality==='low'?10:16},scene);m.position.set(...p);m.scaling.set(...size);m.parent=parent;m.material=mat;return m;}
  function rail(a,b,r=.035,mat=trim){const start=B.Vector3.FromArray(a),end=B.Vector3.FromArray(b),delta=end.subtract(start),m=B.MeshBuilder.CreateCylinder('furniture-tube',{height:delta.length(),diameter:r*2,tessellation:10},scene);m.parent=parent;m.position=start.add(end).scale(.5);m.rotationQuaternion=B.Quaternion.FromUnitVectorsToRef(B.Axis.Y,delta.normalize(),new B.Quaternion());m.material=mat;return m;}
  // Furniture positions come from the walkable plan (meridian-interior.js), so the detail follows the rooms.
  const F=root.VoidMeridianInterior.layout().furniture,G=parent.metadata?.propGroups||{};
  // Actual chair frames and padded seats; their positions match the existing activity points.
  for(const {x,z} of F.tables)for(const side of [-1,1]){
   const cx=x+side*1.6;
   for(const dx of [-.25,.25])for(const dz of [-.25,.25])rail([cx+dx,.03,z+dz],[cx+dx,.49,z+dz]);
   box('seat-pan',[.7,.07,.7],[cx,.46,z],frame,parent);ellipsoid('leather-cushion',[cx,.54,z],[.75,.18,.73],leather);
   box('chair-back-frame',[.07,.7,.72],[cx+side*.32,.83,z],frame,parent);ellipsoid('padded-back',[cx+side*.28,.85,z],[.18,.74,.72],leather);
   for(const dz of [-.37,.37]){rail([cx+side*.3,.55,z+dz],[cx+side*.3,.82,z+dz]);rail([cx-side*.26,.79,z+dz],[cx+side*.3,.82,z+dz],.025);}
  }
  if(!G['bar-stools'])for(const {x,z} of F.stools){cylinder('stool-foot',[x,.04,z],.65,.08,frame);cylinder('stool-column',[x,.28,z],.12,.48,trim);cylinder('stool-seat',[x,.56,z],.62,.12,leather);const ring=B.MeshBuilder.CreateTorus('stool-footrest',{diameter:.42,thickness:.035,tessellation:16},scene);ring.parent=parent;ring.position.set(x,.23,z);ring.material=trim;}
  const glass=metal('bottle-glass','#3e7664',.1,.2),amber=metal('amber-glass','#8a542e',.1,.25);
  const bx=F.bar.backX+.3;for(let i=0;i<14;i++){const x=bx,z=F.bar.z-F.bar.length/2+.75+i*(F.bar.length-1.5)/13,mat=i%3?glass:amber;cylinder('bottle-body',[x,1.92,z],.15,.34,mat);cylinder('bottle-neck',[x,2.14,z],.065,.13,mat);cylinder('bottle-cap',[x,2.22,z],.072,.035,trim);}
  for(const y of [1.68,2.5])box('backbar-shelf',[.6,.09,F.bar.length-.2],[bx,y,F.bar.z],trim,parent);
  if(!G['quarters-beds'])for(const {x,z,head} of F.bunks){box('bunk-mattress',[3.6,.2,1.6],[x,.55,z],fabric,parent);ellipsoid('pillow',[x+head*1.25,.74,z],[.64,.25,1.25],ceramic);box('folded-blanket',[1.7,.07,1.63],[x-head*.8,.71,z],leather,parent);box('berth-shelf',[.6,.08,1.3],[x+head*1.7,1.2,z],trim,parent);}
  for(const {x,z} of F.lockers){for(const y of [.32,1.6])box('locker-handle',[.045,.27,.07],[x+.42,y,z+.25],trim,parent);box('locker-vent',[.02,.22,.6],[x+.41,2.05,z],frame,parent);}
  if(!G['quarters-basins'])for(const {x,z,facing} of F.basins){box('sink-vanity',[1.4,.8,.7],[x,.4,z],frame,parent);ellipsoid('basin',[x,.84,z],[1.15,.2,.63],ceramic);rail([x,.85,z-facing*.2],[x,1.15,z-facing*.2],.025);rail([x,1.15,z-facing*.2],[x,1.15,z],.025);}
  if(!G['quarters-toilets'])for(const {x,z} of F.toilets){ellipsoid('sanitary-bowl',[x,.32,z-.1],[.62,.5,.85],ceramic);box('sanitary-cistern',[.6,.6,.22],[x,.7,z+.32],ceramic,parent);}
  // Soft floor contacts anchor furniture without adding shadow-map passes on low quality.
  const shadowTexture=new B.DynamicTexture('meridian-contact',128,scene,false),sg=shadowTexture.getContext(),gradient=sg.createRadialGradient(64,64,5,64,64,64);gradient.addColorStop(0,'rgba(0,0,0,.5)');gradient.addColorStop(1,'rgba(0,0,0,0)');sg.fillStyle=gradient;sg.fillRect(0,0,128,128);shadowTexture.update();shadowTexture.hasAlpha=true;textures.push(shadowTexture);
  const shadow=new B.StandardMaterial('meridian-contact-shadow',scene);shadow.diffuseTexture=shadowTexture;shadow.useAlphaFromDiffuseTexture=true;shadow.disableLighting=true;shadow.emissiveColor=B.Color3.White();owned.push(shadow);
  for(const [x,z,w,d]of [...F.tables.map(t=>[t.x,t.z,5.4,2.4]),[F.bar.x,F.bar.z,3,F.bar.length+1],[F.store.x,F.store.z,3,F.store.length+2]]){const m=B.MeshBuilder.CreateGround('furniture-contact',{width:w,height:d},scene);m.parent=parent;m.position.set(x,.034,z);m.material=shadow;m.isPickable=false;}
  // Operational details are physical panels, shelving and pressure-frame hardware.
  // Observation windows: pressure seals and fasteners along the hall's starboard and aft glass.
  for(let z=42;z<61;z+=4){box('window-seal',[.13,.18,3.75],[16.2,1.14,z],frame,parent);box('window-seal',[.13,.14,3.75],[16.2,3.4,z],frame,parent);for(const y of [1.45,3.1])cylinder('pressure-fastener',[16.15,y,z],.065,.09,trim);}
  for(let x=-14;x<15;x+=4){box('window-seal',[3.75,.18,.13],[x,1.04,62.15],frame,parent);box('window-seal',[3.75,.14,.13],[x,3.4,62.15],frame,parent);}
  // Sleeping pods: two tiers of capsules along the living area's walls, hatches facing into the room.
  // Each has a padded berth, its own warm light, a part-drawn privacy cover, an occupancy light and a drawer.
  const podLight=material('pod-light','#ffcf8e',true),free=material('pod-free','#7fe0b0',true),taken=material('pod-taken','#ffad5c',true),glassMat=material('pod-glass','#9fd2e6',false,.18);
  const pods=[];
  for(const [i,p] of (F.pods||[]).entries()){
   // Local pod space: u across the hatch, v along the berth (+v toward the hatch). A pod facing +x is turned a quarter.
   const side=Math.abs((p.facing??Math.PI)-Math.PI/2)<.01,shut=i%3===1,{y}=p;
   const P=(u,h,v)=>side?[p.x+v,y+h,p.z-u]:[p.x+u,y+h,p.z+v],S=(a,b,c)=>side?[c,b,a]:[a,b,c];
   const put=(name,size,u,h,v,mat)=>box(name,S(...size),P(u,h,v),mat,parent),front=1.12;
   put('pod-floor',[1.5,.1,2.3],0,.05,0,frame);put('pod-roof',[1.5,.1,2.3],0,1.1,0,frame);
   for(const s of [-1,1])put('pod-side',[.08,1.15,2.3],s*.71,.575,0,wall);put('pod-back',[1.5,1.15,.08],0,.575,-1.11,wall);
   put('pod-berth',[1.3,.14,2.05],0,.17,.02,fabric);ellipsoid('pod-pillow',P(0,.29,-.8),S(.95,.16,.42),ceramic);put('pod-blanket',[1.28,.06,1.1],0,.27,.35,leather);
   put('pod-light-strip',[1.2,.03,.05],0,1.03,front-.12,podLight);
   for(const s of [-1,1])put('pod-hatch-rail',[.06,1.15,.07],s*.72,.575,front,trim);put('pod-hatch-rail',[1.5,.06,.07],0,1.12,front,trim);put('pod-hatch-rail',[1.5,.06,.07],0,.03,front,trim);
   // The privacy cover slides along the hatch: most part-drawn, some closed.
   // The privacy cover slides along the hatch (animated below); its occupancy light shows free or taken.
   const cover=put('pod-privacy-cover',[1.36,.95,.04],0,.6,front+.05,glassMat),occ=put('pod-occupancy',[.16,.08,.02],.5,1.02,front+.05,shut?taken:free);
   cover.metadata={animated:true};occ.metadata={animated:true};pods.push({cover,occ,side,P,front,f:shut?1:0,target:shut?1:0});put('pod-drawer',[1.1,.08,.02],0,.12,front+.05,frame);
   if(p.level){for(const s of [-1,1])box('pod-ladder-rail',S(.04,1.62,.04),[...P(-.55+s*.18,0,front+.25)].map((v,k)=>k===1?.81:v),trim,parent);for(let r=.35;r<1.62;r+=.4)box('pod-ladder-rung',S(.36,.035,.035),[...P(-.55,0,front+.25)].map((v,k)=>k===1?r:v),trim,parent);}
  }
  // Now and then someone turns in or gets up: one cover slides shut or open and its light changes.
  const placeCover=q=>{const w=.62+(1.36-.62)*q.f,u=.35*(1-q.f);if(q.side)q.cover.scaling.z=w/1.36;else q.cover.scaling.x=w/1.36;q.cover.position.set(...q.P(u,.6,q.front+.05));};
  pods.forEach(placeCover);let nextToggle=8+Math.random()*12,last=performance.now();
  const podObserver=pods.length?scene.onBeforeRenderObservable.add(()=>{const now=performance.now(),dt=Math.min(.1,(now-last)/1000);last=now;nextToggle-=dt;
   if(nextToggle<=0){const q=pods[Math.floor(Math.random()*pods.length)];q.target=1-q.target;nextToggle=20+Math.random()*25;}
   for(const q of pods)if(q.f!==q.target){q.f=q.target>q.f?Math.min(q.target,q.f+dt/1.6):Math.max(q.target,q.f-dt/1.6);placeCover(q);if(q.f===q.target)q.occ.material=q.f?taken:free;}}):null;
  // The Dead Channel's glow (reference sheet): violet neon along the back bar's shelves and the counter's edge.
  {const neon=material('bar-neon','#b46cff',true),pink=material('bar-neon-pink','#ff5fb4',true),B0=F.bar;
   for(const y of [1.6,2.42])box('backbar-neon',[.04,.04,B0.length-.4],[B0.backX+.62,y,B0.z],neon,parent);
   box('counter-neon',[.04,.04,B0.length-.2],[B0.x+.63,1.12,B0.z],pink,parent);box('backbar-canopy',[1.6,.08,B0.length],[B0.backX+.6,3.1,B0.z],frame,parent);
   for(const dz of [-B0.length/2+.3,B0.length/2-.3])box('canopy-neon',[1.2,.04,.04],[B0.backX+.6,3.04,B0.z+dz],neon,parent);}
  // Potted plants in the hall's corners and at the corridor's end, as on the reference sheet.
  {const pot=metal('planter','#3a3f44',.4,.5),leaf=metal('leaves','#3f6b3a',0,.8),leaf2=metal('leaves-light','#5b8a45',0,.8);
   for(const [x,z,s] of F.plants||[]){cylinder('planter',[x,.3,z],.55*s,.6,pot,.65*s);for(let k=0;k<7;k++){const a=k*2.4,r=.18*s;ellipsoid('foliage',[x+Math.cos(a)*r,.75+(k%3)*.18*s,z+Math.sin(a)*r],[.42*s,.55*s,.42*s],k%2?leaf:leaf2);}}}
  // Hall lighting pass (David, 2026-10-23: closer to the reference art). Mostly glowing and additive surfaces, which
  // cost little: two real lights at the bar (amber over the counter, violet behind it), warm light pools on the floor
  // under the bar and tables, neon reflections on the floor in front of the counter, and a warm cove line under the hall
  // ceiling. The windows show the real view outside (David, 2026-10-23).
  const H=root.VoidMeridianInterior?.rooms?.hall,B0=F.bar,lights=[];
  if(H&&B0){
   // One real light (it replaces the plain ceiling light over the bar, so the scene stays within 8 lights).
   {const l=new B.PointLight('bar-amber-light',new B.Vector3(B0.x+1.2,2.4,B0.z),scene);l.parent=parent;l.diffuse=new B.Color3(1,.58,.28);l.specular=new B.Color3(.6,.35,.17);l.intensity=1.8;l.range=13;lights.push(l);}
   // Additive glow: a radial pool or a streak that fades along its length. Black adds nothing, so only the glow shows.
   function glowTexture(name,rgb,streak,band){const t=new B.DynamicTexture('meridian-'+name,{width:256,height:256},scene,true);textures.push(t);const g=t.getContext();g.fillStyle='#000';g.fillRect(0,0,256,256); // Additive: black adds nothing, so the glow fades to nothing.
    const grad=band?g.createLinearGradient(0,256,0,0):streak?g.createLinearGradient(0,0,0,256):g.createRadialGradient(128,128,2,128,128,128);
    if(band){grad.addColorStop(0,'rgba('+rgb+',.9)');grad.addColorStop(.35,'rgba('+rgb+',.45)');grad.addColorStop(1,'rgba('+rgb+',0)');}else{grad.addColorStop(0,'rgba('+rgb+',1)');grad.addColorStop(.45,'rgba('+rgb+',.38)');grad.addColorStop(1,'rgba('+rgb+',0)');}
    g.fillStyle=grad;g.fillRect(0,0,256,256);t.update();return t;}
   function glow(name,texture,strength){const m=new B.StandardMaterial('meridian-'+name,scene);m.diffuseColor=B.Color3.Black();m.specularColor=B.Color3.Black();m.emissiveTexture=texture;m.disableLighting=true;m.alphaMode=B.Engine.ALPHA_ADD;m.alpha=strength;m.backFaceCulling=false;owned.push(m);return m;}
   function floorGlow(name,mat,x,z,w,d,ry=0,y=.06){const p=B.MeshBuilder.CreateGround('hall-'+name,{width:w,height:d},scene);p.parent=parent;p.position.set(x,y,z);p.rotation.y=ry;p.material=mat;p.isPickable=false;return p;}
   const amber=glow('pool-amber',glowTexture('pool-amber','255,150,70'),1),violet=glow('pool-violet',glowTexture('pool-violet','170,90,255'),.8),warm=glow('pool-warm',glowTexture('pool-warm','255,190,120'),.95);
   const pink=glow('streak-pink',glowTexture('streak-pink','255,95,180',true),.85),purple=glow('streak-violet',glowTexture('streak-violet','180,108,255',true),.8);
   // A long amber pool along the front of the counter, violet light on the floor behind it, warm pools under the tables.
   floorGlow('bar-pool',amber,B0.x+2.1,B0.z,4.2,B0.length+2.5);floorGlow('backbar-pool',violet,(B0.x+B0.backX)/2,B0.z,3.6,B0.length+1);
   for(const t of F.tables||[])floorGlow('table-pool',warm,t.x,t.z,4.4,3.4);
   // A violet wash over the back bar and its bottles (glow, not a light).
   {const wash=B.MeshBuilder.CreatePlane('hall-backbar-wash',{width:B0.length,height:2.4},scene);wash.parent=parent;wash.position.set(B0.backX+.27,1.75,B0.z);wash.rotation.y=-Math.PI/2;wash.material=glow('backbar-wash',glowTexture('backbar-wash','170,90,255',false,true),.45);wash.isPickable=false;}
   for(const s of F.sofas||[])floorGlow('sofa-pool',warm,s.x-.9,s.z,2.6,s.length+1.2);
   // Neon reflections: streaks on the floor running out from the counter's pink edge, brightest at the counter.
   for(let i=0;i<Math.floor(B0.length/.9);i++){const z=B0.z-B0.length/2+.45+i*.9,len=1.6+(i%3)*.5;floorGlow('neon-reflection',i%2?purple:pink,B0.x+.62+len/2,z,len,.16,Math.PI/2,.065);}
   // Warm cove light under the hall ceiling along the bar wall and the entry wall.
   const cove=material('cove-warm','#ffb466',true);
   box('hall-cove',[.06,.06,H.z1-H.z0-1],[H.x0+.36,H.h-.28,(H.z0+H.z1)/2],cove,parent);
   for(const [a,b] of [[H.x0+.6,-2.6],[2.6,H.x1-.6]])box('hall-cove',[b-a,.06,.06],[(a+b)/2,H.h-.28,H.z0+.36],cove,parent);
  }
  // Sofas under the windows: deep red leather, as on the reference sheet.
  const sofaLeather=metal('sofa-leather','#6b1d24',0,.62);
  for(const {x,z,length} of F.sofas||[]){for(const dz of [-length/4,length/4])ellipsoid('sofa-cushion',[x,.52,z+dz],[.95,.22,length/2-.08],sofaLeather);ellipsoid('sofa-back-cushion',[x+.48,.92,z],[.26,.62,length-.1],sofaLeather);}
  const api={dispose(){disposed=true;for(const l of lights)l.dispose();if(podObserver)scene.onBeforeRenderObservable.remove(podObserver);for(const m of owned)m.dispose(false,false);for(const t of textures)t.dispose();}};return api;
 }
 root.VoidMeridianArt={enhance};
})(globalThis);
