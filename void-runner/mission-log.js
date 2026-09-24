/* Missions derive from existing campaign IDs; tracking never accepts or rewards a job. */
(function(root){
 const U=typeof module!=='undefined'?require('./universe.js'):root.VoidUniverse;
 function active(s,C){const list=[],f=C.missionFlight({...s,destination:null});
  if(f&&f.kind!=='transit')list.push({id:f.id||s.quest,title:f.name,objective:f.cargo==='Empty hold'?'Reach your destination':'Deliver '+f.cargo,destination:f.destination,character:f.destination==='undertow'?'iona':f.destination==='kepler'?'sol':'rook'});
  if(s.universe?.freeTravel&&!s.universe.completedObjectives.includes('meet-admin'))list.push({id:'meet-admin',title:'MEET ADMIN',objective:'Find Admin at The Darknet District, Sacramento',destination:'earth',interaction:'tdd'});
  return list;
 }
 function guidance(s,mission,inside){if(!mission)return null;
  if(inside){if(s.location!==mission.destination)return {kind:'ship',label:'YOUR SHIP / HANGAR',interaction:'board'};return {kind:'local',label:mission.objective,interaction:mission.interaction||mission.character};}
  const hop=U.nextHop(s.location,mission.destination);return {kind:U.route(s.location,hop).kind,label:(U.system(s.location)!==U.system(hop)?'INTERSTELLAR / ':'LOCAL / ')+(U.locations[hop]?.name||hop).toUpperCase(),destination:hop};
 }
 const api={active,guidance};if(typeof module!=='undefined')module.exports=api;else root.VoidMissions=api;
})(globalThis);
