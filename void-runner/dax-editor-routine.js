/* Dax editor-driven movement, pure deterministic calculation.
 * Issue #522. This module deliberately does not mutate the live actor, use
 * the legacy hourly schedule, publish a draft, or create a duplicate Dax.
 * Input is the validated/resolved NPC plan from VoidNPCPaths.planNow().
 */
(function(root){
 'use strict';
 const DEFAULT=Object.freeze({x:1.6,z:54.5,yaw:Math.PI/2,clip:'idle',device:false,
  place:'The Darknet District · no routine configured',inside:true,source:'default'});
 const SPEED=1.3,DEFAULT_SECONDS=10;
 const node=typeof module==='object'&&!!module.exports;
 const finite=n=>typeof n==='number'&&Number.isFinite(n);
 const distance=(a,b)=>Math.hypot(b.x-a.x,b.z-a.z);
 const angle=(a,b)=>Math.atan2(b.x-a.x,b.z-a.z);
 const normalizedAction=a=>{
  const s=String(a||'idle').toLowerCase();
  // The editor may give library names (asset/clip), while the private
  // npc-dax model can only play its own bundled clips.
  const name=s.split('/').pop();
  return ['idle','talk','look','watch','walk','glance-back','shrug'].includes(name)?name:'idle';
 };
 const stay=(p,seconds=0)=>{const actions=Array.isArray(p.actions)&&p.actions.length?p.actions:['idle'];
  const ix=Math.floor(Math.max(0,finite(seconds)?seconds:0)/DEFAULT_SECONDS)%actions.length;
  return {inside:true,x:p.x,z:p.z,yaw:finite(p.yaw)?p.yaw:0,
   clip:normalizedAction(actions[ix]),device:false,
   place:'Editor location',source:'editor',mode:'stay'};};
 function pathAt(p,seconds,speed=SPEED){
  if(!p||!Array.isArray(p.points)||p.points.length<2||p.points.some(q=>!finite(q.x)||!finite(q.z)))
   return {...DEFAULT};
  const points=p.points,legs=[],moveSpeed=finite(speed)&&speed>0?speed:SPEED;
  let total=0;
  // Each leg finishes at a waypoint, where Dax performs its action.
  for(let i=0;i<points.length;i++){
   const from=points[(i+points.length-1)%points.length],to=points[i];
   const travel=distance(from,to)/moveSpeed,hold=finite(to.seconds)&&to.seconds>=0?to.seconds:DEFAULT_SECONDS;
   legs.push({from,to,travel,hold,start:total});total+=travel+hold;
  }
  if(total<=0)return {...DEFAULT};
  let t=((finite(seconds)?seconds:0)%total+total)%total;
  for(const leg of legs){
   if(t<leg.travel){
    const k=leg.travel? t/leg.travel:1;
    return {inside:true,x:leg.from.x+(leg.to.x-leg.from.x)*k,
     z:leg.from.z+(leg.to.z-leg.from.z)*k,yaw:angle(leg.from,leg.to),
     clip:'walk',device:false,place:'Editor route',source:'editor',mode:'path'};
   }
   t-=leg.travel;
   if(t<leg.hold)return {inside:true,x:leg.to.x,z:leg.to.z,
    yaw:finite(leg.to.yaw)?leg.to.yaw:0,clip:normalizedAction(leg.to.action),
    device:false,place:'Editor route',source:'editor',mode:'path'};
   t-=leg.hold;
  }
  return {...DEFAULT};
 }
 function position(plan,seconds=0){
  if(!plan)return {...DEFAULT};
  if(plan.mode==='stay'&&finite(plan.x)&&finite(plan.z))return stay(plan,seconds);
  if(plan.mode==='path')return pathAt(plan,seconds);
  return {...DEFAULT};
 }
 // Editor coordinates use NeoChinatown world metres; Dax's animated actor uses District plan metres.
 // N.toWorld(x,z) = [door.x - x, door.z + 20 - z], so invert once before evaluating.
 function positionWorld(plan,seconds=0,door=null){
  if(!plan)return {...DEFAULT};
  if(plan.area&&plan.area!=='district')return {...DEFAULT};
  const D=door||(node?require('./neochinatown.js'):root.VoidNeoChinatown)?.door;
  if(!D||!finite(D.x)||!finite(D.z))return {...DEFAULT};
  const inv=p=>({x:D.x-p.x,z:D.z+20-p.z,...(finite(p.yaw)?{yaw:p.yaw+Math.PI}:{}) ,
   ...(p.seconds!=null?{seconds:p.seconds}:{}),...(p.action?{action:p.action}:{})});
  if(plan.mode==='stay'&&finite(plan.x)&&finite(plan.z))
   return position({...plan,...inv(plan)},seconds);
  if(plan.mode==='path'&&Array.isArray(plan.points)&&plan.points.every(p=>finite(p.x)&&finite(p.z)))
   return position({...plan,points:plan.points.map(inv)},seconds);
  return {...DEFAULT};
 }
 const api={DEFAULT,SPEED,normalizedAction,pathAt,position,positionWorld};
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.VoidDaxEditorRoutine=api;
})(typeof globalThis!=='undefined'?globalThis:this);
