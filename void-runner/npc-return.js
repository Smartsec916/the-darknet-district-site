/* Shared verified ordinary NPC return planner. Node tests and browser use the
   same implementation; it does not grant gate access or change mission state. */
(function(root){
'use strict';
function createReturnTools(A,E){
const point=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.z);
const copy=p=>({x:p.x,z:p.z});
const hold=reason=>({status:'hold',reason,points:[]});
function validateCandidate(from,to,area,points,opts={}){
 if(!point(from)||!point(to)||!A.get(area))return false;
 if(![from,to].every(p=>{const c=A.check(p,area,undefined,opts);return c.ok&&c.area===area;}))return false;
 if(!Array.isArray(points)||!points.length||!points.every(point))return false;
 const end=points[points.length-1];
 if(end.x!==to.x||end.z!==to.z)return false;
 // A.leg permits passing through doorways with reduced clearance; a
 // returned waypoint must also be a legal place to stop in this area.
 if(!points.every(p=>{const c=A.check(p,area,undefined,opts);return c.ok&&c.area===area;}))return false;
 return points.every((p,i)=>A.leg(i?points[i-1]:from,p,opts).length===0);
}
function preflight(from,to,area,opts={}){
 if(!point(from)||!point(to)||!A.get(area))return hold('invalid-position-or-area');
 for(const p of [from,to]){
  const c=A.check(p,area,undefined,opts);
  if(!c.ok||c.area!==area)return hold('endpoint-not-authorized-in-area');
 }
 if(from.x===to.x&&from.z===to.z)return {status:'arrived',points:[]};
 const b=copy(to);
 const candidates=[[b],[{x:b.x,z:from.z},b],[{x:from.x,z:b.z},b]];
 for(const route of candidates)if(validateCandidate(from,to,area,route,opts))return {status:'ready',points:route.map(copy)};
 // walkRoute may produce a kerb/road shortcut or an invalid shortened leg.
 // Never use route()'s unverified straight-line fallback for autonomous return.
 const route=E.walkRoute(from,to,area,opts);
 return validateCandidate(from,to,area,route,opts)?{status:'ready',points:route.map(copy)}:hold('no-verified-pedestrian-route');
}
const near=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z)<=.025;
function createReturnTracker(){
 let route=[],signature=null,last=null,lastStop=null,anchor=null,resumeOnly=false;
 const clear=()=>{route=[];signature=null;anchor=null;resumeOnly=false;};
 const snapshot=(status,reason,waypoint)=>({status,reason,waypoint:waypoint?copy(waypoint):null,lastObserved:last?{area:last.area,...copy(last)}:null,lastLegalStop:lastStop?{area:lastStop.area,...copy(lastStop)}:null});
 function update({position,area,destination,sceneLoaded=true,preempted=false,options={}}={}){
  if(!sceneLoaded||preempted){
   // Unload is not a new movement authorization. Retain only evidence of an
   // already observed transit-only position, and issue no movement while away.
   // Priority interactions always invalidate that evidence.
   if(!preempted&&anchor&&route.length&&signature&&last&&last!==lastStop)resumeOnly=true;
   else clear();
   return snapshot('paused',!sceneLoaded?'scene-unloaded':'priority-interaction');
  }
  options={...options,passing:false};
  const legal=(p,a)=>{if(!point(p)||!A.get(a))return false;const c=A.check(p,a,undefined,options);return c.ok&&c.area===a;};
  if(!legal(position,area)){
   // A verified leg may pass through a doorway or narrower clearance where
   // stopping is illegal. Only continue that exact already-authorized leg.
   const next=route[0],sig=destination&&JSON.stringify([destination.key,destination.area,destination.x,destination.z]);
   // On re-entry require the exact retained physical observation, not an
   // inferred position anywhere else on the old leg. Recheck current geometry.
   const sameObservation=!resumeOnly||(position?.x===last?.x&&position?.z===last?.z);
   const transit=point(position)&&sameObservation&&anchor&&next&&A.get(area)&&last?.area===area&&sig===signature&&legal(destination,area)&&legal(next,area);
   if(transit){
    const dx=next.x-anchor.x,dz=next.z-anchor.z,l2=dx*dx+dz*dz;
    const t=l2?((position.x-anchor.x)*dx+(position.z-anchor.z)*dz)/l2:-1;
    const c=A.check(position,area,A.CLEAR-.1,{...options,passing:true});
    if(t>=0&&t<=1&&near(position,{x:anchor.x+t*dx,z:anchor.z+t*dz})&&c.ok&&c.area===area&&!A.leg(position,next,options).length){
     last={area,...copy(position)};resumeOnly=false;return snapshot('walking','verified-transit-leg',next);
    }
   }
   clear();return snapshot('hold','invalid-observed-position');
  }
  if(resumeOnly)clear(); // Legal re-entry replans against current geometry.
  last=lastStop={area,...copy(position)};
  if(!destination||typeof destination.key!=='string'||!destination.key||!point(destination)){clear();return snapshot('hold','no-current-routine-target');}
  if(destination.area!==area){clear();return snapshot('hold','authorized-area-transition-required');}
  if(!legal(destination,area)){clear();return snapshot('hold','invalid-routine-target');}
  const goal=copy(destination);
  const sig=JSON.stringify([destination.key,area,goal.x,goal.z]);
  if(signature!==sig){clear();signature=sig;}
  const safe=(p,q)=>validateCandidate(p,q,area,[q],options);
  if(near(position,goal)&&safe(position,goal)){clear();return snapshot('arrived','observed-at-routine-target');}
  while(route.length&&near(position,route[0])&&safe(position,route[0]))route.shift();
  // Replan from observed position if a policy change or displacement
  // invalidates the next leg. Do not resume from a stale waypoint.
  if(!route.length||!safe(position,route[0])){
   const result=preflight(position,goal,area,options);
   route=result.status==='ready'?result.points.map(copy):[];
   if(!route.length||!safe(position,route[0])){route=[];return snapshot('hold',result.reason||'no-verified-next-leg');}
  }
  anchor=copy(position);
  return snapshot('walking','verified-next-leg',route[0]);
 }
 return {update,reset(){clear();last=lastStop=null;}};
}

// Drive only a mounted actor on a same-area, verified pedestrian return.
// Long-route revalidation is bounded; each short physical stride is checked.
function createMountedReturn(){
 const tracker=createReturnTracker();let cached=null,age=Infinity,signature=null;
 function tick({position,area,destination,dt=0,speed=0,paused=false,options={}}={}){
  if(!point(position))return {status:'hold',position:null,clip:'idle'};
  const delta=Number.isFinite(dt)?Math.max(0,Math.min(dt,.1)):0;
  const velocity=Number.isFinite(speed)?Math.max(0,speed):0;
  const sig=JSON.stringify([area,destination?.key,destination?.area,destination?.x,destination?.z,!!options.adult,!!options.made]);
  age+=delta;
  if(!cached||sig!==signature||age>=.25||(cached.waypoint&&near(position,cached.waypoint))){
   cached=tracker.update({position,area,destination,options});age=0;signature=sig;
  }
  const stay=status=>({status,position:copy(position),clip:'idle'});
  if(cached.status!=='walking'||!cached.waypoint||paused||!delta||!velocity)return stay(cached.status);
  const w=cached.waypoint,dx=w.x-position.x,dz=w.z-position.z,d=Math.hypot(dx,dz);
  if(!d)return stay('walking');
  const k=Math.min(1,velocity*delta/d),next={x:position.x+dx*k,z:position.z+dz*k};
  // No invented spawn, direct-line fallback or movement into a new area.
  const c=A.check(next,area,A.CLEAR-.1,{...options,passing:true});
  if(!c.ok||c.area!==area||A.leg(position,next,options).length){
   cached={status:'hold',waypoint:null};age=0;return stay('hold');
  }
  return {status:'walking',position:next,yaw:Math.atan2(dx,dz),clip:'walk'};
 }
 return {tick};
}

return {preflight,validateCandidate,createReturnTracker,createMountedReturn};
}
if(typeof module!=='undefined'&&module.exports)module.exports={createReturnTools,...createReturnTools(require('./npc-areas.js'),require('./npc-escort.js'))};
else root.VoidNPCReturn=createReturnTools(root.VoidNPCAreas,root.VoidNPCEscort);
})(typeof globalThis!=='undefined'?globalThis:this);
