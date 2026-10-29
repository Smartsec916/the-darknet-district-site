/* Meridian's walkable interior dressed with Quaternius "Modular Sci-Fi MegaKit" and "Sci-Fi
   Essentials Kit" pieces (both CC0), after David's reference sheet: riveted panel walls, ribbed
   columns, cable runs, plated decks, crates and cases along the walls. PROPOSED (renders first).
   Visual only: the walkable plan and every collision box in meridian-interior.js stay exactly as
   they are; panels sit just inside the existing walls. If any piece fails to load, nothing is added.
   Pieces are thin instances (one draw call per mesh), so the whole dressing is a few dozen draws. */
(function(root){
 'use strict';
 const dir='assets/models/meridian-interior/';
 const pieces=['wall-panel','wall-band','wall-cables','column','floor-plates','floor-squares','pipes','computer','access-point','case','case-ribbed','chest','drum','crate-tarp','ammo-case'];
 // How much each piece's dark texture is lifted: walls and decks stay gunmetal, cargo a little brighter.
 const tint={'wall-panel':.5,'wall-band':1.2,'wall-cables':1.3,column:1.3,'floor-plates':1.1,'floor-squares':.85,pipes:1.6};
 // Wall pieces are modelled with their length along z, height along y and thickness along x, and the
 // finished face toward -x. face(): a run of panels on one wall; normal is the direction it faces.
 const yawFor={'-x':0,'+x':Math.PI,'-z':-Math.PI/2,'+z':Math.PI/2};
 function plan(){
  const layout=(typeof module!=='undefined'?require('./meridian-interior.js'):root.VoidMeridianInterior).layout(),F=layout.furniture;
  const out=[],put=(key,position,yaw=0,size=null)=>out.push({key,position,yaw,size});
  function face(x0,z0,x1,z1,normal,rows){
   // rows: [[piece, bottom, height, thickness]]. The run is cut into equal 4 m-ish bays.
   const along=normal[1]==='x'?'z':'x',a0=along==='z'?z0:x0,a1=along==='z'?z1:x1,len=Math.abs(a1-a0),n=Math.max(1,Math.round(len/4)),bay=len/n;
   for(let i=0;i<n;i++){const t=Math.min(a0,a1)+bay*(i+.5);
    for(const [key,bottom,height,thick] of rows){
     const sign=normal[0]==='+'?1:-1,inset=thick/2;
     const p=along==='z'?[x0+sign*inset,bottom+height/2,t]:[t,bottom+height/2,z0+sign*inset];
     put(key,p,yawFor[normal],[thick,height,bay]);
    }}
  }
  // Every wall run in the plan (meridian-interior.js walls) gets panels by room: tall banded panels in the
  // hangar, a band and cable run in the low rooms, a band and panels in the hall. Window walls stay glass.
  const rowsFor={
   hangar:h=>[['wall-band',0,3,.22],['wall-panel',3,4,.32],['wall-cables',7,h-7.1,.3]],
   low:h=>[['wall-band',0,2.4,.2],['wall-cables',2.4,h-2.45,.28]],
   hall:h=>[['wall-band',0,3,.22],['wall-panel',3,h-3.05,.3]]
  };
  for(const w of layout.walls){if(w.window)continue;const rows=(w.room==='hangar'?rowsFor.hangar:w.room==='hall'?rowsFor.hall:rowsFor.low)(w.h);
   if(w.axis==='z')face(w.fixed,w.from,w.fixed,w.to,w.normal,rows);else face(w.from,w.fixed,w.to,w.fixed,w.normal,rows);}
  for(const s of [-1,1])for(let z=-22;z<=2;z+=8)put('column',[s*17.3,4.5,z],s>0?0:Math.PI,[.5,9,.95]);
  // Decks: dark plates in the hangar, the living area and the store; squared plates in the corridor and hall.
  for(const r of layout.floors){const key=['hangar','living','store'].includes(r.id)?'floor-plates':'floor-squares',w=r.x1-r.x0,d=r.z1-r.z0,nx=Math.max(1,Math.round(w/4)),nz=Math.max(1,Math.round(d/4)),sx=w/nx,sz=d/nz;
   for(let i=0;i<nx;i++)for(let j=0;j<nz;j++)put(key,[r.x0+sx*(i+.5),.025,r.z0+sz*(j+.5)],0,[sx,.01,sz]);}
  // Hangar cargo, kept to the walls and clear of the ship, the boarding point and the route.
  for(const [key,x,z,yaw] of [['crate-tarp',-15.6,-21,0],['case-ribbed',-15.9,-18.4,.2],['case',-14.6,-18.2,0],['case',-15.9,-16.9,.4],['drum',-14.4,-16.6,0],['drum',-14.1,-15.9,0],
   ['chest',-16.6,-1,Math.PI/2],['case-ribbed',-15.6,1.6,0],['case',-14.3,1.9,.3],['access-point',-12.8,3.2,Math.PI],['computer',-11.6,3.1,Math.PI],
   ['crate-tarp',15.4,-23.2,0],['case',13.2,-24.6,0],['drum',12.2,-24.3,0],['chest',16.6,-6,-Math.PI/2],['case-ribbed',15.9,-3.4,0],['drum',16.4,-1.8,0],['access-point',12.8,3.2,Math.PI]])
   put(key,[x,0,z],yaw,null);
  // Living area: personal kit by the lockers.
  for(const [key,x,z,yaw] of [['case',-14.4,18.9,.2],['case-ribbed',-13.3,18.9,0]])put(key,[x,0,z],yaw,null);
  // The outfitter: stock on the shelves (meridian-interior.js props) and on the counter.
  for(const z of F.store.shelves)for(const [y,dz,key] of [[.12,-.6,'ammo-case'],[.12,.6,'ammo-case'],[.9,-.5,'ammo-case'],[.9,.6,'ammo-case'],[1.68,-.4,'ammo-case'],[1.68,.65,'ammo-case']])put(key,[F.store.shelfX-.2,y,z+dz],Math.PI/2+(dz>0?.15:-.1),null);
  for(const dz of [-1.5,1.5])put('ammo-case',[F.store.x,.94,F.store.z+dz],Math.PI/2,null);
  // The hall: supplies stacked at the bar's far end and service drums in the corner by the windows.
  for(const [key,x,z,yaw] of [['crate-tarp',-14.6,60.6,0],['drum',-12.9,61,0],['drum',14.6,61,0],['case',15,41.2,.3]])put(key,[x,0,z],yaw,null);
  return out;
 }
 function measure(container){
  const r=container.instantiateModelsToScene(n=>'measure-'+n,false,{doNotInstantiate:true}),node=r.rootNodes[0];
  node.computeWorldMatrix(true);const {min,max}=node.getHierarchyBoundingVectors(true);
  r.rootNodes.forEach(n=>n.dispose());r.animationGroups.forEach(g=>g.dispose());r.skeletons.forEach(s=>s.dispose());
  return {center:min.add(max).scale(.5),size:max.subtract(min),min};
 }
 // containers: {key: AssetContainer}. Returns the dressing node.
 function apply(scene,parent,containers){
  const B=BABYLON,skin=new B.TransformNode('meridian-interior-kit',scene);skin.parent=parent;
  const info=Object.fromEntries(pieces.map(k=>[k,measure(containers[k])]));
  // Same treatment as the exterior cladding: the free kit's near-black metal is tinted to Meridian's
  // painted graphite and made matte, so the rooms read as the same station.
  for(const [k,c] of Object.entries(containers))for(const m of c.materials)if(m.albedoColor&&!m.metadata?.meridianTint){
   const v=tint[k]??1.8;m.albedoColor=new B.Color3(v,v*1.01,v*1.05);m.metallic=.3;m.roughness=Math.max(m.roughness??.6,.5);m.maxSimultaneousLights=8;m.metadata={...m.metadata,meridianTint:true};}
  const matrices=Object.fromEntries(pieces.map(k=>[k,[]]));
  for(const p of plan()){
   const s=info[p.key];
   // Fitted pieces are scaled to their bay; props keep their real size and stand on the floor.
   const scale=p.size?new B.Vector3(p.size[0]/Math.max(s.size.x,.001),p.size[1]/Math.max(s.size.y,.001),p.size[2]/Math.max(s.size.z,.001)):new B.Vector3(1,1,1);
   if(p.size&&s.size.y<.02)scale.y=1;
   const y=p.size?p.position[1]:p.position[1]+s.size.y/2;
   matrices[p.key].push(B.Matrix.Compose(scale,B.Quaternion.RotationYawPitchRoll(p.yaw,0,0),new B.Vector3(p.position[0],y,p.position[2])));
  }
  for(const [key,list] of Object.entries(matrices)){
   if(!list.length)continue;
   const r=containers[key].instantiateModelsToScene(n=>'ikit-'+key+'-'+n,false,{doNotInstantiate:true}),rootNode=r.rootNodes[0];
   root.VoidAssets.ownInstance(r,skin);
   rootNode.position.subtractInPlace(info[key].center);rootNode.computeWorldMatrix(true);
   const data=new Float32Array(list.length*16);list.forEach((m,i)=>m.copyToArray(data,i*16));
   for(const mesh of rootNode.getChildMeshes(false)){
    if(!mesh.getTotalVertices())continue;
    mesh.computeWorldMatrix(true);mesh.setParent(null);mesh.bakeCurrentTransformIntoVertices();mesh.parent=skin;
    mesh.thinInstanceSetBuffer('matrix',data,16,true);mesh.thinInstanceRefreshBoundingInfo(false);mesh.isPickable=false;mesh.checkCollisions=false;
   }
   rootNode.dispose();r.animationGroups.forEach(g=>g.dispose());
  }
  skin.metadata={pieces:Object.fromEntries(Object.entries(matrices).map(([k,v])=>[k,v.length]))};
  return skin;
 }
 function definitions(prefix){return Object.fromEntries(pieces.map(k=>[prefix+k,{src:dir+k+'.glb',scale:1}]));}
 // Uses containers already loaded under prefix (asset-pipeline.js); null if any is missing.
 function dress(scene,parent,prefix){
  const containers={};for(const k of pieces){const c=root.VoidAssets?.container(prefix+k);if(!c)return null;containers[k]=c;}
  try{return apply(scene,parent,containers);}catch(error){console.warn('[VOID Meridian interior kit]',error.message);return null;}
 }
 const api={pieces,plan,definitions,dress,apply};
 if(typeof module!=='undefined')module.exports=api;else root.VoidMeridianInteriorKit=api;
})(globalThis);
