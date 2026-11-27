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
  parent.metadata={...(parent.metadata||{}),art:{dispose(){api.active=false;scene.clearColor=prev.clear;scene.fogMode=prev.mode;scene.fogDensity=prev.density;scene.fogColor=prev.color;}}};
  return node;
 };
 if(typeof module!=='undefined')module.exports=api;else root.VoidVantor=api;
})(globalThis);
