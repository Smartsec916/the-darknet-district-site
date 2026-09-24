/* Serializable route checkpoints. Encounters have a type so later events need no new route loop. */
(function(root){
 const U=typeof module!=='undefined'?require('./universe.js'):root.VoidUniverse;
 const config={alignmentCos:Math.cos(8*Math.PI/180),hold:.65,departureSeconds:4,warpSeconds:U.route('meridian','kepler').seconds,destinationRevealSeconds:8,decelerationSeconds:3,approachSeconds:3,interruption:.42};
 function create(origin,destination,mission,encounter=false){const heading={meridian:-.55,kepler:.65,undertow:-.8,foundry:.9}[destination]||.55;const policy=U.route(origin,destination);encounter=encounter&&policy.interdiction;return {policy,origin,destination,mission:mission||null,progress:0,phase:'departure',departure:0,aligned:0,encounter:{type:encounter?'combat':'none',state:encounter?'pending':'cleared'},vector:{x:Math.sin(heading),y:0,z:Math.cos(heading)}};}
 function restore(raw,origin,destination,mission,encounter){
  const r=create(origin,destination,mission,encounter);
  if(!raw||raw.origin!==origin||raw.destination!==destination||raw.mission!==r.mission)return r;
  if(!Number.isFinite(raw.progress)||raw.progress<0||raw.progress>1)return r;
  r.progress=raw.progress;if(raw.progress>0)r.phase='align';
  // A combat checkpoint restarts its encounter with repaired hull; never silently skips enemies.
  if(r.policy.interdiction&&encounter&&raw.encounter?.state==='cleared'&&r.progress>=config.interruption)r.encounter.state='cleared';
  else if(r.policy.interdiction&&encounter&&r.progress>=config.interruption){r.phase='encounter';r.encounter.state='active';}
  return r;
 }
 function step(r,dt,forward,clear=false){
  const before=r.phase;dt=Math.max(0,Math.min(.25,dt));
  if(r.phase==='departure'){r.departure+=dt;if(r.departure>=config.departureSeconds)r.phase='align';}
  else if(r.phase==='align'){
   const alignment=forward.x*r.vector.x+forward.y*r.vector.y+forward.z*r.vector.z;
   r.aligned=alignment>=config.alignmentCos?r.aligned+dt:0;
   if(r.aligned>=config.hold)r.phase='warp';
  }else if(r.phase==='warp'){
   r.progress=Math.min(1,r.progress+dt/(r.policy?.seconds||config.warpSeconds));
   if(r.encounter.state==='pending'&&r.progress>=config.interruption){r.progress=config.interruption;r.encounter.state='active';r.phase='encounter';}
   else if(r.progress>=1)r.phase='arrived';
  }else if(r.phase==='encounter'&&clear){r.encounter.state='cleared';r.phase='align';r.aligned=0;}
  return before!==r.phase;
 }
 const api={config,create,restore,step};if(typeof module!=='undefined')module.exports=api;else root.VoidWarp=api;
})(globalThis);
