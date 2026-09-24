/* Stable location IDs and route policy shared by campaign, saves and HUD. */
(function(root){
 const progression=typeof module!=='undefined'?require('./progression.js'):root.VoidProgression;
 const systems={erebus:{name:'Erebus System',hub:'meridian',ownerFaction:null,securityFaction:'erebus-local',populationPool:[],shopPool:[],missionPool:[]},sol:{name:'Sol System',hub:'sol-belt',ownerFaction:null,securityFaction:'sol-local',populationPool:[],shopPool:[],missionPool:[]}};
 const locations={
  vesper:{system:'erebus',name:'Vesper',district:'WARD FREIGHT WORKSHOP',color:'#c2a584',bar:'Workshop'},
  meridian:{system:'erebus'},kepler:{system:'erebus'},undertow:{system:'erebus'},foundry:{system:'erebus'},
  'sol-belt':{system:'sol',name:'Sol Belt Anchorage',district:'SOL / ASTEROID BELT',color:'#8dbea9',bar:'Belt Canteen'},
  earth:{system:'sol',name:'Earth / Sacramento',district:'SOL / MUNICIPAL LANDING',color:'#609cb5',bar:'District Approach'},
  mars:{system:'sol',name:'Mars / Underground City',district:'SOL / SUBSURFACE ACCESS',color:'#ba6847',bar:'Transit Canteen'}
 };
 for(const location of Object.values(locations)){location.ownerFaction??=null;location.securityFaction??=location.system==='sol'?'sol-local':'erebus-local';}
 function system(id){return locations[id]?.system||'erebus';}
 function route(a,b){const interstellar=system(a)!==system(b);return {kind:interstellar?'interstellar':'local',seconds:progression.tuning.jump[interstellar?'interstellar':'local'],interdiction:!interstellar};}
 function fresh(){return {currentSystem:'erebus',discoveredSystems:['erebus'],discoveredLocations:['vesper','meridian'],visitedLocations:['vesper'],missionLogUnlocked:false,freeTravel:false,trackedMission:null,completedObjectives:[],station:null};}
 function restore(raw={},state={}){const out={...fresh()},valid=xs=>Array.isArray(xs)?[...new Set(xs.filter(x=>Object.hasOwn(locations,x)))]:[];
  out.currentSystem=system(state.location);out.discoveredLocations=[...new Set([...out.discoveredLocations,...valid(raw.discoveredLocations),state.location].filter(Boolean))];out.visitedLocations=[...new Set([...out.visitedLocations,...valid(raw.visitedLocations),state.location].filter(Boolean))];
  // Earlier saves already received Rook's voucher; migrate its world unlock once.
  out.missionLogUnlocked=raw.missionLogUnlocked===true||state.missileOfferSeen===true;out.freeTravel=state.progression?state.progression.completed===true:out.missionLogUnlocked;
  out.trackedMission=typeof raw.trackedMission==='string'?raw.trackedMission:null;
  out.completedObjectives=Array.isArray(raw.completedObjectives)?raw.completedObjectives.filter(x=>typeof x==='string'&&x.length<80).slice(0,200):[];
  if(state.quest==='open')out.discoveredLocations=[...new Set([...out.discoveredLocations,'kepler','undertow','foundry'])];
  if(out.freeTravel){out.discoveredSystems=['erebus','sol'];out.discoveredLocations=[...new Set([...out.discoveredLocations,'sol-belt','earth','mars'])];}
  if(raw.station?.location===state.location)out.station={location:state.location};return out;
 }
 function unlock(s){s.universe=restore({...s.universe,missionLogUnlocked:true},s);s.universe.trackedMission||='meet-admin';if(s.progression)s.universe.freeTravel=s.progression.completed;}
 function visit(s){const u=s.universe;u.currentSystem=system(s.location);for(const key of ['visitedLocations','discoveredLocations'])if(!u[key].includes(s.location))u[key].push(s.location);u.station={location:s.location};}
 function destinations(s){const u=s.universe||fresh();return u.discoveredLocations.filter(id=>id!==s.location&&(system(id)===system(s.location)||id===systems[system(id)].hub));}
 function nextHop(origin,target){return system(origin)===system(target)?target:systems[system(target)].hub;}
 const api={systems,locations,system,route,fresh,restore,unlock,visit,destinations,nextHop};if(typeof module!=='undefined')module.exports=api;else root.VoidUniverse=api;
})(globalThis);
