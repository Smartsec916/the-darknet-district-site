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
  const hangarRows=[['wall-band',0,3,.22],['wall-panel',3,4,.32],['wall-cables',7,1.9,.3]];
  // Hangar H01: both side walls, the back wall either side of the corridor, the mouth's jambs.
  face(17.7,-25.7,17.7,3.7,'-x',hangarRows);face(-17.7,-25.7,-17.7,3.7,'+x',hangarRows);
  face(4.3,3.7,17.7,3.7,'-z',hangarRows);face(-17.7,3.7,-4.3,3.7,'-z',hangarRows);
  face(10.3,-25.7,17.7,-25.7,'+z',hangarRows);face(-17.7,-25.7,-10.3,-25.7,'+z',hangarRows);
  for(const s of [-1,1])for(let z=-22;z<=2;z+=8)put('column',[s*17.3,4.5,z],s>0?0:Math.PI,[.5,9,.95]);
  // The corridor to the concourse.
  face(3.7,4.3,3.7,17.7,'-x',[['wall-band',0,3,.2],['wall-cables',3,1.9,.28]]);face(-3.7,4.3,-3.7,17.7,'+x',[['wall-band',0,3,.2],['wall-cables',3,1.9,.28]]);
  for(const z of [7,11,15])put('pipes',[0,4.55,z],Math.PI/2,[4,.6,.8]);
  // Concourse: the entry wall either side of the corridor, and the crew rooms' fronts.
  const commerceRows=[['wall-band',0,3,.22],['wall-panel',3,2.9,.3]];
  face(4.3,18.3,17.7,18.3,'+z',commerceRows);face(-17.7,18.3,-4.3,18.3,'+z',commerceRows);
  face(10.2,45.8,17.7,45.8,'-z',commerceRows);face(-17.7,45.8,-10.2,45.8,'-z',commerceRows);
  // Decks: dark plates in the hangar, squared plates in the concourse.
  for(let x=-16;x<=16;x+=4)for(let z=-23.5;z<=2;z+=3.75)put('floor-plates',[x,.025,z],0,[4,.01,3.75]);
  for(let x=-16;x<=16;x+=4)for(let z=20;z<=44;z+=4)put('floor-squares',[x,.025,z],0,[4,.01,4]);
  // Hangar cargo, kept to the walls and clear of the ship, the boarding point and the route.
  for(const [key,x,z,yaw] of [['crate-tarp',-15.6,-21,0],['case-ribbed',-15.9,-18.4,.2],['case',-14.6,-18.2,0],['case',-15.9,-16.9,.4],['drum',-14.4,-16.6,0],['drum',-14.1,-15.9,0],
   ['chest',-16.6,-1,Math.PI/2],['case-ribbed',-15.6,1.6,0],['case',-14.3,1.9,.3],['access-point',-12.8,3.2,Math.PI],['computer',-11.6,3.1,Math.PI],
   ['crate-tarp',15.4,-23,0],['case',16.2,-20.6,0],['case',16.2,-19.5,.2],['drum',15,-20.3,0],['chest',16.6,-6,-Math.PI/2],['case-ribbed',15.9,-3.4,0],['drum',16.4,-1.8,0],['access-point',12.8,3.2,Math.PI]])
   put(key,[x,0,z],yaw,null);
  // The outfitter: stock on the four existing shelves (meridian-interior.js props) and the counter.
  for(const z of [22,25,28,31])for(const [y,dz,key] of [[.12,-.7,'ammo-case'],[.12,.6,'ammo-case'],[.9,-.6,'ammo-case'],[.9,.7,'ammo-case'],[1.68,-.4,'ammo-case'],[1.68,.75,'ammo-case']])put(key,[-16.2,y,z+dz],Math.PI/2+(dz>0?.15:-.1),null);
  for(const [x,y] of [[-12.6,1.15],[-9.4,1.15]])put('ammo-case',[x,y,29],0,null);
  return out;
 }
 function measure(container){
  const r=container.instantiateModelsToScene(n=>'measure-'+n,false,{doNotInstantiate:true}),node=r.rootNodes[0];
  node.computeWorldMatrix(true);const {min,max}=node.getHierarchyBoundingVectors(true);
  r.rootNodes.forEach(n=>n.dispose());r.animationGroups.forEach(g=>g.dispose());
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
