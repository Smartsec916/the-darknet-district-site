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
  const name=s==='shadow'?'look':s.split('/').pop();
  return ['idle','talk','look','watch','walk','glance-back','shrug'].includes(name)?name:'idle';
 };
 const stay=(p,seconds=0)=>{const actions=Array.isArray(p.actions)&&p.actions.length?p.actions:['idle'];
  const ix=Math.floor(Math.max(0,finite(seconds)?seconds:0)/DEFAULT_SECONDS)%actions.length;
  return {inside:true,x:p.x,z:p.z,yaw:finite(p.yaw)?p.yaw:0,
   clip:normalizedAction(actions[ix]),device:actions[ix]==='shadow',
   place:'Editor location',source:'editor',mode:'stay'};};
 function routeLegs(p,speed=SPEED){
  if(!p||!Array.isArray(p.points)||p.points.length<2||p.points.some(q=>!finite(q.x)||!finite(q.z)))
   return null;
  const points=p.points,legs=[],moveSpeed=finite(speed)&&speed>0?speed:SPEED;
  let total=0;
  // Each leg finishes at a waypoint, where Dax performs its action.
  for(let i=0;i<points.length;i++){
   const from=points[i],to=points[(i+1)%points.length];
   const travel=distance(from,to)/moveSpeed,hold=from.action==='walk-on'?0:finite(from.seconds)&&from.seconds>=0?from.seconds:DEFAULT_SECONDS;
   legs.push({from,to,travel,hold});total+=travel+hold;
  }
  return total>0?{legs,total}:null;
 }
 function pathAt(p,seconds,speed=SPEED,prepared=routeLegs(p,speed)){
  if(!prepared)return {...DEFAULT};
  const {legs,total}=prepared;
  let t=((finite(seconds)?seconds:0)%total+total)%total;
  for(const leg of legs){
   if(t<leg.hold)return {inside:true,x:leg.from.x,z:leg.from.z,
    yaw:finite(leg.from.yaw)?leg.from.yaw:angle(leg.from,leg.to),clip:normalizedAction(leg.from.action),
    device:leg.from.action==='shadow',place:'Editor route',source:'editor',mode:'path'};
   t-=leg.hold;
   if(t<leg.travel){
    const k=leg.travel? t/leg.travel:1;
    return {inside:true,x:leg.from.x+(leg.to.x-leg.from.x)*k,
     z:leg.from.z+(leg.to.z-leg.from.z)*k,yaw:angle(leg.from,leg.to),
     clip:'walk',device:false,place:'Editor route',source:'editor',mode:'path'};
   }
   t-=leg.travel;
  }
  return {...DEFAULT};
 }
 function position(plan,seconds=0){
  if(!plan)return {...DEFAULT};
  if(plan.mode==='stay'&&finite(plan.x)&&finite(plan.z))return stay(plan,seconds);
  if(plan.mode==='path')return pathAt(plan,seconds);
  return {...DEFAULT};
 }
 // Editor coordinates are world metres. Dax's actor uses the District's floor plan.
 function toLocal(plan,door){
  if(!plan||plan.why==='home'||plan.area!=='district'||!door)return null;
  const point=p=>({...p,x:door.x-p.x,z:door.z+20-p.z,...(finite(p.yaw)?{yaw:p.yaw+Math.PI}:{})});
  if(plan.mode==='stay'&&finite(plan.x)&&finite(plan.z))return point(plan);
  if(plan.mode==='path'&&plan.points?.length>=2&&plan.points.every(p=>finite(p.x)&&finite(p.z)))
   return {...plan,points:plan.points.map(point)};
  return null;
 }
 function positionWorld(plan,seconds=0,door=null){
  const D=door||(node?require('./neochinatown.js'):root.VoidNeoChinatown)?.door;
  return position(toLocal(plan,D),seconds);
 }
 const DAY=86400;
 const wrap=(n,m)=>((n%m)+m)%m;
 // A scheduled route completes whole circuits and ends at its first point. The next
 // block can start there even for a client that only just entered the District.
 function allDay(raw,paths,door){
  const plan=toLocal(paths.planNow('dax',{plan:raw}),door);
  const legs=routeLegs(plan);
  return seconds=>legs?pathAt(plan,seconds,SPEED,legs):position(plan,seconds);
 }
 function timeline(raw,paths,door,route){
  const resolved=minute=>paths.planNow('dax',{plan:raw,minute});
  const blocks=raw?.schedule||[],edges=[...new Set(blocks.flatMap(b=>[paths.toMin(b.from),paths.toMin(b.to)]))].filter(Number.isFinite).sort((a,b)=>a-b);
  const parts=edges.map(minute=>({minute,plan:resolved(minute)})).filter(part=>part.plan?.key!==resolved(wrap(part.minute-1,DAY/60))?.key);
  if(!parts.length)return allDay(raw,paths,door);
  const segments=parts.map(({minute,plan},i)=>{
   const end=parts[(i+1)%parts.length].minute*60,start=minute*60;
   return {start,duration:wrap(end-start,DAY)||DAY,plan:toLocal(plan,door)};
  });
  const anchor=plan=>plan?.mode==='path'?plan.points[0]:plan||DEFAULT;
  for(const [i,segment] of segments.entries()){
   const previous=segments[(i+segments.length-1)%segments.length];
   const a=anchor(previous.plan),b=anchor(segment.plan);
   const way=distance(a,b)<.01?[]:route(a,b);
   if(!way)return allDay(raw,paths,door);
   let point=a,time=0;segment.walk=[];
   for(const next of way){
    const duration=distance(point,next)/SPEED;
    if(duration>0)segment.walk.push({a:point,b:next,start:time,duration});
    point=next;time+=duration;
   }
   if(time>segment.duration)return allDay(raw,paths,door);
   segment.travel=time;
   segment.route=routeLegs(segment.plan);
  }
  return seconds=>{
   const time=wrap(seconds,DAY),index=segments.findLastIndex(s=>time>=s.start),i=index<0?segments.length-1:index;
   const segment=segments[i],elapsed=wrap(time-segment.start,DAY);
   const leg=segment.walk.find(l=>elapsed<l.start+l.duration);
   if(leg){const t=(elapsed-leg.start)/leg.duration;
    return {inside:true,x:leg.a.x+(leg.b.x-leg.a.x)*t,z:leg.a.z+(leg.b.z-leg.a.z)*t,
     yaw:angle(leg.a,leg.b),clip:'walk',device:false,place:'Walking to the next scheduled spot',source:'editor',mode:'path'};
   }
   const active=elapsed-segment.travel;
   if(!segment.route)return position(segment.plan,active);
   const limit=Math.floor((segment.duration-segment.travel)/segment.route.total)*segment.route.total;
   if(active<limit)return pathAt(segment.plan,active,SPEED,segment.route);
   const rest=anchor(segment.plan);
   return {...stay({...rest,actions:['idle']}),place:'Editor route',mode:'path'};
  };
 }
 const api={DEFAULT,SPEED,normalizedAction,pathAt,position,positionWorld,timeline};
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.VoidDaxEditorRoutine=api;
})(typeof globalThis!=='undefined'?globalThis:this);
