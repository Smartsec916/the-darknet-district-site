/* Old Town crossing choreography. Distances and cab positions use the road network's metres. */
(function(root){
 'use strict';
 const rules=typeof module==='undefined'?root.VoidRoadTaxiRules:require('./road-taxi-rules.js');
 const crossings=typeof module==='undefined'?root.VoidCrosswalks:require('./crosswalks.js');

 function plan(world,id,delay,privateTest=false){
  const crossing=crossings.get(id);
  if(!crossing||crossing.quarter!==world?.quarter||crossing.axis!=='x')return null;
  const west=crossing.ends[0],east=crossing.ends[1];
  const path=crossings.crossing({x:west[0],z:west[1]},{x:east[0],z:east[1]},{quarter:world.quarter});
  if(path?.c.id!==id)return null;
  for(const taxi of world.taxis){
   if(taxi.phase!=='cruise'||!taxi.loop||world.job?.cab===taxi)continue;
   const lane=rules.projectPath(taxi.path,{x:crossing.band[0],z:crossing.at});
   const ahead=(lane.s-taxi.s+taxi.pathLen)%taxi.pathLen;
   if(!privateTest&&(ahead<rules.SPEC.cruise*5||ahead>rules.SPEC.cruise*10))continue;
   const seconds=privateTest?delay:ahead/Math.max(.1,taxi.speed);
   const start=privateTest?(lane.s-rules.SPEC.cruise*seconds+taxi.pathLen)%taxi.pathLen:taxi.s;
   const distance=(lane.s-start+taxi.pathLen)%taxi.pathLen;
   return {taxi,start,seconds,distance,hit:{x:lane.x,z:lane.z},entry:path.entry,drop:{x:lane.x-1.65,z:lane.z+.45}};
  }
  return null;
 }

 function preparePrivate(plan){
  const taxi=plan.taxi,pose=rules.pointAlong(taxi.path,plan.start,true);
  Object.assign(taxi,{s:pose.s,x:pose.x,z:pose.z,yaw:pose.yaw,speed:rules.SPEC.cruise});
 }

 function walking(plan,elapsed){
  const t=Math.min(plan.seconds,Math.max(0,elapsed));
  const crossTime=Math.min(plan.seconds,Math.hypot(plan.hit.x-plan.entry.x,plan.hit.z-plan.entry.z)/1.65);
  const approach=plan.seconds-crossTime;
  if(t<approach)return {x:plan.entry.x,z:plan.entry.z-(approach-t)*1.35,yaw:0};
  const progress=crossTime?(t-approach)/crossTime:1;
  return {x:plan.entry.x+(plan.hit.x-plan.entry.x)*progress,z:plan.entry.z+(plan.hit.z-plan.entry.z)*progress,yaw:Math.PI/2};
 }
 function cardPose(plan,elapsed){
  const t=Math.max(0,Math.min(1,elapsed/.85)),drop=plan.drop;
  return {x:plan.hit.x+(drop.x-plan.hit.x)*t,z:plan.hit.z+(drop.z-plan.hit.z)*t,
   y:Math.max(.004,1.02*(1-t)+.27*Math.sin(Math.PI*t)),spin:t*Math.PI*4};
 }
 function crossingProgress(plan){
  const taxi=plan.taxi;
  const travelled=(taxi.s-plan.start+taxi.pathLen)%taxi.pathLen;
  return Math.min(1,travelled/Math.max(.001,plan.distance));
 }
 const api={plan,preparePrivate,walking,cardPose,crossingProgress};
 if(typeof module!=='undefined')module.exports=api;
 root.VoidChanceCrossing=api;
})(globalThis);
