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
  const oldFurniture=new Set(['lounge-chair','chair-back','chair-metal-leg','bar-stool','bottle','bunk-mattress','washbasin','sanitary-fixture']);
  for(const mesh of [...parent.getChildMeshes()]){
   if(mesh.parent!==parent)continue;
   if(oldFurniture.has(mesh.name)){mesh.dispose();continue;}
   if(mesh.material?.name==='station'||mesh.material?.name==='floor'){mesh.material=mesh.material.name==='floor'?deck:wall;metreUV(mesh);}
   else if(mesh.material?.name==='panel'){mesh.material=frame;metreUV(mesh);}
  }
  function cylinder(name,p,diameter,height,mat,diameterTop=diameter){const m=B.MeshBuilder.CreateCylinder(name,{diameterBottom:diameter,diameterTop,height,tessellation:quality==='low'?10:18},scene);m.position.set(...p);m.parent=parent;m.material=mat;return m;}
  function ellipsoid(name,p,size,mat){const m=B.MeshBuilder.CreateSphere(name,{diameter:1,segments:quality==='low'?10:16},scene);m.position.set(...p);m.scaling.set(...size);m.parent=parent;m.material=mat;return m;}
  function rail(a,b,r=.035,mat=trim){const start=B.Vector3.FromArray(a),end=B.Vector3.FromArray(b),delta=end.subtract(start),m=B.MeshBuilder.CreateCylinder('furniture-tube',{height:delta.length(),diameter:r*2,tessellation:10},scene);m.parent=parent;m.position=start.add(end).scale(.5);m.rotationQuaternion=B.Quaternion.FromUnitVectorsToRef(B.Axis.Y,delta.normalize(),new B.Quaternion());m.material=mat;return m;}
  // Actual chair frames and padded seats; their positions match the existing activity points.
  for(const x of [-12,11])for(const z of [37,41])for(const side of [-1,1]){
   const cx=x+side*1.6;
   for(const dx of [-.25,.25])for(const dz of [-.25,.25])rail([cx+dx,.03,z+dz],[cx+dx,.49,z+dz]);
   box('seat-pan',[.7,.07,.7],[cx,.46,z],frame,parent);ellipsoid('leather-cushion',[cx,.54,z],[.75,.18,.73],leather);
   box('chair-back-frame',[.07,.7,.72],[cx+side*.32,.83,z],frame,parent);ellipsoid('padded-back',[cx+side*.28,.85,z],[.18,.74,.72],leather);
   for(const dz of [-.37,.37]){rail([cx+side*.3,.55,z+dz],[cx+side*.3,.82,z+dz]);rail([cx-side*.26,.79,z+dz],[cx+side*.3,.82,z+dz],.025);}
  }
  for(let i=0;i<4;i++){const x=8+i*1.8;cylinder('stool-foot',[x,.04,27],.65,.08,frame);cylinder('stool-column',[x,.28,27],.12,.48,trim);cylinder('stool-seat',[x,.56,27],.62,.12,leather);const ring=B.MeshBuilder.CreateTorus('stool-footrest',{diameter:.42,thickness:.035,tessellation:16},scene);ring.parent=parent;ring.position.set(x,.23,27);ring.material=trim;}
  const glass=metal('bottle-glass','#3e7664',.1,.2),amber=metal('amber-glass','#8a542e',.1,.25);
  for(let i=0;i<14;i++){const x=7.7+i*.5,z=32.6,mat=i%3?glass:amber;cylinder('bottle-body',[x,1.92,z],.15,.34,mat);cylinder('bottle-neck',[x,2.14,z],.065,.13,mat);cylinder('bottle-cap',[x,2.22,z],.072,.035,trim);}
  for(const y of [1.68,2.5])box('backbar-shelf',[7.8,.09,.6],[11,y,32.65],trim,parent);
  for(const z of [49,59]){box('bunk-mattress',[3.6,.2,1.6],[13,.55,z],fabric,parent);ellipsoid('pillow',[14.25,.74,z],[.64,.25,1.25],ceramic);box('folded-blanket',[1.7,.07,1.63],[12.2,.71,z],leather,parent);for(const y of [.32,1.6])box('locker-handle',[.045,.27,.07],[15.45,y,z],trim,parent);box('locker-vent',[.02,.22,.6],[15.47,2.05,z],frame,parent);box('berth-shelf',[.6,.08,1.3],[16.9,1.2,z],trim,parent);}
  for(const z of [49,59]){box('sink-vanity',[1.4,.8,.7],[-15,.4,z],frame,parent);ellipsoid('basin',[-15,.84,z],[1.15,.2,.63],ceramic);rail([-15,.85,z+.2],[-15,1.15,z+.2],.025);rail([-15,1.15,z+.2],[-15,1.15,z],.025);ellipsoid('sanitary-bowl',[-15,.32,z+1],[.62,.5,.85],ceramic);box('sanitary-cistern',[.6,.6,.22],[-15,.7,z+1.32],ceramic,parent);}
  // Soft floor contacts anchor furniture without adding shadow-map passes on low quality.
  const shadowTexture=new B.DynamicTexture('meridian-contact',128,scene,false),sg=shadowTexture.getContext(),gradient=sg.createRadialGradient(64,64,5,64,64,64);gradient.addColorStop(0,'rgba(0,0,0,.5)');gradient.addColorStop(1,'rgba(0,0,0,0)');sg.fillStyle=gradient;sg.fillRect(0,0,128,128);shadowTexture.update();shadowTexture.hasAlpha=true;textures.push(shadowTexture);
  const shadow=new B.StandardMaterial('meridian-contact-shadow',scene);shadow.diffuseTexture=shadowTexture;shadow.useAlphaFromDiffuseTexture=true;shadow.disableLighting=true;shadow.emissiveColor=B.Color3.White();owned.push(shadow);
  for(const [x,z,w,d]of [[-12,37,5.4,2.4],[-12,41,5.4,2.4],[11,37,5.4,2.4],[11,41,5.4,2.4],[11,29,9,3],[-11,29,8,3]]){const m=B.MeshBuilder.CreateGround('furniture-contact',{width:w,height:d},scene);m.parent=parent;m.position.set(x,.034,z);m.material=shadow;m.isPickable=false;}
  // Operational details are physical panels, shelving and pressure-frame hardware.
  for(const side of [-1,1])for(let z=22;z<43;z+=4){box('window-seal',[.13,.18,3.75],[side*17.55,1.14,z],frame,parent);box('window-seal',[.13,.14,3.75],[side*17.55,3.94,z],frame,parent);for(const y of [1.45,3.55])cylinder('pressure-fastener',[side*17.5,y,z],.065,.09,trim);}
  for(const x of [-3.8,3.8])for(let z=6;z<18;z+=3){box('connector-rib',[.15,4.6,.22],[x,2.3,z],frame,parent);box('connector-lamp',[.08,.9,.12],[x*.98,2.8,z],material('lamp','#ffd39a',true),parent);}
  const api={dispose(){disposed=true;for(const m of owned)m.dispose(false,false);for(const t of textures)t.dispose();}};return api;
 }
 root.VoidMeridianArt={enhance};
})(globalThis);
