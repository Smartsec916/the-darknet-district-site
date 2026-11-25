'use strict';
// Developer-only reference tracker: no actor movement or gate authorization.
// Use one per NPC/session and call at bounded planning cadence. The eventual
// runtime adapter supplies observed canonical coordinates and owns movement.
const A=require('../void-runner/npc-areas.js');
const {preflight,validateCandidate}=require('./npc-return-route.cjs');
const point=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.z);
const copy=p=>({x:p.x,z:p.z});
const near=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z)<=.025;
function createReturnTracker(){
 let route=[],signature=null,last=null,lastStop=null,anchor=null;
 const clear=()=>{route=[];signature=null;anchor=null;};
 const snapshot=(status,reason,waypoint)=>({status,reason,waypoint:waypoint?copy(waypoint):null,lastObserved:last?{area:last.area,...copy(last)}:null,lastLegalStop:lastStop?{area:lastStop.area,...copy(lastStop)}:null});
 function update({position,area,destination,sceneLoaded=true,preempted=false,options={}}={}){
  if(!sceneLoaded||preempted){clear();return snapshot('paused',!sceneLoaded?'scene-unloaded':'priority-interaction');}
  options={...options,passing:false};
  const legal=(p,a)=>{if(!point(p)||!A.get(a))return false;const c=A.check(p,a,undefined,options);return c.ok&&c.area===a;};
  if(!legal(position,area)){
   // A verified leg may pass through a doorway or narrower clearance where
   // stopping is illegal. Only continue that exact already-authorized leg.
   const next=route[0],sig=destination&&JSON.stringify([destination.key,destination.area,destination.x,destination.z]);
   const transit=point(position)&&anchor&&next&&A.get(area)&&last?.area===area&&sig===signature&&legal(destination,area)&&legal(next,area);
   if(transit){
    const dx=next.x-anchor.x,dz=next.z-anchor.z,l2=dx*dx+dz*dz;
    const t=l2?((position.x-anchor.x)*dx+(position.z-anchor.z)*dz)/l2:-1;
    const c=A.check(position,area,A.CLEAR-.1,{...options,passing:true});
    if(t>=0&&t<=1&&near(position,{x:anchor.x+t*dx,z:anchor.z+t*dz})&&c.ok&&c.area===area&&!A.leg(position,next,options).length){
     last={area,...copy(position)};return snapshot('walking','verified-transit-leg',next);
    }
   }
   clear();return snapshot('hold','invalid-observed-position');
  }
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
module.exports={createReturnTracker};
