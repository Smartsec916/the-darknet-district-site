/* Campaign mission state and navigation. Existing progression flags remain the
   authority for tutorial actions; the log never infers them from later travel. */
(function(root){
 const U=typeof module!=='undefined'?require('./universe.js'):root.VoidUniverse;
 const training=[
  ['throttle','Use the throttle'],['steer','Pitch and yaw the ship'],['roll','Roll the ship'],
  ['navigation','Align with a destination'],['jumpTravel','Complete an in-system jump'],
  ['dock','Dock at a station'],['laserCombat','Fire the ship guns in combat'],
  ['missileLocked','Acquire a missile lock'],['missileFired','Fire a locked missile']
 ];
 const trainingIds=training.map(([id])=>id);
 const definitions={
  'flight-training':{title:'FLIGHT TRAINING',type:'tutorial',objectives:training.map(([id,label])=>({id,label}))},
  'meet-admin':{title:'MEET ADMIN',type:'main',destination:'earth',interaction:'tdd',objectives:[{id:'meet-admin',label:'Find Admin at The Darknet District, Sacramento'}]}
 };
 const safeId=id=>typeof id==='string'&&/^[a-z][a-z0-9-]{0,79}$/.test(id);
 function define(id,definition){if(!safeId(id)||!definition||!['tutorial','main','side','bounty','station'].includes(definition.type)||!Array.isArray(definition.objectives)||!definition.objectives.length||!definition.objectives.every(o=>safeId(o.id)&&typeof o.label==='string'))return false;definitions[id]={...definition,objectives:definition.objectives.map(o=>({...o}))};return true;}
 function records(s){return s.universe.missions??={};}
 function acquire(s,id){if(!safeId(id))return null;const entries=records(s);return entries[id]??={acquired:true,completed:false,objectives:{}};}
 function complete(s,id,objective='arrive',C){
  const entry=acquire(s,id),definition=description(s,C,id);
  if(!entry||id==='flight-training'||!definition.objectives.some(o=>o.id===objective))return false;
  entry.objectives[objective]=true;
  entry.completed=definition.objectives.filter(o=>o.required!==false).every(o=>entry.objectives[o.id]===true);
  if(entry.completed&&s.universe.trackedMission===id)s.universe.trackedMission=null;
  return true;
 }
 function sync(s,C){
  if(!s?.universe)return [];
  const entries=records(s),p=s.progression;
  if(p&&(s.quest!=='inheritance'||p.flags?.board)){
   const entry=acquire(s,'flight-training');
   for(const id of trainingIds)entry.objectives[id]=p.flags?.[id]===true;
   entry.completed=trainingIds.every(id=>entry.objectives[id]);
  }
  const flight=C?.missionFlight?.({...s,destination:null});
  if(flight&&flight.kind!=='transit'&&flight.id!=='prologue-missiles')acquire(s,flight.id||s.quest);
  if(s.universe.freeTravel)acquire(s,'meet-admin');
  for(const id of s.universe.completedObjectives||[])if(safeId(id)){
   const entry=acquire(s,id);entry.completed=true;
   entry.objectives[id==='meet-admin'?'meet-admin':'arrive']=true;
  }
  if(s.universe.trackedMission&&!entries[s.universe.trackedMission]?.acquired)s.universe.trackedMission=null;
  if(s.universe.trackedMission&&entries[s.universe.trackedMission].completed)s.universe.trackedMission=null;
  if(s.universe.trackedMission===null&&entries['flight-training']?.acquired&&!entries['flight-training'].completed&&s.universe.trackingInitialized!==true){
   s.universe.trackedMission='flight-training';
  }
  return all(s,C);
 }
 function description(s,C,id){
  if(definitions[id])return definitions[id];
  const f=C?.missionFlight?.({...s,destination:null});
  const isCurrent=f&&f.kind!=='transit'&&(f.id||s.quest)===id;
  const contract=C?.contracts?.find?.(item=>item.id===id);
  const title=isCurrent?f.name:contract?.name||id.replace(/-/g,' ').toUpperCase();
  const destination=isCurrent?f.destination:contract?.destination;
  const cargo=isCurrent?f.cargo:contract?.cargo;
  return {title,type:'campaign',destination,objectives:[{id:'arrive',label:cargo&&cargo!=='Empty hold'?'Deliver '+cargo:'Reach the destination and dock'}]};
 }
 function all(s,C){
  if(!s?.universe)return [];
  return Object.entries(records(s)).filter(([,entry])=>entry?.acquired).map(([id,entry])=>{
   const def=description(s,C,id),objectives=def.objectives.map(objective=>({...objective,complete:entry.objectives?.[objective.id]===true}));
   const complete=entry.completed===true||objectives.filter(objective=>objective.required!==false).every(objective=>objective.complete);
   const destination=id==='flight-training'?C?.missionFlight?.({...s,destination:null})?.destination:def.destination;
   return {id,title:def.title,type:def.type,destination,interaction:def.interaction,objectives,objective:objectives.find(objective=>objective.required!==false&&!objective.complete)?.label||'Complete',completed:complete,tracked:s.universe.trackedMission===id};
  });
 }
 function active(s,C){sync(s,C);return all(s,C).filter(mission=>!mission.completed);}
 function tracked(s,C){return active(s,C).find(mission=>mission.tracked)||null;}
 function track(s,id,C){sync(s,C);if(!all(s,C).some(mission=>mission.id===id&&!mission.completed))return false;s.universe.trackedMission=id;s.universe.trackingInitialized=true;return true;}
 function untrack(s){s.universe.trackedMission=null;s.universe.trackingInitialized=true;}
 function guidance(s,mission,inside){if(!mission||mission.completed)return null;
  if(mission.id==='flight-training'){
   const pending=mission.objectives.find(objective=>!objective.complete);
   if(!pending)return null;
   if(!['navigation','jumpTravel','dock'].includes(pending.id))return {kind:'instruction',label:pending.label};
   // Current scripted route is the navigable training objective, never proof of a maneuver.
   const destination=s.destination||s.travel?.destination||mission.destination;
   if(!destination)return {kind:'instruction',label:pending.label};
   if(inside)return {kind:'ship',label:pending.label,interaction:'board'};
   const hop=U.nextHop(s.location,destination);
   return {kind:'route',label:pending.label,destination:hop};
  }
  if(!mission.destination)return {kind:'instruction',label:mission.objective};
  if(inside){if(s.location!==mission.destination)return {kind:'ship',label:'YOUR SHIP / HANGAR',interaction:'board'};return {kind:'local',label:mission.objective,interaction:mission.interaction||'rook'};}
  const hop=U.nextHop(s.location,mission.destination);
  return {kind:U.route(s.location,hop).kind,label:(U.system(s.location)!==U.system(hop)?'INTERSTELLAR / ':'LOCAL / ')+(U.locations[hop]?.name||hop).toUpperCase(),destination:hop};
 }
 const api={definitions,trainingIds,define,acquire,complete,sync,all,active,tracked,track,untrack,guidance};
 if(typeof module!=='undefined')module.exports=api;else root.VoidMissions=api;
})(globalThis);
