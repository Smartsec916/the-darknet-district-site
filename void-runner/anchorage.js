/* TESSALY BELT ANCHORAGE exterior (docs/development/UNIVERSE_GRAPHICS_TRACKER.md). PRESENTATION ONLY.
   The Anchorage is built on the shared Meridian-class hull (meridian-station.js + station-kit.js). This adds the belt-industrial identity behind and around it: one modelled
   scene (tools/assets/universe/build_anchorage.py, assets/models/anchorage/anchorage-belt.glb) with a hollowed asteroid holding a cargo and ore-processing deck, gantry cranes, hoppers,
   floodlight masts, mooring cables from the station's rear spine, a service gantry and drifting belt rock. It is parented to the station exterior, so it follows the hull through docking and
   departure, stands clear of the hangar mouths and the approach, and has no collision or pick meshes. Low quality keeps the plain hull; a failed load adds nothing. */
(function(root){
 'use strict';
 const ID='anchorage:belt',SRC='assets/models/anchorage/anchorage-belt.glb',api={ID,SRC};
 // Scenery sets for the other Meridian-class hulls (tools/assets/universe/build_erebus.py): Meridian's orbital ring and docking spars, Rusthaven's salvage yard, the Foundry's smelter stacks and reactor.
 const SETS={'sol-belt':{id:ID,src:SRC},meridian:{id:'station:meridian-set',src:'assets/models/stations/meridian-surroundings.glb'},rusthaven:{id:'station:rusthaven-set',src:'assets/models/stations/rusthaven-surroundings.glb'},foundry:{id:'station:foundry-set',src:'assets/models/stations/foundry-surroundings.glb'},vigil:{id:'station:vigil-set',src:'assets/models/stations/vigil-surroundings.glb'},holdfast:{id:'station:holdfast-set',src:'assets/models/stations/holdfast-surroundings.glb'}};
 const applies=(id,quality)=>!!SETS[id]&&quality!=='low';
 api.models=(id,quality)=>applies(id,quality)?{[SETS[id].id]:{src:SETS[id].src,scale:1}}:{};
 api.dress=({scene,parent,id,quality,instance})=>{
  if(!applies(id,quality)||!parent)return null;
  const node=instance?.(SETS[id].id,parent);if(!node)return null;
  node.name=id==='sol-belt'?'anchorage-belt':id+'-surroundings';
  // Two working lights over the cargo deck (the deck and rigs sit in the asteroid's own shadow); parented to the model, so they go with it.
  if(id!=='sol-belt'){for(const m of node.getChildMeshes(false)){m.isPickable=false;m.checkCollisions=false;}return node;}
  const B=root.BABYLON,deck=[[15,16,98,'#ffcf8a',90],[15,16,112,'#cfe3ff',70]];
  for(const [x,y,z,hex,range] of deck){const l=new B.PointLight('anchorage-deck-light',new B.Vector3(x,y,z),scene);l.diffuse=B.Color3.FromHexString(hex);l.specular=l.diffuse;l.intensity=1.6;l.range=range;l.parent=node;}
  for(const m of node.getChildMeshes(false)){m.isPickable=false;m.checkCollisions=false;}
  return node;
 };
 if(typeof module!=='undefined')module.exports=api;else root.VoidAnchorage=api;
})(globalThis);
