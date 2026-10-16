/* Meridian's exterior clad with Quaternius "Modular Sci-Fi
   MegaKit" pieces (CC0). The station's layout, silhouette, solar arrays, tanks, docking collar,
   windows and labels stay exactly as VoidMeridian.build makes them; this only adds a skin of real
   modelled panels, deck plates, structural columns and roof machinery over the plain hull boxes, using
   the same design data (VoidMeridian.design), so the menu, campaign and skirmish stay identical.
   Pieces are instanced (one draw call per piece type) and frozen in place. */
(function(root){
 'use strict';
 // Piece keys -> MegaKit model files (ids from tools/assets/import-models.cjs).
 const pieces={
  wall:'walls-shortwall-metal2-straight',wallDark:'walls-shortwall-darkmetal2-straight',wallBand:'walls-shortwall-band2-straight',wallCables:'walls-topcables-straight',
  deck:'platforms-platform-metal2',
  rib:'columns-column-large-straight',pipes:'props-prop-pipeholder',vent:'props-prop-vent-big',light:'props-prop-light-wide'
 };
 // Measured once per piece: centre and size of its geometry, so any piece can be fitted to a cell.
 function measure(container){
  const r=container.instantiateModelsToScene(n=>'measure-'+n,false,{doNotInstantiate:true}),node=r.rootNodes[0];
  node.computeWorldMatrix(true);const {min,max}=node.getHierarchyBoundingVectors(true);
  r.rootNodes.forEach(n=>n.dispose());r.animationGroups.forEach(g=>g.dispose());
  return {center:min.add(max).scale(.5),size:max.subtract(min)};
 }
 /* containers: {pieceKey: AssetContainer}. Returns the skin node. occupied: the campaign hides H01
    and anything overlapping the walkable interior, exactly as the builder does. */
 function apply(scene,parent,design,containers,{occupied=false}={}){
  const B=BABYLON,skin=new B.TransformNode('meridian-kitbash',scene);skin.parent=parent;
  const sizes=Object.fromEntries(Object.keys(containers).map(k=>[k,measure(containers[k])]));
  // The free kit's textures are near-black and mostly metallic; tint them up to Meridian's graphite
  // and make them painted rather than bare metal, so the cladding reads as the same hull.
  for(const c of Object.values(containers))for(const m of c.materials)if(m.albedoColor&&!m.metadata?.meridianTint){
   m.albedoColor=new B.Color3(2.6,2.65,2.75);m.metallic=.25;m.roughness=Math.max(m.roughness??.6,.55);m.metadata={...m.metadata,meridianTint:true};}
  // Placements are collected as matrices and drawn as thin instances: one draw call per piece mesh
  // instead of thousands of objects (1,400+ pieces cost ~13 ms a frame as separate instances).
  const matrices=Object.fromEntries(Object.keys(containers).map(k=>[k,[]]));let count=0;
  // Places a piece so its geometry fills a box of the given size at a centre, turned by yaw.
  function place(key,center,cell,yaw=0){
   const m=sizes[key];if(!m)return;
   const scale=new B.Vector3(cell[0]&&m.size.x>.05?cell[0]/m.size.x:1,cell[1]&&m.size.y>.05?cell[1]/m.size.y:1,cell[2]&&m.size.z>.05?cell[2]/m.size.z:1);
   matrices[key].push(B.Matrix.Compose(scale,B.Quaternion.RotationAxis(B.Axis.Y,yaw),new B.Vector3(...center)));count++;
  }
  // One template per piece: its meshes are cloned into the scene, centred, and their glTF root
  // transform baked into the vertices, so each placement matrix applies directly.
  function build(){
   for(const [key,list] of Object.entries(matrices)){
    if(!list.length)continue;
    const r=containers[key].instantiateModelsToScene(n=>'kit-'+key+'-'+n,false,{doNotInstantiate:true}),rootNode=r.rootNodes[0];
    rootNode.position.subtractInPlace(sizes[key].center);rootNode.computeWorldMatrix(true);
    const data=new Float32Array(list.length*16);list.forEach((mat,i)=>mat.copyToArray(data,i*16));
    for(const mesh of rootNode.getChildMeshes(false)){
     if(!mesh.getTotalVertices())continue;
     mesh.computeWorldMatrix(true);mesh.setParent(null);mesh.bakeCurrentTransformIntoVertices();mesh.parent=skin;
     mesh.thinInstanceSetBuffer('matrix',data,16,true);mesh.thinInstanceRefreshBoundingInfo(false);mesh.isPickable=false;
    }
    rootNode.dispose();r.animationGroups.forEach(g=>g.dispose());
   }
  }
  const inside=(p,s)=>occupied&&Math.abs(p[0])<18+s[0]/2&&p[2]+s[2]/2>-26&&p[2]-s[2]/2<66&&p[1]+s[1]/2>0&&p[1]-s[1]/2<9;
  // Panels in rows on one vertical face. axis 'x': face normal along x (panel length runs along z).
  function face(center,length,height,axis,sign,top){
   const cols=Math.max(1,Math.ceil(length/4)),rows=Math.max(1,Math.ceil(height/2)),cw=length/cols,rh=height/rows,yaw=axis==='x'?(sign>0?0:Math.PI):(sign>0?-Math.PI/2:Math.PI/2);
   for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
    const along=-length/2+cw*(c+.5),y=center[1]-height/2+rh*(r+.5);
    const key=r===rows-1&&top?'wallCables':r===0?'wallDark':(c+r)%3===0?'wallBand':'wall';
    const p=axis==='x'?[center[0]+sign*.08,y,center[2]+along]:[center[0]+along,y,center[2]+sign*.08];
    place(key,p,[0,rh,cw],yaw);
   }
  }
  // Deck plates over a roof, with some machinery.
  function roof(center,w,d,clutter){
   // One plain deck plate everywhere (David, 2026-10-16: plainer roofs, fewer patterns).
   const cols=Math.max(1,Math.ceil(w/4)),rows=Math.max(1,Math.ceil(d/4)),cw=w/cols,cd=d/rows;
   for(let i=0;i<cols;i++)for(let j=0;j<rows;j++)place('deck',[center[0]-w/2+cw*(i+.5),center[1]+.06,center[2]-d/2+cd*(j+.5)],[cw,0,cd]);
   for(let k=0;k<clutter;k++){const x=center[0]-w*.35+(k%3)*w*.35,z=center[2]-d*.3+Math.floor(k/3)*d*.3;
    place(k%2?'vent':'pipes',[x,center[1]+(k%2?.1:.5),z],[0,0,0],k%2?0:Math.PI/2);place('light',[x+1.5,center[1]+.12,z+1.2],[0,0,0]);}
  }
  function clad(center,size,{front=true,back=true,sides=true,top=true,clutter=2,roofTop=null}={}){
   const [w,h,d]=size;
   if(sides)for(const s of [-1,1])face([center[0]+s*w/2,center[1],center[2]],d,h,'x',s,true);
   if(back)face([center[0],center[1],center[2]+d/2],w,h,'z',1,true);
   if(front)face([center[0],center[1],center[2]-d/2],w,h,'z',-1,true);
   if(top)roof([center[0],roofTop??center[1]+h/2,center[2]],w,d,clutter);
  }
  // Hangars: walls, back and roof (the mouth stays open), plus full-height structural ribs.
  for(const g of design.hangars){
   if(occupied&&g.id==='H01')continue;
   clad([g.x,g.h/2,g.z],[g.w+.8,g.h,g.d],{front:false,clutter:3,roofTop:g.h+.45});
   for(const s of [-1,1])for(let z=-g.d/2;z<g.d/2;z+=8)place('rib',[g.x+s*(g.w/2+.9),g.h/2,g.z+z],[0,g.h+1,0]);
  }
  for(const m of design.modules){if(inside(m.position,m.size))continue;clad(m.position,m.size,{clutter:m.size[0]>40?6:2});}
  build();
  skin.metadata={pieces:count,source:'Quaternius Modular Sci-Fi MegaKit (CC0)'};
  return skin;
 }
 // Model definitions to load under an id prefix (e.g. 'kit:' in the game scene, 'menu-kit:' in the menu).
 function definitions(prefix){const kit=root.VoidAssets?.models?.kit||{};return Object.fromEntries(Object.keys(pieces).filter(k=>kit[k]).map(k=>[prefix+k,kit[k]]));}
 // Clads the station if every piece is loaded; otherwise leaves the plain hull (never half-clad).
 function dress(scene,parent,prefix,options={}){
  const containers={};for(const k of Object.keys(pieces)){const c=root.VoidAssets?.container(prefix+k);if(!c)return null;containers[k]=c;}
  try{return apply(scene,parent,root.VoidMeridian.design,containers,options);}catch(error){console.warn('[VOID Meridian cladding]',error.message);return null;}
 }
 // For a scene that outlives the game's shared model cache (the main menu): loads its own copies of
 // the pieces, freed when that scene is disposed. Returns the skin, or null if anything failed.
 async function dressOwned(scene,parent,task,options={}){
  const kit=root.VoidAssets?.models?.kit||{},containers={};
  try{
   for(const k of Object.keys(pieces)){if(!kit[k])return null;containers[k]=await root.VoidAssets.loadContainer(kit[k],scene,task,'meridian-kit:'+k);}
   scene.onDisposeObservable.add(()=>{for(const c of Object.values(containers))c.dispose();});
   return apply(scene,parent,root.VoidMeridian.design,containers,options);
  }catch(error){for(const c of Object.values(containers))c.dispose();if(task?.signal?.aborted)throw error;console.warn('[VOID Meridian cladding]',error.message);return null;}
 }
 const api={pieces,apply,definitions,dress,dressOwned};
 if(typeof module!=='undefined')module.exports=api;else root.VoidMeridianKitbash=api;
})(globalThis);
