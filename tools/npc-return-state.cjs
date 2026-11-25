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
 let route=[],signature=null,last=null;
 const clear=()=>{route=[];signature=null;};
 const snapshot=(status,reason,waypoint)=>({status,reason,waypoint:waypoint?copy(waypoint):null,lastObserved:last?{area:last.area,...copy(last)}:null});
 function update({position,area,destination,sceneLoaded=true,preempted=false,options={}}={}){
  if(!sceneLoaded||preempted){clear();return snapshot('paused',!sceneLoaded?'scene-unloaded':'priority-interaction');}
  const legal=(p,a)=>{if(!point(p)||!A.get(a))return false;const c=A.check(p,a,undefined,options);return c.ok&&c.area===a;};
  if(!legal(position,area)){clear();return snapshot('hold','invalid-observed-position');}
  last={area,...copy(position)};
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
  return snapshot('walking','verified-next-leg',route[0]);
 }
 return {update,reset(){clear();last=null;}};
}
module.exports={createReturnTracker};
