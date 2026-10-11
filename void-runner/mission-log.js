/* Campaign mission state and navigation. Existing progression flags remain the
   authority for tutorial actions; the log never infers them from later travel. */
(function(root){
 const U=typeof module!=='undefined'?require('./universe.js'):root.VoidUniverse;
 const training=[
  ['receive-gun','Receive Elias’s pistol from Mara'],['move','Move through the workshop'],
  ['sprint','Run'],['jump','Jump'],['groundCombat','Destroy four training cans'],
  ['board','Board the ship'],['throttle','Use throttle and braking'],
  ['steer','Pitch and yaw the ship'],['navigation','Align with a destination'],
  ['jumpTravel','Complete an in-system jump'],['dock','Dock at a station']
 ];
 const trainingIds=training.map(([id])=>id);
 const definitions={
  'flight-training':{title:'BASIC TRAINING',type:'tutorial',description:'Mara’s ground and introductory flight training.',giver:'Mara',source:'story',start:'vesper',end:'meridian',completion:{event:'training-actions'},objectives:training.map(([id,label])=>({id,label}))},
  'meet-rook':{title:'CARGO DELIVERY / MEET ROOK',type:'main',description:'Take the Kestrel to Meridian Station and meet Rook to begin the cargo campaign.',giver:'Mara',source:'story',start:'vesper',end:'meridian',destination:'meridian',interaction:'rook',objectives:[
   {id:'instructions',label:'Receive Mara’s instructions'}, {id:'travel',label:'Travel to Meridian Station'},
   {id:'dock',label:'Dock at Meridian Station'}, {id:'enter',label:'Enter the station'},
   {id:'locate',label:'Locate Rook'}, {id:'speak',label:'Speak with Rook'}]},
  'legal-run':{title:'AN HONEST LIVING',type:'cargo',description:'Deliver water filtration parts to Kepler.',giver:'Rook',destination:'kepler',rewards:350,objectives:[{id:'arrive',label:'Deliver the filters and dock at Kepler'}]},
  'return':{title:'BACK TO THE DEAD CHANNEL',type:'main',description:'Return to Meridian with the completed delivery.',giver:'Rook',destination:'meridian',objectives:[{id:'arrive',label:'Dock at Meridian Station'}]},
  'illegal-run':{title:'NO QUESTIONS ASKED',type:'cargo',description:'Deliver unregistered memory wafers to Undertow.',giver:'Rook',destination:'undertow',rewards:800,objectives:[{id:'arrive',label:'Deliver the wafers and dock at Undertow'}]},
  'meet-admin':{title:'MEET ADMIN',type:'main',description:'Find Rook’s contact in Sacramento.',giver:'Rook',source:'story',start:'meridian',end:'earth',completion:{event:'talk',interaction:'admin'},destination:'earth',interaction:'tdd',objectives:[{id:'meet-admin',label:'Find Admin at The Darknet District, Sacramento'}]}
 };
 const safeId=id=>typeof id==='string'&&/^[a-z][a-z0-9-]{0,79}$/.test(id);
 function define(id,definition){if(!safeId(id)||!definition||!['tutorial','main','side','cargo','campaign','bounty','station'].includes(definition.type)||!Array.isArray(definition.objectives)||!definition.objectives.length||!definition.objectives.every(o=>safeId(o.id)&&typeof o.label==='string'))return false;definitions[id]={...definition,objectives:definition.objectives.map(o=>({...o}))};return true;}
 function records(s){return s.universe.missions??={};}
 function available(s,id){const d=definitions[id];if(!d)return true;const requirements=d.prerequisites||[];return requirements.every(key=>s.universe?.missions?.[key]?.completed===true)&&Object.entries(d.storyFlags||{}).every(([key,value])=>s.story?.flags?.[key]===value)&&Object.entries(d.factionFlags||{}).every(([key,value])=>(s.progression?.reputation?.[key]||0)>=value)&&(!d.availability?.locations||d.availability.locations.includes(s.location));}
 function acquire(s,id){if(!safeId(id)||(!records(s)[id]&&!available(s,id)))return null;const entries=records(s);return entries[id]??={acquired:true,completed:false,objectives:{}};}
 function complete(s,id,objective='arrive',C){
  const definition=description(s,C,id);
  if(id==='flight-training'||!definition.objectives.some(o=>o.id===objective))return false;
  const entry=acquire(s,id);if(!entry)return false;
  if(entry.objectives[objective]===true)return false;
  entry.objectives[objective]=true;
  entry.completed=definition.objectives.filter(o=>o.required!==false).every(o=>entry.objectives[o.id]===true);
  if(entry.completed&&s.universe.trackedMission===id)s.universe.trackedMission=null;
  return true;
 }
 function sync(s,C){
  if(!s?.universe)return [];
  const entries=records(s),p=s.progression;
  if(p&&(p.opening?.pistol||p.personal?.weapon==='ward-pistol'||p.flags?.board||s.quest!=='inheritance')){
   const entry=acquire(s,'flight-training');
   for(const id of trainingIds)entry.objectives[id]=id==='receive-gun'?(p.opening?.pistol===true||p.personal?.weapon==='ward-pistol'):id==='groundCombat'?(p.flags?.groundCombat===true||p.flags?.shootingTutorialComplete===true||p.opening?.cans?.length>=4):p.flags?.[id]===true;
   entry.completed=trainingIds.every(id=>entry.objectives[id]);
  }
  if(p&&(p.flags?.maraShipHandoff||s.quest!=='inheritance')){
   const cargo=acquire(s,'meet-rook');
   cargo.objectives.instructions=true;
   if(s.quest!=='inheritance'&&(s.location==='meridian'||s.quest!=='arrival'))cargo.objectives.travel=true;
   if(s.quest!=='inheritance'&&s.quest!=='arrival')cargo.objectives.dock=true;
   if(s.story?.flags?.rookIntroduced||['legal-run','return','illegal-offer','illegal-run','open'].includes(s.quest)){
    cargo.objectives.enter=true;cargo.objectives.locate=true;cargo.objectives.speak=true;
   }
   cargo.completed=definitions['meet-rook'].objectives.every(o=>cargo.objectives[o.id]);
  }
  const flight=C?.missionFlight?.({...s,destination:null});
  if(flight&&flight.kind!=='transit'&&flight.id!=='prologue-missiles'&&(flight.id||s.quest)!=='arrival')acquire(s,flight.id||s.quest);
  if(s.universe.freeTravel)acquire(s,'meet-admin');
  for(const id of s.universe.completedObjectives||[])if(safeId(id)&&id!=='arrival'){
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
  const contract=(C?.allContracts||C?.contracts)?.find?.(item=>item.id===id);
  const title=isCurrent?f.name:contract?.name||id.replace(/-/g,' ').toUpperCase();
  const destination=isCurrent?f.destination:contract?.destination;
  const cargo=isCurrent?f.cargo:contract?.cargo;
  return {title,type:cargo&&cargo!=='Empty hold'?'cargo':'campaign',description:contract?.briefing||((cargo&&cargo!=='Empty hold')?'Deliver '+cargo+' to '+(U.locations[destination]?.name||destination)+'.':'Travel to '+(U.locations[destination]?.name||destination||'the destination')+'.'),rewards:(isCurrent?f.reward:contract?.reward)||null,destination,source:'mission-terminal',giver:contract?.contact||'Campaign',start:contract?.start||null,end:destination,prerequisites:contract?.requires?[contract.requires]:[],availability:{},storyFlags:{},factionFlags:{},completion:{event:'dock',location:destination},objectives:[{id:'arrive',label:cargo&&cargo!=='Empty hold'?'Deliver '+cargo:'Reach the destination and dock'}]};
 }
 function all(s,C){
  if(!s?.universe)return [];
  return Object.entries(records(s)).filter(([,entry])=>entry?.acquired).map(([id,entry])=>{
   const def=description(s,C,id),objectives=def.objectives.map(objective=>({...objective,complete:entry.objectives?.[objective.id]===true}));
   const complete=entry.completed===true||objectives.filter(objective=>objective.required!==false).every(objective=>objective.complete);
   const destination=id==='flight-training'?C?.missionFlight?.({...s,destination:null})?.destination:id==='meet-rook'&&entry.objectives?.dock?'meridian':def.destination;
   return {id,title:def.title,type:def.type,description:def.description||'',destination,rewards:def.rewards||null,interaction:def.interaction,objectives,objective:objectives.find(objective=>objective.required!==false&&!objective.complete)?.label||'Complete',completed:complete,tracked:s.universe.trackedMission===id};
  });
 }
 function active(s,C){sync(s,C);return all(s,C).filter(mission=>!mission.completed);}
 function tracked(s,C){return active(s,C).find(mission=>mission.tracked)||null;}
 function track(s,id,C){sync(s,C);if(!all(s,C).some(mission=>mission.id===id&&!mission.completed))return false;s.universe.trackedMission=id;s.universe.trackingInitialized=true;return true;}
 function untrack(s){s.universe.trackedMission=null;s.universe.trackingInitialized=true;}
 function guidance(s,mission,inside){if(!mission||mission.completed)return null;
  if(mission.id==='meet-rook'&&inside&&s.location==='meridian')return {kind:'local',label:mission.objective,interaction:mission.interaction};
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
 function metadata(s,C,id){return {availability:{},giver:null,source:null,start:null,end:null,prerequisites:[],storyFlags:{},factionFlags:{},completion:null,...description(s,C,id)};}
 const api={definitions,trainingIds,define,available,metadata,acquire,complete,sync,all,active,tracked,track,untrack,guidance};
 if(typeof module!=='undefined')module.exports=api;else root.VoidMissions=api;
})(globalThis);
