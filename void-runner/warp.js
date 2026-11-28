/* Serializable route checkpoints. Encounters have a type so later events need no new route loop. */
(function(root){
 const U=typeof module!=='undefined'?require('./universe.js'):root.VoidUniverse;
 const config={skyPitch:18*Math.PI/180,alignmentCos:Math.cos(8*Math.PI/180),hold:3,departureSeconds:4,warpSeconds:U.route('meridian','kepler').seconds,destinationRevealSeconds:8,decelerationSeconds:3,approachSeconds:3,interruption:.42,interdictionRange:240,interdictionArc:.9};
 function direction(origin,destination){return skyward(origin,U.direction(origin,destination)||{x:0,y:0,z:1});}
 function create(origin,destination,mission,encounter=false){const policy=U.route(origin,destination);encounter=encounter&&policy.interdiction;return {policy,origin,destination,mission:mission||null,progress:0,phase:U.locations[origin]?.type==='arrival'?'align':'departure',departure:0,aligned:0,encounter:{type:encounter?'combat':'none',state:encounter?'pending':'cleared'},vector:direction(origin,destination)};}
 // Leaving a planet the jump point is up in the sky, never on the horizon behind the mountains.
 function skyward(origin,v){
  const y=-Math.sin(config.skyPitch);
  if(!U.planetside(origin)||v.y<=y)return v;
  const horizontal=Math.hypot(v.x,v.z),c=Math.cos(config.skyPitch);
  return horizontal?{x:v.x*c/horizontal,y,z:v.z*c/horizontal}:{x:0,y,z:c};
 } // Flight space has +Y pointing down.
 function restore(raw,origin,destination,mission,encounter){
  const r=create(origin,destination,mission,encounter);
  if(!raw||raw.origin!==origin||raw.destination!==destination||raw.mission!==r.mission)return r;
  if(!Number.isFinite(raw.progress)||raw.progress<0||raw.progress>1)return r;
  r.progress=raw.progress;if(raw.progress>0)r.phase='align';
  // A combat checkpoint restarts its encounter with repaired hull; never silently skips enemies.
  if(r.policy.interdiction&&encounter&&raw.encounter?.state==='cleared'&&r.progress>=config.interruption){
   r.encounter.state='cleared';
   if(raw.encounter.evaded===true)r.encounter.evaded=true;
  }
  else if(r.policy.interdiction&&encounter&&r.progress>=config.interruption){r.phase='encounter';r.encounter.state='active';}
  return r;
 }
 const canSpool=r=>r?.phase==='align'||r?.phase==='encounter';
 const aligned=(r,forward)=>forward.x*r.vector.x+forward.y*r.vector.y+forward.z*r.vector.z>=config.alignmentCos;
 function interrupt(r,held){
  if(!canSpool(r))return false;
  const charging=r.aligned>0;
  r.aligned=0;
  if(held)r.spoolInterrupted=true;
  return charging;
 }
 function step(r,dt,forward,clear=false,{held=false,escape=false,seconds=config.hold}={}){
  const before=r.phase;dt=Math.max(0,Math.min(.25,dt));
  if(!held)r.spoolInterrupted=false;
  if(r.phase==='departure'){
   r.departure+=dt;
   if(r.departure>=config.departureSeconds)r.phase='align';
  }else if(canSpool(r)){
   if(r.phase==='encounter'&&clear){
    r.encounter.state='cleared';
    r.phase='align';
   }
   if(r.recharge>0){
    r.recharge=Math.max(0,r.recharge-dt);
    r.aligned=0;
   }else{
    const available=r.phase==='align'||escape;
    r.aligned=available&&held&&!r.spoolInterrupted&&aligned(r,forward)?Math.min(seconds,r.aligned+dt):0;
    if(r.aligned>=seconds){
     if(r.phase==='encounter'){
      r.encounter.state='cleared';
      r.encounter.evaded=true;
     }
     r.phase='warp';
    }
   }
  }else if(r.phase==='warp'){
   r.progress=Math.min(1,r.progress+dt/(r.policy?.seconds||config.warpSeconds));
   if(r.encounter.state==='pending'&&r.progress>=config.interruption){
    r.progress=config.interruption;r.encounter.state='active';r.phase='encounter';r.aligned=0;r.spoolInterrupted=held;
   }else if(r.progress>=1)r.phase='arrived';
  }
  return before!==r.phase;
 }
 // An interdiction wave is already in the scene when the drop-out lands: fanned out ahead at long range,
 // inside radar range (280) but outside enemy weapons range (165), so the ships are seen closing in.
 function interdictionPoint(index,count,basis,range=config.interdictionRange){const n=Math.max(1,Math.floor(count)||1),i=((Math.floor(index)||0)%n+n)%n,yaw=n>1?(i/(n-1)-.5)*config.interdictionArc:0,pitch=n>1?(i%2?.07:-.07):0,f=basis.f,r=basis.r,u=basis.u,a=Math.cos(yaw)*Math.cos(pitch)*range,b=Math.sin(yaw)*Math.cos(pitch)*range,c=Math.sin(pitch)*range;return {x:f.x*a+r.x*b+u.x*c,y:f.y*a+r.y*b+u.y*c,z:f.z*a+r.z*b+u.z*c};}
 const api={config,create,restore,step,canSpool,aligned,interrupt,direction,skyward,interdictionPoint};if(typeof module!=='undefined')module.exports=api;else root.VoidWarp=api;
})(globalThis);
