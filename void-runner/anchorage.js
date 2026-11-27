/* TESSALY BELT ANCHORAGE exterior (docs/development/UNIVERSE_GRAPHICS_TRACKER.md). PRESENTATION ONLY.
   The Anchorage is built on the shared Meridian-class hull (meridian-station.js + station-kit.js). This adds the belt-industrial identity behind and around it: one modelled
   scene (tools/assets/universe/build_anchorage.py, assets/models/anchorage/anchorage-belt.glb) with a hollowed asteroid holding a cargo and ore-processing deck, gantry cranes, hoppers,
   floodlight masts, mooring cables from the station's rear spine, a service gantry and drifting belt rock. It is parented to the station exterior, so it follows the hull through docking and
   departure, stands clear of the hangar mouths and the approach, and has no collision or pick meshes. Low quality keeps the plain hull; a failed load adds nothing. */
(function(root){
 'use strict';
 const ID='anchorage:belt',SRC='assets/models/anchorage/anchorage-belt.glb',api={ID,SRC};
 const applies=(id,quality)=>id==='sol-belt'&&quality!=='low';
 api.models=(id,quality)=>applies(id,quality)?{[ID]:{src:SRC,scale:1}}:{};
 api.dress=({scene,parent,id,quality,instance})=>{
  if(!applies(id,quality)||!parent)return null;
  const node=instance?.(ID,parent);if(!node)return null;
  node.name='anchorage-belt';
  // Two working lights over the cargo deck (the deck and rigs sit in the asteroid's own shadow); parented to the model, so they go with it.
  const B=root.BABYLON,deck=[[15,16,98,'#ffcf8a',90],[15,16,112,'#cfe3ff',70]];
  for(const [x,y,z,hex,range] of deck){const l=new B.PointLight('anchorage-deck-light',new B.Vector3(x,y,z),scene);l.diffuse=B.Color3.FromHexString(hex);l.specular=l.diffuse;l.intensity=1.6;l.range=range;l.parent=node;}
  for(const m of node.getChildMeshes(false)){m.isPickable=false;m.checkCollisions=false;}
  return node;
 };
 if(typeof module!=='undefined')module.exports=api;else root.VoidAnchorage=api;
})(globalThis);
